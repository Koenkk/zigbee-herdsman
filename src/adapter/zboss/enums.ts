export enum StatusCategory {
    GENERIC = 0,
    MAC = 2,
    NWK = 3,
    APS = 4,
    ZDO = 5,
    CBKE = 6,
}

export enum StatusCodeGeneric {
    OK = 0,
    ERROR = 1,
    BLOCKED = 2,
    EXIT = 3,
    BUSY = 4,
    EOF = 5,
    OUT_OF_RANGE = 6,
    EMPTY = 7,
    CANCELLED = 8,
    INVALID_PARAMETER_1 = 10,
    INVALID_PARAMETER_2 = 11,
    INVALID_PARAMETER_3 = 12,
    INVALID_PARAMETER_4 = 13,
    INVALID_PARAMETER_5 = 14,
    INVALID_PARAMETER_6 = 15,
    INVALID_PARAMETER_7 = 16,
    INVALID_PARAMETER_8 = 17,
    INVALID_PARAMETER_9 = 18,
    INVALID_PARAMETER_10 = 19,
    INVALID_PARAMETER_11_OR_MORE = 20,
    PENDING = 21,
    NO_MEMORY = 22,
    INVALID_PARAMETER = 23,
    OPERATION_FAILED = 24,
    BUFFER_TOO_SMALL = 25,
    END_OF_LIST = 26,
    ALREADY_EXISTS = 27,
    NOT_FOUND = 28,
    OVERFLOW = 29,
    TIMEOUT = 30,
    NOT_IMPLEMENTED = 31,
    NO_RESOURCES = 32,
    UNINITIALIZED = 33,
    NO_SERVER = 34,
    INVALID_STATE = 35,
    CONNECTION_FAILED = 37,
    CONNECTION_LOST = 38,
    UNAUTHORIZED = 40,
    CONFLICT = 41,
    INVALID_FORMAT = 42,
    NO_MATCH = 43,
    PROTOCOL_ERROR = 44,
    VERSION = 45,
    MALFORMED_ADDRESS = 46,
    COULD_NOT_READ_FILE = 47,
    FILE_NOT_FOUND = 48,
    DIRECTORY_NOT_FOUND = 49,
    CONVERSION_ERROR = 50,
    INCOMPATIBLE_TYPES = 51,
    FILE_CORRUPTED = 56,
    PAGE_NOT_FOUND = 57,
    ILLEGAL_REQUEST = 62,
    INVALID_GROUP = 64,
    TABLE_FULL = 65,
    IGNORE = 69,
    AGAIN = 70,
    DEVICE_NOT_FOUND = 71,
    OBSOLETE = 72,
}

export enum StatusCodeAPS {
    // A request has been executed successfully.
    SUCCESS = 0x00,
    // A transmit request failed since the ASDU is too large and fragmentation is not supported.
    ASDU_TOO_LONG = 0xa0,
    // A received fragmented frame could not be defragmented at the current time.
    DEFRAG_DEFERRED = 0xa1,
    // A received fragmented frame could not be defragmented since the device does not support fragmentation.
    DEFRAG_UNSUPPORTED = 0xa2,
    // A parameter value was out of range.
    ILLEGAL_REQUEST = 0xa3,
    // An APSME-UNBIND.request failed due to the requested binding link not existing in the binding table.
    INVALID_BINDING = 0xa4,
    // An APSME-REMOVE-GROUP.request has been issued with a group identifier that does not appear in the group table.
    INVALID_GROUP = 0xa5,
    // A parameter value was invalid or out of range.
    INVALID_PARAMETER = 0xa6,
    // An APSDE-DATA.request requesting acknowledged trans- mission failed due to no acknowledgement being received.
    NO_ACK = 0xa7,
    // An APSDE-DATA.request with a destination addressing mode set to 0x00 failed due to there being no devices bound to this device.
    NO_BOUND_DEVICE = 0xa8,
    // An APSDE-DATA.request with a destination addressing mode set to 0x03 failed due to no corresponding short address found in the address map table.
    NO_SHORT_ADDRESS = 0xa9,
    // An APSDE-DATA.request with a destination addressing mode set to 0x00 failed due to a binding table not being supported on the device.
    NOT_SUPPORTED = 0xaa,
    // An ASDU was received that was secured using a link key.
    SECURED_LINK_KEY = 0xab,
    // An ASDU was received that was secured using a network key.
    SECURED_NWK_KEY = 0xac,
    // An APSDE-DATA.request requesting security has resulted in an error during the corresponding security processing.
    SECURITY_FAIL = 0xad,
    // An APSME-BIND.request or APSME.ADD-GROUP.request issued when the binding or group tables, respectively, were full.
    TABLE_FULL = 0xae,
    // An ASDU was received without any security.
    UNSECURED = 0xaf,
    // An APSME-GET.request or APSME-SET.request has been issued with an unknown attribute identifier.
    UNSUPPORTED_ATTRIBUTE = 0xb0,
}

