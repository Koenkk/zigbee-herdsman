// biome-ignore-all lint/complexity/useLiteralKeys: Bracket access preserves type checking of private members in tests.

import {Duplex} from "node:stream";
import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";
import {EZSPAdapter} from "../../../src/adapter/ezsp/adapter/ezspAdapter";
import {EZSPFrameData} from "../../../src/adapter/ezsp/driver/ezsp";
import {Frame, FrameType} from "../../../src/adapter/ezsp/driver/frame";
import {Parser} from "../../../src/adapter/ezsp/driver/parser";
import {EmberEUI64, EmberNetworkStatus, EmberNodeType, EmberStatus} from "../../../src/adapter/ezsp/driver/types";
import {Writer} from "../../../src/adapter/ezsp/driver/writer";
import {MutexCancelledError} from "../../../src/utils/async-mutex";
import {logger} from "../../../src/utils/logger";
import * as Zcl from "../../../src/zspec/zcl";

vi.mock("../../../src/adapter/serialPort", () => ({SerialPort: vi.fn(() => new MockSerialPort())}));

const networkOptions = {panID: 0x1234, extendedPanID: [1, 2, 3, 4, 5, 6, 7, 8], channelList: [11], networkKey: Array(16).fill(0)};
const ports: MockSerialPort[] = [];

// Only the serial transport is mocked: ASH framing, EZSP commands, startup and adapter queues are real.
class MockSerialPort extends Duplex {
    isOpen = false;
    dropUnicast = false;
    closeDelay = 0;
    readonly unicasts: {destination: number; retry: boolean}[] = [];
    readonly commands: string[] = [];
    private readonly parser = new Parser();
    private readonly writer = new Writer();
    private protocolVersion = 4;
    private sequence = 0;

    constructor() {
        super();
        ports.push(this);
        this.parser.on("parsed", (frame: Frame) => this.onFrame(frame));
        this.writer.on("data", (data: Buffer) => this.push(data));
    }

    asyncOpen(): Promise<void> {
        this.isOpen = true;
        return Promise.resolve();
    }

    asyncFlushAndClose(): Promise<void> {
        if (this.closeDelay) {
            return new Promise((resolve) =>
                setTimeout(() => {
                    this.isOpen = false;
                    this.emit("close");
                    resolve();
                }, this.closeDelay),
            );
        }
        this.isOpen = false;
        this.emit("close");
        return Promise.resolve();
    }

    override _read(): void {}

    override _write(data: Buffer, _encoding: BufferEncoding, callback: (error?: Error | null) => void): void {
        this.parser.write(data);
        callback();
    }

    private respond(name: string, params: Record<string, unknown>, commandSequence: number, ack: number): void {
        const frame = new EZSPFrameData(name, false, params);
        const header = this.protocolVersion < 8 ? [commandSequence, 0x80, frame.id] : [commandSequence, 0x80, 0x01, frame.id & 0xff, frame.id >> 8];
        this.writer.sendData(Frame.makeRandomizedBuffer(Buffer.concat([Buffer.from(header), frame.serialize()])), this.sequence, 0, ack);
        this.sequence = (this.sequence + 1) & 7;
    }

    private onFrame(frame: Frame): void {
        frame.checkCRC();
        if (frame.type === FrameType.RST) {
            // ASH RSTACK: protocol version 2, software reset, CRC and delimiter.
            setTimeout(() => this.push(Buffer.from([0xc1, 0x02, 0x0b, 0x0a, 0x52, 0x7e])), 1);
            return;
        }
        if (frame.type !== FrameType.DATA) {
            return;
        }

        const data = Frame.makeRandomizedBuffer(frame.buffer.subarray(1, -3));
        const headerLength = this.protocolVersion < 8 ? 3 : 5;
        const id = this.protocolVersion < 8 ? data[2] : data.readUInt16LE(3);
        // addEndpoint's variable-length cluster lists only have a host-side serializer.
        const request =
            id === 0x0002
                ? new EZSPFrameData("addEndpoint", true, {})
                : EZSPFrameData.createFrame(this.protocolVersion, id, true, data.subarray(headerLength));
        this.commands.push(request.name);
        if (request.name === "sendUnicast") {
            this.unicasts.push({destination: request.indexOrDestination, retry: (frame.control & 0x08) !== 0});
            if (this.dropUnicast) {
                return;
            }
        }

        const ack = (((frame.control >> 4) & 7) + 1) & 7;
        const params = this.responseParams(request);
        setTimeout(() => {
            this.respond(request.name, params, data[0], ack);
            if (request.name === "version") {
                this.protocolVersion = 8;
            } else if (request.name === "networkInit") {
                this.respond("stackStatusHandler", {status: EmberStatus.NETWORK_UP}, data[0], ack);
            }
        }, 1);
    }

