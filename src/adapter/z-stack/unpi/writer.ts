import * as stream from 'node:stream';

import {logger} from '../../../utils/logger';
import {Frame} from './frame';

const NS = 'zh:zstack:unpi:writer';

export class Writer extends stream.Readable {
    public writeFrame(frame: Frame): void {
        const buffer = frame.toBuffer();
        logger.debug(`--> frame [${[...buffer]}]`, NS);
        this.push(buffer);
    }

    public writeBuffer(buffer: Buffer): void {
        logger.debug(`--> buffer [${[...buffer]}]`, NS);
        this.push(buffer);
    }

    public override _read(): void {}
}
