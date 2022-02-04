import "regenerator-runtime/runtime";
import {Znp} from '../../../src/adapter/z-stack/znp';
import {ZStackAdapter} from '../../../src/adapter/z-stack/adapter';
import {DevStates, NvItemsIds, NvSystemIds, ZnpCommandStatus} from "../../../src/adapter/z-stack/constants/common";
import {Subsystem, Type} from "../../../src/adapter/z-stack/unpi/constants";
import equals from "fast-deep-equal/es6";
import {ZnpVersion} from "../../../src/adapter/z-stack/adapter/tstype";
import * as Structs from "../../../src/adapter/z-stack/structs"
import * as fs from "fs";
import * as path from "path";
import {LoggerStub} from "../../../src/controller/logger-stub";
import * as Zcl from '../../../src/zcl';
import * as Constants from '../../../src/adapter/z-stack/constants';
import {ZclDataPayload} from "../../../src/adapter/events";
import {UnifiedBackupStorage} from "../../../src/models";
import {ZnpAdapterManager} from "../../../src/adapter/z-stack/adapter/manager";

const deepClone = (obj) => JSON.parse(JSON.stringify(obj));
const mockSetTimeout = () => setTimeout = jest.fn().mockImplementation((r) => r());

jest.mock('../../../src/utils/wait', () => {
    return jest.fn();
});

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
        "is_child": false,
        "link_key": {
          "key": "55ba1e31fcd8171f9f0b63459effbca5",
          "rx_counter": 0,
          "tx_counter": 44
        }
      },
      {
        "nwk_address": "4286",
        "ieee_address": "00158d00024f810e",
        "is_child": true,
        "link_key": {
          "key": "55ba1e31fcd8171fee0b63459effeea5",
          "rx_counter": 24,
          "tx_counter": 91
        }
      }
    ]
  }
