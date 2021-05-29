import {KeyValue, DatabaseEntry, DeviceType} from '../tstype';
import {Events as AdapterEvents} from '../../adapter';
import Endpoint from './endpoint';
import Entity from './entity';
import {Wait} from '../../utils';
import Debug from "debug";
import * as Zcl from '../../zcl';

/**
 * @ignore
 */
const OneJanuary2000 = new Date('January 01, 2000 00:00:00 UTC+00:00').getTime();

const debug = {
    error: Debug('zigbee-herdsman:controller:device:error'),
    log: Debug('zigbee-herdsman:controller:device:log'),
};

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
    private _ieeeAddr: string;
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
    private _linkquality?: number;
    private _skipDefaultResponse: boolean;

    // Getters/setters
    get ieeeAddr(): string {return this._ieeeAddr;}
    set ieeeAddr(ieeeAddr: string) {this._ieeeAddr = ieeeAddr;}
    get applicationVersion(): number {return this._applicationVersion;}
    set applicationVersion(applicationVersion: number) {this._applicationVersion = applicationVersion;}
    get endpoints(): Endpoint[] {return this._endpoints;}
    get interviewCompleted(): boolean {return this._interviewCompleted;}
    get interviewing(): boolean {return this._interviewing;}
    get lastSeen(): number {return this._lastSeen;}
    get manufacturerID(): number {return this._manufacturerID;}
    set type(type: DeviceType) {this._type = type;}
    get type(): DeviceType {return this._type;}
    get dateCode(): string {return this._dateCode;}
    set dateCode(dateCode: string) {this._dateCode = dateCode;}
    set hardwareVersion(hardwareVersion: number) {this._hardwareVersion = hardwareVersion;}
    get hardwareVersion(): number {return this._hardwareVersion;}
    get manufacturerName(): string {return this._manufacturerName;}
    set manufacturerName(manufacturerName: string) {this._manufacturerName = manufacturerName;}
    set modelID(modelID: string) {this._modelID = modelID;}
    get modelID(): string {return this._modelID;}
    get networkAddress(): number {return this._networkAddress;}
    set networkAddress(networkAddress: number) {
        this._networkAddress = networkAddress;
        for (const endpoint of this._endpoints) {
            endpoint.deviceNetworkAddress = networkAddress;
        }
    }
    get powerSource(): string {return this._powerSource;}
    set powerSource(powerSource: string) {
        this._powerSource = typeof powerSource === 'number' ? Zcl.PowerSource[powerSource] : powerSource;
    }
    get softwareBuildID(): string {return this._softwareBuildID;}
    set softwareBuildID(softwareBuildID: string) {this._softwareBuildID = softwareBuildID;}
    get stackVersion(): number {return this._stackVersion;}
    set stackVersion(stackVersion: number) {this._stackVersion = stackVersion;}
    get zclVersion(): number {return this._zclVersion;}
    set zclVersion(zclVersion: number) {this._zclVersion = zclVersion;}
    get linkquality(): number {return this._linkquality;}
    set linkquality(linkquality: number) {this._linkquality = linkquality;}
    get skipDefaultResponse(): boolean {return this._skipDefaultResponse;}
    set skipDefaultResponse(skipDefaultResponse: boolean) {this._skipDefaultResponse = skipDefaultResponse;}

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
        lastSeen: number,
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
        this._skipDefaultResponse = false;
        this.meta = meta;
        this._lastSeen = lastSeen;
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

    // There might be multiple endpoints with same DeviceId but it is not supported and first endpoint is returned
    public getEndpointByDeviceType(deviceType: string): Endpoint {
        const deviceID = Zcl.EndpointDeviceType[deviceType];
        return this.endpoints.find((d): boolean => d.deviceID === deviceID);
    }

    public receivedMessage(): void {
        this._lastSeen = Date.now();
        this.endpoints.forEach((e) => e.sendPendingRequests());
    }

    public async onZclData(dataPayload: AdapterEvents.ZclDataPayload, endpoint: Endpoint): Promise<void> {
        const frame = dataPayload.frame;

        // Respond to enroll requests
        if (frame.isSpecific() && frame.isCluster('ssIasZone') && frame.isCommand('enrollReq')) {
            debug.log(`IAS - '${this.ieeeAddr}' responding to enroll response`);
            const payload = {enrollrspcode: 0, zoneid: 23};
            await endpoint.command('ssIasZone', 'enrollRsp', payload, {disableDefaultResponse: true});
        }

        // Reponse to read requests
        if (frame.isGlobal() && frame.isCommand('read')) {
            const time = Math.round(((new Date()).getTime() - OneJanuary2000) / 1000);
            const attributes: {[s: string]: KeyValue} = {
                ...endpoint.clusters,
                genTime: {attributes: {
                    timeStatus: 3, // Time-master + synchronised
                    time: time,
                    timeZone: ((new Date()).getTimezoneOffset() * -1) * 60,
                    localTime: time - (new Date()).getTimezoneOffset() * 60,
                }},
            };

            if (frame.Cluster.name in attributes) {
                const response: KeyValue = {};
                for (const entry of frame.Payload) {
                    const name = frame.Cluster.getAttribute(entry.attrId).name;
                    if (name in attributes[frame.Cluster.name].attributes) {
                        response[name] = attributes[frame.Cluster.name].attributes[name];
                    }
                }

                try {
                    await endpoint.readResponse(frame.Cluster.ID, frame.Header.transactionSequenceNumber, response,
                        {srcEndpoint: dataPayload.destinationEndpoint});
                } catch (error) {
                    debug.error(`Read response to ${this.ieeeAddr} failed`);
                }
            }

        }

        // Send a default response if necessary.
        const isDefaultResponse = frame.isGlobal() && frame.getCommand().name === 'defaultRsp';
        const commandHasResponse = frame.getCommand().hasOwnProperty('response');
        const disableDefaultResponse = frame.Header.frameControl.disableDefaultResponse;
        if (!dataPayload.wasBroadcast && !disableDefaultResponse && !isDefaultResponse && !commandHasResponse &&
            !this._skipDefaultResponse) {
            try {
                await endpoint.defaultResponse(
                    frame.getCommand().ID, 0, frame.Cluster.ID, frame.Header.transactionSequenceNumber,
                );
            } catch (error) {
                debug.error(`Default response to ${this.ieeeAddr} failed`);
            }
        }
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
            entry.interviewCompleted, meta, entry.lastSeen || null,
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
            meta: this.meta, lastSeen: this.lastSeen,
        };
    }

    public save(): void {
        Entity.database.update(this.toDatabaseEntry());
    }

    private static loadFromDatabaseIfNecessary(): void {
        if (!Device.devices) {
            Device.devices = {};
            const entries = Entity.database.getEntries(['Coordinator', 'EndDevice', 'Router', 'GreenPower', 'Unknown']);
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
        type: DeviceType, ieeeAddr: string, networkAddress: number,
        manufacturerID: number, manufacturerName: string,
        powerSource: string, modelID: string, interviewCompleted: boolean,
        endpoints: {
            ID: number; profileID: number; deviceID: number; inputClusters: number[]; outputClusters: number[];
        }[],
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
            powerSource, modelID, undefined, undefined, undefined, undefined, undefined, undefined,
            interviewCompleted, {}, null,
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
            debug.log(message);
            throw new Error(message);
        }

        let error;
        this._interviewing = true;
        debug.log(`Interview - start device '${this.ieeeAddr}'`);

        try {
            await this.interviewInternal();
            debug.log(`Interview - completed for device '${this.ieeeAddr}'`);
            this._interviewCompleted = true;
        } catch (e) {
            if (this.interviewQuirks()) {
                debug.log(`Interview - completed for device '${this.ieeeAddr}' because of quirks ('${e}')`);
            } else {
                debug.log(`Interview - failed for device '${this.ieeeAddr}' with error '${e.stack}'`);
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

    private interviewQuirks(): boolean {
        // Some devices, e.g. Xiaomi end devices have a different interview procedure, after pairing they
        // report it's modelID trough a readResponse. The readResponse is received by the controller and set
        // on the device.
        const lookup: {[s: string]: {
            type?: DeviceType; manufacturerID?: number; manufacturerName?: string; powerSource?: string;
        };} = {
            'lumi\..*': {
                type: 'EndDevice', manufacturerID: 4151, manufacturerName: 'LUMI', powerSource: 'Battery'
            },
            'TERNCY-PP01': {
                type: 'EndDevice', manufacturerID: 4648, manufacturerName: 'TERNCY', powerSource: 'Battery'
            },
            // Device does not change zoneState after enroll (event with original gateway);['''''
            // below prevents interview from failing
            // https://github.com/Koenkk/zigbee2mqtt/issues/4655
            'TS0216': {},
            // Fails during ias enroll due to UNSUPPORTED_ATTRIBUTE
            // https://github.com/Koenkk/zigbee2mqtt/issues/7564
            'TS0202': {},
            'MULTI-MECI--EA01': {},
        };

        const match = Object.keys(lookup).find((key) => this.modelID && this.modelID.match(key));
        if (match) {
            const info = lookup[match];
            debug.log(`Interview procedure failed but got modelID matching '${match}', assuming interview succeeded`);
            this._type = this._type === 'Unknown' ? info.type : this._type;
            this._manufacturerID = this._manufacturerID || info.manufacturerID;
            this._manufacturerName = this._manufacturerName || info.manufacturerName;
            this._powerSource = this._powerSource || info.powerSource;
            this._interviewing = false;
            this._interviewCompleted = true;
            this.save();
            return true;
        } else {
            return false;
        }
    }

    private async interviewInternal(): Promise<void> {
        const nodeDescriptorQuery = async (): Promise<void> => {
            const nodeDescriptor = await Entity.adapter.nodeDescriptor(this.networkAddress);
            this._manufacturerID = nodeDescriptor.manufacturerCode;
            this._type = nodeDescriptor.type;
            this.save();
            debug.log(`Interview - got node descriptor for device '${this.ieeeAddr}'`);
        };

        let gotNodeDescriptor = false;
        for (let attempt = 0; attempt < 6; attempt++) {
            try {
                await nodeDescriptorQuery();
                gotNodeDescriptor = true;
                break;
            } catch (error) {
                if (this.interviewQuirks()) {
                    debug.log(`Interview - completed for device '${this.ieeeAddr}' because of quirks ('${error}')`);
                    return;
                } else {
                    // Most of the times the first node descriptor query fails and the seconds one succeeds.
                    debug.log(
                        `Interview - node descriptor request failed for '${this.ieeeAddr}', attempt ${attempt + 1}`
                    );
                }
            }
        }
        if (!gotNodeDescriptor) {
            throw new Error(`Interview failed because can not get node descriptor ('${this.ieeeAddr}')`);
        }

        if (this.manufacturerID === 4619 && this._type === 'EndDevice') {
            // Give TuYa end device some time to pair. Otherwise they leave immediately.
            // https://github.com/Koenkk/zigbee2mqtt/issues/5814
            debug.log("Detected TuYa end device, waiting 10 seconds...");
            await Wait(10000);
        }

        // e.g. Xiaomi Aqara Opple devices fail to respond to the first active endpoints request, therefore try 2 times
        // https://github.com/Koenkk/zigbee-herdsman/pull/103
        let activeEndpoints;
        for (let attempt = 0; attempt < 2; attempt++) {
            try {
                activeEndpoints = await Entity.adapter.activeEndpoints(this.networkAddress);
                break;
            } catch (error) {
                debug.log(`Interview - active endpoints request failed for '${this.ieeeAddr}', attempt ${attempt + 1}`);
            }
        }
        if (!activeEndpoints) {
            throw new Error(`Interview failed because can not get active endpoints ('${this.ieeeAddr}')`);
        }

        // Make sure that the endpoint are sorted.
        activeEndpoints.endpoints.sort();

        // Some devices, e.g. TERNCY return endpoint 0 in the active endpoints request.
        // This is not a valid endpoint number according to the ZCL, requesting a simple descriptor will result
        // into an error. Therefore we filter it, more info: https://github.com/Koenkk/zigbee-herdsman/issues/82
        this._endpoints = activeEndpoints.endpoints.filter((e) => e !== 0).map((e): Endpoint => {
            return Endpoint.create(e, undefined, undefined, [], [], this.networkAddress, this.ieeeAddr);
        });
        this.save();
        debug.log(`Interview - got active endpoints for device '${this.ieeeAddr}'`);

        for (const endpoint of this.endpoints) {
            const simpleDescriptor = await Entity.adapter.simpleDescriptor(this.networkAddress, endpoint.ID);
            endpoint.profileID = simpleDescriptor.profileID;
            endpoint.deviceID = simpleDescriptor.deviceID;
            endpoint.inputClusters = simpleDescriptor.inputClusters;
            endpoint.outputClusters = simpleDescriptor.outputClusters;
            debug.log(`Interview - got simple descriptor for endpoint '${endpoint.ID}' device '${this.ieeeAddr}'`);
            this.save();

            // Read attributes, nice to have but not required for succesfull pairing as most of the attributes
            // are not mandatory in ZCL specification.
            if (endpoint.supportsInputCluster('genBasic')) {
                for (const [key, item] of Object.entries(Device.ReportablePropertiesMapping)) {
                    if (!this[item.key]) {
                        try {
                            let result: KeyValue;
                            try {
                                result = await endpoint.read('genBasic', [key]);
                            } catch (error) {
                                // Reading attributes can fail for many reason, e.g. it could be that device rejoins
                                // while joining like in:
                                // https://github.com/Koenkk/zigbee-herdsman-converters/issues/2485.
                                // The modelID and manufacturerName are crucial for device identification, so retry.
                                if (item.key === 'modelID' || item.key === 'manufacturerName') {
                                    debug.log(`Interview - first ${item.key} retrieval attempt failed, ` +
                                        `retrying after 10 seconds...`);
                                    await Wait(10000);
                                    result = await endpoint.read('genBasic', [key]);
                                }
                            }

                            item.set(result[key], this);
                            debug.log(`Interview - got '${item.key}' for device '${this.ieeeAddr}'`);
                        } catch (error) {
                            debug.log(
                                `Interview - failed to read attribute '${item.key}' from ` +
                                    `endpoint '${endpoint.ID}' (${error})`
                            );
                        }
                    }
                }
            }
        }

        // Enroll IAS device
        for (const endpoint of this.endpoints.filter((e): boolean => e.supportsInputCluster('ssIasZone'))) {
            debug.log(`Interview - IAS - enrolling '${this.ieeeAddr}' endpoint '${endpoint.ID}'`);

            const stateBefore = await endpoint.read('ssIasZone', ['iasCieAddr', 'zoneState']);
            debug.log(`Interview - IAS - before enrolling state: '${JSON.stringify(stateBefore)}'`);

            // Do not enroll when device has already been enrolled
            const coordinator = Device.byType('Coordinator')[0];
            if (stateBefore.zoneState !== 1 || stateBefore.iasCieAddr !== coordinator.ieeeAddr) {
                debug.log(`Interview - IAS - not enrolled, enrolling`);

                await endpoint.write('ssIasZone', {'iasCieAddr': coordinator.ieeeAddr});
                debug.log(`Interview - IAS - wrote iasCieAddr`);

                // There are 2 enrollment procedures:
                // - Auto enroll: coordinator has to send enrollResponse without receiving an enroll request
                //                this case is handled below.
                // - Manual enroll: coordinator replies to enroll request with an enroll response.
                //                  this case in hanled in onZclData().
                // https://github.com/Koenkk/zigbee2mqtt/issues/4569#issuecomment-706075676
                await Wait(500);
                debug.log(`IAS - '${this.ieeeAddr}' sending enroll response (auto enroll)`);
                const payload = {enrollrspcode: 0, zoneid: 23};
                await endpoint.command('ssIasZone', 'enrollRsp', payload, {disableDefaultResponse: true});

                let enrolled = false;
                for (let attempt = 0; attempt < 20; attempt++) {
                    await Wait(500);
                    const stateAfter = await endpoint.read('ssIasZone', ['iasCieAddr', 'zoneState']);
                    debug.log(`Interview - IAS - after enrolling state (${attempt}): '${JSON.stringify(stateAfter)}'`);
                    if (stateAfter.zoneState === 1) {
                        enrolled = true;
                        break;
                    }
                }

                if (enrolled) {
                    debug.log(`Interview - IAS successfully enrolled '${this.ieeeAddr}' endpoint '${endpoint.ID}'`);
                } else {
                    throw new Error(
                        `Interview failed because of failed IAS enroll (zoneState didn't change ('${this.ieeeAddr}')`
                    );
                }
            } else {
                debug.log(`Interview - IAS - already enrolled, skipping enroll`);
            }
        }
    }

    public async removeFromNetwork(): Promise<void> {
        await Entity.adapter.removeDevice(this.networkAddress, this.ieeeAddr);
        await this.removeFromDatabase();
    }

    public async removeFromDatabase(): Promise<void> {
        Device.loadFromDatabaseIfNecessary();

        for (const endpoint of this.endpoints) {
            endpoint.removeFromAllGroupsDatabase();
        }

        if (Entity.database.has(this.ID)) {
            Entity.database.remove(this.ID);
        }

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
        await this.endpoints[0].read('genBasic', ['zclVersion'], {disableRecovery: true});
    }
}

export default Device;
