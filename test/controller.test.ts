import "regenerator-runtime/runtime";
import tmp from 'tmp';
import {Controller} from '../src/controller';
import {ZStackAdapter} from '../src/adapter';
import equals from 'fast-deep-equal';
import fs from 'fs';
import { ZclFrame } from "../src/zcl";
import { Device } from "../src/controller/model";

const mockAdapterEvents = {};
const mockAdapterPermitJoin = jest.fn();
const mockAdapterStop = jest.fn();
const mockAdapterStart = jest.fn().mockReturnValue('resumed');
const mockDisableLED = jest.fn();
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

const mocks = [mockAdapterStart, mockAdapterPermitJoin, mockAdapterStop];
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
    }
}

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
            supportsBackup: () => true,
            backup: () => {return {version: 'dummybackup'}},
            getCoordinatorVersion: () => {return {type: 'zStack', meta: {version: 1}}},
            getNetworkParameters: () => {return {panID: 1, extenedPanID: 3, channel: 15}},
            disableLED: mockDisableLED,
            nodeDescriptor: (networkAddress) => mockDevices[networkAddress].nodeDescriptor,
            activeEndpoints: (networkAddress) => mockDevices[networkAddress].activeEndpoints,
            simpleDescriptor: (networkAddress, endpoint) => mockDevices[networkAddress].simpleDescriptor[endpoint],
            sendZclFrameNetworkAddressWithResponse: mockSendZclFrameNetworkAddressWithResponse,
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

    beforeEach(() => {
        options.network.channelList = [15];
        controller = new Controller(options);
        controller.on('deviceJoined', (device) => events.deviceJoined.push(device));
        controller.on('deviceInterview', (device) => events.deviceInterview.push(deepClone(device)));
        controller.on('adapterDisconnected', () => events.adapterDisconnected.push(1));
        controller.on('deviceAnnounce', (device) => events.deviceAnnounce.push(device));
        controller.on('deviceLeave', (device) => events.deviceLeave.push(device));
        controller.on('message', (device, message) => events.message.push({device, message}));
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
        await controller.start();
        expect(mockAdapterStart).toBeCalledTimes(1);
        expect(true).toBe(equals(await controller.getDevice({type: 'Coordinator'}), {"ID": 1, "applicationVersion": undefined, "dateCode": undefined, "endpoints": [{"ID": 1, "deviceID": 3, "deviceIeeeAddress": "0x123", "deviceNetworkAddress": 123, "inputClusters": [10], "outputClusters": [11], "profileID": 2}, {"ID": 2, "deviceID": 5, "deviceIeeeAddress": "0x123", "deviceNetworkAddress": 123, "inputClusters": [1], "outputClusters": [0], "profileID": 3}], "hardwareVersion": undefined, "ieeeAddr": "0x123", "interviewCompleted": false, "interviewing": false, "manufacturerID": 100, "manufacturerName": undefined, "modelID": undefined, "networkAddress": 123, "powerSource": undefined, "softwareBuildID": undefined, "stackVersion": undefined, "type": "Coordinator", "zclVersion": undefined}))
        expect(JSON.parse(fs.readFileSync(options.backupPath).toString())).toStrictEqual({version: 'dummybackup'});
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
});