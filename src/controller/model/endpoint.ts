import assert from "node:assert";
import type {Events as AdapterEvents} from "../../adapter";
import {logger} from "../../utils/logger";
import * as ZSpec from "../../zspec";
import {BroadcastAddress} from "../../zspec/enums";
import type {Eui64} from "../../zspec/tstypes";
import * as Zcl from "../../zspec/zcl";
import type {TFoundation} from "../../zspec/zcl/definition/clusters-types";
import type * as ZclTypes from "../../zspec/zcl/definition/tstype";
import * as Zdo from "../../zspec/zdo";
import Request from "../helpers/request";
import RequestQueue from "../helpers/requestQueue";
import * as ZclFrameConverter from "../helpers/zclFrameConverter";
import zclTransactionSequenceNumber from "../helpers/zclTransactionSequenceNumber";
import type {
    ClusterOrRawAttributeKeys,
    ClusterOrRawAttributes,
    ClusterOrRawPayload,
    ClusterOrRawWriteAttributes,
    FoundationOrRawPayload,
    KeyValue,
    PartialClusterOrRawWriteAttributes,
    SendPolicy,
    TCustomCluster,
} from "../tstype";
import Device from "./device";
import Entity from "./entity";
import Group from "./group";
import {ZigbeeEntity} from "./zigbeeEntity";

const NS = "zh:controller:endpoint";

export interface ConfigureReportingItem<Cl extends string | number, Custom extends TCustomCluster | undefined = undefined> {
    attribute: ClusterOrRawAttributeKeys<Cl, Custom>[number] | {ID: number; type: number};
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
    type: "endpoint" | "group";
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

export class Endpoint extends ZigbeeEntity {
    public deviceID?: number;
    public inputClusters: number[];
    public outputClusters: number[];
    public profileID?: number;
    // biome-ignore lint/style/useNamingConvention: cross-repo impact
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
                // biome-ignore lint/style/noNonNullAssertion: ignored using `--suppress`
                bind.type === "endpoint" ? Device.byIeeeAddr(bind.deviceIeeeAddress!)?.getEndpoint(bind.endpointID!) : Group.byGroupID(bind.groupID!);

            if (target) {
                binds.push({target, cluster: this.getCluster(bind.cluster)});
            }
        }

