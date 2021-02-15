import {Type, Subsystem, DataStart, SOF, PositionCmd0, PositionCmd1} from './constants';

class Frame {
    public readonly type: Type;
    public readonly subsystem: Subsystem;
    public readonly commandID: number;
    public readonly data: Buffer;

    public readonly length: number;
    public readonly fcs: number;

    public constructor(
        type: Type, subsystem: Subsystem, commandID: number, data: Buffer,
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        length: number = null, fcs: number = null,
    ) {
        this.type = type;
        this.subsystem = subsystem;
        this.commandID = commandID;
        this.data = data;
        this.length = length;
        this.fcs = fcs;
    }

    public toBuffer(): Buffer {
        const length = this.data.length;
        const cmd0 = ((this.type << 5) & 0xE0) | (this.subsystem & 0x1F);

        let payload = Buffer.from([SOF, length, cmd0, this.commandID]);
        payload = Buffer.concat([payload, this.data]);
        const fcs = Frame.calculateChecksum(payload.slice(1, payload.length));

        return Buffer.concat([payload, Buffer.from([fcs])]);
    }

    public static fromBuffer(length: number, fcsPosition: number, buffer: Buffer): Frame {
        const subsystem: Subsystem = buffer.readUInt8(PositionCmd0) & 0x1F;
        const type: Type = (buffer.readUInt8(PositionCmd0) & 0xE0) >> 5;
        const commandID = buffer.readUInt8(PositionCmd1);
        const data = buffer.slice(DataStart, fcsPosition);
        const fcs = buffer.readUInt8(fcsPosition);

        // Validate the checksum to see if we fully received the message
        const checksum = this.calculateChecksum(buffer.slice(1, fcsPosition));

        if (checksum === fcs) {
            return new Frame(type, subsystem, commandID, data, length, fcs);
        } else {
            throw new Error("Invalid checksum");
        }
    }

    private static calculateChecksum(values: Buffer): number {
        let checksum = 0;

        for (const value of values) {
            checksum ^= value;
        }

        return checksum;
    }

    public toString(): string {
        return `${this.length} - ${this.type} - ${this.subsystem} - ${this.commandID} - ` +
            `[${[...this.data]}] - ${this.fcs}`;
    }
}

export default Frame;
