/* istanbul ignore file */

import * as basic from './basic';
import * as named from './named';

export class BlzStruct {
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any*/
    static serialize(cls: any, obj: any): Buffer {
        return Buffer.concat(
            /* eslint-disable-next-line @typescript-eslint/no-explicit-any*/
            cls._fields.map((field: any[]) => {
                const value = obj[field[0]];
                return field[1].serialize(field[1], value);
            }),
        );
    }

    /* eslint-disable-next-line @typescript-eslint/no-explicit-any*/
    static deserialize(cls: any, data: Buffer): any[] {
        const r = new cls();
        for (const [field_name, field_type] of cls._fields) {
            let v;
            [v, data] = field_type.deserialize(field_type, data);
            r[field_name] = v;
        }
        return [r, data];
    }

    public toString(): string {
        return `${this.constructor.name}: ${JSON.stringify(this)}`;
    }
}

export class BlzNetworkParameters extends BlzStruct {
    // @ts-expect-error set via _fields
    public extendedPanId: Buffer;
    // @ts-expect-error set via _fields
    public panId: number;
    // @ts-expect-error set via _fields
    public TxPower: number;
    // @ts-expect-error set via _fields
    public Channel: number;
    // @ts-expect-error set via _fields
    public nwkManagerId: number;
    // @ts-expect-error set via _fields
    public nwkUpdateId: number;
    // @ts-expect-error set via _fields
    public channels: number;

    static _fields = [
        // The network's extended PAN identifier.
        ['extendedPanId', basic.fixed_list(8, basic.uint8_t)],
        // The network's PAN identifier.
        ['panId', basic.uint16_t],
        // A power setting, in dBm.
        ['TxPower', basic.uint8_t],
        // A radio channel.
        ['Channel', basic.uint8_t],
        // The method used to initially join the network.
        ['nwkManagerId', basic.uint16_t],
        // NWK Update ID. The value of the ZigBee nwkUpdateId known by the stack.
        ['nwkUpdateId', basic.uint8_t],
        // NWK channel mask.
        ['channels', basic.uint32_t],
    ];
}

export class BlzApsFrame extends BlzStruct {
    // @ts-expect-error set via _fields
    public profileId: number;
    // @ts-expect-error set via _fields
    public sequence: number;
    // @ts-expect-error set via _fields
    public clusterId: number;
    // @ts-expect-error set via _fields
    public sourceEndpoint: number;
    // @ts-expect-error set via _fields
    public destinationEndpoint: number;
    public groupId?: number;
    public options?: named.BlzApsOption;

    static _fields = [
        // The application profile ID that describes the format of the message.
        ['profileId', basic.uint16_t],
        // The cluster ID for this message.
        ['clusterId', basic.uint16_t],
        // The source endpoint.
        ['sourceEndpoint', basic.uint8_t],
        // The destination endpoint.
        ['destinationEndpoint', basic.uint8_t],
        // A bitmask of options.
        ['options', named.BlzApsOption],
        // The group ID for this message, if it is multicast mode.
        ['groupId', basic.uint16_t],
        // The sequence number.
        ['sequence', basic.uint8_t],
    ];
}

export class BlzNeighborTableEntry extends BlzStruct {
    // A neighbor table entry stores information about the reliability of RF
    // links to and from neighboring nodes.
    static _fields = [
        // The neighbor's two byte network id
        ['shortId', basic.uint16_t],
        // An exponentially weighted moving average of the link quality values
        // of incoming packets from this neighbor as reported by the PHY.
        ['averageLqi', basic.uint8_t],
        // The incoming cost for this neighbor, computed from the average LQI.
        // Values range from 1 for a good link to 7 for a bad link.
        ['inCost', basic.uint8_t],
        // The outgoing cost for this neighbor, obtained from the most recently
        // received neighbor exchange message from the neighbor. A value of zero
        // means that a neighbor exchange message from the neighbor has not been
        // received recently enough, or that our id was not present in the most
        // recently received one.
        ['outCost', basic.uint8_t],
        // The number of aging periods elapsed since a link status message was
        // last received from this neighbor. The aging period is 16 seconds.
        ['age', basic.uint8_t],
        // The 8 byte EUI64 of the neighbor.
        ['longId', named.BlzEUI64],
    ];
}

