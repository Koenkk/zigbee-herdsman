/* istanbul ignore file */

import * as stream from 'stream';

import {logger} from '../../../utils/logger';
import * as consts from './consts';
import Frame from './frame';

const NS = 'zh:blz:uart';

export class Parser extends stream.Transform {
    private tail: Buffer[];

    public constructor() {
        super();
        this.tail = [];
    }

    public _transform(chunk: Buffer, _: string, cb: () => void): void {
        logger.debug(`<-- [${chunk.toString('hex')}]`, NS);

        // Append the new chunk to the tail for processing
        this.tail.push(chunk);
        let buffer = Buffer.concat(this.tail);

        let startPlace = buffer.indexOf(consts.START);
        let endPlace = buffer.indexOf(consts.END, startPlace + 1);

        while (startPlace >= 0 && endPlace > startPlace) {
            // Extract a complete frame from START to END
            const frameBuffer = buffer.subarray(startPlace + 1, endPlace); // Exclude delimiters

            try {
                const unstuffedBuffer = Buffer.from([...this.unstuff(frameBuffer)]);
                const frame = Frame.fromBuffer(unstuffedBuffer);

                if (frame) {
                    this.emit('parsed', frame); // Emit the parsed frame
                }
            } catch (error) {
                logger.debug(`<-- error ${error}`, NS);
            }

            // Remove the processed part and search for the next frame
            buffer = buffer.subarray(endPlace + 1);
            startPlace = buffer.indexOf(consts.START);
            endPlace = buffer.indexOf(consts.END, startPlace + 1);
        }

        // Save unprocessed data for the next chunk
        this.tail = [buffer];
        cb();
    }

    private *unstuff(buffer: Buffer): Generator<number> {
        /* Unstuff (unescape) a buffer after receipt */
        let escaped = false;
        for (const byte of buffer) {
            if (escaped) {
                yield byte ^ consts.STUFF;
                escaped = false;
            } else {
                if (byte === consts.ESCAPE) {
                    escaped = true;
                } else {
                    yield byte;
                }
            }
        }
    }

    public reset(): void {
        // Clear tail
        this.tail.length = 0;
    }
}

