/* jshint node: true */
'use strict';

var ZSC = require('zstack-constants'),
    NVID8 = ZSC.SAPI.nvItemIdsUint8;

var nvParams = {
    ZCD_NV_EXTADDR: {
        id: NVID8.EXTADDR,
        offset: 0x00
    },
    ZCD_NV_NIB: {
        id: NVID8.NIB,
        offset: 0x00
    },
    ZCD_NV_EXTENDED_PAN_ID: {
        id: NVID8.EXTENDED_PAN_ID,
        offset: 0x00
    },
    ZCD_NV_NWK_ACTIVE_KEY_INFO: {
        id: NVID8.NWK_ACTIVE_KEY_INFO,
        offset: 0x00
    },
    ZCD_NV_NWK_ALTERN_KEY_INFO: {
        id: NVID8.NWK_ALTERN_KEY_INFO,
        offset: 0x00
    },
    ZCD_NV_APS_USE_EXT_PANID: {
        id: NVID8.APS_USE_EXT_PANID,
        offset: 0x00
    },
    ZCD_NV_PRECFGKEY: {
        id: NVID8.PRECFGKEY,
        offset: 0x00
    },
    ZCD_NV_TCLK_TABLE_START: {
        id: NVID8.TCLK_TABLE_START,
        offset: 0x00
    },
    ZCD_NV_CHANLIST: {
        id: NVID8.CHANLIST,
        offset: 0x00,
    },
    ZCD_NV_NWK_SEC_MATERIAL_TABLE_START: {
        id: NVID8.NWK_SEC_MATERIAL_TABLE_START,
        offset: 0x00,
    }
};

module.exports = nvParams;