export class BlzRouteTableEntry extends BlzStruct {
    // A route table entry stores information about the next hop along the route
    // to the destination.
    static _fields = [
        // The short id of the destination. A value of 0xFFFF indicates the
        // entry is unused.
        ['destination', basic.uint16_t],
        // The short id of the next hop to this destination.
        ['nextHop', basic.uint16_t],
        // Indicates whether this entry is active [0], being discovered [1]],
        // unused [3], or validating [4].
        ['status', basic.uint8_t],
        // The number of seconds since this route entry was last used to send a
        // packet.
        ['age', basic.uint8_t],
        // Indicates whether this destination is a High RAM Concentrator [2], a
        // Low RAM Concentrator [1], or not a concentrator [0].
        ['concentratorType', basic.uint8_t],
        // For a High RAM Concentrator, indicates whether a route record is
        // needed [2], has been sent [1], or is no long needed [0] because a
        // source routed message from the concentrator has been received.
        ['routeRecordState', basic.uint8_t],
    ];
}

export class BlzNodeDescriptor extends BlzStruct {
    static _fields = [
        ['byte1', basic.uint8_t],
        ['byte2', basic.uint8_t],
        ['mac_capability_flags', basic.uint8_t],
        ['manufacturer_code', basic.uint16_t],
        ['maximum_buffer_size', basic.uint8_t],
        ['maximum_incoming_transfer_size', basic.uint16_t],
        ['server_mask', basic.uint16_t],
        ['maximum_outgoing_transfer_size', basic.uint16_t],
        ['descriptor_capability_field', basic.uint8_t],
    ];
}

export class BlzSimpleDescriptor extends BlzStruct {
    static _fields = [
        ['endpoint', basic.uint8_t],
        ['profileid', basic.uint16_t],
        ['deviceid', basic.uint16_t],
        ['deviceversion', basic.uint8_t],
        ['inclusterlist', basic.LVList(basic.uint16_t)],
        ['outclusterlist', basic.LVList(basic.uint16_t)],
    ];
}

export class BlzMultiAddress extends BlzStruct {
    static fields3 = [
        ['addrmode', basic.uint8_t],
        ['ieee', named.BlzEUI64],
        ['endpoint', basic.uint8_t],
    ];
    static fields1 = [
        ['addrmode', basic.uint8_t],
        ['nwk', named.BlzNodeId],
    ];
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any*/
    static serialize(cls: any, obj: any): Buffer {
        const addrmode = obj['addrmode'];

        const fields = addrmode == 3 ? cls.fields3 : cls.fields1;
        return Buffer.concat(
            /* eslint-disable-next-line @typescript-eslint/no-explicit-any*/
            fields.map((field: any[]) => {
                const value = obj[field[0]];
                // console.assert(field[1]);
                return field[1].serialize(field[1], value);
            }),
        );
    }
}

export class BlzNeighbor extends BlzStruct {
    static _fields = [
        ['extendedpanid', basic.fixed_list(8, basic.uint8_t)],
        ['ieee', named.BlzEUI64],
        ['nodeid', named.BlzNodeId],
        ['packed', basic.uint8_t],
        ['permitjoining', basic.uint8_t],
        ['depth', basic.uint8_t],
        ['lqi', basic.uint8_t],
    ];
}

export class BlzNeighbors extends BlzStruct {
    static _fields = [
        ['entries', basic.uint8_t],
        ['startindex', basic.uint8_t],
        ['neighbors', basic.LVList(BlzNeighbor)],
    ];
}

export class BlzRoutingTableEntry extends BlzStruct {
    static _fields = [
        ['destination', basic.uint16_t],
        ['status', basic.uint8_t],
        ['nexthop', basic.uint16_t],
    ];
}

export class BlzRoutingTable extends BlzStruct {
    static _fields = [
        ['entries', basic.uint8_t],
        ['startindex', basic.uint8_t],
        ['table', basic.LVList(BlzRoutingTableEntry)],
    ];
}
