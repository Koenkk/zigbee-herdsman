import {ASH_FLAG, AshFrameType} from '../../../src/adapter/ezsp/driver/consts';
import {AshFrame} from '../../../src/adapter/ezsp/driver/frame';

// Example frames from gecko_sdk4.4.0

/**
 * Notation used in documentation: DATA(F, A, R)
 * - F: frame number (frmNum)
 * - A: acknowledge number (ackNum)
 * - R: retransmit flag (reTx)
 */
/**
 * Example without pseudo-random sequence applied to Data Field:
 * - EZSP “version” command: 00 00 00 02
 * - DATA(2, 5, 0) = 25 00 00 00 02 1A AD 7E
 */
export const DATA_CMD_FRAME = [0x25, 0x00, 0x00, 0x00, 0x02, 0x1A, 0xAD, 0x7E];
/**
 * Example with pseudo-random sequence applied to Data Field:
 * - EZSP “version” command: 00 00 00 02
 * - DATA(2, 5, 0) = 25 42 21 A8 56 A6 09 7E
 */
const DATA_CMD_FRAME_XOR = [0x25, 0x42, 0x21, 0xA8, 0x56, 0xA6, 0x09, 0x7E];
/**
 * Example without pseudo-random sequence applied to Data Field:
 * - EZSP “version” response: 00 80 00 02 02 11 30
 * - DATA(5, 3, 0) = 53 00 80 00 02 02 11 30 63 16 7E
 */
export const DATA_FRAME = [0x53, 0x00, 0x80, 0x00, 0x02, 0x02, 0x11, 0x30, 0x63, 0x16, 0x7E];
/**
 * Example with pseudo-random sequence applied to Data Field:
 * - EZSP “version” response: 00 80 00 02 02 11 30
 * - DATA(5, 3, 0) = 53 42 A1 A8 56 28 04 82 96 23 7E
 */
const DATA_FRAME_XOR = [0x53, 0x42, 0xA1, 0xA8, 0x56, 0x28, 0x04, 0x82, 0x96, 0x23, 0x7E];
/**
 * Notation used in documentation: ACK(A)+/-
 * - A: acknowledge number (ackNum)
 * - +/-: not ready flag (nRdy); “+” = “0” = “ready”; “-” = “1” = “not ready” (not incoming frames)
 * 
 * ACK(1)+ :81 60 59 7E
 */
const ACK_FRAME = [0x81, 0x60, 0x59, 0x7E];
/**
 * Notation used in documentation: NAK(A)+/-
 * - A: acknowledge number (ackNum)
 * - +/-: not ready flag (nRdy); “+” = “0” = “ready”; “-” = “1” = “not ready” (not incoming frames)
 * 
 * NAK(6)+ : A6 34 DC 7E
 */
const NAK_FRAME = [0xA6, 0x34, 0xDC, 0x7E];
/**
 * Notation used in documentation: RSTACK(V, C)
 * - V: version
 * - C: reset code
 * 
 * Example: C1 02 02 9B 7B 7E
 */
const RSTACK_FRAME = [0xC1, 0x02, 0x02, 0x9B, 0x7B, 0x7E];
/**
 * Notation used in documentation: ERROR(V, C)
 * - V: version
 * - C: reset code
 * 
 * Example: C2 01 52 FA BD 7E
 */
const ERROR_FRAME = [0xC2, 0x01, 0x52, 0xFA, 0xBD, 0x7E];// NOTE: this example actually has bad CRC

const INVALID_FRAME = [0x00, 0x00, 0x00, 0x00];
const INVALID_FRAME2 = [0x00, 0x00, 0x00, 0x7E];
const INVALID_FRAME3 = [0xFF, 0x00, 0x00, 0x7E];
const INVALID_ACK_FRAME = [0x81, 0x60, 0x7E];
const INVALID_DATA_FRAME = [0x53, 0x00, 0x80, 0x63, 0x16, 0x7E];


