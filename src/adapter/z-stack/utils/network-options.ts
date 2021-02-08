import * as Models from "../../../models";
import {compareChannelLists} from "./channel-list";

export const compareNetworkOptions = (opts1: Models.NetworkOptions, opts2: Models.NetworkOptions): boolean => {
    return (
        opts1.panId === opts2.panId &&
        opts1.extendedPanId.equals(opts2.extendedPanId) &&
        opts1.networkKey.equals(opts2.networkKey) &&
        compareChannelLists(opts1.channelList, opts2.channelList) &&
        opts1.networkKeyDistribute === opts2.networkKeyDistribute
    );
};
