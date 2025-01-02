/* v8 ignore start */

import * as stream from 'node:stream';

import {logger} from '../../../utils/logger';
import * as consts from './consts';
import Frame from './frame';

const NS = 'zh:ezsp:uart';

export class Parser extends stream.Transform {
    private tail: Buffer[];

    public constructor() {
        super();

        this.tail = [];
    }

    public override _transform(chunk: Buffer, _: string, cb: () => void): void {
        if (chunk.indexOf(consts.CANCEL) >= 0) {
            this.reset();
            chunk = chunk.subarray(chunk.lastIndexOf(consts.CANCEL) + 1);
        }

        if (chunk.indexOf(consts.SUBSTITUTE) >= 0) {
            this.reset();
            chunk = chunk.subarray(chunk.indexOf(consts.FLAG) + 1);
        }

        logger.debug(`<-- [${chunk.toString('hex')}]`, NS);

        let delimiterPlace = chunk.indexOf(consts.FLAG);

        while (delimiterPlace >= 0) {
            const buffer = chunk.subarray(0, delimiterPlace + 1);
            const frameBuffer = Buffer.from([...this.unstuff(Buffer.concat([...this.tail, buffer]))]);
            this.reset();

            try {
                const frame = Frame.fromBuffer(frameBuffer);

                if (frame) {
                    this.emit('parsed', frame);
                }
            } catch (error) {
                logger.debug(`<-- error ${error}`, NS);
            }

            chunk = chunk.subarray(delimiterPlace + 1);
            delimiterPlace = chunk.indexOf(consts.FLAG);
        }

        this.tail.push(chunk);
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
                } else if (byte === consts.XOFF || byte === consts.XON) {
                    // skip
                } else {
                    yield byte;
                }
            }
        }
    }

    public reset(): void {
        // clear tail
        this.tail.length = 0;
    }
}
