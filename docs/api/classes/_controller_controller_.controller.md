[zigbee-herdsman](../README.md) › ["controller/controller"](../modules/_controller_controller_.md) › [Controller](_controller_controller_.controller.md)

# Class: Controller

## Hierarchy

* EventEmitter

  ↳ **Controller**

## Index

### Constructors

* [constructor](_controller_controller_.controller.md#constructor)

### Methods

* [createGroup](_controller_controller_.controller.md#creategroup)
* [getCoordinatorVersion](_controller_controller_.controller.md#getcoordinatorversion)
* [getDeviceByIeeeAddr](_controller_controller_.controller.md#getdevicebyieeeaddr)
* [getDevices](_controller_controller_.controller.md#getdevices)
* [getDevicesByType](_controller_controller_.controller.md#getdevicesbytype)
* [getGroupByID](_controller_controller_.controller.md#getgroupbyid)
* [getGroups](_controller_controller_.controller.md#getgroups)
* [getNetworkParameters](_controller_controller_.controller.md#getnetworkparameters)
* [getPermitJoin](_controller_controller_.controller.md#getpermitjoin)
* [permitJoin](_controller_controller_.controller.md#permitjoin)
* [reset](_controller_controller_.controller.md#reset)
* [setLED](_controller_controller_.controller.md#setled)
* [setTransmitPower](_controller_controller_.controller.md#settransmitpower)
* [start](_controller_controller_.controller.md#start)
* [stop](_controller_controller_.controller.md#stop)
* [supportsLED](_controller_controller_.controller.md#supportsled)
* [touchlinkFactoryReset](_controller_controller_.controller.md#touchlinkfactoryreset)

## Constructors

###  constructor

\+ **new Controller**(`options`: [Options](../interfaces/_controller_model_endpoint_.options.md)): *[Controller](_controller_controller_.controller.md)*

*Overrides void*

*Defined in [src/controller/controller.ts:71](https://github.com/Koenkk/zigbee-herdsman/blob/632e6e4/src/controller/controller.ts#L71)*

Create a controller

To auto detect the port provide `null` for `options.serialPort.path`

**Parameters:**

Name | Type |
------ | ------ |
`options` | [Options](../interfaces/_controller_model_endpoint_.options.md) |

**Returns:** *[Controller](_controller_controller_.controller.md)*

## Methods

###  createGroup

▸ **createGroup**(`groupID`: number): *[Group](_controller_model_group_.group.md)*

*Defined in [src/controller/controller.ts:266](https://github.com/Koenkk/zigbee-herdsman/blob/632e6e4/src/controller/controller.ts#L266)*

Create a Group

**Parameters:**

Name | Type |
------ | ------ |
`groupID` | number |

**Returns:** *[Group](_controller_model_group_.group.md)*

___

###  getCoordinatorVersion

▸ **getCoordinatorVersion**(): *Promise‹[CoordinatorVersion](../interfaces/_adapter_tstype_.coordinatorversion.md)›*

*Defined in [src/controller/controller.ts:220](https://github.com/Koenkk/zigbee-herdsman/blob/632e6e4/src/controller/controller.ts#L220)*

**Returns:** *Promise‹[CoordinatorVersion](../interfaces/_adapter_tstype_.coordinatorversion.md)›*

___

###  getDeviceByIeeeAddr

▸ **getDeviceByIeeeAddr**(`ieeeAddr`: string): *[Device](_controller_model_device_.device.md)*

*Defined in [src/controller/controller.ts:245](https://github.com/Koenkk/zigbee-herdsman/blob/632e6e4/src/controller/controller.ts#L245)*

Get device by ieeeAddr

**Parameters:**

Name | Type |
------ | ------ |
`ieeeAddr` | string |

**Returns:** *[Device](_controller_model_device_.device.md)*

___

###  getDevices

▸ **getDevices**(): *[Device](_controller_model_device_.device.md)[]*

*Defined in [src/controller/controller.ts:231](https://github.com/Koenkk/zigbee-herdsman/blob/632e6e4/src/controller/controller.ts#L231)*

Get all devices

**Returns:** *[Device](_controller_model_device_.device.md)[]*

___

###  getDevicesByType

▸ **getDevicesByType**(`type`: [DeviceType](../modules/_adapter_tstype_.md#devicetype)): *[Device](_controller_model_device_.device.md)[]*

*Defined in [src/controller/controller.ts:238](https://github.com/Koenkk/zigbee-herdsman/blob/632e6e4/src/controller/controller.ts#L238)*

Get all devices with a specific type

**Parameters:**

Name | Type |
------ | ------ |
`type` | [DeviceType](../modules/_adapter_tstype_.md#devicetype) |

**Returns:** *[Device](_controller_model_device_.device.md)[]*

___

###  getGroupByID

▸ **getGroupByID**(`groupID`: number): *[Group](_controller_model_group_.group.md)*

*Defined in [src/controller/controller.ts:252](https://github.com/Koenkk/zigbee-herdsman/blob/632e6e4/src/controller/controller.ts#L252)*

Get group by ID

**Parameters:**

Name | Type |
------ | ------ |
`groupID` | number |

**Returns:** *[Group](_controller_model_group_.group.md)*

___

###  getGroups

▸ **getGroups**(): *[Group](_controller_model_group_.group.md)[]*

*Defined in [src/controller/controller.ts:259](https://github.com/Koenkk/zigbee-herdsman/blob/632e6e4/src/controller/controller.ts#L259)*

Get all groups

**Returns:** *[Group](_controller_model_group_.group.md)[]*

___

###  getNetworkParameters

▸ **getNetworkParameters**(): *Promise‹[NetworkParameters](../interfaces/_adapter_tstype_.networkparameters.md)›*

*Defined in [src/controller/controller.ts:224](https://github.com/Koenkk/zigbee-herdsman/blob/632e6e4/src/controller/controller.ts#L224)*

**Returns:** *Promise‹[NetworkParameters](../interfaces/_adapter_tstype_.networkparameters.md)›*

___

###  getPermitJoin

▸ **getPermitJoin**(): *boolean*

*Defined in [src/controller/controller.ts:180](https://github.com/Koenkk/zigbee-herdsman/blob/632e6e4/src/controller/controller.ts#L180)*

**Returns:** *boolean*

___

###  permitJoin

▸ **permitJoin**(`permit`: boolean): *Promise‹void›*

*Defined in [src/controller/controller.ts:157](https://github.com/Koenkk/zigbee-herdsman/blob/632e6e4/src/controller/controller.ts#L157)*

**Parameters:**

Name | Type |
------ | ------ |
`permit` | boolean |

**Returns:** *Promise‹void›*

___

###  reset

▸ **reset**(`type`: "soft" | "hard"): *Promise‹void›*

*Defined in [src/controller/controller.ts:216](https://github.com/Koenkk/zigbee-herdsman/blob/632e6e4/src/controller/controller.ts#L216)*

**Parameters:**

Name | Type |
------ | ------ |
`type` | "soft" &#124; "hard" |

**Returns:** *Promise‹void›*

___

###  setLED

▸ **setLED**(`enabled`: boolean): *Promise‹void›*

*Defined in [src/controller/controller.ts:287](https://github.com/Koenkk/zigbee-herdsman/blob/632e6e4/src/controller/controller.ts#L287)*

 Enable/Disable the LED

**Parameters:**

Name | Type |
------ | ------ |
`enabled` | boolean |

**Returns:** *Promise‹void›*

___

###  setTransmitPower

▸ **setTransmitPower**(`value`: number): *Promise‹void›*

*Defined in [src/controller/controller.ts:280](https://github.com/Koenkk/zigbee-herdsman/blob/632e6e4/src/controller/controller.ts#L280)*

 Set transmit power of the adapter

**Parameters:**

Name | Type |
------ | ------ |
`value` | number |

**Returns:** *Promise‹void›*

___

###  start

▸ **start**(): *Promise‹void›*

*Defined in [src/controller/controller.ts:93](https://github.com/Koenkk/zigbee-herdsman/blob/632e6e4/src/controller/controller.ts#L93)*

Start the Herdsman controller

**Returns:** *Promise‹void›*

___

###  stop

▸ **stop**(): *Promise‹void›*

*Defined in [src/controller/controller.ts:184](https://github.com/Koenkk/zigbee-herdsman/blob/632e6e4/src/controller/controller.ts#L184)*

**Returns:** *Promise‹void›*

___

###  supportsLED

▸ **supportsLED**(): *Promise‹boolean›*

*Defined in [src/controller/controller.ts:273](https://github.com/Koenkk/zigbee-herdsman/blob/632e6e4/src/controller/controller.ts#L273)*

 Check if the adapters supports LED

**Returns:** *Promise‹boolean›*

___

###  touchlinkFactoryReset

▸ **touchlinkFactoryReset**(): *Promise‹boolean›*

*Defined in [src/controller/controller.ts:153](https://github.com/Koenkk/zigbee-herdsman/blob/632e6e4/src/controller/controller.ts#L153)*

**Returns:** *Promise‹boolean›*
