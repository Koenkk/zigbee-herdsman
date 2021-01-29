import * as stream from 'stream';
import Debug from "debug";

const debug = Debug('zigbee-herdsman:adapter:ezsp:uart');

export const FLAG = 0x7E  // Marks end of frame
export const ESCAPE = 0x7D
export const CANCEL = 0x1A  // Terminates a frame in progress
const XON = 0x11  // Resume transmission
const XOFF = 0x13  // Stop transmission
const SUBSTITUTE = 0x18
const STUFF = 0x20
export const RESERVED = [FLAG, ESCAPE, XON, XOFF, SUBSTITUTE, CANCEL]


export class Parser extends stream.Transform {
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
                debug(`<-- parsed ${frame.toString('hex')}`);
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
        let out = Buffer.alloc(s.length);
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

export class Writer extends stream.Readable {
    public writeBuffer(buffer: Buffer): void {
        debug(`--> [${buffer.toString('hex')}] [${[...buffer]}]`);
        this.push(buffer);
    }

    public _read(): void {}

    public stuff(s: Iterable<number>): Buffer {
        /* Byte stuff (escape) a string for transmission */
        let out = Buffer.alloc(256);
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