`);

const backupMatchingConfig12 = JSON.parse(`
{
    "metadata": {
      "format": "zigpy/open-coordinator-backup",
      "version": 1,
      "source": "zigbee-herdsman@0.13.65",
      "internal": {
        "date": "2021-03-03T19:15:40.524Z",
        "znpVersion": 0
      }
    },
    "stack_specific": {
      "zstack": {}
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
      "frame_counter": 0
    },
    "devices": [
      {
        "nwk_address": "ddf6",
        "ieee_address": "00124b002226ef87"
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
          "key": "55ba1e31fcd8171f9f0b63459effbca5",
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
    public nvExtendedItems: {sysId: NvSystemIds, id: NvItemsIds, subId: number, value?: Buffer}[] = [];

    constructor() {
        const handleOsalNvRead = (payload, handler) => {
            if (payload.offset !== undefined && payload.offset !== 0) {
                throw new Error("osalNvLength offset not supported");
            }
            const item = handler.nvItems.find(e => e.id === payload.id);
            return { payload: { status: item && item.value ? 0 : 1, value: item && item.value ? item.value : undefined } };
        };
        this.handle(Subsystem.SYS, "osalNvRead", handleOsalNvRead);
        this.handle(Subsystem.SYS, "osalNvReadExt", handleOsalNvRead);

        const handleOsalNvWrite = (payload, handler) => {
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
        this.handle(Subsystem.SYS, "osalNvWrite", handleOsalNvWrite);
        this.handle(Subsystem.SYS, "osalNvWriteExt", handleOsalNvWrite);

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

        this.handle(Subsystem.SYS, "nvRead", (payload, handler: ZnpRequestMockBuilder) => {
            if (payload.offset !== undefined && payload.offset !== 0) {
                throw new Error("nvRead offset not supported");
            }
            const item = handler.nvExtendedItems.find(e => e.sysId === payload.sysid && e.id === payload.itemid && e.subId === payload.subid);
            return { payload: { status: item && item.value ? 0 : 1, value: item && item.value ? item.value : undefined, len: item?.value && item.value.length || undefined } };
        });

        this.handle(Subsystem.SYS, "nvWrite", (payload, handler: ZnpRequestMockBuilder) => {
            if (payload.offset !== undefined && payload.offset !== 0) {
                throw new Error("nwWrite offset not supported");
            }
            const item = handler.nvExtendedItems.find(e => e.sysId === payload.sysid && e.id === payload.itemid && e.subId === payload.subid);
            if (item) {
                item.value = payload.value;
                return { payload: { status: 0 } };
            } else {
                return { payload: { status: 1 } };
            }
        });

        this.handle(Subsystem.SYS, "nvCreate", (payload, handler: ZnpRequestMockBuilder) => {
            const item = handler.nvExtendedItems.find(e => e.sysId === payload.sysid && e.id === payload.itemid && e.subId === payload.subid);
            if (item) {
                if (item.value && item.value.length !== payload.len) {
                    return { payload: { status: 0x0a } };
                }
                return { payload: { status: 0x00 } };
            } else {
                const item = {
                    sysId: payload.sysid,
                    id: payload.itemid,
                    subId: payload.subid,
                    value: null
                };
                handler.nvExtendedItems.push(item);
                return { payload: { status: 0x09 } };
            }
        });
        this.handle(Subsystem.SYS, "nvLength", (payload, handler) => {
            if (payload.offset !== undefined && payload.offset !== 0) {
                throw new Error("nvLength offset not supported");
            }
            const item = handler.nvExtendedItems.find(e => e.sysId === payload.sysid && e.id === payload.itemid && e.subId === payload.subid);
            return { payload: { len: item && item.value ? item.value.length : 0 } };
        });
        this.handle(Subsystem.SYS, "nvDelete", (payload, handler) => {
            const item = handler.nvExtendedItems.find(e => e.sysId === payload.sysid && e.id === payload.itemid && e.subId === payload.subid);
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
        if (value){
            this.nvItems.push({ id, value: value || null });
        }
        return this;
    }

    public nvExtended(sysId: NvSystemIds, id: NvItemsIds, subId: number, value?: Buffer) {
        const index = this.nvExtendedItems.findIndex(e => e.sysId === sysId && e.id === id && e.subId === subId);
        if (index > -1) {
            this.nvExtendedItems.splice(index, 1);
        }
        if (value){
            this.nvExtendedItems.push({ sysId, id, subId, value: value || null });
        }
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
        return response;
    }

    public clone(): ZnpRequestMockBuilder {
        const newBuilder = new ZnpRequestMockBuilder();
        newBuilder.responders = this.responders.map(responder => ({ ...responder }));
        newBuilder.nvItems = this.nvItems.map(item => ({ ...item, value: Buffer.from(item.value) }));
        newBuilder.nvExtendedItems = this.nvExtendedItems.map(item => ({ ...item, value: Buffer.from(item.value) }));
        return newBuilder;
    }
}

const baseZnpRequestMock = new ZnpRequestMockBuilder()
    .handle(Subsystem.SYS, "version", payload => equals(payload, {}) ? { payload: { product: ZnpVersion.zStack30x, revision: 20201026 } } : undefined)
    .handle(Subsystem.SYS, "ping", () => ({}))
    .handle(Subsystem.SYS, "resetReq", () => ({}))
    .handle(Subsystem.SYS, "getExtAddr", () => ({ payload: { extaddress: "0x00124b0009d69f77" } }))
    .handle(Subsystem.SYS, "stackTune", () => ({}))
    .handle(Subsystem.ZDO, "extFindGroup", () => ({ payload: { status: 0 }}))
    .handle(Subsystem.ZDO, "extAddGroup", () => ({ payload: { status: 0 }}))
    .handle(Subsystem.UTIL, "getDeviceInfo", () => ({payload: {devicestate: 0x00, ieeeaddr: "0x00124b0009d80ba7"}}))
    .handle(Subsystem.ZDO, "activeEpReq", () => ({}))
    .handle(Subsystem.ZDO, "simpleDescReq", () => ({}))
    .handle(Subsystem.ZDO, "mgmtPermitJoinReq", () => ({}))
    .handle(Subsystem.ZDO, "nodeDescReq", () => ({}))
    .handle(Subsystem.ZDO, "bindReq", () => ({}))
    .handle(Subsystem.ZDO, "unbindReq", () => ({}))
    .handle(Subsystem.ZDO, "mgmtLeaveReq", () => ({}))
    .handle(Subsystem.ZDO, "mgmtLqiReq", payload => {
        lastStartIndex = payload.startindex;
        return {};
    })
    .handle(Subsystem.ZDO, "mgmtRtgReq", payload => {
        lastStartIndex = payload.startindex;
        return {};
    })
    .handle(Subsystem.AF, "interPanCtl", () => ({}))
    .handle(Subsystem.ZDO, "extRouteDisc", () => ({}))
    .handle(Subsystem.ZDO, "nwkAddrReq", () => ({}))
    .handle(Subsystem.UTIL, "assocRemove", () => ({payload: {}}))
    .handle(Subsystem.UTIL, "assocGetWithAddress", () => ({payload: {noderelation: assocGetWithAddressNodeRelation}}))
    .handle(Subsystem.UTIL, "assocAdd", () => ({payload: {}}))
    .handle(Subsystem.UTIL, "ledControl", () => ({}))
    .handle(Subsystem.AF, "register", () => ({}))
    .handle(Subsystem.AF, "dataRequest", () => {
        if (dataRequestCode !== 0) {
            throw new Error(`Data request failed with code '${dataRequestCode}'`);
        }
        return {};
    })
    .handle(Subsystem.AF, "dataRequestExt", () => {
        if (dataRequestExtCode !== 0) {
            throw new Error(`Data request failed with code '${dataRequestExtCode}'`);
        }
        return {};
    })
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
        return {payload: {panid: nib.nwkPanId, extendedpanid: `0x${nib.extendedPANID.toString("hex")}`, channel: nib.nwkLogicalChannel}};
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

const empty3UnalignedRequestMock = baseZnpRequestMock.clone()
    .handle(Subsystem.APP_CNF, "bdbStartCommissioning", (_, handler) => {
        const nibIndex = handler.nvItems.findIndex(e => e.id === NvItemsIds.NIB);
        if (nibIndex > -1) {
            handler.nvItems.splice(nibIndex, 1);
        }
        handler.nvItems.push({ id: NvItemsIds.NIB, value: Buffer.from("fb050279147900640000000105018f0700020d1e000015000000000000000000007b0008000020000f0f0400010000000100000000779fd609004b1200010000000000000000000000000000000000000000000000000000000000000000000000003c0c0001780a010000060200", "hex") });
        return {};
    })
    .nv(NvItemsIds.NWKKEY, Buffer.alloc(21, 0))
    .nv(NvItemsIds.ZNP_HAS_CONFIGURED_ZSTACK3, Buffer.from([0x00]))
    .nv(NvItemsIds.NIB, Buffer.from("fb050279147900640000000105018f0700020d1e00001500000000000000000000ffff08000020000f0f0400010000000100000000779fd609004b1200010000000000000000000000000000000000000000000000000000000000000000000000003c0c0001780a010000060200", "hex"))
    .nv(NvItemsIds.ADDRMGR, Buffer.from("0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000", "hex"))
    .nv(NvItemsIds.APS_LINK_KEY_TABLE, Buffer.from("0000feff000000feff000000feff000000feff000000feff000000feff000000feff000000feff000000feff000000feff000000feff000000feff000000feff000000feff000000feff000000feff000000", "hex"));
    for (let i = 0; i < 4; i++) { empty3UnalignedRequestMock.nv(NvItemsIds.LEGACY_NWK_SEC_MATERIAL_TABLE_START + i, Buffer.from("000000000000000000000000", "hex")); }
    for (let i = 0; i < 16; i++) { empty3UnalignedRequestMock.nv(NvItemsIds.LEGACY_TCLK_TABLE_START + i, Buffer.from("00000000000000000000000000000000000000", "hex")); }
    for (let i = 0; i < 16; i++) { empty3UnalignedRequestMock.nv(NvItemsIds.APS_LINK_KEY_DATA_START + i, Buffer.from("000000000000000000000000000000000000000000000000", "hex")); }


const empty3AlignedRequestMock = baseZnpRequestMock.clone()
    .nv(NvItemsIds.ZNP_HAS_CONFIGURED_ZSTACK3, Buffer.from([0x00]))
    .nv(NvItemsIds.NIB, Buffer.from("fb050279147900640000000105018f000700020d1e000000150000000000000000000000ffff0800000020000f0f0400010000000100000000779fd609004b1200010000000000000000000000000000000000000000000000000000000000000000000000003c0c0001780a0100000006020000", "hex"))
    .nv(NvItemsIds.ADDRMGR, Buffer.from("00ff0000000000000000000000ff0000000000000000000000ff0000000000000000000000ff0000000000000000000000ff0000000000000000000000ff0000000000000000000000ff0000000000000000000000ff0000000000000000000000ff0000000000000000000000ff0000000000000000000000ff0000000000000000000000ff0000000000000000000000ff0000000000000000000000ff0000000000000000000000ff0000000000000000000000ff00000000000000000000", "hex"))
    .nv(NvItemsIds.APS_LINK_KEY_TABLE, Buffer.from("0000feff00000000feff00000000feff00000000feff00000000feff00000000feff00000000feff00000000feff00000000feff00000000feff00000000feff00000000feff00000000feff00000000feff00000000feff00000000feff00000000", "hex"));
    for (let i = 0; i < 4; i++) { empty3AlignedRequestMock.nv(NvItemsIds.LEGACY_NWK_SEC_MATERIAL_TABLE_START + i, Buffer.from("000000000000000000000000", "hex")); }
    for (let i = 0; i < 16; i++) { empty3AlignedRequestMock.nv(NvItemsIds.LEGACY_TCLK_TABLE_START + i, Buffer.from("0000000000000000000000000000000000000000", "hex")); }
    for (let i = 0; i < 16; i++) { empty3AlignedRequestMock.nv(NvItemsIds.APS_LINK_KEY_DATA_START + i, Buffer.from("000000000000000000000000000000000000000000000000", "hex")); }

const commissioned3AlignedRequestMock = empty3AlignedRequestMock.clone()
    .nv(NvItemsIds.ZNP_HAS_CONFIGURED_ZSTACK3, Buffer.from([0x55]))
    .nv(NvItemsIds.PRECFGKEY, Buffer.from("01030507090b0d0f00020406080a0c0d", "hex"))
    .nv(NvItemsIds.NWK_ACTIVE_KEY_INFO, Buffer.from("0001030507090b0d0f00020406080a0c0d00", "hex"))
    .nv(NvItemsIds.NWK_ALTERN_KEY_INFO, Buffer.from("0001030507090b0d0f00020406080a0c0d00", "hex"))
    .nv(NvItemsIds.NIB, Buffer.from("fb050279147900640000000105018f000700020d1e0000001500000000000000000000007b000800000020000f0f0400010000000100000000779fd609004b1200010000000000000000000000000000000000000000000000000000000000000000000000003c0c0001780a0100000006020000", "hex"))
    .nv(NvItemsIds.ADDRMGR, Buffer.from("01ff4f3a080000000000000000ff0000000000000000000000ff0000000000000000000000ff0000000000000000000000ff0000000000000000000000ff0000000000000000000000ff0000000000000000000000ff0000000000000000000000ff0000000000000000000000ff0000000000000000000000ff0000000000000000000000ff0000000000000000000000ff0000000000000000000000ff0000000000000000000000ff0000000000000000000000ff00000000000000000000", "hex"));

const commissioned3AlignedConfigMistmachRequestMock = commissioned3AlignedRequestMock.clone()
    .nv(NvItemsIds.NWK_ACTIVE_KEY_INFO, Buffer.from("0001030507090b0d0f00020406080a0c0d00", "hex"))
    .nv(NvItemsIds.NWK_ALTERN_KEY_INFO, Buffer.from("0001030507090b0d0f00020406080a0c0d00", "hex"))
    .nv(NvItemsIds.NIB, Buffer.from("fb050279147900640000000105018f000700020d1e0000001500000000000000000000007e000800000020000f0f0400010000000100000000779fd609004b1200010000000000000000000000000000000000000000000000000000000000000000000000003c0c0001780a0100000006020000", "hex"));

const empty3x0AlignedRequestMock = baseZnpRequestMock.clone()
    .handle(Subsystem.SYS, "version", payload => equals(payload, {}) ? { payload: { product: ZnpVersion.zStack3x0, revision: 20210430 } } : undefined)
    .nv(NvItemsIds.ZNP_HAS_CONFIGURED_ZSTACK3, Buffer.from([0x00]))
    .nv(NvItemsIds.NIB, Buffer.from("fb050279147900640000000105018f000700020d1e000000150000000000000000000000ffff0800000020000f0f0400010000000100000000779fd609004b1200010000000000000000000000000000000000000000000000000000000000000000000000003c0c0001780a0100000006020000", "hex"))
    .nv(NvItemsIds.APS_LINK_KEY_TABLE, Buffer.from("0000feff00000000feff00000000feff00000000feff00000000feff00000000feff00000000feff00000000feff00000000feff00000000feff00000000feff00000000feff00000000feff00000000feff00000000feff00000000feff00000000", "hex"));
    for (let i = 0; i < 16; i++) { empty3x0AlignedRequestMock.nvExtended(NvSystemIds.ZSTACK, NvItemsIds.ZCD_NV_EX_ADDRMGR, i, Buffer.from("00ff00000000000000000000", "hex")); }
    for (let i = 0; i < 4; i++) { empty3x0AlignedRequestMock.nvExtended(NvSystemIds.ZSTACK, NvItemsIds.EX_NWK_SEC_MATERIAL_TABLE, i, Buffer.from("000000000000000000000000", "hex")); }
    for (let i = 0; i < 16; i++) { empty3x0AlignedRequestMock.nvExtended(NvSystemIds.ZSTACK, NvItemsIds.EX_TCLK_TABLE, i, Buffer.from("0000000000000000000000000000000000000000", "hex")); }
    for (let i = 0; i < 16; i++) { empty3x0AlignedRequestMock.nvExtended(NvSystemIds.ZSTACK, NvItemsIds.ZCD_NV_EX_APS_KEY_DATA_TABLE, i, Buffer.from("000000000000000000000000000000000000000000000000", "hex")); }

const commissioned3x0AlignedRequestMock = empty3x0AlignedRequestMock.clone()
    .nv(NvItemsIds.ZNP_HAS_CONFIGURED_ZSTACK3, Buffer.from([0x55]))
    .nv(NvItemsIds.PRECFGKEY, Buffer.from("01030507090b0d0f00020406080a0c0d", "hex"))
    .nv(NvItemsIds.NWK_ACTIVE_KEY_INFO, Buffer.from("0001030507090b0d0f00020406080a0c0d00", "hex"))
    .nv(NvItemsIds.NWK_ALTERN_KEY_INFO, Buffer.from("0001030507090b0d0f00020406080a0c0d00", "hex"))
    .nv(NvItemsIds.NIB, Buffer.from("fb050279147900640000000105018f000700020d1e0000001500000000000000000000007b000800000020000f0f0400010000000100000000779fd609004b1200010000000000000000000000000000000000000000000000000000000000000000000000003c0c0001780a0100000006020000", "hex"))
    .nvExtended(NvSystemIds.ZSTACK, NvItemsIds.ZCD_NV_EX_ADDRMGR, 0, Buffer.from("01ff4f3a0800000000000000", "hex"));

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
    .nv(NvItemsIds.PRECFGKEY, Buffer.from("01030507090b0d0f00020406080a0c0d", "hex"))
    .nv(NvItemsIds.NIB, Buffer.from("fb050279147900640000000105018f0700020d1e000015000000000000000000007b0008000020000f0f0400010000000100000000779fd609004b1200010000000000000000000000000000000000000000000000000000000000000000000000003c0c0001780a010000060200", "hex"));

const commissioned12UnalignedMismatchRequestMock = commissioned12UnalignedRequestMock.clone()
    .nv(NvItemsIds.PRECFGKEY, Buffer.from("aabb0507090b0d0f00020406080a0c0d", "hex"));

const mockZnpRequest = jest.fn().mockReturnValue(new Promise((resolve) => resolve({payload: {}}))).mockImplementation((subsystem: Subsystem, command: string, payload: any, expectedStatus: ZnpCommandStatus) => new Promise((resolve) => resolve(baseZnpRequestMock.execute({subsystem, command, payload}))));
const mockZnpWaitFor = jest.fn();
const mockZnpOpen = jest.fn();
const mockZnpClose = jest.fn();
const mockQueueExecute = jest.fn().mockImplementation(async (func) => await func());
const mocks = [mockZnpOpen, mockZnpRequest, mockZnpClose];

const mockZnpRequestWith = (builder: ZnpRequestMockBuilder) => {
    builder = builder.clone();
    mockZnpRequest.mockImplementation((subsystem: Subsystem, command: string, payload: any, expectedStatus: ZnpCommandStatus) => new Promise((resolve) => resolve(builder.execute({subsystem, command, payload}))));
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

const basicMocks = () => {
    mockZnpRequestWith(commissioned3x0AlignedRequestMock);
    mockZnpWaitFor.mockImplementation((type, subsystem, command, payload) => {
        const missing = () => {
            const msg = `Not implemented - ${Type[type]} - ${Subsystem[subsystem]} - ${command} - ${JSON.stringify(payload)}`;
            console.log(msg)
            throw new Error(msg);
        }

        if (type === Type.AREQ && subsystem === Subsystem.ZDO && command === 'activeEpRsp') {
            return waitForResult({payload: {activeeplist: [1, 2, 3, 4, 5, 6, 8, 10, 11, 110, 12, 13, 47, 242]}});
        } else if (type === Type.AREQ && subsystem === Subsystem.ZDO && command === 'stateChangeInd') {
            return waitForResult({payload: {}});
        } else if (type === Type.AREQ && subsystem === Subsystem.ZDO && command === 'simpleDescRsp') {
            if (equals(payload, {endpoint: 1})) {
                return waitForResult({payload: {endpoint: 1, profileid: 123, deviceid: 5, inclusterlist: [1], outclusterlist: [2]}});
            } else if (equals(payload, {endpoint: 99})) {
                return waitForResult({payload: {endpoint: 99, profileid: 123, deviceid: 5, inclusterlist: [1], outclusterlist: [2]}});
            } else {
                return waitForResult({payload: {endpoint: payload.endpoint, profileid: 124, deviceid: 7, inclusterlist: [8], outclusterlist: [9]}});
            }
        } else if (type === Type.AREQ && subsystem === Subsystem.ZDO && command === 'nodeDescRsp') {
            if (nodeDescRspErrorOnce) {
                nodeDescRspErrorOnce = false;
                return {start: () => {return {promise: new Promise((resolve, reject) => {reject('timeout after xx')})}}, ID: 89};
            }

            return waitForResult({payload: {manufacturercode: payload.nwkaddr * 2, logicaltype_cmplxdescavai_userdescavai: payload.nwkaddr - 1}});
        } else if (type === Type.AREQ && subsystem === Subsystem.AF && command === 'dataConfirm') {
            const status = dataConfirmCode;
            if (dataConfirmCodeReset) {
                dataConfirmCode = 0;
            }

            if (status === 9999) {
                return {start: () => {return {promise: new Promise((resolve, reject) => {reject('timeout after xx')})}}, ID: 99};
            } else {
                return waitForResult({payload: {status}}, 99);
            }
        } else if (type === Type.AREQ && subsystem === Subsystem.ZDO && command === 'mgmtLqiRsp' && equals(payload, {srcaddr: 203})) {
            if (lastStartIndex === 0) {
                return waitForResult({payload: {status: 0, neighbortableentries: 5, neighborlqilist: [{lqi: 10, nwkAddr: 2, extAddr: 3, relationship: 3, depth: 1}, {lqi: 15, nwkAddr: 3, extAddr: 4, relationship: 2, depth: 5}]}});
            } else if (lastStartIndex === 2) {
                return waitForResult({payload: {status: 0, neighbortableentries: 5, neighborlqilist: [{lqi: 10, nwkAddr: 5, extAddr: 6, relationship: 3, depth: 1}, {lqi: 15, nwkAddr: 7, extAddr: 8, relationship: 2, depth: 5}]}});
            } else if (lastStartIndex === 4) {
                return waitForResult({payload: {status: 0, neighbortableentries: 5, neighborlqilist: [{lqi: 10, nwkAddr: 9, extAddr: 10, relationship: 3, depth: 1}]}});
            }
        } else if (type === Type.AREQ && subsystem === Subsystem.ZDO && command === 'mgmtLqiRsp' && equals(payload, {srcaddr: 204})) {
            return waitForResult({payload: {status: 1}});
        } else if (type === Type.AREQ && subsystem === Subsystem.ZDO && command === 'mgmtRtgRsp' && equals(payload, {srcaddr: 205})) {
            if (lastStartIndex === 0) {
                return waitForResult({payload: {status: 0, routingtableentries: 5, routingtablelist: [{destNwkAddr: 10, routeStatus: 'OK', nextHopNwkAddr: 3}, {destNwkAddr: 11, routeStatus: 'OK', nextHopNwkAddr: 3}]}});
            } else if (lastStartIndex === 2) {
                return waitForResult({payload: {status: 0, routingtableentries: 5, routingtablelist: [{destNwkAddr: 12, routeStatus: 'OK', nextHopNwkAddr: 3}, {destNwkAddr: 13, routeStatus: 'OK', nextHopNwkAddr: 3}]}});
            } else if (lastStartIndex === 4) {
                return waitForResult({payload: {status: 0, routingtableentries: 5, routingtablelist: [{destNwkAddr: 14, routeStatus: 'OK', nextHopNwkAddr: 3}]}});
            }
        } else if (type === Type.AREQ && subsystem === Subsystem.ZDO && command === 'mgmtRtgRsp' && equals(payload, {srcaddr: 206})) {
            return waitForResult({payload: {status: 1}});
        } else if (type === Type.AREQ && subsystem === Subsystem.ZDO && command === 'bindRsp' && equals(payload, {srcaddr: 301})) {
            return waitForResult({});
        } else if (type === Type.AREQ && subsystem === Subsystem.ZDO && command === 'unbindRsp' && equals(payload, {srcaddr: 301})) {
            return waitForResult({});
        } else if (type === Type.AREQ && subsystem === Subsystem.ZDO && command === 'mgmtLeaveRsp' && equals(payload, {srcaddr: 401})) {
            return waitForResult({});
        } else if (type === Type.AREQ && subsystem === Subsystem.ZDO && command === 'nwkAddrRsp' && payload.ieeeaddr === '0x03') {
            return waitForResult({payload: {nwkaddr: 3, ieeeaddr: '0x03'}});
        } else if (type === Type.AREQ && subsystem === Subsystem.ZDO && command === 'nwkAddrRsp' && payload.ieeeaddr === '0x02') {
            return waitForResult({payload: {nwkaddr: 2, ieeeaddr: '0x02'}});
        } else {
            missing();
        }
    });
};

const touchlinkScanRequest = Zcl.ZclFrame.create(
    Zcl.FrameType.SPECIFIC, Zcl.Direction.CLIENT_TO_SERVER, false,
    null, 12, 'scanRequest', Zcl.Utils.getCluster('touchlink').ID,
    {transactionID: 1, zigbeeInformation: 4, touchlinkInformation: 18}
);

const touchlinkScanResponse = Zcl.ZclFrame.create(
    Zcl.FrameType.SPECIFIC, Zcl.Direction.SERVER_TO_CLIENT, false,
    null, 12, 'scanResponse', Zcl.Utils.getCluster('touchlink').ID,
    {transactionID: 1, rssiCorrection: 10, zigbeeInformation: 5, touchlinkInformation: 6, keyBitmask: 12, responseID: 11,
     extendedPanID: '0x0017210104d9cd33', networkUpdateID: 1, logicalChannel: 12, panID: 13, networkAddress: 5, numberOfSubDevices: 10,
     totalGroupIdentifiers: 5}
);

const touchlinkIdentifyRequest = Zcl.ZclFrame.create(
    Zcl.FrameType.SPECIFIC, Zcl.Direction.CLIENT_TO_SERVER, false,
    null, 12, 'identifyRequest', Zcl.Utils.getCluster('touchlink').ID,
    {transactionID: 1, duration: 65535}
);

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

let znpReceived;
let znpClose;
let dataConfirmCode = 0;
let dataConfirmCodeReset = false;
let nodeDescRspErrorOnce = false;
let dataRequestCode = 0;
let dataRequestExtCode = 0;
let lastStartIndex = 0;
let assocGetWithAddressNodeRelation;

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

Znp.isValidPath = jest.fn().mockReturnValue(true);
Znp.autoDetectPath = jest.fn().mockReturnValue("/dev/autodetected");

describe("zstack-adapter", () => {
    let adapter: ZStackAdapter;

    afterAll(async () => {
        jest.useRealTimers();
    });

    beforeEach(() => {
        jest.useRealTimers();
        jest.useFakeTimers();
        adapter = new ZStackAdapter(networkOptions, serialPortOptions, "backup.json", {concurrent: 3});
        mockZnpWaitForDefault();
        mocks.forEach((m) => m.mockRestore());
        mockQueueExecute.mockClear();
        mockZnpWaitFor.mockClear();
        dataConfirmCode = 0;
        dataRequestCode = 0;
        dataRequestExtCode = 0;
        assocGetWithAddressNodeRelation = 1;
        networkOptions.networkKeyDistribute = false;
        dataConfirmCodeReset = false;
        nodeDescRspErrorOnce = false;
    });

    it("should commission network with 3.0.x adapter", async () => {
        mockZnpRequestWith(empty3AlignedRequestMock);
        const result = await adapter.start();
        expect(result).toBe("reset");
    });

    it("should commission network with 3.0.x adapter - auto concurrency", async () => {
        mockZnpRequestWith(empty3AlignedRequestMock);
        adapter = new ZStackAdapter(networkOptions, serialPortOptions, "backup.json", {});
        const result = await adapter.start();
        expect(result).toBe("reset");
    });

    it("should commission network with 3.x.0 adapter - auto concurrency", async () => {
        mockZnpRequestWith(empty3x0AlignedRequestMock);
        adapter = new ZStackAdapter(networkOptions, serialPortOptions, "backup.json", {});
        const result = await adapter.start();
        expect(result).toBe("reset");
    });

    it("should commission network with 3.0.x adapter - unaligned 8-bit", async () => {
        mockZnpRequestWith(empty3UnalignedRequestMock);
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

    it("should restore unified backup with 3.0.x adapter and create backup - empty", async () => {
        const backupFile = getTempFile();
        fs.writeFileSync(backupFile, JSON.stringify(backupMatchingConfig), "utf8");
        adapter = new ZStackAdapter(networkOptions, serialPortOptions, backupFile, {concurrent: 3});
        mockZnpRequestWith(empty3AlignedRequestMock);
        const result = await adapter.start();
        expect(result).toBe("restored");

        await adapter.backup();
    });

    it("should restore unified backup with 3.0.x adapter and create backup - no tclk seed", async () => {
        const backupFile = getTempFile();
        const backup = JSON.parse(JSON.stringify(backupMatchingConfig));
        delete backup.stack_specific.zstack;
        fs.writeFileSync(backupFile, JSON.stringify(backup), "utf8");
        adapter = new ZStackAdapter(networkOptions, serialPortOptions, backupFile, {concurrent: 3});
        mockZnpRequestWith(empty3AlignedRequestMock);
        const result = await adapter.start();
        expect(result).toBe("restored");

        await adapter.backup();
    });

    it("should restore unified backup with 3.x.0 adapter and create backup - empty", async () => {
        const backupFile = getTempFile();
        fs.writeFileSync(backupFile, JSON.stringify(backupMatchingConfig), "utf8");
        adapter = new ZStackAdapter(networkOptions, serialPortOptions, backupFile, {concurrent: 3});
        mockZnpRequestWith(empty3x0AlignedRequestMock);
        const result = await adapter.start();
        expect(result).toBe("restored");

        await adapter.backup();
    });

    it("should (recommission) restore unified backup with 1.2 adapter and create backup - empty", async () => {
        const backupFile = getTempFile();
        fs.writeFileSync(backupFile, JSON.stringify(backupMatchingConfig12), "utf8");
        adapter = new ZStackAdapter(networkOptions, serialPortOptions, backupFile, {concurrent: 1});
        mockZnpRequestWith(empty12UnalignedRequestMock);
        const result = await adapter.start();
        expect(result).toBe("restored");

        const backup = await adapter.backup();
        expect(backup.networkKeyInfo.frameCounter).toBe(0);
    });

    it("should create backup with 3.0.x adapter - default security material table entry", async () => {
        const builder = commissioned3AlignedRequestMock.clone();
        mockZnpRequestWith(builder);
        const result = await adapter.start();
        expect(result).toBe("resumed");
        for (let i = 0; i < 4; i++) { builder.nv(NvItemsIds.LEGACY_NWK_SEC_MATERIAL_TABLE_START + i, Buffer.from("000000000000000000000000", "hex")); }

        const secMaterialTableEntry = Structs.nwkSecMaterialDescriptorEntry();
        secMaterialTableEntry.extendedPanID = Buffer.alloc(8, 0xff);
        secMaterialTableEntry.FrameCounter = 2800;
        builder.nv(NvItemsIds.LEGACY_NWK_SEC_MATERIAL_TABLE_START + 0, secMaterialTableEntry.serialize("aligned"));
        mockZnpRequestWith(builder);

        const backup = await adapter.backup();
        expect(backup.networkKeyInfo.frameCounter).toBe(2800);
    });

    it("should create backup with 3.0.x adapter - emnpty security material table", async () => {
        const builder = commissioned3AlignedRequestMock.clone();
        mockZnpRequestWith(builder);
        const result = await adapter.start();
        expect(result).toBe("resumed");
        for (let i = 0; i < 4; i++) { builder.nv(NvItemsIds.LEGACY_NWK_SEC_MATERIAL_TABLE_START + i, Buffer.from("000000000000000000000000", "hex")); }
        mockZnpRequestWith(builder);

        const backup = await adapter.backup();
        expect(backup.networkKeyInfo.frameCounter).toBe(1250);
    });

    it("should create backup with 3.0.x adapter - security material table with generic record", async () => {
        const builder = commissioned3AlignedRequestMock.clone();
        mockZnpRequestWith(builder);
        const result = await adapter.start();
        expect(result).toBe("resumed");
        for (let i = 0; i < 4; i++) { builder.nv(NvItemsIds.LEGACY_NWK_SEC_MATERIAL_TABLE_START + i, Buffer.from("000000000000000000000000", "hex")); }
        const genericEntry = Structs.nwkSecMaterialDescriptorEntry();
        genericEntry.extendedPanID = Buffer.from("ffffffffffffffff", "hex");
        genericEntry.FrameCounter = 8737;
        builder.nv(NvItemsIds.LEGACY_NWK_SEC_MATERIAL_TABLE_START + 3, genericEntry.serialize("aligned"));
        mockZnpRequestWith(builder);

        const backup = await adapter.backup();
        expect(backup.networkKeyInfo.frameCounter).toBe(8737);
    });

    it("should create backup with 1.2 adapter", async () => {
        mockZnpRequestWith(commissioned12UnalignedRequestMock);
        const result = await adapter.start();
        expect(result).toBe("resumed");

        const backup = await adapter.backup();
        expect(backup.networkKeyInfo.frameCounter).toBe(0);
    });

    it("should fail when backup file is corrupted - Coordinator backup is corrupted", async () => {
        const backupFile = getTempFile();
        fs.writeFileSync(backupFile, "{", "utf8");
        adapter = new ZStackAdapter(networkOptions, serialPortOptions, backupFile, {concurrent: 3});
        mockZnpRequestWith(empty3AlignedRequestMock);
        await expect(adapter.start()).rejects.toThrowError("Coordinator backup is corrupted");
    });

    it("should fail to restore unified backup with 3.0.x adapter - invalid open coordinator backup version", async () => {
        const backupFile = getTempFile();
        let backupData: UnifiedBackupStorage = JSON.parse(JSON.stringify(backupMatchingConfig));
        backupData = {
            ...backupData,
            metadata: {
                ...backupData.metadata,
                version: 99 as any
            }
        };

        fs.writeFileSync(backupFile, JSON.stringify(backupData), "utf8");
        adapter = new ZStackAdapter(networkOptions, serialPortOptions, backupFile, {concurrent: 3});
        mockZnpRequestWith(empty3AlignedRequestMock);
        await expect(adapter.start()).rejects.toThrowError("Unsupported open coordinator backup version (version=99)");
    });

    it("should fail to restore (unified) backup with 3.0.x adapter - unsupported backup format", async () => {
        const backupFile = getTempFile();
        let backupData: UnifiedBackupStorage = JSON.parse(JSON.stringify(backupMatchingConfig));
        backupData = {
            ...backupData,
            metadata: {
                ...backupData.metadata,
                version: undefined
            }
        };

        fs.writeFileSync(backupFile, JSON.stringify(backupData), "utf8");
        adapter = new ZStackAdapter(networkOptions, serialPortOptions, backupFile, {concurrent: 3});
        mockZnpRequestWith(empty3AlignedRequestMock);
        await expect(adapter.start()).rejects.toThrowError("Unknown backup format");
    });

    it("should fail to restore unified backup with 3.0.x adapter - insufficient tclk table size", async () => {
        const backupFile = getTempFile();
        let backupData: UnifiedBackupStorage = JSON.parse(JSON.stringify(backupMatchingConfig));
        fs.writeFileSync(backupFile, JSON.stringify(backupData), "utf8");

        const builder = empty3AlignedRequestMock.clone();
        for (let i = 0; i < 16; i++) { builder.nv(NvItemsIds.LEGACY_TCLK_TABLE_START + i, null); }
        builder.nv(NvItemsIds.LEGACY_TCLK_TABLE_START + 0, Buffer.from("0000000000000000000000000000000000000000", "hex"));
        mockZnpRequestWith(builder);

        adapter = new ZStackAdapter(networkOptions, serialPortOptions, backupFile, {concurrent: 3});
        await expect(adapter.start()).rejects.toThrowError("target adapter tclk table size insufficient (size=1)");
    });

    it("should fail to restore unified backup with 3.0.x adapter - insufficient aps link key data table size", async () => {
        const backupFile = getTempFile();
        let backupData: UnifiedBackupStorage = JSON.parse(JSON.stringify(backupMatchingConfig));
        fs.writeFileSync(backupFile, JSON.stringify(backupData), "utf8");

        const builder = empty3AlignedRequestMock.clone();
        for (let i = 0; i < 16; i++) { builder.nv(NvItemsIds.APS_LINK_KEY_DATA_START + i, null); }
        builder.nv(NvItemsIds.APS_LINK_KEY_DATA_START + 0, Buffer.from("000000000000000000000000000000000000000000000000", "hex"));
        mockZnpRequestWith(builder);

        adapter = new ZStackAdapter(networkOptions, serialPortOptions, backupFile, {concurrent: 3});
        await expect(adapter.start()).rejects.toThrowError("target adapter aps link key data table size insufficient (size=1)");
    });

    it("should fail to restore unified backup with 3.0.x adapter - insufficient security manager table size", async () => {
        const backupFile = getTempFile();
        let backupData: UnifiedBackupStorage = JSON.parse(JSON.stringify(backupMatchingConfig));
        fs.writeFileSync(backupFile, JSON.stringify(backupData), "utf8");

        const builder = empty3AlignedRequestMock.clone();
        builder.nv(NvItemsIds.APS_LINK_KEY_TABLE, Buffer.from("0000feff00000000", "hex"));
        mockZnpRequestWith(builder);

        adapter = new ZStackAdapter(networkOptions, serialPortOptions, backupFile, {concurrent: 3});
        await expect(adapter.start()).rejects.toThrowError("target adapter security manager table size insufficient (size=1)");
    });

    it("should fail to restore unified backup with 1.2 adapter - backup from newer adapter", async () => {
        const backupFile = getTempFile();
        let backupData: UnifiedBackupStorage = JSON.parse(JSON.stringify(backupMatchingConfig));
        fs.writeFileSync(backupFile, JSON.stringify(backupData), "utf8");

        mockZnpRequestWith(empty12UnalignedRequestMock);
        adapter = new ZStackAdapter(networkOptions, serialPortOptions, backupFile, {concurrent: 3});
        await expect(adapter.start()).rejects.toThrowError("your backup is from newer platform version (Z-Stack 3.0.x+) and cannot be restored onto Z-Stack 1.2 adapter - please remove backup before proceeding");
    });


    it("should fail to create backup with 3.0.x adapter - unable to read ieee address", async () => {
        mockZnpRequestWith(commissioned3AlignedRequestMock.clone()
            .handle(Subsystem.SYS, "getExtAddr", () => ({ payload: {} }))
        );
        const result = await adapter.start();
        expect(result).toBe("resumed");
        await expect(adapter.backup()).rejects.toThrowError("Failed to read adapter IEEE address");
    });

    it("should fail to create backup with 3.0.x adapter - adapter not commissioned - missing nib", async () => {
        const builder = empty3AlignedRequestMock.clone();
        mockZnpRequestWith(builder);
        const result = await adapter.start();
        expect(result).toBe("reset");
        builder.nv(NvItemsIds.NIB, null);
        mockZnpRequestWith(builder);
        await expect(adapter.backup()).rejects.toThrowError("Cannot backup - adapter not commissioned");
    });

    it("should fail to create backup with 3.0.x adapter - missing active key info", async () => {
        const builder = empty3AlignedRequestMock.clone();
        mockZnpRequestWith(builder);
        const result = await adapter.start();
        expect(result).toBe("reset");
        builder.nv(NvItemsIds.NWK_ACTIVE_KEY_INFO, null);
        mockZnpRequestWith(builder);
        await expect(adapter.backup()).rejects.toThrowError("Cannot backup - missing active key info");
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

    it("should fail to start with 3.0.x adapter - commissioned, config-adapter mismatch", async () => {
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
        await expect(adapter.start()).rejects.toThrowError("startup failed - configuration-adapter mismatch - see logs above for more information");
        expect(mockLoggerError.mock.calls[0][0]).toBe("Configuration is not consistent with adapter state/backup!");
        expect(mockLoggerError.mock.calls[1][0]).toBe("- PAN ID: configured=124, adapter=123");
        expect(mockLoggerError.mock.calls[2][0]).toBe("- Extended PAN ID: configured=00124b0009d69f77, adapter=00124b0009d69f77");
        expect(mockLoggerError.mock.calls[3][0]).toBe("- Network Key: configured=01030507090b0d0f00020406080a0c0d, adapter=01030507090b0d0f00020406080a0c0d");
        expect(mockLoggerError.mock.calls[4][0]).toBe("- Channel List: configured=21, adapter=21");
        expect(mockLoggerError.mock.calls[5][0]).toBe("Please update configuration to prevent further issues.");
        expect(mockLoggerError.mock.calls[6][0]).toMatch(`If you wish to re\-commission your network, please remove coordinator backup at ${backupFile}`);
        expect(mockLoggerError.mock.calls[7][0]).toBe("Re-commissioning your network will require re-pairing of all devices!");
    });

    it("should start with runInconsistent option with 3.0.x adapter - commissioned, config-adapter mismatch", async () => {
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

        adapter = new ZStackAdapter(networkOptionsMismatched, serialPortOptions, backupFile, {concurrent: 3, forceStartWithInconsistentAdapterConfiguration: true}, mockLogger);
        mockZnpRequestWith(commissioned3AlignedRequestMock);
        const result = await adapter.start();
        expect(result).toBe("resumed");
        expect(mockLoggerError.mock.calls[0][0]).toBe("Configuration is not consistent with adapter state/backup!");
        expect(mockLoggerError.mock.calls[1][0]).toBe("- PAN ID: configured=124, adapter=123");
        expect(mockLoggerError.mock.calls[2][0]).toBe("- Extended PAN ID: configured=00124b0009d69f77, adapter=00124b0009d69f77");
        expect(mockLoggerError.mock.calls[3][0]).toBe("- Network Key: configured=01030507090b0d0f00020406080a0c0d, adapter=01030507090b0d0f00020406080a0c0d");
        expect(mockLoggerError.mock.calls[4][0]).toBe("- Channel List: configured=21, adapter=21");
        expect(mockLoggerError.mock.calls[5][0]).toBe("Please update configuration to prevent further issues.");
        expect(mockLoggerError.mock.calls[6][0]).toMatch(`If you wish to re\-commission your network, please remove coordinator backup at ${backupFile}`);
        expect(mockLoggerError.mock.calls[7][0]).toBe("Re-commissioning your network will require re-pairing of all devices!");
        expect(mockLoggerError.mock.calls[8][0]).toBe("Running despite adapter configuration mismatch as configured. Please update the adapter to compatible firmware and recreate your network as soon as possible.");
    });

    it("should start with 3.0.x adapter - backward-compat - reversed extended pan id", async () => {
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

        adapter = new ZStackAdapter(networkOptions, serialPortOptions, backupFile, {concurrent: 3}, mockLogger);
        const nib = Structs.nib(Buffer.from(commissioned3AlignedRequestMock.nvItems.find(item => item.id === NvItemsIds.NIB).value));
        nib.extendedPANID = nib.extendedPANID.reverse();
        mockZnpRequestWith(
            commissioned3AlignedRequestMock.clone()
            .nv(NvItemsIds.NIB, nib.serialize())
        );
        const result = await adapter.start();
        expect(result).toBe("resumed");
        expect(mockLoggerWarn.mock.calls[0][0]).toBe("Extended PAN ID is reversed (expected=00124b0009d69f77, actual=779fd609004b1200)");
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

    it("should commission network with 1.2 adapter - default extended pan id", async () => {
        mockZnpRequestWith(empty12UnalignedRequestMock);
        adapter = new ZStackAdapter(networkOptionsDefaultExtendedPanId, serialPortOptions, "backup.json", {concurrent: 3});
        const result = await adapter.start();
        expect(result).toBe("restored");
    });

    it("should commission network with 1.2 adapter - old adapter without version reporting", async () => {
        mockZnpRequestWith(
            empty12UnalignedRequestMock.clone()
                .handle(Subsystem.SYS, "version", () => undefined)
        );
        const result = await adapter.start();
        expect(result).toBe("restored");
    });

    it("should reset network with 1.2 adapter - config mismtach", async () => {
        mockZnpRequestWith(commissioned12UnalignedMismatchRequestMock);
        const result = await adapter.start();
        expect(result).toBe("reset");
    });

    it("LED behaviour: disable LED true, firmware not handling leds", async () => {
        basicMocks();
        adapter = new ZStackAdapter(networkOptions, serialPortOptions, "backup.json", {disableLED: true});
        await adapter.start();
        expect(mockZnpRequest).toBeCalledWith(Subsystem.UTIL, 'ledControl', {ledid: 3, mode: 0}, null, 500);
        mockZnpRequest.mockClear();
        await adapter.permitJoin(255, 0);
        expect(mockZnpRequest).not.toBeCalledWith(Subsystem.UTIL, 'ledControl', expect.any(Object), null, 500);
        mockZnpRequest.mockClear();
        await adapter.permitJoin(0, 0);
        expect(mockZnpRequest).not.toBeCalledWith(Subsystem.UTIL, 'ledControl', expect.any(Object), null, 500);
    });

    it("LED behaviour: disable LED false, firmware not handling leds", async () => {
        basicMocks();
        adapter = new ZStackAdapter(networkOptions, serialPortOptions, "backup.json", {disableLED: false});
        await adapter.start();
        expect(mockZnpRequest).not.toBeCalledWith(Subsystem.UTIL, 'ledControl', expect.any(Object), null, 500);
        mockZnpRequest.mockClear();
        await adapter.permitJoin(255, 0);
        expect(mockZnpRequest).toBeCalledWith(Subsystem.UTIL, 'ledControl', {ledid: 3, mode: 1}, null, 500);
        mockZnpRequest.mockClear();
        await adapter.permitJoin(0, 0);
        expect(mockZnpRequest).toBeCalledWith(Subsystem.UTIL, 'ledControl', {ledid: 3, mode: 0}, null, 500);
    });

    it("LED behaviour: disable LED true, firmware handling leds", async () => {
        mockZnpRequestWith(
            baseZnpRequestMock.clone()
                .handle(Subsystem.SYS, "version", payload => { return { payload: { product: ZnpVersion.zStack30x, revision: 20211030 } }})
        );
        adapter = new ZStackAdapter(networkOptions, serialPortOptions, "backup.json", {disableLED: true});
        await adapter.start();
        expect(mockZnpRequest).toBeCalledWith(Subsystem.UTIL, 'ledControl', {ledid: 0xFF, mode: 5}, null, 500);
        mockZnpRequest.mockClear();
        await adapter.permitJoin(255, 0);
        expect(mockZnpRequest).not.toBeCalledWith(Subsystem.UTIL, 'ledControl', expect.any(Object), null, 500);
        mockZnpRequest.mockClear();
        await adapter.permitJoin(0, 0);
        expect(mockZnpRequest).not.toBeCalledWith(Subsystem.UTIL, 'ledControl', expect.any(Object), null, 500);
    });

    it("LED behaviour: disable LED false, firmware handling leds", async () => {
        mockZnpRequestWith(
            baseZnpRequestMock.clone()
                .handle(Subsystem.SYS, "version", payload => { return { payload: { product: ZnpVersion.zStack30x, revision: 20211030 } }})
        );
        adapter = new ZStackAdapter(networkOptions, serialPortOptions, "backup.json", {disableLED: false});
        await adapter.start();
        expect(mockZnpRequest).not.toBeCalledWith(Subsystem.UTIL, 'ledControl', expect.any(Object), null, 500);
        mockZnpRequest.mockClear();
        await adapter.permitJoin(255, 0);
        expect(mockZnpRequest).not.toBeCalledWith(Subsystem.UTIL, 'ledControl', expect.any(Object), null, 500);
        mockZnpRequest.mockClear();
        await adapter.permitJoin(0, 0);
        expect(mockZnpRequest).not.toBeCalledWith(Subsystem.UTIL, 'ledControl', expect.any(Object), null, 500);
    });

    /* Original Tests */
    it('Is valid path', async () => {
        const result = await ZStackAdapter.isValidPath("/dev/autodetected");
        expect(result).toBeTruthy();
        expect(Znp.isValidPath).toHaveBeenCalledWith("/dev/autodetected");
    });

    it('Auto detect path', async () => {
        const result = await ZStackAdapter.autoDetectPath();
        expect(result).toBe("/dev/autodetected");
        expect(Znp.autoDetectPath).toHaveBeenCalledTimes(1);
    });

    it('Call znp constructor', async () => {
       expect(Znp).toBeCalledWith("dummy", 800, false);
    });

    it('Close adapter', async () => {
        basicMocks();
        await adapter.start();
        await adapter.stop();
        expect(mockZnpClose).toBeCalledTimes(1);
    });

    it('Get coordinator', async () => {
        basicMocks();
        await adapter.start();
        const info = await adapter.getCoordinator();
        const expected = {
            "networkAddress":0,
            "manufacturerID":0,
            "ieeeAddr":"0x00124b0009d80ba7",
            "endpoints":[{
                  "ID":1,
                  "profileID":123,
                  "deviceID":5,
                  "inputClusters":[
                     1
                  ],
                  "outputClusters":[
                     2
                  ]
               },
               {
                  "ID":2,
                  "profileID":124,
                  "deviceID":7,
                  "inputClusters":[
                     8
                  ],
                  "outputClusters":[
                     9
                  ]
               },
               {
                  "ID":3,
                  "profileID":124,
                  "deviceID":7,
                  "inputClusters":[
                     8
                  ],
                  "outputClusters":[
                     9
                  ]
               },
               {
                  "ID":4,
                  "profileID":124,
                  "deviceID":7,
                  "inputClusters":[
                     8
                  ],
                  "outputClusters":[
                     9
                  ]
               },
               {
                  "ID":5,
                  "profileID":124,
                  "deviceID":7,
                  "inputClusters":[
                     8
                  ],
                  "outputClusters":[
                     9
                  ]
               },
               {
                  "ID":6,
                  "profileID":124,
                  "deviceID":7,
                  "inputClusters":[
                     8
                  ],
                  "outputClusters":[
                     9
                  ]
               },
               {
                "ID":8,
                "profileID":124,
                "deviceID":7,
                "inputClusters":[
                   8
                ],
                "outputClusters":[
                   9
                ]
             },
             {
                "ID":10,
                "profileID":124,
                "deviceID":7,
                "inputClusters":[
                   8
                ],
                "outputClusters":[
                   9
                ]
             },
                {
                  "ID":11,
                  "profileID":124,
                  "deviceID":7,
                  "inputClusters":[
                     8
                  ],
                  "outputClusters":[
                     9
                  ]
               },
               {
                "ID":110,
                "profileID": 124,
                "deviceID":7,
                "inputClusters":[
                   8
                ],
                "outputClusters":[
                   9
                ]
             },
             {
                "ID":12,
                "profileID": 124,
                "deviceID":7,
                "inputClusters":[
                   8
                ],
                "outputClusters":[
                   9
                ]
             },
             {
                "ID":13,
                "profileID": 124,
                "deviceID":7,
                "inputClusters":[
                   8
                ],
                "outputClusters":[
                   9
                ]
             },
             {
                "ID":47,
                "profileID": 124,
                "deviceID":7,
                "inputClusters":[
                   8
                ],
                "outputClusters":[
                   9
                ]
             },
             {
                "ID":242,
                "profileID": 124,
                "deviceID":7,
                "inputClusters":[
                   8
                ],
                "outputClusters":[
                   9
                ]
             }
            ]
         };
        expect(info).toStrictEqual(expected)
    });

    it('Permit join all', async () => {
        basicMocks();
        await adapter.start();
        mockZnpRequest.mockClear();
        await adapter.permitJoin(100, null);
        expect(mockZnpRequest).toBeCalledTimes(2);
        expect(mockZnpRequest).toBeCalledWith(Subsystem.ZDO, 'mgmtPermitJoinReq', {addrmode: 0x0F, dstaddr: 0xFFFC , duration: 100, tcsignificance: 0 });
        expect(mockZnpRequest).toBeCalledWith(Subsystem.UTIL, 'ledControl', {ledid: 3, mode: 1}, null, 500);
    });

    it('Permit join specific networkAddress', async () => {
        basicMocks();
        await adapter.start();
        mockZnpRequest.mockClear();
        await adapter.permitJoin(102, 42102);
        expect(mockZnpRequest).toBeCalledTimes(2);
        expect(mockZnpRequest).toBeCalledWith(Subsystem.ZDO, 'mgmtPermitJoinReq', {addrmode: 2, dstaddr: 42102 , duration: 102, tcsignificance: 0 });
        expect(mockZnpRequest).toBeCalledWith(Subsystem.UTIL, 'ledControl', {ledid: 3, mode: 1}, null, 500);
    });

    it('Get coordinator version', async () => {
        basicMocks();
        await adapter.start();
        mockZnpRequest.mockClear();
        expect(await adapter.getCoordinatorVersion()).toStrictEqual({type: 'zStack3x0', meta: {revision: 20210430, product: 1}})
    });

    it('Soft reset', async () => {
        basicMocks();
        await adapter.start();
        mockZnpRequest.mockClear();
        await adapter.reset('soft');
        expect(mockZnpRequest).toBeCalledTimes(1);
        expect(mockZnpRequest).toBeCalledWith(Subsystem.SYS, 'resetReq', {type: 1});
    });

    it('Hard reset', async () => {
        basicMocks();
        await adapter.start();
        mockZnpRequest.mockClear();
        await adapter.reset('hard');
        expect(mockZnpRequest).toBeCalledTimes(1);
        expect(mockZnpRequest).toBeCalledWith(Subsystem.SYS, 'resetReq', {type: 0});
    });

    it('Set transmit power', async () => {
        basicMocks();
        await adapter.start();
        mockZnpRequest.mockClear();
        await adapter.setTransmitPower(15);
        expect(mockZnpRequest).toBeCalledTimes(1);
        expect(mockZnpRequest).toBeCalledWith(Subsystem.SYS, 'stackTune', {operation: 0, value: 15});
    });

    it('Support LED should go to false when LED request fails', async () => {
        basicMocks();
        await adapter.start();
        mockZnpRequest.mockClear();
        mockZnpRequest.mockImplementation((_, cmd) => new Promise((resolve, reject) => {
            if (cmd == 'ledControl') reject('FAILED');
            else resolve(null);
        }));
        await adapter.permitJoin(0, 0);
        expect(mockZnpRequest).toBeCalledWith(Subsystem.UTIL, 'ledControl', {ledid: 3, mode: 0}, null, 500);
        mockZnpRequest.mockClear();
        await adapter.permitJoin(0, 0);
        expect(mockZnpRequest).not.toBeCalledWith(Subsystem.UTIL, 'ledControl', {ledid: 3, mode: 0}, null, 500);
    });

    it('Node descriptor', async () => {
        basicMocks();
        let result;
        await adapter.start();

        mockZnpRequest.mockClear();
        result = await adapter.nodeDescriptor(2);
        expect(mockZnpWaitFor).toBeCalledWith(Type.AREQ, Subsystem.ZDO, 'nodeDescRsp', {nwkaddr: 2});
        expect(mockZnpRequest).toBeCalledTimes(1);
        expect(mockZnpRequest).toBeCalledWith(Subsystem.ZDO, 'nodeDescReq', {dstaddr: 2, nwkaddrofinterest: 2}, 1);
        expect(mockQueueExecute.mock.calls[0][1]).toBe(2);
        expect(result).toStrictEqual({manufacturerCode: 4, type: 'Router'})

        mockZnpRequest.mockClear();
        result = await adapter.nodeDescriptor(1);
        expect(result).toStrictEqual({manufacturerCode: 2, type: 'Coordinator'})

        mockZnpRequest.mockClear();
        result = await adapter.nodeDescriptor(3);
        expect(result).toStrictEqual({manufacturerCode: 6, type: 'EndDevice'})

        mockZnpRequest.mockClear();
        result = await adapter.nodeDescriptor(5);
        expect(result).toStrictEqual({manufacturerCode: 10, type: 'Unknown'})
    });

    it('Node descriptor fails, should retry after route discovery', async () => {
        basicMocks();
        await adapter.start();
        nodeDescRspErrorOnce = true;
        mockZnpRequest.mockClear();

        const result = await adapter.nodeDescriptor(1);

        expect(mockZnpRequest).toHaveBeenNthCalledWith(1, 5, "nodeDescReq", {"dstaddr": 1, "nwkaddrofinterest": 1}, 89);
        expect(mockZnpRequest).toHaveBeenNthCalledWith(2, 5, 'extRouteDisc', { dstAddr: 1, options: 0, radius: 30 });
        expect(mockZnpRequest).toHaveBeenNthCalledWith(3, 5, "nodeDescReq", {"dstaddr": 1, "nwkaddrofinterest": 1}, 1);
        expect(result).toStrictEqual({manufacturerCode: 2, type: 'Coordinator'})
    });

    it('Active endpoints', async () => {
        basicMocks();
        await adapter.start();

        const result = await adapter.activeEndpoints(3);
        expect(mockQueueExecute.mock.calls[0][1]).toBe(3);
        expect(result).toStrictEqual({endpoints: [1,2,3,4,5,6,8,10,11,110,12, 13, 47, 242]})
    });

    it('Simple descriptor', async () => {
        basicMocks();
        await adapter.start();

        const result = await adapter.simpleDescriptor(1, 20);
        expect(mockQueueExecute.mock.calls[0][1]).toBe(1);
        expect(result).toStrictEqual({deviceID: 7, endpointID: 20, inputClusters: [8], outputClusters: [9], profileID: 124});
    });

    it('Send zcl frame network address', async () => {
        basicMocks();
        await adapter.start();

        mockZnpRequest.mockClear();
        const frame = Zcl.ZclFrame.create(Zcl.FrameType.GLOBAL, Zcl.Direction.CLIENT_TO_SERVER, true, null, 100, 'writeNoRsp', 0, [{attrId: 0, dataType:0, attrData: null}]);
        await adapter.sendZclFrameToEndpoint('0x02', 2, 20, frame, 10000, false, false);
        expect(mockQueueExecute.mock.calls[0][1]).toBe(2);
        expect(mockZnpRequest).toBeCalledTimes(1);
        expect(mockZnpRequest).toBeCalledWith(4, "dataRequest", {"clusterid": 0, "data": frame.toBuffer(), "destendpoint": 20, "dstaddr": 2, "len": 6, "options": 0, "radius": 30, "srcendpoint": 1, "transid": 1}, 99)
    });

    it('Send zcl frame network address retry on MAC channel access failure', async () => {
        basicMocks();
        dataConfirmCode = 225;
        dataConfirmCodeReset = true;
        await adapter.start();
        mockZnpRequest.mockClear();
        const frame = Zcl.ZclFrame.create(Zcl.FrameType.GLOBAL, Zcl.Direction.CLIENT_TO_SERVER, true, null, 100, 'writeNoRsp', 0, [{attrId: 0, dataType:0, attrData: null}]);
        await adapter.sendZclFrameToEndpoint('0x02', 2, 20, frame, 10000, false, false);
        expect(mockQueueExecute.mock.calls[0][1]).toBe(2);
        expect(mockZnpRequest).toBeCalledTimes(2);
        expect(mockZnpRequest).toBeCalledWith(4, "dataRequest", {"clusterid": 0, "data": frame.toBuffer(), "destendpoint": 20, "dstaddr": 2, "len": 6, "options": 0, "radius": 30, "srcendpoint": 1, "transid": 1}, 99);
    });

    it('Send zcl frame network address dataConfirm fails', async () => {
        basicMocks();
        await adapter.start();
        dataConfirmCode = 201;
        mockZnpRequest.mockClear();
        const frame = Zcl.ZclFrame.create(Zcl.FrameType.GLOBAL, Zcl.Direction.CLIENT_TO_SERVER, true, null, 100, 'writeNoRsp', 0, [{attrId: 0, dataType:0, attrData: null}]);
        let error;
        try {await adapter.sendZclFrameToEndpoint('0x02', 2, 20, frame, 10000, false, false)} catch (e) {error = e;}
        expect(error.message).toStrictEqual("Data request failed with error: 'undefined' (201)");
    });

    it('Send zcl frame network address with default response', async () => {
        basicMocks();
        await adapter.start();
        const defaultReponse = Zcl.ZclFrame.create(Zcl.FrameType.GLOBAL, Zcl.Direction.SERVER_TO_CLIENT, true, null, 100, 'defaultRsp', 0, {cmdId: 0, status: 0});
        const object = {type: Type.AREQ, subsystem: Subsystem.AF, command: 'incomingMsg', payload: {clusterid: 0, srcendpoint: 20, srcaddr: 2, linkquality: 101, groupid: 12, data: defaultReponse.toBuffer()}};
        mockZnpRequest.mockClear();
        const frame = Zcl.ZclFrame.create(Zcl.FrameType.GLOBAL, Zcl.Direction.CLIENT_TO_SERVER, false, null, 100, 'writeNoRsp', 0, [{attrId: 0, dataType:0, attrData: null}]);
        const request =  adapter.sendZclFrameToEndpoint('0x02', 2, 20, frame, 10000, false, false);
        znpReceived(object);
        await request;
        expect(mockQueueExecute.mock.calls[0][1]).toBe(2);
        expect(mockZnpRequest).toBeCalledTimes(1);
        expect(mockZnpRequest).toBeCalledWith(4, "dataRequest", {"clusterid": 0, "data": frame.toBuffer(), "destendpoint": 20, "dstaddr": 2, "len": 6, "options": 0, "radius": 30, "srcendpoint": 1, "transid": 1}, 99)
    });

    it('Send zcl frame network address fails because mac transaction expire, should retry', async () => {
        basicMocks();
        await adapter.start();
        dataConfirmCode = 240;
        mockZnpRequest.mockClear();
        const frame = Zcl.ZclFrame.create(Zcl.FrameType.GLOBAL, Zcl.Direction.CLIENT_TO_SERVER, true, null, 100, 'writeNoRsp', 0, [{attrId: 0, dataType:0, attrData: null}]);
        const response = adapter.sendZclFrameToEndpoint('0x02', 2, 20, frame, 10000, false, false);
        let error;
        try {await response} catch(e) {error = e;}

        expect(error.message).toStrictEqual("Data request failed with error: 'MAC transaction expired' (240)");
        expect(mockZnpRequest).toBeCalledTimes(10);
        expect(mockZnpRequest).toHaveBeenNthCalledWith(1, 4, "dataRequest", {"clusterid": 0, "data": frame.toBuffer(), "destendpoint": 20, "dstaddr": 2, "len": 6, "options": 0, "radius": 30, "srcendpoint": 1, "transid": 1}, 99)
        expect(mockZnpRequest).toHaveBeenNthCalledWith(2, 4, "dataRequest", {"clusterid": 0, "data": frame.toBuffer(), "destendpoint": 20, "dstaddr": 2, "len": 6, "options": 0, "radius": 30, "srcendpoint": 1, "transid": 2}, 99)
        expect(mockZnpRequest).toHaveBeenNthCalledWith(3, 7, 'assocGetWithAddress', { extaddr: '0x02', nwkaddr: 2})
        expect(mockZnpRequest).toHaveBeenNthCalledWith(4, 7, 'assocRemove', { ieeeadr: '0x02' })
        expect(mockZnpRequest).toHaveBeenNthCalledWith(5, 4, "dataRequest", {"clusterid": 0, "data": frame.toBuffer(), "destendpoint": 20, "dstaddr": 2, "len": 6, "options": 0, "radius": 30, "srcendpoint": 1, "transid": 3}, 99)
        expect(mockZnpRequest).toHaveBeenNthCalledWith(6, 7, 'assocAdd', { ieeeadr: "0x02", noderelation: 1, nwkaddr: 2 })
        expect(mockZnpRequest).toHaveBeenNthCalledWith(7, 5, 'extRouteDisc', { dstAddr: 2, options: 0, radius: 30 })
        expect(mockZnpRequest).toHaveBeenNthCalledWith(8, 4, "dataRequest", {"clusterid": 0, "data": frame.toBuffer(), "destendpoint": 20, "dstaddr": 2, "len": 6, "options": 0, "radius": 30, "srcendpoint": 1, "transid": 4}, 99)
        expect(mockZnpRequest).toHaveBeenNthCalledWith(9, 5, 'nwkAddrReq', {ieeeaddr: '0x02', reqtype: 0, startindex: 0})
        expect(mockZnpRequest).toHaveBeenNthCalledWith(10, 4, "dataRequest", {"clusterid": 0, "data": frame.toBuffer(), "destendpoint": 20, "dstaddr": 2, "len": 6, "options": 0, "radius": 30, "srcendpoint": 1, "transid": 5}, 99)
    });

    it('Send zcl frame network address fails because mac transaction expire when not being a parent, should retry', async () => {
        basicMocks();
        await adapter.start();
        dataConfirmCode = 240;
        assocGetWithAddressNodeRelation = 255;
        mockZnpRequest.mockClear();
        const frame = Zcl.ZclFrame.create(Zcl.FrameType.GLOBAL, Zcl.Direction.CLIENT_TO_SERVER, true, null, 100, 'writeNoRsp', 0, [{attrId: 0, dataType:0, attrData: null}]);
        const response = adapter.sendZclFrameToEndpoint('0x02', 2, 20, frame, 10000, false, false);
        let error;
        try {await response} catch(e) {error = e;}

        expect(error.message).toStrictEqual("Data request failed with error: 'MAC transaction expired' (240)");
        expect(mockZnpRequest).toBeCalledTimes(8);
        expect(mockZnpRequest).toHaveBeenNthCalledWith(1, 4, "dataRequest", {"clusterid": 0, "data": frame.toBuffer(), "destendpoint": 20, "dstaddr": 2, "len": 6, "options": 0, "radius": 30, "srcendpoint": 1, "transid": 1}, 99)
        expect(mockZnpRequest).toHaveBeenNthCalledWith(2, 4, "dataRequest", {"clusterid": 0, "data": frame.toBuffer(), "destendpoint": 20, "dstaddr": 2, "len": 6, "options": 0, "radius": 30, "srcendpoint": 1, "transid": 2}, 99)
        expect(mockZnpRequest).toHaveBeenNthCalledWith(3, 7, 'assocGetWithAddress', { extaddr: '0x02', nwkaddr: 2})
        expect(mockZnpRequest).toHaveBeenNthCalledWith(4, 5, 'extRouteDisc', { dstAddr: 2, options: 0, radius: 30 })
        expect(mockZnpRequest).toHaveBeenNthCalledWith(5, 4, "dataRequest", {"clusterid": 0, "data": frame.toBuffer(), "destendpoint": 20, "dstaddr": 2, "len": 6, "options": 0, "radius": 30, "srcendpoint": 1, "transid": 3}, 99)
        expect(mockZnpRequest).toHaveBeenNthCalledWith(6, 5, 'nwkAddrReq', {ieeeaddr: '0x02', reqtype: 0, startindex: 0})
        expect(mockZnpRequest).toHaveBeenNthCalledWith(7, 4, "dataRequest", {"clusterid": 0, "data": frame.toBuffer(), "destendpoint": 20, "dstaddr": 2, "len": 6, "options": 0, "radius": 30, "srcendpoint": 1, "transid": 4}, 99)
        expect(mockZnpRequest).toHaveBeenNthCalledWith(8, 4, "dataRequest", {"clusterid": 0, "data": frame.toBuffer(), "destendpoint": 20, "dstaddr": 2, "len": 6, "options": 0, "radius": 30, "srcendpoint": 1, "transid": 5}, 99)
    });

    it('Send zcl frame network address fails because mac no ack, should retry', async () => {
        basicMocks();
        await adapter.start();
        dataConfirmCode = 233;
        mockZnpRequest.mockClear();
        const frame = Zcl.ZclFrame.create(Zcl.FrameType.GLOBAL, Zcl.Direction.CLIENT_TO_SERVER, true, null, 100, 'writeNoRsp', 0, [{attrId: 0, dataType:0, attrData: null}]);
        const response = adapter.sendZclFrameToEndpoint('0x02', 2, 20, frame, 10000, false, false);
        let error;
        try {await response} catch(e) {error = e;}

        expect(error.message).toStrictEqual("Data request failed with error: 'MAC no ack' (233)");
        expect(mockZnpRequest).toBeCalledTimes(7);
        expect(mockZnpRequest).toHaveBeenNthCalledWith(1, 4, "dataRequest", {"clusterid": 0, "data": frame.toBuffer(), "destendpoint": 20, "dstaddr": 2, "len": 6, "options": 0, "radius": 30, "srcendpoint": 1, "transid": 1}, 99)
        expect(mockZnpRequest).toHaveBeenNthCalledWith(2, 4, "dataRequest", {"clusterid": 0, "data": frame.toBuffer(), "destendpoint": 20, "dstaddr": 2, "len": 6, "options": 0, "radius": 30, "srcendpoint": 1, "transid": 2}, 99)
        expect(mockZnpRequest).toHaveBeenNthCalledWith(3, 5, 'extRouteDisc', { dstAddr: 2, options: 0, radius: 30 })
        expect(mockZnpRequest).toHaveBeenNthCalledWith(4, 4, "dataRequest", {"clusterid": 0, "data": frame.toBuffer(), "destendpoint": 20, "dstaddr": 2, "len": 6, "options": 0, "radius": 30, "srcendpoint": 1, "transid": 3}, 99)
        expect(mockZnpRequest).toHaveBeenNthCalledWith(5, 5, 'nwkAddrReq', {ieeeaddr: '0x02', reqtype: 0, startindex: 0})
        expect(mockZnpRequest).toHaveBeenNthCalledWith(6, 4, "dataRequest", {"clusterid": 0, "data": frame.toBuffer(), "destendpoint": 20, "dstaddr": 2, "len": 6, "options": 0, "radius": 30, "srcendpoint": 1, "transid": 4}, 99)
        expect(mockZnpRequest).toHaveBeenNthCalledWith(7, 4, "dataRequest", {"clusterid": 0, "data": frame.toBuffer(), "destendpoint": 20, "dstaddr": 2, "len": 6, "options": 0, "radius": 30, "srcendpoint": 1, "transid": 5}, 99)
    });

    it('Send zcl frame network address fails because mac no ack with network address change, should retry', async () => {
        basicMocks();
        await adapter.start();
        dataConfirmCode = 233;
        mockZnpRequest.mockClear();
        const frame = Zcl.ZclFrame.create(Zcl.FrameType.GLOBAL, Zcl.Direction.CLIENT_TO_SERVER, true, null, 100, 'writeNoRsp', 0, [{attrId: 0, dataType:0, attrData: null}]);
        const response = adapter.sendZclFrameToEndpoint('0x03', 2, 20, frame, 10000, false, false);
        let error;
        try {await response} catch(e) {error = e;}

        expect(error.message).toStrictEqual("Data request failed with error: 'MAC no ack' (233)");
        expect(mockZnpRequest).toBeCalledTimes(8);
        expect(mockZnpRequest).toHaveBeenNthCalledWith(1, 4, "dataRequest", {"clusterid": 0, "data": frame.toBuffer(), "destendpoint": 20, "dstaddr": 2, "len": 6, "options": 0, "radius": 30, "srcendpoint": 1, "transid": 1}, 99)
        expect(mockZnpRequest).toHaveBeenNthCalledWith(2, 4, "dataRequest", {"clusterid": 0, "data": frame.toBuffer(), "destendpoint": 20, "dstaddr": 2, "len": 6, "options": 0, "radius": 30, "srcendpoint": 1, "transid": 2}, 99)
        expect(mockZnpRequest).toHaveBeenNthCalledWith(3, 5, 'extRouteDisc', { dstAddr: 2, options: 0, radius: 30 })
        expect(mockZnpRequest).toHaveBeenNthCalledWith(4, 4, "dataRequest", {"clusterid": 0, "data": frame.toBuffer(), "destendpoint": 20, "dstaddr": 2, "len": 6, "options": 0, "radius": 30, "srcendpoint": 1, "transid": 3}, 99)
        expect(mockZnpRequest).toHaveBeenNthCalledWith(5, 5, 'nwkAddrReq', {ieeeaddr: '0x03', reqtype: 0, startindex: 0})
        expect(mockZnpRequest).toHaveBeenNthCalledWith(6, 5, 'extRouteDisc', { dstAddr: 3, options: 0, radius: 30 })
        expect(mockZnpRequest).toHaveBeenNthCalledWith(7, 4, "dataRequest", {"clusterid": 0, "data": frame.toBuffer(), "destendpoint": 20, "dstaddr": 3, "len": 6, "options": 0, "radius": 30, "srcendpoint": 1, "transid": 4}, 99)
        expect(mockZnpRequest).toHaveBeenNthCalledWith(8, 4, "dataRequest", {"clusterid": 0, "data": frame.toBuffer(), "destendpoint": 20, "dstaddr": 3, "len": 6, "options": 0, "radius": 30, "srcendpoint": 1, "transid": 5}, 99)
    });

    it('Send zcl frame network address fails because mac no ack with network address change, without recovery', async () => {
        basicMocks();
        await adapter.start();
        dataConfirmCode = 233;
        mockZnpRequest.mockClear();
        const frame = Zcl.ZclFrame.create(Zcl.FrameType.GLOBAL, Zcl.Direction.CLIENT_TO_SERVER, true, null, 100, 'writeNoRsp', 0, [{attrId: 0, dataType:0, attrData: null}]);
        const response = adapter.sendZclFrameToEndpoint('0x03', 2, 20, frame, 10000, false, true, null);
        let error;
        try {await response} catch(e) {error = e;}

        expect(error.message).toStrictEqual("Data request failed with error: 'MAC no ack' (233)");
        expect(mockZnpRequest).toBeCalledTimes(1);
    });

    it('Send zcl frame network address should retry on dataconfirm timeout', async () => {
        basicMocks();
        await adapter.start();
        dataConfirmCode = 9999;
        dataConfirmCodeReset = true;
        mockZnpRequest.mockClear();
        const frame = Zcl.ZclFrame.create(Zcl.FrameType.GLOBAL, Zcl.Direction.CLIENT_TO_SERVER, true, null, 100, 'writeNoRsp', 0, [{attrId: 0, dataType:0, attrData: null}]);
        const response = adapter.sendZclFrameToEndpoint('0x02', 2, 20, frame, 10000, false, false);
        let error;
        try {await response} catch(e) {error = e;}
        expect(error.message).toStrictEqual("Data request failed with error: 'Timeout' (9999)");
        expect(mockZnpRequest).toBeCalledTimes(1);
        expect(mockZnpRequest).toHaveBeenNthCalledWith(1, 4, "dataRequest", {"clusterid": 0, "data": frame.toBuffer(), "destendpoint": 20, "dstaddr": 2, "len": 6, "options": 0, "radius": 30, "srcendpoint": 1, "transid": 1}, 99)
    });

    it('Send zcl frame group', async () => {
        basicMocks();
        await adapter.start();

        mockZnpRequest.mockClear();
        const frame = Zcl.ZclFrame.create(Zcl.FrameType.GLOBAL, Zcl.Direction.CLIENT_TO_SERVER, true, null, 100, 'read', 0, [{attrId: 0}]);
        await adapter.sendZclFrameToGroup(25, frame, 1);
        expect(mockQueueExecute.mock.calls[0][1]).toBe(undefined);
        expect(mockZnpRequest).toBeCalledTimes(1);
        expect(mockZnpRequest).toBeCalledWith(4, "dataRequestExt", {"clusterid": 0, "data": frame.toBuffer(), "destendpoint": 255, "dstaddr": "0x0000000000000019", "len": 5, "options": 0, "radius": 30, "srcendpoint": 1, "transid": 1, "dstaddrmode": 1, "dstpanid": 0}, 99)
    });

    it('Send zcl frame group retry on MAC channel access failure', async () => {
        basicMocks();
        dataConfirmCode = 225;
        dataConfirmCodeReset = true;
        await adapter.start();
        mockZnpRequest.mockClear();
        const frame = Zcl.ZclFrame.create(Zcl.FrameType.GLOBAL, Zcl.Direction.CLIENT_TO_SERVER, false, null, 100, 'writeNoRsp', 0, [{attrId: 0, dataType:0, attrData: null}]);
        await adapter.sendZclFrameToGroup(25, frame, 1);
        expect(mockQueueExecute.mock.calls[0][1]).toBe(undefined);
        expect(mockZnpRequest).toBeCalledTimes(2);
        expect(mockZnpRequest).toBeCalledWith(4, "dataRequestExt", {"clusterid": 0, "data": frame.toBuffer(), "destendpoint": 255, "dstaddr": "0x0000000000000019", "len": 6, "options": 0, "radius": 30, "srcendpoint": 1, "transid": 1, "dstaddrmode": 1, "dstpanid": 0}, 99)
    });

    it('Send zcl frame to all', async () => {
        basicMocks();
        await adapter.start();

        mockZnpRequest.mockClear();
        const frame = Zcl.ZclFrame.create(Zcl.FrameType.GLOBAL, Zcl.Direction.CLIENT_TO_SERVER, true, null, 100, 'read', 0, [{attrId: 0}]);
        await adapter.sendZclFrameToAll(242, frame, 250);
        expect(mockQueueExecute.mock.calls[0][1]).toBe(undefined);
        expect(mockZnpRequest).toBeCalledTimes(1);
        expect(mockZnpRequest).toBeCalledWith(4, "dataRequestExt", {"clusterid": 0, "data": frame.toBuffer(), "destendpoint": 242, "dstaddr": "0x000000000000fffd", "len": 5, "options": 0, "radius": 30, "srcendpoint": 250, "transid": 1, "dstaddrmode": 2, "dstpanid": 0}, null)
    });

    it('Send zcl frame network address transaction number shouldnt go higher than 255', async () => {
        basicMocks();
        await adapter.start();
        let transactionID = 0;

        mockZnpRequest.mockClear();

        for (let i = 0; i < 300; i++) {
            if (transactionID > 200) {
                transactionID = 0;
            }

            const frame = Zcl.ZclFrame.create(Zcl.FrameType.GLOBAL, Zcl.Direction.CLIENT_TO_SERVER, true, null, 100, 'writeNoRsp', 0, [{attrId: 0, dataType:0, attrData: null}]);
            await adapter.sendZclFrameToEndpoint('0x02', 2, 20, frame, 10000, false, false);
        }

        const got = []
        for (let i = 0; i < 300; i++) {
            got.push(mockZnpRequest.mock.calls[i][2].transid);
        }

        expect(got[0]).toBe(1);
        expect(got.find((g) => g === 0)).toBe(undefined);
        expect(got.find((g) => g > 255)).toBe(undefined);
        expect(got.filter((g) => g === 1).length).toBe(2);
        expect(got.filter((g) => g === 255).length).toBe(1);
        expect(mockZnpRequest).toBeCalledTimes(300);
    });

    it('Send zcl frame group dataConfirm fails', async () => {
        basicMocks();
        await adapter.start();
        dataConfirmCode = 184;
        let error;
        mockZnpRequest.mockClear();
        const frame = Zcl.ZclFrame.create(Zcl.FrameType.GLOBAL, Zcl.Direction.CLIENT_TO_SERVER, true, null, 100, 'read', 0, [{attrId: 0}]);
        try {await adapter.sendZclFrameToGroup(25, frame);} catch (e) { error = e};
        expect(mockQueueExecute.mock.calls[0][1]).toBe(undefined);
        expect(mockZnpRequest).toBeCalledTimes(1);
        expect(mockZnpRequest).toBeCalledWith(4, "dataRequestExt", {"clusterid": 0, "data": frame.toBuffer(), "destendpoint": 255, "dstaddr": "0x0000000000000019", "len": 5, "options": 0, "radius": 30, "srcendpoint": 1, "transid": 1, "dstaddrmode": 1, "dstpanid": 0}, 99)
        expect(error.message).toStrictEqual("Data request failed with error: 'undefined' (184)");
    });

    it('Send zcl frame network address and default response', async () => {
        basicMocks();
        await adapter.start();

        mockZnpRequest.mockClear();

        const responseMismatchFrame = Zcl.ZclFrame.create(Zcl.FrameType.GLOBAL, Zcl.Direction.SERVER_TO_CLIENT, true, null, 102, 'readRsp', 0, [{attrId: 0, attrData: 5, dataType: 32, status: 0}]);
        const responseFrame = Zcl.ZclFrame.create(Zcl.FrameType.GLOBAL, Zcl.Direction.SERVER_TO_CLIENT, true, null, 100, 'readRsp', 0, [{attrId: 0, attrData: 2, dataType: 32, status: 0}]);
        const frame = Zcl.ZclFrame.create(Zcl.FrameType.GLOBAL, Zcl.Direction.CLIENT_TO_SERVER, true, null, 100, 'read', 0, [{attrId: 0}]);
        const object = {type: Type.AREQ, subsystem: Subsystem.AF, command: 'incomingMsg', payload: {clusterid: 0, srcendpoint: 20, srcaddr: 2, linkquality: 101, groupid: 12, data: responseFrame.toBuffer()}};
        const objectMismatch = {type: Type.AREQ, subsystem: Subsystem.AF, command: 'incomingMsg', payload: {clusterid: 0, srcendpoint: 20, srcaddr: 2, linkquality: 101, groupid: 12, data: responseMismatchFrame.toBuffer()}};
        const response = adapter.sendZclFrameToEndpoint('0x02', 2, 20, frame, 10000, false, false);
        znpReceived(objectMismatch);
        znpReceived(object);
        const result = await response;

        expect(mockZnpRequest).toBeCalledWith(4, "dataRequest", {"clusterid": 0, "data": frame.toBuffer(), "destendpoint": 20, "dstaddr": 2, "len": 5, "options": 0, "radius": 30, "srcendpoint": 1, "transid": 1}, 99)
        expect(mockQueueExecute.mock.calls[0][1]).toBe(2);
        expect(mockZnpRequest).toBeCalledTimes(1);
        expect(result.endpoint).toStrictEqual(20);
        expect(result.groupID).toStrictEqual(12);
        expect(result.linkquality).toStrictEqual(101);
        expect(result.address).toStrictEqual(2);
        expect(deepClone(result.frame)).toStrictEqual(deepClone(responseFrame));
    });

    it('Send zcl frame network address and default response', async () => {
        basicMocks();
        await adapter.start();

        mockZnpRequest.mockClear();

        const responseMismatchFrame = Zcl.ZclFrame.create(Zcl.FrameType.GLOBAL, Zcl.Direction.SERVER_TO_CLIENT, true, null, 102, 'readRsp', 0, [{attrId: 0, attrData: 5, dataType: 32, status: 0}]);
        const responseFrame = Zcl.ZclFrame.create(Zcl.FrameType.GLOBAL, Zcl.Direction.SERVER_TO_CLIENT, true, null, 100, 'readRsp', 0, [{attrId: 0, attrData: 2, dataType: 32, status: 0}]);
        const frame = Zcl.ZclFrame.create(Zcl.FrameType.GLOBAL, Zcl.Direction.CLIENT_TO_SERVER, false, null, 100, 'read', 0, [{attrId: 0}]);
        const object = {type: Type.AREQ, subsystem: Subsystem.AF, command: 'incomingMsg', payload: {clusterid: 0, srcendpoint: 20, srcaddr: 2, linkquality: 101, groupid: 12, data: responseFrame.toBuffer()}};
        const objectMismatch = {type: Type.AREQ, subsystem: Subsystem.AF, command: 'incomingMsg', payload: {clusterid: 0, srcendpoint: 20, srcaddr: 2, linkquality: 101, groupid: 12, data: responseMismatchFrame.toBuffer()}};
        const defaultReponse = Zcl.ZclFrame.create(Zcl.FrameType.GLOBAL, Zcl.Direction.SERVER_TO_CLIENT, true, null, 100, 'defaultRsp', 0, {cmdId: 0, status: 0});
        const defaultObject = {type: Type.AREQ, subsystem: Subsystem.AF, command: 'incomingMsg', payload: {clusterid: 0, srcendpoint: 20, srcaddr: 2, linkquality: 101, groupid: 12, data: defaultReponse.toBuffer()}};
        const response = adapter.sendZclFrameToEndpoint('0x02', 2, 20, frame, 10000, false, false);
        znpReceived(objectMismatch);
        znpReceived(defaultObject);
        znpReceived(object);
        const result = await response;

        expect(mockZnpRequest).toBeCalledWith(4, "dataRequest", {"clusterid": 0, "data": frame.toBuffer(), "destendpoint": 20, "dstaddr": 2, "len": 5, "options": 0, "radius": 30, "srcendpoint": 1, "transid": 1}, 99)
        expect(mockQueueExecute.mock.calls[0][1]).toBe(2);
        expect(mockZnpRequest).toBeCalledTimes(1);
        expect(result.endpoint).toStrictEqual(20);
        expect(result.groupID).toStrictEqual(12);
        expect(result.linkquality).toStrictEqual(101);
        expect(result.address).toStrictEqual(2);
        expect(deepClone(result.frame)).toStrictEqual(deepClone(responseFrame));
    });

    it('Send zcl frame network address data confirm fails with default response', async () => {
        basicMocks();
        await adapter.start();
        dataConfirmCode = 201;
        const frame = Zcl.ZclFrame.create(Zcl.FrameType.GLOBAL, Zcl.Direction.CLIENT_TO_SERVER, false, null, 100, 'read', 0, [{attrId: 0}]);
        let error;
        try {await adapter.sendZclFrameToEndpoint('0x02', 2, 20, frame, 10000, false, false)} catch (e) {error = e;}
        expect(error.message).toStrictEqual("Data request failed with error: 'undefined' (201)");
    });

    it('Send zcl frame network address data confirm fails without default response', async () => {
        basicMocks();
        await adapter.start();
        dataConfirmCode = 201;
        const frame = Zcl.ZclFrame.create(Zcl.FrameType.GLOBAL, Zcl.Direction.CLIENT_TO_SERVER, true, null, 100, 'read', 0, [{attrId: 0}]);
        let error;
        try {await adapter.sendZclFrameToEndpoint('0x02', 2, 20, frame, 10000, false, false)} catch (e) {error = e;}
        expect(error.message).toStrictEqual("Data request failed with error: 'undefined' (201)");
    });

    it('Send zcl frame network address timeout should discover route and retry', async () => {
        basicMocks();
        await adapter.start();

        mockZnpRequest.mockClear();

        const responseMismatchFrame = Zcl.ZclFrame.create(Zcl.FrameType.GLOBAL, Zcl.Direction.SERVER_TO_CLIENT, true, null, 102, 'readRsp', 0, [{attrId: 0, attrData: 5, dataType: 32, status: 0}]);
        const frame = Zcl.ZclFrame.create(Zcl.FrameType.GLOBAL, Zcl.Direction.CLIENT_TO_SERVER, false, null, 100, 'read', 0, [{attrId: 0}]);
        const objectMismatch = {type: Type.AREQ, subsystem: Subsystem.AF, command: 'incomingMsg', payload: {clusterid: 0, srcendpoint: 20, srcaddr: 2, linkquality: 101, groupid: 12, data: responseMismatchFrame.toBuffer()}};
        let error;
        try {
            mockSetTimeout();
            const response = adapter.sendZclFrameToEndpoint('0x02', 2, 20, frame, 1, false, false);
            znpReceived(objectMismatch);
            await response;
        } catch (e) {
            error = e;
        }

        expect(mockQueueExecute.mock.calls[0][1]).toBe(2);
        expect(mockZnpRequest).toBeCalledTimes(3);
        expect(mockZnpRequest).toHaveBeenNthCalledWith(1, 4, "dataRequest", {"clusterid": 0, "data": frame.toBuffer(), "destendpoint": 20, "dstaddr": 2, "len": 5, "options": 0, "radius": 30, "srcendpoint": 1, "transid": 1}, 99)
        expect(mockZnpRequest).toHaveBeenNthCalledWith(2, 5, 'extRouteDisc', {dstAddr: 2, options: 0, radius: Constants.AF.DEFAULT_RADIUS})
        expect(mockZnpRequest).toHaveBeenNthCalledWith(3, 4, "dataRequest", {"clusterid": 0, "data": frame.toBuffer(), "destendpoint": 20, "dstaddr": 2, "len": 5, "options": 0, "radius": 30, "srcendpoint": 1, "transid": 2}, 99)
        expect(error).toStrictEqual(new Error("Timeout - 2 - 20 - 100 - 0 - 1 after 1ms"));
    });

    it('Send zcl frame network address with default response timeout shouldnt care because command has response', async () => {
        basicMocks();
        await adapter.start();

        mockZnpRequest.mockClear();
        const responseFrame = Zcl.ZclFrame.create(Zcl.FrameType.GLOBAL, Zcl.Direction.SERVER_TO_CLIENT, true, null, 100, 'readRsp', 0, [{attrId: 0, attrData: 2, dataType: 32, status: 0}]);
        const frame = Zcl.ZclFrame.create(Zcl.FrameType.GLOBAL, Zcl.Direction.CLIENT_TO_SERVER, false, null, 100, 'read', 0, [{attrId: 0}]);
        const object = {type: Type.AREQ, subsystem: Subsystem.AF, command: 'incomingMsg', payload: {clusterid: 0, srcendpoint: 20, srcaddr: 2, linkquality: 101, groupid: 12, data: responseFrame.toBuffer()}};
        const response = adapter.sendZclFrameToEndpoint('0x02', 2, 20, frame, 10000, false, false);
        znpReceived(object);

        let error = null;
        try {await response} catch (e) {error = e;}
        expect(mockZnpRequest).toBeCalledWith(4, "dataRequest", {"clusterid": 0, "data": frame.toBuffer(), "destendpoint": 20, "dstaddr": 2, "len": 5, "options": 0, "radius": 30, "srcendpoint": 1, "transid": 1}, 99)
        expect(mockQueueExecute.mock.calls[0][1]).toBe(2);
        expect(mockZnpRequest).toBeCalledTimes(1);
        expect(error).toStrictEqual(null);
    });

    it('Supports backup', async () => {
        basicMocks();
        await adapter.start();
        expect(await adapter.supportsBackup()).toBeTruthy();
    });

    it('LQI', async () => {
        basicMocks();
        await adapter.start();
        mockZnpRequest.mockClear();

        const result = await adapter.lqi(203);
        expect(mockQueueExecute.mock.calls[0][1]).toBe(203);
        expect(mockZnpRequest).toBeCalledTimes(3);
        expect(mockZnpRequest).toBeCalledWith(Subsystem.ZDO, 'mgmtLqiReq', {dstaddr: 203, startindex: 0}, 1);
        expect(mockZnpRequest).toBeCalledWith(Subsystem.ZDO, 'mgmtLqiReq', {dstaddr: 203, startindex: 2}, 1);
        expect(mockZnpRequest).toBeCalledWith(Subsystem.ZDO, 'mgmtLqiReq', {dstaddr: 203, startindex: 4}, 1);
        expect(result).toStrictEqual({"neighbors":[{"linkquality":10,"networkAddress":2,"ieeeAddr":3,"relationship":3,"depth":1},{"linkquality":15,"networkAddress":3,"ieeeAddr":4,"relationship":2,"depth":5},{"linkquality":10,"networkAddress":2,"ieeeAddr":3,"relationship":3,"depth":1},{"linkquality":15,"networkAddress":3,"ieeeAddr":4,"relationship":2,"depth":5},{"linkquality":10,"networkAddress":5,"ieeeAddr":6,"relationship":3,"depth":1},{"linkquality":15,"networkAddress":7,"ieeeAddr":8,"relationship":2,"depth":5}]});
    });

    it('LQI fails', async () => {
        basicMocks();
        await adapter.start();
        mockZnpRequest.mockClear();

        let error;
        try {await adapter.lqi(204)} catch (e) {error = e};
        expect(error).toStrictEqual(new Error("LQI for '204' failed"));
        expect(mockQueueExecute.mock.calls[0][1]).toBe(204);
        expect(mockZnpRequest).toBeCalledTimes(1);
        expect(mockZnpRequest).toBeCalledWith(Subsystem.ZDO, 'mgmtLqiReq', {dstaddr: 204, startindex: 0}, 1)
    });

    it('Routing table', async () => {
        basicMocks();
        await adapter.start();
        mockZnpRequest.mockClear();

        const result = await adapter.routingTable(205);
        expect(mockQueueExecute.mock.calls[0][1]).toBe(205);
        expect(mockZnpRequest).toBeCalledTimes(3);
        expect(mockZnpRequest).toBeCalledWith(Subsystem.ZDO, 'mgmtRtgReq', {dstaddr: 205, startindex: 0}, 1)
        expect(mockZnpRequest).toBeCalledWith(Subsystem.ZDO, 'mgmtRtgReq', {dstaddr: 205, startindex: 2}, 1)
        expect(mockZnpRequest).toBeCalledWith(Subsystem.ZDO, 'mgmtRtgReq', {dstaddr: 205, startindex: 4}, 1)
        expect(result).toStrictEqual({"table":[{"destinationAddress":10,"status":"OK","nextHop":3},{"destinationAddress":11,"status":"OK","nextHop":3},{"destinationAddress":10,"status":"OK","nextHop":3},{"destinationAddress":11,"status":"OK","nextHop":3},{"destinationAddress":12,"status":"OK","nextHop":3},{"destinationAddress":13,"status":"OK","nextHop":3}]});
    });

    it('Routing table fails', async () => {
        basicMocks();
        await adapter.start();
        mockZnpRequest.mockClear();

        let error;
        try {await adapter.routingTable(206)} catch (e) {error = e};
        expect(error).toStrictEqual(new Error("Routing table for '206' failed"));
        expect(mockQueueExecute.mock.calls[0][1]).toBe(206);
        expect(mockZnpRequest).toBeCalledTimes(1);
        expect(mockZnpRequest).toBeCalledWith(Subsystem.ZDO, 'mgmtRtgReq', {dstaddr: 206, startindex: 0}, 1)
    });

    it('Bind endpoint', async () => {
        basicMocks();
        await adapter.start();
        mockZnpRequest.mockClear();

        const result = await adapter.bind(301, '0x01', 1, 1, '0x02', 'endpoint', 1);
        expect(mockQueueExecute.mock.calls[0][1]).toBe(301);
        expect(mockZnpRequest).toBeCalledTimes(1);
        expect(mockZnpRequest).toBeCalledWith(Subsystem.ZDO, 'bindReq', {"clusterid": 1, "dstaddr": 301, "dstaddress": "0x02", "dstaddrmode": 3, "dstendpoint": 1, "srcaddr": "0x01", "srcendpoint": 1}, 1);
    });

    it('Bind group', async () => {
        basicMocks();
        await adapter.start();
        mockZnpRequest.mockClear();

        const result = await adapter.bind(301, "0x129", 1, 1, 4, "group", null);
        expect(mockQueueExecute.mock.calls[0][1]).toBe(301);
        expect(mockZnpRequest).toBeCalledTimes(1);
        expect(mockZnpRequest).toBeCalledWith(Subsystem.ZDO, 'bindReq', {"clusterid": 1, "dstaddr": 301, "dstaddress": "0x0000000000000004", "dstaddrmode": 1, "dstendpoint": 0xFF, "srcaddr": "0x129", "srcendpoint": 1}, 1);
    });

    it('Unbind', async () => {
        basicMocks();
        await adapter.start();
        mockZnpRequest.mockClear();

        const result = await adapter.unbind(301, '0x01', 1, 1, '0x02', "endpoint", 1);
        expect(mockQueueExecute.mock.calls[0][1]).toBe(301);
        expect(mockZnpRequest).toBeCalledTimes(1);
        expect(mockZnpRequest).toBeCalledWith(Subsystem.ZDO, 'unbindReq', {"clusterid": 1, "dstaddr": 301, "dstaddress": "0x02", "dstaddrmode": 3, "dstendpoint": 1, "srcaddr": "0x01", "srcendpoint": 1}, 1);
    });

    it('Unbind group', async () => {
        basicMocks();
        await adapter.start();
        mockZnpRequest.mockClear();

        const result = await adapter.unbind(301, "0x129", 1, 1, 4, "group", null);
        expect(mockQueueExecute.mock.calls[0][1]).toBe(301);
        expect(mockZnpRequest).toBeCalledTimes(1);
        expect(mockZnpRequest).toBeCalledWith(Subsystem.ZDO, 'unbindReq', {"clusterid": 1, "dstaddr": 301, "dstaddress": "0x0000000000000004", "dstaddrmode": 1, "dstendpoint": 0xFF, "srcaddr": "0x129", "srcendpoint": 1}, 1);
    });

    it('Remove device', async () => {
        basicMocks();
        await adapter.start();
        mockZnpRequest.mockClear();

        const result = await adapter.removeDevice(401, '0x01');
        expect(mockQueueExecute.mock.calls[0][1]).toBe(401);
        expect(mockZnpRequest).toBeCalledTimes(1);
        expect(mockZnpRequest).toBeCalledWith(Subsystem.ZDO, 'mgmtLeaveReq', {"deviceaddress": "0x01", "dstaddr": 401, "removechildrenRejoin": 0}, 1);
    });

    it('Incoming message extended', async () => {
        basicMocks();
        await adapter.start();
        let zclData;
        const responseFrame = Zcl.ZclFrame.create(Zcl.FrameType.GLOBAL, Zcl.Direction.SERVER_TO_CLIENT, true, null, 100, 'readRsp', 0, [{attrId: 0, attrData: 2, dataType: 32, status: 0}]);
        const object = {type: Type.AREQ, subsystem: Subsystem.AF, command: 'incomingMsgExt', payload: {clusterid: 0, srcendpoint: 20, srcaddr: 2, linkquality: 101, groupid: 12, data: responseFrame.toBuffer()}};
        adapter.on("zclData", (p) => {zclData = p;})
        znpReceived(object);
        expect(zclData.endpoint).toStrictEqual(20);
        expect(zclData.groupID).toStrictEqual(12);
        expect(zclData.linkquality).toStrictEqual(101);
        expect(zclData.address).toStrictEqual(2);
        expect(deepClone(zclData.frame)).toStrictEqual(deepClone(responseFrame));
    });

    it('Incoming message raw (not ZCL)', async () => {
        basicMocks();
        await adapter.start();
        let rawData;
        const object = {type: Type.AREQ, subsystem: Subsystem.AF, command: 'incomingMsg', payload: {clusterid: 1, srcendpoint: 20, srcaddr: 2, linkquality: 101, groupid: 12, data: Buffer.from([0x0, 0x1])}};
        adapter.on("rawData", (p) => {rawData = p;})
        znpReceived(object);
        expect(rawData.clusterID).toStrictEqual(1);
        expect(rawData.endpoint).toStrictEqual(20);
        expect(rawData.groupID).toStrictEqual(12);
        expect(rawData.linkquality).toStrictEqual(101);
        expect(rawData.address).toStrictEqual(2);
        expect(rawData.data).toStrictEqual(Buffer.from([0x0, 0x01]));
    });

    it('Adapter disconnected', async () => {
        basicMocks();
        await adapter.start();
        let closeEvent = false;
        adapter.on("disconnected", () => {closeEvent = true;})
        znpClose();
        expect(closeEvent).toBeTruthy();
    });

    it('Adapter disconnected dont emit when closing', async () => {
        basicMocks();
        await adapter.start();
        await adapter.stop();
        let closeEvent = false;
        adapter.on("disconnected", () => {closeEvent = true;})
        znpClose();
        expect(closeEvent).toBeFalsy();
    });

    it('Device joined', async () => {
        basicMocks();
        await adapter.start();
        let deviceJoin;
        const object = {type: Type.AREQ, subsystem: Subsystem.ZDO, command: 'tcDeviceInd', payload: {nwkaddr: 123, extaddr: '0x123'}};
        adapter.on("deviceJoined", (p) => {deviceJoin = p;})
        znpReceived(object);
        expect(deviceJoin).toStrictEqual({ieeeAddr: '0x123', networkAddress: 123});
    });

    it('Device announce', async () => {
        basicMocks();
        await adapter.start();
        let deviceAnnounce;
        mockZnpRequest.mockClear();
        const object = {type: Type.AREQ, subsystem: Subsystem.ZDO, command: 'endDeviceAnnceInd', payload: {nwkaddr: 123, ieeeaddr: '0x123', capabilities: 142}};
        adapter.on("deviceAnnounce", (p) => {deviceAnnounce = p;})
        znpReceived(object);
        expect(deviceAnnounce).toStrictEqual({ieeeAddr: '0x123', networkAddress: 123});
        expect(mockZnpRequest).toBeCalledTimes(0);
    });

    it('Device announce should discover route to end devices', async () => {
        basicMocks();
        await adapter.start();
        let deviceAnnounce;
        mockZnpRequest.mockClear();
        const object = {type: Type.AREQ, subsystem: Subsystem.ZDO, command: 'endDeviceAnnceInd', payload: {nwkaddr: 123, ieeeaddr: '0x123', capabilities: 4}};
        adapter.on("deviceAnnounce", (p) => {deviceAnnounce = p;})
        znpReceived(object);
        expect(deviceAnnounce).toStrictEqual({ieeeAddr: '0x123', networkAddress: 123});
        expect(mockZnpRequest).toBeCalledTimes(1);
        expect(mockZnpRequest).toBeCalledWith(Subsystem.ZDO, 'extRouteDisc', {dstAddr: 123, options: 0, radius: 30});

        // Should debounce route discovery.
        znpReceived(object);
        expect(deviceAnnounce).toStrictEqual({ieeeAddr: '0x123', networkAddress: 123});
        expect(mockZnpRequest).toBeCalledTimes(1);
        expect(mockZnpRequest).toBeCalledWith(Subsystem.ZDO, 'extRouteDisc', {dstAddr: 123, options: 0, radius: 30});
    });

    it('Network address response', async () => {
        basicMocks();
        await adapter.start();
        let networkAddress;
        const object = {type: Type.AREQ, subsystem: Subsystem.ZDO, command: 'nwkAddrRsp', payload: {nwkaddr: 124, ieeeaddr: '0x123'}};
        adapter.on("networkAddress", (p) => {networkAddress = p;})
        znpReceived(object);
        expect(networkAddress).toStrictEqual({ieeeAddr: '0x123', networkAddress: 124});
    });

    it('Device leave', async () => {
        basicMocks();
        await adapter.start();
        let deviceAnnounce;
        const object = {type: Type.AREQ, subsystem: Subsystem.ZDO, command: 'leaveInd', payload: {srcaddr: 123, extaddr: '0x123'}};
        adapter.on("deviceLeave", (p) => {deviceAnnounce = p;})
        znpReceived(object);
        expect(deviceAnnounce).toStrictEqual({ieeeAddr: '0x123', networkAddress: 123});
    });

    it('Do nothing wiht non areq event', async () => {
        basicMocks();
        await adapter.start();
        let deviceAnnounce;
        const object = {type: Type.SREQ, subsystem: Subsystem.ZDO, command: 'leaveInd', payload: {srcaddr: 123, extaddr: '0x123'}};
        adapter.on("deviceLeave", (p) => {deviceAnnounce = p;})
        znpReceived(object);
        expect(deviceAnnounce).toStrictEqual(undefined);
    });

    it('Get network parameters', async () => {
        basicMocks();
        await adapter.start();
        mockZnpRequest.mockClear();
        const result = await adapter.getNetworkParameters();
        expect(mockZnpRequest).toBeCalledTimes(1);
        expect(mockZnpRequest).toBeCalledWith(Subsystem.ZDO, 'extNwkInfo', {});
        expect(result).toStrictEqual({channel: 21, extendedPanID: "0x00124b0009d69f77", panID: 123});
    });

    it('Set interpan channel', async () => {
        basicMocks();
        await adapter.start();
        mockZnpRequest.mockClear();
        await adapter.setChannelInterPAN(14);
        expect(mockZnpRequest).toBeCalledTimes(2);
        expect(mockZnpRequest).toBeCalledWith(Subsystem.AF, 'interPanCtl', {cmd: 1, data: [14]});
        expect(mockZnpRequest).toBeCalledWith(Subsystem.AF, 'interPanCtl', {cmd: 2, data: [12]});

        mockZnpRequest.mockClear();
        await adapter.setChannelInterPAN(15);
        expect(mockZnpRequest).toBeCalledTimes(1);
        expect(mockZnpRequest).toBeCalledWith(Subsystem.AF, 'interPanCtl', {cmd: 1, data: [15]});
    });

    it('Restore interpan channel', async () => {
        basicMocks();
        await adapter.start();
        mockZnpRequest.mockClear();
        const result = await adapter.restoreChannelInterPAN();
        expect(mockZnpRequest).toBeCalledTimes(1);
        expect(mockZnpRequest).toBeCalledWith(Subsystem.AF, 'interPanCtl', {cmd: 0, data: []});
    });

    it('Send zcl frame interpan', async () => {
        basicMocks();
        await adapter.start();
        mockZnpRequest.mockClear();
        const result = await adapter.sendZclFrameInterPANToIeeeAddr(touchlinkIdentifyRequest, '0x0017880104c9cd33');
        expect(mockZnpRequest).toBeCalledTimes(1);
        expect(mockZnpRequest).toBeCalledWith(4, "dataRequestExt", {"clusterid": 4096, "data": touchlinkIdentifyRequest.toBuffer(), "destendpoint": 254, "dstaddr": '0x0017880104c9cd33', "len": 9, "options": 0, "radius": 30, "srcendpoint": 12, "transid": 1, "dstaddrmode": 3, "dstpanid": 65535}, null)
    });

    it('Send zcl frame interpan with response', async () => {
        basicMocks();
        await adapter.start();
        mockZnpRequest.mockClear();
        const object = {type: Type.AREQ, subsystem: Subsystem.AF, command: 'incomingMsgExt', payload: {clusterid: 4096, srcendpoint: 0xFE, srcaddr: 12394, linkquality: 101, groupid: 0, data: touchlinkScanResponse.toBuffer()}};

        let result: ZclDataPayload | Promise<ZclDataPayload> = adapter.sendZclFrameInterPANBroadcast(touchlinkScanRequest, 1000);
        znpReceived(object);
        result = await result;

        expect(mockZnpRequest).toBeCalledTimes(1);
        expect(mockZnpRequest).toBeCalledWith(4, "dataRequestExt", {"clusterid": 4096, "data": touchlinkScanRequest.toBuffer(), "destendpoint": 254, "dstaddr": "0x000000000000ffff", "len": 9, "options": 0, "radius": 30, "srcendpoint": 12, "transid": 1, "dstaddrmode": 2, "dstpanid": 65535}, null);
        expect(deepClone(result)).toStrictEqual({"wasBroadcast":false,"frame":{"Header":{"frameControl":{"frameType":1,"manufacturerSpecific":false,"direction":1,"disableDefaultResponse":false,"reservedBits":0},"transactionSequenceNumber":12,"manufacturerCode":null,"commandIdentifier":1},"Payload":{"transactionID":1,"rssiCorrection":10,"zigbeeInformation":5,"touchlinkInformation":6,"keyBitmask":12,"responseID":11,"extendedPanID":"0x0017210104d9cd33","networkUpdateID":1,"logicalChannel":12,"panID":13,"networkAddress":5,"numberOfSubDevices":10,"totalGroupIdentifiers":5},"Cluster":{"ID":4096,"attributes":{},"name":"touchlink","commands":{"scanRequest":{"ID":0,"response":1,"parameters":[{"name":"transactionID","type":35},{"name":"zigbeeInformation","type":24},{"name":"touchlinkInformation","type":24}],"name":"scanRequest"},"identifyRequest":{"ID":6,"parameters":[{"name":"transactionID","type":35},{"name":"duration","type":33}],"name":"identifyRequest"},"resetToFactoryNew":{"ID":7,"parameters":[{"name":"transactionID","type":35}],"name":"resetToFactoryNew"}},"commandsResponse":{"scanResponse":{"ID":1,"parameters":[{"name":"transactionID","type":35},{"name":"rssiCorrection","type":32},{"name":"zigbeeInformation","type":32},{"name":"touchlinkInformation","type":32},{"name":"keyBitmask","type":33},{"name":"responseID","type":35},{"name":"extendedPanID","type":240},{"name":"networkUpdateID","type":32},{"name":"logicalChannel","type":32},{"name":"panID","type":33},{"name":"networkAddress","type":33},{"name":"numberOfSubDevices","type":32},{"name":"totalGroupIdentifiers","type":32}],"name":"scanResponse"}}},"Command":{"ID":1,"parameters":[{"name":"transactionID","type":35},{"name":"rssiCorrection","type":32},{"name":"zigbeeInformation","type":32},{"name":"touchlinkInformation","type":32},{"name":"keyBitmask","type":33},{"name":"responseID","type":35},{"name":"extendedPanID","type":240},{"name":"networkUpdateID","type":32},{"name":"logicalChannel","type":32},{"name":"panID","type":33},{"name":"networkAddress","type":33},{"name":"numberOfSubDevices","type":32},{"name":"totalGroupIdentifiers","type":32}],"name":"scanResponse"}},"address":12394,"endpoint":254,"linkquality":101,"groupID":0});
    });

    it('Send zcl frame interpan throw exception when command has no response', async () => {
        basicMocks();
        await adapter.start();
        mockZnpRequest.mockClear();
        let error;
        try { await adapter.sendZclFrameInterPANBroadcast(touchlinkIdentifyRequest, 1000)} catch (e) { error = e};
        expect(error).toStrictEqual(new Error(`Command 'identifyRequest' has no response, cannot wait for response`))
    });

    it('Send zcl frame interpan throw exception data request fails', async () => {
        basicMocks();
        dataRequestExtCode = 99;
        await adapter.start();
        mockZnpRequest.mockClear();
        let error;
        try { await adapter.sendZclFrameInterPANBroadcast(touchlinkScanRequest, 1000)} catch (e) { error = e};
        expect(error).toStrictEqual(new Error(`Data request failed with code '99'`))
    });

    it('Refuse to start when ping fails', async () => {
        mockZnpRequest.mockImplementation((subsystem, command, payload, expectedStatus) => {
            const missing = () => {
                const msg = `Not implemented - ${Subsystem[subsystem]} - ${command} - ${JSON.stringify(payload)}`;
                console.log(msg)
                throw new Error(msg);
            }

            if (subsystem === Subsystem.SYS && command === 'ping') {
                throw new Error('Couldnt lock port');
            } else {
                missing();
            }
        });

        let error;
        try {await adapter.start()} catch (e) {error = e}
        expect(error).toStrictEqual(new Error('Failed to connect to the adapter (Error: Couldnt lock port)'));
    });

    it('Wait for', async () => {
        basicMocks();
        await adapter.start();

        const responseFrame = Zcl.ZclFrame.create(Zcl.FrameType.GLOBAL, Zcl.Direction.SERVER_TO_CLIENT, true, null, 100, 'readRsp', 0, [{attrId: 0, attrData: 2, dataType: 32, status: 0}]);
        const object = {type: Type.AREQ, subsystem: Subsystem.AF, command: 'incomingMsg', payload: {clusterid: 0, srcendpoint: 20, srcaddr: 2, linkquality: 101, groupid: 12, data: responseFrame.toBuffer()}};
        const wait = adapter.waitFor(2, 20, 0, 1, 100, 0, 1, 10);
        znpReceived(object);
        const result = await wait.promise;
        expect(result.endpoint).toStrictEqual(20);
        expect(result.groupID).toStrictEqual(12);
        expect(result.linkquality).toStrictEqual(101);
        expect(result.address).toStrictEqual(2);
        expect(deepClone(result.frame)).toStrictEqual(deepClone(responseFrame));
    });

    it('Command should fail when in interpan', async () => {
        const frame = Zcl.ZclFrame.create(Zcl.FrameType.GLOBAL, Zcl.Direction.CLIENT_TO_SERVER, true, null, 100, 'writeNoRsp', 0, [{attrId: 0, dataType:0, attrData: null}]);
        basicMocks();
        await adapter.start();

        await adapter.setChannelInterPAN(14);
        mockZnpRequest.mockClear();
        let error;
        try {await adapter.sendZclFrameToEndpoint('0x02', 2, 20, frame, 10000, false, false)} catch (e) {error = e;}
        expect(error).toStrictEqual(new Error('Cannot execute command, in Inter-PAN mode'));
        expect(mockZnpRequest).toBeCalledTimes(0);

        await adapter.restoreChannelInterPAN();
        mockZnpRequest.mockClear();

        await adapter.sendZclFrameToEndpoint('0x02', 2, 20, frame, 10000, false, false);
        expect(mockZnpRequest).toBeCalledTimes(1);
    });
});