export enum StatusCodeCBKE {
    // The Issuer field within the key establishment partner's certificate is unknown to the sending device
    UNKNOWN_ISSUER = 1,
    // The device could not confirm that it shares the same key with the corresponding device
    BAD_KEY_CONFIRM = 2,
    // The device received a bad message from the corresponding device
    BAD_MESSAGE = 3,
    // The device does not currently have the internal resources necessary to perform key establishment
    NO_RESOURCES = 4,
    // The device does not support the specified key establishment suite in the partner's Initiate Key Establishment message
    UNSUPPORTED_SUITE = 5,
    // The received certificate specifies a type, curve, hash, or other parameter that is either unsupported by the device or invalid
    INVALID_CERTIFICATE = 6,
    // Non-standard ZBOSS extension: SE KE endpoint not found
    NO_KE_EP = 7,
}

/**
 * Enum of the network state
 */
export enum NetworkState {
    OFFLINE = 0x00 /*!< The network is offline */,
    JOINING = 0x01 /*!< Joinging the network */,
    CONNECTED = 0x02 /*!< Conneted with the network */,
    LEAVING = 0x03 /*!< Leaving the network */,
    CONFIRM = 0x04 /*!< Confirm the APS */,
    INDICATION = 0x05 /*!< Indication the APS */,
}

/**
 * Enum of the network security mode
 */
export enum EspNCPSecur {
    ESP_NCP_NO_SECURITY = 0x00 /*!< The network is no security mode */,
    ESP_NCP_PRECONFIGURED_NETWORK_KEY = 0x01 /*!< Pre-configured the network key */,
    ESP_NCP_NETWORK_KEY_FROM_TC = 0x02,
    ESP_NCP_ONLY_TCLK = 0x03,
}

export enum DeviceType {
    COORDINATOR = 0x00,
    ROUTER = 0x01,
    ED = 0x02,
    NONE = 0x03,
}

export enum CommandId {
    // NCP config
    GET_MODULE_VERSION = 0x0001,
    NCP_RESET = 0x0002,
    GET_ZIGBEE_ROLE = 0x0004,
    SET_ZIGBEE_ROLE = 0x0005,
    GET_ZIGBEE_CHANNEL_MASK = 0x0006,
    SET_ZIGBEE_CHANNEL_MASK = 0x0007,
    GET_ZIGBEE_CHANNEL = 0x0008,
    GET_PAN_ID = 0x0009,
    SET_PAN_ID = 0x000a,
    GET_LOCAL_IEEE_ADDR = 0x000b,
    SET_LOCAL_IEEE_ADDR = 0x000c,
    GET_TX_POWER = 0x0010,
    SET_TX_POWER = 0x0011,
    GET_RX_ON_WHEN_IDLE = 0x0012,
    SET_RX_ON_WHEN_IDLE = 0x0013,
    GET_JOINED = 0x0014,
    GET_AUTHENTICATED = 0x0015,
    GET_ED_TIMEOUT = 0x0016,
    SET_ED_TIMEOUT = 0x0017,
    SET_NWK_KEY = 0x001b,
    GET_NWK_KEYS = 0x001e,
    GET_APS_KEY_BY_IEEE = 0x001f,
    GET_PARENT_ADDRESS = 0x0022,
    GET_EXTENDED_PAN_ID = 0x0023,
    GET_COORDINATOR_VERSION = 0x0024,
    GET_SHORT_ADDRESS = 0x0025,
    GET_TRUST_CENTER_ADDRESS = 0x0026,
    NCP_RESET_IND = 0x002b,
    NVRAM_WRITE = 0x002e,
    NVRAM_READ = 0x002f,
    NVRAM_ERASE = 0x0030,
    NVRAM_CLEAR = 0x0031,
    SET_TC_POLICY = 0x0032,
    SET_EXTENDED_PAN_ID = 0x0033,
    SET_MAX_CHILDREN = 0x0034,
    GET_MAX_CHILDREN = 0x0035,

