import type {EUI64} from '../zspec/tstypes';

import {Utils as ZSpecUtils} from '../zspec';

export class Buffalo {
    protected position: number;
    protected buffer: Buffer;

    public constructor(buffer: Buffer, position = 0) {
        this.position = position;
        this.buffer = buffer;
    }

    public getPosition(): number {
        return this.position;
    }

    public getBuffer(): Buffer {
        return this.buffer;
    }

    public getWritten(): Buffer {
        return this.buffer.subarray(0, this.position);
    }

    public isMore(): boolean {
        return this.position < this.buffer.length;
    }

    public writeUInt8(value: number): void {
        this.buffer.writeUInt8(value, this.position);
        this.position++;
    }

    public readUInt8(): number {
        const value = this.buffer.readUInt8(this.position);
        this.position++;
        return value;
    }

    public writeUInt16(value: number): void {
        this.buffer.writeUInt16LE(value, this.position);
        this.position += 2;
    }

    public readUInt16(): number {
        const value = this.buffer.readUInt16LE(this.position);
        this.position += 2;
        return value;
    }

    public writeUInt24(value: number): void {
        this.buffer.writeUIntLE(value, this.position, 3);
        this.position += 3;
    }

    public readUInt24(): number {
        const value = this.buffer.readUIntLE(this.position, 3);
        this.position += 3;
        return value;
    }

    public writeUInt32(value: number): void {
        this.buffer.writeUInt32LE(value, this.position);
        this.position += 4;
    }

    public readUInt32(): number {
        const value = this.buffer.readUInt32LE(this.position);
        this.position += 4;
        return value;
    }

    public writeUInt40(value: number): void {
        this.buffer.writeUIntLE(value, this.position, 5);
        this.position += 5;
    }

    public readUInt40(): number {
        const value = this.buffer.readUIntLE(this.position, 5);
        this.position += 5;
        return value;
    }

    public writeUInt48(value: number): void {
        this.buffer.writeUIntLE(value, this.position, 6);
        this.position += 6;
    }

    public readUInt48(): number {
        const value = this.buffer.readUIntLE(this.position, 6);
        this.position += 6;
        return value;
    }

    public writeUInt56(value: bigint): void {
        this.buffer.writeUIntLE(Number(value & 0xffffffffffffn), this.position, 6);
        this.buffer.writeUInt8(Number(value >> 48n), this.position + 6);
        this.position += 7;
    }

    public readUInt56(): bigint {
        const low = this.buffer.readUIntLE(this.position, 6);
        const high = this.buffer.readUInt8(this.position + 6);
        this.position += 7;
        return (BigInt(high) << 48n) | BigInt(low);
    }

    public writeUInt64(value: bigint): void {
        this.buffer.writeBigUInt64LE(value, this.position);
        this.position += 8;
    }

    public readUInt64(): bigint {
        const value = this.buffer.readBigUInt64LE(this.position);
        this.position += 8;
        return value;
    }

    public writeInt8(value: number): void {
        this.buffer.writeInt8(value, this.position);
        this.position++;
    }

    public readInt8(): number {
        const value = this.buffer.readInt8(this.position);
        this.position++;
        return value;
    }

    public writeInt16(value: number): void {
        this.buffer.writeInt16LE(value, this.position);
        this.position += 2;
    }

    public readInt16(): number {
        const value = this.buffer.readInt16LE(this.position);
        this.position += 2;
        return value;
    }

    public writeInt24(value: number): void {
        this.buffer.writeIntLE(value, this.position, 3);
        this.position += 3;
    }

    public readInt24(): number {
        const value = this.buffer.readIntLE(this.position, 3);
        this.position += 3;
        return value;
    }

    public writeInt32(value: number): void {
        this.buffer.writeInt32LE(value, this.position);
        this.position += 4;
    }

    public readInt32(): number {
        const value = this.buffer.readInt32LE(this.position);
        this.position += 4;
        return value;
    }

    public writeInt40(value: number): void {
        this.buffer.writeIntLE(value, this.position, 5);
        this.position += 5;
    }

    public readInt40(): number {
        const value = this.buffer.readIntLE(this.position, 5);
        this.position += 5;
        return value;
    }

