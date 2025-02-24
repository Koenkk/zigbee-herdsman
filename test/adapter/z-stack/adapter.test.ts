import * as fs from 'node:fs';
import * as path from 'node:path';

import equals from 'fast-deep-equal/es6';

import {ZclPayload} from '../../../src/adapter/events';
import {ZnpVersion} from '../../../src/adapter/z-stack/adapter/tstype';
import {ZStackAdapter} from '../../../src/adapter/z-stack/adapter/zStackAdapter';
import * as Constants from '../../../src/adapter/z-stack/constants';
import {AddressMode, DevStates, NvItemsIds, NvSystemIds, ZnpCommandStatus} from '../../../src/adapter/z-stack/constants/common';
import * as Structs from '../../../src/adapter/z-stack/structs';
import {Subsystem, Type} from '../../../src/adapter/z-stack/unpi/constants';
import {Znp, ZpiObject} from '../../../src/adapter/z-stack/znp';
import Definition from '../../../src/adapter/z-stack/znp/definition';
import {ZpiObjectPayload} from '../../../src/adapter/z-stack/znp/tstype';
import {UnifiedBackupStorage} from '../../../src/models';
import {setLogger} from '../../../src/utils/logger';
import * as ZSpec from '../../../src/zspec';
import {BroadcastAddress} from '../../../src/zspec/enums';
import * as Zcl from '../../../src/zspec/zcl';
import * as Zdo from '../../../src/zspec/zdo';
import {
    ActiveEndpointsResponse,
    EndDeviceAnnounce,
    LQITableResponse,
    NetworkAddressResponse,
    NodeDescriptorResponse,
    RoutingTableResponse,
    SimpleDescriptorResponse,
} from '../../../src/zspec/zdo/definition/tstypes';

const DUMMY_NODE_DESC_RSP_CAPABILITIES = {
    allocateAddress: 0,
    alternatePANCoordinator: 0,
    deviceType: 2,
    powerSource: 0,
    reserved1: 0,
    reserved2: 0,
    rxOnWhenIdle: 0,
    securityCapability: 0,
};

const mockLogger = {
    debug: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
    error: vi.fn(),
};
const deepClone = (obj) => JSON.parse(JSON.stringify(obj));
const mockSetTimeout = () => {
    return vi.spyOn(globalThis, 'setTimeout').mockImplementation(
        // @ts-expect-error mock
        (cb) => cb(),
    );
};

vi.mock('../../../src/utils/wait', () => ({
    wait: vi.fn(() => {
        return new Promise<void>((resolve) => resolve());
    }),
}));

const waitForResult = (payloadOrPromise: Promise<unknown> | ZpiObjectPayload, ID?: number) => {
    ID = ID || 1;
    if (payloadOrPromise instanceof Promise) {
        return {
            start: () => {
                return {promise: payloadOrPromise, ID};
            },
            ID,
        };
    } else {
        return {
            start: () => {
                return {promise: new Promise((r) => r(payloadOrPromise)), ID};
            },
            ID,
        };
    }
};

const networkOptions = {
    panID: 123,
    extendedPanID: [0x00, 0x12, 0x4b, 0x00, 0x09, 0xd6, 0x9f, 0x77],
    channelList: [21],
    networkKey: [1, 3, 5, 7, 9, 11, 13, 15, 0, 2, 4, 6, 8, 10, 12, 13],
    networkKeyDistribute: false,
};

const networkOptionsDefaultExtendedPanId = {
    panID: 123,
    extendedPanID: [0xdd, 0xdd, 0xdd, 0xdd, 0xdd, 0xdd, 0xdd, 0xdd],
    channelList: [21],
    networkKey: [1, 3, 5, 7, 9, 11, 13, 15, 0, 2, 4, 6, 8, 10, 12, 13],
    networkKeyDistribute: false,
};

const networkOptionsMismatched = {
    panID: 124,
    extendedPanID: [0x00, 0x12, 0x4b, 0x00, 0x09, 0xd6, 0x9f, 0x77],
    channelList: [21],
    networkKey: [1, 3, 5, 7, 9, 11, 13, 15, 0, 2, 4, 6, 8, 10, 12, 13],
    networkKeyDistribute: false,
};

const networkOptionsInvalidPanId = {
    panID: 65535,
    extendedPanID: [0x00, 0x12, 0x4b, 0x00, 0x09, 0xd6, 0x9f, 0x77],
    channelList: [21],
    networkKey: [1, 3, 5, 7, 9, 11, 13, 15, 0, 2, 4, 6, 8, 10, 12, 13],
    networkKeyDistribute: false,
};

const serialPortOptions = {
    baudRate: 800,
    rtscts: false,
    path: 'dummy',
};

const backupMatchingConfig = {
    metadata: {
        format: 'zigpy/open-coordinator-backup',
        version: 1,
        source: 'zigbee-herdsman@0.13.65',
        internal: {
            date: '2021-03-03T19:15:40.524Z',
            znpVersion: 2,
        },
    },
    stack_specific: {
        zstack: {
            tclk_seed: '928a2c479e72a9a53e3b5133fc55021f',
        },
    },
    coordinator_ieee: '00124b0009d80ba7',
    pan_id: '007b',
    extended_pan_id: '00124b0009d69f77',
    nwk_update_id: 0,
    security_level: 5,
    channel: 21,
    channel_mask: [21],
    network_key: {
        key: '01030507090b0d0f00020406080a0c0d',
        sequence_number: 0,
        frame_counter: 16754,
    },
    devices: [
        {
            nwk_address: 'ddf6',
            ieee_address: '00124b002226ef87',
        },
        {
            nwk_address: 'c2dc',
            ieee_address: '04cf8cdf3c79455f',
            link_key: {
                key: '0e768569dd935d8e7302e74e7629f13f',
                rx_counter: 0,
                tx_counter: 275,
            },
        },
        {
            nwk_address: '740a',
            ieee_address: '680ae2fffeae5647',
            link_key: {
                key: '7c079d02aae015facd7ae9608d4baf56',
                rx_counter: 0,
                tx_counter: 275,
            },
        },
        {
            nwk_address: '19fa',
            ieee_address: '00158d00024fa79b',
            link_key: {
                key: 'cea550908aa1529ee90eea3c3bdc26fc',
                rx_counter: 0,
                tx_counter: 44,
            },
        },
        {
            nwk_address: '6182',
            ieee_address: '00158d00024f4518',
            link_key: {
                key: '267e1e31fcd8171f8acf63459effbca5',
                rx_counter: 0,
                tx_counter: 44,
            },
        },
        {
            nwk_address: '4285',
            ieee_address: '00158d00024f810d',
            is_child: false,
            link_key: {
                key: '55ba1e31fcd8171f9f0b63459effbca5',
                rx_counter: 0,
                tx_counter: 44,
            },
        },
        {
            // "nwk_address": "4286", commented because `nwk_address` is optional in the backup
            ieee_address: '00158d00024f810e',
            is_child: true,
            link_key: {
                key: '55ba1e31fcd8171fee0b63459effeea5',
                rx_counter: 24,
                tx_counter: 91,
            },
        },
    ],
};

const backupMatchingConfig12 = {
    metadata: {
        format: 'zigpy/open-coordinator-backup',
        version: 1,
        source: 'zigbee-herdsman@0.13.65',
        internal: {
            date: '2021-03-03T19:15:40.524Z',
            znpVersion: 0,
        },
    },
    stack_specific: {
        zstack: {},
    },
    coordinator_ieee: '00124b0009d80ba7',
    pan_id: '007b',
    extended_pan_id: '00124b0009d69f77',
    nwk_update_id: 0,
    security_level: 5,
    channel: 21,
    channel_mask: [21],
    network_key: {
        key: '01030507090b0d0f00020406080a0c0d',
        sequence_number: 0,
        frame_counter: 0,
    },
    devices: [
        {
            nwk_address: 'ddf6',
            ieee_address: '00124b002226ef87',
        },
    ],
};

const backupNotMatchingConfig = {
    metadata: {
        format: 'zigpy/open-coordinator-backup',
        version: 1,
        source: 'zigbee-herdsman@0.13.65',
        internal: {
            date: '2021-03-03T19:15:40.524Z',
            znpVersion: 2,
        },
    },
    stack_specific: {
        zstack: {
            tclk_seed: '928a2c479e72a9a53e3b5133fc55021f',
        },
    },
    coordinator_ieee: '00124b0009d80ba7',
    pan_id: '007c',
    extended_pan_id: '00124b0009d69f77',
    nwk_update_id: 0,
    security_level: 5,
    channel: 21,
    channel_mask: [21],
    network_key: {
        key: '01030507090b0d0f00020406080a0c0d',
        sequence_number: 0,
        frame_counter: 16754,
    },
    devices: [
        {
            nwk_address: 'ddf6',
            ieee_address: '00124b002226ef87',
        },
        {
            nwk_address: 'c2dc',
            ieee_address: '04cf8cdf3c79455f',
            link_key: {
                key: '0e768569dd935d8e7302e74e7629f13f',
                rx_counter: 0,
                tx_counter: 275,
            },
        },
        {
            nwk_address: '740a',
            ieee_address: '680ae2fffeae5647',
            link_key: {
                key: '7c079d02aae015facd7ae9608d4baf56',
                rx_counter: 0,
                tx_counter: 275,
            },
        },
        {
            nwk_address: '19fa',
            ieee_address: '00158d00024fa79b',
            link_key: {
                key: 'cea550908aa1529ee90eea3c3bdc26fc',
                rx_counter: 0,
                tx_counter: 44,
            },
        },
        {
            nwk_address: '6182',
            ieee_address: '00158d00024f4518',
            link_key: {
                key: '267e1e31fcd8171f8acf63459effbca5',
                rx_counter: 0,
                tx_counter: 44,
            },
        },
        {
            nwk_address: '4285',
            ieee_address: '00158d00024f810d',
            link_key: {
                key: '55ba1e31fcd8171f9f0b63459effbca5',
                rx_counter: 0,
                tx_counter: 44,
            },
        },
    ],
};

const legacyBackup = {
    adapterType: 'zStack',
    time: 'Thu, 04 Mar 2021 10:55:12 GMT',
    meta: {
        product: 2,
    },
    data: {
        ZCD_NV_EXTADDR: {
            id: 1,
            offset: 0,
            osal: true,
            product: -1,
            value: [167, 11, 216, 9, 0, 75, 18, 0],
            len: 8,
        },
        ZCD_NV_NIB: {
            id: 33,
            offset: 0,
            osal: true,
            product: -1,
            value: [
                145, 5, 2, 16, 20, 16, 0, 20, 0, 0, 0, 1, 5, 1, 143, 7, 0, 2, 5, 30, 0, 0, 11, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 123, 0, 8, 0, 0, 32, 0,
                15, 15, 4, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 119, 159, 214, 9, 0, 75, 18, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 60, 3, 0, 1, 120, 10, 1, 0, 0, 146, 235, 0,
            ],
            len: 110,
        },
        ZCD_NV_PANID: {
            id: 131,
            offset: 0,
            osal: true,
            product: -1,
            value: [123, 0],
            len: 2,
        },
        ZCD_NV_EXTENDED_PAN_ID: {
            id: 45,
            offset: 0,
            osal: true,
            product: -1,
            value: [221, 221, 221, 221, 221, 221, 221, 221],
            len: 8,
        },
        ZCD_NV_NWK_ACTIVE_KEY_INFO: {
            id: 58,
            offset: 0,
            osal: true,
            product: -1,
            value: [0, 1, 3, 5, 7, 9, 11, 13, 15, 0, 2, 4, 6, 8, 10, 12, 13],
            len: 17,
        },
        ZCD_NV_NWK_ALTERN_KEY_INFO: {
            id: 59,
            offset: 0,
            osal: true,
            product: -1,
            value: [0, 1, 3, 5, 7, 9, 11, 13, 15, 0, 2, 4, 6, 8, 10, 12, 13],
            len: 17,
        },
        ZCD_NV_APS_USE_EXT_PANID: {
            id: 71,
            offset: 0,
            osal: true,
            product: -1,
            value: [0, 0, 0, 0, 0, 0, 0, 0],
            len: 8,
        },
        ZCD_NV_PRECFGKEY: {
            id: 98,
            offset: 0,
            osal: true,
            product: -1,
            value: [1, 3, 5, 7, 9, 11, 13, 15, 0, 2, 4, 6, 8, 10, 12, 13],
            len: 16,
        },
        ZCD_NV_PRECFGKEY_ENABLE: {
            id: 99,
            offset: 0,
            osal: true,
            product: -1,
            value: [0],
            len: 1,
        },
        ZCD_NV_CHANLIST: {
            id: 132,
            offset: 0,
            osal: true,
            product: -1,
            value: [0, 20, 0, 0],
            len: 4,
        },
        ZCD_NV_LEGACY_TCLK_TABLE_START: {
            id: 273,
            product: 2,
            offset: 0,
            osal: true,
            value: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 255, 0, 0],
            len: 19,
        },
        ZCD_NV_LEGACY_NWK_SEC_MATERIAL_TABLE_START: {
            id: 117,
            product: 2,
            offset: 0,
            osal: true,
            value: [83, 144, 14, 0, 134, 114, 56, 25, 0, 75, 18, 0],
            len: 12,
        },
    },
};

class ZnpRequestMockBuilder {
    public responders: {subsystem: Subsystem; command: string; exec: (payload: any, handler?: ZnpRequestMockBuilder) => any}[] = [];
    public nvItems: {id: NvItemsIds; value?: Buffer}[] = [];
    public nvExtendedItems: {sysId: NvSystemIds; id: NvItemsIds; subId: number; value?: Buffer}[] = [];

    constructor() {
        const handleOsalNvRead = (payload, handler) => {
            if (payload.offset !== undefined && payload.offset !== 0) {
                throw new Error('osalNvLength offset not supported');
            }
            const item = handler.nvItems.find((e) => e.id === payload.id);
            return {payload: {status: item && item.value ? 0 : 1, value: item && item.value ? item.value : undefined}};
        };
        this.handle(Subsystem.SYS, 'osalNvRead', handleOsalNvRead);
        this.handle(Subsystem.SYS, 'osalNvReadExt', handleOsalNvRead);

        const handleOsalNvWrite = (payload, handler) => {
            if (payload.offset !== undefined && payload.offset !== 0) {
                throw new Error('osalNvLength offset not supported');
            }
            const item = handler.nvItems.find((e) => e.id === payload.id);
            if (item) {
                item.value = payload.value;
                return {payload: {status: 0}};
            } else {
                return {payload: {status: 1}};
            }
        };
        this.handle(Subsystem.SYS, 'osalNvWrite', handleOsalNvWrite);
        this.handle(Subsystem.SYS, 'osalNvWriteExt', handleOsalNvWrite);

        this.handle(Subsystem.SYS, 'osalNvItemInit', (payload, handler) => {
            const item = handler.nvItems.find((e) => e.id === payload.id);
            if (item) {
                if (item.value && item.value.length !== payload.len) {
                    return {payload: {status: 0x0a}};
                }
                return {payload: {status: 0x00}};
            } else {
                const item = {
                    id: payload.id,
                    value: payload.initvalue || null,
                };
                handler.nvItems.push(item);
                return {payload: {status: 0x09}};
            }
        });
        this.handle(Subsystem.SYS, 'osalNvLength', (payload, handler) => {
            if (payload.offset !== undefined && payload.offset !== 0) {
                throw new Error('osalNvLength offset not supported');
            }
            const item = handler.nvItems.find((e) => e.id === payload.id);
            return {payload: {length: item && item.value ? item.value.length : 0}};
        });
        this.handle(Subsystem.SYS, 'osalNvDelete', (payload, handler) => {
            const item = handler.nvItems.find((e) => e.id === payload.id);
            if (item) {
                if (item.value && item.value.length !== payload.len) {
                    return {payload: {status: 0x0a}};
                }
                const itemIndex = handler.nvItems.indexOf(item);
                handler.nvItems.splice(itemIndex, 1);
                return {payload: {status: 0x00}};
            } else {
                return {payload: {status: 0x09}};
            }
        });

        this.handle(Subsystem.SYS, 'nvRead', (payload, handler: ZnpRequestMockBuilder) => {
            if (payload.offset !== undefined && payload.offset !== 0) {
                throw new Error('nvRead offset not supported');
            }
            const item = handler.nvExtendedItems.find((e) => e.sysId === payload.sysid && e.id === payload.itemid && e.subId === payload.subid);
            return {
                payload: {
                    status: item && item.value ? 0 : 1,
                    value: item && item.value ? item.value : undefined,
                    len: (item?.value && item.value.length) || undefined,
                },
            };
        });

        this.handle(Subsystem.SYS, 'nvWrite', (payload, handler: ZnpRequestMockBuilder) => {
            if (payload.offset !== undefined && payload.offset !== 0) {
                throw new Error('nwWrite offset not supported');
            }
            const item = handler.nvExtendedItems.find((e) => e.sysId === payload.sysid && e.id === payload.itemid && e.subId === payload.subid);
            if (item) {
                item.value = payload.value;
                return {payload: {status: 0}};
            } else {
                return {payload: {status: 1}};
            }
        });

        this.handle(Subsystem.SYS, 'nvCreate', (payload, handler: ZnpRequestMockBuilder) => {
            const item = handler.nvExtendedItems.find((e) => e.sysId === payload.sysid && e.id === payload.itemid && e.subId === payload.subid);
            if (item) {
                if (item.value && item.value.length !== payload.len) {
                    return {payload: {status: 0x0a}};
                }
                return {payload: {status: 0x00}};
            } else {
                const item = {
                    sysId: payload.sysid,
                    id: payload.itemid,
                    subId: payload.subid,
                    value: null,
                };
                handler.nvExtendedItems.push(item);
                return {payload: {status: 0x09}};
            }
        });
        this.handle(Subsystem.SYS, 'nvLength', (payload, handler) => {
            if (payload.offset !== undefined && payload.offset !== 0) {
                throw new Error('nvLength offset not supported');
            }
            const item = handler.nvExtendedItems.find((e) => e.sysId === payload.sysid && e.id === payload.itemid && e.subId === payload.subid);
            return {payload: {len: item && item.value ? item.value.length : 0}};
        });
        this.handle(Subsystem.SYS, 'nvDelete', (payload, handler) => {
            const item = handler.nvExtendedItems.find((e) => e.sysId === payload.sysid && e.id === payload.itemid && e.subId === payload.subid);
            if (item) {
                if (item.value && item.value.length !== payload.len) {
                    return {payload: {status: 0x0a}};
                }
                const itemIndex = handler.nvItems.indexOf(item);
                handler.nvItems.splice(itemIndex, 1);
                return {payload: {status: 0x00}};
            } else {
                return {payload: {status: 0x09}};
            }
        });
    }

    public handle(subsystem: Subsystem, command: string, exec?: (payload: any, handler?: ZnpRequestMockBuilder) => any) {
        const index = this.responders.findIndex((r) => r.subsystem === subsystem && r.command === command);
        if (index > -1) {
            this.responders.splice(index, 1);
        }
        this.responders.push({subsystem, command, exec: exec || (() => ({}))});
        return this;
    }

    public nv(id: NvItemsIds, value?: Buffer) {
        const index = this.nvItems.findIndex((e) => e.id === id);
        if (index > -1) {
            this.nvItems.splice(index, 1);
        }
        if (value) {
            this.nvItems.push({id, value: value || null});
        }
        return this;
    }

    public nvExtended(sysId: NvSystemIds, id: NvItemsIds, subId: number, value?: Buffer) {
        const index = this.nvExtendedItems.findIndex((e) => e.sysId === sysId && e.id === id && e.subId === subId);
        if (index > -1) {
            this.nvExtendedItems.splice(index, 1);
        }
        if (value) {
            this.nvExtendedItems.push({sysId, id, subId, value: value || null});
        }
        return this;
    }

    public execute(message: {subsystem: Subsystem; command: string; payload: any}) {
        const responder = this.responders.find((r) => r.subsystem === message.subsystem && r.command === message.command);
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
        newBuilder.responders = this.responders.map((responder) => ({...responder}));
        newBuilder.nvItems = this.nvItems.map((item) => ({...item, value: Buffer.from(item.value)}));
        newBuilder.nvExtendedItems = this.nvExtendedItems.map((item) => ({...item, value: Buffer.from(item.value)}));
        return newBuilder;
    }
}

