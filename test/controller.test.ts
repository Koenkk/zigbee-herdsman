import "regenerator-runtime/runtime";
import {Controller} from '../src/controller';
import {ZStackAdapter} from '../src/adapter/z-stack/adapter';
import {DeconzAdapter} from '../src/adapter/deconz/adapter';
import equals from 'fast-deep-equal/es6';
import fs from 'fs';
import { ZclFrame } from "../src/zcl";
import { Device, Group } from "../src/controller/model";
import * as Zcl from '../src/zcl';
import zclTransactionSequenceNumber from '../src/controller/helpers/zclTransactionSequenceNumber';
import {Adapter} from '../src/adapter';
import path  from 'path';
import {Wait} from '../src/utils';

let skipWait = false;
Wait.mockImplementation((milliseconds) => {
    if (!skipWait) {
        return new Promise((resolve): void => {
            setTimeout((): void => resolve(), milliseconds);
        });
    }
})

Date.now = jest.fn()
// @ts-ignore
Date.now.mockReturnValue(150);

const mockAdapterEvents = {};
const mockAdapterWaitFor = jest.fn();
const mockAdapterSupportsDiscoverRoute = jest.fn();
const mockSetChannelInterPAN = jest.fn();
const mocksendZclFrameInterPANToIeeeAddr = jest.fn();
const mocksendZclFrameInterPANBroadcast = jest.fn();
const mockRestoreChannelInterPAN = jest.fn();
const mockAdapterPermitJoin = jest.fn();
const mockDiscoverRoute = jest.fn();
const mockAdapterSupportsBackup = jest.fn().mockReturnValue(true);
const mockAdapterReset = jest.fn();
const mockAdapterStop = jest.fn();
const mockAdapterStart = jest.fn().mockReturnValue('resumed');
const mockAdapterSetLED = jest.fn();
const mockAdapterSupportsLED = jest.fn().mockReturnValue(true);
const mockAdapterSetTransmitPower = jest.fn();
const mockAdapterGetCoordinator = jest.fn().mockReturnValue({
    ieeeAddr: '0x123',
    networkAddress: 123,
    manufacturerID: 100,
    endpoints: [
        {ID: 1, profileID: 2, deviceID: 3, inputClusters: [10], outputClusters: [11]},
        {ID: 2, profileID: 3, deviceID: 5, inputClusters: [1], outputClusters: [0]},
    ]
});
const mockAdapterBind = jest.fn();
const mocksendZclFrameToGroup = jest.fn();
const mocksendZclFrameToAll = jest.fn();
const mockAdapterUnbind = jest.fn();
const mockAdapterRemoveDevice = jest.fn();
const mocksendZclFrameToEndpoint = jest.fn();

let iasZoneReadState170Count = 0;
let enroll170 = true;
let configureReportStatus = 0;

const restoreMocksendZclFrameToEndpoint = () => {
    mocksendZclFrameToEndpoint.mockImplementation((networkAddress, endpoint, frame: ZclFrame) => {
        if (frame.isGlobal() && frame.isCommand('read') && (frame.isCluster('genBasic') || frame.isCluster('ssIasZone'))) {
            const payload = [];
            const cluster = frame.Cluster;
            for (const item of frame.Payload) {
                if (frame.isCluster('ssIasZone') && item.attrId === 0) {
                    iasZoneReadState170Count++;
                    payload.push({attrId: item.attrId, attrData: iasZoneReadState170Count === 2 && enroll170 ? 1 : 0, status: 0});
                } else if (item.attrId !== 65314) {
                    const attribute = cluster.getAttribute(item.attrId).name;
                    payload.push({attrId: item.attrId, attrData: mockDevices[networkAddress].attributes[endpoint][attribute], status: 0})
                }
            }

            // @ts-ignore
            return {frame: new ZclFrame(null, payload, frame.Cluster)};
        }

        if (frame.isSpecific() && (frame.isCommand('add') || frame.isCommand('remove')) && frame.isCluster('genGroups')) {
            // @ts-ignore
            return {frame: new ZclFrame(null, {status: 0, groupid: 1}, frame.Cluster)};
        }

        if (networkAddress === 170 && frame.isGlobal() && frame.isCluster('ssIasZone') && frame.isCommand('write') && frame.Payload[0].attrId === 16) {
            // Write of ias cie address
            const response = Zcl.ZclFrame.create(
                Zcl.FrameType.SPECIFIC, Zcl.Direction.SERVER_TO_CLIENT, false,
                null, 1, 'enrollReq', Zcl.Utils.getCluster('ssIasZone').ID,
                {zonetype: 0, manucode: 1}
            );

            mockAdapterEvents['zclData']({
                address: 170,
                frame: response,
                endpoint: 1,
                linkquality: 50,
                groupID: 1,
            });
        }

        if (frame.isGlobal() && frame.isCommand('write')) {
            const payload = [];
            for (const item of frame.Payload) {
                payload.push({attrId: item.attrId, status: 0})
            }

            // @ts-ignore
            return {frame: new ZclFrame(null, payload, frame.Cluster)};
        }

        if (frame.isGlobal() && frame.isCommand('configReport')) {
            const payload = [];
            for (const item of frame.Payload) {
                payload.push({attrId: item.attrId, status: configureReportStatus, direction: 1})
            }

            // @ts-ignore
            return {frame: new ZclFrame(null, payload, frame.Cluster)};
        }
    })
}

const mocksClear = [mocksendZclFrameToEndpoint, mockAdapterReset];
const deepClone = (obj) => JSON.parse(JSON.stringify(obj));

const equalsPartial = (object, expected) => {
    for (const [key, value] of Object.entries(expected)) {
        if (!equals(object[key], value)) {
            return false;
        }
    }

    return true;
}

const mockDevices = {
    129: {
        nodeDescriptor: {type: 'Router', manufacturerCode: 1212},
        activeEndpoints: {endpoints: [1]},
        simpleDescriptor: {1: {endpointID: 1, deviceID: 5, inputClusters: [0, 1], outputClusters: [2], profileID: 99}},
        attributes: {
            1: {modelId: 'myModelID', manufacturerName: 'KoenAndCo', zclVersion: 1, appVersion: 2, hwVersion: 3, dateCode: '201901', swBuildId: '1.01', powerSource: 1, stackVersion: 101}
        },
    },
    140: {
        nodeDescriptor: undefined,
    },
    150: {
        nodeDescriptor: 'xiaomi_error',
    },
    151: {
        nodeDescriptor: 'xiaomi',
        activeEndpoints: 'error',
    },
    160: {
        nodeDescriptor: {type: 'Router', manufacturerCode: 1212},
        activeEndpoints: {endpoints: []},
        attributes: {
        },
    },
    161: {
        nodeDescriptor: {type: 'Router', manufacturerCode: 1213},
        activeEndpoints: {endpoints: [4, 1]},
        simpleDescriptor: {1: {endpointID: 1, deviceID: 5, inputClusters: [0, 1], outputClusters: [2], profileID: 99}, 4: {endpointID: 1, deviceID: 5, inputClusters: [1], outputClusters: [2], profileID: 99}},
        attributes: {
            1: {modelId: 'myDevice9123', manufacturerName: 'Boef', zclVersion: 1, appVersion: 2, hwVersion: 3, dateCode: '201901', swBuildId: '1.01', powerSource: 1, stackVersion: 101},
            4: {}
        },
    },
    162: {
        nodeDescriptor: {type: 'Router', manufacturerCode: 1213},
        activeEndpoints: {endpoints: [2, 1]},
        simpleDescriptor: {1: {endpointID: 1, deviceID: 5, inputClusters: [1], outputClusters: [2], profileID: 99}, 2: {endpointID: 2, deviceID: 5, inputClusters: [0, 1], outputClusters: [2], profileID: 99}},
        attributes: {
            2: {modelId: 'myDevice9124', manufacturerName: 'Boef', zclVersion: 1, appVersion: 2, hwVersion: 3, dateCode: '201901', swBuildId: '1.01', powerSource: 1, stackVersion: 101},
            1: {}
        },
    },
    170: {
        nodeDescriptor: {type: 'Router', manufacturerCode: 1212},
        activeEndpoints: {endpoints: [1]},
        simpleDescriptor: {1: {endpointID: 1, deviceID: 5, inputClusters: [0, 1280], outputClusters: [2], profileID: 99}},
        attributes: {
            1: {zoneState: 0, iasCieAddr: '0x123', modelId: 'myIasDevice', manufacturerName: 'KoenAndCoSecurity', zclVersion: 1, appVersion: 2, hwVersion: 3, dateCode: '201901', swBuildId: '1.01', powerSource: 1, stackVersion: 101},
        },
    },
    171: {
        // Xiaomi WXCJKG11LM - https://github.com/koenkk/zigbee2mqtt/issues/2844
        nodeDescriptor: {type: 'EndDevice', manufacturerCode: 1212},
        activeEndpoints: {endpoints: [1,2,3,4,5,6]},
        simpleDescriptor: {1: {endpointID: 1, deviceID: 5, inputClusters: [0, 1, 2], outputClusters: [2], profileID: 99}},
        attributes: {
            1: {modelId: 'lumi.remote.b286opcn01', manufacturerName: 'Xioami', zclVersion: 1, appVersion: 2, hwVersion: 3, dateCode: '201901', swBuildId: '1.01', powerSource: 1, stackVersion: 101},
        },
    },
    172: {
        // Gledopto GL-C-007/GL-C-008 - https://github.com/Koenkk/zigbee2mqtt/issues/2872
        // All endpoints announce to support genBasic but only endpoint 12 really responds
        nodeDescriptor: {type: 'Router', manufacturerCode: 1212},
        activeEndpoints: {endpoints: [12,11,13]},
        simpleDescriptor: {
            11: {endpointID: 11, deviceID: 0x0210, inputClusters: [0,3,4,5,6,8,768], outputClusters: [2], profileID: 99},
            12: {endpointID: 12, deviceID: 0xe15e, inputClusters: [0,3,4,5,6,8,768], outputClusters: [2], profileID: 99},
            13: {endpointID: 13, deviceID: 0x0100, inputClusters: [0,3,4,5,6,8,768], outputClusters: [2], profileID: 99},
        },
        attributes: {
            12: {modelId: 'GL-C-008', manufacturerName: 'Gledopto', zclVersion: 1, appVersion: 2, hwVersion: 3, dateCode: '201901', swBuildId: '1.01', powerSource: 1, stackVersion: 101},
        },
    },
}

const mockZclFrame = ZclFrame;

// Mock realPathSync
jest.mock('../src/utils/realpathSync', () => {
    return jest.fn().mockImplementation((path) => {
        return path;
    });
});

jest.mock('../src/utils/wait', () => {
    return jest.fn().mockImplementation(() => {
        return new Promise((resolve, reject) => resolve());
    });
});

const getCluster = (key) => {
    const cluster = Zcl.Utils.getCluster(key);
    delete cluster.getAttribute;
    delete cluster.getCommand;
    delete cluster.hasAttribute;
    delete cluster.getCommandResponse;
    return cluster;
}


jest.mock('../src/adapter/z-stack/adapter/zStackAdapter', () => {
    return jest.fn().mockImplementation(() => {
        return {
            greenPowerGroup: 0x0b84,
            on: (event, handler) => mockAdapterEvents[event] = handler,
            removeAllListeners: (event) => delete mockAdapterEvents[event],
            start: mockAdapterStart,
            getCoordinator: mockAdapterGetCoordinator,
            reset: mockAdapterReset,
            supportsBackup: mockAdapterSupportsBackup,
            backup: () => {return {version: 'dummybackup'}},
            getCoordinatorVersion: () => {return {type: 'zStack', meta: {version: 1}}},
            getNetworkParameters: () => {return {panID: 1, extendedPanID: 3, channel: 15}},
            setLED: mockAdapterSetLED,
            supportsLED: mockAdapterSupportsLED,
            waitFor: mockAdapterWaitFor,
            setTransmitPower: mockAdapterSetTransmitPower,
            nodeDescriptor: async (networkAddress) => {
                const descriptor = mockDevices[networkAddress].nodeDescriptor;
                if (typeof descriptor === 'string' && descriptor.startsWith('xiaomi')) {
                    await mockAdapterEvents['zclData']({
                        address: networkAddress,
                        frame: mockZclFrame.create(0, 1, true, null, 10, 'readRsp', 0, [{attrId: 5, status: 0, dataType: 66, attrData: 'lumi.occupancy'}]),
                        endpoint: 1,
                        linkquality: 50,
                        groupID: 1,
                    });

                    if (descriptor.endsWith('error')) {
                        throw new Error('failed');
                    } else {
                        return {type: 'EndDevice', manufacturerCode: 1219};
                    }
                } else {
                    return descriptor;
                }
            },
            activeEndpoints: (networkAddress) => {
                if (mockDevices[networkAddress].activeEndpoints === 'error') {
                    throw new Error('timeout');
                } else {
                    return mockDevices[networkAddress].activeEndpoints;
                }
            },
            simpleDescriptor: (networkAddress, endpoint) => {
                if (mockDevices[networkAddress].simpleDescriptor[endpoint] === undefined) {
                    throw new Error('Simple descriptor failed');
                }

                return mockDevices[networkAddress].simpleDescriptor[endpoint];
            },
            sendZclFrameToEndpoint: mocksendZclFrameToEndpoint,
            sendZclFrameToGroup: mocksendZclFrameToGroup,
            sendZclFrameToAll: mocksendZclFrameToAll,
            permitJoin: mockAdapterPermitJoin,
            supportsDiscoverRoute: mockAdapterSupportsDiscoverRoute,
            discoverRoute: mockDiscoverRoute,
            stop: mockAdapterStop,
            removeDevice: mockAdapterRemoveDevice,
            lqi: (networkAddress) => {
                if (networkAddress === 140) {
                    return {neighbors: [
                        {ieeeAddr: '0x160', networkAddress: 160, linkquality: 20, relationship: 2, depth: 5},
                        {ieeeAddr: '0x170', networkAddress: 170, linkquality: 21, relationship: 4, depth: 8},
                    ]}
                }
            },
            routingTable: (networkAddress) => {
                if (networkAddress === 140) {
                    return {table: [
                        {destinationAddress: 120, status: 'SUCCESS', nextHop: 1},
                        {destinationAddress: 130, status: 'FAILED', nextHop: 2},
                    ]}
                }
            },
            bind: mockAdapterBind,
            unbind: mockAdapterUnbind,
            setChannelInterPAN: mockSetChannelInterPAN,
            sendZclFrameInterPANToIeeeAddr: mocksendZclFrameInterPANToIeeeAddr,
            sendZclFrameInterPANBroadcast: mocksendZclFrameInterPANBroadcast,
            restoreChannelInterPAN: mockRestoreChannelInterPAN,
        };
    });
});

jest.mock('../src/adapter/deconz/adapter/deconzAdapter', () => {
    return jest.fn().mockImplementation(() => {
        return {
        };
    });
});

const getTempFile = (filename) => {
    const tempPath = path.resolve('temp');
    if (!fs.existsSync(tempPath)){
        fs.mkdirSync(tempPath);
    }

    return path.join(tempPath, filename);
}

// Mock static methods
const mockZStackAdapterIsValidPath = jest.fn().mockReturnValue(true);
const mockZStackAdapterAutoDetectPath = jest.fn().mockReturnValue("/dev/autodetected");
ZStackAdapter.isValidPath = mockZStackAdapterIsValidPath;
ZStackAdapter.autoDetectPath = mockZStackAdapterAutoDetectPath;

const mockDeconzAdapterIsValidPath = jest.fn().mockReturnValue(true);
const mockDeconzAdapterAutoDetectPath = jest.fn().mockReturnValue("/dev/autodetected");
DeconzAdapter.isValidPath = mockDeconzAdapterIsValidPath;
DeconzAdapter.autoDetectPath = mockDeconzAdapterAutoDetectPath;

const mocksRestore = [
    mockAdapterStart, mockAdapterPermitJoin, mockAdapterStop, mockAdapterRemoveDevice, mocksendZclFrameToAll,
    mockZStackAdapterIsValidPath, mockZStackAdapterAutoDetectPath, mockDeconzAdapterIsValidPath, mockDeconzAdapterAutoDetectPath,
];

const events = {
    deviceJoined: [],
    deviceInterview: [],
    adapterDisconnected: [],
    deviceAnnounce: [],
    deviceLeave: [],
    message: [],
}

const backupPath = getTempFile('backup');

const options = {
    network: {
        panID: 0x1a63,
        channelList: [15],
    },
    serialPort: {
        baudRate: 115200,
        rtscts: true,
        path: '/dummy/conbee',
        adapter: null,
    },
    databasePath: getTempFile('database'),
    databaseBackupPath: null,
    backupPath,
    acceptJoiningDeviceHandler: null,
}

const databaseContents = () => fs.readFileSync(options.databasePath).toString();

