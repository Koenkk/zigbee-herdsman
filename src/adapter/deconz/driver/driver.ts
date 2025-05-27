/* v8 ignore start */

import events from "node:events";
import net from "node:net";

import slip from "slip";

import {logger} from "../../../utils/logger";
import {SerialPort} from "../../serialPort";
import SocketPortUtils from "../../socketPortUtils";
import PARAM, {type ApsDataRequest, type ParameterT, type ReceivedDataResponse, type Request} from "./constants";
import {frameParserEvents} from "./frameParser";
import Parser from "./parser";
import Writer from "./writer";

const NS = "zh:deconz:driver";

const queue: Array<Request> = [];
export const busyQueue: Array<Request> = [];
const apsQueue: Array<Request> = [];
export const apsBusyQueue: Array<Request> = [];
const apsConfirmIndQueue: Array<Request> = [];
export let readyToSend = true;

export function enableRTS(): void {
    if (readyToSend === false) {
        readyToSend = true;
    }
}

export function disableRTS(): void {
    readyToSend = false;
}

export let enableRtsTimeout: NodeJS.Timeout | undefined;

class Driver extends events.EventEmitter {
    private path: string;
    private serialPort?: SerialPort;
    private initialized: boolean;
    private writer: Writer;
    private parser: Parser;
    private frameParserEvent = frameParserEvents;
    private seqNumber: number;
    private timeoutResetTimeout?: NodeJS.Timeout;
    private apsRequestFreeSlots: number;
    private apsDataConfirm: number;
    private apsDataIndication: number;
    private configChanged: number;
    private socketPort?: net.Socket;
    private delay: number;
    private readyToSendTimeout: number;
    private handleDeviceStatusDelay: number;
    private processQueues: number;
    private timeoutCounter = 0;
    private currentBaudRate = 0;

    public constructor(path: string) {
        super();
        this.path = path;
        this.initialized = false;
        this.seqNumber = 0;
        this.timeoutResetTimeout = undefined;

        this.apsRequestFreeSlots = 1;
        this.apsDataConfirm = 0;
        this.apsDataIndication = 0;
        this.configChanged = 0;
        this.delay = 0;
        this.readyToSendTimeout = 1;
        this.handleDeviceStatusDelay = 5;
        this.processQueues = 5;

        this.writer = new Writer();
        this.parser = new Parser();

        setInterval(() => {
            this.deviceStateRequest()
                .then(() => {})
                .catch(() => {});
        }, 10000);

        setInterval(
            () => {
                this.writeParameterRequest(0x26, 600) // reset watchdog // 10 minutes
                    .then(() => {})
                    .catch(() => {
                        //try again
                        logger.debug("try again to reset watchdog", NS);
                        this.writeParameterRequest(0x26, 600)
                            .then(() => {})
                            .catch(() => {
                                logger.debug("warning watchdog was not reset", NS);
                            });
                    });
            },
            1000 * 60 * 8,
        ); // 8 minutes

        this.onParsed = this.onParsed.bind(this);
        this.frameParserEvent.on("receivedDataNotification", (data: number) => {
            this.checkDeviceStatus(data);
        });

        this.on("close", () => {
            for (const interval of this.intervals) {
                clearInterval(interval);
            }
            queue.length = 0;
            busyQueue.length = 0;
            apsQueue.length = 0;
            apsBusyQueue.length = 0;
            apsConfirmIndQueue.length = 0;
            this.timeoutCounter = 0;
        });
    }

    protected intervals: NodeJS.Timeout[] = [];

    protected registerInterval(interval: NodeJS.Timeout): void {
        this.intervals.push(interval);
    }

    protected async catchPromise<T>(val: Promise<T>): Promise<undefined | Awaited<T>> {
        return (await Promise.resolve(val).catch((err) => logger.debug(`Promise was caught with reason: ${err}`, NS))) as undefined | Awaited<T>;
    }

