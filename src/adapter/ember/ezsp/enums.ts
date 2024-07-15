/** EZSP Frame IDs */
export enum EzspFrameID {
    // Configuration Frames
    VERSION = 0x0000,
    GET_CONFIGURATION_VALUE = 0x0052,
    SET_CONFIGURATION_VALUE = 0x0053,
    READ_ATTRIBUTE = 0x0108,
    WRITE_ATTRIBUTE = 0x0109,
    ADD_ENDPOINT = 0x0002,
    SET_POLICY = 0x0055,
    GET_POLICY = 0x0056,
    SEND_PAN_ID_UPDATE = 0x0057,
    GET_VALUE = 0x00aa,
    GET_EXTENDED_VALUE = 0x0003,
    SET_VALUE = 0x00ab,
    SET_PASSIVE_ACK_CONFIG = 0x0105,
    /** v14+ */
    SET_PENDING_NETWORK_UPDATE_PAN_ID = 0x011e,
    /** v14+ */
    GET_ENDPOINT = 0x012e,
    /** v14+ */
    GET_ENDPOINT_COUNT = 0x012f,
    /** v14+ */
    GET_ENDPOINT_DESCRIPTION = 0x0130,
    /** v14+ */
    GET_ENDPOINT_CLUSTER = 0x0131,

    // Utilities Frames
    NOP = 0x0005,
    ECHO = 0x0081,
    INVALID_COMMAND = 0x0058,
    CALLBACK = 0x0006,
    NO_CALLBACKS = 0x0007,
    SET_TOKEN = 0x0009,
    GET_TOKEN = 0x000a,
    GET_MFG_TOKEN = 0x000b,
    SET_MFG_TOKEN = 0x000c,
    STACK_TOKEN_CHANGED_HANDLER = 0x000d,
    GET_RANDOM_NUMBER = 0x0049,
    SET_TIMER = 0x000e,
    GET_TIMER = 0x004e,
    TIMER_HANDLER = 0x000f,
    DEBUG_WRITE = 0x0012,
    READ_AND_CLEAR_COUNTERS = 0x0065,
    READ_COUNTERS = 0x00f1,
    COUNTER_ROLLOVER_HANDLER = 0x00f2,
    DELAY_TEST = 0x009d,
    GET_LIBRARY_STATUS = 0x0001,
    GET_XNCP_INFO = 0x0013,
    CUSTOM_FRAME = 0x0047,
    CUSTOM_FRAME_HANDLER = 0x0054,
    GET_EUI64 = 0x0026,
    GET_NODE_ID = 0x0027,
    GET_PHY_INTERFACE_COUNT = 0x00fc,
    GET_TRUE_RANDOM_ENTROPY_SOURCE = 0x004f,
    /** v14+ */
    SETUP_DELAYED_JOIN = 0x003a,
    /** v14+ */
    RADIO_GET_SCHEDULER_PRIORITIES = 0x012a,
    /** v14+ */
    RADIO_SET_SCHEDULER_PRIORITIES = 0x012b,
    /** v14+ */
    RADIO_GET_SCHEDULER_SLIPTIME = 0x012c,
    /** v14+ */
    RADIO_SET_SCHEDULER_SLIPTIME = 0x012d,
    /** v14+ */
    COUNTER_REQUIRES_PHY_INDEX = 0x0132,
    /** v14+ */
    COUNTER_REQUIRES_DESTINATION_NODE_ID = 0x0133,

    // Networking Frames
    SET_MANUFACTURER_CODE = 0x0015,
    /** v14+ */
    GET_MANUFACTURER_CODE = 0x00ca,
    SET_POWER_DESCRIPTOR = 0x0016,
    NETWORK_INIT = 0x0017,
    NETWORK_STATE = 0x0018,
    STACK_STATUS_HANDLER = 0x0019,
    START_SCAN = 0x001a,
    ENERGY_SCAN_RESULT_HANDLER = 0x0048,
    NETWORK_FOUND_HANDLER = 0x001b,
    SCAN_COMPLETE_HANDLER = 0x001c,
    UNUSED_PAN_ID_FOUND_HANDLER = 0x00d2,
    FIND_UNUSED_PAN_ID = 0x00d3,
    STOP_SCAN = 0x001d,
    FORM_NETWORK = 0x001e,
    JOIN_NETWORK = 0x001f,
    JOIN_NETWORK_DIRECTLY = 0x003b,
    LEAVE_NETWORK = 0x0020,
    FIND_AND_REJOIN_NETWORK = 0x0021,
    PERMIT_JOINING = 0x0022,
    CHILD_JOIN_HANDLER = 0x0023,
    ENERGY_SCAN_REQUEST = 0x009c,
    GET_NETWORK_PARAMETERS = 0x0028,
    GET_RADIO_PARAMETERS = 0x00fd,
    GET_PARENT_CHILD_PARAMETERS = 0x0029,
    /** v14+ */
    ROUTER_CHILD_COUNT = 0x013b,
    /** v14+ */
    MAX_CHILD_COUNT = 0x013c,
    /** v14+ */
    MAX_ROUTER_CHILD_COUNT = 0x013d,
    /** v14+ */
    GET_PARENT_INCOMING_NWK_FRAME_COUNTER = 0x013e,
    /** v14+ */
    SET_PARENT_INCOMING_NWK_FRAME_COUNTER = 0x013f,
    /** v14+ */
    CURRENT_STACK_TASKS = 0x0145,
    /** v14+ */
    OK_TO_NAP = 0x0146,
    /** v14+ */
    PARENT_TOKEN_SET = 0x0140,
    /** v14+ */
    OK_TO_HIBERNATE = 0x0141,
    /** v14+ */
    OK_TO_LONG_POLL = 0x0142,
    /** v14+ */
    STACK_POWER_DOWN = 0x0143,
    /** v14+ */
    STACK_POWER_UP = 0x0144,
    GET_CHILD_DATA = 0x004a,
    SET_CHILD_DATA = 0x00ac,
    CHILD_ID = 0x0106,
    /** v14+ */
    CHILD_POWER = 0x0134,
    /** v14+ */
    SET_CHILD_POWER = 0x0135,
    CHILD_INDEX = 0x0107,
    GET_SOURCE_ROUTE_TABLE_TOTAL_SIZE = 0x00c3,
    GET_SOURCE_ROUTE_TABLE_FILLED_SIZE = 0x00c2,
    GET_SOURCE_ROUTE_TABLE_ENTRY = 0x00c1,
    GET_NEIGHBOR = 0x0079,
    GET_NEIGHBOR_FRAME_COUNTER = 0x003e,
    SET_NEIGHBOR_FRAME_COUNTER = 0x00ad,
    SET_ROUTING_SHORTCUT_THRESHOLD = 0x00d0,
    GET_ROUTING_SHORTCUT_THRESHOLD = 0x00d1,
    NEIGHBOR_COUNT = 0x007a,
    GET_ROUTE_TABLE_ENTRY = 0x007b,
    SET_RADIO_POWER = 0x0099,
    SET_RADIO_CHANNEL = 0x009a,
    GET_RADIO_CHANNEL = 0x00ff,
    SET_RADIO_IEEE802154_CCA_MODE = 0x0095,
    SET_CONCENTRATOR = 0x0010,
    /** v14+ */
    CONCENTRATOR_START_DISCOVERY = 0x014f,
    /** v14+ */
    CONCENTRATOR_STOP_DISCOVERY = 0x0150,
    /** v14+ */
    CONCENTRATOR_NOTE_ROUTE_ERROR = 0x0151,
    SET_BROKEN_ROUTE_ERROR_CODE = 0x0011,
    MULTI_PHY_START = 0x00f8,
    MULTI_PHY_STOP = 0x00f9,
    MULTI_PHY_SET_RADIO_POWER = 0x00fa,
    SEND_LINK_POWER_DELTA_REQUEST = 0x00f7,
    MULTI_PHY_SET_RADIO_CHANNEL = 0x00fb,
    GET_DUTY_CYCLE_STATE = 0x0035,
    SET_DUTY_CYCLE_LIMITS_IN_STACK = 0x0040,
    GET_DUTY_CYCLE_LIMITS = 0x004b,
    GET_CURRENT_DUTY_CYCLE = 0x004c,
    DUTY_CYCLE_HANDLER = 0x004d,
    // GET_FIRST_BEACON                                 = 0x003D,// v13-, unused
    SET_NUM_BEACONS_TO_STORE = 0x0037,
    // GET_NEXT_BEACON                                  = 0x0004,// v13-, unused
    GET_STORED_BEACON = 0x0004,
    GET_NUM_STORED_BEACONS = 0x0008,
    CLEAR_STORED_BEACONS = 0x003c,
    SET_LOGICAL_AND_RADIO_CHANNEL = 0x00b9,
    /** v14+ */
    SLEEPY_TO_SLEEPY_NETWORK_START = 0x0119,
    /** v14+ */
    SEND_ZIGBEE_LEAVE = 0x011a,
    /** v14+ */
    GET_PERMIT_JOINING = 0x011f,
    /** v14+ */
    GET_EXTENDED_PAN_ID = 0x0127,
    /** v14+ */
    GET_CURRENT_NETWORK = 0x014e,
    /** v14+ */
    SET_INITIAL_NEIGHBOR_OUTGOING_COST = 0x0122,
    /** v14+ */
    GET_INITIAL_NEIGHBOR_OUTGOING_COST = 0x0123,
    /** v14+ */
    RESET_REJOINING_NEIGHBORS_FRAME_COUNTER = 0x0124,
    /** v14+ */
    IS_RESET_REJOINING_NEIGHBORS_FRAME_COUNTER_ENABLED = 0x0125,

