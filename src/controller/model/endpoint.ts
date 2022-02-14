import Entity from './entity';
import {KeyValue, SendRequestWhen} from '../tstype';
import * as Zcl from '../../zcl';
import ZclTransactionSequenceNumber from '../helpers/zclTransactionSequenceNumber';
import * as ZclFrameConverter from '../helpers/zclFrameConverter';
import Group from './group';
import Device from './device';
import Debug from "debug";
import assert from 'assert';

const debug = {
    info: Debug('zigbee-herdsman:controller:endpoint'),
    error: Debug('zigbee-herdsman:controller:endpoint'),
};

interface ConfigureReportingItem {
    attribute: string | number | {ID: number; type: number};
    minimumReportInterval: number;
    maximumReportInterval: number;
    reportableChange: number;
}

interface Options {
    manufacturerCode?: number;
    disableDefaultResponse?: boolean;
    disableResponse?: boolean;
    timeout?: number;
    direction?: Zcl.Direction;
    srcEndpoint?: number;
    reservedBits?: number;
    transactionSequenceNumber?: number;
    disableRecovery?: boolean;
    writeUndiv?: boolean;
    sendWhen?: SendRequestWhen;
}

interface Clusters {
    [cluster: string]: {
        attributes: {[attribute: string]: number | string};
    };
}

interface BindInternal {
    cluster: number;
    type: 'endpoint' | 'group';
    deviceIeeeAddress?: string;
    endpointID?: number;
    groupID?: number;
}

interface Bind {
    cluster: Zcl.TsType.Cluster;
    target: Endpoint | Group;
}

interface ConfiguredReportingInternal {
    cluster: number;
    attrId: number,
    minRepIntval: number,
    maxRepIntval: number,
    repChange: number,
}

interface ConfiguredReporting {
    cluster: Zcl.TsType.Cluster;
    attribute: Zcl.TsType.Attribute,
    minimumReportInterval: number,
    maximumReportInterval: number,
    reportableChange: number,
}

interface PendingRequest {
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any*/
    func: () => Promise<any>, resolve: (value: any) => any, reject: (error: any) => any, 
    sendWhen: 'active' | 'fastpoll'
}

class Endpoint extends Entity {
    public deviceID?: number;
    public inputClusters: number[];
    public outputClusters: number[];
    public profileID?: number;
    public readonly ID: number;
    public readonly clusters: Clusters;
    private readonly deviceIeeeAddress: string;
    public deviceNetworkAddress: number;
    private _binds: BindInternal[];
    private _configuredReportings: ConfiguredReportingInternal[];
    public meta: KeyValue;
    private pendingRequests: PendingRequest[];

    // Getters/setters
    get binds(): Bind[] {
        return this._binds.map((entry) => {
            let target: Group | Endpoint = null;
            if (entry.type === 'endpoint') {
                const device = Device.byIeeeAddr(entry.deviceIeeeAddress);
                if (device) {
                    target = device.getEndpoint(entry.endpointID);
                }
            } else {
                target = Group.byGroupID(entry.groupID);
            }

            if (target) {
                return {target, cluster: Zcl.Utils.getCluster(entry.cluster)};
            } else {
                return undefined;
            }
        }).filter(b => b !== undefined);
    }

    get configuredReportings(): ConfiguredReporting[] {
        return this._configuredReportings.map((entry) => {
            const cluster = Zcl.Utils.getCluster(entry.cluster, this.getDevice().manufacturerID);
            let attribute : Zcl.TsType.Attribute;

            if (cluster.hasAttribute(entry.attrId)) {
                attribute = cluster.getAttribute(entry.attrId);
            } else {
                attribute = {
                    ID: entry.attrId,
                    name: undefined,
                    type: undefined,
                    manufacturerCode: undefined
                };
            }

            return {
                cluster, attribute,
                minimumReportInterval: entry.minRepIntval,
                maximumReportInterval: entry.maxRepIntval,
                reportableChange: entry.repChange,
            };
        });
    }

