"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const constants_1 = require("./constants");
class Frame {
    constructor(type, subsystem, commandID, data, length = null, fcs = null) {
        this.type = type;
        this.subsystem = subsystem;
        this.commandID = commandID;
        this.data = data;
        this.length = length;
        this.fcs = fcs;
        // TO_BE_REMOVED
        this.csum = fcs;
        this.sof = constants_1.SOF;
        this.len = this.length;
        this.subsys = subsystem;
        this.cmd = commandID;
        this.payload = Buffer.from(data);
    }
    toBuffer() {
        const length = this.data.length;
        const cmd0 = ((this.type << 5) & 0xE0) | (this.subsystem & 0x1F);
        const payload = [constants_1.SOF, length, cmd0, this.commandID, ...this.data];
        const fcs = Frame.calculateChecksum(payload.slice(1, payload.length));
        payload.push(fcs);
        return Buffer.from(payload);
    }
    static fromBuffer(length, fcsPosition, buffer) {
        const subsystem = buffer[constants_1.PositionCmd0] & 0x1F;
        const type = (buffer[constants_1.PositionCmd0] & 0xE0) >> 5;
        const commandID = buffer[constants_1.PositionCmd1];
        const data = buffer.slice(constants_1.DataStart, fcsPosition);
        const fcs = buffer[fcsPosition];
        // Validate the checksum to see if we fully received the message
        const checksum = this.calculateChecksum(buffer.slice(1, fcsPosition));
        if (checksum === fcs) {
            return new Frame(type, subsystem, commandID, data, length, fcs);
        }
        else {
            throw new Error("Invalid checksum");
        }
    }
    static calculateChecksum(values) {
        let checksum = 0;
        for (let value of values) {
            checksum ^= value;
        }
        return checksum;
    }
}
exports.default = Frame;
//# sourceMappingURL=frame.js.map