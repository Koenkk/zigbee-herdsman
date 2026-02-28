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
            /** ID=0x0000 | type=UINT8 | required=true | max=255 | default=8 */
            zclVersion: number;
            /** ID=0x0001 | type=UINT8 | max=255 | default=0 */
            appVersion: number;
            /** ID=0x0002 | type=UINT8 | max=255 | default=0 */
            stackVersion: number;
            /** ID=0x0003 | type=UINT8 | max=255 | default=0 */
            hwVersion: number;
            /** ID=0x0004 | type=CHAR_STR | default= | maxLen=32 */
            manufacturerName: string;
            /** ID=0x0005 | type=CHAR_STR | default= | maxLen=32 */
            modelId: string;
            /** ID=0x0006 | type=CHAR_STR | default= | maxLen=16 */
            dateCode: string;
            /** ID=0x0007 | type=ENUM8 | required=true | default=255 */
            powerSource: number;
            /** ID=0x0008 | type=ENUM8 | default=255 */
            genericDeviceClass: number;
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
            /** ID=0x0010 | type=CHAR_STR | write=true | default= | maxLen=16 */
            locationDesc: string;
            /** ID=0x0011 | type=ENUM8 | write=true | default=0 */
            physicalEnv: number;
            /** ID=0x0012 | type=BOOLEAN | write=true | default=1 */
            deviceEnabled: number;
            /** ID=0x0013 | type=BITMAP8 | write=true | default=0 */
            alarmMask: number;
            /** ID=0x0014 | type=BITMAP8 | write=true | default=0 */
            disableLocalConfig: number;
            /** ID=0x4000 | type=CHAR_STR | default= | maxLen=16 */
            swBuildId: string;
            /** ID=0xe200 | type=INT8 | manufacturerCode=SCHNEIDER_ELECTRIC(0x105e) | write=true | min=-128 | max=127 */
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
            /** ID=0x0010 | type=BITMAP8 | write=true | default=0 */
            mainsAlarmMask: number;
            /** ID=0x0011 | type=UINT16 | write=true | max=65535 | default=0 */
            mainsVoltMinThres: number;
            /** ID=0x0012 | type=UINT16 | write=true | max=65535 | default=65535 */
            mainsVoltMaxThres: number;
            /** ID=0x0013 | type=UINT16 | write=true | max=65535 | default=0 */
            mainsVoltageDwellTripPoint: number;
            /** ID=0x0020 | type=UINT8 | max=255 */
            batteryVoltage: number;
            /** ID=0x0021 | type=UINT8 | report=true | max=255 | default=0 */
            batteryPercentageRemaining: number;
            /** ID=0x0030 | type=CHAR_STR | write=true | default= | maxLen=16 */
            batteryManufacturer: string;
            /** ID=0x0031 | type=ENUM8 | write=true | default=255 */
            batterySize: number;
            /** ID=0x0032 | type=UINT16 | write=true | max=65535 */
            batteryAHrRating: number;
            /** ID=0x0033 | type=UINT8 | write=true | max=255 */
            batteryQuantity: number;
            /** ID=0x0034 | type=UINT8 | write=true | max=255 */
            batteryRatedVoltage: number;
            /** ID=0x0035 | type=BITMAP8 | write=true | default=0 */
            batteryAlarmMask: number;
            /** ID=0x0036 | type=UINT8 | write=true | max=255 | default=0 */
            batteryVoltMinThres: number;
            /** ID=0x0037 | type=UINT8 | write=true | writeOptional=true | max=255 | default=0 */
            batteryVoltThres1: number;
            /** ID=0x0038 | type=UINT8 | write=true | writeOptional=true | max=255 | default=0 */
            batteryVoltThres2: number;
            /** ID=0x0039 | type=UINT8 | write=true | writeOptional=true | max=255 | default=0 */
            batteryVoltThres3: number;
            /** ID=0x003a | type=UINT8 | write=true | writeOptional=true | max=255 | default=0 */
            batteryPercentMinThres: number;
            /** ID=0x003b | type=UINT8 | write=true | writeOptional=true | max=255 | default=0 */
            batteryPercentThres1: number;
            /** ID=0x003c | type=UINT8 | write=true | writeOptional=true | max=255 | default=0 */
            batteryPercentThres2: number;
            /** ID=0x003d | type=UINT8 | write=true | writeOptional=true | max=255 | default=0 */
            batteryPercentThres3: number;
            /** ID=0x003e | type=BITMAP32 | report=true | default=0 */
            batteryAlarmState: number;
            /** ID=0x0040 | type=UINT8 | max=255 */
            battery2Voltage: number;
            /** ID=0x0041 | type=UINT8 | report=true | max=255 | default=0 */
            battery2PercentageRemaining: number;
            /** ID=0x0050 | type=CHAR_STR | write=true | default= | maxLen=16 */
            battery2Manufacturer: string;
            /** ID=0x0051 | type=ENUM8 | write=true | default=255 */
            battery2Size: number;
            /** ID=0x0052 | type=UINT16 | write=true | max=65535 */
            battery2AHrRating: number;
            /** ID=0x0053 | type=UINT8 | write=true | max=255 */
            battery2Quantity: number;
            /** ID=0x0054 | type=UINT8 | write=true | max=255 */
            battery2RatedVoltage: number;
            /** ID=0x0055 | type=BITMAP8 | write=true | default=0 */
            battery2AlarmMask: number;
            /** ID=0x0056 | type=UINT8 | write=true | max=255 | default=0 */
            battery2VoltageMinThreshold: number;
            /** ID=0x0057 | type=UINT8 | write=true | writeOptional=true | max=255 | default=0 */
            battery2VoltageThreshold1: number;
            /** ID=0x0058 | type=UINT8 | write=true | writeOptional=true | max=255 | default=0 */
            battery2VoltageThreshold2: number;
            /** ID=0x0059 | type=UINT8 | write=true | writeOptional=true | max=255 | default=0 */
            battery2VoltageThreshold3: number;
            /** ID=0x005a | type=UINT8 | write=true | writeOptional=true | max=255 | default=0 */
            battery2PercentageMinThreshold: number;
            /** ID=0x005b | type=UINT8 | write=true | writeOptional=true | max=255 | default=0 */
            battery2PercentageThreshold1: number;
            /** ID=0x005c | type=UINT8 | write=true | writeOptional=true | max=255 | default=0 */
            battery2PercentageThreshold2: number;
            /** ID=0x005d | type=UINT8 | write=true | writeOptional=true | max=255 | default=0 */
            battery2PercentageThreshold3: number;
            /** ID=0x005e | type=BITMAP32 | report=true | default=0 */
            battery2AlarmState: number;
            /** ID=0x0060 | type=UINT8 | max=255 */
            battery3Voltage: number;
            /** ID=0x0061 | type=UINT8 | report=true | max=255 | default=0 */
            battery3PercentageRemaining: number;
            /** ID=0x0070 | type=CHAR_STR | write=true | default= | maxLen=16 */
            battery3Manufacturer: string;
            /** ID=0x0071 | type=ENUM8 | write=true | default=255 */
            battery3Size: number;
            /** ID=0x0072 | type=UINT16 | write=true | max=65535 */
            battery3AHrRating: number;
            /** ID=0x0073 | type=UINT8 | write=true | max=255 */
            battery3Quantity: number;
            /** ID=0x0074 | type=UINT8 | write=true | max=255 */
            battery3RatedVoltage: number;
            /** ID=0x0075 | type=BITMAP8 | write=true | default=0 */
            battery3AlarmMask: number;
            /** ID=0x0076 | type=UINT8 | write=true | max=255 | default=0 */
            battery3VoltageMinThreshold: number;
            /** ID=0x0077 | type=UINT8 | write=true | writeOptional=true | max=255 | default=0 */
            battery3VoltageThreshold1: number;
            /** ID=0x0078 | type=UINT8 | write=true | writeOptional=true | max=255 | default=0 */
            battery3VoltageThreshold2: number;
            /** ID=0x0079 | type=UINT8 | write=true | writeOptional=true | max=255 | default=0 */
            battery3VoltageThreshold3: number;
            /** ID=0x007a | type=UINT8 | write=true | writeOptional=true | max=255 | default=0 */
            battery3PercentageMinThreshold: number;
            /** ID=0x007b | type=UINT8 | write=true | writeOptional=true | max=255 | default=0 */
            battery3PercentageThreshold1: number;
            /** ID=0x007c | type=UINT8 | write=true | writeOptional=true | max=255 | default=0 */
            battery3PercentageThreshold2: number;
            /** ID=0x007d | type=UINT8 | write=true | writeOptional=true | max=255 | default=0 */
            battery3PercentageThreshold3: number;
            /** ID=0x007e | type=BITMAP32 | report=true | default=0 */
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
            /** ID=0x0010 | type=BITMAP8 | write=true | default=0 */
            devTempAlarmMask: number;
            /** ID=0x0011 | type=INT16 | write=true | min=-200 | max=200 */
            lowTempThres: number;
            /** ID=0x0012 | type=INT16 | write=true | min=-200 | max=200 */
            highTempThres: number;
            /** ID=0x0013 | type=UINT24 | write=true | max=16777215 */
            lowTempDwellTripPoint: number;
            /** ID=0x0014 | type=UINT24 | write=true | max=16777215 */
            highTempDwellTripPoint: number;
        };
        commands: never;
        commandResponses: never;
    };
    genIdentify: {
        attributes: {
            /** ID=0x0000 | type=UINT16 | write=true | required=true | max=65535 | default=0 */
            identifyTime: number;
        };
        commands: {
            /** ID=0x00 | required=true */
            identify: {
                /** type=UINT16 */
                identifytime: number;
            };
            /** ID=0x01 | required=true */
            identifyQuery: Record<string, never>;
            /** ID=0x40 */
            triggerEffect: {
                /** type=ENUM8 */
                effectid: number;
                /** type=ENUM8 */
                effectvariant: number;
            };
            /** ID=0x02 */
            ezmodeInvoke: {
                /** type=UINT8 | max=255 */
                action: number;
            };
            /** ID=0x03 */
            updateCommissionState: {
                /** type=UINT8 | max=255 */
                action: number;
                /** type=UINT8 | max=255 */
                commstatemask: number;
            };
        };
        commandResponses: {
            /** ID=0x00 | required=true */
            identifyQueryRsp: {
                /** type=UINT16 | max=65535 */
                timeout: number;
            };
        };
    };
    genGroups: {
        attributes: {
            /** ID=0x0000 | type=BITMAP8 | required=true | default=0 */
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
                /** type=ENUM8 */
                status: number;
                /** type=UINT16 */
                groupid: number;
            };
            /** ID=0x01 | required=true */
            viewRsp: {
                /** type=ENUM8 */
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
                /** type=ENUM8 */
                status: number;
                /** type=UINT16 */
                groupid: number;
            };
        };
    };
    genScenes: {
        attributes: {
            /** ID=0x0000 | type=UINT8 | required=true | max=255 | default=0 */
            count: number;
            /** ID=0x0001 | type=UINT8 | required=true | max=255 | default=0 */
            currentScene: number;
            /** ID=0x0002 | type=UINT16 | required=true | max=65527 | default=0 */
            currentGroup: number;
            /** ID=0x0003 | type=BOOLEAN | required=true | default=0 */
            sceneValid: number;
            /** ID=0x0004 | type=BITMAP8 | required=true | default=0 */
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
                /** type=EXTENSION_FIELD_SETS */
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
                /** type=UINT16 | conditions=[{minimumRemainingBufferBytes value=2}] */
                transitionTime?: number;
            };
            /** ID=0x06 | response=6 | required=true */
            getSceneMembership: {
                /** type=UINT16 */
                groupid: number;
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
                /** type=EXTENSION_FIELD_SETS */
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
                /** type=BITMAP8 */
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
            /** ID=0x07 */
            tradfriArrowSingle: {
                /** type=UINT16 | max=65535 */
                value: number;
                /** type=UINT16 | max=65535 */
                value2: number;
            };
            /** ID=0x08 */
            tradfriArrowHold: {
                /** type=UINT16 | max=65535 */
                value: number;
            };
            /** ID=0x09 */
            tradfriArrowRelease: {
                /** type=UINT16 | max=65535 */
                value: number;
            };
        };
        commandResponses: {
            /** ID=0x00 | required=true */
            addRsp: {
                /** type=ENUM8 */
                status: number;
                /** type=UINT16 */
                groupId: number;
                /** type=UINT8 */
                sceneId: number;
            };
            /** ID=0x01 | required=true */
            viewRsp: {
                /** type=ENUM8 */
                status: number;
                /** type=UINT16 */
                groupid: number;
                /** type=UINT8 */
                sceneid: number;
                /** type=UINT16 | conditions=[{fieldEquals field=status value=0}] */
                transtime?: number;
                /** type=CHAR_STR | conditions=[{fieldEquals field=status value=0}] */
                scenename?: string;
                /** type=EXTENSION_FIELD_SETS | conditions=[{fieldEquals field=status value=0}] */
                extensionfieldsets?: ExtensionFieldSet[];
            };
            /** ID=0x02 | required=true */
            removeRsp: {
                /** type=ENUM8 */
                status: number;
                /** type=UINT16 */
                groupid: number;
                /** type=UINT8 */
                sceneid: number;
            };
            /** ID=0x03 | required=true */
            removeAllRsp: {
                /** type=ENUM8 */
                status: number;
                /** type=UINT16 */
                groupid: number;
            };
            /** ID=0x04 | required=true */
            storeRsp: {
                /** type=ENUM8 */
                status: number;
                /** type=UINT16 */
                groupid: number;
                /** type=UINT8 */
                sceneid: number;
            };
            /** ID=0x06 | required=true */
            getSceneMembershipRsp: {
                /** type=ENUM8 */
                status: number;
                /** type=UINT8 | min=0 | max=255 | special=NoFurtherScenesMayBeAdded,00,AtLeastOneFurtherSceneMayBeAdded,fe,Unknown,ff */
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
                /** type=ENUM8 */
                status: number;
                /** type=UINT16 */
                groupId: number;
                /** type=UINT8 */
                sceneId: number;
            };
            /** ID=0x41 */
            enhancedViewRsp: {
                /** type=ENUM8 */
                status: number;
                /** type=UINT16 */
                groupid: number;
                /** type=UINT8 */
                sceneid: number;
                /** type=UINT16 | conditions=[{fieldEquals field=status value=0}] */
                transtime?: number;
                /** type=CHAR_STR | conditions=[{fieldEquals field=status value=0}] */
                scenename?: string;
                /** type=EXTENSION_FIELD_SETS | conditions=[{fieldEquals field=status value=0}] */
                extensionfieldsets?: ExtensionFieldSet[];
            };
            /** ID=0x42 */
            copyRsp: {
                /** type=ENUM8 */
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
            /** ID=0x0000 | type=BOOLEAN | report=true | scene=true | required=true | default=0 */
            onOff: number;
            /** ID=0x4000 | type=BOOLEAN | default=1 */
            globalSceneCtrl: number;
            /** ID=0x4001 | type=UINT16 | write=true | max=65535 | default=0 */
            onTime: number;
            /** ID=0x4002 | type=UINT16 | write=true | max=65535 | default=0 */
            offWaitTime: number;
            /** ID=0x4003 | type=ENUM8 | write=true | max=255 | special=SetToPreviousValue,ff */
            startUpOnOff: number;
            /** ID=0x0001 | type=UINT16 | manufacturerCode=NODON(0x128b) | write=true | max=65535 */
            nodonTransitionTime?: number;
            /** ID=0x5000 | type=ENUM8 | write=true | max=255 */
            tuyaBacklightSwitch: number;
            /** ID=0x8001 | type=ENUM8 | write=true | max=255 */
            tuyaBacklightMode: number;
            /** ID=0x8002 | type=ENUM8 | write=true | max=255 */
            moesStartUpOnOff: number;
            /** ID=0x8004 | type=ENUM8 | write=true | max=255 */
            tuyaOperationMode: number;
            /** ID=0xe000 | type=UINT16 | manufacturerCode=ADEO(0x1277) | write=true | max=65535 */
            elkoPreWarningTime?: number;
            /** ID=0xe001 | type=UINT32 | manufacturerCode=ADEO(0x1277) | write=true | max=4294967295 */
            elkoOnTimeReload?: number;
            /** ID=0xe002 | type=BITMAP8 | manufacturerCode=ADEO(0x1277) | write=true */
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
                /** type=ENUM8 */
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
                /** type=UINT8 | max=255 */
                value: number;
            };
            /** ID=0xfd */
            tuyaAction: {
                /** type=UINT8 | max=255 */
                value: number;
                /** type=BUFFER */
                data: Buffer;
            };
        };
        commandResponses: never;
    };
    genOnOffSwitchCfg: {
        attributes: {
            /** ID=0x0000 | type=ENUM8 | required=true | min=0 | max=2 */
            switchType: number;
            /** ID=0x0010 | type=ENUM8 | required=true | write=true | min=0 | max=2 */
            switchActions: number;
        };
        commands: never;
        commandResponses: never;
    };
    genLevelCtrl: {
        attributes: {
            /** ID=0x0000 | type=UINT8 | report=true | scene=true | required=true | default=255 */
            currentLevel: number;
            /** ID=0x0001 | type=UINT16 | max=65535 | default=0 */
            remainingTime: number;
            /** ID=0x0002 | type=UINT8 | default=0 */
            minLevel: number;
            /** ID=0x0003 | type=UINT8 | max=255 | default=255 */
            maxLevel: number;
            /** ID=0x0004 | type=UINT16 | report=true | default=0 */
            currentFrequency: number;
            /** ID=0x0005 | type=UINT16 | default=0 */
            minFrequency: number;
            /** ID=0x0006 | type=UINT16 | max=65535 | default=0 */
            maxFrequency: number;
            /** ID=0x000f | type=BITMAP8 | write=true | default=0 */
            options: number;
            /** ID=0x0010 | type=UINT16 | write=true | max=65535 | default=0 */
            onOffTransitionTime: number;
            /** ID=0x0011 | type=UINT8 | write=true | default=255 */
            onLevel: number;
            /** ID=0x0012 | type=UINT16 | write=true | max=65534 | default=65535 */
            onTransitionTime: number;
            /** ID=0x0013 | type=UINT16 | write=true | max=65534 | default=65535 */
            offTransitionTime: number;
            /** ID=0x0014 | type=UINT8 | write=true | max=254 */
            defaultMoveRate: number;
            /** ID=0x4000 | type=UINT8 | write=true | max=255 | special=MinimumDeviceValuePermitted,00,SetToPreviousValue,ff */
            startUpCurrentLevel: number;
            /** ID=0x4000 | type=UINT8 | manufacturerCode=ADEO(0x1277) | write=true | max=255 */
            elkoStartUpCurrentLevel?: number;
        };
        commands: {
            /** ID=0x00 | required=true */
            moveToLevel: {
                /** type=UINT8 */
                level: number;
                /** type=UINT16 */
                transtime: number;
                /** type=BITMAP8 | conditions=[{minimumRemainingBufferBytes value=1}] */
                optionsMask?: number;
                /** type=BITMAP8 | conditions=[{minimumRemainingBufferBytes value=1}] */
                optionsOverride?: number;
            };
            /** ID=0x01 | required=true */
            move: {
                /** type=ENUM8 */
                movemode: number;
                /** type=UINT8 */
                rate: number;
                /** type=BITMAP8 | conditions=[{minimumRemainingBufferBytes value=1}] */
                optionsMask?: number;
                /** type=BITMAP8 | conditions=[{minimumRemainingBufferBytes value=1}] */
                optionsOverride?: number;
            };
            /** ID=0x02 | required=true */
            step: {
                /** type=ENUM8 */
                stepmode: number;
                /** type=UINT8 */
                stepsize: number;
                /** type=UINT16 */
                transtime: number;
                /** type=BITMAP8 | conditions=[{minimumRemainingBufferBytes value=1}] */
                optionsMask?: number;
                /** type=BITMAP8 | conditions=[{minimumRemainingBufferBytes value=1}] */
                optionsOverride?: number;
            };
            /** ID=0x03 | required=true */
            stop: {
                /** type=BITMAP8 | conditions=[{minimumRemainingBufferBytes value=1}] */
                optionsMask?: number;
                /** type=BITMAP8 | conditions=[{minimumRemainingBufferBytes value=1}] */
                optionsOverride?: number;
            };
            /** ID=0x04 | required=true */
            moveToLevelWithOnOff: {
                /** type=UINT8 */
                level: number;
                /** type=UINT16 */
                transtime: number;
                /** type=BITMAP8 | conditions=[{minimumRemainingBufferBytes value=1}] */
                optionsMask?: number;
                /** type=BITMAP8 | conditions=[{minimumRemainingBufferBytes value=1}] */
                optionsOverride?: number;
            };
            /** ID=0x05 | required=true */
            moveWithOnOff: {
                /** type=ENUM8 */
                movemode: number;
                /** type=UINT8 */
                rate: number;
                /** type=BITMAP8 | conditions=[{minimumRemainingBufferBytes value=1}] */
                optionsMask?: number;
                /** type=BITMAP8 | conditions=[{minimumRemainingBufferBytes value=1}] */
                optionsOverride?: number;
            };
            /** ID=0x06 | required=true */
            stepWithOnOff: {
                /** type=ENUM8 */
                stepmode: number;
                /** type=UINT8 */
                stepsize: number;
                /** type=UINT16 */
                transtime: number;
                /** type=BITMAP8 | conditions=[{minimumRemainingBufferBytes value=1}] */
                optionsMask?: number;
                /** type=BITMAP8 | conditions=[{minimumRemainingBufferBytes value=1}] */
                optionsOverride?: number;
            };
            /** ID=0x07 | required=true */
            stopWithOnOff: {
                /** type=BITMAP8 | conditions=[{minimumRemainingBufferBytes value=1}] */
                optionsMask?: number;
                /** type=BITMAP8 | conditions=[{minimumRemainingBufferBytes value=1}] */
                optionsOverride?: number;
            };
            /** ID=0x08 */
            moveToClosestFrequency: {
                /** type=UINT16 */
                frequency: number;
            };
            /** ID=0xf0 */
            moveToLevelTuya: {
                /** type=UINT16 | max=65535 */
                level: number;
                /** type=UINT16 | max=65535 */
                transtime: number;
            };
        };
        commandResponses: never;
    };
    genAlarms: {
        attributes: {
            /** ID=0x0000 | type=UINT16 | max=65535 | default=0 */
            alarmCount: number;
        };
        commands: {
            /** ID=0x00 | required=true */
            reset: {
                /** type=ENUM8 */
                alarmcode: number;
                /** type=CLUSTER_ID */
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
                /** type=ENUM8 */
                alarmcode: number;
                /** type=CLUSTER_ID */
                clusterid: number;
            };
            /** ID=0x01 */
            getRsp: {
                /** type=ENUM8 */
                status: number;
                /** type=ENUM8 | conditions=[{fieldEquals field=status value=0}] */
                alarmcode?: number;
                /** type=CLUSTER_ID | conditions=[{fieldEquals field=status value=0}] */
                clusterid?: number;
                /** type=UINT32 | conditions=[{fieldEquals field=status value=0}] */
                timestamp?: number;
            };
            /** ID=0x02 */
            getEventLog: Record<string, never>;
        };
    };
    genTime: {
        attributes: {
            /** ID=0x0000 | type=UTC | write=true | required=true | max=4294967294 | default=4294967295 */
            time: number;
            /** ID=0x0001 | type=BITMAP8 | write=true | required=true | default=0 */
            timeStatus: number;
            /** ID=0x0002 | type=INT32 | write=true | min=-86400 | max=86400 | default=0 */
            timeZone: number;
            /** ID=0x0003 | type=UINT32 | write=true | max=4294967294 | default=4294967295 */
            dstStart: number;
            /** ID=0x0004 | type=UINT32 | write=true | max=4294967294 | default=4294967295 */
            dstEnd: number;
            /** ID=0x0005 | type=INT32 | write=true | min=-86400 | max=86400 | default=0 */
            dstShift: number;
            /** ID=0x0006 | type=UINT32 | max=4294967294 | default=4294967295 */
            standardTime: number;
            /** ID=0x0007 | type=UINT32 | max=4294967294 | default=4294967295 */
            localTime: number;
            /** ID=0x0008 | type=UTC | default=4294967295 */
            lastSetTime: number;
            /** ID=0x0009 | type=UTC | write=true | default=4294967295 */
            validUntilTime: number;
        };
        commands: never;
        commandResponses: never;
    };
    genRssiLocation: {
        attributes: {
            /** ID=0x0000 | type=DATA8 | required=true | write=true */
            type: number;
            /** ID=0x0001 | type=ENUM8 | required=true | write=true */
            method: number;
            /** ID=0x0002 | type=UINT16 | max=65535 */
            age: number;
            /** ID=0x0003 | type=UINT8 | max=100 */
            qualityMeasure: number;
            /** ID=0x0004 | type=UINT8 | max=255 */
            numOfDevices: number;
            /** ID=0x0010 | type=INT16 | required=true | write=true | min=-32768 | max=32767 */
            coordinate1: number;
            /** ID=0x0011 | type=INT16 | required=true | write=true | min=-32768 | max=32767 */
            coordinate2: number;
            /** ID=0x0012 | type=INT16 | write=true | min=-32768 | max=32767 */
            coordinate3: number;
            /** ID=0x0013 | type=INT16 | required=true | write=true | min=-32768 | max=32767 */
            power: number;
            /** ID=0x0014 | type=UINT16 | required=true | write=true */
            pathLossExponent: number;
            /** ID=0x0015 | type=UINT16 | write=true | max=65535 */
            reportingPeriod: number;
            /** ID=0x0016 | type=UINT16 | write=true | max=65535 */
            calcPeriod: number;
            /** ID=0x0017 | type=UINT8 | required=true | write=true | min=1 | max=255 */
            numRSSIMeasurements: number;
        };
        commands: {
            /** ID=0x00 | required=true */
            setAbsolute: {
                /** type=INT16 */
                coordinate1: number;
                /** type=INT16 */
                coordinate2: number;
                /** type=INT16 */
                coordinate3: number;
                /** type=INT16 */
                power: number;
                /** type=UINT16 */
                pathLossExponent: number;
            };
            /** ID=0x01 | required=true */
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
            /** ID=0x02 | required=true */
            getDeviceConfig: {
                /** type=IEEE_ADDR */
                targetAddr: string;
            };
            /** ID=0x03 | required=true */
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
            /** ID=0x00 | required=true */
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
            /** ID=0x01 | required=true */
            locationDataResponse: {
                /** type=ENUM8 */
                status: number;
                /** type=DATA8 | conditions=[{fieldEquals field=status value=0}] */
                type?: number;
                /** type=INT16 | conditions=[{fieldEquals field=status value=0}] */
                coordinate1?: number;
                /** type=INT16 | conditions=[{fieldEquals field=status value=0}] */
                coordinate2?: number;
                /** type=INT16 | conditions=[{fieldEquals field=status value=0}] */
                coordinate3?: number;
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
                coordinate1: number;
                /** type=INT16 */
                coordinate2: number;
                /** type=INT16 | conditions=[{bitMaskSet param=type mask=2 reversed=true}] */
                coordinate3?: number;
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
            /** ID=0x03 | required=true */
            compactLocationDataNotification: {
                /** type=DATA8 */
                type: number;
                /** type=INT16 */
                coordinate1: number;
                /** type=INT16 */
                coordinate2: number;
                /** type=INT16 | conditions=[{bitMaskSet param=type mask=2 reversed=true}] */
                coordinate3?: number;
                /** type=UINT8 | conditions=[{bitMaskSet param=type mask=1 reversed=true}] */
                qualityMeasure?: number;
                /** type=UINT16 | conditions=[{bitMaskSet param=type mask=1 reversed=true}] */
                age?: number;
            };
            /** ID=0x04 | required=true */
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
            /** ID=0x001c | type=CHAR_STR | write=true | writeOptional=true | default=  */
            description: string;
            /** ID=0x0041 | type=SINGLE_PREC | write=true | writeOptional=true */
            maxPresentValue: number;
            /** ID=0x0045 | type=SINGLE_PREC | write=true | writeOptional=true */
            minPresentValue: number;
            /** ID=0x0051 | type=BOOLEAN | required=true | write=true | writeOptional=true | default=0 */
            outOfService: number;
            /** ID=0x0055 | type=SINGLE_PREC | required=true | write=true | report=true */
            presentValue: number;
            /** ID=0x0067 | type=ENUM8 | write=true | writeOptional=true | default=0 */
            reliability: number;
            /** ID=0x006a | type=SINGLE_PREC | write=true | writeOptional=true */
            resolution: number;
            /** ID=0x006f | type=BITMAP8 | required=true | report=true | max=15 | default=0 */
            statusFlags: number;
            /** ID=0x0075 | type=ENUM16 | write=true | writeOptional=true | max=65535 */
            engineeringUnits: number;
            /** ID=0x0100 | type=UINT32 | max=4294967295 */
            applicationType: number;
        };
        commands: never;
        commandResponses: never;
    };
    genAnalogOutput: {
        attributes: {
            /** ID=0x001c | type=CHAR_STR | write=true | writeOptional=true | default=  */
            description: string;
            /** ID=0x0041 | type=SINGLE_PREC | write=true | writeOptional=true */
            maxPresentValue: number;
            /** ID=0x0045 | type=SINGLE_PREC | write=true | writeOptional=true */
            minPresentValue: number;
            /** ID=0x0051 | type=BOOLEAN | required=true | write=true | writeOptional=true | default=0 */
            outOfService: number;
            /** ID=0x0055 | type=SINGLE_PREC | required=true | write=true | report=true */
            presentValue: number;
            /** ID=0x0057 | type=ARRAY | write=true */
            priorityArray: ZclArray | unknown[];
            /** ID=0x0067 | type=ENUM8 | write=true | writeOptional=true | default=0 */
            reliability: number;
            /** ID=0x0068 | type=SINGLE_PREC | write=true | writeOptional=true */
            relinquishDefault: number;
            /** ID=0x006a | type=SINGLE_PREC | write=true | writeOptional=true */
            resolution: number;
            /** ID=0x006f | type=BITMAP8 | required=true | report=true | max=15 | default=0 */
            statusFlags: number;
            /** ID=0x0075 | type=ENUM16 | write=true | writeOptional=true | max=65535 */
            engineeringUnits: number;
            /** ID=0x0100 | type=UINT32 | max=4294967295 */
            applicationType: number;
        };
        commands: never;
        commandResponses: never;
    };
    genAnalogValue: {
        attributes: {
            /** ID=0x001c | type=CHAR_STR | write=true | writeOptional=true | default=  */
            description: string;
            /** ID=0x0051 | type=BOOLEAN | required=true | write=true | writeOptional=true | default=0 */
            outOfService: number;
            /** ID=0x0055 | type=SINGLE_PREC | required=true | write=true */
            presentValue: number;
            /** ID=0x0057 | type=ARRAY | write=true */
            priorityArray: ZclArray | unknown[];
            /** ID=0x0067 | type=ENUM8 | write=true | writeOptional=true | default=0 */
            reliability: number;
            /** ID=0x0068 | type=SINGLE_PREC | write=true | writeOptional=true */
            relinquishDefault: number;
            /** ID=0x006f | type=BITMAP8 | required=true | max=15 | default=0 */
            statusFlags: number;
            /** ID=0x0075 | type=ENUM16 | write=true | writeOptional=true | max=65535 */
            engineeringUnits: number;
            /** ID=0x0100 | type=UINT32 | max=4294967295 */
            applicationType: number;
        };
        commands: never;
        commandResponses: never;
    };
    genBinaryInput: {
        attributes: {
            /** ID=0x0004 | type=CHAR_STR | write=true | writeOptional=true | default=  */
            activeText: string;
            /** ID=0x001c | type=CHAR_STR | write=true | writeOptional=true | default=  */
            description: string;
            /** ID=0x002e | type=CHAR_STR | write=true | writeOptional=true | default=  */
            inactiveText: string;
            /** ID=0x0051 | type=BOOLEAN | required=true | write=true | writeOptional=true | default=0 */
            outOfService: number;
            /** ID=0x0054 | type=ENUM8 | default=0 */
            polarity: number;
            /** ID=0x0055 | type=BOOLEAN | required=true | write=true | writeOptional=true */
            presentValue: number;
            /** ID=0x0067 | type=ENUM8 | write=true | writeOptional=true | default=0 */
            reliability: number;
            /** ID=0x006f | type=BITMAP8 | required=true | max=15 | default=0 */
            statusFlags: number;
            /** ID=0x0100 | type=UINT32 | max=4294967295 */
            applicationType: number;
        };
        commands: never;
        commandResponses: never;
    };
    genBinaryOutput: {
        attributes: {
            /** ID=0x0004 | type=CHAR_STR | write=true | writeOptional=true | default=  */
            activeText: string;
            /** ID=0x001c | type=CHAR_STR | write=true | writeOptional=true | default=  */
            description: string;
            /** ID=0x002e | type=CHAR_STR | write=true | writeOptional=true | default=  */
            inactiveText: string;
            /** ID=0x0042 | type=UINT32 | write=true | writeOptional=true | default=4294967295 */
            minimumOffTime: number;
            /** ID=0x0043 | type=UINT32 | write=true | writeOptional=true | default=4294967295 */
            minimumOnTime: number;
            /** ID=0x0051 | type=BOOLEAN | required=true | writeOptional=true | write=true | default=0 */
            outOfService: number;
            /** ID=0x0054 | type=ENUM8 | default=0 */
            polarity: number;
            /** ID=0x0055 | type=BOOLEAN | required=true | write=true | writeOptional=true */
            presentValue: number;
            /** ID=0x0057 | type=ARRAY | write=true */
            priorityArray: ZclArray | unknown[];
            /** ID=0x0067 | type=ENUM8 | write=true | writeOptional=true */
            reliability: number;
            /** ID=0x0068 | type=BOOLEAN | write=true | writeOptional=true */
            relinquishDefault: number;
            /** ID=0x006f | type=BITMAP8 | required=true | max=15 | default=0 */
            statusFlags: number;
            /** ID=0x0100 | type=UINT32 | max=4294967295 */
            applicationType: number;
        };
        commands: never;
        commandResponses: never;
    };
    genBinaryValue: {
        attributes: {
            /** ID=0x0004 | type=CHAR_STR | write=true | writeOptional=true | default=  */
            activeText: string;
            /** ID=0x001c | type=CHAR_STR | write=true | writeOptional=true | default=  */
            description: string;
            /** ID=0x002e | type=CHAR_STR | write=true | writeOptional=true | default=  */
            inactiveText: string;
            /** ID=0x0042 | type=UINT32 | write=true | writeOptional=true | default=4294967295 */
            minimumOffTime: number;
            /** ID=0x0043 | type=UINT32 | write=true | writeOptional=true | default=4294967295 */
            minimumOnTime: number;
            /** ID=0x0051 | type=BOOLEAN | required=true | writeOptional=true | write=true | default=0 */
            outOfService: number;
            /** ID=0x0055 | type=BOOLEAN | required=true | writeOptional=true | write=true */
            presentValue: number;
            /** ID=0x0057 | type=ARRAY | write=true */
            priorityArray: ZclArray | unknown[];
            /** ID=0x0067 | type=ENUM8 | write=true | writeOptional=true */
            reliability: number;
            /** ID=0x0068 | type=BOOLEAN | write=true | writeOptional=true */
            relinquishDefault: number;
            /** ID=0x006f | type=BITMAP8 | required=true | max=15 | default=0 */
            statusFlags: number;
            /** ID=0x0100 | type=UINT32 | max=4294967295 */
            applicationType: number;
        };
        commands: never;
        commandResponses: never;
    };
    genMultistateInput: {
        attributes: {
            /** ID=0x000e | type=ARRAY | write=true | writeOptional=true */
            stateText: ZclArray | unknown[];
            /** ID=0x001c | type=CHAR_STR | write=true | writeOptional=true | default=  */
            description: string;
            /** ID=0x004a | type=UINT16 | required=true | write=true | writeOptional=true | min=1 | max=65535 | default=0 */
            numberOfStates: number;
            /** ID=0x0051 | type=BOOLEAN | required=true | write=true | writeOptional=true | default=0 */
            outOfService: number;
            /** ID=0x0055 | type=UINT16 | required=true | write=true | writeOptional=true */
            presentValue: number;
            /** ID=0x0067 | type=ENUM8 | write=true | writeOptional=true | default=0 */
            reliability: number;
            /** ID=0x006f | type=BITMAP8 | required=true | max=15 | default=0 */
            statusFlags: number;
            /** ID=0x0100 | type=UINT32 | max=4294967295 */
            applicationType: number;
        };
        commands: never;
        commandResponses: never;
    };
    genMultistateOutput: {
        attributes: {
            /** ID=0x000e | type=ARRAY | write=true | writeOptional=true */
            stateText: ZclArray | unknown[];
            /** ID=0x001c | type=CHAR_STR | write=true | writeOptional=true | default=  */
            description: string;
            /** ID=0x004a | type=UINT16 | required=true | write=true | writeOptional=true | min=1 | max=65535 | default=0 */
            numberOfStates: number;
            /** ID=0x0051 | type=BOOLEAN | required=true | write=true | writeOptional=true | default=0 */
            outOfService: number;
            /** ID=0x0055 | type=UINT16 | required=true | write=true */
            presentValue: number;
            /** ID=0x0057 | type=ARRAY | write=true */
            priorityArray: ZclArray | unknown[];
            /** ID=0x0067 | type=ENUM8 | write=true | writeOptional=true | default=0 */
            reliability: number;
            /** ID=0x0068 | type=UINT16 | write=true | writeOptional=true */
            relinquishDefault: number;
            /** ID=0x006f | type=BITMAP8 | required=true | max=15 | default=0 */
            statusFlags: number;
            /** ID=0x0100 | type=UINT32 | max=4294967295 */
            applicationType: number;
        };
        commands: never;
        commandResponses: never;
    };
    genMultistateValue: {
        attributes: {
            /** ID=0x000e | type=ARRAY | write=true | writeOptional=true */
            stateText: ZclArray | unknown[];
            /** ID=0x001c | type=CHAR_STR | write=true | writeOptional=true | default=  */
            description: string;
            /** ID=0x004a | type=UINT16 | required=true | write=true | writeOptional=true | min=1 | max=65535 | default=0 */
            numberOfStates: number;
            /** ID=0x0051 | type=BOOLEAN | required=true | write=true | writeOptional=true | default=0 */
            outOfService: number;
            /** ID=0x0055 | type=UINT16 | required=true | write=true */
            presentValue: number;
            /** ID=0x0057 | type=ARRAY | write=true */
            priorityArray: ZclArray | unknown[];
            /** ID=0x0067 | type=ENUM8 | write=true | writeOptional=true | default=0 */
            reliability: number;
            /** ID=0x0068 | type=UINT16 | write=true | writeOptional=true */
            relinquishDefault: number;
            /** ID=0x006f | type=BITMAP8 | required=true | max=15 | default=0 */
            statusFlags: number;
            /** ID=0x0100 | type=UINT32 | max=4294967295 */
            applicationType: number;
        };
        commands: never;
        commandResponses: never;
    };
    genCommissioning: {
        attributes: {
            /** ID=0x0000 | type=UINT16 | write=true | required=true | max=65527 */
            shortress: number;
            /** ID=0x0001 | type=IEEE_ADDR | write=true | required=true | default=0xffffffffffffffff | special=PANIdUnspecified,ffffffffffffffff */
            extendedPANId: string;
            /** ID=0x0002 | type=UINT16 | write=true | required=true | max=65535 */
            panId: number;
            /** ID=0x0003 | type=BITMAP32 | write=true | required=true */
            channelmask: number;
            /** ID=0x0004 | type=UINT8 | write=true | required=true | min=2 | max=2 */
            protocolVersion: number;
            /** ID=0x0005 | type=UINT8 | write=true | required=true | min=1 | max=2 */
            stackProfile: number;
            /** ID=0x0006 | type=ENUM8 | write=true | required=true | max=3 */
            startupControl: number;
            /** ID=0x0010 | type=IEEE_ADDR | write=true | required=true | default=0x0000000000000000 | special=AddressUnspecified,0000000000000000 */
            trustCenterress: string;
            /** ID=0x0011 | type=SEC_KEY | write=true */
            trustCenterMasterKey: Buffer;
            /** ID=0x0012 | type=SEC_KEY | write=true | required=true */
            networkKey: Buffer;
            /** ID=0x0013 | type=BOOLEAN | write=true | required=true | default=1 */
            useInsecureJoin: number;
            /** ID=0x0014 | type=SEC_KEY | write=true | required=true */
            preconfiguredLinkKey: Buffer;
            /** ID=0x0015 | type=UINT8 | write=true | required=true | max=255 | default=0 */
            networkKeySeqNum: number;
            /** ID=0x0016 | type=ENUM8 | write=true | required=true */
            networkKeyType: number;
            /** ID=0x0017 | type=UINT16 | write=true | required=true | default=0 */
            networkManagerress: number;
            /** ID=0x0020 | type=UINT8 | write=true | min=1 | max=255 | default=5 */
            scanAttempts: number;
            /** ID=0x0021 | type=UINT16 | write=true | min=1 | max=65535 | default=100 */
            timeBetweenScans: number;
            /** ID=0x0022 | type=UINT16 | write=true | min=1 | default=60 */
            rejoinInterval: number;
            /** ID=0x0023 | type=UINT16 | write=true | min=1 | max=65535 | default=3600 */
            maxRejoinInterval: number;
            /** ID=0x0030 | type=UINT16 | write=true | max=65535 */
            indirectPollRate: number;
            /** ID=0x0031 | type=UINT8 | max=255 */
            parentRetryThreshold: number;
            /** ID=0x0040 | type=BOOLEAN | write=true | default=0 */
            concentratorFlag: number;
            /** ID=0x0041 | type=UINT8 | write=true | max=255 | default=15 */
            concentratorRadius: number;
            /** ID=0x0042 | type=UINT8 | write=true | max=255 | default=0 */
            concentratorDiscoveryTime: number;
        };
        commands: {
            /** ID=0x00 | required=true */
            restartDevice: {
                /** type=BITMAP8 */
                options: number;
                /** type=UINT8 */
                delay: number;
                /** type=UINT8 */
                jitter: number;
            };
            /** ID=0x01 */
            saveStartupParams: {
                /** type=BITMAP8 */
                options: number;
                /** type=UINT8 */
                index: number;
            };
            /** ID=0x02 */
            restoreStartupParams: {
                /** type=BITMAP8 */
                options: number;
                /** type=UINT8 */
                index: number;
            };
            /** ID=0x03 | required=true */
            resetStartupParams: {
                /** type=BITMAP8 */
                options: number;
                /** type=UINT8 */
                index: number;
            };
        };
        commandResponses: {
            /** ID=0x00 | required=true */
            restartDeviceRsp: {
                /** type=ENUM8 */
                status: number;
            };
            /** ID=0x01 | required=true */
            saveStartupParamsRsp: {
                /** type=ENUM8 */
                status: number;
            };
            /** ID=0x02 | required=true */
            restoreStartupParamsRsp: {
                /** type=ENUM8 */
                status: number;
            };
            /** ID=0x03 | required=true */
            resetStartupParamsRsp: {
                /** type=ENUM8 */
                status: number;
            };
        };
    };
    piPartition: {
        attributes: {
            /** ID=0x0000 | type=UINT16 | required=true | max=65535 | default=1280 */
            maximumIncomingTransferSize: number;
            /** ID=0x0001 | type=UINT16 | required=true | max=65535 | default=1280 */
            maximumOutgoingTransferSize: number;
            /** ID=0x0002 | type=UINT8 | required=true | write=true | max=255 | default=80 */
            partionedFrameSize: number;
            /** ID=0x0003 | type=UINT16 | required=true | write=true | max=65535 | default=1280 */
            largeFrameSize: number;
            /** ID=0x0004 | type=UINT8 | required=true | write=true | max=255 | default=100 */
            numberOfAckFrame: number;
            /** ID=0x0005 | type=UINT16 | required=true | max=65535 */
            nackTimeout: number;
            /** ID=0x0006 | type=UINT8 | required=true | write=true | max=255 */
            interframeDelay: number;
            /** ID=0x0007 | type=UINT8 | required=true | max=255 | default=3 */
            numberOfSendRetries: number;
            /** ID=0x0008 | type=UINT16 | required=true | max=65535 */
            senderTimeout: number;
            /** ID=0x0009 | type=UINT16 | required=true | max=65535 */
            receiverTimeout: number;
        };
        commands: {
            /** ID=0x00 | required=true */
            transferPartionedFrame: {
                /** type=BITMAP8 */
                fragmentionOptions: number;
                /** type=UINT8 | conditions=[{bitMaskSet param=fragmentationOptions mask=2 reversed=true}] */
                partitionIndicator?: number;
                /** type=OCTET_STR */
                partitionedFrame: Buffer;
            };
            /** ID=0x01 | required=true | response=1 */
            readHandshakeParam: {
                /** type=CLUSTER_ID */
                partitionedClusterId: number;
                /** type=LIST_UINT16 */
                attributeIds: number[];
            };
            /** ID=0x02 | required=true */
            writeHandshakeParam: {
                /** type=CLUSTER_ID */
                partitionedClusterId: number;
            };
        };
        commandResponses: {
            /** ID=0x00 | required=true */
            multipleAck: {
                /** type=BITMAP8 */
                ackOptions: number;
                /** type=UINT8 | conditions=[{bitMaskSet param=fragmentationOptions mask=1 reversed=true}] */
                firstFrameId?: number;
                /** type=LIST_UINT8 | conditions=[{bitMaskSet param=fragmentationOptions mask=1 reversed=true}] */
                nackId?: number[];
            };
            /** ID=0x01 | required=true */
            readHandshakeParamResponse: {
                /** type=CLUSTER_ID */
                partitionedClusterId: number;
            };
        };
    };
    genOta: {
        attributes: {
            /** ID=0x0000 | type=IEEE_ADDR | client=true | required=true | default=0xffffffffffffffff */
            upgradeServerId: string;
            /** ID=0x0001 | type=UINT32 | client=true | max=4294967295 | default=4294967295 */
            fileOffset: number;
            /** ID=0x0002 | type=UINT32 | client=true | max=4294967295 | default=4294967295 */
            currentFileVersion: number;
            /** ID=0x0003 | type=UINT16 | client=true | max=65535 | default=65535 */
            currentZigbeeStackVersion: number;
            /** ID=0x0004 | type=UINT32 | client=true | max=4294967295 | default=4294967295 */
            downloadedFileVersion: number;
            /** ID=0x0005 | type=UINT16 | client=true | max=65535 | default=65535 */
            downloadedZigbeeStackVersion: number;
            /** ID=0x0006 | type=ENUM8 | client=true | required=true | max=255 | default=0 */
            imageUpgradeStatus: number;
            /** ID=0x0007 | type=UINT16 | client=true | max=65535 */
            manufacturerId: number;
            /** ID=0x0008 | type=UINT16 | client=true | max=65535 */
            imageTypeId: number;
            /** ID=0x0009 | type=UINT16 | client=true | max=65534 | default=0 */
            minimumBlockReqDelay: number;
            /** ID=0x000a | type=UINT32 | client=true | max=4294967295 */
            imageStamp: number;
            /** ID=0x000b | type=ENUM8 | client=true | default=0 */
            upgradeActivationPolicy: number;
            /** ID=0x000c | type=ENUM8 | client=true | default=0 */
            upgradeTimeoutPolicy: number;
        };
        commands: {
            /** ID=0x01 | response=2 | required=true */
            queryNextImageRequest: {
                /** type=BITMAP8 */
                fieldControl: number;
                /** type=UINT16 */
                manufacturerCode: number;
                /** type=UINT16 | max=65471 */
                imageType: number;
                /** type=UINT32 */
                fileVersion: number;
                /** type=UINT16 | conditions=[{bitMaskSet param=fieldControl mask=1}] */
                hardwareVersion?: number;
            };
            /** ID=0x03 | response=5 | required=true */
            imageBlockRequest: {
                /** type=BITMAP8 */
                fieldControl: number;
                /** type=UINT16 */
                manufacturerCode: number;
                /** type=UINT16 | max=65471 */
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
                /** type=BITMAP8 */
                fieldControl: number;
                /** type=UINT16 */
                manufacturerCode: number;
                /** type=UINT16 | max=65471 */
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
                /** type=ENUM8 */
                status: number;
                /** type=UINT16 */
                manufacturerCode: number;
                /** type=UINT16 | max=65471 */
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
                /** type=UINT16 | min=65472 | max=65534 */
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
                /** type=ENUM8 */
                payloadType: number;
                /** type=UINT8 */
                queryJitter: number;
                /** type=UINT16 | conditions=[{fieldGT field=payloadType value=0}] */
                manufacturerCode?: number;
                /** type=UINT16 | max=65535 | conditions=[{fieldGT field=payloadType value=1}] */
                imageType?: number;
                /** type=UINT32 | max=4294967295 | conditions=[{fieldGT field=payloadType value=2}] */
                fileVersion?: number;
            };
            /** ID=0x02 | required=true */
            queryNextImageResponse: {
                /** type=ENUM8 */
                status: number;
                /** type=UINT16 | conditions=[{fieldEquals field=status value=0}] */
                manufacturerCode?: number;
                /** type=UINT16 | max=65471 | conditions=[{fieldEquals field=status value=0}] */
                imageType?: number;
                /** type=UINT32 | conditions=[{fieldEquals field=status value=0}] */
                fileVersion?: number;
                /** type=UINT32 | conditions=[{fieldEquals field=status value=0}] */
                imageSize?: number;
            };
            /** ID=0x05 | required=true */
            imageBlockResponse: {
                /** type=ENUM8 */
                status: number;
                /** type=UINT16 | conditions=[{fieldEquals field=status value=0}] */
                manufacturerCode?: number;
                /** type=UINT16 | max=65471 | conditions=[{fieldEquals field=status value=0}] */
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
                /** type=UINT16 | max=1048575 */
                manufacturerCode: number;
                /** type=UINT16 | max=1048575 */
                imageType: number;
                /** type=UINT32 | max=68719476735 */
                fileVersion: number;
                /** type=UTC */
                currentTime: number;
                /** type=UTC */
                upgradeTime: number;
            };
            /** ID=0x09 */
            queryDeviceSpecificFileResponse: {
                /** type=ENUM8 */
                status: number;
                /** type=UINT16 | conditions=[{fieldEquals field=status value=0}] */
                manufacturerCode?: number;
                /** type=UINT16 | min=65472 | max=65534 | conditions=[{fieldEquals field=status value=0}] */
                imageType?: number;
                /** type=UINT32 | conditions=[{fieldEquals field=status value=0}] */
                fileVersion?: number;
                /** type=UINT32 | conditions=[{fieldEquals field=status value=0}] */
                imageSize?: number;
            };
        };
    };
    powerProfile: {
        attributes: {
            /** ID=0x0000 | type=UINT8 | required=true | min=1 | max=254 | default=1 */
            totalProfileNum: number;
            /** ID=0x0001 | type=BOOLEAN | required=true | default=0 */
            multipleScheduling: number;
            /** ID=0x0002 | type=BITMAP8 | required=true | default=1 */
            energyFormatting: number;
            /** ID=0x0003 | type=BOOLEAN | required=true | default=0 */
            energyRemote: number;
            /** ID=0x0004 | type=BITMAP8 | required=true | write=true | report=true | default=0 */
            scheduleMode: number;
        };
        commands: {
            /** ID=0x00 | required=true */
            powerProfileRequest: {
                /** type=UINT8 */
                powerProfileId: number;
            };
            /** ID=0x01 | required=true */
            powerProfileStateRequest: Record<string, never>;
            /** ID=0x02 | required=true */
            getPowerProfilePriceResponse: {
                /** type=UINT8 */
                powerProfileId: number;
                /** type=UINT16 */
                currency: number;
                /** type=UINT32 */
                price: number;
                /** type=UINT8 */
                priceTrailingDigit: number;
            };
            /** ID=0x03 | required=true */
            getOverallSchedulePriceResponse: {
                /** type=UINT16 */
                currency: number;
                /** type=UINT32 */
                price: number;
                /** type=UINT8 */
                priceTrailingDigit: number;
            };
            /** ID=0x04 | required=true */
            energyPhasesScheduleNotification: {
                /** type=UINT8 */
                powerProfileId: number;
                /** type=UINT8 */
                numScheduledPhases: number;
            };
            /** ID=0x05 | required=true */
            energyPhasesScheduleResponse: {
                /** type=UINT8 */
                powerProfileId: number;
                /** type=UINT8 */
                numScheduledPhases: number;
            };
            /** ID=0x06 | required=true */
            powerProfileScheduleConstraintsRequest: {
                /** type=UINT8 */
                powerProfileId: number;
            };
            /** ID=0x07 | required=true */
            energyPhasesScheduleStateRequest: {
                /** type=UINT8 */
                powerProfileId: number;
            };
            /** ID=0x08 | required=true */
            getPowerProfilePriceExtendedResponse: {
                /** type=UINT8 */
                powerProfileId: number;
                /** type=UINT16 */
                currency: number;
                /** type=UINT32 */
                price: number;
                /** type=UINT8 */
                priceTrailingDigit: number;
            };
        };
        commandResponses: {
            /** ID=0x00 | required=true */
            powerProfileNotification: {
                /** type=UINT8 */
                totalProfileNum: number;
                /** type=UINT8 */
                powerProfileId: number;
                /** type=UINT8 */
                numTransferredPhases: number;
            };
            /** ID=0x01 | required=true */
            powerProfileResponse: {
                /** type=UINT8 */
                totalProfileNum: number;
                /** type=UINT8 */
                powerProfileId: number;
                /** type=UINT8 */
                numTransferredPhases: number;
            };
            /** ID=0x02 | required=true */
            powerProfileStateResponse: {
                /** type=UINT8 */
                powerProfileCount: number;
            };
            /** ID=0x03 */
            getPowerProfilePrice: {
                /** type=UINT8 */
                powerProfileId: number;
            };
            /** ID=0x04 | required=true */
            powerProfilesStateNotification: {
                /** type=UINT8 */
                powerProfileCount: number;
            };
            /** ID=0x05 */
            getOverallSchedulePrice: Record<string, never>;
            /** ID=0x06 | required=true */
            energyPhasesScheduleRequest: {
                /** type=UINT8 */
                powerProfileId: number;
            };
            /** ID=0x07 | required=true */
            energyPhasesScheduleStateResponse: {
                /** type=UINT8 */
                powerProfileId: number;
                /** type=UINT8 */
                numScheduledPhases: number;
            };
            /** ID=0x08 | required=true */
            energyPhasesScheduleStateNotification: {
                /** type=UINT8 */
                powerProfileId: number;
                /** type=UINT8 */
                numScheduledPhases: number;
            };
            /** ID=0x09 | required=true */
            powerProfileScheduleConstraintsNotification: {
                /** type=UINT8 */
                powerProfileId: number;
                /** type=UINT16 */
                startAfter: number;
                /** type=UINT16 */
                stopBefore: number;
            };
            /** ID=0x0a | required=true */
            powerProfileScheduleConstraintsResponse: {
                /** type=UINT8 */
                powerProfileId: number;
                /** type=UINT16 */
                startAfter: number;
                /** type=UINT16 */
                stopBefore: number;
            };
            /** ID=0x0b */
            getPowerProfilePriceExtended: {
                /** type=BITMAP8 */
                options: number;
                /** type=UINT8 */
                powerProfileId: number;
                /** type=UINT16 | conditions=[{minimumRemainingBufferBytes value=2}] */
                powerProfileStartTime?: number;
            };
        };
    };
    haApplianceControl: {
        attributes: {
            /** ID=0x0000 | type=UINT16 | required=true | report=true | max=65535 | default=0 */
            startTime: number;
            /** ID=0x0001 | type=UINT16 | required=true | report=true | max=65535 | default=0 */
            finishTime: number;
            /** ID=0x0002 | type=UINT16 | report=true | max=65535 | default=0 */
            remainingTime: number;
        };
        commands: {
            /** ID=0x00 */
            executionOfCommand: {
                /** type=ENUM8 */
                commandId: number;
            };
            /** ID=0x01 | response=0 | required=true */
            signalState: Record<string, never>;
            /** ID=0x02 */
            writeFunctions: Record<string, never>;
            /** ID=0x03 */
            overloadPauseResume: Record<string, never>;
            /** ID=0x04 */
            overloadPause: Record<string, never>;
            /** ID=0x05 */
            overloadWarning: {
                /** type=ENUM8 */
                warningEvent: number;
            };
        };
        commandResponses: {
            /** ID=0x00 | required=true */
            signalStateRsp: {
                /** type=ENUM8 */
                applianceStatus: number;
                /** type=BITMAP8 */
                remoteEnableFlagsAndDeviceStatus2: number;
                /** type=UINT24 | conditions=[{minimumRemainingBufferBytes value=3}] */
                applianceStatus2?: number;
            };
            /** ID=0x00 | required=true */
            signalStateNotification: {
                /** type=ENUM8 */
                applianceStatus: number;
                /** type=BITMAP8 */
                remoteEnableFlagsAndDeviceStatus2: number;
                /** type=UINT24 | conditions=[{minimumRemainingBufferBytes value=3}] */
                applianceStatus2?: number;
            };
        };
    };
    pulseWidthModulation: {
        attributes: {
            /** ID=0x0000 | type=UINT8 | report=true | scene=true | required=true | default=255 */
            currentLevel: number;
            /** ID=0x0001 | type=UINT16 | max=65535 | default=0 */
            remainingTime: number;
            /** ID=0x0002 | type=UINT8 | default=0 | required=true */
            minLevel: number;
            /** ID=0x0003 | type=UINT8 | max=100 | default=100 | required=true */
            maxLevel: number;
            /** ID=0x0004 | type=UINT16 | report=true | default=0 | required=true */
            currentFrequency: number;
            /** ID=0x0005 | type=UINT16 | default=0 | required=true */
            minFrequency: number;
            /** ID=0x0006 | type=UINT16 | max=65535 | default=0 | required=true */
            maxFrequency: number;
            /** ID=0x000f | type=BITMAP8 | write=true | default=0 */
            options: number;
            /** ID=0x0010 | type=UINT16 | write=true | max=65535 | default=0 */
            onOffTransitionTime: number;
            /** ID=0x0011 | type=UINT8 | write=true | default=255 */
            onLevel: number;
            /** ID=0x0012 | type=UINT16 | write=true | max=65534 | default=65535 */
            onTransitionTime: number;
            /** ID=0x0013 | type=UINT16 | write=true | max=65534 | default=65535 */
            offTransitionTime: number;
            /** ID=0x0014 | type=UINT8 | write=true | max=254 */
            defaultMoveRate: number;
            /** ID=0x4000 | type=UINT8 | write=true | max=255 | special=MinimumDeviceValuePermitted,00,SetToPreviousValue,ff */
            startUpCurrentLevel: number;
        };
        commands: {
            /** ID=0x00 | required=true */
            moveToLevel: {
                /** type=UINT8 */
                level: number;
                /** type=UINT16 */
                transtime: number;
                /** type=BITMAP8 | conditions=[{minimumRemainingBufferBytes value=1}] */
                optionsMask?: number;
                /** type=BITMAP8 | conditions=[{minimumRemainingBufferBytes value=1}] */
                optionsOverride?: number;
            };
            /** ID=0x01 | required=true */
            move: {
                /** type=UINT8 */
                movemode: number;
                /** type=UINT8 */
                rate: number;
                /** type=BITMAP8 | conditions=[{minimumRemainingBufferBytes value=1}] */
                optionsMask?: number;
                /** type=BITMAP8 | conditions=[{minimumRemainingBufferBytes value=1}] */
                optionsOverride?: number;
            };
            /** ID=0x02 | required=true */
            step: {
                /** type=UINT8 */
                stepmode: number;
                /** type=UINT8 */
                stepsize: number;
                /** type=UINT16 */
                transtime: number;
                /** type=BITMAP8 | conditions=[{minimumRemainingBufferBytes value=1}] */
                optionsMask?: number;
                /** type=BITMAP8 | conditions=[{minimumRemainingBufferBytes value=1}] */
                optionsOverride?: number;
            };
            /** ID=0x03 | required=true */
            stop: {
                /** type=BITMAP8 | conditions=[{minimumRemainingBufferBytes value=1}] */
                optionsMask?: number;
                /** type=BITMAP8 | conditions=[{minimumRemainingBufferBytes value=1}] */
                optionsOverride?: number;
            };
            /** ID=0x04 | required=true */
            moveToLevelWithOnOff: {
                /** type=UINT8 */
                level: number;
                /** type=UINT16 */
                transtime: number;
                /** type=BITMAP8 | conditions=[{minimumRemainingBufferBytes value=1}] */
                optionsMask?: number;
                /** type=BITMAP8 | conditions=[{minimumRemainingBufferBytes value=1}] */
                optionsOverride?: number;
            };
            /** ID=0x05 | required=true */
            moveWithOnOff: {
                /** type=UINT8 */
                movemode: number;
                /** type=UINT8 */
                rate: number;
                /** type=BITMAP8 | conditions=[{minimumRemainingBufferBytes value=1}] */
                optionsMask?: number;
                /** type=BITMAP8 | conditions=[{minimumRemainingBufferBytes value=1}] */
                optionsOverride?: number;
            };
            /** ID=0x06 | required=true */
            stepWithOnOff: {
                /** type=UINT8 */
                stepmode: number;
                /** type=UINT8 */
                stepsize: number;
                /** type=UINT16 */
                transtime: number;
                /** type=BITMAP8 | conditions=[{minimumRemainingBufferBytes value=1}] */
                optionsMask?: number;
                /** type=BITMAP8 | conditions=[{minimumRemainingBufferBytes value=1}] */
                optionsOverride?: number;
            };
            /** ID=0x07 | required=true */
            stopWithOnOff: {
                /** type=BITMAP8 | conditions=[{minimumRemainingBufferBytes value=1}] */
                optionsMask?: number;
                /** type=BITMAP8 | conditions=[{minimumRemainingBufferBytes value=1}] */
                optionsOverride?: number;
            };
            /** ID=0x08 | required=true */
            moveToClosestFrequency: {
                /** type=UINT16 */
                frequency: number;
            };
        };
        commandResponses: never;
    };
    genPollCtrl: {
        attributes: {
            /** ID=0x0000 | type=UINT32 | write=true | required=true | max=7208960 | default=14400 */
            checkinInterval: number;
            /** ID=0x0001 | type=UINT32 | required=true | min=4 | max=7208960 | default=20 */
            longPollInterval: number;
            /** ID=0x0002 | type=UINT16 | required=true | min=1 | max=65535 | default=2 */
            shortPollInterval: number;
            /** ID=0x0003 | type=UINT16 | write=true | required=true | min=1 | max=65535 | default=40 */
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
        commandResponses: {
            /** ID=0x00 | required=true */
            checkin: Record<string, never>;
        };
    };
    greenPower: {
        attributes: {
            /** ID=0x0000 | type=UINT8 | required=true | max=255 */
            gpsMaxSinkTableEntries: number;
            /** ID=0x0001 | type=LONG_OCTET_STR | required=true */
            sinkTable: Buffer;
            /** ID=0x0002 | type=BITMAP8 | required=true | write=true | default=1 */
            gpsCommunicationMode: number;
            /** ID=0x0003 | type=BITMAP8 | required=true | write=true | default=2 */
            gpsCommissioningExitMode: number;
            /** ID=0x0004 | type=UINT16 | write=true | max=65535 | default=180 */
            gpsCommissioningWindow: number;
            /** ID=0x0005 | type=BITMAP8 | required=true | write=true | default=6 */
            gpsSecurityLevel: number;
            /** ID=0x0006 | type=BITMAP24 | required=true */
            gpsFunctionality: number;
            /** ID=0x0007 | type=BITMAP24 | required=true | default=16777215 */
            gpsActiveFunctionality: number;
            /** ID=0x0010 | type=UINT8 | required=true | max=255 | default=20 | client=true */
            gpsMaxProxyTableEntries: number;
            /** ID=0x0011 | type=LONG_OCTET_STR | required=true | default=0 | client=true */
            proxyTable: Buffer;
            /** ID=0x0012 | type=UINT8 | write=true | max=5 | default=2 | client=true */
            gppNotificationRetryNumber: number;
            /** ID=0x0013 | type=UINT8 | write=true | max=255 | default=100 | client=true */
            gppNotificationRetryTimer: number;
            /** ID=0x0014 | type=UINT8 | write=true | max=255 | default=10 | client=true */
            gppMaxSearchCounter: number;
            /** ID=0x0015 | type=LONG_OCTET_STR | client=true */
            gppBlockGpdId: Buffer;
            /** ID=0x0016 | type=BITMAP24 | required=true | client=true */
            gppFunctionality: number;
            /** ID=0x0017 | type=BITMAP24 | required=true | client=true */
            gppActiveFunctionality: number;
            /** ID=0x0020 | type=BITMAP8 | write=true | max=7 | default=0 */
            gpSharedSecurityKeyType: number;
            /** ID=0x0021 | type=SEC_KEY | write=true */
            gpSharedSecurityKey: Buffer;
            /** ID=0x0022 | type=SEC_KEY | write=true */
            gpLinkKey: Buffer;
        };
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
            /** ID=0x01 */
            pairingSearch: {
                /** type=BITMAP16 */
                options: number;
                /** type=UINT32 | conditions=[{bitFieldEnum param=options offset=0 size=3 value=0}] */
                srcID?: number;
                /** type=IEEE_ADDR | conditions=[{bitFieldEnum param=options offset=0 size=3 value=2}] */
                gpdIEEEAddr?: string;
                /** type=UINT8 | conditions=[{bitFieldEnum param=options offset=0 size=3 value=2}] */
                gpdEndpoint?: number;
            };
            /** ID=0x03 */
            tunnelingStop: {
                /** type=BITMAP8 */
                options: number;
                /** type=UINT32 | conditions=[{bitFieldEnum param=options offset=0 size=3 value=0}] */
                srcID?: number;
                /** type=IEEE_ADDR | conditions=[{bitFieldEnum param=options offset=0 size=3 value=2}] */
                gpdIEEEAddr?: string;
                /** type=UINT8 | conditions=[{bitFieldEnum param=options offset=0 size=3 value=2}] */
                gpdEndpoint?: number;
                /** type=UINT32 */
                gpdSecurityFrameCounter: number;
                /** type=UINT16 */
                gppShortAddress: number;
                /** type=BITMAP8 */
                gppGpdLink: number;
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
            /** ID=0x04 */
            sinkCommissioningMode: {
                /** type=BITMAP8 */
                options: number;
                /** type=UINT16 | max=65535 */
                gpmAddressForSecurity: number;
                /** type=UINT16 | max=65535 */
                gpmAddressForPairing: number;
                /** type=UINT8 */
                sinkEndpoint: number;
            };
            /** ID=0x07 */
            translationTableUpdate: {
                /** type=BITMAP16 */
                options: number;
                /** type=UINT32 | conditions=[{bitFieldEnum param=options offset=0 size=3 value=0}] */
                srcID?: number;
                /** type=IEEE_ADDR | conditions=[{bitFieldEnum param=options offset=0 size=3 value=2}] */
                gpdIEEEAddr?: string;
                /** type=UINT8 | conditions=[{bitFieldEnum param=options offset=0 size=3 value=2}] */
                gpdEndpoint?: number;
            };
            /** ID=0x08 | response=8 */
            translationTableReq: {
                /** type=UINT8 */
                startIndex: number;
            };
            /** ID=0x0a | response=10 */
            sinkTableReq: {
                /** type=BITMAP8 */
                options: number;
                /** type=UINT32 | conditions=[{bitFieldEnum param=options offset=0 size=3 value=0}] */
                srcID?: number;
                /** type=IEEE_ADDR | conditions=[{bitFieldEnum param=options offset=0 size=3 value=2}] */
                gpdIEEEAddr?: string;
                /** type=UINT8 | conditions=[{bitFieldEnum param=options offset=0 size=3 value=2}] */
                gpdEndpoint?: number;
                /** type=UINT8 */
                index: number;
            };
            /** ID=0x0b */
            proxyTableRsp: {
                /** type=ENUM8 */
                status: number;
                /** type=UINT8 */
                totalNumberNonEmptyEntries: number;
                /** type=UINT8 */
                startIndex: number;
                /** type=UINT8 */
                entriesCount: number;
            };
        };
        commandResponses: {
            /** ID=0x00 */
            notificationResponse: {
                /** type=BITMAP8 */
                options: number;
                /** type=UINT32 | conditions=[{bitFieldEnum param=options offset=0 size=3 value=0}] */
                srcID?: number;
                /** type=IEEE_ADDR | conditions=[{bitFieldEnum param=options offset=0 size=3 value=2}] */
                gpdIEEEAddr?: string;
                /** type=UINT8 | conditions=[{bitFieldEnum param=options offset=0 size=3 value=2}] */
                gpdEndpoint?: number;
                /** type=UINT32 */
                gpdSecurityFrameCounter: number;
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
            /** ID=0x08 */
            translationTableRsp: {
                /** type=ENUM8 */
                status: number;
                /** type=BITMAP8 */
                options: number;
                /** type=UINT8 */
                totalNumberEntries: number;
                /** type=UINT8 */
                startIndex: number;
                /** type=UINT8 */
                entriesCount: number;
            };
            /** ID=0x0a */
            sinkTableRsp: {
                /** type=ENUM8 */
                status: number;
                /** type=UINT8 */
                totalNumberNonEmptyEntries: number;
                /** type=UINT8 */
                startIndex: number;
                /** type=UINT8 */
                entriesCount: number;
            };
            /** ID=0x0b */
            proxyTableReq: {
                /** type=BITMAP8 */
                options: number;
                /** type=UINT32 | conditions=[{bitFieldEnum param=options offset=0 size=3 value=0}] */
                srcID?: number;
                /** type=IEEE_ADDR | conditions=[{bitFieldEnum param=options offset=0 size=3 value=2}] */
                gpdIEEEAddr?: string;
                /** type=UINT8 | conditions=[{bitFieldEnum param=options offset=0 size=3 value=2}] */
                gpdEndpoint?: number;
                /** type=UINT8 */
                index: number;
            };
        };
    };
    mobileDeviceCfg: {
        attributes: {
            /** ID=0x0000 | type=UINT16 | required=true | write=true | min=1 | max=65535 | default=15 */
            keepAliveTime: number;
            /** ID=0x0001 | type=UINT16 | required=true | write=true | max=65535 | default=65535 | special=Never,ffff */
            rejoinTimeout: number;
        };
        commands: never;
        commandResponses: {
            /** ID=0x00 | required=true */
            keepAliveNotification: {
                /** type=UINT16 */
                keepAliveTime: number;
                /** type=UINT16 */
                rejoinTimeout: number;
            };
        };
    };
    neighborCleaning: {
        attributes: {
            /** ID=0x0000 | type=UINT16 | required=true | write=true | min=1 | max=65535 | default=30 */
            neighborCleaningTimeout: number;
        };
        commands: {
            /** ID=0x00 | required=true */
            purgeEntries: Record<string, never>;
        };
        commandResponses: never;
    };
    nearestGateway: {
        attributes: {
            /** ID=0x0000 | type=UINT16 | required=true | write=true | max=65528 | default=0 */
            nearestGateway: number;
            /** ID=0x0001 | type=UINT16 | required=true | read=false | write=true | max=65528 | default=0 */
            newMobileNode: number;
        };
        commands: never;
        commandResponses: never;
    };
    keepAlive: {
        attributes: {
            /** ID=0x0000 | type=UINT8 | required=true | max=255 | default=10 */
            tcKeepAliveBase: number;
            /** ID=0x0001 | type=UINT16 | required=true | max=65535 | default=300 */
            tcKeepAliveJitter: number;
        };
        commands: never;
        commandResponses: never;
    };
    closuresShadeCfg: {
        attributes: {
            /** ID=0x0000 | type=UINT16 | min=1 | max=65534 */
            physicalClosedLimit: number;
            /** ID=0x0001 | type=UINT8 | max=254 */
            motorStepSize: number;
            /** ID=0x0002 | type=BITMAP8 | write=true | required=true | default=0 */
            status: number;
            /** ID=0x0010 | type=UINT16 | write=true | required=true | min=1 | max=65534 | default=1 */
            closedLimit: number;
            /** ID=0x0011 | type=ENUM8 | write=true | required=true | max=254 | default=0 */
            mode: number;
        };
        commands: never;
        commandResponses: never;
    };
    closuresDoorLock: {
        attributes: {
            /** ID=0x0000 | type=ENUM8 | report=true | required=true */
            lockState: number;
            /** ID=0x0001 | type=ENUM8 | required=true */
            lockType: number;
            /** ID=0x0002 | type=BOOLEAN | required=true */
            actuatorEnabled: number;
            /** ID=0x0003 | type=ENUM8 | report=true */
            doorState: number;
            /** ID=0x0004 | type=UINT32 | write=true */
            doorOpenEvents: number;
            /** ID=0x0005 | type=UINT32 | write=true */
            doorClosedEvents: number;
            /** ID=0x0006 | type=UINT16 | write=true */
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
            /** ID=0x0020 | type=BOOLEAN | write=true | writeOptional=true | report=true | default=0 */
            enableLogging: number;
            /** ID=0x0021 | type=CHAR_STR | write=true | writeOptional=true | report=true | default= | length=2 */
            language: string;
            /** ID=0x0022 | type=UINT8 | write=true | writeOptional=true | report=true | default=0 */
            ledSettings: number;
            /** ID=0x0023 | type=UINT32 | write=true | writeOptional=true | report=true | default=0 | special=Disabled,0 */
            autoRelockTime: number;
            /** ID=0x0024 | type=UINT8 | write=true | writeOptional=true | report=true | default=0 */
            soundVolume: number;
            /** ID=0x0025 | type=ENUM8 | write=true | writeOptional=true | report=true | default=0 */
            operatingMode: number;
            /** ID=0x0026 | type=BITMAP16 | default=1 */
            supportedOperatingModes: number;
            /** ID=0x0027 | type=BITMAP16 | report=true | default=0 */
            defaultConfigurationRegister: number;
            /** ID=0x0028 | type=BOOLEAN | write=true | writeOptional=true | report=true | default=1 */
            enableLocalProgramming: number;
            /** ID=0x0029 | type=BOOLEAN | write=true | report=true | default=0 */
            enableOneTouchLocking: number;
            /** ID=0x002a | type=BOOLEAN | write=true | report=true | default=0 */
            enableInsideStatusLed: number;
            /** ID=0x002b | type=BOOLEAN | write=true | report=true | default=0 */
            enablePrivacyModeButton: number;
            /** ID=0x0030 | type=UINT8 | write=true | writeOptional=true | report=true | default=0 */
            wrongCodeEntryLimit: number;
            /** ID=0x0031 | type=UINT8 | write=true | writeOptional=true | report=true | default=0 */
            userCodeTemporaryDisableTime: number;
            /** ID=0x0032 | type=BOOLEAN | write=true | writeOptional=true | report=true | default=0 */
            sendPinOta: number;
            /** ID=0x0033 | type=BOOLEAN | write=true | writeOptional=true | report=true | default=0 */
            requirePinForRfOperation: number;
            /** ID=0x0034 | type=ENUM8 | report=true | default=0 */
            zigbeeSecurityLevel: number;
            /** ID=0x0040 | type=BITMAP16 | write=true | report=true | default=0 */
            alarmMask: number;
            /** ID=0x0041 | type=BITMAP16 | write=true | report=true | default=0 */
            keypadOperationEventMask: number;
            /** ID=0x0042 | type=BITMAP16 | write=true | report=true | default=0 */
            rfOperationEventMask: number;
            /** ID=0x0043 | type=BITMAP16 | write=true | report=true | default=0 */
            manualOperationEventMask: number;
            /** ID=0x0044 | type=BITMAP16 | write=true | report=true | default=0 */
            rfidOperationEventMask: number;
            /** ID=0x0045 | type=BITMAP16 | write=true | report=true | default=0 */
            keypadProgrammingEventMask: number;
            /** ID=0x0046 | type=BITMAP16 | write=true | report=true | default=0 */
            rfProgrammingEventMask: number;
            /** ID=0x0047 | type=BITMAP16 | write=true | report=true | default=0 */
            rfidProgrammingEventMask: number;
        };
        commands: {
            /** ID=0x00 | response=0 | required=true */
            lockDoor: {
                /** type=OCTET_STR */
                pincodevalue: Buffer;
            };
            /** ID=0x01 | response=1 | required=true */
            unlockDoor: {
                /** type=OCTET_STR */
                pincodevalue: Buffer;
            };
            /** ID=0x02 | response=2 */
            toggleDoor: {
                /** type=OCTET_STR */
                pincodevalue: Buffer;
            };
            /** ID=0x03 | response=3 */
            unlockWithTimeout: {
                /** type=UINT16 */
                timeout: number;
                /** type=OCTET_STR */
                pincodevalue: Buffer;
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
                /** type=ENUM8 */
                usertype: number;
                /** type=OCTET_STR */
                pincodevalue: Buffer;
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
                /** type=BITMAP8 */
                daysmask: number;
                /** type=UINT8 | min=0 | max=23 */
                starthour: number;
                /** type=UINT8 | min=0 | max=59 */
                startminute: number;
                /** type=UINT8 | min=0 | max=23 */
                endhour: number;
                /** type=UINT8 | min=0 | max=59 */
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
                /** type=UINT32 */
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
                /** type=UINT32 */
                zigbeelocalendtime: number;
                /** type=ENUM8 */
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
                /** type=ENUM8 */
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
                /** type=ENUM8 */
                usertype: number;
                /** type=OCTET_STR */
                pincodevalue: Buffer;
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
                /** type=ENUM8 */
                status: number;
            };
            /** ID=0x01 | required=true */
            unlockDoorRsp: {
                /** type=ENUM8 */
                status: number;
            };
            /** ID=0x02 */
            toggleDoorRsp: {
                /** type=ENUM8 */
                status: number;
            };
            /** ID=0x03 */
            unlockWithTimeoutRsp: {
                /** type=ENUM8 */
                status: number;
            };
            /** ID=0x04 */
            getLogRecordRsp: {
                /** type=UINT16 */
                logentryid: number;
                /** type=UINT32 */
                timestamp: number;
                /** type=ENUM8 */
                eventtype: number;
                /** type=UINT8 */
                source: number;
                /** type=UINT8 */
                eventidalarmcode: number;
                /** type=UINT16 */
                userid: number;
                /** type=OCTET_STR */
                pincodevalue: Buffer;
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
                /** type=ENUM8 */
                usertype: number;
                /** type=OCTET_STR */
                pincodevalue: Buffer;
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
                /** type=BITMAP8 */
                daysmask: number;
                /** type=UINT8 | min=0 | max=23 */
                starthour: number;
                /** type=UINT8 | min=0 | max=59 */
                startminute: number;
                /** type=UINT8 | min=0 | max=23 */
                endhour: number;
                /** type=UINT8 | min=0 | max=59 */
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
                /** type=ENUM8 */
                status: number;
                /** type=UINT32 */
                zigbeelocalstarttime: number;
                /** type=UINT32 */
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
                /** type=UINT32 */
                zigbeelocalendtime: number;
                /** type=ENUM8 */
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
                /** type=ENUM8 */
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
                /** type=ENUM8 */
                usertype: number;
                /** type=OCTET_STR */
                pincodevalue: Buffer;
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
                /** type=CHAR_STR */
                data: string;
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
                /** type=ENUM8 */
                usertype: number;
                /** type=UINT8 */
                userstatus: number;
                /** type=UINT32 */
                zigbeelocaltime: number;
                /** type=CHAR_STR */
                data: string;
            };
        };
    };
    closuresWindowCovering: {
        attributes: {
            /** ID=0x0000 | type=ENUM8 | required=true | default=0 */
            windowCoveringType: number;
            /** ID=0x0001 | type=UINT16 | max=65535 | default=0 */
            physicalClosedLimitLiftCm: number;
            /** ID=0x0002 | type=UINT16 | max=65535 | default=0 */
            physicalClosedLimitTiltDdegree: number;
            /** ID=0x0003 | type=UINT16 | max=65535 | default=0 */
            currentPositionLiftCm: number;
            /** ID=0x0004 | type=UINT16 | max=65535 | default=0 */
            currentPositionTiltDdegree: number;
            /** ID=0x0005 | type=UINT16 | max=65535 | default=0 */
            numOfActuationsLift: number;
            /** ID=0x0006 | type=UINT16 | max=65535 | default=0 */
            numOfActuationsTilt: number;
            /** ID=0x0007 | type=BITMAP8 | required=true | default=3 */
            configStatus: number;
            /** ID=0x0008 | type=UINT8 | report=true | scene=true | max=100 | default=0 */
            currentPositionLiftPercentage: number;
            /** ID=0x0009 | type=UINT8 | report=true | scene=true | max=100 | default=0 */
            currentPositionTiltPercentage: number;
            /** ID=0x0010 | type=UINT16 | max=65535 | default=0 */
            installedOpenLimitLiftCm: number;
            /** ID=0x0011 | type=UINT16 | max=65535 | default=65535 */
            installedClosedLimitLiftCm: number;
            /** ID=0x0012 | type=UINT16 | max=65535 | default=0 */
            installedOpenLimitTiltDdegree: number;
            /** ID=0x0013 | type=UINT16 | max=65535 | default=65535 */
            installedClosedLimitTiltDdegree: number;
            /** ID=0x0014 | type=UINT16 | write=true | max=65535 | default=0 */
            velocityLift: number;
            /** ID=0x0015 | type=UINT16 | write=true | max=65535 | default=0 */
            accelerationTimeLift: number;
            /** ID=0x0016 | type=UINT16 | write=true | max=65535 | default=0 */
            decelerationTimeLift: number;
            /** ID=0x0017 | type=BITMAP8 | write=true | required=true | default=4 */
            windowCoveringMode: number;
            /** ID=0x0018 | type=OCTET_STR | write=true | default=1,0x0000 */
            intermediateSetpointsLift: Buffer;
            /** ID=0x0019 | type=OCTET_STR | write=true | default=1,0x0000 */
            intermediateSetpointsTilt: Buffer;
            /** ID=0x000a | type=BITMAP8 */
            operationalStatus: number;
            /** ID=0xe000 | type=UINT16 | manufacturerCode=ADEO(0x1277) | write=true | max=65535 */
            elkoDriveCloseDuration?: number;
            /** ID=0xe010 | type=BITMAP8 | manufacturerCode=ADEO(0x1277) | write=true */
            elkoProtectionStatus?: number;
            /** ID=0xe012 | type=UINT16 | manufacturerCode=ADEO(0x1277) | write=true | max=65535 */
            elkoSunProtectionIlluminanceThreshold?: number;
            /** ID=0xe013 | type=BITMAP8 | manufacturerCode=ADEO(0x1277) | write=true */
            elkoProtectionSensor?: number;
            /** ID=0xe014 | type=UINT16 | manufacturerCode=ADEO(0x1277) | write=true | max=65535 */
            elkoLiftDriveUpTime?: number;
            /** ID=0xe015 | type=UINT16 | manufacturerCode=ADEO(0x1277) | write=true | max=65535 */
            elkoLiftDriveDownTime?: number;
            /** ID=0xe016 | type=UINT16 | manufacturerCode=ADEO(0x1277) | write=true | max=65535 */
            elkoTiltOpenCloseAndStepTime?: number;
            /** ID=0xe017 | type=UINT8 | manufacturerCode=ADEO(0x1277) | write=true | max=255 */
            elkoTiltPositionPercentageAfterMoveToLevel?: number;
            /** ID=0xf000 | type=ENUM8 | write=true | max=255 */
            tuyaMovingState: number;
            /** ID=0xf001 | type=ENUM8 | write=true | max=255 */
            tuyaCalibration: number;
            /** ID=0xf001 | type=ENUM8 | manufacturerCode=LEGRAND_GROUP(0x1021) | write=true | max=255 */
            stepPositionLift?: number;
            /** ID=0xf002 | type=ENUM8 | write=true | max=255 */
            tuyaMotorReversal: number;
            /** ID=0xf002 | type=ENUM8 | manufacturerCode=LEGRAND_GROUP(0x1021) | write=true | max=255 */
            calibrationMode?: number;
            /** ID=0xf003 | type=UINT16 | write=true | max=65535 */
            moesCalibrationTime: number;
            /** ID=0xf003 | type=ENUM8 | manufacturerCode=LEGRAND_GROUP(0x1021) | write=true | max=255 */
            targetPositionTiltPercentage?: number;
            /** ID=0xf004 | type=ENUM8 | manufacturerCode=LEGRAND_GROUP(0x1021) | write=true | max=255 */
            stepPositionTilt?: number;
            /** ID=0xfcc1 | type=UINT16 | manufacturerCode=NIKO_NV(0x125f) | write=true | max=65535 */
            nikoCalibrationTimeUp?: number;
            /** ID=0xfcc2 | type=UINT16 | manufacturerCode=NIKO_NV(0x125f) | write=true | max=65535 */
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
                /** type=UINT16 */
                liftvalue: number;
            };
            /** ID=0x05 */
            goToLiftPercentage: {
                /** type=UINT8 | max=100 */
                percentageliftvalue: number;
            };
            /** ID=0x07 */
            goToTiltValue: {
                /** type=UINT16 */
                tiltvalue: number;
            };
            /** ID=0x08 */
            goToTiltPercentage: {
                /** type=UINT8 | max=100 */
                percentagetiltvalue: number;
            };
            /** ID=0x80 */
            elkoStopOrStepLiftPercentage: {
                /** type=UINT16 | max=65535 */
                direction: number;
                /** type=UINT16 | max=65535 */
                stepvalue: number;
            };
        };
        commandResponses: never;
    };
    barrierControl: {
        attributes: {
            /** ID=0x0001 | type=ENUM8 | report=true | required=true */
            movingState: number;
            /** ID=0x0002 | type=BITMAP16 | report=true | required=true */
            safetyStatus: number;
            /** ID=0x0003 | type=BITMAP8 | required=true */
            capabilities: number;
            /** ID=0x0004 | type=UINT16 | write=true | max=65534 | default=0 */
            openEvents: number;
            /** ID=0x0005 | type=UINT16 | write=true | max=65534 | default=0 */
            closeEvents: number;
            /** ID=0x0006 | type=UINT16 | write=true | max=65534 | default=0 */
            commandOpenEvents: number;
            /** ID=0x0007 | type=UINT16 | write=true | max=65534 | default=0 */
            commandCloseEvents: number;
            /** ID=0x0008 | type=UINT16 | write=true | max=65534 */
            openPeriod: number;
            /** ID=0x0009 | type=UINT16 | write=true | max=65534 */
            closePeriod: number;
            /** ID=0x000a | type=UINT8 | report=true | scene=true | required=true | max=100 | special=PositionUnknown,ff */
            barrierPosition: number;
        };
        commands: {
            /** ID=0x00 | required=true */
            goToPercent: {
                /** type=UINT8 | min=0 | max=100 */
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
            /** ID=0x0010 | type=BITMAP16 | report=true */
            pumpStatus: number;
            /** ID=0x0011 | type=ENUM8 | required=true | max=254 */
            effectiveOperationMode: number;
            /** ID=0x0012 | type=ENUM8 | required=true | max=254 */
            effectiveControlMode: number;
            /** ID=0x0013 | type=INT16 | report=true | required=true | min=0 | max=32767 */
            capacity: number;
            /** ID=0x0014 | type=UINT16 | max=65534 */
            speed: number;
            /** ID=0x0015 | type=UINT24 | write=true | max=16777214 | default=0 */
            lifetimeRunningHours: number;
            /** ID=0x0016 | type=UINT24 | write=true | max=16777214 */
            power: number;
            /** ID=0x0017 | type=UINT32 | max=4294967294 | default=0 */
            lifetimeEnergyConsumed: number;
            /** ID=0x0020 | type=ENUM8 | write=true | required=true | max=254 | default=0 */
            operationMode: number;
            /** ID=0x0021 | type=ENUM8 | write=true | max=254 | default=0 */
            controlMode: number;
            /** ID=0x0022 | type=BITMAP16 */
            alarmMask: number;
        };
        commands: never;
        commandResponses: never;
    };
    hvacThermostat: {
        attributes: {
            /** ID=0x0000 | type=INT16 | report=true | required=true | min=-27315 | max=32767 */
            localTemp: number;
            /** ID=0x0001 | type=INT16 | min=-27315 | max=32767 */
            outdoorTemp: number;
            /** ID=0x0002 | type=BITMAP8 | default=1 */
            occupancy: number;
            /** ID=0x0003 | type=INT16 | min=-27315 | max=32767 | default=700 */
            absMinHeatSetpointLimit: number;
            /** ID=0x0004 | type=INT16 | min=-27315 | max=32767 | default=3000 */
            absMaxHeatSetpointLimit: number;
            /** ID=0x0005 | type=INT16 | min=-27315 | max=32767 | default=1600 */
            absMinCoolSetpointLimit: number;
            /** ID=0x0006 | type=INT16 | min=-27315 | max=32767 | default=3200 */
            absMaxCoolSetpointLimit: number;
            /** ID=0x0007 | type=UINT8 | report=true | max=100 */
            pICoolingDemand: number;
            /** ID=0x0008 | type=UINT8 | report=true | max=100 */
            pIHeatingDemand: number;
            /** ID=0x0009 | type=BITMAP8 | write=true | writeOptional=true | default=0 */
            systemTypeConfig: number;
            /** ID=0x0010 | type=INT8 | write=true | min=-25 | max=25 | default=0 */
            localTemperatureCalibration: number;
            /** ID=0x0011 | type=INT16 | write=true | scene=true | default=2600 */
            occupiedCoolingSetpoint: number;
            /** ID=0x0012 | type=INT16 | write=true | scene=true | default=2000 */
            occupiedHeatingSetpoint: number;
            /** ID=0x0013 | type=INT16 | write=true | default=2600 */
            unoccupiedCoolingSetpoint: number;
            /** ID=0x0014 | type=INT16 | write=true | default=2000 */
            unoccupiedHeatingSetpoint: number;
            /** ID=0x0015 | type=INT16 | write=true | min=-27315 | max=32767 | default=700 */
            minHeatSetpointLimit: number;
            /** ID=0x0016 | type=INT16 | write=true | min=-27315 | max=32767 | default=3000 */
            maxHeatSetpointLimit: number;
            /** ID=0x0017 | type=INT16 | write=true | min=-27315 | max=32767 | default=1600 */
            minCoolSetpointLimit: number;
            /** ID=0x0018 | type=INT16 | write=true | min=-27315 | max=32767 | default=3200 */
            maxCoolSetpointLimit: number;
            /** ID=0x0019 | type=INT8 | write=true | writeOptional=true | min=10 | max=25 | default=25 */
            minSetpointDeadBand: number;
            /** ID=0x001a | type=BITMAP8 | write=true | default=0 */
            remoteSensing: number;
            /** ID=0x001b | type=ENUM8 | write=true | required=true | default=4 */
            ctrlSeqeOfOper: number;
            /** ID=0x001c | type=ENUM8 | write=true | required=true | default=1 */
            systemMode: number;
            /** ID=0x001d | type=BITMAP8 | default=0 */
            alarmMask: number;
            /** ID=0x001e | type=ENUM8 | default=0 */
            runningMode: number;
            /** ID=0x0020 | type=ENUM8 */
            startOfWeek: number;
            /** ID=0x0021 | type=UINT8 | max=255 | default=0 */
            numberOfWeeklyTrans: number;
            /** ID=0x0022 | type=UINT8 | max=255 | default=0 */
            numberOfDailyTrans: number;
            /** ID=0x0023 | type=ENUM8 | write=true | default=0 */
            tempSetpointHold: number;
            /** ID=0x0024 | type=UINT16 | write=true | min=0 | max=1440 */
            tempSetpointHoldDuration: number;
            /** ID=0x0025 | type=BITMAP8 | write=true | report=true | default=0 */
            programingOperMode: number;
            /** ID=0x0029 | type=BITMAP16 */
            runningState: number;
            /** ID=0x0030 | type=ENUM8 | default=0 */
            setpointChangeSource: number;
            /** ID=0x0031 | type=INT16 | min=0 | max=65535 */
            setpointChangeAmount: number;
            /** ID=0x0032 | type=UTC | max=4294967294 | default=0 */
            setpointChangeSourceTimeStamp: number;
            /** ID=0x0034 | type=UINT8 | write=true */
            occupiedSetback: number;
            /** ID=0x0035 | type=UINT8 | min=0 */
            occupiedSetbackMin: number;
            /** ID=0x0036 | type=UINT8 */
            occupiedSetbackMax: number;
            /** ID=0x0037 | type=UINT8 | write=true */
            unoccupiedSetback: number;
            /** ID=0x0038 | type=UINT8 | min=0 */
            unoccupiedSetbackMin: number;
            /** ID=0x0039 | type=UINT8 */
            unoccupiedSetbackMax: number;
            /** ID=0x003a | type=UINT8 | write=true */
            emergencyHeatDelta: number;
            /** ID=0x0040 | type=ENUM8 | write=true | default=0 */
            acType: number;
            /** ID=0x0041 | type=UINT16 | write=true | max=65535 | default=0 */
            acCapacity: number;
            /** ID=0x0042 | type=ENUM8 | write=true | default=0 */
            acRefrigerantType: number;
            /** ID=0x0043 | type=ENUM8 | write=true | default=0 */
            acConpressorType: number;
            /** ID=0x0044 | type=BITMAP32 | write=true | max=4294967295 | default=0 */
            acErrorCode: number;
            /** ID=0x0045 | type=ENUM8 | write=true | default=0 */
            acLouverPosition: number;
            /** ID=0x0046 | type=INT16 | min=-27315 | max=32767 */
            acCollTemp: number;
            /** ID=0x0047 | type=ENUM8 | write=true | default=0 */
            acCapacityFormat: number;
            /** ID=0x0101 | type=UINT16 | manufacturerCode=ASTREL_GROUP_SRL(0x1071) | write=true | max=65535 */
            fourNoksHysteresisHigh?: number;
            /** ID=0x0102 | type=UINT16 | manufacturerCode=ASTREL_GROUP_SRL(0x1071) | write=true | max=65535 */
            fourNoksHysteresisLow?: number;
            /** ID=0x0400 | type=ENUM8 | manufacturerCode=SINOPE_TECHNOLOGIES(0x119c) | write=true | max=255 */
            SinopeOccupancy?: number;
            /** ID=0x0401 | type=UINT16 | manufacturerCode=SINOPE_TECHNOLOGIES(0x119c) | write=true | max=65535 */
            SinopeMainCycleOutput?: number;
            /** ID=0x0402 | type=CHAR_STR | write=true */
            elkoDisplayText: string;
            /** ID=0x0402 | type=ENUM8 | manufacturerCode=SINOPE_TECHNOLOGIES(0x119c) | write=true | max=255 */
            SinopeBacklight?: number;
            /** ID=0x0404 | type=UINT16 | manufacturerCode=SINOPE_TECHNOLOGIES(0x119c) | write=true | max=65535 */
            SinopeAuxCycleOutput?: number;
            /** ID=0x4000 | type=ENUM8 | manufacturerCode=VIESSMANN_ELEKTRONIK_GMBH(0x1221) | write=true | max=255 */
            viessmannWindowOpenInternal?: number;
            /** ID=0x4000 | type=ENUM8 | manufacturerCode=DANFOSS_A_S(0x1246) | write=true | max=255 */
            danfossWindowOpenInternal?: number;
            /** ID=0x4001 | type=INT16 | write=true | min=-32768 | max=32767 */
            StelproOutdoorTemp: number;
            /** ID=0x4003 | type=BOOLEAN | manufacturerCode=VIESSMANN_ELEKTRONIK_GMBH(0x1221) | write=true */
            viessmannWindowOpenForce?: number;
            /** ID=0x4003 | type=BOOLEAN | manufacturerCode=DANFOSS_A_S(0x1246) | write=true */
            danfossWindowOpenExternal?: number;
            /** ID=0x4010 | type=ENUM8 | manufacturerCode=DANFOSS_A_S(0x1246) | write=true | max=255 */
            danfossDayOfWeek?: number;
            /** ID=0x4011 | type=UINT16 | manufacturerCode=DANFOSS_A_S(0x1246) | write=true | max=65535 */
            danfossTriggerTime?: number;
            /** ID=0x4012 | type=BOOLEAN | manufacturerCode=VIESSMANN_ELEKTRONIK_GMBH(0x1221) | write=true */
            viessmannAssemblyMode?: number;
            /** ID=0x4012 | type=BOOLEAN | manufacturerCode=DANFOSS_A_S(0x1246) | write=true */
            danfossMountedModeActive?: number;
            /** ID=0x4013 | type=BOOLEAN | manufacturerCode=DANFOSS_A_S(0x1246) | write=true */
            danfossMountedModeControl?: number;
            /** ID=0x4014 | type=BOOLEAN | manufacturerCode=DANFOSS_A_S(0x1246) | write=true */
            danfossThermostatOrientation?: number;
            /** ID=0x4015 | type=INT16 | manufacturerCode=DANFOSS_A_S(0x1246) | write=true | min=-32768 | max=32767 */
            danfossExternalMeasuredRoomSensor?: number;
            /** ID=0x4016 | type=BOOLEAN | manufacturerCode=DANFOSS_A_S(0x1246) | write=true */
            danfossRadiatorCovered?: number;
            /** ID=0x401c | type=ENUM8 | write=true | max=255 */
            StelproSystemMode: number;
            /** ID=0x4020 | type=UINT8 | manufacturerCode=DANFOSS_A_S(0x1246) | write=true | max=255 */
            danfossAlgorithmScaleFactor?: number;
            /** ID=0x4030 | type=BOOLEAN | manufacturerCode=DANFOSS_A_S(0x1246) | write=true */
            danfossHeatAvailable?: number;
            /** ID=0x4031 | type=BOOLEAN | manufacturerCode=DANFOSS_A_S(0x1246) | write=true */
            danfossHeatRequired?: number;
            /** ID=0x4032 | type=BOOLEAN | manufacturerCode=DANFOSS_A_S(0x1246) | write=true */
            danfossLoadBalancingEnable?: number;
            /** ID=0x4040 | type=INT16 | manufacturerCode=DANFOSS_A_S(0x1246) | write=true | min=-32768 | max=32767 */
            danfossLoadRoomMean?: number;
            /** ID=0x404a | type=INT16 | manufacturerCode=DANFOSS_A_S(0x1246) | write=true | min=-32768 | max=32767 */
            danfossLoadEstimate?: number;
            /** ID=0x404b | type=INT8 | manufacturerCode=DANFOSS_A_S(0x1246) | write=true | min=-128 | max=127 */
            danfossRegulationSetpointOffset?: number;
            /** ID=0x404c | type=ENUM8 | manufacturerCode=DANFOSS_A_S(0x1246) | write=true | max=255 */
            danfossAdaptionRunControl?: number;
            /** ID=0x404d | type=BITMAP8 | manufacturerCode=DANFOSS_A_S(0x1246) | write=true */
            danfossAdaptionRunStatus?: number;
            /** ID=0x404e | type=BITMAP8 | manufacturerCode=DANFOSS_A_S(0x1246) | write=true */
            danfossAdaptionRunSettings?: number;
            /** ID=0x404f | type=BOOLEAN | manufacturerCode=DANFOSS_A_S(0x1246) | write=true */
            danfossPreheatStatus?: number;
            /** ID=0x4050 | type=UINT32 | manufacturerCode=DANFOSS_A_S(0x1246) | write=true */
            danfossPreheatTime?: number;
            /** ID=0x4051 | type=BOOLEAN | manufacturerCode=DANFOSS_A_S(0x1246) | write=true */
            danfossWindowOpenFeatureEnable?: number;
            /** ID=0x4100 | type=BITMAP16 | manufacturerCode=DANFOSS_A_S(0x1246) | write=true */
            danfossRoomStatusCode?: number;
            /** ID=0x4110 | type=ENUM8 | manufacturerCode=DANFOSS_A_S(0x1246) | write=true | max=255 */
            danfossOutputStatus?: number;
            /** ID=0x4120 | type=ENUM8 | manufacturerCode=DANFOSS_A_S(0x1246) | write=true | max=255 */
            danfossRoomFloorSensorMode?: number;
            /** ID=0x4121 | type=INT16 | manufacturerCode=DANFOSS_A_S(0x1246) | write=true | min=-32768 | max=32767 */
            danfossFloorMinSetpoint?: number;
            /** ID=0x4122 | type=INT16 | manufacturerCode=DANFOSS_A_S(0x1246) | write=true | min=-32768 | max=32767 */
            danfossFloorMaxSetpoint?: number;
            /** ID=0x4130 | type=ENUM8 | manufacturerCode=DANFOSS_A_S(0x1246) | write=true | max=255 */
            danfossScheduleTypeUsed?: number;
            /** ID=0x4131 | type=ENUM8 | manufacturerCode=DANFOSS_A_S(0x1246) | write=true | max=255 */
            danfossIcon2PreHeat?: number;
            /** ID=0x414f | type=ENUM8 | manufacturerCode=DANFOSS_A_S(0x1246) | write=true | max=255 */
            danfossIcon2PreHeatStatus?: number;
            /** ID=0xe110 | type=ENUM8 | manufacturerCode=SCHNEIDER_ELECTRIC(0x105e) | write=true | max=255 */
            schneiderWiserSpecific?: number;
        };
        commands: {
            /** ID=0x00 | required=true */
            setpointRaiseLower: {
                /** type=ENUM8 */
                mode: number;
                /** type=INT8 */
                amount: number;
            };
            /** ID=0x01 */
            setWeeklySchedule: {
                /** type=UINT8 | min=0 | max=10 */
                numoftrans: number;
                /** type=BITMAP8 */
                dayofweek: number;
                /** type=BITMAP8 */
                mode: number;
                /** type=LIST_THERMO_TRANSITIONS */
                transitions: ThermoTransition[];
            };
            /** ID=0x02 | response=0 */
            getWeeklySchedule: {
                /** type=BITMAP8 */
                daystoreturn: number;
                /** type=BITMAP8 */
                modetoreturn: number;
            };
            /** ID=0x03 */
            clearWeeklySchedule: Record<string, never>;
            /** ID=0x04 | response=1 */
            getRelayStatusLog: Record<string, never>;
            /** ID=0x40 */
            danfossSetpointCommand: {
                /** type=ENUM8 | max=255 */
                setpointType: number;
                /** type=INT16 | min=-32768 | max=32767 */
                setpoint: number;
            };
            /** ID=0x80 */
            schneiderWiserThermostatBoost: {
                /** type=ENUM8 | max=255 */
                command: number;
                /** type=ENUM8 | max=255 */
                enable: number;
                /** type=UINT16 | max=65535 */
                temperature: number;
                /** type=UINT16 | max=65535 */
                duration: number;
            };
            /** ID=0xa0 */
            plugwiseCalibrateValve: Record<string, never>;
            /** ID=0xe0 */
            wiserSmartSetSetpoint: {
                /** type=UINT8 | max=255 */
                operatingmode: number;
                /** type=UINT8 | max=255 */
                zonemode: number;
                /** type=INT16 | min=-32768 | max=32767 */
                setpoint: number;
                /** type=UINT8 | max=255 */
                reserved: number;
            };
            /** ID=0xe1 */
            wiserSmartSetFipMode: {
                /** type=UINT8 | max=255 */
                zonemode: number;
                /** type=ENUM8 | max=255 */
                fipmode: number;
                /** type=UINT8 | max=255 */
                reserved: number;
            };
            /** ID=0xe2 */
            wiserSmartCalibrateValve: Record<string, never>;
        };
        commandResponses: {
            /** ID=0x00 */
            getWeeklyScheduleRsp: {
                /** type=UINT8 | min=0 | max=10 */
                numoftrans: number;
                /** type=BITMAP8 */
                dayofweek: number;
                /** type=BITMAP8 */
                mode: number;
                /** type=LIST_THERMO_TRANSITIONS */
                transitions: ThermoTransition[];
            };
            /** ID=0x01 */
            getRelayStatusLogRsp: {
                /** type=UINT16 */
                timeofday: number;
                /** type=BITMAP8 */
                relaystatus: number;
                /** type=INT16 */
                localtemp: number;
                /** type=UINT8 */
                humidity: number;
                /** type=INT16 */
                setpoint: number;
                /** type=UINT16 */
                unreadentries: number;
            };
        };
    };
    hvacFanCtrl: {
        attributes: {
            /** ID=0x0000 | type=ENUM8 | write=true | required=true | max=6 | default=5 */
            fanMode: number;
            /** ID=0x0001 | type=ENUM8 | write=true | required=true | max=4 | default=2 */
            fanModeSequence: number;
        };
        commands: never;
        commandResponses: never;
    };
    hvacDehumidificationCtrl: {
        attributes: {
            /** ID=0x0000 | type=UINT8 | max=100 */
            relativeHumidity: number;
            /** ID=0x0001 | type=UINT8 | report=true | required=true */
            dehumidCooling: number;
            /** ID=0x0010 | type=UINT8 | write=true | required=true | min=30 | max=100 | default=50 */
            rhDehumidSetpoint: number;
            /** ID=0x0011 | type=ENUM8 | write=true | default=0 */
            relativeHumidityMode: number;
            /** ID=0x0012 | type=ENUM8 | write=true | default=1 */
            dehumidLockout: number;
            /** ID=0x0013 | type=UINT8 | write=true | required=true | min=2 | max=20 | default=2 */
            dehumidHysteresis: number;
            /** ID=0x0014 | type=UINT8 | write=true | required=true | min=20 | max=100 | default=20 */
            dehumidMaxCool: number;
            /** ID=0x0015 | type=ENUM8 | write=true | max=1 | default=0 */
            relativeHumidDisplay: number;
        };
        commands: never;
        commandResponses: never;
    };
    hvacUserInterfaceCfg: {
        attributes: {
            /** ID=0x0000 | type=ENUM8 | write=true | required=true | max=1 | default=0 */
            tempDisplayMode: number;
            /** ID=0x0001 | type=ENUM8 | write=true | required=true | max=5 | default=0 */
            keypadLockout: number;
            /** ID=0x0002 | type=ENUM8 | write=true | max=1 | default=0 */
            programmingVisibility: number;
            /** ID=0x4000 | type=ENUM8 | manufacturerCode=DANFOSS_A_S(0x1246) | write=true | max=255 */
            danfossViewingDirection?: number;
        };
        commands: never;
        commandResponses: never;
    };
    lightingColorCtrl: {
        attributes: {
            /** ID=0x0000 | type=UINT8 | report=true | max=254 | default=0 */
            currentHue: number;
            /** ID=0x0001 | type=UINT8 | report=true | scene=true | max=254 | default=0 */
            currentSaturation: number;
            /** ID=0x0002 | type=UINT16 | max=65534 | default=0 */
            remainingTime: number;
            /** ID=0x0003 | type=UINT16 | report=true | scene=true | max=65279 | default=24939 */
            currentX: number;
            /** ID=0x0004 | type=UINT16 | report=true | scene=true | max=65279 | default=24701 */
            currentY: number;
            /** ID=0x0005 | type=ENUM8 | max=4 */
            driftCompensation: number;
            /** ID=0x0006 | type=CHAR_STR | maxLen=254 */
            compensationText: string;
            /** ID=0x0007 | type=UINT16 | report=true | scene=true | max=65279 | default=250 | special=Undefined,0000 */
            colorTemperature: number;
            /** ID=0x0008 | type=ENUM8 | required=true | max=2 | default=1 */
            colorMode: number;
            /** ID=0x000f | type=BITMAP8 | write=true | required=true | default=0 */
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
            /** ID=0x0030 | type=UINT16 | write=true | max=65279 */
            whitePointX: number;
            /** ID=0x0031 | type=UINT16 | write=true | max=65279 */
            whitePointY: number;
            /** ID=0x0032 | type=UINT16 | write=true | max=65279 */
            colorPointRX: number;
            /** ID=0x0033 | type=UINT16 | write=true | max=65279 */
            colorPointRY: number;
            /** ID=0x0034 | type=UINT8 | write=true | max=255 */
            colorPointRIntensity: number;
            /** ID=0x0036 | type=UINT16 | write=true | max=65279 */
            colorPointGX: number;
            /** ID=0x0037 | type=UINT16 | write=true | max=65279 */
            colorPointGY: number;
            /** ID=0x0038 | type=UINT8 | write=true | max=255 */
            colorPointGIntensity: number;
            /** ID=0x003a | type=UINT16 | write=true | max=65279 */
            colorPointBX: number;
            /** ID=0x003b | type=UINT16 | write=true | max=65279 */
            colorPointBY: number;
            /** ID=0x003c | type=UINT8 | write=true | max=255 */
            colorPointBIntensity: number;
            /** ID=0x4000 | type=UINT16 | scene=true | max=65535 | default=0 */
            enhancedCurrentHue: number;
            /** ID=0x4001 | type=ENUM8 | required=true | max=255 | default=1 */
            enhancedColorMode: number;
            /** ID=0x4002 | type=UINT8 | scene=true | max=255 | default=0 */
            colorLoopActive: number;
            /** ID=0x4003 | type=UINT8 | scene=true | max=255 | default=0 */
            colorLoopDirection: number;
            /** ID=0x4004 | type=UINT16 | scene=true | max=65535 | default=25 */
            colorLoopTime: number;
            /** ID=0x4005 | type=UINT16 | max=65535 | default=8960 */
            colorLoopStartEnhancedHue: number;
            /** ID=0x4006 | type=UINT16 | max=65535 | default=0 */
            colorLoopStoredEnhancedHue: number;
            /** ID=0x400a | type=BITMAP16 | required=true | max=31 | default=0 */
            colorCapabilities: number;
            /** ID=0x400b | type=UINT16 | max=65279 | default=0 */
            colorTempPhysicalMin: number;
            /** ID=0x400c | type=UINT16 | max=65279 | default=65279 */
            colorTempPhysicalMax: number;
            /** ID=0x400d | type=UINT16 */
            coupleColorTempToLevelMin: number;
            /** ID=0x4010 | type=UINT16 | write=true | max=65279 | special=SetColorTempToPreviousValue,ffff */
            startUpColorTemperature: number;
            /** ID=0xf000 | type=UINT8 | write=true | max=255 */
            tuyaRgbMode: number;
            /** ID=0xf001 | type=UINT8 | write=true | max=255 */
            tuyaBrightness: number;
        };
        commands: {
            /** ID=0x00 */
            moveToHue: {
                /** type=UINT8 */
                hue: number;
                /** type=ENUM8 */
                direction: number;
                /** type=UINT16 */
                transtime: number;
                /** type=BITMAP8 | conditions=[{minimumRemainingBufferBytes value=1}] */
                optionsMask?: number;
                /** type=BITMAP8 | conditions=[{minimumRemainingBufferBytes value=1}] */
                optionsOverride?: number;
            };
            /** ID=0x01 */
            moveHue: {
                /** type=ENUM8 */
                movemode: number;
                /** type=UINT8 */
                rate: number;
                /** type=BITMAP8 | conditions=[{minimumRemainingBufferBytes value=1}] */
                optionsMask?: number;
                /** type=BITMAP8 | conditions=[{minimumRemainingBufferBytes value=1}] */
                optionsOverride?: number;
            };
            /** ID=0x02 */
            stepHue: {
                /** type=ENUM8 */
                stepmode: number;
                /** type=UINT8 */
                stepsize: number;
                /** type=UINT8 */
                transtime: number;
                /** type=BITMAP8 | conditions=[{minimumRemainingBufferBytes value=1}] */
                optionsMask?: number;
                /** type=BITMAP8 | conditions=[{minimumRemainingBufferBytes value=1}] */
                optionsOverride?: number;
            };
            /** ID=0x03 */
            moveToSaturation: {
                /** type=UINT8 */
                saturation: number;
                /** type=UINT16 */
                transtime: number;
                /** type=BITMAP8 | conditions=[{minimumRemainingBufferBytes value=1}] */
                optionsMask?: number;
                /** type=BITMAP8 | conditions=[{minimumRemainingBufferBytes value=1}] */
                optionsOverride?: number;
            };
            /** ID=0x04 */
            moveSaturation: {
                /** type=ENUM8 */
                movemode: number;
                /** type=UINT8 */
                rate: number;
                /** type=BITMAP8 | conditions=[{minimumRemainingBufferBytes value=1}] */
                optionsMask?: number;
                /** type=BITMAP8 | conditions=[{minimumRemainingBufferBytes value=1}] */
                optionsOverride?: number;
            };
            /** ID=0x05 */
            stepSaturation: {
                /** type=ENUM8 */
                stepmode: number;
                /** type=UINT8 */
                stepsize: number;
                /** type=UINT8 */
                transtime: number;
                /** type=BITMAP8 | conditions=[{minimumRemainingBufferBytes value=1}] */
                optionsMask?: number;
                /** type=BITMAP8 | conditions=[{minimumRemainingBufferBytes value=1}] */
                optionsOverride?: number;
            };
            /** ID=0x06 */
            moveToHueAndSaturation: {
                /** type=UINT8 */
                hue: number;
                /** type=UINT8 */
                saturation: number;
                /** type=UINT16 */
                transtime: number;
                /** type=BITMAP8 | conditions=[{minimumRemainingBufferBytes value=1}] */
                optionsMask?: number;
                /** type=BITMAP8 | conditions=[{minimumRemainingBufferBytes value=1}] */
                optionsOverride?: number;
            };
            /** ID=0x07 */
            moveToColor: {
                /** type=UINT16 */
                colorx: number;
                /** type=UINT16 */
                colory: number;
                /** type=UINT16 */
                transtime: number;
                /** type=BITMAP8 | conditions=[{minimumRemainingBufferBytes value=1}] */
                optionsMask?: number;
                /** type=BITMAP8 | conditions=[{minimumRemainingBufferBytes value=1}] */
                optionsOverride?: number;
            };
            /** ID=0x08 */
            moveColor: {
                /** type=INT16 */
                ratex: number;
                /** type=INT16 */
                ratey: number;
                /** type=BITMAP8 | conditions=[{minimumRemainingBufferBytes value=1}] */
                optionsMask?: number;
                /** type=BITMAP8 | conditions=[{minimumRemainingBufferBytes value=1}] */
                optionsOverride?: number;
            };
            /** ID=0x09 */
            stepColor: {
                /** type=INT16 */
                stepx: number;
                /** type=INT16 */
                stepy: number;
                /** type=UINT16 */
                transtime: number;
                /** type=BITMAP8 | conditions=[{minimumRemainingBufferBytes value=1}] */
                optionsMask?: number;
                /** type=BITMAP8 | conditions=[{minimumRemainingBufferBytes value=1}] */
                optionsOverride?: number;
            };
            /** ID=0x0a */
            moveToColorTemp: {
                /** type=UINT16 */
                colortemp: number;
                /** type=UINT16 */
                transtime: number;
                /** type=BITMAP8 | conditions=[{minimumRemainingBufferBytes value=1}] */
                optionsMask?: number;
                /** type=BITMAP8 | conditions=[{minimumRemainingBufferBytes value=1}] */
                optionsOverride?: number;
            };
            /** ID=0x40 */
            enhancedMoveToHue: {
                /** type=UINT16 */
                enhancehue: number;
                /** type=ENUM8 */
                direction: number;
                /** type=UINT16 */
                transtime: number;
                /** type=BITMAP8 | conditions=[{minimumRemainingBufferBytes value=1}] */
                optionsMask?: number;
                /** type=BITMAP8 | conditions=[{minimumRemainingBufferBytes value=1}] */
                optionsOverride?: number;
            };
            /** ID=0x41 */
            enhancedMoveHue: {
                /** type=ENUM8 */
                movemode: number;
                /** type=UINT16 */
                rate: number;
                /** type=BITMAP8 | conditions=[{minimumRemainingBufferBytes value=1}] */
                optionsMask?: number;
                /** type=BITMAP8 | conditions=[{minimumRemainingBufferBytes value=1}] */
                optionsOverride?: number;
            };
            /** ID=0x42 */
            enhancedStepHue: {
                /** type=ENUM8 */
                stepmode: number;
                /** type=UINT16 */
                stepsize: number;
                /** type=UINT16 */
                transtime: number;
                /** type=BITMAP8 | conditions=[{minimumRemainingBufferBytes value=1}] */
                optionsMask?: number;
                /** type=BITMAP8 | conditions=[{minimumRemainingBufferBytes value=1}] */
                optionsOverride?: number;
            };
            /** ID=0x43 */
            enhancedMoveToHueAndSaturation: {
                /** type=UINT16 */
                enhancehue: number;
                /** type=UINT8 */
                saturation: number;
                /** type=UINT16 */
                transtime: number;
                /** type=BITMAP8 | conditions=[{minimumRemainingBufferBytes value=1}] */
                optionsMask?: number;
                /** type=BITMAP8 | conditions=[{minimumRemainingBufferBytes value=1}] */
                optionsOverride?: number;
            };
            /** ID=0x44 */
            colorLoopSet: {
                /** type=BITMAP8 */
                updateflags: number;
                /** type=ENUM8 */
                action: number;
                /** type=ENUM8 */
                direction: number;
                /** type=UINT16 */
                time: number;
                /** type=UINT16 */
                starthue: number;
                /** type=BITMAP8 | conditions=[{minimumRemainingBufferBytes value=1}] */
                optionsMask?: number;
                /** type=BITMAP8 | conditions=[{minimumRemainingBufferBytes value=1}] */
                optionsOverride?: number;
            };
            /** ID=0x47 */
            stopMoveStep: {
                /** type=BITMAP8 | conditions=[{minimumRemainingBufferBytes value=1}] */
                optionsMask?: number;
                /** type=BITMAP8 | conditions=[{minimumRemainingBufferBytes value=1}] */
                optionsOverride?: number;
            };
            /** ID=0x4b */
            moveColorTemp: {
                /** type=ENUM8 */
                movemode: number;
                /** type=UINT16 */
                rate: number;
                /** type=UINT16 */
                minimum: number;
                /** type=UINT16 */
                maximum: number;
                /** type=BITMAP8 | conditions=[{minimumRemainingBufferBytes value=1}] */
                optionsMask?: number;
                /** type=BITMAP8 | conditions=[{minimumRemainingBufferBytes value=1}] */
                optionsOverride?: number;
            };
            /** ID=0x4c */
            stepColorTemp: {
                /** type=ENUM8 */
                stepmode: number;
                /** type=UINT16 */
                stepsize: number;
                /** type=UINT16 */
                transtime: number;
                /** type=UINT16 */
                minimum: number;
                /** type=UINT16 */
                maximum: number;
                /** type=BITMAP8 | conditions=[{minimumRemainingBufferBytes value=1}] */
                optionsMask?: number;
                /** type=BITMAP8 | conditions=[{minimumRemainingBufferBytes value=1}] */
                optionsOverride?: number;
            };
            /** ID=0x06 */
            tuyaMoveToHueAndSaturationBrightness: {
                /** type=UINT8 | max=255 */
                hue: number;
                /** type=UINT8 | max=255 */
                saturation: number;
                /** type=UINT16 | max=65535 */
                transtime: number;
                /** type=UINT8 | max=255 */
                brightness: number;
            };
            /** ID=0xe0 */
            tuyaSetMinimumBrightness: {
                /** type=UINT16 | max=65535 */
                minimum: number;
            };
            /** ID=0xe1 */
            tuyaMoveToHueAndSaturationBrightness2: {
                /** type=UINT16 | max=65535 */
                hue: number;
                /** type=UINT16 | max=65535 */
                saturation: number;
                /** type=UINT16 | max=65535 */
                brightness: number;
            };
            /** ID=0xf0 */
            tuyaRgbMode: {
                /** type=UINT8 | max=255 */
                enable: number;
            };
            /** ID=0xf9 */
            tuyaOnStartUp: {
                /** type=UINT16 | max=65535 */
                mode: number;
                /** type=LIST_UINT8 */
                data: number[];
            };
            /** ID=0xfa */
            tuyaDoNotDisturb: {
                /** type=UINT8 | max=255 */
                enable: number;
            };
            /** ID=0xfb */
            tuyaOnOffTransitionTime: {
                /** type=UINT8 | max=255 */
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
            /** ID=0x0010 | type=UINT8 | write=true | required=true | min=1 | max=254 */
            minLevel: number;
            /** ID=0x0011 | type=UINT8 | write=true | required=true | min=1 | max=254 */
            maxLevel: number;
            /** ID=0x0012 | type=UINT8 | write=true | max=254 */
            powerOnLevel: number;
            /** ID=0x0013 | type=UINT16 | write=true | max=65534 | default=0 */
            powerOnFadeTime: number;
            /** ID=0x0014 | type=UINT8 | write=true | max=254 */
            intrinsicBallastFactor: number;
            /** ID=0x0015 | type=UINT8 | write=true | min=100 | default=255 */
            ballastFactorAdjustment: number;
            /** ID=0x0020 | type=UINT8 | max=254 */
            lampQuantity: number;
            /** ID=0x0030 | type=CHAR_STR | write=true | default= | maxLen=16 */
            lampType: string;
            /** ID=0x0031 | type=CHAR_STR | write=true | default= | maxLen=16 */
            lampManufacturer: string;
            /** ID=0x0032 | type=UINT24 | write=true | max=16777214 | default=16777215 */
            lampRatedHours: number;
            /** ID=0x0033 | type=UINT24 | write=true | max=16777214 | default=0 */
            lampBurnHours: number;
            /** ID=0x0034 | type=BITMAP8 | write=true | default=0 */
            lampAlarmMode: number;
            /** ID=0x0035 | type=UINT24 | write=true | max=16777214 | default=16777215 */
            lampBurnHoursTripPoint: number;
            /** ID=0xe000 | type=ENUM8 | manufacturerCode=ADEO(0x1277) | write=true | max=255 */
            elkoControlMode?: number;
            /** ID=0xe000 | type=ENUM8 | manufacturerCode=SCHNEIDER_ELECTRIC(0x105e) | write=true | max=255 */
            wiserControlMode?: number;
        };
        commands: never;
        commandResponses: never;
    };
    msIlluminanceMeasurement: {
        attributes: {
            /** ID=0x0000 | type=UINT16 | report=true | required=true | max=65535 | default=0 | special=TooLowToBeMeasured,0000,Invalid,ffff */
            measuredValue: number;
            /** ID=0x0001 | type=UINT16 | required=true | min=1 | max=65533 */
            minMeasuredValue: number;
            /** ID=0x0002 | type=UINT16 | required=true | min=2 | max=65534 */
            maxMeasuredValue: number;
            /** ID=0x0003 | type=UINT16 | max=2048 */
            tolerance: number;
            /** ID=0x0004 | type=ENUM8 | default=255 | special=Unknown,ff */
            lightSensorType: number;
        };
        commands: never;
        commandResponses: never;
    };
    msIlluminanceLevelSensing: {
        attributes: {
            /** ID=0x0000 | type=ENUM8 | report=true | required=true | max=254 */
            levelStatus: number;
            /** ID=0x0001 | type=ENUM8 | max=254 */
            lightSensorType: number;
            /** ID=0x0010 | type=UINT16 | write=true | required=true | max=65534 */
            illuminanceTargetLevel: number;
        };
        commands: never;
        commandResponses: never;
    };
    msTemperatureMeasurement: {
        attributes: {
            /** ID=0x0000 | type=INT16 | report=true | required=true */
            measuredValue: number;
            /** ID=0x0001 | type=INT16 | required=true | min=-27315 | max=32766 */
            minMeasuredValue: number;
            /** ID=0x0002 | type=INT16 | required=true | min=-27314 | max=32767 */
            maxMeasuredValue: number;
            /** ID=0x0003 | type=UINT16 | max=2048 */
            tolerance: number;
            /** ID=0x0010 | type=UNKNOWN | write=true */
            minPercentChange: never;
            /** ID=0x0011 | type=UNKNOWN | write=true */
            minAbsoluteChange: never;
            /** ID=0x6600 | type=INT16 | manufacturerCode=CUSTOM_SPRUT_DEVICE(0x6666) | write=true | min=-32768 | max=32767 */
            sprutTemperatureOffset?: number;
        };
        commands: never;
        commandResponses: never;
    };
    msPressureMeasurement: {
        attributes: {
            /** ID=0x0000 | type=INT16 | report=true | required=true */
            measuredValue: number;
            /** ID=0x0001 | type=INT16 | required=true | min=-32767 | max=32766 */
            minMeasuredValue: number;
            /** ID=0x0002 | type=INT16 | required=true | min=-32766 | max=32767 */
            maxMeasuredValue: number;
            /** ID=0x0003 | type=UINT16 | max=2048 */
            tolerance: number;
            /** ID=0x0010 | type=INT16 | default=0 */
            scaledValue: number;
            /** ID=0x0011 | type=INT16 | min=-32767 | max=32766 */
            minScaledValue: number;
            /** ID=0x0012 | type=INT16 | min=-32766 | max=32767 */
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
            /** ID=0x0000 | type=UINT16 | report=true | required=true */
            measuredValue: number;
            /** ID=0x0001 | type=UINT16 | required=true | max=65533 */
            minMeasuredValue: number;
            /** ID=0x0002 | type=UINT16 | required=true | min=1 | max=65534 */
            maxMeasuredValue: number;
            /** ID=0x0003 | type=UINT16 | max=2048 */
            tolerance: number;
        };
        commands: never;
        commandResponses: never;
    };
    msRelativeHumidity: {
        attributes: {
            /** ID=0x0000 | type=UINT16 | report=true | required=true */
            measuredValue: number;
            /** ID=0x0001 | type=UINT16 | required=true | max=9999 */
            minMeasuredValue: number;
            /** ID=0x0002 | type=UINT16 | required=true | min=1 | max=10000 */
            maxMeasuredValue: number;
            /** ID=0x0003 | type=UINT16 | max=2048 */
            tolerance: number;
            /** ID=0x6600 | type=BOOLEAN | manufacturerCode=CUSTOM_SPRUT_DEVICE(0x6666) | write=true */
            sprutHeater?: number;
        };
        commands: never;
        commandResponses: never;
    };
    msOccupancySensing: {
        attributes: {
            /** ID=0x0000 | type=BITMAP8 | report=true | required=true */
            occupancy: number;
            /** ID=0x0001 | type=ENUM8 | required=true | default=0 */
            occupancySensorType: number;
            /** ID=0x0002 | type=BITMAP8 | required=true */
            occupancySensorTypeBitmap: number;
            /** ID=0x0010 | type=UINT16 | write=true | max=65534 | default=0 */
            pirOToUDelay: number;
            /** ID=0x0011 | type=UINT16 | write=true | max=65534 | default=0 */
            pirUToODelay: number;
            /** ID=0x0012 | type=UINT8 | write=true | min=1 | max=254 | default=1 */
            pirUToOThreshold: number;
            /** ID=0x0020 | type=UINT16 | write=true | max=65534 | default=0 */
            ultrasonicOToUDelay: number;
            /** ID=0x0021 | type=UINT16 | write=true | max=65534 | default=0 */
            ultrasonicUToODelay: number;
            /** ID=0x0022 | type=UINT8 | write=true | min=1 | max=254 | default=1 */
            ultrasonicUToOThreshold: number;
            /** ID=0x0030 | type=UINT16 | write=true | max=65534 | default=0 */
            contactOToUDelay: number;
            /** ID=0x0031 | type=UINT16 | write=true | max=65534 | default=0 */
            contactUToODelay: number;
            /** ID=0x0032 | type=UINT8 | write=true | min=1 | max=254 | default=1 */
            contactUToOThreshold: number;
            /** ID=0x6600 | type=UINT16 | manufacturerCode=CUSTOM_SPRUT_DEVICE(0x6666) | write=true | max=65535 */
            sprutOccupancyLevel?: number;
            /** ID=0x6601 | type=UINT16 | manufacturerCode=CUSTOM_SPRUT_DEVICE(0x6666) | write=true | max=65535 */
            sprutOccupancySensitivity?: number;
            /** ID=0xe000 | type=ENUM8 | manufacturerCode=ADEO(0x1277) | write=true | max=255 */
            elkoOccupancyDfltOperationMode?: number;
            /** ID=0xe001 | type=ENUM8 | manufacturerCode=ADEO(0x1277) | write=true | max=255 */
            elkoOccupancyOperationMode?: number;
            /** ID=0xe002 | type=UINT16 | manufacturerCode=ADEO(0x1277) | write=true | max=65535 */
            elkoForceOffTimeout?: number;
            /** ID=0xe003 | type=UINT8 | manufacturerCode=ADEO(0x1277) | write=true | max=255 */
            elkoOccupancySensitivity?: number;
        };
        commands: never;
        commandResponses: never;
    };
    msLeafWetness: {
        attributes: {
            /** ID=0x0000 | type=UINT16 | report=true | required=true */
            measuredValue: number;
            /** ID=0x0001 | type=UINT16 | required=true | max=9999 */
            minMeasuredValue: number;
            /** ID=0x0002 | type=UINT16 | required=true | min=1 | max=10000 */
            maxMeasuredValue: number;
            /** ID=0x0003 | type=UINT16 | max=2048 */
            tolerance: number;
        };
        commands: never;
        commandResponses: never;
    };
    msSoilMoisture: {
        attributes: {
            /** ID=0x0000 | type=UINT16 | report=true | required=true */
            measuredValue: number;
            /** ID=0x0001 | type=UINT16 | required=true | max=9999 */
            minMeasuredValue: number;
            /** ID=0x0002 | type=UINT16 | required=true | min=1 | max=10000 */
            maxMeasuredValue: number;
            /** ID=0x0003 | type=UINT16 | max=2048 */
            tolerance: number;
        };
        commands: never;
        commandResponses: never;
    };
    pHMeasurement: {
        attributes: {
            /** ID=0x0000 | type=UINT16 | report=true | required=true */
            measuredValue: number;
            /** ID=0x0001 | type=UINT16 | required=true | max=1399 */
            minMeasuredValue: number;
            /** ID=0x0002 | type=UINT16 | required=true | min=1 | max=1400 */
            maxMeasuredValue: number;
            /** ID=0x0003 | type=UINT16 | max=200 */
            tolerance: number;
        };
        commands: never;
        commandResponses: never;
    };
    msElectricalConductivity: {
        attributes: {
            /** ID=0x0000 | type=UINT16 | report=true | required=true */
            measuredValue: number;
            /** ID=0x0001 | type=UINT16 | required=true | max=65533 */
            minMeasuredValue: number;
            /** ID=0x0002 | type=UINT16 | required=true | min=1 | max=65534 */
            maxMeasuredValue: number;
            /** ID=0x0003 | type=UINT16 | max=100 */
            tolerance: number;
        };
        commands: never;
        commandResponses: never;
    };
    msWindSpeed: {
        attributes: {
            /** ID=0x0000 | type=UINT16 | report=true | required=true */
            measuredValue: number;
            /** ID=0x0001 | type=UINT16 | required=true | max=65533 */
            minMeasuredValue: number;
            /** ID=0x0002 | type=UINT16 | required=true | min=1 | max=65534 */
            maxMeasuredValue: number;
            /** ID=0x0003 | type=UINT16 | max=776 | default=0 */
            tolerance: number;
        };
        commands: never;
        commandResponses: never;
    };
    msCarbonMonoxide: {
        attributes: {
            /** ID=0x0000 | type=SINGLE_PREC | report=true | required=true */
            measuredValue: number;
            /** ID=0x0001 | type=SINGLE_PREC | required=true | min=0 */
            minMeasuredValue: number;
            /** ID=0x0002 | type=SINGLE_PREC | required=true | max=1 */
            maxMeasuredValue: number;
            /** ID=0x0003 | type=SINGLE_PREC */
            tolerance: number;
        };
        commands: never;
        commandResponses: never;
    };
    msCO2: {
        attributes: {
            /** ID=0x0000 | type=SINGLE_PREC | report=true | required=true */
            measuredValue: number;
            /** ID=0x0001 | type=SINGLE_PREC | required=true | min=0 */
            minMeasuredValue: number;
            /** ID=0x0002 | type=SINGLE_PREC | required=true | max=1 */
            maxMeasuredValue: number;
            /** ID=0x0003 | type=SINGLE_PREC */
            tolerance: number;
            /** ID=0x6600 | type=BOOLEAN | manufacturerCode=CUSTOM_SPRUT_DEVICE(0x6666) | write=true */
            sprutCO2Calibration?: number;
            /** ID=0x6601 | type=BOOLEAN | manufacturerCode=CUSTOM_SPRUT_DEVICE(0x6666) | write=true */
            sprutCO2AutoCalibration?: number;
        };
        commands: never;
        commandResponses: never;
    };
    msEthylene: {
        attributes: {
            /** ID=0x0000 | type=SINGLE_PREC | report=true | required=true */
            measuredValue: number;
            /** ID=0x0001 | type=SINGLE_PREC | required=true | min=0 */
            minMeasuredValue: number;
            /** ID=0x0002 | type=SINGLE_PREC | required=true | max=1 */
            maxMeasuredValue: number;
            /** ID=0x0003 | type=SINGLE_PREC */
            tolerance: number;
        };
        commands: never;
        commandResponses: never;
    };
    msEthyleneOxide: {
        attributes: {
            /** ID=0x0000 | type=SINGLE_PREC | report=true | required=true */
            measuredValue: number;
            /** ID=0x0001 | type=SINGLE_PREC | required=true | min=0 */
            minMeasuredValue: number;
            /** ID=0x0002 | type=SINGLE_PREC | required=true | max=1 */
            maxMeasuredValue: number;
            /** ID=0x0003 | type=SINGLE_PREC */
            tolerance: number;
        };
        commands: never;
        commandResponses: never;
    };
    msHydrogen: {
        attributes: {
            /** ID=0x0000 | type=SINGLE_PREC | report=true | required=true */
            measuredValue: number;
            /** ID=0x0001 | type=SINGLE_PREC | required=true | min=0 */
            minMeasuredValue: number;
            /** ID=0x0002 | type=SINGLE_PREC | required=true | max=1 */
            maxMeasuredValue: number;
            /** ID=0x0003 | type=SINGLE_PREC */
            tolerance: number;
        };
        commands: never;
        commandResponses: never;
    };
    msHydrogenSulfide: {
        attributes: {
            /** ID=0x0000 | type=SINGLE_PREC | report=true | required=true */
            measuredValue: number;
            /** ID=0x0001 | type=SINGLE_PREC | required=true | min=0 */
            minMeasuredValue: number;
            /** ID=0x0002 | type=SINGLE_PREC | required=true | max=1 */
            maxMeasuredValue: number;
            /** ID=0x0003 | type=SINGLE_PREC */
            tolerance: number;
        };
        commands: never;
        commandResponses: never;
    };
    msNitricOxide: {
        attributes: {
            /** ID=0x0000 | type=SINGLE_PREC | report=true | required=true */
            measuredValue: number;
            /** ID=0x0001 | type=SINGLE_PREC | required=true | min=0 */
            minMeasuredValue: number;
            /** ID=0x0002 | type=SINGLE_PREC | required=true | max=1 */
            maxMeasuredValue: number;
            /** ID=0x0003 | type=SINGLE_PREC */
            tolerance: number;
        };
        commands: never;
        commandResponses: never;
    };
    msNitrogenDioxide: {
        attributes: {
            /** ID=0x0000 | type=SINGLE_PREC | report=true | required=true */
            measuredValue: number;
            /** ID=0x0001 | type=SINGLE_PREC | required=true | min=0 */
            minMeasuredValue: number;
            /** ID=0x0002 | type=SINGLE_PREC | required=true | max=1 */
            maxMeasuredValue: number;
            /** ID=0x0003 | type=SINGLE_PREC */
            tolerance: number;
        };
        commands: never;
        commandResponses: never;
    };
    msOxygen: {
        attributes: {
            /** ID=0x0000 | type=SINGLE_PREC | report=true | required=true */
            measuredValue: number;
            /** ID=0x0001 | type=SINGLE_PREC | required=true | min=0 */
            minMeasuredValue: number;
            /** ID=0x0002 | type=SINGLE_PREC | required=true | max=1 */
            maxMeasuredValue: number;
            /** ID=0x0003 | type=SINGLE_PREC */
            tolerance: number;
        };
        commands: never;
        commandResponses: never;
    };
    msOzone: {
        attributes: {
            /** ID=0x0000 | type=SINGLE_PREC | report=true | required=true */
            measuredValue: number;
            /** ID=0x0001 | type=SINGLE_PREC | required=true | min=0 */
            minMeasuredValue: number;
            /** ID=0x0002 | type=SINGLE_PREC | required=true | max=1 */
            maxMeasuredValue: number;
            /** ID=0x0003 | type=SINGLE_PREC */
            tolerance: number;
        };
        commands: never;
        commandResponses: never;
    };
    msSulfurDioxide: {
        attributes: {
            /** ID=0x0000 | type=SINGLE_PREC | report=true | required=true */
            measuredValue: number;
            /** ID=0x0001 | type=SINGLE_PREC | required=true | min=0 */
            minMeasuredValue: number;
            /** ID=0x0002 | type=SINGLE_PREC | required=true | max=1 */
            maxMeasuredValue: number;
            /** ID=0x0003 | type=SINGLE_PREC */
            tolerance: number;
        };
        commands: never;
        commandResponses: never;
    };
    msDissolvedOxygen: {
        attributes: {
            /** ID=0x0000 | type=SINGLE_PREC | report=true | required=true */
            measuredValue: number;
            /** ID=0x0001 | type=SINGLE_PREC | required=true | min=0 */
            minMeasuredValue: number;
            /** ID=0x0002 | type=SINGLE_PREC | required=true | max=1 */
            maxMeasuredValue: number;
            /** ID=0x0003 | type=SINGLE_PREC */
            tolerance: number;
        };
        commands: never;
        commandResponses: never;
    };
    msBromate: {
        attributes: {
            /** ID=0x0000 | type=SINGLE_PREC | report=true | required=true */
            measuredValue: number;
            /** ID=0x0001 | type=SINGLE_PREC | required=true | min=0 */
            minMeasuredValue: number;
            /** ID=0x0002 | type=SINGLE_PREC | required=true | max=1 */
            maxMeasuredValue: number;
            /** ID=0x0003 | type=SINGLE_PREC */
            tolerance: number;
        };
        commands: never;
        commandResponses: never;
    };
    msChloramines: {
        attributes: {
            /** ID=0x0000 | type=SINGLE_PREC | report=true | required=true */
            measuredValue: number;
            /** ID=0x0001 | type=SINGLE_PREC | required=true | min=0 */
            minMeasuredValue: number;
            /** ID=0x0002 | type=SINGLE_PREC | required=true | max=1 */
            maxMeasuredValue: number;
            /** ID=0x0003 | type=SINGLE_PREC */
            tolerance: number;
        };
        commands: never;
        commandResponses: never;
    };
    msChlorine: {
        attributes: {
            /** ID=0x0000 | type=SINGLE_PREC | report=true | required=true */
            measuredValue: number;
            /** ID=0x0001 | type=SINGLE_PREC | required=true | min=0 */
            minMeasuredValue: number;
            /** ID=0x0002 | type=SINGLE_PREC | required=true | max=1 */
            maxMeasuredValue: number;
            /** ID=0x0003 | type=SINGLE_PREC */
            tolerance: number;
        };
        commands: never;
        commandResponses: never;
    };
    msFecalColiformAndEColi: {
        attributes: {
            /** ID=0x0000 | type=SINGLE_PREC | report=true | required=true */
            measuredValue: number;
            /** ID=0x0001 | type=SINGLE_PREC | required=true | min=0 */
            minMeasuredValue: number;
            /** ID=0x0002 | type=SINGLE_PREC | required=true | max=1 */
            maxMeasuredValue: number;
            /** ID=0x0003 | type=SINGLE_PREC */
            tolerance: number;
        };
        commands: never;
        commandResponses: never;
    };
    msFluoride: {
        attributes: {
            /** ID=0x0000 | type=SINGLE_PREC | report=true | required=true */
            measuredValue: number;
            /** ID=0x0001 | type=SINGLE_PREC | required=true | min=0 */
            minMeasuredValue: number;
            /** ID=0x0002 | type=SINGLE_PREC | required=true | max=1 */
            maxMeasuredValue: number;
            /** ID=0x0003 | type=SINGLE_PREC */
            tolerance: number;
        };
        commands: never;
        commandResponses: never;
    };
    msHaloaceticAcids: {
        attributes: {
            /** ID=0x0000 | type=SINGLE_PREC | report=true | required=true */
            measuredValue: number;
            /** ID=0x0001 | type=SINGLE_PREC | required=true | min=0 */
            minMeasuredValue: number;
            /** ID=0x0002 | type=SINGLE_PREC | required=true | max=1 */
            maxMeasuredValue: number;
            /** ID=0x0003 | type=SINGLE_PREC */
            tolerance: number;
        };
        commands: never;
        commandResponses: never;
    };
    msTotalTrihalomethanes: {
        attributes: {
            /** ID=0x0000 | type=SINGLE_PREC | report=true | required=true */
            measuredValue: number;
            /** ID=0x0001 | type=SINGLE_PREC | required=true | min=0 */
            minMeasuredValue: number;
            /** ID=0x0002 | type=SINGLE_PREC | required=true | max=1 */
            maxMeasuredValue: number;
            /** ID=0x0003 | type=SINGLE_PREC */
            tolerance: number;
        };
        commands: never;
        commandResponses: never;
    };
    msTotalColiformBacteria: {
        attributes: {
            /** ID=0x0000 | type=SINGLE_PREC | report=true | required=true */
            measuredValue: number;
            /** ID=0x0001 | type=SINGLE_PREC | required=true | min=0 */
            minMeasuredValue: number;
            /** ID=0x0002 | type=SINGLE_PREC | required=true | max=1 */
            maxMeasuredValue: number;
            /** ID=0x0003 | type=SINGLE_PREC */
            tolerance: number;
        };
        commands: never;
        commandResponses: never;
    };
    msTurbidity: {
        attributes: {
            /** ID=0x0000 | type=SINGLE_PREC | report=true | required=true */
            measuredValue: number;
            /** ID=0x0001 | type=SINGLE_PREC | required=true | min=0 */
            minMeasuredValue: number;
            /** ID=0x0002 | type=SINGLE_PREC | required=true | max=1 */
            maxMeasuredValue: number;
            /** ID=0x0003 | type=SINGLE_PREC */
            tolerance: number;
        };
        commands: never;
        commandResponses: never;
    };
    msCopper: {
        attributes: {
            /** ID=0x0000 | type=SINGLE_PREC | report=true | required=true */
            measuredValue: number;
            /** ID=0x0001 | type=SINGLE_PREC | required=true | min=0 */
            minMeasuredValue: number;
            /** ID=0x0002 | type=SINGLE_PREC | required=true | max=1 */
            maxMeasuredValue: number;
            /** ID=0x0003 | type=SINGLE_PREC */
            tolerance: number;
        };
        commands: never;
        commandResponses: never;
    };
    msLead: {
        attributes: {
            /** ID=0x0000 | type=SINGLE_PREC | report=true | required=true */
            measuredValue: number;
            /** ID=0x0001 | type=SINGLE_PREC | required=true | min=0 */
            minMeasuredValue: number;
            /** ID=0x0002 | type=SINGLE_PREC | required=true | max=1 */
            maxMeasuredValue: number;
            /** ID=0x0003 | type=SINGLE_PREC */
            tolerance: number;
        };
        commands: never;
        commandResponses: never;
    };
    msManganese: {
        attributes: {
            /** ID=0x0000 | type=SINGLE_PREC | report=true | required=true */
            measuredValue: number;
            /** ID=0x0001 | type=SINGLE_PREC | required=true | min=0 */
            minMeasuredValue: number;
            /** ID=0x0002 | type=SINGLE_PREC | required=true | max=1 */
            maxMeasuredValue: number;
            /** ID=0x0003 | type=SINGLE_PREC */
            tolerance: number;
        };
        commands: never;
        commandResponses: never;
    };
    msSulfate: {
        attributes: {
            /** ID=0x0000 | type=SINGLE_PREC | report=true | required=true */
            measuredValue: number;
            /** ID=0x0001 | type=SINGLE_PREC | required=true | min=0 */
            minMeasuredValue: number;
            /** ID=0x0002 | type=SINGLE_PREC | required=true | max=1 */
            maxMeasuredValue: number;
            /** ID=0x0003 | type=SINGLE_PREC */
            tolerance: number;
        };
        commands: never;
        commandResponses: never;
    };
    msBromodichloromethane: {
        attributes: {
            /** ID=0x0000 | type=SINGLE_PREC | report=true | required=true */
            measuredValue: number;
            /** ID=0x0001 | type=SINGLE_PREC | required=true | min=0 */
            minMeasuredValue: number;
            /** ID=0x0002 | type=SINGLE_PREC | required=true | max=1 */
            maxMeasuredValue: number;
            /** ID=0x0003 | type=SINGLE_PREC */
            tolerance: number;
        };
        commands: never;
        commandResponses: never;
    };
    msBromoform: {
        attributes: {
            /** ID=0x0000 | type=SINGLE_PREC | report=true | required=true */
            measuredValue: number;
            /** ID=0x0001 | type=SINGLE_PREC | required=true | min=0 */
            minMeasuredValue: number;
            /** ID=0x0002 | type=SINGLE_PREC | required=true | max=1 */
            maxMeasuredValue: number;
            /** ID=0x0003 | type=SINGLE_PREC */
            tolerance: number;
        };
        commands: never;
        commandResponses: never;
    };
    msChlorodibromomethane: {
        attributes: {
            /** ID=0x0000 | type=SINGLE_PREC | report=true | required=true */
            measuredValue: number;
            /** ID=0x0001 | type=SINGLE_PREC | required=true | min=0 */
            minMeasuredValue: number;
            /** ID=0x0002 | type=SINGLE_PREC | required=true | max=1 */
            maxMeasuredValue: number;
            /** ID=0x0003 | type=SINGLE_PREC */
            tolerance: number;
        };
        commands: never;
        commandResponses: never;
    };
    msChloroform: {
        attributes: {
            /** ID=0x0000 | type=SINGLE_PREC | report=true | required=true */
            measuredValue: number;
            /** ID=0x0001 | type=SINGLE_PREC | required=true | min=0 */
            minMeasuredValue: number;
            /** ID=0x0002 | type=SINGLE_PREC | required=true | max=1 */
            maxMeasuredValue: number;
            /** ID=0x0003 | type=SINGLE_PREC */
            tolerance: number;
        };
        commands: never;
        commandResponses: never;
    };
    msSodium: {
        attributes: {
            /** ID=0x0000 | type=SINGLE_PREC | report=true | required=true */
            measuredValue: number;
            /** ID=0x0001 | type=SINGLE_PREC | required=true | min=0 */
            minMeasuredValue: number;
            /** ID=0x0002 | type=SINGLE_PREC | required=true | max=1 */
            maxMeasuredValue: number;
            /** ID=0x0003 | type=SINGLE_PREC */
            tolerance: number;
        };
        commands: never;
        commandResponses: never;
    };
    pm25Measurement: {
        attributes: {
            /** ID=0x0000 | type=SINGLE_PREC | report=true | required=true */
            measuredValue: number;
            /** ID=0x0001 | type=SINGLE_PREC | required=true | min=0 */
            measuredMinValue: number;
            /** ID=0x0002 | type=SINGLE_PREC | required=true | max=1 */
            measuredMaxValue: number;
            /** ID=0x0003 | type=SINGLE_PREC */
            tolerance: number;
        };
        commands: never;
        commandResponses: never;
    };
    msFormaldehyde: {
        attributes: {
            /** ID=0x0000 | type=SINGLE_PREC | report=true | required=true */
            measuredValue: number;
            /** ID=0x0001 | type=SINGLE_PREC | required=true | min=0 */
            minMeasuredValue: number;
            /** ID=0x0002 | type=SINGLE_PREC | required=true | max=1 */
            maxMeasuredValue: number;
            /** ID=0x0003 | type=SINGLE_PREC */
            tolerance: number;
        };
        commands: never;
        commandResponses: never;
    };
    ssIasZone: {
        attributes: {
            /** ID=0x0000 | type=ENUM8 | required=true | default=0 */
            zoneState: number;
            /** ID=0x0001 | type=ENUM16 | required=true */
            zoneType: number;
            /** ID=0x0002 | type=BITMAP16 | required=true | default=0 */
            zoneStatus: number;
            /** ID=0x0010 | type=IEEE_ADDR | write=true | required=true */
            iasCieAddr: string;
            /** ID=0x0011 | type=UINT8 | required=true | max=255 | default=255 */
            zoneId: number;
            /** ID=0x0012 | type=UINT8 | min=2 | max=255 | default=2 */
            numZoneSensitivityLevelsSupported: number;
            /** ID=0x0013 | type=UINT8 | write=true | max=255 | default=0 */
            currentZoneSensitivityLevel: number;
            /** ID=0x8001 | type=UINT16 | manufacturerCode=DEVELCO(0x1015) | write=true | max=65535 */
            develcoAlarmOffDelay?: number;
        };
        commands: {
            /** ID=0x00 | required=true */
            enrollRsp: {
                /** type=ENUM8 */
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
                /** type=BITMAP16 */
                zonestatus: number;
                /** type=BITMAP8 */
                extendedstatus: number;
                /** type=UINT8 */
                zoneID: number;
                /** type=UINT16 */
                delay: number;
            };
            /** ID=0x01 | required=true */
            enrollReq: {
                /** type=ENUM16 */
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
                /** type=ENUM8 */
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
                /** type=BOOLEAN */
                zonestatusmaskflag: number;
                /** type=BITMAP16 */
                zonestatusmask: number;
            };
        };
        commandResponses: {
            /** ID=0x00 | required=true */
            armRsp: {
                /** type=ENUM8 */
                armnotification: number;
            };
            /** ID=0x01 | required=true */
            getZoneIDMapRsp: {
                /** type=BITMAP16 */
                zoneidmapsection0: number;
                /** type=BITMAP16 */
                zoneidmapsection1: number;
                /** type=BITMAP16 */
                zoneidmapsection2: number;
                /** type=BITMAP16 */
                zoneidmapsection3: number;
                /** type=BITMAP16 */
                zoneidmapsection4: number;
                /** type=BITMAP16 */
                zoneidmapsection5: number;
                /** type=BITMAP16 */
                zoneidmapsection6: number;
                /** type=BITMAP16 */
                zoneidmapsection7: number;
                /** type=BITMAP16 */
                zoneidmapsection8: number;
                /** type=BITMAP16 */
                zoneidmapsection9: number;
                /** type=BITMAP16 */
                zoneidmapsection10: number;
                /** type=BITMAP16 */
                zoneidmapsection11: number;
                /** type=BITMAP16 */
                zoneidmapsection12: number;
                /** type=BITMAP16 */
                zoneidmapsection13: number;
                /** type=BITMAP16 */
                zoneidmapsection14: number;
                /** type=BITMAP16 */
                zoneidmapsection15: number;
            };
            /** ID=0x02 | required=true */
            getZoneInfoRsp: {
                /** type=UINT8 */
                zoneid: number;
                /** type=ENUM16 */
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
                /** type=ENUM16 */
                zonestatus: number;
                /** type=ENUM8 */
                audiblenotif: number;
                /** type=CHAR_STR */
                zonelabel: string;
            };
            /** ID=0x04 | required=true */
            panelStatusChanged: {
                /** type=ENUM8 */
                panelstatus: number;
                /** type=UINT8 */
                secondsremain: number;
                /** type=ENUM8 */
                audiblenotif: number;
                /** type=ENUM8 */
                alarmstatus: number;
            };
            /** ID=0x05 | required=true */
            getPanelStatusRsp: {
                /** type=ENUM8 */
                panelstatus: number;
                /** type=UINT8 */
                secondsremain: number;
                /** type=ENUM8 */
                audiblenotif: number;
                /** type=ENUM8 */
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
                /** type=BOOLEAN */
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
            /** ID=0x0000 | type=UINT16 | write=true | required=true | max=65534 | default=240 */
            maxDuration: number;
        };
        commands: {
            /** ID=0x00 | required=true */
            startWarning: {
                /** type=BITMAP8 */
                startwarninginfo: number;
                /** type=UINT16 */
                warningduration: number;
                /** type=UINT8 | max=100 */
                strobedutycycle: number;
                /** type=ENUM8 */
                strobelevel: number;
            };
            /** ID=0x01 | required=true */
            squawk: {
                /** type=BITMAP8 */
                squawkinfo: number;
            };
        };
        commandResponses: never;
    };
    piGenericTunnel: {
        attributes: {
            /** ID=0x0001 | type=UINT16 | required=true | max=65535 */
            maxIncomeTransSize: number;
            /** ID=0x0002 | type=UINT16 | required=true | max=65535 */
            maxOutgoTransSize: number;
            /** ID=0x0003 | type=OCTET_STR | required=true | minLen=0 | maxLen=255 | default=  */
            protocolAddr: Buffer;
        };
        commands: {
            /** ID=0x00 | required=true */
            matchProtocolAddr: {
                /** type=OCTET_STR */
                protocoladdr: Buffer;
            };
        };
        commandResponses: {
            /** ID=0x00 | required=true */
            matchProtocolAddrRsp: {
                /** type=IEEE_ADDR */
                devieeeaddr: string;
                /** type=OCTET_STR */
                protocoladdr: Buffer;
            };
            /** ID=0x01 */
            advertiseProtocolAddr: {
                /** type=OCTET_STR */
                protocoladdr: Buffer;
            };
        };
    };
    piBacnetProtocolTunnel: {
        attributes: never;
        commands: {
            /** ID=0x00 | required=true */
            transferNpdu: {
                /** type=LIST_UINT8 */
                npdu: number[];
            };
        };
        commandResponses: never;
    };
    piAnalogInputReg: {
        attributes: {
            /** ID=0x0016 | type=SINGLE_PREC | write=true | writeOptional=true */
            covIncrement: number;
            /** ID=0x001f | type=CHAR_STR | default=  */
            deviceType: string;
            /** ID=0x004b | type=BAC_OID | required=true | max=4294967295 */
            objectId: number;
            /** ID=0x004d | type=CHAR_STR | required=true | default=  */
            objectName: string;
            /** ID=0x004f | type=ENUM16 | required=true */
            objectType: number;
            /** ID=0x0076 | type=UINT8 | write=true | writeOptional=true */
            updateInterval: number;
            /** ID=0x00a8 | type=CHAR_STR | write=true | writeOptional=true | default=  */
            profileName: string;
        };
        commands: never;
        commandResponses: never;
    };
    piAnalogInputExt: {
        attributes: {
            /** ID=0x0000 | type=BITMAP8 | required=true | write=true | writeOptional=true | default=0 */
            ackedTransitions: number;
            /** ID=0x0011 | type=UINT16 | required=true | write=true | writeOptional=true | max=65535 | default=0 */
            notificationClass: number;
            /** ID=0x0019 | type=SINGLE_PREC | required=true | write=true | writeOptional=true | default=0 */
            deadband: number;
            /** ID=0x0023 | type=BITMAP8 | required=true | write=true | writeOptional=true | default=0 */
            eventEnable: number;
            /** ID=0x0024 | type=ENUM8 | default=0 */
            eventState: number;
            /** ID=0x002d | type=SINGLE_PREC | required=true | write=true | writeOptional=true | default=0 */
            highLimit: number;
            /** ID=0x0034 | type=BITMAP8 | required=true | write=true | writeOptional=true | max=17 | default=0 */
            limitEnable: number;
            /** ID=0x003b | type=SINGLE_PREC | required=true | write=true | writeOptional=true | default=0 */
            lowLimit: number;
            /** ID=0x0048 | type=ENUM8 | required=true | write=true | writeOptional=true | default=0 */
            notifyType: number;
            /** ID=0x0071 | type=UINT8 | required=true | write=true | writeOptional=true | default=0 */
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
            /** ID=0x0016 | type=SINGLE_PREC | write=true | writeOptional=true | default=0 */
            covIncrement: number;
            /** ID=0x001f | type=CHAR_STR | default=  */
            deviceType: string;
            /** ID=0x004b | type=BAC_OID | required=true | max=4294967295 */
            objectId: number;
            /** ID=0x004d | type=CHAR_STR | required=true | default=  */
            objectName: string;
            /** ID=0x004f | type=ENUM16 | required=true */
            objectType: number;
            /** ID=0x00a8 | type=CHAR_STR | write=true | writeOptional=true | default=  */
            profileName: string;
        };
        commands: never;
        commandResponses: never;
    };
    piAnalogOutputExt: {
        attributes: {
            /** ID=0x0000 | type=BITMAP8 | required=true | write=true | writeOptional=true | default=0 */
            ackedTransitions: number;
            /** ID=0x0011 | type=UINT16 | required=true | write=true | writeOptional=true | max=65535 | default=0 */
            notificationClass: number;
            /** ID=0x0019 | type=SINGLE_PREC | required=true | write=true | writeOptional=true | default=0 */
            deadband: number;
            /** ID=0x0023 | type=BITMAP8 | required=true | write=true | writeOptional=true | default=0 */
            eventEnable: number;
            /** ID=0x0024 | type=ENUM8 | default=0 */
            eventState: number;
            /** ID=0x002d | type=SINGLE_PREC | required=true | write=true | writeOptional=true | default=0 */
            highLimit: number;
            /** ID=0x0034 | type=BITMAP8 | required=true | write=true | writeOptional=true | max=17 | default=0 */
            limitEnable: number;
            /** ID=0x003b | type=SINGLE_PREC | required=true | write=true | writeOptional=true | default=0 */
            lowLimit: number;
            /** ID=0x0048 | type=ENUM8 | required=true | write=true | writeOptional=true | default=0 */
            notifyType: number;
            /** ID=0x0071 | type=UINT8 | required=true | write=true | writeOptional=true | default=0 */
            timeDelay: number;
            /** ID=0x0082 | type=ARRAY */
            eventTimeStamps: ZclArray | unknown[];
        };
        commands: never;
        commandResponses: never;
    };
    piAnalogValueReg: {
        attributes: {
            /** ID=0x0016 | type=SINGLE_PREC | write=true | writeOptional=true | default=0 */
            covIncrement: number;
            /** ID=0x004b | type=BAC_OID | required=true | max=4294967295 */
            objectId: number;
            /** ID=0x004d | type=CHAR_STR | required=true | default=  */
            objectName: string;
            /** ID=0x004f | type=ENUM16 | required=true */
            objectType: number;
            /** ID=0x00a8 | type=CHAR_STR | default=  */
            profileName: string;
        };
        commands: never;
        commandResponses: never;
    };
    piAnalogValueExt: {
        attributes: {
            /** ID=0x0000 | type=BITMAP8 | required=true | write=true | writeOptional=true | default=0 */
            ackedTransitions: number;
            /** ID=0x0011 | type=UINT16 | required=true | write=true | writeOptional=true | max=65535 | default=0 */
            notificationClass: number;
            /** ID=0x0019 | type=SINGLE_PREC | required=true | write=true | writeOptional=true | default=0 */
            deadband: number;
            /** ID=0x0023 | type=BITMAP8 | required=true | write=true | writeOptional=true | default=0 */
            eventEnable: number;
            /** ID=0x0024 | type=ENUM8 | default=0 */
            eventState: number;
            /** ID=0x002d | type=SINGLE_PREC | required=true | write=true | writeOptional=true | default=0 */
            highLimit: number;
            /** ID=0x0034 | type=BITMAP8 | required=true | write=true | writeOptional=true | max=17 | default=0 */
            limitEnable: number;
            /** ID=0x003b | type=SINGLE_PREC | required=true | write=true | writeOptional=true | default=0 */
            lowLimit: number;
            /** ID=0x0048 | type=ENUM8 | required=true | write=true | writeOptional=true | default=0 */
            notifyType: number;
            /** ID=0x0071 | type=UINT8 | required=true | write=true | writeOptional=true | default=0 */
            timeDelay: number;
            /** ID=0x0082 | type=ARRAY | required=true */
            eventTimeStamps: ZclArray | unknown[];
        };
        commands: never;
        commandResponses: never;
    };
    piBinaryInputReg: {
        attributes: {
            /** ID=0x000f | type=UINT32 | write=true | writeOptional=true | default=4294967295 */
            changeOfStateCount: number;
            /** ID=0x0010 | type=STRUCT */
            changeOfStateTime: Struct;
            /** ID=0x001f | type=CHAR_STR | default=  */
            deviceType: string;
            /** ID=0x0021 | type=UINT32 | write=true | writeOptional=true | default=4294967295 */
            elapsedActiveTime: number;
            /** ID=0x004b | type=BAC_OID | required=true | max=4294967295 */
            objectIdentifier: number;
            /** ID=0x004d | type=CHAR_STR | required=true | default=  */
            objectName: string;
            /** ID=0x004f | type=ENUM16 | required=true */
            objectType: number;
            /** ID=0x0072 | type=STRUCT */
            timeOfATReset: Struct;
            /** ID=0x0073 | type=STRUCT */
            timeOfSCReset: Struct;
            /** ID=0x00a8 | type=CHAR_STR | default=  */
            profileName: string;
        };
        commands: never;
        commandResponses: never;
    };
    piBinaryInputExt: {
        attributes: {
            /** ID=0x0000 | type=BITMAP8 | required=true | write=true | writeOptional=true | default=0 */
            ackedTransitions: number;
            /** ID=0x0006 | type=BOOLEAN | required=true | write=true | writeOptional=true */
            alarmValue: number;
            /** ID=0x0011 | type=UINT16 | required=true | write=true | writeOptional=true | default=0 */
            notificationClass: number;
            /** ID=0x0023 | type=BITMAP8 | required=true | write=true | writeOptional=true | default=0 */
            eventEnable: number;
            /** ID=0x0024 | type=ENUM8 */
            eventState: number;
            /** ID=0x0048 | type=ENUM8 | required=true | write=true | writeOptional=true | default=0 */
            notifyType: number;
            /** ID=0x0071 | type=UINT8 | required=true | write=true | writeOptional=true | default=0 */
            timeDelay: number;
            /** ID=0x0082 | type=ARRAY | required=true */
            eventTimeStamps: ZclArray | unknown[];
        };
        commands: never;
        commandResponses: never;
    };
    piBinaryOutputReg: {
        attributes: {
            /** ID=0x000f | type=UINT32 | write=true | writeOptional=true | default=4294967295 */
            changeOfStateCount: number;
            /** ID=0x0010 | type=STRUCT */
            changeOfStateTime: Struct;
            /** ID=0x001f | type=CHAR_STR | default=  */
            deviceType: string;
            /** ID=0x0021 | type=UINT32 | write=true | writeOptional=true | default=4294967295 */
            elapsedActiveTime: number;
            /** ID=0x0028 | type=ENUM8 | max=1 | default=0 */
            feedBackValue: number;
            /** ID=0x004b | type=BAC_OID | required=true | max=4294967295 */
            objectIdentifier: number;
            /** ID=0x004d | type=CHAR_STR | required=true | default=  */
            objectName: string;
            /** ID=0x004f | type=ENUM16 | required=true */
            objectType: number;
            /** ID=0x0072 | type=STRUCT */
            timeOfATReset: Struct;
            /** ID=0x0073 | type=STRUCT */
            timeOfSCReset: Struct;
            /** ID=0x00a8 | type=CHAR_STR | default=  */
            profileName: string;
        };
        commands: never;
        commandResponses: never;
    };
    piBinaryOutputExt: {
        attributes: {
            /** ID=0x0000 | type=BITMAP8 | required=true | write=true | writeOptional=true | default=0 */
            ackedTransitions: number;
            /** ID=0x0011 | type=UINT16 | required=true | write=true | writeOptional=true | default=0 */
            notificationClass: number;
            /** ID=0x0023 | type=BITMAP8 | required=true | write=true | writeOptional=true | default=0 */
            eventEnable: number;
            /** ID=0x0024 | type=ENUM8 | default=0 */
            eventState: number;
            /** ID=0x0048 | type=ENUM8 | required=true | write=true | writeOptional=true | default=0 */
            notifyType: number;
            /** ID=0x0071 | type=UINT8 | required=true | write=true | writeOptional=true | default=0 */
            timeDelay: number;
            /** ID=0x0082 | type=ARRAY */
            eventTimeStamps: ZclArray | unknown[];
        };
        commands: never;
        commandResponses: never;
    };
    piBinaryValueReg: {
        attributes: {
            /** ID=0x000f | type=UINT32 | write=true | writeOptional=true | default=4294967295 */
            changeOfStateCount: number;
            /** ID=0x0010 | type=STRUCT */
            changeOfStateTime: Struct;
            /** ID=0x0021 | type=UINT32 | write=true | writeOptional=true | default=4294967295 */
            elapsedActiveTime: number;
            /** ID=0x004b | type=BAC_OID | required=true | max=4294967295 */
            objectIdentifier: number;
            /** ID=0x004d | type=CHAR_STR | required=true | default=  */
            objectName: string;
            /** ID=0x004f | type=ENUM16 | required=true */
            objectType: number;
            /** ID=0x0072 | type=STRUCT */
            timeOfATReset: Struct;
            /** ID=0x0073 | type=STRUCT */
            timeOfSCReset: Struct;
            /** ID=0x00a8 | type=CHAR_STR | default=  */
            profileName: string;
        };
        commands: never;
        commandResponses: never;
    };
    piBinaryValueExt: {
        attributes: {
            /** ID=0x0000 | type=BITMAP8 | required=true | write=true | writeOptional=true | default=0 */
            ackedTransitions: number;
            /** ID=0x0006 | type=BOOLEAN | required=true | write=true | writeOptional=true */
            alarmValue: number;
            /** ID=0x0011 | type=UINT16 | required=true | write=true | writeOptional=true | default=0 */
            notificationClass: number;
            /** ID=0x0023 | type=BITMAP8 | required=true | write=true | writeOptional=true | default=0 */
            eventEnable: number;
            /** ID=0x0024 | type=ENUM8 | default=0 */
            eventState: number;
            /** ID=0x0048 | type=ENUM8 | required=true | write=true | writeOptional=true | default=0 */
            notifyType: number;
            /** ID=0x0071 | type=UINT8 | required=true | write=true | writeOptional=true | default=0 */
            timeDelay: number;
            /** ID=0x0082 | type=ARRAY | required=true */
            eventTimeStamps: ZclArray | unknown[];
        };
        commands: never;
        commandResponses: never;
    };
    piMultistateInputReg: {
        attributes: {
            /** ID=0x001f | type=CHAR_STR | default=  */
            deviceType: string;
            /** ID=0x004b | type=BAC_OID | required=true | max=4294967295 */
            objectIdentifier: number;
            /** ID=0x004d | type=CHAR_STR | required=true | default=  */
            objectName: string;
            /** ID=0x004f | type=ENUM16 | required=true */
            objectType: number;
            /** ID=0x00a8 | type=CHAR_STR | default=  */
            profileName: string;
        };
        commands: never;
        commandResponses: never;
    };
    piMultistateInputExt: {
        attributes: {
            /** ID=0x0000 | type=BITMAP8 | required=true | write=true | writeOptional=true | default=0 */
            ackedTransitions: number;
            /** ID=0x0006 | type=SET | required=true | write=true | writeOptional=true | max=65535 */
            alarmValues: ZclArray | unknown[];
            /** ID=0x0011 | type=UINT16 | required=true | write=true | writeOptional=true | default=0 */
            notificationClass: number;
            /** ID=0x0023 | type=BITMAP8 | required=true | write=true | writeOptional=true | default=0 */
            eventEnable: number;
            /** ID=0x0024 | type=ENUM8 | default=0 */
            eventState: number;
            /** ID=0x0025 | type=SET | required=true | write=true | writeOptional=true | max=65535 | default=0 */
            faultValues: ZclArray | unknown[];
            /** ID=0x0048 | type=ENUM8 | required=true | write=true | writeOptional=true | default=0 */
            notifyType: number;
            /** ID=0x0071 | type=UINT8 | required=true | write=true | writeOptional=true | default=0 */
            timeDelay: number;
            /** ID=0x0082 | type=ARRAY | required=true */
            eventTimeStamps: ZclArray | unknown[];
        };
        commands: never;
        commandResponses: never;
    };
    piMultistateOutputReg: {
        attributes: {
            /** ID=0x001f | type=CHAR_STR | default=  */
            deviceType: string;
            /** ID=0x0028 | type=ENUM8 | write=true | writeOptional=true | max=1 */
            feedBackValue: number;
            /** ID=0x004b | type=BAC_OID | required=true | max=4294967295 */
            objectIdentifier: number;
            /** ID=0x004d | type=CHAR_STR | required=true | default=  */
            objectName: string;
            /** ID=0x004f | type=ENUM16 | required=true */
            objectType: number;
            /** ID=0x00a8 | type=CHAR_STR | default=  */
            profileName: string;
        };
        commands: never;
        commandResponses: never;
    };
    piMultistateOutputExt: {
        attributes: {
            /** ID=0x0000 | type=BITMAP8 | required=true | write=true | writeOptional=true | default=0 */
            ackedTransitions: number;
            /** ID=0x0011 | type=UINT16 | required=true | write=true | writeOptional=true | max=65535 | default=0 */
            notificationClass: number;
            /** ID=0x0023 | type=BITMAP8 | required=true | write=true | writeOptional=true | default=0 */
            eventEnable: number;
            /** ID=0x0024 | type=ENUM8 | default=0 */
            eventState: number;
            /** ID=0x0048 | type=ENUM8 | required=true | write=true | writeOptional=true | default=0 */
            notifyType: number;
            /** ID=0x0071 | type=UINT8 | required=true | write=true | writeOptional=true | default=0 */
            timeDelay: number;
            /** ID=0x0082 | type=ARRAY | required=true */
            eventTimeStamps: ZclArray | unknown[];
        };
        commands: never;
        commandResponses: never;
    };
    piMultistateValueReg: {
        attributes: {
            /** ID=0x004b | type=BAC_OID | required=true | max=4294967295 */
            objectIdentifier: number;
            /** ID=0x004d | type=CHAR_STR | required=true | default=  */
            objectName: string;
            /** ID=0x004f | type=ENUM16 | required=true */
            objectType: number;
            /** ID=0x00a8 | type=CHAR_STR | default=  */
            profileName: string;
        };
        commands: never;
        commandResponses: never;
    };
    piMultistateValueExt: {
        attributes: {
            /** ID=0x0000 | type=BITMAP8 | required=true | write=true | writeOptional=true | default=0 */
            ackedTransitions: number;
            /** ID=0x0006 | type=SET | required=true | write=true | writeOptional=true | max=65535 */
            alarmValues: ZclArray | unknown[];
            /** ID=0x0011 | type=UINT16 | required=true | write=true | writeOptional=true | max=65535 | default=0 */
            notificationClass: number;
            /** ID=0x0023 | type=BITMAP8 | required=true | write=true | writeOptional=true | default=0 */
            eventEnable: number;
            /** ID=0x0024 | type=ENUM8 */
            eventState: number;
            /** ID=0x0025 | type=SET | required=true | write=true | writeOptional=true | max=65535 | default=0 */
            faultValues: ZclArray | unknown[];
            /** ID=0x0048 | type=ENUM8 | required=true | write=true | writeOptional=true | default=0 */
            notifyType: number;
            /** ID=0x0071 | type=UINT8 | required=true | write=true | writeOptional=true | default=0 */
            timeDelay: number;
            /** ID=0x0082 | type=ARRAY | required=true */
            eventTimeStamps: ZclArray | unknown[];
        };
        commands: never;
        commandResponses: never;
    };
    pi11073ProtocolTunnel: {
        attributes: {
            /** ID=0x0000 | type=ARRAY | default=65535 */
            deviceidList: ZclArray | unknown[];
            /** ID=0x0001 | type=IEEE_ADDR */
            managerTarget: string;
            /** ID=0x0002 | type=UINT8 | min=1 | max=255 */
            managerEndpoint: number;
            /** ID=0x0003 | type=BOOLEAN */
            connected: number;
            /** ID=0x0004 | type=BOOLEAN */
            preemptible: number;
            /** ID=0x0005 | type=UINT16 | min=1 | max=65535 | default=0 */
            idleTimeout: number;
        };
        commands: {
            /** ID=0x00 | required=true */
            transferApdu: {
                /** type=OCTET_STR */
                apdu: Buffer;
            };
            /** ID=0x01 */
            connectRequest: {
                /** type=BITMAP8 */
                control: number;
                /** type=UINT16 */
                idleTimeout: number;
                /** type=IEEE_ADDR */
                managerTarget: string;
                /** type=UINT8 */
                managerEndpoint: number;
            };
            /** ID=0x02 */
            disconnectRequest: {
                /** type=IEEE_ADDR */
                managerTarget: string;
            };
            /** ID=0x03 */
            connectStatusNotification: {
                /** type=ENUM8 */
                status: number;
            };
        };
        commandResponses: never;
    };
    piIso7818ProtocolTunnel: {
        attributes: {
            /** ID=0x0000 | type=UINT8 | required=true | max=1 | default=0 */
            status: number;
        };
        commands: {
            /** ID=0x00 | required=true */
            transferApdu: {
                /** type=OCTET_STR */
                apdu: Buffer;
            };
            /** ID=0x01 | required=true */
            insertSmartCard: Record<string, never>;
            /** ID=0x02 | required=true */
            extractSmartCard: Record<string, never>;
        };
        commandResponses: {
            /** ID=0x00 | required=true */
            transferApdu: {
                /** type=OCTET_STR */
                apdu: Buffer;
            };
        };
    };
    retailTunnel: {
        attributes: {
            /** ID=0x0000 | type=UINT16 | required=true | min=4096 | max=4351 */
            manufacturerCode: number;
            /** ID=0x0001 | type=UINT16 | required=true | min=49152 | max=65535 */
            msProfile: number;
        };
        commands: {
            /** ID=0x00 | required=true */
            transferApdu: {
                /** type=OCTET_STR */
                apdu: Buffer;
            };
        };
        commandResponses: never;
    };
    seMetering: {
        attributes: {
            /** ID=0x0000 | type=UINT48 | required=true | max=281474976710655 */
            currentSummDelivered: number;
            /** ID=0x0001 | type=UINT48 | max=281474976710655 */
            currentSummReceived: number;
            /** ID=0x0002 | type=UINT48 | max=281474976710655 */
            currentMaxDemandDelivered: number;
            /** ID=0x0003 | type=UINT48 | max=281474976710655 */
            currentMaxDemandReceived: number;
            /** ID=0x0004 | type=UINT48 | max=281474976710655 */
            dftSumm: number;
            /** ID=0x0005 | type=UINT16 | max=5947 | default=0 */
            dailyFreezeTime: number;
            /** ID=0x0006 | type=INT8 | min=-100 | max=100 | default=0 */
            powerFactor: number;
            /** ID=0x0007 | type=UTC */
            readingSnapshotTime: number;
            /** ID=0x0008 | type=UTC */
            currentMaxDemandDeliverdTime: number;
            /** ID=0x0009 | type=UTC */
            currentMaxDemandReceivedTime: number;
            /** ID=0x000a | type=UINT8 | max=255 | default=30 */
            defaultUpdatePeriod: number;
            /** ID=0x000b | type=UINT8 | max=255 | default=5 */
            fastPollUpdatePeriod: number;
            /** ID=0x000c | type=UINT48 | max=281474976710655 */
            currentBlockPeriodConsumpDelivered: number;
            /** ID=0x000d | type=UINT24 | max=16777215 */
            dailyConsumpTarget: number;
            /** ID=0x000e | type=ENUM8 | max=16 */
            currentBlock: number;
            /** ID=0x000f | type=ENUM8 | max=255 */
            profileIntervalPeriod: number;
            /** ID=0x0011 | type=UINT16 | max=5947 | default=0 */
            presetReadingTime: number;
            /** ID=0x0012 | type=UINT16 | max=65535 */
            volumePerReport: number;
            /** ID=0x0013 | type=UINT8 | max=255 */
            flowRestriction: number;
            /** ID=0x0014 | type=ENUM8 | max=255 */
            supplyStatus: number;
            /** ID=0x0015 | type=UINT48 | max=281474976710655 */
            currentInEnergyCarrierSumm: number;
            /** ID=0x0016 | type=UINT48 | max=281474976710655 */
            currentOutEnergyCarrierSumm: number;
            /** ID=0x0017 | type=INT24 | min=-8388607 | max=8388607 */
            inletTempreature: number;
            /** ID=0x0018 | type=INT24 | min=-8388607 | max=8388607 */
            outletTempreature: number;
            /** ID=0x0019 | type=INT24 | min=-8388607 | max=8388607 */
            controlTempreature: number;
            /** ID=0x001a | type=INT24 | min=-8388607 | max=8388607 */
            currentInEnergyCarrierDemand: number;
            /** ID=0x001b | type=INT24 | min=-8388607 | max=8388607 */
            currentOutEnergyCarrierDemand: number;
            /** ID=0x001c | type=UINT48 | max=281474976710655 */
            previousBlockPeriodConsumpReceived: number;
            /** ID=0x001d | type=UINT48 | max=281474976710655 */
            currentBlockPeriodConsumpReceived: number;
            /** ID=0x001e | type=ENUM8 | max=255 */
            currentBlockReceived: number;
            /** ID=0x001f | type=UINT48 | max=281474976710655 */
            DFTSummationReceived: number;
            /** ID=0x0020 | type=ENUM8 | max=48 */
            activeRegisterTierDelivered: number;
            /** ID=0x0021 | type=ENUM8 | max=48 */
            activeRegisterTierReceived: number;
            /** ID=0x0022 | type=UTC */
            lastBlockSwitchTime: number;
            /** ID=0x0100 | type=UINT48 | max=281474976710655 */
            currentTier1SummDelivered: number;
            /** ID=0x0101 | type=UINT48 | max=281474976710655 */
            currentTier1SummReceived: number;
            /** ID=0x0102 | type=UINT48 | max=281474976710655 */
            currentTier2SummDelivered: number;
            /** ID=0x0103 | type=UINT48 | max=281474976710655 */
            currentTier2SummReceived: number;
            /** ID=0x0104 | type=UINT48 | max=281474976710655 */
            currentTier3SummDelivered: number;
            /** ID=0x0105 | type=UINT48 | max=281474976710655 */
            currentTier3SummReceived: number;
            /** ID=0x0106 | type=UINT48 | max=281474976710655 */
            currentTier4SummDelivered: number;
            /** ID=0x0107 | type=UINT48 | max=281474976710655 */
            currentTier4SummReceived: number;
            /** ID=0x0108 | type=UINT48 | max=281474976710655 */
            currentTier5SummDelivered: number;
            /** ID=0x0109 | type=UINT48 | max=281474976710655 */
            currentTier5SummReceived: number;
            /** ID=0x010a | type=UINT48 | max=281474976710655 */
            currentTier6SummDelivered: number;
            /** ID=0x010b | type=UINT48 | max=281474976710655 */
            currentTier6SummReceived: number;
            /** ID=0x010c | type=UINT48 | max=281474976710655 */
            currentTier7SummDelivered: number;
            /** ID=0x010d | type=UINT48 | max=281474976710655 */
            currentTier7SummReceived: number;
            /** ID=0x010e | type=UINT48 | max=281474976710655 */
            currentTier8SummDelivered: number;
            /** ID=0x010f | type=UINT48 | max=281474976710655 */
            currentTier8SummReceived: number;
            /** ID=0x0110 | type=UINT48 | max=281474976710655 */
            currentTier9SummDelivered: number;
            /** ID=0x0111 | type=UINT48 | max=281474976710655 */
            currentTier9SummReceived: number;
            /** ID=0x0112 | type=UINT48 | max=281474976710655 */
            currentTier10SummDelivered: number;
            /** ID=0x0113 | type=UINT48 | max=281474976710655 */
            currentTier10SummReceived: number;
            /** ID=0x0114 | type=UINT48 | max=281474976710655 */
            currentTier11SummDelivered: number;
            /** ID=0x0115 | type=UINT48 | max=281474976710655 */
            currentTier11SummReceived: number;
            /** ID=0x0116 | type=UINT48 | max=281474976710655 */
            currentTier12SummDelivered: number;
            /** ID=0x0117 | type=UINT48 | max=281474976710655 */
            currentTier12SummReceived: number;
            /** ID=0x0118 | type=UINT48 | max=281474976710655 */
            currentTier13SummDelivered: number;
            /** ID=0x0119 | type=UINT48 | max=281474976710655 */
            currentTier13SummReceived: number;
            /** ID=0x011a | type=UINT48 | max=281474976710655 */
            currentTier14SummDelivered: number;
            /** ID=0x011b | type=UINT48 | max=281474976710655 */
            currentTier14SummReceived: number;
            /** ID=0x011c | type=UINT48 | max=281474976710655 */
            currentTier15SummDelivered: number;
            /** ID=0x011d | type=UINT48 | max=281474976710655 */
            currentTier15SummReceived: number;
            /** ID=0x01fc | type=UINT48 | max=281474976710655 */
            cpp1SummationDelivered: number;
            /** ID=0x01fe | type=UINT48 | max=281474976710655 */
            cpp2SummationDelivered: number;
            /** ID=0x0200 | type=BITMAP8 | required=true | max=255 | default=0 */
            status: number;
            /** ID=0x0201 | type=UINT8 | max=255 */
            remainingBattLife: number;
            /** ID=0x0202 | type=UINT24 | max=16777215 */
            hoursInOperation: number;
            /** ID=0x0203 | type=UINT24 | max=16777215 */
            hoursInFault: number;
            /** ID=0x0204 | type=BITMAP64 */
            extendedStatus: bigint;
            /** ID=0x0205 | type=UINT16 | max=65535 */
            remainingBattLifeInDays: number;
            /** ID=0x0206 | type=OCTET_STR */
            currentMeterId: Buffer;
            /** ID=0x0207 | type=ENUM8 | max=2 */
            ambientConsumptionIndicator: number;
            /** ID=0x0300 | type=ENUM8 | required=true | max=255 | default=0 */
            unitOfMeasure: number;
            /** ID=0x0301 | type=UINT24 | max=16777215 */
            multiplier: number;
            /** ID=0x0302 | type=UINT24 | max=16777215 */
            divisor: number;
            /** ID=0x0303 | type=BITMAP8 | required=true | max=255 */
            summaFormatting: number;
            /** ID=0x0304 | type=BITMAP8 | max=255 */
            demandFormatting: number;
            /** ID=0x0305 | type=BITMAP8 | max=255 */
            historicalConsumpFormatting: number;
            /** ID=0x0306 | type=BITMAP8 | max=255 */
            meteringDeviceType: number;
            /** ID=0x0307 | type=OCTET_STR | minLen=1 | maxLen=33 */
            siteId: Buffer;
            /** ID=0x0308 | type=OCTET_STR | minLen=1 | maxLen=25 */
            meterSerialNumber: Buffer;
            /** ID=0x0309 | type=ENUM8 | max=255 */
            energyCarrierUnitOfMeas: number;
            /** ID=0x030a | type=BITMAP8 | max=255 */
            energyCarrierSummFormatting: number;
            /** ID=0x030b | type=BITMAP8 | max=255 */
            energyCarrierDemandFormatting: number;
            /** ID=0x030c | type=ENUM8 | max=255 */
            temperatureUnitOfMeas: number;
            /** ID=0x030d | type=BITMAP8 | max=255 */
            temperatureFormatting: number;
            /** ID=0x030e | type=OCTET_STR | minLen=1 | maxLen=25 */
            moduleSerialNumber: Buffer;
            /** ID=0x030f | type=OCTET_STR | minLen=1 | maxLen=25 */
            operatingTariffLevelDelivered: Buffer;
            /** ID=0x0310 | type=OCTET_STR | minLen=1 | maxLen=25 */
            operatingTariffLevelReceived: Buffer;
            /** ID=0x0311 | type=OCTET_STR | minLen=1 | maxLen=25 */
            customIdNumber: Buffer;
            /** ID=0x0312 | type=ENUM8 | default=0 */
            alternativeUnitOfMeasure: number;
            /** ID=0x0312 | type=BITMAP8 | max=255 */
            alternativeDemandFormatting: number;
            /** ID=0x0312 | type=BITMAP8 | max=255 */
            alternativeConsumptionFormatting: number;
            /** ID=0x0400 | type=INT24 | min=-8388607 | max=8388607 | default=0 */
            instantaneousDemand: number;
            /** ID=0x0401 | type=UINT24 | max=16777215 */
            currentDayConsumpDelivered: number;
            /** ID=0x0402 | type=UINT24 | max=16777215 */
            currentDayConsumpReceived: number;
            /** ID=0x0403 | type=UINT24 | max=16777215 */
            previousDayConsumpDelivered: number;
            /** ID=0x0404 | type=UINT24 | max=16777215 */
            previousDayConsumpReceived: number;
            /** ID=0x0405 | type=UTC */
            curPartProfileIntStartTimeDelivered: number;
            /** ID=0x0406 | type=UTC */
            curPartProfileIntStartTimeReceived: number;
            /** ID=0x0407 | type=UINT24 | max=16777215 */
            curPartProfileIntValueDelivered: number;
            /** ID=0x0408 | type=UINT24 | max=16777215 */
            curPartProfileIntValueReceived: number;
            /** ID=0x0409 | type=UINT48 | max=281474976710655 */
            currentDayMaxPressure: number;
            /** ID=0x040a | type=UINT48 | max=281474976710655 */
            currentDayMinPressure: number;
            /** ID=0x040b | type=UINT48 | max=281474976710655 */
            previousDayMaxPressure: number;
            /** ID=0x040c | type=UINT48 | max=281474976710655 */
            previousDayMinPressure: number;
            /** ID=0x040d | type=INT24 | min=-8388607 | max=8388607 */
            currentDayMaxDemand: number;
            /** ID=0x040e | type=INT24 | min=-8388607 | max=8388607 */
            previousDayMaxDemand: number;
            /** ID=0x040f | type=INT24 | min=-8388607 | max=8388607 */
            currentMonthMaxDemand: number;
            /** ID=0x0410 | type=INT24 | min=-8388607 | max=8388607 */
            currentYearMaxDemand: number;
            /** ID=0x0411 | type=INT24 | min=-8388607 | max=8388607 */
            currentDayMaxEnergyCarrDemand: number;
            /** ID=0x0412 | type=INT24 | min=-8388607 | max=8388607 */
            previousDayMaxEnergyCarrDemand: number;
            /** ID=0x0413 | type=INT24 | min=-8388607 | max=8388607 */
            curMonthMaxEnergyCarrDemand: number;
            /** ID=0x0414 | type=INT24 | min=-8388607 | max=8388607 */
            curMonthMinEnergyCarrDemand: number;
            /** ID=0x0415 | type=INT24 | min=-8388607 | max=8388607 */
            curYearMaxEnergyCarrDemand: number;
            /** ID=0x0416 | type=INT24 | min=-8388607 | max=8388607 */
            curYearMinEnergyCarrDemand: number;
            /** ID=0x0420 | type=UINT24 | max=16777215 */
            previousDay2ConsumptionDelivered: number;
            /** ID=0x0421 | type=UINT24 | max=16777215 */
            previousDay2ConsumptionReceived: number;
            /** ID=0x0422 | type=UINT24 | max=16777215 */
            previousDay3ConsumptionDelivered: number;
            /** ID=0x0423 | type=UINT24 | max=16777215 */
            previousDay3ConsumptionReceived: number;
            /** ID=0x0424 | type=UINT24 | max=16777215 */
            previousDay4ConsumptionDelivered: number;
            /** ID=0x0425 | type=UINT24 | max=16777215 */
            previousDay4ConsumptionReceived: number;
            /** ID=0x0426 | type=UINT24 | max=16777215 */
            previousDay5ConsumptionDelivered: number;
            /** ID=0x0427 | type=UINT24 | max=16777215 */
            previousDay5ConsumptionReceived: number;
            /** ID=0x0428 | type=UINT24 | max=16777215 */
            previousDay6ConsumptionDelivered: number;
            /** ID=0x0420 | type=UINT24 | max=16777215 */
            previousDay6ConsumptionReceived: number;
            /** ID=0x042a | type=UINT24 | max=16777215 */
            previousDay7ConsumptionDelivered: number;
            /** ID=0x042b | type=UINT24 | max=16777215 */
            previousDay7ConsumptionReceived: number;
            /** ID=0x042c | type=UINT24 | max=16777215 */
            previousDay8ConsumptionDelivered: number;
            /** ID=0x042d | type=UINT24 | max=16777215 */
            previousDay8ConsumptionReceived: number;
            /** ID=0x0430 | type=UINT24 | max=16777215 */
            currentWeekConsumptionDelivered: number;
            /** ID=0x0431 | type=UINT24 | max=16777215 */
            currentWeekConsumptionReceived: number;
            /** ID=0x0432 | type=UINT24 | max=16777215 */
            previousWeekConsumptionDelivered: number;
            /** ID=0x0433 | type=UINT24 | max=16777215 */
            previousWeekConsumptionReceived: number;
            /** ID=0x0434 | type=UINT24 | max=16777215 */
            previousWeek2ConsumptionDelivered: number;
            /** ID=0x0435 | type=UINT24 | max=16777215 */
            previousWeek2ConsumptionReceived: number;
            /** ID=0x0436 | type=UINT24 | max=16777215 */
            previousWeek3ConsumptionDelivered: number;
            /** ID=0x0437 | type=UINT24 | max=16777215 */
            previousWeek3ConsumptionReceived: number;
            /** ID=0x0438 | type=UINT24 | max=16777215 */
            previousWeek4ConsumptionDelivered: number;
            /** ID=0x0439 | type=UINT24 | max=16777215 */
            previousWeek4ConsumptionReceived: number;
            /** ID=0x043a | type=UINT24 | max=16777215 */
            previousWeek5ConsumptionDelivered: number;
            /** ID=0x043b | type=UINT24 | max=16777215 */
            previousWeek5ConsumptionReceived: number;
            /** ID=0x0440 | type=UINT32 | max=4294967295 */
            currentMonthConsumptionDelivered: number;
            /** ID=0x0441 | type=UINT32 | max=4294967295 */
            currentMonthConsumptionReceived: number;
            /** ID=0x0442 | type=UINT32 | max=4294967295 */
            previousMonthConsumptionDelivered: number;
            /** ID=0x0443 | type=UINT32 | max=4294967295 */
            previousMonthConsumptionReceived: number;
            /** ID=0x0444 | type=UINT32 | max=4294967295 */
            previousMonth2ConsumptionDelivered: number;
            /** ID=0x0445 | type=UINT32 | max=4294967295 */
            previousMonth2ConsumptionReceived: number;
            /** ID=0x0446 | type=UINT32 | max=4294967295 */
            previousMonth3ConsumptionDelivered: number;
            /** ID=0x0447 | type=UINT32 | max=4294967295 */
            previousMonth3ConsumptionReceived: number;
            /** ID=0x0448 | type=UINT32 | max=4294967295 */
            previousMonth4ConsumptionDelivered: number;
            /** ID=0x0449 | type=UINT32 | max=4294967295 */
            previousMonth4ConsumptionReceived: number;
            /** ID=0x044a | type=UINT32 | max=4294967295 */
            previousMonth5ConsumptionDelivered: number;
            /** ID=0x044b | type=UINT32 | max=4294967295 */
            previousMonth5ConsumptionReceived: number;
            /** ID=0x044c | type=UINT32 | max=4294967295 */
            previousMonth6ConsumptionDelivered: number;
            /** ID=0x044d | type=UINT32 | max=4294967295 */
            previousMonth6ConsumptionReceived: number;
            /** ID=0x044e | type=UINT32 | max=4294967295 */
            previousMonth7ConsumptionDelivered: number;
            /** ID=0x044f | type=UINT32 | max=4294967295 */
            previousMonth7ConsumptionReceived: number;
            /** ID=0x0450 | type=UINT32 | max=4294967295 */
            previousMonth8ConsumptionDelivered: number;
            /** ID=0x0451 | type=UINT32 | max=4294967295 */
            previousMonth8ConsumptionReceived: number;
            /** ID=0x0452 | type=UINT32 | max=4294967295 */
            previousMonth9ConsumptionDelivered: number;
            /** ID=0x0453 | type=UINT32 | max=4294967295 */
            previousMonth9ConsumptionReceived: number;
            /** ID=0x0454 | type=UINT32 | max=4294967295 */
            previousMonth10ConsumptionDelivered: number;
            /** ID=0x0455 | type=UINT32 | max=4294967295 */
            previousMonth10ConsumptionReceived: number;
            /** ID=0x0456 | type=UINT32 | max=4294967295 */
            previousMonth11ConsumptionDelivered: number;
            /** ID=0x0457 | type=UINT32 | max=4294967295 */
            previousMonth11ConsumptionReceived: number;
            /** ID=0x0458 | type=UINT32 | max=4294967295 */
            previousMonth12ConsumptionDelivered: number;
            /** ID=0x0459 | type=UINT32 | max=4294967295 */
            previousMonth12ConsumptionReceived: number;
            /** ID=0x045a | type=UINT32 | max=4294967295 */
            previousMonth13ConsumptionDelivered: number;
            /** ID=0x045b | type=UINT32 | max=4294967295 */
            previousMonth13ConsumptionReceived: number;
            /** ID=0x045c | type=UINT16 | max=5947 | default=0 */
            historicalFreezeTime: number;
            /** ID=0x0500 | type=UINT8 | max=255 | default=24 */
            maxNumberOfPeriodsDelivered: number;
            /** ID=0x0600 | type=UINT24 | max=16777215 */
            currentDemandDelivered: number;
            /** ID=0x0601 | type=UINT24 | max=16777215 */
            demandLimit: number;
            /** ID=0x0602 | type=UINT8 | min=1 | max=255 */
            demandIntegrationPeriod: number;
            /** ID=0x0603 | type=UINT8 | min=1 | max=255 */
            numberOfDemandSubintervals: number;
            /** ID=0x0604 | type=UINT16 | max=65535 | default=60 */
            demandLimitArmDuration: number;
            /** ID=0x0605 | type=ENUM8 | max=255 | default=0 */
            loadLimitSupplyState: number;
            /** ID=0x0606 | type=UINT8 | max=255 | default=1 */
            loadLimitCounter: number;
            /** ID=0x0607 | type=ENUM8 | max=255 | default=0 */
            supplyTamperState: number;
            /** ID=0x0608 | type=ENUM8 | max=255 | default=0 */
            supplyDepletionState: number;
            /** ID=0x0609 | type=ENUM8 | max=255 | default=0 */
            supplyUncontrolledFlowState: number;
            /** ID=0x0800 | type=BITMAP16 | max=65535 | default=65535 */
            genericAlarmMask: number;
            /** ID=0x0801 | type=BITMAP32 | max=4294967295 | default=4294967295 */
            electricityAlarmMask: number;
            /** ID=0x0802 | type=BITMAP16 | max=65535 | default=65535 */
            genFlowPressureAlarmMask: number;
            /** ID=0x0803 | type=BITMAP16 | max=65535 | default=65535 */
            waterSpecificAlarmMask: number;
            /** ID=0x0804 | type=BITMAP16 | max=65535 | default=65535 */
            heatCoolSpecificAlarmMASK: number;
            /** ID=0x0805 | type=BITMAP16 | max=65535 | default=65535 */
            gasSpecificAlarmMask: number;
            /** ID=0x0806 | type=BITMAP48 | max=281474976710655 | default=281474976710655 */
            extendedGenericAlarmMask: number;
            /** ID=0x0807 | type=BITMAP16 | max=65535 | default=65535 */
            manufactureAlarmMask: number;
            /** ID=0x0a00 | type=UINT32 | max=4294967295 | default=0 */
            billToDateDelivered: number;
            /** ID=0x0a01 | type=UTC | default=0 */
            billToDateTimeStampDelivered: number;
            /** ID=0x0a02 | type=UINT32 | max=4294967295 | default=0 */
            projectedBillDelivered: number;
            /** ID=0x0a03 | type=UTC | default=0 */
            projectedBillTimeStampDelivered: number;
            /** ID=0x0a04 | type=BITMAP8 */
            billDeliveredTrailingDigit: number;
            /** ID=0x0a10 | type=UINT32 | max=4294967295 | default=0 */
            billToDateReceived: number;
            /** ID=0x0a11 | type=UTC | default=0 */
            billToDateTimeStampReceived: number;
            /** ID=0x0a12 | type=UINT32 | max=4294967295 | default=0 */
            projectedBillReceived: number;
            /** ID=0x0a13 | type=UTC | default=0 */
            projectedBillTimeStampReceived: number;
            /** ID=0x0a14 | type=BITMAP8 */
            billReceivedTrailingDigit: number;
            /** ID=0x0300 | type=UINT16 | manufacturerCode=DEVELCO(0x1015) | write=true | max=65535 */
            develcoPulseConfiguration?: number;
            /** ID=0x0301 | type=UINT48 | manufacturerCode=DEVELCO(0x1015) | write=true | max=281474976710655 */
            develcoCurrentSummation?: number;
            /** ID=0x0302 | type=ENUM16 | manufacturerCode=DEVELCO(0x1015) | write=true | max=65535 */
            develcoInterfaceMode?: number;
            /** ID=0x2000 | type=INT24 | manufacturerCode=OWON_TECHNOLOGY_INC(0x113c) | write=true | min=-8388608 | max=8388607 */
            owonL1PhasePower?: number;
            /** ID=0x2001 | type=INT24 | manufacturerCode=OWON_TECHNOLOGY_INC(0x113c) | write=true | min=-8388608 | max=8388607 */
            owonL2PhasePower?: number;
            /** ID=0x2002 | type=INT24 | manufacturerCode=OWON_TECHNOLOGY_INC(0x113c) | write=true | min=-8388608 | max=8388607 */
            owonL3PhasePower?: number;
            /** ID=0x2100 | type=INT24 | manufacturerCode=OWON_TECHNOLOGY_INC(0x113c) | write=true | min=-8388608 | max=8388607 */
            owonL1PhaseReactivePower?: number;
            /** ID=0x2101 | type=INT24 | manufacturerCode=OWON_TECHNOLOGY_INC(0x113c) | write=true | min=-8388608 | max=8388607 */
            owonL2PhaseReactivePower?: number;
            /** ID=0x2102 | type=INT24 | manufacturerCode=OWON_TECHNOLOGY_INC(0x113c) | write=true | min=-8388608 | max=8388607 */
            owonL3PhaseReactivePower?: number;
            /** ID=0x2103 | type=INT24 | manufacturerCode=OWON_TECHNOLOGY_INC(0x113c) | write=true | min=-8388608 | max=8388607 */
            owonReactivePowerSum?: number;
            /** ID=0x3000 | type=UINT24 | manufacturerCode=OWON_TECHNOLOGY_INC(0x113c) | write=true | max=16777215 */
            owonL1PhaseVoltage?: number;
            /** ID=0x3001 | type=UINT24 | manufacturerCode=OWON_TECHNOLOGY_INC(0x113c) | write=true | max=16777215 */
            owonL2PhaseVoltage?: number;
            /** ID=0x3002 | type=UINT24 | manufacturerCode=OWON_TECHNOLOGY_INC(0x113c) | write=true | max=16777215 */
            owonL3PhaseVoltage?: number;
            /** ID=0x3100 | type=UINT24 | manufacturerCode=OWON_TECHNOLOGY_INC(0x113c) | write=true | max=16777215 */
            owonL1PhaseCurrent?: number;
            /** ID=0x3101 | type=UINT24 | manufacturerCode=OWON_TECHNOLOGY_INC(0x113c) | write=true | max=16777215 */
            owonL2PhaseCurrent?: number;
            /** ID=0x3102 | type=UINT24 | manufacturerCode=OWON_TECHNOLOGY_INC(0x113c) | write=true | max=16777215 */
            owonL3PhaseCurrent?: number;
            /** ID=0x3103 | type=UINT24 | manufacturerCode=OWON_TECHNOLOGY_INC(0x113c) | write=true | max=16777215 */
            owonCurrentSum?: number;
            /** ID=0x3104 | type=UINT24 | manufacturerCode=OWON_TECHNOLOGY_INC(0x113c) | write=true | max=16777215 */
            owonLeakageCurrent?: number;
            /** ID=0x4000 | type=UINT48 | manufacturerCode=OWON_TECHNOLOGY_INC(0x113c) | write=true | max=281474976710655 */
            owonL1Energy?: number;
            /** ID=0x4001 | type=UINT48 | manufacturerCode=OWON_TECHNOLOGY_INC(0x113c) | write=true | max=281474976710655 */
            owonL2Energy?: number;
            /** ID=0x4002 | type=UINT48 | manufacturerCode=OWON_TECHNOLOGY_INC(0x113c) | write=true | max=281474976710655 */
            owonL3Energy?: number;
            /** ID=0x4100 | type=UINT48 | manufacturerCode=OWON_TECHNOLOGY_INC(0x113c) | write=true | max=281474976710655 */
            owonL1ReactiveEnergy?: number;
            /** ID=0x4101 | type=UINT48 | manufacturerCode=OWON_TECHNOLOGY_INC(0x113c) | write=true | max=281474976710655 */
            owonL2ReactiveEnergy?: number;
            /** ID=0x4102 | type=UINT48 | manufacturerCode=OWON_TECHNOLOGY_INC(0x113c) | write=true | max=281474976710655 */
            owonL3ReactiveEnergy?: number;
            /** ID=0x4103 | type=UINT48 | manufacturerCode=OWON_TECHNOLOGY_INC(0x113c) | write=true | max=281474976710655 */
            owonReactiveEnergySum?: number;
            /** ID=0x4104 | type=INT8 | manufacturerCode=OWON_TECHNOLOGY_INC(0x113c) | write=true | min=-128 | max=127 */
            owonL1PowerFactor?: number;
            /** ID=0x4105 | type=INT8 | manufacturerCode=OWON_TECHNOLOGY_INC(0x113c) | write=true | min=-128 | max=127 */
            owonL2PowerFactor?: number;
            /** ID=0x4106 | type=INT8 | manufacturerCode=OWON_TECHNOLOGY_INC(0x113c) | write=true | min=-128 | max=127 */
            owonL3PowerFactor?: number;
            /** ID=0x5005 | type=UINT8 | manufacturerCode=OWON_TECHNOLOGY_INC(0x113c) | write=true | max=255 */
            owonFrequency?: number;
            /** ID=0x1000 | type=BITMAP8 | manufacturerCode=OWON_TECHNOLOGY_INC(0x113c) | write=true */
            owonReportMap?: number;
            /** ID=0x5000 | type=UINT32 | manufacturerCode=OWON_TECHNOLOGY_INC(0x113c) | write=true | max=4294967295 */
            owonLastHistoricalRecordTime?: number;
            /** ID=0x5001 | type=UINT32 | manufacturerCode=OWON_TECHNOLOGY_INC(0x113c) | write=true | max=4294967295 */
            owonOldestHistoricalRecordTime?: number;
            /** ID=0x5002 | type=UINT32 | manufacturerCode=OWON_TECHNOLOGY_INC(0x113c) | write=true | max=4294967295 */
            owonMinimumReportCycle?: number;
            /** ID=0x5003 | type=UINT32 | manufacturerCode=OWON_TECHNOLOGY_INC(0x113c) | write=true | max=4294967295 */
            owonMaximumReportCycle?: number;
            /** ID=0x5004 | type=UINT8 | manufacturerCode=OWON_TECHNOLOGY_INC(0x113c) | write=true | max=255 */
            owonSentHistoricalRecordState?: number;
            /** ID=0x5006 | type=UINT8 | manufacturerCode=OWON_TECHNOLOGY_INC(0x113c) | write=true | max=255 */
            owonAccumulativeEnergyThreshold?: number;
            /** ID=0x5007 | type=UINT8 | manufacturerCode=OWON_TECHNOLOGY_INC(0x113c) | write=true | max=255 */
            owonReportMode?: number;
            /** ID=0x5008 | type=UINT8 | manufacturerCode=OWON_TECHNOLOGY_INC(0x113c) | write=true | max=255 */
            owonPercentChangeInPower?: number;
            /** ID=0x4010 | type=INT48 | manufacturerCode=SCHNEIDER_ELECTRIC(0x105e) | write=true | min=-140737488355328 | max=140737488355327 */
            schneiderActiveEnergyTotal?: number;
            /** ID=0x4011 | type=INT48 | manufacturerCode=SCHNEIDER_ELECTRIC(0x105e) | write=true | min=-140737488355328 | max=140737488355327 */
            schneiderReactiveEnergyTotal?: number;
            /** ID=0x4012 | type=INT48 | manufacturerCode=SCHNEIDER_ELECTRIC(0x105e) | write=true | min=-140737488355328 | max=140737488355327 */
            schneiderApparentEnergyTotal?: number;
            /** ID=0x4014 | type=INT48 | manufacturerCode=SCHNEIDER_ELECTRIC(0x105e) | write=true | min=-140737488355328 | max=140737488355327 */
            schneiderPartialActiveEnergyTotal?: number;
            /** ID=0x4015 | type=INT48 | manufacturerCode=SCHNEIDER_ELECTRIC(0x105e) | write=true | min=-140737488355328 | max=140737488355327 */
            schneiderPartialReactiveEnergyTotal?: number;
            /** ID=0x4016 | type=INT48 | manufacturerCode=SCHNEIDER_ELECTRIC(0x105e) | write=true | min=-140737488355328 | max=140737488355327 */
            schneiderPartialApparentEnergyTotal?: number;
            /** ID=0x4100 | type=INT48 | manufacturerCode=SCHNEIDER_ELECTRIC(0x105e) | write=true | min=-140737488355328 | max=140737488355327 */
            schneiderPartialActiveEnergyL1Phase?: number;
            /** ID=0x4101 | type=INT48 | manufacturerCode=SCHNEIDER_ELECTRIC(0x105e) | write=true | min=-140737488355328 | max=140737488355327 */
            schneiderPartialReactiveEnergyL1Phase?: number;
            /** ID=0x4102 | type=INT48 | manufacturerCode=SCHNEIDER_ELECTRIC(0x105e) | write=true | min=-140737488355328 | max=140737488355327 */
            schneiderPartialApparentEnergyL1Phase?: number;
            /** ID=0x4103 | type=INT48 | manufacturerCode=SCHNEIDER_ELECTRIC(0x105e) | write=true | min=-140737488355328 | max=140737488355327 */
            schneiderActiveEnergyL1Phase?: number;
            /** ID=0x4104 | type=INT48 | manufacturerCode=SCHNEIDER_ELECTRIC(0x105e) | write=true | min=-140737488355328 | max=140737488355327 */
            schneiderReactiveEnergyL1Phase?: number;
            /** ID=0x4105 | type=INT48 | manufacturerCode=SCHNEIDER_ELECTRIC(0x105e) | write=true | min=-140737488355328 | max=140737488355327 */
            schneiderApparentEnergyL1Phase?: number;
            /** ID=0x4200 | type=INT48 | manufacturerCode=SCHNEIDER_ELECTRIC(0x105e) | write=true | min=-140737488355328 | max=140737488355327 */
            schneiderPartialActiveEnergyL2Phase?: number;
            /** ID=0x4201 | type=INT48 | manufacturerCode=SCHNEIDER_ELECTRIC(0x105e) | write=true | min=-140737488355328 | max=140737488355327 */
            schneiderPartialReactiveEnergyL2Phase?: number;
            /** ID=0x4202 | type=INT48 | manufacturerCode=SCHNEIDER_ELECTRIC(0x105e) | write=true | min=-140737488355328 | max=140737488355327 */
            schneiderPartialApparentEnergyL2Phase?: number;
            /** ID=0x4203 | type=INT48 | manufacturerCode=SCHNEIDER_ELECTRIC(0x105e) | write=true | min=-140737488355328 | max=140737488355327 */
            schneiderActiveEnergyL2Phase?: number;
            /** ID=0x4204 | type=INT48 | manufacturerCode=SCHNEIDER_ELECTRIC(0x105e) | write=true | min=-140737488355328 | max=140737488355327 */
            schneiderReactiveEnergyL2Phase?: number;
            /** ID=0x4205 | type=INT48 | manufacturerCode=SCHNEIDER_ELECTRIC(0x105e) | write=true | min=-140737488355328 | max=140737488355327 */
            schneiderApparentEnergyL2Phase?: number;
            /** ID=0x4300 | type=INT48 | manufacturerCode=SCHNEIDER_ELECTRIC(0x105e) | write=true | min=-140737488355328 | max=140737488355327 */
            schneiderPartialActiveEnergyL3Phase?: number;
            /** ID=0x4301 | type=INT48 | manufacturerCode=SCHNEIDER_ELECTRIC(0x105e) | write=true | min=-140737488355328 | max=140737488355327 */
            schneiderPartialReactiveEnergyL3Phase?: number;
            /** ID=0x4302 | type=INT48 | manufacturerCode=SCHNEIDER_ELECTRIC(0x105e) | write=true | min=-140737488355328 | max=140737488355327 */
            schneiderPartialApparentEnergyL3Phase?: number;
            /** ID=0x4303 | type=INT48 | manufacturerCode=SCHNEIDER_ELECTRIC(0x105e) | write=true | min=-140737488355328 | max=140737488355327 */
            schneiderActiveEnergyL3Phase?: number;
            /** ID=0x4304 | type=INT48 | manufacturerCode=SCHNEIDER_ELECTRIC(0x105e) | write=true | min=-140737488355328 | max=140737488355327 */
            schneiderReactiveEnergyL3Phase?: number;
            /** ID=0x4305 | type=INT48 | manufacturerCode=SCHNEIDER_ELECTRIC(0x105e) | write=true | min=-140737488355328 | max=140737488355327 */
            schneiderApparentEnergyL3Phase?: number;
            /** ID=0x4400 | type=UINT24 | manufacturerCode=SCHNEIDER_ELECTRIC(0x105e) | write=true | max=16777215 */
            schneiderActiveEnergyMultiplier?: number;
            /** ID=0x4401 | type=UINT24 | manufacturerCode=SCHNEIDER_ELECTRIC(0x105e) | write=true | max=16777215 */
            schneiderActiveEnergyDivisor?: number;
            /** ID=0x4402 | type=UINT24 | manufacturerCode=SCHNEIDER_ELECTRIC(0x105e) | write=true | max=16777215 */
            schneiderReactiveEnergyMultiplier?: number;
            /** ID=0x4403 | type=UINT24 | manufacturerCode=SCHNEIDER_ELECTRIC(0x105e) | write=true | max=16777215 */
            schneiderReactiveEnergyDivisor?: number;
            /** ID=0x4404 | type=UINT24 | manufacturerCode=SCHNEIDER_ELECTRIC(0x105e) | write=true | max=16777215 */
            schneiderApparentEnergyMultiplier?: number;
            /** ID=0x4405 | type=UINT24 | manufacturerCode=SCHNEIDER_ELECTRIC(0x105e) | write=true | max=16777215 */
            schneiderApparentEnergyDivisor?: number;
            /** ID=0x4501 | type=UTC | manufacturerCode=SCHNEIDER_ELECTRIC(0x105e) | write=true | max=4294967295 */
            schneiderEnergyResetDateTime?: number;
            /** ID=0x4600 | type=UINT16 | manufacturerCode=SCHNEIDER_ELECTRIC(0x105e) | write=true | max=65535 */
            schneiderEnergyCountersReportingPeriod?: number;
        };
        commands: {
            /** ID=0x00 | response=0 */
            getProfile: {
                /** type=ENUM8 */
                intervalChannel: number;
                /** type=UTC */
                endTime: number;
                /** type=UINT8 */
                numberOfPeriods: number;
            };
            /** ID=0x01 | response=1 */
            requestMirrorRsp: {
                /** type=UINT16 */
                endpointId: number;
            };
            /** ID=0x02 | response=2 */
            mirrorRemoved: {
                /** type=UINT16 */
                removedEndpointId: number;
            };
            /** ID=0x03 | response=3 */
            requestFastPollMode: {
                /** type=UINT8 */
                fastPollUpdatePeriod: number;
                /** type=UINT8 */
                duration: number;
            };
            /** ID=0x04 | response=4 */
            schneduleSnapshot: {
                /** type=UINT32 */
                issuerEventId: number;
                /** type=UINT8 */
                commandIndex: number;
                /** type=UINT8 */
                totalNumberOfCommands: number;
            };
            /** ID=0x05 | response=5 */
            takeSnapshot: {
                /** type=BITMAP32 */
                cause: number;
            };
            /** ID=0x06 */
            getSnapshot: {
                /** type=UTC */
                earliestStartTime: number;
                /** type=UTC */
                latestEndTime: number;
                /** type=UINT8 */
                offset: number;
                /** type=BITMAP32 */
                cause: number;
            };
            /** ID=0x07 | response=13 */
            startSampling: {
                /** type=UINT32 */
                issuerEventId: number;
                /** type=UTC */
                startTime: number;
                /** type=ENUM8 */
                type: number;
                /** type=UINT16 */
                requestInterval: number;
                /** type=UINT16 */
                maxNumberOfSamples: number;
            };
            /** ID=0x08 | response=7 */
            getSampledData: {
                /** type=UINT16 */
                sampleId: number;
                /** type=UTC */
                earliestSampleTime: number;
                /** type=ENUM8 */
                type: number;
                /** type=UINT16 */
                numberOfSamples: number;
            };
            /** ID=0x09 */
            mirrorReportAttributeRsp: {
                /** type=UINT8 */
                notificationScheme: number;
                /** type=BITMAP32 */
                notificationFlags: number;
            };
            /** ID=0x0a */
            resetLoadLimitCounter: {
                /** type=UINT32 */
                providerId: number;
                /** type=UINT32 */
                issuerEventId: number;
            };
            /** ID=0x0b */
            changeSupply: {
                /** type=UINT32 */
                providerId: number;
                /** type=UINT32 */
                issuerEventId: number;
                /** type=UTC */
                requestDateTime: number;
                /** type=UTC */
                implDateTime: number;
                /** type=ENUM8 */
                proposedSupplyStatusAfterImpl: number;
                /** type=BITMAP8 */
                SupplyControlBits: number;
            };
            /** ID=0x0c */
            localChangeSupply: {
                /** type=ENUM8 */
                proposedSupplyStatus: number;
            };
            /** ID=0x0d */
            setSupplyStatus: {
                /** type=UINT32 */
                issuerEventId: number;
                /** type=ENUM8 */
                tamperState: number;
                /** type=ENUM8 */
                depletionState: number;
                /** type=ENUM8 */
                uncontrolledFlowState: number;
                /** type=ENUM8 */
                loadLimitSupplyState: number;
            };
            /** ID=0x0e */
            setUncontrolledFlowThreshold: {
                /** type=UINT32 */
                providerId: number;
                /** type=UINT32 */
                issuerEventId: number;
                /** type=UINT16 */
                uncontrolledFlowThreshold: number;
                /** type=ENUM8 */
                unitOfMeasure: number;
                /** type=UINT16 */
                multiplier: number;
                /** type=UINT16 */
                divisor: number;
                /** type=UINT8 */
                stabilisationPeriod: number;
                /** type=UINT16 */
                measurementPeriod: number;
            };
            /** ID=0x20 */
            owonGetHistoryRecord: Record<string, never>;
            /** ID=0x21 */
            owonStopSendingHistoricalRecord: Record<string, never>;
        };
        commandResponses: {
            /** ID=0x00 */
            getProfileRsp: {
                /** type=UTC */
                endTime: number;
                /** type=ENUM8 */
                status: number;
                /** type=ENUM8 */
                profileIntervalPeriod: number;
                /** type=UINT8 */
                numberOfPeriodsDelivered: number;
                /** type=LIST_UINT24 */
                intervals: number[];
            };
            /** ID=0x01 */
            requestMirror: Record<string, never>;
            /** ID=0x02 */
            removeMirror: Record<string, never>;
            /** ID=0x03 */
            requestFastPollModeRsp: {
                /** type=UINT8 */
                appliedUpdatePeriod: number;
                /** type=UTC */
                fastPollModeEndTime: number;
            };
            /** ID=0x04 */
            scheduleSnapshotRsp: {
                /** type=UINT32 */
                issuerEventId: number;
            };
            /** ID=0x05 */
            takeSnapshotRsp: {
                /** type=UINT32 */
                id: number;
                /** type=UINT8 */
                confirmation: number;
            };
            /** ID=0x06 */
            publishSnapshot: {
                /** type=UINT32 */
                id: number;
                /** type=UTC */
                time: number;
                /** type=UINT8 */
                totalSnapshotsFound: number;
                /** type=UINT8 */
                commandIndex: number;
                /** type=UINT8 */
                totalNumberOfCommands: number;
                /** type=BITMAP32 */
                cause: number;
                /** type=ENUM8 */
                payloadType: number;
            };
            /** ID=0x07 */
            getSampledDataRsp: {
                /** type=UINT16 */
                id: number;
                /** type=UTC */
                startTime: number;
                /** type=ENUM8 */
                type: number;
                /** type=UINT16 */
                requestInterval: number;
                /** type=UINT16 */
                numberOfSamples: number;
                /** type=LIST_UINT24 */
                samples: number[];
            };
            /** ID=0x08 */
            configureMirror: {
                /** type=UINT32 */
                issuerEventId: number;
                /** type=UINT24 */
                reportingInterval: number;
                /** type=BOOLEAN */
                mirrorNotificationReporting: number;
                /** type=UINT8 */
                notificationScheme: number;
            };
            /** ID=0x09 */
            configureNotificationScheme: {
                /** type=UINT32 */
                issuerEventId: number;
                /** type=UINT8 */
                notificationScheme: number;
                /** type=BITMAP32 */
                notificationFlagOrder: number;
            };
            /** ID=0x0a */
            configureNotificationFlag: {
                /** type=UINT32 */
                issuerEventId: number;
                /** type=UINT8 */
                notificationScheme: number;
                /** type=UINT16 */
                notificationFlagAttributeId: number;
                /** type=CLUSTER_ID */
                clusterId: number;
                /** type=UINT16 */
                manufacturerCode: number;
                /** type=UINT8 */
                numberOfCommands: number;
                /** type=LIST_UINT8 */
                commandIds: number[];
            };
            /** ID=0x0b */
            getNotifiedMessage: {
                /** type=UINT8 */
                notificationScheme: number;
                /** type=UINT16 */
                notificationFlagAttributeId: number;
                /** type=BITMAP32 */
                notificationFlags: number;
            };
            /** ID=0x0c */
            supplyStatusRsp: {
                /** type=UINT32 */
                providerId: number;
                /** type=UINT32 */
                issuerEventId: number;
                /** type=UTC */
                implDateTime: number;
                /** type=ENUM8 */
                supplyStatusAfterImpl: number;
            };
            /** ID=0x0d */
            startSamplingRsp: {
                /** type=UINT16 */
                sampleId: number;
            };
            /** ID=0x20 */
            owonGetHistoryRecordRsp: Record<string, never>;
        };
    };
    seTunneling: {
        attributes: {
            /** ID=0x0000 | type=UINT16 | required=true | min=1 | default=65535 */
            closeTunnelTimeout: number;
        };
        commands: {
            /** ID=0x00 | response=0 | required=true */
            requestTunnel: {
                /** type=ENUM8 | min=1 | max=255 */
                protocolId: number;
                /** type=UINT16 | max=65535 */
                manufacturerCode: number;
                /** type=BOOLEAN */
                flowControl: number;
                /** type=UINT16 | max=65535 */
                maxIncomingTransferSize: number;
            };
            /** ID=0x01 | required=true */
            closeTunnel: {
                /** type=UINT16 | max=65535 */
                tunnelId: number;
            };
            /** ID=0x02 | required=true */
            transferData: {
                /** type=UINT16 | max=65535 */
                tunnelId: number;
                /** type=BUFFER */
                data: Buffer;
            };
            /** ID=0x03 | required=true */
            transferDataError: {
                /** type=UINT16 | max=65535 */
                tunnelId: number;
                /** type=UINT8 */
                status: number;
            };
            /** ID=0x04 */
            ackTransferData: {
                /** type=UINT16 | max=65535 */
                tunnelId: number;
                /** type=UINT16 */
                numberOfBytesLeft: number;
            };
            /** ID=0x05 */
            readyData: {
                /** type=UINT16 | max=65535 */
                tunnelId: number;
                /** type=UINT16 */
                numberOfOctetsLeft: number;
            };
            /** ID=0x06 */
            getSupportedTunnelProtocols: {
                /** type=UINT8 */
                protocolOffset: number;
            };
        };
        commandResponses: {
            /** ID=0x00 | required=true */
            requestTunnelRsp: {
                /** type=UINT16 | max=65535 */
                tunnelId: number;
                /** type=UINT8 */
                status: number;
                /** type=UINT16 */
                maxIncomingTransferSize: number;
            };
            /** ID=0x01 | required=true */
            transferData: {
                /** type=UINT16 | max=65535 */
                tunnelId: number;
                /** type=BUFFER */
                data: Buffer;
            };
            /** ID=0x02 | required=true */
            transferDataError: {
                /** type=UINT16 | max=65535 */
                tunnelId: number;
                /** type=UINT8 */
                status: number;
            };
            /** ID=0x03 */
            ackTransferData: {
                /** type=UINT16 | max=65535 */
                tunnelId: number;
                /** type=UINT16 */
                numberOfBytesLeft: number;
            };
            /** ID=0x04 */
            readyData: {
                /** type=UINT16 | max=65535 */
                tunnelId: number;
                /** type=UINT16 */
                numberOfOctetsLeft: number;
            };
            /** ID=0x05 */
            supportedProtocolsRsp: {
                /** type=BOOLEAN */
                listComplete: number;
                /** type=UINT8 */
                count: number;
            };
            /** ID=0x06 */
            closureNotification: {
                /** type=UINT16 */
                tunnelId: number;
            };
        };
    };
    telecommunicationsInformation: {
        attributes: {
            /** ID=0x0000 | type=CHAR_STR | required=true */
            nodeDescription: string;
            /** ID=0x0001 | type=BOOLEAN | required=true */
            deliveryEnable: number;
            /** ID=0x0002 | type=UINT32 */
            pushInformationTimer: number;
            /** ID=0x0003 | type=BOOLEAN | required=true */
            enableSecureConfiguration: number;
            /** ID=0x0010 | type=UINT16 | max=65535 */
            numberOfContents: number;
            /** ID=0x0011 | type=UINT16 | max=65535 */
            contentRootID: number;
        };
        commands: {
            /** ID=0x00 | response=0 | required=true */
            requestInfo: Record<string, never>;
            /** ID=0x01 | required=true */
            pushInfoResponse: Record<string, never>;
            /** ID=0x02 | response=2 */
            sendPreference: Record<string, never>;
            /** ID=0x03 */
            requestPreferenceRsp: Record<string, never>;
            /** ID=0x04 | response=5 */
            update: Record<string, never>;
            /** ID=0x05 | response=6 */
            delete: Record<string, never>;
            /** ID=0x06 */
            configureNodeDescription: Record<string, never>;
            /** ID=0x07 */
            configureDeliveryEnable: Record<string, never>;
            /** ID=0x08 */
            configurePushInfoTimer: Record<string, never>;
            /** ID=0x09 */
            configureSetRootId: Record<string, never>;
        };
        commandResponses: {
            /** ID=0x00 | required=true */
            requestInfoRsp: Record<string, never>;
            /** ID=0x01 | required=true */
            pushInfo: Record<string, never>;
            /** ID=0x02 | required=true */
            sendPreferenceRsp: Record<string, never>;
            /** ID=0x03 | required=true */
            serverRequestPreference: Record<string, never>;
            /** ID=0x04 | required=true */
            requestPreferenceConfirmation: Record<string, never>;
            /** ID=0x05 | required=true */
            updateRsp: Record<string, never>;
            /** ID=0x06 | required=true */
            deleteRsp: Record<string, never>;
        };
    };
    telecommunicationsVoiceOverZigbee: {
        attributes: {
            /** ID=0x0000 | type=ENUM8 | required=true | write=true */
            codecType: number;
            /** ID=0x0001 | type=ENUM8 | required=true | write=true */
            samplingFrequency: number;
            /** ID=0x0002 | type=ENUM8 | required=true | write=true */
            codecrate: number;
            /** ID=0x0003 | type=UINT8 | required=true | min=1 | max=255 */
            establishmentTimeout: number;
            /** ID=0x0004 | type=ENUM8 | write=true */
            codecTypeSub1: number;
            /** ID=0x0005 | type=ENUM8 | write=true */
            codecTypeSub2: number;
            /** ID=0x0006 | type=ENUM8 | write=true */
            codecTypeSub3: number;
            /** ID=0x0007 | type=ENUM8 */
            compressionType: number;
            /** ID=0x0008 | type=ENUM8 */
            compressionRate: number;
            /** ID=0x0009 | type=BITMAP8 | write=true | max=255 */
            optionFlags: number;
            /** ID=0x000a | type=UINT8 | write=true | max=255 */
            threshold: number;
        };
        commands: {
            /** ID=0x00 | response=0 | required=true */
            establishmentRequest: {
                /** type=BITMAP8 */
                flag: number;
                /** type=ENUM8 */
                codecType: number;
                /** type=ENUM8 */
                sampFreq: number;
                /** type=ENUM8 */
                codecRate: number;
                /** type=ENUM8 */
                serviceType: number;
                /** type=ENUM8 | conditions=[{bitMaskSet param=flag mask=1}] */
                codecTypeS1?: number;
                /** type=ENUM8 | conditions=[{bitMaskSet param=flag mask=2}] */
                codecTypeS2?: number;
                /** type=ENUM8 | conditions=[{bitMaskSet param=flag mask=4}] */
                codecTypeS3?: number;
                /** type=ENUM8 | conditions=[{bitMaskSet param=flag mask=8}] */
                compType?: number;
                /** type=ENUM8 | conditions=[{bitMaskSet param=flag mask=8}] */
                compRate?: number;
            };
            /** ID=0x00 | required=true */
            voiceTransmission: {
                /** type=UNKNOWN */
                voiceData: never;
            };
            /** ID=0x00 */
            voiceTransmissionCompletion: {
                /** type=UNKNOWN */
                zclHeader: never;
            };
            /** ID=0x00 */
            controlResponse: {
                /** type=ENUM8 */
                status: number;
            };
        };
        commandResponses: {
            /** ID=0x00 | required=true */
            establishmentRsp: {
                /** type=ENUM8 */
                status: number;
                /** type=ENUM8 */
                codecType: number;
            };
            /** ID=0x01 | required=true */
            voiceTransmissionRsp: {
                /** type=UINT8 */
                zclHeaderSeqNum: number;
                /** type=ENUM8 */
                errorFlag: number;
            };
            /** ID=0x02 */
            control: {
                /** type=ENUM8 */
                controlType: number;
            };
        };
    };
    telecommunicationsChatting: {
        attributes: {
            /** ID=0x0000 | type=UINT16 | required=true | max=65535 */
            uID: number;
            /** ID=0x0001 | type=CHAR_STR | required=true */
            nickname: string;
            /** ID=0x0010 | type=UINT16 | required=true | max=65535 */
            cID: number;
            /** ID=0x0011 | type=CHAR_STR | required=true */
            name: string;
            /** ID=0x0012 | type=BOOLEAN */
            enableAddChat: number;
        };
        commands: {
            /** ID=0x00 | response=1 | required=true */
            joinChatReq: {
                /** type=UINT16 */
                uID: number;
                /** type=CHAR_STR */
                nickname: string;
                /** type=UINT16 */
                cID: number;
            };
            /** ID=0x01 | required=true */
            leaveChatReq: {
                /** type=UINT16 */
                cID: number;
                /** type=UINT16 */
                uID: number;
            };
            /** ID=0x02 | response=4 | required=true */
            searchChatReq: Record<string, never>;
            /** ID=0x03 */
            switchCharmanRsp: {
                /** type=UINT16 */
                cID: number;
                /** type=UINT16 */
                uID: number;
            };
            /** ID=0x04 | response=0 */
            startChatReq: {
                /** type=CHAR_STR */
                name: string;
                /** type=UINT16 */
                uID: number;
                /** type=CHAR_STR */
                nickname: string;
            };
            /** ID=0x05 | required=true */
            chatMessage: {
                /** type=UINT16 */
                destUID: number;
                /** type=UINT16 */
                srcUID: number;
                /** type=UINT16 */
                cID: number;
                /** type=CHAR_STR */
                nickname: string;
                /** type=CHAR_STR */
                message: string;
            };
            /** ID=0x06 | response=8 */
            getNodeInfoReq: {
                /** type=UINT16 */
                cID: number;
                /** type=UINT16 */
                uID: number;
            };
        };
        commandResponses: {
            /** ID=0x00 | required=true */
            startChatRsp: {
                /** type=ENUM8 */
                status: number;
                /** type=UINT16 */
                cID: number;
            };
            /** ID=0x01 | required=true */
            joinChatRsp: {
                /** type=ENUM8 */
                status: number;
                /** type=UINT16 */
                cID: number;
            };
            /** ID=0x02 | required=true */
            userLeft: {
                /** type=UINT16 */
                cID: number;
                /** type=UINT16 */
                uID: number;
                /** type=CHAR_STR */
                nickName: string;
            };
            /** ID=0x03 | required=true */
            userJoined: {
                /** type=UINT16 */
                cID: number;
                /** type=UINT16 */
                uID: number;
                /** type=CHAR_STR */
                nickName: string;
            };
            /** ID=0x04 | required=true */
            searchChatRsp: {
                /** type=BITMAP8 */
                options: number;
            };
            /** ID=0x05 | required=true */
            switchChairmanReq: {
                /** type=UINT16 */
                cID: number;
            };
            /** ID=0x06 | required=true */
            switchChairmanConfirm: {
                /** type=UINT16 */
                cID: number;
            };
            /** ID=0x07 | required=true */
            switchChairmanNotification: {
                /** type=UINT16 */
                cID: number;
                /** type=UINT16 */
                uID: number;
                /** type=DATA16 */
                address: number;
                /** type=UINT8 */
                endpoint: number;
            };
            /** ID=0x08 | required=true */
            getNodeInfoRsp: {
                /** type=ENUM8 */
                status: number;
                /** type=UINT16 */
                cID: number;
                /** type=UINT16 */
                uID: number;
                /** type=DATA16 */
                address: number;
                /** type=UINT8 */
                endpoint: number;
                /** type=CHAR_STR */
                nickName: string;
            };
        };
    };
    haApplianceIdentification: {
        attributes: {
            /** ID=0x0000 | type=UINT56 | required=true */
            basicIdentification: bigint;
            /** ID=0x0010 | type=CHAR_STR | maxLen=16 */
            companyName: string;
            /** ID=0x0011 | type=UINT16 | max=65535 */
            companyId: number;
            /** ID=0x0012 | type=CHAR_STR | maxLen=16 */
            brandName: string;
            /** ID=0x0013 | type=UINT16 | max=65535 */
            brandId: number;
            /** ID=0x0014 | type=OCTET_STR | maxLen=16 */
            model: Buffer;
            /** ID=0x0015 | type=OCTET_STR | maxLen=16 */
            partNumber: Buffer;
            /** ID=0x0016 | type=OCTET_STR | maxLen=6 */
            productRevision: Buffer;
            /** ID=0x0017 | type=OCTET_STR | maxLen=6 */
            softwareRevision: Buffer;
            /** ID=0x0018 | type=OCTET_STR | length=2 */
            productTypeName: Buffer;
            /** ID=0x0019 | type=UINT16 | max=65535 */
            productTypeId: number;
            /** ID=0x001a | type=UINT8 | max=255 */
            cecedSpecificationVersion: number;
        };
        commands: never;
        commandResponses: never;
    };
    seMeterIdentification: {
        attributes: {
            /** ID=0x0000 | type=CHAR_STR | required=true | minLen=0 | maxLen=16 */
            companyName: string;
            /** ID=0x0001 | type=UINT16 | required=true | max=65535 */
            meterTypeId: number;
            /** ID=0x0004 | type=UINT16 | required=true | max=65535 */
            dataQualityId: number;
            /** ID=0x0005 | type=CHAR_STR | write=true | minLen=0 | maxLen=16 */
            customerName: string;
            /** ID=0x0006 | type=OCTET_STR | minLen=0 | maxLen=16 */
            model: Buffer;
            /** ID=0x0007 | type=OCTET_STR | minLen=0 | maxLen=16 */
            partNumber: Buffer;
            /** ID=0x0008 | type=OCTET_STR | minLen=0 | maxLen=6 */
            productRevision: Buffer;
            /** ID=0x000a | type=OCTET_STR | minLen=0 | maxLen=6 */
            softwareRevision: Buffer;
            /** ID=0x000b | type=CHAR_STR | minLen=0 | maxLen=16 */
            utilityName: string;
            /** ID=0x000c | type=CHAR_STR | required=true | minLen=0 | maxLen=16 */
            pod: string;
            /** ID=0x000d | type=INT24 | required=true | max=16777215 */
            availablePower: number;
            /** ID=0x000e | type=INT24 | required=true | max=16777215 */
            powerThreshold: number;
        };
        commands: never;
        commandResponses: never;
    };
    haApplianceEventsAlerts: {
        attributes: never;
        commands: {
            /** ID=0x00 | required=true */
            getAlerts: Record<string, never>;
        };
        commandResponses: {
            /** ID=0x00 | required=true */
            getAlertsRsp: {
                /** type=UINT8 */
                alertscount: number;
                /** type=LIST_UINT24 */
                aalert: number[];
            };
            /** ID=0x01 | required=true */
            alertsNotification: {
                /** type=UINT8 */
                alertscount: number;
                /** type=LIST_UINT24 */
                aalert: number[];
            };
            /** ID=0x02 | required=true */
            eventNotification: {
                /** type=UINT8 */
                eventheader: number;
                /** type=UINT8 | max=255 */
                eventid: number;
            };
        };
    };
    haApplianceStatistics: {
        attributes: {
            /** ID=0x0000 | type=UINT32 | required=true | default=60 */
            logMaxSize: number;
            /** ID=0x0001 | type=UINT8 | required=true | default=1 */
            logQueueMaxSize: number;
        };
        commands: {
            /** ID=0x00 | required=true */
            log: {
                /** type=UINT32 */
                logid: number;
            };
            /** ID=0x01 | required=true */
            logQueue: Record<string, never>;
        };
        commandResponses: {
            /** ID=0x00 | required=true */
            logNotification: {
                /** type=UTC */
                timestamp: number;
                /** type=UINT32 */
                logid: number;
                /** type=UINT32 */
                loglength: number;
                /** type=LIST_UINT8 */
                logpayload: number[];
            };
            /** ID=0x01 | required=true */
            logRsp: {
                /** type=UTC */
                timestamp: number;
                /** type=UINT32 */
                logid: number;
                /** type=UINT32 */
                loglength: number;
                /** type=LIST_UINT8 */
                logpayload: number[];
            };
            /** ID=0x02 | required=true */
            logQueueRsp: {
                /** type=UINT8 */
                logqueuesize: number;
                /** type=LIST_UINT32 */
                logid: number[];
            };
            /** ID=0x03 | required=true */
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
            /** ID=0x0000 | type=BITMAP32 | required=true | max=4294967295 | default=0 */
            measurementType: number;
            /** ID=0x0100 | type=INT16 | report=true | min=-32767 */
            dcVoltage: number;
            /** ID=0x0101 | type=INT16 | min=-32767 */
            dcVoltageMin: number;
            /** ID=0x0102 | type=INT16 | min=-32767 */
            dcvoltagemax: number;
            /** ID=0x0103 | type=INT16 | report=true | min=-32767 */
            dcCurrent: number;
            /** ID=0x0104 | type=INT16 | min=-32767 */
            dcCurrentMin: number;
            /** ID=0x0105 | type=INT16 | min=-32767 */
            dcCurrentMax: number;
            /** ID=0x0106 | type=INT16 | report=true | min=-32767 */
            dcPower: number;
            /** ID=0x0107 | type=INT16 | min=-32767 */
            dcPowerMin: number;
            /** ID=0x0108 | type=INT16 | min=-32767 */
            dcPowerMax: number;
            /** ID=0x0200 | type=UINT16 | report=true | min=1 | max=65535 | default=1 */
            dcVoltageMultiplier: number;
            /** ID=0x0201 | type=UINT16 | report=true | min=1 | max=65535 | default=1 */
            dcVoltageDivisor: number;
            /** ID=0x0202 | type=UINT16 | report=true | min=1 | max=65535 | default=1 */
            dcCurrentMultiplier: number;
            /** ID=0x0203 | type=UINT16 | report=true | min=1 | max=65535 | default=1 */
            dcCurrentDivisor: number;
            /** ID=0x0204 | type=UINT16 | report=true | min=1 | max=65535 | default=1 */
            dcPowerMultiplier: number;
            /** ID=0x0205 | type=UINT16 | report=true | min=1 | max=65535 | default=1 */
            dcPowerDivisor: number;
            /** ID=0x0300 | type=UINT16 | report=true */
            acFrequency: number;
            /** ID=0x0301 | type=UINT16 */
            acFrequencyMin: number;
            /** ID=0x0302 | type=UINT16 */
            acFrequencyMax: number;
            /** ID=0x0303 | type=UINT16 | report=true */
            neutralCurrent: number;
            /** ID=0x0304 | type=INT32 | report=true | min=-8388607 | max=8388607 */
            totalActivePower: number;
            /** ID=0x0305 | type=INT32 | report=true | min=-8388607 | max=8388607 */
            totalReactivePower: number;
            /** ID=0x0306 | type=UINT32 | report=true | max=16777215 */
            totalApparentPower: number;
            /** ID=0x0307 | type=INT16 | report=true */
            meas1stHarmonicCurrent: number;
            /** ID=0x0308 | type=INT16 | report=true */
            meas3rdHarmonicCurrent: number;
            /** ID=0x0309 | type=INT16 | report=true */
            meas5thHarmonicCurrent: number;
            /** ID=0x030a | type=INT16 | report=true */
            meas7thHarmonicCurrent: number;
            /** ID=0x030b | type=INT16 | report=true */
            meas9thHarmonicCurrent: number;
            /** ID=0x030c | type=INT16 | report=true */
            meas11thHarmonicCurrent: number;
            /** ID=0x030d | type=INT16 | report=true */
            measPhase1stHarmonicCurrent: number;
            /** ID=0x030e | type=INT16 | report=true */
            measPhase3rdHarmonicCurrent: number;
            /** ID=0x030f | type=INT16 | report=true */
            measPhase5thHarmonicCurrent: number;
            /** ID=0x0310 | type=INT16 | report=true */
            measPhase7thHarmonicCurrent: number;
            /** ID=0x0311 | type=INT16 | report=true */
            measPhase9thHarmonicCurrent: number;
            /** ID=0x0312 | type=INT16 | report=true */
            measPhase11thHarmonicCurrent: number;
            /** ID=0x0400 | type=UINT16 | report=true | min=1 | default=1 */
            acFrequencyMultiplier: number;
            /** ID=0x0401 | type=UINT16 | report=true | min=1 | default=1 */
            acFrequencyDivisor: number;
            /** ID=0x0402 | type=UINT32 | report=true | max=16777215 | default=1 */
            powerMultiplier: number;
            /** ID=0x0403 | type=UINT32 | report=true | max=16777215 | default=1 */
            powerDivisor: number;
            /** ID=0x0404 | type=INT8 | report=true | min=-127 | default=0 */
            harmonicCurrentMultiplier: number;
            /** ID=0x0405 | type=INT8 | report=true | min=-127 | default=0 */
            phaseHarmonicCurrentMultiplier: number;
            /** ID=0x0500 | type=INT16 */
            instantaneousVoltage: number;
            /** ID=0x0501 | type=UINT16 | report=true */
            instantaneousLineCurrent: number;
            /** ID=0x0502 | type=INT16 | report=true */
            instantaneousActiveCurrent: number;
            /** ID=0x0503 | type=INT16 | report=true */
            instantaneousReactiveCurrent: number;
            /** ID=0x0504 | type=INT16 */
            instantaneousPower: number;
            /** ID=0x0505 | type=UINT16 | report=true */
            rmsVoltage: number;
            /** ID=0x0506 | type=UINT16 */
            rmsVoltageMin: number;
            /** ID=0x0507 | type=UINT16 */
            rmsVoltageMax: number;
            /** ID=0x0508 | type=UINT16 | report=true */
            rmsCurrent: number;
            /** ID=0x0509 | type=UINT16 */
            rmsCurrentMin: number;
            /** ID=0x050a | type=UINT16 */
            rmsCurrentMax: number;
            /** ID=0x050b | type=INT16 | report=true */
            activePower: number;
            /** ID=0x050c | type=INT16 */
            activePowerMin: number;
            /** ID=0x050d | type=INT16 */
            activePowerMax: number;
            /** ID=0x050e | type=INT16 | report=true */
            reactivePower: number;
            /** ID=0x050f | type=UINT16 | report=true */
            apparentPower: number;
            /** ID=0x0510 | type=INT8 | min=-100 | max=100 | default=0 */
            powerFactor: number;
            /** ID=0x0511 | type=UINT16 | write=true | default=0 */
            averageRmsVoltageMeasPeriod: number;
            /** ID=0x0512 | type=UINT16 | write=true | default=0 */
            averageRmsOverVoltageCounter: number;
            /** ID=0x0513 | type=UINT16 | write=true | default=0 */
            averageRmsUnderVoltageCounter: number;
            /** ID=0x0514 | type=UINT16 | write=true | default=0 */
            rmsExtremeOverVoltagePeriod: number;
            /** ID=0x0515 | type=UINT16 | write=true | default=0 */
            rmsExtremeUnderVoltagePeriod: number;
            /** ID=0x0516 | type=UINT16 | write=true | default=0 */
            rmsVoltageSagPeriod: number;
            /** ID=0x0517 | type=UINT16 | write=true | default=0 */
            rmsVoltageSwellPeriod: number;
            /** ID=0x0600 | type=UINT16 | report=true | min=1 | default=1 */
            acVoltageMultiplier: number;
            /** ID=0x0601 | type=UINT16 | report=true | min=1 | default=1 */
            acVoltageDivisor: number;
            /** ID=0x0602 | type=UINT16 | report=true | min=1 | default=1 */
            acCurrentMultiplier: number;
            /** ID=0x0603 | type=UINT16 | report=true | min=1 | default=1 */
            acCurrentDivisor: number;
            /** ID=0x0604 | type=UINT16 | report=true | min=1 | default=1 */
            acPowerMultiplier: number;
            /** ID=0x0605 | type=UINT16 | report=true | min=1 | default=1 */
            acPowerDivisor: number;
            /** ID=0x0700 | type=BITMAP8 | write=true | default=0 */
            dcOverloadAlarmsMask: number;
            /** ID=0x0701 | type=INT16 */
            dcVoltageOverload: number;
            /** ID=0x0702 | type=INT16 */
            dcCurrentOverload: number;
            /** ID=0x0800 | type=BITMAP16 | write=true | default=0 */
            acAlarmsMask: number;
            /** ID=0x0801 | type=INT16 */
            acVoltageOverload: number;
            /** ID=0x0802 | type=INT16 */
            acCurrentOverload: number;
            /** ID=0x0803 | type=INT16 */
            acActivePowerOverload: number;
            /** ID=0x0804 | type=INT16 */
            acReactivePowerOverload: number;
            /** ID=0x0805 | type=INT16 */
            averageRmsOverVoltage: number;
            /** ID=0x0806 | type=INT16 */
            averageRmsUnderVoltage: number;
            /** ID=0x0807 | type=INT16 | write=true */
            rmsExtremeOverVoltage: number;
            /** ID=0x0808 | type=INT16 | write=true */
            rmsExtremeUnderVoltage: number;
            /** ID=0x0809 | type=INT16 | write=true */
            rmsVoltageSag: number;
            /** ID=0x080a | type=INT16 | write=true */
            rmsVoltageSwell: number;
            /** ID=0x0901 | type=UINT16 | report=true */
            lineCurrentPhB: number;
            /** ID=0x0902 | type=INT16 | report=true */
            activeCurrentPhB: number;
            /** ID=0x0903 | type=INT16 | report=true */
            reactiveCurrentPhB: number;
            /** ID=0x0905 | type=UINT16 | report=true */
            rmsVoltagePhB: number;
            /** ID=0x0906 | type=UINT16 | default=32768 */
            rmsVoltageMinPhB: number;
            /** ID=0x0907 | type=UINT16 | default=32768 */
            rmsVoltageMaxPhB: number;
            /** ID=0x0908 | type=UINT16 | report=true */
            rmsCurrentPhB: number;
            /** ID=0x0909 | type=UINT16 */
            rmsCurrentMinPhB: number;
            /** ID=0x090a | type=UINT16 */
            rmsCurrentMaxPhB: number;
            /** ID=0x090b | type=INT16 | report=true */
            activePowerPhB: number;
            /** ID=0x090c | type=INT16 */
            activePowerMinPhB: number;
            /** ID=0x090d | type=INT16 */
            activePowerMaxPhB: number;
            /** ID=0x090e | type=INT16 | report=true */
            reactivePowerPhB: number;
            /** ID=0x090f | type=UINT16 | report=true */
            apparentPowerPhB: number;
            /** ID=0x0910 | type=INT8 | min=-100 | max=100 | default=0 */
            powerFactorPhB: number;
            /** ID=0x0911 | type=UINT16 | write=true | default=0 */
            averageRmsVoltageMeasurePeriodPhB: number;
            /** ID=0x0912 | type=UINT16 | write=true | default=0 */
            averageRmsOverVoltageCounterPhB: number;
            /** ID=0x0913 | type=UINT16 | write=true | default=0 */
            averageUnderVoltageCounterPhB: number;
            /** ID=0x0914 | type=UINT16 | write=true | default=0 */
            rmsExtremeOverVoltagePeriodPhB: number;
            /** ID=0x0915 | type=UINT16 | write=true | default=0 */
            rmsExtremeUnderVoltagePeriodPhB: number;
            /** ID=0x0916 | type=UINT16 | write=true | default=0 */
            rmsVoltageSagPeriodPhB: number;
            /** ID=0x0917 | type=UINT16 | write=true | default=0 */
            rmsVoltageSwellPeriodPhB: number;
            /** ID=0x0a01 | type=UINT16 | report=true */
            lineCurrentPhC: number;
            /** ID=0x0a02 | type=INT16 | report=true */
            activeCurrentPhC: number;
            /** ID=0x0a03 | type=INT16 | report=true */
            reactiveCurrentPhC: number;
            /** ID=0x0a05 | type=UINT16 | report=true */
            rmsVoltagePhC: number;
            /** ID=0x0a06 | type=UINT16 | default=32768 */
            rmsVoltageMinPhC: number;
            /** ID=0x0a07 | type=UINT16 | default=32768 */
            rmsVoltageMaxPhC: number;
            /** ID=0x0a08 | type=UINT16 | report=true */
            rmsCurrentPhC: number;
            /** ID=0x0a09 | type=UINT16 */
            rmsCurrentMinPhC: number;
            /** ID=0x0a0a | type=UINT16 */
            rmsCurrentMaxPhC: number;
            /** ID=0x0a0b | type=INT16 | report=true */
            activePowerPhC: number;
            /** ID=0x0a0c | type=INT16 */
            activePowerMinPhC: number;
            /** ID=0x0a0d | type=INT16 */
            activePowerMaxPhC: number;
            /** ID=0x0a0e | type=INT16 | report=true */
            reactivePowerPhC: number;
            /** ID=0x0a0f | type=UINT16 | report=true */
            apparentPowerPhC: number;
            /** ID=0x0a10 | type=INT8 | min=-100 | max=100 | default=0 */
            powerFactorPhC: number;
            /** ID=0x0a11 | type=UINT16 | write=true | default=0 */
            averageRmsVoltageMeasPeriodPhC: number;
            /** ID=0x0a12 | type=UINT16 | write=true | default=0 */
            averageRmsOverVoltageCounterPhC: number;
            /** ID=0x0a13 | type=UINT16 | write=true | default=0 */
            averageUnderVoltageCounterPhC: number;
            /** ID=0x0a14 | type=UINT16 | write=true | default=0 */
            rmsExtremeOverVoltagePeriodPhC: number;
            /** ID=0x0a15 | type=UINT16 | write=true | default=0 */
            rmsExtremeUnderVoltagePeriodPhC: number;
            /** ID=0x0a16 | type=UINT16 | write=true | default=0 */
            rmsVoltageSagPeriodPhC: number;
            /** ID=0x0a17 | type=UINT16 | write=true | default=0 */
            rmsVoltageSwellPeriodPhC: number;
            /** ID=0x4300 | type=INT32 | manufacturerCode=SCHNEIDER_ELECTRIC(0x105e) | write=true | min=-2147483648 | max=2147483647 */
            schneiderActivePowerDemandTotal?: number;
            /** ID=0x4303 | type=INT32 | manufacturerCode=SCHNEIDER_ELECTRIC(0x105e) | write=true | min=-2147483648 | max=2147483647 */
            schneiderReactivePowerDemandTotal?: number;
            /** ID=0x4318 | type=INT32 | manufacturerCode=SCHNEIDER_ELECTRIC(0x105e) | write=true | min=-2147483648 | max=2147483647 */
            schneiderApparentPowerDemandTotal?: number;
            /** ID=0x4319 | type=UINT24 | manufacturerCode=SCHNEIDER_ELECTRIC(0x105e) | write=true | max=16777215 */
            schneiderDemandIntervalDuration?: number;
            /** ID=0x4320 | type=UTC | manufacturerCode=SCHNEIDER_ELECTRIC(0x105e) | write=true | max=4294967295 */
            schneiderDemandDateTime?: number;
            /** ID=0x4509 | type=INT32 | manufacturerCode=SCHNEIDER_ELECTRIC(0x105e) | write=true | min=-2147483648 | max=2147483647 */
            schneiderActivePowerDemandPhase1?: number;
            /** ID=0x450a | type=INT32 | manufacturerCode=SCHNEIDER_ELECTRIC(0x105e) | write=true | min=-2147483648 | max=2147483647 */
            schneiderReactivePowerDemandPhase1?: number;
            /** ID=0x450b | type=INT32 | manufacturerCode=SCHNEIDER_ELECTRIC(0x105e) | write=true | min=-2147483648 | max=2147483647 */
            schneiderApparentPowerDemandPhase1?: number;
            /** ID=0x4510 | type=UINT16 | manufacturerCode=SCHNEIDER_ELECTRIC(0x105e) | write=true | max=65535 */
            schneiderDemandIntervalMinimalVoltageL1?: number;
            /** ID=0x4513 | type=UINT16 | manufacturerCode=SCHNEIDER_ELECTRIC(0x105e) | write=true | max=65535 */
            schneiderDemandIntervalMaximalCurrentI1?: number;
            /** ID=0x4909 | type=INT32 | manufacturerCode=SCHNEIDER_ELECTRIC(0x105e) | write=true | min=-2147483648 | max=2147483647 */
            schneiderActivePowerDemandPhase2?: number;
            /** ID=0x490a | type=INT32 | manufacturerCode=SCHNEIDER_ELECTRIC(0x105e) | write=true | min=-2147483648 | max=2147483647 */
            schneiderReactivePowerDemandPhase2?: number;
            /** ID=0x490b | type=INT32 | manufacturerCode=SCHNEIDER_ELECTRIC(0x105e) | write=true | min=-2147483648 | max=2147483647 */
            schneiderApparentPowerDemandPhase2?: number;
            /** ID=0x4910 | type=UINT16 | manufacturerCode=SCHNEIDER_ELECTRIC(0x105e) | write=true | max=65535 */
            schneiderDemandIntervalMinimalVoltageL2?: number;
            /** ID=0x4913 | type=UINT16 | manufacturerCode=SCHNEIDER_ELECTRIC(0x105e) | write=true | max=65535 */
            schneiderDemandIntervalMaximalCurrentI2?: number;
            /** ID=0x4a09 | type=INT32 | manufacturerCode=SCHNEIDER_ELECTRIC(0x105e) | write=true | min=-2147483648 | max=2147483647 */
            schneiderActivePowerDemandPhase3?: number;
            /** ID=0x4a0a | type=INT32 | manufacturerCode=SCHNEIDER_ELECTRIC(0x105e) | write=true | min=-2147483648 | max=2147483647 */
            schneiderReactivePowerDemandPhase3?: number;
            /** ID=0x4a0b | type=INT32 | manufacturerCode=SCHNEIDER_ELECTRIC(0x105e) | write=true | min=-2147483648 | max=2147483647 */
            schneiderApparentPowerDemandPhase3?: number;
            /** ID=0x4a10 | type=UINT16 | manufacturerCode=SCHNEIDER_ELECTRIC(0x105e) | write=true | max=65535 */
            schneiderDemandIntervalMinimalVoltageL3?: number;
            /** ID=0x4a13 | type=UINT16 | manufacturerCode=SCHNEIDER_ELECTRIC(0x105e) | write=true | max=65535 */
            schneiderDemandIntervalMaximalCurrentI3?: number;
            /** ID=0x4e00 | type=UINT8 | manufacturerCode=SCHNEIDER_ELECTRIC(0x105e) | write=true | max=255 */
            schneiderCurrentSensorMultiplier?: number;
        };
        commands: {
            /** ID=0x00 */
            getProfileInfo: Record<string, never>;
            /** ID=0x01 */
            getMeasurementProfile: {
                /** type=ATTR_ID */
                attrId: number;
                /** type=UTC */
                starttime: number;
                /** type=UINT8 */
                numofuntervals: number;
            };
        };
        commandResponses: {
            /** ID=0x00 */
            getProfileInfoRsp: {
                /** type=UINT8 */
                profilecount: number;
                /** type=ENUM8 */
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
                /** type=UTC */
                starttime: number;
                /** type=ENUM8 */
                status: number;
                /** type=ENUM8 */
                profileintervalperiod: number;
                /** type=UINT8 */
                numofintervalsdeliv: number;
                /** type=ATTR_ID */
                attrId: number;
                /** type=BUFFER */
                intervals: Buffer;
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
            /** ID=0x4000 | type=BITMAP16 | manufacturerCode=DANFOSS_A_S(0x1246) | write=true */
            danfossSystemStatusCode?: number;
            /** ID=0x4000 | type=UINT8 | manufacturerCode=SCHNEIDER_ELECTRIC(0x105e) | write=true | max=255 */
            schneiderCommunicationQuality?: number;
            /** ID=0x4031 | type=ENUM8 | manufacturerCode=DANFOSS_A_S(0x1246) | write=true | max=255 */
            danfossHeatSupplyRequest?: number;
            /** ID=0x4200 | type=ENUM8 | manufacturerCode=DANFOSS_A_S(0x1246) | write=true | max=255 */
            danfossSystemStatusWater?: number;
            /** ID=0x4201 | type=ENUM8 | manufacturerCode=DANFOSS_A_S(0x1246) | write=true | max=255 */
            danfossMultimasterRole?: number;
            /** ID=0x4210 | type=ENUM8 | manufacturerCode=DANFOSS_A_S(0x1246) | write=true | max=255 */
            danfossIconApplication?: number;
            /** ID=0x4220 | type=ENUM8 | manufacturerCode=DANFOSS_A_S(0x1246) | write=true | max=255 */
            danfossIconForcedHeatingCooling?: number;
            /** ID=0xff01 | type=UINT32 | manufacturerCode=SCHNEIDER_ELECTRIC(0x105e) | write=true | max=4294967295 */
            schneiderMeterStatus?: number;
            /** ID=0xff02 | type=UINT32 | manufacturerCode=SCHNEIDER_ELECTRIC(0x105e) | write=true | max=4294967295 */
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
                /** type=UINT32 | min=1 */
                transactionID: number;
                /** type=BITMAP8 */
                zigbeeInformation: number;
                /** type=BITMAP8 */
                touchlinkInformation: number;
            };
            /** ID=0x02 | response=3 | required=true */
            deviceInformation: {
                /** type=UINT32 | min=1 */
                transactionID: number;
                /** type=UINT8 */
                startIndex: number;
            };
            /** ID=0x06 | required=true */
            identifyRequest: {
                /** type=UINT32 | min=1 */
                transactionID: number;
                /** type=UINT16 | max=65535 | special=ExitIdentifyMode,0000,IdentifyForReceiverKnownTime,ffff */
                duration: number;
            };
            /** ID=0x07 | required=true */
            resetToFactoryNew: {
                /** type=UINT32 | min=1 */
                transactionID: number;
            };
            /** ID=0x10 | response=17 | required=true */
            networkStart: {
                /** type=UINT32 | min=1 */
                transactionID: number;
                /** type=IEEE_ADDR */
                extendedPANID: string;
                /** type=UINT8 | max=15 */
                keyIndex: number;
                /** type=SEC_KEY */
                encryptedNetworkKey: Buffer;
                /** type=UINT8 */
                logicalChannel: number;
                /** type=UINT16 | max=65534 */
                panID: number;
                /** type=UINT16 | min=1 | max=65527 */
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
                /** type=UINT32 | min=1 */
                transactionID: number;
                /** type=IEEE_ADDR */
                extendedPANID: string;
                /** type=UINT8 | max=15 */
                keyIndex: number;
                /** type=SEC_KEY */
                encryptedNetworkKey: Buffer;
                /** type=UINT8 */
                networkUpdateID: number;
                /** type=UINT8 */
                logicalChannel: number;
                /** type=UINT16 | min=1 | max=65534 */
                panID: number;
                /** type=UINT16 | min=1 | max=65527 */
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
                /** type=UINT32 | min=1 */
                transactionID: number;
                /** type=IEEE_ADDR */
                extendedPANID: string;
                /** type=UINT8 | max=15 */
                keyIndex: number;
                /** type=SEC_KEY */
                encryptedNetworkKey: Buffer;
                /** type=UINT8 */
                networkUpdateID: number;
                /** type=UINT8 */
                logicalChannel: number;
                /** type=UINT16 | min=1 | max=65534 */
                panID: number;
                /** type=UINT16 | min=1 | max=65527 */
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
                /** type=UINT32 | min=1 */
                transactionID: number;
                /** type=IEEE_ADDR */
                extendedPANID: string;
                /** type=UINT8 */
                networkUpdateID: number;
                /** type=UINT8 */
                logicalChannel: number;
                /** type=UINT16 | min=1 | max=65534 */
                panID: number;
                /** type=UINT16 | min=1 | max=65527 */
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
                /** type=UINT32 | min=1 */
                transactionID: number;
                /** type=UINT8 | min=0 | max=20 */
                rssiCorrection: number;
                /** type=BITMAP8 */
                zigbeeInformation: number;
                /** type=BITMAP8 */
                touchlinkInformation: number;
                /** type=BITMAP16 */
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
                /** type=UINT16 | min=1 | max=65527 */
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
                /** type=UINT32 | min=1 */
                transactionID: number;
                /** type=UINT8 */
                numberOfSubDevices: number;
                /** type=UINT8 */
                startIndex: number;
                /** type=UINT8 | max=5 */
                deviceInfoCount: number;
            };
            /** ID=0x11 | required=true */
            networkStart: {
                /** type=UINT32 | min=1 */
                transactionID: number;
                /** type=UINT8 */
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
                /** type=UINT32 | min=1 */
                transactionID: number;
                /** type=UINT8 */
                status: number;
            };
            /** ID=0x15 | required=true */
            networkJoinEndDevice: {
                /** type=UINT32 | min=1 */
                transactionID: number;
                /** type=UINT8 */
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
            };
            /** ID=0x42 */
            getEndpointList: {
                /** type=UINT8 */
                total: number;
                /** type=UINT8 */
                startIndex: number;
                /** type=UINT8 */
                count: number;
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
            /** ID=0x0031 | type=BITMAP16 | write=true */
            config: number;
        };
        commands: never;
        commandResponses: {
            /** ID=0x00 */
            hueNotification: {
                /** type=UINT8 | max=255 */
                button: number;
                /** type=UINT24 | max=16777215 */
                unknown1: number;
                /** type=UINT8 | max=255 */
                type: number;
                /** type=UINT8 | max=255 */
                unknown2: number;
                /** type=UINT8 | max=255 */
                time: number;
                /** type=UINT8 | max=255 */
                unknown3: number;
            };
        };
    };
    manuSpecificPhilips2: {
        attributes: {
            /** ID=0x0002 | type=OCTET_STR | write=true */
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
            /** ID=0x0002 | type=ENUM8 | write=true | max=255 */
            keypadLockout: number;
            /** ID=0x0004 | type=CHAR_STR | write=true */
            firmwareVersion: string;
            /** ID=0x0010 | type=INT16 | write=true | max=65535 */
            outdoorTempToDisplay: number;
            /** ID=0x0011 | type=UINT16 | write=true | max=65535 */
            outdoorTempToDisplayTimeout: number;
            /** ID=0x0012 | type=ENUM8 | write=true | max=255 */
            secondScreenBehavior: number;
            /** ID=0x0020 | type=UINT32 | write=true | max=4294967295 */
            currentTimeToDisplay: number;
            /** ID=0x0052 | type=UINT8 | write=true | max=255 */
            ledIntensityOn: number;
            /** ID=0x0053 | type=UINT8 | write=true | max=255 */
            ledIntensityOff: number;
            /** ID=0x0050 | type=UINT24 | write=true | max=16777215 */
            ledColorOn: number;
            /** ID=0x0051 | type=UINT24 | write=true | max=16777215 */
            ledColorOff: number;
            /** ID=0x0052 | type=UINT8 | write=true | max=255 */
            onLedIntensity: number;
            /** ID=0x0053 | type=UINT8 | write=true | max=255 */
            offLedIntensity: number;
            /** ID=0x0054 | type=ENUM8 | write=true | max=255 */
            actionReport: number;
            /** ID=0x0055 | type=UINT16 | write=true | max=65535 */
            minimumBrightness: number;
            /** ID=0x0060 | type=UINT16 | write=true | max=65535 */
            connectedLoadRM: number;
            /** ID=0x0070 | type=BITMAP8 | write=true */
            currentLoad: number;
            /** ID=0x0071 | type=INT8 | write=true | min=-128 | max=127 | default=-128 */
            ecoMode: number;
            /** ID=0x0072 | type=UINT8 | write=true | max=255 | default=255 */
            ecoMode1: number;
            /** ID=0x0073 | type=UINT8 | write=true | max=255 | default=255 */
            ecoMode2: number;
            /** ID=0x0075 | type=BITMAP32 | write=true | max=4294967295 */
            unknown: number;
            /** ID=0x0076 | type=UINT8 | write=true | max=255 */
            drConfigWaterTempMin: number;
            /** ID=0x0077 | type=UINT8 | write=true | max=255 | default=2 */
            drConfigWaterTempTime: number;
            /** ID=0x0078 | type=UINT16 | write=true | max=65535 */
            drWTTimeOn: number;
            /** ID=0x0080 | type=UINT32 | max=4294967295 */
            unknown1: number;
            /** ID=0x00a0 | type=UINT32 | write=true | max=4294967295 */
            dimmerTimmer: number;
            /** ID=0x0100 | type=UINT8 | max=255 */
            unknown2: number;
            /** ID=0x0105 | type=ENUM8 | write=true | max=255 */
            floorControlMode: number;
            /** ID=0x0106 | type=ENUM8 | write=true | max=255 */
            auxOutputMode: number;
            /** ID=0x0107 | type=INT16 | write=true | max=65535 */
            floorTemperature: number;
            /** ID=0x0108 | type=INT16 | write=true | max=65535 */
            ambiantMaxHeatSetpointLimit: number;
            /** ID=0x0109 | type=INT16 | write=true | max=65535 */
            floorMinHeatSetpointLimit: number;
            /** ID=0x010a | type=INT16 | write=true | max=65535 */
            floorMaxHeatSetpointLimit: number;
            /** ID=0x010b | type=ENUM8 | write=true | max=255 */
            temperatureSensor: number;
            /** ID=0x010c | type=ENUM8 | write=true | max=255 */
            floorLimitStatus: number;
            /** ID=0x010d | type=INT16 | write=true | max=65535 */
            roomTemperature: number;
            /** ID=0x0114 | type=ENUM8 | write=true | max=255 */
            timeFormatToDisplay: number;
            /** ID=0x0115 | type=ENUM8 | write=true | max=255 */
            GFCiStatus: number;
            /** ID=0x0118 | type=UINT16 | write=true | max=255 */
            auxConnectedLoad: number;
            /** ID=0x0119 | type=UINT16 | write=true | max=65535 */
            connectedLoad: number;
            /** ID=0x0128 | type=UINT8 | write=true | max=255 */
            pumpProtection: number;
            /** ID=0x012a | type=ENUM8 | write=true | max=255 | default=60 */
            unknown3: number;
            /** ID=0x012b | type=INT16 | write=true | max=65535 */
            currentSetpoint: number;
            /** ID=0x012d | type=INT16 | write=true | min=-32768 | max=32767 */
            reportLocalTemperature: number;
            /** ID=0x0240 | type=ARRAY | write=true */
            flowMeterConfig: ZclArray | unknown[];
            /** ID=0x0283 | type=UINT8 | write=true | max=255 */
            coldLoadPickupStatus: number;
        };
        commands: never;
        commandResponses: never;
    };
    manuSpecificTuya: {
        attributes: never;
        commands: {
            /** ID=0x00 */
            dataRequest: {
                /** type=UINT16 | max=65535 */
                seq: number;
                /** type=LIST_TUYA_DATAPOINT_VALUES */
                dpValues: TuyaDataPointValue[];
            };
            /** ID=0x03 */
            dataQuery: Record<string, never>;
            /** ID=0x10 */
            mcuVersionRequest: {
                /** type=UINT16 | max=65535 */
                seq: number;
            };
            /** ID=0x04 */
            sendData: {
                /** type=UINT16 | max=65535 */
                seq: number;
                /** type=LIST_TUYA_DATAPOINT_VALUES */
                dpValues: TuyaDataPointValue[];
            };
            /** ID=0x12 */
            mcuOtaNotify: {
                /** type=UINT16 | max=65535 */
                seq: number;
                /** type=UINT32 | max=4294967295 */
                key_hi: number;
                /** type=UINT32 | max=4294967295 */
                key_lo: number;
                /** type=UINT8 | max=255 */
                version: number;
                /** type=UINT32 | max=4294967295 */
                imageSize: number;
                /** type=UINT32 | max=4294967295 */
                crc: number;
            };
            /** ID=0x14 */
            mcuOtaBlockDataResponse: {
                /** type=UINT16 | max=65535 */
                seq: number;
                /** type=UINT8 | max=255 */
                status: number;
                /** type=UINT32 | max=4294967295 */
                key_hi: number;
                /** type=UINT32 | max=4294967295 */
                key_lo: number;
                /** type=UINT8 | max=255 */
                version: number;
                /** type=UINT32 | max=4294967295 */
                offset: number;
                /** type=LIST_UINT8 */
                imageData: number[];
            };
            /** ID=0x24 */
            mcuSyncTime: {
                /** type=UINT16 | max=65535 */
                payloadSize: number;
                /** type=LIST_UINT8 */
                payload: number[];
            };
            /** ID=0x25 */
            mcuGatewayConnectionStatus: {
                /** type=UINT16 | max=65535 */
                payloadSize: number;
                /** type=UINT8 | max=255 */
                payload: number;
            };
            /** ID=0x61 */
            tuyaWeatherSync: {
                /** type=BUFFER */
                payload: Buffer;
            };
        };
        commandResponses: {
            /** ID=0x01 */
            dataResponse: {
                /** type=UINT16 | max=65535 */
                seq: number;
                /** type=LIST_TUYA_DATAPOINT_VALUES */
                dpValues: TuyaDataPointValue[];
            };
            /** ID=0x02 */
            dataReport: {
                /** type=UINT16 | max=65535 */
                seq: number;
                /** type=LIST_TUYA_DATAPOINT_VALUES */
                dpValues: TuyaDataPointValue[];
            };
            /** ID=0x05 */
            activeStatusReportAlt: {
                /** type=UINT16 | max=65535 */
                seq: number;
                /** type=LIST_TUYA_DATAPOINT_VALUES */
                dpValues: TuyaDataPointValue[];
            };
            /** ID=0x06 */
            activeStatusReport: {
                /** type=UINT16 | max=65535 */
                seq: number;
                /** type=LIST_TUYA_DATAPOINT_VALUES */
                dpValues: TuyaDataPointValue[];
            };
            /** ID=0x11 */
            mcuVersionResponse: {
                /** type=UINT16 | max=65535 */
                seq: number;
                /** type=UINT8 | max=255 */
                version: number;
            };
            /** ID=0x13 */
            mcuOtaBlockDataRequest: {
                /** type=UINT16 | max=65535 */
                seq: number;
                /** type=UINT32 | max=4294967295 */
                key_hi: number;
                /** type=UINT32 | max=4294967295 */
                key_lo: number;
                /** type=UINT8 | max=255 */
                version: number;
                /** type=UINT32 | max=4294967295 */
                offset: number;
                /** type=UINT32 | max=4294967295 */
                size: number;
            };
            /** ID=0x15 */
            mcuOtaResult: {
                /** type=UINT16 | max=65535 */
                seq: number;
                /** type=UINT8 | max=255 */
                status: number;
                /** type=UINT32 | max=4294967295 */
                key_hi: number;
                /** type=UINT32 | max=4294967295 */
                key_lo: number;
                /** type=UINT8 | max=255 */
                version: number;
            };
            /** ID=0x24 */
            mcuSyncTime: {
                /** type=UINT16 | max=65535 */
                payloadSize: number;
            };
            /** ID=0x25 */
            mcuGatewayConnectionStatus: {
                /** type=UINT16 | max=65535 */
                payloadSize: number;
            };
            /** ID=0x60 */
            tuyaWeatherRequest: {
                /** type=BUFFER */
                payload: Buffer;
            };
        };
    };
    manuSpecificLumi: {
        attributes: {
            /** ID=0x0009 | type=UINT8 | write=true | max=255 */
            mode: number;
            /** ID=0x0112 | type=UINT32 | write=true | max=4294967295 */
            illuminance: number;
            /** ID=0x0114 | type=UINT8 | write=true | max=255 */
            displayUnit: number;
            /** ID=0x0129 | type=UINT8 | write=true | max=255 */
            airQuality: number;
            /** ID=0x0400 | type=BOOLEAN | write=true */
            curtainReverse: number;
            /** ID=0x0401 | type=BOOLEAN | write=true */
            curtainHandOpen: number;
            /** ID=0x0402 | type=BOOLEAN | write=true */
            curtainCalibrated: number;
        };
        commands: never;
        commandResponses: never;
    };
    manuSpecificTuya2: {
        attributes: {
            /** ID=0xd00a | type=INT16 | write=true | min=-32768 | max=32767 */
            alarm_temperature_max: number;
            /** ID=0xd00b | type=INT16 | write=true | min=-32768 | max=32767 */
            alarm_temperature_min: number;
            /** ID=0xd00d | type=INT16 | write=true | min=-32768 | max=32767 */
            alarm_humidity_max: number;
            /** ID=0xd00e | type=INT16 | write=true | min=-32768 | max=32767 */
            alarm_humidity_min: number;
            /** ID=0xd00f | type=ENUM8 | write=true | max=255 */
            alarm_humidity: number;
            /** ID=0xd006 | type=ENUM8 | write=true | max=255 */
            alarm_temperature: number;
            /** ID=0xd010 | type=UINT8 | write=true | max=255 */
            unknown: number;
        };
        commands: never;
        commandResponses: never;
    };
    manuSpecificTuya3: {
        attributes: {
            /** ID=0xd010 | type=ENUM8 | write=true | max=255 */
            powerOnBehavior: number;
            /** ID=0xd020 | type=ENUM8 | write=true | max=255 */
            switchMode: number;
            /** ID=0xd030 | type=ENUM8 | write=true | max=255 */
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
            /** ID=0x0000 | type=UINT16 | write=true | max=65535 */
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
            /** ID=0x0000 | type=UINT8 | write=true | max=255 */
            motion_threshold_multiplier: number;
            /** ID=0x0002 | type=UINT16 | write=true | max=65535 */
            motion_threshold: number;
            /** ID=0x0010 | type=BITMAP8 | write=true | max=255 */
            acceleration: number;
            /** ID=0x0012 | type=INT16 | write=true | min=-32768 | max=32767 */
            x_axis: number;
            /** ID=0x0013 | type=INT16 | write=true | min=-32768 | max=32767 */
            y_axis: number;
            /** ID=0x0014 | type=INT16 | write=true | min=-32768 | max=32767 */
            z_axis: number;
        };
        commands: never;
        commandResponses: never;
    };
    tradfriButton: {
        attributes: never;
        commands: {
            /** ID=0x01 */
            action1: {
                /** type=UINT8 | max=255 */
                data: number;
            };
            /** ID=0x02 */
            action2: {
                /** type=UINT8 | max=255 */
                data: number;
            };
            /** ID=0x03 */
            action3: {
                /** type=UINT8 | max=255 */
                data: number;
            };
            /** ID=0x04 */
            action4: {
                /** type=UINT8 | max=255 */
                data: number;
            };
            /** ID=0x06 */
            action6: {
                /** type=UINT8 | max=255 */
                data: number;
            };
        };
        commandResponses: never;
    };
    sprutVoc: {
        attributes: {
            /** ID=0x6600 | type=UINT16 | write=true | max=65535 */
            voc: number;
        };
        commands: never;
        commandResponses: never;
    };
    sprutNoise: {
        attributes: {
            /** ID=0x6600 | type=SINGLE_PREC | write=true */
            noise: number;
            /** ID=0x6601 | type=BITMAP8 | write=true */
            noiseDetected: number;
            /** ID=0x6602 | type=SINGLE_PREC | write=true */
            noiseDetectLevel: number;
            /** ID=0x6603 | type=UINT16 | write=true | max=65535 */
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
                /** type=UINT8 | max=255 */
                param: number;
            };
            /** ID=0x01 */
            learnStart: {
                /** type=UINT8 | max=255 */
                value: number;
            };
            /** ID=0x02 */
            learnStop: {
                /** type=UINT8 | max=255 */
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
            /** ID=0x0008 | type=UINT32 | write=true | max=4294967295 */
            buttonEvent: number;
        };
        commands: {
            /** ID=0x02 */
            siglisZigfredButtonEvent: {
                /** type=UINT8 | max=255 */
                button: number;
                /** type=UINT8 | max=255 */
                type: number;
                /** type=UINT16 | max=65535 */
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
                /** type=UINT16 | max=65535 */
                seq: number;
                /** type=UINT32 | max=4294967295 */
                length: number;
                /** type=UINT32 | max=4294967295 */
                unk1: number;
                /** type=UINT16 | max=65535 */
                unk2: number;
                /** type=UINT8 | max=255 */
                unk3: number;
                /** type=UINT8 | max=255 */
                cmd: number;
                /** type=UINT16 | max=65535 */
                unk4: number;
            };
            /** ID=0x01 */
            zosungSendIRCode01: {
                /** type=UINT8 | max=255 */
                zero: number;
                /** type=UINT16 | max=65535 */
                seq: number;
                /** type=UINT32 | max=4294967295 */
                length: number;
                /** type=UINT32 | max=4294967295 */
                unk1: number;
                /** type=UINT16 | max=65535 */
                unk2: number;
                /** type=UINT8 | max=255 */
                unk3: number;
                /** type=UINT8 | max=255 */
                cmd: number;
                /** type=UINT16 | max=65535 */
                unk4: number;
            };
            /** ID=0x02 */
            zosungSendIRCode02: {
                /** type=UINT16 | max=65535 */
                seq: number;
                /** type=UINT32 | max=4294967295 */
                position: number;
                /** type=UINT8 | max=255 */
                maxlen: number;
            };
            /** ID=0x03 */
            zosungSendIRCode03: {
                /** type=UINT8 | max=255 */
                zero: number;
                /** type=UINT16 | max=65535 */
                seq: number;
                /** type=UINT32 | max=4294967295 */
                position: number;
                /** type=OCTET_STR */
                msgpart: Buffer;
                /** type=UINT8 | max=255 */
                msgpartcrc: number;
            };
            /** ID=0x04 */
            zosungSendIRCode04: {
                /** type=UINT8 | max=255 */
                zero0: number;
                /** type=UINT16 | max=65535 */
                seq: number;
                /** type=UINT16 | max=65535 */
                zero1: number;
            };
            /** ID=0x05 */
            zosungSendIRCode05: {
                /** type=UINT16 | max=65535 */
                seq: number;
                /** type=UINT16 | max=65535 */
                zero: number;
            };
        };
        commandResponses: {
            /** ID=0x03 */
            zosungSendIRCode03Resp: {
                /** type=UINT8 | max=255 */
                zero: number;
                /** type=UINT16 | max=65535 */
                seq: number;
                /** type=UINT32 | max=4294967295 */
                position: number;
                /** type=OCTET_STR */
                msgpart: Buffer;
                /** type=UINT8 | max=255 */
                msgpartcrc: number;
            };
            /** ID=0x05 */
            zosungSendIRCode05Resp: {
                /** type=UINT16 | max=65535 */
                seq: number;
                /** type=UINT16 | max=65535 */
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
            /** ID=0x0012 | type=UINT8 | write=true | max=255 */
            autoLockTime: number;
            /** ID=0x0013 | type=UINT8 | write=true | max=255 */
            wrongCodeAttempts: number;
            /** ID=0x0014 | type=UINT8 | write=true | max=255 */
            shutdownTime: number;
            /** ID=0x0015 | type=UINT8 | write=true | max=255 */
            batteryLevel: number;
            /** ID=0x0016 | type=UINT8 | write=true | max=255 */
            insideEscutcheonLED: number;
            /** ID=0x0017 | type=UINT8 | write=true | max=255 */
            volume: number;
            /** ID=0x0018 | type=UINT8 | write=true | max=255 */
            lockMode: number;
            /** ID=0x0019 | type=UINT8 | write=true | max=255 */
            language: number;
            /** ID=0x001a | type=BOOLEAN | write=true */
            allCodesLockout: number;
            /** ID=0x001b | type=BOOLEAN | write=true */
            oneTouchLocking: number;
            /** ID=0x001c | type=BOOLEAN | write=true */
            privacyButtonSetting: number;
            /** ID=0x0021 | type=UINT16 | write=true | max=65535 */
            numberLogRecordsSupported: number;
            /** ID=0x0030 | type=UINT8 | write=true | max=255 */
            numberPinsSupported: number;
            /** ID=0x0040 | type=UINT8 | write=true | max=255 */
            numberScheduleSlotsPerUser: number;
            /** ID=0x0050 | type=UINT8 | write=true | max=255 */
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
                /** type=UINT8 | max=255 */
                status: number;
            };
            /** ID=0x01 */
            reflashRsp: {
                /** type=UINT8 | max=255 */
                status: number;
            };
            /** ID=0x02 */
            reflashDataRsp: {
                /** type=UINT8 | max=255 */
                status: number;
            };
            /** ID=0x03 */
            reflashStatusRsp: {
                /** type=UINT8 | max=255 */
                status: number;
            };
        };
    };
    manuSpecificProfalux1: {
        attributes: {
            /** ID=0x0000 | type=UINT8 | write=true | max=255 */
            motorCoverType: number;
        };
        commands: never;
        commandResponses: never;
    };
    manuSpecificAmazonWWAH: {
        attributes: {
            /** ID=0x0002 | type=BOOLEAN | write=true */
            disableOTADowngrades: number;
            /** ID=0x0003 | type=BOOLEAN | write=true */
            mgmtLeaveWithoutRejoinEnabled: number;
            /** ID=0x0004 | type=UINT8 | write=true | max=255 */
            nwkRetryCount: number;
            /** ID=0x0005 | type=UINT8 | write=true | max=255 */
            macRetryCount: number;
            /** ID=0x0006 | type=BOOLEAN | write=true */
            routerCheckInEnabled: number;
            /** ID=0x0007 | type=BOOLEAN | write=true */
            touchlinkInterpanEnabled: number;
            /** ID=0x0008 | type=BOOLEAN | write=true */
            wwahParentClassificationEnabled: number;
            /** ID=0x0009 | type=BOOLEAN | write=true */
            wwahAppEventRetryEnabled: number;
            /** ID=0x000a | type=UINT8 | write=true | max=255 */
            wwahAppEventRetryQueueSize: number;
            /** ID=0x000b | type=BOOLEAN | write=true */
            wwahRejoinEnabled: number;
            /** ID=0x000c | type=UINT8 | write=true | max=255 */
            macPollFailureWaitTime: number;
            /** ID=0x000d | type=BOOLEAN | write=true */
            configurationModeEnabled: number;
            /** ID=0x000e | type=UINT8 | write=true | max=255 */
            currentDebugReportID: number;
            /** ID=0x000f | type=BOOLEAN | write=true */
            tcSecurityOnNwkKeyRotationEnabled: number;
            /** ID=0x0010 | type=BOOLEAN | write=true */
            wwahBadParentRecoveryEnabled: number;
            /** ID=0x0011 | type=UINT8 | write=true | max=255 */
            pendingNetworkUpdateChannel: number;
            /** ID=0x0012 | type=UINT16 | write=true | max=65535 */
            pendingNetworkUpdatePANID: number;
            /** ID=0x0013 | type=UINT16 | write=true | max=65535 */
            otaMaxOfflineDuration: number;
            /** ID=0xfffd | type=UINT16 | write=true | max=65535 */
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
        /** Type: DATA16 */
        attrId: number;
    }[];
    /** ID: 1 */
    readRsp: {
        /** Type: DATA16 */
        attrId: number;
        /** Type: DATA8 */
        status: number;
        /** Type: DATA8 conditions=[{fieldEquals field=status value=0}] */
        dataType?: number;
        /** Type: USE_DATA_TYPE conditions=[{fieldEquals field=status value=0}] */
        attrData?: unknown;
    }[];
    /** ID: 2 */
    write: {
        /** Type: DATA16 */
        attrId: number;
        /** Type: DATA8 */
        dataType: number;
        /** Type: USE_DATA_TYPE */
        attrData: unknown;
    }[];
    /** ID: 3 */
    writeUndiv: {
        /** Type: DATA16 */
        attrId: number;
        /** Type: DATA8 */
        dataType: number;
        /** Type: USE_DATA_TYPE */
        attrData: unknown;
    }[];
    /** ID: 4 */
    writeRsp: {
        /** Type: ENUM8 */
        status: number;
        /** Type: DATA16 conditions=[{fieldEquals field=status reversed=true value=0}] */
        attrId?: number;
    }[];
    /** ID: 5 */
    writeNoRsp: {
        /** Type: DATA16 */
        attrId: number;
        /** Type: DATA8 */
        dataType: number;
        /** Type: USE_DATA_TYPE */
        attrData: unknown;
    }[];
    /** ID: 6 */
    configReport: {
        /** Type: DATA8 */
        direction: number;
        /** Type: DATA16 */
        attrId: number;
        /** Type: DATA8 conditions=[{fieldEquals field=direction value=0}] */
        dataType?: number;
        /** Type: DATA16 conditions=[{fieldEquals field=direction value=0}] */
        minRepIntval?: number;
        /** Type: DATA16 conditions=[{fieldEquals field=direction value=0}] */
        maxRepIntval?: number;
        /** Type: USE_DATA_TYPE conditions=[{fieldEquals field=direction value=0}{dataTypeValueTypeEquals value=ANALOG}] */
        repChange?: unknown;
        /** Type: DATA16 conditions=[{fieldEquals field=direction value=1}] */
        timeout?: number;
    }[];
    /** ID: 7 */
    configReportRsp: {
        /** Type: ENUM8 */
        status: number;
        /** Type: DATA8 conditions=[{minimumRemainingBufferBytes value=3}] */
        direction?: number;
        /** Type: DATA16 conditions=[{minimumRemainingBufferBytes value=2}] */
        attrId?: number;
    }[];
    /** ID: 8 */
    readReportConfig: {
        /** Type: DATA8 */
        direction: number;
        /** Type: DATA16 */
        attrId: number;
    }[];
    /** ID: 9 */
    readReportConfigRsp: {
        /** Type: ENUM8 */
        status: number;
        /** Type: DATA8 */
        direction: number;
        /** Type: DATA16 */
        attrId: number;
        /** Type: DATA8 conditions=[{fieldEquals field=status value=0}{fieldEquals field=direction value=0}] */
        dataType?: number;
        /** Type: DATA16 conditions=[{fieldEquals field=status value=0}{fieldEquals field=direction value=0}] */
        minRepIntval?: number;
        /** Type: DATA16 conditions=[{fieldEquals field=status value=0}{fieldEquals field=direction value=0}] */
        maxRepIntval?: number;
        /** Type: USE_DATA_TYPE conditions=[{fieldEquals field=status value=0}{fieldEquals field=direction value=0}{dataTypeValueTypeEquals value=ANALOG}] */
        repChange?: unknown;
        /** Type: DATA16 conditions=[{fieldEquals field=status value=0}{fieldEquals field=direction value=1}] */
        timeout?: number;
    }[];
    /** ID: 10 */
    report: {
        /** Type: DATA16 */
        attrId: number;
        /** Type: DATA8 */
        dataType: number;
        /** Type: USE_DATA_TYPE */
        attrData: unknown;
    }[];
    /** ID: 11 */
    defaultRsp: {
        /** Type: DATA8 */
        cmdId: number;
        /** Type: ENUM8 */
        statusCode: number;
    };
    /** ID: 12 */
    discover: {
        /** Type: DATA16 */
        startAttrId: number;
        /** Type: DATA8 */
        maxAttrIds: number;
    };
    /** ID: 13 */
    discoverRsp: {
        /** Type: UINT8 */
        discComplete: number;
        attrInfos: {
            /** Type: DATA16 */
            attrId: number;
            /** Type: DATA8 */
            dataType: number;
        }[];
    };
    /** ID: 14 */
    readStructured: {
        /** Type: DATA16 */
        attrId: number;
        /** Type: STRUCTURED_SELECTOR */
        selector: StructuredSelector;
    }[];
    /** ID: 15 */
    writeStructured: {
        /** Type: DATA16 */
        attrId: number;
        /** Type: STRUCTURED_SELECTOR */
        selector: StructuredSelector;
        /** Type: DATA8 */
        dataType: number;
        /** Type: USE_DATA_TYPE */
        elementData: unknown;
    }[];
    /** ID: 16 */
    writeStructuredRsp: {
        /** Type: ENUM8 */
        status: number;
        /** Type: DATA16 conditions=[{fieldEquals field=status reversed=true value=0}] */
        attrId?: number;
        /** Type: STRUCTURED_SELECTOR conditions=[{fieldEquals field=status reversed=true value=0}] */
        selector?: StructuredSelector;
    }[];
    /** ID: 17 */
    discoverCommands: {
        /** Type: DATA8 */
        startCmdId: number;
        /** Type: DATA8 */
        maxCmdIds: number;
    };
    /** ID: 18 */
    discoverCommandsRsp: {
        /** Type: UINT8 */
        discComplete: number;
        attrInfos: {
            /** Type: DATA8 */
            cmdId: number;
        }[];
    };
    /** ID: 19 */
    discoverCommandsGen: {
        /** Type: DATA8 */
        startCmdId: number;
        /** Type: DATA8 */
        maxCmdIds: number;
    };
    /** ID: 20 */
    discoverCommandsGenRsp: {
        /** Type: UINT8 */
        discComplete: number;
        attrInfos: {
            /** Type: DATA8 */
            cmdId: number;
        }[];
    };
    /** ID: 21 */
    discoverExt: {
        /** Type: DATA16 */
        startAttrId: number;
        /** Type: DATA8 */
        maxAttrIds: number;
    };
    /** ID: 22 */
    discoverExtRsp: {
        /** Type: UINT8 */
        discComplete: number;
        attrInfos: {
            /** Type: DATA16 */
            attrId: number;
            /** Type: DATA8 */
            dataType: number;
            /** Type: DATA8 */
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
