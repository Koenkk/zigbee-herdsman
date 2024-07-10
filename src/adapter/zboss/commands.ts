import { CommandId, Status, NetworkState, DeviceType, ResetOptions, StatusCategory, StatusCodeGeneric, StatusCodeAPS, StatusCodeCBKE } from "./enums";
import {BuffaloZclDataType, DataType, StructuredIndicatorType} from '../../zspec/zcl/definition/enums';
import {strict} from "assert";

/* eslint-disable-next-line @typescript-eslint/no-explicit-any*/
// export interface ParamsDesc {[s: string]: any};
export interface ParamsDesc {
    name: string,
    type: DataType,
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any*/
    condition?: (payload: any) => boolean,
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any*/
    typed?: any
};

interface ZBOSSFrameDesc {
    request: ParamsDesc[],
    response: ParamsDesc[],
    indication?: ParamsDesc[],
}

const defaultResponse = [
    {name: 'category', type: DataType.UINT8, typed: StatusCategory},
    {name: 'status', type: DataType.UINT8, typed: [StatusCodeGeneric, StatusCodeAPS, StatusCodeCBKE]},
];

export const FRAMES: {[key in CommandId]?: ZBOSSFrameDesc} = {
    // NCP config frames

    // Requests firmware, stack and protocol versions from NCP
    [CommandId.GET_MODULE_VERSION]: {
        request: [],
        response: [
            ...defaultResponse,
            {name: 'fwVersion', type: DataType.UINT32},
            {name: 'stackVersion', type: DataType.UINT32},
            {name: 'protocolVersion', type: DataType.UINT32},
        ],
    },
    // Force NCP module reboot
    [CommandId.NCP_RESET]: {
        request: [
            {name: 'options', type: DataType.UINT8, typed: ResetOptions},
        ],
        response: [
            ...defaultResponse,
        ],
    },
    // Requests current Zigbee role of the local device
    [CommandId.GET_ZIGBEE_ROLE]: {
        request: [
        ],
        response: [
            ...defaultResponse,
            {name: 'role', type: DataType.UINT8, typed: DeviceType},
        ],
    },
    // Set Zigbee role of the local device
    [CommandId.SET_ZIGBEE_ROLE]: {
        request: [
            {name: 'role', type: DataType.UINT8, typed: DeviceType},
        ],
        response: [
            ...defaultResponse,
        ],
    },
    // Get Zigbee channels page and mask of the local device
    [CommandId.GET_ZIGBEE_CHANNEL_MASK]: {
        request: [
        ],
        response: [
            ...defaultResponse,
            {name: 'len', type: DataType.UINT8},
            // {name: 'channels', type: DataType.ChannelListEntry},
        ],
    },
    // Device Reset Indication with reset source
    [CommandId.NCP_RESET_IND]: {
        request: [],
        response: [
            ...defaultResponse,
        ],
        indication: [
            {name: 'source', type: DataType.UINT8},
        ],
    },
    
    // [CommandId.NETWORK_INIT]: {
    //     request: [],
    //     response: [
    //         {name: 'status', type: DataType.UINT8}, // Status
    //     ],
    // },
    // [CommandId.START]: {
    //     request: [
    //         {name: 'autostart', type: DataType.BOOLEAN},
    //     ],
    //     response: [
    //         {name: 'status', type: DataType.UINT8}, // Status
    //     ],
    // },
    // [CommandId.NETWORK_STATE]: {
    //     request: [],
    //     response: [
    //         {name: 'state', type: DataType.UINT8}, // NetworkState
    //     ],
    // },
    // [CommandId.STACK_STATUS_HANDLER]: {
    //     request: [],
    //     response: [
    //         {name: 'status', type: DataType.UINT8},
    //     ],
    //     indication: [
    //         {name: 'status', type: DataType.UINT8},
    //     ],
    // },
    // [CommandId.FORM_NETWORK]: {
    //     request: [
    //         {name: 'role', type: DataType.UINT8}, // DeviceType
    //         {name: 'install_code_policy', type: DataType.BOOLEAN},
    //         {name: 'max_children', type: DataType.UINT8, condition: (payload) => [DeviceType.COORDINATOR, DeviceType.ROUTER].includes(payload.role)},
    //         {name: 'ed_timeout', type: DataType.UINT8, condition: (payload) => payload.role == DeviceType.ED},
    //         {name: 'keep_alive', type: DataType.UINT32, condition: (payload) => payload.role == DeviceType.ED},
    //     ],
    //     response: [
    //         {name: 'status', type: DataType.UINT8}, // Status
    //     ],
    //     indication: [
    //         {name: 'extended_panid', type: DataType.IEEE_ADDR},
    //         {name: 'panID', type: DataType.UINT16},
    //         {name: 'channel', type: DataType.UINT8},
    //     ],
    // },
    // [CommandId.PERMIT_JOINING]: {
    //     request: [
    //         {name: 'duration', type: DataType.UINT8},
    //     ],
    //     response: [
    //         {name: 'status', type: DataType.UINT8}, // Status
    //     ],
    //     indication: [
    //         {name: 'duration', type: DataType.UINT8},
    //     ],
    // },
    // [CommandId.LEAVE_NETWORK]: {
    //     request: [],
    //     response: [
    //         {name: 'status', type: DataType.UINT8}, // Status
    //     ],
    //     indication: [
    //         {name: 'short_addr', type: DataType.UINT16},
    //         {name: 'device_addr', type: DataType.IEEE_ADDR},
    //         {name: 'rejoin', type: DataType.BOOLEAN},
    //     ],
    // },
};
