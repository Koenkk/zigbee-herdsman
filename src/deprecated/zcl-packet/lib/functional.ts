/* jshint node: true */
'use strict';

import * as Zcl from '../../../zcl';

var Concentrate = require('concentrate'),
    DChunks = require('../../dissolve-chunks'),
    ru = DChunks().Rule();

var zclmeta = require('./zclmeta');

var parsedBufLen = 0;

/*************************************************************************************************/
/*** FuncPayload Class                                                                         ***/
/*************************************************************************************************/
function FuncPayload(clusterId, direction, cmd) {
    var cluster = Zcl.getClusterLegacy(clusterId),
        command,
        params;

    this.direction = undefined;    // string after assgined
    this.cluster = undefined;      // string after assigned
    this.cmd = undefined;          // string after assigned
    this.cmdId = undefined;        // number after assigned

    if (!cluster)
        throw new Error('Unrecognized cluster');

    this.cluster = cluster.key;
    command = zclmeta.functional.getCommand(this.cluster, direction, cmd);

    if (!command)
        throw new Error('Unrecognized command');

    this.cmd = command.key;
    this.cmdId = command.value;

    this.direction = zclmeta.functional.getDirection(this.cluster, this.cmd);

    if (!this.direction)
        throw new Error('Unrecognized direction');
}

FuncPayload.prototype.parse = function (zclBuf, callback) {
    var chunkRules = [],
        err,
        params,
        parser,
        parseTimeout;

    if ((this.cluster === 'genScenes') && (this.cmd === 'add' || this.cmd === 'enhancedAdd' || this.cmd === 'viewRsp' || this.cmd === 'enhancedViewRsp'))
        parsedBufLen = zclmeta.functional.get(this.cluster, this.cmd).knownBufLen;

    params = zclmeta.functional.getParams(this.cluster, this.cmd);

    if (params) {                        // [ { name, type }, ... ]
        params.forEach(function (arg) {
            var rule = ru[arg.type];
            if (rule) {
                rule = rule(arg.name, zclBuf.length);
                chunkRules.push(rule);
            } else {
                err = new Error('Parsing rule for ' + arg.type + ' is not found.');
            }
        });
    } else {
        err = new Error('Response parameter definitions not found.');
    }

    if (!err) {
        if (chunkRules.length === 0) {
            callback(null, {});
            return;
        }

        parser = DChunks().join(chunkRules).compile();

        parseTimeout = setTimeout(function () {
            if (parser.listenerCount('parsed'))
                parser.emit('parsed', '__timeout__');

            parseTimeout = null;
        }, 3000);

        parser.once('parsed', function (result) {
            if (parseTimeout) {
                clearTimeout(parseTimeout);
                parseTimeout = null;
            }

            parser = null;

            if (result === '__timeout__')
                callback(new Error('zcl functional parse timeout'));
            else
                callback(null, result);
        });
    }

    if (!parser)    // error occurs, no parser created
        callback(err);
    else
        parser.end(zclBuf);
};

FuncPayload.prototype.frame = function (args) { // args can be an array or a value-object if given
    var params;

    params = zclmeta.functional.getParams(this.cluster, this.cmd);    // [ { name, type }, ... ]

    if (params) {
        if (Array.isArray(args)) {
            // arg: { name, type } -> { name, type, value }
            params.forEach(function (arg, idx) {
                arg.value = args[idx];
            });
        } else if (typeof args === 'object') {
            params.forEach(function (arg, idx) {
                if (!args.hasOwnProperty(arg.name))
                    throw new Error('The argument object has incorrect properties');
                else
                    arg.value = args[arg.name];
            });
        }

        args = params;                 // [ { name, type, value }, ... ]
    }

    var dataBuf = Concentrate();

    args.forEach(function (arg, idx) { // arg: { name, type, value }
        var type = arg.type,
            val = arg.value,
            idxarr,
            k = 0;

        switch (type) {
            case 'int8':
            case 'uint8':
            case 'int16':
            case 'uint16':
            case 'int32':
            case 'uint32':
            case 'floatle':
                dataBuf = dataBuf[type](val);
                break;
            case 'preLenUint8':
            case 'preLenUint16':
            case 'preLenUint32':
                type = type.slice(6).toLowerCase();
                dataBuf = dataBuf[type](val);
                break;
            case 'buffer':
                dataBuf = dataBuf.buffer(new Buffer(val));
                break;
            case 'longaddr':       // string '0x00124b00019c2ee9'
                var msb = parseInt(val.slice(2,10), 16),
                    lsb = parseInt(val.slice(10), 16);

                dataBuf = dataBuf.uint32le(lsb).uint32le(msb);
                break;
            case 'stringPreLen':
                if (typeof val !== 'string') {
                    throw new Error('The value for ' + val + ' must be an string.');
                }
                dataBuf = dataBuf.uint8(val.length).string(val, 'utf8');
                break;
            case 'dynUint8':
            case 'dynUint16':
            case 'dynUint32':      // [ x, y, z, ... ]
                type = type.slice(3).toLowerCase();
                for (idxarr = 0; idxarr < val.length; idxarr += 1) {
                    dataBuf = dataBuf[type](val[idxarr]);
                }
                break;
            case 'dynUint24':      // [ x, y, z, ... ]
                for (idxarr = 0; idxarr < val.length; idxarr += 1) {
                    var value = val[idxarr],
                        msb24 = (value & 0xff0000) >> 16,
                        mid24 = (value & 0xff00) >> 8,
                        lsb24 = (value & 0xff) ;
                    dataBuf = dataBuf.uint8(lsb24).uint8(mid24).uint8(msb24);
                }
                break;
            case 'locationbuffer': // [ '0x00124b00019c2ee9', int16, int16, int16, int8, uint8, ... ]
                for (idxarr = 0; idxarr < (val.length) / 6; idxarr += 1) {
                    var msbaddr = parseInt(val[k].slice(2,10), 16),
                        lsbaddr = parseInt(val[k].slice(10), 16);
                    dataBuf = dataBuf.uint32le(lsbaddr).uint32le(msbaddr).int16(val[k+1]).int16(val[k+2])
                              .int16(val[k+3]).int8(val[k+4]).uint8(val[k+5]);
                k += 6;
                }
                break;
            case 'zonebuffer':     // [ uint8, uint16, ... ]
                for (idxarr = 0; idxarr < (val.length) / 2; idxarr+= 1) {
                    dataBuf = dataBuf.uint8(val[k]).uint16le(val[k+1]);
                k += 2;
                }
                break;
            case 'extfieldsets':   // [ { clstId, len, extField }, ... ]
                for (idxarr = 0; idxarr < val.length; idxarr += 1) {
                    dataBuf = dataBuf.uint16le(val[idxarr].clstId).uint8(val[idxarr].len).buffer(new Buffer(val[idxarr].extField));
                }
                break;
            default:
                throw new Error('Unknown Data Type');
        }
    });

    return dataBuf.result();
};

