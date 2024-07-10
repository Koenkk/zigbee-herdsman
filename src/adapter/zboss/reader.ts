import {Transform, TransformCallback, TransformOptions} from "stream";
import {SIGNATURE} from "./consts";
import {logger} from "../../utils/logger";

const NS = 'zh:zboss:read';

export class ZBOSSReader extends Transform {
    private buffer: Buffer;

    public constructor(opts?: TransformOptions) {
        super(opts);

        this.buffer = Buffer.alloc(0);
    }

    _transform(chunk: Buffer, encoding: BufferEncoding, cb: TransformCallback): void {
        let data = Buffer.concat([this.buffer, chunk]);
        let position: number;

        logger.debug(`<<<  DATA [${chunk.toString('hex')}]`, NS);
        // SIGNATURE - start of package
        while ((position = data.indexOf(SIGNATURE)) !== -1) {
            // need for read length
            if (data.length > (position + 3)) {
                const len = data.readUInt16LE(position + 1);
                if (data.length >= (position - 1 + len)) {
                    if (len > 5) {
                        const frame = data.subarray(position + 1, position + 1 + len);
                        logger.debug(`<<< FRAME [${frame.toString('hex')}]`, NS);
                        // emit the frame via 'data' event
                        this.push(frame);

                        // remove the frame from internal buffer (set below)
                        data = data.subarray(position + 1 + len);
                        if (data.length) logger.debug(`<<< TAIL [${data.toString('hex')}]`, NS);
                    } else {
                        logger.debug(`<<< Empty frame. Frame length=${len}`, NS);
                    }
                } else {
                    logger.debug(`<<< Not enough data. Length=${data.length}, frame length=${len}`, NS);
                    break;
                }
            } else {
                logger.debug(`<<< Not enough data. Length=${data.length}`, NS);
                break;
            }
        }

        this.buffer = data;

        cb();
    }

    _flush(cb: TransformCallback): void {
        this.push(this.buffer);

        this.buffer = Buffer.alloc(0);

        cb();
    }
}
