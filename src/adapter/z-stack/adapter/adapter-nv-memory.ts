/* eslint-disable max-len */
import {NvItemsIds, NvSystemIds, ZnpCommandStatus} from "../constants/common";
import {Subsystem} from "../unpi/constants";
import {Znp} from "../znp";
import * as Structs from "../structs";
import {InlineTable} from "../structs";

export class AdapterNvMemory {
    public memoryAlignment: Structs.StructMemoryAlignment = null;
    
    private znp: Znp;

    public constructor(znp: Znp) {
        this.znp = znp;
    }

    /**
     * Initialize NV memory driver by examining target and determining memory alignment.
     */
    public async init(): Promise<void> {
        /* use `ZCD_NV_NWKKEY` to determine if target platform uses memory alignment (length 21 = unaligned, length 24 = aligned) */
        const rawNwkKey = await this.readItem(NvItemsIds.NWKKEY);
        this.memoryAlignment = rawNwkKey.length === 21 ? "unaligned" : "aligned";
    }

    /**
     * Reads a variable-length item from NV memory and returns buffer object. Read can be offset as required.
     * 
     * @param id NV item identifier.
     * @param offset Desired data offset to read from.
     */
    public async readItem(id: NvItemsIds, offset?: number): Promise<Buffer>;

    /**
     * Reads a variable-length item from NV memory and creates a builds a requested struct.
     * 
     * @param id NV item identifier.
     * @param offset Desired data offset to read from.
     * @param useStruct Struct factory to use to wrap the data in.
     */
    public async readItem<R extends Structs.BuiltStruct, T extends R | Structs.BuiltInlineTable<R>>(id: NvItemsIds, offset?: number, useStruct?: Structs.MemoryObjectFactory<T>): Promise<T>;

