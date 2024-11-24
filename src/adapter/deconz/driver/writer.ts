/* istanbul ignore file */

import * as stream from 'stream';

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

    public _read(): void {}
}

export default Writer;
