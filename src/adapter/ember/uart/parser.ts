/* v8 ignore start */

import {Transform, TransformCallback, TransformOptions} from 'node:stream';

// import {logger} from '../../../utils/logger';
import {AshReservedByte} from './enums';

// const NS = 'zh:ember:uart:ash:parser';

export class AshParser extends Transform {
    private buffer: Buffer;

    public constructor(opts?: TransformOptions) {
        super(opts);

        this.buffer = Buffer.alloc(0);
    }

    override _transform(chunk: Buffer, encoding: BufferEncoding, cb: TransformCallback): void {
        let data = Buffer.concat([this.buffer, chunk]);
        let position: number;

        while ((position = data.indexOf(AshReservedByte.FLAG)) !== -1) {
            // emit the frame via 'data' event
            const frame = data.subarray(0, position + 1);

            // expensive and very verbose, enable locally only if necessary
            // logger.debug(`<<<< [FRAME raw=${frame.toString('hex')}]`, NS);
            this.push(frame);

            // remove the frame from internal buffer (set below)
            data = data.subarray(position + 1);
        }

        this.buffer = data;

        cb();
    }

    override _flush(cb: TransformCallback): void {
        this.push(this.buffer);

        this.buffer = Buffer.alloc(0);

        cb();
    }
}
