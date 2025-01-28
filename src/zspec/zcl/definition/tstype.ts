import {BuffaloZclDataType, DataType, DataTypeClass, Direction, FrameType, ParameterCondition, StructuredIndicatorType} from './enums';
import {Status} from './status';

export interface BuffaloZclOptions {
    length?: number;
    payload?: {
        mode?: number; // used to read ListThermoTransitions
        numoftrans?: number; // used to read ListThermoTransitions
        commandID?: number; // used to read GdpFrame
        payloadSize?: number; // used to read GdpFrame
    } & {[key: string]: unknown};
    dataType?: DataType | BuffaloZclDataType;
    attrId?: number;
}

export interface ZclArray {
    elementType: DataType | keyof typeof DataType;
    elements: unknown[];
}

export interface StructuredSelector {
    indexes?: number[];
    indicatorType?: StructuredIndicatorType;
}

export interface FrameControl {
    reservedBits: number;
    frameType: FrameType;
    manufacturerSpecific: boolean;
    direction: Direction;
    disableDefaultResponse: boolean;
}

export interface Attribute {
    ID: number;
    name: string;
    type: DataType;
    manufacturerCode?: number;
}

export interface Parameter {
    name: string;
    type: DataType | BuffaloZclDataType;
}

export interface Command {
    ID: number;
    name: string;
    parameters: readonly Parameter[];
    response?: number;
}

export interface AttributeDefinition {
    ID: number;
    type: DataType;
    manufacturerCode?: number;
}

export interface ParameterDefinition extends Parameter {
    conditions?: (
        | {type: ParameterCondition.STATUS_EQUAL; value: Status}
        | {type: ParameterCondition.STATUS_NOT_EQUAL; value: Status}
        | {type: ParameterCondition.MINIMUM_REMAINING_BUFFER_BYTES; value: number}
        | {type: ParameterCondition.DIRECTION_EQUAL; value: Direction}
        | {type: ParameterCondition.BITMASK_SET; param: string; mask: number}
        | {type: ParameterCondition.BITFIELD_ENUM; param: string; offset: number; size: number; value: number}
        | {type: ParameterCondition.DATA_TYPE_CLASS_EQUAL; value: DataTypeClass}
        | {type: ParameterCondition.FIELD_EQUAL; field: string; value: unknown}
    )[];
}

export interface CommandDefinition {
    ID: number;
    parameters: readonly ParameterDefinition[];
    response?: number;
}

export interface Cluster {
    ID: number;
    name: string;
    manufacturerCode?: number;
    attributes: {[s: string]: Attribute};
    commands: {
        [s: string]: Command;
    };
    commandsResponse: {
        [s: string]: Command;
    };
    getAttribute: (key: number | string) => Attribute;
    hasAttribute: (key: number | string) => boolean;
    getCommand: (key: number | string) => Command;
    getCommandResponse: (key: number | string) => Command;
}

export interface ClusterDefinition {
    ID: number;
    manufacturerCode?: number;
    attributes: Readonly<Record<string, Readonly<AttributeDefinition>>>;
    commands: Readonly<Record<string, Readonly<CommandDefinition>>>;
    commandsResponse: Readonly<Record<string, Readonly<CommandDefinition>>>;
}

export interface CustomClusters {
    [k: string]: ClusterDefinition;
}

