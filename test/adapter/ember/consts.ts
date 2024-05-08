import {ASH_VERSION} from "../../../src/adapter/ember/uart/consts";
import {AshFrameType, AshReservedByte, NcpFailedCode} from "../../../src/adapter/ember/uart/enums";


export const adapterSONOFFDongleE = {manufacturer: 'ITEAD', vendorId: '1a86', productId: '55d4'};
export const adapterHASkyConnect = {manufacturer: 'Nabu Casa', vendorId: '10c4', productId: 'ea60'};

/**
 * Bytes sent to NCP on init
 * 
 * 1ac038bc7e
 */
export const SEND_RST_BYTES = [
    AshReservedByte.CANCEL,// 26 - 0x1a
    AshFrameType.RST,// 192 - 0xc0
    56,// CRC high - 0x38
    188,// CRC low - 0xbc
    AshReservedByte.FLAG,// 126 - 0x7e
];

/**
 * Pre-decoding values.
 * 
 * [193, 2, 2, 155, 123, 126]
 * 
 * 1ac1020b0a527e
 */
export const RECD_RSTACK_BYTES = [
    AshReservedByte.CANCEL,// 26 - 0x1a
    AshFrameType.RSTACK,// 193 - 0xc1
    ASH_VERSION,// 2 - 0x02
    NcpFailedCode.RESET_SOFTWARE,// 11 - 0x0b
    10,// CRC high - 0x0a
    82,// CRC low - 0x52
    AshReservedByte.FLAG,// 126 - 0x7e
];

/**
 * ACK following first DATA frame sent.
 * 
 * ACK(1)+
 */
export const SEND_ACK_FIRST_BYTES = [
    AshFrameType.ACK + 1,
    0x60,// CRC High
    0x59,// CRC Low
    AshReservedByte.FLAG
];

/**
 * ACK sent by ASH (Z2M) after RSTACK received.
 * 
 * ACK(0)+
 */
export const ASH_ACK_FIRST_BYTES = [
    AshFrameType.ACK,
    0x70,// CRC High
    0x78,// CRC Low
    AshReservedByte.FLAG
];

/**
 * Pre-decoding values.
 * 
 * [194, 2, 81, 168, 189, 126]
 * 
 * c20251a8bd7e
 */
export const RECD_ERROR_ACK_TIMEOUT_BYTES = [
    AshFrameType.ERROR,
    ASH_VERSION,
    NcpFailedCode.ERROR_EXCEEDED_MAXIMUM_ACK_TIMEOUT_COUNT,
    0xA8,// CRC High
    0xBD,// CRC Low
    AshReservedByte.FLAG,
];

export const RCED_ERROR_WATCHDOG_BYTES = [
    AshFrameType.ERROR,
    ASH_VERSION,
    NcpFailedCode.RESET_WATCHDOG,
    0xD2,// CRC High
    0x0A,// CRC Low
    AshReservedByte.FLAG,
];

export const RCED_DATA_WITH_CRC_ERROR = Buffer.from('b658904124ab5593499cdd93623cd29874f5de5083f97b1e66efc9af417e', 'hex');

export const RCED_DATA_RETRY = Buffer.from('0eafb1a96b2a7d334fa674eb04aaa760499d4e27cdd9ce6192f2c46989fcfb817e', 'hex');

/** desiredProtocolVersion: 13 */
export const SEND_DATA_VERSION = Buffer.from('004221a8597c057e', 'hex');
/** protocolVersion: 13, stackType: 2, stackVersion: 29712 */
export const RCED_DATA_VERSION = Buffer.from('0142a1a8592805c6a8777e', 'hex');
export const RCED_DATA_VERSION_RES = [13, 2, 29712];
