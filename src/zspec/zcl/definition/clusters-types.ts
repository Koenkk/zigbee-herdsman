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
            /** ID: 0 | Type: UINT8 */
            zclVersion: number;
            /** ID: 1 | Type: UINT8 */
            appVersion: number;
            /** ID: 2 | Type: UINT8 */
            stackVersion: number;
            /** ID: 3 | Type: UINT8 */
            hwVersion: number;
            /** ID: 4 | Type: CHAR_STR */
            manufacturerName: string;
            /** ID: 5 | Type: CHAR_STR */
            modelId: string;
            /** ID: 6 | Type: CHAR_STR */
            dateCode: string;
            /** ID: 7 | Type: ENUM8 */
            powerSource: number;
            /** ID: 8 | Type: ENUM8 */
            appProfileVersion: number;
            /** ID: 9 | Type: ENUM8 */
            genericDeviceType: number;
            /** ID: 10 | Type: OCTET_STR */
            productCode: Buffer;
            /** ID: 11 | Type: CHAR_STR */
            productUrl: string;
            /** ID: 12 | Type: CHAR_STR */
            manufacturerVersionDetails: string;
            /** ID: 13 | Type: CHAR_STR */
            serialNumber: string;
            /** ID: 14 | Type: CHAR_STR */
            productLabel: string;
            /** ID: 16 | Type: CHAR_STR */
            locationDesc: string;
            /** ID: 17 | Type: ENUM8 */
            physicalEnv: number;
            /** ID: 18 | Type: BOOLEAN */
            deviceEnabled: number;
            /** ID: 19 | Type: BITMAP8 */
            alarmMask: number;
            /** ID: 20 | Type: BITMAP8 */
            disableLocalConfig: number;
            /** ID: 16384 | Type: CHAR_STR */
            swBuildId: string;
            /** ID: 57856 | Type: INT8 | Specific to manufacturer: SCHNEIDER_ELECTRIC (4190) */
            schneiderMeterRadioPower?: number;
        };
        commands: {
            /** ID: 0 */
            resetFactDefault: Record<string, never>;
            /** ID: 240 */
            tuyaSetup: Record<string, never>;
        };
        commandResponses: never;
    };
    genPowerCfg: {
        attributes: {
            /** ID: 0 | Type: UINT16 */
            mainsVoltage: number;
            /** ID: 1 | Type: UINT8 */
            mainsFrequency: number;
            /** ID: 16 | Type: BITMAP8 */
            mainsAlarmMask: number;
            /** ID: 17 | Type: UINT16 */
            mainsVoltMinThres: number;
            /** ID: 18 | Type: UINT16 */
            mainsVoltMaxThres: number;
            /** ID: 19 | Type: UINT16 */
            mainsVoltageDwellTripPoint: number;
            /** ID: 32 | Type: UINT8 */
            batteryVoltage: number;
            /** ID: 33 | Type: UINT8 */
            batteryPercentageRemaining: number;
            /** ID: 48 | Type: CHAR_STR */
            batteryManufacturer: string;
            /** ID: 49 | Type: ENUM8 */
            batterySize: number;
            /** ID: 50 | Type: UINT16 */
            batteryAHrRating: number;
            /** ID: 51 | Type: UINT8 */
            batteryQuantity: number;
            /** ID: 52 | Type: UINT8 */
            batteryRatedVoltage: number;
            /** ID: 53 | Type: BITMAP8 */
            batteryAlarmMask: number;
            /** ID: 54 | Type: UINT8 */
            batteryVoltMinThres: number;
            /** ID: 55 | Type: UINT8 */
            batteryVoltThres1: number;
            /** ID: 56 | Type: UINT8 */
            batteryVoltThres2: number;
            /** ID: 57 | Type: UINT8 */
            batteryVoltThres3: number;
            /** ID: 58 | Type: UINT8 */
            batteryPercentMinThres: number;
            /** ID: 59 | Type: UINT8 */
            batteryPercentThres1: number;
            /** ID: 60 | Type: UINT8 */
            batteryPercentThres2: number;
            /** ID: 61 | Type: UINT8 */
            batteryPercentThres3: number;
            /** ID: 62 | Type: BITMAP32 */
            batteryAlarmState: number;
        };
        commands: never;
        commandResponses: never;
    };
    genDeviceTempCfg: {
        attributes: {
            /** ID: 0 | Type: INT16 */
            currentTemperature: number;
            /** ID: 1 | Type: INT16 */
            minTempExperienced: number;
            /** ID: 2 | Type: INT16 */
            maxTempExperienced: number;
            /** ID: 3 | Type: UINT16 */
            overTempTotalDwell: number;
            /** ID: 16 | Type: BITMAP8 */
            devTempAlarmMask: number;
            /** ID: 17 | Type: INT16 */
            lowTempThres: number;
            /** ID: 18 | Type: INT16 */
            highTempThres: number;
            /** ID: 19 | Type: UINT24 */
            lowTempDwellTripPoint: number;
            /** ID: 20 | Type: UINT24 */
            highTempDwellTripPoint: number;
        };
        commands: never;
        commandResponses: never;
    };
    genIdentify: {
        attributes: {
            /** ID: 0 | Type: UINT16 */
            identifyTime: number;
            /** ID: 1 | Type: UNKNOWN */
            identifyCommissionState: never;
        };
        commands: {
            /** ID: 0 */
            identify: {
                /** Type: UINT16 */
                identifytime: number;
            };
            /** ID: 1 */
            identifyQuery: Record<string, never>;
            /** ID: 2 */
            ezmodeInvoke: {
                /** Type: UINT8 */
                action: number;
            };
            /** ID: 3 */
            updateCommissionState: {
                /** Type: UINT8 */
                action: number;
                /** Type: UINT8 */
                commstatemask: number;
            };
            /** ID: 64 */
            triggerEffect: {
                /** Type: UINT8 */
                effectid: number;
                /** Type: UINT8 */
                effectvariant: number;
            };
        };
        commandResponses: {
            /** ID: 0 */
            identifyQueryRsp: {
                /** Type: UINT16 */
                timeout: number;
            };
        };
    };
    genGroups: {
        attributes: {
            /** ID: 0 | Type: BITMAP8 */
            nameSupport: number;
        };
        commands: {
            /** ID: 0 | Response ID: 0 */
            add: {
                /** Type: UINT16 */
                groupid: number;
                /** Type: CHAR_STR */
                groupname: string;
            };
            /** ID: 1 | Response ID: 1 */
            view: {
                /** Type: UINT16 */
                groupid: number;
            };
            /** ID: 2 | Response ID: 2 */
            getMembership: {
                /** Type: UINT8 */
                groupcount: number;
                /** Type: LIST_UINT16 */
                grouplist: number[];
            };
            /** ID: 3 | Response ID: 3 */
            remove: {
                /** Type: UINT16 */
                groupid: number;
            };
            /** ID: 4 */
            removeAll: Record<string, never>;
            /** ID: 5 */
            addIfIdentifying: {
                /** Type: UINT16 */
                groupid: number;
                /** Type: CHAR_STR */
                groupname: string;
            };
            /** ID: 240 */
            miboxerSetZones: {
                /** Type: LIST_MIBOXER_ZONES */
                zones: MiboxerZone[];
            };
        };
        commandResponses: {
            /** ID: 0 */
            addRsp: {
                /** Type: UINT8 */
                status: number;
                /** Type: UINT16 */
                groupid: number;
            };
            /** ID: 1 */
            viewRsp: {
                /** Type: UINT8 */
                status: number;
                /** Type: UINT16 */
                groupid: number;
                /** Type: CHAR_STR */
                groupname: string;
            };
            /** ID: 2 */
            getMembershipRsp: {
                /** Type: UINT8 */
                capacity: number;
                /** Type: UINT8 */
                groupcount: number;
                /** Type: LIST_UINT16 */
                grouplist: number[];
            };
            /** ID: 3 */
            removeRsp: {
                /** Type: UINT8 */
                status: number;
                /** Type: UINT16 */
                groupid: number;
            };
        };
    };
    genScenes: {
        attributes: {
            /** ID: 0 | Type: UINT8 */
            count: number;
            /** ID: 1 | Type: UINT8 */
            currentScene: number;
            /** ID: 2 | Type: UINT16 */
            currentGroup: number;
            /** ID: 3 | Type: BOOLEAN */
            sceneValid: number;
            /** ID: 4 | Type: BITMAP8 */
            nameSupport: number;
            /** ID: 5 | Type: IEEE_ADDR */
            lastCfgBy: string;
        };
        commands: {
            /** ID: 0 | Response ID: 0 */
            add: {
                /** Type: UINT16 */
                groupid: number;
                /** Type: UINT8 */
                sceneid: number;
                /** Type: UINT16 */
                transtime: number;
                /** Type: CHAR_STR */
                scenename: string;
                /** Type: EXTENSION_FIELD_SETS */
                extensionfieldsets: ExtensionFieldSet[];
            };
            /** ID: 1 | Response ID: 1 */
            view: {
                /** Type: UINT16 */
                groupid: number;
                /** Type: UINT8 */
                sceneid: number;
            };
            /** ID: 2 | Response ID: 2 */
            remove: {
                /** Type: UINT16 */
                groupid: number;
                /** Type: UINT8 */
                sceneid: number;
            };
            /** ID: 3 | Response ID: 3 */
            removeAll: {
                /** Type: UINT16 */
                groupid: number;
            };
            /** ID: 4 | Response ID: 4 */
            store: {
                /** Type: UINT16 */
                groupid: number;
                /** Type: UINT8 */
                sceneid: number;
            };
            /** ID: 5 */
            recall: {
                /** Type: UINT16 */
                groupid: number;
                /** Type: UINT8 */
                sceneid: number;
            };
            /** ID: 6 | Response ID: 6 */
            getSceneMembership: {
                /** Type: UINT16 */
                groupid: number;
            };
            /** ID: 64 | Response ID: 64 */
            enhancedAdd: {
                /** Type: UINT16 */
                groupid: number;
                /** Type: UINT8 */
                sceneid: number;
                /** Type: UINT16 */
                transtime: number;
                /** Type: CHAR_STR */
                scenename: string;
                /** Type: EXTENSION_FIELD_SETS */
                extensionfieldsets: ExtensionFieldSet[];
            };
            /** ID: 65 | Response ID: 65 */
            enhancedView: {
                /** Type: UINT16 */
                groupid: number;
                /** Type: UINT8 */
                sceneid: number;
            };
            /** ID: 66 | Response ID: 66 */
            copy: {
                /** Type: UINT8 */
                mode: number;
                /** Type: UINT16 */
                groupidfrom: number;
                /** Type: UINT8 */
                sceneidfrom: number;
                /** Type: UINT16 */
                groupidto: number;
                /** Type: UINT8 */
                sceneidto: number;
            };
            /** ID: 7 */
            tradfriArrowSingle: {
                /** Type: UINT16 */
                value: number;
                /** Type: UINT16 */
                value2: number;
            };
            /** ID: 8 */
            tradfriArrowHold: {
                /** Type: UINT16 */
                value: number;
            };
            /** ID: 9 */
            tradfriArrowRelease: {
                /** Type: UINT16 */
                value: number;
            };
        };
        commandResponses: {
            /** ID: 0 */
            addRsp: {
                /** Type: UINT8 */
                status: number;
                /** Type: UINT16 */
                groupId: number;
                /** Type: UINT8 */
                sceneId: number;
            };
            /** ID: 1 */
            viewRsp: {
                /** Type: UINT8 */
                status: number;
                /** Type: UINT16 */
                groupid: number;
                /** Type: UINT8 */
                sceneid: number;
                /** Type: UINT16, Conditions: [{fieldEquals field=status value=0}] */
                transtime?: number;
                /** Type: CHAR_STR, Conditions: [{fieldEquals field=status value=0}] */
                scenename?: string;
                /** Type: EXTENSION_FIELD_SETS, Conditions: [{fieldEquals field=status value=0}] */
                extensionfieldsets?: ExtensionFieldSet[];
            };
            /** ID: 2 */
            removeRsp: {
                /** Type: UINT8 */
                status: number;
                /** Type: UINT16 */
                groupid: number;
                /** Type: UINT8 */
                sceneid: number;
            };
            /** ID: 3 */
            removeAllRsp: {
                /** Type: UINT8 */
                status: number;
                /** Type: UINT16 */
                groupid: number;
            };
            /** ID: 4 */
            storeRsp: {
                /** Type: UINT8 */
                status: number;
                /** Type: UINT16 */
                groupid: number;
                /** Type: UINT8 */
                sceneid: number;
            };
            /** ID: 6 */
            getSceneMembershipRsp: {
                /** Type: UINT8 */
                status: number;
                /** Type: UINT8 */
                capacity: number;
                /** Type: UINT16 */
                groupid: number;
                /** Type: UINT8, Conditions: [{fieldEquals field=status value=0}] */
                scenecount?: number;
                /** Type: LIST_UINT8, Conditions: [{fieldEquals field=status value=0}] */
                scenelist?: number[];
            };
            /** ID: 64 */
            enhancedAddRsp: {
                /** Type: UINT8 */
                status: number;
                /** Type: UINT16 */
                groupId: number;
                /** Type: UINT8 */
                sceneId: number;
            };
            /** ID: 65 */
            enhancedViewRsp: {
                /** Type: UINT8 */
                status: number;
                /** Type: UINT16 */
                groupid: number;
                /** Type: UINT8 */
                sceneid: number;
                /** Type: UINT16, Conditions: [{fieldEquals field=status value=0}] */
                transtime?: number;
                /** Type: CHAR_STR, Conditions: [{fieldEquals field=status value=0}] */
                scenename?: string;
                /** Type: EXTENSION_FIELD_SETS, Conditions: [{fieldEquals field=status value=0}] */
                extensionfieldsets?: ExtensionFieldSet[];
            };
            /** ID: 66 */
            copyRsp: {
                /** Type: UINT8 */
                status: number;
                /** Type: UINT16 */
                groupidfrom: number;
                /** Type: UINT8 */
                sceneidfrom: number;
            };
        };
    };
    genOnOff: {
        attributes: {
            /** ID: 0 | Type: BOOLEAN */
            onOff: number;
            /** ID: 16384 | Type: BOOLEAN */
            globalSceneCtrl: number;
            /** ID: 16385 | Type: UINT16 */
            onTime: number;
            /** ID: 16386 | Type: UINT16 */
            offWaitTime: number;
            /** ID: 16387 | Type: ENUM8 */
            startUpOnOff: number;
            /** ID: 20480 | Type: ENUM8 */
            tuyaBacklightSwitch: number;
            /** ID: 32769 | Type: ENUM8 */
            tuyaBacklightMode: number;
            /** ID: 32770 | Type: ENUM8 */
            moesStartUpOnOff: number;
            /** ID: 32772 | Type: ENUM8 */
            tuyaOperationMode: number;
            /** ID: 57344 | Type: UINT16 | Specific to manufacturer: ADEO (4727) */
            elkoPreWarningTime?: number;
            /** ID: 57345 | Type: UINT32 | Specific to manufacturer: ADEO (4727) */
            elkoOnTimeReload?: number;
            /** ID: 57346 | Type: BITMAP8 | Specific to manufacturer: ADEO (4727) */
            elkoOnTimeReloadOptions?: number;
            /** ID: 1 | Type: UINT16 | Specific to manufacturer: NODON (4747) */
            nodonTransitionTime?: number;
        };
        commands: {
            /** ID: 0 */
            off: Record<string, never>;
            /** ID: 1 */
            on: Record<string, never>;
            /** ID: 2 */
            toggle: Record<string, never>;
            /** ID: 64 */
            offWithEffect: {
                /** Type: UINT8 */
                effectid: number;
                /** Type: UINT8 */
                effectvariant: number;
            };
            /** ID: 65 */
            onWithRecallGlobalScene: Record<string, never>;
            /** ID: 66 */
            onWithTimedOff: {
                /** Type: UINT8 */
                ctrlbits: number;
                /** Type: UINT16 */
                ontime: number;
                /** Type: UINT16 */
                offwaittime: number;
            };
            /** ID: 253 */
            tuyaAction: {
                /** Type: UINT8 */
                value: number;
                /** Type: BUFFER */
                data: Buffer;
            };
            /** ID: 252 */
            tuyaAction2: {
                /** Type: UINT8 */
                value: number;
            };
        };
        commandResponses: never;
    };
    genOnOffSwitchCfg: {
        attributes: {
            /** ID: 0 | Type: ENUM8 */
            switchType: number;
            /** ID: 2 | Type: UNKNOWN */
            switchMultiFunction: never;
            /** ID: 16 | Type: ENUM8 */
            switchActions: number;
        };
        commands: never;
        commandResponses: never;
    };
    genLevelCtrl: {
        attributes: {
            /** ID: 0 | Type: UINT8 */
            currentLevel: number;
            /** ID: 1 | Type: UINT16 */
            remainingTime: number;
            /** ID: 2 | Type: UINT8 */
            minLevel: number;
            /** ID: 3 | Type: UINT8 */
            maxLevel: number;
            /** ID: 15 | Type: BITMAP8 */
            options: number;
            /** ID: 16 | Type: UINT16 */
            onOffTransitionTime: number;
            /** ID: 17 | Type: UINT8 */
            onLevel: number;
            /** ID: 18 | Type: UINT16 */
            onTransitionTime: number;
            /** ID: 19 | Type: UINT16 */
            offTransitionTime: number;
            /** ID: 20 | Type: UINT16 */
            defaultMoveRate: number;
            /** ID: 16384 | Type: UINT8 */
            startUpCurrentLevel: number;
            /** ID: 16384 | Type: UINT8 | Specific to manufacturer: ADEO (4727) */
            elkoStartUpCurrentLevel?: number;
        };
        commands: {
            /** ID: 0 */
            moveToLevel: {
                /** Type: UINT8 */
                level: number;
                /** Type: UINT16 */
                transtime: number;
            };
            /** ID: 1 */
            move: {
                /** Type: UINT8 */
                movemode: number;
                /** Type: UINT8 */
                rate: number;
            };
            /** ID: 2 */
            step: {
                /** Type: UINT8 */
                stepmode: number;
                /** Type: UINT8 */
                stepsize: number;
                /** Type: UINT16 */
                transtime: number;
            };
            /** ID: 3 */
            stop: Record<string, never>;
            /** ID: 4 */
            moveToLevelWithOnOff: {
                /** Type: UINT8 */
                level: number;
                /** Type: UINT16 */
                transtime: number;
            };
            /** ID: 5 */
            moveWithOnOff: {
                /** Type: UINT8 */
                movemode: number;
                /** Type: UINT8 */
                rate: number;
            };
            /** ID: 6 */
            stepWithOnOff: {
                /** Type: UINT8 */
                stepmode: number;
                /** Type: UINT8 */
                stepsize: number;
                /** Type: UINT16 */
                transtime: number;
            };
            /** ID: 7 */
            stopWithOnOff: Record<string, never>;
            /** ID: 240 */
            moveToLevelTuya: {
                /** Type: UINT16 */
                level: number;
                /** Type: UINT16 */
                transtime: number;
            };
        };
        commandResponses: never;
    };
    genAlarms: {
        attributes: {
            /** ID: 0 | Type: UINT16 */
            alarmCount: number;
        };
        commands: {
            /** ID: 0 */
            reset: {
                /** Type: UINT8 */
                alarmcode: number;
                /** Type: UINT16 */
                clusterid: number;
            };
            /** ID: 1 */
            resetAll: Record<string, never>;
            /** ID: 2 */
            getAlarm: Record<string, never>;
            /** ID: 3 */
            resetLog: Record<string, never>;
            /** ID: 4 */
            publishEventLog: Record<string, never>;
        };
        commandResponses: {
            /** ID: 0 */
            alarm: {
                /** Type: UINT8 */
                alarmcode: number;
                /** Type: UINT16 */
                clusterid: number;
            };
            /** ID: 1 */
            getRsp: {
                /** Type: UINT8 */
                status: number;
                /** Type: UINT8 */
                alarmcode: number;
                /** Type: UINT16 */
                clusterid: number;
                /** Type: UINT32 */
                timestamp: number;
            };
            /** ID: 2 */
            getEventLog: Record<string, never>;
        };
    };
    genTime: {
        attributes: {
            /** ID: 0 | Type: UTC */
            time: number;
            /** ID: 1 | Type: BITMAP8 */
            timeStatus: number;
            /** ID: 2 | Type: INT32 */
            timeZone: number;
            /** ID: 3 | Type: UINT32 */
            dstStart: number;
            /** ID: 4 | Type: UINT32 */
            dstEnd: number;
            /** ID: 5 | Type: INT32 */
            dstShift: number;
            /** ID: 6 | Type: UINT32 */
            standardTime: number;
            /** ID: 7 | Type: UINT32 */
            localTime: number;
            /** ID: 8 | Type: UTC */
            lastSetTime: number;
            /** ID: 9 | Type: UTC */
            validUntilTime: number;
        };
        commands: never;
        commandResponses: never;
    };
    genRssiLocation: {
        attributes: {
            /** ID: 0 | Type: DATA8 */
            type: number;
            /** ID: 1 | Type: ENUM8 */
            method: number;
            /** ID: 2 | Type: UINT16 */
            age: number;
            /** ID: 3 | Type: UINT8 */
            qualityMeasure: number;
            /** ID: 4 | Type: UINT8 */
            numOfDevices: number;
            /** ID: 16 | Type: INT16 */
            coordinate1: number;
            /** ID: 17 | Type: INT16 */
            coordinate2: number;
            /** ID: 18 | Type: INT16 */
            coordinate3: number;
            /** ID: 19 | Type: INT16 */
            power: number;
            /** ID: 20 | Type: UINT16 */
            pathLossExponent: number;
            /** ID: 21 | Type: UINT16 */
            reportingPeriod: number;
            /** ID: 22 | Type: UINT16 */
            calcPeriod: number;
            /** ID: 23 | Type: UINT8 */
            numRSSIMeasurements: number;
        };
        commands: {
            /** ID: 0 */
            setAbsolute: {
                /** Type: INT16 */
                coord1: number;
                /** Type: INT16 */
                coord2: number;
                /** Type: INT16 */
                coord3: number;
                /** Type: INT16 */
                power: number;
                /** Type: UINT16 */
                pathLossExponent: number;
            };
            /** ID: 1 */
            setDeviceConfig: {
                /** Type: INT16 */
                power: number;
                /** Type: UINT16 */
                pathLossExponent: number;
                /** Type: UINT16 */
                calcPeriod: number;
                /** Type: UINT8 */
                numRssiMeasurements: number;
                /** Type: UINT16 */
                reportingPeriod: number;
            };
            /** ID: 2 */
            getDeviceConfig: {
                /** Type: IEEE_ADDR */
                targetAddr: string;
            };
            /** ID: 3 */
            getLocationData: {
                /** Type: BITMAP8 */
                info: number;
                /** Type: UINT8 */
                numResponses: number;
                /** Type: IEEE_ADDR, Conditions: [{bitMaskSet param=info mask=4 reversed=true}] */
                targetAddr?: string;
            };
            /** ID: 4 */
            rssiResponse: {
                /** Type: IEEE_ADDR */
                replyingDevice: string;
                /** Type: INT16 */
                x: number;
                /** Type: INT16 */
                y: number;
                /** Type: INT16 */
                z: number;
                /** Type: INT8 */
                rssi: number;
                /** Type: UINT8 */
                numRssiMeasurements: number;
            };
            /** ID: 5 */
            sendPings: {
                /** Type: IEEE_ADDR */
                targetAddr: string;
                /** Type: UINT8 */
                numRssiMeasurements: number;
                /** Type: UINT16 */
                calcPeriod: number;
            };
            /** ID: 6 */
            anchorNodeAnnounce: {
                /** Type: IEEE_ADDR */
                anchorNodeAddr: string;
                /** Type: INT16 */
                x: number;
                /** Type: INT16 */
                y: number;
                /** Type: INT16 */
                z: number;
            };
        };
        commandResponses: {
            /** ID: 0 */
            deviceConfigResponse: {
                /** Type: ENUM8 */
                status: number;
                /** Type: INT16, Conditions: [{fieldEquals field=status value=0}] */
                power?: number;
                /** Type: UINT16, Conditions: [{fieldEquals field=status value=0}] */
                pathLossExponent?: number;
                /** Type: UINT16, Conditions: [{fieldEquals field=status value=0}] */
                calcPeriod?: number;
                /** Type: UINT8, Conditions: [{fieldEquals field=status value=0}] */
                numRssiMeasurements?: number;
                /** Type: UINT16, Conditions: [{fieldEquals field=status value=0}] */
                reportingPeriod?: number;
            };
            /** ID: 1 */
            locationDataResponse: {
                /** Type: ENUM8 */
                status: number;
                /** Type: DATA8, Conditions: [{fieldEquals field=status value=0}] */
                type?: number;
                /** Type: INT16, Conditions: [{fieldEquals field=status value=0}] */
                coord1?: number;
                /** Type: INT16, Conditions: [{fieldEquals field=status value=0}] */
                coord2?: number;
                /** Type: INT16, Conditions: [{fieldEquals field=status value=0}] */
                coord3?: number;
                /** Type: INT16, Conditions: [{fieldEquals field=status value=0}] */
                power?: number;
                /** Type: UINT16, Conditions: [{fieldEquals field=status value=0}] */
                pathLossExponent?: number;
                /** Type: ENUM8, Conditions: [{fieldEquals field=status value=0}] */
                method?: number;
                /** Type: UINT8, Conditions: [{fieldEquals field=status value=0}] */
                qualityMeasure?: number;
                /** Type: UINT16, Conditions: [{fieldEquals field=status value=0}] */
                age?: number;
            };
            /** ID: 2 */
            locationDataNotification: {
                /** Type: DATA8 */
                type: number;
                /** Type: INT16 */
                coord1: number;
                /** Type: INT16 */
                coord2: number;
                /** Type: INT16, Conditions: [{bitMaskSet param=type mask=2 reversed=true}] */
                coord3?: number;
                /** Type: INT16 */
                power: number;
                /** Type: UINT16 */
                pathLossExponent: number;
                /** Type: ENUM8, Conditions: [{bitMaskSet param=type mask=1 reversed=true}] */
                method?: number;
                /** Type: UINT8, Conditions: [{bitMaskSet param=type mask=1 reversed=true}] */
                qualityMeasure?: number;
                /** Type: UINT16, Conditions: [{bitMaskSet param=type mask=1 reversed=true}] */
                age?: number;
            };
            /** ID: 3 */
            compactLocationDataNotification: {
                /** Type: DATA8 */
                type: number;
                /** Type: INT16 */
                coord1: number;
                /** Type: INT16 */
                coord2: number;
                /** Type: INT16, Conditions: [{bitMaskSet param=type mask=2 reversed=true}] */
                coord3?: number;
                /** Type: UINT8, Conditions: [{bitMaskSet param=type mask=1 reversed=true}] */
                qualityMeasure?: number;
                /** Type: UINT16, Conditions: [{bitMaskSet param=type mask=1 reversed=true}] */
                age?: number;
            };
            /** ID: 4 */
            rssiPing: {
                /** Type: DATA8 */
                type: number;
            };
            /** ID: 5 */
            rssiRequest: Record<string, never>;
            /** ID: 6 */
            reportRssiMeasurements: {
                /** Type: IEEE_ADDR */
                measuringDeviceAddr: string;
                /** Type: UINT8 */
                numNeighbors: number;
            };
            /** ID: 7 */
            requestOwnLocation: {
                /** Type: IEEE_ADDR */
                blindNodeAddr: string;
            };
        };
    };
    genAnalogInput: {
        attributes: {
            /** ID: 28 | Type: CHAR_STR */
            description: string;
            /** ID: 65 | Type: SINGLE_PREC */
            maxPresentValue: number;
            /** ID: 69 | Type: SINGLE_PREC */
            minPresentValue: number;
            /** ID: 81 | Type: BOOLEAN */
            outOfService: number;
            /** ID: 85 | Type: SINGLE_PREC */
            presentValue: number;
            /** ID: 103 | Type: ENUM8 */
            reliability: number;
            /** ID: 106 | Type: SINGLE_PREC */
            resolution: number;
            /** ID: 111 | Type: BITMAP8 */
            statusFlags: number;
            /** ID: 117 | Type: ENUM16 */
            engineeringUnits: number;
            /** ID: 256 | Type: UINT32 */
            applicationType: number;
        };
        commands: never;
        commandResponses: never;
    };
    genAnalogOutput: {
        attributes: {
            /** ID: 28 | Type: CHAR_STR */
            description: string;
            /** ID: 65 | Type: SINGLE_PREC */
            maxPresentValue: number;
            /** ID: 69 | Type: SINGLE_PREC */
            minPresentValue: number;
            /** ID: 81 | Type: BOOLEAN */
            outOfService: number;
            /** ID: 85 | Type: SINGLE_PREC */
            presentValue: number;
            /** ID: 87 | Type: ARRAY */
            priorityArray: ZclArray | unknown[];
            /** ID: 103 | Type: ENUM8 */
            reliability: number;
            /** ID: 104 | Type: SINGLE_PREC */
            relinquishDefault: number;
            /** ID: 106 | Type: SINGLE_PREC */
            resolution: number;
            /** ID: 111 | Type: BITMAP8 */
            statusFlags: number;
            /** ID: 117 | Type: ENUM16 */
            engineeringUnits: number;
            /** ID: 256 | Type: UINT32 */
            applicationType: number;
        };
        commands: never;
        commandResponses: never;
    };
    genAnalogValue: {
        attributes: {
            /** ID: 28 | Type: CHAR_STR */
            description: string;
            /** ID: 81 | Type: BOOLEAN */
            outOfService: number;
            /** ID: 85 | Type: SINGLE_PREC */
            presentValue: number;
            /** ID: 87 | Type: ARRAY */
            priorityArray: ZclArray | unknown[];
            /** ID: 103 | Type: ENUM8 */
            reliability: number;
            /** ID: 104 | Type: SINGLE_PREC */
            relinquishDefault: number;
            /** ID: 111 | Type: BITMAP8 */
            statusFlags: number;
            /** ID: 117 | Type: ENUM16 */
            engineeringUnits: number;
            /** ID: 256 | Type: UINT32 */
            applicationType: number;
        };
        commands: never;
        commandResponses: never;
    };
    genBinaryInput: {
        attributes: {
            /** ID: 4 | Type: CHAR_STR */
            activeText: string;
            /** ID: 28 | Type: CHAR_STR */
            description: string;
            /** ID: 46 | Type: CHAR_STR */
            inactiveText: string;
            /** ID: 81 | Type: BOOLEAN */
            outOfService: number;
            /** ID: 84 | Type: ENUM8 */
            polarity: number;
            /** ID: 85 | Type: BOOLEAN */
            presentValue: number;
            /** ID: 103 | Type: ENUM8 */
            reliability: number;
            /** ID: 111 | Type: BITMAP8 */
            statusFlags: number;
            /** ID: 256 | Type: UINT32 */
            applicationType: number;
        };
        commands: never;
        commandResponses: never;
    };
    genBinaryOutput: {
        attributes: {
            /** ID: 4 | Type: CHAR_STR */
            activeText: string;
            /** ID: 28 | Type: CHAR_STR */
            description: string;
            /** ID: 46 | Type: CHAR_STR */
            inactiveText: string;
            /** ID: 66 | Type: UINT32 */
            minimumOffTime: number;
            /** ID: 67 | Type: UINT32 */
            minimumOnTime: number;
            /** ID: 81 | Type: BOOLEAN */
            outOfService: number;
            /** ID: 84 | Type: ENUM8 */
            polarity: number;
            /** ID: 85 | Type: BOOLEAN */
            presentValue: number;
            /** ID: 87 | Type: ARRAY */
            priorityArray: ZclArray | unknown[];
            /** ID: 103 | Type: ENUM8 */
            reliability: number;
            /** ID: 104 | Type: BOOLEAN */
            relinquishDefault: number;
            /** ID: 111 | Type: BITMAP8 */
            statusFlags: number;
            /** ID: 256 | Type: UINT32 */
            applicationType: number;
        };
        commands: never;
        commandResponses: never;
    };
    genBinaryValue: {
        attributes: {
            /** ID: 4 | Type: CHAR_STR */
            activeText: string;
            /** ID: 28 | Type: CHAR_STR */
            description: string;
            /** ID: 46 | Type: CHAR_STR */
            inactiveText: string;
            /** ID: 66 | Type: UINT32 */
            minimumOffTime: number;
            /** ID: 67 | Type: UINT32 */
            minimumOnTime: number;
            /** ID: 81 | Type: BOOLEAN */
            outOfService: number;
            /** ID: 85 | Type: BOOLEAN */
            presentValue: number;
            /** ID: 87 | Type: ARRAY */
            priorityArray: ZclArray | unknown[];
            /** ID: 103 | Type: ENUM8 */
            reliability: number;
            /** ID: 104 | Type: BOOLEAN */
            relinquishDefault: number;
            /** ID: 111 | Type: BITMAP8 */
            statusFlags: number;
            /** ID: 256 | Type: UINT32 */
            applicationType: number;
        };
        commands: never;
        commandResponses: never;
    };
    genMultistateInput: {
        attributes: {
            /** ID: 14 | Type: ARRAY */
            stateText: ZclArray | unknown[];
            /** ID: 28 | Type: CHAR_STR */
            description: string;
            /** ID: 74 | Type: UINT16 */
            numberOfStates: number;
            /** ID: 81 | Type: BOOLEAN */
            outOfService: number;
            /** ID: 85 | Type: UINT16 */
            presentValue: number;
            /** ID: 103 | Type: ENUM8 */
            reliability: number;
            /** ID: 111 | Type: BITMAP8 */
            statusFlags: number;
            /** ID: 256 | Type: UINT32 */
            applicationType: number;
        };
        commands: never;
        commandResponses: never;
    };
    genMultistateOutput: {
        attributes: {
            /** ID: 14 | Type: ARRAY */
            stateText: ZclArray | unknown[];
            /** ID: 28 | Type: CHAR_STR */
            description: string;
            /** ID: 74 | Type: UINT16 */
            numberOfStates: number;
            /** ID: 81 | Type: BOOLEAN */
            outOfService: number;
            /** ID: 85 | Type: UINT16 */
            presentValue: number;
            /** ID: 87 | Type: ARRAY */
            priorityArray: ZclArray | unknown[];
            /** ID: 103 | Type: ENUM8 */
            reliability: number;
            /** ID: 104 | Type: UINT16 */
            relinquishDefault: number;
            /** ID: 111 | Type: BITMAP8 */
            statusFlags: number;
            /** ID: 256 | Type: UINT32 */
            applicationType: number;
        };
        commands: never;
        commandResponses: never;
    };
    genMultistateValue: {
        attributes: {
            /** ID: 14 | Type: ARRAY */
            stateText: ZclArray | unknown[];
            /** ID: 28 | Type: CHAR_STR */
            description: string;
            /** ID: 74 | Type: UINT16 */
            numberOfStates: number;
            /** ID: 81 | Type: BOOLEAN */
            outOfService: number;
            /** ID: 85 | Type: UINT16 */
            presentValue: number;
            /** ID: 87 | Type: ARRAY */
            priorityArray: ZclArray | unknown[];
            /** ID: 103 | Type: ENUM8 */
            reliability: number;
            /** ID: 104 | Type: UINT16 */
            relinquishDefault: number;
            /** ID: 111 | Type: BITMAP8 */
            statusFlags: number;
            /** ID: 256 | Type: UINT32 */
            applicationType: number;
        };
        commands: never;
        commandResponses: never;
    };
    genCommissioning: {
        attributes: {
            /** ID: 0 | Type: UINT16 */
            shortress: number;
            /** ID: 1 | Type: IEEE_ADDR */
            extendedPANId: string;
            /** ID: 2 | Type: UINT16 */
            panId: number;
            /** ID: 3 | Type: BITMAP32 */
            channelmask: number;
            /** ID: 4 | Type: UINT8 */
            protocolVersion: number;
            /** ID: 5 | Type: UINT8 */
            stackProfile: number;
            /** ID: 6 | Type: ENUM8 */
            startupControl: number;
            /** ID: 16 | Type: IEEE_ADDR */
            trustCenterress: string;
            /** ID: 17 | Type: SEC_KEY */
            trustCenterMasterKey: Buffer;
            /** ID: 18 | Type: SEC_KEY */
            networkKey: Buffer;
            /** ID: 19 | Type: BOOLEAN */
            useInsecureJoin: number;
            /** ID: 20 | Type: SEC_KEY */
            preconfiguredLinkKey: Buffer;
            /** ID: 21 | Type: UINT8 */
            networkKeySeqNum: number;
            /** ID: 22 | Type: ENUM8 */
            networkKeyType: number;
            /** ID: 23 | Type: UINT16 */
            networkManagerress: number;
            /** ID: 32 | Type: UINT8 */
            scanAttempts: number;
            /** ID: 33 | Type: UINT16 */
            timeBetweenScans: number;
            /** ID: 34 | Type: UINT16 */
            rejoinInterval: number;
            /** ID: 35 | Type: UINT16 */
            maxRejoinInterval: number;
            /** ID: 48 | Type: UINT16 */
            indirectPollRate: number;
            /** ID: 49 | Type: UINT8 */
            parentRetryThreshold: number;
            /** ID: 64 | Type: BOOLEAN */
            concentratorFlag: number;
            /** ID: 65 | Type: UINT8 */
            concentratorRus: number;
            /** ID: 66 | Type: UINT8 */
            concentratorDiscoveryTime: number;
        };
        commands: {
            /** ID: 0 */
            restartDevice: {
                /** Type: UINT8 */
                options: number;
                /** Type: UINT8 */
                delay: number;
                /** Type: UINT8 */
                jitter: number;
            };
            /** ID: 1 */
            saveStartupParams: {
                /** Type: UINT8 */
                options: number;
                /** Type: UINT8 */
                index: number;
            };
            /** ID: 2 */
            restoreStartupParams: {
                /** Type: UINT8 */
                options: number;
                /** Type: UINT8 */
                index: number;
            };
            /** ID: 3 */
            resetStartupParams: {
                /** Type: UINT8 */
                options: number;
                /** Type: UINT8 */
                index: number;
            };
        };
        commandResponses: {
            /** ID: 0 */
            restartDeviceRsp: {
                /** Type: UINT8 */
                status: number;
            };
            /** ID: 1 */
            saveStartupParamsRsp: {
                /** Type: UINT8 */
                status: number;
            };
            /** ID: 2 */
            restoreStartupParamsRsp: {
                /** Type: UINT8 */
                status: number;
            };
            /** ID: 3 */
            resetStartupParamsRsp: {
                /** Type: UINT8 */
                status: number;
            };
        };
    };
    genOta: {
        attributes: {
            /** ID: 0 | Type: IEEE_ADDR */
            upgradeServerId: string;
            /** ID: 1 | Type: UINT32 */
            fileOffset: number;
            /** ID: 2 | Type: UINT32 */
            currentFileVersion: number;
            /** ID: 3 | Type: UINT16 */
            currentZigbeeStackVersion: number;
            /** ID: 4 | Type: UINT32 */
            downloadedFileVersion: number;
            /** ID: 5 | Type: UINT16 */
            downloadedZigbeeStackVersion: number;
            /** ID: 6 | Type: ENUM8 */
            imageUpgradeStatus: number;
            /** ID: 7 | Type: UINT16 */
            manufacturerId: number;
            /** ID: 8 | Type: UINT16 */
            imageTypeId: number;
            /** ID: 9 | Type: UINT16 */
            minimumBlockReqDelay: number;
            /** ID: 10 | Type: UINT32 */
            imageStamp: number;
        };
        commands: {
            /** ID: 1 | Response ID: 2 */
            queryNextImageRequest: {
                /** Type: UINT8 */
                fieldControl: number;
                /** Type: UINT16 */
                manufacturerCode: number;
                /** Type: UINT16 */
                imageType: number;
                /** Type: UINT32 */
                fileVersion: number;
                /** Type: UINT16, Conditions: [{bitMaskSet param=fieldControl mask=1}] */
                hardwareVersion?: number;
            };
            /** ID: 3 | Response ID: 5 */
            imageBlockRequest: {
                /** Type: UINT8 */
                fieldControl: number;
                /** Type: UINT16 */
                manufacturerCode: number;
                /** Type: UINT16 */
                imageType: number;
                /** Type: UINT32 */
                fileVersion: number;
                /** Type: UINT32 */
                fileOffset: number;
                /** Type: UINT8 */
                maximumDataSize: number;
                /** Type: IEEE_ADDR, Conditions: [{bitMaskSet param=fieldControl mask=1}] */
                requestNodeIeeeAddress?: string;
                /** Type: UINT16, Conditions: [{bitMaskSet param=fieldControl mask=2}{minimumRemainingBufferBytes value=2}] */
                minimumBlockPeriod?: number;
            };
            /** ID: 4 | Response ID: 5 */
            imagePageRequest: {
                /** Type: UINT8 */
                fieldControl: number;
                /** Type: UINT16 */
                manufacturerCode: number;
                /** Type: UINT16 */
                imageType: number;
                /** Type: UINT32 */
                fileVersion: number;
                /** Type: UINT32 */
                fileOffset: number;
                /** Type: UINT8 */
                maximumDataSize: number;
                /** Type: UINT16 */
                pageSize: number;
                /** Type: UINT16 */
                responseSpacing: number;
                /** Type: IEEE_ADDR, Conditions: [{bitMaskSet param=fieldControl mask=1}] */
                requestNodeIeeeAddress?: string;
            };
            /** ID: 6 | Response ID: 7 */
            upgradeEndRequest: {
                /** Type: UINT8 */
                status: number;
                /** Type: UINT16 */
                manufacturerCode: number;
                /** Type: UINT16 */
                imageType: number;
                /** Type: UINT32 */
                fileVersion: number;
            };
            /** ID: 8 | Response ID: 9 */
            queryDeviceSpecificFileRequest: {
                /** Type: IEEE_ADDR */
                eui64: string;
                /** Type: UINT16 */
                manufacturerCode: number;
                /** Type: UINT16 */
                imageType: number;
                /** Type: UINT32 */
                fileVersion: number;
                /** Type: UINT16 */
                zigbeeStackVersion: number;
            };
        };
        commandResponses: {
            /** ID: 0 */
            imageNotify: {
                /** Type: UINT8 */
                payloadType: number;
                /** Type: UINT8 */
                queryJitter: number;
                /** Type: UINT16, Conditions: [{fieldGT field=payloadType value=0}] */
                manufacturerCode?: number;
                /** Type: UINT16, Conditions: [{fieldGT field=payloadType value=1}] */
                imageType?: number;
                /** Type: UINT32, Conditions: [{fieldGT field=payloadType value=2}] */
                fileVersion?: number;
            };
            /** ID: 2 */
            queryNextImageResponse: {
                /** Type: UINT8 */
                status: number;
                /** Type: UINT16, Conditions: [{fieldEquals field=status value=0}] */
                manufacturerCode?: number;
                /** Type: UINT16, Conditions: [{fieldEquals field=status value=0}] */
                imageType?: number;
                /** Type: UINT32, Conditions: [{fieldEquals field=status value=0}] */
                fileVersion?: number;
                /** Type: UINT32, Conditions: [{fieldEquals field=status value=0}] */
                imageSize?: number;
            };
            /** ID: 5 */
            imageBlockResponse: {
                /** Type: UINT8 */
                status: number;
                /** Type: UINT16, Conditions: [{fieldEquals field=status value=0}] */
                manufacturerCode?: number;
                /** Type: UINT16, Conditions: [{fieldEquals field=status value=0}] */
                imageType?: number;
                /** Type: UINT32, Conditions: [{fieldEquals field=status value=0}] */
                fileVersion?: number;
                /** Type: UINT32, Conditions: [{fieldEquals field=status value=0}] */
                fileOffset?: number;
                /** Type: UINT8, Conditions: [{fieldEquals field=status value=0}] */
                dataSize?: number;
                /** Type: BUFFER, Conditions: [{fieldEquals field=status value=0}] */
                data?: Buffer;
                /** Type: UINT32, Conditions: [{fieldEquals field=status value=151}] */
                currentTime?: number;
                /** Type: UINT32, Conditions: [{fieldEquals field=status value=151}] */
                requestTime?: number;
                /** Type: UINT16, Conditions: [{fieldEquals field=status value=151}] */
                minimumBlockPeriod?: number;
            };
            /** ID: 7 */
            upgradeEndResponse: {
                /** Type: UINT16 */
                manufacturerCode: number;
                /** Type: UINT16 */
                imageType: number;
                /** Type: UINT32 */
                fileVersion: number;
                /** Type: UINT32 */
                currentTime: number;
                /** Type: UINT32 */
                upgradeTime: number;
            };
            /** ID: 9 */
            queryDeviceSpecificFileResponse: {
                /** Type: UINT8 */
                status: number;
                /** Type: UINT16, Conditions: [{fieldEquals field=status value=0}] */
                manufacturerCode?: number;
                /** Type: UINT16, Conditions: [{fieldEquals field=status value=0}] */
                imageType?: number;
                /** Type: UINT32, Conditions: [{fieldEquals field=status value=0}] */
                fileVersion?: number;
                /** Type: UINT32, Conditions: [{fieldEquals field=status value=0}] */
                imageSize?: number;
            };
        };
    };
    genPollCtrl: {
        attributes: {
            /** ID: 0 | Type: UINT32 */
            checkinInterval: number;
            /** ID: 1 | Type: UINT32 */
            longPollInterval: number;
            /** ID: 2 | Type: UINT16 */
            shortPollInterval: number;
            /** ID: 3 | Type: UINT16 */
            fastPollTimeout: number;
            /** ID: 4 | Type: UINT32 */
            checkinIntervalMin: number;
            /** ID: 5 | Type: UINT32 */
            longPollIntervalMin: number;
            /** ID: 6 | Type: UINT16 */
            fastPollTimeoutMax: number;
        };
        commands: {
            /** ID: 0 */
            checkinRsp: {
                /** Type: BOOLEAN */
                startFastPolling: number;
                /** Type: UINT16 */
                fastPollTimeout: number;
            };
            /** ID: 1 */
            fastPollStop: Record<string, never>;
            /** ID: 2 */
            setLongPollInterval: {
                /** Type: UINT32 */
                newLongPollInterval: number;
            };
            /** ID: 3 */
            setShortPollInterval: {
                /** Type: UINT16 */
                newShortPollInterval: number;
            };
        };
        commandResponses: {
            /** ID: 0 */
            checkin: Record<string, never>;
        };
    };
    greenPower: {
        attributes: never;
        commands: {
            /** ID: 0 */
            notification: {
                /** Type: BITMAP16 */
                options: number;
                /** Type: UINT32, Conditions: [{bitFieldEnum param=options offset=0 size=3 value=0}] */
                srcID?: number;
                /** Type: IEEE_ADDR, Conditions: [{bitFieldEnum param=options offset=0 size=3 value=2}] */
                gpdIEEEAddr?: string;
                /** Type: UINT8, Conditions: [{bitFieldEnum param=options offset=0 size=3 value=2}] */
                gpdEndpoint?: number;
                /** Type: UINT32 */
                frameCounter: number;
                /** Type: UINT8 */
                commandID: number;
                /** Type: UINT8 */
                payloadSize: number;
                /** Type: GPD_FRAME, Conditions: [{bitMaskSet param=options mask=192 reversed=true}] */
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
                /** Type: UINT16, Conditions: [{bitMaskSet param=options mask=16384}] */
                gppNwkAddr?: number;
                /** Type: BITMAP8, Conditions: [{bitMaskSet param=options mask=16384}] */
                gppGpdLink?: number;
            };
            /** ID: 4 */
            commissioningNotification: {
                /** Type: BITMAP16 */
                options: number;
                /** Type: UINT32, Conditions: [{bitFieldEnum param=options offset=0 size=3 value=0}] */
                srcID?: number;
                /** Type: IEEE_ADDR, Conditions: [{bitFieldEnum param=options offset=0 size=3 value=2}] */
                gpdIEEEAddr?: string;
                /** Type: UINT8, Conditions: [{bitFieldEnum param=options offset=0 size=3 value=2}] */
                gpdEndpoint?: number;
                /** Type: UINT32 */
                frameCounter: number;
                /** Type: UINT8 */
                commandID: number;
                /** Type: UINT8 */
                payloadSize: number;
                /** Type: GPD_FRAME, Conditions: [{bitMaskSet param=options mask=48 reversed=true}{bitMaskSet param=options mask=512 reversed=true}] */
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
                /** Type: UINT16, Conditions: [{bitMaskSet param=options mask=2048}] */
                gppNwkAddr?: number;
                /** Type: BITMAP8, Conditions: [{bitMaskSet param=options mask=2048}] */
                gppGpdLink?: number;
                /** Type: UINT32, Conditions: [{bitMaskSet param=options mask=512}] */
                mic?: number;
            };
        };
        commandResponses: {
            /** ID: 6 */
            response: {
                /** Type: UINT8 */
                options: number;
                /** Type: UINT16 */
                tempMaster: number;
                /** Type: BITMAP8 */
                tempMasterTx: number;
                /** Type: UINT32, Conditions: [{bitFieldEnum param=options offset=0 size=3 value=0}] */
                srcID?: number;
                /** Type: IEEE_ADDR, Conditions: [{bitFieldEnum param=options offset=0 size=3 value=2}] */
                gpdIEEEAddr?: string;
                /** Type: UINT8, Conditions: [{bitFieldEnum param=options offset=0 size=3 value=2}] */
                gpdEndpoint?: number;
                /** Type: UINT8 */
                gpdCmd: number;
                /** Type: GPD_FRAME */
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
            /** ID: 1 */
            pairing: {
                /** Type: BITMAP24 */
                options: number;
                /** Type: UINT32, Conditions: [{bitFieldEnum param=options offset=0 size=3 value=0}] */
                srcID?: number;
                /** Type: IEEE_ADDR, Conditions: [{bitFieldEnum param=options offset=0 size=3 value=2}] */
                gpdIEEEAddr?: string;
                /** Type: UINT8, Conditions: [{bitFieldEnum param=options offset=0 size=3 value=2}] */
                gpdEndpoint?: number;
                /** Type: IEEE_ADDR, Conditions: [{bitFieldEnum param=options offset=4 size=3 value=6}] */
                sinkIEEEAddr?: string;
                /** Type: UINT16, Conditions: [{bitFieldEnum param=options offset=4 size=3 value=6}] */
                sinkNwkAddr?: number;
                /** Type: UINT16, Conditions: [{bitFieldEnum param=options offset=4 size=3 value=4}] */
                sinkGroupID?: number;
                /** Type: UINT8, Conditions: [{bitMaskSet param=options mask=8}] */
                deviceID?: number;
                /** Type: UINT32, Conditions: [{bitMaskSet param=options mask=16384}] */
                frameCounter?: number;
                /** Type: SEC_KEY, Conditions: [{bitMaskSet param=options mask=32768}] */
                gpdKey?: Buffer;
                /** Type: UINT16, Conditions: [{bitMaskSet param=options mask=65536}] */
                assignedAlias?: number;
                /** Type: UINT8, Conditions: [{bitMaskSet param=options mask=131072}] */
                groupcastRadius?: number;
            };
            /** ID: 2 */
            commisioningMode: {
                /** Type: BITMAP8 */
                options: number;
                /** Type: UINT16, Conditions: [{bitMaskSet param=options mask=2}] */
                commisioningWindow?: number;
                /** Type: UINT8, Conditions: [{bitMaskSet param=options mask=16}] */
                channel?: number;
            };
        };
    };
    mobileDeviceCfg: {
        attributes: {
            /** ID: 0 | Type: UINT16 */
            keepAliveTime: number;
            /** ID: 1 | Type: UINT16 */
            rejoinTimeout: number;
        };
        commands: never;
        commandResponses: never;
    };
    neighborCleaning: {
        attributes: {
            /** ID: 0 | Type: UINT16 */
            neighborCleaningTimeout: number;
        };
        commands: never;
        commandResponses: never;
    };
    nearestGateway: {
        attributes: {
            /** ID: 0 | Type: UINT16 */
            nearestGateway: number;
            /** ID: 1 | Type: UINT16 */
            newMobileNode: number;
        };
        commands: never;
        commandResponses: never;
    };
    closuresShadeCfg: {
        attributes: {
            /** ID: 0 | Type: UINT16 */
            physicalClosedLimit: number;
            /** ID: 1 | Type: UINT8 */
            motorStepSize: number;
            /** ID: 2 | Type: BITMAP8 */
            status: number;
            /** ID: 16 | Type: UINT16 */
            losedLimit: number;
            /** ID: 18 | Type: ENUM8 */
            mode: number;
        };
        commands: never;
        commandResponses: never;
    };
    closuresDoorLock: {
        attributes: {
            /** ID: 0 | Type: ENUM8 */
            lockState: number;
            /** ID: 38 | Type: BITMAP16 */
            lockType: number;
            /** ID: 2 | Type: BOOLEAN */
            actuatorEnabled: number;
            /** ID: 3 | Type: ENUM8 */
            doorState: number;
            /** ID: 4 | Type: UINT32 */
            doorOpenEvents: number;
            /** ID: 5 | Type: UINT32 */
            doorClosedEvents: number;
            /** ID: 6 | Type: UINT16 */
            openPeriod: number;
            /** ID: 16 | Type: UINT16 */
            numOfLockRecordsSupported: number;
            /** ID: 17 | Type: UINT16 */
            numOfTotalUsersSupported: number;
            /** ID: 18 | Type: UINT16 */
            numOfPinUsersSupported: number;
            /** ID: 19 | Type: UINT16 */
            numOfRfidUsersSupported: number;
            /** ID: 20 | Type: UINT8 */
            numOfWeekDaySchedulesSupportedPerUser: number;
            /** ID: 21 | Type: UINT8 */
            numOfYearDaySchedulesSupportedPerUser: number;
            /** ID: 22 | Type: UINT8 */
            numOfHolidayScheduledsSupported: number;
            /** ID: 23 | Type: UINT8 */
            maxPinLen: number;
            /** ID: 24 | Type: UINT8 */
            minPinLen: number;
            /** ID: 25 | Type: UINT8 */
            maxRfidLen: number;
            /** ID: 26 | Type: UINT8 */
            minRfidLen: number;
            /** ID: 32 | Type: BOOLEAN */
            enableLogging: number;
            /** ID: 33 | Type: CHAR_STR */
            language: string;
            /** ID: 34 | Type: UINT8 */
            ledSettings: number;
            /** ID: 35 | Type: UINT32 */
            autoRelockTime: number;
            /** ID: 36 | Type: UINT8 */
            soundVolume: number;
            /** ID: 37 | Type: UINT32 */
            operatingMode: number;
            /** ID: 39 | Type: BITMAP16 */
            defaultConfigurationRegister: number;
            /** ID: 40 | Type: BOOLEAN */
            enableLocalProgramming: number;
            /** ID: 41 | Type: BOOLEAN */
            enableOneTouchLocking: number;
            /** ID: 42 | Type: BOOLEAN */
            enableInsideStatusLed: number;
            /** ID: 43 | Type: BOOLEAN */
            enablePrivacyModeButton: number;
            /** ID: 48 | Type: UINT8 */
            wrongCodeEntryLimit: number;
            /** ID: 49 | Type: UINT8 */
            userCodeTemporaryDisableTime: number;
            /** ID: 50 | Type: BOOLEAN */
            sendPinOta: number;
            /** ID: 51 | Type: BOOLEAN */
            requirePinForRfOperation: number;
            /** ID: 52 | Type: UINT8 */
            zigbeeSecurityLevel: number;
            /** ID: 64 | Type: BITMAP16 */
            alarmMask: number;
            /** ID: 65 | Type: BITMAP16 */
            keypadOperationEventMask: number;
            /** ID: 66 | Type: BITMAP16 */
            rfOperationEventMask: number;
            /** ID: 67 | Type: BITMAP16 */
            manualOperationEventMask: number;
            /** ID: 68 | Type: BITMAP16 */
            rfidOperationEventMask: number;
            /** ID: 69 | Type: BITMAP16 */
            keypadProgrammingEventMask: number;
            /** ID: 70 | Type: BITMAP16 */
            rfProgrammingEventMask: number;
            /** ID: 71 | Type: BITMAP16 */
            rfidProgrammingEventMask: number;
        };
        commands: {
            /** ID: 0 | Response ID: 0 */
            lockDoor: {
                /** Type: CHAR_STR */
                pincodevalue: string;
            };
            /** ID: 1 | Response ID: 1 */
            unlockDoor: {
                /** Type: CHAR_STR */
                pincodevalue: string;
            };
            /** ID: 2 | Response ID: 2 */
            toggleDoor: {
                /** Type: CHAR_STR */
                pincodevalue: string;
            };
            /** ID: 3 | Response ID: 3 */
            unlockWithTimeout: {
                /** Type: UINT16 */
                timeout: number;
                /** Type: CHAR_STR */
                pincodevalue: string;
            };
            /** ID: 4 | Response ID: 4 */
            getLogRecord: {
                /** Type: UINT16 */
                logindex: number;
            };
            /** ID: 5 | Response ID: 5 */
            setPinCode: {
                /** Type: UINT16 */
                userid: number;
                /** Type: UINT8 */
                userstatus: number;
                /** Type: UINT8 */
                usertype: number;
                /** Type: CHAR_STR */
                pincodevalue: string;
            };
            /** ID: 6 | Response ID: 6 */
            getPinCode: {
                /** Type: UINT16 */
                userid: number;
            };
            /** ID: 7 | Response ID: 7 */
            clearPinCode: {
                /** Type: UINT16 */
                userid: number;
            };
            /** ID: 8 | Response ID: 8 */
            clearAllPinCodes: Record<string, never>;
            /** ID: 9 | Response ID: 9 */
            setUserStatus: {
                /** Type: UINT16 */
                userid: number;
                /** Type: UINT8 */
                userstatus: number;
            };
            /** ID: 10 | Response ID: 10 */
            getUserStatus: {
                /** Type: UINT16 */
                userid: number;
            };
            /** ID: 11 | Response ID: 11 */
            setWeekDaySchedule: {
                /** Type: UINT8 */
                scheduleid: number;
                /** Type: UINT16 */
                userid: number;
                /** Type: UINT8 */
                daysmask: number;
                /** Type: UINT8 */
                starthour: number;
                /** Type: UINT8 */
                startminute: number;
                /** Type: UINT8 */
                endhour: number;
                /** Type: UINT8 */
                endminute: number;
            };
            /** ID: 12 | Response ID: 12 */
            getWeekDaySchedule: {
                /** Type: UINT8 */
                scheduleid: number;
                /** Type: UINT16 */
                userid: number;
            };
            /** ID: 13 | Response ID: 13 */
            clearWeekDaySchedule: {
                /** Type: UINT8 */
                scheduleid: number;
                /** Type: UINT16 */
                userid: number;
            };
            /** ID: 14 | Response ID: 14 */
            setYearDaySchedule: {
                /** Type: UINT8 */
                scheduleid: number;
                /** Type: UINT16 */
                userid: number;
                /** Type: UINT32 */
                zigbeelocalstarttime: number;
                /** Type: UINT32 */
                zigbeelocalendtime: number;
            };
            /** ID: 15 | Response ID: 15 */
            getYearDaySchedule: {
                /** Type: UINT8 */
                scheduleid: number;
                /** Type: UINT16 */
                userid: number;
            };
            /** ID: 16 | Response ID: 16 */
            clearYearDaySchedule: {
                /** Type: UINT8 */
                scheduleid: number;
                /** Type: UINT16 */
                userid: number;
            };
            /** ID: 17 | Response ID: 17 */
            setHolidaySchedule: {
                /** Type: UINT8 */
                holidayscheduleid: number;
                /** Type: UINT32 */
                zigbeelocalstarttime: number;
                /** Type: UINT32 */
                zigbeelocalendtime: number;
                /** Type: UINT8 */
                opermodelduringholiday: number;
            };
            /** ID: 18 | Response ID: 18 */
            getHolidaySchedule: {
                /** Type: UINT8 */
                holidayscheduleid: number;
            };
            /** ID: 19 | Response ID: 19 */
            clearHolidaySchedule: {
                /** Type: UINT8 */
                holidayscheduleid: number;
            };
            /** ID: 20 | Response ID: 20 */
            setUserType: {
                /** Type: UINT16 */
                userid: number;
                /** Type: UINT8 */
                usertype: number;
            };
            /** ID: 21 | Response ID: 21 */
            getUserType: {
                /** Type: UINT16 */
                userid: number;
            };
            /** ID: 22 | Response ID: 22 */
            setRfidCode: {
                /** Type: UINT16 */
                userid: number;
                /** Type: UINT8 */
                userstatus: number;
                /** Type: UINT8 */
                usertype: number;
                /** Type: CHAR_STR */
                pincodevalue: string;
            };
            /** ID: 23 | Response ID: 23 */
            getRfidCode: {
                /** Type: UINT16 */
                userid: number;
            };
            /** ID: 24 | Response ID: 24 */
            clearRfidCode: {
                /** Type: UINT16 */
                userid: number;
            };
            /** ID: 25 | Response ID: 25 */
            clearAllRfidCodes: Record<string, never>;
        };
        commandResponses: {
            /** ID: 0 */
            lockDoorRsp: {
                /** Type: UINT8 */
                status: number;
            };
            /** ID: 1 */
            unlockDoorRsp: {
                /** Type: UINT8 */
                status: number;
            };
            /** ID: 2 */
            toggleDoorRsp: {
                /** Type: UINT8 */
                status: number;
            };
            /** ID: 3 */
            unlockWithTimeoutRsp: {
                /** Type: UINT8 */
                status: number;
            };
            /** ID: 4 */
            getLogRecordRsp: {
                /** Type: UINT16 */
                logentryid: number;
                /** Type: UINT32 */
                timestamp: number;
                /** Type: UINT8 */
                eventtype: number;
                /** Type: UINT8 */
                source: number;
                /** Type: UINT8 */
                eventidalarmcode: number;
                /** Type: UINT16 */
                userid: number;
                /** Type: CHAR_STR */
                pincodevalue: string;
            };
            /** ID: 5 */
            setPinCodeRsp: {
                /** Type: UINT8 */
                status: number;
            };
            /** ID: 6 */
            getPinCodeRsp: {
                /** Type: UINT16 */
                userid: number;
                /** Type: UINT8 */
                userstatus: number;
                /** Type: UINT8 */
                usertype: number;
                /** Type: CHAR_STR */
                pincodevalue: string;
            };
            /** ID: 7 */
            clearPinCodeRsp: {
                /** Type: UINT8 */
                status: number;
            };
            /** ID: 8 */
            clearAllPinCodesRsp: {
                /** Type: UINT8 */
                status: number;
            };
            /** ID: 9 */
            setUserStatusRsp: {
                /** Type: UINT8 */
                status: number;
            };
            /** ID: 10 */
            getUserStatusRsp: {
                /** Type: UINT16 */
                userid: number;
                /** Type: UINT8 */
                userstatus: number;
            };
            /** ID: 11 */
            setWeekDayScheduleRsp: {
                /** Type: UINT8 */
                status: number;
            };
            /** ID: 12 */
            getWeekDayScheduleRsp: {
                /** Type: UINT8 */
                scheduleid: number;
                /** Type: UINT16 */
                userid: number;
                /** Type: UINT8 */
                status: number;
                /** Type: UINT8 */
                daysmask: number;
                /** Type: UINT8 */
                starthour: number;
                /** Type: UINT8 */
                startminute: number;
                /** Type: UINT8 */
                endhour: number;
                /** Type: UINT8 */
                endminute: number;
            };
            /** ID: 13 */
            clearWeekDayScheduleRsp: {
                /** Type: UINT8 */
                status: number;
            };
            /** ID: 14 */
            setYearDayScheduleRsp: {
                /** Type: UINT8 */
                status: number;
            };
            /** ID: 15 */
            getYearDayScheduleRsp: {
                /** Type: UINT8 */
                scheduleid: number;
                /** Type: UINT16 */
                userid: number;
                /** Type: UINT8 */
                status: number;
                /** Type: UINT32 */
                zigbeelocalstarttime: number;
                /** Type: UINT32 */
                zigbeelocalendtime: number;
            };
            /** ID: 16 */
            clearYearDayScheduleRsp: {
                /** Type: UINT8 */
                status: number;
            };
            /** ID: 17 */
            setHolidayScheduleRsp: {
                /** Type: UINT8 */
                status: number;
            };
            /** ID: 18 */
            getHolidayScheduleRsp: {
                /** Type: UINT8 */
                holidayscheduleid: number;
                /** Type: UINT8 */
                status: number;
                /** Type: UINT32 */
                zigbeelocalstarttime: number;
                /** Type: UINT32 */
                zigbeelocalendtime: number;
                /** Type: UINT8 */
                opermodelduringholiday: number;
            };
            /** ID: 19 */
            clearHolidayScheduleRsp: {
                /** Type: UINT8 */
                status: number;
            };
            /** ID: 20 */
            setUserTypeRsp: {
                /** Type: UINT8 */
                status: number;
            };
            /** ID: 21 */
            getUserTypeRsp: {
                /** Type: UINT16 */
                userid: number;
                /** Type: UINT8 */
                usertype: number;
            };
            /** ID: 22 */
            setRfidCodeRsp: {
                /** Type: UINT8 */
                status: number;
            };
            /** ID: 23 */
            getRfidCodeRsp: {
                /** Type: UINT16 */
                userid: number;
                /** Type: UINT8 */
                userstatus: number;
                /** Type: UINT8 */
                usertype: number;
                /** Type: CHAR_STR */
                pincodevalue: string;
            };
            /** ID: 24 */
            clearRfidCodeRsp: {
                /** Type: UINT8 */
                status: number;
            };
            /** ID: 25 */
            clearAllRfidCodesRsp: {
                /** Type: UINT8 */
                status: number;
            };
            /** ID: 32 */
            operationEventNotification: {
                /** Type: UINT8 */
                opereventsrc: number;
                /** Type: UINT8 */
                opereventcode: number;
                /** Type: UINT16 */
                userid: number;
                /** Type: OCTET_STR */
                pin: Buffer;
                /** Type: UINT32 */
                zigbeelocaltime: number;
                /** Type: UINT8 */
                data: number;
            };
            /** ID: 33 */
            programmingEventNotification: {
                /** Type: UINT8 */
                programeventsrc: number;
                /** Type: UINT8 */
                programeventcode: number;
                /** Type: UINT16 */
                userid: number;
                /** Type: OCTET_STR */
                pin: Buffer;
                /** Type: UINT8 */
                usertype: number;
                /** Type: UINT8 */
                userstatus: number;
                /** Type: UINT32 */
                zigbeelocaltime: number;
                /** Type: UINT8 */
                data: number;
            };
        };
    };
    closuresWindowCovering: {
        attributes: {
            /** ID: 0 | Type: ENUM8 */
            windowCoveringType: number;
            /** ID: 1 | Type: UINT16 */
            physicalClosedLimitLiftCm: number;
            /** ID: 2 | Type: UINT16 */
            physicalClosedLimitTiltDdegree: number;
            /** ID: 3 | Type: UINT16 */
            currentPositionLiftCm: number;
            /** ID: 4 | Type: UINT16 */
            currentPositionTiltDdegree: number;
            /** ID: 5 | Type: UINT16 */
            numOfActuationsLift: number;
            /** ID: 6 | Type: UINT16 */
            numOfActuationsTilt: number;
            /** ID: 7 | Type: BITMAP8 */
            configStatus: number;
            /** ID: 8 | Type: UINT8 */
            currentPositionLiftPercentage: number;
            /** ID: 9 | Type: UINT8 */
            currentPositionTiltPercentage: number;
            /** ID: 10 | Type: BITMAP8 */
            operationalStatus: number;
            /** ID: 16 | Type: UINT16 */
            installedOpenLimitLiftCm: number;
            /** ID: 17 | Type: UINT16 */
            installedClosedLimitLiftCm: number;
            /** ID: 18 | Type: UINT16 */
            installedOpenLimitTiltDdegree: number;
            /** ID: 19 | Type: UINT16 */
            installedClosedLimitTiltDdegree: number;
            /** ID: 20 | Type: UINT16 */
            velocityLift: number;
            /** ID: 21 | Type: UINT16 */
            accelerationTimeLift: number;
            /** ID: 22 | Type: UINT16 */
            decelerationTimeLift: number;
            /** ID: 23 | Type: BITMAP8 */
            windowCoveringMode: number;
            /** ID: 24 | Type: OCTET_STR */
            intermediateSetpointsLift: Buffer;
            /** ID: 25 | Type: OCTET_STR */
            intermediateSetpointsTilt: Buffer;
            /** ID: 61440 | Type: ENUM8 */
            tuyaMovingState: number;
            /** ID: 61441 | Type: ENUM8 */
            tuyaCalibration: number;
            /** ID: 61441 | Type: ENUM8 | Specific to manufacturer: LEGRAND_GROUP (4129) */
            stepPositionLift?: number;
            /** ID: 61442 | Type: ENUM8 */
            tuyaMotorReversal: number;
            /** ID: 61442 | Type: ENUM8 | Specific to manufacturer: LEGRAND_GROUP (4129) */
            calibrationMode?: number;
            /** ID: 61443 | Type: UINT16 */
            moesCalibrationTime: number;
            /** ID: 61443 | Type: ENUM8 | Specific to manufacturer: LEGRAND_GROUP (4129) */
            targetPositionTiltPercentage?: number;
            /** ID: 61444 | Type: ENUM8 | Specific to manufacturer: LEGRAND_GROUP (4129) */
            stepPositionTilt?: number;
            /** ID: 57344 | Type: UINT16 | Specific to manufacturer: ADEO (4727) */
            elkoDriveCloseDuration?: number;
            /** ID: 57360 | Type: BITMAP8 | Specific to manufacturer: ADEO (4727) */
            elkoProtectionStatus?: number;
            /** ID: 57363 | Type: BITMAP8 | Specific to manufacturer: ADEO (4727) */
            elkoProtectionSensor?: number;
            /** ID: 57362 | Type: UINT16 | Specific to manufacturer: ADEO (4727) */
            elkoSunProtectionIlluminanceThreshold?: number;
            /** ID: 57364 | Type: UINT16 | Specific to manufacturer: ADEO (4727) */
            elkoLiftDriveUpTime?: number;
            /** ID: 57365 | Type: UINT16 | Specific to manufacturer: ADEO (4727) */
            elkoLiftDriveDownTime?: number;
            /** ID: 57366 | Type: UINT16 | Specific to manufacturer: ADEO (4727) */
            elkoTiltOpenCloseAndStepTime?: number;
            /** ID: 57367 | Type: UINT8 | Specific to manufacturer: ADEO (4727) */
            elkoTiltPositionPercentageAfterMoveToLevel?: number;
            /** ID: 64705 | Type: UINT16 | Specific to manufacturer: NIKO_NV (4703) */
            nikoCalibrationTimeUp?: number;
            /** ID: 64706 | Type: UINT16 | Specific to manufacturer: NIKO_NV (4703) */
            nikoCalibrationTimeDown?: number;
        };
        commands: {
            /** ID: 0 */
            upOpen: Record<string, never>;
            /** ID: 1 */
            downClose: Record<string, never>;
            /** ID: 2 */
            stop: Record<string, never>;
            /** ID: 4 */
            goToLiftValue: {
                /** Type: UINT16 */
                liftvalue: number;
            };
            /** ID: 5 */
            goToLiftPercentage: {
                /** Type: UINT8 */
                percentageliftvalue: number;
            };
            /** ID: 7 */
            goToTiltValue: {
                /** Type: UINT16 */
                tiltvalue: number;
            };
            /** ID: 8 */
            goToTiltPercentage: {
                /** Type: UINT8 */
                percentagetiltvalue: number;
            };
            /** ID: 128 */
            elkoStopOrStepLiftPercentage: {
                /** Type: UINT16 */
                direction: number;
                /** Type: UINT16 */
                stepvalue: number;
            };
        };
        commandResponses: never;
    };
    barrierControl: {
        attributes: {
            /** ID: 1 | Type: ENUM8 */
            movingState: number;
            /** ID: 2 | Type: BITMAP16 */
            safetyStatus: number;
            /** ID: 3 | Type: BITMAP8 */
            capabilities: number;
            /** ID: 4 | Type: UINT16 */
            openEvents: number;
            /** ID: 5 | Type: UINT16 */
            closeEvents: number;
            /** ID: 6 | Type: UINT16 */
            commandOpenEvents: number;
            /** ID: 7 | Type: UINT16 */
            commandCloseEvents: number;
            /** ID: 8 | Type: UINT16 */
            openPeriod: number;
            /** ID: 9 | Type: UINT16 */
            closePeriod: number;
            /** ID: 10 | Type: UINT8 */
            barrierPosition: number;
        };
        commands: {
            /** ID: 0 */
            goToPercent: {
                /** Type: UINT8 */
                percentOpen: number;
            };
            /** ID: 1 */
            stop: Record<string, never>;
        };
        commandResponses: never;
    };
    hvacPumpCfgCtrl: {
        attributes: {
            /** ID: 0 | Type: INT16 */
            maxPressure: number;
            /** ID: 1 | Type: UINT16 */
            maxSpeed: number;
            /** ID: 2 | Type: UINT16 */
            maxFlow: number;
            /** ID: 3 | Type: INT16 */
            minConstPressure: number;
            /** ID: 4 | Type: INT16 */
            maxConstPressure: number;
            /** ID: 5 | Type: INT16 */
            minCompPressure: number;
            /** ID: 6 | Type: INT16 */
            maxCompPressure: number;
            /** ID: 7 | Type: UINT16 */
            minConstSpeed: number;
            /** ID: 8 | Type: UINT16 */
            maxConstSpeed: number;
            /** ID: 9 | Type: UINT16 */
            minConstFlow: number;
            /** ID: 10 | Type: UINT16 */
            maxConstFlow: number;
            /** ID: 11 | Type: INT16 */
            minConstTemp: number;
            /** ID: 12 | Type: INT16 */
            maxConstTemp: number;
            /** ID: 16 | Type: BITMAP16 */
            pumpStatus: number;
            /** ID: 17 | Type: ENUM8 */
            effectiveOperationMode: number;
            /** ID: 18 | Type: ENUM8 */
            effectiveControlMode: number;
            /** ID: 19 | Type: INT16 */
            capacity: number;
            /** ID: 20 | Type: UINT16 */
            speed: number;
            /** ID: 21 | Type: UINT24 */
            lifetimeRunningHours: number;
            /** ID: 22 | Type: UINT24 */
            power: number;
            /** ID: 23 | Type: UINT32 */
            lifetimeEnergyConsumed: number;
            /** ID: 32 | Type: ENUM8 */
            operationMode: number;
            /** ID: 33 | Type: ENUM8 */
            controlMode: number;
            /** ID: 34 | Type: BITMAP16 */
            alarmMask: number;
        };
        commands: never;
        commandResponses: never;
    };
    hvacThermostat: {
        attributes: {
            /** ID: 0 | Type: INT16 */
            localTemp: number;
            /** ID: 1 | Type: INT16 */
            outdoorTemp: number;
            /** ID: 2 | Type: BITMAP8 */
            occupancy: number;
            /** ID: 3 | Type: INT16 */
            absMinHeatSetpointLimit: number;
            /** ID: 4 | Type: INT16 */
            absMaxHeatSetpointLimit: number;
            /** ID: 5 | Type: INT16 */
            absMinCoolSetpointLimit: number;
            /** ID: 6 | Type: INT16 */
            absMaxCoolSetpointLimit: number;
            /** ID: 7 | Type: UINT8 */
            pICoolingDemand: number;
            /** ID: 8 | Type: UINT8 */
            pIHeatingDemand: number;
            /** ID: 9 | Type: BITMAP8 */
            systemTypeConfig: number;
            /** ID: 16 | Type: INT8 */
            localTemperatureCalibration: number;
            /** ID: 17 | Type: INT16 */
            occupiedCoolingSetpoint: number;
            /** ID: 18 | Type: INT16 */
            occupiedHeatingSetpoint: number;
            /** ID: 19 | Type: INT16 */
            unoccupiedCoolingSetpoint: number;
            /** ID: 20 | Type: INT16 */
            unoccupiedHeatingSetpoint: number;
            /** ID: 21 | Type: INT16 */
            minHeatSetpointLimit: number;
            /** ID: 22 | Type: INT16 */
            maxHeatSetpointLimit: number;
            /** ID: 23 | Type: INT16 */
            minCoolSetpointLimit: number;
            /** ID: 24 | Type: INT16 */
            maxCoolSetpointLimit: number;
            /** ID: 25 | Type: INT8 */
            minSetpointDeadBand: number;
            /** ID: 26 | Type: BITMAP8 */
            remoteSensing: number;
            /** ID: 27 | Type: ENUM8 */
            ctrlSeqeOfOper: number;
            /** ID: 28 | Type: ENUM8 */
            systemMode: number;
            /** ID: 29 | Type: BITMAP8 */
            alarmMask: number;
            /** ID: 30 | Type: ENUM8 */
            runningMode: number;
            /** ID: 32 | Type: ENUM8 */
            startOfWeek: number;
            /** ID: 33 | Type: UINT8 */
            numberOfWeeklyTrans: number;
            /** ID: 34 | Type: UINT8 */
            numberOfDailyTrans: number;
            /** ID: 35 | Type: ENUM8 */
            tempSetpointHold: number;
            /** ID: 36 | Type: UINT16 */
            tempSetpointHoldDuration: number;
            /** ID: 37 | Type: BITMAP8 */
            programingOperMode: number;
            /** ID: 41 | Type: BITMAP16 */
            runningState: number;
            /** ID: 48 | Type: ENUM8 */
            setpointChangeSource: number;
            /** ID: 49 | Type: INT16 */
            setpointChangeAmount: number;
            /** ID: 50 | Type: UTC */
            setpointChangeSourceTimeStamp: number;
            /** ID: 64 | Type: ENUM8 */
            acType: number;
            /** ID: 65 | Type: UINT16 */
            acCapacity: number;
            /** ID: 66 | Type: ENUM8 */
            acRefrigerantType: number;
            /** ID: 67 | Type: ENUM8 */
            acConpressorType: number;
            /** ID: 68 | Type: BITMAP32 */
            acErrorCode: number;
            /** ID: 69 | Type: ENUM8 */
            acLouverPosition: number;
            /** ID: 70 | Type: INT16 */
            acCollTemp: number;
            /** ID: 71 | Type: ENUM8 */
            acCapacityFormat: number;
            /** ID: 1024 | Type: ENUM8 | Specific to manufacturer: SINOPE_TECHNOLOGIES (4508) */
            SinopeOccupancy?: number;
            /** ID: 1025 | Type: UINT16 | Specific to manufacturer: SINOPE_TECHNOLOGIES (4508) */
            SinopeMainCycleOutput?: number;
            /** ID: 1026 | Type: ENUM8 | Specific to manufacturer: SINOPE_TECHNOLOGIES (4508) */
            SinopeBacklight?: number;
            /** ID: 1028 | Type: UINT16 | Specific to manufacturer: SINOPE_TECHNOLOGIES (4508) */
            SinopeAuxCycleOutput?: number;
            /** ID: 16412 | Type: ENUM8 */
            StelproSystemMode: number;
            /** ID: 16385 | Type: INT16 */
            StelproOutdoorTemp: number;
            /** ID: 16384 | Type: ENUM8 | Specific to manufacturer: VIESSMANN_ELEKTRONIK_GMBH (4641) */
            viessmannWindowOpenInternal?: number;
            /** ID: 16387 | Type: BOOLEAN | Specific to manufacturer: VIESSMANN_ELEKTRONIK_GMBH (4641) */
            viessmannWindowOpenForce?: number;
            /** ID: 16402 | Type: BOOLEAN | Specific to manufacturer: VIESSMANN_ELEKTRONIK_GMBH (4641) */
            viessmannAssemblyMode?: number;
            /** ID: 57616 | Type: ENUM8 | Specific to manufacturer: SCHNEIDER_ELECTRIC (4190) */
            schneiderWiserSpecific?: number;
            /** ID: 16384 | Type: ENUM8 | Specific to manufacturer: DANFOSS_A_S (4678) */
            danfossWindowOpenInternal?: number;
            /** ID: 16387 | Type: BOOLEAN | Specific to manufacturer: DANFOSS_A_S (4678) */
            danfossWindowOpenExternal?: number;
            /** ID: 16400 | Type: ENUM8 | Specific to manufacturer: DANFOSS_A_S (4678) */
            danfossDayOfWeek?: number;
            /** ID: 16401 | Type: UINT16 | Specific to manufacturer: DANFOSS_A_S (4678) */
            danfossTriggerTime?: number;
            /** ID: 16402 | Type: BOOLEAN | Specific to manufacturer: DANFOSS_A_S (4678) */
            danfossMountedModeActive?: number;
            /** ID: 16403 | Type: BOOLEAN | Specific to manufacturer: DANFOSS_A_S (4678) */
            danfossMountedModeControl?: number;
            /** ID: 16404 | Type: BOOLEAN | Specific to manufacturer: DANFOSS_A_S (4678) */
            danfossThermostatOrientation?: number;
            /** ID: 16405 | Type: INT16 | Specific to manufacturer: DANFOSS_A_S (4678) */
            danfossExternalMeasuredRoomSensor?: number;
            /** ID: 16406 | Type: BOOLEAN | Specific to manufacturer: DANFOSS_A_S (4678) */
            danfossRadiatorCovered?: number;
            /** ID: 16416 | Type: UINT8 | Specific to manufacturer: DANFOSS_A_S (4678) */
            danfossAlgorithmScaleFactor?: number;
            /** ID: 16432 | Type: BOOLEAN | Specific to manufacturer: DANFOSS_A_S (4678) */
            danfossHeatAvailable?: number;
            /** ID: 16433 | Type: BOOLEAN | Specific to manufacturer: DANFOSS_A_S (4678) */
            danfossHeatRequired?: number;
            /** ID: 16434 | Type: BOOLEAN | Specific to manufacturer: DANFOSS_A_S (4678) */
            danfossLoadBalancingEnable?: number;
            /** ID: 16448 | Type: INT16 | Specific to manufacturer: DANFOSS_A_S (4678) */
            danfossLoadRoomMean?: number;
            /** ID: 16458 | Type: INT16 | Specific to manufacturer: DANFOSS_A_S (4678) */
            danfossLoadEstimate?: number;
            /** ID: 16459 | Type: INT8 | Specific to manufacturer: DANFOSS_A_S (4678) */
            danfossRegulationSetpointOffset?: number;
            /** ID: 16460 | Type: ENUM8 | Specific to manufacturer: DANFOSS_A_S (4678) */
            danfossAdaptionRunControl?: number;
            /** ID: 16461 | Type: BITMAP8 | Specific to manufacturer: DANFOSS_A_S (4678) */
            danfossAdaptionRunStatus?: number;
            /** ID: 16462 | Type: BITMAP8 | Specific to manufacturer: DANFOSS_A_S (4678) */
            danfossAdaptionRunSettings?: number;
            /** ID: 16463 | Type: BOOLEAN | Specific to manufacturer: DANFOSS_A_S (4678) */
            danfossPreheatStatus?: number;
            /** ID: 16464 | Type: UINT32 | Specific to manufacturer: DANFOSS_A_S (4678) */
            danfossPreheatTime?: number;
            /** ID: 16465 | Type: BOOLEAN | Specific to manufacturer: DANFOSS_A_S (4678) */
            danfossWindowOpenFeatureEnable?: number;
            /** ID: 16640 | Type: BITMAP16 | Specific to manufacturer: DANFOSS_A_S (4678) */
            danfossRoomStatusCode?: number;
            /** ID: 16656 | Type: ENUM8 | Specific to manufacturer: DANFOSS_A_S (4678) */
            danfossOutputStatus?: number;
            /** ID: 16672 | Type: ENUM8 | Specific to manufacturer: DANFOSS_A_S (4678) */
            danfossRoomFloorSensorMode?: number;
            /** ID: 16673 | Type: INT16 | Specific to manufacturer: DANFOSS_A_S (4678) */
            danfossFloorMinSetpoint?: number;
            /** ID: 16674 | Type: INT16 | Specific to manufacturer: DANFOSS_A_S (4678) */
            danfossFloorMaxSetpoint?: number;
            /** ID: 16688 | Type: ENUM8 | Specific to manufacturer: DANFOSS_A_S (4678) */
            danfossScheduleTypeUsed?: number;
            /** ID: 16689 | Type: ENUM8 | Specific to manufacturer: DANFOSS_A_S (4678) */
            danfossIcon2PreHeat?: number;
            /** ID: 16719 | Type: ENUM8 | Specific to manufacturer: DANFOSS_A_S (4678) */
            danfossIcon2PreHeatStatus?: number;
            /** ID: 1025 | Type: UINT16 */
            elkoLoad: number;
            /** ID: 1026 | Type: CHAR_STR */
            elkoDisplayText: string;
            /** ID: 1027 | Type: ENUM8 */
            elkoSensor: number;
            /** ID: 1028 | Type: UINT8 */
            elkoRegulatorTime: number;
            /** ID: 1029 | Type: BOOLEAN */
            elkoRegulatorMode: number;
            /** ID: 1030 | Type: BOOLEAN */
            elkoPowerStatus: number;
            /** ID: 1031 | Type: OCTET_STR */
            elkoDateTime: Buffer;
            /** ID: 1032 | Type: UINT16 */
            elkoMeanPower: number;
            /** ID: 1033 | Type: INT16 */
            elkoExternalTemp: number;
            /** ID: 1041 | Type: BOOLEAN */
            elkoNightSwitching: number;
            /** ID: 1042 | Type: BOOLEAN */
            elkoFrostGuard: number;
            /** ID: 1043 | Type: BOOLEAN */
            elkoChildLock: number;
            /** ID: 1044 | Type: UINT8 */
            elkoMaxFloorTemp: number;
            /** ID: 1045 | Type: BOOLEAN */
            elkoRelayState: number;
            /** ID: 1046 | Type: OCTET_STR */
            elkoVersion: Buffer;
            /** ID: 1047 | Type: INT8 */
            elkoCalibration: number;
            /** ID: 1048 | Type: UINT8 */
            elkoLastMessageId: number;
            /** ID: 1049 | Type: UINT8 */
            elkoLastMessageStatus: number;
            /** ID: 257 | Type: UINT16 | Specific to manufacturer: ASTREL_GROUP_SRL (4209) */
            fourNoksHysteresisHigh?: number;
            /** ID: 258 | Type: UINT16 | Specific to manufacturer: ASTREL_GROUP_SRL (4209) */
            fourNoksHysteresisLow?: number;
        };
        commands: {
            /** ID: 0 */
            setpointRaiseLower: {
                /** Type: UINT8 */
                mode: number;
                /** Type: INT8 */
                amount: number;
            };
            /** ID: 1 */
            setWeeklySchedule: {
                /** Type: UINT8 */
                numoftrans: number;
                /** Type: UINT8 */
                dayofweek: number;
                /** Type: UINT8 */
                mode: number;
                /** Type: LIST_THERMO_TRANSITIONS */
                transitions: ThermoTransition[];
            };
            /** ID: 2 | Response ID: 0 */
            getWeeklySchedule: {
                /** Type: UINT8 */
                daystoreturn: number;
                /** Type: UINT8 */
                modetoreturn: number;
            };
            /** ID: 3 */
            clearWeeklySchedule: Record<string, never>;
            /** ID: 4 | Response ID: 1 */
            getRelayStatusLog: Record<string, never>;
            /** ID: 64 */
            danfossSetpointCommand: {
                /** Type: ENUM8 */
                setpointType: number;
                /** Type: INT16 */
                setpoint: number;
            };
            /** ID: 128 */
            schneiderWiserThermostatBoost: {
                /** Type: ENUM8 */
                command: number;
                /** Type: ENUM8 */
                enable: number;
                /** Type: UINT16 */
                temperature: number;
                /** Type: UINT16 */
                duration: number;
            };
            /** ID: 224 */
            wiserSmartSetSetpoint: {
                /** Type: UINT8 */
                operatingmode: number;
                /** Type: UINT8 */
                zonemode: number;
                /** Type: INT16 */
                setpoint: number;
                /** Type: UINT8 */
                reserved: number;
            };
            /** ID: 225 */
            wiserSmartSetFipMode: {
                /** Type: UINT8 */
                zonemode: number;
                /** Type: ENUM8 */
                fipmode: number;
                /** Type: UINT8 */
                reserved: number;
            };
            /** ID: 226 */
            wiserSmartCalibrateValve: Record<string, never>;
            /** ID: 160 */
            plugwiseCalibrateValve: Record<string, never>;
        };
        commandResponses: {
            /** ID: 0 */
            getWeeklyScheduleRsp: {
                /** Type: UINT8 */
                numoftrans: number;
                /** Type: UINT8 */
                dayofweek: number;
                /** Type: UINT8 */
                mode: number;
                /** Type: LIST_THERMO_TRANSITIONS */
                transitions: ThermoTransition[];
            };
            /** ID: 1 */
            getRelayStatusLogRsp: {
                /** Type: UINT16 */
                timeofday: number;
                /** Type: UINT16 */
                relaystatus: number;
                /** Type: UINT16 */
                localtemp: number;
                /** Type: UINT8 */
                humidity: number;
                /** Type: UINT16 */
                setpoint: number;
                /** Type: UINT16 */
                unreadentries: number;
            };
        };
    };
    hvacFanCtrl: {
        attributes: {
            /** ID: 0 | Type: ENUM8 */
            fanMode: number;
            /** ID: 1 | Type: ENUM8 */
            fanModeSequence: number;
        };
        commands: never;
        commandResponses: never;
    };
    hvacDehumidificationCtrl: {
        attributes: {
            /** ID: 0 | Type: UINT8 */
            relativeHumidity: number;
            /** ID: 1 | Type: UINT8 */
            dehumidCooling: number;
            /** ID: 16 | Type: UINT8 */
            rhDehumidSetpoint: number;
            /** ID: 17 | Type: ENUM8 */
            relativeHumidityMode: number;
            /** ID: 18 | Type: ENUM8 */
            dehumidLockout: number;
            /** ID: 19 | Type: UINT8 */
            dehumidHysteresis: number;
            /** ID: 20 | Type: UINT8 */
            dehumidMaxCool: number;
            /** ID: 21 | Type: ENUM8 */
            relativeHumidDisplay: number;
        };
        commands: never;
        commandResponses: never;
    };
    hvacUserInterfaceCfg: {
        attributes: {
            /** ID: 0 | Type: ENUM8 */
            tempDisplayMode: number;
            /** ID: 1 | Type: ENUM8 */
            keypadLockout: number;
            /** ID: 2 | Type: ENUM8 */
            programmingVisibility: number;
            /** ID: 16384 | Type: ENUM8 | Specific to manufacturer: DANFOSS_A_S (4678) */
            danfossViewingDirection?: number;
        };
        commands: never;
        commandResponses: never;
    };
    lightingColorCtrl: {
        attributes: {
            /** ID: 0 | Type: UINT8 */
            currentHue: number;
            /** ID: 1 | Type: UINT8 */
            currentSaturation: number;
            /** ID: 2 | Type: UINT16 */
            remainingTime: number;
            /** ID: 3 | Type: UINT16 */
            currentX: number;
            /** ID: 4 | Type: UINT16 */
            currentY: number;
            /** ID: 5 | Type: ENUM8 */
            driftCompensation: number;
            /** ID: 6 | Type: CHAR_STR */
            compensationText: string;
            /** ID: 7 | Type: UINT16 */
            colorTemperature: number;
            /** ID: 8 | Type: ENUM8 */
            colorMode: number;
            /** ID: 15 | Type: BITMAP8 */
            options: number;
            /** ID: 16 | Type: UINT8 */
            numPrimaries: number;
            /** ID: 17 | Type: UINT16 */
            primary1X: number;
            /** ID: 18 | Type: UINT16 */
            primary1Y: number;
            /** ID: 19 | Type: UINT8 */
            primary1Intensity: number;
            /** ID: 21 | Type: UINT16 */
            primary2X: number;
            /** ID: 22 | Type: UINT16 */
            primary2Y: number;
            /** ID: 23 | Type: UINT8 */
            primary2Intensity: number;
            /** ID: 25 | Type: UINT16 */
            primary3X: number;
            /** ID: 26 | Type: UINT16 */
            primary3Y: number;
            /** ID: 27 | Type: UINT8 */
            primary3Intensity: number;
            /** ID: 32 | Type: UINT16 */
            primary4X: number;
            /** ID: 33 | Type: UINT16 */
            primary4Y: number;
            /** ID: 34 | Type: UINT8 */
            primary4Intensity: number;
            /** ID: 36 | Type: UINT16 */
            primary5X: number;
            /** ID: 37 | Type: UINT16 */
            primary5Y: number;
            /** ID: 38 | Type: UINT8 */
            primary5Intensity: number;
            /** ID: 40 | Type: UINT16 */
            primary6X: number;
            /** ID: 41 | Type: UINT16 */
            primary6Y: number;
            /** ID: 42 | Type: UINT8 */
            primary6Intensity: number;
            /** ID: 48 | Type: UINT16 */
            whitePointX: number;
            /** ID: 49 | Type: UINT16 */
            whitePointY: number;
            /** ID: 50 | Type: UINT16 */
            colorPointRX: number;
            /** ID: 51 | Type: UINT16 */
            colorPointRY: number;
            /** ID: 52 | Type: UINT8 */
            colorPointRIntensity: number;
            /** ID: 54 | Type: UINT16 */
            colorPointGX: number;
            /** ID: 55 | Type: UINT16 */
            colorPointGY: number;
            /** ID: 56 | Type: UINT8 */
            colorPointGIntensity: number;
            /** ID: 58 | Type: UINT16 */
            colorPointBX: number;
            /** ID: 59 | Type: UINT16 */
            colorPointBY: number;
            /** ID: 60 | Type: UINT8 */
            colorPointBIntensity: number;
            /** ID: 16384 | Type: UINT16 */
            enhancedCurrentHue: number;
            /** ID: 16385 | Type: ENUM8 */
            enhancedColorMode: number;
            /** ID: 16386 | Type: UINT8 */
            colorLoopActive: number;
            /** ID: 16387 | Type: UINT8 */
            colorLoopDirection: number;
            /** ID: 16388 | Type: UINT16 */
            colorLoopTime: number;
            /** ID: 16389 | Type: UINT16 */
            colorLoopStartEnhancedHue: number;
            /** ID: 16390 | Type: UINT16 */
            colorLoopStoredEnhancedHue: number;
            /** ID: 16394 | Type: UINT16 */
            colorCapabilities: number;
            /** ID: 16395 | Type: UINT16 */
            colorTempPhysicalMin: number;
            /** ID: 16396 | Type: UINT16 */
            colorTempPhysicalMax: number;
            /** ID: 16397 | Type: UINT16 */
            coupleColorTempToLevelMin: number;
            /** ID: 16400 | Type: UINT16 */
            startUpColorTemperature: number;
            /** ID: 61441 | Type: UINT8 */
            tuyaBrightness: number;
            /** ID: 61440 | Type: UINT8 */
            tuyaRgbMode: number;
        };
        commands: {
            /** ID: 0 */
            moveToHue: {
                /** Type: UINT8 */
                hue: number;
                /** Type: UINT8 */
                direction: number;
                /** Type: UINT16 */
                transtime: number;
            };
            /** ID: 1 */
            moveHue: {
                /** Type: UINT8 */
                movemode: number;
                /** Type: UINT8 */
                rate: number;
            };
            /** ID: 2 */
            stepHue: {
                /** Type: UINT8 */
                stepmode: number;
                /** Type: UINT8 */
                stepsize: number;
                /** Type: UINT8 */
                transtime: number;
            };
            /** ID: 3 */
            moveToSaturation: {
                /** Type: UINT8 */
                saturation: number;
                /** Type: UINT16 */
                transtime: number;
            };
            /** ID: 4 */
            moveSaturation: {
                /** Type: UINT8 */
                movemode: number;
                /** Type: UINT8 */
                rate: number;
            };
            /** ID: 5 */
            stepSaturation: {
                /** Type: UINT8 */
                stepmode: number;
                /** Type: UINT8 */
                stepsize: number;
                /** Type: UINT8 */
                transtime: number;
            };
            /** ID: 6 */
            moveToHueAndSaturation: {
                /** Type: UINT8 */
                hue: number;
                /** Type: UINT8 */
                saturation: number;
                /** Type: UINT16 */
                transtime: number;
            };
            /** ID: 6 */
            tuyaMoveToHueAndSaturationBrightness: {
                /** Type: UINT8 */
                hue: number;
                /** Type: UINT8 */
                saturation: number;
                /** Type: UINT16 */
                transtime: number;
                /** Type: UINT8 */
                brightness: number;
            };
            /** ID: 7 */
            moveToColor: {
                /** Type: UINT16 */
                colorx: number;
                /** Type: UINT16 */
                colory: number;
                /** Type: UINT16 */
                transtime: number;
            };
            /** ID: 8 */
            moveColor: {
                /** Type: INT16 */
                ratex: number;
                /** Type: INT16 */
                ratey: number;
            };
            /** ID: 9 */
            stepColor: {
                /** Type: INT16 */
                stepx: number;
                /** Type: INT16 */
                stepy: number;
                /** Type: UINT16 */
                transtime: number;
            };
            /** ID: 10 */
            moveToColorTemp: {
                /** Type: UINT16 */
                colortemp: number;
                /** Type: UINT16 */
                transtime: number;
            };
            /** ID: 64 */
            enhancedMoveToHue: {
                /** Type: UINT16 */
                enhancehue: number;
                /** Type: UINT8 */
                direction: number;
                /** Type: UINT16 */
                transtime: number;
            };
            /** ID: 65 */
            enhancedMoveHue: {
                /** Type: UINT8 */
                movemode: number;
                /** Type: UINT16 */
                rate: number;
            };
            /** ID: 66 */
            enhancedStepHue: {
                /** Type: UINT8 */
                stepmode: number;
                /** Type: UINT16 */
                stepsize: number;
                /** Type: UINT16 */
                transtime: number;
            };
            /** ID: 67 */
            enhancedMoveToHueAndSaturation: {
                /** Type: UINT16 */
                enhancehue: number;
                /** Type: UINT8 */
                saturation: number;
                /** Type: UINT16 */
                transtime: number;
            };
            /** ID: 68 */
            colorLoopSet: {
                /** Type: UINT8 */
                updateflags: number;
                /** Type: UINT8 */
                action: number;
                /** Type: UINT8 */
                direction: number;
                /** Type: UINT16 */
                time: number;
                /** Type: UINT16 */
                starthue: number;
            };
            /** ID: 71 */
            stopMoveStep: {
                /** Type: UINT8 */
                bits: number;
                /** Type: UINT8 */
                bytee: number;
                /** Type: UINT8 */
                action: number;
                /** Type: UINT8 */
                direction: number;
                /** Type: UINT16 */
                time: number;
                /** Type: UINT16 */
                starthue: number;
            };
            /** ID: 75 */
            moveColorTemp: {
                /** Type: UINT8 */
                movemode: number;
                /** Type: UINT16 */
                rate: number;
                /** Type: UINT16 */
                minimum: number;
                /** Type: UINT16 */
                maximum: number;
            };
            /** ID: 76 */
            stepColorTemp: {
                /** Type: UINT8 */
                stepmode: number;
                /** Type: UINT16 */
                stepsize: number;
                /** Type: UINT16 */
                transtime: number;
                /** Type: UINT16 */
                minimum: number;
                /** Type: UINT16 */
                maximum: number;
            };
            /** ID: 224 */
            tuyaSetMinimumBrightness: {
                /** Type: UINT16 */
                minimum: number;
            };
            /** ID: 225 */
            tuyaMoveToHueAndSaturationBrightness2: {
                /** Type: UINT16 */
                hue: number;
                /** Type: UINT16 */
                saturation: number;
                /** Type: UINT16 */
                brightness: number;
            };
            /** ID: 240 */
            tuyaRgbMode: {
                /** Type: UINT8 */
                enable: number;
            };
            /** ID: 249 */
            tuyaOnStartUp: {
                /** Type: UINT16 */
                mode: number;
                /** Type: LIST_UINT8 */
                data: number[];
            };
            /** ID: 250 */
            tuyaDoNotDisturb: {
                /** Type: UINT8 */
                enable: number;
            };
            /** ID: 251 */
            tuyaOnOffTransitionTime: {
                /** Type: UINT8 */
                unknown: number;
                /** Type: BIG_ENDIAN_UINT24 */
                onTransitionTime: number;
                /** Type: BIG_ENDIAN_UINT24 */
                offTransitionTime: number;
            };
        };
        commandResponses: never;
    };
    lightingBallastCfg: {
        attributes: {
            /** ID: 0 | Type: UINT8 */
            physicalMinLevel: number;
            /** ID: 1 | Type: UINT8 */
            physicalMaxLevel: number;
            /** ID: 2 | Type: BITMAP8 */
            ballastStatus: number;
            /** ID: 16 | Type: UINT8 */
            minLevel: number;
            /** ID: 17 | Type: UINT8 */
            maxLevel: number;
            /** ID: 18 | Type: UINT8 */
            powerOnLevel: number;
            /** ID: 19 | Type: UINT16 */
            powerOnFadeTime: number;
            /** ID: 20 | Type: UINT8 */
            intrinsicBallastFactor: number;
            /** ID: 21 | Type: UINT8 */
            ballastFactorAdjustment: number;
            /** ID: 32 | Type: UINT8 */
            lampQuantity: number;
            /** ID: 48 | Type: CHAR_STR */
            lampType: string;
            /** ID: 49 | Type: CHAR_STR */
            lampManufacturer: string;
            /** ID: 50 | Type: UINT24 */
            lampRatedHours: number;
            /** ID: 51 | Type: UINT24 */
            lampBurnHours: number;
            /** ID: 52 | Type: BITMAP8 */
            lampAlarmMode: number;
            /** ID: 53 | Type: UINT24 */
            lampBurnHoursTripPoint: number;
            /** ID: 57344 | Type: ENUM8 | Specific to manufacturer: ADEO (4727) */
            elkoControlMode?: number;
            /** ID: 57344 | Type: ENUM8 | Specific to manufacturer: SCHNEIDER_ELECTRIC (4190) */
            wiserControlMode?: number;
        };
        commands: never;
        commandResponses: never;
    };
    msIlluminanceMeasurement: {
        attributes: {
            /** ID: 0 | Type: UINT16 */
            measuredValue: number;
            /** ID: 1 | Type: UINT16 */
            minMeasuredValue: number;
            /** ID: 2 | Type: UINT16 */
            maxMeasuredValue: number;
            /** ID: 3 | Type: UINT16 */
            tolerance: number;
            /** ID: 4 | Type: ENUM8 */
            lightSensorType: number;
        };
        commands: never;
        commandResponses: never;
    };
    msIlluminanceLevelSensing: {
        attributes: {
            /** ID: 0 | Type: ENUM8 */
            levelStatus: number;
            /** ID: 1 | Type: ENUM8 */
            lightSensorType: number;
            /** ID: 16 | Type: UINT16 */
            illuminanceTargetLevel: number;
        };
        commands: never;
        commandResponses: never;
    };
    msTemperatureMeasurement: {
        attributes: {
            /** ID: 0 | Type: INT16 */
            measuredValue: number;
            /** ID: 1 | Type: INT16 */
            minMeasuredValue: number;
            /** ID: 2 | Type: INT16 */
            maxMeasuredValue: number;
            /** ID: 3 | Type: UINT16 */
            tolerance: number;
            /** ID: 16 | Type: UNKNOWN */
            minPercentChange: never;
            /** ID: 17 | Type: UNKNOWN */
            minAbsoluteChange: never;
            /** ID: 26112 | Type: INT16 | Specific to manufacturer: CUSTOM_SPRUT_DEVICE (26214) */
            sprutTemperatureOffset?: number;
        };
        commands: never;
        commandResponses: never;
    };
    msPressureMeasurement: {
        attributes: {
            /** ID: 0 | Type: INT16 */
            measuredValue: number;
            /** ID: 1 | Type: INT16 */
            minMeasuredValue: number;
            /** ID: 2 | Type: INT16 */
            maxMeasuredValue: number;
            /** ID: 3 | Type: UINT16 */
            tolerance: number;
            /** ID: 16 | Type: INT16 */
            scaledValue: number;
            /** ID: 17 | Type: INT16 */
            minScaledValue: number;
            /** ID: 18 | Type: INT16 */
            maxScaledValue: number;
            /** ID: 19 | Type: UINT16 */
            scaledTolerance: number;
            /** ID: 20 | Type: INT8 */
            scale: number;
        };
        commands: never;
        commandResponses: never;
    };
    msFlowMeasurement: {
        attributes: {
            /** ID: 0 | Type: UINT16 */
            measuredValue: number;
            /** ID: 1 | Type: UINT16 */
            minMeasuredValue: number;
            /** ID: 2 | Type: UINT16 */
            maxMeasuredValue: number;
            /** ID: 3 | Type: UINT16 */
            tolerance: number;
        };
        commands: never;
        commandResponses: never;
    };
    msRelativeHumidity: {
        attributes: {
            /** ID: 0 | Type: UINT16 */
            measuredValue: number;
            /** ID: 1 | Type: UINT16 */
            minMeasuredValue: number;
            /** ID: 2 | Type: UINT16 */
            maxMeasuredValue: number;
            /** ID: 3 | Type: UINT16 */
            tolerance: number;
            /** ID: 26112 | Type: BOOLEAN | Specific to manufacturer: CUSTOM_SPRUT_DEVICE (26214) */
            sprutHeater?: number;
        };
        commands: never;
        commandResponses: never;
    };
    msOccupancySensing: {
        attributes: {
            /** ID: 0 | Type: BITMAP8 */
            occupancy: number;
            /** ID: 1 | Type: ENUM8 */
            occupancySensorType: number;
            /** ID: 2 | Type: BITMAP8 */
            occupancySensorTypeBitmap: number;
            /** ID: 16 | Type: UINT16 */
            pirOToUDelay: number;
            /** ID: 17 | Type: UINT16 */
            pirUToODelay: number;
            /** ID: 18 | Type: UINT8 */
            pirUToOThreshold: number;
            /** ID: 32 | Type: UINT16 */
            ultrasonicOToUDelay: number;
            /** ID: 33 | Type: UINT16 */
            ultrasonicUToODelay: number;
            /** ID: 34 | Type: UINT8 */
            ultrasonicUToOThreshold: number;
            /** ID: 48 | Type: UINT16 */
            contactOToUDelay: number;
            /** ID: 49 | Type: UINT16 */
            contactUToODelay: number;
            /** ID: 50 | Type: UINT8 */
            contactUToOThreshold: number;
            /** ID: 57344 | Type: ENUM8 | Specific to manufacturer: ADEO (4727) */
            elkoOccupancyDfltOperationMode?: number;
            /** ID: 57345 | Type: ENUM8 | Specific to manufacturer: ADEO (4727) */
            elkoOccupancyOperationMode?: number;
            /** ID: 57346 | Type: UINT16 | Specific to manufacturer: ADEO (4727) */
            elkoForceOffTimeout?: number;
            /** ID: 57347 | Type: UINT8 | Specific to manufacturer: ADEO (4727) */
            elkoOccupancySensitivity?: number;
            /** ID: 26112 | Type: UINT16 | Specific to manufacturer: CUSTOM_SPRUT_DEVICE (26214) */
            sprutOccupancyLevel?: number;
            /** ID: 26113 | Type: UINT16 | Specific to manufacturer: CUSTOM_SPRUT_DEVICE (26214) */
            sprutOccupancySensitivity?: number;
        };
        commands: never;
        commandResponses: never;
    };
    msLeafWetness: {
        attributes: {
            /** ID: 0 | Type: UINT16 */
            measuredValue: number;
            /** ID: 1 | Type: UINT16 */
            minMeasuredValue: number;
            /** ID: 2 | Type: UINT16 */
            maxMeasuredValue: number;
            /** ID: 3 | Type: UINT16 */
            tolerance: number;
        };
        commands: never;
        commandResponses: never;
    };
    msSoilMoisture: {
        attributes: {
            /** ID: 0 | Type: UINT16 */
            measuredValue: number;
            /** ID: 1 | Type: UINT16 */
            minMeasuredValue: number;
            /** ID: 2 | Type: UINT16 */
            maxMeasuredValue: number;
            /** ID: 3 | Type: UINT16 */
            tolerance: number;
        };
        commands: never;
        commandResponses: never;
    };
    pHMeasurement: {
        attributes: {
            /** ID: 0 | Type: UINT16 */
            measuredValue: number;
            /** ID: 1 | Type: UINT16 */
            minMeasuredValue: number;
            /** ID: 2 | Type: UINT16 */
            maxMeasuredValue: number;
            /** ID: 3 | Type: UINT16 */
            tolerance: number;
        };
        commands: never;
        commandResponses: never;
    };
    msElectricalConductivity: {
        attributes: {
            /** ID: 0 | Type: UINT16 */
            measuredValue: number;
            /** ID: 1 | Type: UINT16 */
            minMeasuredValue: number;
            /** ID: 2 | Type: UINT16 */
            maxMeasuredValue: number;
            /** ID: 3 | Type: UINT16 */
            tolerance: number;
        };
        commands: never;
        commandResponses: never;
    };
    msWindSpeed: {
        attributes: {
            /** ID: 0 | Type: UINT16 */
            measuredValue: number;
            /** ID: 1 | Type: UINT16 */
            minMeasuredValue: number;
            /** ID: 2 | Type: UINT16 */
            maxMeasuredValue: number;
            /** ID: 3 | Type: UINT16 */
            tolerance: number;
        };
        commands: never;
        commandResponses: never;
    };
    msCarbonMonoxide: {
        attributes: {
            /** ID: 0 | Type: SINGLE_PREC */
            measuredValue: number;
            /** ID: 1 | Type: SINGLE_PREC */
            minMeasuredValue: number;
            /** ID: 2 | Type: SINGLE_PREC */
            maxMeasuredValue: number;
            /** ID: 3 | Type: SINGLE_PREC */
            tolerance: number;
        };
        commands: never;
        commandResponses: never;
    };
    msCO2: {
        attributes: {
            /** ID: 0 | Type: SINGLE_PREC */
            measuredValue: number;
            /** ID: 1 | Type: SINGLE_PREC */
            minMeasuredValue: number;
            /** ID: 2 | Type: SINGLE_PREC */
            maxMeasuredValue: number;
            /** ID: 3 | Type: SINGLE_PREC */
            tolerance: number;
            /** ID: 26112 | Type: BOOLEAN | Specific to manufacturer: CUSTOM_SPRUT_DEVICE (26214) */
            sprutCO2Calibration?: number;
            /** ID: 26113 | Type: BOOLEAN | Specific to manufacturer: CUSTOM_SPRUT_DEVICE (26214) */
            sprutCO2AutoCalibration?: number;
        };
        commands: never;
        commandResponses: never;
    };
    msEthylene: {
        attributes: {
            /** ID: 0 | Type: SINGLE_PREC */
            measuredValue: number;
            /** ID: 1 | Type: SINGLE_PREC */
            minMeasuredValue: number;
            /** ID: 2 | Type: SINGLE_PREC */
            maxMeasuredValue: number;
            /** ID: 3 | Type: SINGLE_PREC */
            tolerance: number;
        };
        commands: never;
        commandResponses: never;
    };
    msEthyleneOxide: {
        attributes: {
            /** ID: 0 | Type: SINGLE_PREC */
            measuredValue: number;
            /** ID: 1 | Type: SINGLE_PREC */
            minMeasuredValue: number;
            /** ID: 2 | Type: SINGLE_PREC */
            maxMeasuredValue: number;
            /** ID: 3 | Type: SINGLE_PREC */
            tolerance: number;
        };
        commands: never;
        commandResponses: never;
    };
    msHydrogen: {
        attributes: {
            /** ID: 0 | Type: SINGLE_PREC */
            measuredValue: number;
            /** ID: 1 | Type: SINGLE_PREC */
            minMeasuredValue: number;
            /** ID: 2 | Type: SINGLE_PREC */
            maxMeasuredValue: number;
            /** ID: 3 | Type: SINGLE_PREC */
            tolerance: number;
        };
        commands: never;
        commandResponses: never;
    };
    msHydrogenSulfide: {
        attributes: {
            /** ID: 0 | Type: SINGLE_PREC */
            measuredValue: number;
            /** ID: 1 | Type: SINGLE_PREC */
            minMeasuredValue: number;
            /** ID: 2 | Type: SINGLE_PREC */
            maxMeasuredValue: number;
            /** ID: 3 | Type: SINGLE_PREC */
            tolerance: number;
        };
        commands: never;
        commandResponses: never;
    };
    msNitricOxide: {
        attributes: {
            /** ID: 0 | Type: SINGLE_PREC */
            measuredValue: number;
            /** ID: 1 | Type: SINGLE_PREC */
            minMeasuredValue: number;
            /** ID: 2 | Type: SINGLE_PREC */
            maxMeasuredValue: number;
            /** ID: 3 | Type: SINGLE_PREC */
            tolerance: number;
        };
        commands: never;
        commandResponses: never;
    };
    msNitrogenDioxide: {
        attributes: {
            /** ID: 0 | Type: SINGLE_PREC */
            measuredValue: number;
            /** ID: 1 | Type: SINGLE_PREC */
            minMeasuredValue: number;
            /** ID: 2 | Type: SINGLE_PREC */
            maxMeasuredValue: number;
            /** ID: 3 | Type: SINGLE_PREC */
            tolerance: number;
        };
        commands: never;
        commandResponses: never;
    };
    msOxygen: {
        attributes: {
            /** ID: 0 | Type: SINGLE_PREC */
            measuredValue: number;
            /** ID: 1 | Type: SINGLE_PREC */
            minMeasuredValue: number;
            /** ID: 2 | Type: SINGLE_PREC */
            maxMeasuredValue: number;
            /** ID: 3 | Type: SINGLE_PREC */
            tolerance: number;
        };
        commands: never;
        commandResponses: never;
    };
    msOzone: {
        attributes: {
            /** ID: 0 | Type: SINGLE_PREC */
            measuredValue: number;
            /** ID: 1 | Type: SINGLE_PREC */
            minMeasuredValue: number;
            /** ID: 2 | Type: SINGLE_PREC */
            maxMeasuredValue: number;
            /** ID: 3 | Type: SINGLE_PREC */
            tolerance: number;
        };
        commands: never;
        commandResponses: never;
    };
    msSulfurDioxide: {
        attributes: {
            /** ID: 0 | Type: SINGLE_PREC */
            measuredValue: number;
            /** ID: 1 | Type: SINGLE_PREC */
            minMeasuredValue: number;
            /** ID: 2 | Type: SINGLE_PREC */
            maxMeasuredValue: number;
            /** ID: 3 | Type: SINGLE_PREC */
            tolerance: number;
        };
        commands: never;
        commandResponses: never;
    };
    msDissolvedOxygen: {
        attributes: {
            /** ID: 0 | Type: SINGLE_PREC */
            measuredValue: number;
            /** ID: 1 | Type: SINGLE_PREC */
            minMeasuredValue: number;
            /** ID: 2 | Type: SINGLE_PREC */
            maxMeasuredValue: number;
            /** ID: 3 | Type: SINGLE_PREC */
            tolerance: number;
        };
        commands: never;
        commandResponses: never;
    };
    msBromate: {
        attributes: {
            /** ID: 0 | Type: SINGLE_PREC */
            measuredValue: number;
            /** ID: 1 | Type: SINGLE_PREC */
            minMeasuredValue: number;
            /** ID: 2 | Type: SINGLE_PREC */
            maxMeasuredValue: number;
            /** ID: 3 | Type: SINGLE_PREC */
            tolerance: number;
        };
        commands: never;
        commandResponses: never;
    };
    msChloramines: {
        attributes: {
            /** ID: 0 | Type: SINGLE_PREC */
            measuredValue: number;
            /** ID: 1 | Type: SINGLE_PREC */
            minMeasuredValue: number;
            /** ID: 2 | Type: SINGLE_PREC */
            maxMeasuredValue: number;
            /** ID: 3 | Type: SINGLE_PREC */
            tolerance: number;
        };
        commands: never;
        commandResponses: never;
    };
    msChlorine: {
        attributes: {
            /** ID: 0 | Type: SINGLE_PREC */
            measuredValue: number;
            /** ID: 1 | Type: SINGLE_PREC */
            minMeasuredValue: number;
            /** ID: 2 | Type: SINGLE_PREC */
            maxMeasuredValue: number;
            /** ID: 3 | Type: SINGLE_PREC */
            tolerance: number;
        };
        commands: never;
        commandResponses: never;
    };
    msFecalColiformAndEColi: {
        attributes: {
            /** ID: 0 | Type: SINGLE_PREC */
            measuredValue: number;
            /** ID: 1 | Type: SINGLE_PREC */
            minMeasuredValue: number;
            /** ID: 2 | Type: SINGLE_PREC */
            maxMeasuredValue: number;
            /** ID: 3 | Type: SINGLE_PREC */
            tolerance: number;
        };
        commands: never;
        commandResponses: never;
    };
    msFluoride: {
        attributes: {
            /** ID: 0 | Type: SINGLE_PREC */
            measuredValue: number;
            /** ID: 1 | Type: SINGLE_PREC */
            minMeasuredValue: number;
            /** ID: 2 | Type: SINGLE_PREC */
            maxMeasuredValue: number;
            /** ID: 3 | Type: SINGLE_PREC */
            tolerance: number;
        };
        commands: never;
        commandResponses: never;
    };
    msHaloaceticAcids: {
        attributes: {
            /** ID: 0 | Type: SINGLE_PREC */
            measuredValue: number;
            /** ID: 1 | Type: SINGLE_PREC */
            minMeasuredValue: number;
            /** ID: 2 | Type: SINGLE_PREC */
            maxMeasuredValue: number;
            /** ID: 3 | Type: SINGLE_PREC */
            tolerance: number;
        };
        commands: never;
        commandResponses: never;
    };
    msTotalTrihalomethanes: {
        attributes: {
            /** ID: 0 | Type: SINGLE_PREC */
            measuredValue: number;
            /** ID: 1 | Type: SINGLE_PREC */
            minMeasuredValue: number;
            /** ID: 2 | Type: SINGLE_PREC */
            maxMeasuredValue: number;
            /** ID: 3 | Type: SINGLE_PREC */
            tolerance: number;
        };
        commands: never;
        commandResponses: never;
    };
    msTotalColiformBacteria: {
        attributes: {
            /** ID: 0 | Type: SINGLE_PREC */
            measuredValue: number;
            /** ID: 1 | Type: SINGLE_PREC */
            minMeasuredValue: number;
            /** ID: 2 | Type: SINGLE_PREC */
            maxMeasuredValue: number;
            /** ID: 3 | Type: SINGLE_PREC */
            tolerance: number;
        };
        commands: never;
        commandResponses: never;
    };
    msTurbidity: {
        attributes: {
            /** ID: 0 | Type: SINGLE_PREC */
            measuredValue: number;
            /** ID: 1 | Type: SINGLE_PREC */
            minMeasuredValue: number;
            /** ID: 2 | Type: SINGLE_PREC */
            maxMeasuredValue: number;
            /** ID: 3 | Type: SINGLE_PREC */
            tolerance: number;
        };
        commands: never;
        commandResponses: never;
    };
    msCopper: {
        attributes: {
            /** ID: 0 | Type: SINGLE_PREC */
            measuredValue: number;
            /** ID: 1 | Type: SINGLE_PREC */
            minMeasuredValue: number;
            /** ID: 2 | Type: SINGLE_PREC */
            maxMeasuredValue: number;
            /** ID: 3 | Type: SINGLE_PREC */
            tolerance: number;
        };
        commands: never;
        commandResponses: never;
    };
    msLead: {
        attributes: {
            /** ID: 0 | Type: SINGLE_PREC */
            measuredValue: number;
            /** ID: 1 | Type: SINGLE_PREC */
            minMeasuredValue: number;
            /** ID: 2 | Type: SINGLE_PREC */
            maxMeasuredValue: number;
            /** ID: 3 | Type: SINGLE_PREC */
            tolerance: number;
        };
        commands: never;
        commandResponses: never;
    };
    msManganese: {
        attributes: {
            /** ID: 0 | Type: SINGLE_PREC */
            measuredValue: number;
            /** ID: 1 | Type: SINGLE_PREC */
            minMeasuredValue: number;
            /** ID: 2 | Type: SINGLE_PREC */
            maxMeasuredValue: number;
            /** ID: 3 | Type: SINGLE_PREC */
            tolerance: number;
        };
        commands: never;
        commandResponses: never;
    };
    msSulfate: {
        attributes: {
            /** ID: 0 | Type: SINGLE_PREC */
            measuredValue: number;
            /** ID: 1 | Type: SINGLE_PREC */
            minMeasuredValue: number;
            /** ID: 2 | Type: SINGLE_PREC */
            maxMeasuredValue: number;
            /** ID: 3 | Type: SINGLE_PREC */
            tolerance: number;
        };
        commands: never;
        commandResponses: never;
    };
    msBromodichloromethane: {
        attributes: {
            /** ID: 0 | Type: SINGLE_PREC */
            measuredValue: number;
            /** ID: 1 | Type: SINGLE_PREC */
            minMeasuredValue: number;
            /** ID: 2 | Type: SINGLE_PREC */
            maxMeasuredValue: number;
            /** ID: 3 | Type: SINGLE_PREC */
            tolerance: number;
        };
        commands: never;
        commandResponses: never;
    };
    msBromoform: {
        attributes: {
            /** ID: 0 | Type: SINGLE_PREC */
            measuredValue: number;
            /** ID: 1 | Type: SINGLE_PREC */
            minMeasuredValue: number;
            /** ID: 2 | Type: SINGLE_PREC */
            maxMeasuredValue: number;
            /** ID: 3 | Type: SINGLE_PREC */
            tolerance: number;
        };
        commands: never;
        commandResponses: never;
    };
    msChlorodibromomethane: {
        attributes: {
            /** ID: 0 | Type: SINGLE_PREC */
            measuredValue: number;
            /** ID: 1 | Type: SINGLE_PREC */
            minMeasuredValue: number;
            /** ID: 2 | Type: SINGLE_PREC */
            maxMeasuredValue: number;
            /** ID: 3 | Type: SINGLE_PREC */
            tolerance: number;
        };
        commands: never;
        commandResponses: never;
    };
    msChloroform: {
        attributes: {
            /** ID: 0 | Type: SINGLE_PREC */
            measuredValue: number;
            /** ID: 1 | Type: SINGLE_PREC */
            minMeasuredValue: number;
            /** ID: 2 | Type: SINGLE_PREC */
            maxMeasuredValue: number;
            /** ID: 3 | Type: SINGLE_PREC */
            tolerance: number;
        };
        commands: never;
        commandResponses: never;
    };
    msSodium: {
        attributes: {
            /** ID: 0 | Type: SINGLE_PREC */
            measuredValue: number;
            /** ID: 1 | Type: SINGLE_PREC */
            minMeasuredValue: number;
            /** ID: 2 | Type: SINGLE_PREC */
            maxMeasuredValue: number;
            /** ID: 3 | Type: SINGLE_PREC */
            tolerance: number;
        };
        commands: never;
        commandResponses: never;
    };
    pm25Measurement: {
        attributes: {
            /** ID: 0 | Type: SINGLE_PREC */
            measuredValue: number;
            /** ID: 1 | Type: SINGLE_PREC */
            measuredMinValue: number;
            /** ID: 2 | Type: SINGLE_PREC */
            measuredMaxValue: number;
            /** ID: 3 | Type: SINGLE_PREC */
            tolerance: number;
        };
        commands: never;
        commandResponses: never;
    };
    msFormaldehyde: {
        attributes: {
            /** ID: 0 | Type: SINGLE_PREC */
            measuredValue: number;
            /** ID: 1 | Type: SINGLE_PREC */
            minMeasuredValue: number;
            /** ID: 2 | Type: SINGLE_PREC */
            maxMeasuredValue: number;
            /** ID: 3 | Type: SINGLE_PREC */
            tolerance: number;
        };
        commands: never;
        commandResponses: never;
    };
    pm1Measurement: {
        attributes: {
            /** ID: 0 | Type: SINGLE_PREC */
            measuredValue: number;
            /** ID: 1 | Type: SINGLE_PREC */
            measuredMinValue: number;
            /** ID: 2 | Type: SINGLE_PREC */
            measuredMaxValue: number;
            /** ID: 3 | Type: SINGLE_PREC */
            tolerance: number;
        };
        commands: never;
        commandResponses: never;
    };
    pm10Measurement: {
        attributes: {
            /** ID: 0 | Type: SINGLE_PREC */
            measuredValue: number;
            /** ID: 1 | Type: SINGLE_PREC */
            measuredMinValue: number;
            /** ID: 2 | Type: SINGLE_PREC */
            measuredMaxValue: number;
            /** ID: 3 | Type: SINGLE_PREC */
            tolerance: number;
        };
        commands: never;
        commandResponses: never;
    };
    ssIasZone: {
        attributes: {
            /** ID: 0 | Type: ENUM8 */
            zoneState: number;
            /** ID: 1 | Type: ENUM16 */
            zoneType: number;
            /** ID: 2 | Type: BITMAP16 */
            zoneStatus: number;
            /** ID: 16 | Type: IEEE_ADDR */
            iasCieAddr: string;
            /** ID: 17 | Type: UINT8 */
            zoneId: number;
            /** ID: 18 | Type: UINT8 */
            numZoneSensitivityLevelsSupported: number;
            /** ID: 19 | Type: UINT8 */
            currentZoneSensitivityLevel: number;
            /** ID: 32769 | Type: UINT16 | Specific to manufacturer: DEVELCO (4117) */
            develcoAlarmOffDelay?: number;
        };
        commands: {
            /** ID: 0 */
            enrollRsp: {
                /** Type: UINT8 */
                enrollrspcode: number;
                /** Type: UINT8 */
                zoneid: number;
            };
            /** ID: 1 */
            initNormalOpMode: Record<string, never>;
            /** ID: 2 */
            initTestMode: Record<string, never>;
        };
        commandResponses: {
            /** ID: 0 */
            statusChangeNotification: {
                /** Type: UINT16 */
                zonestatus: number;
                /** Type: UINT8 */
                extendedstatus: number;
            };
            /** ID: 1 */
            enrollReq: {
                /** Type: UINT16 */
                zonetype: number;
                /** Type: UINT16 */
                manucode: number;
            };
        };
    };
    ssIasAce: {
        attributes: never;
        commands: {
            /** ID: 0 | Response ID: 0 */
            arm: {
                /** Type: UINT8 */
                armmode: number;
                /** Type: CHAR_STR */
                code: string;
                /** Type: UINT8 */
                zoneid: number;
            };
            /** ID: 1 */
            bypass: {
                /** Type: UINT8 */
                numofzones: number;
                /** Type: LIST_UINT8 */
                zoneidlist: number[];
            };
            /** ID: 2 */
            emergency: Record<string, never>;
            /** ID: 3 */
            fire: Record<string, never>;
            /** ID: 4 */
            panic: Record<string, never>;
            /** ID: 5 | Response ID: 1 */
            getZoneIDMap: Record<string, never>;
            /** ID: 6 | Response ID: 2 */
            getZoneInfo: {
                /** Type: UINT8 */
                zoneid: number;
            };
            /** ID: 7 | Response ID: 5 */
            getPanelStatus: Record<string, never>;
            /** ID: 8 */
            getBypassedZoneList: Record<string, never>;
            /** ID: 9 | Response ID: 8 */
            getZoneStatus: {
                /** Type: UINT8 */
                startzoneid: number;
                /** Type: UINT8 */
                maxnumzoneid: number;
                /** Type: UINT8 */
                zonestatusmaskflag: number;
                /** Type: UINT16 */
                zonestatusmask: number;
            };
        };
        commandResponses: {
            /** ID: 0 */
            armRsp: {
                /** Type: UINT8 */
                armnotification: number;
            };
            /** ID: 1 */
            getZoneIDMapRsp: {
                /** Type: UINT16 */
                zoneidmapsection0: number;
                /** Type: UINT16 */
                zoneidmapsection1: number;
                /** Type: UINT16 */
                zoneidmapsection2: number;
                /** Type: UINT16 */
                zoneidmapsection3: number;
                /** Type: UINT16 */
                zoneidmapsection4: number;
                /** Type: UINT16 */
                zoneidmapsection5: number;
                /** Type: UINT16 */
                zoneidmapsection6: number;
                /** Type: UINT16 */
                zoneidmapsection7: number;
                /** Type: UINT16 */
                zoneidmapsection8: number;
                /** Type: UINT16 */
                zoneidmapsection9: number;
                /** Type: UINT16 */
                zoneidmapsection10: number;
                /** Type: UINT16 */
                zoneidmapsection11: number;
                /** Type: UINT16 */
                zoneidmapsection12: number;
                /** Type: UINT16 */
                zoneidmapsection13: number;
                /** Type: UINT16 */
                zoneidmapsection14: number;
                /** Type: UINT16 */
                zoneidmapsection15: number;
            };
            /** ID: 2 */
            getZoneInfoRsp: {
                /** Type: UINT8 */
                zoneid: number;
                /** Type: UINT16 */
                zonetype: number;
                /** Type: IEEE_ADDR */
                ieeeaddr: string;
                /** Type: CHAR_STR */
                zonelabel: string;
            };
            /** ID: 3 */
            zoneStatusChanged: {
                /** Type: UINT8 */
                zoneid: number;
                /** Type: UINT16 */
                zonestatus: number;
                /** Type: UINT8 */
                audiblenotif: number;
                /** Type: CHAR_STR */
                zonelabel: string;
            };
            /** ID: 4 */
            panelStatusChanged: {
                /** Type: UINT8 */
                panelstatus: number;
                /** Type: UINT8 */
                secondsremain: number;
                /** Type: UINT8 */
                audiblenotif: number;
                /** Type: UINT8 */
                alarmstatus: number;
            };
            /** ID: 5 */
            getPanelStatusRsp: {
                /** Type: UINT8 */
                panelstatus: number;
                /** Type: UINT8 */
                secondsremain: number;
                /** Type: UINT8 */
                audiblenotif: number;
                /** Type: UINT8 */
                alarmstatus: number;
            };
            /** ID: 6 */
            setBypassedZoneList: {
                /** Type: UINT8 */
                numofzones: number;
                /** Type: LIST_UINT8 */
                zoneid: number[];
            };
            /** ID: 7 */
            bypassRsp: {
                /** Type: UINT8 */
                numofzones: number;
                /** Type: LIST_UINT8 */
                bypassresult: number[];
            };
            /** ID: 8 */
            getZoneStatusRsp: {
                /** Type: UINT8 */
                zonestatuscomplete: number;
                /** Type: UINT8 */
                numofzones: number;
                /** Type: LIST_ZONEINFO */
                zoneinfo: ZoneInfo[];
            };
        };
    };
    ssIasWd: {
        attributes: {
            /** ID: 0 | Type: UINT16 */
            maxDuration: number;
        };
        commands: {
            /** ID: 0 */
            startWarning: {
                /** Type: UINT8 */
                startwarninginfo: number;
                /** Type: UINT16 */
                warningduration: number;
                /** Type: UINT8 */
                strobedutycycle: number;
                /** Type: UINT8 */
                strobelevel: number;
            };
            /** ID: 1 */
            squawk: {
                /** Type: UINT8 */
                squawkinfo: number;
            };
        };
        commandResponses: never;
    };
    piGenericTunnel: {
        attributes: {
            /** ID: 1 | Type: UINT16 */
            maxIncomeTransSize: number;
            /** ID: 2 | Type: UINT16 */
            maxOutgoTransSize: number;
            /** ID: 3 | Type: OCTET_STR */
            protocolAddr: Buffer;
        };
        commands: {
            /** ID: 0 */
            matchProtocolAddr: {
                /** Type: CHAR_STR */
                protocoladdr: string;
            };
        };
        commandResponses: {
            /** ID: 0 */
            matchProtocolAddrRsp: {
                /** Type: IEEE_ADDR */
                devieeeaddr: string;
                /** Type: CHAR_STR */
                protocoladdr: string;
            };
            /** ID: 1 */
            advertiseProtocolAddr: {
                /** Type: CHAR_STR */
                protocoladdr: string;
            };
        };
    };
    piBacnetProtocolTunnel: {
        attributes: never;
        commands: {
            /** ID: 0 */
            transferNpdu: {
                /** Type: UINT8 */
                npdu: number;
            };
        };
        commandResponses: never;
    };
    piAnalogInputReg: {
        attributes: {
            /** ID: 22 | Type: SINGLE_PREC */
            covIncrement: number;
            /** ID: 31 | Type: CHAR_STR */
            deviceType: string;
            /** ID: 75 | Type: BAC_OID */
            objectId: number;
            /** ID: 77 | Type: CHAR_STR */
            objectName: string;
            /** ID: 79 | Type: ENUM16 */
            objectType: number;
            /** ID: 118 | Type: UINT8 */
            updateInterval: number;
            /** ID: 168 | Type: CHAR_STR */
            profileName: string;
        };
        commands: never;
        commandResponses: never;
    };
    piAnalogInputExt: {
        attributes: {
            /** ID: 0 | Type: BITMAP8 */
            ackedTransitions: number;
            /** ID: 17 | Type: UINT16 */
            notificationClass: number;
            /** ID: 25 | Type: SINGLE_PREC */
            deadband: number;
            /** ID: 35 | Type: BITMAP8 */
            eventEnable: number;
            /** ID: 36 | Type: ENUM8 */
            eventState: number;
            /** ID: 45 | Type: SINGLE_PREC */
            highLimit: number;
            /** ID: 52 | Type: BITMAP8 */
            limitEnable: number;
            /** ID: 59 | Type: SINGLE_PREC */
            lowLimit: number;
            /** ID: 72 | Type: ENUM8 */
            notifyType: number;
            /** ID: 113 | Type: UINT8 */
            timeDelay: number;
            /** ID: 130 | Type: ARRAY */
            eventTimeStamps: ZclArray | unknown[];
        };
        commands: {
            /** ID: 0 */
            transferApdu: Record<string, never>;
            /** ID: 1 */
            connectReq: Record<string, never>;
            /** ID: 2 */
            disconnectReq: Record<string, never>;
            /** ID: 3 */
            connectStatusNoti: Record<string, never>;
        };
        commandResponses: never;
    };
    piAnalogOutputReg: {
        attributes: {
            /** ID: 22 | Type: SINGLE_PREC */
            covIncrement: number;
            /** ID: 31 | Type: CHAR_STR */
            deviceType: string;
            /** ID: 75 | Type: BAC_OID */
            objectId: number;
            /** ID: 77 | Type: CHAR_STR */
            objectName: string;
            /** ID: 79 | Type: ENUM16 */
            objectType: number;
            /** ID: 118 | Type: UINT8 */
            updateInterval: number;
            /** ID: 168 | Type: CHAR_STR */
            profileName: string;
        };
        commands: never;
        commandResponses: never;
    };
    piAnalogOutputExt: {
        attributes: {
            /** ID: 0 | Type: BITMAP8 */
            ackedTransitions: number;
            /** ID: 17 | Type: UINT16 */
            notificationClass: number;
            /** ID: 25 | Type: SINGLE_PREC */
            deadband: number;
            /** ID: 35 | Type: BITMAP8 */
            eventEnable: number;
            /** ID: 36 | Type: ENUM8 */
            eventState: number;
            /** ID: 45 | Type: SINGLE_PREC */
            highLimit: number;
            /** ID: 52 | Type: BITMAP8 */
            limitEnable: number;
            /** ID: 59 | Type: SINGLE_PREC */
            lowLimit: number;
            /** ID: 72 | Type: ENUM8 */
            notifyType: number;
            /** ID: 113 | Type: UINT8 */
            timeDelay: number;
            /** ID: 130 | Type: ARRAY */
            eventTimeStamps: ZclArray | unknown[];
        };
        commands: never;
        commandResponses: never;
    };
    piAnalogValueReg: {
        attributes: {
            /** ID: 22 | Type: SINGLE_PREC */
            covIncrement: number;
            /** ID: 75 | Type: BAC_OID */
            objectId: number;
            /** ID: 77 | Type: CHAR_STR */
            objectName: string;
            /** ID: 79 | Type: ENUM16 */
            objectType: number;
            /** ID: 168 | Type: CHAR_STR */
            profileName: string;
        };
        commands: never;
        commandResponses: never;
    };
    piAnalogValueExt: {
        attributes: {
            /** ID: 0 | Type: BITMAP8 */
            ackedTransitions: number;
            /** ID: 17 | Type: UINT16 */
            notificationClass: number;
            /** ID: 25 | Type: SINGLE_PREC */
            deadband: number;
            /** ID: 35 | Type: BITMAP8 */
            eventEnable: number;
            /** ID: 36 | Type: ENUM8 */
            eventState: number;
            /** ID: 45 | Type: SINGLE_PREC */
            highLimit: number;
            /** ID: 52 | Type: BITMAP8 */
            limitEnable: number;
            /** ID: 59 | Type: SINGLE_PREC */
            lowLimit: number;
            /** ID: 72 | Type: ENUM8 */
            notifyType: number;
            /** ID: 113 | Type: UINT8 */
            timeDelay: number;
            /** ID: 130 | Type: ARRAY */
            eventTimeStamps: ZclArray | unknown[];
        };
        commands: never;
        commandResponses: never;
    };
    piBinaryInputReg: {
        attributes: {
            /** ID: 15 | Type: UINT32 */
            changeOfStateCount: number;
            /** ID: 16 | Type: STRUCT */
            changeOfStateTime: Struct;
            /** ID: 31 | Type: CHAR_STR */
            deviceType: string;
            /** ID: 33 | Type: UINT32 */
            elapsedActiveTime: number;
            /** ID: 75 | Type: BAC_OID */
            objectIdentifier: number;
            /** ID: 77 | Type: CHAR_STR */
            objectName: string;
            /** ID: 79 | Type: ENUM16 */
            objectType: number;
            /** ID: 114 | Type: STRUCT */
            timeOfATReset: Struct;
            /** ID: 115 | Type: STRUCT */
            timeOfSCReset: Struct;
            /** ID: 168 | Type: CHAR_STR */
            profileName: string;
        };
        commands: never;
        commandResponses: never;
    };
    piBinaryInputExt: {
        attributes: {
            /** ID: 0 | Type: BITMAP8 */
            ackedTransitions: number;
            /** ID: 6 | Type: BOOLEAN */
            alarmValue: number;
            /** ID: 17 | Type: UINT16 */
            notificationClass: number;
            /** ID: 35 | Type: BITMAP8 */
            eventEnable: number;
            /** ID: 36 | Type: ENUM8 */
            eventState: number;
            /** ID: 72 | Type: ENUM8 */
            notifyType: number;
            /** ID: 113 | Type: UINT8 */
            timeDelay: number;
            /** ID: 130 | Type: ARRAY */
            eventTimeStamps: ZclArray | unknown[];
        };
        commands: never;
        commandResponses: never;
    };
    piBinaryOutputReg: {
        attributes: {
            /** ID: 15 | Type: UINT32 */
            changeOfStateCount: number;
            /** ID: 16 | Type: STRUCT */
            changeOfStateTime: Struct;
            /** ID: 31 | Type: CHAR_STR */
            deviceType: string;
            /** ID: 33 | Type: UINT32 */
            elapsedActiveTime: number;
            /** ID: 40 | Type: ENUM8 */
            feedBackValue: number;
            /** ID: 75 | Type: BAC_OID */
            objectIdentifier: number;
            /** ID: 77 | Type: CHAR_STR */
            objectName: string;
            /** ID: 79 | Type: ENUM16 */
            objectType: number;
            /** ID: 114 | Type: STRUCT */
            timeOfATReset: Struct;
            /** ID: 115 | Type: STRUCT */
            timeOfSCReset: Struct;
            /** ID: 168 | Type: CHAR_STR */
            profileName: string;
        };
        commands: never;
        commandResponses: never;
    };
    piBinaryOutputExt: {
        attributes: {
            /** ID: 0 | Type: BITMAP8 */
            ackedTransitions: number;
            /** ID: 17 | Type: UINT16 */
            notificationClass: number;
            /** ID: 35 | Type: BITMAP8 */
            eventEnable: number;
            /** ID: 36 | Type: ENUM8 */
            eventState: number;
            /** ID: 72 | Type: ENUM8 */
            notifyType: number;
            /** ID: 113 | Type: UINT8 */
            timeDelay: number;
            /** ID: 130 | Type: ARRAY */
            eventTimeStamps: ZclArray | unknown[];
        };
        commands: never;
        commandResponses: never;
    };
    piBinaryValueReg: {
        attributes: {
            /** ID: 15 | Type: UINT32 */
            changeOfStateCount: number;
            /** ID: 16 | Type: STRUCT */
            changeOfStateTime: Struct;
            /** ID: 33 | Type: UINT32 */
            elapsedActiveTime: number;
            /** ID: 75 | Type: BAC_OID */
            objectIdentifier: number;
            /** ID: 77 | Type: CHAR_STR */
            objectName: string;
            /** ID: 79 | Type: ENUM16 */
            objectType: number;
            /** ID: 114 | Type: STRUCT */
            timeOfATReset: Struct;
            /** ID: 115 | Type: STRUCT */
            timeOfSCReset: Struct;
            /** ID: 168 | Type: CHAR_STR */
            profileName: string;
        };
        commands: never;
        commandResponses: never;
    };
    piBinaryValueExt: {
        attributes: {
            /** ID: 0 | Type: BITMAP8 */
            ackedTransitions: number;
            /** ID: 6 | Type: BOOLEAN */
            alarmValue: number;
            /** ID: 17 | Type: UINT16 */
            notificationClass: number;
            /** ID: 35 | Type: BITMAP8 */
            eventEnable: number;
            /** ID: 36 | Type: ENUM8 */
            eventState: number;
            /** ID: 72 | Type: ENUM8 */
            notifyType: number;
            /** ID: 113 | Type: UINT8 */
            timeDelay: number;
            /** ID: 130 | Type: ARRAY */
            eventTimeStamps: ZclArray | unknown[];
        };
        commands: never;
        commandResponses: never;
    };
    piMultistateInputReg: {
        attributes: {
            /** ID: 31 | Type: CHAR_STR */
            deviceType: string;
            /** ID: 75 | Type: BAC_OID */
            objectId: number;
            /** ID: 77 | Type: CHAR_STR */
            objectName: string;
            /** ID: 79 | Type: ENUM16 */
            objectType: number;
            /** ID: 168 | Type: CHAR_STR */
            profileName: string;
        };
        commands: never;
        commandResponses: never;
    };
    piMultistateInputExt: {
        attributes: {
            /** ID: 0 | Type: BITMAP8 */
            ackedTransitions: number;
            /** ID: 6 | Type: UINT16 */
            alarmValue: number;
            /** ID: 17 | Type: UINT16 */
            notificationClass: number;
            /** ID: 35 | Type: BITMAP8 */
            eventEnable: number;
            /** ID: 36 | Type: ENUM8 */
            eventState: number;
            /** ID: 37 | Type: UINT16 */
            faultValues: number;
            /** ID: 72 | Type: ENUM8 */
            notifyType: number;
            /** ID: 113 | Type: UINT8 */
            timeDelay: number;
            /** ID: 130 | Type: ARRAY */
            eventTimeStamps: ZclArray | unknown[];
        };
        commands: never;
        commandResponses: never;
    };
    piMultistateOutputReg: {
        attributes: {
            /** ID: 31 | Type: CHAR_STR */
            deviceType: string;
            /** ID: 40 | Type: ENUM8 */
            feedBackValue: number;
            /** ID: 75 | Type: BAC_OID */
            objectId: number;
            /** ID: 77 | Type: CHAR_STR */
            objectName: string;
            /** ID: 79 | Type: ENUM16 */
            objectType: number;
            /** ID: 168 | Type: CHAR_STR */
            profileName: string;
        };
        commands: never;
        commandResponses: never;
    };
    piMultistateOutputExt: {
        attributes: {
            /** ID: 0 | Type: BITMAP8 */
            ackedTransitions: number;
            /** ID: 17 | Type: UINT16 */
            notificationClass: number;
            /** ID: 35 | Type: BITMAP8 */
            eventEnable: number;
            /** ID: 36 | Type: ENUM8 */
            eventState: number;
            /** ID: 72 | Type: ENUM8 */
            notifyType: number;
            /** ID: 113 | Type: UINT8 */
            timeDelay: number;
            /** ID: 130 | Type: ARRAY */
            eventTimeStamps: ZclArray | unknown[];
        };
        commands: never;
        commandResponses: never;
    };
    piMultistateValueReg: {
        attributes: {
            /** ID: 75 | Type: BAC_OID */
            objectId: number;
            /** ID: 77 | Type: CHAR_STR */
            objectName: string;
            /** ID: 79 | Type: ENUM16 */
            objectType: number;
            /** ID: 168 | Type: CHAR_STR */
            profileName: string;
        };
        commands: never;
        commandResponses: never;
    };
    piMultistateValueExt: {
        attributes: {
            /** ID: 0 | Type: BITMAP8 */
            ackedTransitions: number;
            /** ID: 6 | Type: UINT16 */
            alarmValue: number;
            /** ID: 17 | Type: UINT16 */
            notificationClass: number;
            /** ID: 35 | Type: BITMAP8 */
            eventEnable: number;
            /** ID: 36 | Type: ENUM8 */
            eventState: number;
            /** ID: 37 | Type: UINT16 */
            faultValues: number;
            /** ID: 72 | Type: ENUM8 */
            notifyType: number;
            /** ID: 113 | Type: UINT8 */
            timeDelay: number;
            /** ID: 130 | Type: ARRAY */
            eventTimeStamps: ZclArray | unknown[];
        };
        commands: never;
        commandResponses: never;
    };
    pi11073ProtocolTunnel: {
        attributes: {
            /** ID: 0 | Type: ARRAY */
            deviceidList: ZclArray | unknown[];
            /** ID: 1 | Type: IEEE_ADDR */
            managerTarget: string;
            /** ID: 2 | Type: UINT8 */
            managerEndpoint: number;
            /** ID: 3 | Type: BOOLEAN */
            connected: number;
            /** ID: 4 | Type: BOOLEAN */
            preemptible: number;
            /** ID: 5 | Type: UINT16 */
            idleTimeout: number;
        };
        commands: {
            /** ID: 0 */
            transferApdu: Record<string, never>;
            /** ID: 1 */
            connectReq: Record<string, never>;
            /** ID: 2 */
            disconnectReq: Record<string, never>;
            /** ID: 3 */
            connectStatusNoti: Record<string, never>;
        };
        commandResponses: never;
    };
    piIso7818ProtocolTunnel: {
        attributes: {
            /** ID: 0 | Type: UINT8 */
            status: number;
        };
        commands: never;
        commandResponses: never;
    };
    piRetailTunnel: {
        attributes: {
            /** ID: 0 | Type: UINT16 */
            manufacturerCode: number;
            /** ID: 1 | Type: UINT16 */
            msProfile: number;
        };
        commands: never;
        commandResponses: never;
    };
    seMetering: {
        attributes: {
            /** ID: 0 | Type: UINT48 */
            currentSummDelivered: number;
            /** ID: 1 | Type: UINT48 */
            currentSummReceived: number;
            /** ID: 2 | Type: UINT48 */
            currentMaxDemandDelivered: number;
            /** ID: 3 | Type: UINT48 */
            currentMaxDemandReceived: number;
            /** ID: 4 | Type: UINT48 */
            dftSumm: number;
            /** ID: 5 | Type: UINT16 */
            dailyFreezeTime: number;
            /** ID: 6 | Type: INT8 */
            powerFactor: number;
            /** ID: 7 | Type: UTC */
            readingSnapshotTime: number;
            /** ID: 8 | Type: UTC */
            currentMaxDemandDeliverdTime: number;
            /** ID: 9 | Type: UTC */
            currentMaxDemandReceivedTime: number;
            /** ID: 10 | Type: UINT8 */
            defaultUpdatePeriod: number;
            /** ID: 11 | Type: UINT8 */
            fastPollUpdatePeriod: number;
            /** ID: 12 | Type: UINT48 */
            currentBlockPeriodConsumpDelivered: number;
            /** ID: 13 | Type: UINT24 */
            dailyConsumpTarget: number;
            /** ID: 14 | Type: ENUM8 */
            currentBlock: number;
            /** ID: 15 | Type: ENUM8 */
            profileIntervalPeriod: number;
            /** ID: 16 | Type: UINT16 */
            intervalReadReportingPeriod: number;
            /** ID: 17 | Type: UINT16 */
            presetReadingTime: number;
            /** ID: 18 | Type: UINT16 */
            volumePerReport: number;
            /** ID: 19 | Type: UINT8 */
            flowRestriction: number;
            /** ID: 20 | Type: ENUM8 */
            supplyStatus: number;
            /** ID: 21 | Type: UINT48 */
            currentInEnergyCarrierSumm: number;
            /** ID: 22 | Type: UINT48 */
            currentOutEnergyCarrierSumm: number;
            /** ID: 23 | Type: INT24 */
            inletTempreature: number;
            /** ID: 24 | Type: INT24 */
            outletTempreature: number;
            /** ID: 25 | Type: INT24 */
            controlTempreature: number;
            /** ID: 26 | Type: INT24 */
            currentInEnergyCarrierDemand: number;
            /** ID: 27 | Type: INT24 */
            currentOutEnergyCarrierDemand: number;
            /** ID: 29 | Type: UINT48 */
            currentBlockPeriodConsumpReceived: number;
            /** ID: 30 | Type: UINT48 */
            currentBlockReceived: number;
            /** ID: 31 | Type: UINT48 */
            DFTSummationReceived: number;
            /** ID: 32 | Type: ENUM8 */
            activeRegisterTierDelivered: number;
            /** ID: 33 | Type: ENUM8 */
            activeRegisterTierReceived: number;
            /** ID: 256 | Type: UINT48 */
            currentTier1SummDelivered: number;
            /** ID: 257 | Type: UINT48 */
            currentTier1SummReceived: number;
            /** ID: 258 | Type: UINT48 */
            currentTier2SummDelivered: number;
            /** ID: 259 | Type: UINT48 */
            currentTier2SummReceived: number;
            /** ID: 260 | Type: UINT48 */
            currentTier3SummDelivered: number;
            /** ID: 261 | Type: UINT48 */
            currentTier3SummReceived: number;
            /** ID: 262 | Type: UINT48 */
            currentTier4SummDelivered: number;
            /** ID: 263 | Type: UINT48 */
            currentTier4SummReceived: number;
            /** ID: 264 | Type: UINT48 */
            currentTier5SummDelivered: number;
            /** ID: 265 | Type: UINT48 */
            currentTier5SummReceived: number;
            /** ID: 266 | Type: UINT48 */
            currentTier6SummDelivered: number;
            /** ID: 267 | Type: UINT48 */
            currentTier6SummReceived: number;
            /** ID: 268 | Type: UINT48 */
            currentTier7SummDelivered: number;
            /** ID: 269 | Type: UINT48 */
            currentTier7SummReceived: number;
            /** ID: 270 | Type: UINT48 */
            currentTier8SummDelivered: number;
            /** ID: 271 | Type: UINT48 */
            currentTier8SummReceived: number;
            /** ID: 272 | Type: UINT48 */
            currentTier9SummDelivered: number;
            /** ID: 273 | Type: UINT48 */
            currentTier9SummReceived: number;
            /** ID: 274 | Type: UINT48 */
            currentTier10SummDelivered: number;
            /** ID: 275 | Type: UINT48 */
            currentTier10SummReceived: number;
            /** ID: 276 | Type: UINT48 */
            currentTier11SummDelivered: number;
            /** ID: 277 | Type: UINT48 */
            currentTier11SummReceived: number;
            /** ID: 278 | Type: UINT48 */
            currentTier12SummDelivered: number;
            /** ID: 279 | Type: UINT48 */
            currentTier12SummReceived: number;
            /** ID: 280 | Type: UINT48 */
            currentTier13SummDelivered: number;
            /** ID: 281 | Type: UINT48 */
            currentTier13SummReceived: number;
            /** ID: 282 | Type: UINT48 */
            currentTier14SummDelivered: number;
            /** ID: 283 | Type: UINT48 */
            currentTier14SummReceived: number;
            /** ID: 284 | Type: UINT48 */
            currentTier15SummDelivered: number;
            /** ID: 285 | Type: UINT48 */
            currentTier15SummReceived: number;
            /** ID: 512 | Type: BITMAP8 */
            status: number;
            /** ID: 513 | Type: UINT8 */
            remainingBattLife: number;
            /** ID: 514 | Type: UINT24 */
            hoursInOperation: number;
            /** ID: 515 | Type: UINT24 */
            hoursInFault: number;
            /** ID: 516 | Type: BITMAP64 */
            extendedStatus: bigint;
            /** ID: 768 | Type: ENUM8 */
            unitOfMeasure: number;
            /** ID: 769 | Type: UINT24 */
            multiplier: number;
            /** ID: 770 | Type: UINT24 */
            divisor: number;
            /** ID: 771 | Type: BITMAP8 */
            summaFormatting: number;
            /** ID: 772 | Type: BITMAP8 */
            demandFormatting: number;
            /** ID: 773 | Type: BITMAP8 */
            historicalConsumpFormatting: number;
            /** ID: 774 | Type: BITMAP8 */
            meteringDeviceType: number;
            /** ID: 775 | Type: OCTET_STR */
            siteId: Buffer;
            /** ID: 776 | Type: OCTET_STR */
            meterSerialNumber: Buffer;
            /** ID: 777 | Type: ENUM8 */
            energyCarrierUnitOfMeas: number;
            /** ID: 778 | Type: BITMAP8 */
            energyCarrierSummFormatting: number;
            /** ID: 779 | Type: BITMAP8 */
            energyCarrierDemandFormatting: number;
            /** ID: 780 | Type: ENUM8 */
            temperatureUnitOfMeas: number;
            /** ID: 781 | Type: BITMAP8 */
            temperatureFormatting: number;
            /** ID: 782 | Type: OCTET_STR */
            moduleSerialNumber: Buffer;
            /** ID: 783 | Type: OCTET_STR */
            operatingTariffLevel: Buffer;
            /** ID: 1024 | Type: INT24 */
            instantaneousDemand: number;
            /** ID: 1025 | Type: UINT24 */
            currentdayConsumpDelivered: number;
            /** ID: 1026 | Type: UINT24 */
            currentdayConsumpReceived: number;
            /** ID: 1027 | Type: UINT24 */
            previousdayConsumpDelivered: number;
            /** ID: 1028 | Type: UINT24 */
            previousdayConsumpReceived: number;
            /** ID: 1029 | Type: UTC */
            curPartProfileIntStartTimeDelivered: number;
            /** ID: 1030 | Type: UTC */
            curPartProfileIntStartTimeReceived: number;
            /** ID: 1031 | Type: UINT24 */
            curPartProfileIntValueDelivered: number;
            /** ID: 1032 | Type: UINT24 */
            curPartProfileIntValueReceived: number;
            /** ID: 1033 | Type: UINT48 */
            currentDayMaxPressure: number;
            /** ID: 1034 | Type: UINT48 */
            currentDayMinPressure: number;
            /** ID: 1035 | Type: UINT48 */
            previousDayMaxPressure: number;
            /** ID: 1036 | Type: UINT48 */
            previousDayMinPressure: number;
            /** ID: 1037 | Type: INT24 */
            currentDayMaxDemand: number;
            /** ID: 1038 | Type: INT24 */
            previousDayMaxDemand: number;
            /** ID: 1039 | Type: INT24 */
            currentMonthMaxDemand: number;
            /** ID: 1040 | Type: INT24 */
            currentYearMaxDemand: number;
            /** ID: 1041 | Type: INT24 */
            currentdayMaxEnergyCarrDemand: number;
            /** ID: 1042 | Type: INT24 */
            previousdayMaxEnergyCarrDemand: number;
            /** ID: 1043 | Type: INT24 */
            curMonthMaxEnergyCarrDemand: number;
            /** ID: 1044 | Type: INT24 */
            curMonthMinEnergyCarrDemand: number;
            /** ID: 1045 | Type: INT24 */
            curYearMaxEnergyCarrDemand: number;
            /** ID: 1046 | Type: INT24 */
            curYearMinEnergyCarrDemand: number;
            /** ID: 1280 | Type: UINT8 */
            maxNumberOfPeriodsDelivered: number;
            /** ID: 1536 | Type: UINT24 */
            currentDemandDelivered: number;
            /** ID: 1537 | Type: UINT24 */
            demandLimit: number;
            /** ID: 1538 | Type: UINT8 */
            demandIntegrationPeriod: number;
            /** ID: 1539 | Type: UINT8 */
            numberOfDemandSubintervals: number;
            /** ID: 1540 | Type: UINT16 */
            demandLimitArmDuration: number;
            /** ID: 2048 | Type: BITMAP16 */
            genericAlarmMask: number;
            /** ID: 2049 | Type: BITMAP32 */
            electricityAlarmMask: number;
            /** ID: 2050 | Type: BITMAP16 */
            genFlowPressureAlarmMask: number;
            /** ID: 2051 | Type: BITMAP16 */
            waterSpecificAlarmMask: number;
            /** ID: 2052 | Type: BITMAP16 */
            heatCoolSpecificAlarmMASK: number;
            /** ID: 2053 | Type: BITMAP16 */
            gasSpecificAlarmMask: number;
            /** ID: 2054 | Type: BITMAP48 */
            extendedGenericAlarmMask: number;
            /** ID: 2055 | Type: BITMAP16 */
            manufactureAlarmMask: number;
            /** ID: 2560 | Type: UINT32 */
            billToDate: number;
            /** ID: 2561 | Type: UTC */
            billToDateTimeStamp: number;
            /** ID: 2562 | Type: UINT32 */
            projectedBill: number;
            /** ID: 2563 | Type: UTC */
            projectedBillTimeStamp: number;
            /** ID: 768 | Type: UINT16 | Specific to manufacturer: DEVELCO (4117) */
            develcoPulseConfiguration?: number;
            /** ID: 769 | Type: UINT48 | Specific to manufacturer: DEVELCO (4117) */
            develcoCurrentSummation?: number;
            /** ID: 770 | Type: ENUM16 | Specific to manufacturer: DEVELCO (4117) */
            develcoInterfaceMode?: number;
            /** ID: 8192 | Type: INT24 | Specific to manufacturer: OWON_TECHNOLOGY_INC (4412) */
            owonL1PhasePower?: number;
            /** ID: 8193 | Type: INT24 | Specific to manufacturer: OWON_TECHNOLOGY_INC (4412) */
            owonL2PhasePower?: number;
            /** ID: 8194 | Type: INT24 | Specific to manufacturer: OWON_TECHNOLOGY_INC (4412) */
            owonL3PhasePower?: number;
            /** ID: 8448 | Type: INT24 | Specific to manufacturer: OWON_TECHNOLOGY_INC (4412) */
            owonL1PhaseReactivePower?: number;
            /** ID: 8449 | Type: INT24 | Specific to manufacturer: OWON_TECHNOLOGY_INC (4412) */
            owonL2PhaseReactivePower?: number;
            /** ID: 8450 | Type: INT24 | Specific to manufacturer: OWON_TECHNOLOGY_INC (4412) */
            owonL3PhaseReactivePower?: number;
            /** ID: 8451 | Type: INT24 | Specific to manufacturer: OWON_TECHNOLOGY_INC (4412) */
            owonReactivePowerSum?: number;
            /** ID: 12288 | Type: UINT24 | Specific to manufacturer: OWON_TECHNOLOGY_INC (4412) */
            owonL1PhaseVoltage?: number;
            /** ID: 12289 | Type: UINT24 | Specific to manufacturer: OWON_TECHNOLOGY_INC (4412) */
            owonL2PhaseVoltage?: number;
            /** ID: 12290 | Type: UINT24 | Specific to manufacturer: OWON_TECHNOLOGY_INC (4412) */
            owonL3PhaseVoltage?: number;
            /** ID: 12544 | Type: UINT24 | Specific to manufacturer: OWON_TECHNOLOGY_INC (4412) */
            owonL1PhaseCurrent?: number;
            /** ID: 12545 | Type: UINT24 | Specific to manufacturer: OWON_TECHNOLOGY_INC (4412) */
            owonL2PhaseCurrent?: number;
            /** ID: 12546 | Type: UINT24 | Specific to manufacturer: OWON_TECHNOLOGY_INC (4412) */
            owonL3PhaseCurrent?: number;
            /** ID: 12547 | Type: UINT24 | Specific to manufacturer: OWON_TECHNOLOGY_INC (4412) */
            owonCurrentSum?: number;
            /** ID: 12548 | Type: UINT24 | Specific to manufacturer: OWON_TECHNOLOGY_INC (4412) */
            owonLeakageCurrent?: number;
            /** ID: 16384 | Type: UINT48 | Specific to manufacturer: OWON_TECHNOLOGY_INC (4412) */
            owonL1Energy?: number;
            /** ID: 16385 | Type: UINT48 | Specific to manufacturer: OWON_TECHNOLOGY_INC (4412) */
            owonL2Energy?: number;
            /** ID: 16386 | Type: UINT48 | Specific to manufacturer: OWON_TECHNOLOGY_INC (4412) */
            owonL3Energy?: number;
            /** ID: 16640 | Type: UINT48 | Specific to manufacturer: OWON_TECHNOLOGY_INC (4412) */
            owonL1ReactiveEnergy?: number;
            /** ID: 16641 | Type: UINT48 | Specific to manufacturer: OWON_TECHNOLOGY_INC (4412) */
            owonL2ReactiveEnergy?: number;
            /** ID: 16642 | Type: UINT48 | Specific to manufacturer: OWON_TECHNOLOGY_INC (4412) */
            owonL3ReactiveEnergy?: number;
            /** ID: 16643 | Type: UINT48 | Specific to manufacturer: OWON_TECHNOLOGY_INC (4412) */
            owonReactiveEnergySum?: number;
            /** ID: 16644 | Type: INT8 | Specific to manufacturer: OWON_TECHNOLOGY_INC (4412) */
            owonL1PowerFactor?: number;
            /** ID: 16645 | Type: INT8 | Specific to manufacturer: OWON_TECHNOLOGY_INC (4412) */
            owonL2PowerFactor?: number;
            /** ID: 16646 | Type: INT8 | Specific to manufacturer: OWON_TECHNOLOGY_INC (4412) */
            owonL3PowerFactor?: number;
            /** ID: 20485 | Type: UINT8 | Specific to manufacturer: OWON_TECHNOLOGY_INC (4412) */
            owonFrequency?: number;
            /** ID: 4096 | Type: BITMAP8 | Specific to manufacturer: OWON_TECHNOLOGY_INC (4412) */
            owonReportMap?: number;
            /** ID: 20480 | Type: UINT32 | Specific to manufacturer: OWON_TECHNOLOGY_INC (4412) */
            owonLastHistoricalRecordTime?: number;
            /** ID: 20481 | Type: UINT32 | Specific to manufacturer: OWON_TECHNOLOGY_INC (4412) */
            owonOldestHistoricalRecordTime?: number;
            /** ID: 20482 | Type: UINT32 | Specific to manufacturer: OWON_TECHNOLOGY_INC (4412) */
            owonMinimumReportCycle?: number;
            /** ID: 20483 | Type: UINT32 | Specific to manufacturer: OWON_TECHNOLOGY_INC (4412) */
            owonMaximumReportCycle?: number;
            /** ID: 20484 | Type: UINT8 | Specific to manufacturer: OWON_TECHNOLOGY_INC (4412) */
            owonSentHistoricalRecordState?: number;
            /** ID: 20486 | Type: UINT8 | Specific to manufacturer: OWON_TECHNOLOGY_INC (4412) */
            owonAccumulativeEnergyThreshold?: number;
            /** ID: 20487 | Type: UINT8 | Specific to manufacturer: OWON_TECHNOLOGY_INC (4412) */
            owonReportMode?: number;
            /** ID: 20488 | Type: UINT8 | Specific to manufacturer: OWON_TECHNOLOGY_INC (4412) */
            owonPercentChangeInPower?: number;
            /** ID: 16400 | Type: INT48 | Specific to manufacturer: SCHNEIDER_ELECTRIC (4190) */
            schneiderActiveEnergyTotal?: number;
            /** ID: 16401 | Type: INT48 | Specific to manufacturer: SCHNEIDER_ELECTRIC (4190) */
            schneiderReactiveEnergyTotal?: number;
            /** ID: 16402 | Type: INT48 | Specific to manufacturer: SCHNEIDER_ELECTRIC (4190) */
            schneiderApparentEnergyTotal?: number;
            /** ID: 16404 | Type: INT48 | Specific to manufacturer: SCHNEIDER_ELECTRIC (4190) */
            schneiderPartialActiveEnergyTotal?: number;
            /** ID: 16405 | Type: INT48 | Specific to manufacturer: SCHNEIDER_ELECTRIC (4190) */
            schneiderPartialReactiveEnergyTotal?: number;
            /** ID: 16406 | Type: INT48 | Specific to manufacturer: SCHNEIDER_ELECTRIC (4190) */
            schneiderPartialApparentEnergyTotal?: number;
            /** ID: 16640 | Type: INT48 | Specific to manufacturer: SCHNEIDER_ELECTRIC (4190) */
            schneiderPartialActiveEnergyL1Phase?: number;
            /** ID: 16641 | Type: INT48 | Specific to manufacturer: SCHNEIDER_ELECTRIC (4190) */
            schneiderPartialReactiveEnergyL1Phase?: number;
            /** ID: 16642 | Type: INT48 | Specific to manufacturer: SCHNEIDER_ELECTRIC (4190) */
            schneiderPartialApparentEnergyL1Phase?: number;
            /** ID: 16643 | Type: INT48 | Specific to manufacturer: SCHNEIDER_ELECTRIC (4190) */
            schneiderActiveEnergyL1Phase?: number;
            /** ID: 16644 | Type: INT48 | Specific to manufacturer: SCHNEIDER_ELECTRIC (4190) */
            schneiderReactiveEnergyL1Phase?: number;
            /** ID: 16645 | Type: INT48 | Specific to manufacturer: SCHNEIDER_ELECTRIC (4190) */
            schneiderApparentEnergyL1Phase?: number;
            /** ID: 16896 | Type: INT48 | Specific to manufacturer: SCHNEIDER_ELECTRIC (4190) */
            schneiderPartialActiveEnergyL2Phase?: number;
            /** ID: 16897 | Type: INT48 | Specific to manufacturer: SCHNEIDER_ELECTRIC (4190) */
            schneiderPartialReactiveEnergyL2Phase?: number;
            /** ID: 16898 | Type: INT48 | Specific to manufacturer: SCHNEIDER_ELECTRIC (4190) */
            schneiderPartialApparentEnergyL2Phase?: number;
            /** ID: 16899 | Type: INT48 | Specific to manufacturer: SCHNEIDER_ELECTRIC (4190) */
            schneiderActiveEnergyL2Phase?: number;
            /** ID: 16900 | Type: INT48 | Specific to manufacturer: SCHNEIDER_ELECTRIC (4190) */
            schneiderReactiveEnergyL2Phase?: number;
            /** ID: 16901 | Type: INT48 | Specific to manufacturer: SCHNEIDER_ELECTRIC (4190) */
            schneiderApparentEnergyL2Phase?: number;
            /** ID: 17152 | Type: INT48 | Specific to manufacturer: SCHNEIDER_ELECTRIC (4190) */
            schneiderPartialActiveEnergyL3Phase?: number;
            /** ID: 17153 | Type: INT48 | Specific to manufacturer: SCHNEIDER_ELECTRIC (4190) */
            schneiderPartialReactiveEnergyL3Phase?: number;
            /** ID: 17154 | Type: INT48 | Specific to manufacturer: SCHNEIDER_ELECTRIC (4190) */
            schneiderPartialApparentEnergyL3Phase?: number;
            /** ID: 17155 | Type: INT48 | Specific to manufacturer: SCHNEIDER_ELECTRIC (4190) */
            schneiderActiveEnergyL3Phase?: number;
            /** ID: 17156 | Type: INT48 | Specific to manufacturer: SCHNEIDER_ELECTRIC (4190) */
            schneiderReactiveEnergyL3Phase?: number;
            /** ID: 17157 | Type: INT48 | Specific to manufacturer: SCHNEIDER_ELECTRIC (4190) */
            schneiderApparentEnergyL3Phase?: number;
            /** ID: 17408 | Type: UINT24 | Specific to manufacturer: SCHNEIDER_ELECTRIC (4190) */
            schneiderActiveEnergyMultiplier?: number;
            /** ID: 17409 | Type: UINT24 | Specific to manufacturer: SCHNEIDER_ELECTRIC (4190) */
            schneiderActiveEnergyDivisor?: number;
            /** ID: 17410 | Type: UINT24 | Specific to manufacturer: SCHNEIDER_ELECTRIC (4190) */
            schneiderReactiveEnergyMultiplier?: number;
            /** ID: 17411 | Type: UINT24 | Specific to manufacturer: SCHNEIDER_ELECTRIC (4190) */
            schneiderReactiveEnergyDivisor?: number;
            /** ID: 17412 | Type: UINT24 | Specific to manufacturer: SCHNEIDER_ELECTRIC (4190) */
            schneiderApparentEnergyMultiplier?: number;
            /** ID: 17413 | Type: UINT24 | Specific to manufacturer: SCHNEIDER_ELECTRIC (4190) */
            schneiderApparentEnergyDivisor?: number;
            /** ID: 17665 | Type: UTC | Specific to manufacturer: SCHNEIDER_ELECTRIC (4190) */
            schneiderEnergyResetDateTime?: number;
            /** ID: 17920 | Type: UINT16 | Specific to manufacturer: SCHNEIDER_ELECTRIC (4190) */
            schneiderEnergyCountersReportingPeriod?: number;
        };
        commands: {
            /** ID: 0 */
            getProfile: Record<string, never>;
            /** ID: 1 */
            reqMirror: Record<string, never>;
            /** ID: 2 */
            mirrorRem: Record<string, never>;
            /** ID: 3 */
            reqFastPollMode: Record<string, never>;
            /** ID: 4 */
            getSnapshot: Record<string, never>;
            /** ID: 5 */
            takeSnapshot: Record<string, never>;
            /** ID: 6 */
            mirrorReportAttrRsp: Record<string, never>;
            /** ID: 32 */
            owonGetHistoryRecord: Record<string, never>;
            /** ID: 33 */
            owonStopSendingHistoricalRecord: Record<string, never>;
        };
        commandResponses: {
            /** ID: 0 */
            getProfileRsp: Record<string, never>;
            /** ID: 1 */
            reqMirrorRsp: Record<string, never>;
            /** ID: 2 */
            mirrorRemRsp: Record<string, never>;
            /** ID: 3 */
            reqFastPollModeRsp: Record<string, never>;
            /** ID: 4 */
            getSnapshotRsp: Record<string, never>;
            /** ID: 32 */
            owonGetHistoryRecordRsp: Record<string, never>;
        };
    };
    tunneling: {
        attributes: never;
        commands: {
            /** ID: 0 | Response ID: 0 */
            requestTunnel: {
                /** Type: ENUM8 */
                protocolId: number;
                /** Type: UINT16 */
                manufCode: number;
                /** Type: BOOLEAN */
                flowControl: number;
                /** Type: UINT16 */
                mtuSize: number;
            };
            /** ID: 1 */
            closeTunnel: {
                /** Type: UINT16 */
                tunnelId: number;
            };
            /** ID: 2 */
            transferData: {
                /** Type: UINT16 */
                tunnelId: number;
                /** Type: BUFFER */
                data: Buffer;
            };
            /** ID: 3 */
            transferDataError: {
                /** Type: UINT16 */
                tunnelId: number;
                /** Type: UINT8 */
                status: number;
            };
        };
        commandResponses: {
            /** ID: 0 */
            requestTunnelResp: {
                /** Type: UINT16 */
                tunnelId: number;
                /** Type: UINT8 */
                tunnelStatus: number;
                /** Type: UINT16 */
                mtuSize: number;
            };
            /** ID: 1 */
            transferDataResp: {
                /** Type: UINT16 */
                tunnelId: number;
                /** Type: BUFFER */
                data: Buffer;
            };
            /** ID: 2 */
            transferDataErrorResp: {
                /** Type: UINT16 */
                tunnelId: number;
                /** Type: UINT8 */
                status: number;
            };
        };
    };
    telecommunicationsInformation: {
        attributes: {
            /** ID: 0 | Type: CHAR_STR */
            nodeDescription: string;
            /** ID: 1 | Type: BOOLEAN */
            deliveryEnable: number;
            /** ID: 2 | Type: UINT32 */
            pushInformationTimer: number;
            /** ID: 3 | Type: BOOLEAN */
            enableSecureConfiguration: number;
            /** ID: 16 | Type: UINT16 */
            numberOfContents: number;
            /** ID: 17 | Type: UINT16 */
            contentRootID: number;
        };
        commands: never;
        commandResponses: never;
    };
    telecommunicationsVoiceOverZigbee: {
        attributes: {
            /** ID: 0 | Type: ENUM8 */
            codecType: number;
            /** ID: 1 | Type: ENUM8 */
            samplingFrequency: number;
            /** ID: 2 | Type: ENUM8 */
            codecrate: number;
            /** ID: 3 | Type: UINT8 */
            establishmentTimeout: number;
            /** ID: 4 | Type: ENUM8 */
            codecTypeSub1: number;
            /** ID: 5 | Type: ENUM8 */
            codecTypeSub2: number;
            /** ID: 6 | Type: ENUM8 */
            codecTypeSub3: number;
            /** ID: 7 | Type: ENUM8 */
            compressionType: number;
            /** ID: 8 | Type: ENUM8 */
            compressionRate: number;
            /** ID: 9 | Type: BITMAP8 */
            optionFlags: number;
            /** ID: 10 | Type: UINT8 */
            threshold: number;
        };
        commands: never;
        commandResponses: never;
    };
    telecommunicationsChatting: {
        attributes: {
            /** ID: 0 | Type: UINT16 */
            uID: number;
            /** ID: 1 | Type: CHAR_STR */
            nickname: string;
            /** ID: 16 | Type: UINT16 */
            cID: number;
            /** ID: 17 | Type: CHAR_STR */
            name: string;
            /** ID: 18 | Type: BOOLEAN */
            enableAddChat: number;
        };
        commands: never;
        commandResponses: never;
    };
    haApplianceIdentification: {
        attributes: {
            /** ID: 0 | Type: UINT56 */
            basicIdentification: bigint;
            /** ID: 16 | Type: CHAR_STR */
            companyName: string;
            /** ID: 17 | Type: UINT16 */
            companyId: number;
            /** ID: 18 | Type: CHAR_STR */
            brandName: string;
            /** ID: 19 | Type: UINT16 */
            brandId: number;
            /** ID: 20 | Type: OCTET_STR */
            model: Buffer;
            /** ID: 21 | Type: OCTET_STR */
            partNumber: Buffer;
            /** ID: 22 | Type: OCTET_STR */
            productRevision: Buffer;
            /** ID: 23 | Type: OCTET_STR */
            softwareRevision: Buffer;
            /** ID: 24 | Type: OCTET_STR */
            productTypeName: Buffer;
            /** ID: 25 | Type: UINT16 */
            productTypeId: number;
            /** ID: 26 | Type: UINT8 */
            cecedSpecificationVersion: number;
        };
        commands: never;
        commandResponses: never;
    };
    haMeterIdentification: {
        attributes: {
            /** ID: 0 | Type: CHAR_STR */
            companyName: string;
            /** ID: 1 | Type: UINT16 */
            meterTypeId: number;
            /** ID: 4 | Type: UINT16 */
            dataQualityId: number;
            /** ID: 5 | Type: CHAR_STR */
            customerName: string;
            /** ID: 6 | Type: CHAR_STR */
            model: string;
            /** ID: 7 | Type: CHAR_STR */
            partNumber: string;
            /** ID: 8 | Type: CHAR_STR */
            productRevision: string;
            /** ID: 10 | Type: CHAR_STR */
            softwareRevision: string;
            /** ID: 11 | Type: CHAR_STR */
            utilityName: string;
            /** ID: 12 | Type: CHAR_STR */
            pod: string;
            /** ID: 13 | Type: INT24 */
            availablePower: number;
            /** ID: 14 | Type: INT24 */
            powerThreshold: number;
        };
        commands: never;
        commandResponses: never;
    };
    haApplianceEventsAlerts: {
        attributes: never;
        commands: {
            /** ID: 0 */
            getAlerts: Record<string, never>;
        };
        commandResponses: {
            /** ID: 0 */
            getAlertsRsp: {
                /** Type: UINT8 */
                alertscount: number;
                /** Type: LIST_UINT24 */
                aalert: number[];
            };
            /** ID: 1 */
            alertsNotification: {
                /** Type: UINT8 */
                alertscount: number;
                /** Type: LIST_UINT24 */
                aalert: number[];
            };
            /** ID: 2 */
            eventNotification: {
                /** Type: UINT8 */
                eventheader: number;
                /** Type: UINT8 */
                eventid: number;
            };
        };
    };
    haApplianceStatistics: {
        attributes: {
            /** ID: 0 | Type: UINT32 */
            logMaxSize: number;
            /** ID: 1 | Type: UINT8 */
            logQueueMaxSize: number;
        };
        commands: {
            /** ID: 0 */
            log: {
                /** Type: UINT32 */
                logid: number;
            };
            /** ID: 1 */
            logQueue: Record<string, never>;
        };
        commandResponses: {
            /** ID: 0 */
            logNotification: {
                /** Type: UINT32 */
                timestamp: number;
                /** Type: UINT32 */
                logid: number;
                /** Type: UINT32 */
                loglength: number;
                /** Type: LIST_UINT8 */
                logpayload: number[];
            };
            /** ID: 1 */
            logRsp: {
                /** Type: UINT32 */
                timestamp: number;
                /** Type: UINT32 */
                logid: number;
                /** Type: UINT32 */
                loglength: number;
                /** Type: LIST_UINT8 */
                logpayload: number[];
            };
            /** ID: 2 */
            logQueueRsp: {
                /** Type: UINT8 */
                logqueuesize: number;
                /** Type: LIST_UINT32 */
                logid: number[];
            };
            /** ID: 3 */
            statisticsAvailable: {
                /** Type: UINT8 */
                logqueuesize: number;
                /** Type: LIST_UINT32 */
                logid: number[];
            };
        };
    };
    haElectricalMeasurement: {
        attributes: {
            /** ID: 0 | Type: BITMAP32 */
            measurementType: number;
            /** ID: 256 | Type: INT16 */
            dcVoltage: number;
            /** ID: 257 | Type: INT16 */
            dcVoltageMin: number;
            /** ID: 258 | Type: INT16 */
            dcvoltagemax: number;
            /** ID: 259 | Type: INT16 */
            dcCurrent: number;
            /** ID: 260 | Type: INT16 */
            dcCurrentMin: number;
            /** ID: 261 | Type: INT16 */
            dcCurrentMax: number;
            /** ID: 262 | Type: INT16 */
            dcPower: number;
            /** ID: 263 | Type: INT16 */
            dcPowerMin: number;
            /** ID: 264 | Type: INT16 */
            dcPowerMax: number;
            /** ID: 512 | Type: UINT16 */
            dcVoltageMultiplier: number;
            /** ID: 513 | Type: UINT16 */
            dcVoltageDivisor: number;
            /** ID: 514 | Type: UINT16 */
            dcCurrentMultiplier: number;
            /** ID: 515 | Type: UINT16 */
            dcCurrentDivisor: number;
            /** ID: 516 | Type: UINT16 */
            dcPowerMultiplier: number;
            /** ID: 517 | Type: UINT16 */
            dcPowerDivisor: number;
            /** ID: 768 | Type: UINT16 */
            acFrequency: number;
            /** ID: 769 | Type: UINT16 */
            acFrequencyMin: number;
            /** ID: 770 | Type: UINT16 */
            acFrequencyMax: number;
            /** ID: 771 | Type: UINT16 */
            neutralCurrent: number;
            /** ID: 772 | Type: INT32 */
            totalActivePower: number;
            /** ID: 773 | Type: INT32 */
            totalReactivePower: number;
            /** ID: 774 | Type: UINT32 */
            totalApparentPower: number;
            /** ID: 775 | Type: INT16 */
            meas1stHarmonicCurrent: number;
            /** ID: 776 | Type: INT16 */
            meas3rdHarmonicCurrent: number;
            /** ID: 777 | Type: INT16 */
            meas5thHarmonicCurrent: number;
            /** ID: 778 | Type: INT16 */
            meas7thHarmonicCurrent: number;
            /** ID: 779 | Type: INT16 */
            meas9thHarmonicCurrent: number;
            /** ID: 780 | Type: INT16 */
            meas11thHarmonicCurrent: number;
            /** ID: 781 | Type: INT16 */
            measPhase1stHarmonicCurrent: number;
            /** ID: 782 | Type: INT16 */
            measPhase3rdHarmonicCurrent: number;
            /** ID: 783 | Type: INT16 */
            measPhase5thHarmonicCurrent: number;
            /** ID: 784 | Type: INT16 */
            measPhase7thHarmonicCurrent: number;
            /** ID: 785 | Type: INT16 */
            measPhase9thHarmonicCurrent: number;
            /** ID: 786 | Type: INT16 */
            measPhase11thHarmonicCurrent: number;
            /** ID: 1024 | Type: UINT16 */
            acFrequencyMultiplier: number;
            /** ID: 1025 | Type: UINT16 */
            acFrequencyDivisor: number;
            /** ID: 1026 | Type: UINT32 */
            powerMultiplier: number;
            /** ID: 1027 | Type: UINT32 */
            powerDivisor: number;
            /** ID: 1028 | Type: INT8 */
            harmonicCurrentMultiplier: number;
            /** ID: 1029 | Type: INT8 */
            phaseHarmonicCurrentMultiplier: number;
            /** ID: 1280 | Type: INT16 */
            instantaneousVoltage: number;
            /** ID: 1281 | Type: UINT16 */
            instantaneousLineCurrent: number;
            /** ID: 1282 | Type: INT16 */
            instantaneousActiveCurrent: number;
            /** ID: 1283 | Type: INT16 */
            instantaneousReactiveCurrent: number;
            /** ID: 1284 | Type: INT16 */
            instantaneousPower: number;
            /** ID: 1285 | Type: UINT16 */
            rmsVoltage: number;
            /** ID: 1286 | Type: UINT16 */
            rmsVoltageMin: number;
            /** ID: 1287 | Type: UINT16 */
            rmsVoltageMax: number;
            /** ID: 1288 | Type: UINT16 */
            rmsCurrent: number;
            /** ID: 1289 | Type: UINT16 */
            rmsCurrentMin: number;
            /** ID: 1290 | Type: UINT16 */
            rmsCurrentMax: number;
            /** ID: 1291 | Type: INT16 */
            activePower: number;
            /** ID: 1292 | Type: INT16 */
            activePowerMin: number;
            /** ID: 1293 | Type: INT16 */
            activePowerMax: number;
            /** ID: 1294 | Type: INT16 */
            reactivePower: number;
            /** ID: 1295 | Type: UINT16 */
            apparentPower: number;
            /** ID: 1296 | Type: INT8 */
            powerFactor: number;
            /** ID: 1297 | Type: UINT16 */
            averageRmsVoltageMeasPeriod: number;
            /** ID: 1298 | Type: UINT16 */
            averageRmsOverVoltageCounter: number;
            /** ID: 1299 | Type: UINT16 */
            averageRmsUnderVoltageCounter: number;
            /** ID: 1300 | Type: UINT16 */
            rmsExtremeOverVoltagePeriod: number;
            /** ID: 1301 | Type: UINT16 */
            rmsExtremeUnderVoltagePeriod: number;
            /** ID: 1302 | Type: UINT16 */
            rmsVoltageSagPeriod: number;
            /** ID: 1303 | Type: UINT16 */
            rmsVoltageSwellPeriod: number;
            /** ID: 1536 | Type: UINT16 */
            acVoltageMultiplier: number;
            /** ID: 1537 | Type: UINT16 */
            acVoltageDivisor: number;
            /** ID: 1538 | Type: UINT16 */
            acCurrentMultiplier: number;
            /** ID: 1539 | Type: UINT16 */
            acCurrentDivisor: number;
            /** ID: 1540 | Type: UINT16 */
            acPowerMultiplier: number;
            /** ID: 1541 | Type: UINT16 */
            acPowerDivisor: number;
            /** ID: 1792 | Type: BITMAP8 */
            dcOverloadAlarmsMask: number;
            /** ID: 1793 | Type: INT16 */
            dcVoltageOverload: number;
            /** ID: 1794 | Type: INT16 */
            dcCurrentOverload: number;
            /** ID: 2048 | Type: BITMAP16 */
            acAlarmsMask: number;
            /** ID: 2049 | Type: INT16 */
            acVoltageOverload: number;
            /** ID: 2050 | Type: INT16 */
            acCurrentOverload: number;
            /** ID: 2051 | Type: INT16 */
            acActivePowerOverload: number;
            /** ID: 2052 | Type: INT16 */
            acReactivePowerOverload: number;
            /** ID: 2053 | Type: INT16 */
            averageRmsOverVoltage: number;
            /** ID: 2054 | Type: INT16 */
            averageRmsUnderVoltage: number;
            /** ID: 2055 | Type: INT16 */
            rmsExtremeOverVoltage: number;
            /** ID: 2056 | Type: INT16 */
            rmsExtremeUnderVoltage: number;
            /** ID: 2057 | Type: INT16 */
            rmsVoltageSag: number;
            /** ID: 2058 | Type: INT16 */
            rmsVoltageSwell: number;
            /** ID: 2305 | Type: UINT16 */
            lineCurrentPhB: number;
            /** ID: 2306 | Type: INT16 */
            activeCurrentPhB: number;
            /** ID: 2307 | Type: INT16 */
            reactiveCurrentPhB: number;
            /** ID: 2309 | Type: UINT16 */
            rmsVoltagePhB: number;
            /** ID: 2310 | Type: UINT16 */
            rmsVoltageMinPhB: number;
            /** ID: 2311 | Type: UINT16 */
            rmsVoltageMaxPhB: number;
            /** ID: 2312 | Type: UINT16 */
            rmsCurrentPhB: number;
            /** ID: 2313 | Type: UINT16 */
            rmsCurrentMinPhB: number;
            /** ID: 2314 | Type: UINT16 */
            rmsCurrentMaxPhB: number;
            /** ID: 2315 | Type: INT16 */
            activePowerPhB: number;
            /** ID: 2316 | Type: INT16 */
            activePowerMinPhB: number;
            /** ID: 2317 | Type: INT16 */
            activePowerMaxPhB: number;
            /** ID: 2318 | Type: INT16 */
            reactivePowerPhB: number;
            /** ID: 2319 | Type: UINT16 */
            apparentPowerPhB: number;
            /** ID: 2320 | Type: INT8 */
            powerFactorPhB: number;
            /** ID: 2321 | Type: UINT16 */
            averageRmsVoltageMeasurePeriodPhB: number;
            /** ID: 2322 | Type: UINT16 */
            averageRmsOverVoltageCounterPhB: number;
            /** ID: 2323 | Type: UINT16 */
            averageUnderVoltageCounterPhB: number;
            /** ID: 2324 | Type: UINT16 */
            rmsExtremeOverVoltagePeriodPhB: number;
            /** ID: 2325 | Type: UINT16 */
            rmsExtremeUnderVoltagePeriodPhB: number;
            /** ID: 2326 | Type: UINT16 */
            rmsVoltageSagPeriodPhB: number;
            /** ID: 2327 | Type: UINT16 */
            rmsVoltageSwellPeriodPhB: number;
            /** ID: 2561 | Type: UINT16 */
            lineCurrentPhC: number;
            /** ID: 2562 | Type: INT16 */
            activeCurrentPhC: number;
            /** ID: 2563 | Type: INT16 */
            reactiveCurrentPhC: number;
            /** ID: 2565 | Type: UINT16 */
            rmsVoltagePhC: number;
            /** ID: 2566 | Type: UINT16 */
            rmsVoltageMinPhC: number;
            /** ID: 2567 | Type: UINT16 */
            rmsVoltageMaxPhC: number;
            /** ID: 2568 | Type: UINT16 */
            rmsCurrentPhC: number;
            /** ID: 2569 | Type: UINT16 */
            rmsCurrentMinPhC: number;
            /** ID: 2570 | Type: UINT16 */
            rmsCurrentMaxPhC: number;
            /** ID: 2571 | Type: INT16 */
            activePowerPhC: number;
            /** ID: 2572 | Type: INT16 */
            activePowerMinPhC: number;
            /** ID: 2573 | Type: INT16 */
            activePowerMaxPhC: number;
            /** ID: 2574 | Type: INT16 */
            reactivePowerPhC: number;
            /** ID: 2575 | Type: UINT16 */
            apparentPowerPhC: number;
            /** ID: 2576 | Type: INT8 */
            powerFactorPhC: number;
            /** ID: 2577 | Type: UINT16 */
            averageRmsVoltageMeasPeriodPhC: number;
            /** ID: 2578 | Type: UINT16 */
            averageRmsOverVoltageCounterPhC: number;
            /** ID: 2579 | Type: UINT16 */
            averageUnderVoltageCounterPhC: number;
            /** ID: 2580 | Type: UINT16 */
            rmsExtremeOverVoltagePeriodPhC: number;
            /** ID: 2581 | Type: UINT16 */
            rmsExtremeUnderVoltagePeriodPhC: number;
            /** ID: 2582 | Type: UINT16 */
            rmsVoltageSagPeriodPhC: number;
            /** ID: 2583 | Type: UINT16 */
            rmsVoltageSwellPeriodPhC: number;
            /** ID: 17152 | Type: INT32 | Specific to manufacturer: SCHNEIDER_ELECTRIC (4190) */
            schneiderActivePowerDemandTotal?: number;
            /** ID: 17155 | Type: INT32 | Specific to manufacturer: SCHNEIDER_ELECTRIC (4190) */
            schneiderReactivePowerDemandTotal?: number;
            /** ID: 17176 | Type: INT32 | Specific to manufacturer: SCHNEIDER_ELECTRIC (4190) */
            schneiderApparentPowerDemandTotal?: number;
            /** ID: 17177 | Type: UINT24 | Specific to manufacturer: SCHNEIDER_ELECTRIC (4190) */
            schneiderDemandIntervalDuration?: number;
            /** ID: 17184 | Type: UTC | Specific to manufacturer: SCHNEIDER_ELECTRIC (4190) */
            schneiderDemandDateTime?: number;
            /** ID: 17673 | Type: INT32 | Specific to manufacturer: SCHNEIDER_ELECTRIC (4190) */
            schneiderActivePowerDemandPhase1?: number;
            /** ID: 17674 | Type: INT32 | Specific to manufacturer: SCHNEIDER_ELECTRIC (4190) */
            schneiderReactivePowerDemandPhase1?: number;
            /** ID: 17675 | Type: INT32 | Specific to manufacturer: SCHNEIDER_ELECTRIC (4190) */
            schneiderApparentPowerDemandPhase1?: number;
            /** ID: 17680 | Type: UINT16 | Specific to manufacturer: SCHNEIDER_ELECTRIC (4190) */
            schneiderDemandIntervalMinimalVoltageL1?: number;
            /** ID: 17683 | Type: UINT16 | Specific to manufacturer: SCHNEIDER_ELECTRIC (4190) */
            schneiderDemandIntervalMaximalCurrentI1?: number;
            /** ID: 18697 | Type: INT32 | Specific to manufacturer: SCHNEIDER_ELECTRIC (4190) */
            schneiderActivePowerDemandPhase2?: number;
            /** ID: 18698 | Type: INT32 | Specific to manufacturer: SCHNEIDER_ELECTRIC (4190) */
            schneiderReactivePowerDemandPhase2?: number;
            /** ID: 18699 | Type: INT32 | Specific to manufacturer: SCHNEIDER_ELECTRIC (4190) */
            schneiderApparentPowerDemandPhase2?: number;
            /** ID: 18704 | Type: UINT16 | Specific to manufacturer: SCHNEIDER_ELECTRIC (4190) */
            schneiderDemandIntervalMinimalVoltageL2?: number;
            /** ID: 18707 | Type: UINT16 | Specific to manufacturer: SCHNEIDER_ELECTRIC (4190) */
            schneiderDemandIntervalMaximalCurrentI2?: number;
            /** ID: 18953 | Type: INT32 | Specific to manufacturer: SCHNEIDER_ELECTRIC (4190) */
            schneiderActivePowerDemandPhase3?: number;
            /** ID: 18954 | Type: INT32 | Specific to manufacturer: SCHNEIDER_ELECTRIC (4190) */
            schneiderReactivePowerDemandPhase3?: number;
            /** ID: 18955 | Type: INT32 | Specific to manufacturer: SCHNEIDER_ELECTRIC (4190) */
            schneiderApparentPowerDemandPhase3?: number;
            /** ID: 18960 | Type: UINT16 | Specific to manufacturer: SCHNEIDER_ELECTRIC (4190) */
            schneiderDemandIntervalMinimalVoltageL3?: number;
            /** ID: 18963 | Type: UINT16 | Specific to manufacturer: SCHNEIDER_ELECTRIC (4190) */
            schneiderDemandIntervalMaximalCurrentI3?: number;
            /** ID: 19968 | Type: UINT8 | Specific to manufacturer: SCHNEIDER_ELECTRIC (4190) */
            schneiderCurrentSensorMultiplier?: number;
        };
        commands: {
            /** ID: 0 */
            getProfileInfo: Record<string, never>;
            /** ID: 1 */
            getMeasurementProfile: {
                /** Type: UINT16 */
                attrId: number;
                /** Type: UINT32 */
                starttime: number;
                /** Type: UINT8 */
                numofuntervals: number;
            };
        };
        commandResponses: {
            /** ID: 0 */
            getProfileInfoRsp: {
                /** Type: UINT8 */
                profilecount: number;
                /** Type: UINT8 */
                profileintervalperiod: number;
                /** Type: UINT8 */
                maxnumofintervals: number;
                /** Type: UINT8 */
                numofattrs: number;
                /** Type: LIST_UINT16 */
                listofattr: number[];
            };
            /** ID: 1 */
            getMeasurementProfileRsp: {
                /** Type: UINT32 */
                starttime: number;
                /** Type: UINT8 */
                status: number;
                /** Type: UINT8 */
                profileintervalperiod: number;
                /** Type: UINT8 */
                numofintervalsdeliv: number;
                /** Type: UINT16 */
                attrId: number;
                /** Type: LIST_UINT8 */
                intervals: number[];
            };
        };
    };
    haDiagnostic: {
        attributes: {
            /** ID: 0 | Type: UINT16 */
            numberOfResets: number;
            /** ID: 1 | Type: UINT16 */
            persistentMemoryWrites: number;
            /** ID: 256 | Type: UINT32 */
            macRxBcast: number;
            /** ID: 257 | Type: UINT32 */
            macTxBcast: number;
            /** ID: 258 | Type: UINT32 */
            macRxUcast: number;
            /** ID: 259 | Type: UINT32 */
            macTxUcast: number;
            /** ID: 260 | Type: UINT16 */
            macTxUcastRetry: number;
            /** ID: 261 | Type: UINT16 */
            macTxUcastFail: number;
            /** ID: 262 | Type: UINT16 */
            aPSRxBcast: number;
            /** ID: 263 | Type: UINT16 */
            aPSTxBcast: number;
            /** ID: 264 | Type: UINT16 */
            aPSRxUcast: number;
            /** ID: 265 | Type: UINT16 */
            aPSTxUcastSuccess: number;
            /** ID: 266 | Type: UINT16 */
            aPSTxUcastRetry: number;
            /** ID: 267 | Type: UINT16 */
            aPSTxUcastFail: number;
            /** ID: 268 | Type: UINT16 */
            routeDiscInitiated: number;
            /** ID: 269 | Type: UINT16 */
            neighborAdded: number;
            /** ID: 270 | Type: UINT16 */
            neighborRemoved: number;
            /** ID: 271 | Type: UINT16 */
            neighborStale: number;
            /** ID: 272 | Type: UINT16 */
            joinIndication: number;
            /** ID: 273 | Type: UINT16 */
            childMoved: number;
            /** ID: 274 | Type: UINT16 */
            nwkFcFailure: number;
            /** ID: 275 | Type: UINT16 */
            apsFcFailure: number;
            /** ID: 276 | Type: UINT16 */
            apsUnauthorizedKey: number;
            /** ID: 277 | Type: UINT16 */
            nwkDecryptFailures: number;
            /** ID: 278 | Type: UINT16 */
            apsDecryptFailures: number;
            /** ID: 279 | Type: UINT16 */
            packetBufferAllocateFailures: number;
            /** ID: 280 | Type: UINT16 */
            relayedUcast: number;
            /** ID: 281 | Type: UINT16 */
            phyToMacQueueLimitReached: number;
            /** ID: 282 | Type: UINT16 */
            packetValidateDropCount: number;
            /** ID: 283 | Type: UINT16 */
            averageMacRetryPerApsMessageSent: number;
            /** ID: 284 | Type: UINT8 */
            lastMessageLqi: number;
            /** ID: 285 | Type: INT8 */
            lastMessageRssi: number;
            /** ID: 16384 | Type: BITMAP16 | Specific to manufacturer: DANFOSS_A_S (4678) */
            danfossSystemStatusCode?: number;
            /** ID: 16433 | Type: ENUM8 | Specific to manufacturer: DANFOSS_A_S (4678) */
            danfossHeatSupplyRequest?: number;
            /** ID: 16896 | Type: ENUM8 | Specific to manufacturer: DANFOSS_A_S (4678) */
            danfossSystemStatusWater?: number;
            /** ID: 16897 | Type: ENUM8 | Specific to manufacturer: DANFOSS_A_S (4678) */
            danfossMultimasterRole?: number;
            /** ID: 16912 | Type: ENUM8 | Specific to manufacturer: DANFOSS_A_S (4678) */
            danfossIconApplication?: number;
            /** ID: 16928 | Type: ENUM8 | Specific to manufacturer: DANFOSS_A_S (4678) */
            danfossIconForcedHeatingCooling?: number;
            /** ID: 65281 | Type: UINT32 | Specific to manufacturer: SCHNEIDER_ELECTRIC (4190) */
            schneiderMeterStatus?: number;
            /** ID: 65282 | Type: UINT32 | Specific to manufacturer: SCHNEIDER_ELECTRIC (4190) */
            schneiderDiagnosticRegister1?: number;
            /** ID: 16384 | Type: UINT8 | Specific to manufacturer: SCHNEIDER_ELECTRIC (4190) */
            schneiderCommunicationQuality?: number;
        };
        commands: never;
        commandResponses: never;
    };
    touchlink: {
        attributes: never;
        commands: {
            /** ID: 0 | Response ID: 1 */
            scanRequest: {
                /** Type: UINT32 */
                transactionID: number;
                /** Type: BITMAP8 */
                zigbeeInformation: number;
                /** Type: BITMAP8 */
                touchlinkInformation: number;
            };
            /** ID: 2 | Response ID: 3 */
            deviceInformation: {
                /** Type: UINT32 */
                transactionID: number;
                /** Type: UINT8 */
                startIndex: number;
            };
            /** ID: 6 */
            identifyRequest: {
                /** Type: UINT32 */
                transactionID: number;
                /** Type: UINT16 */
                duration: number;
            };
            /** ID: 7 */
            resetToFactoryNew: {
                /** Type: UINT32 */
                transactionID: number;
            };
            /** ID: 16 | Response ID: 17 */
            networkStart: {
                /** Type: UINT32 */
                transactionID: number;
                /** Type: IEEE_ADDR */
                extendedPANID: string;
                /** Type: UINT8 */
                keyIndex: number;
                /** Type: SEC_KEY */
                encryptedNetworkKey: Buffer;
                /** Type: UINT8 */
                logicalChannel: number;
                /** Type: UINT16 */
                panID: number;
                /** Type: UINT16 */
                nwkAddr: number;
                /** Type: UINT16 */
                groupIDsBegin: number;
                /** Type: UINT16 */
                groupIDsEnd: number;
                /** Type: UINT16 */
                freeNwkAddrRangeBegin: number;
                /** Type: UINT16 */
                freeNwkAddrRangeEnd: number;
                /** Type: UINT16 */
                freeGroupIDRangeBegin: number;
                /** Type: UINT16 */
                freeGroupIDRangeEnd: number;
                /** Type: IEEE_ADDR */
                initiatorIEEE: string;
                /** Type: UINT16 */
                initiatorNwkAddr: number;
            };
            /** ID: 18 | Response ID: 19 */
            networkJoinRouter: {
                /** Type: UINT32 */
                transactionID: number;
                /** Type: IEEE_ADDR */
                extendedPANID: string;
                /** Type: UINT8 */
                keyIndex: number;
                /** Type: SEC_KEY */
                encryptedNetworkKey: Buffer;
                /** Type: UINT8 */
                networkUpdateID: number;
                /** Type: UINT8 */
                logicalChannel: number;
                /** Type: UINT16 */
                panID: number;
                /** Type: UINT16 */
                nwkAddr: number;
                /** Type: UINT16 */
                groupIDsBegin: number;
                /** Type: UINT16 */
                groupIDsEnd: number;
                /** Type: UINT16 */
                freeNwkAddrRangeBegin: number;
                /** Type: UINT16 */
                freeNwkAddrRangeEnd: number;
                /** Type: UINT16 */
                freeGroupIDRangeBegin: number;
                /** Type: UINT16 */
                freeGroupIDRangeEnd: number;
            };
            /** ID: 20 | Response ID: 21 */
            networkJoinEndDevice: {
                /** Type: UINT32 */
                transactionID: number;
                /** Type: IEEE_ADDR */
                extendedPANID: string;
                /** Type: UINT8 */
                keyIndex: number;
                /** Type: SEC_KEY */
                encryptedNetworkKey: Buffer;
                /** Type: UINT8 */
                networkUpdateID: number;
                /** Type: UINT8 */
                logicalChannel: number;
                /** Type: UINT16 */
                panID: number;
                /** Type: UINT16 */
                nwkAddr: number;
                /** Type: UINT16 */
                groupIDsBegin: number;
                /** Type: UINT16 */
                groupIDsEnd: number;
                /** Type: UINT16 */
                freeNwkAddrRangeBegin: number;
                /** Type: UINT16 */
                freeNwkAddrRangeEnd: number;
                /** Type: UINT16 */
                freeGroupIDRangeBegin: number;
                /** Type: UINT16 */
                freeGroupIDRangeEnd: number;
            };
            /** ID: 22 */
            networkUpdate: {
                /** Type: UINT32 */
                transactionID: number;
                /** Type: IEEE_ADDR */
                extendedPANID: string;
                /** Type: UINT8 */
                networkUpdateID: number;
                /** Type: UINT8 */
                logicalChannel: number;
                /** Type: UINT16 */
                panID: number;
                /** Type: UINT16 */
                nwkAddr: number;
            };
            /** ID: 65 | Response ID: 65 */
            getGroupIdentifiers: {
                /** Type: UINT8 */
                startIndex: number;
            };
            /** ID: 66 | Response ID: 66 */
            getEndpointList: {
                /** Type: UINT8 */
                startIndex: number;
            };
        };
        commandResponses: {
            /** ID: 1 */
            scanResponse: {
                /** Type: UINT32 */
                transactionID: number;
                /** Type: UINT8 */
                rssiCorrection: number;
                /** Type: UINT8 */
                zigbeeInformation: number;
                /** Type: UINT8 */
                touchlinkInformation: number;
                /** Type: UINT16 */
                keyBitmask: number;
                /** Type: UINT32 */
                responseID: number;
                /** Type: IEEE_ADDR */
                extendedPanID: string;
                /** Type: UINT8 */
                networkUpdateID: number;
                /** Type: UINT8 */
                logicalChannel: number;
                /** Type: UINT16 */
                panID: number;
                /** Type: UINT16 */
                networkAddress: number;
                /** Type: UINT8 */
                numberOfSubDevices: number;
                /** Type: UINT8 */
                totalGroupIdentifiers: number;
                /** Type: UINT8, Conditions: [{fieldEquals field=numberOfSubDevices value=1}] */
                endpointID?: number;
                /** Type: UINT16, Conditions: [{fieldEquals field=numberOfSubDevices value=1}] */
                profileID?: number;
                /** Type: UINT16, Conditions: [{fieldEquals field=numberOfSubDevices value=1}] */
                deviceID?: number;
                /** Type: UINT8, Conditions: [{fieldEquals field=numberOfSubDevices value=1}] */
                version?: number;
                /** Type: UINT8, Conditions: [{fieldEquals field=numberOfSubDevices value=1}] */
                groupIDCount?: number;
            };
            /** ID: 3 */
            deviceInformation: {
                /** Type: UINT32 */
                transactionID: number;
                /** Type: UINT8 */
                numberOfSubDevices: number;
                /** Type: UINT8 */
                startIndex: number;
                /** Type: UINT8 */
                deviceInfoCount: number;
            };
            /** ID: 17 */
            networkStart: {
                /** Type: UINT32 */
                transactionID: number;
                /** Type: ENUM8 */
                status: number;
                /** Type: IEEE_ADDR */
                extendedPANID: string;
                /** Type: UINT8 */
                networkUpdateID: number;
                /** Type: UINT8 */
                logicalChannel: number;
                /** Type: UINT16 */
                panID: number;
            };
            /** ID: 19 */
            networkJoinRouter: {
                /** Type: UINT32 */
                transactionID: number;
                /** Type: ENUM8 */
                status: number;
            };
            /** ID: 21 */
            networkJoinEndDevice: {
                /** Type: UINT32 */
                transactionID: number;
                /** Type: ENUM8 */
                status: number;
            };
            /** ID: 64 */
            endpointInformation: {
                /** Type: IEEE_ADDR */
                ieeeAddress: string;
                /** Type: UINT16 */
                networkAddress: number;
                /** Type: UINT8 */
                endpointID: number;
                /** Type: UINT16 */
                profileID: number;
                /** Type: UINT16 */
                deviceID: number;
                /** Type: UINT8 */
                version: number;
            };
            /** ID: 65 */
            getGroupIdentifiers: {
                /** Type: UINT8 */
                total: number;
                /** Type: UINT8 */
                startIndex: number;
                /** Type: UINT8 */
                count: number;
            };
            /** ID: 66 */
            getEndpointList: {
                /** Type: UINT8 */
                total: number;
                /** Type: UINT8 */
                startIndex: number;
                /** Type: UINT8 */
                count: number;
            };
        };
    };
    manuSpecificClusterAduroSmart: {
        attributes: never;
        commands: {
            /** ID: 0 */
            cmd0: Record<string, never>;
        };
        commandResponses: never;
    };
    manuSpecificOsram: {
        attributes: never;
        commands: {
            /** ID: 1 */
            saveStartupParams: Record<string, never>;
            /** ID: 2 */
            resetStartupParams: Record<string, never>;
        };
        commandResponses: {
            /** ID: 0 */
            saveStartupParamsRsp: Record<string, never>;
        };
    };
    manuSpecificPhilips: {
        attributes: {
            /** ID: 49 | Type: BITMAP16 */
            config: number;
        };
        commands: never;
        commandResponses: {
            /** ID: 0 */
            hueNotification: {
                /** Type: UINT8 */
                button: number;
                /** Type: UINT24 */
                unknown1: number;
                /** Type: UINT8 */
                type: number;
                /** Type: UINT8 */
                unknown2: number;
                /** Type: UINT8 */
                time: number;
                /** Type: UINT8 */
                unknown3: number;
            };
        };
    };
    manuSpecificPhilips2: {
        attributes: {
            /** ID: 2 | Type: OCTET_STR */
            state: Buffer;
        };
        commands: {
            /** ID: 0 */
            multiColor: {
                /** Type: BUFFER */
                data: Buffer;
            };
        };
        commandResponses: never;
    };
    manuSpecificPhilipsPairing: {
        attributes: never;
        commands: {
            /** ID: 0 */
            hueResetRequest: {
                /** Type: IEEE_ADDR */
                extendedPANID: string;
                /** Type: UINT8 */
                serialCount: number;
                /** Type: LIST_UINT32 */
                serialNumbers: number[];
            };
        };
        commandResponses: never;
    };
    manuSpecificSinope: {
        attributes: {
            /** ID: 2 | Type: ENUM8 */
            keypadLockout: number;
            /** ID: 4 | Type: CHAR_STR */
            firmwareVersion: string;
            /** ID: 16 | Type: INT16 */
            outdoorTempToDisplay: number;
            /** ID: 17 | Type: UINT16 */
            outdoorTempToDisplayTimeout: number;
            /** ID: 18 | Type: ENUM8 */
            secondScreenBehavior: number;
            /** ID: 32 | Type: UINT32 */
            currentTimeToDisplay: number;
            /** ID: 82 | Type: UINT8 */
            ledIntensityOn: number;
            /** ID: 83 | Type: UINT8 */
            ledIntensityOff: number;
            /** ID: 80 | Type: UINT24 */
            ledColorOn: number;
            /** ID: 81 | Type: UINT24 */
            ledColorOff: number;
            /** ID: 82 | Type: UINT8 */
            onLedIntensity: number;
            /** ID: 83 | Type: UINT8 */
            offLedIntensity: number;
            /** ID: 84 | Type: ENUM8 */
            actionReport: number;
            /** ID: 85 | Type: UINT16 */
            minimumBrightness: number;
            /** ID: 96 | Type: UINT16 */
            connectedLoadRM: number;
            /** ID: 112 | Type: BITMAP8 */
            currentLoad: number;
            /** ID: 113 | Type: INT8 */
            ecoMode: number;
            /** ID: 114 | Type: UINT8 */
            ecoMode1: number;
            /** ID: 115 | Type: UINT8 */
            ecoMode2: number;
            /** ID: 117 | Type: BITMAP32 */
            unknown: number;
            /** ID: 118 | Type: UINT8 */
            drConfigWaterTempMin: number;
            /** ID: 119 | Type: UINT8 */
            drConfigWaterTempTime: number;
            /** ID: 120 | Type: UINT16 */
            drWTTimeOn: number;
            /** ID: 128 | Type: UINT32 */
            unknown1: number;
            /** ID: 160 | Type: UINT32 */
            dimmerTimmer: number;
            /** ID: 256 | Type: UINT8 */
            unknown2: number;
            /** ID: 261 | Type: ENUM8 */
            floorControlMode: number;
            /** ID: 262 | Type: ENUM8 */
            auxOutputMode: number;
            /** ID: 263 | Type: INT16 */
            floorTemperature: number;
            /** ID: 264 | Type: INT16 */
            ambiantMaxHeatSetpointLimit: number;
            /** ID: 265 | Type: INT16 */
            floorMinHeatSetpointLimit: number;
            /** ID: 266 | Type: INT16 */
            floorMaxHeatSetpointLimit: number;
            /** ID: 267 | Type: ENUM8 */
            temperatureSensor: number;
            /** ID: 268 | Type: ENUM8 */
            floorLimitStatus: number;
            /** ID: 269 | Type: INT16 */
            roomTemperature: number;
            /** ID: 276 | Type: ENUM8 */
            timeFormatToDisplay: number;
            /** ID: 277 | Type: ENUM8 */
            GFCiStatus: number;
            /** ID: 280 | Type: UINT16 */
            auxConnectedLoad: number;
            /** ID: 281 | Type: UINT16 */
            connectedLoad: number;
            /** ID: 296 | Type: UINT8 */
            pumpProtection: number;
            /** ID: 298 | Type: ENUM8 */
            unknown3: number;
            /** ID: 299 | Type: INT16 */
            currentSetpoint: number;
            /** ID: 301 | Type: INT16 */
            reportLocalTemperature: number;
            /** ID: 576 | Type: ARRAY */
            flowMeterConfig: ZclArray | unknown[];
            /** ID: 643 | Type: UINT8 */
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
            /** ID: 0 */
            command0: {
                /** Type: BUFFER */
                data: Buffer;
            };
        };
        commandResponses: never;
    };
    manuSpecificLegrandDevices3: {
        attributes: never;
        commands: {
            /** ID: 0 */
            command0: {
                /** Type: BUFFER */
                data: Buffer;
            };
        };
        commandResponses: never;
    };
    wiserDeviceInfo: {
        attributes: {
            /** ID: 32 | Type: CHAR_STR */
            deviceInfo: string;
        };
        commands: never;
        commandResponses: never;
    };
    manuSpecificTuya: {
        attributes: never;
        commands: {
            /** ID: 0 */
            dataRequest: {
                /** Type: UINT16 */
                seq: number;
                /** Type: LIST_TUYA_DATAPOINT_VALUES */
                dpValues: TuyaDataPointValue[];
            };
            /** ID: 3 */
            dataQuery: Record<string, never>;
            /** ID: 16 */
            mcuVersionRequest: {
                /** Type: UINT16 */
                seq: number;
            };
            /** ID: 4 */
            sendData: {
                /** Type: UINT16 */
                seq: number;
                /** Type: LIST_TUYA_DATAPOINT_VALUES */
                dpValues: TuyaDataPointValue[];
            };
            /** ID: 18 */
            mcuOtaNotify: {
                /** Type: UINT16 */
                seq: number;
                /** Type: UINT32 */
                key_hi: number;
                /** Type: UINT32 */
                key_lo: number;
                /** Type: UINT8 */
                version: number;
                /** Type: UINT32 */
                imageSize: number;
                /** Type: UINT32 */
                crc: number;
            };
            /** ID: 20 */
            mcuOtaBlockDataResponse: {
                /** Type: UINT16 */
                seq: number;
                /** Type: UINT8 */
                status: number;
                /** Type: UINT32 */
                key_hi: number;
                /** Type: UINT32 */
                key_lo: number;
                /** Type: UINT8 */
                version: number;
                /** Type: UINT32 */
                offset: number;
                /** Type: LIST_UINT8 */
                imageData: number[];
            };
            /** ID: 36 */
            mcuSyncTime: {
                /** Type: UINT16 */
                payloadSize: number;
                /** Type: LIST_UINT8 */
                payload: number[];
            };
            /** ID: 37 */
            mcuGatewayConnectionStatus: {
                /** Type: UINT16 */
                payloadSize: number;
                /** Type: UINT8 */
                payload: number;
            };
            /** ID: 97 */
            tuyaWeatherSync: {
                /** Type: BUFFER */
                payload: Buffer;
            };
        };
        commandResponses: {
            /** ID: 1 */
            dataResponse: {
                /** Type: UINT16 */
                seq: number;
                /** Type: LIST_TUYA_DATAPOINT_VALUES */
                dpValues: TuyaDataPointValue[];
            };
            /** ID: 2 */
            dataReport: {
                /** Type: UINT16 */
                seq: number;
                /** Type: LIST_TUYA_DATAPOINT_VALUES */
                dpValues: TuyaDataPointValue[];
            };
            /** ID: 5 */
            activeStatusReportAlt: {
                /** Type: UINT16 */
                seq: number;
                /** Type: LIST_TUYA_DATAPOINT_VALUES */
                dpValues: TuyaDataPointValue[];
            };
            /** ID: 6 */
            activeStatusReport: {
                /** Type: UINT16 */
                seq: number;
                /** Type: LIST_TUYA_DATAPOINT_VALUES */
                dpValues: TuyaDataPointValue[];
            };
            /** ID: 17 */
            mcuVersionResponse: {
                /** Type: UINT16 */
                seq: number;
                /** Type: UINT8 */
                version: number;
            };
            /** ID: 19 */
            mcuOtaBlockDataRequest: {
                /** Type: UINT16 */
                seq: number;
                /** Type: UINT32 */
                key_hi: number;
                /** Type: UINT32 */
                key_lo: number;
                /** Type: UINT8 */
                version: number;
                /** Type: UINT32 */
                offset: number;
                /** Type: UINT32 */
                size: number;
            };
            /** ID: 21 */
            mcuOtaResult: {
                /** Type: UINT16 */
                seq: number;
                /** Type: UINT8 */
                status: number;
                /** Type: UINT32 */
                key_hi: number;
                /** Type: UINT32 */
                key_lo: number;
                /** Type: UINT8 */
                version: number;
            };
            /** ID: 36 */
            mcuSyncTime: {
                /** Type: UINT16 */
                payloadSize: number;
            };
            /** ID: 37 */
            mcuGatewayConnectionStatus: {
                /** Type: UINT16 */
                payloadSize: number;
            };
            /** ID: 96 */
            tuyaWeatherRequest: {
                /** Type: BUFFER */
                payload: Buffer;
            };
        };
    };
    manuSpecificLumi: {
        attributes: {
            /** ID: 9 | Type: UINT8 */
            mode: number;
            /** ID: 274 | Type: UINT32 */
            illuminance: number;
            /** ID: 276 | Type: UINT8 */
            displayUnit: number;
            /** ID: 297 | Type: UINT8 */
            airQuality: number;
            /** ID: 1024 | Type: BOOLEAN */
            curtainReverse: number;
            /** ID: 1025 | Type: BOOLEAN */
            curtainHandOpen: number;
            /** ID: 1026 | Type: BOOLEAN */
            curtainCalibrated: number;
        };
        commands: never;
        commandResponses: never;
    };
    liXeePrivate: {
        attributes: {
            /** ID: 0 | Type: CHAR_STR */
            currentTarif: string;
            /** ID: 1 | Type: CHAR_STR */
            tomorrowColor: string;
            /** ID: 2 | Type: UINT8 */
            scheduleHPHC: number;
            /** ID: 3 | Type: UINT8 */
            presencePotential: number;
            /** ID: 4 | Type: UINT8 */
            startNoticeEJP: number;
            /** ID: 5 | Type: UINT16 */
            warnDPS: number;
            /** ID: 6 | Type: UINT16 */
            warnDIR1: number;
            /** ID: 7 | Type: UINT16 */
            warnDIR2: number;
            /** ID: 8 | Type: UINT16 */
            warnDIR3: number;
            /** ID: 9 | Type: CHAR_STR */
            motDEtat: string;
            /** ID: 512 | Type: CHAR_STR */
            currentPrice: string;
            /** ID: 513 | Type: UINT8 */
            currentIndexTarif: number;
            /** ID: 514 | Type: CHAR_STR */
            currentDate: string;
            /** ID: 515 | Type: UINT32 */
            activeEnergyOutD01: number;
            /** ID: 516 | Type: UINT32 */
            activeEnergyOutD02: number;
            /** ID: 517 | Type: UINT32 */
            activeEnergyOutD03: number;
            /** ID: 518 | Type: UINT32 */
            activeEnergyOutD04: number;
            /** ID: 519 | Type: UINT16 */
            injectedVA: number;
            /** ID: 520 | Type: INT16 */
            injectedVAMaxN: number;
            /** ID: 521 | Type: INT16 */
            injectedVAMaxN1: number;
            /** ID: 528 | Type: INT16 */
            injectedActiveLoadN: number;
            /** ID: 529 | Type: INT16 */
            injectedActiveLoadN1: number;
            /** ID: 530 | Type: INT16 */
            drawnVAMaxN1: number;
            /** ID: 531 | Type: INT16 */
            drawnVAMaxN1P2: number;
            /** ID: 532 | Type: INT16 */
            drawnVAMaxN1P3: number;
            /** ID: 533 | Type: CHAR_STR */
            message1: string;
            /** ID: 534 | Type: CHAR_STR */
            message2: string;
            /** ID: 535 | Type: OCTET_STR */
            statusRegister: Buffer;
            /** ID: 536 | Type: UINT8 */
            startMobilePoint1: number;
            /** ID: 537 | Type: UINT8 */
            stopMobilePoint1: number;
            /** ID: 544 | Type: UINT8 */
            startMobilePoint2: number;
            /** ID: 545 | Type: UINT8 */
            stopMobilePoint2: number;
            /** ID: 546 | Type: UINT8 */
            startMobilePoint3: number;
            /** ID: 547 | Type: UINT8 */
            stopMobilePoint3: number;
            /** ID: 548 | Type: UINT16 */
            relais: number;
            /** ID: 549 | Type: UINT8 */
            daysNumberCurrentCalendar: number;
            /** ID: 550 | Type: UINT8 */
            daysNumberNextCalendar: number;
            /** ID: 551 | Type: LONG_OCTET_STR */
            daysProfileCurrentCalendar: Buffer;
            /** ID: 552 | Type: LONG_OCTET_STR */
            daysProfileNextCalendar: Buffer;
            /** ID: 768 | Type: UINT8 */
            linkyMode: number;
        };
        commands: never;
        commandResponses: never;
    };
    manuSpecificTuya2: {
        attributes: {
            /** ID: 53258 | Type: INT16 */
            alarm_temperature_max: number;
            /** ID: 53259 | Type: INT16 */
            alarm_temperature_min: number;
            /** ID: 53261 | Type: INT16 */
            alarm_humidity_max: number;
            /** ID: 53262 | Type: INT16 */
            alarm_humidity_min: number;
            /** ID: 53263 | Type: ENUM8 */
            alarm_humidity: number;
            /** ID: 53254 | Type: ENUM8 */
            alarm_temperature: number;
            /** ID: 53264 | Type: UINT8 */
            unknown: number;
        };
        commands: never;
        commandResponses: never;
    };
    manuSpecificTuya3: {
        attributes: {
            /** ID: 53264 | Type: ENUM8 */
            powerOnBehavior: number;
            /** ID: 53280 | Type: ENUM8 */
            switchMode: number;
            /** ID: 53296 | Type: ENUM8 */
            switchType: number;
        };
        commands: {
            /** ID: 229 */
            setOptions1: {
                /** Type: BUFFER */
                data: Buffer;
            };
            /** ID: 230 */
            setOptions2: {
                /** Type: BUFFER */
                data: Buffer;
            };
            /** ID: 231 */
            setOptions3: {
                /** Type: BUFFER */
                data: Buffer;
            };
        };
        commandResponses: never;
    };
    manuSpecificCentraliteHumidity: {
        attributes: {
            /** ID: 0 | Type: UINT16 */
            measuredValue: number;
        };
        commands: never;
        commandResponses: never;
    };
    manuSpecificSmartThingsArrivalSensor: {
        attributes: never;
        commands: never;
        commandResponses: {
            /** ID: 1 */
            arrivalSensorNotify: Record<string, never>;
        };
    };
    manuSpecificSamsungAccelerometer: {
        attributes: {
            /** ID: 0 | Type: UINT8 */
            motion_threshold_multiplier: number;
            /** ID: 2 | Type: UINT16 */
            motion_threshold: number;
            /** ID: 16 | Type: BITMAP8 */
            acceleration: number;
            /** ID: 18 | Type: INT16 */
            x_axis: number;
            /** ID: 19 | Type: INT16 */
            y_axis: number;
            /** ID: 20 | Type: INT16 */
            z_axis: number;
        };
        commands: never;
        commandResponses: never;
    };
    heimanSpecificAirQuality: {
        attributes: {
            /** ID: 61440 | Type: UINT8 */
            language: number;
            /** ID: 61441 | Type: UINT8 */
            unitOfMeasure: number;
            /** ID: 61442 | Type: UINT8 */
            batteryState: number;
            /** ID: 61443 | Type: UINT16 */
            pm10measuredValue: number;
            /** ID: 61444 | Type: UINT16 */
            tvocMeasuredValue: number;
            /** ID: 61445 | Type: UINT16 */
            aqiMeasuredValue: number;
            /** ID: 61446 | Type: INT16 */
            temperatureMeasuredMax: number;
            /** ID: 61447 | Type: INT16 */
            temperatureMeasuredMin: number;
            /** ID: 61448 | Type: UINT16 */
            humidityMeasuredMax: number;
            /** ID: 61449 | Type: UINT16 */
            humidityMeasuredMin: number;
            /** ID: 61450 | Type: UINT16 */
            alarmEnable: number;
        };
        commands: {
            /** ID: 283 */
            setLanguage: {
                /** Type: UINT8 */
                languageCode: number;
            };
            /** ID: 284 */
            setUnitOfTemperature: {
                /** Type: UINT8 */
                unitsCode: number;
            };
            /** ID: 285 */
            getTime: Record<string, never>;
        };
        commandResponses: never;
    };
    heimanSpecificScenes: {
        attributes: never;
        commands: {
            /** ID: 240 */
            cinema: Record<string, never>;
            /** ID: 241 */
            atHome: Record<string, never>;
            /** ID: 242 */
            sleep: Record<string, never>;
            /** ID: 243 */
            goOut: Record<string, never>;
            /** ID: 244 */
            repast: Record<string, never>;
        };
        commandResponses: never;
    };
    tradfriButton: {
        attributes: never;
        commands: {
            /** ID: 1 */
            action1: {
                /** Type: UINT8 */
                data: number;
            };
            /** ID: 2 */
            action2: {
                /** Type: UINT8 */
                data: number;
            };
            /** ID: 3 */
            action3: {
                /** Type: UINT8 */
                data: number;
            };
            /** ID: 4 */
            action4: {
                /** Type: UINT8 */
                data: number;
            };
            /** ID: 6 */
            action6: {
                /** Type: UINT8 */
                data: number;
            };
        };
        commandResponses: never;
    };
    heimanSpecificInfraRedRemote: {
        attributes: never;
        commands: {
            /** ID: 240 */
            sendKey: {
                /** Type: UINT8 */
                id: number;
                /** Type: UINT8 */
                keyCode: number;
            };
            /** ID: 241 */
            studyKey: {
                /** Type: UINT8 */
                id: number;
                /** Type: UINT8 */
                keyCode: number;
            };
            /** ID: 243 */
            deleteKey: {
                /** Type: UINT8 */
                id: number;
                /** Type: UINT8 */
                keyCode: number;
            };
            /** ID: 244 */
            createId: {
                /** Type: UINT8 */
                modelType: number;
            };
            /** ID: 246 */
            getIdAndKeyCodeList: Record<string, never>;
        };
        commandResponses: {
            /** ID: 242 */
            studyKeyRsp: {
                /** Type: UINT8 */
                id: number;
                /** Type: UINT8 */
                keyCode: number;
                /** Type: UINT8 */
                result: number;
            };
            /** ID: 245 */
            createIdRsp: {
                /** Type: UINT8 */
                id: number;
                /** Type: UINT8 */
                modelType: number;
            };
            /** ID: 247 */
            getIdAndKeyCodeListRsp: {
                /** Type: UINT8 */
                packetsTotal: number;
                /** Type: UINT8 */
                packetNumber: number;
                /** Type: UINT8 */
                packetLength: number;
                /** Type: LIST_UINT8 */
                learnedDevicesList: number[];
            };
        };
    };
    schneiderSpecificPilotMode: {
        attributes: {
            /** ID: 49 | Type: ENUM8 */
            pilotMode: number;
        };
        commands: never;
        commandResponses: never;
    };
    elkoOccupancySettingClusterServer: {
        attributes: {
            /** ID: 0 | Type: UINT16 */
            AmbienceLightThreshold: number;
            /** ID: 1 | Type: ENUM8 */
            OccupancyActions: number;
            /** ID: 2 | Type: UINT8 */
            UnoccupiedLevelDflt: number;
            /** ID: 3 | Type: UINT8 */
            UnoccupiedLevel: number;
        };
        commands: never;
        commandResponses: never;
    };
    elkoSwitchConfigurationClusterServer: {
        attributes: {
            /** ID: 0 | Type: ENUM8 */
            SwitchIndication: number;
            /** ID: 16 | Type: UINT8 */
            UpSceneID: number;
            /** ID: 17 | Type: UINT16 */
            UpGroupID: number;
            /** ID: 32 | Type: UINT8 */
            DownSceneID: number;
            /** ID: 33 | Type: UINT16 */
            DownGroupID: number;
            /** ID: 1 | Type: ENUM8 */
            SwitchActions: number;
        };
        commands: never;
        commandResponses: never;
    };
    manuSpecificSchneiderLightSwitchConfiguration: {
        attributes: {
            /** ID: 0 | Type: ENUM8 */
            ledIndication: number;
            /** ID: 16 | Type: UINT8 */
            upSceneID: number;
            /** ID: 17 | Type: UINT16 */
            upGroupID: number;
            /** ID: 32 | Type: UINT8 */
            downSceneID: number;
            /** ID: 33 | Type: UINT16 */
            downGroupID: number;
            /** ID: 1 | Type: ENUM8 */
            switchActions: number;
        };
        commands: never;
        commandResponses: never;
    };
    manuSpecificSchneiderFanSwitchConfiguration: {
        attributes: {
            /** ID: 2 | Type: UINT8 */
            ledIndication: number;
            /** ID: 96 | Type: UINT8 */
            ledOrientation: number;
        };
        commands: never;
        commandResponses: never;
    };
    sprutVoc: {
        attributes: {
            /** ID: 26112 | Type: UINT16 */
            voc: number;
        };
        commands: never;
        commandResponses: never;
    };
    sprutNoise: {
        attributes: {
            /** ID: 26112 | Type: SINGLE_PREC */
            noise: number;
            /** ID: 26113 | Type: BITMAP8 */
            noiseDetected: number;
            /** ID: 26114 | Type: SINGLE_PREC */
            noiseDetectLevel: number;
            /** ID: 26115 | Type: UINT16 */
            noiseAfterDetectDelay: number;
        };
        commands: never;
        commandResponses: never;
    };
    sprutIrBlaster: {
        attributes: never;
        commands: {
            /** ID: 0 */
            playStore: {
                /** Type: UINT8 */
                param: number;
            };
            /** ID: 1 */
            learnStart: {
                /** Type: UINT8 */
                value: number;
            };
            /** ID: 2 */
            learnStop: {
                /** Type: UINT8 */
                value: number;
            };
            /** ID: 3 */
            clearStore: Record<string, never>;
            /** ID: 4 */
            playRam: Record<string, never>;
            /** ID: 5 */
            learnRamStart: Record<string, never>;
            /** ID: 6 */
            learnRamStop: Record<string, never>;
        };
        commandResponses: never;
    };
    manuSpecificSiglisZigfred: {
        attributes: {
            /** ID: 8 | Type: UINT32 */
            buttonEvent: number;
        };
        commands: {
            /** ID: 2 */
            siglisZigfredButtonEvent: {
                /** Type: UINT8 */
                button: number;
                /** Type: UINT8 */
                type: number;
                /** Type: UINT16 */
                duration: number;
            };
        };
        commandResponses: never;
    };
    owonClearMetering: {
        attributes: never;
        commands: {
            /** ID: 0 */
            owonClearMeasurementData: Record<string, never>;
        };
        commandResponses: never;
    };
    zosungIRTransmit: {
        attributes: never;
        commands: {
            /** ID: 0 */
            zosungSendIRCode00: {
                /** Type: UINT16 */
                seq: number;
                /** Type: UINT32 */
                length: number;
                /** Type: UINT32 */
                unk1: number;
                /** Type: UINT16 */
                unk2: number;
                /** Type: UINT8 */
                unk3: number;
                /** Type: UINT8 */
                cmd: number;
                /** Type: UINT16 */
                unk4: number;
            };
            /** ID: 1 */
            zosungSendIRCode01: {
                /** Type: UINT8 */
                zero: number;
                /** Type: UINT16 */
                seq: number;
                /** Type: UINT32 */
                length: number;
                /** Type: UINT32 */
                unk1: number;
                /** Type: UINT16 */
                unk2: number;
                /** Type: UINT8 */
                unk3: number;
                /** Type: UINT8 */
                cmd: number;
                /** Type: UINT16 */
                unk4: number;
            };
            /** ID: 2 */
            zosungSendIRCode02: {
                /** Type: UINT16 */
                seq: number;
                /** Type: UINT32 */
                position: number;
                /** Type: UINT8 */
                maxlen: number;
            };
            /** ID: 3 */
            zosungSendIRCode03: {
                /** Type: UINT8 */
                zero: number;
                /** Type: UINT16 */
                seq: number;
                /** Type: UINT32 */
                position: number;
                /** Type: OCTET_STR */
                msgpart: Buffer;
                /** Type: UINT8 */
                msgpartcrc: number;
            };
            /** ID: 4 */
            zosungSendIRCode04: {
                /** Type: UINT8 */
                zero0: number;
                /** Type: UINT16 */
                seq: number;
                /** Type: UINT16 */
                zero1: number;
            };
            /** ID: 5 */
            zosungSendIRCode05: {
                /** Type: UINT16 */
                seq: number;
                /** Type: UINT16 */
                zero: number;
            };
        };
        commandResponses: {
            /** ID: 3 */
            zosungSendIRCode03Resp: {
                /** Type: UINT8 */
                zero: number;
                /** Type: UINT16 */
                seq: number;
                /** Type: UINT32 */
                position: number;
                /** Type: OCTET_STR */
                msgpart: Buffer;
                /** Type: UINT8 */
                msgpartcrc: number;
            };
            /** ID: 5 */
            zosungSendIRCode05Resp: {
                /** Type: UINT16 */
                seq: number;
                /** Type: UINT16 */
                zero: number;
            };
        };
    };
    zosungIRControl: {
        attributes: never;
        commands: {
            /** ID: 0 */
            zosungControlIRCommand00: {
                /** Type: BUFFER */
                data: Buffer;
            };
        };
        commandResponses: never;
    };
    manuSpecificAssaDoorLock: {
        attributes: {
            /** ID: 18 | Type: UINT8 */
            autoLockTime: number;
            /** ID: 19 | Type: UINT8 */
            wrongCodeAttempts: number;
            /** ID: 20 | Type: UINT8 */
            shutdownTime: number;
            /** ID: 21 | Type: UINT8 */
            batteryLevel: number;
            /** ID: 22 | Type: UINT8 */
            insideEscutcheonLED: number;
            /** ID: 23 | Type: UINT8 */
            volume: number;
            /** ID: 24 | Type: UINT8 */
            lockMode: number;
            /** ID: 25 | Type: UINT8 */
            language: number;
            /** ID: 26 | Type: BOOLEAN */
            allCodesLockout: number;
            /** ID: 27 | Type: BOOLEAN */
            oneTouchLocking: number;
            /** ID: 28 | Type: BOOLEAN */
            privacyButtonSetting: number;
            /** ID: 33 | Type: UINT16 */
            numberLogRecordsSupported: number;
            /** ID: 48 | Type: UINT8 */
            numberPinsSupported: number;
            /** ID: 64 | Type: UINT8 */
            numberScheduleSlotsPerUser: number;
            /** ID: 80 | Type: UINT8 */
            alarmMask: number;
        };
        commands: {
            /** ID: 16 | Response ID: 0 */
            getLockStatus: Record<string, never>;
            /** ID: 18 */
            getBatteryLevel: Record<string, never>;
            /** ID: 19 */
            setRFLockoutTime: Record<string, never>;
            /** ID: 48 */
            userCodeSet: {
                /** Type: CHAR_STR */
                payload: string;
            };
            /** ID: 49 */
            userCodeGet: {
                /** Type: CHAR_STR */
                payload: string;
            };
            /** ID: 50 */
            userCodeClear: {
                /** Type: CHAR_STR */
                payload: string;
            };
            /** ID: 51 */
            clearAllUserCodes: Record<string, never>;
            /** ID: 52 */
            setUserCodeStatus: Record<string, never>;
            /** ID: 53 */
            getUserCodeStatus: Record<string, never>;
            /** ID: 54 */
            getLastUserIdEntered: Record<string, never>;
            /** ID: 55 */
            userAdded: Record<string, never>;
            /** ID: 56 */
            userDeleted: Record<string, never>;
            /** ID: 64 */
            setScheduleSlot: {
                /** Type: CHAR_STR */
                payload: string;
            };
            /** ID: 65 */
            getScheduleSlot: {
                /** Type: CHAR_STR */
                payload: string;
            };
            /** ID: 66 */
            setScheduleSlotStatus: {
                /** Type: CHAR_STR */
                payload: string;
            };
            /** ID: 96 | Response ID: 1 */
            reflash: {
                /** Type: CHAR_STR */
                payload: string;
            };
            /** ID: 97 | Response ID: 2 */
            reflashData: {
                /** Type: CHAR_STR */
                payload: string;
            };
            /** ID: 98 | Response ID: 3 */
            reflashStatus: {
                /** Type: CHAR_STR */
                payload: string;
            };
            /** ID: 144 */
            getReflashLock: Record<string, never>;
            /** ID: 160 */
            getHistory: Record<string, never>;
            /** ID: 161 */
            getLogin: Record<string, never>;
            /** ID: 162 */
            getUser: Record<string, never>;
            /** ID: 163 */
            getUsers: Record<string, never>;
            /** ID: 176 */
            getMandatoryAttributes: Record<string, never>;
            /** ID: 177 */
            readAttribute: Record<string, never>;
            /** ID: 178 */
            writeAttribute: Record<string, never>;
            /** ID: 179 */
            configureReporting: Record<string, never>;
            /** ID: 180 */
            getBasicClusterAttributes: Record<string, never>;
        };
        commandResponses: {
            /** ID: 0 */
            getLockStatusRsp: {
                /** Type: UINT8 */
                status: number;
            };
            /** ID: 1 */
            reflashRsp: {
                /** Type: UINT8 */
                status: number;
            };
            /** ID: 2 */
            reflashDataRsp: {
                /** Type: UINT8 */
                status: number;
            };
            /** ID: 3 */
            reflashStatusRsp: {
                /** Type: UINT8 */
                status: number;
            };
        };
    };
    manuSpecificDoorman: {
        attributes: never;
        commands: {
            /** ID: 252 */
            getConfigurationParameter: {
                /** Type: CHAR_STR */
                payload: string;
            };
            /** ID: 253 */
            setConfigurationParameter: {
                /** Type: CHAR_STR */
                payload: string;
            };
            /** ID: 37 */
            integrationModeActivation: {
                /** Type: CHAR_STR */
                payload: string;
            };
            /** ID: 78 */
            armDisarm: {
                /** Type: CHAR_STR */
                payload: string;
            };
        };
        commandResponses: never;
    };
    manuSpecificProfalux1: {
        attributes: {
            /** ID: 0 | Type: UINT8 */
            motorCoverType: number;
        };
        commands: never;
        commandResponses: never;
    };
    manuSpecificAmazonWWAH: {
        attributes: {
            /** ID: 2 | Type: BOOLEAN */
            disableOTADowngrades: number;
            /** ID: 3 | Type: BOOLEAN */
            mgmtLeaveWithoutRejoinEnabled: number;
            /** ID: 4 | Type: UINT8 */
            nwkRetryCount: number;
            /** ID: 5 | Type: UINT8 */
            macRetryCount: number;
            /** ID: 6 | Type: BOOLEAN */
            routerCheckInEnabled: number;
            /** ID: 7 | Type: BOOLEAN */
            touchlinkInterpanEnabled: number;
            /** ID: 8 | Type: BOOLEAN */
            wwahParentClassificationEnabled: number;
            /** ID: 9 | Type: BOOLEAN */
            wwahAppEventRetryEnabled: number;
            /** ID: 10 | Type: UINT8 */
            wwahAppEventRetryQueueSize: number;
            /** ID: 11 | Type: BOOLEAN */
            wwahRejoinEnabled: number;
            /** ID: 12 | Type: UINT8 */
            macPollFailureWaitTime: number;
            /** ID: 13 | Type: BOOLEAN */
            configurationModeEnabled: number;
            /** ID: 14 | Type: UINT8 */
            currentDebugReportID: number;
            /** ID: 15 | Type: BOOLEAN */
            tcSecurityOnNwkKeyRotationEnabled: number;
            /** ID: 16 | Type: BOOLEAN */
            wwahBadParentRecoveryEnabled: number;
            /** ID: 17 | Type: UINT8 */
            pendingNetworkUpdateChannel: number;
            /** ID: 18 | Type: UINT16 */
            pendingNetworkUpdatePANID: number;
            /** ID: 19 | Type: UINT16 */
            otaMaxOfflineDuration: number;
            /** ID: 65533 | Type: UINT16 */
            clusterRevision: number;
        };
        commands: {
            /** ID: 10 */
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
        /** Type: UINT8, Conditions: [{fieldEquals field=status value=0}] */
        dataType?: number;
        /** Type: USE_DATA_TYPE, Conditions: [{fieldEquals field=status value=0}] */
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
        /** Type: UINT16, Conditions: [{fieldEquals field=status reversed=true value=0}] */
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
        /** Type: UINT8, Conditions: [{fieldEquals field=direction value=0}] */
        dataType?: number;
        /** Type: UINT16, Conditions: [{fieldEquals field=direction value=0}] */
        minRepIntval?: number;
        /** Type: UINT16, Conditions: [{fieldEquals field=direction value=0}] */
        maxRepIntval?: number;
        /** Type: USE_DATA_TYPE, Conditions: [{fieldEquals field=direction value=0}{dataTypeValueTypeEquals value=ANALOG}] */
        repChange?: unknown;
        /** Type: UINT16, Conditions: [{fieldEquals field=direction value=1}] */
        timeout?: number;
    }[];
    /** ID: 7 */
    configReportRsp: {
        /** Type: UINT8 */
        status: number;
        /** Type: UINT8, Conditions: [{minimumRemainingBufferBytes value=3}] */
        direction?: number;
        /** Type: UINT16, Conditions: [{minimumRemainingBufferBytes value=2}] */
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
        /** Type: UINT8, Conditions: [{fieldEquals field=direction value=0}] */
        dataType?: number;
        /** Type: UINT16, Conditions: [{fieldEquals field=direction value=0}] */
        minRepIntval?: number;
        /** Type: UINT16, Conditions: [{fieldEquals field=direction value=0}] */
        maxRepIntval?: number;
        /** Type: USE_DATA_TYPE, Conditions: [{fieldEquals field=direction value=0}{dataTypeValueTypeEquals value=ANALOG}] */
        repChange?: unknown;
        /** Type: UINT16, Conditions: [{fieldEquals field=direction value=1}] */
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
        /** Type: UINT16, Conditions: [{fieldEquals field=status reversed=true value=0}] */
        attrId?: number;
        /** Type: STRUCTURED_SELECTOR, Conditions: [{fieldEquals field=status reversed=true value=0}] */
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
