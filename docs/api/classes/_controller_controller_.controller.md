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

\+ **new Controller**(`options`: [Options](../interfaces/_controller_model_group_.options.md)): *[Controller](_controller_controller_.controller.md)*

*Overrides void*

*Defined in [src/controller/controller.ts:66](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/controller.ts#L66)*

Create a controller

To auto detect the port provide `null` for `options.serialPort.path`

**Parameters:**

Name | Type |
------ | ------ |
`options` | [Options](../interfaces/_controller_model_group_.options.md) |

**Returns:** *[Controller](_controller_controller_.controller.md)*

## Methods

###  createGroup

▸ **createGroup**(`groupID`: number): *[Group](_controller_model_group_.group.md)*

*Defined in [src/controller/controller.ts:272](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/controller.ts#L272)*

Create a Group

**Parameters:**

Name | Type |
------ | ------ |
`groupID` | number |

**Returns:** *[Group](_controller_model_group_.group.md)*

___

###  getCoordinatorVersion

▸ **getCoordinatorVersion**(): *Promise‹[CoordinatorVersion](../interfaces/_adapter_tstype_.coordinatorversion.md)›*

*Defined in [src/controller/controller.ts:226](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/controller.ts#L226)*

**Returns:** *Promise‹[CoordinatorVersion](../interfaces/_adapter_tstype_.coordinatorversion.md)›*

___

###  getDeviceByIeeeAddr

▸ **getDeviceByIeeeAddr**(`ieeeAddr`: string): *[Device](_controller_model_device_.device.md)*

*Defined in [src/controller/controller.ts:251](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/controller.ts#L251)*

Get device by ieeeAddr

**Parameters:**

Name | Type |
------ | ------ |
`ieeeAddr` | string |

**Returns:** *[Device](_controller_model_device_.device.md)*

___

###  getDevices

▸ **getDevices**(): *[Device](_controller_model_device_.device.md)[]*

*Defined in [src/controller/controller.ts:237](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/controller.ts#L237)*

Get all devices

**Returns:** *[Device](_controller_model_device_.device.md)[]*

___

###  getDevicesByType

▸ **getDevicesByType**(`type`: [DeviceType](../modules/_adapter_tstype_.md#devicetype)): *[Device](_controller_model_device_.device.md)[]*

*Defined in [src/controller/controller.ts:244](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/controller.ts#L244)*

Get all devices with a specific type

**Parameters:**

Name | Type |
------ | ------ |
`type` | [DeviceType](../modules/_adapter_tstype_.md#devicetype) |

**Returns:** *[Device](_controller_model_device_.device.md)[]*

___

###  getGroupByID

▸ **getGroupByID**(`groupID`: number): *[Group](_controller_model_group_.group.md)*

*Defined in [src/controller/controller.ts:258](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/controller.ts#L258)*

Get group by ID

**Parameters:**

Name | Type |
------ | ------ |
`groupID` | number |

**Returns:** *[Group](_controller_model_group_.group.md)*

___

###  getGroups

▸ **getGroups**(): *[Group](_controller_model_group_.group.md)[]*

*Defined in [src/controller/controller.ts:265](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/controller.ts#L265)*

Get all groups

**Returns:** *[Group](_controller_model_group_.group.md)[]*

___

###  getNetworkParameters

▸ **getNetworkParameters**(): *Promise‹[NetworkParameters](../interfaces/_adapter_tstype_.networkparameters.md)›*

*Defined in [src/controller/controller.ts:230](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/controller.ts#L230)*

**Returns:** *Promise‹[NetworkParameters](../interfaces/_adapter_tstype_.networkparameters.md)›*

___

###  getPermitJoin

▸ **getPermitJoin**(): *boolean*

*Defined in [src/controller/controller.ts:186](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/controller.ts#L186)*

**Returns:** *boolean*

___

###  permitJoin

▸ **permitJoin**(`permit`: boolean, `device?`: [Device](_controller_model_device_.device.md)): *Promise‹void›*

*Defined in [src/controller/controller.ts:160](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/controller.ts#L160)*

**Parameters:**

Name | Type |
------ | ------ |
`permit` | boolean |
`device?` | [Device](_controller_model_device_.device.md) |

**Returns:** *Promise‹void›*

___

###  reset

▸ **reset**(`type`: "soft" | "hard"): *Promise‹void›*

*Defined in [src/controller/controller.ts:222](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/controller.ts#L222)*

**Parameters:**

Name | Type |
------ | ------ |
`type` | "soft" &#124; "hard" |

**Returns:** *Promise‹void›*

___

###  setLED

▸ **setLED**(`enabled`: boolean): *Promise‹void›*

*Defined in [src/controller/controller.ts:293](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/controller.ts#L293)*

 Enable/Disable the LED

**Parameters:**

Name | Type |
------ | ------ |
`enabled` | boolean |

**Returns:** *Promise‹void›*

___

###  setTransmitPower

▸ **setTransmitPower**(`value`: number): *Promise‹void›*

*Defined in [src/controller/controller.ts:286](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/controller.ts#L286)*

 Set transmit power of the adapter

**Parameters:**

Name | Type |
------ | ------ |
`value` | number |

**Returns:** *Promise‹void›*

___

###  start

▸ **start**(): *Promise‹void›*

*Defined in [src/controller/controller.ts:92](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/controller.ts#L92)*

Start the Herdsman controller

**Returns:** *Promise‹void›*

___

###  stop

▸ **stop**(): *Promise‹void›*

*Defined in [src/controller/controller.ts:190](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/controller.ts#L190)*

**Returns:** *Promise‹void›*

___

###  supportsLED

▸ **supportsLED**(): *Promise‹boolean›*

*Defined in [src/controller/controller.ts:279](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/controller.ts#L279)*

 Check if the adapters supports LED

**Returns:** *Promise‹boolean›*

___

###  touchlinkFactoryReset

▸ **touchlinkFactoryReset**(): *Promise‹boolean›*

*Defined in [src/controller/controller.ts:156](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/controller.ts#L156)*

**Returns:** *Promise‹boolean›*
