import assert from 'node:assert';
import events from 'node:events';
import {Socket} from 'node:net';

import {Queue, wait, Waitress} from '../../../utils';
import {logger} from '../../../utils/logger';
import {ClusterId as ZdoClusterId} from '../../../zspec/zdo';
import {SerialPort} from '../../serialPort';
import SocketPortUtils from '../../socketPortUtils';
import * as Constants from '../constants';
import {Frame as UnpiFrame, Parser as UnpiParser, Writer as UnpiWriter} from '../unpi';
import {Subsystem, Type} from '../unpi/constants';
import Definition from './definition';
import {ZpiObjectPayload} from './tstype';
import {isMtCmdSreqZdo} from './utils';
import {ZpiObject} from './zpiObject';

const {
    COMMON: {ZnpCommandStatus},
    Utils: {statusDescription},
} = Constants;

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
    target?: number | string;
    transid?: number;
    state?: number;
}

export class Znp extends events.EventEmitter {
    private path: string;
    private baudRate: number;
    private rtscts: boolean;

    private serialPort?: SerialPort;
    private socketPort?: Socket;
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

        this.initialized = false;

        this.queue = new Queue();
        this.waitress = new Waitress<ZpiObject, WaitressMatcher>(this.waitressValidator, this.waitressTimeoutFormatter);
        this.unpiWriter = new UnpiWriter();
        this.unpiParser = new UnpiParser();
    }

    private onUnpiParsed(frame: UnpiFrame): void {
        try {
            const object = ZpiObject.fromUnpiFrame(frame);
            logger.debug(() => `<-- ${object.toString(object.subsystem !== Subsystem.ZDO)}`, NS);
            this.waitress.resolve(object);
            this.emit('received', object);
        } catch (error) {
            logger.error(`Error while parsing to ZpiObject '${error}'`, NS);
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
        return SocketPortUtils.isTcpPath(this.path) ? await this.openSocketPort() : await this.openSerialPort();
    }

    private async openSerialPort(): Promise<void> {
        const options = {path: this.path, baudRate: this.baudRate, rtscts: this.rtscts, autoOpen: false};

        logger.info(`Opening SerialPort with ${JSON.stringify(options)}`, NS);
        this.serialPort = new SerialPort(options);

        this.unpiWriter.pipe(this.serialPort);
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

        this.socketPort = new Socket();

        this.socketPort.setNoDelay(true);
        this.socketPort.setKeepAlive(true, 15000);
        this.unpiWriter.pipe(this.socketPort);
        this.socketPort.pipe(this.unpiParser);
        this.unpiParser.on('parsed', this.onUnpiParsed.bind(this));

        return await new Promise((resolve, reject): void => {
            this.socketPort!.on('connect', function () {
                logger.info('Socket connected', NS);
            });

            // eslint-disable-next-line @typescript-eslint/no-this-alias
            const self = this;
            this.socketPort!.on('ready', async function () {
                logger.info('Socket ready', NS);
                await self.skipBootloader();
                self.initialized = true;
                resolve();
            });

            this.socketPort!.once('close', this.onPortClose.bind(this));

            this.socketPort!.on('error', function (error) {
                logger.error(`Socket error ${error}`, NS);
                reject(new Error(`Error while opening socket`));
                self.initialized = false;
            });

            this.socketPort!.connect(info.port, info.host);
        });
    }

    private async skipBootloader(): Promise<void> {
        try {
            await this.request(Subsystem.SYS, 'ping', {capabilities: 1}, undefined, 250);
        } catch {
            // Skip bootloader on CC2530/CC2531
            // Send magic byte: https://github.com/Koenkk/zigbee2mqtt/issues/1343 to bootloader
            // and give ZNP 1 second to start.
            try {
                logger.info('Writing CC2530/CC2531 skip bootloader payload', NS);
                this.unpiWriter.writeBuffer(Buffer.from([0xef]));
                await wait(1000);
                await this.request(Subsystem.SYS, 'ping', {capabilities: 1}, undefined, 250 /* v8 ignore next */);
            } catch {
                // Skip bootloader on some CC2652 devices (e.g. zzh-p)
                logger.info('Skip bootloader for CC2652/CC1352', NS);
                if (this.serialPort) {
                    await this.serialPort.asyncSet({dtr: false, rts: false});
                    await wait(150);
                    await this.serialPort.asyncSet({dtr: false, rts: true});
                    await wait(150);
                    await this.serialPort.asyncSet({dtr: false, rts: false});
                    await wait(150);
                }
            }
        }
    }

    public async close(): Promise<void> {
        logger.info('closing', NS);
        this.queue.clear();

        if (this.initialized) {
            this.initialized = false;

            if (this.serialPort) {
                try {
                    await this.serialPort.asyncFlushAndClose();
                } catch (error) {
                    this.emit('close');

                    throw error;
                }
            } else {
                this.socketPort!.destroy();
            }
        }

        this.emit('close');
    }

    public async requestWithReply(
        subsystem: Subsystem,
        command: string,
        payload: ZpiObjectPayload,
        waiterID?: number,
        timeout?: number,
        expectedStatuses: Constants.COMMON.ZnpCommandStatus[] = [ZnpCommandStatus.SUCCESS],
    ): Promise<ZpiObject> {
        const reply = await this.request(subsystem, command, payload, waiterID, timeout, expectedStatuses);
        if (reply === undefined) {
            throw new Error(`Command ${command} has no reply`);
        }
        return reply;
    }

    public request(
        subsystem: Subsystem,
        command: string,
        payload: ZpiObjectPayload,
        waiterID?: number,
        timeout?: number,
        expectedStatuses: Constants.COMMON.ZnpCommandStatus[] = [ZnpCommandStatus.SUCCESS],
    ): Promise<ZpiObject | void> {
        if (!this.initialized) {
            throw new Error('Cannot request when znp has not been initialized yet');
        }

        const object = ZpiObject.createRequest(subsystem, command, payload);

        return this.queue.execute<ZpiObject | void>(async () => {
            logger.debug(() => `--> ${object}`, NS);

            if (object.type === Type.SREQ) {
                const t = object.command.name === 'bdbStartCommissioning' || object.command.name === 'startupFromApp' ? 40000 : timeouts.SREQ;
                const waiter = this.waitress.waitFor({type: Type.SRSP, subsystem: object.subsystem, command: object.command.name}, timeout || t);
                this.unpiWriter.writeFrame(object.unpiFrame);
                const result = await waiter.start().promise;
                if (result?.payload.status !== undefined && !expectedStatuses.includes(result.payload.status)) {
                    if (typeof waiterID === 'number') {
                        this.waitress.remove(waiterID);
                    }

                    throw new Error(
                        `--> '${object}' failed with status '${statusDescription(
                            result.payload.status,
                        )}' (expected '${expectedStatuses.map(statusDescription)}')`,
                    );
                } else {
                    return result;
                }
            } else if (object.type === Type.AREQ && object.isResetCommand()) {
                const waiter = this.waitress.waitFor({type: Type.AREQ, subsystem: Subsystem.SYS, command: 'resetInd'}, timeout || timeouts.reset);
                this.queue.clear();
                this.unpiWriter.writeFrame(object.unpiFrame);
                return await waiter.start().promise;
            } else {
                if (object.type === Type.AREQ) {
                    this.unpiWriter.writeFrame(object.unpiFrame);
                    /* v8 ignore start */
                } else {
                    throw new Error(`Unknown type '${object.type}'`);
                }
                /* v8 ignore stop */
            }
        });
    }

    public requestZdo(clusterId: ZdoClusterId, payload: Buffer, waiterID?: number): Promise<void> {
        return this.queue.execute(async () => {
            const cmd = Definition[Subsystem.ZDO].find((c) => isMtCmdSreqZdo(c) && c.zdoClusterId === clusterId);
            assert(cmd, `Command for ZDO cluster ID '${clusterId}' not supported.`);

            const unpiFrame = new UnpiFrame(Type.SREQ, Subsystem.ZDO, cmd.ID, payload);
            const waiter = this.waitress.waitFor({type: Type.SRSP, subsystem: Subsystem.ZDO, command: cmd.name}, timeouts.SREQ);

            this.unpiWriter.writeFrame(unpiFrame);

            const result = await waiter.start().promise;

            if (result?.payload.status !== undefined && result.payload.status !== ZnpCommandStatus.SUCCESS) {
                if (waiterID !== undefined) {
                    this.waitress.remove(waiterID);
                }

                throw new Error(
                    `--> 'SREQ: ZDO - ${ZdoClusterId[clusterId]} - ${payload.toString('hex')}' failed with status '${statusDescription(result.payload.status)}'`,
                );
            }
        });
    }

    private waitressTimeoutFormatter(matcher: WaitressMatcher, timeout: number): string {
        return `${Type[matcher.type]} - ${Subsystem[matcher.subsystem]} - ${matcher.command} after ${timeout}ms`;
    }

    public waitFor(
        type: Type,
        subsystem: Subsystem,
        command: string,
        target: number | string | undefined,
        transid: number | undefined,
        state: number | undefined,
        timeout: number = timeouts.default,
    ): {start: () => {promise: Promise<ZpiObject>; ID: number}; ID: number} {
        return this.waitress.waitFor({type, subsystem, command, target, transid, state}, timeout);
    }

    private waitressValidator(zpiObject: ZpiObject, matcher: WaitressMatcher): boolean {
        return (
            matcher.type === zpiObject.type &&
            matcher.subsystem == zpiObject.subsystem &&
            matcher.command === zpiObject.command.name &&
            (matcher.target === undefined ||
                (typeof matcher.target === 'number'
                    ? matcher.target === zpiObject.payload.srcaddr
                    : matcher.target === zpiObject.payload.zdo?.[1]?.eui64)) &&
            (matcher.transid === undefined || matcher.transid === zpiObject.payload.transid) &&
            (matcher.state === undefined || matcher.state === zpiObject.payload.state)
        );
    }
}
