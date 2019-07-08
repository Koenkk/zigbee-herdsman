import {ParameterType} from './constants';

interface ReadResult {
    value: any;
    length: number;
};

interface Parser {
    write(buffer: Buffer, offset: number, value: any): number;
    read(buffer: Buffer, offset: number, options: any): ReadResult;
};

function checkOptionProperty(parser: string, property: string, options: any): void {
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

const parsers: {
    [s: number]: Parser;
} = {
    [ParameterType.UINT8]: {
        write: (buffer, offset, value): number => {
            buffer.writeInt8(value, offset);
            return 1;
        },
        read: (buffer, offset): ReadResult => {
            return {value: buffer.readUInt8(offset), length: 1};
        },
    },
    [ParameterType.UINT16]: {
        write: (buffer, offset, value): number => {
            buffer.writeUInt16LE(value, offset);
            return 2;
        },
        read: (buffer, offset): ReadResult => {
            return {value: buffer.readUInt16LE(offset), length: 2};
        },
    },
    [ParameterType.UINT32]: {
        write: (buffer, offset, value): number => {
            buffer.writeUInt32LE(value, offset);
            return 4;
        },
        read: (buffer, offset): ReadResult => {
            return {value: buffer.readUInt32LE(offset), length: 4};
        },
    },
    [ParameterType.BUFFER]: {
        write: (buffer, offset, value): number => {
            throw new Error('Not implemented!');
        },
        read: (buffer, offset, options): ReadResult => {
            checkOptionProperty('BUFFER read', 'length', options);
            return {value: buffer.slice(offset, offset + options.length), length: options.length};
        },
    },
    [ParameterType.IEEEADDR]: {
        write: (buffer, offset, value): number => {
            throw new Error('Not implemented!');
        },
        read: (buffer, offset): ReadResult => {
            const length = 8;
            const value = buffer.slice(offset, offset + length)
            return {value: addressBufferToString(value), length};
        },
    },
    [ParameterType.UINT16_LIST]: {
        write: (buffer, offset, value): number => {
            throw new Error('Not implemented!');
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

export default parsers;
