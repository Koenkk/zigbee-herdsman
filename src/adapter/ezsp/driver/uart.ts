/* v8 ignore start */

import {EventEmitter} from 'node:events';
import net from 'node:net';

import {Queue, wait, Waitress} from '../../../utils';
import {logger} from '../../../utils/logger';
import {SerialPort} from '../../serialPort';
import SocketPortUtils from '../../socketPortUtils';
import {SerialPortOptions} from '../../tstype';
import {FrameType, Frame as NpiFrame} from './frame';
import {Parser} from './parser';
import {Writer} from './writer';

const NS = 'zh:ezsp:uart';

enum NcpResetCode {
    RESET_UNKNOWN_REASON = 0x00,
    RESET_EXTERNAL = 0x01,
    RESET_POWER_ON = 0x02,
    RESET_WATCHDOG = 0x03,
    RESET_ASSERT = 0x06,
    RESET_BOOTLOADER = 0x09,
    RESET_SOFTWARE = 0x0b,
    ERROR_EXCEEDED_MAXIMUM_ACK_TIMEOUT_COUNT = 0x51,
    ERROR_UNKNOWN_EM3XX_ERROR = 0x80,
}

type EZSPPacket = {
    sequence: number;
};

type EZSPPacketMatcher = {
    sequence: number;
};

export class SerialDriver extends EventEmitter {
    private serialPort?: SerialPort;
    private socketPort?: net.Socket;
    private writer: Writer;
    private parser: Parser;
    private initialized: boolean;
    private sendSeq = 0; // next frame number to send
    private recvSeq = 0; // next frame number to receive
    private ackSeq = 0; // next number after the last accepted frame
    private rejectCondition = false;
    private waitress: Waitress<EZSPPacket, EZSPPacketMatcher>;
    private queue: Queue;

    constructor() {
        super();
        this.initialized = false;
        this.queue = new Queue(1);
        this.waitress = new Waitress<EZSPPacket, EZSPPacketMatcher>(this.waitressValidator, this.waitressTimeoutFormatter);
        this.writer = new Writer();
        this.parser = new Parser();
    }

    async connect(options: SerialPortOptions): Promise<void> {
        if (SocketPortUtils.isTcpPath(options.path!)) {
            await this.openSocketPort(options.path!);
        } else {
            await this.openSerialPort(options.path!, options.baudRate!, options.rtscts!);
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
            logger.debug(`RTS/CTS config is off, enabling software flow control.`, NS);
            options.xon = true;
            options.xoff = true;
        }

        logger.debug(`Opening SerialPort with ${JSON.stringify(options)}`, NS);
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        this.serialPort = new SerialPort(options);

        this.writer.pipe(this.serialPort);

        this.serialPort.pipe(this.parser);
        this.parser.on('parsed', this.onParsed.bind(this));

        try {
            await this.serialPort.asyncOpen();
            logger.debug('Serialport opened', NS);

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
        logger.debug(`Opening TCP socket with ${info.host}:${info.port}`, NS);

        this.socketPort = new net.Socket();
        this.socketPort.setNoDelay(true);
        this.socketPort.setKeepAlive(true, 15000);

        this.writer.pipe(this.socketPort);

        this.socketPort.pipe(this.parser);
        this.parser.on('parsed', this.onParsed.bind(this));

        return await new Promise((resolve, reject): void => {
            const openError = (err: Error): void => {
                this.initialized = false;

                reject(err);
            };

            this.socketPort!.on('connect', () => {
                logger.debug('Socket connected', NS);
            });
            this.socketPort!.on('ready', async (): Promise<void> => {
                logger.debug('Socket ready', NS);
                this.socketPort!.removeListener('error', openError);
                this.socketPort!.once('close', this.onPortClose.bind(this));
                this.socketPort!.on('error', this.onPortError.bind(this));

                // reset
                await this.reset();

                this.initialized = true;

                resolve();
            });
            this.socketPort!.once('error', openError);

            this.socketPort!.connect(info.port, info.host);
        });
    }

    private async onParsed(frame: NpiFrame): Promise<void> {
        const rejectCondition = this.rejectCondition;
        try {
            frame.checkCRC();

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
                    this.rejectCondition = true;
                    logger.debug(`UNKNOWN FRAME RECEIVED: ${frame}`, NS);
            }
        } catch (error) {
            this.rejectCondition = true;
            logger.error(`Error while parsing to NpiFrame '${error}'`, NS);
            logger.debug((error as Error).stack!, NS);
        }

        // We send NAK only if the rejectCondition was set in the current processing
        if (!rejectCondition && this.rejectCondition) {
            // send NAK
            this.writer.sendNAK(this.recvSeq);
        }
    }

