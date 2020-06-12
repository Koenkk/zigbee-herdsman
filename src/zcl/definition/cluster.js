"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint max-len: 0 */
const dataType_1 = __importDefault(require("./dataType"));
const buffaloZclDataType_1 = __importDefault(require("./buffaloZclDataType"));
const manufacturerCode_1 = __importDefault(require("./manufacturerCode"));
;
;
const Cluster = {
    genBasic: {
        ID: 0,
        attributes: {
            zclVersion: { ID: 0, type: dataType_1.default.uint8 },
            appVersion: { ID: 1, type: dataType_1.default.uint8 },
            stackVersion: { ID: 2, type: dataType_1.default.uint8 },
            hwVersion: { ID: 3, type: dataType_1.default.uint8 },
            manufacturerName: { ID: 4, type: dataType_1.default.charStr },
            modelId: { ID: 5, type: dataType_1.default.charStr },
            dateCode: { ID: 6, type: dataType_1.default.charStr },
            powerSource: { ID: 7, type: dataType_1.default.enum8 },
            appProfileVersion: { ID: 8, type: dataType_1.default.enum8 },
            swBuildId: { ID: 16384, type: dataType_1.default.charStr },
            locationDesc: { ID: 16, type: dataType_1.default.charStr },
            physicalEnv: { ID: 17, type: dataType_1.default.enum8 },
            deviceEnabled: { ID: 18, type: dataType_1.default.boolean },
            alarmMask: { ID: 19, type: dataType_1.default.bitmap8 },
            disableLocalConfig: { ID: 20, type: dataType_1.default.bitmap8 },
        },
        commands: {
            resetFactDefault: {
                ID: 0,
                parameters: [],
            },
        },
        commandsResponse: {},
    },
    genPowerCfg: {
        ID: 1,
        attributes: {
            mainsVoltage: { ID: 0, type: dataType_1.default.uint16 },
            mainsFrequency: { ID: 1, type: dataType_1.default.uint8 },
            mainsAlarmMask: { ID: 16, type: dataType_1.default.bitmap8 },
            mainsVoltMinThres: { ID: 17, type: dataType_1.default.uint16 },
            mainsVoltMaxThres: { ID: 18, type: dataType_1.default.uint16 },
            mainsVoltageDwellTripPoint: { ID: 19, type: dataType_1.default.uint16 },
            batteryVoltage: { ID: 32, type: dataType_1.default.uint8 },
            batteryPercentageRemaining: { ID: 33, type: dataType_1.default.uint8 },
            batteryManufacturer: { ID: 48, type: dataType_1.default.charStr },
            batterySize: { ID: 49, type: dataType_1.default.enum8 },
            batteryAHrRating: { ID: 50, type: dataType_1.default.uint16 },
            batteryQuantity: { ID: 51, type: dataType_1.default.uint8 },
            batteryRatedVoltage: { ID: 52, type: dataType_1.default.uint8 },
            batteryAlarmMask: { ID: 53, type: dataType_1.default.bitmap8 },
            batteryVoltMinThres: { ID: 54, type: dataType_1.default.uint8 },
            batteryVoltThres1: { ID: 55, type: dataType_1.default.uint8 },
            batteryVoltThres2: { ID: 56, type: dataType_1.default.uint8 },
            batteryVoltThres3: { ID: 57, type: dataType_1.default.uint8 },
            batteryPercentMinThres: { ID: 58, type: dataType_1.default.uint8 },
            batteryPercentThres1: { ID: 59, type: dataType_1.default.uint8 },
            batteryPercentThres2: { ID: 60, type: dataType_1.default.uint8 },
            batteryPercentThres3: { ID: 61, type: dataType_1.default.uint8 },
            batteryAlarmState: { ID: 62, type: dataType_1.default.bitmap32 },
        },
        commands: {},
        commandsResponse: {},
    },
    genDeviceTempCfg: {
        ID: 2,
        attributes: {
            currentTemperature: { ID: 0, type: dataType_1.default.int16 },
            minTempExperienced: { ID: 1, type: dataType_1.default.int16 },
            maxTempExperienced: { ID: 2, type: dataType_1.default.int16 },
            overTempTotalDwell: { ID: 3, type: dataType_1.default.uint16 },
            devTempAlarmMask: { ID: 16, type: dataType_1.default.bitmap8 },
            lowTempThres: { ID: 17, type: dataType_1.default.int16 },
            highTempThres: { ID: 18, type: dataType_1.default.int16 },
            lowTempDwellTripPoint: { ID: 19, type: dataType_1.default.uint24 },
            highTempDwellTripPoint: { ID: 20, type: dataType_1.default.uint24 },
        },
        commands: {},
        commandsResponse: {},
    },
    genIdentify: {
        ID: 3,
        attributes: {
            identifyTime: { ID: 0, type: dataType_1.default.uint16 },
            identifyCommissionState: { ID: 1, type: dataType_1.default.unknown },
        },
        commands: {
            identify: {
                ID: 0,
                parameters: [
                    { name: 'identifytime', type: dataType_1.default.uint16 },
                ],
            },
            identifyQuery: {
                ID: 1,
                parameters: [],
            },
            ezmodeInvoke: {
                ID: 2,
                parameters: [
                    { name: 'action', type: dataType_1.default.uint8 },
                ],
            },
            updateCommissionState: {
                ID: 3,
                parameters: [
                    { name: 'action', type: dataType_1.default.uint8 },
                    { name: 'commstatemask', type: dataType_1.default.uint8 },
                ],
            },
            triggerEffect: {
                ID: 64,
                parameters: [
                    { name: 'effectid', type: dataType_1.default.uint8 },
                    { name: 'effectvariant', type: dataType_1.default.uint8 },
                ],
            },
        },
        commandsResponse: {
            identifyQueryRsp: {
                ID: 0,
                parameters: [
                    { name: 'timeout', type: dataType_1.default.uint16 },
                ],
            },
        },
    },
    genGroups: {
        ID: 4,
        attributes: {
            nameSupport: { ID: 0, type: dataType_1.default.bitmap8 },
        },
        commands: {
            add: {
                ID: 0,
                response: 0,
                parameters: [
                    { name: 'groupid', type: dataType_1.default.uint16 },
                    { name: 'groupname', type: dataType_1.default.charStr },
                ],
            },
            view: {
                ID: 1,
                parameters: [
                    { name: 'groupid', type: dataType_1.default.uint16 },
                ],
            },
            getMembership: {
                ID: 2,
                response: 2,
                parameters: [
                    { name: 'groupcount', type: dataType_1.default.uint8 },
                    { name: 'grouplist', type: buffaloZclDataType_1.default.LIST_UINT16 },
                ],
            },
            remove: {
                ID: 3,
                response: 3,
                parameters: [
                    { name: 'groupid', type: dataType_1.default.uint16 },
                ],
            },
            removeAll: {
                ID: 4,
                parameters: [],
            },
            addIfIdentifying: {
                ID: 5,
                parameters: [
                    { name: 'groupid', type: dataType_1.default.uint16 },
                    { name: 'groupname', type: dataType_1.default.charStr },
                ],
            },
        },
        commandsResponse: {
            addRsp: {
                ID: 0,
                parameters: [
                    { name: 'status', type: dataType_1.default.uint8 },
                    { name: 'groupid', type: dataType_1.default.uint16 },
                ],
            },
            viewRsp: {
                ID: 1,
                parameters: [
                    { name: 'status', type: dataType_1.default.uint8 },
                    { name: 'groupid', type: dataType_1.default.uint16 },
                    { name: 'groupname', type: dataType_1.default.charStr },
                ],
            },
            getMembershipRsp: {
                ID: 2,
                parameters: [
                    { name: 'capacity', type: dataType_1.default.uint8 },
                    { name: 'groupcount', type: dataType_1.default.uint8 },
                    { name: 'grouplist', type: buffaloZclDataType_1.default.LIST_UINT16 },
                ],
            },
            removeRsp: {
                ID: 3,
                parameters: [
                    { name: 'status', type: dataType_1.default.uint8 },
                    { name: 'groupid', type: dataType_1.default.uint16 },
                ],
            },
        },
    },
    genScenes: {
        ID: 5,
        attributes: {
            count: { ID: 0, type: dataType_1.default.uint8 },
            currentScene: { ID: 1, type: dataType_1.default.uint8 },
            currentGroup: { ID: 2, type: dataType_1.default.uint16 },
            sceneValid: { ID: 3, type: dataType_1.default.boolean },
            nameSupport: { ID: 4, type: dataType_1.default.bitmap8 },
            lastCfgBy: { ID: 5, type: dataType_1.default.ieeeAddr },
        },
        commands: {
            add: {
                ID: 0,
                parameters: [
                    { name: 'groupid', type: dataType_1.default.uint16 },
                    { name: 'sceneid', type: dataType_1.default.uint8 },
                    { name: 'transtime', type: dataType_1.default.uint16 },
                    { name: 'scenename', type: dataType_1.default.charStr },
                    { name: 'extensionfieldsets', type: buffaloZclDataType_1.default.EXTENSION_FIELD_SETS },
                ],
            },
            view: {
                ID: 1,
                parameters: [
                    { name: 'groupid', type: dataType_1.default.uint16 },
                    { name: 'sceneid', type: dataType_1.default.uint8 },
                ],
            },
            remove: {
                ID: 2,
                parameters: [
                    { name: 'groupid', type: dataType_1.default.uint16 },
                    { name: 'sceneid', type: dataType_1.default.uint8 },
                ],
            },
            removeAll: {
                ID: 3,
                parameters: [
                    { name: 'groupid', type: dataType_1.default.uint16 },
                ],
            },
            store: {
                ID: 4,
                parameters: [
                    { name: 'groupid', type: dataType_1.default.uint16 },
                    { name: 'sceneid', type: dataType_1.default.uint8 },
                ],
            },
            recall: {
                ID: 5,
                parameters: [
                    { name: 'groupid', type: dataType_1.default.uint16 },
                    { name: 'sceneid', type: dataType_1.default.uint8 },
                ],
            },
            getSceneMembership: {
                ID: 6,
                parameters: [
                    { name: 'groupid', type: dataType_1.default.uint16 },
                ],
            },
            enhancedAdd: {
                ID: 64,
                parameters: [
                    { name: 'groupid', type: dataType_1.default.uint16 },
                    { name: 'sceneid', type: dataType_1.default.uint8 },
                    { name: 'transtime', type: dataType_1.default.uint16 },
                    { name: 'scenename', type: dataType_1.default.charStr },
                    { name: 'extensionfieldsets', type: buffaloZclDataType_1.default.EXTENSION_FIELD_SETS },
                ],
            },
            enhancedView: {
                ID: 65,
                parameters: [
                    { name: 'groupid', type: dataType_1.default.uint16 },
                    { name: 'sceneid', type: dataType_1.default.uint8 },
                ],
            },
            copy: {
                ID: 66,
                parameters: [
                    { name: 'mode', type: dataType_1.default.uint8 },
                    { name: 'groupidfrom', type: dataType_1.default.uint16 },
                    { name: 'sceneidfrom', type: dataType_1.default.uint8 },
                    { name: 'groupidto', type: dataType_1.default.uint16 },
                    { name: 'sceneidto', type: dataType_1.default.uint8 },
                ],
            },
            tradfriArrowSingle: {
                ID: 7,
                parameters: [
                    { name: 'value', type: dataType_1.default.uint16 },
                    { name: 'value2', type: dataType_1.default.uint16 },
                ],
            },
            tradfriArrowHold: {
                ID: 8,
                parameters: [
                    { name: 'value', type: dataType_1.default.uint16 },
                ],
            },
            tradfriArrowRelease: {
                ID: 9,
                parameters: [
                    { name: 'value', type: dataType_1.default.uint16 },
                ],
            },
        },
        commandsResponse: {
            addRsp: {
                ID: 0,
                parameters: [
                    { name: 'status', type: dataType_1.default.uint8 },
                    { name: 'groupId', type: dataType_1.default.uint16 },
                    { name: 'sceneId', type: dataType_1.default.uint8 },
                ],
            },
            viewRsp: {
                ID: 1,
                parameters: [
                    { name: 'status', type: dataType_1.default.uint8 },
                    { name: 'groupid', type: dataType_1.default.uint16 },
                    { name: 'sceneid', type: dataType_1.default.uint8 },
                    { name: 'transtime', type: dataType_1.default.uint16 },
                    { name: 'scenename', type: dataType_1.default.charStr },
                    { name: 'extensionfieldsets', type: buffaloZclDataType_1.default.EXTENSION_FIELD_SETS },
                ],
            },
            removeRsp: {
                ID: 2,
                parameters: [
                    { name: 'status', type: dataType_1.default.uint8 },
                    { name: 'groupid', type: dataType_1.default.uint16 },
                    { name: 'sceneid', type: dataType_1.default.uint8 },
                ],
            },
            removeAllRsp: {
                ID: 3,
                parameters: [
                    { name: 'status', type: dataType_1.default.uint8 },
                    { name: 'groupid', type: dataType_1.default.uint16 },
                ],
            },
            storeRsp: {
                ID: 4,
                parameters: [
                    { name: 'status', type: dataType_1.default.uint8 },
                    { name: 'groupid', type: dataType_1.default.uint16 },
                    { name: 'sceneid', type: dataType_1.default.uint8 },
                ],
            },
            getSceneMembershipRsp: {
                ID: 6,
                parameters: [
                    { name: 'status', type: dataType_1.default.uint8 },
                    { name: 'capacity', type: dataType_1.default.uint8 },
                    { name: 'groupid', type: dataType_1.default.uint16 },
                    { name: 'scenecount', type: dataType_1.default.uint8 },
                    { name: 'scenelist', type: buffaloZclDataType_1.default.LIST_UINT8 },
                ],
            },
            enhancedAddRsp: {
                ID: 64,
                parameters: [],
            },
            enhancedViewRsp: {
                ID: 65,
                parameters: [
                    { name: 'status', type: dataType_1.default.uint8 },
                    { name: 'groupid', type: dataType_1.default.uint16 },
                    { name: 'sceneid', type: dataType_1.default.uint8 },
                    { name: 'transtime', type: dataType_1.default.uint16 },
                    { name: 'scenename', type: dataType_1.default.charStr },
                    { name: 'extensionfieldsets', type: buffaloZclDataType_1.default.EXTENSION_FIELD_SETS },
                ],
            },
            copyRsp: {
                ID: 66,
                parameters: [
                    { name: 'status', type: dataType_1.default.uint8 },
                    { name: 'groupidfrom', type: dataType_1.default.uint16 },
                    { name: 'sceneidfrom', type: dataType_1.default.uint8 },
                ],
            },
        },
    },
    genOnOff: {
        ID: 6,
        attributes: {
            onOff: { ID: 0, type: dataType_1.default.boolean },
            globalSceneCtrl: { ID: 16384, type: dataType_1.default.boolean },
            onTime: { ID: 16385, type: dataType_1.default.uint16 },
            offWaitTime: { ID: 16386, type: dataType_1.default.uint16 },
        },
        commands: {
            off: {
                ID: 0,
                parameters: [],
            },
            on: {
                ID: 1,
                parameters: [],
            },
            toggle: {
                ID: 2,
                parameters: [],
            },
            offWithEffect: {
                ID: 64,
                parameters: [
                    { name: 'effectid', type: dataType_1.default.uint8 },
                    { name: 'effectvariant', type: dataType_1.default.uint8 },
                ],
            },
            onWithRecallGlobalScene: {
                ID: 65,
                parameters: [],
            },
            onWithTimedOff: {
                ID: 66,
                parameters: [
                    { name: 'ctrlbits', type: dataType_1.default.uint8 },
                    { name: 'ontime', type: dataType_1.default.uint16 },
                    { name: 'offwaittime', type: dataType_1.default.uint16 },
                ],
            },
        },
        commandsResponse: {},
    },
    genOnOffSwitchCfg: {
        ID: 7,
        attributes: {
            switchType: { ID: 0, type: dataType_1.default.enum8 },
            switchMultiFunction: { ID: 2, type: dataType_1.default.unknown },
            switchActions: { ID: 16, type: dataType_1.default.enum8 },
        },
        commands: {},
        commandsResponse: {},
    },
    genLevelCtrl: {
        ID: 8,
        attributes: {
            currentLevel: { ID: 0, type: dataType_1.default.uint8 },
            remainingTime: { ID: 1, type: dataType_1.default.uint16 },
            onOffTransitionTime: { ID: 16, type: dataType_1.default.uint16 },
            onLevel: { ID: 17, type: dataType_1.default.uint8 },
            onTransitionTime: { ID: 18, type: dataType_1.default.uint16 },
            offTransitionTime: { ID: 19, type: dataType_1.default.uint16 },
            defaultMoveRate: { ID: 20, type: dataType_1.default.uint16 },
        },
        commands: {
            moveToLevel: {
                ID: 0,
                parameters: [
                    { name: 'level', type: dataType_1.default.uint8 },
                    { name: 'transtime', type: dataType_1.default.uint16 },
                ],
            },
            move: {
                ID: 1,
                parameters: [
                    { name: 'movemode', type: dataType_1.default.uint8 },
                    { name: 'rate', type: dataType_1.default.uint8 },
                ],
            },
            step: {
                ID: 2,
                parameters: [
                    { name: 'stepmode', type: dataType_1.default.uint8 },
                    { name: 'stepsize', type: dataType_1.default.uint8 },
                    { name: 'transtime', type: dataType_1.default.uint16 },
                ],
            },
            stop: {
                ID: 3,
                parameters: [],
            },
            moveToLevelWithOnOff: {
                ID: 4,
                parameters: [
                    { name: 'level', type: dataType_1.default.uint8 },
                    { name: 'transtime', type: dataType_1.default.uint16 },
                ],
            },
            moveWithOnOff: {
                ID: 5,
                parameters: [
                    { name: 'movemode', type: dataType_1.default.uint8 },
                    { name: 'rate', type: dataType_1.default.uint8 },
                ],
            },
            stepWithOnOff: {
                ID: 6,
                parameters: [
                    { name: 'stepmode', type: dataType_1.default.uint8 },
                    { name: 'stepsize', type: dataType_1.default.uint8 },
                    { name: 'transtime', type: dataType_1.default.uint16 },
                ],
            },
            stopWithOnOff: {
                ID: 7,
                parameters: [],
            },
        },
        commandsResponse: {},
    },
    genAlarms: {
        ID: 9,
        attributes: {
            alarmCount: { ID: 0, type: dataType_1.default.uint16 },
        },
        commands: {
            reset: {
                ID: 0,
                parameters: [
                    { name: 'alarmcode', type: dataType_1.default.uint8 },
                    { name: 'clusterid', type: dataType_1.default.uint16 },
                ],
            },
            resetAll: {
                ID: 1,
                parameters: [],
            },
            getAlarm: {
                ID: 2,
                parameters: [],
            },
            resetLog: {
                ID: 3,
                parameters: [],
            },
            publishEventLog: {
                ID: 4,
                parameters: [],
            },
        },
        commandsResponse: {
            alarm: {
                ID: 0,
                parameters: [
                    { name: 'alarmcode', type: dataType_1.default.uint8 },
                    { name: 'clusterid', type: dataType_1.default.uint16 },
                ],
            },
            getRsp: {
                ID: 1,
                parameters: [
                    { name: 'status', type: dataType_1.default.uint8 },
                    { name: 'alarmcode', type: dataType_1.default.uint8 },
                    { name: 'clusterid', type: dataType_1.default.uint16 },
                    { name: 'timestamp', type: dataType_1.default.uint32 },
                ],
            },
            getEventLog: {
                ID: 2,
                parameters: [],
            },
        },
    },
    genTime: {
        ID: 10,
        attributes: {
            time: { ID: 0, type: dataType_1.default.utc },
            timeStatus: { ID: 1, type: dataType_1.default.bitmap8 },
            timeZone: { ID: 2, type: dataType_1.default.int32 },
            dstStart: { ID: 3, type: dataType_1.default.uint32 },
            dstEnd: { ID: 4, type: dataType_1.default.uint32 },
            dstShift: { ID: 5, type: dataType_1.default.int32 },
            standardTime: { ID: 6, type: dataType_1.default.uint32 },
            localTime: { ID: 7, type: dataType_1.default.uint32 },
            lastSetTime: { ID: 8, type: dataType_1.default.utc },
            validUntilTime: { ID: 9, type: dataType_1.default.utc },
        },
        commands: {},
        commandsResponse: {},
    },
    genRssiLocation: {
        ID: 11,
        attributes: {
            type: { ID: 0, type: dataType_1.default.data8 },
            method: { ID: 1, type: dataType_1.default.enum8 },
            age: { ID: 2, type: dataType_1.default.uint16 },
            qualityMeasure: { ID: 3, type: dataType_1.default.uint8 },
            numOfDevices: { ID: 4, type: dataType_1.default.uint8 },
            coordinate1: { ID: 16, type: dataType_1.default.int16 },
            coordinate2: { ID: 17, type: dataType_1.default.int16 },
            coordinate3: { ID: 18, type: dataType_1.default.int16 },
            power: { ID: 19, type: dataType_1.default.int16 },
            pathLossExponent: { ID: 20, type: dataType_1.default.uint16 },
            reportingPeriod: { ID: 21, type: dataType_1.default.uint16 },
            calcPeriod: { ID: 22, type: dataType_1.default.uint16 },
            numRSSIMeasurements: { ID: 23, type: dataType_1.default.uint16 },
        },
        commands: {
            setAbsolute: {
                ID: 0,
                parameters: [
                    { name: 'coord1', type: dataType_1.default.int16 },
                    { name: 'coord2', type: dataType_1.default.int16 },
                    { name: 'coord3', type: dataType_1.default.int16 },
                    { name: 'power', type: dataType_1.default.int16 },
                    { name: 'pathlossexponent', type: dataType_1.default.uint16 },
                ],
            },
            setDevCfg: {
                ID: 1,
                parameters: [
                    { name: 'power', type: dataType_1.default.int16 },
                    { name: 'pathlossexponent', type: dataType_1.default.uint16 },
                    { name: 'calperiod', type: dataType_1.default.uint16 },
                    { name: 'numrssimeasurements', type: dataType_1.default.uint8 },
                    { name: 'reportingperiod', type: dataType_1.default.uint16 },
                ],
            },
            getDevCfg: {
                ID: 2,
                parameters: [
                    { name: 'targetaddr', type: dataType_1.default.ieeeAddr },
                ],
            },
            getData: {
                ID: 3,
                parameters: [
                    { name: 'getdatainfo', type: dataType_1.default.uint8 },
                    { name: 'numrsp', type: dataType_1.default.uint8 },
                    { name: 'targetaddr', type: dataType_1.default.ieeeAddr },
                ],
            },
        },
        commandsResponse: {
            devCfgRsp: {
                ID: 0,
                parameters: [
                    { name: 'status', type: dataType_1.default.uint8 },
                    { name: 'power', type: dataType_1.default.int16 },
                    { name: 'pathlossexp', type: dataType_1.default.uint16 },
                    { name: 'calperiod', type: dataType_1.default.uint16 },
                    { name: 'numrssimeasurements', type: dataType_1.default.uint8 },
                    { name: 'reportingperiod', type: dataType_1.default.uint16 },
                ],
            },
            dataRsp: {
                ID: 1,
                parameters: [
                    { name: 'status', type: dataType_1.default.uint8 },
                    { name: 'locationtype', type: dataType_1.default.uint8 },
                    { name: 'coord1', type: dataType_1.default.int16 },
                    { name: 'coord2', type: dataType_1.default.int16 },
                    { name: 'coord3', type: dataType_1.default.int16 },
                    { name: 'power', type: dataType_1.default.int16 },
                    { name: 'pathlossexp', type: dataType_1.default.uint16 },
                    { name: 'locationmethod', type: dataType_1.default.uint8 },
                    { name: 'qualitymeasure', type: dataType_1.default.uint8 },
                    { name: 'locationage', type: dataType_1.default.uint16 },
                ],
            },
            dataNotif: {
                ID: 2,
                parameters: [
                    { name: 'locationtype', type: dataType_1.default.uint8 },
                    { name: 'coord1', type: dataType_1.default.int16 },
                    { name: 'coord2', type: dataType_1.default.int16 },
                    { name: 'coord3', type: dataType_1.default.int16 },
                    { name: 'power', type: dataType_1.default.int16 },
                    { name: 'pathlossexp', type: dataType_1.default.uint16 },
                    { name: 'locationmethod', type: dataType_1.default.uint8 },
                    { name: 'qualitymeasure', type: dataType_1.default.uint8 },
                    { name: 'locationage', type: dataType_1.default.uint16 },
                ],
            },
            compactDataNotif: {
                ID: 3,
                parameters: [
                    { name: 'locationtype', type: dataType_1.default.uint8 },
                    { name: 'coord1', type: dataType_1.default.int16 },
                    { name: 'coord2', type: dataType_1.default.int16 },
                    { name: 'coord3', type: dataType_1.default.int16 },
                    { name: 'qualitymeasure', type: dataType_1.default.uint8 },
                    { name: 'locationage', type: dataType_1.default.uint16 },
                ],
            },
            rssiPing: {
                ID: 4,
                parameters: [
                    { name: 'locationtype', type: dataType_1.default.uint8 },
                ],
            },
        },
    },
    genAnalogInput: {
        ID: 12,
        attributes: {
            description: { ID: 28, type: dataType_1.default.charStr },
            maxPresentValue: { ID: 65, type: dataType_1.default.singlePrec },
            minPresentValue: { ID: 69, type: dataType_1.default.singlePrec },
            outOfService: { ID: 81, type: dataType_1.default.boolean },
            presentValue: { ID: 85, type: dataType_1.default.singlePrec },
            reliability: { ID: 103, type: dataType_1.default.enum8 },
            resolution: { ID: 106, type: dataType_1.default.singlePrec },
            statusFlags: { ID: 111, type: dataType_1.default.bitmap8 },
            engineeringUnits: { ID: 117, type: dataType_1.default.enum16 },
            applicationType: { ID: 256, type: dataType_1.default.uint32 },
        },
        commands: {},
        commandsResponse: {},
    },
    genAnalogOutput: {
        ID: 13,
        attributes: {
            description: { ID: 28, type: dataType_1.default.charStr },
            maxPresentValue: { ID: 65, type: dataType_1.default.singlePrec },
            minPresentValue: { ID: 69, type: dataType_1.default.singlePrec },
            outOfService: { ID: 81, type: dataType_1.default.boolean },
            presentValue: { ID: 85, type: dataType_1.default.singlePrec },
            priorityArray: { ID: 87, type: dataType_1.default.array },
            reliability: { ID: 103, type: dataType_1.default.enum8 },
            relinquishDefault: { ID: 104, type: dataType_1.default.singlePrec },
            resolution: { ID: 106, type: dataType_1.default.singlePrec },
            statusFlags: { ID: 111, type: dataType_1.default.bitmap8 },
            engineeringUnits: { ID: 117, type: dataType_1.default.enum16 },
            applicationType: { ID: 256, type: dataType_1.default.uint32 },
        },
        commands: {},
        commandsResponse: {},
    },
    genAnalogValue: {
        ID: 14,
        attributes: {
            description: { ID: 28, type: dataType_1.default.charStr },
            outOfService: { ID: 81, type: dataType_1.default.boolean },
            presentValue: { ID: 85, type: dataType_1.default.singlePrec },
            priorityArray: { ID: 87, type: dataType_1.default.array },
            reliability: { ID: 103, type: dataType_1.default.enum8 },
            relinquishDefault: { ID: 104, type: dataType_1.default.singlePrec },
            statusFlags: { ID: 111, type: dataType_1.default.bitmap8 },
            engineeringUnits: { ID: 117, type: dataType_1.default.enum16 },
            applicationType: { ID: 256, type: dataType_1.default.uint32 },
        },
        commands: {},
        commandsResponse: {},
    },
    genBinaryInput: {
        ID: 15,
        attributes: {
            activeText: { ID: 4, type: dataType_1.default.charStr },
            description: { ID: 28, type: dataType_1.default.charStr },
            inactiveText: { ID: 46, type: dataType_1.default.charStr },
            outOfService: { ID: 81, type: dataType_1.default.boolean },
            polarity: { ID: 84, type: dataType_1.default.enum8 },
            presentValue: { ID: 85, type: dataType_1.default.boolean },
            reliability: { ID: 103, type: dataType_1.default.enum8 },
            statusFlags: { ID: 111, type: dataType_1.default.bitmap8 },
            applicationType: { ID: 256, type: dataType_1.default.uint32 },
        },
        commands: {},
        commandsResponse: {},
    },
    genBinaryOutput: {
        ID: 16,
        attributes: {
            activeText: { ID: 4, type: dataType_1.default.charStr },
            description: { ID: 28, type: dataType_1.default.charStr },
            inactiveText: { ID: 46, type: dataType_1.default.charStr },
            minimumOffTime: { ID: 66, type: dataType_1.default.uint32 },
            minimumOnTime: { ID: 67, type: dataType_1.default.uint32 },
            outOfService: { ID: 81, type: dataType_1.default.boolean },
            polarity: { ID: 84, type: dataType_1.default.enum8 },
            presentValue: { ID: 85, type: dataType_1.default.boolean },
            priorityArray: { ID: 87, type: dataType_1.default.array },
            reliability: { ID: 103, type: dataType_1.default.enum8 },
            relinquishDefault: { ID: 104, type: dataType_1.default.boolean },
            statusFlags: { ID: 111, type: dataType_1.default.bitmap8 },
            applicationType: { ID: 256, type: dataType_1.default.uint32 },
        },
        commands: {},
        commandsResponse: {},
    },
    genBinaryValue: {
        ID: 17,
        attributes: {
            activeText: { ID: 4, type: dataType_1.default.charStr },
            description: { ID: 28, type: dataType_1.default.charStr },
            inactiveText: { ID: 46, type: dataType_1.default.charStr },
            minimumOffTime: { ID: 66, type: dataType_1.default.uint32 },
            minimumOnTime: { ID: 67, type: dataType_1.default.uint32 },
            outOfService: { ID: 81, type: dataType_1.default.boolean },
            presentValue: { ID: 85, type: dataType_1.default.boolean },
            priorityArray: { ID: 87, type: dataType_1.default.array },
            reliability: { ID: 103, type: dataType_1.default.enum8 },
            relinquishDefault: { ID: 104, type: dataType_1.default.boolean },
            statusFlags: { ID: 111, type: dataType_1.default.bitmap8 },
            applicationType: { ID: 256, type: dataType_1.default.uint32 },
        },
        commands: {},
        commandsResponse: {},
    },
    genMultistateInput: {
        ID: 18,
        attributes: {
            stateText: { ID: 14, type: dataType_1.default.array },
            description: { ID: 28, type: dataType_1.default.charStr },
            numberOfStates: { ID: 74, type: dataType_1.default.uint16 },
            outOfService: { ID: 81, type: dataType_1.default.boolean },
            presentValue: { ID: 85, type: dataType_1.default.uint16 },
            reliability: { ID: 103, type: dataType_1.default.enum8 },
            statusFlags: { ID: 111, type: dataType_1.default.bitmap8 },
            applicationType: { ID: 256, type: dataType_1.default.uint32 },
        },
        commands: {},
        commandsResponse: {},
    },
    genMultistateOutput: {
        ID: 19,
        attributes: {
            stateText: { ID: 14, type: dataType_1.default.array },
            description: { ID: 28, type: dataType_1.default.charStr },
            numberOfStates: { ID: 74, type: dataType_1.default.uint16 },
            outOfService: { ID: 81, type: dataType_1.default.boolean },
            presentValue: { ID: 85, type: dataType_1.default.uint16 },
            priorityArray: { ID: 87, type: dataType_1.default.array },
            reliability: { ID: 103, type: dataType_1.default.enum8 },
            relinquishDefault: { ID: 104, type: dataType_1.default.uint16 },
            statusFlags: { ID: 111, type: dataType_1.default.bitmap8 },
            applicationType: { ID: 256, type: dataType_1.default.uint32 },
        },
        commands: {},
        commandsResponse: {},
    },
    genMultistateValue: {
        ID: 20,
        attributes: {
            stateText: { ID: 14, type: dataType_1.default.array },
            description: { ID: 28, type: dataType_1.default.charStr },
            numberOfStates: { ID: 74, type: dataType_1.default.uint16 },
            outOfService: { ID: 81, type: dataType_1.default.boolean },
            presentValue: { ID: 85, type: dataType_1.default.uint16 },
            priorityArray: { ID: 87, type: dataType_1.default.array },
            reliability: { ID: 103, type: dataType_1.default.enum8 },
            relinquishDefault: { ID: 104, type: dataType_1.default.uint16 },
            statusFlags: { ID: 111, type: dataType_1.default.bitmap8 },
            applicationType: { ID: 256, type: dataType_1.default.uint32 },
        },
        commands: {},
        commandsResponse: {},
    },
    genCommissioning: {
        ID: 21,
        attributes: {
            shortress: { ID: 0, type: dataType_1.default.uint16 },
            extendedPANId: { ID: 1, type: dataType_1.default.ieeeAddr },
            panId: { ID: 2, type: dataType_1.default.uint16 },
            channelmask: { ID: 3, type: dataType_1.default.bitmap32 },
            protocolVersion: { ID: 4, type: dataType_1.default.uint8 },
            stackProfile: { ID: 5, type: dataType_1.default.uint8 },
            startupControl: { ID: 6, type: dataType_1.default.enum8 },
            trustCenterress: { ID: 16, type: dataType_1.default.ieeeAddr },
            trustCenterMasterKey: { ID: 17, type: dataType_1.default.secKey },
            networkKey: { ID: 18, type: dataType_1.default.secKey },
            useInsecureJoin: { ID: 19, type: dataType_1.default.boolean },
            preconfiguredLinkKey: { ID: 20, type: dataType_1.default.secKey },
            networkKeySeqNum: { ID: 21, type: dataType_1.default.uint8 },
            networkKeyType: { ID: 22, type: dataType_1.default.enum8 },
            networkManagerress: { ID: 23, type: dataType_1.default.uint16 },
            scanAttempts: { ID: 32, type: dataType_1.default.uint8 },
            timeBetweenScans: { ID: 33, type: dataType_1.default.uint16 },
            rejoinInterval: { ID: 34, type: dataType_1.default.uint16 },
            maxRejoinInterval: { ID: 35, type: dataType_1.default.uint16 },
            indirectPollRate: { ID: 48, type: dataType_1.default.uint16 },
            parentRetryThreshold: { ID: 49, type: dataType_1.default.uint8 },
            concentratorFlag: { ID: 64, type: dataType_1.default.boolean },
            concentratorRus: { ID: 65, type: dataType_1.default.uint8 },
            concentratorDiscoveryTime: { ID: 66, type: dataType_1.default.uint8 },
        },
        commands: {
            restartDevice: {
                ID: 0,
                parameters: [
                    { name: 'options', type: dataType_1.default.uint8 },
                    { name: 'delay', type: dataType_1.default.uint8 },
                    { name: 'jitter', type: dataType_1.default.uint8 },
                ],
            },
            saveStartupParams: {
                ID: 1,
                parameters: [
                    { name: 'options', type: dataType_1.default.uint8 },
                    { name: 'index', type: dataType_1.default.uint8 },
                ],
            },
            restoreStartupParams: {
                ID: 2,
                parameters: [
                    { name: 'options', type: dataType_1.default.uint8 },
                    { name: 'index', type: dataType_1.default.uint8 },
                ],
            },
            resetStartupParams: {
                ID: 3,
                parameters: [
                    { name: 'options', type: dataType_1.default.uint8 },
                    { name: 'index', type: dataType_1.default.uint8 },
                ],
            },
        },
        commandsResponse: {
            restartDeviceRsp: {
                ID: 0,
                parameters: [
                    { name: 'status', type: dataType_1.default.uint8 },
                ],
            },
            saveStartupParamsRsp: {
                ID: 1,
                parameters: [
                    { name: 'status', type: dataType_1.default.uint8 },
                ],
            },
            restoreStartupParamsRsp: {
                ID: 2,
                parameters: [
                    { name: 'status', type: dataType_1.default.uint8 },
                ],
            },
            resetStartupParamsRsp: {
                ID: 3,
                parameters: [
                    { name: 'status', type: dataType_1.default.uint8 },
                ],
            },
        },
    },
    genOta: {
        ID: 25,
        attributes: {
            upgradeServerId: { ID: 0, type: dataType_1.default.ieeeAddr },
            fileOffset: { ID: 1, type: dataType_1.default.uint32 },
            currentFileVersion: { ID: 2, type: dataType_1.default.uint32 },
            currentZigbeeStackVersion: { ID: 3, type: dataType_1.default.uint16 },
            downloadedFileVersion: { ID: 4, type: dataType_1.default.uint32 },
            downloadedZigbeeStackVersion: { ID: 5, type: dataType_1.default.uint16 },
            imageUpgradeStatus: { ID: 6, type: dataType_1.default.enum8 },
            manufacturerId: { ID: 7, type: dataType_1.default.uint16 },
            imageTypeId: { ID: 8, type: dataType_1.default.uint16 },
            minimumBlockReqDelay: { ID: 9, type: dataType_1.default.uint16 },
            imageStamp: { ID: 10, type: dataType_1.default.uint32 },
        },
        commands: {
            queryNextImageRequest: {
                ID: 1,
                response: 2,
                parameters: [
                    { name: 'fieldControl', type: dataType_1.default.uint8 },
                    { name: 'manufacturerCode', type: dataType_1.default.uint16 },
                    { name: 'imageType', type: dataType_1.default.uint16 },
                    { name: 'fileVersion', type: dataType_1.default.uint32 },
                ],
            },
            imageBlockRequest: {
                ID: 3,
                response: 5,
                parameters: [
                    { name: 'fieldControl', type: dataType_1.default.uint8 },
                    { name: 'manufacturerCode', type: dataType_1.default.uint16 },
                    { name: 'imageType', type: dataType_1.default.uint16 },
                    { name: 'fileVersion', type: dataType_1.default.uint32 },
                    { name: 'fileOffset', type: dataType_1.default.uint32 },
                    { name: 'maximumDataSize', type: dataType_1.default.uint8 },
                ],
            },
            imagePageRequest: {
                ID: 4,
                response: 5,
                parameters: [
                    { name: 'fieldControl', type: dataType_1.default.uint8 },
                    { name: 'manufacturerCode', type: dataType_1.default.uint16 },
                    { name: 'imageType', type: dataType_1.default.uint16 },
                    { name: 'fileVersion', type: dataType_1.default.uint32 },
                    { name: 'fileOffset', type: dataType_1.default.uint32 },
                    { name: 'maximumDataSize', type: dataType_1.default.uint8 },
                    { name: 'pageSize', type: dataType_1.default.uint16 },
                    { name: 'responseSpacing', type: dataType_1.default.uint16 },
                ],
            },
            upgradeEndRequest: {
                ID: 6,
                response: 7,
                parameters: [
                    { name: 'status', type: dataType_1.default.uint8 },
                    { name: 'manufacturerCode', type: dataType_1.default.uint16 },
                    { name: 'imageType', type: dataType_1.default.uint16 },
                    { name: 'fileVersion', type: dataType_1.default.uint32 },
                ],
            }
        },
        commandsResponse: {
            imageNotify: {
                ID: 0,
                parameters: [
                    { name: 'payloadType', type: dataType_1.default.uint8 },
                    { name: 'queryJitter', type: dataType_1.default.uint8 },
                ],
            },
            queryNextImageResponse: {
                ID: 2,
                parameters: [
                    { name: 'status', type: dataType_1.default.uint8 },
                    { name: 'manufacturerCode', type: dataType_1.default.uint16, conditions: [{ type: 'statusEquals', value: 0 }] },
                    { name: 'imageType', type: dataType_1.default.uint16, conditions: [{ type: 'statusEquals', value: 0 }] },
                    { name: 'fileVersion', type: dataType_1.default.uint32, conditions: [{ type: 'statusEquals', value: 0 }] },
                    { name: 'imageSize', type: dataType_1.default.uint32, conditions: [{ type: 'statusEquals', value: 0 }] },
                ],
            },
            imageBlockResponse: {
                ID: 5,
                parameters: [
                    { name: 'status', type: dataType_1.default.uint8 },
                    { name: 'manufacturerCode', type: dataType_1.default.uint16 },
                    { name: 'imageType', type: dataType_1.default.uint16 },
                    { name: 'fileVersion', type: dataType_1.default.uint32 },
                    { name: 'fileOffset', type: dataType_1.default.uint32 },
                    { name: 'dataSize', type: dataType_1.default.uint8 },
                    { name: 'data', type: buffaloZclDataType_1.default.BUFFER },
                ],
            },
            upgradeEndResponse: {
                ID: 7,
                parameters: [
                    { name: 'manufacturerCode', type: dataType_1.default.uint16 },
                    { name: 'imageType', type: dataType_1.default.uint16 },
                    { name: 'fileVersion', type: dataType_1.default.uint32 },
                    { name: 'currentTime', type: dataType_1.default.uint32 },
                    { name: 'upgradeTime', type: dataType_1.default.uint32 },
                ],
            }
        },
    },
    genPollCtrl: {
        ID: 32,
        attributes: {
            checkinInterval: { ID: 0, type: dataType_1.default.uint32 },
            longPollInterval: { ID: 1, type: dataType_1.default.uint32 },
            shortPollInterval: { ID: 2, type: dataType_1.default.uint16 },
            fastPollTimeout: { ID: 3, type: dataType_1.default.uint16 },
            checkinIntervalMin: { ID: 4, type: dataType_1.default.uint32 },
            longPollIntervalMin: { ID: 5, type: dataType_1.default.uint32 },
            fastPollTimeoutMax: { ID: 6, type: dataType_1.default.uint16 },
            physicalClosedLimit: { ID: 0, type: dataType_1.default.uint16 },
        },
        commands: {
            checkinRsp: {
                ID: 0,
                parameters: [
                    { name: 'startfastpolling', type: dataType_1.default.uint8 },
                    { name: 'fastpolltimeout', type: dataType_1.default.uint16 },
                ],
            },
            fastPollStop: {
                ID: 1,
                parameters: [],
            },
            setLongPollInterval: {
                ID: 2,
                parameters: [
                    { name: 'newlongpollinterval', type: dataType_1.default.uint32 },
                ],
            },
            setShortPollInterval: {
                ID: 3,
                parameters: [
                    { name: 'newshortpollinterval', type: dataType_1.default.uint16 },
                ],
            },
        },
        commandsResponse: {
            checkin: {
                ID: 0,
                parameters: [],
            },
        },
    },
    greenPower: {
        ID: 33,
        attributes: {},
        commands: {
            notification: {
                ID: 0,
                parameters: [
                    { name: 'options', type: dataType_1.default.uint16 },
                    { name: 'srcID', type: dataType_1.default.uint32 },
                    { name: 'frameCounter', type: dataType_1.default.uint32 },
                    { name: 'commandID', type: dataType_1.default.uint8 },
                    { name: 'payloadSize', type: dataType_1.default.uint8 },
                    { name: 'commandFrame', type: buffaloZclDataType_1.default.GDP_FRAME },
                ],
            },
            commisioningNotification: {
                ID: 4,
                parameters: [
                    { name: 'options', type: dataType_1.default.uint16 },
                    { name: 'srcID', type: dataType_1.default.uint32 },
                    { name: 'frameCounter', type: dataType_1.default.uint32 },
                    { name: 'commandID', type: dataType_1.default.uint8 },
                    { name: 'payloadSize', type: dataType_1.default.uint8 },
                    { name: 'commandFrame', type: buffaloZclDataType_1.default.GDP_FRAME },
                ],
            },
        },
        commandsResponse: {
            pairing: {
                ID: 1,
                parameters: [
                    { name: 'options', type: dataType_1.default.uint24 },
                    { name: 'srcID', type: dataType_1.default.uint32 },
                    { name: 'sinkGroupID', type: dataType_1.default.uint16 },
                    { name: 'deviceID', type: dataType_1.default.uint8 },
                    { name: 'frameCounter', type: dataType_1.default.uint32 },
                    { name: 'gpdKey', type: buffaloZclDataType_1.default.LIST_UINT8 },
                ],
            },
            commisioningMode: {
                ID: 2,
                parameters: [
                    { name: 'options', type: dataType_1.default.uint8 },
                    { name: 'commisioningWindow', type: dataType_1.default.uint16 },
                ],
            },
        },
    },
    mobileDeviceCfg: {
        ID: 34,
        attributes: {
            keepAliveTime: { ID: 0, type: dataType_1.default.uint16 },
            rejoinTimeout: { ID: 1, type: dataType_1.default.uint16 },
        },
        commands: {},
        commandsResponse: {},
    },
    neighborCleaning: {
        ID: 35,
        attributes: {
            neighborCleaningTimeout: { ID: 0, type: dataType_1.default.uint16 },
        },
        commands: {},
        commandsResponse: {},
    },
    nearestGateway: {
        ID: 36,
        attributes: {
            nearestGateway: { ID: 0, type: dataType_1.default.uint16 },
            newMobileNode: { ID: 1, type: dataType_1.default.uint16 },
        },
        commands: {},
        commandsResponse: {},
    },
    closuresShadeCfg: {
        ID: 256,
        attributes: {
            physicalClosedLimit: { ID: 0, type: dataType_1.default.uint16 },
            motorStepSize: { ID: 1, type: dataType_1.default.uint8 },
            status: { ID: 2, type: dataType_1.default.bitmap8 },
            losedLimit: { ID: 16, type: dataType_1.default.uint16 },
            mode: { ID: 18, type: dataType_1.default.enum8 },
        },
        commands: {},
        commandsResponse: {},
    },
    closuresDoorLock: {
        ID: 257,
        attributes: {
            lockState: { ID: 0, type: dataType_1.default.enum8 },
            lockType: { ID: 38, type: dataType_1.default.bitmap16 },
            actuatorEnabled: { ID: 2, type: dataType_1.default.boolean },
            doorState: { ID: 3, type: dataType_1.default.enum8 },
            doorOpenEvents: { ID: 4, type: dataType_1.default.uint32 },
            doorClosedEvents: { ID: 5, type: dataType_1.default.uint32 },
            openPeriod: { ID: 6, type: dataType_1.default.uint16 },
            numOfLockRecordsSupported: { ID: 16, type: dataType_1.default.uint16 },
            numOfTotalUsersSupported: { ID: 17, type: dataType_1.default.uint16 },
            numOfPinUsersSupported: { ID: 18, type: dataType_1.default.uint16 },
            numOfRfidUsersSupported: { ID: 19, type: dataType_1.default.uint16 },
            numOfWeekDaySchedulesSupportedPerUser: { ID: 20, type: dataType_1.default.uint8 },
            numOfYearDaySchedulesSupportedPerUser: { ID: 21, type: dataType_1.default.uint8 },
            numOfHolidayScheduledsSupported: { ID: 22, type: dataType_1.default.uint8 },
            maxPinLen: { ID: 23, type: dataType_1.default.uint8 },
            minPinLen: { ID: 24, type: dataType_1.default.uint8 },
            maxRfidLen: { ID: 25, type: dataType_1.default.uint8 },
            minRfidLen: { ID: 26, type: dataType_1.default.uint8 },
            enableLogging: { ID: 32, type: dataType_1.default.boolean },
            language: { ID: 33, type: dataType_1.default.charStr },
            ledSettings: { ID: 34, type: dataType_1.default.uint8 },
            autoRelockTime: { ID: 35, type: dataType_1.default.uint32 },
            soundVolume: { ID: 36, type: dataType_1.default.uint8 },
            operatingMode: { ID: 37, type: dataType_1.default.uint32 },
            defaultConfigurationRegister: { ID: 39, type: dataType_1.default.bitmap16 },
            enableLocalProgramming: { ID: 40, type: dataType_1.default.boolean },
            enableOneTouchLocking: { ID: 41, type: dataType_1.default.boolean },
            enableInsideStatusLed: { ID: 42, type: dataType_1.default.boolean },
            enablePrivacyModeButton: { ID: 43, type: dataType_1.default.boolean },
            wrongCodeEntryLimit: { ID: 48, type: dataType_1.default.uint8 },
            userCodeTemporaryDisableTime: { ID: 49, type: dataType_1.default.uint8 },
            sendPinOta: { ID: 50, type: dataType_1.default.boolean },
            requirePinForRfOperation: { ID: 51, type: dataType_1.default.boolean },
            zigbeeSecurityLevel: { ID: 52, type: dataType_1.default.uint8 },
            alarmMask: { ID: 64, type: dataType_1.default.bitmap16 },
            keypadOperationEventMask: { ID: 65, type: dataType_1.default.bitmap16 },
            rfOperationEventMask: { ID: 66, type: dataType_1.default.bitmap16 },
            manualOperationEventMask: { ID: 67, type: dataType_1.default.bitmap16 },
            rfidOperationEventMask: { ID: 68, type: dataType_1.default.bitmap16 },
            keypadProgrammingEventMask: { ID: 69, type: dataType_1.default.bitmap16 },
            rfProgrammingEventMask: { ID: 70, type: dataType_1.default.bitmap16 },
            rfidProgrammingEventMask: { ID: 71, type: dataType_1.default.bitmap16 },
        },
        commands: {
            lockDoor: {
                ID: 0,
                response: 0,
                parameters: [
                    { name: 'pincodevalue', type: dataType_1.default.charStr },
                ],
            },
            unlockDoor: {
                ID: 1,
                response: 1,
                parameters: [
                    { name: 'pincodevalue', type: dataType_1.default.charStr },
                ],
            },
            toggleDoor: {
                ID: 2,
                response: 2,
                parameters: [
                    { name: 'pincodevalue', type: dataType_1.default.charStr },
                ],
            },
            unlockWithTimeout: {
                ID: 3,
                response: 3,
                parameters: [
                    { name: 'timeout', type: dataType_1.default.uint16 },
                    { name: 'pincodevalue', type: dataType_1.default.charStr },
                ],
            },
            getLogRecord: {
                ID: 4,
                response: 4,
                parameters: [
                    { name: 'logindex', type: dataType_1.default.uint16 },
                ],
            },
            setPinCode: {
                ID: 5,
                response: 5,
                parameters: [
                    { name: 'userid', type: dataType_1.default.uint16 },
                    { name: 'userstatus', type: dataType_1.default.uint8 },
                    { name: 'usertype', type: dataType_1.default.uint8 },
                    { name: 'pincodevalue', type: dataType_1.default.charStr },
                ],
            },
            getPinCode: {
                ID: 6,
                response: 6,
                parameters: [
                    { name: 'userid', type: dataType_1.default.uint16 },
                ],
            },
            clearPinCode: {
                ID: 7,
                response: 7,
                parameters: [
                    { name: 'userid', type: dataType_1.default.uint16 },
                ],
            },
            clearAllPinCodes: {
                ID: 8,
                response: 8,
                parameters: [],
            },
            setUserStatus: {
                ID: 9,
                response: 9,
                parameters: [
                    { name: 'userid', type: dataType_1.default.uint16 },
                    { name: 'userstatus', type: dataType_1.default.uint8 },
                ],
            },
            getUserStatus: {
                ID: 10,
                response: 10,
                parameters: [
                    { name: 'userid', type: dataType_1.default.uint16 },
                ],
            },
            setWeekDaySchedule: {
                ID: 11,
                response: 11,
                parameters: [
                    { name: 'scheduleid', type: dataType_1.default.uint8 },
                    { name: 'userid', type: dataType_1.default.uint16 },
                    { name: 'daysmask', type: dataType_1.default.uint8 },
                    { name: 'starthour', type: dataType_1.default.uint8 },
                    { name: 'startminute', type: dataType_1.default.uint8 },
                    { name: 'endhour', type: dataType_1.default.uint8 },
                    { name: 'endminute', type: dataType_1.default.uint8 },
                ],
            },
            getWeekDaySchedule: {
                ID: 12,
                response: 12,
                parameters: [
                    { name: 'scheduleid', type: dataType_1.default.uint8 },
                    { name: 'userid', type: dataType_1.default.uint16 },
                ],
            },
            clearWeekDaySchedule: {
                ID: 13,
                response: 13,
                parameters: [
                    { name: 'scheduleid', type: dataType_1.default.uint8 },
                    { name: 'userid', type: dataType_1.default.uint16 },
                ],
            },
            setYearDaySchedule: {
                ID: 14,
                response: 14,
                parameters: [
                    { name: 'scheduleid', type: dataType_1.default.uint8 },
                    { name: 'userid', type: dataType_1.default.uint16 },
                    { name: 'zigbeelocalstarttime', type: dataType_1.default.uint32 },
                    { name: 'zigbeelocalendtime', type: dataType_1.default.uint32 },
                ],
            },
            getYearDaySchedule: {
                ID: 15,
                response: 15,
                parameters: [
                    { name: 'scheduleid', type: dataType_1.default.uint8 },
                    { name: 'userid', type: dataType_1.default.uint16 },
                ],
            },
            clearYearDaySchedule: {
                ID: 16,
                response: 16,
                parameters: [
                    { name: 'scheduleid', type: dataType_1.default.uint8 },
                    { name: 'userid', type: dataType_1.default.uint16 },
                ],
            },
            setHolidaySchedule: {
                ID: 17,
                response: 17,
                parameters: [
                    { name: 'holidayscheduleid', type: dataType_1.default.uint8 },
                    { name: 'zigbeelocalstarttime', type: dataType_1.default.uint32 },
                    { name: 'zigbeelocalendtime', type: dataType_1.default.uint32 },
                    { name: 'opermodelduringholiday', type: dataType_1.default.uint8 },
                ],
            },
            getHolidaySchedule: {
                ID: 18,
                response: 18,
                parameters: [
                    { name: 'holidayscheduleid', type: dataType_1.default.uint8 },
                ],
            },
            clearHolidaySchedule: {
                ID: 19,
                response: 19,
                parameters: [
                    { name: 'holidayscheduleid', type: dataType_1.default.uint8 },
                ],
            },
            setUserType: {
                ID: 20,
                response: 20,
                parameters: [
                    { name: 'userid', type: dataType_1.default.uint16 },
                    { name: 'usertype', type: dataType_1.default.uint8 },
                ],
            },
            getUserType: {
                ID: 21,
                response: 21,
                parameters: [
                    { name: 'userid', type: dataType_1.default.uint16 },
                ],
            },
            setRfidCode: {
                ID: 22,
                response: 22,
                parameters: [
                    { name: 'userid', type: dataType_1.default.uint16 },
                    { name: 'userstatus', type: dataType_1.default.uint8 },
                    { name: 'usertype', type: dataType_1.default.uint8 },
                    { name: 'pincodevalue', type: dataType_1.default.charStr },
                ],
            },
            getRfidCode: {
                ID: 23,
                response: 23,
                parameters: [
                    { name: 'userid', type: dataType_1.default.uint16 },
                ],
            },
            clearRfidCode: {
                ID: 24,
                response: 24,
                parameters: [
                    { name: 'userid', type: dataType_1.default.uint16 },
                ],
            },
            clearAllRfidCodes: {
                ID: 25,
                response: 25,
                parameters: [],
            },
        },
        commandsResponse: {
            lockDoorRsp: {
                ID: 0,
                parameters: [
                    { name: 'status', type: dataType_1.default.uint8 },
                ],
            },
            unlockDoorRsp: {
                ID: 1,
                parameters: [
                    { name: 'status', type: dataType_1.default.uint8 },
                ],
            },
            toggleDoorRsp: {
                ID: 2,
                parameters: [
                    { name: 'status', type: dataType_1.default.uint8 },
                ],
            },
            unlockWithTimeoutRsp: {
                ID: 3,
                parameters: [
                    { name: 'status', type: dataType_1.default.uint8 },
                ],
            },
            getLogRecordRsp: {
                ID: 4,
                parameters: [
                    { name: 'logentryid', type: dataType_1.default.uint16 },
                    { name: 'timestamp', type: dataType_1.default.uint32 },
                    { name: 'eventtype', type: dataType_1.default.uint8 },
                    { name: 'source', type: dataType_1.default.uint8 },
                    { name: 'eventidalarmcode', type: dataType_1.default.uint8 },
                    { name: 'userid', type: dataType_1.default.uint16 },
                    { name: 'pincodevalue', type: dataType_1.default.charStr },
                ],
            },
            setPinCodeRsp: {
                ID: 5,
                parameters: [
                    { name: 'status', type: dataType_1.default.uint8 },
                ],
            },
            getPinCodeRsp: {
                ID: 6,
                parameters: [
                    { name: 'userid', type: dataType_1.default.uint16 },
                    { name: 'userstatus', type: dataType_1.default.uint8 },
                    { name: 'usertype', type: dataType_1.default.uint8 },
                    { name: 'pincodevalue', type: dataType_1.default.charStr },
                ],
            },
            clearPinCodeRsp: {
                ID: 7,
                parameters: [
                    { name: 'status', type: dataType_1.default.uint8 },
                ],
            },
            clearAllPinCodesRsp: {
                ID: 8,
                parameters: [
                    { name: 'status', type: dataType_1.default.uint8 },
                ],
            },
            setUserStatusRsp: {
                ID: 9,
                parameters: [
                    { name: 'status', type: dataType_1.default.uint8 },
                ],
            },
            getUserStatusRsp: {
                ID: 10,
                parameters: [
                    { name: 'userid', type: dataType_1.default.uint16 },
                    { name: 'userstatus', type: dataType_1.default.uint8 },
                ],
            },
            setWeekDayScheduleRsp: {
                ID: 11,
                parameters: [
                    { name: 'status', type: dataType_1.default.uint8 },
                ],
            },
            getWeekDayScheduleRsp: {
                ID: 12,
                parameters: [
                    { name: 'scheduleid', type: dataType_1.default.uint8 },
                    { name: 'userid', type: dataType_1.default.uint16 },
                    { name: 'status', type: dataType_1.default.uint8 },
                    { name: 'daysmask', type: dataType_1.default.uint8 },
                    { name: 'starthour', type: dataType_1.default.uint8 },
                    { name: 'startminute', type: dataType_1.default.uint8 },
                    { name: 'endhour', type: dataType_1.default.uint8 },
                    { name: 'endminute', type: dataType_1.default.uint8 },
                ],
            },
            clearWeekDayScheduleRsp: {
                ID: 13,
                parameters: [
                    { name: 'status', type: dataType_1.default.uint8 },
                ],
            },
            setYearDayScheduleRsp: {
                ID: 14,
                parameters: [
                    { name: 'status', type: dataType_1.default.uint8 },
                ],
            },
            getYearDayScheduleRsp: {
                ID: 15,
                parameters: [
                    { name: 'scheduleid', type: dataType_1.default.uint8 },
                    { name: 'userid', type: dataType_1.default.uint16 },
                    { name: 'status', type: dataType_1.default.uint8 },
                    { name: 'zigbeelocalstarttime', type: dataType_1.default.uint32 },
                    { name: 'zigbeelocalendtime', type: dataType_1.default.uint32 },
                ],
            },
            clearYearDayScheduleRsp: {
                ID: 16,
                parameters: [
                    { name: 'status', type: dataType_1.default.uint8 },
                ],
            },
            setHolidayScheduleRsp: {
                ID: 17,
                parameters: [
                    { name: 'status', type: dataType_1.default.uint8 },
                ],
            },
            getHolidayScheduleRsp: {
                ID: 18,
                parameters: [
                    { name: 'holidayscheduleid', type: dataType_1.default.uint8 },
                    { name: 'status', type: dataType_1.default.uint8 },
                    { name: 'zigbeelocalstarttime', type: dataType_1.default.uint32 },
                    { name: 'zigbeelocalendtime', type: dataType_1.default.uint32 },
                    { name: 'opermodelduringholiday', type: dataType_1.default.uint8 },
                ],
            },
            clearHolidayScheduleRsp: {
                ID: 19,
                parameters: [
                    { name: 'status', type: dataType_1.default.uint8 },
                ],
            },
            setUserTypeRsp: {
                ID: 20,
                parameters: [
                    { name: 'status', type: dataType_1.default.uint8 },
                ],
            },
            getUserTypeRsp: {
                ID: 21,
                parameters: [
                    { name: 'userid', type: dataType_1.default.uint16 },
                    { name: 'usertype', type: dataType_1.default.uint8 },
                ],
            },
            setRfidCodeRsp: {
                ID: 22,
                parameters: [
                    { name: 'status', type: dataType_1.default.uint8 },
                ],
            },
            getRfidCodeRsp: {
                ID: 23,
                parameters: [
                    { name: 'userid', type: dataType_1.default.uint16 },
                    { name: 'userstatus', type: dataType_1.default.uint8 },
                    { name: 'usertype', type: dataType_1.default.uint8 },
                    { name: 'pincodevalue', type: dataType_1.default.charStr },
                ],
            },
            clearRfidCodeRsp: {
                ID: 24,
                parameters: [
                    { name: 'status', type: dataType_1.default.uint8 },
                ],
            },
            clearAllRfidCodesRsp: {
                ID: 25,
                parameters: [
                    { name: 'status', type: dataType_1.default.uint8 },
                ],
            },
            operationEventNotification: {
                ID: 32,
                parameters: [
                    { name: 'opereventsrc', type: dataType_1.default.uint8 },
                    { name: 'opereventcode', type: dataType_1.default.uint8 },
                    { name: 'userid', type: dataType_1.default.uint16 },
                    { name: 'pin', type: dataType_1.default.uint8 },
                    { name: 'zigbeelocaltime', type: dataType_1.default.uint32 },
                    { name: 'data', type: dataType_1.default.uint8 },
                ],
            },
            programmingEventNotification: {
                ID: 33,
                parameters: [
                    { name: 'programeventsrc', type: dataType_1.default.uint8 },
                    { name: 'programeventcode', type: dataType_1.default.uint8 },
                    { name: 'userid', type: dataType_1.default.uint16 },
                    { name: 'pin', type: dataType_1.default.uint8 },
                    { name: 'usertype', type: dataType_1.default.uint8 },
                    { name: 'userstatus', type: dataType_1.default.uint8 },
                    { name: 'zigbeelocaltime', type: dataType_1.default.uint32 },
                    { name: 'data', type: dataType_1.default.uint8 },
                ],
            },
        },
    },
    closuresWindowCovering: {
        ID: 258,
        attributes: {
            windowCoveringType: { ID: 0, type: dataType_1.default.enum8 },
            physicalClosedLimitLiftCm: { ID: 1, type: dataType_1.default.uint16 },
            physicalClosedLimitTiltDdegree: { ID: 2, type: dataType_1.default.uint16 },
            currentPositionLiftCm: { ID: 3, type: dataType_1.default.uint16 },
            currentPositionTiltDdegree: { ID: 4, type: dataType_1.default.uint16 },
            numOfActuationsLift: { ID: 5, type: dataType_1.default.uint16 },
            numOfActuationsTilt: { ID: 6, type: dataType_1.default.uint16 },
            configStatus: { ID: 7, type: dataType_1.default.bitmap8 },
            currentPositionLiftPercentage: { ID: 8, type: dataType_1.default.uint8 },
            currentPositionTiltPercentage: { ID: 9, type: dataType_1.default.uint8 },
            operationalStatus: { ID: 10, type: dataType_1.default.bitmap8 },
            installedOpenLimitLiftCm: { ID: 16, type: dataType_1.default.uint16 },
            installedClosedLimitLiftCm: { ID: 17, type: dataType_1.default.uint16 },
            installedOpenLimitTiltDdegree: { ID: 18, type: dataType_1.default.uint16 },
            installedClosedLimitTiltDdegree: { ID: 19, type: dataType_1.default.uint16 },
            velocityLift: { ID: 20, type: dataType_1.default.uint16 },
            accelerationTimeLift: { ID: 21, type: dataType_1.default.uint16 },
            decelerationTimeLift: { ID: 22, type: dataType_1.default.uint16 },
            windowCoveringMode: { ID: 23, type: dataType_1.default.bitmap8 },
            intermediateSetpointsLift: { ID: 24, type: dataType_1.default.octetStr },
            intermediateSetpointsTilt: { ID: 25, type: dataType_1.default.octetStr },
            ubisysTurnaroundGuardTime: { ID: 0x1000, type: dataType_1.default.uint8, manufacturerCode: manufacturerCode_1.default.Ubisys },
            ubisysLiftToTiltTransitionSteps: { ID: 0x1001, type: dataType_1.default.uint16, manufacturerCode: manufacturerCode_1.default.Ubisys },
            ubisysTotalSteps: { ID: 0x1002, type: dataType_1.default.uint16, manufacturerCode: manufacturerCode_1.default.Ubisys },
            ubisysLiftToTiltTransitionSteps2: { ID: 0x1003, type: dataType_1.default.uint16, manufacturerCode: manufacturerCode_1.default.Ubisys },
            ubisysTotalSteps2: { ID: 0x1004, type: dataType_1.default.uint16, manufacturerCode: manufacturerCode_1.default.Ubisys },
            ubisysAdditionalSteps: { ID: 0x1005, type: dataType_1.default.uint8, manufacturerCode: manufacturerCode_1.default.Ubisys },
            ubisysInactivePowerThreshold: { ID: 0x1006, type: dataType_1.default.uint16, manufacturerCode: manufacturerCode_1.default.Ubisys },
            ubisysStartupSteps: { ID: 0x1007, type: dataType_1.default.uint16, manufacturerCode: manufacturerCode_1.default.Ubisys },
        },
        commands: {
            upOpen: {
                ID: 0,
                parameters: [],
            },
            downClose: {
                ID: 1,
                parameters: [],
            },
            stop: {
                ID: 2,
                parameters: [],
            },
            goToLiftValue: {
                ID: 4,
                parameters: [
                    { name: 'liftvalue', type: dataType_1.default.uint16 },
                ],
            },
            goToLiftPercentage: {
                ID: 5,
                parameters: [
                    { name: 'percentageliftvalue', type: dataType_1.default.uint8 },
                ],
            },
            goToTiltValue: {
                ID: 7,
                parameters: [
                    { name: 'tiltvalue', type: dataType_1.default.uint16 },
                ],
            },
            goToTiltPercentage: {
                ID: 8,
                parameters: [
                    { name: 'percentagetiltvalue', type: dataType_1.default.uint8 },
                ],
            },
        },
        commandsResponse: {},
    },
    hvacPumpCfgCtrl: {
        ID: 512,
        attributes: {
            maxPressure: { ID: 0, type: dataType_1.default.int16 },
            maxSpeed: { ID: 1, type: dataType_1.default.uint16 },
            maxFlow: { ID: 2, type: dataType_1.default.uint16 },
            minConstPressure: { ID: 3, type: dataType_1.default.int16 },
            maxConstPressure: { ID: 4, type: dataType_1.default.int16 },
            minCompPressure: { ID: 5, type: dataType_1.default.int16 },
            maxCompPressure: { ID: 6, type: dataType_1.default.int16 },
            minConstSpeed: { ID: 7, type: dataType_1.default.uint16 },
            maxConstSpeed: { ID: 8, type: dataType_1.default.uint16 },
            minConstFlow: { ID: 9, type: dataType_1.default.uint16 },
            maxConstFlow: { ID: 10, type: dataType_1.default.uint16 },
            minConstTemp: { ID: 11, type: dataType_1.default.int16 },
            maxConstTemp: { ID: 12, type: dataType_1.default.int16 },
            pumpStatus: { ID: 16, type: dataType_1.default.bitmap16 },
            effectiveOperationMode: { ID: 17, type: dataType_1.default.enum8 },
            effectiveControlMode: { ID: 18, type: dataType_1.default.enum8 },
            capacity: { ID: 19, type: dataType_1.default.int16 },
            speed: { ID: 20, type: dataType_1.default.uint16 },
            lifetimeRunningHours: { ID: 21, type: dataType_1.default.uint24 },
            power: { ID: 22, type: dataType_1.default.uint24 },
            lifetimeEnergyConsumed: { ID: 23, type: dataType_1.default.uint32 },
            operationMode: { ID: 32, type: dataType_1.default.enum8 },
            controlMode: { ID: 33, type: dataType_1.default.enum8 },
            alarmMask: { ID: 34, type: dataType_1.default.bitmap16 },
        },
        commands: {},
        commandsResponse: {},
    },
    hvacThermostat: {
        ID: 513,
        attributes: {
            localTemp: { ID: 0, type: dataType_1.default.int16 },
            outdoorTemp: { ID: 1, type: dataType_1.default.int16 },
            ocupancy: { ID: 2, type: dataType_1.default.bitmap8 },
            absMinHeatSetpointLimit: { ID: 3, type: dataType_1.default.int16 },
            absMaxHeatSetpointLimit: { ID: 4, type: dataType_1.default.int16 },
            absMinCoolSetpointLimit: { ID: 5, type: dataType_1.default.int16 },
            absMaxCoolSetpointLimit: { ID: 6, type: dataType_1.default.int16 },
            pICoolingDemand: { ID: 7, type: dataType_1.default.uint8 },
            pIHeatingDemand: { ID: 8, type: dataType_1.default.uint8 },
            systemTypeConfig: { ID: 9, type: dataType_1.default.bitmap8 },
            localTemperatureCalibration: { ID: 16, type: dataType_1.default.int8 },
            occupiedCoolingSetpoint: { ID: 17, type: dataType_1.default.int16 },
            occupiedHeatingSetpoint: { ID: 18, type: dataType_1.default.int16 },
            unoccupiedCoolingSetpoint: { ID: 19, type: dataType_1.default.int16 },
            unoccupiedHeatingSetpoint: { ID: 20, type: dataType_1.default.int16 },
            minHeatSetpointLimit: { ID: 21, type: dataType_1.default.int16 },
            maxHeatSetpointLimit: { ID: 22, type: dataType_1.default.int16 },
            minCoolSetpointLimit: { ID: 23, type: dataType_1.default.int16 },
            maxCoolSetpointLimit: { ID: 24, type: dataType_1.default.int16 },
            minSetpointDeadBand: { ID: 25, type: dataType_1.default.int8 },
            remoteSensing: { ID: 26, type: dataType_1.default.bitmap8 },
            ctrlSeqeOfOper: { ID: 27, type: dataType_1.default.enum8 },
            systemMode: { ID: 28, type: dataType_1.default.enum8 },
            alarmMask: { ID: 29, type: dataType_1.default.bitmap8 },
            runningMode: { ID: 30, type: dataType_1.default.enum8 },
            startOfWeek: { ID: 32, type: dataType_1.default.enum8 },
            numberOfWeeklyTrans: { ID: 33, type: dataType_1.default.uint8 },
            numberOfDailyTrans: { ID: 34, type: dataType_1.default.uint8 },
            tempSetpointHold: { ID: 35, type: dataType_1.default.enum8 },
            tempSetpointHoldDuration: { ID: 36, type: dataType_1.default.uint16 },
            programingOperMode: { ID: 37, type: dataType_1.default.bitmap8 },
            runningState: { ID: 41, type: dataType_1.default.bitmap16 },
            setpointChangeSource: { ID: 48, type: dataType_1.default.enum8 },
            setpointChangeAmount: { ID: 49, type: dataType_1.default.int16 },
            setpointChangeSourceTimeStamp: { ID: 50, type: dataType_1.default.utc },
            acType: { ID: 64, type: dataType_1.default.enum8 },
            acCapacity: { ID: 65, type: dataType_1.default.uint16 },
            acRefrigerantType: { ID: 66, type: dataType_1.default.enum8 },
            acConpressorType: { ID: 67, type: dataType_1.default.enum8 },
            acErrorCode: { ID: 68, type: dataType_1.default.bitmap32 },
            acLouverPosition: { ID: 69, type: dataType_1.default.enum8 },
            acCollTemp: { ID: 70, type: dataType_1.default.int16 },
            acCapacityFormat: { ID: 71, type: dataType_1.default.enum8 },
            SinopeOccupancy: { ID: 1024, type: dataType_1.default.enum8, manufacturerCode: manufacturerCode_1.default.Sinope },
            SinopeBacklight: { ID: 1026, type: dataType_1.default.enum8, manufacturerCode: manufacturerCode_1.default.Sinope },
            StelproSystemMode: { ID: 0x401c, type: dataType_1.default.enum8 },
            StelproOutdoorTemp: { ID: 0x4001, type: dataType_1.default.int16, manufacturerCode: manufacturerCode_1.default.Stelpro },
        },
        commands: {
            setpointRaiseLower: {
                ID: 0,
                parameters: [
                    { name: 'mode', type: dataType_1.default.uint8 },
                    { name: 'amount', type: dataType_1.default.int8 },
                ],
            },
            setWeeklySchedule: {
                ID: 1,
                parameters: [
                    { name: 'numoftrans', type: dataType_1.default.uint8 },
                    { name: 'dayofweek', type: dataType_1.default.uint8 },
                    { name: 'mode', type: dataType_1.default.uint8 },
                    { name: 'transitions', type: buffaloZclDataType_1.default.LIST_THERMO_TRANSITIONS },
                ],
            },
            getWeeklySchedule: {
                ID: 2,
                parameters: [
                    { name: 'daystoreturn', type: dataType_1.default.uint8 },
                    { name: 'modetoreturn', type: dataType_1.default.uint8 },
                ],
            },
            clearWeeklySchedule: {
                ID: 3,
                parameters: [],
            },
            getRelayStatusLog: {
                ID: 4,
                parameters: [],
            },
        },
        commandsResponse: {
            getWeeklyScheduleRsp: {
                ID: 0,
                parameters: [
                    { name: 'numoftrans', type: dataType_1.default.uint8 },
                    { name: 'dayofweek', type: dataType_1.default.uint8 },
                    { name: 'mode', type: dataType_1.default.uint8 },
                    { name: 'transitions', type: buffaloZclDataType_1.default.LIST_THERMO_TRANSITIONS },
                ],
            },
            getRelayStatusLogRsp: {
                ID: 1,
                parameters: [
                    { name: 'timeofday', type: dataType_1.default.uint16 },
                    { name: 'relaystatus', type: dataType_1.default.uint16 },
                    { name: 'localtemp', type: dataType_1.default.uint16 },
                    { name: 'humidity', type: dataType_1.default.uint8 },
                    { name: 'setpoint', type: dataType_1.default.uint16 },
                    { name: 'unreadentries', type: dataType_1.default.uint16 },
                ],
            },
        },
    },
    hvacFanCtrl: {
        ID: 514,
        attributes: {
            fanMode: { ID: 0, type: dataType_1.default.enum8 },
            fanModeSequence: { ID: 1, type: dataType_1.default.enum8 },
        },
        commands: {},
        commandsResponse: {},
    },
    hvacDehumidificationCtrl: {
        ID: 515,
        attributes: {
            relativeHumidity: { ID: 0, type: dataType_1.default.uint8 },
            dehumidCooling: { ID: 1, type: dataType_1.default.uint8 },
            rhDehumidSetpoint: { ID: 16, type: dataType_1.default.uint8 },
            relativeHumidityMode: { ID: 17, type: dataType_1.default.enum8 },
            dehumidLockout: { ID: 18, type: dataType_1.default.enum8 },
            dehumidHysteresis: { ID: 19, type: dataType_1.default.uint8 },
            dehumidMaxCool: { ID: 20, type: dataType_1.default.uint8 },
            relativeHumidDisplay: { ID: 21, type: dataType_1.default.enum8 },
        },
        commands: {},
        commandsResponse: {},
    },
    hvacUserInterfaceCfg: {
        ID: 516,
        attributes: {
            tempDisplayMode: { ID: 0, type: dataType_1.default.enum8 },
            keypadLockout: { ID: 1, type: dataType_1.default.enum8 },
            programmingVisibility: { ID: 2, type: dataType_1.default.enum8 },
        },
        commands: {},
        commandsResponse: {},
    },
    lightingColorCtrl: {
        ID: 768,
        attributes: {
            currentHue: { ID: 0, type: dataType_1.default.uint8 },
            currentSaturation: { ID: 1, type: dataType_1.default.uint8 },
            remainingTime: { ID: 2, type: dataType_1.default.uint16 },
            currentX: { ID: 3, type: dataType_1.default.uint16 },
            currentY: { ID: 4, type: dataType_1.default.uint16 },
            driftCompensation: { ID: 5, type: dataType_1.default.enum8 },
            compensationText: { ID: 6, type: dataType_1.default.charStr },
            colorTemperature: { ID: 7, type: dataType_1.default.uint16 },
            colorMode: { ID: 8, type: dataType_1.default.enum8 },
            numPrimaries: { ID: 16, type: dataType_1.default.uint8 },
            primary1X: { ID: 17, type: dataType_1.default.uint16 },
            primary1Y: { ID: 18, type: dataType_1.default.uint16 },
            primary1Intensity: { ID: 19, type: dataType_1.default.uint8 },
            primary2X: { ID: 21, type: dataType_1.default.uint16 },
            primary2Y: { ID: 22, type: dataType_1.default.uint16 },
            primary2Intensity: { ID: 23, type: dataType_1.default.uint8 },
            primary3X: { ID: 25, type: dataType_1.default.uint16 },
            primary3Y: { ID: 26, type: dataType_1.default.uint16 },
            primary3Intensity: { ID: 27, type: dataType_1.default.uint8 },
            primary4X: { ID: 32, type: dataType_1.default.uint16 },
            primary4Y: { ID: 33, type: dataType_1.default.uint16 },
            primary4Intensity: { ID: 34, type: dataType_1.default.uint8 },
            primary5X: { ID: 36, type: dataType_1.default.uint16 },
            primary5Y: { ID: 37, type: dataType_1.default.uint16 },
            primary5Intensity: { ID: 38, type: dataType_1.default.uint8 },
            primary6X: { ID: 40, type: dataType_1.default.uint16 },
            primary6Y: { ID: 41, type: dataType_1.default.uint16 },
            primary6Intensity: { ID: 42, type: dataType_1.default.uint8 },
            whitePointX: { ID: 48, type: dataType_1.default.uint16 },
            whitePointY: { ID: 49, type: dataType_1.default.uint16 },
            colorPointRX: { ID: 50, type: dataType_1.default.uint16 },
            colorPointRY: { ID: 51, type: dataType_1.default.uint16 },
            colorPointRIntensity: { ID: 52, type: dataType_1.default.uint8 },
            colorPointGX: { ID: 54, type: dataType_1.default.uint16 },
            colorPointGY: { ID: 55, type: dataType_1.default.uint16 },
            colorPointGIntensity: { ID: 56, type: dataType_1.default.uint8 },
            colorPointBX: { ID: 58, type: dataType_1.default.uint16 },
            colorPointBY: { ID: 59, type: dataType_1.default.uint16 },
            colorPointBIntensity: { ID: 60, type: dataType_1.default.uint8 },
            enhancedCurrentHue: { ID: 16384, type: dataType_1.default.uint16 },
            enhancedColorMode: { ID: 16385, type: dataType_1.default.enum8 },
            colorLoopActive: { ID: 16386, type: dataType_1.default.uint8 },
            colorLoopDirection: { ID: 16387, type: dataType_1.default.uint8 },
            colorLoopTime: { ID: 16388, type: dataType_1.default.uint16 },
            colorLoopStartEnhancedHue: { ID: 16389, type: dataType_1.default.uint16 },
            colorLoopStoredEnhancedHue: { ID: 16390, type: dataType_1.default.uint16 },
            colorCapabilities: { ID: 16394, type: dataType_1.default.uint16 },
            colorTempPhysicalMin: { ID: 16395, type: dataType_1.default.uint16 },
            colorTempPhysicalMax: { ID: 16396, type: dataType_1.default.uint16 },
        },
        commands: {
            moveToHue: {
                ID: 0,
                parameters: [
                    { name: 'hue', type: dataType_1.default.uint8 },
                    { name: 'direction', type: dataType_1.default.uint8 },
                    { name: 'transtime', type: dataType_1.default.uint16 },
                ],
            },
            moveHue: {
                ID: 1,
                parameters: [
                    { name: 'movemode', type: dataType_1.default.uint8 },
                    { name: 'rate', type: dataType_1.default.uint8 },
                ],
            },
            stepHue: {
                ID: 2,
                parameters: [
                    { name: 'stepmode', type: dataType_1.default.uint8 },
                    { name: 'stepsize', type: dataType_1.default.uint8 },
                    { name: 'transtime', type: dataType_1.default.uint8 },
                ],
            },
            moveToSaturation: {
                ID: 3,
                parameters: [
                    { name: 'saturation', type: dataType_1.default.uint8 },
                    { name: 'transtime', type: dataType_1.default.uint16 },
                ],
            },
            moveSaturation: {
                ID: 4,
                parameters: [
                    { name: 'movemode', type: dataType_1.default.uint8 },
                    { name: 'rate', type: dataType_1.default.uint8 },
                ],
            },
            stepSaturation: {
                ID: 5,
                parameters: [
                    { name: 'stepmode', type: dataType_1.default.uint8 },
                    { name: 'stepsize', type: dataType_1.default.uint8 },
                    { name: 'transtime', type: dataType_1.default.uint8 },
                ],
            },
            moveToHueAndSaturation: {
                ID: 6,
                parameters: [
                    { name: 'hue', type: dataType_1.default.uint8 },
                    { name: 'saturation', type: dataType_1.default.uint8 },
                    { name: 'transtime', type: dataType_1.default.uint16 },
                ],
            },
            moveToColor: {
                ID: 7,
                parameters: [
                    { name: 'colorx', type: dataType_1.default.uint16 },
                    { name: 'colory', type: dataType_1.default.uint16 },
                    { name: 'transtime', type: dataType_1.default.uint16 },
                ],
            },
            moveColor: {
                ID: 8,
                parameters: [
                    { name: 'ratex', type: dataType_1.default.int16 },
                    { name: 'ratey', type: dataType_1.default.int16 },
                ],
            },
            stepColor: {
                ID: 9,
                parameters: [
                    { name: 'stepx', type: dataType_1.default.int16 },
                    { name: 'stepy', type: dataType_1.default.int16 },
                    { name: 'transtime', type: dataType_1.default.uint16 },
                ],
            },
            moveToColorTemp: {
                ID: 10,
                parameters: [
                    { name: 'colortemp', type: dataType_1.default.uint16 },
                    { name: 'transtime', type: dataType_1.default.uint16 },
                ],
            },
            enhancedMoveToHue: {
                ID: 64,
                parameters: [
                    { name: 'enhancehue', type: dataType_1.default.uint16 },
                    { name: 'direction', type: dataType_1.default.uint8 },
                    { name: 'transtime', type: dataType_1.default.uint16 },
                ],
            },
            enhancedMoveHue: {
                ID: 65,
                parameters: [
                    { name: 'movemode', type: dataType_1.default.uint8 },
                    { name: 'rate', type: dataType_1.default.uint16 },
                ],
            },
            enhancedStepHue: {
                ID: 66,
                parameters: [
                    { name: 'stepmode', type: dataType_1.default.uint8 },
                    { name: 'stepsize', type: dataType_1.default.uint16 },
                    { name: 'transtime', type: dataType_1.default.uint16 },
                ],
            },
            enhancedMoveToHueAndSaturation: {
                ID: 67,
                parameters: [
                    { name: 'enhancehue', type: dataType_1.default.uint16 },
                    { name: 'saturation', type: dataType_1.default.uint8 },
                    { name: 'transtime', type: dataType_1.default.uint16 },
                ],
            },
            colorLoopSet: {
                ID: 68,
                parameters: [
                    { name: 'updateflags', type: dataType_1.default.uint8 },
                    { name: 'action', type: dataType_1.default.uint8 },
                    { name: 'direction', type: dataType_1.default.uint8 },
                    { name: 'time', type: dataType_1.default.uint16 },
                    { name: 'starthue', type: dataType_1.default.uint16 },
                ],
            },
            stopMoveStep: {
                ID: 71,
                parameters: [
                    { name: 'bits', type: dataType_1.default.uint8 },
                    { name: 'bytee', type: dataType_1.default.uint8 },
                    { name: 'action', type: dataType_1.default.uint8 },
                    { name: 'direction', type: dataType_1.default.uint8 },
                    { name: 'time', type: dataType_1.default.uint16 },
                    { name: 'starthue', type: dataType_1.default.uint16 },
                ],
            },
            moveColorTemp: {
                ID: 75,
                parameters: [
                    { name: 'movemode', type: dataType_1.default.uint8 },
                    { name: 'rate', type: dataType_1.default.uint16 },
                    { name: 'minimum', type: dataType_1.default.uint16 },
                    { name: 'maximum', type: dataType_1.default.uint16 },
                ],
            },
            stepColorTemp: {
                ID: 76,
                parameters: [
                    { name: 'stepmode', type: dataType_1.default.uint8 },
                    { name: 'stepsize', type: dataType_1.default.uint16 },
                    { name: 'transtime', type: dataType_1.default.uint16 },
                    { name: 'minimum', type: dataType_1.default.uint16 },
                    { name: 'maximum', type: dataType_1.default.uint16 },
                ],
            },
        },
        commandsResponse: {},
    },
    lightingBallastCfg: {
        ID: 769,
        attributes: {
            physicalMinLevel: { ID: 0, type: dataType_1.default.uint8 },
            physicalMaxLevel: { ID: 1, type: dataType_1.default.uint8 },
            ballastStatus: { ID: 2, type: dataType_1.default.bitmap8 },
            minLevel: { ID: 16, type: dataType_1.default.uint8 },
            maxLevel: { ID: 17, type: dataType_1.default.uint8 },
            powerOnLevel: { ID: 18, type: dataType_1.default.uint8 },
            powerOnFadeTime: { ID: 19, type: dataType_1.default.uint16 },
            intrinsicBallastFactor: { ID: 20, type: dataType_1.default.uint8 },
            ballastFactorAdjustment: { ID: 21, type: dataType_1.default.uint8 },
            lampQuantity: { ID: 32, type: dataType_1.default.uint8 },
            lampType: { ID: 48, type: dataType_1.default.charStr },
            lampManufacturer: { ID: 49, type: dataType_1.default.charStr },
            lampRatedHours: { ID: 50, type: dataType_1.default.uint24 },
            lampBurnHours: { ID: 51, type: dataType_1.default.uint24 },
            lampAlarmMode: { ID: 52, type: dataType_1.default.bitmap8 },
            lampBurnHoursTripPoint: { ID: 53, type: dataType_1.default.uint24 },
        },
        commands: {},
        commandsResponse: {},
    },
    msIlluminanceMeasurement: {
        ID: 1024,
        attributes: {
            measuredValue: { ID: 0, type: dataType_1.default.uint16 },
            minMeasuredValue: { ID: 1, type: dataType_1.default.uint16 },
            maxMeasuredValue: { ID: 2, type: dataType_1.default.uint16 },
            tolerance: { ID: 3, type: dataType_1.default.uint16 },
            lightSensorType: { ID: 4, type: dataType_1.default.enum8 },
        },
        commands: {},
        commandsResponse: {},
    },
    msIlluminanceLevelSensing: {
        ID: 1025,
        attributes: {
            levelStatus: { ID: 0, type: dataType_1.default.enum8 },
            lightSensorType: { ID: 1, type: dataType_1.default.enum8 },
            illuminanceTargetLevel: { ID: 16, type: dataType_1.default.uint16 },
        },
        commands: {},
        commandsResponse: {},
    },
    msTemperatureMeasurement: {
        ID: 1026,
        attributes: {
            measuredValue: { ID: 0, type: dataType_1.default.int16 },
            minMeasuredValue: { ID: 1, type: dataType_1.default.int16 },
            maxMeasuredValue: { ID: 2, type: dataType_1.default.int16 },
            tolerance: { ID: 3, type: dataType_1.default.uint16 },
            minPercentChange: { ID: 16, type: dataType_1.default.unknown },
            minAbsoluteChange: { ID: 17, type: dataType_1.default.unknown },
        },
        commands: {},
        commandsResponse: {},
    },
    msPressureMeasurement: {
        ID: 1027,
        attributes: {
            measuredValue: { ID: 0, type: dataType_1.default.int16 },
            minMeasuredValue: { ID: 1, type: dataType_1.default.int16 },
            maxMeasuredValue: { ID: 2, type: dataType_1.default.int16 },
            tolerance: { ID: 3, type: dataType_1.default.uint16 },
        },
        commands: {},
        commandsResponse: {},
    },
    kmpcilPressureMeasurement: {
        ID: 1027,
        attributes: {
            measuredValue: { ID: 0, type: dataType_1.default.uint16 },
        },
        commands: {},
        commandsResponse: {},
    },
    msFlowMeasurement: {
        ID: 1028,
        attributes: {
            measuredValue: { ID: 0, type: dataType_1.default.uint16 },
            minMeasuredValue: { ID: 1, type: dataType_1.default.uint16 },
            maxMeasuredValue: { ID: 2, type: dataType_1.default.uint16 },
            tolerance: { ID: 3, type: dataType_1.default.uint16 },
        },
        commands: {},
        commandsResponse: {},
    },
    msRelativeHumidity: {
        ID: 1029,
        attributes: {
            measuredValue: { ID: 0, type: dataType_1.default.uint16 },
            minMeasuredValue: { ID: 1, type: dataType_1.default.uint16 },
            maxMeasuredValue: { ID: 2, type: dataType_1.default.uint16 },
            tolerance: { ID: 3, type: dataType_1.default.uint16 },
        },
        commands: {},
        commandsResponse: {},
    },
    msOccupancySensing: {
        ID: 1030,
        attributes: {
            occupancy: { ID: 0, type: dataType_1.default.bitmap8 },
            occupancySensorType: { ID: 1, type: dataType_1.default.enum8 },
            pirOToUDelay: { ID: 16, type: dataType_1.default.uint16 },
            pirUToODelay: { ID: 17, type: dataType_1.default.uint16 },
            pirUToOThreshold: { ID: 18, type: dataType_1.default.uint8 },
            ultrasonicOToUDelay: { ID: 32, type: dataType_1.default.uint16 },
            ultrasonicUToODelay: { ID: 33, type: dataType_1.default.uint16 },
            ultrasonicUToOThreshold: { ID: 34, type: dataType_1.default.uint8 },
        },
        commands: {},
        commandsResponse: {},
    },
    ssIasZone: {
        ID: 1280,
        attributes: {
            zoneState: { ID: 0, type: dataType_1.default.enum8 },
            zoneType: { ID: 1, type: dataType_1.default.enum16 },
            zoneStatus: { ID: 2, type: dataType_1.default.bitmap16 },
            iasCieAddr: { ID: 16, type: dataType_1.default.ieeeAddr },
            zoneId: { ID: 17, type: dataType_1.default.uint8 },
            numZoneSensitivityLevelsSupported: { ID: 18, type: dataType_1.default.uint8 },
            currentZoneSensitivityLevel: { ID: 19, type: dataType_1.default.uint8 },
        },
        commands: {
            enrollRsp: {
                ID: 0,
                parameters: [
                    { name: 'enrollrspcode', type: dataType_1.default.uint8 },
                    { name: 'zoneid', type: dataType_1.default.uint8 },
                ],
            },
            initNormalOpMode: {
                ID: 1,
                parameters: [],
            },
            initTestMode: {
                ID: 2,
                parameters: [],
            },
        },
        commandsResponse: {
            statusChangeNotification: {
                ID: 0,
                parameters: [
                    { name: 'zonestatus', type: dataType_1.default.uint16 },
                    { name: 'extendedstatus', type: dataType_1.default.uint8 },
                ],
            },
            enrollReq: {
                ID: 1,
                parameters: [
                    { name: 'zonetype', type: dataType_1.default.uint16 },
                    { name: 'manucode', type: dataType_1.default.uint16 },
                ],
            },
        },
    },
    ssIasAce: {
        ID: 1281,
        attributes: {},
        commands: {
            arm: {
                ID: 0,
                parameters: [
                    { name: 'armmode', type: dataType_1.default.uint8 },
                ],
            },
            bypass: {
                ID: 1,
                parameters: [
                    { name: 'numofzones', type: dataType_1.default.uint8 },
                    { name: 'zoneidlist', type: buffaloZclDataType_1.default.LIST_UINT8 },
                ],
            },
            emergency: {
                ID: 2,
                parameters: [],
            },
            fire: {
                ID: 3,
                parameters: [],
            },
            panic: {
                ID: 4,
                parameters: [],
            },
            getZoneIDMap: {
                ID: 5,
                parameters: [],
            },
            getZoneInfo: {
                ID: 6,
                parameters: [
                    { name: 'zoneid', type: dataType_1.default.uint8 },
                ],
            },
            getPanelStatus: {
                ID: 7,
                parameters: [],
            },
            getBypassedZoneList: {
                ID: 8,
                parameters: [],
            },
            getZoneStatus: {
                ID: 9,
                parameters: [
                    { name: 'startzoneid', type: dataType_1.default.uint8 },
                    { name: 'maxnumzoneid', type: dataType_1.default.uint8 },
                    { name: 'zonestatusmaskflag', type: dataType_1.default.uint8 },
                    { name: 'zonestatusmask', type: dataType_1.default.uint16 },
                ],
            },
        },
        commandsResponse: {
            armRsp: {
                ID: 0,
                parameters: [
                    { name: 'armnotification', type: dataType_1.default.uint8 },
                ],
            },
            getZoneIDMapRsp: {
                ID: 1,
                parameters: [
                    { name: 'zoneidmapsection0', type: dataType_1.default.uint16 },
                    { name: 'zoneidmapsection1', type: dataType_1.default.uint16 },
                    { name: 'zoneidmapsection2', type: dataType_1.default.uint16 },
                    { name: 'zoneidmapsection3', type: dataType_1.default.uint16 },
                    { name: 'zoneidmapsection4', type: dataType_1.default.uint16 },
                    { name: 'zoneidmapsection5', type: dataType_1.default.uint16 },
                    { name: 'zoneidmapsection6', type: dataType_1.default.uint16 },
                    { name: 'zoneidmapsection7', type: dataType_1.default.uint16 },
                    { name: 'zoneidmapsection8', type: dataType_1.default.uint16 },
                    { name: 'zoneidmapsection9', type: dataType_1.default.uint16 },
                    { name: 'zoneidmapsection10', type: dataType_1.default.uint16 },
                    { name: 'zoneidmapsection11', type: dataType_1.default.uint16 },
                    { name: 'zoneidmapsection12', type: dataType_1.default.uint16 },
                    { name: 'zoneidmapsection13', type: dataType_1.default.uint16 },
                    { name: 'zoneidmapsection14', type: dataType_1.default.uint16 },
                    { name: 'zoneidmapsection15', type: dataType_1.default.uint16 },
                ],
            },
            getZoneInfoRsp: {
                ID: 2,
                parameters: [
                    { name: 'zoneid', type: dataType_1.default.uint8 },
                    { name: 'zonetype', type: dataType_1.default.uint16 },
                    { name: 'ieeeaddr', type: dataType_1.default.ieeeAddr },
                ],
            },
            zoneStatusChanged: {
                ID: 3,
                parameters: [
                    { name: 'zoneid', type: dataType_1.default.uint8 },
                    { name: 'zonestatus', type: dataType_1.default.uint16 },
                    { name: 'audiblenotif', type: dataType_1.default.uint8 },
                    { name: 'strlen', type: dataType_1.default.uint8 },
                    { name: 'string', type: dataType_1.default.charStr },
                ],
            },
            panelStatusChanged: {
                ID: 4,
                parameters: [
                    { name: 'panelstatus', type: dataType_1.default.uint8 },
                    { name: 'secondsremain', type: dataType_1.default.uint8 },
                    { name: 'audiblenotif', type: dataType_1.default.uint8 },
                    { name: 'alarmstatus', type: dataType_1.default.uint8 },
                ],
            },
            getPanelStatusRsp: {
                ID: 5,
                parameters: [
                    { name: 'panelstatus', type: dataType_1.default.uint8 },
                    { name: 'secondsremain', type: dataType_1.default.uint8 },
                    { name: 'audiblenotif', type: dataType_1.default.uint8 },
                    { name: 'alarmstatus', type: dataType_1.default.uint8 },
                ],
            },
            setBypassedZoneList: {
                ID: 6,
                parameters: [
                    { name: 'numofzones', type: dataType_1.default.uint8 },
                    { name: 'zoneid', type: buffaloZclDataType_1.default.LIST_UINT8 },
                ],
            },
            bypassRsp: {
                ID: 7,
                parameters: [
                    { name: 'numofzones', type: dataType_1.default.uint8 },
                    { name: 'bypassresult', type: buffaloZclDataType_1.default.LIST_UINT8 },
                ],
            },
            getZoneStatusRsp: {
                ID: 8,
                parameters: [
                    { name: 'zonestatuscomplete', type: dataType_1.default.uint8 },
                    { name: 'numofzones', type: dataType_1.default.uint8 },
                    { name: 'zoneinfo', type: buffaloZclDataType_1.default.LIST_ZONEINFO },
                ],
            },
        },
    },
    ssIasWd: {
        ID: 1282,
        attributes: {
            maxDuration: { ID: 0, type: dataType_1.default.uint16 },
        },
        commands: {
            startWarning: {
                ID: 0,
                parameters: [
                    { name: 'startwarninginfo', type: dataType_1.default.uint8 },
                    { name: 'warningduration', type: dataType_1.default.uint16 },
                ],
            },
            squawk: {
                ID: 1,
                parameters: [
                    { name: 'squawkinfo', type: dataType_1.default.uint8 },
                ],
            },
        },
        commandsResponse: {},
    },
    piGenericTunnel: {
        ID: 1536,
        attributes: {
            maxIncomeTransSize: { ID: 1, type: dataType_1.default.uint16 },
            maxOutgoTransSize: { ID: 2, type: dataType_1.default.uint16 },
            protocolAddr: { ID: 3, type: dataType_1.default.octetStr },
        },
        commands: {
            matchProtocolAddr: {
                ID: 0,
                parameters: [
                    { name: 'protocoladdr', type: dataType_1.default.charStr },
                ],
            },
        },
        commandsResponse: {
            matchProtocolAddrRsp: {
                ID: 0,
                parameters: [
                    { name: 'devieeeaddr', type: dataType_1.default.ieeeAddr },
                    { name: 'protocoladdr', type: dataType_1.default.charStr },
                ],
            },
            advertiseProtocolAddr: {
                ID: 1,
                parameters: [
                    { name: 'protocoladdr', type: dataType_1.default.charStr },
                ],
            },
        },
    },
    piBacnetProtocolTunnel: {
        ID: 1537,
        attributes: {},
        commands: {
            transferNpdu: {
                ID: 0,
                parameters: [
                    { name: 'npdu', type: dataType_1.default.uint8 },
                ],
            },
        },
        commandsResponse: {},
    },
    piAnalogInputReg: {
        ID: 1538,
        attributes: {
            covIncrement: { ID: 22, type: dataType_1.default.singlePrec },
            deviceType: { ID: 31, type: dataType_1.default.charStr },
            objectId: { ID: 75, type: dataType_1.default.bacOid },
            objectName: { ID: 77, type: dataType_1.default.charStr },
            objectType: { ID: 79, type: dataType_1.default.enum16 },
            updateInterval: { ID: 118, type: dataType_1.default.uint8 },
            profileName: { ID: 168, type: dataType_1.default.charStr },
        },
        commands: {},
        commandsResponse: {},
    },
    piAnalogInputExt: {
        ID: 1539,
        attributes: {
            ackedTransitions: { ID: 0, type: dataType_1.default.bitmap8 },
            notificationClass: { ID: 17, type: dataType_1.default.uint16 },
            deadband: { ID: 25, type: dataType_1.default.singlePrec },
            eventEnable: { ID: 35, type: dataType_1.default.bitmap8 },
            eventState: { ID: 36, type: dataType_1.default.enum8 },
            highLimit: { ID: 45, type: dataType_1.default.singlePrec },
            limitEnable: { ID: 52, type: dataType_1.default.bitmap8 },
            lowLimit: { ID: 59, type: dataType_1.default.singlePrec },
            notifyType: { ID: 72, type: dataType_1.default.enum8 },
            timeDelay: { ID: 113, type: dataType_1.default.uint8 },
            eventTimeStamps: { ID: 130, type: dataType_1.default.array },
        },
        commands: {
            transferApdu: {
                ID: 0,
                parameters: [],
            },
            connectReq: {
                ID: 1,
                parameters: [],
            },
            disconnectReq: {
                ID: 2,
                parameters: [],
            },
            connectStatusNoti: {
                ID: 3,
                parameters: [],
            },
        },
        commandsResponse: {},
    },
    piAnalogOutputReg: {
        ID: 1540,
        attributes: {
            covIncrement: { ID: 22, type: dataType_1.default.singlePrec },
            deviceType: { ID: 31, type: dataType_1.default.charStr },
            objectId: { ID: 75, type: dataType_1.default.bacOid },
            objectName: { ID: 77, type: dataType_1.default.charStr },
            objectType: { ID: 79, type: dataType_1.default.enum16 },
            updateInterval: { ID: 118, type: dataType_1.default.uint8 },
            profileName: { ID: 168, type: dataType_1.default.charStr },
        },
        commands: {},
        commandsResponse: {},
    },
    piAnalogOutputExt: {
        ID: 1541,
        attributes: {
            ackedTransitions: { ID: 0, type: dataType_1.default.bitmap8 },
            notificationClass: { ID: 17, type: dataType_1.default.uint16 },
            deadband: { ID: 25, type: dataType_1.default.singlePrec },
            eventEnable: { ID: 35, type: dataType_1.default.bitmap8 },
            eventState: { ID: 36, type: dataType_1.default.enum8 },
            highLimit: { ID: 45, type: dataType_1.default.singlePrec },
            limitEnable: { ID: 52, type: dataType_1.default.bitmap8 },
            lowLimit: { ID: 59, type: dataType_1.default.singlePrec },
            notifyType: { ID: 72, type: dataType_1.default.enum8 },
            timeDelay: { ID: 113, type: dataType_1.default.uint8 },
            eventTimeStamps: { ID: 130, type: dataType_1.default.array },
        },
        commands: {},
        commandsResponse: {},
    },
    piAnalogValueReg: {
        ID: 1542,
        attributes: {
            covIncrement: { ID: 22, type: dataType_1.default.singlePrec },
            objectId: { ID: 75, type: dataType_1.default.bacOid },
            objectName: { ID: 77, type: dataType_1.default.charStr },
            objectType: { ID: 79, type: dataType_1.default.enum16 },
            profileName: { ID: 168, type: dataType_1.default.charStr },
        },
        commands: {},
        commandsResponse: {},
    },
    piAnalogValueExt: {
        ID: 1543,
        attributes: {
            ackedTransitions: { ID: 0, type: dataType_1.default.bitmap8 },
            notificationClass: { ID: 17, type: dataType_1.default.uint16 },
            deadband: { ID: 25, type: dataType_1.default.singlePrec },
            eventEnable: { ID: 35, type: dataType_1.default.bitmap8 },
            eventState: { ID: 36, type: dataType_1.default.enum8 },
            highLimit: { ID: 45, type: dataType_1.default.singlePrec },
            limitEnable: { ID: 52, type: dataType_1.default.bitmap8 },
            lowLimit: { ID: 59, type: dataType_1.default.singlePrec },
            notifyType: { ID: 72, type: dataType_1.default.enum8 },
            timeDelay: { ID: 113, type: dataType_1.default.uint8 },
            eventTimeStamps: { ID: 130, type: dataType_1.default.array },
        },
        commands: {},
        commandsResponse: {},
    },
    piBinaryInputReg: {
        ID: 1544,
        attributes: {
            changeOfStateCount: { ID: 15, type: dataType_1.default.uint32 },
            changeOfStateTime: { ID: 16, type: dataType_1.default.struct },
            deviceType: { ID: 31, type: dataType_1.default.charStr },
            elapsedActiveTime: { ID: 33, type: dataType_1.default.uint32 },
            objectIdentifier: { ID: 75, type: dataType_1.default.bacOid },
            objectName: { ID: 77, type: dataType_1.default.charStr },
            objectType: { ID: 79, type: dataType_1.default.enum16 },
            timeOfATReset: { ID: 114, type: dataType_1.default.struct },
            timeOfSCReset: { ID: 115, type: dataType_1.default.struct },
            profileName: { ID: 168, type: dataType_1.default.charStr },
        },
        commands: {},
        commandsResponse: {},
    },
    piBinaryInputExt: {
        ID: 1545,
        attributes: {
            ackedTransitions: { ID: 0, type: dataType_1.default.bitmap8 },
            alarmValue: { ID: 6, type: dataType_1.default.boolean },
            notificationClass: { ID: 17, type: dataType_1.default.uint16 },
            eventEnable: { ID: 35, type: dataType_1.default.bitmap8 },
            eventState: { ID: 36, type: dataType_1.default.enum8 },
            notifyType: { ID: 72, type: dataType_1.default.enum8 },
            timeDelay: { ID: 113, type: dataType_1.default.uint8 },
            eventTimeStamps: { ID: 130, type: dataType_1.default.array },
        },
        commands: {},
        commandsResponse: {},
    },
    piBinaryOutputReg: {
        ID: 1546,
        attributes: {
            changeOfStateCount: { ID: 15, type: dataType_1.default.uint32 },
            changeOfStateTime: { ID: 16, type: dataType_1.default.struct },
            deviceType: { ID: 31, type: dataType_1.default.charStr },
            elapsedActiveTime: { ID: 33, type: dataType_1.default.uint32 },
            feedBackValue: { ID: 40, type: dataType_1.default.enum8 },
            objectIdentifier: { ID: 75, type: dataType_1.default.bacOid },
            objectName: { ID: 77, type: dataType_1.default.charStr },
            objectType: { ID: 79, type: dataType_1.default.enum16 },
            timeOfATReset: { ID: 114, type: dataType_1.default.struct },
            timeOfSCReset: { ID: 115, type: dataType_1.default.struct },
            profileName: { ID: 168, type: dataType_1.default.charStr },
        },
        commands: {},
        commandsResponse: {},
    },
    piBinaryOutputExt: {
        ID: 1547,
        attributes: {
            ackedTransitions: { ID: 0, type: dataType_1.default.bitmap8 },
            notificationClass: { ID: 17, type: dataType_1.default.uint16 },
            eventEnable: { ID: 35, type: dataType_1.default.bitmap8 },
            eventState: { ID: 36, type: dataType_1.default.enum8 },
            notifyType: { ID: 72, type: dataType_1.default.enum8 },
            timeDelay: { ID: 113, type: dataType_1.default.uint8 },
            eventTimeStamps: { ID: 130, type: dataType_1.default.array },
        },
        commands: {},
        commandsResponse: {},
    },
    piBinaryValueReg: {
        ID: 1548,
        attributes: {
            changeOfStateCount: { ID: 15, type: dataType_1.default.uint32 },
            changeOfStateTime: { ID: 16, type: dataType_1.default.struct },
            elapsedActiveTime: { ID: 33, type: dataType_1.default.uint32 },
            objectIdentifier: { ID: 75, type: dataType_1.default.bacOid },
            objectName: { ID: 77, type: dataType_1.default.charStr },
            objectType: { ID: 79, type: dataType_1.default.enum16 },
            timeOfATReset: { ID: 114, type: dataType_1.default.struct },
            timeOfSCReset: { ID: 115, type: dataType_1.default.struct },
            profileName: { ID: 168, type: dataType_1.default.charStr },
        },
        commands: {},
        commandsResponse: {},
    },
    piBinaryValueExt: {
        ID: 1549,
        attributes: {
            ackedTransitions: { ID: 0, type: dataType_1.default.bitmap8 },
            alarmValue: { ID: 6, type: dataType_1.default.boolean },
            notificationClass: { ID: 17, type: dataType_1.default.uint16 },
            eventEnable: { ID: 35, type: dataType_1.default.bitmap8 },
            eventState: { ID: 36, type: dataType_1.default.enum8 },
            notifyType: { ID: 72, type: dataType_1.default.enum8 },
            timeDelay: { ID: 113, type: dataType_1.default.uint8 },
            eventTimeStamps: { ID: 130, type: dataType_1.default.array },
        },
        commands: {},
        commandsResponse: {},
    },
    piMultistateInputReg: {
        ID: 1550,
        attributes: {
            deviceType: { ID: 31, type: dataType_1.default.charStr },
            objectId: { ID: 75, type: dataType_1.default.bacOid },
            objectName: { ID: 77, type: dataType_1.default.charStr },
            objectType: { ID: 79, type: dataType_1.default.enum16 },
            profileName: { ID: 168, type: dataType_1.default.charStr },
        },
        commands: {},
        commandsResponse: {},
    },
    piMultistateInputExt: {
        ID: 1551,
        attributes: {
            ackedTransitions: { ID: 0, type: dataType_1.default.bitmap8 },
            alarmValue: { ID: 6, type: dataType_1.default.uint16 },
            notificationClass: { ID: 17, type: dataType_1.default.uint16 },
            eventEnable: { ID: 35, type: dataType_1.default.bitmap8 },
            eventState: { ID: 36, type: dataType_1.default.enum8 },
            faultValues: { ID: 37, type: dataType_1.default.uint16 },
            notifyType: { ID: 72, type: dataType_1.default.enum8 },
            timeDelay: { ID: 113, type: dataType_1.default.uint8 },
            eventTimeStamps: { ID: 130, type: dataType_1.default.array },
        },
        commands: {},
        commandsResponse: {},
    },
    piMultistateOutputReg: {
        ID: 1552,
        attributes: {
            deviceType: { ID: 31, type: dataType_1.default.charStr },
            feedBackValue: { ID: 40, type: dataType_1.default.enum8 },
            objectId: { ID: 75, type: dataType_1.default.bacOid },
            objectName: { ID: 77, type: dataType_1.default.charStr },
            objectType: { ID: 79, type: dataType_1.default.enum16 },
            profileName: { ID: 168, type: dataType_1.default.charStr },
        },
        commands: {},
        commandsResponse: {},
    },
    piMultistateOutputExt: {
        ID: 1553,
        attributes: {
            ackedTransitions: { ID: 0, type: dataType_1.default.bitmap8 },
            notificationClass: { ID: 17, type: dataType_1.default.uint16 },
            eventEnable: { ID: 35, type: dataType_1.default.bitmap8 },
            eventState: { ID: 36, type: dataType_1.default.enum8 },
            notifyType: { ID: 72, type: dataType_1.default.enum8 },
            timeDelay: { ID: 113, type: dataType_1.default.uint8 },
            eventTimeStamps: { ID: 130, type: dataType_1.default.array },
        },
        commands: {},
        commandsResponse: {},
    },
    piMultistateValueReg: {
        ID: 1554,
        attributes: {
            objectId: { ID: 75, type: dataType_1.default.bacOid },
            objectName: { ID: 77, type: dataType_1.default.charStr },
            objectType: { ID: 79, type: dataType_1.default.enum16 },
            profileName: { ID: 168, type: dataType_1.default.charStr },
        },
        commands: {},
        commandsResponse: {},
    },
    piMultistateValueExt: {
        ID: 1555,
        attributes: {
            ackedTransitions: { ID: 0, type: dataType_1.default.bitmap8 },
            alarmValue: { ID: 6, type: dataType_1.default.uint16 },
            notificationClass: { ID: 17, type: dataType_1.default.uint16 },
            eventEnable: { ID: 35, type: dataType_1.default.bitmap8 },
            eventState: { ID: 36, type: dataType_1.default.enum8 },
            faultValues: { ID: 37, type: dataType_1.default.uint16 },
            notifyType: { ID: 72, type: dataType_1.default.enum8 },
            timeDelay: { ID: 113, type: dataType_1.default.uint8 },
            eventTimeStamps: { ID: 130, type: dataType_1.default.array },
        },
        commands: {},
        commandsResponse: {},
    },
    pi11073ProtocolTunnel: {
        ID: 1556,
        attributes: {
            deviceidList: { ID: 0, type: dataType_1.default.array },
            managerTarget: { ID: 1, type: dataType_1.default.ieeeAddr },
            managerEndpoint: { ID: 2, type: dataType_1.default.uint8 },
            connected: { ID: 3, type: dataType_1.default.boolean },
            preemptible: { ID: 4, type: dataType_1.default.boolean },
            idleTimeout: { ID: 5, type: dataType_1.default.uint16 },
        },
        commands: {
            transferApdu: {
                ID: 0,
                parameters: [],
            },
            connectReq: {
                ID: 1,
                parameters: [],
            },
            disconnectReq: {
                ID: 2,
                parameters: [],
            },
            connectStatusNoti: {
                ID: 3,
                parameters: [],
            },
        },
        commandsResponse: {},
    },
    piIso7818ProtocolTunnel: {
        ID: 1557,
        attributes: {
            status: { ID: 0, type: dataType_1.default.uint8 },
        },
        commands: {},
        commandsResponse: {},
    },
    piRetailTunnel: {
        ID: 1559,
        attributes: {
            manufacturerCode: { ID: 0, type: dataType_1.default.uint16 },
            msProfile: { ID: 1, type: dataType_1.default.uint16 },
        },
        commands: {},
        commandsResponse: {},
    },
    seMetering: {
        ID: 1794,
        attributes: {
            currentSummDelivered: { ID: 0, type: dataType_1.default.uint48 },
            currentSummReceived: { ID: 1, type: dataType_1.default.uint48 },
            currentMaxDemandDelivered: { ID: 2, type: dataType_1.default.uint48 },
            currentMaxDemandReceived: { ID: 3, type: dataType_1.default.uint48 },
            dftSumm: { ID: 4, type: dataType_1.default.uint48 },
            dailyFreezeTime: { ID: 5, type: dataType_1.default.uint16 },
            powerFactor: { ID: 6, type: dataType_1.default.int8 },
            readingSnapshotTime: { ID: 7, type: dataType_1.default.utc },
            currentMaxDemandDeliverdTime: { ID: 8, type: dataType_1.default.utc },
            currentMaxDemandReceivedTime: { ID: 9, type: dataType_1.default.utc },
            defaultUpdatePeriod: { ID: 10, type: dataType_1.default.uint8 },
            fastPollUpdatePeriod: { ID: 11, type: dataType_1.default.uint8 },
            currentBlockPeriodConsumpDelivered: { ID: 12, type: dataType_1.default.uint48 },
            dailyConsumpTarget: { ID: 13, type: dataType_1.default.uint24 },
            currentBlock: { ID: 14, type: dataType_1.default.enum8 },
            profileIntervalPeriod: { ID: 15, type: dataType_1.default.enum8 },
            intervalReadReportingPeriod: { ID: 16, type: dataType_1.default.uint16 },
            presetReadingTime: { ID: 17, type: dataType_1.default.uint16 },
            volumePerReport: { ID: 18, type: dataType_1.default.uint16 },
            flowRestriction: { ID: 19, type: dataType_1.default.uint8 },
            supplyStatus: { ID: 20, type: dataType_1.default.enum8 },
            currentInEnergyCarrierSumm: { ID: 21, type: dataType_1.default.uint48 },
            currentOutEnergyCarrierSumm: { ID: 22, type: dataType_1.default.uint48 },
            inletTempreature: { ID: 23, type: dataType_1.default.int24 },
            outletTempreature: { ID: 24, type: dataType_1.default.int24 },
            controlTempreature: { ID: 25, type: dataType_1.default.int24 },
            currentInEnergyCarrierDemand: { ID: 26, type: dataType_1.default.int24 },
            currentOutEnergyCarrierDemand: { ID: 27, type: dataType_1.default.int24 },
            currentBlockPeriodConsumpReceived: { ID: 29, type: dataType_1.default.uint48 },
            currentBlockReceived: { ID: 30, type: dataType_1.default.uint48 },
            currentTier1SummDelivered: { ID: 256, type: dataType_1.default.uint48 },
            currentTier1SummReceived: { ID: 257, type: dataType_1.default.uint48 },
            currentTier2SummDelivered: { ID: 258, type: dataType_1.default.uint48 },
            currentTier2SummReceived: { ID: 259, type: dataType_1.default.uint48 },
            currentTier3SummDelivered: { ID: 260, type: dataType_1.default.uint48 },
            currentTier3SummReceived: { ID: 261, type: dataType_1.default.uint48 },
            currentTier4SummDelivered: { ID: 262, type: dataType_1.default.uint48 },
            currentTier4SummReceived: { ID: 263, type: dataType_1.default.uint48 },
            currentTier5SummDelivered: { ID: 264, type: dataType_1.default.uint48 },
            currentTier5SummReceived: { ID: 265, type: dataType_1.default.uint48 },
            currentTier6SummDelivered: { ID: 266, type: dataType_1.default.uint48 },
            currentTier6SummReceived: { ID: 267, type: dataType_1.default.uint48 },
            currentTier7SummDelivered: { ID: 268, type: dataType_1.default.uint48 },
            currentTier7SummReceived: { ID: 269, type: dataType_1.default.uint48 },
            currentTier8SummDelivered: { ID: 270, type: dataType_1.default.uint48 },
            currentTier8SummReceived: { ID: 271, type: dataType_1.default.uint48 },
            currentTier9SummDelivered: { ID: 272, type: dataType_1.default.uint48 },
            currentTier9SummReceived: { ID: 273, type: dataType_1.default.uint48 },
            currentTier10SummDelivered: { ID: 274, type: dataType_1.default.uint48 },
            currentTier10SummReceived: { ID: 275, type: dataType_1.default.uint48 },
            currentTier11SummDelivered: { ID: 276, type: dataType_1.default.uint48 },
            currentTier11SummReceived: { ID: 277, type: dataType_1.default.uint48 },
            currentTier12SummDelivered: { ID: 278, type: dataType_1.default.uint48 },
            currentTier12SummReceived: { ID: 279, type: dataType_1.default.uint48 },
            currentTier13SummDelivered: { ID: 280, type: dataType_1.default.uint48 },
            currentTier13SummReceived: { ID: 281, type: dataType_1.default.uint48 },
            currentTier14SummDelivered: { ID: 282, type: dataType_1.default.uint48 },
            currentTier14SummReceived: { ID: 283, type: dataType_1.default.uint48 },
            currentTier15SummDelivered: { ID: 284, type: dataType_1.default.uint48 },
            currentTier15SummReceived: { ID: 285, type: dataType_1.default.uint48 },
            status: { ID: 512, type: dataType_1.default.bitmap8 },
            remainingBattLife: { ID: 513, type: dataType_1.default.uint8 },
            hoursInOperation: { ID: 514, type: dataType_1.default.uint24 },
            hoursInFault: { ID: 515, type: dataType_1.default.uint24 },
            extendedStatus: { ID: 516, type: dataType_1.default.bitmap64 },
            unitOfMeasure: { ID: 768, type: dataType_1.default.enum8 },
            multiplier: { ID: 769, type: dataType_1.default.uint24 },
            divisor: { ID: 770, type: dataType_1.default.uint24 },
            summaFormatting: { ID: 771, type: dataType_1.default.bitmap8 },
            demandFormatting: { ID: 772, type: dataType_1.default.bitmap8 },
            historicalConsumpFormatting: { ID: 773, type: dataType_1.default.bitmap8 },
            meteringDeviceType: { ID: 774, type: dataType_1.default.bitmap8 },
            siteId: { ID: 775, type: dataType_1.default.octetStr },
            meterSerialNumber: { ID: 776, type: dataType_1.default.octetStr },
            energyCarrierUnitOfMeas: { ID: 777, type: dataType_1.default.enum8 },
            energyCarrierSummFormatting: { ID: 778, type: dataType_1.default.bitmap8 },
            energyCarrierDemandFormatting: { ID: 779, type: dataType_1.default.bitmap8 },
            temperatureUnitOfMeas: { ID: 780, type: dataType_1.default.enum8 },
            temperatureFormatting: { ID: 781, type: dataType_1.default.bitmap8 },
            moduleSerialNumber: { ID: 782, type: dataType_1.default.octetStr },
            operatingTariffLevel: { ID: 783, type: dataType_1.default.octetStr },
            instantaneousDemand: { ID: 1024, type: dataType_1.default.int24 },
            currentdayConsumpDelivered: { ID: 1025, type: dataType_1.default.uint24 },
            currentdayConsumpReceived: { ID: 1026, type: dataType_1.default.uint24 },
            previousdayConsumpDelivered: { ID: 1027, type: dataType_1.default.uint24 },
            previousdayConsumpReceived: { ID: 1028, type: dataType_1.default.uint24 },
            curPartProfileIntStartTimeDelivered: { ID: 1029, type: dataType_1.default.utc },
            curPartProfileIntStartTimeReceived: { ID: 1030, type: dataType_1.default.utc },
            curPartProfileIntValueDelivered: { ID: 1031, type: dataType_1.default.uint24 },
            curPartProfileIntValueReceived: { ID: 1032, type: dataType_1.default.uint24 },
            currentDayMaxPressure: { ID: 1033, type: dataType_1.default.uint48 },
            currentDayMinPressure: { ID: 1034, type: dataType_1.default.uint48 },
            previousDayMaxPressure: { ID: 1035, type: dataType_1.default.uint48 },
            previousDayMinPressure: { ID: 1036, type: dataType_1.default.uint48 },
            currentDayMaxDemand: { ID: 1037, type: dataType_1.default.int24 },
            previousDayMaxDemand: { ID: 1038, type: dataType_1.default.int24 },
            currentMonthMaxDemand: { ID: 1039, type: dataType_1.default.int24 },
            currentYearMaxDemand: { ID: 1040, type: dataType_1.default.int24 },
            currentdayMaxEnergyCarrDemand: { ID: 1041, type: dataType_1.default.int24 },
            previousdayMaxEnergyCarrDemand: { ID: 1042, type: dataType_1.default.int24 },
            curMonthMaxEnergyCarrDemand: { ID: 1043, type: dataType_1.default.int24 },
            curMonthMinEnergyCarrDemand: { ID: 1044, type: dataType_1.default.int24 },
            curYearMaxEnergyCarrDemand: { ID: 1045, type: dataType_1.default.int24 },
            curYearMinEnergyCarrDemand: { ID: 1046, type: dataType_1.default.int24 },
            maxNumberOfPeriodsDelivered: { ID: 1280, type: dataType_1.default.uint8 },
            currentDemandDelivered: { ID: 1536, type: dataType_1.default.uint24 },
            demandLimit: { ID: 1537, type: dataType_1.default.uint24 },
            demandIntegrationPeriod: { ID: 1538, type: dataType_1.default.uint8 },
            numberOfDemandSubintervals: { ID: 1539, type: dataType_1.default.uint8 },
            demandLimitArmDuration: { ID: 1540, type: dataType_1.default.uint16 },
            genericAlarmMask: { ID: 2048, type: dataType_1.default.bitmap16 },
            electricityAlarmMask: { ID: 2049, type: dataType_1.default.bitmap32 },
            genFlowPressureAlarmMask: { ID: 2050, type: dataType_1.default.bitmap16 },
            waterSpecificAlarmMask: { ID: 2051, type: dataType_1.default.bitmap16 },
            heatCoolSpecificAlarmMASK: { ID: 2052, type: dataType_1.default.bitmap16 },
            gasSpecificAlarmMask: { ID: 2053, type: dataType_1.default.bitmap16 },
            extendedGenericAlarmMask: { ID: 2054, type: dataType_1.default.bitmap48 },
            manufactureAlarmMask: { ID: 2055, type: dataType_1.default.bitmap16 },
            billToDate: { ID: 2560, type: dataType_1.default.uint32 },
            billToDateTimeStamp: { ID: 2561, type: dataType_1.default.utc },
            projectedBill: { ID: 2562, type: dataType_1.default.uint32 },
            projectedBillTimeStamp: { ID: 2563, type: dataType_1.default.utc },
            notificationControlFlags: { ID: 0, type: dataType_1.default.bitmap32 },
            notificationFlags: { ID: 1, type: dataType_1.default.bitmap32 },
            priceNotificationFlags: { ID: 2, type: dataType_1.default.bitmap32 },
            calendarNotificationFlags: { ID: 3, type: dataType_1.default.bitmap32 },
            prePayNotificationFlags: { ID: 4, type: dataType_1.default.bitmap32 },
            deviceManagementFlags: { ID: 5, type: dataType_1.default.bitmap32 },
            changeReportingProfile: { ID: 256, type: dataType_1.default.unknown },
        },
        commands: {
            getProfile: {
                ID: 0,
                parameters: [],
            },
            reqMirror: {
                ID: 1,
                parameters: [],
            },
            mirrorRem: {
                ID: 2,
                parameters: [],
            },
            reqFastPollMode: {
                ID: 3,
                parameters: [],
            },
            getSnapshot: {
                ID: 4,
                parameters: [],
            },
            takeSnapshot: {
                ID: 5,
                parameters: [],
            },
            mirrorReportAttrRsp: {
                ID: 6,
                parameters: [],
            },
        },
        commandsResponse: {
            getProfileRsp: {
                ID: 0,
                parameters: [],
            },
            reqMirrorRsp: {
                ID: 1,
                parameters: [],
            },
            mirrorRemRsp: {
                ID: 2,
                parameters: [],
            },
            reqFastPollModeRsp: {
                ID: 3,
                parameters: [],
            },
            getSnapshotRsp: {
                ID: 4,
                parameters: [],
            },
        },
    },
    telecommunicationsInformation: {
        ID: 2304,
        attributes: {
            nodeDescription: { ID: 0, type: dataType_1.default.charStr },
            deliveryEnable: { ID: 1, type: dataType_1.default.boolean },
            pushInformationTimer: { ID: 2, type: dataType_1.default.uint32 },
            enableSecureConfiguration: { ID: 3, type: dataType_1.default.boolean },
            numberOfContents: { ID: 16, type: dataType_1.default.uint16 },
            contentRootID: { ID: 17, type: dataType_1.default.uint16 },
        },
        commands: {},
        commandsResponse: {},
    },
    telecommunicationsVoiceOverZigbee: {
        ID: 2308,
        attributes: {
            codecType: { ID: 0, type: dataType_1.default.enum8 },
            samplingFrequency: { ID: 1, type: dataType_1.default.enum8 },
            codecrate: { ID: 2, type: dataType_1.default.enum8 },
            establishmentTimeout: { ID: 3, type: dataType_1.default.uint8 },
            codecTypeSub1: { ID: 4, type: dataType_1.default.enum8 },
            codecTypeSub2: { ID: 5, type: dataType_1.default.enum8 },
            codecTypeSub3: { ID: 6, type: dataType_1.default.enum8 },
            compressionType: { ID: 7, type: dataType_1.default.enum8 },
            compressionRate: { ID: 8, type: dataType_1.default.enum8 },
            optionFlags: { ID: 9, type: dataType_1.default.bitmap8 },
            threshold: { ID: 10, type: dataType_1.default.uint8 },
        },
        commands: {},
        commandsResponse: {},
    },
    telecommunicationsChatting: {
        ID: 2309,
        attributes: {
            uID: { ID: 0, type: dataType_1.default.uint16 },
            nickname: { ID: 1, type: dataType_1.default.charStr },
            cID: { ID: 16, type: dataType_1.default.uint16 },
            name: { ID: 17, type: dataType_1.default.charStr },
            enableAddChat: { ID: 18, type: dataType_1.default.boolean },
        },
        commands: {},
        commandsResponse: {},
    },
    haApplianceIdentification: {
        ID: 2816,
        attributes: {
            basicIdentification: { ID: 0, type: dataType_1.default.uint56 },
            companyName: { ID: 16, type: dataType_1.default.charStr },
            companyId: { ID: 17, type: dataType_1.default.uint16 },
            brandName: { ID: 18, type: dataType_1.default.charStr },
            brandId: { ID: 19, type: dataType_1.default.uint16 },
            model: { ID: 20, type: dataType_1.default.octetStr },
            partNumber: { ID: 21, type: dataType_1.default.octetStr },
            productRevision: { ID: 22, type: dataType_1.default.octetStr },
            softwareRevision: { ID: 23, type: dataType_1.default.octetStr },
            productTypeName: { ID: 24, type: dataType_1.default.octetStr },
            productTypeId: { ID: 25, type: dataType_1.default.uint16 },
            cecedSpecificationVersion: { ID: 26, type: dataType_1.default.uint8 },
        },
        commands: {},
        commandsResponse: {},
    },
    haMeterIdentification: {
        ID: 2817,
        attributes: {
            companyName: { ID: 0, type: dataType_1.default.charStr },
            meterTypeId: { ID: 1, type: dataType_1.default.uint16 },
            dataQualityId: { ID: 4, type: dataType_1.default.uint16 },
            customerName: { ID: 5, type: dataType_1.default.charStr },
            model: { ID: 6, type: dataType_1.default.charStr },
            partNumber: { ID: 7, type: dataType_1.default.charStr },
            productRevision: { ID: 8, type: dataType_1.default.charStr },
            softwareRevision: { ID: 10, type: dataType_1.default.charStr },
            utilityName: { ID: 11, type: dataType_1.default.charStr },
            pod: { ID: 12, type: dataType_1.default.charStr },
            availablePower: { ID: 13, type: dataType_1.default.int24 },
            powerThreshold: { ID: 14, type: dataType_1.default.int24 },
        },
        commands: {},
        commandsResponse: {},
    },
    haApplianceEventsAlerts: {
        ID: 2818,
        attributes: {},
        commands: {
            getAlerts: {
                ID: 0,
                parameters: [],
            },
        },
        commandsResponse: {
            getAlertsRsp: {
                ID: 0,
                parameters: [
                    { name: 'alertscount', type: dataType_1.default.uint8 },
                    { name: 'aalert', type: buffaloZclDataType_1.default.LIST_UINT24 },
                ],
            },
            alertsNotification: {
                ID: 1,
                parameters: [
                    { name: 'alertscount', type: dataType_1.default.uint8 },
                    { name: 'aalert', type: buffaloZclDataType_1.default.LIST_UINT24 },
                ],
            },
            eventNotification: {
                ID: 2,
                parameters: [
                    { name: 'eventheader', type: dataType_1.default.uint8 },
                    { name: 'eventid', type: dataType_1.default.uint8 },
                ],
            },
        },
    },
    haApplianceStatistics: {
        ID: 2819,
        attributes: {
            logMaxSize: { ID: 0, type: dataType_1.default.uint32 },
            logQueueMaxSize: { ID: 1, type: dataType_1.default.uint8 },
        },
        commands: {
            log: {
                ID: 0,
                parameters: [
                    { name: 'logid', type: dataType_1.default.uint32 },
                ],
            },
            logQueue: {
                ID: 1,
                parameters: [],
            },
        },
        commandsResponse: {
            logNotification: {
                ID: 0,
                parameters: [
                    { name: 'timestamp', type: dataType_1.default.uint32 },
                    { name: 'logid', type: dataType_1.default.uint32 },
                    { name: 'loglength', type: dataType_1.default.uint32 },
                    { name: 'logpayload', type: buffaloZclDataType_1.default.LIST_UINT8 },
                ],
            },
            logRsp: {
                ID: 1,
                parameters: [
                    { name: 'timestamp', type: dataType_1.default.uint32 },
                    { name: 'logid', type: dataType_1.default.uint32 },
                    { name: 'loglength', type: dataType_1.default.uint32 },
                    { name: 'logpayload', type: buffaloZclDataType_1.default.LIST_UINT8 },
                ],
            },
            logQueueRsp: {
                ID: 2,
                parameters: [
                    { name: 'logqueuesize', type: dataType_1.default.uint8 },
                    { name: 'logid', type: buffaloZclDataType_1.default.LIST_UINT32 },
                ],
            },
            statisticsAvailable: {
                ID: 3,
                parameters: [
                    { name: 'logqueuesize', type: dataType_1.default.uint8 },
                    { name: 'logid', type: buffaloZclDataType_1.default.LIST_UINT32 },
                ],
            },
        },
    },
    haElectricalMeasurement: {
        ID: 2820,
        attributes: {
            measurementType: { ID: 0, type: dataType_1.default.bitmap32 },
            dcVoltage: { ID: 256, type: dataType_1.default.int16 },
            dcVoltageMin: { ID: 257, type: dataType_1.default.int16 },
            dcvoltagemax: { ID: 258, type: dataType_1.default.int16 },
            dcCurrent: { ID: 259, type: dataType_1.default.int16 },
            dcCurrentMin: { ID: 260, type: dataType_1.default.int16 },
            dcCurrentMax: { ID: 261, type: dataType_1.default.int16 },
            dcPower: { ID: 262, type: dataType_1.default.int16 },
            dcPowerMin: { ID: 263, type: dataType_1.default.int16 },
            dcPowerMax: { ID: 264, type: dataType_1.default.int16 },
            dcVoltageMultiplier: { ID: 512, type: dataType_1.default.uint16 },
            dcVoltageDivisor: { ID: 513, type: dataType_1.default.uint16 },
            dcCurrentMultiplier: { ID: 514, type: dataType_1.default.uint16 },
            dcCurrentDivisor: { ID: 515, type: dataType_1.default.uint16 },
            dcPowerMultiplier: { ID: 516, type: dataType_1.default.uint16 },
            dcPowerDivisor: { ID: 517, type: dataType_1.default.uint16 },
            acFrequency: { ID: 768, type: dataType_1.default.uint16 },
            acFrequencyMin: { ID: 769, type: dataType_1.default.uint16 },
            acFrequencyMax: { ID: 770, type: dataType_1.default.uint16 },
            neutralCurrent: { ID: 771, type: dataType_1.default.uint16 },
            totalActivePower: { ID: 772, type: dataType_1.default.int32 },
            totalReactivePower: { ID: 773, type: dataType_1.default.int32 },
            totalApparentPower: { ID: 774, type: dataType_1.default.uint32 },
            meas1stHarmonicCurrent: { ID: 775, type: dataType_1.default.int16 },
            meas3rdHarmonicCurrent: { ID: 776, type: dataType_1.default.int16 },
            meas5thHarmonicCurrent: { ID: 777, type: dataType_1.default.int16 },
            meas7thHarmonicCurrent: { ID: 778, type: dataType_1.default.int16 },
            meas9thHarmonicCurrent: { ID: 779, type: dataType_1.default.int16 },
            meas11thHarmonicCurrent: { ID: 780, type: dataType_1.default.int16 },
            measPhase1stHarmonicCurrent: { ID: 781, type: dataType_1.default.int16 },
            measPhase3rdHarmonicCurrent: { ID: 782, type: dataType_1.default.int16 },
            measPhase5thHarmonicCurrent: { ID: 783, type: dataType_1.default.int16 },
            measPhase7thHarmonicCurrent: { ID: 784, type: dataType_1.default.int16 },
            measPhase9thHarmonicCurrent: { ID: 785, type: dataType_1.default.int16 },
            measPhase11thHarmonicCurrent: { ID: 786, type: dataType_1.default.int16 },
            acFrequencyMultiplier: { ID: 1024, type: dataType_1.default.uint16 },
            acFrequencyDivisor: { ID: 1025, type: dataType_1.default.uint16 },
            powerMultiplier: { ID: 1026, type: dataType_1.default.uint32 },
            powerDivisor: { ID: 1027, type: dataType_1.default.uint32 },
            harmonicCurrentMultiplier: { ID: 1028, type: dataType_1.default.int8 },
            phaseHarmonicCurrentMultiplier: { ID: 1029, type: dataType_1.default.int8 },
            instantaneousVoltage: { ID: 1280, type: dataType_1.default.int16 },
            instantaneousLineCurrent: { ID: 1281, type: dataType_1.default.uint16 },
            instantaneousActiveCurrent: { ID: 1282, type: dataType_1.default.int16 },
            instantaneousReactiveCurrent: { ID: 1283, type: dataType_1.default.int16 },
            instantaneousPower: { ID: 1284, type: dataType_1.default.int16 },
            rmsVoltage: { ID: 1285, type: dataType_1.default.uint16 },
            rmsVoltageMin: { ID: 1286, type: dataType_1.default.uint16 },
            rmsVoltageMax: { ID: 1287, type: dataType_1.default.uint16 },
            rmsCurrent: { ID: 1288, type: dataType_1.default.uint16 },
            rmsCurrentMin: { ID: 1289, type: dataType_1.default.uint16 },
            rmsCurrentMax: { ID: 1290, type: dataType_1.default.uint16 },
            activePower: { ID: 1291, type: dataType_1.default.int16 },
            activePowerMin: { ID: 1292, type: dataType_1.default.int16 },
            activePowerMax: { ID: 1293, type: dataType_1.default.int16 },
            reactivePower: { ID: 1294, type: dataType_1.default.int16 },
            apparentPower: { ID: 1295, type: dataType_1.default.uint16 },
            powerFactor: { ID: 1296, type: dataType_1.default.int8 },
            averageRmsVoltageMeasPeriod: { ID: 1297, type: dataType_1.default.uint16 },
            averageRmsOverVoltageCounter: { ID: 1298, type: dataType_1.default.uint16 },
            averageRmsUnderVoltageCounter: { ID: 1299, type: dataType_1.default.uint16 },
            rmsExtremeOverVoltagePeriod: { ID: 1300, type: dataType_1.default.uint16 },
            rmsExtremeUnderVoltagePeriod: { ID: 1301, type: dataType_1.default.uint16 },
            rmsVoltageSagPeriod: { ID: 1302, type: dataType_1.default.uint16 },
            rmsVoltageSwellPeriod: { ID: 1303, type: dataType_1.default.uint16 },
            acVoltageMultiplier: { ID: 1536, type: dataType_1.default.uint16 },
            acVoltageDivisor: { ID: 1537, type: dataType_1.default.uint16 },
            acCurrentMultiplier: { ID: 1538, type: dataType_1.default.uint16 },
            acCurrentDivisor: { ID: 1539, type: dataType_1.default.uint16 },
            acPowerMultiplier: { ID: 1540, type: dataType_1.default.uint16 },
            acPowerDivisor: { ID: 1541, type: dataType_1.default.uint16 },
            dcOverloadAlarmsMask: { ID: 1792, type: dataType_1.default.bitmap8 },
            dcVoltageOverload: { ID: 1793, type: dataType_1.default.int16 },
            dcCurrentOverload: { ID: 1794, type: dataType_1.default.int16 },
            acAlarmsMask: { ID: 2048, type: dataType_1.default.bitmap16 },
            acVoltageOverload: { ID: 2049, type: dataType_1.default.int16 },
            acCurrentOverload: { ID: 2050, type: dataType_1.default.int16 },
            acActivePowerOverload: { ID: 2051, type: dataType_1.default.int16 },
            acReactivePowerOverload: { ID: 2052, type: dataType_1.default.int16 },
            averageRmsOverVoltage: { ID: 2053, type: dataType_1.default.int16 },
            averageRmsUnderVoltage: { ID: 2054, type: dataType_1.default.int16 },
            rmsExtremeOverVoltage: { ID: 2055, type: dataType_1.default.int16 },
            rmsExtremeUnderVoltage: { ID: 2056, type: dataType_1.default.int16 },
            rmsVoltageSag: { ID: 2057, type: dataType_1.default.int16 },
            rmsVoltageSwell: { ID: 2058, type: dataType_1.default.int16 },
            lineCurrentPhB: { ID: 2305, type: dataType_1.default.uint16 },
            activeCurrentPhB: { ID: 2306, type: dataType_1.default.int16 },
            reactiveCurrentPhB: { ID: 2307, type: dataType_1.default.int16 },
            rmsVoltagePhB: { ID: 2309, type: dataType_1.default.uint16 },
            rmsVoltageMinPhB: { ID: 2310, type: dataType_1.default.uint16 },
            rmsVoltageMaxPhB: { ID: 2311, type: dataType_1.default.uint16 },
            rmsCurrentPhB: { ID: 2312, type: dataType_1.default.uint16 },
            rmsCurrentMinPhB: { ID: 2313, type: dataType_1.default.uint16 },
            rmsCurrentMaxPhB: { ID: 2314, type: dataType_1.default.uint16 },
            activePowerPhB: { ID: 2315, type: dataType_1.default.int16 },
            activePowerMinPhB: { ID: 2316, type: dataType_1.default.int16 },
            activePowerMaxPhB: { ID: 2317, type: dataType_1.default.int16 },
            reactivePowerPhB: { ID: 2318, type: dataType_1.default.int16 },
            apparentPowerPhB: { ID: 2319, type: dataType_1.default.uint16 },
            powerFactorPhB: { ID: 2320, type: dataType_1.default.int8 },
            averageRmsVoltageMeasurePeriodPhB: { ID: 2321, type: dataType_1.default.uint16 },
            averageRmsOverVoltageCounterPhB: { ID: 2322, type: dataType_1.default.uint16 },
            averageUnderVoltageCounterPhB: { ID: 2323, type: dataType_1.default.uint16 },
            rmsExtremeOverVoltagePeriodPhB: { ID: 2324, type: dataType_1.default.uint16 },
            rmsExtremeUnderVoltagePeriodPhB: { ID: 2325, type: dataType_1.default.uint16 },
            rmsVoltageSagPeriodPhB: { ID: 2326, type: dataType_1.default.uint16 },
            rmsVoltageSwellPeriodPhB: { ID: 2327, type: dataType_1.default.uint16 },
            lineCurrentPhC: { ID: 2561, type: dataType_1.default.uint16 },
            activeCurrentPhC: { ID: 2562, type: dataType_1.default.int16 },
            reactiveCurrentPhC: { ID: 2563, type: dataType_1.default.int16 },
            rmsVoltagePhC: { ID: 2565, type: dataType_1.default.uint16 },
            rmsVoltageMinPhC: { ID: 2566, type: dataType_1.default.uint16 },
            rmsVoltageMaxPhC: { ID: 2567, type: dataType_1.default.uint16 },
            rmsCurrentPhC: { ID: 2568, type: dataType_1.default.uint16 },
            rmsCurrentMinPhC: { ID: 2569, type: dataType_1.default.uint16 },
            rmsCurrentMaxPhC: { ID: 2570, type: dataType_1.default.uint16 },
            activePowerPhC: { ID: 2571, type: dataType_1.default.int16 },
            activePowerMinPhC: { ID: 2572, type: dataType_1.default.int16 },
            activePowerMaxPhC: { ID: 2573, type: dataType_1.default.int16 },
            reactivePowerPhC: { ID: 2574, type: dataType_1.default.int16 },
            apparentPowerPhC: { ID: 2575, type: dataType_1.default.uint16 },
            powerFactorPhC: { ID: 2576, type: dataType_1.default.int8 },
            averageRmsVoltageMeasPeriodPhC: { ID: 2577, type: dataType_1.default.uint16 },
            averageRmsOverVoltageCounterPhC: { ID: 2578, type: dataType_1.default.uint16 },
            averageUnderVoltageCounterPhC: { ID: 2579, type: dataType_1.default.uint16 },
            rmsExtremeOverVoltagePeriodPhC: { ID: 2580, type: dataType_1.default.uint16 },
            rmsExtremeUnderVoltagePeriodPhC: { ID: 2581, type: dataType_1.default.uint16 },
            rmsVoltageSagPeriodPhC: { ID: 2582, type: dataType_1.default.uint16 },
            rmsVoltageSwellPeriodPhC: { ID: 2583, type: dataType_1.default.uint16 },
        },
        commands: {
            getProfileInfo: {
                ID: 0,
                parameters: [],
            },
            getMeasurementProfile: {
                ID: 1,
                parameters: [
                    { name: 'attrId', type: dataType_1.default.uint16 },
                    { name: 'starttime', type: dataType_1.default.uint32 },
                    { name: 'numofuntervals', type: dataType_1.default.uint8 },
                ],
            },
        },
        commandsResponse: {
            getProfileInfoRsp: {
                ID: 0,
                parameters: [
                    { name: 'profilecount', type: dataType_1.default.uint8 },
                    { name: 'profileintervalperiod', type: dataType_1.default.uint8 },
                    { name: 'maxnumofintervals', type: dataType_1.default.uint8 },
                    { name: 'numofattrs', type: dataType_1.default.uint8 },
                    { name: 'listofattr', type: buffaloZclDataType_1.default.LIST_UINT16 },
                ],
            },
            getMeasurementProfileRsp: {
                ID: 1,
                parameters: [
                    { name: 'starttime', type: dataType_1.default.uint32 },
                    { name: 'status', type: dataType_1.default.uint8 },
                    { name: 'profileintervalperiod', type: dataType_1.default.uint8 },
                    { name: 'numofintervalsdeliv', type: dataType_1.default.uint8 },
                    { name: 'attrId', type: dataType_1.default.uint16 },
                    { name: 'intervals', type: buffaloZclDataType_1.default.LIST_UINT8 },
                ],
            },
        },
    },
    haDiagnostic: {
        ID: 2821,
        attributes: {
            numberOfResets: { ID: 0, type: dataType_1.default.uint16 },
            persistentMemoryWrites: { ID: 1, type: dataType_1.default.uint16 },
            macRxBcast: { ID: 256, type: dataType_1.default.uint32 },
            macTxBcast: { ID: 257, type: dataType_1.default.uint32 },
            macRxUcast: { ID: 258, type: dataType_1.default.uint32 },
            macTxUcast: { ID: 259, type: dataType_1.default.uint32 },
            macTxUcastRetry: { ID: 260, type: dataType_1.default.uint16 },
            macTxUcastFail: { ID: 261, type: dataType_1.default.uint16 },
            aPSRxBcast: { ID: 262, type: dataType_1.default.uint16 },
            aPSTxBcast: { ID: 263, type: dataType_1.default.uint16 },
            aPSRxUcast: { ID: 264, type: dataType_1.default.uint16 },
            aPSTxUcastSuccess: { ID: 265, type: dataType_1.default.uint16 },
            aPSTxUcastRetry: { ID: 266, type: dataType_1.default.uint16 },
            aPSTxUcastFail: { ID: 267, type: dataType_1.default.uint16 },
            routeDiscInitiated: { ID: 268, type: dataType_1.default.uint16 },
            neighborAdded: { ID: 269, type: dataType_1.default.uint16 },
            neighborRemoved: { ID: 270, type: dataType_1.default.uint16 },
            neighborStale: { ID: 271, type: dataType_1.default.uint16 },
            joinIndication: { ID: 272, type: dataType_1.default.uint16 },
            childMoved: { ID: 273, type: dataType_1.default.uint16 },
            nwkFcFailure: { ID: 274, type: dataType_1.default.uint16 },
            apsFcFailure: { ID: 275, type: dataType_1.default.uint16 },
            apsUnauthorizedKey: { ID: 276, type: dataType_1.default.uint16 },
            nwkDecryptFailures: { ID: 277, type: dataType_1.default.uint16 },
            apsDecryptFailures: { ID: 278, type: dataType_1.default.uint16 },
            packetBufferAllocateFailures: { ID: 279, type: dataType_1.default.uint16 },
            relayedUcast: { ID: 280, type: dataType_1.default.uint16 },
            phyToMacQueueLimitReached: { ID: 281, type: dataType_1.default.uint16 },
            packetValidateDropCount: { ID: 282, type: dataType_1.default.uint16 },
            averageMacRetryPerApsMessageSent: { ID: 283, type: dataType_1.default.uint16 },
            lastMessageLqi: { ID: 284, type: dataType_1.default.uint8 },
            lastMessageRssi: { ID: 285, type: dataType_1.default.int8 },
        },
        commands: {},
        commandsResponse: {},
    },
    touchlink: {
        ID: 4096,
        attributes: {},
        commands: {
            scanRequest: {
                ID: 0,
                response: 1,
                parameters: [
                    { name: 'transactionID', type: dataType_1.default.uint32 },
                    { name: 'zigbeeInformation', type: dataType_1.default.bitmap8 },
                    { name: 'touchlinkInformation', type: dataType_1.default.bitmap8 },
                ],
            },
            identifyRequest: {
                ID: 6,
                parameters: [
                    { name: 'transactionID', type: dataType_1.default.uint32 },
                    { name: 'duration', type: dataType_1.default.uint16 },
                ],
            },
            resetToFactoryNew: {
                ID: 7,
                parameters: [
                    { name: 'transactionID', type: dataType_1.default.uint32 },
                ],
            },
        },
        commandsResponse: {
            scanResponse: {
                ID: 1,
                parameters: [
                    { name: 'transactionID', type: dataType_1.default.uint32 },
                    { name: 'rssiCorrection', type: dataType_1.default.uint8 },
                    { name: 'zigbeeInformation', type: dataType_1.default.uint8 },
                    { name: 'touchlinkInformation', type: dataType_1.default.uint8 },
                    { name: 'keyBitmask', type: dataType_1.default.uint16 },
                    { name: 'responseID', type: dataType_1.default.uint32 },
                    { name: 'extendedPanID', type: dataType_1.default.ieeeAddr },
                    { name: 'networkUpdateID', type: dataType_1.default.uint8 },
                    { name: 'logicalChannel', type: dataType_1.default.uint8 },
                    { name: 'panID', type: dataType_1.default.uint16 },
                    { name: 'networkAddress', type: dataType_1.default.uint16 },
                    { name: 'numberOfSubDevices', type: dataType_1.default.uint8 },
                    { name: 'totalGroupIdentifiers', type: dataType_1.default.uint8 },
                    { name: 'endpointID', type: dataType_1.default.uint8 },
                    { name: 'profileID', type: dataType_1.default.uint16 },
                    { name: 'deviceID', type: dataType_1.default.uint16 },
                    { name: 'version', type: dataType_1.default.uint8 },
                    { name: 'groupIdentifierCount', type: dataType_1.default.uint8 },
                ],
            },
        },
    },
    manuSpecificClusterAduroSmart: {
        ID: 64716,
        attributes: {},
        commands: {
            cmd0: {
                ID: 0,
                parameters: [],
            },
        },
        commandsResponse: {},
    },
    manuSpecificOsram: {
        ID: 64527,
        attributes: {},
        commands: {
            saveStartupParams: {
                ID: 1,
                parameters: [],
            },
            resetStartupParams: {
                ID: 2,
                parameters: [],
            },
        },
        commandsResponse: {
            saveStartupParamsRsp: {
                ID: 0,
                parameters: [],
            },
        },
    },
    manuSpecificPhilips: {
        ID: 64512,
        attributes: {
            config: { ID: 49, type: dataType_1.default.bitmap16 },
        },
        commands: {},
        commandsResponse: {
            hueNotification: {
                ID: 0,
                parameters: [
                    { name: 'button', type: dataType_1.default.uint8 },
                    { name: 'unknown1', type: dataType_1.default.uint24 },
                    { name: 'type', type: dataType_1.default.uint8 },
                    { name: 'unknown2', type: dataType_1.default.uint8 },
                    { name: 'time', type: dataType_1.default.uint8 },
                    { name: 'unknown2', type: dataType_1.default.uint8 },
                ],
            },
        },
    },
    manuSpecificSinope: {
        ID: 65281,
        manufacturerCode: manufacturerCode_1.default.Sinope,
        attributes: {
            outdoorTempToDisplay: { ID: 16, type: dataType_1.default.int16 },
            outdoorTempToDisplayTimeout: { ID: 17, type: dataType_1.default.uint16 },
            currentTimeToDisplay: { ID: 32, type: dataType_1.default.uint32 },
        },
        commands: {},
        commandsResponse: {},
    },
    manuSpecificUbisysDeviceSetup: {
        ID: 0xfc00,
        manufacturerCode: manufacturerCode_1.default.Ubisys,
        attributes: {
            inputConfigurations: { ID: 0x0000, type: dataType_1.default.array },
            inputActions: { ID: 0x0001, type: dataType_1.default.array },
        },
        commands: {},
        commandsResponse: {}
    },
    manuSpecificLegrandDevices: {
        ID: 0xfc01,
        manufacturerCode: manufacturerCode_1.default.LegrandNetatmo,
        attributes: {
        // attributes seems to vary depending on the device. Can't be static
        },
        commands: {},
        commandsResponse: {}
    },
    wiserDeviceInfo: {
        ID: 0xFE03,
        attributes: {
            deviceInfo: { ID: 32, type: dataType_1.default.charStr },
        },
        commands: {},
        commandsResponse: {}
    },
    manuSpecificTuyaDimmer: {
        ID: 0xEF00,
        attributes: {},
        commands: {
            setData: {
                ID: 0,
                parameters: [
                    { name: 'status', type: dataType_1.default.uint8 },
                    { name: 'transid', type: dataType_1.default.uint8 },
                    { name: 'dp', type: dataType_1.default.uint16 },
                    { name: 'fn', type: dataType_1.default.uint8 },
                    { name: 'data', type: buffaloZclDataType_1.default.LIST_UINT8 },
                ],
            },
        },
        commandsResponse: {
            getData: {
                ID: 1,
                parameters: [
                    { name: 'status', type: dataType_1.default.uint8 },
                    { name: 'transid', type: dataType_1.default.uint8 },
                    { name: 'dp', type: dataType_1.default.uint16 },
                    { name: 'fn', type: dataType_1.default.uint8 },
                    { name: 'data', type: dataType_1.default.octetStr },
                ],
            },
            // The ZED will respond with the command 0x02 when a change was requested
            // from the MCU. The payload of that response is exacly the same as used
            // for the command 0x01.
            setDataResponse: {
                ID: 2,
                parameters: [
                    { name: 'status', type: dataType_1.default.uint8 },
                    { name: 'transid', type: dataType_1.default.uint8 },
                    { name: 'dp', type: dataType_1.default.uint16 },
                    { name: 'fn', type: dataType_1.default.uint8 },
                    { name: 'data', type: dataType_1.default.octetStr },
                ],
            },
        },
    },
    aqaraOpple: {
        ID: 0xFCC0,
        attributes: {
            mode: { ID: 9, type: dataType_1.default.uint8 },
        },
        commands: {},
        commandsResponse: {}
    },
    manuSpecificCentraliteHumidity: {
        ID: 0xFC45,
        manufacturerCode: manufacturerCode_1.default.Centralite,
        attributes: {
            measuredValue: { ID: 0, type: dataType_1.default.uint16 },
        },
        commands: {},
        commandsResponse: {},
    },
};
exports.default = Cluster;
//# sourceMappingURL=cluster.js.map
