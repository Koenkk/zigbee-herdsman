/* eslint-disable @typescript-eslint/explicit-function-return-type */

import {Struct} from '../struct';

/**
 * Creates a network PAN ID struct.
 *
 * @param data Data to initialize structure with.
 */
export const nwkPanId = (data?: Buffer) => Struct.new().member('uint16', 'panId').build(data);