    public setDelay(delay: number): void {
        logger.debug(`Set delay to ${delay}`, NS);
        this.delay = delay;
        this.readyToSendTimeout = delay;
        this.processQueues = delay;
        this.handleDeviceStatusDelay = delay;

        if (this.readyToSendTimeout === 0) {
            this.readyToSendTimeout = 1;
        }

        if (this.processQueues < 5) {
            this.processQueues = 5;
        }

        if (this.handleDeviceStatusDelay < 5) {
            this.handleDeviceStatusDelay = 5;
        }

        if (this.processQueues > 60) {
            this.processQueues = 60;
        }

        if (this.handleDeviceStatusDelay > 60) {
            this.handleDeviceStatusDelay = 60;
        }

        this.registerInterval(
            setInterval(() => {
                this.processQueue();
            }, this.processQueues),
        ); // fire non aps requests
        this.registerInterval(
            setInterval(async () => {
                await this.catchPromise(this.processBusyQueue());
            }, this.processQueues),
        ); // check timeouts for non aps requests
        this.registerInterval(
            setInterval(async () => {
                await this.catchPromise(this.processApsQueue());
            }, this.processQueues),
        ); // fire aps request
        this.registerInterval(
            setInterval(() => {
                this.processApsBusyQueue();
            }, this.processQueues),
        ); // check timeouts for all open aps requests
        this.registerInterval(
            setInterval(() => {
                this.processApsConfirmIndQueue();
            }, this.processQueues),
        ); // fire aps indications and confirms
        this.registerInterval(
            setInterval(async () => {
                await this.catchPromise(this.handleDeviceStatus());
            }, this.handleDeviceStatusDelay),
        ); // query confirm and indication requests
    }

    private onPortClose(): void {
        logger.debug("Port closed", NS);
        this.initialized = false;
        this.emit("close");
    }

    public async open(baudrate: number): Promise<void> {
        this.currentBaudRate = baudrate;
        return await (SocketPortUtils.isTcpPath(this.path) ? this.openSocketPort() : this.openSerialPort(baudrate));
    }

    public openSerialPort(baudrate: number): Promise<void> {
        logger.debug(`Opening with ${this.path}`, NS);
        this.serialPort = new SerialPort({path: this.path, baudRate: baudrate, autoOpen: false}); //38400 RaspBee //115200 ConBee3

        this.writer.pipe(this.serialPort);

        this.serialPort.pipe(this.parser);
        this.parser.on("parsed", this.onParsed);

        return new Promise((resolve, reject): void => {
            // biome-ignore lint/style/noNonNullAssertion: ignored using `--suppress`
            this.serialPort!.open((error) => {
                if (error) {
                    reject(new Error(`Error while opening serialport '${error}'`));
                    this.initialized = false;
                    // biome-ignore lint/style/noNonNullAssertion: ignored using `--suppress`
                    if (this.serialPort!.isOpen) {
                        // biome-ignore lint/style/noNonNullAssertion: ignored using `--suppress`
                        this.serialPort!.close();
                    }
                } else {
                    logger.debug("Serialport opened", NS);
                    this.initialized = true;
                    resolve();
                }
            });
        });
    }

    private async openSocketPort(): Promise<void> {
        const info = SocketPortUtils.parseTcpPath(this.path);
        logger.debug(`Opening TCP socket with ${info.host}:${info.port}`, NS);
        this.socketPort = new net.Socket();
        this.socketPort.setNoDelay(true);
        this.socketPort.setKeepAlive(true, 15000);

        this.writer = new Writer();
        this.writer.pipe(this.socketPort);

        this.parser = new Parser();
        this.socketPort.pipe(this.parser);
        this.parser.on("parsed", this.onParsed);

        return await new Promise((resolve, reject): void => {
            // biome-ignore lint/style/noNonNullAssertion: ignored using `--suppress`
            this.socketPort!.on("connect", () => {
                logger.debug("Socket connected", NS);
            });

            // biome-ignore lint/style/noNonNullAssertion: ignored using `--suppress`
            this.socketPort!.on("ready", () => {
                logger.debug("Socket ready", NS);
                this.initialized = true;
                resolve();
            });

            // biome-ignore lint/style/noNonNullAssertion: ignored using `--suppress`
            this.socketPort!.once("close", this.onPortClose);

            // biome-ignore lint/style/noNonNullAssertion: ignored using `--suppress`
            this.socketPort!.on("error", (error) => {
                logger.error(`Socket error ${error}`, NS);
                reject(new Error("Error while opening socket"));
                this.initialized = false;
            });

            // biome-ignore lint/style/noNonNullAssertion: ignored using `--suppress`
            this.socketPort!.connect(info.port, info.host);
        });
    }

