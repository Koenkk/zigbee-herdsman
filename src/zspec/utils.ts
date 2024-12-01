import {ALL_802_15_4_CHANNELS} from './consts';
import {BroadcastAddress} from './enums';

/**
 * Convert a channels array to a uint32 channel mask.
 * @param channels
 * @returns
 */
export const channelsToUInt32Mask = (channels: number[]): number => {
    return channels.reduce((a, c) => a + (1 << c), 0);
};

/**
 * Convert a uint32 channel mask to a channels array.
 * @param mask
 * @returns
 */
export const uint32MaskToChannels = (mask: number): number[] => {
    const channels: number[] = [];

    for (const channel of ALL_802_15_4_CHANNELS) {
        if ((2 ** channel) & mask) {
            channels.push(channel);
        }
    }

    return channels;
};

export const isBroadcastAddress = (address: number): boolean => {
    return (
        address === BroadcastAddress.DEFAULT ||
        address === BroadcastAddress.RX_ON_WHEN_IDLE ||
        address === BroadcastAddress.SLEEPY ||
        address === BroadcastAddress.LOW_POWER_ROUTERS
    );
};
