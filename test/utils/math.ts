export const uint16To8Array = (n: number): number[] => {
    return [n & 0xFF, (n >> 8) & 0xFF];
};

export const uint32To8Array = (n: number): number[] => {
    return [n & 0xFF, (n >> 8) & 0xFF, (n >> 16) & 0xFF, (n >> 24) & 0xFF];
};
