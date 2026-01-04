import assert from "node:assert";
import crypto from "node:crypto";
import {readFileSync} from "node:fs";
import path from "node:path";
import {logger} from "../../utils/logger";
import * as Zcl from "../../zspec/zcl";
import type {TClusterCommandPayload} from "../../zspec/zcl/definition/clusters-types";
import type {OtaImage, OtaImageElement, OtaImageHeader, OtaImageMeta, ZigbeeOtaImageMeta} from "../tstype";

const NS = "zh:controller:ota";

export const ZIGBEE_OTA_LATEST_URL = "https://raw.githubusercontent.com/Koenkk/zigbee-OTA/master/index.json";
export const ZIGBEE_OTA_PREVIOUS_URL = "https://raw.githubusercontent.com/Koenkk/zigbee-OTA/master/index1.json";

/** When the data size is too big, OTA gets unstable, so default it to 50 bytes maximum. */
export const DEFAULT_MAXIMUM_DATA_SIZE = 50;
/** Use to reduce network congestion by throttling response if necessary */
export const DEFAULT_IMAGE_BLOCK_RESPONSE_DELAY = 250;

/** uint32 LE */
export const UPGRADE_FILE_IDENTIFIER = 0x0beef11e;

export enum OtaTagId {
    UpgradeImage = 0x0000,
    /** signer IEEE address (8-byte), signature data (42-byte) */
    ECDSASignatureCryptoSuite1 = 0x0001,
    /** ECDSA certificate (48-byte) */
    ECDSASigningCertificateCryptoSuite1 = 0x0002,
    /** hash value (16-byte) */
    ImageIntegrityCode = 0x0003,
    /** */
    PictureData = 0x0004,
    /** signer IEEE address (8-byte), signature data (72-byte) */
    ECDSASignatureCryptoSuite2 = 0x0005,
    /** ECDSA certificate (74-byte) */
    ECDSASigningCertificateCryptoSuite2 = 0x0006,
    // "Manufacturer Specific Use" = 0xf000 – 0xffff,
    /**
     * 2-byte header before actual `UpgradeImage`
     * see https://github.com/telink-semi/telink_zigbee_sdk/blob/d5bc2f7b0c1f8536fe21c8127ca680ea8214bc8e/tl_zigbee_sdk/zigbee/ota/ota.h#L38
     */
    TelinkAES = 0xf000,
}

// #region General Utils

export function isValidUrl(url: string): boolean {
    try {
        const parsed = new URL(url);

        return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
        return false;
    }
}

async function getJson<T>(pageUrl: string): Promise<T> {
    const response = await fetch(pageUrl);

    if (!response.ok || !response.body) {
        throw new Error(`Invalid response from ${pageUrl} status=${response.status}.`);
    }

    return (await response.json()) as T;
}

/**
 * Validates a firmware file and returns the appropriate buffer (without possible manufacturer-specific header)
 */
function validateFirmware(fileBuffer: Buffer, sha512: string | undefined): Buffer {
    const otaIdentifier = fileBuffer.indexOf(UPGRADE_FILE_IDENTIFIER);

    assert(otaIdentifier !== -1, "Not a valid OTA file");

    if (sha512) {
        const hash = crypto.createHash("sha512");

        hash.update(fileBuffer);

        assert(hash.digest("hex") === sha512, "File checksum validation failed");
    }

    return fileBuffer.subarray(otaIdentifier);
}

async function fetchFirmware(url: string, sha512: string | undefined): Promise<Buffer> {
    logger.debug(() => `Downloading firmware image from '${url}'`, NS);

    const firmwareFileRsp = await fetch(url);

    if (!firmwareFileRsp.ok || !firmwareFileRsp.body) {
        throw new Error(`Invalid response from ${url} status=${firmwareFileRsp.status}.`);
    }

    const fileBuffer = Buffer.from(await firmwareFileRsp.arrayBuffer());

    return validateFirmware(fileBuffer, sha512);
}

function readFirmware(filePath: string, dataDir: string, sha512: string | undefined): Buffer {
    logger.debug(() => `Reading firmware image from '${filePath}'`, NS);

    if (!path.isAbsolute(filePath) && dataDir) {
        // If the file name is not a full path, then treat it as a relative to the data directory
        filePath = path.join(dataDir, filePath);
    }

    const fileBuffer = readFileSync(filePath);

    return validateFirmware(fileBuffer, sha512);
}

export async function getOtaFirmware(meta: OtaImageMeta, dataDir: string): Promise<Buffer> {
    return isValidUrl(meta.url) ? await fetchFirmware(meta.url, meta.sha512) : readFirmware(meta.url, dataDir, meta.sha512);
}

