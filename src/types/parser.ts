import Type from './type';
import {ParserOptions, Parser, ReadResult} from './types';

function checkOptionProperty(parser: string, property: 'length', options: ParserOptions): void {
    if (options === undefined || options[property] === undefined) {
        throw new Error(`${parser} parser read requires '${property}' as argument`);
    }
}

function addressBufferToString(buffer: Buffer): string {
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

const Parsers: {
    [s: number]: Parser;
} = {
    [Type.UINT8]: {
        write: (buffer, offset, value: number): number => {
            buffer.writeUInt8(value, offset);
            return 1;
        },
        read: (buffer, offset): ReadResult => {
            return {value: buffer.readUInt8(offset), length: 1};
        },
    },
    [Type.UINT16]: {
        write: (buffer, offset, value: number): number => {
            buffer.writeUInt16LE(value, offset);
            return 2;
        },
        read: (buffer, offset): ReadResult => {
            return {value: buffer.readUInt16LE(offset), length: 2};
        },
    },
    [Type.UINT32]: {
        write: (buffer, offset, value: number): number => {
            buffer.writeUInt32LE(value, offset);
            return 4;
        },
        read: (buffer, offset): ReadResult => {
            return {value: buffer.readUInt32LE(offset), length: 4};
        },
    },
    [Type.BUFFER]: {
        write: (buffer, offset, values: number[]): number => {
            for (let value of values) {
                buffer.writeUInt8(value, offset);
                offset += 1;
            }

            return values.length;
        },
        read: (buffer, offset, options): ReadResult => {
            checkOptionProperty('BUFFER read', 'length', options);
            return {value: buffer.slice(offset, offset + options.length), length: options.length};
        },
    },
    [Type.IEEEADDR]: {
        write: (buffer, offset, value: string): number => {
            buffer.writeUInt32LE(parseInt(value.slice(2, 10), 16), offset);
            buffer.writeUInt32LE(parseInt(value.slice(10), 16), offset + 4);
            return 8;
        },
        read: (buffer, offset): ReadResult => {
            const length = 8;
            const value = buffer.slice(offset, offset + length)
            return {value: addressBufferToString(value), length};
        },
    },
    [Type.UINT16_LIST]: {
        write: (buffer, offset, values: number[]): number => {
            for (let value of values) {
                buffer.writeUInt16LE(value, offset);
                offset += 2
            }

            return values.length * 2;
        },
        read: (buffer, offset, options): ReadResult => {
            checkOptionProperty('UINT16_LIST read', 'length', options);

            const value = [];
            for (let i = 0; i < (options.length * 2); i += 2) {
                value.push(buffer.readUInt16LE(offset + i));
            }

            return {value, length: 2 * options.length};
        },
    },
}

export default Parsers;
