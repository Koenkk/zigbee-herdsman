/* istanbul ignore file */
import * as stream from 'stream';
import * as consts from './consts';
import Debug from "debug";

const debug = Debug('zigbee-herdsman:adapter:ezsp:uart');

export class Parser extends stream.Transform {
    private buffer: Buffer;

    public constructor() {
        super();
        this.buffer = Buffer.from([]);
    }

    public _transform(chunk: Buffer, _: string, cb: () => void): void {
        if (chunk.indexOf(consts.CANCEL) >= 0) {
            this.buffer = Buffer.from([]);
            chunk = chunk.subarray(chunk.lastIndexOf(consts.CANCEL) + 1);
        }
        if (chunk.indexOf(consts.SUBSTITUTE) >= 0) {
            this.buffer = Buffer.from([]);
            chunk = chunk.subarray(chunk.indexOf(consts.FLAG) + 1);
        }
        debug(`<-- [${chunk.toString('hex')}]`);
        this.buffer = Buffer.concat([this.buffer, chunk]);
        this.parseNext();
        cb();
    }

    private parseNext(): void {
        if (this.buffer.length && this.buffer.indexOf(consts.FLAG) >= 0) {
            //debug(`<-- [${this.buffer.toString('hex')}]`);
            try {
                const frame = this.extractFrame();
                if (frame) {
                    this.emit('parsed', frame);
                }
            } catch (error) {
                debug(`<-- error ${error.stack}`);
            }
            this.parseNext();
        }
    }

    private extractFrame(): Buffer {
        /* Extract a frame from the data buffer */
        const place = this.buffer.indexOf(consts.FLAG);
        if (place >= 0) {
            const result = this.unstuff(this.buffer.subarray(0, place + 1));
            this.buffer = this.buffer.subarray(place + 1);
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
                out.writeUInt8(c ^ consts.STUFF, outIdx++);
                escaped = false;
            } else {
                if (c === consts.ESCAPE) {
                    escaped = true;
                } else if (c === consts.XOFF || c === consts.XON) {
                    // skip
                } else {
                    out.writeUInt8(c, outIdx++);
                }
            }
        }
        return out.subarray(0, outIdx);
    }

    public reset(): void {
        // clear buffer
        this.buffer = Buffer.from([]);
    }
}