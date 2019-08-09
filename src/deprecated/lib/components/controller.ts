import {Znp} from '../../znp';
import {Subsystem, Type} from '../../unpi/constants';
import ZpiObject from 'src/znp/zpiObject';

import * as Zsc from '../../zstack-constants';

const fs = require('fs');

var util = require('util'),
    EventEmitter = require('events');

var Q = require('q'),
    _ = require('busyman'),
    znp = Znp.getInstance(),
    proving = require('proving'),
    debug = {
        shepherd: require('debug')('zigbee-shepherd'),
        init: require('debug')('zigbee-shepherd:init'),
        request: require('debug')('zigbee-shepherd:request'),
        response: require('debug')('zigbee-shepherd:response')
    };

var Zdo = require('./zdo'),
    query = require('./query'),
    bridge = require('./event_bridge.js'),
    nvParams = require('../config/nv_start_options.js'),
    nvBackup = require('../config/nv_backup.js');

var Device = require('../model/device'),
    Coordpoint = require('../model/coordpoint');

function bufToArray(buf) {
    var arr = [];

    for (var i = 0; i < buf.length; i += 1) {
        arr.push(buf.readUInt8(i));
    }

    return arr;
}

function Controller(shepherd, cfg) {
    // cfg is serial port config
    var self = this,
        transId = 0;

    EventEmitter.call(this);

    if (!_.isPlainObject(cfg))
        throw new TypeError('cfg should be an object.');

    /***************************************************/
    /*** Protected Members                           ***/
    /***************************************************/
    this._shepherd = shepherd;
    this._coord = null;
    this._znp = znp; // required sometimes
    this._cfg = cfg;
    this._zdo = new Zdo(this);
    this._resetting = false;
    this._spinLock = false;
    this._joinQueue = [];
    this._permitJoinTime = 0;
    this._permitJoinInterval;

    this._net = {
        state: null,
        channel: null,
        panId: null,
        extPanId: null,
        ieeeAddr: null,
        nwkAddr: null,
        joinTimeLeft: 0
    };

    this._firmware = {
        version: null,
        revision: null
    };

    this._isZstack3x0 = false;
    this._isZstack30x = false;

    this._joinWaitList = {}

    /***************************************************/
    /*** Public Members                              ***/
    /***************************************************/
    this.query = query(this);

    this.nextTransId = function () {  // zigbee transection id
        if (++transId > 255)
            transId = 1;
        return transId;
    };

    this.permitJoinCountdown = function () {
        return self._permitJoinTime -= 1;
    };

    this.isResetting = function () {
        return self._resetting;
    };

    /***************************************************/
    /*** Event Handlers                              ***/
    /***************************************************/

    znp.on('close', function () {
        self.emit('ZNP:CLOSE');
    });

    znp.on('received', function (msg: ZpiObject) {
        if (msg.type === Type.AREQ) {
            bridge._areqEventBridge(self, msg);
        }
    });

    this.on('ZDO:tcDeviceInd', function (tcData) {
        if(tcData.parentaddr == 0){
            return
        }
        const data = {srcaddr: tcData.nwkaddr, nwkaddr: tcData.nwkaddr, ieeeaddr: tcData.extaddr, capabilities: {}};
        if (self._spinLock) {
            self._joinQueue.push({
                func: function () {
                    self.endDeviceAnnceHdlr(data);
                },
                ieeeAddr: data.ieeeaddr
            });
        } else {
            self._spinLock = true;
            self.endDeviceAnnceHdlr(data);
        }
    });

    this.on('ZDO:endDeviceAnnceInd', function (data) {
        debug.shepherd('spinlock:', self._spinLock, self._joinQueue);
        if (self._spinLock) {
            // Check if joinQueue already has this device
            for (var i = 0; i < self._joinQueue.length; i++) {
                if (self._joinQueue[i].ieeeAddr == data.ieeeaddr) {
                    debug.shepherd(`Device: ${self._joinQueue[i].ieeeAddr} already in joinqueue`);
                    return;
                }
            }

            self._joinQueue.push({
                func: function () {
                    self.endDeviceAnnceHdlr(data);
                },
                ieeeAddr: data.ieeeaddr
            });
        } else {
            self._spinLock = true;
            self.endDeviceAnnceHdlr(data);
        }
    });
}

