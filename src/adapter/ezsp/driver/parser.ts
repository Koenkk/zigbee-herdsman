/* istanbul ignore file */
import * as stream from 'stream';
import * as consts from './consts';
import Frame from './frame';
import {logger} from '../../../utils/logger';

const NS = 'zh:ezsp:uart';

export class Parser extends stream.Transform {
    private tail: Buffer[];
    private flagXONXOFF: boolean;

    public constructor(flagXONXOFF: boolean = false) {
        super();

        this.flagXONXOFF = flagXONXOFF;
        this.tail = [];
    }

    public _transform(chunk: Buffer, _: string, cb: () => void): void {
        if (this.flagXONXOFF && (chunk.indexOf(consts.XON) >= 0 || chunk.indexOf(consts.XOFF) >= 0)) {
            // XXX: should really throw, but just assert for now to flag potential problematic setups
            logger.error(`Host driver did not remove XON/XOFF from input stream. Driver not setup for XON/XOFF?`, NS);
        }

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
                logger.debug(`<-- error ${error.stack}`, NS);
            }

            chunk = chunk.subarray(delimiterPlace + 1);
            delimiterPlace = chunk.indexOf(consts.FLAG);
        }

        this.tail.push(chunk);
        cb();
    }
 
    private* unstuff(buffer: Buffer): Generator<number> {
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