/*************************************************************************************************/
/*** Add Parsing Rules to DChunks                                                              ***/
/*************************************************************************************************/
var rules1 = ['preLenUint8', 'preLenUint16', 'preLenUint32'],
    rules2 = ['dynUint8', 'dynUint16', 'dynUint24', 'dynUint32', 'zonebuffer', 'extfieldsets', 'locationbuffer'];

rules1.forEach(function (ruName) {
    ru.clause(ruName, function (name) {
        if (ruName === 'preLenUint8') {
            this.uint8(name);
        } else if (ruName === 'preLenUint16') {
            this.uint16(name);
        } else if (ruName === 'preLenUint32') {
            this.uint32(name);
        }

        this.tap(function () {
            this.vars.preLenNum = this.vars[name];
        });
    });
});

rules2.forEach(function (ruName) {
    ru.clause(ruName, function (name, bufLen) {
        this.tap(function () {
            var length;

            if (ruName === 'zonebuffer') {
                length = this.vars.preLenNum * 3;
            } else if (ruName === 'extfieldsets') {
                length = bufLen - parsedBufLen;
            } else if (ruName === 'locationbuffer') {
                length = this.vars.preLenNum * 16;
            } else {
                length = this.vars.preLenNum * (parseInt(ruName.slice(7)) / 8);
            }

            this.buffer(name, length).tap(function () {
                var buf = this.vars[name];
                this.vars[name] = buf2Arr(buf, ruName);
                delete this.vars.preLenNum;
            });
        });
    });
});

ru.clause('longaddr', function (name) {
    this.buffer(name, 8).tap(function () {
        var addrBuf = this.vars[name];
        this.vars[name] = addrBuf2Str(addrBuf);
    });
});

ru.clause('stringPreLen', function (name) {
    this.uint8('len').tap(function () {
        this.string(name, this.vars.len);
        parsedBufLen += this.vars.len;
        delete this.vars.len;
    });
});

function addrBuf2Str(buf) {
    var bufLen = buf.length,
        val,
        strChunk = '0x';

    for (var i = 0; i < bufLen; i += 1) {
        val = buf.readUInt8(bufLen - i - 1);
        if (val <= 15) {
            strChunk += '0' + val.toString(16);
        } else {
            strChunk += val.toString(16);
        }
    }

    return strChunk;
}

function buf2Arr(buf, type) {
    var i,
        arr = [];

    switch (type) {
        case 'dynUint8':
            for (i = 0; i < buf.length; i += 1) {
                arr.push(buf.readUInt8(i));
            }
            break;
        case 'dynUint16':
            for (i = 0; i < buf.length; i += 2) {
                arr.push(buf.readUInt16LE(i));
            }
            break;
        case 'dynUint24':
            for (i = 0; i < buf.length; i += 3) {
                var lsb = buf.readUInt16LE(i),
                    msb = buf.readUInt8(i + 2),
                    val = (msb << 16) + lsb;
                arr.push(val);
            }
            break;
        case 'dynUint32':
            for (i = 0; i < buf.length; i += 4) {
                arr.push(buf.readUInt32LE(i));
            }
            break;
        case 'zonebuffer':
            for (i = 0; i < buf.length; i += 3) {
                arr.push(buf.readUInt8(i), buf.readUInt16LE(i + 1));
            }
            break;
        case 'extfieldsets':
            var extFieldLen;
            for (i = 0; i < buf.length; i += extFieldLen) {
                var obj = {};

                obj.clstId = buf.readUInt16LE(i);
                obj.len = extFieldLen = buf.readUInt8(i+2);
                obj.extField = [];
                i += 3;
                for (var j = 0; j < obj.len; j+=1) {
                    obj.extField.push(buf.readUInt8(i + j));
                }
                arr.push(obj);
            }
            break;
        case 'locationbuffer':
            for (i = 0; i < buf.length; i += 16) {
                var addr = addrBuf2Str(buf.slice(i, i+8));
                arr.push(addr, buf.readInt16LE(i + 8), buf.readInt16LE(i + 10), buf.readInt16LE(i + 12), buf.readInt8(i + 14), buf.readUInt8(i + 15));
            }
            break;
        default:
            break;
    }

    return arr;
}

module.exports = FuncPayload;