util.inherits(Controller, EventEmitter);

/*************************************************************************************************/
/*** Public ZigBee Utility APIs                                                                ***/
/*************************************************************************************************/
Controller.prototype.getFirmwareInfo = function () {
    var firmware = _.cloneDeep(this._firmware);

    return firmware;
};

Controller.prototype.getNetInfo = function () {
    var net = _.cloneDeep(this._net);

    if (net.state === Zsc.COMMON.devStates.ZB_COORD)
        net.state = 'Coordinator';

    net.joinTimeLeft = this._permitJoinTime;

    return net;
};

Controller.prototype.setNetInfo = function (netInfo) {
    var self = this;

    _.forEach(netInfo, function (val, key) {
        if (_.has(self._net, key))
            self._net[key] = val;
    });
};

/*************************************************************************************************/
/*** Mandatory Public APIs                                                                     ***/
/*************************************************************************************************/


Controller.prototype.close = function (callback) {
    var self = this,
        deferred = Q.defer(),
        closeLsn;

    closeLsn = function () {
        deferred.resolve();
    };

    this.once('ZNP:CLOSE', closeLsn);

    Q.ninvoke(znp, 'close').fail(function (err) {
        self.removeListener('ZNP:CLOSE', closeLsn);
        deferred.reject(err);
    }).done();

    return deferred.promise.nodeify(callback);
};

Controller.prototype.request = function (subsys, cmdId, valObj, callback) {
    var deferred = Q.defer(),
        rspHdlr;

    proving.stringOrNumber(subsys, 'subsys should be a number or a string.');
    proving.stringOrNumber(cmdId, 'cmdId should be a number or a string.');

    if (!_.isPlainObject(valObj) && !_.isArray(valObj))
        throw new TypeError('valObj should be an object or an array.');

    if (_.isString(subsys))
        subsys = subsys.toUpperCase();

    rspHdlr = function (err, rsp) {
        if (subsys !== 'ZDO' && subsys !== 5) {
            if (rsp && rsp.hasOwnProperty('status'))
                debug.request('RSP <-- %s, status: %d', subsys + ':' + cmdId, rsp.status);
            else
                debug.request('RSP <-- %s', subsys + ':' + cmdId);
        }

        if (err)
            deferred.reject(err);
        else if ((subsys !== 'ZDO' && subsys !== 5) && rsp && rsp.hasOwnProperty('status') && rsp.status !== 0)  // unsuccessful
            deferred.reject(new Error('rsp error: ' + rsp.status));
        else
            deferred.resolve(rsp);
    };

    if ((subsys === 'AF' || subsys === 4) && valObj.hasOwnProperty('transid'))
        debug.request('REQ --> %s, transId: %d', subsys + ':' + cmdId, valObj.transid);
    else
        debug.request('REQ --> %s', subsys + ':' + cmdId);

    if (subsys === 'ZDO' || subsys === 5) {
        this._zdo.request(cmdId, valObj, rspHdlr);          // use wrapped zdo as the exported api
    } else {
        const promise = znp.request(Subsystem[subsys], cmdId, valObj);  // SREQ has timeout inside znp
        promise.then((object) => rspHdlr(null, object.payload)).catch((error) => rspHdlr(error, null));
    }


    return deferred.promise.nodeify(callback);
};

