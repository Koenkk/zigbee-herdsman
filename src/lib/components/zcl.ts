import {ZclFrame} from '../../zcl';
var zclPacket = require('../../zcl-packet');
const assert = require('assert');

module.exports = {
    frame: zclPacket.frame,
    parse: function (buf: Buffer, clusterID: number, callback) {
        const cb = (error, result) => {
            const frame = ZclFrame.fromBuffer(clusterID, buf);
            const converted = {
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
            console.log('assert');
            try {
                assert.deepEqual(result, converted, "FAILD");
                console.log('SUCCESSS==========')
                console.log(buf);
                console.log('ENDDD========');
            } catch (e) {
                console.log('======')
                console.log(result);
                console.log('======')
                console.log(converted);
                console.log('+++++++++++++')
                console.log(e);
                console.log('0000000000');
            }

            callback(error, result);
        };

        return zclPacket.parse(buf, cb);
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
