
import {Buffalo, TsType} from '../../../buffalo';
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
    private readListRoutingTable(options: TsType.Options): RoutingEntry[] {
        const value = [];

        for (let i = 0; i < options.length; i++) {
            value.push({
                destNwkAddr: this.readUInt16(),
                routeStatus: routingTableStatusLookup[this.readUInt8()],
                nextHopNwkAddr: this.readUInt16(),
            });
        }

        return value;
    }

    private readListBindTable(options: TsType.Options): Bind[]{
        const value = [];

        for (let i = 0; i < options.length; i++) {
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

    private readListNeighborLqi(options: TsType.Options): Neighbor[] {
        const value = [];
        for (let i = 0; i < options.length; i++) {
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

    private  readListNetwork(options: TsType.Options): Network[] {
        const value = [];
        for (let i = 0; i < options.length; i++) {
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
        const value = [];
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

    public read(type: string, options: BuffaloZnpOptions): TsType.Value {
        if (type === 'LIST_ROUTING_TABLE') {
            return this.readListRoutingTable(options);
        } else if (type === 'LIST_BIND_TABLE') {
            return this.readListBindTable(options);
        }  else if (type === 'LIST_NEIGHBOR_LQI') {
            return this.readListNeighborLqi(options);
        } else if (type === 'LIST_NETWORK') {
            return this.readListNetwork(options);
        } else if (type === 'LIST_ASSOC_DEV') {
            return this.readListAssocDev(options);
        } else {
            return super.read(type, options);
        }
    }
}

export default BuffaloZnp;
