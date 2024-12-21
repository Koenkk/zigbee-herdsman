/* v8 ignore start */

import {BuffaloZclDataType, DataType} from '../../zspec/zcl/definition/enums';
import {ClusterId as ZdoClusterId} from '../../zspec/zdo';
import {
    BuffaloZBOSSDataType,
    CommandId,
    DeviceAuthorizedType,
    DeviceType,
    DeviceUpdateStatus,
    PolicyType,
    ResetOptions,
    ResetSource,
    StatusCategory,
    StatusCodeAPS,
    StatusCodeCBKE,
    StatusCodeGeneric,
} from './enums';

export interface ParamsDesc {
    name: string;
    type: DataType | BuffaloZclDataType | BuffaloZBOSSDataType;
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any*/
    condition?: (payload: any, buffalo: any) => boolean;
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any*/
    typed?: any;
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any*/
    options?: (payload: any, options: any) => void;
}

interface ZBOSSFrameDesc {
    request: ParamsDesc[];
    response: ParamsDesc[];
    indication?: ParamsDesc[];
}

export const ZDO_REQ_CLUSTER_ID_TO_ZBOSS_COMMAND_ID: Readonly<Partial<Record<ZdoClusterId, CommandId>>> = {
    [ZdoClusterId.NETWORK_ADDRESS_REQUEST]: CommandId.ZDO_NWK_ADDR_REQ,
    [ZdoClusterId.IEEE_ADDRESS_REQUEST]: CommandId.ZDO_IEEE_ADDR_REQ,
    [ZdoClusterId.POWER_DESCRIPTOR_REQUEST]: CommandId.ZDO_POWER_DESC_REQ,
    [ZdoClusterId.NODE_DESCRIPTOR_REQUEST]: CommandId.ZDO_NODE_DESC_REQ,
    [ZdoClusterId.SIMPLE_DESCRIPTOR_REQUEST]: CommandId.ZDO_SIMPLE_DESC_REQ,
    [ZdoClusterId.ACTIVE_ENDPOINTS_REQUEST]: CommandId.ZDO_ACTIVE_EP_REQ,
    [ZdoClusterId.MATCH_DESCRIPTORS_REQUEST]: CommandId.ZDO_MATCH_DESC_REQ,
    [ZdoClusterId.BIND_REQUEST]: CommandId.ZDO_BIND_REQ,
    [ZdoClusterId.UNBIND_REQUEST]: CommandId.ZDO_UNBIND_REQ,
    [ZdoClusterId.LEAVE_REQUEST]: CommandId.ZDO_MGMT_LEAVE_REQ,
    [ZdoClusterId.PERMIT_JOINING_REQUEST]: CommandId.ZDO_PERMIT_JOINING_REQ,
    [ZdoClusterId.BINDING_TABLE_REQUEST]: CommandId.ZDO_MGMT_BIND_REQ,
    [ZdoClusterId.LQI_TABLE_REQUEST]: CommandId.ZDO_MGMT_LQI_REQ,
    // [ZdoClusterId.ROUTING_TABLE_REQUEST]: CommandId.ZDO_MGMT_RTG_REQ,
    [ZdoClusterId.NWK_UPDATE_REQUEST]: CommandId.ZDO_MGMT_NWK_UPDATE_REQ,
};

export const ZBOSS_COMMAND_ID_TO_ZDO_RSP_CLUSTER_ID: Readonly<Partial<Record<CommandId, ZdoClusterId>>> = {
    [CommandId.ZDO_NWK_ADDR_REQ]: ZdoClusterId.NETWORK_ADDRESS_RESPONSE,
    [CommandId.ZDO_IEEE_ADDR_REQ]: ZdoClusterId.IEEE_ADDRESS_RESPONSE,
    [CommandId.ZDO_POWER_DESC_REQ]: ZdoClusterId.POWER_DESCRIPTOR_RESPONSE,
    [CommandId.ZDO_NODE_DESC_REQ]: ZdoClusterId.NODE_DESCRIPTOR_RESPONSE,
    [CommandId.ZDO_SIMPLE_DESC_REQ]: ZdoClusterId.SIMPLE_DESCRIPTOR_RESPONSE,
    [CommandId.ZDO_ACTIVE_EP_REQ]: ZdoClusterId.ACTIVE_ENDPOINTS_RESPONSE,
    [CommandId.ZDO_MATCH_DESC_REQ]: ZdoClusterId.MATCH_DESCRIPTORS_RESPONSE,
    [CommandId.ZDO_BIND_REQ]: ZdoClusterId.BIND_RESPONSE,
    [CommandId.ZDO_UNBIND_REQ]: ZdoClusterId.UNBIND_RESPONSE,
    [CommandId.ZDO_MGMT_LEAVE_REQ]: ZdoClusterId.LEAVE_RESPONSE,
    [CommandId.ZDO_PERMIT_JOINING_REQ]: ZdoClusterId.PERMIT_JOINING_RESPONSE,
    [CommandId.ZDO_MGMT_BIND_REQ]: ZdoClusterId.BINDING_TABLE_RESPONSE,
    [CommandId.ZDO_MGMT_LQI_REQ]: ZdoClusterId.LQI_TABLE_RESPONSE,
    // [CommandId.ZDO_MGMT_RTG_REQ]: ZdoClusterId.ROUTING_TABLE_RESPONSE,
    [CommandId.ZDO_MGMT_NWK_UPDATE_REQ]: ZdoClusterId.NWK_UPDATE_RESPONSE,
    [CommandId.ZDO_DEV_ANNCE_IND]: ZdoClusterId.END_DEVICE_ANNOUNCE,
};

const commonResponse = [
    {name: 'category', type: DataType.UINT8, typed: StatusCategory},
    {name: 'status', type: DataType.UINT8, typed: [StatusCodeGeneric, StatusCodeAPS, StatusCodeCBKE]},
];

