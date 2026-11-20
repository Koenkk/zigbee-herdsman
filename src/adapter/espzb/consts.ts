/**
 * espzb protocol constants — ZNSP-compatible host <-> NCP protocol for ESP Zigbee SDK v2 NCPs (e.g. ESP32-S31).
 * Normative spec: espzb protocol 1.0 (docs/PROTOCOL.md in the espzb-ncp project).
 */

export const FrameType = {
    REQUEST: 0,
    RESPONSE: 1,
    NOTIFY: 2,
} as const;

export type FrameTypeValue = (typeof FrameType)[keyof typeof FrameType];

/** Command IDs: ZNSP (SDK v1.x) IDs are reused, espzb extensions live in 0x0E00-0x0EFF. */
export enum CommandId {
    NETWORK_INIT = 0x0000,
    NETWORK_START = 0x0001,
    NETWORK_STATE = 0x0002,
    NETWORK_STACK_STATUS_HANDLER = 0x0003,
    NETWORK_FORM = 0x0004,
    NETWORK_PERMIT_JOINING = 0x0005,
    NETWORK_JOIN = 0x0006,
    NETWORK_LEAVE = 0x0007,
    NETWORK_PAN_ID_GET = 0x000b,
    NETWORK_PAN_ID_SET = 0x000c,
    NETWORK_EXTENDED_PAN_ID_GET = 0x000d,
    NETWORK_EXTENDED_PAN_ID_SET = 0x000e,
    NETWORK_PRIMARY_CHANNEL_GET = 0x000f,
    NETWORK_PRIMARY_CHANNEL_SET = 0x0010,
    NETWORK_SECONDARY_CHANNEL_GET = 0x0011,
    NETWORK_SECONDARY_CHANNEL_SET = 0x0012,
    NETWORK_CHANNEL_GET = 0x0013,
    NETWORK_CHANNEL_SET = 0x0014,
    NETWORK_TXPOWER_GET = 0x0015,
    NETWORK_TXPOWER_SET = 0x0016,
    NETWORK_PRIMARY_KEY_GET = 0x0017,
    NETWORK_PRIMARY_KEY_SET = 0x0018,
    NETWORK_FRAME_COUNT_GET = 0x0019,
    NETWORK_FRAME_COUNT_SET = 0x001a,
    NETWORK_ROLE_GET = 0x001b,
    NETWORK_ROLE_SET = 0x001c,
    NETWORK_SHORT_ADDRESS_GET = 0x001d,
    NETWORK_LONG_ADDRESS_GET = 0x001f,
    NETWORK_LONG_ADDRESS_SET = 0x0020,
    NETWORK_UPDATE_ID_GET = 0x0023,
    NETWORK_UPDATE_ID_SET = 0x0024,
    NETWORK_TRUST_CENTER_ADDR_GET = 0x0025,
    NETWORK_TRUST_CENTER_ADDR_SET = 0x0026,
    NETWORK_LINK_KEY_GET = 0x0027,
    NETWORK_LINK_KEY_SET = 0x0028,
    NETWORK_SHORT_TO_IEEE = 0x002c,
    NETWORK_IEEE_TO_SHORT = 0x002d,
    ZCL_ENDPOINT_ADD = 0x0100,
    ZCL_ENDPOINT_DEL = 0x0101,
    APS_DATA_REQUEST = 0x0300,
    APS_DATA_INDICATION = 0x0301,
    APS_DATA_CONFIRM = 0x0302,
    EXT_GET_INFO = 0x0e00,
    EXT_RESET = 0x0e01,
    EXT_PING = 0x0e02,
    EXT_GET_STATS = 0x0e03,
    EXT_SET_LOG_LEVEL = 0x0e04,
    EXT_LOG = 0x0e05,
    EXT_BOOT = 0x0e06,
    EXT_FRAME_ERROR = 0x0e07,
    EXT_IC_ADD = 0x0e10,
    EXT_IC_REMOVE = 0x0e11,
    EXT_IC_CLEAR = 0x0e12,
    EXT_SECURITY_POLICY_SET = 0x0e13,
    EXT_NWK_KEY_INFO_GET = 0x0e20,
    EXT_NWK_KEY_SEQ_SET = 0x0e21,
    EXT_CHANNEL_CHANGE = 0x0e30,
    EXT_APP_SIGNAL = 0x0e40,
}

