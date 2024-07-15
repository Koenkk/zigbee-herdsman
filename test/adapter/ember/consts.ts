import {ASH_VERSION} from '../../../src/adapter/ember/uart/consts';
import {AshFrameType, AshReservedByte, NcpFailedCode} from '../../../src/adapter/ember/uart/enums';

export const adapterSONOFFDongleE = {manufacturer: 'ITEAD', vendorId: '1a86', productId: '55d4'};
export const adapterHASkyConnect = {manufacturer: 'Nabu Casa', vendorId: '10c4', productId: 'ea60'};

/**
 * Bytes sent to NCP on init
 *
 * 1ac038bc7e
 */
export const SEND_RST_BYTES = [
    AshReservedByte.CANCEL, // 26 - 0x1a
    AshFrameType.RST, // 192 - 0xc0
    56, // CRC high - 0x38
    188, // CRC low - 0xbc
    AshReservedByte.FLAG, // 126 - 0x7e
];

/**
 * Pre-decoding values.
 *
 * [193, 2, 2, 155, 123, 126]
 *
 * 1ac1020b0a527e
 */
export const RECD_RSTACK_BYTES = [
    AshReservedByte.CANCEL, // 26 - 0x1a
    AshFrameType.RSTACK, // 193 - 0xc1
    ASH_VERSION, // 2 - 0x02
    NcpFailedCode.RESET_SOFTWARE, // 11 - 0x0b
    10, // CRC high - 0x0a
    82, // CRC low - 0x52
    AshReservedByte.FLAG, // 126 - 0x7e
];

/**
 * ACK following first DATA frame sent.
 *
 * ACK(1)+
 */
export const SEND_ACK_FIRST_BYTES = [
    AshFrameType.ACK + 1,
    0x60, // CRC High
    0x59, // CRC Low
    AshReservedByte.FLAG,
];

/**
 * ACK sent by ASH (Z2M) after RSTACK received.
 *
 * ACK(0)+
 */
export const ASH_ACK_FIRST_BYTES = [
    AshFrameType.ACK,
    0x70, // CRC High
    0x78, // CRC Low
    AshReservedByte.FLAG,
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
    0xa8, // CRC High
    0xbd, // CRC Low
    AshReservedByte.FLAG,
];

export const RCED_ERROR_WATCHDOG_BYTES = [
    AshFrameType.ERROR,
    ASH_VERSION,
    NcpFailedCode.RESET_WATCHDOG,
    0xd2, // CRC High
    0x0a, // CRC Low
    AshReservedByte.FLAG,
];

export const RCED_DATA_WITH_CRC_ERROR = Buffer.from('b658904124ab5593499cdd93623cd29874f5de5083f97b1e66efc9af417e', 'hex');

export const RCED_DATA_RETRY = Buffer.from('0eafb1a96b2a7d334fa674eb04aaa760499d4e27cdd9ce6192f2c46989fcfb817e', 'hex');

/** desiredProtocolVersion: 13 */
export const SEND_DATA_VERSION = Buffer.from('004221a8597c057e', 'hex');
/** protocolVersion: 13, stackType: 2, stackVersion: 29712 */
export const RCED_DATA_VERSION = Buffer.from('0142a1a8592805c6a8777e', 'hex');
export const RCED_DATA_VERSION_RES = [13, 2, 29712];

// [ZCL to=51678 apsFrame={"profileId":260,"clusterId":6,"sourceEndpoint":1,"destinationEndpoint":1,"options":4416,"groupId":0,"sequence":0} header={"frameControl":{"reservedBits":0,"frameType":1,"direction":0,"disableDefaultResponse":false,"manufacturerSpecific":false},"manufacturerCode":null,"transactionSequenceNumber":4,"commandIdentifier":0}]
// [FRAME: ID=52:"SEND_UNICAST" Seq=39 Len=25]
// [FRAME type=DATA frmTx=7 frmRx=0]
export const SEND_UNICAST_ASH_RAW = '706521a9602a156c90904b23aa5493098d4e27abeece648af9c677b97e';
// [FRAME type=DATA ackNum=0 frmNum=0]
export const SEND_UNICAST_REPLY_FN0_ASH_RAW = '0065a1a9602a15b25994d0954c7e';
// [FRAME: ID=52:"SEND_UNICAST" Seq=39 Len=10]
// [SENT type=DIRECT apsSequence=154 messageTag=3 status=OK]
export const SEND_UNICAST_REPLY_FN0_EZSP = '2780013400000000009a';

