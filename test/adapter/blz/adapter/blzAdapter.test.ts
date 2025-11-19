import {vi} from 'vitest';
import {BLZAdapter} from '../../../../src/adapter/blz/adapter/blzAdapter';
import {Driver} from '../../../../src/adapter/blz/driver/driver';
import {BlzStatus} from '../../../../src/adapter/blz/driver/types/named';
import {BlzApsFrame} from '../../../../src/adapter/blz/driver/types/struct';
import {AdapterOptions, NetworkOptions, SerialPortOptions} from '../../../../src/adapter/tstype';
import * as Zcl from '../../../../src/zspec/zcl';
import * as Zdo from '../../../../src/zspec/zdo';
import * as ZSpec from '../../../../src/zspec';

vi.mock('../../../../src/adapter/blz/driver/driver');

describe('BLZ Adapter', () => {
    let adapter: BLZAdapter;
    let driverMock: {
        startup: ReturnType<typeof vi.fn>;
        stop: ReturnType<typeof vi.fn>;
        permitJoining: ReturnType<typeof vi.fn>;
        request: ReturnType<typeof vi.fn>;
        brequest: ReturnType<typeof vi.fn>;
        mrequest: ReturnType<typeof vi.fn>;
        makeApsFrame: ReturnType<typeof vi.fn>;
        waitFor: ReturnType<typeof vi.fn>;
        on: ReturnType<typeof vi.fn>;
        ieee: {toString: () => string};
        networkParams: {
            panId: number;
            extendedPanId: Buffer;
            Channel: number;
        };
        blz: {
            isInitialized: ReturnType<typeof vi.fn>;
            version: {product: number};
        };
        backupMan: {
            createBackup: ReturnType<typeof vi.fn>;
        };
        setNode: ReturnType<typeof vi.fn>;
    };

    const networkOptions: NetworkOptions = {
        networkKey: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
        panID: 0x1234,
        extendedPanID: [1, 2, 3, 4, 5, 6, 7, 8],
        channelList: [11],
    };

    const serialPortOptions: SerialPortOptions = {
        path: 'COM5',
        baudRate: 2000000,
        rtscts: false,
    };

    const adapterOptions: AdapterOptions = {
        concurrent: 1,
        disableLED: false,
    };

    beforeEach(async () => {
        vi.useFakeTimers();
        driverMock = {
            startup: vi.fn(),
            stop: vi.fn(),
            permitJoining: vi.fn(),
            request: vi.fn(),
            brequest: vi.fn(),
            mrequest: vi.fn(),
            makeApsFrame: vi.fn(),
            waitFor: vi.fn(),
            on: vi.fn(),
            ieee: {toString: () => '0102030405060708'},
            networkParams: {
                panId: 0x1234,
                extendedPanId: Buffer.from([1, 2, 3, 4, 5, 6, 7, 8]),
                Channel: 11,
            },
            blz: {
                isInitialized: vi.fn(),
                version: {product: 1},
            },
            backupMan: {
                createBackup: vi.fn(),
            },
            setNode: vi.fn(),
        };

        vi.mocked(Driver).mockImplementation(() => driverMock as any);
        adapter = new BLZAdapter(networkOptions, serialPortOptions, '/path/to/backup', adapterOptions);
    });

    describe('Startup and initialization', () => {

        it('should stop successfully', async () => {
            driverMock.stop.mockResolvedValue(undefined);
            await adapter.stop();
            expect(driverMock.stop).toHaveBeenCalled();
        });

        it('should get coordinator version', async () => {
            const version = await adapter.getCoordinatorVersion();
            expect(version.type).toBe('BLZ v1');
        });

        it('should get coordinator IEEE', async () => {
            const ieee = await adapter.getCoordinatorIEEE();
            expect(ieee).toBe('0x0102030405060708');
        });
    });

    describe('Network operations', () => {
        it('should permit joining on coordinator', async () => {
            driverMock.blz.isInitialized.mockReturnValue(true);
            driverMock.permitJoining.mockResolvedValue({status: BlzStatus.SUCCESS});
            driverMock.brequest.mockResolvedValue(true);
            driverMock.makeApsFrame.mockImplementation(() => {
                const frame = new BlzApsFrame();
                frame.profileId = Zdo.ZDO_PROFILE_ID;
                frame.clusterId = Zdo.ClusterId.PERMIT_JOINING_REQUEST;
                frame.sourceEndpoint = 0;
                frame.destinationEndpoint = 0;
                frame.sequence = 1;
                frame.options = 0;
                frame.groupId = 0;
                return frame;
            });

            await adapter.permitJoin(60);
            expect(driverMock.permitJoining).toHaveBeenCalledWith(60);
        }, 60000);

        it('should get network parameters', async () => {
            const params = await adapter.getNetworkParameters();
            expect(params).toEqual({
                panID: 0x1234,
                extendedPanID: '0x0102030405060708',
                channel: 11,
            });
        });
    });

    describe('Message handling', () => {
        it('should handle device join', () => {
            const callback = vi.fn();
            adapter.on('deviceJoined', callback);

            driverMock.on.mock.calls.find(call => call[0] === 'deviceJoined')?.[1](0x1234, {toString: () => '0102030405060708'});

            expect(callback).toHaveBeenCalledWith({
                networkAddress: 0x1234,
                ieeeAddr: '0102030405060708',
            });
        });

        it('should handle device leave', () => {
            const callback = vi.fn();
            adapter.on('deviceLeave', callback);

            driverMock.on.mock.calls.find(call => call[0] === 'deviceLeft')?.[1](0x1234, {toString: () => '0102030405060708'});

            expect(callback).toHaveBeenCalledWith({
                networkAddress: 0x1234,
                ieeeAddr: '0x0102030405060708',
            });
        });

        it('should process ZDO messages', () => {
            const callback = vi.fn();
            adapter.on('zdoResponse', callback);

            const apsFrame = new BlzApsFrame();
            apsFrame.profileId = Zdo.ZDO_PROFILE_ID;
            apsFrame.clusterId = 0x8000;

            driverMock.on.mock.calls.find(call => call[0] === 'incomingMessage')?.[1]({
                apsFrame,
                zdoResponse: {status: BlzStatus.SUCCESS},
                sender: 0x1234,
                lqi: 255,
            });

            expect(callback).toHaveBeenCalledWith(0x8000, {status: BlzStatus.SUCCESS});
        });

        it('should process ZCL messages', () => {
            const callback = vi.fn();
            adapter.on('zclPayload', callback);

            const apsFrame = new BlzApsFrame();
            apsFrame.profileId = ZSpec.HA_PROFILE_ID;
            apsFrame.clusterId = 0x0000;
            apsFrame.sourceEndpoint = 1;
            apsFrame.destinationEndpoint = 1;

            const message = Buffer.from([0x00, 0x00, 0x00]);

            driverMock.on.mock.calls.find(call => call[0] === 'incomingMessage')?.[1]({
                apsFrame,
                message,
                sender: 0x1234,
                lqi: 255,
            });

            expect(callback).toHaveBeenCalled();
        });
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe('Backup operations', () => {
        it('should support backup', async () => {
            const supported = await adapter.supportsBackup();
            expect(supported).toBe(true);
        });

        it('should create backup', async () => {
            driverMock.blz.isInitialized.mockReturnValue(true);
            driverMock.backupMan.createBackup.mockResolvedValue({});

            await adapter.backup();
            expect(driverMock.backupMan.createBackup).toHaveBeenCalled();
        });
    });

    describe('Error handling', () => {
        it('should handle unsupported operations', async () => {
            await expect(adapter.reset('soft')).rejects.toThrow('Not supported');
            await expect(adapter.addInstallCode('0x0102030405060708', Buffer.from([]))).rejects.toThrow('Not supported');
            await expect(adapter.restoreChannelInterPAN()).rejects.toThrow('Not supported');
            await expect(adapter.setTransmitPower(0)).rejects.toThrow('Not supported');
            await expect(adapter.setChannelInterPAN(11)).rejects.toThrow('Not supported');
        });

        it('should handle driver close', () => {
            const callback = vi.fn();
            adapter.on('disconnected', callback);

            driverMock.on.mock.calls.find(call => call[0] === 'close')?.[1]();
            expect(callback).toHaveBeenCalled();
        });
    });
});
