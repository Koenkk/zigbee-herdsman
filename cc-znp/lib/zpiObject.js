/* jshint node: true */
'use strict';

var zmeta = require('./zmeta'),
    Unpi = require('unpi'),
    Concentrate = Unpi.Concentrate,
    DChunks = Unpi.DChunks,
    ru = DChunks().Rule();

/*************************************************************************************************/
/*** ZpiObject Class                                                                           ***/
/***   1. Provides command framer (SREQ)                                                       ***/
/***   2. Provides parser (SRSP, AREQ)                                                         ***/
/*************************************************************************************************/
function ZpiObject(subsys, cmd, args) { // args is optional, and can be an array or a value-object if given
    var subsystem = zmeta.Subsys.get(subsys),
        command,
        reqParams;

    this.type = undefined;      // string after assgined
    this.subsys = undefined;    // string after assigned
    this.cmd = undefined;       // string after assigned
    this.cmdId = undefined;     // number after assigned
    this.args = undefined;      // array after assigned: [ { name, type, value }, ... ]

    if (!subsystem)
        throw new Error('Unrecognized subsystem');

    this.subsys = subsystem.key;
    command = zmeta[this.subsys].get(cmd);

    if (!command)
        throw new Error('Unrecognized command');

    this.cmd = command.key;
    this.cmdId = command.value;

    this.type = zmeta.getType(this.subsys, this.cmd);

    if (!this.type)
        throw new Error('Unrecognized type');

    // if args is given, this is for REQ transmission
    // otherwise, maybe just for parsing RSP packet
    if (args)
        reqParams = zmeta.getReqParams(this.subsys, this.cmd);    // [ { name, type }, ... ]

    if (reqParams) {
        if (Array.isArray(args)) {
            // arg: { name, type } -> { name, type, value }
            reqParams.forEach(function (arg, idx) {
                arg.value = args[idx];
            });
        } else if (typeof args === 'object') {
            reqParams.forEach(function (arg, idx) {
                if (!args.hasOwnProperty(arg.name))
                    throw new Error('The argument object has incorrect properties');
                else
                    arg.value = args[arg.name];
            });
        }

        this.args = reqParams;              // [ { name, type, value }, ... ]
    }
}

