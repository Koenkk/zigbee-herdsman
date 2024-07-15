export const uint16To8Array = (n: number): number[] => {
    return [n & 0xff, (n >> 8) & 0xff];
};

export const uint32To8Array = (n: number): number[] => {
    return [n & 0xff, (n >> 8) & 0xff, (n >> 16) & 0xff, (n >> 24) & 0xff];
};
