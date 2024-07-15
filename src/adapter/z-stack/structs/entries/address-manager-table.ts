/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import {StructMemoryAlignment} from '../struct';
import {Table} from '../table';
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import {addressManagerEntry} from './address-manager-entry';

/**
 * Creates an address manager inline table present within Z-Stack NV memory.
 *
 * @param data Data to initialize table with.
 * @param alignment Memory alignment of initialization data.
 */
export const addressManagerTable = (dataOrCapacity?: Buffer | Buffer[] | number, alignment: StructMemoryAlignment = 'unaligned') => {
    const table = Table.new<ReturnType<typeof addressManagerEntry>>()
        .struct(addressManagerEntry)
        .occupancy((e) => e.isSet() as boolean);
    return typeof dataOrCapacity === 'number' ? table.build(dataOrCapacity) : table.build(dataOrCapacity, alignment);
};