    public close(): Promise<void> {
        return new Promise((resolve, reject): void => {
            if (this.initialized) {
                if (this.serialPort) {
                    this.serialPort.flush((): void => {
                        // biome-ignore lint/style/noNonNullAssertion: ignored using `--suppress`
                        this.serialPort!.close((error): void => {
                            this.initialized = false;

                            if (error == null) {
                                resolve();
                            } else {
                                reject(new Error(`Error while closing serialport '${error}'`));
                            }

                            this.emit("close");
                        });
                    });
                } else {
                    // biome-ignore lint/style/noNonNullAssertion: ignored using `--suppress`
                    this.socketPort!.destroy();
                    resolve();
                }
            } else {
                resolve();
                this.emit("close");
            }
        });
    }

    public readParameterRequest(parameterId: number): Promise<unknown> {
        const seqNumber = this.nextSeqNumber();
        return new Promise((resolve, reject): void => {
            //logger.debug(`push read parameter request to queue. seqNr: ${seqNumber} paramId: ${parameterId}`, NS);
            const ts = 0;
            const commandId = PARAM.PARAM.FrameType.ReadParameter;
            const req: Request = {commandId, parameterId, seqNumber, resolve, reject, ts};
            queue.push(req);
        });
    }

    public writeParameterRequest(parameterId: number, parameter: ParameterT): Promise<void> {
        const seqNumber = this.nextSeqNumber();
        return new Promise((resolve, reject): void => {
            //logger.debug(`push write parameter request to queue. seqNr: ${seqNumber} paramId: ${parameterId} parameter: ${parameter}`, NS);
            const ts = 0;
            const commandId = PARAM.PARAM.FrameType.WriteParameter;
            const req: Request = {commandId, parameterId, parameter, seqNumber, resolve, reject, ts};
            queue.push(req);
        });
    }

    public async writeLinkKey(ieeeAddress: string, hashedKey: Buffer): Promise<void> {
        await this.writeParameterRequest(PARAM.PARAM.Network.LINK_KEY, [...this.macAddrStringToArray(ieeeAddress), ...hashedKey]);
    }

    public readFirmwareVersionRequest(): Promise<number[]> {
        const seqNumber = this.nextSeqNumber();
        return new Promise((resolve, reject): void => {
            //logger.debug(`push read firmware version request to queue. seqNr: ${seqNumber}`, NS);
            const ts = 0;
            const commandId = PARAM.PARAM.FrameType.ReadFirmwareVersion;
            const req: Request = {commandId, seqNumber, resolve, reject, ts};
            queue.push(req);
        });
    }

    private sendReadParameterRequest(parameterId: number, seqNumber: number): void {
        /* command id, sequence number, 0, framelength(U16), payloadlength(U16), parameter id */
        if (parameterId === PARAM.PARAM.Network.NETWORK_KEY) {
            this.sendRequest(Buffer.from([PARAM.PARAM.FrameType.ReadParameter, seqNumber, 0x00, 0x09, 0x00, 0x02, 0x00, parameterId, 0x00]));
        } else {
            this.sendRequest(Buffer.from([PARAM.PARAM.FrameType.ReadParameter, seqNumber, 0x00, 0x08, 0x00, 0x01, 0x00, parameterId]));
        }
    }

