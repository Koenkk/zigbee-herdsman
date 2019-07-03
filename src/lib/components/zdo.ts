import {Znp} from '../../znp';

var Q = require('q'),
    Areq = require('../../areq'),
    znp = Znp,
    ZSC = require('../../zstack-constants');

var zdoHelper = require('./zdo_helper');

function Zdo(controller) {
    this._areq = new Areq(controller, 10000);
}

/*************************************************************************************************/
/*** Public APIs                                                                               ***/
/*************************************************************************************************/
Zdo.prototype.request = function (apiName, valObj, callback) {
    var requestType = zdoHelper.getRequestType(apiName);

    if (requestType === 'rspless')
        return this._rsplessRequest(apiName, valObj, callback);
    else if (requestType === 'generic')
        return this._genericRequest(apiName, valObj, callback);
    else if (requestType === 'concat')
        return this._concatRequest(apiName, valObj, callback);
    else if (requestType === 'special')
        return this._specialRequest(apiName, valObj, callback);
    else
        callback(new Error('Unknown request type.'));
};

/*************************************************************************************************/
/*** Protected Methods                                                                         ***/
/*************************************************************************************************/
Zdo.prototype._sendZdoRequestViaZnp = function (apiName, valObj, callback) {
    var zdoRequest = znp.zdoRequest.bind(znp); // bind zdo._sendZdoRequestViaZnp() to znp.zdoRequest()

    return zdoRequest(apiName, valObj, function (err, rsp) {
        var error = null;

        if (err)
            error = err;
        else if (apiName !== 'startupFromApp' && rsp.status !== 0)
            error = new Error('request unsuccess: ' + rsp.status);

        callback(error, rsp);
    });
};

Zdo.prototype._rsplessRequest = function (apiName, valObj, callback) {
    return this._sendZdoRequestViaZnp(apiName, valObj, callback);
};

Zdo.prototype._genericRequest = function (apiName, valObj, callback) {
    var deferred = Q.defer(),
        areq = this._areq,
        areqEvtKey = zdoHelper.generateEventOfRequest(apiName, valObj);

    if (areqEvtKey)
        areq.register(areqEvtKey, deferred, function (payload) {
            areq.resolve(areqEvtKey, payload);
        });

    this._sendZdoRequestViaZnp(apiName, valObj, function (err, rsp) {
        if (err)
            areq.reject(areqEvtKey, err);
    });

    return deferred.promise.nodeify(callback);
};

Zdo.prototype._specialRequest = function (apiName, valObj, callback) {
    if (apiName === 'serverDiscReq') {
        // broadcast, remote device may not response when no bits match in mask
        // listener at controller.on('ZDO:serverDiscRsp')
        return this._rsplessRequest('serverDiscReq', valObj, callback);
    } else if (apiName === 'bindReq') {
        if (valObj.dstaddrmode === ZSC.AF.addressMode.ADDR_16BIT)
            callback(new Error('TI not support address 16bit mode.'));
        else
            return this._genericRequest('bindReq', valObj, callback);
    } else if (apiName === 'mgmtPermitJoinReq') {
        if (valObj.dstaddr === 0xFFFC)  // broadcast to all routers (and coord), no waiting for AREQ rsp
            return this._rsplessRequest('mgmtPermitJoinReq', valObj, callback);
        else
            return this._genericRequest('mgmtPermitJoinReq', valObj, callback);
    } else {
        callback(new Error('No such request.'));
    }
};

Zdo.prototype._concatRequest = function (apiName, valObj, callback) {
    if (apiName === 'nwkAddrReq' || apiName === 'ieeeAddrReq')
        return this._concatAddrRequest(apiName, valObj, callback);
    else if (apiName === 'mgmtNwkDiscReq')
        return this._concatListRequest(apiName, valObj, {
            entries: 'networkcount',
            listcount: 'networklistcount',
            list: 'networklist'
        }, callback);
    else if (apiName === 'mgmtLqiReq')
        return this._concatListRequest(apiName, valObj, {
            entries: 'neighbortableentries',
            listcount: 'neighborlqilistcount',
            list: 'neighborlqilist'
        }, callback);
    else if (apiName === 'mgmtRtgReq')
        return this._concatListRequest(apiName, valObj, {
            entries: 'routingtableentries',
            listcount: 'routingtablelistcount',
            list: 'routingtablelist'
        }, callback);
    else if (apiName === 'mgmtBindRsp')
        return this._concatListRequest(apiName, valObj, {
            entries: 'bindingtableentries',
            listcount: 'bindingtablelistcount',
            list: 'bindingtablelist'
        }, callback);
    else
        callback(new Error('No such request.'));
};