    private handleDATA(frame: NpiFrame): void {
        /* Data frame receive handler */
        const frmNum = (frame.control & 0x70) >> 4;
        const reTx = (frame.control & 0x08) >> 3;

        logger.debug(`<-- DATA (${frmNum},${frame.control & 0x07},${reTx}): ${frame}`, NS);

        // Expected package {recvSeq}, but received {frmNum}
        // This happens when the chip sends us a reTx packet, but we are waiting for the next one
        if (this.recvSeq != frmNum) {
            if (reTx) {
                // if the reTx flag is set, then this is a packet replay
                logger.debug(`Unexpected DATA packet sequence ${frmNum} | ${this.recvSeq}: packet replay`, NS);
            } else {
                // otherwise, the sequence of packets is out of order - skip or send NAK is needed
                logger.debug(`Unexpected DATA packet sequence ${frmNum} | ${this.recvSeq}: reject condition`, NS);
                this.rejectCondition = true;
                return;
            }
        }

        this.rejectCondition = false;

        this.recvSeq = (frmNum + 1) & 7; // next

        logger.debug(`--> ACK  (${this.recvSeq})`, NS);

        this.writer.sendACK(this.recvSeq);

        const handled = this.handleACK(frame);

        if (reTx && !handled) {
            // if the package is resent and did not expect it,
            // then will skip it - already processed it earlier
            logger.debug(`Skipping the packet as repeated (${this.recvSeq})`, NS);

            return;
        }

        const data = frame.buffer.subarray(1, -3);

        this.emit('received', NpiFrame.makeRandomizedBuffer(data));
    }

    private handleACK(frame: NpiFrame): boolean {
        /* Handle an acknowledgement frame */
        // next number after the last accepted frame
        this.ackSeq = frame.control & 0x07;

        logger.debug(`<-- ACK (${this.ackSeq}): ${frame}`, NS);

        const handled = this.waitress.resolve({sequence: this.ackSeq});

        if (!handled && this.sendSeq !== this.ackSeq) {
            // Packet confirmation received for {ackSeq}, but was expected {sendSeq}
            // This happens when the chip has not yet received of the packet {sendSeq} from us,
            // but has already sent us the next one.
            logger.debug(`Unexpected packet sequence ${this.ackSeq} | ${this.sendSeq}`, NS);
        }

        return handled;
    }

    private handleNAK(frame: NpiFrame): void {
        /* Handle negative acknowledgment frame */
        const nakNum = frame.control & 0x07;

        logger.debug(`<-- NAK (${nakNum}): ${frame}`, NS);

        const handled = this.waitress.reject({sequence: nakNum}, 'Recv NAK frame');

        if (!handled) {
            // send NAK
            logger.debug(`NAK Unexpected packet sequence ${nakNum}`, NS);
        } else {
            logger.debug(`NAK Expected packet sequence ${nakNum}`, NS);
        }
    }

    private handleRST(frame: NpiFrame): void {
        logger.debug(`<-- RST:  ${frame}`, NS);
    }

    private handleRSTACK(frame: NpiFrame): void {
        /* Reset acknowledgement frame receive handler */
        let code;
        this.rejectCondition = false;

        logger.debug(`<-- RSTACK ${frame}`, NS);

        try {
            code = NcpResetCode[frame.buffer[2]];
        } catch {
            code = NcpResetCode.ERROR_UNKNOWN_EM3XX_ERROR;
        }

        logger.debug(`RSTACK Version: ${frame.buffer[1]} Reason: ${code.toString()} frame: ${frame}`, NS);

        if (NcpResetCode[<number>code].toString() !== NcpResetCode.RESET_SOFTWARE.toString()) {
            return;
        }

        this.waitress.resolve({sequence: -1});
    }