    private constructor(
        ID: number, profileID: number, deviceID: number, inputClusters: number[], outputClusters: number[],
        deviceNetworkAddress: number, deviceIeeeAddress: string, clusters: Clusters, binds: BindInternal[],
        configuredReportings: ConfiguredReportingInternal[],
        meta: KeyValue,
    ) {
        super();
        this.ID = ID;
        this.profileID = profileID;
        this.deviceID = deviceID;
        this.inputClusters = inputClusters;
        this.outputClusters = outputClusters;
        this.deviceNetworkAddress = deviceNetworkAddress;
        this.deviceIeeeAddress = deviceIeeeAddress;
        this.clusters = clusters;
        this._binds = binds;
        this._configuredReportings = configuredReportings;
        this.meta = meta;
        this.pendingRequests = [];
    }

    /**
     * Get device of this endpoint
     */
    public getDevice(): Device {
        return Device.byIeeeAddr(this.deviceIeeeAddress);
    }

    /**
     * @param {number|string} clusterKey
     * @returns {boolean}
     */
    public supportsInputCluster(clusterKey: number | string, ): boolean {
        const cluster = Zcl.Utils.getCluster(clusterKey);
        return this.inputClusters.includes(cluster.ID);
    }

    /**
     * @param {number|string} clusterKey
     * @returns {boolean}
     */
    public supportsOutputCluster(clusterKey: number | string, ): boolean {
        const cluster = Zcl.Utils.getCluster(clusterKey);
        return this.outputClusters.includes(cluster.ID);
    }

    /**
     * @returns {Zcl.TsType.Cluster[]}
     */
    public getInputClusters(): Zcl.TsType.Cluster[] {
        return this.clusterNumbersToClusters(this.inputClusters);
    }

    /**
     * @returns {Zcl.TsType.Cluster[]}
     */
    public getOutputClusters(): Zcl.TsType.Cluster[] {
        return this.clusterNumbersToClusters(this.outputClusters);
    }

    private clusterNumbersToClusters(clusterNumbers: number[]): Zcl.TsType.Cluster[] {
        return clusterNumbers.map((c) => Zcl.Utils.getCluster(c, this.getDevice().manufacturerID));
    }

    /*
     * CRUD
     */

    public static fromDatabaseRecord(
        record: KeyValue, deviceNetworkAddress: number, deviceIeeeAddress: string,
    ): Endpoint {
        // Migrate attrs to attributes
        for (const entry of Object.values(record.clusters).filter((e) => e.hasOwnProperty('attrs'))) {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            entry.attributes = entry.attrs;
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            delete entry.attrs;
        }

        return new Endpoint(
            record.epId, record.profId, record.devId, record.inClusterList, record.outClusterList, deviceNetworkAddress,
            deviceIeeeAddress, record.clusters, record.binds || [], record.configuredReportings || [],
            record.meta || {},
        );
    }

    public toDatabaseRecord(): KeyValue {
        return {
            profId: this.profileID, epId: this.ID, devId: this.deviceID,
            inClusterList: this.inputClusters, outClusterList: this.outputClusters, clusters: this.clusters,
            binds: this._binds, configuredReportings: this._configuredReportings, meta: this.meta,
        };
    }

    public static create(
        ID: number, profileID: number, deviceID: number, inputClusters: number[], outputClusters: number[],
        deviceNetworkAddress: number, deviceIeeeAddress: string,
    ): Endpoint {
        return new Endpoint(
            ID, profileID, deviceID, inputClusters, outputClusters, deviceNetworkAddress,
            deviceIeeeAddress, {}, [], [], {},
        );
    }

    public saveClusterAttributeKeyValue(clusterKey: number | string, list: KeyValue): void {
        const cluster = Zcl.Utils.getCluster(clusterKey);
        if (!this.clusters[cluster.name]) this.clusters[cluster.name] = {attributes: {}};

        for (const [attribute, value] of Object.entries(list)) {
            this.clusters[cluster.name].attributes[attribute] = value;
        }
    }

    public getClusterAttributeValue(clusterKey: number | string, attributeKey: number | string): number | string {
        const cluster = Zcl.Utils.getCluster(clusterKey);
        const attribute = cluster.getAttribute(attributeKey);
        if (this.clusters[cluster.name] && this.clusters[cluster.name].attributes) {
            return this.clusters[cluster.name].attributes[attribute.name];
        }

        return null;
    }

    public hasPendingRequests(): boolean {
        return this.pendingRequests.length > 0;
    }

