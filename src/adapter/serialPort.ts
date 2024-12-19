/* v8 ignore start */

import {autoDetect, AutoDetectTypes, OpenOptionsFromBinding, SetOptions} from '@serialport/bindings-cpp';
// This file was copied from https://github.com/serialport/node-serialport/blob/master/packages/serialport/lib/serialport.ts.
import {ErrorCallback, OpenOptions, SerialPortStream, StreamOptions} from '@serialport/stream';

const DetectedBinding = autoDetect();

export type SerialPortOpenOptions<T extends AutoDetectTypes> = Omit<StreamOptions<T>, 'binding'> & OpenOptionsFromBinding<T>;

export class SerialPort<T extends AutoDetectTypes = AutoDetectTypes> extends SerialPortStream<T> {
    static list = DetectedBinding.list;
    static readonly binding = DetectedBinding;

    constructor(options: SerialPortOpenOptions<T>, openCallback?: ErrorCallback) {
        const opts: OpenOptions<T> = {
            binding: DetectedBinding as T,
            ...options,
        };
        super(opts, openCallback);
    }

    public async asyncOpen(): Promise<void> {
        return await new Promise((resolve, reject): void => {
            this.open((err) => (err ? reject(err) : resolve()));
        });
    }

    public async asyncClose(): Promise<void> {
        return await new Promise((resolve, reject): void => {
            this.close((err) => (err ? reject(err) : resolve()));
        });
    }

    public async asyncFlush(): Promise<void> {
        return await new Promise((resolve, reject): void => {
            this.flush((err) => (err ? reject(err) : resolve()));
        });
    }

    public async asyncFlushAndClose(): Promise<void> {
        await this.asyncFlush();
        await this.asyncClose();
    }

    public async asyncGet(): Promise<{cts: boolean; dsr: boolean; dcd: boolean}> {
        return await new Promise((resolve, reject): void => {
            this.get((err, options?) => (err ? reject(err) : resolve(options!)));
        });
    }

    public async asyncSet(options: SetOptions): Promise<void> {
        return await new Promise((resolve, reject): void => {
            this.set(options, (err) => (err ? reject(err) : resolve()));
        });
    }
}
