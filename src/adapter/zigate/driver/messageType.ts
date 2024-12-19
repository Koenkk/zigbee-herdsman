import {ZiGateMessageCode} from './constants';
import ParameterType from './parameterType';

export interface ZiGateMessageParameter {
    name: string;
    parameterType: ParameterType;
    options?: object;
}

export interface ZiGateMessageType {
    response: ZiGateMessageParameter[];
}

export const ZiGateMessage: {[k: number]: ZiGateMessageType} = {
    [ZiGateMessageCode.GetTimeServer]: {
        response: [
            {name: 'timestampUTC', parameterType: ParameterType.UINT32}, // <Timestamp UTC: uint32_t> from 2000-01-01 00:00:00
        ],
    },
    [ZiGateMessageCode.DeviceAnnounce]: {
        response: [
            {name: 'shortAddress', parameterType: ParameterType.UINT16},
            {name: 'ieee', parameterType: ParameterType.IEEEADDR},
            {name: 'MACcapability', parameterType: ParameterType.MACCAPABILITY},
            // MAC capability
            // Bit 0 – Alternate PAN Coordinator
            // Bit 1 – Device Type
            // Bit 2 – Power source
            // Bit 3 – Receiver On when Idle
            // Bit 4,5 – Reserved
            // Bit 6 – Security capability
            // Bit 7 – Allocate Address
            // {name: 'rejoin', parameterType: ParameterType.UINT8},
        ],
    },
    [ZiGateMessageCode.Status]: {
        response: [
            {name: 'status', parameterType: ParameterType.UINT8}, // <status:uint8_t>
            // 0 = Success
            // 1 = Incorrect parameters
            // 2 = Unhandled command
            // 3 = Command failed
            // 4 = Busy (Node is carrying out a lengthy operation and is currently unable to handle the incoming command)
            // 5 = Stack already started (no new configuration accepted)
            // 128 – 244 = Failed (ZigBee event codes)
            // Packet Type: The value of the initiating command request.
            {name: 'sequence', parameterType: ParameterType.UINT8}, // <sequence number: uint8_t>
            {name: 'packetType', parameterType: ParameterType.UINT16}, // <Packet Type: uint16_t>

            // from 3.1d
            // {name: 'requestSent', parameterType: ParameterType.MAYBE_UINT8},// <requestSent: uint8_t>  - 1 if a request been sent to
            // // a device(aps ack/nack 8011 should be expected) , 0 otherwise
            // {name: 'seqApsNum', parameterType: ParameterType.MAYBE_UINT8},// <seqApsNum: uint8_t>  - sqn of the APS layer - used to
            // // check sqn sent back in aps ack
            //
            // // from 3.1e
            // {name: 'PDUM_u8GetNpduUse', parameterType: ParameterType.MAYBE_UINT8},
            // {name: 'u8GetApduUse', parameterType: ParameterType.MAYBE_UINT8},
            //
            // // debug 3.1e++
            // {name: 'PDUM_u8GetMaxNpduUse', parameterType: ParameterType.MAYBE_UINT8},
            // {name: 'u8GetMaxApduUse', parameterType: ParameterType.MAYBE_UINT8},
        ],
    },
    [ZiGateMessageCode.PermitJoinStatus]: {
        response: [
            {name: 'status', parameterType: ParameterType.UINT8}, // <status:uint8_t>
        ],
    },
    [ZiGateMessageCode.DataIndication]: {
        response: [
            {name: 'status', parameterType: ParameterType.UINT8}, // <status: uint8_t>
            {name: 'profileID', parameterType: ParameterType.UINT16}, // <Profile ID: uint16_t>
            {name: 'clusterID', parameterType: ParameterType.UINT16}, // <cluster ID: uint16_t>
            {name: 'sourceEndpoint', parameterType: ParameterType.UINT8}, // <source endpoint: uint8_t>
            {name: 'destinationEndpoint', parameterType: ParameterType.UINT8}, // <destination endpoint: uint8_t>
            {name: 'sourceAddressMode', parameterType: ParameterType.UINT8}, // <source address mode: uint8_t>
            {name: 'sourceAddress', parameterType: ParameterType.ADDRESS_WITH_TYPE_DEPENDENCY},
            // <source address: uint16_t or uint64_t>
            {name: 'destinationAddressMode', parameterType: ParameterType.UINT8},
            // <destination address mode: uint8_t>
            {name: 'destinationAddress', parameterType: ParameterType.ADDRESS_WITH_TYPE_DEPENDENCY},
            // <destination address: uint16_t or uint64_t>
            // {name: 'payloadSize', parameterType: ParameterType.UINT8}, // <payload size : uint8_t>
            {name: 'payload', parameterType: ParameterType.BUFFER_RAW}, // <payload : data each element is
            // uint8_t>
        ],
    },
    [ZiGateMessageCode.NodeClusterList]: {
        response: [
            {name: 'sourceEndpoint', parameterType: ParameterType.UINT8}, //<source endpoint: uint8_t t>
            {name: 'profileID', parameterType: ParameterType.UINT16}, // <profile ID: uint16_t>
            {name: 'clusterCount', parameterType: ParameterType.UINT8},
            {name: 'clusterList', parameterType: ParameterType.LIST_UINT16}, // <cluster list: data each entry is uint16_t>
        ],
    },
    [ZiGateMessageCode.NodeAttributeList]: {
        response: [
            {name: 'sourceEndpoint', parameterType: ParameterType.UINT8}, //<source endpoint: uint8_t t>
            {name: 'profileID', parameterType: ParameterType.UINT16}, // <profile ID: uint16_t>
            {name: 'clusterID', parameterType: ParameterType.UINT16}, // <cluster ID: uint16_t>
            {name: 'attributeCount', parameterType: ParameterType.UINT8},
            {name: 'attributeList', parameterType: ParameterType.LIST_UINT16}, //  <attribute list: data each entry is uint16_t>
        ],
    },
    [ZiGateMessageCode.NodeCommandIDList]: {
        response: [
            {name: 'sourceEndpoint', parameterType: ParameterType.UINT8}, //<source endpoint: uint8_t t>
            {name: 'profileID', parameterType: ParameterType.UINT16}, // <profile ID: uint16_t>
            {name: 'clusterID', parameterType: ParameterType.UINT16}, // <cluster ID: uint16_t>
            {name: 'commandIDCount', parameterType: ParameterType.UINT8},
            {name: 'commandIDList', parameterType: ParameterType.LIST_UINT8}, // <command ID list:data each entry is uint8_t>
        ],
    },
    [ZiGateMessageCode.APSDataACK]: {
        response: [
            {name: 'status', parameterType: ParameterType.UINT8}, // <status: uint8_t>
            // {name: 'sourceEndpoint', parameterType: ParameterType.UINT8}, // <source endpoint: uint8_t>
            // {name: 'destinationAddressMode', parameterType: ParameterType.UINT8},
            // // <destination address mode: uint8_t>
            {name: 'destinationAddress', parameterType: ParameterType.UINT16},
            {name: 'destinationEndpoint', parameterType: ParameterType.UINT8}, // <destination endpoint: uint8_t>
            {name: 'clusterID', parameterType: ParameterType.UINT16},
            // // <destination address: uint16_t or uint64_t>
            {name: 'seqNumber', parameterType: ParameterType.UINT8}, // <seq number: uint8_t>
        ],
    },
    [ZiGateMessageCode.APSDataConfirm]: {
        response: [
            {name: 'status', parameterType: ParameterType.UINT8}, // <status: uint8_t>
            {name: 'sourceEndpoint', parameterType: ParameterType.UINT8}, // <source endpoint: uint8_t>
            {name: 'destinationAddressMode', parameterType: ParameterType.UINT8},

            {name: 'destinationAddressMode', parameterType: ParameterType.UINT8},
            // <destination address mode: uint8_t>
            {name: 'destinationAddress', parameterType: ParameterType.ADDRESS_WITH_TYPE_DEPENDENCY},
            // <destination address: uint16_t or uint64_t>
            {name: 'seqNumber', parameterType: ParameterType.UINT8}, // <seq number: uint8_t>
            // from 3.1e
            {name: 'PDUM_u8GetNpduUse', parameterType: ParameterType.MAYBE_UINT8},
            {name: 'u8GetApduUse', parameterType: ParameterType.MAYBE_UINT8},
        ],
    },
    [ZiGateMessageCode.APSDataConfirmFailed]: {
        response: [
            {name: 'status', parameterType: ParameterType.UINT8}, // <status: uint8_t>
            {name: 'sourceEndpoint', parameterType: ParameterType.UINT8}, // <src endpoint: uint8_t>
            {name: 'destinationEndpoint', parameterType: ParameterType.UINT8}, // <dst endpoint: uint8_t>
            {name: 'destinationAddressMode', parameterType: ParameterType.UINT8}, // <dst address mode: uint8_t>
            {name: 'destinationAddress', parameterType: ParameterType.ADDRESS_WITH_TYPE_DEPENDENCY},
            // <destination address: uint64_t>
            {name: 'seqNumber', parameterType: ParameterType.UINT8}, // <seq number: uint8_t>
            // from 3.1e
            {name: 'PDUM_u8GetNpduUse', parameterType: ParameterType.MAYBE_UINT8},
            {name: 'u8GetApduUse', parameterType: ParameterType.MAYBE_UINT8},
        ],
    },
    [ZiGateMessageCode.NetworkState]: {
        response: [
            {name: 'shortAddress', parameterType: ParameterType.UINT16}, // <Short Address: uint16_t>
            {name: 'extendedAddress', parameterType: ParameterType.IEEEADDR}, // <Extended Address: uint64_t>
            {name: 'PANID', parameterType: ParameterType.UINT16}, // <PAN ID: uint16_t>
            {name: 'ExtPANID', parameterType: ParameterType.IEEEADDR}, // <Ext PAN ID: uint64_t>
            {name: 'Channel', parameterType: ParameterType.UINT8}, // <Channel: uint8_t>
        ],
    },
    [ZiGateMessageCode.VersionList]: {
        response: [
            {name: 'major', parameterType: ParameterType.UINT8},
            {name: 'minor', parameterType: ParameterType.UINT8},
            {name: 'revision', parameterType: ParameterType.UINT16},
        ],
    },
    [ZiGateMessageCode.NetworkJoined]: {
        response: [
            {name: 'status', parameterType: ParameterType.UINT8}, // <status: uint8_t>
            // Status:
            // 0 = Joined existing network
            // 1 = Formed new network
            // 128 – 244 = Failed (ZigBee event codes)
            {name: 'shortAddress', parameterType: ParameterType.UINT16}, // <short address: uint16_t>
            // {name: 'extendedAddress', parameterType: ParameterType.IEEEADDR}, // <extended address:uint64_t>
            // {name: 'channel', parameterType: ParameterType.UINT8}, // <channel: uint8_t>
        ],
    },
    [ZiGateMessageCode.LeaveIndication]: {
        response: [
            {name: 'extendedAddress', parameterType: ParameterType.IEEEADDR}, // <extended address: uint64_t>
            {name: 'rejoin', parameterType: ParameterType.UINT8}, // <rejoin status: uint8_t>
        ],
    },
    // [ZiGateMessageCode.ManagementLeaveResponse]: {
    //     response: [
    //         {name: 'sqn', parameterType: ParameterType.UINT8},
    //         {name: 'status', parameterType: ParameterType.UINT8}, // <status: uint8_t>
    //     ],
    // },
    [ZiGateMessageCode.RouterDiscoveryConfirm]: {
        response: [
            {name: 'status', parameterType: ParameterType.UINT8}, // <status: uint8_t>
            // {name: 'nwkStatus', parameterType: ParameterType.UINT8}, // <nwk status: uint8_t>
            // {name: 'dstAddress', parameterType: ParameterType.UINT16}, // <nwk status: uint16_t>
        ],
    },
    // [ZiGateMessageCode.SimpleDescriptorResponse]: {
    //     response: [
    //         {name: 'sourceEndpoint', parameterType: ParameterType.UINT8}, //<source endpoint: uint8_t>
    //         {name: 'profile ID', parameterType: ParameterType.UINT16}, // <profile ID: uint16_t>
    //         {name: 'clusterID', parameterType: ParameterType.UINT16}, // <cluster ID: uint16_t>
    //         {name: 'attributeList', parameterType: ParameterType.LIST_UINT16}, // <attribute list: data each entry is uint16_t>
    //     ],
    // },
    // [ZiGateMessageCode.ManagementLQIResponse]: {
    //     response: [
    //         {name: 'sequence', parameterType: ParameterType.UINT8}, // <Sequence number: uint8_t>
    //         {name: 'status', parameterType: ParameterType.UINT8}, // <status: uint8_t>
    //         {name: 'neighbourTableEntries', parameterType: ParameterType.UINT8}, // <Neighbour Table Entries : uint8_t>
    //         {name: 'neighbourTableListCount', parameterType: ParameterType.UINT8}, // <Neighbour Table List Count : uint8_t>
    //         {name: 'startIndex', parameterType: ParameterType.UINT8}, // <Start Index : uint8_t>
    //         // XXX: broken? automatic ziGateObject parsing will always read below as-is, even if it's not supposed to
    //         // @TODO list TYPE
    //         // <List of Entries elements described below :>
    //         // Note: If Neighbour Table list count is 0, there are no elements in the list.
    //         {name: 'NWKAddress', parameterType: ParameterType.UINT16}, // NWK Address : uint16_t
    //         {name: 'Extended PAN ID', parameterType: ParameterType.IEEEADDR}, // Extended PAN ID : uint64_t
    //         {name: 'IEEE Address', parameterType: ParameterType.IEEEADDR}, // IEEE Address : uint64_t
    //         {name: 'Depth', parameterType: ParameterType.UINT8}, // Depth : uint_t
    //         {name: 'linkQuality', parameterType: ParameterType.UINT8}, // Link Quality : uint8_t
    //         {name: 'bitMap', parameterType: ParameterType.UINT8}, // Bit map of attributes Described below: uint8_t
    //         // bit 0-1 Device Type
    //         // (0-Coordinator 1-Router 2-End Device)
    //         // bit 2-3 Permit Join status
    //         // (1- On 0-Off)
    //         // bit 4-5 Relationship
    //         // (0-Parent 1-Child 2-Sibling)
    //         // bit 6-7 Rx On When Idle status
    //         // (1-On 0-Off)
    //         {name: 'srcAddress', parameterType: ParameterType.UINT16}, // <Src Address : uint16_t> ( only from v3.1a)
    //     ],
    // },
    [ZiGateMessageCode.PDMEvent]: {
        response: [
            {name: 'eventStatus', parameterType: ParameterType.UINT8}, // <event status: uint8_t>
            {name: 'recordID', parameterType: ParameterType.UINT32}, // <record ID: uint32_t>
        ],
    },
    [ZiGateMessageCode.PDMLoaded]: {
        response: [{name: 'length', parameterType: ParameterType.UINT8}],
    },
    [ZiGateMessageCode.RestartNonFactoryNew]: {
        // Non “Factory new” Restart
        response: [
            {name: 'status', parameterType: ParameterType.UINT8}, // <status: uint8_t>
            //	0 – STARTUP
            // 1 – RUNNING
            // 2 – NFN_START
        ],
    },
    [ZiGateMessageCode.RestartFactoryNew]: {
        // “Factory New” Restart
        response: [
            {name: 'status', parameterType: ParameterType.UINT8}, // <status: uint8_t>
            // 0 – STARTUP
            // 2 – NFN_START
            // 6 – RUNNING
            // The node is not yet provisioned.
        ],
    },
    [ZiGateMessageCode.ExtendedStatusCallBack]: {
        response: [
            {name: 'status', parameterType: ParameterType.UINT8},
            // https://github.com/fairecasoimeme/ZiGate/blob/aac14153db332eb5b898cba0f57f5999e5cf11eb/Module%20Radio/Firmware/src/sdk/JN-SW-4170/Components/ZPSNWK/Include/zps_nwk_pub.h#L89
        ],
    },
    [0x8001]: {
        response: [
            {name: 'logLevel', parameterType: ParameterType.LOG_LEVEL},
            {name: 'log', parameterType: ParameterType.STRING},
        ],
    },
    [ZiGateMessageCode.AddGroupResponse]: {
        response: [
            {name: 'status', parameterType: ParameterType.UINT16},
            {name: 'groupAddress', parameterType: ParameterType.UINT16},
        ],
    },
};
