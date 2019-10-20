import {KeyValue, DatabaseEntry, DeviceType} from '../tstype';
import {TsType as AdapterTsType} from '../../adapter';
import Endpoint from './endpoint';
import Entity from './entity';
import {ArraySplitChunks, Wait} from '../../utils';
import Debug from "debug";
import * as Zcl from '../../zcl';

const debug = Debug('zigbee-herdsman:controller:device');

interface LQI {
    neighbors: {
        ieeeAddr: string; networkAddress: number; linkquality: number;
        relationship: number; depth: number;
    }[];
}

interface RoutingTable {
    table: {destinationAddress: number; status: string; nextHop: number}[];
}

class Device extends Entity {
    private readonly ID: number;
    private _applicationVersion?: number;
    private _dateCode?: string;
    private _endpoints: Endpoint[];
    private _hardwareVersion?: number;
    public readonly ieeeAddr: string;
    private _interviewCompleted: boolean;
    private _interviewing: boolean;
    private _lastSeen: number;
    private _manufacturerID?: number;
    private _manufacturerName?: string;
    private _modelID?: string;
    private _networkAddress: number;
    private _powerSource?: string;
    private _softwareBuildID?: string;
    private _stackVersion?: number;
    private _type?: DeviceType;
    private _zclVersion?: number;

    // Getters/setters
    get applicationVersion(): number {return this._applicationVersion;}
    set applicationVersion(applicationVersion) {this._applicationVersion = applicationVersion;}
    get endpoints(): Endpoint[] {return this._endpoints;}
    get interviewCompleted(): boolean {return this._interviewCompleted;}
    get interviewing(): boolean {return this._interviewing;}
    get lastSeen(): number {return this._lastSeen;}
    get manufacturerID(): number {return this._manufacturerID;}
    get type(): DeviceType {return this._type;}
    get dateCode(): string {return this._dateCode;}
    set dateCode(dateCode) {this._dateCode = dateCode;}
    set hardwareVersion(hardwareVersion) {this._hardwareVersion = hardwareVersion;}
    get hardwareVersion(): number {return this._hardwareVersion;}
    get manufacturerName(): string {return this._manufacturerName;}
    set manufacturerName(manufacturerName) {this._manufacturerName = manufacturerName;}
    set modelID(modelID) {this._modelID = modelID;}
    get modelID(): string {return this._modelID;}
    get networkAddress(): number {return this._networkAddress;}
    set networkAddress(networkAddress) {this._networkAddress = networkAddress;}
    get powerSource(): string {return this._powerSource;}
    set powerSource(powerSource) {
        this._powerSource = typeof powerSource === 'number' ? Zcl.PowerSource[powerSource] : powerSource;
    }
    get softwareBuildID(): string {return this._softwareBuildID;}
    set softwareBuildID(softwareBuildID) {this._softwareBuildID = softwareBuildID;}
    get stackVersion(): number {return this._stackVersion;}
    set stackVersion(stackVersion) {this._stackVersion = stackVersion;}
    get zclVersion(): number {return this._zclVersion;}
    set zclVersion(zclVersion) {this._zclVersion = zclVersion;}

    private meta: KeyValue;

    // This lookup contains all devices that are queried from the database, this is to ensure that always
    // the same instance is returned.
    private static devices: {[ieeeAddr: string]: Device} = null;

    public static readonly ReportablePropertiesMapping: {[s: string]: {
        set: (value: string | number, device: Device) => void;
        key: 'modelID' | 'manufacturerName' | 'applicationVersion' | 'zclVersion' | 'powerSource' | 'stackVersion' |
            'dateCode' | 'softwareBuildID' | 'hardwareVersion';
    };} = {
        modelId: {key: 'modelID', set: (v: string, d: Device): void => {d.modelID = v;}},
        manufacturerName: {key: 'manufacturerName', set: (v: string, d: Device): void => {d.manufacturerName = v;}},
        powerSource: {key: 'powerSource', set: (v: string, d: Device): void => {d.powerSource = v;}},
        zclVersion: {key: 'zclVersion', set: (v: number, d: Device): void => {d.zclVersion = v;}},
        appVersion: {key: 'applicationVersion', set: (v: number, d: Device): void => {d.applicationVersion = v;}},
        stackVersion: {key: 'stackVersion', set: (v: number, d: Device): void => {d.stackVersion = v;}},
        hwVersion: {key: 'hardwareVersion', set: (v: number, d: Device): void => {d.hardwareVersion = v;}},
        dateCode: {key: 'dateCode', set: (v: string, d: Device): void => {d.dateCode = v;}},
        swBuildId: {key: 'softwareBuildID', set: (v: string, d: Device): void => {d.softwareBuildID = v;}},
    };

