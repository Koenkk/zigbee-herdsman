import * as stream from 'stream';
import * as consts from './consts';
import Debug from "debug";

const debug = Debug('zigbee-herdsman:adapter:ezsp:uart');

export class Writer extends stream.Readable {
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
            if (consts.RESERVED.includes(c)) {
                out.writeUInt8(consts.ESCAPE, outIdx++);
                out.writeUInt8(c ^ consts.STUFF, outIdx++);
            } else {
                out.writeUInt8(c, outIdx++);
            }
        }
        return out.slice(0, outIdx);
    }
}