import * as stream from 'stream';
import {DataStart, SOF, MinMessageLength, PositionDataLength} from './constants';
import Frame from './frame';

const debug = require('debug')('unpi:parser');

class Parser extends stream.Transform {
    private buffer: Buffer;

    public constructor() {
        super();
        this.buffer = Buffer.from([]);
    }

    public _transform(chunk: Buffer, _: string, cb: Function): void {
        debug(`<-- [${chunk.toJSON().data}]`);
        this.buffer = Buffer.concat([this.buffer, chunk]);
        this.parseNext();
        cb();
    }

    private parseNext(): void {
        debug(`--- parseNext [${this.buffer.toJSON().data}]`);
        if (this.buffer.length >= MinMessageLength && this.buffer.readUInt8(0) == SOF) {
            const dataLength = this.buffer[PositionDataLength];
            const fcsPosition = DataStart + dataLength;
            const frameLength = fcsPosition + 1;

            if (this.buffer.length >= frameLength) {
                const frameBuffer = this.buffer.slice(0, frameLength);

                try {
                    const frame = Frame.fromBuffer(dataLength, fcsPosition, frameBuffer);
                    debug(`--> parsed ${frame}`);
                    this.emit('parsed', frame);
                } catch (error) {
                    debug(`--> error ${error}`);
                    this.emit('error', error);
                }

                this.buffer = this.buffer.slice(frameLength, this.buffer.length);
                this.parseNext();
            }
        }
    }
}

export default Parser;
