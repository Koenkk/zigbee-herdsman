import "regenerator-runtime/runtime";
import tmp from 'tmp';
import {Controller} from '../src/controller';
import {ZStackAdapter} from '../src/adapter';
import equals from 'fast-deep-equal';
import fs from 'fs';
import { ZclFrame } from "../src/zcl";
import { Device, Group } from "../src/controller/model";
import * as Zcl from '../src/zcl';
import {Wait} from '../src/utils';

const mockAdapterEvents = {};
const mockAdapterPermitJoin = jest.fn();
const mockAdapterSupportsBackup = jest.fn().mockReturnValue(true);
const mockAdapterSoftReset = jest.fn();
const mockAdapterStop = jest.fn();
const mockAdapterStart = jest.fn().mockReturnValue('resumed');
const mockDisableLED = jest.fn();
const mockAdapterBind = jest.fn();
const mockSendZclFrameGroup = jest.fn();
const mockAdapterUnbind = jest.fn();
const mockAdapterRemoveDevice = jest.fn();
const mockSendZclFrameNetworkAddress = jest.fn();
const mockSendZclFrameNetworkAddressWithResponse = jest.fn().mockImplementation((networkAddress, endpoint, frame) => {
    if (frame.isGlobal() && frame.isCommand('read') && frame.isCluster('genBasic')) {
        const payload = [];
        const cluster = frame.getCluster();
        for (const item of frame.Payload) {
            const attribute = cluster.getAttribute(item.attrId).name;
            payload.push({attrId: item.attrId, attrData: mockDevices[networkAddress].attributes[endpoint][attribute]})
        }

        return {frame: new ZclFrame(null, payload, frame.ClusterID)};
    }

    if (frame.isSpecific() && (frame.isCommand('add') || frame.isCommand('remove')) && frame.isCluster('genGroups')) {
        return {frame: new ZclFrame(null, {status: 0, groupid: 1}, frame.ClusterID)};
    }
})

const mocksRestore = [mockAdapterStart, mockAdapterPermitJoin, mockAdapterStop, mockSendZclFrameNetworkAddress, mockAdapterRemoveDevice];
const mocksClear = [mockSendZclFrameNetworkAddressWithResponse];
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
        simpleDescriptor: {1: {endpointID: 1, deviceID: 5, inputClusters: [1], outputClusters: [2], profileID: 99}},
        attributes: {
            1: {modelId: 'myModelID', manufacturerName: 'KoenAndCo', zclVersion: 1, appVersion: 2, hwVersion: 3, dateCode: '201901', swBuildId: '1.01', powerSource: 1, stackVersion: 101}
        },
    },
    140: {
        nodeDescriptor: undefined,
    },
    150: {
        nodeDescriptor: 'xiaomi',
    },
    160: {
        nodeDescriptor: {type: 'Router', manufacturerCode: 1212},
        activeEndpoints: {endpoints: []},
        attributes: {
        },
    },
    170: {
        nodeDescriptor: {type: 'Router', manufacturerCode: 1212},
        activeEndpoints: {endpoints: [1]},
        simpleDescriptor: {1: {endpointID: 1, deviceID: 5, inputClusters: [1280], outputClusters: [2], profileID: 99}},
        attributes: {
            1: {modelId: 'myIasDevice', manufacturerName: 'KoenAndCoSecurity', zclVersion: 1, appVersion: 2, hwVersion: 3, dateCode: '201901', swBuildId: '1.01', powerSource: 1, stackVersion: 101}
        },
    },
}

const mockZclFrame = ZclFrame;

jest.mock('../src/utils/wait', () => {
    return jest.fn().mockImplementation(() => {
        return new Promise((resolve, reject) => resolve());
    });
});


