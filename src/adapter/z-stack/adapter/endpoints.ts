import * as Constants from '../constants';
import * as Zcl from '../../../zcl';

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
    {...EndpointDefaults, endpoint: 3, appprofid: 0x0105},
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
        appoutclusterlist: [Zcl.Utils.getCluster('ssIasZone').ID, Zcl.Utils.getCluster('ssIasWd').ID],
        appnuminclusters: 1,
        appinclusterlist: [Zcl.Utils.getCluster('ssIasAce').ID]

    },
    // TERNCY: https://github.com/Koenkk/zigbee-herdsman/issues/82
    {...EndpointDefaults, endpoint: 0x6E, appprofid: 0x0104},
    {...EndpointDefaults, endpoint: 12, appprofid: 0xc05e},
    {
        ...EndpointDefaults,
        endpoint: 13,
        appprofid: 0x0104,
        appnuminclusters: 1,
        appinclusterlist: [Zcl.Utils.getCluster('genOta').ID]
    },
    // Insta/Jung/Gira: OTA fallback EP (since it's buggy in firmware 10023202 when it tries to find a matching EP for
    // OTA - it queries for ZLL profile, but then contacts with HA profile)
    {...EndpointDefaults, endpoint: 47, appprofid: 0x0104},
    {...EndpointDefaults, endpoint: 242, appprofid: 0xa1e0},
];