    public async sendPendingRequests(fastPolling: boolean): Promise<void> {
        const handled: PendingRequest[] = [];
        for (const request of this.pendingRequests) {
            if ((fastPolling && request.sendWhen == 'fastpoll') || request.sendWhen == 'active') {
                try {
                    const result = await request.func();
                    request.resolve(result);
                } catch (error) {
                    request.reject(error);
                }
                handled.push(request);
            }
        }

        this.pendingRequests = this.pendingRequests.filter((r) => !handled.includes(r));
    }

    private async queueRequest<Type>(func: () => Promise<Type>, sendWhen: 'active' | 'fastpoll'): Promise<Type> {
        debug.info(`Sending to ${this.deviceIeeeAddress}/${this.ID} when active`);
        return new Promise((resolve, reject): void =>  {
            this.pendingRequests.push({func, resolve, reject, sendWhen});
        });
    }

    private async sendRequest<Type>(func: () => Promise<Type>, sendWhen: SendRequestWhen): Promise<Type> {
        // If we already have something queued, we queue directly to avoid
        // messing up the ordering too much.
        if (sendWhen !== 'immediate' && this.pendingRequests.length > 0) {
            return this.queueRequest(func, sendWhen);
        }

        try {
            return await func();
        } catch(error) {
            if (sendWhen === 'immediate') {
                throw(error);
            }
        }

        // If we got a failed transaction, the device is likely sleeping.
        // Queue for transmission later.
        return this.queueRequest(func, sendWhen);
    }

    /*
     * Zigbee functions
     */
    private checkStatus(payload: [{status: Zcl.Status}] | {cmdId: number; statusCode: number}): void {
        const codes = Array.isArray(payload) ? payload.map((i) => i.status) : [payload.statusCode];
        const invalid = codes.find((c) => c !== Zcl.Status.SUCCESS);
        if (invalid) throw new Zcl.ZclStatusError(invalid);
    }

    public async report(
        clusterKey: number | string, attributes: KeyValue, options?: Options
    ): Promise<void> {
        const cluster = Zcl.Utils.getCluster(clusterKey);
        options = this.getOptionsWithDefaults(options, true, Zcl.Direction.CLIENT_TO_SERVER, cluster.manufacturerCode);
        const payload: {attrId: number; dataType: number; attrData: number| string | boolean}[] = [];
        for (const [nameOrID, value] of Object.entries(attributes)) {
            if (cluster.hasAttribute(nameOrID)) {
                const attribute = cluster.getAttribute(nameOrID);
                payload.push({attrId: attribute.ID, attrData: value, dataType: attribute.type});
            } else if (!isNaN(Number(nameOrID))){
                payload.push({attrId: Number(nameOrID), attrData: value.value, dataType: value.type});
            } else {
                throw new Error(`Unknown attribute '${nameOrID}', specify either an existing attribute or a number`);
            }
        }

        const log = `Report to ${this.deviceIeeeAddress}/${this.ID} ` +
            `${cluster.name}(${JSON.stringify(attributes)}, ${JSON.stringify(options)})`;
        debug.info(log);

        try {
            const frame = Zcl.ZclFrame.create(
                Zcl.FrameType.GLOBAL, options.direction, options.disableDefaultResponse,
                options.manufacturerCode, options.transactionSequenceNumber ?? ZclTransactionSequenceNumber.next(),
                "report", cluster.ID, payload, options.reservedBits
            );

            await this.sendRequest(async () => {
                await Entity.adapter.sendZclFrameToEndpoint(
                    this.deviceIeeeAddress, this.deviceNetworkAddress, this.ID, frame, options.timeout,
                    options.disableResponse, options.disableRecovery, options.srcEndpoint,
                );
            }, options.sendWhen);
        } catch (error) {
            error.message = `${log} failed (${error.message})`;
            debug.error(error.message);
            throw error;
        }
    }

