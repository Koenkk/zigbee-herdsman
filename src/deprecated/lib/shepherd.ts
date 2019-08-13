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
}


/*************************************************************************************************/
/*** Public Methods                                                                            ***/
/*************************************************************************************************/


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
