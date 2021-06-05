import {StructMemoryAlignment} from "./struct";

/**
 * Interface for serializable items to be written to NV. Objects implementing this interface
 * are structs and tables.
 */
export interface SerializableMemoryObject {
    serialize(alignment?: StructMemoryAlignment): Buffer;
}

/**
 * Signature for factory returning a memory struct or a table.
 */
export type MemoryObjectFactory<T> = (data?: Buffer | Buffer[]) => T;