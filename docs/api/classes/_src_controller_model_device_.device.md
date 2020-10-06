**[zigbee-herdsman](../README.md)**

> [Globals](../README.md) / ["src/controller/model/device"](../modules/_src_controller_model_device_.md) / Device

# Class: Device

## Hierarchy

* Entity

  ↳ **Device**

## Index

### Accessors

* [applicationVersion](_src_controller_model_device_.device.md#applicationversion)
* [dateCode](_src_controller_model_device_.device.md#datecode)
* [endpoints](_src_controller_model_device_.device.md#endpoints)
* [hardwareVersion](_src_controller_model_device_.device.md#hardwareversion)
* [ieeeAddr](_src_controller_model_device_.device.md#ieeeaddr)
* [interviewCompleted](_src_controller_model_device_.device.md#interviewcompleted)
* [interviewing](_src_controller_model_device_.device.md#interviewing)
* [lastSeen](_src_controller_model_device_.device.md#lastseen)
* [manufacturerID](_src_controller_model_device_.device.md#manufacturerid)
* [manufacturerName](_src_controller_model_device_.device.md#manufacturername)
* [modelID](_src_controller_model_device_.device.md#modelid)
* [networkAddress](_src_controller_model_device_.device.md#networkaddress)
* [powerSource](_src_controller_model_device_.device.md#powersource)
* [softwareBuildID](_src_controller_model_device_.device.md#softwarebuildid)
* [stackVersion](_src_controller_model_device_.device.md#stackversion)
* [type](_src_controller_model_device_.device.md#type)
* [zclVersion](_src_controller_model_device_.device.md#zclversion)

### Methods

* [createEndpoint](_src_controller_model_device_.device.md#createendpoint)
* [getEndpoint](_src_controller_model_device_.device.md#getendpoint)
* [getEndpointByDeviceType](_src_controller_model_device_.device.md#getendpointbydevicetype)
* [interview](_src_controller_model_device_.device.md#interview)
* [lqi](_src_controller_model_device_.device.md#lqi)
* [onZclData](_src_controller_model_device_.device.md#onzcldata)
* [ping](_src_controller_model_device_.device.md#ping)
* [removeFromDatabase](_src_controller_model_device_.device.md#removefromdatabase)
* [removeFromNetwork](_src_controller_model_device_.device.md#removefromnetwork)
* [routingTable](_src_controller_model_device_.device.md#routingtable)
* [save](_src_controller_model_device_.device.md#save)
* [updateLastSeen](_src_controller_model_device_.device.md#updatelastseen)
* [all](_src_controller_model_device_.device.md#all)
* [byIeeeAddr](_src_controller_model_device_.device.md#byieeeaddr)
* [byNetworkAddress](_src_controller_model_device_.device.md#bynetworkaddress)
* [byType](_src_controller_model_device_.device.md#bytype)
* [create](_src_controller_model_device_.device.md#create)
* [injectAdapter](_src_controller_model_device_.device.md#injectadapter)
* [injectDatabase](_src_controller_model_device_.device.md#injectdatabase)

### Object literals

* [ReportablePropertiesMapping](_src_controller_model_device_.device.md#reportablepropertiesmapping)

## Accessors

### applicationVersion

• get **applicationVersion**(): number

*Defined in [src/controller/model/device.ts:53](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/model/device.ts#L53)*

**Returns:** number

• set **applicationVersion**(`applicationVersion`: number): void

*Defined in [src/controller/model/device.ts:54](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/model/device.ts#L54)*

#### Parameters:

Name | Type |
------ | ------ |
`applicationVersion` | number |

**Returns:** void

___

### dateCode

• get **dateCode**(): string

*Defined in [src/controller/model/device.ts:62](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/model/device.ts#L62)*

**Returns:** string

• set **dateCode**(`dateCode`: string): void

*Defined in [src/controller/model/device.ts:63](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/model/device.ts#L63)*

#### Parameters:

Name | Type |
------ | ------ |
`dateCode` | string |

**Returns:** void

___

### endpoints

• get **endpoints**(): [Endpoint](_src_controller_model_endpoint_.endpoint.md)[]

*Defined in [src/controller/model/device.ts:55](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/model/device.ts#L55)*

**Returns:** [Endpoint](_src_controller_model_endpoint_.endpoint.md)[]

___

### hardwareVersion

• get **hardwareVersion**(): number

*Defined in [src/controller/model/device.ts:65](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/model/device.ts#L65)*

**Returns:** number

• set **hardwareVersion**(`hardwareVersion`: number): void

*Defined in [src/controller/model/device.ts:64](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/model/device.ts#L64)*

#### Parameters:

Name | Type |
------ | ------ |
`hardwareVersion` | number |

**Returns:** void

___

### ieeeAddr

• get **ieeeAddr**(): string

*Defined in [src/controller/model/device.ts:51](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/model/device.ts#L51)*

**Returns:** string

• set **ieeeAddr**(`ieeeAddr`: string): void

*Defined in [src/controller/model/device.ts:52](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/model/device.ts#L52)*

#### Parameters:

Name | Type |
------ | ------ |
`ieeeAddr` | string |

**Returns:** void

___

### interviewCompleted

• get **interviewCompleted**(): boolean

*Defined in [src/controller/model/device.ts:56](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/model/device.ts#L56)*

**Returns:** boolean

___

### interviewing

• get **interviewing**(): boolean

*Defined in [src/controller/model/device.ts:57](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/model/device.ts#L57)*

**Returns:** boolean

___

### lastSeen

• get **lastSeen**(): number

*Defined in [src/controller/model/device.ts:58](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/model/device.ts#L58)*

**Returns:** number

___

### manufacturerID

• get **manufacturerID**(): number

*Defined in [src/controller/model/device.ts:59](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/model/device.ts#L59)*

**Returns:** number

___

### manufacturerName

• get **manufacturerName**(): string

*Defined in [src/controller/model/device.ts:66](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/model/device.ts#L66)*

**Returns:** string

• set **manufacturerName**(`manufacturerName`: string): void

*Defined in [src/controller/model/device.ts:67](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/model/device.ts#L67)*

#### Parameters:

Name | Type |
------ | ------ |
`manufacturerName` | string |

**Returns:** void

___

### modelID

• get **modelID**(): string

*Defined in [src/controller/model/device.ts:69](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/model/device.ts#L69)*

**Returns:** string

• set **modelID**(`modelID`: string): void

*Defined in [src/controller/model/device.ts:68](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/model/device.ts#L68)*

#### Parameters:

Name | Type |
------ | ------ |
`modelID` | string |

**Returns:** void

___

### networkAddress

• get **networkAddress**(): number

*Defined in [src/controller/model/device.ts:70](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/model/device.ts#L70)*

**Returns:** number

• set **networkAddress**(`networkAddress`: number): void

*Defined in [src/controller/model/device.ts:71](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/model/device.ts#L71)*

#### Parameters:

Name | Type |
------ | ------ |
`networkAddress` | number |

**Returns:** void

___

### powerSource

• get **powerSource**(): string

*Defined in [src/controller/model/device.ts:77](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/model/device.ts#L77)*

**Returns:** string

• set **powerSource**(`powerSource`: string): void

*Defined in [src/controller/model/device.ts:78](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/model/device.ts#L78)*

#### Parameters:

Name | Type |
------ | ------ |
`powerSource` | string |

**Returns:** void

___

### softwareBuildID

• get **softwareBuildID**(): string

*Defined in [src/controller/model/device.ts:81](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/model/device.ts#L81)*

**Returns:** string

• set **softwareBuildID**(`softwareBuildID`: string): void

*Defined in [src/controller/model/device.ts:82](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/model/device.ts#L82)*

#### Parameters:

Name | Type |
------ | ------ |
`softwareBuildID` | string |

**Returns:** void

___

### stackVersion

• get **stackVersion**(): number

*Defined in [src/controller/model/device.ts:83](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/model/device.ts#L83)*

**Returns:** number

• set **stackVersion**(`stackVersion`: number): void

*Defined in [src/controller/model/device.ts:84](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/model/device.ts#L84)*

#### Parameters:

Name | Type |
------ | ------ |
`stackVersion` | number |

**Returns:** void

___

### type

• get **type**(): [DeviceType](../modules/_src_adapter_tstype_.md#devicetype)

*Defined in [src/controller/model/device.ts:61](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/model/device.ts#L61)*

**Returns:** [DeviceType](../modules/_src_adapter_tstype_.md#devicetype)

• set **type**(`type`: [DeviceType](../modules/_src_adapter_tstype_.md#devicetype)): void

*Defined in [src/controller/model/device.ts:60](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/model/device.ts#L60)*

#### Parameters:

Name | Type |
------ | ------ |
`type` | [DeviceType](../modules/_src_adapter_tstype_.md#devicetype) |

**Returns:** void

___

### zclVersion

• get **zclVersion**(): number

*Defined in [src/controller/model/device.ts:85](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/model/device.ts#L85)*

**Returns:** number

• set **zclVersion**(`zclVersion`: number): void

*Defined in [src/controller/model/device.ts:86](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/model/device.ts#L86)*

#### Parameters:

Name | Type |
------ | ------ |
`zclVersion` | number |

**Returns:** void

## Methods

### createEndpoint

▸ **createEndpoint**(`ID`: number): Promise\<[Endpoint](_src_controller_model_endpoint_.endpoint.md)>

*Defined in [src/controller/model/device.ts:139](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/model/device.ts#L139)*

#### Parameters:

Name | Type |
------ | ------ |
`ID` | number |

**Returns:** Promise\<[Endpoint](_src_controller_model_endpoint_.endpoint.md)>

___

### getEndpoint

▸ **getEndpoint**(`ID`: number): [Endpoint](_src_controller_model_endpoint_.endpoint.md)

*Defined in [src/controller/model/device.ts:150](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/model/device.ts#L150)*

#### Parameters:

Name | Type |
------ | ------ |
`ID` | number |

**Returns:** [Endpoint](_src_controller_model_endpoint_.endpoint.md)

___

### getEndpointByDeviceType

▸ **getEndpointByDeviceType**(`deviceType`: string): [Endpoint](_src_controller_model_endpoint_.endpoint.md)

*Defined in [src/controller/model/device.ts:155](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/model/device.ts#L155)*

#### Parameters:

Name | Type |
------ | ------ |
`deviceType` | string |

**Returns:** [Endpoint](_src_controller_model_endpoint_.endpoint.md)

___

### interview

▸ **interview**(): Promise\<void>

*Defined in [src/controller/model/device.ts:328](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/model/device.ts#L328)*

**Returns:** Promise\<void>

___

### lqi

▸ **lqi**(): Promise\<[LQI](../interfaces/_src_adapter_tstype_.lqi.md)>

*Defined in [src/controller/model/device.ts:542](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/model/device.ts#L542)*

**Returns:** Promise\<[LQI](../interfaces/_src_adapter_tstype_.lqi.md)>

___

### onZclData

▸ **onZclData**(`dataPayload`: ZclDataPayload, `endpoint`: [Endpoint](_src_controller_model_endpoint_.endpoint.md)): Promise\<void>

*Defined in [src/controller/model/device.ts:164](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/model/device.ts#L164)*

#### Parameters:

Name | Type |
------ | ------ |
`dataPayload` | ZclDataPayload |
`endpoint` | [Endpoint](_src_controller_model_endpoint_.endpoint.md) |

**Returns:** Promise\<void>

___

### ping

▸ **ping**(): Promise\<void>

*Defined in [src/controller/model/device.ts:550](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/model/device.ts#L550)*

**Returns:** Promise\<void>

___

### removeFromDatabase

▸ **removeFromDatabase**(): Promise\<void>

*Defined in [src/controller/model/device.ts:528](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/model/device.ts#L528)*

**Returns:** Promise\<void>

___

### removeFromNetwork

▸ **removeFromNetwork**(): Promise\<void>

*Defined in [src/controller/model/device.ts:523](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/model/device.ts#L523)*

**Returns:** Promise\<void>

___

### routingTable

▸ **routingTable**(): Promise\<[RoutingTable](../interfaces/_src_adapter_tstype_.routingtable.md)>

*Defined in [src/controller/model/device.ts:546](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/model/device.ts#L546)*

**Returns:** Promise\<[RoutingTable](../interfaces/_src_adapter_tstype_.routingtable.md)>

___

### save

▸ **save**(): void

*Defined in [src/controller/model/device.ts:258](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/model/device.ts#L258)*

**Returns:** void

___

### updateLastSeen

▸ **updateLastSeen**(): void

*Defined in [src/controller/model/device.ts:160](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/model/device.ts#L160)*

**Returns:** void

___

### all

▸ `Static`**all**(): [Device](_src_controller_model_device_.device.md)[]

*Defined in [src/controller/model/device.ts:288](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/model/device.ts#L288)*

**Returns:** [Device](_src_controller_model_device_.device.md)[]

___

### byIeeeAddr

▸ `Static`**byIeeeAddr**(`ieeeAddr`: string): [Device](_src_controller_model_device_.device.md)

*Defined in [src/controller/model/device.ts:273](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/model/device.ts#L273)*

#### Parameters:

Name | Type |
------ | ------ |
`ieeeAddr` | string |

**Returns:** [Device](_src_controller_model_device_.device.md)

___

### byNetworkAddress

▸ `Static`**byNetworkAddress**(`networkAddress`: number): [Device](_src_controller_model_device_.device.md)

*Defined in [src/controller/model/device.ts:278](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/model/device.ts#L278)*

#### Parameters:

Name | Type |
------ | ------ |
`networkAddress` | number |

**Returns:** [Device](_src_controller_model_device_.device.md)

___

### byType

▸ `Static`**byType**(`type`: [DeviceType](../modules/_src_adapter_tstype_.md#devicetype)): [Device](_src_controller_model_device_.device.md)[]

*Defined in [src/controller/model/device.ts:283](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/model/device.ts#L283)*

#### Parameters:

Name | Type |
------ | ------ |
`type` | [DeviceType](../modules/_src_adapter_tstype_.md#devicetype) |

**Returns:** [Device](_src_controller_model_device_.device.md)[]

___

### create

▸ `Static`**create**(`type`: [DeviceType](../modules/_src_adapter_tstype_.md#devicetype), `ieeeAddr`: string, `networkAddress`: number, `manufacturerID`: number, `manufacturerName`: string, `powerSource`: string, `modelID`: string, `interviewCompleted`: boolean, `endpoints`: { ID: number ; deviceID: number ; inputClusters: number[] ; outputClusters: number[] ; profileID: number  }[]): [Device](_src_controller_model_device_.device.md)

*Defined in [src/controller/model/device.ts:293](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/model/device.ts#L293)*

#### Parameters:

Name | Type |
------ | ------ |
`type` | [DeviceType](../modules/_src_adapter_tstype_.md#devicetype) |
`ieeeAddr` | string |
`networkAddress` | number |
`manufacturerID` | number |
`manufacturerName` | string |
`powerSource` | string |
`modelID` | string |
`interviewCompleted` | boolean |
`endpoints` | { ID: number ; deviceID: number ; inputClusters: number[] ; outputClusters: number[] ; profileID: number  }[] |

**Returns:** [Device](_src_controller_model_device_.device.md)

___

### injectAdapter

▸ `Static`**injectAdapter**(`adapter`: Adapter): void

*Inherited from [Group](_src_controller_model_group_.group.md).[injectAdapter](_src_controller_model_group_.group.md#injectadapter)*

*Defined in [src/controller/model/entity.ts:12](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/model/entity.ts#L12)*

#### Parameters:

Name | Type |
------ | ------ |
`adapter` | Adapter |

**Returns:** void

___

### injectDatabase

▸ `Static`**injectDatabase**(`database`: Database): void

*Inherited from [Group](_src_controller_model_group_.group.md).[injectDatabase](_src_controller_model_group_.group.md#injectdatabase)*

*Defined in [src/controller/model/entity.ts:8](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/model/entity.ts#L8)*

#### Parameters:

Name | Type |
------ | ------ |
`database` | Database |

**Returns:** void

## Object literals

### ReportablePropertiesMapping

▪ `Static` `Readonly` **ReportablePropertiesMapping**: object

*Defined in [src/controller/model/device.ts:94](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/model/device.ts#L94)*

#### Properties:

Name | Type | Value |
------ | ------ | ------ |
`appVersion` | object | { key: \"applicationVersion\" = "applicationVersion"; set: (v: number,d: [Device](\_src\_controller\_model\_device\_.device.md)) => void  } |
`dateCode` | object | { key: \"dateCode\" = "dateCode"; set: (v: string,d: [Device](\_src\_controller\_model\_device\_.device.md)) => void  } |
`hwVersion` | object | { key: \"hardwareVersion\" = "hardwareVersion"; set: (v: number,d: [Device](\_src\_controller\_model\_device\_.device.md)) => void  } |
`manufacturerName` | object | { key: \"manufacturerName\" = "manufacturerName"; set: (v: string,d: [Device](\_src\_controller\_model\_device\_.device.md)) => void  } |
`modelId` | object | { key: \"modelID\" = "modelID"; set: (v: string,d: [Device](\_src\_controller\_model\_device\_.device.md)) => void  } |
`powerSource` | object | { key: \"powerSource\" = "powerSource"; set: (v: string,d: [Device](\_src\_controller\_model\_device\_.device.md)) => void  } |
`stackVersion` | object | { key: \"stackVersion\" = "stackVersion"; set: (v: number,d: [Device](\_src\_controller\_model\_device\_.device.md)) => void  } |
`swBuildId` | object | { key: \"softwareBuildID\" = "softwareBuildID"; set: (v: string,d: [Device](\_src\_controller\_model\_device\_.device.md)) => void  } |
`zclVersion` | object | { key: \"zclVersion\" = "zclVersion"; set: (v: number,d: [Device](\_src\_controller\_model\_device\_.device.md)) => void  } |
