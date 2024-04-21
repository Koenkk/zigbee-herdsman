import {
    Writer as UnpiWriter,
    Parser as UnpiParser,
    Frame as UnpiFrame,
} from '../unpi';

import {Wait, Queue, Waitress, RealpathSync} from '../../../utils';

import {SerialPort} from '../../serialPort';
import SerialPortUtils from '../../serialPortUtils';
import SocketPortUtils from '../../socketPortUtils';

import * as Constants from '../constants';

import ZpiObject from './zpiObject';
import {ZpiObjectPayload} from './tstype';
import {Subsystem, Type} from '../unpi/constants';

import net from 'net';
import events from 'events';
import Equals from 'fast-deep-equal/es6';
import {logger} from '../../../utils/logger';

const {COMMON: {ZnpCommandStatus}, Utils: {statusDescription}} = Constants;

const timeouts = {
    SREQ: 6000,
    reset: 30000,
    default: 10000,
};

const NS = 'zh:zstack:znp';

interface WaitressMatcher {
    type: Type;
    subsystem: Subsystem;
    command: string;
    payload?: ZpiObjectPayload;
}

const autoDetectDefinitions = [
    {manufacturer: 'Texas Instruments', vendorId: '0451', productId: '16c8'}, // CC2538
    {manufacturer: 'Texas Instruments', vendorId: '0451', productId: '16a8'}, // CC2531
    {manufacturer: 'Texas Instruments', vendorId: '0451', productId: 'bef3'}, // CC1352P_2 and CC26X2R1
    {manufacturer: 'Electrolama', vendorId: '0403', productId: '6015'}, // ZZH
];

class Znp extends events.EventEmitter {
    private path: string;
    private baudRate: number;
    private rtscts: boolean;

    private portType: 'serial' | 'socket';
    private serialPort: SerialPort;
    private socketPort: net.Socket;
    private unpiWriter: UnpiWriter;
    private unpiParser: UnpiParser;
    private initialized: boolean;
    private queue: Queue;
    private waitress: Waitress<ZpiObject, WaitressMatcher>;

    public constructor(path: string, baudRate: number, rtscts: boolean) {
        super();

        this.path = path;
        this.baudRate = typeof baudRate === 'number' ? baudRate : 115200;
        this.rtscts = typeof rtscts === 'boolean' ? rtscts : false;
        this.portType = SocketPortUtils.isTcpPath(path) ? 'socket' : 'serial';

        this.initialized = false;

        this.queue = new Queue();
        this.waitress = new Waitress<ZpiObject, WaitressMatcher>(this.waitressValidator, this.waitressTimeoutFormatter);
    }

