**[zigbee-herdsman](../README.md)**

> [Globals](../README.md) / ["src/controller/controller"](../modules/_src_controller_controller_.md) / Controller

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
* [getDeviceByNetworkAddress](_src_controller_controller_.controller.md#getdevicebynetworkaddress)
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
* [touchlinkFactoryResetFirst](_src_controller_controller_.controller.md#touchlinkfactoryresetfirst)
* [touchlinkIdentify](_src_controller_controller_.controller.md#touchlinkidentify)
* [touchlinkScan](_src_controller_controller_.controller.md#touchlinkscan)

## Constructors

### constructor

\+ **new Controller**(`options`: [Options](../interfaces/_src_controller_model_group_.options.md)): [Controller](_src_controller_controller_.controller.md)

*Overrides void*

*Defined in [src/controller/controller.ts:69](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/controller.ts#L69)*

Create a controller

To auto detect the port provide `null` for `options.serialPort.path`

#### Parameters:

Name | Type |
------ | ------ |
`options` | [Options](../interfaces/_src_controller_model_group_.options.md) |

**Returns:** [Controller](_src_controller_controller_.controller.md)

## Methods

### createGroup

▸ **createGroup**(`groupID`: number): [Group](_src_controller_model_group_.group.md)

*Defined in [src/controller/controller.ts:307](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/controller.ts#L307)*

Create a Group

#### Parameters:

Name | Type |
------ | ------ |
`groupID` | number |

**Returns:** [Group](_src_controller_model_group_.group.md)

___

### getCoordinatorVersion

▸ **getCoordinatorVersion**(): Promise\<[CoordinatorVersion](../interfaces/_src_adapter_tstype_.coordinatorversion.md)>

*Defined in [src/controller/controller.ts:254](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/controller.ts#L254)*

**Returns:** Promise\<[CoordinatorVersion](../interfaces/_src_adapter_tstype_.coordinatorversion.md)>

___

### getDeviceByIeeeAddr

▸ **getDeviceByIeeeAddr**(`ieeeAddr`: string): [Device](_src_controller_model_device_.device.md)

*Defined in [src/controller/controller.ts:279](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/controller.ts#L279)*

Get device by ieeeAddr

#### Parameters:

Name | Type |
------ | ------ |
`ieeeAddr` | string |

**Returns:** [Device](_src_controller_model_device_.device.md)

___

### getDeviceByNetworkAddress

▸ **getDeviceByNetworkAddress**(`networkAddress`: number): [Device](_src_controller_model_device_.device.md)

*Defined in [src/controller/controller.ts:286](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/controller.ts#L286)*

Get device by networkAddress

#### Parameters:

Name | Type |
------ | ------ |
`networkAddress` | number |

**Returns:** [Device](_src_controller_model_device_.device.md)

___

### getDevices

▸ **getDevices**(): [Device](_src_controller_model_device_.device.md)[]

*Defined in [src/controller/controller.ts:265](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/controller.ts#L265)*

Get all devices

**Returns:** [Device](_src_controller_model_device_.device.md)[]

___

### getDevicesByType

▸ **getDevicesByType**(`type`: [DeviceType](../modules/_src_adapter_tstype_.md#devicetype)): [Device](_src_controller_model_device_.device.md)[]

*Defined in [src/controller/controller.ts:272](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/controller.ts#L272)*

Get all devices with a specific type

#### Parameters:

Name | Type |
------ | ------ |
`type` | [DeviceType](../modules/_src_adapter_tstype_.md#devicetype) |

**Returns:** [Device](_src_controller_model_device_.device.md)[]

___

### getGroupByID

▸ **getGroupByID**(`groupID`: number): [Group](_src_controller_model_group_.group.md)

*Defined in [src/controller/controller.ts:293](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/controller.ts#L293)*

Get group by ID

#### Parameters:

Name | Type |
------ | ------ |
`groupID` | number |

**Returns:** [Group](_src_controller_model_group_.group.md)

___

### getGroups

▸ **getGroups**(): [Group](_src_controller_model_group_.group.md)[]

*Defined in [src/controller/controller.ts:300](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/controller.ts#L300)*

Get all groups

**Returns:** [Group](_src_controller_model_group_.group.md)[]

___

### getNetworkParameters

▸ **getNetworkParameters**(): Promise\<[NetworkParameters](../interfaces/_src_adapter_tstype_.networkparameters.md)>

*Defined in [src/controller/controller.ts:258](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/controller.ts#L258)*

**Returns:** Promise\<[NetworkParameters](../interfaces/_src_adapter_tstype_.networkparameters.md)>

___

### getPermitJoin

▸ **getPermitJoin**(): boolean

*Defined in [src/controller/controller.ts:209](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/controller.ts#L209)*

**Returns:** boolean

___

### permitJoin

▸ **permitJoin**(`permit`: boolean, `device?`: [Device](_src_controller_model_device_.device.md)): Promise\<void>

*Defined in [src/controller/controller.ts:183](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/controller.ts#L183)*

#### Parameters:

Name | Type |
------ | ------ |
`permit` | boolean |
`device?` | [Device](_src_controller_model_device_.device.md) |

**Returns:** Promise\<void>

___

### reset

▸ **reset**(`type`: \"soft\" \| \"hard\"): Promise\<void>

*Defined in [src/controller/controller.ts:250](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/controller.ts#L250)*

#### Parameters:

Name | Type |
------ | ------ |
`type` | \"soft\" \| \"hard\" |

**Returns:** Promise\<void>

___

### setLED

▸ **setLED**(`enabled`: boolean): Promise\<void>

*Defined in [src/controller/controller.ts:328](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/controller.ts#L328)*

 Enable/Disable the LED

#### Parameters:

Name | Type |
------ | ------ |
`enabled` | boolean |

**Returns:** Promise\<void>

___

### setTransmitPower

▸ **setTransmitPower**(`value`: number): Promise\<void>

*Defined in [src/controller/controller.ts:321](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/controller.ts#L321)*

 Set transmit power of the adapter

#### Parameters:

Name | Type |
------ | ------ |
`value` | number |

**Returns:** Promise\<void>

___

### start

▸ **start**(): Promise\<void>

*Defined in [src/controller/controller.ts:99](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/controller.ts#L99)*

Start the Herdsman controller

**Returns:** Promise\<void>

___

### stop

▸ **stop**(): Promise\<void>

*Defined in [src/controller/controller.ts:213](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/controller.ts#L213)*

**Returns:** Promise\<void>

___

### supportsLED

▸ **supportsLED**(): Promise\<boolean>

*Defined in [src/controller/controller.ts:314](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/controller.ts#L314)*

 Check if the adapters supports LED

**Returns:** Promise\<boolean>

___

### touchlinkFactoryReset

▸ **touchlinkFactoryReset**(`ieeeAddr`: string, `channel`: number): Promise\<boolean>

*Defined in [src/controller/controller.ts:175](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/controller.ts#L175)*

#### Parameters:

Name | Type |
------ | ------ |
`ieeeAddr` | string |
`channel` | number |

**Returns:** Promise\<boolean>

___

### touchlinkFactoryResetFirst

▸ **touchlinkFactoryResetFirst**(): Promise\<boolean>

*Defined in [src/controller/controller.ts:179](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/controller.ts#L179)*

**Returns:** Promise\<boolean>

___

### touchlinkIdentify

▸ **touchlinkIdentify**(`ieeeAddr`: string, `channel`: number): Promise\<void>

*Defined in [src/controller/controller.ts:167](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/controller.ts#L167)*

#### Parameters:

Name | Type |
------ | ------ |
`ieeeAddr` | string |
`channel` | number |

**Returns:** Promise\<void>

___

### touchlinkScan

▸ **touchlinkScan**(): Promise\<{ channel: number ; ieeeAddr: string  }[]>

*Defined in [src/controller/controller.ts:171](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/controller.ts#L171)*

**Returns:** Promise\<{ channel: number ; ieeeAddr: string  }[]>
