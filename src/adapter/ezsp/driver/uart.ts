/* istanbul ignore file */
import {EventEmitter} from 'events';
import net from 'net';
import {SerialPort} from '../../serialPort';
import SocketPortUtils from '../../socketPortUtils';
import {Queue, Waitress, Wait} from '../../../utils';
import {Writer}  from './writer';
import {Parser}  from './parser';
import {AshFrame} from './frame';
import {AshFrameType} from './consts';
import Debug from "debug";
import {SerialPortOptions} from '../../tstype';

const debug = Debug('zigbee-herdsman:adapter:ezsp:uart');


type EZSPPacket = {
    sequence: number
};

type EZSPPacketMatcher = {
    sequence: number
};


export class SerialDriver extends EventEmitter {
    private serialPort: SerialPort;
    private socketPort: net.Socket;
    private writer: Writer;
    private parser: Parser;
    private initialized: boolean;
    private portType: 'serial' | 'socket';
    private sendSeq = 0; // next frame number to send
    private recvSeq = 0; // next frame number to receive
    private ackSeq = 0;  // next number after the last accepted frame
    private waitress: Waitress<EZSPPacket, EZSPPacketMatcher>;
    private queue: Queue;

    constructor() {
        super();
        this.initialized = false;
        this.queue = new Queue(1);
        this.waitress = new Waitress<EZSPPacket, EZSPPacketMatcher>(
            this.waitressValidator, this.waitressTimeoutFormatter);
    }

    async connect(options: SerialPortOptions): Promise<void> {
        this.portType = SocketPortUtils.isTcpPath(options.path) ? 'socket' : 'serial';
        if (this.portType === 'serial') {
            await this.openSerialPort(options.path, options.baudRate, options.rtscts);
        } else {
            await this.openSocketPort(options.path);
        }
    }

    private async openSerialPort(path: string, baudRate: number, rtscts: boolean): Promise<void> {
        const options = {
            path,
            baudRate: typeof baudRate === 'number' ? baudRate : 115200, 
            rtscts: typeof rtscts === 'boolean' ? rtscts : false,
            autoOpen: false,
            parity: 'none',
            stopBits: 1,
            xon: false,
            xoff: false,
        };

        // enable software flow control if RTS/CTS not enabled in config
        if (!options.rtscts) {
            debug(`RTS/CTS config is off, enabling software flow control.`);
            options.xon = true;
            options.xoff = true;
        }

        debug(`Opening SerialPort with ${JSON.stringify(options)}`);
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        this.serialPort = new SerialPort(options);

        this.writer = new Writer();
        this.writer.pipe(this.serialPort);

        this.parser = new Parser(!options.rtscts);// flag unhandled XON/XOFF in logs if software flow control enabled
        this.serialPort.pipe(this.parser);
        this.parser.on('parsed', this.onParsed.bind(this));

        try {
            await this.serialPort.asyncOpen();
            debug('Serialport opened');

            this.serialPort.once('close', this.onPortClose.bind(this));
            this.serialPort.on('error', this.onPortError.bind(this));

            // reset
            await this.reset();

            this.initialized = true;
        } catch (error) {
            this.initialized = false;

            if (this.serialPort.isOpen) {
                this.serialPort.close();
            }

            throw error;
        }
    }

    private async openSocketPort(path: string): Promise<void> {
        const info = SocketPortUtils.parseTcpPath(path);
        debug(`Opening TCP socket with ${info.host}:${info.port}`);

        this.socketPort = new net.Socket();
        this.socketPort.setNoDelay(true);
        this.socketPort.setKeepAlive(true, 15000);

        this.writer = new Writer();
        this.writer.pipe(this.socketPort);

        this.parser = new Parser();
        this.socketPort.pipe(this.parser);
        this.parser.on('parsed', this.onParsed.bind(this));

        return new Promise((resolve, reject): void => {
            const openError = (err: Error): void => {
                this.initialized = false;

                reject(err);
            };

            this.socketPort.on('connect', () => {
                debug('Socket connected');
            });
            this.socketPort.on('ready', async (): Promise<void> => {
                debug('Socket ready');
                this.socketPort.removeListener('error', openError);
                this.socketPort.once('close', this.onPortClose.bind(this));
                this.socketPort.on('error', this.onPortError.bind(this));

                // reset
                await this.reset();

                this.initialized = true;

                resolve();
            });
            this.socketPort.once('error', openError);

            this.socketPort.connect(info.port, info.host);
        });
    }

