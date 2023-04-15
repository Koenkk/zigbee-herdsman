import "regenerator-runtime/runtime";
import {SerialPort} from '../../../src/adapter/serialPort';
import {SerialDriver} from '../../../src/adapter/ezsp/driver/uart';
import {Writer} from '../../../src/adapter/ezsp/driver/writer';

let mockParser;
const mockSerialPortClose = jest.fn().mockImplementation((cb) => cb ? cb() : null);
const mockSerialPortFlush = jest.fn().mockImplementation((cb) => cb());
const mockSerialPortPipe = jest.fn().mockImplementation((parser) => {
    mockParser = parser;
});
const mockSerialPortList = jest.fn().mockReturnValue([]);
const mockSerialPortOpen = jest.fn().mockImplementation((cb) => cb());
const mockSerialPortConstructor = jest.fn();
const mockSerialPortOnce = jest.fn();
const mockSerialPortSet = jest.fn().mockImplementation((opts, cb) => cb());
const mockSerialPortWrite = jest.fn((buffer, cb) => (cb) ? cb() : null);
let mockSerialPortIsOpen = false;


jest.mock('../../../src/adapter/serialPort', () => {
    return {
        SerialPort: jest.fn().mockImplementation(() => {
            return {
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
            };
        })
    };
});

let writeBufferSpy;

const mocks = [
    mockSerialPortClose, mockSerialPortPipe, mockSerialPortConstructor, mockSerialPortOpen,
    mockSerialPortOnce, mockSerialPortWrite, SerialPort,
];

describe('UART', () => {
    let serialDriver;
    beforeAll(async () => {
        jest.useFakeTimers();
    });

    afterAll(async () => {
        jest.useRealTimers();
        jest.restoreAllMocks();
    });

    beforeEach(() => {
        for (let mock of mocks) {
            // @ts-ignore
            mock.mockClear();
        }

        // @ts-ignore; make sure we always get a new instance
        serialDriver = new SerialDriver();
        writeBufferSpy = jest.spyOn(Writer.prototype, 'writeBuffer').mockImplementation((buffer) => {
            if (buffer[0] == 0x1a) {
                serialDriver.waitress.resolve({sequence: -1});
            }
        });
        jest.spyOn(Writer.prototype, 'pipe').mockImplementation(jest.fn());
    });

    afterEach(() => {
        writeBufferSpy.mockRestore();
    });

    it('Connect', async () => {
        await serialDriver.connect("/dev/ttyACM0", {});

        expect(SerialPort).toHaveBeenCalledTimes(1);
        expect(SerialPort).toHaveBeenCalledWith(
            {"path": "/dev/ttyACM0", "autoOpen": false, "baudRate": 115200, "rtscts": false},
        );

        expect(mockSerialPortPipe).toHaveBeenCalledTimes(1);
        expect(mockSerialPortOpen).toHaveBeenCalledTimes(1);
        expect(mockSerialPortOnce).toHaveBeenCalledTimes(2);
        expect(writeBufferSpy).toHaveBeenCalledTimes(1);
    });

    it('Send data', async () => {
        await serialDriver.connect("/dev/ttyACM0", {});
        // send 8 frames
        serialDriver.sendDATA(Buffer.from([1,2,3]));
        serialDriver.sendDATA(Buffer.from([1,2,3]));
        serialDriver.sendDATA(Buffer.from([1,2,3]));
        serialDriver.sendDATA(Buffer.from([1,2,3]));
        serialDriver.sendDATA(Buffer.from([1,2,3]));
        serialDriver.sendDATA(Buffer.from([1,2,3]));
        serialDriver.sendDATA(Buffer.from([1,2,3]));
        serialDriver.sendDATA(Buffer.from([1,2,3]));
        expect(writeBufferSpy).toHaveBeenCalledTimes(2);
        // send another 2 frame - not counted, until resolve 8 promices
        serialDriver.sendDATA(Buffer.from([1,2,3]));
        serialDriver.sendDATA(Buffer.from([1,2,3]));
        expect(writeBufferSpy).toHaveBeenCalledTimes(2);
    });
});
