/* eslint-disable @typescript-eslint/explicit-function-return-type */

import assert from 'node:assert';

import {Struct} from '../struct';

/**
 * Creates a Security Service Provider (SSP) Network Descriptor struct.
 *
 * *Definition from Z-Stack 3.0.2 `ssp.h`*
 *
 * @param data Data to initialize structure with.
 */
export const nwkKeyDescriptor = (data?: Buffer | Buffer[]) => {
    assert(!Array.isArray(data));
    return Struct.new().member('uint8', 'keySeqNum').member('uint8array', 'key', 16).build(data);
};
