**[zigbee-herdsman](../README.md)**

> [Globals](../README.md) / ["src/controller/model/group"](../modules/_src_controller_model_group_.md) / Group

# Class: Group

## Hierarchy

* Entity

  ↳ **Group**

## Index

### Properties

* [groupID](_src_controller_model_group_.group.md#groupid)
* [meta](_src_controller_model_group_.group.md#meta)

### Accessors

* [members](_src_controller_model_group_.group.md#members)

### Methods

* [addMember](_src_controller_model_group_.group.md#addmember)
* [command](_src_controller_model_group_.group.md#command)
* [hasMember](_src_controller_model_group_.group.md#hasmember)
* [read](_src_controller_model_group_.group.md#read)
* [removeFromDatabase](_src_controller_model_group_.group.md#removefromdatabase)
* [removeFromNetwork](_src_controller_model_group_.group.md#removefromnetwork)
* [removeMember](_src_controller_model_group_.group.md#removemember)
* [save](_src_controller_model_group_.group.md#save)
* [write](_src_controller_model_group_.group.md#write)
* [all](_src_controller_model_group_.group.md#all)
* [byGroupID](_src_controller_model_group_.group.md#bygroupid)
* [create](_src_controller_model_group_.group.md#create)
* [injectAdapter](_src_controller_model_group_.group.md#injectadapter)
* [injectDatabase](_src_controller_model_group_.group.md#injectdatabase)

## Properties

### groupID

• `Readonly` **groupID**: number

*Defined in [src/controller/model/group.ts:25](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/model/group.ts#L25)*

___

### meta

• `Readonly` **meta**: [KeyValue](../interfaces/_src_controller_tstype_.keyvalue.md)

*Defined in [src/controller/model/group.ts:29](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/model/group.ts#L29)*

## Accessors

### members

• get **members**(): [Endpoint](_src_controller_model_endpoint_.endpoint.md)[]

*Defined in [src/controller/model/group.ts:27](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/model/group.ts#L27)*

**Returns:** [Endpoint](_src_controller_model_endpoint_.endpoint.md)[]

## Methods

### addMember

▸ **addMember**(`endpoint`: [Endpoint](_src_controller_model_endpoint_.endpoint.md)): void

*Defined in [src/controller/model/group.ts:126](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/model/group.ts#L126)*

#### Parameters:

Name | Type |
------ | ------ |
`endpoint` | [Endpoint](_src_controller_model_endpoint_.endpoint.md) |

**Returns:** void

___

### command

▸ **command**(`clusterKey`: number \| string, `commandKey`: number \| string, `payload`: [KeyValue](../interfaces/_src_controller_tstype_.keyvalue.md), `options?`: [Options](../interfaces/_src_controller_model_group_.options.md)): Promise\<void>

*Defined in [src/controller/model/group.ts:206](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/model/group.ts#L206)*

#### Parameters:

Name | Type |
------ | ------ |
`clusterKey` | number \| string |
`commandKey` | number \| string |
`payload` | [KeyValue](../interfaces/_src_controller_tstype_.keyvalue.md) |
`options?` | [Options](../interfaces/_src_controller_model_group_.options.md) |

**Returns:** Promise\<void>

___

### hasMember

▸ **hasMember**(`endpoint`: [Endpoint](_src_controller_model_endpoint_.endpoint.md)): boolean

*Defined in [src/controller/model/group.ts:136](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/model/group.ts#L136)*

#### Parameters:

Name | Type |
------ | ------ |
`endpoint` | [Endpoint](_src_controller_model_endpoint_.endpoint.md) |

**Returns:** boolean

___

### read

▸ **read**(`clusterKey`: number \| string, `attributes`: string[] \| number[], `options?`: [Options](../interfaces/_src_controller_model_group_.options.md)): Promise\<void>

*Defined in [src/controller/model/group.ts:178](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/model/group.ts#L178)*

#### Parameters:

Name | Type |
------ | ------ |
`clusterKey` | number \| string |
`attributes` | string[] \| number[] |
`options?` | [Options](../interfaces/_src_controller_model_group_.options.md) |

**Returns:** Promise\<void>

___

### removeFromDatabase

▸ **removeFromDatabase**(): void

*Defined in [src/controller/model/group.ts:112](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/model/group.ts#L112)*

**Returns:** void

___

### removeFromNetwork

▸ **removeFromNetwork**(): Promise\<void>

*Defined in [src/controller/model/group.ts:104](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/model/group.ts#L104)*

**Returns:** Promise\<void>

___

### removeMember

▸ **removeMember**(`endpoint`: [Endpoint](_src_controller_model_endpoint_.endpoint.md)): void

*Defined in [src/controller/model/group.ts:131](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/model/group.ts#L131)*

#### Parameters:

Name | Type |
------ | ------ |
`endpoint` | [Endpoint](_src_controller_model_endpoint_.endpoint.md) |

**Returns:** void

___

### save

▸ **save**(): void

*Defined in [src/controller/model/group.ts:122](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/model/group.ts#L122)*

**Returns:** void

___

### write

▸ **write**(`clusterKey`: number \| string, `attributes`: [KeyValue](../interfaces/_src_controller_tstype_.keyvalue.md), `options?`: [Options](../interfaces/_src_controller_model_group_.options.md)): Promise\<void>

*Defined in [src/controller/model/group.ts:144](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/model/group.ts#L144)*

#### Parameters:

Name | Type |
------ | ------ |
`clusterKey` | number \| string |
`attributes` | [KeyValue](../interfaces/_src_controller_tstype_.keyvalue.md) |
`options?` | [Options](../interfaces/_src_controller_model_group_.options.md) |

**Returns:** Promise\<void>

___

### all

▸ `Static`**all**(): [Group](_src_controller_model_group_.group.md)[]

*Defined in [src/controller/model/group.ts:84](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/model/group.ts#L84)*

**Returns:** [Group](_src_controller_model_group_.group.md)[]

___

### byGroupID

▸ `Static`**byGroupID**(`groupID`: number): [Group](_src_controller_model_group_.group.md)

*Defined in [src/controller/model/group.ts:79](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/model/group.ts#L79)*

#### Parameters:

Name | Type |
------ | ------ |
`groupID` | number |

**Returns:** [Group](_src_controller_model_group_.group.md)

___

### create

▸ `Static`**create**(`groupID`: number): [Group](_src_controller_model_group_.group.md)

*Defined in [src/controller/model/group.ts:89](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/model/group.ts#L89)*

#### Parameters:

Name | Type |
------ | ------ |
`groupID` | number |

**Returns:** [Group](_src_controller_model_group_.group.md)

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
