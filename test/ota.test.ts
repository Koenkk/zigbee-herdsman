import fs from "node:fs";
import path from "node:path";
import {describe, expect, it, vi} from "vitest";
import * as otaHelpers from "../src/controller/helpers/ota";
import {OtaSession} from "../src/controller/helpers/ota";
import Device from "../src/controller/model/device";
import type Endpoint from "../src/controller/model/endpoint";
import type {KeyValue, OtaImage, OtaImageHeader, ZigbeeOtaImageMeta} from "../src/controller/tstype";
import {logger} from "../src/utils/logger";
import * as Zcl from "../src/zspec/zcl";
import type {TClusterCommandPayload} from "../src/zspec/zcl/definition/clusters-types";
import type {Cluster, Command} from "../src/zspec/zcl/definition/tstype";
import type {TZclFrame} from "../src/zspec/zcl/zclFrame";

const mockImage = (totalImageSize: number): OtaImage => ({
    header: {
        otaUpgradeFileIdentifier: otaHelpers.UPGRADE_FILE_IDENTIFIER,
        otaHeaderVersion: 1,
        otaHeaderLength: 56,
        otaHeaderFieldControl: 0,
        manufacturerCode: 1,
        imageType: 2,
        fileVersion: 3,
        zigbeeStackVersion: 0,
        otaHeaderString: "test",
        totalImageSize,
    },
    elements: [],
    raw: Buffer.alloc(totalImageSize, 1),
});

const loadImage = (fileName: string): OtaImage => {
    const filePath = path.join(__dirname, "data", fileName);
    const buffer = fs.readFileSync(filePath);

    return otaHelpers.parseOtaImage(buffer);
};

const buildBlockRequests = (header: OtaImageHeader, maximumDataSize: number): OtaEvent[] => {
    const events: OtaEvent[] = [];
    let offset = 0;

    while (offset < header.totalImageSize) {
        events.push({
            commandId: Zcl.Clusters.genOta.commands.imageBlockRequest.ID,
            header: {transactionSequenceNumber: offset / maximumDataSize + 1} as Zcl.Header,
            payload: {
                fieldControl: 0,
                manufacturerCode: header.manufacturerCode,
                imageType: header.imageType,
                fileVersion: header.fileVersion,
                fileOffset: offset,
                maximumDataSize,
            } as TClusterCommandPayload<"genOta", "imageBlockRequest">,
            delayMs: 0,
        });

        offset += maximumDataSize;
    }

    return events;
};

type OtaEvent = {
    commandId: number;
    header: Zcl.Header;
    payload: TClusterCommandPayload<"genOta", "imageBlockRequest" | "imagePageRequest" | "upgradeEndRequest">;
    delayMs: number;
    error?: string;
};

function createWaitForCommand(events: OtaEvent[]) {
    return <Co extends string>(
        _endpointId: number,
        commandId: number,
        _transactionSequenceNumber: number | undefined,
        timeout: number,
    ): {promise: Promise<TZclFrame<"genOta", Co>>; cancel: () => void} => {
        const index = events.findIndex((event) => event.commandId === commandId);

        if (index === -1) {
            let timer: NodeJS.Timeout | undefined;
            const promise = new Promise<TZclFrame<"genOta", Co>>((_, reject) => {
                timer = setTimeout(() => reject(new Error("timeout")), timeout);
            });

            return {
                promise,
                cancel: () => {
                    if (timer) {
                        clearTimeout(timer);
                    }
                },
            };
        }

        const [event] = events.splice(index, 1);
        const promise = new Promise<TZclFrame<"genOta", Co>>((resolve, reject) => {
            setTimeout(() => {
                if (event.error) {
                    reject(new Error(event.error));
                } else {
                    resolve({
                        header: event.header,
                        payload: event.payload as TClusterCommandPayload<"genOta", Co>,
                        command: {ID: commandId} as Command,
                        cluster: {ID: Zcl.Clusters.genOta.ID} as Cluster,
                    });
                }
            }, event.delayMs);
        });

        return {promise, cancel: vi.fn()};
    };
}