    public writeInt48(value: number): void {
        this.buffer.writeIntLE(value, this.position, 6);
        this.position += 6;
    }

    public readInt48(): number {
        const value = this.buffer.readIntLE(this.position, 6);
        this.position += 6;
        return value;
    }

    public writeInt56(value: bigint): void {
        const unsignedValue = value < 0n ? (1n << 56n) + value : value;
        this.buffer.writeUIntLE(Number(unsignedValue & 0xffffffffffffn), this.position, 6);
        this.buffer.writeUInt8(Number(unsignedValue >> 48n), this.position + 6);
        this.position += 7;
    }

    public readInt56(): bigint {
        const low = BigInt(this.buffer.readUIntLE(this.position, 6));
        const high = BigInt(this.buffer.readUInt8(this.position + 6));
        let result = (high << 48n) | low;
        if (high & 0x80n) {
            result -= 1n << 56n;
        }
        this.position += 7;
        return result;
    }

    public writeInt64(value: bigint): void {
        this.buffer.writeBigInt64LE(value, this.position);
        this.position += 8;
    }

    public readInt64(): bigint {
        const value = this.buffer.readBigInt64LE(this.position);
        this.position += 8;
        return value;
    }

    public writeFloatLE(value: number): void {
        this.buffer.writeFloatLE(value, this.position);
        this.position += 4;
    }

    public readFloatLE(): number {
        const value = this.buffer.readFloatLE(this.position);
        this.position += 4;
        return value;
    }

    public writeDoubleLE(value: number): void {
        this.buffer.writeDoubleLE(value, this.position);
        this.position += 8;
    }

    public readDoubleLE(): number {
        const value = this.buffer.readDoubleLE(this.position);
        this.position += 8;
        return value;
    }

    public writeIeeeAddr(value: string /*TODO: EUI64*/): void {
        this.writeUInt32(parseInt(value.slice(10), 16));
        this.writeUInt32(parseInt(value.slice(2, 10), 16));
    }

    public readIeeeAddr(): EUI64 {
        return ZSpecUtils.eui64LEBufferToHex(this.readBuffer(8));
    }

    public writeBuffer(values: Buffer | number[], length: number): void {
        if (values.length !== length) {
            throw new Error(`Length of values: '${values}' is not consitent with expected length '${length}'`);
        }

        if (!(values instanceof Buffer)) {
            values = Buffer.from(values);
        }

        this.position += values.copy(this.buffer, this.position);
    }

    public readBuffer(length: number): Buffer {
        const value = this.buffer.subarray(this.position, this.position + length);
        this.position += length;
        return value;
    }

    public writeListUInt8(values: number[]): void {
        for (const value of values) {
            this.writeUInt8(value);
        }
    }

    public readListUInt8(length: number): number[] {
        const value: number[] = [];
        for (let i = 0; i < length; i++) {
            value.push(this.readUInt8());
        }
        return value;
    }

    public writeListUInt16(values: number[]): void {
        for (const value of values) {
            this.writeUInt16(value);
        }
    }

    public readListUInt16(length: number): number[] {
        const value: number[] = [];
        for (let i = 0; i < length; i++) {
            value.push(this.readUInt16());
        }

        return value;
    }

    public writeListUInt24(values: number[]): void {
        for (const value of values) {
            this.writeUInt24(value);
        }
    }

    public readListUInt24(length: number): number[] {
        const value: number[] = [];
        for (let i = 0; i < length; i++) {
            value.push(this.readUInt24());
        }

        return value;
    }

    public writeListUInt32(values: number[]): void {
        for (const value of values) {
            this.writeUInt32(value);
        }
    }

    public readListUInt32(length: number): number[] {
        const value: number[] = [];
        for (let i = 0; i < length; i++) {
            value.push(this.readUInt32());
        }
        return value;
    }

    public writeUtf8String(value: string): void {
        // value==='' is supported and is identified as "empty string"
        this.position += this.buffer.write(value, this.position, 'utf8');
    }

    public readUtf8String(length: number): string {
        // length===0 is supported and is identified as "empty string"
        const value = this.buffer.toString('utf8', this.position, this.position + length);
        this.position += length;
        return value;
    }
}

export default Buffalo;
