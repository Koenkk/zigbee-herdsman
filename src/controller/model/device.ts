import assert from 'node:assert';

import {Events as AdapterEvents} from '../../adapter';
import {LQINeighbor, RoutingTableEntry} from '../../adapter/tstype';
import {wait} from '../../utils';
import {logger} from '../../utils/logger';
import * as ZSpec from '../../zspec';
import {BroadcastAddress} from '../../zspec/enums';
import {EUI64} from '../../zspec/tstypes';
import * as Zcl from '../../zspec/zcl';
import {ClusterDefinition, CustomClusters} from '../../zspec/zcl/definition/tstype';
import * as Zdo from '../../zspec/zdo';
import {ControllerEventMap} from '../controller';
import {ZclFrameConverter} from '../helpers';
import ZclTransactionSequenceNumber from '../helpers/zclTransactionSequenceNumber';
import {DatabaseEntry, DeviceType, KeyValue} from '../tstype';
import Endpoint from './endpoint';
import Entity from './entity';

/**
 * @ignore
 */
const OneJanuary2000 = new Date('January 01, 2000 00:00:00 UTC+00:00').getTime();

const NS = 'zh:controller:device';

interface LQI {
    neighbors: {
        ieeeAddr: string;
        networkAddress: number;
        linkquality: number;
        relationship: number;
        depth: number;
    }[];
}

interface RoutingTable {
    table: {destinationAddress: number; status: string; nextHop: number}[];
}

type CustomReadResponse = (frame: Zcl.Frame, endpoint: Endpoint) => boolean;

export class Device extends Entity<ControllerEventMap> {
    private readonly ID: number;
    private _applicationVersion?: number;
    private _dateCode?: string;
    private _endpoints: Endpoint[];
    private _hardwareVersion?: number;
    private _ieeeAddr: string;
    private _interviewCompleted: boolean;
    private _interviewing: boolean;
    private _lastSeen?: number;
    private _manufacturerID?: number;
    private _manufacturerName?: string;
    private _modelID?: string;
    private _networkAddress: number;
    private _powerSource?: string;
    private _softwareBuildID?: string;
    private _stackVersion?: number;
    private _type: DeviceType;
    private _zclVersion?: number;
    private _linkquality?: number;
    private _skipDefaultResponse: boolean;
    private _customReadResponse?: CustomReadResponse;
    private _lastDefaultResponseSequenceNumber?: number;
    private _checkinInterval?: number;
    private _pendingRequestTimeout: number;
    private _customClusters: CustomClusters = {};

    // Getters/setters
    get ieeeAddr(): string {
        return this._ieeeAddr;
    }
    set ieeeAddr(ieeeAddr: string) {
        this._ieeeAddr = ieeeAddr;
    }
    get applicationVersion(): number | undefined {
        return this._applicationVersion;
    }
    set applicationVersion(applicationVersion: number) {
        this._applicationVersion = applicationVersion;
    }
    get endpoints(): Endpoint[] {
        return this._endpoints;
    }
    get interviewCompleted(): boolean {
        return this._interviewCompleted;
    }
    get interviewing(): boolean {
        return this._interviewing;
    }
    get lastSeen(): number | undefined {
        return this._lastSeen;
    }
    get manufacturerID(): number | undefined {
        return this._manufacturerID;
    }
    get isDeleted(): boolean {
        return Device.deletedDevices.has(this.ieeeAddr);
    }
    set type(type: DeviceType) {
        this._type = type;
    }
    get type(): DeviceType {
        return this._type;
    }
    get dateCode(): string | undefined {
        return this._dateCode;
    }
    set dateCode(dateCode: string) {
        this._dateCode = dateCode;
    }
    set hardwareVersion(hardwareVersion: number) {
        this._hardwareVersion = hardwareVersion;
    }
    get hardwareVersion(): number | undefined {
        return this._hardwareVersion;
    }
    get manufacturerName(): string | undefined {
        return this._manufacturerName;
    }
    set manufacturerName(manufacturerName: string | undefined) {
        this._manufacturerName = manufacturerName;
    }
    set modelID(modelID: string) {
        this._modelID = modelID;
    }
    get modelID(): string | undefined {
        return this._modelID;
    }
    get networkAddress(): number {
        return this._networkAddress;
    }
    set networkAddress(networkAddress: number) {
        Device.nwkToIeeeCache.delete(this._networkAddress);

        this._networkAddress = networkAddress;

        Device.nwkToIeeeCache.set(this._networkAddress, this.ieeeAddr);

        for (const endpoint of this._endpoints) {
            endpoint.deviceNetworkAddress = networkAddress;
        }
    }
    get powerSource(): string | undefined {
        return this._powerSource;
    }
    set powerSource(powerSource: string) {
        this._powerSource = typeof powerSource === 'number' ? Zcl.POWER_SOURCES[powerSource & ~(1 << 7)] : powerSource;
    }
    get softwareBuildID(): string | undefined {
        return this._softwareBuildID;
    }
    set softwareBuildID(softwareBuildID: string) {
        this._softwareBuildID = softwareBuildID;
    }
    get stackVersion(): number | undefined {
        return this._stackVersion;
    }
    set stackVersion(stackVersion: number) {
        this._stackVersion = stackVersion;
    }
    get zclVersion(): number | undefined {
        return this._zclVersion;
    }
    set zclVersion(zclVersion: number) {
        this._zclVersion = zclVersion;
    }
    get linkquality(): number | undefined {
        return this._linkquality;
    }
    set linkquality(linkquality: number) {
        this._linkquality = linkquality;
    }
    get skipDefaultResponse(): boolean {
        return this._skipDefaultResponse;
    }
    set skipDefaultResponse(skipDefaultResponse: boolean) {
        this._skipDefaultResponse = skipDefaultResponse;
    }
    get customReadResponse(): CustomReadResponse | undefined {
        return this._customReadResponse;
    }
    set customReadResponse(customReadResponse: CustomReadResponse | undefined) {
        this._customReadResponse = customReadResponse;
    }
    get checkinInterval(): number | undefined {
        return this._checkinInterval;
    }
    set checkinInterval(checkinInterval: number | undefined) {
        this._checkinInterval = checkinInterval;

        this.resetPendingRequestTimeout();
    }
    get pendingRequestTimeout(): number {
        return this._pendingRequestTimeout;
    }
    set pendingRequestTimeout(pendingRequestTimeout: number) {
        this._pendingRequestTimeout = pendingRequestTimeout;
    }
    get customClusters(): CustomClusters {
        return this._customClusters;
    }

