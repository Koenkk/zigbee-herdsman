import "regenerator-runtime/runtime";
import {ZStackAdapter} from '../../../src/adapter/z-stack/adapter';
import {DevStates, NvItemsIds, ZnpCommandStatus} from "../../../src/adapter/z-stack/constants/common";
import {Subsystem, Type} from "../../../src/adapter/z-stack/unpi/constants";
import equals from "fast-deep-equal/es6";
import {ZnpVersion} from "../../../src/adapter/z-stack/adapter/tstype";
import * as Structs from "../../../src/adapter/z-stack/structs"
import * as fs from "fs";
import * as path from "path";
import {LoggerStub} from "../../../src/controller/logger-stub";

const waitForResult = (payload, ID = null) => {
    ID = ID || 1;
    return {start: () => {return {promise: payload, ID}}, ID};
};

const networkOptions = {
    panID: 123,
    extendedPanID: [0x00, 0x12, 0x4b, 0x00, 0x09, 0xd6, 0x9f, 0x77],
    channelList: [21],
    networkKey: [1,3,5,7,9,11,13,15,0,2,4,6,8,10,12,13],
    networkKeyDistribute: false,
}

const networkOptionsDefaultExtendedPanId = {
    panID: 123,
    extendedPanID: [0xdd, 0xdd, 0xdd, 0xdd, 0xdd, 0xdd, 0xdd, 0xdd],
    channelList: [21],
    networkKey: [1,3,5,7,9,11,13,15,0,2,4,6,8,10,12,13],
    networkKeyDistribute: false,
}

const networkOptionsMismatched = {
    panID: 124,
    extendedPanID: [0x00, 0x12, 0x4b, 0x00, 0x09, 0xd6, 0x9f, 0x77],
    channelList: [21],
    networkKey: [1,3,5,7,9,11,13,15,0,2,4,6,8,10,12,13],
    networkKeyDistribute: false,
}

const networkOptionsInvalidPanId = {
    panID: 65535,
    extendedPanID: [0x00, 0x12, 0x4b, 0x00, 0x09, 0xd6, 0x9f, 0x77],
    channelList: [21],
    networkKey: [1,3,5,7,9,11,13,15,0,2,4,6,8,10,12,13],
    networkKeyDistribute: false,
}

const serialPortOptions = {
    baudRate: 800,
    rtscts: false,
    path: 'dummy',
};

const backupMatchingConfig = JSON.parse(`
{
    "metadata": {
      "format": "zigpy/open-coordinator-backup",
      "version": 1,
      "source": "zigbee-herdsman@0.13.65",
      "internal": {
        "date": "2021-03-03T19:15:40.524Z",
        "znpVersion": 2
      }
    },
    "stack_specific": {
      "zstack": {
        "tclk_seed": "928a2c479e72a9a53e3b5133fc55021f"
      }
    },
    "coordinator_ieee": "00124b0009d80ba7",
    "pan_id": "007b",
    "extended_pan_id": "00124b0009d69f77",
    "nwk_update_id": 0,
    "security_level": 5,
    "channel": 21,
    "channel_mask": [
      21
    ],
    "network_key": {
      "key": "01030507090b0d0f00020406080a0c0d",
      "sequence_number": 0,
      "frame_counter": 16754
    },
    "devices": [
      {
        "nwk_address": "ddf6",
        "ieee_address": "00124b002226ef87"
      },
      {
        "nwk_address": "c2dc",
        "ieee_address": "04cf8cdf3c79455f",
        "link_key": {
          "key": "0e768569dd935d8e7302e74e7629f13f",
          "rx_counter": 0,
          "tx_counter": 275
        }
      },
      {
        "nwk_address": "740a",
        "ieee_address": "680ae2fffeae5647",
        "link_key": {
          "key": "7c079d02aae015facd7ae9608d4baf56",
          "rx_counter": 0,
          "tx_counter": 275
        }
      },
      {
        "nwk_address": "19fa",
        "ieee_address": "00158d00024fa79b",
        "link_key": {
          "key": "cea550908aa1529ee90eea3c3bdc26fc",
          "rx_counter": 0,
          "tx_counter": 44
        }
      },
      {
        "nwk_address": "6182",
        "ieee_address": "00158d00024f4518",
        "link_key": {
          "key": "267e1e31fcd8171f8acf63459effbca5",
          "rx_counter": 0,
          "tx_counter": 44
        }
      },
      {
        "nwk_address": "4285",
        "ieee_address": "00158d00024f810d",
        "link_key": {
          "key": "33ba1e31fcd8171f9f0b63459effbca5",
          "rx_counter": 0,
          "tx_counter": 44
        }
      }
    ]
  }
`);

