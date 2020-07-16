[zigbee-herdsman](../README.md) › ["src/controller/events"](_src_controller_events_.md)

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

* [CommandsLookup](_src_controller_events_.md#const-commandslookup)

## Type aliases

###  MessagePayloadType

Ƭ **MessagePayloadType**: *"attributeReport" | "readResponse" | "raw" | "read" | "write" | "commandOn" | "commandOffWithEffect" | "commandStep" | "commandStop" | "commandHueNotification" | "commandOff" | "commandStepColorTemp" | "commandMoveWithOnOff" | "commandMove" | "commandMoveHue" | "commandMoveToSaturation" | "commandStopWithOnOff" | "commandMoveToLevelWithOnOff" | "commandToggle" | "commandTradfriArrowSingle" | "commandTradfriArrowHold" | "commandTradfriArrowRelease" | "commandStepWithOnOff" | "commandMoveToColorTemp" | "commandMoveToColor" | "commandOnWithTimedOff" | "commandRecall" | "commandArm" | "commandPanic" | "commandEmergency" | "commandColorLoopSet" | "commandOperationEventNotification" | "commandStatusChangeNotification" | "commandEnhancedMoveToHueAndSaturation" | "commandUpOpen" | "commandDownClose" | "commandMoveToLevel" | "commandMoveColorTemp" | "commandGetData" | "commandSetDataResponse" | "commandGetWeeklyScheduleRsp" | "commandQueryNextImageRequest" | "commandNotification" | "commandAlertsNotification" | "commandProgrammingEventNotification" | "commandGetPinCodeRsp"*

*Defined in [src/controller/events.ts:74](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/events.ts#L74)*

## Object literals

### `Const` CommandsLookup

### ▪ **CommandsLookup**: *object*

*Defined in [src/controller/events.ts:30](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/events.ts#L30)*

###  alertsNotification

• **alertsNotification**: *"commandAlertsNotification"* = "commandAlertsNotification"

*Defined in [src/controller/events.ts:69](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/events.ts#L69)*

###  arm

• **arm**: *"commandArm"* = "commandArm"

*Defined in [src/controller/events.ts:56](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/events.ts#L56)*

###  colorLoopSet

• **colorLoopSet**: *"commandColorLoopSet"* = "commandColorLoopSet"

*Defined in [src/controller/events.ts:61](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/events.ts#L61)*

###  downClose

• **downClose**: *"commandDownClose"* = "commandDownClose"

*Defined in [src/controller/events.ts:63](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/events.ts#L63)*

###  emergency

• **emergency**: *"commandEmergency"* = "commandEmergency"

*Defined in [src/controller/events.ts:58](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/events.ts#L58)*

###  enhancedMoveToHueAndSaturation

• **enhancedMoveToHueAndSaturation**: *"commandEnhancedMoveToHueAndSaturation"* = "commandEnhancedMoveToHueAndSaturation"

*Defined in [src/controller/events.ts:62](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/events.ts#L62)*

###  getData

• **getData**: *"commandGetData"* = "commandGetData"

*Defined in [src/controller/events.ts:65](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/events.ts#L65)*

###  getPinCodeRsp

• **getPinCodeRsp**: *"commandGetPinCodeRsp"* = "commandGetPinCodeRsp"

*Defined in [src/controller/events.ts:71](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/events.ts#L71)*

###  getWeeklyScheduleRsp

• **getWeeklyScheduleRsp**: *"commandGetWeeklyScheduleRsp"* = "commandGetWeeklyScheduleRsp"

*Defined in [src/controller/events.ts:67](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/events.ts#L67)*

###  hueNotification

• **hueNotification**: *"commandHueNotification"* = "commandHueNotification"

*Defined in [src/controller/events.ts:36](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/events.ts#L36)*

###  move

• **move**: *"commandMove"* = "commandMove"

*Defined in [src/controller/events.ts:40](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/events.ts#L40)*

###  moveColorTemp

• **moveColorTemp**: *"commandMoveColorTemp"* = "commandMoveColorTemp"

*Defined in [src/controller/events.ts:41](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/events.ts#L41)*

###  moveHue

• **moveHue**: *"commandMoveHue"* = "commandMoveHue"

*Defined in [src/controller/events.ts:42](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/events.ts#L42)*

###  moveToColor

• **moveToColor**: *"commandMoveToColor"* = "commandMoveToColor"

*Defined in [src/controller/events.ts:53](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/events.ts#L53)*

###  moveToColorTemp

• **moveToColorTemp**: *"commandMoveToColorTemp"* = "commandMoveToColorTemp"

*Defined in [src/controller/events.ts:52](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/events.ts#L52)*

###  moveToLevel

• **moveToLevel**: *"commandMoveToLevel"* = "commandMoveToLevel"

*Defined in [src/controller/events.ts:45](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/events.ts#L45)*

###  moveToLevelWithOnOff

• **moveToLevelWithOnOff**: *"commandMoveToLevelWithOnOff"* = "commandMoveToLevelWithOnOff"

*Defined in [src/controller/events.ts:46](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/events.ts#L46)*

###  moveToSaturation

• **moveToSaturation**: *"commandMoveToSaturation"* = "commandMoveToSaturation"

*Defined in [src/controller/events.ts:43](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/events.ts#L43)*

###  moveWithOnOff

• **moveWithOnOff**: *"commandMoveWithOnOff"* = "commandMoveWithOnOff"

*Defined in [src/controller/events.ts:39](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/events.ts#L39)*

###  notification

• **notification**: *"commandNotification"* = "commandNotification"

*Defined in [src/controller/events.ts:31](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/events.ts#L31)*

###  off

• **off**: *"commandOff"* = "commandOff"

*Defined in [src/controller/events.ts:37](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/events.ts#L37)*

###  offWithEffect

• **offWithEffect**: *"commandOffWithEffect"* = "commandOffWithEffect"

*Defined in [src/controller/events.ts:33](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/events.ts#L33)*

###  on

• **on**: *"commandOn"* = "commandOn"

*Defined in [src/controller/events.ts:32](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/events.ts#L32)*

###  onWithTimedOff

• **onWithTimedOff**: *"commandOnWithTimedOff"* = "commandOnWithTimedOff"

*Defined in [src/controller/events.ts:54](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/events.ts#L54)*

###  operationEventNotification

• **operationEventNotification**: *"commandOperationEventNotification"* = "commandOperationEventNotification"

*Defined in [src/controller/events.ts:59](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/events.ts#L59)*

###  panic

• **panic**: *"commandPanic"* = "commandPanic"

*Defined in [src/controller/events.ts:57](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/events.ts#L57)*

###  programmingEventNotification

• **programmingEventNotification**: *"commandProgrammingEventNotification"* = "commandProgrammingEventNotification"

*Defined in [src/controller/events.ts:70](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/events.ts#L70)*

###  queryNextImageRequest

• **queryNextImageRequest**: *"commandQueryNextImageRequest"* = "commandQueryNextImageRequest"

*Defined in [src/controller/events.ts:68](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/events.ts#L68)*

###  recall

• **recall**: *"commandRecall"* = "commandRecall"

*Defined in [src/controller/events.ts:55](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/events.ts#L55)*

###  setDataResponse

• **setDataResponse**: *"commandSetDataResponse"* = "commandSetDataResponse"

*Defined in [src/controller/events.ts:66](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/events.ts#L66)*

###  statusChangeNotification

• **statusChangeNotification**: *"commandStatusChangeNotification"* = "commandStatusChangeNotification"

*Defined in [src/controller/events.ts:60](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/events.ts#L60)*

###  step

• **step**: *"commandStep"* = "commandStep"

*Defined in [src/controller/events.ts:34](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/events.ts#L34)*

###  stepColorTemp

• **stepColorTemp**: *"commandStepColorTemp"* = "commandStepColorTemp"

*Defined in [src/controller/events.ts:38](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/events.ts#L38)*

###  stepWithOnOff

• **stepWithOnOff**: *"commandStepWithOnOff"* = "commandStepWithOnOff"

*Defined in [src/controller/events.ts:51](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/events.ts#L51)*

###  stop

• **stop**: *"commandStop"* = "commandStop"

*Defined in [src/controller/events.ts:35](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/events.ts#L35)*

###  stopWithOnOff

• **stopWithOnOff**: *"commandStopWithOnOff"* = "commandStopWithOnOff"

*Defined in [src/controller/events.ts:44](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/events.ts#L44)*

###  toggle

• **toggle**: *"commandToggle"* = "commandToggle"

*Defined in [src/controller/events.ts:47](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/events.ts#L47)*

###  tradfriArrowHold

• **tradfriArrowHold**: *"commandTradfriArrowHold"* = "commandTradfriArrowHold"

*Defined in [src/controller/events.ts:49](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/events.ts#L49)*

###  tradfriArrowRelease

• **tradfriArrowRelease**: *"commandTradfriArrowRelease"* = "commandTradfriArrowRelease"

*Defined in [src/controller/events.ts:50](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/events.ts#L50)*

###  tradfriArrowSingle

• **tradfriArrowSingle**: *"commandTradfriArrowSingle"* = "commandTradfriArrowSingle"

*Defined in [src/controller/events.ts:48](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/events.ts#L48)*

###  upOpen

• **upOpen**: *"commandUpOpen"* = "commandUpOpen"

*Defined in [src/controller/events.ts:64](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/events.ts#L64)*