export async function getOtaIndex(dataDir: string, overrideIndexFileName: string | undefined, previous: boolean): Promise<ZigbeeOtaImageMeta[]> {
    const mainIndex = await getJson<ZigbeeOtaImageMeta[]>(previous ? ZIGBEE_OTA_PREVIOUS_URL : ZIGBEE_OTA_LATEST_URL);

    logger.debug("Downloaded main index", NS);

    if (overrideIndexFileName) {
        logger.debug(`Loading override index '${overrideIndexFileName}'`, NS);

        const localIndex = isValidUrl(overrideIndexFileName)
            ? await getJson<ZigbeeOtaImageMeta[]>(overrideIndexFileName)
            : (JSON.parse(readFileSync(overrideIndexFileName, "utf-8")) as ZigbeeOtaImageMeta[]);

        // Resulting index will have overridden items first
        return localIndex
            .map((meta) => {
                // Web-hosted images must come with all fields filled already
                // Nothing to do if needed fields were filled already
                if (isValidUrl(meta.url) || (meta.imageType !== undefined && meta.manufacturerCode !== undefined && meta.fileVersion !== undefined)) {
                    return meta;
                }

                const image = parseOtaImage(readFirmware(meta.url, dataDir, meta.sha512));
                meta.imageType = image.header.imageType;
                meta.manufacturerCode = image.header.manufacturerCode;
                meta.fileVersion = image.header.fileVersion;

                return meta;
            })
            .concat(mainIndex);
    }

    return mainIndex;
}

// #endregion

// #region OTA Utils

export function parseOtaHeader(buffer: Buffer): OtaImageHeader {
    const otaUpgradeFileIdentifier = buffer.readUint32LE(0);

    assert(UPGRADE_FILE_IDENTIFIER === otaUpgradeFileIdentifier, "Not a valid OTA file");

    const otaHeaderVersion = buffer.readUInt16LE(4);
    const otaHeaderLength = buffer.readUInt16LE(6);
    const otaHeaderFieldControl = buffer.readUInt16LE(8);
    const manufacturerCode = buffer.readUInt16LE(10);
    const imageType = buffer.readUInt16LE(12);
    const fileVersion = buffer.readUInt32LE(14);
    const zigbeeStackVersion = buffer.readUInt16LE(18);
    const otaHeaderString = buffer.toString("utf8", 20, 52);
    const totalImageSize = buffer.readUInt32LE(52);

    const header: OtaImageHeader = {
        otaUpgradeFileIdentifier,
        otaHeaderVersion,
        otaHeaderLength,
        otaHeaderFieldControl,
        manufacturerCode,
        imageType,
        fileVersion,
        zigbeeStackVersion,
        otaHeaderString,
        totalImageSize,
    };
    let headerPosition = 56;

    if (header.otaHeaderFieldControl & 1) {
        header.securityCredentialVersion = buffer.readUInt8(headerPosition);
        headerPosition += 1;
    }

    if (header.otaHeaderFieldControl & 2) {
        header.upgradeFileDestination = buffer.subarray(headerPosition, headerPosition + 8);
        headerPosition += 8;
    }

    if (header.otaHeaderFieldControl & 4) {
        header.minimumHardwareVersion = buffer.readUInt16LE(headerPosition);
        headerPosition += 2;
        header.maximumHardwareVersion = buffer.readUInt16LE(headerPosition);
        headerPosition += 2;
    }

    return header;
}

export function parseOtaSubElement(buffer: Buffer, position: number): [OtaImageElement, metaOffset: number] {
    const tagId = buffer.readUInt16LE(position);
    const length = buffer.readUInt32LE(position + 2);

    switch (tagId) {
        case OtaTagId.UpgradeImage:
        case OtaTagId.ECDSASignatureCryptoSuite1:
        case OtaTagId.ECDSASigningCertificateCryptoSuite1:
        case OtaTagId.ImageIntegrityCode:
        case OtaTagId.PictureData:
        case OtaTagId.ECDSASignatureCryptoSuite2:
        case OtaTagId.ECDSASigningCertificateCryptoSuite2: {
            const data = buffer.subarray(position + 6, position + 6 + length);

            return [{tagId, length, data}, 6];
        }
        // this is fine for now, no known other users of this tag
        case OtaTagId.TelinkAES: {
            // OTA_FLAG_IMAGE_ELEM_INFO1 (1-byte) + OTA_FLAG_IMAGE_ELEM_INFO2 (1-byte)
            //   buffer.subarray(position + 6, position + 8);
            const data = buffer.subarray(position + 8, position + 8 + length);

            return [{tagId, length, data}, 8];
        }
        default: {
            // always throw if we don't know the tag ID to prevent potentially undesirable behavior
            throw new Error(`Unknown tag ID=${tagId} length=${length}`);
        }
    }
}

