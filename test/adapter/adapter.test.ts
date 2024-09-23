import os from 'os';

import {Bonjour, BrowserConfig} from 'bonjour-service';

import {Adapter} from '../../src/adapter';
import {DeconzAdapter} from '../../src/adapter/deconz/adapter';
import {EmberAdapter} from '../../src/adapter/ember/adapter';
import {EZSPAdapter} from '../../src/adapter/ezsp/adapter';
import {SerialPort} from '../../src/adapter/serialPort';
import {ZStackAdapter} from '../../src/adapter/z-stack/adapter';
import {ZBOSSAdapter} from '../../src/adapter/zboss/adapter';
import {ZiGateAdapter} from '../../src/adapter/zigate/adapter';
import {DECONZ_CONBEE_II, EMBER_SKYCONNECT, ZBOSS_NORDIC, ZIGATE_PLUSV2, ZSTACK_CC2538} from '../mockAdapters';

const mockBonjourResult = jest.fn().mockImplementation((type) => ({
    name: 'Mock Adapter',
    type: `${type}_mdns`,
    port: '1122',
    addresses: ['192.168.1.123'],
    txt: {
        radio_type: `${type}`,
        baud_rate: 115200,
    },
}));
const mockBonjourFindOne = jest.fn().mockImplementation((opts: BrowserConfig | null, timeout: number, callback?: CallableFunction) => {
    if (callback) {
        callback(mockBonjourResult(opts?.type));
    }
});
const mockBonjourDestroy = jest.fn();

jest.mock('bonjour-service', () => ({
    Bonjour: jest.fn().mockImplementation(() => ({
        findOne: mockBonjourFindOne,
        destroy: mockBonjourDestroy,
    })),
}));

