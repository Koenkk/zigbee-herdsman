import type {EUI64} from './tstypes';

import {createCipheriv} from 'node:crypto';

import {AES_MMO_128_BLOCK_SIZE, ALL_802_15_4_CHANNELS, INSTALL_CODE_CRC_SIZE, INSTALL_CODE_SIZES} from './consts';
import {BroadcastAddress} from './enums';

/**
 * Convert a channels array to a uint32 channel mask.
 * @param channels
 * @returns
 */
export const channelsToUInt32Mask = (channels: number[]): number => {
    return channels.reduce((a, c) => a + (1 << c), 0);
};

/**
 * Convert a uint32 channel mask to a channels array.
 * @param mask
 * @returns
 */
export const uint32MaskToChannels = (mask: number): number[] => {
    const channels: number[] = [];

    for (const channel of ALL_802_15_4_CHANNELS) {
        if ((2 ** channel) & mask) {
            channels.push(channel);
        }
    }

    return channels;
};

export const isBroadcastAddress = (address: number): boolean => {
    return (
        address === BroadcastAddress.DEFAULT ||
        address === BroadcastAddress.RX_ON_WHEN_IDLE ||
        address === BroadcastAddress.SLEEPY ||
        address === BroadcastAddress.LOW_POWER_ROUTERS
    );
};

/**
 * Represent a little endian buffer in `0x...` form
 *
 * NOTE: the buffer is always copied to avoid reversal in reference
 */
export const eui64LEBufferToHex = (eui64LEBuf: Buffer): EUI64 => `0x${Buffer.from(eui64LEBuf).reverse().toString('hex')}`;

/**
 * Represent a big endian buffer in `0x...` form
 */
export const eui64BEBufferToHex = (eui64BEBuf: Buffer): EUI64 => `0x${eui64BEBuf.toString('hex')}`;

/**
 * Calculate the CRC 8, 16 or 32 for the given data.
 *
 * @see https://www.crccalc.com/
 *
 * @param data
 * @param length CRC Length
 * @param poly Polynomial
 * @param crc Initialization value
 * @param xorOut Final XOR value
 * @param refIn Reflected In
 * @param refOut Reflected Out
 * @returns The calculated CRC
 *
 * NOTE: This is not exported for test coverage reasons (large number of combinations possible, many unused).
 *       Specific, needed, algorithms should be defined as exported wrappers below, and coverage added for them.
 */
function calcCRC(
    data: number[] | Uint8Array | Buffer,
    length: 8 | 16 | 32,
    poly: number,
    crc: number = 0,
    xorOut: number = 0,
    refIn: boolean = false,
    refOut: boolean = false,
): number {
    // https://web.archive.org/web/20150226083354/http://leetcode.com/2011/08/reverse-bits.html
    const reflect = (x: number, size: 8 | 16 | 32): number => {
        if (size === 8) {
            x = ((x & 0x55) << 1) | ((x & 0xaa) >> 1);
            x = ((x & 0x33) << 2) | ((x & 0xcc) >> 2);
            x = ((x & 0x0f) << 4) | ((x & 0xf0) >> 4);
        } else if (size === 16) {
            x = ((x & 0x5555) << 1) | ((x & 0xaaaa) >> 1);
            x = ((x & 0x3333) << 2) | ((x & 0xcccc) >> 2);
            x = ((x & 0x0f0f) << 4) | ((x & 0xf0f0) >> 4);
            x = ((x & 0x00ff) << 8) | ((x & 0xff00) >> 8);
            /* v8 ignore start */
        } /* if (size === 32) */ else {
            x = ((x & 0x55555555) << 1) | ((x & 0xaaaaaaaa) >> 1);
            x = ((x & 0x33333333) << 2) | ((x & 0xcccccccc) >> 2);
            x = ((x & 0x0f0f0f0f) << 4) | ((x & 0xf0f0f0f0) >> 4);
            x = ((x & 0x00ff00ff) << 8) | ((x & 0xff00ff00) >> 8);
            x = ((x & 0x0000ffff) << 16) | ((x & 0xffff0000) >> 16);
        }
        /* v8 ignore stop */

        return x;
    };

    poly = (1 << length) | poly;

    for (let byte of data) {
        if (refIn) {
            byte = reflect(byte, 8);
        }

        crc ^= byte << (length - 8);

        for (let i = 0; i < 8; i++) {
            crc <<= 1;

            if (crc & (1 << length)) {
                crc ^= poly;
            }
        }
    }

    if (refOut) {
        crc = reflect(crc, length);
    }

    return crc ^ xorOut;
}

