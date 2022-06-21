import * as stream from 'stream';
import * as consts from './consts';
import {crc16ccitt} from './utils';
import Debug from "debug";

const debug = Debug('zigbee-herdsman:adapter:ezsp:send');

export class Writer extends stream.Readable {
    public writeBuffer(buffer: Buffer): void {
        debug(`--> [${buffer.toString('hex')}]`);
        this.push(buffer);
    }

    public _read(): void {
    }

    public sendACK(ackNum: number): void {
        /* Construct a acknowledgement frame */
        const ackFrame = this.makeFrame((0b10000000 | ackNum));
        this.writeBuffer(ackFrame);
    }

    public sendReset(): void {
        /* Construct a reset frame */
        const rstFrame = Buffer.concat([Buffer.from([consts.CANCEL]), this.makeFrame(0xC0)]);
        this.writeBuffer(rstFrame);
    }

    public sendData(data: Buffer, seq: number, rxmit: number, ackSeq: number): void {
        /* Construct a data frame */
        const control = (((seq << 4) | (rxmit << 3)) | ackSeq);
        const dataFrame = this.makeFrame(control, data);
        this.writeBuffer(dataFrame);
    }

    private stuff(s: Iterable<number>): Buffer {
        /* Byte stuff (escape) a string for transmission */
        const out = Buffer.alloc(256);
        let outIdx = 0;
        for (const c of s) {
            if (consts.RESERVED.includes(c)) {
                out.writeUInt8(consts.ESCAPE, outIdx++);
                out.writeUInt8(c ^ consts.STUFF, outIdx++);
            } else {
                out.writeUInt8(c, outIdx++);
            }
        }
        return out.slice(0, outIdx);
    }

    private makeFrame(control: number, data?: Buffer): Buffer {
        /* Construct a frame */
        const ctrl = Buffer.from([control]);
        const frm = (data) ? Buffer.concat([ctrl, data]) : ctrl;
        const crc = crc16ccitt(frm, 65535);
        const crcArr = Buffer.from([(crc >> 8), (crc % 256)]);
        return Buffer.concat([this.stuff(Buffer.concat([frm, crcArr])), Buffer.from([consts.FLAG])]);
    }
}