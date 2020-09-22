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

Ƭ  **MessagePayloadType**: \"attributeReport\" \| \"readResponse\" \| \"raw\" \| \"read\" \| \"write\" \| \"commandOn\" \| \"commandOffWithEffect\" \| \"commandStep\" \| \"commandStop\" \| \"commandHueNotification\" \| \"commandOff\" \| \"commandStepColorTemp\" \| \"commandMoveWithOnOff\" \| \"commandMove\" \| \"commandMoveHue\" \| \"commandMoveToSaturation\" \| \"commandStopWithOnOff\" \| \"commandMoveToLevelWithOnOff\" \| \"commandToggle\" \| \"commandTradfriArrowSingle\" \| \"commandTradfriArrowHold\" \| \"commandTradfriArrowRelease\" \| \"commandStepWithOnOff\" \| \"commandMoveToColorTemp\" \| \"commandMoveToColor\" \| \"commandOnWithTimedOff\" \| \"commandRecall\" \| \"commandArm\" \| \"commandPanic\" \| \"commandEmergency\" \| \"commandColorLoopSet\" \| \"commandOperationEventNotification\" \| \"commandStatusChangeNotification\" \| \"commandEnhancedMoveToHueAndSaturation\" \| \"commandUpOpen\" \| \"commandDownClose\" \| \"commandMoveToLevel\" \| \"commandMoveColorTemp\" \| \"commandGetData\" \| \"commandSetDataResponse\" \| \"commandGetWeeklyScheduleRsp\" \| \"commandQueryNextImageRequest\" \| \"commandNotification\" \| \"commandAlertsNotification\" \| \"commandProgrammingEventNotification\" \| \"commandGetPinCodeRsp\" \| \"commandArrivalSensorNotify\" \| \"commandCommisioningNotification\"

*Defined in [src/controller/events.ts:76](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/events.ts#L76)*

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
`colorLoopSet` | \"commandColorLoopSet\" | "commandColorLoopSet" |
`commisioningNotification` | \"commandCommisioningNotification\" | "commandCommisioningNotification" |
`downClose` | \"commandDownClose\" | "commandDownClose" |
`emergency` | \"commandEmergency\" | "commandEmergency" |
`enhancedMoveToHueAndSaturation` | \"commandEnhancedMoveToHueAndSaturation\" | "commandEnhancedMoveToHueAndSaturation" |
`getData` | \"commandGetData\" | "commandGetData" |
`getPinCodeRsp` | \"commandGetPinCodeRsp\" | "commandGetPinCodeRsp" |
`getWeeklyScheduleRsp` | \"commandGetWeeklyScheduleRsp\" | "commandGetWeeklyScheduleRsp" |
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
`setDataResponse` | \"commandSetDataResponse\" | "commandSetDataResponse" |
`statusChangeNotification` | \"commandStatusChangeNotification\" | "commandStatusChangeNotification" |
`step` | \"commandStep\" | "commandStep" |
`stepColorTemp` | \"commandStepColorTemp\" | "commandStepColorTemp" |
`stepWithOnOff` | \"commandStepWithOnOff\" | "commandStepWithOnOff" |
`stop` | \"commandStop\" | "commandStop" |
`stopWithOnOff` | \"commandStopWithOnOff\" | "commandStopWithOnOff" |
`toggle` | \"commandToggle\" | "commandToggle" |
`tradfriArrowHold` | \"commandTradfriArrowHold\" | "commandTradfriArrowHold" |
`tradfriArrowRelease` | \"commandTradfriArrowRelease\" | "commandTradfriArrowRelease" |
`tradfriArrowSingle` | \"commandTradfriArrowSingle\" | "commandTradfriArrowSingle" |
`upOpen` | \"commandUpOpen\" | "commandUpOpen" |
