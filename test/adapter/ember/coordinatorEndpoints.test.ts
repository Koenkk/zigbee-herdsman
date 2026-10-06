import {describe, expect, it} from "vitest";
import type {AdditionalCoordinatorEndpoint} from "../../../src/adapter/coordinatorEndpoints";
import {FIXED_ENDPOINTS, fixedEndpoints} from "../../../src/adapter/ember/adapter/endpoints";

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
});
