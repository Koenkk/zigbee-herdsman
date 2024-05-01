import "regenerator-runtime/runtime";
import {Znp, ZpiObject} from '../../../src/adapter/z-stack/znp';
import {SerialPort} from '../../../src/adapter/serialPort';
import {Frame as UnpiFrame, Constants as UnpiConstants} from '../../../src/adapter/z-stack/unpi';
import {duplicateArray, ieeeaAddr1, ieeeaAddr2} from '../../testUtils';
import BuffaloZnp from '../../../src/adapter/z-stack/znp/buffaloZnp';
import ParameterType from "../../../src/adapter/z-stack/znp/parameterType";

const mockSerialPortClose = jest.fn().mockImplementation((cb) => cb ? cb() : null);
const mockSerialPortFlush = jest.fn().mockImplementation((cb) => cb());
const mockSerialPortAsyncFlushAndClose = jest.fn();
const mockSerialPortPipe = jest.fn();
const mockSerialPortList = jest.fn().mockReturnValue([]);
const mockSerialPortOpen = jest.fn().mockImplementation((cb) => cb());
const mockSerialPortAsyncOpen = jest.fn();
const mockSerialPortConstructor = jest.fn();
const mockSerialPortOnce = jest.fn();
const mockSerialPortSet = jest.fn().mockImplementation((opts, cb) => cb());
const mockSerialPortWrite = jest.fn((buffer, cb) => cb());
let mockSerialPortIsOpen = false;

jest.mock('../../../src/utils/wait', () => {
    return jest.fn();
});

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
                asyncOpen: mockSerialPortAsyncOpen,
                asyncFlushAndClose: mockSerialPortAsyncFlushAndClose,
            };
        }),
    };
});

const mockSocketSetNoDelay = jest.fn();
const mockSocketSetKeepAlive = jest.fn();
const mockSocketPipe = jest.fn();
const mockSocketOnce = jest.fn();
const mockSocketCallbacks = {};
const mockSocketConnect = jest.fn().mockImplementation(() => {
    mockSocketCallbacks['connect']();
    mockSocketCallbacks['ready']();
});
const mockSocketDestroy = jest.fn();
let requestSpy;

jest.mock('net', () => {
    return {
        Socket: jest.fn().mockImplementation(() => {
            return {
                setNoDelay: mockSocketSetNoDelay,
                pipe: mockSocketPipe,
                connect: mockSocketConnect,
                on: (event, cb) => mockSocketCallbacks[event] = cb,
                once: mockSocketOnce,
                destroy: mockSocketDestroy,
                setKeepAlive: mockSocketSetKeepAlive,
            };
        }),
    }
});

// Mock realPathSync
let mockRealPathSyncError = false;
jest.mock('../../../src/utils/realpathSync', () => {
    return jest.fn().mockImplementation((path) => {
        if (mockRealPathSyncError) {
            throw new Error('Not a valid path');
        }
        return path;
    });
});


SerialPort.list = mockSerialPortList;

const mockUnpiParserOn = jest.fn();

jest.mock('../../../src/adapter/z-stack/unpi/parser', () => {
    return jest.fn().mockImplementation(() => {
        return {
            on: mockUnpiParserOn,
        };
    });
});

const mockUnpiWriterWriteFrame = jest.fn();
const mockUnpiWriterWriteBuffer = jest.fn();

jest.mock('../../../src/adapter/z-stack/unpi/writer', () => {
    return jest.fn().mockImplementation(() => {
        return {
            writeFrame: mockUnpiWriterWriteFrame,
            writeBuffer: mockUnpiWriterWriteBuffer,
            pipe: jest.fn(),
        };
    });
});

const mocks = [
    mockSerialPortClose, mockSerialPortPipe, mockSerialPortConstructor, mockSerialPortOpen,
    mockSerialPortOnce, mockSerialPortWrite, SerialPort, mockUnpiParserOn, mockUnpiWriterWriteFrame,
    mockUnpiWriterWriteBuffer, mockSerialPortFlush, mockSerialPortAsyncFlushAndClose, mockSerialPortAsyncOpen
];

