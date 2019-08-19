import "regenerator-runtime/runtime";
import {Znp} from '../../../src/adapter/z-stack/znp';
import {ZStackAdapter} from '../../../src/adapter';
import {Constants as UnpiConstants} from '../../../src/adapter/z-stack/unpi';
import equals from 'fast-deep-equal';
import * as Constants from '../../../src/adapter/z-stack/constants';

const Type = UnpiConstants.Type;
const Subsystem = UnpiConstants.Subsystem;
const NvItemsIds = Constants.COMMON.nvItemIds;

const mockZnpRequest = jest.fn().mockReturnValue({payload: {}});
const mockWaitFor = jest.fn();
const mockZnpOpen = jest.fn();

const equalsPartial = (object, expected) => {
    for (const [key, value] of Object.entries(expected)) {
        if (!equals(object[key], value)) {
            return false;
        }
    }

    return true;
}

jest.mock('../../../src/adapter/z-stack/znp/znp', () => {
    return jest.fn().mockImplementation(() => {
      return {
          on: () => {},
          open: mockZnpOpen,
          request: mockZnpRequest,
          waitFor: mockWaitFor,
        };
    });
});


const networkOptions = {
    panID: 123,
    extenedPanID: [1, 2, 3],
    channelList: [11],
    networkKey: [1, 2, 3, 5, 6],
    networkKeyDistribute: false,
}

const serialPortOptions = {
    baudRate: 800,
    rtscts: false,
    path: 'dummy',
};


