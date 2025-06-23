import {vi} from 'vitest';
import * as fs from 'fs';
import {BLZAdapterBackup} from '../../../../src/adapter/blz/adapter/backup';
import {Driver} from '../../../../src/adapter/blz/driver/driver';
import {BlzStatus, BlzValueId} from '../../../../src/adapter/blz/driver/types/named';
import * as BackupUtils from '../../../../src/utils/backup';

vi.mock('fs');
vi.mock('../../../../src/adapter/blz/driver/driver');
vi.mock('../../../../src/utils/backup');

describe('BLZ Adapter Backup', () => {
    let backup: BLZAdapterBackup;
    let driverMock: {
        blz: {
            version: {product: number};
            execCommand: ReturnType<typeof vi.fn>;
        };
        getGlobalTcLinkKey: ReturnType<typeof vi.fn>;
        getNetworkKeyInfo: ReturnType<typeof vi.fn>;
    };

    const backupPath = '/path/to/backup.json';

    beforeEach(() => {
        driverMock = {
            blz: {
                version: {product: 1},
                execCommand: vi.fn(),
            },
            getGlobalTcLinkKey: vi.fn(),
            getNetworkKeyInfo: vi.fn(),
        };

        vi.mocked(Driver).mockImplementation(() => driverMock as any);
        backup = new BLZAdapterBackup(driverMock as any, backupPath);
    });

    describe('Creating backup', () => {
        it('should create backup successfully', async () => {
            // Mock network parameters response
            driverMock.blz.execCommand.mockImplementation((cmd: string, params?: any) => {
                if (cmd === 'getNetworkParameters') {
                    return Promise.resolve({
                        panId: 0x1234,
                        extPanId: (() => {
                            const value = BigInt('0x0102030405060708');
                            // Match the implementation's byte order
                            const bytes = [];
                            let extPanId = value;
                            for (let i = 0; i < 8; i++) {
                                bytes.unshift(Number(extPanId & 0xFFn));
                                extPanId >>= 8n;
                            }
                            return value;
                        })(),
                        channel: 11,
                        channelMask: 0x800, // Channel 11
                        nwkUpdateId: 0,
                    });
                } else if (cmd === 'getValue' && params?.valueId === BlzValueId.BLZ_VALUE_ID_MAC_ADDRESS) {
                    return Promise.resolve({
                        value: Buffer.from([1, 2, 3, 4, 5, 6, 7, 8]),
                    });
                }
                return Promise.resolve({status: BlzStatus.SUCCESS});
            });

            // Mock key responses
            driverMock.getGlobalTcLinkKey.mockResolvedValue({
                linkKey: Buffer.from([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]),
                outgoingFrameCounter: 1234,
            });

            driverMock.getNetworkKeyInfo.mockResolvedValue({
                nwkKey: Buffer.from([16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1]),
                nwkKeySeqNum: 5,
                outgoingFrameCounter: 5678,
            });

            const result = await backup.createBackup();

            expect(result).toEqual({
                blz: {
                    version: 1,
                    tclk: Buffer.from([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]),
                    tclkFrameCounter: 1234,
                },
                networkOptions: {
                    panId: 0x1234,
                    extendedPanId: (() => {
                        const bytes = [];
                        let extPanId = BigInt('0x0102030405060708');
                        for (let i = 0; i < 8; i++) {
                            bytes.unshift(Number(extPanId & 0xFFn));
                            extPanId >>= 8n;
                        }
                        return Buffer.from(bytes);
                    })(),
                    channelList: [11],
                    networkKey: Buffer.from([16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1]),
                    networkKeyDistribute: true,
                },
                logicalChannel: 11,
                networkKeyInfo: {
                    sequenceNumber: 5,
                    frameCounter: 5678,
                },
                securityLevel: 5,
                networkUpdateId: 0,
                coordinatorIeeeAddress: Buffer.from([1, 2, 3, 4, 5, 6, 7, 8]),
                devices: [],
            });
        });
    });

    describe('Loading backup', () => {
        it('should load unified backup successfully', async () => {
            const mockBackupData = {
                metadata: {
                    format: 'zigpy/open-coordinator-backup',
                    version: 1,
                },
                // Add other backup data fields
            };

            const mockParsedBackup = {
                networkOptions: {
                    panId: 0x1234,
                    extendedPanId: Buffer.from([1, 2, 3, 4, 5, 6, 7, 8]),
                    channelList: [11],
                },
                // Add other parsed backup fields
            };

            vi.mocked(fs.accessSync).mockImplementation(() => undefined);
            vi.mocked(fs.readFileSync).mockReturnValue(Buffer.from(JSON.stringify(mockBackupData)));
            vi.mocked(BackupUtils.fromUnifiedBackup).mockReturnValue(mockParsedBackup as any);

            const result = await backup.getStoredBackup();
            expect(result).toBe(mockParsedBackup);
        });

        it('should handle missing backup file', async () => {
            vi.mocked(fs.accessSync).mockImplementation(() => {
                throw new Error('File not found');
            });

            const result = await backup.getStoredBackup();
            expect(result).toBeUndefined();
        });

        it('should handle corrupted backup file', async () => {
            vi.mocked(fs.accessSync).mockImplementation(() => undefined);
            vi.mocked(fs.readFileSync).mockReturnValue(Buffer.from('invalid json'));

            await expect(backup.getStoredBackup()).rejects.toThrow('Coordinator backup is corrupted');
        });

        it('should handle unsupported backup version', async () => {
            const mockBackupData = {
                metadata: {
                    format: 'zigpy/open-coordinator-backup',
                    version: 2,
                },
            };

            vi.mocked(fs.accessSync).mockImplementation(() => undefined);
            vi.mocked(fs.readFileSync).mockReturnValue(Buffer.from(JSON.stringify(mockBackupData)));

            await expect(backup.getStoredBackup()).rejects.toThrow('Unsupported open coordinator backup version');
        });

        it('should handle unknown backup format', async () => {
            const mockBackupData = {
                someOtherFormat: true,
            };

            vi.mocked(fs.accessSync).mockImplementation(() => undefined);
            vi.mocked(fs.readFileSync).mockReturnValue(Buffer.from(JSON.stringify(mockBackupData)));

            await expect(backup.getStoredBackup()).rejects.toThrow('Unknown backup format');
        });
    });
});
