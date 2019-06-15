"use strict";
// 'use strict';
var util = require('util'), EventEmitter = require('events'), Concentrate = require('concentrate'), DChunks = require('../dissolve-chunks'), ru = DChunks().Rule();
var cmdType = {
    "POLL": 0,
    "SREQ": 1,
    "AREQ": 2,
    "SRSP": 3,
    "RES0": 4,
    "RES1": 5,
    "RES2": 6,
    "RES3": 7
};
var subSys = {
    "RPC_SYS_RES0": 0,
    "RPC_SYS_SYS": 1,
    "RPC_SYS_MAC": 2,
    "RPC_SYS_NWK": 3,
    "RPC_SYS_AF": 4,
    "RPC_SYS_ZDO": 5,
    "RPC_SYS_SAPI": 6,
    "RPC_SYS_UTIL": 7,
    "RPC_SYS_DBG": 8,
    "RPC_SYS_APP": 9,
    "RPC_SYS_RCAF": 10,
    "RPC_SYS_RCN": 11,
    "RPC_SYS_RCN_CLIENT": 12,
    "RPC_SYS_BOOT": 13,
    "RPC_SYS_ZIPTEST": 14,
    "RPC_SYS_APP_CNF": 15,
    "RPC_SYS_PERIPHERALS": 16,
    "RPC_SYS_NFC": 17,
    "RPC_SYS_PB_NWK_MGR": 18,
    "RPC_SYS_PB_GW": 19,
    "RPC_SYS_PB_OTA_MGR": 20,
    "RPC_SYS_BLE_SPNP": 21,
    "RPC_SYS_BLE_HCI": 22,
    "RPC_SYS_RESV01": 23,
    "RPC_SYS_RESV02": 24,
    "RPC_SYS_RESV03": 25,
    "RPC_SYS_RESV04": 26,
    "RPC_SYS_RESV05": 27,
    "RPC_SYS_RESV06": 28,
    "RPC_SYS_RESV07": 29,
    "RPC_SYS_RESV08": 30,
    "RPC_SYS_SRV_CTR": 31
};
/*************************************************************************************************/
/*** TI Unified NPI Packet Format                                                              ***/
/***     SOF(1) + Length(2/1) + Type/Sub(1) + Cmd(1) + Payload(N) + FCS(1)                     ***/
/*************************************************************************************************/
function Unpi(config) {
    var pRules, self = this;
    if (config !== undefined && (typeof config !== 'object' || Array.isArray(config)))
        throw new TypeError('config should be an object if given.');
    EventEmitter.call(this);
    this.config = config || {};
    this.config.lenBytes = this.config.lenBytes || 2;
    pRules = [
        ru._unpiHeader('sof'),
        ru._unpiLength('len', this.config.lenBytes),
        ru._unpiCmd0('type', 'subsys'),
        ru.uint8('cmd'),
        ru._unpiPayload('payload'),
        ru.uint8('fcs')
    ];
    this.concentrate = Concentrate();
    this.parser = DChunks().join(pRules).compile();
    this.parser.on('parsed', function (result) {
        var cmd0 = (result.type << 5) | result.subsys, preBufLen = self.config.lenBytes + 2, preBuf = new Buffer(preBufLen);
        if (self.config.lenBytes === 1) {
            preBuf.writeUInt8(result.len, 0);
            preBuf.writeUInt8(cmd0, 1);
            preBuf.writeUInt8(result.cmd, 2);
        }
        else {
            preBuf.writeUInt16LE(result.len, 0);
            preBuf.writeUInt8(cmd0, 2);
            preBuf.writeUInt8(result.cmd, 3);
        }
        result.csum = checksum(preBuf, result.payload);
        self.emit('data', result);
        if (result.csum !== result.fcs)
            self.emit('error', new Error('Invalid checksum.'), result);
    });
    if (this.config.phy) {
        this.config.phy.pipe(this.parser);
        this.concentrate.pipe(this.config.phy);
    }
    this.on('error', function (e) {
        // [DEBUG]
        // console.log(e);
    });
}
util.inherits(Unpi, EventEmitter);
Unpi.DChunks = DChunks;
Unpi.Concentrate = Concentrate;
Unpi.prototype.send = function (type, subsys, cmdId, payload) {
    if (typeof type !== 'string' && typeof type !== 'number')
        throw new TypeError('Argument type should be a string or a number.');
    else if (typeof type === 'number' && isNaN(type))
        throw new TypeError('Argument type cannot be NaN.');
    if (typeof subsys !== 'string' && typeof subsys !== 'number')
        throw new TypeError('Argument subsys should be a string or a number.');
    else if (typeof subsys === 'number' && isNaN(subsys))
        throw new TypeError('Argument subsys cannot be NaN.');
    if (typeof cmdId !== 'number' || isNaN(cmdId))
        throw new TypeError('Command id should be a number.');
    if (payload !== undefined && !Buffer.isBuffer(payload))
        throw new TypeError('Payload should be a buffer.');
    type = getCmdTypeString(type);
    subsys = getSubsysString(subsys);
    if (type === undefined || subsys === undefined)
        throw new Error('Invalid command type or subsystem.');
    type = cmdType[type];
    subsys = subSys[subsys];
    payload = payload || new Buffer(0);
    var packet, sof = 0xFE, len = payload.length, cmd0 = ((type << 5) & 0xE0) | (subsys & 0x1F), cmd1 = cmdId, preBuf, fcs;
    preBuf = new Buffer(this.config.lenBytes + 2);
    if (this.config.lenBytes === 1) {
        preBuf.writeUInt8(payload.length, 0);
        preBuf.writeUInt8(cmd0, 1);
        preBuf.writeUInt8(cmd1, 2);
    }
    else if (this.config.lenBytes === 2) {
        preBuf.writeUInt16LE(payload.length, 0);
        preBuf.writeUInt8(cmd0, 2);
        preBuf.writeUInt8(cmd1, 3);
    }
    fcs = checksum(preBuf, payload);
    packet = Concentrate().uint8(sof).buffer(preBuf).buffer(payload).uint8(fcs).result();
    this.concentrate.buffer(packet).flush();
    this.emit('flushed', { type: type, subsys: subsys, cmdId: cmdId });
    return packet;
};
Unpi.prototype.receive = function (buf) {
    if (buf === undefined || buf === null)
        buf = new Buffer(0);
    if (!Buffer.isBuffer(buf))
        throw new TypeError('buf should be a Buffer.');
    this.parser.write(buf);
    return this;
};
/*************************************************************************************************/
/*** Parsing Clauses                                                                           ***/
/*************************************************************************************************/
ru.clause('_unpiHeader', function (name) {
    this.loop(function (end) {
        this.uint8(name).tap(function () {
            if (this.vars[name] !== 0xFE)
                delete this.vars[name];
            else
                end();
        });
    });
});
ru.clause('_unpiLength', function (name, bytes) {
    if (bytes === 1)
        this.uint8(name);
    else
        this.uint16(name);
});
ru.clause('_unpiCmd0', function (type, subsys) {
    this.uint8('cmd0').tap(function () {
        this.vars[type] = (this.vars.cmd0 & 0xE0) >> 5;
        this.vars[subsys] = this.vars.cmd0 & 0x1F;
        delete this.vars.cmd0;
    });
});
ru.clause('_unpiPayload', function (name) {
    this.tap(function () {
        this.buffer(name, this.vars.len);
    });
});
function checksum(buf1, buf2) {
    var fcs = 0, buf1_len = buf1.length, buf2_len = buf2.length, i;
    for (i = 0; i < buf1_len; i += 1) {
        fcs ^= buf1[i];
    }
    if (buf2 !== undefined) {
        for (i = 0; i < buf2_len; i += 1) {
            fcs ^= buf2[i];
        }
    }
    return fcs;
}
function getCmdTypeString(cmdtype) {
    var cmdTypeString;
    if (typeof cmdtype === 'number') {
        for (var k in cmdType) {
            if (cmdType.hasOwnProperty(k) && cmdType[k] === cmdtype) {
                cmdTypeString = k;
                break;
            }
        }
    }
    else if (typeof cmdtype === 'string') {
        if (cmdType.hasOwnProperty(cmdtype))
            cmdTypeString = cmdtype;
    }
    return cmdTypeString;
}
function getSubsysString(subsys) {
    var subsysString;
    if (typeof subsys === 'number') {
        for (var k in subSys) {
            if (subSys.hasOwnProperty(k) && subSys[k] === subsys) {
                subsysString = k;
                break;
            }
        }
    }
    else if (typeof subsys === 'string') {
        if (!subsys.startsWith('RPC_SYS_'))
            subsys = 'RPC_SYS_' + subsys;
        if (subSys.hasOwnProperty(subsys))
            subsysString = subsys;
    }
    return subsysString;
}
module.exports = Unpi;
//# sourceMappingURL=index.js.map