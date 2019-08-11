import {KeyValue} from '../tstype';
import {TsType as AdapterTsType} from '../../adapter'
import Endpoint from './endpoint';
import Entity from './entity';
import {ArraySplitChunks} from '../../utils';
import * as Zcl from '../../zcl';

const debug = require('debug')('zigbee-herdsman:controller:device');

// eslint-disable-next-line
function isEndpointerArray(value: any): value is Endpoint[] {
    if (value instanceof Array) {
        for (let item of value) {
            if (item instanceof Endpoint) {
                return false;
            }
        }

        return true;
    }

    return false;
}

class Device extends Entity {
    private ID: number;
    private ieeeAddr: string;
    private networkAddress: number;
    private endpoints: Endpoint[];

    // Attributes below are not always present.
    private type: AdapterTsType.DeviceType;
    private manufacturerID: number;
    private manufacturerName: string;
    private powerSource: string;
    private modelID: string;
    private applicationVersion: number;
    private stackVersion: number;
    private zclVersion: number;
    private hardwareVersion: number;
    private dateCode: string;
    private softwareBuildID: string;

    // This lookup contains all devices that are queried from the database, this is to ensure that always
    // the same instance is returned.
    private static lookup: {[ieeeAddr: string]: Device} = {};

    private constructor(
        ID: number, type: AdapterTsType.DeviceType, ieeeAddr: string, networkAddress: number,
        manufacturerID: number, endpoints: Endpoint[], manufacturerName: string,
        powerSource: string, modelID: string, applicationVersion: number, stackVersion: number, zclVersion: number,
        hardwareVersion: number, dateCode: string, softwareBuildID: string,
    ) {
        super();
        this.ID = ID;
        this.type = type;
        this.ieeeAddr = ieeeAddr;
        this.networkAddress = networkAddress;
        this.manufacturerID = manufacturerID;
        this.endpoints = endpoints;
        this.manufacturerName = manufacturerName;
        this.powerSource = powerSource;
        this.modelID = modelID;
        this.applicationVersion = applicationVersion;
        this.stackVersion = stackVersion;
        this.zclVersion = zclVersion;
        this.hardwareVersion = hardwareVersion;
        this.dateCode = dateCode;
        this.softwareBuildID = softwareBuildID;
    }

    public getEndpoints(): Endpoint[] {
        return this.endpoints;
    }

    public getEndpoint(ID: number): Endpoint {
        return this.endpoints.find((e): boolean => e.ID === ID);
    }

    private static fromDatabaseRecord(record: KeyValue): Device {
        const networkAddress = record.nwkAddr;
        const endpoints = Object.values(record.endpoints).map((e): Endpoint => {
            return Endpoint.fromDatabaseRecord(e, networkAddress)
        });

        return new Device(
            record.id, record.type, record.ieeeAddr, networkAddress, record.manufId, endpoints,
            record.manufName, record.powerSource, record.modelId, record.appVersion,
            record.stackVersion, record.zclVersion, record.hwVersion, record.dateCode, record.swBuildId,
        );
    }

    private toDatabaseRecord(): KeyValue {
        const epList = this.endpoints.map((e): number => e.ID);
        const endpoints: KeyValue = {};
        for (let endpoint of this.endpoints) {
            endpoints[endpoint.ID] = endpoint.toDatabaseRecord();
        }

        return {
            id: this.ID, type: this.type, ieeeAddr: this.ieeeAddr, nwkAddr: this.networkAddress,
            manufId: this.manufacturerID, manufName: this.manufacturerName, powerSource: this.powerSource,
            modelId: this.modelID, epList, endpoints, appVersion: this.applicationVersion, stackVersion: this.stackVersion,
            hwVersion: this.hardwareVersion, dateCode: this.dateCode, swBuildId: this.softwareBuildID, zclVersion: this.zclVersion,
        }
    }

    public get(key: 'modelID'): string | number {
        return this[key];
    }

    public async update(key: 'modelID' | 'networkAddress', value: string | number): Promise<void> {
        if (typeof value === 'string' && (key === 'modelID')) {
            this[key] = value;
        } else if (typeof value === 'number' && (key === 'networkAddress')) {
            this[key] = value;
        }

        await this.save();
    }

    private async save(): Promise<void> {
        await Device.database.update(this.ID, this.toDatabaseRecord());
    }

    public static async all(): Promise<Device[]> {
        return this.find({});
    }

    public static async findByType(type: AdapterTsType.DeviceType): Promise<Device[]> {
        return this.find({type});
    }

