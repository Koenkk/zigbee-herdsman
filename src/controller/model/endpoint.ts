import assert from 'node:assert';

import {Events as AdapterEvents} from '../../adapter';
import {logger} from '../../utils/logger';
import * as ZSpec from '../../zspec';
import {BroadcastAddress} from '../../zspec/enums';
import {EUI64} from '../../zspec/tstypes';
import * as Zcl from '../../zspec/zcl';
import * as ZclTypes from '../../zspec/zcl/definition/tstype';
import * as Zdo from '../../zspec/zdo';
import Request from '../helpers/request';
import RequestQueue from '../helpers/requestQueue';
import * as ZclFrameConverter from '../helpers/zclFrameConverter';
import ZclTransactionSequenceNumber from '../helpers/zclTransactionSequenceNumber';
import {KeyValue, SendPolicy} from '../tstype';
import Device from './device';
import Entity from './entity';
import Group from './group';

const NS = 'zh:controller:endpoint';

export interface ConfigureReportingItem {
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
    sendPolicy?: SendPolicy;
}

interface OptionsWithDefaults extends Options {
    disableDefaultResponse: boolean;
    disableResponse: boolean;
    timeout: number;
    direction: Zcl.Direction;
    reservedBits: number;
    disableRecovery: boolean;
    writeUndiv: boolean;
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
    cluster: ZclTypes.Cluster;
    target: Endpoint | Group;
}

interface ConfiguredReportingInternal {
    cluster: number;
    attrId: number;
    minRepIntval: number;
    maxRepIntval: number;
    repChange: number;
    manufacturerCode?: number | undefined;
}

interface ConfiguredReporting {
    cluster: ZclTypes.Cluster;
    attribute: ZclTypes.Attribute;
    minimumReportInterval: number;
    maximumReportInterval: number;
    reportableChange: number;
}

export class Endpoint extends Entity {
    public deviceID?: number;
    public inputClusters: number[];
    public outputClusters: number[];
    public profileID?: number;
    public readonly ID: number;
    public readonly clusters: Clusters;
    public deviceIeeeAddress: string;
    public deviceNetworkAddress: number;
    private _binds: BindInternal[];
    private _configuredReportings: ConfiguredReportingInternal[];
    public meta: KeyValue;
    private pendingRequests: RequestQueue;

    // Getters/setters
    get binds(): Bind[] {
        const binds: Bind[] = [];

        for (const bind of this._binds) {
            // XXX: properties assumed valid when associated to `type`
            const target: Group | Endpoint | undefined =
                bind.type === 'endpoint' ? Device.byIeeeAddr(bind.deviceIeeeAddress!)?.getEndpoint(bind.endpointID!) : Group.byGroupID(bind.groupID!);

            if (target) {
                binds.push({target, cluster: this.getCluster(bind.cluster)});
            }
        }

        return binds;
    }

    get configuredReportings(): ConfiguredReporting[] {
        return this._configuredReportings.map((entry, index) => {
            const cluster = Zcl.Utils.getCluster(entry.cluster, entry.manufacturerCode, this.getDevice().customClusters);
            const attribute: ZclTypes.Attribute = cluster.hasAttribute(entry.attrId)
                ? cluster.getAttribute(entry.attrId)
                : {ID: entry.attrId, name: `attr${index}`, type: Zcl.DataType.UNKNOWN, manufacturerCode: undefined};

            return {
                cluster,
                attribute,
                minimumReportInterval: entry.minRepIntval,
                maximumReportInterval: entry.maxRepIntval,
                reportableChange: entry.repChange,
            };
        });
    }

    private constructor(
        ID: number,
        profileID: number | undefined,
        deviceID: number | undefined,
        inputClusters: number[],
        outputClusters: number[],
        deviceNetworkAddress: number,
        deviceIeeeAddress: string,
        clusters: Clusters,
        binds: BindInternal[],
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
        this.pendingRequests = new RequestQueue(this);
    }

    /**
     * Get device of this endpoint
     */
    public getDevice(): Device {
        return Device.byIeeeAddr(this.deviceIeeeAddress)!; // XXX: no way for device to not exist?
    }

    /**
     * @param {number|string} clusterKey
     * @returns {boolean}
     */
    public supportsInputCluster(clusterKey: number | string): boolean {
        const cluster = this.getCluster(clusterKey);
        return this.inputClusters.includes(cluster.ID);
    }

