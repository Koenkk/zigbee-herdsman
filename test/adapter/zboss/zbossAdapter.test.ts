import {describe, expect, it, vi} from "vitest";
import {ZBOSSAdapter} from "../../../src/adapter/zboss/adapter/zbossAdapter";
import type {ZBOSSDriver} from "../../../src/adapter/zboss/driver";
import {CommandId, DeviceType} from "../../../src/adapter/zboss/enums";
import {FrameType, type ZBOSSFrame} from "../../../src/adapter/zboss/frame";
import type {KeyValue} from "../../../src/controller/tstype";

const EXT_PAN_ID = [0xdd, 0xdd, 0xdd, 0xdd, 0xdd, 0xdd, 0xdd, 0xdd];
const NETWORK_KEY = [0x01, 0x03, 0x05, 0x07, 0x09, 0x0b, 0x0d, 0x0f, 0x00, 0x02, 0x04, 0x06, 0x08, 0x0a, 0x0c, 0x0d];

/** Answers driver commands like a ZBOSS NCP: a factory reset blanks the network, a formation applies the PAN ID and channel set before it. */
function mockNcp(adapter: ZBOSSAdapter, network?: {panID: number; channel: number}): void {
    const ncp = {
        joined: network !== undefined,
        panID: network?.panID ?? 0xffff,
        channel: network?.channel ?? 0xff,
        pendingPanID: 0xffff,
        pendingMask: 0,
    };

    // @ts-expect-error private
    const driver: ZBOSSDriver = adapter.driver;

    vi.spyOn(driver, "connect").mockResolvedValue(true);
    vi.spyOn(driver, "execCommand").mockImplementation(async (commandId: number, params: KeyValue = {}): Promise<ZBOSSFrame> => {
        let payload: KeyValue = {};

        switch (commandId) {
            case CommandId.GET_JOINED:
                payload = {joined: ncp.joined ? 1 : 0};
                break;
            case CommandId.GET_ZIGBEE_ROLE:
                payload = {role: DeviceType.COORDINATOR};
                break;
            case CommandId.GET_LOCAL_IEEE_ADDR:
                payload = {mac: 0, ieee: "0x0011223344556677"};
                break;
            case CommandId.GET_EXTENDED_PAN_ID:
                payload = {extendedPanID: Buffer.from(ncp.joined ? EXT_PAN_ID : new Array(8).fill(0))};
                break;
            case CommandId.GET_PAN_ID:
                payload = {panID: ncp.panID};
                break;
            case CommandId.GET_ZIGBEE_CHANNEL:
                payload = {page: 0, channel: ncp.channel};
                break;
            case CommandId.SET_PAN_ID:
                ncp.pendingPanID = params.panID;
                break;
            case CommandId.SET_ZIGBEE_CHANNEL_MASK:
                ncp.pendingMask = params.mask;
                break;
            case CommandId.NCP_RESET:
                ncp.joined = false;
                ncp.panID = 0xffff;
                ncp.channel = 0xff;
                break;
            case CommandId.NWK_FORMATION:
                ncp.joined = true;
                ncp.panID = ncp.pendingPanID;
                // single-channel mask (channelList has one entry)
                ncp.channel = Math.log2(ncp.pendingMask);
                break;
        }

        return await Promise.resolve({version: 0, type: FrameType.RESPONSE, commandId, tsn: 0, payload: {category: 0, status: 0, ...payload}});
    });
}

function createAdapter(panID: number): ZBOSSAdapter {
    return new ZBOSSAdapter(
        {panID, extendedPanID: EXT_PAN_ID, channelList: [15], networkKey: NETWORK_KEY},
        {path: "/dev/serial/by-id/mock-adapter", adapter: "zboss"},
        "backup.json",
        {disableLED: false},
    );
}

describe("ZBOSS Adapter", () => {
    it("reports the formed network after forming on a blank NCP", async () => {
        const adapter = createAdapter(0x1872);
        mockNcp(adapter);

        await expect(adapter.start()).resolves.toStrictEqual("reset");
        await expect(adapter.getNetworkParameters()).resolves.toStrictEqual({
            panID: 0x1872,
            extendedPanID: "0xdddddddddddddddd",
            channel: 15,
            nwkUpdateID: 0,
        });
    });

    it("reports the new network after a factory reset and reform", async () => {
        const adapter = createAdapter(0x1873);
        mockNcp(adapter, {panID: 0x1872, channel: 15});

        await expect(adapter.start()).resolves.toStrictEqual("reset");
        await expect(adapter.getNetworkParameters()).resolves.toStrictEqual({
            panID: 0x1873,
            extendedPanID: "0xdddddddddddddddd",
            channel: 15,
            nwkUpdateID: 0,
        });
    });
});
