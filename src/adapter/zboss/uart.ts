/* v8 ignore start */

import EventEmitter from 'node:events';
import {Socket} from 'node:net';

import {Queue, wait, Waitress} from '../../utils';
import {logger} from '../../utils/logger';
import {SerialPort} from '../serialPort';
import SocketPortUtils from '../socketPortUtils';
import {SerialPortOptions} from '../tstype';
import {SIGNATURE, ZBOSS_FLAG_FIRST_FRAGMENT, ZBOSS_FLAG_LAST_FRAGMENT, ZBOSS_NCP_API_HL} from './consts';
import {readZBOSSFrame, writeZBOSSFrame, ZBOSSFrame} from './frame';
import {ZBOSSReader} from './reader';
import {crc8, crc16} from './utils';
import {ZBOSSWriter} from './writer';

const NS = 'zh:zboss:uart';

export class ZBOSSUart extends EventEmitter {
    private readonly portOptions: SerialPortOptions;
    private serialPort?: SerialPort;
    private socketPort?: Socket;
    private writer: ZBOSSWriter;
    private reader: ZBOSSReader;
    private closing: boolean = false;
    private sendSeq = 0; // next frame number to send
    private recvSeq = 0; // next frame number to receive
    private ackSeq = 0; // next number after the last accepted frame
    private waitress: Waitress<number, number>;
    private queue: Queue;
    public inReset = false;

    constructor(options: SerialPortOptions) {
        super();

        this.portOptions = options;
        this.serialPort = undefined;
        this.socketPort = undefined;
        this.writer = new ZBOSSWriter();
        this.reader = new ZBOSSReader();
        this.reader.on('data', this.onPackage.bind(this));
        this.queue = new Queue(1);
        this.waitress = new Waitress<number, number>(this.waitressValidator, this.waitressTimeoutFormatter);
    }

    public async resetNcp(): Promise<boolean> {
        if (this.closing) {
            return false;
        }

        logger.info(`NCP reset`, NS);

        try {
            if (!this.portOpen) {
                await this.openPort();
            }

            return true;
        } catch (err) {
            logger.error(`Failed to init port with error ${err}`, NS);

            return false;
        }
    }

    get portOpen(): boolean | undefined {
        if (this.closing) {
            return false;
        }
        if (SocketPortUtils.isTcpPath(this.portOptions.path!)) {
            return this.socketPort && !this.socketPort.closed;
        } else {
            return this.serialPort && this.serialPort.isOpen;
        }
    }

    public async start(): Promise<boolean> {
        if (!this.portOpen) {
            return false;
        }

        logger.info(`UART starting`, NS);

        try {
            if (this.serialPort != null) {
                // clear read/write buffers
                await this.serialPort.asyncFlush();
            }
        } catch (err) {
            logger.error(`Error while flushing before start: ${err}`, NS);
        }

        return true;
    }

    public async stop(): Promise<void> {
        this.closing = true;
        this.queue.clear();
        await this.closePort();
        this.closing = false;
        logger.info(`UART stopped`, NS);
    }

    private async openPort(): Promise<void> {
        await this.closePort();

        if (!SocketPortUtils.isTcpPath(this.portOptions.path!)) {
            const serialOpts = {
                path: this.portOptions.path!,
                baudRate: typeof this.portOptions.baudRate === 'number' ? this.portOptions.baudRate : 115200,
                rtscts: typeof this.portOptions.rtscts === 'boolean' ? this.portOptions.rtscts : false,
                autoOpen: false,
            };

            //@ts-expect-error Jest testing
            if (this.portOptions.binding != null) {
                //@ts-expect-error Jest testing
                serialOpts.binding = this.portOptions.binding;
            }

            logger.debug(`Opening serial port with ${JSON.stringify(serialOpts)}`, NS);
            this.serialPort = new SerialPort(serialOpts);

            this.writer.pipe(this.serialPort);

            this.serialPort.pipe(this.reader);

            try {
                await this.serialPort.asyncOpen();
                logger.info(`Serial port opened`, NS);

                this.serialPort.once('close', this.onPortClose.bind(this));
                this.serialPort.on('error', this.onPortError.bind(this));
            } catch (error) {
                await this.stop();

                throw error;
            }
        } else {
            const info = SocketPortUtils.parseTcpPath(this.portOptions.path!);
            logger.debug(`Opening TCP socket with ${info.host}:${info.port}`, NS);

            this.socketPort = new Socket();
            this.socketPort.setNoDelay(true);
            this.socketPort.setKeepAlive(true, 15000);

            this.writer.pipe(this.socketPort);

            this.socketPort.pipe(this.reader);

            return await new Promise((resolve, reject): void => {
                const openError = async (err: Error): Promise<void> => {
                    await this.stop();

                    reject(err);
                };

                this.socketPort?.on('connect', () => {
                    logger.debug(`Socket connected`, NS);
                });
                this.socketPort?.on('ready', async (): Promise<void> => {
                    logger.info(`Socket ready`, NS);
                    this.socketPort?.removeListener('error', openError);
                    this.socketPort?.once('close', this.onPortClose.bind(this));
                    this.socketPort?.on('error', this.onPortError.bind(this));

                    resolve();
                });
                this.socketPort?.once('error', openError);

                this.socketPort?.connect(info.port, info.host);
            });
        }
    }