    public meta: KeyValue;

    // This lookup contains all devices that are queried from the database, this is to ensure that always
    // the same instance is returned.
    private static readonly devices: Map<string /* IEEE */, Device> = new Map();
    private static loadedFromDatabase: boolean = false;
    private static readonly deletedDevices: Map<string /* IEEE */, Device> = new Map();
    private static readonly nwkToIeeeCache: Map<number /* nwk addr */, string /* IEEE */> = new Map();

    public static readonly ReportablePropertiesMapping: {
        [s: string]: {
            set: (value: string | number, device: Device) => void;
            key:
                | 'modelID'
                | 'manufacturerName'
                | 'applicationVersion'
                | 'zclVersion'
                | 'powerSource'
                | 'stackVersion'
                | 'dateCode'
                | 'softwareBuildID'
                | 'hardwareVersion';
        };
    } = {
        modelId: {
            key: 'modelID',
            set: (v: string | number, d: Device): void => {
                d.modelID = v as string;
            },
        },
        manufacturerName: {
            key: 'manufacturerName',
            set: (v: string | number, d: Device): void => {
                d.manufacturerName = v as string;
            },
        },
        powerSource: {
            key: 'powerSource',
            set: (v: string | number, d: Device): void => {
                d.powerSource = v as string;
            },
        },
        zclVersion: {
            key: 'zclVersion',
            set: (v: string | number, d: Device): void => {
                d.zclVersion = v as number;
            },
        },
        appVersion: {
            key: 'applicationVersion',
            set: (v: string | number, d: Device): void => {
                d.applicationVersion = v as number;
            },
        },
        stackVersion: {
            key: 'stackVersion',
            set: (v: string | number, d: Device): void => {
                d.stackVersion = v as number;
            },
        },
        hwVersion: {
            key: 'hardwareVersion',
            set: (v: string | number, d: Device): void => {
                d.hardwareVersion = v as number;
            },
        },
        dateCode: {
            key: 'dateCode',
            set: (v: string | number, d: Device): void => {
                d.dateCode = v as string;
            },
        },
        swBuildId: {
            key: 'softwareBuildID',
            set: (v: string | number, d: Device): void => {
                d.softwareBuildID = v as string;
            },
        },
    };

    private constructor(
        ID: number,
        type: DeviceType,
        ieeeAddr: string,
        networkAddress: number,
        manufacturerID: number | undefined,
        endpoints: Endpoint[],
        manufacturerName: string | undefined,
        powerSource: string | undefined,
        modelID: string | undefined,
        applicationVersion: number | undefined,
        stackVersion: number | undefined,
        zclVersion: number | undefined,
        hardwareVersion: number | undefined,
        dateCode: string | undefined,
        softwareBuildID: string | undefined,
        interviewCompleted: boolean,
        meta: KeyValue,
        lastSeen: number | undefined,
        checkinInterval: number | undefined,
        pendingRequestTimeout: number,
    ) {
        super();
        this.ID = ID;
        this._type = type;
        this._ieeeAddr = ieeeAddr;
        this._networkAddress = networkAddress;
        this._manufacturerID = manufacturerID;
        this._endpoints = endpoints;
        this._manufacturerName = manufacturerName;
        this._powerSource = powerSource;
        this._modelID = modelID;
        this._applicationVersion = applicationVersion;
        this._stackVersion = stackVersion;
        this._zclVersion = zclVersion;
        this._hardwareVersion = hardwareVersion;
        this._dateCode = dateCode;
        this._softwareBuildID = softwareBuildID;
        this._interviewCompleted = interviewCompleted;
        this._interviewing = false;
        this._skipDefaultResponse = false;
        this.meta = meta;
        this._lastSeen = lastSeen;
        this._checkinInterval = checkinInterval;
        this._pendingRequestTimeout = pendingRequestTimeout;
    }

    public createEndpoint(ID: number): Endpoint {
        if (this.getEndpoint(ID)) {
            throw new Error(`Device '${this.ieeeAddr}' already has an endpoint '${ID}'`);
        }

        const endpoint = Endpoint.create(ID, undefined, undefined, [], [], this.networkAddress, this.ieeeAddr);
        this.endpoints.push(endpoint);
        this.save();
        return endpoint;
    }

    public changeIeeeAddress(ieeeAddr: string): void {
        Device.devices.delete(this.ieeeAddr);
        this.ieeeAddr = ieeeAddr;
        Device.devices.set(this.ieeeAddr, this);
        Device.nwkToIeeeCache.set(this.networkAddress, this.ieeeAddr);

        this.endpoints.forEach((e) => (e.deviceIeeeAddress = ieeeAddr));
        this.save();
    }

    public getEndpoint(ID: number): Endpoint | undefined {
        return this.endpoints.find((e): boolean => e.ID === ID);
    }

    // There might be multiple endpoints with same DeviceId but it is not supported and first endpoint is returned
    public getEndpointByDeviceType(deviceType: string): Endpoint | undefined {
        const deviceID = Zcl.ENDPOINT_DEVICE_TYPE[deviceType];
        return this.endpoints.find((d): boolean => d.deviceID === deviceID);
    }

    public implicitCheckin(): void {
        // No need to do anythign in `catch` as `endpoint.sendRequest` already logs failures.
        Promise.allSettled(this.endpoints.map((e) => e.sendPendingRequests(false))).catch(() => {});
    }

    public updateLastSeen(): void {
        this._lastSeen = Date.now();
    }

    private resetPendingRequestTimeout(): void {
        // pendingRequestTimeout can be changed dynamically at runtime, and it is not persisted.
        // Default timeout is one checkin interval in milliseconds.
        this._pendingRequestTimeout = (this._checkinInterval ?? 0) * 1000;
    }

