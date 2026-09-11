/* v8 ignore start */

import EventEmitter from "node:events";
import {Waitress, wait} from "../../utils";
import {AsyncMutex} from "../../utils/async-mutex";
import {logger} from "../../utils/logger";
import type {AdapterTransport} from "../transport";
import {SIGNATURE, ZBOSS_FLAG_FIRST_FRAGMENT, ZBOSS_FLAG_LAST_FRAGMENT, ZBOSS_NCP_API_HL} from "./consts";
import {readZBOSSFrame, writeZBOSSFrame, type ZBOSSFrame} from "./frame";
import {crc8, crc16} from "./utils";

const NS = "zh:zboss:uart";

export class ZBOSSUart extends EventEmitter {
    private readonly transport: AdapterTransport;
    private inputBuffer = Buffer.alloc(0);
    private sendSeq = 0; // next frame number to send
    private recvSeq = 0; // next frame number to receive
    private ackSeq = 0; // next number after the last accepted frame
    private waitress: Waitress<number, number>;
    private queue: AsyncMutex;
    public inReset = false;

    constructor(transport: AdapterTransport) {
        super();

        this.transport = transport;
        this.queue = new AsyncMutex();
        this.waitress = new Waitress<number, number>(this.waitressValidator, this.waitressTimeoutFormatter);

        this.transport.on("data", this.onTransportData.bind(this));
        this.transport.on("close", async () => {
            if (this.inReset) {
                await wait(3000);
                await this.transport.open(true);
                this.inReset = false;
            }
        });
    }

    private async onTransportData(chunk: Buffer): Promise<void> {
        let data = Buffer.concat([this.inputBuffer, chunk]);
        // SIGNATURE - start of package
        let position = data.indexOf(SIGNATURE);

        while (position !== -1) {
            // need for read length
            if (data.length <= position + 3) {
                break;
            }

            const length = data.readUInt16LE(position + 1);

            if (data.length < position + 1 + length) {
                break;
            }

            await this.onFrame(data.subarray(position + 1, position + 1 + length));

            data = data.subarray(position + 1 + length);
            position = data.indexOf(SIGNATURE);
        }
        this.inputBuffer = data;
    }

    get portOpen(): boolean | undefined {
        return this.transport.isOpen;
    }

    public async start(): Promise<boolean> {
        if (this.transport.isClosing) {
            return false;
        }

        logger.info("NCP reset", NS);

        try {
            if (!this.portOpen) {
                await this.transport.open(true);
            }

            return true;
        } catch (err) {
            logger.error(`Failed to init port with error ${err}`, NS);

            return false;
        }
    }

    public async stop(): Promise<void> {
        this.queue.clear();
        await this.transport.close();
        logger.info("UART stopped", NS);
    }

    private async onFrame(data: Buffer): Promise<void> {
        // Do not drop frames while `inReset` is set.
        //
        // `inReset` is set by `reset()` and only cleared by `onPortClose`
        // (after a 3s wait + reopen). On some NCP transports the underlying
        // port does not reliably close around `esp_restart()` (e.g. ESP32-C6
        // USB-Serial-JTAG re-attaches the same CDC descriptor essentially
        // instantly), so `onPortClose` never fires, `inReset` never clears,
        // and the device's tsn-matching NCP_RESET response plus the
        // post-reboot boot-ready frame both get silently dropped here.
        // `Driver.execCommand(NCP_RESET, ...)` already uses an undefined-tsn
        // waitress matcher, so either frame would resolve the pending
        // promise if it reached the `"frame"` emitter. The CRC8/CRC16 checks below
        // reject any garbage (ROM banner ASCII, partial frames, electrical
        // noise) that legitimately arrives during the reset window.
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
            logger.debug("<-- Empty package", NS);
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
            logger.debug(`<-- FRAME: ${body.toString("hex")}`, NS);
            const frame = readZBOSSFrame(body);
            if (frame) {
                this.emit("frame", frame);
            }
        } catch (error) {
            logger.debug(`<-- error ${(error as Error).stack}`, NS);
        }
    }

    public async sendBuffer(buf: Buffer): Promise<void> {
        try {
            logger.debug(`--> FRAME: ${buf.toString("hex")}`, NS);
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
            logger.debug(`--> PACK: ${pack.toString("hex")}`, NS);
            await this.sendDATA(pack);
        } catch (error) {
            logger.debug(`--> error ${(error as Error).stack}`, NS);
        }
    }

    public async sendFrame(frame: ZBOSSFrame): Promise<void> {
        return await this.sendBuffer(writeZBOSSFrame(frame));
    }

    private async sendDATA(data: Buffer, isACK = false): Promise<void> {
        const seq = this.sendSeq;
        const nextSeq = this.sendSeq;
        const ackSeq = this.recvSeq;

        return await this.queue.run<void>(async (): Promise<void> => {
            try {
                logger.debug(`--> DATA (${seq},${ackSeq},0): ${data.toString("hex")}`, NS);
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
                logger.error(`Can't send DATA frame (${seq},${ackSeq},0): ${data.toString("hex")}`, NS);
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

    private async sendACK(ackNum: number, retransmit = false): Promise<void> {
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
        logger.debug(`-->  ACK: ${ackPackage.toString("hex")}`, NS);
        await this.sendDATA(ackPackage, true);
    }

    private writeBuffer(buffer: Buffer): void {
        logger.debug(`--> [${buffer.toString("hex")}]`, NS);
        this.transport.write(buffer);
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
        }

        return header;
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