    private constructor(
        ID: number, type: DeviceType, ieeeAddr: string, networkAddress: number,
        manufacturerID: number, endpoints: Endpoint[], manufacturerName: string,
        powerSource: string, modelID: string, applicationVersion: number, stackVersion: number, zclVersion: number,
        hardwareVersion: number, dateCode: string, softwareBuildID: string, interviewCompleted: boolean, meta: KeyValue,
    ) {
        super();
        this.ID = ID;
        this._type = type;
        this.ieeeAddr = ieeeAddr;
        this._networkAddress = networkAddress;
        this._manufacturerID = manufacturerID;
        this._endpoints = endpoints;
        this._manufacturerName = manufacturerName;
        this._powerSource = powerSource;
        this._modelID = modelID;
        this._applicationVersion = applicationVersion;
        this._stackVersion = stackVersion;
        this._zclVersion = zclVersion;
        this.hardwareVersion = hardwareVersion;
        this._dateCode = dateCode;
        this._softwareBuildID = softwareBuildID;
        this._interviewCompleted = interviewCompleted;
        this._interviewing = false;
        this.meta = meta;
        this._lastSeen = null;
    }

    public async createEndpoint(ID: number): Promise<Endpoint> {
        if (this.getEndpoint(ID)) {
            throw new Error(`Device '${this.ieeeAddr}' already has an endpoint '${ID}'`);
        }

        const endpoint = Endpoint.create(ID, undefined, undefined, [], [], this.networkAddress, this.ieeeAddr);
        this.endpoints.push(endpoint);
        this.save();
        return endpoint;
    }

    public getEndpoint(ID: number): Endpoint {
        return this.endpoints.find((e): boolean => e.ID === ID);
    }

    public updateLastSeen(): void {
        this._lastSeen = Date.now();
    }

    /*
     * CRUD
     */

    private static fromDatabaseEntry(entry: DatabaseEntry): Device {
        const networkAddress = entry.nwkAddr;
        const ieeeAddr = entry.ieeeAddr;
        const endpoints = Object.values(entry.endpoints).map((e): Endpoint => {
            return Endpoint.fromDatabaseRecord(e, networkAddress, ieeeAddr);
        });

        const meta = entry.meta ? entry.meta : {};

        if (entry.type === 'Group') {
            throw new Error('Cannot load device from group');
        }

        return new Device(
            entry.id, entry.type, ieeeAddr, networkAddress, entry.manufId, endpoints,
            entry.manufName, entry.powerSource, entry.modelId, entry.appVersion,
            entry.stackVersion, entry.zclVersion, entry.hwVersion, entry.dateCode, entry.swBuildId,
            entry.interviewCompleted, meta,
        );
    }

    private toDatabaseEntry(): DatabaseEntry {
        const epList = this.endpoints.map((e): number => e.ID);
        const endpoints: KeyValue = {};
        for (const endpoint of this.endpoints) {
            endpoints[endpoint.ID] = endpoint.toDatabaseRecord();
        }

        return {
            id: this.ID, type: this.type, ieeeAddr: this.ieeeAddr, nwkAddr: this.networkAddress,
            manufId: this.manufacturerID, manufName: this.manufacturerName, powerSource: this.powerSource,
            modelId: this.modelID, epList, endpoints, appVersion: this.applicationVersion,
            stackVersion: this.stackVersion, hwVersion: this.hardwareVersion, dateCode: this.dateCode,
            swBuildId: this.softwareBuildID, zclVersion: this.zclVersion, interviewCompleted: this.interviewCompleted,
            meta: this.meta,
        };
    }

