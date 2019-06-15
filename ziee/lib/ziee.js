'use strict';

var _ = require('busyman'),
    zclId = require('zcl-id'),
    utils = require('./utils'),
    Spec = require('./spec');

function Ziee() {
    this.zapp = null;
}

/*************************************************************************************************/
/*** Public Methods: Smart Object Initialization                                               ***/
/*************************************************************************************************/
Ziee.prototype.init = function (cid, sid, resrcs, zcl) {
    if (!_.isNil(this.zapp))
        throw new Error('ziee has been glued to a zapp, cannot init again.');

    // init() will auto create namespace, and will firstly clear all resources in the Cluster
    var spec = this.findSpec(cid, sid) || this.create(cid, sid);
    spec.init(resrcs, zcl);

    return this;
};

Ziee.prototype.create = function (cid, sid) {
    if (!_.isNil(this.zapp))
        throw new Error('ziee has been glued to a zapp, cannot crate a new cluster.');

    var cidKey;

    if (!utils.isValidArgType(sid))
        throw new TypeError('sid should be given with a number or a string.');

    cidKey = utils.getCidKey(cid);
    this[cidKey] = this[cidKey] || {};

    if (!_.isNil(this[cidKey][sid]))
        throw new Error('Spec of sid ' + sid + ' already exists. Cannot create.');

    this[cidKey][sid] = new Spec(cidKey, sid);

    return this[cidKey][sid];
};

Ziee.prototype.glue = function (zapp) {
    this.zapp = zapp;

    return this;
};

/*************************************************************************************************/
/*** Public Methods: Synchronous                                                               ***/
/*************************************************************************************************/
Ziee.prototype.clusterList = function () {
    var self = this,
        clusterList = {
            in: [],
            out: []
        };

    _.forEach(this, function (cluster, cidKey) {
        var dir,
            cidNum;

        if (cidKey === 'zapp')
            return;

        dir = self.get(cidKey, 'dir', 'value');
        if (_.isUndefined(dir))
            return;

        if (dir & 0x01)    // in
            clusterList.in.push(utils.getCidNum(cidKey));

        if (dir & 0x02)     // out
            clusterList.out.push(utils.getCidNum(cidKey));
    });

    return clusterList;
};

Ziee.prototype.has = function (cid, sid, rid) {
    var cidKey = utils.getCidKey(cid),
        cluster = this[cidKey],
        spec,
        resrc,
        has = !!cluster;

    if (!_.isUndefined(sid) && !utils.isValidArgType(sid)) 
        throw new TypeError('sid should be given with a number or a string.');

    if (has) {
        if (!_.isUndefined(sid)){
            spec = cluster[sid];
            has = !!spec;
            if (has && !_.isUndefined(rid)) {
                resrc = spec.get(rid);
                has = !_.isUndefined(resrc);
            }
        }
    }
    
    return has;
};

Ziee.prototype.findCluster = function (cid) {
    var cidkey = utils.getCidKey(cid);
    return this[cidkey];
};

Ziee.prototype.findSpec = function (cid, sid) {
    var cidkey = utils.getCidKey(cid), 
        target = this[cidkey];

    if (!utils.isValidArgType(sid)) 
        throw new TypeError('sid should be given with a number or a string.');

    if (target)
        target = target[sid];

    return target;
};

Ziee.prototype.get = function (cid, sid, rid) {
    var spec = this.findSpec(cid, sid),
        target;

    if (spec)
        target = spec.get(rid);

    return target;
};

Ziee.prototype.set = function (cid, sid, rid, value) {
    var spec = this.findSpec(cid, sid),
        set = false;

    if (spec) {
        spec.set(rid, value);
        set = true;
    }

    return set;
};

Ziee.prototype.dumpSync = function (cid, sid) {
    var dumped,
        target,
        dumpType = 'clusters';

    if (arguments.length === 0)
        dumpType = 'clusters';
    else if (arguments.length === 1)
        dumpType = 'cluster';
    else if (arguments.length === 2)
        dumpType = 'spec';
    else
        throw new Error('Bad arguments. What do you like to dump?');

    if (dumpType === 'spec') {
        target = this.findSpec(cid, sid);
        if (target)
            dumped = target.dumpSync();
    } else if (dumpType === 'cluster') {
        target = this.findCluster(cid);
        if (target)
            dumped = utils.dumpClusterSync(target);
    } else if (dumpType === 'clusters') {
        dumped = {};
        _.forEach(this, function (o, cidKey) {
            if (cidKey !== 'zapp')
                dumped[cidKey] = utils.dumpClusterSync(o);
        });
    }

    return dumped;
};

/*************************************************************************************************/
/*** Public Methods: Asynchronous                                                              ***/
/*************************************************************************************************/
Ziee.prototype.dump = function (cid, sid, callback) {
    var dumped = {},
        target,
        dumpType = 'clusters';

    if (arguments.length === 1) {
        callback = cid;
        dumpType = 'clusters';
    } else if (arguments.length === 2) {
        callback = sid;
        dumpType = 'cluster';
    } else if (arguments.length === 3) {
        dumpType = 'spec';
    } else {
        throw new Error('Bad arguments. What do you like to dump? Do you give me a callback?');
    }

    if (!_.isFunction(callback))
        throw new TypeError('Callback should be a function.');

    if (dumpType === 'spec') {
        target = this.findSpec(cid, sid);
        if (target)
            target.dump(callback);
    } else if (dumpType === 'cluster') {
        target = this.findCluster(cid);
        if (target)
            utils.dumpCluster(target, callback);
    } else if (dumpType === 'clusters') {
        target = this;
        utils.dumpClusters(target, callback);
    }

    if (!target)
        utils.invokeCbNextTick(new Error('Target not found. Cannot dump.'), null, callback);

    return this;
};

Ziee.prototype.read = function (cid, attrId, callback) {
    var attrs = this.findSpec(cid, 'attrs');

    if (!attrs)
        return utils.invokeCbNextTick(new Error('Cluster not found.'), '_notfound_', callback);
    else
        return attrs.read(attrId, callback);
};

Ziee.prototype.write = function (cid, attrId, value, callback) {
    var attrs = this.findSpec(cid, 'attrs');

    if (!attrs)
        return utils.invokeCbNextTick(new Error('Cluster not found.'), '_notfound_', callback);
    else
        return attrs.write(attrId, value, callback);
};

Ziee.prototype.exec = function (type, cid, cmdId, argObj, callback) {
    var cmds,
        argus = [];

    if (_.isFunction(argObj)) {
        callback = argObj;
        argObj = {};
    }

    if (!_.isString(type))
        throw new TypeError('type should be a string.');

    if (!_.isPlainObject(argObj))
        throw new TypeError('argObj should be an object contains all parameters the command required.');

    if (type === 'cmd')
        cmds = this.findSpec(cid, 'cmds');
    else if (type === 'cmdRsp')
        cmds = this.findSpec(cid, 'cmdRsps');

    argus = [ this.zapp, argObj ];

    if (!cmds)
        return utils.invokeCbNextTick(new Error('Cluster not found.'), '_notfound_', callback);
    else
        return cmds.exec(cmdId, argus, callback);
};

module.exports = Ziee;