    /**
     * @param {number|string} clusterKey
     * @returns {boolean}
     */
    public supportsOutputCluster(clusterKey: number | string): boolean {
        const cluster = this.getCluster(clusterKey);
        return this.outputClusters.includes(cluster.ID);
    }

    /**
     * @returns {ZclTypes.Cluster[]}
     */
    public getInputClusters(): ZclTypes.Cluster[] {
        return this.clusterNumbersToClusters(this.inputClusters);
    }

    /**
     * @returns {ZclTypes.Cluster[]}
     */
    public getOutputClusters(): ZclTypes.Cluster[] {
        return this.clusterNumbersToClusters(this.outputClusters);
    }

    private clusterNumbersToClusters(clusterNumbers: number[]): ZclTypes.Cluster[] {
        return clusterNumbers.map((c) => this.getCluster(c));
    }

    /*
     * CRUD
     */

    public static fromDatabaseRecord(record: KeyValue, deviceNetworkAddress: number, deviceIeeeAddress: string): Endpoint {
        // Migrate attrs to attributes
        for (const entryKey in record.clusters) {
            const entry = record.clusters[entryKey];

            if (entry.attrs != undefined) {
                entry.attributes = entry.attrs;
                delete entry.attrs;
            }
        }

        return new Endpoint(
            record.epId,
            record.profId,
            record.devId,
            record.inClusterList,
            record.outClusterList,
            deviceNetworkAddress,
            deviceIeeeAddress,
            record.clusters,
            record.binds || [],
            record.configuredReportings || [],
            record.meta || {},
        );
    }

    public toDatabaseRecord(): KeyValue {
        return {
            profId: this.profileID,
            epId: this.ID,
            devId: this.deviceID,
            inClusterList: this.inputClusters,
            outClusterList: this.outputClusters,
            clusters: this.clusters,
            binds: this._binds,
            configuredReportings: this._configuredReportings,
            meta: this.meta,
        };
    }

    public static create(
        ID: number,
        profileID: number | undefined,
        deviceID: number | undefined,
        inputClusters: number[],
        outputClusters: number[],
        deviceNetworkAddress: number,
        deviceIeeeAddress: string,
    ): Endpoint {
        return new Endpoint(ID, profileID, deviceID, inputClusters, outputClusters, deviceNetworkAddress, deviceIeeeAddress, {}, [], [], {});
    }

    public saveClusterAttributeKeyValue(clusterKey: number | string, list: KeyValue): void {
        const cluster = this.getCluster(clusterKey);
        if (!this.clusters[cluster.name]) this.clusters[cluster.name] = {attributes: {}};

        for (const [attribute, value] of Object.entries(list)) {
            this.clusters[cluster.name].attributes[attribute] = value;
        }
    }

    public getClusterAttributeValue(clusterKey: number | string, attributeKey: number | string): number | string | undefined {
        const cluster = this.getCluster(clusterKey);
        const attribute = cluster.getAttribute(attributeKey);

        if (this.clusters[cluster.name] && this.clusters[cluster.name].attributes) {
            return this.clusters[cluster.name].attributes[attribute.name];
        }

        return undefined;
    }

    public hasPendingRequests(): boolean {
        return this.pendingRequests.size > 0;
    }

    public async sendPendingRequests(fastPolling: boolean): Promise<void> {
        return await this.pendingRequests.send(fastPolling);
    }

