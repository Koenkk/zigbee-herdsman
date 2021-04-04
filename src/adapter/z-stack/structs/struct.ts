import {SerializableMemoryObject} from "./serializable-memory-object";

/* Helper Types */
type StructMemberType = "uint8" | "uint16" | "uint32" | "uint8array" | "uint8array-reversed" | "struct";
type StructBuildOmitKeys = "member" | "method" | "padding" | "build" | "default";
type StructChild = { offset:number, struct: Struct };
export type BuiltStruct<T = Struct> = Omit<T, StructBuildOmitKeys>;
export type StructFactorySignature<T = Struct> = (data?: Buffer) => T;

export type StructMemoryAlignment = "unaligned" | "aligned";

/**
 * Struct provides a builder-like interface to create Buffer-based memory
 * structures for read/write interfacing with data structures from adapters.
 */
export class Struct implements SerializableMemoryObject {

    /**
     * Creates an empty struct. Further calls to `member()` and `method()` functions will form the structure.
     * Finally call to `build()` will type the resulting structure appropriately without internal functions.
     */
    public static new(): Struct {
        return new Struct();
    }

    private buffer: Buffer;
    private defaultData: Buffer;
    private members: { key: string, offset: number, type: StructMemberType, length?: number }[] = [];
    private childStructs: { [key: string]: StructChild } = {};
    private length = 0;
    private paddingByte = 0x00;

    private constructor() { }

    /**
     * Returns raw contents of the structure as a sliced Buffer.
     * Mutations to the returned buffer will not be reflected within struct.
     */
    public serialize(alignment: StructMemoryAlignment = "unaligned", padLength = true, parentOffset = 0): Buffer {
        switch (alignment) {
        case "unaligned": {
            /* update child struct values and return as-is (unaligned) */
            /* istanbul ignore next */
            for (const key of Object.keys(this.childStructs)) {
                const child = this.childStructs[key];
                this.buffer.set(child.struct.serialize(alignment), child.offset);
            }
            return Buffer.from(this.buffer);
        }
        case "aligned": {
            /* create 16-bit aligned buffer */
            const aligned = Buffer.alloc(this.getLength(alignment, padLength, parentOffset), this.paddingByte);
            let offset = 0;
            for (const member of this.members) {
                switch (member.type) {
                case "uint8":
                    aligned.set(this.buffer.slice(member.offset, member.offset + 1), offset);
                    offset += 1;
                    break;
                case "uint16":
                    offset += offset % 2;
                    aligned.set(this.buffer.slice(member.offset, member.offset + 2), offset);
                    offset += 2;
                    break;
                case "uint32":
                    offset += offset % 2;
                    aligned.set(this.buffer.slice(member.offset, member.offset + 4), offset);
                    offset += 4;
                    break;
                case "uint8array":
                case "uint8array-reversed":
                    aligned.set(this.buffer.slice(member.offset, member.offset + member.length), offset);
                    offset += member.length;
                    break;
                case "struct":
                    const structData = this.childStructs[member.key].struct.serialize(alignment, false, offset);
                    aligned.set(structData, offset);
                    offset += structData.length;
                    break;
                }
            }
            return aligned;
        }
        }
    }

    /**
     * Returns total length of the struct. Struct length is always fixed and configured
     * by calls to `member()` methods.
     */
    /* istanbul ignore next */
    public getLength(alignment: StructMemoryAlignment = "unaligned", padLength = true, parentOffset = 0): number {
        switch (alignment) {
        case "unaligned": {
            /* return actual length */
            return this.length;
        }
        case "aligned": {
            /* compute aligned length and return */
            let length = this.members.reduce((offset, member) => {
                switch (member.type) {
                case "uint8": offset += 1; break;
                case "uint16": offset += ((parentOffset + offset) % 2) + 2; break;
                case "uint32": offset += ((parentOffset + offset) % 2) + 4; break;
                case "uint8array":
                case "uint8array-reversed": offset += member.length; break;
                case "struct": offset += this.childStructs[member.key].struct.getLength(alignment, false); break;
                }
                return offset;
            }, 0);
            if (padLength) {
                length += length % 2;
            }
            return length;
        }
        }
    }

    /**
     * Returns structure contents in JS object format.
     */
    // eslint-disable-next-line max-len
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types,@typescript-eslint/explicit-function-return-type
    public toJSON() {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return this.members.reduce((a, c) => { a[c.key] = (this as any)[c.key]; return a; }, {} as any);
    }

    /**
     * Adds a numeric member of `uint8`, `uint16` or `uint32` type.
     * Internal representation is always little endian.
     * 
     * *This method is stripped from type on struct `build()`.*
     * 
     * @param type Underlying data type (uint8, uint16 or uint32).
     * @param name Name of the struct member.
     */
    public member<T extends number, N extends string, R extends this & Record<N, T>>
    (type: "uint8" | "uint16" | "uint32", name: N): R;

    /**
     * Adds an uint8 array (byte array) as a struct member.
     * 
     * *This method is stripped from type on struct `build()`.*
     * 
     * @param type Underlying data type. Must be `uint8array`.
     * @param name Name of the struct member.
     * @param length Length of the byte array.
     */
    public member<T extends Buffer, N extends string, R extends this & Record<N, T>>
    (type: "uint8array" | "uint8array-reversed", name: N, length: number): R;

    /**
     * Adds another struct type as a struct member. Struct factory is provided
     * as a child struct definition source.
     * 
     * *This method is stripped from type on struct `build()`.*
     * 
     * @param type Underlying data type. Must be `struct`.
     * @param name Name of the struct member.
     * @param structFactory Factory providing the wanted child struct.
     */
    public member<T extends BuiltStruct, N extends string, R extends this & Record<N, T>>
    (type: "struct", name: N, structFactory: StructFactorySignature<T>): R;

