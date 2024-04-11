import {FrameControl} from './definition';
import BuffaloZcl from './buffaloZcl';

const MINIMAL_HEADER_LENGTH = 3;

class ZclHeader {
    public readonly frameControl: FrameControl;
    public readonly manufacturerCode: number;
    public readonly transactionSequenceNumber: number;
    public readonly commandIdentifier: number;

    constructor(frameControl: FrameControl, manufacturerCode: number, transactionSequenceNumber: number, commandIdentifier: number) {
        this.frameControl = frameControl;
        this.manufacturerCode = manufacturerCode;
        this.transactionSequenceNumber = transactionSequenceNumber;
        this.commandIdentifier = commandIdentifier;
    }

    public getLength(): number {
        // Returns the amount of bytes of this header
        return 3 + (this.manufacturerCode === null ? 0 : 2);
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

    public static fromBuffer(buffer: Buffer): ZclHeader {
        if (buffer.length < MINIMAL_HEADER_LENGTH) {
            throw new Error("ZclHeader length is lower than minimal length");
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

        let manufacturerCode = null;
        if (frameControl.manufacturerSpecific) {
            manufacturerCode = buffalo.readUInt16();
        }

        const transactionSequenceNumber = buffalo.readUInt8();
        const commandIdentifier = buffalo.readUInt8();

        return new ZclHeader(frameControl, manufacturerCode, transactionSequenceNumber, commandIdentifier);
    }
}

export default ZclHeader;
