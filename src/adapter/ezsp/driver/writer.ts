/* v8 ignore start */

import * as stream from 'node:stream';

import {logger} from '../../../utils/logger';
import * as consts from './consts';
import {crc16ccitt} from './utils';

const NS = 'zh:ezsp:uart';

export class Writer extends stream.Readable {
    public writeBuffer(buffer: Buffer): void {
        logger.debug(`--> [${buffer.toString('hex')}]`, NS);
        this.push(buffer);
    }

    public override _read(): void {}

    public sendACK(ackNum: number): void {
        /* Construct a acknowledgement frame */
        const ackFrame = this.makeFrame(0b10000000 | ackNum);
        this.writeBuffer(ackFrame);
    }

    public sendNAK(ackNum: number): void {
        /* Construct a negative acknowledgement frame */
        const nakFrame = this.makeFrame(0b10100000 | ackNum);
        this.writeBuffer(nakFrame);
    }

    public sendReset(): void {
        /* Construct a reset frame */
        const rstFrame = Buffer.concat([Buffer.from([consts.CANCEL]), this.makeFrame(0xc0)]);
        this.writeBuffer(rstFrame);
    }

    public sendData(data: Buffer, seq: number, rxmit: number, ackSeq: number): void {
        /* Construct a data frame */
        const control = (seq << 4) | (rxmit << 3) | ackSeq;
        const dataFrame = this.makeFrame(control, data);
        this.writeBuffer(dataFrame);
    }

    private *stuff(buffer: number[]): Generator<number> {
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
