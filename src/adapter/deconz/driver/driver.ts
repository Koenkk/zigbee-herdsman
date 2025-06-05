/* v8 ignore start */

import events from "node:events";
import net from "node:net";

import slip from "slip";

import {logger} from "../../../utils/logger";
import {SerialPort} from "../../serialPort";
import SocketPortUtils from "../../socketPortUtils";
import PARAM, {
    type ApsDataRequest,
    type ReceivedDataResponse,
    type ApsRequest,
    type Request,
    FirmwareCommand,
    NetworkState,
    ParamId,
    stackParameters,
    DataType,
} from "./constants";

import {frameParserEvents} from "./frameParser";
import Parser from "./parser";
import Writer from "./writer";

const NS = "zh:deconz:driver";

const queue: Array<Request> = [];
export const busyQueue: Array<Request> = [];
const apsQueue: Array<ApsRequest> = [];
export const apsBusyQueue: Array<ApsRequest> = [];

const DRIVER_EVENT = Symbol("drv_ev");

const DEV_STATUS_NET_STATE_MASK = 0x03;
const DEV_STATUS_APS_CONFIRM = 0x04;
const DEV_STATUS_APS_INDICATION = 0x08;
const DEV_STATUS_APS_FREE_SLOTS = 0x20;
//const DEV_STATUS_CONFIG_CHANGED = 0x10;

enum DriverState {
    Init = 0,
    Connected = 1,
    Connecting = 2,
    ReadConfiguration = 3,
    WaitToReconnect = 4,
    Reconfigure = 5,
}

enum TxState {
    Idle = 0,
    WaitResponse = 1,
}

enum DriverEvent {
    Action = 0,
    Connected = 1,
    Disconnected = 2,
    DeviceStateUpdated = 3,
    ConnectError = 4,
    CloseError = 5,
    EnqueuedApsDataRequest = 6,
    Tick = 7,
    FirmwareCommandSend = 8,
    FirmwareCommandReceived = 9,
    FirmwareCommandTimeout = 10,
}

interface CommandResult {
    cmd: number;
    seq: number;
}

type DriverEventData = number | CommandResult;

class Driver extends events.EventEmitter {
    private path: string;
    private serialPort?: SerialPort;
    private writer: Writer;
    private parser: Parser;
    private frameParserEvent = frameParserEvents;
    private seqNumber: number;
    private deviceStatus = 0;
    private configChanged: number;
    private socketPort?: net.Socket;
    private timeoutCounter = 0;
    private currentBaudRate = 0;
    private watchdogTriggeredTime = 0;
    private lastFirmwareRxTime = 0;
    private tickTimer: NodeJS.Timeout;
    private driverStateStart = 0;
    private driverState: DriverState = DriverState.Init;
    // in flight lockstep sending commands
    private txState: TxState = TxState.Idle;
    private txCommand = 0;
    private txSeq = 0;
    private txTime = 0;

    public paramMacAddress = "";
    public paramFirmwareVersion = 0;
    public paramCurrentChannel = 0;
    public paramNwkPanid = 0;
    public paramNwkKey = "";
    public paramNwkUpdateId = 0;
    public paramChannelMask = 0;
    public paramProtocolVersion = 0;
    public paramApsUseExtPanid = "";

    public constructor(path: string | undefined) {
        super();
        this.path = path || "";
        this.seqNumber = 0;
        this.configChanged = 0;

        this.writer = new Writer();
        this.parser = new Parser();

        this.tickTimer = setInterval(() => {
            this.tick();
        }, 100);

        this.onParsed = this.onParsed.bind(this);
        this.frameParserEvent.on("deviceStateUpdated", (data: number) => {
            this.checkDeviceStatus(data);
        });

        this.on("close", () => {
            for (const interval of this.intervals) {
                clearInterval(interval);
            }
            // TODO(mpi): Reject open promises!!
            queue.length = 0;
            busyQueue.length = 0;
            for (let i = 0; i < apsQueue.length; i++) {
                apsQueue[i].reject(new Error("Port closed"));
            }
            apsQueue.length = 0;
            for (let i = 0; i < apsBusyQueue.length; i++) {
                apsBusyQueue[i].reject(new Error("Port closed"));
            }
            apsBusyQueue.length = 0;
            this.timeoutCounter = 0;
        });

        this.on(DRIVER_EVENT, (event, data) => {
            this.handleStateEvent(event, data);
        });
    }

