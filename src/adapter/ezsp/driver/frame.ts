/* istanbul ignore file */
import {
    ASH_ACKNUM_BIT,
    ASH_ACKNUM_MASK,
    ASH_FRAME_LEN_ACK,
    ASH_FRAME_LEN_DATA_MIN,
    ASH_FRAME_LEN_ERROR,
    ASH_FRAME_LEN_NAK,
    ASH_FRAME_LEN_RSTACK,
    ASH_FRMNUM_BIT,
    ASH_FRMNUM_MASK,
    ASH_RFLAG_BIT,
    ASH_RFLAG_MASK,
    AshFrameType
} from "./consts";
import crc16ccitt from "./utils/crc16ccitt";


/** Constant for the LFSR in makeRandomizedBuffer(). Initial value (seed) */
const LFSR_SEED = 0x42;
/** Constant for the LFSR in makeRandomizedBuffer(). Polynomial */
const LFSR_POLY = 0xB8;
/** Constant used to init crc16ccitt */
const CRC_INIT = 0xFFFF;

/** Control byte mask for DATA frame */
const ASH_DFRAME_MASK  = 0x80;
/** Control byte mask for short frames (ACK/NAK) */
const ASH_SHFRAME_MASK = 0xE0;

/**
 * The NCP enters the FAILED state if it detects one of the following errors:
 * - An abnormal internal reset due to an error, failed assertion, or fault.
 * - Exceeding the maximum number of consecutive acknowledgement timeouts.
 * 
 * When the NCP enters the FAILED state, the NCP sends an ERROR frame containing a reset or error code
 * and will reply to all subsequent frames received, except RST, with an ERROR frame.
 * To reinitialize the ASH protocol, the Host must reset the NCP by either asserting the nRESET pin or sending the RST frame.
 * 
 * The codes are returned by the NCP in the:
 * - Reset Code byte of a RSTACK frame
 * - Error Code byte of an ERROR frame.
 * 
 * Silicon Labs wireless mesh chips can detect numerous reset fault causes beyond those in the table.
 * When sent to the host, these new reset codes have 0x80 added to the value returned by their HAL’s reset code.
 */
enum NcpResetCode {
    RESET_UNKNOWN_REASON = 0x00,
    RESET_EXTERNAL = 0x01,
    RESET_POWER_ON = 0x02,
    RESET_WATCHDOG = 0x03,
    RESET_ASSERT = 0x06,
    RESET_BOOTLOADER = 0x09,
    RESET_SOFTWARE = 0x0B,
    ERROR_EXCEEDED_MAXIMUM_ACK_TIMEOUT_COUNT = 0x51,
    ERROR_UNKNOWN_EM3XX_ERROR = 0x80,
}

/**
 * Basic class to handle uart-level incoming frames, also contains utility (static) functions for outgoing frames.
 * https://www.silabs.com/documents/public/user-guides/ug101-uart-gateway-protocol-reference.pdf
 * 
 * Public functions assume the caller is aware of the type of frame, and using only appropriate functions/properties.
 */
export class AshFrame {
    /**
     * Type of the Frame as determined by its control byte.
     */
    public readonly type: AshFrameType;
    public readonly buffer: Buffer;
    public readonly rFlag: number;
    public readonly frameNum: number;
    public readonly ackNum: number;

    public constructor(buffer: Buffer) {
        this.rFlag = -1;// invalid
        this.frameNum = -1;// invalid
        this.ackNum = -1;// invalid

        this.type = AshFrameType.INVALID;
        this.buffer = buffer;

        const ctrlByte = this.buffer[0];
        const len = this.buffer.length;

        if ((ctrlByte & ASH_DFRAME_MASK) === AshFrameType.DATA) {
            if (len >= ASH_FRAME_LEN_DATA_MIN) {
                this.type = AshFrameType.DATA;
                this.frameNum = ((ctrlByte & ASH_FRMNUM_MASK) >> ASH_FRMNUM_BIT);
                this.rFlag = ((ctrlByte & ASH_RFLAG_MASK) >> ASH_RFLAG_BIT);
                this.ackNum = ((ctrlByte & ASH_ACKNUM_MASK) >> ASH_ACKNUM_BIT);
            }
        } else if ((ctrlByte & ASH_SHFRAME_MASK) === AshFrameType.ACK) {
            if (len === ASH_FRAME_LEN_ACK) {
                this.type = AshFrameType.ACK;
                this.ackNum = ((ctrlByte & ASH_ACKNUM_MASK) >> ASH_ACKNUM_BIT);
            }
        } else if ((ctrlByte & ASH_SHFRAME_MASK) === AshFrameType.NAK) {
            if (len === ASH_FRAME_LEN_NAK) {
                this.type = AshFrameType.NAK;
                this.ackNum = ((ctrlByte & ASH_ACKNUM_MASK) >> ASH_ACKNUM_BIT);
            }
        } else if (ctrlByte === AshFrameType.RSTACK) {
            if (len === ASH_FRAME_LEN_RSTACK) {
                this.type = AshFrameType.RSTACK;
            }
        } else if (ctrlByte === AshFrameType.ERROR) {
            if (len === ASH_FRAME_LEN_ERROR) {
                this.type = AshFrameType.ERROR;
            }
        }
        // RST frame is Host ==> NCP only, invalid if received (should never happen)
    }

