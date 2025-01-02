import {FrameType} from '../../../src/adapter/ezsp/driver/frame';
import {Parser} from '../../../src/adapter/ezsp/driver/parser';
import {SerialDriver} from '../../../src/adapter/ezsp/driver/uart';
import {Writer} from '../../../src/adapter/ezsp/driver/writer';
import {SerialPort} from '../../../src/adapter/serialPort';

let mockParser;
const mockSerialPortClose = vi.fn().mockImplementation((cb) => (cb ? cb() : null));
const mockSerialPortFlush = vi.fn().mockImplementation((cb) => cb());
const mockSerialPortAsyncFlushAndClose = vi.fn();
const mockSerialPortPipe = vi.fn().mockImplementation((parser) => {
    mockParser = parser;
});
const mockSerialPortList = vi.fn().mockReturnValue([]);
const mockSerialPortOpen = vi.fn().mockImplementation((cb) => cb());
const mockSerialPortAsyncOpen = vi.fn();
const mockSerialPortConstructor = vi.fn();
const mockSerialPortOnce = vi.fn();
const mockSerialPortSet = vi.fn().mockImplementation((opts, cb) => cb());
const mockSerialPortWrite = vi.fn((buffer, cb) => (cb ? cb() : null));
let mockSerialPortIsOpen = false;

vi.mock('../../../src/adapter/serialPort', () => ({
    SerialPort: vi.fn(() => ({
        close: mockSerialPortClose,
        constructor: mockSerialPortConstructor,
        emit: () => {},
        on: () => {},
        once: mockSerialPortOnce,
        open: mockSerialPortOpen,
        pipe: mockSerialPortPipe,
        set: mockSerialPortSet,
        write: mockSerialPortWrite,
        flush: mockSerialPortFlush,
        isOpen: mockSerialPortIsOpen,
        asyncOpen: mockSerialPortAsyncOpen,
        asyncFlushAndClose: mockSerialPortAsyncFlushAndClose,
    })),
}));

vi.mock('../../../src/utils/wait', () => ({
    wait: vi.fn(() => {
        return new Promise<void>((resolve) => resolve());
    }),
}));

let writeBufferSpy;

const mocks = [
    mockSerialPortClose,
    mockSerialPortPipe,
    mockSerialPortConstructor,
    mockSerialPortOpen,
    mockSerialPortOnce,
    mockSerialPortWrite,
    SerialPort,
    mockSerialPortAsyncFlushAndClose,
    mockSerialPortAsyncOpen,
];