    // Binding Frames
    CLEAR_BINDING_TABLE = 0x002a,
    SET_BINDING = 0x002b,
    GET_BINDING = 0x002c,
    DELETE_BINDING = 0x002d,
    BINDING_IS_ACTIVE = 0x002e,
    GET_BINDING_REMOTE_NODE_ID = 0x002f,
    SET_BINDING_REMOTE_NODE_ID = 0x0030,
    REMOTE_SET_BINDING_HANDLER = 0x0031,
    REMOTE_DELETE_BINDING_HANDLER = 0x0032,

    // Messaging Frames
    MAXIMUM_PAYLOAD_LENGTH = 0x0033,
    SEND_UNICAST = 0x0034,
    SEND_BROADCAST = 0x0036,
    // PROXY_BROADCAST                                  = 0x0037,// v13-, unused
    PROXY_NEXT_BROADCAST_FROM_LONG = 0x0066,
    SEND_MULTICAST = 0x0038,
    // SEND_MULTICAST_WITH_ALIAS                        = 0x003A,// v13-, unused
    SEND_REPLY = 0x0039,
    MESSAGE_SENT_HANDLER = 0x003f,
    SEND_MANY_TO_ONE_ROUTE_REQUEST = 0x0041,
    POLL_FOR_DATA = 0x0042,
    POLL_COMPLETE_HANDLER = 0x0043,
    /** v14+ */
    SET_MESSAGE_FLAG = 0x0136,
    /** v14+ */
    CLEAR_MESSAGE_FLAG = 0x0137,
    POLL_HANDLER = 0x0044,
    /** v14+ */
    ADD_CHILD = 0x0138,
    /** v14+ */
    REMOVE_CHILD = 0x0139,
    /** v14+ */
    REMOVE_NEIGHBOR = 0x013a,
    // INCOMING_SENDER_EUI64_HANDLER                    = 0x0062,// v13-, unused
    INCOMING_MESSAGE_HANDLER = 0x0045,
    SET_SOURCE_ROUTE_DISCOVERY_MODE = 0x005a,
    INCOMING_MANY_TO_ONE_ROUTE_REQUEST_HANDLER = 0x007d,
    INCOMING_ROUTE_ERROR_HANDLER = 0x0080,
    INCOMING_NETWORK_STATUS_HANDLER = 0x00c4,
    INCOMING_ROUTE_RECORD_HANDLER = 0x0059,
    // SET_SOURCE_ROUTE                                 = 0x00AE,// v9-, no-op since
    UNICAST_CURRENT_NETWORK_KEY = 0x0050,
    ADDRESS_TABLE_ENTRY_IS_ACTIVE = 0x005b,
    /** v14+ */
    SET_ADDRESS_TABLE_INFO = 0x005c,
    /** v14+ */
    GET_ADDRESS_TABLE_INFO = 0x005e,
    // SET_ADDRESS_TABLE_REMOTE_EUI64                   = 0x005C,// v13-, unused
    // SET_ADDRESS_TABLE_REMOTE_NODE_ID                 = 0x005D,// v13-, unused
    // GET_ADDRESS_TABLE_REMOTE_EUI64                   = 0x005E,// v13-, unused
    // GET_ADDRESS_TABLE_REMOTE_NODE_ID                 = 0x005F,// v13-, unused
    SET_EXTENDED_TIMEOUT = 0x007e,
    GET_EXTENDED_TIMEOUT = 0x007f,
    REPLACE_ADDRESS_TABLE_ENTRY = 0x0082,
    LOOKUP_NODE_ID_BY_EUI64 = 0x0060,
    LOOKUP_EUI64_BY_NODE_ID = 0x0061,
    GET_MULTICAST_TABLE_ENTRY = 0x0063,
    SET_MULTICAST_TABLE_ENTRY = 0x0064,
    ID_CONFLICT_HANDLER = 0x007c,
    WRITE_NODE_DATA = 0x00fe,
    // SEND_RAW_MESSAGE                                 = 0x0096,// v13-, unused
    SEND_RAW_MESSAGE = 0x0051,
    MAC_PASSTHROUGH_MESSAGE_HANDLER = 0x0097,
    MAC_FILTER_MATCH_MESSAGE_HANDLER = 0x0046,
    RAW_TRANSMIT_COMPLETE_HANDLER = 0x0098,
    SET_MAC_POLL_FAILURE_WAIT_TIME = 0x00f4,
    /** v14+ */
    GET_MAX_MAC_RETRIES = 0x006a,
    SET_BEACON_CLASSIFICATION_PARAMS = 0x00ef,
    GET_BEACON_CLASSIFICATION_PARAMS = 0x00f3,
    /** v14+ */
    PENDING_ACKED_MESSAGES = 0x0121,
    /** v14+ */
    RESCHEDULE_LINK_STATUS_MSG = 0x011b,
    /** v14+ */
    SET_NWK_UPDATE_ID = 0x011d,

