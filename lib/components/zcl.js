/* jshint node: true */
'use strict';

var zclPacket = require('../../zcl-packet');

module.exports = {
    frame: zclPacket.frame,
    parse: zclPacket.parse,
    header: function (rawBuf) {
        var header = zclPacket.header(rawBuf);

        if (!header)
            return;
        else if (header.frameCntl.frameType > 1)    // 2, 3 are reserved
            return;

        return header;
    }
};