const backupNotMatchingConfig = JSON.parse(`
{
    "metadata": {
      "format": "zigpy/open-coordinator-backup",
      "version": 1,
      "source": "zigbee-herdsman@0.13.65",
      "internal": {
        "date": "2021-03-03T19:15:40.524Z",
        "znpVersion": 2
      }
    },
    "stack_specific": {
      "zstack": {
        "tclk_seed": "928a2c479e72a9a53e3b5133fc55021f"
      }
    },
    "coordinator_ieee": "00124b0009d80ba7",
    "pan_id": "007c",
    "extended_pan_id": "00124b0009d69f77",
    "nwk_update_id": 0,
    "security_level": 5,
    "channel": 21,
    "channel_mask": [
      21
    ],
    "network_key": {
      "key": "01030507090b0d0f00020406080a0c0d",
      "sequence_number": 0,
      "frame_counter": 16754
    },
    "devices": [
      {
        "nwk_address": "ddf6",
        "ieee_address": "00124b002226ef87"
      },
      {
        "nwk_address": "c2dc",
        "ieee_address": "04cf8cdf3c79455f",
        "link_key": {
          "key": "0e768569dd935d8e7302e74e7629f13f",
          "rx_counter": 0,
          "tx_counter": 275
        }
      },
      {
        "nwk_address": "740a",
        "ieee_address": "680ae2fffeae5647",
        "link_key": {
          "key": "7c079d02aae015facd7ae9608d4baf56",
          "rx_counter": 0,
          "tx_counter": 275
        }
      },
      {
        "nwk_address": "19fa",
        "ieee_address": "00158d00024fa79b",
        "link_key": {
          "key": "cea550908aa1529ee90eea3c3bdc26fc",
          "rx_counter": 0,
          "tx_counter": 44
        }
      },
      {
        "nwk_address": "6182",
        "ieee_address": "00158d00024f4518",
        "link_key": {
          "key": "267e1e31fcd8171f8acf63459effbca5",
          "rx_counter": 0,
          "tx_counter": 44
        }
      },
      {
        "nwk_address": "4285",
        "ieee_address": "00158d00024f810d",
        "link_key": {
          "key": "33ba1e31fcd8171f9f0b63459effbca5",
          "rx_counter": 0,
          "tx_counter": 44
        }
      }
    ]
  }
`);

const legacyBackup = JSON.parse(`
{
    "adapterType": "zStack",
    "time": "Thu, 04 Mar 2021 10:55:12 GMT",
    "meta": {
        "product": 2
    },
    "data": {
        "ZCD_NV_EXTADDR": {
            "id": 1,
            "offset": 0,
            "osal": true,
            "product": -1,
            "value": [
                167,
                11,
                216,
                9,
                0,
                75,
                18,
                0
            ],
            "len": 8
        },
        "ZCD_NV_NIB": {
            "id": 33,
            "offset": 0,
            "osal": true,
            "product": -1,
            "value": [
                145,
                5,
                2,
                16,
                20,
                16,
                0,
                20,
                0,
                0,
                0,
                1,
                5,
                1,
                143,
                7,
                0,
                2,
                5,
                30,
                0,
                0,
                11,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                123,
                0,
                8,
                0,
                0,
                32,
                0,
                15,
                15,
                4,
                0,
                1,
                0,
                0,
                0,
                1,
                0,
                0,
                0,
                0,
                119,
                159,
                214,
                9,
                0,
                75,
                18,
                0,
                1,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                60,
                3,
                0,
                1,
                120,
                10,
                1,
                0,
                0,
                146,
                235,
                0
            ],
            "len": 110
        },
        "ZCD_NV_PANID": {
            "id": 131,
            "offset": 0,
            "osal": true,
            "product": -1,
            "value": [
                123,
                0
            ],
            "len": 2
        },
        "ZCD_NV_EXTENDED_PAN_ID": {
            "id": 45,
            "offset": 0,
            "osal": true,
            "product": -1,
            "value": [
                221,
                221,
                221,
                221,
                221,
                221,
                221,
                221
            ],
            "len": 8
        },
        "ZCD_NV_NWK_ACTIVE_KEY_INFO": {
            "id": 58,
            "offset": 0,
            "osal": true,
            "product": -1,
            "value": [
                0,
                1,
                3,
                5,
                7,
                9,
                11,
                13,
                15,
                0,
                2,
                4,
                6,
                8,
                10,
                12,
                13
            ],
            "len": 17
        },
        "ZCD_NV_NWK_ALTERN_KEY_INFO": {
            "id": 59,
            "offset": 0,
            "osal": true,
            "product": -1,
            "value": [
                0,
                1,
                3,
                5,
                7,
                9,
                11,
                13,
                15,
                0,
                2,
                4,
                6,
                8,
                10,
                12,
                13
            ],
            "len": 17
        },
        "ZCD_NV_APS_USE_EXT_PANID": {
            "id": 71,
            "offset": 0,
            "osal": true,
            "product": -1,
            "value": [
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0
            ],
            "len": 8
        },
        "ZCD_NV_PRECFGKEY": {
            "id": 98,
            "offset": 0,
            "osal": true,
            "product": -1,
            "value": [
                1,
                3,
                5,
                7,
                9,
                11,
                13,
                15,
                0,
                2,
                4,
                6,
                8,
                10,
                12,
                13
            ],
            "len": 16
        },
        "ZCD_NV_PRECFGKEY_ENABLE": {
            "id": 99,
            "offset": 0,
            "osal": true,
            "product": -1,
            "value": [
                0
            ],
            "len": 1
        },
        "ZCD_NV_CHANLIST": {
            "id": 132,
            "offset": 0,
            "osal": true,
            "product": -1,
            "value": [
                0,
                20,
                0,
                0
            ],
            "len": 4
        },
        "ZCD_NV_LEGACY_TCLK_TABLE_START": {
            "id": 273,
            "product": 2,
            "offset": 0,
            "osal": true,
            "value": [
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                255,
                0,
                0
            ],
            "len": 19
        },
        "ZCD_NV_LEGACY_NWK_SEC_MATERIAL_TABLE_START": {
            "id": 117,
            "product": 2,
            "offset": 0,
            "osal": true,
            "value": [
                83,
                144,
                14,
                0,
                134,
                114,
                56,
                25,
                0,
                75,
                18,
                0
            ],
            "len": 12
        }
    }
}
`);

