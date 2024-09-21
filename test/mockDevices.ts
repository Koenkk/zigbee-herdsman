import * as Zdo from '../src/zspec/zdo';
import * as ZdoTypes from '../src/zspec/zdo/definition/tstypes';

export const NODE_DESC_DEFAULTS = {
    // nwkAddress: NodeId;
    /** 000 == Zigbee Coordinator, 001 == Zigbee Router,  010 === Zigbee End Device, 011-111 === Reserved */
    // logicalType: number;
    fragmentationSupported: undefined,
    apsFlags: 0,
    frequencyBand: 3,
    capabilities: Zdo.Utils.getMacCapFlags(0x8e),
    // manufacturerCode: number;
    maxBufSize: 0xaa,
    maxIncTxSize: 0xac,
    serverMask: Zdo.Utils.getServerMask(0x2c43),
    maxOutTxSize: 0xdc,
    deprecated1: 0,
    tlvs: [],
};
export const LQI_TABLE_ENTRY_DEFAULTS = {
    extendedPanId: [1, 2, 3, 4, 5, 6, 7, 8],
    // eui64: EUI64;
    // nwkAddress: NodeId;
    /**
     * The type of the neighbor device:
     * 0x00 = ZigBee coordinator
     * 0x01 = ZigBee router
     * 0x02 = ZigBee end device
     * 0x03 = Unknown
     *
     * 2-bit
     */
    deviceType: 0x01,
    /**
     * 0x00 = Receiver is off
     * 0x01 = Receiver is on
     * 0x02 = unknown
     */
    rxOnWhenIdle: 0x00,
    /**
     * 0x00 = neighbor is the parent
     * 0x01 = neighbor is a child
     * 0x02 = neighbor is a sibling
     * 0x03 = None of the above
     * 0x04 = previous child
     */
    // relationship: number;
    reserved1: 0,
    /**
     * 0x00 = neighbor is not accepting join requests
     * 0x01 = neighbor is accepting join requests
     * 0x02 = unknown
     */
    permitJoining: 0x00,
    /** Each of these reserved bits shall be set to 0. 6-bit */
    reserved2: 0,
    // depth: number;
    // lqi: number;
};
export const ROUTING_TABLE_ENTRY_DEFAULTS = {
    // destinationAddress: NodeId;
    /**
     * Status of the route
     * 0x0=ACTIVE.
     * 0x1=DISCOVERY_UNDERWAY.
     * 0x2=DISCOVERY_FAILED.
     * 0x3=INACTIVE.
     * 0x4=VALIDATION_UNDERWAY
     * 0x5-0x7=RESERVED
     *
     * 3-bit
     */
    // status: keyof typeof RoutingTableStatus | 'UNKNOWN';
    memoryConstrained: 0,
    manyToOne: 0,
    routeRecordRequired: 0,
    reserved1: 0,
    // nextHopAddress: number;
};

export const DEFAULT_184_CHECKIN_INTERVAL = 50;

/**
 * - undefined => should timeout
 * - key => identifier for special behavior
 */
