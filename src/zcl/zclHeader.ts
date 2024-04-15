import {FrameControl, FrameType} from './definition';
import BuffaloZcl from './buffaloZcl';
import {logger} from '../utils/logger';

const NS = 'zh:zcl:header';
const HEADER_MINIMAL_LENGTH = 3;
const HEADER_WITH_MANUF_LENGTH = HEADER_MINIMAL_LENGTH + 2;

class ZclHeader {
    public readonly frameControl: FrameControl;
    public readonly manufacturerCode: number | null;
    public readonly transactionSequenceNumber: number;
    public readonly commandIdentifier: number;

    constructor(frameControl: FrameControl, manufacturerCode: number | null, transactionSequenceNumber: number, commandIdentifier: number) {
        this.frameControl = frameControl;
        this.manufacturerCode = manufacturerCode;
        this.transactionSequenceNumber = transactionSequenceNumber;
        this.commandIdentifier = commandIdentifier;
    }

    /** Returns the amount of bytes used by this header */
    get length(): number {
        return this.manufacturerCode === null ? HEADER_MINIMAL_LENGTH : HEADER_WITH_MANUF_LENGTH;
    }

    get isGlobal(): boolean {
        return this.frameControl.frameType === FrameType.GLOBAL;
    }

    get isSpecific(): boolean {
        return this.frameControl.frameType === FrameType.SPECIFIC;
    }

    public write(buffalo: BuffaloZcl): void {
        const frameControl = (
            (this.frameControl.frameType & 0x03) |
            (((this.frameControl.manufacturerSpecific ? 1 : 0) << 2) & 0x04) |
            ((this.frameControl.direction << 3) & 0x08) |
            (((this.frameControl.disableDefaultResponse ? 1 : 0) << 4) & 0x10) |
            ((this.frameControl.reservedBits << 5) & 0xE0)
        );

        buffalo.writeUInt8(frameControl);

        if (this.frameControl.manufacturerSpecific) {
            buffalo.writeUInt16(this.manufacturerCode);
        }

        buffalo.writeUInt8(this.transactionSequenceNumber);
        buffalo.writeUInt8(this.commandIdentifier);
    }

    public static fromBuffer(buffer: Buffer): ZclHeader | undefined {
        // Returns `undefined` in case the ZclHeader cannot be parsed.
        if (buffer.length < HEADER_MINIMAL_LENGTH) {
            logger.debug(`ZclHeader is too short.`, NS);
            return undefined;
        }

        const buffalo = new BuffaloZcl(buffer);
        const frameControlValue = buffalo.readUInt8();
        const frameControl = {
            frameType: frameControlValue & 0x03,
            manufacturerSpecific: ((frameControlValue >> 2) & 0x01) === 1,
            direction: (frameControlValue >> 3) & 0x01,
            disableDefaultResponse: ((frameControlValue >> 4) & 0x01) === 1,
            reservedBits: frameControlValue >> 5,
        };

        let manufacturerCode: number | null = null;
        if (frameControl.manufacturerSpecific) {
            if (buffer.length < HEADER_WITH_MANUF_LENGTH) {
                logger.debug(`ZclHeader is too short for control with manufacturer-specific.`, NS);
                return undefined;
            }

            manufacturerCode = buffalo.readUInt16();
        }

        const transactionSequenceNumber = buffalo.readUInt8();
        const commandIdentifier = buffalo.readUInt8();

        return new ZclHeader(frameControl, manufacturerCode, transactionSequenceNumber, commandIdentifier);
    }
}

export default ZclHeader;
