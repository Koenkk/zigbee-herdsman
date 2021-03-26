import "regenerator-runtime/runtime";
import {Znp} from '../../../src/adapter/z-stack/znp';
import {ZStackAdapter} from '../../../src/adapter/z-stack/adapter';
import {Constants as UnpiConstants} from '../../../src/adapter/z-stack/unpi';
import equals from 'fast-deep-equal/es6';
import * as Constants from '../../../src/adapter/z-stack/constants';
import fs from 'fs';
import path from 'path';
import * as Zcl from '../../../src/zcl';


const waitForResult = (payload, ID = null) => {
    ID = ID || 1;
    return {start: () => {return {promise: payload, ID}}, ID};
};

jest.mock('../../../src/utils/wait', () => {
    return jest.fn().mockImplementation((milliseconds) => {
        // Skip wait
        return new Promise((resolve) => {resolve()});
    });
});

function flushPromises() {
    return new Promise(resolve => setImmediate(resolve));
  }

function getRandomArbitrary(min, max) {
    return Math.random() * (max - min) + min;
  }

const getTempFile = () => {
    const tempPath = path.resolve('temp');
    if (!fs.existsSync(tempPath)){
        fs.mkdirSync(tempPath);
    }

    return path.join(tempPath, `temp_${getRandomArbitrary(1, 99999999)}`);
}

const Type = UnpiConstants.Type;
const Subsystem = UnpiConstants.Subsystem;
const {DevStates, NvItemsIds, NvSystemIds} = Constants.COMMON;

const mockZnpRequest = jest.fn().mockReturnValue({payload: {}});
const mockZnpWaitfor = jest.fn();
const mockZnpOpen = jest.fn();
const mockZnpClose = jest.fn();
const mockQueueExecute = jest.fn().mockImplementation(async (func) => await func());

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
     totalGroupIdentifiers: 5, endpointID: 1, profileID: 99, deviceID: 101, version: 3, groupIdentifierCount: 8 }
);

const touchlinkIdentifyRequest = Zcl.ZclFrame.create(
    Zcl.FrameType.SPECIFIC, Zcl.Direction.CLIENT_TO_SERVER, false,
    null, 12, 'identifyRequest', Zcl.Utils.getCluster('touchlink').ID,
    {transactionID: 1, duration: 65535}
);

const mocks = [mockZnpOpen, mockZnpWaitfor, mockZnpRequest, mockZnpClose];
const deepClone = (obj) => JSON.parse(JSON.stringify(obj));

const equalsPartial = (object, expected) => {
    for (const [key, value] of Object.entries(expected)) {
        if (!equals(object[key], value)) {
            return false;
        }
    }

    return true;
}

let znpReceived;
let znpClose;
let dataConfirmCode = 0;
let dataConfirmCodeReset = false;
let nodeDescRspErrorOnce = false;
let dataRequestCode = 0;
let dataRequestExtCode = 0;
let lastStartIndex = 0;

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
            waitFor: mockZnpWaitfor,
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

let sysVersionResponse;
let assocGetWithAddressNodeRelation;

