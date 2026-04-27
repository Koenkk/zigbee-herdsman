import {type SendStatus, metrics} from "../utils/metrics.js";
import type {Adapter} from "./adapter.js";

type AnyAsyncFn = (...args: unknown[]) => Promise<unknown>;

function instrumentSend(fn: AnyAsyncFn, record: (args: unknown[], status: SendStatus, durationSeconds: number) => void): AnyAsyncFn {
    return async (...args) => {
        const start = Date.now();
        try {
            const result = await fn(...args);
            record(args, "success", (Date.now() - start) / 1000);
            return result;
        } catch (e) {
            record(args, "failure", (Date.now() - start) / 1000);
            throw e;
        }
    };
}

// biome-ignore lint/suspicious/noExplicitAny: cast needed to bridge typed adapter methods to generic AnyAsyncFn
function asFn(fn: (...args: any[]) => Promise<any>): AnyAsyncFn {
    return fn as AnyAsyncFn;
}

export function wrapWithMetrics(adapter: Adapter): Adapter {
    const dispatch = new Map<string, AnyAsyncFn>([
        [
            "sendZclFrameToEndpoint",
            instrumentSend(asFn(adapter.sendZclFrameToEndpoint.bind(adapter)), ([ieeeAddr], status, durationSeconds) =>
                metrics.emit("adapterSendZclUnicast", {ieeeAddr: ieeeAddr as string, status, durationSeconds}),
            ),
        ],
        [
            "sendZdo",
            instrumentSend(asFn(adapter.sendZdo.bind(adapter)), ([ieeeAddr, , clusterId], status, durationSeconds) =>
                metrics.emit("adapterSendZdo", {ieeeAddr: ieeeAddr as string, clusterId: clusterId as number, status, durationSeconds}),
            ),
        ],
        [
            "sendZclFrameToGroup",
            instrumentSend(asFn(adapter.sendZclFrameToGroup.bind(adapter)), ([groupId], status, durationSeconds) =>
                metrics.emit("adapterSendZclGroup", {groupId: groupId as number, status, durationSeconds}),
            ),
        ],
        [
            "sendZclFrameToAll",
            instrumentSend(asFn(adapter.sendZclFrameToAll.bind(adapter)), (_args, status, durationSeconds) =>
                metrics.emit("adapterSendZclBroadcast", {status, durationSeconds}),
            ),
        ],
    ]);

    return new Proxy(adapter, {
        get(target, prop) {
            if (typeof prop === "string" && dispatch.has(prop)) {
                return dispatch.get(prop);
            }
            const value = Reflect.get(target, prop, target);
            return typeof value === "function" ? (value as (...args: never) => unknown).bind(target) : value;
        },
    });
}
