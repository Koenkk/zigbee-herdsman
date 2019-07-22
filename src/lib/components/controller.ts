import {Znp} from '../../znp';
import {Subsystem, Type} from '../../unpi/constants';
import ZpiObject from 'src/znp/zpiObject';

const fs = require('fs');

var util = require('util'),
    EventEmitter = require('events');

var Q = require('q'),
    _ = require('busyman'),
    znp = Znp.getInstance(),
    proving = require('proving'),
    ZSC = require('../../zstack-constants'),
    debug = {
        shepherd: require('debug')('zigbee-shepherd'),
        init: require('debug')('zigbee-shepherd:init'),
        request: require('debug')('zigbee-shepherd:request'),
        response: require('debug')('zigbee-shepherd:response')
    };

var Zdo = require('./zdo'),
    query = require('./query'),
    bridge = require('./event_bridge.js'),
    init = require('../initializers/init_controller'),
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
    this.on('ZNP:READY', function () {
        init.setupCoord(self).then(function () {
            self.emit('ZNP:INIT');
        }).fail(function (err) {
            self.emit('ZNP:INIT', err);
            debug.init('Coordinator initialize had an error:', err);
        }).done();
    });

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

    if (net.state === ZSC.ZDO.devStates.ZB_COORD)
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
Controller.prototype.start = function (callback) {
    var self = this,
        deferred = Q.defer();

    var readyLsn = function (err) {
        return err ? deferred.reject(err) : deferred.resolve();
    };

    this.once('ZNP:INIT', readyLsn);

    if (!znp.isInitialized()) {
        znp.open(this._cfg.path, this._cfg.options)
            .then(() => {
                this.emit("ZNP:READY");
            })
            .catch((error) => {
                self.removeListener('ZNP:INIT', readyLsn);
                deferred.reject(error);
            });
    } else {
        this.emit("ZNP:READY");
    }

    return deferred.promise.nodeify(callback);
};

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

