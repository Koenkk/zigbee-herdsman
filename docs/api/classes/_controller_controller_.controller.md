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

*Defined in [controller/controller.ts:69](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/controller.ts#L69)*

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

*Defined in [controller/controller.ts:250](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/controller.ts#L250)*

Create a Group

**Parameters:**

Name | Type |
------ | ------ |
`groupID` | number |

**Returns:** *[Group](_controller_model_group_.group.md)*

___

###  getCoordinatorVersion

▸ **getCoordinatorVersion**(): *Promise‹[CoordinatorVersion](../interfaces/_adapter_tstype_.coordinatorversion.md)›*

*Defined in [controller/controller.ts:204](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/controller.ts#L204)*

**Returns:** *Promise‹[CoordinatorVersion](../interfaces/_adapter_tstype_.coordinatorversion.md)›*

___

###  getDeviceByIeeeAddr

▸ **getDeviceByIeeeAddr**(`ieeeAddr`: string): *[Device](_controller_model_device_.device.md)*

*Defined in [controller/controller.ts:229](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/controller.ts#L229)*

Get device by ieeeAddr

**Parameters:**

Name | Type |
------ | ------ |
`ieeeAddr` | string |

**Returns:** *[Device](_controller_model_device_.device.md)*

___

###  getDevices

▸ **getDevices**(): *[Device](_controller_model_device_.device.md)[]*

*Defined in [controller/controller.ts:215](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/controller.ts#L215)*

Get all devices

**Returns:** *[Device](_controller_model_device_.device.md)[]*

___

###  getDevicesByType

▸ **getDevicesByType**(`type`: [DeviceType](../modules/_adapter_tstype_.md#devicetype)): *[Device](_controller_model_device_.device.md)[]*

*Defined in [controller/controller.ts:222](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/controller.ts#L222)*

Get all devices with a specific type

**Parameters:**

Name | Type |
------ | ------ |
`type` | [DeviceType](../modules/_adapter_tstype_.md#devicetype) |

**Returns:** *[Device](_controller_model_device_.device.md)[]*

___

###  getGroupByID

▸ **getGroupByID**(`groupID`: number): *[Group](_controller_model_group_.group.md)*

*Defined in [controller/controller.ts:236](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/controller.ts#L236)*

Get group by ID

**Parameters:**

Name | Type |
------ | ------ |
`groupID` | number |

**Returns:** *[Group](_controller_model_group_.group.md)*

___

###  getGroups

▸ **getGroups**(): *[Group](_controller_model_group_.group.md)[]*

*Defined in [controller/controller.ts:243](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/controller.ts#L243)*

Get all groups

**Returns:** *[Group](_controller_model_group_.group.md)[]*

___

###  getNetworkParameters

▸ **getNetworkParameters**(): *Promise‹[NetworkParameters](../interfaces/_adapter_tstype_.networkparameters.md)›*

*Defined in [controller/controller.ts:208](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/controller.ts#L208)*

**Returns:** *Promise‹[NetworkParameters](../interfaces/_adapter_tstype_.networkparameters.md)›*

___

###  getPermitJoin

▸ **getPermitJoin**(): *boolean*

*Defined in [controller/controller.ts:164](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/controller.ts#L164)*

**Returns:** *boolean*

___

###  permitJoin

▸ **permitJoin**(`permit`: boolean): *Promise‹void›*

*Defined in [controller/controller.ts:141](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/controller.ts#L141)*

**Parameters:**

Name | Type |
------ | ------ |
`permit` | boolean |

**Returns:** *Promise‹void›*

___

###  reset

▸ **reset**(`type`: "soft" | "hard"): *Promise‹void›*

*Defined in [controller/controller.ts:200](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/controller.ts#L200)*

**Parameters:**

Name | Type |
------ | ------ |
`type` | "soft" &#124; "hard" |

**Returns:** *Promise‹void›*

___

###  setLED

▸ **setLED**(`enabled`: boolean): *Promise‹void›*

*Defined in [controller/controller.ts:264](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/controller.ts#L264)*

 Enable/Disable the LED

**Parameters:**

Name | Type |
------ | ------ |
`enabled` | boolean |

**Returns:** *Promise‹void›*

___

###  start

▸ **start**(): *Promise‹void›*

*Defined in [controller/controller.ts:91](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/controller.ts#L91)*

Start the Herdsman controller

**Returns:** *Promise‹void›*

___

###  stop

▸ **stop**(): *Promise‹void›*

*Defined in [controller/controller.ts:168](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/controller.ts#L168)*

**Returns:** *Promise‹void›*

___

###  supportsLED

▸ **supportsLED**(): *Promise‹boolean›*

*Defined in [controller/controller.ts:257](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/controller.ts#L257)*

 Check if the adapters supports LED

**Returns:** *Promise‹boolean›*