    public async readItem<R extends Structs.BuiltStruct, T extends R | Structs.BuiltInlineTable<R>>(id: NvItemsIds, offset = 0, useStruct?: Structs.MemoryObjectFactory<T>): Promise<Buffer | T> {
        if (this.memoryAlignment === null && useStruct) {
            throw new Error("adapter memory alignment unknown - was nv memory driver initialized?");
        }
        const lengthResponse = await this.retry(() => this.znp.request(Subsystem.SYS, "osalNvLength", {id}));
        if (!lengthResponse.payload.length || lengthResponse.payload.length === 0) {
            return null;
        }
        const length = lengthResponse.payload.length;
        const buffer = Buffer.alloc(length);
        while (offset < length) {
            const readResponse = await this.retry(() => this.znp.request(Subsystem.SYS, "osalNvReadExt", {id, offset}));
            if (readResponse.payload.status !== 0) {
                throw new Error(`Received non-success status while reading NV (id=${id}, offset=${offset}, status=${readResponse.payload.status})`);
            }
            buffer.set(readResponse.payload.value, offset);
            offset += readResponse.payload.value.length;
        }
        if (useStruct) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return (useStruct as any)(buffer, this.memoryAlignment) as T;
        }
        return buffer;
    }

    /**
     * Writes data to adapter NV memory. Method fails if write fails.
     * 
     * @param id NV item identifier.
     * @param data Data to be written.
     * @param offset Offset within NV item to write the data.
     * @param autoInit Whether NV item should be automatically initialized if not present.
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public async writeItem(id: NvItemsIds, data: Buffer | Structs.SerializableMemoryObject, offset =0, autoInit = true): Promise<void> {
        if (this.memoryAlignment === null) {
            throw new Error("adapter memory alignment unknown - was nv memory driver initialized?");
        }
        const buffer = Buffer.isBuffer(data) ? data : data.serialize(this.memoryAlignment);
        const lengthResponse = await this.retry(() => this.znp.request(Subsystem.SYS, "osalNvLength", {id}));
        const exists = lengthResponse.payload.length && lengthResponse.payload.length > 0;
        if (!exists) {
            const initLength = buffer.length > 240 ? 240 : buffer.length;
            if (!autoInit) {
                throw new Error(`Cannot write NV memory item which does not exist (id=${id})`);
            }
            const initResponse = await this.retry(() => this.znp.request(Subsystem.SYS, "osalNvItemInit", {id, len: buffer.length, initlen: initLength, initvalue: buffer.slice(0, initLength)}, undefined, [ZnpCommandStatus.SUCCESS, ZnpCommandStatus.NV_ITEM_INITIALIZED]));
            if (initResponse.payload.status !== 0x09) {
                throw new Error(`Failed to initialize NV memory item (id=${id}, name=${NvItemsIds[id]}, len=${buffer.length}, status=${initResponse.payload.status})`);
            }
        }
        let remaining = buffer.length;
        while (remaining > 0) {
            const writeLength = remaining > 240 ? 240 : remaining;
            const dataOffset = buffer.length - remaining;
            const writeData = buffer.slice(dataOffset, dataOffset + writeLength);
            const writeResponse = await this.retry(() => this.znp.request(Subsystem.SYS, "osalNvWriteExt", {id, offset: dataOffset, len: writeLength, value: writeData}));
            if (writeResponse.payload.status !== 0) {
                throw new Error(`Received non-success status while writing NV (id=${id}, offset=${offset}, status=${writeResponse.payload.status})`);
            }
            remaining -= writeLength;
        }
    }

    /**
     * Determines whether NV item is different from provided data and updates if necessary.
     * 
     * @param id NV item identifier.
     * @param data Desired NV item value.
     * @param autoInit Whether NV item should be automatically initialized if not present.
     */
    public async updateItem(id: NvItemsIds, data: Buffer, autoInit = true): Promise<void> {
        if (this.memoryAlignment === null) {
            throw new Error("adapter memory alignment unknown - was nv memory driver initialized?");
        }
        const current = await this.readItem(id);
        if (!current || !current.equals(data)) {
            await this.writeItem(id, data, 0, autoInit);
        }
    }

    /**
     * Deletes an NV memory item.
     * 
     * @param id NV item identifier.
     */
    public async deleteItem(id: NvItemsIds): Promise<void> {
        if (this.memoryAlignment === null) {
            throw new Error("adapter memory alignment unknown - was nv memory driver initialized?");
        }
        const lengthResponse = await this.retry(() => this.znp.request(Subsystem.SYS, "osalNvLength", {id}));
        const exists = lengthResponse.payload.length && lengthResponse.payload.length > 0;
        if (exists) {
            const deleteResponse = await this.retry(() => this.znp.request(Subsystem.SYS, "osalNvDelete", {id, len:lengthResponse.payload.length}));
            if (!deleteResponse || ![ZnpCommandStatus.SUCCESS, ZnpCommandStatus.NV_ITEM_INITIALIZED].includes(deleteResponse.payload.status)) {
                throw new Error(`Received non-success status while deleting NV (id=${id}, status=${deleteResponse.payload.status})`);
            }
        }
    }

    /**
     * Reads extended table entry (used by Z-Stack 3.x+). NV tables within newer Z-Stack releases include 16-bit `subId`
     * identifying table entries.
     * 
     * @param sysId SimpleLink system identifier.
     * @param id NV item identifier.
     * @param subId Entry index.
     * @param offset Data offset to read from.
     */
    public async readExtendedTableEntry(sysId: NvSystemIds, id: NvItemsIds, subId: number, offset?: number): Promise<Buffer>;
    public async readExtendedTableEntry<T extends Structs.BuiltStruct>(sysId: NvSystemIds, id: NvItemsIds, subId: number, offset?: number, useStruct?: Structs.MemoryObjectFactory<T>): Promise<T>;
    public async readExtendedTableEntry<T extends Structs.BuiltStruct>(sysId: NvSystemIds, id: NvItemsIds, subId: number, offset?: number, useStruct?: Structs.MemoryObjectFactory<T>): Promise<Buffer | T> {
        if (this.memoryAlignment === null) {
            throw new Error("adapter memory alignment unknown - was nv memory driver initialized?");
        }
        const lengthResponse = await this.retry(() => this.znp.request(Subsystem.SYS, "nvLength", {sysid: sysId, itemid: id, subid: subId}));
        const exists = lengthResponse.payload.len && lengthResponse.payload.len > 0;
        if (exists) {
            const readResponse = await this.retry(() => this.znp.request(Subsystem.SYS, "nvRead", {sysid: sysId, itemid: id, subid: subId, offset: offset || 0, len: lengthResponse.payload.len}));
            if (readResponse.payload.status !== 0) {
                throw new Error(`Received non-success status while reading NV extended table entry (sysId=${sysId}, id=${id}, subId=${subId}, offset=${offset}, status=${readResponse.payload.status})`);
            }
            if (useStruct) {
                return useStruct(readResponse.payload.value);
            } else {
                return readResponse.payload.value;
            }
        }
        return null;
    }

    /**
     * Writes extended table entry (user by Z-Stack 3.x+). NV tables within newer Z-Stack releases include 16-bit `subId`
     * identifying table tnreis.
     * 
     * @param sysId SimpleLink system identifier.
     * @param id NV item identifier.
     * @param subId Entry index.
     * @param data Data to write to the table.
     * @param offset Offset to write at.
     * @param autoInit Whether non-existent entry should be automatically initialized.
     */
    public async writeExtendedTableEntry(sysId: NvSystemIds, id: NvItemsIds, subId: number, data: Buffer, offset?: number, autoInit=true): Promise<void> {
        if (this.memoryAlignment === null) {
            throw new Error("adapter memory alignment unknown - was nv memory driver initialized?");
        }
        const lengthResponse = await this.retry(() => this.znp.request(Subsystem.SYS, "nvLength", {sysid: sysId, itemid: id, subid: subId}));
        const exists = lengthResponse.payload.len && lengthResponse.payload.len > 0;
        if (!exists) {
            if (!autoInit) {
                throw new Error(`Cannot write NV memory extended table item which does not exist (sudId=${sysId}, id=${id}, subId=${subId})`);
            }
            const createResponse = await this.retry(() => this.znp.request(Subsystem.SYS, "nvCreate", {sysid: sysId, itemid: id, subid: subId, len: data.length}));
            if (!createResponse || createResponse.payload.status !== ZnpCommandStatus.SUCCESS) {
                throw new Error(`Failed to crate NV memory extended table item with status (sudId=${sysId}, id=${id}, subId=${subId})`);
            }
        }
        const writeResponse = await this.retry(() => this.znp.request(Subsystem.SYS, "nvWrite", {sysid: sysId, itemid: id, subid: subId, offset: offset || 0, len: data.length, value: data}));
        if (writeResponse.payload.status !== 0) {
            throw new Error(`Received non-success status while writing NV extended table idem (sudId=${sysId}, id=${id}, subId=${subId}, offset=${offset}, status=${writeResponse.payload.status})`);
        }
    }

    public async readTable(mode: "legacy", id: NvItemsIds, maxLength: number): Promise<Buffer[]>;

    public async readTable<T extends Structs.BuiltStruct>(mode: "legacy", id: NvItemsIds, maxLength: number, useStruct?: Structs.MemoryObjectFactory<T>): Promise<T[]>;

    public async readTable(mode: "extended", sysId: NvSystemIds, id: NvItemsIds, maxLength?: number): Promise<Buffer[]>;

    public async readTable<T extends Structs.BuiltStruct>(mode: "extended", sysId: NvSystemIds, id: NvItemsIds, maxLength?: number, useStruct?: Structs.MemoryObjectFactory<T>): Promise<T[]>;

    public async readTable<T extends Structs.BuiltStruct>(mode: "legacy" | "extended", p1: NvSystemIds | NvItemsIds, p2: NvItemsIds | number, p3?: Structs.MemoryObjectFactory<T> | number, p4?: Structs.MemoryObjectFactory<T>): Promise<Buffer[] | T[]> {
        const sysId = (mode === "legacy") ? undefined : p1 as NvSystemIds;
        const id = (mode === "legacy" ? p1 : p2) as NvItemsIds;
        const maxLength = (mode === "legacy" ? p2 : p3) as number;
        const useStruct = (mode === "legacy" ? p3 : p4) as Structs.MemoryObjectFactory<T>;

        const rawEntries: Buffer[] = [];
        let entryOffset = 0;
        let rawEntry = null;
        if (mode === "legacy") {
            do {
                rawEntry = await this.readItem(id + (entryOffset++));
                console.log(new Date().getTime(), entryOffset - 1, rawEntry);
                if (rawEntry) {
                    rawEntries.push(rawEntry);
                }
            } while (rawEntry !== null && entryOffset < maxLength);
        } else {
            do {
                rawEntry = await this.readExtendedTableEntry(sysId, id, entryOffset++);
                console.log(new Date().getTime(), entryOffset - 1, rawEntry);
                if (rawEntry) {
                    rawEntries.push(rawEntry);
                }
            } while (rawEntry !== null && (!maxLength || entryOffset < maxLength));
        }

        return useStruct ? rawEntries.map(e => useStruct(e)) : rawEntries;
    }

    private async retry<R>(fn: (() => Promise<R>), retries = 3): Promise<R> {
        let i = 0;
        while (i < retries) {
            try {
                const result = await fn();
                return result;
            } catch (error) {
                if (i >= retries) {
                    throw error;
                }
            }
            i++;
        }
    }
}