    public async write(
        clusterKey: number | string, attributes: KeyValue, options?: Options
    ): Promise<void> {
        const cluster = Zcl.Utils.getCluster(clusterKey);
        options = this.getOptionsWithDefaults(options, true, Zcl.Direction.CLIENT_TO_SERVER, cluster.manufacturerCode);
        const payload: {attrId: number; dataType: number; attrData: number| string | boolean}[] = [];
        for (const [nameOrID, value] of Object.entries(attributes)) {
            if (cluster.hasAttribute(nameOrID)) {
                const attribute = cluster.getAttribute(nameOrID);
                payload.push({attrId: attribute.ID, attrData: value, dataType: attribute.type});
            } else if (!isNaN(Number(nameOrID))){
                payload.push({attrId: Number(nameOrID), attrData: value.value, dataType: value.type});
            } else {
                throw new Error(`Unknown attribute '${nameOrID}', specify either an existing attribute or a number`);
            }
        }

        const log = `Write ${this.deviceIeeeAddress}/${this.ID} ` +
            `${cluster.name}(${JSON.stringify(attributes)}, ${JSON.stringify(options)})`;
        debug.info(log);

        try {
            const frame = Zcl.ZclFrame.create(
                Zcl.FrameType.GLOBAL, options.direction, options.disableDefaultResponse,
                options.manufacturerCode, options.transactionSequenceNumber ?? ZclTransactionSequenceNumber.next(),
                options.writeUndiv ? "writeUndiv" : "write", cluster.ID, payload, options.reservedBits
            );

            const result = await this.sendRequest(async () => {
                return Entity.adapter.sendZclFrameToEndpoint(
                    this.deviceIeeeAddress, this.deviceNetworkAddress, this.ID, frame, options.timeout,
                    options.disableResponse, options.disableRecovery, options.srcEndpoint,
                );
            }, options.sendWhen);

            if (!options.disableResponse) {
                this.checkStatus(result.frame.Payload);
            }
        } catch (error) {
            error.message = `${log} failed (${error.message})`;
            debug.error(error.message);
            throw error;
        }
    }

    public async writeResponse(
        clusterKey: number | string, transactionSequenceNumber: number, attributes: KeyValue, options?: Options
    ): Promise<void> {
        assert(!options || !options.hasOwnProperty('transactionSequenceNumber'), 'Use parameter');
        const cluster = Zcl.Utils.getCluster(clusterKey);
        options = this.getOptionsWithDefaults(options, true, Zcl.Direction.SERVER_TO_CLIENT, cluster.manufacturerCode);
        const payload: {status: number; attrId: number}[] = [];
        for (const [nameOrID, value] of Object.entries(attributes)) {
            if (value.hasOwnProperty('status')) {    
	        if (cluster.hasAttribute(nameOrID)) {
                    const attribute = cluster.getAttribute(nameOrID);
            	    payload.push({attrId: attribute.ID, status: value.status});
	        } else if (!isNaN(Number(nameOrID))){
            	    payload.push({attrId: Number(nameOrID), status: value.status});
	        } else {
		    throw new Error(`Unknown attribute '${nameOrID}', specify either an existing attribute or a number`);
	        }	        
	    } else {
	        throw new Error(`Missing attribute 'status'`);
	    }
        }

        const frame = Zcl.ZclFrame.create(
            Zcl.FrameType.GLOBAL, options.direction, options.disableDefaultResponse,
            options.manufacturerCode, transactionSequenceNumber, 'writeRsp', cluster.ID, payload, options.reservedBits
        );

        const log = `WriteResponse ${this.deviceIeeeAddress}/${this.ID} ` +
            `${cluster.name}(${JSON.stringify(attributes)}, ${JSON.stringify(options)})`;
        debug.info(log);

        try {
            await this.sendRequest(async () => {
                await Entity.adapter.sendZclFrameToEndpoint(
                    this.deviceIeeeAddress, this.deviceNetworkAddress, this.ID, frame, options.timeout,
                    options.disableResponse, options.disableRecovery, options.srcEndpoint
                );
            }, options.sendWhen);
        } catch (error) {
            error.message = `${log} failed (${error.message})`;
            debug.error(error.message);
            throw error;
        }
    }
    
