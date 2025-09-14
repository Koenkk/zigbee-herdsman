import type {
    ExtensionFieldSet,
    Gpd,
    GpdAttributeReport,
    GpdChannelConfiguration,
    GpdChannelRequest,
    GpdCommissioningReply,
    GpdCustomReply,
    MiboxerZone,
    Struct,
    StructuredSelector,
    ThermoTransition,
    TuyaDataPointValue,
    ZclArray,
    ZoneInfo,
} from "./tstype";

export interface TClusters {
    genBasic: {
        attributes: {
            /** ID=0x0000 | type=UINT8 | required=true | max=255 | default=3 */
            zclVersion: number;
            /** ID=0x0001 | type=UINT8 | max=255 | default=0 */
            appVersion: number;
            /** ID=0x0002 | type=UINT8 | max=255 | default=0 */
            stackVersion: number;
            /** ID=0x0003 | type=UINT8 | max=255 | default=0 */
            hwVersion: number;
            /** ID=0x0004 | type=CHAR_STR | default= | maxLength=32 */
            manufacturerName: string;
            /** ID=0x0005 | type=CHAR_STR | default= | maxLength=32 */
            modelId: string;
            /** ID=0x0006 | type=CHAR_STR | default= | maxLength=16 */
            dateCode: string;
            /** ID=0x0007 | type=ENUM8 | required=true | default=0 */
            powerSource: number;
            /** ID=0x0008 | type=ENUM8 | default=255 */
            appProfileVersion: number;
            /** ID=0x0009 | type=ENUM8 | default=255 */
            genericDeviceType: number;
            /** ID=0x000a | type=OCTET_STR | default= */
            productCode: Buffer;
            /** ID=0x000b | type=CHAR_STR | default= */
            productUrl: string;
            /** ID=0x000c | type=CHAR_STR | default= */
            manufacturerVersionDetails: string;
            /** ID=0x000d | type=CHAR_STR | default= */
            serialNumber: string;
            /** ID=0x000e | type=CHAR_STR | default= */
            productLabel: string;
            /** ID=0x0010 | type=CHAR_STR | writable=true | default= | maxLength=16 */
            locationDesc: string;
            /** ID=0x0011 | type=ENUM8 | writable=true | default=0 */
            physicalEnv: number;
            /** ID=0x0012 | type=BOOLEAN | writable=true | default=1 */
            deviceEnabled: number;
            /** ID=0x0013 | type=BITMAP8 | writable=true | default=0 */
            alarmMask: number;
            /** ID=0x0014 | type=BITMAP8 | writable=true | default=0 */
            disableLocalConfig: number;
            /** ID=0x4000 | type=CHAR_STR | default= | maxLength=16 */
            swBuildId: string;
            /** ID=0xe200 | type=INT8 | manufacturerCode=SCHNEIDER_ELECTRIC(0x105e) */
            schneiderMeterRadioPower?: number;
        };
        commands: {
            /** ID=0x00 */
            resetFactDefault: Record<string, never>;
            /** ID=0xf0 */
            tuyaSetup: Record<string, never>;
        };
        commandResponses: never;
    };
    genPowerCfg: {
        attributes: {
            /** ID=0x0000 | type=UINT16 | max=65535 */
            mainsVoltage: number;
            /** ID=0x0001 | type=UINT8 | max=255 */
            mainsFrequency: number;
            /** ID=0x0010 | type=BITMAP8 | writable=true | default=0 */
            mainsAlarmMask: number;
            /** ID=0x0011 | type=UINT16 | writable=true | max=65535 | default=0 */
            mainsVoltMinThres: number;
            /** ID=0x0012 | type=UINT16 | writable=true | max=65535 | default=65535 */
            mainsVoltMaxThres: number;
            /** ID=0x0013 | type=UINT16 | writable=true | max=65535 | default=0 */
            mainsVoltageDwellTripPoint: number;
            /** ID=0x0020 | type=UINT8 | max=255 */
            batteryVoltage: number;
            /** ID=0x0021 | type=UINT8 | reportRequired=true | max=255 | default=0 */
            batteryPercentageRemaining: number;
            /** ID=0x0030 | type=CHAR_STR | writable=true | default= | maxLength=16 */
            batteryManufacturer: string;
            /** ID=0x0031 | type=ENUM8 | writable=true | default=255 */
            batterySize: number;
            /** ID=0x0032 | type=UINT16 | writable=true | max=65535 */
            batteryAHrRating: number;
            /** ID=0x0033 | type=UINT8 | writable=true | max=255 */
            batteryQuantity: number;
            /** ID=0x0034 | type=UINT8 | writable=true | max=255 */
            batteryRatedVoltage: number;
            /** ID=0x0035 | type=BITMAP8 | writable=true | default=0 */
            batteryAlarmMask: number;
            /** ID=0x0036 | type=UINT8 | writable=true | max=255 | default=0 */
            batteryVoltMinThres: number;
            /** ID=0x0037 | type=UINT8 | writable=true | writeOptional=true | max=255 | default=0 */
            batteryVoltThres1: number;
            /** ID=0x0038 | type=UINT8 | writable=true | writeOptional=true | max=255 | default=0 */
            batteryVoltThres2: number;
            /** ID=0x0039 | type=UINT8 | writable=true | writeOptional=true | max=255 | default=0 */
            batteryVoltThres3: number;
            /** ID=0x003a | type=UINT8 | writable=true | writeOptional=true | max=255 | default=0 */
            batteryPercentMinThres: number;
            /** ID=0x003b | type=UINT8 | writable=true | writeOptional=true | max=255 | default=0 */
            batteryPercentThres1: number;
            /** ID=0x003c | type=UINT8 | writable=true | writeOptional=true | max=255 | default=0 */
            batteryPercentThres2: number;
            /** ID=0x003d | type=UINT8 | writable=true | writeOptional=true | max=255 | default=0 */
            batteryPercentThres3: number;
            /** ID=0x003e | type=BITMAP32 | default=0 */
            batteryAlarmState: number;
            /** ID=0x0040 | type=UINT8 | max=255 */
            battery2Voltage: number;
            /** ID=0x0041 | type=UINT8 | reportRequired=true | max=255 | default=0 */
            battery2PercentageRemaining: number;
            /** ID=0x0050 | type=CHAR_STR | writable=true | default= | maxLength=16 */
            battery2Manufacturer: string;
            /** ID=0x0051 | type=ENUM8 | writable=true | default=255 */
            battery2Size: number;
            /** ID=0x0052 | type=UINT16 | writable=true | max=65535 */
            battery2AHrRating: number;
            /** ID=0x0053 | type=UINT8 | writable=true | max=255 */
            battery2Quantity: number;
            /** ID=0x0054 | type=UINT8 | writable=true | max=255 */
            battery2RatedVoltage: number;
            /** ID=0x0055 | type=BITMAP8 | writable=true | default=0 */
            battery2AlarmMask: number;
            /** ID=0x0056 | type=UINT8 | writable=true | max=255 | default=0 */
            battery2VoltageMinThreshold: number;
            /** ID=0x0057 | type=UINT8 | writable=true | writeOptional=true | max=255 | default=0 */
            battery2VoltageThreshold1: number;
            /** ID=0x0058 | type=UINT8 | writable=true | writeOptional=true | max=255 | default=0 */
            battery2VoltageThreshold2: number;
            /** ID=0x0059 | type=UINT8 | writable=true | writeOptional=true | max=255 | default=0 */
            battery2VoltageThreshold3: number;
            /** ID=0x005a | type=UINT8 | writable=true | writeOptional=true | max=255 | default=0 */
            battery2PercentageMinThreshold: number;
            /** ID=0x005b | type=UINT8 | writable=true | writeOptional=true | max=255 | default=0 */
            battery2PercentageThreshold1: number;
            /** ID=0x005c | type=UINT8 | writable=true | writeOptional=true | max=255 | default=0 */
            battery2PercentageThreshold2: number;
            /** ID=0x005d | type=UINT8 | writable=true | writeOptional=true | max=255 | default=0 */
            battery2PercentageThreshold3: number;
            /** ID=0x005e | type=BITMAP32 | default=0 */
            battery2AlarmState: number;
            /** ID=0x0060 | type=UINT8 | max=255 */
            battery3Voltage: number;
            /** ID=0x0061 | type=UINT8 | reportRequired=true | max=255 | default=0 */
            battery3PercentageRemaining: number;
            /** ID=0x0070 | type=CHAR_STR | writable=true | default= | maxLength=16 */
            battery3Manufacturer: string;
            /** ID=0x0071 | type=ENUM8 | writable=true | default=255 */
            battery3Size: number;
            /** ID=0x0072 | type=UINT16 | writable=true | max=65535 */
            battery3AHrRating: number;
            /** ID=0x0073 | type=UINT8 | writable=true | max=255 */
            battery3Quantity: number;
            /** ID=0x0074 | type=UINT8 | writable=true | max=255 */
            battery3RatedVoltage: number;
            /** ID=0x0075 | type=BITMAP8 | writable=true | default=0 */
            battery3AlarmMask: number;
            /** ID=0x0076 | type=UINT8 | writable=true | max=255 | default=0 */
            battery3VoltageMinThreshold: number;
            /** ID=0x0077 | type=UINT8 | writable=true | writeOptional=true | max=255 | default=0 */
            battery3VoltageThreshold1: number;
            /** ID=0x0078 | type=UINT8 | writable=true | writeOptional=true | max=255 | default=0 */
            battery3VoltageThreshold2: number;
            /** ID=0x0079 | type=UINT8 | writable=true | writeOptional=true | max=255 | default=0 */
            battery3VoltageThreshold3: number;
            /** ID=0x007a | type=UINT8 | writable=true | writeOptional=true | max=255 | default=0 */
            battery3PercentageMinThreshold: number;
            /** ID=0x007b | type=UINT8 | writable=true | writeOptional=true | max=255 | default=0 */
            battery3PercentageThreshold1: number;
            /** ID=0x007c | type=UINT8 | writable=true | writeOptional=true | max=255 | default=0 */
            battery3PercentageThreshold2: number;
            /** ID=0x007d | type=UINT8 | writable=true | writeOptional=true | max=255 | default=0 */
            battery3PercentageThreshold3: number;
            /** ID=0x007e | type=BITMAP32 | default=0 */
            battery3AlarmState: number;
        };
        commands: never;
        commandResponses: never;
    };
    genDeviceTempCfg: {
        attributes: {
            /** ID=0x0000 | type=INT16 | required=true | min=-200 | max=200 */
            currentTemperature: number;
            /** ID=0x0001 | type=INT16 | min=-200 | max=200 */
            minTempExperienced: number;
            /** ID=0x0002 | type=INT16 | min=-200 | max=200 */
            maxTempExperienced: number;
            /** ID=0x0003 | type=UINT16 | max=65535 | default=0 */
            overTempTotalDwell: number;
            /** ID=0x0010 | type=BITMAP8 | writable=true | default=0 */
            devTempAlarmMask: number;
            /** ID=0x0011 | type=INT16 | writable=true | min=-200 | max=200 | maxExclusiveRef=highTempThres */
            lowTempThres: number;
            /** ID=0x0012 | type=INT16 | writable=true | min=-200 | max=200 | minExclusiveRef=lowTempThres */
            highTempThres: number;
            /** ID=0x0013 | type=UINT24 | writable=true | max=16777215 */
            lowTempDwellTripPoint: number;
            /** ID=0x0014 | type=UINT24 | writable=true | max=16777215 */
            highTempDwellTripPoint: number;
        };
        commands: never;
        commandResponses: never;
    };
    genIdentify: {
        attributes: {
            /** ID=0x0000 | type=UINT16 | writable=true | required=true | max=65535 | default=0 */
            identifyTime: number;
            /** ID=0x0001 | type=UNKNOWN */
            identifyCommissionState: never;
        };
        commands: {
            /** ID=0x00 | required=true */
            identify: {
                /** type=UINT16 */
                identifytime: number;
            };
            /** ID=0x01 | required=true */
            identifyQuery: Record<string, never>;
            /** ID=0x02 */
            ezmodeInvoke: {
                /** type=UINT8 */
                action: number;
            };
            /** ID=0x03 */
            updateCommissionState: {
                /** type=UINT8 */
                action: number;
                /** type=UINT8 */
                commstatemask: number;
            };
            /** ID=0x40 */
            triggerEffect: {
                /** type=UINT8 */
                effectid: number;
                /** type=UINT8 */
                effectvariant: number;
            };
        };
        commandResponses: {
            /** ID=0x00 | required=true */
            identifyQueryRsp: {
                /** type=UINT16 */
                timeout: number;
            };
        };
    };
    genGroups: {
        attributes: {
            /** ID=0x0000 | type=BITMAP8 | required=true */
            nameSupport: number;
        };
        commands: {
            /** ID=0x00 | response=0 | required=true */
            add: {
                /** type=UINT16 */
                groupid: number;
                /** type=CHAR_STR */
                groupname: string;
            };
            /** ID=0x01 | response=1 | required=true */
            view: {
                /** type=UINT16 */
                groupid: number;
            };
            /** ID=0x02 | response=2 | required=true */
            getMembership: {
                /** type=UINT8 */
                groupcount: number;
                /** type=LIST_UINT16 */
                grouplist: number[];
            };
            /** ID=0x03 | response=3 | required=true */
            remove: {
                /** type=UINT16 */
                groupid: number;
            };
            /** ID=0x04 | required=true */
            removeAll: Record<string, never>;
            /** ID=0x05 | required=true */
            addIfIdentifying: {
                /** type=UINT16 */
                groupid: number;
                /** type=CHAR_STR */
                groupname: string;
            };
            /** ID=0xf0 */
            miboxerSetZones: {
                /** type=LIST_MIBOXER_ZONES */
                zones: MiboxerZone[];
            };
        };
        commandResponses: {
            /** ID=0x00 | required=true */
            addRsp: {
                /** type=UINT8 */
                status: number;
                /** type=UINT16 */
                groupid: number;
            };
            /** ID=0x01 | required=true */
            viewRsp: {
                /** type=UINT8 */
                status: number;
                /** type=UINT16 */
                groupid: number;
                /** type=CHAR_STR */
                groupname: string;
            };
            /** ID=0x02 | required=true */
            getMembershipRsp: {
                /** type=UINT8 */
                capacity: number;
                /** type=UINT8 */
                groupcount: number;
                /** type=LIST_UINT16 */
                grouplist: number[];
            };
            /** ID=0x03 | required=true */
            removeRsp: {
                /** type=UINT8 */
                status: number;
                /** type=UINT16 */
                groupid: number;
            };
        };
    };
    genScenes: {
        attributes: {
            /** ID=0x0000 | type=UINT8 | required=true | default=0 */
            count: number;
            /** ID=0x0001 | type=UINT8 | required=true | default=0 */
            currentScene: number;
            /** ID=0x0002 | type=UINT16 | required=true | default=0 */
            currentGroup: number;
            /** ID=0x0003 | type=BOOLEAN | required=true | default=0 */
            sceneValid: number;
            /** ID=0x0004 | type=BITMAP8 | required=true */
            nameSupport: number;
            /** ID=0x0005 | type=IEEE_ADDR | special=UnknownOrNotConfigured,ffffffffffffffff */
            lastCfgBy: string;
        };
        commands: {
            /** ID=0x00 | response=0 | required=true */
            add: {
                /** type=UINT16 */
                groupid: number;
                /** type=UINT8 */
                sceneid: number;
                /** type=UINT16 */
                transtime: number;
                /** type=CHAR_STR */
                scenename: string;
                /** type=EXTENSION_FIELD_SETS | arrayLengthSize=0 */
                extensionfieldsets: ExtensionFieldSet[];
            };
            /** ID=0x01 | response=1 | required=true */
            view: {
                /** type=UINT16 */
                groupid: number;
                /** type=UINT8 */
                sceneid: number;
            };
            /** ID=0x02 | response=2 | required=true */
            remove: {
                /** type=UINT16 */
                groupid: number;
                /** type=UINT8 */
                sceneid: number;
            };
            /** ID=0x03 | response=3 | required=true */
            removeAll: {
                /** type=UINT16 */
                groupid: number;
            };
            /** ID=0x04 | response=4 | required=true */
            store: {
                /** type=UINT16 */
                groupid: number;
                /** type=UINT8 */
                sceneid: number;
            };
            /** ID=0x05 | required=true */
            recall: {
                /** type=UINT16 */
                groupid: number;
                /** type=UINT8 */
                sceneid: number;
                /** type=UINT16 */
                transitionTime: number;
            };
            /** ID=0x06 | response=6 | required=true */
            getSceneMembership: {
                /** type=UINT16 */
                groupid: number;
            };
            /** ID=0x07 */
            tradfriArrowSingle: {
                /** type=UINT16 */
                value: number;
                /** type=UINT16 */
                value2: number;
            };
            /** ID=0x08 */
            tradfriArrowHold: {
                /** type=UINT16 */
                value: number;
            };
            /** ID=0x09 */
            tradfriArrowRelease: {
                /** type=UINT16 */
                value: number;
            };
            /** ID=0x40 | response=64 */
            enhancedAdd: {
                /** type=UINT16 */
                groupid: number;
                /** type=UINT8 */
                sceneid: number;
                /** type=UINT16 */
                transtime: number;
                /** type=CHAR_STR */
                scenename: string;
                /** type=EXTENSION_FIELD_SETS | arrayLengthSize=0 */
                extensionfieldsets: ExtensionFieldSet[];
            };
            /** ID=0x41 | response=65 */
            enhancedView: {
                /** type=UINT16 */
                groupid: number;
                /** type=UINT8 */
                sceneid: number;
            };
            /** ID=0x42 | response=66 */
            copy: {
                /** type=UINT8 */
                mode: number;
                /** type=UINT16 */
                groupidfrom: number;
                /** type=UINT8 */
                sceneidfrom: number;
                /** type=UINT16 */
                groupidto: number;
                /** type=UINT8 */
                sceneidto: number;
            };
        };
        commandResponses: {
            /** ID=0x00 | required=true */
            addRsp: {
                /** type=UINT8 */
                status: number;
                /** type=UINT16 */
                groupId: number;
                /** type=UINT8 */
                sceneId: number;
            };
            /** ID=0x01 | required=true */
            viewRsp: {
                /** type=UINT8 */
                status: number;
                /** type=UINT16 */
                groupid: number;
                /** type=UINT8 */
                sceneid: number;
                /** type=UINT16 | conditions=[{fieldEquals field=status value=0}] */
                transtime?: number;
                /** type=CHAR_STR | conditions=[{fieldEquals field=status value=0}] */
                scenename?: string;
                /** type=EXTENSION_FIELD_SETS | arrayLengthSize=0 | conditions=[{fieldEquals field=status value=0}] */
                extensionfieldsets?: ExtensionFieldSet[];
            };
            /** ID=0x02 | required=true */
            removeRsp: {
                /** type=UINT8 */
                status: number;
                /** type=UINT16 */
                groupid: number;
                /** type=UINT8 */
                sceneid: number;
            };
            /** ID=0x03 | required=true */
            removeAllRsp: {
                /** type=UINT8 */
                status: number;
                /** type=UINT16 */
                groupid: number;
            };
            /** ID=0x04 | required=true */
            storeRsp: {
                /** type=UINT8 */
                status: number;
                /** type=UINT16 */
                groupid: number;
                /** type=UINT8 */
                sceneid: number;
            };
            /** ID=0x06 | required=true */
            getSceneMembershipRsp: {
                /** type=UINT8 */
                status: number;
                /** type=UINT8 | minInclusive=1 | maxInclusive=253 | special=NoFurtherScenesMayBeAdded,00,AtLeastOneFurtherSceneMayBeAdded,fe,Unknown,ff */
                capacity: number;
                /** type=UINT16 */
                groupid: number;
                /** type=UINT8 | conditions=[{fieldEquals field=status value=0}] */
                scenecount?: number;
                /** type=LIST_UINT8 | conditions=[{fieldEquals field=status value=0}] */
                scenelist?: number[];
            };
            /** ID=0x40 */
            enhancedAddRsp: {
                /** type=UINT8 */
                status: number;
                /** type=UINT16 */
                groupId: number;
                /** type=UINT8 */
                sceneId: number;
            };
            /** ID=0x41 */
            enhancedViewRsp: {
                /** type=UINT8 */
                status: number;
                /** type=UINT16 */
                groupid: number;
                /** type=UINT8 */
                sceneid: number;
                /** type=UINT16 | conditions=[{fieldEquals field=status value=0}] */
                transtime?: number;
                /** type=CHAR_STR | conditions=[{fieldEquals field=status value=0}] */
                scenename?: string;
                /** type=EXTENSION_FIELD_SETS | arrayLengthSize=0 | conditions=[{fieldEquals field=status value=0}] */
                extensionfieldsets?: ExtensionFieldSet[];
            };
            /** ID=0x42 */
            copyRsp: {
                /** type=UINT8 */
                status: number;
                /** type=UINT16 */
                groupidfrom: number;
                /** type=UINT8 */
                sceneidfrom: number;
            };
        };
    };
    genOnOff: {
        attributes: {
            /** ID=0x0000 | type=BOOLEAN | reportRequired=true | sceneRequired=true | required=true | max=1 | default=0 */
            onOff: number;
            /** ID=0x0001 | type=UINT16 | manufacturerCode=NODON(0x128b) */
            nodonTransitionTime?: number;
            /** ID=0x4000 | type=BOOLEAN | max=1 | default=1 */
            globalSceneCtrl: number;
            /** ID=0x4001 | type=UINT16 | writable=true | max=65535 | default=0 */
            onTime: number;
            /** ID=0x4002 | type=UINT16 | writable=true | max=65535 | default=0 */
            offWaitTime: number;
            /** ID=0x4003 | type=ENUM8 | writable=true */
            startUpOnOff: number;
            /** ID=0x5000 | type=ENUM8 */
            tuyaBacklightSwitch: number;
            /** ID=0x8001 | type=ENUM8 */
            tuyaBacklightMode: number;
            /** ID=0x8002 | type=ENUM8 */
            moesStartUpOnOff: number;
            /** ID=0x8004 | type=ENUM8 */
            tuyaOperationMode: number;
            /** ID=0xe000 | type=UINT16 | manufacturerCode=ADEO(0x1277) */
            elkoPreWarningTime?: number;
            /** ID=0xe001 | type=UINT32 | manufacturerCode=ADEO(0x1277) */
            elkoOnTimeReload?: number;
            /** ID=0xe002 | type=BITMAP8 | manufacturerCode=ADEO(0x1277) */
            elkoOnTimeReloadOptions?: number;
        };
        commands: {
            /** ID=0x00 | required=true */
            off: Record<string, never>;
            /** ID=0x01 | required=true */
            on: Record<string, never>;
            /** ID=0x02 | required=true */
            toggle: Record<string, never>;
            /** ID=0x40 */
            offWithEffect: {
                /** type=UINT8 */
                effectid: number;
                /** type=UINT8 */
                effectvariant: number;
            };
            /** ID=0x41 */
            onWithRecallGlobalScene: Record<string, never>;
            /** ID=0x42 */
            onWithTimedOff: {
                /** type=UINT8 */
                ctrlbits: number;
                /** type=UINT16 */
                ontime: number;
                /** type=UINT16 */
                offwaittime: number;
            };
            /** ID=0xfc */
            tuyaAction2: {
                /** type=UINT8 */
                value: number;
            };
            /** ID=0xfd */
            tuyaAction: {
                /** type=UINT8 */
                value: number;
                /** type=BUFFER */
                data: Buffer;
            };
        };
        commandResponses: never;
    };
    genOnOffSwitchCfg: {
        attributes: {
            /** ID=0x0000 | type=ENUM8 */
            switchType: number;
            /** ID=0x0002 | type=UNKNOWN */
            switchMultiFunction: never;
            /** ID=0x0010 | type=ENUM8 */
            switchActions: number;
        };
        commands: never;
        commandResponses: never;
    };
    genLevelCtrl: {
        attributes: {
            /** ID=0x0000 | type=UINT8 | reportRequired=true | sceneRequired=true | required=true | default=255 | minInclusiveRef=minLevel | maxInclusiveRef=maxLevel */
            currentLevel: number;
            /** ID=0x0001 | type=UINT16 | max=65535 | default=0 */
            remainingTime: number;
            /** ID=0x0002 | type=UINT8 | default=0 | maxInclusiveRef=maxLevel */
            minLevel: number;
            /** ID=0x0003 | type=UINT8 | max=255 | default=255 | minInclusiveRef=minLevel */
            maxLevel: number;
            /** ID=0x0004 | type=UINT16 | reportRequired=true | sceneRequired=true | default=0 | minInclusiveRef=minFrequency | maxInclusiveRef=maxFrequency */
            currentFrequency: number;
            /** ID=0x0005 | type=UINT16 | default=0 | maxInclusiveRef=maxFrequency */
            minFrequency: number;
            /** ID=0x0006 | type=UINT16 | max=65535 | default=0 | minInclusiveRef=minFrequency */
            maxFrequency: number;
            /** ID=0x000f | type=BITMAP8 | writable=true | default=0 */
            options: number;
            /** ID=0x0010 | type=UINT16 | writable=true | max=65535 | default=0 */
            onOffTransitionTime: number;
            /** ID=0x0011 | type=UINT8 | writable=true | default=255 | minInclusiveRef=minLevel | maxInclusiveRef=maxLevel */
            onLevel: number;
            /** ID=0x0012 | type=UINT16 | writable=true | max=65534 | default=65535 */
            onTransitionTime: number;
            /** ID=0x0013 | type=UINT16 | writable=true | max=65534 | default=65535 */
            offTransitionTime: number;
            /** ID=0x0014 | type=UINT16 | writable=true | max=254 */
            defaultMoveRate: number;
            /** ID=0x4000 | type=UINT8 | writable=true | max=255 | special=MinimumDeviceValuePermitted,00,SetToPreviousValue,ff */
            startUpCurrentLevel: number;
            /** ID=0x4000 | type=UINT8 | manufacturerCode=ADEO(0x1277) */
            elkoStartUpCurrentLevel?: number;
        };
        commands: {
            /** ID=0x00 | required=true */
            moveToLevel: {
                /** type=UINT8 */
                level: number;
                /** type=UINT16 */
                transtime: number;
                /** type=BITMAP8 */
                optionsMask: number;
                /** type=BITMAP8 */
                optionsOverride: number;
            };
            /** ID=0x01 | required=true */
            move: {
                /** type=UINT8 */
                movemode: number;
                /** type=UINT8 */
                rate: number;
                /** type=BITMAP8 */
                optionsMask: number;
                /** type=BITMAP8 */
                optionsOverride: number;
            };
            /** ID=0x02 | required=true */
            step: {
                /** type=UINT8 */
                stepmode: number;
                /** type=UINT8 */
                stepsize: number;
                /** type=UINT16 */
                transtime: number;
                /** type=BITMAP8 */
                optionsMask: number;
                /** type=BITMAP8 */
                optionsOverride: number;
            };
            /** ID=0x03 | required=true */
            stop: {
                /** type=BITMAP8 */
                optionsMask: number;
                /** type=BITMAP8 */
                optionsOverride: number;
            };
            /** ID=0x04 | required=true */
            moveToLevelWithOnOff: {
                /** type=UINT8 */
                level: number;
                /** type=UINT16 */
                transtime: number;
                /** type=BITMAP8 */
                optionsMask: number;
                /** type=BITMAP8 */
                optionsOverride: number;
            };
            /** ID=0x05 | required=true */
            moveWithOnOff: {
                /** type=UINT8 */
                movemode: number;
                /** type=UINT8 */
                rate: number;
                /** type=BITMAP8 */
                optionsMask: number;
                /** type=BITMAP8 */
                optionsOverride: number;
            };
            /** ID=0x06 | required=true */
            stepWithOnOff: {
                /** type=UINT8 */
                stepmode: number;
                /** type=UINT8 */
                stepsize: number;
                /** type=UINT16 */
                transtime: number;
                /** type=BITMAP8 */
                optionsMask: number;
                /** type=BITMAP8 */
                optionsOverride: number;
            };
            /** ID=0x07 | required=true */
            stopWithOnOff: {
                /** type=BITMAP8 */
                optionsMask: number;
                /** type=BITMAP8 */
                optionsOverride: number;
            };
            /** ID=0x08 */
            moveToClosestFrequency: {
                /** type=UINT16 */
                frequency: number;
            };
            /** ID=0xf0 */
            moveToLevelTuya: {
                /** type=UINT16 */
                level: number;
                /** type=UINT16 */
                transtime: number;
            };
        };
        commandResponses: never;
    };
    genAlarms: {
        attributes: {
            /** ID=0x0000 | type=UINT16 | default=0 */
            alarmCount: number;
        };
        commands: {
            /** ID=0x00 | required=true */
            reset: {
                /** type=UINT8 */
                alarmcode: number;
                /** type=UINT16 */
                clusterid: number;
            };
            /** ID=0x01 | required=true */
            resetAll: Record<string, never>;
            /** ID=0x02 */
            getAlarm: Record<string, never>;
            /** ID=0x03 */
            resetLog: Record<string, never>;
            /** ID=0x04 */
            publishEventLog: Record<string, never>;
        };
        commandResponses: {
            /** ID=0x00 | required=true */
            alarm: {
                /** type=UINT8 */
                alarmcode: number;
                /** type=UINT16 */
                clusterid: number;
            };
            /** ID=0x01 */
            getRsp: {
                /** type=UINT8 */
                status: number;
                /** type=UINT8 */
                alarmcode: number;
                /** type=UINT16 */
                clusterid: number;
                /** type=UINT32 */
                timestamp: number;
            };
            /** ID=0x02 */
            getEventLog: Record<string, never>;
        };
    };
    genTime: {
        attributes: {
            /** ID=0x0000 | type=UTC | writable=true | required=true | max=4294967294 | default=4294967295 */
            time: number;
            /** ID=0x0001 | type=BITMAP8 | writable=true | required=true | default=0 */
            timeStatus: number;
            /** ID=0x0002 | type=INT32 | writable=true | min=-86400 | max=86400 | default=0 */
            timeZone: number;
            /** ID=0x0003 | type=UINT32 | writable=true | max=4294967294 | default=4294967295 */
            dstStart: number;
            /** ID=0x0004 | type=UINT32 | writable=true | max=4294967294 | default=4294967295 */
            dstEnd: number;
            /** ID=0x0005 | type=INT32 | writable=true | min=-86400 | max=86400 | default=0 */
            dstShift: number;
            /** ID=0x0006 | type=UINT32 | max=4294967294 | default=4294967295 */
            standardTime: number;
            /** ID=0x0007 | type=UINT32 | max=4294967294 | default=4294967295 */
            localTime: number;
            /** ID=0x0008 | type=UTC | default=4294967295 */
            lastSetTime: number;
            /** ID=0x0009 | type=UTC | writable=true | default=4294967295 */
            validUntilTime: number;
        };
        commands: never;
        commandResponses: never;
    };
    genRssiLocation: {
        attributes: {
            /** ID=0x0000 | type=DATA8 */
            type: number;
            /** ID=0x0001 | type=ENUM8 */
            method: number;
            /** ID=0x0002 | type=UINT16 */
            age: number;
            /** ID=0x0003 | type=UINT8 */
            qualityMeasure: number;
            /** ID=0x0004 | type=UINT8 */
            numOfDevices: number;
            /** ID=0x0010 | type=INT16 */
            coordinate1: number;
            /** ID=0x0011 | type=INT16 */
            coordinate2: number;
            /** ID=0x0012 | type=INT16 */
            coordinate3: number;
            /** ID=0x0013 | type=INT16 */
            power: number;
            /** ID=0x0014 | type=UINT16 */
            pathLossExponent: number;
            /** ID=0x0015 | type=UINT16 */
            reportingPeriod: number;
            /** ID=0x0016 | type=UINT16 */
            calcPeriod: number;
            /** ID=0x0017 | type=UINT8 */
            numRSSIMeasurements: number;
        };
        commands: {
            /** ID=0x00 */
            setAbsolute: {
                /** type=INT16 */
                coord1: number;
                /** type=INT16 */
                coord2: number;
                /** type=INT16 */
                coord3: number;
                /** type=INT16 */
                power: number;
                /** type=UINT16 */
                pathLossExponent: number;
            };
            /** ID=0x01 */
            setDeviceConfig: {
                /** type=INT16 */
                power: number;
                /** type=UINT16 */
                pathLossExponent: number;
                /** type=UINT16 */
                calcPeriod: number;
                /** type=UINT8 */
                numRssiMeasurements: number;
                /** type=UINT16 */
                reportingPeriod: number;
            };
            /** ID=0x02 */
            getDeviceConfig: {
                /** type=IEEE_ADDR */
                targetAddr: string;
            };
            /** ID=0x03 */
            getLocationData: {
                /** type=BITMAP8 */
                info: number;
                /** type=UINT8 */
                numResponses: number;
                /** type=IEEE_ADDR | conditions=[{bitMaskSet param=info mask=4 reversed=true}] */
                targetAddr?: string;
            };
            /** ID=0x04 */
            rssiResponse: {
                /** type=IEEE_ADDR */
                replyingDevice: string;
                /** type=INT16 */
                x: number;
                /** type=INT16 */
                y: number;
                /** type=INT16 */
                z: number;
                /** type=INT8 */
                rssi: number;
                /** type=UINT8 */
                numRssiMeasurements: number;
            };
            /** ID=0x05 */
            sendPings: {
                /** type=IEEE_ADDR */
                targetAddr: string;
                /** type=UINT8 */
                numRssiMeasurements: number;
                /** type=UINT16 */
                calcPeriod: number;
            };
            /** ID=0x06 */
            anchorNodeAnnounce: {
                /** type=IEEE_ADDR */
                anchorNodeAddr: string;
                /** type=INT16 */
                x: number;
                /** type=INT16 */
                y: number;
                /** type=INT16 */
                z: number;
            };
        };
        commandResponses: {
            /** ID=0x00 */
            deviceConfigResponse: {
                /** type=ENUM8 */
                status: number;
                /** type=INT16 | conditions=[{fieldEquals field=status value=0}] */
                power?: number;
                /** type=UINT16 | conditions=[{fieldEquals field=status value=0}] */
                pathLossExponent?: number;
                /** type=UINT16 | conditions=[{fieldEquals field=status value=0}] */
                calcPeriod?: number;
                /** type=UINT8 | conditions=[{fieldEquals field=status value=0}] */
                numRssiMeasurements?: number;
                /** type=UINT16 | conditions=[{fieldEquals field=status value=0}] */
                reportingPeriod?: number;
            };
            /** ID=0x01 */
            locationDataResponse: {
                /** type=ENUM8 */
                status: number;
                /** type=DATA8 | conditions=[{fieldEquals field=status value=0}] */
                type?: number;
                /** type=INT16 | conditions=[{fieldEquals field=status value=0}] */
                coord1?: number;
                /** type=INT16 | conditions=[{fieldEquals field=status value=0}] */
                coord2?: number;
                /** type=INT16 | conditions=[{fieldEquals field=status value=0}] */
                coord3?: number;
                /** type=INT16 | conditions=[{fieldEquals field=status value=0}] */
                power?: number;
                /** type=UINT16 | conditions=[{fieldEquals field=status value=0}] */
                pathLossExponent?: number;
                /** type=ENUM8 | conditions=[{fieldEquals field=status value=0}] */
                method?: number;
                /** type=UINT8 | conditions=[{fieldEquals field=status value=0}] */
                qualityMeasure?: number;
                /** type=UINT16 | conditions=[{fieldEquals field=status value=0}] */
                age?: number;
            };
            /** ID=0x02 */
            locationDataNotification: {
                /** type=DATA8 */
                type: number;
                /** type=INT16 */
                coord1: number;
                /** type=INT16 */
                coord2: number;
                /** type=INT16 | conditions=[{bitMaskSet param=type mask=2 reversed=true}] */
                coord3?: number;
                /** type=INT16 */
                power: number;
                /** type=UINT16 */
                pathLossExponent: number;
                /** type=ENUM8 | conditions=[{bitMaskSet param=type mask=1 reversed=true}] */
                method?: number;
                /** type=UINT8 | conditions=[{bitMaskSet param=type mask=1 reversed=true}] */
                qualityMeasure?: number;
                /** type=UINT16 | conditions=[{bitMaskSet param=type mask=1 reversed=true}] */
                age?: number;
            };
            /** ID=0x03 */
            compactLocationDataNotification: {
                /** type=DATA8 */
                type: number;
                /** type=INT16 */
                coord1: number;
                /** type=INT16 */
                coord2: number;
                /** type=INT16 | conditions=[{bitMaskSet param=type mask=2 reversed=true}] */
                coord3?: number;
                /** type=UINT8 | conditions=[{bitMaskSet param=type mask=1 reversed=true}] */
                qualityMeasure?: number;
                /** type=UINT16 | conditions=[{bitMaskSet param=type mask=1 reversed=true}] */
                age?: number;
            };
            /** ID=0x04 */
            rssiPing: {
                /** type=DATA8 */
                type: number;
            };
            /** ID=0x05 */
            rssiRequest: Record<string, never>;
            /** ID=0x06 */
            reportRssiMeasurements: {
                /** type=IEEE_ADDR */
                measuringDeviceAddr: string;
                /** type=UINT8 */
                numNeighbors: number;
            };
            /** ID=0x07 */
            requestOwnLocation: {
                /** type=IEEE_ADDR */
                blindNodeAddr: string;
            };
        };
    };
    genAnalogInput: {
        attributes: {
            /** ID=0x001c | type=CHAR_STR */
            description: string;
            /** ID=0x0041 | type=SINGLE_PREC */
            maxPresentValue: number;
            /** ID=0x0045 | type=SINGLE_PREC */
            minPresentValue: number;
            /** ID=0x0051 | type=BOOLEAN */
            outOfService: number;
            /** ID=0x0055 | type=SINGLE_PREC */
            presentValue: number;
            /** ID=0x0067 | type=ENUM8 */
            reliability: number;
            /** ID=0x006a | type=SINGLE_PREC */
            resolution: number;
            /** ID=0x006f | type=BITMAP8 */
            statusFlags: number;
            /** ID=0x0075 | type=ENUM16 */
            engineeringUnits: number;
            /** ID=0x0100 | type=UINT32 */
            applicationType: number;
        };
        commands: never;
        commandResponses: never;
    };
    genAnalogOutput: {
        attributes: {
            /** ID=0x001c | type=CHAR_STR */
            description: string;
            /** ID=0x0041 | type=SINGLE_PREC */
            maxPresentValue: number;
            /** ID=0x0045 | type=SINGLE_PREC */
            minPresentValue: number;
            /** ID=0x0051 | type=BOOLEAN */
            outOfService: number;
            /** ID=0x0055 | type=SINGLE_PREC */
            presentValue: number;
            /** ID=0x0057 | type=ARRAY */
            priorityArray: ZclArray | unknown[];
            /** ID=0x0067 | type=ENUM8 */
            reliability: number;
            /** ID=0x0068 | type=SINGLE_PREC */
            relinquishDefault: number;
            /** ID=0x006a | type=SINGLE_PREC */
            resolution: number;
            /** ID=0x006f | type=BITMAP8 */
            statusFlags: number;
            /** ID=0x0075 | type=ENUM16 */
            engineeringUnits: number;
            /** ID=0x0100 | type=UINT32 */
            applicationType: number;
        };
        commands: never;
        commandResponses: never;
    };
    genAnalogValue: {
        attributes: {
            /** ID=0x001c | type=CHAR_STR */
            description: string;
            /** ID=0x0051 | type=BOOLEAN */
            outOfService: number;
            /** ID=0x0055 | type=SINGLE_PREC */
            presentValue: number;
            /** ID=0x0057 | type=ARRAY */
            priorityArray: ZclArray | unknown[];
            /** ID=0x0067 | type=ENUM8 */
            reliability: number;
            /** ID=0x0068 | type=SINGLE_PREC */
            relinquishDefault: number;
            /** ID=0x006f | type=BITMAP8 */
            statusFlags: number;
            /** ID=0x0075 | type=ENUM16 */
            engineeringUnits: number;
            /** ID=0x0100 | type=UINT32 */
            applicationType: number;
        };
        commands: never;
        commandResponses: never;
    };
    genBinaryInput: {
        attributes: {
            /** ID=0x0004 | type=CHAR_STR */
            activeText: string;
            /** ID=0x001c | type=CHAR_STR */
            description: string;
            /** ID=0x002e | type=CHAR_STR */
            inactiveText: string;
            /** ID=0x0051 | type=BOOLEAN */
            outOfService: number;
            /** ID=0x0054 | type=ENUM8 */
            polarity: number;
            /** ID=0x0055 | type=BOOLEAN */
            presentValue: number;
            /** ID=0x0067 | type=ENUM8 */
            reliability: number;
            /** ID=0x006f | type=BITMAP8 */
            statusFlags: number;
            /** ID=0x0100 | type=UINT32 */
            applicationType: number;
        };
        commands: never;
        commandResponses: never;
    };
    genBinaryOutput: {
        attributes: {
            /** ID=0x0004 | type=CHAR_STR */
            activeText: string;
            /** ID=0x001c | type=CHAR_STR */
            description: string;
            /** ID=0x002e | type=CHAR_STR */
            inactiveText: string;
            /** ID=0x0042 | type=UINT32 */
            minimumOffTime: number;
            /** ID=0x0043 | type=UINT32 */
            minimumOnTime: number;
            /** ID=0x0051 | type=BOOLEAN */
            outOfService: number;
            /** ID=0x0054 | type=ENUM8 */
            polarity: number;
            /** ID=0x0055 | type=BOOLEAN */
            presentValue: number;
            /** ID=0x0057 | type=ARRAY */
            priorityArray: ZclArray | unknown[];
            /** ID=0x0067 | type=ENUM8 */
            reliability: number;
            /** ID=0x0068 | type=BOOLEAN */
            relinquishDefault: number;
            /** ID=0x006f | type=BITMAP8 */
            statusFlags: number;
            /** ID=0x0100 | type=UINT32 */
            applicationType: number;
        };
        commands: never;
        commandResponses: never;
    };
    genBinaryValue: {
        attributes: {
            /** ID=0x0004 | type=CHAR_STR */
            activeText: string;
            /** ID=0x001c | type=CHAR_STR */
            description: string;
            /** ID=0x002e | type=CHAR_STR */
            inactiveText: string;
            /** ID=0x0042 | type=UINT32 */
            minimumOffTime: number;
            /** ID=0x0043 | type=UINT32 */
            minimumOnTime: number;
            /** ID=0x0051 | type=BOOLEAN */
            outOfService: number;
            /** ID=0x0055 | type=BOOLEAN */
            presentValue: number;
            /** ID=0x0057 | type=ARRAY */
            priorityArray: ZclArray | unknown[];
            /** ID=0x0067 | type=ENUM8 */
            reliability: number;
            /** ID=0x0068 | type=BOOLEAN */
            relinquishDefault: number;
            /** ID=0x006f | type=BITMAP8 */
            statusFlags: number;
            /** ID=0x0100 | type=UINT32 */
            applicationType: number;
        };
        commands: never;
        commandResponses: never;
    };
    genMultistateInput: {
        attributes: {
            /** ID=0x000e | type=ARRAY */
            stateText: ZclArray | unknown[];
            /** ID=0x001c | type=CHAR_STR */
            description: string;
            /** ID=0x004a | type=UINT16 */
            numberOfStates: number;
            /** ID=0x0051 | type=BOOLEAN */
            outOfService: number;
            /** ID=0x0055 | type=UINT16 */
            presentValue: number;
            /** ID=0x0067 | type=ENUM8 */
            reliability: number;
            /** ID=0x006f | type=BITMAP8 */
            statusFlags: number;
            /** ID=0x0100 | type=UINT32 */
            applicationType: number;
        };
        commands: never;
        commandResponses: never;
    };
    genMultistateOutput: {
        attributes: {
            /** ID=0x000e | type=ARRAY */
            stateText: ZclArray | unknown[];
            /** ID=0x001c | type=CHAR_STR */
            description: string;
            /** ID=0x004a | type=UINT16 */
            numberOfStates: number;
            /** ID=0x0051 | type=BOOLEAN */
            outOfService: number;
            /** ID=0x0055 | type=UINT16 */
            presentValue: number;
            /** ID=0x0057 | type=ARRAY */
            priorityArray: ZclArray | unknown[];
            /** ID=0x0067 | type=ENUM8 */
            reliability: number;
            /** ID=0x0068 | type=UINT16 */
            relinquishDefault: number;
            /** ID=0x006f | type=BITMAP8 */
            statusFlags: number;
            /** ID=0x0100 | type=UINT32 */
            applicationType: number;
        };
        commands: never;
        commandResponses: never;
    };
    genMultistateValue: {
        attributes: {
            /** ID=0x000e | type=ARRAY */
            stateText: ZclArray | unknown[];
            /** ID=0x001c | type=CHAR_STR */
            description: string;
            /** ID=0x004a | type=UINT16 */
            numberOfStates: number;
            /** ID=0x0051 | type=BOOLEAN */
            outOfService: number;
            /** ID=0x0055 | type=UINT16 */
            presentValue: number;
            /** ID=0x0057 | type=ARRAY */
            priorityArray: ZclArray | unknown[];
            /** ID=0x0067 | type=ENUM8 */
            reliability: number;
            /** ID=0x0068 | type=UINT16 */
            relinquishDefault: number;
            /** ID=0x006f | type=BITMAP8 */
            statusFlags: number;
            /** ID=0x0100 | type=UINT32 */
            applicationType: number;
        };
        commands: never;
        commandResponses: never;
    };
    genCommissioning: {
        attributes: {
            /** ID=0x0000 | type=UINT16 | writable=true | required=true | max=65527 */
            shortress: number;
            /** ID=0x0001 | type=IEEE_ADDR | writable=true | required=true | default=18446744073709551616 | special=PANIdUnspecified,ffffffffffffffff */
            extendedPANId: string;
            /** ID=0x0002 | type=UINT16 | writable=true | required=true */
            panId: number;
            /** ID=0x0003 | type=BITMAP32 | writable=true | required=true */
            channelmask: number;
            /** ID=0x0004 | type=UINT8 | writable=true | required=true */
            protocolVersion: number;
            /** ID=0x0005 | type=UINT8 | writable=true | required=true */
            stackProfile: number;
            /** ID=0x0006 | type=ENUM8 | writable=true | required=true */
            startupControl: number;
            /** ID=0x0010 | type=IEEE_ADDR | writable=true | required=true | default=0 | special=AddressUnspecified,0000000000000000 */
            trustCenterress: string;
            /** ID=0x0011 | type=SEC_KEY | writable=true | default=0 */
            trustCenterMasterKey: Buffer;
            /** ID=0x0012 | type=SEC_KEY | writable=true | required=true | default=0 */
            networkKey: Buffer;
            /** ID=0x0013 | type=BOOLEAN | writable=true | required=true | default=0 */
            useInsecureJoin: number;
            /** ID=0x0014 | type=SEC_KEY | writable=true | required=true | default=0 */
            preconfiguredLinkKey: Buffer;
            /** ID=0x0015 | type=UINT8 | writable=true | required=true | default=0 */
            networkKeySeqNum: number;
            /** ID=0x0016 | type=ENUM8 | writable=true | required=true */
            networkKeyType: number;
            /** ID=0x0017 | type=UINT16 | writable=true | required=true | default=0 */
            networkManagerress: number;
            /** ID=0x0020 | type=UINT8 | writable=true | min=1 | default=5 */
            scanAttempts: number;
            /** ID=0x0021 | type=UINT16 | writable=true | min=1 | default=100 */
            timeBetweenScans: number;
            /** ID=0x0022 | type=UINT16 | writable=true | min=1 | default=60 | maxInclusiveRef=maxRejoinInterval */
            rejoinInterval: number;
            /** ID=0x0023 | type=UINT16 | writable=true | min=1 | default=3600 */
            maxRejoinInterval: number;
            /** ID=0x0030 | type=UINT16 | writable=true */
            indirectPollRate: number;
            /** ID=0x0031 | type=UINT8 */
            parentRetryThreshold: number;
            /** ID=0x0040 | type=BOOLEAN | writable=true | default=0 */
            concentratorFlag: number;
            /** ID=0x0041 | type=UINT8 | writable=true | default=15 */
            concentratorRus: number;
            /** ID=0x0042 | type=UINT8 | writable=true | default=0 */
            concentratorDiscoveryTime: number;
        };
        commands: {
            /** ID=0x00 | required=true */
            restartDevice: {
                /** type=UINT8 */
                options: number;
                /** type=UINT8 */
                delay: number;
                /** type=UINT8 */
                jitter: number;
            };
            /** ID=0x01 */
            saveStartupParams: {
                /** type=UINT8 */
                options: number;
                /** type=UINT8 */
                index: number;
            };
            /** ID=0x02 */
            restoreStartupParams: {
                /** type=UINT8 */
                options: number;
                /** type=UINT8 */
                index: number;
            };
            /** ID=0x03 | required=true */
            resetStartupParams: {
                /** type=UINT8 */
                options: number;
                /** type=UINT8 */
                index: number;
            };
        };
        commandResponses: {
            /** ID=0x00 | required=true */
            restartDeviceRsp: {
                /** type=UINT8 */
                status: number;
            };
            /** ID=0x01 | required=true */
            saveStartupParamsRsp: {
                /** type=UINT8 */
                status: number;
            };
            /** ID=0x02 | required=true */
            restoreStartupParamsRsp: {
                /** type=UINT8 */
                status: number;
            };
            /** ID=0x03 | required=true */
            resetStartupParamsRsp: {
                /** type=UINT8 */
                status: number;
            };
        };
    };
    genOta: {
        attributes: {
            /** ID=0x0000 | type=IEEE_ADDR | client=true | required=true | default=18446744073709551615 */
            upgradeServerId: string;
            /** ID=0x0001 | type=UINT32 | client=true | default=4294967294 */
            fileOffset: number;
            /** ID=0x0002 | type=UINT32 | client=true | default=4294967294 */
            currentFileVersion: number;
            /** ID=0x0003 | type=UINT16 | client=true | default=65535 */
            currentZigbeeStackVersion: number;
            /** ID=0x0004 | type=UINT32 | client=true | default=4294967294 */
            downloadedFileVersion: number;
            /** ID=0x0005 | type=UINT16 | client=true | default=65535 */
            downloadedZigbeeStackVersion: number;
            /** ID=0x0006 | type=ENUM8 | client=true | required=true | default=0 */
            imageUpgradeStatus: number;
            /** ID=0x0007 | type=UINT16 | client=true */
            manufacturerId: number;
            /** ID=0x0008 | type=UINT16 | client=true */
            imageTypeId: number;
            /** ID=0x0009 | type=UINT16 | client=true | default=0 */
            minimumBlockReqDelay: number;
            /** ID=0x000a | type=UINT32 | client=true */
            imageStamp: number;
            /** ID=0x000b | type=ENUM8 | client=true | default=0 */
            upgradeActivationPolicy: number;
            /** ID=0x000c | type=ENUM8 | client=true | default=0 */
            upgradeTimeoutPolicy: number;
        };
        commands: {
            /** ID=0x01 | response=2 | required=true */
            queryNextImageRequest: {
                /** type=UINT8 */
                fieldControl: number;
                /** type=UINT16 */
                manufacturerCode: number;
                /** type=UINT16 */
                imageType: number;
                /** type=UINT32 */
                fileVersion: number;
                /** type=UINT16 | conditions=[{bitMaskSet param=fieldControl mask=1}] */
                hardwareVersion?: number;
            };
            /** ID=0x03 | response=5 | required=true */
            imageBlockRequest: {
                /** type=UINT8 */
                fieldControl: number;
                /** type=UINT16 */
                manufacturerCode: number;
                /** type=UINT16 */
                imageType: number;
                /** type=UINT32 */
                fileVersion: number;
                /** type=UINT32 */
                fileOffset: number;
                /** type=UINT8 */
                maximumDataSize: number;
                /** type=IEEE_ADDR | conditions=[{bitMaskSet param=fieldControl mask=1}] */
                requestNodeIeeeAddress?: string;
                /** type=UINT16 | conditions=[{bitMaskSet param=fieldControl mask=2}{minimumRemainingBufferBytes value=2}] */
                minimumBlockPeriod?: number;
            };
            /** ID=0x04 | response=5 */
            imagePageRequest: {
                /** type=UINT8 */
                fieldControl: number;
                /** type=UINT16 */
                manufacturerCode: number;
                /** type=UINT16 */
                imageType: number;
                /** type=UINT32 */
                fileVersion: number;
                /** type=UINT32 */
                fileOffset: number;
                /** type=UINT8 */
                maximumDataSize: number;
                /** type=UINT16 */
                pageSize: number;
                /** type=UINT16 */
                responseSpacing: number;
                /** type=IEEE_ADDR | conditions=[{bitMaskSet param=fieldControl mask=1}] */
                requestNodeIeeeAddress?: string;
            };
            /** ID=0x06 | response=7 | required=true */
            upgradeEndRequest: {
                /** type=UINT8 */
                status: number;
                /** type=UINT16 */
                manufacturerCode: number;
                /** type=UINT16 */
                imageType: number;
                /** type=UINT32 */
                fileVersion: number;
            };
            /** ID=0x08 | response=9 */
            queryDeviceSpecificFileRequest: {
                /** type=IEEE_ADDR */
                eui64: string;
                /** type=UINT16 */
                manufacturerCode: number;
                /** type=UINT16 */
                imageType: number;
                /** type=UINT32 */
                fileVersion: number;
                /** type=UINT16 */
                zigbeeStackVersion: number;
            };
        };
        commandResponses: {
            /** ID=0x00 */
            imageNotify: {
                /** type=UINT8 */
                payloadType: number;
                /** type=UINT8 */
                queryJitter: number;
                /** type=UINT16 | conditions=[{fieldGT field=payloadType value=0}] */
                manufacturerCode?: number;
                /** type=UINT16 | conditions=[{fieldGT field=payloadType value=1}] */
                imageType?: number;
                /** type=UINT32 | conditions=[{fieldGT field=payloadType value=2}] */
                fileVersion?: number;
            };
            /** ID=0x02 | required=true */
            queryNextImageResponse: {
                /** type=UINT8 */
                status: number;
                /** type=UINT16 | conditions=[{fieldEquals field=status value=0}] */
                manufacturerCode?: number;
                /** type=UINT16 | conditions=[{fieldEquals field=status value=0}] */
                imageType?: number;
                /** type=UINT32 | conditions=[{fieldEquals field=status value=0}] */
                fileVersion?: number;
                /** type=UINT32 | conditions=[{fieldEquals field=status value=0}] */
                imageSize?: number;
            };
            /** ID=0x05 | required=true */
            imageBlockResponse: {
                /** type=UINT8 */
                status: number;
                /** type=UINT16 | conditions=[{fieldEquals field=status value=0}] */
                manufacturerCode?: number;
                /** type=UINT16 | conditions=[{fieldEquals field=status value=0}] */
                imageType?: number;
                /** type=UINT32 | conditions=[{fieldEquals field=status value=0}] */
                fileVersion?: number;
                /** type=UINT32 | conditions=[{fieldEquals field=status value=0}] */
                fileOffset?: number;
                /** type=UINT8 | conditions=[{fieldEquals field=status value=0}] */
                dataSize?: number;
                /** type=BUFFER | conditions=[{fieldEquals field=status value=0}] */
                data?: Buffer;
                /** type=UINT32 | conditions=[{fieldEquals field=status value=151}] */
                currentTime?: number;
                /** type=UINT32 | conditions=[{fieldEquals field=status value=151}] */
                requestTime?: number;
                /** type=UINT16 | conditions=[{fieldEquals field=status value=151}] */
                minimumBlockPeriod?: number;
            };
            /** ID=0x07 | required=true */
            upgradeEndResponse: {
                /** type=UINT16 */
                manufacturerCode: number;
                /** type=UINT16 */
                imageType: number;
                /** type=UINT32 */
                fileVersion: number;
                /** type=UINT32 */
                currentTime: number;
                /** type=UINT32 */
                upgradeTime: number;
            };
            /** ID=0x09 */
            queryDeviceSpecificFileResponse: {
                /** type=UINT8 */
                status: number;
                /** type=UINT16 | conditions=[{fieldEquals field=status value=0}] */
                manufacturerCode?: number;
                /** type=UINT16 | conditions=[{fieldEquals field=status value=0}] */
                imageType?: number;
                /** type=UINT32 | conditions=[{fieldEquals field=status value=0}] */
                fileVersion?: number;
                /** type=UINT32 | conditions=[{fieldEquals field=status value=0}] */
                imageSize?: number;
            };
        };
    };
    genPollCtrl: {
        attributes: {
            /** ID=0x0000 | type=UINT32 | writable=true | required=true | max=7208960 | default=14400 */
            checkinInterval: number;
            /** ID=0x0001 | type=UINT32 | required=true | min=4 | max=7208960 | default=20 */
            longPollInterval: number;
            /** ID=0x0002 | type=UINT16 | required=true | min=1 | max=65535 | default=2 */
            shortPollInterval: number;
            /** ID=0x0003 | type=UINT16 | writable=true | required=true | min=1 | max=65535 | default=40 */
            fastPollTimeout: number;
            /** ID=0x0004 | type=UINT32 | default=0 */
            checkinIntervalMin: number;
            /** ID=0x0005 | type=UINT32 | default=0 */
            longPollIntervalMin: number;
            /** ID=0x0006 | type=UINT16 | default=0 */
            fastPollTimeoutMax: number;
        };
        commands: {
            /** ID=0x00 | required=true */
            checkinRsp: {
                /** type=BOOLEAN */
                startFastPolling: number;
                /** type=UINT16 */
                fastPollTimeout: number;
            };
            /** ID=0x01 */
            fastPollStop: Record<string, never>;
            /** ID=0x02 */
            setLongPollInterval: {
                /** type=UINT32 */
                newLongPollInterval: number;
            };
            /** ID=0x03 */
            setShortPollInterval: {
                /** type=UINT16 */
                newShortPollInterval: number;
            };
        };
        commandResponses: {
            /** ID=0x00 | required=true */
            checkin: {
                /** type=BOOLEAN */
                startFastPolling: number;
                /** type=UINT16 */
                fastPollTimeout: number;
            };
            /** ID=0x01 | required=true */
            fastPollStop: Record<string, never>;
            /** ID=0x02 */
            setLongPollInterval: {
                /** type=UINT32 */
                newLongPollInterval: number;
            };
            /** ID=0x03 */
            setShortPollInterval: {
                /** type=UINT16 */
                newShortPollInterval: number;
            };
        };
    };
    greenPower: {
        attributes: never;
        commands: {
            /** ID=0x00 */
            notification: {
                /** type=BITMAP16 */
                options: number;
                /** type=UINT32 | conditions=[{bitFieldEnum param=options offset=0 size=3 value=0}] */
                srcID?: number;
                /** type=IEEE_ADDR | conditions=[{bitFieldEnum param=options offset=0 size=3 value=2}] */
                gpdIEEEAddr?: string;
                /** type=UINT8 | conditions=[{bitFieldEnum param=options offset=0 size=3 value=2}] */
                gpdEndpoint?: number;
                /** type=UINT32 */
                frameCounter: number;
                /** type=UINT8 */
                commandID: number;
                /** type=UINT8 */
                payloadSize: number;
                /** type=GPD_FRAME | conditions=[{bitMaskSet param=options mask=192 reversed=true}] */
                commandFrame?:
                    | Gpd
                    | GpdChannelRequest
                    | GpdAttributeReport
                    | {
                          raw: Buffer;
                      }
                    | Record<string, never>
                    | GpdCommissioningReply
                    | GpdChannelConfiguration
                    | GpdCustomReply;
                /** type=UINT16 | conditions=[{bitMaskSet param=options mask=16384}] */
                gppNwkAddr?: number;
                /** type=BITMAP8 | conditions=[{bitMaskSet param=options mask=16384}] */
                gppGpdLink?: number;
            };
            /** ID=0x04 */
            commissioningNotification: {
                /** type=BITMAP16 */
                options: number;
                /** type=UINT32 | conditions=[{bitFieldEnum param=options offset=0 size=3 value=0}] */
                srcID?: number;
                /** type=IEEE_ADDR | conditions=[{bitFieldEnum param=options offset=0 size=3 value=2}] */
                gpdIEEEAddr?: string;
                /** type=UINT8 | conditions=[{bitFieldEnum param=options offset=0 size=3 value=2}] */
                gpdEndpoint?: number;
                /** type=UINT32 */
                frameCounter: number;
                /** type=UINT8 */
                commandID: number;
                /** type=UINT8 */
                payloadSize: number;
                /** type=GPD_FRAME | conditions=[{bitMaskSet param=options mask=48 reversed=true}{bitMaskSet param=options mask=512 reversed=true}] */
                commandFrame?:
                    | Gpd
                    | GpdChannelRequest
                    | GpdAttributeReport
                    | {
                          raw: Buffer;
                      }
                    | Record<string, never>
                    | GpdCommissioningReply
                    | GpdChannelConfiguration
                    | GpdCustomReply;
                /** type=UINT16 | conditions=[{bitMaskSet param=options mask=2048}] */
                gppNwkAddr?: number;
                /** type=BITMAP8 | conditions=[{bitMaskSet param=options mask=2048}] */
                gppGpdLink?: number;
                /** type=UINT32 | conditions=[{bitMaskSet param=options mask=512}] */
                mic?: number;
            };
        };
        commandResponses: {
            /** ID=0x06 */
            response: {
                /** type=UINT8 */
                options: number;
                /** type=UINT16 */
                tempMaster: number;
                /** type=BITMAP8 */
                tempMasterTx: number;
                /** type=UINT32 | conditions=[{bitFieldEnum param=options offset=0 size=3 value=0}] */
                srcID?: number;
                /** type=IEEE_ADDR | conditions=[{bitFieldEnum param=options offset=0 size=3 value=2}] */
                gpdIEEEAddr?: string;
                /** type=UINT8 | conditions=[{bitFieldEnum param=options offset=0 size=3 value=2}] */
                gpdEndpoint?: number;
                /** type=UINT8 */
                gpdCmd: number;
                /** type=GPD_FRAME */
                gpdPayload:
                    | Gpd
                    | GpdChannelRequest
                    | GpdAttributeReport
                    | {
                          raw: Buffer;
                      }
                    | Record<string, never>
                    | GpdCommissioningReply
                    | GpdChannelConfiguration
                    | GpdCustomReply;
            };
            /** ID=0x01 */
            pairing: {
                /** type=BITMAP24 */
                options: number;
                /** type=UINT32 | conditions=[{bitFieldEnum param=options offset=0 size=3 value=0}] */
                srcID?: number;
                /** type=IEEE_ADDR | conditions=[{bitFieldEnum param=options offset=0 size=3 value=2}] */
                gpdIEEEAddr?: string;
                /** type=UINT8 | conditions=[{bitFieldEnum param=options offset=0 size=3 value=2}] */
                gpdEndpoint?: number;
                /** type=IEEE_ADDR | conditions=[{bitFieldEnum param=options offset=4 size=3 value=6}] */
                sinkIEEEAddr?: string;
                /** type=UINT16 | conditions=[{bitFieldEnum param=options offset=4 size=3 value=6}] */
                sinkNwkAddr?: number;
                /** type=UINT16 | conditions=[{bitFieldEnum param=options offset=4 size=3 value=4}] */
                sinkGroupID?: number;
                /** type=UINT8 | conditions=[{bitMaskSet param=options mask=8}] */
                deviceID?: number;
                /** type=UINT32 | conditions=[{bitMaskSet param=options mask=16384}] */
                frameCounter?: number;
                /** type=SEC_KEY | conditions=[{bitMaskSet param=options mask=32768}] */
                gpdKey?: Buffer;
                /** type=UINT16 | conditions=[{bitMaskSet param=options mask=65536}] */
                assignedAlias?: number;
                /** type=UINT8 | conditions=[{bitMaskSet param=options mask=131072}] */
                groupcastRadius?: number;
            };
            /** ID=0x02 */
            commisioningMode: {
                /** type=BITMAP8 */
                options: number;
                /** type=UINT16 | conditions=[{bitMaskSet param=options mask=2}] */
                commisioningWindow?: number;
                /** type=UINT8 | conditions=[{bitMaskSet param=options mask=16}] */
                channel?: number;
            };
        };
    };
    mobileDeviceCfg: {
        attributes: {
            /** ID=0x0000 | type=UINT16 */
            keepAliveTime: number;
            /** ID=0x0001 | type=UINT16 */
            rejoinTimeout: number;
        };
        commands: never;
        commandResponses: never;
    };
    neighborCleaning: {
        attributes: {
            /** ID=0x0000 | type=UINT16 */
            neighborCleaningTimeout: number;
        };
        commands: never;
        commandResponses: never;
    };
    nearestGateway: {
        attributes: {
            /** ID=0x0000 | type=UINT16 */
            nearestGateway: number;
            /** ID=0x0001 | type=UINT16 */
            newMobileNode: number;
        };
        commands: never;
        commandResponses: never;
    };
    closuresShadeCfg: {
        attributes: {
            /** ID=0x0000 | type=UINT16 | min=1 */
            physicalClosedLimit: number;
            /** ID=0x0001 | type=UINT8 | max=254 */
            motorStepSize: number;
            /** ID=0x0002 | type=BITMAP8 | writable=true | required=true | default=0 */
            status: number;
            /** ID=0x0010 | type=UINT16 | writable=true | required=true | min=1 | default=1 */
            losedLimit: number;
            /** ID=0x0011 | type=ENUM8 | writable=true | required=true | default=0 */
            mode: number;
        };
        commands: never;
        commandResponses: never;
    };
    closuresDoorLock: {
        attributes: {
            /** ID=0x0000 | type=ENUM8 | reportRequired=true | required=true */
            lockState: number;
            /** ID=0x0001 | type=BITMAP16 | required=true */
            lockType: number;
            /** ID=0x0002 | type=BOOLEAN | required=true */
            actuatorEnabled: number;
            /** ID=0x0003 | type=ENUM8 | reportRequired=true */
            doorState: number;
            /** ID=0x0004 | type=UINT32 | writable=true */
            doorOpenEvents: number;
            /** ID=0x0005 | type=UINT32 | writable=true */
            doorClosedEvents: number;
            /** ID=0x0006 | type=UINT16 | writable=true */
            openPeriod: number;
            /** ID=0x0010 | type=UINT16 | default=0 */
            numOfLockRecordsSupported: number;
            /** ID=0x0011 | type=UINT16 | default=0 */
            numOfTotalUsersSupported: number;
            /** ID=0x0012 | type=UINT16 | default=0 */
            numOfPinUsersSupported: number;
            /** ID=0x0013 | type=UINT16 | default=0 */
            numOfRfidUsersSupported: number;
            /** ID=0x0014 | type=UINT8 | default=0 */
            numOfWeekDaySchedulesSupportedPerUser: number;
            /** ID=0x0015 | type=UINT8 | default=0 */
            numOfYearDaySchedulesSupportedPerUser: number;
            /** ID=0x0016 | type=UINT8 | default=0 */
            numOfHolidayScheduledsSupported: number;
            /** ID=0x0017 | type=UINT8 | default=8 */
            maxPinLen: number;
            /** ID=0x0018 | type=UINT8 | default=4 */
            minPinLen: number;
            /** ID=0x0019 | type=UINT8 | default=20 */
            maxRfidLen: number;
            /** ID=0x001a | type=UINT8 | default=8 */
            minRfidLen: number;
            /** ID=0x0020 | type=BOOLEAN | writable=true | writeOptional=true | reportRequired=true | default=0 */
            enableLogging: number;
            /** ID=0x0021 | type=CHAR_STR | writable=true | writeOptional=true | reportRequired=true | default= | length=2 */
            language: string;
            /** ID=0x0022 | type=UINT8 | writable=true | writeOptional=true | reportRequired=true | default=0 */
            ledSettings: number;
            /** ID=0x0023 | type=UINT32 | writable=true | writeOptional=true | reportRequired=true | default=0 | special=Disabled,0 */
            autoRelockTime: number;
            /** ID=0x0024 | type=UINT8 | writable=true | writeOptional=true | reportRequired=true | default=0 */
            soundVolume: number;
            /** ID=0x0025 | type=UINT32 | writable=true | writeOptional=true | reportRequired=true | default=0 */
            operatingMode: number;
            /** ID=0x0026 | type=BITMAP16 | default=1 */
            supportedOperatingModes: number;
            /** ID=0x0027 | type=BITMAP16 | reportRequired=true | default=0 */
            defaultConfigurationRegister: number;
            /** ID=0x0028 | type=BOOLEAN | writable=true | writeOptional=true | reportRequired=true | default=1 */
            enableLocalProgramming: number;
            /** ID=0x0029 | type=BOOLEAN | writable=true | reportRequired=true | default=0 */
            enableOneTouchLocking: number;
            /** ID=0x002a | type=BOOLEAN | writable=true | reportRequired=true | default=0 */
            enableInsideStatusLed: number;
            /** ID=0x002b | type=BOOLEAN | writable=true | reportRequired=true | default=0 */
            enablePrivacyModeButton: number;
            /** ID=0x0030 | type=UINT8 | writable=true | writeOptional=true | reportRequired=true | default=0 */
            wrongCodeEntryLimit: number;
            /** ID=0x0031 | type=UINT8 | writable=true | writeOptional=true | reportRequired=true | default=0 */
            userCodeTemporaryDisableTime: number;
            /** ID=0x0032 | type=BOOLEAN | writable=true | writeOptional=true | reportRequired=true | default=0 */
            sendPinOta: number;
            /** ID=0x0033 | type=BOOLEAN | writable=true | writeOptional=true | reportRequired=true | default=0 */
            requirePinForRfOperation: number;
            /** ID=0x0034 | type=UINT8 | reportRequired=true | default=0 */
            zigbeeSecurityLevel: number;
            /** ID=0x0040 | type=BITMAP16 | writable=true | reportRequired=true | default=0 */
            alarmMask: number;
            /** ID=0x0041 | type=BITMAP16 | writable=true | reportRequired=true | default=0 */
            keypadOperationEventMask: number;
            /** ID=0x0042 | type=BITMAP16 | writable=true | reportRequired=true | default=0 */
            rfOperationEventMask: number;
            /** ID=0x0043 | type=BITMAP16 | writable=true | reportRequired=true | default=0 */
            manualOperationEventMask: number;
            /** ID=0x0044 | type=BITMAP16 | writable=true | reportRequired=true | default=0 */
            rfidOperationEventMask: number;
            /** ID=0x0045 | type=BITMAP16 | writable=true | reportRequired=true | default=0 */
            keypadProgrammingEventMask: number;
            /** ID=0x0046 | type=BITMAP16 | writable=true | reportRequired=true | default=0 */
            rfProgrammingEventMask: number;
            /** ID=0x0047 | type=BITMAP16 | writable=true | reportRequired=true | default=0 */
            rfidProgrammingEventMask: number;
        };
        commands: {
            /** ID=0x00 | response=0 | required=true */
            lockDoor: {
                /** type=CHAR_STR */
                pincodevalue: string;
            };
            /** ID=0x01 | response=1 | required=true */
            unlockDoor: {
                /** type=CHAR_STR */
                pincodevalue: string;
            };
            /** ID=0x02 | response=2 */
            toggleDoor: {
                /** type=CHAR_STR */
                pincodevalue: string;
            };
            /** ID=0x03 | response=3 */
            unlockWithTimeout: {
                /** type=UINT16 */
                timeout: number;
                /** type=CHAR_STR */
                pincodevalue: string;
            };
            /** ID=0x04 | response=4 */
            getLogRecord: {
                /** type=UINT16 | special=MostRecent,0 */
                logindex: number;
            };
            /** ID=0x05 | response=5 */
            setPinCode: {
                /** type=UINT16 */
                userid: number;
                /** type=UINT8 */
                userstatus: number;
                /** type=UINT8 */
                usertype: number;
                /** type=CHAR_STR */
                pincodevalue: string;
            };
            /** ID=0x06 | response=6 */
            getPinCode: {
                /** type=UINT16 */
                userid: number;
            };
            /** ID=0x07 | response=7 */
            clearPinCode: {
                /** type=UINT16 */
                userid: number;
            };
            /** ID=0x08 | response=8 */
            clearAllPinCodes: Record<string, never>;
            /** ID=0x09 | response=9 */
            setUserStatus: {
                /** type=UINT16 */
                userid: number;
                /** type=UINT8 */
                userstatus: number;
            };
            /** ID=0x0a | response=10 */
            getUserStatus: {
                /** type=UINT16 */
                userid: number;
            };
            /** ID=0x0b | response=11 */
            setWeekDaySchedule: {
                /** type=UINT8 */
                scheduleid: number;
                /** type=UINT16 */
                userid: number;
                /** type=UINT8 */
                daysmask: number;
                /** type=UINT8 | minInclusive=0 | maxInclusive=23 */
                starthour: number;
                /** type=UINT8 | minInclusive=0 | maxInclusive=59 */
                startminute: number;
                /** type=UINT8 | minInclusive=0 | maxInclusive=23 */
                endhour: number;
                /** type=UINT8 | minInclusive=0 | maxInclusive=59 */
                endminute: number;
            };
            /** ID=0x0c | response=12 */
            getWeekDaySchedule: {
                /** type=UINT8 */
                scheduleid: number;
                /** type=UINT16 */
                userid: number;
            };
            /** ID=0x0d | response=13 */
            clearWeekDaySchedule: {
                /** type=UINT8 */
                scheduleid: number;
                /** type=UINT16 */
                userid: number;
            };
            /** ID=0x0e | response=14 */
            setYearDaySchedule: {
                /** type=UINT8 */
                scheduleid: number;
                /** type=UINT16 */
                userid: number;
                /** type=UINT32 */
                zigbeelocalstarttime: number;
                /** type=UINT32 | minExclusiveRef=zigbeelocalstarttime */
                zigbeelocalendtime: number;
            };
            /** ID=0x0f | response=15 */
            getYearDaySchedule: {
                /** type=UINT8 */
                scheduleid: number;
                /** type=UINT16 */
                userid: number;
            };
            /** ID=0x10 | response=16 */
            clearYearDaySchedule: {
                /** type=UINT8 */
                scheduleid: number;
                /** type=UINT16 */
                userid: number;
            };
            /** ID=0x11 | response=17 */
            setHolidaySchedule: {
                /** type=UINT8 */
                holidayscheduleid: number;
                /** type=UINT32 */
                zigbeelocalstarttime: number;
                /** type=UINT32 | minExclusiveRef=zigbeelocalstarttime */
                zigbeelocalendtime: number;
                /** type=UINT8 */
                opermodelduringholiday: number;
            };
            /** ID=0x12 | response=18 */
            getHolidaySchedule: {
                /** type=UINT8 */
                holidayscheduleid: number;
            };
            /** ID=0x13 | response=19 */
            clearHolidaySchedule: {
                /** type=UINT8 */
                holidayscheduleid: number;
            };
            /** ID=0x14 | response=20 */
            setUserType: {
                /** type=UINT16 */
                userid: number;
                /** type=UINT8 */
                usertype: number;
            };
            /** ID=0x15 | response=21 */
            getUserType: {
                /** type=UINT16 */
                userid: number;
            };
            /** ID=0x16 | response=22 */
            setRfidCode: {
                /** type=UINT16 */
                userid: number;
                /** type=UINT8 */
                userstatus: number;
                /** type=UINT8 */
                usertype: number;
                /** type=CHAR_STR */
                pincodevalue: string;
            };
            /** ID=0x17 | response=23 */
            getRfidCode: {
                /** type=UINT16 */
                userid: number;
            };
            /** ID=0x18 | response=24 */
            clearRfidCode: {
                /** type=UINT16 */
                userid: number;
            };
            /** ID=0x19 | response=25 */
            clearAllRfidCodes: Record<string, never>;
        };
        commandResponses: {
            /** ID=0x00 | required=true */
            lockDoorRsp: {
                /** type=UINT8 */
                status: number;
            };
            /** ID=0x01 | required=true */
            unlockDoorRsp: {
                /** type=UINT8 */
                status: number;
            };
            /** ID=0x02 */
            toggleDoorRsp: {
                /** type=UINT8 */
                status: number;
            };
            /** ID=0x03 */
            unlockWithTimeoutRsp: {
                /** type=UINT8 */
                status: number;
            };
            /** ID=0x04 */
            getLogRecordRsp: {
                /** type=UINT16 */
                logentryid: number;
                /** type=UINT32 */
                timestamp: number;
                /** type=UINT8 */
                eventtype: number;
                /** type=UINT8 */
                source: number;
                /** type=UINT8 */
                eventidalarmcode: number;
                /** type=UINT16 */
                userid: number;
                /** type=CHAR_STR */
                pincodevalue: string;
            };
            /** ID=0x05 */
            setPinCodeRsp: {
                /** type=UINT8 */
                status: number;
            };
            /** ID=0x06 */
            getPinCodeRsp: {
                /** type=UINT16 */
                userid: number;
                /** type=UINT8 */
                userstatus: number;
                /** type=UINT8 */
                usertype: number;
                /** type=CHAR_STR */
                pincodevalue: string;
            };
            /** ID=0x07 */
            clearPinCodeRsp: {
                /** type=UINT8 */
                status: number;
            };
            /** ID=0x08 */
            clearAllPinCodesRsp: {
                /** type=UINT8 */
                status: number;
            };
            /** ID=0x09 */
            setUserStatusRsp: {
                /** type=UINT8 */
                status: number;
            };
            /** ID=0x0a */
            getUserStatusRsp: {
                /** type=UINT16 */
                userid: number;
                /** type=UINT8 */
                userstatus: number;
            };
            /** ID=0x0b */
            setWeekDayScheduleRsp: {
                /** type=UINT8 */
                status: number;
            };
            /** ID=0x0c */
            getWeekDayScheduleRsp: {
                /** type=UINT8 */
                scheduleid: number;
                /** type=UINT16 */
                userid: number;
                /** type=UINT8 */
                status: number;
                /** type=UINT8 */
                daysmask: number;
                /** type=UINT8 | minInclusive=0 | maxInclusive=23 */
                starthour: number;
                /** type=UINT8 | minInclusive=0 | maxInclusive=59 */
                startminute: number;
                /** type=UINT8 | minInclusive=0 | maxInclusive=23 */
                endhour: number;
                /** type=UINT8 | minInclusive=0 | maxInclusive=59 */
                endminute: number;
            };
            /** ID=0x0d */
            clearWeekDayScheduleRsp: {
                /** type=UINT8 */
                status: number;
            };
            /** ID=0x0e */
            setYearDayScheduleRsp: {
                /** type=UINT8 */
                status: number;
            };
            /** ID=0x0f */
            getYearDayScheduleRsp: {
                /** type=UINT8 */
                scheduleid: number;
                /** type=UINT16 */
                userid: number;
                /** type=UINT8 */
                status: number;
                /** type=UINT32 */
                zigbeelocalstarttime: number;
                /** type=UINT32 | minExclusiveRef=zigbeelocalstarttime */
                zigbeelocalendtime: number;
            };
            /** ID=0x10 */
            clearYearDayScheduleRsp: {
                /** type=UINT8 */
                status: number;
            };
            /** ID=0x11 */
            setHolidayScheduleRsp: {
                /** type=UINT8 */
                status: number;
            };
            /** ID=0x12 */
            getHolidayScheduleRsp: {
                /** type=UINT8 */
                holidayscheduleid: number;
                /** type=UINT8 */
                status: number;
                /** type=UINT32 */
                zigbeelocalstarttime: number;
                /** type=UINT32 | minExclusiveRef=zigbeelocalstarttime */
                zigbeelocalendtime: number;
                /** type=UINT8 */
                opermodelduringholiday: number;
            };
            /** ID=0x13 */
            clearHolidayScheduleRsp: {
                /** type=UINT8 */
                status: number;
            };
            /** ID=0x14 */
            setUserTypeRsp: {
                /** type=UINT8 */
                status: number;
            };
            /** ID=0x15 */
            getUserTypeRsp: {
                /** type=UINT16 */
                userid: number;
                /** type=UINT8 */
                usertype: number;
            };
            /** ID=0x16 */
            setRfidCodeRsp: {
                /** type=UINT8 */
                status: number;
            };
            /** ID=0x17 */
            getRfidCodeRsp: {
                /** type=UINT16 */
                userid: number;
                /** type=UINT8 */
                userstatus: number;
                /** type=UINT8 */
                usertype: number;
                /** type=CHAR_STR */
                pincodevalue: string;
            };
            /** ID=0x18 */
            clearRfidCodeRsp: {
                /** type=UINT8 */
                status: number;
            };
            /** ID=0x19 */
            clearAllRfidCodesRsp: {
                /** type=UINT8 */
                status: number;
            };
            /** ID=0x20 */
            operationEventNotification: {
                /** type=UINT8 */
                opereventsrc: number;
                /** type=UINT8 */
                opereventcode: number;
                /** type=UINT16 */
                userid: number;
                /** type=OCTET_STR */
                pin: Buffer;
                /** type=UINT32 */
                zigbeelocaltime: number;
                /** type=UINT8 */
                data: number;
            };
            /** ID=0x21 */
            programmingEventNotification: {
                /** type=UINT8 */
                programeventsrc: number;
                /** type=UINT8 */
                programeventcode: number;
                /** type=UINT16 */
                userid: number;
                /** type=OCTET_STR */
                pin: Buffer;
                /** type=UINT8 */
                usertype: number;
                /** type=UINT8 */
                userstatus: number;
                /** type=UINT32 */
                zigbeelocaltime: number;
                /** type=UINT8 */
                data: number;
            };
        };
    };
    closuresWindowCovering: {
        attributes: {
            /** ID=0x0000 | type=ENUM8 | required=true | default=0 */
            windowCoveringType: number;
            /** ID=0x0001 | type=UINT16 | default=0 */
            physicalClosedLimitLiftCm: number;
            /** ID=0x0002 | type=UINT16 | default=0 */
            physicalClosedLimitTiltDdegree: number;
            /** ID=0x0003 | type=UINT16 | default=0 */
            currentPositionLiftCm: number;
            /** ID=0x0004 | type=UINT16 | default=0 */
            currentPositionTiltDdegree: number;
            /** ID=0x0005 | type=UINT16 | default=0 */
            numOfActuationsLift: number;
            /** ID=0x0006 | type=UINT16 | default=0 */
            numOfActuationsTilt: number;
            /** ID=0x0007 | type=BITMAP8 | required=true | default=3 */
            configStatus: number;
            /** ID=0x0008 | type=UINT8 | reportRequired=true | sceneRequired=true | max=100 | default=0 */
            currentPositionLiftPercentage: number;
            /** ID=0x0009 | type=UINT8 | reportRequired=true | sceneRequired=true | max=100 | default=0 */
            currentPositionTiltPercentage: number;
            /** ID=0x000a | type=BITMAP8 */
            operationalStatus: number;
            /** ID=0x0010 | type=UINT16 | default=0 */
            installedOpenLimitLiftCm: number;
            /** ID=0x0011 | type=UINT16 | default=65535 */
            installedClosedLimitLiftCm: number;
            /** ID=0x0012 | type=UINT16 | default=0 */
            installedOpenLimitTiltDdegree: number;
            /** ID=0x0013 | type=UINT16 | default=65535 */
            installedClosedLimitTiltDdegree: number;
            /** ID=0x0014 | type=UINT16 | writable=true | default=0 */
            velocityLift: number;
            /** ID=0x0015 | type=UINT16 | writable=true | default=0 */
            accelerationTimeLift: number;
            /** ID=0x0016 | type=UINT16 | writable=true | default=0 */
            decelerationTimeLift: number;
            /** ID=0x0017 | type=BITMAP8 | required=true | default=4 */
            windowCoveringMode: number;
            /** ID=0x0018 | type=OCTET_STR | default=1,0x0000 */
            intermediateSetpointsLift: Buffer;
            /** ID=0x0019 | type=OCTET_STR | default=1,0x0000 */
            intermediateSetpointsTilt: Buffer;
            /** ID=0xe000 | type=UINT16 | manufacturerCode=ADEO(0x1277) */
            elkoDriveCloseDuration?: number;
            /** ID=0xe010 | type=BITMAP8 | manufacturerCode=ADEO(0x1277) */
            elkoProtectionStatus?: number;
            /** ID=0xe012 | type=UINT16 | manufacturerCode=ADEO(0x1277) */
            elkoSunProtectionIlluminanceThreshold?: number;
            /** ID=0xe013 | type=BITMAP8 | manufacturerCode=ADEO(0x1277) */
            elkoProtectionSensor?: number;
            /** ID=0xe014 | type=UINT16 | manufacturerCode=ADEO(0x1277) */
            elkoLiftDriveUpTime?: number;
            /** ID=0xe015 | type=UINT16 | manufacturerCode=ADEO(0x1277) */
            elkoLiftDriveDownTime?: number;
            /** ID=0xe016 | type=UINT16 | manufacturerCode=ADEO(0x1277) */
            elkoTiltOpenCloseAndStepTime?: number;
            /** ID=0xe017 | type=UINT8 | manufacturerCode=ADEO(0x1277) */
            elkoTiltPositionPercentageAfterMoveToLevel?: number;
            /** ID=0xf000 | type=ENUM8 */
            tuyaMovingState: number;
            /** ID=0xf001 | type=ENUM8 */
            tuyaCalibration: number;
            /** ID=0xf001 | type=ENUM8 | manufacturerCode=LEGRAND_GROUP(0x1021) */
            stepPositionLift?: number;
            /** ID=0xf002 | type=ENUM8 */
            tuyaMotorReversal: number;
            /** ID=0xf002 | type=ENUM8 | manufacturerCode=LEGRAND_GROUP(0x1021) */
            calibrationMode?: number;
            /** ID=0xf003 | type=UINT16 */
            moesCalibrationTime: number;
            /** ID=0xf003 | type=ENUM8 | manufacturerCode=LEGRAND_GROUP(0x1021) */
            targetPositionTiltPercentage?: number;
            /** ID=0xf004 | type=ENUM8 | manufacturerCode=LEGRAND_GROUP(0x1021) */
            stepPositionTilt?: number;
            /** ID=0xfcc1 | type=UINT16 | manufacturerCode=NIKO_NV(0x125f) */
            nikoCalibrationTimeUp?: number;
            /** ID=0xfcc2 | type=UINT16 | manufacturerCode=NIKO_NV(0x125f) */
            nikoCalibrationTimeDown?: number;
        };
        commands: {
            /** ID=0x00 | required=true */
            upOpen: Record<string, never>;
            /** ID=0x01 | required=true */
            downClose: Record<string, never>;
            /** ID=0x02 | required=true */
            stop: Record<string, never>;
            /** ID=0x04 */
            goToLiftValue: {
                /** type=UINT16 | minInclusiveRef=installedClosedLimitLiftCm | maxInclusiveRef=installedOpenLimitLiftCm */
                liftvalue: number;
            };
            /** ID=0x05 */
            goToLiftPercentage: {
                /** type=UINT8 | maxInclusive=100 */
                percentageliftvalue: number;
            };
            /** ID=0x07 */
            goToTiltValue: {
                /** type=UINT16 | minInclusiveRef=installedClosedLimitTiltDdegree | maxInclusiveRef=installedOpenLimitTiltDdegree */
                tiltvalue: number;
            };
            /** ID=0x08 */
            goToTiltPercentage: {
                /** type=UINT8 | maxInclusive=100 */
                percentagetiltvalue: number;
            };
            /** ID=0x80 */
            elkoStopOrStepLiftPercentage: {
                /** type=UINT16 */
                direction: number;
                /** type=UINT16 */
                stepvalue: number;
            };
        };
        commandResponses: never;
    };
    barrierControl: {
        attributes: {
            /** ID=0x0001 | type=ENUM8 | reportRequired=true | required=true */
            movingState: number;
            /** ID=0x0002 | type=BITMAP16 | reportRequired=true | required=true */
            safetyStatus: number;
            /** ID=0x0003 | type=BITMAP8 | required=true */
            capabilities: number;
            /** ID=0x0004 | type=UINT16 | writable=true | default=0 */
            openEvents: number;
            /** ID=0x0005 | type=UINT16 | writable=true | default=0 */
            closeEvents: number;
            /** ID=0x0006 | type=UINT16 | writable=true | default=0 */
            commandOpenEvents: number;
            /** ID=0x0007 | type=UINT16 | writable=true | default=0 */
            commandCloseEvents: number;
            /** ID=0x0008 | type=UINT16 | writable=true */
            openPeriod: number;
            /** ID=0x0009 | type=UINT16 | writable=true */
            closePeriod: number;
            /** ID=0x000a | type=UINT8 | reportRequired=true | sceneRequired=true | required=true | max=100 | special=PositionUnknown,FF */
            barrierPosition: number;
        };
        commands: {
            /** ID=0x00 | required=true */
            goToPercent: {
                /** type=UINT8 | minInclusive=0 | maxInclusive=100 */
                percentOpen: number;
            };
            /** ID=0x01 | required=true */
            stop: Record<string, never>;
        };
        commandResponses: never;
    };
    hvacPumpCfgCtrl: {
        attributes: {
            /** ID=0x0000 | type=INT16 | required=true | min=-32767 | max=32767 */
            maxPressure: number;
            /** ID=0x0001 | type=UINT16 | required=true | max=65534 */
            maxSpeed: number;
            /** ID=0x0002 | type=UINT16 | required=true | max=65534 */
            maxFlow: number;
            /** ID=0x0003 | type=INT16 | min=-32767 | max=32767 */
            minConstPressure: number;
            /** ID=0x0004 | type=INT16 | min=-32767 | max=32767 */
            maxConstPressure: number;
            /** ID=0x0005 | type=INT16 | min=-32767 | max=32767 */
            minCompPressure: number;
            /** ID=0x0006 | type=INT16 | min=-32767 | max=32767 */
            maxCompPressure: number;
            /** ID=0x0007 | type=UINT16 | max=65534 */
            minConstSpeed: number;
            /** ID=0x0008 | type=UINT16 | max=65534 */
            maxConstSpeed: number;
            /** ID=0x0009 | type=UINT16 | max=65534 */
            minConstFlow: number;
            /** ID=0x000a | type=UINT16 | max=65534 */
            maxConstFlow: number;
            /** ID=0x000b | type=INT16 | min=-27315 | max=32767 */
            minConstTemp: number;
            /** ID=0x000c | type=INT16 | min=-27315 | max=32767 */
            maxConstTemp: number;
            /** ID=0x0010 | type=BITMAP16 */
            pumpStatus: number;
            /** ID=0x0011 | type=ENUM8 | required=true */
            effectiveOperationMode: number;
            /** ID=0x0012 | type=ENUM8 | required=true */
            effectiveControlMode: number;
            /** ID=0x0013 | type=INT16 | reportRequired=true | required=true | min=0 | max=32767 */
            capacity: number;
            /** ID=0x0014 | type=UINT16 | max=65534 */
            speed: number;
            /** ID=0x0015 | type=UINT24 | writable=true | max=16777214 | default=0 */
            lifetimeRunningHours: number;
            /** ID=0x0016 | type=UINT24 | writable=true | max=16777214 */
            power: number;
            /** ID=0x0017 | type=UINT32 | max=4294967294 | default=0 */
            lifetimeEnergyConsumed: number;
            /** ID=0x0020 | type=ENUM8 | writable=true | required=true | default=0 */
            operationMode: number;
            /** ID=0x0021 | type=ENUM8 | writable=true | default=0 */
            controlMode: number;
            /** ID=0x0022 | type=BITMAP16 */
            alarmMask: number;
        };
        commands: never;
        commandResponses: never;
    };
    hvacThermostat: {
        attributes: {
            /** ID=0x0000 | type=INT16 | reportRequired=true | required=true | min=-27315 | max=32767 */
            localTemp: number;
            /** ID=0x0001 | type=INT16 | min=-27315 | max=32767 */
            outdoorTemp: number;
            /** ID=0x0002 | type=BITMAP8 | default=0 */
            occupancy: number;
            /** ID=0x0003 | type=INT16 | min=-27315 | max=32767 | default=700 */
            absMinHeatSetpointLimit: number;
            /** ID=0x0004 | type=INT16 | min=-27315 | max=32767 | default=3000 */
            absMaxHeatSetpointLimit: number;
            /** ID=0x0005 | type=INT16 | min=-27315 | max=32767 | default=1600 */
            absMinCoolSetpointLimit: number;
            /** ID=0x0006 | type=INT16 | min=-27315 | max=32767 | default=3200 */
            absMaxCoolSetpointLimit: number;
            /** ID=0x0007 | type=UINT8 | reportRequired=true | max=100 */
            pICoolingDemand: number;
            /** ID=0x0008 | type=UINT8 | reportRequired=true | max=100 */
            pIHeatingDemand: number;
            /** ID=0x0009 | type=BITMAP8 | writable=true | default=0 */
            systemTypeConfig: number;
            /** ID=0x0010 | type=INT8 | writable=true | min=-25 | max=25 | default=0 */
            localTemperatureCalibration: number;
            /** ID=0x0011 | type=INT16 | writable=true | sceneRequired=true | default=2600 | minInclusiveRef=minCoolSetpointLimit | maxInclusiveRef=maxCoolSetpointLimit */
            occupiedCoolingSetpoint: number;
            /** ID=0x0012 | type=INT16 | writable=true | sceneRequired=true | default=2000 | minInclusiveRef=minHeatSetpointLimit | maxInclusiveRef=maxHeatSetpointLimit */
            occupiedHeatingSetpoint: number;
            /** ID=0x0013 | type=INT16 | writable=true | default=2600 | minInclusiveRef=minCoolSetpointLimit | maxInclusiveRef=maxCoolSetpointLimit */
            unoccupiedCoolingSetpoint: number;
            /** ID=0x0014 | type=INT16 | writable=true | default=2000 | minInclusiveRef=minHeatSetpointLimit | maxInclusiveRef=maxHeatSetpointLimit */
            unoccupiedHeatingSetpoint: number;
            /** ID=0x0015 | type=INT16 | writable=true | min=-27315 | max=32767 | default=700 */
            minHeatSetpointLimit: number;
            /** ID=0x0016 | type=INT16 | writable=true | min=-27315 | max=32767 | default=3000 */
            maxHeatSetpointLimit: number;
            /** ID=0x0017 | type=INT16 | writable=true | min=-27315 | max=32767 | default=1600 */
            minCoolSetpointLimit: number;
            /** ID=0x0018 | type=INT16 | writable=true | min=-27315 | max=32767 | default=3200 */
            maxCoolSetpointLimit: number;
            /** ID=0x0019 | type=INT8 | writable=true | min=10 | max=25 | default=25 */
            minSetpointDeadBand: number;
            /** ID=0x001a | type=BITMAP8 | writable=true | default=0 */
            remoteSensing: number;
            /** ID=0x001b | type=ENUM8 | writable=true | required=true | default=4 */
            ctrlSeqeOfOper: number;
            /** ID=0x001c | type=ENUM8 | writable=true | required=true | default=1 */
            systemMode: number;
            /** ID=0x001d | type=BITMAP8 | default=0 */
            alarmMask: number;
            /** ID=0x001e | type=ENUM8 | default=0 */
            runningMode: number;
            /** ID=0x0020 | type=ENUM8 */
            startOfWeek: number;
            /** ID=0x0021 | type=UINT8 | max=255 */
            numberOfWeeklyTrans: number;
            /** ID=0x0022 | type=UINT8 | max=255 */
            numberOfDailyTrans: number;
            /** ID=0x0023 | type=ENUM8 | writable=true | default=0 */
            tempSetpointHold: number;
            /** ID=0x0024 | type=UINT16 | writable=true | min=0 | max=1440 | default=65535 */
            tempSetpointHoldDuration: number;
            /** ID=0x0025 | type=BITMAP8 | writable=true | reportRequired=true | default=0 */
            programingOperMode: number;
            /** ID=0x0029 | type=BITMAP16 */
            runningState: number;
            /** ID=0x0030 | type=ENUM8 | default=0 */
            setpointChangeSource: number;
            /** ID=0x0031 | type=INT16 | default=32768 */
            setpointChangeAmount: number;
            /** ID=0x0032 | type=UTC | default=0 */
            setpointChangeSourceTimeStamp: number;
            /** ID=0x0034 | type=UINT8 | writable=true | default=255 | minInclusiveRef=occupiedSetbackMin | maxInclusiveRef=occupiedSetbackMax */
            occupiedSetback: number;
            /** ID=0x0035 | type=UINT8 | default=255 | minInclusive=0 | maxExclusiveRef=occupiedSetbackMax */
            occupiedSetbackMin: number;
            /** ID=0x0036 | type=UINT8 | default=255 | maxInclusive=255 | minExclusiveRef=occupiedSetbackMin */
            occupiedSetbackMax: number;
            /** ID=0x0037 | type=UINT8 | writable=true | default=255 | minInclusiveRef=unoccupiedSetbackMin | maxInclusiveRef=unoccupiedSetbackMax */
            unoccupiedSetback: number;
            /** ID=0x0038 | type=UINT8 | default=255 | minInclusive=0 | maxExclusiveRef=unoccupiedSetbackMax */
            unoccupiedSetbackMin: number;
            /** ID=0x0039 | type=UINT8 | default=255 | maxInclusive=255 | minExclusiveRef=unoccupiedSetbackMin */
            unoccupiedSetbackMax: number;
            /** ID=0x003a | type=UINT8 | writable=true | max=255 | default=255 */
            emergencyHeatDelta: number;
            /** ID=0x0040 | type=ENUM8 | writable=true | default=0 */
            acType: number;
            /** ID=0x0041 | type=UINT16 | writable=true | default=0 */
            acCapacity: number;
            /** ID=0x0042 | type=ENUM8 | writable=true | default=0 */
            acRefrigerantType: number;
            /** ID=0x0043 | type=ENUM8 | writable=true | default=0 */
            acConpressorType: number;
            /** ID=0x0044 | type=BITMAP32 | writable=true | default=0 */
            acErrorCode: number;
            /** ID=0x0045 | type=ENUM8 | writable=true | default=0 */
            acLouverPosition: number;
            /** ID=0x0046 | type=INT16 | min=-27315 | max=32767 */
            acCollTemp: number;
            /** ID=0x0047 | type=ENUM8 | writable=true | default=0 */
            acCapacityFormat: number;
            /** ID=0x0101 | type=UINT16 | manufacturerCode=ASTREL_GROUP_SRL(0x1071) */
            fourNoksHysteresisHigh?: number;
            /** ID=0x0102 | type=UINT16 | manufacturerCode=ASTREL_GROUP_SRL(0x1071) */
            fourNoksHysteresisLow?: number;
            /** ID=0x0400 | type=ENUM8 | manufacturerCode=SINOPE_TECHNOLOGIES(0x119c) */
            SinopeOccupancy?: number;
            /** ID=0x0401 | type=UINT16 */
            elkoLoad: number;
            /** ID=0x0401 | type=UINT16 | manufacturerCode=SINOPE_TECHNOLOGIES(0x119c) */
            SinopeMainCycleOutput?: number;
            /** ID=0x0402 | type=CHAR_STR */
            elkoDisplayText: string;
            /** ID=0x0402 | type=ENUM8 | manufacturerCode=SINOPE_TECHNOLOGIES(0x119c) */
            SinopeBacklight?: number;
            /** ID=0x0403 | type=ENUM8 */
            elkoSensor: number;
            /** ID=0x0404 | type=UINT8 */
            elkoRegulatorTime: number;
            /** ID=0x0404 | type=UINT16 | manufacturerCode=SINOPE_TECHNOLOGIES(0x119c) */
            SinopeAuxCycleOutput?: number;
            /** ID=0x0405 | type=BOOLEAN */
            elkoRegulatorMode: number;
            /** ID=0x0406 | type=BOOLEAN */
            elkoPowerStatus: number;
            /** ID=0x0407 | type=OCTET_STR */
            elkoDateTime: Buffer;
            /** ID=0x0408 | type=UINT16 */
            elkoMeanPower: number;
            /** ID=0x0409 | type=INT16 */
            elkoExternalTemp: number;
            /** ID=0x0411 | type=BOOLEAN */
            elkoNightSwitching: number;
            /** ID=0x0412 | type=BOOLEAN */
            elkoFrostGuard: number;
            /** ID=0x0413 | type=BOOLEAN */
            elkoChildLock: number;
            /** ID=0x0414 | type=UINT8 */
            elkoMaxFloorTemp: number;
            /** ID=0x0415 | type=BOOLEAN */
            elkoRelayState: number;
            /** ID=0x0416 | type=OCTET_STR */
            elkoVersion: Buffer;
            /** ID=0x0417 | type=INT8 */
            elkoCalibration: number;
            /** ID=0x0418 | type=UINT8 */
            elkoLastMessageId: number;
            /** ID=0x0419 | type=UINT8 */
            elkoLastMessageStatus: number;
            /** ID=0x4000 | type=ENUM8 | manufacturerCode=VIESSMANN_ELEKTRONIK_GMBH(0x1221) */
            viessmannWindowOpenInternal?: number;
            /** ID=0x4000 | type=ENUM8 | manufacturerCode=DANFOSS_A_S(0x1246) */
            danfossWindowOpenInternal?: number;
            /** ID=0x4001 | type=INT16 */
            StelproOutdoorTemp: number;
            /** ID=0x4003 | type=BOOLEAN | manufacturerCode=VIESSMANN_ELEKTRONIK_GMBH(0x1221) */
            viessmannWindowOpenForce?: number;
            /** ID=0x4003 | type=BOOLEAN | manufacturerCode=DANFOSS_A_S(0x1246) */
            danfossWindowOpenExternal?: number;
            /** ID=0x4010 | type=ENUM8 | manufacturerCode=DANFOSS_A_S(0x1246) */
            danfossDayOfWeek?: number;
            /** ID=0x4011 | type=UINT16 | manufacturerCode=DANFOSS_A_S(0x1246) */
            danfossTriggerTime?: number;
            /** ID=0x4012 | type=BOOLEAN | manufacturerCode=VIESSMANN_ELEKTRONIK_GMBH(0x1221) */
            viessmannAssemblyMode?: number;
            /** ID=0x4012 | type=BOOLEAN | manufacturerCode=DANFOSS_A_S(0x1246) */
            danfossMountedModeActive?: number;
            /** ID=0x4013 | type=BOOLEAN | manufacturerCode=DANFOSS_A_S(0x1246) */
            danfossMountedModeControl?: number;
            /** ID=0x4014 | type=BOOLEAN | manufacturerCode=DANFOSS_A_S(0x1246) */
            danfossThermostatOrientation?: number;
            /** ID=0x4015 | type=INT16 | manufacturerCode=DANFOSS_A_S(0x1246) */
            danfossExternalMeasuredRoomSensor?: number;
            /** ID=0x4016 | type=BOOLEAN | manufacturerCode=DANFOSS_A_S(0x1246) */
            danfossRadiatorCovered?: number;
            /** ID=0x401c | type=ENUM8 */
            StelproSystemMode: number;
            /** ID=0x4020 | type=UINT8 | manufacturerCode=DANFOSS_A_S(0x1246) */
            danfossAlgorithmScaleFactor?: number;
            /** ID=0x4030 | type=BOOLEAN | manufacturerCode=DANFOSS_A_S(0x1246) */
            danfossHeatAvailable?: number;
            /** ID=0x4031 | type=BOOLEAN | manufacturerCode=DANFOSS_A_S(0x1246) */
            danfossHeatRequired?: number;
            /** ID=0x4032 | type=BOOLEAN | manufacturerCode=DANFOSS_A_S(0x1246) */
            danfossLoadBalancingEnable?: number;
            /** ID=0x4040 | type=INT16 | manufacturerCode=DANFOSS_A_S(0x1246) */
            danfossLoadRoomMean?: number;
            /** ID=0x404a | type=INT16 | manufacturerCode=DANFOSS_A_S(0x1246) */
            danfossLoadEstimate?: number;
            /** ID=0x404b | type=INT8 | manufacturerCode=DANFOSS_A_S(0x1246) */
            danfossRegulationSetpointOffset?: number;
            /** ID=0x404c | type=ENUM8 | manufacturerCode=DANFOSS_A_S(0x1246) */
            danfossAdaptionRunControl?: number;
            /** ID=0x404d | type=BITMAP8 | manufacturerCode=DANFOSS_A_S(0x1246) */
            danfossAdaptionRunStatus?: number;
            /** ID=0x404e | type=BITMAP8 | manufacturerCode=DANFOSS_A_S(0x1246) */
            danfossAdaptionRunSettings?: number;
            /** ID=0x404f | type=BOOLEAN | manufacturerCode=DANFOSS_A_S(0x1246) */
            danfossPreheatStatus?: number;
            /** ID=0x4050 | type=UINT32 | manufacturerCode=DANFOSS_A_S(0x1246) */
            danfossPreheatTime?: number;
            /** ID=0x4051 | type=BOOLEAN | manufacturerCode=DANFOSS_A_S(0x1246) */
            danfossWindowOpenFeatureEnable?: number;
            /** ID=0x4100 | type=BITMAP16 | manufacturerCode=DANFOSS_A_S(0x1246) */
            danfossRoomStatusCode?: number;
            /** ID=0x4110 | type=ENUM8 | manufacturerCode=DANFOSS_A_S(0x1246) */
            danfossOutputStatus?: number;
            /** ID=0x4120 | type=ENUM8 | manufacturerCode=DANFOSS_A_S(0x1246) */
            danfossRoomFloorSensorMode?: number;
            /** ID=0x4121 | type=INT16 | manufacturerCode=DANFOSS_A_S(0x1246) */
            danfossFloorMinSetpoint?: number;
            /** ID=0x4122 | type=INT16 | manufacturerCode=DANFOSS_A_S(0x1246) */
            danfossFloorMaxSetpoint?: number;
            /** ID=0x4130 | type=ENUM8 | manufacturerCode=DANFOSS_A_S(0x1246) */
            danfossScheduleTypeUsed?: number;
            /** ID=0x4131 | type=ENUM8 | manufacturerCode=DANFOSS_A_S(0x1246) */
            danfossIcon2PreHeat?: number;
            /** ID=0x414f | type=ENUM8 | manufacturerCode=DANFOSS_A_S(0x1246) */
            danfossIcon2PreHeatStatus?: number;
            /** ID=0xe110 | type=ENUM8 | manufacturerCode=SCHNEIDER_ELECTRIC(0x105e) */
            schneiderWiserSpecific?: number;
        };
        commands: {
            /** ID=0x00 | required=true */
            setpointRaiseLower: {
                /** type=UINT8 */
                mode: number;
                /** type=INT8 */
                amount: number;
            };
            /** ID=0x01 */
            setWeeklySchedule: {
                /** type=UINT8 | minInclusive=0 | maxInclusive=10 */
                numoftrans: number;
                /** type=UINT8 */
                dayofweek: number;
                /** type=UINT8 */
                mode: number;
                /** type=LIST_THERMO_TRANSITIONS | arrayLengthField=numoftrans */
                transitions: ThermoTransition[];
            };
            /** ID=0x02 | response=0 */
            getWeeklySchedule: {
                /** type=UINT8 */
                daystoreturn: number;
                /** type=UINT8 */
                modetoreturn: number;
            };
            /** ID=0x03 */
            clearWeeklySchedule: Record<string, never>;
            /** ID=0x04 | response=1 */
            getRelayStatusLog: Record<string, never>;
            /** ID=0x40 */
            danfossSetpointCommand: {
                /** type=ENUM8 */
                setpointType: number;
                /** type=INT16 */
                setpoint: number;
            };
            /** ID=0x80 */
            schneiderWiserThermostatBoost: {
                /** type=ENUM8 */
                command: number;
                /** type=ENUM8 */
                enable: number;
                /** type=UINT16 */
                temperature: number;
                /** type=UINT16 */
                duration: number;
            };
            /** ID=0xa0 */
            plugwiseCalibrateValve: Record<string, never>;
            /** ID=0xe0 */
            wiserSmartSetSetpoint: {
                /** type=UINT8 */
                operatingmode: number;
                /** type=UINT8 */
                zonemode: number;
                /** type=INT16 */
                setpoint: number;
                /** type=UINT8 */
                reserved: number;
            };
            /** ID=0xe1 */
            wiserSmartSetFipMode: {
                /** type=UINT8 */
                zonemode: number;
                /** type=ENUM8 */
                fipmode: number;
                /** type=UINT8 */
                reserved: number;
            };
            /** ID=0xe2 */
            wiserSmartCalibrateValve: Record<string, never>;
        };
        commandResponses: {
            /** ID=0x00 */
            getWeeklyScheduleRsp: {
                /** type=UINT8 | minInclusive=0 | maxInclusive=10 */
                numoftrans: number;
                /** type=UINT8 */
                dayofweek: number;
                /** type=UINT8 */
                mode: number;
                /** type=LIST_THERMO_TRANSITIONS | arrayLengthField=numoftrans */
                transitions: ThermoTransition[];
            };
            /** ID=0x01 */
            getRelayStatusLogRsp: {
                /** type=UINT16 */
                timeofday: number;
                /** type=UINT16 */
                relaystatus: number;
                /** type=UINT16 */
                localtemp: number;
                /** type=UINT8 */
                humidity: number;
                /** type=UINT16 */
                setpoint: number;
                /** type=UINT16 */
                unreadentries: number;
            };
        };
    };
    hvacFanCtrl: {
        attributes: {
            /** ID=0x0000 | type=ENUM8 | writable=true | required=true | default=5 */
            fanMode: number;
            /** ID=0x0001 | type=ENUM8 | writable=true | required=true | default=2 */
            fanModeSequence: number;
        };
        commands: never;
        commandResponses: never;
    };
    hvacDehumidificationCtrl: {
        attributes: {
            /** ID=0x0000 | type=UINT8 | max=100 */
            relativeHumidity: number;
            /** ID=0x0001 | type=UINT8 | reportRequired=true | required=true | maxInclusiveRef=dehumidMaxCool */
            dehumidCooling: number;
            /** ID=0x0010 | type=UINT8 | writable=true | required=true | min=30 | max=100 | default=50 */
            rhDehumidSetpoint: number;
            /** ID=0x0011 | type=ENUM8 | writable=true | default=0 */
            relativeHumidityMode: number;
            /** ID=0x0012 | type=ENUM8 | writable=true | default=1 */
            dehumidLockout: number;
            /** ID=0x0013 | type=UINT8 | writable=true | required=true | min=2 | max=20 | default=2 */
            dehumidHysteresis: number;
            /** ID=0x0014 | type=UINT8 | writable=true | required=true | min=20 | max=100 | default=20 */
            dehumidMaxCool: number;
            /** ID=0x0015 | type=ENUM8 | writable=true | default=0 */
            relativeHumidDisplay: number;
        };
        commands: never;
        commandResponses: never;
    };
    hvacUserInterfaceCfg: {
        attributes: {
            /** ID=0x0000 | type=ENUM8 | writable=true | required=true | default=0 */
            tempDisplayMode: number;
            /** ID=0x0001 | type=ENUM8 | writable=true | required=true | default=0 */
            keypadLockout: number;
            /** ID=0x0002 | type=ENUM8 | writable=true | default=0 */
            programmingVisibility: number;
            /** ID=0x4000 | type=ENUM8 | manufacturerCode=DANFOSS_A_S(0x1246) */
            danfossViewingDirection?: number;
        };
        commands: never;
        commandResponses: never;
    };
    lightingColorCtrl: {
        attributes: {
            /** ID=0x0000 | type=UINT8 | reportRequired=true | max=254 | default=0 */
            currentHue: number;
            /** ID=0x0001 | type=UINT8 | reportRequired=true | sceneRequired=true | max=254 | default=0 */
            currentSaturation: number;
            /** ID=0x0002 | type=UINT16 | max=65534 | default=0 */
            remainingTime: number;
            /** ID=0x0003 | type=UINT16 | reportRequired=true | sceneRequired=true | max=65279 | default=24939 */
            currentX: number;
            /** ID=0x0004 | type=UINT16 | reportRequired=true | sceneRequired=true | max=65279 | default=24701 */
            currentY: number;
            /** ID=0x0005 | type=ENUM8 */
            driftCompensation: number;
            /** ID=0x0006 | type=CHAR_STR | maxLength=254 */
            compensationText: string;
            /** ID=0x0007 | type=UINT16 | reportRequired=true | sceneRequired=true | max=65279 | default=250 | minInclusiveRef=colorTempPhysicalMin | maxInclusiveRef=colorTempPhysicalMax | special=Undefined,0000 */
            colorTemperature: number;
            /** ID=0x0008 | type=ENUM8 | required=true | default=1 */
            colorMode: number;
            /** ID=0x000f | type=BITMAP8 | writable=true | required=true | default=0 */
            options: number;
            /** ID=0x0010 | type=UINT8 | required=true | max=6 */
            numPrimaries: number;
            /** ID=0x0011 | type=UINT16 | max=65279 */
            primary1X: number;
            /** ID=0x0012 | type=UINT16 | max=65279 */
            primary1Y: number;
            /** ID=0x0013 | type=UINT8 | max=255 */
            primary1Intensity: number;
            /** ID=0x0015 | type=UINT16 | max=65279 */
            primary2X: number;
            /** ID=0x0016 | type=UINT16 | max=65279 */
            primary2Y: number;
            /** ID=0x0017 | type=UINT8 */
            primary2Intensity: number;
            /** ID=0x0019 | type=UINT16 | max=65279 */
            primary3X: number;
            /** ID=0x001a | type=UINT16 | max=65279 */
            primary3Y: number;
            /** ID=0x001b | type=UINT8 | max=255 */
            primary3Intensity: number;
            /** ID=0x0020 | type=UINT16 | max=65279 */
            primary4X: number;
            /** ID=0x0021 | type=UINT16 | max=65279 */
            primary4Y: number;
            /** ID=0x0022 | type=UINT8 | max=255 */
            primary4Intensity: number;
            /** ID=0x0024 | type=UINT16 | max=65279 */
            primary5X: number;
            /** ID=0x0025 | type=UINT16 | max=65279 */
            primary5Y: number;
            /** ID=0x0026 | type=UINT8 | max=255 */
            primary5Intensity: number;
            /** ID=0x0028 | type=UINT16 | max=65279 */
            primary6X: number;
            /** ID=0x0029 | type=UINT16 | max=65279 */
            primary6Y: number;
            /** ID=0x002a | type=UINT8 | max=255 */
            primary6Intensity: number;
            /** ID=0x0030 | type=UINT16 | writable=true | max=65279 */
            whitePointX: number;
            /** ID=0x0031 | type=UINT16 | writable=true | max=65279 */
            whitePointY: number;
            /** ID=0x0032 | type=UINT16 | writable=true | max=65279 */
            colorPointRX: number;
            /** ID=0x0033 | type=UINT16 | writable=true | max=65279 */
            colorPointRY: number;
            /** ID=0x0034 | type=UINT8 | writable=true | max=255 */
            colorPointRIntensity: number;
            /** ID=0x0036 | type=UINT16 | writable=true | max=65279 */
            colorPointGX: number;
            /** ID=0x0037 | type=UINT16 | writable=true | max=65279 */
            colorPointGY: number;
            /** ID=0x0038 | type=UINT8 | writable=true | max=255 */
            colorPointGIntensity: number;
            /** ID=0x003a | type=UINT16 | writable=true | max=65279 */
            colorPointBX: number;
            /** ID=0x003b | type=UINT16 | writable=true | max=65279 */
            colorPointBY: number;
            /** ID=0x003c | type=UINT8 | writable=true | max=255 */
            colorPointBIntensity: number;
            /** ID=0x4000 | type=UINT16 | sceneRequired=true | max=65535 | default=0 */
            enhancedCurrentHue: number;
            /** ID=0x4001 | type=ENUM8 | required=true | default=1 */
            enhancedColorMode: number;
            /** ID=0x4002 | type=UINT8 | sceneRequired=true | max=255 | default=0 */
            colorLoopActive: number;
            /** ID=0x4003 | type=UINT8 | sceneRequired=true | max=255 | default=0 */
            colorLoopDirection: number;
            /** ID=0x4004 | type=UINT16 | sceneRequired=true | max=65535 | default=25 */
            colorLoopTime: number;
            /** ID=0x4005 | type=UINT16 | max=65535 | default=8960 */
            colorLoopStartEnhancedHue: number;
            /** ID=0x4006 | type=UINT16 | max=65535 | default=0 */
            colorLoopStoredEnhancedHue: number;
            /** ID=0x400a | type=UINT16 | required=true | default=0 */
            colorCapabilities: number;
            /** ID=0x400b | type=UINT16 | max=65279 | default=0 | maxInclusiveRef=colorTempPhysicalMax */
            colorTempPhysicalMin: number;
            /** ID=0x400c | type=UINT16 | max=65279 | default=65279 | minInclusiveRef=colorTempPhysicalMin */
            colorTempPhysicalMax: number;
            /** ID=0x400d | type=UINT16 | minInclusiveRef=colorTempPhysicalMin | maxInclusiveRef=colorTemperature */
            coupleColorTempToLevelMin: number;
            /** ID=0x4010 | type=UINT16 | writable=true | max=65279 | special=SetColorTempToPreviousValue,ffff */
            startUpColorTemperature: number;
            /** ID=0xf000 | type=UINT8 */
            tuyaRgbMode: number;
            /** ID=0xf001 | type=UINT8 */
            tuyaBrightness: number;
        };
        commands: {
            /** ID=0x00 */
            moveToHue: {
                /** type=UINT8 */
                hue: number;
                /** type=UINT8 */
                direction: number;
                /** type=UINT16 */
                transtime: number;
                /** type=BITMAP8 */
                optionsMask: number;
                /** type=BITMAP8 */
                optionsOverride: number;
            };
            /** ID=0x01 */
            moveHue: {
                /** type=UINT8 */
                movemode: number;
                /** type=UINT8 */
                rate: number;
                /** type=BITMAP8 */
                optionsMask: number;
                /** type=BITMAP8 */
                optionsOverride: number;
            };
            /** ID=0x02 */
            stepHue: {
                /** type=UINT8 */
                stepmode: number;
                /** type=UINT8 */
                stepsize: number;
                /** type=UINT8 */
                transtime: number;
                /** type=BITMAP8 */
                optionsMask: number;
                /** type=BITMAP8 */
                optionsOverride: number;
            };
            /** ID=0x03 */
            moveToSaturation: {
                /** type=UINT8 */
                saturation: number;
                /** type=UINT16 */
                transtime: number;
                /** type=BITMAP8 */
                optionsMask: number;
                /** type=BITMAP8 */
                optionsOverride: number;
            };
            /** ID=0x04 */
            moveSaturation: {
                /** type=UINT8 */
                movemode: number;
                /** type=UINT8 */
                rate: number;
                /** type=BITMAP8 */
                optionsMask: number;
                /** type=BITMAP8 */
                optionsOverride: number;
            };
            /** ID=0x05 */
            stepSaturation: {
                /** type=UINT8 */
                stepmode: number;
                /** type=UINT8 */
                stepsize: number;
                /** type=UINT8 */
                transtime: number;
                /** type=BITMAP8 */
                optionsMask: number;
                /** type=BITMAP8 */
                optionsOverride: number;
            };
            /** ID=0x06 */
            moveToHueAndSaturation: {
                /** type=UINT8 */
                hue: number;
                /** type=UINT8 */
                saturation: number;
                /** type=UINT16 */
                transtime: number;
                /** type=BITMAP8 */
                optionsMask: number;
                /** type=BITMAP8 */
                optionsOverride: number;
            };
            /** ID=0x06 */
            tuyaMoveToHueAndSaturationBrightness: {
                /** type=UINT8 */
                hue: number;
                /** type=UINT8 */
                saturation: number;
                /** type=UINT16 */
                transtime: number;
                /** type=UINT8 */
                brightness: number;
            };
            /** ID=0x07 */
            moveToColor: {
                /** type=UINT16 */
                colorx: number;
                /** type=UINT16 */
                colory: number;
                /** type=UINT16 */
                transtime: number;
                /** type=BITMAP8 */
                optionsMask: number;
                /** type=BITMAP8 */
                optionsOverride: number;
            };
            /** ID=0x08 */
            moveColor: {
                /** type=INT16 */
                ratex: number;
                /** type=INT16 */
                ratey: number;
                /** type=BITMAP8 */
                optionsMask: number;
                /** type=BITMAP8 */
                optionsOverride: number;
            };
            /** ID=0x09 */
            stepColor: {
                /** type=INT16 */
                stepx: number;
                /** type=INT16 */
                stepy: number;
                /** type=UINT16 */
                transtime: number;
                /** type=BITMAP8 */
                optionsMask: number;
                /** type=BITMAP8 */
                optionsOverride: number;
            };
            /** ID=0x0a */
            moveToColorTemp: {
                /** type=UINT16 */
                colortemp: number;
                /** type=UINT16 */
                transtime: number;
                /** type=BITMAP8 */
                optionsMask: number;
                /** type=BITMAP8 */
                optionsOverride: number;
            };
            /** ID=0x40 */
            enhancedMoveToHue: {
                /** type=UINT16 */
                enhancehue: number;
                /** type=UINT8 */
                direction: number;
                /** type=UINT16 */
                transtime: number;
                /** type=BITMAP8 */
                optionsMask: number;
                /** type=BITMAP8 */
                optionsOverride: number;
            };
            /** ID=0x41 */
            enhancedMoveHue: {
                /** type=UINT8 */
                movemode: number;
                /** type=UINT16 */
                rate: number;
                /** type=BITMAP8 */
                optionsMask: number;
                /** type=BITMAP8 */
                optionsOverride: number;
            };
            /** ID=0x42 */
            enhancedStepHue: {
                /** type=UINT8 */
                stepmode: number;
                /** type=UINT16 */
                stepsize: number;
                /** type=UINT16 */
                transtime: number;
                /** type=BITMAP8 */
                optionsMask: number;
                /** type=BITMAP8 */
                optionsOverride: number;
            };
            /** ID=0x43 */
            enhancedMoveToHueAndSaturation: {
                /** type=UINT16 */
                enhancehue: number;
                /** type=UINT8 */
                saturation: number;
                /** type=UINT16 */
                transtime: number;
                /** type=BITMAP8 */
                optionsMask: number;
                /** type=BITMAP8 */
                optionsOverride: number;
            };
            /** ID=0x44 */
            colorLoopSet: {
                /** type=UINT8 */
                updateflags: number;
                /** type=UINT8 */
                action: number;
                /** type=UINT8 */
                direction: number;
                /** type=UINT16 */
                time: number;
                /** type=UINT16 */
                starthue: number;
                /** type=BITMAP8 */
                optionsMask: number;
                /** type=BITMAP8 */
                optionsOverride: number;
            };
            /** ID=0x47 | required=true */
            stopMoveStep: {
                /** type=UINT8 */
                bits: number;
                /** type=UINT8 */
                bytee: number;
                /** type=UINT8 */
                action: number;
                /** type=UINT8 */
                direction: number;
                /** type=UINT16 */
                time: number;
                /** type=UINT16 */
                starthue: number;
            };
            /** ID=0x4b */
            moveColorTemp: {
                /** type=UINT8 */
                movemode: number;
                /** type=UINT16 */
                rate: number;
                /** type=UINT16 */
                minimum: number;
                /** type=UINT16 */
                maximum: number;
                /** type=BITMAP8 */
                optionsMask: number;
                /** type=BITMAP8 */
                optionsOverride: number;
            };
            /** ID=0x4c */
            stepColorTemp: {
                /** type=UINT8 */
                stepmode: number;
                /** type=UINT16 */
                stepsize: number;
                /** type=UINT16 */
                transtime: number;
                /** type=UINT16 */
                minimum: number;
                /** type=UINT16 */
                maximum: number;
                /** type=BITMAP8 */
                optionsMask: number;
                /** type=BITMAP8 */
                optionsOverride: number;
            };
            /** ID=0xe0 */
            tuyaSetMinimumBrightness: {
                /** type=UINT16 */
                minimum: number;
            };
            /** ID=0xe1 */
            tuyaMoveToHueAndSaturationBrightness2: {
                /** type=UINT16 */
                hue: number;
                /** type=UINT16 */
                saturation: number;
                /** type=UINT16 */
                brightness: number;
            };
            /** ID=0xf0 */
            tuyaRgbMode: {
                /** type=UINT8 */
                enable: number;
            };
            /** ID=0xf9 */
            tuyaOnStartUp: {
                /** type=UINT16 */
                mode: number;
                /** type=LIST_UINT8 */
                data: number[];
            };
            /** ID=0xfa */
            tuyaDoNotDisturb: {
                /** type=UINT8 */
                enable: number;
            };
            /** ID=0xfb */
            tuyaOnOffTransitionTime: {
                /** type=UINT8 */
                unknown: number;
                /** type=BIG_ENDIAN_UINT24 */
                onTransitionTime: number;
                /** type=BIG_ENDIAN_UINT24 */
                offTransitionTime: number;
            };
        };
        commandResponses: never;
    };
    lightingBallastCfg: {
        attributes: {
            /** ID=0x0000 | type=UINT8 | required=true | min=1 | max=254 | default=1 */
            physicalMinLevel: number;
            /** ID=0x0001 | type=UINT8 | required=true | min=1 | max=254 | default=254 */
            physicalMaxLevel: number;
            /** ID=0x0002 | type=BITMAP8 | default=0 */
            ballastStatus: number;
            /** ID=0x0010 | type=UINT8 | writable=true | required=true | min=1 | max=254 | defaultRef=physicalMinLevel | minInclusiveRef=physicalMinLevel | maxInclusiveRef=maxLevel */
            minLevel: number;
            /** ID=0x0011 | type=UINT8 | writable=true | required=true | min=1 | max=254 | defaultRef=physicalMaxLevel | minInclusiveRef=minLevel | maxInclusiveRef=physicalMaxLevel */
            maxLevel: number;
            /** ID=0x0012 | type=UINT8 | writable=true | max=254 | defaultRef=physicalMaxLevel */
            powerOnLevel: number;
            /** ID=0x0013 | type=UINT16 | writable=true | max=65534 | default=0 */
            powerOnFadeTime: number;
            /** ID=0x0014 | type=UINT8 | writable=true | max=254 */
            intrinsicBallastFactor: number;
            /** ID=0x0015 | type=UINT8 | writable=true | min=100 | default=255 */
            ballastFactorAdjustment: number;
            /** ID=0x0020 | type=UINT8 | max=254 */
            lampQuantity: number;
            /** ID=0x0030 | type=CHAR_STR | writable=true | default= | maxLength=16 */
            lampType: string;
            /** ID=0x0031 | type=CHAR_STR | writable=true | default= | maxLength=16 */
            lampManufacturer: string;
            /** ID=0x0032 | type=UINT24 | writable=true | max=16777214 | default=16777215 */
            lampRatedHours: number;
            /** ID=0x0033 | type=UINT24 | writable=true | max=16777214 | default=0 */
            lampBurnHours: number;
            /** ID=0x0034 | type=BITMAP8 | writable=true | default=0 */
            lampAlarmMode: number;
            /** ID=0x0035 | type=UINT24 | writable=true | max=16777214 | default=16777215 */
            lampBurnHoursTripPoint: number;
            /** ID=0xe000 | type=ENUM8 | manufacturerCode=ADEO(0x1277) */
            elkoControlMode?: number;
            /** ID=0xe000 | type=ENUM8 | manufacturerCode=SCHNEIDER_ELECTRIC(0x105e) */
            wiserControlMode?: number;
        };
        commands: never;
        commandResponses: never;
    };
    msIlluminanceMeasurement: {
        attributes: {
            /** ID=0x0000 | type=UINT16 | reportRequired=true | required=true | max=65535 | default=0 */
            measuredValue: number;
            /** ID=0x0001 | type=UINT16 | required=true | min=1 | max=65533 | maxExclusiveRef=maxMeasuredValue */
            minMeasuredValue: number;
            /** ID=0x0002 | type=UINT16 | required=true | min=2 | max=65534 | minExclusiveRef=minMeasuredValue */
            maxMeasuredValue: number;
            /** ID=0x0003 | type=UINT16 | max=2048 */
            tolerance: number;
            /** ID=0x0004 | type=ENUM8 | default=255 */
            lightSensorType: number;
        };
        commands: never;
        commandResponses: never;
    };
    msIlluminanceLevelSensing: {
        attributes: {
            /** ID=0x0000 | type=ENUM8 | reportRequired=true | required=true */
            levelStatus: number;
            /** ID=0x0001 | type=ENUM8 */
            lightSensorType: number;
            /** ID=0x0010 | type=UINT16 | writable=true | required=true | max=65534 */
            illuminanceTargetLevel: number;
        };
        commands: never;
        commandResponses: never;
    };
    msTemperatureMeasurement: {
        attributes: {
            /** ID=0x0000 | type=INT16 | reportRequired=true | required=true | default=-32768 | minInclusiveRef=minMeasuredValue | maxInclusiveRef=maxMeasuredValue */
            measuredValue: number;
            /** ID=0x0001 | type=INT16 | required=true | min=-27315 | max=32766 | default=-32768 | maxExclusiveRef=maxMeasuredValue */
            minMeasuredValue: number;
            /** ID=0x0002 | type=INT16 | required=true | min=-27314 | max=32767 | default=-32768 | minExclusiveRef=minMeasuredValue */
            maxMeasuredValue: number;
            /** ID=0x0003 | type=UINT16 | max=2048 */
            tolerance: number;
            /** ID=0x0010 | type=UNKNOWN */
            minPercentChange: never;
            /** ID=0x0011 | type=UNKNOWN */
            minAbsoluteChange: never;
            /** ID=0x6600 | type=INT16 | manufacturerCode=CUSTOM_SPRUT_DEVICE(0x6666) */
            sprutTemperatureOffset?: number;
        };
        commands: never;
        commandResponses: never;
    };
    msPressureMeasurement: {
        attributes: {
            /** ID=0x0000 | type=INT16 | reportRequired=true | required=true | default=-32768 | minInclusiveRef=minMeasuredValue | maxInclusiveRef=maxMeasuredValue */
            measuredValue: number;
            /** ID=0x0001 | type=INT16 | required=true | min=-32767 | max=32766 | default=-32768 | maxExclusiveRef=maxMeasuredValue */
            minMeasuredValue: number;
            /** ID=0x0002 | type=INT16 | required=true | min=-32766 | max=32767 | default=-32768 | minExclusiveRef=minMeasuredValue */
            maxMeasuredValue: number;
            /** ID=0x0003 | type=UINT16 | max=2048 */
            tolerance: number;
            /** ID=0x0010 | type=INT16 | default=0 | minInclusiveRef=minScaledValue | maxInclusiveRef=maxScaledValue */
            scaledValue: number;
            /** ID=0x0011 | type=INT16 | min=-32767 | max=32766 | default=-32768 | maxExclusiveRef=maxScaledValue */
            minScaledValue: number;
            /** ID=0x0012 | type=INT16 | min=-32766 | max=32767 | default=-32768 | minExclusiveRef=minScaledValue */
            maxScaledValue: number;
            /** ID=0x0013 | type=UINT16 | max=2048 */
            scaledTolerance: number;
            /** ID=0x0014 | type=INT8 | min=-127 | max=127 */
            scale: number;
        };
        commands: never;
        commandResponses: never;
    };
    msFlowMeasurement: {
        attributes: {
            /** ID=0x0000 | type=UINT16 | reportRequired=true | required=true | default=65535 | minInclusiveRef=minMeasuredValue | maxInclusiveRef=maxMeasuredValue */
            measuredValue: number;
            /** ID=0x0001 | type=UINT16 | required=true | max=65533 | default=65535 | maxExclusiveRef=maxMeasuredValue */
            minMeasuredValue: number;
            /** ID=0x0002 | type=UINT16 | required=true | min=1 | max=65534 | default=65535 | minExclusiveRef=minMeasuredValue */
            maxMeasuredValue: number;
            /** ID=0x0003 | type=UINT16 | max=2048 */
            tolerance: number;
        };
        commands: never;
        commandResponses: never;
    };
    msRelativeHumidity: {
        attributes: {
            /** ID=0x0000 | type=UINT16 | reportRequired=true | required=true | default=65535 | minInclusiveRef=minMeasuredValue | maxInclusiveRef=maxMeasuredValue */
            measuredValue: number;
            /** ID=0x0001 | type=UINT16 | required=true | max=9999 | default=65535 | maxExclusiveRef=maxMeasuredValue */
            minMeasuredValue: number;
            /** ID=0x0002 | type=UINT16 | required=true | min=1 | max=10000 | default=65535 | minExclusiveRef=minMeasuredValue */
            maxMeasuredValue: number;
            /** ID=0x0003 | type=UINT16 | max=2048 */
            tolerance: number;
            /** ID=0x6600 | type=BOOLEAN | manufacturerCode=CUSTOM_SPRUT_DEVICE(0x6666) */
            sprutHeater?: number;
        };
        commands: never;
        commandResponses: never;
    };
    msOccupancySensing: {
        attributes: {
            /** ID=0x0000 | type=BITMAP8 | reportRequired=true | required=true */
            occupancy: number;
            /** ID=0x0001 | type=ENUM8 | required=true | default=0 */
            occupancySensorType: number;
            /** ID=0x0002 | type=BITMAP8 | required=true */
            occupancySensorTypeBitmap: number;
            /** ID=0x0010 | type=UINT16 | writable=true | max=65534 | default=0 */
            pirOToUDelay: number;
            /** ID=0x0011 | type=UINT16 | writable=true | max=65534 | default=0 */
            pirUToODelay: number;
            /** ID=0x0012 | type=UINT8 | writable=true | min=1 | max=254 | default=1 */
            pirUToOThreshold: number;
            /** ID=0x0020 | type=UINT16 | writable=true | max=65534 | default=0 */
            ultrasonicOToUDelay: number;
            /** ID=0x0021 | type=UINT16 | writable=true | max=65534 | default=0 */
            ultrasonicUToODelay: number;
            /** ID=0x0022 | type=UINT8 | writable=true | min=1 | max=254 | default=1 */
            ultrasonicUToOThreshold: number;
            /** ID=0x0030 | type=UINT16 | writable=true | max=65534 | default=0 */
            contactOToUDelay: number;
            /** ID=0x0031 | type=UINT16 | writable=true | max=65534 | default=0 */
            contactUToODelay: number;
            /** ID=0x0032 | type=UINT8 | writable=true | min=1 | max=254 | default=1 */
            contactUToOThreshold: number;
            /** ID=0x6600 | type=UINT16 | manufacturerCode=CUSTOM_SPRUT_DEVICE(0x6666) */
            sprutOccupancyLevel?: number;
            /** ID=0x6601 | type=UINT16 | manufacturerCode=CUSTOM_SPRUT_DEVICE(0x6666) */
            sprutOccupancySensitivity?: number;
            /** ID=0xe000 | type=ENUM8 | manufacturerCode=ADEO(0x1277) */
            elkoOccupancyDfltOperationMode?: number;
            /** ID=0xe001 | type=ENUM8 | manufacturerCode=ADEO(0x1277) */
            elkoOccupancyOperationMode?: number;
            /** ID=0xe002 | type=UINT16 | manufacturerCode=ADEO(0x1277) */
            elkoForceOffTimeout?: number;
            /** ID=0xe003 | type=UINT8 | manufacturerCode=ADEO(0x1277) */
            elkoOccupancySensitivity?: number;
        };
        commands: never;
        commandResponses: never;
    };
    msLeafWetness: {
        attributes: {
            /** ID=0x0000 | type=UINT16 */
            measuredValue: number;
            /** ID=0x0001 | type=UINT16 */
            minMeasuredValue: number;
            /** ID=0x0002 | type=UINT16 */
            maxMeasuredValue: number;
            /** ID=0x0003 | type=UINT16 */
            tolerance: number;
        };
        commands: never;
        commandResponses: never;
    };
    msSoilMoisture: {
        attributes: {
            /** ID=0x0000 | type=UINT16 */
            measuredValue: number;
            /** ID=0x0001 | type=UINT16 */
            minMeasuredValue: number;
            /** ID=0x0002 | type=UINT16 */
            maxMeasuredValue: number;
            /** ID=0x0003 | type=UINT16 */
            tolerance: number;
        };
        commands: never;
        commandResponses: never;
    };
    pHMeasurement: {
        attributes: {
            /** ID=0x0000 | type=UINT16 | reportRequired=true | required=true | default=65535 | minInclusiveRef=minMeasuredValue | maxInclusiveRef=maxMeasuredValue */
            measuredValue: number;
            /** ID=0x0001 | type=UINT16 | required=true | default=65535 | maxExclusiveRef=maxMeasuredValue */
            minMeasuredValue: number;
            /** ID=0x0002 | type=UINT16 | required=true | max=1400 | default=65535 | minExclusiveRef=minMeasuredValue */
            maxMeasuredValue: number;
            /** ID=0x0003 | type=UINT16 | max=200 | default=0 */
            tolerance: number;
        };
        commands: never;
        commandResponses: never;
    };
    msElectricalConductivity: {
        attributes: {
            /** ID=0x0000 | type=UINT16 | reportRequired=true | required=true | default=65535 | minInclusiveRef=minMeasuredValue | maxInclusiveRef=maxMeasuredValue */
            measuredValue: number;
            /** ID=0x0001 | type=UINT16 | required=true | default=65535 | maxExclusiveRef=maxMeasuredValue */
            minMeasuredValue: number;
            /** ID=0x0002 | type=UINT16 | required=true | max=65534 | default=65535 | minExclusiveRef=minMeasuredValue */
            maxMeasuredValue: number;
            /** ID=0x0003 | type=UINT16 | max=100 */
            tolerance: number;
        };
        commands: never;
        commandResponses: never;
    };
    msWindSpeed: {
        attributes: {
            /** ID=0x0000 | type=UINT16 | reportRequired=true | required=true | default=65535 | minInclusiveRef=minMeasuredValue | maxInclusiveRef=maxMeasuredValue */
            measuredValue: number;
            /** ID=0x0001 | type=UINT16 | required=true | default=65535 | maxExclusiveRef=maxMeasuredValue */
            minMeasuredValue: number;
            /** ID=0x0002 | type=UINT16 | required=true | max=65534 | default=65535 | minExclusiveRef=minMeasuredValue */
            maxMeasuredValue: number;
            /** ID=0x0003 | type=UINT16 | max=776 | default=0 */
            tolerance: number;
        };
        commands: never;
        commandResponses: never;
    };
    msCarbonMonoxide: {
        attributes: {
            /** ID=0x0000 | type=SINGLE_PREC | reportRequired=true | required=true | minInclusiveRef=minMeasuredValue | maxInclusiveRef=maxMeasuredValue */
            measuredValue: number;
            /** ID=0x0001 | type=SINGLE_PREC | required=true | min=0 | maxExclusiveRef=maxMeasuredValue */
            minMeasuredValue: number;
            /** ID=0x0002 | type=SINGLE_PREC | required=true | max=1 | minExclusiveRef=minMeasuredValue */
            maxMeasuredValue: number;
            /** ID=0x0003 | type=SINGLE_PREC */
            tolerance: number;
        };
        commands: never;
        commandResponses: never;
    };
    msCO2: {
        attributes: {
            /** ID=0x0000 | type=SINGLE_PREC */
            measuredValue: number;
            /** ID=0x0001 | type=SINGLE_PREC */
            minMeasuredValue: number;
            /** ID=0x0002 | type=SINGLE_PREC */
            maxMeasuredValue: number;
            /** ID=0x0003 | type=SINGLE_PREC */
            tolerance: number;
            /** ID=0x6600 | type=BOOLEAN | manufacturerCode=CUSTOM_SPRUT_DEVICE(0x6666) */
            sprutCO2Calibration?: number;
            /** ID=0x6601 | type=BOOLEAN | manufacturerCode=CUSTOM_SPRUT_DEVICE(0x6666) */
            sprutCO2AutoCalibration?: number;
        };
        commands: never;
        commandResponses: never;
    };
    msEthylene: {
        attributes: {
            /** ID=0x0000 | type=SINGLE_PREC */
            measuredValue: number;
            /** ID=0x0001 | type=SINGLE_PREC */
            minMeasuredValue: number;
            /** ID=0x0002 | type=SINGLE_PREC */
            maxMeasuredValue: number;
            /** ID=0x0003 | type=SINGLE_PREC */
            tolerance: number;
        };
        commands: never;
        commandResponses: never;
    };
    msEthyleneOxide: {
        attributes: {
            /** ID=0x0000 | type=SINGLE_PREC */
            measuredValue: number;
            /** ID=0x0001 | type=SINGLE_PREC */
            minMeasuredValue: number;
            /** ID=0x0002 | type=SINGLE_PREC */
            maxMeasuredValue: number;
            /** ID=0x0003 | type=SINGLE_PREC */
            tolerance: number;
        };
        commands: never;
        commandResponses: never;
    };
    msHydrogen: {
        attributes: {
            /** ID=0x0000 | type=SINGLE_PREC */
            measuredValue: number;
            /** ID=0x0001 | type=SINGLE_PREC */
            minMeasuredValue: number;
            /** ID=0x0002 | type=SINGLE_PREC */
            maxMeasuredValue: number;
            /** ID=0x0003 | type=SINGLE_PREC */
            tolerance: number;
        };
        commands: never;
        commandResponses: never;
    };
    msHydrogenSulfide: {
        attributes: {
            /** ID=0x0000 | type=SINGLE_PREC */
            measuredValue: number;
            /** ID=0x0001 | type=SINGLE_PREC */
            minMeasuredValue: number;
            /** ID=0x0002 | type=SINGLE_PREC */
            maxMeasuredValue: number;
            /** ID=0x0003 | type=SINGLE_PREC */
            tolerance: number;
        };
        commands: never;
        commandResponses: never;
    };
    msNitricOxide: {
        attributes: {
            /** ID=0x0000 | type=SINGLE_PREC */
            measuredValue: number;
            /** ID=0x0001 | type=SINGLE_PREC */
            minMeasuredValue: number;
            /** ID=0x0002 | type=SINGLE_PREC */
            maxMeasuredValue: number;
            /** ID=0x0003 | type=SINGLE_PREC */
            tolerance: number;
        };
        commands: never;
        commandResponses: never;
    };
    msNitrogenDioxide: {
        attributes: {
            /** ID=0x0000 | type=SINGLE_PREC */
            measuredValue: number;
            /** ID=0x0001 | type=SINGLE_PREC */
            minMeasuredValue: number;
            /** ID=0x0002 | type=SINGLE_PREC */
            maxMeasuredValue: number;
            /** ID=0x0003 | type=SINGLE_PREC */
            tolerance: number;
        };
        commands: never;
        commandResponses: never;
    };
    msOxygen: {
        attributes: {
            /** ID=0x0000 | type=SINGLE_PREC */
            measuredValue: number;
            /** ID=0x0001 | type=SINGLE_PREC */
            minMeasuredValue: number;
            /** ID=0x0002 | type=SINGLE_PREC */
            maxMeasuredValue: number;
            /** ID=0x0003 | type=SINGLE_PREC */
            tolerance: number;
        };
        commands: never;
        commandResponses: never;
    };
    msOzone: {
        attributes: {
            /** ID=0x0000 | type=SINGLE_PREC */
            measuredValue: number;
            /** ID=0x0001 | type=SINGLE_PREC */
            minMeasuredValue: number;
            /** ID=0x0002 | type=SINGLE_PREC */
            maxMeasuredValue: number;
            /** ID=0x0003 | type=SINGLE_PREC */
            tolerance: number;
        };
        commands: never;
        commandResponses: never;
    };
    msSulfurDioxide: {
        attributes: {
            /** ID=0x0000 | type=SINGLE_PREC */
            measuredValue: number;
            /** ID=0x0001 | type=SINGLE_PREC */
            minMeasuredValue: number;
            /** ID=0x0002 | type=SINGLE_PREC */
            maxMeasuredValue: number;
            /** ID=0x0003 | type=SINGLE_PREC */
            tolerance: number;
        };
        commands: never;
        commandResponses: never;
    };
    msDissolvedOxygen: {
        attributes: {
            /** ID=0x0000 | type=SINGLE_PREC */
            measuredValue: number;
            /** ID=0x0001 | type=SINGLE_PREC */
            minMeasuredValue: number;
            /** ID=0x0002 | type=SINGLE_PREC */
            maxMeasuredValue: number;
            /** ID=0x0003 | type=SINGLE_PREC */
            tolerance: number;
        };
        commands: never;
        commandResponses: never;
    };
    msBromate: {
        attributes: {
            /** ID=0x0000 | type=SINGLE_PREC */
            measuredValue: number;
            /** ID=0x0001 | type=SINGLE_PREC */
            minMeasuredValue: number;
            /** ID=0x0002 | type=SINGLE_PREC */
            maxMeasuredValue: number;
            /** ID=0x0003 | type=SINGLE_PREC */
            tolerance: number;
        };
        commands: never;
        commandResponses: never;
    };
    msChloramines: {
        attributes: {
            /** ID=0x0000 | type=SINGLE_PREC */
            measuredValue: number;
            /** ID=0x0001 | type=SINGLE_PREC */
            minMeasuredValue: number;
            /** ID=0x0002 | type=SINGLE_PREC */
            maxMeasuredValue: number;
            /** ID=0x0003 | type=SINGLE_PREC */
            tolerance: number;
        };
        commands: never;
        commandResponses: never;
    };
    msChlorine: {
        attributes: {
            /** ID=0x0000 | type=SINGLE_PREC */
            measuredValue: number;
            /** ID=0x0001 | type=SINGLE_PREC */
            minMeasuredValue: number;
            /** ID=0x0002 | type=SINGLE_PREC */
            maxMeasuredValue: number;
            /** ID=0x0003 | type=SINGLE_PREC */
            tolerance: number;
        };
        commands: never;
        commandResponses: never;
    };
    msFecalColiformAndEColi: {
        attributes: {
            /** ID=0x0000 | type=SINGLE_PREC */
            measuredValue: number;
            /** ID=0x0001 | type=SINGLE_PREC */
            minMeasuredValue: number;
            /** ID=0x0002 | type=SINGLE_PREC */
            maxMeasuredValue: number;
            /** ID=0x0003 | type=SINGLE_PREC */
            tolerance: number;
        };
        commands: never;
        commandResponses: never;
    };
    msFluoride: {
        attributes: {
            /** ID=0x0000 | type=SINGLE_PREC */
            measuredValue: number;
            /** ID=0x0001 | type=SINGLE_PREC */
            minMeasuredValue: number;
            /** ID=0x0002 | type=SINGLE_PREC */
            maxMeasuredValue: number;
            /** ID=0x0003 | type=SINGLE_PREC */
            tolerance: number;
        };
        commands: never;
        commandResponses: never;
    };
    msHaloaceticAcids: {
        attributes: {
            /** ID=0x0000 | type=SINGLE_PREC */
            measuredValue: number;
            /** ID=0x0001 | type=SINGLE_PREC */
            minMeasuredValue: number;
            /** ID=0x0002 | type=SINGLE_PREC */
            maxMeasuredValue: number;
            /** ID=0x0003 | type=SINGLE_PREC */
            tolerance: number;
        };
        commands: never;
        commandResponses: never;
    };
    msTotalTrihalomethanes: {
        attributes: {
            /** ID=0x0000 | type=SINGLE_PREC */
            measuredValue: number;
            /** ID=0x0001 | type=SINGLE_PREC */
            minMeasuredValue: number;
            /** ID=0x0002 | type=SINGLE_PREC */
            maxMeasuredValue: number;
            /** ID=0x0003 | type=SINGLE_PREC */
            tolerance: number;
        };
        commands: never;
        commandResponses: never;
    };
    msTotalColiformBacteria: {
        attributes: {
            /** ID=0x0000 | type=SINGLE_PREC */
            measuredValue: number;
            /** ID=0x0001 | type=SINGLE_PREC */
            minMeasuredValue: number;
            /** ID=0x0002 | type=SINGLE_PREC */
            maxMeasuredValue: number;
            /** ID=0x0003 | type=SINGLE_PREC */
            tolerance: number;
        };
        commands: never;
        commandResponses: never;
    };
    msTurbidity: {
        attributes: {
            /** ID=0x0000 | type=SINGLE_PREC */
            measuredValue: number;
            /** ID=0x0001 | type=SINGLE_PREC */
            minMeasuredValue: number;
            /** ID=0x0002 | type=SINGLE_PREC */
            maxMeasuredValue: number;
            /** ID=0x0003 | type=SINGLE_PREC */
            tolerance: number;
        };
        commands: never;
        commandResponses: never;
    };
    msCopper: {
        attributes: {
            /** ID=0x0000 | type=SINGLE_PREC */
            measuredValue: number;
            /** ID=0x0001 | type=SINGLE_PREC */
            minMeasuredValue: number;
            /** ID=0x0002 | type=SINGLE_PREC */
            maxMeasuredValue: number;
            /** ID=0x0003 | type=SINGLE_PREC */
            tolerance: number;
        };
        commands: never;
        commandResponses: never;
    };
    msLead: {
        attributes: {
            /** ID=0x0000 | type=SINGLE_PREC */
            measuredValue: number;
            /** ID=0x0001 | type=SINGLE_PREC */
            minMeasuredValue: number;
            /** ID=0x0002 | type=SINGLE_PREC */
            maxMeasuredValue: number;
            /** ID=0x0003 | type=SINGLE_PREC */
            tolerance: number;
        };
        commands: never;
        commandResponses: never;
    };
    msManganese: {
        attributes: {
            /** ID=0x0000 | type=SINGLE_PREC */
            measuredValue: number;
            /** ID=0x0001 | type=SINGLE_PREC */
            minMeasuredValue: number;
            /** ID=0x0002 | type=SINGLE_PREC */
            maxMeasuredValue: number;
            /** ID=0x0003 | type=SINGLE_PREC */
            tolerance: number;
        };
        commands: never;
        commandResponses: never;
    };
    msSulfate: {
        attributes: {
            /** ID=0x0000 | type=SINGLE_PREC */
            measuredValue: number;
            /** ID=0x0001 | type=SINGLE_PREC */
            minMeasuredValue: number;
            /** ID=0x0002 | type=SINGLE_PREC */
            maxMeasuredValue: number;
            /** ID=0x0003 | type=SINGLE_PREC */
            tolerance: number;
        };
        commands: never;
        commandResponses: never;
    };
    msBromodichloromethane: {
        attributes: {
            /** ID=0x0000 | type=SINGLE_PREC */
            measuredValue: number;
            /** ID=0x0001 | type=SINGLE_PREC */
            minMeasuredValue: number;
            /** ID=0x0002 | type=SINGLE_PREC */
            maxMeasuredValue: number;
            /** ID=0x0003 | type=SINGLE_PREC */
            tolerance: number;
        };
        commands: never;
        commandResponses: never;
    };
    msBromoform: {
        attributes: {
            /** ID=0x0000 | type=SINGLE_PREC */
            measuredValue: number;
            /** ID=0x0001 | type=SINGLE_PREC */
            minMeasuredValue: number;
            /** ID=0x0002 | type=SINGLE_PREC */
            maxMeasuredValue: number;
            /** ID=0x0003 | type=SINGLE_PREC */
            tolerance: number;
        };
        commands: never;
        commandResponses: never;
    };
    msChlorodibromomethane: {
        attributes: {
            /** ID=0x0000 | type=SINGLE_PREC */
            measuredValue: number;
            /** ID=0x0001 | type=SINGLE_PREC */
            minMeasuredValue: number;
            /** ID=0x0002 | type=SINGLE_PREC */
            maxMeasuredValue: number;
            /** ID=0x0003 | type=SINGLE_PREC */
            tolerance: number;
        };
        commands: never;
        commandResponses: never;
    };
    msChloroform: {
        attributes: {
            /** ID=0x0000 | type=SINGLE_PREC */
            measuredValue: number;
            /** ID=0x0001 | type=SINGLE_PREC */
            minMeasuredValue: number;
            /** ID=0x0002 | type=SINGLE_PREC */
            maxMeasuredValue: number;
            /** ID=0x0003 | type=SINGLE_PREC */
            tolerance: number;
        };
        commands: never;
        commandResponses: never;
    };
    msSodium: {
        attributes: {
            /** ID=0x0000 | type=SINGLE_PREC */
            measuredValue: number;
            /** ID=0x0001 | type=SINGLE_PREC */
            minMeasuredValue: number;
            /** ID=0x0002 | type=SINGLE_PREC */
            maxMeasuredValue: number;
            /** ID=0x0003 | type=SINGLE_PREC */
            tolerance: number;
        };
        commands: never;
        commandResponses: never;
    };
    pm25Measurement: {
        attributes: {
            /** ID=0x0000 | type=SINGLE_PREC */
            measuredValue: number;
            /** ID=0x0001 | type=SINGLE_PREC */
            measuredMinValue: number;
            /** ID=0x0002 | type=SINGLE_PREC */
            measuredMaxValue: number;
            /** ID=0x0003 | type=SINGLE_PREC */
            tolerance: number;
        };
        commands: never;
        commandResponses: never;
    };
    msFormaldehyde: {
        attributes: {
            /** ID=0x0000 | type=SINGLE_PREC */
            measuredValue: number;
            /** ID=0x0001 | type=SINGLE_PREC */
            minMeasuredValue: number;
            /** ID=0x0002 | type=SINGLE_PREC */
            maxMeasuredValue: number;
            /** ID=0x0003 | type=SINGLE_PREC */
            tolerance: number;
        };
        commands: never;
        commandResponses: never;
    };
    pm1Measurement: {
        attributes: {
            /** ID=0x0000 | type=SINGLE_PREC */
            measuredValue: number;
            /** ID=0x0001 | type=SINGLE_PREC */
            measuredMinValue: number;
            /** ID=0x0002 | type=SINGLE_PREC */
            measuredMaxValue: number;
            /** ID=0x0003 | type=SINGLE_PREC */
            tolerance: number;
        };
        commands: never;
        commandResponses: never;
    };
    pm10Measurement: {
        attributes: {
            /** ID=0x0000 | type=SINGLE_PREC */
            measuredValue: number;
            /** ID=0x0001 | type=SINGLE_PREC */
            measuredMinValue: number;
            /** ID=0x0002 | type=SINGLE_PREC */
            measuredMaxValue: number;
            /** ID=0x0003 | type=SINGLE_PREC */
            tolerance: number;
        };
        commands: never;
        commandResponses: never;
    };
    ssIasZone: {
        attributes: {
            /** ID=0x0000 | type=ENUM8 | required=true | max=255 | default=0 */
            zoneState: number;
            /** ID=0x0001 | type=ENUM16 | required=true */
            zoneType: number;
            /** ID=0x0002 | type=BITMAP16 | required=true | default=0 */
            zoneStatus: number;
            /** ID=0x0010 | type=IEEE_ADDR | writable=true | required=true */
            iasCieAddr: string;
            /** ID=0x0011 | type=UINT8 | required=true | max=255 | default=255 */
            zoneId: number;
            /** ID=0x0012 | type=UINT8 | min=2 | max=255 | default=2 */
            numZoneSensitivityLevelsSupported: number;
            /** ID=0x0013 | type=UINT8 | writable=true | max=255 | default=0 */
            currentZoneSensitivityLevel: number;
            /** ID=0x8001 | type=UINT16 | manufacturerCode=DEVELCO(0x1015) */
            develcoAlarmOffDelay?: number;
        };
        commands: {
            /** ID=0x00 | required=true */
            enrollRsp: {
                /** type=UINT8 */
                enrollrspcode: number;
                /** type=UINT8 */
                zoneid: number;
            };
            /** ID=0x01 */
            initNormalOpMode: Record<string, never>;
            /** ID=0x02 */
            initTestMode: {
                /** type=UINT8 */
                testModeDuration: number;
                /** type=UINT8 */
                currentZoneSensitivityLevel: number;
            };
        };
        commandResponses: {
            /** ID=0x00 | required=true */
            statusChangeNotification: {
                /** type=UINT16 */
                zonestatus: number;
                /** type=UINT8 */
                extendedstatus: number;
                /** type=UINT8 */
                zoneID: number;
                /** type=UINT16 */
                delay: number;
            };
            /** ID=0x01 | required=true */
            enrollReq: {
                /** type=UINT16 */
                zonetype: number;
                /** type=UINT16 */
                manucode: number;
            };
        };
    };
    ssIasAce: {
        attributes: never;
        commands: {
            /** ID=0x00 | response=0 | required=true */
            arm: {
                /** type=UINT8 */
                armmode: number;
                /** type=CHAR_STR */
                code: string;
                /** type=UINT8 */
                zoneid: number;
            };
            /** ID=0x01 | required=true */
            bypass: {
                /** type=UINT8 */
                numofzones: number;
                /** type=LIST_UINT8 */
                zoneidlist: number[];
                /** type=CHAR_STR */
                armDisarmCode: string;
            };
            /** ID=0x02 | required=true */
            emergency: Record<string, never>;
            /** ID=0x03 | required=true */
            fire: Record<string, never>;
            /** ID=0x04 | required=true */
            panic: Record<string, never>;
            /** ID=0x05 | response=1 | required=true */
            getZoneIDMap: Record<string, never>;
            /** ID=0x06 | response=2 | required=true */
            getZoneInfo: {
                /** type=UINT8 */
                zoneid: number;
            };
            /** ID=0x07 | response=5 | required=true */
            getPanelStatus: Record<string, never>;
            /** ID=0x08 | required=true */
            getBypassedZoneList: Record<string, never>;
            /** ID=0x09 | response=8 | required=true */
            getZoneStatus: {
                /** type=UINT8 */
                startzoneid: number;
                /** type=UINT8 */
                maxnumzoneid: number;
                /** type=UINT8 */
                zonestatusmaskflag: number;
                /** type=UINT16 */
                zonestatusmask: number;
            };
        };
        commandResponses: {
            /** ID=0x00 | required=true */
            armRsp: {
                /** type=UINT8 */
                armnotification: number;
            };
            /** ID=0x01 | required=true */
            getZoneIDMapRsp: {
                /** type=UINT16 */
                zoneidmapsection0: number;
                /** type=UINT16 */
                zoneidmapsection1: number;
                /** type=UINT16 */
                zoneidmapsection2: number;
                /** type=UINT16 */
                zoneidmapsection3: number;
                /** type=UINT16 */
                zoneidmapsection4: number;
                /** type=UINT16 */
                zoneidmapsection5: number;
                /** type=UINT16 */
                zoneidmapsection6: number;
                /** type=UINT16 */
                zoneidmapsection7: number;
                /** type=UINT16 */
                zoneidmapsection8: number;
                /** type=UINT16 */
                zoneidmapsection9: number;
                /** type=UINT16 */
                zoneidmapsection10: number;
                /** type=UINT16 */
                zoneidmapsection11: number;
                /** type=UINT16 */
                zoneidmapsection12: number;
                /** type=UINT16 */
                zoneidmapsection13: number;
                /** type=UINT16 */
                zoneidmapsection14: number;
                /** type=UINT16 */
                zoneidmapsection15: number;
            };
            /** ID=0x02 | required=true */
            getZoneInfoRsp: {
                /** type=UINT8 */
                zoneid: number;
                /** type=UINT16 */
                zonetype: number;
                /** type=IEEE_ADDR */
                ieeeaddr: string;
                /** type=CHAR_STR */
                zonelabel: string;
            };
            /** ID=0x03 | required=true */
            zoneStatusChanged: {
                /** type=UINT8 */
                zoneid: number;
                /** type=UINT16 */
                zonestatus: number;
                /** type=UINT8 */
                audiblenotif: number;
                /** type=CHAR_STR */
                zonelabel: string;
            };
            /** ID=0x04 | required=true */
            panelStatusChanged: {
                /** type=UINT8 */
                panelstatus: number;
                /** type=UINT8 */
                secondsremain: number;
                /** type=UINT8 */
                audiblenotif: number;
                /** type=UINT8 */
                alarmstatus: number;
            };
            /** ID=0x05 | required=true */
            getPanelStatusRsp: {
                /** type=UINT8 */
                panelstatus: number;
                /** type=UINT8 */
                secondsremain: number;
                /** type=UINT8 */
                audiblenotif: number;
                /** type=UINT8 */
                alarmstatus: number;
            };
            /** ID=0x06 | required=true */
            setBypassedZoneList: {
                /** type=UINT8 */
                numofzones: number;
                /** type=LIST_UINT8 */
                zoneid: number[];
            };
            /** ID=0x07 | required=true */
            bypassRsp: {
                /** type=UINT8 */
                numofzones: number;
                /** type=LIST_UINT8 */
                bypassresult: number[];
            };
            /** ID=0x08 | required=true */
            getZoneStatusRsp: {
                /** type=UINT8 */
                zonestatuscomplete: number;
                /** type=UINT8 */
                numofzones: number;
                /** type=LIST_ZONEINFO */
                zoneinfo: ZoneInfo[];
            };
        };
    };
    ssIasWd: {
        attributes: {
            /** ID=0x0000 | type=UINT16 | writable=true | required=true | max=65534 | default=240 */
            maxDuration: number;
        };
        commands: {
            /** ID=0x00 | required=true */
            startWarning: {
                /** type=UINT8 */
                startwarninginfo: number;
                /** type=UINT16 */
                warningduration: number;
                /** type=UINT8 | maxInclusive=100 */
                strobedutycycle: number;
                /** type=UINT8 */
                strobelevel: number;
            };
            /** ID=0x01 | required=true */
            squawk: {
                /** type=UINT8 */
                squawkinfo: number;
            };
        };
        commandResponses: never;
    };
    piGenericTunnel: {
        attributes: {
            /** ID=0x0001 | type=UINT16 */
            maxIncomeTransSize: number;
            /** ID=0x0002 | type=UINT16 */
            maxOutgoTransSize: number;
            /** ID=0x0003 | type=OCTET_STR */
            protocolAddr: Buffer;
        };
        commands: {
            /** ID=0x00 */
            matchProtocolAddr: {
                /** type=CHAR_STR */
                protocoladdr: string;
            };
        };
        commandResponses: {
            /** ID=0x00 */
            matchProtocolAddrRsp: {
                /** type=IEEE_ADDR */
                devieeeaddr: string;
                /** type=CHAR_STR */
                protocoladdr: string;
            };
            /** ID=0x01 */
            advertiseProtocolAddr: {
                /** type=CHAR_STR */
                protocoladdr: string;
            };
        };
    };
    piBacnetProtocolTunnel: {
        attributes: never;
        commands: {
            /** ID=0x00 */
            transferNpdu: {
                /** type=UINT8 */
                npdu: number;
            };
        };
        commandResponses: never;
    };
    piAnalogInputReg: {
        attributes: {
            /** ID=0x0016 | type=SINGLE_PREC */
            covIncrement: number;
            /** ID=0x001f | type=CHAR_STR */
            deviceType: string;
            /** ID=0x004b | type=BAC_OID */
            objectId: number;
            /** ID=0x004d | type=CHAR_STR */
            objectName: string;
            /** ID=0x004f | type=ENUM16 */
            objectType: number;
            /** ID=0x0076 | type=UINT8 */
            updateInterval: number;
            /** ID=0x00a8 | type=CHAR_STR */
            profileName: string;
        };
        commands: never;
        commandResponses: never;
    };
    piAnalogInputExt: {
        attributes: {
            /** ID=0x0000 | type=BITMAP8 */
            ackedTransitions: number;
            /** ID=0x0011 | type=UINT16 */
            notificationClass: number;
            /** ID=0x0019 | type=SINGLE_PREC */
            deadband: number;
            /** ID=0x0023 | type=BITMAP8 */
            eventEnable: number;
            /** ID=0x0024 | type=ENUM8 */
            eventState: number;
            /** ID=0x002d | type=SINGLE_PREC */
            highLimit: number;
            /** ID=0x0034 | type=BITMAP8 */
            limitEnable: number;
            /** ID=0x003b | type=SINGLE_PREC */
            lowLimit: number;
            /** ID=0x0048 | type=ENUM8 */
            notifyType: number;
            /** ID=0x0071 | type=UINT8 */
            timeDelay: number;
            /** ID=0x0082 | type=ARRAY */
            eventTimeStamps: ZclArray | unknown[];
        };
        commands: {
            /** ID=0x00 */
            transferApdu: Record<string, never>;
            /** ID=0x01 */
            connectReq: Record<string, never>;
            /** ID=0x02 */
            disconnectReq: Record<string, never>;
            /** ID=0x03 */
            connectStatusNoti: Record<string, never>;
        };
        commandResponses: never;
    };
    piAnalogOutputReg: {
        attributes: {
            /** ID=0x0016 | type=SINGLE_PREC */
            covIncrement: number;
            /** ID=0x001f | type=CHAR_STR */
            deviceType: string;
            /** ID=0x004b | type=BAC_OID */
            objectId: number;
            /** ID=0x004d | type=CHAR_STR */
            objectName: string;
            /** ID=0x004f | type=ENUM16 */
            objectType: number;
            /** ID=0x0076 | type=UINT8 */
            updateInterval: number;
            /** ID=0x00a8 | type=CHAR_STR */
            profileName: string;
        };
        commands: never;
        commandResponses: never;
    };
    piAnalogOutputExt: {
        attributes: {
            /** ID=0x0000 | type=BITMAP8 */
            ackedTransitions: number;
            /** ID=0x0011 | type=UINT16 */
            notificationClass: number;
            /** ID=0x0019 | type=SINGLE_PREC */
            deadband: number;
            /** ID=0x0023 | type=BITMAP8 */
            eventEnable: number;
            /** ID=0x0024 | type=ENUM8 */
            eventState: number;
            /** ID=0x002d | type=SINGLE_PREC */
            highLimit: number;
            /** ID=0x0034 | type=BITMAP8 */
            limitEnable: number;
            /** ID=0x003b | type=SINGLE_PREC */
            lowLimit: number;
            /** ID=0x0048 | type=ENUM8 */
            notifyType: number;
            /** ID=0x0071 | type=UINT8 */
            timeDelay: number;
            /** ID=0x0082 | type=ARRAY */
            eventTimeStamps: ZclArray | unknown[];
        };
        commands: never;
        commandResponses: never;
    };
    piAnalogValueReg: {
        attributes: {
            /** ID=0x0016 | type=SINGLE_PREC */
            covIncrement: number;
            /** ID=0x004b | type=BAC_OID */
            objectId: number;
            /** ID=0x004d | type=CHAR_STR */
            objectName: string;
            /** ID=0x004f | type=ENUM16 */
            objectType: number;
            /** ID=0x00a8 | type=CHAR_STR */
            profileName: string;
        };
        commands: never;
        commandResponses: never;
    };
    piAnalogValueExt: {
        attributes: {
            /** ID=0x0000 | type=BITMAP8 */
            ackedTransitions: number;
            /** ID=0x0011 | type=UINT16 */
            notificationClass: number;
            /** ID=0x0019 | type=SINGLE_PREC */
            deadband: number;
            /** ID=0x0023 | type=BITMAP8 */
            eventEnable: number;
            /** ID=0x0024 | type=ENUM8 */
            eventState: number;
            /** ID=0x002d | type=SINGLE_PREC */
            highLimit: number;
            /** ID=0x0034 | type=BITMAP8 */
            limitEnable: number;
            /** ID=0x003b | type=SINGLE_PREC */
            lowLimit: number;
            /** ID=0x0048 | type=ENUM8 */
            notifyType: number;
            /** ID=0x0071 | type=UINT8 */
            timeDelay: number;
            /** ID=0x0082 | type=ARRAY */
            eventTimeStamps: ZclArray | unknown[];
        };
        commands: never;
        commandResponses: never;
    };
    piBinaryInputReg: {
        attributes: {
            /** ID=0x000f | type=UINT32 */
            changeOfStateCount: number;
            /** ID=0x0010 | type=STRUCT */
            changeOfStateTime: Struct;
            /** ID=0x001f | type=CHAR_STR */
            deviceType: string;
            /** ID=0x0021 | type=UINT32 */
            elapsedActiveTime: number;
            /** ID=0x004b | type=BAC_OID */
            objectIdentifier: number;
            /** ID=0x004d | type=CHAR_STR */
            objectName: string;
            /** ID=0x004f | type=ENUM16 */
            objectType: number;
            /** ID=0x0072 | type=STRUCT */
            timeOfATReset: Struct;
            /** ID=0x0073 | type=STRUCT */
            timeOfSCReset: Struct;
            /** ID=0x00a8 | type=CHAR_STR */
            profileName: string;
        };
        commands: never;
        commandResponses: never;
    };
    piBinaryInputExt: {
        attributes: {
            /** ID=0x0000 | type=BITMAP8 */
            ackedTransitions: number;
            /** ID=0x0006 | type=BOOLEAN */
            alarmValue: number;
            /** ID=0x0011 | type=UINT16 */
            notificationClass: number;
            /** ID=0x0023 | type=BITMAP8 */
            eventEnable: number;
            /** ID=0x0024 | type=ENUM8 */
            eventState: number;
            /** ID=0x0048 | type=ENUM8 */
            notifyType: number;
            /** ID=0x0071 | type=UINT8 */
            timeDelay: number;
            /** ID=0x0082 | type=ARRAY */
            eventTimeStamps: ZclArray | unknown[];
        };
        commands: never;
        commandResponses: never;
    };
    piBinaryOutputReg: {
        attributes: {
            /** ID=0x000f | type=UINT32 */
            changeOfStateCount: number;
            /** ID=0x0010 | type=STRUCT */
            changeOfStateTime: Struct;
            /** ID=0x001f | type=CHAR_STR */
            deviceType: string;
            /** ID=0x0021 | type=UINT32 */
            elapsedActiveTime: number;
            /** ID=0x0028 | type=ENUM8 */
            feedBackValue: number;
            /** ID=0x004b | type=BAC_OID */
            objectIdentifier: number;
            /** ID=0x004d | type=CHAR_STR */
            objectName: string;
            /** ID=0x004f | type=ENUM16 */
            objectType: number;
            /** ID=0x0072 | type=STRUCT */
            timeOfATReset: Struct;
            /** ID=0x0073 | type=STRUCT */
            timeOfSCReset: Struct;
            /** ID=0x00a8 | type=CHAR_STR */
            profileName: string;
        };
        commands: never;
        commandResponses: never;
    };
    piBinaryOutputExt: {
        attributes: {
            /** ID=0x0000 | type=BITMAP8 */
            ackedTransitions: number;
            /** ID=0x0011 | type=UINT16 */
            notificationClass: number;
            /** ID=0x0023 | type=BITMAP8 */
            eventEnable: number;
            /** ID=0x0024 | type=ENUM8 */
            eventState: number;
            /** ID=0x0048 | type=ENUM8 */
            notifyType: number;
            /** ID=0x0071 | type=UINT8 */
            timeDelay: number;
            /** ID=0x0082 | type=ARRAY */
            eventTimeStamps: ZclArray | unknown[];
        };
        commands: never;
        commandResponses: never;
    };
    piBinaryValueReg: {
        attributes: {
            /** ID=0x000f | type=UINT32 */
            changeOfStateCount: number;
            /** ID=0x0010 | type=STRUCT */
            changeOfStateTime: Struct;
            /** ID=0x0021 | type=UINT32 */
            elapsedActiveTime: number;
            /** ID=0x004b | type=BAC_OID */
            objectIdentifier: number;
            /** ID=0x004d | type=CHAR_STR */
            objectName: string;
            /** ID=0x004f | type=ENUM16 */
            objectType: number;
            /** ID=0x0072 | type=STRUCT */
            timeOfATReset: Struct;
            /** ID=0x0073 | type=STRUCT */
            timeOfSCReset: Struct;
            /** ID=0x00a8 | type=CHAR_STR */
            profileName: string;
        };
        commands: never;
        commandResponses: never;
    };
    piBinaryValueExt: {
        attributes: {
            /** ID=0x0000 | type=BITMAP8 */
            ackedTransitions: number;
            /** ID=0x0006 | type=BOOLEAN */
            alarmValue: number;
            /** ID=0x0011 | type=UINT16 */
            notificationClass: number;
            /** ID=0x0023 | type=BITMAP8 */
            eventEnable: number;
            /** ID=0x0024 | type=ENUM8 */
            eventState: number;
            /** ID=0x0048 | type=ENUM8 */
            notifyType: number;
            /** ID=0x0071 | type=UINT8 */
            timeDelay: number;
            /** ID=0x0082 | type=ARRAY */
            eventTimeStamps: ZclArray | unknown[];
        };
        commands: never;
        commandResponses: never;
    };
    piMultistateInputReg: {
        attributes: {
            /** ID=0x001f | type=CHAR_STR */
            deviceType: string;
            /** ID=0x004b | type=BAC_OID */
            objectId: number;
            /** ID=0x004d | type=CHAR_STR */
            objectName: string;
            /** ID=0x004f | type=ENUM16 */
            objectType: number;
            /** ID=0x00a8 | type=CHAR_STR */
            profileName: string;
        };
        commands: never;
        commandResponses: never;
    };
    piMultistateInputExt: {
        attributes: {
            /** ID=0x0000 | type=BITMAP8 */
            ackedTransitions: number;
            /** ID=0x0006 | type=UINT16 */
            alarmValue: number;
            /** ID=0x0011 | type=UINT16 */
            notificationClass: number;
            /** ID=0x0023 | type=BITMAP8 */
            eventEnable: number;
            /** ID=0x0024 | type=ENUM8 */
            eventState: number;
            /** ID=0x0025 | type=UINT16 */
            faultValues: number;
            /** ID=0x0048 | type=ENUM8 */
            notifyType: number;
            /** ID=0x0071 | type=UINT8 */
            timeDelay: number;
            /** ID=0x0082 | type=ARRAY */
            eventTimeStamps: ZclArray | unknown[];
        };
        commands: never;
        commandResponses: never;
    };
    piMultistateOutputReg: {
        attributes: {
            /** ID=0x001f | type=CHAR_STR */
            deviceType: string;
            /** ID=0x0028 | type=ENUM8 */
            feedBackValue: number;
            /** ID=0x004b | type=BAC_OID */
            objectId: number;
            /** ID=0x004d | type=CHAR_STR */
            objectName: string;
            /** ID=0x004f | type=ENUM16 */
            objectType: number;
            /** ID=0x00a8 | type=CHAR_STR */
            profileName: string;
        };
        commands: never;
        commandResponses: never;
    };
    piMultistateOutputExt: {
        attributes: {
            /** ID=0x0000 | type=BITMAP8 */
            ackedTransitions: number;
            /** ID=0x0011 | type=UINT16 */
            notificationClass: number;
            /** ID=0x0023 | type=BITMAP8 */
            eventEnable: number;
            /** ID=0x0024 | type=ENUM8 */
            eventState: number;
            /** ID=0x0048 | type=ENUM8 */
            notifyType: number;
            /** ID=0x0071 | type=UINT8 */
            timeDelay: number;
            /** ID=0x0082 | type=ARRAY */
            eventTimeStamps: ZclArray | unknown[];
        };
        commands: never;
        commandResponses: never;
    };
    piMultistateValueReg: {
        attributes: {
            /** ID=0x004b | type=BAC_OID */
            objectId: number;
            /** ID=0x004d | type=CHAR_STR */
            objectName: string;
            /** ID=0x004f | type=ENUM16 */
            objectType: number;
            /** ID=0x00a8 | type=CHAR_STR */
            profileName: string;
        };
        commands: never;
        commandResponses: never;
    };
    piMultistateValueExt: {
        attributes: {
            /** ID=0x0000 | type=BITMAP8 */
            ackedTransitions: number;
            /** ID=0x0006 | type=UINT16 */
            alarmValue: number;
            /** ID=0x0011 | type=UINT16 */
            notificationClass: number;
            /** ID=0x0023 | type=BITMAP8 */
            eventEnable: number;
            /** ID=0x0024 | type=ENUM8 */
            eventState: number;
            /** ID=0x0025 | type=UINT16 */
            faultValues: number;
            /** ID=0x0048 | type=ENUM8 */
            notifyType: number;
            /** ID=0x0071 | type=UINT8 */
            timeDelay: number;
            /** ID=0x0082 | type=ARRAY */
            eventTimeStamps: ZclArray | unknown[];
        };
        commands: never;
        commandResponses: never;
    };
    pi11073ProtocolTunnel: {
        attributes: {
            /** ID=0x0000 | type=ARRAY */
            deviceidList: ZclArray | unknown[];
            /** ID=0x0001 | type=IEEE_ADDR */
            managerTarget: string;
            /** ID=0x0002 | type=UINT8 */
            managerEndpoint: number;
            /** ID=0x0003 | type=BOOLEAN */
            connected: number;
            /** ID=0x0004 | type=BOOLEAN */
            preemptible: number;
            /** ID=0x0005 | type=UINT16 */
            idleTimeout: number;
        };
        commands: {
            /** ID=0x00 */
            transferApdu: Record<string, never>;
            /** ID=0x01 */
            connectReq: Record<string, never>;
            /** ID=0x02 */
            disconnectReq: Record<string, never>;
            /** ID=0x03 */
            connectStatusNoti: Record<string, never>;
        };
        commandResponses: never;
    };
    piIso7818ProtocolTunnel: {
        attributes: {
            /** ID=0x0000 | type=UINT8 */
            status: number;
        };
        commands: never;
        commandResponses: never;
    };
    piRetailTunnel: {
        attributes: {
            /** ID=0x0000 | type=UINT16 */
            manufacturerCode: number;
            /** ID=0x0001 | type=UINT16 */
            msProfile: number;
        };
        commands: never;
        commandResponses: never;
    };
    seMetering: {
        attributes: {
            /** ID=0x0000 | type=UINT48 */
            currentSummDelivered: number;
            /** ID=0x0001 | type=UINT48 */
            currentSummReceived: number;
            /** ID=0x0002 | type=UINT48 */
            currentMaxDemandDelivered: number;
            /** ID=0x0003 | type=UINT48 */
            currentMaxDemandReceived: number;
            /** ID=0x0004 | type=UINT48 */
            dftSumm: number;
            /** ID=0x0005 | type=UINT16 */
            dailyFreezeTime: number;
            /** ID=0x0006 | type=INT8 */
            powerFactor: number;
            /** ID=0x0007 | type=UTC */
            readingSnapshotTime: number;
            /** ID=0x0008 | type=UTC */
            currentMaxDemandDeliverdTime: number;
            /** ID=0x0009 | type=UTC */
            currentMaxDemandReceivedTime: number;
            /** ID=0x000a | type=UINT8 */
            defaultUpdatePeriod: number;
            /** ID=0x000b | type=UINT8 */
            fastPollUpdatePeriod: number;
            /** ID=0x000c | type=UINT48 */
            currentBlockPeriodConsumpDelivered: number;
            /** ID=0x000d | type=UINT24 */
            dailyConsumpTarget: number;
            /** ID=0x000e | type=ENUM8 */
            currentBlock: number;
            /** ID=0x000f | type=ENUM8 */
            profileIntervalPeriod: number;
            /** ID=0x0010 | type=UINT16 */
            intervalReadReportingPeriod: number;
            /** ID=0x0011 | type=UINT16 */
            presetReadingTime: number;
            /** ID=0x0012 | type=UINT16 */
            volumePerReport: number;
            /** ID=0x0013 | type=UINT8 */
            flowRestriction: number;
            /** ID=0x0014 | type=ENUM8 */
            supplyStatus: number;
            /** ID=0x0015 | type=UINT48 */
            currentInEnergyCarrierSumm: number;
            /** ID=0x0016 | type=UINT48 */
            currentOutEnergyCarrierSumm: number;
            /** ID=0x0017 | type=INT24 */
            inletTempreature: number;
            /** ID=0x0018 | type=INT24 */
            outletTempreature: number;
            /** ID=0x0019 | type=INT24 */
            controlTempreature: number;
            /** ID=0x001a | type=INT24 */
            currentInEnergyCarrierDemand: number;
            /** ID=0x001b | type=INT24 */
            currentOutEnergyCarrierDemand: number;
            /** ID=0x001d | type=UINT48 */
            currentBlockPeriodConsumpReceived: number;
            /** ID=0x001e | type=UINT48 */
            currentBlockReceived: number;
            /** ID=0x001f | type=UINT48 */
            DFTSummationReceived: number;
            /** ID=0x0020 | type=ENUM8 */
            activeRegisterTierDelivered: number;
            /** ID=0x0021 | type=ENUM8 */
            activeRegisterTierReceived: number;
            /** ID=0x0100 | type=UINT48 */
            currentTier1SummDelivered: number;
            /** ID=0x0101 | type=UINT48 */
            currentTier1SummReceived: number;
            /** ID=0x0102 | type=UINT48 */
            currentTier2SummDelivered: number;
            /** ID=0x0103 | type=UINT48 */
            currentTier2SummReceived: number;
            /** ID=0x0104 | type=UINT48 */
            currentTier3SummDelivered: number;
            /** ID=0x0105 | type=UINT48 */
            currentTier3SummReceived: number;
            /** ID=0x0106 | type=UINT48 */
            currentTier4SummDelivered: number;
            /** ID=0x0107 | type=UINT48 */
            currentTier4SummReceived: number;
            /** ID=0x0108 | type=UINT48 */
            currentTier5SummDelivered: number;
            /** ID=0x0109 | type=UINT48 */
            currentTier5SummReceived: number;
            /** ID=0x010a | type=UINT48 */
            currentTier6SummDelivered: number;
            /** ID=0x010b | type=UINT48 */
            currentTier6SummReceived: number;
            /** ID=0x010c | type=UINT48 */
            currentTier7SummDelivered: number;
            /** ID=0x010d | type=UINT48 */
            currentTier7SummReceived: number;
            /** ID=0x010e | type=UINT48 */
            currentTier8SummDelivered: number;
            /** ID=0x010f | type=UINT48 */
            currentTier8SummReceived: number;
            /** ID=0x0110 | type=UINT48 */
            currentTier9SummDelivered: number;
            /** ID=0x0111 | type=UINT48 */
            currentTier9SummReceived: number;
            /** ID=0x0112 | type=UINT48 */
            currentTier10SummDelivered: number;
            /** ID=0x0113 | type=UINT48 */
            currentTier10SummReceived: number;
            /** ID=0x0114 | type=UINT48 */
            currentTier11SummDelivered: number;
            /** ID=0x0115 | type=UINT48 */
            currentTier11SummReceived: number;
            /** ID=0x0116 | type=UINT48 */
            currentTier12SummDelivered: number;
            /** ID=0x0117 | type=UINT48 */
            currentTier12SummReceived: number;
            /** ID=0x0118 | type=UINT48 */
            currentTier13SummDelivered: number;
            /** ID=0x0119 | type=UINT48 */
            currentTier13SummReceived: number;
            /** ID=0x011a | type=UINT48 */
            currentTier14SummDelivered: number;
            /** ID=0x011b | type=UINT48 */
            currentTier14SummReceived: number;
            /** ID=0x011c | type=UINT48 */
            currentTier15SummDelivered: number;
            /** ID=0x011d | type=UINT48 */
            currentTier15SummReceived: number;
            /** ID=0x0200 | type=BITMAP8 */
            status: number;
            /** ID=0x0201 | type=UINT8 */
            remainingBattLife: number;
            /** ID=0x0202 | type=UINT24 */
            hoursInOperation: number;
            /** ID=0x0203 | type=UINT24 */
            hoursInFault: number;
            /** ID=0x0204 | type=BITMAP64 */
            extendedStatus: bigint;
            /** ID=0x0300 | type=ENUM8 */
            unitOfMeasure: number;
            /** ID=0x0301 | type=UINT24 */
            multiplier: number;
            /** ID=0x0302 | type=UINT24 */
            divisor: number;
            /** ID=0x0303 | type=BITMAP8 */
            summaFormatting: number;
            /** ID=0x0304 | type=BITMAP8 */
            demandFormatting: number;
            /** ID=0x0305 | type=BITMAP8 */
            historicalConsumpFormatting: number;
            /** ID=0x0306 | type=BITMAP8 */
            meteringDeviceType: number;
            /** ID=0x0307 | type=OCTET_STR */
            siteId: Buffer;
            /** ID=0x0308 | type=OCTET_STR */
            meterSerialNumber: Buffer;
            /** ID=0x0309 | type=ENUM8 */
            energyCarrierUnitOfMeas: number;
            /** ID=0x030a | type=BITMAP8 */
            energyCarrierSummFormatting: number;
            /** ID=0x030b | type=BITMAP8 */
            energyCarrierDemandFormatting: number;
            /** ID=0x030c | type=ENUM8 */
            temperatureUnitOfMeas: number;
            /** ID=0x030d | type=BITMAP8 */
            temperatureFormatting: number;
            /** ID=0x030e | type=OCTET_STR */
            moduleSerialNumber: Buffer;
            /** ID=0x030f | type=OCTET_STR */
            operatingTariffLevel: Buffer;
            /** ID=0x0400 | type=INT24 */
            instantaneousDemand: number;
            /** ID=0x0401 | type=UINT24 */
            currentdayConsumpDelivered: number;
            /** ID=0x0402 | type=UINT24 */
            currentdayConsumpReceived: number;
            /** ID=0x0403 | type=UINT24 */
            previousdayConsumpDelivered: number;
            /** ID=0x0404 | type=UINT24 */
            previousdayConsumpReceived: number;
            /** ID=0x0405 | type=UTC */
            curPartProfileIntStartTimeDelivered: number;
            /** ID=0x0406 | type=UTC */
            curPartProfileIntStartTimeReceived: number;
            /** ID=0x0407 | type=UINT24 */
            curPartProfileIntValueDelivered: number;
            /** ID=0x0408 | type=UINT24 */
            curPartProfileIntValueReceived: number;
            /** ID=0x0409 | type=UINT48 */
            currentDayMaxPressure: number;
            /** ID=0x040a | type=UINT48 */
            currentDayMinPressure: number;
            /** ID=0x040b | type=UINT48 */
            previousDayMaxPressure: number;
            /** ID=0x040c | type=UINT48 */
            previousDayMinPressure: number;
            /** ID=0x040d | type=INT24 */
            currentDayMaxDemand: number;
            /** ID=0x040e | type=INT24 */
            previousDayMaxDemand: number;
            /** ID=0x040f | type=INT24 */
            currentMonthMaxDemand: number;
            /** ID=0x0410 | type=INT24 */
            currentYearMaxDemand: number;
            /** ID=0x0411 | type=INT24 */
            currentdayMaxEnergyCarrDemand: number;
            /** ID=0x0412 | type=INT24 */
            previousdayMaxEnergyCarrDemand: number;
            /** ID=0x0413 | type=INT24 */
            curMonthMaxEnergyCarrDemand: number;
            /** ID=0x0414 | type=INT24 */
            curMonthMinEnergyCarrDemand: number;
            /** ID=0x0415 | type=INT24 */
            curYearMaxEnergyCarrDemand: number;
            /** ID=0x0416 | type=INT24 */
            curYearMinEnergyCarrDemand: number;
            /** ID=0x0500 | type=UINT8 */
            maxNumberOfPeriodsDelivered: number;
            /** ID=0x0600 | type=UINT24 */
            currentDemandDelivered: number;
            /** ID=0x0601 | type=UINT24 */
            demandLimit: number;
            /** ID=0x0602 | type=UINT8 */
            demandIntegrationPeriod: number;
            /** ID=0x0603 | type=UINT8 */
            numberOfDemandSubintervals: number;
            /** ID=0x0604 | type=UINT16 */
            demandLimitArmDuration: number;
            /** ID=0x0800 | type=BITMAP16 */
            genericAlarmMask: number;
            /** ID=0x0801 | type=BITMAP32 */
            electricityAlarmMask: number;
            /** ID=0x0802 | type=BITMAP16 */
            genFlowPressureAlarmMask: number;
            /** ID=0x0803 | type=BITMAP16 */
            waterSpecificAlarmMask: number;
            /** ID=0x0804 | type=BITMAP16 */
            heatCoolSpecificAlarmMASK: number;
            /** ID=0x0805 | type=BITMAP16 */
            gasSpecificAlarmMask: number;
            /** ID=0x0806 | type=BITMAP48 */
            extendedGenericAlarmMask: number;
            /** ID=0x0807 | type=BITMAP16 */
            manufactureAlarmMask: number;
            /** ID=0x0a00 | type=UINT32 */
            billToDate: number;
            /** ID=0x0a01 | type=UTC */
            billToDateTimeStamp: number;
            /** ID=0x0a02 | type=UINT32 */
            projectedBill: number;
            /** ID=0x0a03 | type=UTC */
            projectedBillTimeStamp: number;
            /** ID=0x0300 | type=UINT16 | manufacturerCode=DEVELCO(0x1015) */
            develcoPulseConfiguration?: number;
            /** ID=0x0301 | type=UINT48 | manufacturerCode=DEVELCO(0x1015) */
            develcoCurrentSummation?: number;
            /** ID=0x0302 | type=ENUM16 | manufacturerCode=DEVELCO(0x1015) */
            develcoInterfaceMode?: number;
            /** ID=0x2000 | type=INT24 | manufacturerCode=OWON_TECHNOLOGY_INC(0x113c) */
            owonL1PhasePower?: number;
            /** ID=0x2001 | type=INT24 | manufacturerCode=OWON_TECHNOLOGY_INC(0x113c) */
            owonL2PhasePower?: number;
            /** ID=0x2002 | type=INT24 | manufacturerCode=OWON_TECHNOLOGY_INC(0x113c) */
            owonL3PhasePower?: number;
            /** ID=0x2100 | type=INT24 | manufacturerCode=OWON_TECHNOLOGY_INC(0x113c) */
            owonL1PhaseReactivePower?: number;
            /** ID=0x2101 | type=INT24 | manufacturerCode=OWON_TECHNOLOGY_INC(0x113c) */
            owonL2PhaseReactivePower?: number;
            /** ID=0x2102 | type=INT24 | manufacturerCode=OWON_TECHNOLOGY_INC(0x113c) */
            owonL3PhaseReactivePower?: number;
            /** ID=0x2103 | type=INT24 | manufacturerCode=OWON_TECHNOLOGY_INC(0x113c) */
            owonReactivePowerSum?: number;
            /** ID=0x3000 | type=UINT24 | manufacturerCode=OWON_TECHNOLOGY_INC(0x113c) */
            owonL1PhaseVoltage?: number;
            /** ID=0x3001 | type=UINT24 | manufacturerCode=OWON_TECHNOLOGY_INC(0x113c) */
            owonL2PhaseVoltage?: number;
            /** ID=0x3002 | type=UINT24 | manufacturerCode=OWON_TECHNOLOGY_INC(0x113c) */
            owonL3PhaseVoltage?: number;
            /** ID=0x3100 | type=UINT24 | manufacturerCode=OWON_TECHNOLOGY_INC(0x113c) */
            owonL1PhaseCurrent?: number;
            /** ID=0x3101 | type=UINT24 | manufacturerCode=OWON_TECHNOLOGY_INC(0x113c) */
            owonL2PhaseCurrent?: number;
            /** ID=0x3102 | type=UINT24 | manufacturerCode=OWON_TECHNOLOGY_INC(0x113c) */
            owonL3PhaseCurrent?: number;
            /** ID=0x3103 | type=UINT24 | manufacturerCode=OWON_TECHNOLOGY_INC(0x113c) */
            owonCurrentSum?: number;
            /** ID=0x3104 | type=UINT24 | manufacturerCode=OWON_TECHNOLOGY_INC(0x113c) */
            owonLeakageCurrent?: number;
            /** ID=0x4000 | type=UINT48 | manufacturerCode=OWON_TECHNOLOGY_INC(0x113c) */
            owonL1Energy?: number;
            /** ID=0x4001 | type=UINT48 | manufacturerCode=OWON_TECHNOLOGY_INC(0x113c) */
            owonL2Energy?: number;
            /** ID=0x4002 | type=UINT48 | manufacturerCode=OWON_TECHNOLOGY_INC(0x113c) */
            owonL3Energy?: number;
            /** ID=0x4100 | type=UINT48 | manufacturerCode=OWON_TECHNOLOGY_INC(0x113c) */
            owonL1ReactiveEnergy?: number;
            /** ID=0x4101 | type=UINT48 | manufacturerCode=OWON_TECHNOLOGY_INC(0x113c) */
            owonL2ReactiveEnergy?: number;
            /** ID=0x4102 | type=UINT48 | manufacturerCode=OWON_TECHNOLOGY_INC(0x113c) */
            owonL3ReactiveEnergy?: number;
            /** ID=0x4103 | type=UINT48 | manufacturerCode=OWON_TECHNOLOGY_INC(0x113c) */
            owonReactiveEnergySum?: number;
            /** ID=0x4104 | type=INT8 | manufacturerCode=OWON_TECHNOLOGY_INC(0x113c) */
            owonL1PowerFactor?: number;
            /** ID=0x4105 | type=INT8 | manufacturerCode=OWON_TECHNOLOGY_INC(0x113c) */
            owonL2PowerFactor?: number;
            /** ID=0x4106 | type=INT8 | manufacturerCode=OWON_TECHNOLOGY_INC(0x113c) */
            owonL3PowerFactor?: number;
            /** ID=0x5005 | type=UINT8 | manufacturerCode=OWON_TECHNOLOGY_INC(0x113c) */
            owonFrequency?: number;
            /** ID=0x1000 | type=BITMAP8 | manufacturerCode=OWON_TECHNOLOGY_INC(0x113c) */
            owonReportMap?: number;
            /** ID=0x5000 | type=UINT32 | manufacturerCode=OWON_TECHNOLOGY_INC(0x113c) */
            owonLastHistoricalRecordTime?: number;
            /** ID=0x5001 | type=UINT32 | manufacturerCode=OWON_TECHNOLOGY_INC(0x113c) */
            owonOldestHistoricalRecordTime?: number;
            /** ID=0x5002 | type=UINT32 | manufacturerCode=OWON_TECHNOLOGY_INC(0x113c) */
            owonMinimumReportCycle?: number;
            /** ID=0x5003 | type=UINT32 | manufacturerCode=OWON_TECHNOLOGY_INC(0x113c) */
            owonMaximumReportCycle?: number;
            /** ID=0x5004 | type=UINT8 | manufacturerCode=OWON_TECHNOLOGY_INC(0x113c) */
            owonSentHistoricalRecordState?: number;
            /** ID=0x5006 | type=UINT8 | manufacturerCode=OWON_TECHNOLOGY_INC(0x113c) */
            owonAccumulativeEnergyThreshold?: number;
            /** ID=0x5007 | type=UINT8 | manufacturerCode=OWON_TECHNOLOGY_INC(0x113c) */
            owonReportMode?: number;
            /** ID=0x5008 | type=UINT8 | manufacturerCode=OWON_TECHNOLOGY_INC(0x113c) */
            owonPercentChangeInPower?: number;
            /** ID=0x4010 | type=INT48 | manufacturerCode=SCHNEIDER_ELECTRIC(0x105e) */
            schneiderActiveEnergyTotal?: number;
            /** ID=0x4011 | type=INT48 | manufacturerCode=SCHNEIDER_ELECTRIC(0x105e) */
            schneiderReactiveEnergyTotal?: number;
            /** ID=0x4012 | type=INT48 | manufacturerCode=SCHNEIDER_ELECTRIC(0x105e) */
            schneiderApparentEnergyTotal?: number;
            /** ID=0x4014 | type=INT48 | manufacturerCode=SCHNEIDER_ELECTRIC(0x105e) */
            schneiderPartialActiveEnergyTotal?: number;
            /** ID=0x4015 | type=INT48 | manufacturerCode=SCHNEIDER_ELECTRIC(0x105e) */
            schneiderPartialReactiveEnergyTotal?: number;
            /** ID=0x4016 | type=INT48 | manufacturerCode=SCHNEIDER_ELECTRIC(0x105e) */
            schneiderPartialApparentEnergyTotal?: number;
            /** ID=0x4100 | type=INT48 | manufacturerCode=SCHNEIDER_ELECTRIC(0x105e) */
            schneiderPartialActiveEnergyL1Phase?: number;
            /** ID=0x4101 | type=INT48 | manufacturerCode=SCHNEIDER_ELECTRIC(0x105e) */
            schneiderPartialReactiveEnergyL1Phase?: number;
            /** ID=0x4102 | type=INT48 | manufacturerCode=SCHNEIDER_ELECTRIC(0x105e) */
            schneiderPartialApparentEnergyL1Phase?: number;
            /** ID=0x4103 | type=INT48 | manufacturerCode=SCHNEIDER_ELECTRIC(0x105e) */
            schneiderActiveEnergyL1Phase?: number;
            /** ID=0x4104 | type=INT48 | manufacturerCode=SCHNEIDER_ELECTRIC(0x105e) */
            schneiderReactiveEnergyL1Phase?: number;
            /** ID=0x4105 | type=INT48 | manufacturerCode=SCHNEIDER_ELECTRIC(0x105e) */
            schneiderApparentEnergyL1Phase?: number;
            /** ID=0x4200 | type=INT48 | manufacturerCode=SCHNEIDER_ELECTRIC(0x105e) */
            schneiderPartialActiveEnergyL2Phase?: number;
            /** ID=0x4201 | type=INT48 | manufacturerCode=SCHNEIDER_ELECTRIC(0x105e) */
            schneiderPartialReactiveEnergyL2Phase?: number;
            /** ID=0x4202 | type=INT48 | manufacturerCode=SCHNEIDER_ELECTRIC(0x105e) */
            schneiderPartialApparentEnergyL2Phase?: number;
            /** ID=0x4203 | type=INT48 | manufacturerCode=SCHNEIDER_ELECTRIC(0x105e) */
            schneiderActiveEnergyL2Phase?: number;
            /** ID=0x4204 | type=INT48 | manufacturerCode=SCHNEIDER_ELECTRIC(0x105e) */
            schneiderReactiveEnergyL2Phase?: number;
            /** ID=0x4205 | type=INT48 | manufacturerCode=SCHNEIDER_ELECTRIC(0x105e) */
            schneiderApparentEnergyL2Phase?: number;
            /** ID=0x4300 | type=INT48 | manufacturerCode=SCHNEIDER_ELECTRIC(0x105e) */
            schneiderPartialActiveEnergyL3Phase?: number;
            /** ID=0x4301 | type=INT48 | manufacturerCode=SCHNEIDER_ELECTRIC(0x105e) */
            schneiderPartialReactiveEnergyL3Phase?: number;
            /** ID=0x4302 | type=INT48 | manufacturerCode=SCHNEIDER_ELECTRIC(0x105e) */
            schneiderPartialApparentEnergyL3Phase?: number;
            /** ID=0x4303 | type=INT48 | manufacturerCode=SCHNEIDER_ELECTRIC(0x105e) */
            schneiderActiveEnergyL3Phase?: number;
            /** ID=0x4304 | type=INT48 | manufacturerCode=SCHNEIDER_ELECTRIC(0x105e) */
            schneiderReactiveEnergyL3Phase?: number;
            /** ID=0x4305 | type=INT48 | manufacturerCode=SCHNEIDER_ELECTRIC(0x105e) */
            schneiderApparentEnergyL3Phase?: number;
            /** ID=0x4400 | type=UINT24 | manufacturerCode=SCHNEIDER_ELECTRIC(0x105e) */
            schneiderActiveEnergyMultiplier?: number;
            /** ID=0x4401 | type=UINT24 | manufacturerCode=SCHNEIDER_ELECTRIC(0x105e) */
            schneiderActiveEnergyDivisor?: number;
            /** ID=0x4402 | type=UINT24 | manufacturerCode=SCHNEIDER_ELECTRIC(0x105e) */
            schneiderReactiveEnergyMultiplier?: number;
            /** ID=0x4403 | type=UINT24 | manufacturerCode=SCHNEIDER_ELECTRIC(0x105e) */
            schneiderReactiveEnergyDivisor?: number;
            /** ID=0x4404 | type=UINT24 | manufacturerCode=SCHNEIDER_ELECTRIC(0x105e) */
            schneiderApparentEnergyMultiplier?: number;
            /** ID=0x4405 | type=UINT24 | manufacturerCode=SCHNEIDER_ELECTRIC(0x105e) */
            schneiderApparentEnergyDivisor?: number;
            /** ID=0x4501 | type=UTC | manufacturerCode=SCHNEIDER_ELECTRIC(0x105e) */
            schneiderEnergyResetDateTime?: number;
            /** ID=0x4600 | type=UINT16 | manufacturerCode=SCHNEIDER_ELECTRIC(0x105e) */
            schneiderEnergyCountersReportingPeriod?: number;
        };
        commands: {
            /** ID=0x00 */
            getProfile: Record<string, never>;
            /** ID=0x01 */
            reqMirror: Record<string, never>;
            /** ID=0x02 */
            mirrorRem: Record<string, never>;
            /** ID=0x03 */
            reqFastPollMode: Record<string, never>;
            /** ID=0x04 */
            getSnapshot: Record<string, never>;
            /** ID=0x05 */
            takeSnapshot: Record<string, never>;
            /** ID=0x06 */
            mirrorReportAttrRsp: Record<string, never>;
            /** ID=0x20 */
            owonGetHistoryRecord: Record<string, never>;
            /** ID=0x21 */
            owonStopSendingHistoricalRecord: Record<string, never>;
        };
        commandResponses: {
            /** ID=0x00 */
            getProfileRsp: Record<string, never>;
            /** ID=0x01 */
            reqMirrorRsp: Record<string, never>;
            /** ID=0x02 */
            mirrorRemRsp: Record<string, never>;
            /** ID=0x03 */
            reqFastPollModeRsp: Record<string, never>;
            /** ID=0x04 */
            getSnapshotRsp: Record<string, never>;
            /** ID=0x20 */
            owonGetHistoryRecordRsp: Record<string, never>;
        };
    };
    tunneling: {
        attributes: never;
        commands: {
            /** ID=0x00 | response=0 */
            requestTunnel: {
                /** type=ENUM8 */
                protocolId: number;
                /** type=UINT16 */
                manufCode: number;
                /** type=BOOLEAN */
                flowControl: number;
                /** type=UINT16 */
                mtuSize: number;
            };
            /** ID=0x01 */
            closeTunnel: {
                /** type=UINT16 */
                tunnelId: number;
            };
            /** ID=0x02 */
            transferData: {
                /** type=UINT16 */
                tunnelId: number;
                /** type=BUFFER */
                data: Buffer;
            };
            /** ID=0x03 */
            transferDataError: {
                /** type=UINT16 */
                tunnelId: number;
                /** type=UINT8 */
                status: number;
            };
        };
        commandResponses: {
            /** ID=0x00 */
            requestTunnelResp: {
                /** type=UINT16 */
                tunnelId: number;
                /** type=UINT8 */
                tunnelStatus: number;
                /** type=UINT16 */
                mtuSize: number;
            };
            /** ID=0x01 */
            transferDataResp: {
                /** type=UINT16 */
                tunnelId: number;
                /** type=BUFFER */
                data: Buffer;
            };
            /** ID=0x02 */
            transferDataErrorResp: {
                /** type=UINT16 */
                tunnelId: number;
                /** type=UINT8 */
                status: number;
            };
        };
    };
    telecommunicationsInformation: {
        attributes: {
            /** ID=0x0000 | type=CHAR_STR */
            nodeDescription: string;
            /** ID=0x0001 | type=BOOLEAN */
            deliveryEnable: number;
            /** ID=0x0002 | type=UINT32 */
            pushInformationTimer: number;
            /** ID=0x0003 | type=BOOLEAN */
            enableSecureConfiguration: number;
            /** ID=0x0010 | type=UINT16 */
            numberOfContents: number;
            /** ID=0x0011 | type=UINT16 */
            contentRootID: number;
        };
        commands: never;
        commandResponses: never;
    };
    telecommunicationsVoiceOverZigbee: {
        attributes: {
            /** ID=0x0000 | type=ENUM8 */
            codecType: number;
            /** ID=0x0001 | type=ENUM8 */
            samplingFrequency: number;
            /** ID=0x0002 | type=ENUM8 */
            codecrate: number;
            /** ID=0x0003 | type=UINT8 */
            establishmentTimeout: number;
            /** ID=0x0004 | type=ENUM8 */
            codecTypeSub1: number;
            /** ID=0x0005 | type=ENUM8 */
            codecTypeSub2: number;
            /** ID=0x0006 | type=ENUM8 */
            codecTypeSub3: number;
            /** ID=0x0007 | type=ENUM8 */
            compressionType: number;
            /** ID=0x0008 | type=ENUM8 */
            compressionRate: number;
            /** ID=0x0009 | type=BITMAP8 */
            optionFlags: number;
            /** ID=0x000a | type=UINT8 */
            threshold: number;
        };
        commands: never;
        commandResponses: never;
    };
    telecommunicationsChatting: {
        attributes: {
            /** ID=0x0000 | type=UINT16 */
            uID: number;
            /** ID=0x0001 | type=CHAR_STR */
            nickname: string;
            /** ID=0x0010 | type=UINT16 */
            cID: number;
            /** ID=0x0011 | type=CHAR_STR */
            name: string;
            /** ID=0x0012 | type=BOOLEAN */
            enableAddChat: number;
        };
        commands: never;
        commandResponses: never;
    };
    haApplianceIdentification: {
        attributes: {
            /** ID=0x0000 | type=UINT56 */
            basicIdentification: bigint;
            /** ID=0x0010 | type=CHAR_STR */
            companyName: string;
            /** ID=0x0011 | type=UINT16 */
            companyId: number;
            /** ID=0x0012 | type=CHAR_STR */
            brandName: string;
            /** ID=0x0013 | type=UINT16 */
            brandId: number;
            /** ID=0x0014 | type=OCTET_STR */
            model: Buffer;
            /** ID=0x0015 | type=OCTET_STR */
            partNumber: Buffer;
            /** ID=0x0016 | type=OCTET_STR */
            productRevision: Buffer;
            /** ID=0x0017 | type=OCTET_STR */
            softwareRevision: Buffer;
            /** ID=0x0018 | type=OCTET_STR */
            productTypeName: Buffer;
            /** ID=0x0019 | type=UINT16 */
            productTypeId: number;
            /** ID=0x001a | type=UINT8 */
            cecedSpecificationVersion: number;
        };
        commands: never;
        commandResponses: never;
    };
    haMeterIdentification: {
        attributes: {
            /** ID=0x0000 | type=CHAR_STR */
            companyName: string;
            /** ID=0x0001 | type=UINT16 */
            meterTypeId: number;
            /** ID=0x0004 | type=UINT16 */
            dataQualityId: number;
            /** ID=0x0005 | type=CHAR_STR */
            customerName: string;
            /** ID=0x0006 | type=CHAR_STR */
            model: string;
            /** ID=0x0007 | type=CHAR_STR */
            partNumber: string;
            /** ID=0x0008 | type=CHAR_STR */
            productRevision: string;
            /** ID=0x000a | type=CHAR_STR */
            softwareRevision: string;
            /** ID=0x000b | type=CHAR_STR */
            utilityName: string;
            /** ID=0x000c | type=CHAR_STR */
            pod: string;
            /** ID=0x000d | type=INT24 */
            availablePower: number;
            /** ID=0x000e | type=INT24 */
            powerThreshold: number;
        };
        commands: never;
        commandResponses: never;
    };
    haApplianceEventsAlerts: {
        attributes: never;
        commands: {
            /** ID=0x00 */
            getAlerts: Record<string, never>;
        };
        commandResponses: {
            /** ID=0x00 */
            getAlertsRsp: {
                /** type=UINT8 */
                alertscount: number;
                /** type=LIST_UINT24 */
                aalert: number[];
            };
            /** ID=0x01 */
            alertsNotification: {
                /** type=UINT8 */
                alertscount: number;
                /** type=LIST_UINT24 */
                aalert: number[];
            };
            /** ID=0x02 */
            eventNotification: {
                /** type=UINT8 */
                eventheader: number;
                /** type=UINT8 */
                eventid: number;
            };
        };
    };
    haApplianceStatistics: {
        attributes: {
            /** ID=0x0000 | type=UINT32 */
            logMaxSize: number;
            /** ID=0x0001 | type=UINT8 */
            logQueueMaxSize: number;
        };
        commands: {
            /** ID=0x00 */
            log: {
                /** type=UINT32 */
                logid: number;
            };
            /** ID=0x01 */
            logQueue: Record<string, never>;
        };
        commandResponses: {
            /** ID=0x00 */
            logNotification: {
                /** type=UINT32 */
                timestamp: number;
                /** type=UINT32 */
                logid: number;
                /** type=UINT32 */
                loglength: number;
                /** type=LIST_UINT8 */
                logpayload: number[];
            };
            /** ID=0x01 */
            logRsp: {
                /** type=UINT32 */
                timestamp: number;
                /** type=UINT32 */
                logid: number;
                /** type=UINT32 */
                loglength: number;
                /** type=LIST_UINT8 */
                logpayload: number[];
            };
            /** ID=0x02 */
            logQueueRsp: {
                /** type=UINT8 */
                logqueuesize: number;
                /** type=LIST_UINT32 */
                logid: number[];
            };
            /** ID=0x03 */
            statisticsAvailable: {
                /** type=UINT8 */
                logqueuesize: number;
                /** type=LIST_UINT32 */
                logid: number[];
            };
        };
    };
    haElectricalMeasurement: {
        attributes: {
            /** ID=0x0000 | type=BITMAP32 | required=true | default=0 */
            measurementType: number;
            /** ID=0x0100 | type=INT16 | reportRequired=true | min=-32767 | default=-32768 */
            dcVoltage: number;
            /** ID=0x0101 | type=INT16 | min=-32767 | default=-32768 */
            dcVoltageMin: number;
            /** ID=0x0102 | type=INT16 | min=-32767 | default=-32768 */
            dcvoltagemax: number;
            /** ID=0x0103 | type=INT16 | reportRequired=true | min=-32767 | default=-32768 */
            dcCurrent: number;
            /** ID=0x0104 | type=INT16 | min=-32767 | default=-32768 */
            dcCurrentMin: number;
            /** ID=0x0105 | type=INT16 | min=-32767 | default=-32768 */
            dcCurrentMax: number;
            /** ID=0x0106 | type=INT16 | reportRequired=true | min=-32767 | default=-32768 */
            dcPower: number;
            /** ID=0x0107 | type=INT16 | min=-32767 | default=-32768 */
            dcPowerMin: number;
            /** ID=0x0108 | type=INT16 | min=-32767 | default=-32768 */
            dcPowerMax: number;
            /** ID=0x0200 | type=UINT16 | reportRequired=true | min=1 | default=1 */
            dcVoltageMultiplier: number;
            /** ID=0x0201 | type=UINT16 | reportRequired=true | min=1 | default=1 */
            dcVoltageDivisor: number;
            /** ID=0x0202 | type=UINT16 | reportRequired=true | min=1 | default=1 */
            dcCurrentMultiplier: number;
            /** ID=0x0203 | type=UINT16 | reportRequired=true | min=1 | default=1 */
            dcCurrentDivisor: number;
            /** ID=0x0204 | type=UINT16 | reportRequired=true | min=1 | default=1 */
            dcPowerMultiplier: number;
            /** ID=0x0205 | type=UINT16 | reportRequired=true | min=1 | default=1 */
            dcPowerDivisor: number;
            /** ID=0x0300 | type=UINT16 | reportRequired=true | default=65535 */
            acFrequency: number;
            /** ID=0x0301 | type=UINT16 | default=65535 */
            acFrequencyMin: number;
            /** ID=0x0302 | type=UINT16 | default=65535 */
            acFrequencyMax: number;
            /** ID=0x0303 | type=UINT16 | reportRequired=true | default=65535 */
            neutralCurrent: number;
            /** ID=0x0304 | type=INT32 | reportRequired=true | min=-8388607 | max=8388607 */
            totalActivePower: number;
            /** ID=0x0305 | type=INT32 | reportRequired=true | min=-8388607 | max=8388607 */
            totalReactivePower: number;
            /** ID=0x0306 | type=UINT32 | reportRequired=true | max=16777215 */
            totalApparentPower: number;
            /** ID=0x0307 | type=INT16 | reportRequired=true | default=-32768 */
            meas1stHarmonicCurrent: number;
            /** ID=0x0308 | type=INT16 | reportRequired=true | default=-32768 */
            meas3rdHarmonicCurrent: number;
            /** ID=0x0309 | type=INT16 | reportRequired=true | default=-32768 */
            meas5thHarmonicCurrent: number;
            /** ID=0x030a | type=INT16 | reportRequired=true | default=-32768 */
            meas7thHarmonicCurrent: number;
            /** ID=0x030b | type=INT16 | reportRequired=true | default=-32768 */
            meas9thHarmonicCurrent: number;
            /** ID=0x030c | type=INT16 | reportRequired=true | default=-32768 */
            meas11thHarmonicCurrent: number;
            /** ID=0x030d | type=INT16 | reportRequired=true | default=-32768 */
            measPhase1stHarmonicCurrent: number;
            /** ID=0x030e | type=INT16 | reportRequired=true | default=-32768 */
            measPhase3rdHarmonicCurrent: number;
            /** ID=0x030f | type=INT16 | reportRequired=true | default=-32768 */
            measPhase5thHarmonicCurrent: number;
            /** ID=0x0310 | type=INT16 | reportRequired=true | default=-32768 */
            measPhase7thHarmonicCurrent: number;
            /** ID=0x0311 | type=INT16 | reportRequired=true | default=-32768 */
            measPhase9thHarmonicCurrent: number;
            /** ID=0x0312 | type=INT16 | reportRequired=true | default=-32768 */
            measPhase11thHarmonicCurrent: number;
            /** ID=0x0400 | type=UINT16 | reportRequired=true | min=1 | default=1 */
            acFrequencyMultiplier: number;
            /** ID=0x0401 | type=UINT16 | reportRequired=true | min=1 | default=1 */
            acFrequencyDivisor: number;
            /** ID=0x0402 | type=UINT32 | reportRequired=true | max=16777215 | default=1 */
            powerMultiplier: number;
            /** ID=0x0403 | type=UINT32 | reportRequired=true | max=16777215 | default=1 */
            powerDivisor: number;
            /** ID=0x0404 | type=INT8 | reportRequired=true | min=-127 | default=0 */
            harmonicCurrentMultiplier: number;
            /** ID=0x0405 | type=INT8 | reportRequired=true | min=-127 | default=0 */
            phaseHarmonicCurrentMultiplier: number;
            /** ID=0x0500 | type=INT16 */
            instantaneousVoltage: number;
            /** ID=0x0501 | type=UINT16 | reportRequired=true | default=65535 */
            instantaneousLineCurrent: number;
            /** ID=0x0502 | type=INT16 | reportRequired=true | default=-32768 */
            instantaneousActiveCurrent: number;
            /** ID=0x0503 | type=INT16 | reportRequired=true | default=-32768 */
            instantaneousReactiveCurrent: number;
            /** ID=0x0504 | type=INT16 */
            instantaneousPower: number;
            /** ID=0x0505 | type=UINT16 | reportRequired=true | default=65535 */
            rmsVoltage: number;
            /** ID=0x0506 | type=UINT16 | default=65535 */
            rmsVoltageMin: number;
            /** ID=0x0507 | type=UINT16 | default=65535 */
            rmsVoltageMax: number;
            /** ID=0x0508 | type=UINT16 | reportRequired=true | default=65535 */
            rmsCurrent: number;
            /** ID=0x0509 | type=UINT16 | default=65535 */
            rmsCurrentMin: number;
            /** ID=0x050a | type=UINT16 | default=65535 */
            rmsCurrentMax: number;
            /** ID=0x050b | type=INT16 | reportRequired=true | default=-32768 */
            activePower: number;
            /** ID=0x050c | type=INT16 | default=-32768 */
            activePowerMin: number;
            /** ID=0x050d | type=INT16 | default=-32768 */
            activePowerMax: number;
            /** ID=0x050e | type=INT16 | reportRequired=true | default=-32768 */
            reactivePower: number;
            /** ID=0x050f | type=UINT16 | reportRequired=true | default=65535 */
            apparentPower: number;
            /** ID=0x0510 | type=INT8 | min=-100 | max=100 | default=0 */
            powerFactor: number;
            /** ID=0x0511 | type=UINT16 | writable=true | default=0 */
            averageRmsVoltageMeasPeriod: number;
            /** ID=0x0512 | type=UINT16 | writable=true | default=0 */
            averageRmsOverVoltageCounter: number;
            /** ID=0x0513 | type=UINT16 | writable=true | default=0 */
            averageRmsUnderVoltageCounter: number;
            /** ID=0x0514 | type=UINT16 | writable=true | default=0 */
            rmsExtremeOverVoltagePeriod: number;
            /** ID=0x0515 | type=UINT16 | writable=true | default=0 */
            rmsExtremeUnderVoltagePeriod: number;
            /** ID=0x0516 | type=UINT16 | writable=true | default=0 */
            rmsVoltageSagPeriod: number;
            /** ID=0x0517 | type=UINT16 | writable=true | default=0 */
            rmsVoltageSwellPeriod: number;
            /** ID=0x0600 | type=UINT16 | reportRequired=true | min=1 | default=1 */
            acVoltageMultiplier: number;
            /** ID=0x0601 | type=UINT16 | reportRequired=true | min=1 | default=1 */
            acVoltageDivisor: number;
            /** ID=0x0602 | type=UINT16 | reportRequired=true | min=1 | default=1 */
            acCurrentMultiplier: number;
            /** ID=0x0603 | type=UINT16 | reportRequired=true | min=1 | default=1 */
            acCurrentDivisor: number;
            /** ID=0x0604 | type=UINT16 | reportRequired=true | min=1 | default=1 */
            acPowerMultiplier: number;
            /** ID=0x0605 | type=UINT16 | reportRequired=true | min=1 | default=1 */
            acPowerDivisor: number;
            /** ID=0x0700 | type=BITMAP8 | writable=true | default=0 */
            dcOverloadAlarmsMask: number;
            /** ID=0x0701 | type=INT16 | default=-1 */
            dcVoltageOverload: number;
            /** ID=0x0702 | type=INT16 | default=-1 */
            dcCurrentOverload: number;
            /** ID=0x0800 | type=BITMAP16 | writable=true | default=0 */
            acAlarmsMask: number;
            /** ID=0x0801 | type=INT16 | default=-1 */
            acVoltageOverload: number;
            /** ID=0x0802 | type=INT16 | default=-1 */
            acCurrentOverload: number;
            /** ID=0x0803 | type=INT16 | default=-1 */
            acActivePowerOverload: number;
            /** ID=0x0804 | type=INT16 | default=-1 */
            acReactivePowerOverload: number;
            /** ID=0x0805 | type=INT16 */
            averageRmsOverVoltage: number;
            /** ID=0x0806 | type=INT16 */
            averageRmsUnderVoltage: number;
            /** ID=0x0807 | type=INT16 | writable=true */
            rmsExtremeOverVoltage: number;
            /** ID=0x0808 | type=INT16 | writable=true */
            rmsExtremeUnderVoltage: number;
            /** ID=0x0809 | type=INT16 | writable=true */
            rmsVoltageSag: number;
            /** ID=0x080a | type=INT16 | writable=true */
            rmsVoltageSwell: number;
            /** ID=0x0901 | type=UINT16 | reportRequired=true | default=65535 */
            lineCurrentPhB: number;
            /** ID=0x0902 | type=INT16 | reportRequired=true | default=-32768 */
            activeCurrentPhB: number;
            /** ID=0x0903 | type=INT16 | reportRequired=true | default=-32768 */
            reactiveCurrentPhB: number;
            /** ID=0x0905 | type=UINT16 | reportRequired=true | default=65535 */
            rmsVoltagePhB: number;
            /** ID=0x0906 | type=UINT16 | default=32768 */
            rmsVoltageMinPhB: number;
            /** ID=0x0907 | type=UINT16 | default=32768 */
            rmsVoltageMaxPhB: number;
            /** ID=0x0908 | type=UINT16 | reportRequired=true | default=65535 */
            rmsCurrentPhB: number;
            /** ID=0x0909 | type=UINT16 | default=65535 */
            rmsCurrentMinPhB: number;
            /** ID=0x090a | type=UINT16 | default=65535 */
            rmsCurrentMaxPhB: number;
            /** ID=0x090b | type=INT16 | reportRequired=true | default=-32768 */
            activePowerPhB: number;
            /** ID=0x090c | type=INT16 | default=-32768 */
            activePowerMinPhB: number;
            /** ID=0x090d | type=INT16 | default=-32768 */
            activePowerMaxPhB: number;
            /** ID=0x090e | type=INT16 | reportRequired=true | default=-32768 */
            reactivePowerPhB: number;
            /** ID=0x090f | type=UINT16 | reportRequired=true | default=65535 */
            apparentPowerPhB: number;
            /** ID=0x0910 | type=INT8 | min=-100 | max=100 | default=0 */
            powerFactorPhB: number;
            /** ID=0x0911 | type=UINT16 | writable=true | default=0 */
            averageRmsVoltageMeasurePeriodPhB: number;
            /** ID=0x0912 | type=UINT16 | writable=true | default=0 */
            averageRmsOverVoltageCounterPhB: number;
            /** ID=0x0913 | type=UINT16 | writable=true | default=0 */
            averageUnderVoltageCounterPhB: number;
            /** ID=0x0914 | type=UINT16 | writable=true | default=0 */
            rmsExtremeOverVoltagePeriodPhB: number;
            /** ID=0x0915 | type=UINT16 | writable=true | default=0 */
            rmsExtremeUnderVoltagePeriodPhB: number;
            /** ID=0x0916 | type=UINT16 | writable=true | default=0 */
            rmsVoltageSagPeriodPhB: number;
            /** ID=0x0917 | type=UINT16 | writable=true | default=0 */
            rmsVoltageSwellPeriodPhB: number;
            /** ID=0x0a01 | type=UINT16 | reportRequired=true | default=65535 */
            lineCurrentPhC: number;
            /** ID=0x0a02 | type=INT16 | reportRequired=true | default=-32768 */
            activeCurrentPhC: number;
            /** ID=0x0a03 | type=INT16 | reportRequired=true | default=-32768 */
            reactiveCurrentPhC: number;
            /** ID=0x0a05 | type=UINT16 | reportRequired=true | default=65535 */
            rmsVoltagePhC: number;
            /** ID=0x0a06 | type=UINT16 | default=32768 */
            rmsVoltageMinPhC: number;
            /** ID=0x0a07 | type=UINT16 | default=32768 */
            rmsVoltageMaxPhC: number;
            /** ID=0x0a08 | type=UINT16 | reportRequired=true | default=65535 */
            rmsCurrentPhC: number;
            /** ID=0x0a09 | type=UINT16 | default=65535 */
            rmsCurrentMinPhC: number;
            /** ID=0x0a0a | type=UINT16 | default=65535 */
            rmsCurrentMaxPhC: number;
            /** ID=0x0a0b | type=INT16 | reportRequired=true | default=-32768 */
            activePowerPhC: number;
            /** ID=0x0a0c | type=INT16 | default=-32768 */
            activePowerMinPhC: number;
            /** ID=0x0a0d | type=INT16 | default=-32768 */
            activePowerMaxPhC: number;
            /** ID=0x0a0e | type=INT16 | reportRequired=true | default=-32768 */
            reactivePowerPhC: number;
            /** ID=0x0a0f | type=UINT16 | reportRequired=true | default=65535 */
            apparentPowerPhC: number;
            /** ID=0x0a10 | type=INT8 | min=-100 | max=100 | default=0 */
            powerFactorPhC: number;
            /** ID=0x0a11 | type=UINT16 | writable=true | default=0 */
            averageRmsVoltageMeasPeriodPhC: number;
            /** ID=0x0a12 | type=UINT16 | writable=true | default=0 */
            averageRmsOverVoltageCounterPhC: number;
            /** ID=0x0a13 | type=UINT16 | writable=true | default=0 */
            averageUnderVoltageCounterPhC: number;
            /** ID=0x0a14 | type=UINT16 | writable=true | default=0 */
            rmsExtremeOverVoltagePeriodPhC: number;
            /** ID=0x0a15 | type=UINT16 | writable=true | default=0 */
            rmsExtremeUnderVoltagePeriodPhC: number;
            /** ID=0x0a16 | type=UINT16 | writable=true | default=0 */
            rmsVoltageSagPeriodPhC: number;
            /** ID=0x0a17 | type=UINT16 | writable=true | default=0 */
            rmsVoltageSwellPeriodPhC: number;
            /** ID=0x4300 | type=INT32 | manufacturerCode=SCHNEIDER_ELECTRIC(0x105e) */
            schneiderActivePowerDemandTotal?: number;
            /** ID=0x4303 | type=INT32 | manufacturerCode=SCHNEIDER_ELECTRIC(0x105e) */
            schneiderReactivePowerDemandTotal?: number;
            /** ID=0x4318 | type=INT32 | manufacturerCode=SCHNEIDER_ELECTRIC(0x105e) */
            schneiderApparentPowerDemandTotal?: number;
            /** ID=0x4319 | type=UINT24 | manufacturerCode=SCHNEIDER_ELECTRIC(0x105e) */
            schneiderDemandIntervalDuration?: number;
            /** ID=0x4320 | type=UTC | manufacturerCode=SCHNEIDER_ELECTRIC(0x105e) */
            schneiderDemandDateTime?: number;
            /** ID=0x4509 | type=INT32 | manufacturerCode=SCHNEIDER_ELECTRIC(0x105e) */
            schneiderActivePowerDemandPhase1?: number;
            /** ID=0x450a | type=INT32 | manufacturerCode=SCHNEIDER_ELECTRIC(0x105e) */
            schneiderReactivePowerDemandPhase1?: number;
            /** ID=0x450b | type=INT32 | manufacturerCode=SCHNEIDER_ELECTRIC(0x105e) */
            schneiderApparentPowerDemandPhase1?: number;
            /** ID=0x4510 | type=UINT16 | manufacturerCode=SCHNEIDER_ELECTRIC(0x105e) */
            schneiderDemandIntervalMinimalVoltageL1?: number;
            /** ID=0x4513 | type=UINT16 | manufacturerCode=SCHNEIDER_ELECTRIC(0x105e) */
            schneiderDemandIntervalMaximalCurrentI1?: number;
            /** ID=0x4909 | type=INT32 | manufacturerCode=SCHNEIDER_ELECTRIC(0x105e) */
            schneiderActivePowerDemandPhase2?: number;
            /** ID=0x490a | type=INT32 | manufacturerCode=SCHNEIDER_ELECTRIC(0x105e) */
            schneiderReactivePowerDemandPhase2?: number;
            /** ID=0x490b | type=INT32 | manufacturerCode=SCHNEIDER_ELECTRIC(0x105e) */
            schneiderApparentPowerDemandPhase2?: number;
            /** ID=0x4910 | type=UINT16 | manufacturerCode=SCHNEIDER_ELECTRIC(0x105e) */
            schneiderDemandIntervalMinimalVoltageL2?: number;
            /** ID=0x4913 | type=UINT16 | manufacturerCode=SCHNEIDER_ELECTRIC(0x105e) */
            schneiderDemandIntervalMaximalCurrentI2?: number;
            /** ID=0x4a09 | type=INT32 | manufacturerCode=SCHNEIDER_ELECTRIC(0x105e) */
            schneiderActivePowerDemandPhase3?: number;
            /** ID=0x4a0a | type=INT32 | manufacturerCode=SCHNEIDER_ELECTRIC(0x105e) */
            schneiderReactivePowerDemandPhase3?: number;
            /** ID=0x4a0b | type=INT32 | manufacturerCode=SCHNEIDER_ELECTRIC(0x105e) */
            schneiderApparentPowerDemandPhase3?: number;
            /** ID=0x4a10 | type=UINT16 | manufacturerCode=SCHNEIDER_ELECTRIC(0x105e) */
            schneiderDemandIntervalMinimalVoltageL3?: number;
            /** ID=0x4a13 | type=UINT16 | manufacturerCode=SCHNEIDER_ELECTRIC(0x105e) */
            schneiderDemandIntervalMaximalCurrentI3?: number;
            /** ID=0x4e00 | type=UINT8 | manufacturerCode=SCHNEIDER_ELECTRIC(0x105e) */
            schneiderCurrentSensorMultiplier?: number;
        };
        commands: {
            /** ID=0x00 */
            getProfileInfo: {
                /** type=UINT8 */
                profileCount: number;
                /** type=ENUM8 */
                profileIntervalPeriod: number;
                /** type=UINT8 */
                maxNumberOfIntervals: number;
                /** type=BUFFER | arrayLengthSize=0 */
                listOfAttributes: Buffer;
            };
            /** ID=0x01 */
            getMeasurementProfile: {
                /** type=UINT16 */
                attrId: number;
                /** type=UINT32 */
                starttime: number;
                /** type=UINT8 */
                numofuntervals: number;
                /** type=UINT8 */
                numberOfIntervalsDelivered: number;
                /** type=ATTR_ID */
                attributeId: number;
                /** type=BUFFER | arrayLengthSize=0 */
                intervals: Buffer;
            };
        };
        commandResponses: {
            /** ID=0x00 */
            getProfileInfoRsp: {
                /** type=UINT8 */
                profilecount: number;
                /** type=UINT8 */
                profileintervalperiod: number;
                /** type=UINT8 */
                maxnumofintervals: number;
                /** type=UINT8 */
                numofattrs: number;
                /** type=LIST_UINT16 */
                listofattr: number[];
            };
            /** ID=0x01 */
            getMeasurementProfileRsp: {
                /** type=UINT32 */
                starttime: number;
                /** type=UINT8 */
                status: number;
                /** type=UINT8 */
                profileintervalperiod: number;
                /** type=UINT8 */
                numofintervalsdeliv: number;
                /** type=UINT16 */
                attrId: number;
                /** type=LIST_UINT8 */
                intervals: number[];
            };
        };
    };
    haDiagnostic: {
        attributes: {
            /** ID=0x0000 | type=UINT16 | max=65535 | default=0 */
            numberOfResets: number;
            /** ID=0x0001 | type=UINT16 | max=65535 | default=0 */
            persistentMemoryWrites: number;
            /** ID=0x0100 | type=UINT32 | max=4294967295 | default=0 */
            macRxBcast: number;
            /** ID=0x0101 | type=UINT32 | max=4294967295 | default=0 */
            macTxBcast: number;
            /** ID=0x0102 | type=UINT32 | max=4294967295 | default=0 */
            macRxUcast: number;
            /** ID=0x0103 | type=UINT32 | max=4294967295 | default=0 */
            macTxUcast: number;
            /** ID=0x0104 | type=UINT16 | max=65535 | default=0 */
            macTxUcastRetry: number;
            /** ID=0x0105 | type=UINT16 | max=65535 | default=0 */
            macTxUcastFail: number;
            /** ID=0x0106 | type=UINT16 | max=65535 | default=0 */
            aPSRxBcast: number;
            /** ID=0x0107 | type=UINT16 | max=65535 | default=0 */
            aPSTxBcast: number;
            /** ID=0x0108 | type=UINT16 | max=65535 | default=0 */
            aPSRxUcast: number;
            /** ID=0x0109 | type=UINT16 | max=65535 | default=0 */
            aPSTxUcastSuccess: number;
            /** ID=0x010a | type=UINT16 | max=65535 | default=0 */
            aPSTxUcastRetry: number;
            /** ID=0x010b | type=UINT16 | max=65535 | default=0 */
            aPSTxUcastFail: number;
            /** ID=0x010c | type=UINT16 | max=65535 | default=0 */
            routeDiscInitiated: number;
            /** ID=0x010d | type=UINT16 | max=65535 | default=0 */
            neighborAdded: number;
            /** ID=0x010e | type=UINT16 | max=65535 | default=0 */
            neighborRemoved: number;
            /** ID=0x010f | type=UINT16 | max=65535 | default=0 */
            neighborStale: number;
            /** ID=0x0110 | type=UINT16 | max=65535 | default=0 */
            joinIndication: number;
            /** ID=0x0111 | type=UINT16 | max=65535 | default=0 */
            childMoved: number;
            /** ID=0x0112 | type=UINT16 | max=65535 | default=0 */
            nwkFcFailure: number;
            /** ID=0x0113 | type=UINT16 | max=65535 | default=0 */
            apsFcFailure: number;
            /** ID=0x0114 | type=UINT16 | max=65535 | default=0 */
            apsUnauthorizedKey: number;
            /** ID=0x0115 | type=UINT16 | max=65535 | default=0 */
            nwkDecryptFailures: number;
            /** ID=0x0116 | type=UINT16 | max=65535 | default=0 */
            apsDecryptFailures: number;
            /** ID=0x0117 | type=UINT16 | max=65535 | default=0 */
            packetBufferAllocateFailures: number;
            /** ID=0x0118 | type=UINT16 | max=65535 | default=0 */
            relayedUcast: number;
            /** ID=0x0119 | type=UINT16 | max=65535 | default=0 */
            phyToMacQueueLimitReached: number;
            /** ID=0x011a | type=UINT16 | max=65535 | default=0 */
            packetValidateDropCount: number;
            /** ID=0x011b | type=UINT16 | max=65535 | default=0 */
            averageMacRetryPerApsMessageSent: number;
            /** ID=0x011c | type=UINT8 | max=255 | default=0 */
            lastMessageLqi: number;
            /** ID=0x011d | type=INT8 | min=-127 | max=127 | default=0 */
            lastMessageRssi: number;
            /** ID=0x4000 | type=BITMAP16 | manufacturerCode=DANFOSS_A_S(0x1246) */
            danfossSystemStatusCode?: number;
            /** ID=0x4000 | type=UINT8 | manufacturerCode=SCHNEIDER_ELECTRIC(0x105e) */
            schneiderCommunicationQuality?: number;
            /** ID=0x4031 | type=ENUM8 | manufacturerCode=DANFOSS_A_S(0x1246) */
            danfossHeatSupplyRequest?: number;
            /** ID=0x4200 | type=ENUM8 | manufacturerCode=DANFOSS_A_S(0x1246) */
            danfossSystemStatusWater?: number;
            /** ID=0x4201 | type=ENUM8 | manufacturerCode=DANFOSS_A_S(0x1246) */
            danfossMultimasterRole?: number;
            /** ID=0x4210 | type=ENUM8 | manufacturerCode=DANFOSS_A_S(0x1246) */
            danfossIconApplication?: number;
            /** ID=0x4220 | type=ENUM8 | manufacturerCode=DANFOSS_A_S(0x1246) */
            danfossIconForcedHeatingCooling?: number;
            /** ID=0xff01 | type=UINT32 | manufacturerCode=SCHNEIDER_ELECTRIC(0x105e) */
            schneiderMeterStatus?: number;
            /** ID=0xff02 | type=UINT32 | manufacturerCode=SCHNEIDER_ELECTRIC(0x105e) */
            schneiderDiagnosticRegister1?: number;
        };
        commands: never;
        commandResponses: never;
    };
    touchlink: {
        attributes: never;
        commands: {
            /** ID=0x00 | response=1 | required=true */
            scanRequest: {
                /** type=UINT32 */
                transactionID: number;
                /** type=BITMAP8 */
                zigbeeInformation: number;
                /** type=BITMAP8 */
                touchlinkInformation: number;
            };
            /** ID=0x02 | response=3 | required=true */
            deviceInformation: {
                /** type=UINT32 */
                transactionID: number;
                /** type=UINT8 */
                startIndex: number;
            };
            /** ID=0x06 | required=true */
            identifyRequest: {
                /** type=UINT32 */
                transactionID: number;
                /** type=UINT16 | special=ExitIdentifyMode,0000,IdentifyForReceiverKnownTime,ffff */
                duration: number;
            };
            /** ID=0x07 | required=true */
            resetToFactoryNew: {
                /** type=UINT32 */
                transactionID: number;
            };
            /** ID=0x10 | response=17 | required=true */
            networkStart: {
                /** type=UINT32 */
                transactionID: number;
                /** type=IEEE_ADDR */
                extendedPANID: string;
                /** type=UINT8 */
                keyIndex: number;
                /** type=SEC_KEY */
                encryptedNetworkKey: Buffer;
                /** type=UINT8 */
                logicalChannel: number;
                /** type=UINT16 */
                panID: number;
                /** type=UINT16 | minInclusive=1 | maxInclusive=65527 */
                nwkAddr: number;
                /** type=UINT16 */
                groupIDsBegin: number;
                /** type=UINT16 */
                groupIDsEnd: number;
                /** type=UINT16 */
                freeNwkAddrRangeBegin: number;
                /** type=UINT16 */
                freeNwkAddrRangeEnd: number;
                /** type=UINT16 */
                freeGroupIDRangeBegin: number;
                /** type=UINT16 */
                freeGroupIDRangeEnd: number;
                /** type=IEEE_ADDR */
                initiatorIEEE: string;
                /** type=UINT16 */
                initiatorNwkAddr: number;
            };
            /** ID=0x12 | response=19 | required=true */
            networkJoinRouter: {
                /** type=UINT32 */
                transactionID: number;
                /** type=IEEE_ADDR */
                extendedPANID: string;
                /** type=UINT8 */
                keyIndex: number;
                /** type=SEC_KEY */
                encryptedNetworkKey: Buffer;
                /** type=UINT8 */
                networkUpdateID: number;
                /** type=UINT8 */
                logicalChannel: number;
                /** type=UINT16 */
                panID: number;
                /** type=UINT16 */
                nwkAddr: number;
                /** type=UINT16 */
                groupIDsBegin: number;
                /** type=UINT16 */
                groupIDsEnd: number;
                /** type=UINT16 */
                freeNwkAddrRangeBegin: number;
                /** type=UINT16 */
                freeNwkAddrRangeEnd: number;
                /** type=UINT16 */
                freeGroupIDRangeBegin: number;
                /** type=UINT16 */
                freeGroupIDRangeEnd: number;
            };
            /** ID=0x14 | response=21 | required=true */
            networkJoinEndDevice: {
                /** type=UINT32 */
                transactionID: number;
                /** type=IEEE_ADDR */
                extendedPANID: string;
                /** type=UINT8 */
                keyIndex: number;
                /** type=SEC_KEY */
                encryptedNetworkKey: Buffer;
                /** type=UINT8 */
                networkUpdateID: number;
                /** type=UINT8 */
                logicalChannel: number;
                /** type=UINT16 */
                panID: number;
                /** type=UINT16 */
                nwkAddr: number;
                /** type=UINT16 */
                groupIDsBegin: number;
                /** type=UINT16 */
                groupIDsEnd: number;
                /** type=UINT16 */
                freeNwkAddrRangeBegin: number;
                /** type=UINT16 */
                freeNwkAddrRangeEnd: number;
                /** type=UINT16 */
                freeGroupIDRangeBegin: number;
                /** type=UINT16 */
                freeGroupIDRangeEnd: number;
            };
            /** ID=0x16 | required=true */
            networkUpdate: {
                /** type=UINT32 */
                transactionID: number;
                /** type=IEEE_ADDR */
                extendedPANID: string;
                /** type=UINT8 */
                networkUpdateID: number;
                /** type=UINT8 */
                logicalChannel: number;
                /** type=UINT16 */
                panID: number;
                /** type=UINT16 */
                nwkAddr: number;
            };
            /** ID=0x41 | response=65 */
            getGroupIdentifiers: {
                /** type=UINT8 */
                startIndex: number;
            };
            /** ID=0x42 | response=66 */
            getEndpointList: {
                /** type=UINT8 */
                startIndex: number;
            };
        };
        commandResponses: {
            /** ID=0x01 | required=true */
            scanResponse: {
                /** type=UINT32 */
                transactionID: number;
                /** type=UINT8 | minInclusive=0 | maxInclusive=20 */
                rssiCorrection: number;
                /** type=UINT8 */
                zigbeeInformation: number;
                /** type=UINT8 */
                touchlinkInformation: number;
                /** type=UINT16 */
                keyBitmask: number;
                /** type=UINT32 */
                responseID: number;
                /** type=IEEE_ADDR */
                extendedPanID: string;
                /** type=UINT8 */
                networkUpdateID: number;
                /** type=UINT8 */
                logicalChannel: number;
                /** type=UINT16 */
                panID: number;
                /** type=UINT16 */
                networkAddress: number;
                /** type=UINT8 */
                numberOfSubDevices: number;
                /** type=UINT8 */
                totalGroupIdentifiers: number;
                /** type=UINT8 | conditions=[{fieldEquals field=numberOfSubDevices value=1}] */
                endpointID?: number;
                /** type=UINT16 | conditions=[{fieldEquals field=numberOfSubDevices value=1}] */
                profileID?: number;
                /** type=UINT16 | conditions=[{fieldEquals field=numberOfSubDevices value=1}] */
                deviceID?: number;
                /** type=UINT8 | conditions=[{fieldEquals field=numberOfSubDevices value=1}] */
                version?: number;
                /** type=UINT8 | conditions=[{fieldEquals field=numberOfSubDevices value=1}] */
                groupIDCount?: number;
            };
            /** ID=0x03 | required=true */
            deviceInformation: {
                /** type=UINT32 */
                transactionID: number;
                /** type=UINT8 */
                numberOfSubDevices: number;
                /** type=UINT8 */
                startIndex: number;
                /** type=UINT8 */
                deviceInfoCount: number;
                /** type=BUFFER | minLength=0 | maxLength=5 */
                deviceInformationRecordList: Buffer;
            };
            /** ID=0x11 | required=true */
            networkStart: {
                /** type=UINT32 */
                transactionID: number;
                /** type=ENUM8 */
                status: number;
                /** type=IEEE_ADDR */
                extendedPANID: string;
                /** type=UINT8 */
                networkUpdateID: number;
                /** type=UINT8 */
                logicalChannel: number;
                /** type=UINT16 */
                panID: number;
            };
            /** ID=0x13 | required=true */
            networkJoinRouter: {
                /** type=UINT32 */
                transactionID: number;
                /** type=ENUM8 */
                status: number;
            };
            /** ID=0x15 | required=true */
            networkJoinEndDevice: {
                /** type=UINT32 */
                transactionID: number;
                /** type=ENUM8 */
                status: number;
            };
            /** ID=0x40 */
            endpointInformation: {
                /** type=IEEE_ADDR */
                ieeeAddress: string;
                /** type=UINT16 */
                networkAddress: number;
                /** type=UINT8 */
                endpointID: number;
                /** type=UINT16 */
                profileID: number;
                /** type=UINT16 */
                deviceID: number;
                /** type=UINT8 */
                version: number;
            };
            /** ID=0x41 */
            getGroupIdentifiers: {
                /** type=UINT8 */
                total: number;
                /** type=UINT8 */
                startIndex: number;
                /** type=UINT8 */
                count: number;
                /** type=BUFFER */
                groupInformationRecordList: Buffer;
            };
            /** ID=0x42 */
            getEndpointList: {
                /** type=UINT8 */
                total: number;
                /** type=UINT8 */
                startIndex: number;
                /** type=UINT8 */
                count: number;
                /** type=BUFFER */
                endpointInformationRecordList: Buffer;
            };
        };
    };
    manuSpecificClusterAduroSmart: {
        attributes: never;
        commands: {
            /** ID=0x00 */
            cmd0: Record<string, never>;
        };
        commandResponses: never;
    };
    manuSpecificOsram: {
        attributes: never;
        commands: {
            /** ID=0x01 */
            saveStartupParams: Record<string, never>;
            /** ID=0x02 */
            resetStartupParams: Record<string, never>;
        };
        commandResponses: {
            /** ID=0x00 */
            saveStartupParamsRsp: Record<string, never>;
        };
    };
    manuSpecificPhilips: {
        attributes: {
            /** ID=0x0031 | type=BITMAP16 */
            config: number;
        };
        commands: never;
        commandResponses: {
            /** ID=0x00 */
            hueNotification: {
                /** type=UINT8 */
                button: number;
                /** type=UINT24 */
                unknown1: number;
                /** type=UINT8 */
                type: number;
                /** type=UINT8 */
                unknown2: number;
                /** type=UINT8 */
                time: number;
                /** type=UINT8 */
                unknown3: number;
            };
        };
    };
    manuSpecificPhilips2: {
        attributes: {
            /** ID=0x0002 | type=OCTET_STR */
            state: Buffer;
        };
        commands: {
            /** ID=0x00 */
            multiColor: {
                /** type=BUFFER */
                data: Buffer;
            };
        };
        commandResponses: never;
    };
    manuSpecificSinope: {
        attributes: {
            /** ID=0x0002 | type=ENUM8 */
            keypadLockout: number;
            /** ID=0x0004 | type=CHAR_STR */
            firmwareVersion: string;
            /** ID=0x0010 | type=INT16 */
            outdoorTempToDisplay: number;
            /** ID=0x0011 | type=UINT16 */
            outdoorTempToDisplayTimeout: number;
            /** ID=0x0012 | type=ENUM8 */
            secondScreenBehavior: number;
            /** ID=0x0020 | type=UINT32 */
            currentTimeToDisplay: number;
            /** ID=0x0052 | type=UINT8 */
            ledIntensityOn: number;
            /** ID=0x0053 | type=UINT8 */
            ledIntensityOff: number;
            /** ID=0x0050 | type=UINT24 */
            ledColorOn: number;
            /** ID=0x0051 | type=UINT24 */
            ledColorOff: number;
            /** ID=0x0052 | type=UINT8 */
            onLedIntensity: number;
            /** ID=0x0053 | type=UINT8 */
            offLedIntensity: number;
            /** ID=0x0054 | type=ENUM8 */
            actionReport: number;
            /** ID=0x0055 | type=UINT16 */
            minimumBrightness: number;
            /** ID=0x0060 | type=UINT16 */
            connectedLoadRM: number;
            /** ID=0x0070 | type=BITMAP8 */
            currentLoad: number;
            /** ID=0x0071 | type=INT8 */
            ecoMode: number;
            /** ID=0x0072 | type=UINT8 */
            ecoMode1: number;
            /** ID=0x0073 | type=UINT8 */
            ecoMode2: number;
            /** ID=0x0075 | type=BITMAP32 */
            unknown: number;
            /** ID=0x0076 | type=UINT8 */
            drConfigWaterTempMin: number;
            /** ID=0x0077 | type=UINT8 */
            drConfigWaterTempTime: number;
            /** ID=0x0078 | type=UINT16 */
            drWTTimeOn: number;
            /** ID=0x0080 | type=UINT32 */
            unknown1: number;
            /** ID=0x00a0 | type=UINT32 */
            dimmerTimmer: number;
            /** ID=0x0100 | type=UINT8 */
            unknown2: number;
            /** ID=0x0105 | type=ENUM8 */
            floorControlMode: number;
            /** ID=0x0106 | type=ENUM8 */
            auxOutputMode: number;
            /** ID=0x0107 | type=INT16 */
            floorTemperature: number;
            /** ID=0x0108 | type=INT16 */
            ambiantMaxHeatSetpointLimit: number;
            /** ID=0x0109 | type=INT16 */
            floorMinHeatSetpointLimit: number;
            /** ID=0x010a | type=INT16 */
            floorMaxHeatSetpointLimit: number;
            /** ID=0x010b | type=ENUM8 */
            temperatureSensor: number;
            /** ID=0x010c | type=ENUM8 */
            floorLimitStatus: number;
            /** ID=0x010d | type=INT16 */
            roomTemperature: number;
            /** ID=0x0114 | type=ENUM8 */
            timeFormatToDisplay: number;
            /** ID=0x0115 | type=ENUM8 */
            GFCiStatus: number;
            /** ID=0x0118 | type=UINT16 */
            auxConnectedLoad: number;
            /** ID=0x0119 | type=UINT16 */
            connectedLoad: number;
            /** ID=0x0128 | type=UINT8 */
            pumpProtection: number;
            /** ID=0x012a | type=ENUM8 */
            unknown3: number;
            /** ID=0x012b | type=INT16 */
            currentSetpoint: number;
            /** ID=0x012d | type=INT16 */
            reportLocalTemperature: number;
            /** ID=0x0240 | type=ARRAY */
            flowMeterConfig: ZclArray | unknown[];
            /** ID=0x0283 | type=UINT8 */
            coldLoadPickupStatus: number;
        };
        commands: never;
        commandResponses: never;
    };
    manuSpecificLegrandDevices: {
        attributes: never;
        commands: never;
        commandResponses: never;
    };
    manuSpecificLegrandDevices2: {
        attributes: never;
        commands: {
            /** ID=0x00 */
            command0: {
                /** type=BUFFER */
                data: Buffer;
            };
        };
        commandResponses: never;
    };
    manuSpecificLegrandDevices3: {
        attributes: never;
        commands: {
            /** ID=0x00 */
            command0: {
                /** type=BUFFER */
                data: Buffer;
            };
        };
        commandResponses: never;
    };
    wiserDeviceInfo: {
        attributes: {
            /** ID=0x0020 | type=CHAR_STR */
            deviceInfo: string;
        };
        commands: never;
        commandResponses: never;
    };
    manuSpecificTuya: {
        attributes: never;
        commands: {
            /** ID=0x00 */
            dataRequest: {
                /** type=UINT16 */
                seq: number;
                /** type=LIST_TUYA_DATAPOINT_VALUES */
                dpValues: TuyaDataPointValue[];
            };
            /** ID=0x03 */
            dataQuery: Record<string, never>;
            /** ID=0x10 */
            mcuVersionRequest: {
                /** type=UINT16 */
                seq: number;
            };
            /** ID=0x04 */
            sendData: {
                /** type=UINT16 */
                seq: number;
                /** type=LIST_TUYA_DATAPOINT_VALUES */
                dpValues: TuyaDataPointValue[];
            };
            /** ID=0x12 */
            mcuOtaNotify: {
                /** type=UINT16 */
                seq: number;
                /** type=UINT32 */
                key_hi: number;
                /** type=UINT32 */
                key_lo: number;
                /** type=UINT8 */
                version: number;
                /** type=UINT32 */
                imageSize: number;
                /** type=UINT32 */
                crc: number;
            };
            /** ID=0x14 */
            mcuOtaBlockDataResponse: {
                /** type=UINT16 */
                seq: number;
                /** type=UINT8 */
                status: number;
                /** type=UINT32 */
                key_hi: number;
                /** type=UINT32 */
                key_lo: number;
                /** type=UINT8 */
                version: number;
                /** type=UINT32 */
                offset: number;
                /** type=LIST_UINT8 */
                imageData: number[];
            };
            /** ID=0x24 */
            mcuSyncTime: {
                /** type=UINT16 */
                payloadSize: number;
                /** type=LIST_UINT8 */
                payload: number[];
            };
            /** ID=0x25 */
            mcuGatewayConnectionStatus: {
                /** type=UINT16 */
                payloadSize: number;
                /** type=UINT8 */
                payload: number;
            };
        };
        commandResponses: {
            /** ID=0x01 */
            dataResponse: {
                /** type=UINT16 */
                seq: number;
                /** type=LIST_TUYA_DATAPOINT_VALUES */
                dpValues: TuyaDataPointValue[];
            };
            /** ID=0x02 */
            dataReport: {
                /** type=UINT16 */
                seq: number;
                /** type=LIST_TUYA_DATAPOINT_VALUES */
                dpValues: TuyaDataPointValue[];
            };
            /** ID=0x05 */
            activeStatusReportAlt: {
                /** type=UINT16 */
                seq: number;
                /** type=LIST_TUYA_DATAPOINT_VALUES */
                dpValues: TuyaDataPointValue[];
            };
            /** ID=0x06 */
            activeStatusReport: {
                /** type=UINT16 */
                seq: number;
                /** type=LIST_TUYA_DATAPOINT_VALUES */
                dpValues: TuyaDataPointValue[];
            };
            /** ID=0x11 */
            mcuVersionResponse: {
                /** type=UINT16 */
                seq: number;
                /** type=UINT8 */
                version: number;
            };
            /** ID=0x13 */
            mcuOtaBlockDataRequest: {
                /** type=UINT16 */
                seq: number;
                /** type=UINT32 */
                key_hi: number;
                /** type=UINT32 */
                key_lo: number;
                /** type=UINT8 */
                version: number;
                /** type=UINT32 */
                offset: number;
                /** type=UINT32 */
                size: number;
            };
            /** ID=0x15 */
            mcuOtaResult: {
                /** type=UINT16 */
                seq: number;
                /** type=UINT8 */
                status: number;
                /** type=UINT32 */
                key_hi: number;
                /** type=UINT32 */
                key_lo: number;
                /** type=UINT8 */
                version: number;
            };
            /** ID=0x24 */
            mcuSyncTime: {
                /** type=UINT16 */
                payloadSize: number;
            };
            /** ID=0x25 */
            mcuGatewayConnectionStatus: {
                /** type=UINT16 */
                payloadSize: number;
            };
        };
    };
    manuSpecificLumi: {
        attributes: {
            /** ID=0x0009 | type=UINT8 */
            mode: number;
            /** ID=0x0112 | type=UINT32 */
            illuminance: number;
            /** ID=0x0114 | type=UINT8 */
            displayUnit: number;
            /** ID=0x0129 | type=UINT8 */
            airQuality: number;
            /** ID=0x0400 | type=BOOLEAN */
            curtainReverse: number;
            /** ID=0x0401 | type=BOOLEAN */
            curtainHandOpen: number;
            /** ID=0x0402 | type=BOOLEAN */
            curtainCalibrated: number;
        };
        commands: never;
        commandResponses: never;
    };
    liXeePrivate: {
        attributes: {
            /** ID=0x0000 | type=CHAR_STR */
            currentTarif: string;
            /** ID=0x0001 | type=CHAR_STR */
            tomorrowColor: string;
            /** ID=0x0002 | type=UINT8 */
            scheduleHPHC: number;
            /** ID=0x0003 | type=UINT8 */
            presencePotential: number;
            /** ID=0x0004 | type=UINT8 */
            startNoticeEJP: number;
            /** ID=0x0005 | type=UINT16 */
            warnDPS: number;
            /** ID=0x0006 | type=UINT16 */
            warnDIR1: number;
            /** ID=0x0007 | type=UINT16 */
            warnDIR2: number;
            /** ID=0x0008 | type=UINT16 */
            warnDIR3: number;
            /** ID=0x0009 | type=CHAR_STR */
            motDEtat: string;
            /** ID=0x0200 | type=CHAR_STR */
            currentPrice: string;
            /** ID=0x0201 | type=UINT8 */
            currentIndexTarif: number;
            /** ID=0x0202 | type=CHAR_STR */
            currentDate: string;
            /** ID=0x0203 | type=UINT32 */
            activeEnergyOutD01: number;
            /** ID=0x0204 | type=UINT32 */
            activeEnergyOutD02: number;
            /** ID=0x0205 | type=UINT32 */
            activeEnergyOutD03: number;
            /** ID=0x0206 | type=UINT32 */
            activeEnergyOutD04: number;
            /** ID=0x0207 | type=UINT16 */
            injectedVA: number;
            /** ID=0x0208 | type=INT16 */
            injectedVAMaxN: number;
            /** ID=0x0209 | type=INT16 */
            injectedVAMaxN1: number;
            /** ID=0x0210 | type=INT16 */
            injectedActiveLoadN: number;
            /** ID=0x0211 | type=INT16 */
            injectedActiveLoadN1: number;
            /** ID=0x0212 | type=INT16 */
            drawnVAMaxN1: number;
            /** ID=0x0213 | type=INT16 */
            drawnVAMaxN1P2: number;
            /** ID=0x0214 | type=INT16 */
            drawnVAMaxN1P3: number;
            /** ID=0x0215 | type=CHAR_STR */
            message1: string;
            /** ID=0x0216 | type=CHAR_STR */
            message2: string;
            /** ID=0x0217 | type=OCTET_STR */
            statusRegister: Buffer;
            /** ID=0x0218 | type=UINT8 */
            startMobilePoint1: number;
            /** ID=0x0219 | type=UINT8 */
            stopMobilePoint1: number;
            /** ID=0x0220 | type=UINT8 */
            startMobilePoint2: number;
            /** ID=0x0221 | type=UINT8 */
            stopMobilePoint2: number;
            /** ID=0x0222 | type=UINT8 */
            startMobilePoint3: number;
            /** ID=0x0223 | type=UINT8 */
            stopMobilePoint3: number;
            /** ID=0x0224 | type=UINT16 */
            relais: number;
            /** ID=0x0225 | type=UINT8 */
            daysNumberCurrentCalendar: number;
            /** ID=0x0226 | type=UINT8 */
            daysNumberNextCalendar: number;
            /** ID=0x0227 | type=LONG_OCTET_STR */
            daysProfileCurrentCalendar: Buffer;
            /** ID=0x0228 | type=LONG_OCTET_STR */
            daysProfileNextCalendar: Buffer;
            /** ID=0x0300 | type=UINT8 */
            linkyMode: number;
        };
        commands: never;
        commandResponses: never;
    };
    manuSpecificTuya2: {
        attributes: {
            /** ID=0xd00a | type=INT16 */
            alarm_temperature_max: number;
            /** ID=0xd00b | type=INT16 */
            alarm_temperature_min: number;
            /** ID=0xd00d | type=INT16 */
            alarm_humidity_max: number;
            /** ID=0xd00e | type=INT16 */
            alarm_humidity_min: number;
            /** ID=0xd00f | type=ENUM8 */
            alarm_humidity: number;
            /** ID=0xd006 | type=ENUM8 */
            alarm_temperature: number;
            /** ID=0xd010 | type=UINT8 */
            unknown: number;
        };
        commands: never;
        commandResponses: never;
    };
    manuSpecificTuya3: {
        attributes: {
            /** ID=0xd010 | type=ENUM8 */
            powerOnBehavior: number;
            /** ID=0xd020 | type=ENUM8 */
            switchMode: number;
            /** ID=0xd030 | type=ENUM8 */
            switchType: number;
        };
        commands: {
            /** ID=0xe5 */
            setOptions1: {
                /** type=BUFFER */
                data: Buffer;
            };
            /** ID=0xe6 */
            setOptions2: {
                /** type=BUFFER */
                data: Buffer;
            };
            /** ID=0xe7 */
            setOptions3: {
                /** type=BUFFER */
                data: Buffer;
            };
        };
        commandResponses: never;
    };
    manuSpecificCentraliteHumidity: {
        attributes: {
            /** ID=0x0000 | type=UINT16 */
            measuredValue: number;
        };
        commands: never;
        commandResponses: never;
    };
    manuSpecificSmartThingsArrivalSensor: {
        attributes: never;
        commands: never;
        commandResponses: {
            /** ID=0x01 */
            arrivalSensorNotify: Record<string, never>;
        };
    };
    manuSpecificSamsungAccelerometer: {
        attributes: {
            /** ID=0x0000 | type=UINT8 */
            motion_threshold_multiplier: number;
            /** ID=0x0002 | type=UINT16 */
            motion_threshold: number;
            /** ID=0x0010 | type=BITMAP8 */
            acceleration: number;
            /** ID=0x0012 | type=INT16 */
            x_axis: number;
            /** ID=0x0013 | type=INT16 */
            y_axis: number;
            /** ID=0x0014 | type=INT16 */
            z_axis: number;
        };
        commands: never;
        commandResponses: never;
    };
    heimanSpecificAirQuality: {
        attributes: {
            /** ID=0xf000 | type=UINT8 */
            language: number;
            /** ID=0xf001 | type=UINT8 */
            unitOfMeasure: number;
            /** ID=0xf002 | type=UINT8 */
            batteryState: number;
            /** ID=0xf003 | type=UINT16 */
            pm10measuredValue: number;
            /** ID=0xf004 | type=UINT16 */
            tvocMeasuredValue: number;
            /** ID=0xf005 | type=UINT16 */
            aqiMeasuredValue: number;
            /** ID=0xf006 | type=INT16 */
            temperatureMeasuredMax: number;
            /** ID=0xf007 | type=INT16 */
            temperatureMeasuredMin: number;
            /** ID=0xf008 | type=UINT16 */
            humidityMeasuredMax: number;
            /** ID=0xf009 | type=UINT16 */
            humidityMeasuredMin: number;
            /** ID=0xf00a | type=UINT16 */
            alarmEnable: number;
        };
        commands: {
            /** ID=0x11b */
            setLanguage: {
                /** type=UINT8 */
                languageCode: number;
            };
            /** ID=0x11c */
            setUnitOfTemperature: {
                /** type=UINT8 */
                unitsCode: number;
            };
            /** ID=0x11d */
            getTime: Record<string, never>;
        };
        commandResponses: never;
    };
    heimanSpecificScenes: {
        attributes: never;
        commands: {
            /** ID=0xf0 */
            cinema: Record<string, never>;
            /** ID=0xf1 */
            atHome: Record<string, never>;
            /** ID=0xf2 */
            sleep: Record<string, never>;
            /** ID=0xf3 */
            goOut: Record<string, never>;
            /** ID=0xf4 */
            repast: Record<string, never>;
        };
        commandResponses: never;
    };
    tradfriButton: {
        attributes: never;
        commands: {
            /** ID=0x01 */
            action1: {
                /** type=UINT8 */
                data: number;
            };
            /** ID=0x02 */
            action2: {
                /** type=UINT8 */
                data: number;
            };
            /** ID=0x03 */
            action3: {
                /** type=UINT8 */
                data: number;
            };
            /** ID=0x04 */
            action4: {
                /** type=UINT8 */
                data: number;
            };
            /** ID=0x06 */
            action6: {
                /** type=UINT8 */
                data: number;
            };
        };
        commandResponses: never;
    };
    heimanSpecificInfraRedRemote: {
        attributes: never;
        commands: {
            /** ID=0xf0 */
            sendKey: {
                /** type=UINT8 */
                id: number;
                /** type=UINT8 */
                keyCode: number;
            };
            /** ID=0xf1 */
            studyKey: {
                /** type=UINT8 */
                id: number;
                /** type=UINT8 */
                keyCode: number;
            };
            /** ID=0xf3 */
            deleteKey: {
                /** type=UINT8 */
                id: number;
                /** type=UINT8 */
                keyCode: number;
            };
            /** ID=0xf4 */
            createId: {
                /** type=UINT8 */
                modelType: number;
            };
            /** ID=0xf6 */
            getIdAndKeyCodeList: Record<string, never>;
        };
        commandResponses: {
            /** ID=0xf2 */
            studyKeyRsp: {
                /** type=UINT8 */
                id: number;
                /** type=UINT8 */
                keyCode: number;
                /** type=UINT8 */
                result: number;
            };
            /** ID=0xf5 */
            createIdRsp: {
                /** type=UINT8 */
                id: number;
                /** type=UINT8 */
                modelType: number;
            };
            /** ID=0xf7 */
            getIdAndKeyCodeListRsp: {
                /** type=UINT8 */
                packetsTotal: number;
                /** type=UINT8 */
                packetNumber: number;
                /** type=UINT8 */
                packetLength: number;
                /** type=LIST_UINT8 */
                learnedDevicesList: number[];
            };
        };
    };
    schneiderSpecificPilotMode: {
        attributes: {
            /** ID=0x0031 | type=ENUM8 */
            pilotMode: number;
        };
        commands: never;
        commandResponses: never;
    };
    elkoOccupancySettingClusterServer: {
        attributes: {
            /** ID=0x0000 | type=UINT16 */
            AmbienceLightThreshold: number;
            /** ID=0x0001 | type=ENUM8 */
            OccupancyActions: number;
            /** ID=0x0002 | type=UINT8 */
            UnoccupiedLevelDflt: number;
            /** ID=0x0003 | type=UINT8 */
            UnoccupiedLevel: number;
        };
        commands: never;
        commandResponses: never;
    };
    elkoSwitchConfigurationClusterServer: {
        attributes: {
            /** ID=0x0000 | type=ENUM8 */
            SwitchIndication: number;
            /** ID=0x0010 | type=UINT8 */
            UpSceneID: number;
            /** ID=0x0011 | type=UINT16 */
            UpGroupID: number;
            /** ID=0x0020 | type=UINT8 */
            DownSceneID: number;
            /** ID=0x0021 | type=UINT16 */
            DownGroupID: number;
            /** ID=0x0001 | type=ENUM8 */
            SwitchActions: number;
        };
        commands: never;
        commandResponses: never;
    };
    manuSpecificSchneiderLightSwitchConfiguration: {
        attributes: {
            /** ID=0x0000 | type=ENUM8 */
            ledIndication: number;
            /** ID=0x0010 | type=UINT8 */
            upSceneID: number;
            /** ID=0x0011 | type=UINT16 */
            upGroupID: number;
            /** ID=0x0020 | type=UINT8 */
            downSceneID: number;
            /** ID=0x0021 | type=UINT16 */
            downGroupID: number;
            /** ID=0x0001 | type=ENUM8 */
            switchActions: number;
        };
        commands: never;
        commandResponses: never;
    };
    manuSpecificSchneiderFanSwitchConfiguration: {
        attributes: {
            /** ID=0x0002 | type=UINT8 */
            ledIndication: number;
            /** ID=0x0060 | type=UINT8 */
            ledOrientation: number;
        };
        commands: never;
        commandResponses: never;
    };
    sprutVoc: {
        attributes: {
            /** ID=0x6600 | type=UINT16 */
            voc: number;
        };
        commands: never;
        commandResponses: never;
    };
    sprutNoise: {
        attributes: {
            /** ID=0x6600 | type=SINGLE_PREC */
            noise: number;
            /** ID=0x6601 | type=BITMAP8 */
            noiseDetected: number;
            /** ID=0x6602 | type=SINGLE_PREC */
            noiseDetectLevel: number;
            /** ID=0x6603 | type=UINT16 */
            noiseAfterDetectDelay: number;
        };
        commands: never;
        commandResponses: never;
    };
    sprutIrBlaster: {
        attributes: never;
        commands: {
            /** ID=0x00 */
            playStore: {
                /** type=UINT8 */
                param: number;
            };
            /** ID=0x01 */
            learnStart: {
                /** type=UINT8 */
                value: number;
            };
            /** ID=0x02 */
            learnStop: {
                /** type=UINT8 */
                value: number;
            };
            /** ID=0x03 */
            clearStore: Record<string, never>;
            /** ID=0x04 */
            playRam: Record<string, never>;
            /** ID=0x05 */
            learnRamStart: Record<string, never>;
            /** ID=0x06 */
            learnRamStop: Record<string, never>;
        };
        commandResponses: never;
    };
    manuSpecificSiglisZigfred: {
        attributes: {
            /** ID=0x0008 | type=UINT32 */
            buttonEvent: number;
        };
        commands: {
            /** ID=0x02 */
            siglisZigfredButtonEvent: {
                /** type=UINT8 */
                button: number;
                /** type=UINT8 */
                type: number;
                /** type=UINT16 */
                duration: number;
            };
        };
        commandResponses: never;
    };
    owonClearMetering: {
        attributes: never;
        commands: {
            /** ID=0x00 */
            owonClearMeasurementData: Record<string, never>;
        };
        commandResponses: never;
    };
    zosungIRTransmit: {
        attributes: never;
        commands: {
            /** ID=0x00 */
            zosungSendIRCode00: {
                /** type=UINT16 */
                seq: number;
                /** type=UINT32 */
                length: number;
                /** type=UINT32 */
                unk1: number;
                /** type=UINT16 */
                unk2: number;
                /** type=UINT8 */
                unk3: number;
                /** type=UINT8 */
                cmd: number;
                /** type=UINT16 */
                unk4: number;
            };
            /** ID=0x01 */
            zosungSendIRCode01: {
                /** type=UINT8 */
                zero: number;
                /** type=UINT16 */
                seq: number;
                /** type=UINT32 */
                length: number;
                /** type=UINT32 */
                unk1: number;
                /** type=UINT16 */
                unk2: number;
                /** type=UINT8 */
                unk3: number;
                /** type=UINT8 */
                cmd: number;
                /** type=UINT16 */
                unk4: number;
            };
            /** ID=0x02 */
            zosungSendIRCode02: {
                /** type=UINT16 */
                seq: number;
                /** type=UINT32 */
                position: number;
                /** type=UINT8 */
                maxlen: number;
            };
            /** ID=0x03 */
            zosungSendIRCode03: {
                /** type=UINT8 */
                zero: number;
                /** type=UINT16 */
                seq: number;
                /** type=UINT32 */
                position: number;
                /** type=OCTET_STR */
                msgpart: Buffer;
                /** type=UINT8 */
                msgpartcrc: number;
            };
            /** ID=0x04 */
            zosungSendIRCode04: {
                /** type=UINT8 */
                zero0: number;
                /** type=UINT16 */
                seq: number;
                /** type=UINT16 */
                zero1: number;
            };
            /** ID=0x05 */
            zosungSendIRCode05: {
                /** type=UINT16 */
                seq: number;
                /** type=UINT16 */
                zero: number;
            };
        };
        commandResponses: {
            /** ID=0x03 */
            zosungSendIRCode03Resp: {
                /** type=UINT8 */
                zero: number;
                /** type=UINT16 */
                seq: number;
                /** type=UINT32 */
                position: number;
                /** type=OCTET_STR */
                msgpart: Buffer;
                /** type=UINT8 */
                msgpartcrc: number;
            };
            /** ID=0x05 */
            zosungSendIRCode05Resp: {
                /** type=UINT16 */
                seq: number;
                /** type=UINT16 */
                zero: number;
            };
        };
    };
    zosungIRControl: {
        attributes: never;
        commands: {
            /** ID=0x00 */
            zosungControlIRCommand00: {
                /** type=BUFFER */
                data: Buffer;
            };
        };
        commandResponses: never;
    };
    manuSpecificAssaDoorLock: {
        attributes: {
            /** ID=0x0012 | type=UINT8 */
            autoLockTime: number;
            /** ID=0x0013 | type=UINT8 */
            wrongCodeAttempts: number;
            /** ID=0x0014 | type=UINT8 */
            shutdownTime: number;
            /** ID=0x0015 | type=UINT8 */
            batteryLevel: number;
            /** ID=0x0016 | type=UINT8 */
            insideEscutcheonLED: number;
            /** ID=0x0017 | type=UINT8 */
            volume: number;
            /** ID=0x0018 | type=UINT8 */
            lockMode: number;
            /** ID=0x0019 | type=UINT8 */
            language: number;
            /** ID=0x001a | type=BOOLEAN */
            allCodesLockout: number;
            /** ID=0x001b | type=BOOLEAN */
            oneTouchLocking: number;
            /** ID=0x001c | type=BOOLEAN */
            privacyButtonSetting: number;
            /** ID=0x0021 | type=UINT16 */
            numberLogRecordsSupported: number;
            /** ID=0x0030 | type=UINT8 */
            numberPinsSupported: number;
            /** ID=0x0040 | type=UINT8 */
            numberScheduleSlotsPerUser: number;
            /** ID=0x0050 | type=UINT8 */
            alarmMask: number;
        };
        commands: {
            /** ID=0x10 | response=0 */
            getLockStatus: Record<string, never>;
            /** ID=0x12 */
            getBatteryLevel: Record<string, never>;
            /** ID=0x13 */
            setRFLockoutTime: Record<string, never>;
            /** ID=0x30 */
            userCodeSet: {
                /** type=CHAR_STR */
                payload: string;
            };
            /** ID=0x31 */
            userCodeGet: {
                /** type=CHAR_STR */
                payload: string;
            };
            /** ID=0x32 */
            userCodeClear: {
                /** type=CHAR_STR */
                payload: string;
            };
            /** ID=0x33 */
            clearAllUserCodes: Record<string, never>;
            /** ID=0x34 */
            setUserCodeStatus: Record<string, never>;
            /** ID=0x35 */
            getUserCodeStatus: Record<string, never>;
            /** ID=0x36 */
            getLastUserIdEntered: Record<string, never>;
            /** ID=0x37 */
            userAdded: Record<string, never>;
            /** ID=0x38 */
            userDeleted: Record<string, never>;
            /** ID=0x40 */
            setScheduleSlot: {
                /** type=CHAR_STR */
                payload: string;
            };
            /** ID=0x41 */
            getScheduleSlot: {
                /** type=CHAR_STR */
                payload: string;
            };
            /** ID=0x42 */
            setScheduleSlotStatus: {
                /** type=CHAR_STR */
                payload: string;
            };
            /** ID=0x60 | response=1 */
            reflash: {
                /** type=CHAR_STR */
                payload: string;
            };
            /** ID=0x61 | response=2 */
            reflashData: {
                /** type=CHAR_STR */
                payload: string;
            };
            /** ID=0x62 | response=3 */
            reflashStatus: {
                /** type=CHAR_STR */
                payload: string;
            };
            /** ID=0x90 */
            getReflashLock: Record<string, never>;
            /** ID=0xa0 */
            getHistory: Record<string, never>;
            /** ID=0xa1 */
            getLogin: Record<string, never>;
            /** ID=0xa2 */
            getUser: Record<string, never>;
            /** ID=0xa3 */
            getUsers: Record<string, never>;
            /** ID=0xb0 */
            getMandatoryAttributes: Record<string, never>;
            /** ID=0xb1 */
            readAttribute: Record<string, never>;
            /** ID=0xb2 */
            writeAttribute: Record<string, never>;
            /** ID=0xb3 */
            configureReporting: Record<string, never>;
            /** ID=0xb4 */
            getBasicClusterAttributes: Record<string, never>;
        };
        commandResponses: {
            /** ID=0x00 */
            getLockStatusRsp: {
                /** type=UINT8 */
                status: number;
            };
            /** ID=0x01 */
            reflashRsp: {
                /** type=UINT8 */
                status: number;
            };
            /** ID=0x02 */
            reflashDataRsp: {
                /** type=UINT8 */
                status: number;
            };
            /** ID=0x03 */
            reflashStatusRsp: {
                /** type=UINT8 */
                status: number;
            };
        };
    };
    manuSpecificDoorman: {
        attributes: never;
        commands: {
            /** ID=0xfc */
            getConfigurationParameter: {
                /** type=CHAR_STR */
                payload: string;
            };
            /** ID=0xfd */
            setConfigurationParameter: {
                /** type=CHAR_STR */
                payload: string;
            };
            /** ID=0x25 */
            integrationModeActivation: {
                /** type=CHAR_STR */
                payload: string;
            };
            /** ID=0x4e */
            armDisarm: {
                /** type=CHAR_STR */
                payload: string;
            };
        };
        commandResponses: never;
    };
    manuSpecificProfalux1: {
        attributes: {
            /** ID=0x0000 | type=UINT8 */
            motorCoverType: number;
        };
        commands: never;
        commandResponses: never;
    };
    manuSpecificAmazonWWAH: {
        attributes: {
            /** ID=0x0002 | type=BOOLEAN */
            disableOTADowngrades: number;
            /** ID=0x0003 | type=BOOLEAN */
            mgmtLeaveWithoutRejoinEnabled: number;
            /** ID=0x0004 | type=UINT8 */
            nwkRetryCount: number;
            /** ID=0x0005 | type=UINT8 */
            macRetryCount: number;
            /** ID=0x0006 | type=BOOLEAN */
            routerCheckInEnabled: number;
            /** ID=0x0007 | type=BOOLEAN */
            touchlinkInterpanEnabled: number;
            /** ID=0x0008 | type=BOOLEAN */
            wwahParentClassificationEnabled: number;
            /** ID=0x0009 | type=BOOLEAN */
            wwahAppEventRetryEnabled: number;
            /** ID=0x000a | type=UINT8 */
            wwahAppEventRetryQueueSize: number;
            /** ID=0x000b | type=BOOLEAN */
            wwahRejoinEnabled: number;
            /** ID=0x000c | type=UINT8 */
            macPollFailureWaitTime: number;
            /** ID=0x000d | type=BOOLEAN */
            configurationModeEnabled: number;
            /** ID=0x000e | type=UINT8 */
            currentDebugReportID: number;
            /** ID=0x000f | type=BOOLEAN */
            tcSecurityOnNwkKeyRotationEnabled: number;
            /** ID=0x0010 | type=BOOLEAN */
            wwahBadParentRecoveryEnabled: number;
            /** ID=0x0011 | type=UINT8 */
            pendingNetworkUpdateChannel: number;
            /** ID=0x0012 | type=UINT16 */
            pendingNetworkUpdatePANID: number;
            /** ID=0x0013 | type=UINT16 */
            otaMaxOfflineDuration: number;
            /** ID=0xfffd | type=UINT16 */
            clusterRevision: number;
        };
        commands: {
            /** ID=0x0a */
            clearBindingTable: Record<string, never>;
        };
        commandResponses: never;
    };
}

