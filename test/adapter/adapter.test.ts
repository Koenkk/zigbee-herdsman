import type {MockInstance} from 'vitest';

import {Bonjour, BrowserConfig} from 'bonjour-service';

import {Adapter, TsType} from '../../src/adapter';
import {DeconzAdapter} from '../../src/adapter/deconz/adapter/deconzAdapter';
import {EmberAdapter} from '../../src/adapter/ember/adapter/emberAdapter';
import {EZSPAdapter} from '../../src/adapter/ezsp/adapter/ezspAdapter';
import {SerialPort} from '../../src/adapter/serialPort';
import {ZStackAdapter} from '../../src/adapter/z-stack/adapter/zStackAdapter';
import {ZBOSSAdapter} from '../../src/adapter/zboss/adapter/zbossAdapter';
import {ZiGateAdapter} from '../../src/adapter/zigate/adapter/zigateAdapter';
import {
    DECONZ_CONBEE_II,
    EMBER_SKYCONNECT,
    EMBER_ZBDONGLE_E,
    ZBOSS_NORDIC,
    ZIGATE_PLUSV2,
    ZSTACK_CC2538,
    ZSTACK_SMLIGHT_SLZB_06P10,
    ZSTACK_SMLIGHT_SLZB_07,
    ZSTACK_ZBDONGLE_P,
} from '../mockAdapters';

const mockPlatform = vi.fn(() => 'linux');

vi.mock('node:os', () => ({
    platform: vi.fn(() => mockPlatform()),
}));

const mockBonjourResult = vi.fn().mockImplementation((type) => ({
    name: 'Mock Adapter',
    type: `${type}_mdns`,
    port: '1122',
    host: 'mock_adapter.local',
    addresses: ['192.168.1.123'],
    txt: {
        radio_type: `${type}`,
    },
}));
const mockBonjourFindOne = vi.fn((opts: BrowserConfig | null, timeout: number, callback?: CallableFunction) => {
    if (callback) {
        callback(mockBonjourResult(opts?.type));
    }
});
const mockBonjourDestroy = vi.fn();

vi.mock('bonjour-service', () => ({
    Bonjour: vi.fn(() => ({
        findOne: mockBonjourFindOne,
        destroy: mockBonjourDestroy,
    })),
}));

