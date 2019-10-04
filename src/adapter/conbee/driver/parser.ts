import * as stream from 'stream';
// import {DataStart, SOF, MinMessageLength, PositionDataLength} from './constants';
// import Frame from './frame';
import Debug from "debug";

const debug = Debug('zigbee-herdsman:unpi:parser');

class Parser extends stream.Transform {
    private buffer: Buffer;

    public constructor() {
        super();
        this.buffer = Buffer.from([]);
    }

    public _transform(chunk: Buffer, _: string, cb: Function): void {
        // debug(`<-- [${chunk.toJSON().data}]`);

        // if (this.buffer.length === 0 && chunk[0] !== SOF) {
        //     const index = chunk.indexOf(SOF);
        //     if (index != -1) {
        //         chunk = chunk.slice(index);
        //     } else {
        //         chunk = Buffer.alloc(0);
        //     }
        // }

        // this.buffer = Buffer.concat([this.buffer, chunk]);
        // this.parseNext();
        cb();
    }

}

export default Parser;
