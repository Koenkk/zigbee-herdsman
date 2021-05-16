import {ZnpVersion} from "../adapter/z-stack/adapter/tstype";
import {NvSystemIds} from "../adapter/z-stack/constants/common";

type LegacyNvItemKey = 
    "ZCD_NV_EXTADDR" |
    "ZCD_NV_NIB" | 
    "ZCD_NV_PANID" | 
    "ZCD_NV_EXTENDED_PAN_ID" | 
    "ZCD_NV_NWK_ACTIVE_KEY_INFO" | 
    "ZCD_NV_NWK_ALTERN_KEY_INFO" | 
    "ZCD_NV_APS_USE_EXT_PANID" | 
    "ZCD_NV_PRECFGKEY" | 
    "ZCD_NV_PRECFGKEY_ENABLE" | 
    "ZCD_NV_CHANLIST" | 

    /* Z-Stack 3.0.x tables */
    "ZCD_NV_LEGACY_TCLK_TABLE_START" | 
    "ZCD_NV_LEGACY_NWK_SEC_MATERIAL_TABLE_START" |
    
    /* SimpleLink Z-Stack 3.x.0 tables */
    "ZCD_NV_EX_TCLK_TABLE" |
    "ZCD_NV_EX_NWK_SEC_MATERIAL_TABLE";

/**
 * Legacy backup format to allow for backup migration.
 */
export interface LegacyBackupStorage {
    adapterType: "zStack",
    time: string,
    meta: {
        product: ZnpVersion
    },
    data: {
        [key in LegacyNvItemKey]: {
            id: number;
            product: ZnpVersion;
            offset: number;
            osal: boolean;
            value: number[];
            len: number;

            /* System ID and Sub ID used in SimpleLink Z-Stack 3.x.0 */
            sysid?: NvSystemIds;
            subid?: number;
        };
    }
}
