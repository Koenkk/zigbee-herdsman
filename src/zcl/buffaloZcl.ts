
import {Buffalo, TsType} from '../buffalo';
import {DataType} from './definition';
import {BuffaloZclOptions} from './tstype';

const aliases: {[s: string]: string} = {
    'boolean': 'uint8',
    'bitmap8': 'uint8',
    'enum8': 'uint8',
    'data8': 'int8',
    'data16': 'uint16',
    'bitmap16': 'uint16',
    'uint16': 'uint16',
    'enum16': 'uint16',
    'clusterId': 'uint16',
    'attrId': 'uint16',
    'data24': 'uint24',
    'bitmap24': 'uint24',
    'data32': 'uint32',
    'bitmap32': 'uint32',
    'uint32': 'uint32',
    'tod': 'uint32',
    'date': 'uint32',
    'utc': 'uint32',
    'bacOid': 'uint32',
    'singlePrec': 'floatle',
    'doublePrec': 'doublele',
    'bitmap40': 'uint40',
    'data40': 'uint40',
    'bitmap48': 'uint48',
    'data48': 'uint48',
    'bitmap56': 'uint56',
    'data56': 'uint56',
    'bitmap64': 'uint64',
    'data64': 'uint64',
    'ieeeAddr': 'uint64',
    'longOctetStr': 'longCharStr',
    'secKey': 'buffer16',
    'noData': 'EMPTY',
    'unknown': 'EMPTY',
    'bag': 'array',
    'set': 'array',
};

class BuffaloZcl extends Buffalo {
    private static readUseDataType(buffer: Buffer, offset: number, options: BuffaloZclOptions): TsType.ReadResult {
        return this.read(options.dataType, buffer, offset, options);
    }

    private static writeUseDataType(buffer: Buffer, offset: number, value: string, options: BuffaloZclOptions): number {
        return this.write(options.dataType, buffer, offset, value, options);
    }

    private static readArray(buffer: Buffer, offset: number): TsType.ReadResult {
        const values: TsType.Value = [];
        let position = 0;

        const elementType = DataType[buffer.readUInt8(offset + position)];
        position++;

        const numberOfElements = buffer.readUInt16LE(offset + position);
        position += 2;

        for (let i = 0; i < numberOfElements; i++) {
            const result = this.read(elementType, buffer, offset + position, {});
            position += result.length;
            values.push(result.value);
        }

        return {value: values, length: position};
    }

    private static readStruct(buffer: Buffer, offset: number): TsType.ReadResult {
        const values: TsType.Value = [];
        let position = 0;

        const numberOfElements = buffer.readUInt16LE(offset + position);
        position += 2;

        for (let i = 0; i < numberOfElements; i++) {
            const elementType = buffer.readUInt8(offset + position);
            position++;

            const result = this.read(DataType[elementType], buffer, offset + position, {});
            position += result.length;

            values.push({elmType: elementType, elmVal: result.value})
        }

        return {value: values, length: position};
    }

    private static readOctetStr(buffer: Buffer, offset: number): TsType.ReadResult {
        const length = buffer.readUInt8(offset);
        const value = buffer.slice(offset + 1, offset + length + 1);
        return {value, length: length + 1};
    }

    private static readCharStr(buffer: Buffer, offset: number, options: BuffaloZclOptions): TsType.ReadResult {
        const length = buffer.readUInt8(offset);

        if (options.attrId === 65281) {
            const value: {[i: number]: number|number[]} = {};

            // Xiaomi struct parsing
            let position = 1;
            for (let i = 0; i < length; i++) {
                const index = buffer.readUInt8(offset + position);
                position++;
                const dataType = DataType[buffer.readUInt8(offset + position)];
                position++;

                const result = this.read(dataType, buffer, offset + position, {});
                value[index] = result.value;
                position += result.length;

                if (position + offset === buffer.length) {
                    break;
                }
            }

            return {value, length: position};
        } else {
            const value = buffer.toString('utf8', offset + 1, offset + 1 + length);
            return {value, length: length + 1};
        }
    }

    private static writeCharStr(buffer: Buffer, offset: number, value: string): number {
        buffer.writeUInt8(value.length, offset);
        const bytes = buffer.write(value, offset + 1, 'utf8');
        return bytes + 1;
    }

    private static readLongCharStr(buffer: Buffer, offset: number): TsType.ReadResult {
        const length = buffer.readUInt16LE(offset);
        const value = buffer.toString('utf8', offset + 2, offset + 2 + length);
        return {value, length: length + 2};
    }

    private static writeLongCharStr(buffer: Buffer, offset: number, value: string): number {
        buffer.writeUInt16LE(value.length, offset);
        const bytes = buffer.write(value, offset + 2, 'utf8');
        return bytes + 2;
    }

    private static readExtensionFielSets(buffer: Buffer, offset: number): TsType.ReadResult {
        const value = [];

        let position = 0;
        for (position; position < buffer.length; position) {
            const clstId = buffer.readUInt16LE(offset + position);
            const len = buffer.readUInt8(offset + 2);
            position += 3;

            const extField = [];
            for (let i = 0; i < len; i++) {
                extField.push(buffer.readUInt8(offset + position));
                position++;
            }

            value.push({extField, clstId, len});
        }

        return {value, length: position};
    }

    private static writeExtensionFieldSets(buffer: Buffer, offset: number, values: {clstId: number; len: number; extField: number[]}[]): number {
        let position = 0;
        for (let value of values) {
            buffer.writeUInt16LE(value.clstId, offset + position);
            position += 2;

            buffer.writeUInt8(value.len, offset + position);
            position++;

            for (let entry of value.extField) {
                buffer.writeUInt8(entry, offset + position);
                position++;
            }
        }

        return position;
    }

