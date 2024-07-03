const SYS = {
    resetType: {
        HARD: 0,
        SOFT: 1,
    },
    capabilities: {
        SYS: 1,
        MAC: 2,
        NWK: 4,
        AF: 8,
        ZDO: 16,
        SAPI: 32,
        UTIL: 64,
        DEBUG: 128,
        APP: 256,
        ZOAD: 4096,
    },
    osalTimerEvent: {
        EVENT_0: 0,
        EVENT_1: 1,
        EVENT_2: 2,
        EVENT_3: 3,
    },
    adcChannels: {
        AIN0: 0,
        AIN1: 1,
        AIN2: 2,
        AIN3: 3,
        AIN4: 4,
        AIN5: 5,
        AIN6: 6,
        AIN7: 7,
        TEMP_SENSOR: 14,
        VOLT_READ: 15,
    },
    adcResolution: {
        BIT_8: 0,
        BIT_10: 1,
        BIT_12: 2,
        BIT_14: 3,
    },
    gpioOperation: {
        SET_DIRECTION: 0,
        SET_INPUT_MODE: 1,
        SET: 2,
        CLEAR: 3,
        TOGGLE: 4,
        READ: 5,
    },
    sysStkTune: {
        TX_PWR: 0,
        RX_ON_IDLE: 1,
    },
    resetReason: {
        POWER_UP: 0,
        EXTERNAL: 1,
        WATCH_DOG: 2,
    },
    nvItemInitStatus: {
        ALREADY_EXISTS: 0,
        SUCCESS: 9,
        FAILED: 10,
    },
    nvItemDeleteStatus: {
        SUCCESS: 0,
        NOT_EXISTS: 9,
        FAILED: 10,
        BAD_LENGTH: 12,
    },
};

export default SYS;
