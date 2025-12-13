import type {BrowserConfig, Service} from "bonjour-service";
import type {MockInstance} from "vitest";

import {afterAll, beforeAll, beforeEach, describe, expect, it, vi} from "vitest";
import {Adapter, type TsType} from "../../src/adapter";
import {findAllDevices} from "../../src/adapter/adapterDiscovery";
import {DeconzAdapter} from "../../src/adapter/deconz/adapter/deconzAdapter";
import {EmberAdapter} from "../../src/adapter/ember/adapter/emberAdapter";
import {EZSPAdapter} from "../../src/adapter/ezsp/adapter/ezspAdapter";
import {SerialPort} from "../../src/adapter/serialPort";
import {ZStackAdapter} from "../../src/adapter/z-stack/adapter/zStackAdapter";
import {ZBOSSAdapter} from "../../src/adapter/zboss/adapter/zbossAdapter";
import {ZiGateAdapter} from "../../src/adapter/zigate/adapter/zigateAdapter";
import {ZoHAdapter} from "../../src/adapter/zoh/adapter/zohAdapter";
import {
    DECONZ_CONBEE_II,
    EMBER_SKYCONNECT,
    EMBER_ZBDONGLE_E,
    EMBER_ZBDONGLE_E_CP,
    ZBOSS_NORDIC,
    ZBT_1_PNPID,
    ZBT_2,
    ZIGATE_PLUSV2,
    ZSTACK_CC2538,
    ZSTACK_SMLIGHT_SLZB_06P10,
    ZSTACK_SMLIGHT_SLZB_07,
    ZSTACK_ZBDONGLE_P,
    ZWA_2_CONFLICT,
} from "../mockAdapters";

const mockPlatform = vi.fn(() => "linux");

vi.mock("node:os", () => ({
    platform: vi.fn(() => mockPlatform()),
}));

const mockBonjourResult = vi.fn().mockImplementation((type) => ({
    name: "Mock Adapter",
    type: `${type}_mdns`,
    port: "1122",
    host: "mock_adapter.local",
    addresses: ["192.168.1.123"],
    txt: {
        radio_type: `${type}`,
    },
}));
const mockBonjourFind = vi.fn((_opts: BrowserConfig | null, onup?: (service: Service) => void) => {
    if (onup) {
        onup(mockBonjourResult("zstack"));
        onup(mockBonjourResult("ezsp")); // expected as `ember` Adapter
        onup(mockBonjourResult("znp")); // expected as `zstack` Adapter
    }

    return {start: vi.fn(), stop: vi.fn()};
});
const mockBonjourFindOne = vi.fn((opts: BrowserConfig | null, _timeout: number, callback?: (service: Service) => void) => {
    if (callback) {
        callback(mockBonjourResult(opts?.type));
    }
});
const mockBonjourDestroy = vi.fn();

vi.mock("bonjour-service", () => ({
    Bonjour: vi.fn(() => ({
        find: mockBonjourFind,
        findOne: mockBonjourFindOne,
        destroy: mockBonjourDestroy,
    })),
}));

