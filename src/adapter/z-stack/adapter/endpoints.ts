import * as ZSpec from "../../../zspec";
import {Clusters} from "../../../zspec/zcl/definition/cluster";
import * as Constants from "../constants";

const EndpointDefaults: {
    appdeviceid: number;
    appdevver: number;
    appnuminclusters: number;
    appinclusterlist: number[];
    appnumoutclusters: number;
    appoutclusterlist: number[];
    latencyreq: number;
} = {
    appdeviceid: 0x0005,
    appdevver: 0,
    appnuminclusters: 0,
    appinclusterlist: [],
    appnumoutclusters: 0,
    appoutclusterlist: [],
    latencyreq: Constants.AF.networkLatencyReq.NO_LATENCY_REQS,
};

export const Endpoints = [
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
    // Miele Con@ctivity 2.0 gateway discovery and telemetry.
    {
        ...EndpointDefaults,
        endpoint: 14,
        appprofid: ZSpec.CUSTOM_MIELE_PROFILE_ID,
        appdeviceid: 0x0000,
        appdevver: 1,
        appnuminclusters: 3,
        appinclusterlist: [0x0003, 0xfd05, 0xfd01],
        appnumoutclusters: 9,
        appoutclusterlist: [0x0003, 0xfd00, 0xfd01, 0x000a, 0x001b, 0x0402, 0x0a00, 0x0b02, 0xfd02],
    },
    // Insta/Jung/Gira: OTA fallback EP (since it's buggy in firmware 10023202 when it tries to find a matching EP for
    // OTA - it queries for ZLL profile, but then contacts with HA profile)
    {...EndpointDefaults, endpoint: 47, appprofid: 0x0104},
    // Required for shelly wifi and rpc clusters
    {...EndpointDefaults, endpoint: 239, appprofid: ZSpec.CUSTOM_SHELLY_PROFILE_ID},
    {...EndpointDefaults, endpoint: 242, appprofid: 0xa1e0},
];
