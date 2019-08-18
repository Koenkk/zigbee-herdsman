import Common from './common';

function getChannelMask(channels: number[]): number[] {
    let value = 0;

    for (const channel of channels) {
        for (const [key, logicalChannel] of Object.entries(Common.logicalChannels)) {
            if (logicalChannel === channel) {
                value = value | Common.channelMask[key];
            }
        }
    }

    return [value & 0xFF, (value >> 8) & 0xFF, (value >> 16) & 0xFF, (value >> 24) & 0xFF ];
}

export {
    getChannelMask,
};