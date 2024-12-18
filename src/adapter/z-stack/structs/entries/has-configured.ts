/* eslint-disable @typescript-eslint/explicit-function-return-type */

import assert from 'node:assert';

import {Struct} from '../struct';

/**
 * Creates a zigbee-herdsman `hasConfigured` struct.
 *
 * @param data Data to initialize structure with.
 */
export const hasConfigured = (data?: Buffer | Buffer[]) => {
    assert(!Array.isArray(data));
    return Struct.new()
        .member('uint8', 'hasConfigured')
        .method('isConfigured', Boolean.prototype, (struct) => struct.hasConfigured === 0x55)
        .build(data);
};