    private hasPendingRequests(): boolean {
        return this.endpoints.find((e) => e.hasPendingRequests()) !== undefined;
    }

    public async onZclData(dataPayload: AdapterEvents.ZclPayload, frame: Zcl.Frame, endpoint: Endpoint): Promise<void> {
        // Update reportable properties
        if (frame.isCluster('genBasic') && (frame.isCommand('readRsp') || frame.isCommand('report'))) {
            const attrKeyValue = ZclFrameConverter.attributeKeyValue(frame, this.manufacturerID, this.customClusters);

            for (const key in attrKeyValue) {
                Device.ReportablePropertiesMapping[key]?.set(attrKeyValue[key], this);
            }
        }

        // Respond to enroll requests
        if (frame.header.isSpecific && frame.isCluster('ssIasZone') && frame.isCommand('enrollReq')) {
            logger.debug(`IAS - '${this.ieeeAddr}' responding to enroll response`, NS);
            const payload = {enrollrspcode: 0, zoneid: 23};
            await endpoint.command('ssIasZone', 'enrollRsp', payload, {disableDefaultResponse: true});
        }

        // Reponse to read requests
        if (frame.header.isGlobal && frame.isCommand('read') && !this._customReadResponse?.(frame, endpoint)) {
            const time = Math.round((new Date().getTime() - OneJanuary2000) / 1000);
            const attributes: {[s: string]: KeyValue} = {
                ...endpoint.clusters,
                genTime: {
                    attributes: {
                        timeStatus: 3, // Time-master + synchronised
                        time: time,
                        timeZone: new Date().getTimezoneOffset() * -1 * 60,
                        localTime: time - new Date().getTimezoneOffset() * 60,
                        lastSetTime: time,
                        validUntilTime: time + 24 * 60 * 60, // valid for 24 hours
                    },
                },
            };

            if (frame.cluster.name in attributes) {
                const response: KeyValue = {};
                for (const entry of frame.payload) {
                    if (frame.cluster.hasAttribute(entry.attrId)) {
                        const name = frame.cluster.getAttribute(entry.attrId).name;
                        if (name in attributes[frame.cluster.name].attributes) {
                            response[name] = attributes[frame.cluster.name].attributes[name];
                        }
                    }
                }

                try {
                    await endpoint.readResponse(frame.cluster.ID, frame.header.transactionSequenceNumber, response, {
                        srcEndpoint: dataPayload.destinationEndpoint,
                    });
                } catch (error) {
                    logger.error(`Read response to ${this.ieeeAddr} failed (${(error as Error).message})`, NS);
                }
            }
        }

        // Handle check-in from sleeping end devices
        if (frame.header.isSpecific && frame.isCluster('genPollCtrl') && frame.isCommand('checkin')) {
            try {
                if (this.hasPendingRequests() || this._checkinInterval === undefined) {
                    const payload = {
                        startFastPolling: true,
                        fastPollTimeout: 0,
                    };
                    logger.debug(`check-in from ${this.ieeeAddr}: accepting fast-poll`, NS);
                    await endpoint.command(frame.cluster.ID, 'checkinRsp', payload, {sendPolicy: 'immediate'});

                    // This is a good time to read the checkin interval if we haven't stored it previously
                    if (this._checkinInterval === undefined) {
                        const pollPeriod = await endpoint.read('genPollCtrl', ['checkinInterval'], {sendPolicy: 'immediate'});
                        this._checkinInterval = pollPeriod.checkinInterval / 4; // convert to seconds
                        this.resetPendingRequestTimeout();
                        logger.debug(`Request Queue (${this.ieeeAddr}): default expiration timeout set to ${this.pendingRequestTimeout}`, NS);
                    }

                    await Promise.all(this.endpoints.map(async (e) => await e.sendPendingRequests(true)));
                    // We *must* end fast-poll when we're done sending things. Otherwise
                    // we cause undue power-drain.
                    logger.debug(`check-in from ${this.ieeeAddr}: stopping fast-poll`, NS);
                    await endpoint.command(frame.cluster.ID, 'fastPollStop', {}, {sendPolicy: 'immediate'});
                } else {
                    const payload = {
                        startFastPolling: false,
                        fastPollTimeout: 0,
                    };
                    logger.debug(`check-in from ${this.ieeeAddr}: declining fast-poll`, NS);
                    await endpoint.command(frame.cluster.ID, 'checkinRsp', payload, {sendPolicy: 'immediate'});
                }
            } catch (error) {
                logger.error(`Handling of poll check-in from ${this.ieeeAddr} failed (${(error as Error).message})`, NS);
            }
        }

        // Send a default response if necessary.
        const isDefaultResponse = frame.header.isGlobal && frame.command.name === 'defaultRsp';
        const commandHasResponse = frame.command.response != undefined;
        const disableDefaultResponse = frame.header.frameControl.disableDefaultResponse;
        /* v8 ignore next */
        const disableTuyaDefaultResponse = endpoint.getDevice().manufacturerName?.startsWith('_TZ') && process.env['DISABLE_TUYA_DEFAULT_RESPONSE'];
        // Sometimes messages are received twice, prevent responding twice
        const alreadyResponded = this._lastDefaultResponseSequenceNumber === frame.header.transactionSequenceNumber;

        if (
            this.type !== 'GreenPower' &&
            !dataPayload.wasBroadcast &&
            !disableDefaultResponse &&
            !isDefaultResponse &&
            !commandHasResponse &&
            !this._skipDefaultResponse &&
            !alreadyResponded &&
            !disableTuyaDefaultResponse
        ) {
            try {
                this._lastDefaultResponseSequenceNumber = frame.header.transactionSequenceNumber;
                // In the ZCL it is not documented what the direction of the default response should be
                // In https://github.com/Koenkk/zigbee2mqtt/issues/18096 a commandResponse (SERVER_TO_CLIENT)
                // is send and the device expects a CLIENT_TO_SERVER back.
                // Previously SERVER_TO_CLIENT was always used.
                // Therefore for non-global commands we inverse the direction.
                const direction = frame.header.isGlobal
                    ? Zcl.Direction.SERVER_TO_CLIENT
                    : frame.header.frameControl.direction === Zcl.Direction.CLIENT_TO_SERVER
                      ? Zcl.Direction.SERVER_TO_CLIENT
                      : Zcl.Direction.CLIENT_TO_SERVER;

                await endpoint.defaultResponse(frame.command.ID, 0, frame.cluster.ID, frame.header.transactionSequenceNumber, {direction});
            } catch (error) {
                logger.debug(`Default response to ${this.ieeeAddr} failed (${error})`, NS);
            }
        }
    }