describe('ASH Frame', () => {
    it('Identifies DATA frame type', () => {
        const frame = AshFrame.fromBuffer(Buffer.from(DATA_FRAME));

        expect(frame.type).toStrictEqual(AshFrameType.DATA);
        expect(frame.frameNum).toStrictEqual(5);
        expect(frame.ackNum).toStrictEqual(3);
        expect(frame.rFlag).toStrictEqual(0);
        expect(frame.checkCRC.bind(frame)).not.toThrow();
    });
    it('Identifies bad DATA frame type', () => {
        const frame = AshFrame.fromBuffer(Buffer.from(INVALID_DATA_FRAME));

        expect((INVALID_DATA_FRAME[0] & 0x80) === AshFrameType.DATA).toBeTruthy();// actually a DATA control byte
        expect(frame.type).toStrictEqual(AshFrameType.INVALID);// but bad length
        expect(frame.checkCRC.bind(frame)).toThrow();
    });
    it('Identifies ACK frame type', () => {
        const frame = AshFrame.fromBuffer(Buffer.from(ACK_FRAME));

        expect(frame.type).toStrictEqual(AshFrameType.ACK);
        expect(frame.ackNum).toStrictEqual(1);
        expect(frame.checkCRC.bind(frame)).not.toThrow();
    });
    it('Identifies bad ACK frame type', () => {
        const frame = AshFrame.fromBuffer(Buffer.from(INVALID_ACK_FRAME));

        expect((INVALID_ACK_FRAME[0] & 0xE0) === AshFrameType.ACK).toBeTruthy();// actually an ACK frame
        expect(frame.type).toStrictEqual(AshFrameType.INVALID);// but bad length
        expect(frame.checkCRC.bind(frame)).toThrow();
    });
    it('Identifies NAK frame type', () => {
        const frame = AshFrame.fromBuffer(Buffer.from(NAK_FRAME));

        expect(frame.type).toStrictEqual(AshFrameType.NAK);
        expect(frame.ackNum).toStrictEqual(6);
        expect(frame.checkCRC.bind(frame)).not.toThrow();
    });
    it('Identifies RSTACK frame type', () => {
        const frame = AshFrame.fromBuffer(Buffer.from(RSTACK_FRAME));

        expect(frame.type).toStrictEqual(AshFrameType.RSTACK);
        expect(frame.ashVersion).toStrictEqual(2);
        expect(frame.resetCodeString).toStrictEqual('RESET_POWER_ON');
        expect(frame.isRSTACKResetSoftware()).toBeFalsy();
        expect(frame.checkCRC.bind(frame)).not.toThrow();
    });
    it('Identifies ERROR frame type', () => {
        const frame = AshFrame.fromBuffer(Buffer.from(ERROR_FRAME));

        expect(frame.type).toStrictEqual(AshFrameType.ERROR);
        expect(frame.ashVersion).toStrictEqual(1);
        expect(frame.errorCode).toStrictEqual(0x52);
        expect(frame.checkCRC.bind(frame)).toThrow();// bad CRC in example
    });
    it('Identifies INVALID frame type', () => {
        let frame = AshFrame.fromBuffer(Buffer.from(INVALID_FRAME));
        expect(frame.type).toStrictEqual(AshFrameType.INVALID);
        expect(frame.checkCRC.bind(frame)).toThrow();

        frame = AshFrame.fromBuffer(Buffer.from(INVALID_FRAME2));
        expect(frame.type).toStrictEqual(AshFrameType.INVALID);
        expect(frame.checkCRC.bind(frame)).toThrow();

        frame = AshFrame.fromBuffer(Buffer.from(INVALID_FRAME3));
        expect(frame.type).toStrictEqual(AshFrameType.INVALID);
        expect(frame.checkCRC.bind(frame)).toThrow();
    });
    it('Computes frame CRC', () => {
        let crc = AshFrame.computeCrc(Buffer.from(DATA_FRAME.slice(0, -3)));
        expect(crc).toStrictEqual(Buffer.from(DATA_FRAME.slice(-3, -1)));

        crc = AshFrame.computeCrc(Buffer.from(ACK_FRAME.slice(0, -3)));
        expect(crc).toStrictEqual(Buffer.from(ACK_FRAME.slice(-3, -1)));

        crc = AshFrame.computeCrc(Buffer.from(NAK_FRAME.slice(0, -3)));
        expect(crc).toStrictEqual(Buffer.from(NAK_FRAME.slice(-3, -1)));

        crc = AshFrame.computeCrc(Buffer.from(RSTACK_FRAME.slice(0, -3)));
        expect(crc).toStrictEqual(Buffer.from(RSTACK_FRAME.slice(-3, -1)));

        crc = AshFrame.computeCrc(Buffer.from(ERROR_FRAME.slice(0, -3)));
        expect(crc).not.toStrictEqual(Buffer.from(ERROR_FRAME.slice(-3, -1)));// bad CRC in example
    });
    it('Randomizes response DATA frames', () => {
        let rndData = AshFrame.makeRandomizedBuffer(Buffer.from(DATA_FRAME_XOR).subarray(1, -3));// no ctrl, no crc, no flag

        expect(rndData).toStrictEqual(Buffer.from(DATA_FRAME).subarray(1, -3));
    });
    it('Randomizes command DATA frames', () => {
        const rndData = AshFrame.makeRandomizedBuffer(Buffer.from(DATA_CMD_FRAME).subarray(1, -3));// no ctrl, no crc, no flag
        const frame = Buffer.concat([Buffer.from(DATA_CMD_FRAME.slice(0, 1)), rndData]);
        const crcArr = AshFrame.computeCrc(frame);
        const fullFrame = Buffer.concat([frame, crcArr, Buffer.from([ASH_FLAG])])

        expect(rndData).toStrictEqual(Buffer.from(DATA_CMD_FRAME_XOR).subarray(1, -3));
        expect(fullFrame).toStrictEqual(Buffer.from(DATA_CMD_FRAME_XOR));
    });
});