export type ClusterName =
    | 'genBasic'
    | 'genPowerCfg'
    | 'genDeviceTempCfg'
    | 'genIdentify'
    | 'genGroups'
    | 'genScenes'
    | 'genOnOff'
    | 'genOnOffSwitchCfg'
    | 'genLevelCtrl'
    | 'genAlarms'
    | 'genTime'
    | 'genRssiLocation'
    | 'genAnalogInput'
    | 'genAnalogOutput'
    | 'genAnalogValue'
    | 'genBinaryInput'
    | 'genBinaryOutput'
    | 'genBinaryValue'
    | 'genMultistateInput'
    | 'genMultistateOutput'
    | 'genMultistateValue'
    | 'genCommissioning'
    | 'genOta'
    | 'genPollCtrl'
    | 'greenPower'
    | 'mobileDeviceCfg'
    | 'neighborCleaning'
    | 'nearestGateway'
    | 'closuresShadeCfg'
    | 'closuresDoorLock'
    | 'closuresWindowCovering'
    | 'barrierControl'
    | 'hvacPumpCfgCtrl'
    | 'hvacThermostat'
    | 'hvacFanCtrl'
    | 'hvacDehumidificationCtrl'
    | 'hvacUserInterfaceCfg'
    | 'lightingColorCtrl'
    | 'lightingBallastCfg'
    | 'msIlluminanceMeasurement'
    | 'msIlluminanceLevelSensing'
    | 'msTemperatureMeasurement'
    | 'msPressureMeasurement'
    | 'msFlowMeasurement'
    | 'msRelativeHumidity'
    | 'msOccupancySensing'
    | 'msSoilMoisture'
    | 'pHMeasurement'
    | 'msCO2'
    | 'pm1Measurement'
    | 'msFormaldehyde'
    | 'pm10Measurement'
    | 'pm25Measurement'
    | 'ssIasZone'
    | 'ssIasAce'
    | 'ssIasWd'
    | 'piGenericTunnel'
    | 'piBacnetProtocolTunnel'
    | 'piAnalogInputReg'
    | 'piAnalogInputExt'
    | 'piAnalogOutputReg'
    | 'piAnalogOutputExt'
    | 'piAnalogValueReg'
    | 'piAnalogValueExt'
    | 'piBinaryInputReg'
    | 'piBinaryInputExt'
    | 'piBinaryOutputReg'
    | 'piBinaryOutputExt'
    | 'piBinaryValueReg'
    | 'piBinaryValueExt'
    | 'piMultistateInputReg'
    | 'piMultistateInputExt'
    | 'piMultistateOutputReg'
    | 'piMultistateOutputExt'
    | 'piMultistateValueReg'
    | 'piMultistateValueExt'
    | 'pi11073ProtocolTunnel'
    | 'piIso7818ProtocolTunnel'
    | 'piRetailTunnel'
    | 'seMetering'
    | 'tunneling'
    | 'telecommunicationsInformation'
    | 'telecommunicationsVoiceOverZigbee'
    | 'telecommunicationsChatting'
    | 'haApplianceIdentification'
    | 'haMeterIdentification'
    | 'haApplianceEventsAlerts'
    | 'haApplianceStatistics'
    | 'haElectricalMeasurement'
    | 'haDiagnostic'
    | 'touchlink'
    | 'manuSpecificClusterAduroSmart'
    | 'manuSpecificOsram'
    | 'manuSpecificPhilips'
    | 'manuSpecificPhilips2'
    | 'manuSpecificSinope'
    | 'manuSpecificLegrandDevices'
    | 'manuSpecificLegrandDevices2'
    | 'manuSpecificLegrandDevices3'
    | 'wiserDeviceInfo'
    | 'manuSpecificTuya'
    | 'manuSpecificLumi'
    | 'liXeePrivate'
    | 'manuSpecificTuya_2'
    | 'manuSpecificTuya_3'
    | 'manuSpecificCentraliteHumidity'
    | 'manuSpecificSmartThingsArrivalSensor'
    | 'manuSpecificSamsungAccelerometer'
    | 'heimanSpecificAirQuality'
    | 'heimanSpecificScenes'
    | 'tradfriButton'
    | 'heimanSpecificInfraRedRemote'
    | 'schneiderSpecificPilotMode'
    | 'elkoOccupancySettingClusterServer'
    | 'elkoSwitchConfigurationClusterServer'
    | 'manuSpecificSchneiderLightSwitchConfiguration'
    | 'manuSpecificSchneiderFanSwitchConfiguration'
    | 'sprutDevice'
    | 'sprutVoc'
    | 'sprutNoise'
    | 'sprutIrBlaster'
    | 'manuSpecificSiglisZigfred'
    | 'owonClearMetering'
    | 'zosungIRTransmit'
    | 'zosungIRControl'
    | 'manuSpecificAssaDoorLock'
    | 'manuSpecificDoorman'
    | 'manuSpecificProfalux1'
    | 'manuSpecificAmazonWWAH';