describe("OtaSession", () => {
    const runSession = (
        image: OtaImage,
        waitForCommand: ReturnType<typeof createWaitForCommand>,
        responseDelay: number,
        baseDataSize: number,
        requestTimeout?: number,
    ) => {
        const onProgress = vi.fn<(progress: number, remaining?: number) => void>();
        const commandResponse = vi
            .fn<(clusterKey: string, commandKey: string, payload: KeyValue, options?: KeyValue, requestTsn?: number) => Promise<void>>()
            .mockResolvedValue();
        const endpoint = {commandResponse} as unknown as Endpoint;
        const session = new OtaSession(
            "0x1f2f3f4f5f6f7f8f",
            endpoint,
            image,
            onProgress,
            requestTimeout,
            responseDelay,
            baseDataSize,
            waitForCommand,
        );

        return {session, onProgress, commandResponse};
    };

    it("sends block responses and reports progress", async () => {
        const image = mockImage(100);
        const waitForCommand = createWaitForCommand([
            {
                commandId: Zcl.Clusters.genOta.commands.imageBlockRequest.ID,
                header: {transactionSequenceNumber: 11} as Zcl.Header,
                payload: {
                    fieldControl: 0,
                    manufacturerCode: 1,
                    imageType: 2,
                    fileVersion: 1,
                    fileOffset: 0,
                    maximumDataSize: 20,
                } as TClusterCommandPayload<"genOta", "imageBlockRequest">,
                delayMs: 0,
            },
            {
                commandId: Zcl.Clusters.genOta.commands.upgradeEndRequest.ID,
                header: {transactionSequenceNumber: 99} as Zcl.Header,
                payload: {status: Zcl.Status.SUCCESS} as TClusterCommandPayload<"genOta", "upgradeEndRequest">,
                delayMs: 200,
            },
        ]);

        vi.useFakeTimers();

        const performanceNow = vi.spyOn(performance, "now");
        // Force an initial timestamp larger than the progress throttle threshold so progress is reported immediately
        let now = 31000;
        performanceNow.mockImplementation(() => now);
        const advance = async (ms: number) => {
            now += ms;
            await vi.advanceTimersByTimeAsync(ms);
        };

        const {session, onProgress, commandResponse} = runSession(image, waitForCommand, 100, 64);

        const runPromise = session.run();

        await advance(0);
        await advance(100);
        await advance(200);

        const upgradeEnd = await runPromise;

        expect(commandResponse).toHaveBeenCalledTimes(1);
        expect(commandResponse).toHaveBeenCalledWith(
            "genOta",
            "imageBlockResponse",
            expect.objectContaining({dataSize: 20, fileOffset: 0}),
            undefined,
            11,
        );
        expect(onProgress).toHaveBeenCalledTimes(1);
        expect(onProgress).toHaveBeenCalledWith(20, expect.any(Number));
        expect(upgradeEnd.payload.status).toBe(Zcl.Status.SUCCESS);

        vi.useRealTimers();
        performanceNow.mockRestore();
    });

    it("handles page requests over multiple blocks", async () => {
        const image = mockImage(80);
        const waitForCommand = createWaitForCommand([
            {
                commandId: Zcl.Clusters.genOta.commands.imagePageRequest.ID,
                header: {transactionSequenceNumber: 7} as Zcl.Header,
                payload: {
                    fieldControl: 0,
                    manufacturerCode: 1,
                    imageType: 2,
                    fileVersion: 1,
                    fileOffset: 0,
                    maximumDataSize: 30,
                    pageSize: 40,
                } as TClusterCommandPayload<"genOta", "imagePageRequest">,
                delayMs: 0,
            },
            {
                commandId: Zcl.Clusters.genOta.commands.upgradeEndRequest.ID,
                header: {transactionSequenceNumber: 100} as Zcl.Header,
                payload: {status: Zcl.Status.SUCCESS} as TClusterCommandPayload<"genOta", "upgradeEndRequest">,
                delayMs: 200,
            },
        ]);

        vi.useFakeTimers();

        const performanceNow = vi.spyOn(performance, "now");
        // Force an initial timestamp larger than the progress throttle threshold so progress is reported immediately
        let now = 31000;
        performanceNow.mockImplementation(() => now);
        const advance = async (ms: number) => {
            now += ms;
            await vi.advanceTimersByTimeAsync(ms);
        };

        const {session, onProgress, commandResponse} = runSession(image, waitForCommand, 0, 64);

        const runPromise = session.run();

        await advance(0);
        await advance(200);

        const upgradeEnd = await runPromise;

        expect(commandResponse).toHaveBeenCalledTimes(2);
        expect(commandResponse).toHaveBeenNthCalledWith(
            1,
            "genOta",
            "imageBlockResponse",
            expect.objectContaining({dataSize: 30, fileOffset: 0}),
            undefined,
            7,
        );
        expect(commandResponse).toHaveBeenNthCalledWith(
            2,
            "genOta",
            "imageBlockResponse",
            expect.objectContaining({dataSize: 10, fileOffset: 30}),
            undefined,
            7,
        );
        expect(onProgress).toHaveBeenCalled();
        expect(upgradeEnd.payload.status).toBe(Zcl.Status.SUCCESS);

        vi.useRealTimers();
        performanceNow.mockRestore();
    });

    it.each([
        "integrity-code-1166-012B-24031511-upgradeMe-RB 249 T.zigbee",
        "manuf-spe-A60_RGBW_T-0x00B6-0x03483712-MF_DIS.OTA",
        "zbminir2_v1.0.8.ota",
    ])("completes OTA for real image %s", async (fileName) => {
        // no-op for perf
        const loggerDebugSpy = vi.spyOn(logger, "debug").mockImplementation(() => {});

        const image = loadImage(fileName);
        const chunkSize = 64;
        const requests = buildBlockRequests(image.header, chunkSize);
        requests.push({
            commandId: Zcl.Clusters.genOta.commands.upgradeEndRequest.ID,
            header: {transactionSequenceNumber: 255} as Zcl.Header,
            payload: {status: Zcl.Status.SUCCESS} as TClusterCommandPayload<"genOta", "upgradeEndRequest">,
            delayMs: 50,
        });
        const requestsLength = requests.length;

        vi.useFakeTimers();

        const waitForCommand = createWaitForCommand(requests);

        const {session, commandResponse} = runSession(image, waitForCommand, 0, chunkSize);
        const runPromise = session.run();

        await vi.runAllTimersAsync();
        const result = await runPromise;

        const expectedBlocks = Math.ceil(image.header.totalImageSize / chunkSize);

        expect(commandResponse).toHaveBeenCalledTimes(requestsLength - 1);
        expect(commandResponse).toHaveBeenCalledTimes(expectedBlocks);
        const lastOffset = (expectedBlocks - 1) * chunkSize;
        const lastSize = image.header.totalImageSize - lastOffset;

        expect(commandResponse).toHaveBeenNthCalledWith(
            1,
            "genOta",
            "imageBlockResponse",
            expect.objectContaining({fileOffset: 0, dataSize: chunkSize, data: image.raw.subarray(0, chunkSize)}),
            undefined,
            expect.any(Number),
        );
        expect(commandResponse).toHaveBeenNthCalledWith(
            2,
            "genOta",
            "imageBlockResponse",
            expect.objectContaining({fileOffset: chunkSize, dataSize: chunkSize, data: image.raw.subarray(chunkSize, chunkSize * 2)}),
            undefined,
            expect.any(Number),
        );
        expect(commandResponse).toHaveBeenNthCalledWith(
            3,
            "genOta",
            "imageBlockResponse",
            expect.objectContaining({fileOffset: chunkSize * 2, dataSize: chunkSize, data: image.raw.subarray(chunkSize * 2, chunkSize * 3)}),
            undefined,
            expect.any(Number),
        );
        expect(commandResponse).toHaveBeenNthCalledWith(
            expectedBlocks,
            "genOta",
            "imageBlockResponse",
            expect.objectContaining({fileOffset: lastOffset, dataSize: lastSize, data: image.raw.subarray(image.raw.length - lastSize)}),
            undefined,
            expect.any(Number),
        );
        expect(result.payload.status).toBe(Zcl.Status.SUCCESS);

        vi.useRealTimers();
        loggerDebugSpy.mockRestore();
    });

    it("handles out-of-order block offsets", async () => {
        const image = mockImage(200);
        const waitForCommand = createWaitForCommand([
            {
                commandId: Zcl.Clusters.genOta.commands.imageBlockRequest.ID,
                header: {transactionSequenceNumber: 1} as Zcl.Header,
                payload: {
                    fieldControl: 0,
                    manufacturerCode: image.header.manufacturerCode,
                    imageType: image.header.imageType,
                    fileVersion: image.header.fileVersion,
                    fileOffset: 0,
                    maximumDataSize: 50,
                } as TClusterCommandPayload<"genOta", "imageBlockRequest">,
                delayMs: 0,
            },
            {
                commandId: Zcl.Clusters.genOta.commands.imageBlockRequest.ID,
                header: {transactionSequenceNumber: 2} as Zcl.Header,
                payload: {
                    fieldControl: 0,
                    manufacturerCode: image.header.manufacturerCode,
                    imageType: image.header.imageType,
                    fileVersion: image.header.fileVersion,
                    fileOffset: 50,
                    maximumDataSize: 50,
                } as TClusterCommandPayload<"genOta", "imageBlockRequest">,
                delayMs: 0,
            },
            {
                commandId: Zcl.Clusters.genOta.commands.imageBlockRequest.ID,
                header: {transactionSequenceNumber: 3} as Zcl.Header,
                payload: {
                    fieldControl: 0,
                    manufacturerCode: image.header.manufacturerCode,
                    imageType: image.header.imageType,
                    fileVersion: image.header.fileVersion,
                    fileOffset: 40,
                    maximumDataSize: 50,
                } as TClusterCommandPayload<"genOta", "imageBlockRequest">,
                delayMs: 0,
            },
            {
                commandId: Zcl.Clusters.genOta.commands.upgradeEndRequest.ID,
                header: {transactionSequenceNumber: 99} as Zcl.Header,
                payload: {status: Zcl.Status.SUCCESS} as TClusterCommandPayload<"genOta", "upgradeEndRequest">,
                delayMs: 200,
            },
        ]);

        const {session, commandResponse} = runSession(image, waitForCommand, 0, 64);
        const result = await session.run();

        expect(commandResponse).toHaveBeenCalledTimes(3);
        expect(commandResponse).toHaveBeenNthCalledWith(
            1,
            "genOta",
            "imageBlockResponse",
            expect.objectContaining({fileOffset: 0, dataSize: 50}),
            undefined,
            1,
        );
        expect(commandResponse).toHaveBeenNthCalledWith(
            2,
            "genOta",
            "imageBlockResponse",
            expect.objectContaining({fileOffset: 50, dataSize: 50}),
            undefined,
            2,
        );
        expect(commandResponse).toHaveBeenNthCalledWith(
            3,
            "genOta",
            "imageBlockResponse",
            expect.objectContaining({fileOffset: 40, dataSize: 50}),
            undefined,
            3,
        );
        expect(result.payload.status).toBe(Zcl.Status.SUCCESS);
    });

    it("fails when device stops sending data requests", async () => {
        const image = mockImage(100);
        const waitForCommand = createWaitForCommand([
            {
                commandId: Zcl.Clusters.genOta.commands.imageBlockRequest.ID,
                header: {transactionSequenceNumber: 1} as Zcl.Header,
                payload: {
                    fieldControl: 0,
                    manufacturerCode: image.header.manufacturerCode,
                    imageType: image.header.imageType,
                    fileVersion: image.header.fileVersion,
                    fileOffset: 0,
                    maximumDataSize: 50,
                } as TClusterCommandPayload<"genOta", "imageBlockRequest">,
                delayMs: 0,
            },
            {
                commandId: Zcl.Clusters.genOta.commands.imageBlockRequest.ID,
                header: {transactionSequenceNumber: 2} as Zcl.Header,
                payload: {
                    fieldControl: 0,
                    manufacturerCode: image.header.manufacturerCode,
                    imageType: image.header.imageType,
                    fileVersion: image.header.fileVersion,
                    fileOffset: 50,
                    maximumDataSize: 50,
                } as TClusterCommandPayload<"genOta", "imageBlockRequest">,
                delayMs: 100,
                error: "device stopped",
            },
        ]);

        const {session} = runSession(image, waitForCommand, 0, 50);

        await expect(session.run()).rejects.toThrow("did not start/finish firmware download");
    });

    it("fails when upgrade end is never received after data", async () => {
        const image = mockImage(60);
        const requests = buildBlockRequests(image.header, 30);
        requests.push({
            commandId: Zcl.Clusters.genOta.commands.imageBlockRequest.ID,
            header: {transactionSequenceNumber: 99} as Zcl.Header,
            payload: {
                fieldControl: 0,
                manufacturerCode: image.header.manufacturerCode,
                imageType: image.header.imageType,
                fileVersion: image.header.fileVersion,
                fileOffset: image.header.totalImageSize,
                maximumDataSize: 30,
            } as TClusterCommandPayload<"genOta", "imageBlockRequest">,
            delayMs: 0,
            error: "no upgrade end",
        });
        const waitForCommand = createWaitForCommand(requests);

        const {session} = runSession(image, waitForCommand, 0, 30);

        await expect(session.run()).rejects.toThrow("did not start/finish firmware download");
    });
});

