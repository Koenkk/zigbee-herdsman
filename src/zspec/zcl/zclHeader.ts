import {logger} from '../../utils/logger';
import {BuffaloZcl} from './buffaloZcl';
import {FrameType} from './definition/enums';
import {FrameControl} from './definition/tstype';

const NS = 'zh:zcl:header';
const HEADER_MINIMAL_LENGTH = 3;
const HEADER_WITH_MANUF_LENGTH = HEADER_MINIMAL_LENGTH + 2;
/** ZCL Header frame control frame type */
const HEADER_CTRL_FRAME_TYPE_MASK = 0x03;
const HEADER_CTRL_FRAME_TYPE_BIT = 0;
/** ZCL Header frame control manufacturer specific */
const HEADER_CTRL_MANUF_SPE_MASK = 0x04;
const HEADER_CTRL_MANUF_SPE_BIT = 2;
/** ZCL Header frame control direction */
const HEADER_CTRL_DIRECTION_MASK = 0x08;
const HEADER_CTRL_DIRECTION_BIT = 3;
/** ZCL Header frame control disable default response */
const HEADER_CTRL_DISABLE_DEF_RESP_MASK = 0x10;
const HEADER_CTRL_DISABLE_DEF_RESP_BIT = 4;
/** ZCL Header frame control reserved */
const HEADER_CTRL_RESERVED_MASK = 0xe0;
const HEADER_CTRL_RESERVED_BIT = 5;

export class ZclHeader {
    public readonly frameControl: FrameControl;
    public readonly manufacturerCode: number | undefined;
    public readonly transactionSequenceNumber: number;
    public readonly commandIdentifier: number;

    constructor(frameControl: FrameControl, manufacturerCode: number | undefined, transactionSequenceNumber: number, commandIdentifier: number) {
        this.frameControl = frameControl;
        this.manufacturerCode = manufacturerCode;
        this.transactionSequenceNumber = transactionSequenceNumber;
        this.commandIdentifier = commandIdentifier;
    }

    /** Returns the amount of bytes used by this header */
    get length(): number {
        return this.manufacturerCode === undefined ? HEADER_MINIMAL_LENGTH : HEADER_WITH_MANUF_LENGTH;
    }

    get isGlobal(): boolean {
        return this.frameControl.frameType === FrameType.GLOBAL;
    }

    get isSpecific(): boolean {
        return this.frameControl.frameType === FrameType.SPECIFIC;
    }

    public write(buffalo: BuffaloZcl): void {
        const frameControl =
            ((this.frameControl.frameType << HEADER_CTRL_FRAME_TYPE_BIT) & HEADER_CTRL_FRAME_TYPE_MASK) |
            (((this.frameControl.manufacturerSpecific ? 1 : 0) << HEADER_CTRL_MANUF_SPE_BIT) & HEADER_CTRL_MANUF_SPE_MASK) |
            ((this.frameControl.direction << HEADER_CTRL_DIRECTION_BIT) & HEADER_CTRL_DIRECTION_MASK) |
            (((this.frameControl.disableDefaultResponse ? 1 : 0) << HEADER_CTRL_DISABLE_DEF_RESP_BIT) & HEADER_CTRL_DISABLE_DEF_RESP_MASK) |
            ((this.frameControl.reservedBits << HEADER_CTRL_RESERVED_BIT) & HEADER_CTRL_RESERVED_MASK);

        buffalo.writeUInt8(frameControl);

        if (this.frameControl.manufacturerSpecific && this.manufacturerCode) {
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
            frameType: (frameControlValue & HEADER_CTRL_FRAME_TYPE_MASK) >> HEADER_CTRL_FRAME_TYPE_BIT,
            manufacturerSpecific: (frameControlValue & HEADER_CTRL_MANUF_SPE_MASK) >> HEADER_CTRL_MANUF_SPE_BIT === 1,
            direction: (frameControlValue & HEADER_CTRL_DIRECTION_MASK) >> HEADER_CTRL_DIRECTION_BIT,
            disableDefaultResponse: (frameControlValue & HEADER_CTRL_DISABLE_DEF_RESP_MASK) >> HEADER_CTRL_DISABLE_DEF_RESP_BIT === 1,
            reservedBits: (frameControlValue & HEADER_CTRL_RESERVED_MASK) >> HEADER_CTRL_RESERVED_BIT,
        };

        let manufacturerCode: number | undefined;

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