    /*
     * CRUD
     */

    /**
     * Reset runtime lookups.
     */
    public static resetCache(): void {
        Device.devices.clear();
        Device.loadedFromDatabase = false;
        Device.deletedDevices.clear();
        Device.nwkToIeeeCache.clear();
    }

    private static fromDatabaseEntry(entry: DatabaseEntry): Device {
        const networkAddress = entry.nwkAddr;
        const ieeeAddr = entry.ieeeAddr;
        const endpoints: Endpoint[] = [];

        for (const id in entry.endpoints) {
            endpoints.push(Endpoint.fromDatabaseRecord(entry.endpoints[id], networkAddress, ieeeAddr));
        }

        const meta = entry.meta ? entry.meta : {};

        if (entry.type === 'Group') {
            throw new Error('Cannot load device from group');
        }

        // default: no timeout (messages expire immediately after first send attempt)
        let pendingRequestTimeout = 0;
        if (endpoints.filter((e): boolean => e.inputClusters.includes(Zcl.Clusters.genPollCtrl.ID)).length > 0) {
            // default for devices that support genPollCtrl cluster (RX off when idle): 1 day
            pendingRequestTimeout = 86400000;
        }
        // always load value from database available (modernExtend.quirkCheckinInterval() exists for devices without genPollCtl)
        if (entry.checkinInterval !== undefined) {
            // if the checkin interval is known, messages expire by default after one checkin interval
            pendingRequestTimeout = entry.checkinInterval * 1000; // milliseconds
        }
        logger.debug(`Request Queue (${ieeeAddr}): default expiration timeout set to ${pendingRequestTimeout}`, NS);

        return new Device(
            entry.id,
            entry.type,
            ieeeAddr,
            networkAddress,
            entry.manufId,
            endpoints,
            entry.manufName,
            entry.powerSource,
            entry.modelId,
            entry.appVersion,
            entry.stackVersion,
            entry.zclVersion,
            entry.hwVersion,
            entry.dateCode,
            entry.swBuildId,
            entry.interviewCompleted,
            meta,
            entry.lastSeen,
            entry.checkinInterval,
            pendingRequestTimeout,
        );
    }

    private toDatabaseEntry(): DatabaseEntry {
        const epList = this.endpoints.map((e): number => e.ID);
        const endpoints: KeyValue = {};

        for (const endpoint of this.endpoints) {
            endpoints[endpoint.ID] = endpoint.toDatabaseRecord();
        }

        return {
            id: this.ID,
            type: this.type,
            ieeeAddr: this.ieeeAddr,
            nwkAddr: this.networkAddress,
            manufId: this.manufacturerID,
            manufName: this.manufacturerName,
            powerSource: this.powerSource,
            modelId: this.modelID,
            epList,
            endpoints,
            appVersion: this.applicationVersion,
            stackVersion: this.stackVersion,
            hwVersion: this.hardwareVersion,
            dateCode: this.dateCode,
            swBuildId: this.softwareBuildID,
            zclVersion: this.zclVersion,
            interviewCompleted: this.interviewCompleted,
            meta: this.meta,
            lastSeen: this.lastSeen,
            checkinInterval: this.checkinInterval,
        };
    }

    public save(writeDatabase = true): void {
        Entity.database!.update(this.toDatabaseEntry(), writeDatabase);
    }

    private static loadFromDatabaseIfNecessary(): void {
        if (!Device.loadedFromDatabase) {
            for (const entry of Entity.database!.getEntriesIterator(['Coordinator', 'EndDevice', 'Router', 'GreenPower', 'Unknown'])) {
                const device = Device.fromDatabaseEntry(entry);

                Device.devices.set(device.ieeeAddr, device);
                Device.nwkToIeeeCache.set(device.networkAddress, device.ieeeAddr);
            }

            Device.loadedFromDatabase = true;
        }
    }

    public static find(ieeeOrNwkAddress: string | number, includeDeleted: boolean = false): Device | undefined {
        return typeof ieeeOrNwkAddress === 'string'
            ? Device.byIeeeAddr(ieeeOrNwkAddress, includeDeleted)
            : Device.byNetworkAddress(ieeeOrNwkAddress, includeDeleted);
    }

    public static byIeeeAddr(ieeeAddr: string, includeDeleted: boolean = false): Device | undefined {
        Device.loadFromDatabaseIfNecessary();

        return includeDeleted ? (Device.deletedDevices.get(ieeeAddr) ?? Device.devices.get(ieeeAddr)) : Device.devices.get(ieeeAddr);
    }

    public static byNetworkAddress(networkAddress: number, includeDeleted: boolean = false): Device | undefined {
        Device.loadFromDatabaseIfNecessary();

        const ieeeAddr = Device.nwkToIeeeCache.get(networkAddress);

        return ieeeAddr ? Device.byIeeeAddr(ieeeAddr, includeDeleted) : undefined;
    }

    public static byType(type: DeviceType): Device[] {
        const devices: Device[] = [];

        for (const device of Device.allIterator((d) => d.type === type)) {
            devices.push(device);
        }

        return devices;
    }

    /**
     * @deprecated use allIterator()
     */
    public static all(): Device[] {
        Device.loadFromDatabaseIfNecessary();
        return Array.from(Device.devices.values());
    }

    public static *allIterator(predicate?: (value: Device) => boolean): Generator<Device> {
        Device.loadFromDatabaseIfNecessary();

        for (const device of Device.devices.values()) {
            if (!predicate || predicate(device)) {
                yield device;
            }
        }
    }