    public member<T extends number | BuiltStruct, N extends string, R extends this & Record<N, T>>
    (type: StructMemberType, name: N, lengthOrStructFactory?: number | StructFactorySignature<T>): R {
        const offset = this.length;
        const structFactory = type === "struct" ? lengthOrStructFactory as StructFactorySignature<T> : undefined;
        const length = type === "struct" ? 
            (structFactory() as unknown as Struct).length : 
            lengthOrStructFactory as number;

        switch (type) {
        case "uint8": {
            Object.defineProperty(this, name,{
                enumerable: true,
                get: () => this.buffer.readUInt8(offset),
                set: (value: number) => this.buffer.writeUInt8(value, offset)
            });
            this.length += 1;
            break;
        }
        case "uint16": {
            Object.defineProperty(this, name,{
                enumerable: true,
                get: () => this.buffer.readUInt16LE(offset),
                set: (value: number) => this.buffer.writeUInt16LE(value, offset)
            });
            this.length += 2;
            break;
        }
        case "uint32": {
            Object.defineProperty(this, name,{
                enumerable: true,
                get: () => this.buffer.readUInt32LE(offset),
                set: (value: number) => this.buffer.writeUInt32LE(value, offset)
            });
            this.length += 4;
            break;
        }
        case "uint8array":
        case "uint8array-reversed": {
            /* istanbul ignore next */
            if (!length) {
                throw new Error("Struct builder requires length for `uint8array` and `uint8array-reversed` type");
            }
            Object.defineProperty(this, name,{
                enumerable: true,
                get: () => type === "uint8array-reversed" ?
                    Buffer.from(this.buffer.slice(offset, offset + length)).reverse() : 
                    Buffer.from(this.buffer.slice(offset, offset + length)),
                set: (value: Buffer) => {
                    if (value.length !== length) {
                        throw new Error(`Invalid length for member ${name} (expected=${length}, got=${value.length})`);
                    }
                    if (type === "uint8array-reversed") {
                        value = Buffer.from(value).reverse();
                    }
                    for (let i = 0; i < length; i++) {
                        this.buffer[offset + i] = value[i];
                    }
                }
            });
            this.length += length;
            break;
        }
        case "struct": {
            this.childStructs[name] = {offset, struct: structFactory() as unknown as Struct};
            Object.defineProperty(this, name, {
                enumerable: true,
                get: () => this.childStructs[name].struct
            });
            this.length += length;
        }
        }
        this.members.push({key: name, offset, type, length});
        return this as R;
    }

    /**
     * Adds a custom method to the struct.
     * 
     * *This method is stripped from type on struct `build()`.*
     * 
     * @param name Name of the method to be appended.
     * @param returnType Return type (eg. `Buffer.prototype`).
     * @param body Function implementation. Takes struct as a first and single input parameter.
     */
    public method<T, N extends string, R extends this & Record<N, () => T>>
    (name: N, returnType: T, body: (struct: R) => T): R {
        Object.defineProperty(this, name, {
            enumerable: true,
            configurable: false,
            writable: false,
            value: () => body.bind(this)(this)
        });
        return this as R;
    }

    /**
     * Sets default data to initialize empty struct with.
     * 
     * @param data Data to initialize empty struct with.
     */
    /* istanbul ignore next */
    public default(data: Buffer): this {
        if (data.length !== this.length) {
            throw new Error("Default value needs to have the length of unaligned structure.");
        }
        this.defaultData = Buffer.from(data);
        return this;
    }

    /**
     * Sets byte to use for padding.
     * 
     * @param padding Byte to use for padding
     */
    /* istanbul ignore next */
    public padding(padding = 0x00): this {
        this.paddingByte = padding;
        return this;
    }

    /**
     * Creates the struct and optionally fills it with data. If data is provided, the length
     * of the provided buffer needs to match the structure length.
     * 
     * *This method is stripped from type on struct `build()`.*
     */
    public build(data?: Buffer): BuiltStruct<this> {
        if (data) {
            if (data.length === this.getLength("unaligned")) {
                this.buffer = Buffer.from(data);
                for (const key of Object.keys(this.childStructs)) {
                    const child = this.childStructs[key];
                    child.struct.build(this.buffer.slice(child.offset, child.offset + child.struct.length));
                }
            } else if (data.length === this.getLength("aligned")) {
                this.buffer = Buffer.alloc(this.length, this.paddingByte);
                let offset = 0;
                for (const member of this.members) {
                    switch (member.type) {
                    case "uint8":
                        this.buffer.set(data.slice(offset, offset + 1), member.offset);
                        offset += 1;
                        break;
                    case "uint16":
                        offset += offset % 2;
                        this.buffer.set(data.slice(offset, offset + 2), member.offset);
                        offset += 2;
                        break;
                    case "uint32":
                        offset += offset % 2;
                        this.buffer.set(data.slice(offset, offset + 4), member.offset);
                        offset += 4;
                        break;
                    case "uint8array":
                    case "uint8array-reversed":
                        this.buffer.set(data.slice(offset, offset + member.length), member.offset);
                        offset += member.length;
                        break;
                    case "struct":
                        const child = this.childStructs[member.key];
                        child.struct.build(data.slice(offset, offset + child.struct.length));
                        this.buffer.set(child.struct.serialize(), member.offset);
                        offset += child.struct.length;
                        break;
                    }
                }
            } else {
                const expectedLengths = `${this.getLength("unaligned")}/${this.getLength("aligned")}`;
                throw new Error(`Struct length mismatch (expected=${expectedLengths}, got=${data.length})`);
            }
        } else {
            this.buffer = this.defaultData ? Buffer.from(this.defaultData) : Buffer.alloc(this.length);
        }
        return this;
    }
}
