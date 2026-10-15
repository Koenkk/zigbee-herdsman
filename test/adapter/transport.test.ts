import {MockBinding} from "@serialport/binding-mock";
import {afterEach, beforeEach, describe, expect, test, vi} from "vitest";
import {AdapterTransport} from "../../src/adapter/transport";
import {AsyncMutex, MutexCancelledError} from "../../src/utils/async-mutex";

type Listener = (...args: unknown[]) => void;

const {Socket, getSocket, mockPlatform} = vi.hoisted(() => {
    class FakeSocket {
        private listeners = new Map<string, Set<Listener>>();

        on(event: string, listener: Listener): this {
            let listeners = this.listeners.get(event);

            if (!listeners) {
                listeners = new Set();

                this.listeners.set(event, listeners);
            }

            listeners.add(listener);

            return this;
        }

        once(event: string, listener: Listener): this {
            const wrapperListener: Listener = (...args) => {
                this.removeListener(event, wrapperListener);
                listener(...args);
            };

            return this.on(event, wrapperListener);
        }

        removeListener(event: string, listener: Listener): this {
            this.listeners.get(event)?.delete(listener);

            return this;
        }

        removeAllListeners(event?: string): this {
            if (event) {
                this.listeners.delete(event);
            } else {
                this.listeners.clear();
            }

            return this;
        }

        emit(event: string, ...args: unknown[]): boolean {
            const listeners = this.listeners.get(event);

            if (!listeners) {
                return false;
            }

            for (const listener of [...listeners]) {
                listener(...args);
            }

            return true;
        }

        setNoDelay = vi.fn((_noDelay?: boolean) => {
            return this;
        });

        setKeepAlive = vi.fn((_enable?: boolean, _initialDelay?: number, _interval?: number, _count?: number) => {
            return this;
        });

        connect = vi.fn((_port: number, _host: string) => {
            queueMicrotask(() => {
                this.emit("connect");
            });

            return this;
        });

        destroy = vi.fn((_error?: Error) => {
            queueMicrotask(() => {
                this.emit("close");
            });

            return this;
        });

        write = vi.fn().mockReturnValue(false);
    }

    let socket: FakeSocket;

    return {
        Socket: vi.fn(() => {
            socket = new FakeSocket();

            return socket;
        }),
        getSocket: () => socket,
        mockPlatform: vi.fn(() => "linux"),
    };
});

vi.mock("node:net", async (importOriginal) => {
    const actual = await importOriginal<typeof import("node:net")>();

    return {
        ...actual,
        Socket,
    };
});

vi.mock("node:os", async (importOriginal) => {
    const actual = await importOriginal<typeof import("node:os")>();

    return {
        ...actual,
        platform: mockPlatform,
    };
});