    public undelete(interviewCompleted?: boolean): void {
        if (Device.deletedDevices.delete(this.ieeeAddr)) {
            Device.devices.set(this.ieeeAddr, this);

            this._interviewCompleted = interviewCompleted ?? this._interviewCompleted;

            Entity.database!.insert(this.toDatabaseEntry());
        } else {
            throw new Error(`Device '${this.ieeeAddr}' is not deleted`);
        }
    }

    public static create(
        type: DeviceType,
        ieeeAddr: string,
        networkAddress: number,
        manufacturerID: number | undefined,
        manufacturerName: string | undefined,
        powerSource: string | undefined,
        modelID: string | undefined,
        interviewCompleted: boolean,
    ): Device {
        Device.loadFromDatabaseIfNecessary();

        if (Device.devices.has(ieeeAddr)) {
            throw new Error(`Device with IEEE address '${ieeeAddr}' already exists`);
        }

        const ID = Entity.database!.newID();
        const device = new Device(
            ID,
            type,
            ieeeAddr,
            networkAddress,
            manufacturerID,
            [],
            manufacturerName,
            powerSource,
            modelID,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            interviewCompleted,
            {},
            undefined,
            undefined,
            0,
        );

        Entity.database!.insert(device.toDatabaseEntry());
        Device.devices.set(device.ieeeAddr, device);
        Device.nwkToIeeeCache.set(device.networkAddress, device.ieeeAddr);
        return device;
    }

    /*
     * Zigbee functions
     */

    public async interview(ignoreCache: boolean = false): Promise<void> {
        if (this.interviewing) {
            const message = `Interview - interview already in progress for '${this.ieeeAddr}'`;
            logger.debug(message, NS);
            throw new Error(message);
        }

        let err: unknown;
        this._interviewing = true;
        logger.debug(`Interview - start device '${this.ieeeAddr}'`, NS);

        try {
            await this.interviewInternal(ignoreCache);
            logger.debug(`Interview - completed for device '${this.ieeeAddr}'`, NS);
            this._interviewCompleted = true;
        } catch (error) {
            if (this.interviewQuirks()) {
                logger.debug(`Interview - completed for device '${this.ieeeAddr}' because of quirks ('${error}')`, NS);
            } else {
                logger.debug(`Interview - failed for device '${this.ieeeAddr}' with error '${error}'`, NS);
                err = error;
            }
        } finally {
            this._interviewing = false;
            this.save();
        }

        if (err) {
            throw err;
        }
    }

    private interviewQuirks(): boolean {
        logger.debug(`Interview - quirks check for '${this.modelID}'-'${this.manufacturerName}'-'${this.type}'`, NS);

        // Tuya devices are typically hard to interview. They also don't require a full interview to work correctly
        // e.g. no ias enrolling is required for the devices to work.
        // Assume that in case we got both the manufacturerName and modelID the device works correctly.
        // https://github.com/Koenkk/zigbee2mqtt/issues/7564:
        //      Fails during ias enroll due to UNSUPPORTED_ATTRIBUTE
        // https://github.com/Koenkk/zigbee2mqtt/issues/4655
        //      Device does not change zoneState after enroll (event with original gateway)
        // modelID is mostly in the form of e.g. TS0202 and manufacturerName like e.g. _TYZB01_xph99wvr
        if (this.modelID?.match('^TS\\d*$') && (this.manufacturerName?.match('^_TZ.*_.*$') || this.manufacturerName?.match('^_TYZB01_.*$'))) {
            this._powerSource = this._powerSource || 'Battery';
            this._interviewing = false;
            this._interviewCompleted = true;
            logger.debug(`Interview - quirks matched for Tuya end device`, NS);
            return true;
        }

        // Some devices, e.g. Xiaomi end devices have a different interview procedure, after pairing they
        // report it's modelID trough a readResponse. The readResponse is received by the controller and set
        // on the device.
        const lookup: {
            [s: string]: {
                type?: DeviceType;
                manufacturerID?: number;
                manufacturerName?: string;
                powerSource?: string;
            };
        } = {
            '^3R.*?Z': {
                type: 'EndDevice',
                powerSource: 'Battery',
            },
            'lumi..*': {
                type: 'EndDevice',
                manufacturerID: 4151,
                manufacturerName: 'LUMI',
                powerSource: 'Battery',
            },
            'TERNCY-PP01': {
                type: 'EndDevice',
                manufacturerID: 4648,
                manufacturerName: 'TERNCY',
                powerSource: 'Battery',
            },
            '3RWS18BZ': {}, // https://github.com/Koenkk/zigbee-herdsman-converters/pull/2710
            'MULTI-MECI--EA01': {},
            MOT003: {}, // https://github.com/Koenkk/zigbee2mqtt/issues/12471
        };

        let match: string | undefined;

        for (const key in lookup) {
            if (this.modelID && this.modelID.match(key)) {
                match = key;
                break;
            }
        }

        if (match) {
            const info = lookup[match];
            logger.debug(`Interview procedure failed but got modelID matching '${match}', assuming interview succeeded`, NS);
            this._type = this._type === 'Unknown' && info.type ? info.type : this._type;
            this._manufacturerID = this._manufacturerID || info.manufacturerID;
            this._manufacturerName = this._manufacturerName || info.manufacturerName;
            this._powerSource = this._powerSource || info.powerSource;
            this._interviewing = false;
            this._interviewCompleted = true;
            logger.debug(`Interview - quirks matched on '${match}'`, NS);
            return true;
        } else {
            logger.debug('Interview - quirks did not match', NS);
            return false;
        }
    }