describe("Adapter", () => {
    beforeAll(() => {
        vi.useFakeTimers();
    });

    afterAll(() => {
        vi.useRealTimers();
    });

    beforeEach(() => {
        mockPlatform.mockClear();
        mockBonjourResult.mockClear();
        mockBonjourFind.mockClear();
        mockBonjourFindOne.mockClear();
        mockBonjourDestroy.mockClear();
    });

    it.each([
        ["deconz", DeconzAdapter],
        ["ember", EmberAdapter],
        ["ezsp", EZSPAdapter],
        ["zstack", ZStackAdapter],
        ["zboss", ZBOSSAdapter],
        ["zigate", ZiGateAdapter],
        ["zoh", ZoHAdapter],
    ])("Calls adapter contructor for %s", async (name, cls) => {
        const adapter = await Adapter.create(
            {
                panID: 0x1a62,
                channelList: [11],
                extendedPanID: [0xdd, 0xdd, 0xdd, 0xdd, 0xdd, 0xdd, 0xdd, 0xdd],
                networkKey: [1, 3, 5, 7, 9, 11, 13, 15, 0, 2, 4, 6, 8, 10, 12, 13],
            },
            {path: "/dev/ttyUSB0", adapter: name as TsType.Adapter},
            "test.db.backup",
            {disableLED: false},
        );

        expect(adapter).toBeInstanceOf(cls);
    });

    it("finds all devices", async () => {
        vi.spyOn(SerialPort, "list").mockResolvedValueOnce([
            Object.assign({pnpId: "deconz conbee ii", serialNumber: "", locationId: ""}, DECONZ_CONBEE_II),
            Object.assign({pnpId: "zbdongle-e", serialNumber: "", locationId: ""}, EMBER_ZBDONGLE_E),
            Object.assign({pnpId: "cc2538", serialNumber: "", locationId: ""}, ZSTACK_CC2538),
            Object.assign({pnpId: "nordic", serialNumber: "", locationId: ""}, ZBOSS_NORDIC),
            Object.assign({pnpId: "zigate-plus-v2", serialNumber: "", locationId: "", manufacturer: ""}, ZIGATE_PLUSV2),
        ]);

        const p = findAllDevices();

        await vi.advanceTimersByTimeAsync(2500);

        await expect(p).resolves.toStrictEqual([
            {
                name: "zigate-plus-v2 ()",
                path: "/dev/serial/by-id/usb-FTDI_ZiGate_ZIGATE+-if00-port0",
                adapter: "zigate",
            },
            {
                name: "zbdongle-e (ITEAD)",
                path: "/dev/serial/by-id/usb-ITEAD_SONOFF_Zigbee_3.0_USB_Dongle_Plus_V2_20240122184111-if00",
                adapter: "ember",
            },
            {
                name: "cc2538 (Texas Instruments)",
                path: "/dev/serial/by-id/usb-Texas_Instruments_CC2538_USB_CDC-if00",
                adapter: "zstack",
            },
            {
                name: "nordic (ZEPHYR)",
                path: "/dev/serial/by-id/usb-ZEPHYR_Zigbee_NCP_54ACCFAFA6DADC49-if00",
                adapter: "zboss",
            },
            {
                name: "deconz conbee ii (dresden elektronik ingenieurtechnik GmbH)",
                path: "/dev/serial/by-id/usb-dresden_elektronik_ingenieurtechnik_GmbH_ConBee_II_DE2132111-if00",
                adapter: "deconz",
            },
            {
                name: "Mock Adapter (tcp://192.168.1.123:1122)",
                path: "tcp://192.168.1.123:1122",
                adapter: "zstack",
            },
            {
                name: "Mock Adapter (tcp://192.168.1.123:1122)",
                path: "tcp://192.168.1.123:1122",
                adapter: "ember",
            },
            {
                name: "Mock Adapter (tcp://192.168.1.123:1122)",
                path: "tcp://192.168.1.123:1122",
                adapter: "zstack",
            },
        ]);
        expect(mockBonjourDestroy).toHaveBeenCalledTimes(1);
    });

    it("finds all devices with quirks", async () => {
        // on Windows
        mockPlatform.mockReturnValueOnce("win32");
        vi.spyOn(SerialPort, "list").mockResolvedValueOnce([
            Object.assign({pnpId: "zbdongle-e", serialNumber: "", locationId: "", friendlyName: "silicon labs cp210x"}, EMBER_ZBDONGLE_E_CP),
        ]);
        // `name` in `txt`, no `addresses`
        mockBonjourResult.mockImplementationOnce((type) => ({
            type: `${type}_mdns`,
            port: "1122",
            host: "mock_adapter.local",
            txt: {
                name: "Mock Adapter",
                radio_type: `${type}`,
            },
        }));
        // no name
        mockBonjourResult.mockImplementationOnce((type) => ({
            type: `${type}_mdns`,
            port: "1122",
            host: "mock_adapter.local",
            addresses: ["192.168.1.123"],
            txt: {
                radio_type: `${type}`,
            },
        }));

        const p = findAllDevices();

        await vi.advanceTimersByTimeAsync(2500);
        await expect(p).resolves.toStrictEqual([
            {
                name: "silicon labs cp210x (ITEAD)",
                path: EMBER_ZBDONGLE_E_CP.path,
                adapter: undefined,
            },
            {
                name: "Mock Adapter (tcp://mock_adapter.local:1122)",
                path: "tcp://mock_adapter.local:1122",
                adapter: "zstack",
            },
            {
                name: "Unknown (tcp://192.168.1.123:1122)",
                path: "tcp://192.168.1.123:1122",
                adapter: "ember",
            },
            {
                name: "Mock Adapter (tcp://192.168.1.123:1122)",
                path: "tcp://192.168.1.123:1122",
                adapter: "zstack",
            },
        ]);
        expect(mockBonjourDestroy).toHaveBeenCalledTimes(1);
    });

    describe("mDNS discovery", () => {
        it.each([
            ["deconz", DeconzAdapter],
            ["ember", EmberAdapter],
            ["ezsp", EmberAdapter], // `ezsp` radio_type uses `ember` Adapter
            ["zstack", ZStackAdapter],
            ["zboss", ZBOSSAdapter],
            ["zigate", ZiGateAdapter],
        ])("for %s", async (name, adapterCls) => {
            const adapter = await Adapter.create({panID: 0x1a62, channelList: [11]}, {path: `mdns://${name}`}, "test.db.backup", {disableLED: false});

            expect(adapter).toBeInstanceOf(adapterCls);
            // @ts-expect-error protected
            expect(adapter.serialPortOptions).toStrictEqual({
                path: "tcp://192.168.1.123:1122",
                adapter: name === "ezsp" ? "ember" : name,
            });
        });

        it("for zstack as znp", async () => {
            const adapter = await Adapter.create({panID: 0x1a62, channelList: [11]}, {path: "mdns://znp"}, "test.db.backup", {disableLED: false});

            expect(adapter).toBeInstanceOf(ZStackAdapter);
            // @ts-expect-error protected
            expect(adapter.serialPortOptions).toStrictEqual({
                path: "tcp://192.168.1.123:1122",
                adapter: "zstack",
            });
        });

        it("falls back to host if no addresses", async () => {
            mockBonjourResult.mockReturnValueOnce({
                name: "Mock Adapter",
                type: "my_adapter_mdns",
                port: "1122",
                host: "mock_adapter.local",
                txt: {
                    radio_type: "zstack",
                },
            });
            const adapter = await Adapter.create({panID: 0x1a62, channelList: [11]}, {path: "mdns://zstack"}, "test.db.backup", {disableLED: false});

            expect(adapter).toBeInstanceOf(ZStackAdapter);
            // @ts-expect-error protected
            expect(adapter.serialPortOptions).toStrictEqual({
                path: "tcp://mock_adapter.local:1122",
                adapter: "zstack",
            });
        });

        it("times out", async () => {
            mockBonjourResult.mockReturnValueOnce(null);
            const fakeAdapterName = "mdns_test_device";

            await expect(
                Adapter.create({panID: 0, channelList: []}, {path: `mdns://${fakeAdapterName}`}, "test.db", {disableLED: false}),
            ).rejects.toThrow(`Coordinator [${fakeAdapterName}] not found after timeout of 2000ms!`);
        });

        it("given invalid path", async () => {
            await expect(Adapter.create({panID: 0, channelList: []}, {path: "mdns://"}, "test.db", {disableLED: false})).rejects.toThrow(
                "No mdns device specified. You must specify the coordinator mdns service type after mdns://, e.g. mdns://my-adapter",
            );
        });

        it("returns invalid format", async () => {
            mockBonjourResult.mockReturnValueOnce({
                name: "Mock Adapter",
                type: "my_adapter_mdns",
                port: "1122",
                host: "my_adapter.local",
                addresses: ["192.168.1.123"],
                txt: {
                    radio_type: undefined,
                },
            });

            await expect(Adapter.create({panID: 0, channelList: []}, {path: "mdns://my_adapter"}, "test.db", {disableLED: false})).rejects.toThrow(
                "Coordinator returned wrong Zeroconf format! The following values are expected:\n" +
                    "txt.radio_type, got: undefined\n" +
                    "port, got: 1122",
            );
        });
    });

    describe("TCP discovery", () => {
        it("returns config with tcp path", async () => {
            const adapter = await Adapter.create(
                {panID: 0x1a62, channelList: [11]},
                {path: "tcp://192.168.1.321:3456", adapter: "zstack"},
                "test.db.backup",
                {disableLED: false},
            );

            // @ts-expect-error protected
            expect(adapter.serialPortOptions).toStrictEqual({
                path: "tcp://192.168.1.321:3456",
                adapter: "zstack",
            });
        });

        it("returns config with socket path", async () => {
            const adapter = await Adapter.create(
                {panID: 0x1a62, channelList: [11]},
                {path: "socket://192.168.1.321:3456", adapter: "zstack"},
                "test.db.backup",
                {disableLED: false},
            );

            // @ts-expect-error protected
            expect(adapter.serialPortOptions).toStrictEqual({
                path: "tcp://192.168.1.321:3456",
                adapter: "zstack",
            });
        });

        it("returns config with hostname path", async () => {
            const adapter = await Adapter.create(
                {panID: 0x1a62, channelList: [11]},
                {path: "tcp://my-super-host:3456", adapter: "zstack"},
                "test.db.backup",
                {disableLED: false},
            );

            // @ts-expect-error protected
            expect(adapter.serialPortOptions).toStrictEqual({
                path: "tcp://my-super-host:3456",
                adapter: "zstack",
            });
        });

        it.each(["tcp://192168.1.321", "tcp://192168.1.321:INVALID"])("invalid path", async (path) => {
            await expect(
                Adapter.create({panID: 0x1a62, channelList: [11]}, {path, adapter: "zstack"}, "test.db.backup", {
                    disableLED: false,
                }),
            ).rejects.toThrow("Invalid TCP path, expected format: tcp://<host>:<port>");
        });

        it("invalid adapter", async () => {
            await expect(
                Adapter.create({panID: 0x1a62, channelList: [11]}, {path: "tcp://192.168.1.321:3456"}, "test.db.backup", {
                    disableLED: false,
                }),
            ).rejects.toThrow(`Cannot discover TCP adapters at this time. Specify valid 'adapter' and 'port' in your configuration.`);
        });
    });

    describe("USB discovery", () => {
        let listSpy: MockInstance;

        beforeAll(() => {
            listSpy = vi.spyOn(SerialPort, "list");
            listSpy.mockReturnValue([DECONZ_CONBEE_II, EMBER_ZBDONGLE_E, ZSTACK_CC2538, ZBOSS_NORDIC, ZIGATE_PLUSV2]);
        });

        describe("without config", () => {
            it("detects each adapter", async () => {
                listSpy.mockReturnValueOnce([DECONZ_CONBEE_II]);

                let adapter = await Adapter.create({panID: 0x1a62, channelList: [11]}, {baudRate: 57600}, "test.db.backup", {disableLED: false});

                expect(adapter).toBeInstanceOf(DeconzAdapter);
                // @ts-expect-error protected
                expect(adapter.serialPortOptions).toStrictEqual({
                    path: DECONZ_CONBEE_II.path,
                    adapter: "deconz",
                    baudRate: 57600,
                });

                listSpy.mockReturnValueOnce([EMBER_ZBDONGLE_E]);

                adapter = await Adapter.create({panID: 0x1a62, channelList: [11]}, {baudRate: 115200}, "test.db.backup", {disableLED: false});

                expect(adapter).toBeInstanceOf(EmberAdapter);
                // @ts-expect-error protected
                expect(adapter.serialPortOptions).toStrictEqual({
                    path: EMBER_ZBDONGLE_E.path,
                    adapter: "ember",
                    baudRate: 115200,
                    rtscts: false,
                });

                listSpy.mockReturnValueOnce([ZSTACK_CC2538]);

                adapter = await Adapter.create({panID: 0x1a62, channelList: [11]}, {}, "test.db.backup", {disableLED: false});

                expect(adapter).toBeInstanceOf(ZStackAdapter);
                // @ts-expect-error protected
                expect(adapter.serialPortOptions).toStrictEqual({
                    path: ZSTACK_CC2538.path,
                    adapter: "zstack",
                });

                listSpy.mockReturnValueOnce([ZBOSS_NORDIC]);

                adapter = await Adapter.create({panID: 0x1a62, channelList: [11]}, {}, "test.db.backup", {disableLED: false});

                expect(adapter).toBeInstanceOf(ZBOSSAdapter);
                // @ts-expect-error protected
                expect(adapter.serialPortOptions).toStrictEqual({
                    path: ZBOSS_NORDIC.path,
                    adapter: "zboss",
                });

                listSpy.mockReturnValueOnce([ZIGATE_PLUSV2]);

                adapter = await Adapter.create({panID: 0x1a62, channelList: [11]}, {}, "test.db.backup", {disableLED: false});

                expect(adapter).toBeInstanceOf(ZiGateAdapter);
                // @ts-expect-error protected
                expect(adapter.serialPortOptions).toStrictEqual({
                    path: ZIGATE_PLUSV2.path,
                    adapter: "zigate",
                });
            });

            it("detects on Windows with manufacturer present", async () => {
                mockPlatform.mockReturnValueOnce("win32");
                listSpy.mockReturnValueOnce([
                    {
                        // Windows sample - Sonoff Dongle-E
                        path: "COM3",
                        manufacturer: "ITEAD",
                        serialNumber: "54DD002111",
                        pnpId: "USB\\VID_1A86&PID_55D4\\54DD002111",
                        locationId: "Port_#0005.Hub_#0001",
                        friendlyName: "USB-Enhanced-SERIAL CH9102 (COM3)",
                        vendorId: "1A86",
                        productId: "55D4",
                    },
                ]);

                const adapter = await Adapter.create({panID: 0x1a62, channelList: [11]}, {}, "test.db.backup", {disableLED: false});

                expect(adapter).toBeInstanceOf(EmberAdapter);
                // @ts-expect-error protected
                expect(adapter.serialPortOptions).toStrictEqual({
                    path: "COM3",
                    adapter: "ember",
                    rtscts: false,
                });
            });

            it("detects on Windows without manufacturer present", async () => {
                // Note: this is the least-accurate possible match
                mockPlatform.mockReturnValueOnce("win32");
                listSpy.mockReturnValueOnce([
                    {
                        // Windows sample - Sonoff Dongle-E
                        path: "COM3",
                        manufacturer: "wch.cn",
                        serialNumber: "54DD002111",
                        pnpId: "USB\\VID_1A86&PID_55D4\\54DD002111",
                        locationId: "Port_#0005.Hub_#0001",
                        friendlyName: "USB-Enhanced-SERIAL CH9102 (COM3)",
                        vendorId: "1A86",
                        productId: "55D4",
                    },
                ]);

                const adapter = await Adapter.create({panID: 0x1a62, channelList: [11]}, {}, "test.db.backup", {disableLED: false});

                expect(adapter).toBeInstanceOf(EmberAdapter);
                // @ts-expect-error protected
                expect(adapter.serialPortOptions).toStrictEqual({
                    path: "COM3",
                    adapter: "ember",
                    rtscts: false,
                });
            });

            it("uses default serialPortOptions of adapter", async () => {
                listSpy.mockReturnValueOnce([ZBT_2]);

                const adapter = await Adapter.create({panID: 0x1a62, channelList: [11]}, {}, "test.db.backup", {disableLED: false});

                expect(adapter).toBeInstanceOf(EmberAdapter);
                // @ts-expect-error protected
                expect(adapter.serialPortOptions).toStrictEqual({
                    adapter: "ember",
                    baudRate: 460800,
                    path: "/dev/serial/by-id/usb-Nabu_Casa_ZBT-2_10B41DE58D6C-if00",
                    rtscts: true,
                });
            });

            it("uses provided options instead of default serialPortOptions of adapter", async () => {
                listSpy.mockReturnValueOnce([ZBT_2]);

                const adapter = await Adapter.create({panID: 0x1a62, channelList: [11]}, {rtscts: false, baudRate: 1}, "test.db.backup", {
                    disableLED: false,
                });

                expect(adapter).toBeInstanceOf(EmberAdapter);
                // @ts-expect-error protected
                expect(adapter.serialPortOptions).toStrictEqual({
                    adapter: "ember",
                    baudRate: 1,
                    path: "/dev/serial/by-id/usb-Nabu_Casa_ZBT-2_10B41DE58D6C-if00",
                    rtscts: false,
                });
            });

            it("detects with pnpId instead of path", async () => {
                listSpy.mockReturnValueOnce([{...ZBOSS_NORDIC, path: "/dev/ttyUSB0", pnpId: "usb-ZEPHYR_Zigbee_NCP_54ACCFAFA6DADC49-if00"}]);

                const adapter = await Adapter.create({panID: 0x1a62, channelList: [11]}, {}, "test.db.backup", {disableLED: false});

                expect(adapter).toBeInstanceOf(ZBOSSAdapter);
                // @ts-expect-error protected
                expect(adapter.serialPortOptions).toStrictEqual({
                    path: "/dev/ttyUSB0",
                    adapter: "zboss",
                });
            });

            it("detects with conflict vendor+product IDs", async () => {
                listSpy.mockReturnValueOnce([{...EMBER_SKYCONNECT, manufacturer: undefined}]);

                let adapter = await Adapter.create({panID: 0x1a62, channelList: [11]}, {}, "test.db.backup", {disableLED: false});

                expect(adapter).toBeInstanceOf(EmberAdapter);
                // @ts-expect-error protected
                expect(adapter.serialPortOptions).toStrictEqual({
                    path: EMBER_SKYCONNECT.path,
                    adapter: "ember",
                    rtscts: true,
                });

                listSpy.mockReturnValueOnce([{...ZSTACK_ZBDONGLE_P, path: "/dev/ttyACM0"}]);

                await expect(Adapter.create({panID: 0x1a62, channelList: [11]}, {}, "test.db.backup", {disableLED: false})).rejects.toThrow(
                    `USB adapter discovery error (No valid USB adapter found). Specify valid 'adapter' and 'port' in your configuration.`,
                );

                listSpy.mockReturnValueOnce([
                    {...ZSTACK_ZBDONGLE_P, path: "/dev/ttyACM0", pnpId: ZSTACK_ZBDONGLE_P.path.replace("/dev/serial/by-id/", "")},
                ]);

                adapter = await Adapter.create({panID: 0x1a62, channelList: [11]}, {}, "test.db.backup", {disableLED: false});

                expect(adapter).toBeInstanceOf(ZStackAdapter);
                // @ts-expect-error protected
                expect(adapter.serialPortOptions).toStrictEqual({
                    path: "/dev/ttyACM0",
                    adapter: "zstack",
                });

                listSpy.mockReturnValueOnce([ZSTACK_ZBDONGLE_P]);

                adapter = await Adapter.create({panID: 0x1a62, channelList: [11]}, {}, "test.db.backup", {disableLED: false});

                expect(adapter).toBeInstanceOf(ZStackAdapter);
                // @ts-expect-error protected
                expect(adapter.serialPortOptions).toStrictEqual({
                    path: ZSTACK_ZBDONGLE_P.path,
                    adapter: "zstack",
                });

                listSpy.mockReturnValueOnce([EMBER_ZBDONGLE_E_CP]);

                adapter = await Adapter.create({panID: 0x1a62, channelList: [11]}, {}, "test.db.backup", {disableLED: false});

                expect(adapter).toBeInstanceOf(EmberAdapter);
                // @ts-expect-error protected
                expect(adapter.serialPortOptions).toStrictEqual({
                    path: EMBER_ZBDONGLE_E_CP.path,
                    adapter: "ember",
                    rtscts: false,
                });

                listSpy.mockReturnValueOnce([ZSTACK_SMLIGHT_SLZB_06P10]);

                adapter = await Adapter.create({panID: 0x1a62, channelList: [11]}, {}, "test.db.backup", {disableLED: false});

                expect(adapter).toBeInstanceOf(ZStackAdapter);
                // @ts-expect-error protected
                expect(adapter.serialPortOptions).toStrictEqual({
                    path: ZSTACK_SMLIGHT_SLZB_06P10.path,
                    adapter: "zstack",
                });

                listSpy.mockReturnValueOnce([ZSTACK_SMLIGHT_SLZB_07]);

                adapter = await Adapter.create({panID: 0x1a62, channelList: [11]}, {}, "test.db.backup", {disableLED: false});

                expect(adapter).toBeInstanceOf(EmberAdapter);
                // @ts-expect-error protected
                expect(adapter.serialPortOptions).toStrictEqual({
                    path: ZSTACK_SMLIGHT_SLZB_07.path,
                    adapter: "ember",
                    rtscts: true,
                });
            });

            it("returns first from list with multiple adapters - nothing to match against", async () => {
                // NOTE: list is currently sorted
                // const sortedPaths = [DECONZ_CONBEE_II.path, ZSTACK_CC2538.path, EMBER_ZBDONGLE_E.path].sort();
                // console.log(sortedPaths[0]);
                listSpy.mockReturnValueOnce([DECONZ_CONBEE_II, ZSTACK_CC2538, EMBER_ZBDONGLE_E]);

                const adapter = await Adapter.create({panID: 0x1a62, channelList: [11]}, {}, "test.db.backup", {disableLED: false});

                expect(adapter).toBeInstanceOf(EmberAdapter);
                // @ts-expect-error protected
                expect(adapter.serialPortOptions).toStrictEqual({
                    path: EMBER_ZBDONGLE_E.path,
                    adapter: "ember",
                    rtscts: false,
                });
            });

            it("throws on failure to get SerialPort.list", async () => {
                listSpy.mockRejectedValueOnce(new Error("spawn udevadm ENOENT"));

                await expect(Adapter.create({panID: 0x1a62, channelList: [11]}, {}, "test.db.backup", {disableLED: false})).rejects.toThrow(
                    `USB adapter discovery error (spawn udevadm ENOENT). Specify valid 'adapter' and 'port' in your configuration.`,
                );
            });

            it("throws on failure to detect with conflict vendor+product IDs", async () => {
                listSpy.mockReturnValueOnce([{...EMBER_SKYCONNECT, path: "/dev/ttyACM0", manufacturer: undefined}]);

                await expect(Adapter.create({panID: 0x1a62, channelList: [11]}, {}, "test.db.backup", {disableLED: false})).rejects.toThrow(
                    `USB adapter discovery error (No valid USB adapter found). Specify valid 'adapter' and 'port' in your configuration.`,
                );
            });

            it("detects SkyConnect ZBT-1 when ZWA-2 present", async () => {
                listSpy.mockReturnValueOnce([ZWA_2_CONFLICT, ZBT_1_PNPID]);

                const adapter = await Adapter.create({panID: 0x1a62, channelList: [11]}, {baudRate: 115200}, "test.db.backup", {disableLED: false});

                expect(adapter).toBeInstanceOf(EmberAdapter);
                // @ts-expect-error protected
                expect(adapter.serialPortOptions).toStrictEqual({
                    path: ZBT_1_PNPID.path,
                    adapter: "ember",
                    baudRate: 115200,
                    rtscts: true,
                });
            });

            it("detects SkyConnect ZBT-2 when ZWA-2 present", async () => {
                listSpy.mockReturnValueOnce([ZWA_2_CONFLICT, ZBT_2]);

                const adapter = await Adapter.create({panID: 0x1a62, channelList: [11]}, {}, "test.db.backup", {disableLED: false});

                expect(adapter).toBeInstanceOf(EmberAdapter);
                // @ts-expect-error protected
                expect(adapter.serialPortOptions).toStrictEqual({
                    path: ZBT_2.path,
                    adapter: "ember",
                    baudRate: 460800,
                    rtscts: true,
                });
            });
        });

        describe("with adapter+path config", () => {
            it("detects each adapter", async () => {
                listSpy.mockReturnValueOnce([DECONZ_CONBEE_II]);

                let adapter = await Adapter.create(
                    {panID: 0x1a62, channelList: [11]},
                    {adapter: "deconz", path: DECONZ_CONBEE_II.path},
                    "test.db.backup",
                    {disableLED: false},
                );

                expect(adapter).toBeInstanceOf(DeconzAdapter);
                // @ts-expect-error protected
                expect(adapter.serialPortOptions).toStrictEqual({
                    path: DECONZ_CONBEE_II.path,
                    adapter: "deconz",
                });

                listSpy.mockReturnValueOnce([EMBER_ZBDONGLE_E]);

                adapter = await Adapter.create(
                    {panID: 0x1a62, channelList: [11]},
                    {adapter: "ember", path: EMBER_ZBDONGLE_E.path},
                    "test.db.backup",
                    {disableLED: false},
                );

                expect(adapter).toBeInstanceOf(EmberAdapter);
                // @ts-expect-error protected
                expect(adapter.serialPortOptions).toStrictEqual({
                    path: EMBER_ZBDONGLE_E.path,
                    adapter: "ember",
                    rtscts: false,
                });

                listSpy.mockReturnValueOnce([EMBER_ZBDONGLE_E]);

                adapter = await Adapter.create({panID: 0x1a62, channelList: [11]}, {adapter: "ezsp", path: EMBER_ZBDONGLE_E.path}, "test.db.backup", {
                    disableLED: false,
                });

                expect(adapter).toBeInstanceOf(EZSPAdapter);
                // @ts-expect-error protected
                expect(adapter.serialPortOptions).toStrictEqual({
                    path: EMBER_ZBDONGLE_E.path,
                    adapter: "ezsp",
                    rtscts: false,
                });

                listSpy.mockReturnValueOnce([ZSTACK_CC2538]);

                adapter = await Adapter.create({panID: 0x1a62, channelList: [11]}, {adapter: "zstack", path: ZSTACK_CC2538.path}, "test.db.backup", {
                    disableLED: false,
                });

                expect(adapter).toBeInstanceOf(ZStackAdapter);
                // @ts-expect-error protected
                expect(adapter.serialPortOptions).toStrictEqual({
                    path: ZSTACK_CC2538.path,
                    adapter: "zstack",
                });

                listSpy.mockReturnValueOnce([ZBOSS_NORDIC]);

                adapter = await Adapter.create({panID: 0x1a62, channelList: [11]}, {adapter: "zboss", path: ZBOSS_NORDIC.path}, "test.db.backup", {
                    disableLED: false,
                });

                expect(adapter).toBeInstanceOf(ZBOSSAdapter);
                // @ts-expect-error protected
                expect(adapter.serialPortOptions).toStrictEqual({
                    path: ZBOSS_NORDIC.path,
                    adapter: "zboss",
                });

                listSpy.mockReturnValueOnce([ZIGATE_PLUSV2]);

                adapter = await Adapter.create({panID: 0x1a62, channelList: [11]}, {adapter: "zigate", path: ZIGATE_PLUSV2.path}, "test.db.backup", {
                    disableLED: false,
                });

                expect(adapter).toBeInstanceOf(ZiGateAdapter);
                // @ts-expect-error protected
                expect(adapter.serialPortOptions).toStrictEqual({
                    path: ZIGATE_PLUSV2.path,
                    adapter: "zigate",
                });
            });

            it("detects with multiple adapters connected", async () => {
                listSpy.mockReturnValueOnce([DECONZ_CONBEE_II, ZSTACK_CC2538, EMBER_ZBDONGLE_E]);

                const adapter = await Adapter.create(
                    {panID: 0x1a62, channelList: [11]},
                    {adapter: "zstack", path: ZSTACK_CC2538.path},
                    "test.db.backup",
                    {disableLED: false},
                );

                expect(adapter).toBeInstanceOf(ZStackAdapter);
                // @ts-expect-error protected
                expect(adapter.serialPortOptions).toStrictEqual({
                    path: ZSTACK_CC2538.path,
                    adapter: "zstack",
                });
            });

            it("detects with pnpId instead of path", async () => {
                listSpy.mockReturnValueOnce([{...ZBOSS_NORDIC, path: "/dev/ttyUSB0", pnpId: "usb-ZEPHYR_Zigbee_NCP_54ACCFAFA6DADC49-if00"}]);

                const adapter = await Adapter.create({panID: 0x1a62, channelList: [11]}, {adapter: "zboss", path: "/dev/ttyUSB0"}, "test.db.backup", {
                    disableLED: false,
                });

                expect(adapter).toBeInstanceOf(ZBOSSAdapter);
                // @ts-expect-error protected
                expect(adapter.serialPortOptions).toStrictEqual({
                    path: "/dev/ttyUSB0",
                    adapter: "zboss",
                });
            });

            it("uses default serialPortOptions of adapter", async () => {
                listSpy.mockReturnValueOnce([{...ZBT_2, path: "/dev/ttyUSB0"}]);

                const adapter = await Adapter.create({panID: 0x1a62, channelList: [11]}, {adapter: "ember", path: "/dev/ttyUSB0"}, "test.db.backup", {
                    disableLED: false,
                });

                expect(adapter).toBeInstanceOf(EmberAdapter);
                // @ts-expect-error protected
                expect(adapter.serialPortOptions).toStrictEqual({
                    adapter: "ember",
                    baudRate: 460800,
                    path: "/dev/ttyUSB0",
                    rtscts: true,
                });
            });

            it("detects with conflict vendor+product IDs", async () => {
                listSpy.mockReturnValueOnce([{...EMBER_SKYCONNECT, manufacturer: undefined}]);

                let adapter = await Adapter.create(
                    {panID: 0x1a62, channelList: [11]},
                    {adapter: "ember", path: EMBER_SKYCONNECT.path},
                    "test.db.backup",
                    {disableLED: false},
                );

                expect(adapter).toBeInstanceOf(EmberAdapter);
                // @ts-expect-error protected
                expect(adapter.serialPortOptions).toStrictEqual({
                    path: EMBER_SKYCONNECT.path,
                    adapter: "ember",
                    rtscts: true,
                });

                listSpy.mockReturnValueOnce([{...ZSTACK_ZBDONGLE_P, path: "/dev/ttyACM0"}]);

                adapter = await Adapter.create({panID: 0x1a62, channelList: [11]}, {adapter: "zstack", path: "/dev/ttyACM0"}, "test.db.backup", {
                    disableLED: false,
                });

                expect(adapter).toBeInstanceOf(ZStackAdapter);
                // @ts-expect-error protected
                expect(adapter.serialPortOptions).toStrictEqual({
                    path: "/dev/ttyACM0",
                    adapter: "zstack",
                });
            });

            it("returns instance anyway on failure to match", async () => {
                listSpy.mockReturnValueOnce([]);
                const adapter = await Adapter.create({panID: 0x1a62, channelList: [11]}, {adapter: "zstack", path: "dev/ttyUSB0"}, "test.db.backup", {
                    disableLED: false,
                });

                expect(adapter).toBeInstanceOf(ZStackAdapter);
                // @ts-expect-error protected
                expect(adapter.serialPortOptions).toStrictEqual({
                    path: "dev/ttyUSB0",
                    adapter: "zstack",
                });
            });

            it("returns instance anyway on failure to match with different path", async () => {
                listSpy.mockReturnValueOnce([DECONZ_CONBEE_II]);

                const adapter = await Adapter.create(
                    {panID: 0x1a62, channelList: [11]},
                    {adapter: "deconz", path: "/dev/ttyUSB0"},
                    "test.db.backup",
                    {
                        disableLED: false,
                    },
                );

                expect(adapter).toBeInstanceOf(DeconzAdapter);
                // @ts-expect-error protected
                expect(adapter.serialPortOptions).toStrictEqual({
                    path: "/dev/ttyUSB0",
                    adapter: "deconz",
                });
            });

            it("returns instance anyway on failure to get SerialPort.list", async () => {
                listSpy.mockRejectedValueOnce(new Error("spawn udevadm ENOENT"));

                const adapter = await Adapter.create(
                    {panID: 0x1a62, channelList: [11]},
                    {adapter: "zstack", path: ZSTACK_CC2538.path},
                    "test.db.backup",
                    {disableLED: false},
                );

                expect(adapter).toBeInstanceOf(ZStackAdapter);
                // @ts-expect-error protected
                expect(adapter.serialPortOptions).toStrictEqual({
                    path: ZSTACK_CC2538.path,
                    adapter: "zstack",
                });
            });

            it("throws on failure to match invalid adapter", async () => {
                listSpy.mockReturnValueOnce([]);

                await expect(
                    Adapter.create(
                        {panID: 0x1a62, channelList: [11]},
                        // @ts-expect-error invalid on purpose
                        {adapter: "invalid", path: "dev/ttyUSB0"},
                        "test.db.backup",
                        {disableLED: false},
                    ),
                ).rejects.toThrow(`Adapter 'invalid' does not exists, possible options: zstack, ember, deconz, zigate, zboss, zoh, ezsp`);
            });
        });

        describe("with adapter only config", () => {
            it("detects each adapter", async () => {
                listSpy.mockReturnValueOnce([DECONZ_CONBEE_II]);

                let adapter = await Adapter.create({panID: 0x1a62, channelList: [11]}, {adapter: "deconz"}, "test.db.backup", {disableLED: false});

                expect(adapter).toBeInstanceOf(DeconzAdapter);
                // @ts-expect-error protected
                expect(adapter.serialPortOptions).toStrictEqual({
                    path: DECONZ_CONBEE_II.path,
                    adapter: "deconz",
                });

                listSpy.mockReturnValueOnce([EMBER_ZBDONGLE_E]);

                adapter = await Adapter.create({panID: 0x1a62, channelList: [11]}, {adapter: "ember"}, "test.db.backup", {disableLED: false});

                expect(adapter).toBeInstanceOf(EmberAdapter);
                // @ts-expect-error protected
                expect(adapter.serialPortOptions).toStrictEqual({
                    path: EMBER_ZBDONGLE_E.path,
                    adapter: "ember",
                    rtscts: false,
                });

                listSpy.mockReturnValueOnce([EMBER_ZBDONGLE_E]);

                adapter = await Adapter.create({panID: 0x1a62, channelList: [11]}, {adapter: "ezsp"}, "test.db.backup", {disableLED: false});

                expect(adapter).toBeInstanceOf(EZSPAdapter);
                // @ts-expect-error protected
                expect(adapter.serialPortOptions).toStrictEqual({
                    path: EMBER_ZBDONGLE_E.path,
                    adapter: "ezsp",
                    rtscts: false,
                });

                listSpy.mockReturnValueOnce([ZSTACK_CC2538]);

                adapter = await Adapter.create({panID: 0x1a62, channelList: [11]}, {adapter: "zstack"}, "test.db.backup", {disableLED: false});

                expect(adapter).toBeInstanceOf(ZStackAdapter);
                // @ts-expect-error protected
                expect(adapter.serialPortOptions).toStrictEqual({
                    path: ZSTACK_CC2538.path,
                    adapter: "zstack",
                });

                listSpy.mockReturnValueOnce([ZBOSS_NORDIC]);

                adapter = await Adapter.create({panID: 0x1a62, channelList: [11]}, {adapter: "zboss"}, "test.db.backup", {disableLED: false});

                expect(adapter).toBeInstanceOf(ZBOSSAdapter);
                // @ts-expect-error protected
                expect(adapter.serialPortOptions).toStrictEqual({
                    path: ZBOSS_NORDIC.path,
                    adapter: "zboss",
                });

                listSpy.mockReturnValueOnce([ZIGATE_PLUSV2]);

                adapter = await Adapter.create({panID: 0x1a62, channelList: [11]}, {adapter: "zigate"}, "test.db.backup", {disableLED: false});

                expect(adapter).toBeInstanceOf(ZiGateAdapter);
                // @ts-expect-error protected
                expect(adapter.serialPortOptions).toStrictEqual({
                    path: ZIGATE_PLUSV2.path,
                    adapter: "zigate",
                });
            });

            it("detects with multiple adapters connected", async () => {
                listSpy.mockReturnValueOnce([DECONZ_CONBEE_II, ZSTACK_CC2538, EMBER_ZBDONGLE_E]);

                const adapter = await Adapter.create({panID: 0x1a62, channelList: [11]}, {adapter: "zstack"}, "test.db.backup", {disableLED: false});

                expect(adapter).toBeInstanceOf(ZStackAdapter);
                // @ts-expect-error protected
                expect(adapter.serialPortOptions).toStrictEqual({
                    path: ZSTACK_CC2538.path,
                    adapter: "zstack",
                });
            });

            it("detects with pnpId instead of path", async () => {
                listSpy.mockReturnValueOnce([{...ZBOSS_NORDIC, path: "/dev/ttyUSB0", pnpId: "usb-ZEPHYR_Zigbee_NCP_54ACCFAFA6DADC49-if00"}]);

                const adapter = await Adapter.create({panID: 0x1a62, channelList: [11]}, {adapter: "zboss"}, "test.db.backup", {
                    disableLED: false,
                });

                expect(adapter).toBeInstanceOf(ZBOSSAdapter);
                // @ts-expect-error protected
                expect(adapter.serialPortOptions).toStrictEqual({
                    path: "/dev/ttyUSB0",
                    adapter: "zboss",
                });
            });

            it("throws on failure to detect with conflict vendor+product IDs", async () => {
                listSpy.mockReturnValueOnce([{...EMBER_SKYCONNECT, path: "/dev/ttyACM0", manufacturer: undefined}]);

                await expect(
                    Adapter.create({panID: 0x1a62, channelList: [11]}, {adapter: "zstack"}, "test.db.backup", {disableLED: false}),
                ).rejects.toThrow(
                    `USB adapter discovery error (No valid USB adapter found). Specify valid 'adapter' and 'port' in your configuration.`,
                );
            });
        });

        describe("with path only config", () => {
            it("detects each adapter", async () => {
                listSpy.mockReturnValueOnce([DECONZ_CONBEE_II]);

                let adapter = await Adapter.create({panID: 0x1a62, channelList: [11]}, {path: DECONZ_CONBEE_II.path}, "test.db.backup", {
                    disableLED: false,
                });

                expect(adapter).toBeInstanceOf(DeconzAdapter);
                // @ts-expect-error protected
                expect(adapter.serialPortOptions).toStrictEqual({
                    path: DECONZ_CONBEE_II.path,
                    adapter: "deconz",
                });

                listSpy.mockReturnValueOnce([EMBER_ZBDONGLE_E]);

                adapter = await Adapter.create({panID: 0x1a62, channelList: [11]}, {path: EMBER_ZBDONGLE_E.path}, "test.db.backup", {
                    disableLED: false,
                });

                expect(adapter).toBeInstanceOf(EmberAdapter);
                // @ts-expect-error protected
                expect(adapter.serialPortOptions).toStrictEqual({
                    path: EMBER_ZBDONGLE_E.path,
                    adapter: "ember",
                    rtscts: false,
                });

                listSpy.mockReturnValueOnce([ZSTACK_CC2538]);

                adapter = await Adapter.create({panID: 0x1a62, channelList: [11]}, {path: ZSTACK_CC2538.path}, "test.db.backup", {
                    disableLED: false,
                });

                expect(adapter).toBeInstanceOf(ZStackAdapter);
                // @ts-expect-error protected
                expect(adapter.serialPortOptions).toStrictEqual({
                    path: ZSTACK_CC2538.path,
                    adapter: "zstack",
                });

                listSpy.mockReturnValueOnce([ZBOSS_NORDIC]);

                adapter = await Adapter.create({panID: 0x1a62, channelList: [11]}, {path: ZBOSS_NORDIC.path}, "test.db.backup", {
                    disableLED: false,
                });

                expect(adapter).toBeInstanceOf(ZBOSSAdapter);
                // @ts-expect-error protected
                expect(adapter.serialPortOptions).toStrictEqual({
                    path: ZBOSS_NORDIC.path,
                    adapter: "zboss",
                });

                listSpy.mockReturnValueOnce([ZIGATE_PLUSV2]);

                adapter = await Adapter.create({panID: 0x1a62, channelList: [11]}, {path: ZIGATE_PLUSV2.path}, "test.db.backup", {
                    disableLED: false,
                });

                expect(adapter).toBeInstanceOf(ZiGateAdapter);
                // @ts-expect-error protected
                expect(adapter.serialPortOptions).toStrictEqual({
                    path: ZIGATE_PLUSV2.path,
                    adapter: "zigate",
                });
            });

            it("detects with multiple adapters connected", async () => {
                listSpy.mockReturnValueOnce([DECONZ_CONBEE_II, ZSTACK_CC2538, EMBER_ZBDONGLE_E]);

                const adapter = await Adapter.create({panID: 0x1a62, channelList: [11]}, {path: ZSTACK_CC2538.path}, "test.db.backup", {
                    disableLED: false,
                });

                expect(adapter).toBeInstanceOf(ZStackAdapter);
                // @ts-expect-error protected
                expect(adapter.serialPortOptions).toStrictEqual({
                    path: ZSTACK_CC2538.path,
                    adapter: "zstack",
                });
            });

            it("detects with pnpId instead of path", async () => {
                listSpy.mockReturnValueOnce([{...ZBOSS_NORDIC, path: "/dev/ttyUSB0", pnpId: "usb-ZEPHYR_Zigbee_NCP_54ACCFAFA6DADC49-if00"}]);

                const adapter = await Adapter.create({panID: 0x1a62, channelList: [11]}, {path: "/dev/ttyUSB0"}, "test.db.backup", {
                    disableLED: false,
                });

                expect(adapter).toBeInstanceOf(ZBOSSAdapter);
                // @ts-expect-error protected
                expect(adapter.serialPortOptions).toStrictEqual({
                    path: "/dev/ttyUSB0",
                    adapter: "zboss",
                });
            });

            it("throws on failure to match with different path", async () => {
                listSpy.mockReturnValueOnce([DECONZ_CONBEE_II]);

                await expect(
                    Adapter.create({panID: 0x1a62, channelList: [11]}, {path: "/dev/ttyUSB0"}, "test.db.backup", {disableLED: false}),
                ).rejects.toThrow(
                    `USB adapter discovery error (No valid USB adapter found). Specify valid 'adapter' and 'port' in your configuration.`,
                );
            });
        });

        it("throws on failure to match when port info too limited", async () => {
            listSpy.mockReturnValueOnce([{...DECONZ_CONBEE_II, vendorId: undefined}]);

            await expect(Adapter.create({panID: 0x1a62, channelList: [11]}, {}, "test.db.backup", {disableLED: false})).rejects.toThrow(
                `USB adapter discovery error (No valid USB adapter found). Specify valid 'adapter' and 'port' in your configuration.`,
            );

            listSpy.mockReturnValueOnce([{...DECONZ_CONBEE_II, productId: undefined}]);

            await expect(Adapter.create({panID: 0x1a62, channelList: [11]}, {}, "test.db.backup", {disableLED: false})).rejects.toThrow(
                `USB adapter discovery error (No valid USB adapter found). Specify valid 'adapter' and 'port' in your configuration.`,
            );
        });
    });
});