    public static async findByIeeeAddr(ieeeAddr: string): Promise<Device> {
        return this.findSingle({ieeeAddr});
    }

    public static async findByNetworkAddress(networkAddress: number): Promise<Device>  {
        return this.findSingle({nwkAddr: networkAddress});
    }

    private static async findSingle(query: {[s: string]: number | string}): Promise<Device> {
        const results = await this.find(query);
        return results.length !== 0 ? results[0] : null;
    }

    private static async find(query: {[s: string]: number | string}): Promise<Device[]> {
        const results = await this.database.find(query);
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
        endpoints: {ID: number; profileID: number; deviceID: number; inputClusters: number[]; outputClusters: number[]}[]
    ): Promise<Device> {
        if (this.findByIeeeAddr(ieeeAddr)) {
            throw new Error(`Device with ieeeAddr '${ieeeAddr}' already exists`)
        }

        const endpointsMapped = endpoints.map((e): Endpoint => {
            return Endpoint.create(e.ID, e.profileID, e.deviceID, e.inputClusters, e.outputClusters, networkAddress);
        });

        const ID = await this.database.newID();

        const device = new Device(
            ID, type, ieeeAddr, networkAddress, manufacturerID, endpointsMapped, manufacturerName,
            powerSource, modelID, undefined, undefined, undefined, undefined, undefined, undefined,
        )

        await this.database.insert(device.toDatabaseRecord());

        this.lookup[device.ieeeAddr] = device;
        return this.lookup[device.ieeeAddr];
    }

    public async interview(): Promise<void> {
        debug(`Interview - start device '${this.ieeeAddr}'`);

        const nodeDescriptorQuery = async (): Promise<void> => {
            const nodeDescriptor = await Device.adapter.nodeDescriptor(this.networkAddress);
            this.manufacturerID = nodeDescriptor.manufacturerCode;
            this.type = nodeDescriptor.type;
            await this.save();
            debug(`Interview - got node descriptor for device '${this.ieeeAddr}'`);
        }

        try {
            await nodeDescriptorQuery();
        } catch (error) {
            debug(`Interview - failed to get node descriptor for device '${this.ieeeAddr}', retrying...`);
            await nodeDescriptorQuery();
        }

        const activeEndpoints = await Device.adapter.activeEndpoints(this.networkAddress);
        this.endpoints = activeEndpoints.endpoints.map((e): Endpoint => Endpoint.create(e, undefined, undefined, [], [], this.networkAddress));
        await this.save();
        debug(`Interview - got active endpoints for device '${this.ieeeAddr}'`);

        for (let endpoint of this.endpoints) {
            const simpleDescriptor = await Device.adapter.simpleDescriptor(this.networkAddress, endpoint.ID);
            endpoint.update('profileID', simpleDescriptor.profileID);
            endpoint.update('deviceID', simpleDescriptor.deviceID);
            endpoint.update('inputClusters', simpleDescriptor.inputerClusters);
            endpoint.update('outputClusters', simpleDescriptor.outputClusters);
            debug(`Interview - got simple descriptor for endpoint '${endpoint.ID}' device '${this.ieeeAddr}'`)
            await this.save();
        }

        if (this.endpoints.length !== 0) {
            const endpoint = this.endpoints[0];
            const attributes = ['manufacturerName', 'modelId', 'powerSource', 'zclVersion', 'appVersion', 'stackVersion', 'hwVersion', 'dateCode', 'swBuildId'];

            // Split into chunks of 3, otherwise some devices fail to respond.
            for (let chunk of ArraySplitChunks(attributes, 3)) {
                const result = await endpoint.read('genBasic', chunk);
                for (let [key, value] of Object.entries(result)) {
                    if (key === 'manufacturerName') this.manufacturerName = value;
                    else if (key === 'modelId') this.modelID = value;
                    else if (key === 'zclVersion') this.zclVersion = value;
                    else if (key === 'appVersion') this.applicationVersion = value;
                    else if (key === 'stackVersion') this.stackVersion = value;
                    else if (key === 'hwVersion') this.hardwareVersion = value;
                    else if (key === 'dateCode') this.dateCode = value;
                    else if (key === 'swBuildId') this.softwareBuildID = value;
                    else if (key === 'powerSource') this.powerSource = Zcl.PowerSource[value];
                }

                debug(`Interview - got '${chunk}' for device '${this.ieeeAddr}'`);
                this.save();
            }
        } else {
            debug(`Interview - skip reading attributes because of no endpoint for device '${this.ieeeAddr}'`);
        }

        debug(`Interview - completed for device '${this.ieeeAddr}'`);
    }
}

export default Device;