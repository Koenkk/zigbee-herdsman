import {ZclFrame} from '../../zcl';
var zclPacket = require('../../zcl-packet');

module.exports = {
    frame: zclPacket.frame,
    parse: function (buf: Buffer, clusterID: number, callback) {
        const cb = (error, result) => {
            console.log('\n\n\n', result, '\n\n\n');

            const frame = ZclFrame.fromBuffer(clusterID, buf);

            console.log(frame, "\n\n\n\n");

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