    public async read(
        clusterKey: number | string, attributes: string[] | number [], options?: Options
    ): Promise<KeyValue> {
        const cluster = Zcl.Utils.getCluster(clusterKey);
        options = this.getOptionsWithDefaults(options, true, Zcl.Direction.CLIENT_TO_SERVER, cluster.manufacturerCode);
        const payload: {attrId: number}[] = [];
        for (const attribute of attributes) {
            payload.push({attrId: typeof attribute === 'number' ? attribute : cluster.getAttribute(attribute).ID});
        }

        const frame = Zcl.ZclFrame.create(
            Zcl.FrameType.GLOBAL, options.direction, options.disableDefaultResponse,
            options.manufacturerCode, options.transactionSequenceNumber ?? ZclTransactionSequenceNumber.next(), 'read',
            cluster.ID, payload, options.reservedBits
        );

        const log = `Read ${this.deviceIeeeAddress}/${this.ID} ` +
            `${cluster.name}(${JSON.stringify(attributes)}, ${JSON.stringify(options)})`;
        debug.info(log);

        try {
            const result = await this.sendRequest(async () => {
                return Entity.adapter.sendZclFrameToEndpoint(
                    this.deviceIeeeAddress, this.deviceNetworkAddress, this.ID, frame, options.timeout,
                    options.disableResponse, options.disableRecovery, options.srcEndpoint,
                );
            }, options.sendWhen);

            if (!options.disableResponse) {
                this.checkStatus(result.frame.Payload);
                return ZclFrameConverter.attributeKeyValue(result.frame);
            } else {
                return null;
            }
        } catch (error) {
            error.message = `${log} failed (${error.message})`;
            debug.error(error.message);
            throw error;
        }
    }

    public async readResponse(
        clusterKey: number | string, transactionSequenceNumber: number, attributes: KeyValue, options?: Options
    ): Promise<void> {
        assert(!options || !options.hasOwnProperty('transactionSequenceNumber'), 'Use parameter');
        const cluster = Zcl.Utils.getCluster(clusterKey);
        options = this.getOptionsWithDefaults(options, true, Zcl.Direction.SERVER_TO_CLIENT, cluster.manufacturerCode);
        const payload: {attrId: number; status: number; dataType: number; attrData: number | string}[] = [];
        for (const [nameOrID, value] of Object.entries(attributes)) {
            if (cluster.hasAttribute(nameOrID)) {
                const attribute = cluster.getAttribute(nameOrID);
                payload.push({attrId: attribute.ID, attrData: value, dataType: attribute.type, status: 0});
            } else if (!isNaN(Number(nameOrID))){
                payload.push({attrId: Number(nameOrID), attrData: value.value, dataType: value.type, status: 0});
            } else {
                throw new Error(`Unknown attribute '${nameOrID}', specify either an existing attribute or a number`);
            }
        }

        const frame = Zcl.ZclFrame.create(
            Zcl.FrameType.GLOBAL, options.direction, options.disableDefaultResponse,
            options.manufacturerCode, transactionSequenceNumber, 'readRsp', cluster.ID, payload, options.reservedBits
        );

        const log = `ReadResponse ${this.deviceIeeeAddress}/${this.ID} ` +
            `${cluster.name}(${JSON.stringify(attributes)}, ${JSON.stringify(options)})`;
        debug.info(log);

        try {
            await this.sendRequest(async () => {
                await Entity.adapter.sendZclFrameToEndpoint(
                    this.deviceIeeeAddress, this.deviceNetworkAddress, this.ID, frame, options.timeout,
                    options.disableResponse, options.disableRecovery, options.srcEndpoint
                );
            }, options.sendWhen);
        } catch (error) {
            error.message = `${log} failed (${error.message})`;
            debug.error(error.message);
            throw error;
        }
    }

    public addBinding(clusterKey: number | string, target: Endpoint | Group | number): void {
        const cluster = Zcl.Utils.getCluster(clusterKey);
        if (typeof target === 'number') {
            target = Group.byGroupID(target) || Group.create(target);
        }

        if (!this.binds.find((b) => b.cluster.ID === cluster.ID && b.target === target)) {
            if (target instanceof Group) {
                this._binds.push({cluster: cluster.ID, groupID: target.groupID, type: 'group'});
            } else {
                this._binds.push({
                    cluster: cluster.ID, type: 'endpoint', deviceIeeeAddress: target.deviceIeeeAddress,
                    endpointID: target.ID
                });
            }

            this.save();
        }
    }

    public async bind(clusterKey: number | string, target: Endpoint | Group | number): Promise<void> {
        const cluster = Zcl.Utils.getCluster(clusterKey);
        const type = target instanceof Endpoint ? 'endpoint' : 'group';
        if (typeof target === 'number') {
            target = Group.byGroupID(target) || Group.create(target);
        }

        const destinationAddress = target instanceof Endpoint ? target.deviceIeeeAddress : target.groupID;

        const log = `Bind ${this.deviceIeeeAddress}/${this.ID} ${cluster.name} from ` +
            `'${target instanceof Endpoint ? `${destinationAddress}/${target.ID}` : destinationAddress}'`;
        debug.info(log);

        try {
            await Entity.adapter.bind(
                this.deviceNetworkAddress, this.deviceIeeeAddress, this.ID, cluster.ID, destinationAddress, type,
                target instanceof Endpoint ? target.ID : null,
            );

            this.addBinding(clusterKey, target);
        } catch (error) {
            error.message = `${log} failed (${error.message})`;
            debug.error(error.message);
            throw error;
        }
    }

