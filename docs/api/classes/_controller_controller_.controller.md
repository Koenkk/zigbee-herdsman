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
* [setLED](_controller_controller_.controller.md#setled)
* [softReset](_controller_controller_.controller.md#softreset)
* [hardReset](_controller_controller_.controller.md#hardreset)
* [start](_controller_controller_.controller.md#start)
* [stop](_controller_controller_.controller.md#stop)

## Constructors

###  constructor

\+ **new Controller**(`options`: [Options](../interfaces/_controller_controller_.options.md)): *[Controller](_controller_controller_.controller.md)*

*Defined in [controller/controller.ts:60](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/controller.ts#L60)*

Create a controller

**Parameters:**

Name | Type |
------ | ------ |
`options` | [Options](../interfaces/_controller_controller_.options.md) |

**Returns:** *[Controller](_controller_controller_.controller.md)*

## Methods

###  createGroup

▸ **createGroup**(`groupID`: number): *[Group](_controller_model_group_.group.md)*

*Defined in [controller/controller.ts:238](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/controller.ts#L245)*

Create a Group

**Parameters:**

Name | Type |
------ | ------ |
`groupID` | number |

**Returns:** *[Group](_controller_model_group_.group.md)*

___

###  getCoordinatorVersion

▸ **getCoordinatorVersion**(): *Promise‹[CoordinatorVersion](../interfaces/_adapter_tstype_.coordinatorversion.md)›*

*Defined in [controller/controller.ts:192](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/controller.ts#L199)*

**Returns:** *Promise‹[CoordinatorVersion](../interfaces/_adapter_tstype_.coordinatorversion.md)›*

___

###  getDeviceByIeeeAddr

▸ **getDeviceByIeeeAddr**(`ieeeAddr`: string): *[Device](_controller_model_device_.device.md)*

*Defined in [controller/controller.ts:217](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/controller.ts#L224)*

Get device by ieeeAddr

**Parameters:**

Name | Type |
------ | ------ |
`ieeeAddr` | string |

**Returns:** *[Device](_controller_model_device_.device.md)*

___

###  getDevices

▸ **getDevices**(): *[Device](_controller_model_device_.device.md)[]*

*Defined in [controller/controller.ts:203](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/controller.ts#L210)*

Get all devices

**Returns:** *[Device](_controller_model_device_.device.md)[]*

___

###  getDevicesByType

▸ **getDevicesByType**(`type`: [DeviceType](../modules/_adapter_tstype_.md#devicetype)): *[Device](_controller_model_device_.device.md)[]*

*Defined in [controller/controller.ts:210](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/controller.ts#L217)*

Get all devices with a specific type

**Parameters:**

Name | Type |
------ | ------ |
`type` | [DeviceType](../modules/_adapter_tstype_.md#devicetype) |

**Returns:** *[Device](_controller_model_device_.device.md)[]*

___

###  getGroupByID

▸ **getGroupByID**(`groupID`: number): *[Group](_controller_model_group_.group.md)*

*Defined in [controller/controller.ts:224](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/controller.ts#L231)*

Get group by ID

**Parameters:**

Name | Type |
------ | ------ |
`groupID` | number |

**Returns:** *[Group](_controller_model_group_.group.md)*

___

###  getGroups

▸ **getGroups**(): *[Group](_controller_model_group_.group.md)[]*

*Defined in [controller/controller.ts:231](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/controller.ts#L238)*

Get all groups

**Returns:** *[Group](_controller_model_group_.group.md)[]*

___

###  getNetworkParameters

▸ **getNetworkParameters**(): *Promise‹[NetworkParameters](../interfaces/_adapter_tstype_.networkparameters.md)›*

*Defined in [controller/controller.ts:196](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/controller.ts#L203)*

**Returns:** *Promise‹[NetworkParameters](../interfaces/_adapter_tstype_.networkparameters.md)›*

___

###  getPermitJoin

▸ **getPermitJoin**(): *boolean*

*Defined in [controller/controller.ts:149](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/controller.ts#L149)*

**Returns:** *boolean*

___

###  permitJoin

▸ **permitJoin**(`permit`: boolean): *Promise‹void›*

*Defined in [controller/controller.ts:126](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/controller.ts#L126)*

**Parameters:**

Name | Type |
------ | ------ |
`permit` | boolean |

**Returns:** *Promise‹void›*

___

###  setLED

▸ **setLED**(`enabled`: boolean): *Promise‹void›*

*Defined in [controller/controller.ts:245](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/controller.ts#L252)*

 Enable/Disable the LED

**Parameters:**

Name | Type |
------ | ------ |
`enabled` | boolean |

**Returns:** *Promise‹void›*

___

###  softReset

▸ **softReset**(): *Promise‹void›*

*Defined in [controller/controller.ts:188](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/controller.ts#L188)*

soft-reset the z-stack

**Returns:** *Promise‹void›*

___

###  hardReset

▸ **hardReset**(): *Promise‹void›*

*Defined in [controller/controller.ts:195](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/controller.ts#L195)*

hard-reset the z-stack

**Returns:** *Promise‹void›*

___

###  start

▸ **start**(): *Promise‹void›*

*Defined in [controller/controller.ts:81](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/controller.ts#L81)*

Start the Herdsman controller

**Returns:** *Promise‹void›*

___

###  stop

▸ **stop**(): *Promise‹void›*

*Defined in [controller/controller.ts:153](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/controller.ts#L153)*

**Returns:** *Promise‹void›*