class ZnpRequestMockBuilder {

    public responders: {subsystem: Subsystem, command: string, exec: (payload: any, handler?: ZnpRequestMockBuilder) => any}[] = [];
    public nvItems: {id: NvItemsIds, value?: Buffer}[] = [];

    constructor() {
        const handleNvRead = (payload, handler) => {
            if (payload.offset !== undefined && payload.offset !== 0) {
                throw new Error("osalNvLength offset not supported");
            }
            const item = handler.nvItems.find(e => e.id === payload.id);
            return { payload: { status: item && item.value ? 0 : 1, value: item && item.value ? item.value : undefined } };
        };
        this.handle(Subsystem.SYS, "osalNvRead", handleNvRead);
        this.handle(Subsystem.SYS, "osalNvReadExt", handleNvRead);

        const handleNvWrite = (payload, handler) => {
            if (payload.offset !== undefined && payload.offset !== 0) {
                throw new Error("osalNvLength offset not supported");
            }
            const item = handler.nvItems.find(e => e.id === payload.id);
            if (item) {
                item.value = payload.value;
                return { payload: { status: 0 } };
            } else {
                return { payload: { status: 1 } };
            }
        };
        this.handle(Subsystem.SYS, "osalNvWrite", handleNvWrite);
        this.handle(Subsystem.SYS, "osalNvWriteExt", handleNvWrite);

        this.handle(Subsystem.SYS, "osalNvItemInit", (payload, handler) => {
            const item = handler.nvItems.find(e => e.id === payload.id);
            if (item) {
                if (item.value && item.value.length !== payload.len) {
                    return { payload: { status: 0x0a } };
                }
                return { payload: { status: 0x00 } };
            } else {
                const item = {
                    id: payload.id,
                    value: payload.initvalue || null
                };
                handler.nvItems.push(item);
                return { payload: { status: 0x09 } };
            }
        });
        this.handle(Subsystem.SYS, "osalNvLength", (payload, handler) => {
            if (payload.offset !== undefined && payload.offset !== 0) {
                throw new Error("osalNvLength offset not supported");
            }
            const item = handler.nvItems.find(e => e.id === payload.id);
            return { payload: { length: item && item.value ? item.value.length : 0 } };
        });
        this.handle(Subsystem.SYS, "osalNvDelete", (payload, handler) => {
            const item = handler.nvItems.find(e => e.id === payload.id);
            if (item) {
                if (item.value && item.value.length !== payload.len) {
                    return { payload: { status: 0x0a } };
                }
                const itemIndex = handler.nvItems.indexOf(item);
                handler.nvItems.splice(itemIndex, 1);
                return { payload: { status: 0x00 } };
            } else {
                return { payload: { status: 0x09 } };
            }
        });
    }

    public handle(subsystem: Subsystem, command: string, exec?: (payload: any, handler?: ZnpRequestMockBuilder) => any) {
        const index = this.responders.findIndex(r => r.subsystem === subsystem && r.command === command);
        if (index > -1) {
            this.responders.splice(index, 1);
        }
        this.responders.push({subsystem, command, exec: exec || (() => ({}))});
        return this;
    }

    public nv(id: NvItemsIds, value?: Buffer) {
        const index = this.nvItems.findIndex(e => e.id === id);
        if (index > -1) {
            this.nvItems.splice(index, 1);
        }
        this.nvItems.push({ id, value: value || null });
        return this;
    }

    public execute(message: { subsystem: Subsystem, command: string, payload: any }) {
        const responder = this.responders.find(r => r.subsystem === message.subsystem && r.command === message.command);
        if (!responder) {
            const msg = `Not implemented - ${Subsystem[message.subsystem]} - ${message.command} - ${JSON.stringify(message.payload)}`;
            console.log(msg);
            throw new Error(msg);
        }
        const response = responder.exec(message.payload, this);
        // console.log(message, response);
        return response;
    }

    public clone(): ZnpRequestMockBuilder {
        const newBuilder = new ZnpRequestMockBuilder();
        newBuilder.responders = this.responders.map(responder => ({ ...responder }));
        newBuilder.nvItems = this.nvItems.map(item => ({ id: item.id, value: Buffer.from(item.value) }));
        return newBuilder;
    }
}

