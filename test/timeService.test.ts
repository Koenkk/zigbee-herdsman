import {afterAll, beforeAll, beforeEach, describe, expect, it, vi} from "vitest";
import * as timeService from "../src/utils/timeService";

describe("TimeService", () => {
    beforeAll(() => {
        vi.useFakeTimers();
    });

    afterAll(() => {
        vi.unstubAllEnvs();
        vi.useRealTimers();
    });

    beforeEach(() => {
        timeService.destroyTimeCache();
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
            expectedStandardTime: 812659774,
            expectedLocalTime: 812663374,
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
            expectedStandardTime: 815454469,
            expectedLocalTime: 815458069,
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
            expectedStandardTime: 822107291,
            expectedLocalTime: 822110891,
        },
    ])(
        "Should process daylight saving time correctly for $testCase",
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
            vi.setSystemTime(new Date(localTime));
            vi.stubEnv("TZ", timeZone);

            const timeCluster = timeService.getTimeCluster();

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

    it("Should return cached time cluster", () => {
        const firstRun = timeService.getTimeCluster();

        // 23 hours
        vi.advanceTimersByTime(23 * 60 * 60 * 1000);

        const secondRun = timeService.getTimeCluster();

        expect(secondRun).toBe(firstRun);
    });

    it("Should recalculate after expiry", () => {
        const firstRun = timeService.getTimeCluster();

        // 24 hours
        vi.advanceTimersByTime(24 * 60 * 60 * 1000);

        const secondRun = timeService.getTimeCluster();

        expect(secondRun).not.toBe(firstRun);
    });
});
