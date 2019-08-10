import Entity from './entity';
import {KeyValue} from '../tstype';
import {IsNumberArray} from '../../utils';
import * as Zcl from '../../zcl';

class Endpoint extends Entity {
    public readonly ID: number;
    private profileID: number;
    private deviceID: number;
    private inputClusters: number[];
    private outputClusters: number[];

    private constructor(
        ID: number, profileID: number, deviceID: number, inputClusters: number[], outputClusters: number[]
    ) {
        super();
        this.ID = ID;
        this.profileID = profileID;
        this.deviceID = deviceID;
        this.inputClusters = inputClusters;
        this.outputClusters = outputClusters;
    }

    public static fromDatabaseRecord(record: KeyValue): Endpoint {
        return new Endpoint(
            record.epId, record.profId, record.devId, record.inClusterList, record.outClusterList,
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
    ): Endpoint {
        return new Endpoint(ID, profileID, deviceID, inputClusters, outputClusters);
    }

    public async update(key: 'profileID' | 'deviceID' | 'inputClusters' | 'outputClusters', value: number | number[]): Promise<void> {
        if (typeof value === 'number' && (key === 'profileID' || key === 'deviceID')) {
            this[key] = value;
        } else if (IsNumberArray(value) && (key === 'inputClusters' || key === 'outputClusters')) {
            this[key] = value;
        }
    }

    public async read(clusterKey: number | string, attributes: string[] | number []): Promise<void> {
        const cluster = Zcl.Utils.getCluster(clusterKey);
        const payload: {attrId: number}[] = [];
        for (let attribute of attributes) {
            payload.push({attrId: cluster.getAttribute(attribute).ID})
        }

        const frame = Zcl.ZclFrame.create(Zcl.FrameType.GLOBAL, Zcl.Direction.CLIENT_TO_SERVER, true, null, 0, 'read', cluster.ID, payload);


    }
}

export default Endpoint;