    private async handleError(frame: NpiFrame): Promise<void> {
        logger.debug(`<-- Error ${frame}`, NS);

        try {
            // send reset
            await this.reset();
        } catch (error) {
            logger.error(`Failed to reset on Error Frame: ${error}`, NS);
        }
    }

    async reset(): Promise<void> {
        logger.debug('Uart reseting', NS);
        this.parser.reset();
        this.queue.clear();
        this.sendSeq = 0;
        this.recvSeq = 0;

        return await this.queue.execute<void>(async (): Promise<void> => {
            try {
                logger.debug(`--> Write reset`, NS);
                const waiter = this.waitFor(-1, 10000);
                this.rejectCondition = false;

                this.writer.sendReset();
                logger.debug(`-?- waiting reset`, NS);
                await waiter.start().promise;
                logger.debug(`-+- waiting reset success`, NS);

                await wait(2000);
            } catch (e) {
                logger.error(`--> Error: ${e}`, NS);

                this.emit('reset');

                throw new Error(`Reset error: ${e}`);
            }
        });
    }

    public async close(emitClose: boolean): Promise<void> {
        logger.debug('Closing UART', NS);
        this.queue.clear();

        if (this.initialized) {
            this.initialized = false;

            if (this.serialPort) {
                try {
                    await this.serialPort.asyncFlushAndClose();
                } catch (error) {
                    if (emitClose) {
                        this.emit('close');
                    }

                    throw error;
                }
            } else {
                this.socketPort!.destroy();
            }
        }

        if (emitClose) {
            this.emit('close');
        }
    }

    private onPortError(error: Error): void {
        logger.error(`Port error: ${error}`, NS);
    }

    private onPortClose(err: boolean | Error): void {
        logger.debug(`Port closed. Error? ${err}`, NS);

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
        this.sendSeq = (seq + 1) % 8; // next
        const nextSeq = this.sendSeq;
        const ackSeq = this.recvSeq;

        return await this.queue.execute<void>(async (): Promise<void> => {
            const randData = NpiFrame.makeRandomizedBuffer(data);

            try {
                const waiter = this.waitFor(nextSeq);
                logger.debug(`--> DATA (${seq},${ackSeq},0): ${data.toString('hex')}`, NS);
                this.writer.sendData(randData, seq, 0, ackSeq);
                logger.debug(`-?- waiting (${nextSeq})`, NS);
                await waiter.start().promise;
                logger.debug(`-+- waiting (${nextSeq}) success`, NS);
            } catch (e1) {
                logger.error(`--> Error: ${e1}`, NS);
                logger.error(`-!- break waiting (${nextSeq})`, NS);
                logger.error(`Can't send DATA frame (${seq},${ackSeq},0): ${data.toString('hex')}`, NS);

                try {
                    await wait(500);
                    const waiter = this.waitFor(nextSeq);
                    logger.debug(`->> DATA (${seq},${ackSeq},1): ${data.toString('hex')}`, NS);
                    this.writer.sendData(randData, seq, 1, ackSeq);
                    logger.debug(`-?- rewaiting (${nextSeq})`, NS);
                    await waiter.start().promise;
                    logger.debug(`-+- rewaiting (${nextSeq}) success`, NS);
                } catch (e2) {
                    logger.error(`--> Error: ${e2}`, NS);
                    logger.error(`-!- break rewaiting (${nextSeq})`, NS);
                    logger.error(`Can't resend DATA frame (${seq},${ackSeq},1): ${data.toString('hex')}`, NS);
                    if (this.initialized) {
                        this.emit('reset');
                    }
                    throw new Error(`sendDATA error: try 1: ${e1}, try 2: ${e2}`);
                }
            }
        });
    }

    public waitFor(sequence: number, timeout = 4000): {start: () => {promise: Promise<EZSPPacket>; ID: number}; ID: number} {
        return this.waitress.waitFor({sequence}, timeout);
    }

    private waitressTimeoutFormatter(matcher: EZSPPacketMatcher, timeout: number): string {
        return `${JSON.stringify(matcher)} after ${timeout}ms`;
    }

    private waitressValidator(payload: EZSPPacket, matcher: EZSPPacketMatcher): boolean {
        return payload.sequence === matcher.sequence;
    }
}
