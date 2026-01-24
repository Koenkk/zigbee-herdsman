import {vi} from "vitest";

// prevents udev triggers from `Adapter.create` doing discovery (massive slowdown on some systems)
vi.mock("@serialport/bindings-cpp", async (importOriginal) => ({
    ...(await importOriginal()),
    autoDetect: vi.fn(() => ({
        list: vi.fn().mockResolvedValue([]),
    })),
}));
