import {KeyValue, DatabaseEntry, DeviceType} from '../tstype';
import {TsType as AdapterTsType} from '../../adapter';
import Endpoint from './endpoint';
import Entity from './entity';
import {ArraySplitChunks, Wait} from '../../utils';
import * as Zcl from '../../zcl';
import Debug from "debug";

const debug = Debug('zigbee-herdsman:controller:device');

type DeviceProperties =
    'manufacturerName' | 'powerSource' | 'zclVersion' | 'applicationVersion' | 'stackVersion' |
    'hardwareVersion' | 'dateCode' | 'softwareBuildID' | 'modelID' | 'networkAddress' | 'ieeeAddr' |
    'interviewCompleted' | 'interviewing';

interface LQI {
    neighbors: {
        ieeeAddr: string; networkAddress: number; linkquality: number;
        relationship: number; depth: number;
    }[];
}

interface RoutingTable {
    table: {destinationAddress: number; status: string; nextHop: number}[];
}

/**
 * @class Device
 */
class Device extends Entity {
    private ID: number;
    private ieeeAddr: string;
    private networkAddress: number;
    private endpoints: Endpoint[];
    private type?: DeviceType;
    private manufacturerID?: number;
    private manufacturerName?: string;
    private powerSource?: string;
    private modelID?: string;
    private applicationVersion?: number;
    private stackVersion?: number;
    private zclVersion?: number;
    private hardwareVersion?: number;
    private dateCode?: string;
    private softwareBuildID?: string;
    private lastSeen: number;

    private interviewCompleted: boolean;
    private interviewing: boolean;

    private meta: KeyValue;

    // This lookup contains all devices that are queried from the database, this is to ensure that always
    // the same instance is returned.
    private static devices: {[ieeeAddr: string]: Device} = null;

    public static readonly ReportablePropertiesMapping: {[s: string]: DeviceProperties} = {
        modelId: 'modelID',
        manufacturerName: 'manufacturerName',
        powerSource: 'powerSource',
        zclVersion: 'zclVersion',
        appVersion: 'applicationVersion',
        stackVersion: 'stackVersion',
        hwVersion: 'hardwareVersion',
        dateCode: 'dateCode',
        swBuildId: 'softwareBuildID',
    };

    private constructor(
        ID: number, type: DeviceType, ieeeAddr: string, networkAddress: number,
        manufacturerID: number, endpoints: Endpoint[], manufacturerName: string,
        powerSource: string, modelID: string, applicationVersion: number, stackVersion: number, zclVersion: number,
        hardwareVersion: number, dateCode: string, softwareBuildID: string, interviewCompleted: boolean, meta: KeyValue,
    ) {
        super();
        /** @property {number} Device#ID */
        this.ID = ID;
        /** @property {DeviceType} [Device#type] */
        this.type = type;
        /** @property {string} Device#ieeeAddr */
        this.ieeeAddr = ieeeAddr;
        /** @property {number} Device#networkAddress */
        this.networkAddress = networkAddress;
        /** @property {number} [Device#manufacturerID] */
        this.manufacturerID = manufacturerID;
        /** @property {Endpoint[]} Device#endpoints */
        this.endpoints = endpoints;
        /** @property {string} [Device#manufacturerName] */
        this.manufacturerName = manufacturerName;
        /** @property {string} [Device#powerSource] */
        this.powerSource = powerSource;
        /** @property {string} [Device#modelID] */
        this.modelID = modelID;
        /** @property {number} [Device#applicationVersion] */
        this.applicationVersion = applicationVersion;
        /** @property {number} [Device#stackVersion] */
        this.stackVersion = stackVersion;
        /** @property {number} [Device#zclVersion] */
        this.zclVersion = zclVersion;
        /** @property {number} [Device#hardwareVersion] */
        this.hardwareVersion = hardwareVersion;
        /** @property {string} [Device#dateCode] */
        this.dateCode = dateCode;
        /** @property {string} [Device#softwareBuildID] */
        this.softwareBuildID = softwareBuildID;
        /** @property {boolean} Device#interviewCompleted*/
        this.interviewCompleted = interviewCompleted;
        /** @property {boolean} Device#interviewing */
        this.interviewing = false;
        /** @property {Object} Device#meta - Can be used by applications to store data */
        this.meta = meta;
        /** @property {null|number} Device#lastSeen*/
        this.lastSeen = null;
    }

