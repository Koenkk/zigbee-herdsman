import * as stream from 'node:stream';

import {logger} from '../../../utils/logger';
import {DataStart, MinMessageLength, PositionDataLength, SOF} from './constants';
import {Frame} from './frame';

const NS = 'zh:zstack:unpi:parser';

export class Parser extends stream.Transform {
    private buffer: Buffer;

    public constructor() {
        super();
        this.buffer = Buffer.from([]);
    }

    public override _transform(chunk: Buffer, _: string, cb: () => void): void {
        logger.debug(`<-- [${[...chunk]}]`, NS);
        this.buffer = Buffer.concat([this.buffer, chunk]);
        this.parseNext();
        cb();
    }

    private parseNext(): void {
        logger.debug(`--- parseNext [${[...this.buffer]}]`, NS);

        if (this.buffer.length !== 0 && this.buffer.readUInt8(0) !== SOF) {
            // Buffer doesn't start with SOF, skip till SOF.
            const index = this.buffer.indexOf(SOF);
            if (index !== -1) {
                this.buffer = this.buffer.slice(index, this.buffer.length);
            }
        }

        if (this.buffer.length >= MinMessageLength && this.buffer.readUInt8(0) == SOF) {
            const dataLength = this.buffer[PositionDataLength];
            const fcsPosition = DataStart + dataLength;
            const frameLength = fcsPosition + 1;

            if (this.buffer.length >= frameLength) {
                const frameBuffer = this.buffer.slice(0, frameLength);

                try {
                    const frame = Frame.fromBuffer(dataLength, fcsPosition, frameBuffer);
                    logger.debug(`--> parsed ${frame}`, NS);
                    this.emit('parsed', frame);
                } catch (error) {
                    logger.debug(`--> error ${error}`, NS);
                }

                this.buffer = this.buffer.slice(frameLength, this.buffer.length);
                this.parseNext();
            }
        }
    }
}
