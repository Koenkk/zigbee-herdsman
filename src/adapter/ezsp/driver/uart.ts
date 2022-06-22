/* istanbul ignore file */
import {EventEmitter} from 'events';
import SerialPort from 'serialport';
import net from 'net';
import SocketPortUtils from '../../socketPortUtils';
import {Deferred} from './utils';
import {Queue, Waitress} from '../../../utils';
import * as consts from './consts';
import {Writer}  from './writer';
import {Parser}  from './parser';
import Debug from "debug";

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
    private resetDeferred: Deferred<void>;
    private portType: 'serial' | 'socket';
    private sendSeq = 0; // next frame number to send
    private recvSeq = 0; // next frame number to receive
    private ackSeq = 0;  // next number after the last accepted frame
    private waitress: Waitress<EZSPPacket, EZSPPacketMatcher>;
    private queue: Queue;

    constructor() {
        super();
        this.initialized = false;
        this.queue = new Queue(8);
        this.waitress = new Waitress<EZSPPacket, EZSPPacketMatcher>(
            this.waitressValidator, this.waitressTimeoutFormatter);
    }

    async connect(path: string, options: Record<string, number|boolean>): Promise<void> {
        this.portType = SocketPortUtils.isTcpPath(path) ? 'socket' : 'serial';
        if (this.portType === 'serial') {
            await this.openSerialPort(path, options);
        } else {
            await this.openSocketPort(path);
        }
    }

    private async openSerialPort(path: string, opt: Record<string, number|boolean>): Promise<void> {
        const options = {
            baudRate: typeof opt.baudRate === 'number' ? opt.baudRate : 115200, 
            rtscts: typeof opt.rtscts === 'boolean' ? opt.rtscts : false,
            autoOpen: false
        };

        debug(`Opening SerialPort with ${path} and ${JSON.stringify(options)}`);
        this.serialPort = new SerialPort(path, options);

        this.writer = new Writer();
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        this.writer.pipe(this.serialPort);

        this.parser = new Parser();
        this.serialPort.pipe(this.parser);
        this.parser.on('parsed', this.onParsed.bind(this));

        return new Promise((resolve, reject): void => {
            this.serialPort.open(async (error): Promise<void> => {
                if (error) {
                    reject(new Error(`Error while opening serialport '${error}'`));
                    this.initialized = false;
                    if (this.serialPort.isOpen) {
                        this.serialPort.close();
                    }
                } else {
                    debug('Serialport opened');
                    this.serialPort.once('close', this.onPortClose.bind(this));
                    this.serialPort.once('error', (error) => {
                        debug(`Serialport error: ${error}`);
                    });
                    // reset
                    await this.reset();
                    this.initialized = true;
                    this.emit('connected');
                    resolve();
                }
            });
        });
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
            this.socketPort.on('connect', function () {
                debug('Socket connected');
            });

            // eslint-disable-next-line
            const self = this;
            this.socketPort.on('ready', async (): Promise<void> => {
                debug('Socket ready');
                // reset
                await this.reset();
                self.initialized = true;
                this.emit('connected');
                resolve();
            });

            this.socketPort.once('close', this.onPortClose.bind(this));

            this.socketPort.on('error', function () {
                debug('Socket error');
                reject(new Error(`Error while opening socket`));
                self.initialized = false;
            });

            this.socketPort.connect(info.port, info.host);
        });
    }

    private onParsed(data: Buffer): void {
        try {
            /* Frame receive handler */
            switch (true) {
            case ((data[0] & 0x80) === 0):
                debug(`<-- DATA (${(data[0] & 0x70) >> 4},`+
                    `${data[0] & 0x07},${(data[0] & 0x08) >> 3}): ${data.toString('hex')}`);
                this.handleDATA(data);
                break;

            case ((data[0] & 0xE0) === 0x80):
                debug(`<-- ACK  (${data[0] & 0x07}): ${data.toString('hex')}`);
                this.handleACK(data[0]);
                break;

            case ((data[0] & 0xE0) === 0xA0):
                debug(`<-- NAK  (${data[0] & 0x07}): ${data.toString('hex')}`);
                this.handleNAK(data[0]);
                break;

            case (data[0] === 0xC0):
                debug(`<-- RST:  ${data.toString('hex')}`);
                break;

            case (data[0] === 0xC1):
                debug(`<-- RSTACK: ${data.toString('hex')}`);
                this.rstack_frame_received(data);
                break;

            case (data[0] === 0xC2):
                debug(`<-- Error: ${data.toString('hex')}`);
                break;
            default:
                debug("UNKNOWN FRAME RECEIVED: %r", data);
            }

        } catch (error) {
            debug(`Error while parsing to ZpiObject '${error.stack}'`);
        }
    }

    private handleDATA(data: Buffer): void {
        /* Data frame receive handler */
        const frmNum = (data[0] & 0x70) >> 4;
        //const ackNum = data[0] & 0x07;
        //const reTx = (data[0] & 0x08) >> 3;
        // if (seq !== this.recvSeq) {
        //     debug('NAK-NAK');
        // }
        this.recvSeq = (frmNum + 1) & 7; // next
        debug(`--> ACK  (${this.recvSeq})`);
        this.writer.sendACK(this.recvSeq);
        this.handleACK(data[0]);
        data = data.slice(1, (-3));
        const frame = this.randomize(data);
        this.emit('received', frame);
    }

    private handleACK(control: number): void {
        /* Handle an acknowledgement frame */
        // next number after the last accepted frame
        this.ackSeq = control & 0x07;
        const handled = this.waitress.resolve({sequence: this.ackSeq});
        if (!handled && this.sendSeq !== this.ackSeq) {
            debug(`Unexpected packet sequence ${this.ackSeq} | ${this.sendSeq}`);
        }
    }

    private handleNAK(control: number): void {
        /* Handle negative acknowledgment frame */
        const nakNum = control & 0x07;
        const handled = this.waitress.reject({sequence: nakNum}, 'Recv NAK frame');
        if (!handled) {
            // send NAK
            debug(`NAK Unexpected packet sequence ${nakNum}`);
        } else {
            debug(`NAK Expected packet sequence ${nakNum}`);
        }
    }

    private rstack_frame_received(data: Buffer): void {
        /* Reset acknowledgement frame receive handler */
        let code;
        this.sendSeq = 0;
        this.recvSeq = 0;
        try {
            code = NcpResetCode[data[2]];
        } catch (e) {
            code = NcpResetCode.ERROR_UNKNOWN_EM3XX_ERROR;
        }
        debug("RSTACK Version: %d Reason: %s frame: %s", data[1], code.toString(), data.toString('hex'));
        if (NcpResetCode[<number>code].toString() !== NcpResetCode.RESET_SOFTWARE.toString()) {
            return;
        }
        if ((!this.resetDeferred)) {
            debug("Reset future is None");
            return;
        }
        this.resetDeferred.resolve();
    }

    private randomize(s: Buffer): Buffer {
        /*XOR s with a pseudo-random sequence for transmission
        Used only in data frames
        */
        let rand = consts.RANDOMIZE_START;
        const out = Buffer.alloc(s.length);
        let outIdx = 0;
        for (const c of s) {
            out.writeUInt8(c ^ rand, outIdx++);
            if ((rand % 2)) {
                rand = ((rand >> 1) ^ consts.RANDOMIZE_SEQ);
            } else {
                rand = (rand >> 1);
            }
        }
        return out;
    }

    async reset(): Promise<void> {
        debug('Uart reseting');
        if ((this.resetDeferred)) {
            throw new TypeError("reset can only be called on a new connection");
        }
        debug(`--> Write reset`);
        this.resetDeferred = new Deferred<void>();
        this.writer.sendReset();
        return this.resetDeferred.promise;
    }

    public close(): Promise<void> {
        return new Promise((resolve, reject): void => {
            if (this.initialized) {
                if (this.portType === 'serial') {
                    this.serialPort.flush((): void => {
                        this.serialPort.close((error): void => {
                            this.initialized = false;
                            error == null ?
                                resolve() :
                                reject(new Error(`Error while closing serialport '${error}'`));
                            this.emit('close');
                        });
                    });
                } else {
                    this.socketPort.destroy();
                    resolve();
                }
            } else {
                resolve();
                this.emit('close');
            }
        });
    }

    private onPortClose(): void {
        debug('Port closed');
        this.resetDeferred = undefined;
        this.initialized = false;
        this.emit('close');
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
            debug(`--> DATA (${seq},${ackSeq},0): ${data.toString('hex')}`);
            const randData = this.randomize(data);
            const waiter = this.waitFor(nextSeq).start();
            this.writer.sendData(randData, seq, 0, ackSeq);
            debug(`-?- waiting (${nextSeq})`);
            return waiter.promise.catch(async () => {
                debug(`-!- break waiting (${nextSeq})`);
                debug(`Can't send DATA frame (${seq},${ackSeq},0): ${data.toString('hex')}`);
                debug(`->> DATA (${seq},${ackSeq},1): ${data.toString('hex')}`);
                const waiter = this.waitFor(nextSeq).start();
                this.writer.sendData(randData, seq, 1, ackSeq);
                debug(`-?- rewaiting (${nextSeq})`);
                return waiter.promise.catch((e) => {
                    debug(`-!- break rewaiting (${nextSeq})`);
                    debug(`Can't resend DATA frame (${seq},${ackSeq},1): ${data.toString('hex')}`);
                    throw new Error(`sendDATA error: ${e}`);
                }).then(()=>{
                    debug(`-+- rewaiting (${nextSeq}) success`);
                });
            }).then(()=>{
                debug(`-+- waiting (${nextSeq}) success`);
            });
        });
    }

    public waitFor(sequence: number, timeout = 1000)
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