        return binds;
    }

    get configuredReportings(): ConfiguredReporting[] {
        const device = this.getDevice();

        return this._configuredReportings.map((entry, index) => {
            const cluster = Zcl.Utils.getCluster(entry.cluster, entry.manufacturerCode, device.customClusters);
            const attribute: ZclTypes.Attribute = cluster.getAttribute(entry.attrId) ?? {
                ID: entry.attrId,
                name: `attr${index}`,
                type: Zcl.DataType.UNKNOWN,
                manufacturerCode: undefined,
            };

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
        id: number,
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
        this.ID = id;
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
        const device = Device.byIeeeAddr(this.deviceIeeeAddress);

        if (!device) {
            logger.error(`Tried to get unknown/deleted device ${this.deviceIeeeAddress} from endpoint ${this.ID}.`, NS);
            // biome-ignore lint/style/noNonNullAssertion: ignored using `--suppress`
            logger.debug(new Error().stack!, NS);
        }

        // biome-ignore lint/style/noNonNullAssertion: ignored using `--suppress`
        return device!;
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

            if (entry.attrs != null) {
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
        id: number,
        profileID: number | undefined,
        deviceID: number | undefined,
        inputClusters: number[],
        outputClusters: number[],
        deviceNetworkAddress: number,
        deviceIeeeAddress: string,
    ): Endpoint {
        return new Endpoint(id, profileID, deviceID, inputClusters, outputClusters, deviceNetworkAddress, deviceIeeeAddress, {}, [], [], {});
    }

    public saveClusterAttributeKeyValue(clusterKey: number | string, list: KeyValue): void {
        const cluster = this.getCluster(clusterKey);

        if (!this.clusters[cluster.name]) {
            this.clusters[cluster.name] = {attributes: {}};
        }

        for (const attribute in list) {
            this.clusters[cluster.name].attributes[attribute] = list[attribute];
        }
    }

    public getClusterAttributeValue(clusterKey: number | string, attributeKey: number | string): number | string | undefined {
        const cluster = this.getCluster(clusterKey);

        if (this.clusters[cluster.name] && this.clusters[cluster.name].attributes) {
            // XXX: used to throw (behavior changed in #1455)
            const attribute = cluster.getAttribute(attributeKey);

            if (attribute) {
                return this.clusters[cluster.name].attributes[attribute.name];
            }
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
    private async sendRequest<Type>(frame: Zcl.Frame, options: OptionsWithDefaults, func: () => Promise<Type>): Promise<Type>;
    private async sendRequest<Type>(
        frame: Zcl.Frame,
        options: OptionsWithDefaults,
        func: () => Promise<Type> = (): Promise<Type> => {
            return Entity.adapter.sendZclFrameToEndpoint(
                this.deviceIeeeAddress,
                this.deviceNetworkAddress,
                this.ID,
                frame,
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

        if (request.sendPolicy !== "bulk") {
            // Check if such a request is already in the queue and remove the old one(s) if necessary
            this.pendingRequests.filter(request);
        }

        // send without queueing if sendPolicy is 'immediate' or if the device has no timeout set
        if (request.sendPolicy === "immediate" || !device.pendingRequestTimeout) {
            if (device.pendingRequestTimeout > 0) {
                logger.debug(`${logPrefix}send ${frame.command.name} request immediately (sendPolicy=${options.sendPolicy})`, NS);
            }
            return await request.send();
        }
        // If this is a bulk message, we queue directly.
        if (request.sendPolicy === "bulk") {
            logger.debug(`${logPrefix}queue request (${this.pendingRequests.size})`, NS);
            return await this.pendingRequests.queue(request);
        }

        try {
            logger.debug(`${logPrefix}send request`, NS);
            return await request.send();
        } catch (error) {
            // If we got a failed transaction, the device is likely sleeping.
            // Queue for transmission later.
            logger.debug(`${logPrefix}queue request (transaction failed) (${error})`, NS);
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

    public async report<Cl extends number | string, Custom extends TCustomCluster | undefined = undefined>(
        clusterKey: Cl,
        attributes: PartialClusterOrRawWriteAttributes<Cl, Custom>,
        options?: Options,
    ): Promise<void> {
        const cluster = this.getCluster(clusterKey, undefined, options?.manufacturerCode);
        const payload: TFoundation["report"] = [];

        for (const nameOrID in attributes) {
            const attribute = cluster.getAttribute(nameOrID);

            if (attribute) {
                payload.push({attrId: attribute.ID, attrData: attributes[nameOrID], dataType: attribute.type});
            } else if (!Number.isNaN(Number(nameOrID))) {
                const value = attributes[nameOrID];

                payload.push({attrId: Number(nameOrID), attrData: value.value, dataType: value.type});
            } else {
                throw new Error(`Unknown attribute '${nameOrID}', specify either an existing attribute or a number`);
            }
        }

        await this.zclCommand(cluster, "report", payload, options, attributes);
    }

    public async write<Cl extends number | string, Custom extends TCustomCluster | undefined = undefined>(
        clusterKey: Cl,
        attributes: PartialClusterOrRawWriteAttributes<Cl, Custom>,
        options?: Options,
    ): Promise<void> {
        const cluster = this.getCluster(clusterKey, undefined, options?.manufacturerCode);
        const optionsWithDefaults = this.getOptionsWithDefaults(options, true, Zcl.Direction.CLIENT_TO_SERVER, cluster.manufacturerCode);
        optionsWithDefaults.manufacturerCode = this.ensureManufacturerCodeIsUniqueAndGet<Cl, Custom>(
            cluster,
            Object.keys(attributes),
            optionsWithDefaults.manufacturerCode,
            "write",
        );
        const payload: TFoundation["write"] = [];

        for (const nameOrID in attributes) {
            const attribute = cluster.getAttribute(nameOrID);

            if (attribute) {
                payload.push({attrId: attribute.ID, attrData: attributes[nameOrID], dataType: attribute.type});
            } else if (!Number.isNaN(Number(nameOrID))) {
                const value = attributes[nameOrID];

                payload.push({attrId: Number(nameOrID), attrData: value.value, dataType: value.type});
            } else {
                throw new Error(`Unknown attribute '${nameOrID}', specify either an existing attribute or a number`);
            }
        }

        await this.zclCommand(cluster, optionsWithDefaults.writeUndiv ? "writeUndiv" : "write", payload, optionsWithDefaults, attributes, true);
    }

    public async writeResponse<Cl extends number | string, Custom extends TCustomCluster | undefined = undefined>(
        clusterKey: Cl,
        transactionSequenceNumber: number,
        attributes: Partial<Record<ClusterOrRawAttributeKeys<Cl, Custom>[number], TFoundation["writeRsp"][number]>> &
            Record<number, TFoundation["writeRsp"][number]>,
        options?: Options,
    ): Promise<void> {
        assert(options?.transactionSequenceNumber === undefined, "Use parameter");
        const cluster = this.getCluster(clusterKey, undefined, options?.manufacturerCode);
        const payload: TFoundation["writeRsp"] = [];

        for (const nameOrID in attributes) {
            // biome-ignore lint/style/noNonNullAssertion: from loop
            const value = attributes[nameOrID]!;

            if (value.status !== undefined) {
                const attribute = cluster.getAttribute(nameOrID);

                if (attribute) {
                    payload.push({attrId: attribute.ID, status: value.status});
                } else if (!Number.isNaN(Number(nameOrID))) {
                    payload.push({attrId: Number(nameOrID), status: value.status});
                } else {
                    throw new Error(`Unknown attribute '${nameOrID}', specify either an existing attribute or a number`);
                }
            } else {
                throw new Error(`Missing attribute 'status'`);
            }
        }

        await this.zclCommand(
            cluster,
            "writeRsp",
            payload,
            {direction: Zcl.Direction.SERVER_TO_CLIENT, ...options, transactionSequenceNumber},
            attributes,
        );
    }

    // XXX: ideally, the return type should limit to the contents of the `attributes` param
    public async read<Cl extends number | string, Custom extends TCustomCluster | undefined = undefined>(
        clusterKey: Cl,
        attributes: ClusterOrRawAttributeKeys<Cl, Custom>,
        options?: Options,
    ): Promise<ClusterOrRawAttributes<Cl, Custom>> {
        const device = this.getDevice();
        const cluster = this.getCluster(clusterKey, device, options?.manufacturerCode);
        const optionsWithDefaults = this.getOptionsWithDefaults(options, true, Zcl.Direction.CLIENT_TO_SERVER, cluster.manufacturerCode);
        optionsWithDefaults.manufacturerCode = this.ensureManufacturerCodeIsUniqueAndGet<Cl, Custom>(
            cluster,
            attributes,
            optionsWithDefaults.manufacturerCode,
            "read",
        );
        const payload: TFoundation["read"] = [];

        for (const attribute of attributes) {
            if (typeof attribute === "number") {
                payload.push({attrId: attribute});
            } else {
                const attr = cluster.getAttribute(attribute);

                if (attr) {
                    payload.push({attrId: attr.ID});
                } else {
                    logger.warning(`Ignoring unknown attribute ${attribute} in cluster ${cluster.name}`, NS);
                }
            }
        }

        const resultFrame = await this.zclCommand(cluster, "read", payload, optionsWithDefaults, attributes, true);

        return resultFrame
            ? ZclFrameConverter.attributeKeyValue<Cl, Custom>(resultFrame, device.manufacturerID, device.customClusters)
            : ({} as ClusterOrRawWriteAttributes<Cl, Custom>);
    }

    public async readResponse<Cl extends number | string, Custom extends TCustomCluster | undefined = undefined>(
        clusterKey: Cl,
        transactionSequenceNumber: number,
        attributes: PartialClusterOrRawWriteAttributes<Cl, Custom>,
        options?: Options,
    ): Promise<void> {
        assert(options?.transactionSequenceNumber === undefined, "Use parameter");

        const cluster = this.getCluster(clusterKey, undefined, options?.manufacturerCode);
        const payload: TFoundation["readRsp"] = [];

        for (const nameOrID in attributes) {
            const attribute = cluster.getAttribute(nameOrID);

            if (attribute) {
                payload.push({attrId: attribute.ID, attrData: attributes[nameOrID], dataType: attribute.type, status: 0});
            } else if (!Number.isNaN(Number(nameOrID))) {
                const value = attributes[nameOrID];

                payload.push({attrId: Number(nameOrID), attrData: value.value, dataType: value.type, status: 0});
            } else {
                throw new Error(`Unknown attribute '${nameOrID}', specify either an existing attribute or a number`);
            }
        }

        await this.zclCommand(
            cluster,
            "readRsp",
            payload,
            {direction: Zcl.Direction.SERVER_TO_CLIENT, ...options, transactionSequenceNumber},
            attributes,
        );
    }

    public async updateSimpleDescriptor(): Promise<void> {
        const clusterId = Zdo.ClusterId.SIMPLE_DESCRIPTOR_REQUEST;
        const zdoPayload = Zdo.Buffalo.buildRequest(Entity.adapter.hasZdoMessageOverhead, clusterId, this.deviceNetworkAddress, this.ID);
        const response = await Entity.adapter.sendZdo(this.deviceIeeeAddress, this.deviceNetworkAddress, clusterId, zdoPayload, false);

        if (!Zdo.Buffalo.checkStatus<Zdo.ClusterId.SIMPLE_DESCRIPTOR_RESPONSE>(response)) {
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

        if (typeof target === "number") {
            target = Group.byGroupID(target) || Group.create(target);
        }

        this.addBindingInternal(cluster, target);
    }

    private addBindingInternal(cluster: ZclTypes.Cluster, target: Endpoint | Group): void {
        if (!this.hasBind(cluster.ID, target)) {
            if (target instanceof Group) {
                this._binds.push({cluster: cluster.ID, groupID: target.groupID, type: "group"});
            } else {
                this._binds.push({
                    cluster: cluster.ID,
                    type: "endpoint",
                    deviceIeeeAddress: target.deviceIeeeAddress,
                    endpointID: target.ID,
                });
            }

            this.save();
        }
    }

    public async bind(clusterKey: number | string, target: Endpoint | Group | number): Promise<void> {
        const cluster = this.getCluster(clusterKey);

        if (typeof target === "number") {
            target = Group.byGroupID(target) || Group.create(target);
        }

        const destinationAddress = target instanceof Endpoint ? target.deviceIeeeAddress : target.groupID;

        const log = `Bind ${this.deviceIeeeAddress}/${this.ID} ${cluster.name} from '${target instanceof Endpoint ? `${destinationAddress}/${target.ID}` : destinationAddress}'`;
        logger.debug(log, NS);

        try {
            const zdoClusterId = Zdo.ClusterId.BIND_REQUEST;
            const zdoPayload = Zdo.Buffalo.buildRequest(
                Entity.adapter.hasZdoMessageOverhead,
                zdoClusterId,
                this.deviceIeeeAddress as Eui64,
                this.ID,
                cluster.ID,
                target instanceof Endpoint ? Zdo.UNICAST_BINDING : Zdo.MULTICAST_BINDING,
                target instanceof Endpoint ? (target.deviceIeeeAddress as Eui64) : ZSpec.BLANK_EUI64,
                target instanceof Group ? target.groupID : 0,
                target instanceof Endpoint ? target.ID : 0xff,
            );

            const response = await Entity.adapter.sendZdo(this.deviceIeeeAddress, this.deviceNetworkAddress, zdoClusterId, zdoPayload, false);

            if (!Zdo.Buffalo.checkStatus<Zdo.ClusterId.BIND_RESPONSE>(response)) {
                throw new Zdo.StatusError(response[0]);
            }

            this.addBindingInternal(cluster, target);
        } catch (error) {
            const err = error as Error;
            err.message = `${log} failed (${err.message})`;
            // biome-ignore lint/style/noNonNullAssertion: ignored using `--suppress`
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

        if (typeof target === "number") {
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
                Entity.adapter.hasZdoMessageOverhead,
                zdoClusterId,
                this.deviceIeeeAddress as Eui64,
                this.ID,
                cluster.ID,
                target instanceof Endpoint ? Zdo.UNICAST_BINDING : Zdo.MULTICAST_BINDING,
                target instanceof Endpoint ? (target.deviceIeeeAddress as Eui64) : ZSpec.BLANK_EUI64,
                target instanceof Group ? target.groupID : 0,
                target instanceof Endpoint ? target.ID : 0xff,
            );

            const response = await Entity.adapter.sendZdo(this.deviceIeeeAddress, this.deviceNetworkAddress, zdoClusterId, zdoPayload, false);

            if (!Zdo.Buffalo.checkStatus<Zdo.ClusterId.UNBIND_RESPONSE>(response)) {
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
            // biome-ignore lint/style/noNonNullAssertion: ignored using `--suppress`
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
        assert(options?.transactionSequenceNumber === undefined, "Use parameter");
        const payload = {cmdId: commandID, statusCode: status};
        await this.zclCommand(clusterID, "defaultRsp", payload, {direction: Zcl.Direction.SERVER_TO_CLIENT, ...options, transactionSequenceNumber});
    }

    public async configureReporting<Cl extends number | string, Custom extends TCustomCluster | undefined = undefined>(
        clusterKey: Cl,
        items: ConfigureReportingItem<Cl, Custom>[],
        options?: Options,
    ): Promise<void> {
        const cluster = this.getCluster(clusterKey, undefined, options?.manufacturerCode);
        const optionsWithDefaults = this.getOptionsWithDefaults(options, true, Zcl.Direction.CLIENT_TO_SERVER, cluster.manufacturerCode);
        optionsWithDefaults.manufacturerCode = this.ensureManufacturerCodeIsUniqueAndGet<Cl, Custom>(
            cluster,
            items,
            optionsWithDefaults.manufacturerCode,
            "configureReporting",
        );

        const payload = items.map((item): TFoundation["configReport"][number] => {
            let dataType: number;
            let attrId: number;

            if (typeof item.attribute === "object") {
                dataType = item.attribute.type;
                attrId = item.attribute.ID;
            } else {
                const attribute = cluster.getAttribute(item.attribute);

                if (attribute) {
                    dataType = attribute.type;
                    attrId = attribute.ID;
                } else {
                    throw new Error(`Invalid attribute '${item.attribute}' for cluster '${clusterKey}'`);
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

        await this.zclCommand(cluster, "configReport", payload, optionsWithDefaults, items, true);

        for (const e of payload) {
            this._configuredReportings = this._configuredReportings.filter(
                (c) =>
                    !(
                        c.attrId === e.attrId &&
                        c.cluster === cluster.ID &&
                        (!("manufacturerCode" in c) || c.manufacturerCode === optionsWithDefaults.manufacturerCode)
                    ),
            );
        }

        for (const entry of payload) {
            if (entry.maxRepIntval !== 0xffff) {
                this._configuredReportings.push({
                    cluster: cluster.ID,
                    attrId: entry.attrId,
                    minRepIntval: entry.minRepIntval as number,
                    maxRepIntval: entry.maxRepIntval as number,
                    // expects items[].attribute to always point to a number DataType
                    repChange: entry.repChange as number,
                    manufacturerCode: optionsWithDefaults.manufacturerCode,
                });
            }
        }

        this.save();
    }

    public async writeStructured<Cl extends number | string>(
        clusterKey: Cl,
        payload: TFoundation["writeStructured"],
        options?: Options,
    ): Promise<void> {
        await this.zclCommand(clusterKey, "writeStructured", payload, options);
        // TODO: support `writeStructuredResponse`
    }

    public async command<Cl extends number | string, Co extends number | string, Custom extends TCustomCluster | undefined = undefined>(
        clusterKey: Cl,
        commandKey: Co,
        payload: ClusterOrRawPayload<Cl, Co, Custom>,
        options?: Options,
    ): Promise<undefined | KeyValue> {
        const frame = await this.zclCommand(clusterKey, commandKey, payload, options, undefined, false, Zcl.FrameType.SPECIFIC);
        if (frame) {
            return frame.payload;
        }
    }

    public async commandResponse<Cl extends number | string, Co extends number | string, Custom extends TCustomCluster | undefined = undefined>(
        clusterKey: Cl,
        commandKey: Co,
        payload: ClusterOrRawPayload<Cl, Co, Custom>,
        options?: Options,
        transactionSequenceNumber?: number,
    ): Promise<void> {
        assert(options?.transactionSequenceNumber === undefined, "Use parameter");

        const device = this.getDevice();
        const cluster = this.getCluster(clusterKey, device, options?.manufacturerCode);
        const command = cluster.getCommandResponse(commandKey);
        transactionSequenceNumber = transactionSequenceNumber || zclTransactionSequenceNumber.next();
        const optionsWithDefaults = this.getOptionsWithDefaults(options, true, Zcl.Direction.SERVER_TO_CLIENT, cluster.manufacturerCode);

        const frame = Zcl.Frame.create(
            Zcl.FrameType.SPECIFIC,
            optionsWithDefaults.direction,
            optionsWithDefaults.disableDefaultResponse,
            optionsWithDefaults.manufacturerCode,
            transactionSequenceNumber,
            command,
            cluster,
            payload,
            device.customClusters,
            optionsWithDefaults.reservedBits,
        );

        const createLogMessage = (): string =>
            `CommandResponse ${this.deviceIeeeAddress}/${this.ID} ` +
            `${cluster.name}.${command.name}(${JSON.stringify(payload)}, ${JSON.stringify(optionsWithDefaults)})`;
        logger.debug(createLogMessage, NS);

        try {
            // Broadcast Green Power responses
            if (this.ID === 242) {
                await this.sendRequest(frame, optionsWithDefaults, async () => {
                    await Entity.adapter.sendZclFrameToAll(242, frame, 242, BroadcastAddress.RX_ON_WHEN_IDLE);
                });
            } else {
                await this.sendRequest(frame, optionsWithDefaults);
            }
        } catch (error) {
            const err = error as Error;
            err.message = `${createLogMessage()} failed (${err.message})`;
            // biome-ignore lint/style/noNonNullAssertion: ignored using `--suppress`
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
        const waiter = Entity.adapter.waitFor(
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
                    try {
                        const frame = Zcl.Frame.fromBuffer(payload.clusterID, payload.header, payload.data, device.customClusters);
                        resolve({header: frame.header, payload: frame.payload});
                    } catch (error) {
                        reject(error);
                    }
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

    private ensureManufacturerCodeIsUniqueAndGet<Cl extends string | number, Custom extends TCustomCluster | undefined = undefined>(
        cluster: ZclTypes.Cluster,
        attributes: (string | number)[] | ConfigureReportingItem<Cl, Custom>[],
        fallbackManufacturerCode: number | undefined, // XXX: problematic undefined for a "fallback"?
        caller: string,
    ): number | undefined {
        const manufacturerCodes = new Set(
            attributes.map((nameOrID): number | undefined => {
                let attributeID: number | string;

                if (typeof nameOrID === "object") {
                    // ConfigureReportingItem
                    if (typeof nameOrID.attribute !== "object") {
                        attributeID = nameOrID.attribute;
                    } else {
                        return fallbackManufacturerCode;
                    }
                } else {
                    // string || number
                    attributeID = nameOrID;
                }

                // we fall back to caller|cluster provided manufacturerCode
                const attribute = cluster.getAttribute(attributeID);

                if (attribute) {
                    return attribute.manufacturerCode === undefined ? fallbackManufacturerCode : attribute.manufacturerCode;
                }

                // unknown attribute, we should not fail on this here
                return fallbackManufacturerCode;
            }),
        );

        if (manufacturerCodes.size === 1) {
            return manufacturerCodes.values().next().value;
        }

        throw new Error(`Cannot have attributes with different manufacturerCode in single '${caller}' call`);
    }

    public async addToGroup(group: Group): Promise<void> {
        await this.command("genGroups", "add", {groupid: group.groupID, groupname: ""});
        group.addMember(this);
    }

    private getCluster(
        clusterKey: number | string,
        device: Device | undefined = undefined,
        manufacturerCode: number | undefined = undefined,
    ): ZclTypes.Cluster {
        if (!device) {
            device = this.getDevice();
        }

        return Zcl.Utils.getCluster(clusterKey, manufacturerCode ?? device.manufacturerID, device.customClusters);
    }

    /**
     * Remove endpoint from a group, accepts both a Group and number as parameter.
     * The number parameter type should only be used when removing from a group which is not known
     * to zigbee-herdsman.
     */
    public async removeFromGroup(group: Group | number): Promise<void> {
        await this.command("genGroups", "remove", {groupid: group instanceof Group ? group.groupID : group});
        if (group instanceof Group) {
            group.removeMember(this);
        }
    }

    public async removeFromAllGroups(): Promise<void> {
        await this.command("genGroups", "removeAll", {}, {disableDefaultResponse: true});
        this.removeFromAllGroupsDatabase();
    }

    public removeFromAllGroupsDatabase(): void {
        for (const group of Group.allIterator()) {
            if (group.hasMember(this)) {
                group.removeMember(this);
            }
        }
    }

    public async zclCommand<Cl extends number | string, Co extends number | string, Custom extends TCustomCluster | undefined = undefined>(
        clusterKey: Cl | ZclTypes.Cluster,
        commandKey: Co | ZclTypes.Command,
        payload: ClusterOrRawPayload<Cl, Co, Custom> | FoundationOrRawPayload<Co>,
        options?: Options,
        logPayload?: KeyValue,
        checkStatus = false,
        frameType: Zcl.FrameType = Zcl.FrameType.GLOBAL,
    ): Promise<undefined | Zcl.Frame> {
        const device = this.getDevice();
        const cluster = typeof clusterKey === "object" ? clusterKey : this.getCluster(clusterKey, device, options?.manufacturerCode);
        const command =
            typeof commandKey === "object"
                ? commandKey
                : frameType === Zcl.FrameType.GLOBAL
                  ? Zcl.Utils.getGlobalCommand(commandKey)
                  : cluster.getCommand(commandKey);
        const hasResponse = frameType === Zcl.FrameType.GLOBAL ? true : command.response !== undefined;
        const optionsWithDefaults = this.getOptionsWithDefaults(options, hasResponse, Zcl.Direction.CLIENT_TO_SERVER, cluster.manufacturerCode);

        const frame = Zcl.Frame.create(
            frameType,
            optionsWithDefaults.direction,
            optionsWithDefaults.disableDefaultResponse,
            optionsWithDefaults.manufacturerCode,
            optionsWithDefaults.transactionSequenceNumber ?? zclTransactionSequenceNumber.next(),
            command,
            cluster,
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
            // biome-ignore lint/style/noNonNullAssertion: ignored using `--suppress`
            logger.debug(err.stack!, NS);
            throw error;
        }
    }

    public async zclCommandBroadcast<Cl extends number | string, Co extends number | string, Custom extends TCustomCluster | undefined = undefined>(
        endpoint: number,
        destination: BroadcastAddress,
        clusterKey: Cl,
        commandKey: Co,
        payload: ClusterOrRawPayload<Cl, Co, Custom> | FoundationOrRawPayload<Co>,
        options?: Options,
    ): Promise<void> {
        const device = this.getDevice();
        const cluster = this.getCluster(clusterKey, device, options?.manufacturerCode);
        const command = cluster.getCommand(commandKey);
        const optionsWithDefaults = this.getOptionsWithDefaults(options, true, Zcl.Direction.CLIENT_TO_SERVER, cluster.manufacturerCode);
        const sourceEndpoint = optionsWithDefaults.srcEndpoint ?? this.ID;

        const frame = Zcl.Frame.create(
            Zcl.FrameType.SPECIFIC,
            optionsWithDefaults.direction,
            true,
            optionsWithDefaults.manufacturerCode,
            optionsWithDefaults.transactionSequenceNumber ?? zclTransactionSequenceNumber.next(),
            command,
            cluster,
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
        await Entity.adapter.sendZclFrameToAll(endpoint, frame, sourceEndpoint, destination);
    }
}

export default Endpoint;
