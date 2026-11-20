import type * as Models from "../../../models";
import * as BackupUtils from "../../../utils/backup";
import {logger} from "../../../utils/logger";
import {Queue} from "../../../utils/queue";
import {wait} from "../../../utils/wait";
import {Waitress} from "../../../utils/waitress";
import * as ZSpec from "../../../zspec";
import type {Eui64} from "../../../zspec/tstypes";
import * as Zcl from "../../../zspec/zcl";
import * as Zdo from "../../../zspec/zdo";
import type * as ZdoTypes from "../../../zspec/zdo/definition/tstypes";
import {Adapter, type ClusterWaitressMatcher, type ZclWaitressPayload} from "../../adapter";
import type {ZclPayload} from "../../events";
import type * as TsType from "../../tstype";
import {readBackup} from "../../utils";
import {
    ADDR_MODE_GROUP,
    ADDR_MODE_SHORT,
    APS_TX_OPT_ACK,
    AppSignal,
    BUSY_BACKOFF_MS,
    Capability,
    CommandId,
    DeviceUpdateStatus,
    EspZbStatus,
    EXT_VERSION_MAJOR,
    FRAME_COUNTER_RESTORE_MARGIN,
    MAX_BUSY_ATTEMPTS,
    MAX_SEND_ATTEMPTS,
    NetworkState,
    RECOVERABLE_CONFIRM_STATUSES,
    STARTUP_TIMEOUT_MS,
    TC_ACTION_ACCEPT,
    WATCHDOG_INTERVAL_MS,
    WATCHDOG_MAX_FAILURES,
    ZDO_RESPONSE_TIMEOUT_MS,
} from "../consts";
import {type ApsDataRequest, cmdName, decodeApsDataIndication, EspZbDriver, EspZbStatusError} from "../driver";
import type {EspZbFrame} from "../frame";

const NS = "zh:espzb";

/** Endpoints registered on the NCP before the stack starts (same layout as other herdsman coordinators). */
const ENDPOINTS: readonly {endpoint: number; profileId: number; deviceId: number; inClusters: number[]; outClusters: number[]}[] = [
    {
        endpoint: ZSpec.HA_ENDPOINT,
        profileId: ZSpec.HA_PROFILE_ID,
        deviceId: 0x0005, // configuration tool
        inClusters: [0x0000, 0x0003, 0x0006, 0x0008, 0x000a, 0x0019, 0x0300],
        outClusters: [
            0x0000, 0x0003, 0x0004, 0x0005, 0x0006, 0x0008, 0x0020, 0x0300, 0x0400, 0x0402, 0x0405, 0x0406, 0x0500, 0x0702, 0x0b01, 0x0b03, 0x0b04,
            0x1000,
        ],
    },
    {
        endpoint: ZSpec.GP_ENDPOINT,
        profileId: ZSpec.GP_PROFILE_ID,
        deviceId: 0x0066, // GP combo basic
        inClusters: [0x0021],
        outClusters: [0x0021],
    },
];

export interface NcpInfo {
    extMajor: number;
    extMinor: number;
    capabilities: number;
    maxPayload: number;
    maxInflightAps: number;
    firmwareVersion: string;
    sdkVersion: string;
    chipRevision: number;
    radioMode: number;
    chipModel: string;
    firmwareName: string;
    idfVersion: string;
}

interface ZdoWaitressPayload {
    address: number | string;
    clusterId: number;
    tsn: number;
    response: ZdoTypes.GenericZdoResponse;
}

interface ZdoWaitressMatcher {
    address: number | string;
    clusterId: number;
    tsn: number;
}

class DeliveryError extends Error {
    public readonly status: number;

    constructor(status: number, what: string) {
        super(`${what}: delivery failed with status 0x${status.toString(16).padStart(2, "0")}`);
        this.status = status;
    }
}

type StoredBackup = {backup: Models.Backup; source: "espzb" | "zstack" | "ember" | "ezsp" | "other"};

/**
 * Adapter for NCPs running the espzb protocol on top of Espressif's ESP Zigbee SDK v2 (e.g. ESP32-S31, native
 * 802.15.4 radio) over serial (UART / USB CDC) or TCP (Ethernet / Wi-Fi).
 */
export class EspZbAdapter extends Adapter {
    public readonly driver: EspZbDriver;
    readonly #queue: Queue;
    readonly #zclWaitress: Waitress<ZclPayload, ClusterWaitressMatcher>;
    readonly #zdoWaitress: Waitress<ZdoWaitressPayload, ZdoWaitressMatcher>;
    #info?: NcpInfo;
    #state: NetworkState = NetworkState.NOT_STARTED;
    #stateListeners: ((state: NetworkState) => void)[] = [];
    #zdoTsn = 0;
    #ieee: Eui64 = "0x0000000000000000";
    #networkParameters?: TsType.NetworkParameters;
    #started = false;
    #watchdog?: NodeJS.Timeout;
    #watchdogFailures = 0;

