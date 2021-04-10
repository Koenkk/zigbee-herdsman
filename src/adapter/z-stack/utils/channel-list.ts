/**
 * Converts packed `uint32` channel list to array of channel numbers.
 * 
 * @param packedList Packed channel list value.
 */
export const unpackChannelList = (packedList: number): number[] => {
    return Array(26 - 11 + 1).fill(0).map((_, i) => 11 + i).filter(c => ((1 << c) & packedList) > 0);
};

/**
 * Converts array of channel numbers to packed `uint32` structure represented as number.
 * Supported channel range is 11 - 29.
 * 
 * @param channelList List of channels to be packed.
 */
export const packChannelList = (channelList: number[]): number => {
    const invalidChannel = channelList.find(c => c < 11 || c > 26);
    /* istanbul ignore next */
    if (invalidChannel !== undefined) {
        throw new Error(`Cannot pack channel list - unsupported channel ${invalidChannel}`);
    }
    return channelList.reduce((a, c) => a + (1 << c) ,0);
};

/**
 * Compares two channel lists. Either number arrays or packed `uint32` numbers may be provided.
 * 
 * @param list1 First list to compare.
 * @param list2 Second list to compare.
 */
export const compareChannelLists = (list1: number | number[], list2: number | number[]): boolean => {
    /* istanbul ignore next */
    list1 = Array.isArray(list1) ? packChannelList(list1) : list1;
    list2 = Array.isArray(list2) ? packChannelList(list2) : list2;
    return list1 === list2;
};