export const MOCK_DEVICES: {
    [key: number]: {
        nodeDescriptor?: ZdoTypes.ResponseMap[Zdo.ClusterId.NODE_DESCRIPTOR_RESPONSE];
        activeEndpoints?: ZdoTypes.ResponseMap[Zdo.ClusterId.ACTIVE_ENDPOINTS_RESPONSE];
        simpleDescriptor?: {[key: number]: ZdoTypes.ResponseMap[Zdo.ClusterId.SIMPLE_DESCRIPTOR_RESPONSE] | undefined};
        lqiTable?: ZdoTypes.ResponseMap[Zdo.ClusterId.LQI_TABLE_RESPONSE];
        routingTable?: ZdoTypes.ResponseMap[Zdo.ClusterId.ROUTING_TABLE_RESPONSE];
        attributes?: {[key: number]: {[key: string]: unknown}};
        key?: 'xiaomi';
    };
} = {
    // coordinator
    0: {
        nodeDescriptor: [Zdo.Status.SUCCESS, {...NODE_DESC_DEFAULTS, nwkAddress: 0, logicalType: 0b000, manufacturerCode: 0x0007}],
        activeEndpoints: [Zdo.Status.SUCCESS, {nwkAddress: 0, endpointList: [1, 2]}],
        simpleDescriptor: {
            1: [
                Zdo.Status.SUCCESS,
                {nwkAddress: 0, length: 14, endpoint: 1, profileId: 2, deviceId: 3, deviceVersion: 1, inClusterList: [10], outClusterList: [11]},
            ],
            2: [
                Zdo.Status.SUCCESS,
                {nwkAddress: 0, length: 14, endpoint: 2, profileId: 3, deviceId: 5, deviceVersion: 1, inClusterList: [1], outClusterList: [0]},
            ],
        },
    },
    129: {
        nodeDescriptor: [Zdo.Status.SUCCESS, {...NODE_DESC_DEFAULTS, nwkAddress: 129, logicalType: 0b001, manufacturerCode: 1212}], // {type: 'Router', manufacturerCode: 1212},
        activeEndpoints: [Zdo.Status.SUCCESS, {nwkAddress: 129, endpointList: [1]}], // {endpoints: [1]},
        simpleDescriptor: {
            1: [
                Zdo.Status.SUCCESS,
                {nwkAddress: 129, length: 14, endpoint: 1, profileId: 99, deviceId: 5, deviceVersion: 1, inClusterList: [0, 1], outClusterList: [2]},
            ], // {1: {endpointID: 1, deviceID: 5, inputClusters: [0, 1], outputClusters: [2], profileID: 99}},
        },
        attributes: {
            1: {
                modelId: 'myModelID',
                manufacturerName: 'KoenAndCo',
                zclVersion: 1,
                appVersion: 2,
                hwVersion: 3,
                dateCode: '201901',
                swBuildId: '1.01',
                powerSource: 1,
                stackVersion: 101,
            },
        },
    },
    140: {
        nodeDescriptor: undefined,
        lqiTable: [
            Zdo.Status.SUCCESS,
            {
                neighborTableEntries: 2,
                startIndex: 0,
                entryList: [
                    {...LQI_TABLE_ENTRY_DEFAULTS, eui64: '0x160', nwkAddress: 160, lqi: 20, relationship: 2, depth: 5},
                    {...LQI_TABLE_ENTRY_DEFAULTS, eui64: '0x170', nwkAddress: 170, lqi: 21, relationship: 4, depth: 8},
                ],
            },
        ],
        routingTable: [
            Zdo.Status.SUCCESS,
            {
                routingTableEntries: 2,
                startIndex: 0,
                entryList: [
                    {...ROUTING_TABLE_ENTRY_DEFAULTS, destinationAddress: 120, status: 'ACTIVE', nextHopAddress: 1},
                    {...ROUTING_TABLE_ENTRY_DEFAULTS, destinationAddress: 130, status: 'DISCOVERY_FAILED', nextHopAddress: 2},
                ],
            },
        ],
    },
    150: {
        nodeDescriptor: undefined,
        key: 'xiaomi',
    },
    151: {
        nodeDescriptor: [Zdo.Status.SUCCESS, {...NODE_DESC_DEFAULTS, nwkAddress: 151, logicalType: 0b010, manufacturerCode: 1219}],
        activeEndpoints: undefined,
        key: 'xiaomi',
    },
    160: {
        nodeDescriptor: [Zdo.Status.SUCCESS, {...NODE_DESC_DEFAULTS, nwkAddress: 160, logicalType: 0b001, manufacturerCode: 1212}],
        activeEndpoints: [Zdo.Status.SUCCESS, {nwkAddress: 160, endpointList: []}],
        attributes: {},
    },
    161: {
        // stackComplianceRevision 0
        nodeDescriptor: [
            Zdo.Status.SUCCESS,
            {...NODE_DESC_DEFAULTS, nwkAddress: 161, logicalType: 0b001, manufacturerCode: 1213, serverMask: Zdo.Utils.getServerMask(0)},
        ],
        activeEndpoints: [Zdo.Status.SUCCESS, {nwkAddress: 161, endpointList: [4, 1]}],
        simpleDescriptor: {
            1: [
                Zdo.Status.SUCCESS,
                {nwkAddress: 161, length: 14, endpoint: 1, profileId: 99, deviceId: 5, deviceVersion: 1, inClusterList: [0, 1], outClusterList: [2]},
            ],
            4: [
                Zdo.Status.SUCCESS,
                {nwkAddress: 161, length: 12, endpoint: 4, profileId: 99, deviceId: 5, deviceVersion: 1, inClusterList: [1], outClusterList: [2]},
            ],
        },
        attributes: {
            1: {
                modelId: 'myDevice9123',
                manufacturerName: 'Boef',
                zclVersion: 1,
                appVersion: 2,
                hwVersion: 3,
                dateCode: '201901',
                swBuildId: '1.01',
                powerSource: 1,
                stackVersion: 101,
            },
            4: {},
        },
    },
    162: {
        // stackComplianceRevision 21
        nodeDescriptor: [
            Zdo.Status.SUCCESS,
            {...NODE_DESC_DEFAULTS, nwkAddress: 162, logicalType: 0b001, manufacturerCode: 1213, serverMask: Zdo.Utils.getServerMask(0x2a00)},
        ],
        activeEndpoints: [Zdo.Status.SUCCESS, {nwkAddress: 162, endpointList: [2, 1]}],
        simpleDescriptor: {
            1: [
                Zdo.Status.SUCCESS,
                {nwkAddress: 162, length: 12, endpoint: 1, profileId: 99, deviceId: 5, deviceVersion: 1, inClusterList: [1], outClusterList: [2]},
            ],
            2: [
                Zdo.Status.SUCCESS,
                {nwkAddress: 162, length: 14, endpoint: 2, profileId: 99, deviceId: 5, deviceVersion: 1, inClusterList: [0, 1], outClusterList: [2]},
            ],
        },
        attributes: {
            2: {
                modelId: 'myDevice9124',
                manufacturerName: 'Boef',
                zclVersion: 1,
                appVersion: 2,
                hwVersion: 3,
                dateCode: '201901',
                swBuildId: '1.01',
                powerSource: 1,
                stackVersion: 101,
            },
            1: {},
        },
    },
    170: {
        nodeDescriptor: [Zdo.Status.SUCCESS, {...NODE_DESC_DEFAULTS, nwkAddress: 170, logicalType: 0b010, manufacturerCode: 4619}],
        activeEndpoints: [Zdo.Status.SUCCESS, {nwkAddress: 170, endpointList: [1]}],
        simpleDescriptor: {
            1: [
                Zdo.Status.SUCCESS,
                {
                    nwkAddress: 170,
                    length: 14,
                    endpoint: 1,
                    profileId: 99,
                    deviceId: 5,
                    deviceVersion: 1,
                    inClusterList: [0, 1280],
                    outClusterList: [2],
                },
            ],
        },
        attributes: {
            1: {
                zoneState: 0,
                iasCieAddr: '0x0000012300000000',
                modelId: 'myIasDevice',
                manufacturerName: 'KoenAndCoSecurity',
                zclVersion: 1,
                appVersion: 2,
                hwVersion: 3,
                dateCode: '201901',
                swBuildId: '1.01',
                powerSource: 1,
                stackVersion: 101,
            },
        },
    },
    171: {
        // Xiaomi WXCJKG11LM - https://github.com/koenkk/zigbee2mqtt/issues/2844
        nodeDescriptor: [Zdo.Status.SUCCESS, {...NODE_DESC_DEFAULTS, nwkAddress: 171, logicalType: 0b010, manufacturerCode: 1212}],
        activeEndpoints: [Zdo.Status.SUCCESS, {nwkAddress: 171, endpointList: [1, 2, 3, 4, 5, 6]}],
        simpleDescriptor: {
            1: [
                Zdo.Status.SUCCESS,
                {
                    nwkAddress: 171,
                    length: 16,
                    endpoint: 1,
                    profileId: 99,
                    deviceId: 5,
                    deviceVersion: 1,
                    inClusterList: [0, 1, 2],
                    outClusterList: [2],
                },
            ],
        },
        attributes: {
            1: {
                modelId: 'lumi.remote.b286opcn01',
                manufacturerName: 'Xioami',
                zclVersion: 1,
                appVersion: 2,
                hwVersion: 3,
                dateCode: '201901',
                swBuildId: '1.01',
                powerSource: 1,
                stackVersion: 101,
            },
        },
    },
    172: {
        // Gledopto GL-C-007/GL-C-008 - https://github.com/Koenkk/zigbee2mqtt/issues/2872
        // All endpoints announce to support genBasic but only endpoint 12 really responds
        nodeDescriptor: [Zdo.Status.SUCCESS, {...NODE_DESC_DEFAULTS, nwkAddress: 172, logicalType: 0b001, manufacturerCode: 1212}],
        activeEndpoints: [Zdo.Status.SUCCESS, {nwkAddress: 172, endpointList: [12, 11, 13]}],
        simpleDescriptor: {
            11: [
                Zdo.Status.SUCCESS,
                {
                    nwkAddress: 172,
                    length: 26,
                    endpoint: 11,
                    profileId: 99,
                    deviceId: 0x0210,
                    deviceVersion: 1,
                    inClusterList: [0, 3, 4, 5, 6, 8, 768, 62301],
                    outClusterList: [2],
                },
            ],
            12: [
                Zdo.Status.SUCCESS,
                {
                    nwkAddress: 172,
                    length: 24,
                    endpoint: 12,
                    profileId: 99,
                    deviceId: 0xe15e,
                    deviceVersion: 1,
                    inClusterList: [0, 3, 4, 5, 6, 8, 768],
                    outClusterList: [2],
                },
            ],
            13: [
                Zdo.Status.SUCCESS,
                {
                    nwkAddress: 172,
                    length: 24,
                    endpoint: 13,
                    profileId: 99,
                    deviceId: 0x0100,
                    deviceVersion: 1,
                    inClusterList: [0, 3, 4, 5, 6, 8, 768],
                    outClusterList: [2],
                },
            ],
        },
        attributes: {
            12: {
                modelId: 'GL-C-008',
                manufacturerName: 'Gledopto',
                zclVersion: 1,
                appVersion: 2,
                hwVersion: 3,
                dateCode: '201901',
                swBuildId: '1.01',
                powerSource: 1,
                stackVersion: 101,
            },
        },
    },
    173: {
        nodeDescriptor: [Zdo.Status.SUCCESS, {...NODE_DESC_DEFAULTS, nwkAddress: 173, logicalType: 0b010, manufacturerCode: 0}],
        activeEndpoints: [Zdo.Status.SUCCESS, {nwkAddress: 173, endpointList: [1]}],
        simpleDescriptor: undefined,
        attributes: {},
    },
    174: {
        nodeDescriptor: [Zdo.Status.SUCCESS, {...NODE_DESC_DEFAULTS, nwkAddress: 174, logicalType: 0b010, manufacturerCode: 1213}],
        activeEndpoints: [Zdo.Status.SUCCESS, {nwkAddress: 174, endpointList: [1]}],
        simpleDescriptor: {
            1: [
                Zdo.Status.SUCCESS,
                {nwkAddress: 174, length: 14, endpoint: 1, profileId: 99, deviceId: 5, deviceVersion: 1, inClusterList: [0, 32], outClusterList: [2]},
            ],
        },
        attributes: {
            1: {checkinInterval: DEFAULT_184_CHECKIN_INTERVAL},
        },
    },
    175: {
        nodeDescriptor: [Zdo.Status.SUCCESS, {...NODE_DESC_DEFAULTS, nwkAddress: 175, logicalType: 0b001, manufacturerCode: 1212}],
        activeEndpoints: [Zdo.Status.SUCCESS, {nwkAddress: 175, endpointList: [1, 2, 3, 4, 5, 6]}],
        simpleDescriptor: {
            1: [
                Zdo.Status.SUCCESS,
                {
                    nwkAddress: 175,
                    length: 16,
                    endpoint: 1,
                    profileId: 99,
                    deviceId: 5,
                    deviceVersion: 1,
                    inClusterList: [0, 1, 2],
                    outClusterList: [2],
                },
            ],
        },
        attributes: {
            1: {
                modelId: 'lumi.plug',
                manufacturerName: 'LUMI',
                zclVersion: 1,
                appVersion: 2,
                hwVersion: 3,
                dateCode: '201901',
                swBuildId: '1.01',
                powerSource: 1,
                stackVersion: 101,
            },
        },
    },
    176: {
        nodeDescriptor: [Zdo.Status.SUCCESS, {...NODE_DESC_DEFAULTS, nwkAddress: 176, logicalType: 0b001, manufacturerCode: 1212}],
        activeEndpoints: [Zdo.Status.SUCCESS, {nwkAddress: 176, endpointList: [1, 2, 3, 4, 5, 6]}],
        simpleDescriptor: {
            1: [
                Zdo.Status.SUCCESS,
                {nwkAddress: 176, length: 14, endpoint: 1, profileId: 99, deviceId: 5, deviceVersion: 1, inClusterList: [1, 2], outClusterList: [2]},
            ],
        },
        attributes: {
            1: {
                modelId: 'lumi.plug',
                manufacturerName: 'LUMI',
                zclVersion: 1,
                appVersion: 2,
                hwVersion: 3,
                dateCode: '201901',
                swBuildId: '1.01',
                powerSource: 1,
                stackVersion: 101,
            },
        },
    },
    177: {
        nodeDescriptor: [Zdo.Status.SUCCESS, {...NODE_DESC_DEFAULTS, nwkAddress: 177, logicalType: 0b001, manufacturerCode: 4129}],
        activeEndpoints: [Zdo.Status.SUCCESS, {nwkAddress: 177, endpointList: [1]}],
        simpleDescriptor: {
            1: [
                Zdo.Status.SUCCESS,
                {
                    nwkAddress: 177,
                    length: 32,
                    endpoint: 1,
                    profileId: 260,
                    deviceId: 514,
                    deviceVersion: 1,
                    inClusterList: [0, 3, 258, 4, 5, 15, 64513],
                    outClusterList: [258, 0, 64513, 5, 25],
                },
            ],
        },
        attributes: {
            1: {
                modelId: ' Shutter switch with neutral',
                manufacturerName: 'Legrand',
                zclVersion: 2,
                appVersion: 0,
                hwVersion: 8,
                dateCode: '231030',
                swBuildId: '0038',
                powerSource: 1,
                stackVersion: 67,
            },
        },
    },
};
