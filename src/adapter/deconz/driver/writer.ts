/* v8 ignore start */

import * as stream from 'node:stream';

import slip from 'slip';

import {logger} from '../../../utils/logger';
import Frame from './frame';

const NS = 'zh:deconz:driver:writer';

class Writer extends stream.Readable {
    public writeFrame(frame: Frame): void {
        const buffer = slip.encode(frame.toBuffer());
        logger.debug(`--> frame [${[...buffer]}]`, NS);
        this.push(buffer);
    }

    public override _read(): void {}
}

export default Writer;