export interface TFoundation {
    /** ID: 0 */
    read: {
        /** Type: UINT16 */
        attrId: number;
    }[];
    /** ID: 1 */
    readRsp: {
        /** Type: UINT16 */
        attrId: number;
        /** Type: UINT8 */
        status: number;
        /** Type: UINT8conditions=[{fieldEquals field=status value=0}] */
        dataType?: number;
        /** Type: USE_DATA_TYPEconditions=[{fieldEquals field=status value=0}] */
        attrData?: unknown;
    }[];
    /** ID: 2 */
    write: {
        /** Type: UINT16 */
        attrId: number;
        /** Type: UINT8 */
        dataType: number;
        /** Type: USE_DATA_TYPE */
        attrData: unknown;
    }[];
    /** ID: 3 */
    writeUndiv: {
        /** Type: UINT16 */
        attrId: number;
        /** Type: UINT8 */
        dataType: number;
        /** Type: USE_DATA_TYPE */
        attrData: unknown;
    }[];
    /** ID: 4 */
    writeRsp: {
        /** Type: UINT8 */
        status: number;
        /** Type: UINT16conditions=[{fieldEquals field=status reversed=true value=0}] */
        attrId?: number;
    }[];
    /** ID: 5 */
    writeNoRsp: {
        /** Type: UINT16 */
        attrId: number;
        /** Type: UINT8 */
        dataType: number;
        /** Type: USE_DATA_TYPE */
        attrData: unknown;
    }[];
    /** ID: 6 */
    configReport: {
        /** Type: UINT8 */
        direction: number;
        /** Type: UINT16 */
        attrId: number;
        /** Type: UINT8conditions=[{fieldEquals field=direction value=0}] */
        dataType?: number;
        /** Type: UINT16conditions=[{fieldEquals field=direction value=0}] */
        minRepIntval?: number;
        /** Type: UINT16conditions=[{fieldEquals field=direction value=0}] */
        maxRepIntval?: number;
        /** Type: USE_DATA_TYPEconditions=[{fieldEquals field=direction value=0}{dataTypeValueTypeEquals value=ANALOG}] */
        repChange?: unknown;
        /** Type: UINT16conditions=[{fieldEquals field=direction value=1}] */
        timeout?: number;
    }[];
    /** ID: 7 */
    configReportRsp: {
        /** Type: UINT8 */
        status: number;
        /** Type: UINT8conditions=[{minimumRemainingBufferBytes value=3}] */
        direction?: number;
        /** Type: UINT16conditions=[{minimumRemainingBufferBytes value=2}] */
        attrId?: number;
    }[];
    /** ID: 8 */
    readReportConfig: {
        /** Type: UINT8 */
        direction: number;
        /** Type: UINT16 */
        attrId: number;
    }[];
    /** ID: 9 */
    readReportConfigRsp: {
        /** Type: UINT8 */
        status: number;
        /** Type: UINT8 */
        direction: number;
        /** Type: UINT16 */
        attrId: number;
        /** Type: UINT8conditions=[{fieldEquals field=direction value=0}] */
        dataType?: number;
        /** Type: UINT16conditions=[{fieldEquals field=direction value=0}] */
        minRepIntval?: number;
        /** Type: UINT16conditions=[{fieldEquals field=direction value=0}] */
        maxRepIntval?: number;
        /** Type: USE_DATA_TYPEconditions=[{fieldEquals field=direction value=0}{dataTypeValueTypeEquals value=ANALOG}] */
        repChange?: unknown;
        /** Type: UINT16conditions=[{fieldEquals field=direction value=1}] */
        timeout?: number;
    }[];
    /** ID: 10 */
    report: {
        /** Type: UINT16 */
        attrId: number;
        /** Type: UINT8 */
        dataType: number;
        /** Type: USE_DATA_TYPE */
        attrData: unknown;
    }[];
    /** ID: 11 */
    defaultRsp: {
        /** Type: UINT8 */
        cmdId: number;
        /** Type: UINT8 */
        statusCode: number;
    };
    /** ID: 12 */
    discover: {
        /** Type: UINT16 */
        startAttrId: number;
        /** Type: UINT8 */
        maxAttrIds: number;
    };
    /** ID: 13 */
    discoverRsp: {
        /** Type: UINT8 */
        discComplete: number;
        attrInfos: {
            /** Type: UINT16 */
            attrId: number;
            /** Type: UINT8 */
            dataType: number;
        }[];
    };
    /** ID: 14 */
    readStructured: {
        /** Type: UINT16 */
        attrId: number;
        /** Type: STRUCTURED_SELECTOR */
        selector: StructuredSelector;
    }[];
    /** ID: 15 */
    writeStructured: {
        /** Type: UINT16 */
        attrId: number;
        /** Type: STRUCTURED_SELECTOR */
        selector: StructuredSelector;
        /** Type: UINT8 */
        dataType: number;
        /** Type: USE_DATA_TYPE */
        elementData: unknown;
    }[];
    /** ID: 16 */
    writeStructuredRsp: {
        /** Type: UINT8 */
        status: number;
        /** Type: UINT16conditions=[{fieldEquals field=status reversed=true value=0}] */
        attrId?: number;
        /** Type: STRUCTURED_SELECTORconditions=[{fieldEquals field=status reversed=true value=0}] */
        selector?: StructuredSelector;
    }[];
    /** ID: 17 */
    discoverCommands: {
        /** Type: UINT8 */
        startCmdId: number;
        /** Type: UINT8 */
        maxCmdIds: number;
    };
    /** ID: 18 */
    discoverCommandsRsp: {
        /** Type: UINT8 */
        discComplete: number;
        attrInfos: {
            /** Type: UINT8 */
            cmdId: number;
        }[];
    };
    /** ID: 19 */
    discoverCommandsGen: {
        /** Type: UINT8 */
        startCmdId: number;
        /** Type: UINT8 */
        maxCmdIds: number;
    };
    /** ID: 20 */
    discoverCommandsGenRsp: {
        /** Type: UINT8 */
        discComplete: number;
        attrInfos: {
            /** Type: UINT8 */
            cmdId: number;
        }[];
    };
    /** ID: 21 */
    discoverExt: {
        /** Type: UINT16 */
        startAttrId: number;
        /** Type: UINT8 */
        maxAttrIds: number;
    };
    /** ID: 22 */
    discoverExtRsp: {
        /** Type: UINT8 */
        discComplete: number;
        attrInfos: {
            /** Type: UINT16 */
            attrId: number;
            /** Type: UINT8 */
            dataType: number;
            /** Type: UINT8 */
            access: number;
        }[];
    };
}