Controller.prototype.remove = function (dev, cfg, callback) {
    // cfg: { reJoin, rmChildren }
    var self = this,
        reqArgObj,
        rmChildren_reJoin = 0x00;

    if (!(dev instanceof Device))
        throw new TypeError('dev should be an instance of Device class.');
    else if (!_.isPlainObject(cfg))
        throw new TypeError('cfg should be an object.');

    cfg.reJoin = cfg.hasOwnProperty('reJoin') ? !!cfg.reJoin : true;               // defaults to true
    cfg.rmChildren = cfg.hasOwnProperty('rmChildren') ? !!cfg.rmChildren : false;  // defaults to false

    rmChildren_reJoin = cfg.reJoin ? (rmChildren_reJoin | 0x01) : rmChildren_reJoin;
    rmChildren_reJoin = cfg.rmChildren ? (rmChildren_reJoin | 0x02) : rmChildren_reJoin;

    reqArgObj = {
        dstaddr: dev.getNwkAddr(),
        deviceaddress: dev.getIeeeAddr(),
        removechildren_rejoin: rmChildren_reJoin
    };

    return this.request('ZDO', 'mgmtLeaveReq', reqArgObj).then(function (rsp) {
        if (rsp.status !== 0 && rsp.status !== 'SUCCESS')
            return Q.reject(rsp.status);
    }).nodeify(callback);
};

Controller.prototype.simpleDescReq = function (nwkAddr, ieeeAddr, callback) {
    return this.query.deviceWithEndpoints(nwkAddr, ieeeAddr, callback);
};

Controller.prototype.bind = function (srcEp, cId, dstEpOrGrpId, callback) {
    return this.query.setBindingEntry('bind', srcEp, cId, dstEpOrGrpId, callback);
};

Controller.prototype.unbind = function (srcEp, cId, dstEpOrGrpId, callback) {
    return this.query.setBindingEntry('unbind', srcEp, cId, dstEpOrGrpId, callback);
};

Controller.prototype.findEndpoint = function (addr, epId) {
    return this._shepherd.find(addr, epId);
};

Controller.prototype.setNvParams = function (net) {
    // net: { panId, extPanId, channelList, precfgkey, precfgkeysEnable, startoptClearState }
    net = net || {};
    proving.object(net, 'opts.net should be an object.');

    _.forEach(net, function (val, param) {
        switch (param) {
            case 'panId':
                proving.number(val, 'net.panId should be a number.');
                nvParams.panId.value = [ val & 0xFF, (val >> 8) & 0xFF ];
                break;
            case 'extPanId':
                if (val && (!_.isArray(val) || val.length !== 8))
                    throw new TypeError('net.extPanId should be an array with 8 uint8 integers.');
                if (val) {
                    nvParams.extPanId.value = val;
                }
                break;
            case 'precfgkey':
                if (!_.isArray(val) || val.length !== 16)
                    throw new TypeError('net.precfgkey should be an array with 16 uint8 integers.');
                nvParams.precfgkey.value = val;
                break;
            case 'precfgkeysEnable':
                proving.boolean(val, 'net.precfgkeysEnable should be a bool.');
                nvParams.precfgkeysEnable.value = val ? [ 0x01 ] : [ 0x00 ];
                break;
            case 'startoptClearState':
                proving.boolean(val, 'net.startoptClearState should be a bool.');
                nvParams.startupOption.value = val ? [ 0x02 ] : [ 0x00 ];
                break;
            case 'channelList':
                proving.array(val, 'net.channelList should be an array.');
                var chList = 0;

                _.forEach(val, function (ch) {
                    if (ch >= 11 && ch <= 26)
                        chList = chList | Zsc.COMMON.channelMask['CH' + ch];
                });

                nvParams.channelList.value = [ chList & 0xFF, (chList >> 8) & 0xFF, (chList >> 16) & 0xFF, (chList >> 24) & 0xFF ];
                break;
            default:
                throw new TypeError('Unkown argument: ' + param + '.');
        }
    });
};

