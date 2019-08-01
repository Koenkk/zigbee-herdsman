import {ZclFrame} from '../../zcl';
var zclPacket = require('../../zcl-packet');
const assert = require('assert');

module.exports = {
    frame: zclPacket.frame,
    parse: function (buf: Buffer, clusterID: number, callback) {
        const cb = (error, result) => {
            let converted;
            try {
                const frame = ZclFrame.fromBuffer(clusterID, buf);
                converted = {
                    frameCntl: {
                        frameType: frame.Header.frameControl.frameType,
                        manufSpec: frame.Header.frameControl.manufacturerSpecific === true ? 1 : 0,
                        direction: frame.Header.frameControl.direction,
                        disDefaultRsp: frame.Header.frameControl.disableDefaultResponse === true ? 1 : 0,
                    },
                    manufCode: frame.Header.manufacturerCode == null ? 0 : frame.Header.manufacturerCode,
                    seqNum: frame.Header.transactionSequenceNumber,
                    cmdId: result.cmdId,
                    payload: frame.Payload,
                };
                assert.deepEqual(result, converted, "FAILD");
                console.log('========= SUCCESSS ==========')
            } catch (e) {
                console.log("\n\n\n\n\nFAILED");
                console.log('======', clusterID, JSON.stringify(buf))
                console.log(JSON.stringify(result));
                console.log('======')
                console.log(converted);
                console.log('+++++++++++++')
                console.log(e);
                console.log('0000000000');
                console.log("\n\n\n\n\n");
            }

            callback(error, result);
        };

        return zclPacket.parse(buf, clusterID, cb);
    },
    header: function (rawBuf) {
        var header = zclPacket.header(rawBuf);

        if (!header)
            return;
        else if (header.frameCntl.frameType > 1)    // 2, 3 are reserved
            return;

        return header;
    }
};
