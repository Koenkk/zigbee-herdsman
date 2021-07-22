/* eslint-disable max-len */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import {Table} from "../table";
import {SecurityManagerAuthenticationOption, securityManagerEntry} from "./security-manager-entry";
import {StructMemoryAlignment} from "../struct";

/**
 * Creates a security manager inline table present within Z-Stack NV memory.
 * 
 * @param data Data to initialize table with.
 * @param alignment Memory alignment of initialization data.
 */
export const securityManagerTable = 
    (dataOrCapacity?: Buffer | Buffer[] | number, alignment: StructMemoryAlignment = "unaligned") => {
        const table = Table.new<ReturnType<typeof securityManagerEntry>>()
            .struct(securityManagerEntry)
            .occupancy(e => ![0xfffe, 0xffff].includes(e.ami) && !(e.ami === 0x0000 && e.authenticationOption === SecurityManagerAuthenticationOption.Default))
            .inlineHeader();
        return typeof dataOrCapacity === "number" ?
            table.build(dataOrCapacity) :
            table.build(dataOrCapacity, alignment);
    };
