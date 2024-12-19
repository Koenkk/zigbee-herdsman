/* v8 ignore start */

import {Transform, TransformCallback} from 'node:stream';

import slip from 'slip';

import {logger} from '../../../utils/logger';

const NS = 'zh:deconz:driver:parser';

class Parser extends Transform {
    private decoder: slip.Decoder;

    public constructor() {
        super();

        this.onMessage = this.onMessage.bind(this);
        this.onError = this.onError.bind(this);

        this.decoder = new slip.Decoder({
            onMessage: this.onMessage,
            onError: this.onError,
            maxMessageSize: 1000000,
            bufferSize: 2048,
        });
    }

    private onMessage(message: Uint8Array): void {
        //logger.debug(`message received: ${message}`, NS);
        this.emit('parsed', message);
    }

    private onError(_: Uint8Array, error: string): void {
        logger.debug(`<-- error '${error}'`, NS);
    }

    public override _transform(chunk: Buffer, _: string, cb: TransformCallback): void {
        //logger.debug(`<-- [${[...chunk]}]`, NS);
        this.decoder.decode(chunk);
        //logger.debug(`<-- [${[...chunk]}]`, NS);
        cb();
    }
}

export default Parser;