describe("checkOta matching", () => {
    const findMatching = Device.prototype.findMatchingOtaImage as unknown as (
        this: {
            modelID?: string;
            manufacturerName?: string;
            meta: {lumiFileVersion?: number};
        },
        dataDir: string,
        overrideIndexFileName: string | undefined,
        current: TClusterCommandPayload<"genOta", "queryNextImageRequest">,
        extraMetas: {modelId?: string; otaHeaderString?: string; hardwareVersionMin?: number; hardwareVersionMax?: number; manufacturerName?: string},
        previous: boolean,
    ) => Promise<ZigbeeOtaImageMeta | undefined>;

    it("matches image based on manufacturer and type", async () => {
        const image = loadImage("zbminir2_v1.0.8.ota");
        const meta: ZigbeeOtaImageMeta = {
            fileName: "zbmini",
            url: "http://example/zbmini",
            manufacturerCode: image.header.manufacturerCode,
            imageType: image.header.imageType,
            fileVersion: image.header.fileVersion,
        } as ZigbeeOtaImageMeta;

        const indexSpy = vi.spyOn(otaHelpers, "getOtaIndex").mockResolvedValue([meta]);
        const result = await findMatching.call(
            {modelID: "any", manufacturerName: "any", meta: {}},
            "",
            undefined,
            {
                fieldControl: 0,
                manufacturerCode: image.header.manufacturerCode,
                imageType: image.header.imageType,
                fileVersion: image.header.fileVersion,
            },
            {},
            false,
        );

        expect(result).toEqual(meta);

        indexSpy.mockRestore();
    });

    it("respects hardware version bounds", async () => {
        const image = loadImage("zbminir2_v1.0.8.ota");
        const meta: ZigbeeOtaImageMeta = {
            fileName: "hw-bounded",
            url: "http://example/hw",
            manufacturerCode: image.header.manufacturerCode,
            imageType: image.header.imageType,
            fileVersion: image.header.fileVersion,
            hardwareVersionMin: 10,
            hardwareVersionMax: 20,
        } as ZigbeeOtaImageMeta;

        const indexSpy = vi.spyOn(otaHelpers, "getOtaIndex").mockResolvedValue([meta]);
        const result = await findMatching.call(
            {modelID: "any", manufacturerName: "any", meta: {}},
            "",
            undefined,
            {
                fieldControl: 0,
                manufacturerCode: image.header.manufacturerCode,
                imageType: image.header.imageType,
                fileVersion: image.header.fileVersion,
                hardwareVersion: 15,
            },
            {},
            false,
        );

        expect(result).toEqual(meta);

        indexSpy.mockRestore();
    });
});
