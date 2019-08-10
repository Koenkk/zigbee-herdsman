import {KeyValue} from '../tstype';
import {TsType as AdapterTsType} from '../../adapter'
import Endpoint from './endpoint';
import Entity from './entity';

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

    private constructor(
        ID: number, type: AdapterTsType.DeviceType, ieeeAddr: string, networkAddress: number,
        manufacturerID: number, endpoints: Endpoint[], manufacturerName: string,
        powerSource: string, modelID: string,
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
    }

    private static fromDatabaseRecord(record: KeyValue): Device {
        const endpoints = Object.values(record.endpoints).map((e): Endpoint => {
            return Endpoint.fromDatabaseRecord(e)
        });

        return new Device(
            record.id, record.type, record.ieeeAddr, record.nwkAddr, record.manufId, endpoints,
            record.manufName, record.powerSource, record.modelId,
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
            modelId: this.modelID, epList, endpoints,
        }
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
        return (await this.database.find(query)).map((r): Device => this.fromDatabaseRecord(r));
    }

    public static async create(
        type: AdapterTsType.DeviceType, ieeeAddr: string, networkAddress: number,
        manufacturerID: number, manufacturerName: string,
        powerSource: string, modelID: string,
        endpoints: {ID: number; profileID: number; deviceID: number; inputClusters: number[]; outputClusters: number[]}[]
    ): Promise<Device> {
        const endpointsMapped = endpoints.map((e): Endpoint => {
            return Endpoint.create(e.ID, e.profileID, e.deviceID, e.inputClusters, e.outputClusters);
        });

        const ID = await this.database.newID();

        const device = new Device(
            ID, type, ieeeAddr, networkAddress, manufacturerID, endpointsMapped, manufacturerName,
            powerSource, modelID,
        )

        await this.database.insert(device.toDatabaseRecord());

        return device;
    }

    public async interview(): Promise<void> {
        debug(`Interview - start device '${this.ieeeAddr}'`);

        const nodeDescriptor = await Device.adapter.nodeDescriptor(this.networkAddress);
        this.manufacturerID = nodeDescriptor.manufacturerCode;
        this.type = nodeDescriptor.type;
        await this.save();
        debug(`Interview - got node descriptor for device '${this.ieeeAddr}'`);

        const activeEndpoints = await Device.adapter.activeEndpoints(this.networkAddress);
        this.endpoints = activeEndpoints.endpoints.map((e): Endpoint => Endpoint.create(e, undefined, undefined, [], []));
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


        // ('ZDO', 'nodeDescReq', { dstaddr: nwkAddr, nwkaddrofinterest: nwkAddr }).then(function (rsp) {
        //     // rsp: { srcaddr, status, nwkaddr, logicaltype_cmplxdescavai_userdescavai, ..., manufacturercode, ... }
        //     devInfo.type = devType(rsp.logicaltype_cmplxdescavai_userdescavai & 0x07);  // logical type: bit0-2
        //     devInfo.manufId = rsp.manufacturercode;
        //     return controller.request('ZDO', 'activeEpReq', { dstaddr: nwkAddr, nwkaddrofinterest: nwkAddr });
    }
}

export default Device;