    public started(): boolean {
        return this.driverState === DriverState.Connected;
    }

    protected intervals: NodeJS.Timeout[] = [];

    protected registerInterval(interval: NodeJS.Timeout): void {
        this.intervals.push(interval);
    }

    protected async catchPromise<T>(val: Promise<T>): Promise<undefined | Awaited<T>> {
        return (await Promise.resolve(val).catch((err) => logger.debug(`Promise was caught with reason: ${err}`, NS))) as undefined | Awaited<T>;
    }

    private tick(): void {
        this.emitStateEvent(DriverEvent.Tick);
    }

    private emitStateEvent(event: DriverEvent, data?: DriverEventData) {
        this.emit(DRIVER_EVENT, event, data);
    }

    private checkWatchdog(): boolean {
        const now = Date.now();
        if (300 * 1000 < now - this.watchdogTriggeredTime) {
            logger.debug("Reset firmware watchdog", NS);
            this.watchdogTriggeredTime = now;
            this.sendWriteParameterRequest(ParamId.DEV_WATCHDOG_TTL, 600, this.nextSeqNumber());
            return true;
        }

        return false;
    }

    private handleFirmwareEvent(event: DriverEvent, data?: DriverEventData): void {
        if (event === DriverEvent.FirmwareCommandSend) {
            if (this.txState !== TxState.Idle) {
                throw new Error("Unexpected TX state not idle");
            }

            const d = data as CommandResult;
            this.txState = TxState.WaitResponse;
            this.txCommand = d.cmd;
            this.txSeq = d.seq;
            this.txTime = Date.now();
            // logger.debug(`tx wait for cmd: ${data.cmd.toString(16).padStart(2, '0')}, seq: ${data.seq}`, NS);
        } else if (event === DriverEvent.FirmwareCommandReceived) {
            if (this.txState !== TxState.WaitResponse) {
                return;
            }

            const d = data as CommandResult;
            if (this.txCommand === d.cmd && this.txSeq === d.seq) {
                this.txState = TxState.Idle;
                // logger.debug(`tx released for cmd: ${data.cmd.toString(16).padStart(2, '0')}, seq: ${data.seq}`, NS);
            }
        } else if (event === DriverEvent.FirmwareCommandTimeout) {
            if (this.txState === TxState.WaitResponse) {
                this.txState = TxState.Idle;
                logger.debug(`tx timeout for cmd: ${this.txCommand.toString(16).padStart(2, "0")}, seq: ${this.txSeq}`, NS);
            }
        } else if (event === DriverEvent.Tick) {
            if (this.txState === TxState.WaitResponse) {
                if (Date.now() - this.txTime > 1000) {
                    this.emitStateEvent(DriverEvent.FirmwareCommandTimeout);
                }
            }
        }
    }

    private handleConnectedStateEvent(event: DriverEvent, data?: DriverEventData): void {
        if (event === DriverEvent.DeviceStateUpdated) {
            // logger.debug(`Updated device status: ${data.toString(2)}`, NS);

            const netState = this.deviceStatus & DEV_STATUS_NET_STATE_MASK;

            if (this.txState === TxState.Idle) {
                if (netState === NetworkState.Connected) {
                    const status = data as number;
                    if (status & DEV_STATUS_APS_CONFIRM) {
                        this.deviceStatus = 0; // force refresh in response
                        this.sendReadApsConfirmRequest(this.nextSeqNumber());
                    } else if (status & DEV_STATUS_APS_INDICATION) {
                        this.deviceStatus = 0; // force refresh in response
                        this.sendReadApsIndicationRequest(this.nextSeqNumber());
                    } else if (status & DEV_STATUS_APS_FREE_SLOTS) {
                        this.deviceStatus = 0; // force refresh in response
                        this.processApsQueue();
                    }
                }
            }
        } else if (event === DriverEvent.Tick) {
            if (this.checkWatchdog()) {
                return;
            }

            this.processQueue();
            this.processBusyQueueTimeouts();
            this.processApsBusyQueueTimeouts();

            if (this.txState === TxState.Idle) {
                this.deviceStatus = 0; // force refresh in response
                this.sendReadDeviceStateRequest(this.nextSeqNumber());
            }
        } else if (event === DriverEvent.Disconnected) {
            logger.debug("Disconnected wait and reconnect", NS);
            this.driverStateStart = Date.now();
            this.driverState = DriverState.WaitToReconnect;
        }
    }

