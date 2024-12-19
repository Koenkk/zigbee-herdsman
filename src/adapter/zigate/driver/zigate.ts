/* v8 ignore start */

import assert from 'node:assert';
import {EventEmitter} from 'node:events';
import net from 'node:net';

import {DelimiterParser} from '@serialport/parser-delimiter';

import {Queue} from '../../../utils';
import {logger} from '../../../utils/logger';
import {Waitress} from '../../../utils/waitress';
import * as ZSpec from '../../../zspec';
import * as Zdo from '../../../zspec/zdo';
import {EndDeviceAnnounce, GenericZdoResponse, ResponseMap as ZdoResponseMap} from '../../../zspec/zdo/definition/tstypes';
import {SerialPort} from '../../serialPort';
import SocketPortUtils from '../../socketPortUtils';
import {SerialPortOptions} from '../../tstype';
import {equal, ZiGateResponseMatcher, ZiGateResponseMatcherRule} from './commandType';
import {STATUS, ZDO_REQ_CLUSTER_ID_TO_ZIGATE_COMMAND_ID, ZiGateCommandCode, ZiGateMessageCode, ZiGateObjectPayload} from './constants';
import ZiGateFrame from './frame';
import ZiGateObject from './ziGateObject';

const NS = 'zh:zigate:driver';

const timeouts = {
    reset: 30000,
    default: 10000,
};

type WaitressMatcher = {
    ziGateObject?: ZiGateObject;
    rules: ZiGateResponseMatcher;
    extraParameters?: object;
};

type ZdoWaitressPayload = {
    ziGatePayload: {
        status: number;
        profileID: number;
        clusterID: number;
        sourceEndpoint: number;
        destinationEndpoint: number;
        sourceAddressMode: number;
        sourceAddress: number | string;
        destinationAddressMode: number;
        destinationAddress: number | string;
        payload: Buffer;
    };
    zdo: GenericZdoResponse;
};

type ZdoWaitressMatcher = {
    clusterId: number;
    target?: number | string;
};