Controller.prototype.checkOnline = function (dev, callback) {
    var self = this,
        nwkAddr = dev.getNwkAddr(),
        ieeeAddr = dev.getIeeeAddr(),
        deferred = Q.defer();

    Q.fcall(function () {
        return self.request('ZDO', 'nodeDescReq', { dstaddr: nwkAddr, nwkaddrofinterest: nwkAddr }).timeout(5000).fail(function () {
            return self.request('ZDO', 'nodeDescReq', { dstaddr: nwkAddr, nwkaddrofinterest: nwkAddr }).timeout(5000);
        });
    }).then(function () {
        if (dev.status === 'offline') {
            self.emit('ZDO:endDeviceAnnceInd', { srcaddr: nwkAddr, nwkaddr: nwkAddr, ieeeaddr: ieeeAddr, capabilities: {} });
        }
        return deferred.resolve();
    }).fail(function (err) {
        return deferred.reject(err);
    }).done();

    return deferred.promise.nodeify(callback);
};

Controller.prototype.endDeviceAnnceHdlr = function (data) {
    var self = this,
        joinTimeout,
        joinEvent = 'ind:incoming' + ':' + data.ieeeaddr,
        dev = this._shepherd._findDevByAddr(data.ieeeaddr);

    if (dev && dev.status === 'online'){  // Device has already joined, do next item in queue
        debug.shepherd(`Device: ${dev.getIeeeAddr()} already in network`);

        if (self._joinQueue.length) {
            var next = self._joinQueue.shift();

            if (next) {
                debug.shepherd('next item in joinqueue');
                setImmediate(function () {
                    next.func();
                });
            } else {
                debug.shepherd('no next item in joinqueue');
                self._spinLock = false;
            }
        } else {
            self._spinLock = false;
        }

        return;
    }

    joinTimeout = setTimeout(function () {
        if (self.listenerCount(joinEvent)) {
            self.emit(joinEvent, '__timeout__');
            self._shepherd.emit('joining', { type: 'timeout', ieeeAddr: data.ieeeaddr });
        }

        joinTimeout = null;
    }, 30000);

    this.once(joinEvent, function () {
        if (joinTimeout) {
            clearTimeout(joinTimeout);
            joinTimeout = null;
        }

        if (self._joinQueue.length) {
            var next = self._joinQueue.shift();

            if (next){
                setImmediate(function () {
                    next.func();
                });
            } else {
                self._spinLock = false;
            }
        } else {
            self._spinLock = false;
        }
    });

    this._shepherd.emit('joining', { type: 'associating', ieeeAddr: data.ieeeaddr });

    this.simpleDescReq(data.nwkaddr, data.ieeeaddr).then(function (devInfo) {
        return devInfo;
    }).fail(function () {
        return self.simpleDescReq(data.nwkaddr, data.ieeeaddr);
    }).then(function (devInfo) {
        // Now that we have the simple description of the device clear joinTimeout
        if (joinTimeout) {
            clearTimeout(joinTimeout);
            joinTimeout = null;
        }

        // Defer a promise to wait for the controller to complete the ZDO:devIncoming event!
        var processIncoming = Q.defer();
        self.emit('ZDO:devIncoming', devInfo, processIncoming.resolve, processIncoming.reject);
        return processIncoming.promise;
    }).then(function () {
        self.emit(joinEvent, '__timeout__');
    }).fail(function (err) {
        self._shepherd.emit('error', 'Cannot get the Node Descriptor of the Device: ' + data.ieeeaddr + ' ('+err+')');
        self._shepherd.emit('joining', { type: 'error', ieeeAddr: data.ieeeaddr });
        self.emit(joinEvent, '__timeout__');
    }).done();
};

