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

/**
 * @see https://github.com/project-chip/zap/blob/master/zcl-builtin/dotdot/README.md#restrictions
 */
interface Restrictions {
    /** specifies an exact length, generally used for a string. */
    length?: number;
    /** specifies the minimum length that a type must take, generally used for a string or a list/array */
    minLen?: number;
    /** specifies the maximum length that a type must take, generally used for a string or a list/array */
    maxLen?: number;
    /** sets a minimum that doesn't include the value specified, i.e. a field of this type must be strictly greater than the value */
    minExcl?: number;
    /** sets a minimum that includes the value specified, i.e. a field of this type must be greater than or equal than the value */
    min?: number;
    /** sets a maximum that doesn't include the value specified, i.e. a field of this type must be strictly less than the value */
    maxExcl?: number;
    /** sets a maximum that includes the value specified, i.e. a field of this type must be less than or equal to the value */
    max?: number;
    /** sets a minimum that is based on the value of the referenced attribute. The value of the referenced attribute is included in the range */
    // minRef?: string;
    /** sets a minimum that is based on the value of the referenced attribute. The value of the referenced attribute is excluded from the range */
    // minExclRef?: string;
    /** sets a maximum that is based on the value of the referenced attribute. The value of the referenced attribute is included in the range */
    // maxRef?: string;
    /** sets a maximum that is based on the value of the referenced attribute. The value of the referenced attribute is excluded from the range */
    // maxExclRef?: string;
    /**
     * In some cases, a special value is defined by the Zigbee specification.
     * In these cases, the special value along with a descriptor should be defined using this tag.
     * Special values take precedence over other restrictions imposed (e.g. a special value may fall outside the min/max range for the attribute).
     * `value` is kept as string for easier handling (will be checked on spot if used anyway) though most often is a hex number string (without 0x)
     */
    special?: [name: string, value: string][];
}

/**
 * @see https://github.com/project-chip/zap/blob/master/zcl-builtin/dotdot/README.md#attributes
 * Extra metadata:
 * - writableIf: Indicates an expression that specifies the writability of the attribute.
 *               Defaults to true.
 *               Note: An attribute is only writable if this attribute and the writable attribute are true.
 * - requiredIf: Allows for an expression to be implemented which indicates the conditions in which an attribute is mandatory.
 *               Defaults to false
 */
export interface Attribute extends Restrictions {
    ID: number;
    name: string;
    type: DataType;
    manufacturerCode?: number;
    /** If the attribute is readable OTA. Defaults to true. NOTE: marked as `R` in spec PDF */
    read?: false;
    /** If the attribute is writable OTA. Defaults to false. NOTE: marked as `W` in spec PDF */
    write?: true;
    /** If the attribute is specified as writable this indicates if the write is required (returns READ_ONLY if not). Defaults to false. */
    writeOptional?: true;
    /** If attribute is required to be reportable. Defaults to false. NOTE: marked as `P` in spec PDF */
    report?: true;
    /** If attribute is required to be part of the scene extensions. Defaults to false. NOTE: marked as `S` in spec PDF */
    scene?: true;
    /** If the attribute is mandatory. Defaults to false */
    required?: true;
    /** Specifies the default value of an attribute. No Default */
    default?: number | string;
    /**
     * Specifies that the default value of the attribute takes the value of the referenced attribute.
     * Must be another attriibute in this cluster.
     * Referenced by name, schema forces this during validation.
     */
    // defaultRef?: string;
    /** If attribute is client side */
    client?: true;
}

export interface Parameter extends Restrictions {
    name: string;
    type: DataType | BuffaloZclDataType;
    conditions?: (
        | {type: ParameterCondition.MINIMUM_REMAINING_BUFFER_BYTES; value: number}
        | {type: ParameterCondition.BITMASK_SET; param: string; mask: number /* not set */; reversed?: boolean}
        | {type: ParameterCondition.BITFIELD_ENUM; param: string; offset: number; size: number; value: number}
        | {type: ParameterCondition.DATA_TYPE_CLASS_EQUAL; value: DataTypeClass}
        | {type: ParameterCondition.FIELD_EQUAL; field: string; value: unknown; reversed?: boolean}
        | {type: ParameterCondition.FIELD_GT; field: string; value: number /*; reversed?: boolean*/}
    )[];
    // XXX: current have no use for neither of below
    /**
     * When an array is present, specifies the size (in octets) of the field that specifies the array length.
     * Defaults to 1.
     */
    // arrayLengthSize?: number;
    /**
     * When the number of elements in an array field is specified by another field which does not immediately precede an array field,
     * that field may be referenced using this attribute.
     */
    // arrayLengthField?: string;
}

/**
 * @see https://github.com/project-chip/zap/blob/master/zcl-builtin/dotdot/README.md#commands
 * Extra metadata:
 * - requiredIf: Allows for an expression to be implemented which indicates the conditions in which a command is mandatory. Defaults to false
 */
export interface Command {
    ID: number;
    name: string;
    parameters: readonly Parameter[];
    response?: number;
    /** If the command is mandatory. Defaults to false */
    required?: true;
}

export interface AttributeDefinition extends Omit<Attribute, "name"> {}

export interface CommandDefinition extends Omit<Command, "name"> {
    parameters: readonly Parameter[];
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
    | "piPartition"
    | "genOta"
    | "powerProfile"
    | "haApplianceControl"
    | "pulseWidthModulation"
    | "genPollCtrl"
    | "greenPower"
    | "mobileDeviceCfg"
    | "neighborCleaning"
    | "nearestGateway"
    | "keepAlive"
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
    | "retailTunnel"
    | "seMetering"
    | "seTunneling"
    | "telecommunicationsInformation"
    | "telecommunicationsVoiceOverZigbee"
    | "telecommunicationsChatting"
    | "haApplianceIdentification"
    | "seMeterIdentification"
    | "haApplianceEventsAlerts"
    | "haApplianceStatistics"
    | "haElectricalMeasurement"
    | "haDiagnostic"
    | "touchlink"
    | "manuSpecificOsram"
    | "manuSpecificPhilips"
    | "manuSpecificPhilips2"
    | "manuSpecificSinope"
    | "manuSpecificTuya"
    | "manuSpecificLumi"
    | "manuSpecificTuya2"
    | "manuSpecificTuya3"
    | "manuSpecificCentraliteHumidity"
    | "manuSpecificSmartThingsArrivalSensor"
    | "manuSpecificSamsungAccelerometer"
    | "sprutVoc"
    | "sprutNoise"
    | "sprutIrBlaster"
    | "manuSpecificSiglisZigfred"
    | "owonClearMetering"
    | "zosungIRTransmit"
    | "zosungIRControl"
    | "manuSpecificProfalux1"
    | "manuSpecificAmazonWWAH";
