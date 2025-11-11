/**
 * @param value 64-bit bigint
 * @returns 16-length hex string in big-endian
 */
export function bigUInt64ToHexBE(value: bigint): string {
    return value.toString(16).padStart(16, "0");
}

/**
 * @param value 64-bit bigint
 * @returns 8-bytelength buffer in little-endian
 */
export function bigUInt64ToBufferLE(value: bigint): Buffer {
    const b = Buffer.allocUnsafe(8);
    b.writeBigUInt64LE(value, 0);
    return b;
}

/**
 * @param value 64-bit bigint
 * @returns 8-bytelength buffer in big-endian
 */
export function bigUInt64ToBufferBE(value: bigint): Buffer {
    const b = Buffer.allocUnsafe(8);
    b.writeBigUInt64BE(value, 0);
    return b;
}