    private async interviewInternal(ignoreCache: boolean): Promise<void> {
        const hasNodeDescriptor = (): boolean => this._manufacturerID !== undefined && this._type !== 'Unknown';

        if (ignoreCache || !hasNodeDescriptor()) {
            for (let attempt = 0; attempt < 6; attempt++) {
                try {
                    await this.updateNodeDescriptor();
                    break;
                } catch (error) {
                    if (this.interviewQuirks()) {
                        logger.debug(`Interview - completed for device '${this.ieeeAddr}' because of quirks ('${error}')`, NS);
                        return;
                    } else {
                        // Most of the times the first node descriptor query fails and the seconds one succeeds.
                        logger.debug(`Interview - node descriptor request failed for '${this.ieeeAddr}', attempt ${attempt + 1}`, NS);
                    }
                }
            }
        } else {
            logger.debug(`Interview - skip node descriptor request for '${this.ieeeAddr}', already got it`, NS);
        }

        if (!hasNodeDescriptor()) {
            throw new Error(`Interview failed because can not get node descriptor ('${this.ieeeAddr}')`);
        }

        if (this.manufacturerID === 4619 && this._type === 'EndDevice') {
            // Give Tuya end device some time to pair. Otherwise they leave immediately.
            // https://github.com/Koenkk/zigbee2mqtt/issues/5814
            logger.debug('Interview - Detected Tuya end device, waiting 10 seconds...', NS);
            await wait(10000);
        } else if (this.manufacturerID === 0 || this.manufacturerID === 4098) {
            // Potentially a Tuya device, some sleep fast so make sure to read the modelId and manufacturerName quickly.
            // In case the device responds, the endoint and modelID/manufacturerName are set
            // in controller.onZclOrRawData()
            // https://github.com/Koenkk/zigbee2mqtt/issues/7553
            logger.debug('Interview - Detected potential Tuya end device, reading modelID and manufacturerName...', NS);
            try {
                const endpoint = Endpoint.create(1, undefined, undefined, [], [], this.networkAddress, this.ieeeAddr);
                const result = await endpoint.read('genBasic', ['modelId', 'manufacturerName'], {sendPolicy: 'immediate'});

                for (const key in result) {
                    Device.ReportablePropertiesMapping[key].set(result[key], this);
                }
            } catch (error) {
                logger.debug(`Interview - Tuya read modelID and manufacturerName failed (${error})`, NS);
            }
        }

        // e.g. Xiaomi Aqara Opple devices fail to respond to the first active endpoints request, therefore try 2 times
        // https://github.com/Koenkk/zigbee-herdsman/pull/103
        let gotActiveEndpoints: boolean = false;

        for (let attempt = 0; attempt < 2; attempt++) {
            try {
                await this.updateActiveEndpoints();
                gotActiveEndpoints = true;
                break;
            } catch (error) {
                logger.debug(`Interview - active endpoints request failed for '${this.ieeeAddr}', attempt ${attempt + 1} (${error})`, NS);
            }
        }

        if (!gotActiveEndpoints) {
            throw new Error(`Interview failed because can not get active endpoints ('${this.ieeeAddr}')`);
        }

        logger.debug(`Interview - got active endpoints for device '${this.ieeeAddr}'`, NS);

        const coordinator = Device.byType('Coordinator')[0];

        for (const endpoint of this._endpoints) {
            await endpoint.updateSimpleDescriptor();
            logger.debug(`Interview - got simple descriptor for endpoint '${endpoint.ID}' device '${this.ieeeAddr}'`, NS);

            // Read attributes
            // nice to have but not required for successful pairing as most of the attributes are not mandatory in ZCL specification
            if (endpoint.supportsInputCluster('genBasic')) {
                for (const key in Device.ReportablePropertiesMapping) {
                    const item = Device.ReportablePropertiesMapping[key];

                    if (ignoreCache || !this[item.key]) {
                        try {
                            let result: KeyValue;

                            try {
                                result = await endpoint.read('genBasic', [key], {sendPolicy: 'immediate'});
                            } catch (error) {
                                // Reading attributes can fail for many reason, e.g. it could be that device rejoins
                                // while joining like in:
                                // https://github.com/Koenkk/zigbee-herdsman-converters/issues/2485.
                                // The modelID and manufacturerName are crucial for device identification, so retry.
                                if (item.key === 'modelID' || item.key === 'manufacturerName') {
                                    logger.debug(`Interview - first ${item.key} retrieval attempt failed, retrying after 10 seconds...`, NS);
                                    await wait(10000);
                                    result = await endpoint.read('genBasic', [key], {sendPolicy: 'immediate'});
                                } else {
                                    throw error;
                                }
                            }

                            item.set(result[key], this);
                            logger.debug(`Interview - got '${item.key}' for device '${this.ieeeAddr}'`, NS);
                        } catch (error) {
                            logger.debug(`Interview - failed to read attribute '${item.key}' from endpoint '${endpoint.ID}' (${error})`, NS);
                        }
                    }
                }
            }

            // Enroll IAS device
            if (endpoint.supportsInputCluster('ssIasZone')) {
                logger.debug(`Interview - IAS - enrolling '${this.ieeeAddr}' endpoint '${endpoint.ID}'`, NS);

                const stateBefore = await endpoint.read('ssIasZone', ['iasCieAddr', 'zoneState'], {sendPolicy: 'immediate'});
                logger.debug(`Interview - IAS - before enrolling state: '${JSON.stringify(stateBefore)}'`, NS);

                // Do not enroll when device has already been enrolled
                if (stateBefore.zoneState !== 1 || stateBefore.iasCieAddr !== coordinator.ieeeAddr) {
                    logger.debug(`Interview - IAS - not enrolled, enrolling`, NS);

                    await endpoint.write('ssIasZone', {iasCieAddr: coordinator.ieeeAddr}, {sendPolicy: 'immediate'});
                    logger.debug(`Interview - IAS - wrote iasCieAddr`, NS);

                    // There are 2 enrollment procedures:
                    // - Auto enroll: coordinator has to send enrollResponse without receiving an enroll request
                    //                this case is handled below.
                    // - Manual enroll: coordinator replies to enroll request with an enroll response.
                    //                  this case in hanled in onZclData().
                    // https://github.com/Koenkk/zigbee2mqtt/issues/4569#issuecomment-706075676
                    await wait(500);
                    logger.debug(`IAS - '${this.ieeeAddr}' sending enroll response (auto enroll)`, NS);
                    const payload = {enrollrspcode: 0, zoneid: 23};
                    await endpoint.command('ssIasZone', 'enrollRsp', payload, {disableDefaultResponse: true, sendPolicy: 'immediate'});

                    let enrolled = false;
                    for (let attempt = 0; attempt < 20; attempt++) {
                        await wait(500);
                        const stateAfter = await endpoint.read('ssIasZone', ['iasCieAddr', 'zoneState'], {sendPolicy: 'immediate'});
                        logger.debug(`Interview - IAS - after enrolling state (${attempt}): '${JSON.stringify(stateAfter)}'`, NS);
                        if (stateAfter.zoneState === 1) {
                            enrolled = true;
                            break;
                        }
                    }

                    if (enrolled) {
                        logger.debug(`Interview - IAS successfully enrolled '${this.ieeeAddr}' endpoint '${endpoint.ID}'`, NS);
                    } else {
                        throw new Error(`Interview failed because of failed IAS enroll (zoneState didn't change ('${this.ieeeAddr}')`);
                    }
                } else {
                    logger.debug(`Interview - IAS - already enrolled, skipping enroll`, NS);
                }
            }
        }

        // Bind poll control
        try {
            for (const endpoint of this.endpoints.filter((e): boolean => e.supportsInputCluster('genPollCtrl'))) {
                logger.debug(`Interview - Poll control - binding '${this.ieeeAddr}' endpoint '${endpoint.ID}'`, NS);
                await endpoint.bind('genPollCtrl', coordinator.endpoints[0]);
                const pollPeriod = await endpoint.read('genPollCtrl', ['checkinInterval'], {sendPolicy: 'immediate'});
                this._checkinInterval = pollPeriod.checkinInterval / 4; // convert to seconds
                this.resetPendingRequestTimeout();
            }
            /* v8 ignore start */
        } catch (error) {
            logger.debug(`Interview - failed to bind genPollCtrl (${error})`, NS);
        }
        /* v8 ignore stop */
    }

