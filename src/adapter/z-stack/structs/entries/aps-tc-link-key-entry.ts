/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import {Struct} from "../struct";

/**
 * Creates a APS ME Trust Center Link Key NV Entry struct.
 * 
 * *Definition from Z-Stack 3.0.2 `APSMEDE.h`*
 * 
 * @param data Data to initialize structure with.
 */
export const apsTcLinkKeyEntry = (data?: Buffer) => {
    return Struct.new()
        .member("uint32", "txFrmCntr")
        .member("uint32", "rxFrmCntr")
        .member("uint8array-reversed", "extAddr", 8)
        .member("uint8", "keyAttributes")
        .member("uint8", "keyType")
        .member("uint8", "SeedShift_IcIndex")
        .build(data);
};
