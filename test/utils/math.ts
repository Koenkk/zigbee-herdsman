export const uint16To8Array = (n: number): number[] => {
    return [n & 0xff, (n >> 8) & 0xff];
};

export const uint32To8Array = (n: number): number[] => {
    return [n & 0xff, (n >> 8) & 0xff, (n >> 16) & 0xff, (n >> 24) & 0xff];
};

export const uint56To8Array = (n: bigint): number[] => {
    return [
        Number(n & 0xffn),
        Number(n >> 8n) & 0xff,
        Number(n >> 16n) & 0xff,
        Number(n >> 24n) & 0xff,
        Number(n >> 32n) & 0xff,
        Number(n >> 40n) & 0xff,
        Number(n >> 48n) & 0xff,
    ];
};
