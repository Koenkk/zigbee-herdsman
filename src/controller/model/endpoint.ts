import Entity from './entity';
import {KeyValue} from '../tstype';
import * as Zcl from '../../zcl';
import ZclTransactionSequenceNumber from '../helpers/zclTransactionSequenceNumber';
import * as ZclFrameConverter from '../helpers/zclFrameConverter';
import Group from './group';
import Device from './device';

interface ConfigureReportingItem {
    attribute: string | number | {ID: number; type: number};
    minimumReportInterval: number;
    maximumReportInterval: number;
    reportableChange: number;
}

interface Options {
    manufacturerCode?: number;
    disableDefaultResponse?: boolean;
    response?: boolean;
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
    cluster: number;
    target: Endpoint | Group;
}

class Endpoint extends Entity {
    public deviceID?: number;
    public inputClusters: number[];
    public outputClusters: number[];
    public profileID?: number;
    public readonly ID: number;
    public readonly clusters: Clusters;
    private readonly deviceIeeeAddress: string;
    public readonly deviceNetworkAddress: number;
    private _binds: BindInternal[];

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
            return {target, cluster: entry.cluster};
        });
    };

    private toJSON(): Object {
        return {
            ID: this.ID,
            profileID: this.profileID,
            clusters: this.clusters,
            inputClusters: this.inputClusters,
            outputClusters: this.outputClusters,
            binds: this.binds,
            deviceID: this.deviceID,
            deviceIeeeAddress: this.deviceIeeeAddress,
            deviceNetworkAddress: this.deviceNetworkAddress,
        };
    }

    private constructor(
        ID: number, profileID: number, deviceID: number, inputClusters: number[], outputClusters: number[],
        deviceNetworkAddress: number, deviceIeeeAddress: string, clusters: Clusters, binds: BindInternal[],
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

    public supportsOutputCluster(clusterKey: number | string, ): boolean {
        const cluster = Zcl.Utils.getCluster(clusterKey);
        return this.outputClusters.includes(cluster.ID);
    }

    /*
     * CRUD
     */

    public static fromDatabaseRecord(
        record: KeyValue, deviceNetworkAddress: number, deviceIeeeAddress: string
    ): Endpoint {
        // Migrate attrs to attributes
        for (const entry of Object.values(record.clusters).filter((e) => e.hasOwnProperty('attrs'))) {
            // @ts-ignore
            entry.attributes = entry.attrs;
            // @ts-ignore
            delete entry.attrs;
        }

        return new Endpoint(
            record.epId, record.profId, record.devId, record.inClusterList, record.outClusterList,
            deviceNetworkAddress, deviceIeeeAddress, record.clusters, record.binds || [],
        );
    }

    public toDatabaseRecord(): KeyValue {
        return {
            profId: this.profileID, epId: this.ID, devId: this.deviceID,
            inClusterList: this.inputClusters, outClusterList: this.outputClusters, clusters: this.clusters,
            binds: this._binds,
        };
    }

    public static create(
        ID: number, profileID: number, deviceID: number, inputClusters: number[], outputClusters: number[],
        deviceNetworkAddress: number, deviceIeeeAddress: string,
    ): Endpoint {
        return new Endpoint(
            ID, profileID, deviceID, inputClusters, outputClusters, deviceNetworkAddress,
            deviceIeeeAddress, {}, [],
        );
    }

    public saveClusterAttributeList(clusterKey: number | string, list: KeyValue): void {
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

    /*
     * Zigbee functions
     */

    public async write(
        clusterKey: number | string, attributes: KeyValue, options?: Options
    ): Promise<void> {
        const {manufacturerCode, disableDefaultResponse} = this.getOptionsWithDefaults(options, true);
        const cluster = Zcl.Utils.getCluster(clusterKey);
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

        const frame = Zcl.ZclFrame.create(
            Zcl.FrameType.GLOBAL, Zcl.Direction.CLIENT_TO_SERVER, disableDefaultResponse,
            manufacturerCode, ZclTransactionSequenceNumber.next(), 'write', cluster.ID, payload
        );
        await Entity.adapter.sendZclFrameNetworkAddressWithResponse(this.deviceNetworkAddress, this.ID, frame);
    }

    public async read(
        clusterKey: number | string, attributes: string[] | number [], options?: Options
    ): Promise<KeyValue> {
        const {manufacturerCode, disableDefaultResponse} = this.getOptionsWithDefaults(options, true);
        const cluster = Zcl.Utils.getCluster(clusterKey);
        const payload: {attrId: number}[] = [];
        for (const attribute of attributes) {
            payload.push({attrId: cluster.getAttribute(attribute).ID});
        }

        const frame = Zcl.ZclFrame.create(
            Zcl.FrameType.GLOBAL, Zcl.Direction.CLIENT_TO_SERVER, disableDefaultResponse,
            manufacturerCode, ZclTransactionSequenceNumber.next(), 'read', cluster.ID, payload
        );
        const result = await Entity.adapter.sendZclFrameNetworkAddressWithResponse(
            this.deviceNetworkAddress, this.ID, frame
        );
        return ZclFrameConverter.attributeList(result.frame);
    }

    public async readResponse(
        clusterKey: number | string, transactionSequenceNumber: number, attributes: KeyValue, options?: Options
    ): Promise<void> {
        const {manufacturerCode, disableDefaultResponse} = this.getOptionsWithDefaults(options, true);
        const cluster = Zcl.Utils.getCluster(clusterKey);
        const payload: {attrId: number; status: number; dataType: number; attrData: number | string}[] = [];
        for (const [name, value] of Object.entries(attributes)) {
            const attribute = cluster.getAttribute(name);
            payload.push({attrId: attribute.ID, attrData: value, dataType: attribute.type, status: 0});
        }

        const frame = Zcl.ZclFrame.create(
            Zcl.FrameType.GLOBAL, Zcl.Direction.SERVER_TO_CLIENT, disableDefaultResponse, manufacturerCode,
            transactionSequenceNumber, 'readRsp', cluster.ID, payload
        );
        await Entity.adapter.sendZclFrameNetworkAddress(this.deviceNetworkAddress, this.ID, frame);
    }

    public async bind(clusterKey: number | string, target: Endpoint | Group): Promise<void> {
        const cluster = Zcl.Utils.getCluster(clusterKey);
        const type = target instanceof Endpoint ? 'endpoint' : 'group';
        await Entity.adapter.bind(
            this.deviceNetworkAddress, this.deviceIeeeAddress, this.ID, cluster.ID,
            target instanceof Endpoint ? target.deviceIeeeAddress : target.get('groupID'),
            type,
            target instanceof Endpoint ? target.ID : null,
        );

        if (!this.binds.find((b) => b.cluster === cluster.ID && b.target === target)) {
            if (target instanceof Group) {
                this._binds.push({cluster: cluster.ID, groupID: target.get('groupID'), type: 'group'});
            } else {
                this._binds.push({
                    cluster: cluster.ID, type: 'endpoint', deviceIeeeAddress: target.deviceIeeeAddress,
                    endpointID: target.ID
                });
            }

            this.getDevice().save();
        }
    }

    public async unbind(clusterKey: number | string, target: Endpoint | Group): Promise<void> {
        const cluster = Zcl.Utils.getCluster(clusterKey);
        const type = target instanceof Endpoint ? 'endpoint' : 'group';
        await Entity.adapter.unbind(
            this.deviceNetworkAddress, this.deviceIeeeAddress, this.ID, cluster.ID,
            target instanceof Endpoint ? target.deviceIeeeAddress : target.get('groupID'),
            type,
            target instanceof Endpoint ? target.ID : null,
        );

        const index = this.binds.findIndex((b) => b.cluster === cluster.ID && b.target === target);
        if (index !== -1) {
            this._binds.splice(index, 1);
            this.getDevice().save();
        }
    }

    public async defaultResponse(
        commandID: number, status: number, clusterID: number, transactionSequenceNumber: number, options?: Options
    ): Promise<void> {
        const {manufacturerCode, disableDefaultResponse} = this.getOptionsWithDefaults(options, true);
        const payload = {cmdId: commandID, statusCode: status};
        const frame = Zcl.ZclFrame.create(
            Zcl.FrameType.GLOBAL, Zcl.Direction.SERVER_TO_CLIENT, disableDefaultResponse,
            manufacturerCode, transactionSequenceNumber, 'defaultRsp', clusterID, payload
        );
        await Entity.adapter.sendZclFrameNetworkAddress(this.deviceNetworkAddress, this.ID, frame);
    }

    public async configureReporting(
        clusterKey: number | string, items: ConfigureReportingItem[], options?: Options
    ): Promise<void> {
        const {manufacturerCode, disableDefaultResponse} = this.getOptionsWithDefaults(options, true);
        const cluster = Zcl.Utils.getCluster(clusterKey);
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
            Zcl.FrameType.GLOBAL, Zcl.Direction.CLIENT_TO_SERVER, disableDefaultResponse,
            manufacturerCode, ZclTransactionSequenceNumber.next(), 'configReport', cluster.ID, payload
        );
        await Entity.adapter.sendZclFrameNetworkAddressWithResponse(this.deviceNetworkAddress, this.ID, frame);
    }

    public async command(
        clusterKey: number | string, commandKey: number | string, payload: KeyValue, options?: Options,
    ): Promise<void | KeyValue> {
        const cluster = Zcl.Utils.getCluster(clusterKey);
        const command = cluster.getCommand(commandKey);
        const hasResponse = command.hasOwnProperty('response');
        const {manufacturerCode, disableDefaultResponse} = this.getOptionsWithDefaults(options, hasResponse);

        for (const parameter of command.parameters) {
            if (!payload.hasOwnProperty(parameter.name)) {
                throw new Error(`Parameter '${parameter.name}' is missing`);
            }
        }

        const frame = Zcl.ZclFrame.create(
            Zcl.FrameType.SPECIFIC, Zcl.Direction.CLIENT_TO_SERVER, disableDefaultResponse,
            manufacturerCode, ZclTransactionSequenceNumber.next(), command.ID, cluster.ID, payload
        );

        if (hasResponse) {
            const result = await Entity.adapter.sendZclFrameNetworkAddressWithResponse(
                this.deviceNetworkAddress, this.ID, frame
            );
            return result.frame.Payload;
        } else {
            await Entity.adapter.sendZclFrameNetworkAddress(this.deviceNetworkAddress, this.ID, frame);
        }
    }

    private getOptionsWithDefaults(options: Options, disableDefaultResponse: boolean): Options {
        const providedOptions = options || {};
        return {manufacturerCode: null, disableDefaultResponse, ...providedOptions};
    }

    public async addToGroup(group: Group): Promise<void> {
        await this.command('genGroups', 'add', {groupid: group.get('groupID'), groupname: ''});
        group.addMember(this);
    }

    public async removeFromGroup(group: Group): Promise<void> {
        await this.command('genGroups', 'remove', {groupid: group.get('groupID')});
        group.removeMember(this);
    }

    public async removeFromAllGroups(): Promise<void> {
        await this.command('genGroups', 'removeAll', {}, {disableDefaultResponse: true});
        for (const group of Group.all()) {
            if (group.hasMember(this)) {
                group.removeMember(this);
            }
        }
    }
}

export default Endpoint;