import {StructMemoryAlignment} from "./struct";

export interface SerializableMemoryObject {
    serialize(alignment?: StructMemoryAlignment): Buffer;
}

export type MemoryObjectFactory<T> = (data?: Buffer | Buffer[]) => T;