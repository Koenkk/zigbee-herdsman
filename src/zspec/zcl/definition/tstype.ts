import type {BuffaloZclDataType, DataType, DataTypeClass, Direction, FrameType, ParameterCondition, StructuredIndicatorType} from "./enums";

export interface BuffaloZclOptions {
    length?: number;
    payload?: {
        mode?: number; // used to read ListThermoTransitions
        numoftrans?: number; // used to read ListThermoTransitions
        commandID?: number; // used to read GpdFrame
        payloadSize?: number; // used to read GpdFrame
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

export interface KeyZclValue {
    [s: string | number]: number | string;
}

export interface Struct {
    elmType: DataType;
    elmVal: unknown;
}

export interface ZclTimeOfDay {
    /** [0-23] */
    hours?: number;
    /** [0-59] */
    minutes?: number;
    /** [0-59] */
    seconds?: number;
    /** [0-99] */
    hundredths?: number;
}

export interface ZclDate {
    /** [1900-2155], converted to/from [0-255] => value+1900=year */
    year?: number;
    /** [1-12] */
    month?: number;
    /** [1-31] */
    dayOfMonth?: number;
    /** [1-7] */
    dayOfWeek?: number;
}

export interface ZoneInfo {
    zoneID: number;
    zoneStatus: number;
}

export interface ExtensionFieldSet {
    clstId: number;
    len: number;
    extField: unknown[];
}

export interface ThermoTransition {
    transitionTime: number;
    heatSetpoint?: number;
    coolSetpoint?: number;
}

export interface Gpd {
    deviceID: number;
    options: number;
    extendedOptions: number;
    securityKey: Buffer;
    keyMic: number;
    outgoingCounter: number;
    applicationInfo: number;
    manufacturerID: number;
    modelID: number;
    numGpdCommands: number;
    gpdCommandIdList: Buffer;
    numServerClusters: number;
    numClientClusters: number;
    gpdServerClusters: Buffer;
    gpdClientClusters: Buffer;
    genericSwitchConfig: number;
    currentContactStatus: number;
}

export interface GpdChannelRequest {
    nextChannel: number;
    nextNextChannel: number;
}

export interface GpdChannelConfiguration {
    commandID: number;
    operationalChannel: number;
    basic: boolean;
}

export interface GpdCommissioningReply {
    commandID: number;
    options: number;
    /** expected valid if corresponding `options` bits set */
    panID?: number;
    /** expected valid if corresponding `options` bits set */
    securityKey?: Buffer;
    /** expected valid if corresponding `options` bits set */
    keyMic?: number;
    /** expected valid if corresponding `options` bits set */
    frameCounter?: number;
}

export interface GpdCustomReply {
    commandID: number;
    buffer: Buffer;
}

export interface GpdAttributeReport {
    manufacturerCode: number;
    clusterID: number;
    attributes: KeyZclValue;
}

export interface TuyaDataPointValue {
    dp: number;
    datatype: number;
    data: Buffer;
}

export interface MiboxerZone {
    zoneNum: number;
    groupId: number;
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
        | {type: ParameterCondition.MINIMUM_REMAINING_BUFFER_BYTES; value: number}
        | {type: ParameterCondition.BITMASK_SET; param: string; mask: number /* not set */; reversed?: boolean}
        | {type: ParameterCondition.BITFIELD_ENUM; param: string; offset: number; size: number; value: number}
        | {type: ParameterCondition.DATA_TYPE_CLASS_EQUAL; value: DataTypeClass}
        | {type: ParameterCondition.FIELD_EQUAL; field: string; value: unknown; reversed?: boolean}
        | {type: ParameterCondition.FIELD_GT; field: string; value: number /*; reversed?: boolean*/}
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
    getAttribute: (key: number | string) => Attribute | undefined;
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
    | "genBasic"
    | "genPowerCfg"
    | "genDeviceTempCfg"
    | "genIdentify"
    | "genGroups"
    | "genScenes"
    | "genOnOff"
    | "genOnOffSwitchCfg"
    | "genLevelCtrl"
    | "genAlarms"
    | "genTime"
    | "genRssiLocation"
    | "genAnalogInput"
    | "genAnalogOutput"
    | "genAnalogValue"
    | "genBinaryInput"
    | "genBinaryOutput"
    | "genBinaryValue"
    | "genMultistateInput"
    | "genMultistateOutput"
    | "genMultistateValue"
    | "genCommissioning"
    | "genOta"
    | "genPollCtrl"
    | "greenPower"
    | "mobileDeviceCfg"
    | "neighborCleaning"
    | "nearestGateway"
    | "closuresShadeCfg"
    | "closuresDoorLock"
    | "closuresWindowCovering"
    | "barrierControl"
    | "hvacPumpCfgCtrl"
    | "hvacThermostat"
    | "hvacFanCtrl"
    | "hvacDehumidificationCtrl"
    | "hvacUserInterfaceCfg"
    | "lightingColorCtrl"
    | "lightingBallastCfg"
    | "msIlluminanceMeasurement"
    | "msIlluminanceLevelSensing"
    | "msTemperatureMeasurement"
    | "msPressureMeasurement"
    | "msFlowMeasurement"
    | "msRelativeHumidity"
    | "msOccupancySensing"
    | "msLeafWetness"
    | "msSoilMoisture"
    | "pHMeasurement"
    | "msElectricalConductivity"
    | "msWindSpeed"
    | "msCarbonMonoxide"
    | "msCO2"
    | "msEthylene"
    | "msEthyleneOxide"
    | "msHydrogen"
    | "msHydrogenSulfide"
    | "msNitricOxide"
    | "msNitrogenDioxide"
    | "msOxygen"
    | "msOzone"
    | "msSulfurDioxide"
    | "msDissolvedOxygen"
    | "msBromate"
    | "msChloramines"
    | "msChlorine"
    | "msFecalColiformAndEColi"
    | "msFluoride"
    | "msHaloaceticAcids"
    | "msTotalTrihalomethanes"
    | "msTotalColiformBacteria"
    | "msTurbidity"
    | "msCopper"
    | "msLead"
    | "msManganese"
    | "msSulfate"
    | "msBromodichloromethane"
    | "msBromoform"
    | "msChlorodibromomethane"
    | "msChloroform"
    | "msSodium"
    | "pm25Measurement"
    | "msFormaldehyde"
    | "pm1Measurement"
    | "pm10Measurement"
    | "ssIasZone"
    | "ssIasAce"
    | "ssIasWd"
    | "piGenericTunnel"
    | "piBacnetProtocolTunnel"
    | "piAnalogInputReg"
    | "piAnalogInputExt"
    | "piAnalogOutputReg"
    | "piAnalogOutputExt"
    | "piAnalogValueReg"
    | "piAnalogValueExt"
    | "piBinaryInputReg"
    | "piBinaryInputExt"
    | "piBinaryOutputReg"
    | "piBinaryOutputExt"
    | "piBinaryValueReg"
    | "piBinaryValueExt"
    | "piMultistateInputReg"
    | "piMultistateInputExt"
    | "piMultistateOutputReg"
    | "piMultistateOutputExt"
    | "piMultistateValueReg"
    | "piMultistateValueExt"
    | "pi11073ProtocolTunnel"
    | "piIso7818ProtocolTunnel"
    | "piRetailTunnel"
    | "seMetering"
    | "tunneling"
    | "telecommunicationsInformation"
    | "telecommunicationsVoiceOverZigbee"
    | "telecommunicationsChatting"
    | "haApplianceIdentification"
    | "haMeterIdentification"
    | "haApplianceEventsAlerts"
    | "haApplianceStatistics"
    | "haElectricalMeasurement"
    | "haDiagnostic"
    | "touchlink"
    | "manuSpecificClusterAduroSmart"
    | "manuSpecificOsram"
    | "manuSpecificPhilips"
    | "manuSpecificPhilips2"
    | "manuSpecificSinope"
    | "manuSpecificLegrandDevices"
    | "manuSpecificLegrandDevices2"
    | "manuSpecificLegrandDevices3"
    | "wiserDeviceInfo"
    | "manuSpecificTuya"
    | "manuSpecificLumi"
    | "liXeePrivate"
    | "manuSpecificTuya2"
    | "manuSpecificTuya3"
    | "manuSpecificCentraliteHumidity"
    | "manuSpecificSmartThingsArrivalSensor"
    | "manuSpecificSamsungAccelerometer"
    | "heimanSpecificAirQuality"
    | "heimanSpecificScenes"
    | "tradfriButton"
    | "heimanSpecificInfraRedRemote"
    | "schneiderSpecificPilotMode"
    | "elkoOccupancySettingClusterServer"
    | "elkoSwitchConfigurationClusterServer"
    | "manuSpecificSchneiderLightSwitchConfiguration"
    | "manuSpecificSchneiderFanSwitchConfiguration"
    | "sprutVoc"
    | "sprutNoise"
    | "sprutIrBlaster"
    | "manuSpecificSiglisZigfred"
    | "owonClearMetering"
    | "zosungIRTransmit"
    | "zosungIRControl"
    | "manuSpecificAssaDoorLock"
    | "manuSpecificDoorman"
    | "manuSpecificProfalux1"
    | "manuSpecificAmazonWWAH";
