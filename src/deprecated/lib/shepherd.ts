/* jshint node: true */
'use strict';

import * as Zcl from '../zcl';

var fs = require('fs'),
    util = require('util'),
    EventEmitter = require('events');

var Q = require('q'),
    _ = require('busyman'),
    proving = require('proving'),
    Objectbox = require('objectbox'),
    debug = { shepherd: require('debug')('zigbee-shepherd') };

var init = require('./initializers/init_shepherd'),
    zutils = require('./components/zutils'),
    Controller = require('./components/controller'),
    eventHandlers = require('./components/event_handlers');

var Device = require('./model/device'),
    Coordinator = require('./model/coord'),
    Group = require('./model/group'),
    Coordpoint = require('./model/coordpoint');

/*************************************************************************************************/
/*** ZShepherd Class                                                                           ***/
/*************************************************************************************************/
function ZShepherd(path, opts) {

    this.acceptDevIncoming = function (devInfo, callback) {  // Override at will.
        setImmediate(function () {
            var accepted = true;
            callback(null, accepted);
        });
    };

    /***************************************************/
    /*** Event Handlers (Ind Event Bridges)          ***/
    /***************************************************/
    eventHandlers.attachEventHandlers(this);


    this.on('ind:cmd', function (ep, cId, payload, cmdId, msg) {
        const cIdString = Zcl.getClusterLegacy(cId);
        const type = `cmd${cmdId.charAt(0).toUpperCase() + cmdId.substr(1)}`;
        const notifData = {};

        notifData.cid = cIdString ? cIdString.key : cId;
        notifData.data = payload;

        self.emit('ind', { type: type, endpoints: [ ep ], data: notifData, linkquality: msg.linkquality, groupid: msg.groupid });
    });

    this.on('ind:statusChange', function (ep, cId, payload, msg) {
        var cIdString = Zcl.getClusterLegacy(cId),
            notifData = {
                cid: '',
                zoneStatus: null
            };

        cIdString = cIdString ? cIdString.key : cId;
        notifData.cid = cIdString;
        notifData.zoneStatus = payload.zonestatus;

        self.emit('ind', { type: 'statusChange', endpoints: [ ep ], data: notifData, linkquality: msg.linkquality });
    });

    this.on('ind:reported', function (ep, cId, attrs, msg) {
        var cIdString = Zcl.getClusterLegacy(cId),
            notifData = {
                cid: '',
                data: {}
            };

        self._updateFinalizer(ep, cId, attrs, true);

        cIdString = cIdString ? cIdString.key : cId;
        notifData.cid = cIdString;

        _.forEach(attrs, function (rec) {  // { attrId, dataType, attrData }
            var attrIdString = Zcl.getAttributeLegacy(cIdString, rec.attrId);
            attrIdString = attrIdString ? attrIdString.key : rec.attrId;

            notifData.data[attrIdString] = rec.attrData;

            if (attrIdString === 'modelId' && !ep.device.modelId) {
                /**
                 * Xiaomi devices report it's modelId through a genBasic message.
                 * Set this as the modelId when the device doesn't have one yet.
                 */
                ep.device.update({modelId: rec.attrData});
                Q.ninvoke(self._devbox, 'sync', ep.device._getId());
            }
        });

        self.emit('ind', { type: 'attReport', endpoints: [ ep ], data: notifData, linkquality: msg.linkquality, groupid: msg.groupid });
    });

    this.on('ind:readRsp', function (ep, cId, attrs, msg) {
        var cIdString = Zcl.getClusterLegacy(cId),
            notifData = {
                cid: '',
                data: {}
            };

        self._updateFinalizer(ep, cId, attrs, true);

        cIdString = cIdString ? cIdString.key : cId;
        notifData.cid = cIdString;

        _.forEach(attrs, function (rec) {  // { attrId, dataType, attrData }
            var attrIdString = Zcl.getAttributeLegacy(cIdString, rec.attrId);
            attrIdString = attrIdString ? attrIdString.key : rec.attrId;

            notifData.data[attrIdString] = rec.attrData;

            if (attrIdString === 'modelId' && !ep.device.modelId) {
                /**
                 * Konke devices report it's modelId through a readRsp message.
                 * Set this as the modelId when the device doesn't have one yet.
                 */
                ep.device.update({modelId: rec.attrData});
                Q.ninvoke(self._devbox, 'sync', ep.device._getId());
            }
        });

        self.emit('ind', { type: 'readRsp', endpoints: [ ep ], data: notifData, linkquality: msg.linkquality });
    });

}

