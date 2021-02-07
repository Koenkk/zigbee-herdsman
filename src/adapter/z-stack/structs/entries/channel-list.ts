/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import {Struct} from "../struct";

/**
 * Creates a channel list struct.
 * 
 * @param data Data to initialize structure with.
 */
export const channelList = (data?: Buffer) => Struct.new()
    .member("uint32", "channelList")
    .build(data);
