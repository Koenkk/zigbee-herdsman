//-------------------------------------------------------------------------------------------------
// ASH Protocol

/**
 * Marks the end of a frame.
 * 
 * When a Flag Byte is received, the data received since the last Flag Byte or Cancel Byte
 * is tested to see whether it is a valid frame.
 */
export const ASH_FLAG = 0x7E;
/**
 * Indicates that the following byte is escaped.
 * 
 * If the byte after the Escape Byte is not a reserved byte,
 * bit 5 of the byte is complemented to restore its original value.
 * If the byte after the Escape Byte is a reserved value, the Escape Byte has no effect.
 */
export const ASH_ESCAPE = 0x7D;
/**
 * Terminates a frame in progress.
 * 
 * A Cancel Byte causes all data received since the previous Flag Byte to be ignored.
 * Note that as a special case, RST and RSTACK frames are preceded by Cancel Bytes to ignore any link startup noise.
 */
export const ASH_CANCEL = 0x1A;
/**
 * Resume transmission.
 * 
 * Used in XON/XOFF flow control. Always ignored if received by the NCP.
 */
export const ASH_XON = 0x11;
/**
 * Stop transmission.
 * 
 * Used in XON/XOFF flow control. Always ignored if received by the NCP
 */
export const ASH_XOFF = 0x13;
/**
 * Replaces a byte received with a low-level communication error (e.g., framing error) from the UART.
 * 
 * When a Substitute Byte is processed, the data between the previous and the next Flag Bytes is ignored.
 */
export const ASH_SUBSTITUTE = 0x18;


/** Constant used in byte-stuffing (XOR mask used in byte stuffing) */
export const ASH_FLIP = 0x20;


/**
 * The wake byte special function applies only when in between frames, so it does not need to be escaped within a frame.
 * (also means NCP data pending)
 */
export const ASH_WAKE = 0xFF;

export const RESERVED = [ASH_FLAG, ASH_ESCAPE, ASH_XON, ASH_XOFF, ASH_SUBSTITUTE, ASH_CANCEL];

/** Acknowledge frame number mask */
export const ASH_ACKNUM_MASK = 0x07;
/** Acknowledge frame number bit */
export const ASH_ACKNUM_BIT  = 0;

/** Retransmitted frame flag mask */
export const ASH_RFLAG_MASK  = 0x08;
/** Retransmitted frame flag bit */
export const ASH_RFLAG_BIT   = 3;

/** Receiver not ready flag mask */
export const ASH_NFLAG_MASK  = 0x08;
/** Receiver not ready flag bit */
export const ASH_NFLAG_BIT   = 3;

/** Reserved for future use */
export const ASH_PFLAG_MASK  = 0x10;
/** Reserved for future use */
export const ASH_PFLAG_BIT   = 4;

/** DATA frame number mask */
export const ASH_FRMNUM_MASK = 0x70;
/** DATA frame number bit */
export const ASH_FRMNUM_BIT  = 4;

/** [control, data*3, crc high, crc low, flag] */
export const ASH_FRAME_LEN_DATA_MIN  = 7;
/** [control, data*128, crc high, crc low, flag] */
export const ASH_FRAME_LEN_DATA_MAX  = 132;
/** [control, crc high, crc low, flag] */
export const ASH_FRAME_LEN_ACK       = 4;
/** [control, crc high, crc low, flag] */
export const ASH_FRAME_LEN_NAK       = 4;
/** [control, crc high, crc low, flag] */
export const ASH_FRAME_LEN_RST       = 4;
/** [control, version, reset code, crc high, crc low, flag] */
export const ASH_FRAME_LEN_RSTACK    = 6;
/** [control, version, error code, crc high, crc low, flag] */
export const ASH_FRAME_LEN_ERROR     = 6;

/**
 * Identify the type of frame from control byte.
 * 
 * Control byte formats
 *  +---------+----+----+----+----+----+----+----+----++---------+
 *  |         | B7 | B6 | B5 | B4 | B3 | B2 | B1 | B0 ||  Range  |
 *  +---------+----+----+----+----+----+----+----+----++---------+
 *  | DATA    |  0 |   frameNum   | rF |    ackNum    ||0x00-0x7F|
 *  +---------+----+----+----+----+----+----+----+----++---------+
 *  | ACK     |  1 |  0 |  0 | pF | nF |    ackNum    ||0x80-0x9F|
 *  | NAK     |  1 |  0 |  1 | pF | nF |    ackNum    ||0xA0-0xBF|
 *  +---------+----+----+----+----+----+----+----+----++---------+
 *  | RST     |  1 |  1 |  0 |  0 |  0 |  0 |  0 |  0 ||   0xC0  |
 *  | RSTACK  |  1 |  1 |  0 |  0 |  0 |  0 |  0 |  1 ||   0xC1  |
 *  | ERROR   |  1 |  1 |  0 |  0 |  0 |  0 |  1 |  0 ||   0xC2  |
 *  +---------+----+----+----+----+----+----+----+----++---------+
 *           rF = rFlag (retransmission flag)
 *           nF = nFlag (receiver not ready flag, always 0 in frames sent by the NCP)
 *           pF = flag reserved for future use
 *           frameNum = DATA frame’s 3-bit sequence number
 *           ackNum = acknowledges receipt of DATA frames up to, but not including, ackNum
 *  Control byte values 0xC3-0xFE are unused, 0xFF is reserved.
 */
