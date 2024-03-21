import * as stream from 'stream';
import Frame from './frame';
import {logger} from '../../../utils/logger';

class Writer extends stream.Readable {
    public writeFrame(frame: Frame): void {
        const buffer = frame.toBuffer();
        logger.debug(`--> frame [${[...buffer]}]`, 'zigbee-herdsman:zstack:unpi:writer');
        this.push(buffer);
    }

    public writeBuffer(buffer: Buffer): void {
        logger.debug(`--> buffer [${[...buffer]}]`, 'zigbee-herdsman:zstack:unpi:writer');
        this.push(buffer);
    }

    public _read(): void {}
}

export default Writer;