    private sendWriteParameterRequest(parameterId: number, value: ParameterT, seqNumber: number): void {
        /* command id, sequence number, 0, framelength(U16), payloadlength(U16), parameter id, pameter */
        let parameterLength = 0;
        if (parameterId === PARAM.PARAM.STK.Endpoint) {
            const arrayParameterValue = value as number[];
            parameterLength = arrayParameterValue.length;
        } else {
            parameterLength = this.getLengthOfParameter(parameterId);
        }
        //logger.debug("SEND WRITE_PARAMETER Request - parameter id: " + parameterId + " value: " + value.toString(16) + " length: " + parameterLength, NS);

        const payloadLength = 1 + parameterLength;
        const frameLength = 7 + payloadLength;

        const fLength1 = frameLength & 0xff;
        const fLength2 = frameLength >> 8;

        const pLength1 = payloadLength & 0xff;
        const pLength2 = payloadLength >> 8;

        if (parameterId === PARAM.PARAM.Network.NETWORK_KEY) {
            this.sendRequest(
                Buffer.from([PARAM.PARAM.FrameType.WriteParameter, seqNumber, 0x00, 0x19, 0x00, 0x12, 0x00, parameterId, 0x00].concat(value)),
            );
        } else {
            this.sendRequest(
                Buffer.from([
                    PARAM.PARAM.FrameType.WriteParameter,
                    seqNumber,
                    0x00,
                    fLength1,
                    fLength2,
                    pLength1,
                    pLength2,
                    parameterId,
                    ...this.parameterBuffer(value, parameterLength),
                ]),
            );
        }
    }

    private getLengthOfParameter(parameterId: number): number {
        // TODO(mpi): Magic numbers ...
        switch (parameterId) {
            case 9:
            case 16:
            case 21:
            case 28:
            case 33:
            case 36:
                return 1;
            case 5:
            case 7:
            case 34:
                return 2;
            case 10:
            case 38:
                return 4;
            case 1:
            case 8:
            case 11:
            case 14:
                return 8;
            case 24:
            case 25:
                return 16;
            default:
                return 0;
        }
    }

    private parameterBuffer(parameter: ParameterT, parameterLength: number): Buffer {
        if (typeof parameter === "number") {
            // for parameter <= 4 Byte
            if (parameterLength > 4) throw new Error("parameter to big for type number");

            const buf = Buffer.alloc(parameterLength);
            buf.writeUIntLE(parameter, 0, parameterLength);

            return buf;
        }

        return Buffer.from(parameter.reverse());
    }

    private sendReadFirmwareVersionRequest(seqNumber: number): void {
        /* command id, sequence number, 0, framelength(U16) */
        this.sendRequest(Buffer.from([PARAM.PARAM.FrameType.ReadFirmwareVersion, seqNumber, 0x00, 0x09, 0x00, 0x00, 0x00, 0x00, 0x00]));
    }

    private sendReadDeviceStateRequest(seqNumber: number): void {
        /* command id, sequence number, 0, framelength(U16) */
        this.sendRequest(Buffer.from([PARAM.PARAM.FrameType.ReadDeviceState, seqNumber, 0x00, 0x08, 0x00, 0x00, 0x00, 0x00]));
    }

    private sendRequest(buffer: Buffer): void {
        const frame = Buffer.concat([buffer, this.calcCrc(buffer)]);
        const slipframe = slip.encode(frame);

        // TODO: write not awaited?
        if (this.serialPort) {
            this.serialPort.write(slipframe, (err) => {
                if (err) {
                    logger.debug(`Error writing serial Port: ${err.message}`, NS);
                }
            });
        } else {
            // biome-ignore lint/style/noNonNullAssertion: ignored using `--suppress`
            this.socketPort!.write(slipframe, (err) => {
                if (err) {
                    logger.debug(`Error writing socket Port: ${err.message}`, NS);
                }
            });
        }
    }

