import {DeviceType, KeyValue} from '../tstype';
import Endpoint from './endpoint';
import Entity from './entity';

class Device extends Entity {
    private ID: number;
    private type: DeviceType;
    private ieeeAddr: string;
    private networkAddress: number;
    private manufacturerID: number;
    private endpoints: Endpoint[];

    private manufacturerName: string;
    private powerSource: string;
    private modelID: string;

    private constructor(
        ID: number, type: DeviceType, ieeeAddr: string, networkAddress: number,
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
        const epList = this.endpoints.map((e): number => e.getID());
        const endpoints: KeyValue = {};
        for (let endpoint of this.endpoints) {
            endpoints[endpoint.getID()] = endpoint.toDatabaseRecord();
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

        await Device.database.update(this.ID, this.toDatabaseRecord());
    }

    public static async findByType(type: DeviceType): Promise<Device[]> {
        const results = await this.database.find({type});
        return results.map((r): Device => this.fromDatabaseRecord(r));
    }

    public static async findByIeeeAddr(ieeeAddr: string): Promise<Device> {
        const results = await this.database.find({ieeeAddr});
        return results.length === 0 ? null : this.fromDatabaseRecord(results[0]);
    }

    public static async findByNetworkAddress(networkAddress: number): Promise<Device> {
        const results = await this.database.find({nwkAddr: networkAddress});
        return results.length === 0 ? null : this.fromDatabaseRecord(results[0]);
    }

    public static async create(
        type: DeviceType, ieeeAddr: string, networkAddress: number,
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
}

export default Device;