    /*
     * Getters, setters and creaters
     */

    /**
     * @param {number} ID
     * @returns {Promise}
     * @fulfil {Endpoint}
     */
    public async createEndpoint(ID: number): Promise<Endpoint> {
        if (this.getEndpoint(ID)) {
            throw new Error(`Device '${this.ieeeAddr}' already has an endpoint '${ID}'`);
        }

        const endpoint = Endpoint.create(ID, undefined, undefined, [], [], this.networkAddress, this.ieeeAddr);
        this.endpoints.push(endpoint);
        this.save();
        return endpoint;
    }

    /**
     * @returns {Endpoint[]}
     */
    public getEndpoints(): Endpoint[] {
        return this.endpoints;
    }

    /**
     * @param {number} ID
     * @returns {Endpoint}
     */
    public getEndpoint(ID: number): Endpoint {
        return this.endpoints.find((e): boolean => e.ID === ID);
    }

    /**
     * @param {DeviceProperties} key
     * @returns {string|number|boolean}
     */
    public get(key: DeviceProperties): string | number | boolean {
        return this[key];
    }

    /**
     * @param {DeviceProperties} key
     * @param {string|number} value
     * @param {boolean?} save Wether to write the new value immediately to the databse.
     * @returns {Promise}
     */
    public async set(key: DeviceProperties, value: string | number, save=true): Promise<void> {
        if (typeof value === 'number' && key === 'powerSource') {
            value = Zcl.PowerSource[value];
        }

        if (typeof value === 'string' && (key === 'manufacturerName' || key === 'powerSource' || key === 'dateCode' ||
            key === 'softwareBuildID' || key === 'modelID')) {
            this[key] = value;
        } else {
            /* istanbul ignore else */
            if (typeof value === 'number' && (key === 'networkAddress' || key === 'zclVersion' ||
                key === 'applicationVersion' || key === 'stackVersion' || key === 'hardwareVersion')) {
                this[key] = value;
            }
        }

        if (save) {
            this.save();
        }
    }

    public updateLastSeen(): void {
        this.lastSeen = Date.now();
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

    /**
     * @param {string} ieeeAddr
     * @returns {Device}
     */
    public static byIeeeAddr(ieeeAddr: string): Device {
        Device.loadFromDatabaseIfNecessary();
        return Device.devices[ieeeAddr];
    }

    /**
     * @param {number} networkAddress
     * @returns {Device}
     */
    public static byNetworkAddress(networkAddress: number): Device {
        Device.loadFromDatabaseIfNecessary();
        return Object.values(Device.devices).find(d => d.networkAddress === networkAddress);
    }

    /**
     * @param {DeviceType} type
     * @returns {Device}
     */
    public static byType(type: DeviceType): Device[] {
        Device.loadFromDatabaseIfNecessary();
        return Object.values(Device.devices).filter(d => d.type === type);
    }

    /**
     * @returns {Device[]}
     */
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
        this.interviewing = true;
        debug(`Interview - start device '${this.ieeeAddr}'`);

        try {
            await this.interviewInternal();
            debug(`Interview - completed for device '${this.ieeeAddr}'`);
            this.interviewCompleted = true;
        } catch (e) {
            error = e;
        } finally {
            this.interviewing = false;
            this.save();
        }

        if (error) {
            throw error;
        }
    }

