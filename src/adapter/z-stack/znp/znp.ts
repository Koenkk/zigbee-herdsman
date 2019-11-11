import {
    Writer as UnpiWriter,
    Parser as UnpiParser,
    Frame as UnpiFrame,
} from '../unpi';

import {Wait, Queue, Waitress, RealpathSync} from '../../../utils';

import SerialPortUtils from '../../serialPortUtils';
import SocketPortUtils from '../../socketPortUtils';

import ZpiObject from './zpiObject';
import {ZpiObjectPayload} from './tstype';
import {Subsystem, Type} from '../unpi/constants';

import SerialPort from 'serialport';
import net from 'net';
import events from 'events';
import Equals from 'fast-deep-equal';
import Debug from "debug";

const timeouts = {
    SREQ: 6000,
    reset: 30000,
    default: 10000,
};

const debug = {
    error: Debug('zigbee-herdsman:adapter:zStack:znp:error'),
    timeout: Debug('zigbee-herdsman:adapter:zStack:znp:timeout'),
    log: Debug('zigbee-herdsman:adapter:zStack:znp:log'),
    SREQ: Debug('zigbee-herdsman:adapter:zStack:znp:SREQ'),
    AREQ: Debug('zigbee-herdsman:adapter:zStack:znp:AREQ'),
    SRSP: Debug('zigbee-herdsman:adapter:zStack:znp:SRSP'),
};

interface WaitressMatcher {
    type: Type;
    subsystem: Subsystem;
    command: string;
    payload?: ZpiObjectPayload;
};

const autoDetectDefinitions = [
    {manufacturer: 'Texas Instruments', vendorId: '0451', productId: '16a8'}, // CC2531
    {manufacturer: 'Texas Instruments', vendorId: '0451', productId: 'bef3'}, // CC1352P_2 and CC26X2R1
];

class Znp extends events.EventEmitter {
    private path: string;
    private baudRate: number;
    private rtscts: boolean;
    private useTCP = false;

    private serialPort: SerialPort;
    private socketPort: net.Socket;
    private unpiWriter: UnpiWriter;
    private unpiParser: UnpiParser;
    private initialized: boolean;
    private queue: Queue;
    private waitress: Waitress<ZpiObject, WaitressMatcher>;

