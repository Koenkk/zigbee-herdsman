/* eslint max-len: 0 */
import DataType from './dataType';
import {ParameterDefinition} from './tstype';
import BuffaloZclDataType from './buffaloZclDataType';
import ManufacturerCode from './manufacturerCode';

interface AttributeDefinition {
    ID: number;
    type: DataType;
    manufacturerCode?: number;
}

interface ClusterDefinition {
    ID: number;
    manufacturerCode?: number;
    attributes: {[s: string]: AttributeDefinition};
    commands: {
        [s: string]: CommandDefinition;
    };
    commandsResponse: {
        [s: string]: CommandDefinition;
    };
}

interface CommandDefinition {
    ID: number;
    parameters: ParameterDefinition[];
    response?: number;
}

const Cluster: {
    [s: string]: ClusterDefinition;
}
= {
    genBasic: {
        ID: 0,
        attributes: {
            zclVersion: {ID: 0, type: DataType.uint8},
            appVersion: {ID: 1, type: DataType.uint8},
            stackVersion: {ID: 2, type: DataType.uint8},
            hwVersion: {ID: 3, type: DataType.uint8},
            manufacturerName: {ID: 4, type: DataType.charStr},
            modelId: {ID: 5, type: DataType.charStr},
            dateCode: {ID: 6, type: DataType.charStr},
            powerSource: {ID: 7, type: DataType.enum8},
            appProfileVersion: {ID: 8, type: DataType.enum8},
            swBuildId: {ID: 16384, type: DataType.charStr},
            locationDesc: {ID: 16, type: DataType.charStr},
            physicalEnv: {ID: 17, type: DataType.enum8},
            deviceEnabled: {ID: 18, type: DataType.boolean},
            alarmMask: {ID: 19, type: DataType.bitmap8},
            disableLocalConfig: {ID: 20, type: DataType.bitmap8},
        },
        commands: {
            resetFactDefault: {
                ID: 0,
                parameters: [
                ],
            },
            tuyaSetup: {
                ID: 0xf0,
                parameters: [
                ],
            },
        },
        commandsResponse: {
        },
    },
    genPowerCfg: {
        ID: 1,
        attributes: {
            mainsVoltage: {ID: 0, type: DataType.uint16},
            mainsFrequency: {ID: 1, type: DataType.uint8},
            mainsAlarmMask: {ID: 16, type: DataType.bitmap8},
            mainsVoltMinThres: {ID: 17, type: DataType.uint16},
            mainsVoltMaxThres: {ID: 18, type: DataType.uint16},
            mainsVoltageDwellTripPoint: {ID: 19, type: DataType.uint16},
            batteryVoltage: {ID: 32, type: DataType.uint8},
            batteryPercentageRemaining: {ID: 33, type: DataType.uint8},
            batteryManufacturer: {ID: 48, type: DataType.charStr},
            batterySize: {ID: 49, type: DataType.enum8},
            batteryAHrRating: {ID: 50, type: DataType.uint16},
            batteryQuantity: {ID: 51, type: DataType.uint8},
            batteryRatedVoltage: {ID: 52, type: DataType.uint8},
            batteryAlarmMask: {ID: 53, type: DataType.bitmap8},
            batteryVoltMinThres: {ID: 54, type: DataType.uint8},
            batteryVoltThres1: {ID: 55, type: DataType.uint8},
            batteryVoltThres2: {ID: 56, type: DataType.uint8},
            batteryVoltThres3: {ID: 57, type: DataType.uint8},
            batteryPercentMinThres: {ID: 58, type: DataType.uint8},
            batteryPercentThres1: {ID: 59, type: DataType.uint8},
            batteryPercentThres2: {ID: 60, type: DataType.uint8},
            batteryPercentThres3: {ID: 61, type: DataType.uint8},
            batteryAlarmState: {ID: 62, type: DataType.bitmap32},
        },
        commands: {
        },
        commandsResponse: {
        },
    },
    genDeviceTempCfg: {
        ID: 2,
        attributes: {
            currentTemperature: {ID: 0, type: DataType.int16},
            minTempExperienced: {ID: 1, type: DataType.int16},
            maxTempExperienced: {ID: 2, type: DataType.int16},
            overTempTotalDwell: {ID: 3, type: DataType.uint16},
            devTempAlarmMask: {ID: 16, type: DataType.bitmap8},
            lowTempThres: {ID: 17, type: DataType.int16},
            highTempThres: {ID: 18, type: DataType.int16},
            lowTempDwellTripPoint: {ID: 19, type: DataType.uint24},
            highTempDwellTripPoint: {ID: 20, type: DataType.uint24},
        },
        commands: {
        },
        commandsResponse: {
        },
    },
    genIdentify: {
        ID: 3,
        attributes: {
            identifyTime: {ID: 0, type: DataType.uint16},
            identifyCommissionState: {ID: 1, type: DataType.unknown},
        },
        commands: {
            identify: {
                ID: 0,
                parameters: [
                    {name: 'identifytime', type: DataType.uint16},
                ],
            },
            identifyQuery: {
                ID: 1,
                parameters: [
                ],
            },
            ezmodeInvoke: {
                ID: 2,
                parameters: [
                    {name: 'action', type: DataType.uint8},
                ],
            },
            updateCommissionState: {
                ID: 3,
                parameters: [
                    {name: 'action', type: DataType.uint8},
                    {name: 'commstatemask', type: DataType.uint8},
                ],
            },
            triggerEffect: {
                ID: 64,
                parameters: [
                    {name: 'effectid', type: DataType.uint8},
                    {name: 'effectvariant', type: DataType.uint8},
                ],
            },
        },
        commandsResponse: {
            identifyQueryRsp: {
                ID: 0,
                parameters: [
                    {name: 'timeout', type: DataType.uint16},
                ],
            },
        },
    },
    genGroups: {
        ID: 4,
        attributes: {
            nameSupport: {ID: 0, type: DataType.bitmap8},
        },
        commands: {
            add: {
                ID: 0,
                response: 0,
                parameters: [
                    {name: 'groupid', type: DataType.uint16},
                    {name: 'groupname', type: DataType.charStr},
                ],
            },
            view: {
                ID: 1,
                parameters: [
                    {name: 'groupid', type: DataType.uint16},
                ],
            },
            getMembership: {
                ID: 2,
                response: 2,
                parameters: [
                    {name: 'groupcount', type: DataType.uint8},
                    {name: 'grouplist', type: BuffaloZclDataType.LIST_UINT16},
                ],
            },
            remove: {
                ID: 3,
                response: 3,
                parameters: [
                    {name: 'groupid', type: DataType.uint16},
                ],
            },
            removeAll: {
                ID: 4,
                parameters: [
                ],
            },
            addIfIdentifying: {
                ID: 5,
                parameters: [
                    {name: 'groupid', type: DataType.uint16},
                    {name: 'groupname', type: DataType.charStr},
                ],
            },
        },
        commandsResponse: {
            addRsp: {
                ID: 0,
                parameters: [
                    {name: 'status', type: DataType.uint8},
                    {name: 'groupid', type: DataType.uint16},
                ],
            },
            viewRsp: {
                ID: 1,
                parameters: [
                    {name: 'status', type: DataType.uint8},
                    {name: 'groupid', type: DataType.uint16},
                    {name: 'groupname', type: DataType.charStr},
                ],
            },
            getMembershipRsp: {
                ID: 2,
                parameters: [
                    {name: 'capacity', type: DataType.uint8},
                    {name: 'groupcount', type: DataType.uint8},
                    {name: 'grouplist', type: BuffaloZclDataType.LIST_UINT16},
                ],
            },
            removeRsp: {
                ID: 3,
                parameters: [
                    {name: 'status', type: DataType.uint8},
                    {name: 'groupid', type: DataType.uint16},
                ],
            },
        },
    },
    genScenes: {
        ID: 5,
        attributes: {
            count: {ID: 0, type: DataType.uint8},
            currentScene: {ID: 1, type: DataType.uint8},
            currentGroup: {ID: 2, type: DataType.uint16},
            sceneValid: {ID: 3, type: DataType.boolean},
            nameSupport: {ID: 4, type: DataType.bitmap8},
            lastCfgBy: {ID: 5, type: DataType.ieeeAddr},
        },
        commands: {
            add: {
                ID: 0,
                response: 0,
                parameters: [
                    {name: 'groupid', type: DataType.uint16},
                    {name: 'sceneid', type: DataType.uint8},
                    {name: 'transtime', type: DataType.uint16},
                    {name: 'scenename', type: DataType.charStr},
                    {name: 'extensionfieldsets', type: BuffaloZclDataType.EXTENSION_FIELD_SETS},
                ],
            },
            view: {
                ID: 1,
                response: 1,
                parameters: [
                    {name: 'groupid', type: DataType.uint16},
                    {name: 'sceneid', type: DataType.uint8},
                ],
            },
            remove: {
                ID: 2,
                response: 2,
                parameters: [
                    {name: 'groupid', type: DataType.uint16},
                    {name: 'sceneid', type: DataType.uint8},
                ],
            },
            removeAll: {
                ID: 3,
                response: 3,
                parameters: [
                    {name: 'groupid', type: DataType.uint16},
                ],
            },
            store: {
                ID: 4,
                response: 4,
                parameters: [
                    {name: 'groupid', type: DataType.uint16},
                    {name: 'sceneid', type: DataType.uint8},
                ],
            },
            recall: {
                ID: 5,
                parameters: [
                    {name: 'groupid', type: DataType.uint16},
                    {name: 'sceneid', type: DataType.uint8},
                ],
            },
            getSceneMembership: {
                ID: 6,
                response: 6,
                parameters: [
                    {name: 'groupid', type: DataType.uint16},
                ],
            },
            enhancedAdd: {
                ID: 64,
                response: 64,
                parameters: [
                    {name: 'groupid', type: DataType.uint16},
                    {name: 'sceneid', type: DataType.uint8},
                    {name: 'transtime', type: DataType.uint16},
                    {name: 'scenename', type: DataType.charStr},
                    {name: 'extensionfieldsets', type: BuffaloZclDataType.EXTENSION_FIELD_SETS},
                ],
            },
            enhancedView: {
                ID: 65,
                response: 65,
                parameters: [
                    {name: 'groupid', type: DataType.uint16},
                    {name: 'sceneid', type: DataType.uint8},
                ],
            },
            copy: {
                ID: 66,
                response: 66,
                parameters: [
                    {name: 'mode', type: DataType.uint8},
                    {name: 'groupidfrom', type: DataType.uint16},
                    {name: 'sceneidfrom', type: DataType.uint8},
                    {name: 'groupidto', type: DataType.uint16},
                    {name: 'sceneidto', type: DataType.uint8},
                ],
            },
            tradfriArrowSingle: {
                ID: 7,
                parameters: [
                    {name: 'value', type: DataType.uint16},
                    {name: 'value2', type: DataType.uint16},
                ],
            },
            tradfriArrowHold: {
                ID: 8,
                parameters: [
                    {name: 'value', type: DataType.uint16},
                ],
            },
            tradfriArrowRelease: {
                ID: 9,
                parameters: [
                    {name: 'value', type: DataType.uint16},
                ],
            },
        },
        commandsResponse: {
            addRsp: {
                ID: 0,
                parameters: [
                    {name: 'status', type: DataType.uint8},
                    {name: 'groupId', type: DataType.uint16},
                    {name: 'sceneId', type: DataType.uint8},
                ],
            },
            viewRsp: {
                ID: 1,
                parameters: [
                    {name: 'status', type: DataType.uint8},
                    {name: 'groupid', type: DataType.uint16},
                    {name: 'sceneid', type: DataType.uint8},
                    {name: 'transtime', type: DataType.uint16},
                    {name: 'scenename', type: DataType.charStr},
                    {name: 'extensionfieldsets', type: BuffaloZclDataType.EXTENSION_FIELD_SETS},
                ],
            },
            removeRsp: {
                ID: 2,
                parameters: [
                    {name: 'status', type: DataType.uint8},
                    {name: 'groupid', type: DataType.uint16},
                    {name: 'sceneid', type: DataType.uint8},
                ],
            },
            removeAllRsp: {
                ID: 3,
                parameters: [
                    {name: 'status', type: DataType.uint8},
                    {name: 'groupid', type: DataType.uint16},
                ],
            },
            storeRsp: {
                ID: 4,
                parameters: [
                    {name: 'status', type: DataType.uint8},
                    {name: 'groupid', type: DataType.uint16},
                    {name: 'sceneid', type: DataType.uint8},
                ],
            },
            getSceneMembershipRsp: {
                ID: 6,
                parameters: [
                    {name: 'status', type: DataType.uint8},
                    {name: 'capacity', type: DataType.uint8},
                    {name: 'groupid', type: DataType.uint16},
                    {name: 'scenecount', type: DataType.uint8},
                    {name: 'scenelist', type: BuffaloZclDataType.LIST_UINT8},
                ],
            },
            enhancedAddRsp: {
                ID: 64,
                parameters: [
                ],
            },
            enhancedViewRsp: {
                ID: 65,
                parameters: [
                    {name: 'status', type: DataType.uint8},
                    {name: 'groupid', type: DataType.uint16},
                    {name: 'sceneid', type: DataType.uint8},
                    {name: 'transtime', type: DataType.uint16},
                    {name: 'scenename', type: DataType.charStr},
                    {name: 'extensionfieldsets', type: BuffaloZclDataType.EXTENSION_FIELD_SETS},
                ],
            },
            copyRsp: {
                ID: 66,
                parameters: [
                    {name: 'status', type: DataType.uint8},
                    {name: 'groupidfrom', type: DataType.uint16},
                    {name: 'sceneidfrom', type: DataType.uint8},
                ],
            },
        },
    },
    genOnOff: {
        ID: 6,
        attributes: {
            onOff: {ID: 0, type: DataType.boolean},
            globalSceneCtrl: {ID: 16384, type: DataType.boolean},
            onTime: {ID: 16385, type: DataType.uint16},
            offWaitTime: {ID: 16386, type: DataType.uint16},
            startUpOnOff: {ID: 16387, type: DataType.enum8},
            tuyaBacklightMode: {ID: 0x8001, type: DataType.enum8},
            moesStartUpOnOff: {ID: 0x8002, type: DataType.enum8},
            tuyaOperationMode: {ID: 0x8004, type: DataType.enum8},
            elkoPreWarningTime: {ID: 0xE000, type: DataType.uint16, manufacturerCode: ManufacturerCode.ELKO},
            elkoOnTimeReload: {ID: 0xE001, type: DataType.uint32, manufacturerCode: ManufacturerCode.ELKO},
            elkoOnTimeReloadOptions: {ID: 0xE002, type: DataType.bitmap8, manufacturerCode: ManufacturerCode.ELKO},
        },
        commands: {
            off: {
                ID: 0,
                parameters: [
                ],
            },
            on: {
                ID: 1,
                parameters: [
                ],
            },
            toggle: {
                ID: 2,
                parameters: [
                ],
            },
            offWithEffect: {
                ID: 64,
                parameters: [
                    {name: 'effectid', type: DataType.uint8},
                    {name: 'effectvariant', type: DataType.uint8},
                ],
            },
            onWithRecallGlobalScene: {
                ID: 65,
                parameters: [
                ],
            },
            onWithTimedOff: {
                ID: 66,
                parameters: [
                    {name: 'ctrlbits', type: DataType.uint8},
                    {name: 'ontime', type: DataType.uint16},
                    {name: 'offwaittime', type: DataType.uint16},
                ],
            },
        },
        commandsResponse: {
        },
    },
    genOnOffSwitchCfg: {
        ID: 7,
        attributes: {
            switchType: {ID: 0, type: DataType.enum8},
            switchMultiFunction: {ID: 2, type: DataType.unknown},
            switchActions: {ID: 16, type: DataType.enum8},
        },
        commands: {
        },
        commandsResponse: {
        },
    },
    genLevelCtrl: {
        ID: 8,
        attributes: {
            currentLevel: {ID: 0, type: DataType.uint8},
            remainingTime: {ID: 1, type: DataType.uint16},
            minLevel: {ID: 2, type: DataType.uint8},
            maxLevel: {ID: 3, type: DataType.uint8},
            onOffTransitionTime: {ID: 16, type: DataType.uint16},
            onLevel: {ID: 17, type: DataType.uint8},
            onTransitionTime: {ID: 18, type: DataType.uint16},
            offTransitionTime: {ID: 19, type: DataType.uint16},
            defaultMoveRate: {ID: 20, type: DataType.uint16},
            startUpCurrentLevel: {ID: 16384, type: DataType.uint8},
            elkoStartUpCurrentLevel: {ID: 0x4000, type: DataType.uint8, manufacturerCode: ManufacturerCode.ELKO},
            ubisysMinimumOnLevel: {ID: 0, type: DataType.uint8, manufacturerCode: ManufacturerCode.Ubisys},
        },
        commands: {
            moveToLevel: {
                ID: 0,
                parameters: [
                    {name: 'level', type: DataType.uint8},
                    {name: 'transtime', type: DataType.uint16},
                ],
            },
            move: {
                ID: 1,
                parameters: [
                    {name: 'movemode', type: DataType.uint8},
                    {name: 'rate', type: DataType.uint8},
                ],
            },
            step: {
                ID: 2,
                parameters: [
                    {name: 'stepmode', type: DataType.uint8},
                    {name: 'stepsize', type: DataType.uint8},
                    {name: 'transtime', type: DataType.uint16},
                ],
            },
            stop: {
                ID: 3,
                parameters: [
                ],
            },
            moveToLevelWithOnOff: {
                ID: 4,
                parameters: [
                    {name: 'level', type: DataType.uint8},
                    {name: 'transtime', type: DataType.uint16},
                ],
            },
            moveWithOnOff: {
                ID: 5,
                parameters: [
                    {name: 'movemode', type: DataType.uint8},
                    {name: 'rate', type: DataType.uint8},
                ],
            },
            stepWithOnOff: {
                ID: 6,
                parameters: [
                    {name: 'stepmode', type: DataType.uint8},
                    {name: 'stepsize', type: DataType.uint8},
                    {name: 'transtime', type: DataType.uint16},
                ],
            },
            stopWithOnOff: {
                ID: 7,
                parameters: [
                ],
            },
            moveToLevelTuya: {
                ID: 240,
                parameters: [
                    {name: 'level', type: DataType.uint16},
                    {name: 'transtime', type: DataType.uint16},
                ],
            },
        },
        commandsResponse: {
        },
    },
    genAlarms: {
        ID: 9,
        attributes: {
            alarmCount: {ID: 0, type: DataType.uint16},
        },
        commands: {
            reset: {
                ID: 0,
                parameters: [
                    {name: 'alarmcode', type: DataType.uint8},
                    {name: 'clusterid', type: DataType.uint16},
                ],
            },
            resetAll: {
                ID: 1,
                parameters: [
                ],
            },
            getAlarm: {
                ID: 2,
                parameters: [
                ],
            },
            resetLog: {
                ID: 3,
                parameters: [
                ],
            },
            publishEventLog: {
                ID: 4,
                parameters: [
                ],
            },
        },
        commandsResponse: {
            alarm: {
                ID: 0,
                parameters: [
                    {name: 'alarmcode', type: DataType.uint8},
                    {name: 'clusterid', type: DataType.uint16},
                ],
            },
            getRsp: {
                ID: 1,
                parameters: [
                    {name: 'status', type: DataType.uint8},
                    {name: 'alarmcode', type: DataType.uint8},
                    {name: 'clusterid', type: DataType.uint16},
                    {name: 'timestamp', type: DataType.uint32},
                ],
            },
            getEventLog: {
                ID: 2,
                parameters: [
                ],
            },
        },
    },
    genTime: {
        ID: 10,
        attributes: {
            time: {ID: 0, type: DataType.utc},
            timeStatus: {ID: 1, type: DataType.bitmap8},
            timeZone: {ID: 2, type: DataType.int32},
            dstStart: {ID: 3, type: DataType.uint32},
            dstEnd: {ID: 4, type: DataType.uint32},
            dstShift: {ID: 5, type: DataType.int32},
            standardTime: {ID: 6, type: DataType.uint32},
            localTime: {ID: 7, type: DataType.uint32},
            lastSetTime: {ID: 8, type: DataType.utc},
            validUntilTime: {ID: 9, type: DataType.utc},
        },
        commands: {
        },
        commandsResponse: {
        },
    },
    genRssiLocation: {
        ID: 11,
        attributes: {
            type: {ID: 0, type: DataType.data8},
            method: {ID: 1, type: DataType.enum8},
            age: {ID: 2, type: DataType.uint16},
            qualityMeasure: {ID: 3, type: DataType.uint8},
            numOfDevices: {ID: 4, type: DataType.uint8},
            coordinate1: {ID: 16, type: DataType.int16},
            coordinate2: {ID: 17, type: DataType.int16},
            coordinate3: {ID: 18, type: DataType.int16},
            power: {ID: 19, type: DataType.int16},
            pathLossExponent: {ID: 20, type: DataType.uint16},
            reportingPeriod: {ID: 21, type: DataType.uint16},
            calcPeriod: {ID: 22, type: DataType.uint16},
            numRSSIMeasurements: {ID: 23, type: DataType.uint16},
        },
        commands: {
            setAbsolute: {
                ID: 0,
                parameters: [
                    {name: 'coord1', type: DataType.int16},
                    {name: 'coord2', type: DataType.int16},
                    {name: 'coord3', type: DataType.int16},
                    {name: 'power', type: DataType.int16},
                    {name: 'pathlossexponent', type: DataType.uint16},
                ],
            },
            setDevCfg: {
                ID: 1,
                parameters: [
                    {name: 'power', type: DataType.int16},
                    {name: 'pathlossexponent', type: DataType.uint16},
                    {name: 'calperiod', type: DataType.uint16},
                    {name: 'numrssimeasurements', type: DataType.uint8},
                    {name: 'reportingperiod', type: DataType.uint16},
                ],
            },
            getDevCfg: {
                ID: 2,
                parameters: [
                    {name: 'targetaddr', type: DataType.ieeeAddr},
                ],
            },
            getData: {
                ID: 3,
                parameters: [
                    {name: 'getdatainfo', type: DataType.uint8},
                    {name: 'numrsp', type: DataType.uint8},
                    {name: 'targetaddr', type: DataType.ieeeAddr},
                ],
            },
        },
        commandsResponse: {
            devCfgRsp: {
                ID: 0,
                parameters: [
                    {name: 'status', type: DataType.uint8},
                    {name: 'power', type: DataType.int16},
                    {name: 'pathlossexp', type: DataType.uint16},
                    {name: 'calperiod', type: DataType.uint16},
                    {name: 'numrssimeasurements', type: DataType.uint8},
                    {name: 'reportingperiod', type: DataType.uint16},
                ],
            },
            dataRsp: {
                ID: 1,
                parameters: [
                    {name: 'status', type: DataType.uint8},
                    {name: 'locationtype', type: DataType.uint8},
                    {name: 'coord1', type: DataType.int16},
                    {name: 'coord2', type: DataType.int16},
                    {name: 'coord3', type: DataType.int16},
                    {name: 'power', type: DataType.int16},
                    {name: 'pathlossexp', type: DataType.uint16},
                    {name: 'locationmethod', type: DataType.uint8},
                    {name: 'qualitymeasure', type: DataType.uint8},
                    {name: 'locationage', type: DataType.uint16},
                ],
            },
            dataNotif: {
                ID: 2,
                parameters: [
                    {name: 'locationtype', type: DataType.uint8},
                    {name: 'coord1', type: DataType.int16},
                    {name: 'coord2', type: DataType.int16},
                    {name: 'coord3', type: DataType.int16},
                    {name: 'power', type: DataType.int16},
                    {name: 'pathlossexp', type: DataType.uint16},
                    {name: 'locationmethod', type: DataType.uint8},
                    {name: 'qualitymeasure', type: DataType.uint8},
                    {name: 'locationage', type: DataType.uint16},
                ],
            },
            compactDataNotif: {
                ID: 3,
                parameters: [
                    {name: 'locationtype', type: DataType.uint8},
                    {name: 'coord1', type: DataType.int16},
                    {name: 'coord2', type: DataType.int16},
                    {name: 'coord3', type: DataType.int16},
                    {name: 'qualitymeasure', type: DataType.uint8},
                    {name: 'locationage', type: DataType.uint16},
                ],
            },
            rssiPing: {
                ID: 4,
                parameters: [
                    {name: 'locationtype', type: DataType.uint8},
                ],
            },
        },
    },
    genAnalogInput: {
        ID: 12,
        attributes: {
            description: {ID: 28, type: DataType.charStr},
            maxPresentValue: {ID: 65, type: DataType.singlePrec},
            minPresentValue: {ID: 69, type: DataType.singlePrec},
            outOfService: {ID: 81, type: DataType.boolean},
            presentValue: {ID: 85, type: DataType.singlePrec},
            reliability: {ID: 103, type: DataType.enum8},
            resolution: {ID: 106, type: DataType.singlePrec},
            statusFlags: {ID: 111, type: DataType.bitmap8},
            engineeringUnits: {ID: 117, type: DataType.enum16},
            applicationType: {ID: 256, type: DataType.uint32},
        },
        commands: {
        },
        commandsResponse: {
        },
    },
    genAnalogOutput: {
        ID: 13,
        attributes: {
            description: {ID: 28, type: DataType.charStr},
            maxPresentValue: {ID: 65, type: DataType.singlePrec},
            minPresentValue: {ID: 69, type: DataType.singlePrec},
            outOfService: {ID: 81, type: DataType.boolean},
            presentValue: {ID: 85, type: DataType.singlePrec},
            priorityArray: {ID: 87, type: DataType.array},
            reliability: {ID: 103, type: DataType.enum8},
            relinquishDefault: {ID: 104, type: DataType.singlePrec},
            resolution: {ID: 106, type: DataType.singlePrec},
            statusFlags: {ID: 111, type: DataType.bitmap8},
            engineeringUnits: {ID: 117, type: DataType.enum16},
            applicationType: {ID: 256, type: DataType.uint32},
        },
        commands: {
        },
        commandsResponse: {
        },
    },
    genAnalogValue: {
        ID: 14,
        attributes: {
            description: {ID: 28, type: DataType.charStr},
            outOfService: {ID: 81, type: DataType.boolean},
            presentValue: {ID: 85, type: DataType.singlePrec},
            priorityArray: {ID: 87, type: DataType.array},
            reliability: {ID: 103, type: DataType.enum8},
            relinquishDefault: {ID: 104, type: DataType.singlePrec},
            statusFlags: {ID: 111, type: DataType.bitmap8},
            engineeringUnits: {ID: 117, type: DataType.enum16},
            applicationType: {ID: 256, type: DataType.uint32},
        },
        commands: {
        },
        commandsResponse: {
        },
    },
    genBinaryInput: {
        ID: 15,
        attributes: {
            activeText: {ID: 4, type: DataType.charStr},
            description: {ID: 28, type: DataType.charStr},
            inactiveText: {ID: 46, type: DataType.charStr},
            outOfService: {ID: 81, type: DataType.boolean},
            polarity: {ID: 84, type: DataType.enum8},
            presentValue: {ID: 85, type: DataType.boolean},
            reliability: {ID: 103, type: DataType.enum8},
            statusFlags: {ID: 111, type: DataType.bitmap8},
            applicationType: {ID: 256, type: DataType.uint32},
        },
        commands: {
        },
        commandsResponse: {
        },
    },
    genBinaryOutput: {
        ID: 16,
        attributes: {
            activeText: {ID: 4, type: DataType.charStr},
            description: {ID: 28, type: DataType.charStr},
            inactiveText: {ID: 46, type: DataType.charStr},
            minimumOffTime: {ID: 66, type: DataType.uint32},
            minimumOnTime: {ID: 67, type: DataType.uint32},
            outOfService: {ID: 81, type: DataType.boolean},
            polarity: {ID: 84, type: DataType.enum8},
            presentValue: {ID: 85, type: DataType.boolean},
            priorityArray: {ID: 87, type: DataType.array},
            reliability: {ID: 103, type: DataType.enum8},
            relinquishDefault: {ID: 104, type: DataType.boolean},
            statusFlags: {ID: 111, type: DataType.bitmap8},
            applicationType: {ID: 256, type: DataType.uint32},
        },
        commands: {
        },
        commandsResponse: {
        },
    },
    genBinaryValue: {
        ID: 17,
        attributes: {
            activeText: {ID: 4, type: DataType.charStr},
            description: {ID: 28, type: DataType.charStr},
            inactiveText: {ID: 46, type: DataType.charStr},
            minimumOffTime: {ID: 66, type: DataType.uint32},
            minimumOnTime: {ID: 67, type: DataType.uint32},
            outOfService: {ID: 81, type: DataType.boolean},
            presentValue: {ID: 85, type: DataType.boolean},
            priorityArray: {ID: 87, type: DataType.array},
            reliability: {ID: 103, type: DataType.enum8},
            relinquishDefault: {ID: 104, type: DataType.boolean},
            statusFlags: {ID: 111, type: DataType.bitmap8},
            applicationType: {ID: 256, type: DataType.uint32},
        },
        commands: {
        },
        commandsResponse: {
        },
    },
    genMultistateInput: {
        ID: 18,
        attributes: {
            stateText: {ID: 14, type: DataType.array},
            description: {ID: 28, type: DataType.charStr},
            numberOfStates: {ID: 74, type: DataType.uint16},
            outOfService: {ID: 81, type: DataType.boolean},
            presentValue: {ID: 85, type: DataType.uint16},
            reliability: {ID: 103, type: DataType.enum8},
            statusFlags: {ID: 111, type: DataType.bitmap8},
            applicationType: {ID: 256, type: DataType.uint32},
        },
        commands: {
        },
        commandsResponse: {
        },
    },
    genMultistateOutput: {
        ID: 19,
        attributes: {
            stateText: {ID: 14, type: DataType.array},
            description: {ID: 28, type: DataType.charStr},
            numberOfStates: {ID: 74, type: DataType.uint16},
            outOfService: {ID: 81, type: DataType.boolean},
            presentValue: {ID: 85, type: DataType.uint16},
            priorityArray: {ID: 87, type: DataType.array},
            reliability: {ID: 103, type: DataType.enum8},
            relinquishDefault: {ID: 104, type: DataType.uint16},
            statusFlags: {ID: 111, type: DataType.bitmap8},
            applicationType: {ID: 256, type: DataType.uint32},
        },
        commands: {
        },
        commandsResponse: {
        },
    },
    genMultistateValue: {
        ID: 20,
        attributes: {
            stateText: {ID: 14, type: DataType.array},
            description: {ID: 28, type: DataType.charStr},
            numberOfStates: {ID: 74, type: DataType.uint16},
            outOfService: {ID: 81, type: DataType.boolean},
            presentValue: {ID: 85, type: DataType.uint16},
            priorityArray: {ID: 87, type: DataType.array},
            reliability: {ID: 103, type: DataType.enum8},
            relinquishDefault: {ID: 104, type: DataType.uint16},
            statusFlags: {ID: 111, type: DataType.bitmap8},
            applicationType: {ID: 256, type: DataType.uint32},
        },
        commands: {
        },
        commandsResponse: {
        },
    },
    genCommissioning: {
        ID: 21,
        attributes: {
            shortress: {ID: 0, type: DataType.uint16},
            extendedPANId: {ID: 1, type: DataType.ieeeAddr},
            panId: {ID: 2, type: DataType.uint16},
            channelmask: {ID: 3, type: DataType.bitmap32},
            protocolVersion: {ID: 4, type: DataType.uint8},
            stackProfile: {ID: 5, type: DataType.uint8},
            startupControl: {ID: 6, type: DataType.enum8},
            trustCenterress: {ID: 16, type: DataType.ieeeAddr},
            trustCenterMasterKey: {ID: 17, type: DataType.secKey},
            networkKey: {ID: 18, type: DataType.secKey},
            useInsecureJoin: {ID: 19, type: DataType.boolean},
            preconfiguredLinkKey: {ID: 20, type: DataType.secKey},
            networkKeySeqNum: {ID: 21, type: DataType.uint8},
            networkKeyType: {ID: 22, type: DataType.enum8},
            networkManagerress: {ID: 23, type: DataType.uint16},
            scanAttempts: {ID: 32, type: DataType.uint8},
            timeBetweenScans: {ID: 33, type: DataType.uint16},
            rejoinInterval: {ID: 34, type: DataType.uint16},
            maxRejoinInterval: {ID: 35, type: DataType.uint16},
            indirectPollRate: {ID: 48, type: DataType.uint16},
            parentRetryThreshold: {ID: 49, type: DataType.uint8},
            concentratorFlag: {ID: 64, type: DataType.boolean},
            concentratorRus: {ID: 65, type: DataType.uint8},
            concentratorDiscoveryTime: {ID: 66, type: DataType.uint8},
        },
        commands: {
            restartDevice: {
                ID: 0,
                parameters: [
                    {name: 'options', type: DataType.uint8},
                    {name: 'delay', type: DataType.uint8},
                    {name: 'jitter', type: DataType.uint8},
                ],
            },
            saveStartupParams: {
                ID: 1,
                parameters: [
                    {name: 'options', type: DataType.uint8},
                    {name: 'index', type: DataType.uint8},
                ],
            },
            restoreStartupParams: {
                ID: 2,
                parameters: [
                    {name: 'options', type: DataType.uint8},
                    {name: 'index', type: DataType.uint8},
                ],
            },
            resetStartupParams: {
                ID: 3,
                parameters: [
                    {name: 'options', type: DataType.uint8},
                    {name: 'index', type: DataType.uint8},
                ],
            },
        },
        commandsResponse: {
            restartDeviceRsp: {
                ID: 0,
                parameters: [
                    {name: 'status', type: DataType.uint8},
                ],
            },
            saveStartupParamsRsp: {
                ID: 1,
                parameters: [
                    {name: 'status', type: DataType.uint8},
                ],
            },
            restoreStartupParamsRsp: {
                ID: 2,
                parameters: [
                    {name: 'status', type: DataType.uint8},
                ],
            },
            resetStartupParamsRsp: {
                ID: 3,
                parameters: [
                    {name: 'status', type: DataType.uint8},
                ],
            },
        },
    },
    genOta: {
        ID: 25,
        attributes: {
            upgradeServerId: {ID: 0, type: DataType.ieeeAddr},
            fileOffset: {ID: 1, type: DataType.uint32},
            currentFileVersion: {ID: 2, type: DataType.uint32},
            currentZigbeeStackVersion: {ID: 3, type: DataType.uint16},
            downloadedFileVersion: {ID: 4, type: DataType.uint32},
            downloadedZigbeeStackVersion: {ID: 5, type: DataType.uint16},
            imageUpgradeStatus: {ID: 6, type: DataType.enum8},
            manufacturerId: {ID: 7, type: DataType.uint16},
            imageTypeId: {ID: 8, type: DataType.uint16},
            minimumBlockReqDelay: {ID: 9, type: DataType.uint16},
            imageStamp: {ID: 10, type: DataType.uint32},
        },
        commands: {
            queryNextImageRequest: {
                ID: 1,
                response: 2,
                parameters: [
                    {name: 'fieldControl', type: DataType.uint8},
                    {name: 'manufacturerCode', type: DataType.uint16},
                    {name: 'imageType', type: DataType.uint16},
                    {name: 'fileVersion', type: DataType.uint32},
                ],
            },
            imageBlockRequest: {
                ID: 3,
                response: 5,
                parameters: [
                    {name: 'fieldControl', type: DataType.uint8},
                    {name: 'manufacturerCode', type: DataType.uint16},
                    {name: 'imageType', type: DataType.uint16},
                    {name: 'fileVersion', type: DataType.uint32},
                    {name: 'fileOffset', type: DataType.uint32},
                    {name: 'maximumDataSize', type: DataType.uint8},
                ],
            },
            imagePageRequest: {
                ID: 4,
                response: 5,
                parameters: [
                    {name: 'fieldControl', type: DataType.uint8},
                    {name: 'manufacturerCode', type: DataType.uint16},
                    {name: 'imageType', type: DataType.uint16},
                    {name: 'fileVersion', type: DataType.uint32},
                    {name: 'fileOffset', type: DataType.uint32},
                    {name: 'maximumDataSize', type: DataType.uint8},
                    {name: 'pageSize', type: DataType.uint16},
                    {name: 'responseSpacing', type: DataType.uint16},
                ],
            },
            upgradeEndRequest: {
                ID: 6,
                response: 7,
                parameters: [
                    {name: 'status', type: DataType.uint8},
                    {name: 'manufacturerCode', type: DataType.uint16},
                    {name: 'imageType', type: DataType.uint16},
                    {name: 'fileVersion', type: DataType.uint32},
                ],
            }
        },
        commandsResponse: {
            imageNotify: {
                ID: 0,
                parameters: [
                    {name: 'payloadType', type: DataType.uint8},
                    {name: 'queryJitter', type: DataType.uint8},
                ],
            },
            queryNextImageResponse: {
                ID: 2,
                parameters: [
                    {name: 'status', type: DataType.uint8},
                    {name: 'manufacturerCode', type: DataType.uint16, conditions: [{type: 'statusEquals', value: 0}]},
                    {name: 'imageType', type: DataType.uint16, conditions: [{type: 'statusEquals', value: 0}]},
                    {name: 'fileVersion', type: DataType.uint32, conditions: [{type: 'statusEquals', value: 0}]},
                    {name: 'imageSize', type: DataType.uint32, conditions: [{type: 'statusEquals', value: 0}]},
                ],
            },
            imageBlockResponse: {
                ID: 5,
                parameters: [
                    {name: 'status', type: DataType.uint8},
                    {name: 'manufacturerCode', type: DataType.uint16},
                    {name: 'imageType', type: DataType.uint16},
                    {name: 'fileVersion', type: DataType.uint32},
                    {name: 'fileOffset', type: DataType.uint32},
                    {name: 'dataSize', type: DataType.uint8},
                    {name: 'data', type: BuffaloZclDataType.BUFFER},
                ],
            },
            upgradeEndResponse: {
                ID: 7,
                parameters: [
                    {name: 'manufacturerCode', type: DataType.uint16},
                    {name: 'imageType', type: DataType.uint16},
                    {name: 'fileVersion', type: DataType.uint32},
                    {name: 'currentTime', type: DataType.uint32},
                    {name: 'upgradeTime', type: DataType.uint32},
                ],
            }
        },
    },
    genPollCtrl: {
        ID: 32,
        attributes: {
            checkinInterval: {ID: 0, type: DataType.uint32},
            longPollInterval: {ID: 1, type: DataType.uint32},
            shortPollInterval: {ID: 2, type: DataType.uint16},
            fastPollTimeout: {ID: 3, type: DataType.uint16},
            checkinIntervalMin: {ID: 4, type: DataType.uint32},
            longPollIntervalMin: {ID: 5, type: DataType.uint32},
            fastPollTimeoutMax: {ID: 6, type: DataType.uint16},
        },
        commands: {
            checkinRsp: {
                ID: 0,
                parameters: [
                    {name: 'startFastPolling', type: DataType.boolean},
                    {name: 'fastPollTimeout', type: DataType.uint16},
                ],
            },
            fastPollStop: {
                ID: 1,
                parameters: [
                ],
            },
            setLongPollInterval: {
                ID: 2,
                parameters: [
                    {name: 'newLongPollInterval', type: DataType.uint32},
                ],
            },
            setShortPollInterval: {
                ID: 3,
                parameters: [
                    {name: 'newShortPollInterval', type: DataType.uint16},
                ],
            },
        },
        commandsResponse: {
            checkin: {
                ID: 0,
                parameters: [
                ],
            },
        },
    },
    greenPower: {
        ID: 33,
        attributes: {
        },
        commands: {
            notification: {
                ID: 0,
                parameters: [
                    {name: 'options', type: DataType.uint16},
                    {name: 'srcID', type: DataType.uint32},
                    {name: 'frameCounter', type: DataType.uint32},
                    {name: 'commandID', type: DataType.uint8},
                    {name: 'payloadSize', type: DataType.uint8},
                    {name: 'commandFrame', type: BuffaloZclDataType.GDP_FRAME},
                    {name: 'gppNwkAddr', type: DataType.uint16,conditions: [{type: 'bitMaskSet', param:'options', mask: 0x800}]},
                    {name: 'gppGddLink', type: DataType.uint8,conditions: [{type: 'bitMaskSet', param:'options', mask: 0x800}]},
                ],
            },
            commisioningNotification: {
                ID: 4,
                parameters: [
                    {name: 'options', type: DataType.uint16},
                    {name: 'srcID', type: DataType.uint32},
                    {name: 'frameCounter', type: DataType.uint32},
                    {name: 'commandID', type: DataType.uint8},
                    {name: 'payloadSize', type: DataType.uint8},
                    {name: 'commandFrame', type: BuffaloZclDataType.GDP_FRAME},
                    {name: 'gppNwkAddr', type: DataType.uint16,conditions: [{type: 'bitMaskSet', param:'options', mask: 0x800}]},
                    {name: 'gppGddLink', type: DataType.uint8,conditions: [{type: 'bitMaskSet', param:'options', mask: 0x800}]},
                ],
            },
        },
        commandsResponse: {
            pairing: {
                ID: 1,
                parameters: [
                    {name: 'options', type: DataType.uint24},
                    {name: 'srcID', type: DataType.uint32},
                    {name: 'sinkIEEEAddr', type: DataType.ieeeAddr, conditions: [{type: 'bitFieldEnum', param:'options', offset: 4, size: 3, value: 6},]},
                    {name: 'sinkNwkAddr', type: DataType.uint16, conditions: [{type: 'bitFieldEnum', param:'options', offset: 4, size: 3, value: 6}]},
                    {name: 'sinkGroupID', type: DataType.uint16, conditions: [{type: 'bitFieldEnum', param:'options', offset: 4, size: 3, value: 4}]},
                    {name: 'deviceID', type: DataType.uint8, conditions: [{type: 'bitMaskSet', param:'options', mask: 0x0008}]},
                    {name: 'frameCounter', type: DataType.uint32, conditions: [{type: 'bitMaskSet', param:'options', mask: 0x4000}]},
                    {name: 'gpdKey', type: DataType.secKey, conditions: [{type: 'bitMaskSet', param:'options', mask: 0x8000}]},
                ],
            },
            commisioningMode: {
                ID: 2,
                parameters: [
                    {name: 'options', type: DataType.uint8},
                    {name: 'commisioningWindow', type: DataType.uint16},
                ],
            },
        },
    },
    mobileDeviceCfg: {
        ID: 34,
        attributes: {
            keepAliveTime: {ID: 0, type: DataType.uint16},
            rejoinTimeout: {ID: 1, type: DataType.uint16},
        },
        commands: {
        },
        commandsResponse: {
        },
    },
    neighborCleaning: {
        ID: 35,
        attributes: {
            neighborCleaningTimeout: {ID: 0, type: DataType.uint16},
        },
        commands: {
        },
        commandsResponse: {
        },
    },
    nearestGateway: {
        ID: 36,
        attributes: {
            nearestGateway: {ID: 0, type: DataType.uint16},
            newMobileNode: {ID: 1, type: DataType.uint16},
        },
        commands: {
        },
        commandsResponse: {
        },
    },
    closuresShadeCfg: {
        ID: 256,
        attributes: {
            physicalClosedLimit: {ID: 0, type: DataType.uint16},
            motorStepSize: {ID: 1, type: DataType.uint8},
            status: {ID: 2, type: DataType.bitmap8},
            losedLimit: {ID: 16, type: DataType.uint16},
            mode: {ID: 18, type: DataType.enum8},
        },
        commands: {
        },
        commandsResponse: {
        },
    },
    closuresDoorLock: {
        ID: 257,
        attributes: {
            lockState: {ID: 0, type: DataType.enum8},
            lockType: {ID: 38, type: DataType.bitmap16},
            actuatorEnabled: {ID: 2, type: DataType.boolean},
            doorState: {ID: 3, type: DataType.enum8},
            doorOpenEvents: {ID: 4, type: DataType.uint32},
            doorClosedEvents: {ID: 5, type: DataType.uint32},
            openPeriod: {ID: 6, type: DataType.uint16},
            numOfLockRecordsSupported: {ID: 16, type: DataType.uint16},
            numOfTotalUsersSupported: {ID: 17, type: DataType.uint16},
            numOfPinUsersSupported: {ID: 18, type: DataType.uint16},
            numOfRfidUsersSupported: {ID: 19, type: DataType.uint16},
            numOfWeekDaySchedulesSupportedPerUser: {ID: 20, type: DataType.uint8},
            numOfYearDaySchedulesSupportedPerUser: {ID: 21, type: DataType.uint8},
            numOfHolidayScheduledsSupported: {ID: 22, type: DataType.uint8},
            maxPinLen: {ID: 23, type: DataType.uint8},
            minPinLen: {ID: 24, type: DataType.uint8},
            maxRfidLen: {ID: 25, type: DataType.uint8},
            minRfidLen: {ID: 26, type: DataType.uint8},
            enableLogging: {ID: 32, type: DataType.boolean},
            language: {ID: 33, type: DataType.charStr},
            ledSettings: {ID: 34, type: DataType.uint8},
            autoRelockTime: {ID: 35, type: DataType.uint32},
            soundVolume: {ID: 36, type: DataType.uint8},
            operatingMode: {ID: 37, type: DataType.uint32},
            defaultConfigurationRegister: {ID: 39, type: DataType.bitmap16},
            enableLocalProgramming: {ID: 40, type: DataType.boolean},
            enableOneTouchLocking: {ID: 41, type: DataType.boolean},
            enableInsideStatusLed: {ID: 42, type: DataType.boolean},
            enablePrivacyModeButton: {ID: 43, type: DataType.boolean},
            wrongCodeEntryLimit: {ID: 48, type: DataType.uint8},
            userCodeTemporaryDisableTime: {ID: 49, type: DataType.uint8},
            sendPinOta: {ID: 50, type: DataType.boolean},
            requirePinForRfOperation: {ID: 51, type: DataType.boolean},
            zigbeeSecurityLevel: {ID: 52, type: DataType.uint8},
            alarmMask: {ID: 64, type: DataType.bitmap16},
            keypadOperationEventMask: {ID: 65, type: DataType.bitmap16},
            rfOperationEventMask: {ID: 66, type: DataType.bitmap16},
            manualOperationEventMask: {ID: 67, type: DataType.bitmap16},
            rfidOperationEventMask: {ID: 68, type: DataType.bitmap16},
            keypadProgrammingEventMask: {ID: 69, type: DataType.bitmap16},
            rfProgrammingEventMask: {ID: 70, type: DataType.bitmap16},
            rfidProgrammingEventMask: {ID: 71, type: DataType.bitmap16},
        },
        commands: {
            lockDoor: {
                ID: 0,
                response: 0,
                parameters: [
                    {name: 'pincodevalue', type: DataType.charStr},
                ],
            },
            unlockDoor: {
                ID: 1,
                response: 1,
                parameters: [
                    {name: 'pincodevalue', type: DataType.charStr},
                ],
            },
            toggleDoor: {
                ID: 2,
                response: 2,
                parameters: [
                    {name: 'pincodevalue', type: DataType.charStr},
                ],
            },
            unlockWithTimeout: {
                ID: 3,
                response: 3,
                parameters: [
                    {name: 'timeout', type: DataType.uint16},
                    {name: 'pincodevalue', type: DataType.charStr},
                ],
            },
            getLogRecord: {
                ID: 4,
                response: 4,
                parameters: [
                    {name: 'logindex', type: DataType.uint16},
                ],
            },
            setPinCode: {
                ID: 5,
                response: 5,
                parameters: [
                    {name: 'userid', type: DataType.uint16},
                    {name: 'userstatus', type: DataType.uint8},
                    {name: 'usertype', type: DataType.uint8},
                    {name: 'pincodevalue', type: DataType.charStr},
                ],
            },
            getPinCode: {
                ID: 6,
                response: 6,
                parameters: [
                    {name: 'userid', type: DataType.uint16},
                ],
            },
            clearPinCode: {
                ID: 7,
                response: 7,
                parameters: [
                    {name: 'userid', type: DataType.uint16},
                ],
            },
            clearAllPinCodes: {
                ID: 8,
                response: 8,
                parameters: [
                ],
            },
            setUserStatus: {
                ID: 9,
                response: 9,
                parameters: [
                    {name: 'userid', type: DataType.uint16},
                    {name: 'userstatus', type: DataType.uint8},
                ],
            },
            getUserStatus: {
                ID: 10,
                response: 10,
                parameters: [
                    {name: 'userid', type: DataType.uint16},
                ],
            },
            setWeekDaySchedule: {
                ID: 11,
                response: 11,
                parameters: [
                    {name: 'scheduleid', type: DataType.uint8},
                    {name: 'userid', type: DataType.uint16},
                    {name: 'daysmask', type: DataType.uint8},
                    {name: 'starthour', type: DataType.uint8},
                    {name: 'startminute', type: DataType.uint8},
                    {name: 'endhour', type: DataType.uint8},
                    {name: 'endminute', type: DataType.uint8},
                ],
            },
            getWeekDaySchedule: {
                ID: 12,
                response: 12,
                parameters: [
                    {name: 'scheduleid', type: DataType.uint8},
                    {name: 'userid', type: DataType.uint16},
                ],
            },
            clearWeekDaySchedule: {
                ID: 13,
                response: 13,
                parameters: [
                    {name: 'scheduleid', type: DataType.uint8},
                    {name: 'userid', type: DataType.uint16},
                ],
            },
            setYearDaySchedule: {
                ID: 14,
                response: 14,
                parameters: [
                    {name: 'scheduleid', type: DataType.uint8},
                    {name: 'userid', type: DataType.uint16},
                    {name: 'zigbeelocalstarttime', type: DataType.uint32},
                    {name: 'zigbeelocalendtime', type: DataType.uint32},
                ],
            },
            getYearDaySchedule: {
                ID: 15,
                response: 15,
                parameters: [
                    {name: 'scheduleid', type: DataType.uint8},
                    {name: 'userid', type: DataType.uint16},
                ],
            },
            clearYearDaySchedule: {
                ID: 16,
                response: 16,
                parameters: [
                    {name: 'scheduleid', type: DataType.uint8},
                    {name: 'userid', type: DataType.uint16},
                ],
            },
            setHolidaySchedule: {
                ID: 17,
                response: 17,
                parameters: [
                    {name: 'holidayscheduleid', type: DataType.uint8},
                    {name: 'zigbeelocalstarttime', type: DataType.uint32},
                    {name: 'zigbeelocalendtime', type: DataType.uint32},
                    {name: 'opermodelduringholiday', type: DataType.uint8},
                ],
            },
            getHolidaySchedule: {
                ID: 18,
                response: 18,
                parameters: [
                    {name: 'holidayscheduleid', type: DataType.uint8},
                ],
            },
            clearHolidaySchedule: {
                ID: 19,
                response: 19,
                parameters: [
                    {name: 'holidayscheduleid', type: DataType.uint8},
                ],
            },
            setUserType: {
                ID: 20,
                response: 20,
                parameters: [
                    {name: 'userid', type: DataType.uint16},
                    {name: 'usertype', type: DataType.uint8},
                ],
            },
            getUserType: {
                ID: 21,
                response: 21,
                parameters: [
                    {name: 'userid', type: DataType.uint16},
                ],
            },
            setRfidCode: {
                ID: 22,
                response: 22,
                parameters: [
                    {name: 'userid', type: DataType.uint16},
                    {name: 'userstatus', type: DataType.uint8},
                    {name: 'usertype', type: DataType.uint8},
                    {name: 'pincodevalue', type: DataType.charStr},
                ],
            },
            getRfidCode: {
                ID: 23,
                response: 23,
                parameters: [
                    {name: 'userid', type: DataType.uint16},
                ],
            },
            clearRfidCode: {
                ID: 24,
                response: 24,
                parameters: [
                    {name: 'userid', type: DataType.uint16},
                ],
            },
            clearAllRfidCodes: {
                ID: 25,
                response: 25,
                parameters: [
                ],
            },
        },
        commandsResponse: {
            lockDoorRsp: {
                ID: 0,
                parameters: [
                    {name: 'status', type: DataType.uint8},
                ],
            },
            unlockDoorRsp: {
                ID: 1,
                parameters: [
                    {name: 'status', type: DataType.uint8},
                ],
            },
            toggleDoorRsp: {
                ID: 2,
                parameters: [
                    {name: 'status', type: DataType.uint8},
                ],
            },
            unlockWithTimeoutRsp: {
                ID: 3,
                parameters: [
                    {name: 'status', type: DataType.uint8},
                ],
            },
            getLogRecordRsp: {
                ID: 4,
                parameters: [
                    {name: 'logentryid', type: DataType.uint16},
                    {name: 'timestamp', type: DataType.uint32},
                    {name: 'eventtype', type: DataType.uint8},
                    {name: 'source', type: DataType.uint8},
                    {name: 'eventidalarmcode', type: DataType.uint8},
                    {name: 'userid', type: DataType.uint16},
                    {name: 'pincodevalue', type: DataType.charStr},
                ],
            },
            setPinCodeRsp: {
                ID: 5,
                parameters: [
                    {name: 'status', type: DataType.uint8},
                ],
            },
            getPinCodeRsp: {
                ID: 6,
                parameters: [
                    {name: 'userid', type: DataType.uint16},
                    {name: 'userstatus', type: DataType.uint8},
                    {name: 'usertype', type: DataType.uint8},
                    {name: 'pincodevalue', type: DataType.charStr},
                ],
            },
            clearPinCodeRsp: {
                ID: 7,
                parameters: [
                    {name: 'status', type: DataType.uint8},
                ],
            },
            clearAllPinCodesRsp: {
                ID: 8,
                parameters: [
                    {name: 'status', type: DataType.uint8},
                ],
            },
            setUserStatusRsp: {
                ID: 9,
                parameters: [
                    {name: 'status', type: DataType.uint8},
                ],
            },
            getUserStatusRsp: {
                ID: 10,
                parameters: [
                    {name: 'userid', type: DataType.uint16},
                    {name: 'userstatus', type: DataType.uint8},
                ],
            },
            setWeekDayScheduleRsp: {
                ID: 11,
                parameters: [
                    {name: 'status', type: DataType.uint8},
                ],
            },
            getWeekDayScheduleRsp: {
                ID: 12,
                parameters: [
                    {name: 'scheduleid', type: DataType.uint8},
                    {name: 'userid', type: DataType.uint16},
                    {name: 'status', type: DataType.uint8},
                    {name: 'daysmask', type: DataType.uint8},
                    {name: 'starthour', type: DataType.uint8},
                    {name: 'startminute', type: DataType.uint8},
                    {name: 'endhour', type: DataType.uint8},
                    {name: 'endminute', type: DataType.uint8},
                ],
            },
            clearWeekDayScheduleRsp: {
                ID: 13,
                parameters: [
                    {name: 'status', type: DataType.uint8},
                ],
            },
            setYearDayScheduleRsp: {
                ID: 14,
                parameters: [
                    {name: 'status', type: DataType.uint8},
                ],
            },
            getYearDayScheduleRsp: {
                ID: 15,
                parameters: [
                    {name: 'scheduleid', type: DataType.uint8},
                    {name: 'userid', type: DataType.uint16},
                    {name: 'status', type: DataType.uint8},
                    {name: 'zigbeelocalstarttime', type: DataType.uint32},
                    {name: 'zigbeelocalendtime', type: DataType.uint32},
                ],
            },
            clearYearDayScheduleRsp: {
                ID: 16,
                parameters: [
                    {name: 'status', type: DataType.uint8},
                ],
            },
            setHolidayScheduleRsp: {
                ID: 17,
                parameters: [
                    {name: 'status', type: DataType.uint8},
                ],
            },
            getHolidayScheduleRsp: {
                ID: 18,
                parameters: [
                    {name: 'holidayscheduleid', type: DataType.uint8},
                    {name: 'status', type: DataType.uint8},
                    {name: 'zigbeelocalstarttime', type: DataType.uint32},
                    {name: 'zigbeelocalendtime', type: DataType.uint32},
                    {name: 'opermodelduringholiday', type: DataType.uint8},
                ],
            },
            clearHolidayScheduleRsp: {
                ID: 19,
                parameters: [
                    {name: 'status', type: DataType.uint8},
                ],
            },
            setUserTypeRsp: {
                ID: 20,
                parameters: [
                    {name: 'status', type: DataType.uint8},
                ],
            },
            getUserTypeRsp: {
                ID: 21,
                parameters: [
                    {name: 'userid', type: DataType.uint16},
                    {name: 'usertype', type: DataType.uint8},
                ],
            },
            setRfidCodeRsp: {
                ID: 22,
                parameters: [
                    {name: 'status', type: DataType.uint8},
                ],
            },
            getRfidCodeRsp: {
                ID: 23,
                parameters: [
                    {name: 'userid', type: DataType.uint16},
                    {name: 'userstatus', type: DataType.uint8},
                    {name: 'usertype', type: DataType.uint8},
                    {name: 'pincodevalue', type: DataType.charStr},
                ],
            },
            clearRfidCodeRsp: {
                ID: 24,
                parameters: [
                    {name: 'status', type: DataType.uint8},
                ],
            },
            clearAllRfidCodesRsp: {
                ID: 25,
                parameters: [
                    {name: 'status', type: DataType.uint8},
                ],
            },
            operationEventNotification: {
                ID: 32,
                parameters: [
                    {name: 'opereventsrc', type: DataType.uint8},
                    {name: 'opereventcode', type: DataType.uint8},
                    {name: 'userid', type: DataType.uint16},
                    {name: 'pin', type: DataType.octetStr},
                    {name: 'zigbeelocaltime', type: DataType.uint32},
                    {name: 'data', type: DataType.uint8},
                ],
            },
            programmingEventNotification: {
                ID: 33,
                parameters: [
                    {name: 'programeventsrc', type: DataType.uint8},
                    {name: 'programeventcode', type: DataType.uint8},
                    {name: 'userid', type: DataType.uint16},
                    {name: 'pin', type: DataType.octetStr},
                    {name: 'usertype', type: DataType.uint8},
                    {name: 'userstatus', type: DataType.uint8},
                    {name: 'zigbeelocaltime', type: DataType.uint32},
                    {name: 'data', type: DataType.uint8},
                ],
            },
        },
    },
    closuresWindowCovering: {
        ID: 258,
        attributes: {
            windowCoveringType: {ID: 0, type: DataType.enum8},
            physicalClosedLimitLiftCm: {ID: 1, type: DataType.uint16},
            physicalClosedLimitTiltDdegree: {ID: 2, type: DataType.uint16},
            currentPositionLiftCm: {ID: 3, type: DataType.uint16},
            currentPositionTiltDdegree: {ID: 4, type: DataType.uint16},
            numOfActuationsLift: {ID: 5, type: DataType.uint16},
            numOfActuationsTilt: {ID: 6, type: DataType.uint16},
            configStatus: {ID: 7, type: DataType.bitmap8},
            currentPositionLiftPercentage: {ID: 8, type: DataType.uint8},
            currentPositionTiltPercentage: {ID: 9, type: DataType.uint8},
            operationalStatus: {ID: 10, type: DataType.bitmap8},
            installedOpenLimitLiftCm: {ID: 16, type: DataType.uint16},
            installedClosedLimitLiftCm: {ID: 17, type: DataType.uint16},
            installedOpenLimitTiltDdegree: {ID: 18, type: DataType.uint16},
            installedClosedLimitTiltDdegree: {ID: 19, type: DataType.uint16},
            velocityLift: {ID: 20, type: DataType.uint16},
            accelerationTimeLift: {ID: 21, type: DataType.uint16},
            decelerationTimeLift: {ID: 22, type: DataType.uint16},
            windowCoveringMode: {ID: 23, type: DataType.bitmap8},
            intermediateSetpointsLift: {ID: 24, type: DataType.octetStr},
            intermediateSetpointsTilt: {ID: 25, type: DataType.octetStr},
            ubisysTurnaroundGuardTime: {ID: 0x1000, type: DataType.uint8, manufacturerCode: ManufacturerCode.Ubisys},
            ubisysLiftToTiltTransitionSteps: {ID: 0x1001, type: DataType.uint16, manufacturerCode: ManufacturerCode.Ubisys},
            ubisysTotalSteps: {ID: 0x1002, type: DataType.uint16, manufacturerCode: ManufacturerCode.Ubisys},
            ubisysLiftToTiltTransitionSteps2: {ID: 0x1003, type: DataType.uint16, manufacturerCode: ManufacturerCode.Ubisys},
            ubisysTotalSteps2: {ID: 0x1004, type: DataType.uint16, manufacturerCode: ManufacturerCode.Ubisys},
            ubisysAdditionalSteps: {ID: 0x1005, type: DataType.uint8, manufacturerCode: ManufacturerCode.Ubisys},
            ubisysInactivePowerThreshold: {ID: 0x1006, type: DataType.uint16, manufacturerCode: ManufacturerCode.Ubisys},
            ubisysStartupSteps: {ID: 0x1007, type: DataType.uint16, manufacturerCode: ManufacturerCode.Ubisys},
            tuyaMovingState: {ID: 0xf000, type: DataType.enum8},
            tuyaCalibration: {ID: 0xf001, type: DataType.enum8},
            tuyaMotorReversal: {ID: 0xf002, type: DataType.enum8},
            moesCalibrationTime: {ID: 0xf003, type: DataType.uint16},
            elkoDriveCloseDuration: {ID: 0xE000, type: DataType.uint16, manufacturerCode: ManufacturerCode.ELKO},
            elkoProtectionStatus: {ID: 0xE010, type: DataType.bitmap8, manufacturerCode: ManufacturerCode.ELKO},
            elkoProtectionSensor: {ID: 0xE013, type: DataType.bitmap8, manufacturerCode: ManufacturerCode.ELKO},
            elkoSunProtectionIlluminanceThreshold: {ID: 0xE012, type: DataType.uint16, manufacturerCode: ManufacturerCode.ELKO},
            elkoLiftDriveUpTime: {ID: 0xE014, type: DataType.uint16, manufacturerCode: ManufacturerCode.ELKO},
            elkoLiftDriveDownTime: {ID: 0xE015, type: DataType.uint16, manufacturerCode: ManufacturerCode.ELKO},
            elkoTiltOpenCloseAndStepTime: {ID: 0xE016, type: DataType.uint16, manufacturerCode: ManufacturerCode.ELKO},
            elkoTiltPositionPercentageAfterMoveToLevel: {ID: 0xE017, type: DataType.uint8, manufacturerCode: ManufacturerCode.ELKO},
        },
        commands: {
            upOpen: {
                ID: 0,
                parameters: [
                ],
            },
            downClose: {
                ID: 1,
                parameters: [
                ],
            },
            stop: {
                ID: 2,
                parameters: [
                ],
            },
            goToLiftValue: {
                ID: 4,
                parameters: [
                    {name: 'liftvalue', type: DataType.uint16},
                ],
            },
            goToLiftPercentage: {
                ID: 5,
                parameters: [
                    {name: 'percentageliftvalue', type: DataType.uint8},
                ],
            },
            goToTiltValue: {
                ID: 7,
                parameters: [
                    {name: 'tiltvalue', type: DataType.uint16},
                ],
            },
            goToTiltPercentage: {
                ID: 8,
                parameters: [
                    {name: 'percentagetiltvalue', type: DataType.uint8},
                ],
            },
            elkoStopOrStepLiftPercentage: {
                ID: 0x80,
                parameters: [
                    {name: 'direction', type: DataType.uint16},
                    {name: 'stepvalue', type: DataType.uint16},
                ],
            },
        },
        commandsResponse: {
        },
    },
    barrierControl:{
        ID: 259,
        attributes: {
            movingState: {ID: 1, type: DataType.enum8},
            safetyStatus: {ID: 2, type: DataType.bitmap16},
            capabilities: {ID: 3, type: DataType.bitmap8},
            openEvents: {ID: 4, type: DataType.uint16},
            closeEvents: {ID: 5, type: DataType.uint16},
            commandOpenEvents: {ID: 6, type: DataType.uint16},
            commandCloseEvents: {ID: 7, type: DataType.uint16},
            openPeriod: {ID: 8, type: DataType.uint16},
            closePeriod: {ID: 9, type: DataType.uint16},
            barrierPosition: {ID: 10, type: DataType.uint8}
        },
        commands: {
            goToPercent: {
                ID: 0,
                parameters: [
                    {name: 'percentOpen', type: DataType.uint8}
                ],
            },
            stop: {
                ID: 1,
                parameters: [
                ],
            },
        },
        commandsResponse: {
        },

    },
    hvacPumpCfgCtrl: {
        ID: 512,
        attributes: {
            maxPressure: {ID: 0, type: DataType.int16},
            maxSpeed: {ID: 1, type: DataType.uint16},
            maxFlow: {ID: 2, type: DataType.uint16},
            minConstPressure: {ID: 3, type: DataType.int16},
            maxConstPressure: {ID: 4, type: DataType.int16},
            minCompPressure: {ID: 5, type: DataType.int16},
            maxCompPressure: {ID: 6, type: DataType.int16},
            minConstSpeed: {ID: 7, type: DataType.uint16},
            maxConstSpeed: {ID: 8, type: DataType.uint16},
            minConstFlow: {ID: 9, type: DataType.uint16},
            maxConstFlow: {ID: 10, type: DataType.uint16},
            minConstTemp: {ID: 11, type: DataType.int16},
            maxConstTemp: {ID: 12, type: DataType.int16},
            pumpStatus: {ID: 16, type: DataType.bitmap16},
            effectiveOperationMode: {ID: 17, type: DataType.enum8},
            effectiveControlMode: {ID: 18, type: DataType.enum8},
            capacity: {ID: 19, type: DataType.int16},
            speed: {ID: 20, type: DataType.uint16},
            lifetimeRunningHours: {ID: 21, type: DataType.uint24},
            power: {ID: 22, type: DataType.uint24},
            lifetimeEnergyConsumed: {ID: 23, type: DataType.uint32},
            operationMode: {ID: 32, type: DataType.enum8},
            controlMode: {ID: 33, type: DataType.enum8},
            alarmMask: {ID: 34, type: DataType.bitmap16},
        },
        commands: {
        },
        commandsResponse: {
        },
    },
    hvacThermostat: {
        ID: 513,
        attributes: {
            localTemp: {ID: 0, type: DataType.int16},
            outdoorTemp: {ID: 1, type: DataType.int16},
            ocupancy: {ID: 2, type: DataType.bitmap8},
            absMinHeatSetpointLimit: {ID: 3, type: DataType.int16},
            absMaxHeatSetpointLimit: {ID: 4, type: DataType.int16},
            absMinCoolSetpointLimit: {ID: 5, type: DataType.int16},
            absMaxCoolSetpointLimit: {ID: 6, type: DataType.int16},
            pICoolingDemand: {ID: 7, type: DataType.uint8},
            pIHeatingDemand: {ID: 8, type: DataType.uint8},
            systemTypeConfig: {ID: 9, type: DataType.bitmap8},
            localTemperatureCalibration: {ID: 16, type: DataType.int8},
            occupiedCoolingSetpoint: {ID: 17, type: DataType.int16},
            occupiedHeatingSetpoint: {ID: 18, type: DataType.int16},
            unoccupiedCoolingSetpoint: {ID: 19, type: DataType.int16},
            unoccupiedHeatingSetpoint: {ID: 20, type: DataType.int16},
            minHeatSetpointLimit: {ID: 21, type: DataType.int16},
            maxHeatSetpointLimit: {ID: 22, type: DataType.int16},
            minCoolSetpointLimit: {ID: 23, type: DataType.int16},
            maxCoolSetpointLimit: {ID: 24, type: DataType.int16},
            minSetpointDeadBand: {ID: 25, type: DataType.int8},
            remoteSensing: {ID: 26, type: DataType.bitmap8},
            ctrlSeqeOfOper: {ID: 27, type: DataType.enum8},
            systemMode: {ID: 28, type: DataType.enum8},
            alarmMask: {ID: 29, type: DataType.bitmap8},
            runningMode: {ID: 30, type: DataType.enum8},
            startOfWeek: {ID: 32, type: DataType.enum8},
            numberOfWeeklyTrans: {ID: 33, type: DataType.uint8},
            numberOfDailyTrans: {ID: 34, type: DataType.uint8},
            tempSetpointHold: {ID: 35, type: DataType.enum8},
            tempSetpointHoldDuration: {ID: 36, type: DataType.uint16},
            programingOperMode: {ID: 37, type: DataType.bitmap8},
            runningState: {ID: 41, type: DataType.bitmap16},
            setpointChangeSource: {ID: 48, type: DataType.enum8},
            setpointChangeAmount: {ID: 49, type: DataType.int16},
            setpointChangeSourceTimeStamp: {ID: 50, type: DataType.utc},
            acType: {ID: 64, type: DataType.enum8},
            acCapacity: {ID: 65, type: DataType.uint16},
            acRefrigerantType: {ID: 66, type: DataType.enum8},
            acConpressorType: {ID: 67, type: DataType.enum8},
            acErrorCode: {ID: 68, type: DataType.bitmap32},
            acLouverPosition: {ID: 69, type: DataType.enum8},
            acCollTemp: {ID: 70, type: DataType.int16},
            acCapacityFormat: {ID: 71, type: DataType.enum8},
            SinopeOccupancy: {ID: 1024, type: DataType.enum8, manufacturerCode: ManufacturerCode.Sinope},
            SinopeBacklight: {ID: 1026, type: DataType.enum8, manufacturerCode: ManufacturerCode.Sinope},
            StelproSystemMode: {ID: 0x401c, type: DataType.enum8},
            StelproOutdoorTemp: {ID: 0x4001, type: DataType.int16, manufacturerCode: ManufacturerCode.Stelpro},
            viessmannWindowOpenInternal: {ID: 0x4000, type: DataType.enum8, manufacturerCode: ManufacturerCode.VIESSMAN_ELEKTRO},
            viessmannWindowOpenForce: {ID: 0x4003, type: DataType.boolean, manufacturerCode: ManufacturerCode.VIESSMAN_ELEKTRO},
            viessmannAssemblyMode: {ID: 0x4012, type: DataType.boolean, manufacturerCode: ManufacturerCode.VIESSMAN_ELEKTRO},
            schneiderWiserSpecific: {ID: 0xe110, type: DataType.enum8, manufacturerCode: ManufacturerCode.SCHNEIDER},
            danfossWindowOpenInternal: {ID: 0x4000, type: DataType.enum8, manufacturerCode: ManufacturerCode.DANFOSS},
            danfossWindowOpenExternal: {ID: 0x4003, type: DataType.boolean, manufacturerCode: ManufacturerCode.DANFOSS},
            danfossDayOfWeek: {ID: 0x4010, type: DataType.enum8, manufacturerCode: ManufacturerCode.DANFOSS},
            danfossTriggerTime: {ID: 0x4011, type: DataType.uint16, manufacturerCode: ManufacturerCode.DANFOSS},
            danfossMountedModeActive: {ID: 0x4012, type: DataType.boolean, manufacturerCode: ManufacturerCode.DANFOSS},
            danfossMountedModeControl: {ID: 0x4013, type: DataType.boolean, manufacturerCode: ManufacturerCode.DANFOSS},
            danfossThermostatOrientation: {ID: 0x4014, type: DataType.boolean, manufacturerCode: ManufacturerCode.DANFOSS},
            danfossExternalMeasuredRoomSensor: {ID: 0x4015, type: DataType.int16, manufacturerCode: ManufacturerCode.DANFOSS},
            danfossRadiatorCovered: {ID: 0x4016, type: DataType.boolean, manufacturerCode: ManufacturerCode.DANFOSS},
            danfossAlgorithmScaleFactor: {ID: 0x4020, type: DataType.uint8, manufacturerCode: ManufacturerCode.DANFOSS},
            danfossHeatAvailable: {ID: 0x4030, type: DataType.boolean, manufacturerCode: ManufacturerCode.DANFOSS},
            danfossHeatRequired: {ID: 0x4031, type: DataType.boolean, manufacturerCode: ManufacturerCode.DANFOSS},
            danfossLoadBalancingEnable: {ID: 0x4032, type: DataType.boolean, manufacturerCode: ManufacturerCode.DANFOSS},
            danfossLoadRoomMean: {ID: 0x4040, type: DataType.int16, manufacturerCode: ManufacturerCode.DANFOSS},
            danfossLoadEstimate: {ID: 0x404a, type: DataType.int16, manufacturerCode: ManufacturerCode.DANFOSS},
            danfossRegulationSetpointOffset: {ID: 0x404b, type: DataType.int8, manufacturerCode: ManufacturerCode.DANFOSS},
            danfossAdaptionRunControl: {ID: 0x404c, type: DataType.enum8, manufacturerCode: ManufacturerCode.DANFOSS},
            danfossAdaptionRunStatus: {ID: 0x404d, type: DataType.bitmap8, manufacturerCode: ManufacturerCode.DANFOSS},
            danfossAdaptionRunSettings: {ID: 0x404e, type: DataType.bitmap8, manufacturerCode: ManufacturerCode.DANFOSS},
            danfossPreheatStatus: {ID: 0x404f, type: DataType.boolean, manufacturerCode: ManufacturerCode.DANFOSS},
            danfossPreheatTime: {ID: 0x4050, type: DataType.uint32, manufacturerCode: ManufacturerCode.DANFOSS},
            danfossWindowOpenFeatureEnable: {ID: 0x4051, type: DataType.boolean, manufacturerCode: ManufacturerCode.DANFOSS},
            danfossRoomStatusCode: {ID: 0x4100, type: DataType.bitmap16, manufacturerCode: ManufacturerCode.DANFOSS},
            danfossOutputStatus:  {ID: 0x4110, type: DataType.enum8, manufacturerCode: ManufacturerCode.DANFOSS},
            danfossRoomFloorSensorMode: {ID: 0x4120, type: DataType.enum8, manufacturerCode: ManufacturerCode.DANFOSS},
            danfossFloorMinSetpoint: {ID: 0x4121, type: DataType.int16, manufacturerCode: ManufacturerCode.DANFOSS},
            danfossFloorMaxSetpoint: {ID: 0x4122, type: DataType.int16, manufacturerCode: ManufacturerCode.DANFOSS},
            elkoLoad: {ID: 0x0401, type: DataType.uint16, manufacturerCode: ManufacturerCode.ELKO},
            elkoDisplayText: {ID: 0x0402, type: DataType.charStr, manufacturerCode: ManufacturerCode.ELKO},
            elkoSensor: {ID: 0x0403, type: DataType.enum8, manufacturerCode: ManufacturerCode.ELKO},
            elkoRegulatorTime: {ID: 0x0404, type: DataType.uint8, manufacturerCode: ManufacturerCode.ELKO},
            elkoRegulatorMode: {ID: 0x0405, type: DataType.boolean, manufacturerCode: ManufacturerCode.ELKO},
            elkoPowerStatus: {ID: 0x0406, type: DataType.boolean, manufacturerCode: ManufacturerCode.ELKO},
            elkoDateTime: {ID: 0x0407, type: DataType.octetStr, manufacturerCode: ManufacturerCode.ELKO},
            elkoMeanPower: {ID: 0x0408, type: DataType.uint16, manufacturerCode: ManufacturerCode.ELKO},
            elkoExternalTemp: {ID: 0x0409, type: DataType.int16, manufacturerCode: ManufacturerCode.ELKO},
            elkoNightSwitching: {ID: 0x0411, type: DataType.boolean, manufacturerCode: ManufacturerCode.ELKO},
            elkoFrostGuard: {ID: 0x0412, type: DataType.boolean, manufacturerCode: ManufacturerCode.ELKO},
            elkoChildLock: {ID: 0x0413, type: DataType.boolean, manufacturerCode: ManufacturerCode.ELKO},
            elkoMaxFloorTemp: {ID: 0x0414, type: DataType.uint8, manufacturerCode: ManufacturerCode.ELKO},
            elkoRelayState: {ID: 0x0415, type: DataType.boolean, manufacturerCode: ManufacturerCode.ELKO},
            elkoVersion: {ID: 0x0416, type: DataType.octetStr, manufacturerCode: ManufacturerCode.ELKO},
            elkoCalibration: {ID: 0x0417, type: DataType.int8, manufacturerCode: ManufacturerCode.ELKO},
            elkoLastMessageId: {ID: 0x0418, type: DataType.uint8, manufacturerCode: ManufacturerCode.ELKO},
            elkoLastMessageStatus: {ID: 0x0419, type: DataType.uint8, manufacturerCode: ManufacturerCode.ELKO},
        },
        commands: {
            setpointRaiseLower: {
                ID: 0,
                parameters: [
                    {name: 'mode', type: DataType.uint8},
                    {name: 'amount', type: DataType.int8},
                ],
            },
            setWeeklySchedule: {
                ID: 1,
                parameters: [
                    {name: 'numoftrans', type: DataType.uint8},
                    {name: 'dayofweek', type: DataType.uint8},
                    {name: 'mode', type: DataType.uint8},
                    {name: 'transitions', type: BuffaloZclDataType.LIST_THERMO_TRANSITIONS},
                ],
            },
            getWeeklySchedule: {
                ID: 2,
                parameters: [
                    {name: 'daystoreturn', type: DataType.uint8},
                    {name: 'modetoreturn', type: DataType.uint8},
                ],
            },
            clearWeeklySchedule: {
                ID: 3,
                parameters: [
                ],
            },
            getRelayStatusLog: {
                ID: 4,
                parameters: [
                ],
            },
            danfossSetpointCommand: {
                ID: 64,
                parameters: [
                    {name: 'setpointType', type: DataType.enum8},
                    {name: 'setpoint', type: DataType.int16},
                ],
            },
            schneiderWiserThermostatBoost: {
                ID: 0x80,
                parameters: [
                    {name: 'command', type: DataType.enum8},
                    {name: 'enable', type: DataType.enum8},
                    {name: 'temperature', type: DataType.uint16},
                    {name: 'duration', type: DataType.uint16},
                ],
            },
            wiserSmartSetSetpoint: {
                ID: 224,
                parameters: [
                    {name: 'operatingmode', type: DataType.uint8},
                    {name: 'zonemode', type: DataType.uint8},
                    {name: 'setpoint', type: DataType.int16},
                    {name: 'reserved', type: DataType.uint8},
                ],
            },
            wiserSmartCalibrateValve: {
                ID: 226,
                parameters: [
                ],
            },
        },
        commandsResponse: {
            getWeeklyScheduleRsp: {
                ID: 0,
                parameters: [
                    {name: 'numoftrans', type: DataType.uint8},
                    {name: 'dayofweek', type: DataType.uint8},
                    {name: 'mode', type: DataType.uint8},
                    {name: 'transitions', type: BuffaloZclDataType.LIST_THERMO_TRANSITIONS},
                ],
            },
            getRelayStatusLogRsp: {
                ID: 1,
                parameters: [
                    {name: 'timeofday', type: DataType.uint16},
                    {name: 'relaystatus', type: DataType.uint16},
                    {name: 'localtemp', type: DataType.uint16},
                    {name: 'humidity', type: DataType.uint8},
                    {name: 'setpoint', type: DataType.uint16},
                    {name: 'unreadentries', type: DataType.uint16},
                ],
            },
        },
    },
    hvacFanCtrl: {
        ID: 514,
        attributes: {
            fanMode: {ID: 0, type: DataType.enum8},
            fanModeSequence: {ID: 1, type: DataType.enum8},
        },
        commands: {
        },
        commandsResponse: {
        },
    },
    hvacDehumidificationCtrl: {
        ID: 515,
        attributes: {
            relativeHumidity: {ID: 0, type: DataType.uint8},
            dehumidCooling: {ID: 1, type: DataType.uint8},
            rhDehumidSetpoint: {ID: 16, type: DataType.uint8},
            relativeHumidityMode: {ID: 17, type: DataType.enum8},
            dehumidLockout: {ID: 18, type: DataType.enum8},
            dehumidHysteresis: {ID: 19, type: DataType.uint8},
            dehumidMaxCool: {ID: 20, type: DataType.uint8},
            relativeHumidDisplay: {ID: 21, type: DataType.enum8},
        },
        commands: {
        },
        commandsResponse: {
        },
    },
    hvacUserInterfaceCfg: {
        ID: 516,
        attributes: {
            tempDisplayMode: {ID: 0, type: DataType.enum8},
            keypadLockout: {ID: 1, type: DataType.enum8},
            programmingVisibility: {ID: 2, type: DataType.enum8},
            danfossViewingDirection: {ID: 0x4000, type: DataType.enum8, manufacturerCode: ManufacturerCode.DANFOSS},
        },
        commands: {
        },
        commandsResponse: {
        },
    },
    lightingColorCtrl: {
        ID: 768,
        attributes: {
            currentHue: {ID: 0, type: DataType.uint8},
            currentSaturation: {ID: 1, type: DataType.uint8},
            remainingTime: {ID: 2, type: DataType.uint16},
            currentX: {ID: 3, type: DataType.uint16},
            currentY: {ID: 4, type: DataType.uint16},
            driftCompensation: {ID: 5, type: DataType.enum8},
            compensationText: {ID: 6, type: DataType.charStr},
            colorTemperature: {ID: 7, type: DataType.uint16},
            colorMode: {ID: 8, type: DataType.enum8},
            options: {ID: 15, type: DataType.bitmap8},
            numPrimaries: {ID: 16, type: DataType.uint8},
            primary1X: {ID: 17, type: DataType.uint16},
            primary1Y: {ID: 18, type: DataType.uint16},
            primary1Intensity: {ID: 19, type: DataType.uint8},
            primary2X: {ID: 21, type: DataType.uint16},
            primary2Y: {ID: 22, type: DataType.uint16},
            primary2Intensity: {ID: 23, type: DataType.uint8},
            primary3X: {ID: 25, type: DataType.uint16},
            primary3Y: {ID: 26, type: DataType.uint16},
            primary3Intensity: {ID: 27, type: DataType.uint8},
            primary4X: {ID: 32, type: DataType.uint16},
            primary4Y: {ID: 33, type: DataType.uint16},
            primary4Intensity: {ID: 34, type: DataType.uint8},
            primary5X: {ID: 36, type: DataType.uint16},
            primary5Y: {ID: 37, type: DataType.uint16},
            primary5Intensity: {ID: 38, type: DataType.uint8},
            primary6X: {ID: 40, type: DataType.uint16},
            primary6Y: {ID: 41, type: DataType.uint16},
            primary6Intensity: {ID: 42, type: DataType.uint8},
            whitePointX: {ID: 48, type: DataType.uint16},
            whitePointY: {ID: 49, type: DataType.uint16},
            colorPointRX: {ID: 50, type: DataType.uint16},
            colorPointRY: {ID: 51, type: DataType.uint16},
            colorPointRIntensity: {ID: 52, type: DataType.uint8},
            colorPointGX: {ID: 54, type: DataType.uint16},
            colorPointGY: {ID: 55, type: DataType.uint16},
            colorPointGIntensity: {ID: 56, type: DataType.uint8},
            colorPointBX: {ID: 58, type: DataType.uint16},
            colorPointBY: {ID: 59, type: DataType.uint16},
            colorPointBIntensity: {ID: 60, type: DataType.uint8},
            enhancedCurrentHue: {ID: 16384, type: DataType.uint16},
            enhancedColorMode: {ID: 16385, type: DataType.enum8},
            colorLoopActive: {ID: 16386, type: DataType.uint8},
            colorLoopDirection: {ID: 16387, type: DataType.uint8},
            colorLoopTime: {ID: 16388, type: DataType.uint16},
            colorLoopStartEnhancedHue: {ID: 16389, type: DataType.uint16},
            colorLoopStoredEnhancedHue: {ID: 16390, type: DataType.uint16},
            colorCapabilities: {ID: 16394, type: DataType.uint16},
            colorTempPhysicalMin: {ID: 16395, type: DataType.uint16},
            colorTempPhysicalMax: {ID: 16396, type: DataType.uint16},
            coupleColorTempToLevelMin: {ID: 16397, type: DataType.uint16},
            startUpColorTemperature: {ID: 16400, type: DataType.uint16},
            tuyaBrightness: {ID: 61441, type: DataType.uint16},
            tuyaRgbMode: {ID: 61440, type: DataType.uint16},
        },
        commands: {
            moveToHue: {
                ID: 0,
                parameters: [
                    {name: 'hue', type: DataType.uint8},
                    {name: 'direction', type: DataType.uint8},
                    {name: 'transtime', type: DataType.uint16},
                ],
            },
            moveHue: {
                ID: 1,
                parameters: [
                    {name: 'movemode', type: DataType.uint8},
                    {name: 'rate', type: DataType.uint8},
                ],
            },
            stepHue: {
                ID: 2,
                parameters: [
                    {name: 'stepmode', type: DataType.uint8},
                    {name: 'stepsize', type: DataType.uint8},
                    {name: 'transtime', type: DataType.uint8},
                ],
            },
            moveToSaturation: {
                ID: 3,
                parameters: [
                    {name: 'saturation', type: DataType.uint8},
                    {name: 'transtime', type: DataType.uint16},
                ],
            },
            moveSaturation: {
                ID: 4,
                parameters: [
                    {name: 'movemode', type: DataType.uint8},
                    {name: 'rate', type: DataType.uint8},
                ],
            },
            stepSaturation: {
                ID: 5,
                parameters: [
                    {name: 'stepmode', type: DataType.uint8},
                    {name: 'stepsize', type: DataType.uint8},
                    {name: 'transtime', type: DataType.uint8},
                ],
            },
            moveToHueAndSaturation: {
                ID: 6,
                parameters: [
                    {name: 'hue', type: DataType.uint8},
                    {name: 'saturation', type: DataType.uint8},
                    {name: 'transtime', type: DataType.uint16},
                ],
            },
            tuyaMoveToHueAndSaturationBrightness: {
                ID: 6,
                parameters: [
                    {name: 'hue', type: DataType.uint8},
                    {name: 'saturation', type: DataType.uint8},
                    {name: 'transtime', type: DataType.uint16},
                    {name: 'brightness', type: DataType.uint8},
                ],
            },
            moveToColor: {
                ID: 7,
                parameters: [
                    {name: 'colorx', type: DataType.uint16},
                    {name: 'colory', type: DataType.uint16},
                    {name: 'transtime', type: DataType.uint16},
                ],
            },
            moveColor: {
                ID: 8,
                parameters: [
                    {name: 'ratex', type: DataType.int16},
                    {name: 'ratey', type: DataType.int16},
                ],
            },
            stepColor: {
                ID: 9,
                parameters: [
                    {name: 'stepx', type: DataType.int16},
                    {name: 'stepy', type: DataType.int16},
                    {name: 'transtime', type: DataType.uint16},
                ],
            },
            moveToColorTemp: {
                ID: 10,
                parameters: [
                    {name: 'colortemp', type: DataType.uint16},
                    {name: 'transtime', type: DataType.uint16},
                ],
            },
            enhancedMoveToHue: {
                ID: 64,
                parameters: [
                    {name: 'enhancehue', type: DataType.uint16},
                    {name: 'direction', type: DataType.uint8},
                    {name: 'transtime', type: DataType.uint16},
                ],
            },
            enhancedMoveHue: {
                ID: 65,
                parameters: [
                    {name: 'movemode', type: DataType.uint8},
                    {name: 'rate', type: DataType.uint16},
                ],
            },
            enhancedStepHue: {
                ID: 66,
                parameters: [
                    {name: 'stepmode', type: DataType.uint8},
                    {name: 'stepsize', type: DataType.uint16},
                    {name: 'transtime', type: DataType.uint16},
                ],
            },
            enhancedMoveToHueAndSaturation: {
                ID: 67,
                parameters: [
                    {name: 'enhancehue', type: DataType.uint16},
                    {name: 'saturation', type: DataType.uint8},
                    {name: 'transtime', type: DataType.uint16},
                ],
            },
            colorLoopSet: {
                ID: 68,
                parameters: [
                    {name: 'updateflags', type: DataType.uint8},
                    {name: 'action', type: DataType.uint8},
                    {name: 'direction', type: DataType.uint8},
                    {name: 'time', type: DataType.uint16},
                    {name: 'starthue', type: DataType.uint16},
                ],
            },
            stopMoveStep: {
                ID: 71,
                parameters: [
                    {name: 'bits', type: DataType.uint8},
                    {name: 'bytee', type: DataType.uint8},
                    {name: 'action', type: DataType.uint8},
                    {name: 'direction', type: DataType.uint8},
                    {name: 'time', type: DataType.uint16},
                    {name: 'starthue', type: DataType.uint16},
                ],
            },
            moveColorTemp: {
                ID: 75,
                parameters: [
                    {name: 'movemode', type: DataType.uint8},
                    {name: 'rate', type: DataType.uint16},
                    {name: 'minimum', type: DataType.uint16},
                    {name: 'maximum', type: DataType.uint16},
                ],
            },
            stepColorTemp: {
                ID: 76,
                parameters: [
                    {name: 'stepmode', type: DataType.uint8},
                    {name: 'stepsize', type: DataType.uint16},
                    {name: 'transtime', type: DataType.uint16},
                    {name: 'minimum', type: DataType.uint16},
                    {name: 'maximum', type: DataType.uint16},
                ],
            },
            tuyaRgbMode: {
                ID: 240,
                parameters: [
                    {name: 'enable', type: DataType.uint8},
                ]
            },
            tuyaOnStartUp: {
                ID: 249,
                parameters: [
                    {name: 'mode', type: DataType.uint16},
                    {name: 'data', type: BuffaloZclDataType.LIST_UINT8},
                ],
            },
            tuyaDoNotDisturb: {
                ID: 250,
                parameters: [
                    {name: 'enable', type: DataType.uint8},
                ],
            },
        },
        commandsResponse: {
        },
    },
    lightingBallastCfg: {
        ID: 769,
        attributes: {
            physicalMinLevel: {ID: 0, type: DataType.uint8},
            physicalMaxLevel: {ID: 1, type: DataType.uint8},
            ballastStatus: {ID: 2, type: DataType.bitmap8},
            minLevel: {ID: 16, type: DataType.uint8},
            maxLevel: {ID: 17, type: DataType.uint8},
            powerOnLevel: {ID: 18, type: DataType.uint8},
            powerOnFadeTime: {ID: 19, type: DataType.uint16},
            intrinsicBallastFactor: {ID: 20, type: DataType.uint8},
            ballastFactorAdjustment: {ID: 21, type: DataType.uint8},
            lampQuantity: {ID: 32, type: DataType.uint8},
            lampType: {ID: 48, type: DataType.charStr},
            lampManufacturer: {ID: 49, type: DataType.charStr},
            lampRatedHours: {ID: 50, type: DataType.uint24},
            lampBurnHours: {ID: 51, type: DataType.uint24},
            lampAlarmMode: {ID: 52, type: DataType.bitmap8},
            lampBurnHoursTripPoint: {ID: 53, type: DataType.uint24},
            elkoControlMode: {ID: 0xE000, type: DataType.enum8, manufacturerCode: ManufacturerCode.ELKO},
            wiserControlMode: {ID: 0xE000, type: DataType.enum8, manufacturerCode: ManufacturerCode.SCHNEIDER},
        },
        commands: {
        },
        commandsResponse: {
        },
    },
    msIlluminanceMeasurement: {
        ID: 1024,
        attributes: {
            measuredValue: {ID: 0, type: DataType.uint16},
            minMeasuredValue: {ID: 1, type: DataType.uint16},
            maxMeasuredValue: {ID: 2, type: DataType.uint16},
            tolerance: {ID: 3, type: DataType.uint16},
            lightSensorType: {ID: 4, type: DataType.enum8},
        },
        commands: {
        },
        commandsResponse: {
        },
    },
    msIlluminanceLevelSensing: {
        ID: 1025,
        attributes: {
            levelStatus: {ID: 0, type: DataType.enum8},
            lightSensorType: {ID: 1, type: DataType.enum8},
            illuminanceTargetLevel: {ID: 16, type: DataType.uint16},
        },
        commands: {
        },
        commandsResponse: {
        },
    },
    msTemperatureMeasurement: {
        ID: 1026,
        attributes: {
            measuredValue: {ID: 0, type: DataType.int16},
            minMeasuredValue: {ID: 1, type: DataType.int16},
            maxMeasuredValue: {ID: 2, type: DataType.int16},
            tolerance: {ID: 3, type: DataType.uint16},
            minPercentChange: {ID: 16, type: DataType.unknown},
            minAbsoluteChange: {ID: 17, type: DataType.unknown},
            sprutTemperatureOffset: {ID: 0x6600, type: DataType.int16, manufacturerCode: ManufacturerCode.SprutDevice},
        },
        commands: {
        },
        commandsResponse: {
        },
    },
    msPressureMeasurement: {
        ID: 1027,
        attributes: {
            measuredValue: {ID: 0, type: DataType.int16},
            minMeasuredValue: {ID: 1, type: DataType.int16},
            maxMeasuredValue: {ID: 2, type: DataType.int16},
            tolerance: {ID: 3, type: DataType.uint16},
            scaledValue: {ID: 0x0010, type: DataType.int16},
            minScaledValue: {ID: 0x0011, type: DataType.int16},
            maxScaledValue: {ID: 0x0012, type: DataType.int16},
            scaledTolerance: {ID: 0x0013, type: DataType.uint16},
            scale: {ID: 0x0014, type: DataType.int8},
        },
        commands: {
        },
        commandsResponse: {
        },
    },
    msFlowMeasurement: {
        ID: 1028,
        attributes: {
            measuredValue: {ID: 0, type: DataType.uint16},
            minMeasuredValue: {ID: 1, type: DataType.uint16},
            maxMeasuredValue: {ID: 2, type: DataType.uint16},
            tolerance: {ID: 3, type: DataType.uint16},
        },
        commands: {
        },
        commandsResponse: {
        },
    },
    msRelativeHumidity: {
        ID: 1029,
        attributes: {
            measuredValue: {ID: 0, type: DataType.uint16},
            minMeasuredValue: {ID: 1, type: DataType.uint16},
            maxMeasuredValue: {ID: 2, type: DataType.uint16},
            tolerance: {ID: 3, type: DataType.uint16},
            sprutHeater: {ID: 0x6600, type: DataType.boolean, manufacturerCode: ManufacturerCode.SprutDevice},
        },
        commands: {
        },
        commandsResponse: {
        },
    },
    msOccupancySensing: {
        ID: 1030,
        attributes: {
            occupancy: {ID: 0, type: DataType.bitmap8},
            occupancySensorType: {ID: 1, type: DataType.enum8},
            pirOToUDelay: {ID: 16, type: DataType.uint16},
            pirUToODelay: {ID: 17, type: DataType.uint16},
            pirUToOThreshold: {ID: 18, type: DataType.uint8},
            ultrasonicOToUDelay: {ID: 32, type: DataType.uint16},
            ultrasonicUToODelay: {ID: 33, type: DataType.uint16},
            ultrasonicUToOThreshold: {ID: 34, type: DataType.uint8},
            elkoOccupancyDfltOperationMode: {ID: 0xE000, type: DataType.enum8, manufacturerCode: ManufacturerCode.ELKO},
            elkoOccupancyOperationMode: {ID: 0xE001, type: DataType.enum8, manufacturerCode: ManufacturerCode.ELKO},
            elkoForceOffTimeout: {ID: 0xE002, type: DataType.uint16, manufacturerCode: ManufacturerCode.ELKO},
            elkoOccupancySensitivity: {ID: 0xE003, type: DataType.uint8, manufacturerCode: ManufacturerCode.ELKO},
            sprutOccupancyLevel: {ID: 0x6600, type: DataType.uint16, manufacturerCode: ManufacturerCode.SprutDevice},
            sprutOccupancySensitivity: {ID: 0x6601, type: DataType.uint16, manufacturerCode: ManufacturerCode.SprutDevice},
        },
        commands: {
        },
        commandsResponse: {
        },
    },
    msSoilMoisture: {
        ID: 1032,
        attributes: {
            measuredValue: {ID: 0, type: DataType.uint16},
            minMeasuredValue: {ID: 1, type: DataType.uint16},
            maxMeasuredValue: {ID: 2, type: DataType.uint16},
            tolerance: {ID: 3, type: DataType.uint16},
        },
        commands: {
        },
        commandsResponse: {
        },
    },
    pHMeasurement: {
        ID: 1033,
        attributes: {
            measuredValue: {ID: 0, type: DataType.uint16},
            minMeasuredValue: {ID: 1, type: DataType.uint16},
            maxMeasuredValue: {ID: 2, type: DataType.uint16},
            tolerance: {ID: 3, type: DataType.uint16},
        },
        commands: {},
        commandsResponse: {},
    },
    msCO2: {
        ID: 1037,
        attributes: {
            measuredValue: {ID: 0, type: DataType.singlePrec},
            minMeasuredValue: {ID: 1, type: DataType.singlePrec},
            maxMeasuredValue: {ID: 2, type: DataType.singlePrec},
            sprutCO2Calibration: {ID: 0x6600, type: DataType.boolean, manufacturerCode: ManufacturerCode.SprutDevice},
            sprutCO2AutoCalibration: {ID: 0x6601, type: DataType.boolean, manufacturerCode: ManufacturerCode.SprutDevice},
        },
        commands: {},
        commandsResponse: {},
    },
    ssIasZone: {
        ID: 1280,
        attributes: {
            zoneState: {ID: 0, type: DataType.enum8},
            zoneType: {ID: 1, type: DataType.enum16},
            zoneStatus: {ID: 2, type: DataType.bitmap16},
            iasCieAddr: {ID: 16, type: DataType.ieeeAddr},
            zoneId: {ID: 17, type: DataType.uint8},
            numZoneSensitivityLevelsSupported: {ID: 18, type: DataType.uint8},
            currentZoneSensitivityLevel: {ID: 19, type: DataType.uint8},
        },
        commands: {
            enrollRsp: {
                ID: 0,
                parameters: [
                    {name: 'enrollrspcode', type: DataType.uint8},
                    {name: 'zoneid', type: DataType.uint8},
                ],
            },
            initNormalOpMode: {
                ID: 1,
                parameters: [
                ],
            },
            initTestMode: {
                ID: 2,
                parameters: [
                ],
            },
        },
        commandsResponse: {
            statusChangeNotification: {
                ID: 0,
                parameters: [
                    {name: 'zonestatus', type: DataType.uint16},
                    {name: 'extendedstatus', type: DataType.uint8},
                ],
            },
            enrollReq: {
                ID: 1,
                parameters: [
                    {name: 'zonetype', type: DataType.uint16},
                    {name: 'manucode', type: DataType.uint16},
                ],
            },
        },
    },
    ssIasAce: {
        ID: 1281,
        attributes: {
        },
        commands: {
            arm: {
                ID: 0,
                response: 0,
                parameters: [
                    {name: 'armmode', type: DataType.uint8},
                    {name: 'code', type: DataType.charStr},
                    {name: 'zoneid', type: DataType.uint8},
                ],
            },
            bypass: {
                ID: 1,
                parameters: [
                    {name: 'numofzones', type: DataType.uint8},
                    {name: 'zoneidlist', type: BuffaloZclDataType.LIST_UINT8},
                ],
            },
            emergency: {
                ID: 2,
                parameters: [
                ],
            },
            fire: {
                ID: 3,
                parameters: [
                ],
            },
            panic: {
                ID: 4,
                parameters: [
                ],
            },
            getZoneIDMap: {
                ID: 5,
                response: 1,
                parameters: [
                ],
            },
            getZoneInfo: {
                ID: 6,
                response: 2,
                parameters: [
                    {name: 'zoneid', type: DataType.uint8},
                ],
            },
            getPanelStatus: {
                ID: 7,
                response: 5,
                parameters: [
                ],
            },
            getBypassedZoneList: {
                ID: 8,
                parameters: [
                ],
            },
            getZoneStatus: {
                ID: 9,
                response: 8,
                parameters: [
                    {name: 'startzoneid', type: DataType.uint8},
                    {name: 'maxnumzoneid', type: DataType.uint8},
                    {name: 'zonestatusmaskflag', type: DataType.uint8},
                    {name: 'zonestatusmask', type: DataType.uint16},
                ],
            },
        },
        commandsResponse: {
            armRsp: {
                ID: 0,
                parameters: [
                    {name: 'armnotification', type: DataType.uint8},
                ],
            },
            getZoneIDMapRsp: {
                ID: 1,
                parameters: [
                    {name: 'zoneidmapsection0', type: DataType.uint16},
                    {name: 'zoneidmapsection1', type: DataType.uint16},
                    {name: 'zoneidmapsection2', type: DataType.uint16},
                    {name: 'zoneidmapsection3', type: DataType.uint16},
                    {name: 'zoneidmapsection4', type: DataType.uint16},
                    {name: 'zoneidmapsection5', type: DataType.uint16},
                    {name: 'zoneidmapsection6', type: DataType.uint16},
                    {name: 'zoneidmapsection7', type: DataType.uint16},
                    {name: 'zoneidmapsection8', type: DataType.uint16},
                    {name: 'zoneidmapsection9', type: DataType.uint16},
                    {name: 'zoneidmapsection10', type: DataType.uint16},
                    {name: 'zoneidmapsection11', type: DataType.uint16},
                    {name: 'zoneidmapsection12', type: DataType.uint16},
                    {name: 'zoneidmapsection13', type: DataType.uint16},
                    {name: 'zoneidmapsection14', type: DataType.uint16},
                    {name: 'zoneidmapsection15', type: DataType.uint16},
                ],
            },
            getZoneInfoRsp: {
                ID: 2,
                parameters: [
                    {name: 'zoneid', type: DataType.uint8},
                    {name: 'zonetype', type: DataType.uint16},
                    {name: 'ieeeaddr', type: DataType.ieeeAddr},
                    {name: 'zonelabel', type: DataType.charStr},
                ],
            },
            zoneStatusChanged: {
                ID: 3,
                parameters: [
                    {name: 'zoneid', type: DataType.uint8},
                    {name: 'zonestatus', type: DataType.uint16},
                    {name: 'audiblenotif', type: DataType.uint8},
                    {name: 'zonelabel', type: DataType.charStr},
                ],
            },
            panelStatusChanged: {
                ID: 4,
                parameters: [
                    {name: 'panelstatus', type: DataType.uint8},
                    {name: 'secondsremain', type: DataType.uint8},
                    {name: 'audiblenotif', type: DataType.uint8},
                    {name: 'alarmstatus', type: DataType.uint8},
                ],
            },
            getPanelStatusRsp: {
                ID: 5,
                parameters: [
                    {name: 'panelstatus', type: DataType.uint8},
                    {name: 'secondsremain', type: DataType.uint8},
                    {name: 'audiblenotif', type: DataType.uint8},
                    {name: 'alarmstatus', type: DataType.uint8},
                ],
            },
            setBypassedZoneList: {
                ID: 6,
                parameters: [
                    {name: 'numofzones', type: DataType.uint8},
                    {name: 'zoneid', type: BuffaloZclDataType.LIST_UINT8},
                ],
            },
            bypassRsp: {
                ID: 7,
                parameters: [
                    {name: 'numofzones', type: DataType.uint8},
                    {name: 'bypassresult', type: BuffaloZclDataType.LIST_UINT8},
                ],
            },
            getZoneStatusRsp: {
                ID: 8,
                parameters: [
                    {name: 'zonestatuscomplete', type: DataType.uint8},
                    {name: 'numofzones', type: DataType.uint8},
                    {name: 'zoneinfo', type: BuffaloZclDataType.LIST_ZONEINFO},
                ],
            },
        },
    },
    ssIasWd: {
        ID: 1282,
        attributes: {
            maxDuration: {ID: 0, type: DataType.uint16},
        },
        commands: {
            startWarning: {
                ID: 0,
                parameters: [
                    {name: 'startwarninginfo', type: DataType.uint8},
                    {name: 'warningduration', type: DataType.uint16},
                    {name: 'strobedutycycle', type: DataType.uint8},
                    {name: 'strobelevel', type: DataType.uint8},
                ],
            },
            squawk: {
                ID: 1,
                parameters: [
                    {name: 'squawkinfo', type: DataType.uint8},
                ],
            },
        },
        commandsResponse: {
        },
    },
    piGenericTunnel: {
        ID: 1536,
        attributes: {
            maxIncomeTransSize: {ID: 1, type: DataType.uint16},
            maxOutgoTransSize: {ID: 2, type: DataType.uint16},
            protocolAddr: {ID: 3, type: DataType.octetStr},
        },
        commands: {
            matchProtocolAddr: {
                ID: 0,
                parameters: [
                    {name: 'protocoladdr', type: DataType.charStr},
                ],
            },
        },
        commandsResponse: {
            matchProtocolAddrRsp: {
                ID: 0,
                parameters: [
                    {name: 'devieeeaddr', type: DataType.ieeeAddr},
                    {name: 'protocoladdr', type: DataType.charStr},
                ],
            },
            advertiseProtocolAddr: {
                ID: 1,
                parameters: [
                    {name: 'protocoladdr', type: DataType.charStr},
                ],
            },
        },
    },
    piBacnetProtocolTunnel: {
        ID: 1537,
        attributes: {
        },
        commands: {
            transferNpdu: {
                ID: 0,
                parameters: [
                    {name: 'npdu', type: DataType.uint8},
                ],
            },
        },
        commandsResponse: {
        },
    },
    piAnalogInputReg: {
        ID: 1538,
        attributes: {
            covIncrement: {ID: 22, type: DataType.singlePrec},
            deviceType: {ID: 31, type: DataType.charStr},
            objectId: {ID: 75, type: DataType.bacOid},
            objectName: {ID: 77, type: DataType.charStr},
            objectType: {ID: 79, type: DataType.enum16},
            updateInterval: {ID: 118, type: DataType.uint8},
            profileName: {ID: 168, type: DataType.charStr},
        },
        commands: {
        },
        commandsResponse: {
        },
    },
    piAnalogInputExt: {
        ID: 1539,
        attributes: {
            ackedTransitions: {ID: 0, type: DataType.bitmap8},
            notificationClass: {ID: 17, type: DataType.uint16},
            deadband: {ID: 25, type: DataType.singlePrec},
            eventEnable: {ID: 35, type: DataType.bitmap8},
            eventState: {ID: 36, type: DataType.enum8},
            highLimit: {ID: 45, type: DataType.singlePrec},
            limitEnable: {ID: 52, type: DataType.bitmap8},
            lowLimit: {ID: 59, type: DataType.singlePrec},
            notifyType: {ID: 72, type: DataType.enum8},
            timeDelay: {ID: 113, type: DataType.uint8},
            eventTimeStamps: {ID: 130, type: DataType.array},
        },
        commands: {
            transferApdu: {
                ID: 0,
                parameters: [
                ],
            },
            connectReq: {
                ID: 1,
                parameters: [
                ],
            },
            disconnectReq: {
                ID: 2,
                parameters: [
                ],
            },
            connectStatusNoti: {
                ID: 3,
                parameters: [
                ],
            },
        },
        commandsResponse: {
        },
    },
    piAnalogOutputReg: {
        ID: 1540,
        attributes: {
            covIncrement: {ID: 22, type: DataType.singlePrec},
            deviceType: {ID: 31, type: DataType.charStr},
            objectId: {ID: 75, type: DataType.bacOid},
            objectName: {ID: 77, type: DataType.charStr},
            objectType: {ID: 79, type: DataType.enum16},
            updateInterval: {ID: 118, type: DataType.uint8},
            profileName: {ID: 168, type: DataType.charStr},
        },
        commands: {
        },
        commandsResponse: {
        },
    },
    piAnalogOutputExt: {
        ID: 1541,
        attributes: {
            ackedTransitions: {ID: 0, type: DataType.bitmap8},
            notificationClass: {ID: 17, type: DataType.uint16},
            deadband: {ID: 25, type: DataType.singlePrec},
            eventEnable: {ID: 35, type: DataType.bitmap8},
            eventState: {ID: 36, type: DataType.enum8},
            highLimit: {ID: 45, type: DataType.singlePrec},
            limitEnable: {ID: 52, type: DataType.bitmap8},
            lowLimit: {ID: 59, type: DataType.singlePrec},
            notifyType: {ID: 72, type: DataType.enum8},
            timeDelay: {ID: 113, type: DataType.uint8},
            eventTimeStamps: {ID: 130, type: DataType.array},
        },
        commands: {
        },
        commandsResponse: {
        },
    },
    piAnalogValueReg: {
        ID: 1542,
        attributes: {
            covIncrement: {ID: 22, type: DataType.singlePrec},
            objectId: {ID: 75, type: DataType.bacOid},
            objectName: {ID: 77, type: DataType.charStr},
            objectType: {ID: 79, type: DataType.enum16},
            profileName: {ID: 168, type: DataType.charStr},
        },
        commands: {
        },
        commandsResponse: {
        },
    },
    piAnalogValueExt: {
        ID: 1543,
        attributes: {
            ackedTransitions: {ID: 0, type: DataType.bitmap8},
            notificationClass: {ID: 17, type: DataType.uint16},
            deadband: {ID: 25, type: DataType.singlePrec},
            eventEnable: {ID: 35, type: DataType.bitmap8},
            eventState: {ID: 36, type: DataType.enum8},
            highLimit: {ID: 45, type: DataType.singlePrec},
            limitEnable: {ID: 52, type: DataType.bitmap8},
            lowLimit: {ID: 59, type: DataType.singlePrec},
            notifyType: {ID: 72, type: DataType.enum8},
            timeDelay: {ID: 113, type: DataType.uint8},
            eventTimeStamps: {ID: 130, type: DataType.array},
        },
        commands: {
        },
        commandsResponse: {
        },
    },
    piBinaryInputReg: {
        ID: 1544,
        attributes: {
            changeOfStateCount: {ID: 15, type: DataType.uint32},
            changeOfStateTime: {ID: 16, type: DataType.struct},
            deviceType: {ID: 31, type: DataType.charStr},
            elapsedActiveTime: {ID: 33, type: DataType.uint32},
            objectIdentifier: {ID: 75, type: DataType.bacOid},
            objectName: {ID: 77, type: DataType.charStr},
            objectType: {ID: 79, type: DataType.enum16},
            timeOfATReset: {ID: 114, type: DataType.struct},
            timeOfSCReset: {ID: 115, type: DataType.struct},
            profileName: {ID: 168, type: DataType.charStr},
        },
        commands: {
        },
        commandsResponse: {
        },
    },
    piBinaryInputExt: {
        ID: 1545,
        attributes: {
            ackedTransitions: {ID: 0, type: DataType.bitmap8},
            alarmValue: {ID: 6, type: DataType.boolean},
            notificationClass: {ID: 17, type: DataType.uint16},
            eventEnable: {ID: 35, type: DataType.bitmap8},
            eventState: {ID: 36, type: DataType.enum8},
            notifyType: {ID: 72, type: DataType.enum8},
            timeDelay: {ID: 113, type: DataType.uint8},
            eventTimeStamps: {ID: 130, type: DataType.array},
        },
        commands: {
        },
        commandsResponse: {
        },
    },
    piBinaryOutputReg: {
        ID: 1546,
        attributes: {
            changeOfStateCount: {ID: 15, type: DataType.uint32},
            changeOfStateTime: {ID: 16, type: DataType.struct},
            deviceType: {ID: 31, type: DataType.charStr},
            elapsedActiveTime: {ID: 33, type: DataType.uint32},
            feedBackValue: {ID: 40, type: DataType.enum8},
            objectIdentifier: {ID: 75, type: DataType.bacOid},
            objectName: {ID: 77, type: DataType.charStr},
            objectType: {ID: 79, type: DataType.enum16},
            timeOfATReset: {ID: 114, type: DataType.struct},
            timeOfSCReset: {ID: 115, type: DataType.struct},
            profileName: {ID: 168, type: DataType.charStr},
        },
        commands: {
        },
        commandsResponse: {
        },
    },
    piBinaryOutputExt: {
        ID: 1547,
        attributes: {
            ackedTransitions: {ID: 0, type: DataType.bitmap8},
            notificationClass: {ID: 17, type: DataType.uint16},
            eventEnable: {ID: 35, type: DataType.bitmap8},
            eventState: {ID: 36, type: DataType.enum8},
            notifyType: {ID: 72, type: DataType.enum8},
            timeDelay: {ID: 113, type: DataType.uint8},
            eventTimeStamps: {ID: 130, type: DataType.array},
        },
        commands: {
        },
        commandsResponse: {
        },
    },
    piBinaryValueReg: {
        ID: 1548,
        attributes: {
            changeOfStateCount: {ID: 15, type: DataType.uint32},
            changeOfStateTime: {ID: 16, type: DataType.struct},
            elapsedActiveTime: {ID: 33, type: DataType.uint32},
            objectIdentifier: {ID: 75, type: DataType.bacOid},
            objectName: {ID: 77, type: DataType.charStr},
            objectType: {ID: 79, type: DataType.enum16},
            timeOfATReset: {ID: 114, type: DataType.struct},
            timeOfSCReset: {ID: 115, type: DataType.struct},
            profileName: {ID: 168, type: DataType.charStr},
        },
        commands: {
        },
        commandsResponse: {
        },
    },
    piBinaryValueExt: {
        ID: 1549,
        attributes: {
            ackedTransitions: {ID: 0, type: DataType.bitmap8},
            alarmValue: {ID: 6, type: DataType.boolean},
            notificationClass: {ID: 17, type: DataType.uint16},
            eventEnable: {ID: 35, type: DataType.bitmap8},
            eventState: {ID: 36, type: DataType.enum8},
            notifyType: {ID: 72, type: DataType.enum8},
            timeDelay: {ID: 113, type: DataType.uint8},
            eventTimeStamps: {ID: 130, type: DataType.array},
        },
        commands: {
        },
        commandsResponse: {
        },
    },
    piMultistateInputReg: {
        ID: 1550,
        attributes: {
            deviceType: {ID: 31, type: DataType.charStr},
            objectId: {ID: 75, type: DataType.bacOid},
            objectName: {ID: 77, type: DataType.charStr},
            objectType: {ID: 79, type: DataType.enum16},
            profileName: {ID: 168, type: DataType.charStr},
        },
        commands: {
        },
        commandsResponse: {
        },
    },
    piMultistateInputExt: {
        ID: 1551,
        attributes: {
            ackedTransitions: {ID: 0, type: DataType.bitmap8},
            alarmValue: {ID: 6, type: DataType.uint16},
            notificationClass: {ID: 17, type: DataType.uint16},
            eventEnable: {ID: 35, type: DataType.bitmap8},
            eventState: {ID: 36, type: DataType.enum8},
            faultValues: {ID: 37, type: DataType.uint16},
            notifyType: {ID: 72, type: DataType.enum8},
            timeDelay: {ID: 113, type: DataType.uint8},
            eventTimeStamps: {ID: 130, type: DataType.array},
        },
        commands: {
        },
        commandsResponse: {
        },
    },
    piMultistateOutputReg: {
        ID: 1552,
        attributes: {
            deviceType: {ID: 31, type: DataType.charStr},
            feedBackValue: {ID: 40, type: DataType.enum8},
            objectId: {ID: 75, type: DataType.bacOid},
            objectName: {ID: 77, type: DataType.charStr},
            objectType: {ID: 79, type: DataType.enum16},
            profileName: {ID: 168, type: DataType.charStr},
        },
        commands: {
        },
        commandsResponse: {
        },
    },
    piMultistateOutputExt: {
        ID: 1553,
        attributes: {
            ackedTransitions: {ID: 0, type: DataType.bitmap8},
            notificationClass: {ID: 17, type: DataType.uint16},
            eventEnable: {ID: 35, type: DataType.bitmap8},
            eventState: {ID: 36, type: DataType.enum8},
            notifyType: {ID: 72, type: DataType.enum8},
            timeDelay: {ID: 113, type: DataType.uint8},
            eventTimeStamps: {ID: 130, type: DataType.array},
        },
        commands: {
        },
        commandsResponse: {
        },
    },
    piMultistateValueReg: {
        ID: 1554,
        attributes: {
            objectId: {ID: 75, type: DataType.bacOid},
            objectName: {ID: 77, type: DataType.charStr},
            objectType: {ID: 79, type: DataType.enum16},
            profileName: {ID: 168, type: DataType.charStr},
        },
        commands: {
        },
        commandsResponse: {
        },
    },
    piMultistateValueExt: {
        ID: 1555,
        attributes: {
            ackedTransitions: {ID: 0, type: DataType.bitmap8},
            alarmValue: {ID: 6, type: DataType.uint16},
            notificationClass: {ID: 17, type: DataType.uint16},
            eventEnable: {ID: 35, type: DataType.bitmap8},
            eventState: {ID: 36, type: DataType.enum8},
            faultValues: {ID: 37, type: DataType.uint16},
            notifyType: {ID: 72, type: DataType.enum8},
            timeDelay: {ID: 113, type: DataType.uint8},
            eventTimeStamps: {ID: 130, type: DataType.array},
        },
        commands: {
        },
        commandsResponse: {
        },
    },
    pi11073ProtocolTunnel: {
        ID: 1556,
        attributes: {
            deviceidList: {ID: 0, type: DataType.array},
            managerTarget: {ID: 1, type: DataType.ieeeAddr},
            managerEndpoint: {ID: 2, type: DataType.uint8},
            connected: {ID: 3, type: DataType.boolean},
            preemptible: {ID: 4, type: DataType.boolean},
            idleTimeout: {ID: 5, type: DataType.uint16},
        },
        commands: {
            transferApdu: {
                ID: 0,
                parameters: [
                ],
            },
            connectReq: {
                ID: 1,
                parameters: [
                ],
            },
            disconnectReq: {
                ID: 2,
                parameters: [
                ],
            },
            connectStatusNoti: {
                ID: 3,
                parameters: [
                ],
            },
        },
        commandsResponse: {
        },
    },
    piIso7818ProtocolTunnel: {
        ID: 1557,
        attributes: {
            status: {ID: 0, type: DataType.uint8},
        },
        commands: {
        },
        commandsResponse: {
        },
    },
    piRetailTunnel: {
        ID: 1559,
        attributes: {
            manufacturerCode: {ID: 0, type: DataType.uint16},
            msProfile: {ID: 1, type: DataType.uint16},
        },
        commands: {
        },
        commandsResponse: {
        },
    },
    seMetering: {
        ID: 1794,
        attributes: {
            currentSummDelivered: {ID: 0, type: DataType.uint48},
            currentSummReceived: {ID: 1, type: DataType.uint48},
            currentMaxDemandDelivered: {ID: 2, type: DataType.uint48},
            currentMaxDemandReceived: {ID: 3, type: DataType.uint48},
            dftSumm: {ID: 4, type: DataType.uint48},
            dailyFreezeTime: {ID: 5, type: DataType.uint16},
            powerFactor: {ID: 6, type: DataType.int8},
            readingSnapshotTime: {ID: 7, type: DataType.utc},
            currentMaxDemandDeliverdTime: {ID: 8, type: DataType.utc},
            currentMaxDemandReceivedTime: {ID: 9, type: DataType.utc},
            defaultUpdatePeriod: {ID: 10, type: DataType.uint8},
            fastPollUpdatePeriod: {ID: 11, type: DataType.uint8},
            currentBlockPeriodConsumpDelivered: {ID: 12, type: DataType.uint48},
            dailyConsumpTarget: {ID: 13, type: DataType.uint24},
            currentBlock: {ID: 14, type: DataType.enum8},
            profileIntervalPeriod: {ID: 15, type: DataType.enum8},
            intervalReadReportingPeriod: {ID: 16, type: DataType.uint16},
            presetReadingTime: {ID: 17, type: DataType.uint16},
            volumePerReport: {ID: 18, type: DataType.uint16},
            flowRestriction: {ID: 19, type: DataType.uint8},
            supplyStatus: {ID: 20, type: DataType.enum8},
            currentInEnergyCarrierSumm: {ID: 21, type: DataType.uint48},
            currentOutEnergyCarrierSumm: {ID: 22, type: DataType.uint48},
            inletTempreature: {ID: 23, type: DataType.int24},
            outletTempreature: {ID: 24, type: DataType.int24},
            controlTempreature: {ID: 25, type: DataType.int24},
            currentInEnergyCarrierDemand: {ID: 26, type: DataType.int24},
            currentOutEnergyCarrierDemand: {ID: 27, type: DataType.int24},
            currentBlockPeriodConsumpReceived: {ID: 29, type: DataType.uint48},
            currentBlockReceived: {ID: 30, type: DataType.uint48},
            DFTSummationReceived: {ID: 31, type: DataType.uint48},
            activeRegisterTierDelivered: {ID: 32, type: DataType.enum8},
            activeRegisterTierReceived: {ID: 33, type: DataType.enum8},
            currentTier1SummDelivered: {ID: 256, type: DataType.uint48},
            currentTier1SummReceived: {ID: 257, type: DataType.uint48},
            currentTier2SummDelivered: {ID: 258, type: DataType.uint48},
            currentTier2SummReceived: {ID: 259, type: DataType.uint48},
            currentTier3SummDelivered: {ID: 260, type: DataType.uint48},
            currentTier3SummReceived: {ID: 261, type: DataType.uint48},
            currentTier4SummDelivered: {ID: 262, type: DataType.uint48},
            currentTier4SummReceived: {ID: 263, type: DataType.uint48},
            currentTier5SummDelivered: {ID: 264, type: DataType.uint48},
            currentTier5SummReceived: {ID: 265, type: DataType.uint48},
            currentTier6SummDelivered: {ID: 266, type: DataType.uint48},
            currentTier6SummReceived: {ID: 267, type: DataType.uint48},
            currentTier7SummDelivered: {ID: 268, type: DataType.uint48},
            currentTier7SummReceived: {ID: 269, type: DataType.uint48},
            currentTier8SummDelivered: {ID: 270, type: DataType.uint48},
            currentTier8SummReceived: {ID: 271, type: DataType.uint48},
            currentTier9SummDelivered: {ID: 272, type: DataType.uint48},
            currentTier9SummReceived: {ID: 273, type: DataType.uint48},
            currentTier10SummDelivered: {ID: 274, type: DataType.uint48},
            currentTier10SummReceived: {ID: 275, type: DataType.uint48},
            currentTier11SummDelivered: {ID: 276, type: DataType.uint48},
            currentTier11SummReceived: {ID: 277, type: DataType.uint48},
            currentTier12SummDelivered: {ID: 278, type: DataType.uint48},
            currentTier12SummReceived: {ID: 279, type: DataType.uint48},
            currentTier13SummDelivered: {ID: 280, type: DataType.uint48},
            currentTier13SummReceived: {ID: 281, type: DataType.uint48},
            currentTier14SummDelivered: {ID: 282, type: DataType.uint48},
            currentTier14SummReceived: {ID: 283, type: DataType.uint48},
            currentTier15SummDelivered: {ID: 284, type: DataType.uint48},
            currentTier15SummReceived: {ID: 285, type: DataType.uint48},
            status: {ID: 512, type: DataType.bitmap8},
            remainingBattLife: {ID: 513, type: DataType.uint8},
            hoursInOperation: {ID: 514, type: DataType.uint24},
            hoursInFault: {ID: 515, type: DataType.uint24},
            extendedStatus: {ID: 516, type: DataType.bitmap64},
            unitOfMeasure: {ID: 768, type: DataType.enum8},
            multiplier: {ID: 769, type: DataType.uint24},
            divisor: {ID: 770, type: DataType.uint24},
            summaFormatting: {ID: 771, type: DataType.bitmap8},
            demandFormatting: {ID: 772, type: DataType.bitmap8},
            historicalConsumpFormatting: {ID: 773, type: DataType.bitmap8},
            meteringDeviceType: {ID: 774, type: DataType.bitmap8},
            siteId: {ID: 775, type: DataType.octetStr},
            meterSerialNumber: {ID: 776, type: DataType.octetStr},
            energyCarrierUnitOfMeas: {ID: 777, type: DataType.enum8},
            energyCarrierSummFormatting: {ID: 778, type: DataType.bitmap8},
            energyCarrierDemandFormatting: {ID: 779, type: DataType.bitmap8},
            temperatureUnitOfMeas: {ID: 780, type: DataType.enum8},
            temperatureFormatting: {ID: 781, type: DataType.bitmap8},
            moduleSerialNumber: {ID: 782, type: DataType.octetStr},
            operatingTariffLevel: {ID: 783, type: DataType.octetStr},
            instantaneousDemand: {ID: 1024, type: DataType.int24},
            currentdayConsumpDelivered: {ID: 1025, type: DataType.uint24},
            currentdayConsumpReceived: {ID: 1026, type: DataType.uint24},
            previousdayConsumpDelivered: {ID: 1027, type: DataType.uint24},
            previousdayConsumpReceived: {ID: 1028, type: DataType.uint24},
            curPartProfileIntStartTimeDelivered: {ID: 1029, type: DataType.utc},
            curPartProfileIntStartTimeReceived: {ID: 1030, type: DataType.utc},
            curPartProfileIntValueDelivered: {ID: 1031, type: DataType.uint24},
            curPartProfileIntValueReceived: {ID: 1032, type: DataType.uint24},
            currentDayMaxPressure: {ID: 1033, type: DataType.uint48},
            currentDayMinPressure: {ID: 1034, type: DataType.uint48},
            previousDayMaxPressure: {ID: 1035, type: DataType.uint48},
            previousDayMinPressure: {ID: 1036, type: DataType.uint48},
            currentDayMaxDemand: {ID: 1037, type: DataType.int24},
            previousDayMaxDemand: {ID: 1038, type: DataType.int24},
            currentMonthMaxDemand: {ID: 1039, type: DataType.int24},
            currentYearMaxDemand: {ID: 1040, type: DataType.int24},
            currentdayMaxEnergyCarrDemand: {ID: 1041, type: DataType.int24},
            previousdayMaxEnergyCarrDemand: {ID: 1042, type: DataType.int24},
            curMonthMaxEnergyCarrDemand: {ID: 1043, type: DataType.int24},
            curMonthMinEnergyCarrDemand: {ID: 1044, type: DataType.int24},
            curYearMaxEnergyCarrDemand: {ID: 1045, type: DataType.int24},
            curYearMinEnergyCarrDemand: {ID: 1046, type: DataType.int24},
            maxNumberOfPeriodsDelivered: {ID: 1280, type: DataType.uint8},
            currentDemandDelivered: {ID: 1536, type: DataType.uint24},
            demandLimit: {ID: 1537, type: DataType.uint24},
            demandIntegrationPeriod: {ID: 1538, type: DataType.uint8},
            numberOfDemandSubintervals: {ID: 1539, type: DataType.uint8},
            demandLimitArmDuration: {ID: 1540, type: DataType.uint16},
            genericAlarmMask: {ID: 2048, type: DataType.bitmap16},
            electricityAlarmMask: {ID: 2049, type: DataType.bitmap32},
            genFlowPressureAlarmMask: {ID: 2050, type: DataType.bitmap16},
            waterSpecificAlarmMask: {ID: 2051, type: DataType.bitmap16},
            heatCoolSpecificAlarmMASK: {ID: 2052, type: DataType.bitmap16},
            gasSpecificAlarmMask: {ID: 2053, type: DataType.bitmap16},
            extendedGenericAlarmMask: {ID: 2054, type: DataType.bitmap48},
            manufactureAlarmMask: {ID: 2055, type: DataType.bitmap16},
            billToDate: {ID: 2560, type: DataType.uint32},
            billToDateTimeStamp: {ID: 2561, type: DataType.utc},
            projectedBill: {ID: 2562, type: DataType.uint32},
            projectedBillTimeStamp: {ID: 2563, type: DataType.utc},
            notificationControlFlags: {ID: 0, type: DataType.bitmap32},
            notificationFlags: {ID: 1, type: DataType.bitmap32},
            priceNotificationFlags: {ID: 2, type: DataType.bitmap32},
            calendarNotificationFlags: {ID: 3, type: DataType.bitmap32},
            prePayNotificationFlags: {ID: 4, type: DataType.bitmap32},
            deviceManagementFlags: {ID: 5, type: DataType.bitmap32},
            changeReportingProfile: {ID: 256, type: DataType.unknown},
            develcoPulseConfiguration: {ID: 0x0300, type: DataType.uint16, manufacturerCode: ManufacturerCode.DEVELCO},
            develcoCurrentSummation: {ID: 0x0301, type: DataType.uint48, manufacturerCode: ManufacturerCode.DEVELCO},
            develcoInterfaceMode: {ID: 0x0302, type: DataType.enum16, manufacturerCode: ManufacturerCode.DEVELCO},
        },
        commands: {
            getProfile: {
                ID: 0,
                parameters: [
                ],
            },
            reqMirror: {
                ID: 1,
                parameters: [
                ],
            },
            mirrorRem: {
                ID: 2,
                parameters: [
                ],
            },
            reqFastPollMode: {
                ID: 3,
                parameters: [
                ],
            },
            getSnapshot: {
                ID: 4,
                parameters: [
                ],
            },
            takeSnapshot: {
                ID: 5,
                parameters: [
                ],
            },
            mirrorReportAttrRsp: {
                ID: 6,
                parameters: [
                ],
            },
        },
        commandsResponse: {
            getProfileRsp: {
                ID: 0,
                parameters: [
                ],
            },
            reqMirrorRsp: {
                ID: 1,
                parameters: [
                ],
            },
            mirrorRemRsp: {
                ID: 2,
                parameters: [
                ],
            },
            reqFastPollModeRsp: {
                ID: 3,
                parameters: [
                ],
            },
            getSnapshotRsp: {
                ID: 4,
                parameters: [
                ],
            },
        },
    },
    telecommunicationsInformation: {
        ID: 2304,
        attributes: {
            nodeDescription: {ID: 0, type: DataType.charStr},
            deliveryEnable: {ID: 1, type: DataType.boolean},
            pushInformationTimer: {ID: 2, type: DataType.uint32},
            enableSecureConfiguration: {ID: 3, type: DataType.boolean},
            numberOfContents: {ID: 16, type: DataType.uint16},
            contentRootID: {ID: 17, type: DataType.uint16},
        },
        commands: {
        },
        commandsResponse: {
        },
    },
    telecommunicationsVoiceOverZigbee: {
        ID: 2308,
        attributes: {
            codecType: {ID: 0, type: DataType.enum8},
            samplingFrequency: {ID: 1, type: DataType.enum8},
            codecrate: {ID: 2, type: DataType.enum8},
            establishmentTimeout: {ID: 3, type: DataType.uint8},
            codecTypeSub1: {ID: 4, type: DataType.enum8},
            codecTypeSub2: {ID: 5, type: DataType.enum8},
            codecTypeSub3: {ID: 6, type: DataType.enum8},
            compressionType: {ID: 7, type: DataType.enum8},
            compressionRate: {ID: 8, type: DataType.enum8},
            optionFlags: {ID: 9, type: DataType.bitmap8},
            threshold: {ID: 10, type: DataType.uint8},
        },
        commands: {
        },
        commandsResponse: {
        },
    },
    telecommunicationsChatting: {
        ID: 2309,
        attributes: {
            uID: {ID: 0, type: DataType.uint16},
            nickname: {ID: 1, type: DataType.charStr},
            cID: {ID: 16, type: DataType.uint16},
            name: {ID: 17, type: DataType.charStr},
            enableAddChat: {ID: 18, type: DataType.boolean},
        },
        commands: {
        },
        commandsResponse: {
        },
    },
    haApplianceIdentification: {
        ID: 2816,
        attributes: {
            basicIdentification: {ID: 0, type: DataType.uint56},
            companyName: {ID: 16, type: DataType.charStr},
            companyId: {ID: 17, type: DataType.uint16},
            brandName: {ID: 18, type: DataType.charStr},
            brandId: {ID: 19, type: DataType.uint16},
            model: {ID: 20, type: DataType.octetStr},
            partNumber: {ID: 21, type: DataType.octetStr},
            productRevision: {ID: 22, type: DataType.octetStr},
            softwareRevision: {ID: 23, type: DataType.octetStr},
            productTypeName: {ID: 24, type: DataType.octetStr},
            productTypeId: {ID: 25, type: DataType.uint16},
            cecedSpecificationVersion: {ID: 26, type: DataType.uint8},
        },
        commands: {
        },
        commandsResponse: {
        },
    },
    haMeterIdentification: {
        ID: 2817,
        attributes: {
            companyName: {ID: 0, type: DataType.charStr},
            meterTypeId: {ID: 1, type: DataType.uint16},
            dataQualityId: {ID: 4, type: DataType.uint16},
            customerName: {ID: 5, type: DataType.charStr},
            model: {ID: 6, type: DataType.charStr},
            partNumber: {ID: 7, type: DataType.charStr},
            productRevision: {ID: 8, type: DataType.charStr},
            softwareRevision: {ID: 10, type: DataType.charStr},
            utilityName: {ID: 11, type: DataType.charStr},
            pod: {ID: 12, type: DataType.charStr},
            availablePower: {ID: 13, type: DataType.int24},
            powerThreshold: {ID: 14, type: DataType.int24},
        },
        commands: {
        },
        commandsResponse: {
        },
    },
    haApplianceEventsAlerts: {
        ID: 2818,
        attributes: {
        },
        commands: {
            getAlerts: {
                ID: 0,
                parameters: [
                ],
            },
        },
        commandsResponse: {
            getAlertsRsp: {
                ID: 0,
                parameters: [
                    {name: 'alertscount', type: DataType.uint8},
                    {name: 'aalert', type: BuffaloZclDataType.LIST_UINT24},
                ],
            },
            alertsNotification: {
                ID: 1,
                parameters: [
                    {name: 'alertscount', type: DataType.uint8},
                    {name: 'aalert', type: BuffaloZclDataType.LIST_UINT24},
                ],
            },
            eventNotification: {
                ID: 2,
                parameters: [
                    {name: 'eventheader', type: DataType.uint8},
                    {name: 'eventid', type: DataType.uint8},
                ],
            },
        },
    },
    haApplianceStatistics: {
        ID: 2819,
        attributes: {
            logMaxSize: {ID: 0, type: DataType.uint32},
            logQueueMaxSize: {ID: 1, type: DataType.uint8},
        },
        commands: {
            log: {
                ID: 0,
                parameters: [
                    {name: 'logid', type: DataType.uint32},
                ],
            },
            logQueue: {
                ID: 1,
                parameters: [
                ],
            },
        },
        commandsResponse: {
            logNotification: {
                ID: 0,
                parameters: [
                    {name: 'timestamp', type: DataType.uint32},
                    {name: 'logid', type: DataType.uint32},
                    {name: 'loglength', type: DataType.uint32},
                    {name: 'logpayload', type: BuffaloZclDataType.LIST_UINT8},
                ],
            },
            logRsp: {
                ID: 1,
                parameters: [
                    {name: 'timestamp', type: DataType.uint32},
                    {name: 'logid', type: DataType.uint32},
                    {name: 'loglength', type: DataType.uint32},
                    {name: 'logpayload', type: BuffaloZclDataType.LIST_UINT8},
                ],
            },
            logQueueRsp: {
                ID: 2,
                parameters: [
                    {name: 'logqueuesize', type: DataType.uint8},
                    {name: 'logid', type: BuffaloZclDataType.LIST_UINT32},
                ],
            },
            statisticsAvailable: {
                ID: 3,
                parameters: [
                    {name: 'logqueuesize', type: DataType.uint8},
                    {name: 'logid', type: BuffaloZclDataType.LIST_UINT32},
                ],
            },
        },
    },
    haElectricalMeasurement: {
        ID: 2820,
        attributes: {
            measurementType: {ID: 0, type: DataType.bitmap32},
            dcVoltage: {ID: 256, type: DataType.int16},
            dcVoltageMin: {ID: 257, type: DataType.int16},
            dcvoltagemax: {ID: 258, type: DataType.int16},
            dcCurrent: {ID: 259, type: DataType.int16},
            dcCurrentMin: {ID: 260, type: DataType.int16},
            dcCurrentMax: {ID: 261, type: DataType.int16},
            dcPower: {ID: 262, type: DataType.int16},
            dcPowerMin: {ID: 263, type: DataType.int16},
            dcPowerMax: {ID: 264, type: DataType.int16},
            dcVoltageMultiplier: {ID: 512, type: DataType.uint16},
            dcVoltageDivisor: {ID: 513, type: DataType.uint16},
            dcCurrentMultiplier: {ID: 514, type: DataType.uint16},
            dcCurrentDivisor: {ID: 515, type: DataType.uint16},
            dcPowerMultiplier: {ID: 516, type: DataType.uint16},
            dcPowerDivisor: {ID: 517, type: DataType.uint16},
            acFrequency: {ID: 768, type: DataType.uint16},
            acFrequencyMin: {ID: 769, type: DataType.uint16},
            acFrequencyMax: {ID: 770, type: DataType.uint16},
            neutralCurrent: {ID: 771, type: DataType.uint16},
            totalActivePower: {ID: 772, type: DataType.int32},
            totalReactivePower: {ID: 773, type: DataType.int32},
            totalApparentPower: {ID: 774, type: DataType.uint32},
            meas1stHarmonicCurrent: {ID: 775, type: DataType.int16},
            meas3rdHarmonicCurrent: {ID: 776, type: DataType.int16},
            meas5thHarmonicCurrent: {ID: 777, type: DataType.int16},
            meas7thHarmonicCurrent: {ID: 778, type: DataType.int16},
            meas9thHarmonicCurrent: {ID: 779, type: DataType.int16},
            meas11thHarmonicCurrent: {ID: 780, type: DataType.int16},
            measPhase1stHarmonicCurrent: {ID: 781, type: DataType.int16},
            measPhase3rdHarmonicCurrent: {ID: 782, type: DataType.int16},
            measPhase5thHarmonicCurrent: {ID: 783, type: DataType.int16},
            measPhase7thHarmonicCurrent: {ID: 784, type: DataType.int16},
            measPhase9thHarmonicCurrent: {ID: 785, type: DataType.int16},
            measPhase11thHarmonicCurrent: {ID: 786, type: DataType.int16},
            acFrequencyMultiplier: {ID: 1024, type: DataType.uint16},
            acFrequencyDivisor: {ID: 1025, type: DataType.uint16},
            powerMultiplier: {ID: 1026, type: DataType.uint32},
            powerDivisor: {ID: 1027, type: DataType.uint32},
            harmonicCurrentMultiplier: {ID: 1028, type: DataType.int8},
            phaseHarmonicCurrentMultiplier: {ID: 1029, type: DataType.int8},
            instantaneousVoltage: {ID: 1280, type: DataType.int16},
            instantaneousLineCurrent: {ID: 1281, type: DataType.uint16},
            instantaneousActiveCurrent: {ID: 1282, type: DataType.int16},
            instantaneousReactiveCurrent: {ID: 1283, type: DataType.int16},
            instantaneousPower: {ID: 1284, type: DataType.int16},
            rmsVoltage: {ID: 1285, type: DataType.uint16},
            rmsVoltageMin: {ID: 1286, type: DataType.uint16},
            rmsVoltageMax: {ID: 1287, type: DataType.uint16},
            rmsCurrent: {ID: 1288, type: DataType.uint16},
            rmsCurrentMin: {ID: 1289, type: DataType.uint16},
            rmsCurrentMax: {ID: 1290, type: DataType.uint16},
            activePower: {ID: 1291, type: DataType.int16},
            activePowerMin: {ID: 1292, type: DataType.int16},
            activePowerMax: {ID: 1293, type: DataType.int16},
            reactivePower: {ID: 1294, type: DataType.int16},
            apparentPower: {ID: 1295, type: DataType.uint16},
            powerFactor: {ID: 1296, type: DataType.int8},
            averageRmsVoltageMeasPeriod: {ID: 1297, type: DataType.uint16},
            averageRmsOverVoltageCounter: {ID: 1298, type: DataType.uint16},
            averageRmsUnderVoltageCounter: {ID: 1299, type: DataType.uint16},
            rmsExtremeOverVoltagePeriod: {ID: 1300, type: DataType.uint16},
            rmsExtremeUnderVoltagePeriod: {ID: 1301, type: DataType.uint16},
            rmsVoltageSagPeriod: {ID: 1302, type: DataType.uint16},
            rmsVoltageSwellPeriod: {ID: 1303, type: DataType.uint16},
            acVoltageMultiplier: {ID: 1536, type: DataType.uint16},
            acVoltageDivisor: {ID: 1537, type: DataType.uint16},
            acCurrentMultiplier: {ID: 1538, type: DataType.uint16},
            acCurrentDivisor: {ID: 1539, type: DataType.uint16},
            acPowerMultiplier: {ID: 1540, type: DataType.uint16},
            acPowerDivisor: {ID: 1541, type: DataType.uint16},
            dcOverloadAlarmsMask: {ID: 1792, type: DataType.bitmap8},
            dcVoltageOverload: {ID: 1793, type: DataType.int16},
            dcCurrentOverload: {ID: 1794, type: DataType.int16},
            acAlarmsMask: {ID: 2048, type: DataType.bitmap16},
            acVoltageOverload: {ID: 2049, type: DataType.int16},
            acCurrentOverload: {ID: 2050, type: DataType.int16},
            acActivePowerOverload: {ID: 2051, type: DataType.int16},
            acReactivePowerOverload: {ID: 2052, type: DataType.int16},
            averageRmsOverVoltage: {ID: 2053, type: DataType.int16},
            averageRmsUnderVoltage: {ID: 2054, type: DataType.int16},
            rmsExtremeOverVoltage: {ID: 2055, type: DataType.int16},
            rmsExtremeUnderVoltage: {ID: 2056, type: DataType.int16},
            rmsVoltageSag: {ID: 2057, type: DataType.int16},
            rmsVoltageSwell: {ID: 2058, type: DataType.int16},
            lineCurrentPhB: {ID: 2305, type: DataType.uint16},
            activeCurrentPhB: {ID: 2306, type: DataType.int16},
            reactiveCurrentPhB: {ID: 2307, type: DataType.int16},
            rmsVoltagePhB: {ID: 2309, type: DataType.uint16},
            rmsVoltageMinPhB: {ID: 2310, type: DataType.uint16},
            rmsVoltageMaxPhB: {ID: 2311, type: DataType.uint16},
            rmsCurrentPhB: {ID: 2312, type: DataType.uint16},
            rmsCurrentMinPhB: {ID: 2313, type: DataType.uint16},
            rmsCurrentMaxPhB: {ID: 2314, type: DataType.uint16},
            activePowerPhB: {ID: 2315, type: DataType.int16},
            activePowerMinPhB: {ID: 2316, type: DataType.int16},
            activePowerMaxPhB: {ID: 2317, type: DataType.int16},
            reactivePowerPhB: {ID: 2318, type: DataType.int16},
            apparentPowerPhB: {ID: 2319, type: DataType.uint16},
            powerFactorPhB: {ID: 2320, type: DataType.int8},
            averageRmsVoltageMeasurePeriodPhB: {ID: 2321, type: DataType.uint16},
            averageRmsOverVoltageCounterPhB: {ID: 2322, type: DataType.uint16},
            averageUnderVoltageCounterPhB: {ID: 2323, type: DataType.uint16},
            rmsExtremeOverVoltagePeriodPhB: {ID: 2324, type: DataType.uint16},
            rmsExtremeUnderVoltagePeriodPhB: {ID: 2325, type: DataType.uint16},
            rmsVoltageSagPeriodPhB: {ID: 2326, type: DataType.uint16},
            rmsVoltageSwellPeriodPhB: {ID: 2327, type: DataType.uint16},
            lineCurrentPhC: {ID: 2561, type: DataType.uint16},
            activeCurrentPhC: {ID: 2562, type: DataType.int16},
            reactiveCurrentPhC: {ID: 2563, type: DataType.int16},
            rmsVoltagePhC: {ID: 2565, type: DataType.uint16},
            rmsVoltageMinPhC: {ID: 2566, type: DataType.uint16},
            rmsVoltageMaxPhC: {ID: 2567, type: DataType.uint16},
            rmsCurrentPhC: {ID: 2568, type: DataType.uint16},
            rmsCurrentMinPhC: {ID: 2569, type: DataType.uint16},
            rmsCurrentMaxPhC: {ID: 2570, type: DataType.uint16},
            activePowerPhC: {ID: 2571, type: DataType.int16},
            activePowerMinPhC: {ID: 2572, type: DataType.int16},
            activePowerMaxPhC: {ID: 2573, type: DataType.int16},
            reactivePowerPhC: {ID: 2574, type: DataType.int16},
            apparentPowerPhC: {ID: 2575, type: DataType.uint16},
            powerFactorPhC: {ID: 2576, type: DataType.int8},
            averageRmsVoltageMeasPeriodPhC: {ID: 2577, type: DataType.uint16},
            averageRmsOverVoltageCounterPhC: {ID: 2578, type: DataType.uint16},
            averageUnderVoltageCounterPhC: {ID: 2579, type: DataType.uint16},
            rmsExtremeOverVoltagePeriodPhC: {ID: 2580, type: DataType.uint16},
            rmsExtremeUnderVoltagePeriodPhC: {ID: 2581, type: DataType.uint16},
            rmsVoltageSagPeriodPhC: {ID: 2582, type: DataType.uint16},
            rmsVoltageSwellPeriodPhC: {ID: 2583, type: DataType.uint16},
        },
        commands: {
            getProfileInfo: {
                ID: 0,
                parameters: [
                ],
            },
            getMeasurementProfile: {
                ID: 1,
                parameters: [
                    {name: 'attrId', type: DataType.uint16},
                    {name: 'starttime', type: DataType.uint32},
                    {name: 'numofuntervals', type: DataType.uint8},
                ],
            },
        },
        commandsResponse: {
            getProfileInfoRsp: {
                ID: 0,
                parameters: [
                    {name: 'profilecount', type: DataType.uint8},
                    {name: 'profileintervalperiod', type: DataType.uint8},
                    {name: 'maxnumofintervals', type: DataType.uint8},
                    {name: 'numofattrs', type: DataType.uint8},
                    {name: 'listofattr', type: BuffaloZclDataType.LIST_UINT16},
                ],
            },
            getMeasurementProfileRsp: {
                ID: 1,
                parameters: [
                    {name: 'starttime', type: DataType.uint32},
                    {name: 'status', type: DataType.uint8},
                    {name: 'profileintervalperiod', type: DataType.uint8},
                    {name: 'numofintervalsdeliv', type: DataType.uint8},
                    {name: 'attrId', type: DataType.uint16},
                    {name: 'intervals', type: BuffaloZclDataType.LIST_UINT8},
                ],
            },
        },
    },
    haDiagnostic: {
        ID: 2821,
        attributes: {
            numberOfResets: {ID: 0, type: DataType.uint16},
            persistentMemoryWrites: {ID: 1, type: DataType.uint16},
            macRxBcast: {ID: 256, type: DataType.uint32},
            macTxBcast: {ID: 257, type: DataType.uint32},
            macRxUcast: {ID: 258, type: DataType.uint32},
            macTxUcast: {ID: 259, type: DataType.uint32},
            macTxUcastRetry: {ID: 260, type: DataType.uint16},
            macTxUcastFail: {ID: 261, type: DataType.uint16},
            aPSRxBcast: {ID: 262, type: DataType.uint16},
            aPSTxBcast: {ID: 263, type: DataType.uint16},
            aPSRxUcast: {ID: 264, type: DataType.uint16},
            aPSTxUcastSuccess: {ID: 265, type: DataType.uint16},
            aPSTxUcastRetry: {ID: 266, type: DataType.uint16},
            aPSTxUcastFail: {ID: 267, type: DataType.uint16},
            routeDiscInitiated: {ID: 268, type: DataType.uint16},
            neighborAdded: {ID: 269, type: DataType.uint16},
            neighborRemoved: {ID: 270, type: DataType.uint16},
            neighborStale: {ID: 271, type: DataType.uint16},
            joinIndication: {ID: 272, type: DataType.uint16},
            childMoved: {ID: 273, type: DataType.uint16},
            nwkFcFailure: {ID: 274, type: DataType.uint16},
            apsFcFailure: {ID: 275, type: DataType.uint16},
            apsUnauthorizedKey: {ID: 276, type: DataType.uint16},
            nwkDecryptFailures: {ID: 277, type: DataType.uint16},
            apsDecryptFailures: {ID: 278, type: DataType.uint16},
            packetBufferAllocateFailures: {ID: 279, type: DataType.uint16},
            relayedUcast: {ID: 280, type: DataType.uint16},
            phyToMacQueueLimitReached: {ID: 281, type: DataType.uint16},
            packetValidateDropCount: {ID: 282, type: DataType.uint16},
            averageMacRetryPerApsMessageSent: {ID: 283, type: DataType.uint16},
            lastMessageLqi: {ID: 284, type: DataType.uint8},
            lastMessageRssi: {ID: 285, type: DataType.int8},
            danfossSystemStatusCode: {ID: 0x4000, type: DataType.bitmap16, manufacturerCode: ManufacturerCode.DANFOSS},
            danfossSystemStatusWater: {ID: 0x4200, type: DataType.enum8, manufacturerCode: ManufacturerCode.DANFOSS},
            danfossMultimasterRole: {ID: 0x4201, type: DataType.enum8, manufacturerCode: ManufacturerCode.DANFOSS},
        },
        commands: {
        },
        commandsResponse: {
        },
    },
    touchlink: {
        ID: 4096,
        attributes: {
        },
        commands: {
            scanRequest: {
                ID: 0,
                response: 1,
                parameters: [
                    {name: 'transactionID', type: DataType.uint32},
                    {name: 'zigbeeInformation', type: DataType.bitmap8},
                    {name: 'touchlinkInformation', type: DataType.bitmap8},
                ],
            },
            identifyRequest: {
                ID: 6,
                parameters: [
                    {name: 'transactionID', type: DataType.uint32},
                    {name: 'duration', type: DataType.uint16},
                ],
            },
            resetToFactoryNew: {
                ID: 7,
                parameters: [
                    {name: 'transactionID', type: DataType.uint32},
                ],
            },
        },
        commandsResponse: {
            scanResponse: {
                ID: 1,
                parameters: [
                    {name: 'transactionID', type: DataType.uint32},
                    {name: 'rssiCorrection', type: DataType.uint8},
                    {name: 'zigbeeInformation', type: DataType.uint8},
                    {name: 'touchlinkInformation', type: DataType.uint8},
                    {name: 'keyBitmask', type: DataType.uint16},
                    {name: 'responseID', type: DataType.uint32},
                    {name: 'extendedPanID', type: DataType.ieeeAddr},
                    {name: 'networkUpdateID', type: DataType.uint8},
                    {name: 'logicalChannel', type: DataType.uint8},
                    {name: 'panID', type: DataType.uint16},
                    {name: 'networkAddress', type: DataType.uint16},
                    {name: 'numberOfSubDevices', type: DataType.uint8},
                    {name: 'totalGroupIdentifiers', type: DataType.uint8},
                    // Below are optional according to the spec, not all devices send these.
                    // e.g. https://github.com/Koenkk/zigbee2mqtt/issues/8535#issuecomment-909199162
                    // Since we don't have a way to deal with optional attributes yet and since we don't
                    // use these attributes anyway, disable them for now.
                    // {name: 'endpointID', type: DataType.uint8},
                    // {name: 'profileID', type: DataType.uint16},
                    // {name: 'deviceID', type: DataType.uint16},
                    // {name: 'version', type: DataType.uint8},
                    // {name: 'groupIdentifierCount', type: DataType.uint8},
                ],
            },
        },
    },
    manuSpecificIkeaAirPurifier: {
        ID: 0xfc7d,
        manufacturerCode: ManufacturerCode.IKEA_OF_SWEDEN,
        attributes: {
            filterRunTime: {ID: 0x0000, type: DataType.uint32},
            replaceFilter: {ID: 0x0001, type: DataType.uint8},
            filterLifeTime: {ID: 0x0002, type: DataType.uint32},
            controlPanelLight: {ID: 0x0003, type: DataType.boolean},
            particulateMatter25Measurement: {ID: 0x0004, type: DataType.uint16},
            childLock: {ID: 0x0005, type: DataType.boolean},
            fanMode: {ID: 0x0006, type: DataType.uint8},
            fanSpeed: {ID: 0x0007, type: DataType.uint8},
            deviceRunTime: {ID: 0x0008, type: DataType.uint32},
        },
        commands: {},
        commandsResponse: {},
    },
    manuSpecificClusterAduroSmart: {
        ID: 64716,
        attributes: {
        },
        commands: {
            cmd0: {
                ID: 0,
                parameters: [
                ],
            },
        },
        commandsResponse: {
        },
    },
    manuSpecificOsram: {
        ID: 64527,
        attributes: {
        },
        commands: {
            saveStartupParams: {
                ID: 1,
                parameters: [
                ],
            },
            resetStartupParams: {
                ID: 2,
                parameters: [
                ],
            },
        },
        commandsResponse: {
            saveStartupParamsRsp: {
                ID: 0,
                parameters: [
                ],
            },
        },
    },
    manuSpecificPhilips: {
        ID: 64512,
        attributes: {
            config: {ID: 49, type: DataType.bitmap16},
        },
        commands: {
        },
        commandsResponse: {
            hueNotification: {
                ID: 0,
                parameters: [
                    {name: 'button', type: DataType.uint8},
                    {name: 'unknown1', type: DataType.uint24},
                    {name: 'type', type: DataType.uint8},
                    {name: 'unknown2', type: DataType.uint8},
                    {name: 'time', type: DataType.uint8},
                    {name: 'unknown2', type: DataType.uint8},
                ],
            },
        },
    },
    manuSpecificSinope: {
        ID: 65281,
        manufacturerCode: ManufacturerCode.Sinope,
        attributes: {
            outdoorTempToDisplay: {ID: 16, type: DataType.int16},
            outdoorTempToDisplayTimeout: {ID: 17, type: DataType.uint16},
            currentTimeToDisplay: {ID: 32, type: DataType.uint32},
            ledIntensityOn: {ID: 82, type: DataType.uint8},
            ledIntensityOff: {ID: 83, type: DataType.uint8},
            minimumBrightness: {ID: 85, type: DataType.uint16},
            floorControlMode: {ID: 261, type: DataType.enum8},
            ambiantMaxHeatSetpointLimit: {ID: 264, type: DataType.int16},
            floorMinHeatSetpointLimit: {ID: 265, type: DataType.int16},
            floorMaxHeatSetpointLimit: {ID: 266, type: DataType.int16},
            temperatureSensor: {ID: 267, type: DataType.enum8},
            floorLimitStatus: {ID: 268, type: DataType.enum8},
            timeFormatToDisplay: {ID: 276, type: DataType.enum8},
            GFCiStatus: {ID: 277, type: DataType.enum8},
        },
        commands: {
        },
        commandsResponse: {
        },
    },
    manuSpecificUbisysDeviceSetup: {
        ID: 0xfc00,
        manufacturerCode: ManufacturerCode.Ubisys,
        attributes: {
            inputConfigurations: {ID: 0x0000, type: DataType.array},
            inputActions: {ID: 0x0001, type: DataType.array},
        },
        commands: {
        },
        commandsResponse: {
        }
    },
    manuSpecificUbisysDimmerSetup: {
        ID: 0xfc01,
        manufacturerCode: ManufacturerCode.Ubisys,
        attributes: {
            capabilities: {ID: 0x0000, type: DataType.bitmap8},
            status: {ID: 0x0001, type: DataType.bitmap8},
            mode: {ID: 0x0002, type: DataType.bitmap8},
        },
        commands: {
        },
        commandsResponse: {
        }
    },
    manuSpecificLegrandDevices: {
        ID: 0xfc01,
        manufacturerCode: ManufacturerCode.LegrandNetatmo,
        attributes: {
            // attributes seems to vary depending on the device. Can't be static
        },
        commands: {
        },
        commandsResponse: {
        }
    },
    manuSpecificLegrandDevices2: {
        ID: 0xfc40,
        manufacturerCode: ManufacturerCode.LegrandNetatmo,
        attributes: {},
        commands: {
            command0: {
                ID: 0,
                parameters: [
                    {name: 'data', type: BuffaloZclDataType.BUFFER},
                ],
            },
        },
        commandsResponse: {}
    },
    wiserDeviceInfo: {
        ID: 0xFE03, // 65027
        attributes: {
            deviceInfo: {ID: 32, type: DataType.charStr},
        },
        commands: {},
        commandsResponse: {}
    },
    /**
     * Tuya cluster
     *
     * Common parameters:
     *
     *  seq -  Sequence number of transmitted data, range 0-65535, revert to 0 after reaching 65535
     *
     * Official Tuya documentation: https://developer.tuya.com/en/docs/iot-device-dev/tuya-zigbee-universal-docking-access-standard?id=K9ik6zvofpzql#subtitle-6-Private%20cluster
     *
     */
    manuSpecificTuya: {
        ID: 0xEF00,  // 61184
        attributes: {
        },
        commands: {
            /**
             * Gateway-side data request
             */
            dataRequest: {
                ID: 0,
                parameters: [
                    {name: 'seq', type: DataType.uint16},
                    {name: 'dpValues', type: BuffaloZclDataType.LIST_TUYA_DATAPOINT_VALUES},
                ],
            },
            /**
             * GW send, trigger MCU side to report all current information, no zcl payload.
             * Note: Device side can make a policy, data better not to report centrally
             */
            dataQuery: {
                ID: 3,
                parameters: [
                ],
            },
            /**
             * Gw->Zigbee gateway query MCU version
             */
            mcuVersionRequest: {
                ID: 0x10,
                parameters: [
                    {name: 'seq', type: DataType.uint16},
                ],
            },

            /**
             * FIXME: This command is not listed in Tuya zigbee cluster description,
             *  but there is some command 0x04 (description is: Command Issuance)
             *  in `Serial command list` section of the same document
             *  So, need to investigate more information about it
             */
            sendData: {
                ID: 4,
                parameters: [
                    {name: 'seq', type: DataType.uint16},
                    {name: 'dpValues', type: BuffaloZclDataType.LIST_TUYA_DATAPOINT_VALUES},
                ],
            },

            /**
             * Gw->Zigbee gateway notifies MCU of upgrade
             */
            mcuOtaNotify: {
                ID: 0x12,
                parameters: [
                    {name: 'seq', type: DataType.uint16},
                    // FIXME: key is fixed (8 byte) uint8 array
                    //  Ask Koen is there any type to read fixed size uint_8t.
                    //  currently there is `length` property in options but sems it is
                    //  ignored in `writePayloadCluster()` and other methods.
                    //  So, as workaround we use hi/low for key, which is not best solution
                    {name: 'key_hi', type: DataType.uint32},
                    {name: 'key_lo', type: DataType.uint32},
                    {name: 'version', type: DataType.uint8},
                    {name: 'imageSize', type: DataType.uint32},
                    {name: 'crc', type: DataType.uint32},
                ],
            },

            /**
             * Gw->Zigbee gateway returns the requested upgrade package for MCU
             */
            mcuOtaBlockDataResponse: {
                ID: 0x14,
                parameters: [
                    {name: 'seq', type: DataType.uint16},
                    {name: 'status', type: DataType.uint8},
                    {name: 'key_hi', type: DataType.uint32},
                    {name: 'key_lo', type: DataType.uint32},
                    {name: 'version', type: DataType.uint8},
                    {name: 'offset', type: DataType.uint32},
                    {name: 'imageData', type: BuffaloZclDataType.LIST_UINT8},
                ],
            },

            /**
             * Time synchronization (bidirectional)
             */
            mcuSyncTime: {
                ID: 0x24,
                parameters: [
                    {name: 'payloadSize', type: DataType.uint16},
                    {name: 'payload', type: BuffaloZclDataType.LIST_UINT8},
                ]
            }
        },
        commandsResponse: {
            /**
             * Reply to MCU-side data request
             */
            dataResponse: {
                ID: 1,
                parameters: [
                    {name: 'seq', type: DataType.uint16},
                    {name: 'dpValues', type: BuffaloZclDataType.LIST_TUYA_DATAPOINT_VALUES},
                ],
            },
            /**
             * MCU-side data active upload (bidirectional)
             */
            dataReport: {
                ID: 2,
                parameters: [
                    {name: 'seq', type: DataType.uint16},
                    {name: 'dpValues', type: BuffaloZclDataType.LIST_TUYA_DATAPOINT_VALUES},
                ],
            },

            /**
             * FIXME: This command is not listed in Tuya zigbee cluster description,
             *  but there is some command 0x06 (description is: Status query)
             *  in `Serial command list` section of the same document
             *  So, need to investigate more information about it
             */
            activeStatusReport: {
                ID: 6,
                parameters: [
                    {name: 'seq', type: DataType.uint16},
                    {name: 'dpValues', type: BuffaloZclDataType.LIST_TUYA_DATAPOINT_VALUES},
                ],
            },
            /**
             * Zigbee->Gw MCU return version or actively report version
             */
            mcuVersionResponse: {
                ID: 0x11,
                parameters: [
                    {name: 'seq', type: DataType.uint16},
                    {name: 'version', type: DataType.uint8},
                ],
            },

            /**
             * Zigbee->Gw requests an upgrade package for the MCU
             */
            mcuOtaBlockDataRequest: {
                ID: 0x13,
                parameters: [
                    {name: 'seq', type: DataType.uint16},
                    {name: 'key_hi', type: DataType.uint32},
                    {name: 'key_lo', type: DataType.uint32},
                    {name: 'version', type: DataType.uint8},
                    {name: 'offset', type: DataType.uint32},
                    {name: 'size', type: DataType.uint32},
                ],
            },

            /**
             * Zigbee->Gw returns the upgrade result for the mcu
             */
            mcuOtaResult: {
                ID: 0x15,
                parameters: [
                    {name: 'seq', type: DataType.uint16},
                    {name: 'status', type: DataType.uint8},
                    {name: 'key_hi', type: DataType.uint32},
                    {name: 'key_lo', type: DataType.uint32},
                    {name: 'version', type: DataType.uint8},
                ],
            },

            /**
             * Time synchronization (bidirectional)
             */
            mcuSyncTime: {
                ID: 0x24,
                parameters: [
                    {name: 'payloadSize', type: DataType.uint16}
                ]
            }
        },
    },
    aqaraOpple: {
        ID: 0xFCC0,
        manufacturerCode: ManufacturerCode.LUMI_UNITED_TECH,
        attributes: {
            mode: {ID: 9, type: DataType.uint8},
            illuminance: {ID: 0x0112, type: DataType.uint32}
        },
        commands: {},
        commandsResponse: {}
    },
    liXeePrivate: {
        ID: 0xFF66,
        manufacturerCode: ManufacturerCode.JENNIC,
        attributes: {
            currentTarif: {ID: 0x0000, type: DataType.charStr},
            tomorrowColor: {ID: 0x0001, type: DataType.charStr},
            scheduleHPHC: {ID: 0x0002, type: DataType.uint8},
            presencePotential: {ID: 0x0003, type: DataType.uint8},
            startNoticeEJP: {ID: 0x0004, type: DataType.uint8},
            warnDPS: {ID: 0x0005, type: DataType.uint16},
            warnDIR1: {ID: 0x0006, type: DataType.uint16},
            warnDIR2: {ID: 0x0007, type: DataType.uint16},
            warnDIR3: {ID: 0x0008, type: DataType.uint16},
            currentPrice: {ID: 0x0200, type: DataType.charStr},
            currentIndexTarif: {ID: 0x0201, type: DataType.uint8},
            currentDate: {ID: 0x0202, type: DataType.charStr},
            activeEnerfyOutD01: {ID: 0x0203, type: DataType.uint32},
            activeEnerfyOutD02: {ID: 0x0204, type: DataType.uint32},
            activeEnerfyOutD03: {ID: 0x0205, type: DataType.uint32},
            activeEnerfyOutD04: {ID: 0x0206, type: DataType.uint32},
            injectedVA: {ID: 0x0207, type: DataType.uint16},
            injectedVAMaxN: {ID: 0x0208, type: DataType.int16},
            injectedVAMaxN1: {ID: 0x0209, type: DataType.int16},
            injectedActiveLoadN: {ID: 0x0210, type: DataType.int16},
            injectedActiveLoadN1: {ID: 0x0211, type: DataType.int16},
            drawnVAMaxN1: {ID: 0x0212, type: DataType.int16},
            drawnVAMaxN1P2: {ID: 0x0213, type: DataType.int16},
            drawnVAMaxN1P3: {ID: 0x0214, type: DataType.int16},
            message1: {ID: 0x0215, type: DataType.charStr},
            message2: {ID: 0x0216, type: DataType.charStr},
            statusRegister: {ID: 0x0217, type: DataType.octetStr},
            startMobilePoint1: {ID: 0x0218, type: DataType.uint8},
            stopMobilePoint1: {ID: 0x0219, type: DataType.uint8},
            startMobilePoint2: {ID: 0x0220, type: DataType.uint8},
            stopMobilePoint2: {ID: 0x0221, type: DataType.uint8},
            startMobilePoint3: {ID: 0x0222, type: DataType.uint8},
            stopMobilePoint3: {ID: 0x0223, type: DataType.uint8},
            relais: {ID: 0x0224, type: DataType.uint16},
            daysNumberCurrentCalendar: {ID: 0x0225, type: DataType.uint8},
            daysNumberNextCalendar: {ID: 0x0226, type: DataType.uint8},
            daysProfileCurrentCalendar: {ID: 0x0227, type: DataType.longOctetStr},
            daysProfileNextCalendar: {ID: 0x0228, type: DataType.longOctetStr},
            linkyMode: {ID: 0x0300, type: DataType.uint8},
        },
        commands: {},
        commandsResponse: {},
    },
    manuSpecificTuya_2: {
        ID: 0xE002,
        attributes: {
            alarm_temperature_max: {ID: 53258, type: DataType.int16},
            alarm_temperature_min: {ID: 53259, type: DataType.int16},
            alarm_humidity_max: {ID: 53261, type: DataType.int16},
            alarm_humidity_min: {ID: 53262, type: DataType.int16},
            alarm_humidity: {ID: 53263, type: DataType.enum8},
            alarm_temperature: {ID: 53254, type: DataType.enum8},
            unknown: {ID: 53264, type: DataType.uint8},
        },
        commands: {},
        commandsResponse: {},
    },
    manuSpecificTuya_3: {
        ID: 0xe001,
        attributes: {
            switchType: {ID: 0xd030, type: DataType.enum8},
        },
        commands: {},
        commandsResponse: {},
    },
    manuSpecificCentraliteHumidity: {
        ID: 0xFC45,
        manufacturerCode: ManufacturerCode.Centralite,
        attributes: {
            measuredValue: {ID: 0, type: DataType.uint16},
        },
        commands: {},
        commandsResponse: {},
    },
    manuSpecificSmartThingsArrivalSensor: {
        ID: 0xFC05,
        manufacturerCode: ManufacturerCode.SmartThings,
        attributes: {},
        commands: {},
        commandsResponse: {
            arrivalSensorNotify: {
                ID: 1,
                parameters: [],
            },
        },
    },
    manuSpecificSamsungAccelerometer: {
        ID: 0xFC02,
        manufacturerCode: ManufacturerCode.SmartThings,
        attributes: {
            motion_threshold_multiplier: {ID: 0, type: DataType.uint8},
            motion_threshold: {ID: 2, type: DataType.uint16},
            acceleration: {ID: 16, type: DataType.bitmap8},
            x_axis: {ID:18, type: DataType.int16},
            y_axis: {ID:19, type: DataType.int16},
            z_axis: {ID:20, type: DataType.int16},
        },
        commands: {},
        commandsResponse: {},
    },
    heimanSpecificPM25Measurement: {
        // from HS2AQ-3.0海曼智能空气质量检测仪API文档-V01
        ID: 0x042a,
        manufacturerCode: ManufacturerCode.Heiman,
        attributes: {
            measuredValue: {ID: 0x0000, type: DataType.uint16},
            measuredMinValue: {ID: 0x0001, type: DataType.uint16},
            measuredMaxValue: {ID: 0x0002, type: DataType.uint16},
            measuredTolerance: {ID: 0x0003, type: DataType.uint16},
        },
        commands: {},
        commandsResponse: {},
    },
    heimanSpecificFormaldehydeMeasurement: {
        // from HS2AQ-3.0海曼智能空气质量检测仪API文档-V01
        ID: 0x042b,
        manufacturerCode: ManufacturerCode.Heiman,
        attributes: {
            measuredValue: {ID: 0x0000, type: DataType.uint16},
            measuredMinValue: {ID: 0x0001, type: DataType.uint16},
            measuredMaxValue: {ID: 0x0002, type: DataType.uint16},
            measuredTolerance: {ID: 0x0003, type: DataType.uint16},
        },
        commands: {},
        commandsResponse: {},
    },
    heimanSpecificAirQuality: {
        // from HS2AQ-3.0海曼智能空气质量检测仪API文档-V01
        ID: 0xfc81,
        manufacturerCode: ManufacturerCode.Heiman,
        attributes: {
            language: {ID: 0xf000, type: DataType.uint8},
            unitOfMeasure: {ID: 0xf001, type: DataType.uint8},
            batteryState: {ID: 0xf002, type: DataType.uint8}, //  (0 is not charged, 1 is charging, 2 is fully charged)
            pm10measuredValue: {ID: 0xf003, type: DataType.uint16},
            tvocMeasuredValue: {ID: 0xf004, type: DataType.uint16},
            aqiMeasuredValue: {ID: 0xf005, type: DataType.uint16},
            temperatureMeasuredMax: {ID: 0xf006, type: DataType.int16},
            temperatureMeasuredMin: {ID: 0xf007, type: DataType.int16},
            humidityMeasuredMax: {ID: 0xf008, type: DataType.uint16},
            humidityMeasuredMin: {ID: 0xf009, type: DataType.uint16},
            alarmEnable: {ID: 0xf00a, type: DataType.uint16},
        },
        commands: {
            setLanguage: {
                ID: 0x011b,
                parameters: [ // (1: English 0: Chinese)
                    {name: 'languageCode', type: DataType.uint8},
                ],
            },
            setUnitOfTemperature: {
                ID: 0x011c,
                parameters: [ // (0: ℉ 1: ℃)
                    {name: 'unitsCode', type: DataType.uint8},
                ],
            },
            getTime: {
                ID: 0x011d,
                parameters: [
                ],
            },
        },
        commandsResponse: {
        },
    },
    heimanSpecificScenes: {
        // from HS2SS-3.0海曼智能情景开关API文档-V01
        ID: 0xfc80,
        manufacturerCode: ManufacturerCode.Heiman,
        attributes: {
        },
        commands: {
            cinema: {
                ID: 0xf0,
                parameters: [],
            },
            atHome: {
                ID: 0xf1,
                parameters: [],
            },
            sleep: {
                ID: 0xf2,
                parameters: [],
            },
            goOut: {
                ID: 0xf3,
                parameters: [],
            },
            repast: {
                ID: 0xf4,
                parameters: [],
            },
        },
        commandsResponse: {
        },
    },
    heimanSpecificInfraRedRemote: {
        // from HS2IRC-3.0海曼智能红外转发控制器API-V01文档
        ID: 0xfc82,
        manufacturerCode: ManufacturerCode.Heiman,
        attributes: {},
        commands: {
            sendKey: {
                ID: 0xf0,
                parameters: [
                    {name: 'id', type: DataType.uint8},
                    {name: 'keyCode', type: DataType.uint8},
                ],
            },
            studyKey: {
                // Total we can have 30 keycode for each device ID (1..30).
                ID: 0xf1,
                // response: 0xf2,
                parameters: [
                    {name: 'id', type: DataType.uint8},
                    {name: 'keyCode', type: DataType.uint8},
                ],
            },
            deleteKey: {
                ID: 0xf3,
                parameters: [
                    // 1-15 - Delete specific ID, >= 16 - Delete All
                    {name: 'id', type: DataType.uint8},
                    // 1-30 - Delete specific keycode, >= 31 - Delete All keycodes for the ID
                    {name: 'keyCode', type: DataType.uint8},
                ],
            },
            createId: {
                // Total we can have 15 device IDs (1..15).
                ID: 0xf4,
                // response: 0xf5,
                parameters: [
                    {name: 'modelType', type: DataType.uint8},
                ],
            },
            getIdAndKeyCodeList: {
                ID: 0xf6,
                // response: 0xf7,
                parameters: [],
            },
        },
        commandsResponse: {
            studyKeyRsp: {
                ID: 0xf2,
                parameters: [
                    {name: 'id', type: DataType.uint8},
                    {name: 'keyCode', type: DataType.uint8},
                    {name: 'result', type: DataType.uint8}, // 0 - success, 1 - fail
                ],
            },
            createIdRsp: {
                ID: 0xf5,
                parameters: [
                    {name: 'id', type: DataType.uint8}, // 0xFF - create failed
                    {name: 'modelType', type: DataType.uint8},
                ],
            },
            getIdAndKeyCodeListRsp: {
                ID: 0xf7,
                parameters: [
                    {name: 'packetsTotal', type: DataType.uint8},
                    {name: 'packetNumber', type: DataType.uint8},
                    {name: 'packetLength', type: DataType.uint8}, // Max length is 70 bytes
                    // HELP for learnedDevicesList data structure:
                    //   struct structPacketPayload {
                    //     uint8_t ID;
                    //     uint8_t ModeType;
                    //     uint8_t KeyNum;
                    //     uint8_t KeyCode[KeyNum];
                    //   } arayPacketPayload[CurentPacketLenght];
                    // }
                    {name: 'learnedDevicesList', type: BuffaloZclDataType.LIST_UINT8},
                ],
            },
        },
    },
    develcoSpecificAirQuality: {
        ID: 0xFC03,
        manufacturerCode: ManufacturerCode.Develco,
        attributes: {
            measuredValue: {ID: 0x0000, type: DataType.uint16},
            minMeasuredValue: {ID: 0x0001, type: DataType.uint16},
            maxMeasuredValue: {ID: 0x0002, type: DataType.uint16},
            resolution: {ID: 0x0003, type: DataType.uint16},
        },
        commands: {},
        commandsResponse: {},
    },
    schneiderSpecificPilotMode: {
        ID: 0xFF23,
        manufacturerCode: ManufacturerCode.SCHNEIDER,
        attributes: {
            pilotMode: {ID: 0x0031, type: DataType.enum8},
        },
        commands: {},
        commandsResponse: {},
    },
    elkoOccupancySettingClusterServer: {
        ID: 0xFF19,
        manufacturerCode: ManufacturerCode.ELKO,
        attributes: {
            AmbienceLightThreshold: {ID: 0x0000, type: DataType.uint16},
            OccupancyActions: {ID: 0x0001, type: DataType.enum8},
            UnoccupiedLevelDflt: {ID: 0x0002, type: DataType.uint8},
            UnoccupiedLevel: {ID: 0x0003, type: DataType.uint8},
        },
        commands: {},
        commandsResponse: {},
    },
    elkoSwitchConfigurationClusterServer: {
        ID: 0xFF17,
        manufacturerCode: ManufacturerCode.ELKO,
        attributes: {
            SwitchIndication: {ID: 0x0000, type: DataType.enum8},
            UpSceneID: {ID: 0x0010, type: DataType.uint8},
            UpGroupID: {ID: 0x0011, type: DataType.uint16},
            DownSceneID: {ID: 0x0020, type: DataType.uint8},
            DownGroupID: {ID: 0x0021, type: DataType.uint16},
            SwitchActions: {ID: 0x0001, type: DataType.enum8},
        },
        commands: {},
        commandsResponse: {},
    },
    sprutDevice: {
        ID: 26112,
        manufacturerCode: 26214,
        attributes: {
            debug: {ID: 0, type: DataType.boolean},
        },
        commands: {},
        commandsResponse: {},
    },
    sprutVoc: {
        ID: 26113,
        manufacturerCode: 26214,
        attributes: {
            voc: {ID: 26112, type: DataType.uint16},
        },
        commands: {},
        commandsResponse: {},
    },
    sprutNoise: {
        ID: 26114,
        manufacturerCode: 26214,
        attributes: {
            noise: {ID: 26112, type: DataType.singlePrec},
            noiseDetected: {ID: 26113, type: DataType.bitmap8},
            noiseDetectLevel: {ID: 26114, type: DataType.singlePrec},
            noiseAfterDetectDelay: {ID: 26115, type: DataType.uint16},
        },
        commands: {},
        commandsResponse: {},
    },
    sprutIrBlaster: {
        ID: 26115,
        manufacturerCode: 26214,
        attributes: {},
        commands: {
            playStore: {
                ID: 0x00,
                parameters: [
                    {name: 'param', type: DataType.uint8},
                ],
            },
            learnStart: {
                ID: 0x01,
                parameters: [
                    {name: 'value', type: DataType.uint8},
                ],
            },
            learnStop: {
                ID: 0x02,
                parameters: [
                    {name: 'value', type: DataType.uint8},
                ],
            },
            clearStore: {
                ID: 0x03,
                parameters: [],
            },
            playRam: {
                ID: 0x04,
                parameters: [],
            },
            learnRamStart: {
                ID: 0x05,
                parameters: [],
            },
            learnRamStop: {
                ID: 0x06,
                parameters: [],
            },
        },
        commandsResponse: {},
    },
    manuSpecificSiglisZigfred: {
        ID: 0xFC42,
        manufacturerCode: 0x129C,
        attributes: {
            buttonEvent: {ID: 0x0008, type: DataType.uint32},
        },
        commands: {},
        commandsResponse: {},
    },
};

export default Cluster;
