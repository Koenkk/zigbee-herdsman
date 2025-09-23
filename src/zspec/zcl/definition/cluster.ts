import {BuffaloZclDataType, DataType, ParameterCondition} from "./enums";
import {ManufacturerCode} from "./manufacturerCode";
import {Status} from "./status";
import type {ClusterDefinition, ClusterName} from "./tstype";

export const Clusters: Readonly<Record<ClusterName, Readonly<ClusterDefinition>>> = {
    genBasic: {
        ID: 0x0000,
        attributes: {
            zclVersion: {ID: 0x0000, type: DataType.UINT8, required: true, max: 0xff, default: 8},
            appVersion: {ID: 0x0001, type: DataType.UINT8, max: 0xff, default: 0},
            stackVersion: {ID: 0x0002, type: DataType.UINT8, max: 0xff, default: 0},
            hwVersion: {ID: 0x0003, type: DataType.UINT8, max: 0xff, default: 0},
            manufacturerName: {ID: 0x0004, type: DataType.CHAR_STR, default: "", maxLen: 32},
            modelId: {ID: 0x0005, type: DataType.CHAR_STR, default: "", maxLen: 32},
            dateCode: {ID: 0x0006, type: DataType.CHAR_STR, default: "", maxLen: 16},
            powerSource: {ID: 0x0007, type: DataType.ENUM8, required: true, default: 0xff},
            genericDeviceClass: {ID: 0x0008, type: DataType.ENUM8, default: 0xff},
            genericDeviceType: {ID: 0x0009, type: DataType.ENUM8, default: 0xff},
            productCode: {ID: 0x000a, type: DataType.OCTET_STR, default: ""},
            productUrl: {ID: 0x000b, type: DataType.CHAR_STR, default: ""},
            manufacturerVersionDetails: {ID: 0x000c, type: DataType.CHAR_STR, default: ""},
            serialNumber: {ID: 0x000d, type: DataType.CHAR_STR, default: ""},
            productLabel: {ID: 0x000e, type: DataType.CHAR_STR, default: ""},
            locationDesc: {ID: 0x0010, type: DataType.CHAR_STR, writable: true, default: "", maxLen: 16},
            physicalEnv: {ID: 0x0011, type: DataType.ENUM8, writable: true, default: 0},
            deviceEnabled: {ID: 0x0012, type: DataType.BOOLEAN, writable: true, default: 1},
            alarmMask: {ID: 0x0013, type: DataType.BITMAP8, writable: true, default: 0},
            disableLocalConfig: {ID: 0x0014, type: DataType.BITMAP8, writable: true, default: 0},
            swBuildId: {ID: 0x4000, type: DataType.CHAR_STR, default: "", maxLen: 16},
            // custom
            schneiderMeterRadioPower: {ID: 0xe200, type: DataType.INT8, manufacturerCode: ManufacturerCode.SCHNEIDER_ELECTRIC},
        },
        commands: {
            resetFactDefault: {ID: 0x00, parameters: []},
            // custom
            tuyaSetup: {ID: 0xf0, parameters: []},
        },
        commandsResponse: {},
    },
    genPowerCfg: {
        ID: 0x0001,
        attributes: {
            mainsVoltage: {ID: 0x0000, type: DataType.UINT16, max: 0xffff},
            mainsFrequency: {ID: 0x0001, type: DataType.UINT8, max: 0xff},
            mainsAlarmMask: {ID: 0x0010, type: DataType.BITMAP8, writable: true, default: 0},
            mainsVoltMinThres: {ID: 0x0011, type: DataType.UINT16, writable: true, max: 0xffff, default: 0},
            mainsVoltMaxThres: {ID: 0x0012, type: DataType.UINT16, writable: true, max: 0xffff, default: 0xffff},
            mainsVoltageDwellTripPoint: {ID: 0x0013, type: DataType.UINT16, writable: true, max: 0xffff, default: 0},
            batteryVoltage: {ID: 0x0020, type: DataType.UINT8, max: 0xff},
            batteryPercentageRemaining: {ID: 0x0021, type: DataType.UINT8, reportRequired: true, max: 0xff, default: 0},
            batteryManufacturer: {ID: 0x0030, type: DataType.CHAR_STR, writable: true, default: "", maxLen: 16},
            batterySize: {ID: 0x0031, type: DataType.ENUM8, writable: true, default: 0xff},
            batteryAHrRating: {ID: 0x0032, type: DataType.UINT16, writable: true, max: 0xffff},
            batteryQuantity: {ID: 0x0033, type: DataType.UINT8, writable: true, max: 0xff},
            batteryRatedVoltage: {ID: 0x0034, type: DataType.UINT8, writable: true, max: 0xff},
            batteryAlarmMask: {ID: 0x0035, type: DataType.BITMAP8, writable: true, default: 0},
            batteryVoltMinThres: {ID: 0x0036, type: DataType.UINT8, writable: true, max: 0xff, default: 0},
            batteryVoltThres1: {ID: 0x0037, type: DataType.UINT8, writable: true, writeOptional: true, max: 0xff, default: 0},
            batteryVoltThres2: {ID: 0x0038, type: DataType.UINT8, writable: true, writeOptional: true, max: 0xff, default: 0},
            batteryVoltThres3: {ID: 0x0039, type: DataType.UINT8, writable: true, writeOptional: true, max: 0xff, default: 0},
            batteryPercentMinThres: {ID: 0x003a, type: DataType.UINT8, writable: true, writeOptional: true, max: 0xff, default: 0},
            batteryPercentThres1: {ID: 0x003b, type: DataType.UINT8, writable: true, writeOptional: true, max: 0xff, default: 0},
            batteryPercentThres2: {ID: 0x003c, type: DataType.UINT8, writable: true, writeOptional: true, max: 0xff, default: 0},
            batteryPercentThres3: {ID: 0x003d, type: DataType.UINT8, writable: true, writeOptional: true, max: 0xff, default: 0},
            batteryAlarmState: {ID: 0x003e, type: DataType.BITMAP32, reportRequired: true, default: 0},
            battery2Voltage: {ID: 0x0040, type: DataType.UINT8, max: 0xff},
            battery2PercentageRemaining: {ID: 0x0041, type: DataType.UINT8, reportRequired: true, max: 0xff, default: 0},
            battery2Manufacturer: {ID: 0x0050, type: DataType.CHAR_STR, writable: true, default: "", maxLen: 16},
            battery2Size: {ID: 0x0051, type: DataType.ENUM8, writable: true, default: 0xff},
            battery2AHrRating: {ID: 0x0052, type: DataType.UINT16, writable: true, max: 0xffff},
            battery2Quantity: {ID: 0x0053, type: DataType.UINT8, writable: true, max: 0xff},
            battery2RatedVoltage: {ID: 0x0054, type: DataType.UINT8, writable: true, max: 0xff},
            battery2AlarmMask: {ID: 0x0055, type: DataType.BITMAP8, writable: true, default: 0},
            battery2VoltageMinThreshold: {ID: 0x0056, type: DataType.UINT8, writable: true, max: 0xff, default: 0},
            battery2VoltageThreshold1: {ID: 0x0057, type: DataType.UINT8, writable: true, writeOptional: true, max: 0xff, default: 0},
            battery2VoltageThreshold2: {ID: 0x0058, type: DataType.UINT8, writable: true, writeOptional: true, max: 0xff, default: 0},
            battery2VoltageThreshold3: {ID: 0x0059, type: DataType.UINT8, writable: true, writeOptional: true, max: 0xff, default: 0},
            battery2PercentageMinThreshold: {ID: 0x005a, type: DataType.UINT8, writable: true, writeOptional: true, max: 0xff, default: 0},
            battery2PercentageThreshold1: {ID: 0x005b, type: DataType.UINT8, writable: true, writeOptional: true, max: 0xff, default: 0},
            battery2PercentageThreshold2: {ID: 0x005c, type: DataType.UINT8, writable: true, writeOptional: true, max: 0xff, default: 0},
            battery2PercentageThreshold3: {ID: 0x005d, type: DataType.UINT8, writable: true, writeOptional: true, max: 0xff, default: 0},
            battery2AlarmState: {ID: 0x005e, type: DataType.BITMAP32, reportRequired: true, default: 0},
            battery3Voltage: {ID: 0x0060, type: DataType.UINT8, max: 0xff},
            battery3PercentageRemaining: {ID: 0x0061, type: DataType.UINT8, reportRequired: true, max: 0xff, default: 0},
            battery3Manufacturer: {ID: 0x0070, type: DataType.CHAR_STR, writable: true, default: "", maxLen: 16},
            battery3Size: {ID: 0x0071, type: DataType.ENUM8, writable: true, default: 0xff},
            battery3AHrRating: {ID: 0x0072, type: DataType.UINT16, writable: true, max: 0xffff},
            battery3Quantity: {ID: 0x0073, type: DataType.UINT8, writable: true, max: 0xff},
            battery3RatedVoltage: {ID: 0x0074, type: DataType.UINT8, writable: true, max: 0xff},
            battery3AlarmMask: {ID: 0x0075, type: DataType.BITMAP8, writable: true, default: 0},
            battery3VoltageMinThreshold: {ID: 0x0076, type: DataType.UINT8, writable: true, max: 0xff, default: 0},
            battery3VoltageThreshold1: {ID: 0x0077, type: DataType.UINT8, writable: true, writeOptional: true, max: 0xff, default: 0},
            battery3VoltageThreshold2: {ID: 0x0078, type: DataType.UINT8, writable: true, writeOptional: true, max: 0xff, default: 0},
            battery3VoltageThreshold3: {ID: 0x0079, type: DataType.UINT8, writable: true, writeOptional: true, max: 0xff, default: 0},
            battery3PercentageMinThreshold: {ID: 0x007a, type: DataType.UINT8, writable: true, writeOptional: true, max: 0xff, default: 0},
            battery3PercentageThreshold1: {ID: 0x007b, type: DataType.UINT8, writable: true, writeOptional: true, max: 0xff, default: 0},
            battery3PercentageThreshold2: {ID: 0x007c, type: DataType.UINT8, writable: true, writeOptional: true, max: 0xff, default: 0},
            battery3PercentageThreshold3: {ID: 0x007d, type: DataType.UINT8, writable: true, writeOptional: true, max: 0xff, default: 0},
            battery3AlarmState: {ID: 0x007e, type: DataType.BITMAP32, reportRequired: true, default: 0},
        },
        commands: {},
        commandsResponse: {},
    },
    genDeviceTempCfg: {
        ID: 0x0002,
        attributes: {
            currentTemperature: {ID: 0x0000, type: DataType.INT16, required: true, min: -200, max: 200},
            minTempExperienced: {ID: 0x0001, type: DataType.INT16, min: -200, max: 200},
            maxTempExperienced: {ID: 0x0002, type: DataType.INT16, min: -200, max: 200},
            overTempTotalDwell: {ID: 0x0003, type: DataType.UINT16, max: 0xffff, default: 0},
            devTempAlarmMask: {ID: 0x0010, type: DataType.BITMAP8, writable: true, default: 0},
            lowTempThres: {ID: 0x0011, type: DataType.INT16, writable: true, min: -200, max: 200, maxExclRef: "highTempThres"},
            highTempThres: {ID: 0x0012, type: DataType.INT16, writable: true, min: -200, max: 200, minExclRef: "lowTempThres"},
            lowTempDwellTripPoint: {ID: 0x0013, type: DataType.UINT24, writable: true, max: 0xffffff},
            highTempDwellTripPoint: {ID: 0x0014, type: DataType.UINT24, writable: true, max: 0xffffff},
        },
        commands: {},
        commandsResponse: {},
    },
    genIdentify: {
        ID: 0x0003,
        attributes: {
            identifyTime: {ID: 0x0000, type: DataType.UINT16, writable: true, required: true, max: 0xffff, default: 0},
            // custom
            identifyCommissionState: {ID: 0x0001, type: DataType.UNKNOWN},
        },
        commands: {
            identify: {ID: 0x00, parameters: [{name: "identifytime", type: DataType.UINT16}], required: true},
            identifyQuery: {ID: 0x01, parameters: [], required: true},
            triggerEffect: {
                ID: 0x40,
                parameters: [
                    {name: "effectid", type: DataType.ENUM8},
                    {name: "effectvariant", type: DataType.ENUM8},
                ],
            },
            // custom
            ezmodeInvoke: {ID: 0x02, parameters: [{name: "action", type: DataType.UINT8}]},
            updateCommissionState: {
                ID: 0x03,
                parameters: [
                    {name: "action", type: DataType.UINT8},
                    {name: "commstatemask", type: DataType.UINT8},
                ],
            },
        },
        commandsResponse: {
            identifyQueryRsp: {ID: 0x00, parameters: [{name: "timeout", type: DataType.UINT16}], required: true},
        },
    },
    genGroups: {
        ID: 0x0004,
        attributes: {
            nameSupport: {ID: 0x0000, type: DataType.BITMAP8, required: true, default: 0},
        },
        commands: {
            add: {
                ID: 0x00,
                response: 0,
                parameters: [
                    {name: "groupid", type: DataType.UINT16},
                    {name: "groupname", type: DataType.CHAR_STR},
                ],
                required: true,
            },
            view: {ID: 0x01, response: 1, parameters: [{name: "groupid", type: DataType.UINT16}], required: true},
            getMembership: {
                ID: 0x02,
                response: 2,
                parameters: [
                    {name: "groupcount", type: DataType.UINT8},
                    {name: "grouplist", type: BuffaloZclDataType.LIST_UINT16},
                ],
                required: true,
            },
            remove: {ID: 0x03, response: 3, parameters: [{name: "groupid", type: DataType.UINT16}], required: true},
            removeAll: {ID: 0x04, parameters: [], required: true},
            addIfIdentifying: {
                ID: 0x05,
                parameters: [
                    {name: "groupid", type: DataType.UINT16},
                    {name: "groupname", type: DataType.CHAR_STR},
                ],
                required: true,
            },
            // custom
            miboxerSetZones: {ID: 0xf0, parameters: [{name: "zones", type: BuffaloZclDataType.LIST_MIBOXER_ZONES}]},
        },
        commandsResponse: {
            addRsp: {
                ID: 0x00,
                parameters: [
                    {name: "status", type: DataType.ENUM8},
                    {name: "groupid", type: DataType.UINT16},
                ],
                required: true,
            },
            viewRsp: {
                ID: 0x01,
                parameters: [
                    {name: "status", type: DataType.ENUM8},
                    {name: "groupid", type: DataType.UINT16},
                    {name: "groupname", type: DataType.CHAR_STR},
                ],
                required: true,
            },
            getMembershipRsp: {
                ID: 0x02,
                parameters: [
                    {name: "capacity", type: DataType.UINT8},
                    {name: "groupcount", type: DataType.UINT8},
                    {name: "grouplist", type: BuffaloZclDataType.LIST_UINT16},
                ],
                required: true,
            },
            removeRsp: {
                ID: 0x03,
                parameters: [
                    {name: "status", type: DataType.ENUM8},
                    {name: "groupid", type: DataType.UINT16},
                ],
                required: true,
            },
        },
    },
    genScenes: {
        ID: 0x0005,
        attributes: {
            count: {ID: 0x0000, type: DataType.UINT8, required: true, max: 0xff, default: 0},
            currentScene: {ID: 0x0001, type: DataType.UINT8, required: true, max: 0xff, default: 0},
            currentGroup: {ID: 0x0002, type: DataType.UINT16, required: true, max: 0xfff7, default: 0},
            sceneValid: {ID: 0x0003, type: DataType.BOOLEAN, required: true, default: 0},
            nameSupport: {ID: 0x0004, type: DataType.BITMAP8, required: true, default: 0},
            lastCfgBy: {ID: 0x0005, type: DataType.IEEE_ADDR, special: [["UnknownOrNotConfigured", "ffffffffffffffff"]]},
        },
        commands: {
            add: {
                ID: 0x00,
                response: 0,
                parameters: [
                    {name: "groupid", type: DataType.UINT16},
                    {name: "sceneid", type: DataType.UINT8},
                    {name: "transtime", type: DataType.UINT16},
                    {name: "scenename", type: DataType.CHAR_STR},
                    {name: "extensionfieldsets", type: BuffaloZclDataType.EXTENSION_FIELD_SETS, arrayLengthSize: 0},
                ],
                required: true,
            },
            view: {
                ID: 0x01,
                response: 1,
                parameters: [
                    {name: "groupid", type: DataType.UINT16},
                    {name: "sceneid", type: DataType.UINT8},
                ],
                required: true,
            },
            remove: {
                ID: 0x02,
                response: 2,
                parameters: [
                    {name: "groupid", type: DataType.UINT16},
                    {name: "sceneid", type: DataType.UINT8},
                ],
                required: true,
            },
            removeAll: {ID: 0x03, response: 3, parameters: [{name: "groupid", type: DataType.UINT16}], required: true},
            store: {
                ID: 0x04,
                response: 4,
                parameters: [
                    {name: "groupid", type: DataType.UINT16},
                    {name: "sceneid", type: DataType.UINT8},
                ],
                required: true,
            },
            recall: {
                ID: 0x05,
                parameters: [
                    {name: "groupid", type: DataType.UINT16},
                    {name: "sceneid", type: DataType.UINT8},
                    {name: "transitionTime", type: DataType.UINT16},
                ],
                required: true,
            },
            getSceneMembership: {ID: 0x06, response: 6, parameters: [{name: "groupid", type: DataType.UINT16}], required: true},
            enhancedAdd: {
                ID: 0x40,
                response: 64,
                parameters: [
                    {name: "groupid", type: DataType.UINT16},
                    {name: "sceneid", type: DataType.UINT8},
                    {name: "transtime", type: DataType.UINT16},
                    {name: "scenename", type: DataType.CHAR_STR},
                    {name: "extensionfieldsets", type: BuffaloZclDataType.EXTENSION_FIELD_SETS, arrayLengthSize: 0},
                ],
            },
            enhancedView: {
                ID: 0x41,
                response: 65,
                parameters: [
                    {name: "groupid", type: DataType.UINT16},
                    {name: "sceneid", type: DataType.UINT8},
                ],
            },
            copy: {
                ID: 0x42,
                response: 66,
                parameters: [
                    {name: "mode", type: DataType.BITMAP8},
                    {name: "groupidfrom", type: DataType.UINT16},
                    {name: "sceneidfrom", type: DataType.UINT8},
                    {name: "groupidto", type: DataType.UINT16},
                    {name: "sceneidto", type: DataType.UINT8},
                ],
            },
            // custom
            tradfriArrowSingle: {
                ID: 0x07,
                parameters: [
                    {name: "value", type: DataType.UINT16},
                    {name: "value2", type: DataType.UINT16},
                ],
            },
            tradfriArrowHold: {ID: 0x08, parameters: [{name: "value", type: DataType.UINT16}]},
            tradfriArrowRelease: {ID: 0x09, parameters: [{name: "value", type: DataType.UINT16}]},
        },
        commandsResponse: {
            addRsp: {
                ID: 0x00,
                parameters: [
                    {name: "status", type: DataType.ENUM8},
                    {name: "groupId", type: DataType.UINT16},
                    {name: "sceneId", type: DataType.UINT8},
                ],
                required: true,
            },
            viewRsp: {
                ID: 0x01,
                parameters: [
                    {name: "status", type: DataType.ENUM8},
                    {name: "groupid", type: DataType.UINT16},
                    {name: "sceneid", type: DataType.UINT8},
                    {
                        name: "transtime",
                        type: DataType.UINT16,
                        conditions: [{type: ParameterCondition.FIELD_EQUAL, field: "status", value: Status.SUCCESS}],
                    },
                    {
                        name: "scenename",
                        type: DataType.CHAR_STR,
                        conditions: [{type: ParameterCondition.FIELD_EQUAL, field: "status", value: Status.SUCCESS}],
                    },
                    {
                        name: "extensionfieldsets",
                        type: BuffaloZclDataType.EXTENSION_FIELD_SETS,
                        conditions: [{type: ParameterCondition.FIELD_EQUAL, field: "status", value: Status.SUCCESS}],
                        arrayLengthSize: 0,
                    },
                ],
                required: true,
            },
            removeRsp: {
                ID: 0x02,
                parameters: [
                    {name: "status", type: DataType.ENUM8},
                    {name: "groupid", type: DataType.UINT16},
                    {name: "sceneid", type: DataType.UINT8},
                ],
                required: true,
            },
            removeAllRsp: {
                ID: 0x03,
                parameters: [
                    {name: "status", type: DataType.ENUM8},
                    {name: "groupid", type: DataType.UINT16},
                ],
                required: true,
            },
            storeRsp: {
                ID: 0x04,
                parameters: [
                    {name: "status", type: DataType.ENUM8},
                    {name: "groupid", type: DataType.UINT16},
                    {name: "sceneid", type: DataType.UINT8},
                ],
                required: true,
            },
            getSceneMembershipRsp: {
                ID: 0x06,
                parameters: [
                    {name: "status", type: DataType.ENUM8},
                    {
                        name: "capacity",
                        type: DataType.UINT8,
                        min: 1,
                        max: 0xff,
                        special: [
                            ["NoFurtherScenesMayBeAdded", "00"],
                            ["AtLeastOneFurtherSceneMayBeAdded", "fe"],
                            ["Unknown", "ff"],
                        ],
                    },
                    {name: "groupid", type: DataType.UINT16},
                    {
                        name: "scenecount",
                        type: DataType.UINT8,
                        conditions: [{type: ParameterCondition.FIELD_EQUAL, field: "status", value: Status.SUCCESS}],
                    },
                    {
                        name: "scenelist",
                        type: BuffaloZclDataType.LIST_UINT8,
                        conditions: [{type: ParameterCondition.FIELD_EQUAL, field: "status", value: Status.SUCCESS}],
                    },
                ],
                required: true,
            },
            enhancedAddRsp: {
                ID: 0x40,
                parameters: [
                    {name: "status", type: DataType.ENUM8},
                    {name: "groupId", type: DataType.UINT16},
                    {name: "sceneId", type: DataType.UINT8},
                ],
            },
            enhancedViewRsp: {
                ID: 0x41,
                parameters: [
                    {name: "status", type: DataType.ENUM8},
                    {name: "groupid", type: DataType.UINT16},
                    {name: "sceneid", type: DataType.UINT8},
                    {
                        name: "transtime",
                        type: DataType.UINT16,
                        conditions: [{type: ParameterCondition.FIELD_EQUAL, field: "status", value: Status.SUCCESS}],
                    },
                    {
                        name: "scenename",
                        type: DataType.CHAR_STR,
                        conditions: [{type: ParameterCondition.FIELD_EQUAL, field: "status", value: Status.SUCCESS}],
                    },
                    {
                        name: "extensionfieldsets",
                        type: BuffaloZclDataType.EXTENSION_FIELD_SETS,
                        conditions: [{type: ParameterCondition.FIELD_EQUAL, field: "status", value: Status.SUCCESS}],
                        arrayLengthSize: 0,
                    },
                ],
            },
            copyRsp: {
                ID: 0x42,
                parameters: [
                    {name: "status", type: DataType.ENUM8},
                    {name: "groupidfrom", type: DataType.UINT16},
                    {name: "sceneidfrom", type: DataType.UINT8},
                ],
            },
        },
    },
    genOnOff: {
        ID: 0x0006,
        attributes: {
            onOff: {ID: 0x0000, type: DataType.BOOLEAN, reportRequired: true, sceneRequired: true, required: true, default: 0},
            globalSceneCtrl: {ID: 0x4000, type: DataType.BOOLEAN, default: 1},
            onTime: {ID: 0x4001, type: DataType.UINT16, writable: true, max: 0xffff, default: 0},
            offWaitTime: {ID: 0x4002, type: DataType.UINT16, writable: true, max: 0xffff, default: 0},
            startUpOnOff: {ID: 0x4003, type: DataType.ENUM8, writable: true, max: 0xff, special: [["SetToPreviousValue", "ff"]]},
            // custom
            nodonTransitionTime: {ID: 0x0001, type: DataType.UINT16, manufacturerCode: ManufacturerCode.NODON},
            tuyaBacklightSwitch: {ID: 0x5000, type: DataType.ENUM8},
            tuyaBacklightMode: {ID: 0x8001, type: DataType.ENUM8},
            moesStartUpOnOff: {ID: 0x8002, type: DataType.ENUM8},
            tuyaOperationMode: {ID: 0x8004, type: DataType.ENUM8},
            elkoPreWarningTime: {ID: 0xe000, type: DataType.UINT16, manufacturerCode: ManufacturerCode.ADEO},
            elkoOnTimeReload: {ID: 0xe001, type: DataType.UINT32, manufacturerCode: ManufacturerCode.ADEO},
            elkoOnTimeReloadOptions: {ID: 0xe002, type: DataType.BITMAP8, manufacturerCode: ManufacturerCode.ADEO},
        },
        commands: {
            off: {ID: 0x00, parameters: [], required: true},
            on: {ID: 0x01, parameters: [], required: true},
            toggle: {ID: 0x02, parameters: [], required: true},
            offWithEffect: {
                ID: 0x40,
                parameters: [
                    {name: "effectid", type: DataType.ENUM8},
                    {name: "effectvariant", type: DataType.UINT8},
                ],
            },
            onWithRecallGlobalScene: {ID: 0x41, parameters: []},
            onWithTimedOff: {
                ID: 0x42,
                parameters: [
                    {name: "ctrlbits", type: DataType.UINT8},
                    {name: "ontime", type: DataType.UINT16},
                    {name: "offwaittime", type: DataType.UINT16},
                ],
            },
            // custom
            tuyaAction2: {ID: 0xfc, parameters: [{name: "value", type: DataType.UINT8}]},
            tuyaAction: {
                ID: 0xfd,
                parameters: [
                    {name: "value", type: DataType.UINT8},
                    {name: "data", type: BuffaloZclDataType.BUFFER},
                ],
            },
        },
        commandsResponse: {},
    },
    genOnOffSwitchCfg: {
        ID: 0x0007,
        attributes: {
            switchType: {ID: 0x0000, type: DataType.ENUM8, required: true, min: 0x00, max: 0x02},
            switchActions: {ID: 0x0010, type: DataType.ENUM8, required: true, writable: true, min: 0, max: 2},
            // custom
            // TODO: doesn't exist?
            switchMultiFunction: {ID: 0x0002, type: DataType.UNKNOWN},
        },
        commands: {},
        commandsResponse: {},
    },
    genLevelCtrl: {
        ID: 0x0008,
        attributes: {
            currentLevel: {
                ID: 0x0000,
                type: DataType.UINT8,
                reportRequired: true,
                sceneRequired: true,
                required: true,
                default: 0xff,
                minRef: "minLevel",
                maxRef: "maxLevel",
            },
            remainingTime: {ID: 0x0001, type: DataType.UINT16, max: 0xffff, default: 0},
            minLevel: {ID: 0x0002, type: DataType.UINT8, default: 0, maxRef: "maxLevel"},
            maxLevel: {ID: 0x0003, type: DataType.UINT8, max: 0xff, default: 0xff, minRef: "minLevel"},
            currentFrequency: {
                ID: 0x0004,
                type: DataType.UINT16,
                reportRequired: true,
                sceneRequired: true,
                default: 0,
                minRef: "minFrequency",
                maxRef: "maxFrequency",
            },
            minFrequency: {ID: 0x0005, type: DataType.UINT16, default: 0, maxRef: "maxFrequency"},
            maxFrequency: {ID: 0x0006, type: DataType.UINT16, max: 0xffff, default: 0, minRef: "minFrequency"},
            options: {ID: 0x000f, type: DataType.BITMAP8, writable: true, default: 0},
            onOffTransitionTime: {ID: 0x0010, type: DataType.UINT16, writable: true, max: 0xffff, default: 0},
            onLevel: {ID: 0x0011, type: DataType.UINT8, writable: true, default: 0xff, minRef: "minLevel", maxRef: "maxLevel"},
            onTransitionTime: {ID: 0x0012, type: DataType.UINT16, writable: true, max: 0xfffe, default: 0xffff},
            offTransitionTime: {ID: 0x0013, type: DataType.UINT16, writable: true, max: 0xfffe, default: 0xffff},
            defaultMoveRate: {ID: 0x0014, type: DataType.UINT8, writable: true, max: 0xfe},
            startUpCurrentLevel: {
                ID: 0x4000,
                type: DataType.UINT8,
                writable: true,
                max: 0xff,
                special: [
                    ["MinimumDeviceValuePermitted", "00"],
                    ["SetToPreviousValue", "ff"],
                ],
            },
            // custom
            // TODO: needed?
            elkoStartUpCurrentLevel: {ID: 0x4000, type: DataType.UINT8, manufacturerCode: ManufacturerCode.ADEO},
        },
        commands: {
            moveToLevel: {
                ID: 0x00,
                parameters: [
                    {name: "level", type: DataType.UINT8},
                    {name: "transtime", type: DataType.UINT16},
                    {name: "optionsMask", type: DataType.BITMAP8},
                    {name: "optionsOverride", type: DataType.BITMAP8},
                ],
                required: true,
            },
            move: {
                ID: 0x01,
                parameters: [
                    {name: "movemode", type: DataType.ENUM8},
                    {name: "rate", type: DataType.UINT8},
                    {name: "optionsMask", type: DataType.BITMAP8},
                    {name: "optionsOverride", type: DataType.BITMAP8},
                ],
                required: true,
            },
            step: {
                ID: 0x02,
                parameters: [
                    {name: "stepmode", type: DataType.ENUM8},
                    {name: "stepsize", type: DataType.UINT8},
                    {name: "transtime", type: DataType.UINT16},
                    {name: "optionsMask", type: DataType.BITMAP8},
                    {name: "optionsOverride", type: DataType.BITMAP8},
                ],
                required: true,
            },
            stop: {
                ID: 0x03,
                parameters: [
                    {name: "optionsMask", type: DataType.BITMAP8},
                    {name: "optionsOverride", type: DataType.BITMAP8},
                ],
                required: true,
            },
            moveToLevelWithOnOff: {
                ID: 0x04,
                parameters: [
                    {name: "level", type: DataType.UINT8},
                    {name: "transtime", type: DataType.UINT16},
                    {name: "optionsMask", type: DataType.BITMAP8},
                    {name: "optionsOverride", type: DataType.BITMAP8},
                ],
                required: true,
            },
            moveWithOnOff: {
                ID: 0x05,
                parameters: [
                    {name: "movemode", type: DataType.ENUM8},
                    {name: "rate", type: DataType.UINT8},
                    {name: "optionsMask", type: DataType.BITMAP8},
                    {name: "optionsOverride", type: DataType.BITMAP8},
                ],
                required: true,
            },
            stepWithOnOff: {
                ID: 0x06,
                parameters: [
                    {name: "stepmode", type: DataType.ENUM8},
                    {name: "stepsize", type: DataType.UINT8},
                    {name: "transtime", type: DataType.UINT16},
                    {name: "optionsMask", type: DataType.BITMAP8},
                    {name: "optionsOverride", type: DataType.BITMAP8},
                ],
                required: true,
            },
            stopWithOnOff: {
                ID: 0x07,
                parameters: [
                    {name: "optionsMask", type: DataType.BITMAP8},
                    {name: "optionsOverride", type: DataType.BITMAP8},
                ],
                required: true,
            },
            // only `required: true` if `currentFrequency` attribute supported
            moveToClosestFrequency: {ID: 0x08, parameters: [{name: "frequency", type: DataType.UINT16}]},
            // custom
            moveToLevelTuya: {
                ID: 0xf0,
                parameters: [
                    {name: "level", type: DataType.UINT16},
                    {name: "transtime", type: DataType.UINT16},
                ],
            },
        },
        commandsResponse: {},
    },
    genAlarms: {
        ID: 0x0009,
        attributes: {
            alarmCount: {ID: 0x0000, type: DataType.UINT16, max: 0xffff, default: 0},
        },
        commands: {
            reset: {
                ID: 0x00,
                parameters: [
                    {name: "alarmcode", type: DataType.ENUM8},
                    {name: "clusterid", type: DataType.CLUSTER_ID},
                ],
                required: true,
            },
            resetAll: {ID: 0x01, parameters: [], required: true},
            getAlarm: {ID: 0x02, parameters: []},
            resetLog: {ID: 0x03, parameters: []},
            // custom
            publishEventLog: {ID: 0x04, parameters: []},
        },
        commandsResponse: {
            alarm: {
                ID: 0x00,
                parameters: [
                    {name: "alarmcode", type: DataType.ENUM8},
                    {name: "clusterid", type: DataType.CLUSTER_ID},
                ],
                required: true,
            },
            getRsp: {
                ID: 0x01,
                parameters: [
                    {name: "status", type: DataType.ENUM8},
                    {
                        name: "alarmcode",
                        type: DataType.ENUM8,
                        conditions: [{type: ParameterCondition.FIELD_EQUAL, field: "status", value: Status.SUCCESS}],
                    },
                    {
                        name: "clusterid",
                        type: DataType.CLUSTER_ID,
                        conditions: [{type: ParameterCondition.FIELD_EQUAL, field: "status", value: Status.SUCCESS}],
                    },
                    {
                        name: "timestamp",
                        type: DataType.UINT32,
                        conditions: [{type: ParameterCondition.FIELD_EQUAL, field: "status", value: Status.SUCCESS}],
                    },
                ],
            },
            // custom
            getEventLog: {ID: 0x02, parameters: []},
        },
    },
    genTime: {
        ID: 0x000a,
        attributes: {
            time: {ID: 0x0000, type: DataType.UTC, writable: true, required: true, max: 0xfffffffe, default: 0xffffffff},
            timeStatus: {ID: 0x0001, type: DataType.BITMAP8, writable: true, required: true, default: 0},
            timeZone: {ID: 0x0002, type: DataType.INT32, writable: true, min: -86400, max: 86400, default: 0},
            dstStart: {ID: 0x0003, type: DataType.UINT32, writable: true, max: 0xfffffffe, default: 0xffffffff},
            dstEnd: {ID: 0x0004, type: DataType.UINT32, writable: true, max: 0xfffffffe, default: 0xffffffff},
            dstShift: {ID: 0x0005, type: DataType.INT32, writable: true, min: -86400, max: 86400, default: 0},
            standardTime: {ID: 0x0006, type: DataType.UINT32, max: 0xfffffffe, default: 0xffffffff},
            localTime: {ID: 0x0007, type: DataType.UINT32, max: 0xfffffffe, default: 0xffffffff},
            lastSetTime: {ID: 0x0008, type: DataType.UTC, default: 0xffffffff},
            validUntilTime: {ID: 0x0009, type: DataType.UTC, writable: true, default: 0xffffffff},
        },
        commands: {},
        commandsResponse: {},
    },
    genRssiLocation: {
        ID: 0x000b,
        attributes: {
            /** [2: coordinator system, 1: 2-D, 1: absolute] */
            type: {ID: 0x0000, type: DataType.DATA8, required: true, writable: true},
            method: {ID: 0x0001, type: DataType.ENUM8, required: true, writable: true},
            age: {ID: 0x0002, type: DataType.UINT16, max: 0xffff},
            qualityMeasure: {ID: 0x0003, type: DataType.UINT8, max: 0x64},
            numOfDevices: {ID: 0x0004, type: DataType.UINT8, max: 0xff},
            coordinate1: {ID: 0x0010, type: DataType.INT16, required: true, writable: true, min: -0x8000, max: 0x7fff},
            coordinate2: {ID: 0x0011, type: DataType.INT16, required: true, writable: true, min: -0x8000, max: 0x7fff},
            coordinate3: {ID: 0x0012, type: DataType.INT16, writable: true, min: -0x8000, max: 0x7fff},
            power: {ID: 0x0013, type: DataType.INT16, required: true, writable: true, min: -0x8000, max: 0x7fff},
            pathLossExponent: {ID: 0x0014, type: DataType.UINT16, required: true, writable: true},
            reportingPeriod: {ID: 0x0015, type: DataType.UINT16, writable: true, max: 0xffff},
            calcPeriod: {ID: 0x0016, type: DataType.UINT16, writable: true, max: 0xffff},
            numRSSIMeasurements: {ID: 0x0017, type: DataType.UINT8, required: true, writable: true, min: 0x01, max: 0xff},
        },
        commands: {
            setAbsolute: {
                ID: 0x00,
                parameters: [
                    {name: "coord1", type: DataType.INT16},
                    {name: "coord2", type: DataType.INT16},
                    {name: "coord3", type: DataType.INT16},
                    {name: "power", type: DataType.INT16},
                    {name: "pathLossExponent", type: DataType.UINT16},
                ],
                required: true,
            },
            setDeviceConfig: {
                ID: 0x01,
                parameters: [
                    {name: "power", type: DataType.INT16},
                    {name: "pathLossExponent", type: DataType.UINT16},
                    {name: "calcPeriod", type: DataType.UINT16},
                    {name: "numRssiMeasurements", type: DataType.UINT8},
                    {name: "reportingPeriod", type: DataType.UINT16},
                ],
                required: true,
            },
            getDeviceConfig: {ID: 0x02, parameters: [{name: "targetAddr", type: DataType.IEEE_ADDR}], required: true},
            getLocationData: {
                ID: 0x03,
                parameters: [
                    /** [3: reserved, 1: compactResponse, 1: broadcastResponse, 1: broadcastIndicator, 1: recalculate, 1: absoluteOnly] */
                    {name: "info", type: DataType.BITMAP8},
                    {name: "numResponses", type: DataType.UINT8},
                    {
                        name: "targetAddr",
                        type: DataType.IEEE_ADDR,
                        conditions: [{type: ParameterCondition.BITMASK_SET, param: "info", mask: 0b100, reversed: true}],
                    },
                ],
                required: true,
            },
            rssiResponse: {
                ID: 0x04,
                parameters: [
                    {name: "replyingDevice", type: DataType.IEEE_ADDR},
                    {name: "x", type: DataType.INT16},
                    {name: "y", type: DataType.INT16},
                    {name: "z", type: DataType.INT16},
                    {name: "rssi", type: DataType.INT8},
                    {name: "numRssiMeasurements", type: DataType.UINT8},
                ],
            },
            sendPings: {
                ID: 0x05,
                parameters: [
                    {name: "targetAddr", type: DataType.IEEE_ADDR},
                    {name: "numRssiMeasurements", type: DataType.UINT8},
                    {name: "calcPeriod", type: DataType.UINT16},
                ],
            },
            anchorNodeAnnounce: {
                ID: 0x06,
                parameters: [
                    {name: "anchorNodeAddr", type: DataType.IEEE_ADDR},
                    {name: "x", type: DataType.INT16},
                    {name: "y", type: DataType.INT16},
                    {name: "z", type: DataType.INT16},
                ],
            },
        },
        commandsResponse: {
            deviceConfigResponse: {
                ID: 0x00,
                parameters: [
                    {name: "status", type: DataType.ENUM8},
                    {
                        name: "power",
                        type: DataType.INT16,
                        conditions: [{type: ParameterCondition.FIELD_EQUAL, field: "status", value: Status.SUCCESS}],
                    },
                    {
                        name: "pathLossExponent",
                        type: DataType.UINT16,
                        conditions: [{type: ParameterCondition.FIELD_EQUAL, field: "status", value: Status.SUCCESS}],
                    },
                    {
                        name: "calcPeriod",
                        type: DataType.UINT16,
                        conditions: [{type: ParameterCondition.FIELD_EQUAL, field: "status", value: Status.SUCCESS}],
                    },
                    {
                        name: "numRssiMeasurements",
                        type: DataType.UINT8,
                        conditions: [{type: ParameterCondition.FIELD_EQUAL, field: "status", value: Status.SUCCESS}],
                    },
                    {
                        name: "reportingPeriod",
                        type: DataType.UINT16,
                        conditions: [{type: ParameterCondition.FIELD_EQUAL, field: "status", value: Status.SUCCESS}],
                    },
                ],
                required: true,
            },
            locationDataResponse: {
                ID: 0x01,
                parameters: [
                    {name: "status", type: DataType.ENUM8},
                    {
                        name: "type",
                        type: DataType.DATA8,
                        conditions: [{type: ParameterCondition.FIELD_EQUAL, field: "status", value: Status.SUCCESS}],
                    },
                    {
                        name: "coord1",
                        type: DataType.INT16,
                        conditions: [{type: ParameterCondition.FIELD_EQUAL, field: "status", value: Status.SUCCESS}],
                    },
                    {
                        name: "coord2",
                        type: DataType.INT16,
                        conditions: [{type: ParameterCondition.FIELD_EQUAL, field: "status", value: Status.SUCCESS}],
                    },
                    {
                        name: "coord3",
                        type: DataType.INT16,
                        conditions: [{type: ParameterCondition.FIELD_EQUAL, field: "status", value: Status.SUCCESS}],
                    },
                    {
                        name: "power",
                        type: DataType.INT16,
                        conditions: [{type: ParameterCondition.FIELD_EQUAL, field: "status", value: Status.SUCCESS}],
                    },
                    {
                        name: "pathLossExponent",
                        type: DataType.UINT16,
                        conditions: [{type: ParameterCondition.FIELD_EQUAL, field: "status", value: Status.SUCCESS}],
                    },
                    {
                        name: "method",
                        type: DataType.ENUM8,
                        conditions: [{type: ParameterCondition.FIELD_EQUAL, field: "status", value: Status.SUCCESS}],
                    },
                    {
                        name: "qualityMeasure",
                        type: DataType.UINT8,
                        conditions: [{type: ParameterCondition.FIELD_EQUAL, field: "status", value: Status.SUCCESS}],
                    },
                    {
                        name: "age",
                        type: DataType.UINT16,
                        conditions: [{type: ParameterCondition.FIELD_EQUAL, field: "status", value: Status.SUCCESS}],
                    },
                ],
                required: true,
            },
            locationDataNotification: {
                ID: 0x02,
                parameters: [
                    {name: "type", type: DataType.DATA8},
                    {name: "coord1", type: DataType.INT16},
                    {name: "coord2", type: DataType.INT16},
                    {
                        name: "coord3",
                        type: DataType.INT16,
                        conditions: [{type: ParameterCondition.BITMASK_SET, param: "type", mask: 0b10, reversed: true}],
                    },
                    {name: "power", type: DataType.INT16},
                    {name: "pathLossExponent", type: DataType.UINT16},
                    {
                        name: "method",
                        type: DataType.ENUM8,
                        conditions: [{type: ParameterCondition.BITMASK_SET, param: "type", mask: 0b1, reversed: true}],
                    },
                    {
                        name: "qualityMeasure",
                        type: DataType.UINT8,
                        conditions: [{type: ParameterCondition.BITMASK_SET, param: "type", mask: 0b1, reversed: true}],
                    },
                    {
                        name: "age",
                        type: DataType.UINT16,
                        conditions: [{type: ParameterCondition.BITMASK_SET, param: "type", mask: 0b1, reversed: true}],
                    },
                ],
            },
            compactLocationDataNotification: {
                ID: 0x03,
                parameters: [
                    {name: "type", type: DataType.DATA8},
                    {name: "coord1", type: DataType.INT16},
                    {name: "coord2", type: DataType.INT16},
                    {
                        name: "coord3",
                        type: DataType.INT16,
                        conditions: [{type: ParameterCondition.BITMASK_SET, param: "type", mask: 0b10, reversed: true}],
                    },
                    {
                        name: "qualityMeasure",
                        type: DataType.UINT8,
                        conditions: [{type: ParameterCondition.BITMASK_SET, param: "type", mask: 0b1, reversed: true}],
                    },
                    {
                        name: "age",
                        type: DataType.UINT16,
                        conditions: [{type: ParameterCondition.BITMASK_SET, param: "type", mask: 0b1, reversed: true}],
                    },
                ],
                required: true,
            },
            rssiPing: {ID: 0x04, parameters: [{name: "type", type: DataType.DATA8}], required: true},
            rssiRequest: {ID: 0x05, parameters: []},
            reportRssiMeasurements: {
                ID: 0x06,
                parameters: [
                    {name: "measuringDeviceAddr", type: DataType.IEEE_ADDR},
                    {name: "numNeighbors", type: DataType.UINT8},
                    // TODO: needs special Buffalo read(/write)
                    // {name: "neighborInfo", type: DataType.LIST_NEIGHBORS_INFO},
                    //   {name: "neighbor", type: DataType.IEEE_ADDR},
                    //   {name: "x", type: DataType.INT16},
                    //   {name: "y", type: DataType.INT16},
                    //   {name: "z", type: DataType.INT16},
                    //   {name: "rssi", type: DataType.INT8},
                    //   {name: "numRssiMeasurements", type: DataType.UINT8},
                ],
            },
            requestOwnLocation: {ID: 0x07, parameters: [{name: "blindNodeAddr", type: DataType.IEEE_ADDR}]},
        },
    },
    genAnalogInput: {
        ID: 0x000c,
        attributes: {
            description: {ID: 0x001c, type: DataType.CHAR_STR, writable: true, writeOptional: true, default: "\u0000"},
            maxPresentValue: {ID: 0x0041, type: DataType.SINGLE_PREC, writable: true, writeOptional: true},
            minPresentValue: {ID: 0x0045, type: DataType.SINGLE_PREC, writable: true, writeOptional: true},
            outOfService: {ID: 0x0051, type: DataType.BOOLEAN, required: true, writable: true, writeOptional: true, default: 0},
            presentValue: {ID: 0x0055, type: DataType.SINGLE_PREC, required: true, writable: true, reportRequired: true},
            reliability: {ID: 0x0067, type: DataType.ENUM8, writable: true, writeOptional: true, default: 0x00},
            resolution: {ID: 0x006a, type: DataType.SINGLE_PREC, writable: true, writeOptional: true},
            statusFlags: {ID: 0x006f, type: DataType.BITMAP8, required: true, reportRequired: true, max: 0x0f, default: 0},
            engineeringUnits: {ID: 0x0075, type: DataType.ENUM16, writable: true, writeOptional: true, max: 0xffff},
            applicationType: {ID: 0x0100, type: DataType.UINT32, max: 0xffffffff},
        },
        commands: {},
        commandsResponse: {},
    },
    genAnalogOutput: {
        ID: 0x000d,
        attributes: {
            description: {ID: 0x001c, type: DataType.CHAR_STR, writable: true, writeOptional: true, default: "\u0000"},
            maxPresentValue: {ID: 0x0041, type: DataType.SINGLE_PREC, writable: true, writeOptional: true},
            minPresentValue: {ID: 0x0045, type: DataType.SINGLE_PREC, writable: true, writeOptional: true},
            outOfService: {ID: 0x0051, type: DataType.BOOLEAN, required: true, writable: true, writeOptional: true, default: 0},
            presentValue: {ID: 0x0055, type: DataType.SINGLE_PREC, required: true, writable: true, reportRequired: true},
            priorityArray: {
                ID: 0x0057,
                type: DataType.ARRAY, // TODO: BuffaloZclDataType.LIST_ANALOG_PRIORITY
                writable: true,
                length: 16,
                // default: [[0, 0.0],[0, 0.0],[0, 0.0],[0, 0.0],[0, 0.0],[0, 0.0],[0, 0.0],[0, 0.0],[0, 0.0],[0, 0.0],[0, 0.0],[0, 0.0],[0, 0.0],[0, 0.0],[0, 0.0],[0, 0.0]],
            },
            reliability: {ID: 0x0067, type: DataType.ENUM8, writable: true, writeOptional: true, default: 0x00},
            relinquishDefault: {ID: 0x0068, type: DataType.SINGLE_PREC, writable: true, writeOptional: true},
            resolution: {ID: 0x006a, type: DataType.SINGLE_PREC, writable: true, writeOptional: true},
            statusFlags: {ID: 0x006f, type: DataType.BITMAP8, required: true, reportRequired: true, max: 0x0f, default: 0},
            engineeringUnits: {ID: 0x0075, type: DataType.ENUM16, writable: true, writeOptional: true, max: 0xffff},
            applicationType: {ID: 0x0100, type: DataType.UINT32, max: 0xffffffff},
        },
        commands: {},
        commandsResponse: {},
    },
    genAnalogValue: {
        ID: 0x000e,
        attributes: {
            description: {ID: 0x001c, type: DataType.CHAR_STR, writable: true, writeOptional: true, default: "\u0000"},
            outOfService: {ID: 0x0051, type: DataType.BOOLEAN, required: true, writable: true, writeOptional: true, default: 0},
            presentValue: {ID: 0x0055, type: DataType.SINGLE_PREC, required: true, writable: true},
            priorityArray: {
                ID: 0x0057,
                type: DataType.ARRAY, // TODO: BuffaloZclDataType.LIST_ANALOG_PRIORITY
                writable: true,
                length: 16,
                // default: [[0, 0.0],[0, 0.0],[0, 0.0],[0, 0.0],[0, 0.0],[0, 0.0],[0, 0.0],[0, 0.0],[0, 0.0],[0, 0.0],[0, 0.0],[0, 0.0],[0, 0.0],[0, 0.0],[0, 0.0],[0, 0.0]],
            },
            reliability: {ID: 0x0067, type: DataType.ENUM8, writable: true, writeOptional: true, default: 0x00},
            relinquishDefault: {ID: 0x0068, type: DataType.SINGLE_PREC, writable: true, writeOptional: true},
            statusFlags: {ID: 0x006f, type: DataType.BITMAP8, required: true, max: 0x0f, default: 0},
            engineeringUnits: {ID: 0x0075, type: DataType.ENUM16, writable: true, writeOptional: true, max: 0xffff},
            applicationType: {ID: 0x0100, type: DataType.UINT32, max: 0xffffffff},
        },
        commands: {},
        commandsResponse: {},
    },
    genBinaryInput: {
        ID: 0x000f,
        attributes: {
            activeText: {ID: 0x0004, type: DataType.CHAR_STR, writable: true, writeOptional: true, default: "\u0000"},
            description: {ID: 0x001c, type: DataType.CHAR_STR, writable: true, writeOptional: true, default: "\u0000"},
            inactiveText: {ID: 0x002e, type: DataType.CHAR_STR, writable: true, writeOptional: true, default: "\u0000"},
            outOfService: {ID: 0x0051, type: DataType.BOOLEAN, required: true, writable: true, writeOptional: true, default: 0},
            polarity: {ID: 0x0054, type: DataType.ENUM8, default: 0},
            presentValue: {ID: 0x0055, type: DataType.BOOLEAN, required: true, writable: true, writeOptional: true},
            reliability: {ID: 0x0067, type: DataType.ENUM8, writable: true, writeOptional: true, default: 0x00},
            statusFlags: {ID: 0x006f, type: DataType.BITMAP8, required: true, max: 0x0f, default: 0},
            applicationType: {ID: 0x0100, type: DataType.UINT32, max: 0xffffffff},
        },
        commands: {},
        commandsResponse: {},
    },
    genBinaryOutput: {
        ID: 0x0010,
        attributes: {
            activeText: {ID: 0x0004, type: DataType.CHAR_STR, writable: true, writeOptional: true, default: "\u0000"},
            description: {ID: 0x001c, type: DataType.CHAR_STR, writable: true, writeOptional: true, default: "\u0000"},
            inactiveText: {ID: 0x002e, type: DataType.CHAR_STR, writable: true, writeOptional: true, default: "\u0000"},
            minimumOffTime: {ID: 0x0042, type: DataType.UINT32, writable: true, writeOptional: true, default: 0xffffffff},
            minimumOnTime: {ID: 0x0043, type: DataType.UINT32, writable: true, writeOptional: true, default: 0xffffffff},
            outOfService: {ID: 0x0051, type: DataType.BOOLEAN, required: true, writeOptional: true, writable: true, default: 0},
            polarity: {ID: 0x0054, type: DataType.ENUM8, default: 0},
            presentValue: {ID: 0x0055, type: DataType.BOOLEAN, required: true, writable: true, writeOptional: true},
            priorityArray: {
                ID: 0x0057,
                type: DataType.ARRAY, // TODO: BuffaloZclDataType.LIST_BINARY_PRIORITY
                writable: true,
                length: 16,
                // default: [[0, 0],[0, 0],[0, 0],[0, 0],[0, 0],[0, 0],[0, 0],[0, 0],[0, 0],[0, 0],[0, 0],[0, 0],[0, 0],[0, 0],[0, 0],[0, 0]],
            },
            reliability: {ID: 0x0067, type: DataType.ENUM8, writable: true, writeOptional: true},
            relinquishDefault: {ID: 0x0068, type: DataType.BOOLEAN, writable: true, writeOptional: true},
            statusFlags: {ID: 0x006f, type: DataType.BITMAP8, required: true, max: 0x0f, default: 0},
            applicationType: {ID: 0x0100, type: DataType.UINT32, max: 0xffffffff},
        },
        commands: {},
        commandsResponse: {},
    },
    genBinaryValue: {
        ID: 0x0011,
        attributes: {
            activeText: {ID: 0x0004, type: DataType.CHAR_STR, writable: true, writeOptional: true, default: "\u0000"},
            description: {ID: 0x001c, type: DataType.CHAR_STR, writable: true, writeOptional: true, default: "\u0000"},
            inactiveText: {ID: 0x002e, type: DataType.CHAR_STR, writable: true, writeOptional: true, default: "\u0000"},
            minimumOffTime: {ID: 0x0042, type: DataType.UINT32, writable: true, writeOptional: true, default: 0xffffffff},
            minimumOnTime: {ID: 0x0043, type: DataType.UINT32, writable: true, writeOptional: true, default: 0xffffffff},
            outOfService: {ID: 0x0051, type: DataType.BOOLEAN, required: true, writeOptional: true, writable: true, default: 0},
            presentValue: {ID: 0x0055, type: DataType.BOOLEAN, required: true, writeOptional: true, writable: true},
            priorityArray: {
                ID: 0x0057,
                type: DataType.ARRAY, // TODO: BuffaloZclDataType.LIST_BINARY_PRIORITY
                writable: true,
                length: 16,
                // default: [[0, 0],[0, 0],[0, 0],[0, 0],[0, 0],[0, 0],[0, 0],[0, 0],[0, 0],[0, 0],[0, 0],[0, 0],[0, 0],[0, 0],[0, 0],[0, 0]],
            },
            reliability: {ID: 0x0067, type: DataType.ENUM8, writable: true, writeOptional: true},
            relinquishDefault: {ID: 0x0068, type: DataType.BOOLEAN, writable: true, writeOptional: true},
            statusFlags: {ID: 0x006f, type: DataType.BITMAP8, required: true, max: 0x0f, default: 0},
            applicationType: {ID: 0x0100, type: DataType.UINT32, max: 0xffffffff},
        },
        commands: {},
        commandsResponse: {},
    },
    genMultistateInput: {
        ID: 0x0012,
        attributes: {
            stateText: {ID: 0x000e, type: DataType.ARRAY, writable: true, writeOptional: true /*default: null*/},
            description: {ID: 0x001c, type: DataType.CHAR_STR, writable: true, writeOptional: true, default: "\u0000"},
            numberOfStates: {ID: 0x004a, type: DataType.UINT16, required: true, writable: true, writeOptional: true, min: 1, max: 0xffff, default: 0},
            outOfService: {ID: 0x0051, type: DataType.BOOLEAN, required: true, writable: true, writeOptional: true, default: 0},
            presentValue: {ID: 0x0055, type: DataType.UINT16, required: true, writable: true, writeOptional: true},
            reliability: {ID: 0x0067, type: DataType.ENUM8, writable: true, writeOptional: true, default: 0x00},
            statusFlags: {ID: 0x006f, type: DataType.BITMAP8, required: true, max: 0x0f, default: 0},
            applicationType: {ID: 0x0100, type: DataType.UINT32, max: 0xffffffff},
        },
        commands: {},
        commandsResponse: {},
    },
    genMultistateOutput: {
        ID: 0x0013,
        attributes: {
            stateText: {ID: 0x000e, type: DataType.ARRAY, writable: true, writeOptional: true /*default: null*/},
            description: {ID: 0x001c, type: DataType.CHAR_STR, writable: true, writeOptional: true, default: "\u0000"},
            numberOfStates: {ID: 0x004a, type: DataType.UINT16, required: true, writable: true, writeOptional: true, min: 1, max: 0xffff, default: 0},
            outOfService: {ID: 0x0051, type: DataType.BOOLEAN, required: true, writable: true, writeOptional: true, default: 0},
            presentValue: {ID: 0x0055, type: DataType.UINT16, required: true, writable: true},
            priorityArray: {
                ID: 0x0057,
                type: DataType.ARRAY, // TODO: BuffaloZclDataType.LIST_BINARY_PRIORITY
                writable: true,
                length: 16,
                // default: [[0, 0],[0, 0],[0, 0],[0, 0],[0, 0],[0, 0],[0, 0],[0, 0],[0, 0],[0, 0],[0, 0],[0, 0],[0, 0],[0, 0],[0, 0],[0, 0]],
            },
            reliability: {ID: 0x0067, type: DataType.ENUM8, writable: true, writeOptional: true, default: 0x00},
            relinquishDefault: {ID: 0x0068, type: DataType.UINT16, writable: true, writeOptional: true},
            statusFlags: {ID: 0x006f, type: DataType.BITMAP8, required: true, max: 0x0f, default: 0},
            applicationType: {ID: 0x0100, type: DataType.UINT32, max: 0xffffffff},
        },
        commands: {},
        commandsResponse: {},
    },
    genMultistateValue: {
        ID: 0x0014,
        attributes: {
            stateText: {ID: 0x000e, type: DataType.ARRAY, writable: true, writeOptional: true /*default: null*/},
            description: {ID: 0x001c, type: DataType.CHAR_STR, writable: true, writeOptional: true, default: "\u0000"},
            numberOfStates: {ID: 0x004a, type: DataType.UINT16, required: true, writable: true, writeOptional: true, min: 1, max: 0xffff, default: 0},
            outOfService: {ID: 0x0051, type: DataType.BOOLEAN, required: true, writable: true, writeOptional: true, default: 0},
            presentValue: {ID: 0x0055, type: DataType.UINT16, required: true, writable: true},
            priorityArray: {
                ID: 0x0057,
                type: DataType.ARRAY, // TODO: BuffaloZclDataType.LIST_BINARY_PRIORITY
                writable: true,
                length: 16,
                // default: [[0, 0],[0, 0],[0, 0],[0, 0],[0, 0],[0, 0],[0, 0],[0, 0],[0, 0],[0, 0],[0, 0],[0, 0],[0, 0],[0, 0],[0, 0],[0, 0]],
            },
            reliability: {ID: 0x0067, type: DataType.ENUM8, writable: true, writeOptional: true, default: 0x00},
            relinquishDefault: {ID: 0x0068, type: DataType.UINT16, writable: true, writeOptional: true},
            statusFlags: {ID: 0x006f, type: DataType.BITMAP8, required: true, max: 0x0f, default: 0},
            applicationType: {ID: 0x0100, type: DataType.UINT32, max: 0xffffffff},
        },
        commands: {},
        commandsResponse: {},
    },
    genCommissioning: {
        ID: 0x0015,
        attributes: {
            shortress: {ID: 0x0000, type: DataType.UINT16, writable: true, required: true, max: 65527},
            extendedPANId: {
                ID: 0x0001,
                type: DataType.IEEE_ADDR,
                writable: true,
                required: true,
                default: "18446744073709551616",
                special: [["PANIdUnspecified", "ffffffffffffffff"]],
            },
            panId: {ID: 0x0002, type: DataType.UINT16, writable: true, required: true},
            channelmask: {ID: 0x0003, type: DataType.BITMAP32, writable: true, required: true},
            protocolVersion: {ID: 0x0004, type: DataType.UINT8, writable: true, required: true},
            stackProfile: {ID: 0x0005, type: DataType.UINT8, writable: true, required: true},
            startupControl: {ID: 0x0006, type: DataType.ENUM8, writable: true, required: true},
            trustCenterress: {
                ID: 0x0010,
                type: DataType.IEEE_ADDR,
                writable: true,
                required: true,
                default: "0",
                special: [["AddressUnspecified", "0000000000000000"]],
            },
            trustCenterMasterKey: {ID: 0x0011, type: DataType.SEC_KEY, writable: true, default: "0"},
            networkKey: {ID: 0x0012, type: DataType.SEC_KEY, writable: true, required: true, default: "0"},
            useInsecureJoin: {ID: 0x0013, type: DataType.BOOLEAN, writable: true, required: true, default: 0},
            preconfiguredLinkKey: {ID: 0x0014, type: DataType.SEC_KEY, writable: true, required: true, default: "0"},
            networkKeySeqNum: {ID: 0x0015, type: DataType.UINT8, writable: true, required: true, default: 0},
            networkKeyType: {ID: 0x0016, type: DataType.ENUM8, writable: true, required: true},
            networkManagerress: {ID: 0x0017, type: DataType.UINT16, writable: true, required: true, default: 0},
            scanAttempts: {ID: 0x0020, type: DataType.UINT8, writable: true, min: 1, default: 5},
            timeBetweenScans: {ID: 0x0021, type: DataType.UINT16, writable: true, min: 1, default: 100},
            rejoinInterval: {ID: 0x0022, type: DataType.UINT16, writable: true, min: 1, default: 60, maxRef: "maxRejoinInterval"},
            maxRejoinInterval: {ID: 0x0023, type: DataType.UINT16, writable: true, min: 1, default: 3600},
            indirectPollRate: {ID: 0x0030, type: DataType.UINT16, writable: true},
            parentRetryThreshold: {ID: 0x0031, type: DataType.UINT8},
            concentratorFlag: {ID: 0x0040, type: DataType.BOOLEAN, writable: true, default: 0},
            concentratorRus: {ID: 0x0041, type: DataType.UINT8, writable: true, default: 15},
            concentratorDiscoveryTime: {ID: 0x0042, type: DataType.UINT8, writable: true, default: 0},
        },
        commands: {
            restartDevice: {
                ID: 0x00,
                parameters: [
                    {name: "options", type: DataType.UINT8},
                    {name: "delay", type: DataType.UINT8},
                    {name: "jitter", type: DataType.UINT8},
                ],
                required: true,
            },
            saveStartupParams: {
                ID: 0x01,
                parameters: [
                    {name: "options", type: DataType.UINT8},
                    {name: "index", type: DataType.UINT8},
                ],
            },
            restoreStartupParams: {
                ID: 0x02,
                parameters: [
                    {name: "options", type: DataType.UINT8},
                    {name: "index", type: DataType.UINT8},
                ],
            },
            resetStartupParams: {
                ID: 0x03,
                parameters: [
                    {name: "options", type: DataType.UINT8},
                    {name: "index", type: DataType.UINT8},
                ],
                required: true,
            },
        },
        commandsResponse: {
            restartDeviceRsp: {ID: 0x00, parameters: [{name: "status", type: DataType.UINT8}], required: true},
            saveStartupParamsRsp: {ID: 0x01, parameters: [{name: "status", type: DataType.UINT8}], required: true},
            restoreStartupParamsRsp: {ID: 0x02, parameters: [{name: "status", type: DataType.UINT8}], required: true},
            resetStartupParamsRsp: {ID: 0x03, parameters: [{name: "status", type: DataType.UINT8}], required: true},
        },
    },
    genOta: {
        ID: 0x0019,
        attributes: {
            upgradeServerId: {ID: 0x0000, type: DataType.IEEE_ADDR, client: true, required: true, default: "18446744073709551615"},
            fileOffset: {ID: 0x0001, type: DataType.UINT32, client: true, default: 4294967294},
            currentFileVersion: {ID: 0x0002, type: DataType.UINT32, client: true, default: 4294967294},
            currentZigbeeStackVersion: {ID: 0x0003, type: DataType.UINT16, client: true, default: 65535},
            downloadedFileVersion: {ID: 0x0004, type: DataType.UINT32, client: true, default: 4294967294},
            downloadedZigbeeStackVersion: {ID: 0x0005, type: DataType.UINT16, client: true, default: 65535},
            imageUpgradeStatus: {ID: 0x0006, type: DataType.ENUM8, client: true, required: true, default: 0},
            manufacturerId: {ID: 0x0007, type: DataType.UINT16, client: true},
            imageTypeId: {ID: 0x0008, type: DataType.UINT16, client: true},
            minimumBlockReqDelay: {ID: 0x0009, type: DataType.UINT16, client: true, default: 0},
            imageStamp: {ID: 0x000a, type: DataType.UINT32, client: true},
            upgradeActivationPolicy: {ID: 0x000b, type: DataType.ENUM8, client: true, default: 0},
            upgradeTimeoutPolicy: {ID: 0x000c, type: DataType.ENUM8, client: true, default: 0},
        },
        commands: {
            queryNextImageRequest: {
                ID: 0x01,
                response: 2,
                parameters: [
                    {name: "fieldControl", type: DataType.UINT8},
                    {name: "manufacturerCode", type: DataType.UINT16},
                    {name: "imageType", type: DataType.UINT16},
                    {name: "fileVersion", type: DataType.UINT32},
                    {
                        name: "hardwareVersion",
                        type: DataType.UINT16,
                        conditions: [{type: ParameterCondition.BITMASK_SET, param: "fieldControl", mask: 0b1}],
                    },
                ],
                required: true,
            },
            imageBlockRequest: {
                ID: 0x03,
                response: 5,
                parameters: [
                    {name: "fieldControl", type: DataType.UINT8},
                    {name: "manufacturerCode", type: DataType.UINT16},
                    {name: "imageType", type: DataType.UINT16},
                    {name: "fileVersion", type: DataType.UINT32},
                    {name: "fileOffset", type: DataType.UINT32},
                    {name: "maximumDataSize", type: DataType.UINT8},
                    {
                        name: "requestNodeIeeeAddress",
                        type: DataType.IEEE_ADDR,
                        conditions: [{type: ParameterCondition.BITMASK_SET, param: "fieldControl", mask: 0b1}],
                    },
                    {
                        name: "minimumBlockPeriod",
                        type: DataType.UINT16,
                        conditions: [
                            {type: ParameterCondition.BITMASK_SET, param: "fieldControl", mask: 0b10},
                            // WORKAROUND: https://github.com/Koenkk/zigbee2mqtt/issues/28217
                            {type: ParameterCondition.MINIMUM_REMAINING_BUFFER_BYTES, value: 2},
                        ],
                    },
                ],
                required: true,
            },
            imagePageRequest: {
                ID: 0x04,
                response: 5,
                parameters: [
                    {name: "fieldControl", type: DataType.UINT8},
                    {name: "manufacturerCode", type: DataType.UINT16},
                    {name: "imageType", type: DataType.UINT16},
                    {name: "fileVersion", type: DataType.UINT32},
                    {name: "fileOffset", type: DataType.UINT32},
                    {name: "maximumDataSize", type: DataType.UINT8},
                    {name: "pageSize", type: DataType.UINT16},
                    {name: "responseSpacing", type: DataType.UINT16},
                    {
                        name: "requestNodeIeeeAddress",
                        type: DataType.IEEE_ADDR,
                        conditions: [{type: ParameterCondition.BITMASK_SET, param: "fieldControl", mask: 0b1}],
                    },
                ],
            },
            upgradeEndRequest: {
                ID: 0x06,
                response: 7,
                parameters: [
                    {name: "status", type: DataType.UINT8},
                    {name: "manufacturerCode", type: DataType.UINT16},
                    {name: "imageType", type: DataType.UINT16},
                    {name: "fileVersion", type: DataType.UINT32},
                ],
                required: true,
            },
            queryDeviceSpecificFileRequest: {
                ID: 0x08,
                response: 9,
                parameters: [
                    {name: "eui64", type: DataType.IEEE_ADDR},
                    {name: "manufacturerCode", type: DataType.UINT16},
                    {name: "imageType", type: DataType.UINT16},
                    {name: "fileVersion", type: DataType.UINT32},
                    {name: "zigbeeStackVersion", type: DataType.UINT16},
                ],
            },
        },
        commandsResponse: {
            imageNotify: {
                ID: 0x00,
                parameters: [
                    {name: "payloadType", type: DataType.UINT8},
                    {name: "queryJitter", type: DataType.UINT8},
                    {
                        name: "manufacturerCode",
                        type: DataType.UINT16,
                        conditions: [{type: ParameterCondition.FIELD_GT, field: "payloadType", value: 0x00}],
                    },
                    {name: "imageType", type: DataType.UINT16, conditions: [{type: ParameterCondition.FIELD_GT, field: "payloadType", value: 0x01}]},
                    {
                        name: "fileVersion",
                        type: DataType.UINT32,
                        conditions: [{type: ParameterCondition.FIELD_GT, field: "payloadType", value: 0x02}],
                    },
                ],
            },
            queryNextImageResponse: {
                ID: 0x02,
                parameters: [
                    {name: "status", type: DataType.UINT8},
                    {
                        name: "manufacturerCode",
                        type: DataType.UINT16,
                        conditions: [{type: ParameterCondition.FIELD_EQUAL, field: "status", value: Status.SUCCESS}],
                    },
                    {
                        name: "imageType",
                        type: DataType.UINT16,
                        conditions: [{type: ParameterCondition.FIELD_EQUAL, field: "status", value: Status.SUCCESS}],
                    },
                    {
                        name: "fileVersion",
                        type: DataType.UINT32,
                        conditions: [{type: ParameterCondition.FIELD_EQUAL, field: "status", value: Status.SUCCESS}],
                    },
                    {
                        name: "imageSize",
                        type: DataType.UINT32,
                        conditions: [{type: ParameterCondition.FIELD_EQUAL, field: "status", value: Status.SUCCESS}],
                    },
                ],
                required: true,
            },
            imageBlockResponse: {
                ID: 0x05,
                parameters: [
                    // alone if Status.ABORT
                    {name: "status", type: DataType.UINT8},
                    {
                        name: "manufacturerCode",
                        type: DataType.UINT16,
                        conditions: [{type: ParameterCondition.FIELD_EQUAL, field: "status", value: Status.SUCCESS}],
                    },
                    {
                        name: "imageType",
                        type: DataType.UINT16,
                        conditions: [{type: ParameterCondition.FIELD_EQUAL, field: "status", value: Status.SUCCESS}],
                    },
                    {
                        name: "fileVersion",
                        type: DataType.UINT32,
                        conditions: [{type: ParameterCondition.FIELD_EQUAL, field: "status", value: Status.SUCCESS}],
                    },
                    {
                        name: "fileOffset",
                        type: DataType.UINT32,
                        conditions: [{type: ParameterCondition.FIELD_EQUAL, field: "status", value: Status.SUCCESS}],
                    },
                    {
                        name: "dataSize",
                        type: DataType.UINT8,
                        conditions: [{type: ParameterCondition.FIELD_EQUAL, field: "status", value: Status.SUCCESS}],
                    },
                    {
                        name: "data",
                        type: BuffaloZclDataType.BUFFER,
                        conditions: [{type: ParameterCondition.FIELD_EQUAL, field: "status", value: Status.SUCCESS}],
                    },
                    {
                        name: "currentTime",
                        type: DataType.UINT32,
                        conditions: [{type: ParameterCondition.FIELD_EQUAL, field: "status", value: Status.WAIT_FOR_DATA}],
                    },
                    {
                        name: "requestTime",
                        type: DataType.UINT32,
                        conditions: [{type: ParameterCondition.FIELD_EQUAL, field: "status", value: Status.WAIT_FOR_DATA}],
                    },
                    {
                        name: "minimumBlockPeriod",
                        type: DataType.UINT16,
                        conditions: [{type: ParameterCondition.FIELD_EQUAL, field: "status", value: Status.WAIT_FOR_DATA}],
                    },
                ],
                required: true,
            },
            upgradeEndResponse: {
                ID: 0x07,
                parameters: [
                    {name: "manufacturerCode", type: DataType.UINT16},
                    {name: "imageType", type: DataType.UINT16},
                    {name: "fileVersion", type: DataType.UINT32},
                    {name: "currentTime", type: DataType.UINT32},
                    {name: "upgradeTime", type: DataType.UINT32},
                ],
                required: true,
            },
            queryDeviceSpecificFileResponse: {
                ID: 0x09,
                parameters: [
                    {name: "status", type: DataType.UINT8},
                    {
                        name: "manufacturerCode",
                        type: DataType.UINT16,
                        conditions: [{type: ParameterCondition.FIELD_EQUAL, field: "status", value: Status.SUCCESS}],
                    },
                    {
                        name: "imageType",
                        type: DataType.UINT16,
                        conditions: [{type: ParameterCondition.FIELD_EQUAL, field: "status", value: Status.SUCCESS}],
                    },
                    {
                        name: "fileVersion",
                        type: DataType.UINT32,
                        conditions: [{type: ParameterCondition.FIELD_EQUAL, field: "status", value: Status.SUCCESS}],
                    },
                    {
                        name: "imageSize",
                        type: DataType.UINT32,
                        conditions: [{type: ParameterCondition.FIELD_EQUAL, field: "status", value: Status.SUCCESS}],
                    },
                ],
            },
        },
    },
    pulseWidthModulation: {
        ID: 0x001c,
        attributes: {
            currentLevel: {
                ID: 0x0000,
                type: DataType.UINT8,
                reportRequired: true,
                sceneRequired: true,
                required: true,
                default: 255,
                minRef: "minLevel",
                maxRef: "maxLevel",
            },
            remainingTime: {ID: 0x0001, type: DataType.UINT16, max: 0xffff, default: 0},
            minLevel: {ID: 0x0002, type: DataType.UINT8, default: 0, maxRef: "maxLevel", required: true},
            maxLevel: {ID: 0x0003, type: DataType.UINT8, max: 100, default: 100, minRef: "minLevel", required: true},
            currentFrequency: {
                ID: 0x0004,
                type: DataType.UINT16,
                reportRequired: true,
                sceneRequired: true,
                default: 0,
                minRef: "minFrequency",
                maxRef: "maxFrequency",
                required: true,
            },
            minFrequency: {ID: 0x0005, type: DataType.UINT16, default: 0, maxRef: "maxFrequency", required: true},
            maxFrequency: {ID: 0x0006, type: DataType.UINT16, max: 0xffff, default: 0, minRef: "minFrequency", required: true},
            options: {ID: 0x000f, type: DataType.BITMAP8, writable: true, default: 0},
            onOffTransitionTime: {ID: 0x0010, type: DataType.UINT16, writable: true, max: 0xffff, default: 0},
            onLevel: {ID: 0x0011, type: DataType.UINT8, writable: true, default: 0xff, minRef: "minLevel", maxRef: "maxLevel"},
            onTransitionTime: {ID: 0x0012, type: DataType.UINT16, writable: true, max: 0xfffe, default: 0xffff},
            offTransitionTime: {ID: 0x0013, type: DataType.UINT16, writable: true, max: 0xfffe, default: 0xffff},
            defaultMoveRate: {ID: 0x0014, type: DataType.UINT8, writable: true, max: 0xfe},
            startUpCurrentLevel: {
                ID: 0x4000,
                type: DataType.UINT8,
                writable: true,
                max: 0xff,
                special: [
                    ["MinimumDeviceValuePermitted", "00"],
                    ["SetToPreviousValue", "ff"],
                ],
            },
        },
        commands: {
            moveToLevel: {
                ID: 0x00,
                parameters: [
                    {name: "level", type: DataType.UINT8},
                    {name: "transtime", type: DataType.UINT16},
                    {name: "optionsMask", type: DataType.BITMAP8},
                    {name: "optionsOverride", type: DataType.BITMAP8},
                ],
                required: true,
            },
            move: {
                ID: 0x01,
                parameters: [
                    {name: "movemode", type: DataType.UINT8},
                    {name: "rate", type: DataType.UINT8},
                    {name: "optionsMask", type: DataType.BITMAP8},
                    {name: "optionsOverride", type: DataType.BITMAP8},
                ],
                required: true,
            },
            step: {
                ID: 0x02,
                parameters: [
                    {name: "stepmode", type: DataType.UINT8},
                    {name: "stepsize", type: DataType.UINT8},
                    {name: "transtime", type: DataType.UINT16},
                    {name: "optionsMask", type: DataType.BITMAP8},
                    {name: "optionsOverride", type: DataType.BITMAP8},
                ],
                required: true,
            },
            stop: {
                ID: 0x03,
                parameters: [
                    {name: "optionsMask", type: DataType.BITMAP8},
                    {name: "optionsOverride", type: DataType.BITMAP8},
                ],
                required: true,
            },
            moveToLevelWithOnOff: {
                ID: 0x04,
                parameters: [
                    {name: "level", type: DataType.UINT8},
                    {name: "transtime", type: DataType.UINT16},
                    {name: "optionsMask", type: DataType.BITMAP8},
                    {name: "optionsOverride", type: DataType.BITMAP8},
                ],
                required: true,
            },
            moveWithOnOff: {
                ID: 0x05,
                parameters: [
                    {name: "movemode", type: DataType.UINT8},
                    {name: "rate", type: DataType.UINT8},
                    {name: "optionsMask", type: DataType.BITMAP8},
                    {name: "optionsOverride", type: DataType.BITMAP8},
                ],
                required: true,
            },
            stepWithOnOff: {
                ID: 0x06,
                parameters: [
                    {name: "stepmode", type: DataType.UINT8},
                    {name: "stepsize", type: DataType.UINT8},
                    {name: "transtime", type: DataType.UINT16},
                    {name: "optionsMask", type: DataType.BITMAP8},
                    {name: "optionsOverride", type: DataType.BITMAP8},
                ],
                required: true,
            },
            stopWithOnOff: {
                ID: 0x07,
                parameters: [
                    {name: "optionsMask", type: DataType.BITMAP8},
                    {name: "optionsOverride", type: DataType.BITMAP8},
                ],
                required: true,
            },
            moveToClosestFrequency: {ID: 0x08, parameters: [{name: "frequency", type: DataType.UINT16}], required: true},
        },
        commandsResponse: {},
    },
    genPollCtrl: {
        ID: 0x0020,
        attributes: {
            checkinInterval: {ID: 0x0000, type: DataType.UINT32, writable: true, required: true, max: 7208960, default: 14400},
            longPollInterval: {ID: 0x0001, type: DataType.UINT32, required: true, min: 4, max: 7208960, default: 20},
            shortPollInterval: {ID: 0x0002, type: DataType.UINT16, required: true, min: 1, max: 0xffff, default: 2},
            fastPollTimeout: {ID: 0x0003, type: DataType.UINT16, writable: true, required: true, min: 1, max: 0xffff, default: 40},
            checkinIntervalMin: {ID: 0x0004, type: DataType.UINT32, default: 0},
            longPollIntervalMin: {ID: 0x0005, type: DataType.UINT32, default: 0},
            fastPollTimeoutMax: {ID: 0x0006, type: DataType.UINT16, default: 0},
        },
        commands: {
            checkinRsp: {
                ID: 0x00,
                parameters: [
                    {name: "startFastPolling", type: DataType.BOOLEAN},
                    {name: "fastPollTimeout", type: DataType.UINT16},
                ],
                required: true,
            },
            fastPollStop: {ID: 0x01, parameters: [], required: true},
            setLongPollInterval: {ID: 0x02, parameters: [{name: "newLongPollInterval", type: DataType.UINT32}]},
            setShortPollInterval: {ID: 0x03, parameters: [{name: "newShortPollInterval", type: DataType.UINT16}]},
        },
        commandsResponse: {
            checkin: {
                ID: 0x00,
                parameters: [],
                required: true,
            },
        },
    },
    greenPower: {
        ID: 0x0021,
        attributes: {},
        commands: {
            notification: {
                ID: 0x00,
                parameters: [
                    {name: "options", type: DataType.BITMAP16},
                    {
                        name: "srcID",
                        type: DataType.UINT32,
                        conditions: [{type: ParameterCondition.BITFIELD_ENUM, param: "options", offset: 0, size: 3, value: 0b000}],
                    },
                    {
                        name: "gpdIEEEAddr",
                        type: DataType.IEEE_ADDR,
                        conditions: [{type: ParameterCondition.BITFIELD_ENUM, param: "options", offset: 0, size: 3, value: 0b010}],
                    },
                    {
                        name: "gpdEndpoint",
                        type: DataType.UINT8,
                        conditions: [{type: ParameterCondition.BITFIELD_ENUM, param: "options", offset: 0, size: 3, value: 0b010}],
                    },
                    {name: "frameCounter", type: DataType.UINT32},
                    {name: "commandID", type: DataType.UINT8},
                    {name: "payloadSize", type: DataType.UINT8},
                    {
                        name: "commandFrame",
                        type: BuffaloZclDataType.GPD_FRAME,
                        // not parsing when FULLENCR (requires decryption first - then re-parsing)
                        conditions: [{type: ParameterCondition.BITMASK_SET, param: "options", mask: 0xc0, reversed: true}],
                    },
                    {name: "gppNwkAddr", type: DataType.UINT16, conditions: [{type: ParameterCondition.BITMASK_SET, param: "options", mask: 0x4000}]},
                    /** Bits: 0..5 RSSI 6..7 Link quality */
                    {
                        name: "gppGpdLink",
                        type: DataType.BITMAP8,
                        conditions: [{type: ParameterCondition.BITMASK_SET, param: "options", mask: 0x4000}],
                    },
                ],
            },
            commissioningNotification: {
                ID: 0x04,
                parameters: [
                    {name: "options", type: DataType.BITMAP16},
                    {
                        name: "srcID",
                        type: DataType.UINT32,
                        conditions: [{type: ParameterCondition.BITFIELD_ENUM, param: "options", offset: 0, size: 3, value: 0b000}],
                    },
                    {
                        name: "gpdIEEEAddr",
                        type: DataType.IEEE_ADDR,
                        conditions: [{type: ParameterCondition.BITFIELD_ENUM, param: "options", offset: 0, size: 3, value: 0b010}],
                    },
                    {
                        name: "gpdEndpoint",
                        type: DataType.UINT8,
                        conditions: [{type: ParameterCondition.BITFIELD_ENUM, param: "options", offset: 0, size: 3, value: 0b010}],
                    },
                    {name: "frameCounter", type: DataType.UINT32},
                    {name: "commandID", type: DataType.UINT8},
                    {name: "payloadSize", type: DataType.UINT8},
                    {
                        name: "commandFrame",
                        type: BuffaloZclDataType.GPD_FRAME,
                        conditions: [
                            // not parsing when FULLENCR and "security failed" bit is set (requires decryption first - then re-parsing)
                            {type: ParameterCondition.BITMASK_SET, param: "options", mask: 0x30, reversed: true},
                            {type: ParameterCondition.BITMASK_SET, param: "options", mask: 0x200, reversed: true},
                        ],
                    },
                    {name: "gppNwkAddr", type: DataType.UINT16, conditions: [{type: ParameterCondition.BITMASK_SET, param: "options", mask: 0x800}]},
                    /** Bits: 0..5 RSSI 6..7 Link quality */
                    {name: "gppGpdLink", type: DataType.BITMAP8, conditions: [{type: ParameterCondition.BITMASK_SET, param: "options", mask: 0x800}]},
                    {name: "mic", type: DataType.UINT32, conditions: [{type: ParameterCondition.BITMASK_SET, param: "options", mask: 0x200}]},
                ],
            },
        },
        commandsResponse: {
            response: {
                ID: 0x06,
                parameters: [
                    {name: "options", type: DataType.UINT8},
                    {name: "tempMaster", type: DataType.UINT16},
                    {name: "tempMasterTx", type: DataType.BITMAP8},
                    {
                        name: "srcID",
                        type: DataType.UINT32,
                        conditions: [{type: ParameterCondition.BITFIELD_ENUM, param: "options", offset: 0, size: 3, value: 0b000}],
                    },
                    {
                        name: "gpdIEEEAddr",
                        type: DataType.IEEE_ADDR,
                        conditions: [{type: ParameterCondition.BITFIELD_ENUM, param: "options", offset: 0, size: 3, value: 0b010}],
                    },
                    {
                        name: "gpdEndpoint",
                        type: DataType.UINT8,
                        conditions: [{type: ParameterCondition.BITFIELD_ENUM, param: "options", offset: 0, size: 3, value: 0b010}],
                    },
                    {name: "gpdCmd", type: DataType.UINT8},
                    {name: "gpdPayload", type: BuffaloZclDataType.GPD_FRAME},
                ],
            },
            pairing: {
                ID: 0x01,
                parameters: [
                    {name: "options", type: DataType.BITMAP24},
                    {
                        name: "srcID",
                        type: DataType.UINT32,
                        conditions: [{type: ParameterCondition.BITFIELD_ENUM, param: "options", offset: 0, size: 3, value: 0b000}],
                    },
                    {
                        name: "gpdIEEEAddr",
                        type: DataType.IEEE_ADDR,
                        conditions: [{type: ParameterCondition.BITFIELD_ENUM, param: "options", offset: 0, size: 3, value: 0b010}],
                    },
                    {
                        name: "gpdEndpoint",
                        type: DataType.UINT8,
                        conditions: [{type: ParameterCondition.BITFIELD_ENUM, param: "options", offset: 0, size: 3, value: 0b010}],
                    },
                    {
                        name: "sinkIEEEAddr",
                        type: DataType.IEEE_ADDR,
                        conditions: [{type: ParameterCondition.BITFIELD_ENUM, param: "options", offset: 4, size: 3, value: 0b110}],
                    },
                    {
                        name: "sinkIEEEAddr",
                        type: DataType.IEEE_ADDR,
                        conditions: [{type: ParameterCondition.BITFIELD_ENUM, param: "options", offset: 4, size: 3, value: 0b000}],
                    },
                    {
                        name: "sinkNwkAddr",
                        type: DataType.UINT16,
                        conditions: [{type: ParameterCondition.BITFIELD_ENUM, param: "options", offset: 4, size: 3, value: 0b110}],
                    },
                    {
                        name: "sinkNwkAddr",
                        type: DataType.UINT16,
                        conditions: [{type: ParameterCondition.BITFIELD_ENUM, param: "options", offset: 4, size: 3, value: 0b000}],
                    },
                    {
                        name: "sinkGroupID",
                        type: DataType.UINT16,
                        conditions: [{type: ParameterCondition.BITFIELD_ENUM, param: "options", offset: 4, size: 3, value: 0b100}],
                    },
                    {
                        name: "sinkGroupID",
                        type: DataType.UINT16,
                        conditions: [{type: ParameterCondition.BITFIELD_ENUM, param: "options", offset: 4, size: 3, value: 0b010}],
                    },
                    {name: "deviceID", type: DataType.UINT8, conditions: [{type: ParameterCondition.BITMASK_SET, param: "options", mask: 0x0008}]},
                    {
                        name: "frameCounter",
                        type: DataType.UINT32,
                        conditions: [{type: ParameterCondition.BITMASK_SET, param: "options", mask: 0x4000}],
                    },
                    {name: "gpdKey", type: DataType.SEC_KEY, conditions: [{type: ParameterCondition.BITMASK_SET, param: "options", mask: 0x8000}]},
                    {
                        name: "assignedAlias",
                        type: DataType.UINT16,
                        conditions: [{type: ParameterCondition.BITMASK_SET, param: "options", mask: 0x10000}],
                    },
                    {
                        name: "groupcastRadius",
                        type: DataType.UINT8,
                        conditions: [{type: ParameterCondition.BITMASK_SET, param: "options", mask: 0x20000}],
                    },
                ],
            },
            commisioningMode: {
                ID: 0x02,
                parameters: [
                    {name: "options", type: DataType.BITMAP8},
                    {
                        name: "commisioningWindow",
                        type: DataType.UINT16,
                        conditions: [{type: ParameterCondition.BITMASK_SET, param: "options", mask: 0x2}],
                    },
                    {name: "channel", type: DataType.UINT8, conditions: [{type: ParameterCondition.BITMASK_SET, param: "options", mask: 0x10}]},
                ],
            },
        },
    },
    mobileDeviceCfg: {
        ID: 0x0022,
        attributes: {
            keepAliveTime: {ID: 0x0000, type: DataType.UINT16},
            rejoinTimeout: {ID: 0x0001, type: DataType.UINT16},
        },
        commands: {},
        commandsResponse: {},
    },
    neighborCleaning: {
        ID: 0x0023,
        attributes: {
            neighborCleaningTimeout: {ID: 0x0000, type: DataType.UINT16},
        },
        commands: {},
        commandsResponse: {},
    },
    nearestGateway: {
        ID: 0x0024,
        attributes: {
            nearestGateway: {ID: 0x0000, type: DataType.UINT16},
            newMobileNode: {ID: 0x0001, type: DataType.UINT16},
        },
        commands: {},
        commandsResponse: {},
    },
    closuresShadeCfg: {
        ID: 0x0100,
        attributes: {
            physicalClosedLimit: {ID: 0x0000, type: DataType.UINT16, min: 1},
            motorStepSize: {ID: 0x0001, type: DataType.UINT8, max: 254},
            status: {ID: 0x0002, type: DataType.BITMAP8, writable: true, required: true, default: 0},
            losedLimit: {ID: 0x0010, type: DataType.UINT16, writable: true, required: true, min: 1, default: 1},
            mode: {ID: 0x0011, type: DataType.ENUM8, writable: true, required: true, default: 0},
        },
        commands: {},
        commandsResponse: {},
    },
    closuresDoorLock: {
        ID: 0x0101,
        attributes: {
            lockState: {ID: 0x0000, type: DataType.ENUM8, reportRequired: true, required: true},
            lockType: {ID: 0x0001, type: DataType.BITMAP16, required: true},
            actuatorEnabled: {ID: 0x0002, type: DataType.BOOLEAN, required: true},
            doorState: {ID: 0x0003, type: DataType.ENUM8, reportRequired: true},
            doorOpenEvents: {ID: 0x0004, type: DataType.UINT32, writable: true},
            doorClosedEvents: {ID: 0x0005, type: DataType.UINT32, writable: true},
            openPeriod: {ID: 0x0006, type: DataType.UINT16, writable: true},
            numOfLockRecordsSupported: {ID: 0x0010, type: DataType.UINT16, default: 0},
            numOfTotalUsersSupported: {ID: 0x0011, type: DataType.UINT16, default: 0},
            numOfPinUsersSupported: {ID: 0x0012, type: DataType.UINT16, default: 0},
            numOfRfidUsersSupported: {ID: 0x0013, type: DataType.UINT16, default: 0},
            numOfWeekDaySchedulesSupportedPerUser: {ID: 0x0014, type: DataType.UINT8, default: 0},
            numOfYearDaySchedulesSupportedPerUser: {ID: 0x0015, type: DataType.UINT8, default: 0},
            numOfHolidayScheduledsSupported: {ID: 0x0016, type: DataType.UINT8, default: 0},
            maxPinLen: {ID: 0x0017, type: DataType.UINT8, default: 8},
            minPinLen: {ID: 0x0018, type: DataType.UINT8, default: 4},
            maxRfidLen: {ID: 0x0019, type: DataType.UINT8, default: 20},
            minRfidLen: {ID: 0x001a, type: DataType.UINT8, default: 8},
            enableLogging: {ID: 0x0020, type: DataType.BOOLEAN, writable: true, writeOptional: true, reportRequired: true, default: 0},
            language: {ID: 0x0021, type: DataType.CHAR_STR, writable: true, writeOptional: true, reportRequired: true, default: "", length: 2},
            ledSettings: {ID: 0x0022, type: DataType.UINT8, writable: true, writeOptional: true, reportRequired: true, default: 0},
            autoRelockTime: {
                ID: 0x0023,
                type: DataType.UINT32,
                writable: true,
                writeOptional: true,
                reportRequired: true,
                default: 0,
                special: [["Disabled", "0"]],
            },
            soundVolume: {ID: 0x0024, type: DataType.UINT8, writable: true, writeOptional: true, reportRequired: true, default: 0},
            operatingMode: {ID: 0x0025, type: DataType.UINT32, writable: true, writeOptional: true, reportRequired: true, default: 0},
            supportedOperatingModes: {ID: 0x0026, type: DataType.BITMAP16, default: 1},
            defaultConfigurationRegister: {ID: 0x0027, type: DataType.BITMAP16, reportRequired: true, default: 0},
            enableLocalProgramming: {ID: 0x0028, type: DataType.BOOLEAN, writable: true, writeOptional: true, reportRequired: true, default: 1},
            enableOneTouchLocking: {ID: 0x0029, type: DataType.BOOLEAN, writable: true, reportRequired: true, default: 0},
            enableInsideStatusLed: {ID: 0x002a, type: DataType.BOOLEAN, writable: true, reportRequired: true, default: 0},
            enablePrivacyModeButton: {ID: 0x002b, type: DataType.BOOLEAN, writable: true, reportRequired: true, default: 0},
            wrongCodeEntryLimit: {ID: 0x0030, type: DataType.UINT8, writable: true, writeOptional: true, reportRequired: true, default: 0},
            userCodeTemporaryDisableTime: {ID: 0x0031, type: DataType.UINT8, writable: true, writeOptional: true, reportRequired: true, default: 0},
            sendPinOta: {ID: 0x0032, type: DataType.BOOLEAN, writable: true, writeOptional: true, reportRequired: true, default: 0},
            requirePinForRfOperation: {ID: 0x0033, type: DataType.BOOLEAN, writable: true, writeOptional: true, reportRequired: true, default: 0},
            zigbeeSecurityLevel: {ID: 0x0034, type: DataType.UINT8, reportRequired: true, default: 0},
            alarmMask: {ID: 0x0040, type: DataType.BITMAP16, writable: true, reportRequired: true, default: 0},
            keypadOperationEventMask: {ID: 0x0041, type: DataType.BITMAP16, writable: true, reportRequired: true, default: 0},
            rfOperationEventMask: {ID: 0x0042, type: DataType.BITMAP16, writable: true, reportRequired: true, default: 0},
            manualOperationEventMask: {ID: 0x0043, type: DataType.BITMAP16, writable: true, reportRequired: true, default: 0},
            rfidOperationEventMask: {ID: 0x0044, type: DataType.BITMAP16, writable: true, reportRequired: true, default: 0},
            keypadProgrammingEventMask: {ID: 0x0045, type: DataType.BITMAP16, writable: true, reportRequired: true, default: 0},
            rfProgrammingEventMask: {ID: 0x0046, type: DataType.BITMAP16, writable: true, reportRequired: true, default: 0},
            rfidProgrammingEventMask: {ID: 0x0047, type: DataType.BITMAP16, writable: true, reportRequired: true, default: 0},
        },
        commands: {
            lockDoor: {ID: 0x00, response: 0, parameters: [{name: "pincodevalue", type: DataType.CHAR_STR}], required: true},
            unlockDoor: {ID: 0x01, response: 1, parameters: [{name: "pincodevalue", type: DataType.CHAR_STR}], required: true},
            toggleDoor: {ID: 0x02, response: 2, parameters: [{name: "pincodevalue", type: DataType.CHAR_STR}]},
            unlockWithTimeout: {
                ID: 0x03,
                response: 3,
                parameters: [
                    {name: "timeout", type: DataType.UINT16},
                    {name: "pincodevalue", type: DataType.CHAR_STR},
                ],
            },
            getLogRecord: {ID: 0x04, response: 4, parameters: [{name: "logindex", type: DataType.UINT16, special: [["MostRecent", "0"]]}]},
            setPinCode: {
                ID: 0x05,
                response: 5,
                parameters: [
                    {name: "userid", type: DataType.UINT16},
                    {name: "userstatus", type: DataType.UINT8},
                    {name: "usertype", type: DataType.UINT8},
                    {name: "pincodevalue", type: DataType.CHAR_STR},
                ],
            },
            getPinCode: {ID: 0x06, response: 6, parameters: [{name: "userid", type: DataType.UINT16}]},
            clearPinCode: {ID: 0x07, response: 7, parameters: [{name: "userid", type: DataType.UINT16}]},
            clearAllPinCodes: {ID: 0x08, response: 8, parameters: []},
            setUserStatus: {
                ID: 0x09,
                response: 9,
                parameters: [
                    {name: "userid", type: DataType.UINT16},
                    {name: "userstatus", type: DataType.UINT8},
                ],
            },
            getUserStatus: {ID: 0x0a, response: 10, parameters: [{name: "userid", type: DataType.UINT16}]},
            setWeekDaySchedule: {
                ID: 0x0b,
                response: 11,
                parameters: [
                    {name: "scheduleid", type: DataType.UINT8},
                    {name: "userid", type: DataType.UINT16},
                    {name: "daysmask", type: DataType.UINT8},
                    {name: "starthour", type: DataType.UINT8, min: 0, max: 23},
                    {name: "startminute", type: DataType.UINT8, min: 0, max: 59},
                    {name: "endhour", type: DataType.UINT8, min: 0, max: 23},
                    {name: "endminute", type: DataType.UINT8, min: 0, max: 59},
                ],
            },
            getWeekDaySchedule: {
                ID: 0x0c,
                response: 12,
                parameters: [
                    {name: "scheduleid", type: DataType.UINT8},
                    {name: "userid", type: DataType.UINT16},
                ],
            },
            clearWeekDaySchedule: {
                ID: 0x0d,
                response: 13,
                parameters: [
                    {name: "scheduleid", type: DataType.UINT8},
                    {name: "userid", type: DataType.UINT16},
                ],
            },
            setYearDaySchedule: {
                ID: 0x0e,
                response: 14,
                parameters: [
                    {name: "scheduleid", type: DataType.UINT8},
                    {name: "userid", type: DataType.UINT16},
                    {name: "zigbeelocalstarttime", type: DataType.UINT32},
                    {name: "zigbeelocalendtime", type: DataType.UINT32, minExclRef: "zigbeelocalstarttime"},
                ],
            },
            getYearDaySchedule: {
                ID: 0x0f,
                response: 15,
                parameters: [
                    {name: "scheduleid", type: DataType.UINT8},
                    {name: "userid", type: DataType.UINT16},
                ],
            },
            clearYearDaySchedule: {
                ID: 0x10,
                response: 16,
                parameters: [
                    {name: "scheduleid", type: DataType.UINT8},
                    {name: "userid", type: DataType.UINT16},
                ],
            },
            setHolidaySchedule: {
                ID: 0x11,
                response: 17,
                parameters: [
                    {name: "holidayscheduleid", type: DataType.UINT8},
                    {name: "zigbeelocalstarttime", type: DataType.UINT32},
                    {name: "zigbeelocalendtime", type: DataType.UINT32, minExclRef: "zigbeelocalstarttime"},
                    {name: "opermodelduringholiday", type: DataType.UINT8},
                ],
            },
            getHolidaySchedule: {ID: 0x12, response: 18, parameters: [{name: "holidayscheduleid", type: DataType.UINT8}]},
            clearHolidaySchedule: {ID: 0x13, response: 19, parameters: [{name: "holidayscheduleid", type: DataType.UINT8}]},
            setUserType: {
                ID: 0x14,
                response: 20,
                parameters: [
                    {name: "userid", type: DataType.UINT16},
                    {name: "usertype", type: DataType.UINT8},
                ],
            },
            getUserType: {ID: 0x15, response: 21, parameters: [{name: "userid", type: DataType.UINT16}]},
            setRfidCode: {
                ID: 0x16,
                response: 22,
                parameters: [
                    {name: "userid", type: DataType.UINT16},
                    {name: "userstatus", type: DataType.UINT8},
                    {name: "usertype", type: DataType.UINT8},
                    {name: "pincodevalue", type: DataType.CHAR_STR},
                ],
            },
            getRfidCode: {ID: 0x17, response: 23, parameters: [{name: "userid", type: DataType.UINT16}]},
            clearRfidCode: {ID: 0x18, response: 24, parameters: [{name: "userid", type: DataType.UINT16}]},
            clearAllRfidCodes: {ID: 0x19, response: 25, parameters: []},
        },
        commandsResponse: {
            lockDoorRsp: {ID: 0x00, parameters: [{name: "status", type: DataType.UINT8}], required: true},
            unlockDoorRsp: {ID: 0x01, parameters: [{name: "status", type: DataType.UINT8}], required: true},
            toggleDoorRsp: {ID: 0x02, parameters: [{name: "status", type: DataType.UINT8}]},
            unlockWithTimeoutRsp: {ID: 0x03, parameters: [{name: "status", type: DataType.UINT8}]},
            getLogRecordRsp: {
                ID: 0x04,
                parameters: [
                    {name: "logentryid", type: DataType.UINT16},
                    {name: "timestamp", type: DataType.UINT32},
                    {name: "eventtype", type: DataType.UINT8},
                    {name: "source", type: DataType.UINT8},
                    {name: "eventidalarmcode", type: DataType.UINT8},
                    {name: "userid", type: DataType.UINT16},
                    {name: "pincodevalue", type: DataType.CHAR_STR},
                ],
            },
            setPinCodeRsp: {ID: 0x05, parameters: [{name: "status", type: DataType.UINT8}]},
            getPinCodeRsp: {
                ID: 0x06,
                parameters: [
                    {name: "userid", type: DataType.UINT16},
                    {name: "userstatus", type: DataType.UINT8},
                    {name: "usertype", type: DataType.UINT8},
                    {name: "pincodevalue", type: DataType.CHAR_STR},
                ],
            },
            clearPinCodeRsp: {ID: 0x07, parameters: [{name: "status", type: DataType.UINT8}]},
            clearAllPinCodesRsp: {ID: 0x08, parameters: [{name: "status", type: DataType.UINT8}]},
            setUserStatusRsp: {ID: 0x09, parameters: [{name: "status", type: DataType.UINT8}]},
            getUserStatusRsp: {
                ID: 0x0a,
                parameters: [
                    {name: "userid", type: DataType.UINT16},
                    {name: "userstatus", type: DataType.UINT8},
                ],
            },
            setWeekDayScheduleRsp: {ID: 0x0b, parameters: [{name: "status", type: DataType.UINT8}]},
            getWeekDayScheduleRsp: {
                ID: 0x0c,
                parameters: [
                    {name: "scheduleid", type: DataType.UINT8},
                    {name: "userid", type: DataType.UINT16},
                    {name: "status", type: DataType.UINT8},
                    {name: "daysmask", type: DataType.UINT8},
                    {name: "starthour", type: DataType.UINT8, min: 0, max: 23},
                    {name: "startminute", type: DataType.UINT8, min: 0, max: 59},
                    {name: "endhour", type: DataType.UINT8, min: 0, max: 23},
                    {name: "endminute", type: DataType.UINT8, min: 0, max: 59},
                ],
            },
            clearWeekDayScheduleRsp: {ID: 0x0d, parameters: [{name: "status", type: DataType.UINT8}]},
            setYearDayScheduleRsp: {ID: 0x0e, parameters: [{name: "status", type: DataType.UINT8}]},
            getYearDayScheduleRsp: {
                ID: 0x0f,
                parameters: [
                    {name: "scheduleid", type: DataType.UINT8},
                    {name: "userid", type: DataType.UINT16},
                    {name: "status", type: DataType.UINT8},
                    {name: "zigbeelocalstarttime", type: DataType.UINT32},
                    {name: "zigbeelocalendtime", type: DataType.UINT32, minExclRef: "zigbeelocalstarttime"},
                ],
            },
            clearYearDayScheduleRsp: {ID: 0x10, parameters: [{name: "status", type: DataType.UINT8}]},
            setHolidayScheduleRsp: {ID: 0x11, parameters: [{name: "status", type: DataType.UINT8}]},
            getHolidayScheduleRsp: {
                ID: 0x12,
                parameters: [
                    {name: "holidayscheduleid", type: DataType.UINT8},
                    {name: "status", type: DataType.UINT8},
                    {name: "zigbeelocalstarttime", type: DataType.UINT32},
                    {name: "zigbeelocalendtime", type: DataType.UINT32, minExclRef: "zigbeelocalstarttime"},
                    {name: "opermodelduringholiday", type: DataType.UINT8},
                ],
            },
            clearHolidayScheduleRsp: {ID: 0x13, parameters: [{name: "status", type: DataType.UINT8}]},
            setUserTypeRsp: {ID: 0x14, parameters: [{name: "status", type: DataType.UINT8}]},
            getUserTypeRsp: {
                ID: 0x15,
                parameters: [
                    {name: "userid", type: DataType.UINT16},
                    {name: "usertype", type: DataType.UINT8},
                ],
            },
            setRfidCodeRsp: {ID: 0x16, parameters: [{name: "status", type: DataType.UINT8}]},
            getRfidCodeRsp: {
                ID: 0x17,
                parameters: [
                    {name: "userid", type: DataType.UINT16},
                    {name: "userstatus", type: DataType.UINT8},
                    {name: "usertype", type: DataType.UINT8},
                    {name: "pincodevalue", type: DataType.CHAR_STR},
                ],
            },
            clearRfidCodeRsp: {ID: 0x18, parameters: [{name: "status", type: DataType.UINT8}]},
            clearAllRfidCodesRsp: {ID: 0x19, parameters: [{name: "status", type: DataType.UINT8}]},
            operationEventNotification: {
                ID: 0x20,
                parameters: [
                    {name: "opereventsrc", type: DataType.UINT8},
                    {name: "opereventcode", type: DataType.UINT8},
                    {name: "userid", type: DataType.UINT16},
                    {name: "pin", type: DataType.OCTET_STR},
                    {name: "zigbeelocaltime", type: DataType.UINT32},
                    {name: "data", type: DataType.UINT8},
                ],
            },
            programmingEventNotification: {
                ID: 0x21,
                parameters: [
                    {name: "programeventsrc", type: DataType.UINT8},
                    {name: "programeventcode", type: DataType.UINT8},
                    {name: "userid", type: DataType.UINT16},
                    {name: "pin", type: DataType.OCTET_STR},
                    {name: "usertype", type: DataType.UINT8},
                    {name: "userstatus", type: DataType.UINT8},
                    {name: "zigbeelocaltime", type: DataType.UINT32},
                    {name: "data", type: DataType.UINT8},
                ],
            },
        },
    },
    closuresWindowCovering: {
        ID: 0x0102,
        attributes: {
            windowCoveringType: {ID: 0x0000, type: DataType.ENUM8, required: true, default: 0},
            physicalClosedLimitLiftCm: {ID: 0x0001, type: DataType.UINT16, default: 0},
            physicalClosedLimitTiltDdegree: {ID: 0x0002, type: DataType.UINT16, default: 0},
            currentPositionLiftCm: {ID: 0x0003, type: DataType.UINT16, default: 0},
            currentPositionTiltDdegree: {ID: 0x0004, type: DataType.UINT16, default: 0},
            numOfActuationsLift: {ID: 0x0005, type: DataType.UINT16, default: 0},
            numOfActuationsTilt: {ID: 0x0006, type: DataType.UINT16, default: 0},
            configStatus: {ID: 0x0007, type: DataType.BITMAP8, required: true, default: 3},
            currentPositionLiftPercentage: {ID: 0x0008, type: DataType.UINT8, reportRequired: true, sceneRequired: true, max: 100, default: 0},
            currentPositionTiltPercentage: {ID: 0x0009, type: DataType.UINT8, reportRequired: true, sceneRequired: true, max: 100, default: 0},
            operationalStatus: {ID: 0x000a, type: DataType.BITMAP8},
            installedOpenLimitLiftCm: {ID: 0x0010, type: DataType.UINT16, default: 0},
            installedClosedLimitLiftCm: {ID: 0x0011, type: DataType.UINT16, default: 65535},
            installedOpenLimitTiltDdegree: {ID: 0x0012, type: DataType.UINT16, default: 0},
            installedClosedLimitTiltDdegree: {ID: 0x0013, type: DataType.UINT16, default: 65535},
            velocityLift: {ID: 0x0014, type: DataType.UINT16, writable: true, default: 0},
            accelerationTimeLift: {ID: 0x0015, type: DataType.UINT16, writable: true, default: 0},
            decelerationTimeLift: {ID: 0x0016, type: DataType.UINT16, writable: true, default: 0},
            windowCoveringMode: {ID: 0x0017, type: DataType.BITMAP8, required: true, default: 4},
            intermediateSetpointsLift: {ID: 0x0018, type: DataType.OCTET_STR, default: "1,0x0000"},
            intermediateSetpointsTilt: {ID: 0x0019, type: DataType.OCTET_STR, default: "1,0x0000"},
            elkoDriveCloseDuration: {ID: 0xe000, type: DataType.UINT16, manufacturerCode: ManufacturerCode.ADEO},
            elkoProtectionStatus: {ID: 0xe010, type: DataType.BITMAP8, manufacturerCode: ManufacturerCode.ADEO},
            elkoSunProtectionIlluminanceThreshold: {ID: 0xe012, type: DataType.UINT16, manufacturerCode: ManufacturerCode.ADEO},
            elkoProtectionSensor: {ID: 0xe013, type: DataType.BITMAP8, manufacturerCode: ManufacturerCode.ADEO},
            elkoLiftDriveUpTime: {ID: 0xe014, type: DataType.UINT16, manufacturerCode: ManufacturerCode.ADEO},
            elkoLiftDriveDownTime: {ID: 0xe015, type: DataType.UINT16, manufacturerCode: ManufacturerCode.ADEO},
            elkoTiltOpenCloseAndStepTime: {ID: 0xe016, type: DataType.UINT16, manufacturerCode: ManufacturerCode.ADEO},
            elkoTiltPositionPercentageAfterMoveToLevel: {ID: 0xe017, type: DataType.UINT8, manufacturerCode: ManufacturerCode.ADEO},
            tuyaMovingState: {ID: 0xf000, type: DataType.ENUM8},
            tuyaCalibration: {ID: 0xf001, type: DataType.ENUM8},
            stepPositionLift: {ID: 0xf001, type: DataType.ENUM8, manufacturerCode: ManufacturerCode.LEGRAND_GROUP},
            tuyaMotorReversal: {ID: 0xf002, type: DataType.ENUM8},
            calibrationMode: {ID: 0xf002, type: DataType.ENUM8, manufacturerCode: ManufacturerCode.LEGRAND_GROUP},
            moesCalibrationTime: {ID: 0xf003, type: DataType.UINT16},
            targetPositionTiltPercentage: {ID: 0xf003, type: DataType.ENUM8, manufacturerCode: ManufacturerCode.LEGRAND_GROUP},
            stepPositionTilt: {ID: 0xf004, type: DataType.ENUM8, manufacturerCode: ManufacturerCode.LEGRAND_GROUP},
            nikoCalibrationTimeUp: {ID: 0xfcc1, type: DataType.UINT16, manufacturerCode: ManufacturerCode.NIKO_NV},
            nikoCalibrationTimeDown: {ID: 0xfcc2, type: DataType.UINT16, manufacturerCode: ManufacturerCode.NIKO_NV},
        },
        commands: {
            upOpen: {ID: 0x00, parameters: [], required: true},
            downClose: {ID: 0x01, parameters: [], required: true},
            stop: {ID: 0x02, parameters: [], required: true},
            goToLiftValue: {
                ID: 0x04,
                parameters: [
                    {
                        name: "liftvalue",
                        type: DataType.UINT16,
                        minRef: "installedClosedLimitLiftCm",
                        maxRef: "installedOpenLimitLiftCm",
                    },
                ],
            },
            goToLiftPercentage: {ID: 0x05, parameters: [{name: "percentageliftvalue", type: DataType.UINT8, max: 100}]},
            goToTiltValue: {
                ID: 0x07,
                parameters: [
                    {
                        name: "tiltvalue",
                        type: DataType.UINT16,
                        minRef: "installedClosedLimitTiltDdegree",
                        maxRef: "installedOpenLimitTiltDdegree",
                    },
                ],
            },
            goToTiltPercentage: {ID: 0x08, parameters: [{name: "percentagetiltvalue", type: DataType.UINT8, max: 100}]},
            elkoStopOrStepLiftPercentage: {
                ID: 0x80,
                parameters: [
                    {name: "direction", type: DataType.UINT16},
                    {name: "stepvalue", type: DataType.UINT16},
                ],
            },
        },
        commandsResponse: {},
    },
    barrierControl: {
        ID: 0x0103,
        attributes: {
            movingState: {ID: 0x0001, type: DataType.ENUM8, reportRequired: true, required: true},
            safetyStatus: {ID: 0x0002, type: DataType.BITMAP16, reportRequired: true, required: true},
            capabilities: {ID: 0x0003, type: DataType.BITMAP8, required: true},
            openEvents: {ID: 0x0004, type: DataType.UINT16, writable: true, default: 0},
            closeEvents: {ID: 0x0005, type: DataType.UINT16, writable: true, default: 0},
            commandOpenEvents: {ID: 0x0006, type: DataType.UINT16, writable: true, default: 0},
            commandCloseEvents: {ID: 0x0007, type: DataType.UINT16, writable: true, default: 0},
            openPeriod: {ID: 0x0008, type: DataType.UINT16, writable: true},
            closePeriod: {ID: 0x0009, type: DataType.UINT16, writable: true},
            barrierPosition: {
                ID: 0x000a,
                type: DataType.UINT8,
                reportRequired: true,
                sceneRequired: true,
                required: true,
                max: 100,
                special: [["PositionUnknown", "FF"]],
            },
        },
        commands: {
            goToPercent: {ID: 0x00, parameters: [{name: "percentOpen", type: DataType.UINT8, min: 0, max: 100}], required: true},
            stop: {ID: 0x01, parameters: [], required: true},
        },
        commandsResponse: {},
    },
    hvacPumpCfgCtrl: {
        ID: 0x0200,
        attributes: {
            maxPressure: {ID: 0x0000, type: DataType.INT16, required: true, min: -32767, max: 32767},
            maxSpeed: {ID: 0x0001, type: DataType.UINT16, required: true, max: 65534},
            maxFlow: {ID: 0x0002, type: DataType.UINT16, required: true, max: 65534},
            minConstPressure: {ID: 0x0003, type: DataType.INT16, min: -32767, max: 32767},
            maxConstPressure: {ID: 0x0004, type: DataType.INT16, min: -32767, max: 32767},
            minCompPressure: {ID: 0x0005, type: DataType.INT16, min: -32767, max: 32767},
            maxCompPressure: {ID: 0x0006, type: DataType.INT16, min: -32767, max: 32767},
            minConstSpeed: {ID: 0x0007, type: DataType.UINT16, max: 65534},
            maxConstSpeed: {ID: 0x0008, type: DataType.UINT16, max: 65534},
            minConstFlow: {ID: 0x0009, type: DataType.UINT16, max: 65534},
            maxConstFlow: {ID: 0x000a, type: DataType.UINT16, max: 65534},
            minConstTemp: {ID: 0x000b, type: DataType.INT16, min: -27315, max: 32767},
            maxConstTemp: {ID: 0x000c, type: DataType.INT16, min: -27315, max: 32767},
            pumpStatus: {ID: 0x0010, type: DataType.BITMAP16},
            effectiveOperationMode: {ID: 0x0011, type: DataType.ENUM8, required: true},
            effectiveControlMode: {ID: 0x0012, type: DataType.ENUM8, required: true},
            capacity: {ID: 0x0013, type: DataType.INT16, reportRequired: true, required: true, min: 0, max: 32767},
            speed: {ID: 0x0014, type: DataType.UINT16, max: 65534},
            lifetimeRunningHours: {ID: 0x0015, type: DataType.UINT24, writable: true, max: 16777214, default: 0},
            power: {ID: 0x0016, type: DataType.UINT24, writable: true, max: 16777214},
            lifetimeEnergyConsumed: {ID: 0x0017, type: DataType.UINT32, max: 4294967294, default: 0},
            operationMode: {ID: 0x0020, type: DataType.ENUM8, writable: true, required: true, default: 0},
            controlMode: {ID: 0x0021, type: DataType.ENUM8, writable: true, default: 0},
            alarmMask: {ID: 0x0022, type: DataType.BITMAP16},
        },
        commands: {},
        commandsResponse: {},
    },
    hvacThermostat: {
        ID: 0x0201,
        attributes: {
            localTemp: {ID: 0x0000, type: DataType.INT16, reportRequired: true, required: true, min: -27315, max: 32767},
            outdoorTemp: {ID: 0x0001, type: DataType.INT16, min: -27315, max: 32767},
            occupancy: {ID: 0x0002, type: DataType.BITMAP8, default: 0},
            absMinHeatSetpointLimit: {ID: 0x0003, type: DataType.INT16, min: -27315, max: 32767, default: 700},
            absMaxHeatSetpointLimit: {ID: 0x0004, type: DataType.INT16, min: -27315, max: 32767, default: 3000},
            absMinCoolSetpointLimit: {ID: 0x0005, type: DataType.INT16, min: -27315, max: 32767, default: 1600},
            absMaxCoolSetpointLimit: {ID: 0x0006, type: DataType.INT16, min: -27315, max: 32767, default: 3200},
            pICoolingDemand: {ID: 0x0007, type: DataType.UINT8, reportRequired: true, max: 100},
            pIHeatingDemand: {ID: 0x0008, type: DataType.UINT8, reportRequired: true, max: 100},
            systemTypeConfig: {ID: 0x0009, type: DataType.BITMAP8, writable: true, default: 0},
            localTemperatureCalibration: {ID: 0x0010, type: DataType.INT8, writable: true, min: -25, max: 25, default: 0},
            occupiedCoolingSetpoint: {
                ID: 0x0011,
                type: DataType.INT16,
                writable: true,
                sceneRequired: true,
                default: 2600,
                minRef: "minCoolSetpointLimit",
                maxRef: "maxCoolSetpointLimit",
            },
            occupiedHeatingSetpoint: {
                ID: 0x0012,
                type: DataType.INT16,
                writable: true,
                sceneRequired: true,
                default: 2000,
                minRef: "minHeatSetpointLimit",
                maxRef: "maxHeatSetpointLimit",
            },
            unoccupiedCoolingSetpoint: {
                ID: 0x0013,
                type: DataType.INT16,
                writable: true,
                default: 2600,
                minRef: "minCoolSetpointLimit",
                maxRef: "maxCoolSetpointLimit",
            },
            unoccupiedHeatingSetpoint: {
                ID: 0x0014,
                type: DataType.INT16,
                writable: true,
                default: 2000,
                minRef: "minHeatSetpointLimit",
                maxRef: "maxHeatSetpointLimit",
            },
            minHeatSetpointLimit: {ID: 0x0015, type: DataType.INT16, writable: true, min: -27315, max: 32767, default: 700},
            maxHeatSetpointLimit: {ID: 0x0016, type: DataType.INT16, writable: true, min: -27315, max: 32767, default: 3000},
            minCoolSetpointLimit: {ID: 0x0017, type: DataType.INT16, writable: true, min: -27315, max: 32767, default: 1600},
            maxCoolSetpointLimit: {ID: 0x0018, type: DataType.INT16, writable: true, min: -27315, max: 32767, default: 3200},
            minSetpointDeadBand: {ID: 0x0019, type: DataType.INT8, writable: true, min: 10, max: 25, default: 25},
            remoteSensing: {ID: 0x001a, type: DataType.BITMAP8, writable: true, default: 0},
            ctrlSeqeOfOper: {ID: 0x001b, type: DataType.ENUM8, writable: true, required: true, default: 4},
            systemMode: {ID: 0x001c, type: DataType.ENUM8, writable: true, required: true, default: 1},
            alarmMask: {ID: 0x001d, type: DataType.BITMAP8, default: 0},
            runningMode: {ID: 0x001e, type: DataType.ENUM8, default: 0},
            startOfWeek: {ID: 0x0020, type: DataType.ENUM8},
            numberOfWeeklyTrans: {ID: 0x0021, type: DataType.UINT8, max: 0xff},
            numberOfDailyTrans: {ID: 0x0022, type: DataType.UINT8, max: 0xff},
            tempSetpointHold: {ID: 0x0023, type: DataType.ENUM8, writable: true, default: 0},
            tempSetpointHoldDuration: {ID: 0x0024, type: DataType.UINT16, writable: true, min: 0, max: 1440, default: 65535},
            programingOperMode: {ID: 0x0025, type: DataType.BITMAP8, writable: true, reportRequired: true, default: 0},
            runningState: {ID: 0x0029, type: DataType.BITMAP16},
            setpointChangeSource: {ID: 0x0030, type: DataType.ENUM8, default: 0},
            setpointChangeAmount: {ID: 0x0031, type: DataType.INT16, default: 32768},
            setpointChangeSourceTimeStamp: {ID: 0x0032, type: DataType.UTC, default: 0},
            occupiedSetback: {
                ID: 0x0034,
                type: DataType.UINT8,
                writable: true,
                default: 255,
                minRef: "occupiedSetbackMin",
                maxRef: "occupiedSetbackMax",
            },
            occupiedSetbackMin: {ID: 0x0035, type: DataType.UINT8, default: 255, min: 0, maxExclRef: "occupiedSetbackMax"},
            occupiedSetbackMax: {ID: 0x0036, type: DataType.UINT8, default: 255, max: 0xff, minExclRef: "occupiedSetbackMin"},
            unoccupiedSetback: {
                ID: 0x0037,
                type: DataType.UINT8,
                writable: true,
                default: 255,
                minRef: "unoccupiedSetbackMin",
                maxRef: "unoccupiedSetbackMax",
            },
            unoccupiedSetbackMin: {ID: 0x0038, type: DataType.UINT8, default: 255, min: 0, maxExclRef: "unoccupiedSetbackMax"},
            unoccupiedSetbackMax: {ID: 0x0039, type: DataType.UINT8, default: 255, max: 0xff, minExclRef: "unoccupiedSetbackMin"},
            emergencyHeatDelta: {ID: 0x003a, type: DataType.UINT8, writable: true, max: 0xff, default: 0xff},
            acType: {ID: 0x0040, type: DataType.ENUM8, writable: true, default: 0},
            acCapacity: {ID: 0x0041, type: DataType.UINT16, writable: true, default: 0},
            acRefrigerantType: {ID: 0x0042, type: DataType.ENUM8, writable: true, default: 0},
            acConpressorType: {ID: 0x0043, type: DataType.ENUM8, writable: true, default: 0},
            acErrorCode: {ID: 0x0044, type: DataType.BITMAP32, writable: true, default: 0},
            acLouverPosition: {ID: 0x0045, type: DataType.ENUM8, writable: true, default: 0},
            acCollTemp: {ID: 0x0046, type: DataType.INT16, min: -27315, max: 32767},
            acCapacityFormat: {ID: 0x0047, type: DataType.ENUM8, writable: true, default: 0},
            fourNoksHysteresisHigh: {ID: 0x0101, type: DataType.UINT16, manufacturerCode: ManufacturerCode.ASTREL_GROUP_SRL},
            fourNoksHysteresisLow: {ID: 0x0102, type: DataType.UINT16, manufacturerCode: ManufacturerCode.ASTREL_GROUP_SRL},
            SinopeOccupancy: {ID: 0x0400, type: DataType.ENUM8, manufacturerCode: ManufacturerCode.SINOPE_TECHNOLOGIES},
            elkoLoad: {ID: 0x0401, type: DataType.UINT16},
            SinopeMainCycleOutput: {ID: 0x0401, type: DataType.UINT16, manufacturerCode: ManufacturerCode.SINOPE_TECHNOLOGIES},
            elkoDisplayText: {ID: 0x0402, type: DataType.CHAR_STR},
            SinopeBacklight: {ID: 0x0402, type: DataType.ENUM8, manufacturerCode: ManufacturerCode.SINOPE_TECHNOLOGIES},
            elkoSensor: {ID: 0x0403, type: DataType.ENUM8},
            elkoRegulatorTime: {ID: 0x0404, type: DataType.UINT8},
            SinopeAuxCycleOutput: {ID: 0x0404, type: DataType.UINT16, manufacturerCode: ManufacturerCode.SINOPE_TECHNOLOGIES},
            elkoRegulatorMode: {ID: 0x0405, type: DataType.BOOLEAN},
            elkoPowerStatus: {ID: 0x0406, type: DataType.BOOLEAN},
            elkoDateTime: {ID: 0x0407, type: DataType.OCTET_STR},
            elkoMeanPower: {ID: 0x0408, type: DataType.UINT16},
            elkoExternalTemp: {ID: 0x0409, type: DataType.INT16},
            elkoNightSwitching: {ID: 0x0411, type: DataType.BOOLEAN},
            elkoFrostGuard: {ID: 0x0412, type: DataType.BOOLEAN},
            elkoChildLock: {ID: 0x0413, type: DataType.BOOLEAN},
            elkoMaxFloorTemp: {ID: 0x0414, type: DataType.UINT8},
            elkoRelayState: {ID: 0x0415, type: DataType.BOOLEAN},
            elkoVersion: {ID: 0x0416, type: DataType.OCTET_STR},
            elkoCalibration: {ID: 0x0417, type: DataType.INT8},
            elkoLastMessageId: {ID: 0x0418, type: DataType.UINT8},
            elkoLastMessageStatus: {ID: 0x0419, type: DataType.UINT8},
            viessmannWindowOpenInternal: {ID: 0x4000, type: DataType.ENUM8, manufacturerCode: ManufacturerCode.VIESSMANN_ELEKTRONIK_GMBH},
            danfossWindowOpenInternal: {ID: 0x4000, type: DataType.ENUM8, manufacturerCode: ManufacturerCode.DANFOSS_A_S},
            StelproOutdoorTemp: {ID: 0x4001, type: DataType.INT16},
            viessmannWindowOpenForce: {ID: 0x4003, type: DataType.BOOLEAN, manufacturerCode: ManufacturerCode.VIESSMANN_ELEKTRONIK_GMBH},
            danfossWindowOpenExternal: {ID: 0x4003, type: DataType.BOOLEAN, manufacturerCode: ManufacturerCode.DANFOSS_A_S},
            danfossDayOfWeek: {ID: 0x4010, type: DataType.ENUM8, manufacturerCode: ManufacturerCode.DANFOSS_A_S},
            danfossTriggerTime: {ID: 0x4011, type: DataType.UINT16, manufacturerCode: ManufacturerCode.DANFOSS_A_S},
            viessmannAssemblyMode: {ID: 0x4012, type: DataType.BOOLEAN, manufacturerCode: ManufacturerCode.VIESSMANN_ELEKTRONIK_GMBH},
            danfossMountedModeActive: {ID: 0x4012, type: DataType.BOOLEAN, manufacturerCode: ManufacturerCode.DANFOSS_A_S},
            danfossMountedModeControl: {ID: 0x4013, type: DataType.BOOLEAN, manufacturerCode: ManufacturerCode.DANFOSS_A_S},
            danfossThermostatOrientation: {ID: 0x4014, type: DataType.BOOLEAN, manufacturerCode: ManufacturerCode.DANFOSS_A_S},
            danfossExternalMeasuredRoomSensor: {ID: 0x4015, type: DataType.INT16, manufacturerCode: ManufacturerCode.DANFOSS_A_S},
            danfossRadiatorCovered: {ID: 0x4016, type: DataType.BOOLEAN, manufacturerCode: ManufacturerCode.DANFOSS_A_S},
            StelproSystemMode: {ID: 0x401c, type: DataType.ENUM8},
            danfossAlgorithmScaleFactor: {ID: 0x4020, type: DataType.UINT8, manufacturerCode: ManufacturerCode.DANFOSS_A_S},
            danfossHeatAvailable: {ID: 0x4030, type: DataType.BOOLEAN, manufacturerCode: ManufacturerCode.DANFOSS_A_S},
            danfossHeatRequired: {ID: 0x4031, type: DataType.BOOLEAN, manufacturerCode: ManufacturerCode.DANFOSS_A_S},
            danfossLoadBalancingEnable: {ID: 0x4032, type: DataType.BOOLEAN, manufacturerCode: ManufacturerCode.DANFOSS_A_S},
            danfossLoadRoomMean: {ID: 0x4040, type: DataType.INT16, manufacturerCode: ManufacturerCode.DANFOSS_A_S},
            danfossLoadEstimate: {ID: 0x404a, type: DataType.INT16, manufacturerCode: ManufacturerCode.DANFOSS_A_S},
            danfossRegulationSetpointOffset: {ID: 0x404b, type: DataType.INT8, manufacturerCode: ManufacturerCode.DANFOSS_A_S},
            danfossAdaptionRunControl: {ID: 0x404c, type: DataType.ENUM8, manufacturerCode: ManufacturerCode.DANFOSS_A_S},
            danfossAdaptionRunStatus: {ID: 0x404d, type: DataType.BITMAP8, manufacturerCode: ManufacturerCode.DANFOSS_A_S},
            danfossAdaptionRunSettings: {ID: 0x404e, type: DataType.BITMAP8, manufacturerCode: ManufacturerCode.DANFOSS_A_S},
            danfossPreheatStatus: {ID: 0x404f, type: DataType.BOOLEAN, manufacturerCode: ManufacturerCode.DANFOSS_A_S},
            danfossPreheatTime: {ID: 0x4050, type: DataType.UINT32, manufacturerCode: ManufacturerCode.DANFOSS_A_S},
            danfossWindowOpenFeatureEnable: {ID: 0x4051, type: DataType.BOOLEAN, manufacturerCode: ManufacturerCode.DANFOSS_A_S},
            danfossRoomStatusCode: {ID: 0x4100, type: DataType.BITMAP16, manufacturerCode: ManufacturerCode.DANFOSS_A_S},
            danfossOutputStatus: {ID: 0x4110, type: DataType.ENUM8, manufacturerCode: ManufacturerCode.DANFOSS_A_S},
            danfossRoomFloorSensorMode: {ID: 0x4120, type: DataType.ENUM8, manufacturerCode: ManufacturerCode.DANFOSS_A_S},
            danfossFloorMinSetpoint: {ID: 0x4121, type: DataType.INT16, manufacturerCode: ManufacturerCode.DANFOSS_A_S},
            danfossFloorMaxSetpoint: {ID: 0x4122, type: DataType.INT16, manufacturerCode: ManufacturerCode.DANFOSS_A_S},
            danfossScheduleTypeUsed: {ID: 0x4130, type: DataType.ENUM8, manufacturerCode: ManufacturerCode.DANFOSS_A_S},
            danfossIcon2PreHeat: {ID: 0x4131, type: DataType.ENUM8, manufacturerCode: ManufacturerCode.DANFOSS_A_S},
            danfossIcon2PreHeatStatus: {ID: 0x414f, type: DataType.ENUM8, manufacturerCode: ManufacturerCode.DANFOSS_A_S},
            schneiderWiserSpecific: {ID: 0xe110, type: DataType.ENUM8, manufacturerCode: ManufacturerCode.SCHNEIDER_ELECTRIC},
        },
        commands: {
            setpointRaiseLower: {
                ID: 0x00,
                parameters: [
                    {name: "mode", type: DataType.UINT8},
                    {name: "amount", type: DataType.INT8},
                ],
                required: true,
            },
            setWeeklySchedule: {
                ID: 0x01,
                parameters: [
                    {name: "numoftrans", type: DataType.UINT8, min: 0, max: 10},
                    {name: "dayofweek", type: DataType.UINT8},
                    {name: "mode", type: DataType.UINT8},
                    {name: "transitions", type: BuffaloZclDataType.LIST_THERMO_TRANSITIONS, arrayLengthField: "numoftrans"},
                ],
            },
            getWeeklySchedule: {
                ID: 0x02,
                response: 0,
                parameters: [
                    {name: "daystoreturn", type: DataType.UINT8},
                    {name: "modetoreturn", type: DataType.UINT8},
                ],
            },
            clearWeeklySchedule: {ID: 0x03, parameters: []},
            getRelayStatusLog: {ID: 0x04, response: 1, parameters: []},
            danfossSetpointCommand: {
                ID: 0x40,
                parameters: [
                    {name: "setpointType", type: DataType.ENUM8},
                    {name: "setpoint", type: DataType.INT16},
                ],
            },
            schneiderWiserThermostatBoost: {
                ID: 0x80,
                parameters: [
                    {name: "command", type: DataType.ENUM8},
                    {name: "enable", type: DataType.ENUM8},
                    {name: "temperature", type: DataType.UINT16},
                    {name: "duration", type: DataType.UINT16},
                ],
            },
            plugwiseCalibrateValve: {ID: 0xa0, parameters: []},
            wiserSmartSetSetpoint: {
                ID: 0xe0,
                parameters: [
                    {name: "operatingmode", type: DataType.UINT8},
                    {name: "zonemode", type: DataType.UINT8},
                    {name: "setpoint", type: DataType.INT16},
                    {name: "reserved", type: DataType.UINT8},
                ],
            },
            wiserSmartSetFipMode: {
                ID: 0xe1,
                parameters: [
                    {name: "zonemode", type: DataType.UINT8},
                    {name: "fipmode", type: DataType.ENUM8},
                    {name: "reserved", type: DataType.UINT8},
                ],
            },
            wiserSmartCalibrateValve: {ID: 0xe2, parameters: []},
        },
        commandsResponse: {
            getWeeklyScheduleRsp: {
                ID: 0x00,
                parameters: [
                    {name: "numoftrans", type: DataType.UINT8, min: 0, max: 10},
                    {name: "dayofweek", type: DataType.UINT8},
                    {name: "mode", type: DataType.UINT8},
                    {name: "transitions", type: BuffaloZclDataType.LIST_THERMO_TRANSITIONS, arrayLengthField: "numoftrans"},
                ],
            },
            getRelayStatusLogRsp: {
                ID: 0x01,
                parameters: [
                    {name: "timeofday", type: DataType.UINT16},
                    {name: "relaystatus", type: DataType.UINT16},
                    {name: "localtemp", type: DataType.UINT16},
                    {name: "humidity", type: DataType.UINT8},
                    {name: "setpoint", type: DataType.UINT16},
                    {name: "unreadentries", type: DataType.UINT16},
                ],
            },
        },
    },
    hvacFanCtrl: {
        ID: 0x0202,
        attributes: {
            fanMode: {ID: 0x0000, type: DataType.ENUM8, writable: true, required: true, default: 5},
            fanModeSequence: {ID: 0x0001, type: DataType.ENUM8, writable: true, required: true, default: 2},
        },
        commands: {},
        commandsResponse: {},
    },
    hvacDehumidificationCtrl: {
        ID: 0x0203,
        attributes: {
            relativeHumidity: {ID: 0x0000, type: DataType.UINT8, max: 100},
            dehumidCooling: {ID: 0x0001, type: DataType.UINT8, reportRequired: true, required: true, maxRef: "dehumidMaxCool"},
            rhDehumidSetpoint: {ID: 0x0010, type: DataType.UINT8, writable: true, required: true, min: 30, max: 100, default: 50},
            relativeHumidityMode: {ID: 0x0011, type: DataType.ENUM8, writable: true, default: 0},
            dehumidLockout: {ID: 0x0012, type: DataType.ENUM8, writable: true, default: 1},
            dehumidHysteresis: {ID: 0x0013, type: DataType.UINT8, writable: true, required: true, min: 2, max: 20, default: 2},
            dehumidMaxCool: {ID: 0x0014, type: DataType.UINT8, writable: true, required: true, min: 20, max: 100, default: 20},
            relativeHumidDisplay: {ID: 0x0015, type: DataType.ENUM8, writable: true, default: 0},
        },
        commands: {},
        commandsResponse: {},
    },
    hvacUserInterfaceCfg: {
        ID: 0x0204,
        attributes: {
            tempDisplayMode: {ID: 0x0000, type: DataType.ENUM8, writable: true, required: true, default: 0},
            keypadLockout: {ID: 0x0001, type: DataType.ENUM8, writable: true, required: true, default: 0},
            programmingVisibility: {ID: 0x0002, type: DataType.ENUM8, writable: true, default: 0},
            danfossViewingDirection: {ID: 0x4000, type: DataType.ENUM8, manufacturerCode: ManufacturerCode.DANFOSS_A_S},
        },
        commands: {},
        commandsResponse: {},
    },
    lightingColorCtrl: {
        ID: 0x0300,
        attributes: {
            currentHue: {ID: 0x0000, type: DataType.UINT8, reportRequired: true, max: 254, default: 0},
            currentSaturation: {ID: 0x0001, type: DataType.UINT8, reportRequired: true, sceneRequired: true, max: 254, default: 0},
            remainingTime: {ID: 0x0002, type: DataType.UINT16, max: 65534, default: 0},
            currentX: {ID: 0x0003, type: DataType.UINT16, reportRequired: true, sceneRequired: true, max: 65279, default: 24939},
            currentY: {ID: 0x0004, type: DataType.UINT16, reportRequired: true, sceneRequired: true, max: 65279, default: 24701},
            driftCompensation: {ID: 0x0005, type: DataType.ENUM8},
            compensationText: {ID: 0x0006, type: DataType.CHAR_STR, maxLen: 254},
            colorTemperature: {
                ID: 0x0007,
                type: DataType.UINT16,
                reportRequired: true,
                sceneRequired: true,
                max: 65279,
                default: 250,
                minRef: "colorTempPhysicalMin",
                maxRef: "colorTempPhysicalMax",
                special: [["Undefined", "0000"]],
            },
            colorMode: {ID: 0x0008, type: DataType.ENUM8, required: true, default: 1},
            options: {ID: 0x000f, type: DataType.BITMAP8, writable: true, required: true, default: 0},
            numPrimaries: {ID: 0x0010, type: DataType.UINT8, required: true, max: 6},
            primary1X: {ID: 0x0011, type: DataType.UINT16, max: 65279},
            primary1Y: {ID: 0x0012, type: DataType.UINT16, max: 65279},
            primary1Intensity: {ID: 0x0013, type: DataType.UINT8, max: 0xff},
            primary2X: {ID: 0x0015, type: DataType.UINT16, max: 65279},
            primary2Y: {ID: 0x0016, type: DataType.UINT16, max: 65279},
            primary2Intensity: {ID: 0x0017, type: DataType.UINT8},
            primary3X: {ID: 0x0019, type: DataType.UINT16, max: 65279},
            primary3Y: {ID: 0x001a, type: DataType.UINT16, max: 65279},
            primary3Intensity: {ID: 0x001b, type: DataType.UINT8, max: 0xff},
            primary4X: {ID: 0x0020, type: DataType.UINT16, max: 65279},
            primary4Y: {ID: 0x0021, type: DataType.UINT16, max: 65279},
            primary4Intensity: {ID: 0x0022, type: DataType.UINT8, max: 0xff},
            primary5X: {ID: 0x0024, type: DataType.UINT16, max: 65279},
            primary5Y: {ID: 0x0025, type: DataType.UINT16, max: 65279},
            primary5Intensity: {ID: 0x0026, type: DataType.UINT8, max: 0xff},
            primary6X: {ID: 0x0028, type: DataType.UINT16, max: 65279},
            primary6Y: {ID: 0x0029, type: DataType.UINT16, max: 65279},
            primary6Intensity: {ID: 0x002a, type: DataType.UINT8, max: 0xff},
            whitePointX: {ID: 0x0030, type: DataType.UINT16, writable: true, max: 65279},
            whitePointY: {ID: 0x0031, type: DataType.UINT16, writable: true, max: 65279},
            colorPointRX: {ID: 0x0032, type: DataType.UINT16, writable: true, max: 65279},
            colorPointRY: {ID: 0x0033, type: DataType.UINT16, writable: true, max: 65279},
            colorPointRIntensity: {ID: 0x0034, type: DataType.UINT8, writable: true, max: 0xff},
            colorPointGX: {ID: 0x0036, type: DataType.UINT16, writable: true, max: 65279},
            colorPointGY: {ID: 0x0037, type: DataType.UINT16, writable: true, max: 65279},
            colorPointGIntensity: {ID: 0x0038, type: DataType.UINT8, writable: true, max: 0xff},
            colorPointBX: {ID: 0x003a, type: DataType.UINT16, writable: true, max: 65279},
            colorPointBY: {ID: 0x003b, type: DataType.UINT16, writable: true, max: 65279},
            colorPointBIntensity: {ID: 0x003c, type: DataType.UINT8, writable: true, max: 0xff},
            enhancedCurrentHue: {ID: 0x4000, type: DataType.UINT16, sceneRequired: true, max: 0xffff, default: 0},
            enhancedColorMode: {ID: 0x4001, type: DataType.ENUM8, required: true, default: 1},
            colorLoopActive: {ID: 0x4002, type: DataType.UINT8, sceneRequired: true, max: 0xff, default: 0},
            colorLoopDirection: {ID: 0x4003, type: DataType.UINT8, sceneRequired: true, max: 0xff, default: 0},
            colorLoopTime: {ID: 0x4004, type: DataType.UINT16, sceneRequired: true, max: 0xffff, default: 25},
            colorLoopStartEnhancedHue: {ID: 0x4005, type: DataType.UINT16, max: 0xffff, default: 8960},
            colorLoopStoredEnhancedHue: {ID: 0x4006, type: DataType.UINT16, max: 0xffff, default: 0},
            colorCapabilities: {ID: 0x400a, type: DataType.UINT16, required: true, default: 0},
            colorTempPhysicalMin: {ID: 0x400b, type: DataType.UINT16, max: 65279, default: 0, maxRef: "colorTempPhysicalMax"},
            colorTempPhysicalMax: {ID: 0x400c, type: DataType.UINT16, max: 65279, default: 65279, minRef: "colorTempPhysicalMin"},
            coupleColorTempToLevelMin: {
                ID: 0x400d,
                type: DataType.UINT16,
                minRef: "colorTempPhysicalMin",
                maxRef: "colorTemperature",
            },
            startUpColorTemperature: {
                ID: 0x4010,
                type: DataType.UINT16,
                writable: true,
                max: 65279,
                special: [["SetColorTempToPreviousValue", "ffff"]],
            },
            tuyaRgbMode: {ID: 0xf000, type: DataType.UINT8},
            tuyaBrightness: {ID: 0xf001, type: DataType.UINT8},
        },
        commands: {
            moveToHue: {
                ID: 0x00,
                parameters: [
                    {name: "hue", type: DataType.UINT8},
                    {name: "direction", type: DataType.UINT8},
                    {name: "transtime", type: DataType.UINT16},
                    {name: "optionsMask", type: DataType.BITMAP8},
                    {name: "optionsOverride", type: DataType.BITMAP8},
                ],
            },
            moveHue: {
                ID: 0x01,
                parameters: [
                    {name: "movemode", type: DataType.UINT8},
                    {name: "rate", type: DataType.UINT8},
                    {name: "optionsMask", type: DataType.BITMAP8},
                    {name: "optionsOverride", type: DataType.BITMAP8},
                ],
            },
            stepHue: {
                ID: 0x02,
                parameters: [
                    {name: "stepmode", type: DataType.UINT8},
                    {name: "stepsize", type: DataType.UINT8},
                    {name: "transtime", type: DataType.UINT8},
                    {name: "optionsMask", type: DataType.BITMAP8},
                    {name: "optionsOverride", type: DataType.BITMAP8},
                ],
            },
            moveToSaturation: {
                ID: 0x03,
                parameters: [
                    {name: "saturation", type: DataType.UINT8},
                    {name: "transtime", type: DataType.UINT16},
                    {name: "optionsMask", type: DataType.BITMAP8},
                    {name: "optionsOverride", type: DataType.BITMAP8},
                ],
            },
            moveSaturation: {
                ID: 0x04,
                parameters: [
                    {name: "movemode", type: DataType.UINT8},
                    {name: "rate", type: DataType.UINT8},
                    {name: "optionsMask", type: DataType.BITMAP8},
                    {name: "optionsOverride", type: DataType.BITMAP8},
                ],
            },
            stepSaturation: {
                ID: 0x05,
                parameters: [
                    {name: "stepmode", type: DataType.UINT8},
                    {name: "stepsize", type: DataType.UINT8},
                    {name: "transtime", type: DataType.UINT8},
                    {name: "optionsMask", type: DataType.BITMAP8},
                    {name: "optionsOverride", type: DataType.BITMAP8},
                ],
            },
            moveToHueAndSaturation: {
                ID: 0x06,
                parameters: [
                    {name: "hue", type: DataType.UINT8},
                    {name: "saturation", type: DataType.UINT8},
                    {name: "transtime", type: DataType.UINT16},
                    {name: "optionsMask", type: DataType.BITMAP8},
                    {name: "optionsOverride", type: DataType.BITMAP8},
                ],
            },
            tuyaMoveToHueAndSaturationBrightness: {
                ID: 0x06,
                parameters: [
                    {name: "hue", type: DataType.UINT8},
                    {name: "saturation", type: DataType.UINT8},
                    {name: "transtime", type: DataType.UINT16},
                    {name: "brightness", type: DataType.UINT8},
                ],
            },
            moveToColor: {
                ID: 0x07,
                parameters: [
                    {name: "colorx", type: DataType.UINT16},
                    {name: "colory", type: DataType.UINT16},
                    {name: "transtime", type: DataType.UINT16},
                    {name: "optionsMask", type: DataType.BITMAP8},
                    {name: "optionsOverride", type: DataType.BITMAP8},
                ],
            },
            moveColor: {
                ID: 0x08,
                parameters: [
                    {name: "ratex", type: DataType.INT16},
                    {name: "ratey", type: DataType.INT16},
                    {name: "optionsMask", type: DataType.BITMAP8},
                    {name: "optionsOverride", type: DataType.BITMAP8},
                ],
            },
            stepColor: {
                ID: 0x09,
                parameters: [
                    {name: "stepx", type: DataType.INT16},
                    {name: "stepy", type: DataType.INT16},
                    {name: "transtime", type: DataType.UINT16},
                    {name: "optionsMask", type: DataType.BITMAP8},
                    {name: "optionsOverride", type: DataType.BITMAP8},
                ],
            },
            moveToColorTemp: {
                ID: 0x0a,
                parameters: [
                    {name: "colortemp", type: DataType.UINT16},
                    {name: "transtime", type: DataType.UINT16},
                    {name: "optionsMask", type: DataType.BITMAP8},
                    {name: "optionsOverride", type: DataType.BITMAP8},
                ],
            },
            enhancedMoveToHue: {
                ID: 0x40,
                parameters: [
                    {name: "enhancehue", type: DataType.UINT16},
                    {name: "direction", type: DataType.UINT8},
                    {name: "transtime", type: DataType.UINT16},
                    {name: "optionsMask", type: DataType.BITMAP8},
                    {name: "optionsOverride", type: DataType.BITMAP8},
                ],
            },
            enhancedMoveHue: {
                ID: 0x41,
                parameters: [
                    {name: "movemode", type: DataType.UINT8},
                    {name: "rate", type: DataType.UINT16},
                    {name: "optionsMask", type: DataType.BITMAP8},
                    {name: "optionsOverride", type: DataType.BITMAP8},
                ],
            },
            enhancedStepHue: {
                ID: 0x42,
                parameters: [
                    {name: "stepmode", type: DataType.UINT8},
                    {name: "stepsize", type: DataType.UINT16},
                    {name: "transtime", type: DataType.UINT16},
                    {name: "optionsMask", type: DataType.BITMAP8},
                    {name: "optionsOverride", type: DataType.BITMAP8},
                ],
            },
            enhancedMoveToHueAndSaturation: {
                ID: 0x43,
                parameters: [
                    {name: "enhancehue", type: DataType.UINT16},
                    {name: "saturation", type: DataType.UINT8},
                    {name: "transtime", type: DataType.UINT16},
                    {name: "optionsMask", type: DataType.BITMAP8},
                    {name: "optionsOverride", type: DataType.BITMAP8},
                ],
            },
            colorLoopSet: {
                ID: 0x44,
                parameters: [
                    {name: "updateflags", type: DataType.UINT8},
                    {name: "action", type: DataType.UINT8},
                    {name: "direction", type: DataType.UINT8},
                    {name: "time", type: DataType.UINT16},
                    {name: "starthue", type: DataType.UINT16},
                    {name: "optionsMask", type: DataType.BITMAP8},
                    {name: "optionsOverride", type: DataType.BITMAP8},
                ],
            },
            stopMoveStep: {
                ID: 0x47,
                parameters: [
                    {name: "bits", type: DataType.UINT8},
                    {name: "bytee", type: DataType.UINT8},
                    {name: "action", type: DataType.UINT8},
                    {name: "direction", type: DataType.UINT8},
                    {name: "time", type: DataType.UINT16},
                    {name: "starthue", type: DataType.UINT16},
                ],
                required: true,
            },
            moveColorTemp: {
                ID: 0x4b,
                parameters: [
                    {name: "movemode", type: DataType.UINT8},
                    {name: "rate", type: DataType.UINT16},
                    {name: "minimum", type: DataType.UINT16},
                    {name: "maximum", type: DataType.UINT16},
                    {name: "optionsMask", type: DataType.BITMAP8},
                    {name: "optionsOverride", type: DataType.BITMAP8},
                ],
            },
            stepColorTemp: {
                ID: 0x4c,
                parameters: [
                    {name: "stepmode", type: DataType.UINT8},
                    {name: "stepsize", type: DataType.UINT16},
                    {name: "transtime", type: DataType.UINT16},
                    {name: "minimum", type: DataType.UINT16},
                    {name: "maximum", type: DataType.UINT16},
                    {name: "optionsMask", type: DataType.BITMAP8},
                    {name: "optionsOverride", type: DataType.BITMAP8},
                ],
            },
            tuyaSetMinimumBrightness: {ID: 0xe0, parameters: [{name: "minimum", type: DataType.UINT16}]},
            tuyaMoveToHueAndSaturationBrightness2: {
                ID: 0xe1,
                parameters: [
                    {name: "hue", type: DataType.UINT16},
                    {name: "saturation", type: DataType.UINT16},
                    {name: "brightness", type: DataType.UINT16},
                ],
            },
            tuyaRgbMode: {ID: 0xf0, parameters: [{name: "enable", type: DataType.UINT8}]},
            tuyaOnStartUp: {
                ID: 0xf9,
                parameters: [
                    {name: "mode", type: DataType.UINT16},
                    {name: "data", type: BuffaloZclDataType.LIST_UINT8},
                ],
            },
            tuyaDoNotDisturb: {ID: 0xfa, parameters: [{name: "enable", type: DataType.UINT8}]},
            tuyaOnOffTransitionTime: {
                ID: 0xfb,
                parameters: [
                    {name: "unknown", type: DataType.UINT8},
                    {name: "onTransitionTime", type: BuffaloZclDataType.BIG_ENDIAN_UINT24},
                    {name: "offTransitionTime", type: BuffaloZclDataType.BIG_ENDIAN_UINT24},
                ],
            },
        },
        commandsResponse: {},
    },
    lightingBallastCfg: {
        ID: 0x0301,
        attributes: {
            physicalMinLevel: {ID: 0x0000, type: DataType.UINT8, required: true, min: 1, max: 254, default: 1},
            physicalMaxLevel: {ID: 0x0001, type: DataType.UINT8, required: true, min: 1, max: 254, default: 254},
            ballastStatus: {ID: 0x0002, type: DataType.BITMAP8, default: 0},
            minLevel: {
                ID: 0x0010,
                type: DataType.UINT8,
                writable: true,
                required: true,
                min: 1,
                max: 254,
                defaultRef: "physicalMinLevel",
                minRef: "physicalMinLevel",
                maxRef: "maxLevel",
            },
            maxLevel: {
                ID: 0x0011,
                type: DataType.UINT8,
                writable: true,
                required: true,
                min: 1,
                max: 254,
                defaultRef: "physicalMaxLevel",
                minRef: "minLevel",
                maxRef: "physicalMaxLevel",
            },
            powerOnLevel: {ID: 0x0012, type: DataType.UINT8, writable: true, max: 254, defaultRef: "physicalMaxLevel"},
            powerOnFadeTime: {ID: 0x0013, type: DataType.UINT16, writable: true, max: 65534, default: 0},
            intrinsicBallastFactor: {ID: 0x0014, type: DataType.UINT8, writable: true, max: 254},
            ballastFactorAdjustment: {ID: 0x0015, type: DataType.UINT8, writable: true, min: 100, default: 0xff},
            lampQuantity: {ID: 0x0020, type: DataType.UINT8, max: 254},
            lampType: {ID: 0x0030, type: DataType.CHAR_STR, writable: true, default: "", maxLen: 16},
            lampManufacturer: {ID: 0x0031, type: DataType.CHAR_STR, writable: true, default: "", maxLen: 16},
            lampRatedHours: {ID: 0x0032, type: DataType.UINT24, writable: true, max: 16777214, default: 16777215},
            lampBurnHours: {ID: 0x0033, type: DataType.UINT24, writable: true, max: 16777214, default: 0},
            lampAlarmMode: {ID: 0x0034, type: DataType.BITMAP8, writable: true, default: 0},
            lampBurnHoursTripPoint: {ID: 0x0035, type: DataType.UINT24, writable: true, max: 16777214, default: 16777215},
            elkoControlMode: {ID: 0xe000, type: DataType.ENUM8, manufacturerCode: ManufacturerCode.ADEO},
            wiserControlMode: {ID: 0xe000, type: DataType.ENUM8, manufacturerCode: ManufacturerCode.SCHNEIDER_ELECTRIC},
        },
        commands: {},
        commandsResponse: {},
    },
    msIlluminanceMeasurement: {
        ID: 0x0400, // 0x0400
        attributes: {
            measuredValue: {ID: 0x0000, type: DataType.UINT16, reportRequired: true, required: true, max: 0xffff, default: 0},
            minMeasuredValue: {ID: 0x0001, type: DataType.UINT16, required: true, min: 1, max: 65533, maxExclRef: "maxMeasuredValue"},
            maxMeasuredValue: {ID: 0x0002, type: DataType.UINT16, required: true, min: 2, max: 65534, minExclRef: "minMeasuredValue"},
            tolerance: {ID: 0x0003, type: DataType.UINT16, max: 2048},
            lightSensorType: {ID: 0x0004, type: DataType.ENUM8, default: 0xff},
        },
        commands: {},
        commandsResponse: {},
    },
    msIlluminanceLevelSensing: {
        ID: 0x0401, // 0x0401
        attributes: {
            levelStatus: {ID: 0x0000, type: DataType.ENUM8, reportRequired: true, required: true},
            lightSensorType: {ID: 0x0001, type: DataType.ENUM8},
            illuminanceTargetLevel: {ID: 0x0010, type: DataType.UINT16, writable: true, required: true, max: 65534},
        },
        commands: {},
        commandsResponse: {},
    },
    msTemperatureMeasurement: {
        ID: 0x0402, // 0x0402
        attributes: {
            measuredValue: {
                ID: 0x0000,
                type: DataType.INT16,
                reportRequired: true,
                required: true,
                default: -32768,
                minRef: "minMeasuredValue",
                maxRef: "maxMeasuredValue",
            },
            minMeasuredValue: {
                ID: 0x0001,
                type: DataType.INT16,
                required: true,
                min: -27315,
                max: 32766,
                default: -32768,
                maxExclRef: "maxMeasuredValue",
            },
            maxMeasuredValue: {
                ID: 0x0002,
                type: DataType.INT16,
                required: true,
                min: -27314,
                max: 32767,
                default: -32768,
                minExclRef: "minMeasuredValue",
            },
            tolerance: {ID: 0x0003, type: DataType.UINT16, max: 2048},
            minPercentChange: {ID: 0x0010, type: DataType.UNKNOWN},
            minAbsoluteChange: {ID: 0x0011, type: DataType.UNKNOWN},
            sprutTemperatureOffset: {ID: 0x6600, type: DataType.INT16, manufacturerCode: ManufacturerCode.CUSTOM_SPRUT_DEVICE},
        },
        commands: {},
        commandsResponse: {},
    },
    msPressureMeasurement: {
        ID: 0x0403, // 0x0403
        attributes: {
            measuredValue: {
                ID: 0x0000,
                type: DataType.INT16,
                reportRequired: true,
                required: true,
                default: -32768,
                minRef: "minMeasuredValue",
                maxRef: "maxMeasuredValue",
            },
            minMeasuredValue: {
                ID: 0x0001,
                type: DataType.INT16,
                required: true,
                min: -32767,
                max: 32766,
                default: -32768,
                maxExclRef: "maxMeasuredValue",
            },
            maxMeasuredValue: {
                ID: 0x0002,
                type: DataType.INT16,
                required: true,
                min: -32766,
                max: 32767,
                default: -32768,
                minExclRef: "minMeasuredValue",
            },
            tolerance: {ID: 0x0003, type: DataType.UINT16, max: 2048},
            scaledValue: {ID: 0x0010, type: DataType.INT16, default: 0, minRef: "minScaledValue", maxRef: "maxScaledValue"},
            minScaledValue: {ID: 0x0011, type: DataType.INT16, min: -32767, max: 32766, default: -32768, maxExclRef: "maxScaledValue"},
            maxScaledValue: {ID: 0x0012, type: DataType.INT16, min: -32766, max: 32767, default: -32768, minExclRef: "minScaledValue"},
            scaledTolerance: {ID: 0x0013, type: DataType.UINT16, max: 2048},
            scale: {ID: 0x0014, type: DataType.INT8, min: -127, max: 127},
        },
        commands: {},
        commandsResponse: {},
    },
    msFlowMeasurement: {
        ID: 0x0404, // 0x0404
        attributes: {
            measuredValue: {
                ID: 0x0000,
                type: DataType.UINT16,
                reportRequired: true,
                required: true,
                default: 65535,
                minRef: "minMeasuredValue",
                maxRef: "maxMeasuredValue",
            },
            minMeasuredValue: {ID: 0x0001, type: DataType.UINT16, required: true, max: 65533, default: 65535, maxExclRef: "maxMeasuredValue"},
            maxMeasuredValue: {
                ID: 0x0002,
                type: DataType.UINT16,
                required: true,
                min: 1,
                max: 65534,
                default: 65535,
                minExclRef: "minMeasuredValue",
            },
            tolerance: {ID: 0x0003, type: DataType.UINT16, max: 2048},
        },
        commands: {},
        commandsResponse: {},
    },
    msRelativeHumidity: {
        // Water Content
        ID: 0x0405, // 0x0405
        attributes: {
            measuredValue: {
                ID: 0x0000,
                type: DataType.UINT16,
                reportRequired: true,
                required: true,
                default: 65535,
                minRef: "minMeasuredValue",
                maxRef: "maxMeasuredValue",
            },
            minMeasuredValue: {ID: 0x0001, type: DataType.UINT16, required: true, max: 9999, default: 65535, maxExclRef: "maxMeasuredValue"},
            maxMeasuredValue: {
                ID: 0x0002,
                type: DataType.UINT16,
                required: true,
                min: 1,
                max: 10000,
                default: 65535,
                minExclRef: "minMeasuredValue",
            },
            tolerance: {ID: 0x0003, type: DataType.UINT16, max: 2048},
            sprutHeater: {ID: 0x6600, type: DataType.BOOLEAN, manufacturerCode: ManufacturerCode.CUSTOM_SPRUT_DEVICE},
        },
        commands: {},
        commandsResponse: {},
    },
    msOccupancySensing: {
        ID: 0x0406, // 0x0406
        attributes: {
            occupancy: {ID: 0x0000, type: DataType.BITMAP8, reportRequired: true, required: true},
            occupancySensorType: {ID: 0x0001, type: DataType.ENUM8, required: true, default: 0},
            occupancySensorTypeBitmap: {ID: 0x0002, type: DataType.BITMAP8, required: true},
            pirOToUDelay: {ID: 0x0010, type: DataType.UINT16, writable: true, max: 65534, default: 0},
            pirUToODelay: {ID: 0x0011, type: DataType.UINT16, writable: true, max: 65534, default: 0},
            pirUToOThreshold: {ID: 0x0012, type: DataType.UINT8, writable: true, min: 1, max: 254, default: 1},
            ultrasonicOToUDelay: {ID: 0x0020, type: DataType.UINT16, writable: true, max: 65534, default: 0},
            ultrasonicUToODelay: {ID: 0x0021, type: DataType.UINT16, writable: true, max: 65534, default: 0},
            ultrasonicUToOThreshold: {ID: 0x0022, type: DataType.UINT8, writable: true, min: 1, max: 254, default: 1},
            contactOToUDelay: {ID: 0x0030, type: DataType.UINT16, writable: true, max: 65534, default: 0},
            contactUToODelay: {ID: 0x0031, type: DataType.UINT16, writable: true, max: 65534, default: 0},
            contactUToOThreshold: {ID: 0x0032, type: DataType.UINT8, writable: true, min: 1, max: 254, default: 1},
            sprutOccupancyLevel: {ID: 0x6600, type: DataType.UINT16, manufacturerCode: ManufacturerCode.CUSTOM_SPRUT_DEVICE},
            sprutOccupancySensitivity: {ID: 0x6601, type: DataType.UINT16, manufacturerCode: ManufacturerCode.CUSTOM_SPRUT_DEVICE},
            elkoOccupancyDfltOperationMode: {ID: 0xe000, type: DataType.ENUM8, manufacturerCode: ManufacturerCode.ADEO},
            elkoOccupancyOperationMode: {ID: 0xe001, type: DataType.ENUM8, manufacturerCode: ManufacturerCode.ADEO},
            elkoForceOffTimeout: {ID: 0xe002, type: DataType.UINT16, manufacturerCode: ManufacturerCode.ADEO},
            elkoOccupancySensitivity: {ID: 0xe003, type: DataType.UINT8, manufacturerCode: ManufacturerCode.ADEO},
        },
        commands: {},
        commandsResponse: {},
    },
    msLeafWetness: {
        ID: 0x0407, // 0x0407
        attributes: {
            measuredValue: {ID: 0x0000, type: DataType.UINT16},
            minMeasuredValue: {ID: 0x0001, type: DataType.UINT16},
            maxMeasuredValue: {ID: 0x0002, type: DataType.UINT16},
            tolerance: {ID: 0x0003, type: DataType.UINT16},
        },
        commands: {},
        commandsResponse: {},
    },
    msSoilMoisture: {
        ID: 0x0408, // 0x0408
        attributes: {
            measuredValue: {ID: 0x0000, type: DataType.UINT16},
            minMeasuredValue: {ID: 0x0001, type: DataType.UINT16},
            maxMeasuredValue: {ID: 0x0002, type: DataType.UINT16},
            tolerance: {ID: 0x0003, type: DataType.UINT16},
        },
        commands: {},
        commandsResponse: {},
    },
    pHMeasurement: {
        ID: 0x0409, // 0x0409
        attributes: {
            measuredValue: {
                ID: 0x0000,
                type: DataType.UINT16,
                reportRequired: true,
                required: true,
                default: 65535,
                minRef: "minMeasuredValue",
                maxRef: "maxMeasuredValue",
            },
            minMeasuredValue: {ID: 0x0001, type: DataType.UINT16, required: true, default: 65535, maxExclRef: "maxMeasuredValue"},
            maxMeasuredValue: {ID: 0x0002, type: DataType.UINT16, required: true, max: 1400, default: 65535, minExclRef: "minMeasuredValue"},
            tolerance: {ID: 0x0003, type: DataType.UINT16, max: 200, default: 0},
        },
        commands: {},
        commandsResponse: {},
    },
    msElectricalConductivity: {
        ID: 0x040a, // 0x040a
        attributes: {
            measuredValue: {
                ID: 0x0000,
                type: DataType.UINT16,
                reportRequired: true,
                required: true,
                default: 65535,
                minRef: "minMeasuredValue",
                maxRef: "maxMeasuredValue",
            },
            minMeasuredValue: {ID: 0x0001, type: DataType.UINT16, required: true, default: 65535, maxExclRef: "maxMeasuredValue"},
            maxMeasuredValue: {ID: 0x0002, type: DataType.UINT16, required: true, max: 65534, default: 65535, minExclRef: "minMeasuredValue"},
            tolerance: {ID: 0x0003, type: DataType.UINT16, max: 100},
        },
        commands: {},
        commandsResponse: {},
    },
    msWindSpeed: {
        ID: 0x040b, // 0x040b
        attributes: {
            measuredValue: {
                ID: 0x0000,
                type: DataType.UINT16,
                reportRequired: true,
                required: true,
                default: 65535,
                minRef: "minMeasuredValue",
                maxRef: "maxMeasuredValue",
            },
            minMeasuredValue: {ID: 0x0001, type: DataType.UINT16, required: true, default: 65535, maxExclRef: "maxMeasuredValue"},
            maxMeasuredValue: {ID: 0x0002, type: DataType.UINT16, required: true, max: 65534, default: 65535, minExclRef: "minMeasuredValue"},
            tolerance: {ID: 0x0003, type: DataType.UINT16, max: 776, default: 0},
        },
        commands: {},
        commandsResponse: {},
    },
    msCarbonMonoxide: {
        // CO
        ID: 0x040c, // 0x040c
        attributes: {
            measuredValue: {
                ID: 0x0000,
                type: DataType.SINGLE_PREC,
                reportRequired: true,
                required: true,
                minRef: "minMeasuredValue",
                maxRef: "maxMeasuredValue",
            },
            minMeasuredValue: {ID: 0x0001, type: DataType.SINGLE_PREC, required: true, min: 0, maxExclRef: "maxMeasuredValue"},
            maxMeasuredValue: {ID: 0x0002, type: DataType.SINGLE_PREC, required: true, max: 1, minExclRef: "minMeasuredValue"},
            tolerance: {ID: 0x0003, type: DataType.SINGLE_PREC},
        },
        commands: {},
        commandsResponse: {},
    },
    msCO2: {
        // Carbon Dioxide
        ID: 0x040d, // 0x040d
        attributes: {
            measuredValue: {ID: 0x0000, type: DataType.SINGLE_PREC},
            minMeasuredValue: {ID: 0x0001, type: DataType.SINGLE_PREC},
            maxMeasuredValue: {ID: 0x0002, type: DataType.SINGLE_PREC},
            tolerance: {ID: 0x0003, type: DataType.SINGLE_PREC},
            sprutCO2Calibration: {ID: 0x6600, type: DataType.BOOLEAN, manufacturerCode: ManufacturerCode.CUSTOM_SPRUT_DEVICE},
            sprutCO2AutoCalibration: {ID: 0x6601, type: DataType.BOOLEAN, manufacturerCode: ManufacturerCode.CUSTOM_SPRUT_DEVICE},
        },
        commands: {},
        commandsResponse: {},
    },
    msEthylene: {
        // CH2
        ID: 0x040e, // 0x040e
        attributes: {
            measuredValue: {ID: 0x0000, type: DataType.SINGLE_PREC},
            minMeasuredValue: {ID: 0x0001, type: DataType.SINGLE_PREC},
            maxMeasuredValue: {ID: 0x0002, type: DataType.SINGLE_PREC},
            tolerance: {ID: 0x0003, type: DataType.SINGLE_PREC},
        },
        commands: {},
        commandsResponse: {},
    },
    msEthyleneOxide: {
        // C2H4O
        ID: 0x040f, // 0x040f
        attributes: {
            measuredValue: {ID: 0x0000, type: DataType.SINGLE_PREC},
            minMeasuredValue: {ID: 0x0001, type: DataType.SINGLE_PREC},
            maxMeasuredValue: {ID: 0x0002, type: DataType.SINGLE_PREC},
            tolerance: {ID: 0x0003, type: DataType.SINGLE_PREC},
        },
        commands: {},
        commandsResponse: {},
    },
    msHydrogen: {
        // H
        ID: 0x0410, // 0x0410
        attributes: {
            measuredValue: {ID: 0x0000, type: DataType.SINGLE_PREC},
            minMeasuredValue: {ID: 0x0001, type: DataType.SINGLE_PREC},
            maxMeasuredValue: {ID: 0x0002, type: DataType.SINGLE_PREC},
            tolerance: {ID: 0x0003, type: DataType.SINGLE_PREC},
        },
        commands: {},
        commandsResponse: {},
    },
    msHydrogenSulfide: {
        // H2S
        ID: 0x0411, // 0x0411
        attributes: {
            measuredValue: {ID: 0x0000, type: DataType.SINGLE_PREC},
            minMeasuredValue: {ID: 0x0001, type: DataType.SINGLE_PREC},
            maxMeasuredValue: {ID: 0x0002, type: DataType.SINGLE_PREC},
            tolerance: {ID: 0x0003, type: DataType.SINGLE_PREC},
        },
        commands: {},
        commandsResponse: {},
    },
    msNitricOxide: {
        // NO
        ID: 0x0412, // 0x0412
        attributes: {
            measuredValue: {ID: 0x0000, type: DataType.SINGLE_PREC},
            minMeasuredValue: {ID: 0x0001, type: DataType.SINGLE_PREC},
            maxMeasuredValue: {ID: 0x0002, type: DataType.SINGLE_PREC},
            tolerance: {ID: 0x0003, type: DataType.SINGLE_PREC},
        },
        commands: {},
        commandsResponse: {},
    },
    msNitrogenDioxide: {
        // NO2
        ID: 0x0413, // 0x0413
        attributes: {
            measuredValue: {ID: 0x0000, type: DataType.SINGLE_PREC},
            minMeasuredValue: {ID: 0x0001, type: DataType.SINGLE_PREC},
            maxMeasuredValue: {ID: 0x0002, type: DataType.SINGLE_PREC},
            tolerance: {ID: 0x0003, type: DataType.SINGLE_PREC},
        },
        commands: {},
        commandsResponse: {},
    },
    msOxygen: {
        // O2
        ID: 0x0414, // 0x0414
        attributes: {
            measuredValue: {ID: 0x0000, type: DataType.SINGLE_PREC},
            minMeasuredValue: {ID: 0x0001, type: DataType.SINGLE_PREC},
            maxMeasuredValue: {ID: 0x0002, type: DataType.SINGLE_PREC},
            tolerance: {ID: 0x0003, type: DataType.SINGLE_PREC},
        },
        commands: {},
        commandsResponse: {},
    },
    msOzone: {
        // O3
        ID: 0x0415, // 0x0415
        attributes: {
            measuredValue: {ID: 0x0000, type: DataType.SINGLE_PREC},
            minMeasuredValue: {ID: 0x0001, type: DataType.SINGLE_PREC},
            maxMeasuredValue: {ID: 0x0002, type: DataType.SINGLE_PREC},
            tolerance: {ID: 0x0003, type: DataType.SINGLE_PREC},
        },
        commands: {},
        commandsResponse: {},
    },
    msSulfurDioxide: {
        // SO2
        ID: 0x0416, // 0x0416
        attributes: {
            measuredValue: {ID: 0x0000, type: DataType.SINGLE_PREC},
            minMeasuredValue: {ID: 0x0001, type: DataType.SINGLE_PREC},
            maxMeasuredValue: {ID: 0x0002, type: DataType.SINGLE_PREC},
            tolerance: {ID: 0x0003, type: DataType.SINGLE_PREC},
        },
        commands: {},
        commandsResponse: {},
    },
    msDissolvedOxygen: {
        // DO
        ID: 0x0417, // 0x0417
        attributes: {
            measuredValue: {ID: 0x0000, type: DataType.SINGLE_PREC},
            minMeasuredValue: {ID: 0x0001, type: DataType.SINGLE_PREC},
            maxMeasuredValue: {ID: 0x0002, type: DataType.SINGLE_PREC},
            tolerance: {ID: 0x0003, type: DataType.SINGLE_PREC},
        },
        commands: {},
        commandsResponse: {},
    },
    msBromate: {
        ID: 0x0418, // 0x0418
        attributes: {
            measuredValue: {ID: 0x0000, type: DataType.SINGLE_PREC},
            minMeasuredValue: {ID: 0x0001, type: DataType.SINGLE_PREC},
            maxMeasuredValue: {ID: 0x0002, type: DataType.SINGLE_PREC},
            tolerance: {ID: 0x0003, type: DataType.SINGLE_PREC},
        },
        commands: {},
        commandsResponse: {},
    },
    msChloramines: {
        ID: 0x0419, // 0x0419
        attributes: {
            measuredValue: {ID: 0x0000, type: DataType.SINGLE_PREC},
            minMeasuredValue: {ID: 0x0001, type: DataType.SINGLE_PREC},
            maxMeasuredValue: {ID: 0x0002, type: DataType.SINGLE_PREC},
            tolerance: {ID: 0x0003, type: DataType.SINGLE_PREC},
        },
        commands: {},
        commandsResponse: {},
    },
    msChlorine: {
        ID: 0x041a, // 0x041a
        attributes: {
            measuredValue: {ID: 0x0000, type: DataType.SINGLE_PREC},
            minMeasuredValue: {ID: 0x0001, type: DataType.SINGLE_PREC},
            maxMeasuredValue: {ID: 0x0002, type: DataType.SINGLE_PREC},
            tolerance: {ID: 0x0003, type: DataType.SINGLE_PREC},
        },
        commands: {},
        commandsResponse: {},
    },
    msFecalColiformAndEColi: {
        ID: 0x041b, // 0x041b
        attributes: {
            measuredValue: {ID: 0x0000, type: DataType.SINGLE_PREC},
            minMeasuredValue: {ID: 0x0001, type: DataType.SINGLE_PREC},
            maxMeasuredValue: {ID: 0x0002, type: DataType.SINGLE_PREC},
            tolerance: {ID: 0x0003, type: DataType.SINGLE_PREC},
        },
        commands: {},
        commandsResponse: {},
    },
    msFluoride: {
        ID: 0x041c, // 0x041c
        attributes: {
            measuredValue: {ID: 0x0000, type: DataType.SINGLE_PREC},
            minMeasuredValue: {ID: 0x0001, type: DataType.SINGLE_PREC},
            maxMeasuredValue: {ID: 0x0002, type: DataType.SINGLE_PREC},
            tolerance: {ID: 0x0003, type: DataType.SINGLE_PREC},
        },
        commands: {},
        commandsResponse: {},
    },
    msHaloaceticAcids: {
        ID: 0x041d, // 0x041d
        attributes: {
            measuredValue: {ID: 0x0000, type: DataType.SINGLE_PREC},
            minMeasuredValue: {ID: 0x0001, type: DataType.SINGLE_PREC},
            maxMeasuredValue: {ID: 0x0002, type: DataType.SINGLE_PREC},
            tolerance: {ID: 0x0003, type: DataType.SINGLE_PREC},
        },
        commands: {},
        commandsResponse: {},
    },
    msTotalTrihalomethanes: {
        ID: 0x041e, // 0x041e
        attributes: {
            measuredValue: {ID: 0x0000, type: DataType.SINGLE_PREC},
            minMeasuredValue: {ID: 0x0001, type: DataType.SINGLE_PREC},
            maxMeasuredValue: {ID: 0x0002, type: DataType.SINGLE_PREC},
            tolerance: {ID: 0x0003, type: DataType.SINGLE_PREC},
        },
        commands: {},
        commandsResponse: {},
    },
    msTotalColiformBacteria: {
        ID: 0x041f, // 0x041f
        attributes: {
            measuredValue: {ID: 0x0000, type: DataType.SINGLE_PREC},
            minMeasuredValue: {ID: 0x0001, type: DataType.SINGLE_PREC},
            maxMeasuredValue: {ID: 0x0002, type: DataType.SINGLE_PREC},
            tolerance: {ID: 0x0003, type: DataType.SINGLE_PREC},
        },
        commands: {},
        commandsResponse: {},
    },
    msTurbidity: {
        ID: 0x0420, // 0x0420
        attributes: {
            measuredValue: {ID: 0x0000, type: DataType.SINGLE_PREC},
            minMeasuredValue: {ID: 0x0001, type: DataType.SINGLE_PREC},
            maxMeasuredValue: {ID: 0x0002, type: DataType.SINGLE_PREC},
            tolerance: {ID: 0x0003, type: DataType.SINGLE_PREC},
        },
        commands: {},
        commandsResponse: {},
    },
    msCopper: {
        ID: 0x0421, // 0x0421
        attributes: {
            measuredValue: {ID: 0x0000, type: DataType.SINGLE_PREC},
            minMeasuredValue: {ID: 0x0001, type: DataType.SINGLE_PREC},
            maxMeasuredValue: {ID: 0x0002, type: DataType.SINGLE_PREC},
            tolerance: {ID: 0x0003, type: DataType.SINGLE_PREC},
        },
        commands: {},
        commandsResponse: {},
    },
    msLead: {
        ID: 0x0422, // 0x0422
        attributes: {
            measuredValue: {ID: 0x0000, type: DataType.SINGLE_PREC},
            minMeasuredValue: {ID: 0x0001, type: DataType.SINGLE_PREC},
            maxMeasuredValue: {ID: 0x0002, type: DataType.SINGLE_PREC},
            tolerance: {ID: 0x0003, type: DataType.SINGLE_PREC},
        },
        commands: {},
        commandsResponse: {},
    },
    msManganese: {
        ID: 0x0423, // 0x0423
        attributes: {
            measuredValue: {ID: 0x0000, type: DataType.SINGLE_PREC},
            minMeasuredValue: {ID: 0x0001, type: DataType.SINGLE_PREC},
            maxMeasuredValue: {ID: 0x0002, type: DataType.SINGLE_PREC},
            tolerance: {ID: 0x0003, type: DataType.SINGLE_PREC},
        },
        commands: {},
        commandsResponse: {},
    },
    msSulfate: {
        ID: 0x0424, // 0x0424
        attributes: {
            measuredValue: {ID: 0x0000, type: DataType.SINGLE_PREC},
            minMeasuredValue: {ID: 0x0001, type: DataType.SINGLE_PREC},
            maxMeasuredValue: {ID: 0x0002, type: DataType.SINGLE_PREC},
            tolerance: {ID: 0x0003, type: DataType.SINGLE_PREC},
        },
        commands: {},
        commandsResponse: {},
    },
    msBromodichloromethane: {
        ID: 0x0425, // 0x0425
        attributes: {
            measuredValue: {ID: 0x0000, type: DataType.SINGLE_PREC},
            minMeasuredValue: {ID: 0x0001, type: DataType.SINGLE_PREC},
            maxMeasuredValue: {ID: 0x0002, type: DataType.SINGLE_PREC},
            tolerance: {ID: 0x0003, type: DataType.SINGLE_PREC},
        },
        commands: {},
        commandsResponse: {},
    },
    msBromoform: {
        ID: 0x0426, // 0x0426
        attributes: {
            measuredValue: {ID: 0x0000, type: DataType.SINGLE_PREC},
            minMeasuredValue: {ID: 0x0001, type: DataType.SINGLE_PREC},
            maxMeasuredValue: {ID: 0x0002, type: DataType.SINGLE_PREC},
            tolerance: {ID: 0x0003, type: DataType.SINGLE_PREC},
        },
        commands: {},
        commandsResponse: {},
    },
    msChlorodibromomethane: {
        ID: 0x0427, // 0x0427
        attributes: {
            measuredValue: {ID: 0x0000, type: DataType.SINGLE_PREC},
            minMeasuredValue: {ID: 0x0001, type: DataType.SINGLE_PREC},
            maxMeasuredValue: {ID: 0x0002, type: DataType.SINGLE_PREC},
            tolerance: {ID: 0x0003, type: DataType.SINGLE_PREC},
        },
        commands: {},
        commandsResponse: {},
    },
    msChloroform: {
        ID: 0x0428, // 0x0428
        attributes: {
            measuredValue: {ID: 0x0000, type: DataType.SINGLE_PREC},
            minMeasuredValue: {ID: 0x0001, type: DataType.SINGLE_PREC},
            maxMeasuredValue: {ID: 0x0002, type: DataType.SINGLE_PREC},
            tolerance: {ID: 0x0003, type: DataType.SINGLE_PREC},
        },
        commands: {},
        commandsResponse: {},
    },
    msSodium: {
        ID: 0x0429, // 0x0429
        attributes: {
            measuredValue: {ID: 0x0000, type: DataType.SINGLE_PREC},
            minMeasuredValue: {ID: 0x0001, type: DataType.SINGLE_PREC},
            maxMeasuredValue: {ID: 0x0002, type: DataType.SINGLE_PREC},
            tolerance: {ID: 0x0003, type: DataType.SINGLE_PREC},
        },
        commands: {},
        commandsResponse: {},
    },
    pm25Measurement: {
        ID: 0x042a, // 0x042a
        attributes: {
            measuredValue: {ID: 0x0000, type: DataType.SINGLE_PREC},
            measuredMinValue: {ID: 0x0001, type: DataType.SINGLE_PREC},
            measuredMaxValue: {ID: 0x0002, type: DataType.SINGLE_PREC},
            tolerance: {ID: 0x0003, type: DataType.SINGLE_PREC},
        },
        commands: {},
        commandsResponse: {},
    },
    msFormaldehyde: {
        ID: 0x042b, // 0x042b
        attributes: {
            measuredValue: {ID: 0x0000, type: DataType.SINGLE_PREC},
            minMeasuredValue: {ID: 0x0001, type: DataType.SINGLE_PREC},
            maxMeasuredValue: {ID: 0x0002, type: DataType.SINGLE_PREC},
            tolerance: {ID: 0x0003, type: DataType.SINGLE_PREC},
        },
        commands: {},
        commandsResponse: {},
    },
    pm1Measurement: {
        // XXX: not in R8 spec?
        ID: 0x042c, // 0x042c
        attributes: {
            measuredValue: {ID: 0x0000, type: DataType.SINGLE_PREC},
            measuredMinValue: {ID: 0x0001, type: DataType.SINGLE_PREC},
            measuredMaxValue: {ID: 0x0002, type: DataType.SINGLE_PREC},
            tolerance: {ID: 0x0003, type: DataType.SINGLE_PREC},
        },
        commands: {},
        commandsResponse: {},
    },
    pm10Measurement: {
        // XXX: not in R8 spec?
        ID: 0x042d, // 0x042d
        attributes: {
            measuredValue: {ID: 0x0000, type: DataType.SINGLE_PREC},
            measuredMinValue: {ID: 0x0001, type: DataType.SINGLE_PREC},
            measuredMaxValue: {ID: 0x0002, type: DataType.SINGLE_PREC},
            tolerance: {ID: 0x0003, type: DataType.SINGLE_PREC},
        },
        commands: {},
        commandsResponse: {},
    },
    ssIasZone: {
        ID: 0x0500,
        attributes: {
            zoneState: {ID: 0x0000, type: DataType.ENUM8, required: true, max: 0xff, default: 0},
            zoneType: {ID: 0x0001, type: DataType.ENUM16, required: true},
            zoneStatus: {ID: 0x0002, type: DataType.BITMAP16, required: true, default: 0},
            iasCieAddr: {ID: 0x0010, type: DataType.IEEE_ADDR, writable: true, required: true},
            zoneId: {ID: 0x0011, type: DataType.UINT8, required: true, max: 0xff, default: 0xff},
            numZoneSensitivityLevelsSupported: {ID: 0x0012, type: DataType.UINT8, min: 2, max: 0xff, default: 2},
            currentZoneSensitivityLevel: {ID: 0x0013, type: DataType.UINT8, writable: true, max: 0xff, default: 0},
            develcoAlarmOffDelay: {ID: 0x8001, type: DataType.UINT16, manufacturerCode: ManufacturerCode.DEVELCO},
        },
        commands: {
            enrollRsp: {
                ID: 0x00,
                parameters: [
                    {name: "enrollrspcode", type: DataType.UINT8},
                    {name: "zoneid", type: DataType.UINT8},
                ],
                required: true,
            },
            initNormalOpMode: {ID: 0x01, parameters: []},
            initTestMode: {
                ID: 0x02,
                parameters: [
                    {name: "testModeDuration", type: DataType.UINT8},
                    {name: "currentZoneSensitivityLevel", type: DataType.UINT8},
                ],
            },
        },
        commandsResponse: {
            statusChangeNotification: {
                ID: 0x00,
                parameters: [
                    {name: "zonestatus", type: DataType.UINT16},
                    {name: "extendedstatus", type: DataType.UINT8},
                    {name: "zoneID", type: DataType.UINT8},
                    {name: "delay", type: DataType.UINT16},
                ],
                required: true,
            },
            enrollReq: {
                ID: 0x01,
                parameters: [
                    {name: "zonetype", type: DataType.UINT16},
                    {name: "manucode", type: DataType.UINT16},
                ],
                required: true,
            },
        },
    },
    ssIasAce: {
        ID: 0x0501,
        attributes: {},
        commands: {
            arm: {
                ID: 0x00,
                response: 0,
                parameters: [
                    {name: "armmode", type: DataType.UINT8},
                    {name: "code", type: DataType.CHAR_STR},
                    {name: "zoneid", type: DataType.UINT8},
                ],
                required: true,
            },
            bypass: {
                ID: 0x01,
                parameters: [
                    {name: "numofzones", type: DataType.UINT8},
                    {name: "zoneidlist", type: BuffaloZclDataType.LIST_UINT8},
                    {name: "armDisarmCode", type: DataType.CHAR_STR},
                ],
                required: true,
            },
            emergency: {ID: 0x02, parameters: [], required: true},
            fire: {ID: 0x03, parameters: [], required: true},
            panic: {ID: 0x04, parameters: [], required: true},
            getZoneIDMap: {ID: 0x05, response: 1, parameters: [], required: true},
            getZoneInfo: {ID: 0x06, response: 2, parameters: [{name: "zoneid", type: DataType.UINT8}], required: true},
            getPanelStatus: {ID: 0x07, response: 5, parameters: [], required: true},
            getBypassedZoneList: {ID: 0x08, parameters: [], required: true},
            getZoneStatus: {
                ID: 0x09,
                response: 8,
                parameters: [
                    {name: "startzoneid", type: DataType.UINT8},
                    {name: "maxnumzoneid", type: DataType.UINT8},
                    {name: "zonestatusmaskflag", type: DataType.UINT8},
                    {name: "zonestatusmask", type: DataType.UINT16},
                ],
                required: true,
            },
        },
        commandsResponse: {
            armRsp: {ID: 0x00, parameters: [{name: "armnotification", type: DataType.UINT8}], required: true},
            getZoneIDMapRsp: {
                ID: 0x01,
                parameters: [
                    {name: "zoneidmapsection0", type: DataType.UINT16},
                    {name: "zoneidmapsection1", type: DataType.UINT16},
                    {name: "zoneidmapsection2", type: DataType.UINT16},
                    {name: "zoneidmapsection3", type: DataType.UINT16},
                    {name: "zoneidmapsection4", type: DataType.UINT16},
                    {name: "zoneidmapsection5", type: DataType.UINT16},
                    {name: "zoneidmapsection6", type: DataType.UINT16},
                    {name: "zoneidmapsection7", type: DataType.UINT16},
                    {name: "zoneidmapsection8", type: DataType.UINT16},
                    {name: "zoneidmapsection9", type: DataType.UINT16},
                    {name: "zoneidmapsection10", type: DataType.UINT16},
                    {name: "zoneidmapsection11", type: DataType.UINT16},
                    {name: "zoneidmapsection12", type: DataType.UINT16},
                    {name: "zoneidmapsection13", type: DataType.UINT16},
                    {name: "zoneidmapsection14", type: DataType.UINT16},
                    {name: "zoneidmapsection15", type: DataType.UINT16},
                ],
                required: true,
            },
            getZoneInfoRsp: {
                ID: 0x02,
                parameters: [
                    {name: "zoneid", type: DataType.UINT8},
                    {name: "zonetype", type: DataType.UINT16},
                    {name: "ieeeaddr", type: DataType.IEEE_ADDR},
                    {name: "zonelabel", type: DataType.CHAR_STR},
                ],
                required: true,
            },
            zoneStatusChanged: {
                ID: 0x03,
                parameters: [
                    {name: "zoneid", type: DataType.UINT8},
                    {name: "zonestatus", type: DataType.UINT16},
                    {name: "audiblenotif", type: DataType.UINT8},
                    {name: "zonelabel", type: DataType.CHAR_STR},
                ],
                required: true,
            },
            panelStatusChanged: {
                ID: 0x04,
                parameters: [
                    {name: "panelstatus", type: DataType.UINT8},
                    {name: "secondsremain", type: DataType.UINT8},
                    {name: "audiblenotif", type: DataType.UINT8},
                    {name: "alarmstatus", type: DataType.UINT8},
                ],
                required: true,
            },
            getPanelStatusRsp: {
                ID: 0x05,
                parameters: [
                    {name: "panelstatus", type: DataType.UINT8},
                    {name: "secondsremain", type: DataType.UINT8},
                    {name: "audiblenotif", type: DataType.UINT8},
                    {name: "alarmstatus", type: DataType.UINT8},
                ],
                required: true,
            },
            setBypassedZoneList: {
                ID: 0x06,
                parameters: [
                    {name: "numofzones", type: DataType.UINT8},
                    {name: "zoneid", type: BuffaloZclDataType.LIST_UINT8},
                ],
                required: true,
            },
            bypassRsp: {
                ID: 0x07,
                parameters: [
                    {name: "numofzones", type: DataType.UINT8},
                    {name: "bypassresult", type: BuffaloZclDataType.LIST_UINT8},
                ],
                required: true,
            },
            getZoneStatusRsp: {
                ID: 0x08,
                parameters: [
                    {name: "zonestatuscomplete", type: DataType.UINT8},
                    {name: "numofzones", type: DataType.UINT8},
                    {name: "zoneinfo", type: BuffaloZclDataType.LIST_ZONEINFO},
                ],
                required: true,
            },
        },
    },
    ssIasWd: {
        ID: 0x0502,
        attributes: {
            maxDuration: {ID: 0x0000, type: DataType.UINT16, writable: true, required: true, max: 65534, default: 240},
        },
        commands: {
            startWarning: {
                ID: 0x00,
                parameters: [
                    {name: "startwarninginfo", type: DataType.UINT8},
                    {name: "warningduration", type: DataType.UINT16},
                    {name: "strobedutycycle", type: DataType.UINT8, max: 100},
                    {name: "strobelevel", type: DataType.UINT8},
                ],
                required: true,
            },
            squawk: {ID: 0x01, parameters: [{name: "squawkinfo", type: DataType.UINT8}], required: true},
        },
        commandsResponse: {},
    },
    piGenericTunnel: {
        ID: 0x0600,
        attributes: {
            maxIncomeTransSize: {ID: 0x0001, type: DataType.UINT16},
            maxOutgoTransSize: {ID: 0x0002, type: DataType.UINT16},
            protocolAddr: {ID: 0x0003, type: DataType.OCTET_STR},
        },
        commands: {
            matchProtocolAddr: {ID: 0x00, parameters: [{name: "protocoladdr", type: DataType.CHAR_STR}]},
        },
        commandsResponse: {
            matchProtocolAddrRsp: {
                ID: 0x00,
                parameters: [
                    {name: "devieeeaddr", type: DataType.IEEE_ADDR},
                    {name: "protocoladdr", type: DataType.CHAR_STR},
                ],
            },
            advertiseProtocolAddr: {ID: 0x01, parameters: [{name: "protocoladdr", type: DataType.CHAR_STR}]},
        },
    },
    piBacnetProtocolTunnel: {
        ID: 0x0601,
        attributes: {},
        commands: {
            transferNpdu: {ID: 0x00, parameters: [{name: "npdu", type: DataType.UINT8}]},
        },
        commandsResponse: {},
    },
    piAnalogInputReg: {
        ID: 0x0602,
        attributes: {
            covIncrement: {ID: 0x0016, type: DataType.SINGLE_PREC},
            deviceType: {ID: 0x001f, type: DataType.CHAR_STR},
            objectId: {ID: 0x004b, type: DataType.BAC_OID},
            objectName: {ID: 0x004d, type: DataType.CHAR_STR},
            objectType: {ID: 0x004f, type: DataType.ENUM16},
            updateInterval: {ID: 0x0076, type: DataType.UINT8},
            profileName: {ID: 0x00a8, type: DataType.CHAR_STR},
        },
        commands: {},
        commandsResponse: {},
    },
    piAnalogInputExt: {
        ID: 0x0603,
        attributes: {
            ackedTransitions: {ID: 0x0000, type: DataType.BITMAP8},
            notificationClass: {ID: 0x0011, type: DataType.UINT16},
            deadband: {ID: 0x0019, type: DataType.SINGLE_PREC},
            eventEnable: {ID: 0x0023, type: DataType.BITMAP8},
            eventState: {ID: 0x0024, type: DataType.ENUM8},
            highLimit: {ID: 0x002d, type: DataType.SINGLE_PREC},
            limitEnable: {ID: 0x0034, type: DataType.BITMAP8},
            lowLimit: {ID: 0x003b, type: DataType.SINGLE_PREC},
            notifyType: {ID: 0x0048, type: DataType.ENUM8},
            timeDelay: {ID: 0x0071, type: DataType.UINT8},
            eventTimeStamps: {ID: 0x0082, type: DataType.ARRAY},
        },
        commands: {
            transferApdu: {ID: 0x00, parameters: []},
            connectReq: {ID: 0x01, parameters: []},
            disconnectReq: {ID: 0x02, parameters: []},
            connectStatusNoti: {ID: 0x03, parameters: []},
        },
        commandsResponse: {},
    },
    piAnalogOutputReg: {
        ID: 0x0604,
        attributes: {
            covIncrement: {ID: 0x0016, type: DataType.SINGLE_PREC},
            deviceType: {ID: 0x001f, type: DataType.CHAR_STR},
            objectId: {ID: 0x004b, type: DataType.BAC_OID},
            objectName: {ID: 0x004d, type: DataType.CHAR_STR},
            objectType: {ID: 0x004f, type: DataType.ENUM16},
            updateInterval: {ID: 0x0076, type: DataType.UINT8},
            profileName: {ID: 0x00a8, type: DataType.CHAR_STR},
        },
        commands: {},
        commandsResponse: {},
    },
    piAnalogOutputExt: {
        ID: 0x0605,
        attributes: {
            ackedTransitions: {ID: 0x0000, type: DataType.BITMAP8},
            notificationClass: {ID: 0x0011, type: DataType.UINT16},
            deadband: {ID: 0x0019, type: DataType.SINGLE_PREC},
            eventEnable: {ID: 0x0023, type: DataType.BITMAP8},
            eventState: {ID: 0x0024, type: DataType.ENUM8},
            highLimit: {ID: 0x002d, type: DataType.SINGLE_PREC},
            limitEnable: {ID: 0x0034, type: DataType.BITMAP8},
            lowLimit: {ID: 0x003b, type: DataType.SINGLE_PREC},
            notifyType: {ID: 0x0048, type: DataType.ENUM8},
            timeDelay: {ID: 0x0071, type: DataType.UINT8},
            eventTimeStamps: {ID: 0x0082, type: DataType.ARRAY},
        },
        commands: {},
        commandsResponse: {},
    },
    piAnalogValueReg: {
        ID: 0x0606,
        attributes: {
            covIncrement: {ID: 0x0016, type: DataType.SINGLE_PREC},
            objectId: {ID: 0x004b, type: DataType.BAC_OID},
            objectName: {ID: 0x004d, type: DataType.CHAR_STR},
            objectType: {ID: 0x004f, type: DataType.ENUM16},
            profileName: {ID: 0x00a8, type: DataType.CHAR_STR},
        },
        commands: {},
        commandsResponse: {},
    },
    piAnalogValueExt: {
        ID: 0x0607,
        attributes: {
            ackedTransitions: {ID: 0x0000, type: DataType.BITMAP8},
            notificationClass: {ID: 0x0011, type: DataType.UINT16},
            deadband: {ID: 0x0019, type: DataType.SINGLE_PREC},
            eventEnable: {ID: 0x0023, type: DataType.BITMAP8},
            eventState: {ID: 0x0024, type: DataType.ENUM8},
            highLimit: {ID: 0x002d, type: DataType.SINGLE_PREC},
            limitEnable: {ID: 0x0034, type: DataType.BITMAP8},
            lowLimit: {ID: 0x003b, type: DataType.SINGLE_PREC},
            notifyType: {ID: 0x0048, type: DataType.ENUM8},
            timeDelay: {ID: 0x0071, type: DataType.UINT8},
            eventTimeStamps: {ID: 0x0082, type: DataType.ARRAY},
        },
        commands: {},
        commandsResponse: {},
    },
    piBinaryInputReg: {
        ID: 0x0608,
        attributes: {
            changeOfStateCount: {ID: 0x000f, type: DataType.UINT32},
            changeOfStateTime: {ID: 0x0010, type: DataType.STRUCT},
            deviceType: {ID: 0x001f, type: DataType.CHAR_STR},
            elapsedActiveTime: {ID: 0x0021, type: DataType.UINT32},
            objectIdentifier: {ID: 0x004b, type: DataType.BAC_OID},
            objectName: {ID: 0x004d, type: DataType.CHAR_STR},
            objectType: {ID: 0x004f, type: DataType.ENUM16},
            timeOfATReset: {ID: 0x0072, type: DataType.STRUCT},
            timeOfSCReset: {ID: 0x0073, type: DataType.STRUCT},
            profileName: {ID: 0x00a8, type: DataType.CHAR_STR},
        },
        commands: {},
        commandsResponse: {},
    },
    piBinaryInputExt: {
        ID: 0x0609,
        attributes: {
            ackedTransitions: {ID: 0x0000, type: DataType.BITMAP8},
            alarmValue: {ID: 0x0006, type: DataType.BOOLEAN},
            notificationClass: {ID: 0x0011, type: DataType.UINT16},
            eventEnable: {ID: 0x0023, type: DataType.BITMAP8},
            eventState: {ID: 0x0024, type: DataType.ENUM8},
            notifyType: {ID: 0x0048, type: DataType.ENUM8},
            timeDelay: {ID: 0x0071, type: DataType.UINT8},
            eventTimeStamps: {ID: 0x0082, type: DataType.ARRAY},
        },
        commands: {},
        commandsResponse: {},
    },
    piBinaryOutputReg: {
        ID: 0x060a,
        attributes: {
            changeOfStateCount: {ID: 0x000f, type: DataType.UINT32},
            changeOfStateTime: {ID: 0x0010, type: DataType.STRUCT},
            deviceType: {ID: 0x001f, type: DataType.CHAR_STR},
            elapsedActiveTime: {ID: 0x0021, type: DataType.UINT32},
            feedBackValue: {ID: 0x0028, type: DataType.ENUM8},
            objectIdentifier: {ID: 0x004b, type: DataType.BAC_OID},
            objectName: {ID: 0x004d, type: DataType.CHAR_STR},
            objectType: {ID: 0x004f, type: DataType.ENUM16},
            timeOfATReset: {ID: 0x0072, type: DataType.STRUCT},
            timeOfSCReset: {ID: 0x0073, type: DataType.STRUCT},
            profileName: {ID: 0x00a8, type: DataType.CHAR_STR},
        },
        commands: {},
        commandsResponse: {},
    },
    piBinaryOutputExt: {
        ID: 0x060b,
        attributes: {
            ackedTransitions: {ID: 0x0000, type: DataType.BITMAP8},
            notificationClass: {ID: 0x0011, type: DataType.UINT16},
            eventEnable: {ID: 0x0023, type: DataType.BITMAP8},
            eventState: {ID: 0x0024, type: DataType.ENUM8},
            notifyType: {ID: 0x0048, type: DataType.ENUM8},
            timeDelay: {ID: 0x0071, type: DataType.UINT8},
            eventTimeStamps: {ID: 0x0082, type: DataType.ARRAY},
        },
        commands: {},
        commandsResponse: {},
    },
    piBinaryValueReg: {
        ID: 0x060c,
        attributes: {
            changeOfStateCount: {ID: 0x000f, type: DataType.UINT32},
            changeOfStateTime: {ID: 0x0010, type: DataType.STRUCT},
            elapsedActiveTime: {ID: 0x0021, type: DataType.UINT32},
            objectIdentifier: {ID: 0x004b, type: DataType.BAC_OID},
            objectName: {ID: 0x004d, type: DataType.CHAR_STR},
            objectType: {ID: 0x004f, type: DataType.ENUM16},
            timeOfATReset: {ID: 0x0072, type: DataType.STRUCT},
            timeOfSCReset: {ID: 0x0073, type: DataType.STRUCT},
            profileName: {ID: 0x00a8, type: DataType.CHAR_STR},
        },
        commands: {},
        commandsResponse: {},
    },
    piBinaryValueExt: {
        ID: 0x060d,
        attributes: {
            ackedTransitions: {ID: 0x0000, type: DataType.BITMAP8},
            alarmValue: {ID: 0x0006, type: DataType.BOOLEAN},
            notificationClass: {ID: 0x0011, type: DataType.UINT16},
            eventEnable: {ID: 0x0023, type: DataType.BITMAP8},
            eventState: {ID: 0x0024, type: DataType.ENUM8},
            notifyType: {ID: 0x0048, type: DataType.ENUM8},
            timeDelay: {ID: 0x0071, type: DataType.UINT8},
            eventTimeStamps: {ID: 0x0082, type: DataType.ARRAY},
        },
        commands: {},
        commandsResponse: {},
    },
    piMultistateInputReg: {
        ID: 0x060e,
        attributes: {
            deviceType: {ID: 0x001f, type: DataType.CHAR_STR},
            objectId: {ID: 0x004b, type: DataType.BAC_OID},
            objectName: {ID: 0x004d, type: DataType.CHAR_STR},
            objectType: {ID: 0x004f, type: DataType.ENUM16},
            profileName: {ID: 0x00a8, type: DataType.CHAR_STR},
        },
        commands: {},
        commandsResponse: {},
    },
    piMultistateInputExt: {
        ID: 0x060f,
        attributes: {
            ackedTransitions: {ID: 0x0000, type: DataType.BITMAP8},
            alarmValue: {ID: 0x0006, type: DataType.UINT16},
            notificationClass: {ID: 0x0011, type: DataType.UINT16},
            eventEnable: {ID: 0x0023, type: DataType.BITMAP8},
            eventState: {ID: 0x0024, type: DataType.ENUM8},
            faultValues: {ID: 0x0025, type: DataType.UINT16},
            notifyType: {ID: 0x0048, type: DataType.ENUM8},
            timeDelay: {ID: 0x0071, type: DataType.UINT8},
            eventTimeStamps: {ID: 0x0082, type: DataType.ARRAY},
        },
        commands: {},
        commandsResponse: {},
    },
    piMultistateOutputReg: {
        ID: 0x0610,
        attributes: {
            deviceType: {ID: 0x001f, type: DataType.CHAR_STR},
            feedBackValue: {ID: 0x0028, type: DataType.ENUM8},
            objectId: {ID: 0x004b, type: DataType.BAC_OID},
            objectName: {ID: 0x004d, type: DataType.CHAR_STR},
            objectType: {ID: 0x004f, type: DataType.ENUM16},
            profileName: {ID: 0x00a8, type: DataType.CHAR_STR},
        },
        commands: {},
        commandsResponse: {},
    },
    piMultistateOutputExt: {
        ID: 0x0611,
        attributes: {
            ackedTransitions: {ID: 0x0000, type: DataType.BITMAP8},
            notificationClass: {ID: 0x0011, type: DataType.UINT16},
            eventEnable: {ID: 0x0023, type: DataType.BITMAP8},
            eventState: {ID: 0x0024, type: DataType.ENUM8},
            notifyType: {ID: 0x0048, type: DataType.ENUM8},
            timeDelay: {ID: 0x0071, type: DataType.UINT8},
            eventTimeStamps: {ID: 0x0082, type: DataType.ARRAY},
        },
        commands: {},
        commandsResponse: {},
    },
    piMultistateValueReg: {
        ID: 0x0612,
        attributes: {
            objectId: {ID: 0x004b, type: DataType.BAC_OID},
            objectName: {ID: 0x004d, type: DataType.CHAR_STR},
            objectType: {ID: 0x004f, type: DataType.ENUM16},
            profileName: {ID: 0x00a8, type: DataType.CHAR_STR},
        },
        commands: {},
        commandsResponse: {},
    },
    piMultistateValueExt: {
        ID: 0x0613,
        attributes: {
            ackedTransitions: {ID: 0x0000, type: DataType.BITMAP8},
            alarmValue: {ID: 0x0006, type: DataType.UINT16},
            notificationClass: {ID: 0x0011, type: DataType.UINT16},
            eventEnable: {ID: 0x0023, type: DataType.BITMAP8},
            eventState: {ID: 0x0024, type: DataType.ENUM8},
            faultValues: {ID: 0x0025, type: DataType.UINT16},
            notifyType: {ID: 0x0048, type: DataType.ENUM8},
            timeDelay: {ID: 0x0071, type: DataType.UINT8},
            eventTimeStamps: {ID: 0x0082, type: DataType.ARRAY},
        },
        commands: {},
        commandsResponse: {},
    },
    pi11073ProtocolTunnel: {
        ID: 0x0614,
        attributes: {
            deviceidList: {ID: 0x0000, type: DataType.ARRAY},
            managerTarget: {ID: 0x0001, type: DataType.IEEE_ADDR},
            managerEndpoint: {ID: 0x0002, type: DataType.UINT8},
            connected: {ID: 0x0003, type: DataType.BOOLEAN},
            preemptible: {ID: 0x0004, type: DataType.BOOLEAN},
            idleTimeout: {ID: 0x0005, type: DataType.UINT16},
        },
        commands: {
            transferApdu: {ID: 0x00, parameters: []},
            connectReq: {ID: 0x01, parameters: []},
            disconnectReq: {ID: 0x02, parameters: []},
            connectStatusNoti: {ID: 0x03, parameters: []},
        },
        commandsResponse: {},
    },
    piIso7818ProtocolTunnel: {
        ID: 0x0615,
        attributes: {
            status: {ID: 0x0000, type: DataType.UINT8},
        },
        commands: {},
        commandsResponse: {},
    },
    piRetailTunnel: {
        ID: 0x0617,
        attributes: {
            manufacturerCode: {ID: 0x0000, type: DataType.UINT16},
            msProfile: {ID: 0x0001, type: DataType.UINT16},
        },
        commands: {},
        commandsResponse: {},
    },
    seMetering: {
        ID: 0x0702,
        attributes: {
            currentSummDelivered: {ID: 0x0000, type: DataType.UINT48},
            currentSummReceived: {ID: 0x0001, type: DataType.UINT48},
            currentMaxDemandDelivered: {ID: 0x0002, type: DataType.UINT48},
            currentMaxDemandReceived: {ID: 0x0003, type: DataType.UINT48},
            dftSumm: {ID: 0x0004, type: DataType.UINT48},
            dailyFreezeTime: {ID: 0x0005, type: DataType.UINT16},
            powerFactor: {ID: 0x0006, type: DataType.INT8},
            readingSnapshotTime: {ID: 0x0007, type: DataType.UTC},
            currentMaxDemandDeliverdTime: {ID: 0x0008, type: DataType.UTC},
            currentMaxDemandReceivedTime: {ID: 0x0009, type: DataType.UTC},
            defaultUpdatePeriod: {ID: 0x000a, type: DataType.UINT8},
            fastPollUpdatePeriod: {ID: 0x000b, type: DataType.UINT8},
            currentBlockPeriodConsumpDelivered: {ID: 0x000c, type: DataType.UINT48},
            dailyConsumpTarget: {ID: 0x000d, type: DataType.UINT24},
            currentBlock: {ID: 0x000e, type: DataType.ENUM8},
            profileIntervalPeriod: {ID: 0x000f, type: DataType.ENUM8},
            intervalReadReportingPeriod: {ID: 0x0010, type: DataType.UINT16},
            presetReadingTime: {ID: 0x0011, type: DataType.UINT16},
            volumePerReport: {ID: 0x0012, type: DataType.UINT16},
            flowRestriction: {ID: 0x0013, type: DataType.UINT8},
            supplyStatus: {ID: 0x0014, type: DataType.ENUM8},
            currentInEnergyCarrierSumm: {ID: 0x0015, type: DataType.UINT48},
            currentOutEnergyCarrierSumm: {ID: 0x0016, type: DataType.UINT48},
            inletTempreature: {ID: 0x0017, type: DataType.INT24},
            outletTempreature: {ID: 0x0018, type: DataType.INT24},
            controlTempreature: {ID: 0x0019, type: DataType.INT24},
            currentInEnergyCarrierDemand: {ID: 0x001a, type: DataType.INT24},
            currentOutEnergyCarrierDemand: {ID: 0x001b, type: DataType.INT24},
            currentBlockPeriodConsumpReceived: {ID: 0x001d, type: DataType.UINT48},
            currentBlockReceived: {ID: 0x001e, type: DataType.UINT48},
            DFTSummationReceived: {ID: 0x001f, type: DataType.UINT48},
            activeRegisterTierDelivered: {ID: 0x0020, type: DataType.ENUM8},
            activeRegisterTierReceived: {ID: 0x0021, type: DataType.ENUM8},
            currentTier1SummDelivered: {ID: 0x0100, type: DataType.UINT48},
            currentTier1SummReceived: {ID: 0x0101, type: DataType.UINT48},
            currentTier2SummDelivered: {ID: 0x0102, type: DataType.UINT48},
            currentTier2SummReceived: {ID: 0x0103, type: DataType.UINT48},
            currentTier3SummDelivered: {ID: 0x0104, type: DataType.UINT48},
            currentTier3SummReceived: {ID: 0x0105, type: DataType.UINT48},
            currentTier4SummDelivered: {ID: 0x0106, type: DataType.UINT48},
            currentTier4SummReceived: {ID: 0x0107, type: DataType.UINT48},
            currentTier5SummDelivered: {ID: 0x0108, type: DataType.UINT48},
            currentTier5SummReceived: {ID: 0x0109, type: DataType.UINT48},
            currentTier6SummDelivered: {ID: 0x010a, type: DataType.UINT48},
            currentTier6SummReceived: {ID: 0x010b, type: DataType.UINT48},
            currentTier7SummDelivered: {ID: 0x010c, type: DataType.UINT48},
            currentTier7SummReceived: {ID: 0x010d, type: DataType.UINT48},
            currentTier8SummDelivered: {ID: 0x010e, type: DataType.UINT48},
            currentTier8SummReceived: {ID: 0x010f, type: DataType.UINT48},
            currentTier9SummDelivered: {ID: 0x0110, type: DataType.UINT48},
            currentTier9SummReceived: {ID: 0x0111, type: DataType.UINT48},
            currentTier10SummDelivered: {ID: 0x0112, type: DataType.UINT48},
            currentTier10SummReceived: {ID: 0x0113, type: DataType.UINT48},
            currentTier11SummDelivered: {ID: 0x0114, type: DataType.UINT48},
            currentTier11SummReceived: {ID: 0x0115, type: DataType.UINT48},
            currentTier12SummDelivered: {ID: 0x0116, type: DataType.UINT48},
            currentTier12SummReceived: {ID: 0x0117, type: DataType.UINT48},
            currentTier13SummDelivered: {ID: 0x0118, type: DataType.UINT48},
            currentTier13SummReceived: {ID: 0x0119, type: DataType.UINT48},
            currentTier14SummDelivered: {ID: 0x011a, type: DataType.UINT48},
            currentTier14SummReceived: {ID: 0x011b, type: DataType.UINT48},
            currentTier15SummDelivered: {ID: 0x011c, type: DataType.UINT48},
            currentTier15SummReceived: {ID: 0x011d, type: DataType.UINT48},
            status: {ID: 0x0200, type: DataType.BITMAP8},
            remainingBattLife: {ID: 0x0201, type: DataType.UINT8},
            hoursInOperation: {ID: 0x0202, type: DataType.UINT24},
            hoursInFault: {ID: 0x0203, type: DataType.UINT24},
            extendedStatus: {ID: 0x0204, type: DataType.BITMAP64},
            unitOfMeasure: {ID: 0x0300, type: DataType.ENUM8},
            multiplier: {ID: 0x0301, type: DataType.UINT24},
            divisor: {ID: 0x0302, type: DataType.UINT24},
            summaFormatting: {ID: 0x0303, type: DataType.BITMAP8},
            demandFormatting: {ID: 0x0304, type: DataType.BITMAP8},
            historicalConsumpFormatting: {ID: 0x0305, type: DataType.BITMAP8},
            meteringDeviceType: {ID: 0x0306, type: DataType.BITMAP8},
            siteId: {ID: 0x0307, type: DataType.OCTET_STR},
            meterSerialNumber: {ID: 0x0308, type: DataType.OCTET_STR},
            energyCarrierUnitOfMeas: {ID: 0x0309, type: DataType.ENUM8},
            energyCarrierSummFormatting: {ID: 0x030a, type: DataType.BITMAP8},
            energyCarrierDemandFormatting: {ID: 0x030b, type: DataType.BITMAP8},
            temperatureUnitOfMeas: {ID: 0x030c, type: DataType.ENUM8},
            temperatureFormatting: {ID: 0x030d, type: DataType.BITMAP8},
            moduleSerialNumber: {ID: 0x030e, type: DataType.OCTET_STR},
            operatingTariffLevel: {ID: 0x030f, type: DataType.OCTET_STR},
            instantaneousDemand: {ID: 0x0400, type: DataType.INT24},
            currentdayConsumpDelivered: {ID: 0x0401, type: DataType.UINT24},
            currentdayConsumpReceived: {ID: 0x0402, type: DataType.UINT24},
            previousdayConsumpDelivered: {ID: 0x0403, type: DataType.UINT24},
            previousdayConsumpReceived: {ID: 0x0404, type: DataType.UINT24},
            curPartProfileIntStartTimeDelivered: {ID: 0x0405, type: DataType.UTC},
            curPartProfileIntStartTimeReceived: {ID: 0x0406, type: DataType.UTC},
            curPartProfileIntValueDelivered: {ID: 0x0407, type: DataType.UINT24},
            curPartProfileIntValueReceived: {ID: 0x0408, type: DataType.UINT24},
            currentDayMaxPressure: {ID: 0x0409, type: DataType.UINT48},
            currentDayMinPressure: {ID: 0x040a, type: DataType.UINT48},
            previousDayMaxPressure: {ID: 0x040b, type: DataType.UINT48},
            previousDayMinPressure: {ID: 0x040c, type: DataType.UINT48},
            currentDayMaxDemand: {ID: 0x040d, type: DataType.INT24},
            previousDayMaxDemand: {ID: 0x040e, type: DataType.INT24},
            currentMonthMaxDemand: {ID: 0x040f, type: DataType.INT24},
            currentYearMaxDemand: {ID: 0x0410, type: DataType.INT24},
            currentdayMaxEnergyCarrDemand: {ID: 0x0411, type: DataType.INT24},
            previousdayMaxEnergyCarrDemand: {ID: 0x0412, type: DataType.INT24},
            curMonthMaxEnergyCarrDemand: {ID: 0x0413, type: DataType.INT24},
            curMonthMinEnergyCarrDemand: {ID: 0x0414, type: DataType.INT24},
            curYearMaxEnergyCarrDemand: {ID: 0x0415, type: DataType.INT24},
            curYearMinEnergyCarrDemand: {ID: 0x0416, type: DataType.INT24},
            maxNumberOfPeriodsDelivered: {ID: 0x0500, type: DataType.UINT8},
            currentDemandDelivered: {ID: 0x0600, type: DataType.UINT24},
            demandLimit: {ID: 0x0601, type: DataType.UINT24},
            demandIntegrationPeriod: {ID: 0x0602, type: DataType.UINT8},
            numberOfDemandSubintervals: {ID: 0x0603, type: DataType.UINT8},
            demandLimitArmDuration: {ID: 0x0604, type: DataType.UINT16},
            genericAlarmMask: {ID: 0x0800, type: DataType.BITMAP16},
            electricityAlarmMask: {ID: 0x0801, type: DataType.BITMAP32},
            genFlowPressureAlarmMask: {ID: 0x0802, type: DataType.BITMAP16},
            waterSpecificAlarmMask: {ID: 0x0803, type: DataType.BITMAP16},
            heatCoolSpecificAlarmMASK: {ID: 0x0804, type: DataType.BITMAP16},
            gasSpecificAlarmMask: {ID: 0x0805, type: DataType.BITMAP16},
            extendedGenericAlarmMask: {ID: 0x0806, type: DataType.BITMAP48},
            manufactureAlarmMask: {ID: 0x0807, type: DataType.BITMAP16},
            billToDate: {ID: 0x0a00, type: DataType.UINT32},
            billToDateTimeStamp: {ID: 0x0a01, type: DataType.UTC},
            projectedBill: {ID: 0x0a02, type: DataType.UINT32},
            projectedBillTimeStamp: {ID: 0x0a03, type: DataType.UTC},
            develcoPulseConfiguration: {ID: 0x0300, type: DataType.UINT16, manufacturerCode: ManufacturerCode.DEVELCO},
            develcoCurrentSummation: {ID: 0x0301, type: DataType.UINT48, manufacturerCode: ManufacturerCode.DEVELCO},
            develcoInterfaceMode: {ID: 0x0302, type: DataType.ENUM16, manufacturerCode: ManufacturerCode.DEVELCO},
            owonL1PhasePower: {ID: 0x2000, type: DataType.INT24, manufacturerCode: ManufacturerCode.OWON_TECHNOLOGY_INC},
            owonL2PhasePower: {ID: 0x2001, type: DataType.INT24, manufacturerCode: ManufacturerCode.OWON_TECHNOLOGY_INC},
            owonL3PhasePower: {ID: 0x2002, type: DataType.INT24, manufacturerCode: ManufacturerCode.OWON_TECHNOLOGY_INC},
            owonL1PhaseReactivePower: {ID: 0x2100, type: DataType.INT24, manufacturerCode: ManufacturerCode.OWON_TECHNOLOGY_INC},
            owonL2PhaseReactivePower: {ID: 0x2101, type: DataType.INT24, manufacturerCode: ManufacturerCode.OWON_TECHNOLOGY_INC},
            owonL3PhaseReactivePower: {ID: 0x2102, type: DataType.INT24, manufacturerCode: ManufacturerCode.OWON_TECHNOLOGY_INC},
            owonReactivePowerSum: {ID: 0x2103, type: DataType.INT24, manufacturerCode: ManufacturerCode.OWON_TECHNOLOGY_INC},
            owonL1PhaseVoltage: {ID: 0x3000, type: DataType.UINT24, manufacturerCode: ManufacturerCode.OWON_TECHNOLOGY_INC},
            owonL2PhaseVoltage: {ID: 0x3001, type: DataType.UINT24, manufacturerCode: ManufacturerCode.OWON_TECHNOLOGY_INC},
            owonL3PhaseVoltage: {ID: 0x3002, type: DataType.UINT24, manufacturerCode: ManufacturerCode.OWON_TECHNOLOGY_INC},
            owonL1PhaseCurrent: {ID: 0x3100, type: DataType.UINT24, manufacturerCode: ManufacturerCode.OWON_TECHNOLOGY_INC},
            owonL2PhaseCurrent: {ID: 0x3101, type: DataType.UINT24, manufacturerCode: ManufacturerCode.OWON_TECHNOLOGY_INC},
            owonL3PhaseCurrent: {ID: 0x3102, type: DataType.UINT24, manufacturerCode: ManufacturerCode.OWON_TECHNOLOGY_INC},
            owonCurrentSum: {ID: 0x3103, type: DataType.UINT24, manufacturerCode: ManufacturerCode.OWON_TECHNOLOGY_INC},
            owonLeakageCurrent: {ID: 0x3104, type: DataType.UINT24, manufacturerCode: ManufacturerCode.OWON_TECHNOLOGY_INC},
            owonL1Energy: {ID: 0x4000, type: DataType.UINT48, manufacturerCode: ManufacturerCode.OWON_TECHNOLOGY_INC},
            owonL2Energy: {ID: 0x4001, type: DataType.UINT48, manufacturerCode: ManufacturerCode.OWON_TECHNOLOGY_INC},
            owonL3Energy: {ID: 0x4002, type: DataType.UINT48, manufacturerCode: ManufacturerCode.OWON_TECHNOLOGY_INC},
            owonL1ReactiveEnergy: {ID: 0x4100, type: DataType.UINT48, manufacturerCode: ManufacturerCode.OWON_TECHNOLOGY_INC},
            owonL2ReactiveEnergy: {ID: 0x4101, type: DataType.UINT48, manufacturerCode: ManufacturerCode.OWON_TECHNOLOGY_INC},
            owonL3ReactiveEnergy: {ID: 0x4102, type: DataType.UINT48, manufacturerCode: ManufacturerCode.OWON_TECHNOLOGY_INC},
            owonReactiveEnergySum: {ID: 0x4103, type: DataType.UINT48, manufacturerCode: ManufacturerCode.OWON_TECHNOLOGY_INC},
            owonL1PowerFactor: {ID: 0x4104, type: DataType.INT8, manufacturerCode: ManufacturerCode.OWON_TECHNOLOGY_INC},
            owonL2PowerFactor: {ID: 0x4105, type: DataType.INT8, manufacturerCode: ManufacturerCode.OWON_TECHNOLOGY_INC},
            owonL3PowerFactor: {ID: 0x4106, type: DataType.INT8, manufacturerCode: ManufacturerCode.OWON_TECHNOLOGY_INC},
            owonFrequency: {ID: 0x5005, type: DataType.UINT8, manufacturerCode: ManufacturerCode.OWON_TECHNOLOGY_INC},
            owonReportMap: {ID: 0x1000, type: DataType.BITMAP8, manufacturerCode: ManufacturerCode.OWON_TECHNOLOGY_INC},
            owonLastHistoricalRecordTime: {ID: 0x5000, type: DataType.UINT32, manufacturerCode: ManufacturerCode.OWON_TECHNOLOGY_INC},
            owonOldestHistoricalRecordTime: {ID: 0x5001, type: DataType.UINT32, manufacturerCode: ManufacturerCode.OWON_TECHNOLOGY_INC},
            owonMinimumReportCycle: {ID: 0x5002, type: DataType.UINT32, manufacturerCode: ManufacturerCode.OWON_TECHNOLOGY_INC},
            owonMaximumReportCycle: {ID: 0x5003, type: DataType.UINT32, manufacturerCode: ManufacturerCode.OWON_TECHNOLOGY_INC},
            owonSentHistoricalRecordState: {ID: 0x5004, type: DataType.UINT8, manufacturerCode: ManufacturerCode.OWON_TECHNOLOGY_INC},
            owonAccumulativeEnergyThreshold: {ID: 0x5006, type: DataType.UINT8, manufacturerCode: ManufacturerCode.OWON_TECHNOLOGY_INC},
            owonReportMode: {ID: 0x5007, type: DataType.UINT8, manufacturerCode: ManufacturerCode.OWON_TECHNOLOGY_INC},
            owonPercentChangeInPower: {ID: 0x5008, type: DataType.UINT8, manufacturerCode: ManufacturerCode.OWON_TECHNOLOGY_INC},
            schneiderActiveEnergyTotal: {ID: 0x4010, type: DataType.INT48, manufacturerCode: ManufacturerCode.SCHNEIDER_ELECTRIC},
            schneiderReactiveEnergyTotal: {ID: 0x4011, type: DataType.INT48, manufacturerCode: ManufacturerCode.SCHNEIDER_ELECTRIC},
            schneiderApparentEnergyTotal: {ID: 0x4012, type: DataType.INT48, manufacturerCode: ManufacturerCode.SCHNEIDER_ELECTRIC},
            schneiderPartialActiveEnergyTotal: {ID: 0x4014, type: DataType.INT48, manufacturerCode: ManufacturerCode.SCHNEIDER_ELECTRIC},
            schneiderPartialReactiveEnergyTotal: {ID: 0x4015, type: DataType.INT48, manufacturerCode: ManufacturerCode.SCHNEIDER_ELECTRIC},
            schneiderPartialApparentEnergyTotal: {ID: 0x4016, type: DataType.INT48, manufacturerCode: ManufacturerCode.SCHNEIDER_ELECTRIC},
            schneiderPartialActiveEnergyL1Phase: {ID: 0x4100, type: DataType.INT48, manufacturerCode: ManufacturerCode.SCHNEIDER_ELECTRIC},
            schneiderPartialReactiveEnergyL1Phase: {ID: 0x4101, type: DataType.INT48, manufacturerCode: ManufacturerCode.SCHNEIDER_ELECTRIC},
            schneiderPartialApparentEnergyL1Phase: {ID: 0x4102, type: DataType.INT48, manufacturerCode: ManufacturerCode.SCHNEIDER_ELECTRIC},
            schneiderActiveEnergyL1Phase: {ID: 0x4103, type: DataType.INT48, manufacturerCode: ManufacturerCode.SCHNEIDER_ELECTRIC},
            schneiderReactiveEnergyL1Phase: {ID: 0x4104, type: DataType.INT48, manufacturerCode: ManufacturerCode.SCHNEIDER_ELECTRIC},
            schneiderApparentEnergyL1Phase: {ID: 0x4105, type: DataType.INT48, manufacturerCode: ManufacturerCode.SCHNEIDER_ELECTRIC},
            schneiderPartialActiveEnergyL2Phase: {ID: 0x4200, type: DataType.INT48, manufacturerCode: ManufacturerCode.SCHNEIDER_ELECTRIC},
            schneiderPartialReactiveEnergyL2Phase: {ID: 0x4201, type: DataType.INT48, manufacturerCode: ManufacturerCode.SCHNEIDER_ELECTRIC},
            schneiderPartialApparentEnergyL2Phase: {ID: 0x4202, type: DataType.INT48, manufacturerCode: ManufacturerCode.SCHNEIDER_ELECTRIC},
            schneiderActiveEnergyL2Phase: {ID: 0x4203, type: DataType.INT48, manufacturerCode: ManufacturerCode.SCHNEIDER_ELECTRIC},
            schneiderReactiveEnergyL2Phase: {ID: 0x4204, type: DataType.INT48, manufacturerCode: ManufacturerCode.SCHNEIDER_ELECTRIC},
            schneiderApparentEnergyL2Phase: {ID: 0x4205, type: DataType.INT48, manufacturerCode: ManufacturerCode.SCHNEIDER_ELECTRIC},
            schneiderPartialActiveEnergyL3Phase: {ID: 0x4300, type: DataType.INT48, manufacturerCode: ManufacturerCode.SCHNEIDER_ELECTRIC},
            schneiderPartialReactiveEnergyL3Phase: {ID: 0x4301, type: DataType.INT48, manufacturerCode: ManufacturerCode.SCHNEIDER_ELECTRIC},
            schneiderPartialApparentEnergyL3Phase: {ID: 0x4302, type: DataType.INT48, manufacturerCode: ManufacturerCode.SCHNEIDER_ELECTRIC},
            schneiderActiveEnergyL3Phase: {ID: 0x4303, type: DataType.INT48, manufacturerCode: ManufacturerCode.SCHNEIDER_ELECTRIC},
            schneiderReactiveEnergyL3Phase: {ID: 0x4304, type: DataType.INT48, manufacturerCode: ManufacturerCode.SCHNEIDER_ELECTRIC},
            schneiderApparentEnergyL3Phase: {ID: 0x4305, type: DataType.INT48, manufacturerCode: ManufacturerCode.SCHNEIDER_ELECTRIC},
            schneiderActiveEnergyMultiplier: {ID: 0x4400, type: DataType.UINT24, manufacturerCode: ManufacturerCode.SCHNEIDER_ELECTRIC},
            schneiderActiveEnergyDivisor: {ID: 0x4401, type: DataType.UINT24, manufacturerCode: ManufacturerCode.SCHNEIDER_ELECTRIC},
            schneiderReactiveEnergyMultiplier: {ID: 0x4402, type: DataType.UINT24, manufacturerCode: ManufacturerCode.SCHNEIDER_ELECTRIC},
            schneiderReactiveEnergyDivisor: {ID: 0x4403, type: DataType.UINT24, manufacturerCode: ManufacturerCode.SCHNEIDER_ELECTRIC},
            schneiderApparentEnergyMultiplier: {ID: 0x4404, type: DataType.UINT24, manufacturerCode: ManufacturerCode.SCHNEIDER_ELECTRIC},
            schneiderApparentEnergyDivisor: {ID: 0x4405, type: DataType.UINT24, manufacturerCode: ManufacturerCode.SCHNEIDER_ELECTRIC},
            schneiderEnergyResetDateTime: {ID: 0x4501, type: DataType.UTC, manufacturerCode: ManufacturerCode.SCHNEIDER_ELECTRIC},
            schneiderEnergyCountersReportingPeriod: {ID: 0x4600, type: DataType.UINT16, manufacturerCode: ManufacturerCode.SCHNEIDER_ELECTRIC},
        },
        commands: {
            getProfile: {ID: 0x00, parameters: []},
            reqMirror: {ID: 0x01, parameters: []},
            mirrorRem: {ID: 0x02, parameters: []},
            reqFastPollMode: {ID: 0x03, parameters: []},
            getSnapshot: {ID: 0x04, parameters: []},
            takeSnapshot: {ID: 0x05, parameters: []},
            mirrorReportAttrRsp: {ID: 0x06, parameters: []},
            owonGetHistoryRecord: {ID: 0x20, parameters: []},
            owonStopSendingHistoricalRecord: {ID: 0x21, parameters: []},
        },
        commandsResponse: {
            getProfileRsp: {ID: 0x00, parameters: []},
            reqMirrorRsp: {ID: 0x01, parameters: []},
            mirrorRemRsp: {ID: 0x02, parameters: []},
            reqFastPollModeRsp: {ID: 0x03, parameters: []},
            getSnapshotRsp: {ID: 0x04, parameters: []},
            owonGetHistoryRecordRsp: {ID: 0x20, parameters: []},
        },
    },
    tunneling: {
        ID: 0x0704,
        attributes: {},
        commands: {
            requestTunnel: {
                ID: 0x00,
                response: 0,
                parameters: [
                    {name: "protocolId", type: DataType.ENUM8},
                    {name: "manufCode", type: DataType.UINT16},
                    {name: "flowControl", type: DataType.BOOLEAN},
                    {name: "mtuSize", type: DataType.UINT16},
                ],
            },
            closeTunnel: {ID: 0x01, parameters: [{name: "tunnelId", type: DataType.UINT16}]},
            transferData: {
                ID: 0x02,
                parameters: [
                    {name: "tunnelId", type: DataType.UINT16},
                    {name: "data", type: BuffaloZclDataType.BUFFER},
                ],
            },
            transferDataError: {
                ID: 0x03,
                parameters: [
                    {name: "tunnelId", type: DataType.UINT16},
                    {name: "status", type: DataType.UINT8},
                ],
            },
        },
        commandsResponse: {
            requestTunnelResp: {
                ID: 0x00,
                parameters: [
                    {name: "tunnelId", type: DataType.UINT16},
                    {name: "tunnelStatus", type: DataType.UINT8},
                    {name: "mtuSize", type: DataType.UINT16},
                ],
            },
            transferDataResp: {
                ID: 0x01,
                parameters: [
                    {name: "tunnelId", type: DataType.UINT16},
                    {name: "data", type: BuffaloZclDataType.BUFFER},
                ],
            },
            transferDataErrorResp: {
                ID: 0x02,
                parameters: [
                    {name: "tunnelId", type: DataType.UINT16},
                    {name: "status", type: DataType.UINT8},
                ],
            },
        },
    },
    telecommunicationsInformation: {
        ID: 0x0900,
        attributes: {
            nodeDescription: {ID: 0x0000, type: DataType.CHAR_STR},
            deliveryEnable: {ID: 0x0001, type: DataType.BOOLEAN},
            pushInformationTimer: {ID: 0x0002, type: DataType.UINT32},
            enableSecureConfiguration: {ID: 0x0003, type: DataType.BOOLEAN},
            numberOfContents: {ID: 0x0010, type: DataType.UINT16},
            contentRootID: {ID: 0x0011, type: DataType.UINT16},
        },
        commands: {},
        commandsResponse: {},
    },
    telecommunicationsVoiceOverZigbee: {
        ID: 0x0904,
        attributes: {
            codecType: {ID: 0x0000, type: DataType.ENUM8},
            samplingFrequency: {ID: 0x0001, type: DataType.ENUM8},
            codecrate: {ID: 0x0002, type: DataType.ENUM8},
            establishmentTimeout: {ID: 0x0003, type: DataType.UINT8},
            codecTypeSub1: {ID: 0x0004, type: DataType.ENUM8},
            codecTypeSub2: {ID: 0x0005, type: DataType.ENUM8},
            codecTypeSub3: {ID: 0x0006, type: DataType.ENUM8},
            compressionType: {ID: 0x0007, type: DataType.ENUM8},
            compressionRate: {ID: 0x0008, type: DataType.ENUM8},
            optionFlags: {ID: 0x0009, type: DataType.BITMAP8},
            threshold: {ID: 0x000a, type: DataType.UINT8},
        },
        commands: {},
        commandsResponse: {},
    },
    telecommunicationsChatting: {
        ID: 0x0905,
        attributes: {
            uID: {ID: 0x0000, type: DataType.UINT16},
            nickname: {ID: 0x0001, type: DataType.CHAR_STR},
            cID: {ID: 0x0010, type: DataType.UINT16},
            name: {ID: 0x0011, type: DataType.CHAR_STR},
            enableAddChat: {ID: 0x0012, type: DataType.BOOLEAN},
        },
        commands: {},
        commandsResponse: {},
    },
    haApplianceIdentification: {
        ID: 0x0b00,
        attributes: {
            basicIdentification: {ID: 0x0000, type: DataType.UINT56},
            companyName: {ID: 0x0010, type: DataType.CHAR_STR},
            companyId: {ID: 0x0011, type: DataType.UINT16},
            brandName: {ID: 0x0012, type: DataType.CHAR_STR},
            brandId: {ID: 0x0013, type: DataType.UINT16},
            model: {ID: 0x0014, type: DataType.OCTET_STR},
            partNumber: {ID: 0x0015, type: DataType.OCTET_STR},
            productRevision: {ID: 0x0016, type: DataType.OCTET_STR},
            softwareRevision: {ID: 0x0017, type: DataType.OCTET_STR},
            productTypeName: {ID: 0x0018, type: DataType.OCTET_STR},
            productTypeId: {ID: 0x0019, type: DataType.UINT16},
            cecedSpecificationVersion: {ID: 0x001a, type: DataType.UINT8},
        },
        commands: {},
        commandsResponse: {},
    },
    haMeterIdentification: {
        ID: 0x0b01,
        attributes: {
            companyName: {ID: 0x0000, type: DataType.CHAR_STR},
            meterTypeId: {ID: 0x0001, type: DataType.UINT16},
            dataQualityId: {ID: 0x0004, type: DataType.UINT16},
            customerName: {ID: 0x0005, type: DataType.CHAR_STR},
            model: {ID: 0x0006, type: DataType.CHAR_STR},
            partNumber: {ID: 0x0007, type: DataType.CHAR_STR},
            productRevision: {ID: 0x0008, type: DataType.CHAR_STR},
            softwareRevision: {ID: 0x000a, type: DataType.CHAR_STR},
            utilityName: {ID: 0x000b, type: DataType.CHAR_STR},
            pod: {ID: 0x000c, type: DataType.CHAR_STR},
            availablePower: {ID: 0x000d, type: DataType.INT24},
            powerThreshold: {ID: 0x000e, type: DataType.INT24},
        },
        commands: {},
        commandsResponse: {},
    },
    haApplianceEventsAlerts: {
        ID: 0x0b02,
        attributes: {},
        commands: {
            getAlerts: {ID: 0x00, parameters: []},
        },
        commandsResponse: {
            getAlertsRsp: {
                ID: 0x00,
                parameters: [
                    {name: "alertscount", type: DataType.UINT8},
                    {name: "aalert", type: BuffaloZclDataType.LIST_UINT24},
                ],
            },
            alertsNotification: {
                ID: 0x01,
                parameters: [
                    {name: "alertscount", type: DataType.UINT8},
                    {name: "aalert", type: BuffaloZclDataType.LIST_UINT24},
                ],
            },
            eventNotification: {
                ID: 0x02,
                parameters: [
                    {name: "eventheader", type: DataType.UINT8},
                    {name: "eventid", type: DataType.UINT8},
                ],
            },
        },
    },
    haApplianceStatistics: {
        ID: 0x0b03,
        attributes: {
            logMaxSize: {ID: 0x0000, type: DataType.UINT32},
            logQueueMaxSize: {ID: 0x0001, type: DataType.UINT8},
        },
        commands: {
            log: {ID: 0x00, parameters: [{name: "logid", type: DataType.UINT32}]},
            logQueue: {ID: 0x01, parameters: []},
        },
        commandsResponse: {
            logNotification: {
                ID: 0x00,
                parameters: [
                    {name: "timestamp", type: DataType.UINT32},
                    {name: "logid", type: DataType.UINT32},
                    {name: "loglength", type: DataType.UINT32},
                    {name: "logpayload", type: BuffaloZclDataType.LIST_UINT8},
                ],
            },
            logRsp: {
                ID: 0x01,
                parameters: [
                    {name: "timestamp", type: DataType.UINT32},
                    {name: "logid", type: DataType.UINT32},
                    {name: "loglength", type: DataType.UINT32},
                    {name: "logpayload", type: BuffaloZclDataType.LIST_UINT8},
                ],
            },
            logQueueRsp: {
                ID: 0x02,
                parameters: [
                    {name: "logqueuesize", type: DataType.UINT8},
                    {name: "logid", type: BuffaloZclDataType.LIST_UINT32},
                ],
            },
            statisticsAvailable: {
                ID: 0x03,
                parameters: [
                    {name: "logqueuesize", type: DataType.UINT8},
                    {name: "logid", type: BuffaloZclDataType.LIST_UINT32},
                ],
            },
        },
    },
    haElectricalMeasurement: {
        ID: 0x0b04,
        attributes: {
            measurementType: {ID: 0x0000, type: DataType.BITMAP32, required: true, default: 0},
            dcVoltage: {ID: 0x0100, type: DataType.INT16, reportRequired: true, min: -32767, default: -32768},
            dcVoltageMin: {ID: 0x0101, type: DataType.INT16, min: -32767, default: -32768},
            dcvoltagemax: {ID: 0x0102, type: DataType.INT16, min: -32767, default: -32768},
            dcCurrent: {ID: 0x0103, type: DataType.INT16, reportRequired: true, min: -32767, default: -32768},
            dcCurrentMin: {ID: 0x0104, type: DataType.INT16, min: -32767, default: -32768},
            dcCurrentMax: {ID: 0x0105, type: DataType.INT16, min: -32767, default: -32768},
            dcPower: {ID: 0x0106, type: DataType.INT16, reportRequired: true, min: -32767, default: -32768},
            dcPowerMin: {ID: 0x0107, type: DataType.INT16, min: -32767, default: -32768},
            dcPowerMax: {ID: 0x0108, type: DataType.INT16, min: -32767, default: -32768},
            dcVoltageMultiplier: {ID: 0x0200, type: DataType.UINT16, reportRequired: true, min: 1, default: 1},
            dcVoltageDivisor: {ID: 0x0201, type: DataType.UINT16, reportRequired: true, min: 1, default: 1},
            dcCurrentMultiplier: {ID: 0x0202, type: DataType.UINT16, reportRequired: true, min: 1, default: 1},
            dcCurrentDivisor: {ID: 0x0203, type: DataType.UINT16, reportRequired: true, min: 1, default: 1},
            dcPowerMultiplier: {ID: 0x0204, type: DataType.UINT16, reportRequired: true, min: 1, default: 1},
            dcPowerDivisor: {ID: 0x0205, type: DataType.UINT16, reportRequired: true, min: 1, default: 1},
            acFrequency: {ID: 0x0300, type: DataType.UINT16, reportRequired: true, default: 65535},
            acFrequencyMin: {ID: 0x0301, type: DataType.UINT16, default: 65535},
            acFrequencyMax: {ID: 0x0302, type: DataType.UINT16, default: 65535},
            neutralCurrent: {ID: 0x0303, type: DataType.UINT16, reportRequired: true, default: 65535},
            totalActivePower: {ID: 0x0304, type: DataType.INT32, reportRequired: true, min: -8388607, max: 8388607},
            totalReactivePower: {ID: 0x0305, type: DataType.INT32, reportRequired: true, min: -8388607, max: 8388607},
            totalApparentPower: {ID: 0x0306, type: DataType.UINT32, reportRequired: true, max: 16777215},
            meas1stHarmonicCurrent: {ID: 0x0307, type: DataType.INT16, reportRequired: true, default: -32768},
            meas3rdHarmonicCurrent: {ID: 0x0308, type: DataType.INT16, reportRequired: true, default: -32768},
            meas5thHarmonicCurrent: {ID: 0x0309, type: DataType.INT16, reportRequired: true, default: -32768},
            meas7thHarmonicCurrent: {ID: 0x030a, type: DataType.INT16, reportRequired: true, default: -32768},
            meas9thHarmonicCurrent: {ID: 0x030b, type: DataType.INT16, reportRequired: true, default: -32768},
            meas11thHarmonicCurrent: {ID: 0x030c, type: DataType.INT16, reportRequired: true, default: -32768},
            measPhase1stHarmonicCurrent: {ID: 0x030d, type: DataType.INT16, reportRequired: true, default: -32768},
            measPhase3rdHarmonicCurrent: {ID: 0x030e, type: DataType.INT16, reportRequired: true, default: -32768},
            measPhase5thHarmonicCurrent: {ID: 0x030f, type: DataType.INT16, reportRequired: true, default: -32768},
            measPhase7thHarmonicCurrent: {ID: 0x0310, type: DataType.INT16, reportRequired: true, default: -32768},
            measPhase9thHarmonicCurrent: {ID: 0x0311, type: DataType.INT16, reportRequired: true, default: -32768},
            measPhase11thHarmonicCurrent: {ID: 0x0312, type: DataType.INT16, reportRequired: true, default: -32768},
            acFrequencyMultiplier: {ID: 0x0400, type: DataType.UINT16, reportRequired: true, min: 1, default: 1},
            acFrequencyDivisor: {ID: 0x0401, type: DataType.UINT16, reportRequired: true, min: 1, default: 1},
            powerMultiplier: {ID: 0x0402, type: DataType.UINT32, reportRequired: true, max: 16777215, default: 1},
            powerDivisor: {ID: 0x0403, type: DataType.UINT32, reportRequired: true, max: 16777215, default: 1},
            harmonicCurrentMultiplier: {ID: 0x0404, type: DataType.INT8, reportRequired: true, min: -127, default: 0},
            phaseHarmonicCurrentMultiplier: {ID: 0x0405, type: DataType.INT8, reportRequired: true, min: -127, default: 0},
            instantaneousVoltage: {ID: 0x0500, type: DataType.INT16},
            instantaneousLineCurrent: {ID: 0x0501, type: DataType.UINT16, reportRequired: true, default: 65535},
            instantaneousActiveCurrent: {ID: 0x0502, type: DataType.INT16, reportRequired: true, default: -32768},
            instantaneousReactiveCurrent: {ID: 0x0503, type: DataType.INT16, reportRequired: true, default: -32768},
            instantaneousPower: {ID: 0x0504, type: DataType.INT16},
            rmsVoltage: {ID: 0x0505, type: DataType.UINT16, reportRequired: true, default: 65535},
            rmsVoltageMin: {ID: 0x0506, type: DataType.UINT16, default: 65535},
            rmsVoltageMax: {ID: 0x0507, type: DataType.UINT16, default: 65535},
            rmsCurrent: {ID: 0x0508, type: DataType.UINT16, reportRequired: true, default: 65535},
            rmsCurrentMin: {ID: 0x0509, type: DataType.UINT16, default: 65535},
            rmsCurrentMax: {ID: 0x050a, type: DataType.UINT16, default: 65535},
            activePower: {ID: 0x050b, type: DataType.INT16, reportRequired: true, default: -32768},
            activePowerMin: {ID: 0x050c, type: DataType.INT16, default: -32768},
            activePowerMax: {ID: 0x050d, type: DataType.INT16, default: -32768},
            reactivePower: {ID: 0x050e, type: DataType.INT16, reportRequired: true, default: -32768},
            apparentPower: {ID: 0x050f, type: DataType.UINT16, reportRequired: true, default: 65535},
            powerFactor: {ID: 0x0510, type: DataType.INT8, min: -100, max: 100, default: 0},
            averageRmsVoltageMeasPeriod: {ID: 0x0511, type: DataType.UINT16, writable: true, default: 0},
            averageRmsOverVoltageCounter: {ID: 0x0512, type: DataType.UINT16, writable: true, default: 0},
            averageRmsUnderVoltageCounter: {ID: 0x0513, type: DataType.UINT16, writable: true, default: 0},
            rmsExtremeOverVoltagePeriod: {ID: 0x0514, type: DataType.UINT16, writable: true, default: 0},
            rmsExtremeUnderVoltagePeriod: {ID: 0x0515, type: DataType.UINT16, writable: true, default: 0},
            rmsVoltageSagPeriod: {ID: 0x0516, type: DataType.UINT16, writable: true, default: 0},
            rmsVoltageSwellPeriod: {ID: 0x0517, type: DataType.UINT16, writable: true, default: 0},
            acVoltageMultiplier: {ID: 0x0600, type: DataType.UINT16, reportRequired: true, min: 1, default: 1},
            acVoltageDivisor: {ID: 0x0601, type: DataType.UINT16, reportRequired: true, min: 1, default: 1},
            acCurrentMultiplier: {ID: 0x0602, type: DataType.UINT16, reportRequired: true, min: 1, default: 1},
            acCurrentDivisor: {ID: 0x0603, type: DataType.UINT16, reportRequired: true, min: 1, default: 1},
            acPowerMultiplier: {ID: 0x0604, type: DataType.UINT16, reportRequired: true, min: 1, default: 1},
            acPowerDivisor: {ID: 0x0605, type: DataType.UINT16, reportRequired: true, min: 1, default: 1},
            dcOverloadAlarmsMask: {ID: 0x0700, type: DataType.BITMAP8, writable: true, default: 0},
            dcVoltageOverload: {ID: 0x0701, type: DataType.INT16, default: -1},
            dcCurrentOverload: {ID: 0x0702, type: DataType.INT16, default: -1},
            acAlarmsMask: {ID: 0x0800, type: DataType.BITMAP16, writable: true, default: 0},
            acVoltageOverload: {ID: 0x0801, type: DataType.INT16, default: -1},
            acCurrentOverload: {ID: 0x0802, type: DataType.INT16, default: -1},
            acActivePowerOverload: {ID: 0x0803, type: DataType.INT16, default: -1},
            acReactivePowerOverload: {ID: 0x0804, type: DataType.INT16, default: -1},
            averageRmsOverVoltage: {ID: 0x0805, type: DataType.INT16},
            averageRmsUnderVoltage: {ID: 0x0806, type: DataType.INT16},
            rmsExtremeOverVoltage: {ID: 0x0807, type: DataType.INT16, writable: true},
            rmsExtremeUnderVoltage: {ID: 0x0808, type: DataType.INT16, writable: true},
            rmsVoltageSag: {ID: 0x0809, type: DataType.INT16, writable: true},
            rmsVoltageSwell: {ID: 0x080a, type: DataType.INT16, writable: true},
            lineCurrentPhB: {ID: 0x0901, type: DataType.UINT16, reportRequired: true, default: 65535},
            activeCurrentPhB: {ID: 0x0902, type: DataType.INT16, reportRequired: true, default: -32768},
            reactiveCurrentPhB: {ID: 0x0903, type: DataType.INT16, reportRequired: true, default: -32768},
            rmsVoltagePhB: {ID: 0x0905, type: DataType.UINT16, reportRequired: true, default: 65535},
            rmsVoltageMinPhB: {ID: 0x0906, type: DataType.UINT16, default: 32768},
            rmsVoltageMaxPhB: {ID: 0x0907, type: DataType.UINT16, default: 32768},
            rmsCurrentPhB: {ID: 0x0908, type: DataType.UINT16, reportRequired: true, default: 65535},
            rmsCurrentMinPhB: {ID: 0x0909, type: DataType.UINT16, default: 65535},
            rmsCurrentMaxPhB: {ID: 0x090a, type: DataType.UINT16, default: 65535},
            activePowerPhB: {ID: 0x090b, type: DataType.INT16, reportRequired: true, default: -32768},
            activePowerMinPhB: {ID: 0x090c, type: DataType.INT16, default: -32768},
            activePowerMaxPhB: {ID: 0x090d, type: DataType.INT16, default: -32768},
            reactivePowerPhB: {ID: 0x090e, type: DataType.INT16, reportRequired: true, default: -32768},
            apparentPowerPhB: {ID: 0x090f, type: DataType.UINT16, reportRequired: true, default: 65535},
            powerFactorPhB: {ID: 0x0910, type: DataType.INT8, min: -100, max: 100, default: 0},
            averageRmsVoltageMeasurePeriodPhB: {ID: 0x0911, type: DataType.UINT16, writable: true, default: 0},
            averageRmsOverVoltageCounterPhB: {ID: 0x0912, type: DataType.UINT16, writable: true, default: 0},
            averageUnderVoltageCounterPhB: {ID: 0x0913, type: DataType.UINT16, writable: true, default: 0},
            rmsExtremeOverVoltagePeriodPhB: {ID: 0x0914, type: DataType.UINT16, writable: true, default: 0},
            rmsExtremeUnderVoltagePeriodPhB: {ID: 0x0915, type: DataType.UINT16, writable: true, default: 0},
            rmsVoltageSagPeriodPhB: {ID: 0x0916, type: DataType.UINT16, writable: true, default: 0},
            rmsVoltageSwellPeriodPhB: {ID: 0x0917, type: DataType.UINT16, writable: true, default: 0},
            lineCurrentPhC: {ID: 0x0a01, type: DataType.UINT16, reportRequired: true, default: 65535},
            activeCurrentPhC: {ID: 0x0a02, type: DataType.INT16, reportRequired: true, default: -32768},
            reactiveCurrentPhC: {ID: 0x0a03, type: DataType.INT16, reportRequired: true, default: -32768},
            rmsVoltagePhC: {ID: 0x0a05, type: DataType.UINT16, reportRequired: true, default: 65535},
            rmsVoltageMinPhC: {ID: 0x0a06, type: DataType.UINT16, default: 32768},
            rmsVoltageMaxPhC: {ID: 0x0a07, type: DataType.UINT16, default: 32768},
            rmsCurrentPhC: {ID: 0x0a08, type: DataType.UINT16, reportRequired: true, default: 65535},
            rmsCurrentMinPhC: {ID: 0x0a09, type: DataType.UINT16, default: 65535},
            rmsCurrentMaxPhC: {ID: 0x0a0a, type: DataType.UINT16, default: 65535},
            activePowerPhC: {ID: 0x0a0b, type: DataType.INT16, reportRequired: true, default: -32768},
            activePowerMinPhC: {ID: 0x0a0c, type: DataType.INT16, default: -32768},
            activePowerMaxPhC: {ID: 0x0a0d, type: DataType.INT16, default: -32768},
            reactivePowerPhC: {ID: 0x0a0e, type: DataType.INT16, reportRequired: true, default: -32768},
            apparentPowerPhC: {ID: 0x0a0f, type: DataType.UINT16, reportRequired: true, default: 65535},
            powerFactorPhC: {ID: 0x0a10, type: DataType.INT8, min: -100, max: 100, default: 0},
            averageRmsVoltageMeasPeriodPhC: {ID: 0x0a11, type: DataType.UINT16, writable: true, default: 0},
            averageRmsOverVoltageCounterPhC: {ID: 0x0a12, type: DataType.UINT16, writable: true, default: 0},
            averageUnderVoltageCounterPhC: {ID: 0x0a13, type: DataType.UINT16, writable: true, default: 0},
            rmsExtremeOverVoltagePeriodPhC: {ID: 0x0a14, type: DataType.UINT16, writable: true, default: 0},
            rmsExtremeUnderVoltagePeriodPhC: {ID: 0x0a15, type: DataType.UINT16, writable: true, default: 0},
            rmsVoltageSagPeriodPhC: {ID: 0x0a16, type: DataType.UINT16, writable: true, default: 0},
            rmsVoltageSwellPeriodPhC: {ID: 0x0a17, type: DataType.UINT16, writable: true, default: 0},
            schneiderActivePowerDemandTotal: {ID: 0x4300, type: DataType.INT32, manufacturerCode: ManufacturerCode.SCHNEIDER_ELECTRIC},
            schneiderReactivePowerDemandTotal: {ID: 0x4303, type: DataType.INT32, manufacturerCode: ManufacturerCode.SCHNEIDER_ELECTRIC},
            schneiderApparentPowerDemandTotal: {ID: 0x4318, type: DataType.INT32, manufacturerCode: ManufacturerCode.SCHNEIDER_ELECTRIC},
            schneiderDemandIntervalDuration: {ID: 0x4319, type: DataType.UINT24, manufacturerCode: ManufacturerCode.SCHNEIDER_ELECTRIC},
            schneiderDemandDateTime: {ID: 0x4320, type: DataType.UTC, manufacturerCode: ManufacturerCode.SCHNEIDER_ELECTRIC},
            schneiderActivePowerDemandPhase1: {ID: 0x4509, type: DataType.INT32, manufacturerCode: ManufacturerCode.SCHNEIDER_ELECTRIC},
            schneiderReactivePowerDemandPhase1: {ID: 0x450a, type: DataType.INT32, manufacturerCode: ManufacturerCode.SCHNEIDER_ELECTRIC},
            schneiderApparentPowerDemandPhase1: {ID: 0x450b, type: DataType.INT32, manufacturerCode: ManufacturerCode.SCHNEIDER_ELECTRIC},
            schneiderDemandIntervalMinimalVoltageL1: {ID: 0x4510, type: DataType.UINT16, manufacturerCode: ManufacturerCode.SCHNEIDER_ELECTRIC},
            schneiderDemandIntervalMaximalCurrentI1: {ID: 0x4513, type: DataType.UINT16, manufacturerCode: ManufacturerCode.SCHNEIDER_ELECTRIC},
            schneiderActivePowerDemandPhase2: {ID: 0x4909, type: DataType.INT32, manufacturerCode: ManufacturerCode.SCHNEIDER_ELECTRIC},
            schneiderReactivePowerDemandPhase2: {ID: 0x490a, type: DataType.INT32, manufacturerCode: ManufacturerCode.SCHNEIDER_ELECTRIC},
            schneiderApparentPowerDemandPhase2: {ID: 0x490b, type: DataType.INT32, manufacturerCode: ManufacturerCode.SCHNEIDER_ELECTRIC},
            schneiderDemandIntervalMinimalVoltageL2: {ID: 0x4910, type: DataType.UINT16, manufacturerCode: ManufacturerCode.SCHNEIDER_ELECTRIC},
            schneiderDemandIntervalMaximalCurrentI2: {ID: 0x4913, type: DataType.UINT16, manufacturerCode: ManufacturerCode.SCHNEIDER_ELECTRIC},
            schneiderActivePowerDemandPhase3: {ID: 0x4a09, type: DataType.INT32, manufacturerCode: ManufacturerCode.SCHNEIDER_ELECTRIC},
            schneiderReactivePowerDemandPhase3: {ID: 0x4a0a, type: DataType.INT32, manufacturerCode: ManufacturerCode.SCHNEIDER_ELECTRIC},
            schneiderApparentPowerDemandPhase3: {ID: 0x4a0b, type: DataType.INT32, manufacturerCode: ManufacturerCode.SCHNEIDER_ELECTRIC},
            schneiderDemandIntervalMinimalVoltageL3: {ID: 0x4a10, type: DataType.UINT16, manufacturerCode: ManufacturerCode.SCHNEIDER_ELECTRIC},
            schneiderDemandIntervalMaximalCurrentI3: {ID: 0x4a13, type: DataType.UINT16, manufacturerCode: ManufacturerCode.SCHNEIDER_ELECTRIC},
            schneiderCurrentSensorMultiplier: {ID: 0x4e00, type: DataType.UINT8, manufacturerCode: ManufacturerCode.SCHNEIDER_ELECTRIC},
        },
        commands: {
            getProfileInfo: {
                ID: 0x00,
                parameters: [
                    {name: "profileCount", type: DataType.UINT8},
                    {name: "profileIntervalPeriod", type: DataType.ENUM8},
                    {name: "maxNumberOfIntervals", type: DataType.UINT8},
                    {name: "listOfAttributes", type: BuffaloZclDataType.BUFFER, arrayLengthSize: 0},
                ],
            },
            getMeasurementProfile: {
                ID: 0x01,
                parameters: [
                    {name: "attrId", type: DataType.UINT16},
                    {name: "starttime", type: DataType.UINT32},
                    {name: "numofuntervals", type: DataType.UINT8},
                    {name: "numberOfIntervalsDelivered", type: DataType.UINT8},
                    {name: "attributeId", type: DataType.ATTR_ID},
                    {name: "intervals", type: BuffaloZclDataType.BUFFER, arrayLengthSize: 0},
                ],
            },
        },
        commandsResponse: {
            getProfileInfoRsp: {
                ID: 0x00,
                parameters: [
                    {name: "profilecount", type: DataType.UINT8},
                    {name: "profileintervalperiod", type: DataType.UINT8},
                    {name: "maxnumofintervals", type: DataType.UINT8},
                    {name: "numofattrs", type: DataType.UINT8},
                    {name: "listofattr", type: BuffaloZclDataType.LIST_UINT16},
                ],
            },
            getMeasurementProfileRsp: {
                ID: 0x01,
                parameters: [
                    {name: "starttime", type: DataType.UINT32},
                    {name: "status", type: DataType.UINT8},
                    {name: "profileintervalperiod", type: DataType.UINT8},
                    {name: "numofintervalsdeliv", type: DataType.UINT8},
                    {name: "attrId", type: DataType.UINT16},
                    {name: "intervals", type: BuffaloZclDataType.LIST_UINT8},
                ],
            },
        },
    },
    haDiagnostic: {
        ID: 0x0b05,
        attributes: {
            numberOfResets: {ID: 0x0000, type: DataType.UINT16, max: 0xffff, default: 0},
            persistentMemoryWrites: {ID: 0x0001, type: DataType.UINT16, max: 0xffff, default: 0},
            macRxBcast: {ID: 0x0100, type: DataType.UINT32, max: 0xffffffff, default: 0},
            macTxBcast: {ID: 0x0101, type: DataType.UINT32, max: 0xffffffff, default: 0},
            macRxUcast: {ID: 0x0102, type: DataType.UINT32, max: 0xffffffff, default: 0},
            macTxUcast: {ID: 0x0103, type: DataType.UINT32, max: 0xffffffff, default: 0},
            macTxUcastRetry: {ID: 0x0104, type: DataType.UINT16, max: 0xffff, default: 0},
            macTxUcastFail: {ID: 0x0105, type: DataType.UINT16, max: 0xffff, default: 0},
            aPSRxBcast: {ID: 0x0106, type: DataType.UINT16, max: 0xffff, default: 0},
            aPSTxBcast: {ID: 0x0107, type: DataType.UINT16, max: 0xffff, default: 0},
            aPSRxUcast: {ID: 0x0108, type: DataType.UINT16, max: 0xffff, default: 0},
            aPSTxUcastSuccess: {ID: 0x0109, type: DataType.UINT16, max: 0xffff, default: 0},
            aPSTxUcastRetry: {ID: 0x010a, type: DataType.UINT16, max: 0xffff, default: 0},
            aPSTxUcastFail: {ID: 0x010b, type: DataType.UINT16, max: 0xffff, default: 0},
            routeDiscInitiated: {ID: 0x010c, type: DataType.UINT16, max: 0xffff, default: 0},
            neighborAdded: {ID: 0x010d, type: DataType.UINT16, max: 0xffff, default: 0},
            neighborRemoved: {ID: 0x010e, type: DataType.UINT16, max: 0xffff, default: 0},
            neighborStale: {ID: 0x010f, type: DataType.UINT16, max: 0xffff, default: 0},
            joinIndication: {ID: 0x0110, type: DataType.UINT16, max: 0xffff, default: 0},
            childMoved: {ID: 0x0111, type: DataType.UINT16, max: 0xffff, default: 0},
            nwkFcFailure: {ID: 0x0112, type: DataType.UINT16, max: 0xffff, default: 0},
            apsFcFailure: {ID: 0x0113, type: DataType.UINT16, max: 0xffff, default: 0},
            apsUnauthorizedKey: {ID: 0x0114, type: DataType.UINT16, max: 0xffff, default: 0},
            nwkDecryptFailures: {ID: 0x0115, type: DataType.UINT16, max: 0xffff, default: 0},
            apsDecryptFailures: {ID: 0x0116, type: DataType.UINT16, max: 0xffff, default: 0},
            packetBufferAllocateFailures: {ID: 0x0117, type: DataType.UINT16, max: 0xffff, default: 0},
            relayedUcast: {ID: 0x0118, type: DataType.UINT16, max: 0xffff, default: 0},
            phyToMacQueueLimitReached: {ID: 0x0119, type: DataType.UINT16, max: 0xffff, default: 0},
            packetValidateDropCount: {ID: 0x011a, type: DataType.UINT16, max: 0xffff, default: 0},
            averageMacRetryPerApsMessageSent: {ID: 0x011b, type: DataType.UINT16, max: 0xffff, default: 0},
            lastMessageLqi: {ID: 0x011c, type: DataType.UINT8, max: 0xff, default: 0},
            lastMessageRssi: {ID: 0x011d, type: DataType.INT8, min: -127, max: 127, default: 0},
            // custom
            danfossSystemStatusCode: {ID: 0x4000, type: DataType.BITMAP16, manufacturerCode: ManufacturerCode.DANFOSS_A_S},
            schneiderCommunicationQuality: {ID: 0x4000, type: DataType.UINT8, manufacturerCode: ManufacturerCode.SCHNEIDER_ELECTRIC},
            danfossHeatSupplyRequest: {ID: 0x4031, type: DataType.ENUM8, manufacturerCode: ManufacturerCode.DANFOSS_A_S},
            danfossSystemStatusWater: {ID: 0x4200, type: DataType.ENUM8, manufacturerCode: ManufacturerCode.DANFOSS_A_S},
            danfossMultimasterRole: {ID: 0x4201, type: DataType.ENUM8, manufacturerCode: ManufacturerCode.DANFOSS_A_S},
            danfossIconApplication: {ID: 0x4210, type: DataType.ENUM8, manufacturerCode: ManufacturerCode.DANFOSS_A_S},
            danfossIconForcedHeatingCooling: {ID: 0x4220, type: DataType.ENUM8, manufacturerCode: ManufacturerCode.DANFOSS_A_S},
            schneiderMeterStatus: {ID: 0xff01, type: DataType.UINT32, manufacturerCode: ManufacturerCode.SCHNEIDER_ELECTRIC},
            schneiderDiagnosticRegister1: {ID: 0xff02, type: DataType.UINT32, manufacturerCode: ManufacturerCode.SCHNEIDER_ELECTRIC},
        },
        commands: {},
        commandsResponse: {},
    },
    touchlink: {
        ID: 0x1000,
        attributes: {},
        commands: {
            scanRequest: {
                ID: 0x00,
                response: 0x01,
                parameters: [
                    {name: "transactionID", type: DataType.UINT32},
                    {name: "zigbeeInformation", type: DataType.BITMAP8},
                    {name: "touchlinkInformation", type: DataType.BITMAP8},
                ],
                required: true,
            },
            deviceInformation: {
                ID: 0x02,
                response: 0x03,
                parameters: [
                    {name: "transactionID", type: DataType.UINT32},
                    {name: "startIndex", type: DataType.UINT8},
                ],
                required: true,
            },
            identifyRequest: {
                ID: 0x06,
                parameters: [
                    {name: "transactionID", type: DataType.UINT32},
                    {
                        name: "duration",
                        type: DataType.UINT16,
                        special: [
                            ["ExitIdentifyMode", "0000"],
                            ["IdentifyForReceiverKnownTime", "ffff"],
                        ],
                    },
                ],
                required: true,
            },
            resetToFactoryNew: {ID: 0x07, parameters: [{name: "transactionID", type: DataType.UINT32}], required: true},
            networkStart: {
                ID: 0x10,
                response: 0x11,
                parameters: [
                    {name: "transactionID", type: DataType.UINT32},
                    {name: "extendedPANID", type: DataType.IEEE_ADDR},
                    {name: "keyIndex", type: DataType.UINT8},
                    {name: "encryptedNetworkKey", type: DataType.SEC_KEY},
                    {name: "logicalChannel", type: DataType.UINT8},
                    {name: "panID", type: DataType.UINT16},
                    {name: "nwkAddr", type: DataType.UINT16, min: 1, max: 65527},
                    {name: "groupIDsBegin", type: DataType.UINT16},
                    {name: "groupIDsEnd", type: DataType.UINT16},
                    {name: "freeNwkAddrRangeBegin", type: DataType.UINT16},
                    {name: "freeNwkAddrRangeEnd", type: DataType.UINT16},
                    {name: "freeGroupIDRangeBegin", type: DataType.UINT16},
                    {name: "freeGroupIDRangeEnd", type: DataType.UINT16},
                    {name: "initiatorIEEE", type: DataType.IEEE_ADDR},
                    {name: "initiatorNwkAddr", type: DataType.UINT16},
                ],
                required: true,
            },
            networkJoinRouter: {
                ID: 0x12,
                response: 0x13,
                parameters: [
                    {name: "transactionID", type: DataType.UINT32},
                    {name: "extendedPANID", type: DataType.IEEE_ADDR},
                    {name: "keyIndex", type: DataType.UINT8},
                    {name: "encryptedNetworkKey", type: DataType.SEC_KEY},
                    {name: "networkUpdateID", type: DataType.UINT8},
                    {name: "logicalChannel", type: DataType.UINT8},
                    {name: "panID", type: DataType.UINT16},
                    {name: "nwkAddr", type: DataType.UINT16},
                    {name: "groupIDsBegin", type: DataType.UINT16},
                    {name: "groupIDsEnd", type: DataType.UINT16},
                    {name: "freeNwkAddrRangeBegin", type: DataType.UINT16},
                    {name: "freeNwkAddrRangeEnd", type: DataType.UINT16},
                    {name: "freeGroupIDRangeBegin", type: DataType.UINT16},
                    {name: "freeGroupIDRangeEnd", type: DataType.UINT16},
                ],
                required: true,
            },
            networkJoinEndDevice: {
                ID: 0x14,
                response: 0x15,
                parameters: [
                    {name: "transactionID", type: DataType.UINT32},
                    {name: "extendedPANID", type: DataType.IEEE_ADDR},
                    {name: "keyIndex", type: DataType.UINT8},
                    {name: "encryptedNetworkKey", type: DataType.SEC_KEY},
                    {name: "networkUpdateID", type: DataType.UINT8},
                    {name: "logicalChannel", type: DataType.UINT8},
                    {name: "panID", type: DataType.UINT16},
                    {name: "nwkAddr", type: DataType.UINT16},
                    {name: "groupIDsBegin", type: DataType.UINT16},
                    {name: "groupIDsEnd", type: DataType.UINT16},
                    {name: "freeNwkAddrRangeBegin", type: DataType.UINT16},
                    {name: "freeNwkAddrRangeEnd", type: DataType.UINT16},
                    {name: "freeGroupIDRangeBegin", type: DataType.UINT16},
                    {name: "freeGroupIDRangeEnd", type: DataType.UINT16},
                ],
                required: true,
            },
            networkUpdate: {
                ID: 0x16,
                parameters: [
                    {name: "transactionID", type: DataType.UINT32},
                    {name: "extendedPANID", type: DataType.IEEE_ADDR},
                    {name: "networkUpdateID", type: DataType.UINT8},
                    {name: "logicalChannel", type: DataType.UINT8},
                    {name: "panID", type: DataType.UINT16},
                    {name: "nwkAddr", type: DataType.UINT16},
                ],
                required: true,
            },
            getGroupIdentifiers: {ID: 0x41, response: 0x41, parameters: [{name: "startIndex", type: DataType.UINT8}]},
            getEndpointList: {ID: 0x42, response: 0x42, parameters: [{name: "startIndex", type: DataType.UINT8}]},
        },
        commandsResponse: {
            scanResponse: {
                ID: 0x01,
                parameters: [
                    {name: "transactionID", type: DataType.UINT32},
                    {name: "rssiCorrection", type: DataType.UINT8, min: 0, max: 20},
                    {name: "zigbeeInformation", type: DataType.UINT8},
                    {name: "touchlinkInformation", type: DataType.UINT8},
                    {name: "keyBitmask", type: DataType.UINT16},
                    {name: "responseID", type: DataType.UINT32},
                    {name: "extendedPanID", type: DataType.IEEE_ADDR},
                    {name: "networkUpdateID", type: DataType.UINT8},
                    {name: "logicalChannel", type: DataType.UINT8},
                    {name: "panID", type: DataType.UINT16},
                    {name: "networkAddress", type: DataType.UINT16},
                    {name: "numberOfSubDevices", type: DataType.UINT8},
                    {name: "totalGroupIdentifiers", type: DataType.UINT8},
                    {
                        name: "endpointID",
                        type: DataType.UINT8,
                        conditions: [{type: ParameterCondition.FIELD_EQUAL, field: "numberOfSubDevices", value: 1}],
                    },
                    {
                        name: "profileID",
                        type: DataType.UINT16,
                        conditions: [{type: ParameterCondition.FIELD_EQUAL, field: "numberOfSubDevices", value: 1}],
                    },
                    {
                        name: "deviceID",
                        type: DataType.UINT16,
                        conditions: [{type: ParameterCondition.FIELD_EQUAL, field: "numberOfSubDevices", value: 1}],
                    },
                    {
                        name: "version",
                        type: DataType.UINT8,
                        conditions: [{type: ParameterCondition.FIELD_EQUAL, field: "numberOfSubDevices", value: 1}],
                    },
                    {
                        name: "groupIDCount",
                        type: DataType.UINT8,
                        conditions: [{type: ParameterCondition.FIELD_EQUAL, field: "numberOfSubDevices", value: 1}],
                    },
                ],
                required: true,
            },
            deviceInformation: {
                ID: 0x03,
                parameters: [
                    {name: "transactionID", type: DataType.UINT32},
                    {name: "numberOfSubDevices", type: DataType.UINT8},
                    {name: "startIndex", type: DataType.UINT8},
                    {name: "deviceInfoCount", type: DataType.UINT8},
                    {name: "deviceInformationRecordList", type: BuffaloZclDataType.BUFFER, minLen: 0, maxLen: 5},
                ],
                required: true,
            },
            networkStart: {
                ID: 0x11,
                parameters: [
                    {name: "transactionID", type: DataType.UINT32},
                    /**
                     * - 0x00 Success
                     * - 0x01 Failure
                     * - 0x02 – 0xff Reserved
                     */
                    {name: "status", type: DataType.ENUM8},
                    {name: "extendedPANID", type: DataType.IEEE_ADDR},
                    {name: "networkUpdateID", type: DataType.UINT8},
                    {name: "logicalChannel", type: DataType.UINT8},
                    {name: "panID", type: DataType.UINT16},
                ],
                required: true,
            },
            networkJoinRouter: {
                ID: 0x13,
                parameters: [
                    {name: "transactionID", type: DataType.UINT32},
                    /**
                     * - 0x00 Success
                     * - 0x01 Failure
                     * - 0x02 – 0xff Reserved
                     */
                    {name: "status", type: DataType.ENUM8},
                ],
                required: true,
            },
            networkJoinEndDevice: {
                ID: 0x15,
                parameters: [
                    {name: "transactionID", type: DataType.UINT32},
                    /**
                     * - 0x00 Success
                     * - 0x01 Failure
                     * - 0x02 – 0xff Reserved
                     */
                    {name: "status", type: DataType.ENUM8},
                ],
                required: true,
            },
            endpointInformation: {
                ID: 0x40,
                parameters: [
                    {name: "ieeeAddress", type: DataType.IEEE_ADDR},
                    {name: "networkAddress", type: DataType.UINT16},
                    {name: "endpointID", type: DataType.UINT8},
                    {name: "profileID", type: DataType.UINT16},
                    {name: "deviceID", type: DataType.UINT16},
                    {name: "version", type: DataType.UINT8},
                ],
            },
            getGroupIdentifiers: {
                ID: 0x41,
                parameters: [
                    {name: "total", type: DataType.UINT8},
                    {name: "startIndex", type: DataType.UINT8},
                    {name: "count", type: DataType.UINT8},
                    {name: "groupInformationRecordList", type: BuffaloZclDataType.BUFFER},
                ],
            },
            getEndpointList: {
                ID: 0x42,
                parameters: [
                    {name: "total", type: DataType.UINT8},
                    {name: "startIndex", type: DataType.UINT8},
                    {name: "count", type: DataType.UINT8},
                    {name: "endpointInformationRecordList", type: BuffaloZclDataType.BUFFER},
                ],
            },
        },
    },
    manuSpecificClusterAduroSmart: {
        ID: 0xfccc,
        attributes: {},
        commands: {
            cmd0: {ID: 0x00, parameters: []},
        },
        commandsResponse: {},
    },
    manuSpecificOsram: {
        ID: 0xfc0f,
        attributes: {},
        commands: {
            saveStartupParams: {ID: 0x01, parameters: []},
            resetStartupParams: {ID: 0x02, parameters: []},
        },
        commandsResponse: {
            saveStartupParamsRsp: {ID: 0x00, parameters: []},
        },
    },
    manuSpecificPhilips: {
        ID: 0xfc00,
        manufacturerCode: ManufacturerCode.SIGNIFY_NETHERLANDS_B_V,
        attributes: {
            config: {ID: 0x0031, type: DataType.BITMAP16},
        },
        commands: {},
        commandsResponse: {
            hueNotification: {
                ID: 0x00,
                parameters: [
                    {name: "button", type: DataType.UINT8},
                    {name: "unknown1", type: DataType.UINT24},
                    {name: "type", type: DataType.UINT8},
                    {name: "unknown2", type: DataType.UINT8},
                    {name: "time", type: DataType.UINT8},
                    {name: "unknown3", type: DataType.UINT8},
                ],
            },
        },
    },
    manuSpecificPhilips2: {
        ID: 0xfc03,
        manufacturerCode: ManufacturerCode.SIGNIFY_NETHERLANDS_B_V,
        attributes: {
            state: {ID: 0x0002, type: DataType.OCTET_STR},
        },
        commands: {
            multiColor: {ID: 0x00, parameters: [{name: "data", type: BuffaloZclDataType.BUFFER}]},
        },
        commandsResponse: {},
    },
    manuSpecificSinope: {
        ID: 0xff01,
        manufacturerCode: ManufacturerCode.SINOPE_TECHNOLOGIES,
        attributes: {
            // attribute ID :1's readable
            keypadLockout: {ID: 0x0002, type: DataType.ENUM8},
            // 'firmware number': {ID: 3, type: DataType.UNKNOWN},
            firmwareVersion: {ID: 0x0004, type: DataType.CHAR_STR},
            outdoorTempToDisplay: {ID: 0x0010, type: DataType.INT16},
            outdoorTempToDisplayTimeout: {ID: 0x0011, type: DataType.UINT16},
            secondScreenBehavior: {ID: 0x0012, type: DataType.ENUM8}, // auto:0,setpoint:1,outside:2
            currentTimeToDisplay: {ID: 0x0020, type: DataType.UINT32},
            ledIntensityOn: {ID: 0x0052, type: DataType.UINT8},
            ledIntensityOff: {ID: 0x0053, type: DataType.UINT8},
            ledColorOn: {ID: 0x0050, type: DataType.UINT24}, // inversed hex BBGGRR
            ledColorOff: {ID: 0x0051, type: DataType.UINT24},
            onLedIntensity: {ID: 0x0052, type: DataType.UINT8}, // percent
            offLedIntensity: {ID: 0x0053, type: DataType.UINT8}, // percent
            actionReport: {ID: 0x0054, type: DataType.ENUM8}, // singleTapUp: 1,2, doubleTapUp: 1,4, singleTapDown: 17,18, doubleTapDown: 17,20
            minimumBrightness: {ID: 0x0055, type: DataType.UINT16},
            connectedLoadRM: {ID: 0x0060, type: DataType.UINT16}, // unit watt/hr for Calypso RM3500 & Load Controller RM3250
            currentLoad: {ID: 0x0070, type: DataType.BITMAP8}, // related to ecoMode(s)
            ecoMode: {ID: 0x0071, type: DataType.INT8}, // default:-128||-100-0-100%
            ecoMode1: {ID: 0x0072, type: DataType.UINT8}, // default:255||0-99
            ecoMode2: {ID: 0x0073, type: DataType.UINT8}, // default 255||0-100
            unknown: {ID: 0x0075, type: DataType.BITMAP32}, // RW *testing*
            drConfigWaterTempMin: {ID: 0x0076, type: DataType.UINT8}, // value 45 or 0
            drConfigWaterTempTime: {ID: 0x0077, type: DataType.UINT8}, // default 2
            drWTTimeOn: {ID: 0x0078, type: DataType.UINT16},
            unknown1: {ID: 0x0080, type: DataType.UINT32}, // readOnly stringNumber *testing*
            dimmerTimmer: {ID: 0x00a0, type: DataType.UINT32},
            unknown2: {ID: 0x0100, type: DataType.UINT8}, // readOnly *testing*
            floorControlMode: {ID: 0x0105, type: DataType.ENUM8}, // airFloorMode
            auxOutputMode: {ID: 0x0106, type: DataType.ENUM8},
            floorTemperature: {ID: 0x0107, type: DataType.INT16},
            ambiantMaxHeatSetpointLimit: {ID: 0x0108, type: DataType.INT16},
            floorMinHeatSetpointLimit: {ID: 0x0109, type: DataType.INT16},
            floorMaxHeatSetpointLimit: {ID: 0x010a, type: DataType.INT16},
            temperatureSensor: {ID: 0x010b, type: DataType.ENUM8},
            floorLimitStatus: {ID: 0x010c, type: DataType.ENUM8},
            roomTemperature: {ID: 0x010d, type: DataType.INT16},
            timeFormatToDisplay: {ID: 0x0114, type: DataType.ENUM8},
            GFCiStatus: {ID: 0x0115, type: DataType.ENUM8},
            auxConnectedLoad: {ID: 0x0118, type: DataType.UINT16},
            connectedLoad: {ID: 0x0119, type: DataType.UINT16},
            pumpProtection: {ID: 0x0128, type: DataType.UINT8},
            unknown3: {ID: 0x012a, type: DataType.ENUM8}, // RW default:60||5,10,15,20,30,60 *testing*
            currentSetpoint: {ID: 0x012b, type: DataType.INT16}, // W:to ocuppiedHeatSetpoint, R:depends of SinopeOccupancy
            // attribute ID: 300's readable, returns a buffer
            reportLocalTemperature: {ID: 0x012d, type: DataType.INT16},
            // attribute ID: 512's readable
            flowMeterConfig: {ID: 0x0240, type: DataType.ARRAY},
            coldLoadPickupStatus: {ID: 0x0283, type: DataType.UINT8},
        },
        commands: {},
        commandsResponse: {},
    },
    manuSpecificLegrandDevices: {
        ID: 0xfc01,
        manufacturerCode: ManufacturerCode.LEGRAND_GROUP,
        attributes: {
            // attributes seems to vary depending on the device. Can't be static
        },
        commands: {},
        commandsResponse: {},
    },
    manuSpecificLegrandDevices2: {
        ID: 0xfc40,
        manufacturerCode: ManufacturerCode.LEGRAND_GROUP,
        attributes: {},
        commands: {
            command0: {ID: 0x00, parameters: [{name: "data", type: BuffaloZclDataType.BUFFER}]},
        },
        commandsResponse: {},
    },
    manuSpecificLegrandDevices3: {
        ID: 0xfc41,
        manufacturerCode: ManufacturerCode.LEGRAND_GROUP,
        attributes: {},
        commands: {
            command0: {ID: 0x00, parameters: [{name: "data", type: BuffaloZclDataType.BUFFER}]},
        },
        commandsResponse: {},
    },
    wiserDeviceInfo: {
        ID: 0xfe03, // 65027
        attributes: {
            deviceInfo: {ID: 0x0020, type: DataType.CHAR_STR},
        },
        commands: {},
        commandsResponse: {},
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
        ID: 0xef00, // 61184
        attributes: {},
        commands: {
            /**
             * Gateway-side data request
             */
            dataRequest: {
                ID: 0x00,
                parameters: [
                    {name: "seq", type: DataType.UINT16},
                    {name: "dpValues", type: BuffaloZclDataType.LIST_TUYA_DATAPOINT_VALUES},
                ],
            },
            /**
             * GW send, trigger MCU side to report all current information, no zcl payload.
             * Note: Device side can make a policy, data better not to report centrally
             */
            dataQuery: {ID: 0x03, parameters: []},
            /**
             * Gw->Zigbee gateway query MCU version
             */
            mcuVersionRequest: {ID: 0x10, parameters: [{name: "seq", type: DataType.UINT16}]},
            /**
             * FIXME: This command is not listed in Tuya zigbee cluster description,
             *  but there is some command 0x04 (description is: Command Issuance)
             *  in `Serial command list` section of the same document
             *  So, need to investigate more information about it
             */
            sendData: {
                ID: 0x04,
                parameters: [
                    {name: "seq", type: DataType.UINT16},
                    {name: "dpValues", type: BuffaloZclDataType.LIST_TUYA_DATAPOINT_VALUES},
                ],
            },
            /**
             * Gw->Zigbee gateway notifies MCU of upgrade
             */
            mcuOtaNotify: {
                ID: 0x12,
                parameters: [
                    {name: "seq", type: DataType.UINT16},
                    // FIXME: key is fixed (8 byte) uint8 array
                    //  Ask Koen is there any type to read fixed size uint_8t.
                    //  currently there is `length` property in options but sems it is
                    //  ignored in `writePayloadCluster()` and other methods.
                    //  So, as workaround we use hi/low for key, which is not best solution
                    {name: "key_hi", type: DataType.UINT32},
                    {name: "key_lo", type: DataType.UINT32},
                    {name: "version", type: DataType.UINT8},
                    {name: "imageSize", type: DataType.UINT32},
                    {name: "crc", type: DataType.UINT32},
                ],
            },
            /**
             * Gw->Zigbee gateway returns the requested upgrade package for MCU
             */
            mcuOtaBlockDataResponse: {
                ID: 0x14,
                parameters: [
                    {name: "seq", type: DataType.UINT16},
                    {name: "status", type: DataType.UINT8},
                    {name: "key_hi", type: DataType.UINT32},
                    {name: "key_lo", type: DataType.UINT32},
                    {name: "version", type: DataType.UINT8},
                    {name: "offset", type: DataType.UINT32},
                    {name: "imageData", type: BuffaloZclDataType.LIST_UINT8},
                ],
            },
            /**
             * Time synchronization (bidirectional)
             */
            mcuSyncTime: {
                ID: 0x24,
                parameters: [
                    {name: "payloadSize", type: DataType.UINT16},
                    {name: "payload", type: BuffaloZclDataType.LIST_UINT8},
                ],
            },
            /**
             * Gateway connection status (bidirectional)
             */
            mcuGatewayConnectionStatus: {
                ID: 0x25,
                parameters: [
                    {name: "payloadSize", type: DataType.UINT16},
                    {name: "payload", type: DataType.UINT8},
                ],
            },
        },
        commandsResponse: {
            /**
             * Reply to MCU-side data request
             */
            dataResponse: {
                ID: 0x01,
                parameters: [
                    {name: "seq", type: DataType.UINT16},
                    {name: "dpValues", type: BuffaloZclDataType.LIST_TUYA_DATAPOINT_VALUES},
                ],
            },
            /**
             * MCU-side data active upload (bidirectional)
             */
            dataReport: {
                ID: 0x02,
                parameters: [
                    {name: "seq", type: DataType.UINT16},
                    {name: "dpValues", type: BuffaloZclDataType.LIST_TUYA_DATAPOINT_VALUES},
                ],
            },
            /**
             * FIXME: This command is not listed in Tuya zigbee cluster description,
             *  but there is some command 0x05 (description is: Status query)
             *  in `Serial command list` section of the same document
             *  So, need to investigate more information about it
             */
            activeStatusReportAlt: {
                ID: 0x05,
                parameters: [
                    {name: "seq", type: DataType.UINT16},
                    {name: "dpValues", type: BuffaloZclDataType.LIST_TUYA_DATAPOINT_VALUES},
                ],
            },
            /**
             * FIXME: This command is not listed in Tuya zigbee cluster description,
             *  but there is some command 0x06 (description is: Status query)
             *  in `Serial command list` section of the same document
             *  So, need to investigate more information about it
             */
            activeStatusReport: {
                ID: 0x06,
                parameters: [
                    {name: "seq", type: DataType.UINT16},
                    {name: "dpValues", type: BuffaloZclDataType.LIST_TUYA_DATAPOINT_VALUES},
                ],
            },
            /**
             * Zigbee->Gw MCU return version or actively report version
             */
            mcuVersionResponse: {
                ID: 0x11,
                parameters: [
                    {name: "seq", type: DataType.UINT16},
                    {name: "version", type: DataType.UINT8},
                ],
            },
            /**
             * Zigbee->Gw requests an upgrade package for the MCU
             */
            mcuOtaBlockDataRequest: {
                ID: 0x13,
                parameters: [
                    {name: "seq", type: DataType.UINT16},
                    {name: "key_hi", type: DataType.UINT32},
                    {name: "key_lo", type: DataType.UINT32},
                    {name: "version", type: DataType.UINT8},
                    {name: "offset", type: DataType.UINT32},
                    {name: "size", type: DataType.UINT32},
                ],
            },
            /**
             * Zigbee->Gw returns the upgrade result for the mcu
             */
            mcuOtaResult: {
                ID: 0x15,
                parameters: [
                    {name: "seq", type: DataType.UINT16},
                    {name: "status", type: DataType.UINT8},
                    {name: "key_hi", type: DataType.UINT32},
                    {name: "key_lo", type: DataType.UINT32},
                    {name: "version", type: DataType.UINT8},
                ],
            },
            /**
             * Time synchronization (bidirectional)
             */
            mcuSyncTime: {ID: 0x24, parameters: [{name: "payloadSize", type: DataType.UINT16}]},
            /**
             * Gateway connection status (bidirectional)
             */
            mcuGatewayConnectionStatus: {ID: 0x25, parameters: [{name: "payloadSize", type: DataType.UINT16}]},
        },
    },
    manuSpecificLumi: {
        ID: 0xfcc0,
        manufacturerCode: ManufacturerCode.LUMI_UNITED_TECHOLOGY_LTD_SHENZHEN,
        attributes: {
            mode: {ID: 0x0009, type: DataType.UINT8},
            illuminance: {ID: 0x0112, type: DataType.UINT32},
            displayUnit: {ID: 0x0114, type: DataType.UINT8},
            airQuality: {ID: 0x0129, type: DataType.UINT8},
            curtainReverse: {ID: 0x0400, type: DataType.BOOLEAN},
            curtainHandOpen: {ID: 0x0401, type: DataType.BOOLEAN},
            curtainCalibrated: {ID: 0x0402, type: DataType.BOOLEAN},
        },
        commands: {},
        commandsResponse: {},
    },
    liXeePrivate: {
        ID: 0xff66,
        manufacturerCode: ManufacturerCode.NXP_SEMICONDUCTORS,
        attributes: {
            currentTarif: {ID: 0x0000, type: DataType.CHAR_STR},
            tomorrowColor: {ID: 0x0001, type: DataType.CHAR_STR},
            scheduleHPHC: {ID: 0x0002, type: DataType.UINT8},
            presencePotential: {ID: 0x0003, type: DataType.UINT8},
            startNoticeEJP: {ID: 0x0004, type: DataType.UINT8},
            warnDPS: {ID: 0x0005, type: DataType.UINT16},
            warnDIR1: {ID: 0x0006, type: DataType.UINT16},
            warnDIR2: {ID: 0x0007, type: DataType.UINT16},
            warnDIR3: {ID: 0x0008, type: DataType.UINT16},
            motDEtat: {ID: 0x0009, type: DataType.CHAR_STR},
            currentPrice: {ID: 0x0200, type: DataType.CHAR_STR},
            currentIndexTarif: {ID: 0x0201, type: DataType.UINT8},
            currentDate: {ID: 0x0202, type: DataType.CHAR_STR},
            activeEnergyOutD01: {ID: 0x0203, type: DataType.UINT32},
            activeEnergyOutD02: {ID: 0x0204, type: DataType.UINT32},
            activeEnergyOutD03: {ID: 0x0205, type: DataType.UINT32},
            activeEnergyOutD04: {ID: 0x0206, type: DataType.UINT32},
            injectedVA: {ID: 0x0207, type: DataType.UINT16},
            injectedVAMaxN: {ID: 0x0208, type: DataType.INT16},
            injectedVAMaxN1: {ID: 0x0209, type: DataType.INT16},
            injectedActiveLoadN: {ID: 0x0210, type: DataType.INT16},
            injectedActiveLoadN1: {ID: 0x0211, type: DataType.INT16},
            drawnVAMaxN1: {ID: 0x0212, type: DataType.INT16},
            drawnVAMaxN1P2: {ID: 0x0213, type: DataType.INT16},
            drawnVAMaxN1P3: {ID: 0x0214, type: DataType.INT16},
            message1: {ID: 0x0215, type: DataType.CHAR_STR},
            message2: {ID: 0x0216, type: DataType.CHAR_STR},
            statusRegister: {ID: 0x0217, type: DataType.OCTET_STR},
            startMobilePoint1: {ID: 0x0218, type: DataType.UINT8},
            stopMobilePoint1: {ID: 0x0219, type: DataType.UINT8},
            startMobilePoint2: {ID: 0x0220, type: DataType.UINT8},
            stopMobilePoint2: {ID: 0x0221, type: DataType.UINT8},
            startMobilePoint3: {ID: 0x0222, type: DataType.UINT8},
            stopMobilePoint3: {ID: 0x0223, type: DataType.UINT8},
            relais: {ID: 0x0224, type: DataType.UINT16},
            daysNumberCurrentCalendar: {ID: 0x0225, type: DataType.UINT8},
            daysNumberNextCalendar: {ID: 0x0226, type: DataType.UINT8},
            daysProfileCurrentCalendar: {ID: 0x0227, type: DataType.LONG_OCTET_STR},
            daysProfileNextCalendar: {ID: 0x0228, type: DataType.LONG_OCTET_STR},
            linkyMode: {ID: 0x0300, type: DataType.UINT8},
        },
        commands: {},
        commandsResponse: {},
    },
    manuSpecificTuya2: {
        ID: 0xe002,
        attributes: {
            alarm_temperature_max: {ID: 0xd00a, type: DataType.INT16},
            alarm_temperature_min: {ID: 0xd00b, type: DataType.INT16},
            alarm_humidity_max: {ID: 0xd00d, type: DataType.INT16},
            alarm_humidity_min: {ID: 0xd00e, type: DataType.INT16},
            alarm_humidity: {ID: 0xd00f, type: DataType.ENUM8},
            alarm_temperature: {ID: 0xd006, type: DataType.ENUM8},
            unknown: {ID: 0xd010, type: DataType.UINT8},
        },
        commands: {},
        commandsResponse: {},
    },
    manuSpecificTuya3: {
        ID: 0xe001,
        attributes: {
            powerOnBehavior: {ID: 0xd010, type: DataType.ENUM8},
            switchMode: {ID: 0xd020, type: DataType.ENUM8},
            switchType: {ID: 0xd030, type: DataType.ENUM8},
        },
        commands: {
            setOptions1: {ID: 0xe5, parameters: [{name: "data", type: BuffaloZclDataType.BUFFER}]},
            setOptions2: {ID: 0xe6, parameters: [{name: "data", type: BuffaloZclDataType.BUFFER}]},
            setOptions3: {ID: 0xe7, parameters: [{name: "data", type: BuffaloZclDataType.BUFFER}]},
        },
        commandsResponse: {},
    },
    manuSpecificCentraliteHumidity: {
        ID: 0xfc45,
        manufacturerCode: ManufacturerCode.CENTRALITE_SYSTEMS_INC,
        attributes: {
            measuredValue: {ID: 0x0000, type: DataType.UINT16},
        },
        commands: {},
        commandsResponse: {},
    },
    manuSpecificSmartThingsArrivalSensor: {
        ID: 0xfc05,
        manufacturerCode: ManufacturerCode.SMARTTHINGS_INC,
        attributes: {},
        commands: {},
        commandsResponse: {
            arrivalSensorNotify: {ID: 0x01, parameters: []},
        },
    },
    manuSpecificSamsungAccelerometer: {
        ID: 0xfc02,
        manufacturerCode: ManufacturerCode.SMARTTHINGS_INC,
        attributes: {
            motion_threshold_multiplier: {ID: 0x0000, type: DataType.UINT8},
            motion_threshold: {ID: 0x0002, type: DataType.UINT16},
            acceleration: {ID: 0x0010, type: DataType.BITMAP8},
            x_axis: {ID: 0x0012, type: DataType.INT16},
            y_axis: {ID: 0x0013, type: DataType.INT16},
            z_axis: {ID: 0x0014, type: DataType.INT16},
        },
        commands: {},
        commandsResponse: {},
    },
    heimanSpecificAirQuality: {
        // from HS2AQ-3.0海曼智能空气质量检测仪API文档-V01
        ID: 0xfc81,
        manufacturerCode: ManufacturerCode.HEIMAN_TECHNOLOGY_CO_LTD,
        attributes: {
            language: {ID: 0xf000, type: DataType.UINT8},
            unitOfMeasure: {ID: 0xf001, type: DataType.UINT8},
            batteryState: {ID: 0xf002, type: DataType.UINT8}, //  (0 is not charged, 1 is charging, 2 is fully charged)
            pm10measuredValue: {ID: 0xf003, type: DataType.UINT16},
            tvocMeasuredValue: {ID: 0xf004, type: DataType.UINT16},
            aqiMeasuredValue: {ID: 0xf005, type: DataType.UINT16},
            temperatureMeasuredMax: {ID: 0xf006, type: DataType.INT16},
            temperatureMeasuredMin: {ID: 0xf007, type: DataType.INT16},
            humidityMeasuredMax: {ID: 0xf008, type: DataType.UINT16},
            humidityMeasuredMin: {ID: 0xf009, type: DataType.UINT16},
            alarmEnable: {ID: 0xf00a, type: DataType.UINT16},
        },
        commands: {
            setLanguage: {
                ID: 0x11b,
                parameters: [
                    // (1: English 0: Chinese)
                    {name: "languageCode", type: DataType.UINT8},
                ],
            },
            setUnitOfTemperature: {
                ID: 0x11c,
                parameters: [
                    // (0: ℉ 1: ℃)
                    {name: "unitsCode", type: DataType.UINT8},
                ],
            },
            getTime: {ID: 0x11d, parameters: []},
        },
        commandsResponse: {},
    },
    heimanSpecificScenes: {
        // from HS2SS-3.0海曼智能情景开关API文档-V01
        ID: 0xfc80,
        manufacturerCode: ManufacturerCode.HEIMAN_TECHNOLOGY_CO_LTD,
        attributes: {},
        commands: {
            cinema: {ID: 0xf0, parameters: []},
            atHome: {ID: 0xf1, parameters: []},
            sleep: {ID: 0xf2, parameters: []},
            goOut: {ID: 0xf3, parameters: []},
            repast: {ID: 0xf4, parameters: []},
        },
        commandsResponse: {},
    },
    tradfriButton: {
        ID: 0xfc80,
        manufacturerCode: ManufacturerCode.IKEA_OF_SWEDEN,
        attributes: {},
        commands: {
            action1: {ID: 0x01, parameters: [{name: "data", type: DataType.UINT8}]},
            action2: {ID: 0x02, parameters: [{name: "data", type: DataType.UINT8}]},
            action3: {ID: 0x03, parameters: [{name: "data", type: DataType.UINT8}]},
            action4: {ID: 0x04, parameters: [{name: "data", type: DataType.UINT8}]},
            action6: {ID: 0x06, parameters: [{name: "data", type: DataType.UINT8}]},
        },
        commandsResponse: {},
    },
    heimanSpecificInfraRedRemote: {
        // from HS2IRC-3.0海曼智能红外转发控制器API-V01文档
        ID: 0xfc82,
        manufacturerCode: ManufacturerCode.HEIMAN_TECHNOLOGY_CO_LTD,
        attributes: {},
        commands: {
            sendKey: {
                ID: 0xf0,
                parameters: [
                    {name: "id", type: DataType.UINT8},
                    {name: "keyCode", type: DataType.UINT8},
                ],
            },
            studyKey: {
                // Total we can have 30 keycode for each device ID (1..30).
                ID: 0xf1,
                // response: 0xf2,
                parameters: [
                    {name: "id", type: DataType.UINT8},
                    {name: "keyCode", type: DataType.UINT8},
                ],
            },
            deleteKey: {
                ID: 0xf3,
                parameters: [
                    // 1-15 - Delete specific ID, >= 16 - Delete All
                    {name: "id", type: DataType.UINT8},
                    // 1-30 - Delete specific keycode, >= 31 - Delete All keycodes for the ID
                    {name: "keyCode", type: DataType.UINT8},
                ],
            },
            createId: {
                // Total we can have 15 device IDs (1..15).
                ID: 0xf4,
                // response: 0xf5,
                parameters: [{name: "modelType", type: DataType.UINT8}],
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
                    {name: "id", type: DataType.UINT8},
                    {name: "keyCode", type: DataType.UINT8},
                    {name: "result", type: DataType.UINT8}, // 0 - success, 1 - fail
                ],
            },
            createIdRsp: {
                ID: 0xf5,
                parameters: [
                    {name: "id", type: DataType.UINT8}, // 0xFF - create failed
                    {name: "modelType", type: DataType.UINT8},
                ],
            },
            getIdAndKeyCodeListRsp: {
                ID: 0xf7,
                parameters: [
                    {name: "packetsTotal", type: DataType.UINT8},
                    {name: "packetNumber", type: DataType.UINT8},
                    {name: "packetLength", type: DataType.UINT8}, // Max length is 70 bytes
                    // HELP for learnedDevicesList data structure:
                    //   struct structPacketPayload {
                    //     uint8_t ID;
                    //     uint8_t ModeType;
                    //     uint8_t KeyNum;
                    //     uint8_t KeyCode[KeyNum];
                    //   } arayPacketPayload[CurentPacketLenght];
                    // }
                    {name: "learnedDevicesList", type: BuffaloZclDataType.LIST_UINT8},
                ],
            },
        },
    },
    schneiderSpecificPilotMode: {
        ID: 0xff23,
        manufacturerCode: ManufacturerCode.SCHNEIDER_ELECTRIC,
        attributes: {
            pilotMode: {ID: 0x0031, type: DataType.ENUM8},
        },
        commands: {},
        commandsResponse: {},
    },
    elkoOccupancySettingClusterServer: {
        ID: 0xff19,
        manufacturerCode: ManufacturerCode.ADEO,
        attributes: {
            AmbienceLightThreshold: {ID: 0x0000, type: DataType.UINT16},
            OccupancyActions: {ID: 0x0001, type: DataType.ENUM8},
            UnoccupiedLevelDflt: {ID: 0x0002, type: DataType.UINT8},
            UnoccupiedLevel: {ID: 0x0003, type: DataType.UINT8},
        },
        commands: {},
        commandsResponse: {},
    },
    elkoSwitchConfigurationClusterServer: {
        ID: 0xff17,
        manufacturerCode: ManufacturerCode.ADEO,
        attributes: {
            SwitchIndication: {ID: 0x0000, type: DataType.ENUM8},
            UpSceneID: {ID: 0x0010, type: DataType.UINT8},
            UpGroupID: {ID: 0x0011, type: DataType.UINT16},
            DownSceneID: {ID: 0x0020, type: DataType.UINT8},
            DownGroupID: {ID: 0x0021, type: DataType.UINT16},
            SwitchActions: {ID: 0x0001, type: DataType.ENUM8},
        },
        commands: {},
        commandsResponse: {},
    },
    manuSpecificSchneiderLightSwitchConfiguration: {
        ID: 0xff17,
        manufacturerCode: ManufacturerCode.SCHNEIDER_ELECTRIC,
        attributes: {
            ledIndication: {ID: 0x0000, type: DataType.ENUM8},
            upSceneID: {ID: 0x0010, type: DataType.UINT8},
            upGroupID: {ID: 0x0011, type: DataType.UINT16},
            downSceneID: {ID: 0x0020, type: DataType.UINT8},
            downGroupID: {ID: 0x0021, type: DataType.UINT16},
            switchActions: {ID: 0x0001, type: DataType.ENUM8},
        },
        commands: {},
        commandsResponse: {},
    },
    manuSpecificSchneiderFanSwitchConfiguration: {
        ID: 0xfc04,
        manufacturerCode: ManufacturerCode.SCHNEIDER_ELECTRIC,
        attributes: {
            ledIndication: {ID: 0x0002, type: DataType.UINT8},
            ledOrientation: {ID: 0x0060, type: DataType.UINT8},
        },
        commands: {},
        commandsResponse: {},
    },
    sprutVoc: {
        ID: 0x6601,
        manufacturerCode: 26214,
        attributes: {
            voc: {ID: 0x6600, type: DataType.UINT16},
        },
        commands: {},
        commandsResponse: {},
    },
    sprutNoise: {
        ID: 0x6602,
        manufacturerCode: 26214,
        attributes: {
            noise: {ID: 0x6600, type: DataType.SINGLE_PREC},
            noiseDetected: {ID: 0x6601, type: DataType.BITMAP8},
            noiseDetectLevel: {ID: 0x6602, type: DataType.SINGLE_PREC},
            noiseAfterDetectDelay: {ID: 0x6603, type: DataType.UINT16},
        },
        commands: {},
        commandsResponse: {},
    },
    sprutIrBlaster: {
        ID: 0x6603,
        manufacturerCode: 26214,
        attributes: {},
        commands: {
            playStore: {ID: 0x00, parameters: [{name: "param", type: DataType.UINT8}]},
            learnStart: {ID: 0x01, parameters: [{name: "value", type: DataType.UINT8}]},
            learnStop: {ID: 0x02, parameters: [{name: "value", type: DataType.UINT8}]},
            clearStore: {ID: 0x03, parameters: []},
            playRam: {ID: 0x04, parameters: []},
            learnRamStart: {ID: 0x05, parameters: []},
            learnRamStop: {ID: 0x06, parameters: []},
        },
        commandsResponse: {},
    },
    manuSpecificSiglisZigfred: {
        ID: 0xfc42,
        manufacturerCode: 0x129c,
        attributes: {
            buttonEvent: {ID: 0x0008, type: DataType.UINT32},
        },
        commands: {
            siglisZigfredButtonEvent: {
                ID: 0x02,
                parameters: [
                    {name: "button", type: DataType.UINT8},
                    {name: "type", type: DataType.UINT8},
                    {name: "duration", type: DataType.UINT16},
                ],
            },
        },
        commandsResponse: {},
    },
    owonClearMetering: {
        ID: 0xffe0,
        manufacturerCode: ManufacturerCode.OWON_TECHNOLOGY_INC,
        attributes: {},
        commands: {
            owonClearMeasurementData: {ID: 0x00, parameters: []},
        },
        commandsResponse: {},
    },
    zosungIRTransmit: {
        ID: 0xed00,
        attributes: {},
        commands: {
            zosungSendIRCode00: {
                ID: 0x00,
                parameters: [
                    {name: "seq", type: DataType.UINT16},
                    {name: "length", type: DataType.UINT32},
                    {name: "unk1", type: DataType.UINT32},
                    {name: "unk2", type: DataType.UINT16},
                    {name: "unk3", type: DataType.UINT8},
                    {name: "cmd", type: DataType.UINT8},
                    {name: "unk4", type: DataType.UINT16},
                ],
            },
            zosungSendIRCode01: {
                ID: 0x01,
                parameters: [
                    {name: "zero", type: DataType.UINT8},
                    {name: "seq", type: DataType.UINT16},
                    {name: "length", type: DataType.UINT32},
                    {name: "unk1", type: DataType.UINT32},
                    {name: "unk2", type: DataType.UINT16},
                    {name: "unk3", type: DataType.UINT8},
                    {name: "cmd", type: DataType.UINT8},
                    {name: "unk4", type: DataType.UINT16},
                ],
            },
            zosungSendIRCode02: {
                ID: 0x02,
                parameters: [
                    {name: "seq", type: DataType.UINT16},
                    {name: "position", type: DataType.UINT32},
                    {name: "maxlen", type: DataType.UINT8},
                ],
            },
            zosungSendIRCode03: {
                ID: 0x03,
                parameters: [
                    {name: "zero", type: DataType.UINT8},
                    {name: "seq", type: DataType.UINT16},
                    {name: "position", type: DataType.UINT32},
                    {name: "msgpart", type: DataType.OCTET_STR},
                    {name: "msgpartcrc", type: DataType.UINT8},
                ],
            },
            zosungSendIRCode04: {
                ID: 0x04,
                parameters: [
                    {name: "zero0", type: DataType.UINT8},
                    {name: "seq", type: DataType.UINT16},
                    {name: "zero1", type: DataType.UINT16},
                ],
            },
            zosungSendIRCode05: {
                ID: 0x05,
                parameters: [
                    {name: "seq", type: DataType.UINT16},
                    {name: "zero", type: DataType.UINT16},
                ],
            },
        },
        commandsResponse: {
            zosungSendIRCode03Resp: {
                ID: 0x03,
                parameters: [
                    {name: "zero", type: DataType.UINT8},
                    {name: "seq", type: DataType.UINT16},
                    {name: "position", type: DataType.UINT32},
                    {name: "msgpart", type: DataType.OCTET_STR},
                    {name: "msgpartcrc", type: DataType.UINT8},
                ],
            },
            zosungSendIRCode05Resp: {
                ID: 0x05,
                parameters: [
                    {name: "seq", type: DataType.UINT16},
                    {name: "zero", type: DataType.UINT16},
                ],
            },
        },
    },
    zosungIRControl: {
        ID: 0xe004,
        attributes: {},
        commands: {
            zosungControlIRCommand00: {
                ID: 0x00,
                parameters: [
                    // JSON string with a command.
                    {name: "data", type: BuffaloZclDataType.BUFFER},
                ],
            },
        },
        commandsResponse: {},
    },
    manuSpecificAssaDoorLock: {
        ID: 0xfc00,
        attributes: {
            autoLockTime: {ID: 0x0012, type: DataType.UINT8},
            wrongCodeAttempts: {ID: 0x0013, type: DataType.UINT8},
            shutdownTime: {ID: 0x0014, type: DataType.UINT8},
            batteryLevel: {ID: 0x0015, type: DataType.UINT8},
            insideEscutcheonLED: {ID: 0x0016, type: DataType.UINT8},
            volume: {ID: 0x0017, type: DataType.UINT8},
            lockMode: {ID: 0x0018, type: DataType.UINT8},
            language: {ID: 0x0019, type: DataType.UINT8},
            allCodesLockout: {ID: 0x001a, type: DataType.BOOLEAN},
            oneTouchLocking: {ID: 0x001b, type: DataType.BOOLEAN},
            privacyButtonSetting: {ID: 0x001c, type: DataType.BOOLEAN},
            /* enableLogging: {ID: 0x0020, type: DataType.BOOLEAN},*/ // marked in C4 driver as not supported
            numberLogRecordsSupported: {ID: 0x0021, type: DataType.UINT16},
            numberPinsSupported: {ID: 0x0030, type: DataType.UINT8},
            numberScheduleSlotsPerUser: {ID: 0x0040, type: DataType.UINT8},
            alarmMask: {ID: 0x0050, type: DataType.UINT8},
        },
        commands: {
            getLockStatus: {ID: 0x10, response: 0, parameters: []},
            getBatteryLevel: {ID: 0x12, parameters: []},
            setRFLockoutTime: {ID: 0x13, parameters: []},
            /* getLogRecord: {ID: 0x20,
                parameters: [],
            },*/ // marked in C4 driver as not supported
            userCodeSet: {
                ID: 0x30,
                parameters: [
                    // bit pack ("bbb", slot, status, pinLength) .. pin
                    {name: "payload", type: DataType.CHAR_STR},
                ],
            },
            userCodeGet: {
                ID: 0x31,
                parameters: [
                    // bit pack ("b", slot)
                    {name: "payload", type: DataType.CHAR_STR},
                ],
            },
            userCodeClear: {
                ID: 0x32,
                parameters: [
                    // bit pack ("b", slot)
                    {name: "payload", type: DataType.CHAR_STR},
                ],
            },
            clearAllUserCodes: {ID: 0x33, parameters: []},
            setUserCodeStatus: {ID: 0x34, parameters: []},
            getUserCodeStatus: {ID: 0x35, parameters: []},
            getLastUserIdEntered: {ID: 0x36, parameters: []},
            userAdded: {ID: 0x37, parameters: []},
            userDeleted: {ID: 0x38, parameters: []},
            setScheduleSlot: {
                ID: 0x40,
                parameters: [
                    // bit pack ("bbbbbbb", 0, slot, weeklyScheduleNumber, startHour, startMinute, hours, minutes)
                    {name: "payload", type: DataType.CHAR_STR},
                ],
            },
            getScheduleSlot: {
                ID: 0x41,
                parameters: [
                    // bit pack ("bb", slot, userId)
                    {name: "payload", type: DataType.CHAR_STR},
                ],
            },
            setScheduleSlotStatus: {
                ID: 0x42,
                parameters: [
                    // bit pack ("bbb", 0, slot, status)
                    {name: "payload", type: DataType.CHAR_STR},
                ],
            },
            reflash: {
                ID: 0x60,
                response: 1,
                parameters: [
                    // bit pack ("bI", version, length)
                    {name: "payload", type: DataType.CHAR_STR},
                ],
            },
            reflashData: {
                ID: 0x61,
                response: 2,
                parameters: [
                    // bit pack ("IH", segmentId - 1, length) .. string sub (data, start, finish)
                    {name: "payload", type: DataType.CHAR_STR},
                ],
            },
            reflashStatus: {
                ID: 0x62,
                response: 3,
                parameters: [
                    // bit pack ("bI", reflashStatusParameter, 0x00)
                    {name: "payload", type: DataType.CHAR_STR},
                ],
            },
            getReflashLock: {ID: 0x90, parameters: []},
            getHistory: {ID: 0xa0, parameters: []},
            getLogin: {ID: 0xa1, parameters: []},
            getUser: {ID: 0xa2, parameters: []},
            getUsers: {ID: 0xa3, parameters: []},
            getMandatoryAttributes: {ID: 0xb0, parameters: []},
            readAttribute: {ID: 0xb1, parameters: []},
            writeAttribute: {ID: 0xb2, parameters: []},
            configureReporting: {ID: 0xb3, parameters: []},
            getBasicClusterAttributes: {ID: 0xb4, parameters: []},
        },
        commandsResponse: {
            getLockStatusRsp: {ID: 0x00, parameters: [{name: "status", type: DataType.UINT8}]},
            reflashRsp: {ID: 0x01, parameters: [{name: "status", type: DataType.UINT8}]},
            reflashDataRsp: {ID: 0x02, parameters: [{name: "status", type: DataType.UINT8}]},
            reflashStatusRsp: {ID: 0x03, parameters: [{name: "status", type: DataType.UINT8}]},
            /* boltStateRsp: {ID: 4,
                parameters: [
                    {name: 'state', type: DataType.UINT8},
                ],
            },*/ // C4 driver has this response yet there is no command - maybe a non-specific cluster response?
            /* lockStatusReportRsp: {ID: 5,
                parameters: [
                    {name: 'status', type: DataType.UINT8},
                ],
            },*/ // C4 driver has this response yet there is no command - maybe a non-specific cluster response?
            /* handleStateRsp: {ID: 6,
                parameters: [
                    {name: 'state', type: DataType.UINT8},
                ],
            },*/ // C4 driver has this response yet there is no command - maybe a non-specific cluster response?
            /* userStatusRsp: {ID: 7,
                parameters: [
                    {name: 'status', type: DataType.UINT8},
                ],
            },*/ // C4 driver has this response yet there is no command - maybe a non-specific cluster response?
        },
    },
    manuSpecificDoorman: {
        ID: 0xeacc,
        attributes: {},
        commands: {
            getConfigurationParameter: {
                ID: 0xfc,
                parameters: [
                    // bit pack ("bbb", 0x00, 0x00, configurationId)
                    {name: "payload", type: DataType.CHAR_STR},
                ],
            },
            setConfigurationParameter: {
                ID: 0xfd,
                parameters: [
                    // bit pack ("bbbb", 0x00, 0x00, configurationId, value)
                    {name: "payload", type: DataType.CHAR_STR},
                ],
            },
            integrationModeActivation: {
                ID: 0x25,
                parameters: [
                    // bit pack ("bbbbb", slot, codeType, string sub (userCode, 1, 2), string sub (userCode, 3, 4), string sub (userCode, 5, 6)) .. String duplicate (0xff, 12)
                    {name: "payload", type: DataType.CHAR_STR},
                ],
            },
            armDisarm: {
                ID: 0x4e,
                parameters: [
                    // bit pack ("bb", lockSequenceNumber, operatingParameter)
                    {name: "payload", type: DataType.CHAR_STR},
                ],
            },
        },
        commandsResponse: {},
    },
    manuSpecificProfalux1: {
        ID: 0xfc21, // Config cluster, 0xfc20 mostly for commands it seems
        manufacturerCode: ManufacturerCode.PROFALUX,
        attributes: {
            motorCoverType: {ID: 0x0000, type: DataType.UINT8}, // 0 : rolling shutters (volet), 1 : rolling shutters with tilt (BSO), 2: shade (store)
        },
        commands: {},
        commandsResponse: {},
    },
    manuSpecificAmazonWWAH: {
        ID: 0xfc57,
        manufacturerCode: ManufacturerCode.AMAZON_LAB126,
        attributes: {
            disableOTADowngrades: {ID: 0x0002, type: DataType.BOOLEAN},
            mgmtLeaveWithoutRejoinEnabled: {ID: 0x0003, type: DataType.BOOLEAN},
            nwkRetryCount: {ID: 0x0004, type: DataType.UINT8},
            macRetryCount: {ID: 0x0005, type: DataType.UINT8},
            routerCheckInEnabled: {ID: 0x0006, type: DataType.BOOLEAN},
            touchlinkInterpanEnabled: {ID: 0x0007, type: DataType.BOOLEAN},
            wwahParentClassificationEnabled: {ID: 0x0008, type: DataType.BOOLEAN},
            wwahAppEventRetryEnabled: {ID: 0x0009, type: DataType.BOOLEAN},
            wwahAppEventRetryQueueSize: {ID: 0x000a, type: DataType.UINT8},
            wwahRejoinEnabled: {ID: 0x000b, type: DataType.BOOLEAN},
            macPollFailureWaitTime: {ID: 0x000c, type: DataType.UINT8},
            configurationModeEnabled: {ID: 0x000d, type: DataType.BOOLEAN},
            currentDebugReportID: {ID: 0x000e, type: DataType.UINT8},
            tcSecurityOnNwkKeyRotationEnabled: {ID: 0x000f, type: DataType.BOOLEAN},
            wwahBadParentRecoveryEnabled: {ID: 0x0010, type: DataType.BOOLEAN},
            pendingNetworkUpdateChannel: {ID: 0x0011, type: DataType.UINT8},
            pendingNetworkUpdatePANID: {ID: 0x0012, type: DataType.UINT16},
            otaMaxOfflineDuration: {ID: 0x0013, type: DataType.UINT16},
            clusterRevision: {ID: 0xfffd, type: DataType.UINT16},
        },
        commands: {
            clearBindingTable: {ID: 0x0a, parameters: []},
        },
        commandsResponse: {},
    },
};
