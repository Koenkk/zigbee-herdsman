import * as stream from 'stream';
// @ts-ignore
import slip from 'slip';
import Frame from './frame';
import Debug from "debug";

const debug = Debug('zigbee-herdsman:deconz:driver:parser');

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
        debug(`message received: ${message}`);
        this.emit('parsed', message);
    }

    private onError(_: Uint8Array, error: string): void {
        debug(`<-- error '${error}'`);
    }

    public _transform(chunk: Buffer, _: string, cb: Function): void {
        //debug(`<-- [${chunk.toJSON().data}]`);
        this.decoder.decode(chunk);
        //debug(`<-- [${chunk.toJSON().data}]`);
        cb();
    }
}

export default Parser;