    private async sendRequest(frame: Zcl.Frame, options: OptionsWithDefaults): Promise<AdapterEvents.ZclPayload>;
    private async sendRequest<Type>(frame: Zcl.Frame, options: OptionsWithDefaults, func: (frame: Zcl.Frame) => Promise<Type>): Promise<Type>;
    private async sendRequest<Type>(
        frame: Zcl.Frame,
        options: OptionsWithDefaults,
        func: (d: Zcl.Frame) => Promise<Type> = (d: Zcl.Frame): Promise<Type> => {
            return Entity.adapter!.sendZclFrameToEndpoint(
                this.deviceIeeeAddress,
                this.deviceNetworkAddress,
                this.ID,
                d,
                options.timeout,
                options.disableResponse,
                options.disableRecovery,
                options.srcEndpoint,
            ) as Promise<Type>;
        },
    ): Promise<Type> {
        const logPrefix = `Request Queue (${this.deviceIeeeAddress}/${this.ID}): `;
        const device = this.getDevice();
        const request = new Request(func, frame, device.pendingRequestTimeout, options.sendPolicy);

        if (request.sendPolicy !== 'bulk') {
            // Check if such a request is already in the queue and remove the old one(s) if necessary
            this.pendingRequests.filter(request);
        }

        // send without queueing if sendPolicy is 'immediate' or if the device has no timeout set
        if (request.sendPolicy === 'immediate' || !device.pendingRequestTimeout) {
            if (device.pendingRequestTimeout > 0) {
                logger.debug(logPrefix + `send ${frame.command.name} request immediately (sendPolicy=${options.sendPolicy})`, NS);
            }
            return await request.send();
        }
        // If this is a bulk message, we queue directly.
        if (request.sendPolicy === 'bulk') {
            logger.debug(logPrefix + `queue request (${this.pendingRequests.size})`, NS);
            return await this.pendingRequests.queue(request);
        }

        try {
            logger.debug(logPrefix + `send request`, NS);
            return await request.send();
        } catch (error) {
            // If we got a failed transaction, the device is likely sleeping.
            // Queue for transmission later.
            logger.debug(logPrefix + `queue request (transaction failed) (${error})`, NS);
            return await this.pendingRequests.queue(request);
        }
    }

    /*
     * Zigbee functions
     */
    private checkStatus(payload: [{status: Zcl.Status}] | {cmdId: number; statusCode: number}): void {
        const codes = Array.isArray(payload) ? payload.map((i) => i.status) : [payload.statusCode];
        const invalid = codes.find((c) => c !== Zcl.Status.SUCCESS);
        if (invalid) throw new Zcl.StatusError(invalid);
    }

    public async report(clusterKey: number | string, attributes: KeyValue, options?: Options): Promise<void> {
        const cluster = this.getCluster(clusterKey);
        const payload: {attrId: number; dataType: number; attrData: number | string | boolean}[] = [];

        for (const [nameOrID, value] of Object.entries(attributes)) {
            if (cluster.hasAttribute(nameOrID)) {
                const attribute = cluster.getAttribute(nameOrID);
                payload.push({attrId: attribute.ID, attrData: value, dataType: attribute.type});
            } else if (!isNaN(Number(nameOrID))) {
                payload.push({attrId: Number(nameOrID), attrData: value.value, dataType: value.type});
            } else {
                throw new Error(`Unknown attribute '${nameOrID}', specify either an existing attribute or a number`);
            }
        }

        await this.zclCommand(clusterKey, 'report', payload, options, attributes);
    }

    public async write(clusterKey: number | string, attributes: KeyValue, options?: Options): Promise<void> {
        const cluster = this.getCluster(clusterKey);
        const optionsWithDefaults = this.getOptionsWithDefaults(options, true, Zcl.Direction.CLIENT_TO_SERVER, cluster.manufacturerCode);
        optionsWithDefaults.manufacturerCode = this.ensureManufacturerCodeIsUniqueAndGet(
            cluster,
            Object.keys(attributes),
            optionsWithDefaults.manufacturerCode,
            'write',
        );

        const payload: {attrId: number; dataType: number; attrData: number | string | boolean}[] = [];
        for (const [nameOrID, value] of Object.entries(attributes)) {
            if (cluster.hasAttribute(nameOrID)) {
                const attribute = cluster.getAttribute(nameOrID);
                payload.push({attrId: attribute.ID, attrData: value, dataType: attribute.type});
            } else if (!isNaN(Number(nameOrID))) {
                payload.push({attrId: Number(nameOrID), attrData: value.value, dataType: value.type});
            } else {
                throw new Error(`Unknown attribute '${nameOrID}', specify either an existing attribute or a number`);
            }
        }

        await this.zclCommand(clusterKey, optionsWithDefaults.writeUndiv ? 'writeUndiv' : 'write', payload, optionsWithDefaults, attributes, true);
    }

