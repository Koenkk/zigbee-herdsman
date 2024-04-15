/* istanbul ignore file */
/* eslint-disable */
import * as stream from 'stream';
// @ts-ignore
import slip from 'slip';
import Frame from './frame';
import {logger} from '../../../utils/logger';

const NS = 'zh:deconz:driver:parser';

class Parser extends stream.Transform {
    private buffer: Buffer;
    private decoder: slip.Decoder;

    public constructor() {
        super();

        this.onMessage = this.onMessage.bind(this);
        this.onError = this.onError.bind(this);

        this.decoder = new slip.Decoder({
            onMessage: this.onMessage,
            maxMessageSize: 1000000,
            bufferSize: 2048
        });
    }

    private onMessage(message: Uint8Array): void {
        //logger.debug(`message received: ${message}`, NS);
        this.emit('parsed', message);
    }

    private onError(_: Uint8Array, error: string): void {
        logger.debug(`<-- error '${error}'`, NS);
    }

    public _transform(chunk: Buffer, _: string, cb: Function): void {
        //logger.debug(`<-- [${[...chunk]}]`, NS);
        this.decoder.decode(chunk);
        //logger.debug(`<-- [${[...chunk]}]`, NS);
        cb();
    }
}

export default Parser;