    public async updateNodeDescriptor(): Promise<void> {
        const clusterId = Zdo.ClusterId.NODE_DESCRIPTOR_REQUEST;
        const zdoPayload = Zdo.Buffalo.buildRequest(Entity.adapter!.hasZdoMessageOverhead, clusterId, this.networkAddress);
        const response = await Entity.adapter!.sendZdo(this.ieeeAddr, this.networkAddress, clusterId, zdoPayload, false);

        if (!Zdo.Buffalo.checkStatus(response)) {
            throw new Zdo.StatusError(response[0]);
        }

        // TODO: make use of: capabilities.rxOnWhenIdle, maxIncTxSize, maxOutTxSize, serverMask.stackComplianceRevision
        const nodeDescriptor = response[1];
        this._manufacturerID = nodeDescriptor.manufacturerCode;

        switch (nodeDescriptor.logicalType) {
            case 0x0:
                this._type = 'Coordinator';
                break;
            case 0x1:
                this._type = 'Router';
                break;
            case 0x2:
                this._type = 'EndDevice';
                break;
        }

        logger.debug(`Interview - got node descriptor for device '${this.ieeeAddr}'`, NS);

        // TODO: define a property on Device for this value (would be good to have it displayed)
        // log for devices older than 1 from current revision
        if (nodeDescriptor.serverMask.stackComplianceRevision < ZSpec.ZIGBEE_REVISION - 1) {
            // always 0 before revision 21 where field was added
            const rev = nodeDescriptor.serverMask.stackComplianceRevision < 21 ? 'pre-21' : nodeDescriptor.serverMask.stackComplianceRevision;

            logger.info(
                `Device '${this.ieeeAddr}' is only compliant to revision '${rev}' of the ZigBee specification (current revision: ${ZSpec.ZIGBEE_REVISION}).`,
                NS,
            );
        }
    }

    public async updateActiveEndpoints(): Promise<void> {
        const clusterId = Zdo.ClusterId.ACTIVE_ENDPOINTS_REQUEST;
        const zdoPayload = Zdo.Buffalo.buildRequest(Entity.adapter!.hasZdoMessageOverhead, clusterId, this.networkAddress);

        const response = await Entity.adapter!.sendZdo(this.ieeeAddr, this.networkAddress, clusterId, zdoPayload, false);

        if (!Zdo.Buffalo.checkStatus(response)) {
            throw new Zdo.StatusError(response[0]);
        }

        const activeEndpoints = response[1];

        // Make sure that the endpoint are sorted.
        activeEndpoints.endpointList.sort((a, b) => a - b);
        for (const endpoint of activeEndpoints.endpointList) {
            // Some devices, e.g. TERNCY return endpoint 0 in the active endpoints request.
            // This is not a valid endpoint number according to the ZCL, requesting a simple descriptor will result
            // into an error. Therefore we filter it, more info: https://github.com/Koenkk/zigbee-herdsman/issues/82
            if (endpoint !== 0 && !this.getEndpoint(endpoint)) {
                this._endpoints.push(Endpoint.create(endpoint, undefined, undefined, [], [], this.networkAddress, this.ieeeAddr));
            }
        }

        // Remove disappeared endpoints (can happen with e.g. custom devices).
        this._endpoints = this._endpoints.filter((e) => activeEndpoints.endpointList.includes(e.ID));
    }

    /**
     * Request device to advertise its network address.
     * Note: This does not actually update the device property (if needed), as this is already done with `zdoResponse` event in Controller.
     */
    public async requestNetworkAddress(): Promise<void> {
        const clusterId = Zdo.ClusterId.NETWORK_ADDRESS_REQUEST;
        const zdoPayload = Zdo.Buffalo.buildRequest(Entity.adapter!.hasZdoMessageOverhead, clusterId, this.ieeeAddr as EUI64, false, 0);

        await Entity.adapter!.sendZdo(this.ieeeAddr, ZSpec.BroadcastAddress.RX_ON_WHEN_IDLE, clusterId, zdoPayload, true);
    }

