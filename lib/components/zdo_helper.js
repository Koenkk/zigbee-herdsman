/* jshint node: true */
'use strict';

var zdoHelper = {},
    zdoReqRspMap,
    zdoIndSuffix;

zdoReqRspMap = {
    nwkAddrReq:         { ind: 'nwkAddrRsp',        apiType: 'concat',  suffix: [ 'ieeeaddr', 'startindex' ]        },
    ieeeAddrReq:        { ind: 'ieeeAddrRsp',       apiType: 'concat',  suffix: [ 'shortaddr' ]                     }, // 'startindex' mismatch
    nodeDescReq:        { ind: 'nodeDescRsp',       apiType: 'generic', suffix: [ 'nwkaddrofinterest' ]             },
    powerDescReq:       { ind: 'powerDescRsp',      apiType: 'generic', suffix: [ 'nwkaddrofinterest' ]             },
    simpleDescReq:      { ind: 'simpleDescRsp',     apiType: 'generic', suffix: [ 'nwkaddrofinterest', 'endpoint' ] },
    activeEpReq:        { ind: 'activeEpRsp',       apiType: 'generic', suffix: [ 'nwkaddrofinterest' ]             },
    matchDescReq:       { ind: 'matchDescRsp',      apiType: 'generic', suffix: [ 'nwkaddrofinterest' ]             },
    complexDescReq:     { ind: 'complexDescRsp',    apiType: 'generic', suffix: [ 'nwkaddrofinterest' ]             },
    userDescReq:        { ind: 'userDescRsp',       apiType: 'generic', suffix: [ 'nwkaddrofinterest' ]             },
    userDescSet:        { ind: 'userDescConf',      apiType: 'generic', suffix: [ 'nwkaddrofinterest' ]             },
    serverDiscReq:      { ind: 'serverDiscRsp',     apiType: 'special', suffix: []                                  },
    endDeviceBindReq:   { ind: 'endDeviceBindRsp',  apiType: 'generic', suffix: [ 'dstaddr' ]                       }, // address 16bit mode unsupported
    bindReq:            { ind: 'bindRsp',           apiType: 'special', suffix: [ 'dstaddr' ]                       },
    unbindReq:          { ind: 'unbindRsp',         apiType: 'generic', suffix: [ 'dstaddr' ]                       },
    nwkDiscoveryReq:    { ind: 'nwkDiscoveryCnf',   apiType: 'generic', suffix: []                                  },
    joinReq:            { ind: 'joinCnf',           apiType: 'generic', suffix: []                                  },
    mgmtNwkDiscReq:     { ind: 'mgmtNwkDiscRsp',    apiType: 'concat',  suffix: [ 'dstaddr', 'startindex' ]         },
    mgmtLqiReq:         { ind: 'mgmtLqiRsp',        apiType: 'concat',  suffix: [ 'dstaddr', 'startindex' ]         },
    mgmtRtgReq:         { ind: 'mgmtRtgRsp',        apiType: 'concat',  suffix: [ 'dstaddr', 'startindex' ]         },
    mgmtBindReq:        { ind: 'mgmtBindRsp',       apiType: 'concat',  suffix: [ 'dstaddr', 'startindex' ]         },
    mgmtLeaveReq:       { ind: 'mgmtLeaveRsp',      apiType: 'generic', suffix: [ 'dstaddr' ]                       },
    mgmtDirectJoinReq:  { ind: 'mgmtDirectJoinRsp', apiType: 'generic', suffix: [ 'dstaddr' ]                       },
    mgmtPermitJoinReq:  { ind: 'mgmtPermitJoinRsp', apiType: 'special', suffix: [ 'dstaddr' ]                       },
    mgmtNwkUpdateReq:   null,
    endDeviceAnnce:     null,
    msgCbRegister:      null,
    msgCbRemove:        null,
    startupFromApp:     null,
    setLinkKey:         null,
    removeLinkKey:      null,
    getLinkKey:         null,
    secAddLinkKey:      null,
    secEntryLookupExt:  null,
    extRouteDisc:       null,
    extRouteCheck:      null,
    extRemoveGroup:     null,
    extRemoveAllGroup:  null,
    extFindGroup:       null,
    extAddGroup:        null,
    extCountAllGroups:  null,
    extRxIdle:          null,
    extUpdateNwkKey:    null,
    extSwitchNwkKey:    null,
    extNwkInfo:         null,
    extSecApsRemoveReq: null,
    extFindAllGroupsEndpoint: null,
    forceConcentratorChange:  null,
    extSetParams:             null,
    endDeviceTimeoutReq:      null,
    sendData:                 null,
    nwkAddrOfInterestReq:     null
};