    public async closePort(): Promise<void> {
        if (this.serialPort?.isOpen) {
            try {
                await this.serialPort.asyncFlushAndClose();
            } catch (err) {
                logger.error(`Failed to close serial port ${err}.`, NS);
            }

            this.serialPort.removeAllListeners();
            this.serialPort = undefined;
        } else if (this.socketPort != undefined && !this.socketPort.closed) {
            this.socketPort.destroy();
            this.socketPort.removeAllListeners();
            this.socketPort = undefined;
        }
    }

    private async onPortClose(err: boolean | Error): Promise<void> {
        logger.info(`Port closed. Error? ${err ?? 'no'}`, NS);
        if (this.inReset) {
            await wait(3000);
            await this.openPort();
            this.inReset = false;
        }
    }

    private async onPortError(error: Error): Promise<void> {
        logger.info(`Port error: ${error}`, NS);
    }

    private async onPackage(data: Buffer): Promise<void> {
        if (this.inReset) return;
        const len = data.readUInt16LE(0);
        const pType = data.readUInt8(2);
        const pFlags = data.readUInt8(3);
        const isACK = (pFlags & 0x1) === 1;
        const retransmit = ((pFlags >> 1) & 0x1) === 1;
        const sequence = (pFlags >> 2) & 0x3;
        const ACKseq = (pFlags >> 4) & 0x3;
        const isFirst = ((pFlags >> 6) & 0x1) === 1;
        const isLast = ((pFlags >> 7) & 0x1) === 1;
        logger.debug(
            () =>
                `<-- package type ${pType}, flags ${pFlags.toString(16)}` +
                `${JSON.stringify({isACK, retransmit, sequence, ACKseq, isFirst, isLast})}`,
            NS,
        );

        if (pType !== ZBOSS_NCP_API_HL) {
            logger.error(`<-- Wrong package type: ${pType}`, NS);
            return;
        }
        if (isACK) {
            // ACKseq is received
            this.handleACK(ACKseq);
            return;
        }
        if (len <= 5) {
            logger.debug(`<-- Empty package`, NS);
            return;
        }

        // header crc
        const hCRC = data.readUInt8(4);
        const hCRC8 = crc8(data.subarray(0, 4));
        if (hCRC !== hCRC8) {
            logger.error(`<-- Wrong package header crc: is ${hCRC}, expected ${hCRC8}`, NS);
            return;
        }

        // body crc
        const bCRC = data.readUInt16LE(5);
        const body = data.subarray(7);
        const bodyCRC16 = crc16(body);

        if (bCRC !== bodyCRC16) {
            logger.error(`<-- Wrong package body crc: is ${bCRC}, expected ${bodyCRC16}`, NS);
            return;
        }

        this.recvSeq = sequence;
        // Send ACK
        logger.debug(`--> ACK (${this.recvSeq})`, NS);
        await this.sendACK(this.recvSeq);

        try {
            logger.debug(`<-- FRAME: ${body.toString('hex')}`, NS);
            const frame = readZBOSSFrame(body);
            if (frame) {
                this.emit('frame', frame);
            }
        } catch (error) {
            logger.debug(`<-- error ${(error as Error).stack}`, NS);
        }
    }

    public async sendBuffer(buf: Buffer): Promise<void> {
        try {
            logger.debug(`--> FRAME: ${buf.toString('hex')}`, NS);
            let flags = (this.sendSeq & 0x03) << 2; // sequence
            flags = flags | ZBOSS_FLAG_FIRST_FRAGMENT | ZBOSS_FLAG_LAST_FRAGMENT;
            const pack = this.makePack(flags, buf);
            const isACK = (flags & 0x1) === 1;
            const retransmit = ((flags >> 1) & 0x1) === 1;
            const sequence = (flags >> 2) & 0x3;
            const ACKseq = (flags >> 4) & 0x3;
            const isFirst = ((flags >> 6) & 0x1) === 1;
            const isLast = ((flags >> 7) & 0x1) === 1;
            logger.debug(
                () =>
                    `--> package type ${ZBOSS_NCP_API_HL}, flags ${flags.toString(16)}` +
                    `${JSON.stringify({isACK, retransmit, sequence, ACKseq, isFirst, isLast})}`,
                NS,
            );
            logger.debug(`--> PACK: ${pack.toString('hex')}`, NS);
            await this.sendDATA(pack);
        } catch (error) {
            logger.debug(`--> error ${(error as Error).stack}`, NS);
        }
    }

    public async sendFrame(frame: ZBOSSFrame): Promise<void> {
        return await this.sendBuffer(writeZBOSSFrame(frame));
    }