export const FRAMES: {[key in CommandId]?: ZBOSSFrameDesc} = {
    // ------------------------------------------
    // NCP config
    // ------------------------------------------

    // Requests firmware, stack and protocol versions from NCP
    [CommandId.GET_MODULE_VERSION]: {
        request: [],
        response: [
            ...commonResponse,
            {name: 'fwVersion', type: DataType.UINT32},
            {name: 'stackVersion', type: DataType.UINT32},
            {name: 'protocolVersion', type: DataType.UINT32},
        ],
    },
    // Force NCP module reboot
    [CommandId.NCP_RESET]: {
        request: [{name: 'options', type: DataType.UINT8, typed: ResetOptions}],
        response: [...commonResponse],
    },
    // Requests current Zigbee role of the local device
    [CommandId.GET_ZIGBEE_ROLE]: {
        request: [],
        response: [...commonResponse, {name: 'role', type: DataType.UINT8, typed: DeviceType}],
    },
    // Set Zigbee role of the local device
    [CommandId.SET_ZIGBEE_ROLE]: {
        request: [{name: 'role', type: DataType.UINT8, typed: DeviceType}],
        response: [...commonResponse],
    },
    // Get Zigbee channels page and mask of the local device
    [CommandId.GET_ZIGBEE_CHANNEL_MASK]: {
        request: [],
        response: [
            ...commonResponse,
            {name: 'len', type: DataType.UINT8},
            {
                name: 'channels',
                type: BuffaloZBOSSDataType.LIST_TYPED,
                typed: [
                    {name: 'page', type: DataType.UINT8},
                    {name: 'mask', type: DataType.UINT32},
                ],
            },
        ],
    },
    // Set Zigbee channels page and mask
    [CommandId.SET_ZIGBEE_CHANNEL_MASK]: {
        request: [
            {name: 'page', type: DataType.UINT8},
            {name: 'mask', type: DataType.UINT32},
        ],
        response: [...commonResponse],
    },
    // Get Zigbee channel
    [CommandId.GET_ZIGBEE_CHANNEL]: {
        request: [],
        response: [...commonResponse, {name: 'page', type: DataType.UINT8}, {name: 'channel', type: DataType.UINT8}],
    },
    // Requests current short PAN ID
    [CommandId.GET_PAN_ID]: {
        request: [],
        response: [...commonResponse, {name: 'panID', type: DataType.UINT16}],
    },
    // Set short PAN ID
    [CommandId.SET_PAN_ID]: {
        request: [{name: 'panID', type: DataType.UINT16}],
        response: [...commonResponse],
    },
    // Requests local IEEE address
    [CommandId.GET_LOCAL_IEEE_ADDR]: {
        request: [{name: 'mac', type: DataType.UINT8}],
        response: [...commonResponse, {name: 'mac', type: DataType.UINT8}, {name: 'ieee', type: DataType.IEEE_ADDR}],
    },
    // Set local IEEE address
    [CommandId.SET_LOCAL_IEEE_ADDR]: {
        request: [
            {name: 'mac', type: DataType.UINT8},
            {name: 'ieee', type: DataType.IEEE_ADDR},
        ],
        response: [...commonResponse],
    },
    // Get Transmit Power
    [CommandId.GET_TX_POWER]: {
        request: [],
        response: [...commonResponse, {name: 'txPower', type: DataType.UINT8}],
    },
    // Set Transmit Power
    [CommandId.SET_TX_POWER]: {
        request: [{name: 'txPower', type: DataType.UINT8}],
        response: [...commonResponse, {name: 'txPower', type: DataType.UINT8}],
    },
    // Requests RxOnWhenIdle PIB attribute
    [CommandId.GET_RX_ON_WHEN_IDLE]: {
        request: [],
        response: [...commonResponse, {name: 'rxOn', type: DataType.UINT8}],
    },
    // Sets Rx On When Idle PIB attribute
    [CommandId.SET_RX_ON_WHEN_IDLE]: {
        request: [{name: 'rxOn', type: DataType.UINT8}],
        response: [...commonResponse],
    },
    // Requests current join status of the device
    [CommandId.GET_JOINED]: {
        request: [],
        response: [...commonResponse, {name: 'joined', type: DataType.UINT8}],
    },
    // Requests current authentication status of the device
    [CommandId.GET_AUTHENTICATED]: {
        request: [],
        response: [...commonResponse, {name: 'authenticated', type: DataType.UINT8}],
    },
    // Requests current End Device timeout
    [CommandId.GET_ED_TIMEOUT]: {
        request: [],
        response: [...commonResponse, {name: 'timeout', type: DataType.UINT8}],
    },
    // Sets End Device timeout
    [CommandId.SET_ED_TIMEOUT]: {
        request: [{name: 'timeout', type: DataType.UINT8}],
        response: [...commonResponse],
    },
    // Set NWK Key
    [CommandId.SET_NWK_KEY]: {
        request: [
            {name: 'nwkKey', type: DataType.SEC_KEY},
            {name: 'index', type: DataType.UINT8},
        ],
        response: [...commonResponse],
    },
    // Get list of NWK keys
    [CommandId.GET_NWK_KEYS]: {
        request: [],
        response: [
            ...commonResponse,
            {name: 'nwkKey1', type: DataType.SEC_KEY},
            {name: 'index1', type: DataType.UINT8},
            {name: 'nwkKey2', type: DataType.SEC_KEY},
            {name: 'index2', type: DataType.UINT8},
            {name: 'nwkKey3', type: DataType.SEC_KEY},
            {name: 'index3', type: DataType.UINT8},
        ],
    },
    // Get APS key by IEEE
    [CommandId.GET_APS_KEY_BY_IEEE]: {
        request: [{name: 'ieee', type: DataType.IEEE_ADDR}],
        response: [...commonResponse, {name: 'apsKey', type: DataType.SEC_KEY}],
    },
    // Get Parent short address
    [CommandId.GET_PARENT_ADDRESS]: {
        request: [],
        response: [...commonResponse, {name: 'parent', type: DataType.UINT16}],
    },
    // Get Extended Pan ID
    [CommandId.GET_EXTENDED_PAN_ID]: {
        request: [],
        response: [...commonResponse, {name: 'extendedPanID', type: BuffaloZBOSSDataType.EXTENDED_PAN_ID}],
    },
    // Get Coordinator version
    [CommandId.GET_COORDINATOR_VERSION]: {
        request: [],
        response: [...commonResponse, {name: 'version', type: DataType.UINT8}],
    },
    // Get Short Address of the device
    [CommandId.GET_SHORT_ADDRESS]: {
        request: [],
        response: [...commonResponse, {name: 'nwk', type: DataType.UINT16}],
    },
    // Get Trust Center IEEE Address
    [CommandId.GET_TRUST_CENTER_ADDRESS]: {
        request: [],
        response: [...commonResponse, {name: 'ieee', type: DataType.IEEE_ADDR}],
    },
    // Device Reset Indication with reset source
    [CommandId.NCP_RESET_IND]: {
        request: [],
        response: [...commonResponse],
        indication: [{name: 'source', type: DataType.UINT8, typed: ResetSource}],
    },
    // Writes NVRAM datasets
    [CommandId.NVRAM_WRITE]: {
        request: [
            {name: 'len', type: DataType.UINT8},
            {name: 'data', type: BuffaloZclDataType.LIST_UINT8, options: (payload, options) => (options.length = payload.len)},
        ],
        response: [...commonResponse],
    },
    // Reads an NVRAM dataset
    [CommandId.NVRAM_READ]: {
        request: [{name: 'type', type: DataType.UINT8}],
        response: [
            ...commonResponse,
            {name: 'nvVersion', type: DataType.UINT16},
            {name: 'type', type: DataType.UINT16},
            {name: 'version', type: DataType.UINT16},
            {name: 'len', type: DataType.UINT16},
            {name: 'data', type: BuffaloZclDataType.LIST_UINT8, options: (payload, options) => (options.length = payload.len)},
        ],
    },
    // Erases all datasets in NVRAM
    [CommandId.NVRAM_ERASE]: {
        request: [],
        response: [...commonResponse],
    },
    // Erases all datasets in NVRAM except ZB_NVRAM_RESERVED, ZB_IB_COUNTERS and application datasets
    [CommandId.NVRAM_CLEAR]: {
        request: [],
        response: [...commonResponse],
    },
    // Sets TC Policy
    [CommandId.SET_TC_POLICY]: {
        request: [
            {name: 'type', type: DataType.UINT16, typed: PolicyType},
            {name: 'value', type: DataType.UINT8},
        ],
        response: [...commonResponse],
    },
    // Sets an extended PAN ID
    [CommandId.SET_EXTENDED_PAN_ID]: {
        request: [{name: 'extendedPanID', type: BuffaloZBOSSDataType.EXTENDED_PAN_ID}],
        response: [...commonResponse],
    },
    // Sets the maximum number of children
    [CommandId.SET_MAX_CHILDREN]: {
        request: [{name: 'children', type: DataType.UINT8}],
        response: [...commonResponse],
    },
    // Gets the maximum number of children
    [CommandId.GET_MAX_CHILDREN]: {
        request: [],
        response: [...commonResponse, {name: 'children', type: DataType.UINT8}],
    },

    // ------------------------------------------
    // Application Framework
    // ------------------------------------------

    // Add or update Simple descriptor for a specified endpoint
    [CommandId.AF_SET_SIMPLE_DESC]: {
        request: [
            {name: 'endpoint', type: DataType.UINT8},
            {name: 'profileID', type: DataType.UINT16},
            {name: 'deviceID', type: DataType.UINT16},
            {name: 'version', type: DataType.UINT8},
            {name: 'inputClusterCount', type: DataType.UINT8},
            {name: 'outputClusterCount', type: DataType.UINT8},
            {
                name: 'inputClusters',
                type: BuffaloZclDataType.LIST_UINT16,
                options: (payload, options) => (options.length = payload.inputClusterCount),
            },
            {
                name: 'outputClusters',
                type: BuffaloZclDataType.LIST_UINT16,
                options: (payload, options) => (options.length = payload.outputClusterCount),
            },
        ],
        response: [...commonResponse],
    },
    // Delete Simple Descriptor for a specified endpoint
    [CommandId.AF_DEL_SIMPLE_DESC]: {
        request: [{name: 'endpoint', type: DataType.UINT8}],
        response: [...commonResponse],
    },
    // Set Node Descriptor
    [CommandId.AF_SET_NODE_DESC]: {
        request: [
            {name: 'type', type: DataType.UINT8, typed: DeviceType},
            {name: 'macCapabilities', type: DataType.UINT8},
            {name: 'manufacturerCode', type: DataType.UINT16},
        ],
        response: [...commonResponse],
    },
    // Set power descriptor for the device
    [CommandId.AF_SET_POWER_DESC]: {
        request: [
            {name: 'powerMode', type: DataType.UINT8},
            {name: 'powerSources', type: DataType.UINT8},
            {name: 'powerSource', type: DataType.UINT8},
            {name: 'powerSourceLevel', type: DataType.UINT8},
        ],
        response: [...commonResponse],
    },

    // ------------------------------------------
    // Zigbee Device Object
    // ------------------------------------------

    // Request for a remote device NWK address
    // [CommandId.ZDO_NWK_ADDR_REQ]: {
    //     request: [
    //         {name: 'nwk', type: DataType.UINT16},
    //         {name: 'ieee', type: DataType.IEEE_ADDR},
    //         {name: 'type', type: DataType.UINT8},
    //         {name: 'startIndex', type: DataType.UINT8},
    //     ],
    //     response: [
    //         ...commonResponse,
    //         {name: 'ieee', type: DataType.IEEE_ADDR},
    //         {name: 'nwk', type: DataType.UINT16},
    //         {name: 'num', type: DataType.UINT8, condition: (payload, buffalo) => buffalo && buffalo.isMore()},
    //         {name: 'startIndex', type: DataType.UINT8, condition: (payload, buffalo) => buffalo && buffalo.isMore()},
    //         {name: 'nwks', type: BuffaloZclDataType.LIST_UINT16, options: (payload, options) => (options.length = payload.num)},
    //     ],
    // },
    // Request for a remote device IEEE address
    // [CommandId.ZDO_IEEE_ADDR_REQ]: {
    //     request: [
    //         {name: 'destNwk', type: DataType.UINT16},
    //         {name: 'nwk', type: DataType.UINT16},
    //         {name: 'type', type: DataType.UINT8},
    //         {name: 'startIndex', type: DataType.UINT8},
    //     ],
    //     response: [
    //         ...commonResponse,
    //         {name: 'ieee', type: DataType.IEEE_ADDR},
    //         {name: 'nwk', type: DataType.UINT16},
    //         {name: 'num', type: DataType.UINT8, condition: (payload, buffalo) => buffalo && buffalo.isMore()},
    //         {name: 'startIndex', type: DataType.UINT8, condition: (payload, buffalo) => buffalo && buffalo.isMore()},
    //         {name: 'nwks', type: BuffaloZclDataType.LIST_UINT16, options: (payload, options) => (options.length = payload.num)},
    //     ],
    // },
    // Get the Power Descriptor from a remote device
    // [CommandId.ZDO_POWER_DESC_REQ]: {
    //     request: [{name: 'nwk', type: DataType.UINT16}],
    //     response: [...commonResponse, {name: 'powerDescriptor', type: DataType.UINT16}, {name: 'nwk', type: DataType.UINT16}],
    // },
    // Get the Node Descriptor from a remote device
    // [CommandId.ZDO_NODE_DESC_REQ]: {
    //     request: [{name: 'nwk', type: DataType.UINT16}],
    //     response: [
    //         ...commonResponse,
    //         {name: 'flags', type: DataType.UINT16},
    //         {name: 'macCapabilities', type: DataType.UINT8},
    //         {name: 'manufacturerCode', type: DataType.UINT16},
    //         {name: 'bufferSize', type: DataType.UINT8},
    //         {name: 'incomingSize', type: DataType.UINT16},
    //         {name: 'serverMask', type: DataType.UINT16},
    //         {name: 'outgoingSize', type: DataType.UINT16},
    //         {name: 'descriptorCapabilities', type: DataType.UINT8},
    //         {name: 'nwk', type: DataType.UINT16},
    //     ],
    // },
    // Get the Simple Descriptor from a remote device
    // [CommandId.ZDO_SIMPLE_DESC_REQ]: {
    //     request: [
    //         {name: 'nwk', type: DataType.UINT16},
    //         {name: 'endpoint', type: DataType.UINT8},
    //     ],
    //     response: [
    //         ...commonResponse,
    //         {name: 'endpoint', type: DataType.UINT8},
    //         {name: 'profileID', type: DataType.UINT16},
    //         {name: 'deviceID', type: DataType.UINT16},
    //         {name: 'version', type: DataType.UINT8},
    //         {name: 'inputClusterCount', type: DataType.UINT8},
    //         {name: 'outputClusterCount', type: DataType.UINT8},
    //         {
    //             name: 'inputClusters',
    //             type: BuffaloZclDataType.LIST_UINT16,
    //             options: (payload, options) => (options.length = payload.inputClusterCount),
    //         },
    //         {
    //             name: 'outputClusters',
    //             type: BuffaloZclDataType.LIST_UINT16,
    //             options: (payload, options) => (options.length = payload.outputClusterCount),
    //         },
    //         {name: 'nwk', type: DataType.UINT16},
    //     ],
    // },
    // Get a list of Active Endpoints from a remote device
    // [CommandId.ZDO_ACTIVE_EP_REQ]: {
    //     request: [{name: 'nwk', type: DataType.UINT16}],
    //     response: [
    //         ...commonResponse,
    //         {name: 'len', type: DataType.UINT8},
    //         {name: 'endpoints', type: BuffaloZclDataType.LIST_UINT8, options: (payload, options) => (options.length = payload.len)},
    //         {name: 'nwk', type: DataType.UINT16},
    //     ],
    // },
    // Send Match Descriptor request to a remote device
    // [CommandId.ZDO_MATCH_DESC_REQ]: {
    //     request: [
    //         {name: 'nwk', type: DataType.UINT16},
    //         {name: 'profileID', type: DataType.UINT16},
    //         {name: 'inputClusterCount', type: DataType.UINT8},
    //         {name: 'outputClusterCount', type: DataType.UINT8},
    //         {
    //             name: 'inputClusters',
    //             type: BuffaloZclDataType.LIST_UINT16,
    //             options: (payload, options) => (options.length = payload.inputClusterCount),
    //         },
    //         {
    //             name: 'outputClusters',
    //             type: BuffaloZclDataType.LIST_UINT16,
    //             options: (payload, options) => (options.length = payload.outputClusterCount),
    //         },
    //     ],
    //     response: [
    //         ...commonResponse,
    //         {name: 'len', type: DataType.UINT8},
    //         {name: 'endpoints', type: BuffaloZclDataType.LIST_UINT8, options: (payload, options) => (options.length = payload.len)},
    //         {name: 'nwk', type: DataType.UINT16},
    //     ],
    // },
    // Send Bind request to a remote device
    // [CommandId.ZDO_BIND_REQ]: {
    //     request: [
    //         {name: 'target', type: DataType.UINT16},
    //         {name: 'srcIeee', type: DataType.IEEE_ADDR},
    //         {name: 'srcEP', type: DataType.UINT8},
    //         {name: 'clusterID', type: DataType.UINT16},
    //         {name: 'addrMode', type: DataType.UINT8},
    //         {name: 'dstIeee', type: DataType.IEEE_ADDR},
    //         {name: 'dstEP', type: DataType.UINT8},
    //     ],
    //     response: [...commonResponse],
    // },
    // Send Unbind request to a remote device
    // [CommandId.ZDO_UNBIND_REQ]: {
    //     request: [
    //         {name: 'target', type: DataType.UINT16},
    //         {name: 'srcIeee', type: DataType.IEEE_ADDR},
    //         {name: 'srcEP', type: DataType.UINT8},
    //         {name: 'clusterID', type: DataType.UINT16},
    //         {name: 'addrMode', type: DataType.UINT8},
    //         {name: 'dstIeee', type: DataType.IEEE_ADDR},
    //         {name: 'dstEP', type: DataType.UINT8},
    //     ],
    //     response: [...commonResponse],
    // },
    // Request that a Remote Device leave the network
    // [CommandId.ZDO_MGMT_LEAVE_REQ]: {
    //     request: [
    //         {name: 'nwk', type: DataType.UINT16},
    //         {name: 'ieee', type: DataType.IEEE_ADDR},
    //         {name: 'flags', type: DataType.UINT8},
    //     ],
    //     response: [...commonResponse],
    // },
    // Request a remote device or devices to allow or disallow association
    // [CommandId.ZDO_PERMIT_JOINING_REQ]: {
    //     request: [
    //         {name: 'nwk', type: DataType.UINT16},
    //         {name: 'duration', type: DataType.UINT8},
    //         {name: 'tcSignificance', type: DataType.UINT8},
    //     ],
    //     response: [...commonResponse],
    // },
    // Device announce indication
    // [CommandId.ZDO_DEV_ANNCE_IND]: {
    //     request: [],
    //     response: [],
    //     indication: [
    //         {name: 'nwk', type: DataType.UINT16},
    //         {name: 'ieee', type: DataType.IEEE_ADDR},
    //         {name: 'macCapabilities', type: DataType.UINT8},
    //     ],
    // },
    // Rejoin to remote network even if joined already. If joined, clear internal data structures prior to joining. That call is useful for rejoin after parent loss.
    [CommandId.ZDO_REJOIN]: {
        request: [
            {name: 'extendedPanID', type: BuffaloZBOSSDataType.EXTENDED_PAN_ID},
            {name: 'len', type: DataType.UINT8},
            {
                name: 'channels',
                type: BuffaloZBOSSDataType.LIST_TYPED,
                typed: [
                    {name: 'page', type: DataType.UINT8},
                    {name: 'mask', type: DataType.UINT32},
                ],
            },
            {name: 'secure', type: DataType.UINT8},
        ],
        response: [...commonResponse, {name: 'flags', type: DataType.UINT8}],
    },
    // Sends a ZDO system server discovery request
    [CommandId.ZDO_SYSTEM_SRV_DISCOVERY_REQ]: {
        request: [{name: 'serverMask', type: DataType.UINT16}],
        response: [...commonResponse],
    },
    // Sends a ZDO Mgmt Bind request to a remote device
    // [CommandId.ZDO_MGMT_BIND_REQ]: {
    //     request: [
    //         {name: 'nwk', type: DataType.UINT16},
    //         {name: 'startIndex', type: DataType.UINT8},
    //     ],
    //     response: [...commonResponse],
    // },
    // Sends a ZDO Mgmt LQI request to a remote device
    // [CommandId.ZDO_MGMT_LQI_REQ]: {
    //     request: [
    //         {name: 'nwk', type: DataType.UINT16},
    //         {name: 'startIndex', type: DataType.UINT8},
    //     ],
    //     response: [
    //         ...commonResponse,
    //         {name: 'entries', type: DataType.UINT8},
    //         {name: 'startIndex', type: DataType.UINT8},
    //         {name: 'len', type: DataType.UINT8},
    //         {
    //             name: 'neighbors',
    //             type: BuffaloZBOSSDataType.LIST_TYPED,
    //             typed: [
    //                 {name: 'extendedPanID', type: BuffaloZBOSSDataType.EXTENDED_PAN_ID},
    //                 {name: 'ieee', type: DataType.IEEE_ADDR},
    //                 {name: 'nwk', type: DataType.UINT16},
    //                 {name: 'relationship', type: DataType.UINT8},
    //                 {name: 'joining', type: DataType.UINT8},
    //                 {name: 'depth', type: DataType.UINT8},
    //                 {name: 'lqi', type: DataType.UINT8},
    //             ],
    //             options: (payload, options) => (options.length = payload.len),
    //         },
    //     ],
    // },
    // Sends a ZDO Mgmt NWK Update Request to a remote device
    // [CommandId.ZDO_MGMT_NWK_UPDATE_REQ]: {
    //     request: [
    //         {name: 'channelMask', type: DataType.UINT32},
    //         {name: 'duration', type: DataType.UINT8},
    //         {name: 'count', type: DataType.UINT8},
    //         {name: 'managerNwk', type: DataType.UINT16},
    //         {name: 'nwk', type: DataType.UINT16},
    //     ],
    //     response: [...commonResponse],
    // },
    // Require statistics (last message LQI\RSSI, counters, etc.) from the ZDO level
    [CommandId.ZDO_GET_STATS]: {
        request: [{name: 'cleanup', type: DataType.UINT8}],
        response: [
            ...commonResponse,
            {name: 'mac_rx_bcast', type: DataType.UINT32},
            {name: 'mac_tx_bcast', type: DataType.UINT32},
            {name: 'mac_rx_ucast', type: DataType.UINT32},
            {name: 'mac_tx_ucast_total_zcl', type: DataType.UINT32},
            {name: 'mac_tx_ucast_failures_zcl', type: DataType.UINT16},
            {name: 'mac_tx_ucast_retries_zcl', type: DataType.UINT16},
            {name: 'mac_tx_ucast_total', type: DataType.UINT16},
            {name: 'mac_tx_ucast_failures', type: DataType.UINT16},
            {name: 'mac_tx_ucast_retries', type: DataType.UINT16},
            {name: 'phy_to_mac_que_lim_reached', type: DataType.UINT16},
            {name: 'mac_validate_drop_cnt', type: DataType.UINT16},
            {name: 'phy_cca_fail_count', type: DataType.UINT16},
            {name: 'period_of_time', type: DataType.UINT8},
            {name: 'last_msg_lqi', type: DataType.UINT8},
            {name: 'last_msg_rssi', type: DataType.UINT8},
            {name: 'number_of_resets', type: DataType.UINT16},
            {name: 'aps_tx_bcast', type: DataType.UINT16},
            {name: 'aps_tx_ucast_success', type: DataType.UINT16},
            {name: 'aps_tx_ucast_retry', type: DataType.UINT16},
            {name: 'aps_tx_ucast_fail', type: DataType.UINT16},
            {name: 'route_disc_initiated', type: DataType.UINT16},
            {name: 'nwk_neighbor_added', type: DataType.UINT16},
            {name: 'nwk_neighbor_removed', type: DataType.UINT16},
            {name: 'nwk_neighbor_stale', type: DataType.UINT16},
            {name: 'join_indication', type: DataType.UINT16},
            {name: 'childs_removed', type: DataType.UINT16},
            {name: 'nwk_fc_failure', type: DataType.UINT16},
            {name: 'aps_fc_failure', type: DataType.UINT16},
            {name: 'aps_unauthorized_key', type: DataType.UINT16},
            {name: 'nwk_decrypt_failure', type: DataType.UINT16},
            {name: 'aps_decrypt_failure', type: DataType.UINT16},
            {name: 'packet_buffer_allocate_failures', type: DataType.UINT16},
            {name: 'average_mac_retry_per_aps_message_sent', type: DataType.UINT16},
            {name: 'nwk_retry_overflow', type: DataType.UINT16},
            {name: 'nwk_bcast_table_full', type: DataType.UINT16},
            {name: 'status', type: DataType.UINT8},
        ],
    },
    // Indicates some device in the network was authorized (e.g. received TCLK)
    [CommandId.ZDO_DEV_AUTHORIZED_IND]: {
        request: [],
        response: [],
        indication: [
            {name: 'ieee', type: DataType.IEEE_ADDR},
            {name: 'nwk', type: DataType.UINT16},
            {name: 'authType', type: DataType.UINT8, typed: DeviceAuthorizedType},
            {
                name: 'authStatus',
                type: DataType.UINT8,
                /* typed: DeviceAuthorizedLegacyStatus | DeviceAuthorizedR21TCLKStatus | DeviceAuthorizedSECBKEStatus */
            },
        ],
    },
    // Indicates some device joined the network
    [CommandId.ZDO_DEV_UPDATE_IND]: {
        request: [],
        response: [],
        indication: [
            {name: 'ieee', type: DataType.IEEE_ADDR},
            {name: 'nwk', type: DataType.UINT16},
            {name: 'status', type: DataType.UINT8, typed: DeviceUpdateStatus},
            // not in dsr-corporation spec
            // {name: 'tcAction', type: DataType.UINT8, typed: DeviceUpdateTCAction},
            // {name: 'parentNwk', type: DataType.UINT16},
        ],
    },
    // Sets manufacturer code field in the node descriptor
    [CommandId.ZDO_SET_NODE_DESC_MANUF_CODE]: {
        request: [{name: 'manufacturerCode', type: DataType.UINT16}],
        response: [...commonResponse],
    },

    // ------------------------------------------
    // Application Support Sub-layer
    // ------------------------------------------

    // APSDE-DATA.request
    [CommandId.APSDE_DATA_REQ]: {
        request: [
            {name: 'paramLength', type: DataType.UINT8},
            {name: 'dataLength', type: DataType.UINT16},
            {name: 'addr', type: DataType.IEEE_ADDR},
            {name: 'profileID', type: DataType.UINT16},
            {name: 'clusterID', type: DataType.UINT16},
            {name: 'dstEndpoint', type: DataType.UINT8, condition: (payload) => [2, 3].includes(payload.dstAddrMode)},
            //{name: 'dstEndpoint', type: DataType.UINT8},
            {name: 'srcEndpoint', type: DataType.UINT8},
            {name: 'radius', type: DataType.UINT8},
            {name: 'dstAddrMode', type: DataType.UINT8},
            {name: 'txOptions', type: DataType.UINT8},
            {name: 'useAlias', type: DataType.UINT8},
            //{name: 'aliasAddr', type: DataType.UINT16, condition: (payload) => payload.useAlias !== 0},
            {name: 'aliasAddr', type: DataType.UINT16},
            {name: 'aliasSequence', type: DataType.UINT8},
            {name: 'data', type: BuffaloZclDataType.LIST_UINT8, options: (payload, options) => (options.length = payload.dataLength)},
        ],
        response: [
            ...commonResponse,
            {name: 'ieee', type: DataType.IEEE_ADDR},
            {name: 'dstEndpoint', type: DataType.UINT8, condition: (payload) => [2, 3].includes(payload.dstAddrMode)},
            {name: 'srcEndpoint', type: DataType.UINT8},
            {name: 'txTime', type: DataType.UINT32},
            {name: 'dstAddrMode', type: DataType.UINT8},
        ],
    },
    // APSME-BIND.Request
    [CommandId.APSME_BIND]: {
        request: [
            {name: 'srcIeee', type: DataType.IEEE_ADDR},
            {name: 'srcEndpoint', type: DataType.UINT8},
            {name: 'clusterID', type: DataType.UINT16},
            {name: 'dstAddrMode', type: DataType.UINT8},
            {name: 'dstIeee', type: DataType.IEEE_ADDR},
            {name: 'dstEndpoint', type: DataType.UINT8},
        ],
        response: [...commonResponse, {name: 'index', type: DataType.UINT8}],
    },
    // APSME-UNBIND.request
    [CommandId.APSME_UNBIND]: {
        request: [
            {name: 'srcIeee', type: DataType.IEEE_ADDR},
            {name: 'srcEndpoint', type: DataType.UINT8},
            {name: 'clusterID', type: DataType.UINT16},
            {name: 'dstAddrMode', type: DataType.UINT8},
            {name: 'dstIeee', type: DataType.IEEE_ADDR},
            {name: 'dstEndpoint', type: DataType.UINT8},
        ],
        response: [...commonResponse, {name: 'index', type: DataType.UINT8}],
    },
    // APSME-ADD-GROUP.request
    [CommandId.APSME_ADD_GROUP]: {
        request: [
            {name: 'nwk', type: DataType.UINT16},
            {name: 'endpoint', type: DataType.UINT8},
        ],
        response: [...commonResponse],
    },
    // APSME-REMOVE-GROUP.request
    [CommandId.APSME_RM_GROUP]: {
        request: [
            {name: 'nwk', type: DataType.UINT16},
            {name: 'endpoint', type: DataType.UINT8},
        ],
        response: [...commonResponse],
    },
    // APSDE-DATA.indication
    [CommandId.APSDE_DATA_IND]: {
        request: [],
        response: [],
        indication: [
            {name: 'paramLength', type: DataType.UINT8},
            {name: 'dataLength', type: DataType.UINT16},
            {name: 'apsFC', type: DataType.UINT8},
            {name: 'srcNwk', type: DataType.UINT16},
            {name: 'dstNwk', type: DataType.UINT16},
            {name: 'grpNwk', type: DataType.UINT16},
            {name: 'dstEndpoint', type: DataType.UINT8},
            {name: 'srcEndpoint', type: DataType.UINT8},
            {name: 'clusterID', type: DataType.UINT16},
            {name: 'profileID', type: DataType.UINT16},
            {name: 'apsCounter', type: DataType.UINT8},
            {name: 'srcMAC', type: DataType.UINT16},
            {name: 'dstMAC', type: DataType.UINT16},
            {name: 'lqi', type: DataType.UINT8},
            {name: 'rssi', type: DataType.UINT8},
            {name: 'apsKey', type: DataType.UINT8},
            {name: 'data', type: BuffaloZclDataType.BUFFER, options: (payload, options) => (options.length = payload.dataLength)},
        ],
    },
    // APSME-REMOVE-ALL-GROUPS.request
    [CommandId.APSME_RM_ALL_GROUPS]: {
        request: [{name: 'endpoint', type: DataType.UINT8}],
        response: [...commonResponse],
    },
    // Checks if there are any bindings for specified endpoint and cluster
    [CommandId.APS_CHECK_BINDING]: {
        request: [
            {name: 'endpoint', type: DataType.UINT8},
            {name: 'clusterID', type: DataType.UINT16},
        ],
        response: [...commonResponse, {name: 'exists', type: DataType.UINT8}],
    },
    // Gets the APS Group Table
    [CommandId.APS_GET_GROUP_TABLE]: {
        request: [],
        response: [
            ...commonResponse,
            {name: 'length', type: DataType.UINT16},
            {name: 'groups', type: BuffaloZclDataType.LIST_UINT16, options: (payload, options) => (options.length = payload.length)},
        ],
    },
    // Removes all bindings
    [CommandId.APSME_UNBIND_ALL]: {
        request: [],
        response: [...commonResponse],
    },

    // ------------------------------------------
    // NWK Management API
    // ------------------------------------------

    // NLME-NETWORK-FORMATION.request
    [CommandId.NWK_FORMATION]: {
        request: [
            {name: 'len', type: DataType.UINT8},
            {
                name: 'channels',
                type: BuffaloZBOSSDataType.LIST_TYPED,
                typed: [
                    {name: 'page', type: DataType.UINT8},
                    {name: 'mask', type: DataType.UINT32},
                ],
            },
            {name: 'duration', type: DataType.UINT8},
            {name: 'distribFlag', type: DataType.UINT8},
            {name: 'distribNwk', type: DataType.UINT16},
            {name: 'extendedPanID', type: BuffaloZBOSSDataType.EXTENDED_PAN_ID},
        ],
        response: [...commonResponse, {name: 'nwk', type: DataType.UINT16}],
    },
    // NLME-NETWORK-DISCOVERY.request
    [CommandId.NWK_DISCOVERY]: {
        request: [
            {name: 'len', type: DataType.UINT8},
            {
                name: 'channels',
                type: BuffaloZBOSSDataType.LIST_TYPED,
                typed: [
                    {name: 'page', type: DataType.UINT8},
                    {name: 'mask', type: DataType.UINT32},
                ],
            },
            {name: 'duration', type: DataType.UINT8},
            {name: 'macCapabilities', type: DataType.UINT8},
            {name: 'security', type: DataType.UINT8},
        ],
        response: [
            ...commonResponse,
            {name: 'extendedPanID', type: BuffaloZBOSSDataType.EXTENDED_PAN_ID},
            {name: 'panID', type: DataType.UINT16},
            {name: 'nwkUpdateID', type: DataType.UINT8},
            {name: 'page', type: DataType.UINT8},
            {name: 'channel', type: DataType.UINT8},
            {name: 'flags', type: DataType.UINT8},
            {name: 'lqi', type: DataType.UINT8},
            {name: 'rssi', type: DataType.INT8},
        ],
    },
    // Join network, do basic post-join actions
    [CommandId.NWK_NLME_JOIN]: {
        request: [
            {name: 'extendedPanID', type: BuffaloZBOSSDataType.EXTENDED_PAN_ID},
            {name: 'rejoin', type: DataType.UINT8},
            {name: 'len', type: DataType.UINT8},
            {
                name: 'channels',
                type: BuffaloZBOSSDataType.LIST_TYPED,
                typed: [
                    {name: 'page', type: DataType.UINT8},
                    {name: 'mask', type: DataType.UINT32},
                ],
            },
        ],
        response: [
            ...commonResponse,
            {name: 'nwk', type: DataType.UINT16},
            {name: 'extendedPanID', type: BuffaloZBOSSDataType.EXTENDED_PAN_ID},
            {name: 'page', type: DataType.UINT8},
            {name: 'channel', type: DataType.UINT8},
            {name: 'beacon', type: DataType.UINT8},
            {name: 'macInterface', type: DataType.UINT8},
        ],
    },
    // NLME-PERMIT-JOINING.request
    [CommandId.NWK_PERMIT_JOINING]: {
        request: [{name: 'duration', type: DataType.UINT8}],
        response: [...commonResponse],
    },
    // Get IEEE address by short address from the local address translation table
    [CommandId.NWK_GET_IEEE_BY_SHORT]: {
        request: [{name: 'nwk', type: DataType.UINT16}],
        response: [...commonResponse, {name: 'ieee', type: DataType.IEEE_ADDR}],
    },
    // Get short address by IEEE address from the local address translation table
    [CommandId.NWK_GET_SHORT_BY_IEEE]: {
        request: [{name: 'ieee', type: DataType.IEEE_ADDR}],
        response: [...commonResponse, {name: 'nwk', type: DataType.UINT16}],
    },
    // Get local neighbor table entry by IEEE address
    [CommandId.NWK_GET_NEIGHBOR_BY_IEEE]: {
        request: [{name: 'ieee', type: DataType.IEEE_ADDR}],
        response: [
            ...commonResponse,
            {name: 'ieee', type: DataType.IEEE_ADDR},
            {name: 'nwk', type: DataType.UINT16},
            {name: 'role', type: DataType.UINT8},
            {name: 'rxOnWhenIdle', type: DataType.UINT8},
            {name: 'edConfig', type: DataType.UINT16},
            {name: 'timeoutCounter', type: DataType.UINT32},
            {name: 'deviceTimeout', type: DataType.UINT32},
            {name: 'relationship', type: DataType.UINT8},
            {name: 'failureCount', type: DataType.UINT8},
            {name: 'lqi', type: DataType.UINT8},
            {name: 'cost', type: DataType.UINT8},
            {name: 'age', type: DataType.UINT8},
            {name: 'keepalive', type: DataType.UINT8},
            {name: 'macInterface', type: DataType.UINT8},
        ],
    },
    // Indicates that network rejoining procedure has completed
    [CommandId.NWK_REJOINED_IND]: {
        request: [],
        response: [],
        indication: [
            {name: 'nwk', type: DataType.UINT16},
            {name: 'extendedPanID', type: BuffaloZBOSSDataType.EXTENDED_PAN_ID},
            {name: 'page', type: DataType.UINT8},
            {name: 'channel', type: DataType.UINT8},
            {name: 'beacon', type: DataType.UINT8},
            {name: 'macInterface', type: DataType.UINT8},
        ],
    },
    // Indicates that network rejoining procedure has failed
    [CommandId.NWK_REJOIN_FAILED_IND]: {
        request: [],
        response: [],
        indication: [...commonResponse],
    },
    // Network Leave indication
    [CommandId.NWK_LEAVE_IND]: {
        request: [],
        response: [],
        indication: [
            {name: 'ieee', type: DataType.IEEE_ADDR},
            {name: 'rejoin', type: DataType.UINT8},
        ],
    },
    // Set Fast Poll Interval PIM attribute
    [CommandId.PIM_SET_FAST_POLL_INTERVAL]: {
        request: [{name: 'interval', type: DataType.UINT16}],
        response: [...commonResponse],
    },
    // Set Long Poll Interval PIM attribute
    [CommandId.PIM_SET_LONG_POLL_INTERVAL]: {
        request: [{name: 'interval', type: DataType.UINT32}],
        response: [...commonResponse],
    },
    // Start poll with the Fast Poll Interval specified by PIM attribute
    [CommandId.PIM_START_FAST_POLL]: {
        request: [],
        response: [...commonResponse],
    },
    // Start Long Poll
    [CommandId.PIM_START_LONG_POLL]: {
        request: [],
        response: [...commonResponse],
    },
    // Start poll with the Long Poll Interval specified by PIM attribute
    [CommandId.PIM_START_POLL]: {
        request: [],
        response: [...commonResponse],
    },
    // Stop fast poll and restart it with the Long Poll Interval
    [CommandId.PIM_STOP_FAST_POLL]: {
        request: [],
        response: [...commonResponse, {name: 'result', type: DataType.UINT8}],
    },
    // Stop automatic ZBOSS poll
    [CommandId.PIM_STOP_POLL]: {
        request: [],
        response: [...commonResponse],
    },
    // Enable turbo poll for a given amount of time.
    [CommandId.PIM_ENABLE_TURBO_POLL]: {
        request: [{name: 'time', type: DataType.UINT32}],
        response: [...commonResponse],
    },
    // Disable turbo poll for a given amount of time.
    [CommandId.PIM_DISABLE_TURBO_POLL]: {
        request: [],
        response: [...commonResponse],
    },
    // Disable turbo poll for a given amount of time.
    [CommandId.NWK_ADDRESS_UPDATE_IND]: {
        request: [],
        response: [],
        indication: [{name: 'nwk', type: DataType.UINT16}],
    },
    // Start without forming a new network.
    [CommandId.NWK_START_WITHOUT_FORMATION]: {
        request: [],
        response: [...commonResponse],
    },
    // NWK NLME start router request
    [CommandId.NWK_NLME_ROUTER_START]: {
        request: [
            {name: 'beaconOrder', type: DataType.UINT8},
            {name: 'superframeOrder', type: DataType.UINT8},
            {name: 'batteryLife', type: DataType.UINT8},
        ],
        response: [...commonResponse],
    },
    // Indicates that joined device has no parent
    [CommandId.PARENT_LOST_IND]: {
        request: [],
        response: [],
        indication: [],
    },
    // PIM_START_TURBO_POLL_PACKETS
    // PIM_START_TURBO_POLL_CONTINUOUS
    // PIM_TURBO_POLL_CONTINUOUS_LEAVE
    // PIM_TURBO_POLL_PACKETS_LEAVE
    // PIM_PERMIT_TURBO_POLL
    // PIM_SET_FAST_POLL_TIMEOUT
    // PIM_GET_LONG_POLL_INTERVAL
    // PIM_GET_IN_FAST_POLL_FLAG
    // Sets keepalive mode
    [CommandId.SET_KEEPALIVE_MOVE]: {
        request: [{name: 'mode', type: DataType.UINT8}],
        response: [...commonResponse],
    },
    // Starts a concentrator mode
    [CommandId.START_CONCENTRATOR_MODE]: {
        request: [
            {name: 'radius', type: DataType.UINT8},
            {name: 'timeout', type: DataType.UINT32},
        ],
        response: [...commonResponse],
    },
    // Stops a concentrator mode
    [CommandId.STOP_CONCENTRATOR_MODE]: {
        request: [],
        response: [...commonResponse],
    },
    // Enables or disables PAN ID conflict resolution
    [CommandId.NWK_ENABLE_PAN_ID_CONFLICT_RESOLUTION]: {
        request: [{name: 'enable', type: DataType.UINT8}],
        response: [...commonResponse],
    },
    // Enables or disables automatic PAN ID conflict resolution
    [CommandId.NWK_ENABLE_AUTO_PAN_ID_CONFLICT_RESOLUTION]: {
        request: [{name: 'enable', type: DataType.UINT8}],
        response: [...commonResponse],
    },
    // PIM_TURBO_POLL_CANCEL_PACKET

    // ------------------------------------------
    // Security
    // ------------------------------------------

    // Set local device installcode to ZR/ZED
    [CommandId.SECUR_SET_LOCAL_IC]: {
        request: [
            {name: 'installCode', type: BuffaloZclDataType.LIST_UINT8}, //8, 10, 14 or 18Installcode, including trailing 2 bytes of CRC
        ],
        response: [...commonResponse],
    },
    // Set remote device installcode to ZC
    [CommandId.SECUR_ADD_IC]: {
        request: [
            {name: 'ieee', type: DataType.IEEE_ADDR},
            {name: 'installCode', type: BuffaloZclDataType.LIST_UINT8}, //8, 10, 14 or 18Installcode, including trailing 2 bytes of CRC
        ],
        response: [...commonResponse],
    },
    // Delete remote device installcode from ZC
    [CommandId.SECUR_DEL_IC]: {
        request: [{name: 'ieee', type: DataType.IEEE_ADDR}],
        response: [...commonResponse],
    },
    // Get local device Installcode
    [CommandId.SECUR_GET_LOCAL_IC]: {
        request: [],
        response: [
            ...commonResponse,
            {name: 'installCode', type: BuffaloZclDataType.LIST_UINT8}, //8, 10, 14 or 18Installcode, including trailing 2 bytes of CRC
        ],
    },
    // TCLK Indication
    [CommandId.SECUR_TCLK_IND]: {
        request: [],
        response: [],
        indication: [
            {name: 'ieee', type: DataType.IEEE_ADDR},
            {name: 'keyType', type: DataType.UINT8},
        ],
    },
    // TCLK Exchange Indication Failed
    [CommandId.SECUR_TCLK_EXCHANGE_FAILED_IND]: {
        request: [],
        response: [],
        indication: [...commonResponse],
    },
    // Initiates a key switch procedure
    [CommandId.SECUR_NWK_INITIATE_KEY_SWITCH_PROCEDURE]: {
        request: [],
        response: [...commonResponse],
    },
    // Gets the IC list
    [CommandId.SECUR_GET_IC_LIST]: {
        request: [{name: 'startIndex', type: DataType.UINT8}],
        response: [
            ...commonResponse,
            {name: 'size', type: DataType.UINT8},
            {name: 'startIndex', type: DataType.UINT8},
            {name: 'count', type: DataType.UINT8},
            {
                name: 'table',
                type: BuffaloZBOSSDataType.LIST_TYPED,
                typed: [
                    {name: 'ieee', type: DataType.IEEE_ADDR},
                    {name: 'type', type: DataType.UINT8},
                    {name: 'installCode', type: BuffaloZclDataType.LIST_UINT8}, //8, 10, 14 or 18Installcode, including trailing 2 bytes of CRC
                ],
            },
        ],
    },
    // Get an IC table entry by index
    [CommandId.SECUR_GET_IC_BY_IDX]: {
        request: [{name: 'index', type: DataType.UINT8}],
        response: [
            ...commonResponse,
            {name: 'ieee', type: DataType.IEEE_ADDR},
            {name: 'type', type: DataType.UINT8},
            {name: 'installCode', type: BuffaloZclDataType.LIST_UINT8}, //8, 10, 14 or 18Installcode, including trailing 2 bytes of CRC
        ],
    },
    // Removes all IC
    [CommandId.SECUR_REMOVE_ALL_IC]: {
        request: [],
        response: [...commonResponse],
    },

    ///////////////////
    [CommandId.UNKNOWN_1]: {
        request: [],
        response: [...commonResponse],
        indication: [{name: 'data', type: DataType.UINT8}],
    },
};