    private handleConnectingStateEvent(event: DriverEvent, _data?: DriverEventData): void {
        if (event === DriverEvent.Action) {
            this.watchdogTriggeredTime = 0; // force reset watchdog

            if (!this.path) {
                // unlikely but handle it anyway
                this.driverStateStart = Date.now();
                this.driverState = DriverState.WaitToReconnect;
                return;
            }

            let prom: Promise<void> | undefined;
            if (SocketPortUtils.isTcpPath(this.path)) {
                prom = this.openSocketPort();
            } else if (this.currentBaudRate) {
                prom = this.openSerialPort(this.currentBaudRate);
            } else {
                // unlikely but handle it anyway
                this.driverStateStart = Date.now();
                this.driverState = DriverState.WaitToReconnect;
            }

            if (prom) {
                prom.catch((err) => {
                    logger.debug(`${err}`, NS);
                    this.driverStateStart = Date.now();
                    this.driverState = DriverState.WaitToReconnect;
                });
            }
        } else if (event === DriverEvent.Connected) {
            this.driverStateStart = Date.now();
            this.driverState = DriverState.ReadConfiguration;
            this.emitStateEvent(DriverEvent.Action);
        }
    }

    private handleReadConfigurationStateEvent(event: DriverEvent, _data?: DriverEventData): void {
        if (event === DriverEvent.Action) {
            logger.debug("Query firmware parameters", NS);

            this.checkWatchdog();

            Promise.all([
                this.readFirmwareVersionRequest(),
                this.readParameterRequest(ParamId.MAC_ADDRESS),
                this.readParameterRequest(ParamId.NWK_PANID),
                this.readParameterRequest(ParamId.APS_USE_EXTENDED_PANID),
                this.readParameterRequest(ParamId.STK_CURRENT_CHANNEL),
                this.readParameterRequest(ParamId.STK_NETWORK_KEY, Buffer.from([0])),
                this.readParameterRequest(ParamId.STK_NWK_UPDATE_ID),
                this.readParameterRequest(ParamId.APS_CHANNEL_MASK),
                this.readParameterRequest(ParamId.STK_PROTOCOL_VERSION),
            ])
                .then(([fwVersion, mac, panid, apsUseExtPanid, currentChannel, nwkKey, nwkUpdateId, channelMask, protocolVersion]) => {
                    this.paramFirmwareVersion = fwVersion;
                    this.paramCurrentChannel = currentChannel as number;
                    this.paramApsUseExtPanid = apsUseExtPanid as string;
                    this.paramNwkPanid = panid as number;
                    this.paramNwkKey = nwkKey as string;
                    this.paramNwkUpdateId = nwkUpdateId as number;
                    this.paramMacAddress = mac as string;
                    this.paramChannelMask = channelMask as number;
                    this.paramProtocolVersion = protocolVersion as number;

                    console.log({fwVersion, mac, panid, apsUseExtPanid, currentChannel, nwkKey, nwkUpdateId, channelMask, protocolVersion});

                    this.driverStateStart = Date.now();
                    this.driverState = DriverState.Connected;
                    this.emit("connected"); // notify adapter
                })
                .catch((err) => {
                    logger.debug("Failed to query firmware parameters", NS);
                    // TODO(MPI): What now? disconnect reconnect?
                    throw err;
                });
        } else if (event === DriverEvent.Tick) {
            this.processQueue();
            this.processBusyQueueTimeouts();
        }
    }