Controller.prototype.reset = function (mode, callback) {
    var self = this,
        deferred = Q.defer(),
        startupOption = nvParams.startupOption.value[0];

    proving.stringOrNumber(mode, 'mode should be a number or a string.');

    Q.fcall(function () {
        if (mode === 'soft' || mode === 1) {
            debug.shepherd('Starting a software reset...');
            self._resetting = true;

            return self.request('SYS', 'resetReq', { type: 0x01 });
        } else if (mode === 'hard' || mode === 0) {
            debug.shepherd('Starting a hardware reset...');
            self._resetting = true;

            if (self._nvChanged && startupOption !== 0x02)
                nvParams.startupOption.value[0] = 0x02;

            var steps = [
                function () { return self.request('SYS', 'resetReq', { type: 0x01 }).delay(10); },
                function () { return self.request('SYS', 'osalNvWrite', nvParams.startupOption).delay(10); },
                function () { return self.request('SYS', 'resetReq', { type: 0x01 }).delay(10); },
                function () { return self.request('SYS', 'osalNvWrite', nvParams.logicalType).delay(10); },
                function () { return self.request('SYS', 'osalNvWrite', nvParams.precfgkeysEnable).delay(10); },
                function () { return self.request('SYS', 'osalNvWrite', nvParams.zdoDirectCb).delay(10); },
                function () { return self.request('SYS', 'osalNvWrite', nvParams.channelList).delay(10); },
            ];

            const isZstack3 = self._isZstack3x0 || self._isZstack30x;

            if (isZstack3) {
                const channel = Buffer.from(nvParams.channelList.value).readUInt32LE();

                steps = steps.concat([
                    function () { return self.request('SYS', 'osalNvWrite', nvParams.precfgkey3).delay(10); },
                    // NOTE: linkkey is not written for z-stack 3 as the default one is already OK.
                    function () { return self.request('APP_CNF', 'bdbSetChannel', {isPrimary: 0x1, channel: channel}).delay(10); },
                    function () { return self.request('APP_CNF', 'bdbSetChannel', {isPrimary: 0x0, channel: 0x0}).delay(10); },
                    function () { return self.request('APP_CNF', 'bdbStartCommissioning', {mode: 0x04}).delay(5000); },
                    function () { return self.request('APP_CNF', 'bdbStartCommissioning', {mode: 0x02}).delay(10); },
                ]);
            } else {
                steps = steps.concat([
                    function () { return self.request('SYS', 'osalNvWrite', nvParams.panId).delay(10); },
                    function () { return self.request('SYS', 'osalNvWrite', nvParams.extPanId).delay(10); },
                    function () { return self.request('SAPI', 'writeConfiguration', nvParams.precfgkey).delay(10); },
                    function () { return self.request('SYS', 'osalNvWrite', nvParams.securityMode).delay(10); },
                ]);
            }

            if(isZstack3) {
                steps = steps.concat([
                    function () { return self.request('SYS', 'osalNvItemInit', nvParams.znpCfgItem3).delay(10).fail(function (err) {
                        return (err.message === 'rsp error: 9') ? null : Q.reject(err);  // Success, item created and initialized
                    }); },
                    function () { return self.request('SYS', 'osalNvWrite', nvParams.znpHasConfigured3).delay(10); },
                ]);
            } else {
                steps = steps.concat([
                    function () { return self.request('SYS', 'osalNvItemInit', nvParams.znpCfgItem).delay(10).fail(function (err) {
                        return (err.message === 'rsp error: 9') ? null : Q.reject(err);  // Success, item created and initialized
                    }); },
                    function () { return self.request('SYS', 'osalNvWrite', nvParams.znpHasConfigured).delay(10); },
                ]);
            }

            return steps.reduce(function (soFar, fn) {
                return soFar.then(fn);
            }, Q(0));
        } else {
            return Q.reject(new Error('Unknown reset mode.'));
        }
    }).then(function () {
        self._resetting = false;
        if (self._nvChanged) {
            nvParams.startupOption.value[0] = startupOption;
            self._nvChanged = false;
            deferred.resolve();
        } else {
            self.once('_reset', function (err) {
                return err ? deferred.reject(err) : deferred.resolve();
            });
            self.emit('SYS:resetInd', '_reset');
        }
    }).fail(function (err) {
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

Controller.prototype.permitJoin = function (time, type, callback) {
    // time: seconds, 0x00 disable, 0xFF always enable
    // type: 0 (coord) / 1 (all) / router addr if > 1
    var self = this,
        addrmode,
        dstaddr;

    proving.number(time, 'time should be a number.');
    proving.stringOrNumber(type, 'type should be a number or a string.');

    return Q.fcall(function () {
        if (type === 0 || type === 'coord') {
            addrmode = 0x02;
            dstaddr = 0x0000;
        } else if (type === 1 || type === 'all') {
            addrmode = 0x0F;
            dstaddr = 0xFFFC;   // all coord and routers
        } else if (typeof type === "number") {
            addrmode = 0x02; // address mode
            dstaddr = type; // router address
        } else {
            return Q.reject(new Error('Not a valid type.'));
        }
    }).then(function () {
        if (time > 255 || time < 0)
            return Q.reject(new Error('Jointime can only range from  0 to 255.'));
        else
            self._permitJoinTime = Math.floor(time);
    }).then(function () {
        return self.request('ZDO', 'mgmtPermitJoinReq', { addrmode: addrmode, dstaddr: dstaddr , duration: time, tcsignificance: 0 });
    }).then(function (rsp) {
        self.emit('permitJoining', self._permitJoinTime, dstaddr);

        if (time !== 0 && time !== 255) {
            clearInterval(self._permitJoinInterval);
            self._permitJoinInterval = setInterval(function () {
                if (self.permitJoinCountdown() === 0)
                    clearInterval(self._permitJoinInterval);
                self.emit('permitJoining', self._permitJoinTime, dstaddr);
            }, 1000);
        }
       return rsp;
    }).nodeify(callback);
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

Controller.prototype.registerEp = function (loEp, callback) {
    var self = this;

    if (!(loEp instanceof Coordpoint))
        throw new TypeError('loEp should be an instance of Coordpoint class.');

    return this.request('AF', 'register', makeRegParams(loEp)).then(function (rsp) {
        return rsp;
    }).fail(function (err) {
        return (err.message === 'rsp error: 184') ? self.reRegisterEp(loEp) : Q.reject(err);
    }).nodeify(callback);
};

Controller.prototype.deregisterEp = function (loEp, callback) {
    var self = this,
        coordEps = this._coord.endpoints;

    if (!(loEp instanceof Coordpoint))
        throw new TypeError('loEp should be an instance of Coordpoint class.');

    return Q.fcall(function () {
        if (!_.includes(coordEps, loEp))
            return Q.reject(new Error('Endpoint not maintained by Coordinator, cannot be removed.'));
        else
            return self.request('AF', 'delete', { endpoint: loEp.getEpId() });
    }).then(function (rsp) {
        delete coordEps[loEp.getEpId()];
        return rsp;
    }).nodeify(callback);
};

Controller.prototype.reRegisterEp = function (loEp, callback) {
    var self = this;

    return this.deregisterEp(loEp).then(function () {
        return self.request('AF', 'register', makeRegParams(loEp));
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
                        chList = chList | ZSC.ZDO.channelMask['CH' + ch];
                });

                nvParams.channelList.value = [ chList & 0xFF, (chList >> 8) & 0xFF, (chList >> 16) & 0xFF, (chList >> 24) & 0xFF ];
                break;
            default:
                throw new TypeError('Unkown argument: ' + param + '.');
        }
    });
};

Controller.prototype.checkNvParams = function (callback) {
    var self = this;

    let steps = [];

    if(self._isZstack3x0 || self._isZstack30x) {
        const cb = function (rsp) {
            if (rsp.message === 'rsp error: 2' || !_.isEqual(bufToArray(rsp.value), nvParams.znpHasConfigured3.value)) {
                if (self._shepherd._coordBackupPath && fs.existsSync(self._shepherd._coordBackupPath)) {
                    // not intialized and backup exists, restore from backup
                    return Q.reject('restore');
                } else {
                    return Q.reject('reset');
                }
            }
        }

        steps.push(
            function () { return self.request('SYS', 'osalNvRead', nvParams.znpHasConfigured3).delay(10).fail(cb).then(cb); },
        )
    } else {
        steps = steps.concat([
            function () { return self.request('SYS', 'osalNvRead', nvParams.znpHasConfigured).delay(10).then(function (rsp) {
                if (!_.isEqual(bufToArray(rsp.value), nvParams.znpHasConfigured.value)) return Q.reject('reset');
            }); },
            function () { return self.request('SYS', 'osalNvRead', nvParams.panId).delay(10).then(function (rsp) {
                if (!_.isEqual(bufToArray(rsp.value), nvParams.panId.value)) return Q.reject('reset');
            }); },
            function () { return self.request('SYS', 'osalNvRead', nvParams.extPanId).delay(10).then(function (rsp) {
                if (!_.isEqual(bufToArray(rsp.value), nvParams.extPanId.value)) return Q.reject('reset');
            }); },
        ])
    }

    steps = steps.concat([
        function () { return self.request('SYS', 'osalNvRead', nvParams.channelList).delay(10).then(function (rsp) {
            if (!_.isEqual(bufToArray(rsp.value), nvParams.channelList.value)) return Q.reject('reset');
        }) },
        function () { return self.request('SYS', 'osalNvRead', nvParams.precfgkeysEnable).delay(10).then(function (rsp) {
            if (!_.isEqual(bufToArray(rsp.value), nvParams.precfgkeysEnable.value)) return Q.reject('reset');
        }); }
    ]);

    if (self._isZstack3x0) {
        steps.push(
            function () { return self.request('SYS', 'osalNvRead', nvParams.precfgkey3).delay(10).then(function (rsp) {
                if (!_.isEqual(bufToArray(rsp.value), nvParams.precfgkey3.value)) return Q.reject('reset');
            }); },
        );
    } else {
        steps.push(
            function () { return self.request('SAPI', 'readConfiguration', nvParams.precfgkey).delay(10).then(function (rsp) {
                if (!_.isEqual(bufToArray(rsp.value), nvParams.precfgkey.value)) return Q.reject('reset');
            }); },
        )
    }

    return steps.reduce(function (soFar, fn) {
        return soFar.then(fn);
    }, Q(0)).fail(function (err) {
        if (err === 'restore') {
            return self.restoreCoordinator(self._shepherd._coordBackupPath);
        } else if (err === 'reset' || err.message === 'rsp error: 2') {
            self._nvChanged = true;
            debug.init('Non-Volatile memory is changed.');
            return self.reset('hard');
        } else {
            return Q.reject(err);
        }
    }).nodeify(callback);
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
        latencyreq: ZSC.AF.networkLatencyReq.NO_LATENCY_REQS,
        appnuminclusters: loEp.inClusterList.length,
        appinclusterlist: loEp.inClusterList,
        appnumoutclusters: loEp.outClusterList.length,
        appoutclusterlist: loEp.outClusterList
    };
}

module.exports = Controller;