    // Security Frames
    SET_INITIAL_SECURITY_STATE = 0x0068,
    GET_CURRENT_SECURITY_STATE = 0x0069,
    EXPORT_KEY = 0x0114,
    IMPORT_KEY = 0x0115,
    SWITCH_NETWORK_KEY_HANDLER = 0x006e,
    FIND_KEY_TABLE_ENTRY = 0x0075,
    SEND_TRUST_CENTER_LINK_KEY = 0x0067,
    ERASE_KEY_TABLE_ENTRY = 0x0076,
    CLEAR_KEY_TABLE = 0x00b1,
    REQUEST_LINK_KEY = 0x0014,
    UPDATE_TC_LINK_KEY = 0x006c,
    ZIGBEE_KEY_ESTABLISHMENT_HANDLER = 0x009b,
    CLEAR_TRANSIENT_LINK_KEYS = 0x006b,
    GET_NETWORK_KEY_INFO = 0x0116,
    GET_APS_KEY_INFO = 0x010c,
    IMPORT_LINK_KEY = 0x010e,
    EXPORT_LINK_KEY_BY_INDEX = 0x010f,
    EXPORT_LINK_KEY_BY_EUI = 0x010d,
    CHECK_KEY_CONTEXT = 0x0110,
    IMPORT_TRANSIENT_KEY = 0x0111,
    EXPORT_TRANSIENT_KEY_BY_INDEX = 0x0112,
    EXPORT_TRANSIENT_KEY_BY_EUI = 0x0113,
    /** v14+ */
    SET_INCOMING_TC_LINK_KEY_FRAME_COUNTER = 0x0128,
    /** v14+ */
    APS_CRYPT_MESSAGE = 0x0129,

    // Trust Center Frames
    TRUST_CENTER_JOIN_HANDLER = 0x0024,
    BROADCAST_NEXT_NETWORK_KEY = 0x0073,
    BROADCAST_NETWORK_KEY_SWITCH = 0x0074,
    AES_MMO_HASH = 0x006f,
    REMOVE_DEVICE = 0x00a8,
    UNICAST_NWK_KEY_UPDATE = 0x00a9,

    // Certificate Based Key Exchange (CBKE) Frames
    GENERATE_CBKE_KEYS = 0x00a4,
    GENERATE_CBKE_KEYS_HANDLER = 0x009e,
    CALCULATE_SMACS = 0x009f,
    CALCULATE_SMACS_HANDLER = 0x00a0,
    GENERATE_CBKE_KEYS283K1 = 0x00e8,
    GENERATE_CBKE_KEYS_HANDLER283K1 = 0x00e9,
    CALCULATE_SMACS283K1 = 0x00ea,
    CALCULATE_SMACS_HANDLER283K1 = 0x00eb,
    CLEAR_TEMPORARY_DATA_MAYBE_STORE_LINK_KEY = 0x00a1,
    CLEAR_TEMPORARY_DATA_MAYBE_STORE_LINK_KEY283K1 = 0x00ee,
    GET_CERTIFICATE = 0x00a5,
    GET_CERTIFICATE283K1 = 0x00ec,
    // DSA_SIGN                                         = 0x00A6,// use EmberApsOption.DSA_SIGN instead
    DSA_SIGN_HANDLER = 0x00a7,
    DSA_VERIFY = 0x00a3,
    DSA_VERIFY_HANDLER = 0x0078,
    DSA_VERIFY283K1 = 0x00b0,
    SET_PREINSTALLED_CBKE_DATA = 0x00a2,
    SAVE_PREINSTALLED_CBKE_DATA283K1 = 0x00ed,

    // Mfglib Frames
    MFGLIB_INTERNAL_START = 0x0083,
    MFGLIB_INTERNAL_END = 0x0084,
    MFGLIB_INTERNAL_START_TONE = 0x0085,
    MFGLIB_INTERNAL_STOP_TONE = 0x0086,
    MFGLIB_INTERNAL_START_STREAM = 0x0087,
    MFGLIB_INTERNAL_STOP_STREAM = 0x0088,
    MFGLIB_INTERNAL_SEND_PACKET = 0x0089,
    MFGLIB_INTERNAL_SET_CHANNEL = 0x008a,
    MFGLIB_INTERNAL_GET_CHANNEL = 0x008b,
    MFGLIB_INTERNAL_SET_POWER = 0x008c,
    MFGLIB_INTERNAL_GET_POWER = 0x008d,
    MFGLIB_RX_HANDLER = 0x008e,

    // Bootloader Frames
    LAUNCH_STANDALONE_BOOTLOADER = 0x008f,
    SEND_BOOTLOAD_MESSAGE = 0x0090,
    GET_STANDALONE_BOOTLOADER_VERSION_PLAT_MICRO_PHY = 0x0091,
    INCOMING_BOOTLOAD_MESSAGE_HANDLER = 0x0092,
    BOOTLOAD_TRANSMIT_COMPLETE_HANDLER = 0x0093,
    AES_ENCRYPT = 0x0094,
    /** v14+ */
    INCOMING_MFG_TEST_MESSAGE_HANDLER = 0x0147,
    /** v14+ */
    MFG_TEST_SET_PACKET_MODE = 0x0148,
    /** v14+ */
    MFG_TEST_SEND_REBOOT_COMMAND = 0x0149,
    /** v14+ */
    MFG_TEST_SEND_EUI64 = 0x014a,
    /** v14+ */
    MFG_TEST_SEND_MANUFACTURING_STRING = 0x014b,
    /** v14+ */
    MFG_TEST_SEND_RADIO_PARAMETERS = 0x014c,
    /** v14+ */
    MFG_TEST_SEND_COMMAND = 0x014d,

