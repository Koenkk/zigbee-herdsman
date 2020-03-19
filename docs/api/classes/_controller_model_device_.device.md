[zigbee-herdsman](../README.md) › ["controller/model/device"](../modules/_controller_model_device_.md) › [Device](_controller_model_device_.device.md)

# Class: Device

## Hierarchy

* Entity

  ↳ **Device**

## Index

### Accessors

* [applicationVersion](_controller_model_device_.device.md#applicationversion)
* [dateCode](_controller_model_device_.device.md#datecode)
* [endpoints](_controller_model_device_.device.md#endpoints)
* [hardwareVersion](_controller_model_device_.device.md#hardwareversion)
* [ieeeAddr](_controller_model_device_.device.md#ieeeaddr)
* [interviewCompleted](_controller_model_device_.device.md#interviewcompleted)
* [interviewing](_controller_model_device_.device.md#interviewing)
* [lastSeen](_controller_model_device_.device.md#lastseen)
* [manufacturerID](_controller_model_device_.device.md#manufacturerid)
* [manufacturerName](_controller_model_device_.device.md#manufacturername)
* [modelID](_controller_model_device_.device.md#modelid)
* [networkAddress](_controller_model_device_.device.md#networkaddress)
* [powerSource](_controller_model_device_.device.md#powersource)
* [softwareBuildID](_controller_model_device_.device.md#softwarebuildid)
* [stackVersion](_controller_model_device_.device.md#stackversion)
* [type](_controller_model_device_.device.md#type)
* [zclVersion](_controller_model_device_.device.md#zclversion)

### Methods

* [createEndpoint](_controller_model_device_.device.md#createendpoint)
* [getEndpoint](_controller_model_device_.device.md#getendpoint)
* [getEndpointByDeviceType](_controller_model_device_.device.md#getendpointbydevicetype)
* [interview](_controller_model_device_.device.md#interview)
* [lqi](_controller_model_device_.device.md#lqi)
* [ping](_controller_model_device_.device.md#ping)
* [removeFromDatabase](_controller_model_device_.device.md#removefromdatabase)
* [removeFromNetwork](_controller_model_device_.device.md#removefromnetwork)
* [routingTable](_controller_model_device_.device.md#routingtable)
* [save](_controller_model_device_.device.md#save)
* [updateLastSeen](_controller_model_device_.device.md#updatelastseen)
* [all](_controller_model_device_.device.md#static-all)
* [byIeeeAddr](_controller_model_device_.device.md#static-byieeeaddr)
* [byNetworkAddress](_controller_model_device_.device.md#static-bynetworkaddress)
* [byType](_controller_model_device_.device.md#static-bytype)
* [create](_controller_model_device_.device.md#static-create)
* [injectAdapter](_controller_model_device_.device.md#static-injectadapter)
* [injectDatabase](_controller_model_device_.device.md#static-injectdatabase)

### Object literals

* [ReportablePropertiesMapping](_controller_model_device_.device.md#static-reportablepropertiesmapping)

## Accessors

###  applicationVersion

• **get applicationVersion**(): *number*

*Defined in [src/controller/model/device.ts:45](https://github.com/Koenkk/zigbee-herdsman/blob/3a6811a/src/controller/model/device.ts#L45)*

**Returns:** *number*

• **set applicationVersion**(`applicationVersion`: number): *void*

*Defined in [src/controller/model/device.ts:46](https://github.com/Koenkk/zigbee-herdsman/blob/3a6811a/src/controller/model/device.ts#L46)*

**Parameters:**

Name | Type |
------ | ------ |
`applicationVersion` | number |

**Returns:** *void*

___

###  dateCode

• **get dateCode**(): *string*

*Defined in [src/controller/model/device.ts:53](https://github.com/Koenkk/zigbee-herdsman/blob/3a6811a/src/controller/model/device.ts#L53)*

**Returns:** *string*

• **set dateCode**(`dateCode`: string): *void*

*Defined in [src/controller/model/device.ts:54](https://github.com/Koenkk/zigbee-herdsman/blob/3a6811a/src/controller/model/device.ts#L54)*

**Parameters:**

Name | Type |
------ | ------ |
`dateCode` | string |

**Returns:** *void*

___

###  endpoints

• **get endpoints**(): *[Endpoint](_controller_model_endpoint_.endpoint.md)[]*

*Defined in [src/controller/model/device.ts:47](https://github.com/Koenkk/zigbee-herdsman/blob/3a6811a/src/controller/model/device.ts#L47)*

**Returns:** *[Endpoint](_controller_model_endpoint_.endpoint.md)[]*

___

###  hardwareVersion

• **get hardwareVersion**(): *number*

*Defined in [src/controller/model/device.ts:56](https://github.com/Koenkk/zigbee-herdsman/blob/3a6811a/src/controller/model/device.ts#L56)*

**Returns:** *number*

• **set hardwareVersion**(`hardwareVersion`: number): *void*

*Defined in [src/controller/model/device.ts:55](https://github.com/Koenkk/zigbee-herdsman/blob/3a6811a/src/controller/model/device.ts#L55)*

**Parameters:**

Name | Type |
------ | ------ |
`hardwareVersion` | number |

**Returns:** *void*

___

###  ieeeAddr

• **get ieeeAddr**(): *string*

*Defined in [src/controller/model/device.ts:43](https://github.com/Koenkk/zigbee-herdsman/blob/3a6811a/src/controller/model/device.ts#L43)*

**Returns:** *string*

• **set ieeeAddr**(`ieeeAddr`: string): *void*

*Defined in [src/controller/model/device.ts:44](https://github.com/Koenkk/zigbee-herdsman/blob/3a6811a/src/controller/model/device.ts#L44)*

**Parameters:**

Name | Type |
------ | ------ |
`ieeeAddr` | string |

**Returns:** *void*

___

###  interviewCompleted

• **get interviewCompleted**(): *boolean*

*Defined in [src/controller/model/device.ts:48](https://github.com/Koenkk/zigbee-herdsman/blob/3a6811a/src/controller/model/device.ts#L48)*

**Returns:** *boolean*

___

###  interviewing

• **get interviewing**(): *boolean*

*Defined in [src/controller/model/device.ts:49](https://github.com/Koenkk/zigbee-herdsman/blob/3a6811a/src/controller/model/device.ts#L49)*

**Returns:** *boolean*

___

###  lastSeen

• **get lastSeen**(): *number*

*Defined in [src/controller/model/device.ts:50](https://github.com/Koenkk/zigbee-herdsman/blob/3a6811a/src/controller/model/device.ts#L50)*

**Returns:** *number*

___

###  manufacturerID

• **get manufacturerID**(): *number*

*Defined in [src/controller/model/device.ts:51](https://github.com/Koenkk/zigbee-herdsman/blob/3a6811a/src/controller/model/device.ts#L51)*

**Returns:** *number*

___

###  manufacturerName

• **get manufacturerName**(): *string*

*Defined in [src/controller/model/device.ts:57](https://github.com/Koenkk/zigbee-herdsman/blob/3a6811a/src/controller/model/device.ts#L57)*

**Returns:** *string*

• **set manufacturerName**(`manufacturerName`: string): *void*

*Defined in [src/controller/model/device.ts:58](https://github.com/Koenkk/zigbee-herdsman/blob/3a6811a/src/controller/model/device.ts#L58)*

**Parameters:**

Name | Type |
------ | ------ |
`manufacturerName` | string |

**Returns:** *void*

___

###  modelID

• **get modelID**(): *string*

*Defined in [src/controller/model/device.ts:60](https://github.com/Koenkk/zigbee-herdsman/blob/3a6811a/src/controller/model/device.ts#L60)*

**Returns:** *string*

• **set modelID**(`modelID`: string): *void*

*Defined in [src/controller/model/device.ts:59](https://github.com/Koenkk/zigbee-herdsman/blob/3a6811a/src/controller/model/device.ts#L59)*

**Parameters:**

Name | Type |
------ | ------ |
`modelID` | string |

**Returns:** *void*

___

###  networkAddress

• **get networkAddress**(): *number*

*Defined in [src/controller/model/device.ts:61](https://github.com/Koenkk/zigbee-herdsman/blob/3a6811a/src/controller/model/device.ts#L61)*

**Returns:** *number*

• **set networkAddress**(`networkAddress`: number): *void*

*Defined in [src/controller/model/device.ts:62](https://github.com/Koenkk/zigbee-herdsman/blob/3a6811a/src/controller/model/device.ts#L62)*

**Parameters:**

Name | Type |
------ | ------ |
`networkAddress` | number |

**Returns:** *void*

___

###  powerSource

• **get powerSource**(): *string*

*Defined in [src/controller/model/device.ts:68](https://github.com/Koenkk/zigbee-herdsman/blob/3a6811a/src/controller/model/device.ts#L68)*

**Returns:** *string*

• **set powerSource**(`powerSource`: string): *void*

*Defined in [src/controller/model/device.ts:69](https://github.com/Koenkk/zigbee-herdsman/blob/3a6811a/src/controller/model/device.ts#L69)*

**Parameters:**

Name | Type |
------ | ------ |
`powerSource` | string |

**Returns:** *void*

___

###  softwareBuildID

• **get softwareBuildID**(): *string*

*Defined in [src/controller/model/device.ts:72](https://github.com/Koenkk/zigbee-herdsman/blob/3a6811a/src/controller/model/device.ts#L72)*

**Returns:** *string*

• **set softwareBuildID**(`softwareBuildID`: string): *void*

*Defined in [src/controller/model/device.ts:73](https://github.com/Koenkk/zigbee-herdsman/blob/3a6811a/src/controller/model/device.ts#L73)*

**Parameters:**

Name | Type |
------ | ------ |
`softwareBuildID` | string |

**Returns:** *void*

___

###  stackVersion

• **get stackVersion**(): *number*

*Defined in [src/controller/model/device.ts:74](https://github.com/Koenkk/zigbee-herdsman/blob/3a6811a/src/controller/model/device.ts#L74)*

**Returns:** *number*

• **set stackVersion**(`stackVersion`: number): *void*

*Defined in [src/controller/model/device.ts:75](https://github.com/Koenkk/zigbee-herdsman/blob/3a6811a/src/controller/model/device.ts#L75)*

**Parameters:**

Name | Type |
------ | ------ |
`stackVersion` | number |

**Returns:** *void*

___

###  type

• **get type**(): *[DeviceType](../modules/_adapter_tstype_.md#devicetype)*

*Defined in [src/controller/model/device.ts:52](https://github.com/Koenkk/zigbee-herdsman/blob/3a6811a/src/controller/model/device.ts#L52)*

**Returns:** *[DeviceType](../modules/_adapter_tstype_.md#devicetype)*

___

###  zclVersion

• **get zclVersion**(): *number*

*Defined in [src/controller/model/device.ts:76](https://github.com/Koenkk/zigbee-herdsman/blob/3a6811a/src/controller/model/device.ts#L76)*

**Returns:** *number*

• **set zclVersion**(`zclVersion`: number): *void*

*Defined in [src/controller/model/device.ts:77](https://github.com/Koenkk/zigbee-herdsman/blob/3a6811a/src/controller/model/device.ts#L77)*

**Parameters:**

Name | Type |
------ | ------ |
`zclVersion` | number |

**Returns:** *void*

## Methods

###  createEndpoint

▸ **createEndpoint**(`ID`: number): *Promise‹[Endpoint](_controller_model_endpoint_.endpoint.md)›*

*Defined in [src/controller/model/device.ts:130](https://github.com/Koenkk/zigbee-herdsman/blob/3a6811a/src/controller/model/device.ts#L130)*

**Parameters:**

Name | Type |
------ | ------ |
`ID` | number |

**Returns:** *Promise‹[Endpoint](_controller_model_endpoint_.endpoint.md)›*

___

###  getEndpoint

▸ **getEndpoint**(`ID`: number): *[Endpoint](_controller_model_endpoint_.endpoint.md)*

*Defined in [src/controller/model/device.ts:141](https://github.com/Koenkk/zigbee-herdsman/blob/3a6811a/src/controller/model/device.ts#L141)*

**Parameters:**

Name | Type |
------ | ------ |
`ID` | number |

**Returns:** *[Endpoint](_controller_model_endpoint_.endpoint.md)*

___

###  getEndpointByDeviceType

▸ **getEndpointByDeviceType**(`deviceType`: string): *[Endpoint](_controller_model_endpoint_.endpoint.md)*

*Defined in [src/controller/model/device.ts:146](https://github.com/Koenkk/zigbee-herdsman/blob/3a6811a/src/controller/model/device.ts#L146)*

**Parameters:**

Name | Type |
------ | ------ |
`deviceType` | string |

**Returns:** *[Endpoint](_controller_model_endpoint_.endpoint.md)*

___

###  interview

▸ **interview**(): *Promise‹void›*

*Defined in [src/controller/model/device.ts:267](https://github.com/Koenkk/zigbee-herdsman/blob/3a6811a/src/controller/model/device.ts#L267)*

**Returns:** *Promise‹void›*

___

###  lqi

▸ **lqi**(): *Promise‹[LQI](../interfaces/_adapter_tstype_.lqi.md)›*

*Defined in [src/controller/model/device.ts:465](https://github.com/Koenkk/zigbee-herdsman/blob/3a6811a/src/controller/model/device.ts#L465)*

**Returns:** *Promise‹[LQI](../interfaces/_adapter_tstype_.lqi.md)›*

___

###  ping

▸ **ping**(): *Promise‹void›*

*Defined in [src/controller/model/device.ts:473](https://github.com/Koenkk/zigbee-herdsman/blob/3a6811a/src/controller/model/device.ts#L473)*

**Returns:** *Promise‹void›*

___

###  removeFromDatabase

▸ **removeFromDatabase**(): *Promise‹void›*

*Defined in [src/controller/model/device.ts:455](https://github.com/Koenkk/zigbee-herdsman/blob/3a6811a/src/controller/model/device.ts#L455)*

**Returns:** *Promise‹void›*

___

###  removeFromNetwork

▸ **removeFromNetwork**(): *Promise‹void›*

*Defined in [src/controller/model/device.ts:450](https://github.com/Koenkk/zigbee-herdsman/blob/3a6811a/src/controller/model/device.ts#L450)*

**Returns:** *Promise‹void›*

___

###  routingTable

▸ **routingTable**(): *Promise‹[RoutingTable](../interfaces/_adapter_tstype_.routingtable.md)›*

*Defined in [src/controller/model/device.ts:469](https://github.com/Koenkk/zigbee-herdsman/blob/3a6811a/src/controller/model/device.ts#L469)*

**Returns:** *Promise‹[RoutingTable](../interfaces/_adapter_tstype_.routingtable.md)›*

___

###  save

▸ **save**(): *void*

*Defined in [src/controller/model/device.ts:197](https://github.com/Koenkk/zigbee-herdsman/blob/3a6811a/src/controller/model/device.ts#L197)*

**Returns:** *void*

___

###  updateLastSeen

▸ **updateLastSeen**(): *void*

*Defined in [src/controller/model/device.ts:151](https://github.com/Koenkk/zigbee-herdsman/blob/3a6811a/src/controller/model/device.ts#L151)*

**Returns:** *void*

___

### `Static` all

▸ **all**(): *[Device](_controller_model_device_.device.md)[]*

*Defined in [src/controller/model/device.ts:227](https://github.com/Koenkk/zigbee-herdsman/blob/3a6811a/src/controller/model/device.ts#L227)*

**Returns:** *[Device](_controller_model_device_.device.md)[]*

___

### `Static` byIeeeAddr

▸ **byIeeeAddr**(`ieeeAddr`: string): *[Device](_controller_model_device_.device.md)*

*Defined in [src/controller/model/device.ts:212](https://github.com/Koenkk/zigbee-herdsman/blob/3a6811a/src/controller/model/device.ts#L212)*

**Parameters:**

Name | Type |
------ | ------ |
`ieeeAddr` | string |

**Returns:** *[Device](_controller_model_device_.device.md)*

___

### `Static` byNetworkAddress

▸ **byNetworkAddress**(`networkAddress`: number): *[Device](_controller_model_device_.device.md)*

*Defined in [src/controller/model/device.ts:217](https://github.com/Koenkk/zigbee-herdsman/blob/3a6811a/src/controller/model/device.ts#L217)*

**Parameters:**

Name | Type |
------ | ------ |
`networkAddress` | number |

**Returns:** *[Device](_controller_model_device_.device.md)*

___

### `Static` byType

▸ **byType**(`type`: [DeviceType](../modules/_adapter_tstype_.md#devicetype)): *[Device](_controller_model_device_.device.md)[]*

*Defined in [src/controller/model/device.ts:222](https://github.com/Koenkk/zigbee-herdsman/blob/3a6811a/src/controller/model/device.ts#L222)*

**Parameters:**

Name | Type |
------ | ------ |
`type` | [DeviceType](../modules/_adapter_tstype_.md#devicetype) |

**Returns:** *[Device](_controller_model_device_.device.md)[]*

___

### `Static` create

▸ **create**(`type`: AdapterTsType.DeviceType, `ieeeAddr`: string, `networkAddress`: number, `manufacturerID`: number, `manufacturerName`: string, `powerSource`: string, `modelID`: string, `endpoints`: object[]): *[Device](_controller_model_device_.device.md)*

*Defined in [src/controller/model/device.ts:232](https://github.com/Koenkk/zigbee-herdsman/blob/3a6811a/src/controller/model/device.ts#L232)*

**Parameters:**

Name | Type |
------ | ------ |
`type` | AdapterTsType.DeviceType |
`ieeeAddr` | string |
`networkAddress` | number |
`manufacturerID` | number |
`manufacturerName` | string |
`powerSource` | string |
`modelID` | string |
`endpoints` | object[] |

**Returns:** *[Device](_controller_model_device_.device.md)*

___

### `Static` injectAdapter

▸ **injectAdapter**(`adapter`: Adapter): *void*

*Inherited from [Group](_controller_model_group_.group.md).[injectAdapter](_controller_model_group_.group.md#static-injectadapter)*

*Defined in [src/controller/model/entity.ts:12](https://github.com/Koenkk/zigbee-herdsman/blob/3a6811a/src/controller/model/entity.ts#L12)*

**Parameters:**

Name | Type |
------ | ------ |
`adapter` | Adapter |

**Returns:** *void*

___

### `Static` injectDatabase

▸ **injectDatabase**(`database`: Database): *void*

*Inherited from [Group](_controller_model_group_.group.md).[injectDatabase](_controller_model_group_.group.md#static-injectdatabase)*

*Defined in [src/controller/model/entity.ts:8](https://github.com/Koenkk/zigbee-herdsman/blob/3a6811a/src/controller/model/entity.ts#L8)*

**Parameters:**

Name | Type |
------ | ------ |
`database` | Database |

**Returns:** *void*

## Object literals

### `Static` ReportablePropertiesMapping

### ▪ **ReportablePropertiesMapping**: *object*

*Defined in [src/controller/model/device.ts:85](https://github.com/Koenkk/zigbee-herdsman/blob/3a6811a/src/controller/model/device.ts#L85)*

▪ **appVersion**: *object*

*Defined in [src/controller/model/device.ts:94](https://github.com/Koenkk/zigbee-herdsman/blob/3a6811a/src/controller/model/device.ts#L94)*

* **key**: *"applicationVersion"* = "applicationVersion"

* **set**(`v`: number, `d`: [Device](_controller_model_device_.device.md)): *void*

▪ **dateCode**: *object*

*Defined in [src/controller/model/device.ts:97](https://github.com/Koenkk/zigbee-herdsman/blob/3a6811a/src/controller/model/device.ts#L97)*

* **key**: *"dateCode"* = "dateCode"

* **set**(`v`: string, `d`: [Device](_controller_model_device_.device.md)): *void*

▪ **hwVersion**: *object*

*Defined in [src/controller/model/device.ts:96](https://github.com/Koenkk/zigbee-herdsman/blob/3a6811a/src/controller/model/device.ts#L96)*

* **key**: *"hardwareVersion"* = "hardwareVersion"

* **set**(`v`: number, `d`: [Device](_controller_model_device_.device.md)): *void*

▪ **manufacturerName**: *object*

*Defined in [src/controller/model/device.ts:91](https://github.com/Koenkk/zigbee-herdsman/blob/3a6811a/src/controller/model/device.ts#L91)*

* **key**: *"manufacturerName"* = "manufacturerName"

* **set**(`v`: string, `d`: [Device](_controller_model_device_.device.md)): *void*

▪ **modelId**: *object*

*Defined in [src/controller/model/device.ts:90](https://github.com/Koenkk/zigbee-herdsman/blob/3a6811a/src/controller/model/device.ts#L90)*

* **key**: *"modelID"* = "modelID"

* **set**(`v`: string, `d`: [Device](_controller_model_device_.device.md)): *void*

▪ **powerSource**: *object*

*Defined in [src/controller/model/device.ts:92](https://github.com/Koenkk/zigbee-herdsman/blob/3a6811a/src/controller/model/device.ts#L92)*

* **key**: *"powerSource"* = "powerSource"

* **set**(`v`: string, `d`: [Device](_controller_model_device_.device.md)): *void*

▪ **stackVersion**: *object*

*Defined in [src/controller/model/device.ts:95](https://github.com/Koenkk/zigbee-herdsman/blob/3a6811a/src/controller/model/device.ts#L95)*

* **key**: *"stackVersion"* = "stackVersion"

* **set**(`v`: number, `d`: [Device](_controller_model_device_.device.md)): *void*

▪ **swBuildId**: *object*

*Defined in [src/controller/model/device.ts:98](https://github.com/Koenkk/zigbee-herdsman/blob/3a6811a/src/controller/model/device.ts#L98)*

* **key**: *"softwareBuildID"* = "softwareBuildID"

* **set**(`v`: string, `d`: [Device](_controller_model_device_.device.md)): *void*

▪ **zclVersion**: *object*

*Defined in [src/controller/model/device.ts:93](https://github.com/Koenkk/zigbee-herdsman/blob/3a6811a/src/controller/model/device.ts#L93)*

* **key**: *"zclVersion"* = "zclVersion"

* **set**(`v`: number, `d`: [Device](_controller_model_device_.device.md)): *void*
