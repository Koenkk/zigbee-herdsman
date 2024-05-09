
import {Buffalo} from '../../../buffalo';
import ParameterType from './parameterType';
import {BuffaloZnpOptions} from './tstype';


type RoutingTableEntryStatus = 'ACTIVE' | 'DISCOVERY_UNDERWAY' | 'DISCOVERY_FAILED' | 'INACTIVE';

const routingTableStatusLookup: Record<number, RoutingTableEntryStatus> = {
    0: 'ACTIVE',
    1: 'DISCOVERY_UNDERWAY',
    2: 'DISCOVERY_FAILED',
    3: 'INACTIVE',
};

interface RoutingEntry {
    destNwkAddr: number;
    routeStatus: RoutingTableEntryStatus | undefined;
    nextHopNwkAddr: number;
}

interface Bind {
    srcAddr: string;
    srcEp: number;
    clusterId: number;
    dstAddrMode: number;
    dstAddr: string;
    dstEp?: number;
}

interface Neighbor {
    extPandId: string;
    extAddr: string;
    nwkAddr: number
    deviceType: number;
    rxOnWhenIdle: number;
    relationship: number;
    permitJoin: number;
    depth: number;
    lqi: number;
}

interface Network {
    neightborPanId: number;
    logicalChannel: number;
    stackProfile: number;
    zigbeeVersion: number;
    beaconOrder: number;
    superFrameOrder: number;
    permitJoin: number;
}


class BuffaloZnp extends Buffalo {
    private readListRoutingTable(length: number): RoutingEntry[] {
        const value: RoutingEntry[] = [];

        for (let i = 0; i < length; i++) {
            value.push({
                destNwkAddr: this.readUInt16(),
                routeStatus: routingTableStatusLookup[this.readUInt8()],
                nextHopNwkAddr: this.readUInt16(),
            });
        }

        return value;
    }

    private readListBindTable(length: number): Bind[]{
        const value: Bind[] = [];

        for (let i = 0; i < length; i++) {
            const item: Bind = {
                srcAddr: this.readIeeeAddr(),
                srcEp: this.readUInt8(),
                clusterId: this.readUInt16(),
                dstAddrMode: this.readUInt8(),
                dstAddr: this.readIeeeAddr(),
            };
            if (item.dstAddrMode === 3) {
                item.dstEp = this.readUInt8();
            }
            value.push(item);
        }
        return value;
    }

    private readListNeighborLqi(length: number): Neighbor[] {
        const value: Neighbor[] = [];
        for (let i = 0; i < length; i++) {
            const prefix = {
                extPandId: this.readIeeeAddr(),
                extAddr: this.readIeeeAddr(),
                nwkAddr: this.readUInt16()
            };
            const bitfields = this.readUInt8();
            value.push({
                ...prefix,
                deviceType: bitfields & 0x03,
                rxOnWhenIdle: (bitfields & 0x0C) >> 2,
                relationship: (bitfields & 0x70) >> 4,
                permitJoin: this.readUInt8() & 0x03,
                depth: this.readUInt8(),
                lqi: this.readUInt8()
            });
        }

        return value;
    }

    private  readListNetwork(length: number): Network[] {
        const value: Network[] = [];
        for (let i = 0; i < length; i++) {
            const neightborPanId = this.readUInt16();
            const logicalChannel = this.readUInt8();
            const value1 = this.readUInt8();
            const value2 = this.readUInt8();
            const permitJoin = this.readUInt8();

            value.push({
                neightborPanId,
                logicalChannel,
                stackProfile: value1 & 0x0F,
                zigbeeVersion: (value1 & 0xF0) >> 4,
                beaconOrder: value2 & 0x0F,
                superFrameOrder: (value2 & 0xF0) >> 4,
                permitJoin
            });
        }

        return value;
    }

