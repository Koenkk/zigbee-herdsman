import { CommandId, Status, NetworkState, DeviceType } from "./enums";
import {BuffaloZclDataType, DataType, StructuredIndicatorType} from '../../zspec/zcl/definition/enums';

/* eslint-disable-next-line @typescript-eslint/no-explicit-any*/
// export interface ParamsDesc {[s: string]: any};
export interface ParamsDesc {
    name: string,
    type: DataType,
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any*/
    condition?: (payload: any) => boolean,
};

interface ZBOSSFrameDesc {
    request: ParamsDesc[],
    response: ParamsDesc[],
    indication?: ParamsDesc[],
}

export const FRAMES: {[key in CommandId]?: ZBOSSFrameDesc} = {
    [CommandId.NETWORK_INIT]: {
        request: [],
        response: [
            {name: 'status', type: DataType.UINT8}, // Status
        ],
    },
    [CommandId.START]: {
        request: [
            {name: 'autostart', type: DataType.BOOLEAN},
        ],
        response: [
            {name: 'status', type: DataType.UINT8}, // Status
        ],
    },
    [CommandId.NETWORK_STATE]: {
        request: [],
        response: [
            {name: 'state', type: DataType.UINT8}, // NetworkState
        ],
    },
    [CommandId.STACK_STATUS_HANDLER]: {
        request: [],
        response: [
            {name: 'status', type: DataType.UINT8},
        ],
        indication: [
            {name: 'status', type: DataType.UINT8},
        ],
    },
    [CommandId.FORM_NETWORK]: {
        request: [
            {name: 'role', type: DataType.UINT8}, // DeviceType
            {name: 'install_code_policy', type: DataType.BOOLEAN},
            {name: 'max_children', type: DataType.UINT8, condition: (payload) => [DeviceType.COORDINATOR, DeviceType.ROUTER].includes(payload.role)},
            {name: 'ed_timeout', type: DataType.UINT8, condition: (payload) => payload.role == DeviceType.ED},
            {name: 'keep_alive', type: DataType.UINT32, condition: (payload) => payload.role == DeviceType.ED},
        ],
        response: [
            {name: 'status', type: DataType.UINT8}, // Status
        ],
        indication: [
            {name: 'extended_panid', type: DataType.IEEE_ADDR},
            {name: 'panID', type: DataType.UINT16},
            {name: 'channel', type: DataType.UINT8},
        ],
    },
    [CommandId.PERMIT_JOINING]: {
        request: [
            {name: 'duration', type: DataType.UINT8},
        ],
        response: [
            {name: 'status', type: DataType.UINT8}, // Status
        ],
        indication: [
            {name: 'duration', type: DataType.UINT8},
        ],
    },
    [CommandId.LEAVE_NETWORK]: {
        request: [],
        response: [
            {name: 'status', type: DataType.UINT8}, // Status
        ],
        indication: [
            {name: 'short_addr', type: DataType.UINT16},
            {name: 'device_addr', type: DataType.IEEE_ADDR},
            {name: 'rejoin', type: DataType.BOOLEAN},
        ],
    },
};
