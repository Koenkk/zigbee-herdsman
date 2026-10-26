import {describe, expect, it} from "vitest";
import type {AdditionalCoordinatorEndpoint} from "../../../src/adapter/coordinatorEndpoints";
import {Endpoints, endpoints} from "../../../src/adapter/z-stack/adapter/endpoints";
import * as Constants from "../../../src/adapter/z-stack/constants";

const ADDITIONAL_ENDPOINT: AdditionalCoordinatorEndpoint = {
    profileId: 0xc51e,
    deviceId: 0x0000,
    deviceVersion: 0x01,
    inputClusters: [0x0003, 0xfd05, 0xfd01],
    outputClusters: [0x0003, 0xfd00, 0xfd01, 0x000a, 0x001b, 0x0402, 0x0a00, 0x0b02, 0xfd02],
};

describe("Z-Stack coordinator endpoints", () => {
    it("keeps fixed endpoints by default", () => {
        expect(endpoints()).toStrictEqual(Endpoints);
    });

    it("appends additional coordinator endpoints from endpoint 14", () => {
        expect(endpoints([ADDITIONAL_ENDPOINT])).toStrictEqual([
            ...Endpoints,
            {
                endpoint: 14,
                appprofid: 0xc51e,
                appdeviceid: 0x0000,
                appdevver: 0x01,
                appnuminclusters: 3,
                appinclusterlist: [0x0003, 0xfd05, 0xfd01],
                appnumoutclusters: 9,
                appoutclusterlist: [0x0003, 0xfd00, 0xfd01, 0x000a, 0x001b, 0x0402, 0x0a00, 0x0b02, 0xfd02],
                latencyreq: Constants.AF.networkLatencyReq.NO_LATENCY_REQS,
            },
        ]);
    });
});
