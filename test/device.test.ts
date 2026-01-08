import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {performance} from "node:perf_hooks";
import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";
import type {Adapter} from "../src/adapter";
import Database from "../src/controller/database";
import * as otaHelpers from "../src/controller/helpers/ota";
import {Device, Entity} from "../src/controller/model";
import {InterviewState} from "../src/controller/model/device";
import type Endpoint from "../src/controller/model/endpoint";
import type {OtaDataSettings, OtaImage, OtaSource, ZigbeeOtaImageMeta} from "../src/controller/tstype";
import {logger} from "../src/utils/logger";
import * as Zcl from "../src/zspec/zcl";
import type {TClusterCommandPayload} from "../src/zspec/zcl/definition/clusters-types";

const tempDirs: string[] = [];

const OTA_CLUSTER_ID = Zcl.Clusters.genOta.ID;
const QUERY_NEXT_IMAGE_REQUEST_ID = Zcl.Clusters.genOta.commands.queryNextImageRequest.ID;
const UPGRADE_END_REQUEST_ID = Zcl.Clusters.genOta.commands.upgradeEndRequest.ID;
const IMAGE_BLOCK_REQUEST_ID = Zcl.Clusters.genOta.commands.imageBlockRequest.ID;
const IMAGE_PAGE_REQUEST_ID = Zcl.Clusters.genOta.commands.imagePageRequest.ID;

type OtaDeviceBehavior = {
    baseSize: number;
    /** Mimick the device sending image page requests instead of image block requests */
    usePageRequests?: boolean;
    pageSize?: number;
    /** Mimick the device stopping image block/page requests at specified block (i.e. stalling) */
    stopAfterBlocks?: number;
    /** Mimick the device sending out-of-order offset for block/page request, block 2 swapped with block 3 */
    shuffleOffsets?: boolean;
    /**
     * TODO: implement this
     * Mimick the device sending block/page request with an offset that is lower or higher than expected flow of "previous offset+data size" at block 2:
     * - normal flow would be something like: block1=[offset=0, dataSize=50], block2=[offset=50, dataSize=50], block3=[offset=100, dataSize=50]
     * - with this block2 has this applied to offset: block1=[offset=0, dataSize=50], block2=[offset=(dataSize-misalignedOffset), dataSize=50], block3=[offset=(dataSize*2-misalignedOffset), dataSize=50]
     */
    misalignedOffset?: number;
    /** Mimick failing block 2 response (mimick device sending new image block/page request for same offset) */
    failBlockResponse?: boolean;
    /** Mimick the device sending or not of `upgradeEndRequest` (at end of block/page requests, or as specified by other behaviors) */
    sendUpgradeEnd?: boolean;
    /** Mimick the device sending that specific status in `upgradeEndRequest` */
    upgradeEndStatus?: Zcl.Status;
    /** Mimick the device sending `upgradeEndRequest` after that specific block/page request */
    upgradeEndAfterBlocks?: number;
};

const DEFAULT_BEHAVIOR: Readonly<OtaDeviceBehavior> = {
    baseSize: 64,
    sendUpgradeEnd: true,
    upgradeEndStatus: Zcl.Status.SUCCESS,
};

const createEndpointStub = () => {
    const commandResponse = vi.fn().mockResolvedValue(undefined);
    const defaultResponse = vi.fn().mockResolvedValue(undefined);
    const supportsOutputCluster = vi.fn((clusterKey: number | string) => clusterKey === OTA_CLUSTER_ID || clusterKey === "genOta");

    return {ID: 1, supportsOutputCluster, commandResponse, defaultResponse} as unknown as Endpoint;
};

const createOtaDeviceWaitFor = (
    endpoint: Endpoint,
    image: OtaImage,
    current: TClusterCommandPayload<"genOta", "queryNextImageRequest">,
    behavior: OtaDeviceBehavior,
): Adapter["waitFor"] => {
    const settings = {...DEFAULT_BEHAVIOR, ...behavior};
    let nextOffset = 0;
    let blocksServed = 0;
    let blockTsn = 2;
    let upgradeEndResolver: ((frame: Zcl.Frame) => void) | undefined;
    let upgradeEndTimer: NodeJS.Timeout | undefined;
    let upgradeEndSent = false;
    let repeatLastBlock = false;
    let previousBlock: {offset: number; size: number} | undefined;

    const pendingPromise = (): ReturnType<Adapter["waitFor"]>["promise"] => new Promise<never>(() => {}) as never;
    const makeFrame = (
        commandId: number,
        payload: TClusterCommandPayload<"genOta", "imageBlockRequest" | "imagePageRequest" | "upgradeEndRequest" | "queryNextImageRequest">,
        tsn: number,
    ) => Zcl.Frame.create(Zcl.FrameType.SPECIFIC, Zcl.Direction.CLIENT_TO_SERVER, true, undefined, tsn, commandId, OTA_CLUSTER_ID, payload, {});

    const maybeScheduleUpgradeEnd = () => {
        if (!settings.sendUpgradeEnd || upgradeEndSent || !upgradeEndResolver) {
            return;
        }

        upgradeEndSent = true;

        queueMicrotask(() => {
            const frame = makeFrame(
                UPGRADE_END_REQUEST_ID,
                {
                    status: settings.upgradeEndStatus ?? Zcl.Status.SUCCESS,
                    manufacturerCode: image.header.manufacturerCode,
                    imageType: image.header.imageType,
                    fileVersion: image.header.fileVersion,
                },
                250,
            );

            upgradeEndResolver?.(frame);
        });
    };

    if (settings.failBlockResponse) {
        endpoint.commandResponse = vi.fn((_clusterKey, commandKey, _payload, _options, _transactionSequenceNumber) => {
            if (commandKey === "imageBlockResponse") {
                if (blocksServed === 1) {
                    repeatLastBlock = true;
                    return Promise.reject(new Error("block-fail"));
                }

                return Promise.resolve();
            }

            return Promise.resolve();
        });
    }

    const handleBlockRequest = (endpointId: number, transactionSequenceNumber: number | undefined, networkAddress: number) => {
        if (repeatLastBlock && previousBlock) {
            repeatLastBlock = false;
            // revert offset to previous block
            ({offset: nextOffset} = previousBlock);
        }

        if (settings.stopAfterBlocks !== undefined && blocksServed >= settings.stopAfterBlocks) {
            return {
                promise: Promise.reject(new Error("device stopped requesting blocks")),
                cancel: () => {},
            };
        }

        let fileOffset = nextOffset;

        if (settings.shuffleOffsets) {
            if (blocksServed === 1) {
                fileOffset = settings.baseSize * 2;
            } else if (blocksServed === 2) {
                fileOffset = settings.baseSize;
            }
        } else if (settings.misalignedOffset) {
            if (blocksServed === 1) {
                fileOffset = settings.baseSize + settings.misalignedOffset;
            }
        }

        const remaining = image.header.totalImageSize - fileOffset;

        if (remaining <= 0) {
            maybeScheduleUpgradeEnd();

            return {
                promise: Promise.reject(new Error("all blocks sent")),
                cancel: () => {},
            };
        }

        const payload: TClusterCommandPayload<"genOta", "imageBlockRequest"> = {
            fieldControl: 0,
            manufacturerCode: image.header.manufacturerCode,
            imageType: image.header.imageType,
            fileVersion: image.header.fileVersion,
            fileOffset,
            maximumDataSize: settings.baseSize,
        };

        blocksServed += 1;
        const nextTsn = transactionSequenceNumber ?? blockTsn;
        blockTsn = (blockTsn + 1) & 0xff;
        const frame = makeFrame(IMAGE_BLOCK_REQUEST_ID, payload, nextTsn);
        nextOffset = Math.max(nextOffset, fileOffset + settings.baseSize);
        previousBlock = {offset: fileOffset, size: settings.baseSize};

        if (settings.upgradeEndAfterBlocks !== undefined && blocksServed >= settings.upgradeEndAfterBlocks) {
            maybeScheduleUpgradeEnd();
        } else if (nextOffset >= image.header.totalImageSize && settings.sendUpgradeEnd) {
            maybeScheduleUpgradeEnd();
        }

        return {
            promise: Promise.resolve({
                clusterID: OTA_CLUSTER_ID,
                header: frame.header,
                data: frame.toBuffer(),
                endpoint: endpointId,
                linkquality: 0,
                address: networkAddress,
                groupID: 0,
                wasBroadcast: false,
                destinationEndpoint: endpointId,
            }),
            cancel: () => {},
        };
    };

    const handlePageRequest = (endpointId: number, transactionSequenceNumber: number | undefined, networkAddress: number) => {
        const remaining = image.header.totalImageSize - nextOffset;

        if (remaining <= 0) {
            maybeScheduleUpgradeEnd();

            return {
                promise: pendingPromise(),
                cancel: () => {},
            };
        }

        const pageSize = Math.min(settings.pageSize ?? settings.baseSize * 16, remaining);
        const payload: TClusterCommandPayload<"genOta", "imagePageRequest"> = {
            fieldControl: 0,
            manufacturerCode: image.header.manufacturerCode,
            imageType: image.header.imageType,
            fileVersion: image.header.fileVersion,
            fileOffset: nextOffset,
            maximumDataSize: settings.baseSize,
            pageSize,
            responseSpacing: 0,
        };

        const nextTsn = transactionSequenceNumber ?? blockTsn;
        blockTsn = (blockTsn + 1) & 0xff;
        const frame = makeFrame(IMAGE_PAGE_REQUEST_ID, payload, nextTsn);
        nextOffset = Math.max(nextOffset, payload.fileOffset + pageSize);
        previousBlock = {offset: payload.fileOffset, size: pageSize};

        if (nextOffset >= image.header.totalImageSize) {
            maybeScheduleUpgradeEnd();
        }

        return {
            promise: Promise.resolve({
                clusterID: OTA_CLUSTER_ID,
                header: frame.header,
                data: frame.toBuffer(),
                endpoint: endpointId,
                linkquality: 0,
                address: networkAddress,
                groupID: 0,
                wasBroadcast: false,
                destinationEndpoint: endpointId,
            }),
            cancel: () => {},
        };
    };

    const waitFor: Adapter["waitFor"] = (
        networkAddress,
        endpointId,
        _frameType,
        _direction,
        transactionSequenceNumber,
        clusterID,
        commandId,
        timeout,
    ) => {
        const fail = (message: string) => ({
            promise: Promise.reject(new Error(message)),
            cancel: () => {},
        });

        if (clusterID !== OTA_CLUSTER_ID) {
            return fail("unexpected cluster");
        }

        if (commandId === QUERY_NEXT_IMAGE_REQUEST_ID) {
            const frame = makeFrame(commandId, current, transactionSequenceNumber ?? 1);

            return {
                promise: Promise.resolve({
                    clusterID,
                    header: frame.header,
                    data: frame.toBuffer(),
                    endpoint: endpointId,
                    linkquality: 0,
                    address: networkAddress!,
                    groupID: 0,
                    wasBroadcast: false,
                    destinationEndpoint: endpointId,
                }),
                cancel: () => {},
            };
        }

        if (commandId === UPGRADE_END_REQUEST_ID) {
            const promise = new Promise<Zcl.Frame>((resolve, reject) => {
                upgradeEndResolver = resolve;

                if (timeout && timeout > 0) {
                    upgradeEndTimer = setTimeout(() => reject(new Error("timeout")), timeout);
                }
            });

            return {
                promise: promise.then((frame) => ({
                    clusterID,
                    header: frame.header,
                    data: frame.toBuffer(),
                    endpoint: endpointId,
                    linkquality: 0,
                    address: networkAddress!,
                    groupID: 0,
                    wasBroadcast: false,
                    destinationEndpoint: endpointId,
                })),
                cancel: () => {
                    if (upgradeEndTimer) {
                        clearTimeout(upgradeEndTimer);
                        upgradeEndTimer = undefined;
                    }
                    upgradeEndResolver = undefined;
                },
            };
        }

        if (commandId === IMAGE_PAGE_REQUEST_ID) {
            if (!settings.usePageRequests) {
                return {
                    promise: pendingPromise(),
                    cancel: () => {},
                };
            }

            return handlePageRequest(endpointId, transactionSequenceNumber, networkAddress!);
        }

        if (commandId === IMAGE_BLOCK_REQUEST_ID) {
            if (settings.usePageRequests) {
                return {
                    promise: pendingPromise(),
                    cancel: () => {},
                };
            }

            return handleBlockRequest(endpointId, transactionSequenceNumber, networkAddress!);
        }

        return fail("unsupported commandId");
    };

    return waitFor;
};

const OTA_FILES = [
    "zbminir2_v1.0.8.ota",
    "telink-aes-A60_RGBW_T-0x00B6-0x03483712-MF_DIS.OTA",
    "integrity-code-1166-012B-24031511-upgradeMe-RB 249 T.zigbee",
    "manuf-tags-tradfri-cv-cct-unified_release_prod_v587757105_33e34452-9267-4665-bc5a-844c8f61f063.ota",
];
const OTA_FILES_SHA512 = [
    "051912851dffed4b49d3caece8d67b0fec9987dcbdf4d6db45c4e23f4ea0c9be867491758af12f153bc9672d4205129a9270be79e781d150734be295c44971bf",
    "6696fe6707686d9586cdfa045bb3ce24ef960b6cb664a09096e6e11025143373528760f525f5bd2c715d590a2891bd1a69f24227dfe62290aa80e3fcc7e1949d",
    "d3c86737e3a9de6102c013b00b69ea37c551debb898c25f5ce67bfdab4c52b8acca5932e34953d06087dd078d77d83d5d8654c695af6a18440fc2acea0c07f5f",
    "98d8be5b4dcd9692cb6ff87531513023c0116cb9137c5690105ce2077765f35ae2651bdd2aa80ce0363f6db4ef3b9795449252c6c0ff8a8b0e6e05789fdb03be",
];

const getResponses = (endpoint: Endpoint, command: string) => {
    const mock = endpoint.commandResponse as unknown as ReturnType<typeof vi.fn>;

    return mock.mock.calls.filter((call) => call[1] === command);
};

const loadImage = (fileName: string): [image: OtaImage, path: string] => {
    const filePath = path.join(__dirname, "data", fileName);
    const buffer = fs.readFileSync(filePath);

    return [otaHelpers.parseOtaImage(buffer), filePath];
};

const mockImage = (
    totalImageSize: number,
    manufacturerCode = 1,
    imageType = 2,
    fileVersion = 3,
    securityCredentialVersion?: number,
    upgradeFileDestination?: Buffer,
    minimumHardwareVersion?: number,
    maximumHardwareVersion?: number,
): OtaImage => {
    if (totalImageSize < 56) {
        throw new Error("Mock image totalImageSize too small");
    }

    const header: OtaImage["header"] = {
        otaUpgradeFileIdentifier: otaHelpers.UPGRADE_FILE_IDENTIFIER,
        otaHeaderVersion: 0x0100, // OTA_HEADER_VERSION_ZIGBEE
        otaHeaderLength: 56,
        otaHeaderFieldControl: 0,
        manufacturerCode,
        imageType,
        fileVersion,
        zigbeeStackVersion: 2, // ZIGBEE_PRO_STACK_VERSION
        otaHeaderString: "test",
        totalImageSize,
    };
    const raw = Buffer.alloc(totalImageSize, 0xf1);
    let offset = 0;
    offset = raw.writeUInt32LE(header.otaUpgradeFileIdentifier, offset);
    offset = raw.writeUInt16LE(header.otaHeaderVersion, offset);
    offset = raw.writeUInt16LE(header.otaHeaderLength, offset);
    const otaHeaderFieldControlOffset = offset; // will write at end
    offset += 2;
    offset = raw.writeUInt16LE(header.manufacturerCode, offset);
    offset = raw.writeUInt16LE(header.imageType, offset);
    offset = raw.writeUInt32LE(header.fileVersion, offset);
    offset = raw.writeUInt16LE(header.zigbeeStackVersion, offset);
    offset += raw.write(header.otaHeaderString.padEnd(32, "\u0000"), offset, "utf8");
    offset = raw.writeUInt32LE(header.totalImageSize, offset);

    if (securityCredentialVersion !== undefined) {
        header.otaHeaderFieldControl |= 1;
        header.otaHeaderLength += 1;
        header.securityCredentialVersion = securityCredentialVersion;
        offset = raw.writeUInt8(securityCredentialVersion, offset);
    }

    if (upgradeFileDestination !== undefined) {
        if (upgradeFileDestination.byteLength !== 8) {
            throw new Error("Mock image invalid upgradeFileDestination");
        }

        header.otaHeaderFieldControl |= 2;
        header.otaHeaderLength += 8;
        header.upgradeFileDestination = upgradeFileDestination;
        offset += upgradeFileDestination.copy(raw, offset);
    }

    if (minimumHardwareVersion !== undefined && maximumHardwareVersion !== undefined) {
        header.otaHeaderFieldControl |= 4;
        header.otaHeaderLength += 4;
        header.minimumHardwareVersion = minimumHardwareVersion;
        offset = raw.writeUInt16LE(minimumHardwareVersion, offset);
        header.maximumHardwareVersion = maximumHardwareVersion;
        offset = raw.writeUInt16LE(maximumHardwareVersion, offset);
    }

    raw.writeUInt16LE(header.otaHeaderFieldControl, otaHeaderFieldControlOffset);

    // enough to write UpgradeImage tag
    if (totalImageSize < header.otaHeaderLength + 7) {
        throw new Error("Mock image totalImageSize too small");
    }

    offset = raw.writeUInt16LE(otaHelpers.OtaTagId.UpgradeImage, offset);
    offset = raw.writeUInt32LE(totalImageSize - header.otaHeaderLength - 6, offset);

    return {
        header,
        elements: [],
        raw,
    };
};