export type TFoundationRepetitive =
    | "read"
    | "readRsp"
    | "write"
    | "writeUndiv"
    | "writeRsp"
    | "writeNoRsp"
    | "configReport"
    | "configReportRsp"
    | "readReportConfig"
    | "readReportConfigRsp"
    | "report"
    | "readStructured"
    | "writeStructured"
    | "writeStructuredRsp";
export type TFoundationFlat = "defaultRsp" | "discover" | "discoverCommands" | "discoverCommandsGen" | "discoverExt";
export type TFoundationOneOf = "discoverRsp" | "discoverCommandsRsp" | "discoverCommandsGenRsp" | "discoverExtRsp";

// Clusters
export type TClusterAttributeKeys<Cl extends number | string> = Cl extends keyof TClusters
    ? (keyof TClusters[Cl]["attributes"])[]
    : (string | number)[];

export type TClusterAttributes<Cl extends number | string> = Cl extends keyof TClusters ? TClusters[Cl]["attributes"] : never;

export type TPartialClusterAttributes<Cl extends number | string> = Cl extends keyof TClusters ? Partial<TClusters[Cl]["attributes"]> : never;

export type TClusterCommandKeys<Cl extends number | string> = Cl extends keyof TClusters ? (keyof TClusters[Cl]["commands"])[] : (string | number)[];

