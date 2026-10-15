import * as ZSpec from "../../../zspec";
import {Clusters} from "../../../zspec/zcl/definition/cluster";
import {type AdditionalCoordinatorEndpoint, assignCoordinatorEndpointIds} from "../../coordinatorEndpoints";
import * as Constants from "../constants";

export type EndpointDefinition = {
    endpoint: number;
    appprofid: number;
    appdeviceid: number;
    appdevver: number;
    appnuminclusters: number;
    appinclusterlist: number[];
    appnumoutclusters: number;
    appoutclusterlist: number[];
    latencyreq: number;
};

// Common fields for each Z-Stack AF.register call. `Omit` leaves out the two
// identity fields: local endpoint number and app profile ID (`appprofid`).
const EndpointDefaults: Omit<EndpointDefinition, "endpoint" | "appprofid"> = {
    appdeviceid: 0x0005,
    appdevver: 0,
    appnuminclusters: 0,
    appinclusterlist: [],
    appnumoutclusters: 0,
    appoutclusterlist: [],
    latencyreq: Constants.AF.networkLatencyReq.NO_LATENCY_REQS,
};

export const Endpoints: readonly EndpointDefinition[] = [
    {...EndpointDefaults, endpoint: 1, appprofid: 0x0104},
    {...EndpointDefaults, endpoint: 2, appprofid: 0x0101},
    // Required for https://github.com/Koenkk/zigbee-herdsman-converters/commit/d0fb06c2429171f327950484ea3dec80864637cc
    {...EndpointDefaults, endpoint: 3, appprofid: 0x0104},
    {...EndpointDefaults, endpoint: 4, appprofid: 0x0107},
    {...EndpointDefaults, endpoint: 5, appprofid: 0x0108},
    {...EndpointDefaults, endpoint: 6, appprofid: 0x0109},
    {...EndpointDefaults, endpoint: 8, appprofid: 0x0104},
    {...EndpointDefaults, endpoint: 10, appprofid: 0x0104},
    {
        ...EndpointDefaults,
        endpoint: 11,
        appprofid: 0x0104,
        appdeviceid: 0x0400,
        appnumoutclusters: 2,
        appoutclusterlist: [Clusters.ssIasZone.ID, Clusters.ssIasWd.ID],
        appnuminclusters: 2,
        // genTime required for https://github.com/Koenkk/zigbee2mqtt/issues/10816
        appinclusterlist: [Clusters.ssIasAce.ID, Clusters.genTime.ID],
    },
    // TERNCY: https://github.com/Koenkk/zigbee-herdsman/issues/82
    {...EndpointDefaults, endpoint: 0x6e, appprofid: 0x0104},
    {...EndpointDefaults, endpoint: 12, appprofid: 0xc05e},
    {
        ...EndpointDefaults,
        endpoint: 13,
        appprofid: 0x0104,
        appnuminclusters: 1,
        appinclusterlist: [Clusters.genOta.ID],
    },
    // Insta/Jung/Gira: OTA fallback EP (since it's buggy in firmware 10023202 when it tries to find a matching EP for
    // OTA - it queries for ZLL profile, but then contacts with HA profile)
    {...EndpointDefaults, endpoint: 47, appprofid: 0x0104},
    // Required for shelly wifi and rpc clusters
    {...EndpointDefaults, endpoint: 239, appprofid: ZSpec.CUSTOM_SHELLY_PROFILE_ID},
    {...EndpointDefaults, endpoint: 242, appprofid: 0xa1e0},
];

// Called only by ZStackAdapter. deCONZ and Ember build/register their endpoint
// lists in their own adapter-specific code paths.
// Z-Stack uses this same resolved list for startup AF.register calls and for
// choosing the right source endpoint when sending by profile ID.
export function endpoints(additionalCoordinatorEndpoints: readonly AdditionalCoordinatorEndpoint[] = []): readonly EndpointDefinition[] {
    const assignedEndpoints = assignCoordinatorEndpointIds(
        additionalCoordinatorEndpoints,
        Endpoints.map((endpoint) => endpoint.endpoint),
        {startEndpoint: 14},
    );

    return [
        ...Endpoints,
        ...assignedEndpoints.map((endpoint) => ({
            ...EndpointDefaults,
            endpoint: endpoint.endpoint,
            appprofid: endpoint.profileId,
            appdeviceid: endpoint.deviceId,
            appdevver: endpoint.deviceVersion,
            appnuminclusters: endpoint.inputClusters.length,
            appinclusterlist: [...endpoint.inputClusters],
            appnumoutclusters: endpoint.outputClusters.length,
            appoutclusterlist: [...endpoint.outputClusters],
        })),
    ];
}
