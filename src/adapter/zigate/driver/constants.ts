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

    // OCB (Open Coordinator Backup) diagnostic UART extension.
    // Only present on firmware built after v3.23.
    OcbCapability = 0x0d0f,
    OcbExportBegin = 0x0d18,
    OcbExportCore = 0x0d19,
    OcbExportEnd = 0x0d1b,
    OcbChallenge = 0x0d20,
    OcbUnlock = 0x0d21,
    OcbSecretCore = 0x0d22,
    OcbLinkKey = 0x0d23,
    OcbRestoreBegin = 0x0d24,
    OcbRestoreField = 0x0d25,
    OcbRestoreLink = 0x0d26,
    OcbValidate = 0x0d27,
    OcbCommit = 0x0d28,
    OcbAbort = 0x0d2a,
}

/** `cap_bitmap` bits returned by `ZiGateCommandCode.OcbCapability` (`0x8D0F`). */
export enum OcbCapabilityBit {
    /** Read-only typed metadata export (PAN/ext-PAN/channel/coordinator IEEE), no key material. */
    MetadataExport = 15,
    /** Full network/TC key export and streamed restore (0x0D20-0x0D2A). */
    ExperimentalKeys = 16,
    /** Reserved, production-qualified "BackupCapable" bit. Always clear today. */
    BackupQualified = 17,
}

/** `field_id` values for `ZiGateCommandCode.OcbRestoreField` requests. */
export enum OcbRestoreFieldId {
    NwkKey = 0x0001,
    NwkKeySeq = 0x0002,
    NwkOutFc = 0x0003,
    PanId = 0x0004,
    ExtPanId = 0x0005,
    Channel = 0x0006,
    NwkAddr = 0x0007,
    NwkUpdateId = 0x0008,
    TcAddr = 0x0009,
    TcLinkKey = 0x000a,
    TcKeyType = 0x000b,
    // AdoptIeee = 0x000c, // deliberately unsupported: firmware itself flags cross-device IEEE adoption as unsafe/unverified
}

/** `result` values echoed by `ZiGateCommandCode.OcbRestoreField`/`OcbRestoreLink` responses. */
export enum OcbFieldResult {
    Applied = 0,
    SkippedUnknown = 1,
    BadLength = 2,
    Unavailable = 3,
}

/** `kind` values for `ZiGateCommandCode.OcbLinkKey` requests. */
export enum OcbLinkKeyKind {
    DefaultTc = 0,
    ApsTable = 1,
    FlashTclk = 2,
}

/** Number of flash TCLK slots the firmware enumerates (fixed, no dynamic count available). */
export const OCB_FLASH_TCLK_ENTRIES = 70;

/** `available` bitmap bits returned by `ZiGateCommandCode.OcbLinkKey` responses. */
export enum OcbLinkKeyAvailableBit {
    TcOrApsLinkKey = 2,
    Eui64 = 5,
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

    // OCB (Open Coordinator Backup), see ZiGateCommandCode.Ocb* above.
    OcbCapabilityResponse = 0x8d0f,
    OcbExportBeginResponse = 0x8d18,
    OcbExportCoreResponse = 0x8d19,
    OcbExportEndResponse = 0x8d1b,
    OcbChallengeResponse = 0x8d20,
    OcbUnlockResponse = 0x8d21,
    OcbSecretCoreResponse = 0x8d22,
    OcbLinkKeyResponse = 0x8d23,
    OcbRestoreBeginResponse = 0x8d24,
    OcbRestoreFieldResponse = 0x8d25,
    OcbRestoreLinkResponse = 0x8d26,
    OcbValidateResponse = 0x8d27,
    OcbCommitResponse = 0x8d28,
    OcbAbortResponse = 0x8d2a,
}
// biome-ignore lint/suspicious/noExplicitAny: API
export type ZiGateObjectPayload = any;

export enum ZPSNwkKeyState {
    ZPS_ZDO_NO_NETWORK_KEY = 0,
    ZPS_ZDO_PRECONFIGURED_LINK_KEY = 1,
    ZPS_ZDO_DISTRIBUTED_LINK_KEY = 2,
    ZPS_ZDO_PRECONFIGURED_INSTALLATION_CODE = 3,
}
