import {ZnpVersion} from './tstype';
import * as Constants from '../constants';
import {NvItem} from './tstype';

const NvItemsIds = Constants.COMMON.nvItemIds;

export default {
    znpHasConfiguredInit: (version: ZnpVersion): NvItem => {
        return {
            id: version === ZnpVersion.zStack12 ?
                NvItemsIds.ZNP_HAS_CONFIGURED_ZSTACK1 : NvItemsIds.ZNP_HAS_CONFIGURED_ZSTACK3,
            len: 0x01,
            initlen: 0x01,
            initvalue: Buffer.from([0x00]),
        };
    },
    znpHasConfigured: (version: ZnpVersion): NvItem => {
        return {
            id: version === ZnpVersion.zStack12 ?
                NvItemsIds.ZNP_HAS_CONFIGURED_ZSTACK1 : NvItemsIds.ZNP_HAS_CONFIGURED_ZSTACK3,
            offset: 0x00,
            len: 0x01,
            value: Buffer.from([0x55]),
        };
    },
    panID: (panID: number): NvItem => {
        return {
            id: NvItemsIds.PANID,
            len: 0x02,
            offset: 0x00,
            value: Buffer.from([panID & 0xFF, (panID >> 8) & 0xFF]),
        };
    },
    extendedPanID: (extendedPanID: number[]): NvItem =>  {
        return {
            id: NvItemsIds.EXTENDED_PAN_ID,
            len: 0x08,
            offset: 0x00,
            value: Buffer.from(extendedPanID),
        };
    },
    channelList: (channelList: number[]): NvItem => {
        return {
            id: NvItemsIds.CHANLIST,
            len: 0x04,
            offset: 0x00,
            value: Buffer.from(Constants.Utils.getChannelMask(channelList)),
        };
    },
    networkKeyDistribute: (distribute: boolean): NvItem => {
        return {
            id: NvItemsIds.PRECFGKEYS_ENABLE,
            len: 0x01,
            offset: 0x00,
            value: Buffer.from([distribute ? 0x01 : 0x00]),
        };
    },
    networkKey: (key: number[]): NvItem => {
        return {
            // id/configid is used depending if SAPI or SYS command is executed
            id: NvItemsIds.PRECFGKEY,
            configid: NvItemsIds.PRECFGKEY,
            len: 0x10,
            offset: 0x00,
            value: Buffer.from(key),
        };
    },
    startupOption: (value: number): NvItem => {
        return {
            id: NvItemsIds.STARTUP_OPTION,
            len: 0x01,
            offset: 0x00,
            value: Buffer.from([value]),
        };
    },
    logicalType: (value: number): NvItem => {
        return {
            id: NvItemsIds.LOGICAL_TYPE,
            len: 0x01,
            offset: 0x00,
            value: Buffer.from([value]),
        };
    },
    zdoDirectCb: (): NvItem => {
        return {
            id: NvItemsIds.ZDO_DIRECT_CB,
            len: 0x01,
            offset: 0x00,
            value: Buffer.from([0x01]),
        };
    },
    tcLinkKey: (): NvItem => {
        return {
            id: NvItemsIds.TCLK_TABLE_START,
            offset: 0x00,
            len: 0x20,
            // ZigBee Alliance Pre-configured TC Link Key - 'ZigBeeAlliance09'
            value: Buffer.from([
                0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0x5a, 0x69, 0x67, 0x42, 0x65, 0x65, 0x41, 0x6c,
                0x6c, 0x69, 0x61, 0x6e, 0x63, 0x65, 0x30, 0x39, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
            ]),
        };
    },
};