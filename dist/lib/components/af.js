/* jshint node: true */
'use strict';
var EventEmitter = require('events');
var Q = require('q'), _ = require('busyman'), Areq = require('../../areq'), zclId = require('../../zcl-id'), proving = require('proving'), ZSC = require('../../zstack-constants');
var zcl = require('./zcl'), zutils = require('./zutils'), Endpoint = require('../model/endpoint'), Coordpoint = require('../model/coordpoint'), Group = require('../model/group'), seqNumber = 0, rebornDevs = {}; // { nwkAddr: [ { type, msg } ], ... };
var af = {
    controller: null,
    areq: null,
    _seq: 0
};
var debug = require('debug')('zigbee-shepherd:af');
af.send = function (srcEp, dstEp, cId, rawPayload, opt, callback) {
    // srcEp maybe a local app ep, or a remote ep
    var deferred = Q.defer(), controller = af.controller, areq = af.areq, areqTimeout, profId = srcEp.getProfId(), afParams, afEventCnf, apsAck = false, senderEp;
    if (!((srcEp instanceof Endpoint) || (srcEp instanceof Coordpoint)))
        throw new TypeError('srcEp should be an instance of Endpoint class.');
    if (_.isString(cId)) {
        var cIdItem = zclId.cluster(cId);
        if (_.isUndefined(cIdItem)) {
            deferred.reject(new Error('Invalid cluster id: ' + cId + '.'));
            return deferred.promise.nodeify(callback);
        }
        else {
            cId = cIdItem.value;
        }
    }
    if (!_.isBuffer(rawPayload))
        throw new TypeError('Af rawPayload should be a buffer.');
    if (typeof opt === 'function') {
        callback = opt;
        opt = undefined;
    }
    opt = opt || {};
    if (opt.hasOwnProperty('timeout'))
        proving.number(opt.timeout, 'opt.timeout should be a number.');
    areqTimeout = opt.hasOwnProperty('timeout') ? opt.timeout : undefined;
    senderEp = srcEp.isLocal() ? srcEp : controller._coord.getDelegator(profId);
    if (!senderEp)
        senderEp = srcEp.isLocal() ? srcEp : controller._coord.getDelegator(0x0104);
    // if (!senderEp) {
    //     // only occurs if srcEp is a remote one
    //     deferred.reject(new Error('Profile: ' + profId + ' is not supported at this moment.'));
    //     return deferred.promise.nodeify(callback);
    // }
    afParams = makeAfParams(senderEp, dstEp, cId, rawPayload, opt);
    afEventCnf = 'AF:dataConfirm:' + senderEp.getEpId() + ':' + afParams.transid;
    apsAck = afParams.options & ZSC.AF.options.ACK_REQUEST;
    while (areq.isEventPending(afEventCnf)) {
        afParams.transid = controller.nextTransId();
        afEventCnf = 'AF:dataConfirm:' + senderEp.getEpId() + ':' + afParams.transid;
    }
    areq.register(afEventCnf, deferred, function (cnf) {
        var errText = 'AF data request fails, status code: ';
        if (cnf.status === 0 || cnf.status === 'SUCCESS') // success
            areq.resolve(afEventCnf, cnf);
        else if (cnf.status === 0xcd || cnf.status === 'NWK_NO_ROUTE')
            areq.reject(afEventCnf, new Error(errText + '205. No network route. Please confirm that the device has (re)joined the network.'));
        else if (cnf.status === 0xe9 || cnf.status === 'MAC_NO_ACK')
            areq.reject(afEventCnf, new Error(errText + '233. MAC no ack.'));
        else if (cnf.status === 0xb7 || cnf.status === 'APS_NO_ACK') // ZApsNoAck period is 20 secs
            areq.reject(afEventCnf, new Error(errText + '183. APS no ack.'));
        else if (cnf.status === 0xf0 || cnf.status === 'MAC_TRANSACTION_EXPIRED') // ZMacTransactionExpired is 8 secs
            areq.reject(afEventCnf, new Error(errText + '240. MAC transaction expired.'));
        else
            areq.reject(afEventCnf, new Error(errText + cnf.status));
    }, areqTimeout);
    controller.request('AF', 'dataRequest', afParams).then(function (rsp) {
        if (rsp.status !== 0 && rsp.status !== 'SUCCESS') // unsuccessful
            areq.reject(afEventCnf, new Error('AF data request failed, status code: ' + rsp.status + '.'));
        else if (!apsAck)
            areq.resolve(afEventCnf, rsp);
    }).fail(function (err) {
        areq.reject(afEventCnf, err);
    }).done();
    return deferred.promise.nodeify(callback);
};
af.sendExt = function (srcEp, addrMode, dstAddrOrGrpId, cId, rawPayload, opt, callback) {
    // srcEp must be a local ep
    var deferred = Q.defer(), controller = af.controller, areq = af.areq, areqTimeout, afParamsExt, afEventCnf, apsAck = false, senderEp = srcEp;
    if (!((srcEp instanceof Endpoint) || (srcEp instanceof Coordpoint) || (srcEp instanceof Group)))
        throw new TypeError('srcEp should be an instance of Endpoint or Group class.');
    proving.number(addrMode, 'Af addrMode should be a number.');
    if (addrMode === ZSC.AF.addressMode.ADDR_16BIT || addrMode === ZSC.AF.addressMode.ADDR_GROUP)
        proving.number(dstAddrOrGrpId, 'Af dstAddrOrGrpId should be a number for network address or group id.');
    else if (addrMode === ZSC.AF.addressMode.ADDR_64BIT)
        proving.string(dstAddrOrGrpId, 'Af dstAddrOrGrpId should be a string for long address.');
    if (_.isString(cId)) {
        var cIdItem = zclId.cluster(cId);
        if (_.isUndefined(cIdItem)) {
            deferred.reject(new Error('Invalid cluster id: ' + cId + '.'));
            return deferred.promise.nodeify(callback);
        }
        else {
            cId = cIdItem.value;
        }
    }
    if (!_.isBuffer(rawPayload))
        throw new TypeError('Af rawPayload should be a buffer.');
    if (typeof opt === 'function') {
        callback = opt;
        opt = undefined;
    }
    opt = opt || {};
    if (opt.hasOwnProperty('timeout'))
        proving.number(opt.timeout, 'opt.timeout should be a number.');
    areqTimeout = opt.hasOwnProperty('timeout') ? opt.timeout : undefined;
    if (!senderEp.isLocal()) {
        deferred.reject(new Error('Only a local endpoint can groupcast, broadcast, and send extend message.'));
        return deferred.promise.nodeify(callback);
    }
    afParamsExt = makeAfParamsExt(senderEp, addrMode, dstAddrOrGrpId, cId, rawPayload, opt);
    if (!afParamsExt) {
        deferred.reject(new Error('Unknown address mode. Cannot send.'));
        return deferred.promise.nodeify(callback);
    }
    if (addrMode === ZSC.AF.addressMode.ADDR_GROUP || addrMode === ZSC.AF.addressMode.ADDR_BROADCAST) {
        // no ack
        controller.request('AF', 'dataRequestExt', afParamsExt).then(function (rsp) {
            if (rsp.status !== 0 && rsp.status !== 'SUCCESS') // unsuccessful
                deferred.reject(new Error('AF data extend request failed, status code: ' + rsp.status + '.'));
            else
                deferred.resolve(rsp); // Broadcast (or Groupcast) has no AREQ confirm back, just resolve this transaction.
        }).fail(function (err) {
            deferred.reject(err);
        }).done();
    }
    else {
        afEventCnf = 'AF:dataConfirm:' + senderEp.getEpId() + ':' + afParamsExt.transid;
        apsAck = afParamsExt.options & ZSC.AF.options.ACK_REQUEST;
        while (areq.isEventPending(afEventCnf)) {
            afParamsExt.transid = controller.nextTransId();
            afEventCnf = 'AF:dataConfirm:' + senderEp.getEpId() + ':' + afParamsExt.transid;
        }
        areq.register(afEventCnf, deferred, function (cnf) {
            var errText = 'AF data request fails, status code: ';
            if (cnf.status === 0 || cnf.status === 'SUCCESS') // success
                areq.resolve(afEventCnf, cnf);
            else if (cnf.status === 0xcd || cnf.status === 'NWK_NO_ROUTE')
                areq.reject(afEventCnf, new Error(errText + '205. No network route. Please confirm that the device has (re)joined the network.'));
            else if (cnf.status === 0xe9 || cnf.status === 'MAC_NO_ACK')
                areq.reject(afEventCnf, new Error(errText + '233. MAC no ack.'));
            else if (cnf.status === 0xb7 || cnf.status === 'APS_NO_ACK') // ZApsNoAck period is 20 secs
                areq.reject(afEventCnf, new Error(errText + '183. APS no ack.'));
            else if (cnf.status === 0xf0 || cnf.status === 'MAC_TRANSACTION_EXPIRED') // ZMacTransactionExpired is 8 secs
                areq.reject(afEventCnf, new Error(errText + '240. MAC transaction expired.'));
            else
                areq.reject(afEventCnf, new Error(errText + cnf.status));
        }, areqTimeout);
        controller.request('AF', 'dataRequestExt', afParamsExt).then(function (rsp) {
            if (rsp.status !== 0 && rsp.status !== 'SUCCESS') // unsuccessful
                areq.reject(afEventCnf, new Error('AF data request failed, status code: ' + rsp.status + '.'));
            else if (!apsAck)
                areq.resolve(afEventCnf, rsp);
        }).fail(function (err) {
            areq.reject(afEventCnf, err);
        }).done();
    }
    return deferred.promise.nodeify(callback);
};
af.zclFoundation = function (srcEp, dstEp, cId, cmd, zclData, cfg, callback) {
    // callback(err[, rsp])
    var deferred = Q.defer(), areq = af.areq, dir = (srcEp === dstEp) ? 0 : 1, // 0: client-to-server, 1: server-to-client
    manufCode = 0, frameCntl, seqNum, zclBuffer, mandatoryEvent;
    if (_.isFunction(cfg)) {
        if (!_.isFunction(callback)) {
            callback = cfg;
            cfg = {};
        }
    }
    else {
        cfg = cfg || {};
    }
    proving.stringOrNumber(cmd, 'cmd should be a number or a string.');
    proving.object(cfg, 'cfg should be a plain object if given.');
    frameCntl = {
        frameType: 0,
        manufSpec: cfg.hasOwnProperty('manufSpec') ? cfg.manufSpec : 0,
        direction: cfg.hasOwnProperty('direction') ? cfg.direction : dir,
        disDefaultRsp: cfg.hasOwnProperty('disDefaultRsp') ? cfg.disDefaultRsp : 0 // enable deafult response command
    };
    if (frameCntl.manufSpec === 1)
        manufCode = cfg.hasOwnProperty('manufCode') ? cfg.manufCode : dstEp.getManufId();
    // .frame(frameCntl, manufCode, seqNum, cmd, zclPayload[, clusterId])
    seqNum = cfg.hasOwnProperty('seqNum') ? cfg.seqNum : nextZclSeqNum();
    try {
        zclBuffer = zcl.frame(frameCntl, manufCode, seqNum, cmd, zclData);
    }
    catch (e) {
        if (e.message === 'Unrecognized command') {
            deferred.reject(e);
            return deferred.promise.nodeify(callback);
        }
        else {
            throw e;
        }
    }
    if (frameCntl.direction === 0) { // client-to-server, thus require getting the feedback response
        if (srcEp === dstEp) // from remote to remote itself
            mandatoryEvent = 'ZCL:incomingMsg:' + dstEp.getNwkAddr() + ':' + dstEp.getEpId() + ':' + seqNum;
        else // from local ep to remote ep
            mandatoryEvent = 'ZCL:incomingMsg:' + dstEp.getNwkAddr() + ':' + dstEp.getEpId() + ':' + srcEp.getEpId() + ':' + seqNum;
        areq.register(mandatoryEvent, deferred, function (msg) {
            // { groupid, clusterid, srcaddr, srcendpoint, dstendpoint, wasbroadcast, linkquality, securityuse, timestamp, transseqnumber, zclMsg }
            areq.resolve(mandatoryEvent, msg.zclMsg);
        });
    }
    af.send(srcEp, dstEp, cId, zclBuffer).fail(function (err) {
        if (mandatoryEvent && areq.isEventPending(mandatoryEvent))
            areq.reject(mandatoryEvent, err);
        else
            deferred.reject(err);
    }).then(function (rsp) {
        if (!mandatoryEvent)
            deferred.resolve(rsp);
    }).done();
    return deferred.promise.nodeify(callback);
};
af.zclFunctional = function (srcEp, dstEp, cId, cmd, zclData, cfg, callback) {
    // callback(err[, rsp])
    var deferred = Q.defer(), areq = af.areq, dir = (srcEp === dstEp) ? 0 : 1, // 0: client-to-server, 1: server-to-client
    manufCode = 0, seqNum, frameCntl, zclBuffer, mandatoryEvent;
    if (_.isFunction(cfg)) {
        if (!_.isFunction(callback)) {
            callback = cfg;
            cfg = {};
        }
    }
    else {
        cfg = cfg || {};
    }
    if (!((srcEp instanceof Endpoint) || (srcEp instanceof Coordpoint) || (srcEp instanceof Group)))
        throw new TypeError('srcEp should be an instance of Endpoint or Group class.');
    if (!((dstEp instanceof Endpoint) || (dstEp instanceof Coordpoint) || (srcEp instanceof Group)))
        throw new TypeError('dstEp should be an instance of Endpoint or Group class.');
    if (typeof zclData !== 'object' || zclData === null)
        throw new TypeError('zclData should be an object or an array');
    proving.stringOrNumber(cId, 'cId should be a number or a string.');
    proving.stringOrNumber(cmd, 'cmd should be a number or a string.');
    proving.object(cfg, 'cfg should be a plain object if given.');
    frameCntl = {
        frameType: 1,
        manufSpec: cfg.hasOwnProperty('manufSpec') ? cfg.manufSpec : 0,
        direction: cfg.hasOwnProperty('direction') ? cfg.direction : dir,
        disDefaultRsp: cfg.hasOwnProperty('disDefaultRsp') ? cfg.disDefaultRsp : 0 // enable deafult response command
    };
    if (frameCntl.manufSpec === 1)
        manufCode = cfg.hasOwnProperty('manufCode') ? cfg.manufCode : dstEp.getManufId();
    // .frame(frameCntl, manufCode, seqNum, cmd, zclPayload[, clusterId])
    seqNum = cfg.hasOwnProperty('seqNum') ? cfg.seqNum : nextZclSeqNum();
    try {
        zclBuffer = zcl.frame(frameCntl, manufCode, seqNum, cmd, zclData, cId);
    }
    catch (e) {
        if (e.message === 'Unrecognized command' || e.message === 'Unrecognized cluster') {
            deferred.reject(e);
            return deferred.promise.nodeify(callback);
        }
        else {
            deferred.reject(e);
            return deferred.promise.nodeify(callback);
        }
    }
    // client-to-server, thus require getting the feedback response
    // NOTE: groups don't respond
    if (frameCntl.direction === 0 && !(srcEp instanceof Group)) {
        if (srcEp === dstEp) // from remote to remote itself
            mandatoryEvent = 'ZCL:incomingMsg:' + dstEp.getNwkAddr() + ':' + dstEp.getEpId() + ':' + seqNum;
        else // from local ep to remote ep
            mandatoryEvent = 'ZCL:incomingMsg:' + dstEp.getNwkAddr() + ':' + dstEp.getEpId() + ':' + srcEp.getEpId() + ':' + seqNum;
        areq.register(mandatoryEvent, deferred, function (msg) {
            // { groupid, clusterid, srcaddr, srcendpoint, dstendpoint, wasbroadcast, linkquality, securityuse, timestamp, transseqnumber, zclMsg }
            areq.resolve(mandatoryEvent, msg.zclMsg);
        });
    }
    // af.send(srcEp, dstEp, cId, rawPayload, opt, callback)
    if (srcEp instanceof Group) {
        af.sendExt(srcEp, ZSC.AF.addressMode.ADDR_GROUP, srcEp.groupID, cId, zclBuffer).fail(function (err) {
            if (mandatoryEvent && areq.isEventPending(mandatoryEvent))
                areq.reject(mandatoryEvent, err);
            else
                deferred.reject(err);
        }).then(function (rsp) {
            if (!mandatoryEvent)
                deferred.resolve(rsp);
        }).done();
    }
    else {
        af.send(srcEp, dstEp, cId, zclBuffer).fail(function (err) {
            if (mandatoryEvent && areq.isEventPending(mandatoryEvent))
                areq.reject(mandatoryEvent, err);
            else
                deferred.reject(err);
        }).then(function (rsp) {
            if (!mandatoryEvent)
                deferred.resolve(rsp);
        }).done();
    }
    return deferred.promise.nodeify(callback);
};
/*************************************************************************************************/
/*** ZCL Cluster and Attribute Requests                                                        ***/
/*************************************************************************************************/
af.zclClustersReq = function (dstEp, eventEmitter, callback) {
    // clusters: {
    //    genBasic: { dir: 1, attrs: { x1: 0, x2: 3, ... } },   // dir => 0: 'unknown', 1: 'in', 2: 'out'
    //    fooClstr: { dir: 1, attrs: { x1: 0, x2: 3, ... } },
    //    ...
    // }
    var epId;
    try {
        epId = dstEp.getEpId();
    }
    catch (err) {
        epId = null;
    }
    // If event emitter is function, consider it callback (legacy)
    if (typeof eventEmitter === 'function')
        callback = eventEmitter;
    var deferred = Q.defer(), clusters = {}, clusterList = dstEp.getClusterList(), // [ 1, 2, 3, 4, 5 ]
    inClusterList = dstEp.getInClusterList(), // [ 1, 2, 3 ]
    outClusterList = dstEp.getOutClusterList(), // [ 1, 3, 4, 5 ]
    clusterAttrsReqs = []; // functions
    // clusterAttrsRsps = [];  // { attr1: x }, ...
    var i = 0;
    // each request
    _.forEach(clusterList, function (cId) {
        var cIdString = zclId.cluster(cId);
        cIdString = cIdString ? cIdString.key : cId;
        clusterAttrsReqs.push(function (clusters) {
            return af.zclClusterAttrsReq(dstEp, cId).then(function (attrs) {
                i++;
                if (eventEmitter instanceof EventEmitter) {
                    eventEmitter.emit('ind:interview', {
                        endpoint: {
                            current: epId,
                            cluster: {
                                total: clusterList.length,
                                current: i,
                            }
                        }
                    });
                }
                clusters[cIdString] = clusters[cIdString] || { dir: 0, attrs: null };
                clusters[cIdString].dir = _.includes(inClusterList, cId) ? (clusters[cIdString].dir | 0x01) : clusters[cIdString].dir;
                clusters[cIdString].dir = _.includes(outClusterList, cId) ? (clusters[cIdString].dir | 0x02) : clusters[cIdString].dir;
                clusters[cIdString].attrs = attrs;
                return clusters;
            }).fail(function (err) {
                i++;
                if (eventEmitter instanceof EventEmitter) {
                    eventEmitter.emit('ind:interview', {
                        endpoint: {
                            current: epId,
                            cluster: {
                                total: clusterList.length,
                                current: i,
                            }
                        }
                    });
                }
                clusters[cIdString] = clusters[cIdString] || { dir: 0, attrs: null };
                clusters[cIdString].dir = _.includes(inClusterList, cId) ? (clusters[cIdString].dir | 0x01) : clusters[cIdString].dir;
                clusters[cIdString].dir = _.includes(outClusterList, cId) ? (clusters[cIdString].dir | 0x02) : clusters[cIdString].dir;
                clusters[cIdString].attrs = {};
                return clusters;
            });
        });
    });
    // all clusters
    var allReqs = clusterAttrsReqs.reduce(function (soFar, f) {
        return soFar.then(f);
    }, Q(clusters));
    allReqs.then(function (clusters) {
        deferred.resolve(clusters);
    }).fail(function (err) {
        deferred.reject(err);
    }).done();
    return deferred.promise.nodeify(callback);
};
af.zclClusterAttrsReq = function (dstEp, cId, callback) {
    var deferred = Q.defer();
    af.zclClusterAttrIdsReq(dstEp, cId).then(function (attrIds) {
        var readReq = [], attrsReqs = [], attributes = [], attrIdsLen = attrIds.length;
        _.forEach(attrIds, function (id) {
            readReq.push({ attrId: id });
            if (readReq.length === 5 || readReq.length === attrIdsLen) {
                var req = _.cloneDeep(readReq);
                attrsReqs.push(function (attributes) {
                    return af.zclFoundation(dstEp, dstEp, cId, 'read', req).then(function (readStatusRecsRsp) {
                        attributes = _.concat(attributes, readStatusRecsRsp.payload);
                        return attributes;
                    });
                });
                attrIdsLen -= 5;
                readReq = [];
            }
        });
        return attrsReqs.reduce(function (soFar, f) {
            return soFar.then(f);
        }, Q(attributes));
    }).then(function (attributes) {
        var attrs = {};
        _.forEach(attributes, function (rec) {
            var attrIdString = zclId.attr(cId, rec.attrId);
            attrIdString = attrIdString ? attrIdString.key : rec.attrId;
            attrs[attrIdString] = null;
            if (rec.status === 0)
                attrs[attrIdString] = rec.attrData;
        });
        return attrs;
    }).then(function (attrs) {
        deferred.resolve(attrs);
    }).fail(function (err) {
        deferred.reject(err);
    }).done();
    return deferred.promise.nodeify(callback);
};
af.zclClusterAttrIdsReq = function (dstEp, cId, callback) {
    var deferred = Q.defer(), attrsToRead = [];
    if (!((dstEp instanceof Endpoint) || (dstEp instanceof Coordpoint)))
        throw new TypeError('dstEp should be an instance of Endpoint class.');
    var discAttrs = function (startAttrId, defer) {
        af.zclFoundation(dstEp, dstEp, cId, 'discover', {
            startAttrId: startAttrId,
            maxAttrIds: 240
        }).then(function (discoverRsp) {
            // discoverRsp.payload: { discComplete, attrInfos: [ { attrId, dataType }, ... ] }
            var payload = discoverRsp.payload, discComplete = payload.discComplete, attrInfos = payload.attrInfos, nextReqIndex;
            _.forEach(attrInfos, function (info) {
                if (_.indexOf(attrsToRead, info.attrId) === -1)
                    attrsToRead.push(info.attrId);
            });
            if (discComplete === 0) {
                nextReqIndex = attrInfos[attrInfos.length - 1].attrId + 1;
                discAttrs(nextReqIndex, defer);
            }
            else {
                defer.resolve(attrsToRead);
            }
        }).fail(function (err) {
            defer.reject(err);
        }).done();
    };
    discAttrs(0, deferred);
    return deferred.promise.nodeify(callback);
};
/*************************************************************************************************/
/*** Private Functions: Message Dispatcher                                                     ***/
/*************************************************************************************************/
// 4 types of message: dataConfirm, reflectError, incomingMsg, incomingMsgExt, zclIncomingMsg
function dispatchIncomingMsg(type, msg) {
    var targetEp, // remote ep, or a local ep (maybe a delegator)
    remoteEp, dispatchTo, // which callback on targetEp
    zclHeader, frameType, // check whether the msg is foundation(0) or functional(1)
    mandatoryEvent; // bridged event
    var coord = af.controller._coord;
    debug(`dispatchIncomingMsg(): type: ${type}, msg: ${JSON.stringify(msg)}`);
    if (msg.hasOwnProperty('endpoint')) { // dataConfirm, reflectError
        if (!coord)
            return;
        targetEp = coord.getEndpoint(msg.endpoint); //  => find local ep, such a message is going to local ep
    }
    else if (msg.hasOwnProperty('srcaddr') && msg.hasOwnProperty('srcendpoint')) { // incomingMsg, incomingMsgExt, zclIncomingMsg
        if (!coord)
            return;
        targetEp = coord.getEndpoint(msg.dstendpoint); //  => find local ep
        if (targetEp) { // local
            remoteEp = af.controller.findEndpoint(msg.srcaddr, msg.srcendpoint);
            if (targetEp.isDelegator()) { // delegator, pass message to remote endpoint
                targetEp = remoteEp;
            }
            else if (!remoteEp) { // local zApp not found, get ieeeaddr and emit fake 'endDeviceAnnceInd' msg
                var msgBuffer = rebornDevs[msg.srcaddr];
                if (_.isArray(msgBuffer)) {
                    msgBuffer.push({ type: type, msg: msg });
                }
                else if (_.isUndefined(msgBuffer)) {
                    msgBuffer = rebornDevs[msg.srcaddr] = [{ type: type, msg: msg }];
                    af.controller.request('ZDO', 'ieeeAddrReq', { shortaddr: msg.srcaddr, reqtype: 0, startindex: 0 }).then(function (rsp) {
                        // rsp: { status, ieeeaddr, nwkaddr, startindex, numassocdev, assocdevlist }
                        af.controller.once('ind:incoming' + ':' + rsp.ieeeaddr, function () {
                            if (af.controller.findEndpoint(msg.srcaddr, msg.srcendpoint) && _.isArray(msgBuffer))
                                _.forEach(msgBuffer, function (item) {
                                    dispatchIncomingMsg(item.type, item.msg);
                                });
                            else
                                delete rebornDevs[msg.srcaddr];
                        });
                        af.controller.emit('ZDO:endDeviceAnnceInd', { srcaddr: rsp.nwkaddr, nwkaddr: rsp.nwkaddr, ieeeaddr: rsp.ieeeaddr, capabilities: {} });
                    }).fail(function (err) {
                        delete rebornDevs[msg.srcaddr];
                    }).done();
                }
                return;
            }
        }
    }
    if (!targetEp) // if target not found, ignore this message
        return;
    switch (type) {
        case 'dataConfirm':
            // msg: { status, endpoint, transid }
            mandatoryEvent = 'AF:dataConfirm:' + msg.endpoint + ':' + msg.transid; // sender(loEp) is listening, see af.send() and af.sendExt()
            dispatchTo = targetEp.onAfDataConfirm;
            break;
        case 'reflectError':
            // msg: { status, endpoint, transid, dstaddrmode, dstaddr }
            mandatoryEvent = 'AF:reflectError:' + msg.endpoint + ':' + msg.transid;
            dispatchTo = targetEp.onAfReflectError;
            break;
        case 'incomingMsg':
            // msg: { groupid, clusterid, srcaddr, srcendpoint, dstendpoint, wasbroadcast, linkquality, securityuse, timestamp, transseqnumber, len, data }
            zclHeader = zcl.header(msg.data); // a zcl packet maybe, pre-parse it to get the header
            dispatchTo = targetEp.onAfIncomingMsg;
            break;
        case 'incomingMsgExt':
            // msg: { groupid, clusterid, srcaddr, srcendpoint, dstendpoint, wasbroadcast, linkquality, securityuse, timestamp, transseqnumber, len, data }
            zclHeader = zcl.header(msg.data); // a zcl packet maybe, pre-parse it to get the header
            dispatchTo = targetEp.onAfIncomingMsgExt;
            break;
        case 'zclIncomingMsg':
            // { groupid, clusterid, srcaddr, srcendpoint, dstendpoint, wasbroadcast, linkquality, securityuse, timestamp, transseqnumber, zclMsg }
            if (targetEp.isLocal()) {
                // to local app ep, receive zcl command or zcl command response. see af.zclFoudation() and af.zclFunctional()
                if (!targetEp.isDelegator())
                    mandatoryEvent = 'ZCL:incomingMsg:' + msg.srcaddr + ':' + msg.srcendpoint + ':' + msg.dstendpoint + ':' + msg.zclMsg.seqNum;
            }
            else {
                var localEp = af.controller.findEndpoint(0, msg.dstendpoint), toLocalApp = false;
                if (localEp)
                    toLocalApp = localEp.isLocal() ? !localEp.isDelegator() : false;
                if (toLocalApp) {
                    mandatoryEvent = 'ZCL:incomingMsg:' + msg.srcaddr + ':' + msg.srcendpoint + ':' + msg.dstendpoint + ':' + msg.zclMsg.seqNum;
                }
                else {
                    // to remote ep, receive the zcl command response
                    mandatoryEvent = 'ZCL:incomingMsg:' + msg.srcaddr + ':' + msg.srcendpoint + ':' + msg.zclMsg.seqNum;
                }
            }
            // msg.data is now msg.zclMsg
            // TODO: FIXME: 3 instances: Very naughty, we shouldn't be emitting events on another object.
            frameType = msg.zclMsg.frameCntl.frameType;
            if (frameType === 0 && msg.zclMsg.cmdId === 'write' && msg.zclMsg.payload) {
                af.controller._shepherd.emit('ind:cmd', targetEp, msg.clusterid, msg.zclMsg.payload, msg.zclMsg.cmdId, msg);
            }
            if (frameType === 1 && msg.zclMsg.cmdId === 'statusChangeNotification' && msg.zclMsg.payload)
                af.controller._shepherd.emit('ind:statusChange', targetEp, msg.clusterid, msg.zclMsg.payload, msg);
            if (frameType === 0 && msg.zclMsg.cmdId === 'report' || msg.zclMsg.cmdId === 'readRsp') {
                const type = msg.zclMsg.cmdId === 'report' ? 'ind:reported' : 'ind:readRsp';
                af.controller._shepherd.emit(type, targetEp, msg.clusterid, msg.zclMsg.payload, msg);
            }
            const cmdIDs = [
                'on', 'offWithEffect', 'step', 'stop', 'hueNotification',
                'off', 'stepColorTemp', 'moveWithOnOff', 'move', 'moveHue', 'moveToSaturation',
                'stopWithOnOff', 'moveToLevelWithOnOff', 'toggle', 'tradfriArrowSingle', 'tradfriArrowHold', 'tradfriArrowRelease',
                'stepWithOnOff', 'moveToColorTemp', 'moveToColor', 'onWithTimedOff', 'recall', 'arm', 'panic', 'emergency', 'operationEventNotification',
            ];
            if (frameType === 1 && msg.zclMsg.cmdId && !cmdIDs.includes(msg.zclMsg.cmdId)) {
                debug(`Message has unsupported cmdID: ${msg.zclMsg.cmdId}`);
            }
            if (frameType === 1 && cmdIDs.includes(msg.zclMsg.cmdId) && msg.zclMsg.payload) {
                af.controller._shepherd.emit('ind:cmd', targetEp, msg.clusterid, msg.zclMsg.payload, msg.zclMsg.cmdId, msg);
            }
            if (frameType === 0) // foundation
                dispatchTo = targetEp.onZclFoundation;
            else if (frameType === 1) // functional
                dispatchTo = targetEp.onZclFunctional;
            break;
    }
    if (_.isFunction(dispatchTo)) {
        setImmediate(function () {
            dispatchTo(msg, remoteEp);
        });
    }
    if (mandatoryEvent)
        af.controller.emit(mandatoryEvent, msg);
    if (type === 'zclIncomingMsg') // no need for further parsing
        return;
    // further parse for ZCL packet from incomingMsg and incomingMsgExt
    if (zclHeader) { // if (zclHeader && targetEp.isZclSupported()) {
        if (zclHeader.frameCntl.frameType === 0) { // foundation
            zcl.parse(msg.data, function (err, zclData) {
                if (!err)
                    zclIncomingParsedMsgEmitter(msg, zclData);
            });
        }
        else if (zclHeader.frameCntl.frameType === 1) { // functional
            zcl.parse(msg.data, msg.clusterid, function (err, zclData) {
                if (!err)
                    zclIncomingParsedMsgEmitter(msg, zclData);
            });
        }
    }
}
/*************************************************************************************************/
/*** Private Functions: Af and Zcl Incoming Message Handlers                                   ***/
/*************************************************************************************************/
function dataConfirmHandler(msg) {
    return dispatchIncomingMsg('dataConfirm', msg);
}
function reflectErrorHandler(msg) {
    return dispatchIncomingMsg('reflectError', msg);
}
function incomingMsgHandler(msg) {
    return dispatchIncomingMsg('incomingMsg', msg);
}
function incomingMsgExtHandler(msg) {
    return dispatchIncomingMsg('incomingMsgExt', msg);
}
function zclIncomingMsgHandler(msg) {
    return dispatchIncomingMsg('zclIncomingMsg', msg);
}
/*************************************************************************************************/
/*** Private Functions                                                                         ***/
/*************************************************************************************************/
function zclIncomingParsedMsgEmitter(msg, zclData) {
    var parsedMsg = _.cloneDeep(msg);
    parsedMsg.zclMsg = zclData;
    setImmediate(function () {
        af.controller.emit('ZCL:incomingMsg', parsedMsg);
    });
}
function makeAfParams(loEp, dstEp, cId, rawPayload, opt) {
    opt = opt || {}; // opt = { options, radius }
    proving.number(cId, 'cId should be a number.');
    if (opt.hasOwnProperty('options'))
        proving.number(opt.options, 'opt.options should be a number.');
    if (opt.hasOwnProperty('radius'))
        proving.number(opt.radius, 'opt.radius should be a number.');
    var afOptions = ZSC.AF.options.ACK_REQUEST | ZSC.AF.options.DISCV_ROUTE, // ACK_REQUEST (0x10), DISCV_ROUTE (0x20)
    afParams = {
        dstaddr: dstEp.getNwkAddr(),
        destendpoint: dstEp.getEpId(),
        srcendpoint: loEp.getEpId(),
        clusterid: cId,
        transid: af.controller ? af.controller.nextTransId() : null,
        options: opt.hasOwnProperty('options') ? opt.options : afOptions,
        radius: opt.hasOwnProperty('radius') ? opt.radius : ZSC.AF_DEFAULT_RADIUS,
        len: rawPayload.length,
        data: rawPayload
    };
    return afParams;
}
function makeAfParamsExt(loEp, addrMode, dstAddrOrGrpId, cId, rawPayload, opt) {
    opt = opt || {}; // opt = { options, radius, dstEpId, dstPanId }
    proving.number(cId, 'cId should be a number.');
    proving.defined(loEp, 'loEp should be defined');
    if (opt.hasOwnProperty('options'))
        proving.number(opt.options, 'opt.options should be a number.');
    if (opt.hasOwnProperty('radius'))
        proving.number(opt.radius, 'opt.radius should be a number.');
    var afOptions = ZSC.AF.options.DISCV_ROUTE, afParamsExt = {
        dstaddrmode: addrMode,
        dstaddr: zutils.toLongAddrString(dstAddrOrGrpId),
        destendpoint: 0xFF,
        dstpanid: opt.hasOwnProperty('dstPanId') ? opt.dstPanId : 0,
        srcendpoint: loEp.getEpId(),
        clusterid: cId,
        transid: af.controller ? af.controller.nextTransId() : null,
        options: opt.hasOwnProperty('options') ? opt.options : afOptions,
        radius: opt.hasOwnProperty('radius') ? opt.radius : ZSC.AF_DEFAULT_RADIUS,
        len: rawPayload.length,
        data: rawPayload
    };
    switch (addrMode) {
        case ZSC.AF.addressMode.ADDR_NOT_PRESENT:
            break;
        case ZSC.AF.addressMode.ADDR_GROUP:
            afParamsExt.destendpoint = 0xFF;
            break;
        case ZSC.AF.addressMode.ADDR_16BIT:
        case ZSC.AF.addressMode.ADDR_64BIT:
            afParamsExt.destendpoint = opt.hasOwnProperty('dstEpId') ? opt.dstEpId : 0xFF;
            afParamsExt.options = opt.hasOwnProperty('options') ? opt.options : afOptions | ZSC.AF.options.ACK_REQUEST;
            break;
        case ZSC.AF.addressMode.ADDR_BROADCAST:
            afParamsExt.destendpoint = 0xFF;
            afParamsExt.dstaddr = zutils.toLongAddrString(0xFFFF);
            break;
        default:
            afParamsExt = null;
            break;
    }
    return afParamsExt;
}
function nextZclSeqNum() {
    seqNumber += 1; // seqNumber is a private var on the top of this module
    if (seqNumber > 255 || seqNumber < 0)
        seqNumber = 0;
    af._seq = seqNumber;
    return seqNumber;
}
/*************************************************************************************************/
/*** module.exports                                                                            ***/
/*************************************************************************************************/
module.exports = function (controller) {
    var msgHandlers = [
        { evt: 'AF:dataConfirm', hdlr: dataConfirmHandler },
        { evt: 'AF:reflectError', hdlr: reflectErrorHandler },
        { evt: 'AF:incomingMsg', hdlr: incomingMsgHandler },
        { evt: 'AF:incomingMsgExt', hdlr: incomingMsgExtHandler },
        { evt: 'ZCL:incomingMsg', hdlr: zclIncomingMsgHandler }
    ];
    if (!(controller instanceof EventEmitter))
        throw new TypeError('Controller should be an EventEmitter.');
    af.controller = controller;
    af.areq = new Areq(controller);
    function isAttached(evt, lsn) {
        var has = false, lsns = af.controller.listeners(evt);
        if (_.isArray(lsns) && lsns.length) {
            has = _.find(lsns, function (n) {
                return n === lsn;
            });
        }
        else if (_.isFunction(lsns)) {
            has = (lsns === lsn);
        }
        return !!has;
    }
    // attach event listeners
    _.forEach(msgHandlers, function (rec) {
        if (!isAttached(rec.evt, rec.hdlr))
            af.controller.on(rec.evt, rec.hdlr);
    });
    return af;
};
//# sourceMappingURL=af.js.map