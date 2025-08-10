import type {ClusterOrRawAttributeKeys, ClusterOrRawAttributes, KeyValue, PartialClusterOrRawWriteAttributes} from "../tstype";
import Entity from "./entity";

export abstract class ZigbeeEntity extends Entity {
    public abstract read<Cl extends number | string>(
        clusterKey: Cl,
        attributes: ClusterOrRawAttributeKeys<Cl>,
        options?: KeyValue,
    ): Promise<ClusterOrRawAttributes<Cl> | undefined>;

    public abstract write<Cl extends number | string>(
        clusterKey: Cl,
        attributes: PartialClusterOrRawWriteAttributes<Cl>,
        options?: KeyValue,
    ): Promise<void>;

    public abstract command<Cl extends number | string, Co extends number | string>(
        clusterKey: Cl,
        commandKey: Co,
        payload: KeyValue,
        options?: KeyValue,
    ): Promise<undefined | KeyValue>;
}
