[zigbee-herdsman](../README.md) › ["src/controller/model/endpoint"](../modules/_src_controller_model_endpoint_.md) › [Endpoint](_src_controller_model_endpoint_.endpoint.md)

# Class: Endpoint

## Hierarchy

* Entity

  ↳ **Endpoint**

## Index

### Properties

* [ID](_src_controller_model_endpoint_.endpoint.md#readonly-id)
* [clusters](_src_controller_model_endpoint_.endpoint.md#readonly-clusters)
* [deviceID](_src_controller_model_endpoint_.endpoint.md#optional-deviceid)
* [deviceNetworkAddress](_src_controller_model_endpoint_.endpoint.md#devicenetworkaddress)
* [inputClusters](_src_controller_model_endpoint_.endpoint.md#inputclusters)
* [outputClusters](_src_controller_model_endpoint_.endpoint.md#outputclusters)
* [profileID](_src_controller_model_endpoint_.endpoint.md#optional-profileid)

### Accessors

* [binds](_src_controller_model_endpoint_.endpoint.md#binds)

### Methods

* [addToGroup](_src_controller_model_endpoint_.endpoint.md#addtogroup)
* [bind](_src_controller_model_endpoint_.endpoint.md#bind)
* [command](_src_controller_model_endpoint_.endpoint.md#command)
* [commandResponse](_src_controller_model_endpoint_.endpoint.md#commandresponse)
* [configureReporting](_src_controller_model_endpoint_.endpoint.md#configurereporting)
* [defaultResponse](_src_controller_model_endpoint_.endpoint.md#defaultresponse)
* [getClusterAttributeValue](_src_controller_model_endpoint_.endpoint.md#getclusterattributevalue)
* [getDevice](_src_controller_model_endpoint_.endpoint.md#getdevice)
* [getInputClusters](_src_controller_model_endpoint_.endpoint.md#getinputclusters)
* [getOutputClusters](_src_controller_model_endpoint_.endpoint.md#getoutputclusters)
* [read](_src_controller_model_endpoint_.endpoint.md#read)
* [readResponse](_src_controller_model_endpoint_.endpoint.md#readresponse)
* [removeFromAllGroups](_src_controller_model_endpoint_.endpoint.md#removefromallgroups)
* [removeFromAllGroupsDatabase](_src_controller_model_endpoint_.endpoint.md#removefromallgroupsdatabase)
* [removeFromGroup](_src_controller_model_endpoint_.endpoint.md#removefromgroup)
* [saveClusterAttributeKeyValue](_src_controller_model_endpoint_.endpoint.md#saveclusterattributekeyvalue)
* [supportsInputCluster](_src_controller_model_endpoint_.endpoint.md#supportsinputcluster)
* [supportsOutputCluster](_src_controller_model_endpoint_.endpoint.md#supportsoutputcluster)
* [toDatabaseRecord](_src_controller_model_endpoint_.endpoint.md#todatabaserecord)
* [unbind](_src_controller_model_endpoint_.endpoint.md#unbind)
* [waitForCommand](_src_controller_model_endpoint_.endpoint.md#waitforcommand)
* [write](_src_controller_model_endpoint_.endpoint.md#write)
* [create](_src_controller_model_endpoint_.endpoint.md#static-create)
* [fromDatabaseRecord](_src_controller_model_endpoint_.endpoint.md#static-fromdatabaserecord)
* [injectAdapter](_src_controller_model_endpoint_.endpoint.md#static-injectadapter)
* [injectDatabase](_src_controller_model_endpoint_.endpoint.md#static-injectdatabase)

## Properties

### `Readonly` ID

• **ID**: *number*

*Defined in [src/controller/model/endpoint.ts:58](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/model/endpoint.ts#L58)*

___

### `Readonly` clusters

• **clusters**: *[Clusters](../interfaces/_src_controller_model_endpoint_.clusters.md)*

*Defined in [src/controller/model/endpoint.ts:59](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/model/endpoint.ts#L59)*

___

### `Optional` deviceID

• **deviceID**? : *number*

*Defined in [src/controller/model/endpoint.ts:54](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/model/endpoint.ts#L54)*

___

###  deviceNetworkAddress

• **deviceNetworkAddress**: *number*

*Defined in [src/controller/model/endpoint.ts:61](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/model/endpoint.ts#L61)*

___

###  inputClusters

• **inputClusters**: *number[]*

*Defined in [src/controller/model/endpoint.ts:55](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/model/endpoint.ts#L55)*

___

###  outputClusters

• **outputClusters**: *number[]*

*Defined in [src/controller/model/endpoint.ts:56](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/model/endpoint.ts#L56)*

___

### `Optional` profileID

• **profileID**? : *number*

*Defined in [src/controller/model/endpoint.ts:57](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/model/endpoint.ts#L57)*

## Accessors

###  binds

• **get binds**(): *[Bind](../interfaces/_src_controller_model_endpoint_.bind.md)[]*

*Defined in [src/controller/model/endpoint.ts:65](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/model/endpoint.ts#L65)*

**Returns:** *[Bind](../interfaces/_src_controller_model_endpoint_.bind.md)[]*

## Methods

###  addToGroup

▸ **addToGroup**(`group`: [Group](_src_controller_model_group_.group.md)): *Promise‹void›*

*Defined in [src/controller/model/endpoint.ts:592](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/model/endpoint.ts#L592)*

**Parameters:**

Name | Type |
------ | ------ |
`group` | [Group](_src_controller_model_group_.group.md) |

**Returns:** *Promise‹void›*

___

###  bind

▸ **bind**(`clusterKey`: number | string, `target`: [Endpoint](_src_controller_model_endpoint_.endpoint.md) | [Group](_src_controller_model_group_.group.md) | number): *Promise‹void›*

*Defined in [src/controller/model/endpoint.ts:342](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/model/endpoint.ts#L342)*

**Parameters:**

Name | Type |
------ | ------ |
`clusterKey` | number &#124; string |
`target` | [Endpoint](_src_controller_model_endpoint_.endpoint.md) &#124; [Group](_src_controller_model_group_.group.md) &#124; number |

**Returns:** *Promise‹void›*

___

###  command

▸ **command**(`clusterKey`: number | string, `commandKey`: number | string, `payload`: [KeyValue](../interfaces/_src_controller_tstype_.keyvalue.md), `options?`: [Options](../interfaces/_src_controller_model_group_.options.md)): *Promise‹void | [KeyValue](../interfaces/_src_controller_tstype_.keyvalue.md)›*

*Defined in [src/controller/model/endpoint.ts:490](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/model/endpoint.ts#L490)*

**Parameters:**

Name | Type |
------ | ------ |
`clusterKey` | number &#124; string |
`commandKey` | number &#124; string |
`payload` | [KeyValue](../interfaces/_src_controller_tstype_.keyvalue.md) |
`options?` | [Options](../interfaces/_src_controller_model_group_.options.md) |

**Returns:** *Promise‹void | [KeyValue](../interfaces/_src_controller_tstype_.keyvalue.md)›*

___

###  commandResponse

▸ **commandResponse**(`clusterKey`: number | string, `commandKey`: number | string, `payload`: [KeyValue](../interfaces/_src_controller_tstype_.keyvalue.md), `options?`: [Options](../interfaces/_src_controller_model_group_.options.md), `transactionSequenceNumber?`: number): *Promise‹void | [KeyValue](../interfaces/_src_controller_tstype_.keyvalue.md)›*

*Defined in [src/controller/model/endpoint.ts:524](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/model/endpoint.ts#L524)*

**Parameters:**

Name | Type |
------ | ------ |
`clusterKey` | number &#124; string |
`commandKey` | number &#124; string |
`payload` | [KeyValue](../interfaces/_src_controller_tstype_.keyvalue.md) |
`options?` | [Options](../interfaces/_src_controller_model_group_.options.md) |
`transactionSequenceNumber?` | number |

**Returns:** *Promise‹void | [KeyValue](../interfaces/_src_controller_tstype_.keyvalue.md)›*

___

###  configureReporting

▸ **configureReporting**(`clusterKey`: number | string, `items`: [ConfigureReportingItem](../interfaces/_src_controller_model_endpoint_.configurereportingitem.md)[], `options?`: [Options](../interfaces/_src_controller_model_group_.options.md)): *Promise‹void›*

*Defined in [src/controller/model/endpoint.ts:435](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/model/endpoint.ts#L435)*

**Parameters:**

Name | Type |
------ | ------ |
`clusterKey` | number &#124; string |
`items` | [ConfigureReportingItem](../interfaces/_src_controller_model_endpoint_.configurereportingitem.md)[] |
`options?` | [Options](../interfaces/_src_controller_model_group_.options.md) |

**Returns:** *Promise‹void›*

___

###  defaultResponse

▸ **defaultResponse**(`commandID`: number, `status`: number, `clusterID`: number, `transactionSequenceNumber`: number, `options?`: [Options](../interfaces/_src_controller_model_group_.options.md)): *Promise‹void›*

*Defined in [src/controller/model/endpoint.ts:408](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/model/endpoint.ts#L408)*

**Parameters:**

Name | Type |
------ | ------ |
`commandID` | number |
`status` | number |
`clusterID` | number |
`transactionSequenceNumber` | number |
`options?` | [Options](../interfaces/_src_controller_model_group_.options.md) |

**Returns:** *Promise‹void›*

___

###  getClusterAttributeValue

▸ **getClusterAttributeValue**(`clusterKey`: number | string, `attributeKey`: number | string): *number | string*

*Defined in [src/controller/model/endpoint.ts:200](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/model/endpoint.ts#L200)*

**Parameters:**

Name | Type |
------ | ------ |
`clusterKey` | number &#124; string |
`attributeKey` | number &#124; string |

**Returns:** *number | string*

___

###  getDevice

▸ **getDevice**(): *[Device](_src_controller_model_device_.device.md)*

*Defined in [src/controller/model/endpoint.ts:104](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/model/endpoint.ts#L104)*

Get device of this endpoint

**Returns:** *[Device](_src_controller_model_device_.device.md)*

___

###  getInputClusters

▸ **getInputClusters**(): *Cluster[]*

*Defined in [src/controller/model/endpoint.ts:129](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/model/endpoint.ts#L129)*

**Returns:** *Cluster[]*

___

###  getOutputClusters

▸ **getOutputClusters**(): *Cluster[]*

*Defined in [src/controller/model/endpoint.ts:136](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/model/endpoint.ts#L136)*

**Returns:** *Cluster[]*

___

###  read

▸ **read**(`clusterKey`: number | string, `attributes`: string[] | number[], `options?`: [Options](../interfaces/_src_controller_model_group_.options.md)): *Promise‹[KeyValue](../interfaces/_src_controller_tstype_.keyvalue.md)›*

*Defined in [src/controller/model/endpoint.ts:264](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/model/endpoint.ts#L264)*

**Parameters:**

Name | Type |
------ | ------ |
`clusterKey` | number &#124; string |
`attributes` | string[] &#124; number[] |
`options?` | [Options](../interfaces/_src_controller_model_group_.options.md) |

**Returns:** *Promise‹[KeyValue](../interfaces/_src_controller_tstype_.keyvalue.md)›*

___

###  readResponse

▸ **readResponse**(`clusterKey`: number | string, `transactionSequenceNumber`: number, `attributes`: [KeyValue](../interfaces/_src_controller_tstype_.keyvalue.md), `options?`: [Options](../interfaces/_src_controller_model_group_.options.md)): *Promise‹void›*

*Defined in [src/controller/model/endpoint.ts:303](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/model/endpoint.ts#L303)*

**Parameters:**

Name | Type |
------ | ------ |
`clusterKey` | number &#124; string |
`transactionSequenceNumber` | number |
`attributes` | [KeyValue](../interfaces/_src_controller_tstype_.keyvalue.md) |
`options?` | [Options](../interfaces/_src_controller_model_group_.options.md) |

**Returns:** *Promise‹void›*

___

###  removeFromAllGroups

▸ **removeFromAllGroups**(): *Promise‹void›*

*Defined in [src/controller/model/endpoint.ts:609](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/model/endpoint.ts#L609)*

**Returns:** *Promise‹void›*

___

###  removeFromAllGroupsDatabase

▸ **removeFromAllGroupsDatabase**(): *void*

*Defined in [src/controller/model/endpoint.ts:614](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/model/endpoint.ts#L614)*

**Returns:** *void*

___

###  removeFromGroup

▸ **removeFromGroup**(`group`: [Group](_src_controller_model_group_.group.md) | number): *Promise‹void›*

*Defined in [src/controller/model/endpoint.ts:602](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/model/endpoint.ts#L602)*

Remove endpoint from a group, accepts both a Group and number as parameter.
The number parameter type should only be used when removing from a group which is not known
to zigbee-herdsman.

**Parameters:**

Name | Type |
------ | ------ |
`group` | [Group](_src_controller_model_group_.group.md) &#124; number |

**Returns:** *Promise‹void›*

___

###  saveClusterAttributeKeyValue

▸ **saveClusterAttributeKeyValue**(`clusterKey`: number | string, `list`: [KeyValue](../interfaces/_src_controller_tstype_.keyvalue.md)): *void*

*Defined in [src/controller/model/endpoint.ts:191](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/model/endpoint.ts#L191)*

**Parameters:**

Name | Type |
------ | ------ |
`clusterKey` | number &#124; string |
`list` | [KeyValue](../interfaces/_src_controller_tstype_.keyvalue.md) |

**Returns:** *void*

___

###  supportsInputCluster

▸ **supportsInputCluster**(`clusterKey`: number | string): *boolean*

*Defined in [src/controller/model/endpoint.ts:112](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/model/endpoint.ts#L112)*

**Parameters:**

Name | Type |
------ | ------ |
`clusterKey` | number &#124; string |

**Returns:** *boolean*

___

###  supportsOutputCluster

▸ **supportsOutputCluster**(`clusterKey`: number | string): *boolean*

*Defined in [src/controller/model/endpoint.ts:121](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/model/endpoint.ts#L121)*

**Parameters:**

Name | Type |
------ | ------ |
`clusterKey` | number &#124; string |

**Returns:** *boolean*

___

###  toDatabaseRecord

▸ **toDatabaseRecord**(): *[KeyValue](../interfaces/_src_controller_tstype_.keyvalue.md)*

*Defined in [src/controller/model/endpoint.ts:173](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/model/endpoint.ts#L173)*

**Returns:** *[KeyValue](../interfaces/_src_controller_tstype_.keyvalue.md)*

___

###  unbind

▸ **unbind**(`clusterKey`: number | string, `target`: [Endpoint](_src_controller_model_endpoint_.endpoint.md) | [Group](_src_controller_model_group_.group.md) | number): *Promise‹void›*

*Defined in [src/controller/model/endpoint.ts:379](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/model/endpoint.ts#L379)*

**Parameters:**

Name | Type |
------ | ------ |
`clusterKey` | number &#124; string |
`target` | [Endpoint](_src_controller_model_endpoint_.endpoint.md) &#124; [Group](_src_controller_model_group_.group.md) &#124; number |

**Returns:** *Promise‹void›*

___

###  waitForCommand

▸ **waitForCommand**(`clusterKey`: number | string, `commandKey`: number | string, `transactionSequenceNumber`: number, `timeout`: number): *object*

*Defined in [src/controller/model/endpoint.ts:555](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/model/endpoint.ts#L555)*

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

▸ **write**(`clusterKey`: number | string, `attributes`: [KeyValue](../interfaces/_src_controller_tstype_.keyvalue.md), `options?`: [Options](../interfaces/_src_controller_model_group_.options.md)): *Promise‹void›*

*Defined in [src/controller/model/endpoint.ts:222](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/model/endpoint.ts#L222)*

**Parameters:**

Name | Type |
------ | ------ |
`clusterKey` | number &#124; string |
`attributes` | [KeyValue](../interfaces/_src_controller_tstype_.keyvalue.md) |
`options?` | [Options](../interfaces/_src_controller_model_group_.options.md) |

**Returns:** *Promise‹void›*

___

### `Static` create

▸ **create**(`ID`: number, `profileID`: number, `deviceID`: number, `inputClusters`: number[], `outputClusters`: number[], `deviceNetworkAddress`: number, `deviceIeeeAddress`: string): *[Endpoint](_src_controller_model_endpoint_.endpoint.md)*

*Defined in [src/controller/model/endpoint.ts:181](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/model/endpoint.ts#L181)*

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

**Returns:** *[Endpoint](_src_controller_model_endpoint_.endpoint.md)*

___

### `Static` fromDatabaseRecord

▸ **fromDatabaseRecord**(`record`: [KeyValue](../interfaces/_src_controller_tstype_.keyvalue.md), `deviceNetworkAddress`: number, `deviceIeeeAddress`: string): *[Endpoint](_src_controller_model_endpoint_.endpoint.md)*

*Defined in [src/controller/model/endpoint.ts:154](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/model/endpoint.ts#L154)*

**Parameters:**

Name | Type |
------ | ------ |
`record` | [KeyValue](../interfaces/_src_controller_tstype_.keyvalue.md) |
`deviceNetworkAddress` | number |
`deviceIeeeAddress` | string |

**Returns:** *[Endpoint](_src_controller_model_endpoint_.endpoint.md)*

___

### `Static` injectAdapter

▸ **injectAdapter**(`adapter`: Adapter): *void*

*Inherited from [Group](_src_controller_model_group_.group.md).[injectAdapter](_src_controller_model_group_.group.md#static-injectadapter)*

*Defined in [src/controller/model/entity.ts:12](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/model/entity.ts#L12)*

**Parameters:**

Name | Type |
------ | ------ |
`adapter` | Adapter |

**Returns:** *void*

___

### `Static` injectDatabase

▸ **injectDatabase**(`database`: Database): *void*

*Inherited from [Group](_src_controller_model_group_.group.md).[injectDatabase](_src_controller_model_group_.group.md#static-injectdatabase)*

*Defined in [src/controller/model/entity.ts:8](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/model/entity.ts#L8)*

**Parameters:**

Name | Type |
------ | ------ |
`database` | Database |

**Returns:** *void*