const baseZnpRequestMock = new ZnpRequestMockBuilder()
    .handle(Subsystem.SYS, "version", payload => equals(payload, {}) ? { payload: { product: ZnpVersion.zStack30x } } : undefined)
    .handle(Subsystem.SYS, "ping", () => ({}))
    .handle(Subsystem.SYS, "getExtAddr", () => ({ payload: { extaddress: "0x00124b0009d69f77" } }))
    .handle(Subsystem.ZDO, "extFindGroup", () => ({ payload: { status: 0 }}))
    .handle(Subsystem.ZDO, "extAddGroup", () => ({ payload: { status: 0 }}))
    .handle(Subsystem.UTIL, "getDeviceInfo", () => ({payload: {devicestate: 0x00}}))
    .handle(Subsystem.ZDO, "activeEpReq", () => ({}))
    .handle(Subsystem.AF, "register", () => ({}))
    .handle(Subsystem.SYS, "resetReq", () => ({}))
    .handle(Subsystem.APP_CNF, "bdbSetChannel", () => ({}))
    .handle(Subsystem.APP_CNF, "bdbStartCommissioning", (_, handler) => {
        const nibIndex = handler.nvItems.findIndex(e => e.id === NvItemsIds.NIB);
        if (nibIndex > -1) {
            handler.nvItems.splice(nibIndex, 1);
        }
        handler.nvItems.push({ id: NvItemsIds.NIB, value: Buffer.from("fb050279147900640000000105018f000700020d1e0000001500000000000000000000007b000800000020000f0f0400010000000100000000779fd609004b1200010000000000000000000000000000000000000000000000000000000000000000000000003c0c0001780a0100000006020000", "hex") });
        return {};
    })
    .handle(Subsystem.ZDO, "extNwkInfo", (_, handler) => {
        const nib = Structs.nib(handler.nvItems.find(item => item.id === NvItemsIds.NIB).value);
        return {payload: {panid: nib.nwkPanId, extendedpanid: nib.extendedPANID, channel: nib.nwkLogicalChannel}};
    })
    .handle(Subsystem.ZDO, "startupFromApp", () => ({}))
    .nv(NvItemsIds.CHANLIST, Buffer.from([0, 8, 0, 0]))
    .nv(NvItemsIds.PRECFGKEY, Buffer.alloc(16, 0))
    .nv(NvItemsIds.PRECFGKEYS_ENABLE, Buffer.from([0]))
    .nv(NvItemsIds.NWKKEY, Buffer.alloc(24, 0))
    .nv(NvItemsIds.NWK_ACTIVE_KEY_INFO, Buffer.from("000000000000000000000000000000000000", "hex"))
    .nv(NvItemsIds.NWK_ALTERN_KEY_INFO, Buffer.from("000000000000000000000000000000000000", "hex"))
    .nv(NvItemsIds.ZNP_HAS_CONFIGURED_ZSTACK3, Buffer.from([0x00]))
    .nv(NvItemsIds.NIB, Buffer.from("fb050279147900640000000105018f000700020d1e0000001500000000000000000000000bcd0800000020000f0f0400010000000100000000779fd609004b1200010000000000000000000000000000000000000000000000000000000000000000000000003c0c0001780a0100000006020000", "hex"));

const empty3AlignedRequestMock = baseZnpRequestMock.clone()
    .nv(NvItemsIds.ZNP_HAS_CONFIGURED_ZSTACK3, Buffer.from([0x00]))
    .nv(NvItemsIds.NIB, Buffer.from("fb050279147900640000000105018f000700020d1e000000150000000000000000000000ffff0800000020000f0f0400010000000100000000779fd609004b1200010000000000000000000000000000000000000000000000000000000000000000000000003c0c0001780a0100000006020000", "hex"))
    .nv(NvItemsIds.ADDRMGR, Buffer.from("00ff0000000000000000000000ff0000000000000000000000ff0000000000000000000000ff0000000000000000000000ff0000000000000000000000ff0000000000000000000000ff0000000000000000000000ff0000000000000000000000ff0000000000000000000000ff0000000000000000000000ff0000000000000000000000ff0000000000000000000000ff0000000000000000000000ff0000000000000000000000ff0000000000000000000000ff00000000000000000000", "hex"))
    .nv(NvItemsIds.APS_LINK_KEY_TABLE, Buffer.from("0000feff00000000feff00000000feff00000000feff00000000feff00000000feff00000000feff00000000feff00000000feff00000000feff00000000feff00000000feff00000000feff00000000feff00000000feff00000000feff00000000", "hex"));
    for (let i = 0; i < 4; i++) { empty3AlignedRequestMock.nv(NvItemsIds.LEGACY_NWK_SEC_MATERIAL_TABLE_START + i, Buffer.from("000000000000000000000000", "hex")); }
    for (let i = 0; i < 16; i++) { empty3AlignedRequestMock.nv(NvItemsIds.LEGACY_TCLK_TABLE_START + i, Buffer.from("0000000000000000000000000000000000000000", "hex")); }

