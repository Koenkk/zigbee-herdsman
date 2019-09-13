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

type DeviceQuery = {
    ieeeAddr?: string;
    networkAddress?: number;
    type?: AdapterTsType.DeviceType;
    [key: string]: unknown;
};

class Device extends Entity {
    ID: number;
    ieeeAddr: string;
    networkAddress: number;
    type: AdapterTsType.DeviceType;
    private endpoints: Endpoint[];
    private manufacturerID?: number;
    private manufacturerName?: string;
    private powerSource?: string;
    modelID?: string;
    private applicationVersion?: number;
    private stackVersion?: number;
    private zclVersion?: number;
    private hardwareVersion?: number;
    private dateCode?: string;
    private softwareBuildID?: string;

    interviewCompleted: boolean;
    interviewing: boolean;

    // Can be used by applications to store data.
    meta: KeyValue;

    // This lookup contains all devices that are queried from the database, this is to ensure that always
    // the same instance is returned.
    private static lookup: {[ieeeAddr: string]: Device} = {};
    static reload(): void { Device.lookup = {}; }

    private constructor(
        ID: number, type: AdapterTsType.DeviceType, ieeeAddr: string, networkAddress: number,
        manufacturerID: number, endpoints: Endpoint[], manufacturerName: string,
        powerSource: string, modelID: string, applicationVersion: number, stackVersion: number, zclVersion: number,
        hardwareVersion: number, dateCode: string, softwareBuildID: string, interviewCompleted: boolean, meta: KeyValue,
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
        this.meta = meta;
    }

    public isType(type: string): boolean {
        return type === 'device';
    }

    /**
     * Getters, setters and creaters
     */
    public createEndpoint(ID: number): Endpoint {
        if (this.getEndpoint(ID)) {
            throw new Error(`Device '${this.ieeeAddr}' already has an endpoint '${ID}'`);
        }

        const endpoint = Endpoint.create(ID, undefined, undefined, [], [], this.networkAddress, this.ieeeAddr);
        this.endpoints.push(endpoint);
        this.save();
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

    public set(key: 'modelID' | 'networkAddress', value: string | number): void {
        if (typeof value === 'string' && (key === 'modelID')) {
            this[key] = value;
        } else {
            /* istanbul ignore else */
            if (typeof value === 'number' && (key === 'networkAddress')) {
                this[key] = value;
            }
        }

        this.save();
    }

    /**
     * CRUD
     */
    static fromDatabaseRecord(record: KeyValue): Device {
        const networkAddress = record.nwkAddr;
        const ieeeAddr = record.ieeeAddr;
        const endpoints = Object.values(record.endpoints).map((e): Endpoint => {
            return Endpoint.fromDatabaseRecord(e, networkAddress, ieeeAddr);
        });

        const meta = record.meta ? record.meta : {};
        const device = new Device(
            record.id, record.type, ieeeAddr, networkAddress, record.manufId, endpoints,
            record.manufName, record.powerSource, record.modelId, record.appVersion,
            record.stackVersion, record.zclVersion, record.hwVersion, record.dateCode, record.swBuildId,
            record.interviewCompleted, meta,
        );
        Device.lookup[device.ieeeAddr] = device;
        return device;
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

    save(): void {
        Device.database.update(this.ID, this.toDatabaseRecord());
    }

    public static all(): Device[] {
        return Object.values(Device.lookup);
    }

    public static byAddress(ieeeAddr: string): Device | undefined {
        return Device.lookup[ieeeAddr];
    }

    public static byNetworkAddress(networkAddress: number): Device | undefined {
        return Object.values(Device.lookup).find(d => d.networkAddress === networkAddress);
    }

    public static byType(type: AdapterTsType.DeviceType): Device | undefined {
        const all = Object.values(Device.lookup).filter(d => d.type === type);
        if (all.length !== 1) return null;
        return all[0];
    }

    public static findSingle(query: DeviceQuery): Device | undefined {
        const result = Device.find(query);
        if (result.length === 1) return result[0];
        return undefined;
    }

    public static find(query: DeviceQuery): Device[] {
        const queryKeys = Object.keys(query);

        // fast path
        if (queryKeys.length === 1 && query.ieeeAddr) {
            const device = Device.byAddress(query.ieeeAddr);
            return device ? [device] : [];
        }

        return Device.all().filter((d: KeyValue) => {
            for (const key of queryKeys) {
                if (d[key] != query[key]) return false;
            }
            return true;
        });
    }

    public static create(
        type: AdapterTsType.DeviceType, ieeeAddr: string, networkAddress: number,
        manufacturerID: number, manufacturerName: string,
        powerSource: string, modelID: string,
        endpoints: {
            ID: number; profileID: number; deviceID: number; inputClusters: number[]; outputClusters: number[];
        }[]
    ): Device {
        if (Device.byAddress(ieeeAddr)) {
            throw new Error(`Device with ieeeAddr '${ieeeAddr}' already exists`);
        }

        const endpointsMapped = endpoints.map((e): Endpoint => {
            return Endpoint.create(
                e.ID, e.profileID, e.deviceID, e.inputClusters, e.outputClusters, networkAddress, ieeeAddr
            );
        });

        const ID = Device.database.newID();

        const device = new Device(
            ID, type, ieeeAddr, networkAddress, manufacturerID, endpointsMapped, manufacturerName,
            powerSource, modelID, undefined, undefined, undefined, undefined, undefined, undefined, false, {},
        );

        Device.database.insert(device.toDatabaseRecord());
        Device.lookup[device.ieeeAddr] = device;
        return device;
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
            this.save();
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
            this.save();
            debug(`Interview - got node descriptor for device '${this.ieeeAddr}'`);
        };

        const isXiaomiAndInterviewCompleted = (): boolean => {
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
                if (isXiaomiAndInterviewCompleted()) {
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
        this.save();
        debug(`Interview - got active endpoints for device '${this.ieeeAddr}'`);

        for (const endpoint of this.endpoints) {
            const simpleDescriptor = await Device.adapter.simpleDescriptor(this.networkAddress, endpoint.ID);
            endpoint.set('profileID', simpleDescriptor.profileID);
            endpoint.set('deviceID', simpleDescriptor.deviceID);
            endpoint.set('inputClusters', simpleDescriptor.inputClusters);
            endpoint.set('outputClusters', simpleDescriptor.outputClusters);
            debug(`Interview - got simple descriptor for endpoint '${endpoint.ID}' device '${this.ieeeAddr}'`);
            this.save();
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
            const coordinator = Device.byType('Coordinator');
            await endpoint.write('ssIasZone', {'iasCieAddr': coordinator.ieeeAddr});
            // According to the spec, we should wait for an enrollRequest here, but the Bosch ISW-ZPR1 didn't send it.
            await Wait(3000);
            await endpoint.command('ssIasZone', 'enrollRsp', {enrollrspcode: 0, zoneid: 23});
            debug(`Interview - succesfully enrolled '${this.ieeeAddr}' endpoint '${endpoint.ID}'`);
        }
    }

    public async removeFromNetwork(): Promise<void> {
        await Device.adapter.removeDevice(this.networkAddress, this.ieeeAddr);
        this.removeFromDatabase();
    }

    public removeFromDatabase(): void {
        Device.database.remove(this.ID);
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