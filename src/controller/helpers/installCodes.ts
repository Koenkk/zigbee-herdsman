import {INSTALL_CODE_CRC_SIZE, INSTALL_CODE_SIZES} from "../../zspec/consts";
import {crc16X25} from "../../zspec/utils";

/**
 * Parse the given code using known formats:
 * - 95 or 91-length
 * - Widely adopted (Ubisys, Danfoss, Inovelli, Ledvance): ...Z:<ieee>$I:<key>...
 * - Pipe-separated (Muller-Licht, Innr): <ieee>|<key>
 * - Aqara: G$M:...$A:<ieee>$I:<key>
 * - Hue: HUE:Z:<key> M:<ieee>...
 * @param installCode
 * @returns
 *   - the IEEE address
 *   - the raw key
 */
export function parseInstallCode(installCode: string): [ieeeAddr: string, key: string] {
    const widelyAdoptedMatch = installCode.match(/Z:([a-zA-Z0-9]{16})\$I:([a-zA-Z0-9]+)/);

    if (widelyAdoptedMatch) {
        return [`0x${widelyAdoptedMatch[1].toLowerCase()}`, widelyAdoptedMatch[2]];
    }

    const pipeMatch = installCode.match(/^([a-zA-Z0-9]{16})\|([a-zA-Z0-9]+)$/);

    if (pipeMatch) {
        return [`0x${pipeMatch[1].toLowerCase()}`, pipeMatch[2]];
    }

    const aqaraMatch = installCode.match(/^G\$M:.+\$A:([a-zA-Z0-9]{16})\$I:([a-zA-Z0-9]+)$/);

    if (aqaraMatch) {
        return [`0x${aqaraMatch[1].toLowerCase()}`, aqaraMatch[2]];
    }

    const hueMatch = installCode.match(/^HUE:Z:([a-zA-Z0-9]+) M:([a-zA-Z0-9]{16})/);

    if (hueMatch) {
        return [`0x${hueMatch[2].toLowerCase()}`, hueMatch[1]];
    }

    if (installCode.length === 95 || installCode.length === 91) {
        const keyStart = installCode.length - (installCode.length === 95 ? 36 : 32);

        return [`0x${installCode.substring(keyStart - 19, keyStart - 3).toLowerCase()}`, installCode.substring(keyStart, installCode.length)];
    }

    throw new Error(`Unsupported install code, got ${installCode.length} chars, expected 95 or 91 chars, or known format`);
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
export function checkInstallCode(code: Buffer, adjust = true): [outCode: Buffer, adjusted: "invalid CRC" | "missing CRC" | undefined] {
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

                    return [outCode, "invalid CRC"];
                }

                throw new Error(`Install code ${code.toString("hex")} failed CRC validation`);
            }

            return [code, undefined];
        }

        if (code.length === codeSize - INSTALL_CODE_CRC_SIZE) {
            if (adjust) {
                // install code is missing CRC
                const crc = crc16X25(code);
                const outCode = Buffer.alloc(code.length + INSTALL_CODE_CRC_SIZE);

                code.copy(outCode, 0);
                outCode.writeUInt16LE(crc, code.length);

                return [outCode, "missing CRC"];
            }

            throw new Error(`Install code ${code.toString("hex")} failed CRC validation`);
        }
    }

    // never returned from within the above loop
    throw new Error(`Install code ${code.toString("hex")} has invalid size`);
}