// [FRAME type=DATA ackNum=0 frmNum=1]
export const MESSAGE_SENT_HANDLER_FN1_ASH_RAW = '1065b1a96b2a15b259944afb6351934f9c4f26ebfcce677d31fec66357897e';
// [CBFRAME: ID=63:"MESSAGE_SENT_HANDLER" Seq=39 Len=26]
// ezspMessageSentHandler(): callback called with: [status=OK], [type=DIRECT], [indexOrDestination=51678], [apsFrame={"profileId":260,"clusterId":6,"sourceEndpoint":1,"destinationEndpoint":1,"options":4416,"groupId":0,"sequence":154}], [messageTag=3]
export const MESSAGE_SENT_HANDLER_FN1_EZSP = '2790013f000000000000dec9040106000101401100009a030000';

// [FRAME type=DATA ackNum=0 frmNum=2]
export const INCOMING_MESSAGE_HANDLER_FN2_ASH_RAW = '2065b1a97d312a15b658924a24ab5593499c3ef962edce678bfdc6638903813ca7edcdde6f8ae7c3d0d5d26b68937e';
// [CBFRAME: ID=69:"INCOMING_MESSAGE_HANDLER" Seq=39 Len=42]
// ezspIncomingMessageHandler(): callback called with: [type=UNICAST], [apsFrame={"profileId":260,"clusterId":6,"sourceEndpoint":1,"destinationEndpoint":1,"options":256,"groupId":0,"sequence":112}], [packetInfo:{"senderShortId":51678,"senderLongId":"0x0000000000000000","bindingIndex":255,"addressIndex":255,"lastHopLqi":3,"lastHopRssi":0,"lastHopTimestamp":6}], [messageContents=18040b0000]
// Received payload: clusterID=6, address=51678, groupID=0, endpoint=1, destinationEndpoint=1, wasBroadcast=false, linkQuality=3, frame={"header":{"frameControl":{"frameType":0,"manufacturerSpecific":false,"direction":1,"disableDefaultResponse":true,"reservedBits":0},"manufacturerCode":null,"transactionSequenceNumber":4,"commandIdentifier":11},"payload":{"cmdId":0,"statusCode":0},"command":{"ID":11,"name":"defaultRsp","parameters":[{"name":"cmdId","type":32},{"name":"statusCode","type":32}]}}
export const INCOMING_MESSAGE_HANDLER_FN2_EZSP = '2790014500000401060001010001000070dec90000000000000000ffff0300060000000518040b000002';

// [FRAME type=DATA ackNum=0 frmNum=0]
export const MESSAGE_SENT_HANDLER_FN0_ASH_RAW = '0065b1a96b2a15b259944afb6351934f9c4f26ebfcce6766fec66302907e';
// [CBFRAME: ID=63:"MESSAGE_SENT_HANDLER" Seq=39 Len=26]
// ezspMessageSentHandler(): callback called with: [status=OK], [type=DIRECT], [indexOrDestination=51678], [apsFrame={"profileId":260,"clusterId":6,"sourceEndpoint":1,"destinationEndpoint":1,"options":4416,"groupId":0,"sequence":237}], [messageTag=3]
export const MESSAGE_SENT_HANDLER_FN0_EZSP = '2790013f000000000000dec904010600010140110000ed030000';

// [FRAME: ID=85:"SET_POLICY" Seq=79 Len=7]
// [FRAME type=DATA frmTx=7 frmRx=0]
export const SET_POLICY_ASH_RAW = '700d21a9012a15b0f5667e';
// [FRAME type=DATA ackNum=0 frmNum=1]
export const SET_POLICY_REPLY_FN1_ASH_RAW = '100da1a9012a15b259944fb87e';
// [FRAME: ID=85:"SET_POLICY" Seq=79 Len=9]
export const SET_POLICY_REPLY_FN1_EZSP = '4f8001550000000000';
