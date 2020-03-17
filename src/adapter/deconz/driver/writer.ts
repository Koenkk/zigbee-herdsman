/* istanbul ignore file */
/* eslint-disable */
import * as stream from 'stream';
import Frame from './frame';
// @ts-ignore
import slip from 'slip';
import Debug from "debug";

const debug = Debug('zigbee-herdsman:deconz:driver:writer');

class Writer extends stream.Readable {
    public writeFrame(frame: Frame): void {
        const buffer = slip.encode(frame.toBuffer());
        debug(`--> frame [${buffer.toJSON().data}]`);
        this.push(buffer);
    }

    public _read(): void {}
}

export default Writer;
