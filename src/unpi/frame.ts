import {Type, Subsystem, DataStart, SOF, PositionCmd0, PositionCmd1} from './constants';

class Frame {
    readonly type: Type;
    readonly subsystem: Subsystem;
    readonly commandID: number;
    readonly data: Array<number>;

    readonly length: number;
    readonly fcs: number;
    readonly sof: number;
    readonly len: number;

    // TO_BE_REMOVED
    subsys: number;
    csum: number;
    cmd: number;
    payload: Buffer;

    constructor(
        type: Type, subsystem: Subsystem, commandID: number, data: Array<number>,
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

    public toBuffer() {
        const length = this.data.length;
        const cmd0 = ((this.type << 5) & 0xE0) | (this.subsystem & 0x1F);

        const payload = [SOF, length, cmd0, this.commandID, ...this.data];
        const fcs = Frame.calculateChecksum(payload.slice(1, payload.length));
        payload.push(fcs);

        return Buffer.from(payload)
    }

    public static fromBuffer(length: number, fcsPosition: number, buffer: Array<number>): Frame {
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

    private static calculateChecksum(values: Array<number>) {
        let checksum = 0;

        for (let value of values) {
            checksum ^= value;
        }

        return checksum;
    }
}

export default Frame;
