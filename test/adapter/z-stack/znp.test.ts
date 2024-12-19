import type {MockInstance} from 'vitest';

import {SerialPort} from '../../../src/adapter/serialPort';
import {Constants as UnpiConstants, Frame as UnpiFrame} from '../../../src/adapter/z-stack/unpi';
import {Znp, ZpiObject} from '../../../src/adapter/z-stack/znp';
import BuffaloZnp from '../../../src/adapter/z-stack/znp/buffaloZnp';
import ParameterType from '../../../src/adapter/z-stack/znp/parameterType';
import {logger} from '../../../src/utils/logger';
import * as Zdo from '../../../src/zspec/zdo';
import {duplicateArray, ieeeaAddr1, ieeeaAddr2} from '../../testUtils';

const mockLogger = {
    debug: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
    error: vi.fn(),
};

const consoleLogger = logger;
const mockSerialPortClose = vi.fn().mockImplementation((cb) => (cb ? cb() : null));
const mockSerialPortFlush = vi.fn().mockImplementation((cb) => cb());
const mockSerialPortAsyncFlushAndClose = vi.fn();
const mockSerialPortPipe = vi.fn();
const mockSerialPortList = vi.fn().mockReturnValue([]);
const mockSerialPortOpen = vi.fn().mockImplementation((cb) => cb());
const mockSerialPortAsyncOpen = vi.fn();
const mockSerialPortConstructor = vi.fn();
const mockSerialPortOnce = vi.fn();
const mockSerialPortAsyncSet = vi.fn();
const mockSerialPortWrite = vi.fn((buffer, cb) => cb());
let mockSerialPortIsOpen = false;

vi.mock('../../../src/utils/wait', () => ({
    wait: vi.fn(() => {
        return new Promise<void>((resolve) => resolve());
    }),
}));

vi.mock('../../../src/adapter/serialPort', () => ({
    SerialPort: vi.fn(() => ({
        close: mockSerialPortClose,
        constructor: mockSerialPortConstructor,
        emit: () => {},
        on: () => {},
        once: mockSerialPortOnce,
        open: mockSerialPortOpen,
        pipe: mockSerialPortPipe,
        write: mockSerialPortWrite,
        flush: mockSerialPortFlush,
        isOpen: mockSerialPortIsOpen,
        asyncOpen: mockSerialPortAsyncOpen,
        asyncFlushAndClose: mockSerialPortAsyncFlushAndClose,
        asyncSet: mockSerialPortAsyncSet,
    })),
}));

const mockSocketSetNoDelay = vi.fn();
const mockSocketSetKeepAlive = vi.fn();
const mockSocketPipe = vi.fn();
const mockSocketOnce = vi.fn();
const mockSocketCallbacks = {};
const mockSocketConnect = vi.fn(() => {
    mockSocketCallbacks['connect']();
    mockSocketCallbacks['ready']();
});
const mockSocketDestroy = vi.fn();
let requestSpy: MockInstance;

vi.mock('node:net', async (importOriginal) => ({
    Socket: vi.fn(() => ({
        setNoDelay: mockSocketSetNoDelay,
        pipe: mockSocketPipe,
        connect: mockSocketConnect,
        on: (event, cb) => (mockSocketCallbacks[event] = cb),
        once: mockSocketOnce,
        destroy: mockSocketDestroy,
        setKeepAlive: mockSocketSetKeepAlive,
    })),
}));

SerialPort.list = mockSerialPortList;

const mockUnpiParserOn = vi.fn();

vi.mock('../../../src/adapter/z-stack/unpi/parser', () => ({
    Parser: vi.fn(() => ({
        on: mockUnpiParserOn,
    })),
}));

const mockUnpiWriterWriteFrame = vi.fn();
const mockUnpiWriterWriteBuffer = vi.fn();

vi.mock('../../../src/adapter/z-stack/unpi/writer', () => ({
    Writer: vi.fn(() => ({
        writeFrame: mockUnpiWriterWriteFrame,
        writeBuffer: mockUnpiWriterWriteBuffer,
        pipe: vi.fn(),
    })),
}));

const mocks = [
    mockSerialPortClose,
    mockSerialPortPipe,
    mockSerialPortConstructor,
    mockSerialPortOpen,
    mockSerialPortOnce,
    mockSerialPortWrite,
    SerialPort,
    mockUnpiParserOn,
    mockUnpiWriterWriteFrame,
    mockUnpiWriterWriteBuffer,
    mockSerialPortFlush,
    mockSerialPortAsyncFlushAndClose,
    mockSerialPortAsyncOpen,
];

