import {vi} from 'vitest';
import {Blz, BLZFrameData} from '../../../../src/adapter/blz/driver/blz';
import {SerialDriver} from '../../../../src/adapter/blz/driver/uart';
import {BlzStatus, BlzValueId} from '../../../../src/adapter/blz/driver/types/named';
import {SerialPortOptions} from '../../../../src/adapter/tstype';
import {FRAMES} from '../../../../src/adapter/blz/driver/commands';
import {logger} from '../../../../src/utils/logger';
import {NS} from '../../../../src/adapter/blz/driver/blz';
import {
    MAX_SERIAL_CONNECT_ATTEMPTS,
    SERIAL_CONNECT_NEW_ATTEMPT_MIN_DELAY
} from '../../../../src/adapter/blz/driver/blz';

vi.mock('../../../../src/adapter/blz/driver/uart');

// Mock BLZFrameData
vi.mock('../../../../src/adapter/blz/driver/blz', async () => {
    const actual = await vi.importActual('../../../../src/adapter/blz/driver/blz');
    return {
        ...actual,
        BLZFrameData: {
            createFrame: vi.fn().mockImplementation((frameId: number, isRequest: boolean, params: any) => {
                const frameName = Object.entries(FRAMES).find(([_, desc]) => desc.ID === frameId)?.[0];
                if (!frameName) {
                    throw new Error(`Unknown frame ID: ${frameId}`);
                }
                return {
                    _cls_: frameName,
                    _id_: frameId,
                    _isRequest_: isRequest,
                    ...params,
                };
            }),
        },
    };
});

describe('BLZ Driver', () => {
    let blz: Blz;
    let serialDriverMock: {
        connect: ReturnType<typeof vi.fn>;
        close: ReturnType<typeof vi.fn>;
        isInitialized: ReturnType<typeof vi.fn>;
        sendDATA: ReturnType<typeof vi.fn>;
        on: ReturnType<typeof vi.fn>;
        off: ReturnType<typeof vi.fn>;
    };

    const serialPortOptions: SerialPortOptions = {
        path: 'COM5',
        baudRate: 115200,
        rtscts: false,
    };

    beforeEach(() => {
        vi.useFakeTimers();
        serialDriverMock = {
            connect: vi.fn(),
            close: vi.fn(),
            isInitialized: vi.fn(),
            sendDATA: vi.fn(),
            on: vi.fn(),
            off: vi.fn(),
        };

        vi.mocked(SerialDriver).mockImplementation(() => serialDriverMock as any);
        blz = new Blz();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe('Connection', () => {
        it('should connect successfully', async () => {
            serialDriverMock.connect.mockResolvedValue(undefined);
            serialDriverMock.isInitialized.mockReturnValue(true);

            await blz.connect(serialPortOptions);
            expect(serialDriverMock.connect).toHaveBeenCalledWith(serialPortOptions);
            expect(blz.isInitialized()).toBe(true);
        });

        // it('should handle connection failure', async () => {
        //     // Mock connection to fail all attempts
        //     serialDriverMock.connect.mockRejectedValue(new Error('Connection failed'));
        //     serialDriverMock.isInitialized.mockReturnValue(false);

        //     // Spy on logger to verify error messages
        //     const loggerSpy = vi.spyOn(logger, 'error');
        //     const loggerDebugSpy = vi.spyOn(logger, 'debug');

        //     const connectPromise = blz.connect(serialPortOptions);

        //     // Advance time for each retry attempt and verify behavior
        //     for (let i = 1; i <= MAX_SERIAL_CONNECT_ATTEMPTS; i++) {
        //         await vi.advanceTimersByTimeAsync(SERIAL_CONNECT_NEW_ATTEMPT_MIN_DELAY * i);
                
        //         // Verify appropriate error logging
        //         expect(loggerSpy).toHaveBeenCalledWith(
        //             expect.stringContaining(`Connection attempt ${i} failed`),
        //             NS
        //         );

        //         if (i < MAX_SERIAL_CONNECT_ATTEMPTS) {
        //             expect(loggerDebugSpy).toHaveBeenCalledWith(
        //                 expect.stringContaining(`Waiting ${SERIAL_CONNECT_NEW_ATTEMPT_MIN_DELAY * i}ms`),
        //                 NS
        //             );
        //         }
        //     }

        //     // Verify final error and connection state
        //     const err = await connectPromise.catch(e => e);
        //     expect(err.message).toContain(`Failed to connect after ${MAX_SERIAL_CONNECT_ATTEMPTS} attempts`);
        //     expect(err.cause).toBeDefined();
        //     expect(err.cause.message).toBe('Connection failed');
        //     expect(blz.isInitialized()).toBe(false);
            
        //     // Verify connection attempts were made the correct number of times
        //     expect(serialDriverMock.connect).toHaveBeenCalledTimes(MAX_SERIAL_CONNECT_ATTEMPTS);
        // });

        it('should handle disconnection', async () => {
            serialDriverMock.connect.mockResolvedValue(undefined);
            serialDriverMock.isInitialized.mockReturnValue(true);
            await blz.connect(serialPortOptions);

            await blz.close(true);
            expect(serialDriverMock.close).toHaveBeenCalledWith(true);
        });
    });

    describe('Value operations', () => {
        beforeEach(async () => {
            serialDriverMock.connect.mockResolvedValue(undefined);
            serialDriverMock.isInitialized.mockReturnValue(true);
            await blz.connect(serialPortOptions);
        });

        it('should get value successfully', async () => {
            const mockValue = Buffer.from([1, 2]);

            // Mock successful request with immediate response
            serialDriverMock.sendDATA.mockImplementation(() => {
                // Immediately emit the response after sendDATA is called
                const data = Buffer.alloc(10);
                data.writeUInt16LE(FRAMES.getValue.ID, 2); // frameId
                data[4] = BlzStatus.SUCCESS; // status
                data[5] = mockValue.length; // valueLength
                mockValue.copy(data, 6); // value
                
                // Find the 'received' event handler and call it with our response
                const receivedHandler = serialDriverMock.on.mock.calls.find(call => call[0] === 'received')?.[1];
                if (receivedHandler) {
                    receivedHandler(data);
                }
                
                return Promise.resolve(undefined);
            });

            // Execute and wait for the response
            const result = await blz.getValue(BlzValueId.BLZ_VALUE_ID_STACK_VERSION);
            expect(result).toEqual(mockValue);
        }, 10000); // Increase timeout for this test
    });


    describe('Event handling', () => {
        beforeEach(async () => {
            serialDriverMock.connect.mockResolvedValue(undefined);
            serialDriverMock.isInitialized.mockReturnValue(true);
            await blz.connect(serialPortOptions);
        });

        it('should handle close events', () => {
            const callback = vi.fn();
            blz.on('close', callback);

            serialDriverMock.on.mock.calls.find(call => call[0] === 'close')?.[1]();
            expect(callback).toHaveBeenCalled();
        });
    });
});
