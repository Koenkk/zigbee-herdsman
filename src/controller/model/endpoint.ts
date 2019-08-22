import Entity from './entity';
import {KeyValue} from '../tstype';
import {IsNumberArray} from '../../utils';
import * as Zcl from '../../zcl';
import ZclTransactionSequenceNumber from '../helpers/zclTransactionSequenceNumber';
import * as ZclFrameConverter from '../helpers/zclFrameConverter';

interface ConfigureReportingItem {
    attribute: string | number;
    minimumReportInterval: number;
    maximumReportInterval: number;
    reportableChange: number;
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
    public async set(
        key: 'profileID' | 'deviceID' | 'inputClusters' | 'outputClusters', value: number | number[]
    ): Promise<void> {
        if (typeof value === 'number' && (key === 'profileID' || key === 'deviceID')) {
            this[key] = value;
        } else if (IsNumberArray(value) && (key === 'inputClusters' || key === 'outputClusters')) {
            this[key] = value;
        }
    }

    public get(key: 'ID'): string | number {
        return this[key];
    }

    public supportsInputCluster(clusterKey: number | string, ): boolean {
        const cluster = Zcl.Utils.getCluster(clusterKey);
        return this.inputClusters.includes(cluster.ID);
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

    /**
     * Zigbee functions
     */
    public async write(clusterKey: number | string, attributes: KeyValue): Promise<void> {
        const cluster = Zcl.Utils.getCluster(clusterKey);
        const payload: {attrId: number; dataType: number; attrData: number| string | boolean}[] = [];
        for (const [name, value] of Object.entries(attributes)) {
            const attribute = cluster.getAttribute(name);
            payload.push({attrId: attribute.ID, attrData: value, dataType: attribute.type});
        }

        const frame = Zcl.ZclFrame.create(
            Zcl.FrameType.GLOBAL, Zcl.Direction.CLIENT_TO_SERVER, true, null, ZclTransactionSequenceNumber.next(),
            'write', cluster.ID, payload
        );
        await Endpoint.adapter.sendZclFrameNetworkAddressWithResponse(this.deviceNetworkAddress, this.ID, frame);
    }

    public async read(clusterKey: number | string, attributes: string[] | number []): Promise<KeyValue> {
        const cluster = Zcl.Utils.getCluster(clusterKey);
        const payload: {attrId: number}[] = [];
        for (const attribute of attributes) {
            payload.push({attrId: cluster.getAttribute(attribute).ID});
        }

        const frame = Zcl.ZclFrame.create(
            Zcl.FrameType.GLOBAL, Zcl.Direction.CLIENT_TO_SERVER, true, null, ZclTransactionSequenceNumber.next(),
            'read', cluster.ID, payload
        );
        const result = await Endpoint.adapter.sendZclFrameNetworkAddressWithResponse(
            this.deviceNetworkAddress, this.ID, frame
        );
        return ZclFrameConverter.attributeList(result.frame);
    }

    public async readResponse(
        clusterKey: number | string, transactionSequenceNumber: number, attributes: KeyValue
    ): Promise<void> {
        const cluster = Zcl.Utils.getCluster(clusterKey);
        const payload: {attrId: number; status: number; dataType: number; attrData: number | string}[] = [];
        for (const [name, value] of Object.entries(attributes)) {
            const attribute = cluster.getAttribute(name);
            payload.push({attrId: attribute.ID, attrData: value, dataType: attribute.type, status: 0});
        }

        const frame = Zcl.ZclFrame.create(
            Zcl.FrameType.GLOBAL, Zcl.Direction.SERVER_TO_CLIENT, true, null, transactionSequenceNumber,
            'readRsp', cluster.ID, payload
        );
        await Endpoint.adapter.sendZclFrameNetworkAddress(this.deviceNetworkAddress, this.ID, frame);
    }

    public async bind(clusterKey: number | string, endpoint: Endpoint): Promise<void> {
        const cluster = Zcl.Utils.getCluster(clusterKey);
        await Endpoint.adapter.bind(
            this.deviceNetworkAddress, this.deviceIeeeAddress, this.ID, cluster.ID,
            endpoint.deviceIeeeAddress, endpoint.ID
        );
    }

    public async unbind(clusterKey: number | string, endpoint: Endpoint): Promise<void> {
        const cluster = Zcl.Utils.getCluster(clusterKey);
        await Endpoint.adapter.unbind(
            this.deviceNetworkAddress, this.deviceIeeeAddress, this.ID, cluster.ID,
            endpoint.deviceIeeeAddress, endpoint.ID
        );
    }

    public async defaultResponse(
        commandID: number, status: number, clusterID: number, transactionSequenceNumber: number
    ): Promise<void> {
        const payload = {cmdId: commandID, statusCode: status};
        const frame = Zcl.ZclFrame.create(
            Zcl.FrameType.GLOBAL, Zcl.Direction.SERVER_TO_CLIENT, true, null, transactionSequenceNumber,
            'defaultRsp', clusterID, payload
        );
        await Endpoint.adapter.sendZclFrameNetworkAddress(this.deviceNetworkAddress, this.ID, frame);
    }

    public async configureReporting(clusterKey: number | string, items: ConfigureReportingItem[]): Promise<void> {
        const cluster = Zcl.Utils.getCluster(clusterKey);
        const payload = items.map((item): KeyValue => {
            const attribute = cluster.getAttribute(item.attribute);
            return {
                direction: Zcl.Direction.SERVER_TO_CLIENT,
                attrId: attribute.ID,
                dataType: attribute.type,
                minRepIntval: item.minimumReportInterval,
                maxRepIntval: item.maximumReportInterval,
                repChange: item.reportableChange,
            };
        });

        const frame = Zcl.ZclFrame.create(
            Zcl.FrameType.GLOBAL, Zcl.Direction.CLIENT_TO_SERVER, true, null, ZclTransactionSequenceNumber.next(),
            'configReport', cluster.ID, payload
        );
        await Endpoint.adapter.sendZclFrameNetworkAddressWithResponse(this.deviceNetworkAddress, this.ID, frame);
    }

    public async command(clusterKey: number | string, commandKey: number | string, payload: KeyValue): Promise<void> {
        const cluster = Zcl.Utils.getCluster(clusterKey);
        const command = cluster.getCommand(commandKey);

        for (const parameter of command.parameters) {
            if (!payload.hasOwnProperty(parameter.name)) {
                throw new Error(`Parameter '${parameter.name}' is missing`);
            }
        }

        const frame = Zcl.ZclFrame.create(
            Zcl.FrameType.SPECIFIC, Zcl.Direction.CLIENT_TO_SERVER, false, null, ZclTransactionSequenceNumber.next(),
            command.ID, cluster.ID, payload
        );
        await Endpoint.adapter.sendZclFrameNetworkAddress(this.deviceNetworkAddress, this.ID, frame);
    }
}

export default Endpoint;