describe('ZNP', () => {
    let znp: Znp;

    beforeAll(async () => {
        vi.useFakeTimers();
    });

    afterAll(async () => {
        vi.useRealTimers();
    });

    beforeEach(() => {
        for (let mock of mocks) {
            // @ts-ignore
            mock.mockClear();
        }

        // @ts-ignore; make sure we always get a new instance
        znp = new Znp('/dev/ttyACM0', 100, true);
        requestSpy = vi.spyOn(znp, 'request').mockImplementation(() => {});
    });

    afterEach(() => {
        requestSpy.mockRestore();
    });

    it('Open', async () => {
        await znp.open();

        expect(SerialPort).toHaveBeenCalledTimes(1);
        expect(SerialPort).toHaveBeenCalledWith({path: '/dev/ttyACM0', autoOpen: false, baudRate: 100, rtscts: true});

        expect(mockSerialPortPipe).toHaveBeenCalledTimes(1);
        expect(mockSerialPortAsyncOpen).toHaveBeenCalledTimes(1);
        expect(mockSerialPortOnce).toHaveBeenCalledTimes(2);
        expect(mockUnpiWriterWriteBuffer).toHaveBeenCalledTimes(0);
    });

    it('Open - first ping fails should send reset bootloader', async () => {
        requestSpy.mockImplementation(() => {
            throw new Error('failed');
        });
        await znp.open();

        expect(SerialPort).toHaveBeenCalledTimes(1);
        expect(SerialPort).toHaveBeenCalledWith({path: '/dev/ttyACM0', autoOpen: false, baudRate: 100, rtscts: true});

        expect(mockSerialPortPipe).toHaveBeenCalledTimes(1);
        expect(mockSerialPortAsyncOpen).toHaveBeenCalledTimes(1);
        expect(mockUnpiWriterWriteBuffer).toHaveBeenCalledTimes(1);
        expect(mockSerialPortOnce).toHaveBeenCalledTimes(2);
    });

    it('Open with defaults', async () => {
        znp = new Znp('/dev/ttyACM0', undefined, undefined);
        requestSpy = vi.spyOn(znp, 'request').mockImplementation(() => {});
        await znp.open();

        expect(SerialPort).toHaveBeenCalledTimes(1);
        expect(SerialPort).toHaveBeenCalledWith({path: '/dev/ttyACM0', autoOpen: false, baudRate: 115200, rtscts: false});

        expect(mockSerialPortPipe).toHaveBeenCalledTimes(1);
        expect(mockSerialPortAsyncOpen).toHaveBeenCalledTimes(1);
        expect(mockSerialPortOnce).toHaveBeenCalledTimes(2);
    });

    it('Open and close tcp port', async () => {
        znp = new Znp('tcp://localhost:8080', 100, false);
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
        });

        znp = new Znp('tcp://localhost:666', 100, false);

        let error = false;
        try {
            await znp.open();
        } catch (e) {
            error = e;
        }

        expect(error).toStrictEqual(new Error('Error while opening socket'));
        expect(znp.isInitialized()).toBeFalsy();
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
        expect(SerialPort).toHaveBeenCalledWith({path: '/dev/ttyACM0', autoOpen: false, baudRate: 100, rtscts: true});

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
        expect(SerialPort).toHaveBeenCalledWith({path: '/dev/ttyACM0', autoOpen: false, baudRate: 100, rtscts: true});

        expect(error).toEqual('failed!');
        expect(mockSerialPortPipe).toHaveBeenCalledTimes(1);
        expect(mockSerialPortAsyncOpen).toHaveBeenCalledTimes(1);
        expect(mockSerialPortClose).toHaveBeenCalledTimes(0);
        expect(mockUnpiWriterWriteBuffer).toHaveBeenCalledTimes(0);
        expect(mockSerialPortOnce).toHaveBeenCalledTimes(0);
    });

    it('Open and close', async () => {
        const close = vi.fn();
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
        const close = vi.fn();
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
        const close = vi.fn();
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

        mockSerialPortOnce.mockImplementation((event, cb) => {
            if (event === 'close') {
                closeCb = cb;
            }
        });

        const close = vi.fn();
        znp.on('close', close);
        await znp.open();
        closeCb();

        expect(close).toHaveBeenCalledTimes(1);
    });

    it('Serialport error (do nothing)', async () => {
        let errorCb;

        mockSerialPortOnce.mockImplementation((event, cb) => {
            if (event === 'error') {
                errorCb = cb;
            }
        });

        await znp.open();
        errorCb();
    });

    it('znp receive', async () => {
        let parsedCb;
        const received = vi.fn();

        znp.on('received', received);

        mockUnpiParserOn.mockImplementationOnce((event, cb) => {
            if (event === 'parsed') {
                parsedCb = cb;
            }
        });

        znp.open();
        parsedCb(
            new UnpiFrame(
                UnpiConstants.Type.SRSP,
                UnpiConstants.Subsystem.SYS,
                0x02,
                Buffer.from([0x01, 0x02, 0x03, 0x04, 0x05, 0x01, 0x01, 0x01, 0x01]),
            ),
        );

        expect(received).toHaveBeenCalledTimes(1);

        const obj = received.mock.calls[0][0];
        expect(obj.command.name).toBe('version');
        expect(obj.command.ID).toBe(2);
        expect(obj.payload).toStrictEqual({maintrel: 5, majorrel: 3, minorrel: 4, product: 2, revision: 16843009, transportrev: 1});
        expect(obj.subsystem).toBe(UnpiConstants.Subsystem.SYS);
        expect(obj.type).toBe(UnpiConstants.Type.SRSP);
    });

    it('znp receive malformed', async () => {
        let parsedCb;
        const received = vi.fn();

        znp.on('received', received);

        mockUnpiParserOn.mockImplementationOnce((event, cb) => {
            if (event === 'parsed') {
                parsedCb = cb;
            }
        });

        znp.open();
        parsedCb(new UnpiFrame(UnpiConstants.Type.SRSP, UnpiConstants.Subsystem.SYS, 0x02, Buffer.from([0x01, 0x02, 0x03, 0x04])));

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
            parsedCb(new UnpiFrame(UnpiConstants.Type.SRSP, UnpiConstants.Subsystem.SYS, 0x08, Buffer.from([0x00, 0x02, 0x01, 0x02])));
        });

        await znp.open();
        requestSpy.mockRestore();

        const result = await znp.requestWithReply(UnpiConstants.Subsystem.SYS, 'osalNvRead', {id: 1, offset: 2});

        const frame = mockUnpiWriterWriteFrame.mock.calls[0][0];
        expect(mockUnpiWriterWriteFrame).toHaveBeenCalledTimes(1);
        expect(frame.commandID).toBe(8);
        expect(frame.subsystem).toBe(UnpiConstants.Subsystem.SYS);
        expect(frame.type).toBe(UnpiConstants.Type.SREQ);
        expect(frame.data).toStrictEqual(Buffer.from([0x01, 0x00, 0x02]));

        expect(result.command.name).toBe('osalNvRead');
        expect(result.command.ID).toBe(0x08);
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
            parsedCb(new UnpiFrame(UnpiConstants.Type.SRSP, UnpiConstants.Subsystem.SYS, 0x08, Buffer.from([0x01, 0x02, 0x01, 0x02])));
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

        expect(error).toStrictEqual(
            new Error("--> 'SREQ: SYS - osalNvRead - {\"id\":1,\"offset\":2}' failed with status '(0x01: FAILURE)' (expected '(0x00: SUCCESS)')"),
        );
    });

    it('znp request SREQ failed should cancel waiter when provided', async () => {
        let parsedCb;
        mockUnpiParserOn.mockImplementationOnce((event, cb) => {
            if (event === 'parsed') {
                parsedCb = cb;
            }
        });

        mockUnpiWriterWriteFrame.mockImplementationOnce(() => {
            parsedCb(new UnpiFrame(UnpiConstants.Type.SRSP, UnpiConstants.Subsystem.SYS, 0x08, Buffer.from([0x01, 0x02, 0x01, 0x02])));
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

        expect(error).toStrictEqual(
            new Error("--> 'SREQ: SYS - osalNvRead - {\"id\":1,\"offset\":2}' failed with status '(0x01: FAILURE)' (expected '(0x00: SUCCESS)')"),
        );
    });

    it('znp request SREQ with parsed in between', async () => {
        let parsedCb;
        mockUnpiParserOn.mockImplementationOnce((event, cb) => {
            if (event === 'parsed') {
                parsedCb = cb;
            }
        });

        mockUnpiWriterWriteFrame.mockImplementationOnce(() => {
            parsedCb(new UnpiFrame(UnpiConstants.Type.SRSP, UnpiConstants.Subsystem.AF, 0x00, Buffer.from([0x00])));

            parsedCb(new UnpiFrame(UnpiConstants.Type.SRSP, UnpiConstants.Subsystem.SYS, 0x08, Buffer.from([0x00, 0x02, 0x01, 0x02])));
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

        expect(result.command.name).toBe('osalNvRead');
        expect(result.command.ID).toBe(0x08);
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
            parsedCb(new UnpiFrame(UnpiConstants.Type.AREQ, UnpiConstants.Subsystem.SYS, 0x80, Buffer.from([0x01, 0x02, 0x03, 0x04, 0x05, 0x06])));
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

        expect(result.command.name).toBe('resetInd');
        expect(result.command.ID).toBe(0x80);
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

        expect(error).toEqual(new Error('Cannot request when znp has not been initialized yet'));
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

        expect(error).toEqual(new Error("Command request 'nonExisting' from subsystem '6' not found"));
    });

    it('znp request timeout', async () => {
        await znp.open();
        requestSpy.mockRestore();

        let result = znp.request(UnpiConstants.Subsystem.SYS, 'osalNvRead', {id: 1, offset: 2});
        vi.runAllTimers();

        let error;
        try {
            await result;
        } catch (e) {
            error = e;
        }

        expect(error).toStrictEqual(new Error('SRSP - SYS - osalNvRead after 6000ms'));
    });

    it('znp request timeout for startupFromApp is longer', async () => {
        await znp.open();
        requestSpy.mockRestore();

        let result = znp.request(UnpiConstants.Subsystem.ZDO, 'startupFromApp', {startdelay: 100});
        vi.advanceTimersByTime(30000);

        let error;
        try {
            vi.advanceTimersByTime(15000);
            await result;
        } catch (e) {
            error = e;
        }

        expect(error).toStrictEqual(new Error('SRSP - ZDO - startupFromApp after 40000ms'));
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
        vi.runAllTimers();

        parsedCb(new UnpiFrame(UnpiConstants.Type.SRSP, UnpiConstants.Subsystem.SYS, 0x08, Buffer.from([0x00, 0x02, 0x01, 0x02])));

        let error;
        try {
            result = await result;
        } catch (e) {
            error = e;
        }

        expect(error).toStrictEqual(new Error('SRSP - SYS - osalNvRead after 6000ms'));
    });

    it('znp request, waitFor', async () => {
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

        parsedCb(new UnpiFrame(UnpiConstants.Type.SRSP, UnpiConstants.Subsystem.SYS, 0x08, Buffer.from([0x00, 0x02, 0x01, 0x02])));

        const object = await waiter.start().promise;
        expect(object.payload).toStrictEqual({len: 2, status: 0, value: Buffer.from([1, 2])});
    });

    it('znp request ZDO', async () => {
        let parsedCb;

        mockUnpiParserOn.mockImplementationOnce((event, cb) => {
            if (event === 'parsed') {
                parsedCb = cb;
            }
        });
        mockUnpiWriterWriteFrame.mockImplementationOnce(() => {
            parsedCb(new UnpiFrame(UnpiConstants.Type.SRSP, UnpiConstants.Subsystem.ZDO, 2, Buffer.from([0x00])));
        });

        await znp.open();

        const zdoPayload = Buffer.from([2 & 0xff, (2 >> 8) & 0xff, ...Zdo.Buffalo.buildRequest(false, Zdo.ClusterId.NODE_DESCRIPTOR_REQUEST, 2)]);
        const result = await znp.requestZdo(Zdo.ClusterId.NODE_DESCRIPTOR_REQUEST, zdoPayload, 1);

        const frame = mockUnpiWriterWriteFrame.mock.calls[0][0];
        expect(mockUnpiWriterWriteFrame).toHaveBeenCalledTimes(1);
        expect(frame.commandID).toBe(2);
        expect(frame.subsystem).toBe(UnpiConstants.Subsystem.ZDO);
        expect(frame.type).toBe(UnpiConstants.Type.SREQ);
        expect(frame.data).toStrictEqual(zdoPayload);

        expect(result).toBe(undefined);
    });

    it('znp request ZDO SUCCESS', async () => {
        let parsedCb;
        mockUnpiParserOn.mockImplementationOnce((event, cb) => {
            if (event === 'parsed') {
                parsedCb = cb;
            }
        });

        await znp.open();

        const waiter = znp.waitFor(UnpiConstants.Type.SRSP, UnpiConstants.Subsystem.ZDO, 'nodeDescReq');
        const zdoPayload = Buffer.from([2 & 0xff, (2 >> 8) & 0xff, ...Zdo.Buffalo.buildRequest(false, Zdo.ClusterId.NODE_DESCRIPTOR_REQUEST, 2)]);
        znp.requestZdo(Zdo.ClusterId.NODE_DESCRIPTOR_REQUEST, zdoPayload, 1);

        parsedCb(new UnpiFrame(UnpiConstants.Type.SRSP, UnpiConstants.Subsystem.ZDO, 2, Buffer.from([0x00])));

        const object = await waiter.start().promise;
        expect(object.payload).toStrictEqual({status: 0x00});
    });

    it('znp request ZDO FAILURE', async () => {
        let parsedCb;
        mockUnpiParserOn.mockImplementationOnce((event, cb) => {
            if (event === 'parsed') {
                parsedCb = cb;
            }
        });

        mockUnpiWriterWriteFrame.mockImplementationOnce(() => {
            parsedCb(new UnpiFrame(UnpiConstants.Type.SRSP, UnpiConstants.Subsystem.ZDO, 2, Buffer.from([0x01])));
        });

        await znp.open();

        const zdoPayload = Buffer.from([2 & 0xff, (2 >> 8) & 0xff, ...Zdo.Buffalo.buildRequest(false, Zdo.ClusterId.NODE_DESCRIPTOR_REQUEST, 2)]);
        let error;
        try {
            await znp.requestZdo(Zdo.ClusterId.NODE_DESCRIPTOR_REQUEST, zdoPayload, undefined);
        } catch (e) {
            error = e;
        }

        expect(error).toStrictEqual(
            new Error(`--> 'SREQ: ZDO - NODE_DESCRIPTOR_REQUEST - ${zdoPayload.toString('hex')}' failed with status '(0x01: FAILURE)'`),
        );
    });

    it('znp request ZDO failed should cancel waiter when provided', async () => {
        let parsedCb;
        mockUnpiParserOn.mockImplementationOnce((event, cb) => {
            if (event === 'parsed') {
                parsedCb = cb;
            }
        });

        mockUnpiWriterWriteFrame.mockImplementationOnce(() => {
            parsedCb(new UnpiFrame(UnpiConstants.Type.SRSP, UnpiConstants.Subsystem.ZDO, 2, Buffer.from([0x01])));
        });

        await znp.open();

        expect(znp.waitress.waiters.size).toBe(0);
        const waiter = znp.waitFor(UnpiConstants.Type.AREQ, UnpiConstants.Subsystem.ZDO, 'nodeDescRsp');
        expect(znp.waitress.waiters.size).toBe(1);

        const zdoPayload = Buffer.from([2 & 0xff, (2 >> 8) & 0xff, ...Zdo.Buffalo.buildRequest(false, Zdo.ClusterId.NODE_DESCRIPTOR_REQUEST, 2)]);
        let error;
        try {
            await znp.requestZdo(Zdo.ClusterId.NODE_DESCRIPTOR_REQUEST, zdoPayload, waiter.ID);
        } catch (e) {
            expect(znp.waitress.waiters.size).toBe(0);
            error = e;
        }

        expect(error).toStrictEqual(
            new Error(`--> 'SREQ: ZDO - NODE_DESCRIPTOR_REQUEST - ${zdoPayload.toString('hex')}' failed with status '(0x01: FAILURE)'`),
        );
    });

    it('znp waitFor with transid', async () => {
        let parsedCb;
        mockUnpiParserOn.mockImplementationOnce((event, cb) => {
            if (event === 'parsed') {
                parsedCb = cb;
            }
        });

        await znp.open();
        requestSpy.mockRestore();

        const waiter = znp.waitFor(UnpiConstants.Type.AREQ, UnpiConstants.Subsystem.AF, 'dataConfirm', undefined, 123);

        parsedCb(new UnpiFrame(UnpiConstants.Type.AREQ, UnpiConstants.Subsystem.AF, 128, Buffer.from([0, 1, 123])));

        const object = await waiter.start().promise;
        expect(object.payload).toStrictEqual({status: 0, endpoint: 1, transid: 123});
    });

    it('znp waitFor with target as network address', async () => {
        let parsedCb;
        mockUnpiParserOn.mockImplementationOnce((event, cb) => {
            if (event === 'parsed') {
                parsedCb = cb;
            }
        });

        await znp.open();
        requestSpy.mockRestore();

        const waiter = znp.waitFor(UnpiConstants.Type.AREQ, UnpiConstants.Subsystem.ZDO, 'activeEpRsp', 0x1234);

        parsedCb(new UnpiFrame(UnpiConstants.Type.AREQ, UnpiConstants.Subsystem.ZDO, 133, Buffer.from([0x34, 0x12, 0x00, 0x34, 0x12, 0x00])));

        const object = await waiter.start().promise;
        expect(object.payload.zdo).toStrictEqual([
            Zdo.Status.SUCCESS,
            {
                nwkAddress: 0x1234,
                endpointList: [],
            },
        ]);
    });

    it('znp waitFor with target as IEEE', async () => {
        let parsedCb;
        mockUnpiParserOn.mockImplementationOnce((event, cb) => {
            if (event === 'parsed') {
                parsedCb = cb;
            }
        });

        await znp.open();
        requestSpy.mockRestore();

        const waiter = znp.waitFor(UnpiConstants.Type.AREQ, UnpiConstants.Subsystem.ZDO, 'nwkAddrRsp', '0x0807060504030201');

        parsedCb(
            new UnpiFrame(
                UnpiConstants.Type.AREQ,
                UnpiConstants.Subsystem.ZDO,
                128,
                Buffer.from([0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x01, 0x01, 0x00, 0x02, 0x10, 0x10, 0x11, 0x11]),
            ),
        );

        const object = await waiter.start().promise;
        expect(object.payload.zdo).toStrictEqual([
            Zdo.Status.SUCCESS,
            {
                assocDevList: [4112, 4369],
                eui64: '0x0807060504030201',
                // numassocdev: 2,
                nwkAddress: 257,
                startIndex: 0,
            },
        ]);
    });

    it('znp waitFor with target as IEEE forced to timeout because invalid ZDO status (no payload to match against)', async () => {
        let parsedCb;
        mockUnpiParserOn.mockImplementationOnce((event, cb) => {
            if (event === 'parsed') {
                parsedCb = cb;
            }
        });

        await znp.open();
        requestSpy.mockRestore();

        const waiter = znp.waitFor(UnpiConstants.Type.AREQ, UnpiConstants.Subsystem.ZDO, 'nwkAddrRsp', '0x0807060504030201').start();

        parsedCb(new UnpiFrame(UnpiConstants.Type.AREQ, UnpiConstants.Subsystem.ZDO, 128, Buffer.from([Zdo.Status.INVALID_INDEX])));

        vi.advanceTimersByTime(11000);
        await expect(waiter.promise).rejects.toThrow('AREQ - ZDO - nwkAddrRsp after 10000ms');
    });

    it('znp waitFor with state', async () => {
        let parsedCb;
        mockUnpiParserOn.mockImplementationOnce((event, cb) => {
            if (event === 'parsed') {
                parsedCb = cb;
            }
        });

        await znp.open();
        requestSpy.mockRestore();

        const waiter = znp.waitFor(UnpiConstants.Type.AREQ, UnpiConstants.Subsystem.ZDO, 'stateChangeInd', undefined, undefined, 9);

        parsedCb(new UnpiFrame(UnpiConstants.Type.AREQ, UnpiConstants.Subsystem.ZDO, 192, Buffer.from([9])));

        const object = await waiter.start().promise;
        expect(object.payload).toStrictEqual({state: 9});
    });

    it('znp waitFor with payload mismatch', async () => {
        let parsedCb;
        mockUnpiParserOn.mockImplementationOnce((event, cb) => {
            if (event === 'parsed') {
                parsedCb = cb;
            }
        });

        await znp.open();
        requestSpy.mockRestore();

        const waiter = znp.waitFor(UnpiConstants.Type.SRSP, UnpiConstants.Subsystem.SYS, 'osalNvRead', 'abcd').start();

        parsedCb(new UnpiFrame(UnpiConstants.Type.SRSP, UnpiConstants.Subsystem.SYS, 0x08, Buffer.from([0x00, 0x02, 0x01, 0x02])));

        vi.advanceTimersByTime(11000);
        await expect(waiter.promise).rejects.toThrow('SRSP - SYS - osalNvRead after 10000ms');
    });

    it('znp requestWithReply should throw error when request as no reply', async () => {
        await znp.open();

        try {
            await znp.requestWithReply(UnpiConstants.Subsystem.ZDO, 'autoFindDestination', {});
            fail('Should throw error');
        } catch (error) {
            expect(error).toStrictEqual(new Error('Command autoFindDestination has no reply'));
        }
    });

    it('ZpiObject throw error on missing write parser', async () => {
        // @ts-ignore; make sure we always get a new instance
        const obj = new ZpiObject(0, 0, 'dummy', 0, {}, [{name: 'nonExisting', parameterType: 9999999}]);
        expect(() => {
            obj.createPayloadBuffer();
        }).toThrow();
    });

    it('ZpiObject throw error on unknown command', async () => {
        const frame = new UnpiFrame(UnpiConstants.Type.SREQ, UnpiConstants.Subsystem.AF, 99999, Buffer.alloc(0));
        expect(() => {
            ZpiObject.fromUnpiFrame(frame);
        }).toThrow();
    });

    it('ZpiObject throw error on unknown parameters', async () => {
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

    it('ZpiObject parse payload for endDeviceAnnceInd', async () => {
        const buffer = Buffer.from([0, 0, 0, 1, 1, 2, 3, 4, 5, 6, 7, 8, 5]);
        const frame = new UnpiFrame(UnpiConstants.Type.AREQ, UnpiConstants.Subsystem.ZDO, 193, buffer);
        const obj = ZpiObject.fromUnpiFrame(frame);
        expect(obj.payload.zdo).toStrictEqual([
            Zdo.Status.SUCCESS,
            {
                capabilities: {
                    allocateAddress: 0,
                    alternatePANCoordinator: 1,
                    deviceType: 0,
                    powerSource: 1,
                    reserved1: 0,
                    reserved2: 0,
                    rxOnWhenIdle: 0,
                    securityCapability: 0,
                },
                eui64: '0x0807060504030201',
                nwkAddress: 256,
            },
        ]);
    });

    it('ZpiObject parse payload for nwkAddrRsp', async () => {
        const buffer = Buffer.from([0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x01, 0x01, 0x00, 0x02, 0x10, 0x10, 0x11, 0x11]);
        const frame = new UnpiFrame(UnpiConstants.Type.AREQ, UnpiConstants.Subsystem.ZDO, 128, buffer);
        const obj = ZpiObject.fromUnpiFrame(frame);
        expect(obj.payload.zdo).toStrictEqual([
            Zdo.Status.SUCCESS,
            {
                assocDevList: [4112, 4369],
                eui64: '0x0807060504030201',
                // numassocdev: 2,
                nwkAddress: 257,
                startIndex: 0,
            },
        ]);
    });

    it('Cant read unsupported type', () => {
        expect(() => {
            const buffalo = new BuffaloZnp(Buffer.alloc(0));
            // @ts-expect-error invalid typing
            buffalo.read(9999, {});
        }).toThrow(new Error("Read for '9999' not available"));
    });

    it('UINT8 write', () => {
        const buffalo = new BuffaloZnp(Buffer.alloc(3), 1);
        buffalo.write(ParameterType.UINT8, 240, {});
        expect(buffalo.getPosition()).toEqual(2);
        expect(buffalo.getBuffer()).toStrictEqual(Buffer.from([0x00, 0xf0, 0x00]));
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
        expect(buffalo.getBuffer()).toStrictEqual(Buffer.from([0x00, 0x7f, 0x00]));
    });

    it('INT8 read', () => {
        const buffalo = new BuffaloZnp(Buffer.from([0x00, 0xf0, 0x00, 0x00]), 1);
        const value = buffalo.read(ParameterType.INT8, {});
        expect(buffalo.getPosition()).toEqual(2);
        expect(value).toStrictEqual(-16);
    });

    it('UINT16 write', () => {
        const buffalo = new BuffaloZnp(Buffer.alloc(3), 1);
        buffalo.write(ParameterType.UINT16, 1020, {});
        expect(buffalo.getPosition()).toEqual(3);
        expect(buffalo.getBuffer()).toStrictEqual(Buffer.from([0x00, 0xfc, 0x03]));
    });

    it('UINT16 read', () => {
        const buffalo = new BuffaloZnp(Buffer.from([0x00, 0x03, 0xff, 0x00]), 1);
        const value = buffalo.read(ParameterType.UINT16, {});
        expect(buffalo.getPosition()).toEqual(3);
        expect(value).toStrictEqual(65283);
    });

    it('UINT32 write', () => {
        const buffalo = new BuffaloZnp(Buffer.alloc(6), 2);
        buffalo.write(ParameterType.UINT32, 1065283, {});
        expect(buffalo.getPosition()).toEqual(6);
        expect(buffalo.getBuffer()).toStrictEqual(Buffer.from([0x00, 0x00, 0x43, 0x41, 0x10, 0x00]));
    });

    it('UINT32 read', () => {
        const buffalo = new BuffaloZnp(Buffer.from([0x01, 0x03, 0xff, 0xff]));
        const value = buffalo.read(ParameterType.UINT32, {});
        expect(buffalo.getPosition()).toEqual(4);
        expect(value).toStrictEqual(4294902529);
    });

    it('LIST_UINT8 write', () => {
        const buffalo = new BuffaloZnp(Buffer.alloc(4), 1);
        const payload = [200, 100];
        buffalo.write(ParameterType.LIST_UINT8, payload, {});
        expect(buffalo.getPosition()).toStrictEqual(3);
        expect(buffalo.getBuffer()).toStrictEqual(Buffer.from([0x00, 0xc8, 0x64, 0x00]));
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

    it('LIST_NETWORK write', () => {
        expect(() => {
            const buffalo = new BuffaloZnp(Buffer.alloc(10));
            buffalo.write(ParameterType.LIST_NETWORK, [], {});
        }).toThrow();
    });

    it('LIST_NETWORK read', () => {
        const buffer = Buffer.from([0x05, 0x10, 0x10, 0x09, 0x31, 0x13, 0x01, 0x10, 0x10, 0x09, 0x31, 0x13, 0x00, 0x01]);

        const buffalo = new BuffaloZnp(buffer, 1);
        const value = buffalo.read(ParameterType.LIST_NETWORK, {length: 2});
        expect(buffalo.getPosition()).toStrictEqual(13);
        expect(value).toStrictEqual([
            {
                beaconOrder: 3,
                logicalChannel: 9,
                neightborPanId: 4112,
                permitJoin: 1,
                stackProfile: 1,
                superFrameOrder: 1,
                zigbeeVersion: 3,
            },
            {
                beaconOrder: 3,
                logicalChannel: 9,
                neightborPanId: 4112,
                permitJoin: 0,
                stackProfile: 1,
                superFrameOrder: 1,
                zigbeeVersion: 3,
            },
        ]);
    });

    it('BUFFER8 write', () => {
        const buffalo = new BuffaloZnp(Buffer.alloc(9), 1);
        const payload = Buffer.from([0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07]);
        buffalo.write(ParameterType.BUFFER8, payload, {});
        expect(buffalo.getPosition()).toStrictEqual(9);
        expect(buffalo.getBuffer()).toStrictEqual(Buffer.from([0x00, ...payload]));
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
        expect(buffalo.getBuffer()).toStrictEqual(Buffer.from([0x00, ...payload, ...payload, 0x00, 0x00, 0x00]));
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
        expect(buffalo.getBuffer()).toStrictEqual(Buffer.from([0x00, ...payload, ...payload, 0x00]));
    });

    it('BUFFER18 read', () => {
        const payload = [0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08];
        const buffalo = new BuffaloZnp(Buffer.from([0x00, ...payload, ...payload]), 1);
        const value = buffalo.read(ParameterType.BUFFER18, {});
        expect(buffalo.getPosition()).toStrictEqual(19);
        expect(value).toStrictEqual(Buffer.from([...payload, ...payload]));
    });

    it('BUFFER32 write', () => {
        const buffalo = new BuffaloZnp(Buffer.alloc(34), 1);
        const payload = [0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07];
        buffalo.write(ParameterType.BUFFER32, Buffer.from([...payload, ...payload, ...payload, ...payload]), {});
        expect(buffalo.getPosition()).toStrictEqual(33);
        expect(buffalo.getBuffer()).toStrictEqual(Buffer.from([0x00, ...payload, ...payload, ...payload, ...payload, 0x00]));
    });

    it('BUFFER32 read', () => {
        const payload = [0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07];
        const buffalo = new BuffaloZnp(Buffer.from([0x00, ...payload, ...payload, ...payload, ...payload]), 1);
        const value = buffalo.read(ParameterType.BUFFER32, {});
        expect(buffalo.getPosition()).toStrictEqual(33);
        expect(value).toStrictEqual(Buffer.from([...payload, ...payload, ...payload, ...payload]));
    });

    it('BUFFER42 write', () => {
        const buffalo = new BuffaloZnp(Buffer.alloc(44), 1);
        const payload = [0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07];
        buffalo.write(ParameterType.BUFFER42, Buffer.from([...payload, ...payload, ...payload, ...payload, ...payload, 0x01, 0xff]), {});
        expect(buffalo.getPosition()).toStrictEqual(43);
        expect(buffalo.getBuffer()).toStrictEqual(Buffer.from([0x00, ...payload, ...payload, ...payload, ...payload, ...payload, 0x01, 0xff, 0x00]));
    });

    it('BUFFER42 read', () => {
        const payload = [0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07];
        const buffalo = new BuffaloZnp(Buffer.from([0x00, ...payload, ...payload, ...payload, ...payload, ...payload, 0x08, 0x09]), 1);
        const value = buffalo.read(ParameterType.BUFFER42, {});
        expect(buffalo.getPosition()).toStrictEqual(43);
        expect(value).toStrictEqual(Buffer.from([...payload, ...payload, ...payload, ...payload, ...payload, 0x08, 0x09]));
    });

    it('BUFFER100 write', () => {
        const buffalo = new BuffaloZnp(Buffer.alloc(100), 0);
        let payload = duplicateArray(20, [0x00, 0x01, 0x02, 0x03, 0x04]);
        buffalo.write(ParameterType.BUFFER100, Buffer.from(payload), {});
        expect(buffalo.getPosition()).toStrictEqual(100);
        expect(buffalo.getBuffer()).toStrictEqual(Buffer.from(payload));
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
        expect(buffalo.getBuffer()).toStrictEqual(Buffer.from([0x00, ...payload]));
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
        expect(buffalo.getBuffer()).toStrictEqual(Buffer.from(ieeeaAddr1.hex));
    });

    it('IEEEADDR read', () => {
        const buffalo = new BuffaloZnp(Buffer.from(ieeeaAddr2.hex));
        const value = buffalo.read(ParameterType.IEEEADDR, {});
        expect(buffalo.getPosition()).toEqual(8);
        expect(value).toStrictEqual(ieeeaAddr2.string);
    });

    it.each([ParameterType.BUFFER, ParameterType.LIST_UINT8, ParameterType.LIST_UINT16, ParameterType.LIST_NETWORK])(
        'Throws when read is missing required length option - param %s',
        (type) => {
            expect(() => {
                const buffalo = new BuffaloZnp(Buffer.alloc(1));
                buffalo.read(type, {});
            }).toThrow(`Cannot read ${ParameterType[type]} without length option specified`);
        },
    );

    it('Coverage logger', async () => {
        consoleLogger.warning(() => 'Test warning', 'TestNS');
        consoleLogger.error(() => 'Test error', 'TestNS');
    });
});