const baseZnpRequestMock = new ZnpRequestMockBuilder()
    .handle(Subsystem.SYS, 'version', (payload) => (equals(payload, {}) ? {payload: {product: ZnpVersion.zStack30x, revision: 20201026}} : undefined))
    .handle(Subsystem.SYS, 'ping', () => ({}))
    .handle(Subsystem.SYS, 'resetReq', () => ({}))
    .handle(Subsystem.SYS, 'getExtAddr', () => ({payload: {extaddress: '0x00124b0009d69f77'}}))
    .handle(Subsystem.SYS, 'stackTune', () => ({}))
    .handle(Subsystem.ZDO, 'extFindGroup', () => ({payload: {status: 0}}))
    .handle(Subsystem.ZDO, 'extAddGroup', () => ({payload: {status: 0}}))
    .handle(Subsystem.UTIL, 'getDeviceInfo', () => ({payload: {devicestate: 0x00, ieeeaddr: '0x00124b0009d80ba7'}}))
    .handle(Subsystem.ZDO, 'activeEpReq', () => ({}))
    .handle(Subsystem.ZDO, 'simpleDescReq', () => ({}))
    .handle(Subsystem.ZDO, 'mgmtPermitJoinReq', () => ({}))
    .handle(Subsystem.ZDO, 'nodeDescReq', () => ({}))
    .handle(Subsystem.ZDO, 'bindReq', () => ({}))
    .handle(Subsystem.ZDO, 'unbindReq', () => ({}))
    .handle(Subsystem.ZDO, 'mgmtLeaveReq', () => ({}))
    .handle(Subsystem.ZDO, 'mgmtLqiReq', () => ({}))
    .handle(Subsystem.ZDO, 'mgmtRtgReq', () => ({}))
    .handle(Subsystem.ZDO, 'mgmtNwkUpdateReq', () => ({}))
    .handle(Subsystem.AF, 'interPanCtl', () => ({}))
    .handle(Subsystem.ZDO, 'extRouteDisc', () => ({}))
    .handle(Subsystem.ZDO, 'nwkAddrReq', () => ({}))
    .handle(Subsystem.UTIL, 'assocRemove', () => ({payload: {}}))
    .handle(Subsystem.UTIL, 'assocGetWithAddress', () => ({payload: {noderelation: assocGetWithAddressNodeRelation}}))
    .handle(Subsystem.UTIL, 'assocAdd', () => ({payload: {}}))
    .handle(Subsystem.UTIL, 'ledControl', () => ({}))
    .handle(Subsystem.APP_CNF, 'bdbAddInstallCode', () => ({}))
    .handle(Subsystem.AF, 'register', () => ({}))
    .handle(Subsystem.AF, 'dataRequest', () => {
        if (dataRequestCode !== 0) {
            throw new Error(`Data request failed with code '${dataRequestCode}'`);
        }
        return {};
    })
    .handle(Subsystem.AF, 'dataRequestExt', () => {
        if (dataRequestExtCode !== 0) {
            throw new Error(`Data request failed with code '${dataRequestExtCode}'`);
        }
        return {};
    })
    .handle(Subsystem.SYS, 'resetReq', () => ({}))
    .handle(Subsystem.APP_CNF, 'bdbSetChannel', () => ({}))
    .handle(Subsystem.APP_CNF, 'bdbStartCommissioning', (_, handler) => {
        const nibIndex = handler.nvItems.findIndex((e) => e.id === NvItemsIds.NIB);
        if (nibIndex > -1) {
            handler.nvItems.splice(nibIndex, 1);
        }
        handler.nvItems.push({
            id: NvItemsIds.NIB,
            value: Buffer.from(
                'fb050279147900640000000105018f000700020d1e0000001500000000000000000000007b000800000020000f0f0400010000000100000000779fd609004b1200010000000000000000000000000000000000000000000000000000000000000000000000003c0c0001780a0100000006020000',
                'hex',
            ),
        });
        return {};
    })
    .handle(Subsystem.ZDO, 'extNwkInfo', (_, handler) => {
        const nib = Structs.nib(handler.nvItems.find((item) => item.id === NvItemsIds.NIB).value);
        return {payload: {panid: nib.nwkPanId, extendedpanid: `0x${nib.extendedPANID.toString('hex')}`, channel: nib.nwkLogicalChannel}};
    })
    .handle(Subsystem.ZDO, 'startupFromApp', () => ({}))
    .nv(NvItemsIds.CHANLIST, Buffer.from([0, 8, 0, 0]))
    .nv(NvItemsIds.PRECFGKEY, Buffer.alloc(16, 0))
    .nv(NvItemsIds.PRECFGKEYS_ENABLE, Buffer.from([0]))
    .nv(NvItemsIds.NWKKEY, Buffer.alloc(24, 0))
    .nv(NvItemsIds.NWK_ACTIVE_KEY_INFO, Buffer.from('000000000000000000000000000000000000', 'hex'))
    .nv(NvItemsIds.NWK_ALTERN_KEY_INFO, Buffer.from('000000000000000000000000000000000000', 'hex'))
    .nv(NvItemsIds.ZNP_HAS_CONFIGURED_ZSTACK3, Buffer.from([0x00]))
    .nv(
        NvItemsIds.NIB,
        Buffer.from(
            'fb050279147900640000000105018f000700020d1e0000001500000000000000000000000bcd0800000020000f0f0400010000000100000000779fd609004b1200010000000000000000000000000000000000000000000000000000000000000000000000003c0c0001780a0100000006020000',
            'hex',
        ),
    );

const empty3UnalignedRequestMock = baseZnpRequestMock
    .clone()
    .handle(Subsystem.APP_CNF, 'bdbStartCommissioning', (_, handler) => {
        const nibIndex = handler.nvItems.findIndex((e) => e.id === NvItemsIds.NIB);
        if (nibIndex > -1) {
            handler.nvItems.splice(nibIndex, 1);
        }
        handler.nvItems.push({
            id: NvItemsIds.NIB,
            value: Buffer.from(
                'fb050279147900640000000105018f0700020d1e000015000000000000000000007b0008000020000f0f0400010000000100000000779fd609004b1200010000000000000000000000000000000000000000000000000000000000000000000000003c0c0001780a010000060200',
                'hex',
            ),
        });
        return {};
    })
    .nv(NvItemsIds.NWKKEY, Buffer.alloc(21, 0))
    .nv(NvItemsIds.ZNP_HAS_CONFIGURED_ZSTACK3, Buffer.from([0x00]))
    .nv(
        NvItemsIds.NIB,
        Buffer.from(
            'fb050279147900640000000105018f0700020d1e00001500000000000000000000ffff08000020000f0f0400010000000100000000779fd609004b1200010000000000000000000000000000000000000000000000000000000000000000000000003c0c0001780a010000060200',
            'hex',
        ),
    )
    .nv(
        NvItemsIds.ADDRMGR,
        Buffer.from(
            '0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
            'hex',
        ),
    )
    .nv(
        NvItemsIds.APS_LINK_KEY_TABLE,
        Buffer.from(
            '0000feff000000feff000000feff000000feff000000feff000000feff000000feff000000feff000000feff000000feff000000feff000000feff000000feff000000feff000000feff000000feff000000',
            'hex',
        ),
    );
for (let i = 0; i < 4; i++) {
    empty3UnalignedRequestMock.nv(NvItemsIds.LEGACY_NWK_SEC_MATERIAL_TABLE_START + i, Buffer.from('000000000000000000000000', 'hex'));
}
for (let i = 0; i < 16; i++) {
    empty3UnalignedRequestMock.nv(NvItemsIds.LEGACY_TCLK_TABLE_START + i, Buffer.from('00000000000000000000000000000000000000', 'hex'));
}
for (let i = 0; i < 16; i++) {
    empty3UnalignedRequestMock.nv(NvItemsIds.APS_LINK_KEY_DATA_START + i, Buffer.from('000000000000000000000000000000000000000000000000', 'hex'));
}

const empty3AlignedRequestMock = baseZnpRequestMock
    .clone()
    .nv(NvItemsIds.ZNP_HAS_CONFIGURED_ZSTACK3, Buffer.from([0x00]))
    .nv(
        NvItemsIds.NIB,
        Buffer.from(
            'fb050279147900640000000105018f000700020d1e000000150000000000000000000000ffff0800000020000f0f0400010000000100000000779fd609004b1200010000000000000000000000000000000000000000000000000000000000000000000000003c0c0001780a0100000006020000',
            'hex',
        ),
    )
    .nv(
        NvItemsIds.ADDRMGR,
        Buffer.from(
            '00ff0000000000000000000000ff0000000000000000000000ff0000000000000000000000ff0000000000000000000000ff0000000000000000000000ff0000000000000000000000ff0000000000000000000000ff0000000000000000000000ff0000000000000000000000ff0000000000000000000000ff0000000000000000000000ff0000000000000000000000ff0000000000000000000000ff0000000000000000000000ff0000000000000000000000ff00000000000000000000',
            'hex',
        ),
    )
    .nv(
        NvItemsIds.APS_LINK_KEY_TABLE,
        Buffer.from(
            '0000feff00000000feff00000000feff00000000feff00000000feff00000000feff00000000feff00000000feff00000000feff00000000feff00000000feff00000000feff00000000feff00000000feff00000000feff00000000feff00000000',
            'hex',
        ),
    );
for (let i = 0; i < 4; i++) {
    empty3AlignedRequestMock.nv(NvItemsIds.LEGACY_NWK_SEC_MATERIAL_TABLE_START + i, Buffer.from('000000000000000000000000', 'hex'));
}
for (let i = 0; i < 16; i++) {
    empty3AlignedRequestMock.nv(NvItemsIds.LEGACY_TCLK_TABLE_START + i, Buffer.from('0000000000000000000000000000000000000000', 'hex'));
}
for (let i = 0; i < 16; i++) {
    empty3AlignedRequestMock.nv(NvItemsIds.APS_LINK_KEY_DATA_START + i, Buffer.from('000000000000000000000000000000000000000000000000', 'hex'));
}

const commissioned3AlignedRequestMock = empty3AlignedRequestMock
    .clone()
    .nv(NvItemsIds.ZNP_HAS_CONFIGURED_ZSTACK3, Buffer.from([0x55]))
    .nv(NvItemsIds.PRECFGKEY, Buffer.from('01030507090b0d0f00020406080a0c0d', 'hex'))
    .nv(NvItemsIds.NWK_ACTIVE_KEY_INFO, Buffer.from('0001030507090b0d0f00020406080a0c0d00', 'hex'))
    .nv(NvItemsIds.NWK_ALTERN_KEY_INFO, Buffer.from('0001030507090b0d0f00020406080a0c0d00', 'hex'))
    .nv(
        NvItemsIds.NIB,
        Buffer.from(
            'fb050279147900640000000105018f000700020d1e0000001500000000000000000000007b000800000020000f0f0400010000000100000000779fd609004b1200010000000000000000000000000000000000000000000000000000000000000000000000003c0c0001780a0100000006020000',
            'hex',
        ),
    )
    .nv(
        NvItemsIds.ADDRMGR,
        Buffer.from(
            '01ff4f3a080000000000000000ff0000000000000000000000ff0000000000000000000000ff0000000000000000000000ff0000000000000000000000ff0000000000000000000000ff0000000000000000000000ff0000000000000000000000ff0000000000000000000000ff0000000000000000000000ff0000000000000000000000ff0000000000000000000000ff0000000000000000000000ff0000000000000000000000ff0000000000000000000000ff00000000000000000000',
            'hex',
        ),
    );

const commissioned3AlignedConfigMistmachRequestMock = commissioned3AlignedRequestMock
    .clone()
    .nv(NvItemsIds.NWK_ACTIVE_KEY_INFO, Buffer.from('0001030507090b0d0f00020406080a0c0d00', 'hex'))
    .nv(NvItemsIds.NWK_ALTERN_KEY_INFO, Buffer.from('0001030507090b0d0f00020406080a0c0d00', 'hex'))
    .nv(
        NvItemsIds.NIB,
        Buffer.from(
            'fb050279147900640000000105018f000700020d1e0000001500000000000000000000007e000800000020000f0f0400010000000100000000779fd609004b1200010000000000000000000000000000000000000000000000000000000000000000000000003c0c0001780a0100000006020000',
            'hex',
        ),
    );

const empty3x0AlignedRequestMock = baseZnpRequestMock
    .clone()
    .handle(Subsystem.SYS, 'version', (payload) => (equals(payload, {}) ? {payload: {product: ZnpVersion.zStack3x0, revision: 20210430}} : undefined))
    .nv(NvItemsIds.ZNP_HAS_CONFIGURED_ZSTACK3, Buffer.from([0x00]))
    .nv(
        NvItemsIds.NIB,
        Buffer.from(
            'fb050279147900640000000105018f000700020d1e000000150000000000000000000000ffff0800000020000f0f0400010000000100000000779fd609004b1200010000000000000000000000000000000000000000000000000000000000000000000000003c0c0001780a0100000006020000',
            'hex',
        ),
    )
    .nv(
        NvItemsIds.APS_LINK_KEY_TABLE,
        Buffer.from(
            '0000feff00000000feff00000000feff00000000feff00000000feff00000000feff00000000feff00000000feff00000000feff00000000feff00000000feff00000000feff00000000feff00000000feff00000000feff00000000feff00000000',
            'hex',
        ),
    );
for (let i = 0; i < 16; i++) {
    empty3x0AlignedRequestMock.nvExtended(NvSystemIds.ZSTACK, NvItemsIds.ZCD_NV_EX_ADDRMGR, i, Buffer.from('00ff00000000000000000000', 'hex'));
}
for (let i = 0; i < 4; i++) {
    empty3x0AlignedRequestMock.nvExtended(
        NvSystemIds.ZSTACK,
        NvItemsIds.EX_NWK_SEC_MATERIAL_TABLE,
        i,
        Buffer.from('000000000000000000000000', 'hex'),
    );
}
for (let i = 0; i < 16; i++) {
    empty3x0AlignedRequestMock.nvExtended(
        NvSystemIds.ZSTACK,
        NvItemsIds.EX_TCLK_TABLE,
        i,
        Buffer.from('0000000000000000000000000000000000000000', 'hex'),
    );
}
for (let i = 0; i < 16; i++) {
    empty3x0AlignedRequestMock.nvExtended(
        NvSystemIds.ZSTACK,
        NvItemsIds.ZCD_NV_EX_APS_KEY_DATA_TABLE,
        i,
        Buffer.from('000000000000000000000000000000000000000000000000', 'hex'),
    );
}

const commissioned3x0AlignedRequestMock = empty3x0AlignedRequestMock
    .clone()
    .nv(NvItemsIds.ZNP_HAS_CONFIGURED_ZSTACK3, Buffer.from([0x55]))
    .nv(NvItemsIds.PRECFGKEY, Buffer.from('01030507090b0d0f00020406080a0c0d', 'hex'))
    .nv(NvItemsIds.NWK_ACTIVE_KEY_INFO, Buffer.from('0001030507090b0d0f00020406080a0c0d00', 'hex'))
    .nv(NvItemsIds.NWK_ALTERN_KEY_INFO, Buffer.from('0001030507090b0d0f00020406080a0c0d00', 'hex'))
    .nv(
        NvItemsIds.NIB,
        Buffer.from(
            'fb050279147900640000000105018f000700020d1e0000001500000000000000000000007b000800000020000f0f0400010000000100000000779fd609004b1200010000000000000000000000000000000000000000000000000000000000000000000000003c0c0001780a0100000006020000',
            'hex',
        ),
    )
    .nvExtended(NvSystemIds.ZSTACK, NvItemsIds.ZCD_NV_EX_ADDRMGR, 0, Buffer.from('01ff4f3a0800000000000000', 'hex'));

const empty12UnalignedRequestMock = baseZnpRequestMock
    .clone()
    .handle(Subsystem.SYS, 'version', (payload) => (equals(payload, {}) ? {payload: {product: ZnpVersion.zStack12}} : undefined))
    .handle(Subsystem.SAPI, 'readConfiguration', (payload, handler) => {
        if (payload.configid !== NvItemsIds.PRECFGKEY) {
            throw new Error('Only pre-configured key should be read/written using SAPI layer');
        }
        const item = handler.nvItems.find((item) => item.id === payload.configid);
        if (item) {
            return {payload: {status: 0, configid: item.id, len: item.value?.length || 0, value: item.value}};
        }
        return {payload: {status: 1}};
    })
    .handle(Subsystem.SAPI, 'writeConfiguration', (payload, handler) => {
        if (payload.configid !== NvItemsIds.PRECFGKEY) {
            throw new Error('Only pre-configured key should be read/written using SAPI layer');
        }
        const item = handler.nvItems.find((item) => item.id === payload.configid);
        if (item) {
            item.value = payload.value;
        } else {
            handler.nvItems.push({id: payload.configid, value: payload.value});
        }
        handler.nv(
            NvItemsIds.NIB,
            Buffer.from(
                'fb050279147900640000000105018f0700020d1e000015000000000000000000007b0008000020000f0f0400010000000100000000779fd609004b1200010000000000000000000000000000000000000000000000000000000000000000000000003c0c0001780a010000060200',
                'hex',
            ),
        );
        return {payload: {status: 0}};
    })
    .nv(NvItemsIds.ZNP_HAS_CONFIGURED_ZSTACK1, Buffer.from([0x00]));

const commissioned12UnalignedRequestMock = empty12UnalignedRequestMock
    .clone()
    .nv(NvItemsIds.ZNP_HAS_CONFIGURED_ZSTACK1, Buffer.from([0x55]))
    .nv(NvItemsIds.PRECFGKEY, Buffer.from('01030507090b0d0f00020406080a0c0d', 'hex'))
    .nv(
        NvItemsIds.NIB,
        Buffer.from(
            'fb050279147900640000000105018f0700020d1e000015000000000000000000007b0008000020000f0f0400010000000100000000779fd609004b1200010000000000000000000000000000000000000000000000000000000000000000000000003c0c0001780a010000060200',
            'hex',
        ),
    );

const commissioned12UnalignedMismatchRequestMock = commissioned12UnalignedRequestMock
    .clone()
    .nv(NvItemsIds.PRECFGKEY, Buffer.from('aabb0507090b0d0f00020406080a0c0d', 'hex'));

const mockZnpRequest = vi
    .fn()
    .mockReturnValue(new Promise((resolve) => resolve({payload: {}})))
    .mockImplementation(
        (subsystem: Subsystem, command: string, payload: any, expectedStatus: ZnpCommandStatus) =>
            new Promise((resolve) => resolve(baseZnpRequestMock.execute({subsystem, command, payload}))),
    );
const mockZnpRequestZdo = vi.fn();
const mockZnpWaitFor = vi.fn();
const mockZnpOpen = vi.fn();
const mockZnpClose = vi.fn();
const mockQueueExecute = vi.fn().mockImplementation(async (func) => await func());
const mocks = [mockZnpOpen, mockZnpRequest, mockZnpClose];

const mockZnpRequestWith = (builder: ZnpRequestMockBuilder) => {
    builder = builder.clone();
    mockZnpRequest.mockImplementation(
        (subsystem: Subsystem, command: string, payload: any, expectedStatus: ZnpCommandStatus) =>
            new Promise((resolve) => resolve(builder.execute({subsystem, command, payload}))),
    );
};

const mockZnpWaitForDefault = () => {
    mockZnpWaitFor.mockImplementation((type, subsystem, command, target, transid, state, timeout) => {
        const missing = () => {
            const msg = `Not implemented - ${Type[type]} - ${Subsystem[subsystem]} - ${command} - ${target} - ${transid} - ${state} - ${timeout}`;
            console.log(msg);
            throw new Error(msg);
        };

        if (type === Type.AREQ && subsystem === Subsystem.ZDO && command === 'activeEpRsp') {
            return waitForResult(
                mockZdoZpiObject<ActiveEndpointsResponse>('activeEpRsp', target, [
                    Zdo.Status.SUCCESS,
                    {
                        nwkAddress: 0,
                        endpointList: [],
                    },
                ]),
            );
        } else if (type === Type.AREQ && subsystem === Subsystem.ZDO && command === 'mgmtPermitJoinRsp') {
            return waitForResult(mockZdoZpiObject('mgmtPermitJoinRsp', target, [Zdo.Status.SUCCESS, undefined]));
        } else if (type === Type.AREQ && subsystem === Subsystem.ZDO && command === 'stateChangeInd') {
            return waitForResult({payload: {state: 9}});
        } else {
            missing();
        }
    });
};

const mockZnpWaitForStateChangeIndTimeout = () => {
    mockZnpWaitFor.mockImplementation((type, subsystem, command, target, transid, state, timeout) => {
        const missing = () => {
            const msg = `Not implemented - ${Type[type]} - ${Subsystem[subsystem]} - ${command} - ${target} - ${transid} - ${state} - ${timeout}`;
            console.log(msg);
            throw new Error(msg);
        };

        if (type === Type.AREQ && subsystem === Subsystem.ZDO && command === 'activeEpRsp') {
            return waitForResult(
                mockZdoZpiObject<ActiveEndpointsResponse>('activeEpRsp', target, [
                    Zdo.Status.SUCCESS,
                    {
                        nwkAddress: 0,
                        endpointList: [],
                    },
                ]),
            );
        } else if (type === Type.AREQ && subsystem === Subsystem.ZDO && command === 'stateChangeInd') {
            return;
        } else {
            missing();
        }
    });
};

