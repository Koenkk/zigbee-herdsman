import assert from "node:assert";
import crypto from "node:crypto";
import {readFileSync} from "node:fs";
import path from "node:path";
import {performance} from "node:perf_hooks";
import {logger} from "../../utils/logger";
import * as Zcl from "../../zspec/zcl";
import type {TClusterCommandPayload, TClusterPayload} from "../../zspec/zcl/definition/clusters-types";
import type {TZclFrame} from "../../zspec/zcl/zclFrame";
import type Endpoint from "../model/endpoint";
import type {OtaDataSettings, OtaImage, OtaImageElement, OtaImageHeader, OtaSource, ZigbeeOtaImageMeta} from "../tstype";

const NS = "zh:controller:ota";

// OTA_HEADER_VERSION_ZIGBEE  0x0100

// ZIGBEE_2006_STACK_VERSION  0x0000
// ZIGBEE_2007_STACK_VERSION  0x0001
// ZIGBEE_PRO_STACK_VERSION   0x0002
// ZIGBEE_IP_STACK_VERSION    0x0003

// MANUFACTURE_CODE_WILD_CARD 0xFFFF

// IMAGE_TYPE_WILD_CARD       0xFFFF
// IMAGE_TYPE_SECURITY        0xFFC0
// IMAGE_TYPE_CONFIG          0xFFC1
// IMAGE_TYPE_LOG             0xFFC2

// FILE_VERSION_WILD_CARD     0xFFFFFFFF

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
    // IkeaUnknown1 = 0xffbf, // parse fine as regular tag
    // IkeaUnknown2 = 0xffbe, // parse fine as regular tag (custom ECDSA?)
}

const ZIGBEE_OTA_LATEST_URL = "https://raw.githubusercontent.com/Koenkk/zigbee-OTA/master/index.json";
const ZIGBEE_OTA_PREVIOUS_URL = "https://raw.githubusercontent.com/Koenkk/zigbee-OTA/master/index1.json";

const UPGRADE_END_REQUEST_ID = Zcl.Clusters.genOta.commands.upgradeEndRequest.ID;
const IMAGE_BLOCK_REQUEST_ID = Zcl.Clusters.genOta.commands.imageBlockRequest.ID;
const IMAGE_PAGE_REQUEST_ID = Zcl.Clusters.genOta.commands.imagePageRequest.ID;

/** uint32 LE */
export const UPGRADE_FILE_IDENTIFIER = 0x0beef11e;
export const UPGRADE_FILE_IDENTIFIER_BUF = Buffer.from([0x1e, 0xf1, 0xee, 0x0b]);

// #region General Utils

let dataDir: string | undefined;
let overrideIndexLocation: string | undefined;

/**
 * Set the dataDir for relative path needs (firmware file, index) as well as override index if any.
 */
export function setOtaConfiguration(inDataDir: string, inOverrideIndexLocation: string | undefined): void {
    dataDir = inDataDir;

    // If the file name is not a full path, then treat it as a relative to the data directory
    overrideIndexLocation =
        inOverrideIndexLocation && !isValidUrl(inOverrideIndexLocation) && !path.isAbsolute(inOverrideIndexLocation)
            ? path.join(dataDir, inOverrideIndexLocation)
            : inOverrideIndexLocation;
}

function isValidUrl(url: string): boolean {
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
        throw new Error(`Invalid response from ${pageUrl} status=${response.status}`);
    }

    return (await response.json()) as T;
}

/**
 * Validates a firmware file and returns the appropriate buffer (without possible manufacturer-specific header)
 */
function validateFirmware(fileBuffer: Buffer, sha512: string | undefined): Buffer {
    const otaIdentifier = fileBuffer.indexOf(UPGRADE_FILE_IDENTIFIER_BUF);

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
        throw new Error(`Invalid response from ${url} status=${firmwareFileRsp.status}`);
    }

    const fileBuffer = Buffer.from(await firmwareFileRsp.arrayBuffer());

    return validateFirmware(fileBuffer, sha512);
}

function readFirmware(filePath: string, sha512: string | undefined): Buffer {
    logger.debug(() => `Reading firmware image from '${filePath}'`, NS);

    if (dataDir && !path.isAbsolute(filePath)) {
        // If the file name is not a full path, then treat it as a relative to the data directory
        filePath = path.join(dataDir, filePath);
    }

    const fileBuffer = readFileSync(filePath);

    return validateFirmware(fileBuffer, sha512);
}

