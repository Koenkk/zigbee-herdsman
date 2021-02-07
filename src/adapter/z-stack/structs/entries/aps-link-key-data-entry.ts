/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import {Struct} from "../struct";

/**
 * Creates a APS Link Key Data Entry.
 * 
 * *Definition from Z-Stack 3.0.2 `APSMEDE.h`*
 * 
 * @param data Data to initialize structure with.
 */
export const apsLinkKeyDataEntry = (data?: Buffer) => {
    return Struct.new()
        .member("uint8array", "key", 16)
        .member("uint32", "txFrmCntr")
        .member("uint32", "rxFrmCntr")
        .build(data);
};
