import {tzScan} from "@date-fns/tz";

interface TimeCluster {
    time: number;
    timeStatus: number;
    timeZone: number;
    dstStart: number;
    dstEnd: number;
    dstShift: number;
    standardTime: number;
    localTime: number;
    lastSetTime: number;
    validUntilTime: number;
}

interface CachedTimeData {
    timeZone: number;
    timeZoneInMilliseconds: number;
    dstStart: number;
    dstEnd: number;
    dstShift: number;
    dstShiftInMilliseconds: number;
    lastSetTime: number;
    validUntilTime: number;
}

const OneJanuary2000 = new Date("January 01, 2000 00:00:00 UTC+00:00").getTime();
const OneDayInMilliseconds = 24 * 60 * 60 * 1000;

let cachedTimeData: CachedTimeData = <CachedTimeData>{};

function timestampToZigbeeUtcTime(timestamp: number) {
    if (timestamp === 0xffffffff) {
        return timestamp;
    }

    return Math.round((timestamp - OneJanuary2000) / 1000);
}

function zigbeeUtcTimeToTimestamp(zigbeeTime: number) {
    return zigbeeTime * 1000 + OneJanuary2000;
}

export function clearCachedTimeData() {
    cachedTimeData = <CachedTimeData>{};
}

function cachedTimeDataIsValid(): boolean {
    return timestampToZigbeeUtcTime(Date.now()) < cachedTimeData.validUntilTime;
}

export function getTimeCluster(): TimeCluster {
    if (!cachedTimeDataIsValid()) {
        recalculateTimeData();
    }

    const currentTime = Date.now();
    const standardTime = currentTime + cachedTimeData.timeZoneInMilliseconds;
    let localTime = standardTime;

    // tzScan provides the first second where the change is being applied, not
    // the last second before the change (as assumed in the ZCL documentation).
    const dstActive =
        currentTime >= zigbeeUtcTimeToTimestamp(cachedTimeData.dstStart) &&
        currentTime < zigbeeUtcTimeToTimestamp(cachedTimeData.dstEnd);
    if (dstActive) {
        localTime = standardTime + cachedTimeData.dstShiftInMilliseconds;
    }

    return {
        time: timestampToZigbeeUtcTime(currentTime),
        timeStatus: 3,
        timeZone: cachedTimeData.timeZone,
        dstStart: cachedTimeData.dstStart,
        dstEnd: cachedTimeData.dstEnd,
        dstShift: cachedTimeData.dstShift,
        standardTime: timestampToZigbeeUtcTime(standardTime),
        localTime: timestampToZigbeeUtcTime(localTime),
        lastSetTime: cachedTimeData.lastSetTime,
        validUntilTime: cachedTimeData.validUntilTime,
    };
}

function recalculateTimeData() {
    const currentTime = Date.now();
    const currentDate = new Date(currentTime);
    const currentYear = currentDate.getUTCFullYear();

    // Default values considering the timezone has no DST
    let timeZoneDifferenceToUtc = currentDate.getTimezoneOffset() !== 0 ? currentDate.getTimezoneOffset() * -1 * 60 : 0;
    let dstStart = 0xffffffff;
    let dstEnd = 0xffffffff;
    let dstChange = 0;
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
        const firstDstChangeOfTheYear = dstChangesThisYear[0];
        const localTime = currentTime + timeZoneDifferenceToUtc * 1000;

        const isNorthernHemisphere = firstDstChangeOfTheYear.change > 0;
        if (isNorthernHemisphere) {
            timeZoneDifferenceToUtc = dstChangesThisYear[1].offset * 60;
            dstStart = dstChangesThisYear[0].date.getTime();
            dstEnd = dstChangesThisYear[1].date.getTime();
            dstChange = dstChangesThisYear[0].change * 60;
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
                    dstChange = dstChangesLastYear[1].change * 60;
                }
            } else {
                const dstChangesNextYear = tzScan(localTimeZone, {
                    start: new Date(currentYear + 1, 1),
                    end: new Date(currentYear + 1, 12),
                });

                const hasRegularDstNextYear = dstChangesThisYear.length === 2;
                if (hasRegularDstNextYear) {
                    timeZoneDifferenceToUtc = dstChangesNextYear[0].offset * 60;
                    dstStart = dstChangesThisYear[1].date.getTime();
                    dstEnd = dstChangesNextYear[0].date.getTime();
                    dstChange = dstChangesThisYear[1].change * 60;
                }
            }
        }
    }

    cachedTimeData = {
        timeZone: timeZoneDifferenceToUtc,
        timeZoneInMilliseconds: timeZoneDifferenceToUtc * 1000,
        dstStart: timestampToZigbeeUtcTime(dstStart),
        dstEnd: timestampToZigbeeUtcTime(dstEnd),
        dstShift: dstChange,
        dstShiftInMilliseconds: dstChange * 1000,
        lastSetTime: timestampToZigbeeUtcTime(currentTime),
        validUntilTime: timestampToZigbeeUtcTime(validUntilTime),
    };
}
