/* v8 ignore start */
//--------------------------------------------------------------
// Define macros for handling 3-bit frame numbers modulo 8

/** mask to frame number modulus */
export const mod8 = (n: number): number => n & 7;
/** increment in frame number modulus */
export const inc8 = (n: number): number => mod8(n + 1);
/** Return true if n is within the range lo through hi, computed (mod 8) */
export const withinRange = (lo: number, n: number, hi: number): boolean => mod8(n - lo) <= mod8(hi - lo);

//--------------------------------------------------------------
// CRC

/**
 * Calculates 16-bit cyclic redundancy code (CITT CRC 16).
 *
 * Applies the standard CITT CRC 16 polynomial to a
 * single byte. It should support being called first with an initial
 * value, then repeatedly until all data is processed.
 *
 * @param newByte     The new byte to be run through CRC.
 * @param prevResult  The previous CRC result.
 * @returns The new CRC result.
 */
export const halCommonCrc16 = (newByte: number, prevResult: number): number => {
    /*
     *    16bit CRC notes:
     *    "CRC-CCITT"
     *     poly is g(X) = X^16 + X^12 + X^5 + 1  (0x1021)
     *     used in the FPGA (green boards and 15.4)
     *     initial remainder should be 0xFFFF
     */
    prevResult = ((prevResult >> 8) & 0xffff) | ((prevResult << 8) & 0xffff);
    prevResult ^= newByte;
    prevResult ^= (prevResult & 0xff) >> 4;
    prevResult ^= (((prevResult << 8) & 0xffff) << 4) & 0xffff;

    prevResult ^= (((prevResult & 0xff) << 5) & 0xff) | (((((prevResult & 0xff) >> 3) & 0xffff) << 8) & 0xffff);

    return prevResult;
};

//--------------------------------------------------------------
// Byte manipulation

/** Returns the low bits of the 8-bit value 'n' as uint8_t. */
export const lowBits = (n: number): number => n & 0xf;
/** Returns the high bits of the 8-bit value 'n' as uint8_t. */
export const highBits = (n: number): number => lowBits(n >> 4) & 0xf;
/** Returns the low byte of the 16-bit value 'n' as uint8_t. */
export const lowByte = (n: number): number => n & 0xff;
/** Returns the high byte of the 16-bit value 'n' as uint8_t. */
export const highByte = (n: number): number => lowByte(n >> 8) & 0xff;
/** Returns the value built from the two uint8_t values high and low. */
export const highLowToInt = (high: number, low: number): number => ((high & 0xffff) << 8) + (low & 0xffff & 0xff);
/** Useful to reference a single bit of a byte. */
export const bit = (x: number): number => 1 << x;
/** Useful to reference a single bit of an uint32_t type. */
export const bit32 = (x: number): number => 1 << x;
/** Returns both the low and high bytes (in that order) of the same 16-bit value 'n' as uint8_t. */
export const lowHighBytes = (n: number): [number, highByte: number] => [lowByte(n), highByte(n)];
/** Returns both the low and high bits (in that order) of the same 8-bit value 'n' as uint8_t. */
export const lowHighBits = (n: number): [number, highBits: number] => [lowBits(n), highBits(n)];

/**
 * Get byte as an 8-bit string (`n` assumed of proper range).
 * @param n
 * @returns
 */
export const byteToBits = (n: number): string => {
    return (n >>> 0).toString(2).padStart(8, '0');
};
