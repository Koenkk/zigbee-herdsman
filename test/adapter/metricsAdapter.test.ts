import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";
import type {Adapter} from "../../src/adapter/adapter.js";
import {wrapWithMetrics} from "../../src/adapter/metricsAdapter.js";
import {metrics} from "../../src/utils/metrics.js";

function makeMockAdapter(overrides: Partial<Record<string, (...args: unknown[]) => unknown>> = {}): Adapter {
    return {
        sendZclFrameToEndpoint: vi.fn().mockResolvedValue(undefined),
        sendZdo: vi.fn().mockResolvedValue(undefined),
        sendZclFrameToGroup: vi.fn().mockResolvedValue(undefined),
        sendZclFrameToAll: vi.fn().mockResolvedValue(undefined),
        someOtherMethod: vi.fn().mockReturnValue(42),
        someProperty: "prop-value",
        ...overrides,
    } as unknown as Adapter;
}

describe("wrapWithMetrics", () => {
    let emitSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        emitSpy = vi.spyOn(metrics, "emit");
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("proxies non-dispatch methods and properties directly", () => {
        const adapter = makeMockAdapter();
        const wrapped = wrapWithMetrics(adapter);

        // @ts-expect-error test property access
        expect(wrapped.someProperty).toBe("prop-value");
        // @ts-expect-error test method access
        expect(wrapped.someOtherMethod()).toBe(42);
    });

    describe("sendZclFrameToEndpoint", () => {
        it("emits adapterSendZclUnicast on success", async () => {
            const adapter = makeMockAdapter();
            const wrapped = wrapWithMetrics(adapter);

            await wrapped.sendZclFrameToEndpoint("0x1234", 1, 1, {} as never, 10000);

            expect(emitSpy).toHaveBeenCalledWith("adapterSendZclUnicast", expect.objectContaining({ieeeAddr: "0x1234", status: "success"}));
        });

        it("emits adapterSendZclUnicast on failure and re-throws", async () => {
            const error = new Error("send failed");
            const adapter = makeMockAdapter({sendZclFrameToEndpoint: vi.fn().mockRejectedValue(error)});
            const wrapped = wrapWithMetrics(adapter);

            await expect(wrapped.sendZclFrameToEndpoint("0x1234", 1, 1, {} as never, 10000)).rejects.toThrow("send failed");
            expect(emitSpy).toHaveBeenCalledWith("adapterSendZclUnicast", expect.objectContaining({ieeeAddr: "0x1234", status: "failure"}));
        });
    });

    describe("sendZdo", () => {
        it("emits adapterSendZdo on success", async () => {
            const adapter = makeMockAdapter();
            const wrapped = wrapWithMetrics(adapter);

            await wrapped.sendZdo("0xabcd", 0, 5 as never, {} as never);

            expect(emitSpy).toHaveBeenCalledWith("adapterSendZdo", expect.objectContaining({ieeeAddr: "0xabcd", clusterId: 5, status: "success"}));
        });

        it("emits adapterSendZdo on failure and re-throws", async () => {
            const error = new Error("zdo failed");
            const adapter = makeMockAdapter({sendZdo: vi.fn().mockRejectedValue(error)});
            const wrapped = wrapWithMetrics(adapter);

            await expect(wrapped.sendZdo("0xabcd", 0, 5 as never, {} as never)).rejects.toThrow("zdo failed");
            expect(emitSpy).toHaveBeenCalledWith("adapterSendZdo", expect.objectContaining({ieeeAddr: "0xabcd", clusterId: 5, status: "failure"}));
        });
    });

    describe("sendZclFrameToGroup", () => {
        it("emits adapterSendZclGroup on success", async () => {
            const adapter = makeMockAdapter();
            const wrapped = wrapWithMetrics(adapter);

            await wrapped.sendZclFrameToGroup(7, {} as never);

            expect(emitSpy).toHaveBeenCalledWith("adapterSendZclGroup", expect.objectContaining({groupId: 7, status: "success"}));
        });

        it("emits adapterSendZclGroup on failure and re-throws", async () => {
            const error = new Error("group failed");
            const adapter = makeMockAdapter({sendZclFrameToGroup: vi.fn().mockRejectedValue(error)});
            const wrapped = wrapWithMetrics(adapter);

            await expect(wrapped.sendZclFrameToGroup(7, {} as never)).rejects.toThrow("group failed");
            expect(emitSpy).toHaveBeenCalledWith("adapterSendZclGroup", expect.objectContaining({groupId: 7, status: "failure"}));
        });
    });

    describe("sendZclFrameToAll", () => {
        it("emits adapterSendZclBroadcast on success", async () => {
            const adapter = makeMockAdapter();
            const wrapped = wrapWithMetrics(adapter);

            await wrapped.sendZclFrameToAll(1, {} as never, 1, 260);

            expect(emitSpy).toHaveBeenCalledWith("adapterSendZclBroadcast", expect.objectContaining({status: "success"}));
        });

        it("emits adapterSendZclBroadcast on failure and re-throws", async () => {
            const error = new Error("broadcast failed");
            const adapter = makeMockAdapter({sendZclFrameToAll: vi.fn().mockRejectedValue(error)});
            const wrapped = wrapWithMetrics(adapter);

            await expect(wrapped.sendZclFrameToAll(1, {} as never, 1, 260)).rejects.toThrow("broadcast failed");
            expect(emitSpy).toHaveBeenCalledWith("adapterSendZclBroadcast", expect.objectContaining({status: "failure"}));
        });
    });
});
