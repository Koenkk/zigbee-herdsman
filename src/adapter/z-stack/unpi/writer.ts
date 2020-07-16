import * as stream from 'stream';
import Frame from './frame';
import Debug from "debug";

const debug = Debug('zigbee-herdsman:adapter:zStack:unpi:writer');

class Writer extends stream.Readable {
    public writeFrame(frame: Frame): void {
        const buffer = frame.toBuffer();
        debug(`--> frame [${[...buffer]}]`);
        this.push(buffer);
    }

    public writeBuffer(buffer: Buffer): void {
        debug(`--> buffer [${[...buffer]}]`);
        this.push(buffer);
    }

    public _read(): void {}
}

export default Writer;