export async function getOtaFirmware(url: string, sha512: string | undefined): Promise<Buffer> {
    return isValidUrl(url) ? await fetchFirmware(url, sha512) : readFirmware(url, sha512);
}

async function getOtaIndexInternal(url: string): Promise<ZigbeeOtaImageMeta[]> {
    return isValidUrl(url) ? await getJson<ZigbeeOtaImageMeta[]>(url) : (JSON.parse(readFileSync(url, "utf-8")) as ZigbeeOtaImageMeta[]);
}

export async function getOtaIndex(source: OtaSource): Promise<ZigbeeOtaImageMeta[]> {
    let mainIndexUrl: string;

    if (source.url) {
        if (!isValidUrl(source.url) && !path.isAbsolute(source.url)) {
            if (!dataDir) {
                throw new Error("Invalid OTA configuration");
            }

            mainIndexUrl = path.join(dataDir, source.url);
        } else {
            mainIndexUrl = source.url;
        }
    } else {
        mainIndexUrl = source.downgrade ? ZIGBEE_OTA_PREVIOUS_URL : ZIGBEE_OTA_LATEST_URL;
    }

    if (overrideIndexLocation) {
        logger.debug(`Loading override index '${overrideIndexLocation}'`, NS);

        const localIndex = await getOtaIndexInternal(overrideIndexLocation);

        // Resulting index will have overridden items first
        const mappedLocalIndex = localIndex.map((meta) => {
            // Web-hosted images must come with all fields filled already
            // Nothing to do if needed fields were filled already
            if (isValidUrl(meta.url) || (meta.imageType !== undefined && meta.manufacturerCode !== undefined && meta.fileVersion !== undefined)) {
                return meta;
            }

            const image = parseOtaImage(readFirmware(meta.url, meta.sha512));
            meta.imageType = image.header.imageType;
            meta.manufacturerCode = image.header.manufacturerCode;
            meta.fileVersion = image.header.fileVersion;

            return meta;
        });

        try {
            const mainIndex = await getOtaIndexInternal(mainIndexUrl);

            logger.debug("Retrieved main index", NS);

            return mappedLocalIndex.concat(mainIndex);
        } catch {
            logger.info("Failed to download main index, only override index is loaded", NS);

            return mappedLocalIndex;
        }
    }

    return await getOtaIndexInternal(mainIndexUrl);
}

// #endregion

// #region OTA Utils

