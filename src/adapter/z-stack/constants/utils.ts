import {ZnpCommandStatus} from './common';

function getChannelMask(channels: number[]): number[] {
    const value = channels.reduce((mask, channel) => mask | (1 << channel), 0);

    return [value & 0xFF, (value >> 8) & 0xFF, (value >> 16) & 0xFF, (value >> 24) & 0xFF];
}

function statusDescription(code: ZnpCommandStatus): string {
    const hex = "0x" + code.toString(16).padStart(2, "0");
    return `(${hex}: ${ZnpCommandStatus[code] || "UNKNOWN"})`;
}

export {
    getChannelMask,
    statusDescription
};