    private processQueue(): void {
        if (queue.length === 0) {
            return;
        }
        if (busyQueue.length > 0) {
            return;
        }

        const req = queue.shift();

        if (req) {
            req.ts = Date.now();

            switch (req.commandId) {
                case PARAM.PARAM.FrameType.ReadParameter:
                    logger.debug(`send read parameter request from queue. seqNr: ${req.seqNumber} paramId: ${req.parameterId}`, NS);
                    // biome-ignore lint/style/noNonNullAssertion: ignored using `--suppress`
                    this.sendReadParameterRequest(req.parameterId!, req.seqNumber);
                    break;
                case PARAM.PARAM.FrameType.WriteParameter:
                    logger.debug(
                        `send write parameter request from queue. seqNr: ${req.seqNumber} paramId: ${req.parameterId} param: ${req.parameter}`,
                        NS,
                    );
                    // biome-ignore lint/style/noNonNullAssertion: ignored using `--suppress`
                    this.sendWriteParameterRequest(req.parameterId!, req.parameter!, req.seqNumber);
                    break;
                case PARAM.PARAM.FrameType.ReadFirmwareVersion:
                    logger.debug(`send read firmware version request from queue. seqNr: ${req.seqNumber}`, NS);
                    this.sendReadFirmwareVersionRequest(req.seqNumber);
                    break;
                case PARAM.PARAM.FrameType.ReadDeviceState:
                    logger.debug(`send read device state from queue. seqNr: ${req.seqNumber}`, NS);
                    this.sendReadDeviceStateRequest(req.seqNumber);
                    break;
                case PARAM.PARAM.NetworkState.CHANGE_NETWORK_STATE:
                    logger.debug(`send change network state request from queue. seqNr: ${req.seqNumber}`, NS);
                    // biome-ignore lint/style/noNonNullAssertion: ignored using `--suppress`
                    this.sendChangeNetworkStateRequest(req.seqNumber, req.networkState!);
                    break;
                default:
                    throw new Error("process queue - unknown command id");
            }

            busyQueue.push(req);
        }
    }

    private async processBusyQueue(): Promise<void> {
        let i = busyQueue.length;
        while (i--) {
            const req: Request = busyQueue[i];
            const now = Date.now();

            // biome-ignore lint/style/noNonNullAssertion: ignored using `--suppress`
            if (now - req.ts! > 10000) {
                logger.debug(`Timeout for request - CMD: 0x${req.commandId.toString(16)} seqNr: ${req.seqNumber}`, NS);
                //remove from busyQueue
                busyQueue.splice(i, 1);
                this.timeoutCounter++;
                // after a timeout the timeoutcounter will be reset after 1 min. If another timeout happen then the timeoutcounter
                // will not be reset
                clearTimeout(this.timeoutResetTimeout);
                this.timeoutResetTimeout = undefined;
                this.resetTimeoutCounterAfter1min();
                req.reject(new Error("TIMEOUT"));
                if (this.timeoutCounter >= 2) {
                    this.timeoutCounter = 0;
                    logger.debug("too many timeouts - restart serial connecion", NS);
                    if (this.serialPort?.isOpen) {
                        this.serialPort.close();
                    }
                    if (this.socketPort) {
                        this.socketPort.destroy();
                    }
                    await this.open(this.currentBaudRate);
                }
            }
        }
    }

    public changeNetworkStateRequest(networkState: number): Promise<void> {
        const seqNumber = this.nextSeqNumber();
        return new Promise((resolve, reject): void => {
            //logger.debug(`push change network state request to apsQueue. seqNr: ${seqNumber}`, NS);
            const ts = 0;
            const commandId = PARAM.PARAM.NetworkState.CHANGE_NETWORK_STATE;
            const req: Request = {commandId, networkState, seqNumber, resolve, reject, ts};
            queue.push(req);
        });
    }

    private sendChangeNetworkStateRequest(seqNumber: number, networkState: number): void {
        this.sendRequest(Buffer.from([PARAM.PARAM.NetworkState.CHANGE_NETWORK_STATE, seqNumber, 0x00, 0x06, 0x00, networkState]));
    }

    private async deviceStateRequest(): Promise<void> {
        const seqNumber = this.nextSeqNumber();
        return await new Promise((resolve, reject): void => {
            //logger.debug(`DEVICE_STATE Request - seqNr: ${seqNumber}`, NS);
            const ts = 0;
            const commandId = PARAM.PARAM.FrameType.ReadDeviceState;
            const req: Request = {commandId, seqNumber, resolve, reject, ts};
            queue.push(req);
        });
    }

