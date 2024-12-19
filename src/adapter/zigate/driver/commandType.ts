/* v8 ignore start */

import {ZiGateCommandCode, ZiGateMessageCode, ZiGateObjectPayload} from './constants';
import ParameterType from './parameterType';

export interface PermitJoinPayload extends ZiGateObjectPayload {
    targetShortAddress: number;
    interval: number;
    TCsignificance?: number;
}

export interface RawAPSDataRequestPayload extends ZiGateObjectPayload {
    addressMode: number;
    targetShortAddress: number;
    sourceEndpoint: number;
    destinationEndpoint: number;
    profileID: number;
    clusterID: number;
    securityMode: number;
    radius: number;
    dataLength: number;
    data: Buffer;
}

export interface ZiGateCommandParameter {
    name: string;
    parameterType: ParameterType;
}

export interface ZiGateCommandType {
    request: ZiGateCommandParameter[];
    response?: ZiGateResponseMatcher[];
    waitStatus?: boolean;
}

export interface ZiGateResponseMatcherRule {
    receivedProperty: string;
    matcher: (expected: string | number | ZiGateMessageCode, received: string | number | ZiGateMessageCode) => boolean;
    expectedProperty?: string; // or
    expectedExtraParameter?: string; // or
    value?: string | number | ZiGateMessageCode;
}

export function equal(expected: string | number | ZiGateMessageCode, received: string | number | ZiGateMessageCode): boolean {
    return expected === received;
}

export function notEqual(expected: string | number | ZiGateMessageCode, received: string | number | ZiGateMessageCode): boolean {
    return expected !== received;
}

export type ZiGateResponseMatcher = ZiGateResponseMatcherRule[];

