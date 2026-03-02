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
            locationDesc: {ID: 0x0010, type: DataType.CHAR_STR, write: true, default: "", maxLen: 16},
            physicalEnv: {ID: 0x0011, type: DataType.ENUM8, write: true, default: 0},
            deviceEnabled: {ID: 0x0012, type: DataType.BOOLEAN, write: true, default: 1},
            alarmMask: {ID: 0x0013, type: DataType.BITMAP8, write: true, default: 0},
            disableLocalConfig: {ID: 0x0014, type: DataType.BITMAP8, write: true, default: 0},
            swBuildId: {ID: 0x4000, type: DataType.CHAR_STR, default: "", maxLen: 16},
            // custom
            schneiderMeterRadioPower: {
                ID: 0xe200,
                type: DataType.INT8,
                manufacturerCode: ManufacturerCode.SCHNEIDER_ELECTRIC,
                write: true,
                min: -128,
                max: 127,
            },
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
            mainsAlarmMask: {ID: 0x0010, type: DataType.BITMAP8, write: true, default: 0},
            mainsVoltMinThres: {ID: 0x0011, type: DataType.UINT16, write: true, max: 0xffff, default: 0},
            mainsVoltMaxThres: {ID: 0x0012, type: DataType.UINT16, write: true, max: 0xffff, default: 0xffff},
            mainsVoltageDwellTripPoint: {ID: 0x0013, type: DataType.UINT16, write: true, max: 0xffff, default: 0},
            batteryVoltage: {ID: 0x0020, type: DataType.UINT8, max: 0xff},
            batteryPercentageRemaining: {ID: 0x0021, type: DataType.UINT8, report: true, max: 0xff, default: 0},
            batteryManufacturer: {ID: 0x0030, type: DataType.CHAR_STR, write: true, default: "", maxLen: 16},
            batterySize: {ID: 0x0031, type: DataType.ENUM8, write: true, default: 0xff},
            batteryAHrRating: {ID: 0x0032, type: DataType.UINT16, write: true, max: 0xffff},
            batteryQuantity: {ID: 0x0033, type: DataType.UINT8, write: true, max: 0xff},
            batteryRatedVoltage: {ID: 0x0034, type: DataType.UINT8, write: true, max: 0xff},
            batteryAlarmMask: {ID: 0x0035, type: DataType.BITMAP8, write: true, default: 0},
            batteryVoltMinThres: {ID: 0x0036, type: DataType.UINT8, write: true, max: 0xff, default: 0},
            batteryVoltThres1: {ID: 0x0037, type: DataType.UINT8, write: true, writeOptional: true, max: 0xff, default: 0},
            batteryVoltThres2: {ID: 0x0038, type: DataType.UINT8, write: true, writeOptional: true, max: 0xff, default: 0},
            batteryVoltThres3: {ID: 0x0039, type: DataType.UINT8, write: true, writeOptional: true, max: 0xff, default: 0},
            batteryPercentMinThres: {ID: 0x003a, type: DataType.UINT8, write: true, writeOptional: true, max: 0xff, default: 0},
            batteryPercentThres1: {ID: 0x003b, type: DataType.UINT8, write: true, writeOptional: true, max: 0xff, default: 0},
            batteryPercentThres2: {ID: 0x003c, type: DataType.UINT8, write: true, writeOptional: true, max: 0xff, default: 0},
            batteryPercentThres3: {ID: 0x003d, type: DataType.UINT8, write: true, writeOptional: true, max: 0xff, default: 0},
            batteryAlarmState: {ID: 0x003e, type: DataType.BITMAP32, report: true, default: 0},
            battery2Voltage: {ID: 0x0040, type: DataType.UINT8, max: 0xff},
            battery2PercentageRemaining: {ID: 0x0041, type: DataType.UINT8, report: true, max: 0xff, default: 0},
            battery2Manufacturer: {ID: 0x0050, type: DataType.CHAR_STR, write: true, default: "", maxLen: 16},
            battery2Size: {ID: 0x0051, type: DataType.ENUM8, write: true, default: 0xff},
            battery2AHrRating: {ID: 0x0052, type: DataType.UINT16, write: true, max: 0xffff},
            battery2Quantity: {ID: 0x0053, type: DataType.UINT8, write: true, max: 0xff},
            battery2RatedVoltage: {ID: 0x0054, type: DataType.UINT8, write: true, max: 0xff},
            battery2AlarmMask: {ID: 0x0055, type: DataType.BITMAP8, write: true, default: 0},
            battery2VoltageMinThreshold: {ID: 0x0056, type: DataType.UINT8, write: true, max: 0xff, default: 0},
            battery2VoltageThreshold1: {ID: 0x0057, type: DataType.UINT8, write: true, writeOptional: true, max: 0xff, default: 0},
            battery2VoltageThreshold2: {ID: 0x0058, type: DataType.UINT8, write: true, writeOptional: true, max: 0xff, default: 0},
            battery2VoltageThreshold3: {ID: 0x0059, type: DataType.UINT8, write: true, writeOptional: true, max: 0xff, default: 0},
            battery2PercentageMinThreshold: {ID: 0x005a, type: DataType.UINT8, write: true, writeOptional: true, max: 0xff, default: 0},
            battery2PercentageThreshold1: {ID: 0x005b, type: DataType.UINT8, write: true, writeOptional: true, max: 0xff, default: 0},
            battery2PercentageThreshold2: {ID: 0x005c, type: DataType.UINT8, write: true, writeOptional: true, max: 0xff, default: 0},
            battery2PercentageThreshold3: {ID: 0x005d, type: DataType.UINT8, write: true, writeOptional: true, max: 0xff, default: 0},
            battery2AlarmState: {ID: 0x005e, type: DataType.BITMAP32, report: true, default: 0},
            battery3Voltage: {ID: 0x0060, type: DataType.UINT8, max: 0xff},
            battery3PercentageRemaining: {ID: 0x0061, type: DataType.UINT8, report: true, max: 0xff, default: 0},
            battery3Manufacturer: {ID: 0x0070, type: DataType.CHAR_STR, write: true, default: "", maxLen: 16},
            battery3Size: {ID: 0x0071, type: DataType.ENUM8, write: true, default: 0xff},
            battery3AHrRating: {ID: 0x0072, type: DataType.UINT16, write: true, max: 0xffff},
            battery3Quantity: {ID: 0x0073, type: DataType.UINT8, write: true, max: 0xff},
            battery3RatedVoltage: {ID: 0x0074, type: DataType.UINT8, write: true, max: 0xff},
            battery3AlarmMask: {ID: 0x0075, type: DataType.BITMAP8, write: true, default: 0},
            battery3VoltageMinThreshold: {ID: 0x0076, type: DataType.UINT8, write: true, max: 0xff, default: 0},
            battery3VoltageThreshold1: {ID: 0x0077, type: DataType.UINT8, write: true, writeOptional: true, max: 0xff, default: 0},
            battery3VoltageThreshold2: {ID: 0x0078, type: DataType.UINT8, write: true, writeOptional: true, max: 0xff, default: 0},
            battery3VoltageThreshold3: {ID: 0x0079, type: DataType.UINT8, write: true, writeOptional: true, max: 0xff, default: 0},
            battery3PercentageMinThreshold: {ID: 0x007a, type: DataType.UINT8, write: true, writeOptional: true, max: 0xff, default: 0},
            battery3PercentageThreshold1: {ID: 0x007b, type: DataType.UINT8, write: true, writeOptional: true, max: 0xff, default: 0},
            battery3PercentageThreshold2: {ID: 0x007c, type: DataType.UINT8, write: true, writeOptional: true, max: 0xff, default: 0},
            battery3PercentageThreshold3: {ID: 0x007d, type: DataType.UINT8, write: true, writeOptional: true, max: 0xff, default: 0},
            battery3AlarmState: {ID: 0x007e, type: DataType.BITMAP32, report: true, default: 0},
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
            devTempAlarmMask: {ID: 0x0010, type: DataType.BITMAP8, write: true, default: 0},
            lowTempThres: {ID: 0x0011, type: DataType.INT16, write: true, min: -200, max: 200},
            highTempThres: {ID: 0x0012, type: DataType.INT16, write: true, min: -200, max: 200},
            lowTempDwellTripPoint: {ID: 0x0013, type: DataType.UINT24, write: true, max: 0xffffff},
            highTempDwellTripPoint: {ID: 0x0014, type: DataType.UINT24, write: true, max: 0xffffff},
        },
        commands: {},
        commandsResponse: {},
    },
    genIdentify: {
        ID: 0x0003,
        attributes: {
            identifyTime: {ID: 0x0000, type: DataType.UINT16, write: true, required: true, max: 0xffff, default: 0},
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
            ezmodeInvoke: {ID: 0x02, parameters: [{name: "action", type: DataType.UINT8, max: 0xff}]},
            updateCommissionState: {
                ID: 0x03,
                parameters: [
                    {name: "action", type: DataType.UINT8, max: 0xff},
                    {name: "commstatemask", type: DataType.UINT8, max: 0xff},
                ],
            },
        },
        commandsResponse: {
            identifyQueryRsp: {ID: 0x00, parameters: [{name: "timeout", type: DataType.UINT16, max: 0xffff}], required: true},
        },
    },
    /** Note: an end device being "sleepy" makes everything optional, even if marked mandatory */
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
    /** Note: an end device being "sleepy" makes everything optional, even if marked mandatory */
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
                    {name: "extensionfieldsets", type: BuffaloZclDataType.EXTENSION_FIELD_SETS},
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
                    {
                        name: "transitionTime",
                        type: DataType.UINT16,
                        conditions: [{type: ParameterCondition.MINIMUM_REMAINING_BUFFER_BYTES, value: 2}],
                    },
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
                    {name: "extensionfieldsets", type: BuffaloZclDataType.EXTENSION_FIELD_SETS},
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
                    {name: "value", type: DataType.UINT16, max: 0xffff},
                    {name: "value2", type: DataType.UINT16, max: 0xffff},
                ],
            },
            tradfriArrowHold: {ID: 0x08, parameters: [{name: "value", type: DataType.UINT16, max: 0xffff}]},
            tradfriArrowRelease: {ID: 0x09, parameters: [{name: "value", type: DataType.UINT16, max: 0xffff}]},
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
                        min: 0,
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
            onOff: {ID: 0x0000, type: DataType.BOOLEAN, report: true, scene: true, required: true, default: 0},
            globalSceneCtrl: {ID: 0x4000, type: DataType.BOOLEAN, default: 1},
            onTime: {ID: 0x4001, type: DataType.UINT16, write: true, max: 0xffff, default: 0},
            offWaitTime: {ID: 0x4002, type: DataType.UINT16, write: true, max: 0xffff, default: 0},
            startUpOnOff: {ID: 0x4003, type: DataType.ENUM8, write: true, max: 0xff, special: [["SetToPreviousValue", "ff"]]},
            // custom
            nodonTransitionTime: {ID: 0x0001, type: DataType.UINT16, manufacturerCode: ManufacturerCode.NODON, write: true, max: 0xffff},
            tuyaBacklightSwitch: {ID: 0x5000, type: DataType.ENUM8, write: true, max: 0xff},
            tuyaBacklightMode: {ID: 0x8001, type: DataType.ENUM8, write: true, max: 0xff},
            moesStartUpOnOff: {ID: 0x8002, type: DataType.ENUM8, write: true, max: 0xff},
            tuyaOperationMode: {ID: 0x8004, type: DataType.ENUM8, write: true, max: 0xff},
            elkoPreWarningTime: {ID: 0xe000, type: DataType.UINT16, manufacturerCode: ManufacturerCode.ADEO, write: true, max: 0xffff},
            elkoOnTimeReload: {ID: 0xe001, type: DataType.UINT32, manufacturerCode: ManufacturerCode.ADEO, write: true, max: 0xffffffff},
            elkoOnTimeReloadOptions: {ID: 0xe002, type: DataType.BITMAP8, manufacturerCode: ManufacturerCode.ADEO, write: true},
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
            tuyaAction2: {ID: 0xfc, parameters: [{name: "value", type: DataType.UINT8, max: 0xff}]},
            tuyaAction: {
                ID: 0xfd,
                parameters: [
                    {name: "value", type: DataType.UINT8, max: 0xff},
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
            switchActions: {ID: 0x0010, type: DataType.ENUM8, required: true, write: true, min: 0, max: 2},
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
                report: true,
                scene: true,
                required: true,
                default: 0xff,
                // for genLevelCtrlForLighting:
                // min: 1,
                // max: 0xfe,
            },
            remainingTime: {ID: 0x0001, type: DataType.UINT16, max: 0xffff, default: 0},
            minLevel: {ID: 0x0002, type: DataType.UINT8, default: 0},
            maxLevel: {ID: 0x0003, type: DataType.UINT8, max: 0xff, default: 0xff},
            currentFrequency: {ID: 0x0004, type: DataType.UINT16, report: true, default: 0},
            minFrequency: {ID: 0x0005, type: DataType.UINT16, default: 0},
            maxFrequency: {ID: 0x0006, type: DataType.UINT16, max: 0xffff, default: 0},
            options: {ID: 0x000f, type: DataType.BITMAP8, write: true, default: 0},
            onOffTransitionTime: {ID: 0x0010, type: DataType.UINT16, write: true, max: 0xffff, default: 0},
            onLevel: {ID: 0x0011, type: DataType.UINT8, write: true, default: 0xff},
            onTransitionTime: {ID: 0x0012, type: DataType.UINT16, write: true, max: 0xfffe, default: 0xffff},
            offTransitionTime: {ID: 0x0013, type: DataType.UINT16, write: true, max: 0xfffe, default: 0xffff},
            defaultMoveRate: {ID: 0x0014, type: DataType.UINT8, write: true, max: 0xfe},
            startUpCurrentLevel: {
                ID: 0x4000,
                type: DataType.UINT8,
                write: true,
                max: 0xff,
                special: [
                    ["MinimumDeviceValuePermitted", "00"],
                    ["SetToPreviousValue", "ff"],
                ],
            },
            // custom
            // TODO: needed?
            elkoStartUpCurrentLevel: {ID: 0x4000, type: DataType.UINT8, manufacturerCode: ManufacturerCode.ADEO, write: true, max: 0xff},
        },
        commands: {
            moveToLevel: {
                ID: 0x00,
                parameters: [
                    {name: "level", type: DataType.UINT8},
                    {name: "transtime", type: DataType.UINT16},
                    // XXX: behind bytes condition due to likely missing fields with many devices
                    {name: "optionsMask", type: DataType.BITMAP8, conditions: [{type: ParameterCondition.MINIMUM_REMAINING_BUFFER_BYTES, value: 1}]},
                    {
                        name: "optionsOverride",
                        type: DataType.BITMAP8,
                        conditions: [{type: ParameterCondition.MINIMUM_REMAINING_BUFFER_BYTES, value: 1}],
                    },
                ],
                required: true,
            },
            move: {
                ID: 0x01,
                parameters: [
                    {name: "movemode", type: DataType.ENUM8},
                    {name: "rate", type: DataType.UINT8},
                    // XXX: behind bytes condition due to likely missing fields with many devices
                    {name: "optionsMask", type: DataType.BITMAP8, conditions: [{type: ParameterCondition.MINIMUM_REMAINING_BUFFER_BYTES, value: 1}]},
                    {
                        name: "optionsOverride",
                        type: DataType.BITMAP8,
                        conditions: [{type: ParameterCondition.MINIMUM_REMAINING_BUFFER_BYTES, value: 1}],
                    },
                ],
                required: true,
            },
            step: {
                ID: 0x02,
                parameters: [
                    {name: "stepmode", type: DataType.ENUM8},
                    {name: "stepsize", type: DataType.UINT8},
                    {name: "transtime", type: DataType.UINT16},
                    // XXX: behind bytes condition due to likely missing fields with many devices
                    {name: "optionsMask", type: DataType.BITMAP8, conditions: [{type: ParameterCondition.MINIMUM_REMAINING_BUFFER_BYTES, value: 1}]},
                    {
                        name: "optionsOverride",
                        type: DataType.BITMAP8,
                        conditions: [{type: ParameterCondition.MINIMUM_REMAINING_BUFFER_BYTES, value: 1}],
                    },
                ],
                required: true,
            },
            stop: {
                ID: 0x03,
                parameters: [
                    // XXX: behind bytes condition due to likely missing fields with many devices
                    {name: "optionsMask", type: DataType.BITMAP8, conditions: [{type: ParameterCondition.MINIMUM_REMAINING_BUFFER_BYTES, value: 1}]},
                    {
                        name: "optionsOverride",
                        type: DataType.BITMAP8,
                        conditions: [{type: ParameterCondition.MINIMUM_REMAINING_BUFFER_BYTES, value: 1}],
                    },
                ],
                required: true,
            },
            moveToLevelWithOnOff: {
                ID: 0x04,
                parameters: [
                    {name: "level", type: DataType.UINT8},
                    {name: "transtime", type: DataType.UINT16},
                    // XXX: behind bytes condition due to likely missing fields with many devices
                    {name: "optionsMask", type: DataType.BITMAP8, conditions: [{type: ParameterCondition.MINIMUM_REMAINING_BUFFER_BYTES, value: 1}]},
                    {
                        name: "optionsOverride",
                        type: DataType.BITMAP8,
                        conditions: [{type: ParameterCondition.MINIMUM_REMAINING_BUFFER_BYTES, value: 1}],
                    },
                ],
                required: true,
            },
            moveWithOnOff: {
                ID: 0x05,
                parameters: [
                    {name: "movemode", type: DataType.ENUM8},
                    {name: "rate", type: DataType.UINT8},
                    // XXX: behind bytes condition due to likely missing fields with many devices
                    {name: "optionsMask", type: DataType.BITMAP8, conditions: [{type: ParameterCondition.MINIMUM_REMAINING_BUFFER_BYTES, value: 1}]},
                    {
                        name: "optionsOverride",
                        type: DataType.BITMAP8,
                        conditions: [{type: ParameterCondition.MINIMUM_REMAINING_BUFFER_BYTES, value: 1}],
                    },
                ],
                required: true,
            },
            stepWithOnOff: {
                ID: 0x06,
                parameters: [
                    {name: "stepmode", type: DataType.ENUM8},
                    {name: "stepsize", type: DataType.UINT8},
                    {name: "transtime", type: DataType.UINT16},
                    // XXX: behind bytes condition due to likely missing fields with many devices
                    {name: "optionsMask", type: DataType.BITMAP8, conditions: [{type: ParameterCondition.MINIMUM_REMAINING_BUFFER_BYTES, value: 1}]},
                    {
                        name: "optionsOverride",
                        type: DataType.BITMAP8,
                        conditions: [{type: ParameterCondition.MINIMUM_REMAINING_BUFFER_BYTES, value: 1}],
                    },
                ],
                required: true,
            },
            stopWithOnOff: {
                ID: 0x07,
                parameters: [
                    // XXX: behind bytes condition due to likely missing fields with many devices
                    {name: "optionsMask", type: DataType.BITMAP8, conditions: [{type: ParameterCondition.MINIMUM_REMAINING_BUFFER_BYTES, value: 1}]},
                    {
                        name: "optionsOverride",
                        type: DataType.BITMAP8,
                        conditions: [{type: ParameterCondition.MINIMUM_REMAINING_BUFFER_BYTES, value: 1}],
                    },
                ],
                required: true,
            },
            // only `required: true` if `currentFrequency` attribute supported
            moveToClosestFrequency: {ID: 0x08, parameters: [{name: "frequency", type: DataType.UINT16}]},
            // custom
            moveToLevelTuya: {
                ID: 0xf0,
                parameters: [
                    {name: "level", type: DataType.UINT16, max: 0xffff},
                    {name: "transtime", type: DataType.UINT16, max: 0xffff},
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
            time: {ID: 0x0000, type: DataType.UTC, write: true, required: true, max: 0xfffffffe, default: 0xffffffff},
            timeStatus: {ID: 0x0001, type: DataType.BITMAP8, write: true, required: true, default: 0},
            timeZone: {ID: 0x0002, type: DataType.INT32, write: true, min: -86400, max: 86400, default: 0},
            dstStart: {ID: 0x0003, type: DataType.UINT32, write: true, max: 0xfffffffe, default: 0xffffffff},
            dstEnd: {ID: 0x0004, type: DataType.UINT32, write: true, max: 0xfffffffe, default: 0xffffffff},
            dstShift: {ID: 0x0005, type: DataType.INT32, write: true, min: -86400, max: 86400, default: 0},
            standardTime: {ID: 0x0006, type: DataType.UINT32, max: 0xfffffffe, default: 0xffffffff},
            localTime: {ID: 0x0007, type: DataType.UINT32, max: 0xfffffffe, default: 0xffffffff},
            lastSetTime: {ID: 0x0008, type: DataType.UTC, default: 0xffffffff},
            validUntilTime: {ID: 0x0009, type: DataType.UTC, write: true, default: 0xffffffff},
        },
        commands: {},
        commandsResponse: {},
    },
    genRssiLocation: {
        ID: 0x000b,
        attributes: {
            /** [2: coordinator system, 1: 2-D, 1: absolute] */
            type: {ID: 0x0000, type: DataType.DATA8, required: true, write: true},
            method: {ID: 0x0001, type: DataType.ENUM8, required: true, write: true},
            age: {ID: 0x0002, type: DataType.UINT16, max: 0xffff},
            qualityMeasure: {ID: 0x0003, type: DataType.UINT8, max: 100},
            numOfDevices: {ID: 0x0004, type: DataType.UINT8, max: 0xff},
            coordinate1: {ID: 0x0010, type: DataType.INT16, required: true, write: true, min: -0x8000, max: 0x7fff},
            coordinate2: {ID: 0x0011, type: DataType.INT16, required: true, write: true, min: -0x8000, max: 0x7fff},
            coordinate3: {ID: 0x0012, type: DataType.INT16, write: true, min: -0x8000, max: 0x7fff},
            power: {ID: 0x0013, type: DataType.INT16, required: true, write: true, min: -0x8000, max: 0x7fff},
            pathLossExponent: {ID: 0x0014, type: DataType.UINT16, required: true, write: true},
            reportingPeriod: {ID: 0x0015, type: DataType.UINT16, write: true, max: 0xffff},
            calcPeriod: {ID: 0x0016, type: DataType.UINT16, write: true, max: 0xffff},
            numRSSIMeasurements: {ID: 0x0017, type: DataType.UINT8, required: true, write: true, min: 0x01, max: 0xff},
        },
        commands: {
            setAbsolute: {
                ID: 0x00,
                parameters: [
                    {name: "coordinate1", type: DataType.INT16},
                    {name: "coordinate2", type: DataType.INT16},
                    {name: "coordinate3", type: DataType.INT16},
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
                        name: "coordinate1",
                        type: DataType.INT16,
                        conditions: [{type: ParameterCondition.FIELD_EQUAL, field: "status", value: Status.SUCCESS}],
                    },
                    {
                        name: "coordinate2",
                        type: DataType.INT16,
                        conditions: [{type: ParameterCondition.FIELD_EQUAL, field: "status", value: Status.SUCCESS}],
                    },
                    {
                        name: "coordinate3",
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
                    {name: "coordinate1", type: DataType.INT16},
                    {name: "coordinate2", type: DataType.INT16},
                    {
                        name: "coordinate3",
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
                    {name: "coordinate1", type: DataType.INT16},
                    {name: "coordinate2", type: DataType.INT16},
                    {
                        name: "coordinate3",
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
            description: {ID: 0x001c, type: DataType.CHAR_STR, write: true, writeOptional: true, default: "\u0000"},
            maxPresentValue: {ID: 0x0041, type: DataType.SINGLE_PREC, write: true, writeOptional: true},
            minPresentValue: {ID: 0x0045, type: DataType.SINGLE_PREC, write: true, writeOptional: true},
            outOfService: {ID: 0x0051, type: DataType.BOOLEAN, required: true, write: true, writeOptional: true, default: 0},
            presentValue: {ID: 0x0055, type: DataType.SINGLE_PREC, required: true, write: true, report: true},
            reliability: {ID: 0x0067, type: DataType.ENUM8, write: true, writeOptional: true, default: 0x00},
            resolution: {ID: 0x006a, type: DataType.SINGLE_PREC, write: true, writeOptional: true},
            statusFlags: {ID: 0x006f, type: DataType.BITMAP8, required: true, report: true, max: 0x0f, default: 0},
            engineeringUnits: {ID: 0x0075, type: DataType.ENUM16, write: true, writeOptional: true, max: 0xffff},
            applicationType: {ID: 0x0100, type: DataType.UINT32, max: 0xffffffff},
        },
        commands: {},
        commandsResponse: {},
    },
    genAnalogOutput: {
        ID: 0x000d,
        attributes: {
            description: {ID: 0x001c, type: DataType.CHAR_STR, write: true, writeOptional: true, default: "\u0000"},
            maxPresentValue: {ID: 0x0041, type: DataType.SINGLE_PREC, write: true, writeOptional: true},
            minPresentValue: {ID: 0x0045, type: DataType.SINGLE_PREC, write: true, writeOptional: true},
            outOfService: {ID: 0x0051, type: DataType.BOOLEAN, required: true, write: true, writeOptional: true, default: 0},
            presentValue: {ID: 0x0055, type: DataType.SINGLE_PREC, required: true, write: true, report: true},
            priorityArray: {
                ID: 0x0057,
                type: DataType.ARRAY, // TODO: BuffaloZclDataType.LIST_ANALOG_PRIORITY
                write: true,
                // default: [[0, 0.0],[0, 0.0],[0, 0.0],[0, 0.0],[0, 0.0],[0, 0.0],[0, 0.0],[0, 0.0],[0, 0.0],[0, 0.0],[0, 0.0],[0, 0.0],[0, 0.0],[0, 0.0],[0, 0.0],[0, 0.0]],
            },
            reliability: {ID: 0x0067, type: DataType.ENUM8, write: true, writeOptional: true, default: 0x00},
            relinquishDefault: {ID: 0x0068, type: DataType.SINGLE_PREC, write: true, writeOptional: true},
            resolution: {ID: 0x006a, type: DataType.SINGLE_PREC, write: true, writeOptional: true},
            statusFlags: {ID: 0x006f, type: DataType.BITMAP8, required: true, report: true, max: 0x0f, default: 0},
            engineeringUnits: {ID: 0x0075, type: DataType.ENUM16, write: true, writeOptional: true, max: 0xffff},
            applicationType: {ID: 0x0100, type: DataType.UINT32, max: 0xffffffff},
        },
        commands: {},
        commandsResponse: {},
    },
    genAnalogValue: {
        ID: 0x000e,
        attributes: {
            description: {ID: 0x001c, type: DataType.CHAR_STR, write: true, writeOptional: true, default: "\u0000"},
            outOfService: {ID: 0x0051, type: DataType.BOOLEAN, required: true, write: true, writeOptional: true, default: 0},
            presentValue: {ID: 0x0055, type: DataType.SINGLE_PREC, required: true, write: true},
            priorityArray: {
                ID: 0x0057,
                type: DataType.ARRAY, // TODO: BuffaloZclDataType.LIST_ANALOG_PRIORITY
                write: true,
                // default: [[0, 0.0],[0, 0.0],[0, 0.0],[0, 0.0],[0, 0.0],[0, 0.0],[0, 0.0],[0, 0.0],[0, 0.0],[0, 0.0],[0, 0.0],[0, 0.0],[0, 0.0],[0, 0.0],[0, 0.0],[0, 0.0]],
            },
            reliability: {ID: 0x0067, type: DataType.ENUM8, write: true, writeOptional: true, default: 0x00},
            relinquishDefault: {ID: 0x0068, type: DataType.SINGLE_PREC, write: true, writeOptional: true},
            statusFlags: {ID: 0x006f, type: DataType.BITMAP8, required: true, max: 0x0f, default: 0},
            engineeringUnits: {ID: 0x0075, type: DataType.ENUM16, write: true, writeOptional: true, max: 0xffff},
            applicationType: {ID: 0x0100, type: DataType.UINT32, max: 0xffffffff},
        },
        commands: {},
        commandsResponse: {},
    },
    genBinaryInput: {
        ID: 0x000f,
        attributes: {
            activeText: {ID: 0x0004, type: DataType.CHAR_STR, write: true, writeOptional: true, default: "\u0000"},
            description: {ID: 0x001c, type: DataType.CHAR_STR, write: true, writeOptional: true, default: "\u0000"},
            inactiveText: {ID: 0x002e, type: DataType.CHAR_STR, write: true, writeOptional: true, default: "\u0000"},
            outOfService: {ID: 0x0051, type: DataType.BOOLEAN, required: true, write: true, writeOptional: true, default: 0},
            polarity: {ID: 0x0054, type: DataType.ENUM8, default: 0},
            presentValue: {ID: 0x0055, type: DataType.BOOLEAN, required: true, write: true, writeOptional: true},
            reliability: {ID: 0x0067, type: DataType.ENUM8, write: true, writeOptional: true, default: 0x00},
            statusFlags: {ID: 0x006f, type: DataType.BITMAP8, required: true, max: 0x0f, default: 0},
            applicationType: {ID: 0x0100, type: DataType.UINT32, max: 0xffffffff},
        },
        commands: {},
        commandsResponse: {},
    },
    genBinaryOutput: {
        ID: 0x0010,
        attributes: {
            activeText: {ID: 0x0004, type: DataType.CHAR_STR, write: true, writeOptional: true, default: "\u0000"},
            description: {ID: 0x001c, type: DataType.CHAR_STR, write: true, writeOptional: true, default: "\u0000"},
            inactiveText: {ID: 0x002e, type: DataType.CHAR_STR, write: true, writeOptional: true, default: "\u0000"},
            minimumOffTime: {ID: 0x0042, type: DataType.UINT32, write: true, writeOptional: true, default: 0xffffffff},
            minimumOnTime: {ID: 0x0043, type: DataType.UINT32, write: true, writeOptional: true, default: 0xffffffff},
            outOfService: {ID: 0x0051, type: DataType.BOOLEAN, required: true, writeOptional: true, write: true, default: 0},
            polarity: {ID: 0x0054, type: DataType.ENUM8, default: 0},
            presentValue: {ID: 0x0055, type: DataType.BOOLEAN, required: true, write: true, writeOptional: true},
            priorityArray: {
                ID: 0x0057,
                type: DataType.ARRAY, // TODO: BuffaloZclDataType.LIST_BINARY_PRIORITY
                write: true,
                // default: [[0, 0],[0, 0],[0, 0],[0, 0],[0, 0],[0, 0],[0, 0],[0, 0],[0, 0],[0, 0],[0, 0],[0, 0],[0, 0],[0, 0],[0, 0],[0, 0]],
            },
            reliability: {ID: 0x0067, type: DataType.ENUM8, write: true, writeOptional: true},
            relinquishDefault: {ID: 0x0068, type: DataType.BOOLEAN, write: true, writeOptional: true},
            statusFlags: {ID: 0x006f, type: DataType.BITMAP8, required: true, max: 0x0f, default: 0},
            applicationType: {ID: 0x0100, type: DataType.UINT32, max: 0xffffffff},
        },
        commands: {},
        commandsResponse: {},
    },
    genBinaryValue: {
        ID: 0x0011,
        attributes: {
            activeText: {ID: 0x0004, type: DataType.CHAR_STR, write: true, writeOptional: true, default: "\u0000"},
            description: {ID: 0x001c, type: DataType.CHAR_STR, write: true, writeOptional: true, default: "\u0000"},
            inactiveText: {ID: 0x002e, type: DataType.CHAR_STR, write: true, writeOptional: true, default: "\u0000"},
            minimumOffTime: {ID: 0x0042, type: DataType.UINT32, write: true, writeOptional: true, default: 0xffffffff},
            minimumOnTime: {ID: 0x0043, type: DataType.UINT32, write: true, writeOptional: true, default: 0xffffffff},
            outOfService: {ID: 0x0051, type: DataType.BOOLEAN, required: true, writeOptional: true, write: true, default: 0},
            presentValue: {ID: 0x0055, type: DataType.BOOLEAN, required: true, writeOptional: true, write: true},
            priorityArray: {
                ID: 0x0057,
                type: DataType.ARRAY, // TODO: BuffaloZclDataType.LIST_BINARY_PRIORITY
                write: true,
                // default: [[0, 0],[0, 0],[0, 0],[0, 0],[0, 0],[0, 0],[0, 0],[0, 0],[0, 0],[0, 0],[0, 0],[0, 0],[0, 0],[0, 0],[0, 0],[0, 0]],
            },
            reliability: {ID: 0x0067, type: DataType.ENUM8, write: true, writeOptional: true},
            relinquishDefault: {ID: 0x0068, type: DataType.BOOLEAN, write: true, writeOptional: true},
            statusFlags: {ID: 0x006f, type: DataType.BITMAP8, required: true, max: 0x0f, default: 0},
            applicationType: {ID: 0x0100, type: DataType.UINT32, max: 0xffffffff},
        },
        commands: {},
        commandsResponse: {},
    },
    genMultistateInput: {
        ID: 0x0012,
        attributes: {
            stateText: {ID: 0x000e, type: DataType.ARRAY, write: true, writeOptional: true /*default: null*/},
            description: {ID: 0x001c, type: DataType.CHAR_STR, write: true, writeOptional: true, default: "\u0000"},
            numberOfStates: {ID: 0x004a, type: DataType.UINT16, required: true, write: true, writeOptional: true, min: 1, max: 0xffff, default: 0},
            outOfService: {ID: 0x0051, type: DataType.BOOLEAN, required: true, write: true, writeOptional: true, default: 0},
            presentValue: {ID: 0x0055, type: DataType.UINT16, required: true, write: true, writeOptional: true},
            reliability: {ID: 0x0067, type: DataType.ENUM8, write: true, writeOptional: true, default: 0x00},
            statusFlags: {ID: 0x006f, type: DataType.BITMAP8, required: true, max: 0x0f, default: 0},
            applicationType: {ID: 0x0100, type: DataType.UINT32, max: 0xffffffff},
        },
        commands: {},
        commandsResponse: {},
    },
    genMultistateOutput: {
        ID: 0x0013,
        attributes: {
            stateText: {ID: 0x000e, type: DataType.ARRAY, write: true, writeOptional: true /*default: null*/},
            description: {ID: 0x001c, type: DataType.CHAR_STR, write: true, writeOptional: true, default: "\u0000"},
            numberOfStates: {ID: 0x004a, type: DataType.UINT16, required: true, write: true, writeOptional: true, min: 1, max: 0xffff, default: 0},
            outOfService: {ID: 0x0051, type: DataType.BOOLEAN, required: true, write: true, writeOptional: true, default: 0},
            presentValue: {ID: 0x0055, type: DataType.UINT16, required: true, write: true},
            priorityArray: {
                ID: 0x0057,
                type: DataType.ARRAY, // TODO: BuffaloZclDataType.LIST_BINARY_PRIORITY
                write: true,
                // default: [[0, 0],[0, 0],[0, 0],[0, 0],[0, 0],[0, 0],[0, 0],[0, 0],[0, 0],[0, 0],[0, 0],[0, 0],[0, 0],[0, 0],[0, 0],[0, 0]],
            },
            reliability: {ID: 0x0067, type: DataType.ENUM8, write: true, writeOptional: true, default: 0x00},
            relinquishDefault: {ID: 0x0068, type: DataType.UINT16, write: true, writeOptional: true},
            statusFlags: {ID: 0x006f, type: DataType.BITMAP8, required: true, max: 0x0f, default: 0},
            applicationType: {ID: 0x0100, type: DataType.UINT32, max: 0xffffffff},
        },
        commands: {},
        commandsResponse: {},
    },
    genMultistateValue: {
        ID: 0x0014,
        attributes: {
            stateText: {ID: 0x000e, type: DataType.ARRAY, write: true, writeOptional: true /*default: null*/},
            description: {ID: 0x001c, type: DataType.CHAR_STR, write: true, writeOptional: true, default: "\u0000"},
            numberOfStates: {ID: 0x004a, type: DataType.UINT16, required: true, write: true, writeOptional: true, min: 1, max: 0xffff, default: 0},
            outOfService: {ID: 0x0051, type: DataType.BOOLEAN, required: true, write: true, writeOptional: true, default: 0},
            presentValue: {ID: 0x0055, type: DataType.UINT16, required: true, write: true},
            priorityArray: {
                ID: 0x0057,
                type: DataType.ARRAY, // TODO: BuffaloZclDataType.LIST_BINARY_PRIORITY
                write: true,
                // default: [[0, 0],[0, 0],[0, 0],[0, 0],[0, 0],[0, 0],[0, 0],[0, 0],[0, 0],[0, 0],[0, 0],[0, 0],[0, 0],[0, 0],[0, 0],[0, 0]],
            },
            reliability: {ID: 0x0067, type: DataType.ENUM8, write: true, writeOptional: true, default: 0x00},
            relinquishDefault: {ID: 0x0068, type: DataType.UINT16, write: true, writeOptional: true},
            statusFlags: {ID: 0x006f, type: DataType.BITMAP8, required: true, max: 0x0f, default: 0},
            applicationType: {ID: 0x0100, type: DataType.UINT32, max: 0xffffffff},
        },
        commands: {},
        commandsResponse: {},
    },
    genCommissioning: {
        ID: 0x0015,
        attributes: {
            shortress: {ID: 0x0000, type: DataType.UINT16, write: true, required: true, max: 0xfff7},
            extendedPANId: {
                ID: 0x0001,
                type: DataType.IEEE_ADDR,
                write: true,
                required: true,
                default: "0xffffffffffffffff",
                special: [["PANIdUnspecified", "ffffffffffffffff"]],
            },
            panId: {ID: 0x0002, type: DataType.UINT16, write: true, required: true, max: 0xffff},
            channelmask: {ID: 0x0003, type: DataType.BITMAP32, write: true, required: true},
            protocolVersion: {ID: 0x0004, type: DataType.UINT8, write: true, required: true, min: 0x02, max: 0x02},
            stackProfile: {ID: 0x0005, type: DataType.UINT8, write: true, required: true, min: 0x01, max: 0x02},
            startupControl: {ID: 0x0006, type: DataType.ENUM8, write: true, required: true, max: 0x03},
            trustCenterress: {
                ID: 0x0010,
                type: DataType.IEEE_ADDR,
                write: true,
                required: true,
                default: "0x0000000000000000",
                special: [["AddressUnspecified", "0000000000000000"]],
            },
            trustCenterMasterKey: {ID: 0x0011, type: DataType.SEC_KEY, write: true},
            networkKey: {ID: 0x0012, type: DataType.SEC_KEY, write: true, required: true},
            useInsecureJoin: {ID: 0x0013, type: DataType.BOOLEAN, write: true, required: true, default: 1},
            preconfiguredLinkKey: {ID: 0x0014, type: DataType.SEC_KEY, write: true, required: true},
            networkKeySeqNum: {ID: 0x0015, type: DataType.UINT8, write: true, required: true, max: 0xff, default: 0},
            networkKeyType: {ID: 0x0016, type: DataType.ENUM8, write: true, required: true},
            networkManagerress: {ID: 0x0017, type: DataType.UINT16, write: true, required: true, default: 0},

            scanAttempts: {ID: 0x0020, type: DataType.UINT8, write: true, min: 1, max: 255, default: 5},
            timeBetweenScans: {ID: 0x0021, type: DataType.UINT16, write: true, min: 1, max: 65535, default: 100},
            rejoinInterval: {ID: 0x0022, type: DataType.UINT16, write: true, min: 1, default: 60},
            maxRejoinInterval: {ID: 0x0023, type: DataType.UINT16, write: true, min: 1, max: 65535, default: 3600},

            indirectPollRate: {ID: 0x0030, type: DataType.UINT16, write: true, max: 65535},
            parentRetryThreshold: {ID: 0x0031, type: DataType.UINT8, max: 255},

            concentratorFlag: {ID: 0x0040, type: DataType.BOOLEAN, write: true, default: 0},
            concentratorRadius: {ID: 0x0041, type: DataType.UINT8, write: true, max: 255, default: 15},
            concentratorDiscoveryTime: {ID: 0x0042, type: DataType.UINT8, write: true, max: 255, default: 0},
        },
        commands: {
            restartDevice: {
                ID: 0x00,
                parameters: [
                    /** [4: reserved, 1: immediate, 3: startup mode] */
                    {name: "options", type: DataType.BITMAP8},
                    {name: "delay", type: DataType.UINT8},
                    {name: "jitter", type: DataType.UINT8},
                ],
                required: true,
            },
            saveStartupParams: {
                ID: 0x01,
                parameters: [
                    /** reserved */
                    {name: "options", type: DataType.BITMAP8},
                    {name: "index", type: DataType.UINT8},
                ],
            },
            restoreStartupParams: {
                ID: 0x02,
                parameters: [
                    /** reserved */
                    {name: "options", type: DataType.BITMAP8},
                    {name: "index", type: DataType.UINT8},
                ],
            },
            resetStartupParams: {
                ID: 0x03,
                parameters: [
                    /** [5: reserved, 1: erase index, 1: reset all, 1: reset current] */
                    {name: "options", type: DataType.BITMAP8},
                    {name: "index", type: DataType.UINT8},
                ],
                required: true,
            },
        },
        commandsResponse: {
            restartDeviceRsp: {ID: 0x00, parameters: [{name: "status", type: DataType.ENUM8}], required: true},
            saveStartupParamsRsp: {ID: 0x01, parameters: [{name: "status", type: DataType.ENUM8}], required: true},
            restoreStartupParamsRsp: {ID: 0x02, parameters: [{name: "status", type: DataType.ENUM8}], required: true},
            resetStartupParamsRsp: {ID: 0x03, parameters: [{name: "status", type: DataType.ENUM8}], required: true},
        },
    },
    piPartition: {
        ID: 0x00016,
        attributes: {
            maximumIncomingTransferSize: {ID: 0x0000, type: DataType.UINT16, required: true, max: 0xffff, default: 0x0500},
            maximumOutgoingTransferSize: {ID: 0x0001, type: DataType.UINT16, required: true, max: 0xffff, default: 0x0500},
            partionedFrameSize: {ID: 0x0002, type: DataType.UINT8, required: true, write: true, max: 0xff, default: 0x50},
            largeFrameSize: {ID: 0x0003, type: DataType.UINT16, required: true, write: true, max: 0xffff, default: 0x0500},
            numberOfAckFrame: {ID: 0x0004, type: DataType.UINT8, required: true, write: true, max: 0xff, default: 100},
            nackTimeout: {ID: 0x0005, type: DataType.UINT16, required: true, max: 0xffff},
            interframeDelay: {ID: 0x0006, type: DataType.UINT8, required: true, write: true, max: 0xff},
            numberOfSendRetries: {ID: 0x0007, type: DataType.UINT8, required: true, max: 0xff, default: 3},
            senderTimeout: {ID: 0x0008, type: DataType.UINT16, required: true, max: 0xffff},
            receiverTimeout: {ID: 0x0009, type: DataType.UINT16, required: true, max: 0xffff},
        },
        commands: {
            transferPartionedFrame: {
                ID: 0x00,
                parameters: [
                    /** [6: reserved, 1: indicator length, 1: first block] */
                    {name: "fragmentionOptions", type: DataType.BITMAP8},
                    {
                        name: "partitionIndicator",
                        type: DataType.UINT8,
                        conditions: [{type: ParameterCondition.BITMASK_SET, param: "fragmentationOptions", mask: 0b10, reversed: true}],
                    },
                    {
                        name: "partitionIndicator",
                        type: DataType.UINT16,
                        conditions: [{type: ParameterCondition.BITMASK_SET, param: "fragmentationOptions", mask: 0b10}],
                    },
                    {name: "partitionedFrame", type: DataType.OCTET_STR},
                ],
                required: true,
            },
            readHandshakeParam: {
                ID: 0x01,
                parameters: [
                    {name: "partitionedClusterId", type: DataType.CLUSTER_ID},
                    {name: "attributeIds", type: BuffaloZclDataType.LIST_UINT16},
                ],
                required: true,
                response: 0x01,
            },
            writeHandshakeParam: {
                ID: 0x02,
                parameters: [
                    {name: "partitionedClusterId", type: DataType.CLUSTER_ID},
                    // TODO: need special BuffaloZcl read/write
                    // {name: "attributeRecords", type: BuffaloZclDataType.LIST_WRITE_ATTR_RECORD},
                    //   {name: "id", type: DataType.UINT16},
                    //   {name: "dataType", type: DataType.DATA8},
                    //   {name: "data", type: BuffaloZclDataType.USE_DATA_TYPE},
                ],
                required: true,
            },
        },
        commandsResponse: {
            multipleAck: {
                ID: 0x0,
                parameters: [
                    /** [7: reserved, 1: nackId length] */
                    {name: "ackOptions", type: DataType.BITMAP8},
                    {
                        name: "firstFrameId",
                        type: DataType.UINT8,
                        conditions: [{type: ParameterCondition.BITMASK_SET, param: "fragmentationOptions", mask: 0b1, reversed: true}],
                    },
                    {
                        name: "firstFrameId",
                        type: DataType.UINT16,
                        conditions: [{type: ParameterCondition.BITMASK_SET, param: "fragmentationOptions", mask: 0b1}],
                    },
                    {
                        name: "nackId",
                        type: BuffaloZclDataType.LIST_UINT8,
                        conditions: [{type: ParameterCondition.BITMASK_SET, param: "fragmentationOptions", mask: 0b1, reversed: true}],
                    },
                    {
                        name: "nackId",
                        type: BuffaloZclDataType.LIST_UINT16,
                        conditions: [{type: ParameterCondition.BITMASK_SET, param: "fragmentationOptions", mask: 0b1}],
                    },
                ],
                required: true,
            },
            readHandshakeParamResponse: {
                ID: 0x01,
                parameters: [
                    {name: "partitionedClusterId", type: DataType.CLUSTER_ID},
                    // TODO: need special BuffaloZcl read/write
                    // {name: "attributeRecords", type: BuffaloZclDataType.LIST_READ_ATTR_RECORD},
                    //   {name: "id", type: DataType.UINT16},
                    //   {name: "status", type: DataType.UINT16},
                    //   {name: "dataType", type: DataType.DATA8, conditions: [{type: ParameterCondition.FIELD_EQUAL, field: "Status", value: Status.SUCCESS}]},
                    //   {name: "data", type: BuffaloZclDataType.USE_DATA_TYPE, conditions: [{type: ParameterCondition.FIELD_EQUAL, field: "Status", value: Status.SUCCESS}]},
                ],
                required: true,
            },
        },
    },
    genOta: {
        ID: 0x0019,
        attributes: {
            upgradeServerId: {ID: 0x0000, type: DataType.IEEE_ADDR, client: true, required: true, default: "0xffffffffffffffff"},
            fileOffset: {ID: 0x0001, type: DataType.UINT32, client: true, max: 0xffffffff, default: 0xffffffff},
            currentFileVersion: {ID: 0x0002, type: DataType.UINT32, client: true, max: 0xffffffff, default: 0xffffffff},
            currentZigbeeStackVersion: {ID: 0x0003, type: DataType.UINT16, client: true, max: 0xffff, default: 0xffff},
            downloadedFileVersion: {ID: 0x0004, type: DataType.UINT32, client: true, max: 0xffffffff, default: 0xffffffff},
            downloadedZigbeeStackVersion: {ID: 0x0005, type: DataType.UINT16, client: true, max: 0xffff, default: 0xffff},
            imageUpgradeStatus: {ID: 0x0006, type: DataType.ENUM8, client: true, required: true, max: 0xff, default: 0x00},
            manufacturerId: {ID: 0x0007, type: DataType.UINT16, client: true, max: 0xffff},
            imageTypeId: {ID: 0x0008, type: DataType.UINT16, client: true, max: 0xffff},
            minimumBlockReqDelay: {ID: 0x0009, type: DataType.UINT16, client: true, max: 0xfffe, default: 0},
            imageStamp: {ID: 0x000a, type: DataType.UINT32, client: true, max: 0xffffffff},
            upgradeActivationPolicy: {ID: 0x000b, type: DataType.ENUM8, client: true, default: 0},
            upgradeTimeoutPolicy: {ID: 0x000c, type: DataType.ENUM8, client: true, default: 0},
        },
        commands: {
            queryNextImageRequest: {
                ID: 0x01,
                response: 0x02,
                parameters: [
                    {name: "fieldControl", type: DataType.BITMAP8},
                    {name: "manufacturerCode", type: DataType.UINT16},
                    {name: "imageType", type: DataType.UINT16, max: 0xffbf},
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
                response: 0x05,
                parameters: [
                    {name: "fieldControl", type: DataType.BITMAP8},
                    {name: "manufacturerCode", type: DataType.UINT16},
                    {name: "imageType", type: DataType.UINT16, max: 0xffbf},
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
                response: 0x05,
                parameters: [
                    {name: "fieldControl", type: DataType.BITMAP8},
                    {name: "manufacturerCode", type: DataType.UINT16},
                    {name: "imageType", type: DataType.UINT16, max: 0xffbf},
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
                response: 0x07,
                parameters: [
                    {name: "status", type: DataType.ENUM8},
                    {name: "manufacturerCode", type: DataType.UINT16},
                    {name: "imageType", type: DataType.UINT16, max: 0xffbf},
                    {name: "fileVersion", type: DataType.UINT32},
                ],
                required: true,
            },
            queryDeviceSpecificFileRequest: {
                ID: 0x08,
                response: 0x09,
                parameters: [
                    {name: "eui64", type: DataType.IEEE_ADDR},
                    {name: "manufacturerCode", type: DataType.UINT16},
                    {name: "imageType", type: DataType.UINT16, min: 0xffc0, max: 0xfffe},
                    {name: "fileVersion", type: DataType.UINT32},
                    {name: "zigbeeStackVersion", type: DataType.UINT16},
                ],
            },
        },
        commandsResponse: {
            imageNotify: {
                ID: 0x00,
                parameters: [
                    {name: "payloadType", type: DataType.ENUM8},
                    {name: "queryJitter", type: DataType.UINT8},
                    {
                        name: "manufacturerCode",
                        type: DataType.UINT16,
                        conditions: [{type: ParameterCondition.FIELD_GT, field: "payloadType", value: 0x00}],
                    },
                    {
                        name: "imageType",
                        type: DataType.UINT16,
                        conditions: [{type: ParameterCondition.FIELD_GT, field: "payloadType", value: 0x01}],
                        max: 0xffff,
                    },
                    {
                        name: "fileVersion",
                        type: DataType.UINT32,
                        conditions: [{type: ParameterCondition.FIELD_GT, field: "payloadType", value: 0x02}],
                        max: 0xffffffff,
                    },
                ],
            },
            queryNextImageResponse: {
                ID: 0x02,
                parameters: [
                    {name: "status", type: DataType.ENUM8},
                    {
                        name: "manufacturerCode",
                        type: DataType.UINT16,
                        conditions: [{type: ParameterCondition.FIELD_EQUAL, field: "status", value: Status.SUCCESS}],
                    },
                    {
                        name: "imageType",
                        type: DataType.UINT16,
                        conditions: [{type: ParameterCondition.FIELD_EQUAL, field: "status", value: Status.SUCCESS}],
                        max: 0xffbf,
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
                    {name: "status", type: DataType.ENUM8},
                    {
                        name: "manufacturerCode",
                        type: DataType.UINT16,
                        conditions: [{type: ParameterCondition.FIELD_EQUAL, field: "status", value: Status.SUCCESS}],
                    },
                    {
                        name: "imageType",
                        type: DataType.UINT16,
                        conditions: [{type: ParameterCondition.FIELD_EQUAL, field: "status", value: Status.SUCCESS}],
                        max: 0xffbf,
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
                    {name: "manufacturerCode", type: DataType.UINT16, max: 0xfffff},
                    {name: "imageType", type: DataType.UINT16, max: 0xfffff},
                    {name: "fileVersion", type: DataType.UINT32, max: 0xfffffffff},
                    {name: "currentTime", type: DataType.UTC},
                    {name: "upgradeTime", type: DataType.UTC},
                ],
                required: true,
            },
            queryDeviceSpecificFileResponse: {
                ID: 0x09,
                parameters: [
                    {name: "status", type: DataType.ENUM8},
                    {
                        name: "manufacturerCode",
                        type: DataType.UINT16,
                        conditions: [{type: ParameterCondition.FIELD_EQUAL, field: "status", value: Status.SUCCESS}],
                    },
                    {
                        name: "imageType",
                        type: DataType.UINT16,
                        conditions: [{type: ParameterCondition.FIELD_EQUAL, field: "status", value: Status.SUCCESS}],
                        min: 0xffc0,
                        max: 0xfffe,
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
    powerProfile: {
        ID: 0x001a,
        attributes: {
            totalProfileNum: {ID: 0x0000, type: DataType.UINT8, required: true, min: 1, max: 0xfe, default: 1},
            multipleScheduling: {ID: 0x0001, type: DataType.BOOLEAN, required: true, default: 0},
            energyFormatting: {ID: 0x0002, type: DataType.BITMAP8, required: true, default: 1},
            energyRemote: {ID: 0x0003, type: DataType.BOOLEAN, required: true, default: 0},
            scheduleMode: {ID: 0x0004, type: DataType.BITMAP8, required: true, write: true, report: true, default: 0x00},
        },
        commands: {
            powerProfileRequest: {ID: 0x00, parameters: [{name: "powerProfileId", type: DataType.UINT8}], required: true},
            powerProfileStateRequest: {ID: 0x01, parameters: [], required: true},
            getPowerProfilePriceResponse: {
                ID: 0x02,
                parameters: [
                    {name: "powerProfileId", type: DataType.UINT8},
                    {name: "currency", type: DataType.UINT16},
                    {name: "price", type: DataType.UINT32},
                    {name: "priceTrailingDigit", type: DataType.UINT8},
                ],
                required: true,
            },
            getOverallSchedulePriceResponse: {
                ID: 0x03,
                parameters: [
                    {name: "currency", type: DataType.UINT16},
                    {name: "price", type: DataType.UINT32},
                    {name: "priceTrailingDigit", type: DataType.UINT8},
                ],
                required: true,
            },
            energyPhasesScheduleNotification: {
                ID: 0x04,
                parameters: [
                    {name: "powerProfileId", type: DataType.UINT8},
                    {name: "numScheduledPhases", type: DataType.UINT8},
                    // TODO: special Buffalo write/read
                    // {name: "scheduledPhases", type: BuffaloZclDataType.LIST_SCHEDULED_PHASES},
                    //  {name: "energyPhaseId", type: DataType.UINT8},
                    //  {name: "scheduledTime", type: DataType.UINT16},
                ],
                required: true,
            },
            energyPhasesScheduleResponse: {
                ID: 0x05,
                parameters: [
                    {name: "powerProfileId", type: DataType.UINT8},
                    {name: "numScheduledPhases", type: DataType.UINT8},
                    // TODO: special Buffalo write/read
                    // {name: "scheduledPhases", type: BuffaloZclDataType.LIST_SCHEDULED_PHASES},
                    //  {name: "energyPhaseId", type: DataType.UINT8},
                    //  {name: "scheduledTime", type: DataType.UINT16},
                ],
                required: true,
            },
            powerProfileScheduleConstraintsRequest: {ID: 0x06, parameters: [{name: "powerProfileId", type: DataType.UINT8}], required: true},
            energyPhasesScheduleStateRequest: {ID: 0x07, parameters: [{name: "powerProfileId", type: DataType.UINT8}], required: true},
            getPowerProfilePriceExtendedResponse: {
                ID: 0x08,
                parameters: [
                    {name: "powerProfileId", type: DataType.UINT8},
                    {name: "currency", type: DataType.UINT16},
                    {name: "price", type: DataType.UINT32},
                    {name: "priceTrailingDigit", type: DataType.UINT8},
                ],
                required: true,
            },
        },
        commandsResponse: {
            powerProfileNotification: {
                ID: 0x00,
                parameters: [
                    {name: "totalProfileNum", type: DataType.UINT8},
                    {name: "powerProfileId", type: DataType.UINT8},
                    {name: "numTransferredPhases", type: DataType.UINT8},
                    // TODO: special Buffalo write/read
                    // {name: "transferredPhases", type: DataType.LIST_TRANSFERRED_PHASES},
                    //  {name: "energyPhaseId", type: DataType.UINT8},
                    //  {name: "macroPhaseId", type: DataType.UINT8},
                    //  {name: "expectedDuration", type: DataType.UINT16},
                    //  {name: "peakPower", type: DataType.UINT16},
                    //  {name: "energy", type: DataType.UINT16},
                    //  {name: "maxActivationDelay", type: DataType.UINT16},
                ],
                required: true,
            },
            powerProfileResponse: {
                ID: 0x01,
                parameters: [
                    {name: "totalProfileNum", type: DataType.UINT8},
                    {name: "powerProfileId", type: DataType.UINT8},
                    {name: "numTransferredPhases", type: DataType.UINT8},
                    // TODO: special Buffalo write/read
                    // {name: "transferredPhases", type: DataType.LIST_TRANSFERRED_PHASES},
                    //  {name: "energyPhaseId", type: DataType.UINT8},
                    //  {name: "macroPhaseId", type: DataType.UINT8},
                    //  {name: "expectedDuration", type: DataType.UINT16},
                    //  {name: "peakPower", type: DataType.UINT16},
                    //  {name: "energy", type: DataType.UINT16},
                    //  {name: "maxActivationDelay", type: DataType.UINT16},
                ],
                required: true,
            },
            powerProfileStateResponse: {
                ID: 0x02,
                parameters: [
                    {name: "powerProfileCount", type: DataType.UINT8},
                    // TODO: special Buffalo write/read
                    // {name: "powerProfiles", type: BuffaloZclDataType.LIST_POWER_PROFILE},
                    //  {name: "powerProfileId", type: DataType.UINT8},
                    //  {name: "energyPhaseId", type: DataType.UINT8},
                    //  {name: "powerProfileRemoteControl", type: DataType.BOOLEAN},
                    //  {name: "powerProfileState", type: DataType.ENUM8},
                ],
                required: true,
            },
            getPowerProfilePrice: {ID: 0x03, parameters: [{name: "powerProfileId", type: DataType.UINT8}]},
            powerProfilesStateNotification: {
                ID: 0x04,
                parameters: [
                    {name: "powerProfileCount", type: DataType.UINT8},
                    // TODO: special Buffalo write/read
                    // {name: "powerProfiles", type: BuffaloZclDataType.LIST_POWER_PROFILE},
                    //  {name: "powerProfileId", type: DataType.UINT8},
                    //  {name: "energyPhaseId", type: DataType.UINT8},
                    //  {name: "powerProfileRemoteControl", type: DataType.BOOLEAN},
                    //  {name: "powerProfileState", type: DataType.ENUM8},
                ],
                required: true,
            },
            getOverallSchedulePrice: {ID: 0x05, parameters: []},
            energyPhasesScheduleRequest: {ID: 0x06, parameters: [{name: "powerProfileId", type: DataType.UINT8}], required: true},
            energyPhasesScheduleStateResponse: {
                ID: 0x07,
                parameters: [
                    {name: "powerProfileId", type: DataType.UINT8},
                    {name: "numScheduledPhases", type: DataType.UINT8},
                    // TODO: special Buffalo write/read
                    // {name: "scheduledPhases", type: BuffaloZclDataType.LIST_SCHEDULED_PHASES},
                    //  {name: "energyPhaseId", type: DataType.UINT8},
                    //  {name: "scheduledTime", type: DataType.UINT16},
                ],
                required: true,
            },
            energyPhasesScheduleStateNotification: {
                ID: 0x08,
                parameters: [
                    {name: "powerProfileId", type: DataType.UINT8},
                    {name: "numScheduledPhases", type: DataType.UINT8},
                    // TODO: special Buffalo write/read
                    // {name: "scheduledPhases", type: BuffaloZclDataType.LIST_SCHEDULED_PHASES},
                    //  {name: "energyPhaseId", type: DataType.UINT8},
                    //  {name: "scheduledTime", type: DataType.UINT16},
                ],
                required: true,
            },
            powerProfileScheduleConstraintsNotification: {
                ID: 0x09,
                parameters: [
                    {name: "powerProfileId", type: DataType.UINT8},
                    {name: "startAfter", type: DataType.UINT16},
                    {name: "stopBefore", type: DataType.UINT16},
                ],
                required: true,
            },
            powerProfileScheduleConstraintsResponse: {
                ID: 0x0a,
                parameters: [
                    {name: "powerProfileId", type: DataType.UINT8},
                    {name: "startAfter", type: DataType.UINT16},
                    {name: "stopBefore", type: DataType.UINT16},
                ],
                required: true,
            },
            getPowerProfilePriceExtended: {
                ID: 0x0b,
                parameters: [
                    {name: "options", type: DataType.BITMAP8},
                    {name: "powerProfileId", type: DataType.UINT8},
                    {
                        name: "powerProfileStartTime",
                        type: DataType.UINT16,
                        conditions: [{type: ParameterCondition.MINIMUM_REMAINING_BUFFER_BYTES, value: 2}],
                    },
                ],
            },
        },
    },
    haApplianceControl: {
        ID: 0x001b,
        attributes: {
            startTime: {ID: 0x0000, type: DataType.UINT16, required: true, report: true, max: 0xffff, default: 0},
            finishTime: {ID: 0x0001, type: DataType.UINT16, required: true, report: true, max: 0xffff, default: 0},
            remainingTime: {ID: 0x0002, type: DataType.UINT16, report: true, max: 0xffff, default: 0},
        },
        commands: {
            executionOfCommand: {ID: 0x00, parameters: [{name: "commandId", type: DataType.ENUM8}]},
            signalState: {ID: 0x01, parameters: [], response: 0x00, required: true},
            writeFunctions: {
                ID: 0x02,
                parameters: [
                    // TODO: need BuffaloZcl read/write
                    // {name: "functions", type: BuffaloZclDataType.LIST_FUNCTIONS},
                    //   {name: "id", type: DataType.UINT16},
                    //   {name: "dataType", type: DataType.DATA8},
                    //   {name: "data", type: BuffaloZclDataType.USE_DATA_TYPE},
                ],
            },
            overloadPauseResume: {ID: 0x03, parameters: []},
            overloadPause: {ID: 0x04, parameters: []},
            overloadWarning: {ID: 0x05, parameters: [{name: "warningEvent", type: DataType.ENUM8}]},
        },
        commandsResponse: {
            signalStateRsp: {
                ID: 0x00,
                parameters: [
                    {name: "applianceStatus", type: DataType.ENUM8},
                    /** [4: device status 2, 4: remote enable flags] */
                    {name: "remoteEnableFlagsAndDeviceStatus2", type: DataType.BITMAP8},
                    {
                        name: "applianceStatus2",
                        type: DataType.UINT24,
                        conditions: [{type: ParameterCondition.MINIMUM_REMAINING_BUFFER_BYTES, value: 3}],
                    },
                ],
                required: true,
            },
            signalStateNotification: {
                ID: 0x00,
                parameters: [
                    {name: "applianceStatus", type: DataType.ENUM8},
                    /** [4: device status 2, 4: remote enable flags] */
                    {name: "remoteEnableFlagsAndDeviceStatus2", type: DataType.BITMAP8},
                    {
                        name: "applianceStatus2",
                        type: DataType.UINT24,
                        conditions: [{type: ParameterCondition.MINIMUM_REMAINING_BUFFER_BYTES, value: 3}],
                    },
                ],
                required: true,
            },
        },
    },
    pulseWidthModulation: {
        ID: 0x001c,
        attributes: {
            currentLevel: {ID: 0x0000, type: DataType.UINT8, report: true, scene: true, required: true, default: 255},
            remainingTime: {ID: 0x0001, type: DataType.UINT16, max: 0xffff, default: 0},
            minLevel: {ID: 0x0002, type: DataType.UINT8, default: 0, required: true},
            maxLevel: {ID: 0x0003, type: DataType.UINT8, max: 100, default: 100, required: true},
            currentFrequency: {ID: 0x0004, type: DataType.UINT16, report: true, default: 0, required: true},
            minFrequency: {ID: 0x0005, type: DataType.UINT16, default: 0, required: true},
            maxFrequency: {ID: 0x0006, type: DataType.UINT16, max: 0xffff, default: 0, required: true},
            options: {ID: 0x000f, type: DataType.BITMAP8, write: true, default: 0},
            onOffTransitionTime: {ID: 0x0010, type: DataType.UINT16, write: true, max: 0xffff, default: 0},
            onLevel: {ID: 0x0011, type: DataType.UINT8, write: true, default: 0xff},
            onTransitionTime: {ID: 0x0012, type: DataType.UINT16, write: true, max: 0xfffe, default: 0xffff},
            offTransitionTime: {ID: 0x0013, type: DataType.UINT16, write: true, max: 0xfffe, default: 0xffff},
            defaultMoveRate: {ID: 0x0014, type: DataType.UINT8, write: true, max: 0xfe},
            startUpCurrentLevel: {
                ID: 0x4000,
                type: DataType.UINT8,
                write: true,
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
                    // XXX: behind bytes condition due to likely missing fields with many devices
                    {name: "optionsMask", type: DataType.BITMAP8, conditions: [{type: ParameterCondition.MINIMUM_REMAINING_BUFFER_BYTES, value: 1}]},
                    {
                        name: "optionsOverride",
                        type: DataType.BITMAP8,
                        conditions: [{type: ParameterCondition.MINIMUM_REMAINING_BUFFER_BYTES, value: 1}],
                    },
                ],
                required: true,
            },
            move: {
                ID: 0x01,
                parameters: [
                    {name: "movemode", type: DataType.UINT8},
                    {name: "rate", type: DataType.UINT8},
                    // XXX: behind bytes condition due to likely missing fields with many devices
                    {name: "optionsMask", type: DataType.BITMAP8, conditions: [{type: ParameterCondition.MINIMUM_REMAINING_BUFFER_BYTES, value: 1}]},
                    {
                        name: "optionsOverride",
                        type: DataType.BITMAP8,
                        conditions: [{type: ParameterCondition.MINIMUM_REMAINING_BUFFER_BYTES, value: 1}],
                    },
                ],
                required: true,
            },
            step: {
                ID: 0x02,
                parameters: [
                    {name: "stepmode", type: DataType.UINT8},
                    {name: "stepsize", type: DataType.UINT8},
                    {name: "transtime", type: DataType.UINT16},
                    // XXX: behind bytes condition due to likely missing fields with many devices
                    {name: "optionsMask", type: DataType.BITMAP8, conditions: [{type: ParameterCondition.MINIMUM_REMAINING_BUFFER_BYTES, value: 1}]},
                    {
                        name: "optionsOverride",
                        type: DataType.BITMAP8,
                        conditions: [{type: ParameterCondition.MINIMUM_REMAINING_BUFFER_BYTES, value: 1}],
                    },
                ],
                required: true,
            },
            stop: {
                ID: 0x03,
                parameters: [
                    // XXX: behind bytes condition due to likely missing fields with many devices
                    {name: "optionsMask", type: DataType.BITMAP8, conditions: [{type: ParameterCondition.MINIMUM_REMAINING_BUFFER_BYTES, value: 1}]},
                    {
                        name: "optionsOverride",
                        type: DataType.BITMAP8,
                        conditions: [{type: ParameterCondition.MINIMUM_REMAINING_BUFFER_BYTES, value: 1}],
                    },
                ],
                required: true,
            },
            moveToLevelWithOnOff: {
                ID: 0x04,
                parameters: [
                    {name: "level", type: DataType.UINT8},
                    {name: "transtime", type: DataType.UINT16},
                    // XXX: behind bytes condition due to likely missing fields with many devices
                    {name: "optionsMask", type: DataType.BITMAP8, conditions: [{type: ParameterCondition.MINIMUM_REMAINING_BUFFER_BYTES, value: 1}]},
                    {
                        name: "optionsOverride",
                        type: DataType.BITMAP8,
                        conditions: [{type: ParameterCondition.MINIMUM_REMAINING_BUFFER_BYTES, value: 1}],
                    },
                ],
                required: true,
            },
            moveWithOnOff: {
                ID: 0x05,
                parameters: [
                    {name: "movemode", type: DataType.UINT8},
                    {name: "rate", type: DataType.UINT8},
                    // XXX: behind bytes condition due to likely missing fields with many devices
                    {name: "optionsMask", type: DataType.BITMAP8, conditions: [{type: ParameterCondition.MINIMUM_REMAINING_BUFFER_BYTES, value: 1}]},
                    {
                        name: "optionsOverride",
                        type: DataType.BITMAP8,
                        conditions: [{type: ParameterCondition.MINIMUM_REMAINING_BUFFER_BYTES, value: 1}],
                    },
                ],
                required: true,
            },
            stepWithOnOff: {
                ID: 0x06,
                parameters: [
                    {name: "stepmode", type: DataType.UINT8},
                    {name: "stepsize", type: DataType.UINT8},
                    {name: "transtime", type: DataType.UINT16},
                    // XXX: behind bytes condition due to likely missing fields with many devices
                    {name: "optionsMask", type: DataType.BITMAP8, conditions: [{type: ParameterCondition.MINIMUM_REMAINING_BUFFER_BYTES, value: 1}]},
                    {
                        name: "optionsOverride",
                        type: DataType.BITMAP8,
                        conditions: [{type: ParameterCondition.MINIMUM_REMAINING_BUFFER_BYTES, value: 1}],
                    },
                ],
                required: true,
            },
            stopWithOnOff: {
                ID: 0x07,
                parameters: [
                    // XXX: behind bytes condition due to likely missing fields with many devices
                    {name: "optionsMask", type: DataType.BITMAP8, conditions: [{type: ParameterCondition.MINIMUM_REMAINING_BUFFER_BYTES, value: 1}]},
                    {
                        name: "optionsOverride",
                        type: DataType.BITMAP8,
                        conditions: [{type: ParameterCondition.MINIMUM_REMAINING_BUFFER_BYTES, value: 1}],
                    },
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
            checkinInterval: {ID: 0x0000, type: DataType.UINT32, write: true, required: true, max: 7208960, default: 14400},
            longPollInterval: {ID: 0x0001, type: DataType.UINT32, required: true, min: 4, max: 7208960, default: 20},
            shortPollInterval: {ID: 0x0002, type: DataType.UINT16, required: true, min: 1, max: 0xffff, default: 2},
            fastPollTimeout: {ID: 0x0003, type: DataType.UINT16, write: true, required: true, min: 1, max: 0xffff, default: 40},
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
            checkin: {ID: 0x00, parameters: [], required: true},
        },
    },
    greenPower: {
        ID: 0x0021,
        attributes: {
            gpsMaxSinkTableEntries: {ID: 0x0000, type: DataType.UINT8, required: true, max: 0xff},
            sinkTable: {ID: 0x0001, type: DataType.LONG_OCTET_STR, required: true},
            /** 0b00: full unicast forward, 0b01: groupcast forward to DGroupID, 0b10: groupcast forward to pre-comm GroupID, 0b11: unicast forward */
            gpsCommunicationMode: {ID: 0x0002, type: DataType.BITMAP8, required: true, write: true, default: 0x01},
            /** [5: reserved, 1: on GP proxy commiss mode, 1: on first pairing success, 1: on commiss window expiration] */
            gpsCommissioningExitMode: {ID: 0x0003, type: DataType.BITMAP8, required: true, write: true, default: 0x02},
            gpsCommissioningWindow: {ID: 0x0004, type: DataType.UINT16, write: true, max: 65535, default: 180},
            /** [4: reserved, 1: involve TC, 1: protection with gpLinkKey, 1: minimal GPD security level] */
            gpsSecurityLevel: {ID: 0x0005, type: DataType.BITMAP8, required: true, write: true, default: 0x06},
            /** see A.3.3.2.7 of 14-0563-19 */
            gpsFunctionality: {ID: 0x0006, type: DataType.BITMAP24, required: true},
            /** see A.3.3.2.8 of 14-0563-19 */
            gpsActiveFunctionality: {ID: 0x0007, type: DataType.BITMAP24, required: true, default: 0xffffff},

            gpsMaxProxyTableEntries: {ID: 0x0010, type: DataType.UINT8, required: true, max: 0xff, default: 0x14, client: true},
            proxyTable: {ID: 0x0011, type: DataType.LONG_OCTET_STR, required: true, default: 0, client: true},
            gppNotificationRetryNumber: {ID: 0x0012, type: DataType.UINT8, write: true, max: 5, default: 2, client: true},
            gppNotificationRetryTimer: {ID: 0x0013, type: DataType.UINT8, write: true, max: 255, default: 100, client: true},
            gppMaxSearchCounter: {ID: 0x0014, type: DataType.UINT8, write: true, max: 255, default: 10, client: true},
            gppBlockGpdId: {ID: 0x0015, type: DataType.LONG_OCTET_STR, client: true},
            gppFunctionality: {ID: 0x0016, type: DataType.BITMAP24, required: true, client: true},
            gppActiveFunctionality: {ID: 0x0017, type: DataType.BITMAP24, required: true, client: true},

            /** 0b000: no key, 0b001: nwk key, 0b010: GP group key, 0b011: nwk key derived GP group key, 0b111: derived individual GPD key */
            gpSharedSecurityKeyType: {ID: 0x0020, type: DataType.BITMAP8, write: true, max: 0x07, default: 0},
            gpSharedSecurityKey: {ID: 0x0021, type: DataType.SEC_KEY, write: true},
            gpLinkKey: {ID: 0x0022, type: DataType.SEC_KEY, write: true /* default: "ZigBeeAlliance09" */},
        },
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
            pairingSearch: {
                ID: 0x01,
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
                ],
            },
            tunnelingStop: {
                ID: 0x03,
                parameters: [
                    {name: "options", type: DataType.BITMAP8},
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
                    {name: "gpdSecurityFrameCounter", type: DataType.UINT32},
                    {name: "gppShortAddress", type: DataType.UINT16},
                    {name: "gppGpdLink", type: DataType.BITMAP8},
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
            sinkCommissioningMode: {
                ID: 0x04,
                parameters: [
                    {name: "options", type: DataType.BITMAP8},
                    {name: "gpmAddressForSecurity", type: DataType.UINT16, max: 0xffff /* default: 0xffff */},
                    {name: "gpmAddressForPairing", type: DataType.UINT16, max: 0xffff /* default: 0xffff */},
                    {name: "sinkEndpoint", type: DataType.UINT8},
                ],
            },
            translationTableUpdate: {
                ID: 0x07,
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
                    // TODO: need BuffaloZcl read/write (length from options bits 5..7)
                    // {name: "translations", type: BuffaloZclDataType.LIST_WRITE_GP_TRANSLATION_ENTRY},
                    //   {name: "index", type: DataType.UINT8},
                    //   {name: "commandId", type: DataType.UINT8},
                    //   {name: "endpoint", type: DataType.UINT8},
                    //   {name: "profile", type: DataType.UINT16},
                    //   {name: "cluster", type: DataType.UINT16},
                    //   {name: "zigbeeCommandId", type: DataType.UINT8},
                    //   {name: "zigbeeCommandPayloadLength", type: DataType.UINT8},
                    //   {name: "zigbeeCommandPayload", type: BuffaloZclDataType.LIST_UINT8},
                    //   {name: "additionalInfoBlockCount", type: DataType.UINT8},
                    //   {name: "additionalInfoBlock", type: BuffaloZclDataType.LIST_UINT8},
                ],
            },
            translationTableReq: {ID: 0x08, parameters: [{name: "startIndex", type: DataType.UINT8}], response: 0x08},
            // TODO: logic too complex for current frame parsing method
            // pairingConfiguration: {ID: 0x09},
            sinkTableReq: {
                ID: 0x0a,
                parameters: [
                    {name: "options", type: DataType.BITMAP8},
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
                    {name: "index", type: DataType.UINT8},
                ],
                response: 0x0a,
            },
            proxyTableRsp: {
                ID: 0x0b,
                parameters: [
                    {name: "status", type: DataType.ENUM8},
                    {name: "totalNumberNonEmptyEntries", type: DataType.UINT8},
                    {name: "startIndex", type: DataType.UINT8},
                    {name: "entriesCount", type: DataType.UINT8},
                    // TODO: need BuffaloZcl read/write
                    // {name: "entries", type: BuffaloZclDataType.LIST_OCTET_STR},
                ],
            },
        },
        commandsResponse: {
            notificationResponse: {
                ID: 0x00,
                parameters: [
                    {name: "options", type: DataType.BITMAP8},
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
                    {name: "gpdSecurityFrameCounter", type: DataType.UINT32},
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
            /** A.K.A. proxyCommisioningMode */
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
            response: {
                ID: 0x06,
                parameters: [
                    {name: "options", type: DataType.UINT8},
                    /** A.K.A. selectedSenderShortAddress */
                    {name: "tempMaster", type: DataType.UINT16},
                    /** A.K.A. selectedSenderTxChannel */
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
            translationTableRsp: {
                ID: 0x08,
                parameters: [
                    {name: "status", type: DataType.ENUM8},
                    {name: "options", type: DataType.BITMAP8},
                    {name: "totalNumberEntries", type: DataType.UINT8},
                    {name: "startIndex", type: DataType.UINT8},
                    {name: "entriesCount", type: DataType.UINT8},
                    // TODO: need BuffaloZcl read/write
                    // {name: "translations", type: BuffaloZclDataType.LIST_READ_GP_TRANSLATION_ENTRY},
                    //   {
                    //       name: "srcID",
                    //       type: DataType.UINT32,
                    //       conditions: [{type: ParameterCondition.BITFIELD_ENUM, param: "options", offset: 0, size: 3, value: 0b000}],
                    //   },
                    //   {
                    //       name: "gpdIEEEAddr",
                    //       type: DataType.IEEE_ADDR,
                    //       conditions: [{type: ParameterCondition.BITFIELD_ENUM, param: "options", offset: 0, size: 3, value: 0b010}],
                    //   },
                    //   {
                    //       name: "gpdEndpoint",
                    //       type: DataType.UINT8,
                    //       conditions: [{type: ParameterCondition.BITFIELD_ENUM, param: "options", offset: 0, size: 3, value: 0b010}],
                    //   },
                    //   {name: "commandId", type: DataType.UINT8},
                    //   {name: "endpoint", type: DataType.UINT8},
                    //   {name: "profile", type: DataType.UINT16},
                    //   {name: "cluster", type: DataType.UINT16},
                    //   {name: "zigbeeCommandId", type: DataType.UINT8},
                    //   {name: "zigbeeCommandPayloadLength", type: DataType.UINT8},
                    //   {name: "zigbeeCommandPayload", type: BuffaloZclDataType.LIST_UINT8},
                    //   {name: "additionalInfoBlockCount", type: DataType.UINT8},
                    //   {name: "additionalInfoBlock", type: BuffaloZclDataType.LIST_UINT8},
                ],
            },
            sinkTableRsp: {
                ID: 0x0a,
                parameters: [
                    {name: "status", type: DataType.ENUM8},
                    {name: "totalNumberNonEmptyEntries", type: DataType.UINT8},
                    {name: "startIndex", type: DataType.UINT8},
                    {name: "entriesCount", type: DataType.UINT8},
                    // TODO: need BuffaloZcl read/write
                    // {name: "entries", type: BuffaloZclDataType.LIST_OCTET_STR},
                ],
            },
            proxyTableReq: {
                ID: 0x0b,
                parameters: [
                    {name: "options", type: DataType.BITMAP8},
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
                    {name: "index", type: DataType.UINT8},
                ],
            },
        },
    },
    mobileDeviceCfg: {
        ID: 0x0022,
        attributes: {
            keepAliveTime: {ID: 0x0000, type: DataType.UINT16, required: true, write: true, min: 1, max: 65535, default: 15},
            rejoinTimeout: {
                ID: 0x0001,
                type: DataType.UINT16,
                required: true,
                write: true,
                max: 0xffff,
                default: 0xffff,
                special: [["Never", "ffff"]],
            },
        },
        commands: {},
        commandsResponse: {
            keepAliveNotification: {
                ID: 0x00,
                parameters: [
                    {name: "keepAliveTime", type: DataType.UINT16},
                    {name: "rejoinTimeout", type: DataType.UINT16},
                ],
                required: true,
            },
        },
    },
    neighborCleaning: {
        ID: 0x0023,
        attributes: {
            neighborCleaningTimeout: {ID: 0x0000, type: DataType.UINT16, required: true, write: true, min: 1, max: 65535, default: 30},
        },
        commands: {
            purgeEntries: {ID: 0x00, parameters: [], required: true},
        },
        commandsResponse: {},
    },
    nearestGateway: {
        ID: 0x0024,
        attributes: {
            nearestGateway: {ID: 0x0000, type: DataType.UINT16, required: true, write: true, max: 0xfff8, default: 0},
            newMobileNode: {ID: 0x0001, type: DataType.UINT16, required: true, read: false, write: true, max: 0xfff8, default: 0},
        },
        commands: {},
        commandsResponse: {},
    },
    keepAlive: {
        ID: 0x0025,
        attributes: {
            tcKeepAliveBase: {ID: 0x0000, type: DataType.UINT8, required: true, max: 0xff, default: 0x0a},
            tcKeepAliveJitter: {ID: 0x0001, type: DataType.UINT16, required: true, max: 0xffff, default: 0x012c},
        },
        commands: {},
        commandsResponse: {},
    },
    closuresShadeCfg: {
        ID: 0x0100,
        attributes: {
            physicalClosedLimit: {ID: 0x0000, type: DataType.UINT16, min: 1, max: 0xfffe},
            motorStepSize: {ID: 0x0001, type: DataType.UINT8, max: 0xfe},
            status: {ID: 0x0002, type: DataType.BITMAP8, write: true, required: true, default: 0},

            closedLimit: {ID: 0x0010, type: DataType.UINT16, write: true, required: true, min: 1, max: 0xfffe, default: 1},
            mode: {ID: 0x0011, type: DataType.ENUM8, write: true, required: true, max: 0xfe, default: 0},
        },
        commands: {},
        commandsResponse: {},
    },
    closuresDoorLock: {
        ID: 0x0101,
        attributes: {
            lockState: {ID: 0x0000, type: DataType.ENUM8, report: true, required: true},
            lockType: {ID: 0x0001, type: DataType.ENUM8, required: true},
            actuatorEnabled: {ID: 0x0002, type: DataType.BOOLEAN, required: true},
            doorState: {ID: 0x0003, type: DataType.ENUM8, report: true},
            doorOpenEvents: {ID: 0x0004, type: DataType.UINT32, write: true},
            doorClosedEvents: {ID: 0x0005, type: DataType.UINT32, write: true},
            openPeriod: {ID: 0x0006, type: DataType.UINT16, write: true},

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

            enableLogging: {ID: 0x0020, type: DataType.BOOLEAN, write: true, writeOptional: true, report: true, default: 0},
            language: {ID: 0x0021, type: DataType.CHAR_STR, write: true, writeOptional: true, report: true, default: "", length: 2},
            ledSettings: {ID: 0x0022, type: DataType.UINT8, write: true, writeOptional: true, report: true, default: 0},
            autoRelockTime: {
                ID: 0x0023,
                type: DataType.UINT32,
                write: true,
                writeOptional: true,
                report: true,
                default: 0,
                special: [["Disabled", "0"]],
            },
            soundVolume: {ID: 0x0024, type: DataType.UINT8, write: true, writeOptional: true, report: true, default: 0},
            operatingMode: {ID: 0x0025, type: DataType.ENUM8, write: true, writeOptional: true, report: true, default: 0},
            supportedOperatingModes: {ID: 0x0026, type: DataType.BITMAP16, default: 1},
            defaultConfigurationRegister: {ID: 0x0027, type: DataType.BITMAP16, report: true, default: 0},
            enableLocalProgramming: {ID: 0x0028, type: DataType.BOOLEAN, write: true, writeOptional: true, report: true, default: 1},
            enableOneTouchLocking: {ID: 0x0029, type: DataType.BOOLEAN, write: true, report: true, default: 0},
            enableInsideStatusLed: {ID: 0x002a, type: DataType.BOOLEAN, write: true, report: true, default: 0},
            enablePrivacyModeButton: {ID: 0x002b, type: DataType.BOOLEAN, write: true, report: true, default: 0},

            wrongCodeEntryLimit: {ID: 0x0030, type: DataType.UINT8, write: true, writeOptional: true, report: true, default: 0},
            userCodeTemporaryDisableTime: {ID: 0x0031, type: DataType.UINT8, write: true, writeOptional: true, report: true, default: 0},
            sendPinOta: {ID: 0x0032, type: DataType.BOOLEAN, write: true, writeOptional: true, report: true, default: 0},
            requirePinForRfOperation: {ID: 0x0033, type: DataType.BOOLEAN, write: true, writeOptional: true, report: true, default: 0},
            zigbeeSecurityLevel: {ID: 0x0034, type: DataType.ENUM8, report: true, default: 0},

            alarmMask: {ID: 0x0040, type: DataType.BITMAP16, write: true, report: true, default: 0},
            keypadOperationEventMask: {ID: 0x0041, type: DataType.BITMAP16, write: true, report: true, default: 0},
            rfOperationEventMask: {ID: 0x0042, type: DataType.BITMAP16, write: true, report: true, default: 0},
            manualOperationEventMask: {ID: 0x0043, type: DataType.BITMAP16, write: true, report: true, default: 0},
            rfidOperationEventMask: {ID: 0x0044, type: DataType.BITMAP16, write: true, report: true, default: 0},
            keypadProgrammingEventMask: {ID: 0x0045, type: DataType.BITMAP16, write: true, report: true, default: 0},
            rfProgrammingEventMask: {ID: 0x0046, type: DataType.BITMAP16, write: true, report: true, default: 0},
            rfidProgrammingEventMask: {ID: 0x0047, type: DataType.BITMAP16, write: true, report: true, default: 0},
        },
        commands: {
            lockDoor: {ID: 0x00, response: 0, parameters: [{name: "pincodevalue", type: DataType.OCTET_STR}], required: true},
            unlockDoor: {ID: 0x01, response: 1, parameters: [{name: "pincodevalue", type: DataType.OCTET_STR}], required: true},
            toggleDoor: {ID: 0x02, response: 2, parameters: [{name: "pincodevalue", type: DataType.OCTET_STR}]},
            unlockWithTimeout: {
                ID: 0x03,
                response: 3,
                parameters: [
                    {name: "timeout", type: DataType.UINT16},
                    {name: "pincodevalue", type: DataType.OCTET_STR},
                ],
            },
            getLogRecord: {ID: 0x04, response: 4, parameters: [{name: "logindex", type: DataType.UINT16, special: [["MostRecent", "0"]]}]},
            setPinCode: {
                ID: 0x05,
                response: 5,
                parameters: [
                    {name: "userid", type: DataType.UINT16},
                    {name: "userstatus", type: DataType.UINT8},
                    {name: "usertype", type: DataType.ENUM8},
                    {name: "pincodevalue", type: DataType.OCTET_STR},
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
                    {name: "daysmask", type: DataType.BITMAP8},
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
                    {name: "zigbeelocalendtime", type: DataType.UINT32},
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
                    {name: "zigbeelocalendtime", type: DataType.UINT32},
                    {name: "opermodelduringholiday", type: DataType.ENUM8},
                ],
            },
            getHolidaySchedule: {ID: 0x12, response: 18, parameters: [{name: "holidayscheduleid", type: DataType.UINT8}]},
            clearHolidaySchedule: {ID: 0x13, response: 19, parameters: [{name: "holidayscheduleid", type: DataType.UINT8}]},
            setUserType: {
                ID: 0x14,
                response: 20,
                parameters: [
                    {name: "userid", type: DataType.UINT16},
                    {name: "usertype", type: DataType.ENUM8},
                ],
            },
            getUserType: {ID: 0x15, response: 21, parameters: [{name: "userid", type: DataType.UINT16}]},
            setRfidCode: {
                ID: 0x16,
                response: 22,
                parameters: [
                    {name: "userid", type: DataType.UINT16},
                    {name: "userstatus", type: DataType.UINT8},
                    {name: "usertype", type: DataType.ENUM8},
                    {name: "pincodevalue", type: DataType.OCTET_STR},
                ],
            },
            getRfidCode: {ID: 0x17, response: 23, parameters: [{name: "userid", type: DataType.UINT16}]},
            clearRfidCode: {ID: 0x18, response: 24, parameters: [{name: "userid", type: DataType.UINT16}]},
            clearAllRfidCodes: {ID: 0x19, response: 25, parameters: []},
        },
        commandsResponse: {
            lockDoorRsp: {ID: 0x00, parameters: [{name: "status", type: DataType.ENUM8}], required: true},
            unlockDoorRsp: {ID: 0x01, parameters: [{name: "status", type: DataType.ENUM8}], required: true},
            toggleDoorRsp: {ID: 0x02, parameters: [{name: "status", type: DataType.ENUM8}]},
            unlockWithTimeoutRsp: {ID: 0x03, parameters: [{name: "status", type: DataType.ENUM8}]},
            getLogRecordRsp: {
                ID: 0x04,
                parameters: [
                    {name: "logentryid", type: DataType.UINT16},
                    {name: "timestamp", type: DataType.UINT32},
                    {name: "eventtype", type: DataType.ENUM8},
                    {name: "source", type: DataType.UINT8},
                    {name: "eventidalarmcode", type: DataType.UINT8},
                    {name: "userid", type: DataType.UINT16},
                    {name: "pincodevalue", type: DataType.OCTET_STR},
                ],
            },
            setPinCodeRsp: {ID: 0x05, parameters: [{name: "status", type: DataType.UINT8}]},
            getPinCodeRsp: {
                ID: 0x06,
                parameters: [
                    {name: "userid", type: DataType.UINT16},
                    {name: "userstatus", type: DataType.UINT8},
                    {name: "usertype", type: DataType.ENUM8},
                    {name: "pincodevalue", type: DataType.OCTET_STR},
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
                    {name: "daysmask", type: DataType.BITMAP8},
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
                    {name: "status", type: DataType.ENUM8},
                    {name: "zigbeelocalstarttime", type: DataType.UINT32},
                    {name: "zigbeelocalendtime", type: DataType.UINT32},
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
                    {name: "zigbeelocalendtime", type: DataType.UINT32},
                    {name: "opermodelduringholiday", type: DataType.ENUM8},
                ],
            },
            clearHolidayScheduleRsp: {ID: 0x13, parameters: [{name: "status", type: DataType.UINT8}]},
            setUserTypeRsp: {ID: 0x14, parameters: [{name: "status", type: DataType.UINT8}]},
            getUserTypeRsp: {
                ID: 0x15,
                parameters: [
                    {name: "userid", type: DataType.UINT16},
                    {name: "usertype", type: DataType.ENUM8},
                ],
            },
            setRfidCodeRsp: {ID: 0x16, parameters: [{name: "status", type: DataType.UINT8}]},
            getRfidCodeRsp: {
                ID: 0x17,
                parameters: [
                    {name: "userid", type: DataType.UINT16},
                    {name: "userstatus", type: DataType.UINT8},
                    {name: "usertype", type: DataType.ENUM8},
                    {name: "pincodevalue", type: DataType.OCTET_STR},
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
                    {name: "data", type: DataType.CHAR_STR},
                ],
            },
            programmingEventNotification: {
                ID: 0x21,
                parameters: [
                    {name: "programeventsrc", type: DataType.UINT8},
                    {name: "programeventcode", type: DataType.UINT8},
                    {name: "userid", type: DataType.UINT16},
                    {name: "pin", type: DataType.OCTET_STR},
                    {name: "usertype", type: DataType.ENUM8},
                    {name: "userstatus", type: DataType.UINT8},
                    {name: "zigbeelocaltime", type: DataType.UINT32},
                    {name: "data", type: DataType.CHAR_STR},
                ],
            },
        },
    },
    closuresWindowCovering: {
        ID: 0x0102,
        attributes: {
            windowCoveringType: {ID: 0x0000, type: DataType.ENUM8, required: true, default: 0},
            physicalClosedLimitLiftCm: {ID: 0x0001, type: DataType.UINT16, max: 0xffff, default: 0},
            physicalClosedLimitTiltDdegree: {ID: 0x0002, type: DataType.UINT16, max: 0xffff, default: 0},
            currentPositionLiftCm: {ID: 0x0003, type: DataType.UINT16, max: 0xffff, default: 0},
            currentPositionTiltDdegree: {ID: 0x0004, type: DataType.UINT16, max: 0xffff, default: 0},
            numOfActuationsLift: {ID: 0x0005, type: DataType.UINT16, max: 0xffff, default: 0},
            numOfActuationsTilt: {ID: 0x0006, type: DataType.UINT16, max: 0xffff, default: 0},
            configStatus: {ID: 0x0007, type: DataType.BITMAP8, required: true, default: 3},
            // `required: true` only if Closed Loop control and Lift actions are supported
            currentPositionLiftPercentage: {ID: 0x0008, type: DataType.UINT8, report: true, scene: true, max: 100, default: 0},
            // `required: true` only if Closed Loop control and Tilt actions are supported
            currentPositionTiltPercentage: {ID: 0x0009, type: DataType.UINT8, report: true, scene: true, max: 100, default: 0},

            // `required: true` only if Closed Loop control and Lift actions are supported
            installedOpenLimitLiftCm: {ID: 0x0010, type: DataType.UINT16, max: 0xffff, default: 0},
            // `required: true` only if Closed Loop control and Lift actions are supported
            installedClosedLimitLiftCm: {ID: 0x0011, type: DataType.UINT16, max: 0xffff, default: 0xffff},
            // `required: true` only if Closed Loop control and Tilt actions are supported
            installedOpenLimitTiltDdegree: {ID: 0x0012, type: DataType.UINT16, max: 0xffff, default: 0},
            // `required: true` only if Closed Loop control and Tilt actions are supported
            installedClosedLimitTiltDdegree: {ID: 0x0013, type: DataType.UINT16, max: 0xffff, default: 0xffff},
            velocityLift: {ID: 0x0014, type: DataType.UINT16, write: true, max: 0xffff, default: 0},
            accelerationTimeLift: {ID: 0x0015, type: DataType.UINT16, write: true, max: 0xffff, default: 0},
            decelerationTimeLift: {ID: 0x0016, type: DataType.UINT16, write: true, max: 0xffff, default: 0},
            windowCoveringMode: {ID: 0x0017, type: DataType.BITMAP8, write: true, required: true, default: 4},
            intermediateSetpointsLift: {ID: 0x0018, type: DataType.OCTET_STR, write: true, default: "1,0x0000"},
            intermediateSetpointsTilt: {ID: 0x0019, type: DataType.OCTET_STR, write: true, default: "1,0x0000"},
            // custom
            // XXX: doesn't exist?
            operationalStatus: {ID: 0x000a, type: DataType.BITMAP8},
            elkoDriveCloseDuration: {ID: 0xe000, type: DataType.UINT16, manufacturerCode: ManufacturerCode.ADEO, write: true, max: 0xffff},
            elkoProtectionStatus: {ID: 0xe010, type: DataType.BITMAP8, manufacturerCode: ManufacturerCode.ADEO, write: true},
            elkoSunProtectionIlluminanceThreshold: {
                ID: 0xe012,
                type: DataType.UINT16,
                manufacturerCode: ManufacturerCode.ADEO,
                write: true,
                max: 0xffff,
            },
            elkoProtectionSensor: {ID: 0xe013, type: DataType.BITMAP8, manufacturerCode: ManufacturerCode.ADEO, write: true},
            elkoLiftDriveUpTime: {ID: 0xe014, type: DataType.UINT16, manufacturerCode: ManufacturerCode.ADEO, write: true, max: 0xffff},
            elkoLiftDriveDownTime: {ID: 0xe015, type: DataType.UINT16, manufacturerCode: ManufacturerCode.ADEO, write: true, max: 0xffff},
            elkoTiltOpenCloseAndStepTime: {ID: 0xe016, type: DataType.UINT16, manufacturerCode: ManufacturerCode.ADEO, write: true, max: 0xffff},
            elkoTiltPositionPercentageAfterMoveToLevel: {
                ID: 0xe017,
                type: DataType.UINT8,
                manufacturerCode: ManufacturerCode.ADEO,
                write: true,
                max: 0xff,
            },
            tuyaMovingState: {ID: 0xf000, type: DataType.ENUM8, write: true, max: 0xff},
            tuyaCalibration: {ID: 0xf001, type: DataType.ENUM8, write: true, max: 0xff},
            stepPositionLift: {ID: 0xf001, type: DataType.ENUM8, manufacturerCode: ManufacturerCode.LEGRAND_GROUP, write: true, max: 0xff},
            tuyaMotorReversal: {ID: 0xf002, type: DataType.ENUM8, write: true, max: 0xff},
            calibrationMode: {ID: 0xf002, type: DataType.ENUM8, manufacturerCode: ManufacturerCode.LEGRAND_GROUP, write: true, max: 0xff},
            moesCalibrationTime: {ID: 0xf003, type: DataType.UINT16, write: true, max: 0xffff},
            targetPositionTiltPercentage: {
                ID: 0xf003,
                type: DataType.ENUM8,
                manufacturerCode: ManufacturerCode.LEGRAND_GROUP,
                write: true,
                max: 0xff,
            },
            stepPositionTilt: {ID: 0xf004, type: DataType.ENUM8, manufacturerCode: ManufacturerCode.LEGRAND_GROUP, write: true, max: 0xff},
            nikoCalibrationTimeUp: {ID: 0xfcc1, type: DataType.UINT16, manufacturerCode: ManufacturerCode.NIKO_NV, write: true, max: 0xffff},
            nikoCalibrationTimeDown: {ID: 0xfcc2, type: DataType.UINT16, manufacturerCode: ManufacturerCode.NIKO_NV, write: true, max: 0xffff},
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
                    },
                ],
            },
            goToTiltPercentage: {ID: 0x08, parameters: [{name: "percentagetiltvalue", type: DataType.UINT8, max: 100}]},
            // custom
            elkoStopOrStepLiftPercentage: {
                ID: 0x80,
                parameters: [
                    {name: "direction", type: DataType.UINT16, max: 0xffff},
                    {name: "stepvalue", type: DataType.UINT16, max: 0xffff},
                ],
            },
        },
        commandsResponse: {},
    },
    barrierControl: {
        ID: 0x0103,
        attributes: {
            movingState: {ID: 0x0001, type: DataType.ENUM8, report: true, required: true},
            safetyStatus: {ID: 0x0002, type: DataType.BITMAP16, report: true, required: true},
            capabilities: {ID: 0x0003, type: DataType.BITMAP8, required: true},
            openEvents: {ID: 0x0004, type: DataType.UINT16, write: true, max: 0xfffe, default: 0},
            closeEvents: {ID: 0x0005, type: DataType.UINT16, write: true, max: 0xfffe, default: 0},
            commandOpenEvents: {ID: 0x0006, type: DataType.UINT16, write: true, max: 0xfffe, default: 0},
            commandCloseEvents: {ID: 0x0007, type: DataType.UINT16, write: true, max: 0xfffe, default: 0},
            openPeriod: {ID: 0x0008, type: DataType.UINT16, write: true, max: 0xfffe},
            closePeriod: {ID: 0x0009, type: DataType.UINT16, write: true, max: 0xfffe},
            barrierPosition: {
                ID: 0x000a,
                type: DataType.UINT8,
                report: true,
                scene: true,
                required: true,
                max: 100,
                special: [["PositionUnknown", "ff"]],
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

            pumpStatus: {ID: 0x0010, type: DataType.BITMAP16, report: true},
            effectiveOperationMode: {ID: 0x0011, type: DataType.ENUM8, required: true, max: 0xfe},
            effectiveControlMode: {ID: 0x0012, type: DataType.ENUM8, required: true, max: 0xfe},
            capacity: {ID: 0x0013, type: DataType.INT16, report: true, required: true, min: 0, max: 0x7fff},
            speed: {ID: 0x0014, type: DataType.UINT16, max: 0xfffe},
            lifetimeRunningHours: {ID: 0x0015, type: DataType.UINT24, write: true, max: 0xfffffe, default: 0},
            power: {ID: 0x0016, type: DataType.UINT24, write: true, max: 0xfffffe},
            lifetimeEnergyConsumed: {ID: 0x0017, type: DataType.UINT32, max: 0xfffffffe, default: 0},

            operationMode: {ID: 0x0020, type: DataType.ENUM8, write: true, required: true, max: 0xfe, default: 0},
            controlMode: {ID: 0x0021, type: DataType.ENUM8, write: true, max: 0xfe, default: 0},
            alarmMask: {ID: 0x0022, type: DataType.BITMAP16},
        },
        commands: {},
        commandsResponse: {},
    },
    hvacThermostat: {
        ID: 0x0201,
        attributes: {
            localTemp: {ID: 0x0000, type: DataType.INT16, report: true, required: true, min: -27315, max: 32767},
            outdoorTemp: {ID: 0x0001, type: DataType.INT16, min: -27315, max: 32767},
            occupancy: {ID: 0x0002, type: DataType.BITMAP8, default: 1},
            absMinHeatSetpointLimit: {ID: 0x0003, type: DataType.INT16, min: -27315, max: 32767, default: 700},
            absMaxHeatSetpointLimit: {ID: 0x0004, type: DataType.INT16, min: -27315, max: 32767, default: 3000},
            absMinCoolSetpointLimit: {ID: 0x0005, type: DataType.INT16, min: -27315, max: 32767, default: 1600},
            absMaxCoolSetpointLimit: {ID: 0x0006, type: DataType.INT16, min: -27315, max: 32767, default: 3200},
            pICoolingDemand: {ID: 0x0007, type: DataType.UINT8, report: true, max: 100},
            pIHeatingDemand: {ID: 0x0008, type: DataType.UINT8, report: true, max: 100},
            systemTypeConfig: {ID: 0x0009, type: DataType.BITMAP8, write: true, writeOptional: true, default: 0},

            localTemperatureCalibration: {ID: 0x0010, type: DataType.INT8, write: true, min: -25, max: 25, default: 0},
            occupiedCoolingSetpoint: {ID: 0x0011, type: DataType.INT16, write: true, scene: true, default: 2600},
            occupiedHeatingSetpoint: {ID: 0x0012, type: DataType.INT16, write: true, scene: true, default: 2000},
            unoccupiedCoolingSetpoint: {ID: 0x0013, type: DataType.INT16, write: true, default: 2600},
            unoccupiedHeatingSetpoint: {ID: 0x0014, type: DataType.INT16, write: true, default: 2000},
            minHeatSetpointLimit: {ID: 0x0015, type: DataType.INT16, write: true, min: -27315, max: 32767, default: 700},
            maxHeatSetpointLimit: {ID: 0x0016, type: DataType.INT16, write: true, min: -27315, max: 32767, default: 3000},
            minCoolSetpointLimit: {ID: 0x0017, type: DataType.INT16, write: true, min: -27315, max: 32767, default: 1600},
            maxCoolSetpointLimit: {ID: 0x0018, type: DataType.INT16, write: true, min: -27315, max: 32767, default: 3200},
            minSetpointDeadBand: {ID: 0x0019, type: DataType.INT8, write: true, writeOptional: true, min: 10, max: 25, default: 25},
            remoteSensing: {ID: 0x001a, type: DataType.BITMAP8, write: true, default: 0},
            ctrlSeqeOfOper: {ID: 0x001b, type: DataType.ENUM8, write: true, required: true, default: 4},
            systemMode: {ID: 0x001c, type: DataType.ENUM8, write: true, required: true, default: 1},
            alarmMask: {ID: 0x001d, type: DataType.BITMAP8, default: 0},
            runningMode: {ID: 0x001e, type: DataType.ENUM8, default: 0},

            startOfWeek: {ID: 0x0020, type: DataType.ENUM8},
            numberOfWeeklyTrans: {ID: 0x0021, type: DataType.UINT8, max: 0xff, default: 0},
            numberOfDailyTrans: {ID: 0x0022, type: DataType.UINT8, max: 0xff, default: 0},
            tempSetpointHold: {ID: 0x0023, type: DataType.ENUM8, write: true, default: 0},
            tempSetpointHoldDuration: {ID: 0x0024, type: DataType.UINT16, write: true, min: 0, max: 1440},
            programingOperMode: {ID: 0x0025, type: DataType.BITMAP8, write: true, report: true, default: 0},
            runningState: {ID: 0x0029, type: DataType.BITMAP16},

            setpointChangeSource: {ID: 0x0030, type: DataType.ENUM8, default: 0},
            setpointChangeAmount: {ID: 0x0031, type: DataType.INT16, min: 0, max: 0xffff},
            setpointChangeSourceTimeStamp: {ID: 0x0032, type: DataType.UTC, max: 0xfffffffe, default: 0},
            occupiedSetback: {ID: 0x0034, type: DataType.UINT8, write: true},
            occupiedSetbackMin: {ID: 0x0035, type: DataType.UINT8, min: 0},
            occupiedSetbackMax: {ID: 0x0036, type: DataType.UINT8},
            unoccupiedSetback: {ID: 0x0037, type: DataType.UINT8, write: true},
            unoccupiedSetbackMin: {ID: 0x0038, type: DataType.UINT8, min: 0},
            unoccupiedSetbackMax: {ID: 0x0039, type: DataType.UINT8},
            emergencyHeatDelta: {ID: 0x003a, type: DataType.UINT8, write: true},

            acType: {ID: 0x0040, type: DataType.ENUM8, write: true, default: 0},
            acCapacity: {ID: 0x0041, type: DataType.UINT16, write: true, max: 0xffff, default: 0},
            acRefrigerantType: {ID: 0x0042, type: DataType.ENUM8, write: true, default: 0},
            acConpressorType: {ID: 0x0043, type: DataType.ENUM8, write: true, default: 0},
            acErrorCode: {ID: 0x0044, type: DataType.BITMAP32, write: true, max: 0xffffffff, default: 0},
            acLouverPosition: {ID: 0x0045, type: DataType.ENUM8, write: true, default: 0},
            acCollTemp: {ID: 0x0046, type: DataType.INT16, min: -27315, max: 32767},
            acCapacityFormat: {ID: 0x0047, type: DataType.ENUM8, write: true, default: 0},
            // custom
            fourNoksHysteresisHigh: {
                ID: 0x0101,
                type: DataType.UINT16,
                manufacturerCode: ManufacturerCode.ASTREL_GROUP_SRL,
                write: true,
                max: 0xffff,
            },
            fourNoksHysteresisLow: {ID: 0x0102, type: DataType.UINT16, manufacturerCode: ManufacturerCode.ASTREL_GROUP_SRL, write: true, max: 0xffff},
            SinopeOccupancy: {ID: 0x0400, type: DataType.ENUM8, manufacturerCode: ManufacturerCode.SINOPE_TECHNOLOGIES, write: true, max: 0xff},
            SinopeMainCycleOutput: {
                ID: 0x0401,
                type: DataType.UINT16,
                manufacturerCode: ManufacturerCode.SINOPE_TECHNOLOGIES,
                write: true,
                max: 0xffff,
            },
            elkoDisplayText: {ID: 0x0402, type: DataType.CHAR_STR, write: true},
            SinopeBacklight: {ID: 0x0402, type: DataType.ENUM8, manufacturerCode: ManufacturerCode.SINOPE_TECHNOLOGIES, write: true, max: 0xff},
            SinopeAuxCycleOutput: {
                ID: 0x0404,
                type: DataType.UINT16,
                manufacturerCode: ManufacturerCode.SINOPE_TECHNOLOGIES,
                write: true,
                max: 0xffff,
            },
            viessmannWindowOpenInternal: {
                ID: 0x4000,
                type: DataType.ENUM8,
                manufacturerCode: ManufacturerCode.VIESSMANN_ELEKTRONIK_GMBH,
                write: true,
                max: 0xff,
            },
            danfossWindowOpenInternal: {ID: 0x4000, type: DataType.ENUM8, manufacturerCode: ManufacturerCode.DANFOSS_A_S, write: true, max: 0xff},
            StelproOutdoorTemp: {ID: 0x4001, type: DataType.INT16, write: true, min: -32768, max: 32767},
            viessmannWindowOpenForce: {ID: 0x4003, type: DataType.BOOLEAN, manufacturerCode: ManufacturerCode.VIESSMANN_ELEKTRONIK_GMBH, write: true},
            danfossWindowOpenExternal: {ID: 0x4003, type: DataType.BOOLEAN, manufacturerCode: ManufacturerCode.DANFOSS_A_S, write: true},
            danfossDayOfWeek: {ID: 0x4010, type: DataType.ENUM8, manufacturerCode: ManufacturerCode.DANFOSS_A_S, write: true, max: 0xff},
            danfossTriggerTime: {ID: 0x4011, type: DataType.UINT16, manufacturerCode: ManufacturerCode.DANFOSS_A_S, write: true, max: 0xffff},
            viessmannAssemblyMode: {ID: 0x4012, type: DataType.BOOLEAN, manufacturerCode: ManufacturerCode.VIESSMANN_ELEKTRONIK_GMBH, write: true},
            danfossMountedModeActive: {ID: 0x4012, type: DataType.BOOLEAN, manufacturerCode: ManufacturerCode.DANFOSS_A_S, write: true},
            danfossMountedModeControl: {ID: 0x4013, type: DataType.BOOLEAN, manufacturerCode: ManufacturerCode.DANFOSS_A_S, write: true},
            danfossThermostatOrientation: {ID: 0x4014, type: DataType.BOOLEAN, manufacturerCode: ManufacturerCode.DANFOSS_A_S, write: true},
            danfossExternalMeasuredRoomSensor: {
                ID: 0x4015,
                type: DataType.INT16,
                manufacturerCode: ManufacturerCode.DANFOSS_A_S,
                write: true,
                min: -32768,
                max: 32767,
            },
            danfossRadiatorCovered: {ID: 0x4016, type: DataType.BOOLEAN, manufacturerCode: ManufacturerCode.DANFOSS_A_S, write: true},
            StelproSystemMode: {ID: 0x401c, type: DataType.ENUM8, write: true, max: 0xff},
            danfossAlgorithmScaleFactor: {ID: 0x4020, type: DataType.UINT8, manufacturerCode: ManufacturerCode.DANFOSS_A_S, write: true, max: 0xff},
            danfossHeatAvailable: {ID: 0x4030, type: DataType.BOOLEAN, manufacturerCode: ManufacturerCode.DANFOSS_A_S, write: true},
            danfossHeatRequired: {ID: 0x4031, type: DataType.BOOLEAN, manufacturerCode: ManufacturerCode.DANFOSS_A_S, write: true},
            danfossLoadBalancingEnable: {ID: 0x4032, type: DataType.BOOLEAN, manufacturerCode: ManufacturerCode.DANFOSS_A_S, write: true},
            danfossLoadRoomMean: {
                ID: 0x4040,
                type: DataType.INT16,
                manufacturerCode: ManufacturerCode.DANFOSS_A_S,
                write: true,
                min: -32768,
                max: 32767,
            },
            danfossLoadEstimate: {
                ID: 0x404a,
                type: DataType.INT16,
                manufacturerCode: ManufacturerCode.DANFOSS_A_S,
                write: true,
                min: -32768,
                max: 32767,
            },
            danfossRegulationSetpointOffset: {
                ID: 0x404b,
                type: DataType.INT8,
                manufacturerCode: ManufacturerCode.DANFOSS_A_S,
                write: true,
                min: -128,
                max: 127,
            },
            danfossAdaptionRunControl: {ID: 0x404c, type: DataType.ENUM8, manufacturerCode: ManufacturerCode.DANFOSS_A_S, write: true, max: 0xff},
            danfossAdaptionRunStatus: {ID: 0x404d, type: DataType.BITMAP8, manufacturerCode: ManufacturerCode.DANFOSS_A_S, write: true},
            danfossAdaptionRunSettings: {ID: 0x404e, type: DataType.BITMAP8, manufacturerCode: ManufacturerCode.DANFOSS_A_S, write: true},
            danfossPreheatStatus: {ID: 0x404f, type: DataType.BOOLEAN, manufacturerCode: ManufacturerCode.DANFOSS_A_S, write: true},
            danfossPreheatTime: {ID: 0x4050, type: DataType.UINT32, manufacturerCode: ManufacturerCode.DANFOSS_A_S, write: true},
            danfossWindowOpenFeatureEnable: {ID: 0x4051, type: DataType.BOOLEAN, manufacturerCode: ManufacturerCode.DANFOSS_A_S, write: true},
            danfossRoomStatusCode: {ID: 0x4100, type: DataType.BITMAP16, manufacturerCode: ManufacturerCode.DANFOSS_A_S, write: true},
            danfossOutputStatus: {ID: 0x4110, type: DataType.ENUM8, manufacturerCode: ManufacturerCode.DANFOSS_A_S, write: true, max: 0xff},
            danfossRoomFloorSensorMode: {ID: 0x4120, type: DataType.ENUM8, manufacturerCode: ManufacturerCode.DANFOSS_A_S, write: true, max: 0xff},
            danfossFloorMinSetpoint: {
                ID: 0x4121,
                type: DataType.INT16,
                manufacturerCode: ManufacturerCode.DANFOSS_A_S,
                write: true,
                min: -32768,
                max: 32767,
            },
            danfossFloorMaxSetpoint: {
                ID: 0x4122,
                type: DataType.INT16,
                manufacturerCode: ManufacturerCode.DANFOSS_A_S,
                write: true,
                min: -32768,
                max: 32767,
            },
            danfossScheduleTypeUsed: {ID: 0x4130, type: DataType.ENUM8, manufacturerCode: ManufacturerCode.DANFOSS_A_S, write: true, max: 0xff},
            danfossIcon2PreHeat: {ID: 0x4131, type: DataType.ENUM8, manufacturerCode: ManufacturerCode.DANFOSS_A_S, write: true, max: 0xff},
            danfossIcon2PreHeatStatus: {ID: 0x414f, type: DataType.ENUM8, manufacturerCode: ManufacturerCode.DANFOSS_A_S, write: true, max: 0xff},
            schneiderWiserSpecific: {ID: 0xe110, type: DataType.ENUM8, manufacturerCode: ManufacturerCode.SCHNEIDER_ELECTRIC, write: true, max: 0xff},
        },
        commands: {
            setpointRaiseLower: {
                ID: 0x00,
                parameters: [
                    {name: "mode", type: DataType.ENUM8},
                    {name: "amount", type: DataType.INT8},
                ],
                required: true,
            },
            setWeeklySchedule: {
                ID: 0x01,
                parameters: [
                    {name: "numoftrans", type: DataType.UINT8, min: 0, max: 10},
                    {name: "dayofweek", type: DataType.BITMAP8},
                    {name: "mode", type: DataType.BITMAP8},
                    {name: "transitions", type: BuffaloZclDataType.LIST_THERMO_TRANSITIONS},
                ],
            },
            getWeeklySchedule: {
                ID: 0x02,
                response: 0,
                parameters: [
                    {name: "daystoreturn", type: DataType.BITMAP8},
                    {name: "modetoreturn", type: DataType.BITMAP8},
                ],
            },
            clearWeeklySchedule: {ID: 0x03, parameters: []},
            getRelayStatusLog: {ID: 0x04, response: 1, parameters: []},
            // custom
            danfossSetpointCommand: {
                ID: 0x40,
                parameters: [
                    {name: "setpointType", type: DataType.ENUM8, max: 0xff},
                    {name: "setpoint", type: DataType.INT16, min: -32768, max: 32767},
                ],
            },
            schneiderWiserThermostatBoost: {
                ID: 0x80,
                parameters: [
                    {name: "command", type: DataType.ENUM8, max: 0xff},
                    {name: "enable", type: DataType.ENUM8, max: 0xff},
                    {name: "temperature", type: DataType.UINT16, max: 0xffff},
                    {name: "duration", type: DataType.UINT16, max: 0xffff},
                ],
            },
            plugwiseCalibrateValve: {ID: 0xa0, parameters: []},
            wiserSmartSetSetpoint: {
                ID: 0xe0,
                parameters: [
                    {name: "operatingmode", type: DataType.UINT8, max: 0xff},
                    {name: "zonemode", type: DataType.UINT8, max: 0xff},
                    {name: "setpoint", type: DataType.INT16, min: -32768, max: 32767},
                    {name: "reserved", type: DataType.UINT8, max: 0xff},
                ],
            },
            wiserSmartSetFipMode: {
                ID: 0xe1,
                parameters: [
                    {name: "zonemode", type: DataType.UINT8, max: 0xff},
                    {name: "fipmode", type: DataType.ENUM8, max: 0xff},
                    {name: "reserved", type: DataType.UINT8, max: 0xff},
                ],
            },
            wiserSmartCalibrateValve: {ID: 0xe2, parameters: []},
        },
        commandsResponse: {
            getWeeklyScheduleRsp: {
                ID: 0x00,
                parameters: [
                    {name: "numoftrans", type: DataType.UINT8, min: 0, max: 10},
                    {name: "dayofweek", type: DataType.BITMAP8},
                    {name: "mode", type: DataType.BITMAP8},
                    {name: "transitions", type: BuffaloZclDataType.LIST_THERMO_TRANSITIONS},
                ],
            },
            getRelayStatusLogRsp: {
                ID: 0x01,
                parameters: [
                    {name: "timeofday", type: DataType.UINT16},
                    {name: "relaystatus", type: DataType.BITMAP8},
                    {name: "localtemp", type: DataType.INT16},
                    {name: "humidity", type: DataType.UINT8},
                    {name: "setpoint", type: DataType.INT16},
                    {name: "unreadentries", type: DataType.UINT16},
                ],
            },
        },
    },
    hvacFanCtrl: {
        ID: 0x0202,
        attributes: {
            fanMode: {ID: 0x0000, type: DataType.ENUM8, write: true, required: true, max: 0x06, default: 5},
            fanModeSequence: {ID: 0x0001, type: DataType.ENUM8, write: true, required: true, max: 0x04, default: 2},
        },
        commands: {},
        commandsResponse: {},
    },
    hvacDehumidificationCtrl: {
        ID: 0x0203,
        attributes: {
            relativeHumidity: {ID: 0x0000, type: DataType.UINT8, max: 100},
            dehumidCooling: {ID: 0x0001, type: DataType.UINT8, report: true, required: true},

            rhDehumidSetpoint: {ID: 0x0010, type: DataType.UINT8, write: true, required: true, min: 30, max: 100, default: 50},
            relativeHumidityMode: {ID: 0x0011, type: DataType.ENUM8, write: true, default: 0},
            dehumidLockout: {ID: 0x0012, type: DataType.ENUM8, write: true, default: 1},
            dehumidHysteresis: {ID: 0x0013, type: DataType.UINT8, write: true, required: true, min: 2, max: 20, default: 2},
            dehumidMaxCool: {ID: 0x0014, type: DataType.UINT8, write: true, required: true, min: 20, max: 100, default: 20},
            relativeHumidDisplay: {ID: 0x0015, type: DataType.ENUM8, write: true, max: 0x01, default: 0},
        },
        commands: {},
        commandsResponse: {},
    },
    hvacUserInterfaceCfg: {
        ID: 0x0204,
        attributes: {
            tempDisplayMode: {ID: 0x0000, type: DataType.ENUM8, write: true, required: true, max: 0x01, default: 0},
            keypadLockout: {ID: 0x0001, type: DataType.ENUM8, write: true, required: true, max: 0x05, default: 0},
            programmingVisibility: {ID: 0x0002, type: DataType.ENUM8, write: true, max: 0x01, default: 0},
            // custom
            danfossViewingDirection: {ID: 0x4000, type: DataType.ENUM8, manufacturerCode: ManufacturerCode.DANFOSS_A_S, write: true, max: 0xff},
        },
        commands: {},
        commandsResponse: {},
    },
    lightingColorCtrl: {
        ID: 0x0300,
        attributes: {
            // `required: true` only if bit 0 of colorCapabilities attribute is 1
            currentHue: {ID: 0x0000, type: DataType.UINT8, report: true, max: 0xfe, default: 0},
            // `required: true` only if bit 0 of colorCapabilities attribute is 1
            currentSaturation: {ID: 0x0001, type: DataType.UINT8, report: true, scene: true, max: 0xfe, default: 0},
            remainingTime: {ID: 0x0002, type: DataType.UINT16, max: 0xfffe, default: 0},
            // `required: true` only if bit 3 of colorCapabilities attribute is 1
            currentX: {ID: 0x0003, type: DataType.UINT16, report: true, scene: true, max: 0xfeff, default: 0x616b},
            // `required: true` only if bit 3 of colorCapabilities attribute is 1
            currentY: {ID: 0x0004, type: DataType.UINT16, report: true, scene: true, max: 0xfeff, default: 0x607d},
            driftCompensation: {ID: 0x0005, type: DataType.ENUM8, max: 0x04},
            compensationText: {ID: 0x0006, type: DataType.CHAR_STR, maxLen: 254},
            // `required: true` only if bit 4 of colorCapabilities attribute is 1
            colorTemperature: {
                ID: 0x0007,
                type: DataType.UINT16,
                report: true,
                scene: true,
                max: 0xfeff,
                default: 0x00fa,
                special: [["Undefined", "0000"]],
            },
            colorMode: {ID: 0x0008, type: DataType.ENUM8, required: true, max: 0x02, default: 1},
            options: {ID: 0x000f, type: DataType.BITMAP8, write: true, required: true, default: 0},

            numPrimaries: {ID: 0x0010, type: DataType.UINT8, required: true, max: 0x06},
            // all `primary1..` `required: true` only if numPrimaries > 0
            primary1X: {ID: 0x0011, type: DataType.UINT16, max: 0xfeff},
            primary1Y: {ID: 0x0012, type: DataType.UINT16, max: 0xfeff},
            primary1Intensity: {ID: 0x0013, type: DataType.UINT8, max: 0xff},
            // 0x0014: reserved
            // all `primary2..` `required: true` only if numPrimaries > 1
            primary2X: {ID: 0x0015, type: DataType.UINT16, max: 0xfeff},
            primary2Y: {ID: 0x0016, type: DataType.UINT16, max: 0xfeff},
            primary2Intensity: {ID: 0x0017, type: DataType.UINT8},
            // 0x0018: reserved
            // all `primary3..` `required: true` only if numPrimaries > 2
            primary3X: {ID: 0x0019, type: DataType.UINT16, max: 0xfeff},
            primary3Y: {ID: 0x001a, type: DataType.UINT16, max: 0xfeff},
            primary3Intensity: {ID: 0x001b, type: DataType.UINT8, max: 0xff},

            // all `primary4..` `required: true` only if numPrimaries > 3
            primary4X: {ID: 0x0020, type: DataType.UINT16, max: 0xfeff},
            primary4Y: {ID: 0x0021, type: DataType.UINT16, max: 0xfeff},
            primary4Intensity: {ID: 0x0022, type: DataType.UINT8, max: 0xff},
            // 0x0023: reserved
            // all `primary5..` `required: true` only if numPrimaries > 4
            primary5X: {ID: 0x0024, type: DataType.UINT16, max: 0xfeff},
            primary5Y: {ID: 0x0025, type: DataType.UINT16, max: 0xfeff},
            primary5Intensity: {ID: 0x0026, type: DataType.UINT8, max: 0xff},
            // 0x0027: reserved
            // all `primary6..` `required: true` only if numPrimaries > 5
            primary6X: {ID: 0x0028, type: DataType.UINT16, max: 0xfeff},
            primary6Y: {ID: 0x0029, type: DataType.UINT16, max: 0xfeff},
            primary6Intensity: {ID: 0x002a, type: DataType.UINT8, max: 0xff},

            whitePointX: {ID: 0x0030, type: DataType.UINT16, write: true, max: 0xfeff},
            whitePointY: {ID: 0x0031, type: DataType.UINT16, write: true, max: 0xfeff},
            colorPointRX: {ID: 0x0032, type: DataType.UINT16, write: true, max: 0xfeff},
            colorPointRY: {ID: 0x0033, type: DataType.UINT16, write: true, max: 0xfeff},
            colorPointRIntensity: {ID: 0x0034, type: DataType.UINT8, write: true, max: 0xff},
            // 0x0035: reserved
            colorPointGX: {ID: 0x0036, type: DataType.UINT16, write: true, max: 0xfeff},
            colorPointGY: {ID: 0x0037, type: DataType.UINT16, write: true, max: 0xfeff},
            colorPointGIntensity: {ID: 0x0038, type: DataType.UINT8, write: true, max: 0xff},
            // 0x0039: reserved
            colorPointBX: {ID: 0x003a, type: DataType.UINT16, write: true, max: 0xfeff},
            colorPointBY: {ID: 0x003b, type: DataType.UINT16, write: true, max: 0xfeff},
            colorPointBIntensity: {ID: 0x003c, type: DataType.UINT8, write: true, max: 0xff},

            // `required: true` only if bit 1 of colorCapabilities attribute is 1
            enhancedCurrentHue: {ID: 0x4000, type: DataType.UINT16, scene: true, max: 0xffff, default: 0},
            enhancedColorMode: {ID: 0x4001, type: DataType.ENUM8, required: true, max: 0xff, default: 1},
            // `required: true` only if bit 2 of colorCapabilities attribute is 1
            colorLoopActive: {ID: 0x4002, type: DataType.UINT8, scene: true, max: 0xff, default: 0},
            // `required: true` only if bit 2 of colorCapabilities attribute is 1
            colorLoopDirection: {ID: 0x4003, type: DataType.UINT8, scene: true, max: 0xff, default: 0},
            // `required: true` only if bit 2 of colorCapabilities attribute is 1
            colorLoopTime: {ID: 0x4004, type: DataType.UINT16, scene: true, max: 0xffff, default: 0x0019},
            // `required: true` only if bit 2 of colorCapabilities attribute is 1
            colorLoopStartEnhancedHue: {ID: 0x4005, type: DataType.UINT16, max: 0xffff, default: 0x2300},
            // `required: true` only if bit 2 of colorCapabilities attribute is 1
            colorLoopStoredEnhancedHue: {ID: 0x4006, type: DataType.UINT16, max: 0xffff, default: 0},
            colorCapabilities: {ID: 0x400a, type: DataType.BITMAP16, required: true, max: 0x001f, default: 0},
            // `required: true` only if bit 4 of colorCapabilities attribute is 1
            colorTempPhysicalMin: {ID: 0x400b, type: DataType.UINT16, max: 0xfeff, default: 0},
            // `required: true` only if bit 4 of colorCapabilities attribute is 1
            colorTempPhysicalMax: {ID: 0x400c, type: DataType.UINT16, max: 0xfeff, default: 0xfeff},
            // `required: true` only if bit 4 of colorCapabilities attribute is 1 AND colorTemperature supported
            coupleColorTempToLevelMin: {ID: 0x400d, type: DataType.UINT16},
            // `required: true` only if bit 4 of colorCapabilities attribute is 1 AND colorTemperature supported
            startUpColorTemperature: {
                ID: 0x4010,
                type: DataType.UINT16,
                write: true,
                max: 0xfeff,
                special: [["SetColorTempToPreviousValue", "ffff"]],
            },
            // custom
            tuyaRgbMode: {ID: 0xf000, type: DataType.UINT8, write: true, max: 0xff},
            tuyaBrightness: {ID: 0xf001, type: DataType.UINT8, write: true, max: 0xff},
        },
        commands: {
            moveToHue: {
                ID: 0x00,
                parameters: [
                    {name: "hue", type: DataType.UINT8},
                    {name: "direction", type: DataType.ENUM8},
                    {name: "transtime", type: DataType.UINT16},
                    // XXX: behind bytes condition due to likely missing fields with many devices
                    {name: "optionsMask", type: DataType.BITMAP8, conditions: [{type: ParameterCondition.MINIMUM_REMAINING_BUFFER_BYTES, value: 1}]},
                    {
                        name: "optionsOverride",
                        type: DataType.BITMAP8,
                        conditions: [{type: ParameterCondition.MINIMUM_REMAINING_BUFFER_BYTES, value: 1}],
                    },
                ],
                // required: true only if bit 0 of colorCapabilities attribute is 1
            },
            moveHue: {
                ID: 0x01,
                parameters: [
                    {name: "movemode", type: DataType.ENUM8},
                    {name: "rate", type: DataType.UINT8},
                    // XXX: behind bytes condition due to likely missing fields with many devices
                    {name: "optionsMask", type: DataType.BITMAP8, conditions: [{type: ParameterCondition.MINIMUM_REMAINING_BUFFER_BYTES, value: 1}]},
                    {
                        name: "optionsOverride",
                        type: DataType.BITMAP8,
                        conditions: [{type: ParameterCondition.MINIMUM_REMAINING_BUFFER_BYTES, value: 1}],
                    },
                ],
                // required: true only if bit 0 of colorCapabilities attribute is 1
            },
            stepHue: {
                ID: 0x02,
                parameters: [
                    {name: "stepmode", type: DataType.ENUM8},
                    {name: "stepsize", type: DataType.UINT8},
                    {name: "transtime", type: DataType.UINT8},
                    // XXX: behind bytes condition due to likely missing fields with many devices
                    {name: "optionsMask", type: DataType.BITMAP8, conditions: [{type: ParameterCondition.MINIMUM_REMAINING_BUFFER_BYTES, value: 1}]},
                    {
                        name: "optionsOverride",
                        type: DataType.BITMAP8,
                        conditions: [{type: ParameterCondition.MINIMUM_REMAINING_BUFFER_BYTES, value: 1}],
                    },
                ],
                // required: true only if bit 0 of colorCapabilities attribute is 1
            },
            moveToSaturation: {
                ID: 0x03,
                parameters: [
                    {name: "saturation", type: DataType.UINT8},
                    {name: "transtime", type: DataType.UINT16},
                    // XXX: behind bytes condition due to likely missing fields with many devices
                    {name: "optionsMask", type: DataType.BITMAP8, conditions: [{type: ParameterCondition.MINIMUM_REMAINING_BUFFER_BYTES, value: 1}]},
                    {
                        name: "optionsOverride",
                        type: DataType.BITMAP8,
                        conditions: [{type: ParameterCondition.MINIMUM_REMAINING_BUFFER_BYTES, value: 1}],
                    },
                ],
                // required: true only if bit 0 of colorCapabilities attribute is 1
            },
            moveSaturation: {
                ID: 0x04,
                parameters: [
                    {name: "movemode", type: DataType.ENUM8},
                    {name: "rate", type: DataType.UINT8},
                    // XXX: behind bytes condition due to likely missing fields with many devices
                    {name: "optionsMask", type: DataType.BITMAP8, conditions: [{type: ParameterCondition.MINIMUM_REMAINING_BUFFER_BYTES, value: 1}]},
                    {
                        name: "optionsOverride",
                        type: DataType.BITMAP8,
                        conditions: [{type: ParameterCondition.MINIMUM_REMAINING_BUFFER_BYTES, value: 1}],
                    },
                ],
                // required: true only if bit 0 of colorCapabilities attribute is 1
            },
            stepSaturation: {
                ID: 0x05,
                parameters: [
                    {name: "stepmode", type: DataType.ENUM8},
                    {name: "stepsize", type: DataType.UINT8},
                    {name: "transtime", type: DataType.UINT8},
                    // XXX: behind bytes condition due to likely missing fields with many devices
                    {name: "optionsMask", type: DataType.BITMAP8, conditions: [{type: ParameterCondition.MINIMUM_REMAINING_BUFFER_BYTES, value: 1}]},
                    {
                        name: "optionsOverride",
                        type: DataType.BITMAP8,
                        conditions: [{type: ParameterCondition.MINIMUM_REMAINING_BUFFER_BYTES, value: 1}],
                    },
                ],
                // required: true only if bit 0 of colorCapabilities attribute is 1
            },
            moveToHueAndSaturation: {
                ID: 0x06,
                parameters: [
                    {name: "hue", type: DataType.UINT8},
                    {name: "saturation", type: DataType.UINT8},
                    {name: "transtime", type: DataType.UINT16},
                    // XXX: behind bytes condition due to likely missing fields with many devices
                    {name: "optionsMask", type: DataType.BITMAP8, conditions: [{type: ParameterCondition.MINIMUM_REMAINING_BUFFER_BYTES, value: 1}]},
                    {
                        name: "optionsOverride",
                        type: DataType.BITMAP8,
                        conditions: [{type: ParameterCondition.MINIMUM_REMAINING_BUFFER_BYTES, value: 1}],
                    },
                ],
                // required: true only if bit 0 of colorCapabilities attribute is 1
            },
            moveToColor: {
                ID: 0x07,
                parameters: [
                    {name: "colorx", type: DataType.UINT16},
                    {name: "colory", type: DataType.UINT16},
                    {name: "transtime", type: DataType.UINT16},
                    // XXX: behind bytes condition due to likely missing fields with many devices
                    {name: "optionsMask", type: DataType.BITMAP8, conditions: [{type: ParameterCondition.MINIMUM_REMAINING_BUFFER_BYTES, value: 1}]},
                    {
                        name: "optionsOverride",
                        type: DataType.BITMAP8,
                        conditions: [{type: ParameterCondition.MINIMUM_REMAINING_BUFFER_BYTES, value: 1}],
                    },
                ],
                // required: true only if bit 3 of colorCapabilities attribute is 1
            },
            moveColor: {
                ID: 0x08,
                parameters: [
                    {name: "ratex", type: DataType.INT16},
                    {name: "ratey", type: DataType.INT16},
                    // XXX: behind bytes condition due to likely missing fields with many devices
                    {name: "optionsMask", type: DataType.BITMAP8, conditions: [{type: ParameterCondition.MINIMUM_REMAINING_BUFFER_BYTES, value: 1}]},
                    {
                        name: "optionsOverride",
                        type: DataType.BITMAP8,
                        conditions: [{type: ParameterCondition.MINIMUM_REMAINING_BUFFER_BYTES, value: 1}],
                    },
                ],
                // required: true only if bit 3 of colorCapabilities attribute is 1
            },
            stepColor: {
                ID: 0x09,
                parameters: [
                    {name: "stepx", type: DataType.INT16},
                    {name: "stepy", type: DataType.INT16},
                    {name: "transtime", type: DataType.UINT16},
                    // XXX: behind bytes condition due to likely missing fields with many devices
                    {name: "optionsMask", type: DataType.BITMAP8, conditions: [{type: ParameterCondition.MINIMUM_REMAINING_BUFFER_BYTES, value: 1}]},
                    {
                        name: "optionsOverride",
                        type: DataType.BITMAP8,
                        conditions: [{type: ParameterCondition.MINIMUM_REMAINING_BUFFER_BYTES, value: 1}],
                    },
                ],
                // required: true only if bit 3 of colorCapabilities attribute is 1
            },
            moveToColorTemp: {
                ID: 0x0a,
                parameters: [
                    {name: "colortemp", type: DataType.UINT16},
                    {name: "transtime", type: DataType.UINT16},
                    // XXX: behind bytes condition due to likely missing fields with many devices
                    {name: "optionsMask", type: DataType.BITMAP8, conditions: [{type: ParameterCondition.MINIMUM_REMAINING_BUFFER_BYTES, value: 1}]},
                    {
                        name: "optionsOverride",
                        type: DataType.BITMAP8,
                        conditions: [{type: ParameterCondition.MINIMUM_REMAINING_BUFFER_BYTES, value: 1}],
                    },
                ],
                // required: true only if bit 4 of colorCapabilities attribute is 1
            },
            enhancedMoveToHue: {
                ID: 0x40,
                parameters: [
                    {name: "enhancehue", type: DataType.UINT16},
                    {name: "direction", type: DataType.ENUM8},
                    {name: "transtime", type: DataType.UINT16},
                    // XXX: behind bytes condition due to likely missing fields with many devices
                    {name: "optionsMask", type: DataType.BITMAP8, conditions: [{type: ParameterCondition.MINIMUM_REMAINING_BUFFER_BYTES, value: 1}]},
                    {
                        name: "optionsOverride",
                        type: DataType.BITMAP8,
                        conditions: [{type: ParameterCondition.MINIMUM_REMAINING_BUFFER_BYTES, value: 1}],
                    },
                ],
                // required: true only if bit 1 of colorCapabilities attribute is 1
            },
            enhancedMoveHue: {
                ID: 0x41,
                parameters: [
                    {name: "movemode", type: DataType.ENUM8},
                    {name: "rate", type: DataType.UINT16},
                    // XXX: behind bytes condition due to likely missing fields with many devices
                    {name: "optionsMask", type: DataType.BITMAP8, conditions: [{type: ParameterCondition.MINIMUM_REMAINING_BUFFER_BYTES, value: 1}]},
                    {
                        name: "optionsOverride",
                        type: DataType.BITMAP8,
                        conditions: [{type: ParameterCondition.MINIMUM_REMAINING_BUFFER_BYTES, value: 1}],
                    },
                ],
                // required: true only if bit 1 of colorCapabilities attribute is 1
            },
            enhancedStepHue: {
                ID: 0x42,
                parameters: [
                    {name: "stepmode", type: DataType.ENUM8},
                    {name: "stepsize", type: DataType.UINT16},
                    {name: "transtime", type: DataType.UINT16},
                    // XXX: behind bytes condition due to likely missing fields with many devices
                    {name: "optionsMask", type: DataType.BITMAP8, conditions: [{type: ParameterCondition.MINIMUM_REMAINING_BUFFER_BYTES, value: 1}]},
                    {
                        name: "optionsOverride",
                        type: DataType.BITMAP8,
                        conditions: [{type: ParameterCondition.MINIMUM_REMAINING_BUFFER_BYTES, value: 1}],
                    },
                ],
                // required: true only if bit 1 of colorCapabilities attribute is 1
            },
            enhancedMoveToHueAndSaturation: {
                ID: 0x43,
                parameters: [
                    {name: "enhancehue", type: DataType.UINT16},
                    {name: "saturation", type: DataType.UINT8},
                    {name: "transtime", type: DataType.UINT16},
                    // XXX: behind bytes condition due to likely missing fields with many devices
                    {name: "optionsMask", type: DataType.BITMAP8, conditions: [{type: ParameterCondition.MINIMUM_REMAINING_BUFFER_BYTES, value: 1}]},
                    {
                        name: "optionsOverride",
                        type: DataType.BITMAP8,
                        conditions: [{type: ParameterCondition.MINIMUM_REMAINING_BUFFER_BYTES, value: 1}],
                    },
                ],
                // required: true only if bit 1 of colorCapabilities attribute is 1
            },
            colorLoopSet: {
                ID: 0x44,
                parameters: [
                    {name: "updateflags", type: DataType.BITMAP8},
                    {name: "action", type: DataType.ENUM8},
                    {name: "direction", type: DataType.ENUM8},
                    {name: "time", type: DataType.UINT16},
                    {name: "starthue", type: DataType.UINT16},
                    // XXX: behind bytes condition due to likely missing fields with many devices
                    {name: "optionsMask", type: DataType.BITMAP8, conditions: [{type: ParameterCondition.MINIMUM_REMAINING_BUFFER_BYTES, value: 1}]},
                    {
                        name: "optionsOverride",
                        type: DataType.BITMAP8,
                        conditions: [{type: ParameterCondition.MINIMUM_REMAINING_BUFFER_BYTES, value: 1}],
                    },
                ],
                // required: true only if bit 2 of colorCapabilities attribute is 1
            },
            stopMoveStep: {
                ID: 0x47,
                parameters: [
                    // XXX: behind bytes condition due to likely missing fields with many devices
                    {name: "optionsMask", type: DataType.BITMAP8, conditions: [{type: ParameterCondition.MINIMUM_REMAINING_BUFFER_BYTES, value: 1}]},
                    {
                        name: "optionsOverride",
                        type: DataType.BITMAP8,
                        conditions: [{type: ParameterCondition.MINIMUM_REMAINING_BUFFER_BYTES, value: 1}],
                    },
                ],
                // required: true only if bit 0, 1, 3 or 4 of colorCapabilities attribute is 1
            },
            moveColorTemp: {
                ID: 0x4b,
                parameters: [
                    {name: "movemode", type: DataType.ENUM8},
                    {name: "rate", type: DataType.UINT16},
                    {name: "minimum", type: DataType.UINT16},
                    {name: "maximum", type: DataType.UINT16},
                    // XXX: behind bytes condition due to likely missing fields with many devices
                    {name: "optionsMask", type: DataType.BITMAP8, conditions: [{type: ParameterCondition.MINIMUM_REMAINING_BUFFER_BYTES, value: 1}]},
                    {
                        name: "optionsOverride",
                        type: DataType.BITMAP8,
                        conditions: [{type: ParameterCondition.MINIMUM_REMAINING_BUFFER_BYTES, value: 1}],
                    },
                ],
                // required: true only if bit 4 of colorCapabilities attribute is 1
            },
            stepColorTemp: {
                ID: 0x4c,
                parameters: [
                    {name: "stepmode", type: DataType.ENUM8},
                    {name: "stepsize", type: DataType.UINT16},
                    {name: "transtime", type: DataType.UINT16},
                    {name: "minimum", type: DataType.UINT16},
                    {name: "maximum", type: DataType.UINT16},
                    // XXX: behind bytes condition due to likely missing fields with many devices
                    {name: "optionsMask", type: DataType.BITMAP8, conditions: [{type: ParameterCondition.MINIMUM_REMAINING_BUFFER_BYTES, value: 1}]},
                    {
                        name: "optionsOverride",
                        type: DataType.BITMAP8,
                        conditions: [{type: ParameterCondition.MINIMUM_REMAINING_BUFFER_BYTES, value: 1}],
                    },
                ],
                // required: true only if bit 0 of colorCapabilities attribute is 1
            },
            // custom
            tuyaMoveToHueAndSaturationBrightness: {
                ID: 0x06,
                parameters: [
                    {name: "hue", type: DataType.UINT8, max: 0xff},
                    {name: "saturation", type: DataType.UINT8, max: 0xff},
                    {name: "transtime", type: DataType.UINT16, max: 0xffff},
                    {name: "brightness", type: DataType.UINT8, max: 0xff},
                ],
            },
            tuyaSetMinimumBrightness: {ID: 0xe0, parameters: [{name: "minimum", type: DataType.UINT16, max: 0xffff}]},
            tuyaMoveToHueAndSaturationBrightness2: {
                ID: 0xe1,
                parameters: [
                    {name: "hue", type: DataType.UINT16, max: 0xffff},
                    {name: "saturation", type: DataType.UINT16, max: 0xffff},
                    {name: "brightness", type: DataType.UINT16, max: 0xffff},
                ],
            },
            tuyaRgbMode: {ID: 0xf0, parameters: [{name: "enable", type: DataType.UINT8, max: 0xff}]},
            tuyaOnStartUp: {
                ID: 0xf9,
                parameters: [
                    {name: "mode", type: DataType.UINT16, max: 0xffff},
                    {name: "data", type: BuffaloZclDataType.LIST_UINT8},
                ],
            },
            tuyaDoNotDisturb: {ID: 0xfa, parameters: [{name: "enable", type: DataType.UINT8, max: 0xff}]},
            tuyaOnOffTransitionTime: {
                ID: 0xfb,
                parameters: [
                    {name: "unknown", type: DataType.UINT8, max: 0xff},
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
            physicalMinLevel: {ID: 0x0000, type: DataType.UINT8, required: true, min: 1, max: 0xfe, default: 1},
            physicalMaxLevel: {ID: 0x0001, type: DataType.UINT8, required: true, min: 1, max: 0xfe, default: 0xfe},
            ballastStatus: {ID: 0x0002, type: DataType.BITMAP8, default: 0},

            minLevel: {ID: 0x0010, type: DataType.UINT8, write: true, required: true, min: 1, max: 0xfe},
            maxLevel: {ID: 0x0011, type: DataType.UINT8, write: true, required: true, min: 1, max: 0xfe},
            powerOnLevel: {ID: 0x0012, type: DataType.UINT8, write: true, max: 0xfe},
            powerOnFadeTime: {ID: 0x0013, type: DataType.UINT16, write: true, max: 0xfffe, default: 0},
            intrinsicBallastFactor: {ID: 0x0014, type: DataType.UINT8, write: true, max: 0xfe},
            ballastFactorAdjustment: {ID: 0x0015, type: DataType.UINT8, write: true, min: 100, default: 0xff},

            lampQuantity: {ID: 0x0020, type: DataType.UINT8, max: 0xfe},

            lampType: {ID: 0x0030, type: DataType.CHAR_STR, write: true, default: "", maxLen: 16},
            lampManufacturer: {ID: 0x0031, type: DataType.CHAR_STR, write: true, default: "", maxLen: 16},
            lampRatedHours: {ID: 0x0032, type: DataType.UINT24, write: true, max: 0xfffffe, default: 0xffffff},
            lampBurnHours: {ID: 0x0033, type: DataType.UINT24, write: true, max: 0xfffffe, default: 0},
            lampAlarmMode: {ID: 0x0034, type: DataType.BITMAP8, write: true, default: 0},
            lampBurnHoursTripPoint: {ID: 0x0035, type: DataType.UINT24, write: true, max: 0xfffffe, default: 0xffffff},
            // custom
            elkoControlMode: {ID: 0xe000, type: DataType.ENUM8, manufacturerCode: ManufacturerCode.ADEO, write: true, max: 0xff},
            wiserControlMode: {ID: 0xe000, type: DataType.ENUM8, manufacturerCode: ManufacturerCode.SCHNEIDER_ELECTRIC, write: true, max: 0xff},
        },
        commands: {},
        commandsResponse: {},
    },
    msIlluminanceMeasurement: {
        ID: 0x0400,
        attributes: {
            measuredValue: {
                ID: 0x0000,
                type: DataType.UINT16,
                report: true,
                required: true,
                max: 65535,
                default: 0,
                special: [
                    ["TooLowToBeMeasured", "0000"],
                    ["Invalid", "ffff"],
                ],
            },
            minMeasuredValue: {ID: 0x0001, type: DataType.UINT16, required: true, min: 1, max: 65533},
            maxMeasuredValue: {ID: 0x0002, type: DataType.UINT16, required: true, min: 2, max: 65534},
            tolerance: {ID: 0x0003, type: DataType.UINT16, max: 0x0800},
            lightSensorType: {ID: 0x0004, type: DataType.ENUM8, default: 0xff, special: [["Unknown", "ff"]]},
        },
        commands: {},
        commandsResponse: {},
    },
    msIlluminanceLevelSensing: {
        ID: 0x0401,
        attributes: {
            levelStatus: {ID: 0x0000, type: DataType.ENUM8, report: true, required: true, max: 254},
            lightSensorType: {ID: 0x0001, type: DataType.ENUM8, max: 0xfe},
            illuminanceTargetLevel: {ID: 0x0010, type: DataType.UINT16, write: true, required: true, max: 65534},
        },
        commands: {},
        commandsResponse: {},
    },
    msTemperatureMeasurement: {
        ID: 0x0402,
        attributes: {
            measuredValue: {ID: 0x0000, type: DataType.INT16, report: true, required: true},
            minMeasuredValue: {ID: 0x0001, type: DataType.INT16, required: true, min: -27315, max: 32766},
            maxMeasuredValue: {ID: 0x0002, type: DataType.INT16, required: true, min: -27314, max: 32767},
            tolerance: {ID: 0x0003, type: DataType.UINT16, max: 0x0800},
            // custom
            minPercentChange: {ID: 0x0010, type: DataType.UNKNOWN, write: true},
            minAbsoluteChange: {ID: 0x0011, type: DataType.UNKNOWN, write: true},
            sprutTemperatureOffset: {
                ID: 0x6600,
                type: DataType.INT16,
                manufacturerCode: ManufacturerCode.CUSTOM_SPRUT_DEVICE,
                write: true,
                min: -32768,
                max: 32767,
            },
        },
        commands: {},
        commandsResponse: {},
    },
    msPressureMeasurement: {
        ID: 0x0403,
        attributes: {
            measuredValue: {ID: 0x0000, type: DataType.INT16, report: true, required: true},
            minMeasuredValue: {ID: 0x0001, type: DataType.INT16, required: true, min: -32767, max: 32766},
            maxMeasuredValue: {ID: 0x0002, type: DataType.INT16, required: true, min: -32766, max: 32767},
            tolerance: {ID: 0x0003, type: DataType.UINT16, max: 0x0800},
            // if supported, should also be `report: true`
            scaledValue: {ID: 0x0010, type: DataType.INT16, default: 0},
            minScaledValue: {ID: 0x0011, type: DataType.INT16, min: -32767, max: 32766},
            maxScaledValue: {ID: 0x0012, type: DataType.INT16, min: -32766, max: 32767},
            // if supported, should also be `report: true`
            scaledTolerance: {ID: 0x0013, type: DataType.UINT16, max: 2048},
            scale: {ID: 0x0014, type: DataType.INT8, min: -127, max: 127},
        },
        commands: {},
        commandsResponse: {},
    },
    msFlowMeasurement: {
        ID: 0x0404,
        attributes: {
            measuredValue: {ID: 0x0000, type: DataType.UINT16, report: true, required: true},
            minMeasuredValue: {ID: 0x0001, type: DataType.UINT16, required: true, max: 65533},
            maxMeasuredValue: {ID: 0x0002, type: DataType.UINT16, required: true, min: 1, max: 65534},
            tolerance: {ID: 0x0003, type: DataType.UINT16, max: 0x0800},
        },
        commands: {},
        commandsResponse: {},
    },
    msRelativeHumidity: {
        ID: 0x0405,
        attributes: {
            measuredValue: {ID: 0x0000, type: DataType.UINT16, report: true, required: true},
            minMeasuredValue: {ID: 0x0001, type: DataType.UINT16, required: true, max: 9999},
            maxMeasuredValue: {ID: 0x0002, type: DataType.UINT16, required: true, min: 1, max: 10000},
            tolerance: {ID: 0x0003, type: DataType.UINT16, max: 0x0800},
            // custom
            sprutHeater: {ID: 0x6600, type: DataType.BOOLEAN, manufacturerCode: ManufacturerCode.CUSTOM_SPRUT_DEVICE, write: true},
        },
        commands: {},
        commandsResponse: {},
    },
    msOccupancySensing: {
        ID: 0x0406,
        attributes: {
            occupancy: {ID: 0x0000, type: DataType.BITMAP8, report: true, required: true},
            occupancySensorType: {ID: 0x0001, type: DataType.ENUM8, required: true, default: 0},
            occupancySensorTypeBitmap: {ID: 0x0002, type: DataType.BITMAP8, required: true},
            pirOToUDelay: {ID: 0x0010, type: DataType.UINT16, write: true, max: 0xfffe, default: 0x0000},
            pirUToODelay: {ID: 0x0011, type: DataType.UINT16, write: true, max: 0xfffe, default: 0x0000},
            pirUToOThreshold: {ID: 0x0012, type: DataType.UINT8, write: true, min: 0x01, max: 0xfe, default: 0x01},
            ultrasonicOToUDelay: {ID: 0x0020, type: DataType.UINT16, write: true, max: 0xfffe, default: 0x0000},
            ultrasonicUToODelay: {ID: 0x0021, type: DataType.UINT16, write: true, max: 0xfffe, default: 0x0000},
            ultrasonicUToOThreshold: {ID: 0x0022, type: DataType.UINT8, write: true, min: 0x01, max: 0xfe, default: 0x01},
            contactOToUDelay: {ID: 0x0030, type: DataType.UINT16, write: true, max: 0xfffe, default: 0x0000},
            contactUToODelay: {ID: 0x0031, type: DataType.UINT16, write: true, max: 0xfffe, default: 0x0000},
            contactUToOThreshold: {ID: 0x0032, type: DataType.UINT8, write: true, min: 0x01, max: 0xfe, default: 0x01},
            // custom
            sprutOccupancyLevel: {
                ID: 0x6600,
                type: DataType.UINT16,
                manufacturerCode: ManufacturerCode.CUSTOM_SPRUT_DEVICE,
                write: true,
                max: 0xffff,
            },
            sprutOccupancySensitivity: {
                ID: 0x6601,
                type: DataType.UINT16,
                manufacturerCode: ManufacturerCode.CUSTOM_SPRUT_DEVICE,
                write: true,
                max: 0xffff,
            },
            elkoOccupancyDfltOperationMode: {ID: 0xe000, type: DataType.ENUM8, manufacturerCode: ManufacturerCode.ADEO, write: true, max: 0xff},
            elkoOccupancyOperationMode: {ID: 0xe001, type: DataType.ENUM8, manufacturerCode: ManufacturerCode.ADEO, write: true, max: 0xff},
            elkoForceOffTimeout: {ID: 0xe002, type: DataType.UINT16, manufacturerCode: ManufacturerCode.ADEO, write: true, max: 0xffff},
            elkoOccupancySensitivity: {ID: 0xe003, type: DataType.UINT8, manufacturerCode: ManufacturerCode.ADEO, write: true, max: 0xff},
        },
        commands: {},
        commandsResponse: {},
    },
    msLeafWetness: {
        ID: 0x0407,
        attributes: {
            measuredValue: {ID: 0x0000, type: DataType.UINT16, report: true, required: true},
            minMeasuredValue: {ID: 0x0001, type: DataType.UINT16, required: true, max: 9999},
            maxMeasuredValue: {ID: 0x0002, type: DataType.UINT16, required: true, min: 1, max: 10000},
            tolerance: {ID: 0x0003, type: DataType.UINT16, max: 0x0800},
        },
        commands: {},
        commandsResponse: {},
    },
    msSoilMoisture: {
        ID: 0x0408,
        attributes: {
            measuredValue: {ID: 0x0000, type: DataType.UINT16, report: true, required: true},
            minMeasuredValue: {ID: 0x0001, type: DataType.UINT16, required: true, max: 9999},
            maxMeasuredValue: {ID: 0x0002, type: DataType.UINT16, required: true, min: 1, max: 10000},
            tolerance: {ID: 0x0003, type: DataType.UINT16, max: 0x0800},
        },
        commands: {},
        commandsResponse: {},
    },
    pHMeasurement: {
        ID: 0x0409,
        attributes: {
            measuredValue: {ID: 0x0000, type: DataType.UINT16, report: true, required: true},
            minMeasuredValue: {ID: 0x0001, type: DataType.UINT16, required: true, max: 1399},
            maxMeasuredValue: {ID: 0x0002, type: DataType.UINT16, required: true, min: 1, max: 1400},
            tolerance: {ID: 0x0003, type: DataType.UINT16, max: 0x00c8},
        },
        commands: {},
        commandsResponse: {},
    },
    msElectricalConductivity: {
        ID: 0x040a,
        attributes: {
            measuredValue: {ID: 0x0000, type: DataType.UINT16, report: true, required: true},
            minMeasuredValue: {ID: 0x0001, type: DataType.UINT16, required: true, max: 65533},
            maxMeasuredValue: {ID: 0x0002, type: DataType.UINT16, required: true, min: 1, max: 65534},
            tolerance: {ID: 0x0003, type: DataType.UINT16, max: 0x0064},
        },
        commands: {},
        commandsResponse: {},
    },
    msWindSpeed: {
        ID: 0x040b,
        attributes: {
            measuredValue: {ID: 0x0000, type: DataType.UINT16, report: true, required: true},
            minMeasuredValue: {ID: 0x0001, type: DataType.UINT16, required: true, max: 65533},
            maxMeasuredValue: {ID: 0x0002, type: DataType.UINT16, required: true, min: 1, max: 65534},
            tolerance: {ID: 0x0003, type: DataType.UINT16, max: 0x0308, default: 0},
        },
        commands: {},
        commandsResponse: {},
    },
    msCarbonMonoxide: {
        // CO
        ID: 0x040c,
        attributes: {
            measuredValue: {ID: 0x0000, type: DataType.SINGLE_PREC, report: true, required: true},
            minMeasuredValue: {ID: 0x0001, type: DataType.SINGLE_PREC, required: true, min: 0},
            maxMeasuredValue: {ID: 0x0002, type: DataType.SINGLE_PREC, required: true, max: 1},
            tolerance: {ID: 0x0003, type: DataType.SINGLE_PREC},
        },
        commands: {},
        commandsResponse: {},
    },
    msCO2: {
        // Carbon Dioxide
        ID: 0x040d,
        attributes: {
            measuredValue: {ID: 0x0000, type: DataType.SINGLE_PREC, report: true, required: true},
            minMeasuredValue: {ID: 0x0001, type: DataType.SINGLE_PREC, required: true, min: 0},
            maxMeasuredValue: {ID: 0x0002, type: DataType.SINGLE_PREC, required: true, max: 1},
            tolerance: {ID: 0x0003, type: DataType.SINGLE_PREC},
            // custom
            sprutCO2Calibration: {ID: 0x6600, type: DataType.BOOLEAN, manufacturerCode: ManufacturerCode.CUSTOM_SPRUT_DEVICE, write: true},
            sprutCO2AutoCalibration: {ID: 0x6601, type: DataType.BOOLEAN, manufacturerCode: ManufacturerCode.CUSTOM_SPRUT_DEVICE, write: true},
        },
        commands: {},
        commandsResponse: {},
    },
    msEthylene: {
        // CH2
        ID: 0x040e,
        attributes: {
            measuredValue: {ID: 0x0000, type: DataType.SINGLE_PREC, report: true, required: true},
            minMeasuredValue: {ID: 0x0001, type: DataType.SINGLE_PREC, required: true, min: 0},
            maxMeasuredValue: {ID: 0x0002, type: DataType.SINGLE_PREC, required: true, max: 1},
            tolerance: {ID: 0x0003, type: DataType.SINGLE_PREC},
        },
        commands: {},
        commandsResponse: {},
    },
    msEthyleneOxide: {
        // C2H4O
        ID: 0x040f,
        attributes: {
            measuredValue: {ID: 0x0000, type: DataType.SINGLE_PREC, report: true, required: true},
            minMeasuredValue: {ID: 0x0001, type: DataType.SINGLE_PREC, required: true, min: 0},
            maxMeasuredValue: {ID: 0x0002, type: DataType.SINGLE_PREC, required: true, max: 1},
            tolerance: {ID: 0x0003, type: DataType.SINGLE_PREC},
        },
        commands: {},
        commandsResponse: {},
    },
    msHydrogen: {
        // H
        ID: 0x0410,
        attributes: {
            measuredValue: {ID: 0x0000, type: DataType.SINGLE_PREC, report: true, required: true},
            minMeasuredValue: {ID: 0x0001, type: DataType.SINGLE_PREC, required: true, min: 0},
            maxMeasuredValue: {ID: 0x0002, type: DataType.SINGLE_PREC, required: true, max: 1},
            tolerance: {ID: 0x0003, type: DataType.SINGLE_PREC},
        },
        commands: {},
        commandsResponse: {},
    },
    msHydrogenSulfide: {
        // H2S
        ID: 0x0411,
        attributes: {
            measuredValue: {ID: 0x0000, type: DataType.SINGLE_PREC, report: true, required: true},
            minMeasuredValue: {ID: 0x0001, type: DataType.SINGLE_PREC, required: true, min: 0},
            maxMeasuredValue: {ID: 0x0002, type: DataType.SINGLE_PREC, required: true, max: 1},
            tolerance: {ID: 0x0003, type: DataType.SINGLE_PREC},
        },
        commands: {},
        commandsResponse: {},
    },
    msNitricOxide: {
        // NO
        ID: 0x0412,
        attributes: {
            measuredValue: {ID: 0x0000, type: DataType.SINGLE_PREC, report: true, required: true},
            minMeasuredValue: {ID: 0x0001, type: DataType.SINGLE_PREC, required: true, min: 0},
            maxMeasuredValue: {ID: 0x0002, type: DataType.SINGLE_PREC, required: true, max: 1},
            tolerance: {ID: 0x0003, type: DataType.SINGLE_PREC},
        },
        commands: {},
        commandsResponse: {},
    },
    msNitrogenDioxide: {
        // NO2
        ID: 0x0413,
        attributes: {
            measuredValue: {ID: 0x0000, type: DataType.SINGLE_PREC, report: true, required: true},
            minMeasuredValue: {ID: 0x0001, type: DataType.SINGLE_PREC, required: true, min: 0},
            maxMeasuredValue: {ID: 0x0002, type: DataType.SINGLE_PREC, required: true, max: 1},
            tolerance: {ID: 0x0003, type: DataType.SINGLE_PREC},
        },
        commands: {},
        commandsResponse: {},
    },
    msOxygen: {
        // O2
        ID: 0x0414,
        attributes: {
            measuredValue: {ID: 0x0000, type: DataType.SINGLE_PREC, report: true, required: true},
            minMeasuredValue: {ID: 0x0001, type: DataType.SINGLE_PREC, required: true, min: 0},
            maxMeasuredValue: {ID: 0x0002, type: DataType.SINGLE_PREC, required: true, max: 1},
            tolerance: {ID: 0x0003, type: DataType.SINGLE_PREC},
        },
        commands: {},
        commandsResponse: {},
    },
    msOzone: {
        // O3
        ID: 0x0415,
        attributes: {
            measuredValue: {ID: 0x0000, type: DataType.SINGLE_PREC, report: true, required: true},
            minMeasuredValue: {ID: 0x0001, type: DataType.SINGLE_PREC, required: true, min: 0},
            maxMeasuredValue: {ID: 0x0002, type: DataType.SINGLE_PREC, required: true, max: 1},
            tolerance: {ID: 0x0003, type: DataType.SINGLE_PREC},
        },
        commands: {},
        commandsResponse: {},
    },
    msSulfurDioxide: {
        // SO2
        ID: 0x0416,
        attributes: {
            measuredValue: {ID: 0x0000, type: DataType.SINGLE_PREC, report: true, required: true},
            minMeasuredValue: {ID: 0x0001, type: DataType.SINGLE_PREC, required: true, min: 0},
            maxMeasuredValue: {ID: 0x0002, type: DataType.SINGLE_PREC, required: true, max: 1},
            tolerance: {ID: 0x0003, type: DataType.SINGLE_PREC},
        },
        commands: {},
        commandsResponse: {},
    },
    msDissolvedOxygen: {
        // DO
        ID: 0x0417,
        attributes: {
            measuredValue: {ID: 0x0000, type: DataType.SINGLE_PREC, report: true, required: true},
            minMeasuredValue: {ID: 0x0001, type: DataType.SINGLE_PREC, required: true, min: 0},
            maxMeasuredValue: {ID: 0x0002, type: DataType.SINGLE_PREC, required: true, max: 1},
            tolerance: {ID: 0x0003, type: DataType.SINGLE_PREC},
        },
        commands: {},
        commandsResponse: {},
    },
    msBromate: {
        ID: 0x0418,
        attributes: {
            measuredValue: {ID: 0x0000, type: DataType.SINGLE_PREC, report: true, required: true},
            minMeasuredValue: {ID: 0x0001, type: DataType.SINGLE_PREC, required: true, min: 0},
            maxMeasuredValue: {ID: 0x0002, type: DataType.SINGLE_PREC, required: true, max: 1},
            tolerance: {ID: 0x0003, type: DataType.SINGLE_PREC},
        },
        commands: {},
        commandsResponse: {},
    },
    msChloramines: {
        ID: 0x0419,
        attributes: {
            measuredValue: {ID: 0x0000, type: DataType.SINGLE_PREC, report: true, required: true},
            minMeasuredValue: {ID: 0x0001, type: DataType.SINGLE_PREC, required: true, min: 0},
            maxMeasuredValue: {ID: 0x0002, type: DataType.SINGLE_PREC, required: true, max: 1},
            tolerance: {ID: 0x0003, type: DataType.SINGLE_PREC},
        },
        commands: {},
        commandsResponse: {},
    },
    msChlorine: {
        ID: 0x041a,
        attributes: {
            measuredValue: {ID: 0x0000, type: DataType.SINGLE_PREC, report: true, required: true},
            minMeasuredValue: {ID: 0x0001, type: DataType.SINGLE_PREC, required: true, min: 0},
            maxMeasuredValue: {ID: 0x0002, type: DataType.SINGLE_PREC, required: true, max: 1},
            tolerance: {ID: 0x0003, type: DataType.SINGLE_PREC},
        },
        commands: {},
        commandsResponse: {},
    },
    msFecalColiformAndEColi: {
        ID: 0x041b,
        attributes: {
            measuredValue: {ID: 0x0000, type: DataType.SINGLE_PREC, report: true, required: true},
            minMeasuredValue: {ID: 0x0001, type: DataType.SINGLE_PREC, required: true, min: 0},
            maxMeasuredValue: {ID: 0x0002, type: DataType.SINGLE_PREC, required: true, max: 1},
            tolerance: {ID: 0x0003, type: DataType.SINGLE_PREC},
        },
        commands: {},
        commandsResponse: {},
    },
    msFluoride: {
        ID: 0x041c,
        attributes: {
            measuredValue: {ID: 0x0000, type: DataType.SINGLE_PREC, report: true, required: true},
            minMeasuredValue: {ID: 0x0001, type: DataType.SINGLE_PREC, required: true, min: 0},
            maxMeasuredValue: {ID: 0x0002, type: DataType.SINGLE_PREC, required: true, max: 1},
            tolerance: {ID: 0x0003, type: DataType.SINGLE_PREC},
        },
        commands: {},
        commandsResponse: {},
    },
    msHaloaceticAcids: {
        ID: 0x041d,
        attributes: {
            measuredValue: {ID: 0x0000, type: DataType.SINGLE_PREC, report: true, required: true},
            minMeasuredValue: {ID: 0x0001, type: DataType.SINGLE_PREC, required: true, min: 0},
            maxMeasuredValue: {ID: 0x0002, type: DataType.SINGLE_PREC, required: true, max: 1},
            tolerance: {ID: 0x0003, type: DataType.SINGLE_PREC},
        },
        commands: {},
        commandsResponse: {},
    },
    msTotalTrihalomethanes: {
        ID: 0x041e,
        attributes: {
            measuredValue: {ID: 0x0000, type: DataType.SINGLE_PREC, report: true, required: true},
            minMeasuredValue: {ID: 0x0001, type: DataType.SINGLE_PREC, required: true, min: 0},
            maxMeasuredValue: {ID: 0x0002, type: DataType.SINGLE_PREC, required: true, max: 1},
            tolerance: {ID: 0x0003, type: DataType.SINGLE_PREC},
        },
        commands: {},
        commandsResponse: {},
    },
    msTotalColiformBacteria: {
        ID: 0x041f,
        attributes: {
            measuredValue: {ID: 0x0000, type: DataType.SINGLE_PREC, report: true, required: true},
            minMeasuredValue: {ID: 0x0001, type: DataType.SINGLE_PREC, required: true, min: 0},
            maxMeasuredValue: {ID: 0x0002, type: DataType.SINGLE_PREC, required: true, max: 1},
            tolerance: {ID: 0x0003, type: DataType.SINGLE_PREC},
        },
        commands: {},
        commandsResponse: {},
    },
    msTurbidity: {
        ID: 0x0420,
        attributes: {
            measuredValue: {ID: 0x0000, type: DataType.SINGLE_PREC, report: true, required: true},
            minMeasuredValue: {ID: 0x0001, type: DataType.SINGLE_PREC, required: true, min: 0},
            maxMeasuredValue: {ID: 0x0002, type: DataType.SINGLE_PREC, required: true, max: 1},
            tolerance: {ID: 0x0003, type: DataType.SINGLE_PREC},
        },
        commands: {},
        commandsResponse: {},
    },
    msCopper: {
        ID: 0x0421,
        attributes: {
            measuredValue: {ID: 0x0000, type: DataType.SINGLE_PREC, report: true, required: true},
            minMeasuredValue: {ID: 0x0001, type: DataType.SINGLE_PREC, required: true, min: 0},
            maxMeasuredValue: {ID: 0x0002, type: DataType.SINGLE_PREC, required: true, max: 1},
            tolerance: {ID: 0x0003, type: DataType.SINGLE_PREC},
        },
        commands: {},
        commandsResponse: {},
    },
    msLead: {
        ID: 0x0422,
        attributes: {
            measuredValue: {ID: 0x0000, type: DataType.SINGLE_PREC, report: true, required: true},
            minMeasuredValue: {ID: 0x0001, type: DataType.SINGLE_PREC, required: true, min: 0},
            maxMeasuredValue: {ID: 0x0002, type: DataType.SINGLE_PREC, required: true, max: 1},
            tolerance: {ID: 0x0003, type: DataType.SINGLE_PREC},
        },
        commands: {},
        commandsResponse: {},
    },
    msManganese: {
        ID: 0x0423,
        attributes: {
            measuredValue: {ID: 0x0000, type: DataType.SINGLE_PREC, report: true, required: true},
            minMeasuredValue: {ID: 0x0001, type: DataType.SINGLE_PREC, required: true, min: 0},
            maxMeasuredValue: {ID: 0x0002, type: DataType.SINGLE_PREC, required: true, max: 1},
            tolerance: {ID: 0x0003, type: DataType.SINGLE_PREC},
        },
        commands: {},
        commandsResponse: {},
    },
    msSulfate: {
        ID: 0x0424,
        attributes: {
            measuredValue: {ID: 0x0000, type: DataType.SINGLE_PREC, report: true, required: true},
            minMeasuredValue: {ID: 0x0001, type: DataType.SINGLE_PREC, required: true, min: 0},
            maxMeasuredValue: {ID: 0x0002, type: DataType.SINGLE_PREC, required: true, max: 1},
            tolerance: {ID: 0x0003, type: DataType.SINGLE_PREC},
        },
        commands: {},
        commandsResponse: {},
    },
    msBromodichloromethane: {
        ID: 0x0425,
        attributes: {
            measuredValue: {ID: 0x0000, type: DataType.SINGLE_PREC, report: true, required: true},
            minMeasuredValue: {ID: 0x0001, type: DataType.SINGLE_PREC, required: true, min: 0},
            maxMeasuredValue: {ID: 0x0002, type: DataType.SINGLE_PREC, required: true, max: 1},
            tolerance: {ID: 0x0003, type: DataType.SINGLE_PREC},
        },
        commands: {},
        commandsResponse: {},
    },
    msBromoform: {
        ID: 0x0426,
        attributes: {
            measuredValue: {ID: 0x0000, type: DataType.SINGLE_PREC, report: true, required: true},
            minMeasuredValue: {ID: 0x0001, type: DataType.SINGLE_PREC, required: true, min: 0},
            maxMeasuredValue: {ID: 0x0002, type: DataType.SINGLE_PREC, required: true, max: 1},
            tolerance: {ID: 0x0003, type: DataType.SINGLE_PREC},
        },
        commands: {},
        commandsResponse: {},
    },
    msChlorodibromomethane: {
        ID: 0x0427,
        attributes: {
            measuredValue: {ID: 0x0000, type: DataType.SINGLE_PREC, report: true, required: true},
            minMeasuredValue: {ID: 0x0001, type: DataType.SINGLE_PREC, required: true, min: 0},
            maxMeasuredValue: {ID: 0x0002, type: DataType.SINGLE_PREC, required: true, max: 1},
            tolerance: {ID: 0x0003, type: DataType.SINGLE_PREC},
        },
        commands: {},
        commandsResponse: {},
    },
    msChloroform: {
        ID: 0x0428,
        attributes: {
            measuredValue: {ID: 0x0000, type: DataType.SINGLE_PREC, report: true, required: true},
            minMeasuredValue: {ID: 0x0001, type: DataType.SINGLE_PREC, required: true, min: 0},
            maxMeasuredValue: {ID: 0x0002, type: DataType.SINGLE_PREC, required: true, max: 1},
            tolerance: {ID: 0x0003, type: DataType.SINGLE_PREC},
        },
        commands: {},
        commandsResponse: {},
    },
    msSodium: {
        ID: 0x0429,
        attributes: {
            measuredValue: {ID: 0x0000, type: DataType.SINGLE_PREC, report: true, required: true},
            minMeasuredValue: {ID: 0x0001, type: DataType.SINGLE_PREC, required: true, min: 0},
            maxMeasuredValue: {ID: 0x0002, type: DataType.SINGLE_PREC, required: true, max: 1},
            tolerance: {ID: 0x0003, type: DataType.SINGLE_PREC},
        },
        commands: {},
        commandsResponse: {},
    },
    pm25Measurement: {
        ID: 0x042a,
        // XXX: attrs not named same as other concentration measurement clusters
        attributes: {
            measuredValue: {ID: 0x0000, type: DataType.SINGLE_PREC, report: true, required: true},
            measuredMinValue: {ID: 0x0001, type: DataType.SINGLE_PREC, required: true, min: 0},
            measuredMaxValue: {ID: 0x0002, type: DataType.SINGLE_PREC, required: true, max: 1},
            tolerance: {ID: 0x0003, type: DataType.SINGLE_PREC},
        },
        commands: {},
        commandsResponse: {},
    },
    msFormaldehyde: {
        ID: 0x042b,
        attributes: {
            measuredValue: {ID: 0x0000, type: DataType.SINGLE_PREC, report: true, required: true},
            minMeasuredValue: {ID: 0x0001, type: DataType.SINGLE_PREC, required: true, min: 0},
            maxMeasuredValue: {ID: 0x0002, type: DataType.SINGLE_PREC, required: true, max: 1},
            tolerance: {ID: 0x0003, type: DataType.SINGLE_PREC},
        },
        commands: {},
        commandsResponse: {},
    },
    ssIasZone: {
        ID: 0x0500,
        attributes: {
            zoneState: {ID: 0x0000, type: DataType.ENUM8, required: true, default: 0},
            zoneType: {ID: 0x0001, type: DataType.ENUM16, required: true},
            zoneStatus: {ID: 0x0002, type: DataType.BITMAP16, required: true, default: 0},

            iasCieAddr: {ID: 0x0010, type: DataType.IEEE_ADDR, write: true, required: true},
            zoneId: {ID: 0x0011, type: DataType.UINT8, required: true, max: 0xff, default: 0xff},
            // if currentZoneSensitivityLevel is supported, this one should be too (`required: true`)
            numZoneSensitivityLevelsSupported: {ID: 0x0012, type: DataType.UINT8, min: 2, max: 0xff, default: 2},
            // if numZoneSensitivityLevelsSupported is supported, this one should be too (`required: true`)
            currentZoneSensitivityLevel: {ID: 0x0013, type: DataType.UINT8, write: true, max: 0xff, default: 0},
            // custom
            develcoAlarmOffDelay: {ID: 0x8001, type: DataType.UINT16, manufacturerCode: ManufacturerCode.DEVELCO, write: true, max: 0xffff},
        },
        commands: {
            enrollRsp: {
                ID: 0x00,
                parameters: [
                    {name: "enrollrspcode", type: DataType.ENUM8},
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
                    {name: "zonestatus", type: DataType.BITMAP16},
                    {name: "extendedstatus", type: DataType.BITMAP8},
                    {name: "zoneID", type: DataType.UINT8},
                    {name: "delay", type: DataType.UINT16},
                ],
                required: true,
            },
            enrollReq: {
                ID: 0x01,
                parameters: [
                    {name: "zonetype", type: DataType.ENUM16},
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
                    {name: "armmode", type: DataType.ENUM8},
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
                    {name: "zonestatusmaskflag", type: DataType.BOOLEAN},
                    {name: "zonestatusmask", type: DataType.BITMAP16},
                ],
                required: true,
            },
        },
        commandsResponse: {
            armRsp: {ID: 0x00, parameters: [{name: "armnotification", type: DataType.ENUM8}], required: true},
            getZoneIDMapRsp: {
                ID: 0x01,
                parameters: [
                    {name: "zoneidmapsection0", type: DataType.BITMAP16},
                    {name: "zoneidmapsection1", type: DataType.BITMAP16},
                    {name: "zoneidmapsection2", type: DataType.BITMAP16},
                    {name: "zoneidmapsection3", type: DataType.BITMAP16},
                    {name: "zoneidmapsection4", type: DataType.BITMAP16},
                    {name: "zoneidmapsection5", type: DataType.BITMAP16},
                    {name: "zoneidmapsection6", type: DataType.BITMAP16},
                    {name: "zoneidmapsection7", type: DataType.BITMAP16},
                    {name: "zoneidmapsection8", type: DataType.BITMAP16},
                    {name: "zoneidmapsection9", type: DataType.BITMAP16},
                    {name: "zoneidmapsection10", type: DataType.BITMAP16},
                    {name: "zoneidmapsection11", type: DataType.BITMAP16},
                    {name: "zoneidmapsection12", type: DataType.BITMAP16},
                    {name: "zoneidmapsection13", type: DataType.BITMAP16},
                    {name: "zoneidmapsection14", type: DataType.BITMAP16},
                    {name: "zoneidmapsection15", type: DataType.BITMAP16},
                ],
                required: true,
            },
            getZoneInfoRsp: {
                ID: 0x02,
                parameters: [
                    {name: "zoneid", type: DataType.UINT8},
                    {name: "zonetype", type: DataType.ENUM16},
                    {name: "ieeeaddr", type: DataType.IEEE_ADDR},
                    {name: "zonelabel", type: DataType.CHAR_STR},
                ],
                required: true,
            },
            zoneStatusChanged: {
                ID: 0x03,
                parameters: [
                    {name: "zoneid", type: DataType.UINT8},
                    {name: "zonestatus", type: DataType.ENUM16},
                    {name: "audiblenotif", type: DataType.ENUM8},
                    {name: "zonelabel", type: DataType.CHAR_STR},
                ],
                required: true,
            },
            panelStatusChanged: {
                ID: 0x04,
                parameters: [
                    {name: "panelstatus", type: DataType.ENUM8},
                    {name: "secondsremain", type: DataType.UINT8},
                    {name: "audiblenotif", type: DataType.ENUM8},
                    {name: "alarmstatus", type: DataType.ENUM8},
                ],
                required: true,
            },
            getPanelStatusRsp: {
                ID: 0x05,
                parameters: [
                    {name: "panelstatus", type: DataType.ENUM8},
                    {name: "secondsremain", type: DataType.UINT8},
                    {name: "audiblenotif", type: DataType.ENUM8},
                    {name: "alarmstatus", type: DataType.ENUM8},
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
                    {name: "zonestatuscomplete", type: DataType.BOOLEAN},
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
            maxDuration: {ID: 0x0000, type: DataType.UINT16, write: true, required: true, max: 0xfffe, default: 240},
        },
        commands: {
            startWarning: {
                ID: 0x00,
                parameters: [
                    /** [4: warning mode, 2: strobe, 2: siren level] */
                    {name: "startwarninginfo", type: DataType.BITMAP8},
                    {name: "warningduration", type: DataType.UINT16},
                    {name: "strobedutycycle", type: DataType.UINT8, max: 100},
                    {name: "strobelevel", type: DataType.ENUM8},
                ],
                required: true,
            },
            squawk: {
                ID: 0x01,
                parameters: [
                    /** [4: squawk mode, 1: strobe, 1: reserved, 2: squawk level] */
                    {name: "squawkinfo", type: DataType.BITMAP8},
                ],
                required: true,
            },
        },
        commandsResponse: {},
    },
    piGenericTunnel: {
        ID: 0x0600,
        attributes: {
            maxIncomeTransSize: {ID: 0x0001, type: DataType.UINT16, required: true, max: 0xffff},
            maxOutgoTransSize: {ID: 0x0002, type: DataType.UINT16, required: true, max: 0xffff},
            protocolAddr: {ID: 0x0003, type: DataType.OCTET_STR, required: true, minLen: 0, maxLen: 255, default: "\u0000"},
        },
        commands: {
            matchProtocolAddr: {ID: 0x00, parameters: [{name: "protocoladdr", type: DataType.OCTET_STR}], required: true},
        },
        commandsResponse: {
            matchProtocolAddrRsp: {
                ID: 0x00,
                parameters: [
                    {name: "devieeeaddr", type: DataType.IEEE_ADDR},
                    {name: "protocoladdr", type: DataType.OCTET_STR},
                ],
                required: true,
            },
            advertiseProtocolAddr: {ID: 0x01, parameters: [{name: "protocoladdr", type: DataType.OCTET_STR}]},
        },
    },
    piBacnetProtocolTunnel: {
        ID: 0x0601,
        attributes: {},
        commands: {
            transferNpdu: {ID: 0x00, parameters: [{name: "npdu", type: BuffaloZclDataType.LIST_UINT8}], required: true},
        },
        commandsResponse: {},
    },
    piAnalogInputReg: {
        ID: 0x0602,
        attributes: {
            covIncrement: {ID: 0x0016, type: DataType.SINGLE_PREC, write: true, writeOptional: true},
            deviceType: {ID: 0x001f, type: DataType.CHAR_STR, default: "\u0000"},
            objectId: {ID: 0x004b, type: DataType.BAC_OID, required: true, max: 0xffffffff},
            objectName: {ID: 0x004d, type: DataType.CHAR_STR, required: true, default: "\u0000"},
            objectType: {ID: 0x004f, type: DataType.ENUM16, required: true},
            updateInterval: {ID: 0x0076, type: DataType.UINT8, write: true, writeOptional: true},
            profileName: {ID: 0x00a8, type: DataType.CHAR_STR, write: true, writeOptional: true, default: "\u0000"},
        },
        commands: {},
        commandsResponse: {},
    },
    piAnalogInputExt: {
        ID: 0x0603,
        attributes: {
            ackedTransitions: {ID: 0x0000, type: DataType.BITMAP8, required: true, write: true, writeOptional: true, default: 0},
            notificationClass: {ID: 0x0011, type: DataType.UINT16, required: true, write: true, writeOptional: true, max: 0xffff, default: 0},
            deadband: {ID: 0x0019, type: DataType.SINGLE_PREC, required: true, write: true, writeOptional: true, default: 0},
            eventEnable: {ID: 0x0023, type: DataType.BITMAP8, required: true, write: true, writeOptional: true, default: 0},
            eventState: {ID: 0x0024, type: DataType.ENUM8, default: 0},
            highLimit: {ID: 0x002d, type: DataType.SINGLE_PREC, required: true, write: true, writeOptional: true, default: 0},
            limitEnable: {ID: 0x0034, type: DataType.BITMAP8, required: true, write: true, writeOptional: true, max: 0x11, default: 0},
            lowLimit: {ID: 0x003b, type: DataType.SINGLE_PREC, required: true, write: true, writeOptional: true, default: 0},
            notifyType: {ID: 0x0048, type: DataType.ENUM8, required: true, write: true, writeOptional: true, default: 0},
            timeDelay: {ID: 0x0071, type: DataType.UINT8, required: true, write: true, writeOptional: true, default: 0},
            // length 3, each index is any of: UINT16 | TOD | struct(DATE, TOD)
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
            covIncrement: {ID: 0x0016, type: DataType.SINGLE_PREC, write: true, writeOptional: true, default: 0},
            deviceType: {ID: 0x001f, type: DataType.CHAR_STR, default: "\u0000"},
            objectId: {ID: 0x004b, type: DataType.BAC_OID, required: true, max: 0xffffffff},
            objectName: {ID: 0x004d, type: DataType.CHAR_STR, required: true, default: "\u0000"},
            objectType: {ID: 0x004f, type: DataType.ENUM16, required: true},
            profileName: {ID: 0x00a8, type: DataType.CHAR_STR, write: true, writeOptional: true, default: "\u0000"},
        },
        commands: {},
        commandsResponse: {},
    },
    piAnalogOutputExt: {
        ID: 0x0605,
        attributes: {
            ackedTransitions: {ID: 0x0000, type: DataType.BITMAP8, required: true, write: true, writeOptional: true, default: 0},
            notificationClass: {ID: 0x0011, type: DataType.UINT16, required: true, write: true, writeOptional: true, max: 0xffff, default: 0},
            deadband: {ID: 0x0019, type: DataType.SINGLE_PREC, required: true, write: true, writeOptional: true, default: 0},
            eventEnable: {ID: 0x0023, type: DataType.BITMAP8, required: true, write: true, writeOptional: true, default: 0},
            eventState: {ID: 0x0024, type: DataType.ENUM8, default: 0},
            highLimit: {ID: 0x002d, type: DataType.SINGLE_PREC, required: true, write: true, writeOptional: true, default: 0},
            limitEnable: {ID: 0x0034, type: DataType.BITMAP8, required: true, write: true, writeOptional: true, max: 0x11, default: 0},
            lowLimit: {ID: 0x003b, type: DataType.SINGLE_PREC, required: true, write: true, writeOptional: true, default: 0},
            notifyType: {ID: 0x0048, type: DataType.ENUM8, required: true, write: true, writeOptional: true, default: 0},
            timeDelay: {ID: 0x0071, type: DataType.UINT8, required: true, write: true, writeOptional: true, default: 0},
            // each index is any of: UINT16 | TOD | struct(DATE, TOD)
            eventTimeStamps: {ID: 0x0082, type: DataType.ARRAY},
        },
        commands: {},
        commandsResponse: {},
    },
    piAnalogValueReg: {
        ID: 0x0606,
        attributes: {
            covIncrement: {ID: 0x0016, type: DataType.SINGLE_PREC, write: true, writeOptional: true, default: 0},
            objectId: {ID: 0x004b, type: DataType.BAC_OID, required: true, max: 0xffffffff},
            objectName: {ID: 0x004d, type: DataType.CHAR_STR, required: true, default: "\u0000"},
            objectType: {ID: 0x004f, type: DataType.ENUM16, required: true},
            profileName: {ID: 0x00a8, type: DataType.CHAR_STR, default: "\u0000"},
        },
        commands: {},
        commandsResponse: {},
    },
    piAnalogValueExt: {
        ID: 0x0607,
        attributes: {
            ackedTransitions: {ID: 0x0000, type: DataType.BITMAP8, required: true, write: true, writeOptional: true, default: 0},
            notificationClass: {ID: 0x0011, type: DataType.UINT16, required: true, write: true, writeOptional: true, max: 0xffff, default: 0},
            deadband: {ID: 0x0019, type: DataType.SINGLE_PREC, required: true, write: true, writeOptional: true, default: 0},
            eventEnable: {ID: 0x0023, type: DataType.BITMAP8, required: true, write: true, writeOptional: true, default: 0},
            eventState: {ID: 0x0024, type: DataType.ENUM8, default: 0},
            highLimit: {ID: 0x002d, type: DataType.SINGLE_PREC, required: true, write: true, writeOptional: true, default: 0},
            limitEnable: {ID: 0x0034, type: DataType.BITMAP8, required: true, write: true, writeOptional: true, max: 0x11, default: 0},
            lowLimit: {ID: 0x003b, type: DataType.SINGLE_PREC, required: true, write: true, writeOptional: true, default: 0},
            notifyType: {ID: 0x0048, type: DataType.ENUM8, required: true, write: true, writeOptional: true, default: 0},
            timeDelay: {ID: 0x0071, type: DataType.UINT8, required: true, write: true, writeOptional: true, default: 0},
            // each index is any of: UINT16 | TOD | struct(DATE, TOD)
            eventTimeStamps: {ID: 0x0082, type: DataType.ARRAY, required: true},
        },
        commands: {},
        commandsResponse: {},
    },
    piBinaryInputReg: {
        ID: 0x0608,
        attributes: {
            changeOfStateCount: {ID: 0x000f, type: DataType.UINT32, write: true, writeOptional: true, default: 0xffffffff},
            changeOfStateTime: {ID: 0x0010, type: DataType.STRUCT /* default: (0xffffffff, 0xffffffff) */},
            deviceType: {ID: 0x001f, type: DataType.CHAR_STR, default: "\u0000"},
            elapsedActiveTime: {ID: 0x0021, type: DataType.UINT32, write: true, writeOptional: true, default: 0xffffffff},
            objectIdentifier: {ID: 0x004b, type: DataType.BAC_OID, required: true, max: 0xffffffff},
            objectName: {ID: 0x004d, type: DataType.CHAR_STR, required: true, default: "\u0000"},
            objectType: {ID: 0x004f, type: DataType.ENUM16, required: true},
            timeOfATReset: {ID: 0x0072, type: DataType.STRUCT /* default: (0xffffffff, 0xffffffff) */},
            timeOfSCReset: {ID: 0x0073, type: DataType.STRUCT /* default: (0xffffffff, 0xffffffff) */},
            profileName: {ID: 0x00a8, type: DataType.CHAR_STR, default: "\u0000"},
        },
        commands: {},
        commandsResponse: {},
    },
    piBinaryInputExt: {
        ID: 0x0609,
        attributes: {
            ackedTransitions: {ID: 0x0000, type: DataType.BITMAP8, required: true, write: true, writeOptional: true, default: 0},
            alarmValue: {ID: 0x0006, type: DataType.BOOLEAN, required: true, write: true, writeOptional: true},
            notificationClass: {ID: 0x0011, type: DataType.UINT16, required: true, write: true, writeOptional: true, default: 0},
            eventEnable: {ID: 0x0023, type: DataType.BITMAP8, required: true, write: true, writeOptional: true, default: 0},
            eventState: {ID: 0x0024, type: DataType.ENUM8},
            notifyType: {ID: 0x0048, type: DataType.ENUM8, required: true, write: true, writeOptional: true, default: 0},
            timeDelay: {ID: 0x0071, type: DataType.UINT8, required: true, write: true, writeOptional: true, default: 0},
            // each index is any of: UINT16 | TOD | struct(DATE, TOD)
            eventTimeStamps: {ID: 0x0082, type: DataType.ARRAY, required: true},
        },
        commands: {},
        commandsResponse: {},
    },
    piBinaryOutputReg: {
        ID: 0x060a,
        attributes: {
            changeOfStateCount: {ID: 0x000f, type: DataType.UINT32, write: true, writeOptional: true, default: 0xffffffff},
            changeOfStateTime: {ID: 0x0010, type: DataType.STRUCT /* default: (0xffffffff, 0xffffffff) */},
            deviceType: {ID: 0x001f, type: DataType.CHAR_STR, default: "\u0000"},
            elapsedActiveTime: {ID: 0x0021, type: DataType.UINT32, write: true, writeOptional: true, default: 0xffffffff},
            feedBackValue: {ID: 0x0028, type: DataType.ENUM8, max: 1, default: 0},
            objectIdentifier: {ID: 0x004b, type: DataType.BAC_OID, required: true, max: 0xffffffff},
            objectName: {ID: 0x004d, type: DataType.CHAR_STR, required: true, default: "\u0000"},
            objectType: {ID: 0x004f, type: DataType.ENUM16, required: true},
            timeOfATReset: {ID: 0x0072, type: DataType.STRUCT /* default: (0xffffffff, 0xffffffff) */},
            timeOfSCReset: {ID: 0x0073, type: DataType.STRUCT /* default: (0xffffffff, 0xffffffff) */},
            profileName: {ID: 0x00a8, type: DataType.CHAR_STR, default: "\u0000"},
        },
        commands: {},
        commandsResponse: {},
    },
    piBinaryOutputExt: {
        ID: 0x060b,
        attributes: {
            ackedTransitions: {ID: 0x0000, type: DataType.BITMAP8, required: true, write: true, writeOptional: true, default: 0},
            notificationClass: {ID: 0x0011, type: DataType.UINT16, required: true, write: true, writeOptional: true, default: 0},
            eventEnable: {ID: 0x0023, type: DataType.BITMAP8, required: true, write: true, writeOptional: true, default: 0},
            eventState: {ID: 0x0024, type: DataType.ENUM8, default: 0},
            notifyType: {ID: 0x0048, type: DataType.ENUM8, required: true, write: true, writeOptional: true, default: 0},
            timeDelay: {ID: 0x0071, type: DataType.UINT8, required: true, write: true, writeOptional: true, default: 0},
            // each index is any of: UINT16 | TOD | struct(DATE, TOD)
            eventTimeStamps: {ID: 0x0082, type: DataType.ARRAY},
        },
        commands: {},
        commandsResponse: {},
    },
    piBinaryValueReg: {
        ID: 0x060c,
        attributes: {
            changeOfStateCount: {ID: 0x000f, type: DataType.UINT32, write: true, writeOptional: true, default: 0xffffffff},
            changeOfStateTime: {ID: 0x0010, type: DataType.STRUCT /* default: (0xffffffff, 0xffffffff) */},
            elapsedActiveTime: {ID: 0x0021, type: DataType.UINT32, write: true, writeOptional: true, default: 0xffffffff},
            objectIdentifier: {ID: 0x004b, type: DataType.BAC_OID, required: true, max: 0xffffffff},
            objectName: {ID: 0x004d, type: DataType.CHAR_STR, required: true, default: "\u0000"},
            objectType: {ID: 0x004f, type: DataType.ENUM16, required: true},
            timeOfATReset: {ID: 0x0072, type: DataType.STRUCT /* default: (0xffffffff, 0xffffffff) */},
            timeOfSCReset: {ID: 0x0073, type: DataType.STRUCT /* default: (0xffffffff, 0xffffffff) */},
            profileName: {ID: 0x00a8, type: DataType.CHAR_STR, default: "\u0000"},
        },
        commands: {},
        commandsResponse: {},
    },
    piBinaryValueExt: {
        ID: 0x060d,
        attributes: {
            ackedTransitions: {ID: 0x0000, type: DataType.BITMAP8, required: true, write: true, writeOptional: true, default: 0},
            alarmValue: {ID: 0x0006, type: DataType.BOOLEAN, required: true, write: true, writeOptional: true},
            notificationClass: {ID: 0x0011, type: DataType.UINT16, required: true, write: true, writeOptional: true, default: 0},
            eventEnable: {ID: 0x0023, type: DataType.BITMAP8, required: true, write: true, writeOptional: true, default: 0},
            eventState: {ID: 0x0024, type: DataType.ENUM8, default: 0},
            notifyType: {ID: 0x0048, type: DataType.ENUM8, required: true, write: true, writeOptional: true, default: 0},
            timeDelay: {ID: 0x0071, type: DataType.UINT8, required: true, write: true, writeOptional: true, default: 0},
            // each index is any of: UINT16 | TOD | struct(DATE, TOD)
            eventTimeStamps: {ID: 0x0082, type: DataType.ARRAY, required: true},
        },
        commands: {},
        commandsResponse: {},
    },
    piMultistateInputReg: {
        ID: 0x060e,
        attributes: {
            deviceType: {ID: 0x001f, type: DataType.CHAR_STR, default: "\u0000"},
            objectIdentifier: {ID: 0x004b, type: DataType.BAC_OID, required: true, max: 0xffffffff},
            objectName: {ID: 0x004d, type: DataType.CHAR_STR, required: true, default: "\u0000"},
            objectType: {ID: 0x004f, type: DataType.ENUM16, required: true},
            profileName: {ID: 0x00a8, type: DataType.CHAR_STR, default: "\u0000"},
        },
        commands: {},
        commandsResponse: {},
    },
    piMultistateInputExt: {
        ID: 0x060f,
        attributes: {
            ackedTransitions: {ID: 0x0000, type: DataType.BITMAP8, required: true, write: true, writeOptional: true, default: 0},
            alarmValues: {ID: 0x0006, type: DataType.SET, required: true, write: true, writeOptional: true, max: 0xffff},
            notificationClass: {ID: 0x0011, type: DataType.UINT16, required: true, write: true, writeOptional: true, default: 0},
            eventEnable: {ID: 0x0023, type: DataType.BITMAP8, required: true, write: true, writeOptional: true, default: 0},
            eventState: {ID: 0x0024, type: DataType.ENUM8, default: 0},
            faultValues: {ID: 0x0025, type: DataType.SET, required: true, write: true, writeOptional: true, max: 0xffff, default: 0},
            notifyType: {ID: 0x0048, type: DataType.ENUM8, required: true, write: true, writeOptional: true, default: 0},
            timeDelay: {ID: 0x0071, type: DataType.UINT8, required: true, write: true, writeOptional: true, default: 0},
            // each index is any of: UINT16 | TOD | struct(DATE, TOD)
            eventTimeStamps: {ID: 0x0082, type: DataType.ARRAY, required: true},
        },
        commands: {},
        commandsResponse: {},
    },
    piMultistateOutputReg: {
        ID: 0x0610,
        attributes: {
            deviceType: {ID: 0x001f, type: DataType.CHAR_STR, default: "\u0000"},
            feedBackValue: {ID: 0x0028, type: DataType.ENUM8, write: true, writeOptional: true, max: 1},
            objectIdentifier: {ID: 0x004b, type: DataType.BAC_OID, required: true, max: 0xffffffff},
            objectName: {ID: 0x004d, type: DataType.CHAR_STR, required: true, default: "\u0000"},
            objectType: {ID: 0x004f, type: DataType.ENUM16, required: true},
            profileName: {ID: 0x00a8, type: DataType.CHAR_STR, default: "\u0000"},
        },
        commands: {},
        commandsResponse: {},
    },
    piMultistateOutputExt: {
        ID: 0x0611,
        attributes: {
            ackedTransitions: {ID: 0x0000, type: DataType.BITMAP8, required: true, write: true, writeOptional: true, default: 0},
            notificationClass: {ID: 0x0011, type: DataType.UINT16, required: true, write: true, writeOptional: true, max: 0xffff, default: 0},
            eventEnable: {ID: 0x0023, type: DataType.BITMAP8, required: true, write: true, writeOptional: true, default: 0},
            eventState: {ID: 0x0024, type: DataType.ENUM8, default: 0},
            notifyType: {ID: 0x0048, type: DataType.ENUM8, required: true, write: true, writeOptional: true, default: 0},
            timeDelay: {ID: 0x0071, type: DataType.UINT8, required: true, write: true, writeOptional: true, default: 0},
            // each index is any of: UINT16 | TOD | struct(DATE, TOD)
            eventTimeStamps: {ID: 0x0082, type: DataType.ARRAY, required: true},
        },
        commands: {},
        commandsResponse: {},
    },
    piMultistateValueReg: {
        ID: 0x0612,
        attributes: {
            objectIdentifier: {ID: 0x004b, type: DataType.BAC_OID, required: true, max: 0xffffffff},
            objectName: {ID: 0x004d, type: DataType.CHAR_STR, required: true, default: "\u0000"},
            objectType: {ID: 0x004f, type: DataType.ENUM16, required: true},
            profileName: {ID: 0x00a8, type: DataType.CHAR_STR, default: "\u0000"},
        },
        commands: {},
        commandsResponse: {},
    },
    piMultistateValueExt: {
        ID: 0x0613,
        attributes: {
            ackedTransitions: {ID: 0x0000, type: DataType.BITMAP8, required: true, write: true, writeOptional: true, default: 0},
            alarmValues: {ID: 0x0006, type: DataType.SET, required: true, write: true, writeOptional: true, max: 0xffff},
            notificationClass: {ID: 0x0011, type: DataType.UINT16, required: true, write: true, writeOptional: true, max: 0xffff, default: 0},
            eventEnable: {ID: 0x0023, type: DataType.BITMAP8, required: true, write: true, writeOptional: true, default: 0},
            eventState: {ID: 0x0024, type: DataType.ENUM8},
            faultValues: {ID: 0x0025, type: DataType.SET, required: true, write: true, writeOptional: true, max: 0xffff, default: 0},
            notifyType: {ID: 0x0048, type: DataType.ENUM8, required: true, write: true, writeOptional: true, default: 0},
            timeDelay: {ID: 0x0071, type: DataType.UINT8, required: true, write: true, writeOptional: true, default: 0},
            // each index is any of: UINT16 | TOD | struct(DATE, TOD)
            eventTimeStamps: {ID: 0x0082, type: DataType.ARRAY, required: true},
        },
        commands: {},
        commandsResponse: {},
    },
    pi11073ProtocolTunnel: {
        ID: 0x0614,
        attributes: {
            deviceidList: {ID: 0x0000, type: DataType.ARRAY, default: 0xffff},
            managerTarget: {ID: 0x0001, type: DataType.IEEE_ADDR},
            managerEndpoint: {ID: 0x0002, type: DataType.UINT8, min: 0x01, max: 0xff},
            connected: {ID: 0x0003, type: DataType.BOOLEAN},
            preemptible: {ID: 0x0004, type: DataType.BOOLEAN},
            idleTimeout: {ID: 0x0005, type: DataType.UINT16, min: 0x0001, max: 0xffff, default: 0x0000},
        },
        commands: {
            transferApdu: {ID: 0x00, parameters: [{name: "apdu", type: DataType.OCTET_STR}], required: true},
            connectRequest: {
                ID: 0x01,
                parameters: [
                    /** [7: reserved, 1: preemptible] */
                    {name: "control", type: DataType.BITMAP8},
                    {name: "idleTimeout", type: DataType.UINT16},
                    {name: "managerTarget", type: DataType.IEEE_ADDR},
                    {name: "managerEndpoint", type: DataType.UINT8},
                ],
            },
            disconnectRequest: {ID: 0x02, parameters: [{name: "managerTarget", type: DataType.IEEE_ADDR}]},
            connectStatusNotification: {ID: 0x03, parameters: [{name: "status", type: DataType.ENUM8}]},
        },
        commandsResponse: {},
    },
    piIso7818ProtocolTunnel: {
        ID: 0x0615,
        attributes: {
            status: {ID: 0x0000, type: DataType.UINT8, required: true, max: 1, default: 0},
        },
        commands: {
            transferApdu: {ID: 0x00, parameters: [{name: "apdu", type: DataType.OCTET_STR}], required: true},
            insertSmartCard: {ID: 0x01, parameters: [], required: true},
            extractSmartCard: {ID: 0x02, parameters: [], required: true},
        },
        commandsResponse: {
            transferApdu: {ID: 0x00, parameters: [{name: "apdu", type: DataType.OCTET_STR}], required: true},
        },
    },
    retailTunnel: {
        ID: 0x0617,
        attributes: {
            manufacturerCode: {ID: 0x0000, type: DataType.UINT16, required: true, min: 0x1000, max: 0x10ff},
            msProfile: {ID: 0x0001, type: DataType.UINT16, required: true, min: 0xc000, max: 0xffff},
        },
        commands: {
            transferApdu: {ID: 0x00, parameters: [{name: "apdu", type: DataType.OCTET_STR}], required: true},
        },
        commandsResponse: {},
    },
    // sePrice: {ID: 0x0700},
    // seDemandResponseAndLoadControl: {ID: 0x0701},
    seMetering: {
        ID: 0x0702,
        attributes: {
            currentSummDelivered: {ID: 0x0000, type: DataType.UINT48, required: true, max: 0xffffffffffff},
            currentSummReceived: {ID: 0x0001, type: DataType.UINT48, max: 0xffffffffffff},
            currentMaxDemandDelivered: {ID: 0x0002, type: DataType.UINT48, max: 0xffffffffffff},
            currentMaxDemandReceived: {ID: 0x0003, type: DataType.UINT48, max: 0xffffffffffff},
            dftSumm: {ID: 0x0004, type: DataType.UINT48, max: 0xffffffffffff},
            dailyFreezeTime: {ID: 0x0005, type: DataType.UINT16, max: 0x173b, default: 0},
            powerFactor: {ID: 0x0006, type: DataType.INT8, min: -100, max: 100, default: 0},
            readingSnapshotTime: {ID: 0x0007, type: DataType.UTC},
            currentMaxDemandDeliverdTime: {ID: 0x0008, type: DataType.UTC},
            currentMaxDemandReceivedTime: {ID: 0x0009, type: DataType.UTC},
            defaultUpdatePeriod: {ID: 0x000a, type: DataType.UINT8, max: 0xff, default: 0x1e},
            fastPollUpdatePeriod: {ID: 0x000b, type: DataType.UINT8, max: 0xff, default: 0x05},
            currentBlockPeriodConsumpDelivered: {ID: 0x000c, type: DataType.UINT48, max: 0xffffffffffff},
            dailyConsumpTarget: {ID: 0x000d, type: DataType.UINT24, max: 0xffffff},
            currentBlock: {ID: 0x000e, type: DataType.ENUM8, max: 0x10},
            profileIntervalPeriod: {ID: 0x000f, type: DataType.ENUM8, max: 0xff},
            presetReadingTime: {ID: 0x0011, type: DataType.UINT16, max: 0x173b, default: 0},
            volumePerReport: {ID: 0x0012, type: DataType.UINT16, max: 0xffff},
            flowRestriction: {ID: 0x0013, type: DataType.UINT8, max: 0xff},
            supplyStatus: {ID: 0x0014, type: DataType.ENUM8, max: 0xff},
            currentInEnergyCarrierSumm: {ID: 0x0015, type: DataType.UINT48, max: 0xffffffffffff},
            currentOutEnergyCarrierSumm: {ID: 0x0016, type: DataType.UINT48, max: 0xffffffffffff},
            inletTempreature: {ID: 0x0017, type: DataType.INT24, min: -8388607, max: 8388607},
            outletTempreature: {ID: 0x0018, type: DataType.INT24, min: -8388607, max: 8388607},
            controlTempreature: {ID: 0x0019, type: DataType.INT24, min: -8388607, max: 8388607},
            currentInEnergyCarrierDemand: {ID: 0x001a, type: DataType.INT24, min: -8388607, max: 8388607},
            currentOutEnergyCarrierDemand: {ID: 0x001b, type: DataType.INT24, min: -8388607, max: 8388607},
            previousBlockPeriodConsumpReceived: {ID: 0x001c, type: DataType.UINT48, max: 0xffffffffffff},
            currentBlockPeriodConsumpReceived: {ID: 0x001d, type: DataType.UINT48, max: 0xffffffffffff},
            currentBlockReceived: {ID: 0x001e, type: DataType.ENUM8, max: 0xff},
            DFTSummationReceived: {ID: 0x001f, type: DataType.UINT48, max: 0xffffffffffff},
            activeRegisterTierDelivered: {ID: 0x0020, type: DataType.ENUM8, max: 48},
            activeRegisterTierReceived: {ID: 0x0021, type: DataType.ENUM8, max: 48},
            lastBlockSwitchTime: {ID: 0x0022, type: DataType.UTC},

            currentTier1SummDelivered: {ID: 0x0100, type: DataType.UINT48, max: 0xffffffffffff},
            currentTier1SummReceived: {ID: 0x0101, type: DataType.UINT48, max: 0xffffffffffff},
            currentTier2SummDelivered: {ID: 0x0102, type: DataType.UINT48, max: 0xffffffffffff},
            currentTier2SummReceived: {ID: 0x0103, type: DataType.UINT48, max: 0xffffffffffff},
            currentTier3SummDelivered: {ID: 0x0104, type: DataType.UINT48, max: 0xffffffffffff},
            currentTier3SummReceived: {ID: 0x0105, type: DataType.UINT48, max: 0xffffffffffff},
            currentTier4SummDelivered: {ID: 0x0106, type: DataType.UINT48, max: 0xffffffffffff},
            currentTier4SummReceived: {ID: 0x0107, type: DataType.UINT48, max: 0xffffffffffff},
            currentTier5SummDelivered: {ID: 0x0108, type: DataType.UINT48, max: 0xffffffffffff},
            currentTier5SummReceived: {ID: 0x0109, type: DataType.UINT48, max: 0xffffffffffff},
            currentTier6SummDelivered: {ID: 0x010a, type: DataType.UINT48, max: 0xffffffffffff},
            currentTier6SummReceived: {ID: 0x010b, type: DataType.UINT48, max: 0xffffffffffff},
            currentTier7SummDelivered: {ID: 0x010c, type: DataType.UINT48, max: 0xffffffffffff},
            currentTier7SummReceived: {ID: 0x010d, type: DataType.UINT48, max: 0xffffffffffff},
            currentTier8SummDelivered: {ID: 0x010e, type: DataType.UINT48, max: 0xffffffffffff},
            currentTier8SummReceived: {ID: 0x010f, type: DataType.UINT48, max: 0xffffffffffff},
            currentTier9SummDelivered: {ID: 0x0110, type: DataType.UINT48, max: 0xffffffffffff},
            currentTier9SummReceived: {ID: 0x0111, type: DataType.UINT48, max: 0xffffffffffff},
            currentTier10SummDelivered: {ID: 0x0112, type: DataType.UINT48, max: 0xffffffffffff},
            currentTier10SummReceived: {ID: 0x0113, type: DataType.UINT48, max: 0xffffffffffff},
            currentTier11SummDelivered: {ID: 0x0114, type: DataType.UINT48, max: 0xffffffffffff},
            currentTier11SummReceived: {ID: 0x0115, type: DataType.UINT48, max: 0xffffffffffff},
            currentTier12SummDelivered: {ID: 0x0116, type: DataType.UINT48, max: 0xffffffffffff},
            currentTier12SummReceived: {ID: 0x0117, type: DataType.UINT48, max: 0xffffffffffff},
            currentTier13SummDelivered: {ID: 0x0118, type: DataType.UINT48, max: 0xffffffffffff},
            currentTier13SummReceived: {ID: 0x0119, type: DataType.UINT48, max: 0xffffffffffff},
            currentTier14SummDelivered: {ID: 0x011a, type: DataType.UINT48, max: 0xffffffffffff},
            currentTier14SummReceived: {ID: 0x011b, type: DataType.UINT48, max: 0xffffffffffff},
            currentTier15SummDelivered: {ID: 0x011c, type: DataType.UINT48, max: 0xffffffffffff},
            currentTier15SummReceived: {ID: 0x011d, type: DataType.UINT48, max: 0xffffffffffff},
            // XXX: continues to currentTier48
            cpp1SummationDelivered: {ID: 0x01fc, type: DataType.UINT48, max: 0xffffffffffff},
            cpp2SummationDelivered: {ID: 0x01fe, type: DataType.UINT48, max: 0xffffffffffff},

            status: {ID: 0x0200, type: DataType.BITMAP8, required: true, max: 0xff, default: 0x00},
            remainingBattLife: {ID: 0x0201, type: DataType.UINT8, max: 0xff},
            hoursInOperation: {ID: 0x0202, type: DataType.UINT24, max: 0xffffff},
            hoursInFault: {ID: 0x0203, type: DataType.UINT24, max: 0xffffff},
            extendedStatus: {ID: 0x0204, type: DataType.BITMAP64 /* max: 0xfffffffffffffff */},
            remainingBattLifeInDays: {ID: 0x0205, type: DataType.UINT16, max: 0xffff},
            currentMeterId: {ID: 0x0206, type: DataType.OCTET_STR},
            ambientConsumptionIndicator: {ID: 0x0207, type: DataType.ENUM8, max: 0x02},

            unitOfMeasure: {ID: 0x0300, type: DataType.ENUM8, required: true, max: 0xff, default: 0x00},
            multiplier: {ID: 0x0301, type: DataType.UINT24, max: 0xffffff},
            divisor: {ID: 0x0302, type: DataType.UINT24, max: 0xffffff},
            summaFormatting: {ID: 0x0303, type: DataType.BITMAP8, required: true, max: 0xff},
            demandFormatting: {ID: 0x0304, type: DataType.BITMAP8, max: 0xff},
            historicalConsumpFormatting: {ID: 0x0305, type: DataType.BITMAP8, max: 0xff},
            meteringDeviceType: {ID: 0x0306, type: DataType.BITMAP8, max: 0xff},
            siteId: {ID: 0x0307, type: DataType.OCTET_STR, minLen: 1, maxLen: 33},
            meterSerialNumber: {ID: 0x0308, type: DataType.OCTET_STR, minLen: 1, maxLen: 25},
            energyCarrierUnitOfMeas: {ID: 0x0309, type: DataType.ENUM8, max: 0xff},
            energyCarrierSummFormatting: {ID: 0x030a, type: DataType.BITMAP8, max: 0xff},
            energyCarrierDemandFormatting: {ID: 0x030b, type: DataType.BITMAP8, max: 0xff},
            temperatureUnitOfMeas: {ID: 0x030c, type: DataType.ENUM8, max: 0xff},
            temperatureFormatting: {ID: 0x030d, type: DataType.BITMAP8, max: 0xff},
            moduleSerialNumber: {ID: 0x030e, type: DataType.OCTET_STR, minLen: 1, maxLen: 25},
            operatingTariffLevelDelivered: {ID: 0x030f, type: DataType.OCTET_STR, minLen: 1, maxLen: 25},
            operatingTariffLevelReceived: {ID: 0x0310, type: DataType.OCTET_STR, minLen: 1, maxLen: 25},
            customIdNumber: {ID: 0x0311, type: DataType.OCTET_STR, minLen: 1, maxLen: 25},
            alternativeUnitOfMeasure: {ID: 0x0312, type: DataType.ENUM8, default: 0x00},
            alternativeDemandFormatting: {ID: 0x0312, type: DataType.BITMAP8, max: 0xff},
            alternativeConsumptionFormatting: {ID: 0x0312, type: DataType.BITMAP8, max: 0xff},

            instantaneousDemand: {ID: 0x0400, type: DataType.INT24, min: -8388607, max: 8388607, default: 0},
            currentDayConsumpDelivered: {ID: 0x0401, type: DataType.UINT24, max: 0xffffff},
            currentDayConsumpReceived: {ID: 0x0402, type: DataType.UINT24, max: 0xffffff},
            previousDayConsumpDelivered: {ID: 0x0403, type: DataType.UINT24, max: 0xffffff},
            previousDayConsumpReceived: {ID: 0x0404, type: DataType.UINT24, max: 0xffffff},
            curPartProfileIntStartTimeDelivered: {ID: 0x0405, type: DataType.UTC},
            curPartProfileIntStartTimeReceived: {ID: 0x0406, type: DataType.UTC},
            curPartProfileIntValueDelivered: {ID: 0x0407, type: DataType.UINT24, max: 0xffffff},
            curPartProfileIntValueReceived: {ID: 0x0408, type: DataType.UINT24, max: 0xffffff},
            currentDayMaxPressure: {ID: 0x0409, type: DataType.UINT48, max: 0xffffffffffff},
            currentDayMinPressure: {ID: 0x040a, type: DataType.UINT48, max: 0xffffffffffff},
            previousDayMaxPressure: {ID: 0x040b, type: DataType.UINT48, max: 0xffffffffffff},
            previousDayMinPressure: {ID: 0x040c, type: DataType.UINT48, max: 0xffffffffffff},
            currentDayMaxDemand: {ID: 0x040d, type: DataType.INT24, min: -8388607, max: 8388607},
            previousDayMaxDemand: {ID: 0x040e, type: DataType.INT24, min: -8388607, max: 8388607},
            currentMonthMaxDemand: {ID: 0x040f, type: DataType.INT24, min: -8388607, max: 8388607},
            currentYearMaxDemand: {ID: 0x0410, type: DataType.INT24, min: -8388607, max: 8388607},
            currentDayMaxEnergyCarrDemand: {ID: 0x0411, type: DataType.INT24, min: -8388607, max: 8388607},
            previousDayMaxEnergyCarrDemand: {ID: 0x0412, type: DataType.INT24, min: -8388607, max: 8388607},
            curMonthMaxEnergyCarrDemand: {ID: 0x0413, type: DataType.INT24, min: -8388607, max: 8388607},
            curMonthMinEnergyCarrDemand: {ID: 0x0414, type: DataType.INT24, min: -8388607, max: 8388607},
            curYearMaxEnergyCarrDemand: {ID: 0x0415, type: DataType.INT24, min: -8388607, max: 8388607},
            curYearMinEnergyCarrDemand: {ID: 0x0416, type: DataType.INT24, min: -8388607, max: 8388607},
            previousDay2ConsumptionDelivered: {ID: 0x0420, type: DataType.UINT24, max: 0xffffff},
            previousDay2ConsumptionReceived: {ID: 0x0421, type: DataType.UINT24, max: 0xffffff},
            previousDay3ConsumptionDelivered: {ID: 0x0422, type: DataType.UINT24, max: 0xffffff},
            previousDay3ConsumptionReceived: {ID: 0x0423, type: DataType.UINT24, max: 0xffffff},
            previousDay4ConsumptionDelivered: {ID: 0x0424, type: DataType.UINT24, max: 0xffffff},
            previousDay4ConsumptionReceived: {ID: 0x0425, type: DataType.UINT24, max: 0xffffff},
            previousDay5ConsumptionDelivered: {ID: 0x0426, type: DataType.UINT24, max: 0xffffff},
            previousDay5ConsumptionReceived: {ID: 0x0427, type: DataType.UINT24, max: 0xffffff},
            previousDay6ConsumptionDelivered: {ID: 0x0428, type: DataType.UINT24, max: 0xffffff},
            previousDay6ConsumptionReceived: {ID: 0x0420, type: DataType.UINT24, max: 0xffffff},
            previousDay7ConsumptionDelivered: {ID: 0x042a, type: DataType.UINT24, max: 0xffffff},
            previousDay7ConsumptionReceived: {ID: 0x042b, type: DataType.UINT24, max: 0xffffff},
            previousDay8ConsumptionDelivered: {ID: 0x042c, type: DataType.UINT24, max: 0xffffff},
            previousDay8ConsumptionReceived: {ID: 0x042d, type: DataType.UINT24, max: 0xffffff},
            currentWeekConsumptionDelivered: {ID: 0x0430, type: DataType.UINT24, max: 0xffffff},
            currentWeekConsumptionReceived: {ID: 0x0431, type: DataType.UINT24, max: 0xffffff},
            previousWeekConsumptionDelivered: {ID: 0x0432, type: DataType.UINT24, max: 0xffffff},
            previousWeekConsumptionReceived: {ID: 0x0433, type: DataType.UINT24, max: 0xffffff},
            previousWeek2ConsumptionDelivered: {ID: 0x0434, type: DataType.UINT24, max: 0xffffff},
            previousWeek2ConsumptionReceived: {ID: 0x0435, type: DataType.UINT24, max: 0xffffff},
            previousWeek3ConsumptionDelivered: {ID: 0x0436, type: DataType.UINT24, max: 0xffffff},
            previousWeek3ConsumptionReceived: {ID: 0x0437, type: DataType.UINT24, max: 0xffffff},
            previousWeek4ConsumptionDelivered: {ID: 0x0438, type: DataType.UINT24, max: 0xffffff},
            previousWeek4ConsumptionReceived: {ID: 0x0439, type: DataType.UINT24, max: 0xffffff},
            previousWeek5ConsumptionDelivered: {ID: 0x043a, type: DataType.UINT24, max: 0xffffff},
            previousWeek5ConsumptionReceived: {ID: 0x043b, type: DataType.UINT24, max: 0xffffff},
            currentMonthConsumptionDelivered: {ID: 0x0440, type: DataType.UINT32, max: 0xffffffff},
            currentMonthConsumptionReceived: {ID: 0x0441, type: DataType.UINT32, max: 0xffffffff},
            previousMonthConsumptionDelivered: {ID: 0x0442, type: DataType.UINT32, max: 0xffffffff},
            previousMonthConsumptionReceived: {ID: 0x0443, type: DataType.UINT32, max: 0xffffffff},
            previousMonth2ConsumptionDelivered: {ID: 0x0444, type: DataType.UINT32, max: 0xffffffff},
            previousMonth2ConsumptionReceived: {ID: 0x0445, type: DataType.UINT32, max: 0xffffffff},
            previousMonth3ConsumptionDelivered: {ID: 0x0446, type: DataType.UINT32, max: 0xffffffff},
            previousMonth3ConsumptionReceived: {ID: 0x0447, type: DataType.UINT32, max: 0xffffffff},
            previousMonth4ConsumptionDelivered: {ID: 0x0448, type: DataType.UINT32, max: 0xffffffff},
            previousMonth4ConsumptionReceived: {ID: 0x0449, type: DataType.UINT32, max: 0xffffffff},
            previousMonth5ConsumptionDelivered: {ID: 0x044a, type: DataType.UINT32, max: 0xffffffff},
            previousMonth5ConsumptionReceived: {ID: 0x044b, type: DataType.UINT32, max: 0xffffffff},
            previousMonth6ConsumptionDelivered: {ID: 0x044c, type: DataType.UINT32, max: 0xffffffff},
            previousMonth6ConsumptionReceived: {ID: 0x044d, type: DataType.UINT32, max: 0xffffffff},
            previousMonth7ConsumptionDelivered: {ID: 0x044e, type: DataType.UINT32, max: 0xffffffff},
            previousMonth7ConsumptionReceived: {ID: 0x044f, type: DataType.UINT32, max: 0xffffffff},
            previousMonth8ConsumptionDelivered: {ID: 0x0450, type: DataType.UINT32, max: 0xffffffff},
            previousMonth8ConsumptionReceived: {ID: 0x0451, type: DataType.UINT32, max: 0xffffffff},
            previousMonth9ConsumptionDelivered: {ID: 0x0452, type: DataType.UINT32, max: 0xffffffff},
            previousMonth9ConsumptionReceived: {ID: 0x0453, type: DataType.UINT32, max: 0xffffffff},
            previousMonth10ConsumptionDelivered: {ID: 0x0454, type: DataType.UINT32, max: 0xffffffff},
            previousMonth10ConsumptionReceived: {ID: 0x0455, type: DataType.UINT32, max: 0xffffffff},
            previousMonth11ConsumptionDelivered: {ID: 0x0456, type: DataType.UINT32, max: 0xffffffff},
            previousMonth11ConsumptionReceived: {ID: 0x0457, type: DataType.UINT32, max: 0xffffffff},
            previousMonth12ConsumptionDelivered: {ID: 0x0458, type: DataType.UINT32, max: 0xffffffff},
            previousMonth12ConsumptionReceived: {ID: 0x0459, type: DataType.UINT32, max: 0xffffffff},
            previousMonth13ConsumptionDelivered: {ID: 0x045a, type: DataType.UINT32, max: 0xffffffff},
            previousMonth13ConsumptionReceived: {ID: 0x045b, type: DataType.UINT32, max: 0xffffffff},
            historicalFreezeTime: {ID: 0x045c, type: DataType.UINT16, max: 0x173b, default: 0},

            maxNumberOfPeriodsDelivered: {ID: 0x0500, type: DataType.UINT8, max: 0xff, default: 0x18},

            currentDemandDelivered: {ID: 0x0600, type: DataType.UINT24, max: 0xffffff},
            demandLimit: {ID: 0x0601, type: DataType.UINT24, max: 0xffffff},
            demandIntegrationPeriod: {ID: 0x0602, type: DataType.UINT8, min: 0x01, max: 0xff},
            numberOfDemandSubintervals: {ID: 0x0603, type: DataType.UINT8, min: 0x01, max: 0xff},
            demandLimitArmDuration: {ID: 0x0604, type: DataType.UINT16, max: 0xffff, default: 0x003c},
            loadLimitSupplyState: {ID: 0x0605, type: DataType.ENUM8, max: 0xff, default: 0x00},
            loadLimitCounter: {ID: 0x0606, type: DataType.UINT8, max: 0xff, default: 0x01},
            supplyTamperState: {ID: 0x0607, type: DataType.ENUM8, max: 0xff, default: 0x00},
            supplyDepletionState: {ID: 0x0608, type: DataType.ENUM8, max: 0xff, default: 0x00},
            supplyUncontrolledFlowState: {ID: 0x0609, type: DataType.ENUM8, max: 0xff, default: 0x00},

            // TODO: Block Information Set (Delivered) (0x700..)

            genericAlarmMask: {ID: 0x0800, type: DataType.BITMAP16, max: 0xffff, default: 0xffff},
            electricityAlarmMask: {ID: 0x0801, type: DataType.BITMAP32, max: 0xffffffff, default: 0xffffffff},
            genFlowPressureAlarmMask: {ID: 0x0802, type: DataType.BITMAP16, max: 0xffff, default: 0xffff},
            waterSpecificAlarmMask: {ID: 0x0803, type: DataType.BITMAP16, max: 0xffff, default: 0xffff},
            heatCoolSpecificAlarmMASK: {ID: 0x0804, type: DataType.BITMAP16, max: 0xffff, default: 0xffff},
            gasSpecificAlarmMask: {ID: 0x0805, type: DataType.BITMAP16, max: 0xffff, default: 0xffff},
            extendedGenericAlarmMask: {ID: 0x0806, type: DataType.BITMAP48, max: 0xffffffffffff, default: 0xffffffffffff},
            manufactureAlarmMask: {ID: 0x0807, type: DataType.BITMAP16, max: 0xffff, default: 0xffff},

            // TODO: Block Information Attribute Set (Received) (0x900..)

            billToDateDelivered: {ID: 0x0a00, type: DataType.UINT32, max: 0xffffffff, default: 0},
            billToDateTimeStampDelivered: {ID: 0x0a01, type: DataType.UTC, default: 0},
            projectedBillDelivered: {ID: 0x0a02, type: DataType.UINT32, max: 0xffffffff, default: 0},
            projectedBillTimeStampDelivered: {ID: 0x0a03, type: DataType.UTC, default: 0},
            billDeliveredTrailingDigit: {ID: 0x0a04, type: DataType.BITMAP8},
            billToDateReceived: {ID: 0x0a10, type: DataType.UINT32, max: 0xffffffff, default: 0},
            billToDateTimeStampReceived: {ID: 0x0a11, type: DataType.UTC, default: 0},
            projectedBillReceived: {ID: 0x0a12, type: DataType.UINT32, max: 0xffffffff, default: 0},
            projectedBillTimeStampReceived: {ID: 0x0a13, type: DataType.UTC, default: 0},
            billReceivedTrailingDigit: {ID: 0x0a14, type: DataType.BITMAP8},

            // TODO: Supply Control Attribute Set (0x0b00..)
            // TODO: Alternative Historical Consumption Attribute Set (0x0c00..)
            // TODO: Noti fication At tribute Set (0x0000.., client=true)
            // custom
            develcoPulseConfiguration: {ID: 0x0300, type: DataType.UINT16, manufacturerCode: ManufacturerCode.DEVELCO, write: true, max: 0xffff},
            develcoCurrentSummation: {
                ID: 0x0301,
                type: DataType.UINT48,
                manufacturerCode: ManufacturerCode.DEVELCO,
                write: true,
                max: 0xffffffffffff,
            },
            develcoInterfaceMode: {ID: 0x0302, type: DataType.ENUM16, manufacturerCode: ManufacturerCode.DEVELCO, write: true, max: 0xffff},
            owonL1PhasePower: {
                ID: 0x2000,
                type: DataType.INT24,
                manufacturerCode: ManufacturerCode.OWON_TECHNOLOGY_INC,
                write: true,
                min: -8388608,
                max: 8388607,
            },
            owonL2PhasePower: {
                ID: 0x2001,
                type: DataType.INT24,
                manufacturerCode: ManufacturerCode.OWON_TECHNOLOGY_INC,
                write: true,
                min: -8388608,
                max: 8388607,
            },
            owonL3PhasePower: {
                ID: 0x2002,
                type: DataType.INT24,
                manufacturerCode: ManufacturerCode.OWON_TECHNOLOGY_INC,
                write: true,
                min: -8388608,
                max: 8388607,
            },
            owonL1PhaseReactivePower: {
                ID: 0x2100,
                type: DataType.INT24,
                manufacturerCode: ManufacturerCode.OWON_TECHNOLOGY_INC,
                write: true,
                min: -8388608,
                max: 8388607,
            },
            owonL2PhaseReactivePower: {
                ID: 0x2101,
                type: DataType.INT24,
                manufacturerCode: ManufacturerCode.OWON_TECHNOLOGY_INC,
                write: true,
                min: -8388608,
                max: 8388607,
            },
            owonL3PhaseReactivePower: {
                ID: 0x2102,
                type: DataType.INT24,
                manufacturerCode: ManufacturerCode.OWON_TECHNOLOGY_INC,
                write: true,
                min: -8388608,
                max: 8388607,
            },
            owonReactivePowerSum: {
                ID: 0x2103,
                type: DataType.INT24,
                manufacturerCode: ManufacturerCode.OWON_TECHNOLOGY_INC,
                write: true,
                min: -8388608,
                max: 8388607,
            },
            owonL1PhaseVoltage: {
                ID: 0x3000,
                type: DataType.UINT24,
                manufacturerCode: ManufacturerCode.OWON_TECHNOLOGY_INC,
                write: true,
                max: 0xffffff,
            },
            owonL2PhaseVoltage: {
                ID: 0x3001,
                type: DataType.UINT24,
                manufacturerCode: ManufacturerCode.OWON_TECHNOLOGY_INC,
                write: true,
                max: 0xffffff,
            },
            owonL3PhaseVoltage: {
                ID: 0x3002,
                type: DataType.UINT24,
                manufacturerCode: ManufacturerCode.OWON_TECHNOLOGY_INC,
                write: true,
                max: 0xffffff,
            },
            owonL1PhaseCurrent: {
                ID: 0x3100,
                type: DataType.UINT24,
                manufacturerCode: ManufacturerCode.OWON_TECHNOLOGY_INC,
                write: true,
                max: 0xffffff,
            },
            owonL2PhaseCurrent: {
                ID: 0x3101,
                type: DataType.UINT24,
                manufacturerCode: ManufacturerCode.OWON_TECHNOLOGY_INC,
                write: true,
                max: 0xffffff,
            },
            owonL3PhaseCurrent: {
                ID: 0x3102,
                type: DataType.UINT24,
                manufacturerCode: ManufacturerCode.OWON_TECHNOLOGY_INC,
                write: true,
                max: 0xffffff,
            },
            owonCurrentSum: {ID: 0x3103, type: DataType.UINT24, manufacturerCode: ManufacturerCode.OWON_TECHNOLOGY_INC, write: true, max: 0xffffff},
            owonLeakageCurrent: {
                ID: 0x3104,
                type: DataType.UINT24,
                manufacturerCode: ManufacturerCode.OWON_TECHNOLOGY_INC,
                write: true,
                max: 0xffffff,
            },
            owonL1Energy: {
                ID: 0x4000,
                type: DataType.UINT48,
                manufacturerCode: ManufacturerCode.OWON_TECHNOLOGY_INC,
                write: true,
                max: 0xffffffffffff,
            },
            owonL2Energy: {
                ID: 0x4001,
                type: DataType.UINT48,
                manufacturerCode: ManufacturerCode.OWON_TECHNOLOGY_INC,
                write: true,
                max: 0xffffffffffff,
            },
            owonL3Energy: {
                ID: 0x4002,
                type: DataType.UINT48,
                manufacturerCode: ManufacturerCode.OWON_TECHNOLOGY_INC,
                write: true,
                max: 0xffffffffffff,
            },
            owonL1ReactiveEnergy: {
                ID: 0x4100,
                type: DataType.UINT48,
                manufacturerCode: ManufacturerCode.OWON_TECHNOLOGY_INC,
                write: true,
                max: 0xffffffffffff,
            },
            owonL2ReactiveEnergy: {
                ID: 0x4101,
                type: DataType.UINT48,
                manufacturerCode: ManufacturerCode.OWON_TECHNOLOGY_INC,
                write: true,
                max: 0xffffffffffff,
            },
            owonL3ReactiveEnergy: {
                ID: 0x4102,
                type: DataType.UINT48,
                manufacturerCode: ManufacturerCode.OWON_TECHNOLOGY_INC,
                write: true,
                max: 0xffffffffffff,
            },
            owonReactiveEnergySum: {
                ID: 0x4103,
                type: DataType.UINT48,
                manufacturerCode: ManufacturerCode.OWON_TECHNOLOGY_INC,
                write: true,
                max: 0xffffffffffff,
            },
            owonL1PowerFactor: {
                ID: 0x4104,
                type: DataType.INT8,
                manufacturerCode: ManufacturerCode.OWON_TECHNOLOGY_INC,
                write: true,
                min: -128,
                max: 127,
            },
            owonL2PowerFactor: {
                ID: 0x4105,
                type: DataType.INT8,
                manufacturerCode: ManufacturerCode.OWON_TECHNOLOGY_INC,
                write: true,
                min: -128,
                max: 127,
            },
            owonL3PowerFactor: {
                ID: 0x4106,
                type: DataType.INT8,
                manufacturerCode: ManufacturerCode.OWON_TECHNOLOGY_INC,
                write: true,
                min: -128,
                max: 127,
            },
            owonFrequency: {ID: 0x5005, type: DataType.UINT8, manufacturerCode: ManufacturerCode.OWON_TECHNOLOGY_INC, write: true, max: 0xff},
            owonReportMap: {ID: 0x1000, type: DataType.BITMAP8, manufacturerCode: ManufacturerCode.OWON_TECHNOLOGY_INC, write: true},
            owonLastHistoricalRecordTime: {
                ID: 0x5000,
                type: DataType.UINT32,
                manufacturerCode: ManufacturerCode.OWON_TECHNOLOGY_INC,
                write: true,
                max: 0xffffffff,
            },
            owonOldestHistoricalRecordTime: {
                ID: 0x5001,
                type: DataType.UINT32,
                manufacturerCode: ManufacturerCode.OWON_TECHNOLOGY_INC,
                write: true,
                max: 0xffffffff,
            },
            owonMinimumReportCycle: {
                ID: 0x5002,
                type: DataType.UINT32,
                manufacturerCode: ManufacturerCode.OWON_TECHNOLOGY_INC,
                write: true,
                max: 0xffffffff,
            },
            owonMaximumReportCycle: {
                ID: 0x5003,
                type: DataType.UINT32,
                manufacturerCode: ManufacturerCode.OWON_TECHNOLOGY_INC,
                write: true,
                max: 0xffffffff,
            },
            owonSentHistoricalRecordState: {
                ID: 0x5004,
                type: DataType.UINT8,
                manufacturerCode: ManufacturerCode.OWON_TECHNOLOGY_INC,
                write: true,
                max: 0xff,
            },
            owonAccumulativeEnergyThreshold: {
                ID: 0x5006,
                type: DataType.UINT8,
                manufacturerCode: ManufacturerCode.OWON_TECHNOLOGY_INC,
                write: true,
                max: 0xff,
            },
            owonReportMode: {ID: 0x5007, type: DataType.UINT8, manufacturerCode: ManufacturerCode.OWON_TECHNOLOGY_INC, write: true, max: 0xff},
            owonPercentChangeInPower: {
                ID: 0x5008,
                type: DataType.UINT8,
                manufacturerCode: ManufacturerCode.OWON_TECHNOLOGY_INC,
                write: true,
                max: 0xff,
            },
            schneiderActiveEnergyTotal: {
                ID: 0x4010,
                type: DataType.INT48,
                manufacturerCode: ManufacturerCode.SCHNEIDER_ELECTRIC,
                write: true,
                min: -140737488355328,
                max: 140737488355327,
            },
            schneiderReactiveEnergyTotal: {
                ID: 0x4011,
                type: DataType.INT48,
                manufacturerCode: ManufacturerCode.SCHNEIDER_ELECTRIC,
                write: true,
                min: -140737488355328,
                max: 140737488355327,
            },
            schneiderApparentEnergyTotal: {
                ID: 0x4012,
                type: DataType.INT48,
                manufacturerCode: ManufacturerCode.SCHNEIDER_ELECTRIC,
                write: true,
                min: -140737488355328,
                max: 140737488355327,
            },
            schneiderPartialActiveEnergyTotal: {
                ID: 0x4014,
                type: DataType.INT48,
                manufacturerCode: ManufacturerCode.SCHNEIDER_ELECTRIC,
                write: true,
                min: -140737488355328,
                max: 140737488355327,
            },
            schneiderPartialReactiveEnergyTotal: {
                ID: 0x4015,
                type: DataType.INT48,
                manufacturerCode: ManufacturerCode.SCHNEIDER_ELECTRIC,
                write: true,
                min: -140737488355328,
                max: 140737488355327,
            },
            schneiderPartialApparentEnergyTotal: {
                ID: 0x4016,
                type: DataType.INT48,
                manufacturerCode: ManufacturerCode.SCHNEIDER_ELECTRIC,
                write: true,
                min: -140737488355328,
                max: 140737488355327,
            },
            schneiderPartialActiveEnergyL1Phase: {
                ID: 0x4100,
                type: DataType.INT48,
                manufacturerCode: ManufacturerCode.SCHNEIDER_ELECTRIC,
                write: true,
                min: -140737488355328,
                max: 140737488355327,
            },
            schneiderPartialReactiveEnergyL1Phase: {
                ID: 0x4101,
                type: DataType.INT48,
                manufacturerCode: ManufacturerCode.SCHNEIDER_ELECTRIC,
                write: true,
                min: -140737488355328,
                max: 140737488355327,
            },
            schneiderPartialApparentEnergyL1Phase: {
                ID: 0x4102,
                type: DataType.INT48,
                manufacturerCode: ManufacturerCode.SCHNEIDER_ELECTRIC,
                write: true,
                min: -140737488355328,
                max: 140737488355327,
            },
            schneiderActiveEnergyL1Phase: {
                ID: 0x4103,
                type: DataType.INT48,
                manufacturerCode: ManufacturerCode.SCHNEIDER_ELECTRIC,
                write: true,
                min: -140737488355328,
                max: 140737488355327,
            },
            schneiderReactiveEnergyL1Phase: {
                ID: 0x4104,
                type: DataType.INT48,
                manufacturerCode: ManufacturerCode.SCHNEIDER_ELECTRIC,
                write: true,
                min: -140737488355328,
                max: 140737488355327,
            },
            schneiderApparentEnergyL1Phase: {
                ID: 0x4105,
                type: DataType.INT48,
                manufacturerCode: ManufacturerCode.SCHNEIDER_ELECTRIC,
                write: true,
                min: -140737488355328,
                max: 140737488355327,
            },
            schneiderPartialActiveEnergyL2Phase: {
                ID: 0x4200,
                type: DataType.INT48,
                manufacturerCode: ManufacturerCode.SCHNEIDER_ELECTRIC,
                write: true,
                min: -140737488355328,
                max: 140737488355327,
            },
            schneiderPartialReactiveEnergyL2Phase: {
                ID: 0x4201,
                type: DataType.INT48,
                manufacturerCode: ManufacturerCode.SCHNEIDER_ELECTRIC,
                write: true,
                min: -140737488355328,
                max: 140737488355327,
            },
            schneiderPartialApparentEnergyL2Phase: {
                ID: 0x4202,
                type: DataType.INT48,
                manufacturerCode: ManufacturerCode.SCHNEIDER_ELECTRIC,
                write: true,
                min: -140737488355328,
                max: 140737488355327,
            },
            schneiderActiveEnergyL2Phase: {
                ID: 0x4203,
                type: DataType.INT48,
                manufacturerCode: ManufacturerCode.SCHNEIDER_ELECTRIC,
                write: true,
                min: -140737488355328,
                max: 140737488355327,
            },
            schneiderReactiveEnergyL2Phase: {
                ID: 0x4204,
                type: DataType.INT48,
                manufacturerCode: ManufacturerCode.SCHNEIDER_ELECTRIC,
                write: true,
                min: -140737488355328,
                max: 140737488355327,
            },
            schneiderApparentEnergyL2Phase: {
                ID: 0x4205,
                type: DataType.INT48,
                manufacturerCode: ManufacturerCode.SCHNEIDER_ELECTRIC,
                write: true,
                min: -140737488355328,
                max: 140737488355327,
            },
            schneiderPartialActiveEnergyL3Phase: {
                ID: 0x4300,
                type: DataType.INT48,
                manufacturerCode: ManufacturerCode.SCHNEIDER_ELECTRIC,
                write: true,
                min: -140737488355328,
                max: 140737488355327,
            },
            schneiderPartialReactiveEnergyL3Phase: {
                ID: 0x4301,
                type: DataType.INT48,
                manufacturerCode: ManufacturerCode.SCHNEIDER_ELECTRIC,
                write: true,
                min: -140737488355328,
                max: 140737488355327,
            },
            schneiderPartialApparentEnergyL3Phase: {
                ID: 0x4302,
                type: DataType.INT48,
                manufacturerCode: ManufacturerCode.SCHNEIDER_ELECTRIC,
                write: true,
                min: -140737488355328,
                max: 140737488355327,
            },
            schneiderActiveEnergyL3Phase: {
                ID: 0x4303,
                type: DataType.INT48,
                manufacturerCode: ManufacturerCode.SCHNEIDER_ELECTRIC,
                write: true,
                min: -140737488355328,
                max: 140737488355327,
            },
            schneiderReactiveEnergyL3Phase: {
                ID: 0x4304,
                type: DataType.INT48,
                manufacturerCode: ManufacturerCode.SCHNEIDER_ELECTRIC,
                write: true,
                min: -140737488355328,
                max: 140737488355327,
            },
            schneiderApparentEnergyL3Phase: {
                ID: 0x4305,
                type: DataType.INT48,
                manufacturerCode: ManufacturerCode.SCHNEIDER_ELECTRIC,
                write: true,
                min: -140737488355328,
                max: 140737488355327,
            },
            schneiderActiveEnergyMultiplier: {
                ID: 0x4400,
                type: DataType.UINT24,
                manufacturerCode: ManufacturerCode.SCHNEIDER_ELECTRIC,
                write: true,
                max: 0xffffff,
            },
            schneiderActiveEnergyDivisor: {
                ID: 0x4401,
                type: DataType.UINT24,
                manufacturerCode: ManufacturerCode.SCHNEIDER_ELECTRIC,
                write: true,
                max: 0xffffff,
            },
            schneiderReactiveEnergyMultiplier: {
                ID: 0x4402,
                type: DataType.UINT24,
                manufacturerCode: ManufacturerCode.SCHNEIDER_ELECTRIC,
                write: true,
                max: 0xffffff,
            },
            schneiderReactiveEnergyDivisor: {
                ID: 0x4403,
                type: DataType.UINT24,
                manufacturerCode: ManufacturerCode.SCHNEIDER_ELECTRIC,
                write: true,
                max: 0xffffff,
            },
            schneiderApparentEnergyMultiplier: {
                ID: 0x4404,
                type: DataType.UINT24,
                manufacturerCode: ManufacturerCode.SCHNEIDER_ELECTRIC,
                write: true,
                max: 0xffffff,
            },
            schneiderApparentEnergyDivisor: {
                ID: 0x4405,
                type: DataType.UINT24,
                manufacturerCode: ManufacturerCode.SCHNEIDER_ELECTRIC,
                write: true,
                max: 0xffffff,
            },
            schneiderEnergyResetDateTime: {
                ID: 0x4501,
                type: DataType.UTC,
                manufacturerCode: ManufacturerCode.SCHNEIDER_ELECTRIC,
                write: true,
                max: 0xffffffff,
            },
            schneiderEnergyCountersReportingPeriod: {
                ID: 0x4600,
                type: DataType.UINT16,
                manufacturerCode: ManufacturerCode.SCHNEIDER_ELECTRIC,
                write: true,
                max: 0xffff,
            },
        },
        commands: {
            getProfile: {
                ID: 0x00,
                parameters: [
                    {name: "intervalChannel", type: DataType.ENUM8},
                    {name: "endTime", type: DataType.UTC},
                    {name: "numberOfPeriods", type: DataType.UINT8},
                ],
                response: 0x00,
            },
            requestMirrorRsp: {ID: 0x01, parameters: [{name: "endpointId", type: DataType.UINT16}], response: 0x01},
            mirrorRemoved: {ID: 0x02, parameters: [{name: "removedEndpointId", type: DataType.UINT16}], response: 0x02},
            requestFastPollMode: {
                ID: 0x03,
                parameters: [
                    {name: "fastPollUpdatePeriod", type: DataType.UINT8},
                    {name: "duration", type: DataType.UINT8},
                ],
                response: 0x03,
            },
            schneduleSnapshot: {
                ID: 0x04,
                parameters: [
                    {name: "issuerEventId", type: DataType.UINT32},
                    {name: "commandIndex", type: DataType.UINT8},
                    {name: "totalNumberOfCommands", type: DataType.UINT8},
                    // TODO: need BuffaloZcl read/write
                    // {name: "payload", type: DataType.LIST_SCHEDULE_SNAPSHOT},
                    //   {name: "id", type: DataType.UINT8, min: 1, max: 254},
                    //   {name: "startTime", type: DataType.UTC},
                    //   {name: "schedule", type: DataType.UINT24},
                    //   {name: "payloadType", type: DataType.ENUM8},
                    //   {name: "cause", type: DataType.BITMAP32},
                ],
                response: 0x04,
            },
            takeSnapshot: {ID: 0x05, parameters: [{name: "cause", type: DataType.BITMAP32}], response: 0x05},
            getSnapshot: {
                ID: 0x06,
                parameters: [
                    {name: "earliestStartTime", type: DataType.UTC},
                    {name: "latestEndTime", type: DataType.UTC},
                    {name: "offset", type: DataType.UINT8},
                    {name: "cause", type: DataType.BITMAP32},
                ],
            },
            startSampling: {
                ID: 0x07,
                parameters: [
                    {name: "issuerEventId", type: DataType.UINT32},
                    {name: "startTime", type: DataType.UTC},
                    {name: "type", type: DataType.ENUM8},
                    {name: "requestInterval", type: DataType.UINT16},
                    {name: "maxNumberOfSamples", type: DataType.UINT16},
                ],
                response: 0x0d,
            },
            getSampledData: {
                ID: 0x08,
                parameters: [
                    {name: "sampleId", type: DataType.UINT16},
                    {name: "earliestSampleTime", type: DataType.UTC},
                    {name: "type", type: DataType.ENUM8},
                    {name: "numberOfSamples", type: DataType.UINT16},
                ],
                response: 0x07,
            },
            mirrorReportAttributeRsp: {
                ID: 0x09,
                parameters: [
                    {name: "notificationScheme", type: DataType.UINT8},
                    {name: "notificationFlags", type: DataType.BITMAP32},
                ],
            },
            resetLoadLimitCounter: {
                ID: 0x0a,
                parameters: [
                    {name: "providerId", type: DataType.UINT32},
                    {name: "issuerEventId", type: DataType.UINT32},
                ],
            },
            changeSupply: {
                ID: 0x0b,
                parameters: [
                    {name: "providerId", type: DataType.UINT32},
                    {name: "issuerEventId", type: DataType.UINT32},
                    {name: "requestDateTime", type: DataType.UTC},
                    {name: "implDateTime", type: DataType.UTC},
                    {name: "proposedSupplyStatusAfterImpl", type: DataType.ENUM8},
                    {name: "SupplyControlBits", type: DataType.BITMAP8},
                ],
            },
            localChangeSupply: {ID: 0x0c, parameters: [{name: "proposedSupplyStatus", type: DataType.ENUM8}]},
            setSupplyStatus: {
                ID: 0x0d,
                parameters: [
                    {name: "issuerEventId", type: DataType.UINT32},
                    {name: "tamperState", type: DataType.ENUM8},
                    {name: "depletionState", type: DataType.ENUM8},
                    {name: "uncontrolledFlowState", type: DataType.ENUM8},
                    {name: "loadLimitSupplyState", type: DataType.ENUM8},
                ],
            },
            setUncontrolledFlowThreshold: {
                ID: 0x0e,
                parameters: [
                    {name: "providerId", type: DataType.UINT32},
                    {name: "issuerEventId", type: DataType.UINT32},
                    {name: "uncontrolledFlowThreshold", type: DataType.UINT16},
                    {name: "unitOfMeasure", type: DataType.ENUM8},
                    {name: "multiplier", type: DataType.UINT16},
                    {name: "divisor", type: DataType.UINT16},
                    {name: "stabilisationPeriod", type: DataType.UINT8},
                    {name: "measurementPeriod", type: DataType.UINT16},
                ],
            },
            // custom
            owonGetHistoryRecord: {ID: 0x20, parameters: []},
            owonStopSendingHistoricalRecord: {ID: 0x21, parameters: []},
        },
        commandsResponse: {
            getProfileRsp: {
                ID: 0x00,
                parameters: [
                    {name: "endTime", type: DataType.UTC},
                    {name: "status", type: DataType.ENUM8},
                    {name: "profileIntervalPeriod", type: DataType.ENUM8},
                    {name: "numberOfPeriodsDelivered", type: DataType.UINT8},
                    {name: "intervals", type: BuffaloZclDataType.LIST_UINT24},
                ],
            },
            requestMirror: {ID: 0x01, parameters: []},
            removeMirror: {ID: 0x02, parameters: []},
            requestFastPollModeRsp: {
                ID: 0x03,
                parameters: [
                    {name: "appliedUpdatePeriod", type: DataType.UINT8},
                    {name: "fastPollModeEndTime", type: DataType.UTC},
                ],
            },
            scheduleSnapshotRsp: {
                ID: 0x04,
                parameters: [
                    {name: "issuerEventId", type: DataType.UINT32},
                    // TODO: need BuffaloZcl read/write
                    // {name: "fastPollModeEndTime", type: DataType.LIST_SCHEDULE_SNAPSHOT_RSP},
                    //   {name: "id", type: DataType.UINT8, min: 1, max: 254},
                    //   {name: "confirmation", type: DataType.UINT8},
                ],
            },
            takeSnapshotRsp: {
                ID: 0x05,
                parameters: [
                    {name: "id", type: DataType.UINT32},
                    {name: "confirmation", type: DataType.UINT8},
                ],
            },
            publishSnapshot: {
                ID: 0x06,
                parameters: [
                    {name: "id", type: DataType.UINT32},
                    {name: "time", type: DataType.UTC},
                    {name: "totalSnapshotsFound", type: DataType.UINT8},
                    {name: "commandIndex", type: DataType.UINT8},
                    {name: "totalNumberOfCommands", type: DataType.UINT8},
                    {name: "cause", type: DataType.BITMAP32},
                    {name: "payloadType", type: DataType.ENUM8},
                    // TODO: need BuffaloZcl read/write (complex)
                    // {name: "subPayload", type: DataType.LIST_SNAPSHOT_SUBPAYLOAD},
                ],
            },
            getSampledDataRsp: {
                ID: 0x07,
                parameters: [
                    {name: "id", type: DataType.UINT16},
                    {name: "startTime", type: DataType.UTC},
                    {name: "type", type: DataType.ENUM8},
                    {name: "requestInterval", type: DataType.UINT16},
                    {name: "numberOfSamples", type: DataType.UINT16},
                    {name: "samples", type: BuffaloZclDataType.LIST_UINT24},
                ],
            },
            configureMirror: {
                ID: 0x08,
                parameters: [
                    {name: "issuerEventId", type: DataType.UINT32},
                    {name: "reportingInterval", type: DataType.UINT24},
                    {name: "mirrorNotificationReporting", type: DataType.BOOLEAN},
                    {name: "notificationScheme", type: DataType.UINT8},
                ],
            },
            configureNotificationScheme: {
                ID: 0x09,
                parameters: [
                    {name: "issuerEventId", type: DataType.UINT32},
                    {name: "notificationScheme", type: DataType.UINT8},
                    {name: "notificationFlagOrder", type: DataType.BITMAP32},
                ],
            },
            configureNotificationFlag: {
                ID: 0x0a,
                parameters: [
                    {name: "issuerEventId", type: DataType.UINT32},
                    {name: "notificationScheme", type: DataType.UINT8},
                    {name: "notificationFlagAttributeId", type: DataType.UINT16},
                    {name: "clusterId", type: DataType.CLUSTER_ID},
                    {name: "manufacturerCode", type: DataType.UINT16},
                    {name: "numberOfCommands", type: DataType.UINT8},
                    {name: "commandIds", type: BuffaloZclDataType.LIST_UINT8},
                ],
            },
            getNotifiedMessage: {
                ID: 0x0b,
                parameters: [
                    {name: "notificationScheme", type: DataType.UINT8},
                    {name: "notificationFlagAttributeId", type: DataType.UINT16},
                    {name: "notificationFlags", type: DataType.BITMAP32},
                ],
            },
            supplyStatusRsp: {
                ID: 0x0c,
                parameters: [
                    {name: "providerId", type: DataType.UINT32},
                    {name: "issuerEventId", type: DataType.UINT32},
                    {name: "implDateTime", type: DataType.UTC},
                    {name: "supplyStatusAfterImpl", type: DataType.ENUM8},
                ],
            },
            startSamplingRsp: {ID: 0x0d, parameters: [{name: "sampleId", type: DataType.UINT16}]},
            // custom
            owonGetHistoryRecordRsp: {ID: 0x20, parameters: []},
        },
    },
    // seMessaging: {ID: 0x0703},
    seTunneling: {
        ID: 0x0704,
        attributes: {
            closeTunnelTimeout: {ID: 0x0000, type: DataType.UINT16, required: true, min: 1, default: 0xffff},
        },
        commands: {
            requestTunnel: {
                ID: 0x00,
                response: 0x00,
                parameters: [
                    {name: "protocolId", type: DataType.ENUM8, min: 0x01, max: 0xff},
                    {name: "manufacturerCode", type: DataType.UINT16, max: 0xffff},
                    {name: "flowControl", type: DataType.BOOLEAN},
                    {name: "maxIncomingTransferSize", type: DataType.UINT16, max: 0xffff},
                ],
                required: true,
            },
            closeTunnel: {ID: 0x01, parameters: [{name: "tunnelId", type: DataType.UINT16, max: 0xffff}], required: true},
            transferData: {
                ID: 0x02,
                parameters: [
                    {name: "tunnelId", type: DataType.UINT16, max: 0xffff},
                    {name: "data", type: BuffaloZclDataType.BUFFER},
                ],
                required: true,
            },
            transferDataError: {
                ID: 0x03,
                parameters: [
                    {name: "tunnelId", type: DataType.UINT16, max: 0xffff},
                    {name: "status", type: DataType.UINT8},
                ],
                required: true,
            },
            ackTransferData: {
                ID: 0x04,
                parameters: [
                    {name: "tunnelId", type: DataType.UINT16, max: 0xffff},
                    {name: "numberOfBytesLeft", type: DataType.UINT16},
                ],
            },
            readyData: {
                ID: 0x05,
                parameters: [
                    {name: "tunnelId", type: DataType.UINT16, max: 0xffff},
                    {name: "numberOfOctetsLeft", type: DataType.UINT16},
                ],
            },
            getSupportedTunnelProtocols: {ID: 0x06, parameters: [{name: "protocolOffset", type: DataType.UINT8}]},
        },
        commandsResponse: {
            requestTunnelRsp: {
                ID: 0x00,
                parameters: [
                    {name: "tunnelId", type: DataType.UINT16, max: 0xffff},
                    {name: "status", type: DataType.UINT8},
                    {name: "maxIncomingTransferSize", type: DataType.UINT16},
                ],
                required: true,
            },
            transferData: {
                ID: 0x01,
                parameters: [
                    {name: "tunnelId", type: DataType.UINT16, max: 0xffff},
                    {name: "data", type: BuffaloZclDataType.BUFFER},
                ],
                required: true,
            },
            transferDataError: {
                ID: 0x02,
                parameters: [
                    {name: "tunnelId", type: DataType.UINT16, max: 0xffff},
                    {name: "status", type: DataType.UINT8},
                ],
                required: true,
            },
            ackTransferData: {
                ID: 0x03,
                parameters: [
                    {name: "tunnelId", type: DataType.UINT16, max: 0xffff},
                    {name: "numberOfBytesLeft", type: DataType.UINT16},
                ],
            },
            readyData: {
                ID: 0x04,
                parameters: [
                    {name: "tunnelId", type: DataType.UINT16, max: 0xffff},
                    {name: "numberOfOctetsLeft", type: DataType.UINT16},
                ],
            },
            supportedProtocolsRsp: {
                ID: 0x05,
                parameters: [
                    {name: "listComplete", type: DataType.BOOLEAN},
                    {name: "count", type: DataType.UINT8},
                    // TODO: need BuffaloZcl read/write
                    // {name: "protocols", type: BuffaloZclDataType.LIST_PROTOCOLS},
                    //   {name: "manufacturerCode", type: DataType.UINT16},
                    //   {name: "protocolId", type: DataType.ENUM8},
                ],
            },
            closureNotification: {ID: 0x06, parameters: [{name: "tunnelId", type: DataType.UINT16}]},
        },
    },
    // sePrepayment: {ID: 0x0705},
    // seCalendar: {ID: 0x0707},
    // seDeviceManagement: {ID: 0x0708},
    // seEvents: {ID: 0x0709},
    // seSubGhz: {ID: 0x070b},
    // seKeyEstablishment: {ID: 0x0800},
    telecommunicationsInformation: {
        ID: 0x0900,
        attributes: {
            nodeDescription: {ID: 0x0000, type: DataType.CHAR_STR, required: true},
            deliveryEnable: {ID: 0x0001, type: DataType.BOOLEAN, required: true},
            pushInformationTimer: {ID: 0x0002, type: DataType.UINT32},
            enableSecureConfiguration: {ID: 0x0003, type: DataType.BOOLEAN, required: true},

            numberOfContents: {ID: 0x0010, type: DataType.UINT16, max: 0xffff},
            contentRootID: {ID: 0x0011, type: DataType.UINT16, max: 0xffff},
        },
        commands: {
            // TODO: most of these require custom BuffaloZcl read/write
            requestInfo: {ID: 0x00, parameters: [], response: 0x00, required: true},
            pushInfoResponse: {ID: 0x01, parameters: [], required: true},
            sendPreference: {ID: 0x02, parameters: [], response: 0x02},
            requestPreferenceRsp: {ID: 0x03, parameters: []},
            update: {ID: 0x04, parameters: [], response: 0x05},
            delete: {ID: 0x05, parameters: [], response: 0x06},
            configureNodeDescription: {ID: 0x06, parameters: []},
            configureDeliveryEnable: {ID: 0x07, parameters: []},
            configurePushInfoTimer: {ID: 0x08, parameters: []},
            configureSetRootId: {ID: 0x09, parameters: []},
        },
        commandsResponse: {
            // TODO: most of these require custom BuffaloZcl read/write
            requestInfoRsp: {ID: 0x00, parameters: [], required: true},
            pushInfo: {ID: 0x01, parameters: [], required: true},
            sendPreferenceRsp: {ID: 0x02, parameters: [], required: true},
            serverRequestPreference: {ID: 0x03, parameters: [], required: true},
            requestPreferenceConfirmation: {ID: 0x04, parameters: [], required: true},
            updateRsp: {ID: 0x05, parameters: [], required: true},
            deleteRsp: {ID: 0x06, parameters: [], required: true},
        },
    },
    telecommunicationsVoiceOverZigbee: {
        ID: 0x0904,
        attributes: {
            codecType: {ID: 0x0000, type: DataType.ENUM8, required: true, write: true},
            samplingFrequency: {ID: 0x0001, type: DataType.ENUM8, required: true, write: true},
            codecrate: {ID: 0x0002, type: DataType.ENUM8, required: true, write: true},
            establishmentTimeout: {ID: 0x0003, type: DataType.UINT8, required: true, min: 0x01, max: 0xff},
            codecTypeSub1: {ID: 0x0004, type: DataType.ENUM8, write: true},
            codecTypeSub2: {ID: 0x0005, type: DataType.ENUM8, write: true},
            codecTypeSub3: {ID: 0x0006, type: DataType.ENUM8, write: true},
            compressionType: {ID: 0x0007, type: DataType.ENUM8},
            compressionRate: {ID: 0x0008, type: DataType.ENUM8},
            optionFlags: {ID: 0x0009, type: DataType.BITMAP8, write: true, max: 0xff},
            threshold: {ID: 0x000a, type: DataType.UINT8, write: true, max: 0xff},
        },
        commands: {
            establishmentRequest: {
                ID: 0x00,
                parameters: [
                    /** [3: reserved, 1: compression, 1: codecTypeS3, 1: codecTypeS2, 1: codecTypeS1] */
                    {name: "flag", type: DataType.BITMAP8},
                    {name: "codecType", type: DataType.ENUM8},
                    {name: "sampFreq", type: DataType.ENUM8},
                    {name: "codecRate", type: DataType.ENUM8},
                    {name: "serviceType", type: DataType.ENUM8},
                    {name: "codecTypeS1", type: DataType.ENUM8, conditions: [{type: ParameterCondition.BITMASK_SET, param: "flag", mask: 0b0001}]},
                    {name: "codecTypeS2", type: DataType.ENUM8, conditions: [{type: ParameterCondition.BITMASK_SET, param: "flag", mask: 0b0010}]},
                    {name: "codecTypeS3", type: DataType.ENUM8, conditions: [{type: ParameterCondition.BITMASK_SET, param: "flag", mask: 0b0100}]},
                    {name: "compType", type: DataType.ENUM8, conditions: [{type: ParameterCondition.BITMASK_SET, param: "flag", mask: 0b1000}]},
                    {name: "compRate", type: DataType.ENUM8, conditions: [{type: ParameterCondition.BITMASK_SET, param: "flag", mask: 0b1000}]},
                ],
                response: 0x00,
                required: true,
            },
            voiceTransmission: {ID: 0x00, parameters: [{name: "voiceData", type: DataType.UNKNOWN}], required: true},
            voiceTransmissionCompletion: {ID: 0x00, parameters: [{name: "zclHeader", type: DataType.UNKNOWN}]},
            controlResponse: {ID: 0x00, parameters: [{name: "status", type: DataType.ENUM8}]},
        },
        commandsResponse: {
            establishmentRsp: {
                ID: 0x00,
                parameters: [
                    {name: "status", type: DataType.ENUM8},
                    {name: "codecType", type: DataType.ENUM8},
                ],
                required: true,
            },
            voiceTransmissionRsp: {
                ID: 0x01,
                parameters: [
                    {name: "zclHeaderSeqNum", type: DataType.UINT8},
                    {name: "errorFlag", type: DataType.ENUM8},
                ],
                required: true,
            },
            control: {ID: 0x02, parameters: [{name: "controlType", type: DataType.ENUM8}]},
        },
    },
    telecommunicationsChatting: {
        ID: 0x0905,
        attributes: {
            uID: {ID: 0x0000, type: DataType.UINT16, required: true, max: 0xffff},
            nickname: {ID: 0x0001, type: DataType.CHAR_STR, required: true},

            cID: {ID: 0x0010, type: DataType.UINT16, required: true, max: 0xffff},
            name: {ID: 0x0011, type: DataType.CHAR_STR, required: true},
            enableAddChat: {ID: 0x0012, type: DataType.BOOLEAN},
        },
        commands: {
            joinChatReq: {
                ID: 0x00,
                parameters: [
                    {name: "uID", type: DataType.UINT16},
                    {name: "nickname", type: DataType.CHAR_STR},
                    {name: "cID", type: DataType.UINT16},
                ],
                response: 0x01,
                required: true,
            },
            leaveChatReq: {
                ID: 0x01,
                parameters: [
                    {name: "cID", type: DataType.UINT16},
                    {name: "uID", type: DataType.UINT16},
                ],
                required: true,
            },
            searchChatReq: {ID: 0x02, parameters: [], response: 0x04, required: true},
            switchCharmanRsp: {
                ID: 0x03,
                parameters: [
                    {name: "cID", type: DataType.UINT16},
                    {name: "uID", type: DataType.UINT16},
                ],
            },
            startChatReq: {
                ID: 0x04,
                parameters: [
                    {name: "name", type: DataType.CHAR_STR},
                    {name: "uID", type: DataType.UINT16},
                    {name: "nickname", type: DataType.CHAR_STR},
                ],
                response: 0x00,
            },
            chatMessage: {
                ID: 0x05,
                parameters: [
                    {name: "destUID", type: DataType.UINT16},
                    {name: "srcUID", type: DataType.UINT16},
                    {name: "cID", type: DataType.UINT16},
                    {name: "nickname", type: DataType.CHAR_STR},
                    {name: "message", type: DataType.CHAR_STR},
                ],
                required: true,
            },
            getNodeInfoReq: {
                ID: 0x06,
                parameters: [
                    {name: "cID", type: DataType.UINT16},
                    {name: "uID", type: DataType.UINT16},
                ],
                response: 0x08,
            },
        },
        commandsResponse: {
            startChatRsp: {
                ID: 0x00,
                parameters: [
                    {name: "status", type: DataType.ENUM8},
                    {name: "cID", type: DataType.UINT16},
                ],
                required: true,
            },
            joinChatRsp: {
                ID: 0x01,
                parameters: [
                    {name: "status", type: DataType.ENUM8},
                    {name: "cID", type: DataType.UINT16},
                    // TODO: need BuffaloZcl read/write
                    // {
                    //     name: "users",
                    //     type: BuffaloZclDataType.LIST_CHAT_NODES,
                    //     conditions: [{type: ParameterCondition.FIELD_EQUAL, field: "status", value: Status.SUCCESS}],
                    // },
                    //   {name: "uId", type: DataType.UINT16},
                    //   {name: "nickname", type: DataType.CHAR_STR},
                ],
                required: true,
            },
            userLeft: {
                ID: 0x02,
                parameters: [
                    {name: "cID", type: DataType.UINT16},
                    {name: "uID", type: DataType.UINT16},
                    {name: "nickName", type: DataType.CHAR_STR},
                ],
                required: true,
            },
            userJoined: {
                ID: 0x03,
                parameters: [
                    {name: "cID", type: DataType.UINT16},
                    {name: "uID", type: DataType.UINT16},
                    {name: "nickName", type: DataType.CHAR_STR},
                ],
                required: true,
            },
            searchChatRsp: {
                ID: 0x04,
                parameters: [
                    {name: "options", type: DataType.BITMAP8},
                    // TODO: need BuffaloZcl read/write
                    // {name: "chats", type: BuffaloZclDataType.LIST_CHATS },
                    //   {name: "cID", type: DataType.UINT16},
                    //   {name: "name", type: DataType.CHAR_STR},
                ],
                required: true,
            },
            switchChairmanReq: {ID: 0x05, parameters: [{name: "cID", type: DataType.UINT16}], required: true},
            switchChairmanConfirm: {
                ID: 0x06,
                parameters: [
                    {name: "cID", type: DataType.UINT16},
                    // TODO: need BuffaloZcl read/write
                    // {name: "nodeInfo", type: BuffaloZclDataType.LIST_CHAT_NODE_INFO},
                    //   {name: "uID", type: DataType.UINT16},
                    //   {name: "address", type: DataType.DATA16},
                    //   {name: "endpoint", type: DataType.UINT8},
                    //   {name: "nickName", type: DataType.CHAR_STR},
                ],
                required: true,
            },
            switchChairmanNotification: {
                ID: 0x07,
                parameters: [
                    {name: "cID", type: DataType.UINT16},
                    {name: "uID", type: DataType.UINT16},
                    {name: "address", type: DataType.DATA16},
                    {name: "endpoint", type: DataType.UINT8},
                ],
                required: true,
            },
            getNodeInfoRsp: {
                ID: 0x08,
                parameters: [
                    {name: "status", type: DataType.ENUM8},
                    {name: "cID", type: DataType.UINT16},
                    {name: "uID", type: DataType.UINT16},
                    {name: "address", type: DataType.DATA16},
                    {name: "endpoint", type: DataType.UINT8},
                    {name: "nickName", type: DataType.CHAR_STR},
                ],
                required: true,
            },
        },
    },
    haApplianceIdentification: {
        ID: 0x0b00,
        attributes: {
            basicIdentification: {ID: 0x0000, type: DataType.UINT56, required: true},

            companyName: {ID: 0x0010, type: DataType.CHAR_STR, maxLen: 16},
            companyId: {ID: 0x0011, type: DataType.UINT16, max: 0xffff},
            brandName: {ID: 0x0012, type: DataType.CHAR_STR, maxLen: 16},
            brandId: {ID: 0x0013, type: DataType.UINT16, max: 0xffff},
            model: {ID: 0x0014, type: DataType.OCTET_STR, maxLen: 16},
            partNumber: {ID: 0x0015, type: DataType.OCTET_STR, maxLen: 16},
            productRevision: {ID: 0x0016, type: DataType.OCTET_STR, maxLen: 6},
            softwareRevision: {ID: 0x0017, type: DataType.OCTET_STR, maxLen: 6},
            productTypeName: {ID: 0x0018, type: DataType.OCTET_STR, length: 2},
            productTypeId: {ID: 0x0019, type: DataType.UINT16, max: 0xffff},
            cecedSpecificationVersion: {ID: 0x001a, type: DataType.UINT8, max: 0xff},
        },
        commands: {},
        commandsResponse: {},
    },
    seMeterIdentification: {
        ID: 0x0b01,
        attributes: {
            companyName: {ID: 0x0000, type: DataType.CHAR_STR, required: true, minLen: 0, maxLen: 16},
            meterTypeId: {ID: 0x0001, type: DataType.UINT16, required: true, max: 0xffff},
            dataQualityId: {ID: 0x0004, type: DataType.UINT16, required: true, max: 0xffff},
            customerName: {ID: 0x0005, type: DataType.CHAR_STR, write: true, minLen: 0, maxLen: 16},
            model: {ID: 0x0006, type: DataType.OCTET_STR, minLen: 0, maxLen: 16},
            partNumber: {ID: 0x0007, type: DataType.OCTET_STR, minLen: 0, maxLen: 16},
            productRevision: {ID: 0x0008, type: DataType.OCTET_STR, minLen: 0, maxLen: 6},
            softwareRevision: {ID: 0x000a, type: DataType.OCTET_STR, minLen: 0, maxLen: 6},
            utilityName: {ID: 0x000b, type: DataType.CHAR_STR, minLen: 0, maxLen: 16},
            pod: {ID: 0x000c, type: DataType.CHAR_STR, required: true, minLen: 0, maxLen: 16},
            availablePower: {ID: 0x000d, type: DataType.INT24, required: true, max: 0xffffff},
            powerThreshold: {ID: 0x000e, type: DataType.INT24, required: true, max: 0xffffff},
        },
        commands: {},
        commandsResponse: {},
    },
    haApplianceEventsAlerts: {
        ID: 0x0b02,
        attributes: {},
        commands: {
            getAlerts: {ID: 0x00, parameters: [], required: true},
        },
        commandsResponse: {
            getAlertsRsp: {
                ID: 0x00,
                parameters: [
                    {name: "alertscount", type: DataType.UINT8},
                    {name: "aalert", type: BuffaloZclDataType.LIST_UINT24},
                ],
                required: true,
            },
            alertsNotification: {
                ID: 0x01,
                parameters: [
                    {name: "alertscount", type: DataType.UINT8},
                    {name: "aalert", type: BuffaloZclDataType.LIST_UINT24},
                ],
                required: true,
            },
            eventNotification: {
                ID: 0x02,
                parameters: [
                    {name: "eventheader", type: DataType.UINT8},
                    {name: "eventid", type: DataType.UINT8, max: 0xff},
                ],
                required: true,
            },
        },
    },
    haApplianceStatistics: {
        ID: 0x0b03,
        attributes: {
            logMaxSize: {ID: 0x0000, type: DataType.UINT32, required: true, default: 0x0000003c},
            logQueueMaxSize: {ID: 0x0001, type: DataType.UINT8, required: true, default: 0x01},
        },
        commands: {
            log: {ID: 0x00, parameters: [{name: "logid", type: DataType.UINT32}], required: true},
            logQueue: {ID: 0x01, parameters: [], required: true},
        },
        commandsResponse: {
            logNotification: {
                ID: 0x00,
                parameters: [
                    {name: "timestamp", type: DataType.UTC},
                    {name: "logid", type: DataType.UINT32},
                    {name: "loglength", type: DataType.UINT32},
                    // TODO: LIST_DATA8
                    {name: "logpayload", type: BuffaloZclDataType.LIST_UINT8},
                ],
                required: true,
            },
            logRsp: {
                ID: 0x01,
                parameters: [
                    {name: "timestamp", type: DataType.UTC},
                    {name: "logid", type: DataType.UINT32},
                    {name: "loglength", type: DataType.UINT32},
                    // TODO: LIST_DATA8
                    {name: "logpayload", type: BuffaloZclDataType.LIST_UINT8},
                ],
                required: true,
            },
            logQueueRsp: {
                ID: 0x02,
                parameters: [
                    {name: "logqueuesize", type: DataType.UINT8},
                    {name: "logid", type: BuffaloZclDataType.LIST_UINT32},
                ],
                required: true,
            },
            statisticsAvailable: {
                ID: 0x03,
                parameters: [
                    {name: "logqueuesize", type: DataType.UINT8},
                    {name: "logid", type: BuffaloZclDataType.LIST_UINT32},
                ],
                required: true,
            },
        },
    },
    haElectricalMeasurement: {
        ID: 0x0b04,
        attributes: {
            measurementType: {ID: 0x0000, type: DataType.BITMAP32, required: true, max: 0xffffffff, default: 0},

            dcVoltage: {ID: 0x0100, type: DataType.INT16, report: true, min: -32767},
            dcVoltageMin: {ID: 0x0101, type: DataType.INT16, min: -32767},
            dcvoltagemax: {ID: 0x0102, type: DataType.INT16, min: -32767},
            dcCurrent: {ID: 0x0103, type: DataType.INT16, report: true, min: -32767},
            dcCurrentMin: {ID: 0x0104, type: DataType.INT16, min: -32767},
            dcCurrentMax: {ID: 0x0105, type: DataType.INT16, min: -32767},
            dcPower: {ID: 0x0106, type: DataType.INT16, report: true, min: -32767},
            dcPowerMin: {ID: 0x0107, type: DataType.INT16, min: -32767},
            dcPowerMax: {ID: 0x0108, type: DataType.INT16, min: -32767},

            dcVoltageMultiplier: {ID: 0x0200, type: DataType.UINT16, report: true, min: 1, max: 0xffff, default: 1},
            dcVoltageDivisor: {ID: 0x0201, type: DataType.UINT16, report: true, min: 1, max: 0xffff, default: 1},
            dcCurrentMultiplier: {ID: 0x0202, type: DataType.UINT16, report: true, min: 1, max: 0xffff, default: 1},
            dcCurrentDivisor: {ID: 0x0203, type: DataType.UINT16, report: true, min: 1, max: 0xffff, default: 1},
            dcPowerMultiplier: {ID: 0x0204, type: DataType.UINT16, report: true, min: 1, max: 0xffff, default: 1},
            dcPowerDivisor: {ID: 0x0205, type: DataType.UINT16, report: true, min: 1, max: 0xffff, default: 1},

            acFrequency: {ID: 0x0300, type: DataType.UINT16, report: true},
            acFrequencyMin: {ID: 0x0301, type: DataType.UINT16},
            acFrequencyMax: {ID: 0x0302, type: DataType.UINT16},
            neutralCurrent: {ID: 0x0303, type: DataType.UINT16, report: true},
            totalActivePower: {ID: 0x0304, type: DataType.INT32, report: true, min: -8388607, max: 8388607},
            totalReactivePower: {ID: 0x0305, type: DataType.INT32, report: true, min: -8388607, max: 8388607},
            totalApparentPower: {ID: 0x0306, type: DataType.UINT32, report: true, max: 0xffffff},
            meas1stHarmonicCurrent: {ID: 0x0307, type: DataType.INT16, report: true},
            meas3rdHarmonicCurrent: {ID: 0x0308, type: DataType.INT16, report: true},
            meas5thHarmonicCurrent: {ID: 0x0309, type: DataType.INT16, report: true},
            meas7thHarmonicCurrent: {ID: 0x030a, type: DataType.INT16, report: true},
            meas9thHarmonicCurrent: {ID: 0x030b, type: DataType.INT16, report: true},
            meas11thHarmonicCurrent: {ID: 0x030c, type: DataType.INT16, report: true},
            measPhase1stHarmonicCurrent: {ID: 0x030d, type: DataType.INT16, report: true},
            measPhase3rdHarmonicCurrent: {ID: 0x030e, type: DataType.INT16, report: true},
            measPhase5thHarmonicCurrent: {ID: 0x030f, type: DataType.INT16, report: true},
            measPhase7thHarmonicCurrent: {ID: 0x0310, type: DataType.INT16, report: true},
            measPhase9thHarmonicCurrent: {ID: 0x0311, type: DataType.INT16, report: true},
            measPhase11thHarmonicCurrent: {ID: 0x0312, type: DataType.INT16, report: true},

            acFrequencyMultiplier: {ID: 0x0400, type: DataType.UINT16, report: true, min: 1, default: 1},
            acFrequencyDivisor: {ID: 0x0401, type: DataType.UINT16, report: true, min: 1, default: 1},
            powerMultiplier: {ID: 0x0402, type: DataType.UINT32, report: true, max: 0xffffff, default: 1},
            powerDivisor: {ID: 0x0403, type: DataType.UINT32, report: true, max: 0xffffff, default: 1},
            harmonicCurrentMultiplier: {ID: 0x0404, type: DataType.INT8, report: true, min: -127, default: 0},
            phaseHarmonicCurrentMultiplier: {ID: 0x0405, type: DataType.INT8, report: true, min: -127, default: 0},

            // XXX: does not exist?
            instantaneousVoltage: {ID: 0x0500, type: DataType.INT16},
            instantaneousLineCurrent: {ID: 0x0501, type: DataType.UINT16, report: true},
            instantaneousActiveCurrent: {ID: 0x0502, type: DataType.INT16, report: true},
            instantaneousReactiveCurrent: {ID: 0x0503, type: DataType.INT16, report: true},
            // XXX: does not exist?
            instantaneousPower: {ID: 0x0504, type: DataType.INT16},
            rmsVoltage: {ID: 0x0505, type: DataType.UINT16, report: true},
            rmsVoltageMin: {ID: 0x0506, type: DataType.UINT16},
            rmsVoltageMax: {ID: 0x0507, type: DataType.UINT16},
            rmsCurrent: {ID: 0x0508, type: DataType.UINT16, report: true},
            rmsCurrentMin: {ID: 0x0509, type: DataType.UINT16},
            rmsCurrentMax: {ID: 0x050a, type: DataType.UINT16},
            activePower: {ID: 0x050b, type: DataType.INT16, report: true},
            activePowerMin: {ID: 0x050c, type: DataType.INT16},
            activePowerMax: {ID: 0x050d, type: DataType.INT16},
            reactivePower: {ID: 0x050e, type: DataType.INT16, report: true},
            apparentPower: {ID: 0x050f, type: DataType.UINT16, report: true},
            powerFactor: {ID: 0x0510, type: DataType.INT8, min: -100, max: 100, default: 0},
            averageRmsVoltageMeasPeriod: {ID: 0x0511, type: DataType.UINT16, write: true, default: 0},
            averageRmsOverVoltageCounter: {ID: 0x0512, type: DataType.UINT16, write: true, default: 0},
            averageRmsUnderVoltageCounter: {ID: 0x0513, type: DataType.UINT16, write: true, default: 0},
            rmsExtremeOverVoltagePeriod: {ID: 0x0514, type: DataType.UINT16, write: true, default: 0},
            rmsExtremeUnderVoltagePeriod: {ID: 0x0515, type: DataType.UINT16, write: true, default: 0},
            rmsVoltageSagPeriod: {ID: 0x0516, type: DataType.UINT16, write: true, default: 0},
            rmsVoltageSwellPeriod: {ID: 0x0517, type: DataType.UINT16, write: true, default: 0},
            acVoltageMultiplier: {ID: 0x0600, type: DataType.UINT16, report: true, min: 1, default: 1},
            acVoltageDivisor: {ID: 0x0601, type: DataType.UINT16, report: true, min: 1, default: 1},
            acCurrentMultiplier: {ID: 0x0602, type: DataType.UINT16, report: true, min: 1, default: 1},
            acCurrentDivisor: {ID: 0x0603, type: DataType.UINT16, report: true, min: 1, default: 1},
            acPowerMultiplier: {ID: 0x0604, type: DataType.UINT16, report: true, min: 1, default: 1},
            acPowerDivisor: {ID: 0x0605, type: DataType.UINT16, report: true, min: 1, default: 1},

            dcOverloadAlarmsMask: {ID: 0x0700, type: DataType.BITMAP8, write: true, default: 0},
            dcVoltageOverload: {ID: 0x0701, type: DataType.INT16},
            dcCurrentOverload: {ID: 0x0702, type: DataType.INT16},

            acAlarmsMask: {ID: 0x0800, type: DataType.BITMAP16, write: true, default: 0},
            acVoltageOverload: {ID: 0x0801, type: DataType.INT16},
            acCurrentOverload: {ID: 0x0802, type: DataType.INT16},
            acActivePowerOverload: {ID: 0x0803, type: DataType.INT16},
            acReactivePowerOverload: {ID: 0x0804, type: DataType.INT16},
            averageRmsOverVoltage: {ID: 0x0805, type: DataType.INT16},
            averageRmsUnderVoltage: {ID: 0x0806, type: DataType.INT16},
            rmsExtremeOverVoltage: {ID: 0x0807, type: DataType.INT16, write: true},
            rmsExtremeUnderVoltage: {ID: 0x0808, type: DataType.INT16, write: true},
            rmsVoltageSag: {ID: 0x0809, type: DataType.INT16, write: true},
            rmsVoltageSwell: {ID: 0x080a, type: DataType.INT16, write: true},

            lineCurrentPhB: {ID: 0x0901, type: DataType.UINT16, report: true},
            activeCurrentPhB: {ID: 0x0902, type: DataType.INT16, report: true},
            reactiveCurrentPhB: {ID: 0x0903, type: DataType.INT16, report: true},
            rmsVoltagePhB: {ID: 0x0905, type: DataType.UINT16, report: true},
            rmsVoltageMinPhB: {ID: 0x0906, type: DataType.UINT16, default: 32768},
            rmsVoltageMaxPhB: {ID: 0x0907, type: DataType.UINT16, default: 32768},
            rmsCurrentPhB: {ID: 0x0908, type: DataType.UINT16, report: true},
            rmsCurrentMinPhB: {ID: 0x0909, type: DataType.UINT16},
            rmsCurrentMaxPhB: {ID: 0x090a, type: DataType.UINT16},
            activePowerPhB: {ID: 0x090b, type: DataType.INT16, report: true},
            activePowerMinPhB: {ID: 0x090c, type: DataType.INT16},
            activePowerMaxPhB: {ID: 0x090d, type: DataType.INT16},
            reactivePowerPhB: {ID: 0x090e, type: DataType.INT16, report: true},
            apparentPowerPhB: {ID: 0x090f, type: DataType.UINT16, report: true},
            powerFactorPhB: {ID: 0x0910, type: DataType.INT8, min: -100, max: 100, default: 0},
            averageRmsVoltageMeasurePeriodPhB: {ID: 0x0911, type: DataType.UINT16, write: true, default: 0},
            averageRmsOverVoltageCounterPhB: {ID: 0x0912, type: DataType.UINT16, write: true, default: 0},
            averageUnderVoltageCounterPhB: {ID: 0x0913, type: DataType.UINT16, write: true, default: 0},
            rmsExtremeOverVoltagePeriodPhB: {ID: 0x0914, type: DataType.UINT16, write: true, default: 0},
            rmsExtremeUnderVoltagePeriodPhB: {ID: 0x0915, type: DataType.UINT16, write: true, default: 0},
            rmsVoltageSagPeriodPhB: {ID: 0x0916, type: DataType.UINT16, write: true, default: 0},
            rmsVoltageSwellPeriodPhB: {ID: 0x0917, type: DataType.UINT16, write: true, default: 0},

            lineCurrentPhC: {ID: 0x0a01, type: DataType.UINT16, report: true},
            activeCurrentPhC: {ID: 0x0a02, type: DataType.INT16, report: true},
            reactiveCurrentPhC: {ID: 0x0a03, type: DataType.INT16, report: true},
            rmsVoltagePhC: {ID: 0x0a05, type: DataType.UINT16, report: true},
            rmsVoltageMinPhC: {ID: 0x0a06, type: DataType.UINT16, default: 32768},
            rmsVoltageMaxPhC: {ID: 0x0a07, type: DataType.UINT16, default: 32768},
            rmsCurrentPhC: {ID: 0x0a08, type: DataType.UINT16, report: true},
            rmsCurrentMinPhC: {ID: 0x0a09, type: DataType.UINT16},
            rmsCurrentMaxPhC: {ID: 0x0a0a, type: DataType.UINT16},
            activePowerPhC: {ID: 0x0a0b, type: DataType.INT16, report: true},
            activePowerMinPhC: {ID: 0x0a0c, type: DataType.INT16},
            activePowerMaxPhC: {ID: 0x0a0d, type: DataType.INT16},
            reactivePowerPhC: {ID: 0x0a0e, type: DataType.INT16, report: true},
            apparentPowerPhC: {ID: 0x0a0f, type: DataType.UINT16, report: true},
            powerFactorPhC: {ID: 0x0a10, type: DataType.INT8, min: -100, max: 100, default: 0},
            averageRmsVoltageMeasPeriodPhC: {ID: 0x0a11, type: DataType.UINT16, write: true, default: 0},
            averageRmsOverVoltageCounterPhC: {ID: 0x0a12, type: DataType.UINT16, write: true, default: 0},
            averageUnderVoltageCounterPhC: {ID: 0x0a13, type: DataType.UINT16, write: true, default: 0},
            rmsExtremeOverVoltagePeriodPhC: {ID: 0x0a14, type: DataType.UINT16, write: true, default: 0},
            rmsExtremeUnderVoltagePeriodPhC: {ID: 0x0a15, type: DataType.UINT16, write: true, default: 0},
            rmsVoltageSagPeriodPhC: {ID: 0x0a16, type: DataType.UINT16, write: true, default: 0},
            rmsVoltageSwellPeriodPhC: {ID: 0x0a17, type: DataType.UINT16, write: true, default: 0},
            // custom
            schneiderActivePowerDemandTotal: {
                ID: 0x4300,
                type: DataType.INT32,
                manufacturerCode: ManufacturerCode.SCHNEIDER_ELECTRIC,
                write: true,
                min: -2147483648,
                max: 2147483647,
            },
            schneiderReactivePowerDemandTotal: {
                ID: 0x4303,
                type: DataType.INT32,
                manufacturerCode: ManufacturerCode.SCHNEIDER_ELECTRIC,
                write: true,
                min: -2147483648,
                max: 2147483647,
            },
            schneiderApparentPowerDemandTotal: {
                ID: 0x4318,
                type: DataType.INT32,
                manufacturerCode: ManufacturerCode.SCHNEIDER_ELECTRIC,
                write: true,
                min: -2147483648,
                max: 2147483647,
            },
            schneiderDemandIntervalDuration: {
                ID: 0x4319,
                type: DataType.UINT24,
                manufacturerCode: ManufacturerCode.SCHNEIDER_ELECTRIC,
                write: true,
                max: 0xffffff,
            },
            schneiderDemandDateTime: {
                ID: 0x4320,
                type: DataType.UTC,
                manufacturerCode: ManufacturerCode.SCHNEIDER_ELECTRIC,
                write: true,
                max: 0xffffffff,
            },
            schneiderActivePowerDemandPhase1: {
                ID: 0x4509,
                type: DataType.INT32,
                manufacturerCode: ManufacturerCode.SCHNEIDER_ELECTRIC,
                write: true,
                min: -2147483648,
                max: 2147483647,
            },
            schneiderReactivePowerDemandPhase1: {
                ID: 0x450a,
                type: DataType.INT32,
                manufacturerCode: ManufacturerCode.SCHNEIDER_ELECTRIC,
                write: true,
                min: -2147483648,
                max: 2147483647,
            },
            schneiderApparentPowerDemandPhase1: {
                ID: 0x450b,
                type: DataType.INT32,
                manufacturerCode: ManufacturerCode.SCHNEIDER_ELECTRIC,
                write: true,
                min: -2147483648,
                max: 2147483647,
            },
            schneiderDemandIntervalMinimalVoltageL1: {
                ID: 0x4510,
                type: DataType.UINT16,
                manufacturerCode: ManufacturerCode.SCHNEIDER_ELECTRIC,
                write: true,
                max: 0xffff,
            },
            schneiderDemandIntervalMaximalCurrentI1: {
                ID: 0x4513,
                type: DataType.UINT16,
                manufacturerCode: ManufacturerCode.SCHNEIDER_ELECTRIC,
                write: true,
                max: 0xffff,
            },
            schneiderActivePowerDemandPhase2: {
                ID: 0x4909,
                type: DataType.INT32,
                manufacturerCode: ManufacturerCode.SCHNEIDER_ELECTRIC,
                write: true,
                min: -2147483648,
                max: 2147483647,
            },
            schneiderReactivePowerDemandPhase2: {
                ID: 0x490a,
                type: DataType.INT32,
                manufacturerCode: ManufacturerCode.SCHNEIDER_ELECTRIC,
                write: true,
                min: -2147483648,
                max: 2147483647,
            },
            schneiderApparentPowerDemandPhase2: {
                ID: 0x490b,
                type: DataType.INT32,
                manufacturerCode: ManufacturerCode.SCHNEIDER_ELECTRIC,
                write: true,
                min: -2147483648,
                max: 2147483647,
            },
            schneiderDemandIntervalMinimalVoltageL2: {
                ID: 0x4910,
                type: DataType.UINT16,
                manufacturerCode: ManufacturerCode.SCHNEIDER_ELECTRIC,
                write: true,
                max: 0xffff,
            },
            schneiderDemandIntervalMaximalCurrentI2: {
                ID: 0x4913,
                type: DataType.UINT16,
                manufacturerCode: ManufacturerCode.SCHNEIDER_ELECTRIC,
                write: true,
                max: 0xffff,
            },
            schneiderActivePowerDemandPhase3: {
                ID: 0x4a09,
                type: DataType.INT32,
                manufacturerCode: ManufacturerCode.SCHNEIDER_ELECTRIC,
                write: true,
                min: -2147483648,
                max: 2147483647,
            },
            schneiderReactivePowerDemandPhase3: {
                ID: 0x4a0a,
                type: DataType.INT32,
                manufacturerCode: ManufacturerCode.SCHNEIDER_ELECTRIC,
                write: true,
                min: -2147483648,
                max: 2147483647,
            },
            schneiderApparentPowerDemandPhase3: {
                ID: 0x4a0b,
                type: DataType.INT32,
                manufacturerCode: ManufacturerCode.SCHNEIDER_ELECTRIC,
                write: true,
                min: -2147483648,
                max: 2147483647,
            },
            schneiderDemandIntervalMinimalVoltageL3: {
                ID: 0x4a10,
                type: DataType.UINT16,
                manufacturerCode: ManufacturerCode.SCHNEIDER_ELECTRIC,
                write: true,
                max: 0xffff,
            },
            schneiderDemandIntervalMaximalCurrentI3: {
                ID: 0x4a13,
                type: DataType.UINT16,
                manufacturerCode: ManufacturerCode.SCHNEIDER_ELECTRIC,
                write: true,
                max: 0xffff,
            },
            schneiderCurrentSensorMultiplier: {
                ID: 0x4e00,
                type: DataType.UINT8,
                manufacturerCode: ManufacturerCode.SCHNEIDER_ELECTRIC,
                write: true,
                max: 0xff,
            },
        },
        commands: {
            getProfileInfo: {ID: 0x00, parameters: []},
            getMeasurementProfile: {
                ID: 0x01,
                parameters: [
                    {name: "attrId", type: DataType.ATTR_ID},
                    {name: "starttime", type: DataType.UTC},
                    {name: "numofuntervals", type: DataType.UINT8},
                ],
            },
        },
        commandsResponse: {
            getProfileInfoRsp: {
                ID: 0x00,
                parameters: [
                    {name: "profilecount", type: DataType.UINT8},
                    {name: "profileintervalperiod", type: DataType.ENUM8},
                    {name: "maxnumofintervals", type: DataType.UINT8},
                    // TODO invalid, no `numofattrs` present?
                    {name: "numofattrs", type: DataType.UINT8},
                    {name: "listofattr", type: BuffaloZclDataType.LIST_UINT16},
                ],
            },
            getMeasurementProfileRsp: {
                ID: 0x01,
                parameters: [
                    {name: "starttime", type: DataType.UTC},
                    {name: "status", type: DataType.ENUM8},
                    {name: "profileintervalperiod", type: DataType.ENUM8},
                    {name: "numofintervalsdeliv", type: DataType.UINT8},
                    {name: "attrId", type: DataType.ATTR_ID},
                    // content depends on the type of information requested using the `attrId` field in the `getMeasurementProfile` command
                    // invalid intervals should be marked as 0xffff
                    {name: "intervals", type: BuffaloZclDataType.BUFFER},
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
            danfossSystemStatusCode: {ID: 0x4000, type: DataType.BITMAP16, manufacturerCode: ManufacturerCode.DANFOSS_A_S, write: true},
            schneiderCommunicationQuality: {
                ID: 0x4000,
                type: DataType.UINT8,
                manufacturerCode: ManufacturerCode.SCHNEIDER_ELECTRIC,
                write: true,
                max: 0xff,
            },
            danfossHeatSupplyRequest: {ID: 0x4031, type: DataType.ENUM8, manufacturerCode: ManufacturerCode.DANFOSS_A_S, write: true, max: 0xff},
            danfossSystemStatusWater: {ID: 0x4200, type: DataType.ENUM8, manufacturerCode: ManufacturerCode.DANFOSS_A_S, write: true, max: 0xff},
            danfossMultimasterRole: {ID: 0x4201, type: DataType.ENUM8, manufacturerCode: ManufacturerCode.DANFOSS_A_S, write: true, max: 0xff},
            danfossIconApplication: {ID: 0x4210, type: DataType.ENUM8, manufacturerCode: ManufacturerCode.DANFOSS_A_S, write: true, max: 0xff},
            danfossIconForcedHeatingCooling: {
                ID: 0x4220,
                type: DataType.ENUM8,
                manufacturerCode: ManufacturerCode.DANFOSS_A_S,
                write: true,
                max: 0xff,
            },
            schneiderMeterStatus: {
                ID: 0xff01,
                type: DataType.UINT32,
                manufacturerCode: ManufacturerCode.SCHNEIDER_ELECTRIC,
                write: true,
                max: 0xffffffff,
            },
            schneiderDiagnosticRegister1: {
                ID: 0xff02,
                type: DataType.UINT32,
                manufacturerCode: ManufacturerCode.SCHNEIDER_ELECTRIC,
                write: true,
                max: 0xffffffff,
            },
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
                    {name: "transactionID", type: DataType.UINT32, min: 1},
                    {name: "zigbeeInformation", type: DataType.BITMAP8},
                    {name: "touchlinkInformation", type: DataType.BITMAP8},
                ],
                required: true,
            },
            deviceInformation: {
                ID: 0x02,
                response: 0x03,
                parameters: [
                    {name: "transactionID", type: DataType.UINT32, min: 1},
                    {name: "startIndex", type: DataType.UINT8},
                ],
                required: true,
            },
            identifyRequest: {
                ID: 0x06,
                parameters: [
                    {name: "transactionID", type: DataType.UINT32, min: 1},
                    {
                        name: "duration",
                        type: DataType.UINT16,
                        max: 0xffff,
                        special: [
                            ["ExitIdentifyMode", "0000"],
                            ["IdentifyForReceiverKnownTime", "ffff"],
                        ],
                    },
                ],
                required: true,
            },
            resetToFactoryNew: {ID: 0x07, parameters: [{name: "transactionID", type: DataType.UINT32, min: 1}], required: true},
            networkStart: {
                ID: 0x10,
                response: 0x11,
                parameters: [
                    {name: "transactionID", type: DataType.UINT32, min: 1},
                    {name: "extendedPANID", type: DataType.IEEE_ADDR},
                    {name: "keyIndex", type: DataType.UINT8, max: 0x0f},
                    {name: "encryptedNetworkKey", type: DataType.SEC_KEY},
                    {name: "logicalChannel", type: DataType.UINT8},
                    {name: "panID", type: DataType.UINT16, max: 0xfffe},
                    {name: "nwkAddr", type: DataType.UINT16, min: 0x0001, max: 0xfff7},
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
                    {name: "transactionID", type: DataType.UINT32, min: 1},
                    {name: "extendedPANID", type: DataType.IEEE_ADDR},
                    {name: "keyIndex", type: DataType.UINT8, max: 0x0f},
                    {name: "encryptedNetworkKey", type: DataType.SEC_KEY},
                    {name: "networkUpdateID", type: DataType.UINT8},
                    {name: "logicalChannel", type: DataType.UINT8},
                    {name: "panID", type: DataType.UINT16, min: 0x0001, max: 0xfffe},
                    {name: "nwkAddr", type: DataType.UINT16, min: 0x0001, max: 0xfff7},
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
                    {name: "transactionID", type: DataType.UINT32, min: 1},
                    {name: "extendedPANID", type: DataType.IEEE_ADDR},
                    {name: "keyIndex", type: DataType.UINT8, max: 0x0f},
                    {name: "encryptedNetworkKey", type: DataType.SEC_KEY},
                    {name: "networkUpdateID", type: DataType.UINT8},
                    {name: "logicalChannel", type: DataType.UINT8},
                    {name: "panID", type: DataType.UINT16, min: 0x0001, max: 0xfffe},
                    {name: "nwkAddr", type: DataType.UINT16, min: 0x0001, max: 0xfff7},
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
                    {name: "transactionID", type: DataType.UINT32, min: 1},
                    {name: "extendedPANID", type: DataType.IEEE_ADDR},
                    {name: "networkUpdateID", type: DataType.UINT8},
                    {name: "logicalChannel", type: DataType.UINT8},
                    {name: "panID", type: DataType.UINT16, min: 0x0001, max: 0xfffe},
                    {name: "nwkAddr", type: DataType.UINT16, min: 0x0001, max: 0xfff7},
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
                    {name: "transactionID", type: DataType.UINT32, min: 1},
                    {name: "rssiCorrection", type: DataType.UINT8, min: 0, max: 20},
                    {name: "zigbeeInformation", type: DataType.BITMAP8},
                    {name: "touchlinkInformation", type: DataType.BITMAP8},
                    {name: "keyBitmask", type: DataType.BITMAP16},
                    {name: "responseID", type: DataType.UINT32},
                    {name: "extendedPanID", type: DataType.IEEE_ADDR},
                    {name: "networkUpdateID", type: DataType.UINT8},
                    {name: "logicalChannel", type: DataType.UINT8},
                    {name: "panID", type: DataType.UINT16},
                    {name: "networkAddress", type: DataType.UINT16, min: 0x0001, max: 0xfff7},
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
                    {name: "transactionID", type: DataType.UINT32, min: 1},
                    {name: "numberOfSubDevices", type: DataType.UINT8},
                    {name: "startIndex", type: DataType.UINT8},
                    {name: "deviceInfoCount", type: DataType.UINT8, max: 5},
                    // TODO: need BuffaloZcl read/write
                    // {name: "deviceInfoRecords", type: BuffaloZclDataType.LIST_TOUCHLINK_DEVICE_INFO},
                    //   {name: "ieeeAddress", type: DataType.IEEE_ADDR},
                    //   {name: "endpointID", type: DataType.UINT8},
                    //   {name: "profileID", type: DataType.UINT16},
                    //   {name: "deviceID", type: DataType.UINT16},
                    //   {name: "version", type: DataType.UINT8},
                    //   {name: "groupIdCount", type: DataType.UINT8},
                    //   {name: "sort", type: DataType.UINT8},
                ],
                required: true,
            },
            networkStart: {
                ID: 0x11,
                parameters: [
                    {name: "transactionID", type: DataType.UINT32, min: 1},
                    /** 0x00 Success, 0x01 Failure, 0x02 – 0xff Reserved */
                    {name: "status", type: DataType.UINT8},
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
                    {name: "transactionID", type: DataType.UINT32, min: 1},
                    /** 0x00 Success, 0x01 Failure, 0x02 – 0xff Reserved */
                    {name: "status", type: DataType.UINT8},
                ],
                required: true,
            },
            networkJoinEndDevice: {
                ID: 0x15,
                parameters: [
                    {name: "transactionID", type: DataType.UINT32, min: 1},
                    /** 0x00 Success, 0x01 Failure, 0x02 – 0xff Reserved */
                    {name: "status", type: DataType.UINT8},
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
                    // TODO: need BuffaloZcl read/write
                    // {name: "groupInfoRecords", type: BuffaloZclDataType.LIST_TOUCHLINK_GROUP_INFO},
                    //   {name: "id", type: DataType.UINT16},
                    //   {name: "type", type: DataType.UINT8},
                ],
                // required: true only if request supported
            },
            getEndpointList: {
                ID: 0x42,
                parameters: [
                    {name: "total", type: DataType.UINT8},
                    {name: "startIndex", type: DataType.UINT8},
                    {name: "count", type: DataType.UINT8},
                    // TODO: need BuffaloZcl read/write
                    // {name: "endpointInfoRecords", type: BuffaloZclDataType.LIST_TOUCHLINK_ENDPOINT_INFO},
                    //   {name: "networkAddress", type: DataType.UINT16},
                    //   {name: "endpointID", type: DataType.UINT8},
                    //   {name: "profileID", type: DataType.UINT16},
                    //   {name: "deviceID", type: DataType.UINT16},
                    //   {name: "version", type: DataType.UINT8},
                ],
                // required: true only if request supported
            },
        },
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
            config: {ID: 0x0031, type: DataType.BITMAP16, write: true},
        },
        commands: {},
        commandsResponse: {
            hueNotification: {
                ID: 0x00,
                parameters: [
                    {name: "button", type: DataType.UINT8, max: 0xff},
                    {name: "unknown1", type: DataType.UINT24, max: 0xffffff},
                    {name: "type", type: DataType.UINT8, max: 0xff},
                    {name: "unknown2", type: DataType.UINT8, max: 0xff},
                    {name: "time", type: DataType.UINT8, max: 0xff},
                    {name: "unknown3", type: DataType.UINT8, max: 0xff},
                ],
            },
        },
    },
    manuSpecificPhilips2: {
        ID: 0xfc03,
        manufacturerCode: ManufacturerCode.SIGNIFY_NETHERLANDS_B_V,
        attributes: {
            state: {ID: 0x0002, type: DataType.OCTET_STR, write: true},
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
            keypadLockout: {ID: 0x0002, type: DataType.ENUM8, write: true, max: 0xff},
            // 'firmware number': {ID: 3, type: DataType.UNKNOWN}, write: true,
            firmwareVersion: {ID: 0x0004, type: DataType.CHAR_STR, write: true},
            outdoorTempToDisplay: {ID: 0x0010, type: DataType.INT16, write: true, max: 0xffff},
            outdoorTempToDisplayTimeout: {ID: 0x0011, type: DataType.UINT16, write: true, max: 0xffff},
            secondScreenBehavior: {ID: 0x0012, type: DataType.ENUM8, write: true, max: 0xff}, // auto:0,setpoint:1,outside:2
            currentTimeToDisplay: {ID: 0x0020, type: DataType.UINT32, write: true, max: 0xffffffff},
            ledIntensityOn: {ID: 0x0052, type: DataType.UINT8, write: true, max: 0xff},
            ledIntensityOff: {ID: 0x0053, type: DataType.UINT8, write: true, max: 0xff},
            ledColorOn: {ID: 0x0050, type: DataType.UINT24, write: true, max: 0xffffff}, // inversed hex BBGGRR
            ledColorOff: {ID: 0x0051, type: DataType.UINT24, write: true, max: 0xffffff},
            onLedIntensity: {ID: 0x0052, type: DataType.UINT8, write: true, max: 0xff}, // percent
            offLedIntensity: {ID: 0x0053, type: DataType.UINT8, write: true, max: 0xff}, // percent
            actionReport: {ID: 0x0054, type: DataType.ENUM8, write: true, max: 0xff}, // singleTapUp: 1,2, doubleTapUp: 1,4, singleTapDown: 17,18, doubleTapDown: 17,20
            minimumBrightness: {ID: 0x0055, type: DataType.UINT16, write: true, max: 0xffff},
            connectedLoadRM: {ID: 0x0060, type: DataType.UINT16, write: true, max: 0xffff}, // unit watt/hr for Calypso RM3500 & Load Controller RM3250
            currentLoad: {ID: 0x0070, type: DataType.BITMAP8, write: true}, // related to ecoMode(s)
            ecoMode: {ID: 0x0071, type: DataType.INT8, write: true, min: -128, max: 127, default: -128}, // -100-0-100%
            ecoMode1: {ID: 0x0072, type: DataType.UINT8, write: true, max: 0xff, default: 0xff}, // 0-99
            ecoMode2: {ID: 0x0073, type: DataType.UINT8, write: true, max: 0xff, default: 0xff}, // 0-100
            unknown: {ID: 0x0075, type: DataType.BITMAP32, write: true, max: 0xffffffff}, // RW *testing*
            drConfigWaterTempMin: {ID: 0x0076, type: DataType.UINT8, write: true, max: 0xff}, // value 45 or 0
            drConfigWaterTempTime: {ID: 0x0077, type: DataType.UINT8, write: true, max: 0xff, default: 2}, // default 2
            drWTTimeOn: {ID: 0x0078, type: DataType.UINT16, write: true, max: 0xffff},
            unknown1: {ID: 0x0080, type: DataType.UINT32, max: 0xffffffff}, // readOnly stringNumber *testing*
            dimmerTimmer: {ID: 0x00a0, type: DataType.UINT32, write: true, max: 0xffffffff},
            unknown2: {ID: 0x0100, type: DataType.UINT8, max: 0xff}, // readOnly *testing*
            floorControlMode: {ID: 0x0105, type: DataType.ENUM8, write: true, max: 0xff}, // airFloorMode
            auxOutputMode: {ID: 0x0106, type: DataType.ENUM8, write: true, max: 0xff},
            floorTemperature: {ID: 0x0107, type: DataType.INT16, write: true, max: 0xffff},
            ambiantMaxHeatSetpointLimit: {ID: 0x0108, type: DataType.INT16, write: true, max: 0xffff},
            floorMinHeatSetpointLimit: {ID: 0x0109, type: DataType.INT16, write: true, max: 0xffff},
            floorMaxHeatSetpointLimit: {ID: 0x010a, type: DataType.INT16, write: true, max: 0xffff},
            temperatureSensor: {ID: 0x010b, type: DataType.ENUM8, write: true, max: 0xff},
            floorLimitStatus: {ID: 0x010c, type: DataType.ENUM8, write: true, max: 0xff},
            roomTemperature: {ID: 0x010d, type: DataType.INT16, write: true, max: 0xffff},
            timeFormatToDisplay: {ID: 0x0114, type: DataType.ENUM8, write: true, max: 0xff},
            GFCiStatus: {ID: 0x0115, type: DataType.ENUM8, write: true, max: 0xff},
            auxConnectedLoad: {ID: 0x0118, type: DataType.UINT16, write: true, max: 0xff},
            connectedLoad: {ID: 0x0119, type: DataType.UINT16, write: true, max: 0xffff},
            pumpProtection: {ID: 0x0128, type: DataType.UINT8, write: true, max: 0xff},
            unknown3: {ID: 0x012a, type: DataType.ENUM8, write: true, max: 0xff, default: 60}, // RW 5,10,15,20,30,60 *testing*
            currentSetpoint: {ID: 0x012b, type: DataType.INT16, write: true, max: 0xffff}, // W:to ocuppiedHeatSetpoint, R:depends of SinopeOccupancy
            // attribute ID: 300's readable, returns a buffer
            reportLocalTemperature: {ID: 0x012d, type: DataType.INT16, write: true, min: -32768, max: 32767},
            // attribute ID: 512's readable
            flowMeterConfig: {ID: 0x0240, type: DataType.ARRAY, write: true},
            coldLoadPickupStatus: {ID: 0x0283, type: DataType.UINT8, write: true, max: 0xff},
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
                    {name: "seq", type: DataType.UINT16, max: 0xffff},
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
            mcuVersionRequest: {ID: 0x10, parameters: [{name: "seq", type: DataType.UINT16, max: 0xffff}]},
            /**
             * FIXME: This command is not listed in Tuya zigbee cluster description,
             *  but there is some command 0x04 (description is: Command Issuance)
             *  in `Serial command list` section of the same document
             *  So, need to investigate more information about it
             */
            sendData: {
                ID: 0x04,
                parameters: [
                    {name: "seq", type: DataType.UINT16, max: 0xffff},
                    {name: "dpValues", type: BuffaloZclDataType.LIST_TUYA_DATAPOINT_VALUES},
                ],
            },
            /**
             * Gw->Zigbee gateway notifies MCU of upgrade
             */
            mcuOtaNotify: {
                ID: 0x12,
                parameters: [
                    {name: "seq", type: DataType.UINT16, max: 0xffff},
                    // FIXME: key is fixed (8 byte) uint8 array
                    //  Ask Koen is there any type to read fixed size uint_8t.
                    //  currently there is `length` property in options but sems it is
                    //  ignored in `writePayloadCluster()` and other methods.
                    //  So, as workaround we use hi/low for key, which is not best solution
                    {name: "key_hi", type: DataType.UINT32, max: 0xffffffff},
                    {name: "key_lo", type: DataType.UINT32, max: 0xffffffff},
                    {name: "version", type: DataType.UINT8, max: 0xff},
                    {name: "imageSize", type: DataType.UINT32, max: 0xffffffff},
                    {name: "crc", type: DataType.UINT32, max: 0xffffffff},
                ],
            },
            /**
             * Gw->Zigbee gateway returns the requested upgrade package for MCU
             */
            mcuOtaBlockDataResponse: {
                ID: 0x14,
                parameters: [
                    {name: "seq", type: DataType.UINT16, max: 0xffff},
                    {name: "status", type: DataType.UINT8, max: 0xff},
                    {name: "key_hi", type: DataType.UINT32, max: 0xffffffff},
                    {name: "key_lo", type: DataType.UINT32, max: 0xffffffff},
                    {name: "version", type: DataType.UINT8, max: 0xff},
                    {name: "offset", type: DataType.UINT32, max: 0xffffffff},
                    {name: "imageData", type: BuffaloZclDataType.LIST_UINT8},
                ],
            },
            /**
             * Time synchronization (bidirectional)
             */
            mcuSyncTime: {
                ID: 0x24,
                parameters: [
                    {name: "payloadSize", type: DataType.UINT16, max: 0xffff},
                    {name: "payload", type: BuffaloZclDataType.LIST_UINT8},
                ],
            },
            /**
             * Gateway connection status (bidirectional)
             */
            mcuGatewayConnectionStatus: {
                ID: 0x25,
                parameters: [
                    {name: "payloadSize", type: DataType.UINT16, max: 0xffff},
                    {name: "payload", type: DataType.UINT8, max: 0xff},
                ],
            },
            /**
             * Weather forecast synchronization (check requestWeatherInformation)
             */
            tuyaWeatherSync: {ID: 0x61, parameters: [{name: "payload", type: BuffaloZclDataType.BUFFER}]},
        },
        commandsResponse: {
            /**
             * Reply to MCU-side data request
             */
            dataResponse: {
                ID: 0x01,
                parameters: [
                    {name: "seq", type: DataType.UINT16, max: 0xffff},
                    {name: "dpValues", type: BuffaloZclDataType.LIST_TUYA_DATAPOINT_VALUES},
                ],
            },
            /**
             * MCU-side data active upload (bidirectional)
             */
            dataReport: {
                ID: 0x02,
                parameters: [
                    {name: "seq", type: DataType.UINT16, max: 0xffff},
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
                    {name: "seq", type: DataType.UINT16, max: 0xffff},
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
                    {name: "seq", type: DataType.UINT16, max: 0xffff},
                    {name: "dpValues", type: BuffaloZclDataType.LIST_TUYA_DATAPOINT_VALUES},
                ],
            },
            /**
             * Zigbee->Gw MCU return version or actively report version
             */
            mcuVersionResponse: {
                ID: 0x11,
                parameters: [
                    {name: "seq", type: DataType.UINT16, max: 0xffff},
                    {name: "version", type: DataType.UINT8, max: 0xff},
                ],
            },
            /**
             * Zigbee->Gw requests an upgrade package for the MCU
             */
            mcuOtaBlockDataRequest: {
                ID: 0x13,
                parameters: [
                    {name: "seq", type: DataType.UINT16, max: 0xffff},
                    {name: "key_hi", type: DataType.UINT32, max: 0xffffffff},
                    {name: "key_lo", type: DataType.UINT32, max: 0xffffffff},
                    {name: "version", type: DataType.UINT8, max: 0xff},
                    {name: "offset", type: DataType.UINT32, max: 0xffffffff},
                    {name: "size", type: DataType.UINT32, max: 0xffffffff},
                ],
            },
            /**
             * Zigbee->Gw returns the upgrade result for the mcu
             */
            mcuOtaResult: {
                ID: 0x15,
                parameters: [
                    {name: "seq", type: DataType.UINT16, max: 0xffff},
                    {name: "status", type: DataType.UINT8, max: 0xff},
                    {name: "key_hi", type: DataType.UINT32, max: 0xffffffff},
                    {name: "key_lo", type: DataType.UINT32, max: 0xffffffff},
                    {name: "version", type: DataType.UINT8, max: 0xff},
                ],
            },
            /**
             * Time synchronization (bidirectional)
             */
            mcuSyncTime: {ID: 0x24, parameters: [{name: "payloadSize", type: DataType.UINT16, max: 0xffff}]},
            /**
             * Gateway connection status (bidirectional)
             */
            mcuGatewayConnectionStatus: {ID: 0x25, parameters: [{name: "payloadSize", type: DataType.UINT16, max: 0xffff}]},
            /**
             * Device can request weather forecast information and expects response respecting given parameters.
             * This command ID seem to be device speciffic, because there is simmilar structure documented in Tuya Serial Communication Protocol,
             * but with different ID (0x3a and 0x3b respectively). In this case, I'm not sure if the name should reflect the one from
             * docs or be also speciffic (providing space for the implementation of the correct one in the future)?
             *
             */
            tuyaWeatherRequest: {ID: 0x60, parameters: [{name: "payload", type: BuffaloZclDataType.BUFFER}]},
        },
    },
    manuSpecificLumi: {
        ID: 0xfcc0,
        manufacturerCode: ManufacturerCode.LUMI_UNITED_TECHOLOGY_LTD_SHENZHEN,
        attributes: {
            mode: {ID: 0x0009, type: DataType.UINT8, write: true, max: 0xff},
            illuminance: {ID: 0x0112, type: DataType.UINT32, write: true, max: 0xffffffff},
            displayUnit: {ID: 0x0114, type: DataType.UINT8, write: true, max: 0xff},
            airQuality: {ID: 0x0129, type: DataType.UINT8, write: true, max: 0xff},
            curtainReverse: {ID: 0x0400, type: DataType.BOOLEAN, write: true},
            curtainHandOpen: {ID: 0x0401, type: DataType.BOOLEAN, write: true},
            curtainCalibrated: {ID: 0x0402, type: DataType.BOOLEAN, write: true},
        },
        commands: {},
        commandsResponse: {},
    },
    manuSpecificTuya2: {
        ID: 0xe002,
        attributes: {
            alarm_temperature_max: {ID: 0xd00a, type: DataType.INT16, write: true, min: -32768, max: 32767},
            alarm_temperature_min: {ID: 0xd00b, type: DataType.INT16, write: true, min: -32768, max: 32767},
            alarm_humidity_max: {ID: 0xd00d, type: DataType.INT16, write: true, min: -32768, max: 32767},
            alarm_humidity_min: {ID: 0xd00e, type: DataType.INT16, write: true, min: -32768, max: 32767},
            alarm_humidity: {ID: 0xd00f, type: DataType.ENUM8, write: true, max: 0xff},
            alarm_temperature: {ID: 0xd006, type: DataType.ENUM8, write: true, max: 0xff},
            unknown: {ID: 0xd010, type: DataType.UINT8, write: true, max: 0xff},
        },
        commands: {},
        commandsResponse: {},
    },
    manuSpecificTuya3: {
        ID: 0xe001,
        attributes: {
            powerOnBehavior: {ID: 0xd010, type: DataType.ENUM8, write: true, max: 0xff},
            switchMode: {ID: 0xd020, type: DataType.ENUM8, write: true, max: 0xff},
            switchType: {ID: 0xd030, type: DataType.ENUM8, write: true, max: 0xff},
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
            measuredValue: {ID: 0x0000, type: DataType.UINT16, write: true, max: 0xffff},
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
            motion_threshold_multiplier: {ID: 0x0000, type: DataType.UINT8, write: true, max: 0xff},
            motion_threshold: {ID: 0x0002, type: DataType.UINT16, write: true, max: 0xffff},
            acceleration: {ID: 0x0010, type: DataType.BITMAP8, write: true, max: 0xff},
            x_axis: {ID: 0x0012, type: DataType.INT16, write: true, min: -32768, max: 32767},
            y_axis: {ID: 0x0013, type: DataType.INT16, write: true, min: -32768, max: 32767},
            z_axis: {ID: 0x0014, type: DataType.INT16, write: true, min: -32768, max: 32767},
        },
        commands: {},
        commandsResponse: {},
    },
    sprutVoc: {
        ID: 0x6601,
        manufacturerCode: 26214,
        attributes: {
            voc: {ID: 0x6600, type: DataType.UINT16, write: true, max: 0xffff},
        },
        commands: {},
        commandsResponse: {},
    },
    sprutNoise: {
        ID: 0x6602,
        manufacturerCode: 26214,
        attributes: {
            noise: {ID: 0x6600, type: DataType.SINGLE_PREC, write: true},
            noiseDetected: {ID: 0x6601, type: DataType.BITMAP8, write: true},
            noiseDetectLevel: {ID: 0x6602, type: DataType.SINGLE_PREC, write: true},
            noiseAfterDetectDelay: {ID: 0x6603, type: DataType.UINT16, write: true, max: 0xffff},
        },
        commands: {},
        commandsResponse: {},
    },
    sprutIrBlaster: {
        ID: 0x6603,
        manufacturerCode: 26214,
        attributes: {},
        commands: {
            playStore: {ID: 0x00, parameters: [{name: "param", type: DataType.UINT8, max: 0xff}]},
            learnStart: {ID: 0x01, parameters: [{name: "value", type: DataType.UINT8, max: 0xff}]},
            learnStop: {ID: 0x02, parameters: [{name: "value", type: DataType.UINT8, max: 0xff}]},
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
            buttonEvent: {ID: 0x0008, type: DataType.UINT32, write: true, max: 0xffffffff},
        },
        commands: {
            siglisZigfredButtonEvent: {
                ID: 0x02,
                parameters: [
                    {name: "button", type: DataType.UINT8, max: 0xff},
                    {name: "type", type: DataType.UINT8, max: 0xff},
                    {name: "duration", type: DataType.UINT16, max: 0xffff},
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
                    {name: "seq", type: DataType.UINT16, max: 0xffff},
                    {name: "length", type: DataType.UINT32, max: 0xffffffff},
                    {name: "unk1", type: DataType.UINT32, max: 0xffffffff},
                    {name: "unk2", type: DataType.UINT16, max: 0xffff},
                    {name: "unk3", type: DataType.UINT8, max: 0xff},
                    {name: "cmd", type: DataType.UINT8, max: 0xff},
                    {name: "unk4", type: DataType.UINT16, max: 0xffff},
                ],
            },
            zosungSendIRCode01: {
                ID: 0x01,
                parameters: [
                    {name: "zero", type: DataType.UINT8, max: 0xff},
                    {name: "seq", type: DataType.UINT16, max: 0xffff},
                    {name: "length", type: DataType.UINT32, max: 0xffffffff},
                    {name: "unk1", type: DataType.UINT32, max: 0xffffffff},
                    {name: "unk2", type: DataType.UINT16, max: 0xffff},
                    {name: "unk3", type: DataType.UINT8, max: 0xff},
                    {name: "cmd", type: DataType.UINT8, max: 0xff},
                    {name: "unk4", type: DataType.UINT16, max: 0xffff},
                ],
            },
            zosungSendIRCode02: {
                ID: 0x02,
                parameters: [
                    {name: "seq", type: DataType.UINT16, max: 0xffff},
                    {name: "position", type: DataType.UINT32, max: 0xffffffff},
                    {name: "maxlen", type: DataType.UINT8, max: 0xff},
                ],
            },
            zosungSendIRCode03: {
                ID: 0x03,
                parameters: [
                    {name: "zero", type: DataType.UINT8, max: 0xff},
                    {name: "seq", type: DataType.UINT16, max: 0xffff},
                    {name: "position", type: DataType.UINT32, max: 0xffffffff},
                    {name: "msgpart", type: DataType.OCTET_STR},
                    {name: "msgpartcrc", type: DataType.UINT8, max: 0xff},
                ],
            },
            zosungSendIRCode04: {
                ID: 0x04,
                parameters: [
                    {name: "zero0", type: DataType.UINT8, max: 0xff},
                    {name: "seq", type: DataType.UINT16, max: 0xffff},
                    {name: "zero1", type: DataType.UINT16, max: 0xffff},
                ],
            },
            zosungSendIRCode05: {
                ID: 0x05,
                parameters: [
                    {name: "seq", type: DataType.UINT16, max: 0xffff},
                    {name: "zero", type: DataType.UINT16, max: 0xffff},
                ],
            },
        },
        commandsResponse: {
            zosungSendIRCode03Resp: {
                ID: 0x03,
                parameters: [
                    {name: "zero", type: DataType.UINT8, max: 0xff},
                    {name: "seq", type: DataType.UINT16, max: 0xffff},
                    {name: "position", type: DataType.UINT32, max: 0xffffffff},
                    {name: "msgpart", type: DataType.OCTET_STR},
                    {name: "msgpartcrc", type: DataType.UINT8, max: 0xff},
                ],
            },
            zosungSendIRCode05Resp: {
                ID: 0x05,
                parameters: [
                    {name: "seq", type: DataType.UINT16, max: 0xffff},
                    {name: "zero", type: DataType.UINT16, max: 0xffff},
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
    manuSpecificProfalux1: {
        ID: 0xfc21, // Config cluster, 0xfc20 mostly for commands it seems
        manufacturerCode: ManufacturerCode.PROFALUX,
        attributes: {
            motorCoverType: {ID: 0x0000, type: DataType.UINT8, write: true, max: 0xff}, // 0 : rolling shutters (volet), 1 : rolling shutters with tilt (BSO), 2: shade (store)
        },
        commands: {},
        commandsResponse: {},
    },
    manuSpecificAmazonWWAH: {
        ID: 0xfc57,
        manufacturerCode: ManufacturerCode.AMAZON_LAB126,
        attributes: {
            disableOTADowngrades: {ID: 0x0002, type: DataType.BOOLEAN, write: true},
            mgmtLeaveWithoutRejoinEnabled: {ID: 0x0003, type: DataType.BOOLEAN, write: true},
            nwkRetryCount: {ID: 0x0004, type: DataType.UINT8, write: true, max: 0xff},
            macRetryCount: {ID: 0x0005, type: DataType.UINT8, write: true, max: 0xff},
            routerCheckInEnabled: {ID: 0x0006, type: DataType.BOOLEAN, write: true},
            touchlinkInterpanEnabled: {ID: 0x0007, type: DataType.BOOLEAN, write: true},
            wwahParentClassificationEnabled: {ID: 0x0008, type: DataType.BOOLEAN, write: true},
            wwahAppEventRetryEnabled: {ID: 0x0009, type: DataType.BOOLEAN, write: true},
            wwahAppEventRetryQueueSize: {ID: 0x000a, type: DataType.UINT8, write: true, max: 0xff},
            wwahRejoinEnabled: {ID: 0x000b, type: DataType.BOOLEAN, write: true},
            macPollFailureWaitTime: {ID: 0x000c, type: DataType.UINT8, write: true, max: 0xff},
            configurationModeEnabled: {ID: 0x000d, type: DataType.BOOLEAN, write: true},
            currentDebugReportID: {ID: 0x000e, type: DataType.UINT8, write: true, max: 0xff},
            tcSecurityOnNwkKeyRotationEnabled: {ID: 0x000f, type: DataType.BOOLEAN, write: true},
            wwahBadParentRecoveryEnabled: {ID: 0x0010, type: DataType.BOOLEAN, write: true},
            pendingNetworkUpdateChannel: {ID: 0x0011, type: DataType.UINT8, write: true, max: 0xff},
            pendingNetworkUpdatePANID: {ID: 0x0012, type: DataType.UINT16, write: true, max: 0xffff},
            otaMaxOfflineDuration: {ID: 0x0013, type: DataType.UINT16, write: true, max: 0xffff},
            clusterRevision: {ID: 0xfffd, type: DataType.UINT16, write: true, max: 0xffff},
        },
        commands: {
            clearBindingTable: {ID: 0x0a, parameters: []},
        },
        commandsResponse: {},
    },
};