    private checkDeviceStatus(currentDeviceStatus: number): void {
        const networkState = currentDeviceStatus & 0x03;
        this.apsDataConfirm = (currentDeviceStatus >> 2) & 0x01;
        this.apsDataIndication = (currentDeviceStatus >> 3) & 0x01;
        this.configChanged = (currentDeviceStatus >> 4) & 0x01;
        this.apsRequestFreeSlots = (currentDeviceStatus >> 5) & 0x01;

        logger.debug(
            `networkstate: ${networkState} apsDataConfirm: ${this.apsDataConfirm} apsDataIndication: ${this.apsDataIndication} configChanged: ${this.configChanged} apsRequestFreeSlots: ${this.apsRequestFreeSlots}`,
            NS,
        );
    }

    private async handleDeviceStatus(): Promise<void> {
        if (this.apsDataConfirm === 1) {
            try {
                logger.debug("query aps data confirm", NS);
                this.apsDataConfirm = 0;
                await this.querySendDataStateRequest();
            } catch (error) {
                // @ts-expect-error TODO: this doesn't look right?
                if (error.status === 5) {
                    this.apsDataConfirm = 0;
                }
            }
        }
        if (this.apsDataIndication === 1) {
            try {
                logger.debug("query aps data indication", NS);
                this.apsDataIndication = 0;
                await this.readReceivedDataRequest();
            } catch (error) {
                // @ts-expect-error TODO: this doesn't look right?
                if (error.status === 5) {
                    this.apsDataIndication = 0;
                }
            }
        }
        if (this.configChanged === 1) {
            // when network settings changed
        }
    }

    // DATA_IND
    private readReceivedDataRequest(): Promise<void> {
        const seqNumber = this.nextSeqNumber();
        return new Promise((resolve, reject): void => {
            //logger.debug(`push read received data request to apsQueue. seqNr: ${seqNumber}`, NS);
            const ts = 0;
            const commandId = PARAM.PARAM.APS.DATA_INDICATION;
            const req: Request = {commandId, seqNumber, resolve, reject, ts};
            apsConfirmIndQueue.push(req);
        });
    }

    // DATA_REQ
    public enqueueSendDataRequest(request: ApsDataRequest): Promise<undefined | ReceivedDataResponse> {
        const seqNumber = this.nextSeqNumber();
        return new Promise((resolve, reject): void => {
            //logger.debug(`push enqueue send data request to apsQueue. seqNr: ${seqNumber}`, NS);
            const ts = 0;
            const commandId = PARAM.PARAM.APS.DATA_REQUEST;
            const req: Request = {commandId, seqNumber, request, resolve, reject, ts};
            apsQueue.push(req);
        });
    }

    // DATA_CONF
    private querySendDataStateRequest(): Promise<void> {
        const seqNumber = this.nextSeqNumber();
        return new Promise((resolve, reject): void => {
            //logger.debug(`push query send data state request to apsQueue. seqNr: ${seqNumber}`, NS);
            const ts = 0;
            const commandId = PARAM.PARAM.APS.DATA_CONFIRM;
            const req: Request = {commandId, seqNumber, resolve, reject, ts};
            apsConfirmIndQueue.push(req);
        });
    }

    private async processApsQueue(): Promise<void> {
        if (apsQueue.length === 0) {
            return;
        }

        if (this.apsRequestFreeSlots !== 1) {
            logger.debug("no free slots. Delay sending of APS Request", NS);
            await this.sleep(1000);
            return;
        }

        const req = apsQueue.shift();

        if (req) {
            req.ts = Date.now();

            switch (req.commandId) {
                case PARAM.PARAM.APS.DATA_REQUEST:
                    if (readyToSend === false) {
                        // wait until last request was confirmed or given time elapsed
                        logger.debug("delay sending of APS Request", NS);
                        apsQueue.unshift(req);
                        break;
                    }

                    disableRTS();
                    enableRtsTimeout = setTimeout(() => {
                        enableRTS();
                    }, this.readyToSendTimeout);
                    apsBusyQueue.push(req);
                    // biome-ignore lint/style/noNonNullAssertion: ignored using `--suppress`
                    this.sendEnqueueSendDataRequest(req.request!, req.seqNumber);
                    break;
                default:
                    throw new Error("process APS queue - unknown command id");
            }
        }
    }