Controller.prototype.backupCoordinator = async function (path, callback) {
    const deferred = Q.defer();

    if (!this._isZstack30x && !this._isZstack3x0) {
        debug.shepherd('Backup is only supported for Z-Stack 3, skipping...');
        Q.fcall(() => {}).nodeify(callback);
        return;
    }

    const backup = {items: {}, meta: {product: this._firmware.product}};
    const self = this;

    const steps = [
        function () { return self.request('SYS', 'osalNvRead', nvBackup.ZCD_NV_EXTADDR).delay(10).then((result) => {
            backup.items.ZCD_NV_EXTADDR = {
                ...nvBackup.ZCD_NV_EXTADDR,
                value: result.value.toJSON().data,
                len: result.len,
            };
        }); },
        function () { return self.request('SYS', 'osalNvRead', nvBackup.ZCD_NV_NIB).delay(10).then((result) => {
            backup.items.ZCD_NV_NIB = {
                ...nvBackup.ZCD_NV_NIB,
                value: result.value.toJSON().data,
                len: result.len,
            };
        }); },
        function () { return self.request('SYS', 'osalNvRead', nvBackup.ZCD_NV_EXTENDED_PAN_ID).delay(10).then((result) => {
            backup.items.ZCD_NV_EXTENDED_PAN_ID = {
                ...nvBackup.ZCD_NV_EXTENDED_PAN_ID,
                value: result.value.toJSON().data,
                len: result.len,
            };
        }); },
        function () { return self.request('SYS', 'osalNvRead', nvBackup.ZCD_NV_NWK_ACTIVE_KEY_INFO).delay(10).then((result) => {
            backup.items.ZCD_NV_NWK_ACTIVE_KEY_INFO = {
                ...nvBackup.ZCD_NV_NWK_ACTIVE_KEY_INFO,
                value: result.value.toJSON().data,
                len: result.len,
            };
        }); },
        function () { return self.request('SYS', 'osalNvRead', nvBackup.ZCD_NV_NWK_ALTERN_KEY_INFO).delay(10).then((result) => {
            backup.items.ZCD_NV_NWK_ALTERN_KEY_INFO = {
                ...nvBackup.ZCD_NV_NWK_ALTERN_KEY_INFO,
                value: result.value.toJSON().data,
                len: result.len,
            };
        }); },
        function () { return self.request('SYS', 'osalNvRead', nvBackup.ZCD_NV_APS_USE_EXT_PANID).delay(10).then((result) => {
            backup.items.ZCD_NV_APS_USE_EXT_PANID = {
                ...nvBackup.ZCD_NV_APS_USE_EXT_PANID,
                value: result.value.toJSON().data,
                len: result.len,
            };
        }); },
        function () { return self.request('SYS', 'osalNvRead', nvBackup.ZCD_NV_PRECFGKEY).delay(10).then((result) => {
            backup.items.ZCD_NV_PRECFGKEY = {
                ...nvBackup.ZCD_NV_PRECFGKEY,
                value: result.value.toJSON().data,
                len: result.len,
            };
        }); },
        function () { return self.request('SYS', 'osalNvRead', nvBackup.ZCD_NV_TCLK_TABLE_START).delay(10).then((result) => {
            backup.items.ZCD_NV_TCLK_TABLE_START = {
                ...nvBackup.ZCD_NV_TCLK_TABLE_START,
                value: result.value.toJSON().data,
                len: result.len,
            };
        }); },
        function () { return self.request('SYS', 'osalNvRead', nvBackup.ZCD_NV_CHANLIST).delay(10).then((result) => {
            backup.items.ZCD_NV_CHANLIST = {
                ...nvBackup.ZCD_NV_CHANLIST,
                value: result.value.toJSON().data,
                len: result.len,
            };
        }); },
        function () { return self.request('SYS', 'osalNvRead', nvBackup.ZCD_NV_NWK_SEC_MATERIAL_TABLE_START).delay(10).then((result) => {
            backup.items.ZCD_NV_NWK_SEC_MATERIAL_TABLE_START = {
                ...nvBackup.ZCD_NV_NWK_SEC_MATERIAL_TABLE_START,
                value: result.value.toJSON().data,
                len: result.len,
            };
        }); },
    ];

    Q.fcall(function () {
        return steps.reduce(function (soFar, fn) {
            return soFar.then(fn);
        }, Q(0));
    }).then(function () {
        const data = JSON.stringify(backup, null, 2);
        fs.writeFileSync(path, data);
        return deferred.resolve();
    }).nodeify(callback);
};