    // ZLL Frames
    ZLL_NETWORK_OPS = 0x00b2,
    ZLL_SET_INITIAL_SECURITY_STATE = 0x00b3,
    ZLL_SET_SECURITY_STATE_WITHOUT_KEY = 0x00cf,
    ZLL_START_SCAN = 0x00b4,
    ZLL_SET_RX_ON_WHEN_IDLE = 0x00b5,
    ZLL_NETWORK_FOUND_HANDLER = 0x00b6,
    ZLL_SCAN_COMPLETE_HANDLER = 0x00b7,
    ZLL_ADDRESS_ASSIGNMENT_HANDLER = 0x00b8,
    ZLL_TOUCH_LINK_TARGET_HANDLER = 0x00bb,
    ZLL_GET_TOKENS = 0x00bc,
    ZLL_SET_DATA_TOKEN = 0x00bd,
    ZLL_SET_NON_ZLL_NETWORK = 0x00bf,
    IS_ZLL_NETWORK = 0x00be,
    ZLL_SET_RADIO_IDLE_MODE = 0x00d4,
    ZLL_GET_RADIO_IDLE_MODE = 0x00ba,
    SET_ZLL_NODE_TYPE = 0x00d5,
    SET_ZLL_ADDITIONAL_STATE = 0x00d6,
    ZLL_OPERATION_IN_PROGRESS = 0x00d7,
    ZLL_RX_ON_WHEN_IDLE_GET_ACTIVE = 0x00d8,
    ZLL_SCANNING_COMPLETE = 0x00f6,
    GET_ZLL_PRIMARY_CHANNEL_MASK = 0x00d9,
    GET_ZLL_SECONDARY_CHANNEL_MASK = 0x00da,
    SET_ZLL_PRIMARY_CHANNEL_MASK = 0x00db,
    SET_ZLL_SECONDARY_CHANNEL_MASK = 0x00dc,
    ZLL_CLEAR_TOKENS = 0x0025,

    // WWAH Frames
    // SET_PARENT_CLASSIFICATION_ENABLED                = 0x00E7,// v13-, unused
    // GET_PARENT_CLASSIFICATION_ENABLED                = 0x00F0,// v13-, unused
    // SET_LONG_UP_TIME                                 = 0x00E3,// v13-, unused
    // SET_HUB_CONNECTIVITY                             = 0x00E4,// v13-, unused
    // IS_UP_TIME_LONG                                  = 0x00E5,// v13-, unused
    // IS_HUB_CONNECTED                                 = 0x00E6,// v13-, unused

    // Green Power Frames
    GP_PROXY_TABLE_PROCESS_GP_PAIRING = 0x00c9,
    D_GP_SEND = 0x00c6,
    D_GP_SENT_HANDLER = 0x00c7,
    GPEP_INCOMING_MESSAGE_HANDLER = 0x00c5,
    GP_PROXY_TABLE_GET_ENTRY = 0x00c8,
    GP_PROXY_TABLE_LOOKUP = 0x00c0,
    GP_SINK_TABLE_GET_ENTRY = 0x00dd,
    GP_SINK_TABLE_LOOKUP = 0x00de,
    GP_SINK_TABLE_SET_ENTRY = 0x00df,
    GP_SINK_TABLE_REMOVE_ENTRY = 0x00e0,
    GP_SINK_TABLE_FIND_OR_ALLOCATE_ENTRY = 0x00e1,
    GP_SINK_TABLE_CLEAR_ALL = 0x00e2,
    GP_SINK_TABLE_INIT = 0x0070,
    GP_SINK_TABLE_SET_SECURITY_FRAME_COUNTER = 0x00f5,
    GP_SINK_COMMISSION = 0x010a,
    GP_TRANSLATION_TABLE_CLEAR = 0x010b,
    GP_SINK_TABLE_GET_NUMBER_OF_ACTIVE_ENTRIES = 0x0118,

    // Token Interface Frames
    GET_TOKEN_COUNT = 0x0100,
    GET_TOKEN_INFO = 0x0101,
    GET_TOKEN_DATA = 0x0102,
    SET_TOKEN_DATA = 0x0103,
    RESET_NODE = 0x0104,
    GP_SECURITY_TEST_VECTORS = 0x0117,
    TOKEN_FACTORY_RESET = 0x0077,
}