export function parseOtaImage(buffer: Buffer): OtaImage {
    const header = parseOtaHeader(buffer);
    const raw = buffer.subarray(0, header.totalImageSize);
    let position = header.otaHeaderLength;
    const elements = [];

    while (position < header.totalImageSize) {
        const [element, metaOffset] = parseOtaSubElement(buffer, position);
        position += element.data.length + metaOffset;

        elements.push(element);
    }

    assert(position === header.totalImageSize, "Size mismatch");

    return {header, elements, raw};
}

export function getOtaImageDataPayload(
    image: OtaImage,
    requestPayload: TClusterCommandPayload<"genOta", "imageBlockRequest" | "imagePageRequest">,
    pageOffset: number,
    pageSize: number,
    initialMaximumDataSize: number,
) {
    let dataSize = initialMaximumDataSize;

    if (requestPayload.manufacturerCode === Zcl.ManufacturerCode.INSTA_GMBH) {
        // Insta devices, OTA only works for data sizes 40 and smaller (= manufacturerCode 4474).
        dataSize = 40;
    }

    if (requestPayload.manufacturerCode === Zcl.ManufacturerCode.LEGRAND_GROUP) {
        // Legrand devices (newer firmware) require up to 64 bytes (= manufacturerCode 4129), let it drive the size
        dataSize = requestPayload.maximumDataSize;
    }

    dataSize = Math.min(dataSize, requestPayload.maximumDataSize);
    let start = requestPayload.fileOffset + pageOffset;

    if (
        requestPayload.manufacturerCode === Zcl.ManufacturerCode.LEGRAND_GROUP &&
        requestPayload.fileOffset === 50 &&
        requestPayload.maximumDataSize === 12
    ) {
        // Hack for https://github.com/Koenkk/zigbee-OTA/issues/328 (Legrand OTA not working)
        logger.info("Detected Legrand firmware issue, attempting to reset the OTA stack", NS);
        // The following vector seems to buffer overflow the device to reset the OTA stack!
        start = 78;
        dataSize = 64;
    }

    if (pageSize) {
        dataSize = Math.min(dataSize, pageSize - pageOffset);
    }

    let end = start + dataSize;

    if (end > image.raw.length) {
        end = image.raw.length;
    }

    logger.debug(
        () => `Request offsets: fileOffset=${requestPayload.fileOffset} pageOffset=${pageOffset} maximumDataSize=${requestPayload.maximumDataSize}`,
        NS,
    );
    logger.debug(() => `Payload offsets: start=${start} end=${end} dataSize=${dataSize}`, NS);

    return {
        status: Zcl.Status.SUCCESS,
        manufacturerCode: requestPayload.manufacturerCode,
        imageType: requestPayload.imageType,
        fileVersion: requestPayload.fileVersion,
        fileOffset: start,
        dataSize: end - start,
        data: image.raw.subarray(start, end),
    };
}

export function getOtaImageDataRequestTimeoutMs(
    requestPayload: TClusterCommandPayload<"genOta", "queryNextImageRequest">,
    initialResponseDelay = 150000,
) {
    // increase the upgradeEndReq wait time to solve the problem of OTA timeout failure of Sonoff Devices
    // (https://github.com/Koenkk/zigbee-herdsman-converters/issues/6657)
    if (requestPayload.manufacturerCode === Zcl.ManufacturerCode.SHENZHEN_COOLKIT_TECHNOLOGY_CO_LTD && requestPayload.imageType === 8199) {
        return 3600000;
    }

    // Bosch transmits the firmware updates in the background in their native implementation.
    // According to the app, this can take up to 2 days. Therefore, we assume to get at least
    // one package request per hour from the device here.
    if (requestPayload.manufacturerCode === Zcl.ManufacturerCode.ROBERT_BOSCH_GMBH) {
        return 60 * 60 * 1000;
    }

    // Increase the timeout for Legrand devices, so that they will re-initiate and update themselves
    // Newer firmwares have awkward behaviours when it comes to the handling of the last bytes of OTA updates
    if (requestPayload.manufacturerCode === Zcl.ManufacturerCode.LEGRAND_GROUP) {
        return 30 * 60 * 1000;
    }

    return initialResponseDelay;
}

// #endregion
