import {describe, expect, it} from "vitest";
import {
    type AdditionalCoordinatorEndpoint,
    assignCoordinatorEndpointIds,
    type CoordinatorEndpoint,
    validateAdditionalCoordinatorEndpoints,
    validateCoordinatorEndpoints,
} from "../../src/adapter/coordinatorEndpoints";

const VALID_ADDITIONAL_ENDPOINT: AdditionalCoordinatorEndpoint = {
    name: "valid",
    profileId: 1,
    deviceId: 1,
    deviceVersion: 1,
    inputClusters: [],
    outputClusters: [],
};

const VALID_ENDPOINT: CoordinatorEndpoint = {...VALID_ADDITIONAL_ENDPOINT, endpoint: 1};

describe("Coordinator endpoint descriptors", () => {
    it("accepts valid additional coordinator endpoint descriptors", () => {
        expect(() => validateAdditionalCoordinatorEndpoints([VALID_ADDITIONAL_ENDPOINT])).not.toThrow();
    });

    it("accepts endpoint descriptors without optional names", () => {
        const {name: _name, ...endpoint} = VALID_ADDITIONAL_ENDPOINT;

        expect(() => validateAdditionalCoordinatorEndpoints([endpoint])).not.toThrow();
    });

    it("assigns the first available endpoint ID", () => {
        expect(assignCoordinatorEndpointIds([VALID_ADDITIONAL_ENDPOINT], [1, 2, 3, 242])).toStrictEqual([{...VALID_ENDPOINT, endpoint: 4}]);
    });

    it("assigns sequential endpoint IDs", () => {
        expect(assignCoordinatorEndpointIds([VALID_ADDITIONAL_ENDPOINT, {...VALID_ADDITIONAL_ENDPOINT, name: "valid2"}], [1, 242])).toStrictEqual([
            {...VALID_ENDPOINT, endpoint: 2},
            {...VALID_ENDPOINT, name: "valid2", endpoint: 3},
        ]);
    });

    it("rejects duplicate endpoint IDs", () => {
        expect(() =>
            validateCoordinatorEndpoints([
                {name: "one", endpoint: 2, profileId: 1, deviceId: 1, deviceVersion: 1, inputClusters: [], outputClusters: []},
                {name: "two", endpoint: 2, profileId: 2, deviceId: 1, deviceVersion: 1, inputClusters: [], outputClusters: []},
            ]),
        ).toThrow("Duplicate coordinator endpoint '2'");
    });

    it("rejects invalid endpoint descriptor numbers", () => {
        expect(() => validateCoordinatorEndpoints([{...VALID_ENDPOINT, endpoint: 1.5}])).toThrow(
            "Invalid coordinator endpoint valid.endpoint: '1.5'",
        );
        expect(() => validateCoordinatorEndpoints([{...VALID_ENDPOINT, endpoint: -1}])).toThrow("Invalid coordinator endpoint valid.endpoint: '-1'");
        expect(() => validateCoordinatorEndpoints([{...VALID_ENDPOINT, endpoint: 0x100}])).toThrow(
            "Invalid coordinator endpoint valid.endpoint: '256'",
        );
        expect(() => validateCoordinatorEndpoints([{...VALID_ENDPOINT, profileId: 0x10000}])).toThrow(
            "Invalid coordinator endpoint valid.profileId: '65536'",
        );
        expect(() => validateCoordinatorEndpoints([{...VALID_ENDPOINT, deviceId: 0x10000}])).toThrow(
            "Invalid coordinator endpoint valid.deviceId: '65536'",
        );
        expect(() => validateCoordinatorEndpoints([{...VALID_ENDPOINT, deviceVersion: 0x100}])).toThrow(
            "Invalid coordinator endpoint valid.deviceVersion: '256'",
        );
    });

    it("rejects endpoint 0 because it is reserved for ZDO", () => {
        expect(() => validateCoordinatorEndpoints([{...VALID_ENDPOINT, endpoint: 0}])).toThrow(
            "Invalid coordinator endpoint valid.endpoint: endpoint 0 is reserved for ZDO",
        );
    });

    it("rejects invalid cluster descriptors", () => {
        expect(() => validateCoordinatorEndpoints([{...VALID_ENDPOINT, inputClusters: new Array(0x100).fill(1)}])).toThrow(
            "Invalid coordinator endpoint valid.inputClusters.length: '256'",
        );
        expect(() => validateCoordinatorEndpoints([{...VALID_ENDPOINT, outputClusters: new Array(0x100).fill(1)}])).toThrow(
            "Invalid coordinator endpoint valid.outputClusters.length: '256'",
        );
        expect(() => validateCoordinatorEndpoints([{...VALID_ENDPOINT, inputClusters: [0x10000]}])).toThrow(
            "Invalid coordinator endpoint valid.cluster: '65536'",
        );
        expect(() => validateCoordinatorEndpoints([{...VALID_ENDPOINT, outputClusters: [-1]}])).toThrow(
            "Invalid coordinator endpoint valid.cluster: '-1'",
        );
    });
});