    // Application Framework
    AF_SET_SIMPLE_DESC = 0x0101,
    AF_DEL_SIMPLE_DESC = 0x0102,
    AF_SET_NODE_DESC = 0x0103,
    AF_SET_POWER_DESC = 0x0104,

    // Zigbee Device Object
    ZDO_NWK_ADDR_REQ = 0x0201,
    ZDO_IEEE_ADDR_REQ = 0x0202,
    ZDO_POWER_DESC_REQ = 0x0203,
    ZDO_NODE_DESC_REQ = 0x0204,
    ZDO_SIMPLE_DESC_REQ = 0x0205,
    ZDO_ACTIVE_EP_REQ = 0x0206,
    ZDO_MATCH_DESC_REQ = 0x0207,
    ZDO_BIND_REQ = 0x0208,
    ZDO_UNBIND_REQ = 0x0209,
    ZDO_MGMT_LEAVE_REQ = 0x020a,
    ZDO_PERMIT_JOINING_REQ = 0x020b,
    ZDO_DEV_ANNCE_IND = 0x020c,
    ZDO_REJOIN = 0x020d,
    ZDO_SYSTEM_SRV_DISCOVERY_REQ = 0x020e,
    ZDO_MGMT_BIND_REQ = 0x020f,
    ZDO_MGMT_LQI_REQ = 0x0210,
    // ZDO_MGMT_RTG_REQ = 0x0???,
    ZDO_MGMT_NWK_UPDATE_REQ = 0x0211,
    ZDO_GET_STATS = 0x0213,
    ZDO_DEV_AUTHORIZED_IND = 0x0214,
    ZDO_DEV_UPDATE_IND = 0x0215,
    ZDO_SET_NODE_DESC_MANUF_CODE = 0x0216,

    // Application Support Sub-layer
    APSDE_DATA_REQ = 0x0301,
    APSME_BIND = 0x0302,
    APSME_UNBIND = 0x0303,
    APSME_ADD_GROUP = 0x0304,
    APSME_RM_GROUP = 0x0305,
    APSDE_DATA_IND = 0x0306,
    APSME_RM_ALL_GROUPS = 0x0307,
    APS_CHECK_BINDING = 0x0308,
    APS_GET_GROUP_TABLE = 0x0309,
    APSME_UNBIND_ALL = 0x030a,