    private readListAssocDev(options: BuffaloZnpOptions): number[] {
        if (options.length == null) {
            throw new Error('Cannot read LIST_ASSOC_DEV without length option specified');
        }
        if (options.startIndex == null) {
            throw new Error('Cannot read LIST_ASSOC_DEV without startIndex option specified');
        }

        const value: number[] = [];
        const listLength = options.length - options.startIndex;

        for (let i = 0; i < listLength; i++) {
            // There are max 70 bytes in the list (= 35 uint16)
            if (i === 35) {
                break;
            }

            value.push(this.readUInt16());
        }

        return value;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public write(type: ParameterType, value: any, options: BuffaloZnpOptions): void {
        switch (type) {
        case ParameterType.UINT8: {
            return this.writeUInt8(value);
        }
        case ParameterType.UINT16: {
            return this.writeUInt16(value);
        }
        case ParameterType.UINT32: {
            return this.writeUInt32(value);
        }
        case ParameterType.IEEEADDR: {
            return this.writeIeeeAddr(value);
        }
        case ParameterType.BUFFER: {
            return this.writeBuffer(value, options.length ?? value.length);
        }
        case ParameterType.BUFFER8: {
            return this.writeBuffer(value, 8);
        }
        case ParameterType.BUFFER16: {
            return this.writeBuffer(value, 16);
        }
        case ParameterType.BUFFER18: {
            return this.writeBuffer(value, 18);
        }
        case ParameterType.BUFFER32: {
            return this.writeBuffer(value, 32);
        }
        case ParameterType.BUFFER42: {
            return this.writeBuffer(value, 42);
        }
        case ParameterType.BUFFER100: {
            return this.writeBuffer(value, 100);
        }
        case ParameterType.LIST_UINT8: {
            return this.writeListUInt8(value);
        }
        case ParameterType.LIST_UINT16: {
            return this.writeListUInt16(value);
        }
        // NOTE: not writable
        // case ParameterType.LIST_ROUTING_TABLE:
        // case ParameterType.LIST_BIND_TABLE:
        // case ParameterType.LIST_NEIGHBOR_LQI:
        // case ParameterType.LIST_NETWORK:
        // case ParameterType.LIST_ASSOC_DEV:
        case ParameterType.INT8: {
            return this.writeInt8(value);
        }
        }

        throw new Error(`Write for '${type}' not available`);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public read(type: ParameterType, options: BuffaloZnpOptions): any {
        switch (type) {
        case ParameterType.UINT8: {
            return this.readUInt8();
        }
        case ParameterType.UINT16: {
            return this.readUInt16();
        }
        case ParameterType.UINT32: {
            return this.readUInt32();
        }
        case ParameterType.IEEEADDR: {
            return this.readIeeeAddr();
        }
        case ParameterType.BUFFER: {
            if (options.length == null) {
                throw new Error('Cannot read BUFFER without length option specified');
            }

            return this.readBuffer(options.length);
        }
        case ParameterType.BUFFER8: {
            return this.readBuffer(8);
        }
        case ParameterType.BUFFER16: {
            return this.readBuffer(16);
        }
        case ParameterType.BUFFER18: {
            return this.readBuffer(18);
        }
        case ParameterType.BUFFER32: {
            return this.readBuffer(32);
        }
        case ParameterType.BUFFER42: {
            return this.readBuffer(42);
        }
        case ParameterType.BUFFER100: {
            return this.readBuffer(100);
        }
        case ParameterType.LIST_UINT8: {
            if (options.length == null) {
                throw new Error('Cannot read LIST_UINT8 without length option specified');
            }

            return this.readListUInt8(options.length);
        }
        case ParameterType.LIST_UINT16: {
            if (options.length == null) {
                throw new Error('Cannot read LIST_UINT16 without length option specified');
            }

            return this.readListUInt16(options.length);
        }
        case ParameterType.LIST_ROUTING_TABLE: {
            if (options.length == null) {
                throw new Error('Cannot read LIST_ROUTING_TABLE without length option specified');
            }

            return this.readListRoutingTable(options.length);
        }
        case ParameterType.LIST_BIND_TABLE: {
            if (options.length == null) {
                throw new Error('Cannot read LIST_BIND_TABLE without length option specified');
            }

            return this.readListBindTable(options.length);
        }
        case ParameterType.LIST_NEIGHBOR_LQI: {
            if (options.length == null) {
                throw new Error('Cannot read LIST_NEIGHBOR_LQI without length option specified');
            }

            return this.readListNeighborLqi(options.length);
        }
        case ParameterType.LIST_NETWORK: {
            if (options.length == null) {
                throw new Error('Cannot read LIST_NETWORK without length option specified');
            }

            return this.readListNetwork(options.length);
        }
        case ParameterType.LIST_ASSOC_DEV: {
            return this.readListAssocDev(options);
        }
        case ParameterType.INT8: {
            return this.readInt8();
        }
        }

        // unreachable detected in TS, but not in JS when typing ignored for "type", so kept for good measure
        throw new Error(`Read for '${type}' not available`);
    }
}

export default BuffaloZnp;
