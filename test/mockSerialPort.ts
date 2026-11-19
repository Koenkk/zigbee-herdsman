import type {AvailablePort, NativeSerialPort} from "@koenkk/serialport-napi-rs";
import {vi} from "vitest";
import {flushPromises} from "./testUtils";

const responses: (Buffer | Error)[] = [];

let deliverNext = async (): Promise<void> => {
    await new Promise((_, reject) => reject(new Error("Serial port not opened")));
};

export const scheduleSerialPortData = (response: Buffer | Error) => {
    responses.push(response);
};

export const emitSerialPortData = async (response: Buffer | Error) => {
    scheduleSerialPortData(response);
    await deliverNext();
};

// biome-ignore lint/suspicious/useAwait: API
export const mockNativeSerialPortOpen = vi.fn<typeof NativeSerialPort.open>(async (_path, _options, callback) => {
    // clear on every open
    responses.length = 0;
    let closed = false;

    deliverNext = async () => {
        const response = responses.shift();

        if (!response) {
            return;
        }

        queueMicrotask(() => {
            if (closed) {
                return;
            }

            if (response instanceof Buffer) {
                callback(null, Buffer.from(response));
            } else if (response instanceof Error) {
                callback(response, Buffer.alloc(0));
            }
        });

        await flushPromises();
    };

    const instance = {
        write: vi.fn(async (_data: Buffer) => {
            await deliverNext();
        }),
        // biome-ignore lint/suspicious/useAwait: API
        writeRequestToSend: vi.fn(async (_level: boolean) => {
            if (closed) {
                throw new Error("closed");
            }
        }),
        // biome-ignore lint/suspicious/useAwait: API
        writeDataTerminalReady: vi.fn(async (_level: boolean) => {
            if (closed) {
                throw new Error("closed");
            }
        }),
        // biome-ignore lint/suspicious/useAwait: API
        close: vi.fn(async () => {
            closed = true;
        }),
    };

    return instance;
});

export const mockAvailablePorts = vi.fn((): AvailablePort[] => []);

vi.mock("@koenkk/serialport-napi-rs", () => ({
    NativeSerialPort: {
        open: mockNativeSerialPortOpen,
    },
    availablePorts: mockAvailablePorts,
}));

export const currentMockPort = () => {
    const port = mockNativeSerialPortOpen.mock.settledResults[0];

    if (port.type === "rejected") {
        throw new Error("Port failed to open");
    }

    return port.value;
};