    private processApsConfirmIndQueue(): void {
        if (apsConfirmIndQueue.length === 0) {
            return;
        }

        const req = apsConfirmIndQueue.shift();

        if (req) {
            req.ts = Date.now();

            apsBusyQueue.push(req);

            switch (req.commandId) {
                case PARAM.PARAM.APS.DATA_INDICATION:
                    //logger.debug(`read received data request. seqNr: ${req.seqNumber}`, NS);
                    if (this.delay === 0) {
                        this.sendReadReceivedDataRequest(req.seqNumber);
                    } else {
                        this.sendReadReceivedDataRequest(req.seqNumber);
                    }
                    break;
                case PARAM.PARAM.APS.DATA_CONFIRM:
                    //logger.debug(`query send data state request. seqNr: ${req.seqNumber}`, NS);
                    if (this.delay === 0) {
                        this.sendQueryDataStateRequest(req.seqNumber);
                    } else {
                        this.sendQueryDataStateRequest(req.seqNumber);
                    }
                    break;
                default:
                    throw new Error("process APS Confirm/Ind queue - unknown command id");
            }
        }
    }

    private sendQueryDataStateRequest(seqNumber: number): void {
        logger.debug(`DATA_CONFIRM - sending data state request - SeqNr. ${seqNumber}`, NS);
        this.sendRequest(Buffer.from([PARAM.PARAM.APS.DATA_CONFIRM, seqNumber, 0x00, 0x07, 0x00, 0x00, 0x00]));
    }

    private sendReadReceivedDataRequest(seqNumber: number): void {
        logger.debug(`DATA_INDICATION - sending read data request - SeqNr. ${seqNumber}`, NS);
        // payloadlength = 0, flag = none
        this.sendRequest(Buffer.from([PARAM.PARAM.APS.DATA_INDICATION, seqNumber, 0x00, 0x08, 0x00, 0x01, 0x00, 0x01]));
    }

    private sendEnqueueSendDataRequest(request: ApsDataRequest, seqNumber: number): void {
        const payloadLength =
            12 +
            (request.destAddrMode === PARAM.PARAM.addressMode.GROUP_ADDR ? 2 : request.destAddrMode === PARAM.PARAM.addressMode.NWK_ADDR ? 3 : 9) +
            request.asduLength;
        const frameLength = 7 + payloadLength;
        const cid1 = request.clusterId & 0xff;
        const cid2 = (request.clusterId >> 8) & 0xff;
        const asdul1 = request.asduLength & 0xff;
        const asdul2 = (request.asduLength >> 8) & 0xff;
        let destArray: Array<number> = [];
        let dest = "";

        if (request.destAddr16 !== undefined) {
            destArray[0] = request.destAddr16 & 0xff;
            destArray[1] = (request.destAddr16 >> 8) & 0xff;
            dest = request.destAddr16.toString(16);
        }
        if (request.destAddr64 !== undefined) {
            dest = request.destAddr64;
            destArray = this.macAddrStringToArray(request.destAddr64);
        }
        if (request.destEndpoint !== undefined) {
            destArray.push(request.destEndpoint);
            dest += " EP:";
            dest += request.destEndpoint;
        }

        logger.debug(`DATA_REQUEST - destAddr: 0x${dest} SeqNr. ${seqNumber} request id: ${request.requestId}`, NS);

        this.sendRequest(
            Buffer.from([
                PARAM.PARAM.APS.DATA_REQUEST,
                seqNumber,
                0x00,
                frameLength & 0xff,
                (frameLength >> 8) & 0xff,
                payloadLength & 0xff,
                (payloadLength >> 8) & 0xff,
                request.requestId,
                0x00,
                request.destAddrMode,
                ...destArray,
                request.profileId & 0xff,
                (request.profileId >> 8) & 0xff,
                cid1,
                cid2,
                request.srcEndpoint,
                asdul1,
                asdul2,
                ...request.asduPayload,
                request.txOptions,
                request.radius,
            ]),
        );
    }

