**zigbee-herdsman**

> [Globals](../README.md) / "src/controller/events"

# Module: "src/controller/events"

## Index

### Enumerations

* [Events](../enums/_src_controller_events_.events.md)

### Interfaces

* [DeviceAnnouncePayload](../interfaces/_src_controller_events_.deviceannouncepayload.md)
* [DeviceInterviewPayload](../interfaces/_src_controller_events_.deviceinterviewpayload.md)
* [DeviceJoinedPayload](../interfaces/_src_controller_events_.devicejoinedpayload.md)
* [DeviceLeavePayload](../interfaces/_src_controller_events_.deviceleavepayload.md)
* [MessagePayload](../interfaces/_src_controller_events_.messagepayload.md)

### Type aliases

* [MessagePayloadType](_src_controller_events_.md#messagepayloadtype)

### Object literals

* [CommandsLookup](_src_controller_events_.md#commandslookup)

## Type aliases

### MessagePayloadType

Ƭ  **MessagePayloadType**: \"attributeReport\" \| \"readResponse\" \| \"raw\" \| \"read\" \| \"write\" \| \"commandOn\" \| \"commandOffWithEffect\" \| \"commandStep\" \| \"commandStop\" \| \"commandHueNotification\" \| \"commandOff\" \| \"commandStepColorTemp\" \| \"commandMoveWithOnOff\" \| \"commandMove\" \| \"commandMoveHue\" \| \"commandMoveToSaturation\" \| \"commandStopWithOnOff\" \| \"commandMoveToLevelWithOnOff\" \| \"commandToggle\" \| \"commandTradfriArrowSingle\" \| \"commandTradfriArrowHold\" \| \"commandTradfriArrowRelease\" \| \"commandStepWithOnOff\" \| \"commandMoveToColorTemp\" \| \"commandMoveToColor\" \| \"commandOnWithTimedOff\" \| \"commandRecall\" \| \"commandArm\" \| \"commandPanic\" \| \"commandEmergency\" \| \"commandColorLoopSet\" \| \"commandOperationEventNotification\" \| \"commandStatusChangeNotification\" \| \"commandEnhancedMoveToHueAndSaturation\" \| \"commandUpOpen\" \| \"commandDownClose\" \| \"commandMoveToLevel\" \| \"commandMoveColorTemp\" \| \"commandGetData\" \| \"commandSetDataResponse\" \| \"commandGetWeeklyScheduleRsp\" \| \"commandQueryNextImageRequest\" \| \"commandNotification\" \| \"commandAlertsNotification\" \| \"commandProgrammingEventNotification\" \| \"commandGetPinCodeRsp\" \| \"commandArrivalSensorNotify\" \| \"commandCommisioningNotification\" \| \"commandAtHome\" \| \"commandGoOut\" \| \"commandCinema\" \| \"commandRepast\" \| \"commandSleep\" \| \"commandStudyKeyRsp\" \| \"commandCreateIdRsp\" \| \"commandGetIdAndKeyCodeListRsp\"

*Defined in [src/controller/events.ts:88](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/events.ts#L88)*

## Object literals

### CommandsLookup

▪ `Const` **CommandsLookup**: object

*Defined in [src/controller/events.ts:30](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/events.ts#L30)*

#### Properties:

Name | Type | Value |
------ | ------ | ------ |
`alertsNotification` | \"commandAlertsNotification\" | "commandAlertsNotification" |
`arm` | \"commandArm\" | "commandArm" |
`arrivalSensorNotify` | \"commandArrivalSensorNotify\" | "commandArrivalSensorNotify" |
`atHome` | \"commandAtHome\" | "commandAtHome" |
`cinema` | \"commandCinema\" | "commandCinema" |
`colorLoopSet` | \"commandColorLoopSet\" | "commandColorLoopSet" |
`commisioningNotification` | \"commandCommisioningNotification\" | "commandCommisioningNotification" |
`createIdRsp` | \"commandCreateIdRsp\" | "commandCreateIdRsp" |
`downClose` | \"commandDownClose\" | "commandDownClose" |
`emergency` | \"commandEmergency\" | "commandEmergency" |
`enhancedMoveToHueAndSaturation` | \"commandEnhancedMoveToHueAndSaturation\" | "commandEnhancedMoveToHueAndSaturation" |
`getData` | \"commandGetData\" | "commandGetData" |
`getIdAndKeyCodeListRsp` | \"commandGetIdAndKeyCodeListRsp\" | "commandGetIdAndKeyCodeListRsp" |
`getPinCodeRsp` | \"commandGetPinCodeRsp\" | "commandGetPinCodeRsp" |
`getWeeklyScheduleRsp` | \"commandGetWeeklyScheduleRsp\" | "commandGetWeeklyScheduleRsp" |
`goOut` | \"commandGoOut\" | "commandGoOut" |
`hueNotification` | \"commandHueNotification\" | "commandHueNotification" |
`move` | \"commandMove\" | "commandMove" |
`moveColorTemp` | \"commandMoveColorTemp\" | "commandMoveColorTemp" |
`moveHue` | \"commandMoveHue\" | "commandMoveHue" |
`moveToColor` | \"commandMoveToColor\" | "commandMoveToColor" |
`moveToColorTemp` | \"commandMoveToColorTemp\" | "commandMoveToColorTemp" |
`moveToLevel` | \"commandMoveToLevel\" | "commandMoveToLevel" |
`moveToLevelWithOnOff` | \"commandMoveToLevelWithOnOff\" | "commandMoveToLevelWithOnOff" |
`moveToSaturation` | \"commandMoveToSaturation\" | "commandMoveToSaturation" |
`moveWithOnOff` | \"commandMoveWithOnOff\" | "commandMoveWithOnOff" |
`notification` | \"commandNotification\" | "commandNotification" |
`off` | \"commandOff\" | "commandOff" |
`offWithEffect` | \"commandOffWithEffect\" | "commandOffWithEffect" |
`on` | \"commandOn\" | "commandOn" |
`onWithTimedOff` | \"commandOnWithTimedOff\" | "commandOnWithTimedOff" |
`operationEventNotification` | \"commandOperationEventNotification\" | "commandOperationEventNotification" |
`panic` | \"commandPanic\" | "commandPanic" |
`programmingEventNotification` | \"commandProgrammingEventNotification\" | "commandProgrammingEventNotification" |
`queryNextImageRequest` | \"commandQueryNextImageRequest\" | "commandQueryNextImageRequest" |
`recall` | \"commandRecall\" | "commandRecall" |
`repast` | \"commandRepast\" | "commandRepast" |
`setDataResponse` | \"commandSetDataResponse\" | "commandSetDataResponse" |
`sleep` | \"commandSleep\" | "commandSleep" |
`statusChangeNotification` | \"commandStatusChangeNotification\" | "commandStatusChangeNotification" |
`step` | \"commandStep\" | "commandStep" |
`stepColorTemp` | \"commandStepColorTemp\" | "commandStepColorTemp" |
`stepWithOnOff` | \"commandStepWithOnOff\" | "commandStepWithOnOff" |
`stop` | \"commandStop\" | "commandStop" |
`stopWithOnOff` | \"commandStopWithOnOff\" | "commandStopWithOnOff" |
`studyKeyRsp` | \"commandStudyKeyRsp\" | "commandStudyKeyRsp" |
`toggle` | \"commandToggle\" | "commandToggle" |
`tradfriArrowHold` | \"commandTradfriArrowHold\" | "commandTradfriArrowHold" |
`tradfriArrowRelease` | \"commandTradfriArrowRelease\" | "commandTradfriArrowRelease" |
`tradfriArrowSingle` | \"commandTradfriArrowSingle\" | "commandTradfriArrowSingle" |
`upOpen` | \"commandUpOpen\" | "commandUpOpen" |
