import * as stream from 'stream';
import {DataStart, SOF, MinimalMessageLength, PositionLength} from './constants';
import Frame from './frame';

class Parser extends stream.Transform {
    private buffer: Array<number>;

    constructor() {
      super();
      this.buffer = [];
    }

    public _transform(chunk: Buffer, _: String, cb: Function) {
        Array.from(chunk).map(byte => this.buffer.push(byte));
        this.parseNext();
        cb();
    }

    private parseNext() {
        if (this.buffer[0] == SOF && this.buffer.length >= MinimalMessageLength) {
            const length = this.buffer[PositionLength];
            const fcsPosition = DataStart + length;

            if (this.buffer.length >= fcsPosition) {
                const frameBuffer = this.buffer.slice(0, fcsPosition + 1);

                try {
                    const frame = Frame.fromBuffer(length, fcsPosition, frameBuffer);
                    this.emit('parsed', frame);
                } catch (error) {
                    this.emit('error', error);
                }

                this.buffer.splice(0, fcsPosition + 1);
                this.parseNext();
            }
        }
    }
}

export default Parser;