    public async writeResponse(
        clusterKey: number | string,
        transactionSequenceNumber: number,
        attributes: KeyValue,
        options?: Options,
    ): Promise<void> {
        assert(options?.transactionSequenceNumber === undefined, 'Use parameter');
        const cluster = this.getCluster(clusterKey);
        const payload: {status: number; attrId: number}[] = [];

        for (const [nameOrID, value] of Object.entries(attributes)) {
            if (value.status !== undefined) {
                if (cluster.hasAttribute(nameOrID)) {
                    const attribute = cluster.getAttribute(nameOrID);
                    payload.push({attrId: attribute.ID, status: value.status});
                } else if (!isNaN(Number(nameOrID))) {
                    payload.push({attrId: Number(nameOrID), status: value.status});
                } else {
                    throw new Error(`Unknown attribute '${nameOrID}', specify either an existing attribute or a number`);
                }
            } else {
                throw new Error(`Missing attribute 'status'`);
            }
        }

        await this.zclCommand(
            clusterKey,
            'writeRsp',
            payload,
            {direction: Zcl.Direction.SERVER_TO_CLIENT, ...options, transactionSequenceNumber},
            attributes,
        );
    }

    public async read(clusterKey: number | string, attributes: (string | number)[], options?: Options): Promise<KeyValue> {
        const device = this.getDevice();
        const cluster = this.getCluster(clusterKey, device);
        const optionsWithDefaults = this.getOptionsWithDefaults(options, true, Zcl.Direction.CLIENT_TO_SERVER, cluster.manufacturerCode);
        optionsWithDefaults.manufacturerCode = this.ensureManufacturerCodeIsUniqueAndGet(
            cluster,
            attributes,
            optionsWithDefaults.manufacturerCode,
            'read',
        );

        const payload: {attrId: number}[] = [];
        for (const attribute of attributes) {
            payload.push({attrId: typeof attribute === 'number' ? attribute : cluster.getAttribute(attribute).ID});
        }

        const resultFrame = await this.zclCommand(clusterKey, 'read', payload, optionsWithDefaults, attributes, true);

        if (resultFrame) {
            return ZclFrameConverter.attributeKeyValue(resultFrame, device.manufacturerID, device.customClusters);
        }

        return {};
    }

    public async readResponse(
        clusterKey: number | string,
        transactionSequenceNumber: number,
        attributes: KeyValue,
        options?: Options,
    ): Promise<void> {
        assert(options?.transactionSequenceNumber === undefined, 'Use parameter');

        const cluster = this.getCluster(clusterKey);
        const payload: {attrId: number; status: number; dataType: number; attrData: number | string}[] = [];
        for (const [nameOrID, value] of Object.entries(attributes)) {
            if (cluster.hasAttribute(nameOrID)) {
                const attribute = cluster.getAttribute(nameOrID);
                payload.push({attrId: attribute.ID, attrData: value, dataType: attribute.type, status: 0});
            } else if (!isNaN(Number(nameOrID))) {
                payload.push({attrId: Number(nameOrID), attrData: value.value, dataType: value.type, status: 0});
            } else {
                throw new Error(`Unknown attribute '${nameOrID}', specify either an existing attribute or a number`);
            }
        }

        await this.zclCommand(
            clusterKey,
            'readRsp',
            payload,
            {direction: Zcl.Direction.SERVER_TO_CLIENT, ...options, transactionSequenceNumber},
            attributes,
        );
    }

    public async updateSimpleDescriptor(): Promise<void> {
        const clusterId = Zdo.ClusterId.SIMPLE_DESCRIPTOR_REQUEST;
        const zdoPayload = Zdo.Buffalo.buildRequest(Entity.adapter!.hasZdoMessageOverhead, clusterId, this.deviceNetworkAddress, this.ID);
        const response = await Entity.adapter!.sendZdo(this.deviceIeeeAddress, this.deviceNetworkAddress, clusterId, zdoPayload, false);

        if (!Zdo.Buffalo.checkStatus(response)) {
            throw new Zdo.StatusError(response[0]);
        }

        const simpleDescriptor = response[1];

        this.profileID = simpleDescriptor.profileId;
        this.deviceID = simpleDescriptor.deviceId;
        this.inputClusters = simpleDescriptor.inClusterList;
        this.outputClusters = simpleDescriptor.outClusterList;
    }

    public hasBind(clusterId: number, target: Endpoint | Group): boolean {
        return this.getBindIndex(clusterId, target) !== -1;
    }

    public getBindIndex(clusterId: number, target: Endpoint | Group): number {
        return this.binds.findIndex((b) => b.cluster.ID === clusterId && b.target === target);
    }

    public addBinding(clusterKey: number | string, target: Endpoint | Group | number): void {
        const cluster = this.getCluster(clusterKey);

        if (typeof target === 'number') {
            target = Group.byGroupID(target) || Group.create(target);
        }

        this.addBindingInternal(cluster, target);
    }

