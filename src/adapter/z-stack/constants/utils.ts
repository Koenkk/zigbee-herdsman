function getChannelMask(channels: number[]): number[] {
    const value = channels.reduce((mask, channel) => mask | (1 << channel), 0);

    return [value & 0xFF, (value >> 8) & 0xFF, (value >> 16) & 0xFF, (value >> 24) & 0xFF];
}

export {
    getChannelMask,
};