    private async sendDATA(data: Buffer, isACK: boolean = false): Promise<void> {
        const seq = this.sendSeq;
        const nextSeq = this.sendSeq;
        const ackSeq = this.recvSeq;

        return await this.queue.execute<void>(async (): Promise<void> => {
            try {
                logger.debug(`--> DATA (${seq},${ackSeq},0): ${data.toString('hex')}`, NS);
                if (!isACK) {
                    const waiter = this.waitFor(nextSeq);
                    this.writeBuffer(data);
                    logger.debug(`-?- waiting (${nextSeq})`, NS);
                    if (!this.inReset) {
                        await waiter.start().promise;
                    }
                    logger.debug(`-+- waiting (${nextSeq}) success`, NS);
                } else {
                    this.writeBuffer(data);
                }
            } catch (e1) {
                logger.error(`--> Error: ${e1}`, NS);
                logger.error(`-!- break waiting (${nextSeq})`, NS);
                logger.error(`Can't send DATA frame (${seq},${ackSeq},0): ${data.toString('hex')}`, NS);
                throw new Error(`sendDATA error: try 1: ${e1}`);
                // try {
                //     await Wait(500);
                //     const waiter = this.waitFor(nextSeq);
                //     logger.debug(`->> DATA (${seq},${ackSeq},1): ${data.toString('hex')}`, NS);
                //     this.writeBuffer(data);
                //     logger.debug(`-?- rewaiting (${nextSeq})`, NS);
                //     await waiter.start().promise;
                //     logger.debug(`-+- rewaiting (${nextSeq}) success`, NS);
                // } catch (e2) {
                //     logger.error(`--> Error: ${e2}`, NS);
                //     logger.error(`-!- break rewaiting (${nextSeq})`, NS);
                //     logger.error(`Can't resend DATA frame (${seq},${ackSeq},1): ${data.toString('hex')}`, NS);
                //     throw new Error(`sendDATA error: try 1: ${e1}, try 2: ${e2}`);
                // }
            }
        });
    }

    private handleACK(ackSeq: number): boolean {
        /* Handle an acknowledgement package */
        // next number after the last accepted package
        this.ackSeq = ackSeq & 0x03;

        logger.debug(`<-- ACK (${this.ackSeq})`, NS);

        const handled = this.waitress.resolve(this.ackSeq);

        if (!handled && this.sendSeq !== this.ackSeq) {
            // Packet confirmation received for {ackSeq}, but was expected {sendSeq}
            // This happens when the chip has not yet received of the packet {sendSeq} from us,
            // but has already sent us the next one.
            logger.debug(`Unexpected packet sequence ${this.ackSeq} | ${this.sendSeq}`, NS);
        } else {
            // next
            this.sendSeq = {0: 1, 1: 2, 2: 3, 3: 1}[this.sendSeq] || 1;
        }

        return handled;
    }

    private async sendACK(ackNum: number, retransmit: boolean = false): Promise<void> {
        /* Construct a acknowledgement package */

        let flags = (ackNum & 0x03) << 4; // ACKseq
        flags |= 0x01; // isACK
        if (retransmit) {
            flags |= 0x02; // retransmit
        }
        const ackPackage = this.makePack(flags, undefined);
        const isACK = (flags & 0x1) === 1;
        const sequence = (flags >> 2) & 0x3;
        const ACKseq = (flags >> 4) & 0x3;
        const isFirst = ((flags >> 6) & 0x1) === 1;
        const isLast = ((flags >> 7) & 0x1) === 1;
        logger.debug(
            () =>
                `--> package type ${ZBOSS_NCP_API_HL}, flags ${flags.toString(16)}` +
                `${JSON.stringify({isACK, retransmit, sequence, ACKseq, isFirst, isLast})}`,
            NS,
        );
        logger.debug(`-->  ACK: ${ackPackage.toString('hex')}`, NS);
        await this.sendDATA(ackPackage, true);
    }

    private writeBuffer(buffer: Buffer): void {
        logger.debug(`--> [${buffer.toString('hex')}]`, NS);
        this.writer.push(buffer);
    }

    private makePack(flags: number, data?: Buffer): Buffer {
        /* Construct a package */
        const packLen = 5 + (data ? data.length + 2 : 0);
        const header = Buffer.alloc(7);
        header.writeUInt16BE(SIGNATURE);
        header.writeUInt16LE(packLen, 2);
        header.writeUInt8(ZBOSS_NCP_API_HL, 4);
        header.writeUInt8(flags, 5);
        const hCRC8 = crc8(header.subarray(2, 6));
        header.writeUInt8(hCRC8, 6);
        if (data) {
            const pCRC16 = Buffer.alloc(2);
            pCRC16.writeUInt16LE(crc16(data));
            return Buffer.concat([header, pCRC16, data]);
        } else {
            return header;
        }
    }

    private waitFor(sequence: number, timeout = 2000): {start: () => {promise: Promise<number>; ID: number}; ID: number} {
        return this.waitress.waitFor(sequence, timeout);
    }

    private waitressTimeoutFormatter(matcher: number, timeout: number): string {
        return `${matcher} after ${timeout}ms`;
    }

    private waitressValidator(sequence: number, matcher: number): boolean {
        return sequence === matcher;
    }
}
