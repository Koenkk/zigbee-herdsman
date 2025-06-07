/* istanbul ignore file */

import {Bytes, fixed_list, int8s, list, LVBytes, LVList, uint_t, uint8_t, uint16_t, uint24_t, uint32_t, uint64_t, WordList} from './basic';
import {
    Bool,
    BlzApsOption,
    BlzEUI64,
    BlzNodeId,
    BlzNodeType,
    BlzOutgoingMessageType,
    BlzStatus,
    BlzValueId,

} from './named';
import {
    BlzApsFrame,
    BlzNetworkParameters,
    BlzStruct,
    BlzMultiAddress,
    BlzNeighbors,
    BlzNodeDescriptor /* Named Types */,
    BlzRoutingTable,
    BlzSimpleDescriptor,
} from './struct';

/* eslint-disable-next-line @typescript-eslint/no-explicit-any*/
export function deserialize(payload: any, schema: any[]): any[] {
    const result = [];
    let value,
        data = payload;
    for (const type of schema) {
        [value, data] = type.deserialize(type, data);
        result.push(value);
    }
    return [result, data];
}

/* eslint-disable-next-line @typescript-eslint/no-explicit-any*/
export function serialize(data: any[], schema: {serialize: (schema: any, item: any) => Buffer}[]): Buffer {
    return Buffer.concat(schema.map((s, idx) => s.serialize(s, data[idx])));
}

export {
    /* Basic Types */
    int8s,
    uint_t,
    uint8_t,
    uint16_t,
    uint24_t,
    uint32_t,
    uint64_t,
    LVBytes,
    list,
    LVList,
    fixed_list,
    WordList,
    Bytes,

    /* Named Types */
    BlzNodeId,
    BlzEUI64,
    Bool,
    BlzValueId,
    BlzStatus,
    BlzNodeType,
    BlzOutgoingMessageType,
    BlzApsOption,

    /* Structs */
    BlzStruct,
    BlzNetworkParameters as BlzNetworkParameters,
    BlzApsFrame,
    BlzNodeDescriptor,
    BlzSimpleDescriptor,
    BlzMultiAddress,
    BlzNeighbors,
    BlzRoutingTable,
};
