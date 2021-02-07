/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import {Struct} from "../struct";

/**
 * Creates a network PAN ID struct.
 * 
 * @param data Data to initialize structure with.
 */
export const nwkPanId = (data?: Buffer) => Struct.new()
    .member("uint16", "panId")
    .build(data);
