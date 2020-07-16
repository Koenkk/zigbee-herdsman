[zigbee-herdsman](../README.md) › ["controller/model/group"](../modules/_controller_model_group_.md) › [Group](_controller_model_group_.group.md)

# Class: Group

## Hierarchy

* Entity

  ↳ **Group**

## Index

### Properties

* [groupID](_controller_model_group_.group.md#groupid)
* [meta](_controller_model_group_.group.md#meta)

### Accessors

* [members](_controller_model_group_.group.md#members)

### Methods

* [addMember](_controller_model_group_.group.md#addmember)
* [command](_controller_model_group_.group.md#command)
* [hasMember](_controller_model_group_.group.md#hasmember)
* [removeFromDatabase](_controller_model_group_.group.md#removefromdatabase)
* [removeFromNetwork](_controller_model_group_.group.md#removefromnetwork)
* [removeMember](_controller_model_group_.group.md#removemember)
* [save](_controller_model_group_.group.md#save)
* [all](_controller_model_group_.group.md#static-all)
* [byGroupID](_controller_model_group_.group.md#static-bygroupid)
* [create](_controller_model_group_.group.md#static-create)
* [injectAdapter](_controller_model_group_.group.md#static-injectadapter)
* [injectDatabase](_controller_model_group_.group.md#static-injectdatabase)

## Properties

###  groupID

• **groupID**: *number*

*Defined in [src/controller/model/group.ts:25](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/model/group.ts#L25)*

___

###  meta

• **meta**: *[KeyValue](../interfaces/_controller_tstype_.keyvalue.md)*

*Defined in [src/controller/model/group.ts:29](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/model/group.ts#L29)*

## Accessors

###  members

• **get members**(): *[Endpoint](_controller_model_endpoint_.endpoint.md)[]*

*Defined in [src/controller/model/group.ts:27](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/model/group.ts#L27)*

**Returns:** *[Endpoint](_controller_model_endpoint_.endpoint.md)[]*

## Methods

###  addMember

▸ **addMember**(`endpoint`: [Endpoint](_controller_model_endpoint_.endpoint.md)): *void*

*Defined in [src/controller/model/group.ts:126](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/model/group.ts#L126)*

**Parameters:**

Name | Type |
------ | ------ |
`endpoint` | [Endpoint](_controller_model_endpoint_.endpoint.md) |

**Returns:** *void*

___

###  command

▸ **command**(`clusterKey`: number | string, `commandKey`: number | string, `payload`: [KeyValue](../interfaces/_controller_tstype_.keyvalue.md), `options?`: [Options](../interfaces/_controller_model_group_.options.md)): *Promise‹void›*

*Defined in [src/controller/model/group.ts:144](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/model/group.ts#L144)*

**Parameters:**

Name | Type |
------ | ------ |
`clusterKey` | number &#124; string |
`commandKey` | number &#124; string |
`payload` | [KeyValue](../interfaces/_controller_tstype_.keyvalue.md) |
`options?` | [Options](../interfaces/_controller_model_group_.options.md) |

**Returns:** *Promise‹void›*

___

###  hasMember

▸ **hasMember**(`endpoint`: [Endpoint](_controller_model_endpoint_.endpoint.md)): *boolean*

*Defined in [src/controller/model/group.ts:136](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/model/group.ts#L136)*

**Parameters:**

Name | Type |
------ | ------ |
`endpoint` | [Endpoint](_controller_model_endpoint_.endpoint.md) |

**Returns:** *boolean*

___

###  removeFromDatabase

▸ **removeFromDatabase**(): *void*

*Defined in [src/controller/model/group.ts:112](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/model/group.ts#L112)*

**Returns:** *void*

___

###  removeFromNetwork

▸ **removeFromNetwork**(): *Promise‹void›*

*Defined in [src/controller/model/group.ts:104](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/model/group.ts#L104)*

**Returns:** *Promise‹void›*

___

###  removeMember

▸ **removeMember**(`endpoint`: [Endpoint](_controller_model_endpoint_.endpoint.md)): *void*

*Defined in [src/controller/model/group.ts:131](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/model/group.ts#L131)*

**Parameters:**

Name | Type |
------ | ------ |
`endpoint` | [Endpoint](_controller_model_endpoint_.endpoint.md) |

**Returns:** *void*

___

###  save

▸ **save**(): *void*

*Defined in [src/controller/model/group.ts:122](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/model/group.ts#L122)*

**Returns:** *void*

___

### `Static` all

▸ **all**(): *[Group](_controller_model_group_.group.md)[]*

*Defined in [src/controller/model/group.ts:84](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/model/group.ts#L84)*

**Returns:** *[Group](_controller_model_group_.group.md)[]*

___

### `Static` byGroupID

▸ **byGroupID**(`groupID`: number): *[Group](_controller_model_group_.group.md)*

*Defined in [src/controller/model/group.ts:79](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/model/group.ts#L79)*

**Parameters:**

Name | Type |
------ | ------ |
`groupID` | number |

**Returns:** *[Group](_controller_model_group_.group.md)*

___

### `Static` create

▸ **create**(`groupID`: number): *[Group](_controller_model_group_.group.md)*

*Defined in [src/controller/model/group.ts:89](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/model/group.ts#L89)*

**Parameters:**

Name | Type |
------ | ------ |
`groupID` | number |

**Returns:** *[Group](_controller_model_group_.group.md)*

___

### `Static` injectAdapter

▸ **injectAdapter**(`adapter`: Adapter): *void*

*Inherited from [Group](_controller_model_group_.group.md).[injectAdapter](_controller_model_group_.group.md#static-injectadapter)*

*Defined in [src/controller/model/entity.ts:12](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/model/entity.ts#L12)*

**Parameters:**

Name | Type |
------ | ------ |
`adapter` | Adapter |

**Returns:** *void*

___

### `Static` injectDatabase

▸ **injectDatabase**(`database`: Database): *void*

*Inherited from [Group](_controller_model_group_.group.md).[injectDatabase](_controller_model_group_.group.md#static-injectdatabase)*

*Defined in [src/controller/model/entity.ts:8](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/model/entity.ts#L8)*

**Parameters:**

Name | Type |
------ | ------ |
`database` | Database |

**Returns:** *void*
