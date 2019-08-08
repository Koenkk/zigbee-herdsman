/* jshint node: true */
'use strict';

var Q = require('q'),
    _ = require('busyman'),
    Ziee = require('../../deprecated/ziee'),
    debug = require('debug')('zigbee-shepherd:init');

var Coordinator = require('../model/coord'),
    Coordpoint = require('../model/coordpoint'),
    nvParams = require('../config/nv_start_options.js');

var init = {};

/*************************************************************************************************/
/*** Public APIs                                                                               ***/
/*************************************************************************************************/
init.setupCoord = function (controller, callback) {
    return controller.query.firmware().then(function(firmwareInfo){
        controller._firmware = firmwareInfo;
        controller._isZstack3x0 = firmwareInfo.product === 1;
        controller._isZstack30x = firmwareInfo.product === 2;
    }).then(function () {
        return controller.checkNvParams().then(function () {
            return init._bootCoordFromApp(controller);
        });
    }).then(function (netInfo) {
        return init._registerDelegators(controller, netInfo);
    }).nodeify(callback);
};

/*************************************************************************************************/
/*** Private APIs                                                                              ***/
/*************************************************************************************************/

init._registerDelegators = function (controller, netInfo) {
    var coord = controller._coord,
        dlgInfos =  [
            { profId: 0x0104, epId: 1 }, { profId: 0x0101, epId: 2 }, { profId: 0x0105, epId: 3 },
            { profId: 0x0107, epId: 4 }, { profId: 0x0108, epId: 5 }, { profId: 0x0109, epId: 6 }
        ];

    return controller.simpleDescReq(0, netInfo.ieeeAddr).then(function (devInfo) {
        var deregisterEps = [];

        _.forEach(devInfo.epList, function (epId) {
            if (epId > 10) {
                deregisterEps.push(function () {
                    return controller.request('AF', 'delete', { endpoint: epId }).delay(10).then(function () {
                        debug('Deregister endpoint, epId: %s', epId);
                    });
                });
            }
        });

        if (!deregisterEps.length) {
            return devInfo;
        } else {
            return deregisterEps.reduce(function (soFar, fn) {
                return soFar.then(fn);
            }, Q(0)).then(function () {
                return devInfo;
            });
        }
    }).then(function (devInfo) {
        var registerDlgs = [];

        if (!coord)
            coord = controller._coord = new Coordinator(devInfo);
        else
            coord.endpoints = {};

        _.forEach(dlgInfos, function (dlgInfo) {
            var dlgDesc = { profId: dlgInfo.profId, epId: dlgInfo.epId, devId: 0x0005, inClusterList: [], outClusterList: [] },
                dlgEp = new Coordpoint(coord, dlgDesc, true),
                simpleDesc;

            dlgEp.clusters = new Ziee();
            coord.endpoints[dlgEp.getEpId()] = dlgEp;

            simpleDesc = _.find(devInfo.endpoints, function (ep) {
                return ep.epId === dlgInfo.epId;
            });

            if (!_.isEqual(dlgDesc, simpleDesc)) {
                registerDlgs.push(function () {
                    return controller.registerEp(dlgEp).delay(10).then(function () {
                        debug('Register delegator, epId: %s, profId: %s ', dlgEp.getEpId(), dlgEp.getProfId());
                    });
                });
            }
        });

        return registerDlgs.reduce(function (soFar, fn) {
            return soFar.then(fn);
        }, Q(0));
    }).then(function () {
        return controller.query.coordInfo().then(function (coordInfo) {
            coord.update(coordInfo);
        });
    });
};

module.exports = init;
