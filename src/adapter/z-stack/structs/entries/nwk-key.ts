import assert from "node:assert";

import {Struct} from "../struct";

/**
 * Creates a network key struct.
 *
 * @param data Data to initialize structure with.
 */
export const nwkKey = (data?: Buffer<ArrayBuffer> | Buffer<ArrayBuffer>[]) => {
    assert(!Array.isArray(data));
    return Struct.new().member("uint8array", "key", 16).build(data);
};