    private async interviewInternal(): Promise<void> {
        const nodeDescriptorQuery = async (): Promise<void> => {
            const nodeDescriptor = await Entity.adapter.nodeDescriptor(this.networkAddress);
            this.manufacturerID = nodeDescriptor.manufacturerCode;
            this.type = nodeDescriptor.type;
            this.save();
            debug(`Interview - got node descriptor for device '${this.ieeeAddr}'`);
        };

        const isXiaomiAndInterviewCompleted = async (): Promise<boolean> => {
            // Xiaomi end devices have a different interview procedure, after pairing they report it's
            // modelID trough a readResponse. The readResponse is received by the controller and set on the device
            // Check if we have a modelID starting with lumi.* at this point, indicating a Xiaomi end device.
            if (this.modelID && this.modelID.startsWith('lumi.')) {
                debug(
                    'Node descriptor request failed for the second time, got modelID starting with lumi, ' +
                    'assuming Xiaomi end device'
                );
                this.type = 'EndDevice';
                this.manufacturerID = 4151;
                this.manufacturerName = 'LUMI';
                this.powerSource = 'Battery';
                this.interviewing = false;
                this.interviewCompleted = true;
                this.save();
                return true;
            } else {
                return false;
            }
        };

        try {
            await nodeDescriptorQuery();
        } catch (error1) {
            try {
                // Most of the times the first node descriptor query fails and the seconds one succeeds.
                debug(`Interview - first node descriptor request failed for '${this.ieeeAddr}', retrying...`);
                await nodeDescriptorQuery();
            } catch (error2) {
                if (await isXiaomiAndInterviewCompleted()) {
                    return;
                } else {
                    throw error2;
                }
            }
        }

        const activeEndpoints = await Entity.adapter.activeEndpoints(this.networkAddress);
        this.endpoints = activeEndpoints.endpoints.map((e): Endpoint => {
            return Endpoint.create(e, undefined, undefined, [], [], this.networkAddress, this.ieeeAddr);
        });
        this.save();
        debug(`Interview - got active endpoints for device '${this.ieeeAddr}'`);

        for (const endpoint of this.endpoints) {
            const simpleDescriptor = await Entity.adapter.simpleDescriptor(this.networkAddress, endpoint.ID);
            endpoint.set('profileID', simpleDescriptor.profileID);
            endpoint.set('deviceID', simpleDescriptor.deviceID);
            endpoint.set('inputClusters', simpleDescriptor.inputClusters);
            endpoint.set('outputClusters', simpleDescriptor.outputClusters);
            debug(`Interview - got simple descriptor for endpoint '${endpoint.ID}' device '${this.ieeeAddr}'`);
            this.save();
        }

        if (this.endpoints.length !== 0) {
            const endpoint = this.endpoints[0];

            // Split into chunks of 3, otherwise some devices fail to respond.
            for (const chunk of ArraySplitChunks(Object.keys(Device.ReportablePropertiesMapping), 3)) {
                const result = await endpoint.read('genBasic', chunk);
                for (const [key, value] of Object.entries(result)) {
                    await this.set(Device.ReportablePropertiesMapping[key], value, false);
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
            await endpoint.write('ssIasZone', {'iasCieAddr': coordinator.get('ieeeAddr')});
            // According to the spec, we should wait for an enrollRequest here, but the Bosch ISW-ZPR1 didn't send it.
            await Wait(3000);
            await endpoint.command('ssIasZone', 'enrollRsp', {enrollrspcode: 0, zoneid: 23});
            debug(`Interview - successfully enrolled '${this.ieeeAddr}' endpoint '${endpoint.ID}'`);
        }
    }

    /**
     * @returns {Promise}
     */
    public async removeFromNetwork(): Promise<void> {
        await Entity.adapter.removeDevice(this.networkAddress, this.ieeeAddr);
        await this.removeFromDatabase();
    }

    /**
     * @returns {Promise}
     */
    public async removeFromDatabase(): Promise<void> {
        Device.loadFromDatabaseIfNecessary();
        Entity.database.remove(this.ID);
        delete Device.devices[this.ieeeAddr];
    }

    /**
     * @returns {Promise}
     * @fulfil {TsType.LQI}
     */
    public async lqi(): Promise<LQI> {
        return Entity.adapter.lqi(this.networkAddress);
    }

    /**
     * @returns {Promise}
     * @fulfil {TsType.RoutingTable} - The Routing Table
     */
    public async routingTable(): Promise<RoutingTable> {
        return Entity.adapter.routingTable(this.networkAddress);
    }

    /**
     * @returns {Promise}
     */
    public async ping(): Promise<void> {
        // Zigbee does not have an official pining mechamism. Use a read request
        // of a mandatory basic cluster attribute to keep it as lightweight as
        // possible.
        await this.endpoints[0].read('genBasic', ['zclVersion']);
    }
}

export default Device;