    private log(type: Type, message: string): void {
        if (type === Type.SRSP) {
            logger.debug(`SRSP: ${message}`, NS);
        } else if (type === Type.AREQ) {
            logger.debug(`AREQ: ${message}`, NS);
        } else {
            /* istanbul ignore else */
            if (type === Type.SREQ) {
                logger.debug(`SREQ: ${message}`, NS);
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
            logger.error(`Error while parsing to ZpiObject '${error.stack}'`, NS);
        }
    }

    public isInitialized(): boolean {
        return this.initialized;
    }

    private onPortError(error: Error): void {
        logger.error(`Port error: ${error}`, NS);
    }

    private onPortClose(): void {
        logger.info('Port closed', NS);
        this.initialized = false;
        this.emit('close');
    }

    public async open(): Promise<void> {
        return this.portType === 'serial' ? this.openSerialPort() : this.openSocketPort();
    }

    private async openSerialPort(): Promise<void> {
        const options = {path: this.path, baudRate: this.baudRate, rtscts: this.rtscts, autoOpen: false};

        logger.info(`Opening SerialPort with ${JSON.stringify(options)}`, NS);
        this.serialPort = new SerialPort(options);

        this.unpiWriter = new UnpiWriter();
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        this.unpiWriter.pipe(this.serialPort);

        this.unpiParser = new UnpiParser();
        this.serialPort.pipe(this.unpiParser);
        this.unpiParser.on('parsed', this.onUnpiParsed.bind(this));

        try {
            await this.serialPort.asyncOpen();
            logger.info('Serialport opened', NS);

            this.serialPort.once('close', this.onPortClose.bind(this));
            this.serialPort.once('error', this.onPortError.bind(this));

            this.initialized = true;

            await this.skipBootloader();
        } catch (error) {
            this.initialized = false;

            if (this.serialPort.isOpen) {
                this.serialPort.close();
            }

            throw error;
        }
    }

    private async openSocketPort(): Promise<void> {
        const info = SocketPortUtils.parseTcpPath(this.path);
        logger.info(`Opening TCP socket with ${info.host}:${info.port}`, NS);

        this.socketPort = new net.Socket();
        this.socketPort.setNoDelay(true);
        this.socketPort.setKeepAlive(true, 15000);

        this.unpiWriter = new UnpiWriter();
        this.unpiWriter.pipe(this.socketPort);

        this.unpiParser = new UnpiParser();
        this.socketPort.pipe(this.unpiParser);
        this.unpiParser.on('parsed', this.onUnpiParsed.bind(this));

        return new Promise((resolve, reject): void => {
            this.socketPort.on('connect', function() {
                logger.info('Socket connected', NS);
            });

            // eslint-disable-next-line
            const self = this;
            this.socketPort.on('ready', async function() {
                logger.info('Socket ready', NS);
                await self.skipBootloader();
                self.initialized = true;
                resolve();
            });

            this.socketPort.once('close', this.onPortClose.bind(this));

            this.socketPort.on('error', function () {
                logger.info('Socket error', NS);
                reject(new Error(`Error while opening socket`));
                self.initialized = false;
            });

            this.socketPort.connect(info.port, info.host);
        });
    }

    private async skipBootloader(): Promise<void> {
        try {
            await this.request(Subsystem.SYS, 'ping', {capabilities: 1}, null, 250);
        } catch (error) {
            // Skip bootloader on CC2530/CC2531
            // Send magic byte: https://github.com/Koenkk/zigbee2mqtt/issues/1343 to bootloader
            // and give ZNP 1 second to start.
            try {
                logger.info('Writing CC2530/CC2531 skip bootloader payload', NS);
                this.unpiWriter.writeBuffer(Buffer.from([0xef]));
                await Wait(1000);
                await this.request(Subsystem.SYS, 'ping', {capabilities: 1}, null, 250);
            } catch (error) {
                // Skip bootloader on some CC2652 devices (e.g. zzh-p)
                logger.info('Skip bootloader for CC2652/CC1352', NS);
                if (this.serialPort) {
                    await this.setSerialPortOptions({dtr: false, rts: false});
                    await Wait(150);
                    await this.setSerialPortOptions({dtr: false, rts: true});
                    await Wait(150);
                    await this.setSerialPortOptions({dtr: false, rts: false});
                    await Wait(150);
                }
            }
        }
    }

    private async setSerialPortOptions(options: {dtr?: boolean; rts?: boolean}): Promise<void> {
        return new Promise((resolve): void => {
            this.serialPort.set(options, () => {
                resolve();
            });
        });
    }

    public static async isValidPath(path: string): Promise<boolean> {
        // For TCP paths we cannot get device information, therefore we cannot validate it.
        if (SocketPortUtils.isTcpPath(path)) {
            return false;
        }

        try {
            return SerialPortUtils.is(RealpathSync(path), autoDetectDefinitions);
        } catch (error) {
            logger.error(`Failed to determine if path is valid: '${error}'`, NS);
            return false;
        }
    }

    public static async autoDetectPath(): Promise<string> {
        const paths = await SerialPortUtils.find(autoDetectDefinitions);

        // CC1352P_2 and CC26X2R1 lists as 2 USB devices with same manufacturer, productId and vendorId
        // one is the actual chip interface, other is the XDS110.
        // The chip is always exposed on the first one after alphabetical sorting.
        paths.sort((a, b) => (a < b) ? -1 : 1);

        return paths.length > 0 ? paths[0] : null;
    }

    public async close(): Promise<void> {
        logger.info('closing', NS);
        this.queue.clear();

        if (this.initialized) {
            this.initialized = false;

            if (this.portType === 'serial') {
                try {
                    await this.serialPort.asyncFlushAndClose();
                } catch (error) {
                    this.emit('close');

                    throw error;
                }
            } else {
                this.socketPort.destroy();
            }
        }

        this.emit('close');
    }

    public request(
        subsystem: Subsystem, command: string, payload: ZpiObjectPayload, waiterID: number = null,
        timeout: number = null, expectedStatuses: Constants.COMMON.ZnpCommandStatus[] = [ZnpCommandStatus.SUCCESS]
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
                const t = object.command === 'bdbStartCommissioning' || object.command === 'startupFromApp' ?
                    40000 : timeouts.SREQ;
                const waiter = this.waitress.waitFor(
                    {type: Type.SRSP, subsystem: object.subsystem, command: object.command}, timeout || t
                );
                this.unpiWriter.writeFrame(frame);
                const result = await waiter.start().promise;
                if (result && result.payload.hasOwnProperty('status') &&
                    !expectedStatuses.includes(result.payload.status)) {

                    if (typeof waiterID === 'number') {
                        this.waitress.remove(waiterID);
                    }

                    throw new Error(
                        `SREQ '${message}' failed with status '${
                            statusDescription(result.payload.status)
                        }' (expected '${expectedStatuses.map(statusDescription)}')`
                    );
                } else {
                    return result;
                }
            } else if (object.type === Type.AREQ && object.isResetCommand()) {
                const waiter = this.waitress.waitFor(
                    {type: Type.AREQ, subsystem: Subsystem.SYS, command: 'resetInd'}, timeout || timeouts.reset
                );
                this.queue.clear();
                this.unpiWriter.writeFrame(frame);
                return waiter.start().promise;
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
    ): {start: () => {promise: Promise<ZpiObject>; ID: number}; ID: number} {
        return this.waitress.waitFor({type, subsystem, command, payload}, timeout);
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
