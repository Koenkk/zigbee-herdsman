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
    ACK = 0x80, // 0b10000000
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
    NAK = 0xa0, // 0b10100000
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
    RST = 0xc0, // 0b11000000
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
    RSTACK = 0xc1, // 0b11000001
    /**
     * Informs the Host that the NCP detected a fatal error and is in the FAILED state.
     *
     * [CONTROL, version, error code, CRC high, CRC low, FLAG]
     *
     * Notation used in documentation: ERROR(V, C )
     * - V: version
     * - C: reset code
     *
     * Example: C2 01 52 FA BD 7E
     *
     * Sent by: NCP
     */
    ERROR = 0xc2, // 0b11000010
}

export enum AshReservedByte {
    /**
     * Marks the end of a frame.
     *
     * When a Flag Byte is received, the data received since the last Flag Byte or Cancel Byte
     * is tested to see whether it is a valid frame. */
    FLAG = 0x7e,
    /**
     * Indicates that the following byte is escaped.
     *
     * If the byte after the Escape Byte is not a reserved byte,
     * bit 5 of the byte is complemented to restore its original value.
     * If the byte after the Escape Byte is a reserved value, the Escape Byte has no effect. */
    ESCAPE = 0x7d,
    /**
     * Resume transmission.
     *
     * Used in XON/XOFF flow control. Always ignored if received by the NCP.
     */
    XON = 0x11,
    /**
     * Stop transmission.
     *
     * Used in XON/XOFF flow control. Always ignored if received by the NCP
     */
    XOFF = 0x13,
    /**
     * Replaces a byte received with a low-level communication error (e.g., framing error) from the UART.
     *
     * When a Substitute Byte is processed, the data between the previous and the next Flag Bytes is ignored.
     */
    SUBSTITUTE = 0x18,
    /**
     * Terminates a frame in progress.
     *
     * A Cancel Byte causes all data received since the previous Flag Byte to be ignored.
     * Note that as a special case, RST and RSTACK frames are preceded by Cancel Bytes to ignore any link startup noise.
     */
    CANCEL = 0x1a,
}

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
export enum NcpFailedCode {
    RESET_UNKNOWN_REASON = 0,
    RESET_EXTERNAL = 1,
    RESET_POWERON = 2,
    RESET_WATCHDOG = 3,
    RESET_ASSERT = 6,
    RESET_BOOTLOADER = 9,
    RESET_SOFTWARE = 11,
    ERROR_EXCEEDED_MAXIMUM_ACK_TIMEOUT_COUNT = 0x51,
    CHIP_SPECIFIC_ERROR_RESET_CODE = 0x80,
}