    private processApsBusyQueue(): void {
        let i = apsBusyQueue.length;
        while (i--) {
            const req = apsBusyQueue[i];
            const now = Date.now();
            let timeout = 60000;
            if (req.request != null && req.request.timeout != null) {
                timeout = req.request.timeout * 1000; // seconds * 1000 = milliseconds
            }
            // biome-ignore lint/style/noNonNullAssertion: ignored using `--suppress`
            if (now - req.ts! > timeout) {
                logger.debug(`Timeout for aps request CMD: 0x${req.commandId.toString(16)} seq: ${req.seqNumber}`, NS);
                //remove from busyQueue
                apsBusyQueue.splice(i, 1);
                req.reject(new Error("APS TIMEOUT"));
            }
        }
    }

    private calcCrc(buffer: Uint8Array): Buffer {
        let crc = 0;
        for (let i = 0; i < buffer.length; i++) {
            crc += buffer[i];
        }
        const crc0 = (~crc + 1) & 0xff;
        const crc1 = ((~crc + 1) >> 8) & 0xff;
        return Buffer.from([crc0, crc1]);
    }

    public macAddrStringToArray(addr: string): Array<number> {
        if (addr.indexOf("0x") === 0) {
            addr = addr.slice(2, addr.length);
        }
        if (addr.length < 16) {
            for (let l = 0; l < 16 - addr.length; l++) {
                addr = `0${addr}`;
            }
        }
        const result = new Array<number>();
        let y = 0;
        for (let i = 0; i < 8; i++) {
            result[i] = Number.parseInt(addr.substr(y, 2), 16);
            y += 2;
        }
        const reverse = result.reverse();
        return reverse;
    }

    public macAddrArrayToString(addr: Array<number>): string {
        if (addr.length !== 8) {
            throw new Error(`invalid array length for MAC address: ${addr.length}`);
        }

        let result = "0x";
        let char = "";
        let i = 8;
        while (i--) {
            char = addr[i].toString(16);
            if (char.length < 2) {
                char = `0${char}`;
            }
            result += char;
        }
        return result;
    }

    /**
     *  generalArrayToString result is not reversed!
     */
    public generalArrayToString(key: Array<number>, length: number): string {
        let result = "0x";
        let char = "";
        let i = 0;
        while (i < length) {
            char = key[i].toString(16);
            if (char.length < 2) {
                char = `0${char}`;
            }
            result += char;
            i++;
        }
        return result;
    }

    private nextSeqNumber(): number {
        this.seqNumber++;

        if (this.seqNumber > 254) {
            this.seqNumber = 1;
        }

        return this.seqNumber;
    }

    private onParsed(frame: Uint8Array): void {
        if (frame.length >= 5) { // min. packet length [cmd, seq, status, u16 storedLength]

            const storedLength = frame[4] << 8 | frame[3];
            if ((storedLength + 2) != frame.length) {// frame without CRC16
                return;
            }

            let crc = 0;
            for (let i = 0; i < storedLength; i++) {
                crc += frame[i];
            }
                

            crc = (~crc + 1) & 0xFFFF;
            const crcFrame = ((frame[frame.length - 1] << 8) | frame[frame.length - 2]);

            if (crc == crcFrame) {
                this.emit("rxFrame", frame.slice(0, storedLength));
            }
        }
    }

    private sleep(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    private resetTimeoutCounterAfter1min(): void {
        if (this.timeoutResetTimeout === undefined) {
            this.timeoutResetTimeout = setTimeout(() => {
                this.timeoutCounter = 0;
                this.timeoutResetTimeout = undefined;
            }, 60000);
        }
    }
}

export default Driver;
