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
 * ACK sent by NCP after first DATA frame received.
 * 
 * ACK(1)+
 */
export const NCP_ACK_FIRST = [
    AshFrameType.ACK + 1,
    0x60,// CRC High
    0x59,// CRC Low
    AshReservedByte.FLAG
];
