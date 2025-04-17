import {ClusterId as ZdoClusterId} from "../../../zspec/zdo";

export enum AddressMode {
    Bound = 0x00, //Use one or more bound nodes/endpoints, with acknowledgements
    Group = 0x01, //Use a pre-defined group address, with acknowledgements
    Short = 0x02, //Use a 16-bit network address, with acknowledgements
    Ieee = 0x03, //Use a 64-bit IEEE/MAC address, with acknowledgements
    Broadcast = 0x04, //Perform a broadcast
    NoTransmit = 0x05, //Do not transmit
    BoundNoAck = 0x06, //Perform a bound transmission, with no acknowledgements
    ShortNoAck = 0x07, //Perform a transmission using a 16-bit network address, with no acknowledgements
    IeeeNoAck = 0x08, //Perform a transmission using a 64-bit IEEE/MAC address, with no acknowledgements
    BoundNonBlocking = 0x09, //Perform a non-blocking bound transmission, with acknowledgements
    BoundNonBlockingNoAck = 10, //Perform a non-blocking bound transmission, with no acknowledgements
}

export enum DeviceType {
    Coordinator = 0,
    Router = 1,
    LegacyRouter = 2,
}

export enum LogLevel {
    EMERG = 0,
    ALERT = 1,
    "CRIT " = 2,
    ERROR = 3,
    "WARN " = 4,
    "NOT  " = 5,
    "INFO " = 6,
    DEBUG = 7,
}

export enum Status {
    E_SL_MSG_STATUS_SUCCESS = 0,
    E_SL_MSG_STATUS_INCORRECT_PARAMETERS = 1,
    E_SL_MSG_STATUS_UNHANDLED_COMMAND = 2,
    E_SL_MSG_STATUS_BUSY = 3,
    E_SL_MSG_STATUS_STACK_ALREADY_STARTED = 4,
}

export enum ZiGateCommandCode {
    GetNetworkState = 0x0009,
    RawMode = 0x0002,
    SetExtendedPANID = 0x0020,
    SetChannelMask = 0x0021,
    GetVersion = 0x0010,
    Reset = 0x0011,
    ErasePersistentData = 0x0012,
    RemoveDevice = 0x0026,
    RawAPSDataRequest = 0x0530,
    GetTimeServer = 0x0017,
    SetTimeServer = 0x0016,
    PermitJoinStatus = 0x0014,
    GetDevicesList = 0x0015,

    StartNetwork = 0x0024,
    StartNetworkScan = 0x0025,
    SetCertification = 0x0019,

    // ResetFactoryNew = 0x0013,
    OnOff = 0x0092,
    OnOffTimed = 0x0093,
    AttributeDiscovery = 0x0140,
    AttributeRead = 0x0100,
    AttributeWrite = 0x0110,
    DescriptorComplex = 0x0531,

    // zdo
    Bind = 0x0030,
    UnBind = 0x0031,
    NwkAddress = 0x0040,
    IEEEAddress = 0x0041,
    NodeDescriptor = 0x0042,
    SimpleDescriptor = 0x0043,
    PowerDescriptor = 0x0044,
    ActiveEndpoint = 0x0045,
    MatchDescriptor = 0x0046,
    // ManagementLeaveRequest = 0x0047, XXX: some non-standard form of LeaveRequest?
    PermitJoin = 0x0049,
    ManagementNetworkUpdate = 0x004a,
    SystemServerDiscovery = 0x004b,
    LeaveRequest = 0x004c,
    ManagementLQI = 0x004e,
    // ManagementRtg = 0x004?,
    // ManagementBind = 0x004?,

    SetDeviceType = 0x0023,
    LED = 0x0018,
    SetTXpower = 0x0806,
    SetSecurityStateKey = 0x0022,
    AddGroup = 0x0060,
}

export const ZDO_REQ_CLUSTER_ID_TO_ZIGATE_COMMAND_ID: Readonly<Partial<Record<ZdoClusterId, ZiGateCommandCode>>> = {
    [ZdoClusterId.NETWORK_ADDRESS_REQUEST]: ZiGateCommandCode.NwkAddress,
    [ZdoClusterId.IEEE_ADDRESS_REQUEST]: ZiGateCommandCode.IEEEAddress,
    [ZdoClusterId.NODE_DESCRIPTOR_REQUEST]: ZiGateCommandCode.NodeDescriptor,
    [ZdoClusterId.POWER_DESCRIPTOR_REQUEST]: ZiGateCommandCode.PowerDescriptor,
    [ZdoClusterId.SIMPLE_DESCRIPTOR_REQUEST]: ZiGateCommandCode.SimpleDescriptor,
    [ZdoClusterId.MATCH_DESCRIPTORS_REQUEST]: ZiGateCommandCode.MatchDescriptor,
    [ZdoClusterId.ACTIVE_ENDPOINTS_REQUEST]: ZiGateCommandCode.ActiveEndpoint,
    [ZdoClusterId.SYSTEM_SERVER_DISCOVERY_REQUEST]: ZiGateCommandCode.SystemServerDiscovery,
    [ZdoClusterId.BIND_REQUEST]: ZiGateCommandCode.Bind,
    [ZdoClusterId.UNBIND_REQUEST]: ZiGateCommandCode.UnBind,
    [ZdoClusterId.LQI_TABLE_REQUEST]: ZiGateCommandCode.ManagementLQI,
    // [ZdoClusterId.ROUTING_TABLE_REQUEST]: ZiGateCommandCode.ManagementRtg,
    // [ZdoClusterId.BINDING_TABLE_REQUEST]: ZiGateCommandCode.ManagementBind,
    [ZdoClusterId.LEAVE_REQUEST]: ZiGateCommandCode.LeaveRequest,
    [ZdoClusterId.NWK_UPDATE_REQUEST]: ZiGateCommandCode.ManagementNetworkUpdate,
    [ZdoClusterId.PERMIT_JOINING_REQUEST]: ZiGateCommandCode.PermitJoin,
};

export enum ZiGateMessageCode {
    DeviceAnnounce = 0x004d,
    Status = 0x8000,
    LOG = 0x8001,
    DataIndication = 0x8002,
    NodeClusterList = 0x8003,
    NodeAttributeList = 0x8004,
    NodeCommandIDList = 0x8005,
    SimpleDescriptorResponse = 0x8043,
    NetworkState = 0x8009,
    VersionList = 0x8010,
    APSDataACK = 0x8011,
    APSDataConfirm = 0x8012,
    APSDataConfirmFailed = 0x8702,
    NetworkJoined = 0x8024,
    LeaveIndication = 0x8048,
    RouterDiscoveryConfirm = 0x8701,
    PermitJoinStatus = 0x8014,
    GetTimeServer = 0x8017,
    ManagementLQIResponse = 0x804e,
    ManagementLeaveResponse = 0x8047,
    PDMEvent = 0x8035,
    PDMLoaded = 0x0302,
    RestartNonFactoryNew = 0x8006,
    RestartFactoryNew = 0x8007,
    ExtendedStatusCallBack = 0x9999,
    AddGroupResponse = 0x8060,
}
// biome-ignore lint/suspicious/noExplicitAny: API
export type ZiGateObjectPayload = any;

export enum ZPSNwkKeyState {
    ZPS_ZDO_NO_NETWORK_KEY = 0,
    ZPS_ZDO_PRECONFIGURED_LINK_KEY = 1,
    ZPS_ZDO_DISTRIBUTED_LINK_KEY = 2,
    ZPS_ZDO_PRECONFIGURED_INSTALLATION_CODE = 3,
}