    public save(): void {
        Entity.database.update(this.toDatabaseEntry());
    }

    private static loadFromDatabaseIfNecessary(): void {
        if (!Device.devices) {
            Device.devices = {};
            const entries = Entity.database.getEntries(['Coordinator', 'EndDevice', 'Router']);
            for (const entry of entries) {
                const device = Device.fromDatabaseEntry(entry);
                Device.devices[device.ieeeAddr] = device;
            }
        }
    }

    public static byIeeeAddr(ieeeAddr: string): Device {
        Device.loadFromDatabaseIfNecessary();
        return Device.devices[ieeeAddr];
    }

    public static byNetworkAddress(networkAddress: number): Device {
        Device.loadFromDatabaseIfNecessary();
        return Object.values(Device.devices).find(d => d.networkAddress === networkAddress);
    }

    public static byType(type: DeviceType): Device[] {
        Device.loadFromDatabaseIfNecessary();
        return Object.values(Device.devices).filter(d => d.type === type);
    }

    public static all(): Device[] {
        Device.loadFromDatabaseIfNecessary();
        return Object.values(Device.devices);
    }

    public static create(
        type: AdapterTsType.DeviceType, ieeeAddr: string, networkAddress: number,
        manufacturerID: number, manufacturerName: string,
        powerSource: string, modelID: string,
        endpoints: {
            ID: number; profileID: number; deviceID: number; inputClusters: number[]; outputClusters: number[];
        }[]
    ): Device {
        Device.loadFromDatabaseIfNecessary();
        if (Device.devices[ieeeAddr]) {
            throw new Error(`Device with ieeeAddr '${ieeeAddr}' already exists`);
        }

        const endpointsMapped = endpoints.map((e): Endpoint => {
            return Endpoint.create(
                e.ID, e.profileID, e.deviceID, e.inputClusters, e.outputClusters, networkAddress, ieeeAddr
            );
        });

        const ID = Entity.database.newID();
        const device = new Device(
            ID, type, ieeeAddr, networkAddress, manufacturerID, endpointsMapped, manufacturerName,
            powerSource, modelID, undefined, undefined, undefined, undefined, undefined, undefined, false, {},
        );

        Entity.database.insert(device.toDatabaseEntry());
        Device.devices[device.ieeeAddr] = device;
        return device;
    }

    /*
     * Zigbee functions
     */

    public async interview(): Promise<void> {
        if (this.interviewing) {
            const message = `Interview - interview already in progress for '${this.ieeeAddr}'`;
            debug(message);
            throw new Error(message);
        }

        let error;
        this._interviewing = true;
        debug(`Interview - start device '${this.ieeeAddr}'`);

        try {
            await this.interviewInternal();
            debug(`Interview - completed for device '${this.ieeeAddr}'`);
            this._interviewCompleted = true;
        } catch (e) {
            // Xiaomi end devices have a different interview procedure, after pairing they report it's
            // modelID trough a readResponse. The readResponse is received by the controller and set on the device
            // Check if we have a modelID starting with lumi.* at this point, indicating a Xiaomi end device.
            if (this.modelID && this.modelID.startsWith('lumi.')) {
                debug('Interview procedure failed but got modelID starting with lumi, assuming Xiaomi end device');
                this._type = 'EndDevice';
                this._manufacturerID = 4151;
                this._manufacturerName = 'LUMI';
                this._powerSource = 'Battery';
                this._interviewing = false;
                this._interviewCompleted = true;
                this.save();
            } else {
                debug(`Interview - failed for device '${this.ieeeAddr}' with error '${e.stack}'`);
                error = e;
            }
        } finally {
            this._interviewing = false;
            this.save();
        }

        if (error) {
            throw error;
        }
    }

