/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import {Table} from "../table";
import {StructMemoryAlignment} from "../struct";
import {apsLinkKeyDataEntry} from "./aps-link-key-data-entry";

const emptyKey = Buffer.alloc(16, 0x00);

/**
 * Creates an APS link key data table.
 * 
 * @param data Data to initialize table with.
 * @param alignment Memory alignment of initialization data.
 */
export const apsLinkKeyDataTable =
    (dataOrCapacity?: Buffer | Buffer[] | number, alignment: StructMemoryAlignment = "unaligned") => {
        const table = Table.new<ReturnType<typeof apsLinkKeyDataEntry>>()
            .struct(apsLinkKeyDataEntry)
            .occupancy(e => !e.key.equals(emptyKey));
        return typeof dataOrCapacity === "number" ?
            table.build(dataOrCapacity) :
            table.build(dataOrCapacity, alignment);
    };
