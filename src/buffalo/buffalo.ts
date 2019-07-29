import {Options, ReadResult, Value} from './tstype';
import {IsNumberArray} from '../utils';

class Buffalo {
    private static writeUInt8(buffer: Buffer, offset: number, value: number): number {
        buffer.writeUInt8(value, offset);
        return 1;
    }

    private static readUInt8(buffer: Buffer, offset: number): ReadResult {
        return {value: buffer.readUInt8(offset), length: 1};
    }

    private static writeUInt16(buffer: Buffer, offset: number, value: number): number {
        buffer.writeUInt16LE(value, offset);
        return 2;
    }

    private static readUInt16(buffer: Buffer, offset: number): ReadResult {
        return {value: buffer.readUInt16LE(offset), length: 2};
    }

    private static writeUInt32(buffer: Buffer, offset: number, value: number): number {
        buffer.writeUInt32LE(value, offset);
        return 4;
    }

    private static readUInt32(buffer: Buffer, offset: number): ReadResult {
        return {value: buffer.readUInt32LE(offset), length: 4};
    }

    private static writeIeeeAddr(buffer: Buffer, offset: number, value: string): number {
        buffer.writeUInt32LE(parseInt(value.slice(10), 16), offset);
        buffer.writeUInt32LE(parseInt(value.slice(2, 10), 16), offset + 4);
        return 8;
    }

    private static readIeeeAddr(buffer: Buffer, offset: number): ReadResult {
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

    public static write(type: string, buffer: Buffer, offset: number, value: Value): number {
        if (type === 'UINT8' && typeof value === 'number') {
            return this.writeUInt8(buffer, offset, value);
        } else if (type === 'UINT16' && typeof value === 'number') {
            return this.writeUInt16(buffer, offset, value);
        } else if (type === 'UINT32' && typeof value === 'number') {
            return this.writeUInt32(buffer, offset, value);
        }  else if (type === 'IEEEADDR' && typeof value === 'string') {
            return this.writeIeeeAddr(buffer, offset, value);
        } else if (type.startsWith('BUFFER') && (Buffer.isBuffer(value) || IsNumberArray(value))) {
            let length = Number(type.replace('BUFFER', ''));
            length = length != 0 ? length : value.length;
            return Buffalo.writeBuffer(buffer, offset, value, length);
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
        } else {
            throw new Error(`Read for '${type}' not available`)
        }
    }
}

export default Buffalo;
