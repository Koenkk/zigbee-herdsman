import {
    Writer as UnpiWriter,
    Parser as UnpiParser,
    Frame as UnpiFrame,
} from '../unpi';

import {wait} from '../utils';

import ZpiObject from './zpiObject';
import {ZpiObjectPayload} from './tstype';
import {Subsystem, Type} from '../unpi/constants';

import SerialPort from 'serialport';
import events from 'events';
import Queue from 'queue';

const timeouts = {
    SREQ: 6000,
    reset: 30000,
};

const debug = {
    error: require('debug')('znp:error'),
    timeout: require('debug')('znp:timeout'),
    log: require('debug')('znp:log'),
    SREQ: require('debug')('znp:SREQ'),
    AREQ: require('debug')('znp:AREQ'),
    SRSP: require('debug')('znp:SRSP'),
};

class Znp extends events.EventEmitter {
    private static instance: Znp;

    private serialPort: SerialPort;
    private unpiWriter: UnpiWriter;
    private unpiParser: UnpiParser;
    private initialized: boolean;
    private queue: Queue;

    private constructor() {
        super();

        this.initialized = false;

        this.queue = new Queue();
        this.queue.concurrency = 1;
        this.queue.autostart = true;

        this.onUnpiParsed = this.onUnpiParsed.bind(this);
        this.onUnpiError = this.onUnpiError.bind(this);
        this.onSerialPortClose = this.onSerialPortClose.bind(this);
        this.onSerialPortError = this.onSerialPortError.bind(this);
    }

    private log(type: Type, message: string): void {
        if (type === Type.SRSP) {
            debug.SRSP(message);
        } else if (type === Type.AREQ) {
            debug.AREQ(message);
        } else if (type === Type.SREQ) {
            debug.SREQ(message);
        }
    }

    private onUnpiParsed(frame: UnpiFrame): void {
        try {
            const object = ZpiObject.fromUnpiFrame(frame);
            const message = `<-- ${Subsystem[object.subsystem]} - ${object.command} - ${JSON.stringify(object.payload)}`;
            this.log(object.type, message);
            this.emit('received', object);
        } catch (error) {
            debug.error(`Error while parsing to ZpiObject '${error}'`);
        }
    }

    private onUnpiError(error: Error): void {
        debug.error(`Got unpi error ${error}`);
    }

    private onSerialPortClose(): void {
        debug.log('Serialport closed');
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
        this.unpiParser.on('error', this.onUnpiError);

        return new Promise((resolve, reject): void => {
            this.serialPort.open(async (error: object): Promise<void> => {
                if (error) {
                    reject(`Error while opening serialport '${error}'`);
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

        return new Promise((resolve, reject): void => {
            debug.log('Writing skip bootloader payload');
            this.serialPort.write(buffer, async (error): Promise<void> => {
                if (error) {
                    reject(`Error while sending skip bootloader payload '${error}'`);
                } else {
                    await wait(1000);
                    resolve();
                }
            });
        });
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
                        error == null ?
                            resolve() :
                            reject(`Error while closing serialport '${error}'`);
                    });
                });
            } else {
                resolve();
            }
        });

    }

    private waitForWithExecute(type: Type, subsystem: Subsystem, command: string, timeout: number, execute: (() => void)): Promise<ZpiObject> {
        return new Promise((resolve, reject): void => {
            let timedOut = false;

            const timer = setTimeout((): void => {
                const message = `${Type[type]} - ${Subsystem[subsystem]} - ${command} after ${timeout}ms`;
                timedOut = true;
                debug.timeout(message);
                reject('timeout');
            }, timeout);

            const registerHandler = (): void => {
                this.once('received', (received: ZpiObject): void => {
                    if (!timedOut) {
                        if (subsystem === received.subsystem && type == received.type &&
                            command === received.command) {
                            clearTimeout(timer);
                            resolve(received);
                        } else {
                            registerHandler();
                        }
                    }
                });
            }

            registerHandler();

            execute();
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
                    const execute = (): void => this.unpiWriter.writeFrame(frame);

                    if (object.type === Type.SREQ) {
                        const result = await this.waitForWithExecute(Type.SRSP, object.subsystem, object.command, timeouts.SREQ, execute);
                        resolve(result);
                    } else if (object.type === Type.AREQ && object.isResetCommand()) {
                        const result = await this.waitForWithExecute(Type.AREQ, Subsystem.SYS, 'resetInd', timeouts.reset, execute);
                        this.queue.splice(1, this.queue.length);
                        resolve(result);
                    } else if (object.type === Type.AREQ) {
                        execute();
                        resolve();
                    }
                } catch (error) {
                    reject(error);
                } finally {
                    resolveQueue();
                }
            });
        });
    }
}

export default Znp;
