const BEACON_MAX_DEPTH = 0x0f;
const DEF_NWK_RADIUS = 2 * BEACON_MAX_DEPTH;

const AF = {
    interpanCtl: {
        CTL: 0,
        SET: 1,
        REG: 2,
        CHK: 3,
    },
    networkLatencyReq: {
        NO_LATENCY_REQS: 0,
        FAST_BEACONS: 1,
        SLOW_BEACONS: 2,
    },
    options: {
        PREPROCESS: 4,
        LIMIT_CONCENTRATOR: 8,
        ACK_REQUEST: 16,
        DISCV_ROUTE: 32,
        EN_SECURITY: 64,
        SKIP_ROUTING: 128,
    },
    DEFAULT_RADIUS: DEF_NWK_RADIUS,
};

export default AF;
