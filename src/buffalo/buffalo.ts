import {Options, ReadResult, Value} from './tstype';
import {IsNumberArray} from '../utils';

class Buffalo {
    public static readEmpty(): ReadResult {
        return {value: null, length: 0};
    }

    public static writeEmpty(): number {
        return 0;
    }

    public static writeInt8(buffer: Buffer, offset: number, value: number): number {
        buffer.writeInt8(value, offset);
        return 1;
    }

    public static readInt8(buffer: Buffer, offset: number): ReadResult {
        return {value: buffer.readInt8(offset), length: 1};
    }

    public static writeUInt8(buffer: Buffer, offset: number, value: number): number {
        buffer.writeUInt8(value, offset);
        return 1;
    }

    public static readUInt8(buffer: Buffer, offset: number): ReadResult {
        return {value: buffer.readUInt8(offset), length: 1};
    }

    public static writeUInt16(buffer: Buffer, offset: number, value: number): number {
        buffer.writeUInt16LE(value, offset);
        return 2;
    }

    public static readUInt24(buffer: Buffer, offset: number): ReadResult {
        const lsb = buffer.readUInt16LE(offset);
        const msb = buffer.readUInt8(offset + 2);
        return {value: (msb * 65536) + lsb, length: 3};
    }

    public static writeUInt24(buffer: Buffer, offset: number, value: number): number {
        let temp = Buffer.alloc(4);
        temp.writeUInt32LE(value, 0);
        temp = temp.slice(0, 3);
        return this.writeBuffer(buffer, offset, temp, 3);
    }

    public static readInt24(buffer: Buffer, offset: number): ReadResult {
        const lsb = buffer.readUInt16LE(offset);
        const msb = buffer.readUInt8(offset + 2);
        const sign = (msb & 0x80) >> 7;
        let value = ((msb & 0x7F) * 65536) + lsb;

        if (sign) {
            value = -(0x7FFFFF - value + 1);
        }

        return {value, length: 3};
    }

    public static writeInt24(buffer: Buffer, offset: number, value: number): number {
        let temp = Buffer.alloc(4);
        temp.writeInt32LE(value, 0);
        temp = temp.slice(0, 3);
        return this.writeBuffer(buffer, offset, temp, 3);
    }

    public static readUInt16(buffer: Buffer, offset: number): ReadResult {
        return {value: buffer.readUInt16LE(offset), length: 2};
    }

    public static writeInt16(buffer: Buffer, offset: number, value: number): number {
        buffer.writeInt16LE(value, offset);
        return 2;
    }

    public static readInt16(buffer: Buffer, offset: number): ReadResult {
        return {value: buffer.readInt16LE(offset), length: 2};
    }

    public static writeUInt32(buffer: Buffer, offset: number, value: number): number {
        buffer.writeUInt32LE(value, offset);
        return 4;
    }

    public static readUInt32(buffer: Buffer, offset: number): ReadResult {
        return {value: buffer.readUInt32LE(offset), length: 4};
    }

    public static writeInt32(buffer: Buffer, offset: number, value: number): number {
        buffer.writeInt32LE(value, offset);
        return 4;
    }

    public static readInt32(buffer: Buffer, offset: number): ReadResult {
        return {value: buffer.readInt32LE(offset), length: 4};
    }

    public static writeFloatLE(buffer: Buffer, offset: number, value: number): number {
        buffer.writeFloatLE(value, offset);
        return 4;
    }

    public static readFloatLE(buffer: Buffer, offset: number): ReadResult {
        return {value: buffer.readFloatLE(offset), length: 4};
    }

    public static writeDoubleLE(buffer: Buffer, offset: number, value: number): number {
        buffer.writeDoubleLE(value, offset);
        return 8;
    }

    public static readDoubleLE(buffer: Buffer, offset: number): ReadResult {
        return {value: buffer.readDoubleLE(offset), length: 8};
    }

    public static writeIeeeAddr(buffer: Buffer, offset: number, value: string): number {
        buffer.writeUInt32LE(parseInt(value.slice(10), 16), offset);
        buffer.writeUInt32LE(parseInt(value.slice(2, 10), 16), offset + 4);
        return 8;
    }

    public static readIeeeAddr(buffer: Buffer, offset: number): ReadResult {
        const length = 8;
        const value = buffer.slice(offset, offset + length)
        return {value: Buffalo.addressBufferToString(value), length};
    }

    protected static addressBufferToString(buffer: Buffer): string {
        let address = '0x';
        for (let i = 0; i < buffer.length; i++) {
            const value = buffer.readUInt8(buffer.length - i - 1);
            if (value <= 15) {
                address += '0' + value.toString(16);
            } else {
                address += value.toString(16);
            }
        }

        return address;
    }

    protected static readBuffer(buffer: Buffer, offset: number, length: number): ReadResult {
        return {value: buffer.slice(offset, offset + length), length};
    }

    protected static writeBuffer(buffer: Buffer, offset: number, values: Buffer | number[], length: number): number {
        if (values.length !== length) {
            throw new Error(`Length of values: '${values}' is not consitent with expected length '${length}'`);
        }

        for (let value of values) {
            buffer.writeUInt8(value, offset);
            offset += 1;
        }

        return values.length;
    }

    public static writeListUInt8(buffer: Buffer, offset: number, values: number[]): number {
        for (let value of values) {
            buffer.writeUInt8(value, offset);
            offset += 1
        }

        return values.length;
    }

