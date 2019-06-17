"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const stream = __importStar(require("stream"));
const constants_1 = require("./constants");
const frame_1 = __importDefault(require("./frame"));
class Parser extends stream.Transform {
    constructor() {
        super();
        this.buffer = [];
    }
    _transform(chunk, _, cb) {
        Array.from(chunk).map(byte => this.buffer.push(byte));
        this.parseNext();
        cb();
    }
    parseNext() {
        if (this.buffer[0] == constants_1.SOF && this.buffer.length >= constants_1.MinimalMessageLength) {
            const length = this.buffer[constants_1.PositionLength];
            const fcsPosition = constants_1.DataStart + length;
            if (this.buffer.length >= fcsPosition) {
                const frameBuffer = this.buffer.slice(0, fcsPosition + 1);
                try {
                    const frame = frame_1.default.fromBuffer(length, fcsPosition, frameBuffer);
                    this.emit('parsed', frame);
                }
                catch (error) {
                    this.emit('error', error);
                }
                this.buffer.splice(0, fcsPosition + 1);
                this.parseNext();
            }
        }
    }
}
exports.default = Parser;
//# sourceMappingURL=parser.js.map