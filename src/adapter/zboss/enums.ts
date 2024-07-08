/**
 * Enum of the status
 */
export enum Status {
    SUCCESS = 0x00,
    FAILURE = 0x01,
    BAD_ARGUMENT = 0x02,
    TIMEOUT = 0x03,
    UNSUPPORTED = 0x04,
    ERROR = 0x05,
    NO_NETWORK = 0x06,
    BUSY = 0x07,
};

/**
 * Enum of the network state
 */
export enum NetworkState {
    OFFLINE = 0x00,                      /*!< The network is offline */
    JOINING = 0x01,                      /*!< Joinging the network */
    CONNECTED = 0x02,                    /*!< Conneted with the network */
    LEAVING = 0x03,                      /*!< Leaving the network */
    CONFIRM = 0x04,                      /*!< Confirm the APS */
    INDICATION = 0x05,                   /*!< Indication the APS */
};

/**
 * Enum of the network security mode 
 */
export enum EspNCPSecur {
    ESP_NCP_NO_SECURITY = 0x00,                  /*!< The network is no security mode */
    ESP_NCP_PRECONFIGURED_NETWORK_KEY = 0x01,    /*!< Pre-configured the network key */
    ESP_NCP_NETWORK_KEY_FROM_TC = 0x02,
    ESP_NCP_ONLY_TCLK = 0x03,
};


/**
 * Enum of the event id for NCP.
 *
 */
// export enum EspNCPEvent {
//     NCP_EVENT_INPUT,                /*!< Input event from NCP to host */
//     NCP_EVENT_OUTPUT,               /*!< Output event from host to NCP */
//     NCP_EVENT_RESET,                /*!< Reset event from host to NCP */
//     NCP_EVENT_LOOP_STOP,            /*!< Stop loop event from host to NCP */
// } esp_ncp_event_t;


/**
 * Enum of the device type
 */
export enum DeviceType {
    COORDINATOR = 0x00,
    ROUTER = 0x01,
    ED = 0x02,
};

export enum CommandId {
    NETWORK_INIT = 0x0000,
    START = 0x0001,
    NETWORK_STATE = 0x0002,
    STACK_STATUS_HANDLER = 0x0003,
    FORM_NETWORK = 0x0004,
    PERMIT_JOINING = 0x0005,
    JOIN_NETWORK = 0x0006,
    LEAVE_NETWORK = 0x0007,
    START_SCAN = 0x0008,
    SCAN_COMPLETE_HANDLER = 0x0009,
    STOP_SCAN = 0x000A,
    PANID_GET = 0x000B,
    PANID_SET = 0x000C,
    EXTPANID_GET = 0x000D,
    EXTPANID_SET = 0x000E,
    PRIMARY_CHANNEL_MASK_GET = 0x000F,
    PRIMARY_CHANNEL_MASK_SET = 0x0010,
    SECONDARY_CHANNEL_MASK_GET = 0x0011,
    SECONDARY_CHANNEL_MASK_SET = 0x0012,
    CURRENT_CHANNEL_GET = 0x0013,
    CURRENT_CHANNEL_SET = 0x0014,
    TX_POWER_GET = 0x0015,
    TX_POWER_SET = 0x0016,
    NETWORK_KEY_GET = 0x0017,
    NETWORK_KEY_SET = 0x0018,
    NWK_FRAME_COUNTER_GET = 0x0019,
    NWK_FRAME_COUNTER_SET = 0x001A,
    NETWORK_ROLE_GET = 0x001B,
    NETWORK_ROLE_SET = 0x001C,
    SHORT_ADDR_GET = 0x001D,
    SHORT_ADDR_SET = 0x001E,
    LONG_ADDR_GET = 0x001F,
    LONG_ADDR_SET = 0x0020,
    CHANNEL_MASKS_GET = 0x0021,
    CHANNEL_MASKS_SET = 0x0022,
    NWK_UPDATE_ID_GET = 0x0023,
    NWK_UPDATE_ID_SET = 0x0024,
    TRUST_CENTER_ADDRESS_GET = 0x0025,
    TRUST_CENTER_ADDRESS_SET = 0x0026,
    LINK_KEY_GET = 0x0027,
    LINK_KEY_SET = 0x0028,
    SECURITY_MODE_GET = 0x0029,
    SECURITY_MODE_SET = 0x002A,
    USE_PREDEFINED_NWK_PANID_SET = 0x002B,
    SHORT_TO_IEEE = 0x002C,
    IEEE_TO_SHORT = 0x002D,
    ADD_ENDPOINT = 0x0100,
    REMOVE_ENDPOINT = 0x0101,
    ATTRIBUTE_READ = 0x0102,
    ATTRIBUTE_WRITE = 0x0103,
    ATTRIBUTE_REPORT = 0x0104,
    ATTRIBUTE_DISCOVER = 0x0105,
    APS_READ = 0x0106,
    APS_WRITE = 0x0107,
    REPORT_CONFIG = 0x0108,
    BIND_SET = 0x0200,
    UNBIND_SET = 0x0201,
    FIND_MATCH = 0x0202,
    APS_DATA_REQUEST = 0x0300,
    APS_DATA_INDICATION = 0x0301,
    APS_DATA_CONFIRM = 0x0302,
    SYSTEM_RESET = 0x0400,
    SYSTEM_FACTORY = 0x0401,
    SYSTEM_FIRMWARE = 0x0402,
    SYSTEM_MODEL = 0x0403,
    SYSTEM_MANUFACTURER = 0x0404,
};