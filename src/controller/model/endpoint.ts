import Entity from './entity';
import {KeyValue} from '../tstype';

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
            inClusterList: this.inputClusters, outClusterList: this.outputClusters,
        };
    }

    public static create(
        ID: number, profileID: number, deviceID: number, inputClusters: number[], outputClusters: number[],
    ): Endpoint {
        return new Endpoint(ID, profileID, deviceID, inputClusters, outputClusters);
    }

    public getID(): number {return this.ID}
}

export default Endpoint;