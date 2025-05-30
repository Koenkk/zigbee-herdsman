import assert from "node:assert";

import {NvItemsIds, type NvSystemIds, ZnpCommandStatus} from "../constants/common";
import type * as Structs from "../structs";
import type {BuiltTable} from "../structs";
import {Subsystem} from "../unpi/constants";
import type {Znp} from "../znp";

/**
 * Adapter non-volatile memory instrumentation. This class provides interface to interact
 * with ZNP adapter's NV memory. Provided functionality covers basic operations from reading,
 * writing and deleting keys to extended table manipulation.
 */
export class AdapterNvMemory {
    public memoryAlignment?: Structs.StructMemoryAlignment;

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
    public async readItem<R extends Structs.BuiltStruct, T extends R | Structs.BuiltTable<R>>(
        id: NvItemsIds,
        offset?: number,
        useStruct?: Structs.MemoryObjectFactory<T>,
    ): Promise<T>;

    public async readItem<R extends Structs.BuiltStruct, T extends R | Structs.BuiltTable<R>>(
        id: NvItemsIds,
        offset = 0,
        useStruct?: Structs.MemoryObjectFactory<T>,
    ): Promise<Buffer | T | null> {
        if (useStruct) {
            this.checkMemoryAlignmentSetup();
        }
        const lengthResponse = await this.retry(() => this.znp.requestWithReply(Subsystem.SYS, "osalNvLength", {id}));
        if (!lengthResponse?.payload?.length || lengthResponse?.payload?.length === 0) {
            return null;
        }
        const length = lengthResponse.payload.length;
        const buffer = Buffer.alloc(length);
        while (offset < length) {
            const readResponse = await this.retry(() => this.znp.request(Subsystem.SYS, "osalNvReadExt", {id, offset}));
            /* v8 ignore start */
            if (!readResponse) {
                return null;
            }
            if (readResponse.payload?.status !== 0) {
                throw new Error(`Received non-success status while reading NV (id=${id}, offset=${offset}, status=${readResponse.payload.status})`);
            }
            /* v8 ignore stop */
            buffer.set(readResponse.payload.value, offset);
            offset += readResponse.payload.value.length;
        }
        if (useStruct) {
            return useStruct(buffer, this.memoryAlignment) as T;
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

    public async writeItem(id: NvItemsIds, data: Buffer | Structs.SerializableMemoryObject, offset = 0, autoInit = true): Promise<void> {
        this.checkMemoryAlignmentSetup();
        const buffer = Buffer.isBuffer(data) ? data : data.serialize(this.memoryAlignment);
        const lengthResponse = await this.retry(() => this.znp.requestWithReply(Subsystem.SYS, "osalNvLength", {id}));
        const exists = lengthResponse.payload.length && lengthResponse.payload.length > 0;
        if (!exists) {
            /* v8 ignore next */
            const initLength = buffer.length > 240 ? 240 : buffer.length;
            /* v8 ignore start */
            if (!autoInit) {
                throw new Error(`Cannot write NV memory item which does not exist (id=${id})`);
            }
            /* v8 ignore stop */
            const initResponse = await this.retry(() =>
                this.znp.requestWithReply(
                    Subsystem.SYS,
                    "osalNvItemInit",
                    {id, len: buffer.length, initlen: initLength, initvalue: buffer.slice(0, initLength)},
                    undefined,
                    undefined,
                    [ZnpCommandStatus.SUCCESS, ZnpCommandStatus.NV_ITEM_INITIALIZED],
                ),
            );
            /* v8 ignore start */
            if (initResponse.payload.status !== 0x09) {
                throw new Error(
                    `Failed to initialize NV memory item (id=${id}, name=${NvItemsIds[id]}, len=${buffer.length}, status=${initResponse.payload.status})`,
                );
            }
            /* v8 ignore stop */
        }
        let remaining = buffer.length;
        while (remaining > 0) {
            /* v8 ignore next */
            const writeLength = remaining > 240 ? 240 : remaining;
            const dataOffset = buffer.length - remaining;
            const writeData = buffer.slice(dataOffset, dataOffset + writeLength);
            const writeResponse = await this.retry(() =>
                this.znp.requestWithReply(Subsystem.SYS, "osalNvWriteExt", {id, offset: dataOffset, len: writeLength, value: writeData}),
            );
            /* v8 ignore start */
            if (writeResponse.payload.status !== 0) {
                throw new Error(`Received non-success status while writing NV (id=${id}, offset=${offset}, status=${writeResponse.payload.status})`);
            }
            /* v8 ignore stop */
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
        this.checkMemoryAlignmentSetup();
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
        this.checkMemoryAlignmentSetup();
        const lengthResponse = await this.retry(() => this.znp.requestWithReply(Subsystem.SYS, "osalNvLength", {id}));
        const exists = lengthResponse.payload.length && lengthResponse.payload.length > 0;

        if (exists) {
            const deleteResponse = await this.retry(() =>
                this.znp.requestWithReply(Subsystem.SYS, "osalNvDelete", {id, len: lengthResponse.payload.length}),
            );
            /* v8 ignore start */
            if (!deleteResponse || ![ZnpCommandStatus.SUCCESS, ZnpCommandStatus.NV_ITEM_INITIALIZED].includes(deleteResponse.payload.status)) {
                throw new Error(`Received non-success status while deleting NV (id=${id}, status=${deleteResponse.payload.status})`);
            }
            /* v8 ignore stop */
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
    public async readExtendedTableEntry<T extends Structs.BuiltStruct>(
        sysId: NvSystemIds,
        id: NvItemsIds,
        subId: number,
        offset?: number,
        useStruct?: Structs.MemoryObjectFactory<T>,
    ): Promise<T>;
    public async readExtendedTableEntry<T extends Structs.BuiltStruct>(
        sysId: NvSystemIds,
        id: NvItemsIds,
        subId: number,
        offset?: number,
        useStruct?: Structs.MemoryObjectFactory<T>,
    ): Promise<Buffer | T | null> {
        this.checkMemoryAlignmentSetup();
        const lengthResponse = await this.retry(() => this.znp.requestWithReply(Subsystem.SYS, "nvLength", {sysid: sysId, itemid: id, subid: subId}));
        const exists = lengthResponse.payload.len && lengthResponse.payload.len > 0;
        if (exists) {
            const readResponse = await this.retry(() =>
                this.znp.requestWithReply(Subsystem.SYS, "nvRead", {
                    sysid: sysId,
                    itemid: id,
                    subid: subId,
                    offset: offset || 0,
                    len: lengthResponse.payload.len,
                }),
            );
            /* v8 ignore start */
            if (readResponse.payload.status !== 0) {
                throw new Error(
                    `Received non-success status while reading NV extended table entry (sysId=${sysId}, id=${id}, subId=${subId}, offset=${offset}, status=${readResponse.payload.status})`,
                );
            }
            /* v8 ignore stop */
            /* v8 ignore next */
            return useStruct ? useStruct(readResponse.payload.value) : readResponse.payload.value;
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
    public async writeExtendedTableEntry(
        sysId: NvSystemIds,
        id: NvItemsIds,
        subId: number,
        data: Buffer,
        offset?: number,
        autoInit = true,
    ): Promise<void> {
        this.checkMemoryAlignmentSetup();
        const lengthResponse = await this.retry(() => this.znp.requestWithReply(Subsystem.SYS, "nvLength", {sysid: sysId, itemid: id, subid: subId}));
        const exists = lengthResponse.payload.len && lengthResponse.payload.len > 0;
        /* v8 ignore start */
        if (!exists) {
            if (!autoInit) {
                throw new Error(`Cannot write NV memory extended table item which does not exist (sudId=${sysId}, id=${id}, subId=${subId})`);
            }
            const createResponse = await this.retry(() =>
                this.znp.request(Subsystem.SYS, "nvCreate", {sysid: sysId, itemid: id, subid: subId, len: data.length}),
            );
            if (!createResponse || createResponse.payload.status !== ZnpCommandStatus.SUCCESS) {
                throw new Error(`Failed to crate NV memory extended table item with status (sudId=${sysId}, id=${id}, subId=${subId})`);
            }
        }
        /* v8 ignore stop */
        const writeResponse = await this.retry(() =>
            this.znp.requestWithReply(Subsystem.SYS, "nvWrite", {
                sysid: sysId,
                itemid: id,
                subid: subId,
                offset: offset || 0,
                len: data.length,
                value: data,
            }),
        );
        /* v8 ignore start */
        if (writeResponse.payload.status !== 0) {
            throw new Error(
                `Received non-success status while writing NV extended table idem (sudId=${sysId}, id=${id}, subId=${subId}, offset=${offset}, status=${writeResponse.payload.status})`,
            );
        }
        /* v8 ignore stop */
    }

    /**
     * Reads a legacy NV table at defined index into raw `Buffer` object array. Providing maximum
     * length is necessary in order to prevent invalid memory access.
     *
     * @param mode Only legacy mode is supported with this signature.
     * @param id The item index at which the table starts.
     * @param maxLength Maximum number of items the table may contain.
     */
    public async readTable(mode: "legacy", id: NvItemsIds, maxLength: number): Promise<Buffer[]>;

    /**
     * Reads a legacy table at defined index into a table structure covering struct entries.
     * Providing maximum length is necessary in order to prevent invalid memory access.
     *
     * @param mode Only legacy mode is supported with this signature.
     * @param id The item index at which the table starts.
     * @param maxLength Maximum number of items the table may contain.
     * @param useTable Table factory to spawn a table and populate with retrieved data.
     */
    public async readTable<R extends Structs.BuiltStruct, T extends Structs.BuiltTable<R>>(
        mode: "legacy",
        id: NvItemsIds,
        maxLength: number,
        useTable?: Structs.MemoryObjectFactory<T>,
    ): Promise<T>;

    /**
     * Reads an extended (Z-Stack 3.x.0+) table into raw `Buffer` object array.
     * Maximum length is optional since the table boundary can be detected automatically.
     *
     * @param mode Only extended mode is supported with this signature.
     * @param sysId SimpleLink system identifier.
     * @param id Extended table NV index.
     * @param maxLength Maximum number of entries to load from the table.
     */
    public async readTable(mode: "extended", sysId: NvSystemIds, id: NvItemsIds, maxLength?: number): Promise<Buffer[]>;

    /**
     * Reads an extended (Z-Stack 3.x.0+) table into a table structure covering struct entries.
     * Maximum length is optional since the table boundary can be detected automatically.
     *
     * @param mode Only extended mode is supported with this signature.
     * @param sysId SimpleLink system identifier.
     * @param id Extended table NV index.
     * @param maxLength Maximum number of entries to load from the table.
     * @param useTable Table factory to spawn a table and populate with retrieved data.
     */
    public async readTable<R extends Structs.BuiltStruct, T extends Structs.BuiltTable<R>>(
        mode: "extended",
        sysId: NvSystemIds,
        id: NvItemsIds,
        maxLength?: number,
        useTable?: Structs.MemoryObjectFactory<T>,
    ): Promise<T>;

    public async readTable<R extends Structs.BuiltStruct, T extends Structs.BuiltTable<R>>(
        mode: "legacy" | "extended",
        p1: NvSystemIds | NvItemsIds,
        p2: NvItemsIds | number,
        p3?: Structs.MemoryObjectFactory<T> | number,
        p4?: Structs.MemoryObjectFactory<T>,
    ): Promise<Buffer[] | T> {
        const sysId = mode === "legacy" ? undefined : (p1 as NvSystemIds);
        const id = (mode === "legacy" ? p1 : p2) as NvItemsIds;
        const maxLength = (mode === "legacy" ? p2 : p3) as number;
        const useTable = (mode === "legacy" ? p3 : p4) as Structs.MemoryObjectFactory<T>;

        const rawEntries: Buffer[] = [];
        let entryOffset = 0;
        let rawEntry = null;
        if (mode === "legacy") {
            do {
                rawEntry = await this.readItem(id + entryOffset++);
                if (rawEntry) {
                    rawEntries.push(rawEntry);
                }
            } while (rawEntry !== null && entryOffset < maxLength);
        } else {
            do {
                assert(sysId !== undefined);
                rawEntry = await this.readExtendedTableEntry(sysId, id, entryOffset++);
                if (rawEntry) {
                    rawEntries.push(rawEntry);
                }
                /* v8 ignore next */
            } while (rawEntry !== null && (!maxLength || entryOffset < maxLength));
        }

        /* v8 ignore next */
        return useTable ? useTable(rawEntries) : rawEntries;
    }

    /**
     * Writes a struct-based table structure into a legacy NV memory position.
     *
     * @param mode Only legacy mode is supported with this signature.
     * @param id Start NV item index.
     * @param table Table structure to write to NV memory.
     */
    public async writeTable<R extends Structs.BuiltStruct>(mode: "legacy", id: NvItemsIds, table: BuiltTable<R>): Promise<void>;

    /**
     * Writes a struct-based table structure into an extended NV memory position.
     *
     * @param mode Only extended mode is supported with this signature.
     * @param sysId SimpleLink system identifier.
     * @param id Extended table NV item index.
     * @param table Table structure to write to NV memory.
     */
    public async writeTable<R extends Structs.BuiltStruct>(mode: "extended", sysId: NvSystemIds, id: NvItemsIds, table: BuiltTable<R>): Promise<void>;

    public async writeTable<R extends Structs.BuiltStruct>(
        mode: "extended" | "legacy",
        p1: NvSystemIds | NvItemsIds,
        p2: NvItemsIds | BuiltTable<R>,
        p3?: BuiltTable<R>,
    ): Promise<void> {
        this.checkMemoryAlignmentSetup();
        const sysId = mode === "legacy" ? undefined : (p1 as NvSystemIds);
        const id = (mode === "legacy" ? p1 : p2) as NvItemsIds;
        const table = (mode === "legacy" ? p2 : p3) as BuiltTable<R>;

        if (mode === "legacy") {
            for (const [index, entry] of table.entries.entries()) {
                await this.writeItem(id + index, entry.serialize(this.memoryAlignment));
            }
        } else {
            assert(sysId !== undefined);
            for (const [index, entry] of table.entries.entries()) {
                await this.writeExtendedTableEntry(sysId, id, index, entry.serialize(this.memoryAlignment));
            }
        }
    }

    /**
     * Internal function to prevent occasional ZNP request failures.
     *
     * *Some timeouts were present when working with SimpleLink Z-Stack 3.x.0+.*
     *
     * @param fn Function to retry.
     * @param retries Maximum number of retries.
     */
    // @ts-expect-error always returns something or throws an error as retries >= 1
    private async retry<R>(fn: () => Promise<R>, retries = 3): Promise<R> {
        assert(retries >= 1);
        let i = 0;
        while (i < retries) {
            try {
                const result = await fn();
                return result;
                /* v8 ignore start */
            } catch (error) {
                if (i >= retries) {
                    throw error;
                }
            }

            i++;
        }
        /* v8 ignore stop */
    }

    /**
     * Internal function used by NV manipulation methods to check for correct driver initialization.
     */
    private checkMemoryAlignmentSetup(): void {
        /* v8 ignore start */
        if (this.memoryAlignment === undefined) {
            throw new Error("adapter memory alignment unknown - has nv memory driver been initialized?");
        }
        /* v8 ignore stop */
    }
}
