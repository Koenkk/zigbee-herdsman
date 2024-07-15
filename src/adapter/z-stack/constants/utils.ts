import {ZnpCommandStatus} from './common';

function getChannelMask(channels: number[]): number[] {
    const value = channels.reduce((mask, channel) => mask | (1 << channel), 0);

    return [value & 0xff, (value >> 8) & 0xff, (value >> 16) & 0xff, (value >> 24) & 0xff];
}

function statusDescription(code: ZnpCommandStatus): string {
    const hex = '0x' + code.toString(16).padStart(2, '0');
    return `(${hex}: ${ZnpCommandStatus[code] || 'UNKNOWN'})`;
}

export {getChannelMask, statusDescription};