export enum AshFrameType {
    INVALID = -1,
    /**
     * Carries all EZSP frames.
     * 
     * [CONTROL, EZSP 0, EZSP 1, EZSP 2, EZSP n, CRC high, CRC low, FLAG]
     * 
     * Notation used in documentation: DATA(F, A, R)
     * - F: frame number (frmNum)
     * - A: acknowledge number (ackNum)
     * - R: retransmit flag (reTx)
     * 
     * Example without pseudo-random sequence applied to Data Field:
     * - EZSP “version” command: 00 00 00 02
     * - DATA(2, 5, 0) = 25 00 00 00 02 1A AD 7E
     * - EZSP “version” response: 00 80 00 02 02 11 30
     * - DATA(5, 3, 0) = 53 00 80 00 02 02 11 30 63 16 7E
     * 
     * Example with pseudo-random sequence applied to Data Field:
     * - EZSP “version” command: 00 00 00 02
     * - DATA(2, 5, 0) = 25 42 21 A8 56 A6 09 7E
     * - EZSP “version” response: 00 80 00 02 02 11 30
     * - DATA(5, 3, 0) = 53 42 A1 A8 56 28 04 82 96 23 7E
     * 
     * Sent by: NCP, Host
     */
    DATA = 0,
    /**
     * Acknowledges receipt of a valid DATA frame.
     * 
     * [CONTROL, CRC high, CRC low, FLAG]
     * 
     * Notation used in documentation: ACK(A)+/-
     * - A: acknowledge number (ackNum)
     * - +/-: not ready flag (nRdy); “+” = “0” = “ready”; “-” = “1” = “not ready”
     * 
     * Examples:
     * - ACK(1)+ :81 60 59 7E
     * - ACK(6)– : 8E 91 B6 7E
     * 
     * Sent by: NCP, Host
     */
    ACK = 0x80,// 0b10000000
    /**
     * Indicates receipt of a DATA frame with an error or that was discarded due to lack of memory.
     * 
     * [CONTROL, CRC high, CRC low, FLAG]
     * 
     * Notation used in documentation: NAK(A)+/-
     * - A: acknowledge number (ackNum)
     * - +/-: not ready flag (nRdy); “+” = “0” = “ready”; “-” = “1” = “not ready”
     * 
     * Examples:
     * - NAK(6)+ : A6 34 DC 7E
     * - NAK(5)- : AD 85 B7 7E
     * 
     * Sent by: NCP, Host
     */
    NAK = 0xA0,// 0b10100000
    /**
     * Requests the NCP to perform a software reset (valid even if the NCP is in the FAILED state).
     * 
     * [CONTROL, CRC high, CRC low, FLAG]
     * 
     * Notation used in documentation: RST()
     * 
     * Example: C0 38 BC 7E
     * 
     * Sent by: Host
     */
    RST = 0xC0,// 0b11000000
    /**
     * Informs the Host that the NCP has reset and the reason for the reset.
     * 
     * [CONTROL, version, reset code, CRC high, CRC low, FLAG]
     * 
     * Notation used in documentation: RSTACK(V, C)
     * - V: version
     * - C: reset code
     * 
     * Example: C1 02 02 9B 7B 7E
     * 
     * Sent by: NCP
     */
    RSTACK = 0xC1,// 0b11000001
    /**
     * Informs the Host that the NCP detected a fatal error and is in the FAILED state.
     * 
     * [CONTROL, version, error code, CRC high, CRC low, FLAG]
     * 
     * Notation used in documentation: ERROR(V, C)
     * - V: version
     * - C: reset code
     * 
     * Example: C2 01 52 FA BD 7E
     * 
     * Sent by: NCP
     */
    ERROR = 0xC2,// 0b11000010
};


//-------------------------------------------------------------------------------------------------
// EZSP Protocol

/** EZSP Sequence Index for both legacy and extended frame format */
export const EZSP_SEQUENCE_INDEX = 0;
// Legacy EZSP Frame Format
export const EZSP_FRAME_CONTROL_INDEX = 1;
export const EZSP_FRAME_ID_INDEX      = 2;
export const EZSP_PARAMETERS_INDEX    = 3;
// Extended EZSP Frame Format
export const EZSP_EXTENDED_FRAME_CONTROL_LB_INDEX = 1;
export const EZSP_EXTENDED_FRAME_CONTROL_HB_INDEX = 2;
export const EZSP_EXTENDED_FRAME_ID_LB_INDEX      = 3;
export const EZSP_EXTENDED_FRAME_ID_HB_INDEX      = 4;
export const EZSP_EXTENDED_PARAMETERS_INDEX       = 5;

