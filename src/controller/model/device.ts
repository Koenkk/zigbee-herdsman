import {KeyValue} from '../tstype';
import {TsType as AdapterTsType} from '../../adapter';
import Endpoint from './endpoint';
import Entity from './entity';
import {ArraySplitChunks, Wait} from '../../utils';
import * as Zcl from '../../zcl';
import Debug from "debug";

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

/**
 * @class Device
 */
class Device extends Entity {
    private ID: number;
    private ieeeAddr: string;
    private networkAddress: number;
    private endpoints: Endpoint[];
    private type?: AdapterTsType.DeviceType;
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
    private static lookup: {[ieeeAddr: string]: Device} = {};

    private constructor(
        ID: number, type: AdapterTsType.DeviceType, ieeeAddr: string, networkAddress: number,
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

    /**
     * @param {string} type
     * @returns {boolean} - true if type is 'device'
     */
    public isType(type: string): boolean {
        return type === 'device';
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
        await this.save();
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
     * @param {string} key - 'modelID' | 'networkAddress' | 'interviewCompleted' | 'ieeeAddr' | 'interviewing'
     * @returns {string|number|boolean}
     */
    public get(
        key: 'modelID' | 'networkAddress' | 'interviewCompleted' | 'ieeeAddr' | 'interviewing'
    ): string | number | boolean {
        return this[key];
    }

    /**
     * @param {string} key - 'modelID' | 'networkAddress'
     * @param {string|number} value
     * @returns {Promise}
     */
    public async set(key: 'modelID' | 'networkAddress', value: string | number): Promise<void> {
        if (typeof value === 'string' && (key === 'modelID')) {
            this[key] = value;
        } else {
            /* istanbul ignore else */
            if (typeof value === 'number' && (key === 'networkAddress')) {
                this[key] = value;
            }
        }

        await this.save();
    }

    public updateLastSeen(): void {
        this.lastSeen = Date.now();
    }

    /*
     * CRUD
     */

    private static fromDatabaseRecord(record: KeyValue): Device {
        const networkAddress = record.nwkAddr;
        const ieeeAddr = record.ieeeAddr;
        const endpoints = Object.values(record.endpoints).map((e): Endpoint => {
            return Endpoint.fromDatabaseRecord(e, networkAddress, ieeeAddr);
        });

        const meta = record.meta ? record.meta : {};
        return new Device(
            record.id, record.type, ieeeAddr, networkAddress, record.manufId, endpoints,
            record.manufName, record.powerSource, record.modelId, record.appVersion,
            record.stackVersion, record.zclVersion, record.hwVersion, record.dateCode, record.swBuildId,
            record.interviewCompleted, meta,
        );
    }

    private toDatabaseRecord(): KeyValue {
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

    private async save(): Promise<void> {
        await Entity.database.update(this.ID, this.toDatabaseRecord());
    }

    /**
     * @param {Object} query
     * @param {DeviceType} [query.type]
     * @param {string} [query.ieeeAddr]
     * @param {number} [query.networkAddress]
     * @returns {Promise}
     */
    public static async findSingle(
        query: {type?: AdapterTsType.DeviceType; ieeeAddr?: string; networkAddress?: number}
    ): Promise<Device> {
        // Performance optimization: when querying with only ieeeAddr, try to return from lookup
        const deviceIeeeAddr = Device.lookup[query.ieeeAddr];
        if (deviceIeeeAddr && !query.hasOwnProperty('networkAddress') && !query.hasOwnProperty('type'))
        {
            return deviceIeeeAddr;
        }

        // Performance optimization: when querying with only networkAddress, try to return from lookup
        const deviceNetworkAddress = Object.values(Device.lookup).find((d): boolean => {
            return d.networkAddress === query.networkAddress;
        });

        if (deviceNetworkAddress && !query.hasOwnProperty('ieeeAddr') && !query.hasOwnProperty('type'))
        {
            return deviceNetworkAddress;
        }

        const results = await this.find(query);
        return results.length !== 0 ? results[0] : null;
    }

    /**
     * @param {Object} query
     * @param {AdapterTsType.DeviceType} [query.type]
     * @param {string} [query.ieeeAddr]
     * @param {number} [query.networkAddress]
     * @returns {Promise}
     * @fulfil {Device}
     */
    public static async find(
        query: {type?: AdapterTsType.DeviceType; ieeeAddr?: string; networkAddress?: number}
    ): Promise<Device[]> {
        const queryActual: {type?: AdapterTsType.DeviceType; ieeeAddr?: string; nwkAddr?: number} = {};
        if (query.hasOwnProperty('networkAddress')) queryActual.nwkAddr = query.networkAddress;
        if (query.hasOwnProperty('ieeeAddr')) queryActual.ieeeAddr = query.ieeeAddr;

        const typeQuery: {type: {} | string} = {type: {$ne: 'Group'}};
        if (query.hasOwnProperty('type')) {
            typeQuery.type = query.type;
        }

        const results = await Entity.database.find({...queryActual, ...typeQuery});
        return results.map((r): Device => {
            const device = this.fromDatabaseRecord(r);
            if (!this.lookup[device.ieeeAddr]) {
                this.lookup[device.ieeeAddr] = device;
            }

            return this.lookup[device.ieeeAddr];
        });
    }

    public static async create(
        type: AdapterTsType.DeviceType, ieeeAddr: string, networkAddress: number,
        manufacturerID: number, manufacturerName: string,
        powerSource: string, modelID: string,
        endpoints: {
            ID: number; profileID: number; deviceID: number; inputClusters: number[]; outputClusters: number[];
        }[]
    ): Promise<Device> {
        if (await this.findSingle({ieeeAddr})) {
            throw new Error(`Device with ieeeAddr '${ieeeAddr}' already exists`);
        }

        const endpointsMapped = endpoints.map((e): Endpoint => {
            return Endpoint.create(
                e.ID, e.profileID, e.deviceID, e.inputClusters, e.outputClusters, networkAddress, ieeeAddr
            );
        });

        const ID = await Entity.database.newID();

        const device = new Device(
            ID, type, ieeeAddr, networkAddress, manufacturerID, endpointsMapped, manufacturerName,
            powerSource, modelID, undefined, undefined, undefined, undefined, undefined, undefined, false, {},
        );

        await Entity.database.insert(device.toDatabaseRecord());

        this.lookup[device.ieeeAddr] = device;
        return this.lookup[device.ieeeAddr];
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
            await this.save();
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
            await this.save();
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
                await this.save();
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
        await this.save();
        debug(`Interview - got active endpoints for device '${this.ieeeAddr}'`);

        for (const endpoint of this.endpoints) {
            const simpleDescriptor = await Entity.adapter.simpleDescriptor(this.networkAddress, endpoint.ID);
            endpoint.set('profileID', simpleDescriptor.profileID);
            endpoint.set('deviceID', simpleDescriptor.deviceID);
            endpoint.set('inputClusters', simpleDescriptor.inputClusters);
            endpoint.set('outputClusters', simpleDescriptor.outputClusters);
            debug(`Interview - got simple descriptor for endpoint '${endpoint.ID}' device '${this.ieeeAddr}'`);
            await this.save();
        }

        if (this.endpoints.length !== 0) {
            const endpoint = this.endpoints[0];
            const attributes = [
                'manufacturerName', 'modelId', 'powerSource', 'zclVersion', 'appVersion',
                'stackVersion', 'hwVersion', 'dateCode', 'swBuildId'
            ];

            // Split into chunks of 3, otherwise some devices fail to respond.
            for (const chunk of ArraySplitChunks(attributes, 3)) {
                const result = await endpoint.read('genBasic', chunk);
                for (const [key, value] of Object.entries(result)) {
                    if (key === 'manufacturerName') this.manufacturerName = value;
                    else if (key === 'modelId') this.modelID = value;
                    else if (key === 'zclVersion') this.zclVersion = value;
                    else if (key === 'appVersion') this.applicationVersion = value;
                    else if (key === 'stackVersion') this.stackVersion = value;
                    else if (key === 'hwVersion') this.hardwareVersion = value;
                    else if (key === 'dateCode') this.dateCode = value;
                    else if (key === 'swBuildId') this.softwareBuildID = value;
                    else {
                        /* istanbul ignore else */
                        if (key === 'powerSource') this.powerSource = Zcl.PowerSource[value];
                    }
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
            const coordinator = await Device.findSingle({type: 'Coordinator'});
            await endpoint.write('ssIasZone', {'iasCieAddr': coordinator.get('ieeeAddr')});
            // According to the spec, we should wait for an enrollRequest here, but the Bosch ISW-ZPR1 didn't send it.
            await Wait(3000);
            await endpoint.command('ssIasZone', 'enrollRsp', {enrollrspcode: 0, zoneid: 23});
            debug(`Interview - succesfully enrolled '${this.ieeeAddr}' endpoint '${endpoint.ID}'`);
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
        await Entity.database.remove(this.ID);
        delete Device.lookup[this.ieeeAddr];
    }

    /**
     * @returns {Promise}
     * @fulfil {TsType.LQI}
     */
    public async lqi(): Promise<LQI> {
        return await Entity.adapter.lqi(this.networkAddress);
    }

    /**
     * @returns {Promise}
     * @fulfil {TsType.RoutingTable} - The Routing Table
     */
    public async routingTable(): Promise<RoutingTable> {
        return await Entity.adapter.routingTable(this.networkAddress);
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