util.inherits(ZShepherd, EventEmitter);

/*************************************************************************************************/
/*** Public Methods                                                                            ***/
/*************************************************************************************************/

ZShepherd.prototype.getGroup = function (groupID) {
    proving.number(groupID, 'groupID should be a number.');
    const group = new Group(groupID);
    this._attachZclMethods(group);
    return group;
};


ZShepherd.prototype.lqi = function (ieeeAddr, callback) {
    proving.string(ieeeAddr, 'ieeeAddr should be a string.');

    var self = this,
        dev = this._findDevByAddr(ieeeAddr);

    return Q.fcall(function () {
        if (dev)
            return self.controller.request('ZDO', 'mgmtLqiReq', { dstaddr: dev.getNwkAddr(), startindex: 0 });
        else
            return Q.reject(new Error('device is not found.'));
    }).then(function (rsp) {   // { srcaddr, status, neighbortableentries, startindex, neighborlqilistcount, neighborlqilist }
        if (rsp.status === 0)  // success
            return _.map(rsp.neighborlqilist, function (neighbor) {
                return { ieeeAddr: neighbor.extAddr, nwkAddr: neighbor.nwkAddr, lqi: neighbor.lqi, depth: neighbor.depth };
            });
    }).nodeify(callback);
};

ZShepherd.prototype.remove = function (ieeeAddr, cfg, callback) {
    proving.string(ieeeAddr, 'ieeeAddr should be a string.');

    var dev = this._findDevByAddr(ieeeAddr);

    if (_.isFunction(cfg) && !_.isFunction(callback)) {
        callback = cfg;
        cfg = {};
    } else {
        cfg = cfg || {};
    }

    if (!dev)
        return Q.reject(new Error('device is not found.')).nodeify(callback);
    else
        return this.controller.remove(dev, cfg, callback);
};

ZShepherd.prototype.lqiScan = function (ieeeAddr) {
    var info = this.info();
    var self = this;
    const visited = new Set();
    const linkMap = {};

    const processResponse = function(parent){
        return function(data){
            var chain = Q();
            data.forEach(function (devinfo) {
                const childIeeeAddr = devinfo.ieeeAddr;
                if (childIeeeAddr == "0x0000000000000000") return;
                let childDev = self._findDevByAddr(childIeeeAddr);
                devinfo.parent = parent;
                devinfo.status = childDev ? childDev.status : "offline";
                const linkKey = parent + '|' + childIeeeAddr
                if (!linkMap[linkKey]) {
                    linkMap[linkKey] = devinfo;
                } else {
                    debug.shepherd('Ignoring duplicate key %s.', linkKey);
                }
                if (childDev && childDev.type == "Router" && !visited.has(childIeeeAddr)) {
                    visited.add(childIeeeAddr);
                    chain = chain.then(function () {
                        return self.lqi(childIeeeAddr).then(processResponse(childIeeeAddr));
                    });
                } else {
                    debug.shepherd('LQI scan skipping %s from parent %s', childIeeeAddr, parent);
                }
            });
            return chain;
        }
    }

    if(!ieeeAddr){
        ieeeAddr = info.net.ieeeAddr;
    }

    return self.lqi(ieeeAddr)
        .timeout(5000)
        .then(processResponse(ieeeAddr))
        .then(function(){
            return Object.values(linkMap);
        })
        .catch(function(){
            return Object.values(linkMap);
        });
};

/*************************************************************************************************/
/*** Protected Methods                                                                         ***/
/*************************************************************************************************/



module.exports = ZShepherd;