export function parseOtaHeader(buffer: Buffer): OtaImageHeader {
    const otaUpgradeFileIdentifier = buffer.readUInt32LE(0);

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

    // this is fine for now, no known other uses of this tag
    if (tagId === OtaTagId.TelinkAES) {
        // OTA_FLAG_IMAGE_ELEM_INFO1 (1-byte) + OTA_FLAG_IMAGE_ELEM_INFO2 (1-byte)
        //   buffer.subarray(position + 6, position + 8);
        const data = buffer.subarray(position + 8, position + 8 + length);

        return [{tagId, length, data}, 8];
    }

    const data = buffer.subarray(position + 6, position + 6 + length);

    return [{tagId, length, data}, 6];
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

function buildImageBlockPayload(
    image: OtaImage,
    requestPayload: TClusterCommandPayload<"genOta", "imageBlockRequest" | "imagePageRequest">,
    pageOffset: number,
    pageSize: number,
    baseDataSize: number,
) {
    let dataSize = baseDataSize;

    if (
        requestPayload.manufacturerCode === Zcl.ManufacturerCode.INSTA_GMBH ||
        requestPayload.manufacturerCode === Zcl.ManufacturerCode.DRESDEN_ELEKTRONIK_INGENIEURTECHNIK_GMBH
    ) {
        // Insta and some Dresden Elektronik devices, OTA only works for data sizes 40 and smaller (= manufacturerCode 4474 [Insta], 4405 [Dresden Elektronik]).
        dataSize = 40;
    }

    if (requestPayload.manufacturerCode === Zcl.ManufacturerCode.LEGRAND_GROUP) {
        // Legrand devices (newer firmware) require up to 64 bytes (= manufacturerCode 4129), let it drive the size
        dataSize = requestPayload.maximumDataSize;
    }

    if (Number.isFinite(requestPayload.maximumDataSize)) {
        dataSize = Math.min(dataSize, requestPayload.maximumDataSize);
    }

    let start = requestPayload.fileOffset + pageOffset;

    /* v8 ignore start */
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
    /* v8 ignore stop */

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

// #endregion

type OtaDataRequest = TZclFrame<"genOta", "imageBlockRequest"> | TZclFrame<"genOta", "imagePageRequest">;
type OtaUpgradeEndRequest = TZclFrame<"genOta", "upgradeEndRequest">;

export class OtaSession {
    #lastBlockResponseTime = 0;
    #lastProgressUpdate = 0;
    readonly #startTime: number;

    get startTime() {
        return this.#startTime;
    }

    constructor(
        private readonly ieeeAddr: string,
        private readonly endpoint: Endpoint,
        private readonly image: OtaImage,
        private readonly onProgress: (progress: number, remaining: number) => void,
        private readonly dataSettings: OtaDataSettings,
        private readonly waitForOtaCommand: <Co extends string>(
            endpointId: number,
            commandId: number,
            transactionSequenceNumber: number | undefined,
            timeout: number,
        ) => {promise: Promise<TZclFrame<"genOta", Co>>; cancel: () => void},
    ) {
        this.#startTime = performance.now();

        // TODO: should `dataSettings.requestTimeout` be override if >0?
        //       to allow easier testing when devices misbehave otherwise potentially overridden by below switch
        // if (!this.dataSettings.requestTimeout) {
        switch (image.header.manufacturerCode) {
            case Zcl.ManufacturerCode.ROBERT_BOSCH_GMBH: {
                // Bosch transmits the firmware updates in the background in their native implementation.
                // According to the app, this can take up to 2 days. Therefore, we assume to get at least
                // one package request per hour from the device here.
                this.dataSettings.requestTimeout = 60 * 60 * 1000;
                break;
            }
            case Zcl.ManufacturerCode.LEGRAND_GROUP: {
                // Increase the timeout for Legrand devices, so that they will re-initiate and update themselves
                // Newer firmwares have awkward behaviours when it comes to the handling of the last bytes of OTA updates
                this.dataSettings.requestTimeout = 30 * 60 * 1000;
                break;
            }
            case Zcl.ManufacturerCode.SHENZHEN_COOLKIT_TECHNOLOGY_CO_LTD: {
                if (image.header.imageType === 8199) {
                    // increase the upgradeEndReq wait time to solve the problem of OTA timeout failure of Sonoff Devices
                    // (https://github.com/Koenkk/zigbee-herdsman-converters/issues/6657)
                    this.dataSettings.requestTimeout = 3600000;
                }
                break;
            }
        }
        // }

        if (!this.dataSettings.requestTimeout) {
            this.dataSettings.requestTimeout = 150000; // ensures never zero
        }

        if (!this.dataSettings.baseSize) {
            this.dataSettings.baseSize = 50; // ensures never zero
        }

        // report initial progress with estimated time
        const expectedBlocks = Math.ceil(image.header.totalImageSize / dataSettings.baseSize);
        const blocksPerSec = dataSettings.responseDelay > 0 ? Math.round((1000 / dataSettings.responseDelay) * 100) / 100 : 20; // (1000 / 50)
        const estimatedRemainingSeconds = expectedBlocks / blocksPerSec;

        onProgress(0, estimatedRemainingSeconds);
        logger.info(
            () =>
                `OTA update of '${this.ieeeAddr}' estimated at ${estimatedRemainingSeconds} seconds (${expectedBlocks} chunks, ${blocksPerSec} per second)`,
            NS,
        );
    }

    public async run(): Promise<TZclFrame<"genOta", "upgradeEndRequest">> {
        // can take a long time, use max (int32 - 1), ~24 days
        const upgradeEndRequest = this.waitForOtaCommand<"upgradeEndRequest">(this.endpoint.ID, UPGRADE_END_REQUEST_ID, undefined, 2147483647);

        try {
            for await (const request of this.commandStream(upgradeEndRequest)) {
                if (request.command.ID === UPGRADE_END_REQUEST_ID) {
                    return request as TZclFrame<"genOta", "upgradeEndRequest">;
                }

                if (request.command.ID === IMAGE_PAGE_REQUEST_ID) {
                    const pagePayload = request.payload as TClusterPayload<"genOta", "imagePageRequest">;
                    let pageOffset = 0;

                    while (pageOffset < pagePayload.pageSize) {
                        pageOffset = await this.sendImageBlockResponse(
                            pagePayload,
                            request.header.transactionSequenceNumber,
                            pageOffset,
                            pagePayload.pageSize,
                        );
                    }
                } else {
                    await this.sendImageBlockResponse(
                        request.payload as TClusterPayload<"genOta", "imageBlockRequest">,
                        request.header.transactionSequenceNumber,
                        0,
                        0,
                    );
                }
                /* v8 ignore start */
            }

            // this code is logically unreachable
            // the generator always yields `UPGRADE_END_REQUEST_ID` before completing or it will eventually throw a timeout
            // but TypeScript can't detect this and requires a return statement
            const endPayload = await upgradeEndRequest.promise;

            return endPayload;
            /* v8 ignore stop */
        } catch (error) {
            upgradeEndRequest.cancel();

            const err = error as Error;
            err.message = `Device ${this.ieeeAddr} did not start/finish firmware download after being notified. (${err.message})`;

            throw err;
        }
    }

    private async *commandStream(upgradeEndRequest: {
        promise: Promise<TZclFrame<"genOta", "upgradeEndRequest">>;
        cancel: () => void;
    }): AsyncGenerator<OtaDataRequest | OtaUpgradeEndRequest> {
        while (true) {
            const imageBlockRequest = this.waitForOtaCommand<"imageBlockRequest">(
                this.endpoint.ID,
                IMAGE_BLOCK_REQUEST_ID,
                undefined,
                this.dataSettings.requestTimeout,
            );
            const imagePageRequest = this.waitForOtaCommand<"imagePageRequest">(
                this.endpoint.ID,
                IMAGE_PAGE_REQUEST_ID,
                undefined,
                this.dataSettings.requestTimeout,
            );
            const dataRequest = Promise.race([imageBlockRequest.promise, imagePageRequest.promise]);
            const request = await Promise.race([dataRequest, upgradeEndRequest.promise]);

            imageBlockRequest.cancel();
            imagePageRequest.cancel();

            // if this is `UPGRADE_END_REQUEST_ID`, `run()` will return and thus terminate the generator (no endless loop possible)
            yield request;
        }
    }

    private async sendImageBlockResponse(
        requestPayload: TClusterCommandPayload<"genOta", "imageBlockRequest">,
        requestTsn: number,
        pageOffset: number,
        pageSize: number,
    ): Promise<number> {
        // throttle if needed
        let callNow = performance.now();
        const timeSinceLast = callNow - this.#lastBlockResponseTime;
        const delayNeeded = this.dataSettings.responseDelay - timeSinceLast;

        if (delayNeeded > 0) {
            await new Promise((resolve) => setTimeout(resolve, delayNeeded));

            // avoids a second call to `performance.now()`
            callNow += delayNeeded;
        }

        this.#lastBlockResponseTime = callNow;

        try {
            const blockPayload = buildImageBlockPayload(this.image, requestPayload, pageOffset, pageSize, this.dataSettings.baseSize);

            await this.endpoint.commandResponse("genOta", "imageBlockResponse", blockPayload, undefined, requestTsn);

            const nextOffset = pageOffset + blockPayload.dataSize;
            const now = performance.now();

            if (now - this.#lastProgressUpdate > 30000) {
                const totalDurationSeconds = (now - this.#startTime) / 1000;
                const bytesPerSecond = requestPayload.fileOffset / totalDurationSeconds;

                // first 30 seconds will be ignored due to first fileOffset being 0
                // remain on ctor progress estimate until then (more reliable)
                if (bytesPerSecond > 0) {
                    const percentage = Math.round((requestPayload.fileOffset / this.image.header.totalImageSize) * 10000) / 100;
                    const remainingSeconds = Math.round((this.image.header.totalImageSize - requestPayload.fileOffset) / bytesPerSecond);

                    logger.info(() => `OTA update of '${this.ieeeAddr}' at ${percentage}%, ${remainingSeconds} seconds remaining`, NS);
                    this.onProgress(percentage, remainingSeconds);
                }

                this.#lastProgressUpdate = now;
            }

            return nextOffset;
        } catch (error) {
            logger.debug(() => `Image block response failed for ${this.ieeeAddr}: ${(error as Error).message}`, NS);

            return pageOffset;
        }
    }
}
