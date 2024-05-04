import {ALL_802_15_4_CHANNELS} from "./consts";
import {BroadcastAddress} from "./enums";

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
    return ALL_802_15_4_CHANNELS.map((c: number) => ((2 ** c) & mask) ? c : null).filter((x) => x);
};

export const isBroadcastAddress = (address: number): boolean => {
    return address === BroadcastAddress.DEFAULT || address === BroadcastAddress.RX_ON_WHEN_IDLE
        || address === BroadcastAddress.SLEEPY || address === BroadcastAddress.LOW_POWER_ROUTERS;
};
