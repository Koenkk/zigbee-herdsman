/* istanbul ignore file */
import {EventEmitter} from 'events';
import net from 'net';
import {SerialPort} from '../../serialPort';
import SocketPortUtils from '../../socketPortUtils';
import {Queue, Waitress, Wait} from '../../../utils';
import {Writer}  from './writer';
import {Parser}  from './parser';
import {Frame as NpiFrame, FrameType} from './frame';
import Debug from "debug";
import {SerialPortOptions} from '../../tstype';

const debug = Debug('zigbee-herdsman:adapter:ezsp:uart');


enum NcpResetCode {
    RESET_UNKNOWN_REASON = 0x00,
    RESET_EXTERNAL = 0x01,
    RESET_POWER_ON = 0x02,
    RESET_WATCHDOG = 0x03,
    RESET_ASSERT = 0x06,
    RESET_BOOTLOADER = 0x09,
    RESET_SOFTWARE = 0x0B,
    ERROR_EXCEEDED_MAXIMUM_ACK_TIMEOUT_COUNT = 0x51,
    ERROR_UNKNOWN_EM3XX_ERROR = 0x80,
}

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
    private recvReject = false;
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

    private async onParsed(frame: NpiFrame): Promise<void> {
        try {
            frame.checkCRC();
        } catch (error) {
            debug(error);

            // send NAK
            this.writer.sendNAK(this.recvSeq);
            // skip handler
            return;
        }

        try {
            /* Frame receive handler */
            switch (frame.type) {
            case FrameType.DATA:
                this.handleDATA(frame);
                break;
            case FrameType.ACK:
                this.handleACK(frame);
                break;
            case FrameType.NAK:
                this.handleNAK(frame);
                break;
            case FrameType.RST:
                this.handleRST(frame);
                break;
            case FrameType.RSTACK:
                this.handleRSTACK(frame);
                break;
            case FrameType.ERROR:
                await this.handleError(frame);
                break;
            default:
                debug(`UNKNOWN FRAME RECEIVED: ${frame}`);
            }

        } catch (error) {
            debug(`Error while parsing to NpiFrame '${error.stack}'`);
        }
    }

    private handleDATA(frame: NpiFrame): void {
        /* Data frame receive handler */
        const frmNum = (frame.control & 0x70) >> 4;
        const reTx = (frame.control & 0x08) >> 3;

        debug(`<-- DATA (${frmNum},${frame.control & 0x07},${reTx}): ${frame}`);

        if(this.recvSeq != frmNum){
            if(reTx || this.recvReject){
                debug(`Unexpected DATA packet sequence ${frmNum} | ${this.sendSeq} : rejecting packet`);
            }
            else {
              debug(`Unexpected DATA packet sequence ${frmNum} | ${this.sendSeq} : Sending NAK & & rejecting packet`);
              this.writer.sendNAK(this.recvSeq);
              this.recvReject=true;
            }
            return;
        }
        else{
            if (!reTx && this.recvReject){
                 debug(`DATA packet sequence ${frmNum} : clear reject`);
                 this.recvReject=false;
            }
        }

        this.recvSeq = (frmNum + 1) & 7; // next

        debug(`--> ACK  (${this.recvSeq})`);

        this.writer.sendACK(this.recvSeq);

        const handled = this.handleACK(frame);

        if (reTx && !handled) {
            // if the package is resent and did not expect it, 
            // then will skip it - already processed it earlier
            debug(`Skipping the packet as repeated (${this.recvSeq})`);

            return;
        }

        const data = frame.buffer.subarray(1, -3);

        this.emit('received', NpiFrame.makeRandomizedBuffer(data));
    }

    private handleACK(frame: NpiFrame): boolean {
        /* Handle an acknowledgement frame */
        // next number after the last accepted frame
        this.ackSeq = frame.control & 0x07;

        debug(`<-- ACK (${this.ackSeq}): ${frame}`);

        const handled = this.waitress.resolve({sequence: this.ackSeq});

        if (!handled && this.sendSeq !== this.ackSeq) {
            debug(`Unexpected packet sequence ${this.ackSeq} | ${this.sendSeq}`);
        }

        return handled;
    }

    private handleNAK(frame: NpiFrame): void {
        /* Handle negative acknowledgment frame */
        const nakNum = frame.control & 0x07;

        debug(`<-- NAK (${nakNum}): ${frame}`);

        const handled = this.waitress.reject({sequence: nakNum}, 'Recv NAK frame');

        if (!handled) {
            // send NAK
            debug(`NAK Unexpected packet sequence ${nakNum}`);
        } else {
            debug(`NAK Expected packet sequence ${nakNum}`);
        }
    }

    private handleRST(frame: NpiFrame): void {
        debug(`<-- RST:  ${frame}`);
    }

    private handleRSTACK(frame: NpiFrame): void {
        /* Reset acknowledgement frame receive handler */
        let code;
        this.sendSeq = 0;
        this.recvSeq = 0;
        this.recvReject = false;

        debug(`<-- RSTACK ${frame}`);

        try {
            code = NcpResetCode[frame.buffer[2]];
        } catch (e) {
            code = NcpResetCode.ERROR_UNKNOWN_EM3XX_ERROR;
        }

        debug(`RSTACK Version: ${frame.buffer[1]} Reason: ${code.toString()} frame: ${frame}`);

        if (NcpResetCode[<number>code].toString() !== NcpResetCode.RESET_SOFTWARE.toString()) {
            return;
        }

        this.waitress.resolve({sequence: -1});
    }

    private async handleError(frame: NpiFrame): Promise<void> {
        debug(`<-- Error ${frame}`);

        try {
            // send reset
            await this.reset();
        } catch (error) {
            debug(`Failed to reset on Error Frame: ${error}`);
        }
    }

    async reset(): Promise<void> {
        debug('Uart reseting');
        this.parser.reset();
        this.queue.clear();

        return this.queue.execute<void>(async (): Promise<void> => {
            try {
                debug(`--> Write reset`);
                const waiter = this.waitFor(-1, 10000);

                this.writer.sendReset();
                debug(`-?- waiting reset`);
                await waiter.start().promise;
                debug(`-+- waiting reset success`);
            } catch (e) {
                debug(`--> Error: ${e}`);

                this.emit('reset');

                throw new Error(`Reset error: ${e}`);
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
            const randData = NpiFrame.makeRandomizedBuffer(data);

            try {
                const waiter = this.waitFor(nextSeq);
                debug(`--> DATA (${seq},${ackSeq},0): ${data.toString('hex')}`);
                this.writer.sendData(randData, seq, 0, ackSeq);
                debug(`-?- waiting (${nextSeq})`);
                await waiter.start().promise;
                debug(`-+- waiting (${nextSeq}) success`);
            } catch (e1) {
                debug(`--> Error: ${e1}`);
                debug(`-!- break waiting (${nextSeq})`);
                debug(`Can't send DATA frame (${seq},${ackSeq},0): ${data.toString('hex')}`);

                try {
                    await Wait(500);
                    const waiter = this.waitFor(nextSeq);
                    debug(`->> DATA (${seq},${ackSeq},1): ${data.toString('hex')}`);
                    this.writer.sendData(randData, seq, 1, ackSeq);
                    debug(`-?- rewaiting (${nextSeq})`);
                    await waiter.start().promise;
                    debug(`-+- rewaiting (${nextSeq}) success`);
                } catch (e2) {
                    debug(`--> Error: ${e2}`);
                    debug(`-!- break rewaiting (${nextSeq})`);
                    debug(`Can't resend DATA frame (${seq},${ackSeq},1): ${data.toString('hex')}`);

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