let bindStatusResponse = 0;

const mockZdoZpiObject = <T>(commandName: string, srcaddr: number | undefined, payload: [Zdo.Status, T | undefined]): ZpiObject => {
    const subsystem = Subsystem.ZDO;
    const command = Definition[subsystem].find((c) => c.name === commandName)!;
    return {
        type: Type.AREQ,
        subsystem,
        command,
        payload: {srcaddr, zdo: payload},
    };
};

const mockZpiObject = (type: Type, subsystem: Subsystem, commandName: string, payload: {[s: string]: unknown}) => {
    const command = Definition[subsystem].find((c) => c.name === commandName);
    return {type, subsystem, payload, command};
};

interface ZnpWaitFor {
    type: Type;
    subsystem: Subsystem;
    command: string;
    target?: number | string;
    transid?: number;
    state?: number;
    resolve: (object: unknown) => unknown;
    reject: (reason: string) => void;
}

const basicMocks = () => {
    mockZnpRequestWith(commissioned3x0AlignedRequestMock);
    mockZnpWaitFor.mockImplementation((type, subsystem, command, target, transid, state, timeout) => {
        const missing = () => {
            const msg = `Not implemented - ${Type[type]} - ${Subsystem[subsystem]} - ${command} - ${target} - ${transid} - ${state} - ${timeout}`;
            console.log(msg);
            throw new Error(msg);
        };

        if (type === Type.AREQ && subsystem === Subsystem.ZDO && command === 'activeEpRsp') {
            return waitForResult(
                mockZdoZpiObject<ActiveEndpointsResponse>('activeEpRsp', target, [
                    Zdo.Status.SUCCESS,
                    {
                        nwkAddress: 0,
                        endpointList: [1, 2, 3, 4, 5, 6, 8, 10, 11, 110, 12, 13, 47, 242],
                    },
                ]),
            );
        } else if (type === Type.AREQ && subsystem === Subsystem.ZDO && command === 'stateChangeInd') {
            return waitForResult({payload: {}});
        } else if (type === Type.AREQ && subsystem === Subsystem.ZDO && command === 'mgmtPermitJoinRsp') {
            return waitForResult(mockZdoZpiObject('mgmtPermitJoinRsp', target, [Zdo.Status.SUCCESS, undefined]));
        } else if (type === Type.AREQ && subsystem === Subsystem.ZDO && command === 'simpleDescRsp') {
            let responsePayload: SimpleDescriptorResponse;
            if (simpleDescriptorEndpoint === 1) {
                responsePayload = {
                    length: 1, // bogus
                    endpoint: 1,
                    profileId: 123,
                    deviceId: 5,
                    inClusterList: [1],
                    outClusterList: [2],
                    nwkAddress: target,
                    deviceVersion: 0,
                };
            } else if (simpleDescriptorEndpoint === 99) {
                responsePayload = {
                    length: 1, // bogus
                    endpoint: 99,
                    profileId: 123,
                    deviceId: 5,
                    inClusterList: [1],
                    outClusterList: [2],
                    nwkAddress: target,
                    deviceVersion: 0,
                };
            } else {
                responsePayload = {
                    length: 1, // bogus
                    endpoint: simpleDescriptorEndpoint,
                    profileId: 124,
                    deviceId: 7,
                    inClusterList: [8],
                    outClusterList: [9],
                    nwkAddress: target,
                    deviceVersion: 0,
                };
            }

            return waitForResult(mockZdoZpiObject<SimpleDescriptorResponse>('simpleDescRsp', target, [Zdo.Status.SUCCESS, responsePayload]));
        } else if (type === Type.AREQ && subsystem === Subsystem.ZDO && command === 'nodeDescRsp') {
            if (nodeDescRspErrorOnce) {
                nodeDescRspErrorOnce = false;
                return {
                    start: () => {
                        return {
                            promise: new Promise((resolve, reject) => {
                                reject('timeout after xx');
                            }),
                        };
                    },
                    ID: 89,
                };
            }

            return waitForResult(
                mockZdoZpiObject<NodeDescriptorResponse>('nodeDescRsp', target, [
                    Zdo.Status.SUCCESS,
                    {
                        manufacturerCode: target * 2,
                        apsFlags: 0,
                        capabilities: DUMMY_NODE_DESC_RSP_CAPABILITIES,
                        deprecated1: 0,
                        fragmentationSupported: true,
                        frequencyBand: 0,
                        logicalType: target - 1,
                        maxBufSize: 0,
                        maxIncTxSize: 0,
                        maxOutTxSize: 0,
                        nwkAddress: target,
                        serverMask: {
                            backupTrustCenter: 0,
                            deprecated1: 0,
                            deprecated2: 0,
                            deprecated3: 0,
                            deprecated4: 0,
                            networkManager: 0,
                            primaryTrustCenter: 0,
                            reserved1: 0,
                            reserved2: 0,
                            stackComplianceRevision: 0,
                        },
                        tlvs: [],
                    },
                ]),
            );
        } else if (type === Type.AREQ && subsystem === Subsystem.AF && command === 'dataConfirm') {
            const status = dataConfirmCode;
            if (dataConfirmCodeReset) {
                dataConfirmCode = 0;
            }

            if (status === 9999) {
                return {
                    start: () => {
                        return {
                            promise: new Promise((resolve, reject) => {
                                reject('timeout after xx');
                            }),
                        };
                    },
                    ID: 99,
                };
            } else {
                return waitForResult({payload: {status}}, 99);
            }
        } else if (type === Type.AREQ && subsystem === Subsystem.ZDO && command === 'mgmtLqiRsp' && target === 203) {
            const defaults = {deviceType: 0, extendedPanId: [0], permitJoining: 0, reserved1: 0, reserved2: 0, rxOnWhenIdle: 0};

            if (lastStartIndex === 0) {
                lastStartIndex += 2;
                return waitForResult(
                    mockZdoZpiObject<LQITableResponse>('mgmtLqiRsp', target, [
                        Zdo.Status.SUCCESS,
                        {
                            neighborTableEntries: 5,
                            startIndex: 0,
                            entryList: [
                                {lqi: 10, nwkAddress: 2, eui64: '0x3', relationship: 3, depth: 1, ...defaults},
                                {lqi: 15, nwkAddress: 3, eui64: '0x4', relationship: 2, depth: 5, ...defaults},
                            ],
                        },
                    ]),
                );
            } else if (lastStartIndex === 2) {
                lastStartIndex += 2;
                return waitForResult(
                    mockZdoZpiObject<LQITableResponse>('mgmtLqiRsp', target, [
                        Zdo.Status.SUCCESS,
                        {
                            neighborTableEntries: 5,
                            startIndex: 0,
                            entryList: [
                                {lqi: 10, nwkAddress: 5, eui64: '0x6', relationship: 3, depth: 1, ...defaults},
                                {lqi: 15, nwkAddress: 7, eui64: '0x8', relationship: 2, depth: 5, ...defaults},
                            ],
                        },
                    ]),
                );
            } else if (lastStartIndex === 4) {
                return waitForResult(
                    mockZdoZpiObject<LQITableResponse>('mgmtLqiRsp', target, [
                        Zdo.Status.SUCCESS,
                        {
                            neighborTableEntries: 5,
                            startIndex: 0,
                            entryList: [{lqi: 10, nwkAddress: 9, eui64: '0x10', relationship: 3, depth: 1, ...defaults}],
                        },
                    ]),
                );
            }
        } else if (type === Type.AREQ && subsystem === Subsystem.ZDO && command === 'mgmtLqiRsp' && target === 204) {
            return waitForResult(mockZdoZpiObject<LQITableResponse>('mgmtLqiRsp', target, [Zdo.Status.NOT_AUTHORIZED, undefined]));
        } else if (type === Type.AREQ && subsystem === Subsystem.ZDO && command === 'mgmtRtgRsp' && target === 205) {
            const defaultEntryList = {
                manyToOne: 0,
                memoryConstrained: 0,
                reserved1: 0,
                routeRecordRequired: 0,
                status: Zdo.RoutingTableStatus[0] as keyof typeof Zdo.RoutingTableStatus,
            };
            if (lastStartIndex === 0) {
                lastStartIndex += 2;
                return waitForResult(
                    mockZdoZpiObject<RoutingTableResponse>('mgmtRtgRsp', target, [
                        Zdo.Status.SUCCESS,
                        {
                            startIndex: 0,
                            routingTableEntries: 5,
                            entryList: [
                                {destinationAddress: 10, nextHopAddress: 3, ...defaultEntryList},
                                {destinationAddress: 11, nextHopAddress: 3, ...defaultEntryList},
                            ],
                        },
                    ]),
                );
            } else if (lastStartIndex === 2) {
                lastStartIndex += 2;
                return waitForResult(
                    mockZdoZpiObject<RoutingTableResponse>('mgmtRtgRsp', target, [
                        Zdo.Status.SUCCESS,
                        {
                            startIndex: 0,
                            routingTableEntries: 5,
                            entryList: [
                                {destinationAddress: 12, nextHopAddress: 3, ...defaultEntryList},
                                {destinationAddress: 13, nextHopAddress: 3, ...defaultEntryList},
                            ],
                        },
                    ]),
                );
            } else if (lastStartIndex === 4) {
                return waitForResult(
                    mockZdoZpiObject<RoutingTableResponse>('mgmtRtgRsp', target, [
                        Zdo.Status.SUCCESS,
                        {
                            startIndex: 0,
                            routingTableEntries: 5,
                            entryList: [{destinationAddress: 14, nextHopAddress: 3, ...defaultEntryList}],
                        },
                    ]),
                );
            }
        } else if (type === Type.AREQ && subsystem === Subsystem.ZDO && command === 'mgmtRtgRsp' && target === 206) {
            return waitForResult(mockZdoZpiObject<RoutingTableResponse>('mgmtRtgRsp', target, [Zdo.Status.INSUFFICIENT_SPACE, undefined]));
        } else if (type === Type.AREQ && subsystem === Subsystem.ZDO && command === 'bindRsp' && target === 301) {
            return waitForResult(mockZdoZpiObject('bindRsp', target, [bindStatusResponse, undefined]));
        } else if (type === Type.AREQ && subsystem === Subsystem.ZDO && command === 'unbindRsp' && target === 301) {
            return waitForResult(mockZdoZpiObject('unbindRsp', target, [bindStatusResponse, undefined]));
        } else if (type === Type.AREQ && subsystem === Subsystem.ZDO && command === 'mgmtLeaveRsp' && target === 401) {
            return waitForResult(mockZdoZpiObject('mgmtLeaveRsp', target, [Zdo.Status.SUCCESS, undefined]));
        } else if (type === Type.AREQ && subsystem === Subsystem.ZDO && command === 'nwkAddrRsp' && target === '0x03') {
            return waitForResult(
                mockZdoZpiObject<NetworkAddressResponse>('nwkAddrRsp', target, [
                    Zdo.Status.SUCCESS,
                    {
                        nwkAddress: 3,
                        eui64: '0x03',
                        assocDevList: [],
                        startIndex: 0,
                    },
                ]),
            );
        } else if (type === Type.AREQ && subsystem === Subsystem.ZDO && command === 'nwkAddrRsp' && target === '0x02') {
            return waitForResult(
                mockZdoZpiObject<NetworkAddressResponse>('nwkAddrRsp', target, [
                    Zdo.Status.SUCCESS,
                    {
                        nwkAddress: 2,
                        eui64: '0x02',
                        assocDevList: [],
                        startIndex: 0,
                    },
                ]),
            );
        } else {
            missing();
        }
    });
};

const touchlinkScanRequest = Zcl.Frame.create(
    Zcl.FrameType.SPECIFIC,
    Zcl.Direction.CLIENT_TO_SERVER,
    false,
    undefined,
    12,
    'scanRequest',
    Zcl.Utils.getCluster('touchlink', undefined, {}).ID,
    {transactionID: 1, zigbeeInformation: 4, touchlinkInformation: 18},
    {},
);

const touchlinkScanResponse = Zcl.Frame.create(
    Zcl.FrameType.SPECIFIC,
    Zcl.Direction.SERVER_TO_CLIENT,
    false,
    undefined,
    12,
    'scanResponse',
    Zcl.Utils.getCluster('touchlink', undefined, {}).ID,
    {
        transactionID: 1,
        rssiCorrection: 10,
        zigbeeInformation: 5,
        touchlinkInformation: 6,
        keyBitmask: 12,
        responseID: 11,
        extendedPanID: '0x0017210104d9cd33',
        networkUpdateID: 1,
        logicalChannel: 12,
        panID: 13,
        networkAddress: 5,
        numberOfSubDevices: 10,
        totalGroupIdentifiers: 5,
    },
    {},
);

const touchlinkIdentifyRequest = Zcl.Frame.create(
    Zcl.FrameType.SPECIFIC,
    Zcl.Direction.CLIENT_TO_SERVER,
    false,
    undefined,
    12,
    'identifyRequest',
    Zcl.Utils.getCluster('touchlink', undefined, {}).ID,
    {transactionID: 1, duration: 65535},
    {},
);

const getRandomArbitrary = (min, max) => {
    return Math.random() * (max - min) + min;
};

