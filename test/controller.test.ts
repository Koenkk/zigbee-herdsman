import "regenerator-runtime/runtime";
import tmp from 'tmp';
import {Controller} from '../src/controller';
import {ZStackAdapter} from '../src/adapter';
import equals from 'fast-deep-equal';
import fs from 'fs';
import { ZclFrame } from "../src/zcl";
import { Device, Group } from "../src/controller/model";
import * as Zcl from '../src/zcl';

const mockAdapterEvents = {};
const mockAdapterPermitJoin = jest.fn();
const mockAdapterSupportsBackup = jest.fn().mockReturnValue(true);
const mockAdapterSoftReset = jest.fn();
const mockAdapterStop = jest.fn();
const mockAdapterStart = jest.fn().mockReturnValue('resumed');
const mockDisableLED = jest.fn();
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
})

const mocks = [mockAdapterStart, mockAdapterPermitJoin, mockAdapterStop, mockSendZclFrameNetworkAddress];
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
    }
}

const mockZclFrame = ZclFrame;

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
            permitJoin: mockAdapterPermitJoin,
            stop: mockAdapterStop,
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
    let controller;

    const removeAllDevices = async () => {
        for (const device of await controller.getDevices({})) {
            await device.removeFromDatabase();
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
        mocks.forEach((m) => m.mockRestore());
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
        expect(true).toBe(equals(await controller.getDevice({type: 'Coordinator'}), {"ID": 1, "applicationVersion": undefined, "dateCode": undefined, "endpoints": [{"ID": 1, "deviceID": 3, "deviceIeeeAddress": "0x123", "deviceNetworkAddress": 123, "inputClusters": [10], "outputClusters": [11], "profileID": 2}, {"ID": 2, "deviceID": 5, "deviceIeeeAddress": "0x123", "deviceNetworkAddress": 123, "inputClusters": [1], "outputClusters": [0], "profileID": 3}], "hardwareVersion": undefined, "ieeeAddr": "0x123", "interviewCompleted": false, "interviewing": false, "manufacturerID": 100, "manufacturerName": undefined, "modelID": undefined, "networkAddress": 123, "powerSource": undefined, "softwareBuildID": undefined, "stackVersion": undefined, "type": "Coordinator", "zclVersion": undefined}))
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
        expect(equalsPartial(events.deviceJoined[0], {ID: 2, networkAddress: 129, ieeeAddr: '0x129'})).toBeTruthy();
        expect(events.deviceInterview[0]).toStrictEqual({"device":{"ID":2,"endpoints":[],"ieeeAddr":"0x129","interviewCompleted":false,"interviewing":false,"networkAddress":129},"status":"started"});
        const device = {"ID":2,"ieeeAddr":"0x129","networkAddress":129,"endpoints":[{"ID":1,"inputClusters":[1],"outputClusters":[2],"deviceNetworkAddress":129,"deviceIeeeAddress":"0x129","deviceID":5,"profileID":99}],"type":"Router","manufacturerID":1212,"manufacturerName":"KoenAndCo","powerSource":"Mains (single phase)","modelID":"myModelID","applicationVersion":2,"stackVersion":101,"zclVersion":1,"hardwareVersion":3,"dateCode":"201901","softwareBuildID":"1.01","interviewCompleted":true,"interviewing":false};
        expect(events.deviceInterview[1]).toStrictEqual({"status":"successful","device":device});
        expect(deepClone(await controller.getDevice({ieeeAddr: '0x129'}))).toStrictEqual(device);
        expect(events.deviceInterview.length).toBe(2);
        expect(databaseContents().includes("0x129")).toBeTruthy();
    });

    it('Get device should return same instance', async () => {
        jest.useFakeTimers();
        await controller.start();
        await mockAdapterEvents['deviceJoined']({networkAddress: 129, ieeeAddr: '0x129'});
        expect(await controller.getDevice({ieeeAddr: '0x129'})).toBe(await controller.getDevice({ieeeAddr: '0x129'}));
    });

    it('Device announce event', async () => {
        await controller.start();
        await mockAdapterEvents['deviceJoined']({networkAddress: 129, ieeeAddr: '0x129'});
        expect(events.deviceAnnounce.length).toBe(0);
        await mockAdapterEvents['deviceAnnounce']({networkAddress: 129, ieeeAddr: '0x129'});
        expect(events.deviceAnnounce.length).toBe(1);
        expect(events.deviceAnnounce[0].device).toBeInstanceOf(Device);
        expect(events.deviceAnnounce[0].device.get('ieeeAddr')).toBe('0x129');
        expect(events.deviceAnnounce[0].device.get('modelID')).toBe('myModelID');
    });

    it('Device leave event and remove from database', async () => {
        await controller.start();
        await mockAdapterEvents['deviceJoined']({networkAddress: 129, ieeeAddr: '0x129'});
        expect(await controller.getDevice({ieeeAddr: '0x129'})).toBeInstanceOf(Device);
        expect(events.deviceLeave.length).toBe(0);
        await mockAdapterEvents['deviceLeave']({networkAddress: 129, ieeeAddr: '0x129'});
        expect(events.deviceLeave.length).toBe(1);
        expect(events.deviceLeave[0]).toStrictEqual({ieeeAddr: '0x129'});
        expect(await controller.getDevice({ieeeAddr: '0x129'})).toBeNull();

        // leaves another time when not in database
        await mockAdapterEvents['deviceLeave']({networkAddress: 129, ieeeAddr: '0x129'});
        expect(events.deviceLeave.length).toBe(2);
        expect(events.deviceLeave[1]).toStrictEqual({ieeeAddr: '0x129'});
    });

    it('Start with reset should clear database', async () => {
        await controller.start();
        await mockAdapterEvents['deviceJoined']({networkAddress: 129, ieeeAddr: '0x129'});
        await controller.createGroup(1);
        expect(await controller.getGroup({groupID: 1})).toBeInstanceOf(Group);
        expect(await controller.getDevice({ieeeAddr: '0x129'})).toBeInstanceOf(Device);
        expect((await controller.getDevices({})).length).toBe(2);
        expect((await controller.getDevices({type: 'Coordinator'}))[0].type).toBe('Coordinator');
        expect((await controller.getDevices({type: 'Coordinator'}))[0].ieeeAddr).toBe('0x123');
        expect((await controller.getDevices({type: 'Router'}))[0].ieeeAddr).toBe('0x129');
        expect(databaseContents().includes('0x129')).toBeTruthy()
        expect(databaseContents().includes('groupID')).toBeTruthy()
        await controller.stop();
        mockAdapterStart.mockReturnValueOnce("resetted");
        await controller.start();
        expect((await controller.getDevices({})).length).toBe(1);
        expect((await controller.getDevices({type: 'Coordinator'}))[0].type).toBe('Coordinator');
        expect(await controller.getDevice({ieeeAddr: '0x129'})).toBeNull();
        expect(await controller.getGroup({groupID: 1})).toBeNull();
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
        expect(equalsPartial(events.deviceJoined[0], {ID: 2, networkAddress: 129, ieeeAddr: '0x129'})).toBeTruthy();
        expect((await controller.getDevice({ieeeAddr: '0x129'})).networkAddress).toBe(129);

        await mockAdapterEvents['deviceJoined']({networkAddress: 130, ieeeAddr: '0x129'});
        expect(events.deviceJoined.length).toBe(1);
        expect((await controller.getDevice({ieeeAddr: '0x129'})).networkAddress).toBe(130);
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
        expect(deepClone(await controller.getDevice({ieeeAddr: '0x150'}))).toStrictEqual(
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
                "powerSource":"Battery",
                "modelID":"lumi.occupancy",
                "interviewCompleted":true,
                "interviewing":false
             }
        );
    });

});