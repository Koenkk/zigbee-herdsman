import {describe, expect, it, vi} from "vitest";
import {checkInstallCode} from "../src/controller/helpers/installCodes";
import {Queue, Utils, Waitress, wait} from "../src/utils";
import {logger, setLogger} from "../src/utils/logger";

const mockLogger = {
    debug: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
    error: vi.fn(),
};

describe("Utils", () => {
    it("Is Number Array", () => {
        expect(Utils.isNumberArray([1, 2, 3])).toBeTruthy();
        expect(Utils.isNumberArray([1, 2, "3"])).toBeFalsy();
        expect(Utils.isNumberArray("nonarray")).toBeFalsy();
    });

    it("Is Number Array of length", () => {
        expect(Utils.isNumberArrayOfLength([1, 2, 3], 3)).toBeTruthy();
        expect(Utils.isNumberArrayOfLength([1, 2], 3)).toBeFalsy();
        expect(Utils.isNumberArrayOfLength([1, 2, "3"], 3)).toBeFalsy();
        expect(Utils.isNumberArrayOfLength("nonarray", 3)).toBeFalsy();
    });

    it("Is object empty", () => {
        expect(Utils.isObjectEmpty({})).toBeTruthy();
        expect(Utils.isObjectEmpty({a: 1})).toBeFalsy();
    });

    it("Assert string", () => {
        expect(Utils.assertString("bla")).toBeUndefined();

        expect(() => {
            Utils.assertString(1);
        }).toThrow("Input must be a string!");
    });

    it("Test wait", () => {
        const setTimeoutSpy = vi.spyOn(globalThis, "setTimeout").mockImplementationOnce(
            // @ts-expect-error mocked
            () => {},
        );
        wait(1000).then(() => {});
        expect(setTimeout).toHaveBeenCalledTimes(1);
        expect(setTimeout).toHaveBeenLastCalledWith(expect.any(Function), 1000);
        setTimeoutSpy.mockRestore();
    });

    it("Test waitress", async () => {
        vi.useFakeTimers();
        const validator = (payload: string, matcher: number): boolean => {
            if (payload === "one" && matcher === 1) return true;
            if (payload === "two" && matcher === 2) return true;
            return false;
        };
        const waitress = new Waitress<string, number>(validator, (_, timeout) => `Timedout '${timeout}'`);

        const wait1 = waitress.waitFor(1, 10000).start();
        waitress.resolve("one");
        expect(await wait1.promise).toBe("one");

        const wait2_1 = waitress.waitFor(2, 10000).start();
        const wait2_2 = waitress.waitFor(2, 10000).start();
        const wait2_3 = waitress.waitFor(2, 10000).start();
        const wait2_4 = waitress.waitFor(2, 5000).start();
        const wait2_5 = waitress.waitFor(2, 5000).start();

        waitress.remove(wait2_3.ID);
        vi.advanceTimersByTime(6000);
        waitress.remove(wait2_5.ID);
        waitress.resolve("two");
        expect(await wait2_1.promise).toBe("two");
        expect(await wait2_2.promise).toBe("two");

        let error2;
        try {
            await wait2_4.promise;
        } catch (e) {
            error2 = e;
        }
        expect(error2).toStrictEqual(new Error("Timedout '5000'"));

        let error3;
        try {
            await wait2_5.promise;
        } catch (e) {
            error3 = e;
        }
        expect(error3).toStrictEqual(new Error("Timedout '5000'"));

        vi.useRealTimers();

        // reject test
        const wait1b = waitress.waitFor(1, 5000).start();
        let error1_;
        wait(1000).then(() => {
            waitress.reject("one", "drop");
        });
        try {
            await wait1b.promise;
        } catch (e) {
            error1_ = e;
        }
        expect(error1_).toStrictEqual(new Error("drop"));

        vi.useFakeTimers();
        const wait2 = waitress.waitFor(2, 5000).start();
        const handled1 = waitress.reject("tree", "drop");
        expect(handled1).toBe(false);
        let error2_;
        vi.advanceTimersByTime(6000);
        try {
            await wait2.promise;
        } catch (e) {
            error2_ = e;
        }
        expect(error2_).toStrictEqual(new Error("Timedout '5000'"));
        const handled2 = waitress.reject("two", "drop");
        expect(handled2).toBe(false);

        waitress.waitFor(2, 10000).start().promise;
        waitress.waitFor(2, 10000).start().promise;

        await vi.advanceTimersByTimeAsync(2000);
        waitress.clear();
        await vi.advanceTimersByTimeAsync(12000);

        // @ts-expect-error private
        expect(waitress.waiters.size).toStrictEqual(0);

        vi.useRealTimers();
    });

    it("Test queue", async () => {
        const queue = new Queue(4);
        const finished: number[] = [];

        let job1Promise: (() => void) | undefined;
        let job2Promise: (() => void) | undefined;
        const job1 = new Promise<void>((resolve) => {
            job1Promise = resolve;
        });
        const job2 = new Promise<void>((resolve) => {
            job2Promise = resolve;
        });
        const job5 = new Promise((_resolve) => {});
        const job6 = new Promise((_resolve) => {});
        const job7 = new Promise((_resolve) => {});

        const job1Result = queue.execute<string>(async () => {
            await job1;
            finished.push(1);
            return "finished";
        });

        const job2Result = queue.execute<void>(async () => {
            await job2;
            finished.push(2);
        }, "mykey");

        queue.execute<void>(async () => {
            finished.push(3);
            await Promise.resolve();
        }, "mykey");

        queue.execute<void>(async () => {
            finished.push(4);
            await Promise.resolve();
        }, "mykey2");

        queue.execute<void>(async () => {
            await job5;
            finished.push(5);
        });

        queue.execute<void>(async () => {
            await job6;
            finished.push(6);
        });

        queue.execute<void>(async () => {
            await job7;
            finished.push(7);
        });

        queue.execute<void>(async () => {
            finished.push(8);
            await Promise.resolve();
        });

        expect(finished).toEqual([4]);
        job1Promise?.();
        expect(await job1Result).toBe("finished");
        await job1Result;
        expect(finished).toEqual([4, 1]);
        job2Promise?.();
        await job2Result;
        expect(finished).toEqual([4, 1, 2, 3]);
        expect(queue.count()).toBe(5);
    });

    it("Logs", () => {
        const debugSpy = vi.spyOn(console, "debug");
        const infoSpy = vi.spyOn(console, "info");
        const warningSpy = vi.spyOn(console, "warn");
        const errorSpy = vi.spyOn(console, "error");
        logger.debug("debug", "zh");
        expect(debugSpy).toHaveBeenCalledWith(expect.stringMatching(/^\[\d\d\d\d-\d\d-\d\dT\d\d:\d\d:\d\d.\d\d\dZ\] zh: debug$/));
        logger.info("info", "zh");
        expect(infoSpy).toHaveBeenCalledWith(expect.stringMatching(/^\[\d\d\d\d-\d\d-\d\dT\d\d:\d\d:\d\d.\d\d\dZ\] zh: info$/));
        logger.warning("warning", "zh");
        expect(warningSpy).toHaveBeenCalledWith(expect.stringMatching(/^\[\d\d\d\d-\d\d-\d\dT\d\d:\d\d:\d\d.\d\d\dZ\] zh: warning$/));
        logger.error("error", "zh");
        expect(errorSpy).toHaveBeenCalledWith(expect.stringMatching(/^\[\d\d\d\d-\d\d-\d\dT\d\d:\d\d:\d\d.\d\d\dZ\] zh: error$/));

        setLogger(mockLogger);
        expect(logger).toEqual(mockLogger);
        logger.debug("debug", "zh");
        expect(mockLogger.debug).toHaveBeenCalledWith("debug", "zh");
        logger.info("info", "zh");
        expect(mockLogger.info).toHaveBeenCalledWith("info", "zh");
        logger.warning("warning", "zh");
        expect(mockLogger.warning).toHaveBeenCalledWith("warning", "zh");
        logger.error("error", "zh");
        expect(mockLogger.error).toHaveBeenCalledWith("error", "zh");
    });

    it("Checks install codes of all lengths", () => {
        expect(() => checkInstallCode(Buffer.from("001122", "hex"))).toThrow("Install code 001122 has invalid size");

        const code8Valid = Buffer.from("83FED3407A932B70", "hex");
        const code8Invalid = Buffer.from("FFFED3407A939723", "hex");
        const code8InvalidFixed = Buffer.from("FFFED3407A93DE84", "hex");
        const code8MissingCRC = Buffer.from("83FED3407A93", "hex");

        expect(checkInstallCode(code8Valid)).toStrictEqual([code8Valid, undefined]);
        expect(checkInstallCode(code8Invalid)).toStrictEqual([code8InvalidFixed, "invalid CRC"]);
        expect(() => checkInstallCode(code8Invalid, false)).toThrow(`Install code ${code8Invalid.toString("hex")} failed CRC validation`);
        expect(checkInstallCode(code8MissingCRC)).toStrictEqual([code8Valid, "missing CRC"]);
        expect(() => checkInstallCode(code8MissingCRC, false)).toThrow(`Install code ${code8MissingCRC.toString("hex")} failed CRC validation`);

        const code10Valid = Buffer.from("83FED3407A93972397FC", "hex");
        const code10Invalid = Buffer.from("FFFED3407A939723A5C6", "hex");
        const code10InvalidFixed = Buffer.from("FFFED3407A9397238C4F", "hex");
        // consired as 8-length with invalid CRC
        const code10MissingCRC = Buffer.from("83FED3407A939723", "hex");
        const code10MissingCRCFixed = Buffer.from("83FED3407A932B70", "hex");

        expect(checkInstallCode(code10Valid)).toStrictEqual([code10Valid, undefined]);
        expect(checkInstallCode(code10Invalid)).toStrictEqual([code10InvalidFixed, "invalid CRC"]);
        expect(() => checkInstallCode(code10Invalid, false)).toThrow(`Install code ${code10Invalid.toString("hex")} failed CRC validation`);
        expect(checkInstallCode(code10MissingCRC)).toStrictEqual([code10MissingCRCFixed, "invalid CRC"]);
        expect(() => checkInstallCode(code10MissingCRC, false)).toThrow(`Install code ${code10MissingCRC.toString("hex")} failed CRC validation`);

        const code14Valid = Buffer.from("83FED3407A939723A5C639FF4C12", "hex");
        const code14Invalid = Buffer.from("FFFED3407A939723A5C639FF4C12", "hex");
        const code14InvalidFixed = Buffer.from("FFFED3407A939723A5C639FFDE74", "hex");
        const code14MissingCRC = Buffer.from("83FED3407A939723A5C639FF", "hex");

        expect(checkInstallCode(code14Valid)).toStrictEqual([code14Valid, undefined]);
        expect(checkInstallCode(code14Invalid)).toStrictEqual([code14InvalidFixed, "invalid CRC"]);
        expect(() => checkInstallCode(code14Invalid, false)).toThrow(`Install code ${code14Invalid.toString("hex")} failed CRC validation`);
        expect(checkInstallCode(code14MissingCRC)).toStrictEqual([code14Valid, "missing CRC"]);
        expect(() => checkInstallCode(code14MissingCRC, false)).toThrow(`Install code ${code14MissingCRC.toString("hex")} failed CRC validation`);

        const code18Valid = Buffer.from("83FED3407A939723A5C639B26916D505C3B5", "hex");
        const code18Invalid = Buffer.from("FFFED3407A939723A5C639B26916D505C3B5", "hex");
        const code18InvalidFixed = Buffer.from("FFFED3407A939723A5C639B26916D505EEB1", "hex");
        const code18MissingCRC = Buffer.from("83FED3407A939723A5C639B26916D505", "hex");

        expect(checkInstallCode(code18Valid)).toStrictEqual([code18Valid, undefined]);
        expect(checkInstallCode(code18Invalid)).toStrictEqual([code18InvalidFixed, "invalid CRC"]);
        expect(() => checkInstallCode(code18Invalid, false)).toThrow(`Install code ${code18Invalid.toString("hex")} failed CRC validation`);
        expect(checkInstallCode(code18MissingCRC)).toStrictEqual([code18Valid, "missing CRC"]);
        expect(() => checkInstallCode(code18MissingCRC, false)).toThrow(`Install code ${code18MissingCRC.toString("hex")} failed CRC validation`);
    });
});
