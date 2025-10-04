import {tzScan} from "@date-fns/tz";
import type {TClusterAttributes} from "../zspec/zcl/definition/clusters-types";

const OneJanuary2000 = new Date("January 01, 2000 00:00:00 UTC+00:00").getTime();
const OneDayInMilliseconds = 24 * 60 * 60 * 1000;

const cachedTimeData: Pick<TClusterAttributes<"genTime">, "timeZone" | "dstStart" | "dstEnd" | "dstShift" | "validUntilTime"> = {
    timeZone: 0,
    dstStart: 0,
    dstEnd: 0,
    dstShift: 0,
    validUntilTime: 0,
};

function timestampToZigbeeUtcTime(timestamp: number) {
    return timestamp === 0xffffffff ? timestamp : Math.round((timestamp - OneJanuary2000) / 1000);
}

function recalculateTimeData(currentDate: Date) {
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
            // tzScan returns the first second on which a new shift has to be applied.
            // This is fine for dstStart, but dstEnd has to be the last second of the
            // DST period. Otherwise, the following equation copied from the ZCL spec
            // isn't met anymore:
            //
            // Local Time = Standard Time + DstShift (if DstStart <= Time <= DstEnd)
            //
            // Therefore, we have to remove one second on all dstEnd times below.
            dstEnd = dstChangesThisYear[1].date.getTime() - 1000;
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
                    dstEnd = dstChangesThisYear[0].date.getTime() - 1000;
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
                    dstEnd = dstChangesNextYear[0].date.getTime() - 1000;
                    dstShift = dstChangesThisYear[1].change * 60;
                }
            }
        }
    }

    cachedTimeData.timeZone = timeZoneDifferenceToUtc;
    cachedTimeData.dstStart = timestampToZigbeeUtcTime(dstStart);
    cachedTimeData.dstEnd = timestampToZigbeeUtcTime(dstEnd);
    cachedTimeData.dstShift = dstShift;
    cachedTimeData.validUntilTime = timestampToZigbeeUtcTime(validUntilTime);
}

export function getTimeClusterAttributes(): TClusterAttributes<"genTime"> {
    const currentDate = new Date();
    const currentTime = timestampToZigbeeUtcTime(currentDate.getTime());

    if (currentTime >= cachedTimeData.validUntilTime) {
        recalculateTimeData(currentDate);
    }

    const standardTime = currentTime + cachedTimeData.timeZone;
    let localTime = standardTime;

    if (currentTime >= cachedTimeData.dstStart && currentTime <= cachedTimeData.dstEnd) {
        localTime = standardTime + cachedTimeData.dstShift;
    }

    return {
        time: currentTime,
        // Bit 0: Master clock
        // Bit 1: Synchronized
        // Bit 2: Master for Time Zone and DST
        // Bit 3: Time synchronization SHOULD be superseded
        timeStatus: 0x1111,
        timeZone: cachedTimeData.timeZone,
        dstStart: cachedTimeData.dstStart,
        dstEnd: cachedTimeData.dstEnd,
        dstShift: cachedTimeData.dstShift,
        standardTime: standardTime,
        localTime: localTime,
        lastSetTime: currentTime,
        validUntilTime: cachedTimeData.validUntilTime,
    };
}

/** used by tests */
export function clearCachedTimeData() {
    cachedTimeData.timeZone = 0;
    cachedTimeData.dstStart = 0;
    cachedTimeData.dstEnd = 0;
    cachedTimeData.dstShift = 0;
    cachedTimeData.validUntilTime = 0;
}