Controller.prototype.restoreCoordinator = function (path) {
    const backup = JSON.parse(fs.readFileSync(path));
    const self = this;
    const deferred = Q.defer();

    if (backup.meta.product != this._firmware.product) {
        return Q.reject(`Cannot restore backup, backup product is ${backup.meta.product}, actual is ${this._firmware.product}`);
    }

    if (!_.isEqual(backup.items.ZCD_NV_CHANLIST.value, nvParams.channelList.value)) {
        return Q.reject(`Cannot restore backup, channel of backup is different.`);
    }

    if (!_.isEqual(backup.items.ZCD_NV_PRECFGKEY.value, nvParams.precfgkey3.value)) {
        return Q.reject(`Cannot restore backup, network encryption key of backup is different.`);
    }

    const ZCD_NV_NIB = {
        ...backup.items.ZCD_NV_NIB,
        initvalue: backup.items.ZCD_NV_NIB.value,
        initlen: backup.items.ZCD_NV_NIB.len,

    };

    delete ZCD_NV_NIB.offset;
    delete ZCD_NV_NIB.value;

    const steps = [
        function () { return self.request('SYS', 'osalNvWrite', backup.items.ZCD_NV_EXTADDR).delay(10)},
        function () { return self.request('SYS', 'osalNvItemInit', ZCD_NV_NIB).delay(10).fail(function (err) {
            return (err.message === 'rsp error: 9') ? null : Q.reject(err);  // Success, item created and initialized
        }); },
        function () { return self.request('SYS', 'osalNvWrite', backup.items.ZCD_NV_EXTENDED_PAN_ID).delay(10)},
        function () { return self.request('SYS', 'osalNvWrite', backup.items.ZCD_NV_NWK_ACTIVE_KEY_INFO).delay(10)},
        function () { return self.request('SYS', 'osalNvWrite', backup.items.ZCD_NV_NWK_ALTERN_KEY_INFO).delay(10)},
        function () { return self.request('SYS', 'osalNvWrite', backup.items.ZCD_NV_APS_USE_EXT_PANID).delay(10)},
        function () { return self.request('SYS', 'osalNvWrite', backup.items.ZCD_NV_PRECFGKEY).delay(10)},
        function () { return self.request('SYS', 'osalNvWrite', backup.items.ZCD_NV_TCLK_TABLE_START).delay(10)},
        function () { return self.request('SYS', 'osalNvWrite',  backup.items.ZCD_NV_NWK_SEC_MATERIAL_TABLE_START).delay(10)},
        function () { return self.request('SYS', 'osalNvItemInit', nvParams.znpCfgItem3).delay(10).fail(function (err) {
            return (err.message === 'rsp error: 9') ? null : Q.reject(err);  // Success, item created and initialized
        }); },
        function () { return self.request('SYS', 'osalNvWrite',  nvParams.znpHasConfigured3).delay(10)},
        function () { return self.request('SYS', 'osalNvItemInit', nvParams.bdbNodeIsOnANetwork).delay(10).fail(function (err) {
            return (err.message === 'rsp error: 9') ? null : Q.reject(err);  // Success, item created and initialized
        }); },
        function () { return self.request('SYS', 'resetReq', { type: 0x01 }).delay(10)},
    ];

    return steps.reduce(function (soFar, fn) {
        return soFar.then(fn);
    }, Q(0));
};

/*************************************************************************************************/
/*** Private Functions                                                                         ***/
/*************************************************************************************************/
function makeRegParams(loEp) {
    return {
        endpoint: loEp.getEpId(),
        appprofid: loEp.getProfId(),
        appdeviceid: loEp.getDevId(),
        appdevver: 0,
        latencyreq: Zsc.AF.networkLatencyReq.NO_LATENCY_REQS,
        appnuminclusters: loEp.inClusterList.length,
        appinclusterlist: loEp.inClusterList,
        appnumoutclusters: loEp.outClusterList.length,
        appoutclusterlist: loEp.outClusterList
    };
}

module.exports = Controller;