describe("Adapter transport", () => {
    describe.each(["serial", "tcp"])("%s command cancellation", (kind) => {
        let transport: AdapterTransport;

        beforeEach(async () => {
            const path = kind === "serial" ? "/dev/ttyMOCK" : "tcp://127.0.0.1:1234";
            MockBinding.createPort(path, {record: false});
            transport = new AdapterTransport({path});
            transport.serialPortBinding = MockBinding;
            await transport.open();
        });

        afterEach(async () => {
            await transport.close();
            MockBinding.reset();
        });

        test("cancels every registered queue and rejects new work after close", async () => {
            const queues = [new AsyncMutex(), new AsyncMutex()];
            const releases: Array<() => void> = [];
            const signals: AbortSignal[] = [];
            const operations = queues.map((queue) =>
                transport.execute(queue, (signal) => {
                    signals.push(signal);
                    return new Promise<void>((resolve) => releases.push(resolve));
                }),
            );
            const activeErrors = operations.map((p) => expect(p).rejects.toBeInstanceOf(MutexCancelledError));
            const queuedCallback = vi.fn();
            const pending = queues.map((queue) => expect(transport.execute(queue, queuedCallback)).rejects.toBeInstanceOf(MutexCancelledError));

            await transport.close();
            await Promise.all(pending);
            expect(signals.every((signal) => signal.aborted)).toBe(true);
            expect(transport.isStopped).toBe(true);
            expect(queuedCallback).not.toHaveBeenCalled();
            await expect(transport.execute(queues[0], queuedCallback)).rejects.toBeInstanceOf(MutexCancelledError);
            for (const release of releases) release();
            await Promise.all(activeErrors);
            // biome-ignore lint/complexity/useLiteralKeys: Verify registration cleanup.
            expect(transport["session"].queues.size).toBe(0);
        });

        test("reopening does not revive work from the old connection", async () => {
            const queue = new AsyncMutex();
            let release!: () => void;
            let oldSignal!: AbortSignal;
            const active = transport.execute(queue, (signal) => {
                oldSignal = signal;
                return new Promise<void>((resolve) => {
                    release = resolve;
                });
            });
            const rejected = expect(active).rejects.toBeInstanceOf(MutexCancelledError);
            await transport.close();
            await transport.open();
            expect(transport.isStopped).toBe(false);
            const fresh = vi.fn((signal: AbortSignal) => {
                expect(signal).not.toBe(oldSignal);
                expect(signal.aborted).toBe(false);
                return Promise.resolve("new connection");
            });
            const next = transport.execute(queue, fresh);
            expect(fresh).not.toHaveBeenCalled();
            release();
            await rejected;
            await expect(next).resolves.toBe("new connection");
            expect(oldSignal.aborted).toBe(true);
            // biome-ignore lint/complexity/useLiteralKeys: Verify old-session cleanup cannot remove new-session registrations.
            expect(transport["session"].queues.size).toBe(0);
        });

        test("cancels on unexpected disconnect before notifying protocol handlers", async () => {
            const queue = new AsyncMutex();
            let release!: () => void;
            let signal!: AbortSignal;
            const active = transport.execute(queue, (current) => {
                signal = current;
                return new Promise<void>((resolve) => {
                    release = resolve;
                });
            });
            const rejected = expect(active).rejects.toBeInstanceOf(MutexCancelledError);
            const pending = expect(transport.execute(queue, vi.fn())).rejects.toBeInstanceOf(MutexCancelledError);
            const closed = vi.fn(() => expect(signal.aborted).toBe(true));
            transport.on("close", closed);
            const port = transport.serialPortInstance ?? transport.socketInstance!;
            port.emit("close", new Error("disconnected"));
            expect(closed).toHaveBeenCalledOnce();
            expect(transport.isStopped).toBe(false);
            await pending;
            release();
            await rejected;
        });

        test("does not start a command handed the mutex immediately before close", async () => {
            const queue = new AsyncMutex();
            let release!: () => void;
            const holder = queue.run(
                () =>
                    new Promise<void>((resolve) => {
                        release = resolve;
                    }),
            );
            const callback = vi.fn();
            const rejected = expect(transport.execute(queue, callback)).rejects.toBeInstanceOf(MutexCancelledError);
            let closing!: Promise<void>;
            release();
            queueMicrotask(() => {
                expect(queue.count).toBe(0);
                closing = transport.close();
            });
            await holder;
            await rejected;
            await closing;
            expect(callback).not.toHaveBeenCalled();
        });

        test("does not swallow protocol failures or retain completed queues", async () => {
            const queue = new AsyncMutex();
            const error = new Error("protocol failure");
            await expect(transport.execute(queue, () => Promise.reject(error))).rejects.toBe(error);
            await expect(transport.execute(queue, () => Promise.resolve(42))).resolves.toBe(42);
            // biome-ignore lint/complexity/useLiteralKeys: Verify registration cleanup on both outcomes.
            expect(transport["session"].queues.size).toBe(0);
        });
    });

    describe("serial port", () => {
        const ADAPTER_PATH = "/dev/ttyACM0";
        let transport: AdapterTransport;

        beforeEach(() => {
            MockBinding.createPort(ADAPTER_PATH, {record: false});

            transport = new AdapterTransport({path: ADAPTER_PATH, baudRate: 100, rtscts: true});
            transport.serialPortBinding = MockBinding;
        });

        afterEach(() => {
            MockBinding.reset();
        });

        test("opens and closes", async () => {
            const transportOpenSpy = vi.spyOn(transport, "open");
            const transportCloseSpy = vi.spyOn(transport, "close");
            const emitSpy = vi.spyOn(transport, "emit");

            await transport.open();

            expect(transport.isOpen).toStrictEqual(true);
            expect(transport.isSerial).toStrictEqual(true);

            const removeAllListenersSpy = vi.spyOn(transport.serialPortInstance!, "removeAllListeners");
            const closeSpy = vi.spyOn(transport.serialPortInstance!, "close");

            await transport.close();

            expect(emitSpy).toHaveBeenCalledTimes(0);
            expect(transportOpenSpy).toHaveBeenCalledTimes(1);
            expect(transportCloseSpy).toHaveBeenCalledTimes(1);
            expect(removeAllListenersSpy).toHaveBeenCalledTimes(1);
            expect(closeSpy).toHaveBeenCalledTimes(1);
            expect(transport.isOpen).toStrictEqual(false);
            expect(transport.isOpening).toStrictEqual(false);
            expect(transport.isClosing).toStrictEqual(false);
            expect(transport.rtscts).toStrictEqual(true);
            expect(transport.serialPortInstance).toStrictEqual(undefined);
        });

        test("rejects overlapping opens", async () => {
            const opening = transport.open();
            await expect(transport.open()).rejects.toThrow("Transport transition already in progress");
            await opening;
            await transport.close();
        });

        test("cancels requests before waiting for physical close", async () => {
            await transport.open();
            const port = transport.serialPortInstance!;
            const close = port.close.bind(port);
            let finishClose!: () => void;
            vi.spyOn(port, "close").mockImplementationOnce((callback) => {
                finishClose = () => close(callback);
            });
            const queue = new AsyncMutex();
            let release!: () => void;
            const active = transport.execute(
                queue,
                () =>
                    new Promise<void>((resolve) => {
                        release = resolve;
                    }),
            );
            const rejected = expect(active).rejects.toBeInstanceOf(MutexCancelledError);
            const callback = vi.fn();
            const pending = expect(transport.execute(queue, callback)).rejects.toBeInstanceOf(MutexCancelledError);
            const closing = transport.close();
            await pending;
            expect(transport.isClosing).toBe(true);
            expect(port.isOpen).toBe(true);
            expect(callback).not.toHaveBeenCalled();
            await expect(transport.open()).rejects.toThrow("Transport transition already in progress");
            release();
            await rejected;
            finishClose();
            await closing;
            await transport.open();
            await expect(transport.execute(queue, () => Promise.resolve(42))).resolves.toBe(42);
            await transport.close();
        });

        test("a new connection cancels work registered before opening", async () => {
            const queue = new AsyncMutex();
            let release!: () => void;
            const active = transport.execute(
                queue,
                () =>
                    new Promise<void>((resolve) => {
                        release = resolve;
                    }),
            );
            const rejected = expect(active).rejects.toBeInstanceOf(MutexCancelledError);
            const callback = vi.fn();
            const pending = expect(transport.execute(queue, callback)).rejects.toBeInstanceOf(MutexCancelledError);
            await transport.open();
            await pending;
            release();
            await rejected;
            expect(callback).not.toHaveBeenCalled();
            await transport.close();
        });

        test("opens with no flow", async () => {
            transport = new AdapterTransport({path: ADAPTER_PATH, baudRate: 100});
            transport.serialPortBinding = MockBinding;
            const transportOpenSpy = vi.spyOn(transport, "open");
            const transportCloseSpy = vi.spyOn(transport, "close");

            await transport.open(true);

            expect(transport.isOpen).toStrictEqual(true);

            await transport.close();

            expect(transportOpenSpy).toHaveBeenCalledTimes(1);
            expect(transportCloseSpy).toHaveBeenCalledTimes(1);
            expect(transport.isOpen).toStrictEqual(false);
            expect(transport.rtscts).toStrictEqual(false);
        });

        test("opens on win32 - hupcl=false", async () => {
            mockPlatform.mockImplementationOnce(() => "win32");

            const transportOpenSpy = vi.spyOn(transport, "open");
            const transportCloseSpy = vi.spyOn(transport, "close");

            await transport.open(true);

            expect(transport.isOpen).toStrictEqual(true);

            await transport.close();

            expect(transportOpenSpy).toHaveBeenCalledTimes(1);
            expect(transportCloseSpy).toHaveBeenCalledTimes(1);
            expect(transport.isOpen).toStrictEqual(false);
        });

        test("closes when opening while already opened", async () => {
            const transportOpenSpy = vi.spyOn(transport, "open");
            const transportCloseSpy = vi.spyOn(transport, "close");

            await transport.open();

            expect(transport.isOpen).toStrictEqual(true);
            expect(transportOpenSpy).toHaveBeenCalledTimes(1);

            await transport.open();

            expect(transport.isOpen).toStrictEqual(true);
            expect(transportCloseSpy).toHaveBeenCalledTimes(1);

            await transport.close();

            expect(transportOpenSpy).toHaveBeenCalledTimes(2);
            expect(transportCloseSpy).toHaveBeenCalledTimes(2);
            expect(transport.isOpen).toStrictEqual(false);
        });

        test("writes", async () => {
            await transport.open();

            const writeSpy = vi.spyOn(transport.serialPortInstance!, "write");

            transport.write(Buffer.from([0x01]));

            expect(writeSpy).toHaveBeenCalledTimes(1);
            expect(writeSpy).toHaveBeenNthCalledWith(1, Buffer.from([0x01]));
        });

        test("emits data", async () => {
            await transport.open();

            const emitSpy = vi.spyOn(transport, "emit");

            transport.serialPortInstance!.emit("data", Buffer.from([0x01]));

            expect(emitSpy).toHaveBeenCalledTimes(1);
            expect(emitSpy).toHaveBeenNthCalledWith(1, "data", Buffer.from([0x01]));
        });

        test("sets", async () => {
            await transport.open();

            const setSpy = vi.spyOn(transport.serialPortInstance!, "set");

            await transport.set({cts: true});

            expect(setSpy).toHaveBeenCalledTimes(1);
            expect(setSpy).toHaveBeenNthCalledWith(1, {cts: true}, expect.any(Function));
        });

        test("gets", async () => {
            await transport.open();

            const getSpy = vi.spyOn(transport.serialPortInstance!, "get");

            await transport.get();

            expect(getSpy).toHaveBeenCalledTimes(1);
        });

        test("port closes in background", async () => {
            await transport.open();

            const emitSpy = vi.spyOn(transport, "emit");
            const serialEmitSpy = vi.spyOn(transport.serialPortInstance!, "emit");

            transport.serialPortInstance!.emit("close");

            await new Promise((resolve) => setImmediate(resolve));

            expect(emitSpy).toHaveBeenCalledTimes(1);
            expect(emitSpy).toHaveBeenNthCalledWith(1, "close", undefined);
            expect(serialEmitSpy).toHaveBeenCalledTimes(1);
            expect(serialEmitSpy).toHaveBeenNthCalledWith(1, "close");
            expect(transport.serialPortInstance).toStrictEqual(undefined);
        });

        test("throws when unable to open", async () => {
            const openSpy = vi.spyOn(MockBinding, "open").mockRejectedValueOnce(new Error("failed to open"));
            const p = transport.open();
            const removeAllListenersSpy = vi.spyOn(transport.serialPortInstance!, "removeAllListeners");

            await expect(p).rejects.toThrow("failed to open");

            expect(openSpy).toHaveBeenCalledTimes(1);
            expect(removeAllListenersSpy).toHaveBeenCalledTimes(1);
            expect(transport.serialPortInstance).toStrictEqual(undefined);
            expect(transport.isOpen).toStrictEqual(false);
            expect(transport.isOpening).toStrictEqual(false);
            expect(transport.isClosing).toStrictEqual(false);
        });

        test("throws when unable to close", async () => {
            await transport.open();

            const removeAllListenersSpy = vi.spyOn(transport.serialPortInstance!, "removeAllListeners");
            const closeSpy = vi.spyOn(transport.serialPortInstance!, "close").mockImplementationOnce((cb) => {
                cb?.(new Error("failed to close"));
            });

            await expect(transport.close()).rejects.toThrow("failed to close");

            expect(removeAllListenersSpy).toHaveBeenCalledTimes(1);
            expect(closeSpy).toHaveBeenCalledTimes(1);
            expect(transport.serialPortInstance).toStrictEqual(undefined);
            expect(transport.isOpen).toStrictEqual(false);
            expect(transport.isOpening).toStrictEqual(false);
            expect(transport.isClosing).toStrictEqual(false);
        });

        test("throws when trying to write while closed", () => {
            expect(transport.isOpen).toStrictEqual(false);
            expect(() => {
                transport.write(Buffer.from([0x01]));
            }).toThrow("Cannot write while transport is closed");
        });

        test("throws when trying to set while closed", async () => {
            await expect(transport.set({cts: true})).rejects.toThrow("Cannot set while serial transport is closed");
        });

        test("throws when unable to set", async () => {
            await transport.open();

            const setSpy = vi.spyOn(transport.serialPortInstance!, "set").mockImplementationOnce((_opts, cb) => {
                cb?.(new Error("failed to set"));
            });

            await expect(transport.set({cts: true})).rejects.toThrow("failed to set");

            await transport.close();

            expect(setSpy).toHaveBeenCalledTimes(1);
            expect(transport.isOpen).toStrictEqual(false);
            expect(transport.isOpening).toStrictEqual(false);
            expect(transport.isClosing).toStrictEqual(false);
        });

        test("throws when trying to get while closed", async () => {
            await expect(transport.get()).rejects.toThrow("Cannot get while serial transport is closed");
        });

        test("throws when unable to get", async () => {
            await transport.open();

            const getSpy = vi.spyOn(transport.serialPortInstance!, "get").mockImplementationOnce((cb) => {
                cb?.(new Error("failed to get"));
            });

            await expect(transport.get()).rejects.toThrow("failed to get");

            await transport.close();

            expect(getSpy).toHaveBeenCalledTimes(1);
            expect(transport.isOpen).toStrictEqual(false);
            expect(transport.isOpening).toStrictEqual(false);
            expect(transport.isClosing).toStrictEqual(false);
        });
    });

    describe("socket", () => {
        const ADAPTER_PATH = "tcp://192.168.1.2:3456";
        let transport: AdapterTransport;

        beforeEach(() => {
            MockBinding.createPort(ADAPTER_PATH, {record: false});

            transport = new AdapterTransport({path: ADAPTER_PATH});
            transport.serialPortBinding = MockBinding;
        });

        afterEach(() => {
            MockBinding.reset();
        });

        test("opens and closes", async () => {
            const transportOpenSpy = vi.spyOn(transport, "open");
            const transportCloseSpy = vi.spyOn(transport, "close");
            const emitSpy = vi.spyOn(transport, "emit");

            await transport.open();

            expect(transport.isOpen).toStrictEqual(true);
            expect(transport.isSerial).toStrictEqual(false);

            const removeAllListenersSpy = vi.spyOn(transport.socketInstance!, "removeAllListeners");
            const destroySpy = vi.spyOn(transport.socketInstance!, "destroy");

            await transport.close();

            expect(emitSpy).toHaveBeenCalledTimes(0);
            expect(transportOpenSpy).toHaveBeenCalledTimes(1);
            expect(transportCloseSpy).toHaveBeenCalledTimes(1);
            expect(removeAllListenersSpy).toHaveBeenCalledTimes(1);
            expect(destroySpy).toHaveBeenCalledTimes(1);
            expect(transport.isOpen).toStrictEqual(false);
            expect(transport.isOpening).toStrictEqual(false);
            expect(transport.isClosing).toStrictEqual(false);
            expect(transport.socketInstance).toStrictEqual(undefined);
        });

        test("closes when opening while already opened", async () => {
            const transportOpenSpy = vi.spyOn(transport, "open");
            const transportCloseSpy = vi.spyOn(transport, "close");

            await transport.open();

            expect(transport.isOpen).toStrictEqual(true);
            expect(transportOpenSpy).toHaveBeenCalledTimes(1);

            await transport.open();

            expect(transport.isOpen).toStrictEqual(true);
            expect(transportCloseSpy).toHaveBeenCalledTimes(1);

            await transport.close();

            expect(transportOpenSpy).toHaveBeenCalledTimes(2);
            expect(transportCloseSpy).toHaveBeenCalledTimes(2);
            expect(transport.isOpen).toStrictEqual(false);
        });

        test("writes", async () => {
            await transport.open();

            const writeSpy = vi.spyOn(transport.socketInstance!, "write");

            transport.write(Buffer.from([0x01]));

            expect(writeSpy).toHaveBeenCalledTimes(1);
            expect(writeSpy).toHaveBeenNthCalledWith(1, Buffer.from([0x01]));
        });

        test("emits data", async () => {
            await transport.open();

            const emitSpy = vi.spyOn(transport, "emit");

            transport.socketInstance!.emit("data", Buffer.from([0x01]));

            expect(emitSpy).toHaveBeenCalledTimes(1);
            expect(emitSpy).toHaveBeenNthCalledWith(1, "data", Buffer.from([0x01]));
        });

        test("port closes in background", async () => {
            await transport.open();

            const emitSpy = vi.spyOn(transport, "emit");
            const socketEmitSpy = vi.spyOn(transport.socketInstance!, "emit");

            transport.socketInstance!.emit("close");

            await new Promise((resolve) => setImmediate(resolve));

            expect(emitSpy).toHaveBeenCalledTimes(1);
            expect(emitSpy).toHaveBeenNthCalledWith(1, "close", undefined);
            expect(socketEmitSpy).toHaveBeenCalledTimes(1);
            expect(socketEmitSpy).toHaveBeenNthCalledWith(1, "close");
            expect(transport.socketInstance).toStrictEqual(undefined);
        });

        test("throws when unable to open", async () => {
            const p = transport.open();
            const removeAllListenersSpy = vi.spyOn(transport.socketInstance!, "removeAllListeners");
            const destroySpy = vi.spyOn(transport.socketInstance!, "destroy");

            getSocket().emit("error", new Error("failed to open"));
            await expect(p).rejects.toThrow("failed to open");

            expect(removeAllListenersSpy).toHaveBeenCalledTimes(1);
            expect(destroySpy).toHaveBeenCalledTimes(1);
            expect(transport.socketInstance).toStrictEqual(undefined);
            expect(transport.isOpen).toStrictEqual(false);
            expect(transport.isOpening).toStrictEqual(false);
            expect(transport.isClosing).toStrictEqual(false);
        });

        test("throws when unable to close", async () => {
            await transport.open();

            const removeAllListenersSpy = vi.spyOn(transport.socketInstance!, "removeAllListeners");
            const destroySpy = vi.spyOn(transport.socketInstance!, "destroy").mockImplementationOnce(() => {
                throw new Error("failed to destroy");
            });

            await expect(transport.close()).rejects.toThrow("failed to destroy");

            expect(removeAllListenersSpy).toHaveBeenCalledTimes(1);
            expect(destroySpy).toHaveBeenCalledTimes(1);
            expect(transport.socketInstance).toStrictEqual(undefined);
            expect(transport.isOpen).toStrictEqual(false);
            expect(transport.isOpening).toStrictEqual(false);
            expect(transport.isClosing).toStrictEqual(false);
        });

        test("throws when trying to write while closed", () => {
            expect(transport.isOpen).toStrictEqual(false);
            expect(() => {
                transport.write(Buffer.from([0x01]));
            }).toThrow("Cannot write while transport is closed");
        });

        test("throws when trying to set", async () => {
            await transport.open();
            await expect(transport.set({cts: true})).rejects.toThrow("Cannot set while serial transport is closed");
        });

        test("throws when trying to get", async () => {
            await transport.open();
            await expect(transport.get()).rejects.toThrow("Cannot get while serial transport is closed");
        });
    });

    test("throws when path missing", async () => {
        const transport = new AdapterTransport({});

        await expect(transport.open()).rejects.toThrow("Cannot open transport without a path");
    });
});
