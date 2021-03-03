import "regenerator-runtime/runtime";
import {ZStackAdapter} from '../../../src/adapter/z-stack/adapter';
import {DevStates, NvItemsIds, ZnpCommandStatus} from "../../../src/adapter/z-stack/constants/common";
import {Subsystem, Type} from "../../../src/adapter/z-stack/unpi/constants";
import equalsPartial from "../../../src/utils/equalsPartial";
import equals from "fast-deep-equal/es6";
import {ZnpVersion} from "../../../src/adapter/z-stack/adapter/tstype";
import * as Structs from "../../../src/adapter/z-stack/structs"
import * as fs from "fs";
import * as path from "path";

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

const serialPortOptions = {
    baudRate: 800,
    rtscts: false,
    path: 'dummy',
};

const backup1 = JSON.parse(`
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
        newBuilder.responders = [...this.responders];
        newBuilder.nvItems = this.nvItems.map(item => ({ id: item.id, value: Buffer.from(item.value) }));
        return newBuilder;
    }
}

const baseZnpRequestMock = new ZnpRequestMockBuilder()
    .handle(Subsystem.SYS, "version", payload => equals(payload, {}) ? { payload: { product: ZnpVersion.zStack30x } } : undefined)
    .handle(Subsystem.SYS, "ping", () => ({}))
    .handle(Subsystem.ZDO, "extFindGroup", () => ({ payload: { status: 0 }}))
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
const mockZnpWaitFor = jest.fn().mockImplementation((type, subsystem, command, payload) => {
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
const mockZnpOpen = jest.fn();
const mockZnpClose = jest.fn();
const mockQueueExecute = jest.fn().mockImplementation(async (func) => await func());
const mocks = [mockZnpOpen, mockZnpRequest, mockZnpClose];

const mockZnpRequestWith = (builder: ZnpRequestMockBuilder) => {
    mockZnpRequest.mockImplementation((subsystem: Subsystem, command: string, payload: any, expectedStatus: ZnpCommandStatus) => builder.execute({subsystem, command, payload}));
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
        mocks.forEach((m) => m.mockRestore());
        mockQueueExecute.mockClear();
        mockZnpWaitFor.mockClear();
    });

    it("should commission network with 3.0.x adapter", async () => {
        mockZnpRequestWith(empty3AlignedRequestMock);
        const result = await adapter.start();
        expect(result).toBe("reset");
    });

    it("should start network with 3.0.x adapter", async () => {
        mockZnpRequestWith(commissioned3AlignedRequestMock);
        const result = await adapter.start();
        expect(result).toBe("resumed");
    });

    it("should restore unified backup with 3.0.x adapter - empty adapter", async () => {
        const backupFile = getTempFile();
        fs.writeFileSync(backupFile, JSON.stringify(backup1), "utf8");
        adapter = new ZStackAdapter(networkOptions, serialPortOptions, backupFile, {concurrent: 3});
        mockZnpRequestWith(empty3AlignedRequestMock);
        const result = await adapter.start();
        expect(result).toBe("restored");
    });

    it("should start network with 3.0.x adapter - resume in coordinator mode", async () => {
        mockZnpRequestWith(
            commissioned3AlignedRequestMock.clone()
                .handle(Subsystem.UTIL, "getDeviceInfo", () => ({payload: {devicestate: DevStates.ZB_COORD}}))
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