    private addBindingInternal(cluster: ZclTypes.Cluster, target: Endpoint | Group): void {
        if (!this.hasBind(cluster.ID, target)) {
            if (target instanceof Group) {
                this._binds.push({cluster: cluster.ID, groupID: target.groupID, type: 'group'});
            } else {
                this._binds.push({
                    cluster: cluster.ID,
                    type: 'endpoint',
                    deviceIeeeAddress: target.deviceIeeeAddress,
                    endpointID: target.ID,
                });
            }

            this.save();
        }
    }

    public async bind(clusterKey: number | string, target: Endpoint | Group | number): Promise<void> {
        const cluster = this.getCluster(clusterKey);

        if (typeof target === 'number') {
            target = Group.byGroupID(target) || Group.create(target);
        }

        const destinationAddress = target instanceof Endpoint ? target.deviceIeeeAddress : target.groupID;

        const log = `Bind ${this.deviceIeeeAddress}/${this.ID} ${cluster.name} from '${target instanceof Endpoint ? `${destinationAddress}/${target.ID}` : destinationAddress}'`;
        logger.debug(log, NS);

        try {
            const zdoClusterId = Zdo.ClusterId.BIND_REQUEST;
            const zdoPayload = Zdo.Buffalo.buildRequest(
                Entity.adapter!.hasZdoMessageOverhead,
                zdoClusterId,
                this.deviceIeeeAddress as EUI64,
                this.ID,
                cluster.ID,
                target instanceof Endpoint ? Zdo.UNICAST_BINDING : Zdo.MULTICAST_BINDING,
                target instanceof Endpoint ? (target.deviceIeeeAddress as EUI64) : ZSpec.BLANK_EUI64,
                target instanceof Group ? target.groupID : 0,
                target instanceof Endpoint ? target.ID : 0xff,
            );

            const response = await Entity.adapter!.sendZdo(this.deviceIeeeAddress, this.deviceNetworkAddress, zdoClusterId, zdoPayload, false);

            if (!Zdo.Buffalo.checkStatus(response)) {
                throw new Zdo.StatusError(response[0]);
            }

            this.addBindingInternal(cluster, target);
        } catch (error) {
            const err = error as Error;
            err.message = `${log} failed (${err.message})`;
            logger.debug(err.stack!, NS);
            throw error;
        }
    }

    public save(): void {
        this.getDevice().save();
    }

    public async unbind(clusterKey: number | string, target: Endpoint | Group | number): Promise<void> {
        const cluster = this.getCluster(clusterKey);
        const action = `Unbind ${this.deviceIeeeAddress}/${this.ID} ${cluster.name}`;

        if (typeof target === 'number') {
            const groupTarget = Group.byGroupID(target);

            if (!groupTarget) {
                throw new Error(`${action} invalid target '${target}' (no group with this ID exists).`);
            }

            target = groupTarget;
        }

        const destinationAddress = target instanceof Endpoint ? target.deviceIeeeAddress : target.groupID;
        const log = `${action} from '${target instanceof Endpoint ? `${destinationAddress}/${target.ID}` : destinationAddress}'`;
        const index = this.getBindIndex(cluster.ID, target);

        if (index === -1) {
            logger.debug(`${log} no bind present, skipping.`, NS);
            return;
        }

        logger.debug(log, NS);

        try {
            const zdoClusterId = Zdo.ClusterId.UNBIND_REQUEST;
            const zdoPayload = Zdo.Buffalo.buildRequest(
                Entity.adapter!.hasZdoMessageOverhead,
                zdoClusterId,
                this.deviceIeeeAddress as EUI64,
                this.ID,
                cluster.ID,
                target instanceof Endpoint ? Zdo.UNICAST_BINDING : Zdo.MULTICAST_BINDING,
                target instanceof Endpoint ? (target.deviceIeeeAddress as EUI64) : ZSpec.BLANK_EUI64,
                target instanceof Group ? target.groupID : 0,
                target instanceof Endpoint ? target.ID : 0xff,
            );

            const response = await Entity.adapter!.sendZdo(this.deviceIeeeAddress, this.deviceNetworkAddress, zdoClusterId, zdoPayload, false);

            if (!Zdo.Buffalo.checkStatus(response)) {
                if (response[0] === Zdo.Status.NO_ENTRY) {
                    logger.debug(`${log} no entry on device, removing entry from database.`, NS);
                } else {
                    throw new Zdo.StatusError(response[0]);
                }
            }

            this._binds.splice(index, 1);
            this.save();
        } catch (error) {
            const err = error as Error;
            err.message = `${log} failed (${err.message})`;
            logger.debug(err.stack!, NS);
            throw error;
        }
    }

