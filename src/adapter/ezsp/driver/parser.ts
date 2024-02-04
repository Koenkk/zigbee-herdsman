/* istanbul ignore file */
import * as stream from 'stream';
import {ASH_XON, ASH_XOFF, ASH_ESCAPE, ASH_CANCEL, ASH_SUBSTITUTE, ASH_FLAG, ASH_FLIP} from './consts';
import Debug from "debug";
import {AshFrame} from './frame';

const debug = Debug('zigbee-herdsman:adapter:ezsp:uart');

export class Parser extends stream.Transform {
    private buffer: Buffer;
    private flagXONXOFF: boolean;

    public constructor(flagXONXOFF: boolean = false) {
        super();

        this.flagXONXOFF = flagXONXOFF;
        this.buffer = Buffer.from([]);
    }

    public _transform(chunk: Buffer, _: string, cb: () => void): void {
        if (this.flagXONXOFF && (chunk.indexOf(ASH_XON) >= 0 || chunk.indexOf(ASH_XOFF) >= 0)) {
            // XXX: should really throw, but just assert for now to flag potential problematic setups
            console.assert(false, `Host driver did not remove XON/XOFF from input stream. Driver not setup for XON/XOFF?`);
        }

        // XXX: detect possible ASH_WAKE?

        if (chunk.indexOf(ASH_CANCEL) >= 0) {
            this.buffer = Buffer.from([]);
            chunk = chunk.subarray(chunk.lastIndexOf(ASH_CANCEL) + 1);

            debug(`Frame in progress cancelled.`);
        }

        if (chunk.indexOf(ASH_SUBSTITUTE) >= 0) {
            this.buffer = Buffer.from([]);
            chunk = chunk.subarray(chunk.indexOf(ASH_FLAG) + 1);

            debug(`Received frame with comm error.`);
        }

        debug(`<-- [${chunk.toString('hex')}]`);

        this.buffer = Buffer.concat([this.buffer, chunk]);

        this.parseNext();
        cb();
    }

    private parseNext(): void {
        if (this.buffer.length) {
            const place = this.buffer.indexOf(ASH_FLAG);

            if (place >= 0) {
                const frameLength = place + 1;

                if (this.buffer.length >= frameLength) {
                    const unstuffedBuf = this.unstuff(this.buffer.subarray(0, frameLength));
                    const frame = AshFrame.fromBuffer(unstuffedBuf);

                    if (frame) {
                        debug(`--> parsed ${frame}`);
                        this.emit('parsed', frame);
                    }

                    this.buffer = this.buffer.subarray(frameLength);
                    this.parseNext();
                }
            }
        }
    }

    /**
     * Unstuff (unescape reserved bytes) a buffer after receipt
     */
    private unstuff(buf: Buffer): Buffer {
        let escaped = false;
        const out = Buffer.alloc(buf.length);
        let outIdx = 0;

        for (let idx = 0; idx < buf.length; idx += 1) {
            const b = buf[idx];

            if (escaped) {
                out.writeUInt8(b ^ ASH_FLIP, outIdx++);

                escaped = false;
            } else {
                if (b === ASH_ESCAPE) {
                    escaped = true;
                } else if (b === ASH_XOFF || b === ASH_XON) {
                    // skip
                } else {
                    out.writeUInt8(b, outIdx++);
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