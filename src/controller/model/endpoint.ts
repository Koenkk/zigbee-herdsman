import Entity from './entity';
import {KeyValue} from '../tstype';
import {IsNumberArray} from '../../utils';
import * as Zcl from '../../zcl';
import ZclTransactionSequenceNumber from '../helpers/zclTransactionSequenceNumber';
import * as ZclFrameConverter from '../helpers/zclFrameConverter';
import Group from './group';

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

class Endpoint extends Entity {
    public readonly ID: number;
    private inputClusters: number[];
    private outputClusters: number[];
    private deviceNetworkAddress: number;
    private deviceIeeeAddress: string;
    private deviceID?: number;
    private profileID?: number;

    private constructor(
        ID: number, profileID: number, deviceID: number, inputClusters: number[], outputClusters: number[],
        deviceNetworkAddress: number, deviceIeeeAddress: string,
    ) {
        super();
        this.ID = ID;
        this.profileID = profileID;
        this.deviceID = deviceID;
        this.inputClusters = inputClusters;
        this.outputClusters = outputClusters;
        this.deviceNetworkAddress = deviceNetworkAddress;
        this.deviceIeeeAddress = deviceIeeeAddress;
    }

    /**
     * Getters/setters
     */
    public set(
        key: 'profileID' | 'deviceID' | 'inputClusters' | 'outputClusters', value: number | number[]
    ): void {
        if (typeof value === 'number' && (key === 'profileID' || key === 'deviceID')) {
            this[key] = value;
        } else {
            /* istanbul ignore else */
            if (IsNumberArray(value) && (key === 'inputClusters' || key === 'outputClusters')) {
                this[key] = value;
            }
        }
    }

    public get(key: 'ID'): string | number {
        return this[key];
    }

    public supportsInputCluster(clusterKey: number | string, ): boolean {
        const cluster = Zcl.Utils.getCluster(clusterKey);
        return this.inputClusters.includes(cluster.ID);
    }

    public supportsOutputCluster(clusterKey: number | string, ): boolean {
        const cluster = Zcl.Utils.getCluster(clusterKey);
        return this.outputClusters.includes(cluster.ID);
    }

    /**
     * CRUD
     */
    public static fromDatabaseRecord(
        record: KeyValue, deviceNetworkAddress: number, deviceIeeeAddress: string
    ): Endpoint {
        return new Endpoint(
            record.epId, record.profId, record.devId, record.inClusterList, record.outClusterList,
            deviceNetworkAddress, deviceIeeeAddress,
        );
    }

    public toDatabaseRecord(): KeyValue {
        return {
            profId: this.profileID, epId: this.ID, devId: this.deviceID,
            inClusterList: this.inputClusters, outClusterList: this.outputClusters, clusters: {},
        };
    }

    public static create(
        ID: number, profileID: number, deviceID: number, inputClusters: number[], outputClusters: number[],
        deviceNetworkAddress: number, deviceIeeeAddress: string,
    ): Endpoint {
        return new Endpoint(
            ID, profileID, deviceID, inputClusters, outputClusters, deviceNetworkAddress,
            deviceIeeeAddress
        );
    }

    public isType(type: string): boolean {
        return type === 'endpoint';
    }

    /**
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
        await Endpoint.adapter.sendZclFrameNetworkAddressWithResponse(this.deviceNetworkAddress, this.ID, frame);
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
        const result = await Endpoint.adapter.sendZclFrameNetworkAddressWithResponse(
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
        await Endpoint.adapter.sendZclFrameNetworkAddress(this.deviceNetworkAddress, this.ID, frame);
    }

    public async bind(clusterKey: number | string, target: Endpoint | Group): Promise<void> {
        const cluster = Zcl.Utils.getCluster(clusterKey);
        const type = target instanceof Endpoint ? 'endpoint' : 'group';
        await Endpoint.adapter.bind(
            this.deviceNetworkAddress, this.deviceIeeeAddress, this.ID, cluster.ID,
            target instanceof Endpoint ? target.deviceIeeeAddress : target.groupID,
            type,
            target instanceof Endpoint ? target.ID : null,
        );
    }

    public async unbind(clusterKey: number | string, target: Endpoint | Group): Promise<void> {
        const cluster = Zcl.Utils.getCluster(clusterKey);
        const type = target instanceof Endpoint ? 'endpoint' : 'group';
        await Endpoint.adapter.unbind(
            this.deviceNetworkAddress, this.deviceIeeeAddress, this.ID, cluster.ID,
            target instanceof Endpoint ? target.deviceIeeeAddress : target.groupID,
            type,
            target instanceof Endpoint ? target.ID : null,
        );
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
        await Endpoint.adapter.sendZclFrameNetworkAddress(this.deviceNetworkAddress, this.ID, frame);
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
        await Endpoint.adapter.sendZclFrameNetworkAddressWithResponse(this.deviceNetworkAddress, this.ID, frame);
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
            const result = await Endpoint.adapter.sendZclFrameNetworkAddressWithResponse(
                this.deviceNetworkAddress, this.ID, frame
            );
            return result.frame.Payload;
        } else {
            await Endpoint.adapter.sendZclFrameNetworkAddress(this.deviceNetworkAddress, this.ID, frame);
        }
    }

    private getOptionsWithDefaults(options: Options, disableDefaultResponse: boolean): Options {
        const providedOptions = options || {};
        return {manufacturerCode: null, disableDefaultResponse, ...providedOptions};
    }

    public async addToGroup(group: Group): Promise<void> {
        await this.command('genGroups', 'add', {groupid: group.groupID, groupname: ''});
    }

    public async removeFromGroup(group: Group): Promise<void> {
        await this.command('genGroups', 'remove', {groupid: group.groupID});
    }

    public async removeFromAllGroups(): Promise<void> {
        await this.command('genGroups', 'removeAll', {}, {disableDefaultResponse: true});
    }
}

export default Endpoint;