    private async interviewInternal(): Promise<void> {
        const nodeDescriptorQuery = async (): Promise<void> => {
            const nodeDescriptor = await Entity.adapter.nodeDescriptor(this.networkAddress);
            this._manufacturerID = nodeDescriptor.manufacturerCode;
            this._type = nodeDescriptor.type;
            this.save();
            debug(`Interview - got node descriptor for device '${this.ieeeAddr}'`);
        };

        try {
            await nodeDescriptorQuery();
        } catch (error) {
            // Most of the times the first node descriptor query fails and the seconds one succeeds.
            debug(`Interview - first node descriptor request failed for '${this.ieeeAddr}', retrying...`);
            await nodeDescriptorQuery();
        }

        const activeEndpoints = await Entity.adapter.activeEndpoints(this.networkAddress);
        this._endpoints = activeEndpoints.endpoints.map((e): Endpoint => {
            return Endpoint.create(e, undefined, undefined, [], [], this.networkAddress, this.ieeeAddr);
        });
        this.save();
        debug(`Interview - got active endpoints for device '${this.ieeeAddr}'`);

        for (const endpoint of this.endpoints) {
            const simpleDescriptor = await Entity.adapter.simpleDescriptor(this.networkAddress, endpoint.ID);
            endpoint.profileID = simpleDescriptor.profileID;
            endpoint.deviceID = simpleDescriptor.deviceID;
            endpoint.inputClusters = simpleDescriptor.inputClusters;
            endpoint.outputClusters = simpleDescriptor.outputClusters;
            debug(`Interview - got simple descriptor for endpoint '${endpoint.ID}' device '${this.ieeeAddr}'`);
            this.save();
        }

        if (this.endpoints.length !== 0) {
            const endpoint = this.endpoints[0];

            // Split into chunks of 3, otherwise some devices fail to respond.
            for (const chunk of ArraySplitChunks(Object.keys(Device.ReportablePropertiesMapping), 3)) {
                const result = await endpoint.read('genBasic', chunk);
                for (const [key, value] of Object.entries(result)) {
                    Device.ReportablePropertiesMapping[key].set(value, this);
                }

                debug(`Interview - got '${chunk}' for device '${this.ieeeAddr}'`);
                this.save();
            }
        } else {
            debug(`Interview - skip reading attributes because of no endpoint for device '${this.ieeeAddr}'`);
            throw new Error(`Interview failed because of not endpiont ('${this.ieeeAddr}')`);
        }

        // Enroll IAS device
        for (const endpoint of this.endpoints.filter((e): boolean => e.supportsInputCluster('ssIasZone'))) {
            debug(`Interview - ssIasZone enrolling '${this.ieeeAddr}' endpoint '${endpoint.ID}'`);
            const coordinator = Device.byType('Coordinator')[0];
            await endpoint.write('ssIasZone', {'iasCieAddr': coordinator.ieeeAddr});
            // According to the spec, we should wait for an enrollRequest here, but the Bosch ISW-ZPR1 didn't send it.
            await Wait(3000);
            await endpoint.command('ssIasZone', 'enrollRsp', {enrollrspcode: 0, zoneid: 23});
            debug(`Interview - successfully enrolled '${this.ieeeAddr}' endpoint '${endpoint.ID}'`);
        }
    }

    public async removeFromNetwork(): Promise<void> {
        await Entity.adapter.removeDevice(this.networkAddress, this.ieeeAddr);
        await this.removeFromDatabase();
    }

    public async removeFromDatabase(): Promise<void> {
        Device.loadFromDatabaseIfNecessary();
        Entity.database.remove(this.ID);
        delete Device.devices[this.ieeeAddr];
    }

    public async lqi(): Promise<LQI> {
        return Entity.adapter.lqi(this.networkAddress);
    }

    public async routingTable(): Promise<RoutingTable> {
        return Entity.adapter.routingTable(this.networkAddress);
    }

    public async ping(): Promise<void> {
        // Zigbee does not have an official pining mechamism. Use a read request
        // of a mandatory basic cluster attribute to keep it as lightweight as
        // possible.
        await this.endpoints[0].read('genBasic', ['zclVersion']);
    }
}

export default Device;