    private handleReconfigureStateEvent(event: DriverEvent, _data?: DriverEventData): void {
        if (event === DriverEvent.Action) {
            logger.debug("Query firmware parameters", NS);

            this.checkWatchdog();

            Promise.all([
                this.readFirmwareVersionRequest(),
                this.readParameterRequest(ParamId.MAC_ADDRESS),
                this.readParameterRequest(ParamId.NWK_PANID),
                this.readParameterRequest(ParamId.APS_USE_EXTENDED_PANID),
                this.readParameterRequest(ParamId.STK_CURRENT_CHANNEL),
                this.readParameterRequest(ParamId.STK_NETWORK_KEY, Buffer.from([0])),
                this.readParameterRequest(ParamId.STK_NWK_UPDATE_ID),
                this.readParameterRequest(ParamId.APS_CHANNEL_MASK),
                this.readParameterRequest(ParamId.STK_PROTOCOL_VERSION),
            ])
                .then(([fwVersion, mac, panid, apsUseExtPanid, currentChannel, nwkKey, nwkUpdateId, channelMask, protocolVersion]) => {
                    this.paramFirmwareVersion = fwVersion;
                    this.paramCurrentChannel = currentChannel as number;
                    this.paramApsUseExtPanid = apsUseExtPanid as string;
                    this.paramNwkPanid = panid as number;
                    this.paramNwkKey = nwkKey as string;
                    this.paramNwkUpdateId = nwkUpdateId as number;
                    this.paramMacAddress = mac as string;
                    this.paramChannelMask = channelMask as number;
                    this.paramProtocolVersion = protocolVersion as number;

                    console.log({fwVersion, mac, panid, apsUseExtPanid, currentChannel, nwkKey, nwkUpdateId, channelMask, protocolVersion});

                    this.driverStateStart = Date.now();
                    this.driverState = DriverState.Connected;
                    this.emit("connected"); // notify adapter
                })
                .catch((err) => {
                    logger.debug("Failed to query firmware parameters", NS);
                    // TODO(MPI): What now? disconnect reconnect?
                    throw err;
                });
        } else if (event === DriverEvent.Tick) {
            this.processQueue();
            this.processBusyQueueTimeouts();
        }
    }

    private handleWaitToReconnectStateEvent(event: DriverEvent, _data?: DriverEventData): void {
        if (event === DriverEvent.Tick) {
            if (5000 < Date.now() - this.driverStateStart) {
                this.driverState = DriverState.Connecting;
                this.emitStateEvent(DriverEvent.Action);
            }
        }
    }

    private handleStateEvent(event: DriverEvent, data?: DriverEventData): void {
        try {
            // all states
            if (
                event === DriverEvent.Tick ||
                event === DriverEvent.FirmwareCommandReceived ||
                event === DriverEvent.FirmwareCommandSend ||
                event === DriverEvent.FirmwareCommandTimeout
            ) {
                this.handleFirmwareEvent(event, data);
            }

            if (this.driverState === DriverState.Init) {
                this.driverState = DriverState.WaitToReconnect;
                this.driverStateStart = 0; // force fast initial connect
            } else if (this.driverState === DriverState.Connected) {
                this.handleConnectedStateEvent(event, data);
            } else if (this.driverState === DriverState.Connecting) {
                this.handleConnectingStateEvent(event, data);
            } else if (this.driverState === DriverState.WaitToReconnect) {
                this.handleWaitToReconnectStateEvent(event, data);
            } else if (this.driverState === DriverState.ReadConfiguration) {
                this.handleReadConfigurationStateEvent(event, data);
            } else if (this.driverState === DriverState.Reconfigure) {
                this.handleReconfigureStateEvent(event, data);
            } else {
                if (event !== DriverEvent.Tick) {
                    logger.debug(`handle state: ${DriverState[this.driverState]}, event: ${DriverEvent[event]}`, NS);
                }
            }
        } catch (err) {
            console.error(err);
            //logger.error(JSON.stringify(err), NS);
        }
    }

    private onPortClose(error: boolean | Error): void {
        logger.debug("Port closed", NS);

        if (error) {
            logger.info(`Port close ${error}`, NS);
        }

        this.emitStateEvent(DriverEvent.Disconnected);
        this.emit("close");
    }

    private onPortError(error: Error): void {
        logger.error(`Port error: ${error}`, NS);
        this.emitStateEvent(DriverEvent.Disconnected);
        this.emit("close");
    }

    public open(baudrate: number): void {
        this.currentBaudRate = baudrate;
    }