    public async removeFromNetwork(): Promise<void> {
        if (this._type === 'GreenPower') {
            const payload = {
                options: 0x002550,
                srcID: Number(this.ieeeAddr),
            };
            const frame = Zcl.Frame.create(
                Zcl.FrameType.SPECIFIC,
                Zcl.Direction.SERVER_TO_CLIENT,
                true,
                undefined,
                ZclTransactionSequenceNumber.next(),
                'pairing',
                33,
                payload,
                this.customClusters,
            );

            await Entity.adapter!.sendZclFrameToAll(242, frame, 242, BroadcastAddress.RX_ON_WHEN_IDLE);
        } else {
            const clusterId = Zdo.ClusterId.LEAVE_REQUEST;
            const zdoPayload = Zdo.Buffalo.buildRequest(
                Entity.adapter!.hasZdoMessageOverhead,
                clusterId,
                this.ieeeAddr as EUI64,
                Zdo.LeaveRequestFlags.WITHOUT_REJOIN,
            );
            const response = await Entity.adapter!.sendZdo(this.ieeeAddr, this.networkAddress, clusterId, zdoPayload, false);

            if (!Zdo.Buffalo.checkStatus(response)) {
                throw new Zdo.StatusError(response[0]);
            }
        }

        this.removeFromDatabase();
    }

    public removeFromDatabase(): void {
        Device.loadFromDatabaseIfNecessary();

        for (const endpoint of this.endpoints) {
            endpoint.removeFromAllGroupsDatabase();
        }

        if (Entity.database!.has(this.ID)) {
            Entity.database!.remove(this.ID);
        }

        Device.deletedDevices.set(this.ieeeAddr, this);
        Device.devices.delete(this.ieeeAddr);

        // Clear all data in case device joins again
        this._interviewCompleted = false;
        this._interviewing = false;
        this.meta = {};
        const newEndpoints: Endpoint[] = [];
        for (const endpoint of this.endpoints) {
            newEndpoints.push(
                Endpoint.create(
                    endpoint.ID,
                    endpoint.profileID,
                    endpoint.deviceID,
                    endpoint.inputClusters,
                    endpoint.outputClusters,
                    this.networkAddress,
                    this.ieeeAddr,
                ),
            );
        }
        this._endpoints = newEndpoints;
    }

    public async lqi(): Promise<LQI> {
        const clusterId = Zdo.ClusterId.LQI_TABLE_REQUEST;
        // TODO return Zdo.LQITableEntry directly (requires updates in other repos)
        const neighbors: LQINeighbor[] = [];
        const request = async (startIndex: number): Promise<[tableEntries: number, entryCount: number]> => {
            const zdoPayload = Zdo.Buffalo.buildRequest(Entity.adapter!.hasZdoMessageOverhead, clusterId, startIndex);
            const response = await Entity.adapter!.sendZdo(this.ieeeAddr, this.networkAddress, clusterId, zdoPayload, false);

            if (!Zdo.Buffalo.checkStatus(response)) {
                throw new Zdo.StatusError(response[0]);
            }

            const result = response[1];

            for (const entry of result.entryList) {
                neighbors.push({
                    ieeeAddr: entry.eui64,
                    networkAddress: entry.nwkAddress,
                    linkquality: entry.lqi,
                    relationship: entry.relationship,
                    depth: entry.depth,
                });
            }

            return [result.neighborTableEntries, result.entryList.length];
        };

        let [tableEntries, entryCount] = await request(0);

        const size = tableEntries;
        let nextStartIndex = entryCount;

        while (neighbors.length < size) {
            [tableEntries, entryCount] = await request(nextStartIndex);

            nextStartIndex += entryCount;
        }

        return {neighbors};
    }

    public async routingTable(): Promise<RoutingTable> {
        const clusterId = Zdo.ClusterId.ROUTING_TABLE_REQUEST;
        // TODO return Zdo.RoutingTableEntry directly (requires updates in other repos)
        const table: RoutingTableEntry[] = [];
        const request = async (startIndex: number): Promise<[tableEntries: number, entryCount: number]> => {
            const zdoPayload = Zdo.Buffalo.buildRequest(Entity.adapter!.hasZdoMessageOverhead, clusterId, startIndex);
            const response = await Entity.adapter!.sendZdo(this.ieeeAddr, this.networkAddress, clusterId, zdoPayload, false);

            if (!Zdo.Buffalo.checkStatus(response)) {
                throw new Zdo.StatusError(response[0]);
            }

            const result = response[1];

            for (const entry of result.entryList) {
                table.push({
                    destinationAddress: entry.destinationAddress,
                    status: entry.status,
                    nextHop: entry.nextHopAddress,
                });
            }

            return [result.routingTableEntries, result.entryList.length];
        };

        let [tableEntries, entryCount] = await request(0);

        const size = tableEntries;
        let nextStartIndex = entryCount;

        while (table.length < size) {
            [tableEntries, entryCount] = await request(nextStartIndex);

            nextStartIndex += entryCount;
        }

        return {table};
    }

    public async ping(disableRecovery = true): Promise<void> {
        // Zigbee does not have an official pinging mechanism. Use a read request
        // of a mandatory basic cluster attribute to keep it as lightweight as
        // possible.
        const endpoint = this.endpoints.find((ep) => ep.inputClusters.includes(0)) ?? this.endpoints[0];
        await endpoint.read('genBasic', ['zclVersion'], {disableRecovery});
    }

    public addCustomCluster(name: string, cluster: ClusterDefinition): void {
        assert(
            ![Zcl.Clusters.touchlink.ID, Zcl.Clusters.greenPower.ID].includes(cluster.ID),
            'Overriding of greenPower or touchlink cluster is not supported',
        );
        if (Zcl.Utils.isClusterName(name)) {
            const existingCluster = Zcl.Clusters[name];

            // Extend existing cluster
            assert(existingCluster.ID === cluster.ID, `Custom cluster ID (${cluster.ID}) should match existing cluster ID (${existingCluster.ID})`);
            cluster = {
                ID: cluster.ID,
                manufacturerCode: cluster.manufacturerCode,
                attributes: {...existingCluster.attributes, ...cluster.attributes},
                commands: {...existingCluster.commands, ...cluster.commands},
                commandsResponse: {...existingCluster.commandsResponse, ...cluster.commandsResponse},
            };
        }
        this._customClusters[name] = cluster;
    }
}

export default Device;