    public async defaultResponse(
        commandID: number,
        status: number,
        clusterID: number,
        transactionSequenceNumber: number,
        options?: Options,
    ): Promise<void> {
        assert(options?.transactionSequenceNumber === undefined, 'Use parameter');
        const payload = {cmdId: commandID, statusCode: status};
        await this.zclCommand(clusterID, 'defaultRsp', payload, {direction: Zcl.Direction.SERVER_TO_CLIENT, ...options, transactionSequenceNumber});
    }

    public async configureReporting(clusterKey: number | string, items: ConfigureReportingItem[], options?: Options): Promise<void> {
        const cluster = this.getCluster(clusterKey);
        const optionsWithDefaults = this.getOptionsWithDefaults(options, true, Zcl.Direction.CLIENT_TO_SERVER, cluster.manufacturerCode);
        optionsWithDefaults.manufacturerCode = this.ensureManufacturerCodeIsUniqueAndGet(
            cluster,
            items,
            optionsWithDefaults.manufacturerCode,
            'configureReporting',
        );

        const payload = items.map((item): KeyValue => {
            let dataType, attrId;

            if (typeof item.attribute === 'object') {
                dataType = item.attribute.type;
                attrId = item.attribute.ID;
            } else {
                if (cluster.hasAttribute(item.attribute)) {
                    const attribute = cluster.getAttribute(item.attribute);
                    dataType = attribute.type;
                    attrId = attribute.ID;
                }
            }

            return {
                direction: Zcl.Direction.CLIENT_TO_SERVER,
                attrId,
                dataType,
                minRepIntval: item.minimumReportInterval,
                maxRepIntval: item.maximumReportInterval,
                repChange: item.reportableChange,
            };
        });

        await this.zclCommand(clusterKey, 'configReport', payload, optionsWithDefaults, items, true);

        for (const e of payload) {
            this._configuredReportings = this._configuredReportings.filter(
                (c) =>
                    !(
                        c.attrId === e.attrId &&
                        c.cluster === cluster.ID &&
                        (!('manufacturerCode' in c) || c.manufacturerCode === optionsWithDefaults.manufacturerCode)
                    ),
            );
        }

        for (const entry of payload) {
            if (entry.maxRepIntval !== 0xffff) {
                this._configuredReportings.push({
                    cluster: cluster.ID,
                    attrId: entry.attrId,
                    minRepIntval: entry.minRepIntval,
                    maxRepIntval: entry.maxRepIntval,
                    repChange: entry.repChange,
                    manufacturerCode: optionsWithDefaults.manufacturerCode,
                });
            }
        }

        this.save();
    }

    public async writeStructured(clusterKey: number | string, payload: KeyValue, options?: Options): Promise<void> {
        await this.zclCommand(clusterKey, 'writeStructured', payload, options);
        // TODO: support `writeStructuredResponse`
    }

    public async command(clusterKey: number | string, commandKey: number | string, payload: KeyValue, options?: Options): Promise<void | KeyValue> {
        const frame = await this.zclCommand(clusterKey, commandKey, payload, options, undefined, false, Zcl.FrameType.SPECIFIC);
        if (frame) {
            return frame.payload;
        }
    }

