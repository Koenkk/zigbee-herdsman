import {describe, expect, it} from "vitest";
import type {AdditionalCoordinatorEndpoint} from "../../../src/adapter/coordinatorEndpoints";
import {fixedDeconzEndpointParameters} from "../../../src/adapter/deconz/driver/driver";

const HOME_AUTOMATION_ENDPOINT = Buffer.from([
    0x00, // slot index
    0x01, // endpoint
    0x04,
    0x01, // profile 0x0104
    0x05,
    0x00, // device ID 0x0005
    0x01, // device version
    0x05, // input cluster count
    0x00,
    0x00, // basic
    0x06,
    0x00, // on/off
    0x0a,
    0x00, // time
    0x19,
    0x00, // OTA
    0x01,
    0x05, // IAS ACE
    0x04, // output cluster count
    0x01,
    0x00, // power configuration
    0x20,
    0x00, // poll control
    0x00,
    0x05, // IAS zone
    0x02,
    0x05, // IAS warning device
]);

const GREEN_POWER_ENDPOINT = Buffer.from([
    0x01, // slot index
    0xf2, // endpoint
    0xe0,
    0xa1, // profile 0xa1e0
    0x64,
    0x00, // device ID 0x0064
    0x01, // device version
    0x00, // input cluster count
    0x01, // output cluster count
    0x21,
    0x00, // green power
]);

const ADDITIONAL_ENDPOINT_PARAMETER = Buffer.from([
    0x01, // slot index
    0x02, // endpoint
    0x1e,
    0xc5, // profile 0xc51e
    0x00,
    0x00, // device ID 0x0000
    0x01, // device version
    0x03, // input cluster count
    0x03,
    0x00, // identify
    0x05,
    0xfd,
    0x01,
    0xfd,
    0x09, // output cluster count
    0x03,
    0x00, // identify
    0x00,
    0xfd,
    0x01,
    0xfd,
    0x0a,
    0x00, // time
    0x1b,
    0x00,
    0x02,
    0x04, // temperature measurement
    0x00,
    0x0a,
    0x02,
    0x0b,
    0x02,
    0xfd,
]);

const ADDITIONAL_ENDPOINT: AdditionalCoordinatorEndpoint = {
    profileId: 0xc51e,
    deviceId: 0x0000,
    deviceVersion: 0x01,
    inputClusters: [0x0003, 0xfd05, 0xfd01],
    outputClusters: [0x0003, 0xfd00, 0xfd01, 0x000a, 0x001b, 0x0402, 0x0a00, 0x0b02, 0xfd02],
};

describe("deCONZ coordinator endpoint parameters", () => {
    it("keeps Green Power in slot 1 by default", () => {
        expect(fixedDeconzEndpointParameters()).toStrictEqual([HOME_AUTOMATION_ENDPOINT, GREEN_POWER_ENDPOINT]);
    });

    it("replaces Green Power with an additional endpoint because slot 2 is unsupported", () => {
        expect(fixedDeconzEndpointParameters([ADDITIONAL_ENDPOINT])).toStrictEqual([HOME_AUTOMATION_ENDPOINT, ADDITIONAL_ENDPOINT_PARAMETER]);
    });
});