/**
 * CRC-16/X-25
 * aka CRC-16/IBM-SDLC
 * aka CRC-16/ISO-HDLC
 * aka CRC-16/ISO-IEC-14443-3-B
 * aka CRC-B
 * aka X-25
 *
 * Shortcut for `calcCRC(data, 16, 0x1021, 0xFFFF, 0xFFFF, true, true)`
 *
 * Used for Install Codes - see Document 13-0402-13 - 10.1
 */
export function crc16X25(data: number[] | Uint8Array | Buffer): number {
    return calcCRC(data, 16, 0x1021, 0xffff, 0xffff, true, true);
}

/**
 * CRC-16/XMODEM
 * aka CRC-16/ACORN
 * aka CRC-16/LTE
 * aka CRC-16/V-41-MSB
 * aka XMODEM
 * aka ZMODEM
 *
 * Shortcut for `calcCRC(data, 16, 0x1021)`
 *
 * Used for XMODEM transfers, often involved in ZigBee environments
 */
export function crc16XMODEM(data: number[] | Uint8Array | Buffer): number {
    return calcCRC(data, 16, 0x1021);
}

/**
 * CRC-16/CCITT
 * aka CRC-16/KERMIT
 * aka CRC-16/BLUETOOTH
 * aka CRC-16/CCITT-TRUE
 * aka CRC-16/V-41-LSB
 * aka CRC-CCITT
 * aka KERMIT
 *
 * Shortcut for `calcCRC(data, 16, 0x1021, 0x0000, 0x0000, true, true)`
 */
export function crc16CCITT(data: number[] | Uint8Array | Buffer): number {
    return calcCRC(data, 16, 0x1021, 0x0000, 0x0000, true, true);
}

/**
 * CRC-16/CCITT-FALSE
 * aka CRC-16/IBM-3740
 * aka CRC-16/AUTOSAR
 *
 * Shortcut for `calcCRC(data, 16, 0x1021, 0xffff)`
 */
export function crc16CCITTFALSE(data: number[] | Uint8Array | Buffer): number {
    return calcCRC(data, 16, 0x1021, 0xffff);
}

function aes128MmoHashUpdate(result: Buffer, data: Buffer, dataSize: number): void {
    while (dataSize >= AES_MMO_128_BLOCK_SIZE) {
        const cipher = createCipheriv('aes-128-ecb', result, null);
        const block = data.subarray(0, AES_MMO_128_BLOCK_SIZE);
        const encryptedBlock = Buffer.concat([cipher.update(block), cipher.final()]);

        // XOR encrypted and plaintext
        for (let i = 0; i < AES_MMO_128_BLOCK_SIZE; i++) {
            result[i] = encryptedBlock[i] ^ block[i];
        }

        data = data.subarray(AES_MMO_128_BLOCK_SIZE);
        dataSize -= AES_MMO_128_BLOCK_SIZE;
    }
}

/**
 * AES-128-MMO (Matyas-Meyer-Oseas) hashing (using node 'crypto' built-in with 'aes-128-ecb')
 *
 * Used for Install Codes - see Document 13-0402-13 - 10.1
 */