const writeMockImage = (image: OtaImage, fileName: string, tempDir?: string) => {
    if (!tempDir) {
        tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "zh-ota-"));
    }

    tempDirs.push(tempDir);

    const filePath = path.join(tempDir, fileName);

    fs.writeFileSync(filePath, image.raw);

    return filePath;
};

type CreateDeviceOptions = {
    image: OtaImage;
    behavior?: Partial<OtaDeviceBehavior>;
    source: OtaSource | undefined;
    requestPayload?: TClusterCommandPayload<"genOta", "queryNextImageRequest">;
    dataSettings?: OtaDataSettings;
    onProgress?: (progress: number, remaining?: number) => void;
    modelID?: string;
    manufacturerName?: string;
    meta?: Record<string, unknown>;
    autoAnnounce?: boolean;
};

const createSimpleDevice = ({modelID, manufacturerName, meta}: Pick<CreateDeviceOptions, "modelID" | "manufacturerName" | "meta">) => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "zh-ota-"));

    tempDirs.push(tempDir);

    const database = Database.open(path.join(tempDir, "database.db"));
    database.write = () => {};
    Entity.injectDatabase(database);

    const device = Device.create("Router", "0x1", 0x1001, 1, manufacturerName, "Mains", modelID, InterviewState.Successful, undefined);

    if (meta) {
        device.meta = meta;
    }

    const endpoint = createEndpointStub();
    device.endpoints.push(endpoint);

    return {
        device,
        endpoint,
        tempDir,
    };
};

const createDevice = ({
    image,
    behavior,
    source,
    requestPayload,
    dataSettings = {requestTimeout: 100, responseDelay: 0, baseSize: 64},
    onProgress = vi.fn(),
    modelID = "ModelX",
    manufacturerName = "TestCo",
    meta,
    autoAnnounce = true,
}: CreateDeviceOptions) => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "zh-ota-"));

    tempDirs.push(tempDir);

    const database = Database.open(path.join(tempDir, "database.db"));
    database.write = () => {};
    Entity.injectDatabase(database);

    const endpoint = createEndpointStub();
    const currentPayload: TClusterCommandPayload<"genOta", "queryNextImageRequest"> = requestPayload ?? {
        fieldControl: 0,
        manufacturerCode: image.header.manufacturerCode,
        imageType: image.header.imageType,
        fileVersion: image.header.fileVersion + (source?.downgrade ? 1 : -1),
    };
    const waitFor = createOtaDeviceWaitFor(endpoint, image, currentPayload, {baseSize: dataSettings.baseSize ?? 64, ...behavior});
    const adapter = {waitFor, hasZdoMessageOverhead: false} as unknown as Adapter;
    Entity.injectAdapter(adapter);

    const device = Device.create("Router", "0x1", 0x1001, 1, manufacturerName, "Mains", modelID, InterviewState.Successful, undefined);

    if (autoAnnounce) {
        const originalOnce = device.once.bind(device);

        device.once = ((event: Parameters<typeof device.once>[0], listener: Parameters<typeof device.once>[1]) => {
            if (event === "deviceAnnounce") {
                queueMicrotask(() => device.emit("deviceAnnounce", {} as never));
            }

            return originalOnce(event, listener);
        }) as typeof device.once;
    }

    if (meta) {
        device.meta = meta;
    }

    device.endpoints.push(endpoint);

    return {
        device,
        endpoint,
        onProgress,
        run: () => device.updateOta(source, requestPayload, 1, {}, onProgress, dataSettings, endpoint),
        tempDir,
    };
};

const buildIndexEntry = (fileName: string, image: OtaImage, index?: number, url?: string) => ({
    fileName,
    url: url ?? path.join(__dirname, "data", fileName),
    manufacturerCode: image.header.manufacturerCode,
    imageType: image.header.imageType,
    fileVersion: image.header.fileVersion,
    sha512: index === undefined ? undefined : OTA_FILES_SHA512[index],
});

