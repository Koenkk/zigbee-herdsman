import {KeyValue} from '../tstype';
import {TsType as AdapterTsType} from '../../adapter';
import Endpoint from './endpoint';
import Entity from './entity';
import {ArraySplitChunks, Wait} from '../../utils';
import * as Zcl from '../../zcl';
import Debug from "debug";

const debug = Debug('zigbee-herdsman:controller:device');

interface LQI {
    neighbors: {ieeeAddr: string; networkAddress: number; linkquality: number}[];
}

interface RoutingTable {
    table: {destinationAddress: number; status: string; nextHop: number}[];
}

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

    private interviewCompleted: boolean;
    private interviewing: boolean;

    // This lookup contains all devices that are queried from the database, this is to ensure that always
    // the same instance is returned.
    private static lookup: {[ieeeAddr: string]: Device} = {};

    private constructor(
        ID: number, type: AdapterTsType.DeviceType, ieeeAddr: string, networkAddress: number,
        manufacturerID: number, endpoints: Endpoint[], manufacturerName: string,
        powerSource: string, modelID: string, applicationVersion: number, stackVersion: number, zclVersion: number,
        hardwareVersion: number, dateCode: string, softwareBuildID: string, interviewCompleted: boolean,
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
        this.interviewCompleted = interviewCompleted;
        this.interviewing = false;
    }

    /**
     * Getters, setters and creaters
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

    public getEndpoints(): Endpoint[] {
        return this.endpoints;
    }

    public getEndpoint(ID: number): Endpoint {
        return this.endpoints.find((e): boolean => e.ID === ID);
    }

    public get(
        key: 'modelID' | 'networkAddress' | 'interviewCompleted' | 'ieeeAddr' | 'interviewing'
    ): string | number | boolean {
        return this[key];
    }

    public async set(key: 'modelID' | 'networkAddress', value: string | number): Promise<void> {
        if (typeof value === 'string' && (key === 'modelID')) {
            this[key] = value;
        } else if (typeof value === 'number' && (key === 'networkAddress')) {
            this[key] = value;
        }

        await this.save();
    }

    /**
     * CRUD
     */
    private static fromDatabaseRecord(record: KeyValue): Device {
        const networkAddress = record.nwkAddr;
        const ieeeAddr = record.ieeeAddr;
        const endpoints = Object.values(record.endpoints).map((e): Endpoint => {
            return Endpoint.fromDatabaseRecord(e, networkAddress, ieeeAddr);
        });

        return new Device(
            record.id, record.type, ieeeAddr, networkAddress, record.manufId, endpoints,
            record.manufName, record.powerSource, record.modelId, record.appVersion,
            record.stackVersion, record.zclVersion, record.hwVersion, record.dateCode, record.swBuildId,
            record.interviewCompleted,
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
        };
    }

    private async save(): Promise<void> {
        await Device.database.update(this.ID, this.toDatabaseRecord());
    }

    public static async all(): Promise<Device[]> {
        return this.find({});
    }

    public static async findCoordinator(): Promise<Device> {
        return this.findSingle({type: 'Coordinator'});
    }

    public static async findByType(type: AdapterTsType.DeviceType): Promise<Device[]> {
        return this.find({type});
    }

    public static async findByIeeeAddr(ieeeAddr: string): Promise<Device> {
        return Object.values(this.lookup).find((d): boolean => d.ieeeAddr === ieeeAddr) || this.findSingle({ieeeAddr});
    }

    public static async findByNetworkAddress(networkAddress: number): Promise<Device>  {
        return Object.values(this.lookup).find((d): boolean => d.networkAddress === networkAddress) ||
            this.findSingle({nwkAddr: networkAddress});
    }

    private static async findSingle(query: {[s: string]: number | string}): Promise<Device> {
        const results = await this.find(query);
        return results.length !== 0 ? results[0] : null;
    }

    private static async find(query: {[s: string]: number | string}): Promise<Device[]> {
        const results = await this.database.find({...query, type: {$ne: 'Group'}});
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
        if (await this.findByIeeeAddr(ieeeAddr)) {
            throw new Error(`Device with ieeeAddr '${ieeeAddr}' already exists`);
        }

        const endpointsMapped = endpoints.map((e): Endpoint => {
            return Endpoint.create(
                e.ID, e.profileID, e.deviceID, e.inputClusters, e.outputClusters, networkAddress, ieeeAddr
            );
        });

        const ID = await this.database.newID();

        const device = new Device(
            ID, type, ieeeAddr, networkAddress, manufacturerID, endpointsMapped, manufacturerName,
            powerSource, modelID, undefined, undefined, undefined, undefined, undefined, undefined, false,
        );

        await this.database.insert(device.toDatabaseRecord());

        this.lookup[device.ieeeAddr] = device;
        return this.lookup[device.ieeeAddr];
    }

    /**
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
            const nodeDescriptor = await Device.adapter.nodeDescriptor(this.networkAddress);
            this.manufacturerID = nodeDescriptor.manufacturerCode;
            this.type = nodeDescriptor.type;
            await this.save();
            debug(`Interview - got node descriptor for device '${this.ieeeAddr}'`);
        };

        const isXiaomiAndinterviewCompleted = async (): Promise<boolean> => {
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
                if (await isXiaomiAndinterviewCompleted()) {
                    return;
                } else {
                    throw error2;
                }
            }
        }

        const activeEndpoints = await Device.adapter.activeEndpoints(this.networkAddress);
        this.endpoints = activeEndpoints.endpoints.map((e): Endpoint => {
            return Endpoint.create(e, undefined, undefined, [], [], this.networkAddress, this.ieeeAddr);
        });
        await this.save();
        debug(`Interview - got active endpoints for device '${this.ieeeAddr}'`);

        for (const endpoint of this.endpoints) {
            const simpleDescriptor = await Device.adapter.simpleDescriptor(this.networkAddress, endpoint.ID);
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
                    else if (key === 'powerSource') this.powerSource = Zcl.PowerSource[value];
                }

                debug(`Interview - got '${chunk}' for device '${this.ieeeAddr}'`);
                this.save();
            }
        } else {
            debug(`Interview - skip reading attributes because of no endpoint for device '${this.ieeeAddr}'`);
        }

        // Enroll IAS device
        for (const endpoint of this.endpoints.filter((e): boolean => e.supportsInputCluster('ssIasZone'))) {
            debug(`Interview - ssIasZone enrolling '${this.ieeeAddr}' endpoint '${endpoint.ID}'`);
            const coordinator = await Device.findCoordinator();
            await endpoint.write('ssIasZone', {'iasCieAddr': coordinator.get('ieeeAddr')});
            // According to the spec, we should wait for an enrollRequest here, but the Bosch ISW-ZPR1 didn't send it.
            await Wait(3000);
            await endpoint.command('ssIasZone', 'enrollRsp', {enrollrspcode: 0, zoneid: 23});
            debug(`Interview - succesfully enrolled '${this.ieeeAddr}' endpoint '${endpoint.ID}'`);
        }
    }

    public async removeFromNetwork(): Promise<void> {
        await Device.adapter.removeDevice(this.networkAddress, this.ieeeAddr);
        await this.removeFromDatabase();
    }

    public async removeFromDatabase(): Promise<void> {
        await Device.database.remove(this.ID);
        delete Device.lookup[this.ieeeAddr];
    }

    public async lqi(): Promise<LQI> {
        return await Device.adapter.lqi(this.networkAddress);
    }

    public async routingTable(): Promise<RoutingTable> {
        return await Device.adapter.routingTable(this.networkAddress);
    }

    public async ping(): Promise<void> {
        // Zigbee does not have an official pining mechamism. Use a read request
        // of a mandatory basic cluster attribute to keep it as lightweight as
        // possible.
        await this.endpoints[0].read('genBasic', ['zclVersion']);
    }
}

export default Device;