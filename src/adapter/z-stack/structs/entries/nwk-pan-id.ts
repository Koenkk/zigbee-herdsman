import {Struct} from "../struct";

/**
 * Creates a network PAN ID struct.
 *
 * @param data Data to initialize structure with.
 */
export const nwkPanId = (data?: Buffer<ArrayBuffer>) => Struct.new().member("uint16", "panId").build(data);
