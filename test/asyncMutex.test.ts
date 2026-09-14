import {describe, expect, it, vi} from "vitest";
import {AsyncMutex} from "../src/utils/async-mutex";
import {Queue} from "../src/utils/queue";

function deferred<T>() {
    let resolve!: (value: T) => void;
    let reject!: (error: Error) => void;
    const promise = new Promise<T>((res, rej) => {
        resolve = res;
        reject = rej;
    });
    return {promise, resolve, reject};
}

describe("AsyncMutex cancellation", () => {
    it("rejects all pending calls without running them or releasing the active lock", async () => {
        const mutex = new AsyncMutex();
        const holder = deferred<string>();
        const active = mutex.run(() => holder.promise);
        const cancelled = vi.fn();
        const errors: Error[] = [];
        const pending = [mutex.run(cancelled), mutex.run(cancelled)].map((promise) => promise.catch((error: Error) => errors.push(error)));

        mutex.clear();
        mutex.clear();
        expect(mutex.count).toBe(0);
        const next = vi.fn().mockResolvedValue("next");
        const nextResult = mutex.run(next);
        await Promise.resolve();
        await Promise.resolve();
        expect(errors).toEqual([new Error("Mutex cleared"), new Error("Mutex cleared")]);
        expect(errors[0]).not.toBe(errors[1]);
        expect(cancelled).not.toHaveBeenCalled();
        expect(next).not.toHaveBeenCalled();

        holder.resolve("active");
        await expect(active).resolves.toBe("active");
        await Promise.all(pending);
        await expect(nextResult).resolves.toBe("next");
        mutex.clear();
        await expect(mutex.run(() => Promise.resolve("reused"))).resolves.toBe("reused");
    });

    it("releases a cancelled job's keyed queue slot", async () => {
        const mutex = new AsyncMutex();
        const queue = new Queue(4);
        const holder = deferred<void>();
        const active = mutex.run(() => holder.promise);
        const cancelled = vi.fn();
        const errors: Error[] = [];
        const pending = queue.execute(() => mutex.run(cancelled), "deviceA").catch((error: Error) => errors.push(error));
        expect(mutex.count).toBe(1);
        mutex.clear();
        holder.resolve();
        await active;

        const deviceA = vi.fn().mockResolvedValue("A");
        const nextA = queue.execute(() => mutex.run(deviceA), "deviceA");
        await expect(queue.execute(() => mutex.run(() => Promise.resolve("B")), "deviceB")).resolves.toBe("B");
        expect(errors).toEqual([new Error("Mutex cleared")]);
        await pending;
        await expect(nextA).resolves.toBe("A");
        expect(cancelled).not.toHaveBeenCalled();
        expect(queue.count()).toBe(0);
    });

    it("keeps ownership during handoff and releases it after a callback rejects", async () => {
        const mutex = new AsyncMutex();
        const holder = deferred<void>();
        const nextHolder = deferred<void>();
        const active = mutex.run(() => holder.promise);
        const next = mutex.run(() => nextHolder.promise);
        const nextError = expect(next).rejects.toThrow("callback failed");
        const last = vi.fn().mockResolvedValue("last");
        let lastResult!: Promise<string>;
        // This continuation runs after the holder's finally, before the next acquisition resumes.
        void holder.promise.then(() => {
            lastResult = mutex.run(last);
        });
        holder.resolve();
        await active;
        expect(last).not.toHaveBeenCalled();
        nextHolder.reject(new Error("callback failed"));
        await nextError;
        await expect(lastResult).resolves.toBe("last");
    });
});