    public async commandResponse(
        clusterKey: number | string,
        commandKey: number | string,
        payload: KeyValue,
        options?: Options,
        transactionSequenceNumber?: number,
    ): Promise<void | KeyValue> {
        assert(options?.transactionSequenceNumber === undefined, 'Use parameter');

        const device = this.getDevice();
        const cluster = this.getCluster(clusterKey, device);
        const command = cluster.getCommandResponse(commandKey);
        transactionSequenceNumber = transactionSequenceNumber || ZclTransactionSequenceNumber.next();
        const optionsWithDefaults = this.getOptionsWithDefaults(options, true, Zcl.Direction.SERVER_TO_CLIENT, cluster.manufacturerCode);

        const frame = Zcl.Frame.create(
            Zcl.FrameType.SPECIFIC,
            optionsWithDefaults.direction,
            optionsWithDefaults.disableDefaultResponse,
            optionsWithDefaults.manufacturerCode,
            transactionSequenceNumber,
            command.name,
            cluster.name,
            payload,
            device.customClusters,
            optionsWithDefaults.reservedBits,
        );

        const createLogMessage = (): string =>
            `CommandResponse ${this.deviceIeeeAddress}/${this.ID} ` +
            `${cluster.name}.${command.name}(${JSON.stringify(payload)}, ${JSON.stringify(optionsWithDefaults)})`;
        logger.debug(createLogMessage, NS);

        try {
            await this.sendRequest(frame, optionsWithDefaults, async (f) => {
                // Broadcast Green Power responses
                if (this.ID === 242) {
                    await Entity.adapter!.sendZclFrameToAll(242, f, 242, BroadcastAddress.RX_ON_WHEN_IDLE);
                } else {
                    await Entity.adapter!.sendZclFrameToEndpoint(
                        this.deviceIeeeAddress,
                        this.deviceNetworkAddress,
                        this.ID,
                        f,
                        optionsWithDefaults.timeout,
                        optionsWithDefaults.disableResponse,
                        optionsWithDefaults.disableRecovery,
                        optionsWithDefaults.srcEndpoint,
                    );
                }
            });
        } catch (error) {
            const err = error as Error;
            err.message = `${createLogMessage()} failed (${err.message})`;
            logger.debug(err.stack!, NS);
            throw error;
        }
    }

    public waitForCommand(
        clusterKey: number | string,
        commandKey: number | string,
        transactionSequenceNumber: number | undefined,
        timeout: number,
    ): {promise: Promise<{header: Zcl.Header; payload: KeyValue}>; cancel: () => void} {
        const device = this.getDevice();
        const cluster = this.getCluster(clusterKey, device);
        const command = cluster.getCommand(commandKey);
        const waiter = Entity.adapter!.waitFor(
            this.deviceNetworkAddress,
            this.ID,
            Zcl.FrameType.SPECIFIC,
            Zcl.Direction.CLIENT_TO_SERVER,
            transactionSequenceNumber,
            cluster.ID,
            command.ID,
            timeout,
        );

        const promise = new Promise<{header: Zcl.Header; payload: KeyValue}>((resolve, reject) => {
            waiter.promise.then(
                (payload) => {
                    const frame = Zcl.Frame.fromBuffer(payload.clusterID, payload.header, payload.data, device.customClusters);
                    resolve({header: frame.header, payload: frame.payload});
                },
                (error) => reject(error),
            );
        });

        return {promise, cancel: waiter.cancel};
    }

    private getOptionsWithDefaults(
        options: Options | undefined,
        disableDefaultResponse: boolean,
        direction: Zcl.Direction,
        manufacturerCode: number | undefined,
    ): OptionsWithDefaults {
        return {
            timeout: 10000,
            disableResponse: false,
            disableRecovery: false,
            disableDefaultResponse,
            direction,
            srcEndpoint: undefined,
            reservedBits: 0,
            manufacturerCode,
            transactionSequenceNumber: undefined,
            writeUndiv: false,
            ...(options || {}),
        };
    }

    private ensureManufacturerCodeIsUniqueAndGet(
        cluster: ZclTypes.Cluster,
        attributes: (string | number)[] | ConfigureReportingItem[],
        fallbackManufacturerCode: number | undefined, // XXX: problematic undefined for a "fallback"?
        caller: string,
    ): number | undefined {
        const manufacturerCodes = new Set(
            attributes.map((nameOrID): number | undefined => {
                let attributeID;

                if (typeof nameOrID == 'object') {
                    // ConfigureReportingItem
                    if (typeof nameOrID.attribute !== 'object') {
                        attributeID = nameOrID.attribute;
                    } else {
                        return fallbackManufacturerCode;
                    }
                } else {
                    // string || number
                    attributeID = nameOrID;
                }

                // we fall back to caller|cluster provided manufacturerCode
                if (cluster.hasAttribute(attributeID)) {
                    const attribute = cluster.getAttribute(attributeID);
                    return attribute.manufacturerCode === undefined ? fallbackManufacturerCode : attribute.manufacturerCode;
                } else {
                    // unknown attribute, we should not fail on this here
                    return fallbackManufacturerCode;
                }
            }),
        );

        if (manufacturerCodes.size == 1) {
            return manufacturerCodes.values().next().value;
        } else {
            throw new Error(`Cannot have attributes with different manufacturerCode in single '${caller}' call`);
        }
    }

