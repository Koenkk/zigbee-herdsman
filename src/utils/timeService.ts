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

const OneJanuary2000 = new Date("January 01, 2000 00:00:00 UTC+00:00").getTime();

let cachedTimeCluster: TimeCluster = <TimeCluster>{};

function toZigbeeUtcTime(timestamp: number) {
    if (timestamp === 0xffffffff) {
        return timestamp;
    }

    return Math.round((timestamp - OneJanuary2000) / 1000);
}

function isCachedTimeClusterValid(): boolean {
    return toZigbeeUtcTime(Date.now()) < cachedTimeCluster.validUntilTime;
}

export function getTimeCluster(): TimeCluster {
    if (!isCachedTimeClusterValid()) {
        calculateTimeCluster();
    }

    return cachedTimeCluster;
}

export function destroyTimeCache() {
    cachedTimeCluster = <TimeCluster>{};
}

function calculateTimeCluster() {
    const currentTime = Date.now();
    const currentDate = new Date(currentTime);
    const currentYear = currentDate.getUTCFullYear();

    // Default values considering the timezone has no DST
    let timeZoneDifferenceToUtc = currentDate.getTimezoneOffset() !== 0 ? currentDate.getTimezoneOffset() * -1 * 60 : 0;
    let dstStart = 0xffffffff;
    let dstEnd = 0xffffffff;
    let dstChange = 0;
    const standardTime = currentTime + timeZoneDifferenceToUtc * 1000;
    let localTime = standardTime;

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

        const isNorthernHemisphere = firstDstChangeOfTheYear.change > 0;
        if (isNorthernHemisphere) {
            timeZoneDifferenceToUtc = dstChangesThisYear[1].offset * 60;
            dstStart = dstChangesThisYear[0].date.getTime();
            dstEnd = dstChangesThisYear[1].date.getTime();
            dstChange = dstChangesThisYear[0].change * 60;
        } else {
            const dstStartIsInPreviousYear = localTime < dstChangesThisYear[0].date.getTime();
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

        const dstActive = localTime > dstStart && localTime < dstEnd;
        if (dstActive) {
            localTime = standardTime + dstChange * 1000;
        }
    }

    cachedTimeCluster = {
        time: toZigbeeUtcTime(currentTime),
        timeStatus: 3, // Time-master + synchronised
        timeZone: timeZoneDifferenceToUtc,
        dstStart: toZigbeeUtcTime(dstStart),
        dstEnd: toZigbeeUtcTime(dstEnd),
        dstShift: dstChange,
        standardTime: toZigbeeUtcTime(standardTime),
        localTime: toZigbeeUtcTime(localTime),
        lastSetTime: toZigbeeUtcTime(currentTime),
        validUntilTime: toZigbeeUtcTime(currentTime) + 24 * 60 * 60, // valid for 24 hours
    };
}
