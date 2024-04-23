import DataType from './dataType';
import BuffaloZclDataType from './buffaloZclDataType';
import * as TsType from '../tstype';

interface ParameterDefinition extends TsType.Parameter {
    conditions?: {
        type: 'statusEquals' |
            'statusNotEquals' |
            'minimumRemainingBufferBytes' |
            'directionEquals' |
            'bitMaskSet' |
            'bitFieldEnum' |
            'dataTypeValueTypeEquals';
        param?: string;
        mask?: number;
        offset?: number;
        size?: number;
        value?: number | string;
    }[];
    name: string;
    type: DataType | BuffaloZclDataType;
}

interface AttributeDefinition {
    ID: number;
    type: DataType;
    manufacturerCode?: number;
}

interface ClusterDefinition {
    ID: number;
    manufacturerCode?: number;
    attributes: Readonly<Record<string, Readonly<AttributeDefinition>>>;
    commands: Readonly<Record<string, Readonly<CommandDefinition>>>;
    commandsResponse: Readonly<Record<string, Readonly<CommandDefinition>>>;
}

interface CustomClusters {[k: string]: ClusterDefinition};

interface CommandDefinition {
    ID: number;
    parameters: readonly ParameterDefinition[];
    response?: number;
}

type ClusterName = (
    | 'genBasic' | 'genPowerCfg' | 'genDeviceTempCfg' | 'genIdentify' | 'genGroups' | 'genScenes' | 'genOnOff'
    | 'genOnOffSwitchCfg' | 'genLevelCtrl' | 'genAlarms' | 'genTime' | 'genRssiLocation' | 'genAnalogInput' | 'genAnalogOutput'
    | 'genAnalogValue' | 'genBinaryInput' | 'genBinaryOutput' | 'genBinaryValue' | 'genMultistateInput' | 'genMultistateOutput'
    | 'genMultistateValue' | 'genCommissioning' | 'genOta' | 'genPollCtrl' | 'greenPower' | 'mobileDeviceCfg' | 'neighborCleaning'
    | 'nearestGateway' | 'closuresShadeCfg' | 'closuresDoorLock' | 'closuresWindowCovering' | 'barrierControl' | 'hvacPumpCfgCtrl'
    | 'hvacThermostat' | 'hvacFanCtrl' | 'hvacDehumidificationCtrl' | 'hvacUserInterfaceCfg' | 'lightingColorCtrl' | 'lightingBallastCfg'
    | 'msIlluminanceMeasurement' | 'msIlluminanceLevelSensing' | 'msTemperatureMeasurement' | 'msPressureMeasurement' | 'msFlowMeasurement'
    | 'msRelativeHumidity' | 'msOccupancySensing' | 'msSoilMoisture' | 'pHMeasurement' | 'msCO2' | 'pm25Measurement' | 'ssIasZone'
    | 'ssIasAce' | 'ssIasWd' | 'piGenericTunnel' | 'piBacnetProtocolTunnel' | 'piAnalogInputReg' | 'piAnalogInputExt' | 'piAnalogOutputReg'
    | 'piAnalogOutputExt' | 'piAnalogValueReg' | 'piAnalogValueExt' | 'piBinaryInputReg' | 'piBinaryInputExt' | 'piBinaryOutputReg'
    | 'piBinaryOutputExt' | 'piBinaryValueReg' | 'piBinaryValueExt' | 'piMultistateInputReg' | 'piMultistateInputExt' | 'piMultistateOutputReg'
    | 'piMultistateOutputExt' | 'piMultistateValueReg' | 'piMultistateValueExt' | 'pi11073ProtocolTunnel' | 'piIso7818ProtocolTunnel'
    | 'piRetailTunnel' | 'seMetering' | 'tunneling' | 'telecommunicationsInformation' | 'telecommunicationsVoiceOverZigbee'
    | 'telecommunicationsChatting' | 'haApplianceIdentification' | 'haMeterIdentification' | 'haApplianceEventsAlerts' | 'haApplianceStatistics'
    | 'haElectricalMeasurement' | 'haDiagnostic' | 'touchlink' | 'manuSpecificIkeaAirPurifier' | 'msIkeaVocIndexMeasurement'
    | 'manuSpecificClusterAduroSmart' | 'manuSpecificOsram' | 'manuSpecificPhilips' | 'manuSpecificPhilips2' | 'manuSpecificSinope'
    | 'manuSpecificUbisysDeviceSetup' | 'manuSpecificUbisysDimmerSetup' | 'manuSpecificLegrandDevices' | 'manuSpecificLegrandDevices2'
    | 'manuSpecificLegrandDevices3' | 'manuSpecificNiko1' | 'manuSpecificNiko2' | 'wiserDeviceInfo' | 'manuSpecificTuya' | 'manuSpecificLumi'
    | 'liXeePrivate' | 'manuSpecificTuya_2' | 'manuSpecificTuya_3' | 'manuSpecificCentraliteHumidity' | 'manuSpecificSmartThingsArrivalSensor'
    | 'manuSpecificSamsungAccelerometer' | 'heimanSpecificFormaldehydeMeasurement' | 'heimanSpecificAirQuality' | 'heimanSpecificScenes'
    | 'tradfriButton' | 'heimanSpecificInfraRedRemote' | 'develcoSpecificAirQuality' | 'schneiderSpecificPilotMode'
    | 'elkoOccupancySettingClusterServer' | 'elkoSwitchConfigurationClusterServer' | 'manuSpecificSchneiderLightSwitchConfiguration'
    | 'manuSpecificSchneiderFanSwitchConfiguration' | 'sprutDevice' | 'sprutVoc' | 'sprutNoise' | 'sprutIrBlaster' | 'manuSpecificSiglisZigfred'
    | 'manuSpecificInovelli' | 'owonClearMetering' | 'zosungIRTransmit' | 'zosungIRControl' | 'manuSpecificBosch' | 'manuSpecificBosch3'
    | 'manuSpecificBosch5' | 'manuSpecificBosch7' | 'manuSpecificBosch8' | 'manuSpecificBosch9' | 'manuSpecificBosch10' | 'manuSpecificBosch11'
    | 'manuSpecificAssaDoorLock' | 'manuSpecificDoorman' | 'manuSpecificNodOnPilotWire' | 'manuSpecificProfalux1' | 'manuSpecificAmazonWWAH'
);

export {
    ParameterDefinition, ClusterDefinition, AttributeDefinition, CommandDefinition, ClusterName, CustomClusters,
};