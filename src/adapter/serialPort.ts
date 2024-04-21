/* istanbul ignore file */
/* eslint-disable max-len */
/* eslint-disable @typescript-eslint/semi */
// This file was copied from https://github.com/serialport/node-serialport/blob/master/packages/serialport/lib/serialport.ts.
import {ErrorCallback, OpenOptions, SerialPortStream, StreamOptions} from '@serialport/stream';
import {autoDetect, AutoDetectTypes, OpenOptionsFromBinding} from '@serialport/bindings-cpp';

const DetectedBinding = autoDetect();

export type SerialPortOpenOptions<T extends AutoDetectTypes> = Omit<StreamOptions<T>, 'binding'> & OpenOptionsFromBinding<T>

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
        return new Promise((resolve, reject): void => {
            this.open((err): void => (err ? reject(err) : resolve()));
        });
    }

    public async asyncClose(): Promise<void> {
        return new Promise((resolve, reject): void => {
            this.close((err): void => (err ? reject(err) : resolve()));
        });
    }

    public async asyncFlush(): Promise<void> {
        return new Promise((resolve, reject): void => {
            this.flush((err): void => (err ? reject(err) : resolve()));
        });
    }

    public async asyncFlushAndClose(): Promise<void> {
        await this.asyncFlush();
        await this.asyncClose();
    }

    public async asyncGet(): Promise<object> {
        return new Promise((resolve, reject): void => {
            this.get((err, options?): void => (err ? reject(err) : resolve(options)));
        })
    }
}