//---- Frame Control Lower Byte (LB) Definitions

/**
 * The high bit of the frame control lower byte indicates the direction of the
 * message. Commands are sent from the Host to the EM260. Responses are sent
 * from the EM260 to the Host.
 */
export const EZSP_FRAME_CONTROL_DIRECTION_MASK = 0x80;
export const EZSP_FRAME_CONTROL_COMMAND        = 0x00;
export const EZSP_FRAME_CONTROL_RESPONSE       = 0x80;

/**
 * Bits 5 and 6 of the frame control lower byte carry the network index the ezsp
 * message is related to. The NCP upon processing an incoming EZSP command,
 * temporary switches the current network to the one indicated in the EZSP
 * frame control.
 */
export const EZSP_FRAME_CONTROL_NETWORK_INDEX_MASK   = 0x60;
export const EZSP_FRAME_CONTROL_NETWORK_INDEX_OFFSET = 5;

//---- Command Frame Control Fields

/**
 * The EM260 enters the sleep mode specified by the command frame control once
 * it has sent its response.
 */
export const EZSP_FRAME_CONTROL_SLEEP_MODE_MASK = 0x03;

//---- Response Frame Control Fields

/**
 * The overflow flag in the response frame control indicates to the Host that
 * one or more callbacks occurred since the previous response and there was not
 * enough memory available to report them to the Host.
 */
export const EZSP_FRAME_CONTROL_OVERFLOW_MASK = 0x01;
export const EZSP_FRAME_CONTROL_NO_OVERFLOW   = 0x00;
export const EZSP_FRAME_CONTROL_OVERFLOW      = 0x01;

/**
 * The truncated flag in the response frame control indicates to the Host that
 * the response has been truncated. This will happen if there is not enough
 * memory available to complete the response or if the response would have
 * exceeded the maximum EZSP frame length.
 */
export const EZSP_FRAME_CONTROL_TRUNCATED_MASK = 0x02;
export const EZSP_FRAME_CONTROL_NOT_TRUNCATED  = 0x00;
export const EZSP_FRAME_CONTROL_TRUNCATED      = 0x02;

/**
 * The pending callbacks flag in the response frame control lower byte indicates
 * to the Host that there is at least one callback ready to be read. This flag is
 * clear if the response to a callback command read the last pending callback.
 */
export const EZSP_FRAME_CONTROL_PENDING_CB_MASK = 0x04;
export const EZSP_FRAME_CONTROL_PENDING_CB      = 0x04;
export const EZSP_FRAME_CONTROL_NO_PENDING_CB   = 0x00;

/**
 * The synchronous callback flag in the response frame control lower byte indicates
 * this ezsp frame is the response to an ezspCallback().
 */
export const EZSP_FRAME_CONTROL_SYNCH_CB_MASK = 0x08;
export const EZSP_FRAME_CONTROL_SYNCH_CB      = 0x08;
export const EZSP_FRAME_CONTROL_NOT_SYNCH_CB  = 0x00;

/**
 * The asynchronous callback flag in the response frame control lower byte indicates
 * this ezsp frame is a callback sent asynchronously by the ncp. This flag may
 * be set only in the uart version when EZSP_VALUE_UART_SYNCH_CALLBACKS is 0.
 */
export const EZSP_FRAME_CONTROL_ASYNCH_CB_MASK = 0x10;
export const EZSP_FRAME_CONTROL_ASYNCH_CB      = 0x10;
export const EZSP_FRAME_CONTROL_NOT_ASYNCH_CB  = 0x00;

//---- Frame Control Higher Byte (HB) Definitions

/**
 * Bit 7 of the frame control higher byte indicates whether security is
 * enabled or not.
 */
export const EZSP_EXTENDED_FRAME_CONTROL_SECURITY_MASK = 0x80;
export const EZSP_EXTENDED_FRAME_CONTROL_SECURE        = 0x80;
export const EZSP_EXTENDED_FRAME_CONTROL_UNSECURE      = 0x00;

/**
 * Bit 6 of the frame control higher byte indicates whether padding is
 * enabled or not.
 */
export const EZSP_EXTENDED_FRAME_CONTROL_PADDING_MASK = 0x40;
export const EZSP_EXTENDED_FRAME_CONTROL_PADDED       = 0x40;
export const EZSP_EXTENDED_FRAME_CONTROL_UNPADDED     = 0x00;

/**
 * Bits 0 and 1 of the frame control higher byte indicates the
 * frame format version.
 */
export const EZSP_EXTENDED_FRAME_FORMAT_VERSION_MASK = 0x03;
export const EZSP_EXTENDED_FRAME_FORMAT_VERSION      = 0x01;

/**
 * Reserved bits 2-5
 */
export const EZSP_EXTENDED_FRAME_CONTROL_RESERVED_MASK = 0x3C;