describe('UART', () => {
    let serialDriver;
    beforeAll(async () => {
        vi.useFakeTimers();
    });

    afterAll(async () => {
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    beforeEach(() => {
        for (let mock of mocks) {
            // @ts-ignore
            mock.mockClear();
        }

        // @ts-ignore; make sure we always get a new instance
        serialDriver = new SerialDriver();
        writeBufferSpy = vi.spyOn(Writer.prototype, 'writeBuffer').mockImplementation((buffer) => {
            if (buffer[0] == 0x1a) {
                serialDriver.waitress.resolve({sequence: -1});
            }
        });
        vi.spyOn(Writer.prototype, 'pipe').mockImplementation(vi.fn());
    });

    afterEach(() => {
        writeBufferSpy.mockRestore();
    });

    it('Connect', async () => {
        await serialDriver.connect({path: '/dev/ttyACM0'});

        expect(SerialPort).toHaveBeenCalledTimes(1);
        expect(SerialPort).toHaveBeenCalledWith({
            path: '/dev/ttyACM0',
            baudRate: 115200,
            rtscts: false,
            autoOpen: false,
            parity: 'none',
            stopBits: 1,
            xon: true,
            xoff: true,
        });

        expect(mockSerialPortPipe).toHaveBeenCalledTimes(1);
        expect(mockSerialPortAsyncOpen).toHaveBeenCalledTimes(1);
        expect(mockSerialPortOnce).toHaveBeenCalledTimes(1);
        expect(writeBufferSpy).toHaveBeenCalledTimes(1);
    });

    it('Send data', async () => {
        await serialDriver.connect('/dev/ttyACM0', {});
        // send 8 frames
        serialDriver.sendDATA(Buffer.from([1, 2, 3]));
        serialDriver.sendDATA(Buffer.from([1, 2, 3]));
        serialDriver.sendDATA(Buffer.from([1, 2, 3]));
        serialDriver.sendDATA(Buffer.from([1, 2, 3]));
        serialDriver.sendDATA(Buffer.from([1, 2, 3]));
        serialDriver.sendDATA(Buffer.from([1, 2, 3]));
        serialDriver.sendDATA(Buffer.from([1, 2, 3]));
        serialDriver.sendDATA(Buffer.from([1, 2, 3]));
        expect(writeBufferSpy).toHaveBeenCalledTimes(2);
        // send another 2 frame - not counted, until resolve 8 promices
        serialDriver.sendDATA(Buffer.from([1, 2, 3]));
        serialDriver.sendDATA(Buffer.from([1, 2, 3]));
        expect(writeBufferSpy).toHaveBeenCalledTimes(2);
    });

    it('Receive data', async () => {
        const parsed = [];
        const parser = new Parser();
        parser.on('parsed', (result) => parsed.push(result));
        // send 4 frames
        const buffer0 = Buffer.from([0xc1, 0x02, 0x0b, 0x0a, 0x52, 0x7e]);
        const buffer1 = Buffer.from([
            0x22, 0x5b, 0xb1, 0xa9, 0x0d, 0x2a, 0xc1, 0xd8, 0x19, 0x53, 0x4a, 0x14, 0xaa, 0xe9, 0x87, 0x49, 0xfc, 0xfa, 0x26, 0x7d, 0x5e, 0xc5, 0xaa,
            0xc8, 0x7e,
        ]);
        const buffer2 = Buffer.from([
            0x32, 0x5b, 0xb1, 0xa9, 0x7d, 0x31, 0x2a, 0x15, 0xb6, 0x58, 0x8d, 0x4a, 0x06, 0xab, 0x55, 0x93, 0x49, 0x9c, 0x45, 0x7b, 0x7d, 0x38, 0x39,
            0xa4, 0x98, 0x74, 0xf1, 0xd7, 0x26, 0x88, 0xfc, 0x6b, 0x2f, 0xf6, 0xe9, 0xc5, 0xde, 0x6b, 0x8f, 0xfb, 0xd8, 0xf9, 0x7e,
        ]);
        const buffer3 = Buffer.from([0xa2, 0x74, 0x58, 0x7e]);
        parser._transform(buffer0, '', () => {});
        parser._transform(buffer1, '', () => {});
        parser._transform(buffer2, '', () => {});
        parser._transform(buffer3, '', () => {});
        expect(parsed.length).toBe(4);
        expect(parsed[0].type).toBe(FrameType.RSTACK);
        expect(parsed[1].type).toBe(FrameType.DATA);
        expect(parsed[2].type).toBe(FrameType.DATA);
        expect(parsed[3].type).toBe(FrameType.NAK);
    });

    it('Message in two chunks', async () => {
        const parsed = [];
        const parser = new Parser();
        parser.on('parsed', (result) => parsed.push(result));
        const buffer1 = Buffer.from([0x22, 0x5b, 0xb1, 0xa9, 0x0d, 0x2a, 0xc1, 0xd8, 0x19, 0x53, 0x4a, 0x14]);
        parser._transform(buffer1, '', () => {});
        expect(parsed.length).toBe(0);
        const buffer2 = Buffer.from([0xaa, 0xe9, 0x87, 0x49, 0xfc, 0xfa, 0x26, 0x7d, 0x5e, 0xc5, 0xaa, 0xc8, 0x7e]);
        parser._transform(buffer2, '', () => {});
        expect(parsed.length).toBe(1);
        expect(parsed[0].type).toBe(FrameType.DATA);
    });

    it('Two messages in one chunk', async () => {
        const parsed = [];
        const parser = new Parser();
        parser.on('parsed', (result) => parsed.push(result));
        const buffer1 = Buffer.from([
            0x22, 0x5b, 0xb1, 0xa9, 0x0d, 0x2a, 0xc1, 0xd8, 0x19, 0x53, 0x4a, 0x14, 0xaa, 0xe9, 0x87, 0x49, 0xfc, 0xfa, 0x26, 0x7d, 0x5e, 0xc5, 0xaa,
            0xc8, 0x7e, 0x32, 0x5b, 0xb1, 0xa9, 0x7d, 0x31, 0x2a, 0x15, 0xb6, 0x58, 0x8d, 0x4a, 0x06, 0xab, 0x55, 0x93, 0x49, 0x9c, 0x45, 0x7b, 0x7d,
            0x38, 0x39, 0xa4, 0x98, 0x74, 0xf1, 0xd7, 0x26, 0x88, 0xfc, 0x6b, 0x2f, 0xf6, 0xe9, 0xc5, 0xde, 0x6b, 0x8f, 0xfb, 0xd8, 0xf9, 0x7e,
        ]);
        parser._transform(buffer1, '', () => {});
        expect(parsed.length).toBe(2);
        expect(parsed[0].type).toBe(FrameType.DATA);
        expect(parsed[1].type).toBe(FrameType.DATA);
    });
});
