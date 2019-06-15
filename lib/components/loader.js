/* jshint node: true */
'use strict';

var Q = require('q'),
    _ = require('busyman'),
    Ziee = require('ziee');

var Device = require('../model/device'),
    Endpoint = require('../model/endpoint');

var loader = {};

loader.reloadSingleDev = function (shepherd, devRec, callback) {
    var deferred = Q.defer(),
        dev = shepherd._devbox.get(devRec.id);

    if (dev && isSameDevice(dev, devRec)) {
        deferred.resolve(null);  // same dev exists, do not reload
        return deferred.promise.nodeify(callback);
    } else if (dev) {
        devRec.id = null;        // give new id to devRec
    }

    var recoveredDev = new Device(devRec);

    _.forEach(devRec.endpoints, function (epRec, epId) {
        var recoveredEp = new Endpoint(recoveredDev, epRec);

        recoveredEp.clusters = new Ziee();

        _.forEach(epRec.clusters, function (cInfo, cid) {
            recoveredEp.clusters.init(cid, 'dir', cInfo.dir);
            recoveredEp.clusters.init(cid, 'attrs', cInfo.attrs, false);
        });

        shepherd._attachZclMethods(recoveredEp);
        recoveredDev.endpoints[epId] = recoveredEp;
    });

    recoveredDev._recoverFromRecord(devRec);
    return shepherd._registerDev(recoveredDev, callback);    // return (err, id)
};

loader.reloadDevs = function (shepherd, callback) {
    var deferred = Q.defer(),
        recoveredIds = [];

    Q.ninvoke(shepherd._devbox, 'findFromDb', {}).then(function (devRecs) {
        var total = devRecs.length;

        devRecs.forEach(function (devRec) {
            if (devRec.nwkAddr === 0) {  // coordinator
                total -= 1;
                if (total === 0)         // all done
                    deferred.resolve(recoveredIds);
            } else {
                loader.reloadSingleDev(shepherd, devRec).then(function (id) {
                    recoveredIds.push(id);
                }).fail(function (err) {
                    recoveredIds.push(null);
                }).done(function () {
                    total -= 1;
                    if (total === 0)     // all done
                        deferred.resolve(recoveredIds);
                });
            }
        });
    }).fail(function (err) {
        deferred.reject(err);
    }).done();

    return deferred.promise.nodeify(callback);
};

loader.reload = function (shepherd, callback) {
    var deferred = Q.defer();

    loader.reloadDevs(shepherd).then(function (devIds) {
        loader.syncDevs(shepherd, function () {
            deferred.resolve();  // whether sync or not, return success
        });
    }).fail(function (err) {
        deferred.reject(err);
    }).done();

    return deferred.promise.nodeify(callback);
};

loader.syncDevs = function (shepherd, callback) {
    var deferred = Q.defer(),
        idsNotInBox = [];

    Q.ninvoke(shepherd._devbox, 'findFromDb', {}).then(function (devRecs) {
        devRecs.forEach(function (devRec) {
            if (!shepherd._devbox.get(devRec.id))
                idsNotInBox.push(devRec.id);
        });

        if (idsNotInBox.length) {
            var ops = devRecs.length;
            idsNotInBox.forEach(function (id) {
                setImmediate(function () {
                    shepherd._devbox.remove(id, function () {
                        ops -= 1;
                        if (ops === 0)
                            deferred.resolve();
                    });
                });
            });
        } else {
            deferred.resolve();
        }
    }).fail(function (err) {
        deferred.reject(err);
    }).done();

    return deferred.promise.nodeify(callback);
};

function isSameDevice(dev, devRec) {
    return (dev.getIeeeAddr() === devRec.ieeeAddr) ? true : false;
}

module.exports = loader;
