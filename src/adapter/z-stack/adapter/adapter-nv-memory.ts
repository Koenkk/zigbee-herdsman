/* eslint-disable max-len */
import {NvItemsIds, NvSystemIds, ZnpCommandStatus} from "../constants/common";
import {Subsystem} from "../unpi/constants";
import {Znp} from "../znp";
import * as Structs from "../structs";

export class AdapterNvMemory {
    private znp: Znp;

    public constructor(znp: Znp) {
        this.znp = znp;
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
    public async readItem<T extends Structs.BuiltStruct>(id: NvItemsIds, offset?: number, useStruct?: Structs.StructFactorySignature<T>): Promise<T>;

    public async readItem<T extends Structs.BuiltStruct>(id: NvItemsIds, offset = 0, useStruct?: Structs.StructFactorySignature<T>): Promise<Buffer | T> {
        const lengthResponse = await this.znp.request(Subsystem.SYS, "osalNvLength", {id});
        if (!lengthResponse.payload.length || lengthResponse.payload.length === 0) {
            return null;
        }
        const length = lengthResponse.payload.length;
        const buffer = Buffer.alloc(length);
        while (offset < length) {
            const readResponse = await this.znp.request(Subsystem.SYS, "osalNvReadExt", {id, offset});
            if (readResponse.payload.status !== 0) {
                throw new Error(`Received non-success status while reading NV (id=${id}, offset=${offset}, status=${readResponse.payload.status})`);
            }
            buffer.set(readResponse.payload.value, offset);
            offset += readResponse.payload.value.length;
        }
        if (useStruct) {
            return useStruct(buffer) as T;
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
    public async writeItem(id: NvItemsIds, data: Buffer, offset =0, autoInit = true): Promise<void> {
        const lengthResponse = await this.znp.request(Subsystem.SYS, "osalNvLength", {id});
        const exists = lengthResponse.payload.length && lengthResponse.payload.length > 0;
        if (!exists) {
            const initLength = data.length > 240 ? 240 : data.length;
            if (!autoInit) {
                throw new Error(`Cannot write NV memory item which does not exist (id=${id})`);
            }
            const initResponse = await this.znp.request(Subsystem.SYS, "osalNvItemInit", {id, len: data.length, initlen: initLength, initvalue: data.slice(0, initLength)}, undefined, [ZnpCommandStatus.SUCCESS, ZnpCommandStatus.NV_ITEM_INITIALIZED]);
            if (initResponse.payload.status !== 0x09) {
                throw new Error(`Failed to initialize NV memory item (id=${id}, name=${NvItemsIds[id]}, len=${data.length}, status=${initResponse.payload.status})`);
            }
        }
        let remaining = data.length;
        while (remaining > 0) {
            const writeLength = remaining > 246 ? 246 : remaining;
            const dataOffset = data.length - remaining;
            const writeData = data.slice(dataOffset, dataOffset + writeLength);
            const writeResponse = await this.znp.request(Subsystem.SYS, "osalNvWriteExt", {id, offset: dataOffset, len: writeLength, value: writeData});
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
        const current = await this.readItem(id);
        if (!current || !current.equals(data)) {
            await this.writeItem(id, data, 0, autoInit);
        }
    }

    public async deleteItem(id: NvItemsIds): Promise<void> {
        const lengthResponse = await this.znp.request(Subsystem.SYS, "osalNvLength", {id});
        const exists = lengthResponse.payload.length && lengthResponse.payload.length > 0;
        if (exists) {
            const deleteResponse = await this.znp.request(Subsystem.SYS, "osalNvDelete", {id, len:lengthResponse.payload.length});
            if (!deleteResponse || ![ZnpCommandStatus.SUCCESS, ZnpCommandStatus.NV_ITEM_INITIALIZED].includes(deleteResponse.payload.status)) {
                throw new Error(`Received non-success status while deleting NV (id=${id}, status=${deleteResponse.payload.status})`);
            }
        }
    }

    public async readExtendedTableEntry(sysId: NvSystemIds, id: NvItemsIds, subId: number, offset?: number): Promise<Buffer>;
    public async readExtendedTableEntry<T extends Structs.BuiltStruct>(sysId: NvSystemIds, id: NvItemsIds, subId: number, offset?: number, useStruct?: Structs.StructFactorySignature<T>): Promise<T>;
    public async readExtendedTableEntry<T extends Structs.BuiltStruct>(sysId: NvSystemIds, id: NvItemsIds, subId: number, offset?: number, useStruct?: Structs.StructFactorySignature<T>): Promise<Buffer | T> {
        const lengthResponse = await this.znp.request(Subsystem.SYS, "nvLength", {sysid: sysId, itemid: id, subid: subId});
        const exists = lengthResponse.payload.len && lengthResponse.payload.len > 0;
        if (exists) {
            const readResponse = await this.znp.request(Subsystem.SYS, "nvRead", {sysid: sysId, itemid: id, subid: subId, offset: offset || 0, len: lengthResponse.payload.len});
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

    public async writeExtendedTableEntry(sysId: NvSystemIds, id: NvItemsIds, subId: number, data: Buffer, offset?: number, autoInit=true): Promise<void> {
        const lengthResponse = await this.znp.request(Subsystem.SYS, "nvLength", {sysid: sysId, itemid: id, subid: subId});
        const exists = lengthResponse.payload.len && lengthResponse.payload.len > 0;
        if (!exists) {
            if (!autoInit) {
                throw new Error(`Cannot write NV memory extended table item which does not exist (sudId=${sysId}, id=${id}, subId=${subId})`);
            }
            const createResponse = await this.znp.request(Subsystem.SYS, "nvCreate", {sysid: sysId, itemid: id, subid: subId, len: data.length});
            if (!createResponse || createResponse.payload.status !== ZnpCommandStatus.SUCCESS) {
                throw new Error(`Failed to crate NV memory extended table item with status (sudId=${sysId}, id=${id}, subId=${subId})`);
            }
        }
        const writeResponse = await this.znp.request(Subsystem.SYS, "nvWrite", {sysid: sysId, itemid: id, subid: subId, offset: offset || 0, len: data.length, value: data});
        if (writeResponse.payload.status !== 0) {
            throw new Error(`Received non-success status while writing NV extended table idem (sudId=${sysId}, id=${id}, subId=${subId}, offset=${offset}, status=${writeResponse.payload.status})`);
        }
    }
}