    public constructor(path: string, baudRate: number, rtscts: boolean) {
        super();

        this.baudRate = baudRate;
        this.rtscts = rtscts;

        if (SocketPortUtils.isTcp(path)) {
            this.useTCP = true;
            // keep path unchanged
            this.path = path;
        }
        else {
            this.path = RealpathSync(path);
        }
        
        this.initialized = false;

        this.queue = new Queue();
        this.waitress = new Waitress<ZpiObject, WaitressMatcher>(this.waitressValidator, this.waitressTimeoutFormatter);

        this.onUnpiParsed = this.onUnpiParsed.bind(this);
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
            const message =
                `<-- ${Subsystem[object.subsystem]} - ${object.command} - ${JSON.stringify(object.payload)}`;
            this.log(object.type, message);
            this.waitress.resolve(object);
            this.emit('received', object);
        } catch (error) {
            debug.error(`Error while parsing to ZpiObject '${error.stack}'`);
        }
    }

    public isInitialized(): boolean {
        return this.initialized;
    }

    private onSerialPortClose(): void {
        debug.log('Serialport closed');
        this.initialized = false;
        this.emit('close');
    }

    private onSerialPortError(error: Error): void {
        debug.error(`Serialport error: ${error}`);
    }

    public async open(): Promise<void> {
        if (this.useTCP) {
            // this parameter is a work-around 
            // because eslint won't accept local variable with 'this'
            // this is needed for .on methods inside Promise
            return this.openSocket(this);
        }
        else {
            return this.openSerial();
        }
    }

    public async openSerial(): Promise<void> {
        const options = {baudRate: this.baudRate, rtscts: this.rtscts, autoOpen: false};

        debug.log(`Opening with ${this.path} and ${JSON.stringify(options)}`);
        this.serialPort = new SerialPort(this.path, options);

        this.unpiWriter = new UnpiWriter();
        // @ts-ignore
        this.unpiWriter.pipe(this.serialPort);

        this.unpiParser = new UnpiParser();
        this.serialPort.pipe(this.unpiParser);
        this.unpiParser.on('parsed', this.onUnpiParsed);

        return new Promise((resolve, reject): void => {
            this.serialPort.open(async (error: object): Promise<void> => {
                if (error) {
                    reject(new Error(`Error while opening serialport '${error}'`));
                    this.initialized = false;
                    if (this.serialPort.isOpen) {
                        this.serialPort.close();
                    }
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

    public async openSocket(znpObject: Znp): Promise<void> {
        if (!SocketPortUtils.isValidTcpPath(this.path)) {
            return new Promise((resolve, reject): void => {
                reject(new Error(`Invalid tcp path: '${this.path}'`));
            });            
        }

        const host = SocketPortUtils.getHost(this.path);
        const port = SocketPortUtils.getPort(this.path);  
        debug.log(`Opening tcp socket with ${host}:${port}`);

        this.socketPort = new net.Socket();
        this.socketPort.setNoDelay(true);

        this.unpiWriter = new UnpiWriter();
        this.unpiParser = new UnpiParser();

        this.unpiParser.on('parsed', this.onUnpiParsed);


        this.unpiWriter.pipe(this.socketPort);
        this.socketPort.pipe(this.unpiParser);

        return new Promise((resolve, reject): void => {
            znpObject.socketPort.connect(port, host);

            znpObject.socketPort.on('connect', function() {
                debug.log('Socket connected');
            });

            znpObject.socketPort.on('ready', async function() {
                debug.log('Socket ready');
                await znpObject.skipBootloader();
                znpObject.initialized = true;
                resolve();
            });

            this.socketPort.on('error', function () {
                debug.log('Socket error');
                reject(new Error(`Error while opening socket`));
                znpObject.initialized = false;
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

    public static async isValidPath(path: string): Promise<boolean> {
 
        if (SocketPortUtils.isTcp(path)) {
            return false;
        }
        return SerialPortUtils.is(RealpathSync(path), autoDetectDefinitions);
    }

    public static async autoDetectPath(): Promise<string> {
        const paths = await SerialPortUtils.find(autoDetectDefinitions);

        // CC1352P_2 and CC26X2R1 lists as 2 USB devices with same manufacturer, productId and vendorId
        // one is the actual chip interface, other is the XDS110.
        // The chip is always exposed on the first one after alphabetical sorting.
        paths.sort((a, b) => (a < b) ? -1 : 1);

        return paths.length > 0 ? paths[0] : null;
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

    public request(
        subsystem: Subsystem, command: string, payload: ZpiObjectPayload, expectedStatus: number[] = [0]
    ): Promise<ZpiObject> {
        if (!this.initialized) {
            throw new Error('Cannot request when znp has not been initialized yet');
        }

        const object = ZpiObject.createRequest(subsystem, command, payload);
        const message = `--> ${Subsystem[object.subsystem]} - ${object.command} - ${JSON.stringify(payload)}`;

        return this.queue.execute<ZpiObject>(async (): Promise<ZpiObject> => {
            this.log(object.type, message);

            const frame = object.toUnpiFrame();

            if (object.type === Type.SREQ) {
                const timeout = object.command === 'bdbStartCommissioning' || object.command === 'startupFromApp' ?
                    20000 : timeouts.SREQ;
                const waiter = this.waitress.waitFor(
                    {type: Type.SRSP, subsystem: object.subsystem, command: object.command}, timeout
                );
                this.unpiWriter.writeFrame(frame);
                const result = await waiter.promise;
                if (result && result.payload.hasOwnProperty('status') &&
                    !expectedStatus.includes(result.payload.status)) {
                    throw new Error(
                        `SREQ '${message}' failed with status '${result.payload.status}' (expected '${expectedStatus}')`
                    );
                } else {
                    return result;
                }
            } else if (object.type === Type.AREQ && object.isResetCommand()) {
                const waiter = this.waitress.waitFor(
                    {type: Type.AREQ, subsystem: Subsystem.SYS, command: 'resetInd'}, timeouts.reset
                );
                this.queue.clear();
                this.unpiWriter.writeFrame(frame);
                return waiter.promise;
            } else {
                /* istanbul ignore else */
                if (object.type === Type.AREQ) {
                    this.unpiWriter.writeFrame(frame);
                    return undefined;
                } else {
                    throw new Error(`Unknown type '${object.type}'`);
                }
            }
        });
    }

    private waitressTimeoutFormatter(matcher: WaitressMatcher, timeout: number): string {
        return `${Type[matcher.type]} - ${Subsystem[matcher.subsystem]} - ${matcher.command} after ${timeout}ms`;
    }

    public waitFor(
        type: Type, subsystem: Subsystem, command: string, payload: ZpiObjectPayload = {},
        timeout: number = timeouts.default
    ): {promise: Promise<ZpiObject>; ID: number} {
        return this.waitress.waitFor({type, subsystem, command, payload}, timeout);
    }

    public removeWaitFor(ID: number): void {
        this.waitress.remove(ID);
    }

    private waitressValidator(zpiObject: ZpiObject, matcher: WaitressMatcher): boolean {
        const requiredMatch = matcher.type === zpiObject.type && matcher.subsystem == zpiObject.subsystem &&
            matcher.command === zpiObject.command;
        let payloadMatch = true;

        if (matcher.payload) {
            for (const [key, value] of Object.entries(matcher.payload)) {
                if (!Equals(zpiObject.payload[key], value)) {
                    payloadMatch = false;
                    break;
                }
            }
        }

        return requiredMatch && payloadMatch;
    }
}

export default Znp;