/** Identifies a configuration value. uint8_t */
export enum EzspConfigId {
    // 0x00?
    /**
     * The NCP no longer supports configuration of packet buffer heap at runtime using this parameter.
     * Packet buffers heap space must be configured using the EMBER_PACKET_BUFFER_COUNT macro when building the NCP project.
     */
    PACKET_BUFFER_HEAP_SIZE = 0x01,
    /**
     * The maximum number of router neighbors the stack can keep track of. A
     * neighbor is a node within radio range.
     */
    NEIGHBOR_TABLE_SIZE = 0x02,
    /**
     * The maximum number of APS retried messages the stack can be transmitting at
     * any time.
     */
    APS_UNICAST_MESSAGE_COUNT = 0x03,
    /**
     * The maximum number of non-volatile bindings supported by the stack.
     */
    BINDING_TABLE_SIZE = 0x04,
    /**
     * The maximum number of EUI64 to network address associations that the stack
     * can maintain for the application. (Note, the total number of such address
     * associations maintained by the NCP is the sum of the value of this setting
     * and the value of ::TRUST_CENTER_ADDRESS_CACHE_SIZE.
     */
    ADDRESS_TABLE_SIZE = 0x05,
    /**
     * The maximum number of multicast groups that the device may be a member of.
     */
    MULTICAST_TABLE_SIZE = 0x06,
    /**
     * The maximum number of destinations to which a node can route messages. This
     * includes both messages originating at this node and those relayed for
     * others.
     */
    ROUTE_TABLE_SIZE = 0x07,
    /**
     * The number of simultaneous route discoveries that a node will support.
     */
    DISCOVERY_TABLE_SIZE = 0x08,
    // 0x0A?
    // 0x0B?
    /**
     * Specifies the stack profile.
     */
    STACK_PROFILE = 0x0c,
    /**
     * The security level used for security at the MAC and network layers. The
     * supported values are 0 (no security) and 5 (payload is encrypted and a
     * four-byte MIC is used for authentication).
     */
    SECURITY_LEVEL = 0x0d,
    // 0x0E?
    // 0x0F?
    /**
     * The maximum number of hops for a message.
     */
    MAX_HOPS = 0x10,
    /**
     * The maximum number of end device children that a router will support.
     */
    MAX_END_DEVICE_CHILDREN = 0x11,
    /**
     * The maximum amount of time that the MAC will hold a message for indirect
     * transmission to a child.
     */
    INDIRECT_TRANSMISSION_TIMEOUT = 0x12,
    /**
     * The maximum amount of time that an end device child can wait between polls.
     * If no poll is heard within this timeout, then the parent removes the end
     * device from its tables. Value range 0-14. The timeout corresponding to a
     * value of zero is 10 seconds. The timeout corresponding to a nonzero value N
     * is 2^N minutes, ranging from 2^1 = 2 minutes to 2^14 = 16384 minutes.
     */
    END_DEVICE_POLL_TIMEOUT = 0x13,
    // 0x14?
    // 0x15?
    // 0x16?
    /**
     * Enables boost power mode and/or the alternate transmitter output.
     */
    TX_POWER_MODE = 0x17,
    /**
     * 0: Allow this node to relay messages. 1: Prevent this node from relaying
     * messages.
     */
    DISABLE_RELAY = 0x18,
    /**
     * The maximum number of EUI64 to network address associations that the Trust
     * Center can maintain. These address cache entries are reserved for and
     * reused by the Trust Center when processing device join/rejoin
     * authentications. This cache size limits the number of overlapping joins the
     * Trust Center can process within a narrow time window (e.g. two seconds),
     * and thus should be set to the maximum number of near simultaneous joins the
     * Trust Center is expected to accommodate. (Note, the total number of such
     * address associations maintained by the NCP is the sum of the value of this
     * setting and the value of ::ADDRESS_TABLE_SIZE.)
     */
    TRUST_CENTER_ADDRESS_CACHE_SIZE = 0x19,
    /**
     * The size of the source route table.
     */
    SOURCE_ROUTE_TABLE_SIZE = 0x1a,
    // 0x1B?
    /** The number of blocks of a fragmented message that can be sent in a single window. */
    FRAGMENT_WINDOW_SIZE = 0x1c,
    /** The time the stack will wait (in milliseconds) between sending blocks of a fragmented message. */
    FRAGMENT_DELAY_MS = 0x1d,
    /**
     * The size of the Key Table used for storing individual link keys (if the
     * device is a Trust Center) or Application Link Keys (if the device is a normal node).
     */
    KEY_TABLE_SIZE = 0x1e,
    /** The APS ACK timeout value. The stack waits this amount of time between resends of APS retried messages. */
    APS_ACK_TIMEOUT = 0x1f,
    /**
     * The duration of a beacon jitter, in the units used by the 15.4 scan
     * parameter (((1 << duration) + 1) * 15ms), when responding to a beacon request.
     */
    BEACON_JITTER_DURATION = 0x20,
    // 0x21?
    /** The number of PAN id conflict reports that must be received by the network manager within one minute to trigger a PAN id change. */
    PAN_ID_CONFLICT_REPORT_THRESHOLD = 0x22,
    /**
     * The timeout value in minutes for how long the Trust Center or a normal node
     * waits for the ZigBee Request Key to complete. On the Trust Center this
     * controls whether or not the device buffers the request, waiting for a
     * matching pair of ZigBee Request Key. If the value is non-zero, the Trust
     * Center buffers and waits for that amount of time. If the value is zero, the
     * Trust Center does not buffer the request and immediately responds to the
     * request. Zero is the most compliant behavior.
     */
    REQUEST_KEY_TIMEOUT = 0x24,
    // 0x25?
    // 0x26?
    // 0x27?
    // 0x28?
    /**
     * This value indicates the size of the runtime modifiable certificate table.
     * Normally certificates are stored in MFG tokens but this table can be used
     * to field upgrade devices with new Smart Energy certificates. This value
     * cannot be set, it can only be queried.
     */
    CERTIFICATE_TABLE_SIZE = 0x29,
    /**
     * This is a bitmask that controls which incoming ZDO request messages are
     * passed to the application. The bits are defined in the
     * EmberZdoConfigurationFlags enumeration. To see if the application is
     * required to send a ZDO response in reply to an incoming message, the
     * application must check the APS options bitfield within the
     * incomingMessageHandler callback to see if the
     * EMBER_APS_OPTION_ZDO_RESPONSE_REQUIRED flag is set.
     */
    APPLICATION_ZDO_FLAGS = 0x2a,
    /** The maximum number of broadcasts during a single broadcast timeout period. */
    BROADCAST_TABLE_SIZE = 0x2b,
    /** The size of the MAC filter list table. */
    MAC_FILTER_TABLE_SIZE = 0x2c,
    /** The number of supported networks. */
    SUPPORTED_NETWORKS = 0x2d,
    /**
     * Whether multicasts are sent to the RxOnWhenIdle=true address (0xFFFD) or
     * the sleepy broadcast address (0xFFFF). The RxOnWhenIdle=true address is the
     * ZigBee compliant destination for multicasts.
     */
    SEND_MULTICASTS_TO_SLEEPY_ADDRESS = 0x2e,
    /** ZLL group address initial configuration. */
    ZLL_GROUP_ADDRESSES = 0x2f,
    /** ZLL rssi threshold initial configuration. */
    ZLL_RSSI_THRESHOLD = 0x30,
    // 0x31?
    // 0x32?
    /** Toggles the MTORR flow control in the stack. */
    MTORR_FLOW_CONTROL = 0x33,
    /** Setting the retry queue size. Applies to all queues. Default value in the sample applications is 16. */
    RETRY_QUEUE_SIZE = 0x34,
    /**
     * Setting the new broadcast entry threshold. The number (BROADCAST_TABLE_SIZE
     * - NEW_BROADCAST_ENTRY_THRESHOLD) of broadcast table entries are reserved
     * for relaying the broadcast messages originated on other devices. The local
     * device will fail to originate a broadcast message after this threshold is
     * reached. Setting this value to BROADCAST_TABLE_SIZE and greater will
     * effectively kill this limitation.
     */
    NEW_BROADCAST_ENTRY_THRESHOLD = 0x35,
    /**
     * The length of time, in seconds, that a trust center will store a transient
     * link key that a device can use to join its network. A transient key is
     * added with a call to emberAddTransientLinkKey. After the transient key is
     * added, it will be removed once this amount of time has passed. A joining
     * device will not be able to use that key to join until it is added again on
     * the trust center. The default value is 300 seconds, i.e., 5 minutes.
     */
    TRANSIENT_KEY_TIMEOUT_S = 0x36,
    /** The number of passive acknowledgements to record from neighbors before we stop re-transmitting broadcasts */
    BROADCAST_MIN_ACKS_NEEDED = 0x37,
    /**
     * The length of time, in seconds, that a trust center will allow a Trust
     * Center (insecure) rejoin for a device that is using the well-known link
     * key. This timeout takes effect once rejoins using the well-known key has
     * been allowed. This command updates the
     * sli_zigbee_allow_tc_rejoins_using_well_known_key_timeout_sec value.
     */
    TC_REJOINS_USING_WELL_KNOWN_KEY_TIMEOUT_S = 0x38,
    /** Valid range of a CTUNE value is 0x0000-0x01FF. Higher order bits (0xFE00) of the 16-bit value are ignored. */
    CTUNE_VALUE = 0x39,
    // 0x3A?
    // 0x3B?
    // 0x3C?
    // 0x3D?
    // 0x3E?
    // 0x3F?
    /**
     * To configure non trust center node to assume a concentrator type of the
     * trust center it join to, until it receive many-to-one route request from
     * the trust center. For the trust center node, concentrator type is
     * configured from the concentrator plugin. The stack by default assumes trust
     * center be a low RAM concentrator that make other devices send route record
     * to the trust center even without receiving a many-to-one route request. The
     * default concentrator type can be changed by setting appropriate
     * EmberAssumeTrustCenterConcentratorType config value.
     */
    ASSUME_TC_CONCENTRATOR_TYPE = 0x40,
    /** This is green power proxy table size. This value is read-only and cannot be set at runtime */
    GP_PROXY_TABLE_SIZE = 0x41,
    /** This is green power sink table size. This value is read-only and cannot be set at runtime */
    GP_SINK_TABLE_SIZE = 0x42,
    /**
     * v14+
     * This is the configuration advertised by the end device to the parent when joining/rejoining,
     * either SL_ZIGBEE_END_DEVICE_CONFIG_NONE or SL_ZIGBEE_END_DEVICE_CONFIG_PERSIST_DATA_ON_PARENT.
     */
    END_DEVICE_CONFIGURATION = 0x43,
}

