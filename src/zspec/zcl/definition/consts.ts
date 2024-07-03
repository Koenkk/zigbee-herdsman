/** Mapping of power source bits to descriptive string. */
export const POWER_SOURCES: Readonly<{[s: number]: string}> = {
    0: 'Unknown',
    1: 'Mains (single phase)',
    2: 'Mains (3 phase)',
    3: 'Battery',
    4: 'DC Source',
    5: 'Emergency mains constantly powered',
    6: 'Emergency mains and transfer switch',
};

/** Mapping of device type to ID */
export const ENDPOINT_DEVICE_TYPE: Readonly<{[s: string]: number}> = {
    ZLLOnOffLight: 0x0000,
    ZLLOnOffPluginUnit: 0x0010,
    ZLLDimmableLight: 0x0100,
    ZLLDimmablePluginUnit: 0x0110,
    ZLLColorLight: 0x0200,
    ZLLExtendedColorLight: 0x0210,
    ZLLColorTemperatureLight: 0x0220,
    HAOnOffLight: 0x0100,
    HADimmableLight: 0x0101,
    HAColorLight: 0x0102,
};