    private responseParams(request: EZSPFrameData): Record<string, unknown> {
        switch (request.name) {
            case "version":
                return {protocolVersion: 8, stackType: 2, stackVersion: 0x6780};
            case "getValue":
                return {status: EmberStatus.SUCCESS, value: Buffer.from([0, 0, 6, 7, 8, 0, 0])};
            case "getNetworkParameters":
                return {
                    status: EmberStatus.SUCCESS,
                    nodeType: EmberNodeType.COORDINATOR,
                    parameters: {
                        extendedPanId: networkOptions.extendedPanID,
                        panId: networkOptions.panID,
                        radioTxPower: 5,
                        radioChannel: 11,
                        joinMethod: 0,
                        nwkManagerId: 0,
                        nwkUpdateId: 0,
                        channels: 1 << 11,
                    },
                };
            case "networkState":
                return {status: EmberNetworkStatus.JOINED_NETWORK};
            case "getNodeId":
                return {nodeId: 0};
            case "getEui64":
                return {eui64: new EmberEUI64("0x0000000000000001")};
            case "getKey":
                return {
                    status: EmberStatus.SUCCESS,
                    keyStruct: {
                        bitmask: 0,
                        type: request.keyType,
                        key: {contents: Buffer.alloc(16)},
                        outgoingFrameCounter: 0,
                        incomingFrameCounter: 0,
                        sequenceNumber: 0,
                        partnerEUI64: new EmberEUI64("0x0000000000000000"),
                    },
                };
            case "getConfigurationValue":
                return {status: EmberStatus.SUCCESS, value: 1};
            case "getMulticastTableEntry":
                return {value: {multicastId: 0, endpoint: 0, networkIndex: 0}};
            case "sendUnicast":
                return {status: EmberStatus.SUCCESS, sequence: request.apsFrame.sequence};
            case "setSourceRouteDiscoveryMode":
                return {remainingTime: 0};
            case "setConfigurationValue":
            case "setPolicy":
            case "setValue":
            case "setConcentrator":
            case "addEndpoint":
            case "networkInit":
            case "setMulticastTableEntry":
                return {status: EmberStatus.SUCCESS};
            case "setManufacturerCode":
            case "nop":
                return {};
            default:
                throw new Error(`Unexpected command: ${request.name}`);
        }
    }
}

