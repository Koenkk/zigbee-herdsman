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
* [configureReporting](_controller_model_endpoint_.endpoint.md#configurereporting)
* [defaultResponse](_controller_model_endpoint_.endpoint.md#defaultresponse)
* [getClusterAttributeValue](_controller_model_endpoint_.endpoint.md#getclusterattributevalue)
* [getDevice](_controller_model_endpoint_.endpoint.md#getdevice)
* [read](_controller_model_endpoint_.endpoint.md#read)
* [readResponse](_controller_model_endpoint_.endpoint.md#readresponse)
* [removeFromAllGroups](_controller_model_endpoint_.endpoint.md#removefromallgroups)
* [removeFromGroup](_controller_model_endpoint_.endpoint.md#removefromgroup)
* [saveClusterAttributeList](_controller_model_endpoint_.endpoint.md#saveclusterattributelist)
* [supportsInputCluster](_controller_model_endpoint_.endpoint.md#supportsinputcluster)
* [supportsOutputCluster](_controller_model_endpoint_.endpoint.md#supportsoutputcluster)
* [toDatabaseRecord](_controller_model_endpoint_.endpoint.md#todatabaserecord)
* [unbind](_controller_model_endpoint_.endpoint.md#unbind)
* [write](_controller_model_endpoint_.endpoint.md#write)
* [create](_controller_model_endpoint_.endpoint.md#static-create)
* [fromDatabaseRecord](_controller_model_endpoint_.endpoint.md#static-fromdatabaserecord)
* [injectAdapter](_controller_model_endpoint_.endpoint.md#static-injectadapter)
* [injectDatabse](_controller_model_endpoint_.endpoint.md#static-injectdatabse)

## Properties

###  ID

• **ID**: *number*

*Defined in [controller/model/endpoint.ts:46](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/model/endpoint.ts#L46)*

___

###  clusters

• **clusters**: *[Clusters](../interfaces/_controller_model_endpoint_.clusters.md)*

*Defined in [controller/model/endpoint.ts:47](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/model/endpoint.ts#L47)*

___

### `Optional` deviceID

• **deviceID**? : *number*

*Defined in [controller/model/endpoint.ts:42](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/model/endpoint.ts#L42)*

___

###  deviceNetworkAddress

• **deviceNetworkAddress**: *number*

*Defined in [controller/model/endpoint.ts:49](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/model/endpoint.ts#L49)*

___

###  inputClusters

• **inputClusters**: *number[]*

*Defined in [controller/model/endpoint.ts:43](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/model/endpoint.ts#L43)*

___

###  outputClusters

• **outputClusters**: *number[]*

*Defined in [controller/model/endpoint.ts:44](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/model/endpoint.ts#L44)*

___

### `Optional` profileID

• **profileID**? : *number*

*Defined in [controller/model/endpoint.ts:45](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/model/endpoint.ts#L45)*

## Accessors

###  binds

• **get binds**(): *[Bind](../interfaces/_controller_model_endpoint_.bind.md)[]*

*Defined in [controller/model/endpoint.ts:53](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/model/endpoint.ts#L53)*

**Returns:** *[Bind](../interfaces/_controller_model_endpoint_.bind.md)[]*

## Methods

###  addToGroup

▸ **addToGroup**(`group`: [Group](_controller_model_group_.group.md)): *Promise‹void›*

*Defined in [controller/model/endpoint.ts:352](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/model/endpoint.ts#L352)*

**Parameters:**

Name | Type |
------ | ------ |
`group` | [Group](_controller_model_group_.group.md) |

**Returns:** *Promise‹void›*

___

###  bind

▸ **bind**(`clusterKey`: number | string, `target`: [Endpoint](_controller_model_endpoint_.endpoint.md) | [Group](_controller_model_group_.group.md)): *Promise‹void›*

*Defined in [controller/model/endpoint.ts:229](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/model/endpoint.ts#L229)*

**Parameters:**

Name | Type |
------ | ------ |
`clusterKey` | number &#124; string |
`target` | [Endpoint](_controller_model_endpoint_.endpoint.md) &#124; [Group](_controller_model_group_.group.md) |

**Returns:** *Promise‹void›*

___

###  command

▸ **command**(`clusterKey`: number | string, `commandKey`: number | string, `payload`: [KeyValue](../interfaces/_controller_tstype_.keyvalue.md), `options?`: [Options](../interfaces/_controller_model_endpoint_.options.md)): *Promise‹void | [KeyValue](../interfaces/_controller_tstype_.keyvalue.md)›*

*Defined in [controller/model/endpoint.ts:318](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/model/endpoint.ts#L318)*

**Parameters:**

Name | Type |
------ | ------ |
`clusterKey` | number &#124; string |
`commandKey` | number &#124; string |
`payload` | [KeyValue](../interfaces/_controller_tstype_.keyvalue.md) |
`options?` | [Options](../interfaces/_controller_model_endpoint_.options.md) |

**Returns:** *Promise‹void | [KeyValue](../interfaces/_controller_tstype_.keyvalue.md)›*

___

###  configureReporting

▸ **configureReporting**(`clusterKey`: number | string, `items`: [ConfigureReportingItem](../interfaces/_controller_model_endpoint_.configurereportingitem.md)[], `options?`: [Options](../interfaces/_controller_model_endpoint_.options.md)): *Promise‹void›*

*Defined in [controller/model/endpoint.ts:282](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/model/endpoint.ts#L282)*

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

*Defined in [controller/model/endpoint.ts:270](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/model/endpoint.ts#L270)*

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

*Defined in [controller/model/endpoint.ts:153](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/model/endpoint.ts#L153)*

**Parameters:**

Name | Type |
------ | ------ |
`clusterKey` | number &#124; string |
`attributeKey` | number &#124; string |

**Returns:** *number | string*

___

###  getDevice

▸ **getDevice**(): *[Device](_controller_model_device_.device.md)*

*Defined in [controller/model/endpoint.ts:87](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/model/endpoint.ts#L87)*

Get device of this endpoint

**Returns:** *[Device](_controller_model_device_.device.md)*

___

###  read

▸ **read**(`clusterKey`: number | string, `attributes`: string[] | number[], `options?`: [Options](../interfaces/_controller_model_endpoint_.options.md)): *Promise‹[KeyValue](../interfaces/_controller_tstype_.keyvalue.md)›*

*Defined in [controller/model/endpoint.ts:191](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/model/endpoint.ts#L191)*

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

*Defined in [controller/model/endpoint.ts:211](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/model/endpoint.ts#L211)*

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

*Defined in [controller/model/endpoint.ts:362](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/model/endpoint.ts#L362)*

**Returns:** *Promise‹void›*

___

###  removeFromGroup

▸ **removeFromGroup**(`group`: [Group](_controller_model_group_.group.md)): *Promise‹void›*

*Defined in [controller/model/endpoint.ts:357](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/model/endpoint.ts#L357)*

**Parameters:**

Name | Type |
------ | ------ |
`group` | [Group](_controller_model_group_.group.md) |

**Returns:** *Promise‹void›*

___

###  saveClusterAttributeList

▸ **saveClusterAttributeList**(`clusterKey`: number | string, `list`: [KeyValue](../interfaces/_controller_tstype_.keyvalue.md)): *void*

*Defined in [controller/model/endpoint.ts:144](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/model/endpoint.ts#L144)*

**Parameters:**

Name | Type |
------ | ------ |
`clusterKey` | number &#124; string |
`list` | [KeyValue](../interfaces/_controller_tstype_.keyvalue.md) |

**Returns:** *void*

___

###  supportsInputCluster

▸ **supportsInputCluster**(`clusterKey`: number | string): *boolean*

*Defined in [controller/model/endpoint.ts:95](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/model/endpoint.ts#L95)*

**Parameters:**

Name | Type |
------ | ------ |
`clusterKey` | number &#124; string |

**Returns:** *boolean*

___

###  supportsOutputCluster

▸ **supportsOutputCluster**(`clusterKey`: number | string): *boolean*

*Defined in [controller/model/endpoint.ts:100](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/model/endpoint.ts#L100)*

**Parameters:**

Name | Type |
------ | ------ |
`clusterKey` | number &#124; string |

**Returns:** *boolean*

___

###  toDatabaseRecord

▸ **toDatabaseRecord**(): *[KeyValue](../interfaces/_controller_tstype_.keyvalue.md)*

*Defined in [controller/model/endpoint.ts:126](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/model/endpoint.ts#L126)*

**Returns:** *[KeyValue](../interfaces/_controller_tstype_.keyvalue.md)*

___

###  unbind

▸ **unbind**(`clusterKey`: number | string, `target`: [Endpoint](_controller_model_endpoint_.endpoint.md) | [Group](_controller_model_group_.group.md)): *Promise‹void›*

*Defined in [controller/model/endpoint.ts:253](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/model/endpoint.ts#L253)*

**Parameters:**

Name | Type |
------ | ------ |
`clusterKey` | number &#124; string |
`target` | [Endpoint](_controller_model_endpoint_.endpoint.md) &#124; [Group](_controller_model_group_.group.md) |

**Returns:** *Promise‹void›*

___

###  write

▸ **write**(`clusterKey`: number | string, `attributes`: [KeyValue](../interfaces/_controller_tstype_.keyvalue.md), `options?`: [Options](../interfaces/_controller_model_endpoint_.options.md)): *Promise‹void›*

*Defined in [controller/model/endpoint.ts:167](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/model/endpoint.ts#L167)*

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

*Defined in [controller/model/endpoint.ts:134](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/model/endpoint.ts#L134)*

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

*Defined in [controller/model/endpoint.ts:109](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/model/endpoint.ts#L109)*

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

*Inherited from void*

*Defined in [controller/model/entity.ts:12](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/model/entity.ts#L12)*

**Parameters:**

Name | Type |
------ | ------ |
`adapter` | Adapter |

**Returns:** *void*

___

### `Static` injectDatabse

▸ **injectDatabse**(`database`: Database): *void*

*Inherited from void*

*Defined in [controller/model/entity.ts:8](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/model/entity.ts#L8)*

**Parameters:**

Name | Type |
------ | ------ |
`database` | Database |

**Returns:** *void*