    private async onParsed(frame: AshFrame): Promise<void> {
        try {
            frame.checkCRC();
        } catch (error) {
            debug(error);

            this.writer.sendNAK(this.recvSeq);
            // skip handler
            return;
        }

        try {
            /* Frame receive handler */
            switch (frame.type) {
            case AshFrameType.DATA:
                this.handleDATA(frame);
                break;
            case AshFrameType.ACK:
                this.handleACK(frame);
                break;
            case AshFrameType.NAK:
                this.handleNAK(frame);
                break;
            // case AshFrameType.RST:// This is Host ==> NCP only.
            //     break;
            case AshFrameType.RSTACK:
                this.handleRSTACK(frame);
                break;
            case AshFrameType.ERROR:
                await this.handleERROR(frame);
                break;
            case AshFrameType.INVALID:
                debug(`<-- INVALID ASH Frame received, illegal control or length [${frame.toString()}]`);
                break;
            default:
                debug(`UNKNOWN FRAME RECEIVED [${frame.toString()}]`);
            }

        } catch (error) {
            debug(`Error while handling AshFrame '${error.stack}'`);
        }
    }

    /**
     * DATA Frame: Carries all EZSP frames.
     * @param frame 
     * @returns 
     */
    private handleDATA(frame: AshFrame): void {
        debug(`<-- DATA (${frame.frameNum},${frame.ackNum},${frame.rFlag}): ${frame}`);

        this.recvSeq = frame.nextAckNum;

        this.writer.sendACK(this.recvSeq);

        const handled = this.handleACK(frame);

        if (frame.rFlag && !handled) {
            // if the packet is resent and did not expect it, then will skip it - already processed it earlier
            debug(`Skipping the packet as repeated (${this.recvSeq})`);

            return;
        }

        // skip control byte, and take out flag, crc low, crc high from end
        const data = frame.buffer.subarray(1, -3);

        this.emit('received', AshFrame.makeRandomizedBuffer(data));
    }

    /**
     * ACK: Frame: Acknowledges receipt of a valid DATA frame.
     * @param frame 
     * @returns 
     */
    private handleACK(frame: AshFrame): boolean {
        // next number after the last accepted frame
        this.ackSeq = frame.ackNum;

        debug(`<-- ACK (${this.ackSeq}): ${frame}`);

        const handled = this.waitress.resolve({sequence: this.ackSeq});

        if (!handled && this.sendSeq !== this.ackSeq) {
            debug(`<-- ACK Out of sequence; got ${this.ackSeq}, expected ${this.sendSeq}`);
        }

        return handled;
    }

    /**
     * NAK Frame: Indicates receipt of a DATA frame with an error or that was discarded due to lack of memory.
     * @param frame 
     */
    private handleNAK(frame: AshFrame): void {
        debug(`<-- NAK (${frame.ackNum}): ${frame}`);

        const handled = this.waitress.reject({sequence: frame.ackNum}, 'Received NAK frame');

        if (!handled) {
            debug(`<-- NAK Out of sequence ${frame.ackNum}`);
        }
    }

    /**
     * RSTACK Frame: Informs the Host that the NCP has reset and the reason for the reset.
     * @param frame 
     * @returns 
     */
    private handleRSTACK(frame: AshFrame): void {
        this.sendSeq = 0;
        this.recvSeq = 0;

        debug(`<-- RSTACK Version: ${frame.ashVersion} Reason: ${frame.resetCodeString} Frame: ${frame}`);

        if (!frame.isRSTACKResetSoftware()) {
            return;
        }

        this.waitress.resolve({sequence: -1});
    }

