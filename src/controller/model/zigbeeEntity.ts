import type {
    ClusterOrRawAttributeKeys,
    ClusterOrRawAttributes,
    ClusterOrRawPayload,
    KeyValue,
    PartialClusterOrRawWriteAttributes,
    TCustomCluster,
} from "../tstype";
import Entity from "./entity";

export abstract class ZigbeeEntity extends Entity {
    public abstract read<Cl extends number | string, Custom extends TCustomCluster | undefined = undefined>(
        clusterKey: Cl,
        attributes: ClusterOrRawAttributeKeys<Cl, Custom>,
        options?: KeyValue,
    ): Promise<ClusterOrRawAttributes<Cl, Custom> | undefined>;

    public abstract write<Cl extends number | string, Custom extends TCustomCluster | undefined = undefined>(
        clusterKey: Cl,
        attributes: PartialClusterOrRawWriteAttributes<Cl, Custom>,
        options?: KeyValue,
    ): Promise<void>;

    public abstract command<Cl extends number | string, Co extends number | string, Custom extends TCustomCluster | undefined = undefined>(
        clusterKey: Cl,
        commandKey: Co,
        payload: ClusterOrRawPayload<Cl, Co, Custom>,
        options?: KeyValue,
    ): Promise<undefined | KeyValue>;
}
