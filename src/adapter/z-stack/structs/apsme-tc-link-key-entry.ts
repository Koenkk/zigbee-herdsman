/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import {Struct} from "./struct";

/**
 * Creates a APS ME Trust Center Link Key NV Entry struct.
 * 
 * *Definition from Z-Stack 3.0.2 `APSMEDE.h`*
 * 
 * @param data Data to initialize structure with.
 */
export const apsmeTcLinkKeyEntry = (data?: Buffer) => {
    if (data && data.length === 20) {
        data = data.slice(0, 19);
    }
    return Struct.new()
        .member("uint32", "txFrmCntr")
        .member("uint32", "rxFrmCntr")
        .member("uint8array-reversed", "extAddr", 8)
        .member("uint8", "keyAttributes")
        .member("uint8", "keyType")
        .member("uint8", "SeedShift_IcIndex")
        .method("getUnaligned", Buffer.prototype, struct => struct.getRaw())
        .method("getAligned", Buffer.prototype, struct => {
            return Buffer.concat([struct.getRaw(), Buffer.from([0x00])]);
        })
        .build(data);
};