    public save(): void {
        this.getDevice().save();
    }

    public async unbind(clusterKey: number | string, target: Endpoint | Group | number): Promise<void> {
        const cluster = Zcl.Utils.getCluster(clusterKey);
        const type = target instanceof Endpoint ? 'endpoint' : 'group';

        const destinationAddress =
            target instanceof Endpoint ? target.deviceIeeeAddress : (target instanceof Group ? target.groupID : target);

        const log = `Unbind ${this.deviceIeeeAddress}/${this.ID} ${cluster.name} from ` +
            `'${target instanceof Endpoint ? `${destinationAddress}/${target.ID}` : destinationAddress}'`;
        debug.info(log);

        try {
            await Entity.adapter.unbind(
                this.deviceNetworkAddress, this.deviceIeeeAddress, this.ID, cluster.ID, destinationAddress, type,
                target instanceof Endpoint ? target.ID : null,
            );

            if (typeof target === 'number' && Group.byGroupID(target)) {
                target = Group.byGroupID(target);
            }

            const index = this.binds.findIndex((b) => b.cluster.ID === cluster.ID && b.target === target);
            if (index !== -1) {
                this._binds.splice(index, 1);
                this.save();
            }
        } catch (error) {
            error.message = `${log} failed (${error.message})`;
            debug.error(error.message);
            throw error;
        }
    }

    public async defaultResponse(
        commandID: number, status: number, clusterID: number, transactionSequenceNumber: number, options?: Options
    ): Promise<void> {
        assert(!options || !options.hasOwnProperty('transactionSequenceNumber'), 'Use parameter');
        options = this.getOptionsWithDefaults(options, true, Zcl.Direction.SERVER_TO_CLIENT, null);
        const payload = {cmdId: commandID, statusCode: status};
        const frame = Zcl.ZclFrame.create(
            Zcl.FrameType.GLOBAL, options.direction, options.disableDefaultResponse,
            options.manufacturerCode, transactionSequenceNumber, 'defaultRsp', clusterID, payload, options.reservedBits
        );

        const log = `DefaultResponse ${this.deviceIeeeAddress}/${this.ID} ` +
            `${clusterID}(${commandID}, ${JSON.stringify(options)})`;
        debug.info(log);

        try {
            await this.sendRequest(async () => {
                await Entity.adapter.sendZclFrameToEndpoint(
                    this.deviceIeeeAddress, this.deviceNetworkAddress, this.ID, frame, options.timeout,
                    options.disableResponse, options.disableRecovery, options.srcEndpoint
                );
            }, options.sendWhen);
        } catch (error) {
            error.message = `${log} failed (${error.message})`;
            debug.error(error.message);
            throw error;
        }
    }

