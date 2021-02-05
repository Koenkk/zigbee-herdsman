/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import {addressManagerEntry} from "./address-manager-entry";
import {InlineTable} from "./inline-table";
import {StructMemoryAlignment} from "./struct";

const emptyAddress1 = Buffer.alloc(8, 0xff);
const emptyAddress2 = Buffer.alloc(8, 0xff);

/**
 * Creates an address manager inline table present within Z-Stack NV memory.
 * 
 * @param data Data to initialize table with.
 * @param alignment Memory alignment of initialization data.
 */
export const addressManagerTable =
    (dataOrCapacity?: Buffer | number, alignment: StructMemoryAlignment = "unaligned") => {
        const table = InlineTable.new<ReturnType<typeof addressManagerEntry>>()
            .struct(addressManagerEntry)
            .occupancy(e => e.user !== 0x00 && !e.extAddr.equals(emptyAddress1) && !e.extAddr.equals(emptyAddress2));
        return typeof dataOrCapacity === "number" ?
            table.build(dataOrCapacity) :
            table.build(dataOrCapacity, alignment);
    };
