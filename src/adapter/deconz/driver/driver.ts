/* v8 ignore start */

import events from "node:events";
import net from "node:net";

import slip from "slip";
import {Buffalo} from "../../../buffalo";
import type {Backup} from "../../../models";
import {logger} from "../../../utils/logger";
import {SerialPort} from "../../serialPort";
import SocketPortUtils from "../../socketPortUtils";
import type {NetworkOptions, SerialPortOptions} from "../../tstype";
import PARAM, {
    ApsAddressMode,
    type ApsDataRequest,
    type ApsRequest,
    DataType,
    FirmwareCommand,
    NetworkState,
    NwkBroadcastAddress,
    ParamId,
    type ReceivedDataResponse,
    type Request,
    stackParameters,
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
    CloseAndRestart = 6,
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
    private serialPort?: SerialPort;
    private serialPortOptions: SerialPortOptions;
    private writer: Writer;
    private parser: Parser;
    private frameParserEvent = frameParserEvents;
    private seqNumber: number;
    private deviceStatus = 0;
    // biome-ignore lint/correctness/noUnusedPrivateClassMembers: ignore
    private configChanged: number;
    private socketPort?: net.Socket;
    // biome-ignore lint/correctness/noUnusedPrivateClassMembers: ignore
    private timeoutCounter = 0;
    private watchdogTriggeredTime = 0;
    // biome-ignore lint/correctness/noUnusedPrivateClassMembers: ignore
    private lastFirmwareRxTime = 0;
    // biome-ignore lint/correctness/noUnusedPrivateClassMembers: ignore
    private tickTimer: NodeJS.Timeout;
    private driverStateStart = 0;
    private driverState: DriverState = DriverState.Init;
    private firmwareLog: string[];
    private transactionID = 0; // for APS and ZDO
    // in flight lockstep sending commands
    private txState: TxState = TxState.Idle;
    private txCommand = 0;
    private txSeq = 0;
    private txTime = 0;
    private networkOptions: NetworkOptions;
    private backup: Backup | undefined;
    private configMatchesBackup = false;
    private configIsNewNetwork = false;
    public restoredFromBackup = false;
    public paramMacAddress = 0n;
    public paramTcAddress = 0n;
    public paramFirmwareVersion = 0;
    public paramCurrentChannel = 0;
    public paramNwkPanid = 0;
    public paramNwkKey = Buffer.alloc(16);
    public paramEndpoint0: Buffer | undefined;
    public paramEndpoint1: Buffer | undefined;
    public fixParamEndpoint0: Buffer;
    public fixParamEndpoint1: Buffer;
    public paramNwkUpdateId = 0;
    public paramChannelMask = 0;
    public paramProtocolVersion = 0;
    public paramFrameCounter = 0;
    public paramApsUseExtPanid = 0n;

    public constructor(serialPortOptions: SerialPortOptions, networkOptions: NetworkOptions, backup: Backup | undefined, firmwareLog: string[]) {
        super();
        this.seqNumber = 0;
        this.configChanged = 0;
        this.networkOptions = networkOptions;
        this.serialPortOptions = serialPortOptions;
        this.backup = backup;
        this.firmwareLog = firmwareLog;

        this.writer = new Writer();
        this.parser = new Parser();

        this.fixParamEndpoint0 = Buffer.from([
            0x00, // index
            0x01, // endpoint,
            0x04, // profileId
            0x01,
            0x05, // deviceId
            0x00,
            0x01, // deviceVersion
            0x05, // in cluster count
            0x00, // basic
            0x00,
            0x06, // on/off
            0x00,
            0x0a, // time
            0x00,
            0x19, // ota
            0x00,
            0x01, // ias ace
            0x05,
            0x04, // out cluster count
            0x01, // power configuration
            0x00,
            0x20, // poll control
            0x00,
            0x00, // ias zone
            0x05,
            0x02, // ias wd
            0x05,
        ]);

        this.fixParamEndpoint1 = Buffer.from([
            0x01, // index
            0xf2, // endpoint,
            0xe0, // profileId
            0xa1,
            0x64, // deviceId
            0x00,
            0x01, // deviceVersion
            0x00, // in cluster count
            0x01, // out cluster count
            0x21, // green power
            0x00,
        ]);

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

            this.timeoutCounter = 0;
            this.cleanupAllQueues();
        });

        this.on(DRIVER_EVENT, (event, data) => {
            this.handleStateEvent(event, data);
        });
    }

    public cleanupAllQueues() {
        const msg = `Cleanup in state: ${DriverState[this.driverState]}`;

        for (let i = 0; i < queue.length; i++) {
            queue[i].reject(new Error(msg));
        }
        queue.length = 0;

        for (let i = 0; i < busyQueue.length; i++) {
            busyQueue[i].reject(new Error(msg));
        }
        busyQueue.length = 0;

        for (let i = 0; i < apsQueue.length; i++) {
            apsQueue[i].reject(new Error(msg));
        }
        apsQueue.length = 0;

        for (let i = 0; i < apsBusyQueue.length; i++) {
            apsBusyQueue[i].reject(new Error(msg));
        }
        apsBusyQueue.length = 0;
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

    public nextTransactionID(): number {
        this.transactionID++;

        if (this.transactionID > 255) {
            this.transactionID = 1;
        }

        return this.transactionID;
    }

    private tick(): void {
        this.emitStateEvent(DriverEvent.Tick);
    }

    private emitStateEvent(event: DriverEvent, data?: DriverEventData) {
        this.emit(DRIVER_EVENT, event, data);
    }

    private needWatchdogReset(): boolean {
        const now = Date.now();
        if (300 * 1000 < now - this.watchdogTriggeredTime) {
            return true;
        }
        return false;
    }

    private async resetWatchdog(): Promise<void> {
        const lastTime = this.watchdogTriggeredTime;

        try {
            logger.debug("Reset firmware watchdog", NS);
            // Set timestamp before command to let needWatchdogReset() no trigger multiple times.
            this.watchdogTriggeredTime = Date.now();
            await this.writeParameterRequest(ParamId.DEV_WATCHDOG_TTL, 600);
            logger.debug("Reset firmware watchdog success", NS);
        } catch (_err) {
            this.watchdogTriggeredTime = lastTime;
            logger.debug("Reset firmware watchdog failed", NS);
        }
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
            //logger.debug(`tx wait for cmd: ${d.cmd.toString(16).padStart(2, "0")}, seq: ${d.seq}`, NS);
        } else if (event === DriverEvent.FirmwareCommandReceived) {
            if (this.txState !== TxState.WaitResponse) {
                return;
            }

            const d = data as CommandResult;
            if (this.txCommand === d.cmd && this.txSeq === d.seq) {
                this.txState = TxState.Idle;
                //logger.debug(`tx released for cmd: ${d.cmd.toString(16).padStart(2, "0")}, seq: ${d.seq}`, NS);
            }
        } else if (event === DriverEvent.FirmwareCommandTimeout) {
            if (this.txState === TxState.WaitResponse) {
                this.txState = TxState.Idle;
                logger.debug(`tx timeout for cmd: ${this.txCommand.toString(16).padStart(2, "0")}, seq: ${this.txSeq}`, NS);
            }
        } else if (event === DriverEvent.Tick) {
            if (this.txState === TxState.WaitResponse) {
                if (Date.now() - this.txTime > 2000) {
                    this.emitStateEvent(DriverEvent.FirmwareCommandTimeout);
                }
            }
        }
    }

    private handleConnectedStateEvent(event: DriverEvent, _data?: DriverEventData): void {
        if (event === DriverEvent.DeviceStateUpdated) {
            this.handleApsQueueOnDeviceState();
        } else if (event === DriverEvent.Tick) {
            if (this.needWatchdogReset()) {
                this.resetWatchdog();
            }

            this.processQueue();

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

            this.cleanupAllQueues(); // start with fresh queues

            // TODO(mpi): In future we should simply try which baudrate may work (in a state machine).
            // E.g. connect with baudrate XY, query firmware, on timeout try other baudrate.
            // Most units out there are ConBee2/3 which support 115200.
            // The 38400 default is outdated now and only works for a few units.
            const baudrate = this.serialPortOptions.baudRate || 38400;

            if (!this.serialPortOptions.path) {
                // unlikely but handle it anyway
                this.driverStateStart = Date.now();
                this.driverState = DriverState.WaitToReconnect;
                return;
            }

            let prom: Promise<void> | undefined;
            if (SocketPortUtils.isTcpPath(this.serialPortOptions.path)) {
                prom = this.openSocketPort();
            } else if (baudrate) {
                prom = this.openSerialPort(baudrate);
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

    private isNetworkConfigurationValid(): boolean {
        const opts = this.networkOptions;

        let configExtPanID = 0n;
        const configNetworkKey = Buffer.from(opts.networkKey || []);

        if (opts.extendedPanID) {
            // NOTE(mpi): U64 values in buffer are big endian!
            configExtPanID = Buffer.from(opts.extendedPanID).readBigUInt64BE();
        }

        if (this.backup) {
            // NOTE(mpi): U64 values in buffer are big endian!
            const backupExtPanID = Buffer.from(this.backup.networkOptions.extendedPanId).readBigUInt64BE();

            if (
                opts.panID === this.backup.networkOptions.panId &&
                configExtPanID === backupExtPanID &&
                opts.channelList.includes(this.backup.logicalChannel) &&
                configNetworkKey.equals(this.backup.networkOptions.networkKey)
            ) {
                logger.debug("Configuration matches backup", NS);
                this.configMatchesBackup = true;
            } else {
                logger.debug("Configuration doesn't match backup (ignore backup)", NS);
                this.configMatchesBackup = false; // ignore Backup
            }
        }

        if (this.paramMacAddress !== this.paramTcAddress) {
            return false;
        }

        if (!this.paramEndpoint0 || this.fixParamEndpoint0.compare(this.paramEndpoint0) !== 0) {
            logger.debug("Endpoint[0] doesn't match configuration", NS);
            return false;
        }

        if (!this.paramEndpoint1 || this.fixParamEndpoint1.compare(this.paramEndpoint1) !== 0) {
            logger.debug("Endpoint[1] doesn't match configuration", NS);
            return false;
        }

        if ((this.deviceStatus & DEV_STATUS_NET_STATE_MASK) !== NetworkState.Connected) {
            return false;
        }

        if (opts.channelList.find((ch) => ch === this.paramCurrentChannel) === undefined) {
            return false;
        }

        if (configExtPanID !== 0n) {
            if (configExtPanID !== this.paramApsUseExtPanid) {
                this.configIsNewNetwork = true;
                return false;
            }
        }

        if (opts.panID !== this.paramNwkPanid) {
            return false;
        }

        if (opts.networkKey) {
            if (!configNetworkKey.equals(this.paramNwkKey)) {
                // this.configIsNewNetwork = true; // maybe, but we need to consider key rotation
                return false;
            }
        }

        if (this.backup && this.configMatchesBackup) {
            // The backup might be from another unit, if the mac doesn't match clone it!
            // NOTE(mpi): U64 values in buffer are big endian!
            const backupMacAddress = this.backup.coordinatorIeeeAddress.readBigUInt64BE();
            if (backupMacAddress !== this.paramMacAddress) {
                this.configIsNewNetwork = true;
                return false;
            }

            if (this.paramNwkUpdateId < this.backup.networkUpdateId) {
                return false;
            }

            // NOTE(mpi): Ignore the frame counter for now and only handle in case of this.configIsNewNetwork == true.
            // TODO(mpi): We might also check Trust Center Link Key and key sequence number (unlikely but possible case).
        }

        // TODO(mpi): Check endpoint configuration
        // const ep1 =  = await this.driver.readParameterRequest(PARAM.PARAM.STK.Endpoint,);
        return true;
    }

    private async reconfigureNetwork(): Promise<void> {
        const opts = this.networkOptions;

        // if the configuration has a different channel, broadcast a channel change to the network first
        if (this.networkOptions.channelList.length !== 0) {
            if (opts.channelList[0] !== this.paramCurrentChannel) {
                logger.debug(`change channel from ${this.paramCurrentChannel} to ${opts.channelList[0]}`, NS);
                // increase the NWK Update ID so devices which search for the network know this is an update
                this.paramNwkUpdateId = (this.paramNwkUpdateId + 1) % 255;
                this.paramCurrentChannel = opts.channelList[0];

                if ((this.deviceStatus & DEV_STATUS_NET_STATE_MASK) === NetworkState.Connected) {
                    await this.sendChangeChannelRequest();
                }
            }
        }

        // first disconnect the network
        await this.changeNetworkStateRequest(NetworkState.Disconnected);

        // check if a backup needs to be applied
        // Ember check if backup is needed:
        // - panId, extPanId, network key different -> leave network
        // - left or not joined -> consider using backup
        // backup is only used when matching the z2m config: panId, extPanId, channel, network key
        // parameters restored from backup:
        // - networkKey,
        // - networkKeyInfo.sequenceNumber  NOTE(mpi): not a reason for using backup!?
        // - networkKeyInfo.frameCounter
        // - networkOptions.panId
        // - extendedPanId
        // - logicalChannel
        // - backup!.ezsp!.hashed_tclk!     NOTE(mpi): not a reason for using backup!?
        // - backup!.networkUpdateId        NOTE(mpi): not a reason for using backup!?

        let frameCounter = 0;

        if (this.backup && this.configMatchesBackup) {
            // NOTE(mpi): U64 values in buffer are big endian!
            const backupMacAddress = this.backup.coordinatorIeeeAddress.readBigUInt64BE();
            if (backupMacAddress !== this.paramMacAddress) {
                logger.debug(
                    `Use mac address from backup 0x${backupMacAddress.toString(16).padStart(16, "0")}, replaces 0x${this.paramMacAddress.toString(16).padStart(16, "0")}`,
                    NS,
                );
                this.paramMacAddress = backupMacAddress;
                this.restoredFromBackup = true;

                await this.writeParameterRequest(ParamId.MAC_ADDRESS, backupMacAddress);
            }

            if (this.configIsNewNetwork && this.paramFrameCounter < this.backup.networkKeyInfo.frameCounter) {
                // delicate situation, only update frame counter if:
                // - backup counter is higher
                // - this is in fact a new network
                // - configIsNewNetwork guards also from mistreating counter overflow
                logger.debug(`Use higher frame counter from backup ${this.backup.networkKeyInfo.frameCounter}`, NS);
                // Additionally increase frame counter. Note this might still be too low!
                frameCounter = this.backup.networkKeyInfo.frameCounter + 1000;
                this.restoredFromBackup = true;
            }

            if (this.paramNwkUpdateId < this.backup.networkUpdateId) {
                logger.debug(`Use network update ID from backup ${this.backup.networkUpdateId}`, NS);
                this.paramNwkUpdateId = this.backup.networkUpdateId;
                this.restoredFromBackup = true;
            }

            // TODO(mpi): Later on also check key sequence number.
        }

        if (this.paramMacAddress !== this.paramTcAddress) {
            this.paramTcAddress = this.paramMacAddress;
            await this.writeParameterRequest(ParamId.APS_TRUST_CENTER_ADDRESS, this.paramTcAddress);
        }

        if (this.configIsNewNetwork && this.paramFrameCounter < frameCounter) {
            this.paramFrameCounter = frameCounter;
            try {
                await this.writeParameterRequest(ParamId.STK_FRAME_COUNTER, this.paramFrameCounter);
            } catch (_err) {
                // on older firmware versions this fails as unsuppored
            }
        }

        await this.writeParameterRequest(ParamId.STK_NWK_UPDATE_ID, this.paramNwkUpdateId);

        if (this.networkOptions.channelList.length !== 0) {
            await this.writeParameterRequest(ParamId.APS_CHANNEL_MASK, 1 << this.networkOptions.channelList[0]);
        }

        this.paramNwkPanid = this.networkOptions.panID;
        await this.writeParameterRequest(ParamId.NWK_PANID, this.networkOptions.panID);
        await this.writeParameterRequest(ParamId.STK_PREDEFINED_PANID, 1);

        if (this.networkOptions.extendedPanID) {
            // NOTE(mpi): U64 values in buffer are big endian!
            this.paramApsUseExtPanid = Buffer.from(this.networkOptions.extendedPanID).readBigUInt64BE();
            await this.writeParameterRequest(ParamId.APS_USE_EXTENDED_PANID, this.paramApsUseExtPanid);
        }

        // check current network key against configuration.yaml
        if (this.networkOptions.networkKey) {
            this.paramNwkKey = Buffer.from(this.networkOptions.networkKey);
            await this.writeParameterRequest(ParamId.STK_NETWORK_KEY, Buffer.from([0x0, ...this.networkOptions.networkKey]));
        }

        // check current endpoint configuration
        if (!this.paramEndpoint0 || this.fixParamEndpoint0.compare(this.paramEndpoint0) !== 0) {
            this.paramEndpoint0 = this.fixParamEndpoint0;
            await this.writeParameterRequest(ParamId.STK_ENDPOINT, this.paramEndpoint0);
        }

        if (!this.paramEndpoint1 || this.fixParamEndpoint1.compare(this.paramEndpoint1) !== 0) {
            this.paramEndpoint1 = this.fixParamEndpoint1;
            await this.writeParameterRequest(ParamId.STK_ENDPOINT, this.paramEndpoint1);
        }

        // now reconnect, this will also store configuration in nvram
        await this.changeNetworkStateRequest(NetworkState.Connected);
        return;
    }

    private handleReadConfigurationStateEvent(event: DriverEvent, _data?: DriverEventData): void {
        if (event === DriverEvent.Action) {
            logger.debug("Query firmware parameters", NS);

            this.deviceStatus = 0; // need fresh value

            Promise.all([
                this.resetWatchdog(),
                this.readFirmwareVersionRequest(),
                this.readDeviceStatusRequest(),
                this.readParameterRequest(ParamId.MAC_ADDRESS),
                this.readParameterRequest(ParamId.APS_TRUST_CENTER_ADDRESS),
                this.readParameterRequest(ParamId.NWK_PANID),
                this.readParameterRequest(ParamId.APS_USE_EXTENDED_PANID),
                this.readParameterRequest(ParamId.STK_CURRENT_CHANNEL),
                this.readParameterRequest(ParamId.STK_NETWORK_KEY, Buffer.from([0])),
                this.readParameterRequest(ParamId.STK_NWK_UPDATE_ID),
                this.readParameterRequest(ParamId.APS_CHANNEL_MASK),
                this.readParameterRequest(ParamId.STK_PROTOCOL_VERSION),
                this.readParameterRequest(ParamId.STK_FRAME_COUNTER),
                this.readParameterRequest(ParamId.STK_ENDPOINT, Buffer.from([0])),
                this.readParameterRequest(ParamId.STK_ENDPOINT, Buffer.from([1])),
            ])
                .then(
                    ([
                        _watchdog,
                        fwVersion,
                        _deviceState,
                        mac,
                        tcAddress,
                        panid,
                        apsUseExtPanid,
                        currentChannel,
                        nwkKey,
                        nwkUpdateId,
                        channelMask,
                        protocolVersion,
                        frameCounter,
                        ep0,
                        ep1,
                    ]) => {
                        this.paramFirmwareVersion = fwVersion;
                        this.paramCurrentChannel = currentChannel as number;
                        this.paramApsUseExtPanid = apsUseExtPanid as bigint;
                        this.paramNwkPanid = panid as number;
                        this.paramNwkKey = nwkKey as Buffer;
                        this.paramNwkUpdateId = nwkUpdateId as number;
                        this.paramMacAddress = mac as bigint;
                        this.paramTcAddress = tcAddress as bigint;
                        this.paramChannelMask = channelMask as number;
                        this.paramProtocolVersion = protocolVersion as number;
                        if (frameCounter !== null) {
                            this.paramFrameCounter = frameCounter as number;
                        }
                        if (ep0 !== null) {
                            this.paramEndpoint0 = ep0 as Buffer;
                        }

                        if (ep1 !== null) {
                            this.paramEndpoint1 = ep1 as Buffer;
                        }

                        // console.log({fwVersion, mac, panid, apsUseExtPanid, currentChannel, nwkKey, nwkUpdateId, channelMask, protocolVersion, frameCounter});

                        if (this.isNetworkConfigurationValid()) {
                            logger.debug("Zigbee configuration valid", NS);
                            this.driverStateStart = Date.now();
                            this.driverState = DriverState.Connected;

                            // enable optional firmware debug messages
                            let logLevel = 0;
                            for (const level of this.firmwareLog) {
                                if (level === "APS") logLevel |= 0x00000100;
                                else if (level === "APS_L2") logLevel |= 0x00010000;
                            }
                            if (logLevel !== 0) {
                                this.writeParameterRequest(ParamId.STK_DEBUG_LOG_LEVEL, logLevel)
                                    .then((_x) => {
                                        logger.debug("Enabled firmware logging", NS);
                                    })
                                    .catch((_err) => {
                                        logger.debug("Firmware logging unsupported by firmware", NS);
                                    });
                            }
                        } else {
                            this.driverStateStart = Date.now();
                            this.driverState = DriverState.Reconfigure;
                            this.emitStateEvent(DriverEvent.Action);
                        }
                    },
                )
                .catch((_err) => {
                    this.driverStateStart = Date.now();
                    this.driverState = DriverState.CloseAndRestart;
                    logger.debug("Failed to query firmware parameters", NS);
                });
        } else if (event === DriverEvent.Tick) {
            this.processQueue();
        }
    }

    private handleReconfigureStateEvent(event: DriverEvent, _data?: DriverEventData): void {
        if (event === DriverEvent.Action) {
            logger.debug("Reconfigure Zigbee network to match configuration", NS);

            this.reconfigureNetwork()
                .then(() => {
                    this.driverStateStart = Date.now();
                    this.driverState = DriverState.Connected;
                })
                .catch((err) => {
                    logger.debug(`Failed to reconfigure Zigbee network, error: ${err}, wait 15 seconds to retry`, NS);
                    this.driverStateStart = Date.now();
                });
        } else if (event === DriverEvent.Tick) {
            this.processQueue();

            // if we run into this timeout assume some error and retry after waiting a bit
            if (15000 < Date.now() - this.driverStateStart) {
                this.driverStateStart = Date.now();
                this.driverState = DriverState.CloseAndRestart;
            }

            if (this.txState === TxState.Idle) {
                // needed to process channel change ZDP request
                this.deviceStatus = 0; // force refresh in response
                this.sendReadDeviceStateRequest(this.nextSeqNumber());
            }
        } else if (event === DriverEvent.DeviceStateUpdated) {
            this.handleApsQueueOnDeviceState();
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

    private handleCloseAndRestartStateEvent(event: DriverEvent, _data?: DriverEventData): void {
        if (event === DriverEvent.Tick) {
            if (1000 < Date.now() - this.driverStateStart) {
                // if the connection is open try to close it every second.
                this.driverStateStart = Date.now();
                if (this.isOpen()) {
                    this.close();
                } else {
                    this.driverState = DriverState.WaitToReconnect;
                }
            }
        }
    }

    private handleApsQueueOnDeviceState() {
        // logger.debug(`Updated device status: ${data.toString(2)}`, NS);

        const netState = this.deviceStatus & DEV_STATUS_NET_STATE_MASK;

        if (this.txState === TxState.Idle) {
            if (netState === NetworkState.Connected) {
                const status = this.deviceStatus;
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
                this.processBusyQueueTimeouts();
                this.processApsBusyQueueTimeouts();
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
            } else if (this.driverState === DriverState.CloseAndRestart) {
                this.handleCloseAndRestartStateEvent(event, data);
            } else {
                if (event !== DriverEvent.Tick) {
                    logger.debug(`handle state: ${DriverState[this.driverState]}, event: ${DriverEvent[event]}`, NS);
                }
            }
        } catch (_err) {
            // console.error(err);
        }
    }

    private onPortClose(error: boolean | Error): void {
        if (error) {
            logger.info(`Port close: state: ${DriverState[this.driverState]}, reason: ${error}`, NS);
        } else {
            logger.debug(`Port closed in state: ${DriverState[this.driverState]}`, NS);
        }

        this.emitStateEvent(DriverEvent.Disconnected);
        this.emit("close");
    }

    private onPortError(error: Error): void {
        logger.error(`Port error: ${error}`, NS);
        this.emitStateEvent(DriverEvent.Disconnected);
        this.emit("close");
    }

    private isOpen(): boolean {
        if (this.serialPort) return this.serialPort.isOpen;
        if (this.socketPort) return this.socketPort.readyState !== "closed";
        return false;
    }

    public openSerialPort(baudrate: number): Promise<void> {
        return new Promise((resolve, reject): void => {
            if (!this.serialPortOptions.path) {
                reject(new Error("Failed to open serial port, path is undefined"));
            }

            logger.debug(`Opening serial port: ${this.serialPortOptions.path}`, NS);

            const path = this.serialPortOptions.path || "";

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
                resolve();
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
        if (!this.serialPortOptions.path) {
            throw new Error("No serial port TCP path specified");
        }

        const info = SocketPortUtils.parseTcpPath(this.serialPortOptions.path);
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
                this.socketPort = undefined;
                this.emitStateEvent(DriverEvent.Disconnected);
                resolve();
            } else {
                resolve();
                this.emit("close");
            }
        });
    }

    public readParameterRequest(parameterId: ParamId, parameter?: Buffer | number | bigint): Promise<unknown> {
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

    public writeParameterRequest(parameterId: ParamId, parameter: Buffer | number | bigint): Promise<void> {
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

    private sendChangeChannelRequest(): Promise<undefined | ReceivedDataResponse> {
        const zdpSeq = this.nextTransactionID();
        const scanChannels = 1 << this.networkOptions.channelList[0];
        const scanDuration = 0xfe; // special value = channel change

        const payload = Buffer.alloc(7);
        let pos = 0;
        payload.writeUInt8(zdpSeq, pos);
        pos += 1;
        payload.writeUInt32LE(scanChannels, pos);
        pos += 4;
        payload.writeUInt8(scanDuration, pos);
        pos += 1;
        payload.writeUInt8(this.paramNwkUpdateId, pos);
        pos += 1;

        const req: ApsDataRequest = {
            requestId: this.nextTransactionID(),
            destAddrMode: ApsAddressMode.Nwk,
            destAddr16: NwkBroadcastAddress.BroadcastRxOnWhenIdle,
            destEndpoint: 0,
            profileId: 0,
            clusterId: 0x0038, // ZDP_MGMT_NWK_UPDATE_REQ_CLID
            srcEndpoint: 0,
            asduLength: payload.length,
            asduPayload: payload,
            txOptions: 0,
            radius: PARAM.PARAM.txRadius.DEFAULT_RADIUS,
            timeout: PARAM.PARAM.APS.MAX_SEND_TIMEOUT,
        };

        return this.enqueueApsDataRequest(req);
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

    public readDeviceStatusRequest(): Promise<number> {
        const seqNumber = this.nextSeqNumber();
        return new Promise((resolve, reject): void => {
            //logger.debug(`push read firmware version request to queue. seqNr: ${seqNumber}`, NS);
            const ts = 0;
            const commandId = FirmwareCommand.Status;
            const networkState = NetworkState.Ignore;
            const parameterId = ParamId.NONE;
            const req: Request = {commandId, networkState, parameterId, seqNumber, resolve, reject, ts};
            queue.push(req);
        });
    }

    private sendReadParameterRequest(parameterId: ParamId, seqNumber: number, arg?: Buffer | number | bigint): CommandResult {
        let frameLength = 8; // starts with min. frame length
        let payloadLength = 1; // min. parameterId

        if (arg instanceof Buffer) {
            payloadLength += arg.byteLength;
            frameLength += arg.byteLength;
        }

        const buf = new Buffalo(Buffer.alloc(frameLength));

        buf.writeUInt8(FirmwareCommand.ReadParameter);
        buf.writeUInt8(seqNumber);
        buf.writeUInt8(0); // reserved, shall be 0
        buf.writeUInt16(frameLength);
        buf.writeUInt16(payloadLength);
        buf.writeUInt8(parameterId);

        if (arg instanceof Buffer) {
            buf.writeBuffer(arg, arg.byteLength);
        }

        return this.sendRequest(buf.getBuffer());
    }

    private sendWriteParameterRequest(parameterId: ParamId, value: Buffer | number | bigint, seqNumber: number): CommandResult {
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
        } else if (typeof value === "bigint") {
            if (param.type === DataType.U64) {
                buf.writeBigUInt64LE(value, pos);
                pos += 8;
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
                        this.sendReadParameterRequest(req.parameterId, req.seqNumber, req.parameter);
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
            } catch (_err) {
                //console.error(err);
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
            12 + (request.destAddrMode === ApsAddressMode.Group ? 2 : request.destAddrMode === ApsAddressMode.Nwk ? 3 : 9) + request.asduLength;
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
        const result: number[] = [];
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
}

export default Driver;