describe('Adapter', () => {
    beforeAll(() => {
        vi.useFakeTimers();
    });

    it.each([
        ['deconz', DeconzAdapter],
        ['ember', EmberAdapter],
        ['ezsp', EZSPAdapter],
        ['zstack', ZStackAdapter],
        ['zboss', ZBOSSAdapter],
        ['zigate', ZiGateAdapter],
    ])('Calls adapter contructor for %s', async (name, cls) => {
        const adapter = await Adapter.create(
            {panID: 0x1a62, channelList: [11]},
            {path: '/dev/ttyUSB0', adapter: name as TsType.Adapter},
            'test.db.backup',
            {disableLED: false},
        );

        expect(adapter).toBeInstanceOf(cls);
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
                path: 'tcp://192.168.1.123:1122',
                adapter: name,
            });
        });

        it('for zstack as znp', async () => {
            const adapter = await Adapter.create({panID: 0x1a62, channelList: [11]}, {path: `mdns://znp`}, 'test.db.backup', {disableLED: false});

            expect(adapter).toBeInstanceOf(ZStackAdapter);
            // @ts-expect-error protected
            expect(adapter.serialPortOptions).toStrictEqual({
                path: 'tcp://192.168.1.123:1122',
                adapter: 'zstack',
            });
        });

        it('falls back to host if no addresses', async () => {
            mockBonjourResult.mockReturnValueOnce({
                name: 'Mock Adapter',
                type: `my_adapter_mdns`,
                port: '1122',
                host: 'mock_adapter.local',
                txt: {
                    radio_type: `zstack`,
                },
            });
            const adapter = await Adapter.create({panID: 0x1a62, channelList: [11]}, {path: `mdns://zstack`}, 'test.db.backup', {disableLED: false});

            expect(adapter).toBeInstanceOf(ZStackAdapter);
            // @ts-expect-error protected
            expect(adapter.serialPortOptions).toStrictEqual({
                path: 'tcp://mock_adapter.local:1122',
                adapter: `zstack`,
            });
        });

        it('times out', async () => {
            mockBonjourResult.mockReturnValueOnce(null);
            const fakeAdapterName = 'mdns_test_device';

            await expect(
                Adapter.create({panID: 0, channelList: []}, {path: `mdns://${fakeAdapterName}`}, 'test.db', {disableLED: false}),
            ).rejects.toThrow(`Coordinator [${fakeAdapterName}] not found after timeout of 2000ms!`);
        });

        it('given invalid path', async () => {
            await expect(Adapter.create({panID: 0, channelList: []}, {path: `mdns://`}, 'test.db', {disableLED: false})).rejects.toThrow(
                `No mdns device specified. You must specify the coordinator mdns service type after mdns://, e.g. mdns://my-adapter`,
            );
        });

        it('returns invalid format', async () => {
            mockBonjourResult.mockReturnValueOnce({
                name: 'Mock Adapter',
                type: `my_adapter_mdns`,
                port: '1122',
                host: 'my_adapter.local',
                addresses: ['192.168.1.123'],
                txt: {
                    radio_type: undefined,
                },
            });

            await expect(Adapter.create({panID: 0, channelList: []}, {path: `mdns://my_adapter`}, 'test.db', {disableLED: false})).rejects.toThrow(
                `Coordinator returned wrong Zeroconf format! The following values are expected:\n` +
                    `txt.radio_type, got: undefined\n` +
                    `port, got: 1122`,
            );
        });
    });

    describe('TCP discovery', () => {
        it('returns config with tcp path', async () => {
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

        it('returns config with socket path', async () => {
            const adapter = await Adapter.create(
                {panID: 0x1a62, channelList: [11]},
                {path: `socket://192.168.1.321:3456`, adapter: `zstack`},
                'test.db.backup',
                {disableLED: false},
            );

            // @ts-expect-error protected
            expect(adapter.serialPortOptions).toStrictEqual({
                path: `tcp://192.168.1.321:3456`,
                adapter: `zstack`,
            });
        });

        it('returns config with hostname path', async () => {
            const adapter = await Adapter.create(
                {panID: 0x1a62, channelList: [11]},
                {path: `tcp://my-super-host:3456`, adapter: `zstack`},
                'test.db.backup',
                {disableLED: false},
            );

            // @ts-expect-error protected
            expect(adapter.serialPortOptions).toStrictEqual({
                path: `tcp://my-super-host:3456`,
                adapter: `zstack`,
            });
        });

        test.each([`tcp://192168.1.321`, `tcp://192168.1.321:INVALID`])('invalid path', async (path) => {
            await expect(
                Adapter.create({panID: 0x1a62, channelList: [11]}, {path, adapter: `zstack`}, 'test.db.backup', {
                    disableLED: false,
                }),
            ).rejects.toThrow(`Invalid TCP path, expected format: tcp://<host>:<port>`);
        });

        it('invalid adapter', async () => {
            await expect(
                Adapter.create({panID: 0x1a62, channelList: [11]}, {path: `tcp://192.168.1.321:3456`}, 'test.db.backup', {
                    disableLED: false,
                }),
            ).rejects.toThrow(`Cannot discover TCP adapters at this time. Specify valid 'adapter' and 'port' in your configuration.`);
        });
    });

    describe('USB discovery', () => {
        let listSpy: MockInstance;

        beforeAll(() => {
            listSpy = vi.spyOn(SerialPort, 'list');
            listSpy.mockReturnValue([DECONZ_CONBEE_II, EMBER_ZBDONGLE_E, ZSTACK_CC2538, ZBOSS_NORDIC, ZIGATE_PLUSV2]);
        });

        describe('without config', () => {
            it('detects each adapter', async () => {
                listSpy.mockReturnValueOnce([DECONZ_CONBEE_II]);

                let adapter = await Adapter.create({panID: 0x1a62, channelList: [11]}, {baudRate: 57600}, 'test.db.backup', {disableLED: false});

                expect(adapter).toBeInstanceOf(DeconzAdapter);
                // @ts-expect-error protected
                expect(adapter.serialPortOptions).toStrictEqual({
                    path: DECONZ_CONBEE_II.path,
                    adapter: 'deconz',
                    baudRate: 57600,
                });

                listSpy.mockReturnValueOnce([EMBER_ZBDONGLE_E]);

                adapter = await Adapter.create({panID: 0x1a62, channelList: [11]}, {baudRate: 115200}, 'test.db.backup', {disableLED: false});

                expect(adapter).toBeInstanceOf(EmberAdapter);
                // @ts-expect-error protected
                expect(adapter.serialPortOptions).toStrictEqual({
                    path: EMBER_ZBDONGLE_E.path,
                    adapter: 'ember',
                    baudRate: 115200,
                });

                listSpy.mockReturnValueOnce([ZSTACK_CC2538]);

                adapter = await Adapter.create({panID: 0x1a62, channelList: [11]}, {}, 'test.db.backup', {disableLED: false});

                expect(adapter).toBeInstanceOf(ZStackAdapter);
                // @ts-expect-error protected
                expect(adapter.serialPortOptions).toStrictEqual({
                    path: ZSTACK_CC2538.path,
                    adapter: 'zstack',
                });

                listSpy.mockReturnValueOnce([ZBOSS_NORDIC]);

                adapter = await Adapter.create({panID: 0x1a62, channelList: [11]}, {}, 'test.db.backup', {disableLED: false});

                expect(adapter).toBeInstanceOf(ZBOSSAdapter);
                // @ts-expect-error protected
                expect(adapter.serialPortOptions).toStrictEqual({
                    path: ZBOSS_NORDIC.path,
                    adapter: 'zboss',
                });

                listSpy.mockReturnValueOnce([ZIGATE_PLUSV2]);

                adapter = await Adapter.create({panID: 0x1a62, channelList: [11]}, {}, 'test.db.backup', {disableLED: false});

                expect(adapter).toBeInstanceOf(ZiGateAdapter);
                // @ts-expect-error protected
                expect(adapter.serialPortOptions).toStrictEqual({
                    path: ZIGATE_PLUSV2.path,
                    adapter: 'zigate',
                });
            });

            it('detects on Windows with manufacturer present', async () => {
                mockPlatform.mockReturnValueOnce('win32');
                listSpy.mockReturnValueOnce([
                    {
                        // Windows sample - Sonoff Dongle-E
                        path: 'COM3',
                        manufacturer: 'ITEAD',
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

            it('detects on Windows without manufacturer present', async () => {
                // Note: this is the least-accurate possible match
                mockPlatform.mockReturnValueOnce('win32');
                listSpy.mockReturnValueOnce([
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

            it('detects with pnpId instead of path', async () => {
                listSpy.mockReturnValueOnce([{...ZBOSS_NORDIC, path: '/dev/ttyUSB0', pnpId: 'usb-ZEPHYR_Zigbee_NCP_54ACCFAFA6DADC49-if00'}]);

                const adapter = await Adapter.create({panID: 0x1a62, channelList: [11]}, {}, 'test.db.backup', {disableLED: false});

                expect(adapter).toBeInstanceOf(ZBOSSAdapter);
                // @ts-expect-error protected
                expect(adapter.serialPortOptions).toStrictEqual({
                    path: '/dev/ttyUSB0',
                    adapter: 'zboss',
                });
            });

            it('detects with conflict vendor+product IDs', async () => {
                listSpy.mockReturnValueOnce([{...EMBER_SKYCONNECT, manufacturer: undefined}]);

                let adapter = await Adapter.create({panID: 0x1a62, channelList: [11]}, {}, 'test.db.backup', {disableLED: false});

                expect(adapter).toBeInstanceOf(EmberAdapter);
                // @ts-expect-error protected
                expect(adapter.serialPortOptions).toStrictEqual({
                    path: EMBER_SKYCONNECT.path,
                    adapter: 'ember',
                });

                listSpy.mockReturnValueOnce([{...ZSTACK_ZBDONGLE_P, path: '/dev/ttyACM0'}]);

                adapter = await Adapter.create({panID: 0x1a62, channelList: [11]}, {}, 'test.db.backup', {disableLED: false});

                expect(adapter).toBeInstanceOf(ZStackAdapter);
                // @ts-expect-error protected
                expect(adapter.serialPortOptions).toStrictEqual({
                    path: '/dev/ttyACM0',
                    adapter: 'zstack',
                });

                listSpy.mockReturnValueOnce([ZSTACK_SMLIGHT_SLZB_06P10]);

                adapter = await Adapter.create({panID: 0x1a62, channelList: [11]}, {}, 'test.db.backup', {disableLED: false});

                expect(adapter).toBeInstanceOf(ZStackAdapter);
                // @ts-expect-error protected
                expect(adapter.serialPortOptions).toStrictEqual({
                    path: ZSTACK_SMLIGHT_SLZB_06P10.path,
                    adapter: 'zstack',
                });

                listSpy.mockReturnValueOnce([ZSTACK_SMLIGHT_SLZB_07]);

                adapter = await Adapter.create({panID: 0x1a62, channelList: [11]}, {}, 'test.db.backup', {disableLED: false});

                expect(adapter).toBeInstanceOf(EmberAdapter);
                // @ts-expect-error protected
                expect(adapter.serialPortOptions).toStrictEqual({
                    path: ZSTACK_SMLIGHT_SLZB_07.path,
                    adapter: 'ember',
                });
            });

            it('returns first from list with multiple adapters - nothing to match against', async () => {
                // NOTE: list is currently sorted
                // const sortedPaths = [DECONZ_CONBEE_II.path, ZSTACK_CC2538.path, EMBER_ZBDONGLE_E.path].sort();
                // console.log(sortedPaths[0]);
                listSpy.mockReturnValueOnce([DECONZ_CONBEE_II, ZSTACK_CC2538, EMBER_ZBDONGLE_E]);

                const adapter = await Adapter.create({panID: 0x1a62, channelList: [11]}, {}, 'test.db.backup', {disableLED: false});

                expect(adapter).toBeInstanceOf(EmberAdapter);
                // @ts-expect-error protected
                expect(adapter.serialPortOptions).toStrictEqual({
                    path: EMBER_ZBDONGLE_E.path,
                    adapter: 'ember',
                });
            });

            it('throws on failure to get SerialPort.list', async () => {
                listSpy.mockRejectedValueOnce(new Error('spawn udevadm ENOENT'));

                await expect(Adapter.create({panID: 0x1a62, channelList: [11]}, {}, 'test.db.backup', {disableLED: false})).rejects.toThrow(
                    `USB adapter discovery error (spawn udevadm ENOENT). Specify valid 'adapter' and 'port' in your configuration.`,
                );
            });

            it('throws on failure to detect with conflict vendor+product IDs', async () => {
                listSpy.mockReturnValueOnce([{...EMBER_SKYCONNECT, path: '/dev/ttyACM0', manufacturer: undefined}]);

                await expect(Adapter.create({panID: 0x1a62, channelList: [11]}, {}, 'test.db.backup', {disableLED: false})).rejects.toThrow(
                    `USB adapter discovery error (No valid USB adapter found). Specify valid 'adapter' and 'port' in your configuration.`,
                );
            });
        });

        describe('with adapter+path config', () => {
            it('detects each adapter', async () => {
                listSpy.mockReturnValueOnce([DECONZ_CONBEE_II]);

                let adapter = await Adapter.create(
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

                listSpy.mockReturnValueOnce([EMBER_ZBDONGLE_E]);

                adapter = await Adapter.create(
                    {panID: 0x1a62, channelList: [11]},
                    {adapter: 'ember', path: EMBER_ZBDONGLE_E.path},
                    'test.db.backup',
                    {disableLED: false},
                );

                expect(adapter).toBeInstanceOf(EmberAdapter);
                // @ts-expect-error protected
                expect(adapter.serialPortOptions).toStrictEqual({
                    path: EMBER_ZBDONGLE_E.path,
                    adapter: 'ember',
                });

                listSpy.mockReturnValueOnce([EMBER_ZBDONGLE_E]);

                adapter = await Adapter.create({panID: 0x1a62, channelList: [11]}, {adapter: 'ezsp', path: EMBER_ZBDONGLE_E.path}, 'test.db.backup', {
                    disableLED: false,
                });

                expect(adapter).toBeInstanceOf(EZSPAdapter);
                // @ts-expect-error protected
                expect(adapter.serialPortOptions).toStrictEqual({
                    path: EMBER_ZBDONGLE_E.path,
                    adapter: 'ezsp',
                });

                listSpy.mockReturnValueOnce([ZSTACK_CC2538]);

                adapter = await Adapter.create({panID: 0x1a62, channelList: [11]}, {adapter: 'zstack', path: ZSTACK_CC2538.path}, 'test.db.backup', {
                    disableLED: false,
                });

                expect(adapter).toBeInstanceOf(ZStackAdapter);
                // @ts-expect-error protected
                expect(adapter.serialPortOptions).toStrictEqual({
                    path: ZSTACK_CC2538.path,
                    adapter: 'zstack',
                });

                listSpy.mockReturnValueOnce([ZBOSS_NORDIC]);

                adapter = await Adapter.create({panID: 0x1a62, channelList: [11]}, {adapter: 'zboss', path: ZBOSS_NORDIC.path}, 'test.db.backup', {
                    disableLED: false,
                });

                expect(adapter).toBeInstanceOf(ZBOSSAdapter);
                // @ts-expect-error protected
                expect(adapter.serialPortOptions).toStrictEqual({
                    path: ZBOSS_NORDIC.path,
                    adapter: 'zboss',
                });

                listSpy.mockReturnValueOnce([ZIGATE_PLUSV2]);

                adapter = await Adapter.create({panID: 0x1a62, channelList: [11]}, {adapter: 'zigate', path: ZIGATE_PLUSV2.path}, 'test.db.backup', {
                    disableLED: false,
                });

                expect(adapter).toBeInstanceOf(ZiGateAdapter);
                // @ts-expect-error protected
                expect(adapter.serialPortOptions).toStrictEqual({
                    path: ZIGATE_PLUSV2.path,
                    adapter: 'zigate',
                });
            });

            it('detects with multiple adapters connected', async () => {
                listSpy.mockReturnValueOnce([DECONZ_CONBEE_II, ZSTACK_CC2538, EMBER_ZBDONGLE_E]);

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

            it('detects with pnpId instead of path', async () => {
                listSpy.mockReturnValueOnce([{...ZBOSS_NORDIC, path: '/dev/ttyUSB0', pnpId: 'usb-ZEPHYR_Zigbee_NCP_54ACCFAFA6DADC49-if00'}]);

                const adapter = await Adapter.create({panID: 0x1a62, channelList: [11]}, {adapter: 'zboss', path: '/dev/ttyUSB0'}, 'test.db.backup', {
                    disableLED: false,
                });

                expect(adapter).toBeInstanceOf(ZBOSSAdapter);
                // @ts-expect-error protected
                expect(adapter.serialPortOptions).toStrictEqual({
                    path: '/dev/ttyUSB0',
                    adapter: 'zboss',
                });
            });

            it('detects with conflict vendor+product IDs', async () => {
                listSpy.mockReturnValueOnce([{...EMBER_SKYCONNECT, manufacturer: undefined}]);

                let adapter = await Adapter.create(
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

                listSpy.mockReturnValueOnce([{...ZSTACK_ZBDONGLE_P, path: '/dev/ttyACM0'}]);

                adapter = await Adapter.create({panID: 0x1a62, channelList: [11]}, {adapter: 'zstack', path: '/dev/ttyACM0'}, 'test.db.backup', {
                    disableLED: false,
                });

                expect(adapter).toBeInstanceOf(ZStackAdapter);
                // @ts-expect-error protected
                expect(adapter.serialPortOptions).toStrictEqual({
                    path: '/dev/ttyACM0',
                    adapter: 'zstack',
                });
            });

            it('returns instance anyway on failure to match', async () => {
                listSpy.mockReturnValueOnce([]);
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

            it('returns instance anyway on failure to match with different path', async () => {
                listSpy.mockReturnValueOnce([DECONZ_CONBEE_II]);

                const adapter = await Adapter.create(
                    {panID: 0x1a62, channelList: [11]},
                    {adapter: 'deconz', path: '/dev/ttyUSB0'},
                    'test.db.backup',
                    {
                        disableLED: false,
                    },
                );

                expect(adapter).toBeInstanceOf(DeconzAdapter);
                // @ts-expect-error protected
                expect(adapter.serialPortOptions).toStrictEqual({
                    path: '/dev/ttyUSB0',
                    adapter: 'deconz',
                });
            });

            it('returns instance anyway on failure to get SerialPort.list', async () => {
                listSpy.mockRejectedValueOnce(new Error('spawn udevadm ENOENT'));

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

            it('throws on failure to match invalid adapter', async () => {
                listSpy.mockReturnValueOnce([]);

                await expect(
                    Adapter.create(
                        {panID: 0x1a62, channelList: [11]},
                        // @ts-expect-error invalid on purpose
                        {adapter: 'invalid', path: 'dev/ttyUSB0'},
                        'test.db.backup',
                        {disableLED: false},
                    ),
                ).rejects.toThrow(`Adapter 'invalid' does not exists, possible options: deconz, ember, ezsp, zstack, zboss, zigate`);
            });
        });

        describe('with adapter only config', () => {
            it('detects each adapter', async () => {
                listSpy.mockReturnValueOnce([DECONZ_CONBEE_II]);

                let adapter = await Adapter.create({panID: 0x1a62, channelList: [11]}, {adapter: 'deconz'}, 'test.db.backup', {disableLED: false});

                expect(adapter).toBeInstanceOf(DeconzAdapter);
                // @ts-expect-error protected
                expect(adapter.serialPortOptions).toStrictEqual({
                    path: DECONZ_CONBEE_II.path,
                    adapter: 'deconz',
                });

                listSpy.mockReturnValueOnce([EMBER_ZBDONGLE_E]);

                adapter = await Adapter.create({panID: 0x1a62, channelList: [11]}, {adapter: 'ember'}, 'test.db.backup', {disableLED: false});

                expect(adapter).toBeInstanceOf(EmberAdapter);
                // @ts-expect-error protected
                expect(adapter.serialPortOptions).toStrictEqual({
                    path: EMBER_ZBDONGLE_E.path,
                    adapter: 'ember',
                });

                listSpy.mockReturnValueOnce([EMBER_ZBDONGLE_E]);

                adapter = await Adapter.create({panID: 0x1a62, channelList: [11]}, {adapter: 'ezsp'}, 'test.db.backup', {disableLED: false});

                expect(adapter).toBeInstanceOf(EZSPAdapter);
                // @ts-expect-error protected
                expect(adapter.serialPortOptions).toStrictEqual({
                    path: EMBER_ZBDONGLE_E.path,
                    adapter: 'ezsp',
                });

                listSpy.mockReturnValueOnce([ZSTACK_CC2538]);

                adapter = await Adapter.create({panID: 0x1a62, channelList: [11]}, {adapter: 'zstack'}, 'test.db.backup', {disableLED: false});

                expect(adapter).toBeInstanceOf(ZStackAdapter);
                // @ts-expect-error protected
                expect(adapter.serialPortOptions).toStrictEqual({
                    path: ZSTACK_CC2538.path,
                    adapter: 'zstack',
                });

                listSpy.mockReturnValueOnce([ZBOSS_NORDIC]);

                adapter = await Adapter.create({panID: 0x1a62, channelList: [11]}, {adapter: 'zboss'}, 'test.db.backup', {disableLED: false});

                expect(adapter).toBeInstanceOf(ZBOSSAdapter);
                // @ts-expect-error protected
                expect(adapter.serialPortOptions).toStrictEqual({
                    path: ZBOSS_NORDIC.path,
                    adapter: 'zboss',
                });

                listSpy.mockReturnValueOnce([ZIGATE_PLUSV2]);

                adapter = await Adapter.create({panID: 0x1a62, channelList: [11]}, {adapter: 'zigate'}, 'test.db.backup', {disableLED: false});

                expect(adapter).toBeInstanceOf(ZiGateAdapter);
                // @ts-expect-error protected
                expect(adapter.serialPortOptions).toStrictEqual({
                    path: ZIGATE_PLUSV2.path,
                    adapter: 'zigate',
                });
            });

            it('detects with multiple adapters connected', async () => {
                listSpy.mockReturnValueOnce([DECONZ_CONBEE_II, ZSTACK_CC2538, EMBER_ZBDONGLE_E]);

                const adapter = await Adapter.create({panID: 0x1a62, channelList: [11]}, {adapter: 'zstack'}, 'test.db.backup', {disableLED: false});

                expect(adapter).toBeInstanceOf(ZStackAdapter);
                // @ts-expect-error protected
                expect(adapter.serialPortOptions).toStrictEqual({
                    path: ZSTACK_CC2538.path,
                    adapter: 'zstack',
                });
            });

            it('detects with pnpId instead of path', async () => {
                listSpy.mockReturnValueOnce([{...ZBOSS_NORDIC, path: '/dev/ttyUSB0', pnpId: 'usb-ZEPHYR_Zigbee_NCP_54ACCFAFA6DADC49-if00'}]);

                const adapter = await Adapter.create({panID: 0x1a62, channelList: [11]}, {adapter: 'zboss'}, 'test.db.backup', {
                    disableLED: false,
                });

                expect(adapter).toBeInstanceOf(ZBOSSAdapter);
                // @ts-expect-error protected
                expect(adapter.serialPortOptions).toStrictEqual({
                    path: '/dev/ttyUSB0',
                    adapter: 'zboss',
                });
            });

            it('throws on failure to detect with conflict vendor+product IDs', async () => {
                listSpy.mockReturnValueOnce([{...EMBER_SKYCONNECT, path: '/dev/ttyACM0', manufacturer: undefined}]);

                await expect(
                    Adapter.create({panID: 0x1a62, channelList: [11]}, {adapter: 'zstack'}, 'test.db.backup', {disableLED: false}),
                ).rejects.toThrow(
                    `USB adapter discovery error (No valid USB adapter found). Specify valid 'adapter' and 'port' in your configuration.`,
                );
            });
        });

        describe('with path only config', () => {
            it('detects each adapter', async () => {
                listSpy.mockReturnValueOnce([DECONZ_CONBEE_II]);

                let adapter = await Adapter.create({panID: 0x1a62, channelList: [11]}, {path: DECONZ_CONBEE_II.path}, 'test.db.backup', {
                    disableLED: false,
                });

                expect(adapter).toBeInstanceOf(DeconzAdapter);
                // @ts-expect-error protected
                expect(adapter.serialPortOptions).toStrictEqual({
                    path: DECONZ_CONBEE_II.path,
                    adapter: 'deconz',
                });

                listSpy.mockReturnValueOnce([EMBER_ZBDONGLE_E]);

                adapter = await Adapter.create({panID: 0x1a62, channelList: [11]}, {path: EMBER_ZBDONGLE_E.path}, 'test.db.backup', {
                    disableLED: false,
                });

                expect(adapter).toBeInstanceOf(EmberAdapter);
                // @ts-expect-error protected
                expect(adapter.serialPortOptions).toStrictEqual({
                    path: EMBER_ZBDONGLE_E.path,
                    adapter: 'ember',
                });

                listSpy.mockReturnValueOnce([ZSTACK_CC2538]);

                adapter = await Adapter.create({panID: 0x1a62, channelList: [11]}, {path: ZSTACK_CC2538.path}, 'test.db.backup', {
                    disableLED: false,
                });

                expect(adapter).toBeInstanceOf(ZStackAdapter);
                // @ts-expect-error protected
                expect(adapter.serialPortOptions).toStrictEqual({
                    path: ZSTACK_CC2538.path,
                    adapter: 'zstack',
                });

                listSpy.mockReturnValueOnce([ZBOSS_NORDIC]);

                adapter = await Adapter.create({panID: 0x1a62, channelList: [11]}, {path: ZBOSS_NORDIC.path}, 'test.db.backup', {
                    disableLED: false,
                });

                expect(adapter).toBeInstanceOf(ZBOSSAdapter);
                // @ts-expect-error protected
                expect(adapter.serialPortOptions).toStrictEqual({
                    path: ZBOSS_NORDIC.path,
                    adapter: 'zboss',
                });

                listSpy.mockReturnValueOnce([ZIGATE_PLUSV2]);

                adapter = await Adapter.create({panID: 0x1a62, channelList: [11]}, {path: ZIGATE_PLUSV2.path}, 'test.db.backup', {
                    disableLED: false,
                });

                expect(adapter).toBeInstanceOf(ZiGateAdapter);
                // @ts-expect-error protected
                expect(adapter.serialPortOptions).toStrictEqual({
                    path: ZIGATE_PLUSV2.path,
                    adapter: 'zigate',
                });
            });

            it('detects with multiple adapters connected', async () => {
                listSpy.mockReturnValueOnce([DECONZ_CONBEE_II, ZSTACK_CC2538, EMBER_ZBDONGLE_E]);

                const adapter = await Adapter.create({panID: 0x1a62, channelList: [11]}, {path: ZSTACK_CC2538.path}, 'test.db.backup', {
                    disableLED: false,
                });

                expect(adapter).toBeInstanceOf(ZStackAdapter);
                // @ts-expect-error protected
                expect(adapter.serialPortOptions).toStrictEqual({
                    path: ZSTACK_CC2538.path,
                    adapter: 'zstack',
                });
            });

            it('detects with pnpId instead of path', async () => {
                listSpy.mockReturnValueOnce([{...ZBOSS_NORDIC, path: '/dev/ttyUSB0', pnpId: 'usb-ZEPHYR_Zigbee_NCP_54ACCFAFA6DADC49-if00'}]);

                const adapter = await Adapter.create({panID: 0x1a62, channelList: [11]}, {path: '/dev/ttyUSB0'}, 'test.db.backup', {
                    disableLED: false,
                });

                expect(adapter).toBeInstanceOf(ZBOSSAdapter);
                // @ts-expect-error protected
                expect(adapter.serialPortOptions).toStrictEqual({
                    path: '/dev/ttyUSB0',
                    adapter: 'zboss',
                });
            });

            it('throws on failure to match with different path', async () => {
                listSpy.mockReturnValueOnce([DECONZ_CONBEE_II]);

                await expect(
                    Adapter.create({panID: 0x1a62, channelList: [11]}, {path: '/dev/ttyUSB0'}, 'test.db.backup', {disableLED: false}),
                ).rejects.toThrow(
                    `USB adapter discovery error (No valid USB adapter found). Specify valid 'adapter' and 'port' in your configuration.`,
                );
            });
        });

        it('throws on failure to match when port info too limited', async () => {
            listSpy.mockReturnValueOnce([{...DECONZ_CONBEE_II, vendorId: undefined}]);

            await expect(Adapter.create({panID: 0x1a62, channelList: [11]}, {}, 'test.db.backup', {disableLED: false})).rejects.toThrow(
                `USB adapter discovery error (No valid USB adapter found). Specify valid 'adapter' and 'port' in your configuration.`,
            );

            listSpy.mockReturnValueOnce([{...DECONZ_CONBEE_II, productId: undefined}]);

            await expect(Adapter.create({panID: 0x1a62, channelList: [11]}, {}, 'test.db.backup', {disableLED: false})).rejects.toThrow(
                `USB adapter discovery error (No valid USB adapter found). Specify valid 'adapter' and 'port' in your configuration.`,
            );
        });
    });
});
