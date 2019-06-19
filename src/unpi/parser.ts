import * as stream from 'stream';
import {DataStart, SOF, MinimalMessageLength, PositionLength} from './constants';
import Frame from './frame';

const debug = require('debug')('unpi:parser');

class Parser extends stream.Transform {
    private buffer: number[];

    public constructor() {
        super();
        this.buffer = [];
    }

    public _transform(chunk: Buffer, _: string, cb: Function): void {
        const chunkArray = Array.from(chunk);
        debug(`<-- [${chunkArray}]`);
        this.buffer.push(...chunkArray)
        this.parseNext();
        cb();
    }

    private parseNext(): void {
        debug(`--- parseNext [${this.buffer}]`);
        if (this.buffer[0] == SOF && this.buffer.length >= MinimalMessageLength) {
            const length = this.buffer[PositionLength];
            const fcsPosition = DataStart + length;

            if (this.buffer.length >= fcsPosition) {
                const frameBuffer = this.buffer.slice(0, fcsPosition + 1);

                try {
                    const frame = Frame.fromBuffer(length, fcsPosition, frameBuffer);
                    debug(`--> parsed ${frame}`);
                    this.emit('parsed', frame);
                } catch (error) {
                    debug(`--> error ${error}`);
                    this.emit('error', error);
                }

                this.buffer.splice(0, fcsPosition + 1);
                this.parseNext();
            }
        }
    }
}

export default Parser;