const commissioned3AlignedRequestMock = empty3AlignedRequestMock.clone()
    .nv(NvItemsIds.ZNP_HAS_CONFIGURED_ZSTACK3, Buffer.from([0x55]))
    .nv(NvItemsIds.PRECFGKEY, Buffer.from("01030507090b0d0f00020406080a0c0d", "hex"))
    .nv(NvItemsIds.NWK_ACTIVE_KEY_INFO, Buffer.from("0001030507090b0d0f00020406080a0c0d00", "hex"))
    .nv(NvItemsIds.NWK_ALTERN_KEY_INFO, Buffer.from("0001030507090b0d0f00020406080a0c0d00", "hex"))
    .nv(NvItemsIds.NIB, Buffer.from("fb050279147900640000000105018f000700020d1e0000001500000000000000000000007b000800000020000f0f0400010000000100000000779fd609004b1200010000000000000000000000000000000000000000000000000000000000000000000000003c0c0001780a0100000006020000", "hex"));

const commissioned3AlignedConfigMistmachRequestMock = commissioned3AlignedRequestMock.clone()
    .nv(NvItemsIds.NWK_ACTIVE_KEY_INFO, Buffer.from("0001030507090b0d0f00020406080a0c0d00", "hex"))
    .nv(NvItemsIds.NWK_ALTERN_KEY_INFO, Buffer.from("0001030507090b0d0f00020406080a0c0d00", "hex"))
    .nv(NvItemsIds.NIB, Buffer.from("fb050279147900640000000105018f000700020d1e0000001500000000000000000000007e000800000020000f0f0400010000000100000000779fd609004b1200010000000000000000000000000000000000000000000000000000000000000000000000003c0c0001780a0100000006020000", "hex"));

const empty12UnalignedRequestMock = baseZnpRequestMock.clone()
    .handle(Subsystem.SYS, "version", payload => equals(payload, {}) ? { payload: { product: ZnpVersion.zStack12 } } : undefined)
    .handle(Subsystem.SAPI, "readConfiguration", (payload, handler) => {
        if (payload.configid !== NvItemsIds.PRECFGKEY) {
            throw new Error("Only pre-configured key should be read/written using SAPI layer");
        }
        const item = handler.nvItems.find(item => item.id === payload.configid);
        if (item) {
            return { payload: { status: 0, configid: item.id, len: item.value?.length || 0, value: item.value } };
        }
        return { payload: { status: 1 } };
    })
    .handle(Subsystem.SAPI, "writeConfiguration", (payload, handler) => {
        if (payload.configid !== NvItemsIds.PRECFGKEY) {
            throw new Error("Only pre-configured key should be read/written using SAPI layer");
        }
        const item = handler.nvItems.find(item => item.id === payload.configid);
        if (item) {
            item.value = payload.value;
        } else {
            handler.nvItems.push({ id: payload.configid, value: payload.value });
        }
        handler.nv(NvItemsIds.NIB, Buffer.from("fb050279147900640000000105018f0700020d1e000015000000000000000000007b0008000020000f0f0400010000000100000000779fd609004b1200010000000000000000000000000000000000000000000000000000000000000000000000003c0c0001780a010000060200", "hex"));
        return { payload: { status: 0 } };
    })
    .nv(NvItemsIds.ZNP_HAS_CONFIGURED_ZSTACK1, Buffer.from([0x00]));

const commissioned12UnalignedRequestMock = empty12UnalignedRequestMock.clone()
    .nv(NvItemsIds.ZNP_HAS_CONFIGURED_ZSTACK1, Buffer.from([0x55]))
    .nv(NvItemsIds.NIB, Buffer.from("fb050279147900640000000105018f0700020d1e000015000000000000000000007b0008000020000f0f0400010000000100000000779fd609004b1200010000000000000000000000000000000000000000000000000000000000000000000000003c0c0001780a010000060200", "hex"));

let znpReceived;
let znpClose;
const mockZnpRequest = jest.fn().mockReturnValue({payload: {}}).mockImplementation((subsystem: Subsystem, command: string, payload: any, expectedStatus: ZnpCommandStatus) => baseZnpRequestMock.execute({subsystem, command, payload}));
const mockZnpWaitFor = jest.fn();
const mockZnpOpen = jest.fn();
const mockZnpClose = jest.fn();
const mockQueueExecute = jest.fn().mockImplementation(async (func) => await func());
const mocks = [mockZnpOpen, mockZnpRequest, mockZnpClose];

const mockZnpRequestWith = (builder: ZnpRequestMockBuilder) => {
    builder = builder.clone();
    mockZnpRequest.mockImplementation((subsystem: Subsystem, command: string, payload: any, expectedStatus: ZnpCommandStatus) => builder.execute({subsystem, command, payload}));
};

const mockZnpWaitForDefault = () => {
    mockZnpWaitFor.mockImplementation((type, subsystem, command, payload) => {
        const missing = () => {
            const msg = `Not implemented - ${Type[type]} - ${Subsystem[subsystem]} - ${command} - ${JSON.stringify(payload)}`;
            console.log(msg)
            throw new Error(msg);
        }
    
        if (type === Type.AREQ && subsystem === Subsystem.ZDO && command === 'activeEpRsp') {
            return waitForResult({payload: {activeeplist: []}});
        } else if (type === Type.AREQ && subsystem === Subsystem.ZDO && command === 'stateChangeInd') {
            return waitForResult({payload: { state: 9 }});
        } else {
            missing();
        }
    });
};

