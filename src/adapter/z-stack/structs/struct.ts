/* Helper Types */
type StructMemberType = "uint8" | "uint16" | "uint32" | "uint8array" | "uint8array-reversed" | "struct";
type StructBuildOmitKeys = "member" | "method" | "build";
type StructChild = { offset:number, struct: Struct };
export type BuiltStruct<T = Struct> = Omit<T, StructBuildOmitKeys>;
export type StructFactorySignature<T = Struct> = (data?: Buffer) => T;

/**
 * Struct provides a builder-like interface to create Buffer-based memory
 * structures for read/write interfacing with data structures from adapters.
 */
export class Struct {

    /**
     * Creates an empty struct. Further calls to `member()` and `method()` functions will form the structure.
     * Finally call to `build()` will type the resulting structure appropriately without internal functions.
     */
    public static new(): Struct {
        return new Struct();
    }

    private buffer: Buffer;
    private members: { key: string, offset: number, type: StructMemberType }[] = [];
    private childStructs: { [key: string]: StructChild } = {};
    private length = 0;
    private constructor() { }

    /**
     * Returns raw contents of the structure as a sliced Buffer.
     * Mutations to the returned buffer will not be reflected within struct.
     */
    public getRaw(): Buffer {
        for (const key of Object.keys(this.childStructs)) {
            const child = this.childStructs[key];
            this.buffer.set(child.struct.getRaw(), child.offset);
        }
        return this.buffer.slice();
    }

    /**
     * Returns total length of the struct. Struct length is always fixed and configured
     * by calls to `member()` methods.
     */
    public getLength(): number {
        return this.length;
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
            if (!length) {
                throw new Error("Struct builder requires length for `uint8array` type");
            }
            Object.defineProperty(this, name,{
                enumerable: true,
                get: () => type === "uint8array-reversed" ?
                    this.buffer.slice(offset, offset + length).reverse() : 
                    this.buffer.slice(offset, offset + length),
                set: (value: Buffer) => {
                    if (value.length !== length) {
                        throw new Error(`Invalid length for member ${name} (expected=${length}, got=${value.length})`);
                    }
                    if (type === "uint8array-reversed") {
                        value = value.slice().reverse();
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
            Object.defineProperty(this, name,{
                enumerable: true,
                get: () => this.childStructs[name].struct
            });
            this.length += length;
        }
        }
        this.members.push({key: name, offset, type});
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
     * Creates the struct and optionally fills it with data. If data is provided, the length
     * of the provided buffer needs to match the structure length.
     * 
     * *This method is stripped from type on struct `build()`.*
     */
    public build(data?: Buffer): BuiltStruct<this> {
        if (data) {
            if (data.length !== this.length) {
                throw new Error(`Struct length mismatch (expected=${this.length}, got=${data.length})`);
            }
            this.buffer = data.slice();
            for (const key of Object.keys(this.childStructs)) {
                const child = this.childStructs[key];
                child.struct.build(this.buffer.slice(child.offset, child.offset + child.struct.length));
            }
        } else {
            this.buffer = Buffer.alloc(this.length);
        }
        return this;
    }
}
