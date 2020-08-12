[zigbee-herdsman](../README.md) › ["src/controller/controller"](../modules/_src_controller_controller_.md) › [Controller](_src_controller_controller_.controller.md)

# Class: Controller

## Hierarchy

* EventEmitter

  ↳ **Controller**

## Index

### Constructors

* [constructor](_src_controller_controller_.controller.md#constructor)

### Methods

* [createGroup](_src_controller_controller_.controller.md#creategroup)
* [getCoordinatorVersion](_src_controller_controller_.controller.md#getcoordinatorversion)
* [getDeviceByIeeeAddr](_src_controller_controller_.controller.md#getdevicebyieeeaddr)
* [getDevices](_src_controller_controller_.controller.md#getdevices)
* [getDevicesByType](_src_controller_controller_.controller.md#getdevicesbytype)
* [getGroupByID](_src_controller_controller_.controller.md#getgroupbyid)
* [getGroups](_src_controller_controller_.controller.md#getgroups)
* [getNetworkParameters](_src_controller_controller_.controller.md#getnetworkparameters)
* [getPermitJoin](_src_controller_controller_.controller.md#getpermitjoin)
* [permitJoin](_src_controller_controller_.controller.md#permitjoin)
* [reset](_src_controller_controller_.controller.md#reset)
* [setLED](_src_controller_controller_.controller.md#setled)
* [setTransmitPower](_src_controller_controller_.controller.md#settransmitpower)
* [start](_src_controller_controller_.controller.md#start)
* [stop](_src_controller_controller_.controller.md#stop)
* [supportsLED](_src_controller_controller_.controller.md#supportsled)
* [touchlinkFactoryReset](_src_controller_controller_.controller.md#touchlinkfactoryreset)

## Constructors

###  constructor

\+ **new Controller**(`options`: [Options](../interfaces/_src_controller_model_group_.options.md)): *[Controller](_src_controller_controller_.controller.md)*

*Overrides void*

*Defined in [src/controller/controller.ts:67](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/controller.ts#L67)*

Create a controller

To auto detect the port provide `null` for `options.serialPort.path`

**Parameters:**

Name | Type |
------ | ------ |
`options` | [Options](../interfaces/_src_controller_model_group_.options.md) |

**Returns:** *[Controller](_src_controller_controller_.controller.md)*

## Methods

###  createGroup

▸ **createGroup**(`groupID`: number): *[Group](_src_controller_model_group_.group.md)*

*Defined in [src/controller/controller.ts:274](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/controller.ts#L274)*

Create a Group

**Parameters:**

Name | Type |
------ | ------ |
`groupID` | number |

**Returns:** *[Group](_src_controller_model_group_.group.md)*

___

###  getCoordinatorVersion

▸ **getCoordinatorVersion**(): *Promise‹[CoordinatorVersion](../interfaces/_src_adapter_tstype_.coordinatorversion.md)›*

*Defined in [src/controller/controller.ts:228](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/controller.ts#L228)*

**Returns:** *Promise‹[CoordinatorVersion](../interfaces/_src_adapter_tstype_.coordinatorversion.md)›*

___

###  getDeviceByIeeeAddr

▸ **getDeviceByIeeeAddr**(`ieeeAddr`: string): *[Device](_src_controller_model_device_.device.md)*

*Defined in [src/controller/controller.ts:253](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/controller.ts#L253)*

Get device by ieeeAddr

**Parameters:**

Name | Type |
------ | ------ |
`ieeeAddr` | string |

**Returns:** *[Device](_src_controller_model_device_.device.md)*

___

###  getDevices

▸ **getDevices**(): *[Device](_src_controller_model_device_.device.md)[]*

*Defined in [src/controller/controller.ts:239](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/controller.ts#L239)*

Get all devices

**Returns:** *[Device](_src_controller_model_device_.device.md)[]*

___

###  getDevicesByType

▸ **getDevicesByType**(`type`: [DeviceType](../modules/_src_adapter_tstype_.md#devicetype)): *[Device](_src_controller_model_device_.device.md)[]*

*Defined in [src/controller/controller.ts:246](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/controller.ts#L246)*

Get all devices with a specific type

**Parameters:**

Name | Type |
------ | ------ |
`type` | [DeviceType](../modules/_src_adapter_tstype_.md#devicetype) |

**Returns:** *[Device](_src_controller_model_device_.device.md)[]*

___

###  getGroupByID

▸ **getGroupByID**(`groupID`: number): *[Group](_src_controller_model_group_.group.md)*

*Defined in [src/controller/controller.ts:260](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/controller.ts#L260)*

Get group by ID

**Parameters:**

Name | Type |
------ | ------ |
`groupID` | number |

**Returns:** *[Group](_src_controller_model_group_.group.md)*

___

###  getGroups

▸ **getGroups**(): *[Group](_src_controller_model_group_.group.md)[]*

*Defined in [src/controller/controller.ts:267](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/controller.ts#L267)*

Get all groups

**Returns:** *[Group](_src_controller_model_group_.group.md)[]*

___

###  getNetworkParameters

▸ **getNetworkParameters**(): *Promise‹[NetworkParameters](../interfaces/_src_adapter_tstype_.networkparameters.md)›*

*Defined in [src/controller/controller.ts:232](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/controller.ts#L232)*

**Returns:** *Promise‹[NetworkParameters](../interfaces/_src_adapter_tstype_.networkparameters.md)›*

___

###  getPermitJoin

▸ **getPermitJoin**(): *boolean*

*Defined in [src/controller/controller.ts:188](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/controller.ts#L188)*

**Returns:** *boolean*

___

###  permitJoin

▸ **permitJoin**(`permit`: boolean, `device?`: [Device](_src_controller_model_device_.device.md)): *Promise‹void›*

*Defined in [src/controller/controller.ts:162](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/controller.ts#L162)*

**Parameters:**

Name | Type |
------ | ------ |
`permit` | boolean |
`device?` | [Device](_src_controller_model_device_.device.md) |

**Returns:** *Promise‹void›*

___

###  reset

▸ **reset**(`type`: "soft" | "hard"): *Promise‹void›*

*Defined in [src/controller/controller.ts:224](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/controller.ts#L224)*

**Parameters:**

Name | Type |
------ | ------ |
`type` | "soft" &#124; "hard" |

**Returns:** *Promise‹void›*

___

###  setLED

▸ **setLED**(`enabled`: boolean): *Promise‹void›*

*Defined in [src/controller/controller.ts:295](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/controller.ts#L295)*

 Enable/Disable the LED

**Parameters:**

Name | Type |
------ | ------ |
`enabled` | boolean |

**Returns:** *Promise‹void›*

___

###  setTransmitPower

▸ **setTransmitPower**(`value`: number): *Promise‹void›*

*Defined in [src/controller/controller.ts:288](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/controller.ts#L288)*

 Set transmit power of the adapter

**Parameters:**

Name | Type |
------ | ------ |
`value` | number |

**Returns:** *Promise‹void›*

___

###  start

▸ **start**(): *Promise‹void›*

*Defined in [src/controller/controller.ts:93](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/controller.ts#L93)*

Start the Herdsman controller

**Returns:** *Promise‹void›*

___

###  stop

▸ **stop**(): *Promise‹void›*

*Defined in [src/controller/controller.ts:192](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/controller.ts#L192)*

**Returns:** *Promise‹void›*

___

###  supportsLED

▸ **supportsLED**(): *Promise‹boolean›*

*Defined in [src/controller/controller.ts:281](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/controller.ts#L281)*

 Check if the adapters supports LED

**Returns:** *Promise‹boolean›*

___

###  touchlinkFactoryReset

▸ **touchlinkFactoryReset**(): *Promise‹boolean›*

*Defined in [src/controller/controller.ts:158](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/controller.ts#L158)*

**Returns:** *Promise‹boolean›*
