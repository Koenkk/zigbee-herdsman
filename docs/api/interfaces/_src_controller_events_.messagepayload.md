[zigbee-herdsman](../README.md) › ["src/controller/events"](../modules/_src_controller_events_.md) › [MessagePayload](_src_controller_events_.messagepayload.md)

# Interface: MessagePayload

## Hierarchy

* **MessagePayload**

## Index

### Properties

* [cluster](_src_controller_events_.messagepayload.md#cluster)
* [data](_src_controller_events_.messagepayload.md#data)
* [device](_src_controller_events_.messagepayload.md#device)
* [endpoint](_src_controller_events_.messagepayload.md#endpoint)
* [groupID](_src_controller_events_.messagepayload.md#groupid)
* [linkquality](_src_controller_events_.messagepayload.md#linkquality)
* [meta](_src_controller_events_.messagepayload.md#meta)
* [type](_src_controller_events_.messagepayload.md#type)

## Properties

###  cluster

• **cluster**: *string | number*

*Defined in [src/controller/events.ts:98](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/events.ts#L98)*

___

###  data

• **data**: *[KeyValue](_src_controller_tstype_.keyvalue.md) | Array‹string | number›*

*Defined in [src/controller/events.ts:99](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/events.ts#L99)*

___

###  device

• **device**: *[Device](../classes/_src_controller_model_device_.device.md)*

*Defined in [src/controller/events.ts:94](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/events.ts#L94)*

___

###  endpoint

• **endpoint**: *[Endpoint](../classes/_src_controller_model_endpoint_.endpoint.md)*

*Defined in [src/controller/events.ts:95](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/events.ts#L95)*

___

###  groupID

• **groupID**: *number*

*Defined in [src/controller/events.ts:97](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/events.ts#L97)*

___

###  linkquality

• **linkquality**: *number*

*Defined in [src/controller/events.ts:96](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/events.ts#L96)*

___

###  meta

• **meta**: *object*

*Defined in [src/controller/events.ts:100](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/events.ts#L100)*

#### Type declaration:

* **zclTransactionSequenceNumber**? : *number*

___

###  type

• **type**: *[MessagePayloadType](../modules/_src_controller_events_.md#messagepayloadtype)*

*Defined in [src/controller/events.ts:93](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/events.ts#L93)*
