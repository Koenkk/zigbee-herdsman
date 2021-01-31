/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import {Struct} from "./struct";

/**
 * Creates a Z2M `hasConfigured` struct.
 * 
 * @param data Data to initialize structure with.
 */
export const nvHasConfigured = Struct.new()
    .member("uint8", "hasConfigured")
    .method("isConfigured", Boolean.prototype, struct => struct.hasConfigured === 0x55)
    .factory();