describe('Controller', () => {
    let controller;

    beforeEach(async () => {
        // @ts-ignore
        zclTransactionSequenceNumber.number = 1;
        iasZoneReadState170Count = 0;
        configureReportStatus = 0;
        skipWait = false;
        enroll170 = true;
        options.network.channelList = [15];
        Object.keys(events).forEach((key) => events[key] = []);
        Device['devices'] = null;
        Group['groups'] = null;
        if (fs.existsSync(options.databasePath)) {
            fs.unlinkSync(options.databasePath);
        }
        controller = new Controller(options);
        controller.on('deviceJoined', (device) => events.deviceJoined.push(device));
        controller.on('deviceInterview', (device) => events.deviceInterview.push(deepClone(device)));
        controller.on('adapterDisconnected', () => events.adapterDisconnected.push(1));
        controller.on('deviceAnnounce', (device) => events.deviceAnnounce.push(device));
        controller.on('deviceLeave', (device) => events.deviceLeave.push(device));
        controller.on('message', (message) => events.message.push(message));
        mocksRestore.forEach((m) => m.mockRestore());
        mocksClear.forEach((m) => m.mockClear());
        restoreMocksendZclFrameToEndpoint();
        jest.useRealTimers();
    });

    it('Call controller constructor options mixed with default options', async () => {
        await controller.start();
        expect(ZStackAdapter).toBeCalledWith({"networkKeyDistribute":false,"networkKey":[1,3,5,7,9,11,13,15,0,2,4,6,8,10,12,13],"panID":6755,"extendedPanID":[221,221,221,221,221,221,221,221],"channelList":[15]}, {"baudRate": 115200, "path": "/dummy/conbee", "rtscts": true, "adapter": null}, backupPath, null);
    });

    it('Call controller constructor error on invalid channel', async () => {
        options.network.channelList = [10];
        expect(() => {
            new Controller(options);
        }).toThrowError("'10' is an invalid channel, use a channel between 11 - 26.");
    });

    it('Call controller constructor error on invalid channel', async () => {
        const newOptions = deepClone(options);
        newOptions.network.networkKey = [1,2,3];
        expect(() => {
            new Controller(newOptions);
        }).toThrowError('Network key must be 16 digits long, got 3.');
    });

    it('Controller start', async () => {
        jest.useFakeTimers();
        await controller.start();
        expect(mockAdapterStart).toBeCalledTimes(1);
        expect(deepClone(controller.getDevicesByType('Coordinator')[0])).toStrictEqual({
            ID: 1,
                _endpoints:
                 [ { deviceID: 3,
                     inputClusters: [10],
                     outputClusters: [11],
                     profileID: 2,
                     ID: 1,
                     clusters: {},
                     deviceIeeeAddress: '0x123',
                     deviceNetworkAddress: 123,
                     _binds: [] },
                   { deviceID: 5,
                     inputClusters: [1],
                     outputClusters: [0],
                     profileID: 3,
                     ID: 2,
                     clusters: {},
                     deviceIeeeAddress: '0x123',
                     deviceNetworkAddress: 123,
                     _binds: [] } ],
                _ieeeAddr: '0x123',
                _interviewCompleted: true,
                _interviewing: false,
                _lastSeen: null,
                _manufacturerID: 100,
                _networkAddress: 123,
                _type: 'Coordinator',
                meta: {}
        });
        expect(JSON.parse(fs.readFileSync(options.backupPath).toString())).toStrictEqual({version: 'dummybackup'});
        jest.advanceTimersByTime(86500000);
    });

    it('Controller stop, should create backup', async () => {
        await controller.start();
        if (fs.existsSync(options.backupPath)) fs.unlinkSync(options.backupPath);
        await controller.stop();
        expect(mockAdapterPermitJoin).toBeCalledWith(0, null);
        expect(JSON.parse(fs.readFileSync(options.backupPath).toString())).toStrictEqual({version: 'dummybackup'});
        expect(mockAdapterStop).toBeCalledTimes(1);
    });

    it('Controller update ieeeAddr if changed', async () => {
        await controller.start();
        expect(controller.getDevicesByType('Coordinator')[0].ieeeAddr).toStrictEqual("0x123");
        await controller.stop();
        mockAdapterGetCoordinator.mockReturnValueOnce({
            ieeeAddr: '0x123444',
            networkAddress: 123,
            manufacturerID: 100,
            endpoints: [
                {ID: 1, profileID: 2, deviceID: 3, inputClusters: [10], outputClusters: [11]},
                {ID: 2, profileID: 3, deviceID: 5, inputClusters: [1], outputClusters: [0]},
            ]
        })
        await controller.start();
        expect(controller.getDevicesByType('Coordinator')[0].ieeeAddr).toStrictEqual("0x123444");
    });

    it('Touchlink factory reset', async () => {
        await controller.start();
        let counter = 0;
        mocksendZclFrameInterPANBroadcast.mockImplementation(() => {
            counter++;
            if (counter === 1) {
                throw new Error('no response')
            } else if (counter === 2) {
                return {address: '0x123'};
            }
        });
        const result = await controller.touchlinkFactoryReset();
        expect(result).toBeTruthy();

        expect(mockSetChannelInterPAN).toHaveBeenCalledTimes(2);
        expect(mockSetChannelInterPAN).toHaveBeenCalledWith(11);
        expect(mockSetChannelInterPAN).toHaveBeenCalledWith(15);
        expect(mocksendZclFrameInterPANBroadcast).toHaveBeenCalledTimes(2);
        expect(deepClone(mocksendZclFrameInterPANBroadcast.mock.calls[0][0])).toStrictEqual({"Header":{"frameControl":{"reservedBits":0,"frameType":1,"direction":0,"disableDefaultResponse":true,"manufacturerSpecific":false},"transactionSequenceNumber":0,"manufacturerCode":null,"commandIdentifier":0},"Payload":{"transactionID":1,"zigbeeInformation":4,"touchlinkInformation":18},"Cluster":{"ID":4096,"attributes":{},"name":"touchlink","commands":{"scanRequest":{"ID":0,"response":1,"parameters":[{"name":"transactionID","type":35},{"name":"zigbeeInformation","type":24},{"name":"touchlinkInformation","type":24}],"name":"scanRequest"},"identifyRequest":{"ID":6,"parameters":[{"name":"transactionID","type":35},{"name":"duration","type":33}],"name":"identifyRequest"},"resetToFactoryNew":{"ID":7,"parameters":[{"name":"transactionID","type":35}],"name":"resetToFactoryNew"}},"commandsResponse":{"scanResponse":{"ID":1,"parameters":[{"name":"transactionID","type":35},{"name":"rssiCorrection","type":32},{"name":"zigbeeInformation","type":32},{"name":"touchlinkInformation","type":32},{"name":"keyBitmask","type":33},{"name":"responseID","type":35},{"name":"extendedPanID","type":240},{"name":"networkUpdateID","type":32},{"name":"logicalChannel","type":32},{"name":"panID","type":33},{"name":"networkAddress","type":33},{"name":"numberOfSubDevices","type":32},{"name":"totalGroupIdentifiers","type":32},{"name":"endpointID","type":32},{"name":"profileID","type":33},{"name":"deviceID","type":33},{"name":"version","type":32},{"name":"groupIdentifierCount","type":32}],"name":"scanResponse"}}}});
        expect(deepClone(mocksendZclFrameInterPANBroadcast.mock.calls[1][0])).toStrictEqual({"Header":{"frameControl":{"reservedBits":0,"frameType":1,"direction":0,"disableDefaultResponse":true,"manufacturerSpecific":false},"transactionSequenceNumber":0,"manufacturerCode":null,"commandIdentifier":0},"Payload":{"transactionID":1,"zigbeeInformation":4,"touchlinkInformation":18},"Cluster":{"ID":4096,"attributes":{},"name":"touchlink","commands":{"scanRequest":{"ID":0,"response":1,"parameters":[{"name":"transactionID","type":35},{"name":"zigbeeInformation","type":24},{"name":"touchlinkInformation","type":24}],"name":"scanRequest"},"identifyRequest":{"ID":6,"parameters":[{"name":"transactionID","type":35},{"name":"duration","type":33}],"name":"identifyRequest"},"resetToFactoryNew":{"ID":7,"parameters":[{"name":"transactionID","type":35}],"name":"resetToFactoryNew"}},"commandsResponse":{"scanResponse":{"ID":1,"parameters":[{"name":"transactionID","type":35},{"name":"rssiCorrection","type":32},{"name":"zigbeeInformation","type":32},{"name":"touchlinkInformation","type":32},{"name":"keyBitmask","type":33},{"name":"responseID","type":35},{"name":"extendedPanID","type":240},{"name":"networkUpdateID","type":32},{"name":"logicalChannel","type":32},{"name":"panID","type":33},{"name":"networkAddress","type":33},{"name":"numberOfSubDevices","type":32},{"name":"totalGroupIdentifiers","type":32},{"name":"endpointID","type":32},{"name":"profileID","type":33},{"name":"deviceID","type":33},{"name":"version","type":32},{"name":"groupIdentifierCount","type":32}],"name":"scanResponse"}}}});
        expect(mockRestoreChannelInterPAN).toHaveBeenCalledTimes(2);
        expect(mocksendZclFrameInterPANToIeeeAddr).toHaveBeenCalledTimes(2);
        expect(deepClone(mocksendZclFrameInterPANToIeeeAddr.mock.calls[0][0])).toStrictEqual({"Header":{"frameControl":{"reservedBits":0,"frameType":1,"direction":0,"disableDefaultResponse":true,"manufacturerSpecific":false},"transactionSequenceNumber":0,"manufacturerCode":null,"commandIdentifier":6},"Payload":{"transactionID":1,"duration":65535},"Cluster":{"ID":4096,"attributes":{},"name":"touchlink","commands":{"scanRequest":{"ID":0,"response":1,"parameters":[{"name":"transactionID","type":35},{"name":"zigbeeInformation","type":24},{"name":"touchlinkInformation","type":24}],"name":"scanRequest"},"identifyRequest":{"ID":6,"parameters":[{"name":"transactionID","type":35},{"name":"duration","type":33}],"name":"identifyRequest"},"resetToFactoryNew":{"ID":7,"parameters":[{"name":"transactionID","type":35}],"name":"resetToFactoryNew"}},"commandsResponse":{"scanResponse":{"ID":1,"parameters":[{"name":"transactionID","type":35},{"name":"rssiCorrection","type":32},{"name":"zigbeeInformation","type":32},{"name":"touchlinkInformation","type":32},{"name":"keyBitmask","type":33},{"name":"responseID","type":35},{"name":"extendedPanID","type":240},{"name":"networkUpdateID","type":32},{"name":"logicalChannel","type":32},{"name":"panID","type":33},{"name":"networkAddress","type":33},{"name":"numberOfSubDevices","type":32},{"name":"totalGroupIdentifiers","type":32},{"name":"endpointID","type":32},{"name":"profileID","type":33},{"name":"deviceID","type":33},{"name":"version","type":32},{"name":"groupIdentifierCount","type":32}],"name":"scanResponse"}}}});
        expect(deepClone(mocksendZclFrameInterPANToIeeeAddr.mock.calls[1][0])).toStrictEqual({"Header":{"frameControl":{"reservedBits":0,"frameType":1,"direction":0,"disableDefaultResponse":true,"manufacturerSpecific":false},"transactionSequenceNumber":0,"manufacturerCode":null,"commandIdentifier":7},"Payload":{"transactionID":1},"Cluster":{"ID":4096,"attributes":{},"name":"touchlink","commands":{"scanRequest":{"ID":0,"response":1,"parameters":[{"name":"transactionID","type":35},{"name":"zigbeeInformation","type":24},{"name":"touchlinkInformation","type":24}],"name":"scanRequest"},"identifyRequest":{"ID":6,"parameters":[{"name":"transactionID","type":35},{"name":"duration","type":33}],"name":"identifyRequest"},"resetToFactoryNew":{"ID":7,"parameters":[{"name":"transactionID","type":35}],"name":"resetToFactoryNew"}},"commandsResponse":{"scanResponse":{"ID":1,"parameters":[{"name":"transactionID","type":35},{"name":"rssiCorrection","type":32},{"name":"zigbeeInformation","type":32},{"name":"touchlinkInformation","type":32},{"name":"keyBitmask","type":33},{"name":"responseID","type":35},{"name":"extendedPanID","type":240},{"name":"networkUpdateID","type":32},{"name":"logicalChannel","type":32},{"name":"panID","type":33},{"name":"networkAddress","type":33},{"name":"numberOfSubDevices","type":32},{"name":"totalGroupIdentifiers","type":32},{"name":"endpointID","type":32},{"name":"profileID","type":33},{"name":"deviceID","type":33},{"name":"version","type":32},{"name":"groupIdentifierCount","type":32}],"name":"scanResponse"}}}});
    });

    it('Controller should ignore touchlink messages', async () => {
        await controller.start();
        await mockAdapterEvents['deviceJoined']({networkAddress: 129, ieeeAddr: '0x129'});
        await mockAdapterEvents['zclData']({
            networkAddress: 129,
            frame: Zcl.ZclFrame.create(
                Zcl.FrameType.SPECIFIC, Zcl.Direction.SERVER_TO_CLIENT, false,
                null, 1, 'scanResponse', Zcl.Utils.getCluster('touchlink').ID,
                {}
            ),
            endpoint: 1,
            linkquality: 50,
            groupID: 1,
        });

        expect(events.message.length).toBe(0);
    });

    it('Set transmit power', async () => {
        await controller.start();
        await controller.setTransmitPower(15);
        expect(mockAdapterSetTransmitPower).toHaveBeenCalledWith(15);
    });

    it('Disable led', async () => {
        await controller.start();
        await controller.setLED(false);
        expect(mockAdapterSetLED).toBeCalledTimes(1);
    });

    it('Throw error when not supports LED', async () => {
        await controller.start();
        mockAdapterSupportsLED.mockReturnValueOnce(false);
        expect(await controller.supportsLED()).toBeFalsy();
        mockAdapterSupportsLED.mockReturnValueOnce(false);
        let error;
        try {await controller.setLED(false)} catch (e) {error = e;}
        expect(error).toStrictEqual(new Error(`Adapter doesn't support LED`));
    });

    it('Get coordinator version', async () => {
        await controller.start();
        expect(await controller.getCoordinatorVersion()).toEqual({type: 'zStack', meta: {version: 1}});
    });

    it('Get network parameters', async () => {
        await controller.start();
        expect(await controller.getNetworkParameters()).toEqual({panID: 1, channel: 15, extendedPanID: 3});
    });

    it('Join a device', async () => {
        await controller.start();
        expect(databaseContents().includes("0x129")).toBeFalsy();
        await mockAdapterEvents['deviceJoined']({networkAddress: 129, ieeeAddr: '0x129'});
        expect(equalsPartial(events.deviceJoined[0].device, {ID: 2, networkAddress: 129, ieeeAddr: '0x129'})).toBeTruthy();
        expect(events.deviceInterview[0]).toStrictEqual({"device":{"meta": {}, "_lastSeen": deepClone(Date.now()), "ID":2,"_endpoints":[],"_ieeeAddr":"0x129","_interviewCompleted":false,"_interviewing":false,"_networkAddress":129},"status":"started"});
        const device = {"ID":2,"_lastSeen": deepClone(Date.now()),"_ieeeAddr":"0x129","_networkAddress":129,"meta": {},"_endpoints":[{"clusters": {}, "ID":1,"inputClusters":[0,1],"outputClusters":[2],"deviceNetworkAddress":129,"deviceIeeeAddress":"0x129","_binds": [],"deviceID":5,"profileID":99}],"_type":"Router","_manufacturerID":1212,"_manufacturerName":"KoenAndCo","_powerSource":"Mains (single phase)","_modelID":"myModelID","_applicationVersion":2,"_stackVersion":101,"_zclVersion":1,"_hardwareVersion":3,"_dateCode":"201901","_softwareBuildID":"1.01","_interviewCompleted":true,"_interviewing":false};
        expect(events.deviceInterview[1]).toStrictEqual({"status":"successful","device":device});
        expect(deepClone(controller.getDeviceByIeeeAddr('0x129'))).toStrictEqual(device);
        expect(events.deviceInterview.length).toBe(2);
        expect(databaseContents()).toStrictEqual(`{"id":1,"type":"Coordinator","ieeeAddr":"0x123","nwkAddr":123,"manufId":100,"epList":[1,2],"endpoints":{"1":{"profId":2,"epId":1,"devId":3,"inClusterList":[10],"outClusterList":[11],"clusters":{},"binds":[]},"2":{"profId":3,"epId":2,"devId":5,"inClusterList":[1],"outClusterList":[0],"clusters":{},"binds":[]}},"interviewCompleted":true,"meta":{},"lastSeen":null}\n{"id":2,"type":"Router","ieeeAddr":"0x129","nwkAddr":129,"manufId":1212,"manufName":"KoenAndCo","powerSource":"Mains (single phase)","modelId":"myModelID","epList":[1],"endpoints":{"1":{"profId":99,"epId":1,"devId":5,"inClusterList":[0,1],"outClusterList":[2],"clusters":{},"binds":[]}},"appVersion":2,"stackVersion":101,"hwVersion":3,"dateCode":"201901","swBuildId":"1.01","zclVersion":1,"interviewCompleted":true,"meta":{},"lastSeen":150}`);
        expect(controller.getDeviceByIeeeAddr('0x129').lastSeen).toBe(Date.now());
    });

    it('Join a device and explictly accept it', async () => {
        const mockAcceptJoiningDeviceHandler = jest.fn().mockReturnValue(true);
        controller = new Controller({...options, acceptJoiningDeviceHandler: mockAcceptJoiningDeviceHandler});
        controller.on('deviceJoined', (device) => events.deviceJoined.push(device));
        controller.on('deviceInterview', (device) => events.deviceInterview.push(deepClone(device)));
        await controller.start();
        expect(databaseContents().includes("0x129")).toBeFalsy();
        await mockAdapterEvents['deviceJoined']({networkAddress: 129, ieeeAddr: '0x129'});
        expect(equalsPartial(events.deviceJoined[0].device, {ID: 2, networkAddress: 129, ieeeAddr: '0x129'})).toBeTruthy();
        expect(events.deviceInterview[0]).toStrictEqual({"device":{"meta": {}, "_lastSeen": deepClone(Date.now()), "ID":2,"_endpoints":[],"_ieeeAddr":"0x129","_interviewCompleted":false,"_interviewing":false,"_networkAddress":129},"status":"started"});
        const device = {"ID":2,"_lastSeen": deepClone(Date.now()),"_ieeeAddr":"0x129","_networkAddress":129,"meta": {},"_endpoints":[{"clusters": {}, "ID":1,"inputClusters":[0,1],"outputClusters":[2],"deviceNetworkAddress":129,"deviceIeeeAddress":"0x129","_binds": [],"deviceID":5,"profileID":99}],"_type":"Router","_manufacturerID":1212,"_manufacturerName":"KoenAndCo","_powerSource":"Mains (single phase)","_modelID":"myModelID","_applicationVersion":2,"_stackVersion":101,"_zclVersion":1,"_hardwareVersion":3,"_dateCode":"201901","_softwareBuildID":"1.01","_interviewCompleted":true,"_interviewing":false};
        expect(events.deviceInterview[1]).toStrictEqual({"status":"successful","device":device});
        expect(deepClone(controller.getDeviceByIeeeAddr('0x129'))).toStrictEqual(device);
        expect(events.deviceInterview.length).toBe(2);
        expect(databaseContents().includes("0x129")).toBeTruthy();
        expect(controller.getDeviceByIeeeAddr('0x129').lastSeen).toBe(Date.now());
    });

    it('Join a device and explictly refuse it', async () => {
        const mockAcceptJoiningDeviceHandler = jest.fn().mockReturnValue(false);
        controller = new Controller({...options, acceptJoiningDeviceHandler: mockAcceptJoiningDeviceHandler});
        controller.on('deviceJoined', (device) => events.deviceJoined.push(device));
        controller.on('deviceInterview', (device) => events.deviceInterview.push(deepClone(device)));
        await controller.start();
        expect(databaseContents().includes("0x129")).toBeFalsy();
        await mockAdapterEvents['deviceJoined']({networkAddress: 129, ieeeAddr: '0x129'});
        expect(events.deviceJoined.length).toBe(0);
        expect(events.deviceInterview.length).toBe(0);
        expect(databaseContents().includes("0x129")).toBeFalsy();
        expect(controller.getDeviceByIeeeAddr('0x129')).toBeUndefined();
        expect(mockAdapterRemoveDevice).toHaveBeenNthCalledWith(1, 129, '0x129');
    });

    it('Set device powersource by string', async () => {
        await controller.start();
        await mockAdapterEvents['deviceJoined']({networkAddress: 129, ieeeAddr: '0x129'});
        const device = controller.getDeviceByIeeeAddr('0x129');
        device.powerSource = 'test123';
        expect(device.powerSource).toBe('test123')
    });

    it('Get device should return same instance', async () => {
        jest.useFakeTimers();
        await controller.start();
        await mockAdapterEvents['deviceJoined']({networkAddress: 129, ieeeAddr: '0x129'});
        expect(controller.getDeviceByIeeeAddr('0x129')).toBe(controller.getDeviceByIeeeAddr('0x129'));
    });

    it('Device announce event', async () => {
        await controller.start();
        await mockAdapterEvents['deviceJoined']({networkAddress: 129, ieeeAddr: '0x129'});
        expect(events.deviceAnnounce.length).toBe(0);
        await mockAdapterEvents['deviceAnnounce']({networkAddress: 129, ieeeAddr: '0x129'});
        expect(events.deviceAnnounce.length).toBe(1);
        expect(events.deviceAnnounce[0].device).toBeInstanceOf(Device);
        expect(events.deviceAnnounce[0].device.ieeeAddr).toBe('0x129');
        expect(events.deviceAnnounce[0].device.modelID).toBe('myModelID');
    });

    it('Skip Device announce event from unknown device', async () => {
        await controller.start();
        await mockAdapterEvents['deviceAnnounce']({networkAddress: 12999, ieeeAddr: '0x12999'});
        expect(events.deviceAnnounce.length).toBe(0);
    });

    it('Device announce event should update network address when different', async () => {
        await controller.start();
        await mockAdapterEvents['deviceJoined']({networkAddress: 129, ieeeAddr: '0x129'});
        expect(events.deviceAnnounce.length).toBe(0);
        await mockAdapterEvents['deviceAnnounce']({networkAddress: 9999, ieeeAddr: '0x129'});
        expect(controller.getDeviceByIeeeAddr('0x129').networkAddress).toBe(9999);
        expect(controller.getDeviceByIeeeAddr('0x129').getEndpoint(1).deviceNetworkAddress).toBe(9999);
    });

    it('Device leave event and remove from database', async () => {
        await controller.start();
        await mockAdapterEvents['deviceJoined']({networkAddress: 129, ieeeAddr: '0x129'});
        expect(controller.getDeviceByIeeeAddr('0x129')).toBeInstanceOf(Device);
        expect(events.deviceLeave.length).toBe(0);
        await mockAdapterEvents['deviceLeave']({networkAddress: 129, ieeeAddr: '0x129'});
        expect(events.deviceLeave.length).toBe(1);
        expect(events.deviceLeave[0]).toStrictEqual({ieeeAddr: '0x129'});
        expect(controller.getDeviceByIeeeAddr('0x129')).toBeUndefined();

        // leaves another time when not in database
        await mockAdapterEvents['deviceLeave']({networkAddress: 129, ieeeAddr: '0x129'});
        expect(events.deviceLeave.length).toBe(2);
        expect(events.deviceLeave[1]).toStrictEqual({ieeeAddr: '0x129'});
    });

    it('Start with reset should clear database', async () => {
        await controller.start();
        await mockAdapterEvents['deviceJoined']({networkAddress: 129, ieeeAddr: '0x129'});
        await controller.createGroup(1);
        expect(controller.getGroupByID(1)).toBeInstanceOf(Group);
        expect(controller.getDeviceByIeeeAddr('0x129')).toBeInstanceOf(Device);
        expect((controller.getDevices()).length).toBe(2);
        expect(controller.getDevicesByType('Coordinator')[0].type).toBe('Coordinator');
        expect(controller.getDevicesByType('Coordinator')[0].ieeeAddr).toBe('0x123');
        expect(controller.getDevicesByType('Router')[0].ieeeAddr).toBe('0x129');
        expect(databaseContents().includes('0x129')).toBeTruthy()
        expect(databaseContents().includes('groupID')).toBeTruthy()
        await controller.stop();
        mockAdapterStart.mockReturnValueOnce("reset");
        await controller.start();
        expect((controller.getDevices()).length).toBe(1);
        expect(controller.getDevicesByType('Coordinator')[0].type).toBe('Coordinator');
        expect(controller.getDeviceByIeeeAddr('0x129')).toBeUndefined();
        expect(controller.getGroupByID(1)).toBeUndefined();
        // Items are marked as delete but still appear as lines in database, therefore we need to restart once
        // database will then remove deleted items.
        await controller.stop();
        await controller.start();
        expect(databaseContents().includes('0x129')).toBeFalsy();
        expect(databaseContents().includes('groupID')).toBeFalsy();
    });

    it('Should create backup of databse before clearing when datbaseBackupPath is provided', async () => {
        const databaseBackupPath = getTempFile('database.backup');
        if (fs.existsSync(databaseBackupPath)) fs.unlinkSync(databaseBackupPath);
        controller = new Controller({...options, databaseBackupPath});
        expect(fs.existsSync(databaseBackupPath)).toBeFalsy();
        await controller.start();
        await mockAdapterEvents['deviceJoined']({networkAddress: 129, ieeeAddr: '0x129'});
        await controller.createGroup(1);
        await controller.stop();
        mockAdapterStart.mockReturnValueOnce("reset");
        await controller.start();
        expect(fs.existsSync(databaseBackupPath)).toBeTruthy();
    });

    it('Controller permit joining', async () => {
        jest.useFakeTimers();
        await controller.start();
        await controller.permitJoin(true);
        expect(mockAdapterPermitJoin).toBeCalledTimes(1);
        expect(mockAdapterPermitJoin.mock.calls[0][0]).toBe(254);

        // Green power
        const commisionFrameEnable = mockZclFrame.create(1, 1, true, null, 2, 'commisioningMode', 33, {options: 0x0b, commisioningWindow: 254});
        expect(mocksendZclFrameToAll.mock.calls[0][0]).toBe(242);
        expect(deepClone(mocksendZclFrameToAll.mock.calls[0][1])).toStrictEqual(deepClone(commisionFrameEnable));
        expect(mocksendZclFrameToAll.mock.calls[0][2]).toBe(242);

        // should call it again ever +- 200 seconds
        jest.advanceTimersByTime(210 * 1000);
        expect(mockAdapterPermitJoin).toBeCalledTimes(2);
        expect(mockAdapterPermitJoin.mock.calls[1][0]).toBe(254);
        jest.advanceTimersByTime(210 * 1000);
        expect(mockAdapterPermitJoin).toBeCalledTimes(3);
        expect(mockAdapterPermitJoin.mock.calls[2][0]).toBe(254);

        // calling again shouldn't eanble it again.
        await controller.permitJoin(true);
        expect(mockAdapterPermitJoin).toBeCalledTimes(3);

        await controller.permitJoin(false);
        expect(mockAdapterPermitJoin).toBeCalledTimes(4);
        expect(mockAdapterPermitJoin.mock.calls[3][0]).toBe(0);
        jest.advanceTimersByTime(210 * 1000);
        expect(mockAdapterPermitJoin).toBeCalledTimes(4);

        // Green power
        const commisionFrameDisable = mockZclFrame.create(1, 1, true, null, 5, 'commisioningMode', 33, {options: 0x0b, commisioningWindow: 0});
        expect(mocksendZclFrameToAll.mock.calls[3][0]).toBe(242);
        expect(deepClone(mocksendZclFrameToAll.mock.calls[3][1])).toStrictEqual(deepClone(commisionFrameDisable));
        expect(mocksendZclFrameToAll.mock.calls[3][2]).toBe(242);
        expect(mocksendZclFrameToAll).toBeCalledTimes(4);
    });

    it('Controller permit joining through specific device', async () => {
        jest.useFakeTimers();
        await controller.start();
        await mockAdapterEvents['deviceJoined']({networkAddress: 129, ieeeAddr: '0x129'});
        await controller.permitJoin(true, controller.getDeviceByIeeeAddr('0x129'));
        expect(mockAdapterPermitJoin).toBeCalledTimes(1);
        expect(mockAdapterPermitJoin.mock.calls[0][0]).toBe(254);
        expect(mockAdapterPermitJoin.mock.calls[0][1]).toBe(129);

        jest.advanceTimersByTime(210 * 1000);
        expect(mockAdapterPermitJoin).toBeCalledTimes(2);
        expect(mockAdapterPermitJoin.mock.calls[1][0]).toBe(254);
        expect(mockAdapterPermitJoin.mock.calls[1][1]).toBe(129);
    });

    it('Shouldnt create backup when adapter doesnt support it', async () => {
        mockAdapterSupportsBackup.mockReturnValue(false);
        if (fs.existsSync(options.backupPath)) fs.unlinkSync(options.backupPath);
        await controller.start();
        await controller.stop();
        expect(fs.existsSync(options.backupPath)).toBeFalsy();
    });

    it('Soft reset', async () => {
        await controller.start();
        await controller.reset('soft');
        expect(mockAdapterReset).toBeCalledTimes(1);
        expect(mockAdapterReset).toHaveBeenCalledWith('soft');
    });

    it('Hard reset', async () => {
        await controller.start();
        await controller.reset('hard');
        expect(mockAdapterReset).toBeCalledTimes(1);
        expect(mockAdapterReset).toHaveBeenCalledWith('hard');
    });

    it('Device announce event', async () => {
        await controller.start();
        await mockAdapterEvents['disconnected']();
        expect(mockAdapterStop).toBeCalledTimes(1);
        expect(events.adapterDisconnected.length).toBe(1);
    });

    it('Device joins another time with different network address', async () => {
        await controller.start();
        await mockAdapterEvents['deviceJoined']({networkAddress: 129, ieeeAddr: '0x129'});
        await mockAdapterEvents['deviceJoined']({networkAddress: 129, ieeeAddr: '0x129'});
        expect(events.deviceJoined.length).toBe(1);
        expect(equalsPartial(events.deviceJoined[0].device, {ID: 2, networkAddress: 129, ieeeAddr: '0x129'})).toBeTruthy();
        expect((controller.getDeviceByIeeeAddr('0x129')).networkAddress).toBe(129);

        await mockAdapterEvents['deviceJoined']({networkAddress: 130, ieeeAddr: '0x129'});
        expect(events.deviceJoined.length).toBe(1);
        expect((controller.getDeviceByIeeeAddr('0x129')).networkAddress).toBe(130);
    });

    it('Device joins and interview succeeds', async () => {
        await controller.start();
        await mockAdapterEvents['deviceJoined']({networkAddress: 129, ieeeAddr: '0x129'});
        expect(events.deviceInterview.length).toBe(2);
        expect(events.deviceInterview[0].status).toBe('started')
        expect(events.deviceInterview[0].device._ieeeAddr).toBe('0x129')
        expect(events.deviceInterview[1].status).toBe('successful')
        expect(events.deviceInterview[1].device._ieeeAddr).toBe('0x129')
    });

    it('Device joins and interview fails', async () => {
        await controller.start();
        await mockAdapterEvents['deviceJoined']({networkAddress: 140, ieeeAddr: '0x140'});
        expect(events.deviceInterview.length).toBe(2);
        expect(events.deviceInterview[0].status).toBe('started')
        expect(events.deviceInterview[0].device._ieeeAddr).toBe('0x140')
        expect(events.deviceInterview[1].status).toBe('failed')
        expect(events.deviceInterview[1].device._ieeeAddr).toBe('0x140')
    });

    it('Device joins with endpoints [4,1], should read modelID from 1', async () => {
        await controller.start();
        await mockAdapterEvents['deviceJoined']({networkAddress: 161, ieeeAddr: '0x161'});
        expect(events.deviceInterview.length).toBe(2);
        expect(events.deviceInterview[0].status).toBe('started')
        expect(events.deviceInterview[0].device._ieeeAddr).toBe('0x161')
        expect(events.deviceInterview[1].status).toBe('successful')
        expect(events.deviceInterview[1].device._ieeeAddr).toBe('0x161');
        expect(events.deviceInterview[1].device._modelID).toBe('myDevice9123');
    });

    it('Device joins with endpoints [2,1], as 2 is the only endpoint supporting genBasic it should read modelID from that', async () => {
        await controller.start();
        await mockAdapterEvents['deviceJoined']({networkAddress: 162, ieeeAddr: '0x162'});
        expect(events.deviceInterview.length).toBe(2);
        expect(events.deviceInterview[0].status).toBe('started')
        expect(events.deviceInterview[0].device._ieeeAddr).toBe('0x162')
        expect(events.deviceInterview[1].status).toBe('successful')
        expect(events.deviceInterview[1].device._ieeeAddr).toBe('0x162');
        expect(events.deviceInterview[1].device._modelID).toBe('myDevice9124');
    });

    it('Device joins and interview iAs enrollment succeeds', async () => {
        await controller.start();
        skipWait = true;
        const event = mockAdapterEvents['deviceJoined']({networkAddress: 170, ieeeAddr: '0x170'});
        await event;
        expect(events.deviceInterview.length).toBe(2);
        expect(events.deviceInterview[0].status).toBe('started')
        expect(events.deviceInterview[0].device._ieeeAddr).toBe('0x170')
        expect(events.deviceInterview[1].status).toBe('successful')
        expect(events.deviceInterview[1].device._ieeeAddr).toBe('0x170');

        const write = mocksendZclFrameToEndpoint.mock.calls[10];
        expect(write[0]).toBe(170);
        expect(write[1]).toBe(1);
        expect(deepClone(write[2])).toStrictEqual({"Header":{"frameControl":{"reservedBits":0,"frameType":0,"direction":0,"disableDefaultResponse":true,"manufacturerSpecific":false},"transactionSequenceNumber":12,"manufacturerCode":null,"commandIdentifier":2},"Payload":[{"attrId":16,"attrData":"0x123","dataType":240}],"Cluster":getCluster(1280)});

        const enrollRsp = mocksendZclFrameToEndpoint.mock.calls[11];
        expect(enrollRsp[0]).toBe(170);
        expect(enrollRsp[1]).toBe(1);
        expect(deepClone(enrollRsp[2])).toStrictEqual({"Header":{"frameControl":{"reservedBits":0,"frameType":1,"direction":0,"disableDefaultResponse":true,"manufacturerSpecific":false},"transactionSequenceNumber":13,"manufacturerCode":null,"commandIdentifier":0},"Payload":{"enrollrspcode":0,"zoneid":23},"Cluster":getCluster(1280)});
    });

    it('Device joins and interview iAs enrollment fails', async () => {
        mockDevices['170'].attributes['1'].zoneState = 0;
        enroll170 = false;
        await controller.start();
        skipWait = true;
        await mockAdapterEvents['deviceJoined']({networkAddress: 170, ieeeAddr: '0x170'});
        expect(events.deviceInterview.length).toBe(2);
        expect(events.deviceInterview[0].status).toBe('started')
        expect(events.deviceInterview[0].device._ieeeAddr).toBe('0x170')
        expect(events.deviceInterview[1].status).toBe('failed')
        expect(events.deviceInterview[1].device._ieeeAddr).toBe('0x170');
    });

    it('Device joins, shouldnt enroll when already enrolled', async () => {
        await controller.start();
        iasZoneReadState170Count = 1;
        skipWait = true;
        await mockAdapterEvents['deviceJoined']({networkAddress: 170, ieeeAddr: '0x170'});
        expect(events.deviceInterview.length).toBe(2);
        expect(events.deviceInterview[0].status).toBe('started')
        expect(events.deviceInterview[0].device._ieeeAddr).toBe('0x170')
        expect(events.deviceInterview[1].status).toBe('successful')
        expect(events.deviceInterview[1].device._ieeeAddr).toBe('0x170');
        expect(mocksendZclFrameToEndpoint).toHaveBeenCalledTimes(10);
    });

    it('Receive zclData occupancy report', async () => {
        await controller.start();
        await mockAdapterEvents['deviceJoined']({networkAddress: 129, ieeeAddr: '0x129'});
        await mockAdapterEvents['zclData']({
            address: '0x129',
            frame: ZclFrame.fromBuffer(Zcl.Utils.getCluster("msOccupancySensing").ID, Buffer.from([24,169,10,0,0,24,1])),
            endpoint: 1,
            linkquality: 50,
            groupID: 1,
        });

        expect(events.message.length).toBe(1);
        const expected = {
            "cluster": "msOccupancySensing",
            "type":"attributeReport",
            "device":{
                "ID":2,
                "_ieeeAddr":"0x129",
                "_networkAddress":129,
                "_lastSeen": deepClone(Date.now()),
                "_endpoints":[
                    {
                    "ID":1,
                    "inputClusters":[
                        0,
                        1
                    ],
                    "outputClusters":[
                        2
                    ],
                    "_binds": [],
                    "deviceNetworkAddress":129,
                    "deviceIeeeAddress":"0x129",
                    "deviceID":5,
                    "profileID":99,
                    "clusters": {
                        "msOccupancySensing": {
                            "attributes": {
                                "occupancy": 1,
                            },
                        },
                      },
                    }
                ],
                "_type":"Router",
                "_manufacturerID":1212,
                "_manufacturerName":"KoenAndCo",
                "meta": {},
                "_powerSource":"Mains (single phase)",
                "_modelID":"myModelID",
                "_applicationVersion":2,
                "_stackVersion":101,
                "_zclVersion":1,
                "_hardwareVersion":3,
                "_dateCode":"201901",
                "_softwareBuildID":"1.01",
                "_interviewCompleted":true,
                "_interviewing":false
            },
            "endpoint":{
                "ID":1,
                "deviceID": 5,
                "inputClusters":[0,1],
                "outputClusters":[2],
                "deviceNetworkAddress":129,
                "deviceIeeeAddress":"0x129",
                "_binds": [],
                "profileID": 99,
                "clusters": {
                    "msOccupancySensing": {
                        "attributes": {
                            "occupancy": 1,
                        },
                    },
                },
            },
            "data":{
                "occupancy":1
            },
            "linkquality":50,
            "groupID":1,
            "meta": {
                "zclTransactionSequenceNumber": 169,
                "manufacturerCode": null,
                "frameControl": {
                    "reservedBits":0,
                    "direction": 1,
                    "disableDefaultResponse": true,
                    "frameType": 0,
                    "manufacturerSpecific": false,
                },
            },
         };
        expect(deepClone(events.message[0])).toStrictEqual(expected);
    });

    it('Receive raw data', async () => {
        await controller.start();
        mocksendZclFrameToAll.mockClear();
        await mockAdapterEvents['deviceJoined']({networkAddress: 129, ieeeAddr: '0x129'});
        await mockAdapterEvents['rawData']({
            clusterID: 9,
            address: 129,
            data: Buffer.from([0, 1, 2, 3]),
            frame: ZclFrame.fromBuffer(Zcl.Utils.getCluster("msOccupancySensing").ID, Buffer.from([24,169,10,0,0,24,1])),
            endpoint: 1,
            linkquality: 50,
            groupID: 1,
        });

        expect(events.message.length).toBe(1);
        const expected = {
            "cluster": "genAlarms",
            "type":"raw",
            "device":{
                "ID":2,
                "_ieeeAddr":"0x129",
                "_networkAddress":129,
                "_lastSeen": deepClone(Date.now()),
                "_endpoints":[
                    {
                    "ID":1,
                    "clusters": {},
                    "inputClusters":[
                        0,
                        1
                    ],
                    "outputClusters":[
                        2
                    ],
                    "deviceNetworkAddress":129,
                    "deviceIeeeAddress":"0x129",
                    "_binds": [],
                    "deviceID":5,
                    "profileID":99
                    }
                ],
                "_type":"Router",
                "_manufacturerID":1212,
                "_manufacturerName":"KoenAndCo",
                "meta": {},
                "_powerSource":"Mains (single phase)",
                "_modelID":"myModelID",
                "_applicationVersion":2,
                "_stackVersion":101,
                "_zclVersion":1,
                "_hardwareVersion":3,
                "_dateCode":"201901",
                "_softwareBuildID":"1.01",
                "_interviewCompleted":true,
                "_interviewing":false
            },
            "endpoint":{
                "clusters": {},
                "ID":1,
                "deviceID": 5,
                "inputClusters":[0, 1],
                "outputClusters":[2],
                "deviceNetworkAddress":129,
                "deviceIeeeAddress":"0x129",
                "_binds": [],
                "profileID": 99,
            },
            "data": {
                data: [0, 1, 2, 3],
                type: 'Buffer',
            },
            "linkquality":50,
            "groupID":1,
            "meta": {},
         };
        expect(deepClone(events.message[0])).toStrictEqual(expected);
    });

    it('Receive raw data from unknown cluster', async () => {
        await controller.start();
        await mockAdapterEvents['deviceJoined']({networkAddress: 129, ieeeAddr: '0x129'});
        await mockAdapterEvents['rawData']({
            clusterID: 99999999,
            address: 129,
            data: Buffer.from([0, 1, 2, 3]),
            frame: ZclFrame.fromBuffer(Zcl.Utils.getCluster("msOccupancySensing").ID, Buffer.from([24,169,10,0,0,24,1])),
            endpoint: 1,
            linkquality: 50,
            groupID: 1,
        });

        expect(events.message.length).toBe(1);
        const expected = {
            "cluster": 99999999,
            "type":"raw",
            "device":{
                "ID":2,
                "_ieeeAddr":"0x129",
                "_networkAddress":129,
                "_lastSeen": deepClone(Date.now()),
                "_endpoints":[
                    {
                    "ID":1,
                    "clusters": {},
                    "inputClusters":[
                        0,
                        1
                    ],
                    "outputClusters":[
                        2
                    ],
                    "deviceNetworkAddress":129,
                    "deviceIeeeAddress":"0x129",
                    "_binds": [],
                    "deviceID":5,
                    "profileID":99
                    }
                ],
                "_type":"Router",
                "_manufacturerID":1212,
                "_manufacturerName":"KoenAndCo",
                "meta": {},
                "_powerSource":"Mains (single phase)",
                "_modelID":"myModelID",
                "_applicationVersion":2,
                "_stackVersion":101,
                "_zclVersion":1,
                "_hardwareVersion":3,
                "_dateCode":"201901",
                "_softwareBuildID":"1.01",
                "_interviewCompleted":true,
                "_interviewing":false
            },
            "endpoint":{
                "clusters": {},
                "ID":1,
                "deviceID": 5,
                "inputClusters":[0, 1],
                "outputClusters":[2],
                "deviceNetworkAddress":129,
                "deviceIeeeAddress":"0x129",
                "_binds": [],
                "profileID": 99,
            },
            "data": {
                data: [0, 1, 2, 3],
                type: 'Buffer',
            },
            "linkquality":50,
            "groupID":1,
            "meta": {},
         };
        expect(deepClone(events.message[0])).toStrictEqual(expected);
    });

    it('Receive zclData from unkonwn device shouldnt emit anything', async () => {
        await controller.start();
        await mockAdapterEvents['deviceJoined']({networkAddress: 129, ieeeAddr: '0x129'});
        await mockAdapterEvents['zclData']({
            networkAddress: 130,
            frame: ZclFrame.fromBuffer(Zcl.Utils.getCluster("msOccupancySensing").ID, Buffer.from([24,169,10,0,0,24,1])),
            endpoint: 1,
            linkquality: 50,
            groupID: 1,
        });

        expect(events.message.length).toBe(0);
    });

    it('Receive readResponse from unknown endpoint', async () => {
        await controller.start();
        await mockAdapterEvents['deviceJoined']({networkAddress: 129, ieeeAddr: '0x129'});
        await mockAdapterEvents['zclData']({
            address: 129,
            frame: ZclFrame.fromBuffer(Zcl.Utils.getCluster("genBasic").ID, Buffer.from([8, 1, 1, 1, 0, 0, 32, 3])),
            endpoint: 3,
            linkquality: 52,
            groupID: undefined,
        });

        expect(events.message.length).toBe(1);
        const expected = {
            "cluster": "genBasic",
            "type":"readResponse",
            "device":{
               "ID":2,
               "_ieeeAddr":"0x129",
               "_lastSeen": deepClone(Date.now()),
               "_networkAddress":129,
               "_endpoints":[
                  {
                     "clusters": {},
                     "ID":1,
                     "inputClusters":[
                        0,
                        1
                     ],
                     "outputClusters":[
                        2
                     ],
                     "deviceNetworkAddress":129,
                     "deviceIeeeAddress":"0x129",
                     "_binds": [],
                     "deviceID":5,
                     "profileID":99
                  },
                  {
                     "ID":3,
                     "clusters": {
                        "genBasic": {
                          "attributes": {
                            "appVersion": 3,
                          },
                        },
                      },
                     "inputClusters":[

                     ],
                     "outputClusters":[

                     ],
                     "deviceNetworkAddress":129,
                     "deviceIeeeAddress":"0x129",
                     "_binds": [],
                  }
               ],
               "_type":"Router",
               "_manufacturerID":1212,
               "_manufacturerName":"KoenAndCo",
               "meta": {},
               "_powerSource":"Mains (single phase)",
               "_modelID":"myModelID",
               "_applicationVersion":2,
               "_stackVersion":101,
               "_zclVersion":1,
               "_hardwareVersion":3,
               "_dateCode":"201901",
               "_softwareBuildID":"1.01",
               "_interviewCompleted":true,
               "_interviewing":false
            },
            "endpoint":{
               "ID":3,
               "inputClusters":[

               ],
               "outputClusters":[

               ],
               "deviceNetworkAddress":129,
               "deviceIeeeAddress":"0x129",
               "_binds": [],
               "clusters": {
                  "genBasic": {
                    "attributes": {
                      "appVersion": 3,
                    },
                  },
                },
            },
            "data":{
               "appVersion":3
            },
            "linkquality":52,
            "meta": {
                "zclTransactionSequenceNumber": 1,
                "manufacturerCode": null,
                "frameControl": {
                    "reservedBits":0,
                    "direction": 1,
                    "disableDefaultResponse": false,
                    "frameType": 0,
                    "manufacturerSpecific": false,
                },
            },
         };
        expect(deepClone(events.message[0])).toStrictEqual(expected);
        expect((controller.getDeviceByIeeeAddr('0x129')).endpoints.length).toBe(2);
    });

    it('Receive cluster command', async () => {
        await controller.start();
        await mockAdapterEvents['deviceJoined']({networkAddress: 129, ieeeAddr: '0x129'});
        await mockAdapterEvents['zclData']({
            address: 129,
            frame: ZclFrame.fromBuffer(5, Buffer.from([0x05, 0x7c, 0x11, 0x1d, 0x07, 0x00, 0x01, 0x0d, 0x00])),
            endpoint: 1,
            linkquality: 19,
            groupID: 10,
        });

        expect(events.message.length).toBe(1);
        const expected = {
            "cluster": "genScenes",
            "type":"commandTradfriArrowSingle",
            "device":{
               "ID":2,
               "_lastSeen": deepClone(Date.now()),
               "_ieeeAddr":"0x129",
               "_networkAddress":129,
               "_endpoints":[
                  {
                     "ID":1,
                     "clusters": {},
                     "inputClusters":[
                        0,
                        1
                     ],
                     "outputClusters":[
                        2
                     ],
                     "deviceNetworkAddress":129,
                     "deviceIeeeAddress":"0x129",
                     "_binds": [],
                     "deviceID":5,
                     "profileID":99
                  }
               ],
               "_type":"Router",
               "_manufacturerID":1212,
               "_manufacturerName":"KoenAndCo",
               "meta": {},
               "_powerSource":"Mains (single phase)",
               "_modelID":"myModelID",
               "_applicationVersion":2,
               "_stackVersion":101,
               "_zclVersion":1,
               "_hardwareVersion":3,
               "_dateCode":"201901",
               "_softwareBuildID":"1.01",
               "_interviewCompleted":true,
               "_interviewing":false
            },
            "endpoint":{
               "ID":1,
               "clusters": {},
               "inputClusters":[
                  0,
                  1
               ],
               "outputClusters":[
                  2
               ],
               "deviceNetworkAddress":129,
               "deviceIeeeAddress":"0x129",
               "_binds": [],
               "deviceID":5,
               "profileID":99
            },
            "data":{
               "value":256,
               "value2":13
            },
            "linkquality":19,
            "groupID":10,
            "meta": {
                "zclTransactionSequenceNumber": 29,
                "manufacturerCode": 4476,
                "frameControl": {
                    "reservedBits":0,
                    "direction": 0,
                    "disableDefaultResponse": false,
                    "frameType": 1,
                    "manufacturerSpecific": true,
                },
            },
         };
        expect(deepClone(events.message[0])).toStrictEqual(expected);
    });

    it('Receive cluster command from unknown cluster', async () => {
        await controller.start();
        await mockAdapterEvents['deviceJoined']({networkAddress: 129, ieeeAddr: '0x129'});
        await mockAdapterEvents['zclData']({
            networkAddress: 129,
            frame: ZclFrame.create(1, 1, false, 4476, 29, 1, 5, {groupid: 1, sceneid: 1}),
            endpoint: 1,
            linkquality: 19,
            groupID: 10,
        });

        expect(events.message.length).toBe(0);
    });

    it('Receive zclData send default response', async () => {
        await controller.start();
        await mockAdapterEvents['deviceJoined']({networkAddress: 129, ieeeAddr: '0x129'});
        mocksendZclFrameToEndpoint.mockClear();
        await mockAdapterEvents['zclData']({
            address: 129,
            frame: ZclFrame.create(1, 1, false, 4476, 29, 1, 5, {groupid: 1, sceneid: 1}),
            endpoint: 1,
            linkquality: 19,
            groupID: 10,
        });

        expect(mocksendZclFrameToEndpoint).toBeCalledTimes(1);
        const call = mocksendZclFrameToEndpoint.mock.calls[0];
        expect(call[0]).toBe(129);
        expect(call[1]).toBe(1);
        expect(deepClone(call[2])).toStrictEqual({"Cluster": getCluster(5), "Header": {
            "commandIdentifier": 11, "frameControl":
            {"reservedBits": 0,"direction": 1, "disableDefaultResponse": true, "frameType": 0, "manufacturerSpecific": false},
            "manufacturerCode": null, "transactionSequenceNumber": 29},
            "Payload": {"cmdId": 1, "statusCode": 0}
        });
    });

    it('Receive zclData send default response fails should NOT attempt route discover when adapter does not support it', async () => {
        mockAdapterSupportsDiscoverRoute.mockReturnValueOnce(false);
        await controller.start();
        await mockAdapterEvents['deviceJoined']({networkAddress: 129, ieeeAddr: '0x129'});
        mocksendZclFrameToEndpoint.mockClear();
        mockDiscoverRoute.mockClear();
        mocksendZclFrameToEndpoint.mockRejectedValue("");
        await mockAdapterEvents['zclData']({
            address: 129,
            frame: ZclFrame.create(1, 1, false, 4476, 29, 1, 5, {groupid: 1, sceneid: 1}),
            endpoint: 1,
            linkquality: 19,
            groupID: 10,
        });

        expect(mockDiscoverRoute).toBeCalledTimes(0);
        expect(mocksendZclFrameToEndpoint).toBeCalledTimes(1);
    });

    it('Respond to genTime read', async () => {
        await controller.start();
        await mockAdapterEvents['deviceJoined']({networkAddress: 129, ieeeAddr: '0x129'});
        mocksendZclFrameToEndpoint.mockClear();
        await mockAdapterEvents['zclData']({
            address: 129,
            frame: ZclFrame.create(0, 0, true, null, 40, 0, 10, [{attrId: 0}, {attrId: 1}, {attrId: 7}, {attrId: 9}]),
            endpoint: 1,
            linkquality: 19,
            groupID: 10,
        });

        expect(mocksendZclFrameToEndpoint).toBeCalledTimes(1);
        expect(mocksendZclFrameToEndpoint.mock.calls[0][0]).toBe(129);
        expect(mocksendZclFrameToEndpoint.mock.calls[0][1]).toBe(1);
        const message = mocksendZclFrameToEndpoint.mock.calls[0][2];
        // attrId 9 is not supported by controller.ts therefore should not be in the response
        expect(message.Payload.length).toBe(3);
        expect(message.Payload[0].attrId).toBe(0);
        expect(message.Payload[0].dataType).toBe(226);
        expect(message.Payload[0].status).toBe(0);
        expect(message.Payload[0].attrData).toBeGreaterThan(600822353);
        expect(message.Payload[1].attrId).toBe(1);
        expect(message.Payload[1].dataType).toBe(24);
        expect(message.Payload[1].status).toBe(0);
        expect(message.Payload[1].attrData).toBe(3);
        expect(message.Payload[2].attrId).toBe(7);
        expect(message.Payload[2].dataType).toBe(35);
        expect(message.Payload[2].status).toBe(0);
        expect(message.Payload[2].attrData).toBeGreaterThan(600822353);
        delete message.Payload;
        const call = mocksendZclFrameToEndpoint.mock.calls[0];
        expect(call[0]).toBe(129);
        expect(call[1]).toBe(1);
        expect(deepClone(call[2])).toStrictEqual({"Cluster": getCluster(10), "Header": {
            "commandIdentifier": 1, "frameControl":
            {"reservedBits": 0, "direction": 1, "disableDefaultResponse": true, "frameType": 0, "manufacturerSpecific": false},
            "manufacturerCode": null, "transactionSequenceNumber": 40}
        });
    });

    it('Respond to genTime read fails', async () => {
        await controller.start();
        await mockAdapterEvents['deviceJoined']({networkAddress: 129, ieeeAddr: '0x129'});
        mocksendZclFrameToEndpoint.mockClear();
        mocksendZclFrameToEndpoint.mockRejectedValueOnce(new Error(""));
        await mockAdapterEvents['zclData']({
            address: 129,
            frame: ZclFrame.create(0, 0, true, null, 40, 0, 10, [{attrId: 0}]),
            endpoint: 1,
            linkquality: 19,
            groupID: 10,
        });

        expect(mocksendZclFrameToEndpoint).toBeCalledTimes(1);
    });

    it('Xiaomi WXCJKG11LM join (get simple descriptor for endpoint 2 fails)', async () => {
        // https://github.com/koenkk/zigbee2mqtt/issues/2844
        await controller.start();
        await mockAdapterEvents['deviceJoined']({networkAddress: 171, ieeeAddr: '0x171'});
        expect(events.deviceInterview.length).toBe(2);
        expect(events.deviceInterview[0].status).toBe('started')
        expect(events.deviceInterview[0].device._ieeeAddr).toBe('0x171')
        expect(events.deviceInterview[1].status).toBe('successful')
        expect(events.deviceInterview[1].device._ieeeAddr).toBe('0x171')
        expect(controller.getDeviceByIeeeAddr('0x171').modelID).toBe('lumi.remote.b286opcn01')
    });

    it('Gledopto GL-C-007/GL-C-008 join (all endpoints support genBasic but only 12 responds)', async () => {
        //  - https://github.com/Koenkk/zigbee2mqtt/issues/2872
        await controller.start();
        await mockAdapterEvents['deviceJoined']({networkAddress: 172, ieeeAddr: '0x172'});
        expect(events.deviceInterview.length).toBe(2);
        expect(events.deviceInterview[0].status).toBe('started')
        expect(events.deviceInterview[0].device._ieeeAddr).toBe('0x172')
        expect(events.deviceInterview[1].status).toBe('successful')
        expect(events.deviceInterview[1].device._ieeeAddr).toBe('0x172')
        expect(controller.getDeviceByIeeeAddr('0x172').modelID).toBe('GL-C-008')
    });

    it('Xiaomi end device joins (node descriptor fails)', async () => {
        await controller.start();
        await mockAdapterEvents['deviceJoined']({networkAddress: 150, ieeeAddr: '0x150'});
        expect(events.deviceInterview.length).toBe(2);
        expect(events.deviceInterview[0].status).toBe('started')
        expect(events.deviceInterview[0].device._ieeeAddr).toBe('0x150')
        expect(events.deviceInterview[1].status).toBe('successful')
        expect(events.deviceInterview[1].device._ieeeAddr).toBe('0x150')
        expect(deepClone(controller.getDeviceByIeeeAddr('0x150'))).toStrictEqual(
            {
                "ID":2,
                "_ieeeAddr":"0x150",
                "_networkAddress":150,
                "_lastSeen": deepClone(Date.now()),
                "_endpoints":[
                   {
                      "ID":1,
                      "clusters": {
                          "genBasic": {
                            "attributes": {
                              "modelId": "lumi.occupancy",
                            },
                          },
                      },
                      "inputClusters":[
                      ],
                      "outputClusters":[

                      ],
                      "deviceNetworkAddress":150,
                      "deviceIeeeAddress":"0x150",
                      "_binds": [],
                   }
                ],
                "_type":"EndDevice",
                "_manufacturerID":4151,
                "_manufacturerName":"LUMI",
                "meta": {},
                "_powerSource":"Battery",
                "_modelID":"lumi.occupancy",
                "_interviewCompleted":true,
                "_interviewing":false
             }
        );
    });

    it('Xiaomi end device joins (node descriptor succeeds, but active endpoint response fails)', async () => {
        await controller.start();
        await mockAdapterEvents['deviceJoined']({networkAddress: 151, ieeeAddr: '0x151'});
        expect(events.deviceInterview.length).toBe(2);
        expect(events.deviceInterview[0].status).toBe('started')
        expect(events.deviceInterview[0].device._ieeeAddr).toBe('0x151')
        expect(events.deviceInterview[1].status).toBe('successful')
        expect(events.deviceInterview[1].device._ieeeAddr).toBe('0x151')
        expect(deepClone(controller.getDeviceByIeeeAddr('0x151'))).toStrictEqual(
            {
                "ID":2,
                "_ieeeAddr":"0x151",
                "_networkAddress":151,
                "_lastSeen": deepClone(Date.now()),
                "_endpoints":[
                   {
                      "ID":1,
                      "clusters": {
                          "genBasic": {
                            "attributes": {
                              "modelId": "lumi.occupancy",
                            },
                          },
                      },
                      "inputClusters":[

                      ],
                      "outputClusters":[

                      ],
                      "deviceNetworkAddress":151,
                      "deviceIeeeAddress":"0x151",
                      "_binds": [],
                   }
                ],
                "_type":"EndDevice",
                "_manufacturerID":1219,
                "_manufacturerName":"LUMI",
                "meta": {},
                "_powerSource":"Battery",
                "_modelID":"lumi.occupancy",
                "_interviewCompleted":true,
                "_interviewing":false
             }
        );
    });

    it('Receive zclData report from unkown attribute', async () => {
        await controller.start();
        await mockAdapterEvents['deviceJoined']({networkAddress: 129, ieeeAddr: '0x129'});
        const buffer = [28,95,17,3,10,5,0,66,21,108,117,109,105,46,115,101,110,115,111,114,95,119,108,101,97,107,46,97,113,49,1,255,66,34,1,33,213,12,3,40,33,4,33,168,19,5,33,43,0,6,36,0,0,5,0,0,8,33,4,2,10,33,0,0,100,16,0];
        await mockAdapterEvents['zclData']({
            address: 129,
            frame: ZclFrame.fromBuffer(Zcl.Utils.getCluster("genBasic").ID, Buffer.from(buffer)),
            endpoint: 1,
            linkquality: 50,
            groupID: 1,
        });

        expect(events.message.length).toBe(1);
        const expected = {
            "cluster": 'genBasic',
            "type":"attributeReport",
            "device":{
                "_lastSeen": deepClone(Date.now()),
                "ID":2,
                "_ieeeAddr":"0x129",
                "_networkAddress":129,
                "_endpoints":[
                    {
                    "ID":1,
                    "clusters": {
                        "genBasic": {
                            "attributes": {
                                "65281": {
                                "1": 3285,
                                "10": 0,
                                "100": 0,
                                "3": 33,
                                "4": 5032,
                                "5": 43,
                                "6": [
                                    0,
                                    327680,
                                ],
                                "8": 516,
                                },
                                "modelId": "lumi.sensor_wleak.aq1",
                            },
                        },
                    },
                    "inputClusters":[
                        0,
                        1
                    ],
                    "outputClusters":[
                        2
                    ],
                    "deviceNetworkAddress":129,
                    "deviceIeeeAddress":"0x129",
                    "_binds": [],
                    "deviceID":5,
                    "profileID":99
                    }
                ],
                "_type":"Router",
                "_manufacturerID":1212,
                "_manufacturerName":"KoenAndCo",
                "meta": {},
                "_powerSource":"Mains (single phase)",
                "_modelID":"myModelID",
                "_applicationVersion":2,
                "_stackVersion":101,
                "_zclVersion":1,
                "_hardwareVersion":3,
                "_dateCode":"201901",
                "_softwareBuildID":"1.01",
                "_interviewCompleted":true,
                "_interviewing":false
            },
            "endpoint":{
                "ID":1,
                "deviceID": 5,
                "inputClusters":[0, 1],
                "outputClusters":[2],
                "deviceNetworkAddress":129,
                "deviceIeeeAddress":"0x129",
                "_binds": [],
                "profileID": 99,
                "clusters": {
                    "genBasic": {
                        "attributes": {
                            "65281": {
                            "1": 3285,
                            "10": 0,
                            "100": 0,
                            "3": 33,
                            "4": 5032,
                            "5": 43,
                            "6": [
                                0,
                                327680,
                            ],
                            "8": 516,
                            },
                            "modelId": "lumi.sensor_wleak.aq1",
                        },
                    },
                },
            },
            "data":{ '65281':{
                '1': 3285,
                '3': 33,
                '4': 5032,
                '5': 43,
                '6': [ 0, 327680 ],
                '8': 516,
                '10': 0,
                '100': 0 },
                modelId: 'lumi.sensor_wleak.aq1'
            },
            "linkquality":50,
            "groupID":1,
            "meta": {
                "zclTransactionSequenceNumber": 3,
                "manufacturerCode": 4447,
                "frameControl": {
                    "reservedBits": 0,
                    "direction": 1,
                    "disableDefaultResponse": true,
                    "frameType": 0,
                    "manufacturerSpecific": true,
                },
            },
         };
        expect(deepClone(events.message[0])).toStrictEqual(expected);
    });

    it('Should roll-over transaction ID', async () => {
        await controller.start();
        await mockAdapterEvents['deviceJoined']({networkAddress: 129, ieeeAddr: '0x129'});
        mocksendZclFrameToEndpoint.mockClear();
        const device = controller.getDeviceByIeeeAddr('0x129');
        const endpoint = device.getEndpoint(1);
        expect(endpoint.supportsOutputCluster("genDeviceTempCfg")).toBeTruthy();
        expect(endpoint.supportsOutputCluster("genBasic")).toBeFalsy();
        for (let i = 0; i < 300; i++) {
            await endpoint.read('genBasic', ['modelId']);
        }
        expect(mocksendZclFrameToEndpoint).toBeCalledTimes(300);

        const ids = [];
        for (let i = 0; i < 300; i++) {
            ids.push(mocksendZclFrameToEndpoint.mock.calls[i][2].Header.transactionSequenceNumber);
        }

        expect(ids.includes(255)).toBeTruthy();
        expect(ids.includes(256)).toBeFalsy();
    });

    it('Throw error when creating endpoint which already exists', async () => {
        await controller.start();
        await mockAdapterEvents['deviceJoined']({networkAddress: 129, ieeeAddr: '0x129'});
        const device = controller.getDeviceByIeeeAddr('0x129');
        let error;
        try {await device.createEndpoint(1)} catch (e) {error = e}
        expect(error).toStrictEqual(new Error("Device '0x129' already has an endpoint '1'"));
    });

    it('Throw error when device with ieeeAddr already exists', async () => {
        await controller.start();
        await mockAdapterEvents['deviceJoined']({networkAddress: 140, ieeeAddr: '0x129'});
        let error;
        try {await Device.create('Router', '0x129', 140, null, null, null, null, null)} catch (e) {error = e}
        expect(error).toStrictEqual(new Error("Device with ieeeAddr '0x129' already exists"));
    });

    it('Return device from databse when not in lookup', async () => {
        await controller.start();
        await mockAdapterEvents['deviceJoined']({networkAddress: 140, ieeeAddr: '0x129'});
        Device['lookup'] = {};
        expect(controller.getDeviceByIeeeAddr('0x129')).toBeInstanceOf(Device);
    });

    it('Throw error when interviewing and calling interview again', async () => {
        await controller.start();
        await mockAdapterEvents['deviceJoined']({networkAddress: 140, ieeeAddr: '0x129'});
        const device = controller.getDeviceByIeeeAddr('0x129');
        const firstInterview = device.interview()
        let error;
        try {await device.interview()} catch (e) {error = e}
        expect(error).toStrictEqual(new Error("Interview - interview already in progress for '0x129'"));
        try {await firstInterview} catch (e) {}
    });

    it('Remove device from network', async () => {
        await controller.start();
        await mockAdapterEvents['deviceJoined']({networkAddress: 140, ieeeAddr: '0x140'});
        const device = controller.getDeviceByIeeeAddr('0x140');
        await device.removeFromNetwork();
        expect(mockAdapterRemoveDevice).toBeCalledTimes(1);
        expect(mockAdapterRemoveDevice).toBeCalledWith(140, '0x140');
        expect(controller.getDeviceByIeeeAddr('0x140')).toBeUndefined();
        // shouldn't throw when removing from database when not in
        await device.removeFromDatabase();
    });

    it('Remove group from network', async () => {
        await controller.start();
        await mockAdapterEvents['deviceJoined']({networkAddress: 129, ieeeAddr: '0x129'});
        const device = controller.getDeviceByIeeeAddr('0x129');
        const group = await controller.createGroup(4);
        const endpoint = device.getEndpoint(1);
        await endpoint.addToGroup(group);
        mocksendZclFrameToEndpoint.mockClear();

        await group.removeFromNetwork();

        expect(mocksendZclFrameToEndpoint).toHaveBeenCalledTimes(1);
        const call = mocksendZclFrameToEndpoint.mock.calls[0];
        expect(call[0]).toBe(129);
        expect(call[1]).toBe(1);
        expect(deepClone(call[2])).toStrictEqual({"Cluster": getCluster(4), "Header": {"commandIdentifier": 3, "frameControl": {"reservedBits": 0,"direction": 0, "disableDefaultResponse": true, "frameType": 1, "manufacturerSpecific": false}, "manufacturerCode": null, "transactionSequenceNumber": 12}, "Payload": {groupid: 4}});
    });

    it('Remove group from database', async () => {
        await controller.start();
        const group = await controller.createGroup(4);
        await group.removeFromDatabase();
        expect(controller.getGroupByID(4)).toStrictEqual(undefined);
        // shouldn't throw when removing from database when not in
        await group.removeFromDatabase();
    });

    it('Device lqi', async () => {
        await controller.start();
        await mockAdapterEvents['deviceJoined']({networkAddress: 140, ieeeAddr: '0x140'});
        const device = controller.getDeviceByIeeeAddr('0x140');
        const result = await device.lqi();
        expect(result).toStrictEqual({neighbors: [
            {ieeeAddr: '0x160', networkAddress: 160, linkquality: 20, relationship: 2, depth: 5},
            {ieeeAddr: '0x170', networkAddress: 170, linkquality: 21, relationship: 4, depth: 8},
        ]});
    });

    it('Device routing table', async () => {
        await controller.start();
        await mockAdapterEvents['deviceJoined']({networkAddress: 140, ieeeAddr: '0x140'});
        const device = controller.getDeviceByIeeeAddr('0x140');
        const result = await device.routingTable();
        expect(result).toStrictEqual({table: [
            {destinationAddress: 120, status: 'SUCCESS', nextHop: 1},
            {destinationAddress: 130, status: 'FAILED', nextHop: 2},
        ]});
    });

    it('Device ping', async () => {
        await controller.start();
        await mockAdapterEvents['deviceJoined']({networkAddress: 129, ieeeAddr: '0x129'});
        const device = controller.getDeviceByIeeeAddr('0x129');
        mocksendZclFrameToEndpoint.mockClear();
        const result = await device.ping();
        expect(mocksendZclFrameToEndpoint).toBeCalledTimes(1);
        const call = mocksendZclFrameToEndpoint.mock.calls[0];
        expect(call[0]).toBe(129);
        expect(call[1]).toBe(1);
        expect(deepClone(call[2])).toStrictEqual({"Cluster": getCluster(0), "Header": {"commandIdentifier": 0, "frameControl": {"reservedBits": 0, "direction": 0, "disableDefaultResponse": true, "frameType": 0, "manufacturerSpecific": false}, "manufacturerCode": null, "transactionSequenceNumber": 11}, "Payload": [{"attrId": 0}]});
    });

    it('Endpoint get id', async () => {
        await controller.start();
        await mockAdapterEvents['deviceJoined']({networkAddress: 129, ieeeAddr: '0x129'});
        const device = controller.getDeviceByIeeeAddr('0x129');
        expect(device.getEndpoint(1).ID).toBe(1);
    });

    it('Endpoint get id by endpoint device type', async () => {
        await controller.start();
        await mockAdapterEvents['deviceJoined']({networkAddress: 172, ieeeAddr: '0x172'});
        const device = controller.getDeviceByIeeeAddr('0x172');
        expect(device.getEndpointByDeviceType('ZLLOnOffPluginUnit')).toBeUndefined();
        expect(device.getEndpointByDeviceType('ZLLExtendedColorLight').ID).toBe(11);
    });

    it('Endpoint bind', async () => {
        await controller.start();
        skipWait = true;
        await mockAdapterEvents['deviceJoined']({networkAddress: 129, ieeeAddr: '0x129'});
        await mockAdapterEvents['deviceJoined']({networkAddress: 170, ieeeAddr: '0x170'});
        const device = controller.getDeviceByIeeeAddr('0x129');
        const target = controller.getDeviceByIeeeAddr('0x170').getEndpoint(1);
        const endpoint = device.getEndpoint(1);
        await endpoint.bind('genBasic', target);
        expect(deepClone(endpoint.binds)).toStrictEqual(deepClone([{cluster: Zcl.Utils.getCluster(0), target}]));
        expect(mockAdapterBind).toBeCalledWith(129, "0x129", 1, 0, "0x170", "endpoint", 1);

        // Should bind another time but not add it to the binds
        mockAdapterBind.mockClear();
        await endpoint.bind('genBasic', target);
        expect(deepClone(endpoint.binds)).toStrictEqual(deepClone([{cluster: Zcl.Utils.getCluster(0), target}]));
        expect(mockAdapterBind).toBeCalledWith(129, "0x129", 1, 0, "0x170", "endpoint", 1);
    });

    it('Endpoint get binds non-existing device', async () => {
        await controller.start();
        await mockAdapterEvents['deviceJoined']({networkAddress: 129, ieeeAddr: '0x129'});
        const device = controller.getDeviceByIeeeAddr('0x129');
        const endpoint = device.getEndpoint(1);
        endpoint._binds.push({type: 'endpoint', deviceIeeeAddress: 'notexisting', endpointID: 1, cluster: 2});
        expect(deepClone(endpoint.binds)).toStrictEqual(deepClone([{cluster: Zcl.Utils.getCluster(2), target: null}]));
    });

    it('Group bind', async () => {
        await controller.start();
        await mockAdapterEvents['deviceJoined']({networkAddress: 129, ieeeAddr: '0x129'});
        const group = await controller.createGroup(4);
        const device = controller.getDeviceByIeeeAddr('0x129');
        const endpoint = device.getEndpoint(1);
        await endpoint.bind('genPowerCfg', group);
        expect(deepClone(endpoint.binds)).toStrictEqual(deepClone([{cluster: Zcl.Utils.getCluster(1), target: group}]));
        expect(mockAdapterBind).toBeCalledWith(129, "0x129", 1, 1, 4, "group", null);
    });

    it('Group bind by number', async () => {
        await controller.start();
        await mockAdapterEvents['deviceJoined']({networkAddress: 129, ieeeAddr: '0x129'});
        const device = controller.getDeviceByIeeeAddr('0x129');
        const endpoint = device.getEndpoint(1);
        await endpoint.bind('genPowerCfg', 11);
        expect(deepClone(endpoint.binds)).toStrictEqual([]);
        expect(mockAdapterBind).toBeCalledWith(129, "0x129", 1, 1, 11, "group", null);
    });

    it('Endpoint unbind', async () => {
        await controller.start();
        skipWait = true;
        await mockAdapterEvents['deviceJoined']({networkAddress: 129, ieeeAddr: '0x129'});
        await mockAdapterEvents['deviceJoined']({networkAddress: 170, ieeeAddr: '0x170'});
        const device = controller.getDeviceByIeeeAddr('0x129');
        const target = controller.getDeviceByIeeeAddr('0x170').getEndpoint(1);
        const endpoint = device.getEndpoint(1);
        await endpoint.bind('genBasic', target);
        mockAdapterBind.mockClear();
        await endpoint.unbind('genBasic', target);
        expect(endpoint.binds).toStrictEqual([]);
        expect(mockAdapterUnbind).toBeCalledWith(129, "0x129", 1, 0, "0x170", "endpoint", 1);

        // Should unbind another time when not in binds
        mockAdapterBind.mockClear();
        await endpoint.unbind('genBasic', target);
        expect(endpoint.binds).toStrictEqual([]);
        expect(mockAdapterUnbind).toBeCalledWith(129, "0x129", 1, 0, "0x170", "endpoint", 1);
    });

    it('Group unbind', async () => {
        await controller.start();
        await mockAdapterEvents['deviceJoined']({networkAddress: 129, ieeeAddr: '0x129'});
        const group = await controller.createGroup(5);
        const device = controller.getDeviceByIeeeAddr('0x129');
        const endpoint = device.getEndpoint(1);
        await endpoint.unbind('genPowerCfg', group);
        expect(mockAdapterUnbind).toBeCalledWith(129, "0x129", 1, 1, 5, "group", null);
    });

    it('Group unbind by number', async () => {
        await controller.start();
        await mockAdapterEvents['deviceJoined']({networkAddress: 129, ieeeAddr: '0x129'});
        const device = controller.getDeviceByIeeeAddr('0x129');
        const endpoint = device.getEndpoint(1);
        await endpoint.unbind('genPowerCfg', 9);
        expect(mockAdapterUnbind).toBeCalledWith(129, "0x129", 1, 1, 9, "group", null);
    });

    it('Endpoint configure reporting', async () => {
        await controller.start();
        await mockAdapterEvents['deviceJoined']({networkAddress: 129, ieeeAddr: '0x129'});
        const device = controller.getDeviceByIeeeAddr('0x129');
        const endpoint = device.getEndpoint(1);
        mocksendZclFrameToEndpoint.mockClear();
        await endpoint.configureReporting('genPowerCfg', [{
            attribute: 'mainsFrequency',
            minimumReportInterval: 1,
            maximumReportInterval: 10,
            reportableChange: 1,
        }])

        const call = mocksendZclFrameToEndpoint.mock.calls[0];
        expect(call[0]).toBe(129);
        expect(call[1]).toBe(1)
        expect(deepClone(call[2])).toStrictEqual({
            "Header":{
               "frameControl":{
                  "reservedBits": 0,
                  "frameType":0,
                  "direction":0,
                  "disableDefaultResponse":true,
                  "manufacturerSpecific":false
               },
               "transactionSequenceNumber":11,
               "manufacturerCode":null,
               "commandIdentifier":6
            },
            "Payload":[
               {
                  "direction":0,
                  "attrId":1,
                  "dataType":32,
                  "minRepIntval":1,
                  "maxRepIntval":10,
                  "repChange":1
               }
            ],
            "Cluster":getCluster(1)
         });
    });

    it('Endpoint configure reporting fails when status code is not 0', async () => {
        configureReportStatus = 1;
        await controller.start();
        await mockAdapterEvents['deviceJoined']({networkAddress: 129, ieeeAddr: '0x129'});
        const device = controller.getDeviceByIeeeAddr('0x129');
        const endpoint = device.getEndpoint(1);
        mocksendZclFrameToEndpoint.mockClear();
        let error;
        try {
            await endpoint.configureReporting('genPowerCfg', [{
                attribute: 'mainsFrequency',
                minimumReportInterval: 1,
                maximumReportInterval: 10,
                reportableChange: 1,
            }]);
        }
        catch (e) {
            error = e;
        }
        expect(error instanceof Zcl.ZclStatusError).toBeTruthy();
        expect(error.message).toStrictEqual(`ConfigureReporting 0x129/1 genPowerCfg([{"attribute":"mainsFrequency","minimumReportInterval":1,"maximumReportInterval":10,"reportableChange":1}], {"timeout":10000,"disableResponse":false,"disableDefaultResponse":true,"direction":0,"srcEndpoint":null,"reservedBits":0,"manufacturerCode":null,"transactionSequenceNumber":null}) failed (Status 'FAILURE')`);
        expect(error.code).toBe(1);
    });

    it('Endpoint configure reporting with disable response', async () => {
        configureReportStatus = 1;
        await controller.start();
        await mockAdapterEvents['deviceJoined']({networkAddress: 129, ieeeAddr: '0x129'});
        const device = controller.getDeviceByIeeeAddr('0x129');
        const endpoint = device.getEndpoint(1);
        mocksendZclFrameToEndpoint.mockReturnValueOnce(null);
        let error;
        try {
            await endpoint.configureReporting('genPowerCfg', [{
                attribute: 'mainsFrequency',
                minimumReportInterval: 1,
                maximumReportInterval: 10,
                reportableChange: 1,
            }], {disableResponse: true});
        }
        catch (e) {
            error = e;
        }
        expect(error).toBeUndefined();
    });

    it('Return group from databse when not in lookup', async () => {
        await controller.start();
        await controller.createGroup(2);
        Group['lookup'] = {};
        expect(controller.getGroupByID(2)).toBeInstanceOf(Group);
    });

    it('Throw error when creating group already exists', async () => {
        await controller.start();
        await controller.createGroup(2);
        let error;
        try {await controller.createGroup(2)} catch (e) {error = e}
        expect(error).toStrictEqual(new Error("Group with groupID '2' already exists"));
    });

    it('Add endpoint to group', async () => {
        await controller.start();
        await mockAdapterEvents['deviceJoined']({networkAddress: 129, ieeeAddr: '0x129'});
        const device = controller.getDeviceByIeeeAddr('0x129');
        const endpoint = device.getEndpoint(1);
        const group = await controller.createGroup(2);
        mocksendZclFrameToEndpoint.mockClear();
        await endpoint.addToGroup(group);
        const call = mocksendZclFrameToEndpoint.mock.calls[0];
        expect(call[0]).toBe(129);
        expect(call[1]).toBe(1);
        expect(deepClone(call[2])).toStrictEqual({"Cluster": getCluster(4), "Header": {"commandIdentifier": 0, "frameControl": {"reservedBits": 0,"direction": 0, "disableDefaultResponse": true, "frameType": 1, "manufacturerSpecific": false}, "manufacturerCode": null, "transactionSequenceNumber": 11}, "Payload": {groupid: 2, groupname: ''}});
        expect(group.members).toContain(endpoint);
        expect(databaseContents()).toContain(`{"id":1,"type":"Coordinator","ieeeAddr":"0x123","nwkAddr":123,"manufId":100,"epList":[1,2],"endpoints":{"1":{"profId":2,"epId":1,"devId":3,"inClusterList":[10],"outClusterList":[11],"clusters":{},"binds":[]},"2":{"profId":3,"epId":2,"devId":5,"inClusterList":[1],"outClusterList":[0],"clusters":{},"binds":[]}},"interviewCompleted":true,"meta":{},"lastSeen":null}\n{"id":2,"type":"Router","ieeeAddr":"0x129","nwkAddr":129,"manufId":1212,"manufName":"KoenAndCo","powerSource":"Mains (single phase)","modelId":"myModelID","epList":[1],"endpoints":{"1":{"profId":99,"epId":1,"devId":5,"inClusterList":[0,1],"outClusterList":[2],"clusters":{},"binds":[]}},"appVersion":2,"stackVersion":101,"hwVersion":3,"dateCode":"201901","swBuildId":"1.01","zclVersion":1,"interviewCompleted":true,"meta":{},"lastSeen":150}\n{"id":3,"type":"Group","groupID":2,"members":[{"deviceIeeeAddr":"0x129","endpointID":1}],"meta":{}}`);
    });

    it('Remove endpoint from group', async () => {
        await controller.start();
        await mockAdapterEvents['deviceJoined']({networkAddress: 129, ieeeAddr: '0x129'});
        const device = controller.getDeviceByIeeeAddr('0x129');
        const endpoint = device.getEndpoint(1);
        const group = await controller.createGroup(2);
        await group.addMember(endpoint);
        mocksendZclFrameToEndpoint.mockClear();
        await endpoint.removeFromGroup(group);
        const call = mocksendZclFrameToEndpoint.mock.calls[0];
        expect(call[0]).toBe(129);
        expect(call[1]).toBe(1);
        expect(deepClone(call[2])).toStrictEqual({"Cluster": getCluster(4), "Header": {"commandIdentifier": 3, "frameControl": {"reservedBits": 0,"direction": 0, "disableDefaultResponse": true, "frameType": 1, "manufacturerSpecific": false}, "manufacturerCode": null, "transactionSequenceNumber": 11}, "Payload": {groupid: 2}});
        expect(group.members).toStrictEqual([]);
    });

    it('Remove endpoint from group by number', async () => {
        await controller.start();
        await mockAdapterEvents['deviceJoined']({networkAddress: 129, ieeeAddr: '0x129'});
        const device = controller.getDeviceByIeeeAddr('0x129');
        const endpoint = device.getEndpoint(1);
        mocksendZclFrameToEndpoint.mockClear();
        await endpoint.removeFromGroup(4);
        const call = mocksendZclFrameToEndpoint.mock.calls[0];
        expect(call[0]).toBe(129);
        expect(call[1]).toBe(1);
        expect(deepClone(call[2])).toStrictEqual({"Cluster": getCluster(4), "Header": {"commandIdentifier": 3, "frameControl": {"reservedBits": 0,"direction": 0, "disableDefaultResponse": true, "frameType": 1, "manufacturerSpecific": false}, "manufacturerCode": null, "transactionSequenceNumber": 11}, "Payload": {groupid: 4}});
    });

    it('Group command', async () => {
        await controller.start();
        const group = await controller.createGroup(2);
        await group.command('genOnOff', 'offWithEffect', {effectid: 9, effectvariant: 10});
        const call = mocksendZclFrameToGroup.mock.calls[0];
        expect(call[0]).toBe(2);
        expect(deepClone(call[1])).toStrictEqual({"Header":{"frameControl":{"reservedBits": 0,"frameType":1,"direction":0,"disableDefaultResponse":true,"manufacturerSpecific":false},"transactionSequenceNumber":2,"manufacturerCode":null,"commandIdentifier":64},"Payload":{"effectid":9,"effectvariant":10},"Cluster":getCluster(6)});
    });

    it('Endpoint command with options', async () => {
        await controller.start();
        await mockAdapterEvents['deviceJoined']({networkAddress: 129, ieeeAddr: '0x129'});
        const device = controller.getDeviceByIeeeAddr('0x129');
        const endpoint = device.getEndpoint(1);
        mocksendZclFrameToEndpoint.mockClear();
        await endpoint.command('genOnOff', 'off', {}, {manufacturerCode: 100, disableDefaultResponse: true})
        expect(mocksendZclFrameToEndpoint.mock.calls[0][0]).toBe(129);
        expect(mocksendZclFrameToEndpoint.mock.calls[0][1]).toBe(1);
        const expected = {"Header":{"frameControl":{"reservedBits": 0,"frameType":1,"direction":0,"disableDefaultResponse":true,"manufacturerSpecific":true},"transactionSequenceNumber":11,"manufacturerCode":100,"commandIdentifier":0},"Payload":{},"Cluster":getCluster(6)};
        expect(deepClone(mocksendZclFrameToEndpoint.mock.calls[0][2])).toStrictEqual(expected);
        expect(mocksendZclFrameToEndpoint.mock.calls[0][3]).toBe(10000);
    });

    it('Endpoint commandResponse', async () => {
        await controller.start();
        await mockAdapterEvents['deviceJoined']({networkAddress: 129, ieeeAddr: '0x129'});
        const device = controller.getDeviceByIeeeAddr('0x129');
        const endpoint = device.getEndpoint(1);
        mocksendZclFrameToEndpoint.mockClear();
        await endpoint.commandResponse('genOta', 'imageNotify', {payloadType: 0, queryJitter: 1}, null, null)
        expect(mocksendZclFrameToEndpoint.mock.calls[0][0]).toBe(129);
        expect(mocksendZclFrameToEndpoint.mock.calls[0][1]).toBe(1);
        const expected = {"Header":{"frameControl":{"reservedBits": 0,"frameType":1,"direction":1,"disableDefaultResponse":true,"manufacturerSpecific":false},"transactionSequenceNumber":11,"manufacturerCode":null,"commandIdentifier":0},"Payload":{payloadType: 0, queryJitter: 1},"Cluster":getCluster(25)};
        expect(deepClone(mocksendZclFrameToEndpoint.mock.calls[0][2])).toStrictEqual(expected);
        expect(mocksendZclFrameToEndpoint.mock.calls[0][3]).toBe(10000);
    });

    it('Endpoint waitForCommand', async () => {
        await controller.start();
        await mockAdapterEvents['deviceJoined']({networkAddress: 129, ieeeAddr: '0x129'});
        const device = controller.getDeviceByIeeeAddr('0x129');
        const endpoint = device.getEndpoint(1);
        mocksendZclFrameToEndpoint.mockClear();
        const promise = new Promise((resolve, reject) => resolve({frame: ZclFrame.fromBuffer(Zcl.Utils.getCluster("msOccupancySensing").ID, Buffer.from([24,169,10,0,0,24,1]))}))
        mockAdapterWaitFor.mockReturnValueOnce({promise, cancel: () => {}});
        const result = endpoint.waitForCommand('genOta', 'upgradeEndRequest', 10, 20);
        expect(mockAdapterWaitFor).toHaveBeenCalledTimes(1);
        expect(mockAdapterWaitFor).toHaveBeenCalledWith(129, 1, 1, 0, 10, 25, 6, 20);
        expect(result.cancel).toStrictEqual(expect.any(Function));
        expect((await result.promise)).toStrictEqual({"header": {"commandIdentifier": 10, "frameControl": {"reservedBits": 0,"direction": 1, "disableDefaultResponse": true, "frameType": 0, "manufacturerSpecific": false}, "manufacturerCode": null, "transactionSequenceNumber": 169}, "payload": [{"attrData": 1, "attrId": 0, "dataType": 24}]});
    });

    it('Endpoint waitForCommand error', async () => {
        await controller.start();
        await mockAdapterEvents['deviceJoined']({networkAddress: 129, ieeeAddr: '0x129'});
        const device = controller.getDeviceByIeeeAddr('0x129');
        const endpoint = device.getEndpoint(1);
        mocksendZclFrameToEndpoint.mockClear();
        const promise = new Promise((resolve, reject) => reject(new Error('whoops!')))
        mockAdapterWaitFor.mockReturnValueOnce({promise, cancel: () => {}});
        const result = endpoint.waitForCommand('genOta', 'upgradeEndRequest', 10, 20);
        let error;
        try {await result.promise} catch (e) {error = e}
        expect(error).toStrictEqual(new Error('whoops!'));
    });

    it('Device without meta should set meta to {}', async () => {
        Device['lookup'] = {};
        const line = JSON.stringify({"id":3,"type":"EndDevice","ieeeAddr":"0x90fd9ffffe4b64ae","nwkAddr":19468,"manufId":4476,"manufName":"IKEA of Sweden","powerSource":"Battery","modelId":"TRADFRI remote control","epList":[1],"endpoints":{"1":{"profId":49246,"epId":1,"devId":2096,"inClusterList":[0,1,3,9,2821,4096],"outClusterList":[3,4,5,6,8,25,4096],"clusters":{}}},"appVersion":17,"stackVersion":87,"hwVersion":1,"dateCode":"20170302","swBuildId":"1.2.214","zclVersion":1,"interviewCompleted":true,"_id":"fJ5pmjqKRYbNvslK"});
        fs.writeFileSync(options.databasePath, line + "\n");
        await controller.start();
        const expected = {"ID": 3, "_lastSeen": null, "_applicationVersion": 17, "_dateCode": "20170302", "_endpoints": [{"clusters": {}, "ID": 1, "deviceID": 2096, "_binds": [],"deviceIeeeAddress": "0x90fd9ffffe4b64ae", "deviceNetworkAddress": 19468, "inputClusters": [0, 1, 3, 9, 2821, 4096], "outputClusters": [3, 4, 5, 6, 8, 25, 4096], "profileID": 49246}], "_hardwareVersion": 1, "_ieeeAddr": "0x90fd9ffffe4b64ae", "_interviewCompleted": true, "_interviewing": false, "_manufacturerID": 4476, "_manufacturerName": "IKEA of Sweden", "meta": {}, "_modelID": "TRADFRI remote control", "_networkAddress": 19468, "_powerSource": "Battery", "_softwareBuildID": "1.2.214", "_stackVersion": 87, "_type": "EndDevice", "_zclVersion": 1}
        expect(deepClone(controller.getDeviceByIeeeAddr("0x90fd9ffffe4b64ae"))).toStrictEqual(expected);
    });

    it('Write to endpoint custom attributes', async () => {
        await controller.start();
        await mockAdapterEvents['deviceJoined']({networkAddress: 129, ieeeAddr: '0x129'});
        mocksendZclFrameToEndpoint.mockClear();
        const device = controller.getDeviceByIeeeAddr('0x129');
        const endpoint = device.getEndpoint(1);
        const options = {manufacturerCode: 0x100B, disableDefaultResponse: true, timeout: 12, defaultResponseTimeout: 16};
        await endpoint.write('genBasic', {0x0031: {value: 0x000B, type: 0x19}}, options);
        expect(mocksendZclFrameToEndpoint).toBeCalledTimes(1);
        const call = mocksendZclFrameToEndpoint.mock.calls[0];
        expect(call[0]).toBe(129);
        expect(call[1]).toBe(1);
        expect(deepClone(call[2])).toStrictEqual( {"Cluster": getCluster(0), "Header": {"commandIdentifier": 2, "frameControl": {"reservedBits": 0,"direction": 0, "disableDefaultResponse": true, "frameType": 0, "manufacturerSpecific": true}, "manufacturerCode": 4107, "transactionSequenceNumber": 11}, "Payload": [{"attrData": 11, "attrId": 49, "dataType": 25}]});
        expect(call[3]).toBe(12);
    });

    it('Write to endpoint with unknown string attribute', async () => {
        await controller.start();
        await mockAdapterEvents['deviceJoined']({networkAddress: 129, ieeeAddr: '0x129'});
        mocksendZclFrameToEndpoint.mockClear();
        const device = controller.getDeviceByIeeeAddr('0x129');
        const endpoint = device.getEndpoint(1);
        let error;
        try {await endpoint.write('genBasic', {'UNKNOWN': {value: 0x000B, type: 0x19}}) } catch (e) {error = e}
        expect(error).toStrictEqual(new Error(`Unknown attribute 'UNKNOWN', specify either an existing attribute or a number`))
        expect(mocksendZclFrameToEndpoint).toBeCalledTimes(0);
    });

    it('Read from endpoint with string', async () => {
        await controller.start();
        await mockAdapterEvents['deviceJoined']({networkAddress: 129, ieeeAddr: '0x129'});
        mocksendZclFrameToEndpoint.mockClear();
        const device = controller.getDeviceByIeeeAddr('0x129');
        const endpoint = device.getEndpoint(1);
        await endpoint.read('genBasic', ['stackVersion']);
        expect(mocksendZclFrameToEndpoint).toBeCalledTimes(1);
        const call = mocksendZclFrameToEndpoint.mock.calls[0];
        expect(call[0]).toBe(129);
        expect(call[1]).toBe(1);
        expect(deepClone(call[2])).toStrictEqual({"Header":{"frameControl":{"reservedBits": 0,"frameType":0,"direction":0,"disableDefaultResponse":true,"manufacturerSpecific":false},"transactionSequenceNumber":11,"manufacturerCode":null,"commandIdentifier":0},"Payload":[{"attrId":2}],"Cluster":{"ID":0,"attributes":{"zclVersion":{"ID":0,"type":32,"name":"zclVersion"},"appVersion":{"ID":1,"type":32,"name":"appVersion"},"stackVersion":{"ID":2,"type":32,"name":"stackVersion"},"hwVersion":{"ID":3,"type":32,"name":"hwVersion"},"manufacturerName":{"ID":4,"type":66,"name":"manufacturerName"},"modelId":{"ID":5,"type":66,"name":"modelId"},"dateCode":{"ID":6,"type":66,"name":"dateCode"},"powerSource":{"ID":7,"type":48,"name":"powerSource"},"appProfileVersion":{"ID":8,"type":48,"name":"appProfileVersion"},"swBuildId":{"ID":16384,"type":66,"name":"swBuildId"},"locationDesc":{"ID":16,"type":66,"name":"locationDesc"},"physicalEnv":{"ID":17,"type":48,"name":"physicalEnv"},"deviceEnabled":{"ID":18,"type":16,"name":"deviceEnabled"},"alarmMask":{"ID":19,"type":24,"name":"alarmMask"},"disableLocalConfig":{"ID":20,"type":24,"name":"disableLocalConfig"}},"name":"genBasic","commands":{"resetFactDefault":{"ID":0,"parameters":[],"name":"resetFactDefault"}},"commandsResponse":{}}});
        expect(call[3]).toBe(10000);
    });

    it('Read from endpoint unknown attribute with options', async () => {
        await controller.start();
        await mockAdapterEvents['deviceJoined']({networkAddress: 129, ieeeAddr: '0x129'});
        mocksendZclFrameToEndpoint.mockClear();
        const device = controller.getDeviceByIeeeAddr('0x129');
        const endpoint = device.getEndpoint(1);
        await endpoint.read('genBasic', [0xFF22], {manufacturerCode: 0x115F, disableDefaultResponse: true});
        expect(mocksendZclFrameToEndpoint).toBeCalledTimes(1);
        const call = mocksendZclFrameToEndpoint.mock.calls[0];
        expect(call[0]).toBe(129);
        expect(call[1]).toBe(1);
        expect(deepClone(call[2])).toStrictEqual({"Header":{"frameControl":{"reservedBits": 0,"frameType":0,"direction":0,"disableDefaultResponse":true,"manufacturerSpecific":true},"transactionSequenceNumber":11,"manufacturerCode":4447,"commandIdentifier":0},"Payload":[{"attrId":65314}],"Cluster":{"ID":0,"attributes":{"zclVersion":{"ID":0,"type":32,"name":"zclVersion"},"appVersion":{"ID":1,"type":32,"name":"appVersion"},"stackVersion":{"ID":2,"type":32,"name":"stackVersion"},"hwVersion":{"ID":3,"type":32,"name":"hwVersion"},"manufacturerName":{"ID":4,"type":66,"name":"manufacturerName"},"modelId":{"ID":5,"type":66,"name":"modelId"},"dateCode":{"ID":6,"type":66,"name":"dateCode"},"powerSource":{"ID":7,"type":48,"name":"powerSource"},"appProfileVersion":{"ID":8,"type":48,"name":"appProfileVersion"},"swBuildId":{"ID":16384,"type":66,"name":"swBuildId"},"locationDesc":{"ID":16,"type":66,"name":"locationDesc"},"physicalEnv":{"ID":17,"type":48,"name":"physicalEnv"},"deviceEnabled":{"ID":18,"type":16,"name":"deviceEnabled"},"alarmMask":{"ID":19,"type":24,"name":"alarmMask"},"disableLocalConfig":{"ID":20,"type":24,"name":"disableLocalConfig"}},"name":"genBasic","commands":{"resetFactDefault":{"ID":0,"parameters":[],"name":"resetFactDefault"}},"commandsResponse":{}}});
        expect(call[3]).toBe(10000);
    });

    it('Read response to endpoint with non ZCL attribute', async () => {
        await controller.start();
        await mockAdapterEvents['deviceJoined']({networkAddress: 129, ieeeAddr: '0x129'});
        mocksendZclFrameToEndpoint.mockClear();
        const device = controller.getDeviceByIeeeAddr('0x129');
        const endpoint = device.getEndpoint(1);
        await endpoint.readResponse('genBasic', 99, {0x55: {value: 0x000B, type: 0x19}});
        expect(mocksendZclFrameToEndpoint).toBeCalledTimes(1);
        const call = mocksendZclFrameToEndpoint.mock.calls[0];
        expect(call[0]).toBe(129);
        expect(call[1]).toBe(1);
        expect(deepClone(call[2])).toStrictEqual( {"Cluster": getCluster(0), "Header": {"commandIdentifier": 1, "frameControl": {"reservedBits": 0,"direction": 1, "disableDefaultResponse": true, "frameType": 0, "manufacturerSpecific": false}, "manufacturerCode": null, "transactionSequenceNumber": 99}, "Payload": [{"attrData": 11, "attrId": 85, "dataType": 25, "status": 0}]});
        expect(call[3]).toBe(10000);
    });

    it('Read response to endpoint with unknown string attribute', async () => {
        await controller.start();
        await mockAdapterEvents['deviceJoined']({networkAddress: 129, ieeeAddr: '0x129'});
        mocksendZclFrameToEndpoint.mockClear();
        const device = controller.getDeviceByIeeeAddr('0x129');
        const endpoint = device.getEndpoint(1);
        let error;
        try {await endpoint.readResponse('genBasic', 99, {'UNKNOWN': {value: 0x000B, type: 0x19}}) } catch (e) {error = e}
        expect(error).toStrictEqual(new Error(`Unknown attribute 'UNKNOWN', specify either an existing attribute or a number`))
        expect(mocksendZclFrameToEndpoint).toBeCalledTimes(0);
    });

    it('Read response to endpoint throw when transaction sequence number provided through options', async () => {
        await controller.start();
        await mockAdapterEvents['deviceJoined']({networkAddress: 129, ieeeAddr: '0x129'});
        mocksendZclFrameToEndpoint.mockClear();
        const device = controller.getDeviceByIeeeAddr('0x129');
        const endpoint = device.getEndpoint(1);
        let error;
        try {await endpoint.readResponse('genBasic', 99, {'UNKNOWN': {value: 0x000B, type: 0x19}}, {transactionSequenceNumber: 5}) } catch (e) {error = e}
        expect(error.message).toStrictEqual(`Use parameter`)
        expect(mocksendZclFrameToEndpoint).toBeCalledTimes(0);
    });

    it('Configure reporting endpoint custom attributes', async () => {
        await controller.start();
        await mockAdapterEvents['deviceJoined']({networkAddress: 129, ieeeAddr: '0x129'});
        mocksendZclFrameToEndpoint.mockClear();
        const device = controller.getDeviceByIeeeAddr('0x129');
        const endpoint = device.getEndpoint(1);
        await endpoint.configureReporting('hvacThermostat', [{
            attribute: {ID: 0x4003, type: 41},
            minimumReportInterval: 0,
            maximumReportInterval: 3600,
            reportableChange: 25,
        }]);

        expect(mocksendZclFrameToEndpoint).toBeCalledTimes(1);
        const call = mocksendZclFrameToEndpoint.mock.calls[0];
        expect(call[0]).toBe(129);
        expect(call[1]).toBe(1);
        expect(deepClone(call[2])).toStrictEqual( {"Header":{"frameControl":{"reservedBits": 0,"frameType":0,"direction":0,"disableDefaultResponse":true,"manufacturerSpecific":false},"transactionSequenceNumber":11,"manufacturerCode":null,"commandIdentifier":6},"Payload":[{"direction":0,"attrId":16387,"dataType":41,"minRepIntval":0,"maxRepIntval":3600,"repChange":25}],"Cluster":getCluster(513)});
        expect(call[3]).toBe(10000);
    });

    it('Remove endpoint from all groups', async () => {
        await controller.start();
        skipWait = true;
        await mockAdapterEvents['deviceJoined']({networkAddress: 129, ieeeAddr: '0x129'});
        const device1 = controller.getDeviceByIeeeAddr('0x129');
        await mockAdapterEvents['deviceJoined']({networkAddress: 170, ieeeAddr: '0x170'});
        const device2 = controller.getDeviceByIeeeAddr('0x170');
        const group1 = await controller.createGroup(1);
        const group6 = await controller.createGroup(6);
        const group7 = await controller.createGroup(7);
        const endpoint1 = device1.getEndpoint(1);
        await group1.addMember(endpoint1);
        await group6.addMember(endpoint1);
        await group6.addMember(device2.getEndpoint(1));
        await group7.addMember(device2.getEndpoint(1));
        mocksendZclFrameToEndpoint.mockClear();
        await endpoint1.removeFromAllGroups();
        const call = mocksendZclFrameToEndpoint.mock.calls[0];
        expect(call[0]).toBe(129);
        expect(call[1]).toBe(1);
        expect(group1.members).toStrictEqual([]);
        expect(Array.from(group6.members)).toStrictEqual([device2.getEndpoint(1)]);
        expect(Array.from(group7.members)).toStrictEqual([device2.getEndpoint(1)]);
        expect(deepClone(call[2])).toStrictEqual({"Cluster": getCluster(4), "Header": {"commandIdentifier": 4, "frameControl": {"reservedBits": 0,"direction": 0, "disableDefaultResponse": true, "frameType": 1, "manufacturerSpecific": false}, "manufacturerCode": null, "transactionSequenceNumber": 24}, "Payload": {}});
    });

    it('Load database', async () => {
        const database = `
        {"id":1,"type":"Coordinator","ieeeAddr":"0x123","nwkAddr":0,"manufId":0,"epList":[11,6,5,4,3,2,1],"endpoints":{"1":{"profId":260,"epId":1,"devId":5,"inClusterList":[],"outClusterList":[],"clusters":{}},"2":{"profId":257,"epId":2,"devId":5,"inClusterList":[],"outClusterList":[],"clusters":{}},"3":{"profId":261,"epId":3,"devId":5,"inClusterList":[],"outClusterList":[],"clusters":{}},"4":{"profId":263,"epId":4,"devId":5,"inClusterList":[],"outClusterList":[],"clusters":{}},"5":{"profId":264,"epId":5,"devId":5,"inClusterList":[],"outClusterList":[],"clusters":{}},"6":{"profId":265,"epId":6,"devId":5,"inClusterList":[],"outClusterList":[],"clusters":{}},"11":{"profId":260,"epId":11,"devId":1024,"inClusterList":[],"outClusterList":[1280],"clusters":{}}},"interviewCompleted":false,"meta":{},"_id":"aM341ldunExFmJ3u"}
        {"id":2,"type":"Group","groupID":1,"members":[],"meta":{},"_id":"kiiAEst4irEEqG8T"}
        {"id":3,"type":"Router","ieeeAddr":"0x000b57fffec6a5b2","nwkAddr":40369,"manufId":4476,"manufName":"IKEA of Sweden","powerSource":"Mains (single phase)","modelId":"TRADFRI bulb E27 WS opal 980lm","epList":[1],"endpoints":{"1":{"profId":49246,"epId":1,"devId":544,"inClusterList":[0,3,4,5,6,8,768,2821,4096],"outClusterList":[5,25,32,4096],"clusters":{}}},"appVersion":17,"stackVersion":87,"hwVersion":1,"dateCode":"20170331","swBuildId":"1.2.217","zclVersion":1,"interviewCompleted":true,"meta":{"reporting":1},"_id":"pagvP2f9Bbj3o9TM"}
        {"id":4,"type":"EndDevice","ieeeAddr":"0x0017880104e45517","nwkAddr":6535,"manufId":4107,"manufName":"Philips","powerSource":"Battery","modelId":"RWL021","epList":[1,2],"endpoints":{"1":{"profId":49246,"epId":1,"devId":2096,"inClusterList":[0],"outClusterList":[0,3,4,6,8,5],"clusters":{}},"2":{"profId":260,"epId":2,"devId":12,"inClusterList":[0,1,3,15,64512],"outClusterList":[25],"clusters":{}}},"appVersion":2,"stackVersion":1,"hwVersion":1,"dateCode":"20160302","swBuildId":"5.45.1.17846","zclVersion":1,"interviewCompleted":true,"meta":{"configured":1},"_id":"qxhymbX6H2GXDw8Z"}
        {"$$indexCreated":{"fieldName":"id","unique":true,"sparse":false}}
        {"id":4,"type":"EndDevice","ieeeAddr":"0x0017880104e45517","nwkAddr":6536,"manufId":4107,"manufName":"Philips","powerSource":"Battery","modelId":"RWL021","epList":[1,2],"endpoints":{"1":{"profId":49246,"epId":1,"devId":2096,"inClusterList":[0],"outClusterList":[0,3,4,6,8,5],"clusters":{}},"2":{"profId":260,"epId":2,"devId":12,"inClusterList":[0,1,3,15,64512],"outClusterList":[25],"clusters":{}}},"appVersion":2,"stackVersion":1,"hwVersion":1,"dateCode":"20160302","swBuildId":"5.45.1.17846","zclVersion":1,"interviewCompleted":true,"meta":{"configured":1},"_id":"qxhymbX6H2GXDw8Z"}
        {"id":4,"type":"EndDevice","ieeeAddr":"0x0017880104e45517","lastSeen":123,"nwkAddr":6538,"manufId":4107,"manufName":"Philips","powerSource":"Battery","modelId":"RWL021","epList":[1,2],"endpoints":{"1":{"profId":49246,"epId":1,"devId":2096,"inClusterList":[0],"outClusterList":[0,3,4,6,8,5],"binds":[{"type":"endpoint","endpointID":1,"deviceIeeeAddr":"0x000b57fffec6a5b2"}],"clusters":{"genBasic":{"dir":{"value":3},"attrs":{"modelId":"RWL021"}}}},"2":{"profId":260,"epId":2,"devId":12,"inClusterList":[0,1,3,15,64512],"outClusterList":[25],"clusters":{}}},"appVersion":2,"stackVersion":1,"hwVersion":1,"dateCode":"20160302","swBuildId":"5.45.1.17846","zclVersion":1,"interviewCompleted":true,"meta":{"configured":1},"_id":"qxhymbX6H2GXDw8Z"}
        {"id":5,"type":"Group","groupID":2,"members":[{"deviceIeeeAddr": "0x000b57fffec6a5b2", "endpointID": 1}, {"deviceIeeeAddr": "notExisting", "endpointID": 1}],"meta":{},"_id":"kiiAEst4irEEqG8K"}
        `
        fs.writeFileSync(options.databasePath, database);
        await controller.start();
        expect((controller.getDevices()).length).toBe(3);
        expect(deepClone(controller.getDeviceByIeeeAddr('0x123'))).toStrictEqual({"ID": 1, "_lastSeen": null, "_endpoints": [{"_binds": [], "clusters": {}, "ID": 1, "deviceID": 5, "deviceIeeeAddress": "0x123", "deviceNetworkAddress": 0, "inputClusters": [], "outputClusters": [], "profileID": 260}, {"_binds": [], "clusters": {}, "ID": 2, "deviceID": 5, "deviceIeeeAddress": "0x123", "deviceNetworkAddress": 0, "inputClusters": [], "outputClusters": [], "profileID": 257}, {"_binds": [], "clusters": {}, "ID": 3, "deviceID": 5, "deviceIeeeAddress": "0x123", "deviceNetworkAddress": 0, "inputClusters": [], "outputClusters": [], "profileID": 261}, {"_binds": [], "clusters": {}, "ID": 4, "deviceID": 5, "deviceIeeeAddress": "0x123", "deviceNetworkAddress": 0, "inputClusters": [], "outputClusters": [], "profileID": 263}, {"_binds": [], "clusters": {}, "ID": 5, "deviceID": 5, "deviceIeeeAddress": "0x123", "deviceNetworkAddress": 0, "inputClusters": [], "outputClusters": [], "profileID": 264}, {"_binds": [], "clusters": {}, "ID": 6, "deviceID": 5, "deviceIeeeAddress": "0x123", "deviceNetworkAddress": 0, "inputClusters": [], "outputClusters": [], "profileID": 265}, {"_binds": [], "clusters": {}, "ID": 11, "deviceID": 1024, "deviceIeeeAddress": "0x123", "deviceNetworkAddress": 0, "inputClusters": [], "outputClusters": [1280], "profileID": 260}], "_ieeeAddr": "0x123", "_interviewCompleted": false, "_interviewing": false, "_manufacturerID": 0, "meta": {}, "_networkAddress": 0, "_type": "Coordinator"});
        expect(deepClone(controller.getDeviceByIeeeAddr('0x000b57fffec6a5b2'))).toStrictEqual({"ID": 3, "_lastSeen": null,  "_applicationVersion": 17, "_dateCode": "20170331", "_endpoints": [{"_binds": [], "clusters": {}, "ID": 1, "deviceID": 544, "deviceIeeeAddress": "0x000b57fffec6a5b2", "deviceNetworkAddress": 40369, "inputClusters": [0, 3, 4, 5, 6, 8, 768, 2821, 4096], "outputClusters": [5, 25, 32, 4096], "profileID": 49246}], "_hardwareVersion": 1, "_ieeeAddr": "0x000b57fffec6a5b2", "_interviewCompleted": true, "_interviewing": false, "_manufacturerID": 4476, "_manufacturerName": "IKEA of Sweden", "meta": {"reporting": 1}, "_modelID": "TRADFRI bulb E27 WS opal 980lm", "_networkAddress": 40369, "_powerSource": "Mains (single phase)", "_softwareBuildID": "1.2.217", "_stackVersion": 87, "_type": "Router", "_zclVersion": 1});
        expect(deepClone(controller.getDeviceByIeeeAddr('0x0017880104e45517'))).toStrictEqual({"ID": 4, "_lastSeen": 123,  "_applicationVersion": 2, "_dateCode": "20160302", "_endpoints": [{"_binds": [{type: 'endpoint', endpointID: 1, deviceIeeeAddr: '0x000b57fffec6a5b2'}], "clusters": {"genBasic": {"dir": {"value": 3}, "attributes": {"modelId": "RWL021"}}}, "ID": 1, "deviceID": 2096, "deviceIeeeAddress": "0x0017880104e45517", "deviceNetworkAddress": 6538, "inputClusters": [0], "outputClusters": [0, 3, 4, 6, 8, 5], "profileID": 49246}, {"_binds": [], "clusters": {}, "ID": 2, "deviceID": 12, "deviceIeeeAddress": "0x0017880104e45517", "deviceNetworkAddress": 6538, "inputClusters": [0, 1, 3, 15, 64512], "outputClusters": [25], "profileID": 260}], "_hardwareVersion": 1, "_ieeeAddr": "0x0017880104e45517", "_interviewCompleted": true, "_interviewing": false, "_manufacturerID": 4107, "_manufacturerName": "Philips", "meta": {"configured": 1}, "_modelID": "RWL021", "_networkAddress": 6538, "_powerSource": "Battery", "_softwareBuildID": "5.45.1.17846", "_stackVersion": 1, "_type": "EndDevice", "_zclVersion": 1});
        expect((await controller.getGroups({})).length).toBe(2);

        const group1 = controller.getGroupByID(1);
        group1._members = Array.from(group1._members);
        expect(deepClone(group1)).toStrictEqual({"databaseID": 2, "groupID": 1, "_members": [], "meta": {}});
        const group2 = controller.getGroupByID(2);
        group2._members = Array.from(group2._members);
        expect(deepClone(group2)).toStrictEqual({"databaseID": 5, "groupID": 2, "_members": [{"_binds": [], "clusters": {}, "ID": 1, "deviceID": 544, "deviceIeeeAddress": "0x000b57fffec6a5b2", "deviceNetworkAddress": 40369, "inputClusters": [0, 3, 4, 5, 6, 8, 768, 2821, 4096], "outputClusters": [5, 25, 32, 4096], "profileID": 49246}], "meta": {}});
    });

    it('Shouldnt load device from group databaseentry', async () => {
        expect(() => {
            // @ts-ignore
            Device.fromDatabaseEntry({type: 'Group', endpoints: []})
        }).toThrowError('Cannot load device from group')
    });

    it('Should throw datbase basic crud errors', async () => {
        await controller.start();
        await mockAdapterEvents['deviceJoined']({networkAddress: 129, ieeeAddr: '0x129'});
        expect(() => {
            controller.database.insert({id: 2})
        }).toThrowError(`DatabaseEntry with ID '2' already exists`);

        expect(() => {
            controller.database.remove(3)
        }).toThrowError(`DatabaseEntry with ID '3' does not exist`);

        expect(() => {
            controller.database.update({id: 3})
        }).toThrowError(`DatabaseEntry with ID '3' does not exist`);
    });

    it('Should save received attributes', async () => {
        await controller.start();
        await mockAdapterEvents['deviceJoined']({networkAddress: 129, ieeeAddr: '0x129'});
        await mockAdapterEvents['zclData']({
            address: 129,
            frame: ZclFrame.fromBuffer(Zcl.Utils.getCluster("msOccupancySensing").ID, Buffer.from([24,169,10,0,0,24,1])),
            endpoint: 1,
            linkquality: 50,
            groupID: 1,
        });
        const device = controller.getDeviceByIeeeAddr('0x129');
        const endpoint = device.endpoints[0];
        expect(endpoint.getClusterAttributeValue('msOccupancySensing', 'occupancy')).toBe(1);
        expect(endpoint.getClusterAttributeValue('genBasic', 'modelId')).toBeNull();

        await mockAdapterEvents['zclData']({
            address: 129,
            frame: ZclFrame.fromBuffer(Zcl.Utils.getCluster("msOccupancySensing").ID, Buffer.from([24,169,10,0,0,24,0])),
            endpoint: 1,
            linkquality: 50,
            groupID: 1,
        });

        expect(endpoint.getClusterAttributeValue('msOccupancySensing', 'occupancy')).toBe(0);
    });


    it('Adapter create', async () => {
        mockZStackAdapterIsValidPath.mockReturnValueOnce(true);
        await Adapter.create(null, {path: '/dev/bla', baudRate: 100, rtscts: false, adapter: null}, null, null);
        expect(mockZStackAdapterIsValidPath).toHaveBeenCalledWith('/dev/bla');
        expect(ZStackAdapter).toHaveBeenCalledWith(null, {"baudRate": 100, "path": "/dev/bla", "rtscts": false, adapter: null}, null, null);
    });

    it('Adapter create continue when is valid path fails', async () => {
        mockZStackAdapterIsValidPath.mockImplementationOnce(() => {throw new Error('failed')});
        await Adapter.create(null, {path: '/dev/bla', baudRate: 100, rtscts: false, adapter: null}, null, null);
        expect(mockZStackAdapterIsValidPath).toHaveBeenCalledWith('/dev/bla');
        expect(ZStackAdapter).toHaveBeenCalledWith(null, {"baudRate": 100, "path": "/dev/bla", "rtscts": false, adapter: null}, null, null);
    });

    it('Adapter create auto detect', async () => {
        mockZStackAdapterIsValidPath.mockReturnValueOnce(true);
        mockZStackAdapterAutoDetectPath.mockReturnValueOnce('/dev/test');
        await Adapter.create(null, {path: null, baudRate: 100, rtscts: false, adapter: null}, null, null);
        expect(ZStackAdapter).toHaveBeenCalledWith(null, {"baudRate": 100, "path": "/dev/test", "rtscts": false, adapter: null}, null, null);
    });

    it('Adapter create auto detect nothing found', async () => {
        mockZStackAdapterIsValidPath.mockReturnValueOnce(false);
        mockZStackAdapterAutoDetectPath.mockReturnValueOnce(null);

        let error;
        try {
            await Adapter.create(null, {path: null, baudRate: 100, rtscts: false, adapter: null}, null, null);
        } catch(e) {
            error = e;
        }
        expect(error).toStrictEqual(new Error('No path provided and failed to auto detect path'));
    });

    it('Adapter create with unknown path should take ZStackAdapter by default', async () => {
        mockZStackAdapterIsValidPath.mockReturnValueOnce(false);
        mockZStackAdapterAutoDetectPath.mockReturnValueOnce('/dev/test');
        await Adapter.create(null, {path: null, baudRate: 100, rtscts: false, adapter: null}, null, null);
        expect(ZStackAdapter).toHaveBeenCalledWith(null, {"baudRate": 100, "path": "/dev/test", "rtscts": false, adapter: null}, null, null);
    });

    it('Adapter create should be able to specify adapter', async () => {
        mockZStackAdapterIsValidPath.mockReturnValueOnce(false);
        mockZStackAdapterAutoDetectPath.mockReturnValueOnce('/dev/test');
        mockDeconzAdapterIsValidPath.mockReturnValueOnce(false);
        mockDeconzAdapterAutoDetectPath.mockReturnValueOnce('/dev/test');
        await Adapter.create(null, {path: null, baudRate: 100, rtscts: false, adapter: 'deconz'}, null, null);
        expect(DeconzAdapter).toHaveBeenCalledWith(null, {"baudRate": 100, "path": "/dev/test", "rtscts": false, adapter: 'deconz'}, null, null);
    });

    it('Adapter create should throw on uknown adapter', async () => {
        mockZStackAdapterIsValidPath.mockReturnValueOnce(false);
        mockZStackAdapterAutoDetectPath.mockReturnValueOnce('/dev/test');
        mockDeconzAdapterIsValidPath.mockReturnValueOnce(false);
        mockDeconzAdapterAutoDetectPath.mockReturnValueOnce('/dev/test');
        let error;
        try {await Adapter.create(null, {path: null, baudRate: 100, rtscts: false, adapter: 'zigate'}, null, null)} catch (e) {error = e;}
        expect(error).toStrictEqual(new Error(`Adapter 'zigate' does not exists, possible options: zstack, deconz`));
    });

    it('Emit read from device', async () => {
        await controller.start();
        await mockAdapterEvents['deviceJoined']({networkAddress: 129, ieeeAddr: '0x129'});
        await mockAdapterEvents['zclData']({
            address: 129,
            // Attrid 9999 does not exist in ZCL
            frame: ZclFrame.create(0, 0, true, null, 40, 0, 1, [{attrId: 0}, {attrId: 9999}]),
            endpoint: 1,
            linkquality: 19,
            groupID: 10,
        });

        const expected = {
            "type":"read",
            "device":{
                "ID":2,
                "_applicationVersion":2,
                "_dateCode":"201901",
                "_endpoints":[
                    {
                        "deviceID":5,
                        "inputClusters":[
                            0,
                            1
                        ],
                        "outputClusters":[
                            2
                        ],
                        "profileID":99,
                        "ID":1,
                        "clusters":{

                        },
                        "deviceIeeeAddress":"0x129",
                        "deviceNetworkAddress":129,
                        "_binds":[

                        ]
                    }
                ],
                "_hardwareVersion":3,
                "_ieeeAddr":"0x129",
                "_interviewCompleted":true,
                "_interviewing":false,
                "_lastSeen":150,
                "_manufacturerID":1212,
                "_manufacturerName":"KoenAndCo",
                "_modelID":"myModelID",
                "_networkAddress":129,
                "_powerSource":"Mains (single phase)",
                "_softwareBuildID":"1.01",
                "_stackVersion":101,
                "_type":"Router",
                "_zclVersion":1,
                "meta":{

                }
            },
            "endpoint":{
                "deviceID":5,
                "inputClusters":[
                    0,
                    1
                ],
                "outputClusters":[
                    2
                ],
                "profileID":99,
                "ID":1,
                "clusters":{

                },
                "deviceIeeeAddress":"0x129",
                "deviceNetworkAddress":129,
                "_binds":[

                ]
            },
            "data":[
                "mainsVoltage",
                9999
            ],
            "linkquality":19,
            "groupID":10,
            "cluster":"genPowerCfg",
            "meta":{
                "zclTransactionSequenceNumber":40,
                "manufacturerCode": null,
                "frameControl": {
                    "reservedBits": 0,
                    "direction": 0,
                    "disableDefaultResponse": true,
                    "frameType": 0,
                    "manufacturerSpecific": false,
                },
            }
        };

        expect(events.message.length).toBe(1);
        expect(deepClone(events.message[0])).toStrictEqual(expected);
    });

    it('Emit write from device', async () => {
        await controller.start();
        await mockAdapterEvents['deviceJoined']({networkAddress: 129, ieeeAddr: '0x129'});
        await mockAdapterEvents['zclData']({
            address: 129,
            // Attrid 9999 does not exist in ZCL
            frame: ZclFrame.create(0, 0, true, null, 40, 2, 10, [{attrId:16389, dataType:32, attrData:3}]),
            endpoint: 1,
            linkquality: 19,
            groupID: 10,
        });

        const expected = {
            "type":"write",
            "device":{
                "ID":2,
                "_applicationVersion":2,
                "_dateCode":"201901",
                "_endpoints":[
                    {
                        "deviceID":5,
                        "inputClusters":[
                            0,
                            1
                        ],
                        "outputClusters":[
                            2
                        ],
                        "profileID":99,
                        "ID":1,
                        "clusters":{

                        },
                        "deviceIeeeAddress":"0x129",
                        "deviceNetworkAddress":129,
                        "_binds":[

                        ]
                    }
                ],
                "_hardwareVersion":3,
                "_ieeeAddr":"0x129",
                "_interviewCompleted":true,
                "_interviewing":false,
                "_lastSeen":150,
                "_manufacturerID":1212,
                "_manufacturerName":"KoenAndCo",
                "_modelID":"myModelID",
                "_networkAddress":129,
                "_powerSource":"Mains (single phase)",
                "_softwareBuildID":"1.01",
                "_stackVersion":101,
                "_type":"Router",
                "_zclVersion":1,
                "meta":{

                }
            },
            "endpoint":{
                "deviceID":5,
                "inputClusters":[
                    0,
                    1
                ],
                "outputClusters":[
                    2
                ],
                "profileID":99,
                "ID":1,
                "clusters":{

                },
                "deviceIeeeAddress":"0x129",
                "deviceNetworkAddress":129,
                "_binds":[

                ]
            },
            "data":{
                "16389": 3,
            },
            "linkquality":19,
            "groupID":10,
            "cluster":"genTime",
            "meta":{
                "zclTransactionSequenceNumber":40,
                "manufacturerCode": null,
                "frameControl": {
                    "reservedBits": 0,
                    "direction": 0,
                    "disableDefaultResponse": true,
                    "frameType": 0,
                    "manufacturerSpecific": false,
                },
            }
        };

        expect(events.message.length).toBe(1);
        expect(deepClone(events.message[0])).toStrictEqual(expected);
    });

    it('Endpoint command error', async () => {
        await controller.start();
        await mockAdapterEvents['deviceJoined']({networkAddress: 129, ieeeAddr: '0x129'});
        const device = controller.getDeviceByIeeeAddr('0x129');
        const endpoint = device.getEndpoint(1);
        mocksendZclFrameToEndpoint.mockRejectedValueOnce(new Error('timeout occurred'));
        let error;
        try {await endpoint.command('genOnOff', 'toggle', {})} catch (e) {error = e}
        expect(error).toStrictEqual(new Error(`Command 0x129/1 genOnOff.toggle({}, {"timeout":10000,"disableResponse":false,"disableDefaultResponse":false,"direction":0,"srcEndpoint":null,"reservedBits":0,"manufacturerCode":null,"transactionSequenceNumber":null}) failed (timeout occurred)`));
    });

    it('Endpoint commandResponse error', async () => {
        await controller.start();
        await mockAdapterEvents['deviceJoined']({networkAddress: 129, ieeeAddr: '0x129'});
        const device = controller.getDeviceByIeeeAddr('0x129');
        const endpoint = device.getEndpoint(1);
        mocksendZclFrameToEndpoint.mockRejectedValueOnce(new Error('timeout occurred'));
        let error;
        try {await endpoint.commandResponse('genOta', 'imageNotify', {payloadType: 0, queryJitter: 1}, null, null)} catch (e) {error = e}
        expect(error).toStrictEqual(new Error(`CommandResponse 0x129/1 genOta.imageNotify({"payloadType":0,"queryJitter":1}, {"timeout":10000,"disableResponse":false,"disableDefaultResponse":true,"direction":1,"srcEndpoint":null,"reservedBits":0,"manufacturerCode":null,"transactionSequenceNumber":null}) failed (timeout occurred)`));
    });

    it('Endpoint commandResponse error when transactionSequenceNumber provided through options', async () => {
        await controller.start();
        await mockAdapterEvents['deviceJoined']({networkAddress: 129, ieeeAddr: '0x129'});
        const device = controller.getDeviceByIeeeAddr('0x129');
        const endpoint = device.getEndpoint(1);
        mocksendZclFrameToEndpoint.mockRejectedValueOnce(new Error('timeout occurred'));
        let error;
        try {await endpoint.commandResponse('genOta', 'imageNotify', {payloadType: 0, queryJitter: 1}, {transactionSequenceNumber: 10}, null)} catch (e) {error = e}
        expect(error.message).toStrictEqual(`Use parameter`);
    });

    it('ConfigureReporting error', async () => {
        await controller.start();
        await mockAdapterEvents['deviceJoined']({networkAddress: 129, ieeeAddr: '0x129'});
        const device = controller.getDeviceByIeeeAddr('0x129');
        const endpoint = device.getEndpoint(1);
        mocksendZclFrameToEndpoint.mockRejectedValueOnce(new Error('timeout occurred'));
        let error;
        try {await endpoint.configureReporting('genOnOff', [{attribute: 'onOff', minimumReportInterval: 0, maximumReportInterval: 2, reportableChange: 10}])} catch (e) {error = e}
        expect(error).toStrictEqual(new Error(`ConfigureReporting 0x129/1 genOnOff([{"attribute":"onOff","minimumReportInterval":0,"maximumReportInterval":2,"reportableChange":10}], {"timeout":10000,"disableResponse":false,"disableDefaultResponse":true,"direction":0,"srcEndpoint":null,"reservedBits":0,"manufacturerCode":null,"transactionSequenceNumber":null}) failed (timeout occurred)`));
    });

    it('DefaultResponse error', async () => {
        await controller.start();
        await mockAdapterEvents['deviceJoined']({networkAddress: 129, ieeeAddr: '0x129'});
        const device = controller.getDeviceByIeeeAddr('0x129');
        const endpoint = device.getEndpoint(1);
        mocksendZclFrameToEndpoint.mockRejectedValueOnce(new Error('timeout occurred'));
        let error;
        try {await endpoint.defaultResponse(1, 0, 1, 3)} catch (e) {error = e}
        expect(error).toStrictEqual(new Error(`DefaultResponse 0x129/1 1(1, {"timeout":10000,"disableResponse":false,"disableDefaultResponse":true,"direction":1,"srcEndpoint":null,"reservedBits":0,"manufacturerCode":null,"transactionSequenceNumber":null}) failed (timeout occurred)`));
    });

    it('DefaultResponse error when transactionSequenceNumber provided through options', async () => {
        await controller.start();
        await mockAdapterEvents['deviceJoined']({networkAddress: 129, ieeeAddr: '0x129'});
        const device = controller.getDeviceByIeeeAddr('0x129');
        const endpoint = device.getEndpoint(1);
        mocksendZclFrameToEndpoint.mockRejectedValueOnce(new Error('timeout occurred'));
        let error;
        try {await endpoint.defaultResponse(1, 0, 1, 3, {transactionSequenceNumber: 10})} catch (e) {error = e}
        expect(error.message).toStrictEqual(`Use parameter`);
    });

    it('Unbind error', async () => {
        await controller.start();
        await mockAdapterEvents['deviceJoined']({networkAddress: 129, ieeeAddr: '0x129'});
        const device = controller.getDeviceByIeeeAddr('0x129');
        const endpoint = device.getEndpoint(1);
        mockAdapterUnbind.mockRejectedValueOnce(new Error('timeout occurred'));
        let error;
        try {await endpoint.unbind('genOnOff', 1)} catch (e) {error = e}
        expect(error).toStrictEqual(new Error(`Unbind 0x129/1 genOnOff from '1' failed (timeout occurred)`));
    });

    it('Bind error', async () => {
        await controller.start();
        await mockAdapterEvents['deviceJoined']({networkAddress: 129, ieeeAddr: '0x129'});
        const device = controller.getDeviceByIeeeAddr('0x129');
        const endpoint = device.getEndpoint(1);
        mockAdapterBind.mockRejectedValueOnce(new Error('timeout occurred'));
        let error;
        try {await endpoint.bind('genOnOff', 1)} catch (e) {error = e}
        expect(error).toStrictEqual(new Error(`Bind 0x129/1 genOnOff from '1' failed (timeout occurred)`));
    });

    it('ReadResponse error', async () => {
        await controller.start();
        await mockAdapterEvents['deviceJoined']({networkAddress: 129, ieeeAddr: '0x129'});
        const device = controller.getDeviceByIeeeAddr('0x129');
        const endpoint = device.getEndpoint(1);
        mocksendZclFrameToEndpoint.mockRejectedValueOnce(new Error('timeout occurred'));
        let error;
        try {await endpoint.readResponse('genOnOff', 1, [{onOff: 1}])} catch (e) {error = e}
        expect(error).toStrictEqual(new Error(`ReadResponse 0x129/1 genOnOff([{"onOff":1}], {"timeout":10000,"disableResponse":false,"disableDefaultResponse":true,"direction":1,"srcEndpoint":null,"reservedBits":0,"manufacturerCode":null,"transactionSequenceNumber":null}) failed (timeout occurred)`));
    });

    it('Read error', async () => {
        await controller.start();
        await mockAdapterEvents['deviceJoined']({networkAddress: 129, ieeeAddr: '0x129'});
        const device = controller.getDeviceByIeeeAddr('0x129');
        const endpoint = device.getEndpoint(1);
        mocksendZclFrameToEndpoint.mockRejectedValueOnce(new Error('timeout occurred'));
        let error;
        try {await endpoint.read('genOnOff', ['onOff'])} catch (e) {error = e}
        expect(error).toStrictEqual(new Error(`Read 0x129/1 genOnOff(["onOff"], {"timeout":10000,"disableResponse":false,"disableDefaultResponse":true,"direction":0,"srcEndpoint":null,"reservedBits":0,"manufacturerCode":null,"transactionSequenceNumber":null}) failed (timeout occurred)`));
    });

    it('Read with disable response', async () => {
        await controller.start();
        await mockAdapterEvents['deviceJoined']({networkAddress: 129, ieeeAddr: '0x129'});
        const device = controller.getDeviceByIeeeAddr('0x129');
        const endpoint = device.getEndpoint(1);
        mocksendZclFrameToEndpoint.mockReturnValueOnce(null);
        let error;
        try {await endpoint.read('genOnOff', ['onOff'], {disableResponse: true})} catch (e) {error = e}
        expect(error).toBeUndefined();
    });

    it('Write error', async () => {
        await controller.start();
        await mockAdapterEvents['deviceJoined']({networkAddress: 129, ieeeAddr: '0x129'});
        const device = controller.getDeviceByIeeeAddr('0x129');
        const endpoint = device.getEndpoint(1);
        mocksendZclFrameToEndpoint.mockRejectedValueOnce(new Error('timeout occurred'));
        let error;
        try {await endpoint.write('genOnOff', {onOff: 1})} catch (e) {error = e}
        expect(error).toStrictEqual(new Error(`Write 0x129/1 genOnOff({"onOff":1}, {"timeout":10000,"disableResponse":false,"disableDefaultResponse":true,"direction":0,"srcEndpoint":null,"reservedBits":0,"manufacturerCode":null,"transactionSequenceNumber":null}) failed (timeout occurred)`));
    });

    it('Write with disable response', async () => {
        await controller.start();
        await mockAdapterEvents['deviceJoined']({networkAddress: 129, ieeeAddr: '0x129'});
        const device = controller.getDeviceByIeeeAddr('0x129');
        const endpoint = device.getEndpoint(1);
        mocksendZclFrameToEndpoint.mockReturnValueOnce(null)
        let error;
        try {await endpoint.write('genOnOff', {onOff: 1}, {disableResponse: true})} catch (e) {error = e}
        expect(error).toBeUndefined();
    });

    it('Group command error', async () => {
        await controller.start();
        const group = await controller.createGroup(2);
        mocksendZclFrameToGroup.mockRejectedValueOnce(new Error('timeout'));
        let error;
        try {await group.command('genOnOff', 'toggle', {})} catch (e) {error = e}
        expect(error).toStrictEqual(new Error(`Command 2 genOnOff.toggle({}) failed (timeout)`));
    });

    it('Green power', async () => {
        await controller.start();
        const data = {
            options: 0,
            srcID: 0x0046f4fe,
            frameCounter: 228,
            commandID: 0xce,
            payloadSize: 27,
            commandFrame: {
                deviceID: 0x02,
                options: 0x81,
                extendedOptions: 0xf2,
                securityKey: Buffer.from([0xf1, 0xec, 0x92, 0xab, 0xff, 0x8f, 0x13, 0x63, 0xe1, 0x46, 0xbe, 0xb5, 0x18, 0xc9, 0x0c, 0xab]),
                keyMic: 0xd5d446a4,
                outgoingCounter: 0x000004e4,
            },
        };
        const frame = mockZclFrame.create(1, 0, true, null, 10, 'commisioningNotification', 33, data)
        await mockAdapterEvents['zclData']({
            address: 0x46f4fe,
            frame,
            endpoint: 242,
            linkquality: 50,
            groupID: 1,
        });

        const dataResponse = {
            options: 0x00e548,
            srcID: 0x0046f4fe,
            sinkGroupID: 0x0b84,
            deviceID: 2,
            frameCounter: 1252,
            gpdKey: [29, 213, 18, 52, 213, 52, 152, 88, 183, 49, 101, 110, 209, 248, 244, 140]
        };
        const frameResponse = mockZclFrame.create(1, 1, true, null, 2, 'pairing', 33, dataResponse);

        expect(mocksendZclFrameToAll.mock.calls[0][0]).toBe(242);
        expect(deepClone(mocksendZclFrameToAll.mock.calls[0][1])).toStrictEqual(deepClone(frameResponse));
        expect(mocksendZclFrameToAll.mock.calls[0][2]).toBe(242);
        expect(mocksendZclFrameToAll).toHaveBeenCalledTimes(1);

        // When joins again, shouldnt emit duplicate event
        await mockAdapterEvents['zclData']({
            address: 0x46f4fe,
            frame,
            endpoint: 242,
            linkquality: 50,
            groupID: 1,
        });

        expect(events.deviceJoined.length).toBe(1);
        expect(deepClone(events.deviceJoined[0])).toStrictEqual({"device":{"ID":2,"_endpoints":[{"inputClusters":[],"outputClusters":[],"ID":242,"clusters":{},"deviceIeeeAddress":"0x000000000046f4fe","deviceNetworkAddress":4650238,"_binds":[]}],"_ieeeAddr":"0x000000000046f4fe","_interviewCompleted":true,"_interviewing":false,"_lastSeen":150,"_manufacturerID":null,"_modelID":"GreenPower_2","_networkAddress":4650238,"_type":"GreenPower","meta":{}}});
        expect(events.deviceInterview.length).toBe(1);
        expect(deepClone(events.deviceInterview[0])).toStrictEqual({"status":"successful","device":{"ID":2,"_endpoints":[],"_ieeeAddr":"0x000000000046f4fe","_interviewCompleted":true,"_interviewing":false,"_lastSeen":null,"_manufacturerID":null,"_modelID":"GreenPower_2","_networkAddress":4650238,"_type":"GreenPower","meta":{}}});
        expect((controller.getDeviceByIeeeAddr('0x000000000046f4fe')).networkAddress).toBe(0x46f4fe);

        // Green power device send message
        expect(events.message.length).toBe(0);
        const dataToggle = {
            options: 0,
            srcID: 0x0046f4fe,
            frameCounter: 228,
            commandID: 0x22,
            payloadSize: 255,
            commandFrame: {
            },
        };
        const frameToggle = mockZclFrame.create(1, 0, true, null, 10, 'notification', 33, dataToggle)
        await mockAdapterEvents['zclData']({
            address: 0x46f4fe,
            frame: frameToggle,
            endpoint: 242,
            linkquality: 50,
            groupID: 1,
        });

        expect(events.message.length).toBe(1);
        const expected = {"type":"commandNotification","device":{"ID":2,"_endpoints":[{"inputClusters":[],"outputClusters":[],"ID":242,"clusters":{},"deviceIeeeAddress":"0x000000000046f4fe","deviceNetworkAddress":4650238,"_binds":[]}],"_ieeeAddr":"0x000000000046f4fe","_interviewCompleted":true,"_interviewing":false,"_lastSeen":150,"_manufacturerID":null,"_modelID":"GreenPower_2","_networkAddress":4650238,"_type":"GreenPower","meta":{}},"endpoint":{"inputClusters":[],"outputClusters":[],"ID":242,"clusters":{},"deviceIeeeAddress":"0x000000000046f4fe","deviceNetworkAddress":4650238,"_binds":[]},"data":{"options":0,"srcID":4650238,"frameCounter":228,"commandID":34,"payloadSize":255,"commandFrame":{}},"linkquality":50,"groupID":1,"cluster":"greenPower","meta":{"zclTransactionSequenceNumber":10,"manufacturerCode":null,"frameControl":{"reservedBits":0,"frameType":1,"direction":0,"disableDefaultResponse":true,"manufacturerSpecific":false}}};
        expect(deepClone(events.message[0])).toStrictEqual(expected);
    });
});