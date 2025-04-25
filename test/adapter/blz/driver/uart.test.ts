import {vi} from 'vitest';
import {SerialPort} from '../../../../src/adapter/serialPort';
import {SerialDriver} from '../../../../src/adapter/blz/driver/uart';
import {Frame} from '../../../../src/adapter/blz/driver/frame';
import {Parser} from '../../../../src/adapter/blz/driver/parser';
import {Writer} from '../../../../src/adapter/blz/driver/writer';
import {SerialPortOptions} from '../../../../src/adapter/tstype';

vi.mock('../../../../src/adapter/serialPort');
vi.mock('../../../../src/adapter/blz/driver/parser');
vi.mock('../../../../src/adapter/blz/driver/writer');

// Don't mock Frame since we need its actual implementation
vi.mock('../../../../src/adapter/blz/driver/frame', () => {
    return {
        Frame: vi.fn().mockImplementation((buffer: Buffer) => {
            return {
                control: buffer[0],
                sequence: buffer[1],
                frameId: buffer.readUInt16LE(2),
                payload: buffer.subarray(4, -2),
                buffer: buffer,
                checkCRC: vi.fn(),
                toString: () => buffer.toString('hex'),
            };
        }),
    };
});

describe('BLZ Serial Driver', () => {
    let driver: SerialDriver;
    let serialPortMock: {
        asyncOpen: ReturnType<typeof vi.fn>;
        asyncFlushAndClose: ReturnType<typeof vi.fn>;
        pipe: ReturnType<typeof vi.fn>;
        once: ReturnType<typeof vi.fn>;
        on: ReturnType<typeof vi.fn>;
        isOpen: boolean;
    };
    let parserMock: {
        on: ReturnType<typeof vi.fn>;
        reset: ReturnType<typeof vi.fn>;
    };
    let writerMock: {
        pipe: ReturnType<typeof vi.fn>;
        sendACK: ReturnType<typeof vi.fn>;
        sendReset: ReturnType<typeof vi.fn>;
        sendData: ReturnType<typeof vi.fn>;
    };

    const serialPortOptions: SerialPortOptions = {
        path: '/dev/ttyUSB0',
        baudRate: 115200,
        rtscts: false,
    };

    function createFrame(frameId: number, sequence: number, control: number, payload?: Buffer): Frame {
        const headerLength = 4; // control + sequence + frameId
        const crcLength = 2;
        const payloadLength = payload ? payload.length : 0;
        const buffer = Buffer.alloc(headerLength + payloadLength + crcLength);

        buffer[0] = control;
        buffer[1] = sequence;
        buffer.writeUInt16LE(frameId, 2);
        
        if (payload) {
            payload.copy(buffer, headerLength);
        }

        // Mock CRC bytes
        buffer[buffer.length - 2] = 0xFF;
        buffer[buffer.length - 1] = 0xFF;

        return new Frame(buffer);
    }

    beforeEach(() => {
        serialPortMock = {
            asyncOpen: vi.fn(),
            asyncFlushAndClose: vi.fn(),
            pipe: vi.fn(),
            once: vi.fn(),
            on: vi.fn(),
            isOpen: true,
        };

        parserMock = {
            on: vi.fn(),
            reset: vi.fn(),
        };

        writerMock = {
            pipe: vi.fn(),
            sendACK: vi.fn(),
            sendReset: vi.fn(),
            sendData: vi.fn(),
        };

        vi.mocked(SerialPort).mockImplementation(() => serialPortMock as any);
        vi.mocked(Parser).mockImplementation(() => parserMock as any);
        vi.mocked(Writer).mockImplementation(() => writerMock as any);

        driver = new SerialDriver();
    });

    describe('Connection', () => {
        it('should connect successfully', async () => {
            serialPortMock.asyncOpen.mockResolvedValue(undefined);

            await driver.connect(serialPortOptions);

            expect(SerialPort).toHaveBeenCalledWith({
                path: serialPortOptions.path,
                baudRate: serialPortOptions.baudRate,
                rtscts: serialPortOptions.rtscts,
                autoOpen: false,
                parity: 'none',
                stopBits: 1,
                xon: false,
                xoff: false,
            });
            expect(serialPortMock.asyncOpen).toHaveBeenCalled();
            expect(driver.isInitialized()).toBe(true);
        });

        it('should handle connection failure', async () => {
            serialPortMock.asyncOpen.mockRejectedValue(new Error('Connection failed'));

            await expect(driver.connect(serialPortOptions)).rejects.toThrow('Connection failed');
            expect(driver.isInitialized()).toBe(false);
        });

        it('should handle disconnection', async () => {
            serialPortMock.asyncOpen.mockResolvedValue(undefined);
            serialPortMock.asyncFlushAndClose.mockResolvedValue(undefined);

            await driver.connect(serialPortOptions);
            await driver.close(true);

            expect(serialPortMock.asyncFlushAndClose).toHaveBeenCalled();
            expect(driver.isInitialized()).toBe(false);
        });
    });

    describe('Frame handling', () => {
        beforeEach(async () => {
            serialPortMock.asyncOpen.mockResolvedValue(undefined);
            await driver.connect(serialPortOptions);
        });

        it('should handle DATA frames', () => {
            const callback = vi.fn();
            driver.on('received', callback);

            const payload = Buffer.from([1, 2, 3]);
            const frame = createFrame(0x0000, 0x01, 0x00, payload);

            parserMock.on.mock.calls.find(call => call[0] === 'parsed')?.[1](frame);

            expect(writerMock.sendACK).toHaveBeenCalledWith(frame.sequence & 0x07);
            expect(callback).toHaveBeenCalledWith(frame.buffer);
        });

        it('should handle ACK frames', () => {
            const frame = createFrame(0x0001, 0x01, 0x00);

            parserMock.on.mock.calls.find(call => call[0] === 'parsed')?.[1](frame);

            // ACK frames are handled internally by the waitress
            expect(writerMock.sendACK).not.toHaveBeenCalled();
        });

        it('should handle RESET frames', () => {
            const frame = createFrame(0x0003, 0x01, 0x00);

            parserMock.on.mock.calls.find(call => call[0] === 'parsed')?.[1](frame);

            // RESET frames are just logged
            expect(writerMock.sendACK).not.toHaveBeenCalled();
        });

        it('should handle ERROR frames', async () => {
            const frame = createFrame(0x0002, 0x01, 0x00);

            parserMock.on.mock.calls.find(call => call[0] === 'parsed')?.[1](frame);

            // ERROR frames trigger a reset
            expect(writerMock.sendReset).toHaveBeenCalled();
            expect(parserMock.reset).toHaveBeenCalled();
        });
    });

    describe('Data sending', () => {
        beforeEach(async () => {
            serialPortMock.asyncOpen.mockResolvedValue(undefined);
            await driver.connect(serialPortOptions);
        });

        it('should send data successfully', async () => {
            const data = Buffer.from([1, 2, 3]);
            const frameId = 0x0000;

            // Mock successful send with proper async timing
            writerMock.sendData.mockImplementation(() => {
                setImmediate(() => {
                    const frame = createFrame(frameId, 0x01, 0x00);
                    parserMock.on.mock.calls.find(call => call[0] === 'parsed')?.[1](frame);
                });
                return Promise.resolve();
            });

            await driver.sendDATA(data, frameId);
            expect(writerMock.sendData).toHaveBeenCalledWith(data, expect.any(Number), expect.any(Number), frameId, true, false);
        });

        it('should handle send failure with retries', async () => {
            const data = Buffer.from([1, 2, 3]);
            const frameId = 0x0000;

            // Mock failed send with proper timeout handling
            writerMock.sendData.mockImplementation(() => {
                return new Promise((resolve) => {
                    // Delay longer than the retry timeout to trigger failure
                    setTimeout(resolve, 100);
                });
            });

            await expect(driver.sendDATA(data, frameId, 1)).rejects.toThrow('Failed to send data after 1 retries');
            expect(writerMock.sendData).toHaveBeenCalledTimes(2); // Initial + 1 retry
        });
    });

    describe('Error handling', () => {
        beforeEach(async () => {
            serialPortMock.asyncOpen.mockResolvedValue(undefined);
            await driver.connect(serialPortOptions);
        });

        it('should handle port errors', () => {
            const callback = vi.fn();
            driver.on('reset', callback);

            // Trigger error event synchronously
            serialPortMock.on.mock.calls.find(call => call[0] === 'error')?.[1](new Error('Port error'));

            // Port errors are just logged
            expect(callback).not.toHaveBeenCalled();
        });

        it('should handle port close with error', () => {
            const callback = vi.fn();
            driver.on('reset', callback);

            // Trigger close event synchronously
            serialPortMock.once.mock.calls.find(call => call[0] === 'close')?.[1](new Error('Close error'));

            expect(callback).toHaveBeenCalled();
        });

        it('should handle normal port close', () => {
            const callback = vi.fn();
            driver.on('close', callback);

            // Trigger close event synchronously
            serialPortMock.once.mock.calls.find(call => call[0] === 'close')?.[1](false);

            expect(callback).toHaveBeenCalled();
            expect(driver.isInitialized()).toBe(false);
        });
    });
});