    public async addToGroup(group: Group): Promise<void> {
        await this.command('genGroups', 'add', {groupid: group.groupID, groupname: ''});
        group.addMember(this);
    }

    private getCluster(clusterKey: number | string, device: Device | undefined = undefined): ZclTypes.Cluster {
        device = device ?? this.getDevice();
        return Zcl.Utils.getCluster(clusterKey, device.manufacturerID, device.customClusters);
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
        for (const group of Group.allIterator()) {
            if (group.hasMember(this)) {
                group.removeMember(this);
            }
        }
    }

    public async zclCommand(
        clusterKey: number | string,
        commandKey: number | string,
        payload: KeyValue,
        options?: Options,
        logPayload?: KeyValue,
        checkStatus: boolean = false,
        frameType: Zcl.FrameType = Zcl.FrameType.GLOBAL,
    ): Promise<void | Zcl.Frame> {
        const device = this.getDevice();
        const cluster = this.getCluster(clusterKey, device);
        const command = frameType == Zcl.FrameType.GLOBAL ? Zcl.Utils.getGlobalCommand(commandKey) : cluster.getCommand(commandKey);
        const hasResponse = frameType == Zcl.FrameType.GLOBAL ? true : command.response != undefined;
        const optionsWithDefaults = this.getOptionsWithDefaults(options, hasResponse, Zcl.Direction.CLIENT_TO_SERVER, cluster.manufacturerCode);

        const frame = Zcl.Frame.create(
            frameType,
            optionsWithDefaults.direction,
            optionsWithDefaults.disableDefaultResponse,
            optionsWithDefaults.manufacturerCode,
            optionsWithDefaults.transactionSequenceNumber ?? ZclTransactionSequenceNumber.next(),
            command.name,
            cluster.name,
            payload,
            device.customClusters,
            optionsWithDefaults.reservedBits,
        );

        const createLogMessage = (): string =>
            `ZCL command ${this.deviceIeeeAddress}/${this.ID} ` +
            `${cluster.name}.${command.name}(${JSON.stringify(logPayload ? logPayload : payload)}, ${JSON.stringify(optionsWithDefaults)})`;
        logger.debug(createLogMessage, NS);

        try {
            const result = await this.sendRequest(frame, optionsWithDefaults);

            if (result) {
                const resultFrame = Zcl.Frame.fromBuffer(result.clusterID, result.header, result.data, device.customClusters);
                if (result && checkStatus && !optionsWithDefaults.disableResponse) {
                    this.checkStatus(resultFrame.payload);
                }
                return resultFrame;
            }
        } catch (error) {
            const err = error as Error;
            err.message = `${createLogMessage()} failed (${err.message})`;
            logger.debug(err.stack!, NS);
            throw error;
        }
    }

    public async zclCommandBroadcast(
        endpoint: number,
        destination: BroadcastAddress,
        clusterKey: number | string,
        commandKey: number | string,
        payload: unknown,
        options?: Options,
    ): Promise<void> {
        const device = this.getDevice();
        const cluster = this.getCluster(clusterKey, device);
        const command = cluster.getCommand(commandKey);
        const optionsWithDefaults = this.getOptionsWithDefaults(options, true, Zcl.Direction.CLIENT_TO_SERVER, cluster.manufacturerCode);
        const sourceEndpoint = optionsWithDefaults.srcEndpoint ?? this.ID;

        const frame = Zcl.Frame.create(
            Zcl.FrameType.SPECIFIC,
            optionsWithDefaults.direction,
            true,
            optionsWithDefaults.manufacturerCode,
            optionsWithDefaults.transactionSequenceNumber ?? ZclTransactionSequenceNumber.next(),
            command.name,
            cluster.name,
            payload,
            device.customClusters,
            optionsWithDefaults.reservedBits,
        );

        logger.debug(
            () =>
                `ZCL command broadcast ${this.deviceIeeeAddress}/${sourceEndpoint} to ${destination}/${endpoint} ` +
                `${cluster.name}.${command.name}(${JSON.stringify({payload, optionsWithDefaults})})`,
            NS,
        );

        // if endpoint===0xFF ("broadcast endpoint"), deliver to all endpoints supporting cluster, should be avoided whenever possible
        await Entity.adapter!.sendZclFrameToAll(endpoint, frame, sourceEndpoint, destination);
    }
}

export default Endpoint;
