/* eslint-disable max-len */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import {addressManagerEntry, addressManagerEntry3x} from "./address-manager-entry";
import {Table} from "../table";
import {StructMemoryAlignment} from "../struct";

const tableBase = Table.new<ReturnType<typeof addressManagerEntry>>().occupancy(e => e.isSet() as boolean);

/**
 * Creates an address manager inline table present within Z-Stack NV memory for Z-Stack 1.2 and 3.0.
 * 
 * @param data Data to initialize table with.
 * @param alignment Memory alignment of initialization data.
 */
export const addressManagerTable = (dataOrCapacity?: Buffer | Buffer[] | number, alignment: StructMemoryAlignment = "unaligned") => {
    const table = tableBase.struct(addressManagerEntry);
    return typeof dataOrCapacity === "number" ? table.build(dataOrCapacity) : table.build(dataOrCapacity, alignment);
};

/**
 * Creates an address manager inline table present within Z-Stack NV memory for Z-Stack 3.x.0 and newer.
 * There is a difference in empty entry notation between Z-Stack 1.2, 3.0 and 3.x.0 and newer.
 * 
 * @param data Data to initialize table with.
 * @param alignment Memory alignment of initialization data.
 */
export const addressManagerTable3x = (dataOrCapacity?: Buffer | Buffer[] | number, alignment: StructMemoryAlignment = "unaligned") => {
    const table = tableBase.struct(addressManagerEntry3x);
    return typeof dataOrCapacity === "number" ? table.build(dataOrCapacity) : table.build(dataOrCapacity, alignment);
};