function zeroPad(number: number, size?: number): string {
    return number.toString(16).padStart(size || 4, '0');
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function resolve(path: string | [], obj: {[k: string]: any}, separator = '.'): any {
    const properties = Array.isArray(path) ? path : path.split(separator);
    return properties.reduce((prev, curr) => prev && prev[curr], obj);
}

interface ZiGateEventMap {
    close: [];
    zdoResponse: [Zdo.ClusterId, GenericZdoResponse];
    received: [ZiGateObject];
    LeaveIndication: [ZiGateObject];
    DeviceAnnounce: [EndDeviceAnnounce];
}

export default class ZiGate extends EventEmitter<ZiGateEventMap> {
    private path: string;
    private baudRate: number;
    private initialized: boolean;

    private parser?: EventEmitter;
    private serialPort?: SerialPort;
    private socketPort?: net.Socket;
    private queue: Queue;

    public portWrite?: SerialPort | net.Socket;
    private waitress: Waitress<ZiGateObject, WaitressMatcher>;
    private zdoWaitress: Waitress<ZdoWaitressPayload, ZdoWaitressMatcher>;

    public constructor(path: string, serialPortOptions: SerialPortOptions) {
        super();
        this.path = path;
        this.baudRate = typeof serialPortOptions.baudRate === 'number' ? serialPortOptions.baudRate : 115200;
        // XXX: not used?
        // this.rtscts = typeof serialPortOptions.rtscts === 'boolean' ? serialPortOptions.rtscts : false;
        this.initialized = false;
        this.queue = new Queue(1);

        this.waitress = new Waitress<ZiGateObject, WaitressMatcher>(this.waitressValidator, this.waitressTimeoutFormatter);
        this.zdoWaitress = new Waitress<ZdoWaitressPayload, ZdoWaitressMatcher>(this.zdoWaitressValidator, this.waitressTimeoutFormatter);
    }

    public async sendCommand(
        code: ZiGateCommandCode,
        payload?: ZiGateObjectPayload,
        timeout?: number,
        extraParameters?: object,
        disableResponse: boolean = false,
    ): Promise<ZiGateObject> {
        const waiters: Promise<ZiGateObject>[] = [];
        const waitersId: number[] = [];
        return await this.queue.execute(async () => {
            try {
                logger.debug(
                    () =>
                        'Send command \x1b[32m>>>> ' +
                        ZiGateCommandCode[code] +
                        ' 0x' +
                        zeroPad(code) +
                        ` <<<<\x1b[0m \nPayload: ${JSON.stringify(payload)}`,
                    NS,
                );
                const ziGateObject = ZiGateObject.createRequest(code, payload);
                const frame = ziGateObject.toZiGateFrame();
                logger.debug(() => `${JSON.stringify(frame)}`, NS);

                const sendBuffer = frame.toBuffer();
                logger.debug(`<-- send command ${sendBuffer.toString('hex')}`, NS);
                logger.debug(`DisableResponse: ${disableResponse}`, NS);

                if (!disableResponse && Array.isArray(ziGateObject.command.response)) {
                    ziGateObject.command.response.forEach((rules) => {
                        const waiter = this.waitress.waitFor({ziGateObject, rules, extraParameters}, timeout || timeouts.default);
                        waitersId.push(waiter.ID);
                        waiters.push(waiter.start().promise);
                    });
                }

                let resultPromise: Promise<ZiGateObject> | undefined;
                if (ziGateObject.command.waitStatus !== false) {
                    const ruleStatus: ZiGateResponseMatcher = [
                        {receivedProperty: 'code', matcher: equal, value: ZiGateMessageCode.Status},
                        {receivedProperty: 'payload.packetType', matcher: equal, value: ziGateObject.code},
                    ];

                    const statusWaiter = this.waitress.waitFor({ziGateObject, rules: ruleStatus}, timeout || timeouts.default).start();
                    resultPromise = statusWaiter.promise;
                }

                // @ts-expect-error assumed proper based on port type
                this.portWrite!.write(sendBuffer);

                if (ziGateObject.command.waitStatus !== false && resultPromise) {
                    const statusResponse: ZiGateObject = await resultPromise;
                    if (statusResponse.payload.status !== STATUS.E_SL_MSG_STATUS_SUCCESS) {
                        waitersId.map((id) => this.waitress.remove(id));
                        return await Promise.reject(statusResponse);
                    } else if (waiters.length === 0) {
                        return await Promise.resolve(statusResponse);
                    }
                }
                return await Promise.race(waiters);
            } catch (e) {
                logger.error(`sendCommand error ${e}`, NS);
                return await Promise.reject(new Error('sendCommand error: ' + e));
            }
        });
    }

    public async requestZdo(clusterId: Zdo.ClusterId, payload: Buffer): Promise<boolean> {
        return await this.queue.execute(async () => {
            const commandCode = ZDO_REQ_CLUSTER_ID_TO_ZIGATE_COMMAND_ID[clusterId];
            assert(commandCode !== undefined, `ZDO cluster ID '${clusterId}' not supported.`);
            const ruleStatus: ZiGateResponseMatcher = [
                {receivedProperty: 'code', matcher: equal, value: ZiGateMessageCode.Status},
                {receivedProperty: 'payload.packetType', matcher: equal, value: commandCode},
            ];

            logger.debug(() => `ZDO ${Zdo.ClusterId[clusterId]}(cmd code: ${commandCode}) ${payload.toString('hex')}`, NS);

            const frame = new ZiGateFrame();
            frame.writeMsgCode(commandCode);
            frame.writeMsgPayload(payload);

            logger.debug(() => `ZDO ${JSON.stringify(frame)}`, NS);

            const sendBuffer = frame.toBuffer();

            logger.debug(`<-- ZDO send command ${sendBuffer.toString('hex')}`, NS);

            const statusWaiter = this.waitress.waitFor({rules: ruleStatus}, timeouts.default);

            // @ts-expect-error assumed proper based on port type
            this.portWrite!.write(sendBuffer);

            const statusResponse: ZiGateObject = await statusWaiter.start().promise;

            return statusResponse.payload.status === STATUS.E_SL_MSG_STATUS_SUCCESS;
        });
    }

    public open(): Promise<void> {
        return SocketPortUtils.isTcpPath(this.path) ? this.openSocketPort() : this.openSerialPort();
    }

    public async close(): Promise<void> {
        logger.info('closing', NS);
        this.queue.clear();

        if (this.initialized) {
            this.portWrite = undefined;
            this.initialized = false;

            if (this.serialPort) {
                try {
                    await this.serialPort.asyncFlushAndClose();
                } catch (error) {
                    this.emit('close');

                    throw error;
                }
            } else {
                this.socketPort?.destroy();
            }
        }

        this.emit('close');
    }

    private async openSerialPort(): Promise<void> {
        this.serialPort = new SerialPort({
            path: this.path,
            baudRate: this.baudRate,
            dataBits: 8,
            parity: 'none' /* one of ['none', 'even', 'mark', 'odd', 'space'] */,
            stopBits: 1 /* one of [1,2] */,
            lock: false,
            autoOpen: false,
        });
        this.parser = this.serialPort.pipe(new DelimiterParser({delimiter: [ZiGateFrame.STOP_BYTE], includeDelimiter: true}));
        this.parser.on('data', this.onSerialData.bind(this));

        this.portWrite = this.serialPort;

        try {
            await this.serialPort.asyncOpen();
            logger.debug('Serialport opened', NS);

            this.serialPort.once('close', this.onPortClose.bind(this));
            this.serialPort.once('error', this.onPortError.bind(this));

            this.initialized = true;
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
        logger.debug(`Opening TCP socket with ${info.host}:${info.port}`, NS);

        this.socketPort = new net.Socket();
        this.socketPort.setNoDelay(true);
        this.socketPort.setKeepAlive(true, 15000);

        this.parser = this.socketPort.pipe(new DelimiterParser({delimiter: [ZiGateFrame.STOP_BYTE], includeDelimiter: true}));
        this.parser.on('data', this.onSerialData.bind(this));

        this.portWrite = this.socketPort;
        return await new Promise((resolve, reject): void => {
            this.socketPort!.on('connect', () => {
                logger.debug('Socket connected', NS);
            });

            this.socketPort!.on('ready', async () => {
                logger.debug('Socket ready', NS);
                this.initialized = true;
                resolve();
            });

            this.socketPort!.once('close', this.onPortClose.bind(this));

            this.socketPort!.on('error', (error) => {
                logger.error(`Socket error ${error}`, NS);
                reject(new Error(`Error while opening socket`));
                this.initialized = false;
            });

            this.socketPort!.connect(info.port, info.host);
        });
    }

    private onPortError(error: Error): void {
        logger.error(`Port error: ${error}`, NS);
    }

    private onPortClose(): void {
        logger.debug('Port closed', NS);
        this.initialized = false;
        this.emit('close');
    }

    private onSerialData(buffer: Buffer): void {
        try {
            // logger.debug(() => `--- parseNext ${JSON.stringify(buffer)}`, NS);

            const frame = new ZiGateFrame(buffer);
            if (!(frame instanceof ZiGateFrame)) return; // @Todo fix

            const code = frame.readMsgCode();
            const msgName = (ZiGateMessageCode[code] ? ZiGateMessageCode[code] : '') + ' 0x' + zeroPad(code);

            logger.debug(`--> parsed frame \x1b[1;34m>>>> ${msgName} <<<<\x1b[0m `, NS);

            try {
                const ziGateObject = ZiGateObject.fromZiGateFrame(frame);
                logger.debug(() => `${JSON.stringify(ziGateObject.payload)}`, NS);

                if (code === ZiGateMessageCode.DataIndication && ziGateObject.payload.profileID === Zdo.ZDO_PROFILE_ID) {
                    const ziGatePayload: ZdoWaitressPayload['ziGatePayload'] = ziGateObject.payload;
                    // requests don't have tsn, but responses do
                    // https://zigate.fr/documentation/commandes-zigate/
                    const zdo = Zdo.Buffalo.readResponse(true, ziGatePayload.clusterID, ziGatePayload.payload);

                    this.zdoWaitress.resolve({ziGatePayload, zdo});
                    this.emit('zdoResponse', ziGatePayload.clusterID, zdo);
                } else if (code === ZiGateMessageCode.LeaveIndication && ziGateObject.payload.rejoin === 0) {
                    // mock a ZDO response (if waiter present) as zigate does not follow spec on this (missing ZDO LEAVE_RESPONSE)
                    const ziGatePayload: ZdoWaitressPayload['ziGatePayload'] = {
                        status: 0,
                        profileID: Zdo.ZDO_PROFILE_ID,
                        clusterID: Zdo.ClusterId.LEAVE_RESPONSE, // only piece actually required for waitress validation
                        sourceEndpoint: Zdo.ZDO_ENDPOINT,
                        destinationEndpoint: Zdo.ZDO_ENDPOINT,
                        sourceAddressMode: 0x03,
                        sourceAddress: ziGateObject.payload.extendedAddress,
                        destinationAddressMode: 0x03,
                        destinationAddress: ZSpec.BLANK_EUI64,
                        // @ts-expect-error not used
                        payload: undefined,
                    };

                    // Workaround: `zdo` is not valid for LEAVE_RESPONSE, but required to pass altered waitress validation (in sendZdo)
                    if (this.zdoWaitress.resolve({ziGatePayload, zdo: [Zdo.Status.SUCCESS, {eui64: ziGateObject.payload.extendedAddress}]})) {
                        this.emit('zdoResponse', Zdo.ClusterId.LEAVE_RESPONSE, [
                            Zdo.Status.SUCCESS,
                            undefined,
                        ] as ZdoResponseMap[Zdo.ClusterId.LEAVE_RESPONSE]);
                    }

                    this.emit('LeaveIndication', ziGateObject);
                } else {
                    this.waitress.resolve(ziGateObject);

                    if (code === ZiGateMessageCode.DataIndication) {
                        if (ziGateObject.payload.profileID === ZSpec.HA_PROFILE_ID) {
                            this.emit('received', ziGateObject);
                        } else {
                            logger.debug('not implemented profile: ' + ziGateObject.payload.profileID, NS);
                        }
                    } else if (code === ZiGateMessageCode.DeviceAnnounce) {
                        this.emit('DeviceAnnounce', {
                            nwkAddress: ziGateObject.payload.shortAddress,
                            eui64: ziGateObject.payload.ieee,
                            capabilities: ziGateObject.payload.MACcapability,
                        });
                    }
                }
            } catch (error) {
                logger.error(`Parsing error: ${error}`, NS);
            }
        } catch (error) {
            logger.error(`Error while parsing Frame '${error}'`, NS);
        }
    }

    private waitressTimeoutFormatter(matcher: WaitressMatcher | ZdoWaitressMatcher, timeout: number): string {
        return `${JSON.stringify(matcher)} after ${timeout}ms`;
    }

    private waitressValidator(ziGateObject: ZiGateObject, matcher: WaitressMatcher): boolean {
        const validator = (rule: ZiGateResponseMatcherRule): boolean => {
            try {
                let expectedValue: string | number;
                if (rule.value == undefined && rule.expectedProperty != undefined) {
                    assert(matcher.ziGateObject, `Matcher ziGateObject expected valid.`);
                    expectedValue = resolve(rule.expectedProperty, matcher.ziGateObject);
                } else if (rule.value == undefined && rule.expectedExtraParameter != undefined) {
                    expectedValue = resolve(rule.expectedExtraParameter, matcher.extraParameters!); // XXX: assumed valid?
                } else {
                    expectedValue = rule.value!; // XXX: assumed valid?
                }
                const receivedValue = resolve(rule.receivedProperty, ziGateObject);
                return rule.matcher(expectedValue, receivedValue);
            } catch {
                return false;
            }
        };
        return matcher.rules.every(validator);
    }

    public zdoWaitFor(matcher: ZdoWaitressMatcher): ReturnType<typeof this.zdoWaitress.waitFor> {
        return this.zdoWaitress.waitFor(matcher, timeouts.default);
    }

    private zdoWaitressValidator(payload: ZdoWaitressPayload, matcher: ZdoWaitressMatcher): boolean {
        return (
            (matcher.target === undefined ||
                (typeof matcher.target === 'number'
                    ? matcher.target === payload.ziGatePayload.sourceAddress
                    : // @ts-expect-error checked with ?
                      matcher.target === payload.zdo?.[1]?.eui64)) &&
            payload.ziGatePayload.clusterID === matcher.clusterId
        );
    }
}