    public constructor(
        networkOptions: TsType.NetworkOptions,
        transportOptions: TsType.TransportOptions,
        backupPath: string,
        adapterOptions: TsType.AdapterOptions,
    ) {
        super(networkOptions, transportOptions, backupPath, adapterOptions);
        this.hasZdoMessageOverhead = true;
        this.manufacturerID = Zcl.ManufacturerCode.ESPRESSIF_SYSTEMS_SHANGHAI_CO_LTD;
        this.#queue = new Queue(adapterOptions.concurrent || 16);
        this.#zclWaitress = new Waitress<ZclPayload, ClusterWaitressMatcher>(
            (payload, matcher) => payload.header !== undefined && Adapter.zclWaitressValidator(payload as ZclWaitressPayload, matcher),
            Adapter.clusterWaitressTimeoutFormatter,
        );
        this.#zdoWaitress = new Waitress<ZdoWaitressPayload, ZdoWaitressMatcher>(
            (payload, matcher) => payload.clusterId === matcher.clusterId && payload.tsn === matcher.tsn && payload.address === matcher.address,
            (matcher, timeout) => `Timeout after ${timeout}ms waiting for ZDO ${Zdo.ClusterId[matcher.clusterId]} from ${matcher.address}`,
        );
        this.driver = new EspZbDriver(this.transport);
        this.driver.on("notify", (frame) => this.#onNotify(frame));
        // `Adapter` already emits `disconnected` when the transport closes
        this.transport.on("close", () => this.#onDisconnect("port closed", false));
    }

    // ------------------------------------------------------------------ lifecycle

    public async start(): Promise<TsType.StartResult> {
        logger.info("======== espzb adapter starting ========", NS);
        await this.driver.connect();
        this.#info = await this.#handshake();
        const result = await this.#initNetwork();
        await this.#afterNetworkUp();
        this.#started = true;
        this.#startWatchdog();
        logger.info(`======== espzb adapter started (${result}) ========`, NS);

        return result;
    }

    public async stop(): Promise<void> {
        this.#started = false;
        clearInterval(this.#watchdog);
        this.#zclWaitress.clear();
        this.#zdoWaitress.clear();
        await this.driver.disconnect();
        this.driver.removeAllListeners();
        logger.info("======== espzb adapter stopped ========", NS);
    }

    async #handshake(): Promise<NcpInfo> {
        let payload: Buffer;

        try {
            payload = await this.driver.request(CommandId.EXT_GET_INFO);
        } catch (error) {
            if (error instanceof EspZbStatusError && error.status === EspZbStatus.NOT_SUPPORTED) {
                throw new Error("NCP firmware does not implement the espzb protocol extensions (EXT_GET_INFO). Is this an espzb NCP?");
            }

            throw new Error(`No response from NCP. Check 'serial.port', baud rate and firmware (${(error as Error).message})`);
        }

        let pos = 0;
        const u8 = (): number => payload[pos++];
        const str8 = (): string => {
            const len = payload[pos++] ?? 0;
            const s = payload.subarray(pos, pos + len).toString("utf8");
            pos += len;
            return s;
        };
        const extMajor = u8();
        const extMinor = u8();
        const capabilities = payload.readUInt32LE(pos);
        pos += 4;
        const maxPayload = payload.readUInt16LE(pos);
        pos += 2;
        const maxInflightAps = u8();
        const fw = [u8(), u8(), u8()];
        const sdk = [u8(), u8(), u8()];
        const chipRevision = payload.readUInt16LE(pos);
        pos += 2;
        const radioMode = u8();
        const info: NcpInfo = {
            extMajor,
            extMinor,
            capabilities,
            maxPayload,
            maxInflightAps,
            firmwareVersion: fw.join("."),
            sdkVersion: sdk.join("."),
            chipRevision,
            radioMode,
            chipModel: str8(),
            firmwareName: str8(),
            idfVersion: str8(),
        };

        if (info.extMajor !== EXT_VERSION_MAJOR) {
            throw new Error(`Unsupported espzb protocol version ${info.extMajor}.${info.extMinor} (adapter supports ${EXT_VERSION_MAJOR}.x)`);
        }

        logger.info(
            `NCP: ${info.firmwareName} ${info.firmwareVersion} on ${info.chipModel} rev ${info.chipRevision}, ESP Zigbee SDK ${info.sdkVersion}, ` +
                `ESP-IDF ${info.idfVersion}, protocol ${info.extMajor}.${info.extMinor}, capabilities 0x${info.capabilities.toString(16)}, ` +
                `max in-flight APS ${info.maxInflightAps}`,
            NS,
        );

        return info;
    }

    #hasCapability(cap: Capability): boolean {
        return ((this.#info?.capabilities ?? 0) & cap) !== 0;
    }

    async #initNetwork(): Promise<TsType.StartResult> {
        let {state, factoryNew} = await this.#getNetworkState();

        if (state === NetworkState.NOT_STARTED) {
            for (const ep of ENDPOINTS) {
                const payload = Buffer.alloc(8 + 2 * (ep.inClusters.length + ep.outClusters.length));
                payload[0] = ep.endpoint;
                payload.writeUInt16LE(ep.profileId, 1);
                payload.writeUInt16LE(ep.deviceId, 3);
                payload[5] = 0; // device version
                payload[6] = ep.inClusters.length;
                payload[7] = ep.outClusters.length;
                let pos = 8;

                for (const c of [...ep.inClusters, ...ep.outClusters]) {
                    pos = payload.writeUInt16LE(c, pos);
                }

                await this.driver.request(CommandId.ZCL_ENDPOINT_ADD, payload);
            }

            await this.driver.request(CommandId.NETWORK_START, Buffer.from([0]));
            // the NCP enters JOINING synchronously; do not depend on the notification (it may be lost),
            // but never overwrite a later state that was already notified
            if (this.#state === NetworkState.NOT_STARTED) {
                this.#state = NetworkState.JOINING;
            }
            state = await this.#waitForState((s) => s !== NetworkState.NOT_STARTED && s !== NetworkState.JOINING, "stack start");
            factoryNew = (await this.#getNetworkState()).factoryNew;
        } else if (state === NetworkState.JOINING || state === NetworkState.LEAVING) {
            state = await this.#waitForState((s) => s === NetworkState.CONNECTED || s === NetworkState.OFFLINE, "pending commissioning");
        } else {
            logger.info(`NCP stack already running (state ${NetworkState[state]}), host reconnect`, NS);
        }

        if (state === NetworkState.CONNECTED) {
            const mismatch = await this.#networkMismatch();

            if (mismatch === undefined) {
                logger.info("NCP network matches configuration", NS);
                return "resumed";
            }

            logger.info(`NCP network does not match configuration (${mismatch}), leaving network`, NS);
            await this.#leaveNetwork();
            state = NetworkState.OFFLINE;
        } else if (!factoryNew) {
            // commissioned but not on a network: erase stale network data before forming
            await this.#leaveNetwork();
        }

        const stored = this.#getStoredBackup();

        if (stored && this.#backupMatchesConfig(stored.backup)) {
            logger.info(`Forming network from backup (source: ${stored.source})`, NS);
            await this.#formNetwork(stored);
            return "restored";
        }

        logger.info(stored ? "Backup does not match configuration, forming new network" : "No backup found, forming new network", NS);
        await this.#formNetwork(undefined);
        return "reset";
    }

    async #getNetworkState(): Promise<{state: NetworkState; factoryNew: boolean}> {
        const payload = await this.driver.request(CommandId.NETWORK_STATE);
        this.#state = payload[0];

        return {state: payload[0], factoryNew: payload[1] === 1};
    }

    /** Wait for the NCP network state to satisfy `predicate` (notifications, with polling as fallback). */
    async #waitForState(predicate: (state: NetworkState) => boolean, what: string): Promise<NetworkState> {
        if (predicate(this.#state)) {
            return this.#state;
        }

        return await new Promise<NetworkState>((resolve, reject) => {
            const deadline = Date.now() + STARTUP_TIMEOUT_MS;
            let poll: NodeJS.Timeout | undefined;
            const done = (state?: NetworkState, error?: Error): void => {
                clearTimeout(poll);
                this.#stateListeners = this.#stateListeners.filter((l) => l !== listener);

                if (error) {
                    reject(error);
                } else {
                    // biome-ignore lint/style/noNonNullAssertion: set when no error
                    resolve(state!);
                }
            };
            const listener = (state: NetworkState): void => {
                if (predicate(state)) {
                    done(state);
                }
            };
            const tick = async (): Promise<void> => {
                if (Date.now() > deadline) {
                    return done(undefined, new Error(`Timeout waiting for ${what} (NCP state ${NetworkState[this.#state]})`));
                }

                try {
                    const {state} = await this.#getNetworkState();

                    if (predicate(state)) {
                        return done(state);
                    }
                } catch (error) {
                    logger.debug(`State poll failed: ${(error as Error).message}`, NS);
                }

                poll = setTimeout(tick, 1000);
            };
            this.#stateListeners.push(listener);
            poll = setTimeout(tick, 1000);
        });
    }

    /** Returns a description of the first mismatch between the NCP network and the configuration, or undefined. */
    async #networkMismatch(): Promise<string | undefined> {
        const role = (await this.driver.request(CommandId.NETWORK_ROLE_GET))[0];

        if (role !== 0) {
            return `role ${role} is not coordinator`;
        }

        const panId = (await this.driver.request(CommandId.NETWORK_PAN_ID_GET)).readUInt16LE(0);

        if (panId !== this.networkOptions.panID) {
            return `PAN ID 0x${panId.toString(16)} != 0x${this.networkOptions.panID.toString(16)}`;
        }

        const extPanId = await this.driver.request(CommandId.NETWORK_EXTENDED_PAN_ID_GET);

        // biome-ignore lint/style/noNonNullAssertion: always provided by the controller
        if (!extPanId.subarray(0, 8).equals(Buffer.from(this.networkOptions.extendedPanID!))) {
            return "extended PAN ID";
        }

        const key = await this.driver.request(CommandId.NETWORK_PRIMARY_KEY_GET);

        // biome-ignore lint/style/noNonNullAssertion: always provided by the controller
        if (!key.subarray(0, 16).equals(Buffer.from(this.networkOptions.networkKey!))) {
            return "network key";
        }

        return undefined;
    }

    async #leaveNetwork(): Promise<void> {
        await this.driver.request(CommandId.NETWORK_LEAVE);
        this.#state = NetworkState.LEAVING;
        await this.#waitForState((s) => s === NetworkState.OFFLINE, "network leave");
    }

    #getStoredBackup(): StoredBackup | undefined {
        const data = readBackup(this.backupPath);

        if (!data) {
            return undefined;
        }

        if (!("metadata" in data) || data.metadata?.format !== "zigpy/open-coordinator-backup" || data.metadata.version !== 1) {
            logger.warning("Coordinator backup has an unsupported format, ignoring it", NS);
            return undefined;
        }

        const backup = BackupUtils.fromUnifiedBackup(data);
        const internal = data.metadata.internal ?? {};
        const ezspVersion = internal.ezspVersion;
        // both EZSP drivers write `ezspVersion`: the deprecated 'ezsp' driver only speaks EZSP <= 13, 'ember' needs >= 13
        const source: StoredBackup["source"] = internal.espzbVersion
            ? "espzb"
            : ezspVersion
              ? ezspVersion < 13
                  ? "ezsp"
                  : "ember"
              : internal.znpVersion
                ? "zstack"
                : "other";

        if (source === "ember") {
            if (ezspVersion === 13) {
                logger.warning(
                    "EZSP v13 backup could come from the 'ember' or the deprecated 'ezsp' driver, assuming 'ember'. " +
                        "If you migrated from 'ezsp', verify the coordinator IEEE address after the restore.",
                    NS,
                );
            }

            // ember stores the coordinator EUI-64 little-endian; everyone else (incl. legacy ezsp) uses the big-endian (display) order
            backup.coordinatorIeeeAddress = Buffer.from(backup.coordinatorIeeeAddress).reverse();
        }

        return {backup, source};
    }

    #backupMatchesConfig(backup: Models.Backup): boolean {
        // biome-ignore lint/style/noNonNullAssertion: always provided by the controller
        const configExtPanId = Buffer.from(this.networkOptions.extendedPanID!);
        const backupExtPanId = backup.networkOptions.extendedPanId;

        return (
            backup.networkOptions.panId === this.networkOptions.panID &&
            (configExtPanId.equals(backupExtPanId) || configExtPanId.equals(Buffer.from(backupExtPanId).reverse())) &&
            this.networkOptions.channelList.includes(backup.logicalChannel) &&
            // biome-ignore lint/style/noNonNullAssertion: always provided by the controller
            Buffer.from(this.networkOptions.networkKey!).equals(backup.networkOptions.networkKey)
        );
    }

    async #formNetwork(stored: StoredBackup | undefined): Promise<void> {
        const backup = stored?.backup;
        const panId = this.networkOptions.panID;
        // biome-ignore lint/style/noNonNullAssertion: always provided by the controller
        const extPanId = Buffer.from(this.networkOptions.extendedPanID!); // wire order (little-endian), as configured
        const channel = backup?.logicalChannel ?? this.networkOptions.channelList[0];
        // biome-ignore lint/style/noNonNullAssertion: always provided by the controller
        const networkKey = Buffer.from(this.networkOptions.networkKey!);
        const u16 = (v: number): Buffer => Buffer.from([v & 0xff, v >> 8]);
        const u32 = (v: number): Buffer => {
            const b = Buffer.alloc(4);
            b.writeUInt32LE(v >>> 0);
            return b;
        };

        await this.driver.request(CommandId.NETWORK_PAN_ID_SET, u16(panId));
        await this.driver.request(CommandId.NETWORK_EXTENDED_PAN_ID_SET, extPanId);
        await this.driver.request(CommandId.NETWORK_PRIMARY_CHANNEL_SET, u32(ZSpec.Utils.channelsToUInt32Mask([channel])));
        await this.driver.request(CommandId.NETWORK_SECONDARY_CHANNEL_SET, u32(0));
        await this.driver.request(CommandId.NETWORK_PRIMARY_KEY_SET, networkKey);

        if (backup) {
            if (this.#hasCapability(Capability.BACKUP_RESTORE)) {
                const frameCounter = Math.min(backup.networkKeyInfo.frameCounter + FRAME_COUNTER_RESTORE_MARGIN, 0xffffffff);
                await this.driver.request(CommandId.NETWORK_LONG_ADDRESS_SET, Buffer.from(backup.coordinatorIeeeAddress).reverse());
                await this.driver.request(CommandId.NETWORK_FRAME_COUNT_SET, u32(frameCounter));
                await this.driver.request(CommandId.NETWORK_UPDATE_ID_SET, Buffer.from([backup.networkUpdateId & 0xff]));

                if (backup.networkKeyInfo.sequenceNumber !== 0 && this.#hasCapability(Capability.KEY_SEQ)) {
                    await this.driver.request(CommandId.EXT_NWK_KEY_SEQ_SET, Buffer.from([backup.networkKeyInfo.sequenceNumber]));
                }

                logger.info(
                    `Restoring coordinator IEEE ${ZSpec.Utils.eui64BEBufferToHex(backup.coordinatorIeeeAddress)}, frame counter ${frameCounter}, ` +
                        `update id ${backup.networkUpdateId}`,
                    NS,
                );
            } else {
                logger.warning("NCP firmware cannot restore IEEE/frame counter; devices may need to re-join", NS);
            }
        }

        await this.driver.request(CommandId.NETWORK_FORM, Buffer.from([0x00 /* coordinator */, 0 /* default max children */, 0, 0, 0, 0, 0]));
        this.#state = NetworkState.JOINING;
        const state = await this.#waitForState((s) => s !== NetworkState.JOINING, "network formation");

        if (state !== NetworkState.CONNECTED) {
            throw new Error(`Network formation failed (NCP state ${NetworkState[state]})`);
        }

        const formedPanId = (await this.driver.request(CommandId.NETWORK_PAN_ID_GET)).readUInt16LE(0);
        const formedChannel = (await this.driver.request(CommandId.NETWORK_CHANNEL_GET))[0];

        if (formedPanId !== panId || formedChannel !== channel) {
            throw new Error(
                `NCP formed a different network than requested (PAN 0x${formedPanId.toString(16)} channel ${formedChannel}, ` +
                    `expected 0x${panId.toString(16)} channel ${channel})`,
            );
        }

        logger.info(`Formed network PAN 0x${panId.toString(16)} channel ${channel}`, NS);
    }

    async #afterNetworkUp(): Promise<void> {
        this.#ieee = ZSpec.Utils.eui64LEBufferToHex(await this.driver.request(CommandId.NETWORK_LONG_ADDRESS_GET));
        await this.#refreshNetworkParameters();

        if (this.adapterOptions.transmitPower !== undefined) {
            const applied = (
                await this.driver.request(CommandId.NETWORK_TXPOWER_SET, Buffer.from([this.adapterOptions.transmitPower & 0xff]))
            ).readInt8(0);
            logger.info(`Transmit power set to ${applied} dBm (requested ${this.adapterOptions.transmitPower})`, NS);
        }

        await this.driver.request(CommandId.NETWORK_PERMIT_JOINING, Buffer.from([0]));
    }

    async #refreshNetworkParameters(): Promise<TsType.NetworkParameters> {
        const panID = (await this.driver.request(CommandId.NETWORK_PAN_ID_GET)).readUInt16LE(0);
        const extPanId = (await this.driver.request(CommandId.NETWORK_EXTENDED_PAN_ID_GET)).subarray(0, 8);
        const channel = (await this.driver.request(CommandId.NETWORK_CHANNEL_GET))[0];
        const nwkUpdateID = (await this.driver.request(CommandId.NETWORK_UPDATE_ID_GET))[0];
        this.#networkParameters = {panID, extendedPanID: ZSpec.Utils.eui64LEBufferToHex(extPanId), channel, nwkUpdateID};

        return this.#networkParameters;
    }

    #startWatchdog(): void {
        clearInterval(this.#watchdog);
        this.#watchdog = setInterval(async () => {
            if (this.driver.idleMs < WATCHDOG_INTERVAL_MS / 2) {
                this.#watchdogFailures = 0;
                return;
            }

            try {
                await this.driver.request(CommandId.EXT_PING);
                this.#watchdogFailures = 0;
            } catch (error) {
                this.#watchdogFailures++;
                logger.warning(`NCP watchdog ping failed (${this.#watchdogFailures}/${WATCHDOG_MAX_FAILURES}): ${(error as Error).message}`, NS);

                if (this.#watchdogFailures >= WATCHDOG_MAX_FAILURES) {
                    this.#onDisconnect("NCP not responding");
                }
            }
        }, WATCHDOG_INTERVAL_MS);
    }

    #onDisconnect(reason: string, emit = true): void {
        if (!this.#started) {
            return;
        }

        logger.error(`NCP disconnected: ${reason}`, NS);
        this.#started = false;
        clearInterval(this.#watchdog);

        if (emit) {
            this.emit("disconnected");
        }
    }

    // ------------------------------------------------------------------ notifications

    #onNotify(frame: EspZbFrame): void {
        switch (frame.id) {
            case CommandId.APS_DATA_INDICATION: {
                this.#onApsIndication(frame.payload);
                break;
            }
            case CommandId.NETWORK_STACK_STATUS_HANDLER: {
                const state = frame.payload[0] as NetworkState;
                this.#state = state;
                logger.debug(`NCP network state ${NetworkState[state] ?? state} (bdb status ${frame.payload[1]})`, NS);

                for (const listener of [...this.#stateListeners]) {
                    listener(state);
                }

                if (this.#started && state !== NetworkState.CONNECTED) {
                    this.#onDisconnect(`network state changed to ${NetworkState[state] ?? state}`);
                }

                break;
            }
            case CommandId.EXT_APP_SIGNAL: {
                this.#onAppSignal(frame.payload);
                break;
            }
            case CommandId.NETWORK_JOIN:
            case CommandId.NETWORK_LEAVE: {
                // ZNSP-compatible duplicates of Device_annce / leave indication; handled via APS indications and
                // EXT_APP_SIGNAL. Only used when the NCP lacks EXT_APP_SIGNAL.
                if (!this.#hasCapability(Capability.APP_SIGNAL) && frame.id === CommandId.NETWORK_LEAVE && frame.payload.length >= 10) {
                    this.emit("deviceLeave", {
                        networkAddress: frame.payload.readUInt16LE(0),
                        ieeeAddr: ZSpec.Utils.eui64LEBufferToHex(frame.payload.subarray(2, 10)),
                    });
                }

                break;
            }
            case CommandId.NETWORK_PERMIT_JOINING: {
                logger.debug(`Permit joining on coordinator: ${frame.payload[0]}s`, NS);
                break;
            }
            case CommandId.EXT_BOOT: {
                this.#onDisconnect("NCP rebooted");
                break;
            }
            case CommandId.EXT_LOG: {
                logger.debug(`[NCP] ${frame.payload.subarray(1).toString("utf8")}`, NS);
                break;
            }
            default: {
                logger.debug(`Unhandled notification ${cmdName(frame.id)}`, NS);
            }
        }
    }

    #onAppSignal(payload: Buffer): void {
        if (payload.length < 3) {
            return;
        }

        const signal = payload.readUInt16LE(0);
        const params = payload.subarray(3, 3 + payload[2]);

        switch (signal) {
            case AppSignal.ZDO_DEVICE_UPDATE: {
                if (params.length < 12) {
                    return;
                }

                const ieeeAddr = ZSpec.Utils.eui64LEBufferToHex(params.subarray(0, 8));
                const networkAddress = params.readUInt16LE(8);
                const status = params[10];
                const tcAction = params[11];

                if (status === DeviceUpdateStatus.DEVICE_LEFT) {
                    this.emit("deviceLeave", {networkAddress, ieeeAddr});
                } else if (tcAction === TC_ACTION_ACCEPT) {
                    logger.debug(`Device ${ieeeAddr} (0x${networkAddress.toString(16)}) ${DeviceUpdateStatus[status] ?? status}`, NS);
                    this.emit("deviceJoined", {networkAddress, ieeeAddr});
                } else {
                    logger.warning(`Trust center did not accept ${ieeeAddr} (action ${tcAction})`, NS);
                }

                break;
            }
            case AppSignal.ZDO_LEAVE_INDICATION: {
                if (params.length >= 11 && params[10] === 0) {
                    this.emit("deviceLeave", {
                        networkAddress: params.readUInt16LE(0),
                        ieeeAddr: ZSpec.Utils.eui64LEBufferToHex(params.subarray(2, 10)),
                    });
                }

                break;
            }
            default: {
                logger.debug(`App signal 0x${signal.toString(16).padStart(4, "0")} ${params.toString("hex")}`, NS);
            }
        }
    }

    #onApsIndication(payload: Buffer): void {
        let ind: ReturnType<typeof decodeApsDataIndication>;

        try {
            ind = decodeApsDataIndication(payload);
        } catch (error) {
            logger.error(`Invalid APS indication: ${(error as Error).message}`, NS);
            return;
        }

        if (ind.profileId === Zdo.ZDO_PROFILE_ID) {
            // requests from devices are served by the NCP stack; only responses/announcements go up
            if ((ind.clusterId & 0x8000) === 0 && ind.clusterId !== Zdo.ClusterId.END_DEVICE_ANNOUNCE) {
                return;
            }

            try {
                const response = Zdo.Buffalo.readResponse(this.hasZdoMessageOverhead, ind.clusterId, ind.asdu);
                let address: number | string = ind.srcShort;

                if (
                    ind.clusterId === Zdo.ClusterId.NETWORK_ADDRESS_RESPONSE &&
                    Zdo.Buffalo.checkStatus<Zdo.ClusterId.NETWORK_ADDRESS_RESPONSE>(response)
                ) {
                    address = response[1].eui64;
                }

                this.#zdoWaitress.resolve({address, clusterId: ind.clusterId, tsn: ind.asdu[0], response});
                this.emit("zdoResponse", ind.clusterId, response);
            } catch (error) {
                logger.debug(`Unable to parse ZDO ${Zdo.ClusterId[ind.clusterId] ?? ind.clusterId}: ${(error as Error).message}`, NS);
            }

            return;
        }

        const zclPayload: ZclPayload = {
            clusterID: ind.clusterId,
            header: Zcl.Header.fromBuffer(ind.asdu),
            address: ind.srcIeee ? ZSpec.Utils.eui64LEBufferToHex(ind.srcIeee) : ind.srcShort,
            data: ind.asdu,
            endpoint: ind.srcEndpoint,
            linkquality: ind.lqi,
            groupID: ind.dstMode === ADDR_MODE_GROUP ? ind.dstAddr : 0,
            wasBroadcast: ind.dstMode === ADDR_MODE_GROUP || ZSpec.Utils.isBroadcastAddress(ind.dstAddr),
            destinationEndpoint: ind.dstEndpoint,
        };

        this.#zclWaitress.resolve(zclPayload);
        this.emit("zclPayload", zclPayload);
    }

    // ------------------------------------------------------------------ sending

    /** Submit an APS request, backing off while the NCP is busy. Resolves (once accepted) with the confirm promise. */
    async #sendAps(req: ApsDataRequest): Promise<{confirm: Promise<number>}> {
        for (let attempt = 1; attempt < MAX_BUSY_ATTEMPTS; attempt++) {
            try {
                return await this.driver.apsDataRequest(req);
            } catch (error) {
                if (!(error instanceof EspZbStatusError && error.status === EspZbStatus.BUSY)) {
                    throw error;
                }

                await wait(BUSY_BACKOFF_MS * attempt);
            }
        }

        // last attempt: errors (including BUSY) propagate
        return await this.driver.apsDataRequest(req);
    }

    /** Resolve with the response, or reject early when the APS confirm reports a delivery failure. */
    async #responseOrDeliveryFailure<T>(response: Promise<T>, confirm: Promise<number>, what: string, onFail: () => void): Promise<T> {
        const deliveryFailure = confirm.then(async (status) => {
            if (status !== 0) {
                onFail();
                throw new DeliveryError(status, what);
            }

            // delivered: only the response (or its timeout) settles the race
            return await new Promise<never>(() => {});
        });

        return await Promise.race([response, deliveryFailure]);
    }

    #isRecoverable(error: unknown): boolean {
        return error instanceof DeliveryError && RECOVERABLE_CONFIRM_STATUSES.includes(error.status);
    }

    #nextZdoTsn(): number {
        this.#zdoTsn = (this.#zdoTsn + 1) & 0xff;
        return this.#zdoTsn;
    }

    // ------------------------------------------------------------------ Adapter API

    public async getCoordinatorIEEE(): Promise<string> {
        return await Promise.resolve(this.#ieee);
    }

    public async getCoordinatorVersion(): Promise<TsType.CoordinatorVersion> {
        const info = this.#info;

        return await Promise.resolve({
            type: "espzb",
            meta: info
                ? ({
                      revision: `${info.firmwareName} ${info.firmwareVersion}`,
                      firmware: info.firmwareVersion,
                      chip: info.chipModel,
                      chipRevision: info.chipRevision,
                      sdk: info.sdkVersion,
                      idf: info.idfVersion,
                      protocol: `${info.extMajor}.${info.extMinor}`,
                  } satisfies Record<string, string | number>)
                : ({} as Record<string, string | number>),
        });
    }

    public reset(type: "soft" | "hard"): Promise<void> {
        return Promise.reject(new Error(`Reset '${type}' is not supported by the espzb adapter`));
    }

    public async supportsBackup(): Promise<boolean> {
        return await Promise.resolve(true);
    }

    public async backup(ieeeAddressesInDatabase: string[]): Promise<Models.Backup> {
        return await this.#queue.execute(async () => {
            const params = await this.#refreshNetworkParameters();
            const keyInfo = await this.driver.request(CommandId.EXT_NWK_KEY_INFO_GET);
            const extPanIdLE = (await this.driver.request(CommandId.NETWORK_EXTENDED_PAN_ID_GET)).subarray(0, 8);
            const ieeeLE = (await this.driver.request(CommandId.NETWORK_LONG_ADDRESS_GET)).subarray(0, 8);
            const devices: Models.Backup["devices"] = [];

            for (const ieee of ieeeAddressesInDatabase) {
                const ieeeBE = Buffer.from(ieee.replace(/^0x/, ""), "hex");

                if (ieeeBE.length !== 8 || ieee === this.#ieee) {
                    continue;
                }

                try {
                    const short = (await this.driver.request(CommandId.NETWORK_IEEE_TO_SHORT, Buffer.from(ieeeBE).reverse())).readUInt16LE(0);
                    devices.push({networkAddress: short, ieeeAddress: ieeeBE, isDirectChild: false});
                } catch (error) {
                    if (!(error instanceof EspZbStatusError && error.status === EspZbStatus.NOT_FOUND)) {
                        throw error;
                    }
                }
            }

            return {
                networkOptions: {
                    panId: params.panID,
                    extendedPanId: Buffer.from(extPanIdLE).reverse(),
                    channelList: [params.channel],
                    networkKey: Buffer.from(keyInfo.subarray(0, 16)),
                    networkKeyDistribute: false,
                },
                logicalChannel: params.channel,
                networkKeyInfo: {sequenceNumber: keyInfo[16], frameCounter: keyInfo.readUInt32LE(17)},
                securityLevel: 5,
                networkUpdateId: params.nwkUpdateID,
                coordinatorIeeeAddress: Buffer.from(ieeeLE).reverse(),
                devices,
                espzb: {version: EXT_VERSION_MAJOR},
            };
        });
    }

    public async getNetworkParameters(): Promise<TsType.NetworkParameters> {
        return await this.#queue.execute(async () => await this.#refreshNetworkParameters());
    }

    public async addInstallCode(ieeeAddress: string, key: Buffer, hashed: boolean): Promise<void> {
        if (hashed) {
            // ESP Zigbee SDK v2 only accepts raw install codes (ezb_secur_ic_add); the controller always sends the raw code first
            logger.warning(`Cannot add pre-hashed link key for ${ieeeAddress} (not supported by ESP Zigbee SDK v2), skipped`, NS);
            return;
        }

        const types: Record<number, number> = {8: 0, 10: 1, 14: 2, 18: 3};
        const icType = types[key.length];

        if (icType === undefined) {
            throw new Error(`Invalid install code length ${key.length} for ${ieeeAddress}`);
        }

        const ieee = Buffer.from(ieeeAddress.replace(/^0x/, ""), "hex").reverse();
        await this.#queue.execute(async () => await this.driver.request(CommandId.EXT_IC_ADD, Buffer.concat([ieee, Buffer.from([icType]), key])));
    }

    public waitFor(
        networkAddress: number,
        endpoint: number,
        frameType: Zcl.FrameType,
        _direction: Zcl.Direction,
        transactionSequenceNumber: number | undefined,
        clusterId: number,
        commandId: number,
        defaultRspCommandId: number | undefined,
        timeout: number,
    ): {promise: Promise<ZclPayload>; cancel: () => void} {
        const waiter = this.#zclWaitress.waitFor(
            {address: networkAddress, endpoint, frameType, clusterId, commandId, transactionSequenceNumber, defaultRspCommandId},
            timeout,
        );

        return {promise: waiter.start().promise, cancel: (): void => this.#zclWaitress.remove(waiter.ID)};
    }

    public async sendZdo(
        ieeeAddress: string,
        networkAddress: number,
        clusterId: Zdo.ClusterId,
        payload: Buffer,
        disableResponse: true,
    ): Promise<void>;
    public async sendZdo<K extends keyof ZdoTypes.RequestToResponseMap>(
        ieeeAddress: string,
        networkAddress: number,
        clusterId: K,
        payload: Buffer,
        disableResponse: false,
    ): Promise<ZdoTypes.RequestToResponseMap[K]>;
    public async sendZdo<K extends keyof ZdoTypes.RequestToResponseMap>(
        ieeeAddress: string,
        networkAddress: number,
        clusterId: K,
        payload: Buffer,
        disableResponse: boolean,
    ): Promise<ZdoTypes.RequestToResponseMap[K] | undefined> {
        const broadcast = ZSpec.Utils.isBroadcastAddress(networkAddress);

        // network-wide channel change: the NCP must switch itself too, so it performs the broadcast
        if (clusterId === Zdo.ClusterId.NWK_UPDATE_REQUEST && broadcast && payload[5] === 0xfe && this.#hasCapability(Capability.CHANNEL_CHANGE)) {
            const channels = ZSpec.Utils.uint32MaskToChannels(payload.readUInt32LE(1));
            logger.info(`Changing channel to ${channels[0]} (nwk update id ${payload[6]})`, NS);
            await this.#queue.execute(
                async () => await this.driver.request(CommandId.EXT_CHANNEL_CHANGE, Buffer.from([channels[0], payload[6] ?? 0])),
            );
            return undefined;
        }

        return await this.#queue.execute(async () => {
            const tsn = this.#nextZdoTsn();
            payload[0] = tsn;
            const responseClusterId = disableResponse ? undefined : Zdo.Utils.getResponseClusterId(clusterId);
            const waiter =
                responseClusterId !== undefined
                    ? this.#zdoWaitress.waitFor(
                          {
                              address: responseClusterId === Zdo.ClusterId.NETWORK_ADDRESS_RESPONSE ? ieeeAddress : networkAddress,
                              clusterId: responseClusterId,
                              tsn,
                          },
                          ZDO_RESPONSE_TIMEOUT_MS,
                      )
                    : undefined;
            const what = `ZDO ${Zdo.ClusterId[clusterId]} to ${ieeeAddress}:0x${networkAddress.toString(16)}`;
            logger.debug(() => `~~~> ${what} ${payload.toString("hex")}`, NS);

            try {
                const {confirm} = await this.#sendAps({
                    dstMode: ADDR_MODE_SHORT,
                    dst: networkAddress,
                    dstEndpoint: Zdo.ZDO_ENDPOINT,
                    srcEndpoint: Zdo.ZDO_ENDPOINT,
                    profileId: Zdo.ZDO_PROFILE_ID,
                    clusterId,
                    txOptions: broadcast ? 0 : APS_TX_OPT_ACK,
                    radius: 0,
                    asdu: payload,
                });

                if (waiter) {
                    const result = await this.#responseOrDeliveryFailure(waiter.start().promise, confirm, what, () =>
                        this.#zdoWaitress.remove(waiter.ID),
                    );

                    return result.response as ZdoTypes.RequestToResponseMap[K];
                }

                if (!broadcast) {
                    const status = await confirm;

                    if (status !== 0) {
                        throw new DeliveryError(status, what);
                    }
                }

                return undefined;
            } catch (error) {
                if (waiter) {
                    this.#zdoWaitress.remove(waiter.ID);
                }

                throw error;
            }
        }, networkAddress);
    }

    public async permitJoin(seconds: number, networkAddress?: number): Promise<void> {
        const clusterId = Zdo.ClusterId.PERMIT_JOINING_REQUEST;

        if (networkAddress) {
            // a specific router only
            const zdoPayload = Zdo.Buffalo.buildRequest(this.hasZdoMessageOverhead, clusterId, seconds, 1, []);
            const result = await this.sendZdo(ZSpec.BLANK_EUI64, networkAddress, clusterId, zdoPayload, false);

            if (!Zdo.Buffalo.checkStatus<Zdo.ClusterId.PERMIT_JOINING_RESPONSE>(result)) {
                throw new Zdo.StatusError(result[0]);
            }

            return;
        }

        // coordinator (local, no broadcast from the NCP) ...
        await this.#queue.execute(async () => await this.driver.request(CommandId.NETWORK_PERMIT_JOINING, Buffer.from([seconds])));

        // ... and, unless coordinator-only (0), every router
        if (networkAddress === undefined) {
            const zdoPayload = Zdo.Buffalo.buildRequest(this.hasZdoMessageOverhead, clusterId, seconds, 1, []);
            await this.sendZdo(ZSpec.BLANK_EUI64, ZSpec.BroadcastAddress.DEFAULT, clusterId, zdoPayload, true);
        }
    }

    public async sendZclFrameToEndpoint(
        ieeeAddr: string,
        networkAddress: number,
        endpoint: number,
        zclFrame: Zcl.Frame,
        timeout: number,
        disableResponse: boolean,
        disableRecovery: boolean,
        sourceEndpoint?: number,
        profileId?: number,
    ): Promise<ZclPayload | undefined> {
        const command = zclFrame.command;
        let commandResponseId: number | undefined;

        if (command.response !== undefined && disableResponse === false) {
            commandResponseId = command.response;
        } else if (!zclFrame.header.frameControl.disableDefaultResponse) {
            commandResponseId = Zcl.Foundation.defaultRsp.ID;
        }

        const srcEndpoint = sourceEndpoint ?? ZSpec.HA_ENDPOINT;
        const req: ApsDataRequest = {
            dstMode: ADDR_MODE_SHORT,
            dst: networkAddress,
            dstEndpoint: endpoint,
            srcEndpoint,
            profileId: profileId ?? (srcEndpoint === ZSpec.GP_ENDPOINT ? ZSpec.GP_PROFILE_ID : ZSpec.HA_PROFILE_ID),
            clusterId: zclFrame.cluster.ID,
            txOptions: APS_TX_OPT_ACK,
            radius: 0,
            asdu: zclFrame.toBuffer(),
        };
        const what = `ZCL ${zclFrame.cluster.name}.${command.name} to ${ieeeAddr}:0x${networkAddress.toString(16)}/${endpoint}`;

        return await this.#queue.execute(async () => {
            for (let attempt = 1; ; attempt++) {
                const waiter =
                    commandResponseId !== undefined
                        ? this.#zclWaitress.waitFor(
                              {
                                  address: networkAddress,
                                  endpoint,
                                  // a defaultRsp is matched whatever the frame type
                                  frameType: zclFrame.header.frameControl.frameType,
                                  clusterId: zclFrame.cluster.ID,
                                  commandId: commandResponseId,
                                  transactionSequenceNumber: zclFrame.header.transactionSequenceNumber,
                              },
                              timeout,
                          )
                        : undefined;
                logger.debug(() => `~~~> ${what} (attempt ${attempt}) ${req.asdu.toString("hex")}`, NS);

                try {
                    const {confirm} = await this.#sendAps(req);

                    if (waiter) {
                        const waiterId = waiter.ID;

                        return await this.#responseOrDeliveryFailure(waiter.start().promise, confirm, what, () => this.#zclWaitress.remove(waiterId));
                    }

                    const status = await confirm;

                    if (status !== 0) {
                        throw new DeliveryError(status, what);
                    }

                    return undefined;
                } catch (error) {
                    if (waiter) {
                        this.#zclWaitress.remove(waiter.ID);
                    }

                    if (disableRecovery || attempt >= MAX_SEND_ATTEMPTS || !this.#isRecoverable(error)) {
                        throw error;
                    }

                    logger.debug(`${(error as Error).message}, retrying`, NS);
                    await wait(BUSY_BACKOFF_MS * attempt);
                }
            }
        }, networkAddress);
    }

    public async sendZclFrameToGroup(groupID: number, zclFrame: Zcl.Frame, sourceEndpoint?: number, profileId?: number): Promise<void> {
        const srcEndpoint = sourceEndpoint ?? ZSpec.HA_ENDPOINT;
        await this.#sendBroadcastOrGroup(
            {
                dstMode: ADDR_MODE_GROUP,
                dst: groupID,
                dstEndpoint: 0xff,
                srcEndpoint,
                profileId: profileId ?? (srcEndpoint === ZSpec.GP_ENDPOINT ? ZSpec.GP_PROFILE_ID : ZSpec.HA_PROFILE_ID),
                clusterId: zclFrame.cluster.ID,
                txOptions: 0,
                radius: 0,
                asdu: zclFrame.toBuffer(),
            },
            `ZCL ${zclFrame.cluster.name} to group ${groupID}`,
        );
    }

    public async sendZclFrameToAll(
        endpoint: number,
        zclFrame: Zcl.Frame,
        sourceEndpoint: number,
        destination: ZSpec.BroadcastAddress,
        profileId?: number,
    ): Promise<void> {
        await this.#sendBroadcastOrGroup(
            {
                dstMode: ADDR_MODE_SHORT,
                dst: destination,
                dstEndpoint: endpoint,
                srcEndpoint: sourceEndpoint,
                profileId: profileId ?? (sourceEndpoint === ZSpec.GP_ENDPOINT ? ZSpec.GP_PROFILE_ID : ZSpec.HA_PROFILE_ID),
                clusterId: zclFrame.cluster.ID,
                txOptions: 0,
                radius: 0,
                asdu: zclFrame.toBuffer(),
            },
            `ZCL ${zclFrame.cluster.name} broadcast to 0x${destination.toString(16)}`,
        );
    }

    async #sendBroadcastOrGroup(req: ApsDataRequest, what: string): Promise<void> {
        await this.#queue.execute(async () => {
            logger.debug(() => `~~~> ${what} ${req.asdu.toString("hex")}`, NS);
            const {confirm} = await this.#sendAps(req);
            const status = await confirm;

            if (status !== 0) {
                throw new DeliveryError(status, what);
            }
        });
    }

    public setChannelInterPAN(_channel: number): Promise<void> {
        return Promise.reject(new Error("Inter-PAN is not supported by the espzb adapter"));
    }

    public sendZclFrameInterPANToIeeeAddr(_zclFrame: Zcl.Frame, _ieeeAddress: string): Promise<void> {
        return Promise.reject(new Error("Inter-PAN is not supported by the espzb adapter"));
    }

    public sendZclFrameInterPANBroadcast(zclFrame: Zcl.Frame, timeout: number, disableResponse: false): Promise<ZclPayload>;
    public sendZclFrameInterPANBroadcast(zclFrame: Zcl.Frame, timeout: number, disableResponse: true): Promise<undefined>;
    public sendZclFrameInterPANBroadcast(_zclFrame: Zcl.Frame, _timeout: number, _disableResponse: boolean): Promise<ZclPayload | undefined> {
        return Promise.reject(new Error("Inter-PAN is not supported by the espzb adapter"));
    }

    public restoreChannelInterPAN(): Promise<void> {
        return Promise.reject(new Error("Inter-PAN is not supported by the espzb adapter"));
    }
}