/** Identifies a policy decision. */
export enum EzspDecisionId {
    /**
     * BINDING_MODIFICATION_POLICY default decision.
     *
     * Do not allow the local binding table to be changed by remote nodes.
     */
    DISALLOW_BINDING_MODIFICATION = 0x10,
    /**
     * BINDING_MODIFICATION_POLICY decision.
     *
     * Allow remote nodes to change the local binding table.
     */
    ALLOW_BINDING_MODIFICATION = 0x11,
    /**
     * BINDING_MODIFICATION_POLICY decision.
     *
     * Allows remote nodes to set local binding entries only if the entries correspond to endpoints
     * defined on the device, and for output clusters bound to those endpoints.
     */
    CHECK_BINDING_MODIFICATIONS_ARE_VALID_ENDPOINT_CLUSTERS = 0x12,
    /**
     * UNICAST_REPLIES_POLICY default decision.
     *
     * The NCP will automatically send an empty reply (containing no payload) for every unicast received.
     * */
    HOST_WILL_NOT_SUPPLY_REPLY = 0x20,
    /**
     * UNICAST_REPLIES_POLICY decision.
     *
     * The NCP will only send a reply if it receives a sendReply command from the Host.
     */
    HOST_WILL_SUPPLY_REPLY = 0x21,
    /**
     * POLL_HANDLER_POLICY default decision.
     *
     * Do not inform the Host when a child polls.
     */
    POLL_HANDLER_IGNORE = 0x30,
    /**
     * POLL_HANDLER_POLICY decision.
     *
     * Generate a pollHandler callback when a child polls.
     */
    POLL_HANDLER_CALLBACK = 0x31,
    /**
     * MESSAGE_CONTENTS_IN_CALLBACK_POLICY default decision.
     *
     * Include only the message tag in the messageSentHandler callback.
     */
    MESSAGE_TAG_ONLY_IN_CALLBACK = 0x40,
    /**
     * MESSAGE_CONTENTS_IN_CALLBACK_POLICY decision.
     *
     * Include both the message tag and the message contents in the messageSentHandler callback.
     */
    MESSAGE_TAG_AND_CONTENTS_IN_CALLBACK = 0x41,
    /**
     * TC_KEY_REQUEST_POLICY decision.
     *
     * When the Trust Center receives a request for a Trust Center link key, it will be ignored.
     */
    DENY_TC_KEY_REQUESTS = 0x50,
    /**
     * TC_KEY_REQUEST_POLICY decision.
     *
     * When the Trust Center receives a request for a Trust Center link key, it will reply to it with the corresponding key.
     */
    ALLOW_TC_KEY_REQUESTS_AND_SEND_CURRENT_KEY = 0x51,
    /**
     * TC_KEY_REQUEST_POLICY decision.
     *
     * When the Trust Center receives a request for a Trust Center link key, it will generate a key to send to the joiner.
     * After generation, the key will be added to the transient key tabe and After verification, this key will be added into the link key table.
     */
    ALLOW_TC_KEY_REQUEST_AND_GENERATE_NEW_KEY = 0x52,
    /**
     * APP_KEY_REQUEST_POLICY decision.
     * When the Trust Center receives a request for an application link key, it will be ignored.
     * */
    DENY_APP_KEY_REQUESTS = 0x60,
    /**
     * APP_KEY_REQUEST_POLICY decision.
     *
     * When the Trust Center receives a request for an application link key, it will randomly generate a key and send it to both partners.
     */
    ALLOW_APP_KEY_REQUESTS = 0x61,
    /** Indicates that packet validate library checks are enabled on the NCP. */
    PACKET_VALIDATE_LIBRARY_CHECKS_ENABLED = 0x62,
    /** Indicates that packet validate library checks are NOT enabled on the NCP. */
    PACKET_VALIDATE_LIBRARY_CHECKS_DISABLED = 0x63,
}

/**
 * This is the policy decision bitmask that controls the trust center decision strategies.
 * The bitmask is modified and extracted from the EzspDecisionId for supporting bitmask operations.
 * uint16_t
 */
export enum EzspDecisionBitmask {
    /** Disallow joins and rejoins. */
    DEFAULT_CONFIGURATION = 0x0000,
    /** Send the network key to all joining devices. */
    ALLOW_JOINS = 0x0001,
    /** Send the network key to all rejoining devices. */
    ALLOW_UNSECURED_REJOINS = 0x0002,
    /** Send the network key in the clear. */
    SEND_KEY_IN_CLEAR = 0x0004,
    /** Do nothing for unsecured rejoins. */
    IGNORE_UNSECURED_REJOINS = 0x0008,
    /** Allow joins if there is an entry in the transient key table. */
    JOINS_USE_INSTALL_CODE_KEY = 0x0010,
    /** Delay sending the network key to a new joining device. */
    DEFER_JOINS = 0x0020,
}

/** Identifies a policy. */
export enum EzspPolicyId {
    /** Controls trust center behavior. */
    TRUST_CENTER_POLICY = 0x00,
    /** Controls how external binding modification requests are handled. */
    BINDING_MODIFICATION_POLICY = 0x01,
    /** Controls whether the Host supplies unicast replies. */
    UNICAST_REPLIES_POLICY = 0x02,
    /** Controls whether pollHandler callbacks are generated. */
    POLL_HANDLER_POLICY = 0x03,
    /** Controls whether the message contents are included in the messageSentHandler callback. */
    MESSAGE_CONTENTS_IN_CALLBACK_POLICY = 0x04,
    /** Controls whether the Trust Center will respond to Trust Center link key requests. */
    TC_KEY_REQUEST_POLICY = 0x05,
    /** Controls whether the Trust Center will respond to application link key requests. */
    APP_KEY_REQUEST_POLICY = 0x06,
    /**
     * Controls whether ZigBee packets that appear invalid are automatically dropped by the stack.
     * A counter will be incremented when this occurs.
     */
    PACKET_VALIDATE_LIBRARY_POLICY = 0x07,
    /** Controls whether the stack will process ZLL messages. */
    ZLL_POLICY = 0x08,
    /**
     * Controls whether Trust Center (insecure) rejoins for devices using the well-known link key are accepted.
     * If rejoining using the well-known key is allowed,
     * it is disabled again after sli_zigbee_allow_tc_rejoins_using_well_known_key_timeout_sec seconds.
     */
    TC_REJOINS_USING_WELL_KNOWN_KEY_POLICY = 0x09,
}

