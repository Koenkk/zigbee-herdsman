import {
    Writer as UnpiWriter,
    Parser as UnpiParser,
    Frame as UnpiFrame,
} from '../unpi';

import {Wait} from '../utils';

import ZpiObject from './zpiObject';
import {ZpiObjectPayload} from './tstype';
import {Subsystem, Type} from '../unpi/constants';

import SerialPort from 'serialport';
import events from 'events';
import Queue from 'queue';
import Equals from 'fast-deep-equal';

const timeouts = {
    SREQ: 6000,
    reset: 30000,
    default: 10000,
};

const debug = {
    error: require('debug')('zigbee-herdsman:znp:error'),
    timeout: require('debug')('zigbee-herdsman:znp:timeout'),
    log: require('debug')('zigbee-herdsman:znp:log'),
    SREQ: require('debug')('zigbee-herdsman:znp:SREQ'),
    AREQ: require('debug')('zigbee-herdsman:znp:AREQ'),
    SRSP: require('debug')('zigbee-herdsman:znp:SRSP'),
};

interface Waiter {
    type: Type;
    subsystem: Subsystem;
    command: string;
    payload?: ZpiObjectPayload;
    resolve: Function;
    reject: Function;
    // eslint-disable-next-line
    timer?: any;
    timedout: boolean;
};

class Znp extends events.EventEmitter {
    private static instance: Znp;

    private serialPort: SerialPort;
    private unpiWriter: UnpiWriter;
    private unpiParser: UnpiParser;
    private initialized: boolean;
    private queue: Queue;
    private waiters: Waiter[]

    private constructor() {
        super();

        this.initialized = false;
        this.waiters = [];

        this.queue = new Queue();
        this.queue.concurrency = 1;
        this.queue.autostart = true;

        this.onUnpiParsed = this.onUnpiParsed.bind(this);
        this.onUnpiParsedError = this.onUnpiParsedError.bind(this);
        this.onSerialPortClose = this.onSerialPortClose.bind(this);
        this.onSerialPortError = this.onSerialPortError.bind(this);
    }

    private log(type: Type, message: string): void {
        if (type === Type.SRSP) {
            debug.SRSP(message);
        } else if (type === Type.AREQ) {
            debug.AREQ(message);
        } else {
            /* istanbul ignore else */
            if (type === Type.SREQ) {
                debug.SREQ(message);
            } else {
                throw new Error(`Unknown type '${type}'`);
            }
        }
    }

    private onUnpiParsed(frame: UnpiFrame): void {
        try {
            const object = ZpiObject.fromUnpiFrame(frame);
            const message = `<-- ${Subsystem[object.subsystem]} - ${object.command} - ${JSON.stringify(object.payload)}`;
            this.log(object.type, message);
            this.resolveWaiters(object);
            this.emit('received', object);
        } catch (error) {
            debug.error(`Error while parsing to ZpiObject '${error.stack}'`);
        }
    }

    public isInitialized(): boolean {
        return this.initialized;
    }

    private onUnpiParsedError(error: Error): void {
        debug.error(`Got unpi error ${error}`);
    }

    private onSerialPortClose(): void {
        debug.log('Serialport closed');
        this.initialized = false;
        this.emit('close');
    }

    private onSerialPortError(error: Error): void {
        debug.error(`Serialport error: ${error}`);
    }

    public open(path: string, options: {baudRate: number; rtscts: boolean}): Promise<void> {
        debug.log(`Opening with ${path} and ${JSON.stringify(options)}`);
        this.serialPort = new SerialPort(path, {...options, autoOpen: false});

        this.unpiWriter = new UnpiWriter();
        // @ts-ignore
        this.unpiWriter.pipe(this.serialPort);

        this.unpiParser = new UnpiParser();
        this.serialPort.pipe(this.unpiParser);
        this.unpiParser.on('parsed', this.onUnpiParsed);
        this.unpiParser.on('error', this.onUnpiParsedError);

        return new Promise((resolve, reject): void => {
            this.serialPort.open(async (error: object): Promise<void> => {
                if (error) {
                    reject(new Error(`Error while opening serialport '${error}'`));
                    this.initialized = false;
                    this.serialPort.close();
                } else {
                    debug.log('Serialport opened');
                    await this.skipBootloader();
                    this.serialPort.once('close', this.onSerialPortClose);
                    this.serialPort.once('error', this.onSerialPortError);
                    this.initialized = true;
                    resolve();
                }
            });
        });
    }

