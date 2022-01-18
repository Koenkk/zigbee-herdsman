/* eslint-disable max-len */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import Debug from "debug";
import {AdapterNvMemory} from "./adapter-nv-memory";
import * as Structs from "../structs";
import {ZnpVersion} from "./tstype";
import {NvItemsIds, NvSystemIds} from "../constants/common";

const debug = Debug("zigbee-herdsman:adapter:zStack:startup:fixup");

/**
 * Fixup function to repair broken address manager table in NV memory
 * causing network to fail to accept new devices in pairing process.
 * Issue is based on the difference between empty address manager entry structure
 * which hasn't been identified (or has been overseen) during the complete
 * rewrite of the adapter provisioning and configuration management process.
 * 
 * Z-Stack 1.2 and 3.0 uses `0x00` as empty address manager table entry user attribute
 * while Z-Stack 3.x.0 and newer use `0xff` as empty address manager table entry
 * user attribute.
 * 
 * `More details can be found on the issues and PRs below:`
 * * https://github.com/Koenkk/zigbee2mqtt/issues/9117
 * * https://github.com/zigpy/zigpy-znp/pull/92
 * 
 * @param version ZNP version.
 * @param nv NVRAM driver instance.
 */
export const fixupAddressManagerTablePostZstack12Migration = async (version: ZnpVersion, nv: AdapterNvMemory) => {
    const emptyExtAddr1 = Buffer.alloc(8, 0x00);
    const emptyExtAddr2 = Buffer.alloc(8, 0xff);

    /* read the entire address manager table */
    debug(`(#9117) verifying address manager table for post-migration corruption`);
    let table: ReturnType<typeof Structs.addressManagerTable>;
    if (version === ZnpVersion.zStack3x0) {
        table = await nv.readTable("extended", NvSystemIds.ZSTACK, NvItemsIds.ZCD_NV_EX_ADDRMGR, undefined, Structs.addressManagerTable3x);
    } else {
        table = await nv.readItem(NvItemsIds.ADDRMGR, 0, Structs.addressManagerTable);
    }

    /* identify corrupt entries and fix them if necessary */
    let changed = 0;
    for (const entry of table.entries) {
        if (version === ZnpVersion.zStack3x0 && (entry.extAddr.equals(emptyExtAddr1) || entry.extAddr.equals(emptyExtAddr2)) && entry.user === 0x00) {
            entry.user = 0xff;
            entry.extAddr = emptyExtAddr2;
            entry.nwkAddr = 0xffff;
            changed++;
        }
    }

    /* write fixed address manager tables if any changes were made */
    if (changed > 0) {
        debug(`(#9117) writing fixed address manager table with ${changed} updated entries`);
        if (version === ZnpVersion.zStack3x0) {
            await nv.writeTable("extended", NvSystemIds.ZSTACK, NvItemsIds.ZCD_NV_EX_ADDRMGR, table);
        } else {
            await nv.writeItem(NvItemsIds.ADDRMGR, table);
        }
    } else {
        debug(`(#9117) everything is ok - no corrupted address manager table entries found`);
    }
};