describe('zStackAdapter', () => {
    let adapter;

    beforeEach(() => {
        adapter = new ZStackAdapter(networkOptions, serialPortOptions, 'backup.json');
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
                return {payload: {devicestate: Constants.COMMON.devStates.ZB_COORD}};
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

        mockWaitFor.mockImplementation((type, subsystem, command, payload) => {
            const missing = () => {
                const msg = `Not implemented - ${Type[type]} - ${Subsystem[subsystem]} - ${command} - ${JSON.stringify(payload)}`;
                console.log(msg)
                throw new Error(msg);
            }

            if (type === Type.AREQ && subsystem === Subsystem.ZDO && command === 'activeEpRsp') {
                return {payload: {activeeplist: []}};
            } else if (type === Type.AREQ && subsystem === Subsystem.ZDO && command === 'stateChangeInd') {
                return {payload: {activeeplist: []}};
            } else {
                missing();
            }
        });

        const result = await adapter.start();
        expect(result).toBe('resetted');
        expect(Znp).toBeCalledWith("dummy", 800, false);
        expect(mockZnpOpen).toBeCalledTimes(1);
        expect(mockZnpRequest.mock.calls[0][1]).toBe('version');
        expect(mockZnpRequest.mock.calls[1][2].id).toBe(NvItemsIds.ZNP_HAS_CONFIGURED_ZSTACK3);
        expect(mockZnpRequest.mock.calls[2][2].id).toBe(NvItemsIds.ZNP_HAS_CONFIGURED_ZSTACK3);
        expect(mockZnpRequest.mock.calls[3][2].id).toBe(NvItemsIds.CHANLIST);
        expect(mockZnpRequest.mock.calls[4][2].id).toBe(NvItemsIds.PRECFGKEYS_ENABLE);
        expect(mockZnpRequest.mock.calls[5][2].id).toBe(NvItemsIds.PRECFGKEY);
        expect(mockZnpRequest.mock.calls[6][1]).toBe('resetReq');
        expect(mockZnpRequest.mock.calls[7][1]).toBe('osalNvWrite');
        expect(mockZnpRequest.mock.calls[7][2].value).toStrictEqual(Buffer.from([0x02]));
        expect(mockZnpRequest.mock.calls[8][1]).toBe('resetReq');
        expect(mockZnpRequest.mock.calls[9][1]).toBe('osalNvWrite');
        expect(mockZnpRequest.mock.calls[9][2].value).toStrictEqual(Buffer.from([0]));
        expect(mockZnpRequest.mock.calls[10][1]).toBe('osalNvWrite');
        expect(mockZnpRequest.mock.calls[10][2].value).toStrictEqual(Buffer.from([0]));
        expect(mockZnpRequest.mock.calls[11][1]).toBe('osalNvWrite');
        expect(mockZnpRequest.mock.calls[11][2].value).toStrictEqual(Buffer.from([1]));
        expect(mockZnpRequest.mock.calls[12][1]).toBe('osalNvWrite');
        expect(mockZnpRequest.mock.calls[12][2].value).toStrictEqual(Buffer.from([0, 8, 0, 0]));
        expect(mockZnpRequest.mock.calls[13][1]).toBe('osalNvWrite');
        expect(mockZnpRequest.mock.calls[13][2].value).toStrictEqual(Buffer.from(networkOptions.networkKey));
        expect(mockZnpRequest.mock.calls[14][1]).toBe('bdbSetChannel');
        expect(mockZnpRequest.mock.calls[14][2].channel).toStrictEqual(2048);
        expect(mockZnpRequest.mock.calls[15][1]).toBe('bdbSetChannel');
        expect(mockZnpRequest.mock.calls[15][2].channel).toStrictEqual(0);
        expect(mockZnpRequest.mock.calls[16][1]).toBe('bdbStartCommissioning');
        expect(mockZnpRequest.mock.calls[16][2].mode).toStrictEqual(4);
        expect(mockWaitFor.mock.calls[0][2]).toBe('stateChangeInd');
        expect(mockWaitFor.mock.calls[0][3].state).toStrictEqual(9);
        expect(mockWaitFor.mock.calls[0][4]).toStrictEqual(60000);
        expect(mockZnpRequest.mock.calls[17][1]).toBe('bdbStartCommissioning');
        expect(mockZnpRequest.mock.calls[17][2].mode).toStrictEqual(2);
        expect(mockZnpRequest.mock.calls[18][1]).toBe('osalNvItemInit');
        expect(mockZnpRequest.mock.calls[18][2].id).toStrictEqual(NvItemsIds.ZNP_HAS_CONFIGURED_ZSTACK3);
        expect(mockZnpRequest.mock.calls[19][1]).toBe('osalNvWrite');
        expect(mockZnpRequest.mock.calls[19][2].value).toStrictEqual(Buffer.from([0x55]));
        expect(mockZnpRequest.mock.calls[20][1]).toBe('getDeviceInfo');
        expect(mockZnpRequest.mock.calls[21][1]).toBe('activeEpReq');
        expect(mockZnpRequest.mock.calls[22][1]).toBe('register');
        expect(mockZnpRequest.mock.calls[22][2].endpoint).toBe(1);
        expect(mockZnpRequest.mock.calls[22][2].appprofid).toBe(0x0104);
        expect(mockZnpRequest.mock.calls[23][1]).toBe('register');
        expect(mockZnpRequest.mock.calls[23][2].endpoint).toBe(2);
        expect(mockZnpRequest.mock.calls[23][2].appprofid).toBe(0x0101);
        expect(mockZnpRequest.mock.calls[24][1]).toBe('register');
        expect(mockZnpRequest.mock.calls[24][2].endpoint).toBe(3);
        expect(mockZnpRequest.mock.calls[24][2].appprofid).toBe(0x0105);
        expect(mockZnpRequest.mock.calls[25][1]).toBe('register');
        expect(mockZnpRequest.mock.calls[25][2].endpoint).toBe(4);
        expect(mockZnpRequest.mock.calls[25][2].appprofid).toBe(0x0107);
        expect(mockZnpRequest.mock.calls[26][1]).toBe('register');
        expect(mockZnpRequest.mock.calls[26][2].endpoint).toBe(5);
        expect(mockZnpRequest.mock.calls[26][2].appprofid).toBe(0x0108);
        expect(mockZnpRequest.mock.calls[27][1]).toBe('register');
        expect(mockZnpRequest.mock.calls[27][2].endpoint).toBe(6);
        expect(mockZnpRequest.mock.calls[27][2].appprofid).toBe(0x0109);
        expect(mockZnpRequest.mock.calls[28][1]).toBe('register');
        expect(mockZnpRequest.mock.calls[28][2].endpoint).toBe(11);
        expect(mockZnpRequest.mock.calls[28][2].appprofid).toBe(0x0104);
        expect(mockZnpRequest.mock.calls[28][2].appoutclusterlist).toStrictEqual([1280]);
        expect(mockZnpRequest).toHaveBeenCalledTimes(29);
    });

    it('Start zStack 1.2 initialize', async () => {
        mockZnpRequest.mockImplementation((subsystem, command, payload, expectedStatus) => {
            const missing = () => {
                const msg = `Not implemented - ${Subsystem[subsystem]} - ${command} - ${JSON.stringify(payload)}`;
                console.log(msg)
                throw new Error(msg);
            }

            if (subsystem === Subsystem.SYS && command === 'version' && equals(payload, {})) {
                return {payload: {product: 0}};
            } else if (subsystem === Subsystem.SYS && command === 'osalNvRead') {
                if (equalsPartial(payload, {id: NvItemsIds.ZNP_HAS_CONFIGURED_ZSTACK1, offset: 0})) {
                    return {payload: {value: Buffer.from([0x55])}};
                } else if (equalsPartial(payload, {id: NvItemsIds.CHANLIST, offset: 0})) {
                    return {payload: {value: Buffer.from([0,8,0,0])}};
                } else if (equalsPartial(payload, {id: NvItemsIds.PRECFGKEYS_ENABLE, offset: 0})) {
                    return {payload: {value: Buffer.from([0])}};
                } else if (equalsPartial(payload, {id: NvItemsIds.PANID, offset: 0})) {
                    return {payload: {value: Buffer.from([networkOptions.panID, 0])}};
                } else if (equalsPartial(payload, {id: NvItemsIds.EXTENDED_PAN_ID, offset: 0})) {
                    return {payload: {value: Buffer.from([])}};
                } else {
                    missing();
                }
            } else if (subsystem === Subsystem.UTIL && command === 'getDeviceInfo') {
                return {payload: {devicestate: Constants.COMMON.devStates.ZB_COORD}};
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
            } else {
                missing();
            }
        });

        mockWaitFor.mockImplementation((type, subsystem, command, payload) => {
            const missing = () => {
                const msg = `Not implemented - ${Type[type]} - ${Subsystem[subsystem]} - ${command} - ${JSON.stringify(payload)}`;
                console.log(msg)
                throw new Error(msg);
            }

            if (type === Type.AREQ && subsystem === Subsystem.ZDO && command === 'activeEpRsp') {
                return {payload: {activeeplist: []}};
            } else if (type === Type.AREQ && subsystem === Subsystem.ZDO && command === 'stateChangeInd') {
                return {payload: {activeeplist: []}};
            } else {
                missing();
            }
        });

        const result = await adapter.start();
        expect(result).toBe('resetted');
        expect(Znp).toBeCalledWith("dummy", 800, false);
        expect(mockZnpOpen).toBeCalledTimes(1);
        // expect(mockZnpRequest.mock.calls[0][1]).toBe('version');
        // expect(mockZnpRequest.mock.calls[1][2].id).toBe(NvItemsIds.ZNP_HAS_CONFIGURED_ZSTACK3);
        // expect(mockZnpRequest.mock.calls[2][2].id).toBe(NvItemsIds.ZNP_HAS_CONFIGURED_ZSTACK3);
        // expect(mockZnpRequest.mock.calls[3][2].id).toBe(NvItemsIds.CHANLIST);
        // expect(mockZnpRequest.mock.calls[4][2].id).toBe(NvItemsIds.PRECFGKEYS_ENABLE);
        // expect(mockZnpRequest.mock.calls[5][2].id).toBe(NvItemsIds.PRECFGKEY);
        // expect(mockZnpRequest.mock.calls[6][2].id).toBe(NvItemsIds.PRECFGKEY);

        // expect(mockZnpRequest.mock.calls[6][1]).toBe('resetReq');
        // expect(mockZnpRequest.mock.calls[7][1]).toBe('osalNvWrite');
        // expect(mockZnpRequest.mock.calls[7][2].value).toStrictEqual(Buffer.from([0x02]));
        // expect(mockZnpRequest.mock.calls[8][1]).toBe('resetReq');
        // expect(mockZnpRequest.mock.calls[9][1]).toBe('osalNvWrite');
        // expect(mockZnpRequest.mock.calls[9][2].value).toStrictEqual(Buffer.from([0]));
        // expect(mockZnpRequest.mock.calls[10][1]).toBe('osalNvWrite');
        // expect(mockZnpRequest.mock.calls[10][2].value).toStrictEqual(Buffer.from([0]));
        // expect(mockZnpRequest.mock.calls[11][1]).toBe('osalNvWrite');
        // expect(mockZnpRequest.mock.calls[11][2].value).toStrictEqual(Buffer.from([1]));
        // expect(mockZnpRequest.mock.calls[12][1]).toBe('osalNvWrite');
        // expect(mockZnpRequest.mock.calls[12][2].value).toStrictEqual(Buffer.from([0, 8, 0, 0]));
        // expect(mockZnpRequest.mock.calls[13][1]).toBe('osalNvWrite');
        // expect(mockZnpRequest.mock.calls[13][2].value).toStrictEqual(Buffer.from(networkOptions.networkKey));
        // expect(mockZnpRequest.mock.calls[14][1]).toBe('bdbSetChannel');
        // expect(mockZnpRequest.mock.calls[14][2].channel).toStrictEqual(2048);
        // expect(mockZnpRequest.mock.calls[15][1]).toBe('bdbSetChannel');
        // expect(mockZnpRequest.mock.calls[15][2].channel).toStrictEqual(0);
        // expect(mockZnpRequest.mock.calls[16][1]).toBe('bdbStartCommissioning');
        // expect(mockZnpRequest.mock.calls[16][2].mode).toStrictEqual(4);
        // expect(mockWaitFor.mock.calls[0][2]).toBe('stateChangeInd');
        // expect(mockWaitFor.mock.calls[0][3].state).toStrictEqual(9);
        // expect(mockWaitFor.mock.calls[0][4]).toStrictEqual(60000);
        // expect(mockZnpRequest.mock.calls[17][1]).toBe('bdbStartCommissioning');
        // expect(mockZnpRequest.mock.calls[17][2].mode).toStrictEqual(2);
        // expect(mockZnpRequest.mock.calls[18][1]).toBe('osalNvItemInit');
        // expect(mockZnpRequest.mock.calls[18][2].id).toStrictEqual(NvItemsIds.ZNP_HAS_CONFIGURED_ZSTACK3);
        // expect(mockZnpRequest.mock.calls[19][1]).toBe('osalNvWrite');
        // expect(mockZnpRequest.mock.calls[19][2].value).toStrictEqual(Buffer.from([0x55]));
    });

});