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
    NCP_RESET_IND = 0x002B,
};