export enum EspZbStatus {
    SUCCESS = 0x00,
    ERR_FATAL = 0x01,
    BAD_ARGUMENT = 0x02,
    ERR_NO_MEM = 0x03,
    INVALID_STATE = 0x04,
    NOT_SUPPORTED = 0x05,
    BUSY = 0x06,
    NOT_FOUND = 0x07,
    TIMEOUT = 0x08,
    NETWORK_DOWN = 0x09,
}

export enum NetworkState {
    OFFLINE = 0x00,
    JOINING = 0x01,
    CONNECTED = 0x02,
    LEAVING = 0x03,
    NOT_STARTED = 0x10,
}

export enum Capability {
    BACKUP_RESTORE = 1 << 0,
    INSTALL_CODES = 1 << 1,
    LOCAL_ZDO = 1 << 2,
    CHANNEL_CHANGE = 1 << 3,
    APP_SIGNAL = 1 << 4,
    LOG = 1 << 5,
    STATS = 1 << 6,
    KEY_SEQ = 1 << 7,
    FRAME_ERROR_NOTIFY = 1 << 8,
}

/** `ezb_app_signal_type_t` values forwarded by EXT_APP_SIGNAL (group << 8 | id). */
export enum AppSignal {
    ZDO_SKIP_STARTUP = 0x0001,
    ZDO_LEAVE = 0x0003,
    ZDO_LEAVE_INDICATION = 0x0004,
    ZDO_DEVICE_ANNCE = 0x0005,
    ZDO_DEVICE_UNAVAILABLE = 0x0006,
    ZDO_DEVICE_UPDATE = 0x0007,
    ZDO_DEVICE_AUTHORIZED = 0x0008,
    BDB_DEVICE_FIRST_START = 0x0100,
    BDB_DEVICE_REBOOT = 0x0101,
    BDB_STEERING = 0x0102,
    BDB_FORMATION = 0x0103,
    NWK_NETWORK_STATUS = 0x0203,
    NWK_PERMIT_JOIN_STATUS = 0x0204,
}

/** `ezb_zdo_upddev_status_t` */
export enum DeviceUpdateStatus {
    SECURE_REJOIN = 0,
    UNSECURE_JOIN = 1,
    DEVICE_LEFT = 2,
    TC_REJOIN = 3,
}

export const TC_ACTION_ACCEPT = 0;

/** `ezb_apsde_tx_opt_t` */
export const APS_TX_OPT_SECURITY = 0x01;
export const APS_TX_OPT_ACK = 0x04;
export const APS_TX_OPT_FRAGMENTATION = 0x08;

/** APS address modes (`ezb_addr_mode_t`). */
export const ADDR_MODE_GROUP = 1;
export const ADDR_MODE_SHORT = 2;
export const ADDR_MODE_EXT = 3;

export const EXT_VERSION_MAJOR = 1;

/** Zigbee status values (APSDE-DATA.confirm) after which a retransmission can succeed. */
export const RECOVERABLE_CONFIRM_STATUSES: readonly number[] = [
    0xa7, // APS_NO_ACK
    0xd0, // NWK_ROUTE_DISCOVERY_FAILED
    0xd1, // NWK_ROUTE_ERROR
    0xe1, // MAC_CHANNEL_ACCESS_FAILURE
    0xe9, // MAC_NO_ACK
    0xf0, // MAC_TRANSACTION_EXPIRED
    0xf1, // MAC_TRANSACTION_OVERFLOW
    0xff, // NCP: stack never confirmed
];

/** Response timeout per attempt (the NCP answers within 200 ms). */
export const REQUEST_TIMEOUT_MS = 2000;
/** Retransmissions of an unanswered request (same sn, the NCP de-duplicates). */
export const REQUEST_RETRIES = 2;
/** NCP completes unconfirmed APS requests after 30 s; allow margin. */
export const APS_CONFIRM_TIMEOUT_MS = 35000;
export const STARTUP_TIMEOUT_MS = 30000;
export const ZDO_RESPONSE_TIMEOUT_MS = 15000;
export const WATCHDOG_INTERVAL_MS = 60000;
export const WATCHDOG_MAX_FAILURES = 3;
export const BUSY_BACKOFF_MS = 250;
/** APS submissions attempted while the NCP reports BUSY (in-flight table full), with linear back-off. */
export const MAX_BUSY_ATTEMPTS = 10;
export const MAX_SEND_ATTEMPTS = 3;
/** Added to a backed-up NWK frame counter before restoring (frames may have been sent after the last backup). */
export const FRAME_COUNTER_RESTORE_MARGIN = 2500;
