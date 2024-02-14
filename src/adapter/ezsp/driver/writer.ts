/* istanbul ignore file */
import * as stream from 'stream';
import * as consts from './consts';
import {crc16ccitt} from './utils';
import Debug from "debug";

const debug = Debug('zigbee-herdsman:adapter:ezsp:uart');

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

    public sendNAK(ackNum: number): void {
        /* Construct a negative acknowledgement frame */
        const nakFrame = this.makeFrame((0b10100000 | ackNum));
        this.writeBuffer(nakFrame);
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

    private* stuff (buffer: number[]): Generator<number> {
        /* Byte stuff (escape) a string for transmission */
        for (const byte of buffer) {
            if (consts.RESERVED.includes(byte)) {
                yield consts.ESCAPE;
                yield byte ^ consts.STUFF;
            } else {
                yield byte;
            }
        }
    }

    private makeFrame(control: number, data?: Buffer): Buffer {
        /* Construct a frame */
        const frm = [control, ...(data || [])];
        const crc = crc16ccitt(frm, 65535);
        frm.push(crc >> 8);
        frm.push(crc % 256);
        return Buffer.from([...this.stuff(frm), consts.FLAG]);
    }
}