import {describe, expect, it, vi} from "vitest";
import type {AdditionalCoordinatorEndpoint} from "../../../src/adapter/coordinatorEndpoints";
import {EmberAdapter} from "../../../src/adapter/ember/adapter/emberAdapter";
import {FIXED_ENDPOINTS, fixedEndpoints} from "../../../src/adapter/ember/adapter/endpoints";
import {EmberIncomingMessageType} from "../../../src/adapter/ember/enums";
import type {EmberApsFrame, EmberRxPacketInfo} from "../../../src/adapter/ember/types";
import * as ZSpec from "../../../src/zspec";

const ADDITIONAL_ENDPOINT: AdditionalCoordinatorEndpoint = {
    profileId: 0xc51e,
    deviceId: 0x0000,
    deviceVersion: 0x01,
    inputClusters: [0x0003, 0xfd05, 0xfd01],
    outputClusters: [0x0003, 0xfd00, 0xfd01, 0x000a, 0x001b, 0x0402, 0x0a00, 0x0b02, 0xfd02],
};

describe("Ember coordinator endpoints", () => {
    it("keeps fixed endpoints by default", () => {
        expect(fixedEndpoints()).toStrictEqual(FIXED_ENDPOINTS);
    });

    it("appends additional coordinator endpoints using the first available endpoint ID", () => {
        expect(fixedEndpoints([ADDITIONAL_ENDPOINT])).toStrictEqual([
            ...FIXED_ENDPOINTS,
            {
                endpoint: 0x02,
                profileId: 0xc51e,
                deviceId: 0x0000,
                deviceVersion: 0x01,
                inClusterList: [0x0003, 0xfd05, 0xfd01],
                outClusterList: [0x0003, 0xfd00, 0xfd01, 0x000a, 0x001b, 0x0402, 0x0a00, 0x0b02, 0xfd02],
                networkIndex: 0x00,
                multicastIds: [],
            },
        ]);
    });

    it.each([
        ["configured Miele profile", 0xc51e, 0xc51e, EmberIncomingMessageType.UNICAST, true],
        ["configured private profile", 0xabcd, 0xabcd, EmberIncomingMessageType.UNICAST, true],
        ["unconfigured Miele profile", 0xc51e, undefined, EmberIncomingMessageType.UNICAST, false],
        ["unconfigured private profile", 0xc51f, 0xc51e, EmberIncomingMessageType.UNICAST, false],
        ["Home Automation profile", ZSpec.HA_PROFILE_ID, undefined, EmberIncomingMessageType.UNICAST, true],
        ["wildcard profile", ZSpec.WILDCARD_PROFILE_ID, undefined, EmberIncomingMessageType.UNICAST, true],
        ["Shelly profile", ZSpec.CUSTOM_SHELLY_PROFILE_ID, undefined, EmberIncomingMessageType.UNICAST, true],
        ["Control4 profile", ZSpec.CUSTOM_CONTROL4_PROFILE_ID, undefined, EmberIncomingMessageType.UNICAST, true],
        ["Green Power profile", ZSpec.GP_PROFILE_ID, undefined, EmberIncomingMessageType.UNICAST, true],
        ["Green Power broadcast loopback", ZSpec.GP_PROFILE_ID, undefined, EmberIncomingMessageType.BROADCAST_LOOPBACK, false],
        ["configured Green Power broadcast loopback", ZSpec.GP_PROFILE_ID, ZSpec.GP_PROFILE_ID, EmberIncomingMessageType.BROADCAST_LOOPBACK, false],
    ])("handles incoming traffic for %s", (_name, profileId, configuredProfileId, type, forwarded) => {
        const adapter = new EmberAdapter({panID: 0x1234, channelList: [20]}, {path: "MOCK", adapter: "ember"}, "temp/coordinator_backup.json", {
            additionalCoordinatorEndpoints: configuredProfileId === undefined ? [] : [{...ADDITIONAL_ENDPOINT, profileId: configuredProfileId}],
        });
        const onPayload = vi.fn();
        adapter.on("zclPayload", onPayload);

        const apsFrame: EmberApsFrame = {
            profileId,
            clusterId: 0xfd02,
            sourceEndpoint: 210,
            destinationEndpoint: 2,
            options: 0,
            groupId: 0,
            sequence: 1,
        };
        const packetInfo: EmberRxPacketInfo = {
            senderShortId: 0x1234,
            senderLongId: "0xf8302d739346ffff",
            bindingIndex: 0xff,
            addressIndex: 0xff,
            lastHopLqi: 200,
            lastHopRssi: -50,
            lastHopTimestamp: 0,
        };
        const message = Buffer.concat([Buffer.from([0x18, 1, 0x0a, 0x20, 0, 0x41, 62]), Buffer.alloc(62)]);

        // Exercise the real EZSP filter and adapter event wiring, without opening the transport.
        // @ts-expect-error private
        adapter.ezsp.ezspIncomingMessageHandler(type, apsFrame, packetInfo, message);

        expect(onPayload).toHaveBeenCalledTimes(forwarded ? 1 : 0);
        if (forwarded) {
            expect(onPayload).toHaveBeenCalledWith(
                expect.objectContaining({clusterID: 0xfd02, endpoint: 210, destinationEndpoint: 2, data: message, linkquality: 200}),
            );
        }
    });
});
