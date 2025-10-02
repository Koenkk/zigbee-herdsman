import {afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi} from "vitest";
import * as timeService from "../src/utils/timeService";

describe("TimeService", () => {
    beforeAll(() => {
        vi.useFakeTimers();
    });

    afterAll(() => {
        vi.useRealTimers();
    });

    beforeEach(() => {
        timeService.clearCachedTimeData();
    });

    afterEach(() => {
        vi.unstubAllEnvs();
    });

    it.each([
        {
            testCase: "Timezone without DST",
            timeZone: "Atlantic/Reykjavik",
            localTime: "Wed Oct 01 2025 17:06:08 GMT+0000 (Greenwich Mean Time)",
            expectedTime: 812653568,
            expectedTimeZone: 0,
            expectedDstStart: 0xffffffff,
            expectedDstEnd: 0xffffffff,
            expectedDstShift: 0,
            expectedStandardTime: 812653568,
            expectedLocalTime: 812653568,
        },
        {
            testCase: "Northern Hemisphere, timezone with DST, DST active",
            timeZone: "Europe/Berlin",
            localTime: "Wed Oct 01 2025 18:49:34 GMT+0200 (Central European Summer Time)",
            expectedTime: 812652574,
            expectedTimeZone: 3600,
            expectedDstStart: 796611600,
            expectedDstEnd: 814755600,
            expectedDstShift: 3600,
            expectedStandardTime: 812656174,
            expectedLocalTime: 812659774,
        },
        {
            testCase: "Northern Hemisphere, timezone with DST, DST inactive",
            timeZone: "Europe/Berlin",
            localTime: "Mon Mar 02 2026 19:04:12 GMT+0100 (Central European Standard Time)",
            expectedTime: 825789852,
            expectedTimeZone: 3600,
            expectedDstStart: 828061200,
            expectedDstEnd: 846205200,
            expectedDstShift: 3600,
            expectedStandardTime: 825793452,
            expectedLocalTime: 825793452,
        },
        {
            testCase: "Southern Hemisphere, timezone with DST, DST inactive",
            timeZone: "Australia/Sydney",
            localTime: "Thu Oct 02 2025 03:03:25 GMT+1000 (Australian Eastern Standard Time)",
            expectedTime: 812653405,
            expectedTimeZone: 36000,
            expectedDstStart: 812908800,
            expectedDstEnd: 828633600,
            expectedDstShift: 3600,
            expectedStandardTime: 812689405,
            expectedLocalTime: 812689405,
        },
        {
            testCase: "Southern Hemisphere, timezone with DST, DST active with start in current year",
            timeZone: "Australia/Sydney",
            localTime: "Mon Nov 03 2025 03:07:49 GMT+1100 (Australian Eastern Daylight Time)",
            expectedTime: 815414869,
            expectedTimeZone: 36000,
            expectedDstStart: 812908800,
            expectedDstEnd: 828633600,
            expectedDstShift: 3600,
            expectedStandardTime: 815450869,
            expectedLocalTime: 815454469,
        },
        {
            testCase: "Southern Hemisphere, timezone with DST, DST active with start in previous year",
            timeZone: "Australia/Sydney",
            localTime: "Mon Jan 19 2026 03:08:11 GMT+1100 (Australian Eastern Daylight Time)",
            expectedTime: 822067691,
            expectedTimeZone: 36000,
            expectedDstStart: 812908800,
            expectedDstEnd: 828633600,
            expectedDstShift: 3600,
            expectedStandardTime: 822103691,
            expectedLocalTime: 822107291,
        },
    ])(
        "Should work correctly for specific dates ($testCase)",
        ({
            timeZone,
            localTime,
            expectedTime,
            expectedTimeZone,
            expectedDstStart,
            expectedDstEnd,
            expectedDstShift,
            expectedStandardTime,
            expectedLocalTime,
        }) => {
            vi.stubEnv("TZ", timeZone);
            vi.setSystemTime(new Date(localTime));

            const timeCluster = timeService.getTimeClusterAttributes();

            expect(timeCluster.time).toBe(expectedTime);
            expect(timeCluster.timeStatus).toBe(3);
            expect(timeCluster.timeZone).toBe(expectedTimeZone);
            expect(timeCluster.dstStart).toBe(expectedDstStart);
            expect(timeCluster.dstEnd).toBe(expectedDstEnd);
            expect(timeCluster.dstShift).toBe(expectedDstShift);
            expect(timeCluster.standardTime).toBe(expectedStandardTime);
            expect(timeCluster.localTime).toBe(expectedLocalTime);
            expect(timeCluster.lastSetTime).toBe(expectedTime);
            expect(timeCluster.validUntilTime).toBe(expectedTime + 24 * 60 * 60);
        },
    );

    it.each([
        {
            testCase: "begins (Europe/Berlin)",
            timeZone: "Europe/Berlin",
            localTime: "Sun Mar 30 2025 01:59:59 GMT+0100 (Central European Standard Time)",
            expectedShiftBefore: 0,
            expectedShiftAfter: 3600,
        },
        {
            testCase: "ends (Europe/Berlin)",
            timeZone: "Europe/Berlin",
            localTime: "Sun Oct 26 2025 02:59:59 GMT+0200 (Central European Summer Time)",
            expectedShiftBefore: 3600,
            expectedShiftAfter: 0,
        },
        {
            testCase: "begins (Australia/Sydney)",
            timeZone: "Australia/Sydney",
            localTime: "Sun Oct 5 2025 01:59:59 GMT+1000 (Australian Eastern Standard Time)",
            expectedShiftBefore: 0,
            expectedShiftAfter: 3600,
        },
        {
            testCase: "ends (Australia/Sydney)",
            timeZone: "Australia/Sydney",
            localTime: "Sun Apr 05 2026 02:59:59 GMT+1100 (Australian Eastern Daylight Time)",
            expectedShiftBefore: 3600,
            expectedShiftAfter: 0,
        },
    ])("Should handle daylight saving time $testCase correctly", ({timeZone, localTime, expectedShiftBefore, expectedShiftAfter}) => {
        vi.stubEnv("TZ", timeZone);
        vi.setSystemTime(Date.parse(localTime));

        const firstRun = timeService.getTimeClusterAttributes();

        vi.advanceTimersByTime(1000);

        const secondRun = timeService.getTimeClusterAttributes();

        expect(firstRun.localTime - firstRun.standardTime).toBe(expectedShiftBefore);
        expect(secondRun.localTime - secondRun.standardTime).toBe(expectedShiftAfter);
    });

    it("Should not use cached data for dynamic attributes", () => {
        vi.stubEnv("TZ", "Europe/Berlin");
        vi.setSystemTime(new Date(2025, 0));

        const firstRun = timeService.getTimeClusterAttributes();

        // 1 hour
        const delta = 60 * 60;
        vi.advanceTimersByTime(delta * 1000);

        const secondRun = timeService.getTimeClusterAttributes();

        expect(secondRun.time).toBe(firstRun.time + delta);
        expect(secondRun.standardTime).toBe(firstRun.standardTime + delta);
        expect(secondRun.localTime).toBe(firstRun.localTime + delta);
    });

    it("Should return cached information within 24 hours", () => {
        vi.stubEnv("TZ", "Europe/Berlin");
        vi.setSystemTime(new Date(2025, 0));

        const firstRun = timeService.getTimeClusterAttributes();

        // 23 hours
        vi.advanceTimersByTime(23 * 60 * 60 * 1000);

        const secondRun = timeService.getTimeClusterAttributes();

        expect(secondRun.lastSetTime).toBe(firstRun.lastSetTime);
    });

    it("Should recalculate the cache after 24 hours", () => {
        vi.stubEnv("TZ", "Europe/Berlin");
        vi.setSystemTime(new Date(2025, 0));

        const firstRun = timeService.getTimeClusterAttributes();

        // 24 hours
        vi.advanceTimersByTime(24 * 60 * 60 * 1000);

        const secondRun = timeService.getTimeClusterAttributes();

        expect(secondRun.lastSetTime).not.toBe(firstRun.lastSetTime);
    });
});