const getTempFile = () => {
    const tempPath = path.resolve('temp');
    if (!fs.existsSync(tempPath)) {
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
let simpleDescriptorEndpoint = 0;
let assocGetWithAddressNodeRelation;

vi.mock('../../../src/adapter/z-stack/znp/znp', () => ({
    Znp: vi.fn(() => ({
        on: (event, handler) => {
            if (event === 'received') {
                znpReceived = handler;
            } else if (event === 'close') {
                znpClose = handler;
            }
        },
        open: mockZnpOpen,
        request: mockZnpRequest,
        requestZdo: mockZnpRequestZdo,
        requestWithReply: mockZnpRequest,
        waitFor: mockZnpWaitFor,
        close: mockZnpClose,
    })),
}));

vi.mock('../../../src/utils/queue', () => ({
    Queue: vi.fn(() => ({
        execute: mockQueueExecute,
        count: () => 1,
    })),
}));

const mocksClear = [mockLogger.debug, mockLogger.info, mockLogger.warning, mockLogger.error];

describe('zstack-adapter', () => {
    let adapter: ZStackAdapter;

    beforeAll(async () => {
        setLogger(mockLogger);
    });

    afterAll(async () => {
        vi.useRealTimers();
    });

    beforeEach(() => {
        vi.useRealTimers();
        vi.useFakeTimers();
        adapter = new ZStackAdapter(networkOptions, serialPortOptions, 'backup.json', {concurrent: 3});
        mockZnpWaitForDefault();
        mocks.forEach((m) => m.mockRestore());
        mocksClear.forEach((m) => m.mockClear());
        mockQueueExecute.mockClear();
        mockZnpWaitFor.mockClear();
        dataConfirmCode = 0;
        dataRequestCode = 0;
        dataRequestExtCode = 0;
        bindStatusResponse = 0;
        assocGetWithAddressNodeRelation = 1;
        networkOptions.networkKeyDistribute = false;
        dataConfirmCodeReset = false;
        nodeDescRspErrorOnce = false;
        lastStartIndex = 0;
        simpleDescriptorEndpoint = 0;
    });

    it('should commission network with 3.0.x adapter', async () => {
        mockZnpRequestWith(empty3AlignedRequestMock);
        const result = await adapter.start();
        expect(result).toBe('reset');
    });

    it('should commission network with 3.0.x adapter - auto concurrency', async () => {
        mockZnpRequestWith(empty3AlignedRequestMock);
        adapter = new ZStackAdapter(networkOptions, serialPortOptions, 'backup.json', {});
        const result = await adapter.start();
        expect(result).toBe('reset');
    });

    it('should commission network with 3.x.0 adapter - auto concurrency', async () => {
        mockZnpRequestWith(empty3x0AlignedRequestMock);
        adapter = new ZStackAdapter(networkOptions, serialPortOptions, 'backup.json', {});
        const result = await adapter.start();
        expect(result).toBe('reset');
    });

    it('should commission network with 3.0.x adapter - unaligned 8-bit', async () => {
        mockZnpRequestWith(empty3UnalignedRequestMock);
        const result = await adapter.start();
        expect(result).toBe('reset');
    });

    it('should commission network with 3.0.x adapter - default extended pan id', async () => {
        mockZnpRequestWith(empty3AlignedRequestMock);
        adapter = new ZStackAdapter(networkOptionsDefaultExtendedPanId, serialPortOptions, 'backup.json', {concurrent: 3});
        const result = await adapter.start();
        expect(result).toBe('reset');
    });

    it('should commission with 3.0.x adapter - empty, mismatched config/backup', async () => {
        const backupFile = getTempFile();
        fs.writeFileSync(backupFile, JSON.stringify(backupNotMatchingConfig), 'utf8');
        adapter = new ZStackAdapter(networkOptions, serialPortOptions, backupFile, {concurrent: 3});
        mockZnpRequestWith(empty3AlignedRequestMock);
        const result = await adapter.start();
        expect(result).toBe('reset');
    });

    it('should commission with 3.0.x adapter - commissioned, mismatched adapter-config-backup', async () => {
        const backupFile = getTempFile();
        fs.writeFileSync(backupFile, JSON.stringify(backupNotMatchingConfig), 'utf8');
        adapter = new ZStackAdapter(networkOptions, serialPortOptions, backupFile, {concurrent: 3});
        mockZnpRequestWith(commissioned3AlignedConfigMistmachRequestMock);
        const result = await adapter.start();
        expect(result).toBe('reset');
    });

    it('should fail to commission network with 3.0.x adapter with invalid pan id 65535', async () => {
        mockZnpRequestWith(empty3AlignedRequestMock);
        adapter = new ZStackAdapter(networkOptionsInvalidPanId, serialPortOptions, 'backup.json', {concurrent: 3});
        await expect(adapter.start()).rejects.toThrowError('network commissioning failed - cannot use pan id 65535');
    });

    it('should fail to commission network with 3.0.x adapter when bdb commissioning times out', async () => {
        mockZnpWaitForStateChangeIndTimeout();
        mockZnpRequestWith(empty3AlignedRequestMock);
        adapter = new ZStackAdapter(networkOptions, serialPortOptions, 'backup.json', {concurrent: 3});
        await expect(adapter.start()).rejects.toThrowError(
            'network commissioning timed out - most likely network with the same panId or extendedPanId already exists nearby',
        );
    });

    it('should fail to commission network with 3.0.x adapter when nib fails to settle', async () => {
        mockZnpRequestWith(empty3AlignedRequestMock.clone().handle(Subsystem.APP_CNF, 'bdbStartCommissioning', () => ({})));
        vi.setConfig({testTimeout: 35000});
        adapter = new ZStackAdapter(networkOptions, serialPortOptions, 'backup.json', {concurrent: 3});
        const promise = adapter.start();
        await expect(promise).rejects.toThrowError('network commissioning failed - timed out waiting for nib to settle');
    });

    it('should fail to commission network with 3.0.x adapter when nib reports different pan id', async () => {
        mockZnpRequestWith(
            empty3AlignedRequestMock.clone().handle(Subsystem.APP_CNF, 'bdbStartCommissioning', (_, handler) => {
                const nibIndex = handler.nvItems.findIndex((e) => e.id === NvItemsIds.NIB);
                if (nibIndex > -1) {
                    handler.nvItems.splice(nibIndex, 1);
                }
                handler.nvItems.push({
                    id: NvItemsIds.NIB,
                    value: Buffer.from(
                        'fb050279147900640000000105018f000700020d1e0000001500000000000000000000007c000800000020000f0f0400010000000100000000779fd609004b1200010000000000000000000000000000000000000000000000000000000000000000000000003c0c0001780a0100000006020000',
                        'hex',
                    ),
                });
                return {};
            }),
        );
        adapter = new ZStackAdapter(networkOptions, serialPortOptions, 'backup.json', {concurrent: 3});
        const promise = adapter.start();
        await expect(promise).rejects.toThrowError('network commissioning failed - panId collision detected (expected=123, actual=124)');
    });

    it('should start network with 3.0.x adapter', async () => {
        mockZnpRequestWith(commissioned3AlignedRequestMock);
        const result = await adapter.start();
        expect(result).toBe('resumed');
    });

    it('should restore unified backup with 3.0.x adapter and create backup - empty', async () => {
        const backupFile = getTempFile();
        fs.writeFileSync(backupFile, JSON.stringify(backupMatchingConfig), 'utf8');
        adapter = new ZStackAdapter(networkOptions, serialPortOptions, backupFile, {concurrent: 3});
        mockZnpRequestWith(empty3AlignedRequestMock);
        const result = await adapter.start();
        expect(result).toBe('restored');

        await adapter.backup([]);
    });

    it('should restore unified backup with 3.0.x adapter and create backup - no tclk seed', async () => {
        const backupFile = getTempFile();
        const backup = JSON.parse(JSON.stringify(backupMatchingConfig));
        delete backup.stack_specific.zstack;
        fs.writeFileSync(backupFile, JSON.stringify(backup), 'utf8');
        adapter = new ZStackAdapter(networkOptions, serialPortOptions, backupFile, {concurrent: 3});
        mockZnpRequestWith(empty3AlignedRequestMock);
        const result = await adapter.start();
        expect(result).toBe('restored');

        await adapter.backup([]);
    });

    it('should restore unified backup with 3.x.0 adapter and create backup - empty', async () => {
        const backupFile = getTempFile();
        fs.writeFileSync(backupFile, JSON.stringify(backupMatchingConfig), 'utf8');
        adapter = new ZStackAdapter(networkOptions, serialPortOptions, backupFile, {concurrent: 3});
        mockZnpRequestWith(empty3x0AlignedRequestMock);
        const result = await adapter.start();
        expect(result).toBe('restored');

        await adapter.backup([]);
    });

    it('should (recommission) restore unified backup with 1.2 adapter and create backup - empty', async () => {
        const backupFile = getTempFile();
        fs.writeFileSync(backupFile, JSON.stringify(backupMatchingConfig12), 'utf8');
        adapter = new ZStackAdapter(networkOptions, serialPortOptions, backupFile, {concurrent: 1});
        mockZnpRequestWith(empty12UnalignedRequestMock);
        const result = await adapter.start();
        expect(result).toBe('restored');

        const backup = await adapter.backup([]);
        expect(backup.networkKeyInfo.frameCounter).toBe(0);
    });

    it('should create backup with 3.0.x adapter - default security material table entry', async () => {
        const builder = commissioned3AlignedRequestMock.clone();
        mockZnpRequestWith(builder);
        const result = await adapter.start();
        expect(result).toBe('resumed');
        for (let i = 0; i < 4; i++) {
            builder.nv(NvItemsIds.LEGACY_NWK_SEC_MATERIAL_TABLE_START + i, Buffer.from('000000000000000000000000', 'hex'));
        }

        const secMaterialTableEntry = Structs.nwkSecMaterialDescriptorEntry();
        secMaterialTableEntry.extendedPanID = Buffer.alloc(8, 0xff);
        secMaterialTableEntry.FrameCounter = 2800;
        builder.nv(NvItemsIds.LEGACY_NWK_SEC_MATERIAL_TABLE_START + 0, secMaterialTableEntry.serialize('aligned'));
        mockZnpRequestWith(builder);

        const backup = await adapter.backup([]);
        expect(backup.networkKeyInfo.frameCounter).toBe(2800);
    });

    it('should create backup with 3.0.x adapter - emnpty security material table', async () => {
        const builder = commissioned3AlignedRequestMock.clone();
        mockZnpRequestWith(builder);
        const result = await adapter.start();
        expect(result).toBe('resumed');
        for (let i = 0; i < 4; i++) {
            builder.nv(NvItemsIds.LEGACY_NWK_SEC_MATERIAL_TABLE_START + i, Buffer.from('000000000000000000000000', 'hex'));
        }
        mockZnpRequestWith(builder);

        const backup = await adapter.backup([]);
        expect(backup.networkKeyInfo.frameCounter).toBe(1250);
    });

    it('should create backup with 3.0.x adapter - security material table with generic record', async () => {
        const builder = commissioned3AlignedRequestMock.clone();
        mockZnpRequestWith(builder);
        const result = await adapter.start();
        expect(result).toBe('resumed');
        for (let i = 0; i < 4; i++) {
            builder.nv(NvItemsIds.LEGACY_NWK_SEC_MATERIAL_TABLE_START + i, Buffer.from('000000000000000000000000', 'hex'));
        }
        const genericEntry = Structs.nwkSecMaterialDescriptorEntry();
        genericEntry.extendedPanID = Buffer.from('ffffffffffffffff', 'hex');
        genericEntry.FrameCounter = 8737;
        builder.nv(NvItemsIds.LEGACY_NWK_SEC_MATERIAL_TABLE_START + 3, genericEntry.serialize('aligned'));
        mockZnpRequestWith(builder);

        const backup = await adapter.backup([]);
        expect(backup.networkKeyInfo.frameCounter).toBe(8737);
    });

    it('should create backup with 1.2 adapter', async () => {
        mockZnpRequestWith(commissioned12UnalignedRequestMock);
        const result = await adapter.start();
        expect(result).toBe('resumed');

        const backup = await adapter.backup([]);
        expect(backup.networkKeyInfo.frameCounter).toBe(0);
    });

    it('should keep missing devices in backup', async () => {
        const backupFile = getTempFile();
        const backupWithMissingDevice = JSON.parse(JSON.stringify(backupMatchingConfig));
        backupWithMissingDevice.devices.push({
            nwk_address: '20fa',
            ieee_address: '00128d11124fa80b',
            link_key: {
                key: 'bff550908aa1529ee90eea3c3bdc26fc',
                rx_counter: 0,
                tx_counter: 2,
            },
        });
        fs.writeFileSync(backupFile, JSON.stringify(backupMatchingConfig), 'utf8');
        adapter = new ZStackAdapter(networkOptions, serialPortOptions, backupFile, {concurrent: 3});
        mockZnpRequestWith(empty3AlignedRequestMock);
        await adapter.start();
        fs.writeFileSync(backupFile, JSON.stringify(backupWithMissingDevice), 'utf8');
        const devicesInDatabase = backupWithMissingDevice.devices.map((d) => ZSpec.Utils.eui64BEBufferToHex(d.ieee_address));
        const backup = await adapter.backup(devicesInDatabase);
        const missingDevice = backup.devices.find((d) => d.ieeeAddress.toString('hex') == '00128d11124fa80b');
        expect(missingDevice).not.toBeNull();
        expect(backupWithMissingDevice.devices.length).toBe(backup.devices.length);
        expect(missingDevice?.linkKey?.key.toString('hex')).toBe('bff550908aa1529ee90eea3c3bdc26fc');
    });

    it('should fail when backup file is corrupted - Coordinator backup is corrupted', async () => {
        const backupFile = getTempFile();
        fs.writeFileSync(backupFile, '{', 'utf8');
        adapter = new ZStackAdapter(networkOptions, serialPortOptions, backupFile, {concurrent: 3});
        mockZnpRequestWith(empty3AlignedRequestMock);
        await expect(adapter.start()).rejects.toThrowError('Coordinator backup is corrupted');
    });

    it('should fail to restore unified backup with 3.0.x adapter - invalid open coordinator backup version', async () => {
        const backupFile = getTempFile();
        let backupData: UnifiedBackupStorage = JSON.parse(JSON.stringify(backupMatchingConfig));
        backupData = {
            ...backupData,
            metadata: {
                ...backupData.metadata,
                version: 99 as any,
            },
        };

        fs.writeFileSync(backupFile, JSON.stringify(backupData), 'utf8');
        adapter = new ZStackAdapter(networkOptions, serialPortOptions, backupFile, {concurrent: 3});
        mockZnpRequestWith(empty3AlignedRequestMock);
        await expect(adapter.start()).rejects.toThrowError('Unsupported open coordinator backup version (version=99)');
    });

    it('should fail to restore (unified) backup with 3.0.x adapter - unsupported backup format', async () => {
        const backupFile = getTempFile();
        let backupData: UnifiedBackupStorage = JSON.parse(JSON.stringify(backupMatchingConfig));
        backupData = {
            ...backupData,
            metadata: {
                ...backupData.metadata,
                version: undefined,
            },
        };

        fs.writeFileSync(backupFile, JSON.stringify(backupData), 'utf8');
        adapter = new ZStackAdapter(networkOptions, serialPortOptions, backupFile, {concurrent: 3});
        mockZnpRequestWith(empty3AlignedRequestMock);
        await expect(adapter.start()).rejects.toThrowError('Unknown backup format');
    });

    it('should fail to restore unified backup with 3.0.x adapter - insufficient tclk table size', async () => {
        const backupFile = getTempFile();
        let backupData: UnifiedBackupStorage = JSON.parse(JSON.stringify(backupMatchingConfig));
        fs.writeFileSync(backupFile, JSON.stringify(backupData), 'utf8');

        const builder = empty3AlignedRequestMock.clone();
        for (let i = 0; i < 16; i++) {
            builder.nv(NvItemsIds.LEGACY_TCLK_TABLE_START + i, null);
        }
        builder.nv(NvItemsIds.LEGACY_TCLK_TABLE_START + 0, Buffer.from('0000000000000000000000000000000000000000', 'hex'));
        mockZnpRequestWith(builder);

        adapter = new ZStackAdapter(networkOptions, serialPortOptions, backupFile, {concurrent: 3});
        await expect(adapter.start()).rejects.toThrowError('target adapter tclk table size insufficient (size=1)');
    });

    it('should fail to restore unified backup with 3.0.x adapter - insufficient aps link key data table size', async () => {
        const backupFile = getTempFile();
        let backupData: UnifiedBackupStorage = JSON.parse(JSON.stringify(backupMatchingConfig));
        fs.writeFileSync(backupFile, JSON.stringify(backupData), 'utf8');

        const builder = empty3AlignedRequestMock.clone();
        for (let i = 0; i < 16; i++) {
            builder.nv(NvItemsIds.APS_LINK_KEY_DATA_START + i, null);
        }
        builder.nv(NvItemsIds.APS_LINK_KEY_DATA_START + 0, Buffer.from('000000000000000000000000000000000000000000000000', 'hex'));
        mockZnpRequestWith(builder);

        adapter = new ZStackAdapter(networkOptions, serialPortOptions, backupFile, {concurrent: 3});
        await expect(adapter.start()).rejects.toThrowError('target adapter aps link key data table size insufficient (size=1)');
    });

    it('should fail to restore unified backup with 3.0.x adapter - insufficient security manager table size', async () => {
        const backupFile = getTempFile();
        let backupData: UnifiedBackupStorage = JSON.parse(JSON.stringify(backupMatchingConfig));
        fs.writeFileSync(backupFile, JSON.stringify(backupData), 'utf8');

        const builder = empty3AlignedRequestMock.clone();
        builder.nv(NvItemsIds.APS_LINK_KEY_TABLE, Buffer.from('0000feff00000000', 'hex'));
        mockZnpRequestWith(builder);

        adapter = new ZStackAdapter(networkOptions, serialPortOptions, backupFile, {concurrent: 3});
        await expect(adapter.start()).rejects.toThrowError('target adapter security manager table size insufficient (size=1)');
    });

    it('should fail to restore unified backup with 1.2 adapter - backup from newer adapter', async () => {
        const backupFile = getTempFile();
        let backupData: UnifiedBackupStorage = JSON.parse(JSON.stringify(backupMatchingConfig));
        fs.writeFileSync(backupFile, JSON.stringify(backupData), 'utf8');

        mockZnpRequestWith(empty12UnalignedRequestMock);
        adapter = new ZStackAdapter(networkOptions, serialPortOptions, backupFile, {concurrent: 3});
        await expect(adapter.start()).rejects.toThrowError(
            'your backup is from newer platform version (Z-Stack 3.0.x+) and cannot be restored onto Z-Stack 1.2 adapter - please remove backup before proceeding',
        );
    });

    it('should fail to create backup with 3.0.x adapter - unable to read ieee address', async () => {
        mockZnpRequestWith(commissioned3AlignedRequestMock.clone().handle(Subsystem.SYS, 'getExtAddr', () => ({payload: {}})));
        const result = await adapter.start();
        expect(result).toBe('resumed');
        await expect(adapter.backup([])).rejects.toThrowError('Failed to read adapter IEEE address');
    });

    it('should fail to create backup with 3.0.x adapter - adapter not commissioned - missing nib', async () => {
        const builder = empty3AlignedRequestMock.clone();
        mockZnpRequestWith(builder);
        const result = await adapter.start();
        expect(result).toBe('reset');
        builder.nv(NvItemsIds.NIB, null);
        mockZnpRequestWith(builder);
        await expect(adapter.backup([])).rejects.toThrowError('Cannot backup - adapter not commissioned');
    });

    it('should fail to create backup with 3.0.x adapter - missing active key info', async () => {
        const builder = empty3AlignedRequestMock.clone();
        mockZnpRequestWith(builder);
        const result = await adapter.start();
        expect(result).toBe('reset');
        builder.nv(NvItemsIds.NWK_ACTIVE_KEY_INFO, null);
        mockZnpRequestWith(builder);
        await expect(adapter.backup([])).rejects.toThrowError('Cannot backup - missing active key info');
    });

    it('should restore legacy backup with 3.0.x adapter - empty', async () => {
        const backupFile = getTempFile();
        fs.writeFileSync(backupFile, JSON.stringify(legacyBackup), 'utf8');
        adapter = new ZStackAdapter(networkOptions, serialPortOptions, backupFile, {concurrent: 3});
        mockZnpRequestWith(empty3AlignedRequestMock);
        const result = await adapter.start();
        expect(result).toBe('restored');
    });

    it('should fail to restore legacy backup with 3.0.x adapter - missing NIB', async () => {
        const backupFile = getTempFile();
        const backup = JSON.parse(JSON.stringify(legacyBackup));
        delete backup.data.ZCD_NV_NIB;
        fs.writeFileSync(backupFile, JSON.stringify(backup), 'utf8');
        adapter = new ZStackAdapter(networkOptions, serialPortOptions, backupFile, {concurrent: 3});
        mockZnpRequestWith(empty3AlignedRequestMock);
        await expect(adapter.start()).rejects.toThrowError('Backup corrupted - missing NIB');
    });

    it('should fail to restore legacy backup with 3.0.x adapter - missing active key info', async () => {
        const backupFile = getTempFile();
        const backup = JSON.parse(JSON.stringify(legacyBackup));
        delete backup.data.ZCD_NV_NWK_ACTIVE_KEY_INFO;
        fs.writeFileSync(backupFile, JSON.stringify(backup), 'utf8');
        adapter = new ZStackAdapter(networkOptions, serialPortOptions, backupFile, {concurrent: 3});
        mockZnpRequestWith(empty3AlignedRequestMock);
        await expect(adapter.start()).rejects.toThrowError('Backup corrupted - missing active key info');
    });

    it('should fail to restore legacy backup with 3.0.x adapter - missing pre-configured key enabled', async () => {
        const backupFile = getTempFile();
        const backup = JSON.parse(JSON.stringify(legacyBackup));
        delete backup.data.ZCD_NV_PRECFGKEY_ENABLE;
        fs.writeFileSync(backupFile, JSON.stringify(backup), 'utf8');
        adapter = new ZStackAdapter(networkOptions, serialPortOptions, backupFile, {concurrent: 3});
        mockZnpRequestWith(empty3AlignedRequestMock);
        await expect(adapter.start()).rejects.toThrowError('Backup corrupted - missing pre-configured key enable attribute');
    });

    it('should fail to restore legacy backup with 3.0.x adapter - pre-configured key enabled', async () => {
        const backupFile = getTempFile();
        const backup = JSON.parse(JSON.stringify(legacyBackup));
        delete backup.data.ZCD_NV_EX_NWK_SEC_MATERIAL_TABLE;
        delete backup.data.ZCD_NV_LEGACY_NWK_SEC_MATERIAL_TABLE_START;
        fs.writeFileSync(backupFile, JSON.stringify(backup), 'utf8');
        adapter = new ZStackAdapter(networkOptions, serialPortOptions, backupFile, {concurrent: 3});
        mockZnpRequestWith(empty3AlignedRequestMock);
        await expect(adapter.start()).rejects.toThrowError('Backup corrupted - missing network security material table');
    });

    it('should fail to restore legacy backup with 3.0.x adapter - missing adapter ieee address', async () => {
        const backupFile = getTempFile();
        const backup = JSON.parse(JSON.stringify(legacyBackup));
        delete backup.data.ZCD_NV_EXTADDR;
        fs.writeFileSync(backupFile, JSON.stringify(backup), 'utf8');
        adapter = new ZStackAdapter(networkOptions, serialPortOptions, backupFile, {concurrent: 3});
        mockZnpRequestWith(empty3AlignedRequestMock);
        await expect(adapter.start()).rejects.toThrow('Backup corrupted - missing adapter IEEE address NV entry');
    });

    it('should fail to start with 3.0.x adapter - commissioned, config-adapter mismatch', async () => {
        const backupFile = getTempFile();
        fs.writeFileSync(backupFile, JSON.stringify(backupMatchingConfig), 'utf8');

        adapter = new ZStackAdapter(networkOptionsMismatched, serialPortOptions, backupFile, {concurrent: 3});
        mockZnpRequestWith(commissioned3AlignedRequestMock);
        await expect(adapter.start()).rejects.toThrow('startup failed - configuration-adapter mismatch - see logs above for more information');
        expect(mockLogger.error.mock.calls[0][0]).toBe('Configuration is not consistent with adapter state/backup!');
        expect(mockLogger.error.mock.calls[1][0]).toBe('- PAN ID: configured=124, adapter=123');
        expect(mockLogger.error.mock.calls[2][0]).toBe('- Extended PAN ID: configured=00124b0009d69f77, adapter=00124b0009d69f77');
        expect(mockLogger.error.mock.calls[3][0]).toBe(
            '- Network Key: configured=01030507090b0d0f00020406080a0c0d, adapter=01030507090b0d0f00020406080a0c0d',
        );
        expect(mockLogger.error.mock.calls[4][0]).toBe('- Channel List: configured=21, adapter=21');
        expect(mockLogger.error.mock.calls[5][0]).toBe('Please update configuration to prevent further issues.');
        expect(mockLogger.error.mock.calls[6][0]).toMatch(
            `If you wish to re-commission your network, please remove coordinator backup at ${backupFile}`,
        );
        expect(mockLogger.error.mock.calls[7][0]).toBe('Re-commissioning your network will require re-pairing of all devices!');
    });

    it('should start with runInconsistent option with 3.0.x adapter - commissioned, config-adapter mismatch', async () => {
        const backupFile = getTempFile();
        fs.writeFileSync(backupFile, JSON.stringify(backupMatchingConfig), 'utf8');

        adapter = new ZStackAdapter(networkOptionsMismatched, serialPortOptions, backupFile, {
            concurrent: 3,
            forceStartWithInconsistentAdapterConfiguration: true,
        });
        mockZnpRequestWith(commissioned3AlignedRequestMock);
        const result = await adapter.start();
        expect(result).toBe('resumed');
        expect(mockLogger.error.mock.calls[0][0]).toBe('Configuration is not consistent with adapter state/backup!');
        expect(mockLogger.error.mock.calls[1][0]).toBe('- PAN ID: configured=124, adapter=123');
        expect(mockLogger.error.mock.calls[2][0]).toBe('- Extended PAN ID: configured=00124b0009d69f77, adapter=00124b0009d69f77');
        expect(mockLogger.error.mock.calls[3][0]).toBe(
            '- Network Key: configured=01030507090b0d0f00020406080a0c0d, adapter=01030507090b0d0f00020406080a0c0d',
        );
        expect(mockLogger.error.mock.calls[4][0]).toBe('- Channel List: configured=21, adapter=21');
        expect(mockLogger.error.mock.calls[5][0]).toBe('Please update configuration to prevent further issues.');
        expect(mockLogger.error.mock.calls[6][0]).toMatch(
            `If you wish to re-commission your network, please remove coordinator backup at ${backupFile}`,
        );
        expect(mockLogger.error.mock.calls[7][0]).toBe('Re-commissioning your network will require re-pairing of all devices!');
        expect(mockLogger.error.mock.calls[8][0]).toBe(
            'Running despite adapter configuration mismatch as configured. Please update the adapter to compatible firmware and recreate your network as soon as possible.',
        );
    });

    it('should start with 3.0.x adapter - backward-compat - reversed extended pan id', async () => {
        const backupFile = getTempFile();
        fs.writeFileSync(backupFile, JSON.stringify(backupMatchingConfig), 'utf8');

        adapter = new ZStackAdapter(networkOptions, serialPortOptions, backupFile, {concurrent: 3});
        const nib = Structs.nib(Buffer.from(commissioned3AlignedRequestMock.nvItems.find((item) => item.id === NvItemsIds.NIB).value));
        nib.extendedPANID = nib.extendedPANID.reverse();
        mockZnpRequestWith(commissioned3AlignedRequestMock.clone().nv(NvItemsIds.NIB, nib.serialize()));
        const result = await adapter.start();
        expect(result).toBe('resumed');
        expect(mockLogger.warning.mock.calls[0][0]).toBe('Extended PAN ID is reversed (expected=00124b0009d69f77, actual=779fd609004b1200)');
    });

    it('should restore unified backup with 3.0.x adapter - commissioned, mismatched adapter-config, matching config-backup', async () => {
        const backupFile = getTempFile();
        fs.writeFileSync(backupFile, JSON.stringify(backupMatchingConfig), 'utf8');
        adapter = new ZStackAdapter(networkOptions, serialPortOptions, backupFile, {concurrent: 3});
        mockZnpRequestWith(commissioned3AlignedConfigMistmachRequestMock);
        const result = await adapter.start();
        expect(result).toBe('restored');
    });

    it('should start network with 3.0.x adapter - resume in coordinator mode', async () => {
        mockZnpRequestWith(
            commissioned3AlignedRequestMock.clone().handle(Subsystem.UTIL, 'getDeviceInfo', () => ({payload: {devicestate: DevStates.ZB_COORD}})),
        );
        mockZnpWaitFor.mockImplementation((type, subsystem, command, target, transid, state, timeout) => {
            const missing = () => {
                const msg = `Not implemented - ${Type[type]} - ${Subsystem[subsystem]} - ${command} - ${target} - ${transid} - ${state} - ${timeout}`;
                console.log(msg);
                throw new Error(msg);
            };

            if (type === Type.AREQ && subsystem === Subsystem.ZDO && command === 'activeEpRsp') {
                return waitForResult(
                    mockZdoZpiObject<ActiveEndpointsResponse>('activeEpRsp', target, [
                        Zdo.Status.SUCCESS,
                        {
                            nwkAddress: 0,
                            endpointList: [1, 2, 3],
                        },
                    ]),
                );
            } else if (type === Type.AREQ && subsystem === Subsystem.ZDO && command === 'stateChangeInd') {
                return waitForResult({payload: {state: 9}});
            } else {
                missing();
            }
        });
        const result = await adapter.start();
        expect(result).toBe('resumed');
    });

    it('should start network with 3.0.x adapter - resume in coordinator mode, extGroupFind failed', async () => {
        mockZnpRequestWith(
            commissioned3AlignedRequestMock
                .clone()
                .handle(Subsystem.UTIL, 'getDeviceInfo', () => ({payload: {devicestate: DevStates.ZB_COORD}}))
                .handle(Subsystem.ZDO, 'extFindGroup', () => ({payload: {status: 1}})),
        );
        const result = await adapter.start();
        expect(result).toBe('resumed');
    });

    it('should commission network with 1.2 adapter', async () => {
        mockZnpRequestWith(empty12UnalignedRequestMock);
        const result = await adapter.start();
        expect(result).toBe('restored');
    });

    it('should commission network with 1.2 adapter - default extended pan id', async () => {
        mockZnpRequestWith(empty12UnalignedRequestMock);
        adapter = new ZStackAdapter(networkOptionsDefaultExtendedPanId, serialPortOptions, 'backup.json', {concurrent: 3});
        const result = await adapter.start();
        expect(result).toBe('restored');
    });

    it('should commission network with 1.2 adapter - old adapter without version reporting', async () => {
        mockZnpRequestWith(empty12UnalignedRequestMock.clone().handle(Subsystem.SYS, 'version', () => undefined));
        const result = await adapter.start();
        expect(result).toBe('restored');
    });

    it('should reset network with 1.2 adapter - config mismtach', async () => {
        mockZnpRequestWith(commissioned12UnalignedMismatchRequestMock);
        const result = await adapter.start();
        expect(result).toBe('reset');
    });

    it('Add install code: Install Code + CRC', async () => {
        basicMocks();
        await adapter.start();
        await adapter.addInstallCode(
            '0x9035EAFFFE424783',
            Buffer.from([0xae, 0x3b, 0x28, 0x72, 0x81, 0xcf, 0x16, 0xf5, 0x50, 0x73, 0x3a, 0x0c, 0xec, 0x38, 0xaa, 0x31, 0xe8, 0x02]),
            false,
        );
        const payload = {
            installCodeFormat: 0x1,
            ieeeaddr: '0x9035EAFFFE424783',
            installCode: Buffer.from([0xae, 0x3b, 0x28, 0x72, 0x81, 0xcf, 0x16, 0xf5, 0x50, 0x73, 0x3a, 0x0c, 0xec, 0x38, 0xaa, 0x31, 0xe8, 0x02]),
        };
        expect(mockZnpRequest).toHaveBeenCalledWith(Subsystem.APP_CNF, 'bdbAddInstallCode', payload);
    });

    it('Add install code: Key derived from Install Code', async () => {
        basicMocks();
        await adapter.start();
        await adapter.addInstallCode(
            '0x9035EAFFFE424783',
            Buffer.from([0xae, 0x3b, 0x28, 0x72, 0x81, 0xcf, 0x16, 0xf5, 0x50, 0x73, 0x3a, 0x0c, 0xec, 0x38, 0xaa, 0x31]),
            true,
        );
        const payload = {
            installCodeFormat: 0x2,
            ieeeaddr: '0x9035EAFFFE424783',
            installCode: Buffer.from([0xae, 0x3b, 0x28, 0x72, 0x81, 0xcf, 0x16, 0xf5, 0x50, 0x73, 0x3a, 0x0c, 0xec, 0x38, 0xaa, 0x31]),
        };
        expect(mockZnpRequest).toHaveBeenCalledWith(Subsystem.APP_CNF, 'bdbAddInstallCode', payload);
    });

    it('LED behaviour: disable LED true, firmware not handling leds', async () => {
        basicMocks();
        adapter = new ZStackAdapter(networkOptions, serialPortOptions, 'backup.json', {disableLED: true});
        await adapter.start();
        expect(mockZnpRequest).toHaveBeenCalledWith(Subsystem.UTIL, 'ledControl', {ledid: 3, mode: 0}, undefined, 500);
        mockZnpRequest.mockClear();
        mockQueueExecute.mockClear();
        await adapter.permitJoin(255, 0);
        expect(mockZnpRequest).not.toHaveBeenCalledWith(Subsystem.UTIL, 'ledControl', expect.any(Object), undefined, 500);
        mockZnpRequest.mockClear();
        mockQueueExecute.mockClear();
        await adapter.permitJoin(0, 0);
        expect(mockZnpRequest).not.toHaveBeenCalledWith(Subsystem.UTIL, 'ledControl', expect.any(Object), undefined, 500);
    });

    it('LED behaviour: disable LED false, firmware not handling leds', async () => {
        basicMocks();
        adapter = new ZStackAdapter(networkOptions, serialPortOptions, 'backup.json', {disableLED: false});
        await adapter.start();
        expect(mockZnpRequest).not.toHaveBeenCalledWith(Subsystem.UTIL, 'ledControl', expect.any(Object), undefined, 500);
        mockZnpRequest.mockClear();
        mockQueueExecute.mockClear();
        await adapter.permitJoin(255, 0);
        expect(mockZnpRequest).toHaveBeenCalledWith(Subsystem.UTIL, 'ledControl', {ledid: 3, mode: 1}, undefined, 500);
        mockZnpRequest.mockClear();
        mockQueueExecute.mockClear();
        await adapter.permitJoin(0, 0);
        expect(mockZnpRequest).toHaveBeenCalledWith(Subsystem.UTIL, 'ledControl', {ledid: 3, mode: 0}, undefined, 500);
    });

    it('LED behaviour: disable LED true, firmware handling leds', async () => {
        mockZnpRequestWith(
            baseZnpRequestMock.clone().handle(Subsystem.SYS, 'version', (payload) => {
                return {payload: {product: ZnpVersion.zStack30x, revision: 20211030}};
            }),
        );
        adapter = new ZStackAdapter(networkOptions, serialPortOptions, 'backup.json', {disableLED: true});
        await adapter.start();
        expect(mockZnpRequest).toHaveBeenCalledWith(Subsystem.UTIL, 'ledControl', {ledid: 0xff, mode: 5}, undefined, 500);
        mockZnpRequest.mockClear();
        mockQueueExecute.mockClear();
        await adapter.permitJoin(255, 0);
        expect(mockZnpRequest).not.toHaveBeenCalledWith(Subsystem.UTIL, 'ledControl', expect.any(Object), undefined, 500);
        mockZnpRequest.mockClear();
        mockQueueExecute.mockClear();
        await adapter.permitJoin(0, 0);
        expect(mockZnpRequest).not.toHaveBeenCalledWith(Subsystem.UTIL, 'ledControl', expect.any(Object), undefined, 500);
    });

    it('LED behaviour: disable LED false, firmware handling leds', async () => {
        mockZnpRequestWith(
            baseZnpRequestMock.clone().handle(Subsystem.SYS, 'version', (payload) => {
                return {payload: {product: ZnpVersion.zStack30x, revision: 20211030}};
            }),
        );
        adapter = new ZStackAdapter(networkOptions, serialPortOptions, 'backup.json', {disableLED: false});
        await adapter.start();
        expect(mockZnpRequest).not.toHaveBeenCalledWith(Subsystem.UTIL, 'ledControl', expect.any(Object), null, 500);
        mockZnpRequest.mockClear();
        mockQueueExecute.mockClear();
        await adapter.permitJoin(255, 0);
        expect(mockZnpRequest).not.toHaveBeenCalledWith(Subsystem.UTIL, 'ledControl', expect.any(Object), null, 500);
        mockZnpRequest.mockClear();
        mockQueueExecute.mockClear();
        await adapter.permitJoin(0, 0);
        expect(mockZnpRequest).not.toHaveBeenCalledWith(Subsystem.UTIL, 'ledControl', expect.any(Object), null, 500);
    });

    /* Original Tests */

    it('Call znp constructor', async () => {
        expect(Znp).toHaveBeenCalledWith('dummy', 800, false);
    });

    it('Close adapter', async () => {
        basicMocks();
        await adapter.start();
        await adapter.stop();
        expect(mockZnpClose).toHaveBeenCalledTimes(1);
    });

    it('Get coordinator IEEE', async () => {
        basicMocks();
        await adapter.start();
        const ieee = await adapter.getCoordinatorIEEE();
        expect(ieee).toStrictEqual('0x00124b0009d80ba7');
    });

    it('Permit join all', async () => {
        basicMocks();
        await adapter.start();
        mockZnpRequest.mockClear();
        mockZnpRequestZdo.mockClear();
        mockQueueExecute.mockClear();
        await adapter.permitJoin(100);
        expect(mockZnpRequest).toHaveBeenCalledTimes(1);
        expect(mockZnpRequestZdo).toHaveBeenCalledTimes(1);
        const zdoPayload = Zdo.Buffalo.buildRequest(false, Zdo.ClusterId.PERMIT_JOINING_REQUEST, 100, 1, []);
        expect(mockZnpRequestZdo).toHaveBeenCalledWith(
            Zdo.ClusterId.PERMIT_JOINING_REQUEST,
            Buffer.from([
                AddressMode.ADDR_BROADCAST,
                ZSpec.BroadcastAddress.DEFAULT & 0xff,
                (ZSpec.BroadcastAddress.DEFAULT >> 8) & 0xff,
                ...zdoPayload,
            ]),
            undefined,
            // Subsystem.ZDO, 'mgmtPermitJoinReq', {
            //     addrmode: 0x0f,
            //     dstaddr: 0xfffc,
            //     duration: 100,
            //     tcsignificance: 0,
            // }
        );
        expect(mockZnpRequest).toHaveBeenCalledWith(Subsystem.UTIL, 'ledControl', {ledid: 3, mode: 1}, undefined, 500);
    });

    it('Permit join specific networkAddress', async () => {
        basicMocks();
        await adapter.start();
        mockZnpRequest.mockClear();
        mockZnpRequestZdo.mockClear();
        mockQueueExecute.mockClear();
        await adapter.permitJoin(102, 42102);
        expect(mockZnpRequest).toHaveBeenCalledTimes(1);
        expect(mockZnpRequestZdo).toHaveBeenCalledTimes(1);
        const zdoPayload = Zdo.Buffalo.buildRequest(false, Zdo.ClusterId.PERMIT_JOINING_REQUEST, 102, 1, []);
        expect(mockZnpRequestZdo).toHaveBeenCalledWith(
            Zdo.ClusterId.PERMIT_JOINING_REQUEST,
            Buffer.from([AddressMode.ADDR_16BIT, 42102 & 0xff, (42102 >> 8) & 0xff, ...zdoPayload]),
            expect.any(Number),
            // Subsystem.ZDO, 'mgmtPermitJoinReq', {
            //     addrmode: 2,
            //     dstaddr: 42102,
            //     duration: 102,
            //     tcsignificance: 0,
            // }
        );
        expect(mockZnpRequest).toHaveBeenCalledWith(Subsystem.UTIL, 'ledControl', {ledid: 3, mode: 1}, undefined, 500);
    });

    it('Get coordinator version', async () => {
        basicMocks();
        await adapter.start();
        mockZnpRequest.mockClear();
        mockQueueExecute.mockClear();
        expect(await adapter.getCoordinatorVersion()).toStrictEqual({type: 'zStack3x0', meta: {revision: 20210430, product: 1}});
    });

    it('Soft reset', async () => {
        basicMocks();
        await adapter.start();
        mockZnpRequest.mockClear();
        mockQueueExecute.mockClear();
        await adapter.reset('soft');
        expect(mockZnpRequest).toHaveBeenCalledTimes(1);
        expect(mockZnpRequest).toHaveBeenCalledWith(Subsystem.SYS, 'resetReq', {type: 1});
    });

    it('Hard reset', async () => {
        basicMocks();
        await adapter.start();
        mockZnpRequest.mockClear();
        mockQueueExecute.mockClear();
        await adapter.reset('hard');
        expect(mockZnpRequest).toHaveBeenCalledTimes(1);
        expect(mockZnpRequest).toHaveBeenCalledWith(Subsystem.SYS, 'resetReq', {type: 0});
    });

    it('Start with transmit power set', async () => {
        basicMocks();
        adapter = new ZStackAdapter(networkOptions, serialPortOptions, 'backup.json', {transmitPower: 2, disableLED: false});
        await adapter.start();
        expect(mockZnpRequest).toHaveBeenCalledWith(Subsystem.SYS, 'stackTune', {operation: 0, value: 2});
    });

    it('Support LED should go to false when LED request fails', async () => {
        basicMocks();
        await adapter.start();
        mockZnpRequest.mockClear();
        mockQueueExecute.mockClear();
        mockZnpRequest.mockImplementation(
            (_, cmd) =>
                new Promise((resolve, reject) => {
                    if (cmd == 'ledControl') reject('FAILED');
                    else resolve(undefined);
                }),
        );
        await adapter.permitJoin(0, 0);
        expect(mockZnpRequest).toHaveBeenCalledWith(Subsystem.UTIL, 'ledControl', {ledid: 3, mode: 0}, undefined, 500);
        mockZnpRequest.mockClear();
        mockQueueExecute.mockClear();
        await adapter.permitJoin(0, 0);
        expect(mockZnpRequest).not.toHaveBeenCalledWith(Subsystem.UTIL, 'ledControl', {ledid: 3, mode: 0}, undefined, 500);
    });

    it('Send zcl frame network address', async () => {
        basicMocks();
        await adapter.start();

        mockZnpRequest.mockClear();
        mockQueueExecute.mockClear();
        const frame = Zcl.Frame.create(
            Zcl.FrameType.GLOBAL,
            Zcl.Direction.CLIENT_TO_SERVER,
            true,
            undefined,
            100,
            'writeNoRsp',
            0,
            [{attrId: 0, dataType: 0, attrData: null}],
            {},
        );
        await adapter.sendZclFrameToEndpoint('0x02', 2, 20, frame, 10000, false, false);
        expect(mockQueueExecute.mock.calls[0][1]).toBe(2);
        expect(mockZnpRequest).toHaveBeenCalledTimes(1);
        expect(mockZnpRequest).toHaveBeenCalledWith(
            4,
            'dataRequest',
            {clusterid: 0, data: frame.toBuffer(), destendpoint: 20, dstaddr: 2, len: 6, options: 0, radius: 30, srcendpoint: 1, transid: 1},
            99,
        );
    });

    it('Send zcl frame network address retry on MAC channel access failure', async () => {
        basicMocks();
        dataConfirmCode = 225;
        dataConfirmCodeReset = true;
        await adapter.start();
        mockZnpRequest.mockClear();
        mockQueueExecute.mockClear();
        const frame = Zcl.Frame.create(
            Zcl.FrameType.GLOBAL,
            Zcl.Direction.CLIENT_TO_SERVER,
            true,
            undefined,
            100,
            'writeNoRsp',
            0,
            [{attrId: 0, dataType: 0, attrData: null}],
            {},
        );
        await adapter.sendZclFrameToEndpoint('0x02', 2, 20, frame, 10000, false, false);
        expect(mockQueueExecute.mock.calls[0][1]).toBe(2);
        expect(mockZnpRequest).toHaveBeenCalledTimes(2);
        expect(mockZnpRequest).toHaveBeenCalledWith(
            4,
            'dataRequest',
            {clusterid: 0, data: frame.toBuffer(), destendpoint: 20, dstaddr: 2, len: 6, options: 0, radius: 30, srcendpoint: 1, transid: 1},
            99,
        );
    });

    it('Send zcl frame network address dataConfirm fails', async () => {
        basicMocks();
        await adapter.start();
        dataConfirmCode = 201;
        mockZnpRequest.mockClear();
        mockQueueExecute.mockClear();
        const frame = Zcl.Frame.create(
            Zcl.FrameType.GLOBAL,
            Zcl.Direction.CLIENT_TO_SERVER,
            true,
            undefined,
            100,
            'writeNoRsp',
            0,
            [{attrId: 0, dataType: 0, attrData: null}],
            {},
        );
        let error;
        try {
            await adapter.sendZclFrameToEndpoint('0x02', 2, 20, frame, 10000, false, false);
        } catch (e) {
            error = e;
        }
        expect(error.message).toStrictEqual("Data request failed with error: 'undefined' (201)");
    });

    it('Send zcl frame network address with default response', async () => {
        basicMocks();
        await adapter.start();
        const defaultReponse = Zcl.Frame.create(
            Zcl.FrameType.GLOBAL,
            Zcl.Direction.SERVER_TO_CLIENT,
            true,
            undefined,
            100,
            'defaultRsp',
            0,
            {cmdId: 0, status: 0},
            {},
        );
        const object = mockZpiObject(Type.AREQ, Subsystem.AF, 'incomingMsg', {
            clusterid: 0,
            srcendpoint: 20,
            srcaddr: 2,
            linkquality: 101,
            groupid: 12,
            data: defaultReponse.toBuffer(),
        });
        mockZnpRequest.mockClear();
        mockQueueExecute.mockClear();
        const frame = Zcl.Frame.create(
            Zcl.FrameType.GLOBAL,
            Zcl.Direction.CLIENT_TO_SERVER,
            false,
            undefined,
            100,
            'writeNoRsp',
            0,
            [{attrId: 0, dataType: 0, attrData: null}],
            {},
        );
        const request = adapter.sendZclFrameToEndpoint('0x02', 2, 20, frame, 10000, false, false);
        znpReceived(object);
        await request;
        expect(mockQueueExecute.mock.calls[0][1]).toBe(2);
        expect(mockZnpRequest).toHaveBeenCalledTimes(1);
        expect(mockZnpRequest).toHaveBeenCalledWith(
            4,
            'dataRequest',
            {clusterid: 0, data: frame.toBuffer(), destendpoint: 20, dstaddr: 2, len: 6, options: 0, radius: 30, srcendpoint: 1, transid: 1},
            99,
        );
    });

    it('Send zcl frame network address fails because mac transaction expire, should retry', async () => {
        basicMocks();
        await adapter.start();
        dataConfirmCode = 240;
        mockZnpRequest.mockClear();
        mockZnpRequestZdo.mockClear();
        mockQueueExecute.mockClear();
        const frame = Zcl.Frame.create(
            Zcl.FrameType.GLOBAL,
            Zcl.Direction.CLIENT_TO_SERVER,
            true,
            undefined,
            100,
            'writeNoRsp',
            0,
            [{attrId: 0, dataType: 0, attrData: null}],
            {},
        );
        const response = adapter.sendZclFrameToEndpoint('0x02', 2, 20, frame, 10000, false, false);
        let error;
        try {
            await response;
        } catch (e) {
            error = e;
        }

        expect(error.message).toStrictEqual("Data request failed with error: 'MAC transaction expired' (240)");
        expect(mockZnpRequest).toHaveBeenCalledTimes(9);
        expect(mockZnpRequestZdo).toHaveBeenCalledTimes(1);
        expect(mockZnpRequest).toHaveBeenNthCalledWith(
            1,
            4,
            'dataRequest',
            {clusterid: 0, data: frame.toBuffer(), destendpoint: 20, dstaddr: 2, len: 6, options: 0, radius: 30, srcendpoint: 1, transid: 1},
            99,
        );
        expect(mockZnpRequest).toHaveBeenNthCalledWith(
            2,
            4,
            'dataRequest',
            {clusterid: 0, data: frame.toBuffer(), destendpoint: 20, dstaddr: 2, len: 6, options: 0, radius: 30, srcendpoint: 1, transid: 2},
            99,
        );
        expect(mockZnpRequest).toHaveBeenNthCalledWith(3, 7, 'assocGetWithAddress', {extaddr: '0x02', nwkaddr: 2});
        expect(mockZnpRequest).toHaveBeenNthCalledWith(4, 7, 'assocRemove', {ieeeadr: '0x02'});
        expect(mockZnpRequest).toHaveBeenNthCalledWith(
            5,
            4,
            'dataRequest',
            {clusterid: 0, data: frame.toBuffer(), destendpoint: 20, dstaddr: 2, len: 6, options: 0, radius: 30, srcendpoint: 1, transid: 3},
            99,
        );
        expect(mockZnpRequest).toHaveBeenNthCalledWith(6, 7, 'assocAdd', {ieeeadr: '0x02', noderelation: 1, nwkaddr: 2});
        expect(mockZnpRequest).toHaveBeenNthCalledWith(7, 5, 'extRouteDisc', {dstAddr: 2, options: 0, radius: 30});
        expect(mockZnpRequest).toHaveBeenNthCalledWith(
            8,
            4,
            'dataRequest',
            {clusterid: 0, data: frame.toBuffer(), destendpoint: 20, dstaddr: 2, len: 6, options: 0, radius: 30, srcendpoint: 1, transid: 4},
            99,
        );
        expect(mockZnpRequestZdo).toHaveBeenCalledWith(
            Zdo.ClusterId.NETWORK_ADDRESS_REQUEST,
            Zdo.Buffalo.buildRequest(false, Zdo.ClusterId.NETWORK_ADDRESS_REQUEST, '0x02', false, 0),
            expect.any(Number),
            //9, 5, 'nwkAddrReq', {ieeeaddr: '0x02', reqtype: 0, startindex: 0}
        );
        expect(mockZnpRequest).toHaveBeenNthCalledWith(
            9,
            4,
            'dataRequest',
            {clusterid: 0, data: frame.toBuffer(), destendpoint: 20, dstaddr: 2, len: 6, options: 0, radius: 30, srcendpoint: 1, transid: 5},
            99,
        );
    });

    it('Send zcl frame network address fails because mac transaction expire when not being a parent, should retry', async () => {
        basicMocks();
        await adapter.start();
        dataConfirmCode = 240;
        assocGetWithAddressNodeRelation = 255;
        mockZnpRequest.mockClear();
        mockZnpRequestZdo.mockClear();
        mockQueueExecute.mockClear();
        const frame = Zcl.Frame.create(
            Zcl.FrameType.GLOBAL,
            Zcl.Direction.CLIENT_TO_SERVER,
            true,
            undefined,
            100,
            'writeNoRsp',
            0,
            [{attrId: 0, dataType: 0, attrData: null}],
            {},
        );
        const response = adapter.sendZclFrameToEndpoint('0x02', 2, 20, frame, 10000, false, false);
        let error;
        try {
            await response;
        } catch (e) {
            error = e;
        }

        expect(error.message).toStrictEqual("Data request failed with error: 'MAC transaction expired' (240)");
        expect(mockZnpRequest).toHaveBeenCalledTimes(7);
        expect(mockZnpRequestZdo).toHaveBeenCalledTimes(1);
        expect(mockZnpRequest).toHaveBeenNthCalledWith(
            1,
            4,
            'dataRequest',
            {clusterid: 0, data: frame.toBuffer(), destendpoint: 20, dstaddr: 2, len: 6, options: 0, radius: 30, srcendpoint: 1, transid: 1},
            99,
        );
        expect(mockZnpRequest).toHaveBeenNthCalledWith(
            2,
            4,
            'dataRequest',
            {clusterid: 0, data: frame.toBuffer(), destendpoint: 20, dstaddr: 2, len: 6, options: 0, radius: 30, srcendpoint: 1, transid: 2},
            99,
        );
        expect(mockZnpRequest).toHaveBeenNthCalledWith(3, 7, 'assocGetWithAddress', {extaddr: '0x02', nwkaddr: 2});
        expect(mockZnpRequest).toHaveBeenNthCalledWith(4, 5, 'extRouteDisc', {dstAddr: 2, options: 0, radius: 30});
        expect(mockZnpRequest).toHaveBeenNthCalledWith(
            5,
            4,
            'dataRequest',
            {clusterid: 0, data: frame.toBuffer(), destendpoint: 20, dstaddr: 2, len: 6, options: 0, radius: 30, srcendpoint: 1, transid: 3},
            99,
        );
        expect(mockZnpRequestZdo).toHaveBeenCalledWith(
            Zdo.ClusterId.NETWORK_ADDRESS_REQUEST,
            Zdo.Buffalo.buildRequest(false, Zdo.ClusterId.NETWORK_ADDRESS_REQUEST, '0x02', false, 0),
            expect.any(Number),
            //6, 5, 'nwkAddrReq', {ieeeaddr: '0x02', reqtype: 0, startindex: 0}
        );
        expect(mockZnpRequest).toHaveBeenNthCalledWith(
            6,
            4,
            'dataRequest',
            {clusterid: 0, data: frame.toBuffer(), destendpoint: 20, dstaddr: 2, len: 6, options: 0, radius: 30, srcendpoint: 1, transid: 4},
            99,
        );
        expect(mockZnpRequest).toHaveBeenNthCalledWith(
            7,
            4,
            'dataRequest',
            {clusterid: 0, data: frame.toBuffer(), destendpoint: 20, dstaddr: 2, len: 6, options: 0, radius: 30, srcendpoint: 1, transid: 5},
            99,
        );
    });

    it('Send zcl frame network address fails because mac no ack, should retry', async () => {
        basicMocks();
        await adapter.start();
        dataConfirmCode = 233;
        mockZnpRequest.mockClear();
        mockZnpRequestZdo.mockClear();
        mockQueueExecute.mockClear();
        const frame = Zcl.Frame.create(
            Zcl.FrameType.GLOBAL,
            Zcl.Direction.CLIENT_TO_SERVER,
            true,
            undefined,
            100,
            'writeNoRsp',
            0,
            [{attrId: 0, dataType: 0, attrData: null}],
            {},
        );
        const response = adapter.sendZclFrameToEndpoint('0x02', 2, 20, frame, 10000, false, false);
        let error;
        try {
            await response;
        } catch (e) {
            error = e;
        }

        expect(error.message).toStrictEqual("Data request failed with error: 'MAC no ack' (233)");
        expect(mockZnpRequest).toHaveBeenCalledTimes(6);
        expect(mockZnpRequestZdo).toHaveBeenCalledTimes(1);
        expect(mockZnpRequest).toHaveBeenNthCalledWith(
            1,
            4,
            'dataRequest',
            {clusterid: 0, data: frame.toBuffer(), destendpoint: 20, dstaddr: 2, len: 6, options: 0, radius: 30, srcendpoint: 1, transid: 1},
            99,
        );
        expect(mockZnpRequest).toHaveBeenNthCalledWith(
            2,
            4,
            'dataRequest',
            {clusterid: 0, data: frame.toBuffer(), destendpoint: 20, dstaddr: 2, len: 6, options: 0, radius: 30, srcendpoint: 1, transid: 2},
            99,
        );
        expect(mockZnpRequest).toHaveBeenNthCalledWith(3, 5, 'extRouteDisc', {dstAddr: 2, options: 0, radius: 30});
        expect(mockZnpRequest).toHaveBeenNthCalledWith(
            4,
            4,
            'dataRequest',
            {clusterid: 0, data: frame.toBuffer(), destendpoint: 20, dstaddr: 2, len: 6, options: 0, radius: 30, srcendpoint: 1, transid: 3},
            99,
        );
        expect(mockZnpRequestZdo).toHaveBeenCalledWith(
            Zdo.ClusterId.NETWORK_ADDRESS_REQUEST,
            Zdo.Buffalo.buildRequest(false, Zdo.ClusterId.NETWORK_ADDRESS_REQUEST, '0x02', false, 0),
            expect.any(Number),
            //5, 5, 'nwkAddrReq', {ieeeaddr: '0x02', reqtype: 0, startindex: 0}
        );
        expect(mockZnpRequest).toHaveBeenNthCalledWith(
            5,
            4,
            'dataRequest',
            {clusterid: 0, data: frame.toBuffer(), destendpoint: 20, dstaddr: 2, len: 6, options: 0, radius: 30, srcendpoint: 1, transid: 4},
            99,
        );
        expect(mockZnpRequest).toHaveBeenNthCalledWith(
            6,
            4,
            'dataRequest',
            {clusterid: 0, data: frame.toBuffer(), destendpoint: 20, dstaddr: 2, len: 6, options: 0, radius: 30, srcendpoint: 1, transid: 5},
            99,
        );
    });

    it('Send zcl frame network address fails because mac no ack with network address change, should retry', async () => {
        basicMocks();
        await adapter.start();
        dataConfirmCode = 233;
        mockZnpRequest.mockClear();
        mockZnpRequestZdo.mockClear();
        mockQueueExecute.mockClear();
        const frame = Zcl.Frame.create(
            Zcl.FrameType.GLOBAL,
            Zcl.Direction.CLIENT_TO_SERVER,
            true,
            undefined,
            100,
            'writeNoRsp',
            0,
            [{attrId: 0, dataType: 0, attrData: null}],
            {},
        );
        const response = adapter.sendZclFrameToEndpoint('0x03', 2, 20, frame, 10000, false, false);
        let error;
        try {
            await response;
        } catch (e) {
            error = e;
        }

        expect(error.message).toStrictEqual("Data request failed with error: 'MAC no ack' (233)");
        // expect(mockZnpRequest).toHaveBeenCalledTimes(7);
        // expect(mockZnpRequestZdo).toHaveBeenCalledTimes(1);
        expect(mockZnpRequest).toHaveBeenNthCalledWith(
            1,
            4,
            'dataRequest',
            {clusterid: 0, data: frame.toBuffer(), destendpoint: 20, dstaddr: 2, len: 6, options: 0, radius: 30, srcendpoint: 1, transid: 1},
            99,
        );
        expect(mockZnpRequest).toHaveBeenNthCalledWith(
            2,
            4,
            'dataRequest',
            {clusterid: 0, data: frame.toBuffer(), destendpoint: 20, dstaddr: 2, len: 6, options: 0, radius: 30, srcendpoint: 1, transid: 2},
            99,
        );
        expect(mockZnpRequest).toHaveBeenNthCalledWith(3, 5, 'extRouteDisc', {dstAddr: 2, options: 0, radius: 30});
        expect(mockZnpRequest).toHaveBeenNthCalledWith(
            4,
            4,
            'dataRequest',
            {clusterid: 0, data: frame.toBuffer(), destendpoint: 20, dstaddr: 2, len: 6, options: 0, radius: 30, srcendpoint: 1, transid: 3},
            99,
        );
        expect(mockZnpRequestZdo).toHaveBeenCalledWith(
            Zdo.ClusterId.NETWORK_ADDRESS_REQUEST,
            Zdo.Buffalo.buildRequest(false, Zdo.ClusterId.NETWORK_ADDRESS_REQUEST, '0x03', false, 0),
            expect.any(Number),
            //5, 5, 'nwkAddrReq', {ieeeaddr: '0x03', reqtype: 0, startindex: 0}
        );
        expect(mockZnpRequest).toHaveBeenNthCalledWith(5, 5, 'extRouteDisc', {dstAddr: 3, options: 0, radius: 30});
        expect(mockZnpRequest).toHaveBeenNthCalledWith(
            6,
            4,
            'dataRequest',
            {clusterid: 0, data: frame.toBuffer(), destendpoint: 20, dstaddr: 3, len: 6, options: 0, radius: 30, srcendpoint: 1, transid: 4},
            99,
        );
        expect(mockZnpRequest).toHaveBeenNthCalledWith(
            7,
            4,
            'dataRequest',
            {clusterid: 0, data: frame.toBuffer(), destendpoint: 20, dstaddr: 3, len: 6, options: 0, radius: 30, srcendpoint: 1, transid: 5},
            99,
        );
    });

    it('Send zcl frame network address fails because mac no ack with network address change, without recovery', async () => {
        basicMocks();
        await adapter.start();
        dataConfirmCode = 233;
        mockZnpRequest.mockClear();
        mockQueueExecute.mockClear();
        const frame = Zcl.Frame.create(
            Zcl.FrameType.GLOBAL,
            Zcl.Direction.CLIENT_TO_SERVER,
            true,
            undefined,
            100,
            'writeNoRsp',
            0,
            [{attrId: 0, dataType: 0, attrData: null}],
            {},
        );
        const response = adapter.sendZclFrameToEndpoint('0x03', 2, 20, frame, 10000, false, true, undefined);
        let error;
        try {
            await response;
        } catch (e) {
            error = e;
        }

        expect(error.message).toStrictEqual("Data request failed with error: 'MAC no ack' (233)");
        expect(mockZnpRequest).toHaveBeenCalledTimes(1);
    });

    it('Send zcl frame network address should retry on dataconfirm timeout', async () => {
        basicMocks();
        await adapter.start();
        dataConfirmCode = 9999;
        dataConfirmCodeReset = true;
        mockZnpRequest.mockClear();
        mockQueueExecute.mockClear();
        const frame = Zcl.Frame.create(
            Zcl.FrameType.GLOBAL,
            Zcl.Direction.CLIENT_TO_SERVER,
            true,
            undefined,
            100,
            'writeNoRsp',
            0,
            [{attrId: 0, dataType: 0, attrData: null}],
            {},
        );
        const response = adapter.sendZclFrameToEndpoint('0x02', 2, 20, frame, 10000, false, false);
        let error;
        try {
            await response;
        } catch (e) {
            error = e;
        }
        expect(error.message).toStrictEqual("Data request failed with error: 'Timeout' (9999)");
        expect(mockZnpRequest).toHaveBeenCalledTimes(1);
        expect(mockZnpRequest).toHaveBeenNthCalledWith(
            1,
            4,
            'dataRequest',
            {clusterid: 0, data: frame.toBuffer(), destendpoint: 20, dstaddr: 2, len: 6, options: 0, radius: 30, srcendpoint: 1, transid: 1},
            99,
        );
    });

    it('Send zcl frame group', async () => {
        basicMocks();
        await adapter.start();

        mockZnpRequest.mockClear();
        mockQueueExecute.mockClear();
        const frame = Zcl.Frame.create(Zcl.FrameType.GLOBAL, Zcl.Direction.CLIENT_TO_SERVER, true, undefined, 100, 'read', 0, [{attrId: 0}], {});
        await adapter.sendZclFrameToGroup(25, frame, 1);
        expect(mockQueueExecute.mock.calls[0][1]).toBe(undefined);
        expect(mockZnpRequest).toHaveBeenCalledTimes(1);
        expect(mockZnpRequest).toHaveBeenCalledWith(
            4,
            'dataRequestExt',
            {
                clusterid: 0,
                data: frame.toBuffer(),
                destendpoint: 255,
                dstaddr: '0x0000000000000019',
                len: 5,
                options: 0,
                radius: 30,
                srcendpoint: 1,
                transid: 1,
                dstaddrmode: 1,
                dstpanid: 0,
            },
            99,
        );
    });

    it('Send zcl frame group retry on MAC channel access failure', async () => {
        basicMocks();
        dataConfirmCode = 225;
        dataConfirmCodeReset = true;
        await adapter.start();
        mockZnpRequest.mockClear();
        mockQueueExecute.mockClear();
        const frame = Zcl.Frame.create(
            Zcl.FrameType.GLOBAL,
            Zcl.Direction.CLIENT_TO_SERVER,
            false,
            undefined,
            100,
            'writeNoRsp',
            0,
            [{attrId: 0, dataType: 0, attrData: null}],
            {},
        );
        await adapter.sendZclFrameToGroup(25, frame, 1);
        expect(mockQueueExecute.mock.calls[0][1]).toBe(undefined);
        expect(mockZnpRequest).toHaveBeenCalledTimes(2);
        expect(mockZnpRequest).toHaveBeenCalledWith(
            4,
            'dataRequestExt',
            {
                clusterid: 0,
                data: frame.toBuffer(),
                destendpoint: 255,
                dstaddr: '0x0000000000000019',
                len: 6,
                options: 0,
                radius: 30,
                srcendpoint: 1,
                transid: 1,
                dstaddrmode: 1,
                dstpanid: 0,
            },
            99,
        );
    });

    it('Send zcl frame to all - DEFAULT', async () => {
        basicMocks();
        await adapter.start();

        mockZnpRequest.mockClear();
        mockQueueExecute.mockClear();
        const frame = Zcl.Frame.create(Zcl.FrameType.GLOBAL, Zcl.Direction.CLIENT_TO_SERVER, true, undefined, 100, 'read', 0, [{attrId: 0}], {});
        await adapter.sendZclFrameToAll(242, frame, 250, BroadcastAddress.DEFAULT);
        expect(mockQueueExecute.mock.calls[0][1]).toBe(undefined);
        expect(mockZnpRequest).toHaveBeenCalledTimes(1);
        expect(mockZnpRequest).toHaveBeenCalledWith(
            4,
            'dataRequestExt',
            {
                clusterid: 0,
                data: frame.toBuffer(),
                destendpoint: 242,
                dstaddr: '0x000000000000fffc',
                len: 5,
                options: 0,
                radius: 30,
                srcendpoint: 250,
                transid: 1,
                dstaddrmode: 2,
                dstpanid: 0,
            },
            undefined,
        );
    });

    it('Send zcl frame to all - RX_ON_WHEN_IDLE', async () => {
        basicMocks();
        await adapter.start();

        mockZnpRequest.mockClear();
        mockQueueExecute.mockClear();
        const frame = Zcl.Frame.create(Zcl.FrameType.GLOBAL, Zcl.Direction.CLIENT_TO_SERVER, true, undefined, 100, 'read', 0, [{attrId: 0}], {});
        await adapter.sendZclFrameToAll(255, frame, 1, BroadcastAddress.RX_ON_WHEN_IDLE);
        expect(mockQueueExecute.mock.calls[0][1]).toBe(undefined);
        expect(mockZnpRequest).toHaveBeenCalledTimes(1);
        expect(mockZnpRequest).toHaveBeenCalledWith(
            4,
            'dataRequestExt',
            {
                clusterid: 0,
                data: frame.toBuffer(),
                destendpoint: 255,
                dstaddr: '0x000000000000fffd',
                len: 5,
                options: 0,
                radius: 30,
                srcendpoint: 1,
                transid: 1,
                dstaddrmode: 2,
                dstpanid: 0,
            },
            undefined,
        );
    });

    it('Send zcl frame to all - SLEEPY', async () => {
        basicMocks();
        await adapter.start();

        mockZnpRequest.mockClear();
        mockQueueExecute.mockClear();
        const frame = Zcl.Frame.create(Zcl.FrameType.GLOBAL, Zcl.Direction.CLIENT_TO_SERVER, true, undefined, 100, 'read', 0, [{attrId: 0}], {});
        await adapter.sendZclFrameToAll(255, frame, 1, BroadcastAddress.SLEEPY);
        expect(mockQueueExecute.mock.calls[0][1]).toBe(undefined);
        expect(mockZnpRequest).toHaveBeenCalledTimes(1);
        expect(mockZnpRequest).toHaveBeenCalledWith(
            4,
            'dataRequestExt',
            {
                clusterid: 0,
                data: frame.toBuffer(),
                destendpoint: 255,
                dstaddr: '0x000000000000ffff',
                len: 5,
                options: 0,
                radius: 30,
                srcendpoint: 1,
                transid: 1,
                dstaddrmode: 2,
                dstpanid: 0,
            },
            undefined,
        );
    });

    it('Send zcl frame network address transaction number shouldnt go higher than 255', async () => {
        basicMocks();
        await adapter.start();
        let transactionID = 0;

        mockZnpRequest.mockClear();
        mockQueueExecute.mockClear();

        for (let i = 0; i < 300; i++) {
            if (transactionID > 200) {
                transactionID = 0;
            }

            const frame = Zcl.Frame.create(
                Zcl.FrameType.GLOBAL,
                Zcl.Direction.CLIENT_TO_SERVER,
                true,
                undefined,
                100,
                'writeNoRsp',
                0,
                [{attrId: 0, dataType: 0, attrData: null}],
                {},
            );
            await adapter.sendZclFrameToEndpoint('0x02', 2, 20, frame, 10000, false, false);
        }

        const got: number[] = [];
        for (let i = 0; i < 300; i++) {
            got.push(mockZnpRequest.mock.calls[i][2].transid);
        }

        expect(got[0]).toBe(1);
        expect(got.find((g) => g === 0)).toBe(undefined);
        expect(got.find((g) => g > 255)).toBe(undefined);
        expect(got.filter((g) => g === 1).length).toBe(2);
        expect(got.filter((g) => g === 255).length).toBe(1);
        expect(mockZnpRequest).toHaveBeenCalledTimes(300);
    });

    it('Send zcl frame group dataConfirm fails', async () => {
        basicMocks();
        await adapter.start();
        dataConfirmCode = 184;
        let error;
        mockZnpRequest.mockClear();
        mockQueueExecute.mockClear();
        const frame = Zcl.Frame.create(Zcl.FrameType.GLOBAL, Zcl.Direction.CLIENT_TO_SERVER, true, undefined, 100, 'read', 0, [{attrId: 0}], {});
        try {
            await adapter.sendZclFrameToGroup(25, frame);
        } catch (e) {
            error = e;
        }
        expect(mockQueueExecute.mock.calls[0][1]).toBe(undefined);
        expect(mockZnpRequest).toHaveBeenCalledTimes(1);
        expect(mockZnpRequest).toHaveBeenCalledWith(
            4,
            'dataRequestExt',
            {
                clusterid: 0,
                data: frame.toBuffer(),
                destendpoint: 255,
                dstaddr: '0x0000000000000019',
                len: 5,
                options: 0,
                radius: 30,
                srcendpoint: 1,
                transid: 1,
                dstaddrmode: 1,
                dstpanid: 0,
            },
            99,
        );
        expect(error.message).toStrictEqual("Data request failed with error: 'undefined' (184)");
    });

    it('Send zcl frame network address and default response', async () => {
        basicMocks();
        await adapter.start();

        mockZnpRequest.mockClear();
        mockQueueExecute.mockClear();

        const responseMismatchFrame = Zcl.Frame.create(
            Zcl.FrameType.GLOBAL,
            Zcl.Direction.SERVER_TO_CLIENT,
            true,
            undefined,
            102,
            'readRsp',
            0,
            [{attrId: 0, attrData: 5, dataType: 32, status: 0}],
            {},
        );
        const responseFrame = Zcl.Frame.create(
            Zcl.FrameType.GLOBAL,
            Zcl.Direction.SERVER_TO_CLIENT,
            true,
            undefined,
            100,
            'readRsp',
            0,
            [{attrId: 0, attrData: 2, dataType: 32, status: 0}],
            {},
        );
        const frame = Zcl.Frame.create(Zcl.FrameType.GLOBAL, Zcl.Direction.CLIENT_TO_SERVER, true, undefined, 100, 'read', 0, [{attrId: 0}], {});
        const object = mockZpiObject(Type.AREQ, Subsystem.AF, 'incomingMsg', {
            clusterid: 0,
            srcendpoint: 20,
            srcaddr: 2,
            linkquality: 101,
            groupid: 12,
            data: responseFrame.toBuffer(),
        });
        const objectMismatch = mockZpiObject(Type.AREQ, Subsystem.AF, 'incomingMsg', {
            clusterid: 0,
            srcendpoint: 20,
            srcaddr: 2,
            linkquality: 101,
            groupid: 12,
            data: responseMismatchFrame.toBuffer(),
        });
        const response = adapter.sendZclFrameToEndpoint('0x02', 2, 20, frame, 10000, false, false);
        znpReceived(objectMismatch);
        znpReceived(object);
        const result = await response;

        expect(mockZnpRequest).toHaveBeenCalledWith(
            4,
            'dataRequest',
            {clusterid: 0, data: frame.toBuffer(), destendpoint: 20, dstaddr: 2, len: 5, options: 0, radius: 30, srcendpoint: 1, transid: 1},
            99,
        );
        expect(mockQueueExecute.mock.calls[0][1]).toBe(2);
        expect(mockZnpRequest).toHaveBeenCalledTimes(1);
        expect(result.endpoint).toStrictEqual(20);
        expect(result.groupID).toStrictEqual(12);
        expect(result.linkquality).toStrictEqual(101);
        expect(result.address).toStrictEqual(2);
        expect(result.groupID).toStrictEqual(12);
        expect(result.data).toStrictEqual(Buffer.from([24, 100, 1, 0, 0, 0, 32, 2]));
    });

    it('Send zcl frame network address and default response', async () => {
        basicMocks();
        await adapter.start();

        mockZnpRequest.mockClear();
        mockQueueExecute.mockClear();

        const responseMismatchFrame = Zcl.Frame.create(
            Zcl.FrameType.GLOBAL,
            Zcl.Direction.SERVER_TO_CLIENT,
            true,
            undefined,
            102,
            'readRsp',
            0,
            [{attrId: 0, attrData: 5, dataType: 32, status: 0}],
            {},
        );
        const responseFrame = Zcl.Frame.create(
            Zcl.FrameType.GLOBAL,
            Zcl.Direction.SERVER_TO_CLIENT,
            true,
            undefined,
            100,
            'readRsp',
            0,
            [{attrId: 0, attrData: 2, dataType: 32, status: 0}],
            {},
        );
        const frame = Zcl.Frame.create(Zcl.FrameType.GLOBAL, Zcl.Direction.CLIENT_TO_SERVER, false, undefined, 100, 'read', 0, [{attrId: 0}], {});
        const object = mockZpiObject(Type.AREQ, Subsystem.AF, 'incomingMsg', {
            clusterid: 0,
            srcendpoint: 20,
            srcaddr: 2,
            linkquality: 101,
            groupid: 12,
            data: responseFrame.toBuffer(),
        });
        const objectMismatch = mockZpiObject(Type.AREQ, Subsystem.AF, 'incomingMsg', {
            clusterid: 0,
            srcendpoint: 20,
            srcaddr: 2,
            linkquality: 101,
            groupid: 12,
            data: responseMismatchFrame.toBuffer(),
        });
        const defaultReponse = Zcl.Frame.create(
            Zcl.FrameType.GLOBAL,
            Zcl.Direction.SERVER_TO_CLIENT,
            true,
            undefined,
            100,
            'defaultRsp',
            0,
            {cmdId: 0, status: 0},
            {},
        );
        const defaultObject = mockZpiObject(Type.AREQ, Subsystem.AF, 'incomingMsg', {
            clusterid: 0,
            srcendpoint: 20,
            srcaddr: 2,
            linkquality: 101,
            groupid: 12,
            data: defaultReponse.toBuffer(),
        });
        const response = adapter.sendZclFrameToEndpoint('0x02', 2, 20, frame, 10000, false, false);
        znpReceived(objectMismatch);
        znpReceived(defaultObject);
        znpReceived(object);
        const result = await response;

        expect(mockZnpRequest).toHaveBeenCalledWith(
            4,
            'dataRequest',
            {clusterid: 0, data: frame.toBuffer(), destendpoint: 20, dstaddr: 2, len: 5, options: 0, radius: 30, srcendpoint: 1, transid: 1},
            99,
        );
        expect(mockQueueExecute.mock.calls[0][1]).toBe(2);
        expect(mockZnpRequest).toHaveBeenCalledTimes(1);
        expect(result.endpoint).toStrictEqual(20);
        expect(result.groupID).toStrictEqual(12);
        expect(result.linkquality).toStrictEqual(101);
        expect(result.address).toStrictEqual(2);
        expect(result.groupID).toStrictEqual(12);
        expect(result.data).toStrictEqual(Buffer.from([24, 100, 1, 0, 0, 0, 32, 2]));
    });

    it('Send zcl frame network address data confirm fails with default response', async () => {
        basicMocks();
        await adapter.start();
        dataConfirmCode = 201;
        const frame = Zcl.Frame.create(Zcl.FrameType.GLOBAL, Zcl.Direction.CLIENT_TO_SERVER, false, undefined, 100, 'read', 0, [{attrId: 0}], {});
        let error;
        try {
            await adapter.sendZclFrameToEndpoint('0x02', 2, 20, frame, 10000, false, false);
        } catch (e) {
            error = e;
        }
        expect(error.message).toStrictEqual("Data request failed with error: 'undefined' (201)");
    });

    it('Send zcl frame network address data confirm fails without default response', async () => {
        basicMocks();
        await adapter.start();
        dataConfirmCode = 201;
        const frame = Zcl.Frame.create(Zcl.FrameType.GLOBAL, Zcl.Direction.CLIENT_TO_SERVER, true, undefined, 100, 'read', 0, [{attrId: 0}], {});
        let error;
        try {
            await adapter.sendZclFrameToEndpoint('0x02', 2, 20, frame, 10000, false, false);
        } catch (e) {
            error = e;
        }
        expect(error.message).toStrictEqual("Data request failed with error: 'undefined' (201)");
    });

    it('Send zcl frame network address timeout should discover route and retry', async () => {
        basicMocks();
        await adapter.start();

        mockZnpRequest.mockClear();
        mockQueueExecute.mockClear();
        assocGetWithAddressNodeRelation = 2;
        const responseMismatchFrame = Zcl.Frame.create(
            Zcl.FrameType.GLOBAL,
            Zcl.Direction.SERVER_TO_CLIENT,
            true,
            undefined,
            102,
            'readRsp',
            0,
            [{attrId: 0, attrData: 5, dataType: 32, status: 0}],
            {},
        );
        const frame = Zcl.Frame.create(Zcl.FrameType.GLOBAL, Zcl.Direction.CLIENT_TO_SERVER, false, undefined, 100, 'read', 0, [{attrId: 0}], {});
        const objectMismatch = mockZpiObject(Type.AREQ, Subsystem.AF, 'incomingMsg', {
            clusterid: 0,
            srcendpoint: 20,
            srcaddr: 2,
            linkquality: 101,
            groupid: 12,
            data: responseMismatchFrame.toBuffer(),
        });
        let error;
        try {
            const spy = mockSetTimeout();
            const response = adapter.sendZclFrameToEndpoint('0x02', 2, 20, frame, 1, false, false);
            znpReceived(objectMismatch);
            await response;
            spy.mockRestore();
        } catch (e) {
            error = e;
        }

        expect(mockQueueExecute.mock.calls[0][1]).toBe(2);
        expect(mockZnpRequest).toHaveBeenCalledTimes(4);
        expect(mockZnpRequest).toHaveBeenNthCalledWith(
            1,
            4,
            'dataRequest',
            {clusterid: 0, data: frame.toBuffer(), destendpoint: 20, dstaddr: 2, len: 5, options: 0, radius: 30, srcendpoint: 1, transid: 1},
            99,
        );
        expect(mockZnpRequest).toHaveBeenNthCalledWith(2, 7, 'assocGetWithAddress', {extaddr: '0x02', nwkaddr: 2});
        expect(mockZnpRequest).toHaveBeenNthCalledWith(3, 5, 'extRouteDisc', {dstAddr: 2, options: 0, radius: Constants.AF.DEFAULT_RADIUS});
        expect(mockZnpRequest).toHaveBeenNthCalledWith(
            4,
            4,
            'dataRequest',
            {clusterid: 0, data: frame.toBuffer(), destendpoint: 20, dstaddr: 2, len: 5, options: 0, radius: 30, srcendpoint: 1, transid: 2},
            99,
        );
        expect(error).toStrictEqual(new Error('Timeout - 2 - 20 - 100 - 0 - 1 after 1ms'));
    });

    it('Send zcl frame network address timeout should discover route, rewrite child entry and retry for sleepy end device', async () => {
        basicMocks();
        await adapter.start();

        mockZnpRequest.mockClear();
        mockQueueExecute.mockClear();

        const responseMismatchFrame = Zcl.Frame.create(
            Zcl.FrameType.GLOBAL,
            Zcl.Direction.SERVER_TO_CLIENT,
            true,
            undefined,
            102,
            'readRsp',
            0,
            [{attrId: 0, attrData: 5, dataType: 32, status: 0}],
            {},
        );
        const frame = Zcl.Frame.create(Zcl.FrameType.GLOBAL, Zcl.Direction.CLIENT_TO_SERVER, false, undefined, 100, 'read', 0, [{attrId: 0}], {});
        const objectMismatch = mockZpiObject(Type.AREQ, Subsystem.AF, 'incomingMsg', {
            clusterid: 0,
            srcendpoint: 20,
            srcaddr: 2,
            linkquality: 101,
            groupid: 12,
            data: responseMismatchFrame.toBuffer(),
        });
        let error;
        try {
            const spy = mockSetTimeout();
            const response = adapter.sendZclFrameToEndpoint('0x02', 2, 20, frame, 1, false, false);
            znpReceived(objectMismatch);
            await response;
            spy.mockRestore();
        } catch (e) {
            error = e;
        }

        expect(mockQueueExecute.mock.calls[0][1]).toBe(2);
        expect(mockZnpRequest).toHaveBeenCalledTimes(6);
        expect(mockZnpRequest).toHaveBeenNthCalledWith(
            1,
            4,
            'dataRequest',
            {clusterid: 0, data: frame.toBuffer(), destendpoint: 20, dstaddr: 2, len: 5, options: 0, radius: 30, srcendpoint: 1, transid: 1},
            99,
        );
        expect(mockZnpRequest).toHaveBeenNthCalledWith(2, 7, 'assocGetWithAddress', {extaddr: '0x02', nwkaddr: 2});
        expect(mockZnpRequest).toHaveBeenNthCalledWith(3, 7, 'assocRemove', {ieeeadr: '0x02'});
        expect(mockZnpRequest).toHaveBeenNthCalledWith(4, 7, 'assocAdd', {ieeeadr: '0x02', nwkaddr: 2, noderelation: 1});
        expect(mockZnpRequest).toHaveBeenNthCalledWith(5, 5, 'extRouteDisc', {dstAddr: 2, options: 0, radius: Constants.AF.DEFAULT_RADIUS});
        expect(mockZnpRequest).toHaveBeenNthCalledWith(
            6,
            4,
            'dataRequest',
            {clusterid: 0, data: frame.toBuffer(), destendpoint: 20, dstaddr: 2, len: 5, options: 0, radius: 30, srcendpoint: 1, transid: 2},
            99,
        );
        expect(error).toStrictEqual(new Error('Timeout - 2 - 20 - 100 - 0 - 1 after 1ms'));
    });

    it('Send zcl frame network address with default response timeout shouldnt care because command has response', async () => {
        basicMocks();
        await adapter.start();

        mockZnpRequest.mockClear();
        mockQueueExecute.mockClear();
        const responseFrame = Zcl.Frame.create(
            Zcl.FrameType.GLOBAL,
            Zcl.Direction.SERVER_TO_CLIENT,
            true,
            undefined,
            100,
            'readRsp',
            0,
            [{attrId: 0, attrData: 2, dataType: 32, status: 0}],
            {},
        );
        const frame = Zcl.Frame.create(Zcl.FrameType.GLOBAL, Zcl.Direction.CLIENT_TO_SERVER, false, undefined, 100, 'read', 0, [{attrId: 0}], {});
        const object = mockZpiObject(Type.AREQ, Subsystem.AF, 'incomingMsg', {
            clusterid: 0,
            srcendpoint: 20,
            srcaddr: 2,
            linkquality: 101,
            groupid: 12,
            data: responseFrame.toBuffer(),
        });
        const response = adapter.sendZclFrameToEndpoint('0x02', 2, 20, frame, 10000, false, false);
        znpReceived(object);

        let error = null;
        try {
            await response;
        } catch (e) {
            error = e;
        }
        expect(mockZnpRequest).toHaveBeenCalledWith(
            4,
            'dataRequest',
            {clusterid: 0, data: frame.toBuffer(), destendpoint: 20, dstaddr: 2, len: 5, options: 0, radius: 30, srcendpoint: 1, transid: 1},
            99,
        );
        expect(mockQueueExecute.mock.calls[0][1]).toBe(2);
        expect(mockZnpRequest).toHaveBeenCalledTimes(1);
        expect(error).toStrictEqual(null);
    });

    it('Supports backup', async () => {
        basicMocks();
        await adapter.start();
        expect(await adapter.supportsBackup()).toBeTruthy();
    });

    it('Incoming message extended', async () => {
        basicMocks();
        await adapter.start();
        let zclData;
        const responseFrame = Zcl.Frame.create(
            Zcl.FrameType.GLOBAL,
            Zcl.Direction.SERVER_TO_CLIENT,
            true,
            undefined,
            100,
            'readRsp',
            0,
            [{attrId: 0, attrData: 2, dataType: 32, status: 0}],
            {},
        );
        const object = mockZpiObject(Type.AREQ, Subsystem.AF, 'incomingMsgExt', {
            clusterid: 0,
            srcendpoint: 20,
            srcaddr: 2,
            linkquality: 101,
            groupid: 12,
            data: responseFrame.toBuffer(),
        });
        adapter.on('zclPayload', (p) => {
            zclData = p;
        });
        znpReceived(object);
        expect(zclData.endpoint).toStrictEqual(20);
        expect(zclData.groupID).toStrictEqual(12);
        expect(zclData.linkquality).toStrictEqual(101);
        expect(zclData.address).toStrictEqual(2);
        expect(zclData.groupID).toStrictEqual(12);
        expect(zclData.data).toStrictEqual(Buffer.from([24, 100, 1, 0, 0, 0, 32, 2]));
        expect(zclData.header.commandIdentifier).toBe(1);
    });

    it('Incoming message raw (not ZCL)', async () => {
        basicMocks();
        await adapter.start();
        let rawData;
        const object = mockZpiObject(Type.AREQ, Subsystem.AF, 'incomingMsg', {
            clusterid: 1,
            srcendpoint: 20,
            srcaddr: 2,
            linkquality: 101,
            groupid: 12,
            data: Buffer.from([0x0, 0x1]),
        });
        adapter.on('zclPayload', (p) => {
            rawData = p;
        });
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
        adapter.on('disconnected', () => {
            closeEvent = true;
        });
        znpClose();
        expect(closeEvent).toBeTruthy();
    });

    it('Adapter disconnected dont emit when closing', async () => {
        basicMocks();
        await adapter.start();
        await adapter.stop();
        let closeEvent = false;
        adapter.on('disconnected', () => {
            closeEvent = true;
        });
        znpClose();
        expect(closeEvent).toBeFalsy();
    });

    it('Device joined', async () => {
        basicMocks();
        await adapter.start();
        let deviceJoin;
        const object = mockZpiObject(Type.AREQ, Subsystem.ZDO, 'tcDeviceInd', {nwkaddr: 123, extaddr: '0x123'});
        adapter.on('deviceJoined', (p) => {
            deviceJoin = p;
        });
        znpReceived(object);
        expect(deviceJoin).toStrictEqual({ieeeAddr: '0x123', networkAddress: 123});
    });

    it('Device announce', async () => {
        basicMocks();
        await adapter.start();
        mockZnpRequest.mockClear();
        mockQueueExecute.mockClear();
        const object = mockZdoZpiObject<EndDeviceAnnounce>('endDeviceAnnceInd', 123, [
            Zdo.Status.SUCCESS,
            {
                capabilities: DUMMY_NODE_DESC_RSP_CAPABILITIES,
                eui64: '0x123',
                nwkAddress: 123,
            },
        ]);
        adapter.on('zdoResponse', (clusterId, payload) => {
            expect(clusterId).toStrictEqual(Zdo.ClusterId.END_DEVICE_ANNOUNCE);
            expect(payload[0]).toStrictEqual(Zdo.Status.SUCCESS);
            expect(payload[1]).toStrictEqual({eui64: '0x123', nwkAddress: 123, capabilities: DUMMY_NODE_DESC_RSP_CAPABILITIES});
        });
        znpReceived(object);
        expect(mockZnpRequest).toHaveBeenCalledTimes(0);
    });

    it('Device announce should discover route to end devices', async () => {
        basicMocks();
        await adapter.start();
        mockZnpRequest.mockClear();
        mockQueueExecute.mockClear();
        const object = mockZdoZpiObject<EndDeviceAnnounce>('endDeviceAnnceInd', 123, [
            Zdo.Status.SUCCESS,
            {
                capabilities: {...DUMMY_NODE_DESC_RSP_CAPABILITIES, deviceType: 0},
                eui64: '0x123',
                nwkAddress: 123,
            },
        ]);
        adapter.on('zdoResponse', (clusterId, payload) => {
            expect(clusterId).toStrictEqual(Zdo.ClusterId.END_DEVICE_ANNOUNCE);
            expect(payload[0]).toStrictEqual(Zdo.Status.SUCCESS);
            expect(payload[1]).toStrictEqual({eui64: '0x123', nwkAddress: 123, capabilities: {...DUMMY_NODE_DESC_RSP_CAPABILITIES, deviceType: 0}});
        });
        znpReceived(object);
        expect(mockZnpRequest).toHaveBeenCalledTimes(1);
        expect(mockZnpRequest).toHaveBeenCalledWith(Subsystem.ZDO, 'extRouteDisc', {dstAddr: 123, options: 0, radius: 30});

        // Should debounce route discovery.
        znpReceived(object);
        expect(mockZnpRequest).toHaveBeenCalledTimes(1);
        expect(mockZnpRequest).toHaveBeenCalledWith(Subsystem.ZDO, 'extRouteDisc', {dstAddr: 123, options: 0, radius: 30});
    });

    it('Network address response', async () => {
        basicMocks();
        await adapter.start();
        const object = mockZdoZpiObject<NetworkAddressResponse>('nwkAddrRsp', 124, [
            Zdo.Status.SUCCESS,
            {
                eui64: '0x123',
                nwkAddress: 124,
                assocDevList: [],
                startIndex: 0,
            },
        ]);
        adapter.on('zdoResponse', (clusterId, payload) => {
            expect(clusterId).toStrictEqual(Zdo.ClusterId.NETWORK_ADDRESS_RESPONSE);
            expect(payload[0]).toStrictEqual(Zdo.Status.SUCCESS);
            expect(payload[1]).toStrictEqual({eui64: '0x123', nwkAddress: 124, assocDevList: [], startIndex: 0});
        });
        znpReceived(object);
    });

    it('Concentrator Callback Indication', async () => {
        basicMocks();
        await adapter.start();
        const object = mockZpiObject(Type.AREQ, Subsystem.ZDO, 'concentratorIndCb', {srcaddr: 124, extaddr: '0x123'});
        adapter.on('zdoResponse', (clusterId, payload) => {
            expect(clusterId).toStrictEqual(Zdo.ClusterId.NETWORK_ADDRESS_RESPONSE);
            expect(payload[0]).toStrictEqual(Zdo.Status.SUCCESS);
            expect(payload[1]).toStrictEqual({eui64: '0x123', nwkAddress: 124, assocDevList: [], startIndex: 0});
        });
        znpReceived(object);
    });

    it('Device leave', async () => {
        basicMocks();
        await adapter.start();
        let deviceAnnounce;
        const object = mockZpiObject(Type.AREQ, Subsystem.ZDO, 'leaveInd', {srcaddr: 123, extaddr: '0x123'});
        adapter.on('deviceLeave', (p) => {
            deviceAnnounce = p;
        });
        znpReceived(object);
        expect(deviceAnnounce).toStrictEqual({ieeeAddr: '0x123', networkAddress: 123});
    });

    it('Ignore device leave with rejoin', async () => {
        basicMocks();
        await adapter.start();
        let deviceAnnounce;
        const object = mockZpiObject(Type.AREQ, Subsystem.ZDO, 'leaveInd', {srcaddr: 123, extaddr: '0x123', rejoin: true});
        adapter.on('deviceLeave', (p) => {
            deviceAnnounce = p;
        });
        znpReceived(object);
        expect(deviceAnnounce).toStrictEqual(undefined);
    });

    it('Do nothing wiht non areq event', async () => {
        basicMocks();
        await adapter.start();
        let deviceLeave;
        const object = mockZpiObject(Type.SREQ, Subsystem.ZDO, 'leaveInd', {srcaddr: 123, extaddr: '0x123'});
        adapter.on('deviceLeave', (p) => {
            deviceLeave = p;
        });
        znpReceived(object);
        expect(deviceLeave).toStrictEqual(undefined);
    });

    it('Get network parameters', async () => {
        basicMocks();
        await adapter.start();
        mockZnpRequest.mockClear();
        mockQueueExecute.mockClear();
        const result = await adapter.getNetworkParameters();
        expect(mockZnpRequest).toHaveBeenCalledTimes(1);
        expect(mockZnpRequest).toHaveBeenCalledWith(Subsystem.ZDO, 'extNwkInfo', {});
        expect(result).toStrictEqual({channel: 21, extendedPanID: '0x00124b0009d69f77', panID: 123, nwkUpdateID: 0});
    });

    it('Set interpan channel', async () => {
        basicMocks();
        await adapter.start();
        mockZnpRequest.mockClear();
        mockQueueExecute.mockClear();
        await adapter.setChannelInterPAN(14);
        expect(mockZnpRequest).toHaveBeenCalledTimes(2);
        expect(mockZnpRequest).toHaveBeenCalledWith(Subsystem.AF, 'interPanCtl', {cmd: 1, data: [14]});
        expect(mockZnpRequest).toHaveBeenCalledWith(Subsystem.AF, 'interPanCtl', {cmd: 2, data: [12]});

        mockZnpRequest.mockClear();
        mockQueueExecute.mockClear();
        await adapter.setChannelInterPAN(15);
        expect(mockZnpRequest).toHaveBeenCalledTimes(1);
        expect(mockZnpRequest).toHaveBeenCalledWith(Subsystem.AF, 'interPanCtl', {cmd: 1, data: [15]});
    });

    it('Restore interpan channel', async () => {
        basicMocks();
        await adapter.start();
        mockZnpRequest.mockClear();
        mockQueueExecute.mockClear();
        const result = await adapter.restoreChannelInterPAN();
        expect(mockZnpRequest).toHaveBeenCalledTimes(1);
        expect(mockZnpRequest).toHaveBeenCalledWith(Subsystem.AF, 'interPanCtl', {cmd: 0, data: []});
    });

    it('Send zcl frame interpan', async () => {
        basicMocks();
        await adapter.start();
        mockZnpRequest.mockClear();
        mockQueueExecute.mockClear();
        const result = await adapter.sendZclFrameInterPANToIeeeAddr(touchlinkIdentifyRequest, '0x0017880104c9cd33');
        expect(mockZnpRequest).toHaveBeenCalledTimes(1);
        expect(mockZnpRequest).toHaveBeenCalledWith(
            4,
            'dataRequestExt',
            {
                clusterid: 4096,
                data: touchlinkIdentifyRequest.toBuffer(),
                destendpoint: 254,
                dstaddr: '0x0017880104c9cd33',
                len: 9,
                options: 0,
                radius: 30,
                srcendpoint: 12,
                transid: 1,
                dstaddrmode: 3,
                dstpanid: 65535,
            },
            undefined,
        );
    });

    it('Send zcl frame interpan with response', async () => {
        basicMocks();
        await adapter.start();
        mockZnpRequest.mockClear();
        mockQueueExecute.mockClear();
        const object = mockZpiObject(Type.AREQ, Subsystem.AF, 'incomingMsgExt', {
            clusterid: 4096,
            srcendpoint: 0xfe,
            srcaddr: 12394,
            linkquality: 101,
            groupid: 0,
            data: touchlinkScanResponse.toBuffer(),
        });

        let result: ZclPayload | Promise<ZclPayload> = adapter.sendZclFrameInterPANBroadcast(touchlinkScanRequest, 1000);
        znpReceived(object);
        result = await result;

        expect(mockZnpRequest).toHaveBeenCalledTimes(1);
        expect(mockZnpRequest).toHaveBeenCalledWith(
            4,
            'dataRequestExt',
            {
                clusterid: 4096,
                data: touchlinkScanRequest.toBuffer(),
                destendpoint: 254,
                dstaddr: '0x000000000000ffff',
                len: 9,
                options: 0,
                radius: 30,
                srcendpoint: 12,
                transid: 1,
                dstaddrmode: 2,
                dstpanid: 65535,
            },
            undefined,
        );
        expect(deepClone(result)).toStrictEqual({
            clusterID: 4096,
            data: {
                type: 'Buffer',
                data: [9, 12, 1, 1, 0, 0, 0, 10, 5, 6, 12, 0, 11, 0, 0, 0, 51, 205, 217, 4, 1, 33, 23, 0, 1, 12, 13, 0, 5, 0, 10, 5],
            },
            header: {
                frameControl: {frameType: 1, manufacturerSpecific: false, direction: 1, disableDefaultResponse: false, reservedBits: 0},
                transactionSequenceNumber: 12,
                commandIdentifier: 1,
            },
            address: 12394,
            endpoint: 254,
            linkquality: 101,
            groupID: 0,
            wasBroadcast: false,
        });
    });

    it('Send zcl frame interpan throw exception when command has no response', async () => {
        basicMocks();
        await adapter.start();
        mockZnpRequest.mockClear();
        mockQueueExecute.mockClear();
        let error;
        try {
            await adapter.sendZclFrameInterPANBroadcast(touchlinkIdentifyRequest, 1000);
        } catch (e) {
            error = e;
        }
        expect(error).toStrictEqual(new Error(`Command 'identifyRequest' has no response, cannot wait for response`));
    });

    it('Send zcl frame interpan throw exception data request fails', async () => {
        basicMocks();
        dataRequestExtCode = 99;
        await adapter.start();
        mockZnpRequest.mockClear();
        mockQueueExecute.mockClear();
        let error;
        try {
            await adapter.sendZclFrameInterPANBroadcast(touchlinkScanRequest, 1000);
        } catch (e) {
            error = e;
        }
        expect(error).toStrictEqual(new Error(`Data request failed with code '99'`));
    });

    it('Refuse to start when ping fails', async () => {
        mockZnpRequest.mockImplementation((subsystem, command, payload, expectedStatus) => {
            const missing = () => {
                const msg = `Not implemented - ${Subsystem[subsystem]} - ${command} - ${JSON.stringify(payload)}`;
                console.log(msg);
                throw new Error(msg);
            };

            if (subsystem === Subsystem.SYS && command === 'ping') {
                throw new Error('Couldnt lock port');
            } else {
                missing();
            }
        });

        let error;
        try {
            await adapter.start();
        } catch (e) {
            error = e;
        }
        expect(error).toStrictEqual(new Error('Failed to connect to the adapter (Error: Couldnt lock port)'));
    });

    it('Wait for', async () => {
        basicMocks();
        await adapter.start();

        const responseFrame = Zcl.Frame.create(
            Zcl.FrameType.GLOBAL,
            Zcl.Direction.SERVER_TO_CLIENT,
            true,
            undefined,
            100,
            'readRsp',
            0,
            [{attrId: 0, attrData: 2, dataType: 32, status: 0}],
            {},
        );
        const object = mockZpiObject(Type.AREQ, Subsystem.AF, 'incomingMsg', {
            clusterid: 0,
            srcendpoint: 20,
            srcaddr: 2,
            linkquality: 101,
            groupid: 12,
            data: responseFrame.toBuffer(),
        });
        const wait = adapter.waitFor(2, 20, 0, 1, 100, 0, 1, 10);
        znpReceived(object);
        const result = await wait.promise;
        expect(result.endpoint).toStrictEqual(20);
        expect(result.groupID).toStrictEqual(12);
        expect(result.linkquality).toStrictEqual(101);
        expect(result.address).toStrictEqual(2);
        expect(result.groupID).toStrictEqual(12);
        expect(result.data).toStrictEqual(Buffer.from([24, 100, 1, 0, 0, 0, 32, 2]));
    });

    it('Command should fail when in interpan', async () => {
        const frame = Zcl.Frame.create(
            Zcl.FrameType.GLOBAL,
            Zcl.Direction.CLIENT_TO_SERVER,
            true,
            undefined,
            100,
            'writeNoRsp',
            0,
            [{attrId: 0, dataType: 0, attrData: null}],
            {},
        );
        basicMocks();
        await adapter.start();

        await adapter.setChannelInterPAN(14);
        mockZnpRequest.mockClear();
        mockQueueExecute.mockClear();
        let error;
        try {
            await adapter.sendZclFrameToEndpoint('0x02', 2, 20, frame, 10000, false, false);
        } catch (e) {
            error = e;
        }
        expect(error).toStrictEqual(new Error('Cannot execute command, in Inter-PAN mode'));
        expect(mockZnpRequest).toHaveBeenCalledTimes(0);

        await adapter.restoreChannelInterPAN();
        mockZnpRequest.mockClear();
        mockQueueExecute.mockClear();

        await adapter.sendZclFrameToEndpoint('0x02', 2, 20, frame, 10000, false, false);
        expect(mockZnpRequest).toHaveBeenCalledTimes(1);
    });

    it('Sends proper ZDO request payload for PERMIT_JOINING_REQUEST to target', async () => {
        basicMocks();
        await adapter.start();
        mockZnpRequestZdo.mockClear();

        const clusterId = Zdo.ClusterId.PERMIT_JOINING_REQUEST;
        const zdoPayload = Zdo.Buffalo.buildRequest(false, clusterId, 250, 1, []);

        await adapter.sendZdo('0x1122334455667788', 1234, clusterId, zdoPayload, true);

        expect(mockZnpRequestZdo).toHaveBeenCalledWith(
            clusterId,
            Buffer.from([AddressMode.ADDR_16BIT, 1234 & 0xff, (1234 >> 8) & 0xff, ...zdoPayload]),
            undefined,
        );
    });

    it('Sends proper ZDO request payload for PERMIT_JOINING_REQUEST broadcast', async () => {
        basicMocks();
        await adapter.start();
        mockZnpRequestZdo.mockClear();

        const clusterId = Zdo.ClusterId.PERMIT_JOINING_REQUEST;
        const zdoPayload = Zdo.Buffalo.buildRequest(false, clusterId, 250, 1, []);

        await adapter.sendZdo(ZSpec.BLANK_EUI64, ZSpec.BroadcastAddress.DEFAULT, clusterId, zdoPayload, true);

        expect(mockZnpRequestZdo).toHaveBeenCalledWith(
            clusterId,
            Buffer.from([
                AddressMode.ADDR_BROADCAST,
                ZSpec.BroadcastAddress.DEFAULT & 0xff,
                (ZSpec.BroadcastAddress.DEFAULT >> 8) & 0xff,
                ...zdoPayload,
            ]),
            undefined,
        );
    });

    it('Sends proper ZDO request payload for NWK_UPDATE_REQUEST UNICAST', async () => {
        basicMocks();
        await adapter.start();
        mockZnpRequestZdo.mockClear();

        const clusterId = Zdo.ClusterId.NWK_UPDATE_REQUEST;
        const zdoPayload = Zdo.Buffalo.buildRequest(false, clusterId, [15], 0xfe, 0, undefined, 0);
        await adapter.sendZdo(ZSpec.BLANK_EUI64, 0x123, clusterId, zdoPayload, true);

        expect(mockZnpRequestZdo).toHaveBeenCalledWith(
            clusterId,
            Buffer.from([
                0x123 & 0xff,
                (0x123 >> 8) & 0xff,
                AddressMode.ADDR_16BIT,
                ...zdoPayload,
                0, // scancount
                0, // nwkmanageraddr
                0, // nwkmanageraddr
            ]),
            undefined,
        );
    });

    it('Sends proper ZDO request payload for NWK_UPDATE_REQUEST BROADCAST', async () => {
        basicMocks();
        await adapter.start();
        mockZnpRequestZdo.mockClear();

        const clusterId = Zdo.ClusterId.NWK_UPDATE_REQUEST;
        const zdoPayload = Zdo.Buffalo.buildRequest(false, clusterId, [15], 0xfe, 0, undefined, 0);
        await adapter.sendZdo(ZSpec.BLANK_EUI64, ZSpec.BroadcastAddress.SLEEPY, clusterId, zdoPayload, true);

        expect(mockZnpRequestZdo).toHaveBeenCalledWith(
            clusterId,
            Buffer.from([
                ZSpec.BroadcastAddress.SLEEPY & 0xff,
                (ZSpec.BroadcastAddress.SLEEPY >> 8) & 0xff,
                AddressMode.ADDR_BROADCAST,
                ...zdoPayload,
                0, // scancount
                0, // nwkmanageraddr
                0, // nwkmanageraddr
            ]),
            undefined,
        );
    });

    it('Sends proper ZDO request payload for BIND_REQUEST/UNBIND_REQUEST UNICAST', async () => {
        basicMocks();
        await adapter.start();
        mockZnpRequestZdo.mockClear();

        const clusterId = Zdo.ClusterId.BIND_REQUEST;
        const zdoPayload = Zdo.Buffalo.buildRequest(
            false,
            clusterId,
            '0x1122334455667788',
            3,
            Zcl.Clusters.barrierControl.ID,
            Zdo.UNICAST_BINDING,
            '0x5544332211667788',
            0,
            5,
        );

        await adapter.sendZdo(ZSpec.BLANK_EUI64, 1234, clusterId, zdoPayload, true);

        expect(mockZnpRequestZdo).toHaveBeenCalledWith(clusterId, Buffer.from([1234 & 0xff, (1234 >> 8) & 0xff, ...zdoPayload]), undefined);
    });

    it('Sends proper ZDO request payload for BIND_REQUEST/UNBIND_REQUEST MULTICAST', async () => {
        basicMocks();
        await adapter.start();
        mockZnpRequestZdo.mockClear();

        const clusterId = Zdo.ClusterId.BIND_REQUEST;
        const zdoPayload = Zdo.Buffalo.buildRequest(
            false,
            clusterId,
            '0x1122334455667788',
            3,
            Zcl.Clusters.barrierControl.ID,
            Zdo.MULTICAST_BINDING,
            ZSpec.BLANK_EUI64,
            32,
            0,
        );

        await adapter.sendZdo(ZSpec.BLANK_EUI64, 1234, clusterId, zdoPayload, true);

        expect(mockZnpRequestZdo).toHaveBeenCalledWith(
            clusterId,
            Buffer.from([
                1234 & 0xff,
                (1234 >> 8) & 0xff,
                ...zdoPayload,
                0, // match destination EUI64 length
                0, // match destination EUI64 length
                0, // match destination EUI64 length
                0, // match destination EUI64 length
                0, // match destination EUI64 length
                0, // match destination EUI64 length
                0, // endpoint
            ]),
            undefined,
        );
    });

    it('Sends proper ZDO request payload for NETWORK_ADDRESS_REQUEST', async () => {
        basicMocks();
        await adapter.start();
        mockZnpRequestZdo.mockClear();

        const clusterId = Zdo.ClusterId.NETWORK_ADDRESS_REQUEST;
        const zdoPayload = Zdo.Buffalo.buildRequest(false, clusterId, '0x1122334455667788', false, 0);

        await adapter.sendZdo(ZSpec.BLANK_EUI64, 1234, clusterId, zdoPayload, true);

        expect(mockZnpRequestZdo).toHaveBeenCalledWith(clusterId, zdoPayload, undefined);
    });

    it('Sends proper ZDO request payload for generic logic request', async () => {
        basicMocks();
        await adapter.start();
        mockZnpRequestZdo.mockClear();

        const clusterId = Zdo.ClusterId.NODE_DESCRIPTOR_REQUEST;
        const zdoPayload = Zdo.Buffalo.buildRequest(false, clusterId, 1234);

        await adapter.sendZdo(ZSpec.BLANK_EUI64, 1234, clusterId, zdoPayload, true);

        expect(mockZnpRequestZdo).toHaveBeenCalledWith(clusterId, Buffer.from([1234 & 0xff, (1234 >> 8) & 0xff, ...zdoPayload]), undefined);
    });

    it('Node descriptor request should discover route to fix potential fails', async () => {
        // https://github.com/Koenkk/zigbee2mqtt/issues/3276
        basicMocks();
        await adapter.start();
        mockZnpRequest.mockClear();
        mockZnpRequestZdo.mockClear();
        mockZnpRequestZdo.mockRejectedValueOnce('Failed');

        const clusterId = Zdo.ClusterId.NODE_DESCRIPTOR_REQUEST;
        const zdoPayload = Zdo.Buffalo.buildRequest(false, clusterId, 1234);

        await adapter.sendZdo(ZSpec.BLANK_EUI64, 1234, clusterId, zdoPayload, true);

        expect(mockZnpRequestZdo).toHaveBeenCalledTimes(2);
        expect(mockZnpRequestZdo).toHaveBeenNthCalledWith(1, clusterId, Buffer.from([1234 & 0xff, (1234 >> 8) & 0xff, ...zdoPayload]), undefined);
        expect(mockZnpRequestZdo).toHaveBeenNthCalledWith(2, clusterId, Buffer.from([1234 & 0xff, (1234 >> 8) & 0xff, ...zdoPayload]), undefined);
        expect(mockZnpRequest).toHaveBeenCalledTimes(1);
        expect(mockZnpRequest).toHaveBeenCalledWith(Subsystem.ZDO, 'extRouteDisc', {dstAddr: 1234, options: 0, radius: 30});
    });

    it('Should throw error when ZDO call fails', async () => {
        basicMocks();
        await adapter.start();
        mockZnpRequest.mockClear();
        mockZnpRequestZdo.mockClear();
        mockZnpRequestZdo.mockRejectedValueOnce(new Error('Failed'));

        const clusterId = Zdo.ClusterId.SIMPLE_DESCRIPTOR_REQUEST;
        const zdoPayload = Zdo.Buffalo.buildRequest(false, clusterId, 123, 0);

        await expect(adapter.sendZdo(ZSpec.BLANK_EUI64, 1234, clusterId, zdoPayload, true)).rejects.toThrow('Failed');
    });

    it('Should throw error when registerEndpoints fails', async () => {
        basicMocks();
        vi.spyOn(adapter, 'sendZdo').mockResolvedValueOnce([Zdo.Status.NOT_ACTIVE, undefined]);

        await expect(adapter.start()).rejects.toThrow(`Status 'NOT_ACTIVE'`);
    });
});
