/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import {Struct} from "../struct";

/**
 * Security manager authentication options.
 * 
 * *Definition from Z-Stack 3.0.2 `ZDSecMgr.h.h`*
 */
export enum SecurityManagerAuthenticationOption {
    /* ZDSecMgr_Not_Authenticated */
    Default = 0x00,

    /* ZDSecMgr_Authenticated_CBCK */
    AuthenticatedCBCK = 0x01,

    /* ZDSecMgr_Authenticated_EA */
    AuthenticatedEA = 0x02
}

/**
 * Creates a security manager entry.
 * 
 * *Definition from Z-Stack 3.0.2 `ZDSecMgr.c`*
 * 
 * @param data Data to initialize structure with.
 */
export const securityManagerEntry = (data?: Buffer) => {
    return Struct.new()
        .member("uint16", "ami")
        .member("uint16", "keyNvId")
        .member("uint8", "authenticationOption")
        .default(Buffer.from("feff000000", "hex"))
        .build(data);
};
