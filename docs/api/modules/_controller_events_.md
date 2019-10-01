[zigbee-herdsman](../README.md) › ["controller/events"](_controller_events_.md)

# External module: "controller/events"

## Index

### Enumerations

* [Events](../enums/_controller_events_.events.md)

### Interfaces

* [DeviceAnnouncePayload](../interfaces/_controller_events_.deviceannouncepayload.md)
* [DeviceInterviewPayload](../interfaces/_controller_events_.deviceinterviewpayload.md)
* [DeviceJoinedPayload](../interfaces/_controller_events_.devicejoinedpayload.md)
* [DeviceLeavePayload](../interfaces/_controller_events_.deviceleavepayload.md)
* [MessagePayload](../interfaces/_controller_events_.messagepayload.md)

### Type aliases

* [MessagePayloadType](_controller_events_.md#messagepayloadtype)

### Object literals

* [CommandsLookup](_controller_events_.md#const-commandslookup)

## Type aliases

###  MessagePayloadType

Ƭ **MessagePayloadType**: *"attributeReport" | "readResponse" | "raw" | "commandOn" | "commandOffWithEffect" | "commandStep" | "commandStop" | "commandHueNotification" | "commandOff" | "commandStepColorTemp" | "commandMoveWithOnOff" | "commandMove" | "commandMoveHue" | "commandMoveToSaturation" | "commandStopWithOnOff" | "commandMoveToLevelWithOnOff" | "commandToggle" | "commandTradfriArrowSingle" | "commandTradfriArrowHold" | "commandTradfriArrowRelease" | "commandStepWithOnOff" | "commandMoveToColorTemp" | "commandMoveToColor" | "commandOnWithTimedOff" | "commandRecall" | "commandArm" | "commandPanic" | "commandEmergency" | "commandColorLoopSet" | "commandOperationEventNotification" | "commandStatusChangeNotification" | "commandEnhancedMoveToHueAndSaturation" | "commandUpOpen" | "commandDownClose"*

*Defined in [controller/events.ts:64](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/events.ts#L64)*

## Object literals

### `Const` CommandsLookup

### ▪ **CommandsLookup**: *object*

*Defined in [controller/events.ts:30](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/events.ts#L30)*

###  arm

• **arm**: *"commandArm"* = "commandArm"

*Defined in [controller/events.ts:53](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/events.ts#L53)*

###  colorLoopSet

• **colorLoopSet**: *"commandColorLoopSet"* = "commandColorLoopSet"

*Defined in [controller/events.ts:58](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/events.ts#L58)*

###  downClose

• **downClose**: *"commandDownClose"* = "commandDownClose"

*Defined in [controller/events.ts:60](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/events.ts#L60)*

###  emergency

• **emergency**: *"commandEmergency"* = "commandEmergency"

*Defined in [controller/events.ts:55](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/events.ts#L55)*

###  enhancedMoveToHueAndSaturation

• **enhancedMoveToHueAndSaturation**: *"commandEnhancedMoveToHueAndSaturation"* = "commandEnhancedMoveToHueAndSaturation"

*Defined in [controller/events.ts:59](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/events.ts#L59)*

###  hueNotification

• **hueNotification**: *"commandHueNotification"* = "commandHueNotification"

*Defined in [controller/events.ts:35](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/events.ts#L35)*

###  move

• **move**: *"commandMove"* = "commandMove"

*Defined in [controller/events.ts:39](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/events.ts#L39)*

###  moveHue

• **moveHue**: *"commandMoveHue"* = "commandMoveHue"

*Defined in [controller/events.ts:40](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/events.ts#L40)*

###  moveToColor

• **moveToColor**: *"commandMoveToColor"* = "commandMoveToColor"

*Defined in [controller/events.ts:50](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/events.ts#L50)*

###  moveToColorTemp

• **moveToColorTemp**: *"commandMoveToColorTemp"* = "commandMoveToColorTemp"

*Defined in [controller/events.ts:49](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/events.ts#L49)*

###  moveToLevelWithOnOff

• **moveToLevelWithOnOff**: *"commandMoveToLevelWithOnOff"* = "commandMoveToLevelWithOnOff"

*Defined in [controller/events.ts:43](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/events.ts#L43)*

###  moveToSaturation

• **moveToSaturation**: *"commandMoveToSaturation"* = "commandMoveToSaturation"

*Defined in [controller/events.ts:41](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/events.ts#L41)*

###  moveWithOnOff

• **moveWithOnOff**: *"commandMoveWithOnOff"* = "commandMoveWithOnOff"

*Defined in [controller/events.ts:38](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/events.ts#L38)*

###  off

• **off**: *"commandOff"* = "commandOff"

*Defined in [controller/events.ts:36](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/events.ts#L36)*

###  offWithEffect

• **offWithEffect**: *"commandOffWithEffect"* = "commandOffWithEffect"

*Defined in [controller/events.ts:32](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/events.ts#L32)*

###  on

• **on**: *"commandOn"* = "commandOn"

*Defined in [controller/events.ts:31](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/events.ts#L31)*

###  onWithTimedOff

• **onWithTimedOff**: *"commandOnWithTimedOff"* = "commandOnWithTimedOff"

*Defined in [controller/events.ts:51](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/events.ts#L51)*

###  operationEventNotification

• **operationEventNotification**: *"commandOperationEventNotification"* = "commandOperationEventNotification"

*Defined in [controller/events.ts:56](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/events.ts#L56)*

###  panic

• **panic**: *"commandPanic"* = "commandPanic"

*Defined in [controller/events.ts:54](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/events.ts#L54)*

###  recall

• **recall**: *"commandRecall"* = "commandRecall"

*Defined in [controller/events.ts:52](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/events.ts#L52)*

###  statusChangeNotification

• **statusChangeNotification**: *"commandStatusChangeNotification"* = "commandStatusChangeNotification"

*Defined in [controller/events.ts:57](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/events.ts#L57)*

###  step

• **step**: *"commandStep"* = "commandStep"

*Defined in [controller/events.ts:33](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/events.ts#L33)*

###  stepColorTemp

• **stepColorTemp**: *"commandStepColorTemp"* = "commandStepColorTemp"

*Defined in [controller/events.ts:37](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/events.ts#L37)*

###  stepWithOnOff

• **stepWithOnOff**: *"commandStepWithOnOff"* = "commandStepWithOnOff"

*Defined in [controller/events.ts:48](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/events.ts#L48)*

###  stop

• **stop**: *"commandStop"* = "commandStop"

*Defined in [controller/events.ts:34](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/events.ts#L34)*

###  stopWithOnOff

• **stopWithOnOff**: *"commandStopWithOnOff"* = "commandStopWithOnOff"

*Defined in [controller/events.ts:42](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/events.ts#L42)*

###  toggle

• **toggle**: *"commandToggle"* = "commandToggle"

*Defined in [controller/events.ts:44](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/events.ts#L44)*

###  tradfriArrowHold

• **tradfriArrowHold**: *"commandTradfriArrowHold"* = "commandTradfriArrowHold"

*Defined in [controller/events.ts:46](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/events.ts#L46)*

###  tradfriArrowRelease

• **tradfriArrowRelease**: *"commandTradfriArrowRelease"* = "commandTradfriArrowRelease"

*Defined in [controller/events.ts:47](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/events.ts#L47)*

###  tradfriArrowSingle

• **tradfriArrowSingle**: *"commandTradfriArrowSingle"* = "commandTradfriArrowSingle"

*Defined in [controller/events.ts:45](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/events.ts#L45)*

###  upOpen

• **upOpen**: *"commandUpOpen"* = "commandUpOpen"

*Defined in [controller/events.ts:61](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/events.ts#L61)*
