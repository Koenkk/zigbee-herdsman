/* istanbul ignore file */
import {EventEmitter} from 'events';
import SerialPort from 'serialport';
import net from 'net';
import SocketPortUtils from '../../socketPortUtils';
import {Deferred, crc16ccitt} from './utils';
import * as stream from 'stream';
import {Queue, Waitress} from '../../../utils';
import Debug from "debug";

const debug = Debug('zigbee-herdsman:adapter:ezsp:uart');


const FLAG = 0x7E;  // Marks end of frame
const ESCAPE = 0x7D;  // Indicates that the following byte is escaped
const CANCEL = 0x1A;  // Terminates a frame in progress
const XON = 0x11;  // Resume transmission
const XOFF = 0x13;  // Stop transmission
const SUBSTITUTE = 0x18;  // Replaces a byte received with a low-level communication error
const STUFF = 0x20;
const RESERVED = [FLAG, ESCAPE, XON, XOFF, SUBSTITUTE, CANCEL];
const RANDOMIZE_START = 0x42;
const RANDOMIZE_SEQ = 0xB8;


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


class Parser extends stream.Transform {
    private buffer: Buffer;

    public constructor() {
        super();
        this.buffer = Buffer.from([]);
    }

    public _transform(chunk: Buffer, _: string, cb: () => void): void {
        //debug(`<-- [${[...chunk]}]`);
        if (chunk.indexOf(CANCEL) >= 0) {
            this.buffer = Buffer.from([]);
            chunk = chunk.slice((chunk.lastIndexOf(CANCEL) + 1));
        }
        if (chunk.indexOf(SUBSTITUTE) >= 0) {
            this.buffer = Buffer.from([]);
            chunk = chunk.slice((chunk.indexOf(FLAG) + 1));
        }
        this.buffer = Buffer.concat([this.buffer, chunk]);
        this.parseNext();
        cb();
    }

    private parseNext(): void {
        //debug(`--- parseNext [${[...this.buffer]}]`);
        if (this.buffer.length && this.buffer.indexOf(FLAG) >= 0) {
            debug(`<-- [${this.buffer.toString('hex')}] [${[...this.buffer]}]`);
            try {
                const frame = this.extract_frame();
                if (frame) {
                    this.emit('parsed', frame);
                }
            } catch (error) {
                debug(`<-- error ${error.stack}`);
            }
            this.parseNext();
        }
    }

    private extract_frame(): Buffer {
        /* Extract a frame from the data buffer */
        const place = this.buffer.indexOf(FLAG);
        if (place >= 0) {
            // todo: check crc data
            const result = this.unstuff(this.buffer.slice(0, (place + 1)));
            this.buffer = this.buffer.slice((place + 1));
            return result;
        } else {
            return null;
        }
    }

    private unstuff(s: Buffer): Buffer {
        /* Unstuff (unescape) a string after receipt */
        let escaped = false;
        const out = Buffer.alloc(s.length);
        let outIdx = 0;
        for (let idx = 0; idx < s.length; idx += 1) {
            const c = s[idx];
            if (escaped) {
                out.writeUInt8(c ^ STUFF, outIdx++);
                escaped = false;
            } else {
                if ((c === ESCAPE)) {
                    escaped = true;
                } else {
                    out.writeUInt8(c, outIdx++);
                }
            }
        }
        return out;
    }
}

class Writer extends stream.Readable {
    public writeBuffer(buffer: Buffer): void {
        debug(`--> [${buffer.toString('hex')}] [${[...buffer]}]`);
        this.push(buffer);
    }

    public _read(): void {
    }

    public stuff(s: Iterable<number>): Buffer {
        /* Byte stuff (escape) a string for transmission */
        const out = Buffer.alloc(256);
        let outIdx = 0;
        for (const c of s) {
            if (RESERVED.includes(c)) {
                out.writeUInt8(ESCAPE, outIdx++);
                out.writeUInt8(c ^ STUFF, outIdx++);
            } else {
                out.writeUInt8(c, outIdx++);
            }
        }
        return out.slice(0, outIdx);
    }
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
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any*/
    private resetDeferred: Deferred<any>;
    private portType: 'serial' | 'socket';
    private sendSeq = 0; // next frame number to send
    private recvSeq = 0; // next frame number to receive
    private ackSeq = 0;  // next number after the last accepted frame
    private waitress: Waitress<EZSPPacket, EZSPPacketMatcher>;
    private queue: Queue;

    constructor() {
        super();
        this.initialized = false;
        this.queue = new Queue();
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
                debug(`Recv DATA frame (${(data[0] & 0x70) >> 4},`+
                    `${data[0] & 0x07},${(data[0] & 0x08) >> 3}): ${data.toString('hex')}`);
                this.handleDATA(data);
                break;

            case ((data[0] & 0xE0) === 0x80):
                debug(`Recv ACK  frame (${data[0] & 0x07}): ${data.toString('hex')}`);
                this.handleACK(data[0]);
                break;

            case ((data[0] & 0xE0) === 0xA0):
                debug(`Recv NAK  frame (${data[0] & 0x07}): ${data.toString('hex')}`);
                this.handleNAK(data[0]);
                break;

            case (data[0] === 0xC0):
                debug(`Recv RST  frame: ${data.toString('hex')}`);
                break;

            case (data[0] === 0xC1):
                debug(`RSTACK frame: ${data.toString('hex')}`);
                this.rstack_frame_received(data);
                break;

            case (data[0] === 0xC2):
                debug(`Error frame : ${data.toString('hex')}`);
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
        this.sendACK(this.recvSeq);
        this.handleACK(data[0]);
        data = data.slice(1, (-3));
        const frame = this.randomize(data);
        this.emit('received', frame);
    }

