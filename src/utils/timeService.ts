import {tzScan} from "@date-fns/tz";
import type {TClusterAttributes} from "../zspec/zcl/definition/clusters-types";

interface CachedTimeData {
    timeZoneDifferenceToUtc: number;
    dstStart: number;
    dstEnd: number;
    dstShift: number;
    lastSetTime: number;
    validUntilTime: number;
}

const OneJanuary2000 = new Date("January 01, 2000 00:00:00 UTC+00:00").getTime();
const OneDayInMilliseconds = 24 * 60 * 60 * 1000;

let cachedTimeData = <CachedTimeData>{};

function timestampToZigbeeUtcTime(timestamp: number) {
    if (timestamp === 0xffffffff) {
        return timestamp;
    }

    return Math.round((timestamp - OneJanuary2000) / 1000);
}

export function clearCachedTimeData() {
    cachedTimeData = <CachedTimeData>{};
}

export function getTimeClusterAttributes(): TClusterAttributes<"genTime"> {
    const currentTime = timestampToZigbeeUtcTime(Date.now());

    const cachedTimeDataIsValid = currentTime < cachedTimeData.validUntilTime;
    if (!cachedTimeDataIsValid) {
        recalculateTimeData();
    }

    const standardTime = currentTime + cachedTimeData.timeZoneDifferenceToUtc;
    let localTime = standardTime;

    // tzScan returns the first second the change has to be applied.
    // Therefore, we have to use >= for the dstStart comparison and
    // not for the dstEnd comparison.
    if (currentTime >= cachedTimeData.dstStart && currentTime < cachedTimeData.dstEnd) {
        localTime = standardTime + cachedTimeData.dstShift;
    }

    return {
        time: currentTime,
        timeStatus: 3,
        timeZone: cachedTimeData.timeZoneDifferenceToUtc,
        dstStart: cachedTimeData.dstStart,
        dstEnd: cachedTimeData.dstEnd,
        dstShift: cachedTimeData.dstShift,
        standardTime: standardTime,
        localTime: localTime,
        lastSetTime: cachedTimeData.lastSetTime,
        validUntilTime: cachedTimeData.validUntilTime,
    };
}

function recalculateTimeData() {
    const currentDate = new Date();
    const currentTime = currentDate.getTime();
    const currentYear = currentDate.getUTCFullYear();

    // Default values considering the timezone has no DST
    let timeZoneDifferenceToUtc = currentDate.getTimezoneOffset() !== 0 ? currentDate.getTimezoneOffset() * -1 * 60 : 0;
    let dstStart = 0xffffffff;
    let dstEnd = 0xffffffff;
    let dstShift = 0;
    const validUntilTime = currentTime + OneDayInMilliseconds;

    const localTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const dstChangesThisYear = tzScan(localTimeZone, {
        start: new Date(currentYear, 1),
        end: new Date(currentYear, 12),
    });

    // Countries may leave/introduce DST, which isn't supported here.
    // Therefore, we always have to check that the returned number
    // of changes is exactly 2.
    const hasRegularDst = dstChangesThisYear.length === 2;
    if (hasRegularDst) {
        const isNorthernHemisphere = dstChangesThisYear[0].change > 0;
        if (isNorthernHemisphere) {
            timeZoneDifferenceToUtc = dstChangesThisYear[1].offset * 60;
            dstStart = dstChangesThisYear[0].date.getTime();
            dstEnd = dstChangesThisYear[1].date.getTime();
            dstShift = dstChangesThisYear[0].change * 60;
        } else {
            const dstStartIsInPreviousYear = currentTime < dstChangesThisYear[0].date.getTime();
            if (dstStartIsInPreviousYear) {
                const dstChangesLastYear = tzScan(localTimeZone, {
                    start: new Date(currentYear - 1, 1),
                    end: new Date(currentYear - 1, 12),
                });

                const hadRegularDstLastYear = dstChangesLastYear.length === 2;
                if (hadRegularDstLastYear) {
                    timeZoneDifferenceToUtc = dstChangesThisYear[0].offset * 60;
                    dstStart = dstChangesLastYear[1].date.getTime();
                    dstEnd = dstChangesThisYear[0].date.getTime();
                    dstShift = dstChangesLastYear[1].change * 60;
                }
            } else {
                const dstChangesNextYear = tzScan(localTimeZone, {
                    start: new Date(currentYear + 1, 1),
                    end: new Date(currentYear + 1, 12),
                });

                const hasRegularDstNextYear = dstChangesThisYear.length === 2;
                if (hasRegularDstNextYear) {
                    timeZoneDifferenceToUtc = dstChangesThisYear[0].offset * 60;
                    dstStart = dstChangesThisYear[1].date.getTime();
                    dstEnd = dstChangesNextYear[0].date.getTime();
                    dstShift = dstChangesThisYear[1].change * 60;
                }
            }
        }
    }

    cachedTimeData = {
        timeZoneDifferenceToUtc: timeZoneDifferenceToUtc,
        dstStart: timestampToZigbeeUtcTime(dstStart),
        dstEnd: timestampToZigbeeUtcTime(dstEnd),
        dstShift: dstShift,
        lastSetTime: timestampToZigbeeUtcTime(currentTime),
        validUntilTime: timestampToZigbeeUtcTime(validUntilTime),
    };
}