export type TClusterCommandResponseKeys<Cl extends number | string> = Cl extends keyof TClusters
    ? (keyof TClusters[Cl]["commandResponses"])[]
    : (string | number)[];

export type TClusterCommands<Cl extends number | string> = Cl extends keyof TClusters ? TClusters[Cl]["commands"] : never;

export type TClusterCommandResponses<Cl extends number | string> = Cl extends keyof TClusters ? TClusters[Cl]["commandResponses"] : never;

export type TClusterCommandPayload<Cl extends number | string, Co extends number | string> = Cl extends keyof TClusters
    ? Co extends keyof TClusters[Cl]["commands"]
        ? TClusters[Cl]["commands"][Co]
        : never
    : never;

export type TClusterCommandResponsePayload<Cl extends number | string, Co extends number | string> = Cl extends keyof TClusters
    ? Co extends keyof TClusters[Cl]["commandResponses"]
        ? TClusters[Cl]["commandResponses"][Co]
        : never
    : never;

export type TClusterPayload<Cl extends number | string, Co extends number | string> = Cl extends keyof TClusters
    ? TClusters[Cl]["commands"] extends never
        ? TClusters[Cl]["commandResponses"] extends never
            ? never
            : Co extends keyof TClusters[Cl]["commandResponses"]
              ? TClusters[Cl]["commandResponses"][Co]
              : never
        : Co extends keyof TClusters[Cl]["commands"]
          ? TClusters[Cl]["commands"][Co]
          : Co extends keyof TClusters[Cl]["commandResponses"]
            ? TClusters[Cl]["commandResponses"][Co]
            : never
    : never;

// Foundation
export type TFoundationGenericPayload = TFoundation[keyof TFoundation];
export type TFoundationRepetitivePayload = TFoundation[TFoundationRepetitive];
export type TFoundationFlatPayload = TFoundation[TFoundationFlat];
export type TFoundationOneOfPayload = TFoundation[TFoundationOneOf];

export type TFoundationPayload<Co extends number | string> = Co extends keyof TFoundation ? TFoundation[Co] : TFoundationGenericPayload;
