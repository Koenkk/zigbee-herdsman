/* jshint node: true */
'use strict';

var _ = require('busyman'),
    zclId = require('zcl-id'),
    foundApis = require('./foundation_apis');

/*************************************************************************************************/
/*** Zive Class                                                                                ***/
/*************************************************************************************************/
function Zive(infos, clusters) {
    var self = this;

    this._simpleDesc = {
        profId: infos.profId,
        devId: infos.devId,
        inClusterList: [],
        outClusterList: []
    };

    this._endpoint = null;
    this._discCmds = infos.discCmds ? infos.discCmds : [];

    this._foundApis = foundApis(this);

    this.clusters = clusters;
    this.clusters.glue(this);

    _.forEach(clusters.dumpSync(), function (cInfo, cId) {
        if (cInfo.dir.value & 1)
            self._simpleDesc.inClusterList.push(zclId.cluster(cId).value);
        if (cInfo.dir.value & 2)
            self._simpleDesc.outClusterList.push(zclId.cluster(cId).value);
    });
}

Zive.prototype.foundationHandler = function (msg) {
    var self = this,
        clusters = this.clusters,
        data = msg.zclMsg,
        cId = msg.clusterid,
        cmdName = zclId.foundation(data.cmdId).key,
        cfg = {
            manufSpec: data.frameCntl.manufSpec,
            direction: 1,
            disDefaultRsp: data.frameCntl.disDefaultRsp,
            seqNum: data.seqNum
        },
        cmdRsp;

    cmdName = (cmdName === 'writeUndiv') ? 'write' : cmdName;

    switch (cmdName) {
        case 'read':
        case 'configReport':
        case 'readReportConfig':
        case 'discover':
        case 'write':
            cmdRsp = cmdName + 'Rsp';
            break;
        case 'writeNoRsp':
            this._foundApis.write(clusters, cId, data.payload, msg, function () {});
            break;
        case 'readStruct':
        case 'writeStrcut':
            // not support now
            break;
        default:
            break;
    }

    if (cmdRsp)
        this._foundApis[cmdName](clusters, cId, data.payload, msg, function (err, result) {
            self.foundation(msg.srcaddr, msg.srcendpoint, cId, cmdRsp, result, cfg);
        });
};

Zive.prototype.functionalHandler = function (msg, remoteEp) {
    var self = this,
        data = msg.zclMsg,
        cId = msg.clusterid,
        cmdId = data.cmdId,
        cmdDir = data.frameCntl.direction,
        defaultRsp = data.frameCntl.disDefaultRsp,
        cfg = {
            manufSpec: data.frameCntl.manufSpec,
            direction: cmdDir ? 0 : 1,
            disDefaultRsp: defaultRsp,
            seqNum: data.seqNum
        },
        payload = {
            cmdId: cmdId,
            statusCode: null
        },
        cmdType,
        cmdName,
        cmdRspId,
        cmdRspName;

    cmdType = cmdDir ? 'cmdRsp' : 'cmd';    // 0: client-to-server('cmd'), 1: server-to-client('cmdRsp')
    cmdName = zclId[cmdDir ? 'getCmdRsp' : 'functional'](cId, cmdId).key;
    cmdRspId = zclId[cmdDir ? 'functional' : 'getCmdRsp'](cId, cmdName + 'Rsp');
    cmdRspName = cmdRspId ? cmdRspId.key : null;

    if (cmdType === 'cmdRsp' && _.isObject(data.payload)) {
        var srcInfo = {
            epId: null,
            ieeeAddr: '',
            nwkAddr: null
        };

        if (_.isObject(remoteEp)) {
            srcInfo.epId = remoteEp.getEpId();
            srcInfo.ieeeAddr = remoteEp.getIeeeAddr();
            srcInfo.nwkAddr = remoteEp.getNwkAddr();
        }

        data.payload.src = srcInfo;
    }

    this.clusters.exec(cmdType, cId, cmdName, data.payload, function (err, rspData) {
        // genAlarms, genRssiLocation

        if (err) {
            if (rspData === '_notfound_')
                payload.statusCode = zclId.status('unsupClusterCmd').value;
            else
                payload.statusCode = zclId.status('failure').value;

            self.foundation(msg.srcaddr, msg.srcendpoint, cId, 'defaultRsp', payload, cfg);
        } else if (cmdRspName) {
            if (!rspData) {
                if (defaultRsp === 0) {
                    payload.statusCode = zclId.status('success').value;
                    self.foundation(msg.srcaddr, msg.srcendpoint, cId, 'defaultRsp', payload, cfg);
                }
            } else {
                payload = rspData;
                self.functional(msg.srcaddr, msg.srcendpoint, cId, cmdRspName, payload, cfg);
                // [TODO] if payload format error, throw error?
            }
        } else if (defaultRsp === 0) {
            payload.statusCode = zclId.status('success').value;
            self.foundation(msg.srcaddr, msg.srcendpoint, cId, 'defaultRsp', payload, cfg);
        }
    });
};

Zive.prototype._report = function (cId, attrId, data, afMsg) {
    var cfg = {
            manufSpec: afMsg.zclMsg.frameCntl.manufSpec,
            direction: 1,
            disDefaultRsp: afMsg.zclMsg.frameCntl.disDefaultRsp
        },
        attrReport = {
            attrId: attrId,
            dataType: zclId.attrType(cId, attrId).value,
            attrData: null
        };

    attrReport.attrData = data;
    this.foundation(afMsg.srcaddr, afMsg.srcendpoint, cId, 'report', attrReport, cfg);
};

module.exports = Zive;