    /**
     * Create an ASH Frame from an `unstuffed` buffer. For incoming frame only.
     * This will validate the frame according to its control byte derived type.
     * @param buffer 
     * @param outgoing Set to true if this is a frame supposed to be sent, as opposed to received (considers RST type).
     * @returns 
     */
    public static fromBuffer(buffer: Buffer): AshFrame {
        return new AshFrame(buffer);
    }

    /**
     * XOR with a pseudo-random sequence for transmission/reception.
     * Used only in data frames, and only on the `data` part (no CONTROL, no CRC, no FLAG must be present).
     */
    public static makeRandomizedBuffer(buffer: Buffer): Buffer {
        let rand = LFSR_SEED;
        const out = Buffer.alloc(buffer.length);
        let outIdx = 0;

        for (const c of buffer) {
            out.writeUInt8(c ^ rand, outIdx++);

            if ((rand % 2)) {
                rand = ((rand >> 1) ^ LFSR_POLY);
            } else {
                rand = (rand >> 1);
            }
        }

        return out;
    }

    /**
     * Compute the crc16ccitt high/low value from the given buffer.
     * @param buf Frame buffer without CRC high, CRC low, and FLAG bytes.
     * @returns CRC high/low buffer
     */
    public static computeCrc(buf: Buffer): Buffer {
        const crc = crc16ccitt(buf, CRC_INIT);

        return Buffer.from([(crc >> 8), (crc % 256)]);
    }

    /**
     * Get the control byte of the buffer (byte at index 0).
     * All frame types have one.
     */
    get control(): number {
        return this.buffer[0];
    }

    /**
     * Get the ASH protocol version in RSTACK/ERROR frame types.
     */
    get ashVersion(): number {
        return this.buffer[1];
    }

    /**
     * Get the reset code (as string of NcpResetCode enum) in RSTACK frame type.
     */
    get resetCodeString(): string {
        try {
            return NcpResetCode[this.buffer[2]];
        } catch {
            return NcpResetCode[NcpResetCode.ERROR_UNKNOWN_EM3XX_ERROR];
        }
    }

    /**
     * Get the error code in ERROR frame type.
     */
    get errorCode(): number {
        return this.buffer[2];
    }

    /**
     * Get next ACK num for received frame. DATA frame only.
     */
    get nextAckNum(): number {
        return (this.frameNum + 1) & ASH_ACKNUM_MASK;
    }

    /**
     * Check if RSTACK was sent by NCP with RESET_SOFTWARE code (i.e. following our RST request).
     */
    public isRSTACKResetSoftware(): boolean {
        return this.buffer[2] === NcpResetCode.RESET_SOFTWARE;
    }

    /**
     * Throws on CRC error.
     */
    public checkCRC(): void {
        // take out flag, crc low, crc high from end
        const crcArr = AshFrame.computeCrc(this.buffer.subarray(0, -3));
        // crc high + crc low only
        const subArr = this.buffer.subarray(-3, -1);

        if (!subArr.equals(crcArr)) {
            throw new Error(`<-- CRC error: ${this.toString()}|${subArr.toString('hex')}|${crcArr.toString('hex')}`);
        }
    }

    /**
     * 
     * @returns Buffer to hex string
     */
    public toString(): string {
        return this.buffer.toString('hex');
    }
}

export default AshFrame;
