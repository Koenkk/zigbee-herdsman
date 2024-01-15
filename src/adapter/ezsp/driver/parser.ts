/* istanbul ignore file */
import * as stream from 'stream';
import * as consts from './consts';
import Debug from "debug";
import Frame from './frame';

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
        if (this.buffer.length) {
            const place = this.buffer.indexOf(consts.FLAG);

            if (place >= 0) {
                const frameLength = place + 1;

                if (this.buffer.length >= frameLength) {
                    const frameBuffer = this.unstuff(this.buffer.subarray(0, frameLength));

                    try {
                        const frame = Frame.fromBuffer(frameBuffer);

                        if (frame) {
                            debug(`--> parsed ${frame}`);
                            this.emit('parsed', frame);
                        }
                    } catch (error) {
                        debug(`--> error ${error.stack}`);
                    }

                    this.buffer = this.buffer.subarray(frameLength);
                    this.parseNext();
                }
            }
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