    public openSerialPort(baudrate: number): Promise<void> {
        return new Promise((resolve, reject): void => {
            if (!this.path) {
                reject(new Error("Failed to open serial port, path is undefined"));
            }

            logger.debug(`Opening serial port with ${this.path}`, NS);

            const path = this.path || "";

            if (!this.serialPort) {
                this.serialPort = new SerialPort({path, baudRate: baudrate, autoOpen: false});
                this.writer.pipe(this.serialPort);
                this.serialPort.pipe(this.parser);
                this.parser.on("parsed", this.onParsed);
                this.serialPort.on("close", this.onPortClose.bind(this));
                this.serialPort.on("error", this.onPortError.bind(this));
            }

            if (!this.serialPort) {
                reject(new Error("Failed to create SerialPort instance"));
                return;
            }

            if (this.serialPort.isOpen) {
                reject(new Error("Called openSerialPort() while it is already open"));
                return;
            }

            this.serialPort.open((error) => {
                if (error) {
                    reject(new Error(`Error while opening serialport '${error}'`));

                    if (this.serialPort) {
                        if (this.serialPort.isOpen) {
                            this.emitStateEvent(DriverEvent.ConnectError);
                            //this.serialPort!.close();
                        }
                    }
                } else {
                    logger.debug("Serialport opened", NS);
                    this.emitStateEvent(DriverEvent.Connected);
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
                this.emitStateEvent(DriverEvent.Connected);
                resolve();
            });

            // biome-ignore lint/style/noNonNullAssertion: ignored using `--suppress`
            this.socketPort!.once("close", this.onPortClose);

            // biome-ignore lint/style/noNonNullAssertion: ignored using `--suppress`
            this.socketPort!.on("error", (error) => {
                logger.error(`Socket error ${error}`, NS);
                reject(new Error("Error while opening socket"));
            });

            // biome-ignore lint/style/noNonNullAssertion: ignored using `--suppress`
            this.socketPort!.connect(info.port, info.host);
        });
    }

    public close(): Promise<void> {
        return new Promise((resolve, reject): void => {
            if (this.serialPort) {
                if (this.serialPort.isOpen) {
                    // wait until remaining data is written
                    this.serialPort.flush();
                    this.serialPort.close((error): void => {
                        if (error) {
                            // TODO(mpi): monitor, this must not happen after drain
                            // close() failes if there is pending data to write!
                            this.emitStateEvent(DriverEvent.CloseError);
                            reject(new Error(`Error while closing serialport '${error}'`));
                            return;
                        }
                    });
                }

                this.emitStateEvent(DriverEvent.Disconnected);
                this.emit("close");
                resolve();
            } else if (this.socketPort) {
                this.socketPort.destroy();
                this.emitStateEvent(DriverEvent.Disconnected);
                resolve();
            } else {
                resolve();
                this.emit("close");
            }
        });
    }

    public readParameterRequest(parameterId: ParamId, parameter?: Buffer | undefined): Promise<unknown> {
        const seqNumber = this.nextSeqNumber();
        return new Promise((resolve, reject): void => {
            //logger.debug(`push read parameter request to queue. seqNr: ${seqNumber} paramId: ${parameterId}`, NS);
            const ts = 0;
            const commandId = FirmwareCommand.ReadParameter;
            const networkState = NetworkState.Ignore;

            const req: Request = {commandId, networkState, parameterId, parameter, seqNumber, resolve, reject, ts};
            queue.push(req);
        });
    }

    public writeParameterRequest(parameterId: ParamId, parameter: Buffer | number): Promise<void> {
        const seqNumber = this.nextSeqNumber();
        return new Promise((resolve, reject): void => {
            //logger.debug(`push write parameter request to queue. seqNr: ${seqNumber} paramId: ${parameterId} parameter: ${parameter}`, NS);
            const ts = 0;
            const commandId = FirmwareCommand.WriteParameter;
            const networkState = NetworkState.Ignore;
            const req: Request = {commandId, networkState, parameterId, parameter, seqNumber, resolve, reject, ts};
            queue.push(req);
        });
    }

    public async writeLinkKey(ieeeAddress: string, hashedKey: Buffer): Promise<void> {
        const buf = Buffer.alloc(8 + 16);

        if (ieeeAddress[1] !== "x") {
            ieeeAddress = `0x${ieeeAddress}`;
        }

        buf.writeBigUint64LE(BigInt(ieeeAddress));
        for (let i = 0; i < 16; i++) {
            buf.writeUint8(hashedKey[i], 8 + i);
        }

        await this.writeParameterRequest(ParamId.STK_LINK_KEY, buf);
    }

    public readFirmwareVersionRequest(): Promise<number> {
        const seqNumber = this.nextSeqNumber();
        return new Promise((resolve, reject): void => {
            //logger.debug(`push read firmware version request to queue. seqNr: ${seqNumber}`, NS);
            const ts = 0;
            const commandId = FirmwareCommand.FirmwareVersion;
            const networkState = NetworkState.Ignore;
            const parameterId = ParamId.NONE;
            const req: Request = {commandId, networkState, parameterId, seqNumber, resolve, reject, ts};
            queue.push(req);
        });
    }

    private sendReadParameterRequest(parameterId: ParamId, seqNumber: number): CommandResult {
        /* command id, sequence number, 0, framelength(U16), payloadlength(U16), parameter id */
        // TODO(mpi): refactor so this proper supports arguments
        if (parameterId === ParamId.STK_NETWORK_KEY) {
            return this.sendRequest(Buffer.from([FirmwareCommand.ReadParameter, seqNumber, 0x00, 0x09, 0x00, 0x02, 0x00, parameterId, 0x00]));
        }

        return this.sendRequest(Buffer.from([FirmwareCommand.ReadParameter, seqNumber, 0x00, 0x08, 0x00, 0x01, 0x00, parameterId]));
    }

    private sendWriteParameterRequest(parameterId: ParamId, value: Buffer | number, seqNumber: number): CommandResult {
        // command id, sequence number, 0, framelength(U16), payloadlength(U16), parameter id, parameter
        const param = stackParameters.find((x) => x.id === parameterId);
        if (!param) {
            throw new Error("tried to write unknown stack parameter");
        }

        const buf = Buffer.alloc(128);
        let pos = 0;
        buf.writeUInt8(FirmwareCommand.WriteParameter, pos);
        pos += 1;
        buf.writeUInt8(seqNumber, pos);
        pos += 1;
        buf.writeUInt8(0, pos); // status: not used
        pos += 1;

        const posFrameLength = pos; // remember
        buf.writeUInt16LE(0, pos); // dummy frame length
        pos += 2;
        // -------------- actual data ---------------------------------------
        const posPayloadLength = pos; // remember
        buf.writeUInt16LE(0, pos); // dummy payload length
        pos += 2;
        buf.writeUInt8(parameterId, pos);
        pos += 1;

        if (value instanceof Buffer) {
            for (let i = 0; i < value.length; i++) {
                buf.writeUInt8(value[i], pos);
                pos += 1;
            }
        } else if (typeof value === "number") {
            if (param.type === DataType.U8) {
                buf.writeUInt8(value, pos);
                pos += 1;
            } else if (param.type === DataType.U16) {
                buf.writeUInt16LE(value, pos);
                pos += 2;
            } else if (param.type === DataType.U32) {
                buf.writeUInt32LE(value, pos);
                pos += 4;
            } else {
                throw new Error("tried to write unknown parameter number type");
            }
        } else {
            throw new Error("tried to write unknown parameter type");
        }

        const payloadLength = pos - (posPayloadLength + 2);

        buf.writeUInt16LE(payloadLength, posPayloadLength); // actual payload length
        buf.writeUInt16LE(pos, posFrameLength); // actual frame length

        const out = buf.subarray(0, pos);
        return this.sendRequest(out);
    }

    private sendReadFirmwareVersionRequest(seqNumber: number): CommandResult {
        /* command id, sequence number, 0, framelength(U16) */
        return this.sendRequest(Buffer.from([FirmwareCommand.FirmwareVersion, seqNumber, 0x00, 0x09, 0x00, 0x00, 0x00, 0x00, 0x00]));
    }

    private sendReadDeviceStateRequest(seqNumber: number): CommandResult {
        /* command id, sequence number, 0, framelength(U16) */
        return this.sendRequest(Buffer.from([FirmwareCommand.Status, seqNumber, 0x00, 0x08, 0x00, 0x00, 0x00, 0x00]));
    }

    private sendRequest(buffer: Buffer): CommandResult {
        const frame = Buffer.concat([buffer, this.calcCrc(buffer)]);
        const slipframe = slip.encode(frame);

        if (frame[0] === 0x00) {
            throw new Error(`send unexpected frame with invalid command ID: 0x${frame[0].toString(16).padStart(2, "0")}`);
        }

        if (slipframe.length >= 256) {
            throw new Error("send unexpected long slip frame");
        }

        let written = false;

        if (this.serialPort) {
            if (!this.serialPort.isOpen) {
                throw new Error("Can't write to serial port while it isn't open");
            }

            for (let retry = 0; retry < 3 && !written; retry++) {
                written = this.serialPort.write(slipframe, (err) => {
                    if (err) {
                        throw new Error(`Failed to write to serial port: ${err.message}`);
                    }
                });

                // if written is false, we also need to wait for drain()
                this.serialPort.drain(); // flush
            }
        } else if (this.socketPort) {
            written = this.socketPort.write(slipframe, (err) => {
                if (err) {
                    throw new Error(`Failed to write to serial port: ${err.message}`);
                }
                written = true;
            });

            // handle in upper functions
            // if (!written) {
            //     await this.sleep(1000);
            // }
        }

        if (!written) {
            throw new Error(`Failed to send request cmd: ${frame[0]}, seq: ${frame[1]}`);
        }

        const result = {cmd: frame[0], seq: frame[1]};
        this.emitStateEvent(DriverEvent.FirmwareCommandSend, result);
        return result;
    }

    private processQueue(): void {
        if (queue.length === 0) {
            return;
        }
        if (busyQueue.length > 0) {
            return;
        }

        if (this.txState !== TxState.Idle) {
            return;
        }

        const req: Request | undefined = queue.shift();

        if (req) {
            req.ts = Date.now();

            try {
                switch (req.commandId) {
                    case FirmwareCommand.ReadParameter:
                        logger.debug(`send read parameter request from queue. parameter: ${ParamId[req.parameterId]} seq: ${req.seqNumber}`, NS);
                        this.sendReadParameterRequest(req.parameterId, req.seqNumber);
                        break;
                    case FirmwareCommand.WriteParameter:
                        if (req.parameter === undefined) {
                            throw new Error(`Write parameter request without parameter: ${ParamId[req.parameterId]}`);
                        }
                        logger.debug(`Send write parameter request from queue. seq: ${req.seqNumber} parameter: ${ParamId[req.parameterId]}`, NS);
                        this.sendWriteParameterRequest(req.parameterId, req.parameter, req.seqNumber);
                        break;
                    case FirmwareCommand.FirmwareVersion:
                        logger.debug(`Send read firmware version request from queue. seq: ${req.seqNumber}`, NS);
                        this.sendReadFirmwareVersionRequest(req.seqNumber);
                        break;
                    case FirmwareCommand.Status:
                        //logger.debug(`Send read device state from queue. seqNr: ${req.seqNumber}`, NS);
                        this.sendReadDeviceStateRequest(req.seqNumber);
                        break;
                    case FirmwareCommand.ChangeNetworkState:
                        logger.debug(`Send change network state request from queue. seq: ${req.seqNumber}`, NS);
                        this.sendChangeNetworkStateRequest(req.seqNumber, req.networkState);
                        break;
                    default:
                        throw new Error("process queue - unknown command id");
                }

                busyQueue.push(req);
            } catch (_) {
                req.reject(new Error(`Failed to process request ${FirmwareCommand[req.commandId]}, seq: ${req.seqNumber}`));
            }
        }
    }

    private processBusyQueueTimeouts(): void {
        let i = busyQueue.length;
        while (i--) {
            const req: Request = busyQueue[i];
            const now = Date.now();

            if (10000 < now - req.ts) {
                //remove from busyQueue
                busyQueue.splice(i, 1);
                this.timeoutCounter++;
                req.reject(new Error(`Timeout for queued command ${FirmwareCommand[req.commandId]}, seq: ${req.seqNumber}`));
            }
        }
    }

    public changeNetworkStateRequest(networkState: NetworkState): Promise<void> {
        const seqNumber = this.nextSeqNumber();
        return new Promise((resolve, reject): void => {
            //logger.debug(`push change network state request to apsQueue. seqNr: ${seqNumber}`, NS);
            const ts = 0;
            const commandId = FirmwareCommand.ChangeNetworkState;
            const parameterId = ParamId.NONE;
            const req: Request = {commandId, networkState, parameterId, seqNumber, resolve, reject, ts};
            queue.push(req);
        });
    }

    private sendChangeNetworkStateRequest(seqNumber: number, networkState: NetworkState): CommandResult {
        return this.sendRequest(Buffer.from([FirmwareCommand.ChangeNetworkState, seqNumber, 0x00, 0x06, 0x00, networkState]));
    }

    private checkDeviceStatus(deviceStatus: number): void {
        this.deviceStatus = deviceStatus;
        this.configChanged = (deviceStatus >> 4) & 0x01;
        this.emitStateEvent(DriverEvent.DeviceStateUpdated, deviceStatus);
    }

    public enqueueApsDataRequest(request: ApsDataRequest): Promise<undefined | ReceivedDataResponse> {
        const seqNumber = this.nextSeqNumber();
        return new Promise((resolve, reject): void => {
            //logger.debug(`push enqueue send data request to apsQueue. seqNr: ${seqNumber}`, NS);
            const ts = Date.now();
            const commandId = FirmwareCommand.ApsDataRequest;
            const req: ApsRequest = {commandId, seqNumber, request, resolve, reject, ts};
            apsQueue.push(req);
            this.emitStateEvent(DriverEvent.EnqueuedApsDataRequest, req.seqNumber);
        });
    }

    private processApsQueue(): void {
        if (apsQueue.length === 0) {
            return;
        }

        if (this.txState !== TxState.Idle) {
            return;
        }

        const req = apsQueue.shift();
        if (!req) {
            return;
        }

        if (req.request) {
            req.ts = Date.now();

            if (req.commandId !== FirmwareCommand.ApsDataRequest) {
                // should never happen
                throw new Error("process APS queue - unknown command id");
            }

            try {
                this.sendEnqueueApsDataRequest(req.request, req.seqNumber);
                apsBusyQueue.push(req);
            } catch (_) {
                apsQueue.unshift(req);
            }
        }
    }

    private sendReadApsConfirmRequest(seqNumber: number): CommandResult {
        logger.debug(`Request APS-DATA.confirm seq: ${seqNumber}`, NS);
        return this.sendRequest(Buffer.from([FirmwareCommand.ApsDataConfirm, seqNumber, 0x00, 0x07, 0x00, 0x00, 0x00]));
    }

    private sendReadApsIndicationRequest(seqNumber: number): CommandResult {
        logger.debug(`Request APS-DATA.indication seq: ${seqNumber}`, NS);
        return this.sendRequest(Buffer.from([FirmwareCommand.ApsDataIndication, seqNumber, 0x00, 0x08, 0x00, 0x01, 0x00, 0x01]));
    }

    private sendEnqueueApsDataRequest(request: ApsDataRequest, seqNumber: number): CommandResult {
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

        logger.debug(`Request APS-DATA.request: dest: 0x${dest} seq: ${seqNumber} requestId: ${request.requestId}`, NS);

        return this.sendRequest(
            Buffer.from([
                FirmwareCommand.ApsDataRequest,
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

    private processApsBusyQueueTimeouts(): void {
        let i = apsBusyQueue.length;
        while (i--) {
            const req = apsBusyQueue[i];
            const now = Date.now();
            let timeout = 60000;
            if (req.request != null && req.request.timeout != null) {
                timeout = req.request.timeout * 1000; // seconds * 1000 = milliseconds
            }
            if (now - req.ts > timeout) {
                //remove from busyQueue
                apsBusyQueue.splice(i, 1);
                req.reject(new Error(`Timeout for APS-DATA.request, seq: ${req.seqNumber}`));
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
        if (frame.length >= 5) {
            // min. packet length [cmd, seq, status, u16 storedLength]
            const storedLength = (frame[4] << 8) | frame[3];
            if (storedLength + 2 !== frame.length) {
                // frame without CRC16
                return;
            }

            let crc = 0;
            for (let i = 0; i < storedLength; i++) {
                crc += frame[i];
            }

            crc = (~crc + 1) & 0xffff;
            const crcFrame = (frame[frame.length - 1] << 8) | frame[frame.length - 2];

            if (crc === crcFrame) {
                this.lastFirmwareRxTime = Date.now();
                this.emitStateEvent(DriverEvent.FirmwareCommandReceived, {cmd: frame[0], seq: frame[1]});
                this.emit("rxFrame", frame.slice(0, storedLength));
            } else {
                logger.debug("frame CRC invalid (could be ASCII message)", NS);
            }
        } else {
            logger.debug(`frame length (${frame.length}) < 5, discard`, NS);
        }
    }

    private sleep(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}

export default Driver;