describe('ZNP', () => {
    let znp;

    beforeAll(async () => {
        jest.useFakeTimers();
    });

    afterAll(async () => {
        jest.useRealTimers();
    });

    beforeEach(() => {
        for (let mock of mocks) {
            // @ts-ignore
            mock.mockClear();
        }

        // @ts-ignore; make sure we always get a new instance
        znp = new Znp("/dev/ttyACM0", 100, true);
        requestSpy = jest.spyOn(znp, 'request').mockImplementation(() => {});
    });

    afterEach(() => {
        requestSpy.mockRestore();
    });

    it('Open', async () => {
        await znp.open();

        expect(SerialPort).toHaveBeenCalledTimes(1);
        expect(SerialPort).toHaveBeenCalledWith(
            {"path": "/dev/ttyACM0", "autoOpen": false, "baudRate": 100, "rtscts": true},
        );

        expect(mockSerialPortPipe).toHaveBeenCalledTimes(1);
        expect(mockSerialPortAsyncOpen).toHaveBeenCalledTimes(1);
        expect(mockSerialPortOnce).toHaveBeenCalledTimes(2);
        expect(mockUnpiWriterWriteBuffer).toHaveBeenCalledTimes(0);
    });

    it('Open - first ping fails should send reset bootloader', async () => {
        requestSpy.mockImplementation(() => {throw new Error('failed')});
        await znp.open();

        expect(SerialPort).toHaveBeenCalledTimes(1);
        expect(SerialPort).toHaveBeenCalledWith(
            {"path": "/dev/ttyACM0", "autoOpen": false, "baudRate": 100, "rtscts": true},
        );

        expect(mockSerialPortPipe).toHaveBeenCalledTimes(1);
        expect(mockSerialPortAsyncOpen).toHaveBeenCalledTimes(1);
        expect(mockUnpiWriterWriteBuffer).toHaveBeenCalledTimes(1);
        expect(mockSerialPortOnce).toHaveBeenCalledTimes(2);
    });

    it('Open with defaults', async () => {
        znp = new Znp("/dev/ttyACM0", undefined, undefined);
        requestSpy = jest.spyOn(znp, 'request').mockImplementation(() => {});
        await znp.open();

        expect(SerialPort).toHaveBeenCalledTimes(1);
        expect(SerialPort).toHaveBeenCalledWith(
            {"path": "/dev/ttyACM0", "autoOpen": false, "baudRate": 115200, "rtscts": false},
        );

        expect(mockSerialPortPipe).toHaveBeenCalledTimes(1);
        expect(mockSerialPortAsyncOpen).toHaveBeenCalledTimes(1);
        expect(mockSerialPortOnce).toHaveBeenCalledTimes(2);
    });

    it('Open autodetect port', async () => {
        mockSerialPortList.mockReturnValue([
            {manufacturer: 'Not texas instruments', vendorId: '0451', productId: '16a8', path: '/dev/autodetected2'},
            {path: '/dev/tty.usbmodemL43001T22', manufacturer: 'Texas Instruments', vendorId: '0451', productId: 'bef3'},
            {path: '/dev/tty.usbmodemL43001T24', manufacturer: 'Texas Instruments', vendorId: '0451', productId: 'bef3'},
            {path: '/dev/tty.usbmodemL43001T21', manufacturer: 'Texas Instruments', vendorId: '0451', productId: 'bef3'},
        ]);

        expect(await Znp.autoDetectPath()).toBe("/dev/tty.usbmodemL43001T21");
    });

    it('Autodetect port error when there are not available devices', async () => {
        mockSerialPortList.mockReturnValue([
            {manufacturer: 'Not texas instruments', vendorId: '0451', productId: '16a8', path: '/dev/autodetected2'},
        ])

        expect(await Znp.autoDetectPath()).toBeNull();
    });

    it('Open and close tcp port', async () => {
        znp = new Znp("tcp://localhost:8080", 100, false);
        await znp.open();
        expect(mockSocketConnect).toBeCalledTimes(1);
        expect(mockSocketConnect).toBeCalledWith(8080, 'localhost');
        expect(znp.isInitialized()).toBeTruthy();
        expect(mockUnpiWriterWriteBuffer).toHaveBeenCalledTimes(1);

        await znp.close();
        expect(mockSocketDestroy).toHaveBeenCalledTimes(1);
    });

    it('Open tcp port with socket error', async () => {
        mockSocketConnect.mockImplementationOnce(() => {
            mockSocketCallbacks['error']();
        })

        znp = new Znp("tcp://localhost:666", 100, false);

        let error = false;
        try {
            await znp.open();
        } catch (e) {
            error = e;
        }

        expect(error).toStrictEqual(new Error('Error while opening socket'));
        expect(znp.isInitialized()).toBeFalsy();
    });


    it('Check if tcp path is valid', async () => {
        expect(await Znp.isValidPath('tcp://192.168.2.1:8080')).toBeFalsy();
        expect(await Znp.isValidPath('tcp://localhost:8080')).toBeFalsy();
        expect(await Znp.isValidPath('tcp://192.168.2.1')).toBeFalsy();
        expect(await Znp.isValidPath('tcp://localhost')).toBeFalsy();
        expect(await Znp.isValidPath('tcp')).toBeFalsy();
    });

    it('Check if path is valid', async () => {
        mockSerialPortList.mockReturnValue([
            {manufacturer: 'Not texas instruments', vendorId: '0451', productId: '16a8', path: '/dev/autodetected2'},
            {path: '/dev/tty.usbmodemL43001T22', manufacturer: 'Texas Instruments', vendorId: '0451', productId: 'bef3'},
            {path: '/dev/tty.usbmodemL43001T24', manufacturer: 'Texas Instruments', vendorId: '0451', productId: 'bef3'},
            {path: '/dev/tty.usbmodemL43001T21', manufacturer: 'Texas Instruments', vendorId: '0451', productId: 'bef3'},
        ])

        expect(await Znp.isValidPath('/dev/tty.usbmodemL43001T21')).toBeTruthy();
        expect(await Znp.isValidPath('/dev/autodetected2')).toBeFalsy();
    });

    it('Check if path is valid; return false when path does not exist in device list', async () => {
        mockSerialPortList.mockReturnValue([
            {manufacturer: 'Not texas instruments', vendorId: '0451', productId: '16a8', path: '/dev/autodetected2'},
            {path: '/dev/tty.usbmodemL43001T22', manufacturer: 'Texas Instruments', vendorId: '0451', productId: 'bef3'},
            {path: '/dev/tty.usbmodemL43001T24', manufacturer: 'Texas Instruments', vendorId: '0451', productId: 'bef3'},
            {path: '/dev/tty.usbmodemL43001T21', manufacturer: 'Texas Instruments', vendorId: '0451', productId: 'bef3'},
        ])

        expect(await Znp.isValidPath('/dev/notexisting')).toBeFalsy();
    });

    it('Check if path is valid path resolve fails', async () => {
        mockRealPathSyncError = true;
        expect(await Znp.isValidPath('/dev/tty.usbmodemL43001T21')).toBeFalsy();
        mockRealPathSyncError = false;
    });

    it('Open with error', async () => {
        mockSerialPortAsyncOpen.mockImplementationOnce(() => {
            return new Promise((resolve, reject) => {
                reject('failed!');
            });
        });
        mockSerialPortIsOpen = true;

        let error = false;

        try {
            await znp.open();
        } catch (e) {
            error = e;
        }

        expect(SerialPort).toHaveBeenCalledTimes(1);
        expect(SerialPort).toHaveBeenCalledWith(
            {"path": "/dev/ttyACM0", "autoOpen": false, "baudRate": 100, "rtscts": true},
        );

        expect(error).toEqual('failed!');
        expect(mockSerialPortPipe).toHaveBeenCalledTimes(1);
        expect(mockSerialPortAsyncOpen).toHaveBeenCalledTimes(1);
        expect(mockSerialPortClose).toHaveBeenCalledTimes(1);
        expect(mockUnpiWriterWriteBuffer).toHaveBeenCalledTimes(0);
        expect(mockSerialPortOnce).toHaveBeenCalledTimes(0);
    });

    it('Open with error when serialport is not open', async () => {
        mockSerialPortAsyncOpen.mockImplementationOnce(() => {
            return new Promise((resolve, reject) => {
                reject('failed!');
            });
        });
        mockSerialPortIsOpen = false;

        let error = false;

        try {
            await znp.open();
        } catch (e) {
            error = e;
        }

        expect(SerialPort).toHaveBeenCalledTimes(1);
        expect(SerialPort).toHaveBeenCalledWith(
            {"path": "/dev/ttyACM0", "autoOpen": false, "baudRate": 100, "rtscts": true},
        );

        expect(error).toEqual('failed!');
        expect(mockSerialPortPipe).toHaveBeenCalledTimes(1);
        expect(mockSerialPortAsyncOpen).toHaveBeenCalledTimes(1);
        expect(mockSerialPortClose).toHaveBeenCalledTimes(0);
        expect(mockUnpiWriterWriteBuffer).toHaveBeenCalledTimes(0);
        expect(mockSerialPortOnce).toHaveBeenCalledTimes(0);
    });

    it('Open and close', async () => {
        const close = jest.fn();
        znp.on('close', close);
        expect(znp.isInitialized()).toBeFalsy();
        await znp.open();
        expect(znp.isInitialized()).toBeTruthy();
        await znp.close();
        expect(znp.isInitialized()).toBeFalsy();

        expect(mockSerialPortAsyncFlushAndClose).toHaveBeenCalledTimes(1);
        expect(close).toHaveBeenCalledTimes(1);
    });

    it('Open and close error', async () => {
        const close = jest.fn();
        znp.on('close', close);
        mockSerialPortAsyncFlushAndClose.mockImplementationOnce(() => {
            return new Promise((resolve, reject) => {
                reject('failed!');
            });
        });
        await znp.open();

        let error;
        try {
            await znp.close();
        } catch (e) {
            error = e;
        }

        expect(mockSerialPortAsyncFlushAndClose).toHaveBeenCalledTimes(1);
        expect(error).toEqual('failed!');
        expect(close).toHaveBeenCalledTimes(1);
    });

    it('Close without initialization', async () => {
        const close = jest.fn();
        znp.on('close', close);
        mockSerialPortAsyncFlushAndClose.mockImplementationOnce(() => {
            return new Promise((resolve, reject) => {
                reject('failed!');
            });
        });
        await znp.close();

        expect(mockSerialPortAsyncFlushAndClose).toHaveBeenCalledTimes(0);
        expect(close).toHaveBeenCalledTimes(1);
    });

    it('Open and close by serialport event', async () => {
        let closeCb;

        mockSerialPortOnce.mockImplementation(((event, cb) => {
            if (event === 'close') {
                closeCb = cb;
            }
        }));

        const close = jest.fn();
        znp.on('close', close);
        await znp.open();
        closeCb();

        expect(close).toHaveBeenCalledTimes(1);
    });

    it('Serialport error (do nothing)', async () => {
        let errorCb;

        mockSerialPortOnce.mockImplementation(((event, cb) => {
            if (event === 'error') {
                errorCb = cb;
            }
        }));

        await znp.open();
        errorCb();
    });

    it('znp receive', async () => {
        let parsedCb;
        const received = jest.fn();

        znp.on('received', received);

        mockUnpiParserOn.mockImplementationOnce((event, cb) => {
            if (event === 'parsed') {
                parsedCb = cb;
            }
        });

        znp.open();
        parsedCb(new UnpiFrame(
            UnpiConstants.Type.SRSP,
            UnpiConstants.Subsystem.SYS,
            0x02,
            Buffer.from([0x01, 0x02, 0x03, 0x04, 0x05, 0x01, 0x01, 0x01, 0x01])
        ));

        expect(received).toHaveBeenCalledTimes(1);

        const obj = received.mock.calls[0][0];
        expect(obj.command).toBe('version');
        expect(obj.commandID).toBe(2);
        expect(obj.payload).toStrictEqual({"maintrel": 5, "majorrel": 3, "minorrel": 4, "product": 2, "revision": 16843009, "transportrev": 1});
        expect(obj.subsystem).toBe(UnpiConstants.Subsystem.SYS);
        expect(obj.type).toBe(UnpiConstants.Type.SRSP);
    });

    it('znp receive malformed', async () => {
        let parsedCb;
        const received = jest.fn();

        znp.on('received', received);

        mockUnpiParserOn.mockImplementationOnce((event, cb) => {
            if (event === 'parsed') {
                parsedCb = cb;
            }
        });

        znp.open();
        parsedCb(new UnpiFrame(
            UnpiConstants.Type.SRSP,
            UnpiConstants.Subsystem.SYS,
            0x02,
            Buffer.from([0x01, 0x02, 0x03, 0x04])
        ));

        expect(received).toHaveBeenCalledTimes(0);
    });

    it('znp request SREQ', async () => {
        let parsedCb;
        mockUnpiParserOn.mockImplementationOnce((event, cb) => {
            if (event === 'parsed') {
                parsedCb = cb;
            }
        });

        mockUnpiWriterWriteFrame.mockImplementationOnce(() => {
            parsedCb(new UnpiFrame(
                UnpiConstants.Type.SRSP,
                UnpiConstants.Subsystem.SYS,
                0x08,
                Buffer.from([0x00, 0x02, 0x01, 0x02])
            ));
        });

        await znp.open();
        requestSpy.mockRestore();

        const result = await znp.request(UnpiConstants.Subsystem.SYS, 'osalNvRead', {id: 1, offset: 2});

        const frame = mockUnpiWriterWriteFrame.mock.calls[0][0];
        expect(mockUnpiWriterWriteFrame).toHaveBeenCalledTimes(1);
        expect(frame.commandID).toBe(8);
        expect(frame.subsystem).toBe(UnpiConstants.Subsystem.SYS);
        expect(frame.type).toBe(UnpiConstants.Type.SREQ);
        expect(frame.data).toStrictEqual(Buffer.from([0x01, 0x00, 0x02]));

        expect(result.command).toBe('osalNvRead');
        expect(result.commandID).toBe(0x08);
        expect(result.payload).toStrictEqual({status: 0, len: 2, value: Buffer.from([0x01, 0x02])});
        expect(result.subsystem).toBe(UnpiConstants.Subsystem.SYS);
        expect(result.type).toBe(UnpiConstants.Type.SRSP);
    });

    it('znp request SREQ failed', async () => {
        let parsedCb;
        mockUnpiParserOn.mockImplementationOnce((event, cb) => {
            if (event === 'parsed') {
                parsedCb = cb;
            }
        });

        mockUnpiWriterWriteFrame.mockImplementationOnce(() => {
            parsedCb(new UnpiFrame(
                UnpiConstants.Type.SRSP,
                UnpiConstants.Subsystem.SYS,
                0x08,
                Buffer.from([0x01, 0x02, 0x01, 0x02])
            ));
        });

        await znp.open();
        requestSpy.mockRestore();

        expect(znp.waitress.waiters.size).toBe(0);

        let error;
        try {
            await znp.request(UnpiConstants.Subsystem.SYS, 'osalNvRead', {id: 1, offset: 2});
        } catch (e) {
            expect(znp.waitress.waiters.size).toBe(0);
            error = e;
        }

        expect(error).toStrictEqual(new Error("SREQ '--> SYS - osalNvRead - {\"id\":1,\"offset\":2}' failed with status '(0x01: FAILURE)' (expected '(0x00: SUCCESS)')"));
    });

    it('znp request SREQ failed should cancel waiter when provided', async () => {
        let parsedCb;
        mockUnpiParserOn.mockImplementationOnce((event, cb) => {
            if (event === 'parsed') {
                parsedCb = cb;
            }
        });

        mockUnpiWriterWriteFrame.mockImplementationOnce(() => {
            parsedCb(new UnpiFrame(
                UnpiConstants.Type.SRSP,
                UnpiConstants.Subsystem.SYS,
                0x08,
                Buffer.from([0x01, 0x02, 0x01, 0x02])
            ));
        });

        await znp.open();
        requestSpy.mockRestore();

        expect(znp.waitress.waiters.size).toBe(0);
        const waiter = znp.waitFor(UnpiConstants.Type.SRSP, UnpiConstants.Subsystem.SYS, 'osalNvRead');
        expect(znp.waitress.waiters.size).toBe(1);

        let error;
        try {
            await znp.request(UnpiConstants.Subsystem.SYS, 'osalNvRead', {id: 1, offset: 2}, waiter.ID);
        } catch (e) {
            expect(znp.waitress.waiters.size).toBe(0);
            error = e;
        }

        expect(error).toStrictEqual(new Error("SREQ '--> SYS - osalNvRead - {\"id\":1,\"offset\":2}' failed with status '(0x01: FAILURE)' (expected '(0x00: SUCCESS)')"));
    });


    it('znp request SREQ with parsed in between', async () => {
        let parsedCb;
        mockUnpiParserOn.mockImplementationOnce((event, cb) => {
            if (event === 'parsed') {
                parsedCb = cb;
            }
        });

        mockUnpiWriterWriteFrame.mockImplementationOnce(() => {
            parsedCb(new UnpiFrame(
                UnpiConstants.Type.SRSP,
                UnpiConstants.Subsystem.AF,
                0x00,
                Buffer.from([0x00])
            ));

            parsedCb(new UnpiFrame(
                UnpiConstants.Type.SRSP,
                UnpiConstants.Subsystem.SYS,
                0x08,
                Buffer.from([0x00, 0x02, 0x01, 0x02])
            ));
        });

        await znp.open();
        requestSpy.mockRestore();

        const result = await znp.request(UnpiConstants.Subsystem.SYS, 'osalNvRead', {id: 1, offset: 2});

        const frame = mockUnpiWriterWriteFrame.mock.calls[0][0];
        expect(mockUnpiWriterWriteFrame).toHaveBeenCalledTimes(1);
        expect(frame.commandID).toBe(8);
        expect(frame.subsystem).toBe(UnpiConstants.Subsystem.SYS);
        expect(frame.type).toBe(UnpiConstants.Type.SREQ);
        expect(frame.data).toStrictEqual(Buffer.from([0x01, 0x00, 0x02]));

        expect(result.command).toBe('osalNvRead');
        expect(result.commandID).toBe(0x08);
        expect(result.payload).toStrictEqual({status: 0, len: 2, value: Buffer.from([0x01, 0x02])});
        expect(result.subsystem).toBe(UnpiConstants.Subsystem.SYS);
        expect(result.type).toBe(UnpiConstants.Type.SRSP);
    });

    it('znp request AREQ reset', async () => {
        let parsedCb;
        mockUnpiParserOn.mockImplementationOnce((event, cb) => {
            if (event === 'parsed') {
                parsedCb = cb;
            }
        });

        mockUnpiWriterWriteFrame.mockImplementationOnce(() => {
            parsedCb(new UnpiFrame(
                UnpiConstants.Type.AREQ,
                UnpiConstants.Subsystem.SYS,
                0x80,
                Buffer.from([0x01, 0x02, 0x03, 0x04, 0x05, 0x06])
            ));
        });

        await znp.open();
        requestSpy.mockRestore();

        const result = await znp.request(UnpiConstants.Subsystem.SYS, 'resetReq', {type: 1});

        const frame = mockUnpiWriterWriteFrame.mock.calls[0][0];
        expect(mockUnpiWriterWriteFrame).toHaveBeenCalledTimes(1);
        expect(frame.commandID).toBe(0);
        expect(frame.subsystem).toBe(UnpiConstants.Subsystem.SYS);
        expect(frame.type).toBe(UnpiConstants.Type.AREQ);
        expect(frame.data).toStrictEqual(Buffer.from([1]));

        expect(result.command).toBe('resetInd');
        expect(result.commandID).toBe(0x80);
        expect(result.payload).toStrictEqual({reason: 1, transportrev: 2, productid: 3, majorrel: 4, minorrel: 5, hwrev: 6});
        expect(result.subsystem).toBe(UnpiConstants.Subsystem.SYS);
        expect(result.type).toBe(UnpiConstants.Type.AREQ);
    });

    it('znp request AREQ', async () => {
        await znp.open();
        requestSpy.mockRestore();

        const result = await znp.request(UnpiConstants.Subsystem.SAPI, 'startConfirm', {status: 1});

        const frame = mockUnpiWriterWriteFrame.mock.calls[0][0];
        expect(mockUnpiWriterWriteFrame).toHaveBeenCalledTimes(1);
        expect(frame.commandID).toBe(128);
        expect(frame.subsystem).toBe(UnpiConstants.Subsystem.SAPI);
        expect(frame.type).toBe(UnpiConstants.Type.AREQ);
        expect(frame.data).toStrictEqual(Buffer.from([1]));

        expect(result).toBe(undefined);
    });

    it('znp request without init', async () => {
        let error;
        requestSpy.mockRestore();

        try {
            await znp.request(UnpiConstants.Subsystem.SAPI, 'startConfirm', {status: 1});
        } catch (e) {
            error = e;
        }

        expect(error).toEqual(new Error("Cannot request when znp has not been initialized yet"));
    });


    it('znp request with non-existing subsystem', async () => {
        await znp.open();
        requestSpy.mockRestore();
        let error;

        try {
            await znp.request(999, 'startConfirm', {status: 1});
        } catch (e) {
            error = e;
        }

        expect(error).toEqual(new Error("Subsystem '999' does not exist"));
    });

    it('znp request with non-existing cmd', async () => {
        await znp.open();
        requestSpy.mockRestore();
        let error;

        try {
            await znp.request(UnpiConstants.Subsystem.SAPI, 'nonExisting', {status: 1});
        } catch (e) {
            error = e;
        }

        expect(error).toEqual(new Error("Command 'nonExisting' from subsystem '6' not found"));
    });

    it('znp request timeout', async () => {
        await znp.open();
        requestSpy.mockRestore();

        let result = znp.request(UnpiConstants.Subsystem.SYS, 'osalNvRead', {id: 1, offset: 2});
        jest.runAllTimers();

        let error;
        try {
            await result;
        } catch (e) {
            error = e;
        }

        expect(error).toStrictEqual(new Error("SRSP - SYS - osalNvRead after 6000ms"));
    });

    it('znp request timeout for startupFromApp is longer', async () => {
        await znp.open();
        requestSpy.mockRestore();

        let result = znp.request(UnpiConstants.Subsystem.ZDO, 'startupFromApp', {startdelay: 100});
        jest.advanceTimersByTime(30000);

        let error;
        try {
            jest.advanceTimersByTime(15000);
            await result;
        } catch (e) {
            error = e;
        }

        expect(error).toStrictEqual(new Error("SRSP - ZDO - startupFromApp after 40000ms"));
    });

    it('znp request, responses comes after timeout', async () => {
        let parsedCb;
        mockUnpiParserOn.mockImplementationOnce((event, cb) => {
            if (event === 'parsed') {
                parsedCb = cb;
            }
        });

        await znp.open();
        requestSpy.mockRestore();

        let result = znp.request(UnpiConstants.Subsystem.SYS, 'osalNvRead', {id: 1, offset: 2});
        jest.runAllTimers();

        parsedCb(new UnpiFrame(
            UnpiConstants.Type.SRSP,
            UnpiConstants.Subsystem.SYS,
            0x08,
            Buffer.from([0x00, 0x02, 0x01, 0x02])
        ));

        let error;
        try {
            result = await result;
        } catch (e) {
            error = e;
        }

        expect(error).toStrictEqual(new Error("SRSP - SYS - osalNvRead after 6000ms"));
    });

    it('znp request, waitfor', async () => {
        let parsedCb;
        mockUnpiParserOn.mockImplementationOnce((event, cb) => {
            if (event === 'parsed') {
                parsedCb = cb;
            }
        });

        await znp.open();
        requestSpy.mockRestore();

        const waiter = znp.waitFor(UnpiConstants.Type.SRSP, UnpiConstants.Subsystem.SYS, 'osalNvRead');
        znp.request(UnpiConstants.Subsystem.SYS, 'osalNvRead', {id: 1, offset: 2});

        parsedCb(new UnpiFrame(
            UnpiConstants.Type.SRSP,
            UnpiConstants.Subsystem.SYS,
            0x08,
            Buffer.from([0x00, 0x02, 0x01, 0x02])
        ));

        const object = await waiter.start().promise;
        expect(object.payload).toStrictEqual({len: 2, status: 0, value: Buffer.from([1, 2])});
    });

    it('znp request, waitfor with payload', async () => {
        let parsedCb;
        mockUnpiParserOn.mockImplementationOnce((event, cb) => {
            if (event === 'parsed') {
                parsedCb = cb;
            }
        });

        await znp.open();
        requestSpy.mockRestore();

        const waiter = znp.waitFor(UnpiConstants.Type.SRSP, UnpiConstants.Subsystem.SYS, 'osalNvRead', {status: 0, value: Buffer.from([1, 2])});
        znp.request(UnpiConstants.Subsystem.SYS, 'osalNvRead', {id: 1, offset: 2});

        parsedCb(new UnpiFrame(
            UnpiConstants.Type.SRSP,
            UnpiConstants.Subsystem.SYS,
            0x08,
            Buffer.from([0x00, 0x02, 0x01, 0x02])
        ));

        const object = await waiter.start().promise;
        expect(object.payload).toStrictEqual({len: 2, status: 0, value: Buffer.from([1, 2])});
    });

    it('znp request, waitfor with payload mismatch', (done) => {
        let parsedCb;
        mockUnpiParserOn.mockImplementationOnce((event, cb) => {
            if (event === 'parsed') {
                parsedCb = cb;
            }
        });

        znp.open().then(() => {
            requestSpy.mockRestore();
            const waiter = znp.waitFor(UnpiConstants.Type.SRSP, UnpiConstants.Subsystem.SYS, 'osalNvRead', {status: 3, value: Buffer.from([1, 3])});
            znp.request(UnpiConstants.Subsystem.SYS, 'osalNvRead', {id: 1, offset: 2});

            parsedCb(new UnpiFrame(
                UnpiConstants.Type.SRSP,
                UnpiConstants.Subsystem.SYS,
                0x08,
                Buffer.from([0x00, 0x02, 0x01, 0x02])
            ));


            waiter.start().promise
                .then(() => done("Shouldn't end up here"))
                .catch((e) => {
                    expect(e).toStrictEqual(new Error("SRSP - SYS - osalNvRead after 10000ms"));
                    done();
                });

            jest.runOnlyPendingTimers();
        });
    });

    it('ZpiObject throw error on missing write parser', async () => {
        // @ts-ignore; make sure we always get a new instance
        const obj = new ZpiObject(0, 0, 'dummy', 0, {}, [{name: 'nonExisting', parameterType: 9999999}]);
        expect(() => {
            obj.createPayloadBuffer();
        }).toThrow();
    });

    it('ZpiObject throw error on unknown command', async () => {
        // @ts-ignore; make sure we always get a new instance
        const frame = new UnpiFrame(UnpiConstants.Type.SREQ, UnpiConstants.Subsystem.AF, 99999, Buffer.alloc(0));
        expect(() => {
            ZpiObject.fromUnpiFrame(frame);
        }).toThrow();
    });

    it('ZpiObject throw error on unknown parameters', async () => {
        // @ts-ignore; make sure we always get a new instance
        const frame = new UnpiFrame(UnpiConstants.Type.SRSP, UnpiConstants.Subsystem.AF, 128, Buffer.alloc(0));
        expect(() => {
            ZpiObject.fromUnpiFrame(frame);
        }).toThrow();
    });

    it('ZpiObject with cmd and non sapi is not reset command', async () => {
        // @ts-ignore; make sure we always get a new instance
        const obj = new ZpiObject(UnpiConstants.Type.SREQ, UnpiConstants.Subsystem.AF, 'systemReset', 0, {}, []);
        expect(obj.isResetCommand()).toBeFalsy();
    });

    it('ZpiObject with assoc dev list', async () => {
        const buffer = Buffer.from([
            0x00,
            0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08,
            0x01, 0x01,
            0x00,
            0x02,
            0x10, 0x10,
            0x11, 0x11,
        ]);

        const frame = new UnpiFrame(UnpiConstants.Type.AREQ, UnpiConstants.Subsystem.ZDO, 128, buffer);
        const obj = ZpiObject.fromUnpiFrame(frame);
        expect(obj.payload).toStrictEqual({
            assocdevlist: [4112, 4369],
            ieeeaddr: "0x0807060504030201",
            numassocdev: 2,
            nwkaddr: 257,
            startindex: 0,
            status: 0,

        });
    });

    it('Cant read unsupported type', () => {
        expect(() => {
            const buffalo = new BuffaloZnp(Buffer.alloc(0));
            // @ts-expect-error invalid typing
            buffalo.read(9999, {});
        }).toThrow(new Error("Read for '9999' not available"));
    })

    it('UINT8 write', () => {
        const buffalo = new BuffaloZnp(Buffer.alloc(3), 1);
        buffalo.write(ParameterType.UINT8, 240, {});
        expect(buffalo.getPosition()).toEqual(2);
        expect(buffalo.getBuffer()).toStrictEqual(Buffer.from([0x00, 0xF0, 0x00]))
    });

    it('UINT8 read', () => {
        const buffalo = new BuffaloZnp(Buffer.from([0x00, 0x03, 0x00, 0x00]), 1);
        const value = buffalo.read(ParameterType.UINT8, {});
        expect(buffalo.getPosition()).toEqual(2);
        expect(value).toStrictEqual(3);
    });

    it('INT8 write', () => {
        const buffalo = new BuffaloZnp(Buffer.alloc(3), 1);
        buffalo.write(ParameterType.INT8, 127, {});
        expect(buffalo.getPosition()).toEqual(2);
        expect(buffalo.getBuffer()).toStrictEqual(Buffer.from([0x00, 0x7F, 0x00]))
    });

    it('INT8 read', () => {
        const buffalo = new BuffaloZnp(Buffer.from([0x00, 0xF0, 0x00, 0x00]), 1);
        const value = buffalo.read(ParameterType.INT8, {});
        expect(buffalo.getPosition()).toEqual(2);
        expect(value).toStrictEqual(-16);
    });

    it('UINT16 write', () => {
        const buffalo = new BuffaloZnp(Buffer.alloc(3), 1);
        buffalo.write(ParameterType.UINT16, 1020, {});
        expect(buffalo.getPosition()).toEqual(3);
        expect(buffalo.getBuffer()).toStrictEqual(Buffer.from([0x00, 0xFC, 0x03]))
    });

    it('UINT16 read', () => {
        const buffalo = new BuffaloZnp(Buffer.from([0x00, 0x03, 0xFF, 0x00]), 1);
        const value = buffalo.read(ParameterType.UINT16, {});
        expect(buffalo.getPosition()).toEqual(3);
        expect(value).toStrictEqual(65283);
    });

    it('UINT32 write', () => {
        const buffalo = new BuffaloZnp(Buffer.alloc(6), 2);
        buffalo.write(ParameterType.UINT32, 1065283, {});
        expect(buffalo.getPosition()).toEqual(6);
        expect(buffalo.getBuffer()).toStrictEqual(Buffer.from([0x00, 0x00, 0x43, 0x41, 0x10, 0x00]))
    });

    it('UINT32 read', () => {
        const buffalo = new BuffaloZnp(Buffer.from([0x01, 0x03, 0xFF, 0xFF]));
        const value = buffalo.read(ParameterType.UINT32, {});
        expect(buffalo.getPosition()).toEqual(4);
        expect(value).toStrictEqual(4294902529);
    });

    it('LIST_UINT8 write', () => {
        const buffalo = new BuffaloZnp(Buffer.alloc(4), 1);
        const payload = [200, 100];
        buffalo.write(ParameterType.LIST_UINT8, payload, {});
        expect(buffalo.getPosition()).toStrictEqual(3);
        expect(buffalo.getBuffer()).toStrictEqual(Buffer.from([0x00, 0xC8, 0x64, 0x00]));
    });

    it('LIST_UINT8 read', () => {
        const buffalo = new BuffaloZnp(Buffer.from([0x00, 0x00, 0x04, 0x08]), 2);
        const value = buffalo.read(ParameterType.LIST_UINT8, {length: 2});
        expect(buffalo.getPosition()).toStrictEqual(4);
        expect(value).toStrictEqual([4, 8]);
    });

    it('LIST_UINT16 write', () => {
        const buffalo = new BuffaloZnp(Buffer.alloc(5), 1);
        const payload = [1024, 2048];
        buffalo.write(ParameterType.LIST_UINT16, payload, {});
        expect(buffalo.getPosition()).toStrictEqual(5);
        expect(buffalo.getBuffer()).toStrictEqual(Buffer.from([0x00, 0x00, 0x04, 0x00, 0x08]));
    });

    it('LIST_UINT16 read', () => {
        const buffalo = new BuffaloZnp(Buffer.from([0x00, 0x00, 0x04, 0x00, 0x08]), 1);
        const value = buffalo.read(ParameterType.LIST_UINT16, {length: 2});
        expect(buffalo.getPosition()).toStrictEqual(5);
        expect(value).toStrictEqual([1024, 2048]);
    });

    it('LIST_ROUTING_TABLE write', () => {
        expect(() => {
            const buffalo = new BuffaloZnp(Buffer.alloc(10));
            buffalo.write(ParameterType.LIST_ROUTING_TABLE, [], {});
        }).toThrow();
    });

    it('LIST_ROUTING_TABLE read', () => {
        const buffer = Buffer.from([
            0x00,
            0x10, 0x27, 0x00, 0x11, 0x27,
            0x10, 0x29, 0x01, 0x11, 0x23,
        ]);

        const buffalo = new BuffaloZnp(buffer, 1);
        const value = buffalo.read(ParameterType.LIST_ROUTING_TABLE, {length: 2});
        expect(buffalo.getPosition()).toStrictEqual(11);
        expect(value).toStrictEqual([
            {
                "destNwkAddr": 10000,
                "nextHopNwkAddr": 10001,
                "routeStatus": "ACTIVE",
            },
            {
                "destNwkAddr": 10512,
                "nextHopNwkAddr": 8977,
                "routeStatus": "DISCOVERY_UNDERWAY",
            },
        ]);
    });

    it('LIST_BIND_TABLE write', () => {
        expect(() => {
            const buffalo = new BuffaloZnp(Buffer.alloc(10));
            buffalo.write(ParameterType.LIST_BIND_TABLE, [], {})
        }).toThrow();
    });

    it('LIST_BIND_TABLE read', () => {
        const buffer = Buffer.from([
            0x00,
            ...ieeeaAddr1.hex, 0x02, 0x01, 0x00, 0x02, ...ieeeaAddr2.hex,
            ...ieeeaAddr2.hex, 0x02, 0x01, 0x00, 0x03, ...ieeeaAddr1.hex, 0x04,
            0x01,
        ]);

        const buffalo = new BuffaloZnp(buffer, 1);
        const value = buffalo.read(ParameterType.LIST_BIND_TABLE, {length: 2});
        expect(buffalo.getPosition()).toStrictEqual(42);
        expect(value).toStrictEqual([
           {
                "clusterId": 1,
                "dstAddr": ieeeaAddr2.string,
                "dstAddrMode": 2,
                "srcAddr": ieeeaAddr1.string,
                "srcEp": 2,
            },
               {
                "clusterId": 1,
                "dstAddr": ieeeaAddr1.string,
                "dstAddrMode": 3,
                "dstEp": 4,
                "srcAddr": ieeeaAddr2.string,
                "srcEp": 2,
            },
        ]);
    });

    it('LIST_NEIGHBOR_LQI write', () => {
        expect(() => {
            const buffalo = new BuffaloZnp(Buffer.alloc(10));
            buffalo.write(ParameterType.LIST_NEIGHBOR_LQI, [], {})
        }).toThrow();
    });

    it('LIST_NEIGHBOR_LQI read', () => {
        const buffer = Buffer.from([
            0x00,
            ...ieeeaAddr1.hex, ...ieeeaAddr2.hex, 0x10, 0x10, 0x44, 0x01, 0x02, 0x09,
            ...ieeeaAddr2.hex, ...ieeeaAddr1.hex, 0x10, 0x10, 0x44, 0x00, 0x10, 0x08,
            0x01,
        ]);

        const buffalo = new BuffaloZnp(buffer, 1);
        const value = buffalo.read(ParameterType.LIST_NEIGHBOR_LQI, {length: 2});
        expect(buffalo.getPosition()).toStrictEqual(45);
        expect(value).toStrictEqual([
            {
                "depth": 2,
                "deviceType": 0,
                "extAddr": "0xaf440112005b1200",
                "extPandId": "0xae440112004b1200",
                "lqi": 9,
                "nwkAddr": 4112,
                "permitJoin": 1,
                "relationship": 4,
                "rxOnWhenIdle": 1,
            },
            {
                "depth": 16,
                "deviceType": 0,
                "extAddr": "0xae440112004b1200",
                "extPandId": "0xaf440112005b1200",
                "lqi": 8,
                "nwkAddr": 4112,
                "permitJoin": 0,
                "relationship": 4,
                "rxOnWhenIdle": 1,
            },
        ]);
    });

    it('LIST_NETWORK write', () => {
        expect(() => {
            const buffalo = new BuffaloZnp(Buffer.alloc(10));
            buffalo.write(ParameterType.LIST_NETWORK, [], {})
        }).toThrow();
    });

    it('LIST_NETWORK read', () => {
        const buffer = Buffer.from([
            0x05,
            0x10, 0x10, 0x09, 0x31, 0x13, 0x01,
            0x10, 0x10, 0x09, 0x31, 0x13, 0x00,
            0x01,
        ]);

        const buffalo = new BuffaloZnp(buffer, 1);
        const value = buffalo.read(ParameterType.LIST_NETWORK, {length: 2});
        expect(buffalo.getPosition()).toStrictEqual(13);
        expect(value).toStrictEqual([
            {
                "beaconOrder": 3,
                "logicalChannel": 9,
                "neightborPanId": 4112,
                "permitJoin": 1,
                "stackProfile": 1,
                "superFrameOrder": 1,
                "zigbeeVersion": 3,
            },
            {
                "beaconOrder": 3,
                "logicalChannel": 9,
                "neightborPanId": 4112,
                "permitJoin": 0,
                "stackProfile": 1,
                "superFrameOrder": 1,
                "zigbeeVersion": 3,
            },
        ]);
    });

    it('LIST_ASSOC_DEV write', () => {
        expect(() => {
            const bufallo = new BuffaloZnp(Buffer.alloc(10), 1);
            bufallo.write(ParameterType.LIST_ASSOC_DEV, [], {})
        }).toThrow();
    });

    it('LIST_ASSOC_DEV read 3', () => {
        const buffer = Buffer.from([
            0x05, 0x10,
            0x10, 0x09,
            0x31, 0x13,
        ]);

        const buffalo = new BuffaloZnp(buffer);
        const value = buffalo.read(ParameterType.LIST_ASSOC_DEV, {length: 3, startIndex: 0});
        expect(buffalo.getPosition()).toStrictEqual(6);
        expect(value).toStrictEqual([
            4101,
            2320,
            4913,
        ]);
    });

    it('LIST_ASSOC_DEV read 75', () => {
        const payload35 = duplicateArray(35, [0x10, 0x10]);
        const payload5 = duplicateArray(5, [0x10, 0x10]);

        const buffalo1 = new BuffaloZnp(Buffer.from(payload35));
        const value1 = buffalo1.read(ParameterType.LIST_ASSOC_DEV, {length: 40, startIndex: 0});
        expect(buffalo1.getPosition()).toStrictEqual(70);
        expect(value1).toStrictEqual(duplicateArray(35, [4112]));

        const buffalo2 = new BuffaloZnp(Buffer.from(payload5));
        const value2 = buffalo2.read(ParameterType.LIST_ASSOC_DEV, {length: 40, startIndex: 35});
        expect(buffalo2.getPosition()).toStrictEqual(10);
        expect(value2).toStrictEqual(duplicateArray(5, [4112]));
    });

    it('BUFFER8 write', () => {
        const buffalo = new BuffaloZnp(Buffer.alloc(9), 1);
        const payload = Buffer.from([0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07]);
        buffalo.write(ParameterType.BUFFER8, payload, {});
        expect(buffalo.getPosition()).toStrictEqual(9);
        expect(buffalo.getBuffer()).toStrictEqual(Buffer.from([0x00, ...payload]))
    });

    it('BUFFER8 write length consistent', () => {
        const buffalo = new BuffaloZnp(Buffer.alloc(9));
        const payload = Buffer.from([0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08]);
        expect(() => {
            buffalo.write(ParameterType.BUFFER8, payload, {});
        }).toThrow();
    });

    it('BUFFER8 read', () => {
        const buffer = Buffer.from([0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09]);
        const buffalo = new BuffaloZnp(buffer, 2);
        const value = buffalo.read(ParameterType.BUFFER8, {});
        expect(buffalo.getPosition()).toEqual(10);
        expect(value).toStrictEqual(buffer.subarray(2, 11));
    });

    it('BUFFER16 write', () => {
        const buffalo = new BuffaloZnp(Buffer.alloc(20), 1);
        const payload = [0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07];
        buffalo.write(ParameterType.BUFFER16, Buffer.from([...payload, ...payload]), {});
        expect(buffalo.getPosition()).toStrictEqual(17);
        expect(buffalo.getBuffer()).toStrictEqual(Buffer.from([0x00, ...payload, ...payload, 0x00, 0x00, 0x00]))
    });

    it('BUFFER16 read', () => {
        const payload = [0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07];
        const buffalo = new BuffaloZnp(Buffer.from([0x00, ...payload, ...payload]), 1);
        const value = buffalo.read(ParameterType.BUFFER16, {});
        expect(buffalo.getPosition()).toEqual(17);
        expect(value).toStrictEqual(Buffer.from([...payload, ...payload]));
    });

    it('BUFFER18 write', () => {
        const buffalo = new BuffaloZnp(Buffer.alloc(20), 1);
        const payload = [0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08];
        buffalo.write(ParameterType.BUFFER18, Buffer.from([...payload, ...payload]), {});
        expect(buffalo.getPosition()).toStrictEqual(19);
        expect(buffalo.getBuffer()).toStrictEqual(Buffer.from([0x00, ...payload, ...payload, 0x00]))
    });

    it('BUFFER18 read', () => {
        const payload = [0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08];
        const buffalo = new BuffaloZnp(Buffer.from([0x00, ...payload, ...payload]), 1)
        const value = buffalo.read(ParameterType.BUFFER18, {});
        expect(buffalo.getPosition()).toStrictEqual(19);
        expect(value).toStrictEqual(Buffer.from([...payload, ...payload]));
    });

    it('BUFFER32 write', () => {
        const buffalo = new BuffaloZnp(Buffer.alloc(34), 1);
        const payload = [0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07];
        buffalo.write(ParameterType.BUFFER32, Buffer.from([...payload, ...payload, ...payload, ...payload]), {});
        expect(buffalo.getPosition()).toStrictEqual(33);
        expect(buffalo.getBuffer()).toStrictEqual(Buffer.from([0x00, ...payload, ...payload, ...payload, ...payload, 0x00]))
    });

    it('BUFFER32 read', () => {
        const payload = [0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07];
        const buffalo = new BuffaloZnp(Buffer.from([0x00, ...payload, ...payload, ...payload, ...payload]), 1)
        const value = buffalo.read(ParameterType.BUFFER32, {});
        expect(buffalo.getPosition()).toStrictEqual(33);
        expect(value).toStrictEqual(Buffer.from([...payload, ...payload, ...payload, ...payload]));
    });

    it('BUFFER42 write', () => {
        const buffalo = new BuffaloZnp(Buffer.alloc(44), 1);
        const payload = [0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07];
        buffalo.write(ParameterType.BUFFER42, Buffer.from([...payload, ...payload, ...payload, ...payload, ...payload, 0x01, 0xFF]), {});
        expect(buffalo.getPosition()).toStrictEqual(43);
        expect(buffalo.getBuffer()).toStrictEqual(Buffer.from([0x00, ...payload, ...payload, ...payload, ...payload, ...payload, 0x01, 0xFF, 0x00]))
    });

    it('BUFFER42 read', () => {
        const payload = [0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07];
        const buffalo = new BuffaloZnp(Buffer.from([0x00, ...payload, ...payload, ...payload, ...payload, ...payload, 0x08, 0x09]), 1)
        const value = buffalo.read(ParameterType.BUFFER42, {});
        expect(buffalo.getPosition()).toStrictEqual(43);
        expect(value).toStrictEqual(Buffer.from([...payload, ...payload, ...payload, ...payload, ...payload, 0x08, 0x09]));
    });

    it('BUFFER100 write', () => {
        const buffalo = new BuffaloZnp(Buffer.alloc(100), 0);
        let payload = duplicateArray(20, [0x00, 0x01, 0x02, 0x03, 0x04]);
        buffalo.write(ParameterType.BUFFER100, Buffer.from(payload), {});
        expect(buffalo.getPosition()).toStrictEqual(100);
        expect(buffalo.getBuffer()).toStrictEqual(Buffer.from(payload))
    });

    it('BUFFER100 read', () => {
        let payload = duplicateArray(20, [0x00, 0x01, 0x02, 0x03, 0x04]);
        const buffalo = new BuffaloZnp(Buffer.from([0x00, ...payload]), 1);
        const value = buffalo.read(ParameterType.BUFFER100, {});
        expect(buffalo.getPosition()).toStrictEqual(101);
        expect(value).toStrictEqual(Buffer.from(payload));
    });

    it('BUFFER write', () => {
        const buffalo = new BuffaloZnp(Buffer.alloc(9), 1);
        const payload = Buffer.from([0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07]);
        buffalo.write(ParameterType.BUFFER, payload, {});
        expect(buffalo.getPosition()).toStrictEqual(9);
        expect(buffalo.getBuffer()).toStrictEqual(Buffer.from([0x00, ...payload]))
    });

    it('BUFFER read', () => {
        const buffer = Buffer.from([0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09]);
        const buffalo = new BuffaloZnp(buffer, 2);
        const value = buffalo.read(ParameterType.BUFFER, {length: 1});
        expect(buffalo.getPosition()).toEqual(3);
        expect(value).toStrictEqual(buffer.subarray(2, 3));
    });

    it('IEEEADDR write', () => {
        const buffalo = new BuffaloZnp(Buffer.alloc(8));
        buffalo.write(ParameterType.IEEEADDR, ieeeaAddr1.string, {});
        expect(buffalo.getPosition()).toEqual(8);
        expect(buffalo.getBuffer()).toStrictEqual(Buffer.from(ieeeaAddr1.hex))
    });

    it('IEEEADDR read', () => {
        const buffalo = new BuffaloZnp(Buffer.from(ieeeaAddr2.hex));
        const value = buffalo.read(ParameterType.IEEEADDR, {});
        expect(buffalo.getPosition()).toEqual(8);
        expect(value).toStrictEqual(ieeeaAddr2.string);
    });

    it.each([
        ParameterType.BUFFER, ParameterType.LIST_UINT8, ParameterType.LIST_UINT16, ParameterType.LIST_ROUTING_TABLE,
        ParameterType.LIST_BIND_TABLE, ParameterType.LIST_NEIGHBOR_LQI, ParameterType.LIST_NETWORK, ParameterType.LIST_ASSOC_DEV
    ])('Throws when read is missing required length option - param %s', (type) => {
        expect(() => {
            const buffalo = new BuffaloZnp(Buffer.alloc(1));
            buffalo.read(type, {});
        }).toThrow(`Cannot read ${ParameterType[type]} without length option specified`);
    });

    it('Throws when read LIST_ASSOC_DEV is missing required start index option', () => {
        expect(() => {
            const buffalo = new BuffaloZnp(Buffer.alloc(1));
            buffalo.read(ParameterType.LIST_ASSOC_DEV, {length: 1});
        }).toThrow(`Cannot read LIST_ASSOC_DEV without startIndex option specified`);
    });
});