jest.mock('../src/adapter/z-stack/adapter/zStackAdapter', () => {
    return jest.fn().mockImplementation(() => {
        return {
            on: (event, handler) => mockAdapterEvents[event] = handler,
            start: mockAdapterStart,
            getCoordinator: () => {
                return {
                    ieeeAddr: '0x123',
                    networkAddress: 123,
                    manufacturerID: 100,
                    endpoints: [
                        {ID: 1, profileID: 2, deviceID: 3, inputClusters: [10], outputClusters: [11]},
                        {ID: 2, profileID: 3, deviceID: 5, inputClusters: [1], outputClusters: [0]},
                    ]
                }
            },
            softReset: mockAdapterSoftReset,
            supportsBackup: mockAdapterSupportsBackup,
            backup: () => {return {version: 'dummybackup'}},
            getCoordinatorVersion: () => {return {type: 'zStack', meta: {version: 1}}},
            getNetworkParameters: () => {return {panID: 1, extenedPanID: 3, channel: 15}},
            disableLED: mockDisableLED,
            nodeDescriptor: async (networkAddress) => {
                if (mockDevices[networkAddress].nodeDescriptor === 'xiaomi') {
                    await mockAdapterEvents['zclData']({
                        networkAddress,
                        frame: mockZclFrame.create(0, 1, true, null, 10, 'readRsp', 0, [{attrId: 5, status: 0, dataType: 66, attrData: 'lumi.occupancy'}]),
                        endpoint: 1,
                        linkquality: 50,
                        groupID: 1,
                    });
                    throw new Error('failed');
                } else {
                    return mockDevices[networkAddress].nodeDescriptor;
                }
            },
            activeEndpoints: (networkAddress) => mockDevices[networkAddress].activeEndpoints,
            simpleDescriptor: (networkAddress, endpoint) => {
                if (mockDevices[networkAddress].simpleDescriptor[endpoint] === undefined) {
                    throw new Error('Simple descriptor failed');
                }

                return mockDevices[networkAddress].simpleDescriptor[endpoint];
            },
            sendZclFrameNetworkAddressWithResponse: mockSendZclFrameNetworkAddressWithResponse,
            sendZclFrameNetworkAddress: mockSendZclFrameNetworkAddress,
            sendZclFrameGroup: mockSendZclFrameGroup,
            permitJoin: mockAdapterPermitJoin,
            stop: mockAdapterStop,
            removeDevice: mockAdapterRemoveDevice,
            lqi: (networkAddress) => {
                if (networkAddress === 140) {
                    return {neighbors: [
                        {ieeeAddr: '0x160', networkAddress: 160, linkquality: 20},
                        {ieeeAddr: '0x170', networkAddress: 170, linkquality: 21},
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
        };
    });
});

const events = {
    deviceJoined: [],
    deviceInterview: [],
    adapterDisconnected: [],
    deviceAnnounce: [],
    deviceLeave: [],
    message: [],
}

const backupPath = tmp.fileSync().name;

const options = {
    network: {
        panID: 0x1a63,
        channelList: [15],
    },
    serialPort: {
        baudRate: 115200,
        rtscts: true,
        path: '/dummy/conbee',
    },
    databasePath: tmp.fileSync().name,
    backupPath
}

const databaseContents = () => fs.readFileSync(options.databasePath).toString();

describe('Controller', () => {
    let controller: Controller;

    const removeAllDevices = async () => {
        for (const device of controller.getDevices({})) {
            device.removeFromDatabase();
        }
    }

    const removeAllGroups = async () => {
        for (const group of controller.getGroups({})) {
            group.removeFromDatabase();
        }
    }

    beforeEach(async () => {
        options.network.channelList = [15];
        Object.keys(events).forEach((key) => events[key] = []);
        controller = new Controller(options);
        controller.on('deviceJoined', (device) => events.deviceJoined.push(device));
        controller.on('deviceInterview', (device) => events.deviceInterview.push(deepClone(device)));
        controller.on('adapterDisconnected', () => events.adapterDisconnected.push(1));
        controller.on('deviceAnnounce', (device) => events.deviceAnnounce.push(device));
        controller.on('deviceLeave', (device) => events.deviceLeave.push(device));
        controller.on('message', (message) => events.message.push(message));
        mocksRestore.forEach((m) => m.mockRestore());
        mocksClear.forEach((m) => m.mockClear());
        jest.useRealTimers();
    });

    it('Call controller constructor options mixed with default options', async () => {
       expect(ZStackAdapter).toBeCalledWith({"networkKeyDistribute":false,"networkKey":[1,3,5,7,9,11,13,15,0,2,4,6,8,10,12,13],"panID":6755,"extenedPanID":[221,221,221,221,221,221,221,221],"channelList":[15]}, {"baudRate": 115200, "path": "/dummy/conbee", "rtscts": true}, backupPath);
    });

    it('Call controller constructor error on invalid channel', async () => {
        options.network.channelList = [10];
        expect(() => {
            new Controller(options);
        }).toThrowError("'10' is an invalid channel, use a channel between 11 - 26.");
    });

    it('Controller start', async () => {
        jest.useFakeTimers();
        await controller.start();
        expect(mockAdapterStart).toBeCalledTimes(1);
        expect(controller.getDevice({type: 'Coordinator'})).toEqual({"ID": 1, "applicationVersion": undefined, "dateCode": undefined, "meta": {}, "endpoints": [{"ID": 1, "deviceID": 3, "deviceIeeeAddress": "0x123", "deviceNetworkAddress": 123, "inputClusters": [10], "outputClusters": [11], "profileID": 2}, {"ID": 2, "deviceID": 5, "deviceIeeeAddress": "0x123", "deviceNetworkAddress": 123, "inputClusters": [1], "outputClusters": [0], "profileID": 3}], "hardwareVersion": undefined, "ieeeAddr": "0x123", "interviewCompleted": false, "interviewing": false, "manufacturerID": 100, "manufacturerName": undefined, "modelID": undefined, "networkAddress": 123, "powerSource": undefined, "softwareBuildID": undefined, "stackVersion": undefined, "type": "Coordinator", "zclVersion": undefined});
        expect(JSON.parse(fs.readFileSync(options.backupPath).toString())).toStrictEqual({version: 'dummybackup'});
        jest.advanceTimersByTime(86500000);
    });

    it('Controller stop, should create backup', async () => {
        await controller.start();
        fs.unlinkSync(options.backupPath);
        await controller.stop();
        expect(mockAdapterPermitJoin).toBeCalledWith(0);
        expect(JSON.parse(fs.readFileSync(options.backupPath).toString())).toStrictEqual({version: 'dummybackup'});
        expect(mockAdapterStop).toBeCalledTimes(1);
    });

    it('Disable led', async () => {
        await controller.start();
        await controller.disableLED();
        expect(mockDisableLED).toBeCalledTimes(1);
    });

    it('Get coordinator version', async () => {
        await controller.start();
        expect(await controller.getCoordinatorVersion()).toEqual({type: 'zStack', meta: {version: 1}});
    });

    it('Get network parameters', async () => {
        await controller.start();
        expect(await controller.getNetworkParameters()).toEqual({panID: 1, channel: 15, extenedPanID: 3});
    });

    it('Join a device', async () => {
        await controller.start();
        expect(databaseContents().includes("0x129")).toBeFalsy();
        await mockAdapterEvents['deviceJoined']({networkAddress: 129, ieeeAddr: '0x129'});
        expect(equalsPartial(events.deviceJoined[0].device, {ID: 2, networkAddress: 129, ieeeAddr: '0x129'})).toBeTruthy();
        expect(events.deviceInterview[0]).toStrictEqual({"device":{"meta": {}, "ID":2,"endpoints":[],"ieeeAddr":"0x129","interviewCompleted":false,"interviewing":false,"networkAddress":129},"status":"started"});
        const device = {"ID":2,"ieeeAddr":"0x129","networkAddress":129,"meta": {},"endpoints":[{"ID":1,"inputClusters":[1],"outputClusters":[2],"deviceNetworkAddress":129,"deviceIeeeAddress":"0x129","deviceID":5,"profileID":99}],"type":"Router","manufacturerID":1212,"manufacturerName":"KoenAndCo","powerSource":"Mains (single phase)","modelID":"myModelID","applicationVersion":2,"stackVersion":101,"zclVersion":1,"hardwareVersion":3,"dateCode":"201901","softwareBuildID":"1.01","interviewCompleted":true,"interviewing":false};
        expect(events.deviceInterview[1]).toStrictEqual({"status":"successful","device":device});
        expect(deepClone(controller.getDevice({ieeeAddr: '0x129'}))).toStrictEqual(device);
        expect(events.deviceInterview.length).toBe(2);
        expect(databaseContents().includes("0x129")).toBeTruthy();
    });

    it('Get device should return same instance', async () => {
        jest.useFakeTimers();
        await controller.start();
        await mockAdapterEvents['deviceJoined']({networkAddress: 129, ieeeAddr: '0x129'});
        expect(controller.getDevice({ieeeAddr: '0x129'})).toBe(controller.getDevice({ieeeAddr: '0x129'}));
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

    it('Device leave event and remove from database', async () => {
        await controller.start();
        await mockAdapterEvents['deviceJoined']({networkAddress: 129, ieeeAddr: '0x129'});
        expect(controller.getDevice({ieeeAddr: '0x129'})).toBeInstanceOf(Device);
        expect(events.deviceLeave.length).toBe(0);
        await mockAdapterEvents['deviceLeave']({networkAddress: 129, ieeeAddr: '0x129'});
        expect(events.deviceLeave.length).toBe(1);
        expect(events.deviceLeave[0]).toStrictEqual({ieeeAddr: '0x129'});
        expect(controller.getDeviceByAddress('0x129')).toBeFalsy();

        // leaves another time when not in database
        await mockAdapterEvents['deviceLeave']({networkAddress: 129, ieeeAddr: '0x129'});
        expect(events.deviceLeave.length).toBe(2);
        expect(events.deviceLeave[1]).toStrictEqual({ieeeAddr: '0x129'});
    });

    it('Start with reset should clear database', async () => {
        await controller.start();
        await mockAdapterEvents['deviceJoined']({networkAddress: 129, ieeeAddr: '0x129'});
        controller.createGroup(1);
        expect(controller.getGroup({groupID: 1})).toBeInstanceOf(Group);
        expect(controller.getDevice({ieeeAddr: '0x129'})).toBeInstanceOf(Device);
        expect((controller.getDevices({})).length).toBe(2);
        expect((controller.getDevices({type: 'Coordinator'}))[0].type).toBe('Coordinator');
        expect((controller.getDevices({type: 'Coordinator'}))[0].ieeeAddr).toBe('0x123');
        expect((controller.getDevices({type: 'Router'}))[0].ieeeAddr).toBe('0x129');
        expect(databaseContents().includes('0x129')).toBeTruthy()
        expect(databaseContents().includes('groupID')).toBeTruthy()
        await controller.stop();
        mockAdapterStart.mockReturnValueOnce("resetted");
        await controller.start();
        expect((controller.getDevices({})).length).toBe(1);
        expect((controller.getDevices({type: 'Coordinator'}))[0].type).toBe('Coordinator');
        expect(controller.getDeviceByAddress('0x129')).toBeFalsy();
        expect(controller.getGroup({groupID: 1})).toBeFalsy();
        // Items are marked as delete but still appear as lines in database, therefore we need to restart once
        // database will then remove deleted items.
        await controller.stop();
        await controller.start();
        expect(databaseContents().includes('0x129')).toBeFalsy()
        expect(databaseContents().includes('groupID')).toBeFalsy()
    });

    it('Controller permit joining', async () => {
        jest.useFakeTimers();
        await controller.start();
        await controller.permitJoin(true);
        expect(mockAdapterPermitJoin).toBeCalledTimes(1);
        expect(mockAdapterPermitJoin.mock.calls[0][0]).toBe(254);

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
    });

    it('Shouldnt create backup when adapter doesnt support it', async () => {
        mockAdapterSupportsBackup.mockReturnValue(false);
        fs.unlinkSync(options.backupPath);
        await controller.start();
        await controller.stop();
        expect(fs.existsSync(options.backupPath)).toBeFalsy();
    });

    it('Soft reset', async () => {
        await controller.start();
        await controller.softReset();
        expect(mockAdapterSoftReset).toBeCalledTimes(1);
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
        expect(events.deviceJoined.length).toBe(1);
        expect(equalsPartial(events.deviceJoined[0].device, {ID: 2, networkAddress: 129, ieeeAddr: '0x129'})).toBeTruthy();
        expect((controller.getDevice({ieeeAddr: '0x129'})).networkAddress).toBe(129);

        await mockAdapterEvents['deviceJoined']({networkAddress: 130, ieeeAddr: '0x129'});
        expect(events.deviceJoined.length).toBe(1);
        expect((controller.getDevice({ieeeAddr: '0x129'})).networkAddress).toBe(130);
    });

    it('Device joins and interview succeeds', async () => {
        await controller.start();
        await removeAllDevices();
        await mockAdapterEvents['deviceJoined']({networkAddress: 129, ieeeAddr: '0x129'});
        expect(events.deviceInterview.length).toBe(2);
        expect(events.deviceInterview[0].status).toBe('started')
        expect(events.deviceInterview[0].device.ieeeAddr).toBe('0x129')
        expect(events.deviceInterview[1].status).toBe('successful')
        expect(events.deviceInterview[1].device.ieeeAddr).toBe('0x129')
    });

    it('Device joins and interview fails', async () => {
        await controller.start();
        await removeAllDevices();
        await mockAdapterEvents['deviceJoined']({networkAddress: 140, ieeeAddr: '0x140'});
        expect(events.deviceInterview.length).toBe(2);
        expect(events.deviceInterview[0].status).toBe('started')
        expect(events.deviceInterview[0].device.ieeeAddr).toBe('0x140')
        expect(events.deviceInterview[1].status).toBe('failed')
        expect(events.deviceInterview[1].device.ieeeAddr).toBe('0x140')
    });

    it('Device joins and interview fails because of no endpoints', async () => {
        await controller.start();
        await removeAllDevices();
        await mockAdapterEvents['deviceJoined']({networkAddress: 160, ieeeAddr: '0x160'});
        expect(events.deviceInterview.length).toBe(2);
        expect(events.deviceInterview[0].status).toBe('started')
        expect(events.deviceInterview[0].device.ieeeAddr).toBe('0x160')
        expect(events.deviceInterview[1].status).toBe('failed')
        expect(events.deviceInterview[1].device.ieeeAddr).toBe('0x160')
    });

    it('Device joins and interview iAs enrollment', async () => {
        await controller.start();
        const event = mockAdapterEvents['deviceJoined']({networkAddress: 170, ieeeAddr: '0x170'});
        await event;
        expect(events.deviceInterview.length).toBe(2);
        expect(events.deviceInterview[0].status).toBe('started')
        expect(events.deviceInterview[0].device.ieeeAddr).toBe('0x170')
        expect(events.deviceInterview[1].status).toBe('successful')
        expect(events.deviceInterview[1].device.ieeeAddr).toBe('0x170');
        expect(Wait).toBeCalledWith(3000);
        const write = mockSendZclFrameNetworkAddressWithResponse.mock.calls[3];
        expect(write[0]).toBe(170);
        expect(write[1]).toBe(1);
        expect(deepClone(write[2])).toStrictEqual({"Header":{"frameControl":{"frameType":0,"direction":0,"disableDefaultResponse":true,"manufacturerSpecific":false},"transactionSequenceNumber":17,"manufacturerCode":null,"commandIdentifier":2},"Payload":[{"attrId":16,"attrData":"0x123","dataType":240}],"ClusterID":1280});
        const enrollRsp = mockSendZclFrameNetworkAddress.mock.calls[0];
        expect(enrollRsp[0]).toBe(170);
        expect(enrollRsp[1]).toBe(1);
        expect(deepClone(enrollRsp[2])).toStrictEqual({"Header":{"frameControl":{"frameType":1,"direction":0,"disableDefaultResponse":false,"manufacturerSpecific":false},"transactionSequenceNumber":18,"manufacturerCode":null,"commandIdentifier":0},"Payload":{"enrollrspcode":0,"zoneid":23},"ClusterID":1280});
    });

    it('Receive zclData occupancy report', async () => {
        await controller.start();
        await removeAllDevices();
        await mockAdapterEvents['deviceJoined']({networkAddress: 129, ieeeAddr: '0x129'});
        await mockAdapterEvents['zclData']({
            networkAddress: 129,
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
                "ID":1,
                "ieeeAddr":"0x129",
                "networkAddress":129,
                "endpoints":[
                    {
                    "ID":1,
                    "inputClusters":[
                        1
                    ],
                    "outputClusters":[
                        2
                    ],
                    "deviceNetworkAddress":129,
                    "deviceIeeeAddress":"0x129",
                    "deviceID":5,
                    "profileID":99
                    }
                ],
                "type":"Router",
                "manufacturerID":1212,
                "manufacturerName":"KoenAndCo",
                "meta": {},
                "powerSource":"Mains (single phase)",
                "modelID":"myModelID",
                "applicationVersion":2,
                "stackVersion":101,
                "zclVersion":1,
                "hardwareVersion":3,
                "dateCode":"201901",
                "softwareBuildID":"1.01",
                "interviewCompleted":true,
                "interviewing":false
            },
            "endpoint":{
                "ID":1,
                "deviceID": 5,
                "inputClusters":[1],
                "outputClusters":[2],
                "deviceNetworkAddress":129,
                "deviceIeeeAddress":"0x129",
                "profileID": 99,
            },
            "data":{
                "occupancy":1
            },
            "linkquality":50,
            "groupID":1
         };
        expect(deepClone(events.message[0])).toStrictEqual(expected);
    });

    it('Receive zclData from unkonwn device shouldnt emit anything', async () => {
        await controller.start();
        await removeAllDevices();
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
        await removeAllDevices();
        await mockAdapterEvents['deviceJoined']({networkAddress: 129, ieeeAddr: '0x129'});
        await mockAdapterEvents['zclData']({
            networkAddress: 129,
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
               "ID":1,
               "ieeeAddr":"0x129",
               "networkAddress":129,
               "endpoints":[
                  {
                     "ID":1,
                     "inputClusters":[
                        1
                     ],
                     "outputClusters":[
                        2
                     ],
                     "deviceNetworkAddress":129,
                     "deviceIeeeAddress":"0x129",
                     "deviceID":5,
                     "profileID":99
                  },
                  {
                     "ID":3,
                     "inputClusters":[

                     ],
                     "outputClusters":[

                     ],
                     "deviceNetworkAddress":129,
                     "deviceIeeeAddress":"0x129"
                  }
               ],
               "type":"Router",
               "manufacturerID":1212,
               "manufacturerName":"KoenAndCo",
               "meta": {},
               "powerSource":"Mains (single phase)",
               "modelID":"myModelID",
               "applicationVersion":2,
               "stackVersion":101,
               "zclVersion":1,
               "hardwareVersion":3,
               "dateCode":"201901",
               "softwareBuildID":"1.01",
               "interviewCompleted":true,
               "interviewing":false
            },
            "endpoint":{
               "ID":3,
               "inputClusters":[

               ],
               "outputClusters":[

               ],
               "deviceNetworkAddress":129,
               "deviceIeeeAddress":"0x129"
            },
            "data":{
               "appVersion":3
            },
            "linkquality":52
         };
        expect(deepClone(events.message[0])).toStrictEqual(expected);
        expect((controller.getDevice({ieeeAddr: '0x129'})).getEndpoints().length).toBe(2);
    });

    it('Receive cluster command', async () => {
        await controller.start();
        await removeAllDevices();
        await mockAdapterEvents['deviceJoined']({networkAddress: 129, ieeeAddr: '0x129'});
        await mockAdapterEvents['zclData']({
            networkAddress: 129,
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
               "ID":1,
               "ieeeAddr":"0x129",
               "networkAddress":129,
               "endpoints":[
                  {
                     "ID":1,
                     "inputClusters":[
                        1
                     ],
                     "outputClusters":[
                        2
                     ],
                     "deviceNetworkAddress":129,
                     "deviceIeeeAddress":"0x129",
                     "deviceID":5,
                     "profileID":99
                  }
               ],
               "type":"Router",
               "manufacturerID":1212,
               "manufacturerName":"KoenAndCo",
               "meta": {},
               "powerSource":"Mains (single phase)",
               "modelID":"myModelID",
               "applicationVersion":2,
               "stackVersion":101,
               "zclVersion":1,
               "hardwareVersion":3,
               "dateCode":"201901",
               "softwareBuildID":"1.01",
               "interviewCompleted":true,
               "interviewing":false
            },
            "endpoint":{
               "ID":1,
               "inputClusters":[
                  1
               ],
               "outputClusters":[
                  2
               ],
               "deviceNetworkAddress":129,
               "deviceIeeeAddress":"0x129",
               "deviceID":5,
               "profileID":99
            },
            "data":{
               "value":256,
               "value2":13
            },
            "linkquality":19,
            "groupID":10
         };
        expect(deepClone(events.message[0])).toStrictEqual(expected);
    });

    it('Receive cluster command from unknown cluster', async () => {
        await controller.start();
        await removeAllDevices();
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
        await removeAllDevices();
        await mockAdapterEvents['deviceJoined']({networkAddress: 129, ieeeAddr: '0x129'});
        mockSendZclFrameNetworkAddress.mockClear();
        await mockAdapterEvents['zclData']({
            networkAddress: 129,
            frame: ZclFrame.create(1, 1, false, 4476, 29, 1, 5, {groupid: 1, sceneid: 1}),
            endpoint: 1,
            linkquality: 19,
            groupID: 10,
        });

        expect(mockSendZclFrameNetworkAddress).toBeCalledTimes(1);
        expect(mockSendZclFrameNetworkAddress).toBeCalledWith(
            129, 1,
            {"ClusterID": 5, "Header": {
                "commandIdentifier": 11, "frameControl":
                {"direction": 1, "disableDefaultResponse": true, "frameType": 0, "manufacturerSpecific": false},
                "manufacturerCode": null, "transactionSequenceNumber": 29},
                "Payload": {"cmdId": 1, "statusCode": 0}
            });
    });

    it('Receive zclData send default response fails', async () => {
        await controller.start();
        await removeAllDevices();
        await mockAdapterEvents['deviceJoined']({networkAddress: 129, ieeeAddr: '0x129'});
        mockSendZclFrameNetworkAddress.mockClear();
        mockSendZclFrameNetworkAddress.mockRejectedValueOnce("");
        await mockAdapterEvents['zclData']({
            networkAddress: 129,
            frame: ZclFrame.create(1, 1, false, 4476, 29, 1, 5, {groupid: 1, sceneid: 1}),
            endpoint: 1,
            linkquality: 19,
            groupID: 10,
        });

        expect(mockSendZclFrameNetworkAddress).toBeCalledTimes(1);
    });

    it('Respond to genTime read', async () => {
        await controller.start();
        await removeAllDevices();
        await mockAdapterEvents['deviceJoined']({networkAddress: 129, ieeeAddr: '0x129'});
        mockSendZclFrameNetworkAddress.mockClear();
        await mockAdapterEvents['zclData']({
            networkAddress: 129,
            frame: ZclFrame.create(0, 0, true, null, 40, 0, 10, [{attrId: 0}]),
            endpoint: 1,
            linkquality: 19,
            groupID: 10,
        });

        expect(mockSendZclFrameNetworkAddress).toBeCalledTimes(1);
        expect(mockSendZclFrameNetworkAddress.mock.calls[0][0]).toBe(129);
        expect(mockSendZclFrameNetworkAddress.mock.calls[0][1]).toBe(1);
        const message = mockSendZclFrameNetworkAddress.mock.calls[0][2];
        expect(message.Payload.length).toBe(1);
        expect(message.Payload[0].attrId).toBe(0);
        expect(message.Payload[0].dataType).toBe(226);
        expect(message.Payload[0].status).toBe(0);
        expect(message.Payload[0].attrData).toBeGreaterThan(600822353);
        delete message.Payload;
        expect(mockSendZclFrameNetworkAddress).toBeCalledWith(
            129, 1,
            {"ClusterID": 10, "Header": {
                "commandIdentifier": 1, "frameControl":
                {"direction": 1, "disableDefaultResponse": true, "frameType": 0, "manufacturerSpecific": false},
                "manufacturerCode": null, "transactionSequenceNumber": 40}
            });
    });

    it('Xiaomi end device joins', async () => {
        await controller.start();
        await removeAllDevices();
        await mockAdapterEvents['deviceJoined']({networkAddress: 150, ieeeAddr: '0x150'});


        expect(events.deviceInterview.length).toBe(2);
        expect(events.deviceInterview[0].status).toBe('started')
        expect(events.deviceInterview[0].device.ieeeAddr).toBe('0x150')
        expect(events.deviceInterview[1].status).toBe('successful')
        expect(events.deviceInterview[1].device.ieeeAddr).toBe('0x150')
        expect(deepClone(controller.getDevice({ieeeAddr: '0x150'}))).toStrictEqual(
            {
                "ID":1,
                "ieeeAddr":"0x150",
                "networkAddress":150,
                "endpoints":[
                   {
                      "ID":1,
                      "inputClusters":[

                      ],
                      "outputClusters":[

                      ],
                      "deviceNetworkAddress":150,
                      "deviceIeeeAddress":"0x150"
                   }
                ],
                "type":"EndDevice",
                "manufacturerID":4151,
                "manufacturerName":"LUMI",
                "meta": {},
                "powerSource":"Battery",
                "modelID":"lumi.occupancy",
                "interviewCompleted":true,
                "interviewing":false
             }
        );
    });

    it('Receive zclData report from unkown attribute', async () => {
        await controller.start();
        await removeAllDevices();
        await mockAdapterEvents['deviceJoined']({networkAddress: 129, ieeeAddr: '0x129'});
        const buffer = [28,95,17,3,10,5,0,66,21,108,117,109,105,46,115,101,110,115,111,114,95,119,108,101,97,107,46,97,113,49,1,255,66,34,1,33,213,12,3,40,33,4,33,168,19,5,33,43,0,6,36,0,0,5,0,0,8,33,4,2,10,33,0,0,100,16,0];
        await mockAdapterEvents['zclData']({
            networkAddress: 129,
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
                "ID":1,
                "ieeeAddr":"0x129",
                "networkAddress":129,
                "endpoints":[
                    {
                    "ID":1,
                    "inputClusters":[
                        1
                    ],
                    "outputClusters":[
                        2
                    ],
                    "deviceNetworkAddress":129,
                    "deviceIeeeAddress":"0x129",
                    "deviceID":5,
                    "profileID":99
                    }
                ],
                "type":"Router",
                "manufacturerID":1212,
                "manufacturerName":"KoenAndCo",
                "meta": {},
                "powerSource":"Mains (single phase)",
                "modelID":"myModelID",
                "applicationVersion":2,
                "stackVersion":101,
                "zclVersion":1,
                "hardwareVersion":3,
                "dateCode":"201901",
                "softwareBuildID":"1.01",
                "interviewCompleted":true,
                "interviewing":false
            },
            "endpoint":{
                "ID":1,
                "deviceID": 5,
                "inputClusters":[1],
                "outputClusters":[2],
                "deviceNetworkAddress":129,
                "deviceIeeeAddress":"0x129",
                "profileID": 99,
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
            "groupID":1
         };
        expect(deepClone(events.message[0])).toStrictEqual(expected);
    });

    it('Should roll-over transaction ID', async () => {
        await controller.start();
        await removeAllDevices();
        await mockAdapterEvents['deviceJoined']({networkAddress: 129, ieeeAddr: '0x129'});
        mockSendZclFrameNetworkAddressWithResponse.mockClear();
        const device = controller.getDevice({ieeeAddr: '0x129'});
        expect(device.isType('device')).toBeTruthy();
        const endpoint = device.getEndpoint(1);
        expect(endpoint.supportsOutputCluster("genDeviceTempCfg")).toBeTruthy();
        expect(endpoint.supportsOutputCluster("genBasic")).toBeFalsy();
        for (let i = 0; i < 300; i++) {
            await endpoint.read('genBasic', ['modelId']);
        }
        expect(mockSendZclFrameNetworkAddressWithResponse).toBeCalledTimes(300);

        const ids = [];
        for (let i = 0; i < 300; i++) {
            ids.push(mockSendZclFrameNetworkAddressWithResponse.mock.calls[i][2].Header.transactionSequenceNumber);
        }

        expect(ids.includes(255)).toBeTruthy();
        expect(ids.includes(256)).toBeFalsy();
    });

    it('Throw error when creating endpoint which already exists', async () => {
        await controller.start();
        await removeAllDevices();
        await mockAdapterEvents['deviceJoined']({networkAddress: 129, ieeeAddr: '0x129'});
        const device = controller.getDevice({ieeeAddr: '0x129'});
        let error;
        try {await device.createEndpoint(1)} catch (e) {error = e}
        expect(error).toStrictEqual(new Error("Device '0x129' already has an endpoint '1'"));
    });

    it('Throw error when device with ieeeAddr already exists', async () => {
        await controller.start();
        await removeAllDevices();
        await mockAdapterEvents['deviceJoined']({networkAddress: 140, ieeeAddr: '0x129'});
        let error;
        try {await Device.create('Router', '0x129', 140, null, null, null, null, null)} catch (e) {error = e}
        expect(error).toStrictEqual(new Error("Device with ieeeAddr '0x129' already exists"));
    });

    it('Throw error when interviewing and calling interview again', async () => {
        await controller.start();
        await removeAllDevices();
        await mockAdapterEvents['deviceJoined']({networkAddress: 140, ieeeAddr: '0x129'});
        const device = controller.getDeviceByAddress('0x129');
        const firstInterview = device.interview()
        let error;
        try {await device.interview()} catch (e) {error = e}
        expect(error).toStrictEqual(new Error("Interview - interview already in progress for '0x129'"));
        try {await firstInterview} catch (e) {}
    });

    it('Remove device from network', async () => {
        await controller.start();
        await mockAdapterEvents['deviceJoined']({networkAddress: 140, ieeeAddr: '0x140'});
        const device = controller.getDevice({ieeeAddr: '0x140'});
        await device.removeFromNetwork();
        expect(mockAdapterRemoveDevice).toBeCalledTimes(1);
        expect(mockAdapterRemoveDevice).toBeCalledWith(140, '0x140');
        expect(controller.getDeviceByAddress('0x140')).toBeFalsy();
    });

    it('Device lqi', async () => {
        await controller.start();
        await mockAdapterEvents['deviceJoined']({networkAddress: 140, ieeeAddr: '0x140'});
        const device = controller.getDevice({ieeeAddr: '0x140'});
        const result = await device.lqi();
        expect(result).toStrictEqual({neighbors: [
            {ieeeAddr: '0x160', networkAddress: 160, linkquality: 20},
            {ieeeAddr: '0x170', networkAddress: 170, linkquality: 21},
        ]});
    });

    it('Device routing table', async () => {
        await controller.start();
        await mockAdapterEvents['deviceJoined']({networkAddress: 140, ieeeAddr: '0x140'});
        const device = controller.getDevice({ieeeAddr: '0x140'});
        const result = await device.routingTable();
        expect(result).toStrictEqual({table: [
            {destinationAddress: 120, status: 'SUCCESS', nextHop: 1},
            {destinationAddress: 130, status: 'FAILED', nextHop: 2},
        ]});
    });

    it('Device ping', async () => {
        await controller.start();
        await mockAdapterEvents['deviceJoined']({networkAddress: 129, ieeeAddr: '0x129'});
        const device = controller.getDevice({ieeeAddr: '0x129'});
        mockSendZclFrameNetworkAddressWithResponse.mockClear();
        const result = await device.ping();
        expect(mockSendZclFrameNetworkAddressWithResponse).toBeCalledTimes(1);
        const call = mockSendZclFrameNetworkAddressWithResponse.mock.calls[0];
        expect(call[0]).toBe(129);
        expect(call[1]).toBe(1);
        expect(deepClone(call[2])).toStrictEqual({"ClusterID": 0, "Header": {"commandIdentifier": 0, "frameControl": {"direction": 0, "disableDefaultResponse": true, "frameType": 0, "manufacturerSpecific": false}, "manufacturerCode": null, "transactionSequenceNumber": 100}, "Payload": [{"attrId": 0}]});
    });

    it('Endpoint get id', async () => {
        await controller.start();
        await mockAdapterEvents['deviceJoined']({networkAddress: 129, ieeeAddr: '0x129'});
        const device = controller.getDevice({ieeeAddr: '0x129'});
        expect(device.getEndpoint(1).get('ID')).toBe(1);
    });

    it('Endpoint bind', async () => {
        await controller.start();
        await mockAdapterEvents['deviceJoined']({networkAddress: 129, ieeeAddr: '0x129'});
        await mockAdapterEvents['deviceJoined']({networkAddress: 170, ieeeAddr: '0x170'});
        const device = controller.getDevice({ieeeAddr: '0x129'});
        const target = controller.getDevice({ieeeAddr: '0x170'});
        const endpoint = device.getEndpoint(1);
        await endpoint.bind('genBasic', target.getEndpoint(1));
        expect(mockAdapterBind).toBeCalledWith(129, "0x129", 1, 0, "0x170", "endpoint", 1);
    });

    it('Group bind', async () => {
        await controller.start();
        await mockAdapterEvents['deviceJoined']({networkAddress: 129, ieeeAddr: '0x129'});
        const group = controller.createGroup(4);
        expect(group.isType('group')).toBeTruthy();
        const device = controller.getDevice({ieeeAddr: '0x129'});
        const endpoint = device.getEndpoint(1);
        await endpoint.bind('genPowerCfg', group);
        expect(mockAdapterBind).toBeCalledWith(129, "0x129", 1, 1, 4, "group", null);
    });

    it('Endpoint unbind', async () => {
        await controller.start();
        await mockAdapterEvents['deviceJoined']({networkAddress: 129, ieeeAddr: '0x129'});
        await mockAdapterEvents['deviceJoined']({networkAddress: 170, ieeeAddr: '0x170'});
        const device = controller.getDevice({ieeeAddr: '0x129'});
        const target = controller.getDevice({ieeeAddr: '0x170'});
        const endpoint = device.getEndpoint(1);
        await endpoint.unbind('genBasic', target.getEndpoint(1));
        expect(mockAdapterUnbind).toBeCalledWith(129, "0x129", 1, 0, "0x170", "endpoint", 1);
    });

    it('Group unbind', async () => {
        await controller.start();
        await mockAdapterEvents['deviceJoined']({networkAddress: 129, ieeeAddr: '0x129'});
        const group = controller.createGroup(5);
        expect(group.isType('group')).toBeTruthy();
        const device = controller.getDevice({ieeeAddr: '0x129'});
        const endpoint = device.getEndpoint(1);
        await endpoint.unbind('genPowerCfg', group);
        expect(mockAdapterUnbind).toBeCalledWith(129, "0x129", 1, 1, 5, "group", null);
    });

    it('Endpoint configure reporting', async () => {
        await controller.start();
        await mockAdapterEvents['deviceJoined']({networkAddress: 129, ieeeAddr: '0x129'});
        const device = controller.getDevice({ieeeAddr: '0x129'});
        const endpoint = device.getEndpoint(1);
        mockSendZclFrameNetworkAddressWithResponse.mockClear();
        await endpoint.configureReporting('genPowerCfg', [{
            attribute: 'mainsFrequency',
            minimumReportInterval: 1,
            maximumReportInterval: 10,
            reportableChange: 1,
        }])

        const call = mockSendZclFrameNetworkAddressWithResponse.mock.calls[0];
        expect(call[0]).toBe(129);
        expect(call[1]).toBe(1)
        expect(deepClone(call[2])).toStrictEqual({
            "Header":{
               "frameControl":{
                  "frameType":0,
                  "direction":0,
                  "disableDefaultResponse":true,
                  "manufacturerSpecific":false
               },
               "transactionSequenceNumber":106,
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
            "ClusterID":1
         });
    });

    it('Endpoint throw error', async () => {
        await controller.start();
        await mockAdapterEvents['deviceJoined']({networkAddress: 129, ieeeAddr: '0x129'});
        const device = controller.getDevice({ieeeAddr: '0x129'});
        const endpoint = device.getEndpoint(1);
        expect(endpoint.isType('endpoint')).toBeTruthy();
        let error;
        try {await endpoint.command('genIdentify', 'updateCommissionState', {action: 9})} catch (e) {error = e}
        expect(error).toStrictEqual(new Error("Parameter 'commstatemask' is missing"));
    });

    it('Throw error when creating group already exists', async () => {
        await controller.start();
        removeAllGroups();
        controller.createGroup(2);
        let error;
        try {controller.createGroup(2)} catch (e) {error = e}
        expect(error).toStrictEqual(new Error("Group with groupID '2' already exists"));
    });

    it('Add endpoint to group', async () => {
        await controller.start();
        await mockAdapterEvents['deviceJoined']({networkAddress: 129, ieeeAddr: '0x129'});
        const device = controller.getDevice({ieeeAddr: '0x129'});
        const endpoint = device.getEndpoint(1);
        removeAllGroups();
        const group = controller.createGroup(2);
        mockSendZclFrameNetworkAddressWithResponse.mockClear();
        await endpoint.addToGroup(group);
        const call = mockSendZclFrameNetworkAddressWithResponse.mock.calls[0];
        expect(call[0]).toBe(129);
        expect(call[1]).toBe(1);
        expect(deepClone(call[2])).toStrictEqual({"ClusterID": 4, "Header": {"commandIdentifier": 0, "frameControl": {"direction": 0, "disableDefaultResponse": true, "frameType": 1, "manufacturerSpecific": false}, "manufacturerCode": null, "transactionSequenceNumber": 107}, "Payload": {groupid: 2, groupname: ''}});
    });

    it('Remove endpoint from group', async () => {
        await controller.start();
        await mockAdapterEvents['deviceJoined']({networkAddress: 129, ieeeAddr: '0x129'});
        const device = controller.getDevice({ieeeAddr: '0x129'});
        const endpoint = device.getEndpoint(1);
        removeAllGroups();
        const group = controller.createGroup(2);
        mockSendZclFrameNetworkAddressWithResponse.mockClear();
        await endpoint.removeFromGroup(group);
        const call = mockSendZclFrameNetworkAddressWithResponse.mock.calls[0];
        expect(call[0]).toBe(129);
        expect(call[1]).toBe(1);
        expect(deepClone(call[2])).toStrictEqual({"ClusterID": 4, "Header": {"commandIdentifier": 3, "frameControl": {"direction": 0, "disableDefaultResponse": true, "frameType": 1, "manufacturerSpecific": false}, "manufacturerCode": null, "transactionSequenceNumber": 108}, "Payload": {groupid: 2}});
    });

    it('Group command', async () => {
        await controller.start();
        removeAllGroups();
        const group = controller.createGroup(2);
        await group.command('genOnOff', 'offWithEffect', {effectid: 9, effectvariant: 10});
        const call = mockSendZclFrameGroup.mock.calls[0];
        expect(call[0]).toBe(2);
        expect(deepClone(call[1])).toStrictEqual({"Header":{"frameControl":{"frameType":1,"direction":0,"disableDefaultResponse":true,"manufacturerSpecific":false},"transactionSequenceNumber":109,"manufacturerCode":null,"commandIdentifier":64},"Payload":{"effectid":9,"effectvariant":10},"ClusterID":6});
    });

    it('Group command throw error on missing parameter', async () => {
        await controller.start();
        removeAllGroups();
        const group = controller.createGroup(2);
        let error;
        try {await group.command('genIdentify', 'updateCommissionState', {action: 9})} catch (e) {error = e}
        expect(error).toStrictEqual(new Error("Parameter 'commstatemask' is missing"));
    });

    it('Endpoint command with options', async () => {
        await controller.start();
        await mockAdapterEvents['deviceJoined']({networkAddress: 129, ieeeAddr: '0x129'});
        const device = controller.getDevice({ieeeAddr: '0x129'});
        const endpoint = device.getEndpoint(1);
        mockSendZclFrameNetworkAddress.mockClear();
        await endpoint.command('genOnOff', 'off', {}, {manufacturerCode: 100, disableDefaultResponse: true})
        expect(mockSendZclFrameNetworkAddress.mock.calls[0][0]).toBe(129);
        expect(mockSendZclFrameNetworkAddress.mock.calls[0][1]).toBe(1);
        const expected = {"Header":{"frameControl":{"frameType":1,"direction":0,"disableDefaultResponse":true,"manufacturerSpecific":true},"transactionSequenceNumber":110,"manufacturerCode":100,"commandIdentifier":0},"Payload":{},"ClusterID":6};
        expect(deepClone(mockSendZclFrameNetworkAddress.mock.calls[0][2])).toStrictEqual(expected);
    });

    it('Device without meta should set meta to {}', async () => {
        const line = JSON.stringify({"id":3,"type":"EndDevice","ieeeAddr":"0x90fd9ffffe4b64ae","nwkAddr":19468,"manufId":4476,"manufName":"IKEA of Sweden","powerSource":"Battery","modelId":"TRADFRI remote control","epList":[1],"endpoints":{"1":{"profId":49246,"epId":1,"devId":2096,"inClusterList":[0,1,3,9,2821,4096],"outClusterList":[3,4,5,6,8,25,4096],"clusters":{}}},"appVersion":17,"stackVersion":87,"hwVersion":1,"dateCode":"20170302","swBuildId":"1.2.214","zclVersion":1,"interviewCompleted":true,"_id":"fJ5pmjqKRYbNvslK"});
        fs.writeFileSync(options.databasePath, "[" + line + "]");
        await controller.start();
        const expected = {"ID": 3, "applicationVersion": 17, "dateCode": "20170302", "endpoints": [{"ID": 1, "deviceID": 2096, "deviceIeeeAddress": "0x90fd9ffffe4b64ae", "deviceNetworkAddress": 19468, "inputClusters": [0, 1, 3, 9, 2821, 4096], "outputClusters": [3, 4, 5, 6, 8, 25, 4096], "profileID": 49246}], "hardwareVersion": 1, "ieeeAddr": "0x90fd9ffffe4b64ae", "interviewCompleted": true, "interviewing": false, "manufacturerID": 4476, "manufacturerName": "IKEA of Sweden", "meta": {}, "modelID": "TRADFRI remote control", "networkAddress": 19468, "powerSource": "Battery", "softwareBuildID": "1.2.214", "stackVersion": 87, "type": "EndDevice", "zclVersion": 1}
        expect(deepClone(controller.getDevice({ieeeAddr: "0x90fd9ffffe4b64ae"}))).toStrictEqual(expected);
    });

    it('Write to endpoint custom attributes', async () => {
        await controller.start();
        await removeAllDevices();
        await mockAdapterEvents['deviceJoined']({networkAddress: 129, ieeeAddr: '0x129'});
        mockSendZclFrameNetworkAddressWithResponse.mockClear();
        const device = controller.getDevice({ieeeAddr: '0x129'});
        const endpoint = device.getEndpoint(1);
        const options = {manufacturerCode: 0x100B, disableDefaultResponse: true};
        await endpoint.write('genBasic', {0x0031: {value: 0x000B, type: 0x19}}, options);
        expect(mockSendZclFrameNetworkAddressWithResponse).toBeCalledTimes(1);
        expect(mockSendZclFrameNetworkAddressWithResponse).toBeCalledWith(129, 1, {"ClusterID": 0, "Header": {"commandIdentifier": 2, "frameControl": {"direction": 0, "disableDefaultResponse": true, "frameType": 0, "manufacturerSpecific": true}, "manufacturerCode": 4107, "transactionSequenceNumber": 114}, "Payload": [{"attrData": 11, "attrId": 49, "dataType": 25}]});
    });

    it('Write to endpoint with unknown string attribute', async () => {
        await controller.start();
        await removeAllDevices();
        await mockAdapterEvents['deviceJoined']({networkAddress: 129, ieeeAddr: '0x129'});
        mockSendZclFrameNetworkAddressWithResponse.mockClear();
        const device = controller.getDevice({ieeeAddr: '0x129'});
        const endpoint = device.getEndpoint(1);
        let error;
        try {await endpoint.write('genBasic', {'UNKNOWN': {value: 0x000B, type: 0x19}}) } catch (e) {error = e}
        expect(error).toStrictEqual(new Error(`Unknown attribute 'UNKNOWN', specify either an existing attribute or a number`))
        expect(mockSendZclFrameNetworkAddressWithResponse).toBeCalledTimes(0);
    });

    it('Configure reporting endpoint custom attributes', async () => {
        await controller.start();
        await removeAllDevices();
        await mockAdapterEvents['deviceJoined']({networkAddress: 129, ieeeAddr: '0x129'});
        mockSendZclFrameNetworkAddressWithResponse.mockClear();
        const device = controller.getDevice({ieeeAddr: '0x129'});
        const endpoint = device.getEndpoint(1);
        await endpoint.configureReporting('hvacThermostat', [{
            attribute: {ID: 0x4003, type: 41},
            minimumReportInterval: 0,
            maximumReportInterval: 3600,
            reportableChange: 25,
        }]);

        expect(mockSendZclFrameNetworkAddressWithResponse).toBeCalledTimes(1);
        expect(mockSendZclFrameNetworkAddressWithResponse).toBeCalledWith(129, 1, {"Header":{"frameControl":{"frameType":0,"direction":0,"disableDefaultResponse":true,"manufacturerSpecific":false},"transactionSequenceNumber":121,"manufacturerCode":null,"commandIdentifier":6},"Payload":[{"direction":0,"attrId":16387,"dataType":41,"minRepIntval":0,"maxRepIntval":3600,"repChange":25}],"ClusterID":513});
    });


    it('Remove endpoint from all groups', async () => {
        await controller.start();
        await mockAdapterEvents['deviceJoined']({networkAddress: 129, ieeeAddr: '0x129'});
        const device = controller.getDevice({ieeeAddr: '0x129'});
        const endpoint = device.getEndpoint(1);
        mockSendZclFrameNetworkAddress.mockClear();
        await endpoint.removeFromAllGroups();
        const call = mockSendZclFrameNetworkAddress.mock.calls[0];
        expect(call[0]).toBe(129);
        expect(call[1]).toBe(1);
        expect(deepClone(call[2])).toStrictEqual({"ClusterID": 4, "Header": {"commandIdentifier": 4, "frameControl": {"direction": 0, "disableDefaultResponse": true, "frameType": 1, "manufacturerSpecific": false}, "manufacturerCode": null, "transactionSequenceNumber": 122}, "Payload": {}});
    });
});