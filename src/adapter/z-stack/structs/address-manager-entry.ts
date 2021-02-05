/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import {Struct} from "./struct";

/**
 * Address manager entry flags present in `user` field.
 * 
 * *Definition from Z-Stack 3.0.2 `ADdrMgr.h`*
 */
export enum AddressManagerUser {
    /* ADDRMGR_USER_DEFAULT */
    Default = 0x00,

    /* ADDRMGR_USER_ASSOC */
    Assoc = 0x01,

    /* ADDRMGR_USER_SECURITY */
    Security = 0x02,

    /* ADDRMGR_USER_BINDING */
    Binding = 0x04,

    /* ADDRMGR_USER_PRIVATE1 */
    Private1 = 0x08
}


/**
 * Creates an address manager entry.
 * 
 * *Definition from Z-Stack 3.0.2 `AddrMgr.h`*
 * *The `uint16` index field is not physically present.*
 * 
 * @param data Data to initialize structure with.
 */
export const addressManagerEntry = (data?: Buffer) => {
    return Struct.new()
        .member("uint8", "user")
        .member("uint16", "nwkAddr")
        .member("uint8array-reversed", "extAddr", 8)
        .padding(0xff)
        .build(data);
};
