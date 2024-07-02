import {EZSP_MAX_FRAME_LENGTH, EZSP_MIN_FRAME_LENGTH} from '../ezsp/consts';

/**
 * Define the size of the receive buffer pool on the EZSP host.
 *
 * The number of receive buffers does not need to be greater than the number of packet buffers available on the NCP,
 * because this in turn is the maximum number of callbacks that could be received between commands.
 * In reality a value of 20 is a generous allocation.
 */
export const EZSP_HOST_RX_POOL_SIZE = 32;
/**
 * The number of transmit buffers must be set to the number of receive buffers
 * -- to hold the immediate ACKs sent for each callabck frame received --
 * plus 3 buffers for the retransmit queue and one each for an automatic ACK
 * (due to data flow control) and a command.
 */
export const TX_POOL_BUFFERS = EZSP_HOST_RX_POOL_SIZE + 5;

/** protocol version */
export const ASH_VERSION = 2;

/**
 * Timeouts before link is judged down.
 *
 * Consecutive ACK timeouts (minus 1) needed to enter the ERROR state.
 *
 * Is 3 in ash-ncp.h
 */
export const ASH_MAX_TIMEOUTS = 6;
/** max time in msecs for ncp to wake */
export const ASH_MAX_WAKE_TIME = 150;

/**
 * Define the units used by the Not Ready timer as 2**n msecs
 * log2 of msecs per NR timer unit
 */
export const ASH_NR_TIMER_BIT = 4;

/** Control byte mask for DATA frame */
export const ASH_DFRAME_MASK = 0x80;
/** Control byte mask for short frames (ACK/NAK) */
export const ASH_SHFRAME_MASK = 0xe0;

/** Acknowledge frame number */
export const ASH_ACKNUM_MASK = 0x07;
export const ASH_ACKNUM_BIT = 0;
/** Retransmitted frame flag */
export const ASH_RFLAG_MASK = 0x08;
export const ASH_RFLAG_BIT = 3;
/** Receiver not ready flag */
export const ASH_NFLAG_MASK = 0x08;
export const ASH_NFLAG_BIT = 3;
/** Reserved for future use */
export const ASH_PFLAG_MASK = 0x10;
export const ASH_PFLAG_BIT = 4;
/** DATA frame number */
export const ASH_FRMNUM_MASK = 0x70;
export const ASH_FRMNUM_BIT = 4;

/**
 * The wake byte special function applies only when in between frames,
 * so it does not need to be escaped within a frame.
 * (also means NCP data pending)
 */
export const ASH_WAKE = 0xff; /*!<   */

/** Constant used in byte-stuffing (XOR mask used in byte stuffing) */
export const ASH_FLIP = 0x20;

// Field and frame lengths, excluding flag byte and any byte stuffing overhead
// All limits are inclusive
export const ASH_MIN_DATA_FIELD_LEN = EZSP_MIN_FRAME_LENGTH;
export const ASH_MAX_DATA_FIELD_LEN = EZSP_MAX_FRAME_LENGTH;
/** with control */
export const ASH_MIN_DATA_FRAME_LEN = ASH_MIN_DATA_FIELD_LEN + 1;
/** control plus data field, but not CRC */
export const ASH_MIN_FRAME_LEN = 1;
export const ASH_MAX_FRAME_LEN = ASH_MAX_DATA_FIELD_LEN + 1;
export const ASH_CRC_LEN = 2;
export const ASH_MIN_FRAME_WITH_CRC_LEN = ASH_MIN_FRAME_LEN + ASH_CRC_LEN;
export const ASH_MAX_FRAME_WITH_CRC_LEN = ASH_MAX_FRAME_LEN + ASH_CRC_LEN;

// Lengths for each frame type: includes control and data field (if any), excludes the CRC and flag bytes
/** ash frame len data min */
export const ASH_FRAME_LEN_DATA_MIN = ASH_MIN_DATA_FIELD_LEN + 1;
/** [control] */
export const ASH_FRAME_LEN_ACK = 1;
/** [control] */
export const ASH_FRAME_LEN_NAK = 1;
/** [control] */
export const ASH_FRAME_LEN_RST = 1;
/** [control, version, reset reason] */
export const ASH_FRAME_LEN_RSTACK = 3;
/** [control, version, error] */
export const ASH_FRAME_LEN_ERROR = 3;

// Define lengths of short frames - includes control byte and data field
/** longest non-data frame sent */
export const SH_TX_BUFFER_LEN = 2;
/** longest non-data frame received */
export const SH_RX_BUFFER_LEN = 3;

// Define constants for the LFSR in randomizeBuffer()
/** polynomial */
export const LFSR_POLY = 0xb8;
/** initial value (seed) */
export const LFSR_SEED = 0x42;

export const VALID_BAUDRATES = [600, 1200, 2400, 4800, 9600, 19200, 38400, 57600, 115200, 230400, 460800];