    private async skipBootloader(): Promise<void> {
        // Send magic byte: https://github.com/Koenkk/zigbee2mqtt/issues/1343 to bootloader
        // and give ZNP 1 second to start.
        const buffer = Buffer.from([0xef]);
        debug.log('Writing skip bootloader payload');
        this.unpiWriter.writeBuffer(buffer);
        await Wait(1000);
    }

    public static getInstance(): Znp {
        if (Znp.instance == null) {
            Znp.instance = new Znp();
        }

        return Znp.instance;
    }

    public close(): Promise<void> {
        return new Promise((resolve, reject): void => {
            if (this.initialized) {
                this.serialPort.flush((): void => {
                    this.serialPort.close((error): void => {
                        this.initialized = false;
                        error == null ?
                            resolve() :
                            reject(new Error(`Error while closing serialport '${error}'`));
                        this.emit('close');
                    });
                });
            } else {
                resolve();
                this.emit('close');
            }
        });

    }

    public request(subsystem: Subsystem, command: string, payload: ZpiObjectPayload): Promise<ZpiObject> {
        if (!this.initialized) {
            throw new Error('Cannot request when znp has not been initialized yet');
        }

        const object = ZpiObject.createRequest(subsystem, command, payload);
        const message = `--> ${Subsystem[object.subsystem]} - ${object.command} - ${JSON.stringify(payload)}`

        return new Promise((resolve, reject): void => {
            this.queue.push(async (resolveQueue): Promise<void> => {
                this.log(object.type, message);

                try {
                    const frame = object.toUnpiFrame();

                    if (object.type === Type.SREQ) {
                        const waiter = this.waitFor(Type.SRSP, object.subsystem, object.command, null, timeouts.SREQ);
                        this.unpiWriter.writeFrame(frame)
                        resolve(await waiter);
                    } else if (object.type === Type.AREQ && object.isResetCommand()) {
                        const waiter = this.waitFor(Type.AREQ, Subsystem.SYS, 'resetInd', null, timeouts.reset);
                        this.queue.splice(1, this.queue.length);
                        this.unpiWriter.writeFrame(frame)
                        resolve(await waiter);
                    } else {
                        /* istanbul ignore else */
                        if (object.type === Type.AREQ) {
                            this.unpiWriter.writeFrame(frame);
                            resolve();
                        } else {
                            throw new Error(`Unknown type '${object.type}'`);
                        }
                    }
                } catch (error) {
                    reject(error);
                } finally {
                    resolveQueue();
                }
            });
        });
    }

    private resolveWaiters(zpiObject: ZpiObject): void {
        for (let index = 0; index < this.waiters.length; index++) {
            const waiter = this.waiters[index];
            const requiredMatch = waiter.type === zpiObject.type && waiter.subsystem == zpiObject.subsystem && waiter.command === zpiObject.command;
            let payloadMatch = true;

            if (waiter.payload) {
                for (let [key, value] of Object.entries(waiter.payload)) {
                    if (!Equals(zpiObject.payload[key], value)) {
                        payloadMatch = false;
                        break;
                    }
                }
            }

            if (waiter.timedout) {
                this.waiters.splice(index, 1);
            } else if (requiredMatch && payloadMatch) {
                clearTimeout(waiter.timer);
                waiter.resolve(zpiObject);
                this.waiters.splice(index, 1);
            }
        }
    }

    public waitFor(type: Type, subsystem: Subsystem, command: string, payload: ZpiObjectPayload, timeout: number = timeouts.default): Promise<ZpiObject> {
        return new Promise((resolve, reject): void => {
            const object: Waiter = {type, subsystem, command, payload, resolve, reject, timedout: false};

            object.timer = setTimeout((): void => {
                const message = `${Type[type]} - ${Subsystem[subsystem]} - ${command} after ${timeout}ms`;
                object.timedout = true;
                debug.timeout(message);
                reject(new Error(message));
            }, timeout);

            this.waiters.push(object);
        });
    }
}

export default Znp;
