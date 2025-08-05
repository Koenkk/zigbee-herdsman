/**
 * Buffer-oriented structure representing network configuration.
 */
export interface NetworkOptions {
    panId: number;
    extendedPanId: Buffer<ArrayBuffer>;
    channelList: number[];
    networkKey: Buffer<ArrayBuffer>;
    networkKeyDistribute: boolean;
    hasDefaultExtendedPanId?: boolean;
}
