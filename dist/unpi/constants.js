"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Type;
(function (Type) {
    Type[Type["POLL"] = 0] = "POLL";
    Type[Type["SREQ"] = 1] = "SREQ";
    Type[Type["AREQ"] = 2] = "AREQ";
    Type[Type["SRSP"] = 3] = "SRSP";
})(Type || (Type = {}));
exports.Type = Type;
var Subsystem;
(function (Subsystem) {
    Subsystem[Subsystem["RESERVED"] = 0] = "RESERVED";
    Subsystem[Subsystem["SYS"] = 1] = "SYS";
    Subsystem[Subsystem["MAC"] = 2] = "MAC";
    Subsystem[Subsystem["NWK"] = 3] = "NWK";
    Subsystem[Subsystem["AF"] = 4] = "AF";
    Subsystem[Subsystem["ZDO"] = 5] = "ZDO";
    Subsystem[Subsystem["SAPI"] = 6] = "SAPI";
    Subsystem[Subsystem["UTIL"] = 7] = "UTIL";
    Subsystem[Subsystem["DEBUG"] = 8] = "DEBUG";
    Subsystem[Subsystem["APP"] = 9] = "APP";
    Subsystem[Subsystem["APP_CNF"] = 15] = "APP_CNF";
})(Subsystem || (Subsystem = {}));
exports.Subsystem = Subsystem;
const DataStart = 4;
exports.DataStart = DataStart;
const SOF = 0xFE;
exports.SOF = SOF;
const PositionLength = 1;
exports.PositionLength = PositionLength;
const PositionCmd0 = 2;
exports.PositionCmd0 = PositionCmd0;
const PositionCmd1 = 3;
exports.PositionCmd1 = PositionCmd1;
const MinimalMessageLength = 5;
exports.MinimalMessageLength = MinimalMessageLength;
//# sourceMappingURL=constants.js.map