    private static writeListZoneInfo(buffer: Buffer, offset: number, values: {zoneID: number; zoneStatus: number}[]): number {
        let position = 0;
        for (let value of values) {
            buffer.writeUInt8(value.zoneID, offset + position);
            buffer.writeUInt16LE(value.zoneStatus, offset + position + 1);
            position += 3;
        }

        return position;
    }

    private static readListZoneInfo(buffer: Buffer, offset: number, options: TsType.Options): TsType.ReadResult {
        const value = [];
        let position = 0;
        for (let i = 0; i < options.length; i++) {
            value.push({
                zoneID: buffer.readUInt8(offset + position),
                zoneStatus: buffer.readUInt16LE(offset + position + 1),
            });

            position += 3;
        }

        return {value, length: position};
    }

    private static readUInt40(buffer: Buffer, offset: number): TsType.ReadResult {
        const lsb = buffer.readUInt32LE(offset);
        const msb = buffer.readUInt8(offset + 4);
        return {value: [msb, lsb], length: 5};
    }

    private static writeUInt40(buffer: Buffer, offset: number, value: number[]): number {
        buffer.writeUInt32LE(value[1], offset);
        buffer.writeUInt8(value[0], offset + 4);
        return 5;
    }

    private static readUInt48(buffer: Buffer, offset: number): TsType.ReadResult {
        const lsb = buffer.readUInt32LE(offset);
        const msb = buffer.readUInt16LE(offset + 4);
        return {value: [msb, lsb], length: 6};
    }

    private static writeUInt48(buffer: Buffer, offset: number, value: number[]): number {
        buffer.writeUInt32LE(value[1], offset);
        buffer.writeUInt16LE(value[0], offset + 4);
        return 6;
    }

    private static readUInt56(buffer: Buffer, offset: number): TsType.ReadResult {
        const lsb = buffer.readUInt32LE(offset);
        const xsb = buffer.readUInt16LE(offset + 4);
        const msb = buffer.readUInt8(offset + 6);
        return {value: [msb, xsb, lsb], length: 7};
    }

    private static writeUInt56(buffer: Buffer, offset: number, value: number[]): number {
        let temp = Buffer.alloc(8);
        temp.writeUInt32LE(value[1], 0);
        temp.writeUInt32LE(value[0], 4);
        return this.writeBuffer(buffer, offset, temp.slice(0, 7), 7);
    }

    private static readUInt64(buffer: Buffer, offset: number): TsType.ReadResult {
        return {value: this.addressBufferToString(buffer.slice(offset, offset + 8)), length: 8};
    }

    private static writeUInt64(buffer: Buffer, offset: number, value: string): number {
        const msb = parseInt(value.slice(2,10), 16);
        const lsb = parseInt(value.slice(10), 16);
        buffer.writeUInt32LE(lsb, offset);
        buffer.writeUInt32LE(msb, offset + 4);
        return 8;
    }

    public static write(type: string, buffer: Buffer, offset: number, value: TsType.Value, options: BuffaloZclOptions): number {
        // TODO: write for the following is missing: octetStr, struct, array (+ bag/set)
        if (type === 'uint40') {
            return this.writeUInt40(buffer, offset, value);
        } else if (type === 'EXTENSION_FIELD_SETS') {
            return this.writeExtensionFieldSets(buffer, offset, value);
        } else if (type === 'LIST_ZONEINFO') {
            return this.writeListZoneInfo(buffer, offset, value);
        } else if (type === 'uint48') {
            return this.writeUInt48(buffer, offset, value);
        } else if (type === 'uint56') {
            return this.writeUInt56(buffer, offset, value);
        } else if (type === 'uint64') {
            return this.writeUInt64(buffer, offset, value);
        } else if (type === 'charStr') {
            return this.writeCharStr(buffer, offset, value);
        } else if (type === 'longCharStr') {
            return this.writeLongCharStr(buffer, offset, value);
        } else if (type === 'USE_DATA_TYPE') {
            return this.writeUseDataType(buffer, offset, value, options);
        } else {
            // TODO: remove uppercase once dataTypes are snake case
            return super.write(type.toUpperCase(), buffer, offset, value, options);
        }
    }

    public static read(type: string, buffer: Buffer, offset: number, options: BuffaloZclOptions): TsType.ReadResult {
        const aliasType = aliases[type] || type;

        if (aliasType === 'USE_DATA_TYPE') {
            return this.readUseDataType(buffer, offset, options);
        } else if (type === 'EXTENSION_FIELD_SETS') {
            return this.readExtensionFielSets(buffer, offset);
        } else if (type === 'LIST_ZONEINFO') {
            return this.readListZoneInfo(buffer, offset, options);
        } else if (type === 'uint40') {
            return this.readUInt40(buffer, offset);
        } else if (type === 'uint48') {
            return this.readUInt48(buffer, offset);
        } else if (type === 'uint56') {
            return this.readUInt56(buffer, offset);
        } else if (type === 'uint64') {
            return this.readUInt64(buffer, offset);
        } else if (type === 'octetStr') {
            return this.readOctetStr(buffer, offset);
        } else if (type === 'charStr') {
            return this.readCharStr(buffer, offset, options);
        } else if (type === 'longCharStr') {
            return this.readLongCharStr(buffer, offset);
        } else if (type === 'array') {
            return this.readArray(buffer, offset);
        } else if (type === 'struct') {
            return this.readStruct(buffer, offset);
        } else {
            // TODO: remove uppercase once dataTypes are snake case
            return super.read(aliasType.toUpperCase(), buffer, offset, options);
        }
    }
}

export default BuffaloZcl;
