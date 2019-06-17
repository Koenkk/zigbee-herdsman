"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const stream = __importStar(require("stream"));
class Writer extends stream.Readable {
    write(frame) {
        this.push(frame.toBuffer());
    }
    _read() { }
}
exports.default = Writer;
//# sourceMappingURL=writer.js.map