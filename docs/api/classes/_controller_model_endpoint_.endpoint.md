[zigbee-herdsman](../README.md) › ["controller/model/endpoint"](../modules/_controller_model_endpoint_.md) › [Endpoint](_controller_model_endpoint_.endpoint.md)

# Class: Endpoint

## Hierarchy

* Entity

  ↳ **Endpoint**

## Index

### Properties

* [ID](_controller_model_endpoint_.endpoint.md#id)
* [clusters](_controller_model_endpoint_.endpoint.md#clusters)
* [deviceID](_controller_model_endpoint_.endpoint.md#optional-deviceid)
* [deviceNetworkAddress](_controller_model_endpoint_.endpoint.md#devicenetworkaddress)
* [inputClusters](_controller_model_endpoint_.endpoint.md#inputclusters)
* [outputClusters](_controller_model_endpoint_.endpoint.md#outputclusters)
* [profileID](_controller_model_endpoint_.endpoint.md#optional-profileid)

### Accessors

* [binds](_controller_model_endpoint_.endpoint.md#binds)

### Methods

* [addToGroup](_controller_model_endpoint_.endpoint.md#addtogroup)
* [bind](_controller_model_endpoint_.endpoint.md#bind)
* [command](_controller_model_endpoint_.endpoint.md#command)
* [commandResponse](_controller_model_endpoint_.endpoint.md#commandresponse)
* [configureReporting](_controller_model_endpoint_.endpoint.md#configurereporting)
* [defaultResponse](_controller_model_endpoint_.endpoint.md#defaultresponse)
* [getClusterAttributeValue](_controller_model_endpoint_.endpoint.md#getclusterattributevalue)
* [getDevice](_controller_model_endpoint_.endpoint.md#getdevice)
* [read](_controller_model_endpoint_.endpoint.md#read)
* [readResponse](_controller_model_endpoint_.endpoint.md#readresponse)
* [removeFromAllGroups](_controller_model_endpoint_.endpoint.md#removefromallgroups)
* [removeFromGroup](_controller_model_endpoint_.endpoint.md#removefromgroup)
* [saveClusterAttributeKeyValue](_controller_model_endpoint_.endpoint.md#saveclusterattributekeyvalue)
* [supportsInputCluster](_controller_model_endpoint_.endpoint.md#supportsinputcluster)
* [supportsOutputCluster](_controller_model_endpoint_.endpoint.md#supportsoutputcluster)
* [toDatabaseRecord](_controller_model_endpoint_.endpoint.md#todatabaserecord)
* [unbind](_controller_model_endpoint_.endpoint.md#unbind)
* [waitForCommand](_controller_model_endpoint_.endpoint.md#waitforcommand)
* [write](_controller_model_endpoint_.endpoint.md#write)
* [create](_controller_model_endpoint_.endpoint.md#static-create)
* [fromDatabaseRecord](_controller_model_endpoint_.endpoint.md#static-fromdatabaserecord)
* [injectAdapter](_controller_model_endpoint_.endpoint.md#static-injectadapter)
* [injectDatabase](_controller_model_endpoint_.endpoint.md#static-injectdatabase)

## Properties

###  ID

• **ID**: *number*

*Defined in [src/controller/model/endpoint.ts:53](https://github.com/Koenkk/zigbee-herdsman/blob/610fe5a/src/controller/model/endpoint.ts#L53)*

___

###  clusters

• **clusters**: *[Clusters](../interfaces/_controller_model_endpoint_.clusters.md)*

*Defined in [src/controller/model/endpoint.ts:54](https://github.com/Koenkk/zigbee-herdsman/blob/610fe5a/src/controller/model/endpoint.ts#L54)*

___

### `Optional` deviceID

• **deviceID**? : *number*

*Defined in [src/controller/model/endpoint.ts:49](https://github.com/Koenkk/zigbee-herdsman/blob/610fe5a/src/controller/model/endpoint.ts#L49)*

___

###  deviceNetworkAddress

• **deviceNetworkAddress**: *number*

*Defined in [src/controller/model/endpoint.ts:56](https://github.com/Koenkk/zigbee-herdsman/blob/610fe5a/src/controller/model/endpoint.ts#L56)*

___

###  inputClusters

• **inputClusters**: *number[]*

*Defined in [src/controller/model/endpoint.ts:50](https://github.com/Koenkk/zigbee-herdsman/blob/610fe5a/src/controller/model/endpoint.ts#L50)*

___

###  outputClusters

• **outputClusters**: *number[]*

*Defined in [src/controller/model/endpoint.ts:51](https://github.com/Koenkk/zigbee-herdsman/blob/610fe5a/src/controller/model/endpoint.ts#L51)*

___

### `Optional` profileID

• **profileID**? : *number*

*Defined in [src/controller/model/endpoint.ts:52](https://github.com/Koenkk/zigbee-herdsman/blob/610fe5a/src/controller/model/endpoint.ts#L52)*

## Accessors

###  binds

• **get binds**(): *[Bind](../interfaces/_controller_model_endpoint_.bind.md)[]*

*Defined in [src/controller/model/endpoint.ts:60](https://github.com/Koenkk/zigbee-herdsman/blob/610fe5a/src/controller/model/endpoint.ts#L60)*

**Returns:** *[Bind](../interfaces/_controller_model_endpoint_.bind.md)[]*

## Methods

###  addToGroup

▸ **addToGroup**(`group`: [Group](_controller_model_group_.group.md)): *Promise‹void›*

*Defined in [src/controller/model/endpoint.ts:515](https://github.com/Koenkk/zigbee-herdsman/blob/610fe5a/src/controller/model/endpoint.ts#L515)*

**Parameters:**

Name | Type |
------ | ------ |
`group` | [Group](_controller_model_group_.group.md) |

**Returns:** *Promise‹void›*

___

###  bind

▸ **bind**(`clusterKey`: number | string, `target`: [Endpoint](_controller_model_endpoint_.endpoint.md) | [Group](_controller_model_group_.group.md) | number): *Promise‹void›*

*Defined in [src/controller/model/endpoint.ts:279](https://github.com/Koenkk/zigbee-herdsman/blob/610fe5a/src/controller/model/endpoint.ts#L279)*

**Parameters:**

Name | Type |
------ | ------ |
`clusterKey` | number &#124; string |
`target` | [Endpoint](_controller_model_endpoint_.endpoint.md) &#124; [Group](_controller_model_group_.group.md) &#124; number |

**Returns:** *Promise‹void›*

___

###  command

▸ **command**(`clusterKey`: number | string, `commandKey`: number | string, `payload`: [KeyValue](../interfaces/_controller_tstype_.keyvalue.md), `options?`: [Options](../interfaces/_controller_model_endpoint_.options.md)): *Promise‹void | [KeyValue](../interfaces/_controller_tstype_.keyvalue.md)›*

*Defined in [src/controller/model/endpoint.ts:415](https://github.com/Koenkk/zigbee-herdsman/blob/610fe5a/src/controller/model/endpoint.ts#L415)*

**Parameters:**

Name | Type |
------ | ------ |
`clusterKey` | number &#124; string |
`commandKey` | number &#124; string |
`payload` | [KeyValue](../interfaces/_controller_tstype_.keyvalue.md) |
`options?` | [Options](../interfaces/_controller_model_endpoint_.options.md) |

**Returns:** *Promise‹void | [KeyValue](../interfaces/_controller_tstype_.keyvalue.md)›*

___

###  commandResponse

▸ **commandResponse**(`clusterKey`: number | string, `commandKey`: number | string, `payload`: [KeyValue](../interfaces/_controller_tstype_.keyvalue.md), `options?`: [Options](../interfaces/_controller_model_endpoint_.options.md), `transactionSequenceNumber?`: number): *Promise‹void | [KeyValue](../interfaces/_controller_tstype_.keyvalue.md)›*

*Defined in [src/controller/model/endpoint.ts:453](https://github.com/Koenkk/zigbee-herdsman/blob/610fe5a/src/controller/model/endpoint.ts#L453)*

**Parameters:**

Name | Type |
------ | ------ |
`clusterKey` | number &#124; string |
`commandKey` | number &#124; string |
`payload` | [KeyValue](../interfaces/_controller_tstype_.keyvalue.md) |
`options?` | [Options](../interfaces/_controller_model_endpoint_.options.md) |
`transactionSequenceNumber?` | number |

**Returns:** *Promise‹void | [KeyValue](../interfaces/_controller_tstype_.keyvalue.md)›*

___

###  configureReporting

▸ **configureReporting**(`clusterKey`: number | string, `items`: [ConfigureReportingItem](../interfaces/_controller_model_endpoint_.configurereportingitem.md)[], `options?`: [Options](../interfaces/_controller_model_endpoint_.options.md)): *Promise‹void›*

*Defined in [src/controller/model/endpoint.ts:368](https://github.com/Koenkk/zigbee-herdsman/blob/610fe5a/src/controller/model/endpoint.ts#L368)*

**Parameters:**

Name | Type |
------ | ------ |
`clusterKey` | number &#124; string |
`items` | [ConfigureReportingItem](../interfaces/_controller_model_endpoint_.configurereportingitem.md)[] |
`options?` | [Options](../interfaces/_controller_model_endpoint_.options.md) |

**Returns:** *Promise‹void›*

___

###  defaultResponse

▸ **defaultResponse**(`commandID`: number, `status`: number, `clusterID`: number, `transactionSequenceNumber`: number, `options?`: [Options](../interfaces/_controller_model_endpoint_.options.md)): *Promise‹void›*

*Defined in [src/controller/model/endpoint.ts:345](https://github.com/Koenkk/zigbee-herdsman/blob/610fe5a/src/controller/model/endpoint.ts#L345)*

**Parameters:**

Name | Type |
------ | ------ |
`commandID` | number |
`status` | number |
`clusterID` | number |
`transactionSequenceNumber` | number |
`options?` | [Options](../interfaces/_controller_model_endpoint_.options.md) |

**Returns:** *Promise‹void›*

___

###  getClusterAttributeValue

▸ **getClusterAttributeValue**(`clusterKey`: number | string, `attributeKey`: number | string): *number | string*

*Defined in [src/controller/model/endpoint.ts:161](https://github.com/Koenkk/zigbee-herdsman/blob/610fe5a/src/controller/model/endpoint.ts#L161)*

**Parameters:**

Name | Type |
------ | ------ |
`clusterKey` | number &#124; string |
`attributeKey` | number &#124; string |

**Returns:** *number | string*

___

###  getDevice

▸ **getDevice**(): *[Device](_controller_model_device_.device.md)*

*Defined in [src/controller/model/endpoint.ts:95](https://github.com/Koenkk/zigbee-herdsman/blob/610fe5a/src/controller/model/endpoint.ts#L95)*

Get device of this endpoint

**Returns:** *[Device](_controller_model_device_.device.md)*

___

###  read

▸ **read**(`clusterKey`: number | string, `attributes`: string[] | number[], `options?`: [Options](../interfaces/_controller_model_endpoint_.options.md)): *Promise‹[KeyValue](../interfaces/_controller_tstype_.keyvalue.md)›*

*Defined in [src/controller/model/endpoint.ts:211](https://github.com/Koenkk/zigbee-herdsman/blob/610fe5a/src/controller/model/endpoint.ts#L211)*

**Parameters:**

Name | Type |
------ | ------ |
`clusterKey` | number &#124; string |
`attributes` | string[] &#124; number[] |
`options?` | [Options](../interfaces/_controller_model_endpoint_.options.md) |

**Returns:** *Promise‹[KeyValue](../interfaces/_controller_tstype_.keyvalue.md)›*

___

###  readResponse

▸ **readResponse**(`clusterKey`: number | string, `transactionSequenceNumber`: number, `attributes`: [KeyValue](../interfaces/_controller_tstype_.keyvalue.md), `options?`: [Options](../interfaces/_controller_model_endpoint_.options.md)): *Promise‹void›*

*Defined in [src/controller/model/endpoint.ts:242](https://github.com/Koenkk/zigbee-herdsman/blob/610fe5a/src/controller/model/endpoint.ts#L242)*

**Parameters:**

Name | Type |
------ | ------ |
`clusterKey` | number &#124; string |
`transactionSequenceNumber` | number |
`attributes` | [KeyValue](../interfaces/_controller_tstype_.keyvalue.md) |
`options?` | [Options](../interfaces/_controller_model_endpoint_.options.md) |

**Returns:** *Promise‹void›*

___

###  removeFromAllGroups

▸ **removeFromAllGroups**(): *Promise‹void›*

*Defined in [src/controller/model/endpoint.ts:532](https://github.com/Koenkk/zigbee-herdsman/blob/610fe5a/src/controller/model/endpoint.ts#L532)*

**Returns:** *Promise‹void›*

___

###  removeFromGroup

▸ **removeFromGroup**(`group`: [Group](_controller_model_group_.group.md) | number): *Promise‹void›*

*Defined in [src/controller/model/endpoint.ts:525](https://github.com/Koenkk/zigbee-herdsman/blob/610fe5a/src/controller/model/endpoint.ts#L525)*

Remove endpoint from a group, accepts both a Group and number as parameter.
The number parameter type should only be used when removing from a group which is not known
to zigbee-herdsman.

**Parameters:**

Name | Type |
------ | ------ |
`group` | [Group](_controller_model_group_.group.md) &#124; number |

**Returns:** *Promise‹void›*

___

###  saveClusterAttributeKeyValue

▸ **saveClusterAttributeKeyValue**(`clusterKey`: number | string, `list`: [KeyValue](../interfaces/_controller_tstype_.keyvalue.md)): *void*

*Defined in [src/controller/model/endpoint.ts:152](https://github.com/Koenkk/zigbee-herdsman/blob/610fe5a/src/controller/model/endpoint.ts#L152)*

**Parameters:**

Name | Type |
------ | ------ |
`clusterKey` | number &#124; string |
`list` | [KeyValue](../interfaces/_controller_tstype_.keyvalue.md) |

**Returns:** *void*

___

###  supportsInputCluster

▸ **supportsInputCluster**(`clusterKey`: number | string): *boolean*

*Defined in [src/controller/model/endpoint.ts:103](https://github.com/Koenkk/zigbee-herdsman/blob/610fe5a/src/controller/model/endpoint.ts#L103)*

**Parameters:**

Name | Type |
------ | ------ |
`clusterKey` | number &#124; string |

**Returns:** *boolean*

___

###  supportsOutputCluster

▸ **supportsOutputCluster**(`clusterKey`: number | string): *boolean*

*Defined in [src/controller/model/endpoint.ts:108](https://github.com/Koenkk/zigbee-herdsman/blob/610fe5a/src/controller/model/endpoint.ts#L108)*

**Parameters:**

Name | Type |
------ | ------ |
`clusterKey` | number &#124; string |

**Returns:** *boolean*

___

###  toDatabaseRecord

▸ **toDatabaseRecord**(): *[KeyValue](../interfaces/_controller_tstype_.keyvalue.md)*

*Defined in [src/controller/model/endpoint.ts:134](https://github.com/Koenkk/zigbee-herdsman/blob/610fe5a/src/controller/model/endpoint.ts#L134)*

**Returns:** *[KeyValue](../interfaces/_controller_tstype_.keyvalue.md)*

___

###  unbind

▸ **unbind**(`clusterKey`: number | string, `target`: [Endpoint](_controller_model_endpoint_.endpoint.md) | [Group](_controller_model_group_.group.md) | number): *Promise‹void›*

*Defined in [src/controller/model/endpoint.ts:316](https://github.com/Koenkk/zigbee-herdsman/blob/610fe5a/src/controller/model/endpoint.ts#L316)*

**Parameters:**

Name | Type |
------ | ------ |
`clusterKey` | number &#124; string |
`target` | [Endpoint](_controller_model_endpoint_.endpoint.md) &#124; [Group](_controller_model_group_.group.md) &#124; number |

**Returns:** *Promise‹void›*

___

###  waitForCommand

▸ **waitForCommand**(`clusterKey`: number | string, `commandKey`: number | string, `transactionSequenceNumber`: number, `timeout`: number): *object*

*Defined in [src/controller/model/endpoint.ts:486](https://github.com/Koenkk/zigbee-herdsman/blob/610fe5a/src/controller/model/endpoint.ts#L486)*

**Parameters:**

Name | Type |
------ | ------ |
`clusterKey` | number &#124; string |
`commandKey` | number &#124; string |
`transactionSequenceNumber` | number |
`timeout` | number |

**Returns:** *object*

* **cancel**(): *function*

  * (): *void*

* **promise**: *Promise‹object›*

___

###  write

▸ **write**(`clusterKey`: number | string, `attributes`: [KeyValue](../interfaces/_controller_tstype_.keyvalue.md), `options?`: [Options](../interfaces/_controller_model_endpoint_.options.md)): *Promise‹void›*

*Defined in [src/controller/model/endpoint.ts:175](https://github.com/Koenkk/zigbee-herdsman/blob/610fe5a/src/controller/model/endpoint.ts#L175)*

**Parameters:**

Name | Type |
------ | ------ |
`clusterKey` | number &#124; string |
`attributes` | [KeyValue](../interfaces/_controller_tstype_.keyvalue.md) |
`options?` | [Options](../interfaces/_controller_model_endpoint_.options.md) |

**Returns:** *Promise‹void›*

___

### `Static` create

▸ **create**(`ID`: number, `profileID`: number, `deviceID`: number, `inputClusters`: number[], `outputClusters`: number[], `deviceNetworkAddress`: number, `deviceIeeeAddress`: string): *[Endpoint](_controller_model_endpoint_.endpoint.md)*

*Defined in [src/controller/model/endpoint.ts:142](https://github.com/Koenkk/zigbee-herdsman/blob/610fe5a/src/controller/model/endpoint.ts#L142)*

**Parameters:**

Name | Type |
------ | ------ |
`ID` | number |
`profileID` | number |
`deviceID` | number |
`inputClusters` | number[] |
`outputClusters` | number[] |
`deviceNetworkAddress` | number |
`deviceIeeeAddress` | string |

**Returns:** *[Endpoint](_controller_model_endpoint_.endpoint.md)*

___

### `Static` fromDatabaseRecord

▸ **fromDatabaseRecord**(`record`: [KeyValue](../interfaces/_controller_tstype_.keyvalue.md), `deviceNetworkAddress`: number, `deviceIeeeAddress`: string): *[Endpoint](_controller_model_endpoint_.endpoint.md)*

*Defined in [src/controller/model/endpoint.ts:117](https://github.com/Koenkk/zigbee-herdsman/blob/610fe5a/src/controller/model/endpoint.ts#L117)*

**Parameters:**

Name | Type |
------ | ------ |
`record` | [KeyValue](../interfaces/_controller_tstype_.keyvalue.md) |
`deviceNetworkAddress` | number |
`deviceIeeeAddress` | string |

**Returns:** *[Endpoint](_controller_model_endpoint_.endpoint.md)*

___

### `Static` injectAdapter

▸ **injectAdapter**(`adapter`: Adapter): *void*

*Inherited from [Group](_controller_model_group_.group.md).[injectAdapter](_controller_model_group_.group.md#static-injectadapter)*

*Defined in [src/controller/model/entity.ts:12](https://github.com/Koenkk/zigbee-herdsman/blob/610fe5a/src/controller/model/entity.ts#L12)*

**Parameters:**

Name | Type |
------ | ------ |
`adapter` | Adapter |

**Returns:** *void*

___

### `Static` injectDatabase

▸ **injectDatabase**(`database`: Database): *void*

*Inherited from [Group](_controller_model_group_.group.md).[injectDatabase](_controller_model_group_.group.md#static-injectdatabase)*

*Defined in [src/controller/model/entity.ts:8](https://github.com/Koenkk/zigbee-herdsman/blob/610fe5a/src/controller/model/entity.ts#L8)*

**Parameters:**

Name | Type |
------ | ------ |
`database` | Database |

**Returns:** *void*