    public static readListUInt8(buffer: Buffer, offset: number, options: Options): ReadResult {
        const value = [];
        for (let i = 0; i < options.length; i++) {
            value.push(buffer.readUInt8(offset + i));
        }

        return {value, length: options.length};
    }

    public static writeListUInt16(buffer: Buffer, offset: number, values: number[]): number {
        for (let value of values) {
            buffer.writeUInt16LE(value, offset);
            offset += 2
        }

        return values.length * 2;
    }

    public static readListUInt16(buffer: Buffer, offset: number, options: Options): ReadResult {
        const value = [];
        for (let i = 0; i < (options.length * 2); i += 2) {
            value.push(buffer.readUInt16LE(offset + i));
        }

        return {value, length: 2 * options.length};
    }

    public static writeListUInt24(buffer: Buffer, offset: number, values: number[]): number {
        for (let value of values) {
            offset += this.writeUInt24(buffer, offset, value);
        }

        return values.length * 3;
    }

    public static readListUInt24(buffer: Buffer, offset: number, options: Options): ReadResult {
        const value = [];

        for (let i = 0; i < (options.length * 3); i += 3) {
            value.push(this.readUInt24(buffer, offset + i).value);
        }

        return {value, length: 3 * options.length};
    }

    public static writeListUInt32(buffer: Buffer, offset: number, values: number[]): number {
        for (let value of values) {
            offset += this.writeUInt32(buffer, offset, value);
        }

        return values.length * 4;
    }

    public static readListUInt32(buffer: Buffer, offset: number, options: Options): ReadResult {
        const value = [];

        for (let i = 0; i < (options.length * 4); i += 4) {
            value.push(this.readUInt32(buffer, offset + i).value);
        }

        return {value, length: 4 * options.length};
    }

    public static write(type: string, buffer: Buffer, offset: number, value: Value, options: Options): number {
        options; // prevent not used eslint warning

        if (type === 'UINT8') {
            return this.writeUInt8(buffer, offset, value);
        } else if (type === 'UINT16') {
            return this.writeUInt16(buffer, offset, value);
        } else if (type === 'UINT32') {
            return this.writeUInt32(buffer, offset, value);
        }  else if (type === 'IEEEADDR') {
            return this.writeIeeeAddr(buffer, offset, value);
        } else if (type.startsWith('BUFFER') && (Buffer.isBuffer(value) || IsNumberArray(value))) {
            let length = Number(type.replace('BUFFER', ''));
            length = length != 0 ? length : value.length;
            return Buffalo.writeBuffer(buffer, offset, value, length);
        } else if (type === 'INT8') {
            return this.writeInt8(buffer, offset, value);
        } else if (type === 'INT16') {
            return this.writeInt16(buffer, offset, value);
        } else if (type === 'UINT24') {
            return this.writeUInt24(buffer, offset, value);
        } else if (type === 'INT24') {
            return this.writeInt24(buffer, offset, value);
        } else if (type === 'INT32') {
            return this.writeInt32(buffer, offset, value);
        } else if (type === 'FLOATLE') {
            return this.writeFloatLE(buffer, offset, value);
        } else if (type === 'DOUBLELE') {
            return this.writeDoubleLE(buffer, offset, value);
        } else if (type === 'EMPTY') {
            return this.writeEmpty();
        } else if (type === 'LIST_UINT8') {
            return this.writeListUInt8(buffer, offset, value);
        } else if (type === 'LIST_UINT16') {
            return this.writeListUInt16(buffer, offset, value);
        } else if (type === 'LIST_UINT24') {
            return this.writeListUInt24(buffer, offset, value);
        } else if (type === 'LIST_UINT32') {
            return this.writeListUInt32(buffer, offset, value);
        } else {
            throw new Error(`Write for '${type}' not available`)
        }
    }

    public static read(type: string, buffer: Buffer, offset: number, options: Options): ReadResult {
        if (type === 'UINT8') {
            return this.readUInt8(buffer, offset);
        } else if (type === 'UINT16') {
            return this.readUInt16(buffer, offset);
        } else if (type === 'UINT32') {
            return this.readUInt32(buffer, offset);
        }  else if (type === 'IEEEADDR') {
            return this.readIeeeAddr(buffer, offset);
        } else if (type.startsWith('BUFFER')) {
            let length = Number(type.replace('BUFFER', ''));
            length = length != 0 ? length : options.length;
            return this.readBuffer(buffer, offset, length);
        } else if (type === 'INT8') {
            return this.readInt8(buffer, offset);
        } else if (type === 'INT16') {
            return this.readInt16(buffer, offset);
        } else if (type === 'UINT24') {
            return this.readUInt24(buffer, offset);
        } else if (type === 'INT24') {
            return this.readInt24(buffer, offset);
        } else if (type === 'INT32') {
            return this.readInt32(buffer, offset);
        } else if (type === 'FLOATLE') {
            return this.readFloatLE(buffer, offset);
        } else if (type === 'DOUBLELE') {
            return this.readDoubleLE(buffer, offset);
        } else if (type === 'EMPTY') {
            return this.readEmpty();
        } else if (type === 'LIST_UINT8') {
            return this.readListUInt8(buffer, offset, options);
        } else if (type === 'LIST_UINT16') {
            return this.readListUInt16(buffer, offset, options);
        } else if (type === 'LIST_UINT24') {
            return this.readListUInt24(buffer, offset, options);
        } else if (type === 'LIST_UINT32') {
            return this.readListUInt32(buffer, offset, options);
        } else {
            throw new Error(`Read for '${type}' not available`)
        }
    }
}



export default Buffalo;
