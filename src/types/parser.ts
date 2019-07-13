import Type from './type';
import {Parser, ReadResult} from './types';

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

function readBuffer(buffer: Buffer, offset: number, length: number): ReadResult {
    return {value: buffer.slice(offset, offset + length), length};
}

function writeBuffer(buffer: Buffer, offset: number, values: number[], length: number): number {
    if (values.length !== length) {
        throw new Error(`Length of values: '${values}' is not consitent with expected length '${length}'`);
    }

    for (let value of values) {
        buffer.writeUInt8(value, offset);
        offset += 1;
    }

    return values.length;
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
    [Type.BUFFER]: {
        write: (buffer, offset, values: number[]): number => writeBuffer(buffer, offset, values, values.length),
        read: (buffer, offset, options): ReadResult => readBuffer(buffer, offset, options.length),
    },
    [Type.BUFFER8]: {
        write: (buffer, offset, values: number[]): number => writeBuffer(buffer, offset, values, 8),
        read: (buffer, offset): ReadResult => readBuffer(buffer, offset, 8),
    },
    [Type.BUFFER16]: {
        write: (buffer, offset, values: number[]): number => writeBuffer(buffer, offset, values, 16),
        read: (buffer, offset): ReadResult => readBuffer(buffer, offset, 16),
    },
    [Type.BUFFER18]: {
        write: (buffer, offset, values: number[]): number => writeBuffer(buffer, offset, values, 18),
        read: (buffer, offset): ReadResult => readBuffer(buffer, offset, 18),
    },
    [Type.BUFFER32]: {
        write: (buffer, offset, values: number[]): number => writeBuffer(buffer, offset, values, 32),
        read: (buffer, offset): ReadResult => readBuffer(buffer, offset, 32),
    },
    [Type.BUFFER42]: {
        write: (buffer, offset, values: number[]): number => writeBuffer(buffer, offset, values, 42),
        read: (buffer, offset): ReadResult => readBuffer(buffer, offset, 42),
    },
    [Type.BUFFER100]: {
        write: (buffer, offset, values: number[]): number => writeBuffer(buffer, offset, values, 100),
        read: (buffer, offset): ReadResult => readBuffer(buffer, offset, 100),
    },
    [Type.BUFFER100]: {
        write: (buffer, offset, values: number[]): number => writeBuffer(buffer, offset, values, 100),
        read: (buffer, offset): ReadResult => readBuffer(buffer, offset, 100),
    },
    [Type.LIST_UINT16]: {
        write: (buffer, offset, values: number[]): number => {
            for (let value of values) {
                buffer.writeUInt16LE(value, offset);
                offset += 2
            }

            return values.length * 2;
        },
        read: (buffer, offset, options): ReadResult => {
            const value = [];
            for (let i = 0; i < (options.length * 2); i += 2) {
                value.push(buffer.readUInt16LE(offset + i));
            }

            return {value, length: 2 * options.length};
        },
    },
    [Type.LIST_ROUTING_TABLE]: {
        write: (): number => {throw new Error("Not implemented")},
        read: (buffer, offset, options): ReadResult => {
            const statusLookup: {[n: number]: string} = {
                0: 'ACTIVE',
                1: 'DISCOVERY_UNDERWAY',
                2: 'DISCOVERY_FAILED',
                3: 'INACTIVE',
            };

            const itemLength = 5;
            const value = [];
            for (let i = 0; i < (options.length * itemLength); i += itemLength) {
                value.push({
                    'destNwkAddr': buffer.readUInt16LE(offset + i),
                    'routeStatus': statusLookup[buffer.readUInt8(offset + i + 2)],
                    'nextHopNwkAddr': buffer.readUInt16LE(offset + i + 3),
                });
            }

            return {value, length: value.length * itemLength};
        },
    },
    [Type.LIST_BIND_TABLE]: {
        write: (): number => {throw new Error("Not implemented")},
        read: (buffer, offset, options): ReadResult => {
            const value = [];
            let length = 0

            for (let i = 0; i < options.length; i += 1) {
                const item: {[s: string]: number|string} = {};

                item['srcAddr'] = addressBufferToString(buffer.slice(offset, offset + 8));
                offset += 8, length += 8;

                item['srcEp'] = buffer.readUInt8(offset); offset += 1; length += 1;
                item['clusterId'] = buffer.readUInt16LE(offset); offset += 2; length += 2;
                item['dstAddrMode'] = buffer.readUInt8(offset); offset += 1; length += 1;

                item['dstAddr'] = addressBufferToString(buffer.slice(offset, offset + 8));
                offset += 8, length += 8;

                if (item.dstAddrMode === 3) {
                    item['dstEp'] = buffer.readUInt8(offset); offset += 1; length += 1;
                }

                value.push(item);
            }

            return {value, length};
        },
    },
    [Type.LIST_NEIGHBOR_LQI]: {
        write: (): number => {throw new Error("Not implemented")},
        read: (buffer, offset, options): ReadResult => {
            const itemLength = 22;
            const value = [];
            for (let i = 0; i < (options.length * itemLength); i += itemLength) {
                const item: {[s: string]: number|string} = {};

                item['extPandId'] = addressBufferToString(buffer.slice(offset, offset + 8));
                offset += 8;

                item['extAddr'] = addressBufferToString(buffer.slice(offset, offset + 8));
                offset += 8;

                item['nwkAddr'] = buffer.readUInt16LE(offset); offset += 1;

                item['deviceType'] = buffer.readUInt8(offset) & 0x03;
                item['rxOnWhenIdle'] = (buffer.readUInt8(offset) & 0x0C) >> 2;
                item['relationship'] = (buffer.readUInt8(offset) & 0x70) >> 4;
                offset += 1;

                item['permitJoin'] = buffer.readUInt8(offset) & 0x03; offset += 1;
                item['depth'] = buffer.readUInt8(offset); offset += 1;
                item['lqi'] = buffer.readUInt8(offset); offset += 1;

                value.push(item);
            }

            return {value, length: value.length * itemLength};
        },
    },
    [Type.LIST_NETWORK]: {
        write: (): number => {throw new Error("Not implemented")},
        read: (buffer, offset, options): ReadResult => {
            const itemLength = 6;
            const value = [];
            for (let i = 0; i < (options.length * itemLength); i += itemLength) {
                const item: {[s: string]: number|string} = {};

                item['neightborPanId'] = buffer.readUInt16LE(offset); offset += 2;
                item['logicalChannel'] = buffer.readUInt8(offset); offset += 1;

                item['stackProfile'] = buffer.readUInt8(offset) & 0x0F;
                item['zigbeeVersion'] = (buffer.readUInt8(offset) & 0xF0) >> 4;
                offset += 1;

                item['beaconOrder'] = buffer.readUInt8(offset) & 0x0F;
                item['superFrameOrder'] = (buffer.readUInt8(offset) & 0xF0) >> 4;
                offset += 1;

                item['permitJoin'] = buffer.readUInt8(offset); offset += 1;

                value.push(item);
            }

            return {value, length: value.length * itemLength};
        },
    },
    [Type.LIST_ASSOC_DEV]: {
        write: (): number => {throw new Error("Not implemented")},
        read: (buffer, offset, options): ReadResult => {
            const value = [];
            const listLength = options.length - options.startIndex;
            let length = 0;

            for (let i = 0; i < (listLength * 2); i += 2) {
                // There are max 70 bytes in the list (= 35 uint16)
                if (i === 70) {
                    break;
                }

                value.push(buffer.readUInt16LE(offset + i));
                length += 2;
            }

            return {value, length};
        },
    },
}

export default Parsers;