zdoIndSuffix = {
    nwkAddrRsp:        [ 'ieeeaddr', 'startindex' ],
    ieeeAddrRsp:       [ 'nwkaddr' ],  // 'startindex' mismatch
    nodeDescRsp:       [ 'nwkaddr' ],
    powerDescRsp:      [ 'nwkaddr' ],
    simpleDescRsp:     [ 'nwkaddr', 'endpoint' ],
    activeEpRsp:       [ 'nwkaddr' ],
    matchDescRsp:      [ 'nwkaddr' ],
    complexDescRsp:    [ 'nwkaddr' ],
    userDescRsp:       [ 'nwkaddr' ],
    userDescConf:      [ 'nwkaddr' ],
    serverDiscRsp:     null,    // special, listen at controller.on('ZDO:serverDiscRsp')
    endDeviceBindRsp:  [ 'srcaddr' ],
    bindRsp:           [ 'srcaddr' ],
    unbindRsp:         [ 'srcaddr' ],
    nwkDiscoveryCnf:   null,
    joinCnf:           null,
    mgmtNwkDiscRsp:    [ 'srcaddr', 'startindex' ],
    mgmtLqiRsp:        [ 'srcaddr', 'startindex' ],
    mgmtRtgRsp:        [ 'srcaddr', 'startindex' ],
    mgmtBindRsp:       [ 'srcaddr', 'startindex' ],
    mgmtLeaveRsp:      [ 'srcaddr' ],
    mgmtDirectJoinRsp: [ 'srcaddr' ],
    mgmtPermitJoinRsp: [ 'srcaddr' ],
    stateChangeInd:    null,    // very special, tackled in event_bridge._zdoIndicationEventBridge()
    endDeviceAnnceInd: null,
    matchDescRspSent:  null,
    statusErrorRsp:    null,
    srcRtgInd:         null,
    beacon_notify_ind: null,
    leaveInd:          null,
    msgCbIncoming:     null,
    tcDeviceInd:       null,
    permitJoinInd:     null
};

/*************************************************************************************************/
/*** Public APIs                                                                               ***/
/*************************************************************************************************/
zdoHelper.hasAreq = function (reqName) {
    var meta = zdoReqRspMap[reqName];
    return meta ? (!!meta.ind) : false;
};

zdoHelper.getRequestType = function (reqName) {
    var meta = zdoReqRspMap[reqName];
    return meta ? meta.apiType : 'rspless';
};

zdoHelper.generateEventOfRequest = function (reqName, valObj) {
    var meta = zdoReqRspMap[reqName],
        evtName;

    if (!zdoHelper.hasAreq(reqName))
        return;

    evtName = 'ZDO:' + meta.ind;

    if (meta.suffix.length === 0)
        return evtName;
    
    meta.suffix.forEach(function (key) {
        evtName = evtName + ':' + valObj[key].toString();
    });

    return evtName;
};

zdoHelper.generateEventOfIndication = function (indName, msgData) {
    var meta = zdoIndSuffix[indName],
        evtName;

    evtName = 'ZDO:' + indName;

    if (!meta || (meta.length === 0))
        return;

    meta.forEach(function (key) {
        evtName = evtName + ':' + msgData[key].toString();
    });

    return evtName;
};

module.exports = zdoHelper;