export function aes128MmoHash(data: Buffer): Buffer {
    const hashResult = Buffer.alloc(AES_MMO_128_BLOCK_SIZE);
    const temp = Buffer.alloc(AES_MMO_128_BLOCK_SIZE);
    let remainingLength = data.length;
    let position = 0;

    for (position; remainingLength >= AES_MMO_128_BLOCK_SIZE; ) {
        const chunk = data.subarray(position, position + AES_MMO_128_BLOCK_SIZE);

        aes128MmoHashUpdate(hashResult, chunk, chunk.length);

        position += AES_MMO_128_BLOCK_SIZE;
        remainingLength -= AES_MMO_128_BLOCK_SIZE;
    }

    for (let i = 0; i < remainingLength; i++) {
        temp[i] = data[position + i];
    }

    // per the spec, concatenate a 1 bit followed by all zero bits
    temp[remainingLength] = 0x80;

    // if appending the bit string will push us beyond the 16-byte boundary, hash that block and append another 16-byte block
    if (AES_MMO_128_BLOCK_SIZE - remainingLength < 3) {
        aes128MmoHashUpdate(hashResult, temp, AES_MMO_128_BLOCK_SIZE);
        temp.fill(0);
    }

    temp[AES_MMO_128_BLOCK_SIZE - 2] = (data.length >> 5) & 0xff;
    temp[AES_MMO_128_BLOCK_SIZE - 1] = (data.length << 3) & 0xff;

    aes128MmoHashUpdate(hashResult, temp, AES_MMO_128_BLOCK_SIZE);

    const result = Buffer.alloc(AES_MMO_128_BLOCK_SIZE);

    for (let i = 0; i < AES_MMO_128_BLOCK_SIZE; i++) {
        result[i] = hashResult[i];
    }

    return result;
}

/**
 * Check if install code (little-endian) is valid, and if not, and requested, fix it.
 *
 * WARNING: Due to conflicting sizes between 8-length code with invalid CRC, and 10-length code missing CRC, given 8-length codes are always assumed to be 8-length code with invalid CRC (most probable scenario).
 *
 * @param code The code to check. Reference is not modified by this procedure but is returned when code was valid, as `outCode`.
 * @param adjust If false, throws if the install code is invalid, otherwise try to fix it (CRC)
 * @returns
 *   - The adjusted code, or `code` if not adjusted.
 *   - If adjust is false, undefined, otherwise, the reason why the code needed adjusting or undefined if not.
 *   - Throws when adjust=false and invalid, or cannot fix.
 */
export function checkInstallCode(code: Buffer, adjust: boolean = true): [outCode: Buffer, adjusted: 'invalid CRC' | 'missing CRC' | undefined] {
    const crcLowByteIndex = code.length - INSTALL_CODE_CRC_SIZE;
    const crcHighByteIndex = code.length - INSTALL_CODE_CRC_SIZE + 1;

    for (const codeSize of INSTALL_CODE_SIZES) {
        if (code.length === codeSize) {
            // install code has CRC, check if valid, if not, replace it
            const crc = crc16X25(code.subarray(0, -2));
            const crcHighByte = (crc >> 8) & 0xff;
            const crcLowByte = crc & 0xff;

            if (code[crcLowByteIndex] !== crcLowByte || code[crcHighByteIndex] !== crcHighByte) {
                // see WARNING above, 8 is smallest valid length, so always ends up here
                if (adjust) {
                    const outCode = Buffer.from(code);
                    outCode[crcLowByteIndex] = crcLowByte;
                    outCode[crcHighByteIndex] = crcHighByte;

                    return [outCode, 'invalid CRC'];
                } else {
                    throw new Error(`Install code ${code.toString('hex')} failed CRC validation`);
                }
            }

            return [code, undefined];
        } else if (code.length === codeSize - INSTALL_CODE_CRC_SIZE) {
            if (adjust) {
                // install code is missing CRC
                const crc = crc16X25(code);
                const outCode = Buffer.alloc(code.length + INSTALL_CODE_CRC_SIZE);

                code.copy(outCode, 0);
                outCode.writeUInt16LE(crc, code.length);

                return [outCode, 'missing CRC'];
            } else {
                throw new Error(`Install code ${code.toString('hex')} failed CRC validation`);
            }
        }
    }

    // never returned from within the above loop
    throw new Error(`Install code ${code.toString('hex')} has invalid size`);
}