const basicMocks = () => {
    mockZnpRequest.mockImplementation((subsystem, command, payload, expectedStatus) => {
        const missing = () => {
            const msg = `Not implemented - ${Subsystem[subsystem]} - ${command} - ${JSON.stringify(payload)}`;
            console.log(msg)
            throw new Error(msg);
        }

        if (subsystem === Subsystem.SYS && command === 'version' && equals(payload, {})) {
            return sysVersionResponse;
        } else if (subsystem === Subsystem.SYS && command === 'ping') {
            return {};
        } else if (subsystem === Subsystem.SYS && command === 'osalNvRead') {
            if (equalsPartial(payload, {id: NvItemsIds.ZNP_HAS_CONFIGURED_ZSTACK1, offset: 0})) {
                return {payload: {value: Buffer.from([0x55])}};
            } else if (equalsPartial(payload, {id: NvItemsIds.ZNP_HAS_CONFIGURED_ZSTACK3, offset: 0})) {
                return {payload: {value: Buffer.from([0x55])}};
            } else if (equalsPartial(payload, {id: NvItemsIds.CHANLIST, offset: 0})) {
                return {payload: {value: Buffer.from([0,8,0,0])}};
            } else if (equalsPartial(payload, {id: NvItemsIds.PRECFGKEYS_ENABLE, offset: 0})) {
                return {payload: {value: Buffer.from([0])}};
            } else if (equalsPartial(payload, {id: NvItemsIds.PRECFGKEY, offset: 0})) {
                return {payload: {value: Buffer.from(networkOptions.networkKey)}};
            } else if (equalsPartial(payload, {id: NvItemsIds.PANID, offset: 0})) {
                return {payload: {value: Buffer.from([networkOptions.panID, 0])}};
            } else if (equalsPartial(payload, {id: NvItemsIds.EXTENDED_PAN_ID, offset: 0})) {
                return {payload: {value: Buffer.from(networkOptions.extendedPanID)}};
            } else {
                missing();
            }
        } else if (subsystem === Subsystem.UTIL && command === 'getDeviceInfo') {
            return {payload: {devicestate: DevStates.ZB_COORD, ieeeaddr: '0x123'}};
        } else if (subsystem === Subsystem.UTIL && command === 'assocRemove') {
            return {payload: {}};
        } else if (subsystem === Subsystem.UTIL && command === 'assocGetWithAddress') {
            return {payload: {noderelation: assocGetWithAddressNodeRelation}};
        } else if (subsystem === Subsystem.UTIL && command === 'assocAdd') {
            return {payload: {}};
        } else if (subsystem === Subsystem.ZDO && command === 'activeEpReq') {
            return {};
        } else if (subsystem === Subsystem.ZDO && command === 'simpleDescReq') {
            return {};
        } else if (subsystem === Subsystem.SAPI && command === 'readConfiguration') {
            return {payload: {value: Buffer.from(networkOptions.networkKey)}};
        } else if (subsystem === Subsystem.ZDO && command === 'mgmtPermitJoinReq') {
            return {};
        } else if (subsystem === Subsystem.SYS && command === 'resetReq') {
            return {};
        } else if (subsystem === Subsystem.ZDO && command === 'extFindGroup') {
            return {payload: {status: 0}};
        } else if (subsystem === Subsystem.SYS && command === 'stackTune') {
            return {};
        } else if (subsystem === Subsystem.UTIL && command === 'ledControl') {
            return {};
        } else if (subsystem === Subsystem.ZDO && command === 'nodeDescReq') {
            return {};
        } else if (subsystem === Subsystem.AF && command === 'dataRequest') {
            if (dataRequestCode !== 0) {
                throw new Error(`Data request failed with code '${dataRequestCode}'`);
            }
            return {};
        } else if (subsystem === Subsystem.AF && command === 'dataRequestExt') {
            if (dataRequestExtCode !== 0) {
                throw new Error(`Data request failed with code '${dataRequestExtCode}'`);
            }
            return {};
        } else if (subsystem === Subsystem.ZDO && command === 'extNwkInfo') {
            return {payload: {panid: 20, extendedpanid: 10, channel: 12}};
        } else if (subsystem === Subsystem.ZDO && command === 'mgmtLqiReq') {
            lastStartIndex = payload.startindex;
            return {};
        } else if (subsystem === Subsystem.ZDO && command === 'mgmtRtgReq') {
            lastStartIndex = payload.startindex;
            return {};
        } else if (subsystem === Subsystem.ZDO && command === 'bindReq') {
            return {};
        } else if (subsystem === Subsystem.ZDO && command === 'unbindReq') {
            return {};
        } else if (subsystem === Subsystem.ZDO && command === 'mgmtLeaveReq') {
            return {};
        } else if (subsystem === Subsystem.AF && command === 'interPanCtl') {
            return {};
        } else if (subsystem === Subsystem.ZDO && command === 'extRouteDisc') {
            return {};
        } else if (subsystem === Subsystem.ZDO && command === 'nwkAddrReq') {
            return {};
        } else {
            missing();
        }
    });

    mockZnpWaitfor.mockImplementation((type, subsystem, command, payload) => {
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
}

const networkOptions = {
    panID: 123,
    extendedPanID: [1, 2, 3],
    channelList: [11],
    networkKey: [1,3,5,7,9,11,13,15,0,2,4,6,8,10,12,13],
    networkKeyDistribute: false,
}

const serialPortOptions = {
    baudRate: 800,
    rtscts: false,
    path: 'dummy',
};

Znp.isValidPath = jest.fn().mockReturnValue(true);
Znp.autoDetectPath = jest.fn().mockReturnValue("/dev/autodetected");

describe('zStackAdapter', () => {
    let adapter;

    beforeEach(() => {
        sysVersionResponse = {payload: {product: 1, revision: "20201026"}};
        adapter = new ZStackAdapter(networkOptions, serialPortOptions, 'backup.json', {concurrent: 3});
        mocks.forEach((m) => m.mockRestore());
        mockQueueExecute.mockClear();
        dataConfirmCode = 0;
        dataRequestCode = 0;
        dataRequestExtCode = 0;
        assocGetWithAddressNodeRelation = 1;
        networkOptions.networkKeyDistribute = false;
        dataConfirmCodeReset = false;
        nodeDescRspErrorOnce = false;
    });

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

    it('Start zStack 3.x.0 initialize', async () => {
        mockZnpRequest.mockImplementation((subsystem, command, payload, expectedStatus) => {
            const missing = () => {
                const msg = `Not implemented - ${Subsystem[subsystem]} - ${command} - ${JSON.stringify(payload)}`;
                console.log(msg)
                throw new Error(msg);
            }

            if (subsystem === Subsystem.SYS && command === 'version' && equals(payload, {})) {
                return {payload: {product: 1}};
            } else if (subsystem === Subsystem.SYS && command === 'ping') {
                return {};
            } else if (subsystem === Subsystem.ZDO && command === 'extFindGroup') {
                return {payload: {status: 0}};
            } else if (subsystem === Subsystem.SYS && command === 'osalNvRead') {
                if (equalsPartial(payload, {id: NvItemsIds.ZNP_HAS_CONFIGURED_ZSTACK3, offset: 0})) {
                    return {payload: {value: Buffer.from([0x55])}};
                } else if (equalsPartial(payload, {id: NvItemsIds.CHANLIST, offset: 0})) {
                    return {payload: {value: Buffer.from([0,8,0,0])}};
                } else if (equalsPartial(payload, {id: NvItemsIds.PRECFGKEYS_ENABLE, offset: 0})) {
                    return {payload: {value: Buffer.from([0])}};
                } else if (equalsPartial(payload, {id: NvItemsIds.PRECFGKEY, offset: 0})) {
                    // This one is invalid
                    return {payload: {value: Buffer.from([1, 2])}};
                } else {
                    missing();
                }
            } else if (subsystem === Subsystem.UTIL && command === 'getDeviceInfo') {
                return {payload: {devicestate: DevStates.ZB_COORD}};
            } else if (subsystem === Subsystem.ZDO && command === 'activeEpReq') {
                return {};
            } else if (subsystem === Subsystem.AF && command === 'register') {
                return {};
            } else if (subsystem === Subsystem.SYS && command === 'resetReq') {
                return {};
            } else if (subsystem === Subsystem.SYS && command === 'osalNvWrite') {
                return {};
            } else if (subsystem === Subsystem.APP_CNF && command === 'bdbSetChannel') {
                return {};
            } else if (subsystem === Subsystem.APP_CNF && command === 'bdbStartCommissioning') {
                return {};
            } else if (subsystem === Subsystem.SYS && command === 'osalNvItemInit') {
                return {};
            } else {
                missing();
            }
        });

        mockZnpWaitfor.mockImplementation((type, subsystem, command, payload) => {
            const missing = () => {
                const msg = `Not implemented - ${Type[type]} - ${Subsystem[subsystem]} - ${command} - ${JSON.stringify(payload)}`;
                console.log(msg)
                throw new Error(msg);
            }

            if (type === Type.AREQ && subsystem === Subsystem.ZDO && command === 'activeEpRsp') {
                return waitForResult({payload: {activeeplist: []}});
            } else if (type === Type.AREQ && subsystem === Subsystem.ZDO && command === 'stateChangeInd') {
                return waitForResult({payload: {activeeplist: []}});
            } else {
                missing();
            }
        });

        const result = await adapter.start();
        expect(result).toBe('reset');
        expect(Znp).toBeCalledWith("dummy", 800, false);
        expect(mockZnpOpen).toBeCalledTimes(1);
        expect(mockZnpRequest.mock.calls[0][1]).toBe('ping');
        expect(mockZnpRequest.mock.calls[1][1]).toBe('version');
        expect(mockZnpRequest.mock.calls[2][2].id).toBe(NvItemsIds.ZNP_HAS_CONFIGURED_ZSTACK3);
        expect(mockZnpRequest.mock.calls[3][2].id).toBe(NvItemsIds.ZNP_HAS_CONFIGURED_ZSTACK3);
        expect(mockZnpRequest.mock.calls[4][2].id).toBe(NvItemsIds.CHANLIST);
        expect(mockZnpRequest.mock.calls[5][2].id).toBe(NvItemsIds.PRECFGKEYS_ENABLE);
        expect(mockZnpRequest.mock.calls[6][1]).toBe('osalNvRead');
        expect(mockZnpRequest.mock.calls[6][2].id).toBe(NvItemsIds.PRECFGKEY);
        expect(mockZnpRequest.mock.calls[7][1]).toBe('resetReq');
        expect(mockZnpRequest.mock.calls[8][1]).toBe('osalNvWrite');
        expect(mockZnpRequest.mock.calls[8][2].value).toStrictEqual(Buffer.from([0x02]));
        expect(mockZnpRequest.mock.calls[9][1]).toBe('resetReq');
        expect(mockZnpRequest.mock.calls[10][1]).toBe('osalNvWrite');
        expect(mockZnpRequest.mock.calls[10][2].value).toStrictEqual(Buffer.from([0]));
        expect(mockZnpRequest.mock.calls[11][1]).toBe('osalNvWrite');
        expect(mockZnpRequest.mock.calls[11][2].value).toStrictEqual(Buffer.from([0]));
        expect(mockZnpRequest.mock.calls[12][1]).toBe('osalNvWrite');
        expect(mockZnpRequest.mock.calls[12][2].value).toStrictEqual(Buffer.from([1]));
        expect(mockZnpRequest.mock.calls[13][1]).toBe('osalNvWrite');
        expect(mockZnpRequest.mock.calls[13][2].value).toStrictEqual(Buffer.from([0, 8, 0, 0]));
        expect(mockZnpRequest.mock.calls[14][1]).toBe('osalNvWrite');
        expect(mockZnpRequest.mock.calls[14][2].value).toStrictEqual(Buffer.from([networkOptions.panID, 0]));
        expect(mockZnpRequest.mock.calls[15][1]).toBe('osalNvWrite');
        expect(mockZnpRequest.mock.calls[15][2].value).toStrictEqual(Buffer.from(networkOptions.extendedPanID));
        expect(mockZnpRequest.mock.calls[16][1]).toBe('osalNvWrite');
        expect(mockZnpRequest.mock.calls[16][2].value).toStrictEqual(Buffer.from(networkOptions.networkKey));
        expect(mockZnpRequest.mock.calls[17][1]).toBe('bdbSetChannel');
        expect(mockZnpRequest.mock.calls[17][2].channel).toStrictEqual(2048);
        expect(mockZnpRequest.mock.calls[18][1]).toBe('bdbSetChannel');
        expect(mockZnpRequest.mock.calls[18][2].channel).toStrictEqual(0);
        expect(mockZnpRequest.mock.calls[19][1]).toBe('bdbStartCommissioning');
        expect(mockZnpRequest.mock.calls[19][2].mode).toStrictEqual(4);
        expect(mockZnpWaitfor.mock.calls[0][2]).toBe('stateChangeInd');
        expect(mockZnpWaitfor.mock.calls[0][3].state).toStrictEqual(9);
        expect(mockZnpWaitfor.mock.calls[0][4]).toStrictEqual(60000);
        expect(mockZnpRequest.mock.calls[20][1]).toBe('bdbStartCommissioning');
        expect(mockZnpRequest.mock.calls[20][2].mode).toStrictEqual(2);
        expect(mockZnpRequest.mock.calls[21][1]).toBe('osalNvItemInit');
        expect(mockZnpRequest.mock.calls[21][2].id).toStrictEqual(NvItemsIds.ZNP_HAS_CONFIGURED_ZSTACK3);
        expect(mockZnpRequest.mock.calls[22][1]).toBe('osalNvWrite');
        expect(mockZnpRequest.mock.calls[22][2].value).toStrictEqual(Buffer.from([0x55]));
        expect(mockZnpRequest.mock.calls[23][1]).toBe('getDeviceInfo');
        expect(mockZnpRequest.mock.calls[24][1]).toBe('activeEpReq');
        expect(mockZnpRequest.mock.calls[25][1]).toBe('register');
        expect(mockZnpRequest.mock.calls[25][2].endpoint).toBe(1);
        expect(mockZnpRequest.mock.calls[25][2].appprofid).toBe(0x0104);
        expect(mockZnpRequest.mock.calls[26][1]).toBe('register');
        expect(mockZnpRequest.mock.calls[26][2].endpoint).toBe(2);
        expect(mockZnpRequest.mock.calls[26][2].appprofid).toBe(0x0101);
        expect(mockZnpRequest.mock.calls[27][1]).toBe('register');
        expect(mockZnpRequest.mock.calls[27][2].endpoint).toBe(3);
        expect(mockZnpRequest.mock.calls[27][2].appprofid).toBe(0x0105);
        expect(mockZnpRequest.mock.calls[28][1]).toBe('register');
        expect(mockZnpRequest.mock.calls[28][2].endpoint).toBe(4);
        expect(mockZnpRequest.mock.calls[28][2].appprofid).toBe(0x0107);
        expect(mockZnpRequest.mock.calls[29][1]).toBe('register');
        expect(mockZnpRequest.mock.calls[29][2].endpoint).toBe(5);
        expect(mockZnpRequest.mock.calls[29][2].appprofid).toBe(0x0108);
        expect(mockZnpRequest.mock.calls[30][1]).toBe('register');
        expect(mockZnpRequest.mock.calls[30][2].endpoint).toBe(6);
        expect(mockZnpRequest.mock.calls[30][2].appprofid).toBe(0x0109);
        expect(mockZnpRequest.mock.calls[31][1]).toBe('register');
        expect(mockZnpRequest.mock.calls[31][2].endpoint).toBe(8);
        expect(mockZnpRequest.mock.calls[31][2].appprofid).toBe(0x0104);
        expect(mockZnpRequest.mock.calls[31][2].appoutclusterlist).toStrictEqual([]);
        expect(mockZnpRequest.mock.calls[32][1]).toBe('register');
        expect(mockZnpRequest.mock.calls[32][2].endpoint).toBe(10);
        expect(mockZnpRequest.mock.calls[32][2].appprofid).toBe(0x0104);
        expect(mockZnpRequest.mock.calls[32][2].appoutclusterlist).toStrictEqual([]);
        expect(mockZnpRequest.mock.calls[33][1]).toBe('register');
        expect(mockZnpRequest.mock.calls[33][2].endpoint).toBe(11);
        expect(mockZnpRequest.mock.calls[33][2].appprofid).toBe(0x0104);
        expect(mockZnpRequest.mock.calls[33][2].appoutclusterlist).toStrictEqual([1280,1282]);
        expect(mockZnpRequest.mock.calls[34][1]).toBe('register');
        expect(mockZnpRequest.mock.calls[34][2].endpoint).toBe(110);
        expect(mockZnpRequest.mock.calls[34][2].appprofid).toBe(0x0104);
        expect(mockZnpRequest.mock.calls[34][2].appoutclusterlist).toStrictEqual([]);
        expect(mockZnpRequest.mock.calls[35][2].endpoint).toBe(12);
        expect(mockZnpRequest.mock.calls[35][2].appprofid).toBe(0xc05e);
        expect(mockZnpRequest.mock.calls[35][2].appoutclusterlist).toStrictEqual([]);
        expect(mockZnpRequest.mock.calls[36][2].endpoint).toBe(13);
        expect(mockZnpRequest.mock.calls[36][2].appprofid).toBe(0x0104);
        expect(mockZnpRequest.mock.calls[36][2].appinclusterlist).toStrictEqual([25]);
        expect(mockZnpRequest.mock.calls[37][2].endpoint).toBe(47);
        expect(mockZnpRequest.mock.calls[37][2].appprofid).toBe(0x0104);
        expect(mockZnpRequest.mock.calls[37][2].appinclusterlist).toStrictEqual([]);
        expect(mockZnpRequest.mock.calls[38][2].endpoint).toBe(242);
        expect(mockZnpRequest.mock.calls[38][2].appprofid).toBe(41440);
        expect(mockZnpRequest.mock.calls[38][2].appoutclusterlist).toStrictEqual([]);
        expect(mockZnpRequest.mock.calls[39][1]).toBe('extFindGroup');
        expect(mockZnpRequest).toHaveBeenCalledTimes(40);
    });

    it('Start zStack 3.x.0 initialize fails because of state change timeout', async () => {
        mockZnpRequest.mockImplementation((subsystem, command, payload, expectedStatus) => {
            const missing = () => {
                const msg = `Not implemented - ${Subsystem[subsystem]} - ${command} - ${JSON.stringify(payload)}`;
                console.log(msg)
                throw new Error(msg);
            }

            if (subsystem === Subsystem.SYS && command === 'version' && equals(payload, {})) {
                return {payload: {product: 1}};
            } else if (subsystem === Subsystem.SYS && command === 'ping') {
                return {};
            } else if (subsystem === Subsystem.SYS && command === 'osalNvRead') {
                if (equalsPartial(payload, {id: NvItemsIds.ZNP_HAS_CONFIGURED_ZSTACK3, offset: 0})) {
                    return {payload: {value: Buffer.from([0x55])}};
                } else if (equalsPartial(payload, {id: NvItemsIds.CHANLIST, offset: 0})) {
                    return {payload: {value: Buffer.from([0,8,0,0])}};
                } else if (equalsPartial(payload, {id: NvItemsIds.PRECFGKEYS_ENABLE, offset: 0})) {
                    return {payload: {value: Buffer.from([0])}};
                } else if (equalsPartial(payload, {id: NvItemsIds.PRECFGKEY, offset: 0})) {
                    // This one is invalid
                    return {payload: {value: Buffer.from([1, 2])}};
                } else {
                    missing();
                }
            } else if (subsystem === Subsystem.UTIL && command === 'getDeviceInfo') {
                return {payload: {devicestate: DevStates.ZB_COORD}};
            } else if (subsystem === Subsystem.ZDO && command === 'activeEpReq') {
                return {};
            } else if (subsystem === Subsystem.AF && command === 'register') {
                return {};
            } else if (subsystem === Subsystem.SYS && command === 'resetReq') {
                return {};
            } else if (subsystem === Subsystem.SYS && command === 'osalNvWrite') {
                return {};
            } else if (subsystem === Subsystem.APP_CNF && command === 'bdbSetChannel') {
                return {};
            } else if (subsystem === Subsystem.APP_CNF && command === 'bdbStartCommissioning') {
                return {};
            } else if (subsystem === Subsystem.SYS && command === 'osalNvItemInit') {
                return {};
            } else {
                missing();
            }
        });

        mockZnpWaitfor.mockImplementation((type, subsystem, command, payload) => {
            const missing = () => {
                const msg = `Not implemented - ${Type[type]} - ${Subsystem[subsystem]} - ${command} - ${JSON.stringify(payload)}`;
                console.log(msg)
                throw new Error(msg);
            }

            if (type === Type.AREQ && subsystem === Subsystem.ZDO && command === 'stateChangeInd') {
                return {start: () => {return {promise: new Promise((resolve, reject) => {reject('timeout')})}}};
            } else {
                missing();
            }
        });

        let error;
        try {await adapter.start()} catch (e) {error = e}

        expect(error).toStrictEqual(new Error('Coordinator failed to start, probably the panID is already in use, try a different panID or channel'))
    });

    it('Start zStack 1.2 initialize - already configured; extended pan id mismatch -> should be reset', async () => {
        networkOptions.networkKeyDistribute = true;
        adapter = new ZStackAdapter(networkOptions, serialPortOptions, 'backup.json');
        mockZnpRequest.mockImplementation(async (subsystem, command, payload, expectedStatus) => {
            const missing = () => {
                const msg = `Not implemented - ${Subsystem[subsystem]} - ${command} - ${JSON.stringify(payload)}`;
                console.log(msg)
                throw new Error(msg);
            }

            if (subsystem === Subsystem.SYS && command === 'version' && equals(payload, {})) {
                return {payload: {product: 0}};
            } else if (subsystem === Subsystem.SYS && command === 'ping') {
                return {};
            } else if (subsystem === Subsystem.ZDO && command === 'extFindGroup') {
                return {payload: {status: 0}};
            } else if (subsystem === Subsystem.SYS && command === 'osalNvRead') {
                if (equalsPartial(payload, {id: NvItemsIds.ZNP_HAS_CONFIGURED_ZSTACK1, offset: 0})) {
                    return {payload: {value: Buffer.from([0x55])}};
                } else if (equalsPartial(payload, {id: NvItemsIds.CHANLIST, offset: 0})) {
                    return {payload: {value: Buffer.from([0,8,0,0])}};
                } else if (equalsPartial(payload, {id: NvItemsIds.PRECFGKEYS_ENABLE, offset: 0})) {
                    return {payload: {value: Buffer.from([1])}};
                } else if (equalsPartial(payload, {id: NvItemsIds.PANID, offset: 0})) {
                    return {payload: {value: Buffer.from([networkOptions.panID, 0])}};
                } else if (equalsPartial(payload, {id: NvItemsIds.EXTENDED_PAN_ID, offset: 0})) {
                    // Mismatch
                    return {payload: {value: Buffer.from([1])}};
                } else {
                    missing();
                }
            } else if (subsystem === Subsystem.UTIL && command === 'getDeviceInfo') {
                return {payload: {devicestate: DevStates.ZB_COORD}};
            } else if (subsystem === Subsystem.ZDO && command === 'activeEpReq') {
                return {};
            } else if (subsystem === Subsystem.AF && command === 'register') {
                return {};
            } else if (subsystem === Subsystem.SYS && command === 'resetReq') {
                return {};
            } else if (subsystem === Subsystem.SYS && command === 'osalNvWrite') {
                return {};
            } else if (subsystem === Subsystem.SYS && command === 'osalNvItemInit') {
                return {};
            } else if (subsystem === Subsystem.SAPI && command === 'readConfiguration') {
                return {payload: {value: Buffer.from(networkOptions.networkKey)}};
            } else if (subsystem === Subsystem.SAPI && command === 'writeConfiguration') {
                return {};
            } else {
                missing();
            }
        });

        mockZnpWaitfor.mockImplementation((type, subsystem, command, payload) => {
            const missing = () => {
                const msg = `Not implemented - ${Type[type]} - ${Subsystem[subsystem]} - ${command} - ${JSON.stringify(payload)}`;
                console.log(msg)
                throw new Error(msg);
            }

            if (type === Type.AREQ && subsystem === Subsystem.ZDO && command === 'activeEpRsp') {
                return waitForResult({payload: {activeeplist: []}});
            } else if (type === Type.AREQ && subsystem === Subsystem.ZDO && command === 'stateChangeInd') {
                return waitForResult({payload: {activeeplist: []}});
            } else {
                missing();
            }
        });

        const result = await adapter.start();
        expect(result).toBe('reset');
        expect(Znp).toBeCalledWith("dummy", 800, false);
        expect(mockZnpOpen).toBeCalledTimes(1);
        expect(mockZnpRequest.mock.calls[0][1]).toBe('ping');
        expect(mockZnpRequest.mock.calls[1][1]).toBe('version');
        expect(mockZnpRequest.mock.calls[2][2].id).toBe(NvItemsIds.ZNP_HAS_CONFIGURED_ZSTACK1);
        expect(mockZnpRequest.mock.calls[3][2].id).toBe(NvItemsIds.ZNP_HAS_CONFIGURED_ZSTACK1);
        expect(mockZnpRequest.mock.calls[4][2].id).toBe(NvItemsIds.CHANLIST);
        expect(mockZnpRequest.mock.calls[5][2].id).toBe(NvItemsIds.PRECFGKEYS_ENABLE);
        expect(mockZnpRequest.mock.calls[6][1]).toBe('readConfiguration');
        expect(mockZnpRequest.mock.calls[6][2].id).toBe(NvItemsIds.PRECFGKEY);
        expect(mockZnpRequest.mock.calls[7][2].id).toBe(NvItemsIds.PANID);
        expect(mockZnpRequest.mock.calls[8][2].id).toBe(NvItemsIds.EXTENDED_PAN_ID);
        expect(mockZnpRequest.mock.calls[9][1]).toBe('resetReq');
        expect(mockZnpRequest.mock.calls[10][1]).toBe('osalNvWrite');
        expect(mockZnpRequest.mock.calls[10][2].value).toStrictEqual(Buffer.from([0x02]));
        expect(mockZnpRequest.mock.calls[11][1]).toBe('resetReq');
        expect(mockZnpRequest.mock.calls[12][1]).toBe('osalNvWrite');
        expect(mockZnpRequest.mock.calls[12][2].value).toStrictEqual(Buffer.from([0]));
        expect(mockZnpRequest.mock.calls[13][1]).toBe('osalNvWrite');
        expect(mockZnpRequest.mock.calls[13][2].value).toStrictEqual(Buffer.from([1]));
        expect(mockZnpRequest.mock.calls[14][1]).toBe('osalNvWrite');
        expect(mockZnpRequest.mock.calls[14][2].value).toStrictEqual(Buffer.from([1]));
        expect(mockZnpRequest.mock.calls[15][1]).toBe('osalNvWrite');
        expect(mockZnpRequest.mock.calls[15][2].value).toStrictEqual(Buffer.from([0, 8, 0, 0]));
        expect(mockZnpRequest.mock.calls[16][1]).toBe('osalNvWrite');
        expect(mockZnpRequest.mock.calls[16][2].value).toStrictEqual(Buffer.from([networkOptions.panID, 0]));
        expect(mockZnpRequest.mock.calls[17][1]).toBe('osalNvWrite');
        expect(mockZnpRequest.mock.calls[17][2].value).toStrictEqual(Buffer.from(networkOptions.extendedPanID));
        expect(mockZnpRequest.mock.calls[18][1]).toBe('writeConfiguration');
        expect(mockZnpRequest.mock.calls[18][2].value).toStrictEqual(Buffer.from(networkOptions.networkKey));
        expect(mockZnpRequest.mock.calls[19][1]).toBe('osalNvWrite');
        expect(mockZnpRequest.mock.calls[19][2].value).toStrictEqual(Buffer.from([0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0x5a, 0x69, 0x67, 0x42, 0x65, 0x65, 0x41, 0x6c, 0x6c, 0x69, 0x61, 0x6e, 0x63, 0x65, 0x30, 0x39, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]));
        expect(mockZnpRequest.mock.calls[20][1]).toBe('osalNvItemInit');
        expect(mockZnpRequest.mock.calls[20][2].id).toStrictEqual(NvItemsIds.ZNP_HAS_CONFIGURED_ZSTACK1);
        expect(mockZnpRequest.mock.calls[21][1]).toBe('osalNvWrite');
        expect(mockZnpRequest.mock.calls[21][2].value).toStrictEqual(Buffer.from([0x55]));
    });

    it('Start zStack 1.2 initialize - throw error on timeout and dont initialize', async () => {
        networkOptions.networkKeyDistribute = true;
        adapter = new ZStackAdapter(networkOptions, serialPortOptions, 'backup.json');
        mockZnpRequest.mockImplementation(async (subsystem, command, payload, expectedStatus) => {
            const missing = () => {
                const msg = `Not implemented - ${Subsystem[subsystem]} - ${command} - ${JSON.stringify(payload)}`;
                console.log(msg)
                throw new Error(msg);
            }

            if (subsystem === Subsystem.SYS && command === 'version' && equals(payload, {})) {
                return {payload: {product: 0}};
            } else if (subsystem === Subsystem.SYS && command === 'ping') {
                return {};
            } else if (subsystem === Subsystem.ZDO && command === 'extFindGroup') {
                return {payload: {status: 0}};
            } else if (subsystem === Subsystem.SYS && command === 'osalNvRead') {
                if (equalsPartial(payload, {id: NvItemsIds.ZNP_HAS_CONFIGURED_ZSTACK1, offset: 0})) {
                    return {payload: {value: Buffer.from([0x55])}};
                } else if (equalsPartial(payload, {id: NvItemsIds.CHANLIST, offset: 0})) {
                    return {payload: {value: Buffer.from([0,8,0,0])}};
                } else if (equalsPartial(payload, {id: NvItemsIds.PRECFGKEYS_ENABLE, offset: 0})) {
                    return {payload: {value: Buffer.from([1])}};
                } else if (equalsPartial(payload, {id: NvItemsIds.PANID, offset: 0})) {
                    return {payload: {value: Buffer.from([networkOptions.panID, 0])}};
                } else if (equalsPartial(payload, {id: NvItemsIds.EXTENDED_PAN_ID, offset: 0})) {
                    // Mismatch
                    return {payload: {value: Buffer.from([1])}};
                } else {
                    missing();
                }
            } else if (subsystem === Subsystem.UTIL && command === 'getDeviceInfo') {
                return {payload: {devicestate: DevStates.ZB_COORD}};
            } else if (subsystem === Subsystem.ZDO && command === 'activeEpReq') {
                return {};
            } else if (subsystem === Subsystem.AF && command === 'register') {
                return {};
            } else if (subsystem === Subsystem.SYS && command === 'resetReq') {
                return {};
            } else if (subsystem === Subsystem.SYS && command === 'osalNvWrite') {
                return {};
            } else if (subsystem === Subsystem.SYS && command === 'osalNvItemInit') {
                return {};
            } else if (subsystem === Subsystem.SAPI && command === 'readConfiguration') {
                throw new Error('timeout');
            } else if (subsystem === Subsystem.SAPI && command === 'writeConfiguration') {
                return {};
            } else {
                missing();
            }
        });

        mockZnpWaitfor.mockImplementation((type, subsystem, command, payload) => {
            const missing = () => {
                const msg = `Not implemented - ${Type[type]} - ${Subsystem[subsystem]} - ${command} - ${JSON.stringify(payload)}`;
                console.log(msg)
                throw new Error(msg);
            }

            if (type === Type.AREQ && subsystem === Subsystem.ZDO && command === 'activeEpRsp') {
                return waitForResult({payload: {activeeplist: []}});
            } else if (type === Type.AREQ && subsystem === Subsystem.ZDO && command === 'stateChangeInd') {
                return waitForResult({payload: {activeeplist: []}});
            } else {
                missing();
            }
        });

        let error;
        try {
            await adapter.start()
        } catch (e) {
            error = e;
        }

        expect(error).toStrictEqual(new Error('timeout'));
        expect(Znp).toBeCalledWith("dummy", 800, false);
        expect(mockZnpOpen).toBeCalledTimes(1);
        expect(mockZnpRequest.mock.calls[0][1]).toBe('ping');
        expect(mockZnpRequest.mock.calls[1][1]).toBe('version');
        expect(mockZnpRequest.mock.calls[2][2].id).toBe(NvItemsIds.ZNP_HAS_CONFIGURED_ZSTACK1);
        expect(mockZnpRequest.mock.calls[3][2].id).toBe(NvItemsIds.ZNP_HAS_CONFIGURED_ZSTACK1);
        expect(mockZnpRequest.mock.calls[4][2].id).toBe(NvItemsIds.CHANLIST);
        expect(mockZnpRequest.mock.calls[5][2].id).toBe(NvItemsIds.PRECFGKEYS_ENABLE);
        expect(mockZnpRequest.mock.calls[6][1]).toBe('readConfiguration');
        expect(mockZnpRequest.mock.calls[6][2].id).toBe(NvItemsIds.PRECFGKEY);
        expect(mockZnpRequest).toHaveBeenCalledTimes(7);
    });

    it('Start zStack 1.2 initialize - not configured; -> should be restored', async () => {
        networkOptions.networkKeyDistribute = true;
        adapter = new ZStackAdapter(networkOptions, serialPortOptions, 'backup.json');
        mockZnpRequest.mockImplementation(async (subsystem, command, payload, expectedStatus) => {
            const missing = () => {
                const msg = `Not implemented - ${Subsystem[subsystem]} - ${command} - ${JSON.stringify(payload)}`;
                console.log(msg)
                throw new Error(msg);
            }

            if (subsystem === Subsystem.SYS && command === 'version' && equals(payload, {})) {
                return {payload: {product: 0}};
            } else if (subsystem === Subsystem.SYS && command === 'ping') {
                return {};
            } else if (subsystem === Subsystem.ZDO && command === 'extFindGroup') {
                return {payload: {status: 0}};
            } else if (subsystem === Subsystem.SYS && command === 'osalNvRead') {
                if (equalsPartial(payload, {id: NvItemsIds.ZNP_HAS_CONFIGURED_ZSTACK1, offset: 0})) {
                    return {payload: {value: Buffer.from([0x00])}};
                } else {
                    missing();
                }
            } else if (subsystem === Subsystem.UTIL && command === 'getDeviceInfo') {
                return {payload: {devicestate: DevStates.ZB_COORD}};
            } else if (subsystem === Subsystem.ZDO && command === 'activeEpReq') {
                return {};
            } else if (subsystem === Subsystem.AF && command === 'register') {
                return {};
            } else if (subsystem === Subsystem.SYS && command === 'resetReq') {
                return {};
            } else if (subsystem === Subsystem.SYS && command === 'osalNvWrite') {
                return {};
            } else if (subsystem === Subsystem.SYS && command === 'osalNvItemInit') {
                return {};
            } else if (subsystem === Subsystem.SAPI && command === 'readConfiguration') {
                return {payload: {value: Buffer.from(networkOptions.networkKey)}};
            } else if (subsystem === Subsystem.SAPI && command === 'writeConfiguration') {
                return {};
            } else {
                missing();
            }
        });

        mockZnpWaitfor.mockImplementation((type, subsystem, command, payload) => {
            const missing = () => {
                const msg = `Not implemented - ${Type[type]} - ${Subsystem[subsystem]} - ${command} - ${JSON.stringify(payload)}`;
                console.log(msg)
                throw new Error(msg);
            }

            if (type === Type.AREQ && subsystem === Subsystem.ZDO && command === 'activeEpRsp') {
                return waitForResult({payload: {activeeplist: []}});
            } else if (type === Type.AREQ && subsystem === Subsystem.ZDO && command === 'stateChangeInd') {
                return waitForResult({payload: {activeeplist: []}});
            } else {
                missing();
            }
        });

        const result = await adapter.start();
        expect(result).toBe('restored');
        expect(Znp).toBeCalledWith("dummy", 800, false);
        expect(mockZnpOpen).toBeCalledTimes(1);
        expect(mockZnpRequest.mock.calls[0][1]).toBe('ping');
        expect(mockZnpRequest.mock.calls[1][1]).toBe('version');
        expect(mockZnpRequest.mock.calls[2][2].id).toBe(NvItemsIds.ZNP_HAS_CONFIGURED_ZSTACK1);
        expect(mockZnpRequest.mock.calls[2][2].id).toBe(NvItemsIds.ZNP_HAS_CONFIGURED_ZSTACK1);
        expect(mockZnpRequest.mock.calls[4][1]).toBe('resetReq');
        expect(mockZnpRequest.mock.calls[5][1]).toBe('osalNvWrite');
        expect(mockZnpRequest.mock.calls[5][2].value).toStrictEqual(Buffer.from([0x02]));
        expect(mockZnpRequest.mock.calls[6][1]).toBe('resetReq');
        expect(mockZnpRequest.mock.calls[7][1]).toBe('osalNvWrite');
        expect(mockZnpRequest.mock.calls[7][2].value).toStrictEqual(Buffer.from([0]));
        expect(mockZnpRequest.mock.calls[8][1]).toBe('osalNvWrite');
        expect(mockZnpRequest.mock.calls[8][2].value).toStrictEqual(Buffer.from([1]));
        expect(mockZnpRequest.mock.calls[9][1]).toBe('osalNvWrite');
        expect(mockZnpRequest.mock.calls[9][2].value).toStrictEqual(Buffer.from([1]));
        expect(mockZnpRequest.mock.calls[10][1]).toBe('osalNvWrite');
        expect(mockZnpRequest.mock.calls[10][2].value).toStrictEqual(Buffer.from([0, 8, 0, 0]));
        expect(mockZnpRequest.mock.calls[11][1]).toBe('osalNvWrite');
        expect(mockZnpRequest.mock.calls[11][2].value).toStrictEqual(Buffer.from([networkOptions.panID, 0]));
        expect(mockZnpRequest.mock.calls[12][1]).toBe('osalNvWrite');
        expect(mockZnpRequest.mock.calls[12][2].value).toStrictEqual(Buffer.from(networkOptions.extendedPanID));
        expect(mockZnpRequest.mock.calls[13][1]).toBe('writeConfiguration');
        expect(mockZnpRequest.mock.calls[13][2].value).toStrictEqual(Buffer.from(networkOptions.networkKey));
        expect(mockZnpRequest.mock.calls[14][1]).toBe('osalNvWrite');
        expect(mockZnpRequest.mock.calls[14][2].value).toStrictEqual(Buffer.from([0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0x5a, 0x69, 0x67, 0x42, 0x65, 0x65, 0x41, 0x6c, 0x6c, 0x69, 0x61, 0x6e, 0x63, 0x65, 0x30, 0x39, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]));
        expect(mockZnpRequest.mock.calls[15][1]).toBe('osalNvItemInit');
        expect(mockZnpRequest.mock.calls[15][2].id).toStrictEqual(NvItemsIds.ZNP_HAS_CONFIGURED_ZSTACK1);
        expect(mockZnpRequest.mock.calls[16][1]).toBe('osalNvWrite');
        expect(mockZnpRequest.mock.calls[16][2].value).toStrictEqual(Buffer.from([0x55]));
    });

    it('Start zStack 1.2 when it doesnt support version call (on old firmwares)', async () => {
        // https://github.com/Koenkk/zigbee-herdsman/issues/129
        networkOptions.networkKeyDistribute = true;
        adapter = new ZStackAdapter(networkOptions, serialPortOptions, 'backup.json');
        mockZnpRequest.mockImplementation(async (subsystem, command, payload, expectedStatus) => {
            const missing = () => {
                const msg = `Not implemented - ${Subsystem[subsystem]} - ${command} - ${JSON.stringify(payload)}`;
                console.log(msg)
                throw new Error(msg);
            }

            if (subsystem === Subsystem.SYS && command === 'version' && equals(payload, {})) {
                throw new Error('Not implemented');
            } else if (subsystem === Subsystem.SYS && command === 'ping') {
                return {};
            } else if (subsystem === Subsystem.ZDO && command === 'extFindGroup') {
                return {payload: {status: 0}};
            } else if (subsystem === Subsystem.SYS && command === 'osalNvRead') {
                if (equalsPartial(payload, {id: NvItemsIds.ZNP_HAS_CONFIGURED_ZSTACK1, offset: 0})) {
                    return {payload: {value: Buffer.from([0x00])}};
                } else {
                    missing();
                }
            } else if (subsystem === Subsystem.UTIL && command === 'getDeviceInfo') {
                return {payload: {devicestate: DevStates.ZB_COORD}};
            } else if (subsystem === Subsystem.ZDO && command === 'activeEpReq') {
                return {};
            } else if (subsystem === Subsystem.AF && command === 'register') {
                return {};
            } else if (subsystem === Subsystem.SYS && command === 'resetReq') {
                return {};
            } else if (subsystem === Subsystem.SYS && command === 'osalNvWrite') {
                return {};
            } else if (subsystem === Subsystem.SYS && command === 'osalNvItemInit') {
                return {};
            } else if (subsystem === Subsystem.SAPI && command === 'readConfiguration') {
                return {payload: {value: Buffer.from(networkOptions.networkKey)}};
            } else if (subsystem === Subsystem.SAPI && command === 'writeConfiguration') {
                return {};
            } else {
                missing();
            }
        });

        mockZnpWaitfor.mockImplementation((type, subsystem, command, payload) => {
            const missing = () => {
                const msg = `Not implemented - ${Type[type]} - ${Subsystem[subsystem]} - ${command} - ${JSON.stringify(payload)}`;
                console.log(msg)
                throw new Error(msg);
            }

            if (type === Type.AREQ && subsystem === Subsystem.ZDO && command === 'activeEpRsp') {
                return waitForResult({payload: {activeeplist: []}});
            } else if (type === Type.AREQ && subsystem === Subsystem.ZDO && command === 'stateChangeInd') {
                return waitForResult({payload: {activeeplist: []}});
            } else {
                missing();
            }
        });

        const result = await adapter.start();
        expect(result).toBe('restored');
    });

    it('Start zStack 3.0.x initialize', async () => {
        mockZnpRequest.mockImplementation((subsystem, command, payload, expectedStatus) => {
            const missing = () => {
                const msg = `Not implemented - ${Subsystem[subsystem]} - ${command} - ${JSON.stringify(payload)}`;
                console.log(msg)
                throw new Error(msg);
            }

            if (subsystem === Subsystem.SYS && command === 'version' && equals(payload, {})) {
                return {payload: {product: 2}};
            } else if (subsystem === Subsystem.SYS && command === 'ping') {
                return {};
            } else if (subsystem === Subsystem.ZDO && command === 'extFindGroup') {
                return {payload: {status: 0}};
            } else if (subsystem === Subsystem.SYS && command === 'osalNvRead') {
                if (equalsPartial(payload, {id: NvItemsIds.ZNP_HAS_CONFIGURED_ZSTACK3, offset: 0})) {
                    return {payload: {value: Buffer.from([0x55])}};
                } else if (equalsPartial(payload, {id: NvItemsIds.CHANLIST, offset: 0})) {
                    return {payload: {value: Buffer.from([0,8,0,0])}};
                } else if (equalsPartial(payload, {id: NvItemsIds.PRECFGKEYS_ENABLE, offset: 0})) {
                    return {payload: {value: Buffer.from([0])}};
                } else {
                    missing();
                }
            } else if (subsystem === Subsystem.UTIL && command === 'getDeviceInfo') {
                return {payload: {devicestate: DevStates.ZB_COORD}};
            } else if (subsystem === Subsystem.ZDO && command === 'activeEpReq') {
                return {};
            } else if (subsystem === Subsystem.AF && command === 'register') {
                return {};
            } else if (subsystem === Subsystem.SYS && command === 'resetReq') {
                return {};
            } else if (subsystem === Subsystem.SYS && command === 'osalNvWrite') {
                return {};
            } else if (subsystem === Subsystem.APP_CNF && command === 'bdbSetChannel') {
                return {};
            } else if (subsystem === Subsystem.APP_CNF && command === 'bdbStartCommissioning') {
                return {};
            } else if (subsystem === Subsystem.SYS && command === 'osalNvItemInit') {
                return {};
            } else if (subsystem === Subsystem.SAPI && command === 'readConfiguration') {
                // This one is invalid
                return {payload: {value: Buffer.from([1])}};
            } else {
                missing();
            }
        });

        mockZnpWaitfor.mockImplementation((type, subsystem, command, payload) => {
            const missing = () => {
                const msg = `Not implemented - ${Type[type]} - ${Subsystem[subsystem]} - ${command} - ${JSON.stringify(payload)}`;
                console.log(msg)
                throw new Error(msg);
            }

            if (type === Type.AREQ && subsystem === Subsystem.ZDO && command === 'activeEpRsp') {
                return waitForResult({payload: {activeeplist: []}});
            } else if (type === Type.AREQ && subsystem === Subsystem.ZDO && command === 'stateChangeInd') {
                return waitForResult({payload: {activeeplist: []}});
            } else {
                missing();
            }
        });

        const result = await adapter.start();
        expect(result).toBe('reset');
        expect(Znp).toBeCalledWith("dummy", 800, false);
        expect(mockZnpOpen).toBeCalledTimes(1);
        expect(mockZnpRequest.mock.calls[0][1]).toBe('ping');
        expect(mockZnpRequest.mock.calls[1][1]).toBe('version');
        expect(mockZnpRequest.mock.calls[2][2].id).toBe(NvItemsIds.ZNP_HAS_CONFIGURED_ZSTACK3);
        expect(mockZnpRequest.mock.calls[3][2].id).toBe(NvItemsIds.ZNP_HAS_CONFIGURED_ZSTACK3);
        expect(mockZnpRequest.mock.calls[4][2].id).toBe(NvItemsIds.CHANLIST);
        expect(mockZnpRequest.mock.calls[5][2].id).toBe(NvItemsIds.PRECFGKEYS_ENABLE);
        expect(mockZnpRequest.mock.calls[6][1]).toBe('readConfiguration');
        expect(mockZnpRequest.mock.calls[6][2].id).toBe(NvItemsIds.PRECFGKEY);
        expect(mockZnpRequest.mock.calls[7][1]).toBe('resetReq');
        expect(mockZnpRequest.mock.calls[8][1]).toBe('osalNvWrite');
        expect(mockZnpRequest.mock.calls[8][2].value).toStrictEqual(Buffer.from([0x02]));
        expect(mockZnpRequest.mock.calls[9][1]).toBe('resetReq');
        expect(mockZnpRequest.mock.calls[10][1]).toBe('osalNvWrite');
        expect(mockZnpRequest.mock.calls[10][2].value).toStrictEqual(Buffer.from([0]));
        expect(mockZnpRequest.mock.calls[11][1]).toBe('osalNvWrite');
        expect(mockZnpRequest.mock.calls[11][2].value).toStrictEqual(Buffer.from([0]));
        expect(mockZnpRequest.mock.calls[12][1]).toBe('osalNvWrite');
        expect(mockZnpRequest.mock.calls[12][2].value).toStrictEqual(Buffer.from([1]));
        expect(mockZnpRequest.mock.calls[13][1]).toBe('osalNvWrite');
        expect(mockZnpRequest.mock.calls[13][2].value).toStrictEqual(Buffer.from([0, 8, 0, 0]));
        expect(mockZnpRequest.mock.calls[14][1]).toBe('osalNvWrite');
        expect(mockZnpRequest.mock.calls[14][2].value).toStrictEqual(Buffer.from([networkOptions.panID, 0]));
        expect(mockZnpRequest.mock.calls[15][1]).toBe('osalNvWrite');
        expect(mockZnpRequest.mock.calls[15][2].value).toStrictEqual(Buffer.from(networkOptions.extendedPanID));
        expect(mockZnpRequest.mock.calls[16][1]).toBe('osalNvWrite');
        expect(mockZnpRequest.mock.calls[16][2].value).toStrictEqual(Buffer.from(networkOptions.networkKey));
        expect(mockZnpRequest.mock.calls[17][1]).toBe('bdbSetChannel');
        expect(mockZnpRequest.mock.calls[17][2].channel).toStrictEqual(2048);
        expect(mockZnpRequest.mock.calls[18][1]).toBe('bdbSetChannel');
        expect(mockZnpRequest.mock.calls[18][2].channel).toStrictEqual(0);
        expect(mockZnpRequest.mock.calls[19][1]).toBe('bdbStartCommissioning');
        expect(mockZnpRequest.mock.calls[19][2].mode).toStrictEqual(4);
        expect(mockZnpWaitfor.mock.calls[0][2]).toBe('stateChangeInd');
        expect(mockZnpWaitfor.mock.calls[0][3].state).toStrictEqual(9);
        expect(mockZnpWaitfor.mock.calls[0][4]).toStrictEqual(60000);
        expect(mockZnpRequest.mock.calls[20][1]).toBe('bdbStartCommissioning');
        expect(mockZnpRequest.mock.calls[20][2].mode).toStrictEqual(2);
        expect(mockZnpRequest.mock.calls[21][1]).toBe('osalNvItemInit');
        expect(mockZnpRequest.mock.calls[21][2].id).toStrictEqual(NvItemsIds.ZNP_HAS_CONFIGURED_ZSTACK3);
        expect(mockZnpRequest.mock.calls[22][1]).toBe('osalNvWrite');
        expect(mockZnpRequest.mock.calls[22][2].value).toStrictEqual(Buffer.from([0x55]));
        expect(mockZnpRequest.mock.calls[23][1]).toBe('getDeviceInfo');
        expect(mockZnpRequest.mock.calls[24][1]).toBe('activeEpReq');
        expect(mockZnpRequest.mock.calls[25][1]).toBe('register');
        expect(mockZnpRequest.mock.calls[25][2].endpoint).toBe(1);
        expect(mockZnpRequest.mock.calls[25][2].appprofid).toBe(0x0104);
        expect(mockZnpRequest.mock.calls[26][1]).toBe('register');
        expect(mockZnpRequest.mock.calls[26][2].endpoint).toBe(2);
        expect(mockZnpRequest.mock.calls[26][2].appprofid).toBe(0x0101);
        expect(mockZnpRequest.mock.calls[27][1]).toBe('register');
        expect(mockZnpRequest.mock.calls[27][2].endpoint).toBe(3);
        expect(mockZnpRequest.mock.calls[27][2].appprofid).toBe(0x0105);
        expect(mockZnpRequest.mock.calls[28][1]).toBe('register');
        expect(mockZnpRequest.mock.calls[28][2].endpoint).toBe(4);
        expect(mockZnpRequest.mock.calls[28][2].appprofid).toBe(0x0107);
        expect(mockZnpRequest.mock.calls[29][1]).toBe('register');
        expect(mockZnpRequest.mock.calls[29][2].endpoint).toBe(5);
        expect(mockZnpRequest.mock.calls[29][2].appprofid).toBe(0x0108);
        expect(mockZnpRequest.mock.calls[30][1]).toBe('register');
        expect(mockZnpRequest.mock.calls[30][2].endpoint).toBe(6);
        expect(mockZnpRequest.mock.calls[30][2].appprofid).toBe(0x0109);
        expect(mockZnpRequest.mock.calls[31][1]).toBe('register');
        expect(mockZnpRequest.mock.calls[31][2].endpoint).toBe(8);
        expect(mockZnpRequest.mock.calls[31][2].appprofid).toBe(0x0104);
        expect(mockZnpRequest.mock.calls[31][2].appoutclusterlist).toStrictEqual([]);
        expect(mockZnpRequest.mock.calls[32][1]).toBe('register');
        expect(mockZnpRequest.mock.calls[32][2].endpoint).toBe(10);
        expect(mockZnpRequest.mock.calls[32][2].appprofid).toBe(0x0104);
        expect(mockZnpRequest.mock.calls[32][2].appoutclusterlist).toStrictEqual([]);
        expect(mockZnpRequest.mock.calls[33][1]).toBe('register');
        expect(mockZnpRequest.mock.calls[33][2].endpoint).toBe(11);
        expect(mockZnpRequest.mock.calls[33][2].appprofid).toBe(0x0104);
        expect(mockZnpRequest.mock.calls[33][2].appoutclusterlist).toStrictEqual([1280,1282]);
        expect(mockZnpRequest.mock.calls[34][1]).toBe('register');
        expect(mockZnpRequest.mock.calls[34][2].endpoint).toBe(110);
        expect(mockZnpRequest.mock.calls[34][2].appprofid).toBe(0x0104);
        expect(mockZnpRequest.mock.calls[34][2].appoutclusterlist).toStrictEqual([]);
        expect(mockZnpRequest.mock.calls[35][2].endpoint).toBe(12);
        expect(mockZnpRequest.mock.calls[35][2].appprofid).toBe(0xc05e);
        expect(mockZnpRequest.mock.calls[35][2].appoutclusterlist).toStrictEqual([]);
        expect(mockZnpRequest.mock.calls[36][2].endpoint).toBe(13);
        expect(mockZnpRequest.mock.calls[36][2].appprofid).toBe(0x0104);
        expect(mockZnpRequest.mock.calls[36][2].appinclusterlist).toStrictEqual([25]);
        expect(mockZnpRequest.mock.calls[37][2].endpoint).toBe(47);
        expect(mockZnpRequest.mock.calls[37][2].appprofid).toBe(0x0104);
        expect(mockZnpRequest.mock.calls[37][2].appoutclusterlist).toStrictEqual([]);
        expect(mockZnpRequest.mock.calls[38][2].endpoint).toBe(242);
        expect(mockZnpRequest.mock.calls[38][2].appprofid).toBe(41440);
        expect(mockZnpRequest.mock.calls[38][2].appoutclusterlist).toStrictEqual([]);
        expect(mockZnpRequest.mock.calls[39][1]).toBe('extFindGroup');
        expect(mockZnpRequest).toHaveBeenCalledTimes(40);
    });

    it('Start zStack 3.x.0 resume and create green power group', async () => {
        mockZnpRequest.mockImplementation((subsystem, command, payload, expectedStatus) => {
            const missing = () => {
                const msg = `Not implemented - ${Subsystem[subsystem]} - ${command} - ${JSON.stringify(payload)}`;
                console.log(msg)
                throw new Error(msg);
            }

            if (subsystem === Subsystem.SYS && command === 'version' && equals(payload, {})) {
                return {payload: {product: 1}};
            } else if (subsystem === Subsystem.SYS && command === 'ping') {
                return {};
            } else if (subsystem === Subsystem.ZDO && command === 'extFindGroup') {
                return {payload: {status: 1}};
            } else if (subsystem === Subsystem.ZDO && command === 'extAddGroup') {
                return {};
            } else if (subsystem === Subsystem.SYS && command === 'osalNvRead') {
                if (equalsPartial(payload, {id: NvItemsIds.ZNP_HAS_CONFIGURED_ZSTACK3, offset: 0})) {
                    return {payload: {value: Buffer.from([0x55])}};
                } else if (equalsPartial(payload, {id: NvItemsIds.CHANLIST, offset: 0})) {
                    return {payload: {value: Buffer.from([0,8,0,0])}};
                } else if (equalsPartial(payload, {id: NvItemsIds.PRECFGKEYS_ENABLE, offset: 0})) {
                    return {payload: {value: Buffer.from([0])}};
                } else if (equalsPartial(payload, {id: NvItemsIds.PRECFGKEY, offset: 0})) {
                    return {payload: {value: Buffer.from(networkOptions.networkKey)}};
                } else if (equalsPartial(payload, {id: NvItemsIds.PANID, offset: 0})) {
                    return {payload: {value: Buffer.from([networkOptions.panID, 0])}};
                } else if (equalsPartial(payload, {id: NvItemsIds.EXTENDED_PAN_ID, offset: 0})) {
                    return {payload: {value: Buffer.from(networkOptions.extendedPanID)}};
                } else {
                    missing();
                }
            } else if (subsystem === Subsystem.UTIL && command === 'getDeviceInfo') {
                return {payload: {devicestate: -1}};
            } else if (subsystem === Subsystem.ZDO && command === 'activeEpReq') {
                return {};
            } else if (subsystem === Subsystem.AF && command === 'register') {
                return {};
            } else if (subsystem === Subsystem.SYS && command === 'resetReq') {
                return {};
            } else if (subsystem === Subsystem.SYS && command === 'osalNvWrite') {
                return {};
            } else if (subsystem === Subsystem.APP_CNF && command === 'bdbSetChannel') {
                return {};
            } else if (subsystem === Subsystem.APP_CNF && command === 'bdbStartCommissioning') {
                return {};
            } else if (subsystem === Subsystem.SYS && command === 'osalNvItemInit') {
                return {};
            } else if (subsystem === Subsystem.ZDO && command === 'startupFromApp') {
                return {};
            } else {
                missing();
            }
        });

        mockZnpWaitfor.mockImplementation((type, subsystem, command, payload) => {
            const missing = () => {
                const msg = `Not implemented - ${Type[type]} - ${Subsystem[subsystem]} - ${command} - ${JSON.stringify(payload)}`;
                console.log(msg)
                throw new Error(msg);
            }

            if (type === Type.AREQ && subsystem === Subsystem.ZDO && command === 'activeEpRsp') {
                return waitForResult({payload: {activeeplist: [1, 2, 3, 4, 5, 6, 8]}});
            } else if (type === Type.AREQ && subsystem === Subsystem.ZDO && command === 'stateChangeInd') {
                return waitForResult({payload: {activeeplist: []}});
            } else {
                missing();
            }
        });

        const result = await adapter.start();
        expect(result).toBe('resumed');
        expect(Znp).toBeCalledWith("dummy", 800, false);
        expect(mockZnpOpen).toBeCalledTimes(1);
        expect(mockZnpRequest.mock.calls[0][1]).toBe('ping');
        expect(mockZnpRequest.mock.calls[1][1]).toBe('version');
        expect(mockZnpRequest.mock.calls[2][2].id).toBe(NvItemsIds.ZNP_HAS_CONFIGURED_ZSTACK3);
        expect(mockZnpRequest.mock.calls[3][2].id).toBe(NvItemsIds.ZNP_HAS_CONFIGURED_ZSTACK3);
        expect(mockZnpRequest.mock.calls[4][2].id).toBe(NvItemsIds.CHANLIST);
        expect(mockZnpRequest.mock.calls[5][2].id).toBe(NvItemsIds.PRECFGKEYS_ENABLE);
        expect(mockZnpRequest.mock.calls[6][1]).toBe('osalNvRead');
        expect(mockZnpRequest.mock.calls[6][2].id).toBe(NvItemsIds.PRECFGKEY);
        expect(mockZnpRequest.mock.calls[7][1]).toBe('osalNvRead');
        expect(mockZnpRequest.mock.calls[7][2].id).toBe(NvItemsIds.PANID);
        expect(mockZnpRequest.mock.calls[8][1]).toBe('osalNvRead');
        expect(mockZnpRequest.mock.calls[8][2].id).toBe(NvItemsIds.EXTENDED_PAN_ID);
        expect(mockZnpRequest.mock.calls[9][1]).toBe('getDeviceInfo');
        expect(mockZnpWaitfor.mock.calls[0][2]).toBe('stateChangeInd');
        expect(mockZnpWaitfor.mock.calls[0][3].state).toStrictEqual(9);
        expect(mockZnpWaitfor.mock.calls[0][4]).toStrictEqual(60000);
        expect(mockZnpRequest.mock.calls[10][1]).toBe('startupFromApp');
        expect(mockZnpWaitfor.mock.calls[1][2]).toBe('activeEpRsp');
        expect(mockZnpRequest.mock.calls[11][1]).toBe('activeEpReq');
        expect(mockZnpRequest.mock.calls[12][2].endpoint).toBe(10);
        expect(mockZnpRequest.mock.calls[12][2].appprofid).toBe(0x0104);
        expect(mockZnpRequest.mock.calls[12][2].appoutclusterlist).toStrictEqual([]);
        expect(mockZnpRequest.mock.calls[13][2].endpoint).toBe(11);
        expect(mockZnpRequest.mock.calls[13][2].appprofid).toBe(0x0104);
        expect(mockZnpRequest.mock.calls[13][2].appoutclusterlist).toStrictEqual([1280,1282]);
        expect(mockZnpRequest.mock.calls[14][2].endpoint).toBe(110);
        expect(mockZnpRequest.mock.calls[14][2].appprofid).toBe(0x0104);
        expect(mockZnpRequest.mock.calls[14][2].appoutclusterlist).toStrictEqual([]);
        expect(mockZnpRequest.mock.calls[15][2].endpoint).toBe(12);
        expect(mockZnpRequest.mock.calls[15][2].appprofid).toBe(0xc05e);
        expect(mockZnpRequest.mock.calls[15][2].appoutclusterlist).toStrictEqual([]);
        expect(mockZnpRequest.mock.calls[16][2].endpoint).toBe(13);
        expect(mockZnpRequest.mock.calls[16][2].appprofid).toBe(0x0104);
        expect(mockZnpRequest.mock.calls[16][2].appinclusterlist).toStrictEqual([25]);
        expect(mockZnpRequest.mock.calls[17][2].endpoint).toBe(47);
        expect(mockZnpRequest.mock.calls[17][2].appprofid).toBe(0x0104);
        expect(mockZnpRequest.mock.calls[17][2].appoutclusterlist).toStrictEqual([]);
        expect(mockZnpRequest.mock.calls[18][2].endpoint).toBe(242);
        expect(mockZnpRequest.mock.calls[18][2].appprofid).toBe(41440);
        expect(mockZnpRequest.mock.calls[18][2].appoutclusterlist).toStrictEqual([]);
        expect(mockZnpRequest.mock.calls[19][1]).toBe('extFindGroup');
        expect(mockZnpRequest.mock.calls[19][2]).toStrictEqual({"endpoint": 242, "groupid": 2948});
        expect(mockZnpRequest.mock.calls[20][1]).toBe('extAddGroup');
        expect(mockZnpRequest.mock.calls[20][2]).toStrictEqual({"endpoint": 242, "groupid": 2948, "groupname": [], "namelen": 0});
        expect(mockZnpRequest).toHaveBeenCalledTimes(21);
        expect(mockZnpWaitfor).toHaveBeenCalledTimes(2);
    });

    it('Start zStack 3.x.0 resume when panID doesnt match and is 0xFF 0xFF', async () => {
        mockZnpRequest.mockImplementation((subsystem, command, payload, expectedStatus) => {
            const missing = () => {
                const msg = `Not implemented - ${Subsystem[subsystem]} - ${command} - ${JSON.stringify(payload)}`;
                console.log(msg)
                throw new Error(msg);
            }

            if (subsystem === Subsystem.SYS && command === 'version' && equals(payload, {})) {
                return {payload: {product: 1}};
            } else if (subsystem === Subsystem.SYS && command === 'ping') {
                return {};
            } else if (subsystem === Subsystem.ZDO && command === 'extFindGroup') {
                return {payload: {status: 0}};
            } else if (subsystem === Subsystem.SYS && command === 'osalNvRead') {
                if (equalsPartial(payload, {id: NvItemsIds.ZNP_HAS_CONFIGURED_ZSTACK3, offset: 0})) {
                    return {payload: {value: Buffer.from([0x55])}};
                } else if (equalsPartial(payload, {id: NvItemsIds.CHANLIST, offset: 0})) {
                    return {payload: {value: Buffer.from([0,8,0,0])}};
                } else if (equalsPartial(payload, {id: NvItemsIds.PRECFGKEYS_ENABLE, offset: 0})) {
                    return {payload: {value: Buffer.from([0])}};
                } else if (equalsPartial(payload, {id: NvItemsIds.PRECFGKEY, offset: 0})) {
                    return {payload: {value: Buffer.from(networkOptions.networkKey)}};
                } else if (equalsPartial(payload, {id: NvItemsIds.PANID, offset: 0})) {
                    return {payload: {value: Buffer.from([0xFF, 0xFF])}};
                } else if (equalsPartial(payload, {id: NvItemsIds.EXTENDED_PAN_ID, offset: 0})) {
                    return {payload: {value: Buffer.from(networkOptions.extendedPanID)}};
                } else {
                    missing();
                }
            } else if (subsystem === Subsystem.UTIL && command === 'getDeviceInfo') {
                return {payload: {devicestate: -1}};
            } else if (subsystem === Subsystem.ZDO && command === 'activeEpReq') {
                return {};
            } else if (subsystem === Subsystem.AF && command === 'register') {
                return {};
            } else if (subsystem === Subsystem.SYS && command === 'resetReq') {
                return {};
            } else if (subsystem === Subsystem.SYS && command === 'osalNvWrite') {
                return {};
            } else if (subsystem === Subsystem.APP_CNF && command === 'bdbSetChannel') {
                return {};
            } else if (subsystem === Subsystem.APP_CNF && command === 'bdbStartCommissioning') {
                return {};
            } else if (subsystem === Subsystem.SYS && command === 'osalNvItemInit') {
                return {};
            } else if (subsystem === Subsystem.ZDO && command === 'startupFromApp') {
                return {};
            } else {
                missing();
            }
        });

        mockZnpWaitfor.mockImplementation((type, subsystem, command, payload) => {
            const missing = () => {
                const msg = `Not implemented - ${Type[type]} - ${Subsystem[subsystem]} - ${command} - ${JSON.stringify(payload)}`;
                console.log(msg)
                throw new Error(msg);
            }

            if (type === Type.AREQ && subsystem === Subsystem.ZDO && command === 'activeEpRsp') {
                return waitForResult({payload: {activeeplist: [1, 2, 3, 4, 5, 6, 8]}});
            } else if (type === Type.AREQ && subsystem === Subsystem.ZDO && command === 'stateChangeInd') {
                return waitForResult({payload: {activeeplist: []}});
            } else {
                missing();
            }
        });

        const result = await adapter.start();
        expect(result).toBe('resumed');
        expect(Znp).toBeCalledWith("dummy", 800, false);
        expect(mockZnpOpen).toBeCalledTimes(1);
        expect(mockZnpRequest.mock.calls[0][1]).toBe('ping');
        expect(mockZnpRequest.mock.calls[1][1]).toBe('version');
        expect(mockZnpRequest.mock.calls[2][2].id).toBe(NvItemsIds.ZNP_HAS_CONFIGURED_ZSTACK3);
        expect(mockZnpRequest.mock.calls[3][2].id).toBe(NvItemsIds.ZNP_HAS_CONFIGURED_ZSTACK3);
        expect(mockZnpRequest.mock.calls[4][2].id).toBe(NvItemsIds.CHANLIST);
        expect(mockZnpRequest.mock.calls[5][2].id).toBe(NvItemsIds.PRECFGKEYS_ENABLE);
        expect(mockZnpRequest.mock.calls[6][1]).toBe('osalNvRead');
        expect(mockZnpRequest.mock.calls[6][2].id).toBe(NvItemsIds.PRECFGKEY);
        expect(mockZnpRequest.mock.calls[7][1]).toBe('osalNvRead');
        expect(mockZnpRequest.mock.calls[7][2].id).toBe(NvItemsIds.PANID);
        expect(mockZnpRequest.mock.calls[8][1]).toBe('osalNvRead');
        expect(mockZnpRequest.mock.calls[8][2].id).toBe(NvItemsIds.PANID);
        expect(mockZnpRequest.mock.calls[9][1]).toBe('getDeviceInfo');
        expect(mockZnpWaitfor.mock.calls[0][2]).toBe('stateChangeInd');
        expect(mockZnpWaitfor.mock.calls[0][3].state).toStrictEqual(9);
        expect(mockZnpWaitfor.mock.calls[0][4]).toStrictEqual(60000);
        expect(mockZnpRequest.mock.calls[10][1]).toBe('startupFromApp');
        expect(mockZnpWaitfor.mock.calls[1][2]).toBe('activeEpRsp');
        expect(mockZnpRequest.mock.calls[11][1]).toBe('activeEpReq');
        expect(mockZnpRequest.mock.calls[12][2].endpoint).toBe(10);
        expect(mockZnpRequest.mock.calls[12][2].appprofid).toBe(0x0104);
        expect(mockZnpRequest.mock.calls[12][2].appoutclusterlist).toStrictEqual([]);
        expect(mockZnpRequest.mock.calls[13][2].endpoint).toBe(11);
        expect(mockZnpRequest.mock.calls[13][2].appprofid).toBe(0x0104);
        expect(mockZnpRequest.mock.calls[13][2].appoutclusterlist).toStrictEqual([1280,1282]);
        expect(mockZnpRequest.mock.calls[14][2].endpoint).toBe(110);
        expect(mockZnpRequest.mock.calls[14][2].appprofid).toBe(0x0104);
        expect(mockZnpRequest.mock.calls[14][2].appoutclusterlist).toStrictEqual([]);
        expect(mockZnpRequest.mock.calls[15][2].endpoint).toBe(12);
        expect(mockZnpRequest.mock.calls[15][2].appprofid).toBe(0xc05e);
        expect(mockZnpRequest.mock.calls[15][2].appoutclusterlist).toStrictEqual([]);
        expect(mockZnpRequest.mock.calls[16][2].endpoint).toBe(13);
        expect(mockZnpRequest.mock.calls[16][2].appprofid).toBe(0x0104);
        expect(mockZnpRequest.mock.calls[16][2].appinclusterlist).toStrictEqual([25]);
        expect(mockZnpRequest.mock.calls[17][2].endpoint).toBe(47);
        expect(mockZnpRequest.mock.calls[17][2].appprofid).toBe(0x0104);
        expect(mockZnpRequest.mock.calls[17][2].appoutclusterlist).toStrictEqual([]);
        expect(mockZnpRequest.mock.calls[18][2].endpoint).toBe(242);
        expect(mockZnpRequest.mock.calls[18][2].appprofid).toBe(41440);
        expect(mockZnpRequest.mock.calls[18][2].appoutclusterlist).toStrictEqual([]);
        expect(mockZnpRequest.mock.calls[19][1]).toBe('extFindGroup');
        expect(mockZnpRequest).toHaveBeenCalledTimes(20);
        expect(mockZnpWaitfor).toHaveBeenCalledTimes(2);
    });

    it('Start zStack 3.x.0 reset when panID doesnt match and is NOT 0xFF 0xFF', async () => {
        mockZnpRequest.mockImplementation((subsystem, command, payload, expectedStatus) => {
            const missing = () => {
                const msg = `Not implemented - ${Subsystem[subsystem]} - ${command} - ${JSON.stringify(payload)}`;
                console.log(msg)
                throw new Error(msg);
            }

            if (subsystem === Subsystem.SYS && command === 'version' && equals(payload, {})) {
                return {payload: {product: 1}};
            } else if (subsystem === Subsystem.SYS && command === 'ping') {
                return {};
            } else if (subsystem === Subsystem.ZDO && command === 'extFindGroup') {
                return {payload: {status: 0}};
            } else if (subsystem === Subsystem.SYS && command === 'osalNvRead') {
                if (equalsPartial(payload, {id: NvItemsIds.ZNP_HAS_CONFIGURED_ZSTACK3, offset: 0})) {
                    return {payload: {value: Buffer.from([0x55])}};
                } else if (equalsPartial(payload, {id: NvItemsIds.CHANLIST, offset: 0})) {
                    return {payload: {value: Buffer.from([0,8,0,0])}};
                } else if (equalsPartial(payload, {id: NvItemsIds.PRECFGKEYS_ENABLE, offset: 0})) {
                    return {payload: {value: Buffer.from([0])}};
                } else if (equalsPartial(payload, {id: NvItemsIds.PRECFGKEY, offset: 0})) {
                    return {payload: {value: Buffer.from(networkOptions.networkKey)}};
                } else if (equalsPartial(payload, {id: NvItemsIds.PANID, offset: 0})) {
                    return {payload: {value: Buffer.from([0xFF, 0xAA])}};
                } else if (equalsPartial(payload, {id: NvItemsIds.EXTENDED_PAN_ID, offset: 0})) {
                    return {payload: {value: Buffer.from(networkOptions.extendedPanID)}};
                } else {
                    missing();
                }
            } else if (subsystem === Subsystem.UTIL && command === 'getDeviceInfo') {
                return {payload: {devicestate: -1}};
            } else if (subsystem === Subsystem.ZDO && command === 'activeEpReq') {
                return {};
            } else if (subsystem === Subsystem.AF && command === 'register') {
                return {};
            } else if (subsystem === Subsystem.SYS && command === 'resetReq') {
                return {};
            } else if (subsystem === Subsystem.SYS && command === 'osalNvWrite') {
                return {};
            } else if (subsystem === Subsystem.APP_CNF && command === 'bdbSetChannel') {
                return {};
            } else if (subsystem === Subsystem.APP_CNF && command === 'bdbStartCommissioning') {
                return {};
            } else if (subsystem === Subsystem.SYS && command === 'osalNvItemInit') {
                return {};
            } else if (subsystem === Subsystem.ZDO && command === 'startupFromApp') {
                return {};
            } else {
                missing();
            }
        });

        mockZnpWaitfor.mockImplementation((type, subsystem, command, payload) => {
            const missing = () => {
                const msg = `Not implemented - ${Type[type]} - ${Subsystem[subsystem]} - ${command} - ${JSON.stringify(payload)}`;
                console.log(msg)
                throw new Error(msg);
            }

            if (type === Type.AREQ && subsystem === Subsystem.ZDO && command === 'activeEpRsp') {
                return waitForResult({payload: {activeeplist: [1, 2, 3, 4, 5, 6]}});
            } else if (type === Type.AREQ && subsystem === Subsystem.ZDO && command === 'stateChangeInd') {
                return waitForResult({payload: {activeeplist: []}});
            } else {
                missing();
            }
        });

        const result = await adapter.start();
        expect(result).toBe('reset');
    });

    it('Start restore from backup zStack 3.0.x', async () => {
        mockZnpRequest.mockImplementation((subsystem, command, payload, expectedStatus) => {
            const missing = () => {
                const msg = `Not implemented - ${Subsystem[subsystem]} - ${command} - ${JSON.stringify(payload)}`;
                console.log(msg)
                throw new Error(msg);
            }

            if (subsystem === Subsystem.SYS && command === 'version' && equals(payload, {})) {
                return {payload: {product: 2}};
            } else if (subsystem === Subsystem.SYS && command === 'ping') {
                return {};
            } else if (subsystem === Subsystem.ZDO && command === 'extFindGroup') {
                return {payload: {status: 0}};
            } else if (subsystem === Subsystem.SYS && command === 'osalNvRead') {
                if (equalsPartial(payload, {id: NvItemsIds.ZNP_HAS_CONFIGURED_ZSTACK3, offset: 0})) {
                    return {payload: {value: Buffer.from([0])}};
                } else {
                    missing();
                }
            } else if (subsystem === Subsystem.SYS && command === 'osalNvItemInit') {
                return {};
            } else if (subsystem === Subsystem.SYS && command === 'osalNvWrite') {
                return {};
            } else if (subsystem === Subsystem.SYS && command === 'resetReq') {
                return {};
            } else if (subsystem === Subsystem.UTIL && command === 'getDeviceInfo') {
                return {payload: {devicestate: DevStates.ZB_COORD}};
            } else if (subsystem === Subsystem.ZDO && command === 'activeEpReq') {
                return {};
            } else if (subsystem === Subsystem.ZDO && command === 'startupFromApp') {
                return {};
            } else {
                missing();
            }
        });

        mockZnpWaitfor.mockImplementation((type, subsystem, command, payload) => {
            const missing = () => {
                const msg = `Not implemented - ${Type[type]} - ${Subsystem[subsystem]} - ${command} - ${JSON.stringify(payload)}`;
                console.log(msg)
                throw new Error(msg);
            }

            if (type === Type.AREQ && subsystem === Subsystem.ZDO && command === 'activeEpRsp') {
                return waitForResult({payload: {activeeplist: [1, 2, 3, 4, 5, 6, 8, 10, 11, 110, 12, 13, 47, 242]}});
            } else if (type === Type.AREQ && subsystem === Subsystem.ZDO && command === 'stateChangeInd') {
                return waitForResult({payload: {activeeplist: []}});
            } else {
                missing();
            }
        });

        const backup = {"adapterType":"zStack","meta":{"product":2},"data":{"ZCD_NV_EXTADDR":{"id":1,"offset":0,"osal":true,"product":-1,"value":[174,68,1,18,0,75,18,0],"len":8},"ZCD_NV_NIB":{"id":33,"offset":0,"osal":true,"product":-1,"value":[230,5,2,16,20,16,0,20,0,0,0,1,5,1,143,7,0,2,5,30,0,0,14,0,0,0,0,0,0,0,0,0,0,114,60,8,0,64,0,0,15,15,4,0,1,0,0,0,1,0,0,0,0,174,68,1,18,0,75,18,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,60,3,0,1,120,10,1,0,0,65,0,0],"len":110},"ZCD_NV_PANID":{"id":131,"offset":0,"osal":true,"product":-1,"value":[123,0],"len":2},"ZCD_NV_EXTENDED_PAN_ID":{"id":45,"offset":0,"osal":true,"product":-1,"value":[1,2,3],"len":3},"ZCD_NV_NWK_ACTIVE_KEY_INFO":{"id":58,"offset":0,"osal":true,"product":-1,"value":[0,1,3,5,7,9,11,13,15,0,2,4,6,8,10,12,13],"len":17},"ZCD_NV_NWK_ALTERN_KEY_INFO":{"id":59,"offset":0,"osal":true,"product":-1,"value":[0,1,3,5,7,9,11,13,15,0,2,4,6,8,10,12,13],"len":17},"ZCD_NV_APS_USE_EXT_PANID":{"id":71,"offset":0,"osal":true,"product":-1,"value":[0,0,0,0,0,0,0,0],"len":8},"ZCD_NV_PRECFGKEY":{"id":98,"offset":0,"osal":true,"product":-1,"value":[1,3,5,7,9,11,13,15,0,2,4,6,8,10,12,13],"len":16},"ZCD_NV_PRECFGKEY_ENABLE":{"id":99,"offset":0,"osal":true,"product":-1,"value":[0],"len":1},"ZCD_NV_CHANLIST":{"id":132,"offset":0,"osal":true,"product":-1,"value":[0,8,0,0],"len":4},"ZCD_NV_LEGACY_TCLK_TABLE_START":{"id":273,"product":2,"offset":0,"osal":true,"value":[11,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,255,0,0,0],"len":20},"ZCD_NV_LEGACY_NWK_SEC_MATERIAL_TABLE_START":{"id":117,"product":2,"offset":0,"osal":true,"value":[123,63,0,0,174,68,1,18,0,75,18,0],"len":12}}};
        const backupFile = getTempFile();
        fs.writeFileSync(backupFile, JSON.stringify(backup), 'utf8');

        adapter = new ZStackAdapter(networkOptions, serialPortOptions, backupFile);
        const result = await adapter.start();
        expect(result).toBe('restored');
        expect(Znp).toBeCalledWith("dummy", 800, false);
        expect(mockZnpOpen).toBeCalledTimes(1);
        expect(mockZnpRequest.mock.calls[0][1]).toBe('ping');
        expect(mockZnpRequest.mock.calls[1][1]).toBe('version');
        expect(mockZnpRequest.mock.calls[2][2].id).toBe(NvItemsIds.ZNP_HAS_CONFIGURED_ZSTACK3);
        expect(mockZnpRequest.mock.calls[3][1]).toBe('version');
        expect(mockZnpRequest.mock.calls[4][1]).toBe('osalNvWrite');
        expect(mockZnpRequest.mock.calls[4][2]).toStrictEqual(backup.data.ZCD_NV_EXTADDR);
        expect(mockZnpRequest.mock.calls[5][1]).toBe('osalNvItemInit');
        expect(mockZnpRequest.mock.calls[5][2].value).toStrictEqual(backup.data.ZCD_NV_NIB.value);
        expect(mockZnpRequest.mock.calls[6][1]).toBe('osalNvWrite');
        expect(mockZnpRequest.mock.calls[6][2]).toStrictEqual(backup.data.ZCD_NV_NIB);
        expect(mockZnpRequest.mock.calls[7][1]).toBe('osalNvWrite');
        expect(mockZnpRequest.mock.calls[7][2]).toStrictEqual(backup.data.ZCD_NV_PANID);
        expect(mockZnpRequest.mock.calls[8][1]).toBe('osalNvWrite');
        expect(mockZnpRequest.mock.calls[8][2]).toStrictEqual(backup.data.ZCD_NV_EXTENDED_PAN_ID);
        expect(mockZnpRequest.mock.calls[9][1]).toBe('osalNvWrite');
        expect(mockZnpRequest.mock.calls[9][2]).toStrictEqual(backup.data.ZCD_NV_NWK_ACTIVE_KEY_INFO);
        expect(mockZnpRequest.mock.calls[10][1]).toBe('osalNvWrite');
        expect(mockZnpRequest.mock.calls[10][2]).toStrictEqual(backup.data.ZCD_NV_NWK_ALTERN_KEY_INFO);
        expect(mockZnpRequest.mock.calls[11][1]).toBe('osalNvWrite');
        expect(mockZnpRequest.mock.calls[11][2]).toStrictEqual(backup.data.ZCD_NV_APS_USE_EXT_PANID);
        expect(mockZnpRequest.mock.calls[12][1]).toBe('osalNvWrite');
        expect(mockZnpRequest.mock.calls[12][2]).toStrictEqual(backup.data.ZCD_NV_PRECFGKEY);
        expect(mockZnpRequest.mock.calls[13][1]).toBe('osalNvWrite');
        expect(mockZnpRequest.mock.calls[13][2]).toStrictEqual(backup.data.ZCD_NV_PRECFGKEY_ENABLE);
        expect(mockZnpRequest.mock.calls[14][1]).toBe('osalNvWrite');
        expect(mockZnpRequest.mock.calls[14][2]).toStrictEqual(backup.data.ZCD_NV_LEGACY_TCLK_TABLE_START);
        expect(mockZnpRequest.mock.calls[15][1]).toBe('osalNvWrite');
        expect(mockZnpRequest.mock.calls[15][2]).toStrictEqual(backup.data.ZCD_NV_LEGACY_NWK_SEC_MATERIAL_TABLE_START);
        expect(mockZnpRequest.mock.calls[16][2].id).toBe(NvItemsIds.ZNP_HAS_CONFIGURED_ZSTACK3);
        expect(mockZnpRequest.mock.calls[17][2].id).toBe(NvItemsIds.ZNP_HAS_CONFIGURED_ZSTACK3);
        expect(mockZnpRequest.mock.calls[18][1]).toBe('osalNvItemInit');
        expect(mockZnpRequest.mock.calls[18][2].initvalue).toStrictEqual([1]);
        expect(mockZnpRequest.mock.calls[19][1]).toBe('osalNvWrite');
        expect(mockZnpRequest.mock.calls[19][2].value).toStrictEqual([1]);
        expect(mockZnpRequest.mock.calls[20][1]).toBe('resetReq');
        expect(mockZnpRequest.mock.calls[21][1]).toBe('getDeviceInfo');
        expect(mockZnpRequest.mock.calls[22][1]).toBe('activeEpReq');
        expect(mockZnpRequest.mock.calls[23][1]).toBe('extFindGroup');
        expect(mockZnpRequest.mock.calls[24][1]).toBe('osalNvWrite');
        expect(mockZnpRequest.mock.calls[24][2].value).toStrictEqual(Buffer.from([0, 8, 0, 0]));
        expect(mockZnpRequest).toBeCalledTimes(25);
    });

    it('Start restore from backup zStack 3.x.0', async () => {
        mockZnpRequest.mockImplementation((subsystem, command, payload, expectedStatus) => {
            const missing = () => {
                const msg = `Not implemented - ${Subsystem[subsystem]} - ${command} - ${JSON.stringify(payload)}`;
                console.log(msg)
                throw new Error(msg);
            }

            if (subsystem === Subsystem.SYS && command === 'version' && equals(payload, {})) {
                return {payload: {product: 1}};
            } else if (subsystem === Subsystem.ZDO && command === 'extFindGroup') {
                return {payload: {status: 0}};
            } else if (subsystem === Subsystem.SYS && command === 'ping') {
                return {};
            } else if (subsystem === Subsystem.SYS && command === 'osalNvRead') {
                if (equalsPartial(payload, {id: NvItemsIds.ZNP_HAS_CONFIGURED_ZSTACK3, offset: 0})) {
                    return {payload: {value: Buffer.from([0])}};
                } else {
                    missing();
                }
            } else if (subsystem === Subsystem.SYS && command === 'osalNvItemInit') {
                return {};
            } else if (subsystem === Subsystem.SYS && command === 'osalNvWrite') {
                return {};
            } else if (subsystem === Subsystem.SYS && command === 'nvWrite') {
                return {};
            } else if (subsystem === Subsystem.SYS && command === 'resetReq') {
                return {};
            } else if (subsystem === Subsystem.UTIL && command === 'getDeviceInfo') {
                return {payload: {devicestate: DevStates.ZB_COORD}};
            } else if (subsystem === Subsystem.ZDO && command === 'activeEpReq') {
                return {};
            } else if (subsystem === Subsystem.ZDO && command === 'startupFromApp') {
                return {};
            } else {
                missing();
            }
        });

        mockZnpWaitfor.mockImplementation((type, subsystem, command, payload) => {
            const missing = () => {
                const msg = `Not implemented - ${Type[type]} - ${Subsystem[subsystem]} - ${command} - ${JSON.stringify(payload)}`;
                console.log(msg)
                throw new Error(msg);
            }

            if (type === Type.AREQ && subsystem === Subsystem.ZDO && command === 'activeEpRsp') {
                return waitForResult({payload: {activeeplist: [1, 2, 3, 4, 5, 6, 8, 10, 11, 110, 12, 13, 47, 242]}});
            } else if (type === Type.AREQ && subsystem === Subsystem.ZDO && command === 'stateChangeInd') {
                return waitForResult({payload: {activeeplist: []}});
            } else {
                missing();
            }
        });

        const backup = {"adapterType":"zStack","time":"Sat, 12 Oct 2019 11:44:30 GMT","meta":{"product":1},"data":{"ZCD_NV_EXTADDR":{"id":1,"offset":0,"osal":true,"product":-1,"value":[71,98,161,28,0,75,18,0],"len":8},"ZCD_NV_NIB":{"id":33,"offset":0,"osal":true,"product":-1,"value":[153,5,2,0,20,0,0,30,0,0,0,1,5,1,143,0,7,0,2,5,30,0,254,255,0,0,254,255,0,0,0,0,0,0,0,0,255,255,0,0,0,0,0,0,15,15,0,0,0,0,0,0,0,0,0,0,0,221,221,221,221,221,221,221,221,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,15,3,0,1,120,10,1,0,0,0,0,0,0,0],"len":116},"ZCD_NV_PANID":{"id":131,"offset":0,"osal":true,"product":-1,"value":[123,0],"len":2},"ZCD_NV_EXTENDED_PAN_ID":{"id":45,"offset":0,"osal":true,"product":-1,"value":[1,2,3],"len":3},"ZCD_NV_NWK_ACTIVE_KEY_INFO":{"id":58,"offset":0,"osal":true,"product":-1,"value":[0,1,3,5,7,9,11,13,15,0,2,4,6,8,10,12,13],"len":17},"ZCD_NV_NWK_ALTERN_KEY_INFO":{"id":59,"offset":0,"osal":true,"product":-1,"value":[0,1,3,5,7,9,11,13,15,0,2,4,6,8,10,12,13],"len":17},"ZCD_NV_APS_USE_EXT_PANID":{"id":71,"offset":0,"osal":true,"product":-1,"value":[0,0,0,0,0,0,0,0],"len":8},"ZCD_NV_PRECFGKEY":{"id":98,"offset":0,"osal":true,"product":-1,"value":[1,3,5,7,9,11,13,15,0,2,4,6,8,10,12,13],"len":16},"ZCD_NV_PRECFGKEY_ENABLE":{"id":99,"offset":0,"osal":true,"product":-1,"value":[0],"len":1},"ZCD_NV_CHANLIST":{"id":132,"offset":0,"osal":true,"product":-1,"value":[0,8,0,0],"len":4},"ZCD_NV_EX_TCLK_TABLE":{"sysid":1,"itemid":4,"subid":0,"product":1,"osal":false,"offset":0,"value":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,255,0,0,0],"len":20},"ZCD_NV_EX_NWK_SEC_MATERIAL_TABLE":{"sysid":1,"itemid":7,"subid":0,"product":1,"osal":false,"offset":0,"value":[1,0,0,0,221,221,221,221,221,221,221,221],"len":12}}};
        const backupFile = getTempFile();
        fs.writeFileSync(backupFile, JSON.stringify(backup), 'utf8');

        adapter = new ZStackAdapter(networkOptions, serialPortOptions, backupFile);
        const result = await adapter.start();
        expect(result).toBe('restored');
        expect(Znp).toBeCalledWith("dummy", 800, false);
        expect(mockZnpOpen).toBeCalledTimes(1);
        expect(mockZnpRequest.mock.calls[0][1]).toBe('ping');
        expect(mockZnpRequest.mock.calls[1][1]).toBe('version');
        expect(mockZnpRequest.mock.calls[2][2].id).toBe(NvItemsIds.ZNP_HAS_CONFIGURED_ZSTACK3);
        expect(mockZnpRequest.mock.calls[3][1]).toBe('version');
        expect(mockZnpRequest.mock.calls[4][1]).toBe('osalNvWrite');
        expect(mockZnpRequest.mock.calls[4][2]).toStrictEqual(backup.data.ZCD_NV_EXTADDR);
        expect(mockZnpRequest.mock.calls[5][1]).toBe('osalNvItemInit');
        expect(mockZnpRequest.mock.calls[5][2].value).toStrictEqual(backup.data.ZCD_NV_NIB.value);
        expect(mockZnpRequest.mock.calls[6][1]).toBe('osalNvWrite');
        expect(mockZnpRequest.mock.calls[6][2]).toStrictEqual(backup.data.ZCD_NV_NIB);
        expect(mockZnpRequest.mock.calls[7][1]).toBe('osalNvWrite');
        expect(mockZnpRequest.mock.calls[7][2]).toStrictEqual(backup.data.ZCD_NV_PANID);
        expect(mockZnpRequest.mock.calls[8][1]).toBe('osalNvWrite');
        expect(mockZnpRequest.mock.calls[8][2]).toStrictEqual(backup.data.ZCD_NV_EXTENDED_PAN_ID);
        expect(mockZnpRequest.mock.calls[9][1]).toBe('osalNvWrite');
        expect(mockZnpRequest.mock.calls[9][2]).toStrictEqual(backup.data.ZCD_NV_NWK_ACTIVE_KEY_INFO);
        expect(mockZnpRequest.mock.calls[10][1]).toBe('osalNvWrite');
        expect(mockZnpRequest.mock.calls[10][2]).toStrictEqual(backup.data.ZCD_NV_NWK_ALTERN_KEY_INFO);
        expect(mockZnpRequest.mock.calls[11][1]).toBe('osalNvWrite');
        expect(mockZnpRequest.mock.calls[11][2]).toStrictEqual(backup.data.ZCD_NV_APS_USE_EXT_PANID);
        expect(mockZnpRequest.mock.calls[12][1]).toBe('osalNvWrite');
        expect(mockZnpRequest.mock.calls[12][2]).toStrictEqual(backup.data.ZCD_NV_PRECFGKEY);
        expect(mockZnpRequest.mock.calls[13][1]).toBe('osalNvWrite');
        expect(mockZnpRequest.mock.calls[13][2]).toStrictEqual(backup.data.ZCD_NV_PRECFGKEY_ENABLE);
        expect(mockZnpRequest.mock.calls[14][1]).toBe('nvWrite');
        expect(mockZnpRequest.mock.calls[14][2]).toStrictEqual(backup.data.ZCD_NV_EX_TCLK_TABLE);
        expect(mockZnpRequest.mock.calls[15][1]).toBe('nvWrite');
        expect(mockZnpRequest.mock.calls[15][2]).toStrictEqual(backup.data.ZCD_NV_EX_NWK_SEC_MATERIAL_TABLE);
        expect(mockZnpRequest.mock.calls[16][2].id).toBe(NvItemsIds.ZNP_HAS_CONFIGURED_ZSTACK3);
        expect(mockZnpRequest.mock.calls[17][2].id).toBe(NvItemsIds.ZNP_HAS_CONFIGURED_ZSTACK3);
        expect(mockZnpRequest.mock.calls[18][1]).toBe('osalNvItemInit');
        expect(mockZnpRequest.mock.calls[18][2].initvalue).toStrictEqual([1]);
        expect(mockZnpRequest.mock.calls[19][1]).toBe('osalNvWrite');
        expect(mockZnpRequest.mock.calls[19][2].value).toStrictEqual([1]);
        expect(mockZnpRequest.mock.calls[20][1]).toBe('resetReq');
        expect(mockZnpRequest.mock.calls[21][1]).toBe('getDeviceInfo');
        expect(mockZnpRequest.mock.calls[22][1]).toBe('activeEpReq');
        expect(mockZnpRequest.mock.calls[23][1]).toBe('extFindGroup');
        expect(mockZnpRequest.mock.calls[24][1]).toBe('osalNvWrite');
        expect(mockZnpRequest.mock.calls[24][2].value).toStrictEqual(Buffer.from([0, 8, 0, 0]));
        expect(mockZnpRequest).toBeCalledTimes(25);
    });

    it('Start restore backup migration zStack 3.0.x -> zStack 3.x.0', async () => {
        mockZnpRequest.mockImplementation((subsystem, command, payload, expectedStatus) => {
            const missing = () => {
                const msg = `Not implemented - ${Subsystem[subsystem]} - ${command} - ${JSON.stringify(payload)}`;
                console.log(msg)
                throw new Error(msg);
            }

            if (subsystem === Subsystem.SYS && command === 'version' && equals(payload, {})) {
                return {payload: {product: 1}};
            } else if (subsystem === Subsystem.ZDO && command === 'extFindGroup') {
                return {payload: {status: 0}};
            } else if (subsystem === Subsystem.SYS && command === 'ping') {
                return {};
            } else if (subsystem === Subsystem.SYS && command === 'osalNvRead') {
                if (equalsPartial(payload, {id: NvItemsIds.ZNP_HAS_CONFIGURED_ZSTACK3, offset: 0})) {
                    return {payload: {value: Buffer.from([0])}};
                } else {
                    missing();
                }
            } else if (subsystem === Subsystem.SYS && command === 'osalNvItemInit') {
                return {};
            } else if (subsystem === Subsystem.SYS && command === 'osalNvWrite') {
                return {};
            } else if (subsystem === Subsystem.SYS && command === 'nvWrite') {
                return {};
            } else if (subsystem === Subsystem.SYS && command === 'resetReq') {
                return {};
            } else if (subsystem === Subsystem.UTIL && command === 'getDeviceInfo') {
                return {payload: {devicestate: DevStates.ZB_COORD}};
            } else if (subsystem === Subsystem.ZDO && command === 'activeEpReq') {
                return {};
            } else if (subsystem === Subsystem.ZDO && command === 'startupFromApp') {
                return {};
            } else {
                missing();
            }
        });

        mockZnpWaitfor.mockImplementation((type, subsystem, command, payload) => {
            const missing = () => {
                const msg = `Not implemented - ${Type[type]} - ${Subsystem[subsystem]} - ${command} - ${JSON.stringify(payload)}`;
                console.log(msg)
                throw new Error(msg);
            }

            if (type === Type.AREQ && subsystem === Subsystem.ZDO && command === 'activeEpRsp') {
                return waitForResult({payload: {activeeplist: [1, 2, 3, 4, 5, 6, 8, 10, 11, 110, 12, 13, 47, 242]}});
            } else if (type === Type.AREQ && subsystem === Subsystem.ZDO && command === 'stateChangeInd') {
                return waitForResult({payload: {activeeplist: []}});
            } else {
                missing();
            }
        });

        const backup = {"adapterType":"zStack","meta":{"product":2},"data":{"ZCD_NV_EXTADDR":{"id":1,"offset":0,"osal":true,"product":-1,"value":[174,68,1,18,0,75,18,0],"len":8},"ZCD_NV_NIB":{"id":33,"offset":0,"osal":true,"product":-1,"value":[230,5,2,16,20,16,0,20,0,0,0,1,5,1,143,7,0,2,5,30,0,0,14,0,0,0,0,0,0,0,0,0,0,114,60,8,0,64,0,0,15,15,4,0,1,0,0,0,1,0,0,0,0,174,68,1,18,0,75,18,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,60,3,0,1,120,10,1,0,0,65,0,0],"len":110},"ZCD_NV_PANID":{"id":131,"offset":0,"osal":true,"product":-1,"value":[123,0],"len":2},"ZCD_NV_EXTENDED_PAN_ID":{"id":45,"offset":0,"osal":true,"product":-1,"value":[1,2,3],"len":3},"ZCD_NV_NWK_ACTIVE_KEY_INFO":{"id":58,"offset":0,"osal":true,"product":-1,"value":[0,1,3,5,7,9,11,13,15,0,2,4,6,8,10,12,13],"len":17},"ZCD_NV_NWK_ALTERN_KEY_INFO":{"id":59,"offset":0,"osal":true,"product":-1,"value":[0,1,3,5,7,9,11,13,15,0,2,4,6,8,10,12,13],"len":17},"ZCD_NV_APS_USE_EXT_PANID":{"id":71,"offset":0,"osal":true,"product":-1,"value":[0,0,0,0,0,0,0,0],"len":8},"ZCD_NV_PRECFGKEY":{"id":98,"offset":0,"osal":true,"product":-1,"value":[1,3,5,7,9,11,13,15,0,2,4,6,8,10,12,13],"len":16},"ZCD_NV_PRECFGKEY_ENABLE":{"id":99,"offset":0,"osal":true,"product":-1,"value":[0],"len":1},"ZCD_NV_CHANLIST":{"id":132,"offset":0,"osal":true,"product":-1,"value":[0,8,0,0],"len":4},"ZCD_NV_LEGACY_TCLK_TABLE_START":{"id":273,"product":2,"offset":0,"osal":true,"value":[11,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,255,0,0,0],"len":20},"ZCD_NV_LEGACY_NWK_SEC_MATERIAL_TABLE_START":{"id":117,"product":2,"offset":0,"osal":true,"value":[123,63,0,0,174,68,1,18,0,75,18,0],"len":12}}};
        const backupFile = getTempFile();
        fs.writeFileSync(backupFile, JSON.stringify(backup), 'utf8');

        adapter = new ZStackAdapter(networkOptions, serialPortOptions, backupFile);
        const result = await adapter.start();
        expect(result).toBe('restored');
        expect(Znp).toBeCalledWith("dummy", 800, false);
        expect(mockZnpOpen).toBeCalledTimes(1);
        expect(mockZnpRequest.mock.calls[0][1]).toBe('ping');
        expect(mockZnpRequest.mock.calls[1][1]).toBe('version');
        expect(mockZnpRequest.mock.calls[2][2].id).toBe(NvItemsIds.ZNP_HAS_CONFIGURED_ZSTACK3);
        expect(mockZnpRequest.mock.calls[3][1]).toBe('version');
        expect(mockZnpRequest.mock.calls[4][1]).toBe('osalNvWrite');
        expect(mockZnpRequest.mock.calls[4][2]).toStrictEqual(backup.data.ZCD_NV_EXTADDR);
        expect(mockZnpRequest.mock.calls[5][1]).toBe('osalNvItemInit');
        expect(mockZnpRequest.mock.calls[5][2].value).toStrictEqual(backup.data.ZCD_NV_NIB.value);
        expect(mockZnpRequest.mock.calls[6][1]).toBe('osalNvWrite');
        expect(mockZnpRequest.mock.calls[6][2]).toStrictEqual(backup.data.ZCD_NV_NIB);
        expect(mockZnpRequest.mock.calls[7][1]).toBe('osalNvWrite');
        expect(mockZnpRequest.mock.calls[7][2]).toStrictEqual(backup.data.ZCD_NV_PANID);
        expect(mockZnpRequest.mock.calls[8][1]).toBe('osalNvWrite');
        expect(mockZnpRequest.mock.calls[8][2]).toStrictEqual(backup.data.ZCD_NV_EXTENDED_PAN_ID);
        expect(mockZnpRequest.mock.calls[9][1]).toBe('osalNvWrite');
        expect(mockZnpRequest.mock.calls[9][2]).toStrictEqual(backup.data.ZCD_NV_NWK_ACTIVE_KEY_INFO);
        expect(mockZnpRequest.mock.calls[10][1]).toBe('osalNvWrite');
        expect(mockZnpRequest.mock.calls[10][2]).toStrictEqual(backup.data.ZCD_NV_NWK_ALTERN_KEY_INFO);
        expect(mockZnpRequest.mock.calls[11][1]).toBe('osalNvWrite');
        expect(mockZnpRequest.mock.calls[11][2]).toStrictEqual(backup.data.ZCD_NV_APS_USE_EXT_PANID);
        expect(mockZnpRequest.mock.calls[12][1]).toBe('osalNvWrite');
        expect(mockZnpRequest.mock.calls[12][2]).toStrictEqual(backup.data.ZCD_NV_PRECFGKEY);
        expect(mockZnpRequest.mock.calls[13][1]).toBe('osalNvWrite');
        expect(mockZnpRequest.mock.calls[13][2]).toStrictEqual(backup.data.ZCD_NV_PRECFGKEY_ENABLE);
        expect(mockZnpRequest.mock.calls[14][1]).toBe('nvWrite');
        expect(mockZnpRequest.mock.calls[14][2].value).toStrictEqual(backup.data.ZCD_NV_LEGACY_TCLK_TABLE_START.value);
        expect(mockZnpRequest.mock.calls[15][1]).toBe('nvWrite');
        expect(mockZnpRequest.mock.calls[15][2].value).toStrictEqual(backup.data.ZCD_NV_LEGACY_NWK_SEC_MATERIAL_TABLE_START.value);
        expect(mockZnpRequest.mock.calls[16][2].id).toBe(NvItemsIds.ZNP_HAS_CONFIGURED_ZSTACK3);
        expect(mockZnpRequest.mock.calls[17][2].id).toBe(NvItemsIds.ZNP_HAS_CONFIGURED_ZSTACK3);
        expect(mockZnpRequest.mock.calls[18][1]).toBe('osalNvItemInit');
        expect(mockZnpRequest.mock.calls[18][2].initvalue).toStrictEqual([1]);
        expect(mockZnpRequest.mock.calls[19][1]).toBe('osalNvWrite');
        expect(mockZnpRequest.mock.calls[19][2].value).toStrictEqual([1]);
        expect(mockZnpRequest.mock.calls[20][1]).toBe('resetReq');
        expect(mockZnpRequest.mock.calls[21][1]).toBe('getDeviceInfo');
        expect(mockZnpRequest.mock.calls[22][1]).toBe('activeEpReq');
        expect(mockZnpRequest.mock.calls[23][1]).toBe('extFindGroup');
        expect(mockZnpRequest.mock.calls[24][1]).toBe('osalNvWrite');
        expect(mockZnpRequest.mock.calls[24][2].value).toStrictEqual(Buffer.from([0, 8, 0, 0]));
        expect(mockZnpRequest).toBeCalledTimes(25);
    });

    it('Start restore backup migration zStack 3.x.0 -> zStack 3.0.x', async () => {
        mockZnpRequest.mockImplementation((subsystem, command, payload, expectedStatus) => {
            const missing = () => {
                const msg = `Not implemented - ${Subsystem[subsystem]} - ${command} - ${JSON.stringify(payload)}`;
                console.log(msg)
                throw new Error(msg);
            }

            if (subsystem === Subsystem.SYS && command === 'version' && equals(payload, {})) {
                return {payload: {product: 2}};
            } else if (subsystem === Subsystem.SYS && command === 'ping') {
                return {};
            } else if (subsystem === Subsystem.ZDO && command === 'extFindGroup') {
                return {payload: {status: 0}};
            } else if (subsystem === Subsystem.SYS && command === 'osalNvRead') {
                if (equalsPartial(payload, {id: NvItemsIds.ZNP_HAS_CONFIGURED_ZSTACK3, offset: 0})) {
                    return {payload: {value: Buffer.from([0])}};
                } else {
                    missing();
                }
            } else if (subsystem === Subsystem.SYS && command === 'osalNvItemInit') {
                return {};
            } else if (subsystem === Subsystem.SYS && command === 'osalNvWrite') {
                return {};
            } else if (subsystem === Subsystem.SYS && command === 'resetReq') {
                return {};
            } else if (subsystem === Subsystem.UTIL && command === 'getDeviceInfo') {
                return {payload: {devicestate: DevStates.ZB_COORD}};
            } else if (subsystem === Subsystem.ZDO && command === 'activeEpReq') {
                return {};
            } else if (subsystem === Subsystem.ZDO && command === 'startupFromApp') {
                return {};
            } else {
                missing();
            }
        });

        mockZnpWaitfor.mockImplementation((type, subsystem, command, payload) => {
            const missing = () => {
                const msg = `Not implemented - ${Type[type]} - ${Subsystem[subsystem]} - ${command} - ${JSON.stringify(payload)}`;
                console.log(msg)
                throw new Error(msg);
            }

            if (type === Type.AREQ && subsystem === Subsystem.ZDO && command === 'activeEpRsp') {
                return waitForResult({payload: {activeeplist: [1, 2, 3, 4, 5, 6, 8, 10, 11, 110, 12, 13, 47, 242]}});
            } else if (type === Type.AREQ && subsystem === Subsystem.ZDO && command === 'stateChangeInd') {
                return waitForResult({payload: {activeeplist: []}});
            } else {
                missing();
            }
        });

        const backup = {"adapterType":"zStack","time":"Sat, 12 Oct 2019 11:44:30 GMT","meta":{"product":1},"data":{"ZCD_NV_EXTADDR":{"id":1,"offset":0,"osal":true,"product":-1,"value":[71,98,161,28,0,75,18,0],"len":8},"ZCD_NV_NIB":{"id":33,"offset":0,"osal":true,"product":-1,"value":[153,5,2,0,20,0,0,30,0,0,0,1,5,1,143,0,7,0,2,5,30,0,254,255,0,0,254,255,0,0,0,0,0,0,0,0,255,255,0,0,0,0,0,0,15,15,0,0,0,0,0,0,0,0,0,0,0,221,221,221,221,221,221,221,221,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,15,3,0,1,120,10,1,0,0,0,0,0,0,0],"len":116},"ZCD_NV_PANID":{"id":131,"offset":0,"osal":true,"product":-1,"value":[123,0],"len":2},"ZCD_NV_EXTENDED_PAN_ID":{"id":45,"offset":0,"osal":true,"product":-1,"value":[1,2,3],"len":3},"ZCD_NV_NWK_ACTIVE_KEY_INFO":{"id":58,"offset":0,"osal":true,"product":-1,"value":[0,1,3,5,7,9,11,13,15,0,2,4,6,8,10,12,13],"len":17},"ZCD_NV_NWK_ALTERN_KEY_INFO":{"id":59,"offset":0,"osal":true,"product":-1,"value":[0,1,3,5,7,9,11,13,15,0,2,4,6,8,10,12,13],"len":17},"ZCD_NV_APS_USE_EXT_PANID":{"id":71,"offset":0,"osal":true,"product":-1,"value":[0,0,0,0,0,0,0,0],"len":8},"ZCD_NV_PRECFGKEY":{"id":98,"offset":0,"osal":true,"product":-1,"value":[1,3,5,7,9,11,13,15,0,2,4,6,8,10,12,13],"len":16},"ZCD_NV_PRECFGKEY_ENABLE":{"id":99,"offset":0,"osal":true,"product":-1,"value":[0],"len":1},"ZCD_NV_CHANLIST":{"id":132,"offset":0,"osal":true,"product":-1,"value":[0,8,0,0],"len":4},"ZCD_NV_EX_TCLK_TABLE":{"sysid":1,"itemid":4,"subid":0,"product":1,"osal":false,"offset":0,"value":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,255,0,0,0],"len":20},"ZCD_NV_EX_NWK_SEC_MATERIAL_TABLE":{"sysid":1,"itemid":7,"subid":0,"product":1,"osal":false,"offset":0,"value":[1,0,0,0,221,221,221,221,221,221,221,221],"len":12}}};
        const backupFile = getTempFile();
        fs.writeFileSync(backupFile, JSON.stringify(backup), 'utf8');

        adapter = new ZStackAdapter(networkOptions, serialPortOptions, backupFile);
        const result = await adapter.start();
        expect(result).toBe('restored');
        expect(Znp).toBeCalledWith("dummy", 800, false);
        expect(mockZnpOpen).toBeCalledTimes(1);
        expect(mockZnpRequest.mock.calls[0][1]).toBe('ping');
        expect(mockZnpRequest.mock.calls[1][1]).toBe('version');
        expect(mockZnpRequest.mock.calls[2][2].id).toBe(NvItemsIds.ZNP_HAS_CONFIGURED_ZSTACK3);
        expect(mockZnpRequest.mock.calls[3][1]).toBe('version');
        expect(mockZnpRequest.mock.calls[4][1]).toBe('osalNvWrite');
        expect(mockZnpRequest.mock.calls[4][2]).toStrictEqual(backup.data.ZCD_NV_EXTADDR);
        expect(mockZnpRequest.mock.calls[5][1]).toBe('osalNvItemInit');
        expect(mockZnpRequest.mock.calls[5][2].value).toStrictEqual(backup.data.ZCD_NV_NIB.value);
        expect(mockZnpRequest.mock.calls[6][1]).toBe('osalNvWrite');
        expect(mockZnpRequest.mock.calls[6][2]).toStrictEqual(backup.data.ZCD_NV_NIB);
        expect(mockZnpRequest.mock.calls[7][1]).toBe('osalNvWrite');
        expect(mockZnpRequest.mock.calls[7][2]).toStrictEqual(backup.data.ZCD_NV_PANID);
        expect(mockZnpRequest.mock.calls[8][1]).toBe('osalNvWrite');
        expect(mockZnpRequest.mock.calls[8][2]).toStrictEqual(backup.data.ZCD_NV_EXTENDED_PAN_ID);
        expect(mockZnpRequest.mock.calls[9][1]).toBe('osalNvWrite');
        expect(mockZnpRequest.mock.calls[9][2]).toStrictEqual(backup.data.ZCD_NV_NWK_ACTIVE_KEY_INFO);
        expect(mockZnpRequest.mock.calls[10][1]).toBe('osalNvWrite');
        expect(mockZnpRequest.mock.calls[10][2]).toStrictEqual(backup.data.ZCD_NV_NWK_ALTERN_KEY_INFO);
        expect(mockZnpRequest.mock.calls[11][1]).toBe('osalNvWrite');
        expect(mockZnpRequest.mock.calls[11][2]).toStrictEqual(backup.data.ZCD_NV_APS_USE_EXT_PANID);
        expect(mockZnpRequest.mock.calls[12][1]).toBe('osalNvWrite');
        expect(mockZnpRequest.mock.calls[12][2]).toStrictEqual(backup.data.ZCD_NV_PRECFGKEY);
        expect(mockZnpRequest.mock.calls[13][1]).toBe('osalNvWrite');
        expect(mockZnpRequest.mock.calls[13][2]).toStrictEqual(backup.data.ZCD_NV_PRECFGKEY_ENABLE);
        expect(mockZnpRequest.mock.calls[14][1]).toBe('osalNvWrite');
        expect(mockZnpRequest.mock.calls[14][2].value).toStrictEqual(backup.data.ZCD_NV_EX_TCLK_TABLE.value);
        expect(mockZnpRequest.mock.calls[15][1]).toBe('osalNvWrite');
        expect(mockZnpRequest.mock.calls[15][2].value).toStrictEqual(backup.data.ZCD_NV_EX_NWK_SEC_MATERIAL_TABLE.value);
        expect(mockZnpRequest.mock.calls[16][2].id).toBe(NvItemsIds.ZNP_HAS_CONFIGURED_ZSTACK3);
        expect(mockZnpRequest.mock.calls[17][2].id).toBe(NvItemsIds.ZNP_HAS_CONFIGURED_ZSTACK3);
        expect(mockZnpRequest.mock.calls[18][1]).toBe('osalNvItemInit');
        expect(mockZnpRequest.mock.calls[18][2].initvalue).toStrictEqual([1]);
        expect(mockZnpRequest.mock.calls[19][1]).toBe('osalNvWrite');
        expect(mockZnpRequest.mock.calls[19][2].value).toStrictEqual([1]);
        expect(mockZnpRequest.mock.calls[20][1]).toBe('resetReq');
        expect(mockZnpRequest.mock.calls[21][1]).toBe('getDeviceInfo');
        expect(mockZnpRequest.mock.calls[22][1]).toBe('activeEpReq');
        expect(mockZnpRequest.mock.calls[23][1]).toBe('extFindGroup');
        expect(mockZnpRequest.mock.calls[24][1]).toBe('osalNvWrite');
        expect(mockZnpRequest.mock.calls[24][2].value).toStrictEqual(Buffer.from([0, 8, 0, 0]));
        expect(mockZnpRequest).toBeCalledTimes(25);
    });

    it('Start restore from backup wrong adapter type', async () => {
        mockZnpRequest.mockImplementation((subsystem, command, payload, expectedStatus) => {
            if (subsystem === Subsystem.SYS && command === 'osalNvRead' && equalsPartial(payload, {id: NvItemsIds.ZNP_HAS_CONFIGURED_ZSTACK3, offset: 0})) {
                return {payload: {value: Buffer.from([0])}};
            }
            else if (subsystem === Subsystem.SYS && command === 'version' && equals(payload, {})) {
                return {payload: {product: 1}};
            }
            else if (subsystem === Subsystem.SYS && command === 'ping') {
                return {};
            }

            throw new Error('missing');
        });

        const backup = {"adapterType":"conbee","time":"Mon, 19 Aug 2019 16:21:55 GMT","meta":{"product":1},"data":{"ZCD_NV_EXTADDR":{"id":1,"offset":0,"value":[174,68,1,18,0,75,18,0],"len":8},"ZCD_NV_NIB":{"id":33,"offset":0,"value":[230,5,2,16,20,16,0,20,0,0,0,1,5,1,143,7,0,2,5,30,0,0,14,0,0,0,0,0,0,0,0,0,0,114,60,8,0,64,0,0,15,15,4,0,1,0,0,0,1,0,0,0,0,174,68,1,18,0,75,18,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,60,3,0,1,120,10,1,0,0,65,0,0],"len":110},"ZCD_NV_EXTENDED_PAN_ID":{"id":45,"offset":0,"value":[174,68,1,18,0,75,18,0],"len":8},"ZCD_NV_NWK_ACTIVE_KEY_INFO":{"id":58,"offset":0,"value":[0,1,3,5,7,9,11,13,15,0,2,4,6,8,10,12,13],"len":17},"ZCD_NV_NWK_ALTERN_KEY_INFO":{"id":59,"offset":0,"value":[0,1,3,5,7,9,11,13,15,0,2,4,6,8,10,12,13],"len":17},"ZCD_NV_APS_USE_EXT_PANID":{"id":71,"offset":0,"value":[0,0,0,0,0,0,0,0],"len":8},"ZCD_NV_PRECFGKEY":{"id":98,"offset":0,"value":[1,3,5,7,9,11,13,15,0,2,4,6,8,10,12,13],"len":16},"ZCD_NV_PRECFGKEY_ENABLE":{"id":99,"offset":0,"value":[0],"len":1},"ZCD_NV_TCLK_TABLE_START":{"id":273,"offset":0,"value":[94,15,57,228,82,11,124,39,162,90,56,187,81,51,252,149],"len":16},"ZCD_NV_CHANLIST":{"id":132,"offset":0,"value":[0,8,0,0],"len":4},"ZCD_NV_NWK_SEC_MATERIAL_TABLE_START":{"id":117,"offset":0,"value":[123,63,0,0,174,68,1,18,0,75,18,0],"len":12}}};
        const backupFile = getTempFile();
        fs.writeFileSync(backupFile, JSON.stringify(backup), 'utf8');
        adapter = new ZStackAdapter(networkOptions, serialPortOptions, backupFile);

        let error;
        try {await adapter.start()} catch (e) {error = e};
        expect(error).toStrictEqual(new Error("Cannot restore backup, backup is for 'conbee', current is 'zStack'"));
    });

    it('Start restore from backup wrong adapter type', async () => {
        mockZnpRequest.mockImplementation((subsystem, command, payload, expectedStatus) => {
            if (subsystem === Subsystem.SYS && command === 'osalNvRead' && equalsPartial(payload, {id: NvItemsIds.ZNP_HAS_CONFIGURED_ZSTACK3, offset: 0})) {
                return {payload: {value: Buffer.from([0])}};
            }
            else if (subsystem === Subsystem.SYS && command === 'version' && equals(payload, {})) {
                return {payload: {product: 1}};
            }
            else if (subsystem === Subsystem.SYS && command === 'ping') {
                return {};
            }

            throw new Error('missing');
        });

        const backup = {"adapterType":"zStack","time":"Mon, 19 Aug 2019 16:21:55 GMT","meta":{"product":1},"data":{"ZCD_NV_EXTADDR":{"id":1,"offset":0,"value":[174,68,1,18,0,75,18,0],"len":8},"ZCD_NV_NIB":{"id":33,"offset":0,"value":[230,5,2,16,20,16,0,20,0,0,0,1,5,1,143,7,0,2,5,30,0,0,14,0,0,0,0,0,0,0,0,0,0,114,60,8,0,64,0,0,15,15,4,0,1,0,0,0,1,0,0,0,0,174,68,1,18,0,75,18,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,60,3,0,1,120,10,1,0,0,65,0,0],"len":110},"ZCD_NV_EXTENDED_PAN_ID":{"id":45,"offset":0,"value":[174,68,1,18,0,75,18,0],"len":8},"ZCD_NV_NWK_ACTIVE_KEY_INFO":{"id":58,"offset":0,"value":[0,1,3,5,7,9,11,13,15,0,2,4,6,8,10,12,13],"len":17},"ZCD_NV_NWK_ALTERN_KEY_INFO":{"id":59,"offset":0,"value":[0,1,3,5,7,9,11,13,15,0,2,4,6,8,10,12,13],"len":17},"ZCD_NV_APS_USE_EXT_PANID":{"id":71,"offset":0,"value":[0,0,0,0,0,0,0,0],"len":8},"ZCD_NV_PRECFGKEY":{"id":98,"offset":0,"value":[1,3,5,7,9,11,13,15,0,2,4,6,8,10,12,13],"len":16},"ZCD_NV_PRECFGKEY_ENABLE":{"id":99,"offset":0,"value":[0],"len":1},"ZCD_NV_TCLK_TABLE_START":{"id":273,"offset":0,"value":[94,15,57,228,82,11,124,39,162,90,56,187,81,51,252,149],"len":16},"ZCD_NV_CHANLIST":{"id":132,"offset":0,"value":[0,9,0,0],"len":4},"ZCD_NV_NWK_SEC_MATERIAL_TABLE_START":{"id":117,"offset":0,"value":[123,63,0,0,174,68,1,18,0,75,18,0],"len":12}}};
        const backupFile = getTempFile();
        fs.writeFileSync(backupFile, JSON.stringify(backup), 'utf8');
        adapter = new ZStackAdapter(networkOptions, serialPortOptions, backupFile);

        let error;
        try {await adapter.start()} catch (e) {error = e};
        expect(error).toStrictEqual(new Error("Cannot restore backup, channel of backup is different"));
    });

    it('Start restore from backup wrong networkkey', async () => {
        mockZnpRequest.mockImplementation((subsystem, command, payload, expectedStatus) => {
            if (subsystem === Subsystem.SYS && command === 'osalNvRead' && equalsPartial(payload, {id: NvItemsIds.ZNP_HAS_CONFIGURED_ZSTACK3, offset: 0})) {
                return {payload: {value: Buffer.from([0])}};
            }
            else if (subsystem === Subsystem.SYS && command === 'version' && equals(payload, {})) {
                return {payload: {product: 1}};
            }
            else if (subsystem === Subsystem.SYS && command === 'ping') {
                return {};
            }

            throw new Error('missing');
        });

        const backup = {"adapterType":"zStack","time":"Mon, 19 Aug 2019 16:21:55 GMT","meta":{"product":1},"data":{"ZCD_NV_EXTADDR":{"id":1,"offset":0,"value":[174,68,1,18,0,75,18,0],"len":8},"ZCD_NV_NIB":{"id":33,"offset":0,"value":[230,5,2,16,20,16,0,20,0,0,0,1,5,1,143,7,0,2,5,30,0,0,14,0,0,0,0,0,0,0,0,0,0,114,60,8,0,64,0,0,15,15,4,0,1,0,0,0,1,0,0,0,0,174,68,1,18,0,75,18,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,60,3,0,1,120,10,1,0,0,65,0,0],"len":110},"ZCD_NV_EXTENDED_PAN_ID":{"id":45,"offset":0,"value":[174,68,1,18,0,75,18,0],"len":8},"ZCD_NV_NWK_ACTIVE_KEY_INFO":{"id":58,"offset":0,"value":[0,1,3,5,7,9,11,13,15,0,2,4,6,8,10,12,13],"len":17},"ZCD_NV_NWK_ALTERN_KEY_INFO":{"id":59,"offset":0,"value":[0,1,3,5,7,9,11,13,15,0,2,4,6,8,10,12,13],"len":17},"ZCD_NV_APS_USE_EXT_PANID":{"id":71,"offset":0,"value":[0,0,0,0,0,0,0,0],"len":8},"ZCD_NV_PRECFGKEY":{"id":98,"offset":0,"value":[1,3,5,8,9,11,13,15,0,2,4,6,8,10,12,13],"len":16},"ZCD_NV_PRECFGKEY_ENABLE":{"id":99,"offset":0,"value":[0],"len":1},"ZCD_NV_TCLK_TABLE_START":{"id":273,"offset":0,"value":[94,15,57,228,82,11,124,39,162,90,56,187,81,51,252,149],"len":16},"ZCD_NV_CHANLIST":{"id":132,"offset":0,"value":[0,8,0,0],"len":4},"ZCD_NV_NWK_SEC_MATERIAL_TABLE_START":{"id":117,"offset":0,"value":[123,63,0,0,174,68,1,18,0,75,18,0],"len":12}}};
        const backupFile = getTempFile();
        fs.writeFileSync(backupFile, JSON.stringify(backup), 'utf8');
        adapter = new ZStackAdapter(networkOptions, serialPortOptions, backupFile);

        let error;
        try {await adapter.start()} catch (e) {error = e};
        expect(error).toStrictEqual(new Error("Cannot restore backup, networkKey of backup is different"));
    });

    it('Start restore from backup wrong panID', async () => {
        mockZnpRequest.mockImplementation((subsystem, command, payload, expectedStatus) => {
            if (subsystem === Subsystem.SYS && command === 'osalNvRead' && equalsPartial(payload, {id: NvItemsIds.ZNP_HAS_CONFIGURED_ZSTACK3, offset: 0})) {
                return {payload: {value: Buffer.from([0])}};
            }
            else if (subsystem === Subsystem.SYS && command === 'version' && equals(payload, {})) {
                return {payload: {product: 1}};
            }
            else if (subsystem === Subsystem.SYS && command === 'ping') {
                return {};
            }

            throw new Error('missing');
        });

        const backup = {"adapterType":"zStack","time":"Mon, 19 Aug 2019 16:21:55 GMT","meta":{"product":1},"data":{"ZCD_NV_PANID":{"id": 131,"offset": 0,"value": [123,1],"len": 2},"ZCD_NV_EXTADDR":{"id":1,"offset":0,"value":[174,68,1,18,0,75,18,0],"len":8},"ZCD_NV_NIB":{"id":33,"offset":0,"value":[230,5,2,16,20,16,0,20,0,0,0,1,5,1,143,7,0,2,5,30,0,0,14,0,0,0,0,0,0,0,0,0,0,114,60,8,0,64,0,0,15,15,4,0,1,0,0,0,1,0,0,0,0,174,68,1,18,0,75,18,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,60,3,0,1,120,10,1,0,0,65,0,0],"len":110},"ZCD_NV_EXTENDED_PAN_ID":{"id":45,"offset":0,"value":[174,68,1,18,0,75,18,0],"len":8},"ZCD_NV_NWK_ACTIVE_KEY_INFO":{"id":58,"offset":0,"value":[0,1,3,5,7,9,11,13,15,0,2,4,6,8,10,12,13],"len":17},"ZCD_NV_NWK_ALTERN_KEY_INFO":{"id":59,"offset":0,"value":[0,1,3,5,7,9,11,13,15,0,2,4,6,8,10,12,13],"len":17},"ZCD_NV_APS_USE_EXT_PANID":{"id":71,"offset":0,"value":[0,0,0,0,0,0,0,0],"len":8},"ZCD_NV_PRECFGKEY":{"id":98,"offset":0,"value":[1,3,5,7,9,11,13,15,0,2,4,6,8,10,12,13],"len":16},"ZCD_NV_PRECFGKEY_ENABLE":{"id":99,"offset":0,"value":[0],"len":1},"ZCD_NV_TCLK_TABLE_START":{"id":273,"offset":0,"value":[94,15,57,228,82,11,124,39,162,90,56,187,81,51,252,149],"len":16},"ZCD_NV_CHANLIST":{"id":132,"offset":0,"value":[0,8,0,0],"len":4},"ZCD_NV_NWK_SEC_MATERIAL_TABLE_START":{"id":117,"offset":0,"value":[123,63,0,0,174,68,1,18,0,75,18,0],"len":12}}};
        const backupFile = getTempFile();
        fs.writeFileSync(backupFile, JSON.stringify(backup), 'utf8');
        adapter = new ZStackAdapter(networkOptions, serialPortOptions, backupFile);

        let error;
        try {await adapter.start()} catch (e) {error = e};
        expect(error).toStrictEqual(new Error("Cannot restore backup, panID of backup is different"));
    });

    it('Start restore from backup wrong extendedPanID', async () => {
        mockZnpRequest.mockImplementation((subsystem, command, payload, expectedStatus) => {
            if (subsystem === Subsystem.SYS && command === 'osalNvRead' && equalsPartial(payload, {id: NvItemsIds.ZNP_HAS_CONFIGURED_ZSTACK3, offset: 0})) {
                return {payload: {value: Buffer.from([0])}};
            }
            else if (subsystem === Subsystem.SYS && command === 'version' && equals(payload, {})) {
                return {payload: {product: 1}};
            }
            else if (subsystem === Subsystem.SYS && command === 'ping') {
                return {};
            }

            throw new Error('missing');
        });

        const backup = {"adapterType":"zStack","time":"Mon, 19 Aug 2019 16:21:55 GMT","meta":{"product":1},"data":{"ZCD_NV_PANID":{"id": 131,"offset": 0,"value": [123,0],"len": 2},"ZCD_NV_EXTADDR":{"id":1,"offset":0,"value":[174,68,1,18,0,75,18,0],"len":8},"ZCD_NV_NIB":{"id":33,"offset":0,"value":[230,5,2,16,20,16,0,20,0,0,0,1,5,1,143,7,0,2,5,30,0,0,14,0,0,0,0,0,0,0,0,0,0,114,60,8,0,64,0,0,15,15,4,0,1,0,0,0,1,0,0,0,0,174,68,1,18,0,75,18,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,60,3,0,1,120,10,1,0,0,65,0,0],"len":110},"ZCD_NV_EXTENDED_PAN_ID":{"id":45,"offset":0,"value":[175,68,1,18,0,75,18,0],"len":8},"ZCD_NV_NWK_ACTIVE_KEY_INFO":{"id":58,"offset":0,"value":[0,1,3,5,7,9,11,13,15,0,2,4,6,8,10,12,13],"len":17},"ZCD_NV_NWK_ALTERN_KEY_INFO":{"id":59,"offset":0,"value":[0,1,3,5,7,9,11,13,15,0,2,4,6,8,10,12,13],"len":17},"ZCD_NV_APS_USE_EXT_PANID":{"id":71,"offset":0,"value":[0,0,0,0,0,0,0,0],"len":8},"ZCD_NV_PRECFGKEY":{"id":98,"offset":0,"value":[1,3,5,7,9,11,13,15,0,2,4,6,8,10,12,13],"len":16},"ZCD_NV_PRECFGKEY_ENABLE":{"id":99,"offset":0,"value":[0],"len":1},"ZCD_NV_TCLK_TABLE_START":{"id":273,"offset":0,"value":[94,15,57,228,82,11,124,39,162,90,56,187,81,51,252,149],"len":16},"ZCD_NV_CHANLIST":{"id":132,"offset":0,"value":[0,8,0,0],"len":4},"ZCD_NV_NWK_SEC_MATERIAL_TABLE_START":{"id":117,"offset":0,"value":[123,63,0,0,174,68,1,18,0,75,18,0],"len":12}}};
        const backupFile = getTempFile();
        fs.writeFileSync(backupFile, JSON.stringify(backup), 'utf8');
        adapter = new ZStackAdapter(networkOptions, serialPortOptions, backupFile);

        let error;
        try {await adapter.start()} catch (e) {error = e};
        expect(error).toStrictEqual(new Error("Cannot restore backup, extendedPanID of backup is different"));
    });

    it('Create backup zStack 3.0.x', async () => {
        const backup = {"adapterType":"zStack","meta":{"product":2},"data":{"ZCD_NV_EXTADDR":{"id":1,"offset":0,"osal":true,"product":-1,"value":[174,68,1,18,0,75,18,0],"len":8},"ZCD_NV_NIB":{"id":33,"offset":0,"osal":true,"product":-1,"value":[230,5,2,16,20,16,0,20,0,0,0,1,5,1,143,7,0,2,5,30,0,0,14,0,0,0,0,0,0,0,0,0,0,114,60,8,0,64,0,0,15,15,4,0,1,0,0,0,1,0,0,0,0,174,68,1,18,0,75,18,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,60,3,0,1,120,10,1,0,0,65,0,0],"len":110},"ZCD_NV_PANID":{"id":131,"offset":0,"osal":true,"product":-1,"value":[123,0],"len":2},"ZCD_NV_EXTENDED_PAN_ID":{"id":45,"offset":0,"osal":true,"product":-1,"value":[1,2,3],"len":3},"ZCD_NV_NWK_ACTIVE_KEY_INFO":{"id":58,"offset":0,"osal":true,"product":-1,"value":[0,1,3,5,7,9,11,13,15,0,2,4,6,8,10,12,13],"len":17},"ZCD_NV_NWK_ALTERN_KEY_INFO":{"id":59,"offset":0,"osal":true,"product":-1,"value":[0,1,3,5,7,9,11,13,15,0,2,4,6,8,10,12,13],"len":17},"ZCD_NV_APS_USE_EXT_PANID":{"id":71,"offset":0,"osal":true,"product":-1,"value":[0,0,0,0,0,0,0,0],"len":8},"ZCD_NV_PRECFGKEY":{"id":98,"offset":0,"osal":true,"product":-1,"value":[1,3,5,7,9,11,13,15,0,2,4,6,8,10,12,13],"len":16},"ZCD_NV_PRECFGKEY_ENABLE":{"id":99,"offset":0,"osal":true,"product":-1,"value":[0],"len":1},"ZCD_NV_CHANLIST":{"id":132,"offset":0,"osal":true,"product":-1,"value":[0,8,0,0],"len":4},"ZCD_NV_LEGACY_TCLK_TABLE_START":{"id":273,"product":2,"offset":0,"osal":true,"value":[94,15,57,228,82,11,124,39,162,90,56,187,81,51,252,149],"len":16},"ZCD_NV_LEGACY_NWK_SEC_MATERIAL_TABLE_START":{"id":117,"product":2,"offset":0,"osal":true,"value":[123,63,0,0,174,68,1,18,0,75,18,0],"len":12}}};

        mockZnpRequest.mockImplementation((subsystem, command, payload, expectedStatus) => {
            const missing = () => {
                const msg = `Not implemented - ${Subsystem[subsystem]} - ${command} - ${JSON.stringify(payload)}`;
                console.log(msg)
                throw new Error(msg);
            }

            if (subsystem === Subsystem.SYS && command === 'version' && equals(payload, {})) {
                return {payload: {product: 2}};
            } else if (subsystem === Subsystem.SYS && command === 'ping') {
                return {};
            } else if (subsystem === Subsystem.ZDO && command === 'extFindGroup') {
                return {payload: {status: 0}};
            } else if (subsystem === Subsystem.SYS && command === 'osalNvRead') {
                if (equalsPartial(payload, {id: NvItemsIds.ZNP_HAS_CONFIGURED_ZSTACK3, offset: 0})) {
                    return {payload: {value: Buffer.from([0x55])}};
                } else if (equalsPartial(payload, {id: NvItemsIds.CHANLIST, offset: 0})) {
                    return {payload: {value: Buffer.from([0,8,0,0])}};
                } else if (equalsPartial(payload, {id: NvItemsIds.PRECFGKEYS_ENABLE, offset: 0})) {
                    return {payload: {value: Buffer.from([0])}};
                } else if (equalsPartial(payload, {id: NvItemsIds.PRECFGKEY, offset: 0})) {
                    return {payload: {value: Buffer.from(networkOptions.networkKey)}};
                } else if (equalsPartial(payload, {id: NvItemsIds.EXTADDR, offset: 0})) {
                    return {payload: {value: Buffer.from(backup.data.ZCD_NV_EXTADDR.value)}};
                } else if (equalsPartial(payload, {id: NvItemsIds.NIB, offset: 0})) {
                    return {payload: {value: Buffer.from(backup.data.ZCD_NV_NIB.value)}};
                } else if (equalsPartial(payload, {id: NvItemsIds.EXTENDED_PAN_ID, offset: 0})) {
                    return {payload: {value: Buffer.from(backup.data.ZCD_NV_EXTENDED_PAN_ID.value)}};
                } else if (equalsPartial(payload, {id: NvItemsIds.NWK_ACTIVE_KEY_INFO, offset: 0})) {
                    return {payload: {value: Buffer.from(backup.data.ZCD_NV_NWK_ACTIVE_KEY_INFO.value)}};
                } else if (equalsPartial(payload, {id: NvItemsIds.NWK_ALTERN_KEY_INFO, offset: 0})) {
                    return {payload: {value: Buffer.from(backup.data.ZCD_NV_NWK_ALTERN_KEY_INFO.value)}};
                } else if (equalsPartial(payload, {id: NvItemsIds.APS_USE_EXT_PANID, offset: 0})) {
                    return {payload: {value: Buffer.from(backup.data.ZCD_NV_APS_USE_EXT_PANID.value)}};
                } else if (equalsPartial(payload, {id: NvItemsIds.PRECFGKEY, offset: 0})) {
                    return {payload: {value: Buffer.from(backup.data.ZCD_NV_PRECFGKEY.value)}};
                } else if (equalsPartial(payload, {id: NvItemsIds.PRECFGKEY_ENABLE, offset: 0})) {
                    return {payload: {value: Buffer.from(backup.data.ZCD_NV_PRECFGKEY_ENABLE.value)}};
                } else if (equalsPartial(payload, {id: NvItemsIds.LEGACY_TCLK_TABLE_START, offset: 0})) {
                    return {payload: {value: Buffer.from(backup.data.ZCD_NV_LEGACY_TCLK_TABLE_START.value)}};
                } else if (equalsPartial(payload, {id: NvItemsIds.CHANLIST, offset: 0})) {
                    return {payload: {value: Buffer.from(backup.data.ZCD_NV_CHANLIST.value)}};
                } else if (equalsPartial(payload, {id: NvItemsIds.LEGACY_NWK_SEC_MATERIAL_TABLE_START, offset: 0})) {
                    return {payload: {value: Buffer.from(backup.data.ZCD_NV_LEGACY_NWK_SEC_MATERIAL_TABLE_START.value)}};
                } else if (equalsPartial(payload, {id: NvItemsIds.PANID, offset: 0})) {
                    return {payload: {value: Buffer.from([networkOptions.panID, 0])}};
                } else {
                    missing();
                }
            } else if (subsystem === Subsystem.UTIL && command === 'getDeviceInfo') {
                return {payload: {devicestate: DevStates.ZB_COORD}};
            } else if (subsystem === Subsystem.ZDO && command === 'activeEpReq') {
                return {};
            } else if (subsystem === Subsystem.SAPI && command === 'readConfiguration') {
                return {payload: {value: Buffer.from(networkOptions.networkKey)}};
            } else {
                missing();
            }
        });

        mockZnpWaitfor.mockImplementation((type, subsystem, command, payload) => {
            const missing = () => {
                const msg = `Not implemented - ${Type[type]} - ${Subsystem[subsystem]} - ${command} - ${JSON.stringify(payload)}`;
                console.log(msg)
                throw new Error(msg);
            }

            if (type === Type.AREQ && subsystem === Subsystem.ZDO && command === 'activeEpRsp') {
                return waitForResult({payload: {activeeplist: [1, 2, 3, 4, 5, 6, 8, 10, 11, 110, 12, 13, 47, 242]}});
            } else if (type === Type.AREQ && subsystem === Subsystem.ZDO && command === 'stateChangeInd') {
                return waitForResult({payload: {}});
            } else {
                missing();
            }
        });

        const result = await adapter.start();
        const actualBackup = await adapter.backup();
        delete backup['time'];
        delete actualBackup.time;
        expect(equals(backup, actualBackup)).toBeTruthy();
    });

    it('Create backup zStack 3.x.0', async () => {
        const backup = {"adapterType":"zStack","time":"Sat, 12 Oct 2019 11:44:30 GMT","meta":{"product":1},"data":{"ZCD_NV_EXTADDR":{"id":1,"offset":0,"osal":true,"product":-1,"value":[71,98,161,28,0,75,18,0],"len":8},"ZCD_NV_NIB":{"id":33,"offset":0,"osal":true,"product":-1,"value":[153,5,2,0,20,0,0,30,0,0,0,1,5,1,143,0,7,0,2,5,30,0,254,255,0,0,254,255,0,0,0,0,0,0,0,0,255,255,0,0,0,0,0,0,15,15,0,0,0,0,0,0,0,0,0,0,0,221,221,221,221,221,221,221,221,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,15,3,0,1,120,10,1,0,0,0,0,0,0,0],"len":116},"ZCD_NV_PANID":{"id":131,"offset":0,"osal":true,"product":-1,"value":[123,0],"len":2},"ZCD_NV_EXTENDED_PAN_ID":{"id":45,"offset":0,"osal":true,"product":-1,"value":[1,2,3],"len":3},"ZCD_NV_NWK_ACTIVE_KEY_INFO":{"id":58,"offset":0,"osal":true,"product":-1,"value":[0,1,3,5,7,9,11,13,15,0,2,4,6,8,10,12,13],"len":17},"ZCD_NV_NWK_ALTERN_KEY_INFO":{"id":59,"offset":0,"osal":true,"product":-1,"value":[0,1,3,5,7,9,11,13,15,0,2,4,6,8,10,12,13],"len":17},"ZCD_NV_APS_USE_EXT_PANID":{"id":71,"offset":0,"osal":true,"product":-1,"value":[0,0,0,0,0,0,0,0],"len":8},"ZCD_NV_PRECFGKEY":{"id":98,"offset":0,"osal":true,"product":-1,"value":[1,3,5,7,9,11,13,15,0,2,4,6,8,10,12,13],"len":16},"ZCD_NV_PRECFGKEY_ENABLE":{"id":99,"offset":0,"osal":true,"product":-1,"value":[0],"len":1},"ZCD_NV_CHANLIST":{"id":132,"offset":0,"osal":true,"product":-1,"value":[0,8,0,0],"len":4},"ZCD_NV_EX_TCLK_TABLE":{"sysid":1,"itemid":4,"subid":0,"product":1,"osal":false,"offset":0,"value":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,255,0,0,0],"len":20},"ZCD_NV_EX_NWK_SEC_MATERIAL_TABLE":{"sysid":1,"itemid":7,"subid":0,"product":1,"osal":false,"offset":0,"value":[1,0,0,0,221,221,221,221,221,221,221,221],"len":12}}};

        mockZnpRequest.mockImplementation((subsystem, command, payload, expectedStatus) => {
            const missing = () => {
                const msg = `Not implemented - ${Subsystem[subsystem]} - ${command} - ${JSON.stringify(payload)}`;
                console.log(msg)
                throw new Error(msg);
            }

            if (subsystem === Subsystem.SYS && command === 'version' && equals(payload, {})) {
                return {payload: {product: 1}};
            } else if (subsystem === Subsystem.ZDO && command === 'extFindGroup') {
                return {payload: {status: 0}};
            } else if (subsystem === Subsystem.SYS && command === 'ping') {
                return {};
            } else if (subsystem === Subsystem.SYS && command === 'osalNvRead') {
                if (equalsPartial(payload, {id: NvItemsIds.ZNP_HAS_CONFIGURED_ZSTACK3, offset: 0})) {
                    return {payload: {value: Buffer.from([0x55])}};
                } else if (equalsPartial(payload, {id: NvItemsIds.CHANLIST, offset: 0})) {
                    return {payload: {value: Buffer.from([0,8,0,0])}};
                } else if (equalsPartial(payload, {id: NvItemsIds.PRECFGKEYS_ENABLE, offset: 0})) {
                    return {payload: {value: Buffer.from([0])}};
                } else if (equalsPartial(payload, {id: NvItemsIds.PRECFGKEY, offset: 0})) {
                    return {payload: {value: Buffer.from(networkOptions.networkKey)}};
                } else if (equalsPartial(payload, {id: NvItemsIds.EXTADDR, offset: 0})) {
                    return {payload: {value: Buffer.from(backup.data.ZCD_NV_EXTADDR.value)}};
                } else if (equalsPartial(payload, {id: NvItemsIds.NIB, offset: 0})) {
                    return {payload: {value: Buffer.from(backup.data.ZCD_NV_NIB.value)}};
                } else if (equalsPartial(payload, {id: NvItemsIds.EXTENDED_PAN_ID, offset: 0})) {
                    return {payload: {value: Buffer.from(backup.data.ZCD_NV_EXTENDED_PAN_ID.value)}};
                } else if (equalsPartial(payload, {id: NvItemsIds.NWK_ACTIVE_KEY_INFO, offset: 0})) {
                    return {payload: {value: Buffer.from(backup.data.ZCD_NV_NWK_ACTIVE_KEY_INFO.value)}};
                } else if (equalsPartial(payload, {id: NvItemsIds.NWK_ALTERN_KEY_INFO, offset: 0})) {
                    return {payload: {value: Buffer.from(backup.data.ZCD_NV_NWK_ALTERN_KEY_INFO.value)}};
                } else if (equalsPartial(payload, {id: NvItemsIds.APS_USE_EXT_PANID, offset: 0})) {
                    return {payload: {value: Buffer.from(backup.data.ZCD_NV_APS_USE_EXT_PANID.value)}};
                } else if (equalsPartial(payload, {id: NvItemsIds.PRECFGKEY, offset: 0})) {
                    return {payload: {value: Buffer.from(backup.data.ZCD_NV_PRECFGKEY.value)}};
                } else if (equalsPartial(payload, {id: NvItemsIds.PRECFGKEY_ENABLE, offset: 0})) {
                    return {payload: {value: Buffer.from(backup.data.ZCD_NV_PRECFGKEY_ENABLE.value)}};
                } else if (equalsPartial(payload, {id: NvItemsIds.CHANLIST, offset: 0})) {
                    return {payload: {value: Buffer.from(backup.data.ZCD_NV_CHANLIST.value)}};
                } else if (equalsPartial(payload, {id: NvItemsIds.PANID, offset: 0})) {
                    return {payload: {value: Buffer.from([networkOptions.panID, 0])}};
                } else {
                    missing();
                }
            } else if (subsystem === Subsystem.SYS && command === 'nvLength') {
                if (equalsPartial(payload, {sysid: NvSystemIds.ZSTACK, itemid: NvItemsIds.EX_NWK_SEC_MATERIAL_TABLE, offset: 0})) {
                    return {payload: {len: backup.data.ZCD_NV_EX_NWK_SEC_MATERIAL_TABLE.len}}
                }
                else if (equalsPartial(payload, {sysid: NvSystemIds.ZSTACK, itemid: NvItemsIds.EX_TCLK_TABLE, offset: 0})) {
                    return {payload: {len: backup.data.ZCD_NV_EX_TCLK_TABLE.len}}
                }
            } else if (subsystem === Subsystem.SYS && command === 'nvRead') {
                if (equalsPartial(payload, {sysid: NvSystemIds.ZSTACK, itemid: NvItemsIds.EX_NWK_SEC_MATERIAL_TABLE, offset: 0})) {
                    return {payload: {value: Buffer.from(backup.data.ZCD_NV_EX_NWK_SEC_MATERIAL_TABLE.value)}};
                }
                else if (equalsPartial(payload, {sysid: NvSystemIds.ZSTACK, itemid: NvItemsIds.EX_TCLK_TABLE, offset: 0})) {
                    return {payload: {value: Buffer.from(backup.data.ZCD_NV_EX_TCLK_TABLE.value)}};
                }
            } else if (subsystem === Subsystem.UTIL && command === 'getDeviceInfo') {
                return {payload: {devicestate: DevStates.ZB_COORD}};
            } else if (subsystem === Subsystem.ZDO && command === 'activeEpReq') {
                return {};
            } else {
                missing();
            }
        });

        mockZnpWaitfor.mockImplementation((type, subsystem, command, payload) => {
            const missing = () => {
                const msg = `Not implemented - ${Type[type]} - ${Subsystem[subsystem]} - ${command} - ${JSON.stringify(payload)}`;
                console.log(msg)
                throw new Error(msg);
            }

            if (type === Type.AREQ && subsystem === Subsystem.ZDO && command === 'activeEpRsp') {
                return waitForResult({payload: {activeeplist: [1, 2, 3, 4, 5, 6, 8, 10, 11, 110, 12, 13, 47, 242]}});
            } else if (type === Type.AREQ && subsystem === Subsystem.ZDO && command === 'stateChangeInd') {
                return waitForResult({payload: {}});
            } else {
                missing();
            }
        });

        const result = await adapter.start();
        const actualBackup = await adapter.backup();
        delete backup.time;
        delete actualBackup.time;
        expect(equals(backup, actualBackup)).toBeTruthy();
    });

    it('Create backup for zStack 1.2 error', async () => {
        sysVersionResponse = {payload: {product: 0, revision: "20201026"}};
        basicMocks();
        await adapter.start();
        let error;
        try {await adapter.backup()} catch (e) {error = e};
        expect(error).toStrictEqual(new Error('Backup is only supported for Z-Stack 3'));
    });

    it('Restore backup for zStack 1.2 error', async () => {
        mockZnpRequest.mockImplementation((subsystem, command, payload, expectedStatus) => {
            if (subsystem === Subsystem.SYS && command === 'osalNvRead' && equalsPartial(payload, {id: NvItemsIds.ZNP_HAS_CONFIGURED_ZSTACK1, offset: 0})) {
                return {payload: {value: Buffer.from([0])}};
            }
            else if (subsystem === Subsystem.SYS && command === 'version' && equals(payload, {})) {
                return {payload: {product: 0}};
            }
            else if (subsystem === Subsystem.SYS && command === 'ping') {
                return {};
            }

            throw new Error('missing');
        });

        const backup = {"adapterType":"zStack","time":"Mon, 19 Aug 2019 16:21:55 GMT","meta":{"product":0}};
        const backupFile = getTempFile();
        fs.writeFileSync(backupFile, JSON.stringify(backup), 'utf8');
        adapter = new ZStackAdapter(networkOptions, serialPortOptions, backupFile);

        let error;
        try {await adapter.start()} catch (e) {error = e};
        expect(error).toStrictEqual(new Error('Backup is only supported for Z-Stack 3'));
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
            "ieeeAddr":"0x123",
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
        expect(mockZnpRequest).toBeCalledTimes(1);
        expect(mockZnpRequest).toBeCalledWith(Subsystem.ZDO, 'mgmtPermitJoinReq', {addrmode: 0x0F, dstaddr: 0xFFFC , duration: 100, tcsignificance: 0 });
    });

    it('Permit join specific networkAddress', async () => {
        basicMocks();
        await adapter.start();
        mockZnpRequest.mockClear();
        await adapter.permitJoin(102, 42102);
        expect(mockZnpRequest).toBeCalledTimes(1);
        expect(mockZnpRequest).toBeCalledWith(Subsystem.ZDO, 'mgmtPermitJoinReq', {addrmode: 2, dstaddr: 42102 , duration: 102, tcsignificance: 0 });
    });

    it('Get coordinator version', async () => {
        basicMocks();
        await adapter.start();
        mockZnpRequest.mockClear();
        expect(await adapter.getCoordinatorVersion()).toStrictEqual({type: 'zStack3x0', meta: {revision: '20201026', product: 1}})
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

    it('Disable led', async () => {
        basicMocks();
        await adapter.start();
        mockZnpRequest.mockClear();
        await adapter.setLED(false);
        expect(mockZnpRequest).toBeCalledTimes(1);
        expect(mockZnpRequest).toBeCalledWith(Subsystem.UTIL, 'ledControl', {ledid: 3, mode: 0});
    });

    it('Enable led', async () => {
        basicMocks();
        await adapter.start();
        mockZnpRequest.mockClear();
        await adapter.setLED(true);
        expect(mockZnpRequest).toBeCalledTimes(1);
        expect(mockZnpRequest).toBeCalledWith(Subsystem.UTIL, 'ledControl', {ledid: 3, mode: 1});
    });

    it('Supports led', async () => {
        basicMocks();
        await adapter.start();
        expect(await adapter.supportsLED()).toBeFalsy();
    });

    it('Node descriptor', async () => {
        basicMocks();
        let result;
        await adapter.start();

        mockZnpRequest.mockClear();
        result = await adapter.nodeDescriptor(2);
        expect(mockZnpWaitfor).toBeCalledWith(Type.AREQ, Subsystem.ZDO, 'nodeDescRsp', {nwkaddr: 2});
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
        await adapter.sendZclFrameToEndpoint('0x02', 2, 20, frame, 10000, false);
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
        await adapter.sendZclFrameToEndpoint('0x02', 2, 20, frame, 10000, false);
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
        try {await adapter.sendZclFrameToEndpoint('0x02', 2, 20, frame, 10000, false)} catch (e) {error = e;}
        expect(error.message).toStrictEqual("Data request failed with error: 'undefined' (201)");
    });

    it('Send zcl frame network address with default response', async () => {
        basicMocks();
        await adapter.start();
        const defaultReponse = Zcl.ZclFrame.create(Zcl.FrameType.GLOBAL, Zcl.Direction.SERVER_TO_CLIENT, true, null, 100, 'defaultRsp', 0, {cmdId: 0, status: 0});
        const object = {type: Type.AREQ, subsystem: Subsystem.AF, command: 'incomingMsg', payload: {clusterid: 0, srcendpoint: 20, srcaddr: 2, linkquality: 101, groupid: 12, data: defaultReponse.toBuffer()}};
        mockZnpRequest.mockClear();
        const frame = Zcl.ZclFrame.create(Zcl.FrameType.GLOBAL, Zcl.Direction.CLIENT_TO_SERVER, false, null, 100, 'writeNoRsp', 0, [{attrId: 0, dataType:0, attrData: null}]);
        const request =  adapter.sendZclFrameToEndpoint('0x02', 2, 20, frame, 10000, false);
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
        const response = adapter.sendZclFrameToEndpoint('0x02', 2, 20, frame, 10000, false);
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
        const response = adapter.sendZclFrameToEndpoint('0x02', 2, 20, frame, 10000, false);
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
        const response = adapter.sendZclFrameToEndpoint('0x02', 2, 20, frame, 10000, false);
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
        const response = adapter.sendZclFrameToEndpoint('0x03', 2, 20, frame, 10000, false);
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
        const response = adapter.sendZclFrameToEndpoint('0x02', 2, 20, frame, 10000, false);
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
            await adapter.sendZclFrameToEndpoint('0x02', 2, 20, frame, 10000, false);
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
        const response = adapter.sendZclFrameToEndpoint('0x02', 2, 20, frame, 10000, false);
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
        const response = adapter.sendZclFrameToEndpoint('0x02', 2, 20, frame, 10000, false);
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
        try {await adapter.sendZclFrameToEndpoint('0x02', 2, 20, frame, 10000, false)} catch (e) {error = e;}
        expect(error.message).toStrictEqual("Data request failed with error: 'undefined' (201)");
    });

    it('Send zcl frame network address data confirm fails without default response', async () => {
        basicMocks();
        await adapter.start();
        dataConfirmCode = 201;
        const frame = Zcl.ZclFrame.create(Zcl.FrameType.GLOBAL, Zcl.Direction.CLIENT_TO_SERVER, true, null, 100, 'read', 0, [{attrId: 0}]);
        let error;
        try {await adapter.sendZclFrameToEndpoint('0x02', 2, 20, frame, 10000, false)} catch (e) {error = e;}
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
            const response = adapter.sendZclFrameToEndpoint('0x02', 2, 20, frame, 1, false);
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
        const response = adapter.sendZclFrameToEndpoint('0x02', 2, 20, frame, 10000, false);
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
        expect(result).toStrictEqual({channel: 12, extendedPanID: 10, panID: 20});
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

        let result = adapter.sendZclFrameInterPANBroadcast(touchlinkScanRequest, 1000);
        znpReceived(object);
        result = await result;

        expect(mockZnpRequest).toBeCalledTimes(1);
        expect(mockZnpRequest).toBeCalledWith(4, "dataRequestExt", {"clusterid": 4096, "data": touchlinkScanRequest.toBuffer(), "destendpoint": 254, "dstaddr": "0x000000000000ffff", "len": 9, "options": 0, "radius": 30, "srcendpoint": 12, "transid": 1, "dstaddrmode": 2, "dstpanid": 65535}, null);
        expect(deepClone(result)).toStrictEqual({"wasBroadcast":false,"frame":{"Header":{"frameControl":{"frameType":1,"manufacturerSpecific":false,"direction":1,"disableDefaultResponse":false,"reservedBits":0},"transactionSequenceNumber":12,"manufacturerCode":null,"commandIdentifier":1},"Payload":{"transactionID":1,"rssiCorrection":10,"zigbeeInformation":5,"touchlinkInformation":6,"keyBitmask":12,"responseID":11,"extendedPanID":"0x0017210104d9cd33","networkUpdateID":1,"logicalChannel":12,"panID":13,"networkAddress":5,"numberOfSubDevices":10,"totalGroupIdentifiers":5,"endpointID":1,"profileID":99,"deviceID":101,"version":3,"groupIdentifierCount":8},"Cluster":{"ID":4096,"attributes":{},"name":"touchlink","commands":{"scanRequest":{"ID":0,"response":1,"parameters":[{"name":"transactionID","type":35},{"name":"zigbeeInformation","type":24},{"name":"touchlinkInformation","type":24}],"name":"scanRequest"},"identifyRequest":{"ID":6,"parameters":[{"name":"transactionID","type":35},{"name":"duration","type":33}],"name":"identifyRequest"},"resetToFactoryNew":{"ID":7,"parameters":[{"name":"transactionID","type":35}],"name":"resetToFactoryNew"}},"commandsResponse":{"scanResponse":{"ID":1,"parameters":[{"name":"transactionID","type":35},{"name":"rssiCorrection","type":32},{"name":"zigbeeInformation","type":32},{"name":"touchlinkInformation","type":32},{"name":"keyBitmask","type":33},{"name":"responseID","type":35},{"name":"extendedPanID","type":240},{"name":"networkUpdateID","type":32},{"name":"logicalChannel","type":32},{"name":"panID","type":33},{"name":"networkAddress","type":33},{"name":"numberOfSubDevices","type":32},{"name":"totalGroupIdentifiers","type":32},{"name":"endpointID","type":32},{"name":"profileID","type":33},{"name":"deviceID","type":33},{"name":"version","type":32},{"name":"groupIdentifierCount","type":32}],"name":"scanResponse"}}},"Command":{"ID":1,"parameters":[{"name":"transactionID","type":35},{"name":"rssiCorrection","type":32},{"name":"zigbeeInformation","type":32},{"name":"touchlinkInformation","type":32},{"name":"keyBitmask","type":33},{"name":"responseID","type":35},{"name":"extendedPanID","type":240},{"name":"networkUpdateID","type":32},{"name":"logicalChannel","type":32},{"name":"panID","type":33},{"name":"networkAddress","type":33},{"name":"numberOfSubDevices","type":32},{"name":"totalGroupIdentifiers","type":32},{"name":"endpointID","type":32},{"name":"profileID","type":33},{"name":"deviceID","type":33},{"name":"version","type":32},{"name":"groupIdentifierCount","type":32}],"name":"scanResponse"}},"address":12394,"endpoint":254,"linkquality":101,"groupID":0});
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
        try {await adapter.sendZclFrameToEndpoint('0x02', 2, 20, frame, 10000, false)} catch (e) {error = e;}
        expect(error).toStrictEqual(new Error('Cannot execute command, in Inter-PAN mode'));
        expect(mockZnpRequest).toBeCalledTimes(0);

        await adapter.restoreChannelInterPAN();
        mockZnpRequest.mockClear();

        await adapter.sendZclFrameToEndpoint('0x02', 2, 20, frame, 10000, false);
        expect(mockZnpRequest).toBeCalledTimes(1);
    });
});
