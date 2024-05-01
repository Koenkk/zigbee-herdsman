const EndpointDeviceType: {[s: string]: number} = {
    'ZLLOnOffLight' : 0x0000,
    'ZLLOnOffPluginUnit' : 0x0010,
    'ZLLDimmableLight' : 0x0100,
    'ZLLDimmablePluginUnit' : 0x0110,
    'ZLLColorLight' : 0x0200,
    'ZLLExtendedColorLight' : 0x0210,
    'ZLLColorTemperatureLight' : 0x0220,
    'HAOnOffLight' : 0x0100,
    'HADimmableLight' : 0x0101,
    'HAColorLight' : 0x0102,
};

export default EndpointDeviceType;