ZpiObject.prototype.parse = function (type, bufLen, zBuf, callback) {
    var chunkRules = [],
        err,
        rspParams,
        parser,
        parseTimeout;

    if (type === 'SRSP' || type === 3)      // SRSP
        rspParams = zmeta.getRspParams(this.subsys, this.cmd);
    else if (type === 'AREQ' || type === 2) // AREQ
        rspParams = zmeta.getReqParams(this.subsys, this.cmd);

    if (rspParams) {                        // [ { name, type }, ... ]
        rspParams.forEach(function (arg) {
            var rule = ru[arg.type];
            if (rule) {
                rule = rule(arg.name, bufLen);
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
                callback(new Error('parse timeout'));
            else
                callback(null, result);
        });
    }

    if (!parser)    // error occurs, no parser created
        callback(err);
    else
        parser.end(zBuf);
};

ZpiObject.prototype.frame = function () {
    if (!Array.isArray(this.args))  // no args, cannot build frame
        return null;

    var dataBuf = Concentrate();

    this.args.forEach(function (arg, idx) { // arg: { name, type, value }
        var type = arg.type,
            val = arg.value;

        switch (type) {
            case 'uint8':
            case 'uint16':
            case 'uint32':
                dataBuf = dataBuf[type](val);
                break;
            case 'buffer':
            case 'dynbuffer':
                dataBuf = dataBuf.buffer(new Buffer(val));
                break;
            case 'longaddr':    // string '0x00124b00019c2ee9'
                var msb = parseInt(val.slice(2,10), 16),
                    lsb = parseInt(val.slice(10), 16);

                dataBuf = dataBuf.uint32le(lsb).uint32le(msb);
                break;
            case 'listbuffer':  // [ 0x0001, 0x0002, 0x0003, ... ]
                var tempBuf = new Buffer(val.length * 2),
                    idxbuf;

                for (idxbuf = 0; idxbuf < val.length; idxbuf += 1) {
                    tempBuf.writeUInt16LE(val[idxbuf], idxbuf * 2);
                }
                dataBuf = dataBuf.buffer(tempBuf);
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
var rules = [ 'buffer8', 'buffer16', 'buffer18', 'buffer32', 'buffer42', 'buffer100',
              '_preLenUint8', '_preLenUint16' ];

rules.forEach(function (ruName) {
    ru.clause(ruName, function (name) {
        var needTap = true,
            bufLen;

        if (ruName === '_preLenUint8') {
            this.uint8(name);
        } else if (ruName === '_preLenUint16') {
            this.uint16(name);
        } else {
            needTap = false;
            bufLen = parseInt(ruName.slice(6));
            this.buffer(name, bufLen);
        }

        if (needTap)
            this.tap(function () {
                this.buffer('preLenData', this.vars[name]);
            });
    });
});

ru.clause('longaddr', function (name) {
    this.buffer(name, 8).tap(function () {
        var addrBuf = this.vars[name];
        this.vars[name] = addrBuf2Str(addrBuf);
    });
});

ru.clause('uint8ZdoInd', function (name, bufLen) {
    if (bufLen === 3)
        this.uint16('nwkaddr').uint8(name);
    else if (bufLen === 1)
        this.uint8(name);
});

ru.clause('devlistbuffer', function (name, bufLen) {
    this.buffer(name, bufLen - 13).tap(function () {
        this.vars[name] = bufToArray(this.vars[name], 'uint16');
    });
});

ru.clause('nwklistbuffer', function (name, bufLen) {
    this.buffer(name, bufLen - 6).tap(function () {
        var buf = this.vars[name],
            list = [],
            listcount,
            getList,
            start = 0,
            end,
            len,
            i;

        if (name === 'networklist') {
            listcount = this.vars.networklistcount;
            end = len = 12;
            getList = networkList;
        } else if (name === 'neighborlqilist') {
            listcount = this.vars.neighborlqilistcount;
            end = len = 22;
            getList = neighborLqiList;
        } else if (name === 'routingtablelist') {
            listcount = this.vars.routingtablelistcount;
            end = len = 5;
            getList = routingTableList;
        } else {
            listcount = this.vars.bindingtablelistcount;
            this.vars[name] = bindTableList(buf, listcount);
            return;
        }

        for (i = 0; i < listcount; i += 1) {
            list.push(getList(buf.slice(start, end)));
            start = start + len;
            end = end + len;
        }

        this.vars[name] = list;
    });
});

ru.clause('zdomsgcb', function (name, bufLen) {
    this.buffer(name, bufLen - 9);
});

ru.clause('preLenList', function (name) {
    this.uint8(name).tap(function () {
        this.buffer('preLenData', 2 * (this.vars[name]));
    });
});

ru.clause('preLenBeaconlist', function (name) {
    this.uint8(name).tap(function () {
        this.buffer('preLenData', 21 * (this.vars[name])).tap(function () {
            var buf = this.vars.preLenData,
                list = [],
                len = 21,
                start = 0,
                end = 21,
                i;

            for (i = 0; i < this.vars[name]; i += 1) {
                list.push(beaconList(buf.slice(start, end)));
                start = start + len;
                end = end + len;
            }

            this.vars.preLenData = list;
        });
    });
});

ru.clause('dynbuffer', function (name) {
    this.tap(function () {
        this.vars[name] = this.vars.preLenData;
        delete this.vars.preLenData;
    });
});

function networkList(buf) {
    var item = {},
        i = 0;

    item.neightborPanId = buf.readUInt16LE(i);
    i += (2+6);
    item.logicalChannel = buf.readUInt8(i);
    i += 1;
    item.stackProfile = buf.readUInt8(i) & 0x0F;
    item.zigbeeVersion = (buf.readUInt8(i) & 0xF0) >> 4;
    i += 1;
    item.beaconOrder = buf.readUInt8(i) & 0x0F;
    item.superFrameOrder = (buf.readUInt8(i) & 0xF0) >> 4;
    i += 1;
    item.permitJoin = buf.readUInt8(i);
    i += 1;

    return item;
}

function neighborLqiList(buf) {
    var item = {},
        i = 0;

    item.extPandId = addrBuf2Str(buf.slice(0, 8));
    i += 8;
    item.extAddr = addrBuf2Str(buf.slice(8, 16));
    i += 8;
    item.nwkAddr = buf.readUInt16LE(i);
    i += 2;
    item.deviceType = buf.readUInt8(i) & 0x03;
    item.rxOnWhenIdle = (buf.readUInt8(i) & 0x0C) >> 2;
    item.relationship = (buf.readUInt8(i) & 0x70) >> 4;
    i += 1;
    item.permitJoin = buf.readUInt8(i) & 0x03;
    i += 1;
    item.depth = buf.readUInt8(i);
    i += 1;
    item.lqi = buf.readUInt8(i);
    i += 1;

    return item;
}

function routingTableList(buf) {
    var item = {},
        i = 0;

    item.destNwkAddr = buf.readUInt16LE(i);
    i += 2;
    item.routeStatus = buf.readUInt8(i) & 0x07;
    i += 1;
    item.nextHopNwkAddr = buf.readUInt16LE(i);
    i += 2;

    return item;
}

function bindTableList(buf, listcount) {
    var itemObj,
        list = [],
        len = 21,
        start = 0,
        end = len,
        i;

    function getList(buf) {
        var itemObj = {
                item: {},
                thisItemLen: 0
            },
            itemLen = 21,
            item = {},
            i = 0;

        item.srcAddr = addrBuf2Str(buf.slice(0, 8));
        i += 8;
        item.srcEp = buf.readUInt8(i);
        i += 1;
        item.clusterId = buf.readUInt16LE(i);
        i += 2;
        item.dstAddrMode = buf.readUInt8(i);
        i += 1;
        item.dstAddr = addrBuf2Str(buf.slice(12, 20));
        i += 8;

        if (item.dstAddrMode === 3) {  // 'Addr64Bit'
            item.dstEp = buf.readUInt8(i);
            i += 1;
        } else {
            itemLen = itemLen - 1;
        }

        itemObj.thisItemLen = itemLen;
        itemObj.item = item;
        return itemObj;
    }

    for (i = 0; i < listcount; i += 1) {
        itemObj = getList(buf.slice(start, end));
        list.push(itemObj.item);

        start = start + itemObj.thisItemLen;
        if (i === listcount - 2) {  // for the last item, we don't know the length of bytes
            end = buf.length;       // so, assign 'end' by the buf length to avoid memory leak.
        } else {
            end = start + len;      // for each item, take 21 bytes from buf to parse
        }
    }

    return list;
}

function beaconList(buf) {
    var item = {},
        i = 0;

    item.srcAddr = buf.readUInt16LE(i);
    i += 2;
    item.padId = buf.readUInt16LE(i);
    i += 2;
    item.logicalChannel = buf.readUInt8(i);
    i += 1;
    item.permitJoin = buf.readUInt8(i);
    i += 1;
    item.routerCapacity = buf.readUInt8(i);
    i += 1;
    item.deviceCapacity = buf.readUInt8(i);
    i += 1;
    item.protocolVersion = buf.readUInt8(i);
    i += 1;
    item.stackProfile = buf.readUInt8(i);
    i += 1;
    item.lqi = buf.readUInt8(i);
    i += 1;
    item.depth = buf.readUInt8(i);
    i += 1;
    item.updateId = buf.readUInt8(i);
    i += 1;
    item.extPandId = addrBuf2Str(buf.slice(13));
    i += 8;

    return item;
}

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

function bufToArray(buf, nip) {
    var i,
        nipArr = [];
    if (nip === 'uint8') {
        for (i = 0; i < buf.length; i += 1) {
            nipArr.push(buf.readUInt8(i));
        }
    } else if (nip === 'uint16') {
        for (i = 0; i < buf.length; i += 2) {
            nipArr.push(buf.readUInt16LE(i));
        }
    }
    return nipArr;
}

module.exports = ZpiObject;
