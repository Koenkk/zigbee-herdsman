
import {Buffalo} from '../buffalo';

class BuffaloZnp extends Buffalo {
    private static write_LIST_UINT16(buffer: Buffer, offset: number, values: number[]) {
        for (let value of values) {
            buffer.writeUInt16LE(value, offset);
            offset += 2
        }

        return values.length * 2;
    }

    private static read_LIST_UINT16(buffer: Buffer, offset: number, options: {length: number}) {
        const value = [];
        for (let i = 0; i < (options.length * 2); i += 2) {
            value.push(buffer.readUInt16LE(offset + i));
        }

        return {value, length: 2 * options.length};
    }

    private static write_LIST_ROUTING_TABLE(buffer: Buffer, offset: number, values: number[]) {
        throw new Error("Not implemented")
    }

    private static read_LIST_ROUTING_TABLE(buffer: Buffer, offset: number, options: {length: number}) {
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
    }

    private static write_LIST_BIND_TABLE(buffer: Buffer, offset: number, values: number[]) {
        throw new Error("Not implemented")
    }

    private static read_LIST_BIND_TABLE(buffer: Buffer, offset: number, options: {length: number}) {
        const value = [];
        let length = 0

        for (let i = 0; i < options.length; i += 1) {
            const item: {[s: string]: number|string} = {};

            item['srcAddr'] = Buffalo.addressBufferToString(buffer.slice(offset, offset + 8));
            offset += 8, length += 8;

            item['srcEp'] = buffer.readUInt8(offset); offset += 1; length += 1;
            item['clusterId'] = buffer.readUInt16LE(offset); offset += 2; length += 2;
            item['dstAddrMode'] = buffer.readUInt8(offset); offset += 1; length += 1;

            item['dstAddr'] = Buffalo.addressBufferToString(buffer.slice(offset, offset + 8));
            offset += 8, length += 8;

            if (item.dstAddrMode === 3) {
                item['dstEp'] = buffer.readUInt8(offset); offset += 1; length += 1;
            }

            value.push(item);
        }

        return {value, length};
    }

    private static write_LIST_NEIGHBOR_LQI(buffer: Buffer, offset: number, values: number[]) {
        throw new Error("Not implemented")
    }

    private static read_LIST_NEIGHBOR_LQI(buffer: Buffer, offset: number, options: {length: number}) {
        const itemLength = 22;
        const value = [];
        for (let i = 0; i < (options.length * itemLength); i += itemLength) {
            const item: {[s: string]: number|string} = {};

            item['extPandId'] = Buffalo.addressBufferToString(buffer.slice(offset, offset + 8));
            offset += 8;

            item['extAddr'] = Buffalo.addressBufferToString(buffer.slice(offset, offset + 8));
            offset += 8;

            item['nwkAddr'] = buffer.readUInt16LE(offset); offset += 2;

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
    }

    private static write_LIST_NETWORK(buffer: Buffer, offset: number, values: number[]) {
        throw new Error("Not implemented")
    }

    private static read_LIST_NETWORK(buffer: Buffer, offset: number, options: {length: number}) {
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
    }

    private static write_LIST_ASSOC_DEV(buffer: Buffer, offset: number, values: number[]) {
        throw new Error("Not implemented")
    }

    private static read_LIST_ASSOC_DEV(buffer: Buffer, offset: number, options: {startIndex: number, length: number}) {
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
    }
}

export default BuffaloZnp;