describe("EZSP recovery", () => {
    let adapter: EZSPAdapter;

    beforeEach(() => {
        vi.useFakeTimers();
        ports.length = 0;
        adapter = new EZSPAdapter(networkOptions, {path: "/dev/ttyMOCK"}, "", {concurrent: 4, disableLED: false});
    });

    afterEach(async () => {
        await adapter.stop();
        for (const port of ports) {
            port.destroy();
        }
        vi.clearAllTimers();
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    it.each([0, 10000])("does not retry or reset during shutdown with a queued watchdog (close delay %i ms)", async (closeDelay) => {
        const started = adapter.start();
        await vi.advanceTimersByTimeAsync(11000);
        await expect(started).resolves.toBe("resumed");
        const driver = adapter["driver"];
        const ezsp = driver.ezsp;
        ezsp["failures"] = 4;
        const reset = vi.spyOn(driver, "reset");
        const logErrors = vi.spyOn(logger, "error");
        const port = ports[0];
        port.closeDelay = closeDelay;
        port.dropUnicast = true;
        const frame = Zcl.Frame.create(Zcl.FrameType.SPECIFIC, Zcl.Direction.CLIENT_TO_SERVER, false, undefined, 1, "on", "genOnOff", {}, {});
        const errors: Error[] = [];
        const commands = [0x1111, 0x2222].map((address) =>
            adapter
                .sendZclFrameToEndpoint(`0x${address.toString(16).padStart(16, "0")}`, address, 1, frame, 1000, false, false)
                .catch((error: Error) => {
                    errors.push(error);
                }),
        );
        await vi.advanceTimersByTimeAsync(1001);
        expect(ezsp["queue"].count).toBe(2); // second device command and watchdog
        const stopping = adapter.stop();
        await vi.advanceTimersByTimeAsync(15000);
        await stopping;
        expect(reset).not.toHaveBeenCalled();
        expect(logErrors).not.toHaveBeenCalled();
        expect(ports).toHaveLength(1);
        expect(port.unicasts).toEqual([{destination: 0x1111, retry: false}]);
        expect(errors).toEqual([new MutexCancelledError(), new MutexCancelledError()]);
        await Promise.all(commands);
        expect(adapter["queue"].count()).toBe(0);
        expect(adapter["waitress"]["waiters"].size).toBe(0);
        expect(ezsp["failures"]).toBe(4);
    });

    it("cancels an active command when shutdown occurs during the UART retry delay", async () => {
        const started = adapter.start();
        await vi.advanceTimersByTimeAsync(3500);
        await started;
        const port = ports[0];
        port.dropUnicast = true;
        const frame = Zcl.Frame.create(Zcl.FrameType.SPECIFIC, Zcl.Direction.CLIENT_TO_SERVER, true, undefined, 1, "on", "genOnOff", {}, {});
        const command = adapter.sendZclFrameToEndpoint("0x0000000000001111", 0x1111, 1, frame, 1000, true, false);
        const rejection = expect(command).rejects.toBeInstanceOf(MutexCancelledError);
        await vi.advanceTimersByTimeAsync(4000);
        const logErrors = vi.spyOn(logger, "error");
        const reset = vi.spyOn(adapter["driver"], "reset");
        await adapter.stop();
        await vi.advanceTimersByTimeAsync(5000);
        await rejection;
        expect(port.unicasts).toEqual([{destination: 0x1111, retry: false}]);
        expect(reset).not.toHaveBeenCalled();
        expect(logErrors).not.toHaveBeenCalled();
        expect(adapter["queue"].count()).toBe(0);
    });

    it("releases device slots after both UART ACKs time out and completes commands after reconnect", async () => {
        const started = adapter.start();
        const logErrors = vi.spyOn(logger, "error");
        await vi.advanceTimersByTimeAsync(3500);
        expect(logErrors.mock.calls).toEqual([]);
        expect(ports[0].commands.join(",")).toContain("setMulticastTableEntry");
        await expect(started).resolves.toBe("resumed");
        const disconnected = vi.fn();
        adapter.on("disconnected", disconnected);
        const startup = vi.spyOn(adapter["driver"], "startup");
        const reset = vi.spyOn(adapter["driver"], "reset");
        const firstPort = ports[0];
        firstPort.dropUnicast = true;
        const frame = Zcl.Frame.create(Zcl.FrameType.SPECIFIC, Zcl.Direction.CLIENT_TO_SERVER, true, undefined, 1, "on", "genOnOff", {}, {});
        const send = (address: number) =>
            adapter.sendZclFrameToEndpoint(`0x${address.toString(16).padStart(16, "0")}`, address, 1, frame, 1000, true, false);
        const results: unknown[] = [];
        const interrupted = [0x1111, 0x2222, 0x3333].map((address) =>
            send(address).then(
                () => results.push("resolved"),
                (error: Error) => results.push(error),
            ),
        );

        await vi.advanceTimersByTimeAsync(4000);
        expect(firstPort.unicasts).toEqual([{destination: 0x1111, retry: false}]);
        expect(reset).not.toHaveBeenCalled();
        await vi.advanceTimersByTimeAsync(500);
        expect(firstPort.unicasts).toEqual([
            {destination: 0x1111, retry: false},
            {destination: 0x1111, retry: true},
        ]);
        await vi.advanceTimersByTimeAsync(4000);
        expect(reset).toHaveBeenCalledTimes(1);
        expect(firstPort.isOpen).toBe(false);
        expect(results).toEqual(Array.from({length: 3}, () => new MutexCancelledError()));
        await Promise.all(interrupted);
        expect(adapter["queue"].count()).toBe(0);

        await vi.advanceTimersByTimeAsync(4500);
        expect(startup).toHaveBeenCalledTimes(1);
        await expect(startup.mock.results[0].value).resolves.toBe("resumed");
        await expect(reset.mock.results[0].value).resolves.toBeUndefined();
        expect(ports).toHaveLength(2);
        expect(ports[1].isOpen).toBe(true);
        expect(ports[1].commands).toContain("setMulticastTableEntry");
        expect(disconnected).not.toHaveBeenCalled();

        const fresh = Promise.all([0x1111, 0x2222, 0x3333, 0x4444].map(send));
        await vi.advanceTimersByTimeAsync(100);
        await expect(fresh).resolves.toEqual([undefined, undefined, undefined, undefined]);
        expect(ports[1].unicasts).toEqual([0x1111, 0x2222, 0x3333, 0x4444].map((destination) => ({destination, retry: false})));
        expect(adapter["queue"].count()).toBe(0);
    });
});