    /**
     * ERROR Frame: Informs the Host that the NCP detected a fatal error and is in the FAILED state.
     * After receiving this, NCP won't respond to anything but a RST frame (or asserted nRESET pin).
     * @param frame 
     */
    private async handleERROR(frame: AshFrame): Promise<void> {
        debug(`<-- ERROR Version: ${frame.ashVersion} Code: ${frame.errorCode} Frame: ${frame}`);
        console.log(`[NCP ERROR] ${frame.errorCode}. Trying to reset...`);
        await this.reset();
    }

    async reset(): Promise<void> {
        debug('Uart reseting');
        this.parser.reset();
        this.queue.clear();

        return this.queue.execute<void>(async (): Promise<void> => {
            try {
                const waiter = this.waitFor(-1, 10000);

                this.writer.sendReset();

                debug(`-?- RST waiting`);
                await waiter.start().promise;
                debug(`-+- RST waiting success`);
            } catch (e) {
                debug(`--> RST error: ${e}`);

                this.emit('reset');

                throw new Error(`RST error: ${e}`);
            }
        });
    }

    public async close(emitClose: boolean): Promise<void> {
        debug('Closing UART');
        this.queue.clear();

        if (this.initialized) {
            this.initialized = false;

            if (this.portType === 'serial') {
                try {
                    await this.serialPort.asyncFlushAndClose();
                } catch (error) {
                    if (emitClose) {
                        this.emit('close');
                    }

                    throw error;
                }
            } else {
                this.socketPort.destroy();
            }
        }

        if (emitClose) {
            this.emit('close');
        }
    }

    private onPortError(error: Error): void {
        debug(`Port error: ${error}`);
    }

    private onPortClose(err: boolean | Error): void {
        debug(`Port closed. Error? ${err}`);

        // on error: serialport passes an Error object (in case of disconnect)
        //           net.Socket passes a boolean (in case of a transmission error)
        // try to reset instead of failing immediately
        if (err != null && err !== false) {
            this.emit('reset');
        } else {
            this.initialized = false;
            this.emit('close');
        }
    }

    public isInitialized(): boolean {
        return this.initialized;
    }

    public async sendDATA(data: Buffer): Promise<void> {
        const seq = this.sendSeq;
        this.sendSeq = ((seq + 1) % 8);  // next
        const nextSeq = this.sendSeq;
        const ackSeq = this.recvSeq;

        return this.queue.execute<void>(async (): Promise<void> => {
            const randData = AshFrame.makeRandomizedBuffer(data);

            try {
                const waiter = this.waitFor(nextSeq);

                this.writer.sendData(randData, seq, 0, ackSeq);
                debug(`-?- DATA waiting for NextSeq=${nextSeq}`);
                await waiter.start().promise;
                debug(`-+- DATA waiting success for NextSeq=${nextSeq}`);
            } catch (e1) {
                debug(`--> DATA Seq=${seq}, ACKSeq=${ackSeq} ReTx=0; Error ${e1}; data: ${data.toString('hex')}`);

                try {
                    await Wait(800);// cooldown
                    const waiter = this.waitFor(nextSeq);

                    this.writer.sendData(randData, seq, 1, ackSeq);
                    debug(`-?- DATA rewaiting for NextSeq=${nextSeq}`);
                    await waiter.start().promise;
                    debug(`-+- DATA rewaiting success for NextSeq=${nextSeq}`);
                } catch (e2) {
                    debug(`--> DATA Seq=${seq}, ACKSeq=${ackSeq} ReTx=1; Error ${e2}; data: ${data.toString('hex')}`);

                    this.emit('reset');

                    throw new Error(`sendDATA error: try 1: ${e1}, try 2: ${e2}`);
                }
            }
        });
    }

    public waitFor(sequence: number, timeout = 2000)
        : { start: () => { promise: Promise<EZSPPacket>; ID: number }; ID: number } {
        return this.waitress.waitFor({sequence}, timeout);
    }

    private waitressTimeoutFormatter(matcher: EZSPPacketMatcher, timeout: number): string {
        return `${JSON.stringify(matcher)} after ${timeout}ms`;
    }

    private waitressValidator(payload: EZSPPacket, matcher: EZSPPacketMatcher): boolean {
        return (payload.sequence === matcher.sequence);
    }
}
