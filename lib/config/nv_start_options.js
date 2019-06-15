/* jshint node: true */
'use strict';

var ZSC = require('zstack-constants'),
    NVID8 = ZSC.SAPI.nvItemIdsUint8,
    NVID16 = ZSC.SYS.nvItemIds;

var nvParams = {
    startupOption: {
        id: NVID8.STARTUP_OPTION,     // 0x03
        len: 0x01,
        offset: 0x00,
        value: [ 0x00 ]
    },
    panId: {
        id: NVID8.PANID,              // 0x83
        len: 0x02,
        offset: 0x00,
        value: [ 0xFF, 0xFF ]
    },
    extPanId: {
        id: NVID8.EXTENDED_PAN_ID,    // 0x2D
        len: 0x08,
        offset: 0x00,
        value: [ 0xDD, 0xDD, 0xDD, 0xDD, 0xDD, 0xDD, 0xDD, 0xDD ]
    },
    channelList: {
        id: NVID8.CHANLIST,           // 0x84
        len: 0x04,
        offset: 0x00,
        value: [ 0x00, 0x08, 0x00, 0x00 ]   // Little endian. Default is 0x00000800 for CH11;  Ex: value: [ 0x00, 0x00, 0x00, 0x04 ] for CH26, [ 0x00, 0x00, 0x20, 0x00 ] for CH15.
    },
    logicalType: {
        id: NVID8.LOGICAL_TYPE,       // 0x87
        len: 0x01,
        offset: 0x00,
        value: [ 0x00 ]
    },
    precfgkey3: {
        id: NVID8.PRECFGKEY,          // 0x62
        len: 0x10,
        offset: 0x00,
        value: [ 0x01, 0x03, 0x05, 0x07, 0x09, 0x0B, 0x0D, 0x0F, 0x00, 0x02, 0x04, 0x06, 0x08, 0x0A, 0x0C, 0x0D ]
    },
    precfgkey: {
        configid: NVID8.PRECFGKEY,          // 0x62
        len: 0x10,
        value: [ 0x01, 0x03, 0x05, 0x07, 0x09, 0x0B, 0x0D, 0x0F, 0x00, 0x02, 0x04, 0x06, 0x08, 0x0A, 0x0C, 0x0D ]
    },
    precfgkeysEnable: {
        id: NVID8.PRECFGKEYS_ENABLE,  // 0x63
        len: 0x01,
        offset: 0x00,
        value: [ 0x00 ]
        // value: 0 (FALSE) only coord defualtKey need to be set, and OTA to set other devices in the network.
        // value: 1 (TRUE) Not only coord, but also all devices need to set their defualtKey (the same key). Or they can't not join the network.
    },
    zdoDirectCb: {
        id: NVID8.ZDO_DIRECT_CB,      // 0x8F
        len: 0x01,
        offset: 0x00,
        value: [ 0x01 ]
    },
    securityMode: {
        id: NVID16.TCLK_TABLE_START,        // 0x0101
        offset: 0x00,
        len: 0x20,
        // ZigBee Alliance Pre-configured TC Link Key - 'ZigBeeAlliance09'
        value: [ 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0x5a, 0x69, 0x67, 0x42, 0x65, 0x65, 0x41, 0x6c,
                 0x6c, 0x69, 0x61, 0x6e, 0x63, 0x65, 0x30, 0x39, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00 ]
    },
    znpCfgItem: {
        id: NVID16.ZNP_HAS_CONFIGURED,      // 0x0F00
        len: 0x01,
        initlen: 0x01,
        initvalue: [ 0x00 ]
    },
    znpHasConfigured: {
        id: NVID16.ZNP_HAS_CONFIGURED,      // 0x0F00
        offset: 0x00,
        len: 0x01,
        value: [ 0x55 ]
    },
    znpCfgItem3: {
        // id: NVID16.ZNP_HAS_CONFIGURED,
        id: 0x0060,
        len: 0x01,
        initlen: 0x01,
        initvalue: [ 0x00 ]
    },
    bdbNodeIsOnANetwork: {
        id: NVID8.BDBNODEISONANETWORK,
        len: 0x01,
        initlen: 0x01,
        initvalue: [ 0x01 ]
    },
    znpHasConfigured3: {
        // id: NVID16.ZNP_HAS_CONFIGURED,
        // use different id, see: https://e2e.ti.com/support/wireless-connectivity/zigbee-and-thread/f/158/p/570725/2095094
        // As I remember, NV ID 0x0401-0x0FFF doesn't work in Z-Stack for CC26xx.
        id: 0x0060,
        offset: 0x00,
        len: 0x01,
        value: [ 0x55 ]
    },
    afRegister: {
        endpoint: 0x08,
        appprofid: 0xBF0D,
        appdeviceid: 0x0501,
        appdevver: 0x01,
        latencyreq: 0x00,
        appnuminclusters: 0x04,
        appinclusterlist: [ 0x00, 0x00, 0x15, 0x00, 0x02, 0x07, 0x00, 0x04 ],
        appnumoutclusters: 0x00,
        appoutclusterlist: []
    }
};

module.exports = nvParams;