    public async configureReporting(
        clusterKey: number | string, items: ConfigureReportingItem[], options?: Options
    ): Promise<void> {
        const cluster = Zcl.Utils.getCluster(clusterKey);
        options = this.getOptionsWithDefaults(options, true, Zcl.Direction.CLIENT_TO_SERVER, cluster.manufacturerCode);
        const payload = items.map((item): KeyValue => {
            let dataType, attrId;

            if (typeof item.attribute === 'object') {
                dataType = item.attribute.type;
                attrId = item.attribute.ID;
            } else {
                /* istanbul ignore else */
                if (cluster.hasAttribute(item.attribute)) {
                    const attribute = cluster.getAttribute(item.attribute);
                    dataType = attribute.type;
                    attrId = attribute.ID;
                }
            }

            return {
                direction: Zcl.Direction.CLIENT_TO_SERVER,
                attrId, dataType,
                minRepIntval: item.minimumReportInterval,
                maxRepIntval: item.maximumReportInterval,
                repChange: item.reportableChange,
            };
        });

        const frame = Zcl.ZclFrame.create(
            Zcl.FrameType.GLOBAL, options.direction, options.disableDefaultResponse,
            options.manufacturerCode, options.transactionSequenceNumber ?? ZclTransactionSequenceNumber.next(),
            'configReport', cluster.ID, payload, options.reservedBits
        );

        const log = `ConfigureReporting ${this.deviceIeeeAddress}/${this.ID} ` +
            `${cluster.name}(${JSON.stringify(items)}, ${JSON.stringify(options)})`;
        debug.info(log);

        try {
            const result = await this.sendRequest(async () => {
                return Entity.adapter.sendZclFrameToEndpoint(
                    this.deviceIeeeAddress, this.deviceNetworkAddress, this.ID, frame, options.timeout,
                    options.disableResponse, options.disableRecovery, options.srcEndpoint
                );
            }, options.sendWhen);

            if (!options.disableResponse) {
                this.checkStatus(result.frame.Payload);
            }

            for (const e of payload) {
                const match = this._configuredReportings.find(c => c.attrId === e.attrId && c.cluster === cluster.ID);
                if (match) {
                    this._configuredReportings.splice(this._configuredReportings.indexOf(match), 1);
                }
            }

            for (const entry of payload) {
                if (entry.maxRepIntval !== 0xFFFF) {
                    this._configuredReportings.push({
                        cluster: cluster.ID, attrId: entry.attrId, minRepIntval: entry.minRepIntval,
                        maxRepIntval: entry.maxRepIntval, repChange: entry.repChange,
                    });
                }
            }

            this.save();
        } catch (error) {
            error.message = `${log} failed (${error.message})`;
            debug.error(error.message);
            throw error;
        }
    }

    public async writeStructured(clusterKey: number | string, payload: KeyValue, options?: Options): Promise<void> {
        const cluster = Zcl.Utils.getCluster(clusterKey);
        options = this.getOptionsWithDefaults(
            options, true, Zcl.Direction.CLIENT_TO_SERVER, cluster.manufacturerCode);

        const frame = Zcl.ZclFrame.create(
            Zcl.FrameType.GLOBAL, options.direction, options.disableDefaultResponse,
            options.manufacturerCode, options.transactionSequenceNumber ?? ZclTransactionSequenceNumber.next(),
            `writeStructured`, cluster.ID, payload, options.reservedBits
        );

        const log = `WriteStructured ${this.deviceIeeeAddress}/${this.ID} ` +
            `${cluster.name}(${JSON.stringify(payload)}, ${JSON.stringify(options)})`;
        debug.info(log);

        try {
            await this.sendRequest(async () => {
                await Entity.adapter.sendZclFrameToEndpoint(
                    this.deviceIeeeAddress, this.deviceNetworkAddress, this.ID, frame, options.timeout,
                    options.disableResponse, options.disableRecovery, options.srcEndpoint
                );
            }, options.sendWhen);

            // TODO: support `writeStructuredResponse`
        } catch (error) {
            error.message = `${log} failed (${error.message})`;
            debug.error(error.message);
            throw error;
        }
    }

    public async command(
        clusterKey: number | string, commandKey: number | string, payload: KeyValue, options?: Options,
    ): Promise<void | KeyValue> {
        const cluster = Zcl.Utils.getCluster(clusterKey);
        const command = cluster.getCommand(commandKey);
        const hasResponse = command.hasOwnProperty('response');
        options = this.getOptionsWithDefaults(
            options, hasResponse, Zcl.Direction.CLIENT_TO_SERVER, cluster.manufacturerCode);

        const frame = Zcl.ZclFrame.create(
            Zcl.FrameType.SPECIFIC, options.direction, options.disableDefaultResponse,
            options.manufacturerCode, options.transactionSequenceNumber ?? ZclTransactionSequenceNumber.next(),
            command.name, cluster.ID, payload, options.reservedBits
        );

        const log = `Command ${this.deviceIeeeAddress}/${this.ID} ` +
            `${cluster.name}.${command.name}(${JSON.stringify(payload)}, ${JSON.stringify(options)})`;
        debug.info(log);

        try {
            const result = await this.sendRequest(async () => {
                return Entity.adapter.sendZclFrameToEndpoint(
                    this.deviceIeeeAddress, this.deviceNetworkAddress, this.ID, frame, options.timeout,
                    options.disableResponse, options.disableRecovery, options.srcEndpoint
                );
            }, options.sendWhen);

            if (result) {
                return result.frame.Payload;
            }
        } catch (error) {
            error.message = `${log} failed (${error.message})`;
            debug.error(error.message);
            throw error;
        }
    }

