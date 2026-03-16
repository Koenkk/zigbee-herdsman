/* v8 ignore start */

import {platform} from "node:os";
import {type AutoDetectTypes, autoDetect, type OpenOptionsFromBinding, type SetOptions} from "@serialport/bindings-cpp";
// This file was copied from https://github.com/serialport/node-serialport/blob/master/packages/serialport/lib/serialport.ts.
import {type ErrorCallback, type OpenOptions, SerialPortStream, type StreamOptions} from "@serialport/stream";

const DetectedBinding = autoDetect();

export type SerialPortOpenOptions<T extends AutoDetectTypes> = Omit<StreamOptions<T>, "binding"> & OpenOptionsFromBinding<T>;

export class SerialPort<T extends AutoDetectTypes = AutoDetectTypes> extends SerialPortStream<T> {
    static list = DetectedBinding.list;
    static readonly binding = DetectedBinding;

    constructor(options: SerialPortOpenOptions<T>, openCallback?: ErrorCallback) {
        const opts: OpenOptions<T> = {
            binding: DetectedBinding as T,
            ...options,
        };

        if (platform() === "win32") {
            // this controls `DTR` on "open", whereas on Unix, it's on "close"
            // https://github.com/serialport/bindings-cpp/blob/19820c39fbbedc1b5f09d6508b5ef1268df3d455/src/serialport_win.cpp#L123-L127
            // https://github.com/serialport/bindings-cpp/blob/19820c39fbbedc1b5f09d6508b5ef1268df3d455/src/serialport_unix.cpp#L254-L256
            opts.hupcl = false;
        }

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
            // biome-ignore lint/style/noNonNullAssertion: ignored using `--suppress`
            this.get((err, options?) => (err ? reject(err) : resolve(options!)));
        });
    }

    public async asyncSet(options: SetOptions): Promise<void> {
        return await new Promise((resolve, reject): void => {
            this.set(options, (err) => (err ? reject(err) : resolve()));
        });
    }
}
