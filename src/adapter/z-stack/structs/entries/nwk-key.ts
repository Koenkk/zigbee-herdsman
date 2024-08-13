/* eslint-disable @typescript-eslint/explicit-function-return-type */
import {Struct} from '../struct';

/**
 * Creates a network key struct.
 *
 * @param data Data to initialize structure with.
 */
export const nwkKey = (data?: Buffer) => Struct.new().member('uint8array', 'key', 16).build(data);
