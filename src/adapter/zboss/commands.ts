import {CommandId, Status, NetworkState, DeviceType, ResetOptions, StatusCategory, StatusCodeGeneric, StatusCodeAPS, StatusCodeCBKE, BuffaloZBOSSDataType, ResetSource, PolicyType, DeviceUpdateStatus} from "./enums";
import {BuffaloZclDataType, DataType, StructuredIndicatorType} from '../../zspec/zcl/definition/enums';

/* eslint-disable-next-line @typescript-eslint/no-explicit-any*/
// export interface ParamsDesc {[s: string]: any};
export interface ParamsDesc {
    name: string,
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any*/
    type: DataType | BuffaloZclDataType | BuffaloZBOSSDataType,
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any*/
    condition?: (payload: any, buffalo: any, options: any) => boolean,
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any*/
    typed?: any
};

interface ZBOSSFrameDesc {
    request: ParamsDesc[],
    response: ParamsDesc[],
    indication?: ParamsDesc[],
}

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
        request: [
            {name: 'options', type: DataType.UINT8, typed: ResetOptions},
        ],
        response: [
            ...commonResponse,
        ],
    },
    // Requests current Zigbee role of the local device
    [CommandId.GET_ZIGBEE_ROLE]: {
        request: [
        ],
        response: [
            ...commonResponse,
            {name: 'role', type: DataType.UINT8, typed: DeviceType},
        ],
    },
    // Set Zigbee role of the local device
    [CommandId.SET_ZIGBEE_ROLE]: {
        request: [
            {name: 'role', type: DataType.UINT8, typed: DeviceType},
        ],
        response: [
            ...commonResponse,
        ],
    },
    // Get Zigbee channels page and mask of the local device
    [CommandId.GET_ZIGBEE_CHANNEL_MASK]: {
        request: [
        ],
        response: [
            ...commonResponse,
            {name: 'len', type: DataType.UINT8},
            {name: 'channels', type: BuffaloZBOSSDataType.LIST_TYPED, typed: [
                {name: 'page', type: DataType.UINT8},
                {name: 'channel', type: DataType.UINT8},
            ]},
        ],
    },
    // Requests current short PAN ID
    [CommandId.GET_PAN_ID]: {
        request: [
        ],
        response: [
            ...commonResponse,
            {name: 'panID', type: DataType.UINT16},
        ],
    },
    // Set short PAN ID
    [CommandId.SET_PAN_ID]: {
        request: [
            {name: 'panID', type: DataType.UINT16},
        ],
        response: [
            ...commonResponse,
        ],
    },
    // Requests local IEEE address
    [CommandId.GET_LOCAL_IEEE_ADDR]: {
        request: [
            {name: 'mac', type: DataType.UINT8},
        ],
        response: [
            ...commonResponse,
            {name: 'mac', type: DataType.UINT8},
            {name: 'ieee', type: DataType.IEEE_ADDR},
        ],
    },
    // Set local IEEE address
    [CommandId.SET_LOCAL_IEEE_ADDR]: {
        request: [
            {name: 'mac', type: DataType.UINT8},
            {name: 'ieee', type: DataType.IEEE_ADDR},
        ],
        response: [
            ...commonResponse,
        ],
    },
    // Get Transmit Power
    [CommandId.GET_TX_POWER]: {
        request: [],
        response: [
            ...commonResponse,
            {name: 'txPower', type: DataType.UINT8},
        ],
        
    },
    // Set Transmit Power
    [CommandId.SET_TX_POWER]: {
        request: [
            {name: 'txPower', type: DataType.UINT8},
        ],
        response: [
            ...commonResponse,
            {name: 'txPower', type: DataType.UINT8},
        ],
    },
    // Requests RxOnWhenIdle PIB attribute
    [CommandId.GET_RX_ON_WHEN_IDLE]: {
        request: [
        ],
        response: [
            ...commonResponse,
            {name: 'rxOn', type: DataType.UINT8},
        ],
    },
    // Sets Rx On When Idle PIB attribute
    [CommandId.SET_RX_ON_WHEN_IDLE]: {
        request: [
            {name: 'rxOn', type: DataType.UINT8},
        ],
        response: [
            ...commonResponse,
        ],
    },
    // Requests current join status of the device
    [CommandId.GET_JOINED]: {
        request: [
        ],
        response: [
            ...commonResponse,
            {name: 'joined', type: DataType.UINT8},
        ],
    },
    // Requests current authentication status of the device
    [CommandId.GET_AUTHENTICATED]: {
        request: [
        ],
        response: [
            ...commonResponse,
            {name: 'authenticated', type: DataType.UINT8},
        ],
    },
    // Requests current End Device timeout
    [CommandId.GET_ED_TIMEOUT]: {
        request: [
        ],
        response: [
            ...commonResponse,
            {name: 'timeout', type: DataType.UINT8},
        ],
    },
    // Sets End Device timeout
    [CommandId.SET_ED_TIMEOUT]: {
        request: [
            {name: 'timeout', type: DataType.UINT8},
        ],
        response: [
            ...commonResponse,
        ],
    },
    // Set NWK Key
    [CommandId.SET_NWK_KEY]: {
        request: [
            {name: 'nwkKey', type: DataType.SEC_KEY},
            {name: 'index', type: DataType.UINT8},
        ],
        response: [
            ...commonResponse,
        ],
    },
    // Get list of NWK keys
    [CommandId.GET_NWK_KEYS]: {
        request: [
        ],
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
        request: [
            {name: 'ieee', type: DataType.IEEE_ADDR},
        ],
        response: [
            ...commonResponse,
            {name: 'apsKey', type: DataType.SEC_KEY},
        ],
    },
    // Get Parent short address
    [CommandId.GET_PARENT_ADDRESS]: {
        request: [
        ],
        response: [
            ...commonResponse,
            {name: 'parent', type: DataType.UINT16},
        ],
    },
    // Get Extended Pan ID
    [CommandId.GET_EXTENDED_PAN_ID]: {
        request: [
        ],
        response: [
            ...commonResponse,
            {name: 'extendedPanID', type: DataType.IEEE_ADDR},
        ],
    },
    // Get Coordinator version
    [CommandId.GET_COORDINATOR_VERSION]: {
        request: [
        ],
        response: [
            ...commonResponse,
            {name: 'version', type: DataType.UINT8},
        ],
    },
    // Get Short Address of the device
    [CommandId.GET_SHORT_ADDRESS]: {
        request: [
        ],
        response: [
            ...commonResponse,
            {name: 'nwk', type: DataType.UINT16},
        ],
    },
    // Get Trust Center IEEE Address
    [CommandId.GET_TRUST_CENTER_ADDRESS]: {
        request: [
        ],
        response: [
            ...commonResponse,
            {name: 'ieee', type: DataType.IEEE_ADDR},
        ],
    },
    // Device Reset Indication with reset source
    [CommandId.NCP_RESET_IND]: {
        request: [],
        response: [
            ...commonResponse,
        ],
        indication: [
            {name: 'source', type: DataType.UINT8, typed: ResetSource},
        ],
    },
    // Writes NVRAM datasets
    [CommandId.NVRAM_WRITE]: {
        request: [
            {name: 'len', type: DataType.UINT8},
            {name: 'data', type: BuffaloZclDataType.LIST_UINT8, condition: (payload, buffalo, options) => {options.length = payload.len; return true;}},
        ],
        response: [
            ...commonResponse,
        ],
    },
    // Reads an NVRAM dataset
    [CommandId.NVRAM_READ]: {
        request: [
            {name: 'type', type: DataType.UINT8},
        ],
        response: [
            ...commonResponse,
            {name: 'nvVersion', type: DataType.UINT16},
            {name: 'type', type: DataType.UINT16},
            {name: 'version', type: DataType.UINT16},
            {name: 'len', type: DataType.UINT16},
            {name: 'data', type: BuffaloZclDataType.LIST_UINT8, condition: (payload, buffalo, options) => {options.length = payload.len; return true;}},
        ],
    },
    // Erases all datasets in NVRAM
    [CommandId.NVRAM_ERASE]: {
        request: [
        ],
        response: [
            ...commonResponse,
        ],
    },
    // Erases all datasets in NVRAM except ZB_NVRAM_RESERVED, ZB_IB_COUNTERS and application datasets
    [CommandId.NVRAM_CLEAR]: {
        request: [
        ],
        response: [
            ...commonResponse,
        ],
    },
    // Sets TC Policy
    [CommandId.SET_TC_POLICY]: {
        request: [
            {name: 'type', type: DataType.UINT16, typed: PolicyType},
            {name: 'value', type: DataType.UINT8},
        ],
        response: [
            ...commonResponse,
        ],
    },
    // Sets an extended PAN ID
    [CommandId.SET_EXTENDED_PAN_ID]: {
        request: [
            {name: 'extendedPanID', type: DataType.IEEE_ADDR},
        ],
        response: [
            ...commonResponse,
        ],
    },
    // Sets the maximum number of children
    [CommandId.SET_MAX_CHILDREN]: {
        request: [
            {name: 'children', type: DataType.UINT8},
        ],
        response: [
            ...commonResponse,
        ],
    },
    // Gets the maximum number of children
    [CommandId.GET_MAX_CHILDREN]: {
        request: [
        ],
        response: [
            ...commonResponse,
            {name: 'children', type: DataType.UINT8},
        ],
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
            {name: 'inputClusters', type: BuffaloZclDataType.LIST_UINT16, condition: (payload, buffalo, options) => {options.length = payload.inputClusterCount; return true;}},
            {name: 'outputClusters', type: BuffaloZclDataType.LIST_UINT16, condition: (payload, buffalo, options) => {options.length = payload.outputClusterCount; return true;}},
        ],
        response: [
            ...commonResponse,
        ],
    },
    // Delete Simple Descriptor for a specified endpoint
    [CommandId.AF_DEL_SIMPLE_DESC]: {
        request: [
            {name: 'endpoint', type: DataType.UINT8},
        ],
        response: [
            ...commonResponse,
        ],
    },
    // Set Node Descriptor
    [CommandId.AF_SET_NODE_DESC]: {
        request: [
            {name: 'type', type: DataType.UINT8, typed: DeviceType},
            {name: 'macCapabilities', type: DataType.UINT8},
            {name: 'manufacturerCode', type: DataType.UINT16},
        ],
        response: [
            ...commonResponse,
        ],
    },
    // Set power descriptor for the device
    [CommandId.AF_SET_POWER_DESC]: {
        request: [
            {name: 'powerMode', type: DataType.UINT8},
            {name: 'powerSources', type: DataType.UINT8},
            {name: 'powerSource', type: DataType.UINT8},
            {name: 'powerSourceLevel', type: DataType.UINT8},
        ],
        response: [
            ...commonResponse,
        ],
    },

    // ------------------------------------------
    // Zigbee Device Object
    // ------------------------------------------

    // Request for a remote device NWK address
    [CommandId.ZDO_NWK_ADDR_REQ]: {
        request: [
            {name: 'nwk', type: DataType.UINT16},
            {name: 'ieee', type: DataType.IEEE_ADDR},
            {name: 'type', type: DataType.UINT8},
            {name: 'startIndex', type: DataType.UINT8},
        ],
        response: [
            ...commonResponse,
            {name: 'ieee', type: DataType.IEEE_ADDR},
            {name: 'nwk', type: DataType.UINT16},
            {name: 'num', type: DataType.UINT8, condition: (payload, buffalo, options) => buffalo && buffalo.isMore()},
            {name: 'startIndex', type: DataType.UINT8, condition: (payload, buffalo, options) => buffalo && buffalo.isMore()},
            {name: 'nwks', type: BuffaloZclDataType.LIST_UINT16, condition: (payload, buffalo, options) => {options.length = payload.num; return payload.num;}},
        ],
    },
    // Request for a remote device IEEE address
    [CommandId.ZDO_IEEE_ADDR_REQ]: {
        request: [
            {name: 'destNwk', type: DataType.UINT16},
            {name: 'nwk', type: DataType.UINT16},
            {name: 'type', type: DataType.UINT8},
            {name: 'startIndex', type: DataType.UINT8},
        ],
        response: [
            ...commonResponse,
            {name: 'ieee', type: DataType.IEEE_ADDR},
            {name: 'nwk', type: DataType.UINT16},
            {name: 'num', type: DataType.UINT8, condition: (payload, buffalo, options) => buffalo && buffalo.isMore()},
            {name: 'startIndex', type: DataType.UINT8, condition: (payload, buffalo, options) => buffalo && buffalo.isMore()},
            {name: 'nwks', type: BuffaloZclDataType.LIST_UINT16, condition: (payload, buffalo, options) => {options.length = payload.num; return payload.num;}},
        ],
    },
    // Get the Power Descriptor from a remote device
    [CommandId.ZDO_POWER_DESC_REQ]: {
        request: [
            {name: 'nwk', type: DataType.UINT16},
        ],
        response: [
            ...commonResponse,
            {name: 'powerDescriptor', type: DataType.UINT16},
            {name: 'nwk', type: DataType.UINT16},
        ],
    },
    // Get the Node Descriptor from a remote device
    [CommandId.ZDO_NODE_DESC_REQ]: {
        request: [
            {name: 'nwk', type: DataType.UINT16},
        ],
        response: [
            ...commonResponse,
            {name: 'flags', type: DataType.UINT16},
            {name: 'macCapabilities', type: DataType.UINT8},
            {name: 'manufacturerCode', type: DataType.UINT16},
            {name: 'bufferSize', type: DataType.UINT8},
            {name: 'incomingSize', type: DataType.UINT16},
            {name: 'serverMask', type: DataType.UINT16},
            {name: 'outgoingSize', type: DataType.UINT16},
            {name: 'descriptorCapabilities', type: DataType.UINT8},
            {name: 'nwk', type: DataType.UINT16},
        ],
    },
    // Get the Simple Descriptor from a remote device
    [CommandId.ZDO_SIMPLE_DESC_REQ]: {
        request: [
            {name: 'nwk', type: DataType.UINT16},
            {name: 'endpoint', type: DataType.UINT8},
        ],
        response: [
            ...commonResponse,
            {name: 'endpoint', type: DataType.UINT8},
            {name: 'profileID', type: DataType.UINT16},
            {name: 'deviceID', type: DataType.UINT16},
            {name: 'version', type: DataType.UINT8},
            {name: 'inputClusterCount', type: DataType.UINT8},
            {name: 'outputClusterCount', type: DataType.UINT8},
            {name: 'inputClusters', type: BuffaloZclDataType.LIST_UINT16, condition: (payload, buffalo, options) => {options.length = payload.inputClusterCount; return true;}},
            {name: 'outputClusters', type: BuffaloZclDataType.LIST_UINT16, condition: (payload, buffalo, options) => {options.length = payload.outputClusterCount; return true;}},
            {name: 'nwk', type: DataType.UINT16},
        ],
    },
    // Get a list of Active Endpoints from a remote device
    [CommandId.ZDO_ACTIVE_EP_REQ]: {
        request: [
            {name: 'nwk', type: DataType.UINT16},
        ],
        response: [
            ...commonResponse,
            {name: 'len', type: DataType.UINT8},
            {name: 'endpoints', type: BuffaloZclDataType.LIST_UINT8, condition: (payload, buffalo, options) => {options.length = payload.len; return true;}},
            {name: 'nwk', type: DataType.UINT16},
        ],
    },
    // Send Match Descriptor request to a remote device
    [CommandId.ZDO_MATCH_DESC_REQ]: {
        request: [
            {name: 'nwk', type: DataType.UINT16},
            {name: 'profileID', type: DataType.UINT16},
            {name: 'inputClusterCount', type: DataType.UINT8},
            {name: 'outputClusterCount', type: DataType.UINT8},
            {name: 'inputClusters', type: BuffaloZclDataType.LIST_UINT16, condition: (payload, buffalo, options) => {options.length = payload.inputClusterCount; return true;}},
            {name: 'outputClusters', type: BuffaloZclDataType.LIST_UINT16, condition: (payload, buffalo, options) => {options.length = payload.outputClusterCount; return true;}},
        ],
        response: [
            ...commonResponse,
            {name: 'len', type: DataType.UINT8},
            {name: 'endpoints', type: BuffaloZclDataType.LIST_UINT8, condition: (payload, buffalo, options) => {options.length = payload.len; return true;}},
            {name: 'nwk', type: DataType.UINT16},
        ],
    },
    // Send Bind request to a remote device
    [CommandId.ZDO_BIND_REQ]: {
        request: [
            {name: 'target', type: DataType.UINT16},
            {name: 'srcIeee', type: DataType.IEEE_ADDR},
            {name: 'srcEP', type: DataType.UINT8},
            {name: 'clusterID', type: DataType.UINT16},
            {name: 'addrMode', type: DataType.UINT8},
            {name: 'dstIeee', type: DataType.IEEE_ADDR},
            {name: 'dstEP', type: DataType.UINT8},
            
        ],
        response: [
            ...commonResponse,
        ],
    },
    // Send Unbind request to a remote device
    [CommandId.ZDO_UNBIND_REQ]: {
        request: [
            {name: 'target', type: DataType.UINT16},
            {name: 'srcIeee', type: DataType.IEEE_ADDR},
            {name: 'srcEP', type: DataType.UINT8},
            {name: 'clusterID', type: DataType.UINT16},
            {name: 'addrMode', type: DataType.UINT8},
            {name: 'dstIeee', type: DataType.IEEE_ADDR},
            {name: 'dstEP', type: DataType.UINT8},
        ],
        response: [
            ...commonResponse,
        ],
    },
    // Request that a Remote Device leave the network
    [CommandId.ZDO_MGMT_LEAVE_REQ]: {
        request: [
            {name: 'nwk', type: DataType.UINT16},
            {name: 'ieee', type: DataType.IEEE_ADDR},
            {name: 'flags', type: DataType.UINT8},
        ],
        response: [
            ...commonResponse,
        ],
    },
    // Request a remote device or devices to allow or disallow association
    [CommandId.ZDO_PERMIT_JOINING_REQ]: {
        request: [
            {name: 'nwk', type: DataType.UINT16},
            {name: 'duration', type: DataType.UINT8},
            {name: 'tcSignificance', type: DataType.UINT8},
        ],
        response: [
            ...commonResponse,
        ],
    },
    // Device announce indication
    [CommandId.ZDO_DEV_ANNCE_IND]: {
        request: [],
        response: [],
        indication: [
            {name: 'nwk', type: DataType.UINT16},
            {name: 'ieee', type: DataType.IEEE_ADDR},
            {name: 'macCapabilities', type: DataType.UINT8},
        ],
    },
    // Rejoin to remote network even if joined already. If joined, clear internal data structures prior to joining. That call is useful for rejoin after parent loss.
    [CommandId.ZDO_REJOIN]: {
        request: [
            {name: 'extendedPanID', type: DataType.IEEE_ADDR},
            {name: 'len', type: DataType.UINT8},
            {name: 'channels', type: BuffaloZBOSSDataType.LIST_TYPED, typed: [
                {name: 'page', type: DataType.UINT8},
                {name: 'channel', type: DataType.UINT8},
            ]},
            {name: 'secure', type: DataType.UINT8},
        ],
        response: [
            ...commonResponse,
            {name: 'flags', type: DataType.UINT8},
        ],
    },
    // Sends a ZDO system server discovery request
    [CommandId.ZDO_SYSTEM_SRV_DISCOVERY_REQ]: {
        request: [
            {name: 'serverMask', type: DataType.UINT16},
        ],
        response: [
            ...commonResponse,
        ],
    },
    // Sends a ZDO Mgmt Bind request to a remote device
    [CommandId.ZDO_MGMT_BIND_REQ]: {
        request: [
            {name: 'nwk', type: DataType.UINT16},
            {name: 'startIndex', type: DataType.UINT8},
        ],
        response: [
            ...commonResponse,
        ],
    },
    // Sends a ZDO Mgmt LQI request to a remote device
    [CommandId.ZDO_MGMT_LQI_REQ]: {
        request: [
            {name: 'nwk', type: DataType.UINT16},
            {name: 'startIndex', type: DataType.UINT8},
        ],
        response: [
            ...commonResponse,
        ],
    },
    // Sends a ZDO Mgmt NWK Update Request to a remote device
    [CommandId.ZDO_MGMT_NWK_UPDATE_REQ]: {
        request: [
            {name: 'channelMask', type: DataType.UINT32},
            {name: 'duration', type: DataType.UINT8},
            {name: 'count', type: DataType.UINT8},
            {name: 'managerNwk', type: DataType.UINT16},
            {name: 'nwk', type: DataType.UINT16},
        ],
        response: [
            ...commonResponse,
        ],
    },
    // Require statistics (last message LQI\RSSI, counters, etc.) from the ZDO level
    [CommandId.ZDO_GET_STATS]: {
        request: [
            {name: 'cleanup', type: DataType.UINT8},
        ],
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
        request: [
        ],
        response: [
        ],
        indication: [
            {name: 'ieee', type: DataType.IEEE_ADDR},
            {name: 'nwk', type: DataType.UINT16},
            {name: 'authType', type: DataType.UINT8},
            {name: 'authStatus', type: DataType.UINT8},
        ],
    },
    // Indicates some device joined the network
    [CommandId.ZDO_DEV_UPDATE_IND]: {
        request: [
        ],
        response: [
        ],
        indication: [
            {name: 'ieee', type: DataType.IEEE_ADDR},
            {name: 'nwk', type: DataType.UINT16},
            {name: 'status', type: DataType.UINT8, typed: DeviceUpdateStatus},
        ],
    },
    // Sets manufacturer code field in the node descriptor
    [CommandId.ZDO_SET_NODE_DESC_MANUF_CODE]: {
        request: [
            {name: 'manufacturerCode', type: DataType.UINT16},
        ],
        response: [
            ...commonResponse,
        ],
    },
};
