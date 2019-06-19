import {Type, Subsystem, DataStart, SOF, PositionCmd0, PositionCmd1} from './constants';

class Frame {
    public readonly type: Type;
    public readonly subsystem: Subsystem;
    public readonly commandID: number;
    public readonly data: number[];

    public readonly length: number;
    public readonly fcs: number;

    // TO_BE_REMOVED
    public readonly sof: number;
    public readonly len: number;
    public readonly subsys: number;
    public readonly csum: number;
    public readonly cmd: number;
    public readonly payload: Buffer;

    public constructor(
        type: Type, subsystem: Subsystem, commandID: number, data: number[],
        length: number = null, fcs: number = null,
    ) {
        this.type = type;
        this.subsystem = subsystem;
        this.commandID = commandID;
        this.data = data;
        this.length = length;
        this.fcs = fcs;

        // TO_BE_REMOVED
        this.csum = fcs;
        this.sof = SOF;
        this.len = this.length;
        this.subsys = subsystem;
        this.cmd = commandID;
        this.payload = Buffer.from(data);
    }

    public toBuffer(): Buffer {
        const length = this.data.length;
        const cmd0 = ((this.type << 5) & 0xE0) | (this.subsystem & 0x1F);

        const payload = [SOF, length, cmd0, this.commandID, ...this.data];
        const fcs = Frame.calculateChecksum(payload.slice(1, payload.length));
        payload.push(fcs);

        return Buffer.from(payload)
    }

    public static fromBuffer(length: number, fcsPosition: number, buffer: number[]): Frame {
        const subsystem: Subsystem = buffer[PositionCmd0] & 0x1F;
        const type: Type = (buffer[PositionCmd0] & 0xE0) >> 5;
        const commandID = buffer[PositionCmd1];
        const data = buffer.slice(DataStart, fcsPosition);
        const fcs = buffer[fcsPosition];

        // Validate the checksum to see if we fully received the message
        const checksum = this.calculateChecksum(buffer.slice(1, fcsPosition));

        if (checksum === fcs) {
            return new Frame(type, subsystem, commandID, data, length, fcs);
        } else {
            throw new Error("Invalid checksum");
        }
    }

    private static calculateChecksum(values: number[]): number {
        let checksum = 0;

        for (let value of values) {
            checksum ^= value;
        }

        return checksum;
    }

    public toString(): string {
        return `${this.length} - ${this.type} - ${this.subsystem} - ${this.commandID} - [${this.data}] - ${this.fcs}`;
    }
}

export default Frame;