describe("Device OTA", () => {
    let fetchIndexEntries: ZigbeeOtaImageMeta[] = [];
    let firmwareBuffer: Buffer | undefined;
    const fetchMockFail = {ok: false, body: null, status: 403};
    const fetchMockIndex = {
        ok: true,
        body: {},
        status: 200,
        json: async () => fetchIndexEntries,
    };
    const fetchMockFirmware = {
        ok: true,
        body: {},
        status: 200,
        arrayBuffer: async () => firmwareBuffer,
    };
    const fetchMock = vi.fn((input: string | URL): typeof fetchMockFail | typeof fetchMockIndex | typeof fetchMockFirmware => {
        const url = typeof input === "string" ? input : input.toString();

        if (url.endsWith(".json")) {
            return fetchMockIndex;
        }

        if (!firmwareBuffer) {
            throw new Error("firmware buffer not provided");
        }

        return fetchMockFirmware;
    });

    beforeEach(() => {
        Device.resetCache();
        vi.stubGlobal("fetch", fetchMock);

        fetchIndexEntries = OTA_FILES.map((fileName, i) => {
            const [image] = loadImage(fileName);

            return buildIndexEntry(fileName, image, i);
        });
        firmwareBuffer = undefined;

        // @ts-expect-error not proper API, but here we just want to reset to default
        otaHelpers.setOtaConfiguration(undefined, undefined);
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllGlobals();

        for (const dir of tempDirs.splice(0)) {
            fs.rmSync(dir, {recursive: true, force: true});
        }
    });

    describe("Checks", () => {
        it("returns no image when index is empty", async () => {
            fetchIndexEntries = [];
            const {device} = createSimpleDevice({});
            const current: TClusterCommandPayload<"genOta", "queryNextImageRequest"> = {
                fieldControl: 0,
                manufacturerCode: 1234,
                imageType: 55,
                fileVersion: 10,
            };
            const result = await device.checkOta({}, current, {});

            expect(result).toStrictEqual({available: 0, current});
            expect(fetchMock).toHaveBeenCalledTimes(1);
        });

        it("performs notify flow when current payload is missing", async () => {
            const fileName = OTA_FILES[1];
            const [image, filePath] = loadImage(fileName);
            const {device, endpoint} = createDevice({image, source: {}, requestPayload: undefined});
            const result = await device.checkOta({}, undefined, {});

            expect(endpoint.commandResponse).toHaveBeenCalledWith(
                "genOta",
                "imageNotify",
                {payloadType: 0, queryJitter: 100},
                {sendPolicy: "immediate"},
            );
            expect(result).toStrictEqual({
                available: -1,
                availableMeta: expect.objectContaining({url: filePath}),
                current: {
                    fieldControl: 0,
                    manufacturerCode: image.header.manufacturerCode,
                    imageType: image.header.imageType,
                    fileVersion: image.header.fileVersion - 1,
                },
            });
        });

        it("matches OTA images using extra metadata overrides", async () => {
            const image = mockImage(512);
            const meta: ZigbeeOtaImageMeta = {
                fileName: "custom.ota",
                url: path.join(os.tmpdir(), "custom.ota"),
                manufacturerCode: image.header.manufacturerCode,
                imageType: image.header.imageType,
                fileVersion: image.header.fileVersion,
                modelId: "MatchedModel",
            };
            fetchIndexEntries = [meta];
            const {device} = createSimpleDevice({modelID: "OtherModel", manufacturerName: "OtherCo"});
            const current: TClusterCommandPayload<"genOta", "queryNextImageRequest"> = {
                fieldControl: 0,
                manufacturerCode: meta.manufacturerCode,
                imageType: meta.imageType,
                fileVersion: meta.fileVersion - 1,
            };
            const result = await device.checkOta({}, current, {modelId: "MatchedModel"});

            expect(result.available).toStrictEqual(-1);
            expect(result.availableMeta?.fileName).toStrictEqual(meta.fileName);
        });

        it("matches OTA images using manufacturer name and hardware ranges", async () => {
            const image = mockImage(128);
            const matchingMeta: ZigbeeOtaImageMeta = {
                fileName: "match.ota",
                url: path.join(os.tmpdir(), "match.ota"),
                manufacturerCode: image.header.manufacturerCode,
                imageType: image.header.imageType,
                fileVersion: image.header.fileVersion,
                manufacturerName: ["BrandA device"],
                hardwareVersionMin: 2,
                hardwareVersionMax: 5,
            };
            fetchIndexEntries = [matchingMeta];
            const current: TClusterCommandPayload<"genOta", "queryNextImageRequest"> = {
                fieldControl: 1,
                manufacturerCode: matchingMeta.manufacturerCode,
                imageType: matchingMeta.imageType,
                fileVersion: matchingMeta.fileVersion - 1,
                hardwareVersion: 3,
            };
            const {device} = createSimpleDevice({manufacturerName: "BrandA device", modelID: "ModelY"});
            const result = await device.checkOta({}, current, {});

            expect(result.available).toStrictEqual(-1);
            expect(result.availableMeta?.fileName).toStrictEqual("match.ota");
        });

        it("matches OTA images using extra manufacturer metadata when device manufacturer name mismatches", async () => {
            const image = mockImage(256);
            const matchingMeta: ZigbeeOtaImageMeta = {
                fileName: "extra-match.ota",
                url: path.join(os.tmpdir(), "extra-match.ota"),
                manufacturerCode: image.header.manufacturerCode,
                imageType: image.header.imageType,
                fileVersion: image.header.fileVersion,
                manufacturerName: ["AltBrand"],
                hardwareVersionMin: 10,
                hardwareVersionMax: 20,
            };
            fetchIndexEntries = [matchingMeta];
            const current: TClusterCommandPayload<"genOta", "queryNextImageRequest"> = {
                fieldControl: 0,
                manufacturerCode: matchingMeta.manufacturerCode,
                imageType: matchingMeta.imageType,
                fileVersion: matchingMeta.fileVersion - 2,
            };
            const {device} = createSimpleDevice({manufacturerName: "Mismatch", modelID: "ModelZ"});
            const result = await device.checkOta({}, current, {manufacturerName: "AltBrand", hardwareVersionMin: 12, hardwareVersionMax: 18});

            expect(result.available).toStrictEqual(-1);
            expect(result.availableMeta?.fileName).toStrictEqual("extra-match.ota");
        });

        it("handles failures when waiting for OTA notify response", async () => {
            const [image] = loadImage(OTA_FILES[0]);
            const {device} = createDevice({image, source: {}, requestPayload: undefined});
            // just need to trigger something called inside the right code path
            const frameSpy = vi.spyOn(Zcl.Frame, "fromBuffer").mockImplementationOnce(() => {
                throw new Error("corrupt-frame");
            });

            await expect(device.checkOta({}, undefined, {})).rejects.toThrow(/didn't respond to OTA request/);
            expect(frameSpy).toHaveBeenCalled();
        });

        it("fails when remote index fetching fails", async () => {
            fetchMock.mockResolvedValueOnce(fetchMockFail);

            const [image] = loadImage(OTA_FILES[0]);
            firmwareBuffer = image.raw;
            const requestPayload: TClusterCommandPayload<"genOta", "queryNextImageRequest"> = {
                fieldControl: 0,
                manufacturerCode: image.header.manufacturerCode,
                imageType: image.header.imageType,
                fileVersion: image.header.fileVersion - 1,
            };
            const {device, endpoint} = createSimpleDevice({});

            await expect(device.checkOta({}, requestPayload, {}, endpoint)).rejects.toThrow(/Invalid response from/);
        });

        it("merges override index (prio) with URL index", async () => {
            const fileName = "custom.ota";
            const image = mockImage(400, undefined, undefined, 333);
            firmwareBuffer = image.raw;
            const requestPayload: TClusterCommandPayload<"genOta", "queryNextImageRequest"> = {
                fieldControl: 0,
                manufacturerCode: image.header.manufacturerCode,
                imageType: image.header.imageType,
                fileVersion: image.header.fileVersion - 1,
            };
            const {device, endpoint, tempDir} = createSimpleDevice({});
            const getOtaIndexSpy = vi.spyOn(otaHelpers, "getOtaIndex");
            const filePath = writeMockImage(image, fileName, tempDir);
            const indexMeta = buildIndexEntry(fileName, image, undefined, filePath);

            fs.writeFileSync(path.join(tempDir, "my_override_index.json"), JSON.stringify([indexMeta]), "utf8");
            otaHelpers.setOtaConfiguration(tempDir, "my_override_index.json");

            const result = await device.checkOta({}, requestPayload, {}, endpoint);

            expect(result.available).toStrictEqual(-1);
            expect(result.availableMeta?.fileVersion).toStrictEqual(image.header.fileVersion);
            expect(getOtaIndexSpy).toHaveResolvedWith([indexMeta, ...fetchIndexEntries]);
        });

        it("auto-adds meta for override index local firmware when unspecified", async () => {
            const fileName = "custom.ota";
            const image = mockImage(512, undefined, undefined, 124);
            firmwareBuffer = image.raw;
            const requestPayload: TClusterCommandPayload<"genOta", "queryNextImageRequest"> = {
                fieldControl: 0,
                manufacturerCode: image.header.manufacturerCode,
                imageType: image.header.imageType,
                fileVersion: image.header.fileVersion - 1,
            };
            const {device, endpoint, tempDir} = createSimpleDevice({});
            const getOtaIndexSpy = vi.spyOn(otaHelpers, "getOtaIndex");
            const indexMeta = {url: fileName};

            writeMockImage(image, fileName, tempDir);
            fs.writeFileSync(path.join(tempDir, "my_override_index.json"), JSON.stringify([indexMeta]), "utf8");
            otaHelpers.setOtaConfiguration(tempDir, "my_override_index.json");

            const result = await device.checkOta({}, requestPayload, {}, endpoint);

            expect(result.available).toStrictEqual(-1);
            expect(result.availableMeta?.fileVersion).toStrictEqual(image.header.fileVersion);
            expect(getOtaIndexSpy).toHaveResolvedWith([
                {
                    url: fileName,
                    fileVersion: image.header.fileVersion,
                    imageType: image.header.imageType,
                    manufacturerCode: image.header.manufacturerCode,
                },
                ...fetchIndexEntries,
            ]);
        });

        it("allows use of remote override index even if URL index fetching fails", async () => {
            fetchMock.mockResolvedValueOnce(fetchMockIndex).mockResolvedValueOnce(fetchMockFail);
            const [image] = loadImage(OTA_FILES[0]);
            firmwareBuffer = image.raw;
            const requestPayload: TClusterCommandPayload<"genOta", "queryNextImageRequest"> = {
                fieldControl: 0,
                manufacturerCode: image.header.manufacturerCode,
                imageType: image.header.imageType,
                fileVersion: image.header.fileVersion - 1,
            };
            const {device, endpoint, tempDir} = createSimpleDevice({});
            const infoSpy = vi.spyOn(logger, "info");

            otaHelpers.setOtaConfiguration(tempDir, "https://example.com/index.json");

            const result = await device.checkOta({}, requestPayload, {}, endpoint);

            expect(result.available).toStrictEqual(-1);
            expect(result.availableMeta?.fileVersion).toStrictEqual(requestPayload.fileVersion + 1);
            expect(infoSpy).toHaveBeenCalledWith("Failed to download main index, only override index is loaded", "zh:controller:ota");
        });

        it("allows use of local override index even if default URL index fetching fails", async () => {
            fetchMock.mockResolvedValueOnce(fetchMockFail);

            const fileName = OTA_FILES[0];
            const [image] = loadImage(fileName);
            firmwareBuffer = image.raw;
            const requestPayload: TClusterCommandPayload<"genOta", "queryNextImageRequest"> = {
                fieldControl: 0,
                manufacturerCode: image.header.manufacturerCode,
                imageType: image.header.imageType,
                fileVersion: image.header.fileVersion - 1,
            };
            const {device, endpoint, tempDir} = createSimpleDevice({});
            const infoSpy = vi.spyOn(logger, "info");
            const getOtaIndexSpy = vi.spyOn(otaHelpers, "getOtaIndex");
            const indexMeta = buildIndexEntry(fileName, image, undefined, path.join(tempDir, fileName));

            fs.writeFileSync(path.join(tempDir, "my_index.json"), JSON.stringify([indexMeta]), "utf8");
            otaHelpers.setOtaConfiguration(tempDir, "my_index.json");

            const result = await device.checkOta({}, requestPayload, {}, endpoint);

            expect(result.available).toStrictEqual(-1);
            expect(result.availableMeta?.fileVersion).toStrictEqual(requestPayload.fileVersion + 1);
            expect(fetchMock).toHaveBeenCalledWith("https://raw.githubusercontent.com/Koenkk/zigbee-OTA/master/index.json");
            expect(infoSpy).toHaveBeenCalledWith("Failed to download main index, only override index is loaded", "zh:controller:ota");
            expect(getOtaIndexSpy).toHaveResolvedWith([indexMeta]);
        });

        it("allows use of local override index even if custom URL index fetching fails", async () => {
            fetchMock.mockResolvedValueOnce(fetchMockFail);

            const fileName = OTA_FILES[1];
            const [image] = loadImage(fileName);
            firmwareBuffer = image.raw;
            const {device, endpoint, tempDir} = createDevice({image, source: {}, requestPayload: undefined});
            const infoSpy = vi.spyOn(logger, "info");
            const getOtaIndexSpy = vi.spyOn(otaHelpers, "getOtaIndex");
            const indexMeta = buildIndexEntry(fileName, image, undefined, path.join(tempDir, fileName));

            fs.writeFileSync(path.join(tempDir, "my_index.json"), JSON.stringify([indexMeta]), "utf8");
            otaHelpers.setOtaConfiguration(tempDir, "my_index.json");

            const result = await device.checkOta({url: "https://example.com/index.json"}, undefined, {}, endpoint);

            expect(result.available).toStrictEqual(-1);
            expect(result.availableMeta?.fileVersion).toStrictEqual(image.header.fileVersion);
            expect(fetchMock).toHaveBeenCalledWith("https://example.com/index.json");
            expect(infoSpy).toHaveBeenCalledWith("Failed to download main index, only override index is loaded", "zh:controller:ota");
            expect(getOtaIndexSpy).toHaveResolvedWith([indexMeta]);
        });

        it.each([
            "lumi.airrtc.agl001",
            "lumi.curtain.acn003",
            "lumi.curtain.agl001",
        ])("overrides %s file version with meta and reports upgrade availability", async (modelID) => {
            const fileName = OTA_FILES[0];
            const [image, filePath] = loadImage(fileName);
            const {device} = createSimpleDevice({
                modelID,
                manufacturerName: "Aqara",
                meta: {lumiFileVersion: image.header.fileVersion - 1},
            });
            const current: TClusterCommandPayload<"genOta", "queryNextImageRequest"> = {
                fieldControl: 0,
                manufacturerCode: image.header.manufacturerCode,
                imageType: image.header.imageType,
                fileVersion: 1,
            };
            const result = await device.checkOta({}, current, {});

            expect(result).toStrictEqual({
                current: {...current, fileVersion: image.header.fileVersion - 1},
                available: -1,
                availableMeta: {
                    fileName,
                    fileVersion: image.header.fileVersion,
                    imageType: current.imageType,
                    manufacturerCode: current.manufacturerCode,
                    url: filePath,
                    sha512: OTA_FILES_SHA512[0],
                },
            });
            expect(fetchMock).toHaveBeenCalledTimes(1);
        });

        it("writes scenes group before checking OTA for PP-WHT-US", async () => {
            const fileName = OTA_FILES[2];
            const [image, filePath] = loadImage(fileName);
            const {device} = createSimpleDevice({modelID: "PP-WHT-US", manufacturerName: "Lutron"});
            const scenesEndpoint = {
                ID: 2,
                supportsOutputCluster: vi.fn((clusterKey: number | string) => clusterKey === "genScenes"),
                write: vi.fn().mockResolvedValue(undefined),
            } as unknown as Endpoint;

            device.endpoints.push(scenesEndpoint);

            const current: TClusterCommandPayload<"genOta", "queryNextImageRequest"> = {
                fieldControl: 0,
                manufacturerCode: image.header.manufacturerCode,
                imageType: image.header.imageType,
                fileVersion: image.header.fileVersion - 1,
            };
            const result = await device.checkOta({}, current, {});

            expect(scenesEndpoint.write).toHaveBeenCalledWith("genScenes", {currentGroup: 49502});
            expect(result.availableMeta?.url).toStrictEqual(filePath);
        });
    });

    describe("Updates", () => {
        let debugSpy: ReturnType<typeof vi.spyOn> | undefined;

        beforeEach(() => {
            debugSpy = vi.spyOn(logger, "debug").mockImplementation(() => {});
        });

        afterEach(() => {
            debugSpy?.mockRestore();
            debugSpy = undefined;
        });

        it.each(OTA_FILES)("applies an upgrade image end-to-end (%s)", async (fileName) => {
            const [image] = loadImage(fileName);
            firmwareBuffer = image.raw;
            const requestPayload: TClusterCommandPayload<"genOta", "queryNextImageRequest"> = {
                fieldControl: 0,
                manufacturerCode: image.header.manufacturerCode,
                imageType: image.header.imageType,
                fileVersion: image.header.fileVersion - 1,
            };
            const baseSize = 64;
            const expectedBlocks = Math.ceil(image.header.totalImageSize / baseSize);

            const {device, endpoint, run, onProgress} = createDevice({
                image,
                source: {},
                requestPayload,
                dataSettings: {requestTimeout: 1000, responseDelay: 0, baseSize},
                behavior: {baseSize, sendUpgradeEnd: true},
            });

            const [from, to] = await run();

            expect(from.fileVersion).toStrictEqual(requestPayload.fileVersion);
            expect(to?.fileVersion).toStrictEqual(image.header.fileVersion);
            expect(endpoint.commandResponse).toHaveBeenCalledWith(
                "genOta",
                "queryNextImageResponse",
                expect.objectContaining({status: Zcl.Status.SUCCESS}),
                undefined,
                1,
            );
            expect(getResponses(endpoint, "imageBlockResponse").length).toStrictEqual(expectedBlocks);
            const calls = getResponses(endpoint, "imageBlockResponse");
            const lastOffset = (expectedBlocks - 1) * baseSize;
            const lastSize = image.header.totalImageSize - lastOffset;
            expect(calls[0][2]).toEqual(expect.objectContaining({fileOffset: 0, dataSize: baseSize, data: image.raw.subarray(0, baseSize)}));
            expect(calls[1][2]).toEqual(
                expect.objectContaining({fileOffset: baseSize, dataSize: baseSize, data: image.raw.subarray(baseSize, baseSize * 2)}),
            );
            expect(calls[2][2]).toEqual(
                expect.objectContaining({fileOffset: baseSize * 2, dataSize: baseSize, data: image.raw.subarray(baseSize * 2, baseSize * 3)}),
            );
            expect(calls[expectedBlocks - 1][2]).toEqual(
                expect.objectContaining({fileOffset: lastOffset, dataSize: lastSize, data: image.raw.subarray(image.raw.length - lastSize)}),
            );
            expect(getResponses(endpoint, "upgradeEndResponse").length).toStrictEqual(1);
            expect(onProgress).toHaveBeenCalled();
            expect(device.otaInProgress).toStrictEqual(false);
        });

        it("applies a downgrade image end-to-end", async () => {
            const fileName = OTA_FILES[0];
            const [image, filePath] = loadImage(fileName);
            firmwareBuffer = image.raw;
            const requestPayload: TClusterCommandPayload<"genOta", "queryNextImageRequest"> = {
                fieldControl: 0,
                manufacturerCode: image.header.manufacturerCode,
                imageType: image.header.imageType,
                fileVersion: image.header.fileVersion + 1,
            };
            const baseSize = 64;
            const expectedBlocks = Math.ceil(image.header.totalImageSize / baseSize);
            const logDebugSpy = vi.spyOn(logger, "debug");

            const {device, endpoint, run, onProgress} = createDevice({
                image,
                source: {downgrade: true},
                requestPayload,
                dataSettings: {requestTimeout: 1000, responseDelay: 0, baseSize},
                behavior: {baseSize, sendUpgradeEnd: true},
            });

            const [from, to] = await run();

            expect(from.fileVersion).toStrictEqual(requestPayload.fileVersion);
            expect(to?.fileVersion).toStrictEqual(image.header.fileVersion);
            expect(endpoint.commandResponse).toHaveBeenCalledWith(
                "genOta",
                "queryNextImageResponse",
                expect.objectContaining({status: Zcl.Status.SUCCESS}),
                undefined,
                1,
            );
            expect(getResponses(endpoint, "imageBlockResponse").length).toStrictEqual(expectedBlocks);
            const calls = getResponses(endpoint, "imageBlockResponse");
            const lastOffset = (expectedBlocks - 1) * baseSize;
            const lastSize = image.header.totalImageSize - lastOffset;
            expect(calls[0][2]).toEqual(expect.objectContaining({fileOffset: 0, dataSize: baseSize, data: image.raw.subarray(0, baseSize)}));
            expect(calls[1][2]).toEqual(
                expect.objectContaining({fileOffset: baseSize, dataSize: baseSize, data: image.raw.subarray(baseSize, baseSize * 2)}),
            );
            expect(calls[2][2]).toEqual(
                expect.objectContaining({fileOffset: baseSize * 2, dataSize: baseSize, data: image.raw.subarray(baseSize * 2, baseSize * 3)}),
            );
            expect(calls[expectedBlocks - 1][2]).toEqual(
                expect.objectContaining({fileOffset: lastOffset, dataSize: lastSize, data: image.raw.subarray(image.raw.length - lastSize)}),
            );
            expect(getResponses(endpoint, "upgradeEndResponse").length).toStrictEqual(1);
            expect(onProgress).toHaveBeenCalled();

            const debugCalls = logDebugSpy.mock.calls.map((c) => (typeof c[0] === "string" ? c[0] : c[0]()));
            expect(debugCalls[0]).toMatch("Checking OTA 0x1 downgrade image availability");
            expect(debugCalls[1]).toMatch("Getting image metadata for 0x1...");
            expect(debugCalls[2]).toMatch("OTA downgrade image availability for 0x1");
            expect(debugCalls[3]).toMatch(`Reading firmware image from '${filePath}'`);
            expect(debugCalls[4]).toMatch(`Parsed image from '${filePath}' for 0x1`);
            expect(device.otaInProgress).toStrictEqual(false);
        });

        it("considers an upgrade successful even if no device announce", async () => {
            const fileName = OTA_FILES[0];
            const [image] = loadImage(fileName);
            firmwareBuffer = image.raw;
            const baseSize = 64;

            vi.useFakeTimers();

            try {
                const {run, device} = createDevice({
                    image,
                    source: {},
                    dataSettings: {requestTimeout: 1000, responseDelay: 0, baseSize},
                    behavior: {baseSize, sendUpgradeEnd: true},
                    autoAnnounce: false,
                });
                const promise = run();

                await vi.advanceTimersByTimeAsync(120000);

                const [from, to] = await promise;

                expect(from.fileVersion).toStrictEqual(image.header.fileVersion - 1);
                expect(to?.fileVersion).toStrictEqual(image.header.fileVersion);
                expect(device.otaInProgress).toStrictEqual(false);
            } finally {
                vi.useRealTimers();
            }
        });

        it("handles out-of-order block offsets", async () => {
            const fileName = OTA_FILES[0];
            const [image] = loadImage(fileName);
            firmwareBuffer = image.raw;
            const requestPayload: TClusterCommandPayload<"genOta", "queryNextImageRequest"> = {
                fieldControl: 0,
                manufacturerCode: image.header.manufacturerCode,
                imageType: image.header.imageType,
                fileVersion: image.header.fileVersion - 1,
            };
            const baseSize = 50;
            const expectedBlocks = Math.ceil(image.header.totalImageSize / baseSize);

            const {device, endpoint, run, onProgress} = createDevice({
                image,
                source: {},
                requestPayload,
                dataSettings: {requestTimeout: 1000, responseDelay: 0, baseSize},
                behavior: {baseSize, sendUpgradeEnd: true, shuffleOffsets: true},
            });

            const [from, to] = await run();

            expect(from.fileVersion).toStrictEqual(requestPayload.fileVersion);
            expect(to?.fileVersion).toStrictEqual(image.header.fileVersion);
            expect(getResponses(endpoint, "imageBlockResponse").length).toStrictEqual(expectedBlocks);
            expect(endpoint.commandResponse).toHaveBeenCalledWith(
                "genOta",
                "queryNextImageResponse",
                expect.objectContaining({status: Zcl.Status.SUCCESS}),
                undefined,
                1,
            );
            const calls = getResponses(endpoint, "imageBlockResponse");
            const lastOffset = (expectedBlocks - 1) * baseSize;
            const lastSize = image.header.totalImageSize - lastOffset;
            expect(calls[0][2]).toEqual(expect.objectContaining({fileOffset: 0, dataSize: baseSize, data: image.raw.subarray(0, baseSize)}));
            expect(calls[1][2]).toEqual(
                expect.objectContaining({
                    fileOffset: baseSize * 2,
                    dataSize: baseSize,
                    data: image.raw.subarray(baseSize * 2, baseSize * 3),
                }),
            );
            expect(calls[2][2]).toEqual(
                expect.objectContaining({fileOffset: baseSize, dataSize: baseSize, data: image.raw.subarray(baseSize, baseSize * 2)}),
            );
            expect(calls[expectedBlocks - 1][2]).toEqual(
                expect.objectContaining({fileOffset: lastOffset, dataSize: lastSize, data: image.raw.subarray(image.raw.length - lastSize)}),
            );
            expect(getResponses(endpoint, "upgradeEndResponse").length).toStrictEqual(1);
            expect(onProgress).toHaveBeenCalled();
            expect(device.otaInProgress).toStrictEqual(false);
        });

        it("handles negative misaligned block offset - resends portion already sent", async () => {
            const fileName = OTA_FILES[0];
            const [image] = loadImage(fileName);
            firmwareBuffer = image.raw;
            const requestPayload: TClusterCommandPayload<"genOta", "queryNextImageRequest"> = {
                fieldControl: 0,
                manufacturerCode: image.header.manufacturerCode,
                imageType: image.header.imageType,
                fileVersion: image.header.fileVersion - 1,
            };
            const baseSize = 64;
            const misalignedOffset = -15;
            const expectedBlocks = Math.ceil((image.header.totalImageSize - misalignedOffset) / baseSize);

            const {device, endpoint, run, onProgress} = createDevice({
                image,
                source: {},
                requestPayload,
                dataSettings: {requestTimeout: 1000, responseDelay: 0, baseSize},
                behavior: {baseSize, sendUpgradeEnd: true, misalignedOffset},
            });

            const [from, to] = await run();

            expect(from.fileVersion).toStrictEqual(requestPayload.fileVersion);
            expect(to?.fileVersion).toStrictEqual(image.header.fileVersion);
            expect(getResponses(endpoint, "imageBlockResponse").length).toStrictEqual(expectedBlocks);
            expect(endpoint.commandResponse).toHaveBeenCalledWith(
                "genOta",
                "queryNextImageResponse",
                expect.objectContaining({status: Zcl.Status.SUCCESS}),
                undefined,
                1,
            );
            const calls = getResponses(endpoint, "imageBlockResponse");
            const lastOffset = (expectedBlocks - 1) * baseSize + misalignedOffset;
            const lastSize = image.header.totalImageSize - lastOffset;
            expect(calls[0][2]).toEqual(expect.objectContaining({fileOffset: 0, dataSize: baseSize, data: image.raw.subarray(0, baseSize)}));
            expect(calls[1][2]).toEqual(
                expect.objectContaining({
                    fileOffset: baseSize + misalignedOffset,
                    dataSize: baseSize,
                    data: image.raw.subarray(baseSize + misalignedOffset, baseSize * 2 + misalignedOffset),
                }),
            );
            expect(calls[2][2]).toEqual(
                expect.objectContaining({
                    fileOffset: baseSize * 2 + misalignedOffset,
                    dataSize: baseSize,
                    data: image.raw.subarray(baseSize * 2 + misalignedOffset, baseSize * 3 + misalignedOffset),
                }),
            );
            expect(calls[expectedBlocks - 1][2]).toEqual(
                expect.objectContaining({fileOffset: lastOffset, dataSize: lastSize, data: image.raw.subarray(image.raw.length - lastSize)}),
            );
            expect(getResponses(endpoint, "upgradeEndResponse").length).toStrictEqual(1);
            expect(onProgress).toHaveBeenCalled();
            expect(device.otaInProgress).toStrictEqual(false);
        });

        it("handles positive misaligned block offset - skips portion", async () => {
            const fileName = OTA_FILES[0];
            const [image] = loadImage(fileName);
            firmwareBuffer = image.raw;
            const requestPayload: TClusterCommandPayload<"genOta", "queryNextImageRequest"> = {
                fieldControl: 0,
                manufacturerCode: image.header.manufacturerCode,
                imageType: image.header.imageType,
                fileVersion: image.header.fileVersion - 1,
            };
            const baseSize = 50;
            const misalignedOffset = 17;
            const expectedBlocks = Math.ceil((image.header.totalImageSize - misalignedOffset) / baseSize);

            const {device, endpoint, run, onProgress} = createDevice({
                image,
                source: {},
                requestPayload,
                dataSettings: {requestTimeout: 1000, responseDelay: 0, baseSize},
                behavior: {baseSize, sendUpgradeEnd: true, misalignedOffset},
            });

            const [from, to] = await run();

            expect(from.fileVersion).toStrictEqual(requestPayload.fileVersion);
            expect(to?.fileVersion).toStrictEqual(image.header.fileVersion);
            expect(getResponses(endpoint, "imageBlockResponse").length).toStrictEqual(expectedBlocks);
            expect(endpoint.commandResponse).toHaveBeenCalledWith(
                "genOta",
                "queryNextImageResponse",
                expect.objectContaining({status: Zcl.Status.SUCCESS}),
                undefined,
                1,
            );
            const calls = getResponses(endpoint, "imageBlockResponse");
            const lastOffset = (expectedBlocks - 1) * baseSize + misalignedOffset;
            const lastSize = image.header.totalImageSize - lastOffset;
            expect(calls[0][2]).toEqual(expect.objectContaining({fileOffset: 0, dataSize: baseSize, data: image.raw.subarray(0, baseSize)}));
            expect(calls[1][2]).toEqual(
                expect.objectContaining({
                    fileOffset: baseSize + misalignedOffset,
                    dataSize: baseSize,
                    data: image.raw.subarray(baseSize + misalignedOffset, baseSize * 2 + misalignedOffset),
                }),
            );
            expect(calls[2][2]).toEqual(
                expect.objectContaining({
                    fileOffset: baseSize * 2 + misalignedOffset,
                    dataSize: baseSize,
                    data: image.raw.subarray(baseSize * 2 + misalignedOffset, baseSize * 3 + misalignedOffset),
                }),
            );
            expect(calls[expectedBlocks - 1][2]).toEqual(
                expect.objectContaining({fileOffset: lastOffset, dataSize: lastSize, data: image.raw.subarray(image.raw.length - lastSize)}),
            );
            expect(getResponses(endpoint, "upgradeEndResponse").length).toStrictEqual(1);
            expect(onProgress).toHaveBeenCalled();
            expect(device.otaInProgress).toStrictEqual(false);
        });

        it("handles page requests and reports progress", async () => {
            const fileName = OTA_FILES[0];
            const [image] = loadImage(fileName);
            firmwareBuffer = image.raw;
            const requestPayload: TClusterCommandPayload<"genOta", "queryNextImageRequest"> = {
                fieldControl: 0,
                manufacturerCode: image.header.manufacturerCode,
                imageType: image.header.imageType,
                fileVersion: image.header.fileVersion - 1,
            };
            const baseSize = 52;
            const pageSize = 128;
            const expectedBlocks = (() => {
                let remaining = image.header.totalImageSize;
                let blocks = 0;

                while (remaining > 0) {
                    const page = Math.min(pageSize, remaining);
                    blocks += Math.ceil(page / baseSize);
                    remaining -= page;
                }

                return blocks;
            })();

            const {device, endpoint, run, onProgress} = createDevice({
                image,
                source: {},
                requestPayload,
                dataSettings: {requestTimeout: 1000, responseDelay: 0, baseSize},
                behavior: {baseSize, sendUpgradeEnd: true, usePageRequests: true, pageSize},
            });

            const [from, to] = await run();

            expect(from.fileVersion).toStrictEqual(requestPayload.fileVersion);
            expect(to?.fileVersion).toStrictEqual(image.header.fileVersion);
            expect(endpoint.commandResponse).toHaveBeenCalledWith(
                "genOta",
                "queryNextImageResponse",
                expect.objectContaining({status: Zcl.Status.SUCCESS}),
                undefined,
                1,
            );
            expect(getResponses(endpoint, "imageBlockResponse").length).toStrictEqual(expectedBlocks);
            const calls = getResponses(endpoint, "imageBlockResponse");
            const firstPageRemainder = Math.min(pageSize, image.header.totalImageSize) - baseSize * 2;
            expect(calls[0][2]).toEqual(expect.objectContaining({fileOffset: 0, dataSize: baseSize, data: image.raw.subarray(0, baseSize)}));
            expect(calls[1][2]).toEqual(
                expect.objectContaining({fileOffset: baseSize, dataSize: baseSize, data: image.raw.subarray(baseSize, baseSize * 2)}),
            );
            expect(calls[2][2]).toEqual(
                expect.objectContaining({
                    fileOffset: baseSize * 2,
                    dataSize: firstPageRemainder,
                    data: image.raw.subarray(baseSize * 2, baseSize * 2 + firstPageRemainder),
                }),
            );
            const lastCallPayload = calls[calls.length - 1][2] as unknown as {
                fileOffset: number;
                dataSize: number;
                data: Buffer;
            };
            expect(lastCallPayload.data).toStrictEqual(
                image.raw.subarray(lastCallPayload.fileOffset, lastCallPayload.fileOffset + lastCallPayload.dataSize),
            );
            expect(getResponses(endpoint, "upgradeEndResponse").length).toStrictEqual(1);
            expect(onProgress).toHaveBeenCalled();
            expect(device.otaInProgress).toStrictEqual(false);
        });

        it("applies manufacturer-specific timeout", async () => {
            const fileName = "custom.ota";
            const image = mockImage(400, Zcl.ManufacturerCode.ROBERT_BOSCH_GMBH, 33);
            const filePath = writeMockImage(image, fileName);
            const meta: ZigbeeOtaImageMeta = {
                fileName,
                url: filePath,
                manufacturerCode: image.header.manufacturerCode,
                imageType: image.header.imageType,
                fileVersion: image.header.fileVersion,
            };
            fetchIndexEntries = [meta];
            firmwareBuffer = image.raw;
            const requestPayload: TClusterCommandPayload<"genOta", "queryNextImageRequest"> = {
                fieldControl: 0,
                manufacturerCode: image.header.manufacturerCode,
                imageType: image.header.imageType,
                fileVersion: image.header.fileVersion - 1,
            };
            const baseSize = 50;
            const expectedBlocks = Math.ceil(image.header.totalImageSize / baseSize);
            const dataSettings: OtaDataSettings = {requestTimeout: 150000, responseDelay: 0, baseSize};
            const {run, device, endpoint} = createDevice({
                image,
                source: {},
                requestPayload,
                dataSettings,
                behavior: {baseSize, sendUpgradeEnd: true},
            });
            const [from, to] = await run();

            expect(from.fileVersion).toStrictEqual(requestPayload.fileVersion);
            expect(to?.fileVersion).toStrictEqual(image.header.fileVersion);
            expect(endpoint.commandResponse).toHaveBeenCalledWith(
                "genOta",
                "queryNextImageResponse",
                expect.objectContaining({status: Zcl.Status.SUCCESS, imageSize: image.header.totalImageSize}),
                undefined,
                1,
            );
            expect(getResponses(endpoint, "imageBlockResponse").length).toStrictEqual(expectedBlocks);
            expect(dataSettings.requestTimeout).toStrictEqual(60 * 60 * 1000);
            expect(dataSettings.responseDelay).toStrictEqual(0);
            expect(device.otaInProgress).toStrictEqual(false);
        });

        it("applies manufacturer-specific and imageType-specific timeout", async () => {
            const fileName = "custom.ota";
            const image = mockImage(311, Zcl.ManufacturerCode.SHENZHEN_COOLKIT_TECHNOLOGY_CO_LTD, 8199);
            const filePath = writeMockImage(image, fileName);
            const meta: ZigbeeOtaImageMeta = {
                fileName,
                url: filePath,
                manufacturerCode: image.header.manufacturerCode,
                imageType: image.header.imageType,
                fileVersion: image.header.fileVersion,
            };
            fetchIndexEntries = [meta];
            firmwareBuffer = image.raw;
            const requestPayload: TClusterCommandPayload<"genOta", "queryNextImageRequest"> = {
                fieldControl: 0,
                manufacturerCode: image.header.manufacturerCode,
                imageType: image.header.imageType,
                fileVersion: image.header.fileVersion - 1,
            };
            const baseSize = 50;
            const expectedBlocks = Math.ceil(image.header.totalImageSize / baseSize);
            const dataSettings: OtaDataSettings = {requestTimeout: 150000, responseDelay: 0, baseSize};
            const {run, device, endpoint} = createDevice({
                image,
                source: {},
                requestPayload,
                dataSettings,
                behavior: {baseSize, sendUpgradeEnd: true},
            });
            const [from, to] = await run();

            expect(from.fileVersion).toStrictEqual(requestPayload.fileVersion);
            expect(to?.fileVersion).toStrictEqual(image.header.fileVersion);
            expect(endpoint.commandResponse).toHaveBeenCalledWith(
                "genOta",
                "queryNextImageResponse",
                expect.objectContaining({status: Zcl.Status.SUCCESS, imageSize: image.header.totalImageSize}),
                undefined,
                1,
            );
            expect(getResponses(endpoint, "imageBlockResponse").length).toStrictEqual(expectedBlocks);
            expect(dataSettings.requestTimeout).toStrictEqual(3600000);
            expect(dataSettings.responseDelay).toStrictEqual(0);
            expect(device.otaInProgress).toStrictEqual(false);
        });

        it("applies manufacturer-specific data size", async () => {
            const fileName = "custom.ota";
            const image = mockImage(400, Zcl.ManufacturerCode.INSTA_GMBH, 33);
            const filePath = writeMockImage(image, fileName);
            const meta: ZigbeeOtaImageMeta = {
                fileName,
                url: filePath,
                manufacturerCode: image.header.manufacturerCode,
                imageType: image.header.imageType,
                fileVersion: image.header.fileVersion,
            };
            fetchIndexEntries = [meta];
            firmwareBuffer = image.raw;
            const requestPayload: TClusterCommandPayload<"genOta", "queryNextImageRequest"> = {
                fieldControl: 0,
                manufacturerCode: image.header.manufacturerCode,
                imageType: image.header.imageType,
                fileVersion: image.header.fileVersion - 1,
            };
            const baseSize = 64;
            const dataSettings: OtaDataSettings = {requestTimeout: 150000, responseDelay: 0, baseSize};
            const {run, device, endpoint} = createDevice({
                image,
                source: {},
                requestPayload,
                dataSettings,
                behavior: {baseSize, sendUpgradeEnd: true},
            });
            const [from, to] = await run();

            expect(from.fileVersion).toStrictEqual(requestPayload.fileVersion);
            expect(to?.fileVersion).toStrictEqual(image.header.fileVersion);
            expect(endpoint.commandResponse).toHaveBeenCalledWith(
                "genOta",
                "queryNextImageResponse",
                expect.objectContaining({status: Zcl.Status.SUCCESS, imageSize: image.header.totalImageSize}),
                undefined,
                1,
            );
            const responses = getResponses(endpoint, "imageBlockResponse");
            expect(responses[0][2]).toStrictEqual(expect.objectContaining({dataSize: 40}));
            expect(responses[1][2]).toStrictEqual(expect.objectContaining({dataSize: 40}));
            expect(device.otaInProgress).toStrictEqual(false);
        });

        it("handles URL as source URL", async () => {
            const fileName = "custom.ota";
            // coverage for more manufacturer-specific timeout
            const image = mockImage(400, Zcl.ManufacturerCode.LEGRAND_GROUP, 1000);
            const filePath = writeMockImage(image, fileName);
            const meta: ZigbeeOtaImageMeta = {
                fileName,
                url: filePath,
                manufacturerCode: image.header.manufacturerCode,
                imageType: image.header.imageType,
                fileVersion: image.header.fileVersion,
            };
            fetchIndexEntries = [meta];
            firmwareBuffer = image.raw;
            const requestPayload: TClusterCommandPayload<"genOta", "queryNextImageRequest"> = {
                fieldControl: 0,
                manufacturerCode: image.header.manufacturerCode,
                imageType: image.header.imageType,
                fileVersion: image.header.fileVersion - 1,
            };
            const baseSize = 50;
            const expectedBlocks = Math.ceil(image.header.totalImageSize / baseSize);
            const dataSettings: OtaDataSettings = {requestTimeout: 150000, responseDelay: 0, baseSize};
            const {run, device, endpoint} = createDevice({
                image,
                source: {url: "https://example.com/fw.ota"},
                requestPayload,
                dataSettings,
                behavior: {baseSize, sendUpgradeEnd: true},
            });
            const [from, to] = await run();

            expect(from.fileVersion).toStrictEqual(requestPayload.fileVersion);
            expect(to?.fileVersion).toStrictEqual(image.header.fileVersion);
            expect(endpoint.commandResponse).toHaveBeenCalledWith(
                "genOta",
                "queryNextImageResponse",
                expect.objectContaining({status: Zcl.Status.SUCCESS, imageSize: image.header.totalImageSize}),
                undefined,
                1,
            );
            expect(getResponses(endpoint, "imageBlockResponse").length).toStrictEqual(expectedBlocks);
            expect(dataSettings.requestTimeout).toStrictEqual(30 * 60 * 1000);
            expect(dataSettings.responseDelay).toStrictEqual(0);
            expect(device.otaInProgress).toStrictEqual(false);
        });

        it("handles filesystem as source URL", async () => {
            const fileName = "custom.ota";
            const image = mockImage(400);
            const filePath = writeMockImage(image, fileName);
            const meta: ZigbeeOtaImageMeta = {
                fileName,
                url: filePath,
                manufacturerCode: image.header.manufacturerCode,
                imageType: image.header.imageType,
                fileVersion: image.header.fileVersion,
            };
            fetchIndexEntries = [meta];
            firmwareBuffer = image.raw;
            const requestPayload: TClusterCommandPayload<"genOta", "queryNextImageRequest"> = {
                fieldControl: 0,
                manufacturerCode: image.header.manufacturerCode,
                imageType: image.header.imageType,
                fileVersion: image.header.fileVersion + 1,
            };
            const baseSize = 60;
            const expectedBlocks = Math.ceil(image.header.totalImageSize / baseSize);
            const dataSettings: OtaDataSettings = {requestTimeout: 150000, responseDelay: 0, baseSize};
            const {run, device, endpoint} = createDevice({
                image,
                source: {url: filePath, downgrade: true},
                requestPayload,
                dataSettings,
                behavior: {baseSize, sendUpgradeEnd: true},
            });
            const [from, to] = await run();

            expect(from.fileVersion).toStrictEqual(requestPayload.fileVersion);
            expect(to?.fileVersion).toStrictEqual(image.header.fileVersion);
            expect(endpoint.commandResponse).toHaveBeenCalledWith(
                "genOta",
                "queryNextImageResponse",
                expect.objectContaining({status: Zcl.Status.SUCCESS, imageSize: image.header.totalImageSize}),
                undefined,
                1,
            );
            expect(getResponses(endpoint, "imageBlockResponse").length).toStrictEqual(expectedBlocks);
            expect(dataSettings.requestTimeout).toStrictEqual(150000);
            expect(dataSettings.responseDelay).toStrictEqual(0);
            expect(device.otaInProgress).toStrictEqual(false);
        });

        it("applies fallback timeouts when manufacturer is unknown", async () => {
            const image = mockImage(240, 0x1234);
            firmwareBuffer = image.raw;
            const requestPayload: TClusterCommandPayload<"genOta", "queryNextImageRequest"> = {
                fieldControl: 0,
                manufacturerCode: image.header.manufacturerCode,
                imageType: image.header.imageType,
                fileVersion: image.header.fileVersion - 1,
            };
            const dataSettings: OtaDataSettings = {requestTimeout: 0, responseDelay: 0, baseSize: 0};
            const {run, device, endpoint} = createDevice({
                image,
                source: {url: "https://example.com/fw.ota"},
                requestPayload,
                dataSettings,
                behavior: {baseSize: 50, sendUpgradeEnd: true},
            });
            const [from, to] = await run();

            expect(from.fileVersion).toStrictEqual(requestPayload.fileVersion);
            expect(to?.fileVersion).toStrictEqual(image.header.fileVersion);
            expect(endpoint.commandResponse).toHaveBeenCalledWith(
                "genOta",
                "queryNextImageResponse",
                expect.objectContaining({status: Zcl.Status.SUCCESS}),
                undefined,
                1,
            );
            expect(dataSettings.requestTimeout).toStrictEqual(150000);
            expect(dataSettings.baseSize).toStrictEqual(50);
            expect(dataSettings.responseDelay).toStrictEqual(0);
            expect(device.otaInProgress).toStrictEqual(false);
        });

        it("calls onProgress with round blocks", async () => {
            const fileName = "custom.ota";
            const image = mockImage(320);
            const filePath = writeMockImage(image, fileName);
            const meta: ZigbeeOtaImageMeta = {
                fileName,
                url: filePath,
                manufacturerCode: image.header.manufacturerCode,
                imageType: image.header.imageType,
                fileVersion: image.header.fileVersion,
            };
            fetchIndexEntries = [meta];
            firmwareBuffer = image.raw;
            const requestPayload: TClusterCommandPayload<"genOta", "queryNextImageRequest"> = {
                fieldControl: 0,
                manufacturerCode: image.header.manufacturerCode,
                imageType: image.header.imageType,
                fileVersion: image.header.fileVersion - 1,
            };
            const baseSize = 40;
            const dataSettings: OtaDataSettings = {requestTimeout: 10, responseDelay: 0, baseSize};
            // Mock time to ensure progress is reported at regular intervals
            let currentTime = 0;
            const timeDelays = [
                0, // constructor
                100, // first block request (offset 0, no progress yet)
                100,
                30100, // second block request (offset 40, triggers 12.5% progress)
                100,
                30100, // third block request (offset 80, triggers 25% progress)
                100,
                30100, // fourth block request (offset 120, triggers 37.5% progress)
                100,
                30100, // fifth block request (offset 160, triggers 50% progress)
                100,
                30100, // sixth block request (offset 200, triggers 62.5% progress)
                100,
                30100, // seventh block request (offset 240, triggers 75% progress)
                100,
                30100, // eighth block request (offset 280, triggers 87.5% progress)
                100,
            ];
            const nowSpy = vi.spyOn(performance, "now").mockImplementation(() => {
                const next = timeDelays.shift();
                // For any additional calls, add small time
                currentTime += next ?? 100;

                return currentTime;
            });

            const {run, device, onProgress} = createDevice({
                image,
                source: {url: "https://example.com/fw.ota"},
                requestPayload,
                dataSettings,
                behavior: {baseSize, sendUpgradeEnd: true},
            });

            const [from, to] = await run();
            nowSpy.mockRestore();

            expect(from.fileVersion).toStrictEqual(requestPayload.fileVersion);
            expect(to?.fileVersion).toStrictEqual(image.header.fileVersion);

            // With 320 bytes and 40-byte chunks, we have 8 blocks
            expect(onProgress).toHaveBeenNthCalledWith(1, 0, 0.4); // Initial call with estimate (non-mocked time, so tiny due to tiny # of blocks)
            expect(onProgress).toHaveBeenNthCalledWith(2, 12.5, 213); // After 1st block sent (40/320)
            expect(onProgress).toHaveBeenNthCalledWith(3, 25, 182); // After 2nd block sent (80/320)
            expect(onProgress).toHaveBeenNthCalledWith(4, 37.5, 151); // After 3rd block sent (120/320)
            expect(onProgress).toHaveBeenNthCalledWith(5, 50, 121); // After 4th block sent (160/320)
            expect(onProgress).toHaveBeenNthCalledWith(6, 62.5, 91); // After 5th block sent (200/320)
            expect(onProgress).toHaveBeenNthCalledWith(7, 75, 60); // After 6th block sent (240/320)
            expect(onProgress).toHaveBeenNthCalledWith(8, 87.5, 30); // After 7th block sent (280/320)
            expect(onProgress).toHaveBeenNthCalledWith(9, 100, 0); // Final completion
            expect(device.otaInProgress).toStrictEqual(false);
        });

        it("calls onProgress with response delay (changes estimate)", async () => {
            const fileName = "custom.ota";
            const image = mockImage(320);
            const filePath = writeMockImage(image, fileName);
            const meta: ZigbeeOtaImageMeta = {
                fileName,
                url: filePath,
                manufacturerCode: image.header.manufacturerCode,
                imageType: image.header.imageType,
                fileVersion: image.header.fileVersion,
            };
            fetchIndexEntries = [meta];
            firmwareBuffer = image.raw;
            const requestPayload: TClusterCommandPayload<"genOta", "queryNextImageRequest"> = {
                fieldControl: 0,
                manufacturerCode: image.header.manufacturerCode,
                imageType: image.header.imageType,
                fileVersion: image.header.fileVersion - 1,
            };
            const baseSize = 40;
            const dataSettings: OtaDataSettings = {requestTimeout: 10, responseDelay: 250, baseSize};
            // Mock time to ensure progress is reported at regular intervals
            let currentTime = 0;
            const timeDelays = [
                0, // constructor
                100, // first block request (offset 0, no progress yet)
                100,
                30100, // second block request (offset 40, triggers 12.5% progress)
                100,
                30100, // third block request (offset 80, triggers 25% progress)
                100,
                30100, // fourth block request (offset 120, triggers 37.5% progress)
                100,
                30100, // fifth block request (offset 160, triggers 50% progress)
                100,
                30100, // sixth block request (offset 200, triggers 62.5% progress)
                100,
                30100, // seventh block request (offset 240, triggers 75% progress)
                100,
                30100, // eighth block request (offset 280, triggers 87.5% progress)
                100,
            ];
            const nowSpy = vi.spyOn(performance, "now").mockImplementation(() => {
                const next = timeDelays.shift();
                // For any additional calls, add small time
                currentTime += next ?? 100;

                return currentTime;
            });

            const {run, device, onProgress} = createDevice({
                image,
                source: {url: "https://example.com/fw.ota"},
                requestPayload,
                dataSettings,
                behavior: {baseSize, sendUpgradeEnd: true},
            });

            const [from, to] = await run();
            nowSpy.mockRestore();

            expect(from.fileVersion).toStrictEqual(requestPayload.fileVersion);
            expect(to?.fileVersion).toStrictEqual(image.header.fileVersion);

            // With 320 bytes and 40-byte chunks, we have 8 blocks
            expect(onProgress).toHaveBeenNthCalledWith(1, 0, 32); // Initial call with estimate (non-mocked time, so tiny due to tiny # of blocks)
            expect(onProgress).toHaveBeenNthCalledWith(2, 12.5, 213); // After 1st block sent (40/320)
            expect(onProgress).toHaveBeenNthCalledWith(3, 25, 182); // After 2nd block sent (80/320)
            expect(onProgress).toHaveBeenNthCalledWith(4, 37.5, 151); // After 3rd block sent (120/320)
            expect(onProgress).toHaveBeenNthCalledWith(5, 50, 121); // After 4th block sent (160/320)
            expect(onProgress).toHaveBeenNthCalledWith(6, 62.5, 91); // After 5th block sent (200/320)
            expect(onProgress).toHaveBeenNthCalledWith(7, 75, 60); // After 6th block sent (240/320)
            expect(onProgress).toHaveBeenNthCalledWith(8, 87.5, 30); // After 7th block sent (280/320)
            expect(onProgress).toHaveBeenNthCalledWith(9, 100, 0); // Final completion
            expect(device.otaInProgress).toStrictEqual(false);
        });

        it("calls onProgress with non-round blocks", async () => {
            const fileName = "custom.ota";
            const image = mockImage(521);
            const filePath = writeMockImage(image, fileName);
            const meta: ZigbeeOtaImageMeta = {
                fileName,
                url: filePath,
                manufacturerCode: image.header.manufacturerCode,
                imageType: image.header.imageType,
                fileVersion: image.header.fileVersion,
            };
            fetchIndexEntries = [meta];
            firmwareBuffer = image.raw;
            const requestPayload: TClusterCommandPayload<"genOta", "queryNextImageRequest"> = {
                fieldControl: 0,
                manufacturerCode: image.header.manufacturerCode,
                imageType: image.header.imageType,
                fileVersion: image.header.fileVersion - 1,
            };
            const baseSize = 64;
            const dataSettings: OtaDataSettings = {requestTimeout: 10, responseDelay: 0, baseSize};
            // Mock time to ensure progress is reported at regular intervals
            let currentTime = 0;
            const timeDelays = [
                0, // constructor
                100, // first block request (offset 0, no progress yet)
                100,
                30100, // second block request (offset 64, triggers 12.5% progress)
                100,
                30100, // third block request (offset 128, triggers 25% progress)
                100,
                30100, // fourth block request (offset 192, triggers 37.5% progress)
                100,
                30100, // fifth block request (offset 256, triggers 50% progress)
                100,
                30100, // sixth block request (offset 320, triggers 62.5% progress)
                100,
                30100, // seventh block request (offset 384, triggers 75% progress)
                100,
                30100, // eighth block request (offset 448, triggers 87.5% progress)
                100,
                30100, // ninth block request (offset 512, triggers 87.5% progress)
                100,
            ];
            const nowSpy = vi.spyOn(performance, "now").mockImplementation(() => {
                const next = timeDelays.shift();
                // For any additional calls, add small time
                currentTime += next ?? 100;

                return currentTime;
            });

            const {run, device, onProgress} = createDevice({
                image,
                source: {url: "https://example.com/fw.ota"},
                requestPayload,
                dataSettings,
                behavior: {baseSize, sendUpgradeEnd: true},
            });

            const [from, to] = await run();
            nowSpy.mockRestore();

            expect(from.fileVersion).toStrictEqual(requestPayload.fileVersion);
            expect(to?.fileVersion).toStrictEqual(image.header.fileVersion);

            // With 521 bytes and 64-byte chunks, we have 8 blocks
            expect(onProgress).toHaveBeenNthCalledWith(1, 0, 0.45); // Initial call with estimate (non-mocked time, so tiny due to tiny # of blocks)
            expect(onProgress).toHaveBeenNthCalledWith(2, 12.28, 217); // After 1st block sent (64/521)
            expect(onProgress).toHaveBeenNthCalledWith(3, 24.57, 186); // After 2nd block sent (128/521)
            expect(onProgress).toHaveBeenNthCalledWith(4, 36.85, 156); // After 3rd block sent (192/521)
            expect(onProgress).toHaveBeenNthCalledWith(5, 49.14, 125); // After 4th block sent (256/521)
            expect(onProgress).toHaveBeenNthCalledWith(6, 61.42, 95); // After 5th block sent (320/521)
            expect(onProgress).toHaveBeenNthCalledWith(7, 73.7, 65); // After 6th block sent (384/521)
            expect(onProgress).toHaveBeenNthCalledWith(8, 85.99, 34); // After 7th block sent (448/521)
            expect(onProgress).toHaveBeenNthCalledWith(9, 98.27, 4); // After 7th block sent (512/521)
            expect(onProgress).toHaveBeenNthCalledWith(10, 100, 0); // Final completion
            expect(device.otaInProgress).toStrictEqual(false);
        });

        it("throttles when response delay is configured", async () => {
            const fileName = "custom.ota";
            const image = mockImage(320);
            const filePath = writeMockImage(image, fileName);
            const meta: ZigbeeOtaImageMeta = {
                fileName,
                url: filePath,
                manufacturerCode: image.header.manufacturerCode,
                imageType: image.header.imageType,
                fileVersion: image.header.fileVersion,
            };
            fetchIndexEntries = [meta];
            firmwareBuffer = image.raw;
            const requestPayload: TClusterCommandPayload<"genOta", "queryNextImageRequest"> = {
                fieldControl: 0,
                manufacturerCode: image.header.manufacturerCode,
                imageType: image.header.imageType,
                fileVersion: image.header.fileVersion - 1,
            };
            const baseSize = 40;
            const responseDelay = 25; // keep this low so we don't have to mock it
            const dataSettings: OtaDataSettings = {requestTimeout: 1000, responseDelay, baseSize};
            const startTime = performance.now();
            const {run, device} = createDevice({
                image,
                source: {url: "https://example.com/fw.ota"},
                requestPayload,
                dataSettings,
                behavior: {baseSize, sendUpgradeEnd: true},
            });

            const [from, to] = await run();
            const elapsedTime = performance.now() - startTime;

            expect(from.fileVersion).toStrictEqual(requestPayload.fileVersion);
            expect(to?.fileVersion).toStrictEqual(image.header.fileVersion);

            const expectedBlocks = Math.ceil(image.header.totalImageSize / baseSize);
            const minimumExpectedTime = (expectedBlocks - 1) * responseDelay;

            expect(elapsedTime).toBeGreaterThanOrEqual(minimumExpectedTime);
            expect(device.otaInProgress).toStrictEqual(false);
        });

        it("cancels scheduled OTA when completed", async () => {
            const fileName = "custom.ota";
            const image = mockImage(320);
            const filePath = writeMockImage(image, fileName);
            const meta: ZigbeeOtaImageMeta = {
                fileName,
                url: filePath,
                manufacturerCode: image.header.manufacturerCode,
                imageType: image.header.imageType,
                fileVersion: image.header.fileVersion,
            };
            fetchIndexEntries = [meta];
            firmwareBuffer = image.raw;
            const requestPayload: TClusterCommandPayload<"genOta", "queryNextImageRequest"> = {
                fieldControl: 0,
                manufacturerCode: image.header.manufacturerCode,
                imageType: image.header.imageType,
                fileVersion: image.header.fileVersion - 1,
            };
            const baseSize = 40;
            const dataSettings: OtaDataSettings = {requestTimeout: 10, responseDelay: 0, baseSize};

            const {run, device} = createDevice({
                image,
                source: undefined,
                requestPayload,
                dataSettings,
                behavior: {baseSize, sendUpgradeEnd: true},
            });

            device.scheduleOta({url: filePath});

            expect(device.scheduledOta).toStrictEqual({url: filePath});

            const [from, to] = await run();

            expect(from.fileVersion).toStrictEqual(requestPayload.fileVersion);
            expect(to?.fileVersion).toStrictEqual(image.header.fileVersion);
            expect(device.scheduledOta).toStrictEqual(undefined);
            expect(device.otaInProgress).toStrictEqual(false);
        });

        it("keeps scheduled OTA on failure", async () => {
            const fileName = "custom.ota";
            const image = mockImage(320);
            const filePath = writeMockImage(image, fileName);
            const meta: ZigbeeOtaImageMeta = {
                fileName,
                url: filePath,
                manufacturerCode: image.header.manufacturerCode,
                imageType: image.header.imageType,
                fileVersion: image.header.fileVersion,
            };
            fetchIndexEntries = [meta];
            firmwareBuffer = image.raw;
            const requestPayload: TClusterCommandPayload<"genOta", "queryNextImageRequest"> = {
                fieldControl: 0,
                manufacturerCode: image.header.manufacturerCode,
                imageType: image.header.imageType,
                fileVersion: image.header.fileVersion - 1,
            };
            const baseSize = 40;
            const dataSettings: OtaDataSettings = {requestTimeout: 10, responseDelay: 0, baseSize};

            const {run, device} = createDevice({
                image,
                source: undefined,
                requestPayload,
                dataSettings,
                behavior: {baseSize, stopAfterBlocks: 1, sendUpgradeEnd: false},
            });

            device.scheduleOta({url: filePath, downgrade: true});

            expect(device.scheduledOta).toStrictEqual({url: filePath, downgrade: true});

            await expect(run()).rejects.toThrow(/did not start\/finish firmware download/);

            expect(device.scheduledOta).toStrictEqual({url: filePath, downgrade: true});
            expect(device.otaInProgress).toStrictEqual(false);
        });

        it("uses custom firmware in dataDir", async () => {
            const fileName = "mycustom.ota";
            const image = mockImage(300, Zcl.ManufacturerCode.ABB);
            firmwareBuffer = image.raw;
            const requestPayload: TClusterCommandPayload<"genOta", "queryNextImageRequest"> = {
                fieldControl: 0,
                manufacturerCode: image.header.manufacturerCode,
                imageType: image.header.imageType,
                fileVersion: image.header.fileVersion + 1,
            };
            const baseSize = 41;
            const {run, device} = createDevice({
                image,
                source: {url: "mycustom.ota", downgrade: true},
                requestPayload,
                dataSettings: {requestTimeout: 1000, responseDelay: 0, baseSize},
                behavior: {baseSize, sendUpgradeEnd: true},
            });
            const tempDataDir = fs.mkdtempSync("zh-ota");

            tempDirs.push(tempDataDir);
            fs.writeFileSync(path.join(tempDataDir, fileName), image.raw);
            otaHelpers.setOtaConfiguration(tempDataDir, undefined);

            const [from, to] = await run();

            expect(from.fileVersion).toStrictEqual(requestPayload.fileVersion);
            expect(to?.fileVersion).toStrictEqual(image.header.fileVersion);
            expect(device.otaInProgress).toStrictEqual(false);
        });

        it("recovers from image block response failures", async () => {
            const [image] = loadImage(OTA_FILES[2]);
            firmwareBuffer = image.raw;
            const baseSize = 64;
            const expectedBlocks = Math.ceil(image.header.totalImageSize / baseSize);
            const dataSettings: OtaDataSettings = {requestTimeout: 100, responseDelay: 0, baseSize};
            const {run, device, endpoint, onProgress} = createDevice({
                image,
                source: {},
                dataSettings,
                behavior: {baseSize, sendUpgradeEnd: true, failBlockResponse: true},
            });

            const [from, to] = await run();

            expect(from.fileVersion).toStrictEqual(image.header.fileVersion - 1);
            expect(to?.fileVersion).toStrictEqual(image.header.fileVersion);
            expect(getResponses(endpoint, "imageBlockResponse").length).toStrictEqual(expectedBlocks + 1 /* 1 retried */);
            const calls = getResponses(endpoint, "imageBlockResponse");
            const lastOffset = (expectedBlocks - 1) * baseSize;
            const lastSize = image.header.totalImageSize - lastOffset;
            const retryBlock = {fileOffset: 0, dataSize: baseSize, data: image.raw.subarray(0, baseSize)};
            expect(calls[0][2]).toEqual(expect.objectContaining(retryBlock));
            expect(calls[1][2]).toEqual(expect.objectContaining(retryBlock));
            expect(calls[2][2]).toEqual(
                expect.objectContaining({fileOffset: baseSize, dataSize: baseSize, data: image.raw.subarray(baseSize, baseSize * 2)}),
            );
            expect(calls[3][2]).toEqual(
                expect.objectContaining({fileOffset: baseSize * 2, dataSize: baseSize, data: image.raw.subarray(baseSize * 2, baseSize * 3)}),
            );
            expect(calls[expectedBlocks][2]).toEqual(
                expect.objectContaining({fileOffset: lastOffset, dataSize: lastSize, data: image.raw.subarray(image.raw.length - lastSize)}),
            );
            expect(getResponses(endpoint, "upgradeEndResponse").length).toStrictEqual(1);
            expect(onProgress).toHaveBeenCalled();
            expect(device.otaInProgress).toStrictEqual(false);
        });

        it("prevents running two OTAs on same device", async () => {
            const fileName = "custom.ota";
            const image = mockImage(320);
            const filePath = writeMockImage(image, fileName);
            const meta: ZigbeeOtaImageMeta = {
                fileName,
                url: filePath,
                manufacturerCode: image.header.manufacturerCode,
                imageType: image.header.imageType,
                fileVersion: image.header.fileVersion,
            };
            fetchIndexEntries = [meta];
            firmwareBuffer = image.raw;
            const requestPayload: TClusterCommandPayload<"genOta", "queryNextImageRequest"> = {
                fieldControl: 0,
                manufacturerCode: image.header.manufacturerCode,
                imageType: image.header.imageType,
                fileVersion: image.header.fileVersion - 1,
            };
            const baseSize = 40;
            const dataSettings: OtaDataSettings = {requestTimeout: 10, responseDelay: 0, baseSize};

            const {run, device} = createDevice({
                image,
                source: {url: filePath},
                requestPayload,
                dataSettings,
                behavior: {baseSize, sendUpgradeEnd: true},
            });

            const p1 = run();

            expect(device.otaInProgress).toStrictEqual(true);

            const p2 = run();
            const [from, to] = await p1;

            await expect(p2).rejects.toThrow("OTA already in progress for 0x1");
            expect(from.fileVersion).toStrictEqual(requestPayload.fileVersion);
            expect(to?.fileVersion).toStrictEqual(image.header.fileVersion);
            expect(device.otaInProgress).toStrictEqual(false);
        });

        it("fails when device stops sending data requests", async () => {
            const fileName = OTA_FILES[0];
            const [image] = loadImage(fileName);
            firmwareBuffer = image.raw;
            const requestPayload: TClusterCommandPayload<"genOta", "queryNextImageRequest"> = {
                fieldControl: 0,
                manufacturerCode: image.header.manufacturerCode,
                imageType: image.header.imageType,
                fileVersion: image.header.fileVersion - 1,
            };
            const baseSize = 50;
            const expectedBlocks = 1;
            const {run, device, endpoint} = createDevice({
                image,
                source: {},
                requestPayload,
                dataSettings: {requestTimeout: 30, responseDelay: 0, baseSize},
                behavior: {baseSize, stopAfterBlocks: 1, sendUpgradeEnd: false},
            });

            await expect(run()).rejects.toThrow(/did not start\/finish firmware download/);
            expect(getResponses(endpoint, "imageBlockResponse").length).toStrictEqual(expectedBlocks);
            expect(device.otaInProgress).toStrictEqual(false);
        });

        it("fails when upgrade end never arrives", async () => {
            const fileName = OTA_FILES[0];
            const [image] = loadImage(fileName);
            firmwareBuffer = image.raw;
            const requestPayload: TClusterCommandPayload<"genOta", "queryNextImageRequest"> = {
                fieldControl: 0,
                manufacturerCode: image.header.manufacturerCode,
                imageType: image.header.imageType,
                fileVersion: image.header.fileVersion - 1,
            };
            const baseSize = 30;
            const expectedBlocks = Math.ceil(image.header.totalImageSize / baseSize);

            const {run, device, endpoint} = createDevice({
                image,
                source: {},
                requestPayload,
                dataSettings: {requestTimeout: 1000, responseDelay: 0, baseSize},
                behavior: {baseSize, sendUpgradeEnd: false},
            });

            await expect(run()).rejects.toThrow(/did not start\/finish firmware download/);
            expect(getResponses(endpoint, "imageBlockResponse").length).toStrictEqual(expectedBlocks);
            expect(device.otaInProgress).toStrictEqual(false);
        });

        it("fails when device sends upgrade end request with INVALID_IMAGE after image fully sent", async () => {
            const fileName = OTA_FILES[1];
            const [image] = loadImage(fileName);
            firmwareBuffer = image.raw;
            const baseSize = 64;
            const {run, device, endpoint} = createDevice({
                image,
                source: {},
                dataSettings: {requestTimeout: 1000, responseDelay: 0, baseSize},
                behavior: {baseSize, sendUpgradeEnd: true, upgradeEndStatus: Zcl.Status.INVALID_IMAGE},
            });

            await expect(run()).rejects.toThrow(/INVALID_IMAGE/);
            expect(endpoint.defaultResponse).toHaveBeenCalledWith(
                UPGRADE_END_REQUEST_ID,
                Zcl.Status.SUCCESS,
                Zcl.Clusters.genOta.ID,
                expect.any(Number),
            );
            expect(device.otaInProgress).toStrictEqual(false);
        });

        it("fails when device sends upgrade end request with ABORT after a certain number of blocks", async () => {
            const fileName = OTA_FILES[0];
            const [image] = loadImage(fileName);
            firmwareBuffer = image.raw;
            const baseSize = 64;
            const {run, device, endpoint} = createDevice({
                image,
                source: {},
                dataSettings: {requestTimeout: 1000, responseDelay: 0, baseSize},
                behavior: {
                    baseSize,
                    sendUpgradeEnd: true,
                    upgradeEndStatus: Zcl.Status.ABORT,
                    upgradeEndAfterBlocks: 2,
                },
            });

            await expect(run()).rejects.toThrow(/ABORT/);
            expect(endpoint.defaultResponse).toHaveBeenCalledWith(
                UPGRADE_END_REQUEST_ID,
                Zcl.Status.SUCCESS,
                Zcl.Clusters.genOta.ID,
                expect.any(Number),
            );
            expect(device.otaInProgress).toStrictEqual(false);
        });

        it("fails when upgrade end response fails", async () => {
            const fileName = OTA_FILES[0];
            const [image] = loadImage(fileName);
            firmwareBuffer = image.raw;
            const baseSize = 64;
            const {run, device, endpoint} = createDevice({
                image,
                source: {},
                dataSettings: {requestTimeout: 1000, responseDelay: 0, baseSize},
                behavior: {baseSize, sendUpgradeEnd: true},
            });
            endpoint.commandResponse = vi.fn((_cluster, command) => {
                if (command === "upgradeEndResponse") {
                    return Promise.reject(new Error("upgrade-end-fail"));
                }

                return Promise.resolve();
            });

            await expect(run()).rejects.toThrow(/upgrade end response failed/i);
            expect(device.otaInProgress).toStrictEqual(false);
        });

        it("fails when query next image response fails", async () => {
            const fileName = OTA_FILES[0];
            const [image] = loadImage(fileName);
            firmwareBuffer = image.raw;
            const baseSize = 50;
            const {run, device, endpoint} = createDevice({
                image,
                source: {},
                dataSettings: {requestTimeout: 1000, responseDelay: 0, baseSize},
                behavior: {baseSize, sendUpgradeEnd: true},
            });
            endpoint.commandResponse = vi.fn((_cluster, command) => {
                if (command === "queryNextImageResponse") {
                    return Promise.reject(new Error("query-next-image-fail"));
                }

                return Promise.resolve();
            });

            await expect(run()).rejects.toThrow("query-next-image-fail");
            expect(device.otaInProgress).toStrictEqual(false);
        });

        it("does not throw on failed default response after non-success upgrade end request", async () => {
            const fileName = OTA_FILES[0];
            const [image] = loadImage(fileName);
            firmwareBuffer = image.raw;
            const baseSize = 64;
            const {run, device, endpoint} = createDevice({
                image,
                source: {},
                dataSettings: {requestTimeout: 1000, responseDelay: 0, baseSize},
                behavior: {baseSize, sendUpgradeEnd: true, upgradeEndStatus: Zcl.Status.ABORT},
            });
            const epDefaultResponse = endpoint.defaultResponse as unknown as ReturnType<typeof vi.fn>;

            epDefaultResponse.mockRejectedValueOnce(new Error("default-response-failed"));

            await expect(run()).rejects.toThrow(/ABORT/);
            expect(epDefaultResponse).toHaveBeenCalledTimes(1);
            expect(epDefaultResponse.mock.settledResults[0]).toStrictEqual({type: "rejected", value: new Error("default-response-failed")});
            expect(device.otaInProgress).toStrictEqual(false);
        });

        it("allows bypassing version check with force meta", async () => {
            const fileName = "custom.ota";
            const image = mockImage(300);
            firmwareBuffer = image.raw;
            const filePath = writeMockImage(image, fileName);
            const meta: ZigbeeOtaImageMeta = {
                fileName,
                url: filePath,
                manufacturerCode: image.header.manufacturerCode,
                imageType: image.header.imageType,
                fileVersion: image.header.fileVersion,
                force: true,
            };
            fetchIndexEntries = [meta];
            const requestPayload: TClusterCommandPayload<"genOta", "queryNextImageRequest"> = {
                fieldControl: 0,
                manufacturerCode: image.header.manufacturerCode,
                imageType: image.header.imageType,
                fileVersion: image.header.fileVersion,
            };
            const baseSize = 25;
            const dataSettings: OtaDataSettings = {requestTimeout: 150000, responseDelay: 0, baseSize};
            const {run, device} = createDevice({
                image,
                source: {},
                requestPayload,
                dataSettings,
                behavior: {baseSize, sendUpgradeEnd: true},
            });
            const [from, to] = await run();

            expect(from.fileVersion).toStrictEqual(requestPayload.fileVersion);
            expect(to?.fileVersion).toStrictEqual(requestPayload.fileVersion);
            expect(device.otaInProgress).toStrictEqual(false);
        });

        it("returns NO_IMAGE_AVAILABLE when device version matches available in repo", async () => {
            const [image] = loadImage(OTA_FILES[0]);
            firmwareBuffer = image.raw;
            const requestPayload: TClusterCommandPayload<"genOta", "queryNextImageRequest"> = {
                fieldControl: 0,
                manufacturerCode: image.header.manufacturerCode,
                imageType: image.header.imageType,
                fileVersion: image.header.fileVersion,
            };
            const baseSize = 16;
            const logErrorSpy = vi.spyOn(logger, "error");
            const dataSettings: OtaDataSettings = {requestTimeout: 150000, responseDelay: 0, baseSize};
            const {run, device, endpoint} = createDevice({
                image,
                source: {},
                requestPayload,
                dataSettings,
                behavior: {baseSize, sendUpgradeEnd: true},
            });
            const [from, to] = await run();

            expect(from.fileVersion).toStrictEqual(requestPayload.fileVersion);
            expect(to).toBeUndefined();
            expect(endpoint.commandResponse).toHaveBeenCalledWith(
                "genOta",
                "queryNextImageResponse",
                {status: Zcl.Status.NO_IMAGE_AVAILABLE},
                undefined,
                1,
            );
            expect(logErrorSpy).not.toHaveBeenCalled();
            expect(device.otaInProgress).toStrictEqual(false);
        });

        it("returns NO_IMAGE_AVAILABLE when device version is above available in repo (upgrade)", async () => {
            const [image] = loadImage(OTA_FILES[0]);
            firmwareBuffer = image.raw;
            const requestPayload: TClusterCommandPayload<"genOta", "queryNextImageRequest"> = {
                fieldControl: 0,
                manufacturerCode: image.header.manufacturerCode,
                imageType: image.header.imageType,
                fileVersion: image.header.fileVersion + 1,
            };
            const baseSize = 16;
            const logErrorSpy = vi.spyOn(logger, "error");
            const dataSettings: OtaDataSettings = {requestTimeout: 150000, responseDelay: 0, baseSize};
            const {run, device, endpoint} = createDevice({
                image,
                source: {},
                requestPayload,
                dataSettings,
                behavior: {baseSize, sendUpgradeEnd: true},
            });
            const [from, to] = await run();

            expect(from.fileVersion).toStrictEqual(requestPayload.fileVersion);
            expect(to).toBeUndefined();
            expect(endpoint.commandResponse).toHaveBeenCalledWith(
                "genOta",
                "queryNextImageResponse",
                {status: Zcl.Status.NO_IMAGE_AVAILABLE},
                undefined,
                1,
            );
            expect(logErrorSpy).not.toHaveBeenCalled();
            expect(device.otaInProgress).toStrictEqual(false);
        });

        it("returns NO_IMAGE_AVAILABLE when device version is below available in repo (downgrade)", async () => {
            const [image] = loadImage(OTA_FILES[0]);
            firmwareBuffer = image.raw;
            const requestPayload: TClusterCommandPayload<"genOta", "queryNextImageRequest"> = {
                fieldControl: 0,
                manufacturerCode: image.header.manufacturerCode,
                imageType: image.header.imageType,
                fileVersion: image.header.fileVersion - 1,
            };
            const baseSize = 16;
            const logErrorSpy = vi.spyOn(logger, "error");
            const dataSettings: OtaDataSettings = {requestTimeout: 150000, responseDelay: 0, baseSize};
            const {run, device, endpoint} = createDevice({
                image,
                source: {downgrade: true},
                requestPayload,
                dataSettings,
                behavior: {baseSize, sendUpgradeEnd: true},
            });
            const [from, to] = await run();

            expect(from.fileVersion).toStrictEqual(requestPayload.fileVersion);
            expect(to).toBeUndefined();
            expect(endpoint.commandResponse).toHaveBeenCalledWith(
                "genOta",
                "queryNextImageResponse",
                {status: Zcl.Status.NO_IMAGE_AVAILABLE},
                undefined,
                1,
            );
            expect(logErrorSpy).not.toHaveBeenCalled();
            expect(device.otaInProgress).toStrictEqual(false);
        });

        it("returns NO_IMAGE_AVAILABLE when device version matches available at given URL", async () => {
            const [image] = loadImage(OTA_FILES[0]);
            firmwareBuffer = image.raw;
            const requestPayload: TClusterCommandPayload<"genOta", "queryNextImageRequest"> = {
                fieldControl: 0,
                manufacturerCode: image.header.manufacturerCode,
                imageType: image.header.imageType,
                fileVersion: image.header.fileVersion,
            };
            const baseSize = 16;
            const logErrorSpy = vi.spyOn(logger, "error");
            const logDebugSpy = vi.spyOn(logger, "debug");
            const dataSettings: OtaDataSettings = {requestTimeout: 150000, responseDelay: 0, baseSize};
            const {run, device, endpoint} = createDevice({
                image,
                source: {url: "https://example.com/fw.ota"},
                requestPayload,
                dataSettings,
                behavior: {baseSize, sendUpgradeEnd: true},
            });
            const [from, to] = await run();

            expect(from.fileVersion).toStrictEqual(requestPayload.fileVersion);
            expect(to).toBeUndefined();
            expect(endpoint.commandResponse).toHaveBeenCalledWith(
                "genOta",
                "queryNextImageResponse",
                {status: Zcl.Status.NO_IMAGE_AVAILABLE},
                undefined,
                1,
            );
            expect(logErrorSpy).not.toHaveBeenCalled();
            const calls = logDebugSpy.mock.calls.map((c) => (typeof c[0] === "string" ? c[0] : c[0]()));
            expect(calls[0]).toMatch("Downloading firmware image from 'https://example.com/fw.ota'");
            expect(calls[1]).toMatch("Parsed image from 'https://example.com/fw.ota' for 0x1");
            expect(device.otaInProgress).toStrictEqual(false);
        });

        it("returns NO_IMAGE_AVAILABLE when parsing repo firmware fails", async () => {
            const [image] = loadImage(OTA_FILES[0]);
            firmwareBuffer = image.raw;
            const requestPayload: TClusterCommandPayload<"genOta", "queryNextImageRequest"> = {
                fieldControl: 0,
                manufacturerCode: image.header.manufacturerCode,
                imageType: image.header.imageType,
                fileVersion: image.header.fileVersion - 1,
            };
            const baseSize = 16;
            const logErrorSpy = vi.spyOn(logger, "error");
            const parseOtaImageSpy = vi.spyOn(otaHelpers, "parseOtaImage").mockImplementation(() => {
                throw new Error("fail");
            });
            const dataSettings: OtaDataSettings = {requestTimeout: 150000, responseDelay: 0, baseSize};
            const {run, device, endpoint} = createDevice({
                image,
                source: {},
                requestPayload,
                dataSettings,
                behavior: {baseSize, sendUpgradeEnd: true},
            });
            const [from, to] = await run();

            expect(from.fileVersion).toStrictEqual(requestPayload.fileVersion);
            expect(to).toBeUndefined();
            expect(endpoint.commandResponse).toHaveBeenCalledWith(
                "genOta",
                "queryNextImageResponse",
                {status: Zcl.Status.NO_IMAGE_AVAILABLE},
                undefined,
                1,
            );
            expect(logErrorSpy).toHaveBeenCalledWith(expect.stringContaining("Failed to parse OTA image"), "zh:controller:device");
            expect(device.otaInProgress).toStrictEqual(false);

            parseOtaImageSpy.mockRestore();
        });

        it("returns NO_IMAGE_AVAILABLE when parsing custom firmware fails", async () => {
            const [image] = loadImage(OTA_FILES[0]);
            firmwareBuffer = Buffer.from(image.raw);
            firmwareBuffer[0] = 0xff;
            const requestPayload: TClusterCommandPayload<"genOta", "queryNextImageRequest"> = {
                fieldControl: 0,
                manufacturerCode: image.header.manufacturerCode,
                imageType: image.header.imageType,
                fileVersion: image.header.fileVersion - 1,
            };
            const baseSize = 16;
            const logErrorSpy = vi.spyOn(logger, "error");
            const dataSettings: OtaDataSettings = {requestTimeout: 150000, responseDelay: 0, baseSize};
            const {run, device, endpoint} = createDevice({
                image,
                source: {url: "https://example.com/fw.ota"},
                requestPayload,
                dataSettings,
                behavior: {baseSize, sendUpgradeEnd: true},
            });
            const [from, to] = await run();

            expect(from.fileVersion).toStrictEqual(requestPayload.fileVersion);
            expect(to).toBeUndefined();
            expect(endpoint.commandResponse).toHaveBeenCalledWith(
                "genOta",
                "queryNextImageResponse",
                {status: Zcl.Status.NO_IMAGE_AVAILABLE},
                undefined,
                1,
            );
            expect(logErrorSpy).toHaveBeenCalledWith(expect.stringContaining("Failed to parse OTA image"), "zh:controller:device");
            expect(device.otaInProgress).toStrictEqual(false);
        });

        it("returns NO_IMAGE_AVAILABLE when parsing custom firmware in dataDir fails", async () => {
            const fileName = "mycustom.ota";
            const image = mockImage(300, Zcl.ManufacturerCode.ABB);
            firmwareBuffer = image.raw;
            firmwareBuffer[0] = 0xff;
            const baseSize = 41;
            const logErrorSpy = vi.spyOn(logger, "error");
            const {run, device, endpoint} = createDevice({
                image,
                source: {url: "mycustom.ota", downgrade: true},
                requestPayload: undefined,
                dataSettings: {requestTimeout: 1000, responseDelay: 0, baseSize},
                behavior: {baseSize, sendUpgradeEnd: true},
            });
            const tempDataDir = fs.mkdtempSync("zh-ota");

            tempDirs.push(tempDataDir);
            fs.writeFileSync(path.join(tempDataDir, fileName), image.raw);
            otaHelpers.setOtaConfiguration(tempDataDir, undefined);

            const [from, to] = await run();

            expect(from.fileVersion).toStrictEqual(image.header.fileVersion + 1);
            expect(to).toBeUndefined();
            expect(endpoint.commandResponse).toHaveBeenCalledWith(
                "genOta",
                "queryNextImageResponse",
                {status: Zcl.Status.NO_IMAGE_AVAILABLE},
                undefined,
                1,
            );
            expect(logErrorSpy).toHaveBeenCalledWith(expect.stringContaining("Failed to parse OTA image"), "zh:controller:device");
            expect(device.otaInProgress).toStrictEqual(false);
        });

        it("returns NO_IMAGE_AVAILABLE when firmware fetching fails", async () => {
            fetchMock.mockResolvedValueOnce(fetchMockIndex).mockResolvedValueOnce(fetchMockFail);

            const fileName = OTA_FILES[0];
            const [image] = loadImage(fileName);
            const meta: ZigbeeOtaImageMeta = {
                fileName,
                url: "https://example.com/custom.ota",
                manufacturerCode: image.header.manufacturerCode,
                imageType: image.header.imageType,
                fileVersion: image.header.fileVersion,
            };
            fetchIndexEntries = [meta];
            firmwareBuffer = image.raw;
            const requestPayload: TClusterCommandPayload<"genOta", "queryNextImageRequest"> = {
                fieldControl: 0,
                manufacturerCode: image.header.manufacturerCode,
                imageType: image.header.imageType,
                fileVersion: image.header.fileVersion - 1,
            };
            const baseSize = 16;
            const logErrorSpy = vi.spyOn(logger, "error");
            const dataSettings: OtaDataSettings = {requestTimeout: 150000, responseDelay: 0, baseSize};
            const {run, device, endpoint} = createDevice({
                image,
                source: {},
                requestPayload,
                dataSettings,
                behavior: {baseSize, sendUpgradeEnd: true},
            });
            const [from, to] = await run();

            expect(from.fileVersion).toStrictEqual(requestPayload.fileVersion);
            expect(to).toBeUndefined();
            expect(endpoint.commandResponse).toHaveBeenCalledWith(
                "genOta",
                "queryNextImageResponse",
                {status: Zcl.Status.NO_IMAGE_AVAILABLE},
                undefined,
                1,
            );
            expect(logErrorSpy).toHaveBeenCalledWith(
                expect.stringContaining("Invalid response from https://example.com/custom.ota status=403"),
                "zh:controller:device",
            );
            expect(device.otaInProgress).toStrictEqual(false);
        });

        it("returns NO_IMAGE_AVAILABLE when custom file fails checksum", async () => {
            const fileName = OTA_FILES[0];
            const [image, filePath] = loadImage(fileName);
            const meta: ZigbeeOtaImageMeta = {
                fileName,
                url: filePath,
                manufacturerCode: image.header.manufacturerCode,
                imageType: image.header.imageType,
                fileVersion: image.header.fileVersion,
                sha512: "invalid",
            };
            fetchIndexEntries = [meta];
            firmwareBuffer = image.raw;
            const requestPayload: TClusterCommandPayload<"genOta", "queryNextImageRequest"> = {
                fieldControl: 0,
                manufacturerCode: image.header.manufacturerCode,
                imageType: image.header.imageType,
                fileVersion: image.header.fileVersion - 1,
            };
            const baseSize = 43;
            const logErrorSpy = vi.spyOn(logger, "error");
            const dataSettings: OtaDataSettings = {requestTimeout: 150000, responseDelay: 0, baseSize};
            const {run, device, endpoint} = createDevice({
                image,
                source: {},
                requestPayload,
                dataSettings,
                behavior: {baseSize, sendUpgradeEnd: true},
            });
            const [from, to] = await run();

            expect(from.fileVersion).toStrictEqual(requestPayload.fileVersion);
            expect(to).toBeUndefined();
            expect(endpoint.commandResponse).toHaveBeenCalledWith(
                "genOta",
                "queryNextImageResponse",
                {status: Zcl.Status.NO_IMAGE_AVAILABLE},
                undefined,
                1,
            );
            expect(logErrorSpy).toHaveBeenCalledWith(expect.stringContaining("File checksum validation failed"), "zh:controller:device");
            expect(device.otaInProgress).toStrictEqual(false);
        });

        it("returns NO_IMAGE_AVAILABLE when index has no entries", async () => {
            fetchIndexEntries = [];
            const [image] = loadImage(OTA_FILES[1]);
            firmwareBuffer = image.raw;
            const dataSettings: OtaDataSettings = {requestTimeout: 0, responseDelay: 0, baseSize: 32};
            const {run, device, endpoint} = createDevice({
                image,
                source: {},
                dataSettings,
                behavior: {baseSize: 32, sendUpgradeEnd: true},
            });

            const [from, to] = await run();

            expect(from.fileVersion).toStrictEqual(image.header.fileVersion - 1);
            expect(to).toBeUndefined();
            expect(endpoint.commandResponse).toHaveBeenCalledWith(
                "genOta",
                "queryNextImageResponse",
                {status: Zcl.Status.NO_IMAGE_AVAILABLE},
                undefined,
                1,
            );
            expect(device.otaInProgress).toStrictEqual(false);
        });
    });

    describe("Schedules / Unschedules", () => {
        it("schedules OTA request", () => {
            const {device} = createSimpleDevice({});

            device.scheduleOta({url: "first"});

            expect(device.scheduledOta).toStrictEqual({url: "first"});
        });

        it("replaces previously-scheduled OTA request", () => {
            const {device} = createSimpleDevice({});

            device.scheduleOta({url: "first"});

            expect(device.scheduledOta).toStrictEqual({url: "first"});

            device.scheduleOta({url: "second", downgrade: true});

            expect(device.scheduledOta).toStrictEqual({url: "second", downgrade: true});
        });

        it("unschedules OTA when present", () => {
            const {device} = createSimpleDevice({});

            device.scheduleOta({url: "upgrade"});

            expect(device.scheduledOta).toStrictEqual({url: "upgrade"});

            device.unscheduleOta();

            expect(device.scheduledOta).toStrictEqual(undefined);
        });

        it("handles unscheduling when scheduled not present", () => {
            const {device} = createSimpleDevice({});

            device.unscheduleOta();

            expect(device.scheduledOta).toStrictEqual(undefined);
        });
    });

    describe("Finds image", () => {
        // tests for each possibility in `findMatchingOtaImage`

        it.each(OTA_FILES)("finds match by spec (%s)", async (fileName) => {
            const [image] = loadImage(fileName);
            const current: TClusterCommandPayload<"genOta", "queryNextImageRequest"> = {
                fieldControl: 0,
                manufacturerCode: image.header.manufacturerCode,
                imageType: image.header.imageType,
                fileVersion: image.header.fileVersion,
            };
            const {device} = createSimpleDevice({});

            await expect(device.findMatchingOtaImage({}, current, {})).resolves.toMatchObject({
                fileName,
                manufacturerCode: image.header.manufacturerCode,
                imageType: image.header.imageType,
                fileVersion: image.header.fileVersion,
            });
        });

        it("within file version range", async () => {
            const fileName = "custom.ota";
            const image = mockImage(300, undefined, undefined, 4);
            const meta: ZigbeeOtaImageMeta = {
                fileName,
                url: fileName,
                manufacturerCode: image.header.manufacturerCode,
                imageType: image.header.imageType,
                fileVersion: image.header.fileVersion,
                minFileVersion: 3,
                maxFileVersion: 5,
            };
            fetchIndexEntries.push(
                {
                    ...meta,
                    minFileVersion: 2,
                    maxFileVersion: 3,
                    fileName: "not this",
                },
                meta,
                {
                    ...meta,
                    minFileVersion: 4,
                    maxFileVersion: 6,
                    fileName: "not that",
                },
            );
            const current: TClusterCommandPayload<"genOta", "queryNextImageRequest"> = {
                fieldControl: 0,
                manufacturerCode: image.header.manufacturerCode,
                imageType: image.header.imageType,
                fileVersion: image.header.fileVersion,
            };
            const {device} = createSimpleDevice({modelID: "", manufacturerName: "", meta: {}});

            await expect(device.findMatchingOtaImage({}, current, {})).resolves.toMatchObject({
                fileName,
                manufacturerCode: image.header.manufacturerCode,
                imageType: image.header.imageType,
                fileVersion: image.header.fileVersion,
                minFileVersion: 3,
                maxFileVersion: 5,
            });
        });

        it("by minFileVersion", async () => {
            const fileName = "custom.ota";
            const image = mockImage(300, undefined, undefined, 4);
            const meta: ZigbeeOtaImageMeta = {
                fileName,
                url: fileName,
                manufacturerCode: image.header.manufacturerCode,
                imageType: image.header.imageType,
                fileVersion: image.header.fileVersion,
                minFileVersion: 3,
            };
            fetchIndexEntries.push({...meta, minFileVersion: 5, fileName: "not this"}, meta, {...meta, minFileVersion: 6, fileName: "not that"});
            const current: TClusterCommandPayload<"genOta", "queryNextImageRequest"> = {
                fieldControl: 0,
                manufacturerCode: image.header.manufacturerCode,
                imageType: image.header.imageType,
                fileVersion: image.header.fileVersion,
            };
            const {device} = createSimpleDevice({modelID: "", manufacturerName: "", meta: {}});

            await expect(device.findMatchingOtaImage({}, current, {})).resolves.toMatchObject({
                fileName,
                manufacturerCode: image.header.manufacturerCode,
                imageType: image.header.imageType,
                fileVersion: image.header.fileVersion,
                minFileVersion: 3,
            });
        });

        it("by maxFileVersion", async () => {
            const fileName = "custom.ota";
            const image = mockImage(300, undefined, undefined, 4);
            const meta: ZigbeeOtaImageMeta = {
                fileName,
                url: fileName,
                manufacturerCode: image.header.manufacturerCode,
                imageType: image.header.imageType,
                fileVersion: image.header.fileVersion,
                maxFileVersion: 5,
            };
            fetchIndexEntries.push({...meta, maxFileVersion: 3, fileName: "not this"}, meta, {...meta, maxFileVersion: 9, fileName: "not that"});
            const current: TClusterCommandPayload<"genOta", "queryNextImageRequest"> = {
                fieldControl: 0,
                manufacturerCode: image.header.manufacturerCode,
                imageType: image.header.imageType,
                fileVersion: image.header.fileVersion,
            };
            const {device} = createSimpleDevice({modelID: "", manufacturerName: "", meta: {}});

            await expect(device.findMatchingOtaImage({}, current, {})).resolves.toMatchObject({
                fileName,
                manufacturerCode: image.header.manufacturerCode,
                imageType: image.header.imageType,
                fileVersion: image.header.fileVersion,
                maxFileVersion: 5,
            });
        });

        it("by modelId", async () => {
            const fileName = "custom.ota";
            const image = mockImage(300, undefined, undefined, 4);
            const meta: ZigbeeOtaImageMeta = {
                fileName,
                url: fileName,
                manufacturerCode: image.header.manufacturerCode,
                imageType: image.header.imageType,
                fileVersion: image.header.fileVersion,
                modelId: "ZH",
            };
            fetchIndexEntries.push({...meta, modelId: "not this", fileName: "not this"}, meta); // non-match first to ensure not order-driven
            const current: TClusterCommandPayload<"genOta", "queryNextImageRequest"> = {
                fieldControl: 0,
                manufacturerCode: image.header.manufacturerCode,
                imageType: image.header.imageType,
                fileVersion: image.header.fileVersion,
            };
            const {device} = createSimpleDevice({modelID: "ZH"});

            await expect(device.findMatchingOtaImage({}, current, {})).resolves.toMatchObject({
                fileName,
                manufacturerCode: image.header.manufacturerCode,
                imageType: image.header.imageType,
                fileVersion: image.header.fileVersion,
                modelId: "ZH",
            });
        });

        it("by extra meta modelId", async () => {
            const fileName = "custom.ota";
            const image = mockImage(300, undefined, undefined, 4);
            const meta: ZigbeeOtaImageMeta = {
                fileName,
                url: fileName,
                manufacturerCode: image.header.manufacturerCode,
                imageType: image.header.imageType,
                fileVersion: image.header.fileVersion,
                modelId: "ZH",
            };
            fetchIndexEntries.push({...meta, modelId: "not this", fileName: "not this"}, meta); // non-match first to ensure not order-driven
            const current: TClusterCommandPayload<"genOta", "queryNextImageRequest"> = {
                fieldControl: 0,
                manufacturerCode: image.header.manufacturerCode,
                imageType: image.header.imageType,
                fileVersion: image.header.fileVersion,
            };
            const {device} = createSimpleDevice({modelID: "other"});

            await expect(device.findMatchingOtaImage({}, current, {modelId: "ZH"})).resolves.toMatchObject({
                fileName,
                manufacturerCode: image.header.manufacturerCode,
                imageType: image.header.imageType,
                fileVersion: image.header.fileVersion,
                modelId: "ZH",
            });
        });

        it("by manufacturerName", async () => {
            const fileName = "custom.ota";
            const image = mockImage(300, undefined, undefined, 4);
            const meta: ZigbeeOtaImageMeta = {
                fileName,
                url: fileName,
                manufacturerCode: image.header.manufacturerCode,
                imageType: image.header.imageType,
                fileVersion: image.header.fileVersion,
                manufacturerName: ["ZH"],
            };
            fetchIndexEntries.push({...meta, manufacturerName: ["not this"], fileName: "not this"}, meta); // non-match first to ensure not order-driven
            const current: TClusterCommandPayload<"genOta", "queryNextImageRequest"> = {
                fieldControl: 0,
                manufacturerCode: image.header.manufacturerCode,
                imageType: image.header.imageType,
                fileVersion: image.header.fileVersion,
            };
            const {device} = createSimpleDevice({manufacturerName: "ZH"});

            await expect(device.findMatchingOtaImage({}, current, {})).resolves.toMatchObject({
                fileName,
                manufacturerCode: image.header.manufacturerCode,
                imageType: image.header.imageType,
                fileVersion: image.header.fileVersion,
                manufacturerName: ["ZH"],
            });
        });

        it("by extra meta manufacturerName", async () => {
            const fileName = "custom.ota";
            const image = mockImage(300, undefined, undefined, 4);
            const meta: ZigbeeOtaImageMeta = {
                fileName,
                url: fileName,
                manufacturerCode: image.header.manufacturerCode,
                imageType: image.header.imageType,
                fileVersion: image.header.fileVersion,
                manufacturerName: ["ZH"],
            };
            fetchIndexEntries.push({...meta, manufacturerName: ["not this"], fileName: "not this"}, meta); // non-match first to ensure not order-driven
            const current: TClusterCommandPayload<"genOta", "queryNextImageRequest"> = {
                fieldControl: 0,
                manufacturerCode: image.header.manufacturerCode,
                imageType: image.header.imageType,
                fileVersion: image.header.fileVersion,
            };
            const {device} = createSimpleDevice({manufacturerName: "other"});

            await expect(device.findMatchingOtaImage({}, current, {manufacturerName: "ZH"})).resolves.toMatchObject({
                fileName,
                manufacturerCode: image.header.manufacturerCode,
                imageType: image.header.imageType,
                fileVersion: image.header.fileVersion,
                manufacturerName: ["ZH"],
            });
        });

        it("by extra meta otaHeaderString", async () => {
            const fileName = "custom.ota";
            const image = mockImage(300, undefined, undefined, 4);
            const meta: ZigbeeOtaImageMeta = {
                fileName,
                url: fileName,
                manufacturerCode: image.header.manufacturerCode,
                imageType: image.header.imageType,
                fileVersion: image.header.fileVersion,
                otaHeaderString: "ZH",
            };
            fetchIndexEntries.push({...meta, otaHeaderString: "not this", fileName: "not this"}, meta); // non-match first to ensure not order-driven
            const current: TClusterCommandPayload<"genOta", "queryNextImageRequest"> = {
                fieldControl: 0,
                manufacturerCode: image.header.manufacturerCode,
                imageType: image.header.imageType,
                fileVersion: image.header.fileVersion,
            };
            const {device} = createSimpleDevice({});

            await expect(device.findMatchingOtaImage({}, current, {otaHeaderString: "ZH"})).resolves.toMatchObject({
                fileName,
                manufacturerCode: image.header.manufacturerCode,
                imageType: image.header.imageType,
                fileVersion: image.header.fileVersion,
                otaHeaderString: "ZH",
            });
        });

        it("by hardwareVersionMin", async () => {
            const fileName = "custom.ota";
            const image = mockImage(300, undefined, undefined, 56, undefined, undefined, 3, 0);
            const meta: ZigbeeOtaImageMeta = {
                fileName,
                url: fileName,
                manufacturerCode: image.header.manufacturerCode,
                imageType: image.header.imageType,
                fileVersion: image.header.fileVersion,
                hardwareVersionMin: image.header.minimumHardwareVersion,
            };
            const fileName2 = "custom2.ota";
            const image2 = mockImage(300, undefined, undefined, 58, undefined, undefined, 6, 0);
            const meta2: ZigbeeOtaImageMeta = {
                fileName: fileName2,
                url: fileName2,
                manufacturerCode: image2.header.manufacturerCode,
                imageType: image2.header.imageType,
                fileVersion: image2.header.fileVersion,
                hardwareVersionMin: image2.header.minimumHardwareVersion,
            };
            fetchIndexEntries.push(meta2, meta); // non-match first to ensure not order-driven
            const current: TClusterCommandPayload<"genOta", "queryNextImageRequest"> = {
                fieldControl: 0,
                manufacturerCode: image.header.manufacturerCode,
                imageType: image.header.imageType,
                fileVersion: image.header.fileVersion,
                hardwareVersion: 4,
            };
            const {device} = createSimpleDevice({});

            await expect(device.findMatchingOtaImage({}, current, {})).resolves.toMatchObject({
                fileName,
                manufacturerCode: image.header.manufacturerCode,
                imageType: image.header.imageType,
                fileVersion: image.header.fileVersion,
                hardwareVersionMin: 3,
            });
        });

        it("by extra meta hardwareVersionMin", async () => {
            const fileName = "custom.ota";
            const image = mockImage(300, undefined, undefined, 56, undefined, undefined, 3, 0);
            const meta: ZigbeeOtaImageMeta = {
                fileName,
                url: fileName,
                manufacturerCode: image.header.manufacturerCode,
                imageType: image.header.imageType,
                fileVersion: image.header.fileVersion,
                hardwareVersionMin: image.header.minimumHardwareVersion,
            };
            const fileName2 = "custom2.ota";
            const image2 = mockImage(300, undefined, undefined, 58, undefined, undefined, 6, 0);
            const meta2: ZigbeeOtaImageMeta = {
                fileName: fileName2,
                url: fileName2,
                manufacturerCode: image2.header.manufacturerCode,
                imageType: image2.header.imageType,
                fileVersion: image2.header.fileVersion,
                hardwareVersionMin: image2.header.minimumHardwareVersion,
            };
            fetchIndexEntries.push(meta2, meta); // non-match first to ensure not order-driven
            const current: TClusterCommandPayload<"genOta", "queryNextImageRequest"> = {
                fieldControl: 0,
                manufacturerCode: image.header.manufacturerCode,
                imageType: image.header.imageType,
                fileVersion: image.header.fileVersion,
            };
            const {device} = createSimpleDevice({});

            await expect(device.findMatchingOtaImage({}, current, {hardwareVersionMin: 4})).resolves.toMatchObject({
                fileName,
                manufacturerCode: image.header.manufacturerCode,
                imageType: image.header.imageType,
                fileVersion: image.header.fileVersion,
                hardwareVersionMin: 3,
            });
        });

        it("by hardwareVersionMax", async () => {
            const fileName = "custom.ota";
            const image = mockImage(300, undefined, undefined, 56, undefined, undefined, 0, 6);
            const meta: ZigbeeOtaImageMeta = {
                fileName,
                url: fileName,
                manufacturerCode: image.header.manufacturerCode,
                imageType: image.header.imageType,
                fileVersion: image.header.fileVersion,
                hardwareVersionMax: image.header.maximumHardwareVersion,
            };
            const fileName2 = "custom2.ota";
            const image2 = mockImage(300, undefined, undefined, 58, undefined, undefined, 0, 3);
            const meta2: ZigbeeOtaImageMeta = {
                fileName: fileName2,
                url: fileName2,
                manufacturerCode: image2.header.manufacturerCode,
                imageType: image2.header.imageType,
                fileVersion: image2.header.fileVersion,
                hardwareVersionMax: image2.header.maximumHardwareVersion,
            };
            fetchIndexEntries.push(meta2, meta); // non-match first to ensure not order-driven
            const current: TClusterCommandPayload<"genOta", "queryNextImageRequest"> = {
                fieldControl: 0,
                manufacturerCode: image.header.manufacturerCode,
                imageType: image.header.imageType,
                fileVersion: image.header.fileVersion,
                hardwareVersion: 4,
            };
            const {device} = createSimpleDevice({});

            await expect(device.findMatchingOtaImage({}, current, {})).resolves.toMatchObject({
                fileName,
                manufacturerCode: image.header.manufacturerCode,
                imageType: image.header.imageType,
                fileVersion: image.header.fileVersion,
                hardwareVersionMax: 6,
            });
        });

        it("by extra meta hardwareVersionMax", async () => {
            const fileName = "custom.ota";
            const image = mockImage(300, undefined, undefined, 56, undefined, undefined, 0, 6);
            const meta: ZigbeeOtaImageMeta = {
                fileName,
                url: fileName,
                manufacturerCode: image.header.manufacturerCode,
                imageType: image.header.imageType,
                fileVersion: image.header.fileVersion,
                hardwareVersionMax: image.header.maximumHardwareVersion,
            };
            const fileName2 = "custom2.ota";
            const image2 = mockImage(300, undefined, undefined, 58, undefined, undefined, 0, 3);
            const meta2: ZigbeeOtaImageMeta = {
                fileName: fileName2,
                url: fileName2,
                manufacturerCode: image2.header.manufacturerCode,
                imageType: image2.header.imageType,
                fileVersion: image2.header.fileVersion,
                hardwareVersionMax: image2.header.maximumHardwareVersion,
            };
            fetchIndexEntries.push(meta2, meta); // non-match first to ensure not order-driven
            const current: TClusterCommandPayload<"genOta", "queryNextImageRequest"> = {
                fieldControl: 0,
                manufacturerCode: image.header.manufacturerCode,
                imageType: image.header.imageType,
                fileVersion: image.header.fileVersion,
            };
            const {device} = createSimpleDevice({});

            await expect(device.findMatchingOtaImage({}, current, {hardwareVersionMax: 4})).resolves.toMatchObject({
                fileName,
                manufacturerCode: image.header.manufacturerCode,
                imageType: image.header.imageType,
                fileVersion: image.header.fileVersion,
                hardwareVersionMax: 6,
            });
        });
    });

    describe("Utils", () => {
        it("parses firmware with unusual header fields", () => {
            const upgradeFileDestination = Buffer.from([0x21, 0x23, 0x34, 0x32, 0x89, 0x98, 0x76, 0x67]);
            const image = mockImage(500, undefined, undefined, undefined, 123, upgradeFileDestination, 1, 3);

            expect(otaHelpers.parseOtaHeader(image.raw)).toStrictEqual({
                otaUpgradeFileIdentifier: 0x0beef11e,
                otaHeaderVersion: 256,
                otaHeaderLength: 56,
                otaHeaderFieldControl: 7,
                manufacturerCode: 1,
                imageType: 2,
                fileVersion: 3,
                zigbeeStackVersion: 2,
                otaHeaderString: expect.stringContaining("test"),
                totalImageSize: 500,
                securityCredentialVersion: 123,
                upgradeFileDestination,
                minimumHardwareVersion: 1,
                maximumHardwareVersion: 3,
            });
        });
    });
});
