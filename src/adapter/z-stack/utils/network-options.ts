/* eslint-disable max-len */
/* istanbul ignore file */

import * as Models from "../../../models";
import {compareChannelLists} from "./channel-list";

/**
 * Checks if two network options models match.
 * 
 * @param opts1 First network options struct to check.
 * @param opts2 Second network options struct to check.
 */
export const compareNetworkOptions = (opts1: Models.NetworkOptions, opts2: Models.NetworkOptions, lenientExtendedPanIdMatching?: boolean): boolean => {
    return (
        opts1.panId === opts2.panId &&
        (
            opts1.extendedPanId.equals(opts2.extendedPanId) ||
            (lenientExtendedPanIdMatching && (opts1.hasDefaultExtendedPanId || opts2.hasDefaultExtendedPanId)) ||
            (lenientExtendedPanIdMatching && (opts1.extendedPanId.equals(Buffer.from(opts2.extendedPanId).reverse())))
        ) &&
        opts1.networkKey.equals(opts2.networkKey) &&
        compareChannelLists(opts1.channelList, opts2.channelList) &&
        opts1.networkKeyDistribute === opts2.networkKeyDistribute
    );
};
