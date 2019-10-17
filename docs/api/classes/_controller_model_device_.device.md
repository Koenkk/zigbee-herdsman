[zigbee-herdsman](../README.md) › ["controller/model/device"](../modules/_controller_model_device_.md) › [Device](_controller_model_device_.device.md)

# Class: Device

## Hierarchy

* Entity

  ↳ **Device**

## Index

### Properties

* [ieeeAddr](_controller_model_device_.device.md#ieeeaddr)

### Accessors

* [applicationVersion](_controller_model_device_.device.md#applicationversion)
* [dateCode](_controller_model_device_.device.md#datecode)
* [endpoints](_controller_model_device_.device.md#endpoints)
* [hardwareVersion](_controller_model_device_.device.md#hardwareversion)
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

## Properties

###  ieeeAddr

• **ieeeAddr**: *string*

*Defined in [controller/model/device.ts:28](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/model/device.ts#L28)*

## Accessors

###  applicationVersion

• **get applicationVersion**(): *number*

*Defined in [controller/model/device.ts:43](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/model/device.ts#L43)*

**Returns:** *number*

• **set applicationVersion**(`applicationVersion`: number): *void*

*Defined in [controller/model/device.ts:44](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/model/device.ts#L44)*

**Parameters:**

Name | Type |
------ | ------ |
`applicationVersion` | number |

**Returns:** *void*

___

###  dateCode

• **get dateCode**(): *string*

*Defined in [controller/model/device.ts:51](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/model/device.ts#L51)*

**Returns:** *string*

• **set dateCode**(`dateCode`: string): *void*

*Defined in [controller/model/device.ts:52](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/model/device.ts#L52)*

**Parameters:**

Name | Type |
------ | ------ |
`dateCode` | string |

**Returns:** *void*

___

###  endpoints

• **get endpoints**(): *[Endpoint](_controller_model_endpoint_.endpoint.md)[]*

*Defined in [controller/model/device.ts:45](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/model/device.ts#L45)*

**Returns:** *[Endpoint](_controller_model_endpoint_.endpoint.md)[]*

___

###  hardwareVersion

• **get hardwareVersion**(): *number*

*Defined in [controller/model/device.ts:54](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/model/device.ts#L54)*

**Returns:** *number*

• **set hardwareVersion**(`hardwareVersion`: number): *void*

*Defined in [controller/model/device.ts:53](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/model/device.ts#L53)*

**Parameters:**

Name | Type |
------ | ------ |
`hardwareVersion` | number |

**Returns:** *void*

___

###  interviewCompleted

• **get interviewCompleted**(): *boolean*

*Defined in [controller/model/device.ts:46](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/model/device.ts#L46)*

**Returns:** *boolean*

___

###  interviewing

• **get interviewing**(): *boolean*

*Defined in [controller/model/device.ts:47](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/model/device.ts#L47)*

**Returns:** *boolean*

___

###  lastSeen

• **get lastSeen**(): *number*

*Defined in [controller/model/device.ts:48](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/model/device.ts#L48)*

**Returns:** *number*

___

###  manufacturerID

• **get manufacturerID**(): *number*

*Defined in [controller/model/device.ts:49](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/model/device.ts#L49)*

**Returns:** *number*

___

###  manufacturerName

• **get manufacturerName**(): *string*

*Defined in [controller/model/device.ts:55](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/model/device.ts#L55)*

**Returns:** *string*

• **set manufacturerName**(`manufacturerName`: string): *void*

*Defined in [controller/model/device.ts:56](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/model/device.ts#L56)*

**Parameters:**

Name | Type |
------ | ------ |
`manufacturerName` | string |

**Returns:** *void*

___

###  modelID

• **get modelID**(): *string*

*Defined in [controller/model/device.ts:58](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/model/device.ts#L58)*

**Returns:** *string*

• **set modelID**(`modelID`: string): *void*

*Defined in [controller/model/device.ts:57](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/model/device.ts#L57)*

**Parameters:**

Name | Type |
------ | ------ |
`modelID` | string |

**Returns:** *void*

___

###  networkAddress

• **get networkAddress**(): *number*

*Defined in [controller/model/device.ts:59](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/model/device.ts#L59)*

**Returns:** *number*

• **set networkAddress**(`networkAddress`: number): *void*

*Defined in [controller/model/device.ts:60](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/model/device.ts#L60)*

**Parameters:**

Name | Type |
------ | ------ |
`networkAddress` | number |

**Returns:** *void*

___

###  powerSource

• **get powerSource**(): *string*

*Defined in [controller/model/device.ts:61](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/model/device.ts#L61)*

**Returns:** *string*

• **set powerSource**(`powerSource`: string): *void*

*Defined in [controller/model/device.ts:62](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/model/device.ts#L62)*

**Parameters:**

Name | Type |
------ | ------ |
`powerSource` | string |

**Returns:** *void*

___

###  softwareBuildID

• **get softwareBuildID**(): *string*

*Defined in [controller/model/device.ts:65](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/model/device.ts#L65)*

**Returns:** *string*

• **set softwareBuildID**(`softwareBuildID`: string): *void*

*Defined in [controller/model/device.ts:66](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/model/device.ts#L66)*

**Parameters:**

Name | Type |
------ | ------ |
`softwareBuildID` | string |

**Returns:** *void*

___

###  stackVersion

• **get stackVersion**(): *number*

*Defined in [controller/model/device.ts:67](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/model/device.ts#L67)*

**Returns:** *number*

• **set stackVersion**(`stackVersion`: number): *void*

*Defined in [controller/model/device.ts:68](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/model/device.ts#L68)*

**Parameters:**

Name | Type |
------ | ------ |
`stackVersion` | number |

**Returns:** *void*

___

###  type

• **get type**(): *[DeviceType](../modules/_adapter_tstype_.md#devicetype)*

*Defined in [controller/model/device.ts:50](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/model/device.ts#L50)*

**Returns:** *[DeviceType](../modules/_adapter_tstype_.md#devicetype)*

___

###  zclVersion

• **get zclVersion**(): *number*

*Defined in [controller/model/device.ts:69](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/model/device.ts#L69)*

**Returns:** *number*

• **set zclVersion**(`zclVersion`: number): *void*

*Defined in [controller/model/device.ts:70](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/model/device.ts#L70)*

**Parameters:**

Name | Type |
------ | ------ |
`zclVersion` | number |

**Returns:** *void*

## Methods

###  createEndpoint

▸ **createEndpoint**(`ID`: number): *Promise‹[Endpoint](_controller_model_endpoint_.endpoint.md)›*

*Defined in [controller/model/device.ts:122](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/model/device.ts#L122)*

**Parameters:**

Name | Type |
------ | ------ |
`ID` | number |

**Returns:** *Promise‹[Endpoint](_controller_model_endpoint_.endpoint.md)›*

___

###  getEndpoint

▸ **getEndpoint**(`ID`: number): *[Endpoint](_controller_model_endpoint_.endpoint.md)*

*Defined in [controller/model/device.ts:133](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/model/device.ts#L133)*

**Parameters:**

Name | Type |
------ | ------ |
`ID` | number |

**Returns:** *[Endpoint](_controller_model_endpoint_.endpoint.md)*

___

###  interview

▸ **interview**(): *Promise‹void›*

*Defined in [controller/model/device.ts:252](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/model/device.ts#L252)*

**Returns:** *Promise‹void›*

___

###  lqi

▸ **lqi**(): *Promise‹[LQI](../interfaces/_controller_model_device_.lqi.md)›*

*Defined in [controller/model/device.ts:384](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/model/device.ts#L384)*

**Returns:** *Promise‹[LQI](../interfaces/_controller_model_device_.lqi.md)›*

___

###  ping

▸ **ping**(): *Promise‹void›*

*Defined in [controller/model/device.ts:392](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/model/device.ts#L392)*

**Returns:** *Promise‹void›*

___

###  removeFromDatabase

▸ **removeFromDatabase**(): *Promise‹void›*

*Defined in [controller/model/device.ts:378](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/model/device.ts#L378)*

**Returns:** *Promise‹void›*

___

###  removeFromNetwork

▸ **removeFromNetwork**(): *Promise‹void›*

*Defined in [controller/model/device.ts:373](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/model/device.ts#L373)*

**Returns:** *Promise‹void›*

___

###  routingTable

▸ **routingTable**(): *Promise‹[RoutingTable](../interfaces/_controller_model_device_.routingtable.md)›*

*Defined in [controller/model/device.ts:388](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/model/device.ts#L388)*

**Returns:** *Promise‹[RoutingTable](../interfaces/_controller_model_device_.routingtable.md)›*

___

###  save

▸ **save**(): *void*

*Defined in [controller/model/device.ts:183](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/model/device.ts#L183)*

**Returns:** *void*

___

###  updateLastSeen

▸ **updateLastSeen**(): *void*

*Defined in [controller/model/device.ts:137](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/model/device.ts#L137)*

**Returns:** *void*

___

### `Static` all

▸ **all**(): *[Device](_controller_model_device_.device.md)[]*

*Defined in [controller/model/device.ts:213](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/model/device.ts#L213)*

**Returns:** *[Device](_controller_model_device_.device.md)[]*

___

### `Static` byIeeeAddr

▸ **byIeeeAddr**(`ieeeAddr`: string): *[Device](_controller_model_device_.device.md)*

*Defined in [controller/model/device.ts:198](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/model/device.ts#L198)*

**Parameters:**

Name | Type |
------ | ------ |
`ieeeAddr` | string |

**Returns:** *[Device](_controller_model_device_.device.md)*

___

### `Static` byNetworkAddress

▸ **byNetworkAddress**(`networkAddress`: number): *[Device](_controller_model_device_.device.md)*

*Defined in [controller/model/device.ts:203](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/model/device.ts#L203)*

**Parameters:**

Name | Type |
------ | ------ |
`networkAddress` | number |

**Returns:** *[Device](_controller_model_device_.device.md)*

___

### `Static` byType

▸ **byType**(`type`: [DeviceType](../modules/_adapter_tstype_.md#devicetype)): *[Device](_controller_model_device_.device.md)[]*

*Defined in [controller/model/device.ts:208](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/model/device.ts#L208)*

**Parameters:**

Name | Type |
------ | ------ |
`type` | [DeviceType](../modules/_adapter_tstype_.md#devicetype) |

**Returns:** *[Device](_controller_model_device_.device.md)[]*

___

### `Static` create

▸ **create**(`type`: AdapterTsType.DeviceType, `ieeeAddr`: string, `networkAddress`: number, `manufacturerID`: number, `manufacturerName`: string, `powerSource`: string, `modelID`: string, `endpoints`: object[]): *[Device](_controller_model_device_.device.md)*

*Defined in [controller/model/device.ts:218](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/model/device.ts#L218)*

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

*Inherited from void*

*Defined in [controller/model/entity.ts:12](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/model/entity.ts#L12)*

**Parameters:**

Name | Type |
------ | ------ |
`adapter` | Adapter |

**Returns:** *void*

___

### `Static` injectDatabase

▸ **injectDatabase**(`database`: Database): *void*

*Inherited from void*

*Defined in [controller/model/entity.ts:8](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/model/entity.ts#L8)*

**Parameters:**

Name | Type |
------ | ------ |
`database` | Database |

**Returns:** *void*

## Object literals

### `Static` ReportablePropertiesMapping

### ▪ **ReportablePropertiesMapping**: *object*

*Defined in [controller/model/device.ts:78](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/model/device.ts#L78)*

▪ **appVersion**: *object*

*Defined in [controller/model/device.ts:87](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/model/device.ts#L87)*

* **key**: *"applicationVersion"* = "applicationVersion"

* **set**(`v`: number, `d`: [Device](_controller_model_device_.device.md)): *void*

▪ **dateCode**: *object*

*Defined in [controller/model/device.ts:90](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/model/device.ts#L90)*

* **key**: *"dateCode"* = "dateCode"

* **set**(`v`: string, `d`: [Device](_controller_model_device_.device.md)): *void*

▪ **hwVersion**: *object*

*Defined in [controller/model/device.ts:89](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/model/device.ts#L89)*

* **key**: *"hardwareVersion"* = "hardwareVersion"

* **set**(`v`: number, `d`: [Device](_controller_model_device_.device.md)): *void*

▪ **manufacturerName**: *object*

*Defined in [controller/model/device.ts:84](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/model/device.ts#L84)*

* **key**: *"manufacturerName"* = "manufacturerName"

* **set**(`v`: string, `d`: [Device](_controller_model_device_.device.md)): *void*

▪ **modelId**: *object*

*Defined in [controller/model/device.ts:83](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/model/device.ts#L83)*

* **key**: *"modelID"* = "modelID"

* **set**(`v`: string, `d`: [Device](_controller_model_device_.device.md)): *void*

▪ **powerSource**: *object*

*Defined in [controller/model/device.ts:85](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/model/device.ts#L85)*

* **key**: *"powerSource"* = "powerSource"

* **set**(`v`: string, `d`: [Device](_controller_model_device_.device.md)): *void*

▪ **stackVersion**: *object*

*Defined in [controller/model/device.ts:88](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/model/device.ts#L88)*

* **key**: *"stackVersion"* = "stackVersion"

* **set**(`v`: number, `d`: [Device](_controller_model_device_.device.md)): *void*

▪ **swBuildId**: *object*

*Defined in [controller/model/device.ts:91](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/model/device.ts#L91)*

* **key**: *"softwareBuildID"* = "softwareBuildID"

* **set**(`v`: string, `d`: [Device](_controller_model_device_.device.md)): *void*

▪ **zclVersion**: *object*

*Defined in [controller/model/device.ts:86](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/model/device.ts#L86)*

* **key**: *"zclVersion"* = "zclVersion"

* **set**(`v`: number, `d`: [Device](_controller_model_device_.device.md)): *void*
