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
* [start](_controller_controller_.controller.md#start)
* [stop](_controller_controller_.controller.md#stop)
* [supportsLED](_controller_controller_.controller.md#supportsled)

## Constructors

###  constructor

\+ **new Controller**(`options`: [Options](../interfaces/_controller_controller_.options.md)): *[Controller](_controller_controller_.controller.md)*

*Defined in [controller/controller.ts:67](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/controller.ts#L67)*

Create a controller

To auto detect the port provide `null` for `options.serialPort.path`

**Parameters:**

Name | Type |
------ | ------ |
`options` | [Options](../interfaces/_controller_controller_.options.md) |

**Returns:** *[Controller](_controller_controller_.controller.md)*

## Methods

###  createGroup

▸ **createGroup**(`groupID`: number): *[Group](_controller_model_group_.group.md)*

*Defined in [controller/controller.ts:244](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/controller.ts#L244)*

Create a Group

**Parameters:**

Name | Type |
------ | ------ |
`groupID` | number |

**Returns:** *[Group](_controller_model_group_.group.md)*

___

###  getCoordinatorVersion

▸ **getCoordinatorVersion**(): *Promise‹[CoordinatorVersion](../interfaces/_adapter_tstype_.coordinatorversion.md)›*

*Defined in [controller/controller.ts:198](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/controller.ts#L198)*

**Returns:** *Promise‹[CoordinatorVersion](../interfaces/_adapter_tstype_.coordinatorversion.md)›*

___

###  getDeviceByIeeeAddr

▸ **getDeviceByIeeeAddr**(`ieeeAddr`: string): *[Device](_controller_model_device_.device.md)*

*Defined in [controller/controller.ts:223](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/controller.ts#L223)*

Get device by ieeeAddr

**Parameters:**

Name | Type |
------ | ------ |
`ieeeAddr` | string |

**Returns:** *[Device](_controller_model_device_.device.md)*

___

###  getDevices

▸ **getDevices**(): *[Device](_controller_model_device_.device.md)[]*

*Defined in [controller/controller.ts:209](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/controller.ts#L209)*

Get all devices

**Returns:** *[Device](_controller_model_device_.device.md)[]*

___

###  getDevicesByType

▸ **getDevicesByType**(`type`: [DeviceType](../modules/_adapter_tstype_.md#devicetype)): *[Device](_controller_model_device_.device.md)[]*

*Defined in [controller/controller.ts:216](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/controller.ts#L216)*

Get all devices with a specific type

**Parameters:**

Name | Type |
------ | ------ |
`type` | [DeviceType](../modules/_adapter_tstype_.md#devicetype) |

**Returns:** *[Device](_controller_model_device_.device.md)[]*

___

###  getGroupByID

▸ **getGroupByID**(`groupID`: number): *[Group](_controller_model_group_.group.md)*

*Defined in [controller/controller.ts:230](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/controller.ts#L230)*

Get group by ID

**Parameters:**

Name | Type |
------ | ------ |
`groupID` | number |

**Returns:** *[Group](_controller_model_group_.group.md)*

___

###  getGroups

▸ **getGroups**(): *[Group](_controller_model_group_.group.md)[]*

*Defined in [controller/controller.ts:237](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/controller.ts#L237)*

Get all groups

**Returns:** *[Group](_controller_model_group_.group.md)[]*

___

###  getNetworkParameters

▸ **getNetworkParameters**(): *Promise‹[NetworkParameters](../interfaces/_adapter_tstype_.networkparameters.md)›*

*Defined in [controller/controller.ts:202](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/controller.ts#L202)*

**Returns:** *Promise‹[NetworkParameters](../interfaces/_adapter_tstype_.networkparameters.md)›*

___

###  getPermitJoin

▸ **getPermitJoin**(): *boolean*

*Defined in [controller/controller.ts:158](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/controller.ts#L158)*

**Returns:** *boolean*

___

###  permitJoin

▸ **permitJoin**(`permit`: boolean): *Promise‹void›*

*Defined in [controller/controller.ts:135](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/controller.ts#L135)*

**Parameters:**

Name | Type |
------ | ------ |
`permit` | boolean |

**Returns:** *Promise‹void›*

___

###  reset

▸ **reset**(`type`: "soft" | "hard"): *Promise‹void›*

*Defined in [controller/controller.ts:194](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/controller.ts#L194)*

**Parameters:**

Name | Type |
------ | ------ |
`type` | "soft" &#124; "hard" |

**Returns:** *Promise‹void›*

___

###  setLED

▸ **setLED**(`enabled`: boolean): *Promise‹void›*

*Defined in [controller/controller.ts:258](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/controller.ts#L258)*

 Enable/Disable the LED

**Parameters:**

Name | Type |
------ | ------ |
`enabled` | boolean |

**Returns:** *Promise‹void›*

___

###  start

▸ **start**(): *Promise‹void›*

*Defined in [controller/controller.ts:89](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/controller.ts#L89)*

Start the Herdsman controller

**Returns:** *Promise‹void›*

___

###  stop

▸ **stop**(): *Promise‹void›*

*Defined in [controller/controller.ts:162](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/controller.ts#L162)*

**Returns:** *Promise‹void›*

___

###  supportsLED

▸ **supportsLED**(): *Promise‹boolean›*

*Defined in [controller/controller.ts:251](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/controller.ts#L251)*

 Check if the adapters supports LED

**Returns:** *Promise‹boolean›*