    private handleACK(control: number): void {
        /* Handle an acknowledgement frame */
        // next number after the last accepted frame
        this.ackSeq = control & 0x07;
        // const handled = this.waitress.resolve({sequence: this.ackSeq});
        // if (!handled) {
        //     debug(`Unexpected packet sequence ${this.ackSeq}`);
        // } else {
        //     debug(`Expected packet sequence ${this.ackSeq}`);
        // }
        // var ack, pending;
        // ack = (((control & 7) - 1) % 8);
        // if ((ack === this._pending[0])) {
        //     [pending, this._pending] = [this._pending, [(- 1), null]];
        //     pending[1].set_result(true);
        // }
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
        // if ((nak === this._pending[0])) {
        //     this._pending[1].set_result(false);
        // }
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
        /* eslint-disable-next-line @typescript-eslint/no-explicit-any*/
        if (NcpResetCode[<any>code].toString() !== NcpResetCode.RESET_SOFTWARE.toString()) {
            return;
        }
        if ((!this.resetDeferred)) {
            debug("Reset future is None");
            return;
        }
        this.resetDeferred.resolve(true);
    }

    private make_frame(control: ArrayLike<number>, data?: ArrayLike<number>): Buffer {
        /* Construct a frame */
        const ctrlArr: Array<number> = Array.from(control);
        const dataArr: Array<number> = (data && Array.from(data)) || [];

        const sum = ctrlArr.concat(dataArr);

        const crc = crc16ccitt(Buffer.from(sum), 65535);
        const crcArr = [(crc >> 8), (crc % 256)];
        return Buffer.concat([this.writer.stuff(sum.concat(crcArr)), Buffer.from([FLAG])]);
    }

    private randomize(s: Buffer): Buffer {
        /*XOR s with a pseudo-random sequence for transmission
        Used only in data frames
        */
        let rand = RANDOMIZE_START;
        const out = Buffer.alloc(s.length);
        let outIdx = 0;
        for (const c of s) {
            out.writeUInt8(c ^ rand, outIdx++);
            if ((rand % 2)) {
                rand = ((rand >> 1) ^ RANDOMIZE_SEQ);
            } else {
                rand = (rand >> 1);
            }
        }
        return out;
    }

    private makeDataFrame(data: Buffer, seq: number, rxmit: number, ackSeq: number): Buffer {
        /* Construct a data frame */
        const control = (((seq << 4) | (rxmit << 3)) | ackSeq);
        return this.make_frame([control], this.randomize(data));
    }

    async reset(): Promise<void> {
        // return this._gw.reset();
        debug('uart reseting');
        if ((this.resetDeferred)) {
            throw new TypeError("reset can only be called on a new connection");
        }
        /* Construct a reset frame */
        const rst_frame = Buffer.concat([Buffer.from([CANCEL]), this.make_frame([0xC0])]);
        debug(`Write reset`);
        this.resetDeferred = new Deferred<void>();
        this.writer.writeBuffer(rst_frame);
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

    private sendACK(ackNum: number): void {
        /* Construct a acknowledgement frame */
        const ackFrame = this.make_frame([(0b10000000 | ackNum)]);
        debug(`Send ACK  frame (${ackNum})`);
        this.writer.writeBuffer(ackFrame);
    }

    public async sendDATA(data: Buffer): Promise<void> {
        const seq = this.sendSeq;
        this.sendSeq = ((seq + 1) % 8);  // next
        const nextSeq = this.sendSeq;
        const ackSeq = this.recvSeq;
        let pack;

        return this.queue.execute<void>(async (): Promise<void> => {
            debug(`Send DATA frame (${seq},${ackSeq},0): ${data.toString('hex')}`);
            pack = this.makeDataFrame(data, seq, 0, ackSeq);
            // const waiter = this.waitFor(nextSeq).start();
            debug(`waiting (${nextSeq})`);
            this.writer.writeBuffer(pack);
            // await waiter.promise.catch(async () => {
            //     debug(`break waiting (${nextSeq})`);
            //     debug(`Can't send DATA frame (${seq},${ackSeq},0): ${data.toString('hex')}`);
            //     debug(`Resend DATA frame (${seq},${ackSeq},1): ${data.toString('hex')}`);
            //     pack = this.makeDataFrame(data, seq, 1, ackSeq);
            //     const waiter = this.waitFor(nextSeq).start();
            //     debug(`rewaiting (${nextSeq})`);
            //     this.writer.writeBuffer(pack);
            //     await waiter.promise.catch((e) => {
            //         debug(`break rewaiting (${nextSeq})`);
            //         debug(`Can't resend DATA frame (${seq},${ackSeq},1): ${data.toString('hex')}`);
            //         throw new Error(`sendDATA error: ${e}`);
            //     });
            //     debug(`rewaiting (${nextSeq}) success`);
            // });
            debug(`waiting (${nextSeq}) success`);
        });


        // try {
        //     debug(`Send DATA frame (${seq},${this.recvSeq},0): ${data.toString('hex')}`);
        //     pack = this.data_frame(data, seq, 0);
        //     this.writer.writeBuffer(pack);
        // } catch (e) {
        //     debug(`Send DATA frame (${seq},${this.recvSeq},1): ${data.toString('hex')}`);
        //     pack = this.data_frame(data, seq, 1);
        //     this.writer.writeBuffer(pack);
        // }
    }

    public waitFor(sequence: number, timeout = 10000)
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