export const ZiGateCommand: {[key: string]: ZiGateCommandType} = {
    [ZiGateCommandCode.SetDeviceType]: {
        // 0x0023
        request: [
            {name: 'deviceType', parameterType: ParameterType.UINT8}, //<device type: uint8_t>
        ],
    },
    [ZiGateCommandCode.StartNetwork]: {
        // 0x0024
        request: [],
        response: [[{receivedProperty: 'code', matcher: equal, value: ZiGateMessageCode.NetworkJoined}]],
    },
    [ZiGateCommandCode.StartNetworkScan]: {
        request: [],
    },
    [ZiGateCommandCode.GetNetworkState]: {
        // 0x0009
        request: [],
        response: [[{receivedProperty: 'code', matcher: equal, value: ZiGateMessageCode.NetworkState}]],
    },
    [ZiGateCommandCode.GetTimeServer]: {
        // 0x0017
        request: [],
    },
    [ZiGateCommandCode.ErasePersistentData]: {
        // 0x0012
        request: [],
        response: [
            [
                {
                    receivedProperty: 'code',
                    matcher: equal,
                    value: ZiGateMessageCode.RestartFactoryNew,
                },
            ],
        ],
        waitStatus: false,
    },
    [ZiGateCommandCode.Reset]: {
        // 0x0011
        request: [],
        response: [
            [
                {
                    receivedProperty: 'code',
                    matcher: equal,
                    value: ZiGateMessageCode.RestartNonFactoryNew,
                },
            ],
            [
                {
                    receivedProperty: 'code',
                    matcher: equal,
                    value: ZiGateMessageCode.RestartFactoryNew,
                },
            ],
        ],
        waitStatus: false,
    },
    [ZiGateCommandCode.SetTXpower]: {
        // SetTXpower
        request: [{name: 'value', parameterType: ParameterType.UINT8}],
    },
    // [ZiGateCommandCode.ManagementLQI]: {
    //     // 0x004E
    //     request: [
    //         {name: 'targetAddress', parameterType: ParameterType.UINT16}, //<Target Address : uint16_t>	Status
    //         {name: 'startIndex', parameterType: ParameterType.UINT8}, //<Start Index : uint8_t>
    //     ],
    //     response: [
    //         [
    //             {
    //                 receivedProperty: 'code',
    //                 matcher: equal,
    //                 value: ZiGateMessageCode.DataIndication,
    //             },
    //             {
    //                 receivedProperty: 'payload.sourceAddress',
    //                 matcher: equal,
    //                 expectedProperty: 'payload.targetAddress',
    //             },
    //             {
    //                 receivedProperty: 'payload.clusterID',
    //                 matcher: equal,
    //                 value: 0x8031,
    //             },
    //         ],
    //     ],
    // },
    [ZiGateCommandCode.SetSecurityStateKey]: {
        // 0x0022
        request: [
            {name: 'keyType', parameterType: ParameterType.UINT8}, // 	<key type: uint8_t>
            {name: 'key', parameterType: ParameterType.BUFFER}, //   <key: data>
        ],
    },
    [ZiGateCommandCode.GetVersion]: {
        request: [],
        response: [[{receivedProperty: 'code', matcher: equal, value: ZiGateMessageCode.VersionList}]],
    },
    [ZiGateCommandCode.RawMode]: {
        request: [{name: 'enabled', parameterType: ParameterType.INT8}],
    },
    [ZiGateCommandCode.SetExtendedPANID]: {
        request: [
            {name: 'panId', parameterType: ParameterType.BUFFER}, //<64-bit Extended PAN ID:uint64_t>
        ],
    },
    [ZiGateCommandCode.SetChannelMask]: {
        request: [
            {name: 'channelMask', parameterType: ParameterType.UINT32}, //<channel mask:uint32_t>
        ],
    },

    // [ZiGateCommandCode.ManagementLeaveRequest]: {
    //     request: [
    //         {name: 'shortAddress', parameterType: ParameterType.UINT16},
    //         {name: 'extendedAddress', parameterType: ParameterType.IEEEADDR}, // <extended address: uint64_t>
    //         {name: 'rejoin', parameterType: ParameterType.UINT8},
    //         {name: 'removeChildren', parameterType: ParameterType.UINT8}, // <Remove Children: uint8_t>
    //     ],
    //     response: [
    //         [
    //             {
    //                 receivedProperty: 'code',
    //                 matcher: equal,
    //                 value: ZiGateMessageCode.LeaveIndication,
    //             },
    //             {
    //                 receivedProperty: 'payload.extendedAddress',
    //                 matcher: equal,
    //                 expectedProperty: 'payload.extendedAddress',
    //             },
    //         ],
    //         [
    //             {
    //                 receivedProperty: 'code',
    //                 matcher: equal,
    //                 value: ZiGateMessageCode.ManagementLeaveResponse,
    //             },
    //             {
    //                 receivedProperty: 'payload.sqn',
    //                 matcher: equal,
    //                 expectedProperty: 'status.seqApsNum',
    //             },
    //         ],
    //     ],
    // },

    [ZiGateCommandCode.RemoveDevice]: {
        request: [
            {name: 'parentAddress', parameterType: ParameterType.IEEEADDR}, // <parent address: uint64_t>
            {name: 'extendedAddress', parameterType: ParameterType.IEEEADDR}, // <extended address: uint64_t>
        ],
        response: [
            [
                {
                    receivedProperty: 'code',
                    matcher: equal,
                    value: ZiGateMessageCode.LeaveIndication,
                },
                {
                    receivedProperty: 'payload.extendedAddress',
                    matcher: equal,
                    expectedProperty: 'payload.extendedAddress',
                },
            ],
        ],
    },
    // [ZiGateCommandCode.PermitJoin]: {
    //     request: [
    //         {name: 'targetShortAddress', parameterType: ParameterType.UINT16}, //<target short address: uint16_t> -
    //         // broadcast 0xfffc
    //         {name: 'interval', parameterType: ParameterType.UINT8}, //<interval: uint8_t>
    //         // 0 = Disable Joining
    //         // 1 – 254 = Time in seconds to allow joins
    //         // 255 = Allow all joins
    //         // {name: 'TCsignificance', parameterType: ParameterType.UINT8}, //<TCsignificance: uint8_t>
    //         // 0 = No change in authentication
    //         // 1 = Authentication policy as spec
    //     ],
    // },
    [ZiGateCommandCode.PermitJoinStatus]: {
        request: [
            {name: 'targetShortAddress', parameterType: ParameterType.UINT16}, //<target short address: uint16_t> -
            // broadcast 0xfffc
            {name: 'interval', parameterType: ParameterType.UINT8}, //<interval: uint8_t>
            // 0 = Disable Joining
            // 1 – 254 = Time in seconds to allow joins
            // 255 = Allow all joins
            {name: 'TCsignificance', parameterType: ParameterType.UINT8}, //<TCsignificance: uint8_t>
            // 0 = No change in authentication
            // 1 = Authentication policy as spec
        ],
        response: [[{receivedProperty: 'code', matcher: equal, value: ZiGateMessageCode.PermitJoinStatus}]],
    },
    [ZiGateCommandCode.RawAPSDataRequest]: {
        request: [
            {name: 'addressMode', parameterType: ParameterType.UINT8}, // <address mode: uint8_t>
            {name: 'targetShortAddress', parameterType: ParameterType.UINT16}, // <target short address: uint16_t>
            {name: 'sourceEndpoint', parameterType: ParameterType.UINT8}, // <source endpoint: uint8_t>
            {name: 'destinationEndpoint', parameterType: ParameterType.UINT8}, // <destination endpoint: uint8_t>
            {name: 'clusterID', parameterType: ParameterType.UINT16}, // <cluster ID: uint16_t>
            {name: 'profileID', parameterType: ParameterType.UINT16}, // <profile ID: uint16_t>
            {name: 'securityMode', parameterType: ParameterType.UINT8}, // <security mode: uint8_t>
            {name: 'radius', parameterType: ParameterType.UINT8}, // <radius: uint8_t>
            {name: 'dataLength', parameterType: ParameterType.UINT8}, // <data length: uint8_t>
            {name: 'data', parameterType: ParameterType.BUFFER}, // <data: auint8_t>
        ],
    },
    // [ZiGateCommandCode.NodeDescriptor]: {
    //     request: [
    //         {name: 'targetShortAddress', parameterType: ParameterType.UINT16}, // <target short address: uint16_t>
    //     ],
    //     response: [
    //         [
    //             {
    //                 receivedProperty: 'code',
    //                 matcher: equal,
    //                 value: ZiGateMessageCode.DataIndication,
    //             },
    //             {
    //                 receivedProperty: 'payload.sourceAddress',
    //                 matcher: equal,
    //                 expectedProperty: 'payload.targetShortAddress',
    //             },
    //             {
    //                 receivedProperty: 'payload.clusterID',
    //                 matcher: equal,
    //                 value: 0x8002,
    //             },
    //         ],
    //     ],
    // },
    // [ZiGateCommandCode.ActiveEndpoint]: {
    //     request: [
    //         {name: 'targetShortAddress', parameterType: ParameterType.UINT16}, // <target short address: uint16_t>
    //     ],
    //     response: [
    //         [
    //             {
    //                 receivedProperty: 'code',
    //                 matcher: equal,
    //                 value: ZiGateMessageCode.DataIndication,
    //             },
    //             {
    //                 receivedProperty: 'payload.sourceAddress',
    //                 matcher: equal,
    //                 expectedProperty: 'payload.targetShortAddress',
    //             },
    //             {
    //                 receivedProperty: 'payload.clusterID',
    //                 matcher: equal,
    //                 value: 0x8005,
    //             },
    //         ],
    //     ],
    // },
    // [ZiGateCommandCode.SimpleDescriptor]: {
    //     request: [
    //         {name: 'targetShortAddress', parameterType: ParameterType.UINT16}, // <target short address: uint16_t>
    //         {name: 'endpoint', parameterType: ParameterType.UINT8}, // <endpoint: uint8_t>
    //     ],
    //     response: [
    //         [
    //             {receivedProperty: 'code', matcher: equal, value: ZiGateMessageCode.DataIndication},
    //             {
    //                 receivedProperty: 'payload.sourceAddress',
    //                 matcher: equal,
    //                 expectedProperty: 'payload.targetShortAddress',
    //             },
    //             {
    //                 receivedProperty: 'payload.clusterID',
    //                 matcher: equal,
    //                 value: 0x8004,
    //             },
    //         ],
    //     ],
    // },
    // [ZiGateCommandCode.Bind]: {
    //     request: [
    //         {name: 'targetExtendedAddress', parameterType: ParameterType.IEEEADDR}, // <target extended address: uint64_t>
    //         {name: 'targetEndpoint', parameterType: ParameterType.UINT8}, // <target endpoint: uint8_t>
    //         {name: 'clusterID', parameterType: ParameterType.UINT16}, // <cluster ID: uint16_t>
    //         {name: 'destinationAddressMode', parameterType: ParameterType.UINT8}, // <destination address mode: uint8_t>
    //         {
    //             name: 'destinationAddress',
    //             parameterType: ParameterType.ADDRESS_WITH_TYPE_DEPENDENCY,
    //         }, // <destination address:uint16_t or uint64_t>
    //         {name: 'destinationEndpoint', parameterType: ParameterType.UINT8}, // <destination endpoint (
    //         // value ignored for group address): uint8_t>
    //     ],
    //     response: [
    //         [
    //             {
    //                 receivedProperty: 'code',
    //                 matcher: equal,
    //                 value: ZiGateMessageCode.DataIndication,
    //             },
    //             {
    //                 receivedProperty: 'payload.sourceAddress',
    //                 matcher: equal,
    //                 expectedExtraParameter: 'destinationNetworkAddress',
    //             },
    //             {
    //                 receivedProperty: 'payload.clusterID',
    //                 matcher: equal,
    //                 value: 0x8021,
    //             },
    //             {
    //                 receivedProperty: 'payload.profileID',
    //                 matcher: equal,
    //                 value: 0x0000,
    //             },
    //         ],
    //     ],
    // },
    // [ZiGateCommandCode.UnBind]: {
    //     request: [
    //         {name: 'targetExtendedAddress', parameterType: ParameterType.IEEEADDR}, // <target extended address: uint64_t>
    //         {name: 'targetEndpoint', parameterType: ParameterType.UINT8}, // <target endpoint: uint8_t>
    //         {name: 'clusterID', parameterType: ParameterType.UINT16}, // <cluster ID: uint16_t>
    //         {name: 'destinationAddressMode', parameterType: ParameterType.UINT8}, // <destination address mode: uint8_t>
    //         {
    //             name: 'destinationAddress',
    //             parameterType: ParameterType.ADDRESS_WITH_TYPE_DEPENDENCY,
    //         }, // <destination address:uint16_t or uint64_t>
    //         {name: 'destinationEndpoint', parameterType: ParameterType.UINT8}, // <destination endpoint (
    //         // value ignored for group address): uint8_t>
    //     ],
    //     response: [
    //         [
    //             {
    //                 receivedProperty: 'code',
    //                 matcher: equal,
    //                 value: ZiGateMessageCode.DataIndication,
    //             },
    //             {
    //                 receivedProperty: 'payload.sourceAddress',
    //                 matcher: equal,
    //                 expectedExtraParameter: 'destinationNetworkAddress',
    //             },
    //             {
    //                 receivedProperty: 'payload.clusterID',
    //                 matcher: equal,
    //                 value: 0x8022,
    //             },
    //             {
    //                 receivedProperty: 'payload.profileID',
    //                 matcher: equal,
    //                 value: 0x0000,
    //             },
    //         ],
    //     ],
    // },
    [ZiGateCommandCode.AddGroup]: {
        request: [
            {name: 'addressMode', parameterType: ParameterType.UINT8}, //<device type: uint8_t>
            {name: 'shortAddress', parameterType: ParameterType.UINT16},
            {name: 'sourceEndpoint', parameterType: ParameterType.UINT8},
            {name: 'destinationEndpoint', parameterType: ParameterType.UINT8},
            {name: 'groupAddress', parameterType: ParameterType.UINT16},
        ],
    },
};