    public async commandResponse(
        clusterKey: number | string, commandKey: number | string, payload: KeyValue, options?: Options,
        transactionSequenceNumber?: number
    ): Promise<void | KeyValue> {
        assert(!options || !options.hasOwnProperty('transactionSequenceNumber'), 'Use parameter');
        const cluster = Zcl.Utils.getCluster(clusterKey);
        const command = cluster.getCommandResponse(commandKey);
        transactionSequenceNumber = transactionSequenceNumber || ZclTransactionSequenceNumber.next();
        options = this.getOptionsWithDefaults(options, true, Zcl.Direction.SERVER_TO_CLIENT, cluster.manufacturerCode);

        const frame = Zcl.ZclFrame.create(
            Zcl.FrameType.SPECIFIC, options.direction, options.disableDefaultResponse,
            options.manufacturerCode, transactionSequenceNumber, command.ID, cluster.ID, payload, options.reservedBits
        );

        const log = `CommandResponse ${this.deviceIeeeAddress}/${this.ID} ` +
            `${cluster.name}.${command.name}(${JSON.stringify(payload)}, ${JSON.stringify(options)})`;
        debug.info(log);

        try {
            await this.sendRequest(async () => {
                await Entity.adapter.sendZclFrameToEndpoint(
                    this.deviceIeeeAddress, this.deviceNetworkAddress, this.ID, frame, options.timeout,
                    options.disableResponse, options.disableRecovery, options.srcEndpoint
                );
            }, options.sendWhen);
        } catch (error) {
            error.message = `${log} failed (${error.message})`;
            debug.error(error.message);
            throw error;
        }
    }

    public waitForCommand(
        clusterKey: number | string, commandKey: number | string, transactionSequenceNumber: number, timeout: number,
    ): {promise: Promise<{header: KeyValue; payload: KeyValue}>; cancel: () => void} {
        const cluster = Zcl.Utils.getCluster(clusterKey);
        const command = cluster.getCommand(commandKey);
        const waiter = Entity.adapter.waitFor(
            this.deviceNetworkAddress, this.ID, Zcl.FrameType.SPECIFIC, Zcl.Direction.CLIENT_TO_SERVER,
            transactionSequenceNumber, cluster.ID, command.ID, timeout
        );

        const promise = new Promise<{header: KeyValue; payload: KeyValue}>((resolve, reject) => {
            waiter.promise.then(
                (payload) => resolve({header: payload.frame.Header, payload: payload.frame.Payload}),
                (error) => reject(error),
            );
        });

        return {promise, cancel: waiter.cancel};
    }

    private getOptionsWithDefaults(
        options: Options, disableDefaultResponse: boolean, direction: Zcl.Direction, manufacturerCode: number,
    ): Options {
        const providedOptions = options || {};
        return {
            sendWhen: this.getDevice().defaultSendRequestWhen,
            timeout: 10000,
            disableResponse: false,
            disableRecovery: false,
            disableDefaultResponse,
            direction,
            srcEndpoint: null,
            reservedBits: 0,
            manufacturerCode: manufacturerCode ? manufacturerCode : null,
            transactionSequenceNumber: null,
            writeUndiv: false,
            ...providedOptions
        };
    }

    public async addToGroup(group: Group): Promise<void> {
        await this.command('genGroups', 'add', {groupid: group.groupID, groupname: ''});
        group.addMember(this);
    }

    /**
     * Remove endpoint from a group, accepts both a Group and number as parameter.
     * The number parameter type should only be used when removing from a group which is not known
     * to zigbee-herdsman.
     */
    public async removeFromGroup(group: Group | number): Promise<void> {
        await this.command('genGroups', 'remove', {groupid: group instanceof Group ? group.groupID : group});
        if (group instanceof Group) {
            group.removeMember(this);
        }
    }

    public async removeFromAllGroups(): Promise<void> {
        await this.command('genGroups', 'removeAll', {}, {disableDefaultResponse: true});
        this.removeFromAllGroupsDatabase();
    }

    public removeFromAllGroupsDatabase(): void {
        for (const group of Group.all()) {
            if (group.hasMember(this)) {
                group.removeMember(this);
            }
        }
    }
}

export default Endpoint;