const mockZnpWaitForStateChangeIndTimeout = () => {
    mockZnpWaitFor.mockImplementation((type, subsystem, command, payload) => {
        const missing = () => {
            const msg = `Not implemented - ${Type[type]} - ${Subsystem[subsystem]} - ${command} - ${JSON.stringify(payload)}`;
            console.log(msg)
            throw new Error(msg);
        }
    
        if (type === Type.AREQ && subsystem === Subsystem.ZDO && command === 'activeEpRsp') {
            return waitForResult({payload: {activeeplist: []}});
        } else if (type === Type.AREQ && subsystem === Subsystem.ZDO && command === 'stateChangeInd') {
            return;
        } else {
            missing();
        }
    });
};

const getRandomArbitrary  = (min, max) => {
    return Math.random() * (max - min) + min;
};

const getTempFile = () => {
    const tempPath = path.resolve('temp');
    if (!fs.existsSync(tempPath)){
        fs.mkdirSync(tempPath);
    }
    return path.join(tempPath, `temp_${getRandomArbitrary(1, 99999999)}`);
};

jest.mock('../../../src/adapter/z-stack/znp/znp', () => {
    return jest.fn().mockImplementation(() => {
        return {
            on: (event, handler) => {
                if (event === 'received') {
                    znpReceived = handler;
                } else if (event === 'close') {
                    znpClose = handler;
                }
            },
            open: mockZnpOpen,
            request: mockZnpRequest,
            waitFor: mockZnpWaitFor,
            close: mockZnpClose,
        };
    });
});

jest.mock('../../../src/utils/queue', () => {
    return jest.fn().mockImplementation(() => {
        return {
            execute: mockQueueExecute,
            count: () => 1,
        };
    });
});

