/* v8 ignore start */

import {logger} from '../../../utils/logger';

const NS = 'zh:zigate:frame';

enum ZiGateFrameChunkSize {
    UInt8 = 1,
    UInt16,
    UInt32,
    UInt64,
}

const hasStartByte = (startByte: number, frame: Buffer): boolean => {
    return frame.indexOf(startByte, 0) === 0;
};

const hasStopByte = (stopByte: number, frame: Buffer): boolean => {
    return frame.indexOf(stopByte, frame.length - 1) === frame.length - 1;
};

const combineBytes = (byte: number, idx: number, frame: number[]): [number, number] => {
    const nextByte = frame[idx + 1];

    return [byte, nextByte];
};
// maybe any
const removeDuplicate = (_: unknown, idx: number, frame: number[][]): boolean => {
    if (idx === 0) {
        return true;
    }

    const [first] = frame[idx - 1];

    return first !== 0x2;
};

const decodeBytes = (bytesPair: [number, number]): number => {
    return bytesPair[0] === 0x2 ? bytesPair[1] ^ 0x10 : bytesPair[0];
};

const readBytes = (bytes: Buffer): number => {
    return bytes.readUIntBE(0, bytes.length);
};

const writeBytes = (bytes: Buffer, val: number): void => {
    bytes.writeUIntBE(val, 0, bytes.length);
};

const xor = (checksum: number, byte: number): number => {
    return checksum ^ byte;
};

const decodeFrame = (frame: Buffer): Buffer => {
    const arrFrame = Array.from(frame).map(combineBytes).filter(removeDuplicate).map(decodeBytes);

    return Buffer.from(arrFrame);
};

const getFrameChunk = (frame: Buffer, pos: number, size: ZiGateFrameChunkSize): Buffer => {
    return frame.slice(pos, pos + size);
};

export default class ZiGateFrame {
    static readonly START_BYTE = 0x1;
    static readonly STOP_BYTE = 0x3;

    msgCodeBytes: Buffer = Buffer.alloc(ZiGateFrameChunkSize.UInt16);
    msgLengthBytes: Buffer = Buffer.alloc(ZiGateFrameChunkSize.UInt16);
    checksumBytes: Buffer = Buffer.alloc(ZiGateFrameChunkSize.UInt8);
    msgPayloadBytes: Buffer = Buffer.alloc(0);
    rssiBytes: Buffer = Buffer.alloc(0);

    msgLengthOffset = 0;

    constructor(frame?: Buffer) {
        if (frame !== undefined) {
            const decodedFrame = decodeFrame(frame);
            // logger.debug(`decoded frame >>> %o`, decodedFrame, NS);
            // Due to ZiGate incoming frames with erroneous msg length
            this.msgLengthOffset = -1;

            if (!ZiGateFrame.isValid(frame)) {
                logger.error('Provided frame is not a valid ZiGate frame.', NS);
                return;
            }

            this.buildChunks(decodedFrame);

            try {
                if (this.readMsgCode() !== 0x8001) logger.debug(() => `${JSON.stringify(this)}`, NS);
            } catch (error) {
                logger.error((error as Error).stack!, NS);
            }

            if (this.readChecksum() !== this.calcChecksum()) {
                logger.error(`Provided frame has an invalid checksum.`, NS);
                return;
            }
        }
    }

    static isValid(frame: Buffer): boolean {
        return hasStartByte(ZiGateFrame.START_BYTE, frame) && hasStopByte(ZiGateFrame.STOP_BYTE, frame);
    }

    buildChunks(frame: Buffer): void {
        this.msgCodeBytes = getFrameChunk(frame, 1, this.msgCodeBytes.length);
        this.msgLengthBytes = getFrameChunk(frame, 3, this.msgLengthBytes.length);
        this.checksumBytes = getFrameChunk(frame, 5, this.checksumBytes.length);
        this.msgPayloadBytes = getFrameChunk(frame, 6, this.readMsgLength());
        this.rssiBytes = getFrameChunk(frame, 6 + this.readMsgLength(), ZiGateFrameChunkSize.UInt8);
    }

    toBuffer(): Buffer {
        const length = 5 + this.readMsgLength();

        const escapedData = this.escapeData(
            Buffer.concat([this.msgCodeBytes, this.msgLengthBytes, this.checksumBytes, this.msgPayloadBytes], length),
        );

        return Buffer.concat([Uint8Array.from([ZiGateFrame.START_BYTE]), escapedData, Uint8Array.from([ZiGateFrame.STOP_BYTE])]);
    }

    escapeData(data: Buffer): Buffer {
        let encodedLength = 0;
        const encodedData = Buffer.alloc(data.length * 2);
        const FRAME_ESCAPE_XOR = 0x10;
        const FRAME_ESCAPE = 0x02;
        for (const b of data) {
            if (b <= FRAME_ESCAPE_XOR) {
                encodedData[encodedLength++] = FRAME_ESCAPE;
                encodedData[encodedLength++] = b ^ FRAME_ESCAPE_XOR;
            } else {
                encodedData[encodedLength++] = b;
            }
        }
        return encodedData.slice(0, encodedLength);
    }

    readMsgCode(): number {
        return readBytes(this.msgCodeBytes);
    }

    writeMsgCode(msgCode: number): ZiGateFrame {
        writeBytes(this.msgCodeBytes, msgCode);
        this.writeChecksum();
        return this;
    }

    readMsgLength(): number {
        return readBytes(this.msgLengthBytes) + this.msgLengthOffset;
    }

    writeMsgLength(msgLength: number): ZiGateFrame {
        writeBytes(this.msgLengthBytes, msgLength);
        return this;
    }

    readChecksum(): number {
        return readBytes(this.checksumBytes);
    }

    writeMsgPayload(msgPayload: Buffer): ZiGateFrame {
        this.msgPayloadBytes = Buffer.from(msgPayload);
        this.writeMsgLength(msgPayload.length);
        this.writeChecksum();
        return this;
    }

    readRSSI(): number {
        return readBytes(this.rssiBytes);
    }

    writeRSSI(rssi: number): ZiGateFrame {
        this.rssiBytes = Buffer.from([rssi]);
        this.writeChecksum();
        return this;
    }

    calcChecksum(): number {
        let checksum = 0x00;

        checksum = this.msgCodeBytes.reduce(xor, checksum);
        checksum = this.msgLengthBytes.reduce(xor, checksum);
        checksum = this.rssiBytes.reduce(xor, checksum);
        checksum = this.msgPayloadBytes.reduce(xor, checksum);

        return checksum;
    }

    writeChecksum(): this {
        this.checksumBytes = Buffer.from([this.calcChecksum()]);
        return this;
    }
}
