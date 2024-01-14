import {RANDOMIZE_SEQ, RANDOMIZE_START} from "./consts";
import crc16ccitt from "./utils/crc16ccitt";

export enum FrameType {
    UNKNOWN = 0,
    ERROR = 1,
    DATA = 2,
    ACK = 3,
    NAK = 4,
    RST = 5,
    RSTACK = 6,
}

// Pretty basic for now, but can serve as a base for future needs
export class Frame {
    /**
     * Type of the Frame as determined by buffer index zero.
     */
    public readonly type: FrameType;
    public readonly buffer: Buffer;

    public constructor(buffer: Buffer) {
        this.buffer = buffer;

        const typeId = this.buffer[0];

        if ((typeId & 0x80) === 0) {
            this.type = FrameType.DATA;
        } else if ((typeId & 0xE0) === 0x80) {
            this.type = FrameType.ACK;
        } else if ((typeId & 0xE0) === 0xA0) {
            this.type = FrameType.NAK;
        } else if (typeId === 0xC0) {
            this.type = FrameType.RST;
        } else if (typeId === 0xC1) {
            this.type = FrameType.RSTACK;
        } else if (typeId === 0xC2) {
            this.type = FrameType.ERROR;
        } else {
            this.type = FrameType.UNKNOWN;
        }
    }

    get seq(): number {
        return this.buffer[0];
    }

    public static fromBuffer(buffer: Buffer): Frame {
        return new Frame(buffer);
    }

    /**
     * XOR s with a pseudo-random sequence for transmission.
     * Used only in data frames.
     */
    public static makeRandomizedBuffer(buffer: Buffer): Buffer {
        let rand = RANDOMIZE_START;
        const out = Buffer.alloc(buffer.length);
        let outIdx = 0;

        for (const c of buffer) {
            out.writeUInt8(c ^ rand, outIdx++);

            if ((rand % 2)) {
                rand = ((rand >> 1) ^ RANDOMIZE_SEQ);
            } else {
                rand = (rand >> 1);
            }
        }

        return out;
    }

    /**
     * Throws on CRC error.
     */
    public checkCRC(): void {
        const crc = crc16ccitt(this.buffer.subarray(0, -3), 65535);
        const crcArr = Buffer.from([(crc >> 8), (crc % 256)]);
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

export default Frame;
