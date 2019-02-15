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

*Defined in [src/controller/controller.ts:72](https://github.com/Koenkk/zigbee-herdsman/blob/3a6811a/src/controller/controller.ts#L72)*

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

*Defined in [src/controller/controller.ts:271](https://github.com/Koenkk/zigbee-herdsman/blob/3a6811a/src/controller/controller.ts#L271)*

Create a Group

**Parameters:**

Name | Type |
------ | ------ |
`groupID` | number |

**Returns:** *[Group](_controller_model_group_.group.md)*

___

###  getCoordinatorVersion

▸ **getCoordinatorVersion**(): *Promise‹[CoordinatorVersion](../interfaces/_adapter_tstype_.coordinatorversion.md)›*

*Defined in [src/controller/controller.ts:225](https://github.com/Koenkk/zigbee-herdsman/blob/3a6811a/src/controller/controller.ts#L225)*

**Returns:** *Promise‹[CoordinatorVersion](../interfaces/_adapter_tstype_.coordinatorversion.md)›*

___

###  getDeviceByIeeeAddr

▸ **getDeviceByIeeeAddr**(`ieeeAddr`: string): *[Device](_controller_model_device_.device.md)*

*Defined in [src/controller/controller.ts:250](https://github.com/Koenkk/zigbee-herdsman/blob/3a6811a/src/controller/controller.ts#L250)*

Get device by ieeeAddr

**Parameters:**

Name | Type |
------ | ------ |
`ieeeAddr` | string |

**Returns:** *[Device](_controller_model_device_.device.md)*

___

###  getDevices

▸ **getDevices**(): *[Device](_controller_model_device_.device.md)[]*

*Defined in [src/controller/controller.ts:236](https://github.com/Koenkk/zigbee-herdsman/blob/3a6811a/src/controller/controller.ts#L236)*

Get all devices

**Returns:** *[Device](_controller_model_device_.device.md)[]*

___

###  getDevicesByType

▸ **getDevicesByType**(`type`: [DeviceType](../modules/_adapter_tstype_.md#devicetype)): *[Device](_controller_model_device_.device.md)[]*

*Defined in [src/controller/controller.ts:243](https://github.com/Koenkk/zigbee-herdsman/blob/3a6811a/src/controller/controller.ts#L243)*

Get all devices with a specific type

**Parameters:**

Name | Type |
------ | ------ |
`type` | [DeviceType](../modules/_adapter_tstype_.md#devicetype) |

**Returns:** *[Device](_controller_model_device_.device.md)[]*

___

###  getGroupByID

▸ **getGroupByID**(`groupID`: number): *[Group](_controller_model_group_.group.md)*

*Defined in [src/controller/controller.ts:257](https://github.com/Koenkk/zigbee-herdsman/blob/3a6811a/src/controller/controller.ts#L257)*

Get group by ID

**Parameters:**

Name | Type |
------ | ------ |
`groupID` | number |

**Returns:** *[Group](_controller_model_group_.group.md)*

___

###  getGroups

▸ **getGroups**(): *[Group](_controller_model_group_.group.md)[]*

*Defined in [src/controller/controller.ts:264](https://github.com/Koenkk/zigbee-herdsman/blob/3a6811a/src/controller/controller.ts#L264)*

Get all groups

**Returns:** *[Group](_controller_model_group_.group.md)[]*

___

###  getNetworkParameters

▸ **getNetworkParameters**(): *Promise‹[NetworkParameters](../interfaces/_adapter_tstype_.networkparameters.md)›*

*Defined in [src/controller/controller.ts:229](https://github.com/Koenkk/zigbee-herdsman/blob/3a6811a/src/controller/controller.ts#L229)*

**Returns:** *Promise‹[NetworkParameters](../interfaces/_adapter_tstype_.networkparameters.md)›*

___

###  getPermitJoin

▸ **getPermitJoin**(): *boolean*

*Defined in [src/controller/controller.ts:185](https://github.com/Koenkk/zigbee-herdsman/blob/3a6811a/src/controller/controller.ts#L185)*

**Returns:** *boolean*

___

###  permitJoin

▸ **permitJoin**(`permit`: boolean, `device?`: [Device](_controller_model_device_.device.md)): *Promise‹void›*

*Defined in [src/controller/controller.ts:162](https://github.com/Koenkk/zigbee-herdsman/blob/3a6811a/src/controller/controller.ts#L162)*

**Parameters:**

Name | Type |
------ | ------ |
`permit` | boolean |
`device?` | [Device](_controller_model_device_.device.md) |

**Returns:** *Promise‹void›*

___

###  reset

▸ **reset**(`type`: "soft" | "hard"): *Promise‹void›*

*Defined in [src/controller/controller.ts:221](https://github.com/Koenkk/zigbee-herdsman/blob/3a6811a/src/controller/controller.ts#L221)*

**Parameters:**

Name | Type |
------ | ------ |
`type` | "soft" &#124; "hard" |

**Returns:** *Promise‹void›*

___

###  setLED

▸ **setLED**(`enabled`: boolean): *Promise‹void›*

*Defined in [src/controller/controller.ts:292](https://github.com/Koenkk/zigbee-herdsman/blob/3a6811a/src/controller/controller.ts#L292)*

 Enable/Disable the LED

**Parameters:**

Name | Type |
------ | ------ |
`enabled` | boolean |

**Returns:** *Promise‹void›*

___

###  setTransmitPower

▸ **setTransmitPower**(`value`: number): *Promise‹void›*

*Defined in [src/controller/controller.ts:285](https://github.com/Koenkk/zigbee-herdsman/blob/3a6811a/src/controller/controller.ts#L285)*

 Set transmit power of the adapter

**Parameters:**

Name | Type |
------ | ------ |
`value` | number |

**Returns:** *Promise‹void›*

___

###  start

▸ **start**(): *Promise‹void›*

*Defined in [src/controller/controller.ts:98](https://github.com/Koenkk/zigbee-herdsman/blob/3a6811a/src/controller/controller.ts#L98)*

Start the Herdsman controller

**Returns:** *Promise‹void›*

___

###  stop

▸ **stop**(): *Promise‹void›*

*Defined in [src/controller/controller.ts:189](https://github.com/Koenkk/zigbee-herdsman/blob/3a6811a/src/controller/controller.ts#L189)*

**Returns:** *Promise‹void›*

___

###  supportsLED

▸ **supportsLED**(): *Promise‹boolean›*

*Defined in [src/controller/controller.ts:278](https://github.com/Koenkk/zigbee-herdsman/blob/3a6811a/src/controller/controller.ts#L278)*

 Check if the adapters supports LED

**Returns:** *Promise‹boolean›*

___

###  touchlinkFactoryReset

▸ **touchlinkFactoryReset**(): *Promise‹boolean›*

*Defined in [src/controller/controller.ts:158](https://github.com/Koenkk/zigbee-herdsman/blob/3a6811a/src/controller/controller.ts#L158)*

**Returns:** *Promise‹boolean›*