/** Identifies a value. */
export enum EzspValueId {
    /** The contents of the node data stack token. */
    TOKEN_STACK_NODE_DATA = 0x00,
    /** The types of MAC passthrough messages that the host wishes to receive. */
    MAC_PASSTHROUGH_FLAGS = 0x01,
    /**
     * The source address used to filter legacy EmberNet messages when the
     * EMBER_MAC_PASSTHROUGH_EMBERNET_SOURCE flag is set in MAC_PASSTHROUGH_FLAGS.
     */
    EMBERNET_PASSTHROUGH_SOURCE_ADDRESS = 0x02,
    /** The amount in bytes (max 2^16) of available general purpose heap memory. */
    BUFFER_HEAP_FREE_SIZE = 0x03,
    /** Selects sending synchronous callbacks in ezsp-uart. */
    UART_SYNCH_CALLBACKS = 0x04,
    /**
     * The maximum incoming transfer size for the local node.
     * Default value is set to 82 and does not use fragmentation. Sets the value in Node Descriptor.
     * To set, this takes the input of a uint8 array of length 2 where you pass the lower byte at index 0 and upper byte at index 1.
     */
    MAXIMUM_INCOMING_TRANSFER_SIZE = 0x05,
    /**
     * The maximum outgoing transfer size for the local node.
     * Default value is set to 82 and does not use fragmentation. Sets the value in Node Descriptor.
     * To set, this takes the input of a uint8 array of length 2 where you pass the lower byte at index 0 and upper byte at index 1.
     */
    MAXIMUM_OUTGOING_TRANSFER_SIZE = 0x06,
    /** A bool indicating whether stack tokens are written to persistent storage as they change. */
    STACK_TOKEN_WRITING = 0x07,
    /** A read-only value indicating whether the stack is currently performing a rejoin. */
    STACK_IS_PERFORMING_REJOIN = 0x08,
    /** A list of EmberMacFilterMatchData values. */
    MAC_FILTER_LIST = 0x09,
    /** The Ember Extended Security Bitmask. */
    EXTENDED_SECURITY_BITMASK = 0x0a,
    /** The node short ID. */
    NODE_SHORT_ID = 0x0b,
    /** The descriptor capability of the local node. Write only. */
    DESCRIPTOR_CAPABILITY = 0x0c,
    /** The stack device request sequence number of the local node. */
    STACK_DEVICE_REQUEST_SEQUENCE_NUMBER = 0x0d,
    /** Enable or disable radio hold-off. */
    RADIO_HOLD_OFF = 0x0e,
    /** The flags field associated with the endpoint data. */
    ENDPOINT_FLAGS = 0x0f,
    /** Enable/disable the Mfg security config key settings. */
    MFG_SECURITY_CONFIG = 0x10,
    /** Retrieves the version information from the stack on the NCP. */
    VERSION_INFO = 0x11,
    // NEXT_HOST_REJOIN_REASON              = 0x12,// v13-, unused
    /**
     * This is the reason that the last rejoin took place. This value may only be retrieved, not set.
     * The rejoin may have been initiated by the stack (NCP) or the application (host).
     * If a host initiated a rejoin the reason will be set by default to EMBER_REJOIN_DUE_TO_APP_EVENT_1.
     * If the application wishes to denote its own rejoin reasons it can do so by calling
     * ezspSetValue(EMBER_VALUE_HOST_REJOIN_REASON, EMBER_REJOIN_DUE_TO_APP_EVENT_X).
     * X is a number corresponding to one of the app events defined.
     * If the NCP initiated a rejoin it will record this value internally for retrieval by ezspGetValue(REAL_REJOIN_REASON).
     */
    LAST_REJOIN_REASON = 0x13,
    /** The next ZigBee sequence number. */
    NEXT_ZIGBEE_SEQUENCE_NUMBER = 0x14,
    /** CCA energy detect threshold for radio. */
    CCA_THRESHOLD = 0x15,
    /** The threshold value for a counter */
    SET_COUNTER_THRESHOLD = 0x17,
    /** Resets all counters thresholds to 0xFF */
    RESET_COUNTER_THRESHOLDS = 0x18,
    /** Clears all the counters */
    CLEAR_COUNTERS = 0x19,
    /** The node's new certificate signed by the CA. */
    CERTIFICATE_283K1 = 0x1a,
    /** The Certificate Authority's public key. */
    PUBLIC_KEY_283K1 = 0x1b,
    /** The node's new static private key. */
    PRIVATE_KEY_283K1 = 0x1c,
    // 0x1D?
    // 0x1E?
    // 0x1F?
    // 0x20?
    // 0x21?
    // 0x22?
    /** The NWK layer security frame counter value */
    NWK_FRAME_COUNTER = 0x23,
    /** The APS layer security frame counter value. Managed by the stack. Users should not set these unless doing backup and restore. */
    APS_FRAME_COUNTER = 0x24,
    /** Sets the device type to use on the next rejoin using device type */
    RETRY_DEVICE_TYPE = 0x25,
    // 0x26?
    // 0x27?
    // 0x28?
    /** Setting this byte enables R21 behavior on the NCP. */
    ENABLE_R21_BEHAVIOR = 0x29,
    /** Configure the antenna mode(0-don't switch,1-primary,2-secondary,3-TX antenna diversity). */
    ANTENNA_MODE = 0x30,
    /** Enable or disable packet traffic arbitration. */
    ENABLE_PTA = 0x31,
    /** Set packet traffic arbitration configuration options. */
    PTA_OPTIONS = 0x32,
    /** Configure manufacturing library options (0-non-CSMA transmits,1-CSMA transmits). To be used with Manufacturing Library. */
    MFGLIB_OPTIONS = 0x33,
    /**
     * Sets the flag to use either negotiated power by link power delta (LPD) or fixed power value provided by user
     * while forming/joining a network for packet transmissions on sub-ghz interface. This is mainly for testing purposes.
     */
    USE_NEGOTIATED_POWER_BY_LPD = 0x34,
    /** Set packet traffic arbitration PWM options. */
    PTA_PWM_OPTIONS = 0x35,
    /** Set packet traffic arbitration directional priority pulse width in microseconds. */
    PTA_DIRECTIONAL_PRIORITY_PULSE_WIDTH = 0x36,
    /** Set packet traffic arbitration phy select timeout(ms). */
    PTA_PHY_SELECT_TIMEOUT = 0x37,
    /** Configure the RX antenna mode: (0-do not switch; 1-primary; 2-secondary; 3-RX antenna diversity). */
    ANTENNA_RX_MODE = 0x38,
    /** Configure the timeout to wait for the network key before failing a join. Acceptable timeout range [3,255]. Value is in seconds. */
    NWK_KEY_TIMEOUT = 0x39,
    /**
     * The number of failed CSMA attempts due to failed CCA made by the MAC before continuing transmission with CCA disabled.
     * This is the same as calling the emberForceTxAfterFailedCca(uint8_t csmaAttempts) API. A value of 0 disables the feature.
     */
    FORCE_TX_AFTER_FAILED_CCA_ATTEMPTS = 0x3a,
    /**
     * The length of time, in seconds, that a trust center will store a transient link key that a device can use to join its network.
     * A transient key is added with a call to sl_zb_sec_man_import_transient_key. After the transient key is added,
     * it will be removed once this amount of time has passed. A joining device will not be able to use that key to join
     * until it is added again on the trust center.
     * The default value is 300 seconds (5 minutes).
     */
    TRANSIENT_KEY_TIMEOUT_S = 0x3b,
    /** Cumulative energy usage metric since the last value reset of the coulomb counter plugin. Setting this value will reset the coulomb counter. */
    COULOMB_COUNTER_USAGE = 0x3c,
    /**
     * When scanning, configure the maximum number of beacons to store in cache.
     * Each beacon consumes on average 32-bytes (+ buffer overhead) in RAM.
     */
    MAX_BEACONS_TO_STORE = 0x3d,
    /** Set the mask to filter out unacceptable child timeout options on a router. */
    END_DEVICE_TIMEOUT_OPTIONS_MASK = 0x3e,
    /** The end device keep-alive mode supported by the parent. */
    END_DEVICE_KEEP_ALIVE_SUPPORT_MODE = 0x3f,
    /**
     * Return the active radio config. Read only.
     * Values are 0: Default, 1: Antenna Diversity, 2: Co-Existence, 3: Antenna Diversity and Co-Existence.
     */
    ACTIVE_RADIO_CONFIG = 0x41,
    /** Return the number of seconds the network will remain open. A return value of 0 indicates that the network is closed. Read only. */
    NWK_OPEN_DURATION = 0x42,
    /**
     * Timeout in milliseconds to store entries in the transient device table.
     * If the devices are not authenticated before the timeout, the entry shall be purged
     */
    TRANSIENT_DEVICE_TIMEOUT = 0x43,
    /**
     * Return information about the key storage on an NCP.
     * Returns 0 if keys are in classic key storage, and 1 if they are located in PSA key storage. Read only.
     */
    KEY_STORAGE_VERSION = 0x44,
    /** Return activation state about TC Delayed Join on an NCP.  A return value of 0 indicates that the feature is not activated. */
    DELAYED_JOIN_ACTIVATION = 0x45,
    /**
     * v14+
     * The maximum number of NWK retries that will be attempted.
     */
    MAX_NWK_RETRIES = 0x46,
    /**
     * v14+
     * Policies for allowing/disallowing rejoins.
     */
    REJOIN_MODE = 0x47,
}

