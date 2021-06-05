/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import {Table} from "../table";
import {StructMemoryAlignment} from "../struct";
import {apsTcLinkKeyEntry} from "./aps-tc-link-key-entry";

const emptyAddress = Buffer.alloc(8, 0x00);

/**
 * Creates an APS trust center link key data table.
 * 
 * @param data Data to initialize table with.
 * @param alignment Memory alignment of initialization data.
 */
export const apsTcLinkKeyTable =
    (dataOrCapacity?: Buffer | Buffer[] | number, alignment: StructMemoryAlignment = "unaligned") => {
        const table = Table.new<ReturnType<typeof apsTcLinkKeyEntry>>()
            .struct(apsTcLinkKeyEntry)
            .occupancy(e => !e.extAddr.equals(emptyAddress));
        return typeof dataOrCapacity === "number" ?
            table.build(dataOrCapacity) :
            table.build(dataOrCapacity, alignment);
    };