Zdo.prototype._concatAddrRequest = function (apiName, valObj, callback) {
    var self = this,
        totalToGet = null,
        accum = 0,
        nextIndex = valObj.startindex,
        reqObj = {
            reqtype: valObj.reqtype,
            startindex: valObj.startindex    // start from 0
        },
        finalRsp = {
            status: null,
            ieeeaddr: null,
            nwkaddr: null,
            startindex: valObj.startindex,
            numassocdev: null,
            assocdevlist: []
        };

    if (apiName === 'nwkAddrReq')
        reqObj.ieeeaddr = valObj.ieeeaddr;
    else
        reqObj.shortaddr = valObj.shortaddr;

    var recursiveRequest = function () {
        self._genericRequest(apiName, reqObj, function (err, rsp) {
            if (err) {
                callback(err, finalRsp);
            } else if (rsp.status !== 0) {
                callback(new Error('request unsuccess: ' + rsp.status), finalRsp);
            } else {
                finalRsp.status = rsp.status;
                finalRsp.ieeeaddr = finalRsp.ieeeaddr || rsp.ieeeaddr;
                finalRsp.nwkaddr = finalRsp.nwkaddr || rsp.nwkaddr;
                finalRsp.numassocdev = finalRsp.numassocdev || rsp.numassocdev;
                finalRsp.assocdevlist = finalRsp.assocdevlist.concat(rsp.assocdevlist);

                totalToGet = totalToGet || (finalRsp.numassocdev - finalRsp.startindex);    // compute at 1st rsp back
                accum = accum + rsp.assocdevlist.length;

                if (valObj.reqtype === 1 && accum < totalToGet) {  // extended, include associated devices
                    nextIndex = nextIndex + rsp.assocdevlist.length;
                    reqObj.startindex = nextIndex;
                    recursiveRequest();
                } else {
                    callback(null, finalRsp);
                }
            }
        });
    };

    recursiveRequest();
};

Zdo.prototype._concatListRequest = function (apiName, valObj, listKeys, callback) {
    // valObj = { dstaddr[, scanchannels, scanduration], startindex }
    // listKeys = { entries: 'networkcount', listcount: 'networklistcount', list: 'networklist' };
    var self = this,
        totalToGet = null,
        accum = 0,
        nextIndex = valObj.startindex,
        reqObj = {
            dstaddr: valObj.dstaddr,
            scanchannels: valObj.scanchannels,
            scanduration: valObj.scanduration,
            startindex: valObj.startindex    // starts from 0
        },
        finalRsp = {
            srcaddr: null,
            status: null,
            startindex: valObj.startindex
        };

    finalRsp[listKeys.entries] = null;       // finalRsp.networkcount = null
    finalRsp[listKeys.listcount] = null;     // finalRsp.networklistcount = null
    finalRsp[listKeys.list] = [];            // finalRsp.networklist = []

    if (apiName === 'mgmtNwkDiscReq') {
        reqObj.scanchannels = valObj.scanchannels;
        reqObj.scanduration = valObj.scanduration;
    }

    var recursiveRequest = function () {
        self._genericRequest(apiName, reqObj, function (err, rsp) {
            if (err) {
                callback(err, finalRsp);
            } else if (rsp.status !== 0) {
                callback(new Error('request unsuccess: ' + rsp.status), finalRsp);
            } else {
                finalRsp.status = rsp.status;
                finalRsp.srcaddr = finalRsp.srcaddr || rsp.srcaddr;
                finalRsp[listKeys.entries] = finalRsp[listKeys.entries] || rsp[listKeys.entries];
                finalRsp[listKeys.listcount] = rsp[listKeys.listcount];
                finalRsp[listKeys.list] = finalRsp[listKeys.list].concat(rsp[listKeys.list]);

                totalToGet = totalToGet || (finalRsp[listKeys.entries] - finalRsp.startindex);
                accum = accum + rsp[listKeys.list].length;

                if (accum < totalToGet) {
                    nextIndex = nextIndex + rsp[listKeys.list].length;
                    reqObj.startindex = nextIndex;
                    recursiveRequest();
                } else {
                    callback(null, finalRsp);
                }
            }
        });
    };

    recursiveRequest();
};

module.exports = Zdo;
