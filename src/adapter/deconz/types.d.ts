declare module 'slip' {
    export function encode(data: ArrayLike<Uint8Array> | Buffer, options?: object): Uint8Array;
    export class Decoder {
        constructor(options: {
            maxMessageSize: number;
            bufferSize: number;
            onMessage: (msg: Uint8Array) => void;
            onError: (msgBuffer: Uint8Array, errorMsg: string) => void;
        });

        decode(data: ArrayLike<Uint8Array> | Buffer): Uint8Array;
    }
}
