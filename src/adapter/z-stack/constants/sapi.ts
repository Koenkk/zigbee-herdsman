const SAPI = {
    zbDeviceInfo: {
        DEV_STATE: 0,
        IEEE_ADDR: 1,
        SHORT_ADDR: 2,
        PARENT_SHORT_ADDR: 3,
        PARENT_IEEE_ADDR: 4,
        CHANNEL: 5,
        PAN_ID: 6,
        EXT_PAN_ID: 7,
    },
    bindAction: {
        REMOVE_BIND: 0,
        CREATE_BIND: 1,
    },
    searchType: {
        ZB_IEEE_SEARCH: 1,
    },
    txOptAck: {
        NONE: 0,
        END_TO_END_ACK: 1,
    },
};

export default SAPI;
