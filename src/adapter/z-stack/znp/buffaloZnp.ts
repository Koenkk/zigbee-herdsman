
import {Buffalo, TsType} from '../../../buffalo';
import {BuffaloZnpOptions} from './tstype';

class BuffaloZnp extends Buffalo {
    private readListRoutingTable(options: TsType.Options): TsType.Value {
        const statusLookup: {[n: number]: string} = {
            0: 'ACTIVE',
            1: 'DISCOVERY_UNDERWAY',
            2: 'DISCOVERY_FAILED',
            3: 'INACTIVE',
        };

        const value = [];
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        for (let i = 0; i < options.length; i++) {
            value.push({
                'destNwkAddr': this.readUInt16(),
                'routeStatus': statusLookup[this.readUInt8()],
                'nextHopNwkAddr': this.readUInt16(),
            });
        }

        return value;
    }

    private readListBindTable(options: TsType.Options): TsType.Value {
        const value = [];

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        for (let i = 0; i < options.length; i++) {
            const item: {[s: string]: number|string} = {};

            item['srcAddr'] = this.readIeeeAddr();
            item['srcEp'] = this.readUInt8();
            item['clusterId'] = this.readUInt16();
            item['dstAddrMode'] = this.readUInt8();
            item['dstAddr'] = this.readIeeeAddr();

            if (item.dstAddrMode === 3) {
                item['dstEp'] = this.readUInt8();
            }

            value.push(item);
        }

        return value;
    }

    private readListNeighborLqi(options: TsType.Options): TsType.Value {
        const value = [];
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        for (let i = 0; i < options.length; i++) {
            const item: {[s: string]: number|string} = {};

            item['extPandId'] = this.readIeeeAddr();
            item['extAddr'] = this.readIeeeAddr();
            item['nwkAddr'] = this.readUInt16();

            const value1 = this.readUInt8();
            item['deviceType'] = value1 & 0x03;
            item['rxOnWhenIdle'] = (value1 & 0x0C) >> 2;
            item['relationship'] = (value1 & 0x70) >> 4;

            item['permitJoin'] = this.readUInt8() & 0x03;
            item['depth'] = this.readUInt8();
            item['lqi'] = this.readUInt8();

            value.push(item);
        }

        return value;
    }

    private  readListNetwork(options: TsType.Options): TsType.Value {
        const value = [];
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        for (let i = 0; i < options.length; i++) {
            const item: {[s: string]: number|string} = {};

            item['neightborPanId'] = this.readUInt16();
            item['logicalChannel'] = this.readUInt8();

            const value1 = this.readUInt8();
            item['stackProfile'] = value1 & 0x0F;
            item['zigbeeVersion'] = (value1 & 0xF0) >> 4;

            const value2 = this.readUInt8();
            item['beaconOrder'] = value2 & 0x0F;
            item['superFrameOrder'] = (value2 & 0xF0) >> 4;

            item['permitJoin'] = this.readUInt8();

            value.push(item);
        }

        return value;
    }

    private readListAssocDev(options: BuffaloZnpOptions): TsType.Value {
        const value = [];
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
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