    // Network Layer
    NWK_FORMATION = 0x0401,
    NWK_DISCOVERY = 0x0402,
    NWK_NLME_JOIN = 0x0403,
    NWK_PERMIT_JOINING = 0x0404,
    NWK_GET_IEEE_BY_SHORT = 0x0405,
    NWK_GET_SHORT_BY_IEEE = 0x0406,
    NWK_GET_NEIGHBOR_BY_IEEE = 0x0407,
    NWK_REJOINED_IND = 0x0409,
    NWK_REJOIN_FAILED_IND = 0x040a,
    NWK_LEAVE_IND = 0x040b,
    PIM_SET_FAST_POLL_INTERVAL = 0x040e,
    PIM_SET_LONG_POLL_INTERVAL = 0x040f,
    PIM_START_FAST_POLL = 0x0410,
    PIM_START_LONG_POLL = 0x0411,
    PIM_START_POLL = 0x0412,
    PIM_STOP_FAST_POLL = 0x0414,
    PIM_STOP_POLL = 0x0415,
    PIM_ENABLE_TURBO_POLL = 0x0416,
    PIM_DISABLE_TURBO_POLL = 0x0417,
    NWK_PAN_ID_CONFLICT_RESOLVE = 0x041a,
    NWK_PAN_ID_CONFLICT_IND = 0x041b,
    NWK_ADDRESS_UPDATE_IND = 0x041c,
    NWK_START_WITHOUT_FORMATION = 0x041d,
    NWK_NLME_ROUTER_START = 0x041e,
    PARENT_LOST_IND = 0x0420,
    PIM_START_TURBO_POLL_PACKETS = 0x0424,
    PIM_START_TURBO_POLL_CONTINUOUS = 0x0425,
    PIM_TURBO_POLL_CONTINUOUS_LEAVE = 0x0426,
    PIM_TURBO_POLL_PACKETS_LEAVE = 0x0427,
    PIM_PERMIT_TURBO_POLL = 0x0428,
    PIM_SET_FAST_POLL_TIMEOUT = 0x0429,
    PIM_GET_LONG_POLL_INTERVAL = 0x042a,
    PIM_GET_IN_FAST_POLL_FLAG = 0x042b,
    SET_KEEPALIVE_MOVE = 0x042c,
    START_CONCENTRATOR_MODE = 0x042d,
    STOP_CONCENTRATOR_MODE = 0x042e,
    NWK_ENABLE_PAN_ID_CONFLICT_RESOLUTION = 0x042f,
    NWK_ENABLE_AUTO_PAN_ID_CONFLICT_RESOLUTION = 0x0430,
    PIM_TURBO_POLL_CANCEL_PACKET = 0x0431,

    // Security
    SECUR_SET_LOCAL_IC = 0x0501,
    SECUR_ADD_IC = 0x0502,
    SECUR_DEL_IC = 0x0503,
    SECUR_GET_LOCAL_IC = 0x050d,
    SECUR_TCLK_IND = 0x050e,
    SECUR_TCLK_EXCHANGE_FAILED_IND = 0x050f,
    SECUR_NWK_INITIATE_KEY_SWITCH_PROCEDURE = 0x0517,
    SECUR_GET_IC_LIST = 0x0518,
    SECUR_GET_IC_BY_IDX = 0x0519,
    SECUR_REMOVE_ALL_IC = 0x051a,

    ///////////////////
    UNKNOWN_1 = 0x0a02,
}

export enum ResetOptions {
    NoOptions = 0,
    EraseNVRAM = 1,
    FactoryReset = 2,
    LockReadingKeys = 3,
}

export enum ResetSource {
    RESET_SRC_POWER_ON = 0,
    RESET_SRC_SW_RESET = 1,
    RESET_SRC_RESET_PIN = 2,
    RESET_SRC_BROWN_OUT = 3,
    RESET_SRC_CLOCK_LOSS = 4,
    RESET_SRC_OTHER = 5,
}

export enum PolicyType {
    LINK_KEY_REQUIRED = 0,
    IC_REQUIRED = 1,
    TC_REJOIN_ENABLED = 2,
    IGNORE_TC_REJOIN = 3,
    APS_INSECURE_JOIN = 4,
    DISABLE_NWK_MGMT_CHANNEL_UPDATE = 5,
}

export enum BuffaloZBOSSDataType {
    LIST_TYPED = 3000,
    EXTENDED_PAN_ID = 3001,
}

export enum DeviceAuthorizedType {
    LEGACY = 0,
    R21_TCLK = 1,
    SE_CBKE = 2,
}

export enum DeviceAuthorizedLegacyStatus {
    SUCCESS = 0,
    FAILED = 1,
}

export enum DeviceAuthorizedR21TCLKStatus {
    SUCCESS = 0,
    TIMEOUT = 1,
    FAILED = 2,
}

export enum DeviceAuthorizedSECBKEStatus {
    SUCCESS = 0,
}

export enum DeviceUpdateStatus {
    SECURED_REJOIN = 0,
    UNSECURED_JOIN = 1,
    LEFT = 2,
    TC_REJOIN = 3,
    // 0x04 – 0x07 = Reserved
}

export enum DeviceUpdateTCAction {
    /* authorize device */
    AUTHORIZE = 0,
    /* deby authorization - msend Remove device  */
    DENY = 1,
    /* ignore Update Device - that meay lead to authorization deny */
    IGNORE = 2,
}