describe("zstack-adapter", () => {
    let adapter: ZStackAdapter;

    beforeEach(() => {
        adapter = new ZStackAdapter(networkOptions, serialPortOptions, "backup.json", {concurrent: 3});
        mockZnpWaitForDefault();
        mocks.forEach((m) => m.mockRestore());
        mockQueueExecute.mockClear();
        mockZnpWaitFor.mockClear();
    });

    it("should commission network with 3.0.x adapter", async () => {
        mockZnpRequestWith(empty3AlignedRequestMock);
        const result = await adapter.start();
        expect(result).toBe("reset");
    });

    it("should commission network with 3.0.x adapter - default extended pan id", async () => {
        mockZnpRequestWith(empty3AlignedRequestMock);
        adapter = new ZStackAdapter(networkOptionsDefaultExtendedPanId, serialPortOptions, "backup.json", {concurrent: 3});
        const result = await adapter.start();
        expect(result).toBe("reset");
    });

    it("should commission with 3.0.x adapter - empty, mismatched config/backup", async () => {
        const backupFile = getTempFile();
        fs.writeFileSync(backupFile, JSON.stringify(backupNotMatchingConfig), "utf8");
        adapter = new ZStackAdapter(networkOptions, serialPortOptions, backupFile, {concurrent: 3});
        mockZnpRequestWith(empty3AlignedRequestMock);
        const result = await adapter.start();
        expect(result).toBe("reset");
    });

    it("should commission with 3.0.x adapter - commissioned, mismatched adapter-config-backup", async () => {
        const backupFile = getTempFile();
        fs.writeFileSync(backupFile, JSON.stringify(backupNotMatchingConfig), "utf8");
        adapter = new ZStackAdapter(networkOptions, serialPortOptions, backupFile, {concurrent: 3});
        mockZnpRequestWith(commissioned3AlignedConfigMistmachRequestMock);
        const result = await adapter.start();
        expect(result).toBe("reset");
    });

    it("should fail to commission network with 3.0.x adapter with invalid pan id 65535", async () => {
        mockZnpRequestWith(empty3AlignedRequestMock);
        adapter = new ZStackAdapter(networkOptionsInvalidPanId, serialPortOptions, "backup.json", {concurrent: 3});
        await expect(adapter.start()).rejects.toThrowError("network commissioning failed - cannot use pan id 65535");
    });

    it("should fail to commission network with 3.0.x adapter when bdb commissioning times out", async () => {
        mockZnpWaitForStateChangeIndTimeout();
        mockZnpRequestWith(empty3AlignedRequestMock);
        adapter = new ZStackAdapter(networkOptions, serialPortOptions, "backup.json", {concurrent: 3});
        await expect(adapter.start()).rejects.toThrowError("network commissioning timed out - most likely network with the same panId or extendedPanId already exists nearby");
    });

    it("should fail to commission network with 3.0.x adapter when nib fails to settle", async () => {
        mockZnpRequestWith(
            empty3AlignedRequestMock.clone()
                .handle(Subsystem.APP_CNF, "bdbStartCommissioning", () => ({}))
        );
        jest.setTimeout(35000);
        adapter = new ZStackAdapter(networkOptions, serialPortOptions, "backup.json", {concurrent: 3});
        const promise = adapter.start();
        await expect(promise).rejects.toThrowError("network commissioning failed - timed out waiting for nib to settle");
    });

    it("should fail to commission network with 3.0.x adapter when nib reports different pan id", async () => {
        mockZnpRequestWith(
            empty3AlignedRequestMock.clone()
                .handle(Subsystem.APP_CNF, "bdbStartCommissioning", (_, handler) => {
                    const nibIndex = handler.nvItems.findIndex(e => e.id === NvItemsIds.NIB);
                    if (nibIndex > -1) {
                        handler.nvItems.splice(nibIndex, 1);
                    }
                    handler.nvItems.push({ id: NvItemsIds.NIB, value: Buffer.from("fb050279147900640000000105018f000700020d1e0000001500000000000000000000007c000800000020000f0f0400010000000100000000779fd609004b1200010000000000000000000000000000000000000000000000000000000000000000000000003c0c0001780a0100000006020000", "hex") });
                    return {};
                })
        );
        adapter = new ZStackAdapter(networkOptions, serialPortOptions, "backup.json", {concurrent: 3});
        const promise = adapter.start();
        await expect(promise).rejects.toThrowError("network commissioning failed - panId collision detected (expected=123, actual=124)");
    });

    it("should start network with 3.0.x adapter", async () => {
        mockZnpRequestWith(commissioned3AlignedRequestMock);
        const result = await adapter.start();
        expect(result).toBe("resumed");
    });

    it("should restore unified backup with 3.0.x adapter - empty", async () => {
        const backupFile = getTempFile();
        fs.writeFileSync(backupFile, JSON.stringify(backupMatchingConfig), "utf8");
        adapter = new ZStackAdapter(networkOptions, serialPortOptions, backupFile, {concurrent: 3});
        mockZnpRequestWith(empty3AlignedRequestMock);
        const result = await adapter.start();
        expect(result).toBe("restored");
    });

    it("should restore legacy backup with 3.0.x adapter - empty", async () => {
        const backupFile = getTempFile();
        fs.writeFileSync(backupFile, JSON.stringify(legacyBackup), "utf8");
        adapter = new ZStackAdapter(networkOptions, serialPortOptions, backupFile, {concurrent: 3});
        mockZnpRequestWith(empty3AlignedRequestMock);
        const result = await adapter.start();
        expect(result).toBe("restored");
    });

    it("should fail to restore legacy backup with 3.0.x adapter - missing NIB", async () => {
        const backupFile = getTempFile();
        const backup = JSON.parse(JSON.stringify(legacyBackup));
        delete backup.data.ZCD_NV_NIB;
        fs.writeFileSync(backupFile, JSON.stringify(backup), "utf8");
        adapter = new ZStackAdapter(networkOptions, serialPortOptions, backupFile, {concurrent: 3});
        mockZnpRequestWith(empty3AlignedRequestMock);
        await expect(adapter.start()).rejects.toThrowError("Backup corrupted - missing NIB");
    });

    it("should fail to restore legacy backup with 3.0.x adapter - missing active key info", async () => {
        const backupFile = getTempFile();
        const backup = JSON.parse(JSON.stringify(legacyBackup));
        delete backup.data.ZCD_NV_NWK_ACTIVE_KEY_INFO;
        fs.writeFileSync(backupFile, JSON.stringify(backup), "utf8");
        adapter = new ZStackAdapter(networkOptions, serialPortOptions, backupFile, {concurrent: 3});
        mockZnpRequestWith(empty3AlignedRequestMock);
        await expect(adapter.start()).rejects.toThrowError("Backup corrupted - missing active key info");
    });

    it("should fail to restore legacy backup with 3.0.x adapter - missing pre-configured key enabled", async () => {
        const backupFile = getTempFile();
        const backup = JSON.parse(JSON.stringify(legacyBackup));
        delete backup.data.ZCD_NV_PRECFGKEY_ENABLE;
        fs.writeFileSync(backupFile, JSON.stringify(backup), "utf8");
        adapter = new ZStackAdapter(networkOptions, serialPortOptions, backupFile, {concurrent: 3});
        mockZnpRequestWith(empty3AlignedRequestMock);
        await expect(adapter.start()).rejects.toThrowError("Backup corrupted - missing pre-configured key enable attribute");
    });

    it("should fail to restore legacy backup with 3.0.x adapter - pre-configured key enabled", async () => {
        const backupFile = getTempFile();
        const backup = JSON.parse(JSON.stringify(legacyBackup));
        delete backup.data.ZCD_NV_EX_NWK_SEC_MATERIAL_TABLE;
        delete backup.data.ZCD_NV_LEGACY_NWK_SEC_MATERIAL_TABLE_START;
        fs.writeFileSync(backupFile, JSON.stringify(backup), "utf8");
        adapter = new ZStackAdapter(networkOptions, serialPortOptions, backupFile, {concurrent: 3});
        mockZnpRequestWith(empty3AlignedRequestMock);
        await expect(adapter.start()).rejects.toThrowError("Backup corrupted - missing network security material table");
    });

    it("should fail to restore legacy backup with 3.0.x adapter - missing adapter ieee address", async () => {
        const backupFile = getTempFile();
        const backup = JSON.parse(JSON.stringify(legacyBackup));
        delete backup.data.ZCD_NV_EXTADDR;
        fs.writeFileSync(backupFile, JSON.stringify(backup), "utf8");
        adapter = new ZStackAdapter(networkOptions, serialPortOptions, backupFile, {concurrent: 3});
        mockZnpRequestWith(empty3AlignedRequestMock);
        await expect(adapter.start()).rejects.toThrowError("Backup corrupted - missing adapter IEEE address NV entry");
    });

    it("should start with 3.0.x adapter - commissioned, config-adapter mismatch", async () => {
        const backupFile = getTempFile();
        fs.writeFileSync(backupFile, JSON.stringify(backupMatchingConfig), "utf8");

        const mockLoggerDebug = jest.fn();
        const mockLoggerInfo = jest.fn();
        const mockLoggerWarn = jest.fn();
        const mockLoggerError = jest.fn();
        const mockLogger: LoggerStub = {
            debug: mockLoggerDebug,
            info: mockLoggerInfo,
            warn: mockLoggerWarn,
            error: mockLoggerError
        };

        adapter = new ZStackAdapter(networkOptionsMismatched, serialPortOptions, backupFile, {concurrent: 3}, mockLogger);
        mockZnpRequestWith(commissioned3AlignedRequestMock);
        const result = await adapter.start();
        expect(result).toBe("resumed");
        expect(mockLoggerWarn.mock.calls[0][0]).toBe("Configuration is not consistent with adapter state/backup!");
        expect(mockLoggerWarn.mock.calls[1][0]).toBe("- PAN ID: configured=124, adapter=123");
        expect(mockLoggerWarn.mock.calls[2][0]).toBe("- Extended PAN ID: configured=00124b0009d69f77, adapter=00124b0009d69f77");
        expect(mockLoggerWarn.mock.calls[3][0]).toBe("- Network Key: configured=01030507090b0d0f00020406080a0c0d, adapter=01030507090b0d0f00020406080a0c0d");
        expect(mockLoggerWarn.mock.calls[4][0]).toBe("- Channel List: configured=21, adapter=21");
        expect(mockLoggerWarn.mock.calls[5][0]).toBe("Please update configuration to prevent further issues.");
        expect(mockLoggerWarn.mock.calls[6][0]).toMatch(`If you wish to re\-commission your network, please remove coordinator backup at ${backupFile}`);
        expect(mockLoggerWarn.mock.calls[7][0]).toBe("Re-commissioning your network will require re-pairing of all devices!");
    });

    it("should restore unified backup with 3.0.x adapter - commissioned, mismatched adapter-config, matching config-backup", async () => {
        const backupFile = getTempFile();
        fs.writeFileSync(backupFile, JSON.stringify(backupMatchingConfig), "utf8");
        adapter = new ZStackAdapter(networkOptions, serialPortOptions, backupFile, {concurrent: 3});
        mockZnpRequestWith(commissioned3AlignedConfigMistmachRequestMock);
        const result = await adapter.start();
        expect(result).toBe("restored");
    });

    it("should start network with 3.0.x adapter - resume in coordinator mode", async () => {
        mockZnpRequestWith(
            commissioned3AlignedRequestMock.clone()
                .handle(Subsystem.UTIL, "getDeviceInfo", () => ({payload: {devicestate: DevStates.ZB_COORD}}))
        );
        mockZnpWaitFor.mockImplementation((type, subsystem, command, payload) => {
            const missing = () => {
                const msg = `Not implemented - ${Type[type]} - ${Subsystem[subsystem]} - ${command} - ${JSON.stringify(payload)}`;
                console.log(msg)
                throw new Error(msg);
            }
        
            if (type === Type.AREQ && subsystem === Subsystem.ZDO && command === 'activeEpRsp') {
                return waitForResult({payload: {activeeplist: [1, 2, 3]}});
            } else if (type === Type.AREQ && subsystem === Subsystem.ZDO && command === 'stateChangeInd') {
                return waitForResult({payload: { state: 9 }});
            } else {
                missing();
            }
        });
        const result = await adapter.start();
        expect(result).toBe("resumed");
    });

    it("should start network with 3.0.x adapter - resume in coordinator mode, extGroupFind failed", async () => {
        mockZnpRequestWith(
            commissioned3AlignedRequestMock.clone()
                .handle(Subsystem.UTIL, "getDeviceInfo", () => ({payload: {devicestate: DevStates.ZB_COORD}}))
                .handle(Subsystem.ZDO, "extFindGroup", () => ({ payload: { status: 1 }}))
        );
        const result = await adapter.start();
        expect(result).toBe("resumed");
    });

    it("should commission network with 1.2 adapter", async () => {
        mockZnpRequestWith(empty12UnalignedRequestMock);
        const result = await adapter.start();
        expect(result).toBe("restored");
    });

    it("should reset network with 1.2 adapter", async () => {
        mockZnpRequestWith(commissioned12UnalignedRequestMock);
        const result = await adapter.start();
        expect(result).toBe("reset");
    });
});