/**
 * Identifies a value based on specified characteristics.
 * Each set of characteristics is unique to that value and is specified during the call to get the extended value.
 *
 * uint16_t
 */
export enum EzspExtendedValueId {
    /** The flags field associated with the specified endpoint. Value is uint16_t */
    ENDPOINT_FLAGS = 0x0000,
    /**
     * This is the reason for the node to leave the network as well as the device that told it to leave.
     * The leave reason is the 1st byte of the value while the node ID is the 2nd and 3rd byte.
     * If the leave was caused due to an API call rather than an over the air message, the node ID will be EMBER_UNKNOWN_NODE_ID (0xFFFD).
     */
    LAST_LEAVE_REASON = 0x0001,
    /** This number of bytes of overhead required in the network frame for source routing to a particular destination. */
    GET_SOURCE_ROUTE_OVERHEAD = 0x0002,
}

/** Flags associated with the endpoint data configured on the NCP. */
export enum EzspEndpointFlag {
    /** Indicates that the endpoint is disabled and NOT discoverable via ZDO. */
    DISABLED = 0x00,
    /** Indicates that the endpoint is enabled and discoverable via ZDO. */
    ENABLED = 0x01,
}

/** Notes the last leave reason. uint8_t */
export enum EmberLeaveReason {
    REASON_NONE = 0,
    DUE_TO_NWK_LEAVE_MESSAGE = 1,
    DUE_TO_APS_REMOVE_MESSAGE = 2,
    // Currently, the stack does not process the ZDO leave message since it is optional.
    DUE_TO_ZDO_LEAVE_MESSAGE = 3,
    DUE_TO_ZLL_TOUCHLINK = 4,

    DUE_TO_APP_EVENT_1 = 0xff,
}

/** Notes the last rejoin reason. uint8_t */
export enum EmberRejoinReason {
    REASON_NONE = 0,
    DUE_TO_NWK_KEY_UPDATE = 1,
    DUE_TO_LEAVE_MESSAGE = 2,
    DUE_TO_NO_PARENT = 3,
    DUE_TO_ZLL_TOUCHLINK = 4,
    DUE_TO_END_DEVICE_REBOOT = 5,

    // App. Framework events
    // 0xA0 - 0xE0
    // See af.h for a subset of defined rejoin reasons

    // Customer-defined Events
    //   These are numbered down from 0xFF so their assigned values
    //   need not change if more application events are needed.
    DUE_TO_APP_EVENT_5 = 0xfb,
    DUE_TO_APP_EVENT_4 = 0xfc,
    DUE_TO_APP_EVENT_3 = 0xfd,
    DUE_TO_APP_EVENT_2 = 0xfe,
    DUE_TO_APP_EVENT_1 = 0xff,
}

/** Manufacturing token IDs used by ezspGetMfgToken(). */
export enum EzspMfgTokenId {
    /** Custom version (2 bytes). */
    CUSTOM_VERSION = 0x00,
    /** Manufacturing string (16 bytes). */
    STRING = 0x01,
    /** Board name (16 bytes). */
    BOARD_NAME = 0x02,
    /** Manufacturing ID (2 bytes). */
    MANUF_ID = 0x03,
    /** Radio configuration (2 bytes). */
    PHY_CONFIG = 0x04,
    /** Bootload AES key (16 bytes). */
    BOOTLOAD_AES_KEY = 0x05,
    /** ASH configuration (40 bytes). */
    ASH_CONFIG = 0x06,
    /** EZSP storage (8 bytes). */
    EZSP_STORAGE = 0x07,
    /**
     * Radio calibration data (64 bytes). 4 bytes are stored for each of the 16 channels.
     * This token is not stored in the Flash Information Area. It is updated by the stack each time a calibration is performed.
     */
    STACK_CAL_DATA = 0x08,
    /** Certificate Based Key Exchange (CBKE) data (92 bytes). */
    CBKE_DATA = 0x09,
    /** Installation code (20 bytes). */
    INSTALLATION_CODE = 0x0a,
    /**
     * Radio channel filter calibration data (1 byte).
     * This token is not stored in the Flash Information Area. It is updated by the stack each time a calibration is performed.
     */
    STACK_CAL_FILTER = 0x0b,
    /** Custom EUI64 MAC address (8 bytes). */
    CUSTOM_EUI_64 = 0x0c,
    /** CTUNE value (2 byte). */
    CTUNE = 0x0d,
}

export enum EzspSleepMode {
    /** Processor idle. */
    IDLE = 0x00,
    /** Wake on interrupt or timer. */
    DEEP_SLEEP = 0x01,
    /** Wake on interrupt only. */
    POWER_DOWN = 0x02,
    /** Reserved */
    RESERVED_SLEEP = 0x03,
}
