import * as Zcl from "../zspec/zcl";

/**
 * Workaround for devices that require a specific manufacturer code to be reported by coordinator while interviewing...
 * - Lumi/Aqara devices do not work properly otherwise (missing features): https://github.com/Koenkk/zigbee2mqtt/issues/9274
 */
export const WORKAROUND_JOIN_MANUF_IEEE_PREFIX_TO_CODE: {[ieeePrefix: string]: Zcl.ManufacturerCode} = {
    // NOTE: Lumi has a new prefix registered since 2021, in case they start using that one with new devices, it might need to be added here too...
    //       "0x18c23c" https://maclookup.app/vendors/lumi-united-technology-co-ltd
    "0x54ef44": Zcl.ManufacturerCode.LUMI_UNITED_TECHOLOGY_LTD_SHENZHEN,
    "0x04cf8c": Zcl.ManufacturerCode.LUMI_UNITED_TECHOLOGY_LTD_SHENZHEN,
};