describe('Adapter', () => {
    beforeAll(() => {
        jest.useFakeTimers();
    });

    describe('mDNS discovery', () => {
        beforeEach(() => {
            mockBonjourResult.mockClear();
            mockBonjourFindOne.mockClear();
            mockBonjourDestroy.mockClear();
        });

        it.each([
            ['deconz', DeconzAdapter],
            ['ember', EmberAdapter],
            ['ezsp', EZSPAdapter],
            ['zstack', ZStackAdapter],
            ['zboss', ZBOSSAdapter],
            ['zigate', ZiGateAdapter],
        ])('for %s', async (name, adapterCls) => {
            const adapter = await Adapter.create({panID: 0x1a62, channelList: [11]}, {path: `mdns://${name}`}, 'test.db.backup', {disableLED: false});

            expect(adapter).toBeInstanceOf(adapterCls);
            // @ts-expect-error protected
            expect(adapter.serialPortOptions).toStrictEqual({
                baudRate: 115200,
                path: 'tcp://192.168.1.123:1122',
                adapter: name,
            });
        });

        it('for zstack as znp', async () => {
            const adapter = await Adapter.create({panID: 0x1a62, channelList: [11]}, {path: `mdns://znp`}, 'test.db.backup', {disableLED: false});

            expect(adapter).toBeInstanceOf(ZStackAdapter);
            // @ts-expect-error protected
            expect(adapter.serialPortOptions).toStrictEqual({
                baudRate: 115200,
                path: 'tcp://192.168.1.123:1122',
                adapter: 'zstack',
            });
        });

        it('times out', async () => {
            mockBonjourResult.mockReturnValueOnce(null);
            const fakeAdapterName = 'mdns_test_device';

            expect(async () => {
                await Adapter.create({panID: 0, channelList: []}, {path: `mdns://${fakeAdapterName}`}, 'test.db', {disableLED: false});
            }).rejects.toThrow(`Coordinator [${fakeAdapterName}] not found after timeout of 2000ms!`);
        });

        it('given invalid path', async () => {
            expect(async () => {
                await Adapter.create({panID: 0, channelList: []}, {path: `mdns://`}, 'test.db', {disableLED: false});
            }).rejects.toThrow(`No mdns device specified. You must specify the coordinator mdns service type after mdns://, e.g. mdns://my-adapter`);
        });

        it('returns invalid format', async () => {
            mockBonjourResult.mockReturnValueOnce({
                name: 'Mock Adapter',
                type: `my_adapter_mdns`,
                port: '1122',
                addresses: ['192.168.1.123'],
                txt: {
                    radio_type: undefined,
                    baud_rate: 115200,
                },
            });

            expect(async () => {
                await Adapter.create({panID: 0, channelList: []}, {path: `mdns://my_adapter`}, 'test.db', {disableLED: false});
            }).rejects.toThrow(
                `Coordinator returned wrong Zeroconf format! The following values are expected:\n` +
                    `txt.radio_type, got: undefined\n` +
                    `txt.baud_rate, got: 115200\n` +
                    `address, got: 192.168.1.123\n` +
                    `port, got: 1122`,
            );
        });

        it('returns auto adapter', async () => {
            mockBonjourResult.mockReturnValueOnce({
                name: 'Mock Adapter',
                type: `my_adapter_mdns`,
                port: '1122',
                addresses: ['192.168.1.123'],
                txt: {
                    radio_type: 'auto',
                    baud_rate: 115200,
                },
            });

            expect(async () => {
                await Adapter.create({panID: 0, channelList: []}, {path: `mdns://my_adapter`}, 'test.db', {disableLED: false});
            }).rejects.toThrow(`Adapter auto is not supported.`);
        });
    });

    describe('TCP discovery', () => {
        it('returns config', async () => {
            const adapter = await Adapter.create(
                {panID: 0x1a62, channelList: [11]},
                {path: `tcp://192.168.1.321:3456`, adapter: `zstack`},
                'test.db.backup',
                {disableLED: false},
            );

            // @ts-expect-error protected
            expect(adapter.serialPortOptions).toStrictEqual({
                path: `tcp://192.168.1.321:3456`,
                adapter: `zstack`,
            });
        });

        it('invalid path', async () => {
            expect(async () => {
                await Adapter.create({panID: 0x1a62, channelList: [11]}, {path: `tcp://192168.1.321:3456`, adapter: `zstack`}, 'test.db.backup', {
                    disableLED: false,
                });
            }).rejects.toThrow(`Invalid TCP path, expected format: tcp://<host>:<port>`);
        });

        it('invalid adapter', async () => {
            expect(async () => {
                await Adapter.create({panID: 0x1a62, channelList: [11]}, {path: `tcp://192.168.1.321:3456`, adapter: `auto`}, 'test.db.backup', {
                    disableLED: false,
                });
            }).rejects.toThrow(`Cannot discover TCP adapters at this time. Please specify valid 'adapter' and 'path' manually.`);
        });
    });

    describe('USB discovery', () => {
        let listSpy: jest.SpyInstance;
        let platformSpy: jest.SpyInstance;

        beforeAll(() => {
            listSpy = jest.spyOn(SerialPort, 'list');
            listSpy.mockReturnValue([DECONZ_CONBEE_II, EMBER_SKYCONNECT, ZSTACK_CC2538, ZBOSS_NORDIC, ZIGATE_PLUSV2]);

            platformSpy = jest.spyOn(os, 'platform');
            platformSpy.mockReturnValue('linux');
        });

        it('detects deconz from scratch', async () => {
            listSpy.mockReturnValue([DECONZ_CONBEE_II]);

            const adapter = await Adapter.create({panID: 0x1a62, channelList: [11]}, {}, 'test.db.backup', {disableLED: false});

            expect(adapter).toBeInstanceOf(DeconzAdapter);
            // @ts-expect-error protected
            expect(adapter.serialPortOptions).toStrictEqual({
                path: DECONZ_CONBEE_II.path,
                adapter: 'deconz',
            });
        });

        it('detects ember from scratch', async () => {
            listSpy.mockReturnValue([EMBER_SKYCONNECT]);

            const adapter = await Adapter.create({panID: 0x1a62, channelList: [11]}, {}, 'test.db.backup', {disableLED: false});

            expect(adapter).toBeInstanceOf(EmberAdapter);
            // @ts-expect-error protected
            expect(adapter.serialPortOptions).toStrictEqual({
                path: EMBER_SKYCONNECT.path,
                adapter: 'ember',
            });
        });

        it('detects zstack from scratch', async () => {
            listSpy.mockReturnValue([ZSTACK_CC2538]);

            const adapter = await Adapter.create({panID: 0x1a62, channelList: [11]}, {}, 'test.db.backup', {disableLED: false});

            expect(adapter).toBeInstanceOf(ZStackAdapter);
            // @ts-expect-error protected
            expect(adapter.serialPortOptions).toStrictEqual({
                path: ZSTACK_CC2538.path,
                adapter: 'zstack',
            });
        });

        it('detects zboss from scratch', async () => {
            listSpy.mockReturnValue([ZBOSS_NORDIC]);

            const adapter = await Adapter.create({panID: 0x1a62, channelList: [11]}, {}, 'test.db.backup', {disableLED: false});

            expect(adapter).toBeInstanceOf(ZBOSSAdapter);
            // @ts-expect-error protected
            expect(adapter.serialPortOptions).toStrictEqual({
                path: ZBOSS_NORDIC.path,
                adapter: 'zboss',
            });
        });

        it('detects zigate from scratch', async () => {
            listSpy.mockReturnValue([ZIGATE_PLUSV2]);

            const adapter = await Adapter.create({panID: 0x1a62, channelList: [11]}, {}, 'test.db.backup', {disableLED: false});

            expect(adapter).toBeInstanceOf(ZiGateAdapter);
            // @ts-expect-error protected
            expect(adapter.serialPortOptions).toStrictEqual({
                path: ZIGATE_PLUSV2.path,
                adapter: 'zigate',
            });
        });

        it('detects ember from scratch on Windows', async () => {
            platformSpy.mockReturnValueOnce('win32');
            listSpy.mockReturnValue([
                {
                    // Windows sample - Sonoff Dongle-E
                    path: 'COM3',
                    manufacturer: 'wch.cn',
                    serialNumber: '54DD002111',
                    pnpId: 'USB\\VID_1A86&PID_55D4\\54DD002111',
                    locationId: 'Port_#0005.Hub_#0001',
                    friendlyName: 'USB-Enhanced-SERIAL CH9102 (COM3)',
                    vendorId: '1A86',
                    productId: '55D4',
                },
            ]);

            const adapter = await Adapter.create({panID: 0x1a62, channelList: [11]}, {}, 'test.db.backup', {disableLED: false});

            expect(adapter).toBeInstanceOf(EmberAdapter);
            // @ts-expect-error protected
            expect(adapter.serialPortOptions).toStrictEqual({
                path: 'COM3',
                adapter: 'ember',
            });
        });

        it('detects deconz with specific config', async () => {
            listSpy.mockReturnValue([DECONZ_CONBEE_II]);

            const adapter = await Adapter.create(
                {panID: 0x1a62, channelList: [11]},
                {adapter: 'deconz', path: DECONZ_CONBEE_II.path},
                'test.db.backup',
                {disableLED: false},
            );

            expect(adapter).toBeInstanceOf(DeconzAdapter);
            // @ts-expect-error protected
            expect(adapter.serialPortOptions).toStrictEqual({
                path: DECONZ_CONBEE_II.path,
                adapter: 'deconz',
            });
        });

        it('detects ember with specific config', async () => {
            listSpy.mockReturnValue([EMBER_SKYCONNECT]);

            const adapter = await Adapter.create(
                {panID: 0x1a62, channelList: [11]},
                {adapter: 'ember', path: EMBER_SKYCONNECT.path},
                'test.db.backup',
                {disableLED: false},
            );

            expect(adapter).toBeInstanceOf(EmberAdapter);
            // @ts-expect-error protected
            expect(adapter.serialPortOptions).toStrictEqual({
                path: EMBER_SKYCONNECT.path,
                adapter: 'ember',
            });
        });

        it('detects ezsp with specific config', async () => {
            listSpy.mockReturnValue([EMBER_SKYCONNECT]);

            const adapter = await Adapter.create(
                {panID: 0x1a62, channelList: [11]},
                {adapter: 'ezsp', path: EMBER_SKYCONNECT.path},
                'test.db.backup',
                {disableLED: false},
            );

            expect(adapter).toBeInstanceOf(EZSPAdapter);
            // @ts-expect-error protected
            expect(adapter.serialPortOptions).toStrictEqual({
                path: EMBER_SKYCONNECT.path,
                adapter: 'ezsp',
            });
        });

        it('detects zstack with specific config', async () => {
            listSpy.mockReturnValue([ZSTACK_CC2538]);

            const adapter = await Adapter.create(
                {panID: 0x1a62, channelList: [11]},
                {adapter: 'zstack', path: ZSTACK_CC2538.path},
                'test.db.backup',
                {disableLED: false},
            );

            expect(adapter).toBeInstanceOf(ZStackAdapter);
            // @ts-expect-error protected
            expect(adapter.serialPortOptions).toStrictEqual({
                path: ZSTACK_CC2538.path,
                adapter: 'zstack',
            });
        });

        it('detects zboss with specific config', async () => {
            listSpy.mockReturnValue([ZBOSS_NORDIC]);

            const adapter = await Adapter.create({panID: 0x1a62, channelList: [11]}, {adapter: 'zboss', path: ZBOSS_NORDIC.path}, 'test.db.backup', {
                disableLED: false,
            });

            expect(adapter).toBeInstanceOf(ZBOSSAdapter);
            // @ts-expect-error protected
            expect(adapter.serialPortOptions).toStrictEqual({
                path: ZBOSS_NORDIC.path,
                adapter: 'zboss',
            });
        });

        it('detects zigate with specific config', async () => {
            listSpy.mockReturnValue([ZIGATE_PLUSV2]);

            const adapter = await Adapter.create(
                {panID: 0x1a62, channelList: [11]},
                {adapter: 'zigate', path: ZIGATE_PLUSV2.path},
                'test.db.backup',
                {disableLED: false},
            );

            expect(adapter).toBeInstanceOf(ZiGateAdapter);
            // @ts-expect-error protected
            expect(adapter.serialPortOptions).toStrictEqual({
                path: ZIGATE_PLUSV2.path,
                adapter: 'zigate',
            });
        });

        it('detects with specific config with multiple adapters connected', async () => {
            listSpy.mockReturnValue([DECONZ_CONBEE_II, ZSTACK_CC2538, EMBER_SKYCONNECT]);

            const adapter = await Adapter.create(
                {panID: 0x1a62, channelList: [11]},
                {adapter: 'zstack', path: ZSTACK_CC2538.path},
                'test.db.backup',
                {disableLED: false},
            );

            expect(adapter).toBeInstanceOf(ZStackAdapter);
            // @ts-expect-error protected
            expect(adapter.serialPortOptions).toStrictEqual({
                path: ZSTACK_CC2538.path,
                adapter: 'zstack',
            });
        });

        it('fails to match specified adapter+path, tries to start anyway', async () => {
            listSpy.mockReturnValue([]);
            const adapter = await Adapter.create({panID: 0x1a62, channelList: [11]}, {adapter: 'zstack', path: 'dev/ttyUSB0'}, 'test.db.backup', {
                disableLED: false,
            });

            expect(adapter).toBeInstanceOf(ZStackAdapter);
            // @ts-expect-error protected
            expect(adapter.serialPortOptions).toStrictEqual({
                path: 'dev/ttyUSB0',
                adapter: 'zstack',
            });
        });

        it('fails to match with different paths, tries to start anyway', async () => {
            listSpy.mockReturnValue([DECONZ_CONBEE_II]);

            const adapter = await Adapter.create({panID: 0x1a62, channelList: [11]}, {adapter: 'deconz', path: '/dev/ttyUSB0'}, 'test.db.backup', {
                disableLED: false,
            });

            expect(adapter).toBeInstanceOf(DeconzAdapter);
            // @ts-expect-error protected
            expect(adapter.serialPortOptions).toStrictEqual({
                path: '/dev/ttyUSB0',
                adapter: 'deconz',
            });
        });

        it('fails to match from scratch with different paths, throws', async () => {
            listSpy.mockReturnValue([DECONZ_CONBEE_II]);

            expect(async () => {
                await Adapter.create({panID: 0x1a62, channelList: [11]}, {path: '/dev/ttyUSB0'}, 'test.db.backup', {disableLED: false});
            }).rejects.toThrow(`Unable to find a valid USB adapter.`);
        });

        it('fails to match with incomplete port info, throws', async () => {
            listSpy.mockReturnValue([{...DECONZ_CONBEE_II, vendorId: undefined}]);

            expect(async () => {
                await Adapter.create({panID: 0x1a62, channelList: [11]}, {}, 'test.db.backup', {disableLED: false});
            }).rejects.toThrow(`Unable to find a valid USB adapter.`);
        });

        it('fails to match specified adapter+path, throws invalid adapter', async () => {
            listSpy.mockReturnValue([]);

            expect(async () => {
                await Adapter.create(
                    {panID: 0x1a62, channelList: [11]},
                    // @ts-expect-error invalid on purpose
                    {adapter: 'invalid', path: 'dev/ttyUSB0'},
                    'test.db.backup',
                    {disableLED: false},
                );
            }).rejects.toThrow(`Adapter 'invalid' does not exists, possible options: zstack, deconz, zigate, ezsp, ember, zboss`);
        });
    });
});
