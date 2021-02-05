/* eslint-disable max-len */
import {SerializableMemoryObject} from "./serializable-memory-object";
import {BuiltStruct, StructFactorySignature, StructMemoryAlignment} from "./struct";

type InlineTableBuildOmitKeys = "struct" | "header" | "occupancy" | "load" | "build";
export type BuiltInlineTable<R extends BuiltStruct, T = InlineTable<R>> = Omit<T, InlineTableBuildOmitKeys>;
export type InlineTableFactorySignature<R extends BuiltStruct, T = InlineTable<R>> = (data?: Buffer) => T;

/**
 * Inline table structure wraps `Struct`-based entries for inline tables present within ZNP NV memory.
 */
export class InlineTable<R extends BuiltStruct> implements SerializableMemoryObject {

    /**
     * Create a new inline table builder.
     */
    public static new<R extends BuiltStruct>(): InlineTable<R> {
        return new InlineTable();
    }

    private data: R[];
    private entryStructFactory: StructFactorySignature<R>;
    private entryOccupancyFunction: (entry: R) => boolean = null;
    private emptyEntry: R;
    private hasLengthHeader = false;

    private constructor() {}

    /**
     * Return total capacity of the table.
     */
    public get capacity(): number {
        return this.data.length;
    }

    /**
     * Returns all entries within table.
     */
    public get entries(): R[] {
        return this.data;
    }

    /**
     * Returns all used entries.
     */
    public get used(): R[] {
        if (!this.entryOccupancyFunction) {
            throw new Error("Inline table usage cannot be determined without occupancy function when header is not present.");
        }
        return this.entries.filter(e => this.entryOccupancyFunction(e));
    }

    /**
     * Returns all unused entries.
     */
    public get free(): R[] {
        if (!this.entryOccupancyFunction) {
            throw new Error("Inline table usage cannot be determined without occupancy function when header is not present.");
        }
        return this.entries.filter(e => !this.entryOccupancyFunction(e));
    }

    /**
     * Return number of records marked as free.
     */
    public get freeCount(): number {
        return this.free.length;
    }

    /**
     * Return number of records marked as used.
     */
    public get usedCount(): number {
        return this.used.length;
    }

    /**
     * Return next free entry or `null` if no entries are free within the table.
     */
    public getNextFree(): R {
        return this.free[0] || null;
    }

    /**
     * Returns index of element in inline table
     * 
     * @param entry Entry to resolve index for.
     */
    public indexOf(entry: R): number | null {
        return this.entries.findIndex(e => e.serialize().equals(entry.serialize())) || null;
    }

    /**
     * Export the inline table in target platform format.
     * 
     * @param alignment Memory alignment to use for export.
     */
    public serialize(alignment: StructMemoryAlignment = "unaligned"): Buffer {
        const entryLength = this.emptyEntry.getLength(alignment);
        const output = Buffer.alloc((this.hasLengthHeader ? 2 : 0) + (this.capacity * entryLength), 0x00);
        let offset = 0;
        if (this.hasLengthHeader) {
            output.writeUInt16LE(this.usedCount);
            offset += 2;
        }
        this.data.forEach(e => {
            output.set(e.serialize(alignment), offset);
            offset += e.getLength(alignment);
        });
        return output;
    }

    /**
     * Applies function to determine table entry occupancy. This function is invoked with an entry instance
     * and returns `boolean` indicating if the entry is occupied or not.
     * 
     * @param fn Function to determine entry occupancy.
     */
    public occupancy(fn: (entry: R) => boolean): this {
        this.entryOccupancyFunction = fn;
        return this;
    }

    /**
     * Defines a struct factory for entries contained within table.
     * 
     * @param entryStructFactory Struct factory.
     */
    public struct(entryStructFactory: StructFactorySignature<R>): this {
        this.entryStructFactory = entryStructFactory;
        this.emptyEntry = this.entryStructFactory();
        return this;   
    }

    /**
     * Sets whether the inline table has a table header containing a 16-bit unsigned used table length.
     * 
     * @param hasHeader Sets whether table has record count header.
     */
    public header(hasHeader = true): this {
        this.hasLengthHeader = hasHeader;
        return this;
    }

    /**
     * Builds the inline table from existing buffer.
     * 
     * @param data Buffer to populate table from.
     * @param alignment Memory alignment of the source platform.
     */
    public build(data: Buffer, alignment: StructMemoryAlignment): BuiltInlineTable<R>;

    /**
     * Creates an empty table with set capacity.
     * 
     * @param capacity Capacity to create the table with.
     */
    public build(capacity: number): BuiltInlineTable<R>;

    public build(dataOrCapacity: Buffer | number, alignment: StructMemoryAlignment = "unaligned"): BuiltInlineTable<R> {
        if (!this.entryStructFactory) {
            throw new Error("Inline table requires an entry struct factory.");
        }
        if (typeof dataOrCapacity === "number") {
            const capacity = dataOrCapacity;
            this.data = [...Array(capacity)].map(_ => this.entryStructFactory());
        } else {
            const data = dataOrCapacity;
            const entryLength = this.emptyEntry.getLength(alignment);
            const dataLength = this.hasLengthHeader ? data.length - 2 : data.length;
            if (dataLength % entryLength !== 0) {
                throw new Error(`Inline table length not divisible by entry length (alignment=${alignment}, data_length=${data.length}, entry_length=${entryLength})`);
            }
            const capacity = dataLength / entryLength;
            const entriesStart = this.hasLengthHeader ? data.slice(2, data.length) : data.slice();
            this.data = [...Array(capacity)].map((_, i) => this.entryStructFactory(entriesStart.slice(i * entryLength, i * entryLength + entryLength)));
        }
        return this;
    }
}