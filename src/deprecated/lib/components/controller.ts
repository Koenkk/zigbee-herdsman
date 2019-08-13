/*************************************************************************************************/
/*** Public ZigBee Utility APIs                                                                ***/
/*************************************************************************************************/

Controller.prototype.getNetInfo = function () {
    var net = _.cloneDeep(this._net);

    if (net.state === Zsc.COMMON.devStates.ZB_COORD)
        net.state = 'Coordinator';

    net.joinTimeLeft = this._permitJoinTime;

    return net;
};


/*************************************************************************************************/
/*** Mandatory Public APIs                                                                     ***/
/*************************************************************************************************/

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

module.exports = Controller;
