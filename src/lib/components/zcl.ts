import {ZclFrame, getCommandResponseLegacy, getFunctionalLegacy, getFoundationLegacy} from '../../zcl';
var zclPacket = require('../../deprecated/zcl-packet');
const assert = require('assert');

function toLegacyFormat(frame: ZclFrame, convertID: boolean, convertManufcode: boolean): any {
    let manufCode = frame.Header.manufacturerCode;

    if (convertManufcode) {
        manufCode = frame.Header.manufacturerCode == null ? 0 : frame.Header.manufacturerCode;
    }

    return {
        frameCntl: {
            frameType: frame.Header.frameControl.frameType,
            manufSpec: frame.Header.frameControl.manufacturerSpecific === true ? 1 : 0,
            direction: frame.Header.frameControl.direction,
            disDefaultRsp: frame.Header.frameControl.disableDefaultResponse === true ? 1 : 0,
        },
        manufCode,
        seqNum: frame.Header.transactionSequenceNumber,
        cmdId: convertID ? frame.getCommand().name : frame.Header.commandIdentifier,
        payload: frame.Payload,
    };
}

module.exports = {
    frame: function (frameCntl, manufCode, seqNum, cmd, zclPayload, clusterId) {
        const zclPacketFrame = zclPacket.frame(frameCntl, manufCode, seqNum, cmd, zclPayload, clusterId);
        let converted = null;

        try {
            const frame = ZclFrame.create(frameCntl.frameType, frameCntl.direction, frameCntl.disDefaultRsp === 1 ? true : false, manufCode === 0 ? null : manufCode, seqNum, cmd, clusterId, zclPayload);
            converted = frame.toBuffer();
            assert.deepEqual(zclPacketFrame, converted);
        } catch (e) {
            console.log('\n\n\n\n\n');
            console.log("PROBLEM DETECTED");
            console.log("Please create an issue here with the contents of below: https://github.com/koenkk/zigbee2mqtt/issues");
            console.log("===== Stack =====");
            console.log(e.stack)
            console.log('===== Arguments =====');
            console.log(frameCntl, manufCode, seqNum, cmd, zclPayload, clusterId);
            console.log('===== zcl-packet =====');
            console.log(JSON.stringify(zclPacketFrame));
            console.log('===== zcl =====');
            console.log(JSON.stringify(converted));
            console.log('===============');
            console.log('\n\n\n\n\n');
        }

        return converted;
    },
    parse: function (buf: Buffer, clusterID: number, callback) {
        const cb = (error, result) => {
            let converted;
            try {
                const frame = ZclFrame.fromBuffer(clusterID, buf);
                converted = toLegacyFormat(frame, true, true);
                assert.deepEqual(result, converted);
            } catch (e) {
                console.log('\n\n\n\n\n');
                console.log("PROBLEM DETECTED");
                console.log("Please create an issue here with the contents of below: https://github.com/koenkk/zigbee2mqtt/issues");
                console.log("===== Stack =====");
                console.log(e.stack)
                console.log('===== Buffer =====');
                console.log(buf.toJSON());
                console.log('===== zcl-packet =====');
                console.log(JSON.stringify(result));
                console.log('===== zcl =====');
                console.log(JSON.stringify(converted));
                console.log('===============');
                console.log('\n\n\n\n\n');
            }

            callback(error, converted);
        };

        return zclPacket.parse(buf, clusterID, cb);
    },
    header: function (rawBuf) {
        var header = zclPacket.header(rawBuf);

        let converted;
        try {
            const frame = ZclFrame.fromBuffer(0, rawBuf);
            converted = toLegacyFormat(frame, false, false);
            delete converted.payload;
            assert.deepEqual(header, converted);
        } catch (e) {
            console.log('\n\n\n\n\n');
            console.log("PROBLEM DETECTED");
            console.log("Please create an issue here with the contents of below: https://github.com/koenkk/zigbee2mqtt/issues");
            console.log("===== Stack =====");
            console.log(e.stack)
            console.log('===== Buffer =====');
            console.log(rawBuf.toJSON());
            console.log('===== zcl-packet header =====');
            console.log(JSON.stringify(header));
            console.log('===== zcl header =====');
            console.log(JSON.stringify(converted));
            console.log('===============');
            console.log('\n\n\n\n\n');
        }

        if (!header)
            return;
        else if (header.frameCntl.frameType > 1)    // 2, 3 are reserved
            return;

        return header;
    }
};
