[zigbee-herdsman](../README.md) › ["controller/events"](../modules/_controller_events_.md) › [MessagePayload](_controller_events_.messagepayload.md)

# Interface: MessagePayload

## Hierarchy

* **MessagePayload**

## Index

### Properties

* [cluster](_controller_events_.messagepayload.md#cluster)
* [data](_controller_events_.messagepayload.md#data)
* [device](_controller_events_.messagepayload.md#device)
* [endpoint](_controller_events_.messagepayload.md#endpoint)
* [groupID](_controller_events_.messagepayload.md#groupid)
* [linkquality](_controller_events_.messagepayload.md#linkquality)
* [meta](_controller_events_.messagepayload.md#meta)
* [type](_controller_events_.messagepayload.md#type)

## Properties

###  cluster

• **cluster**: *string | number*

*Defined in [src/controller/events.ts:95](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/events.ts#L95)*

___

###  data

• **data**: *[KeyValue](_controller_tstype_.keyvalue.md) | Array‹string | number›*

*Defined in [src/controller/events.ts:96](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/events.ts#L96)*

___

###  device

• **device**: *[Device](../classes/_controller_model_device_.device.md)*

*Defined in [src/controller/events.ts:91](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/events.ts#L91)*

___

###  endpoint

• **endpoint**: *[Endpoint](../classes/_controller_model_endpoint_.endpoint.md)*

*Defined in [src/controller/events.ts:92](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/events.ts#L92)*

___

###  groupID

• **groupID**: *number*

*Defined in [src/controller/events.ts:94](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/events.ts#L94)*

___

###  linkquality

• **linkquality**: *number*

*Defined in [src/controller/events.ts:93](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/events.ts#L93)*

___

###  meta

• **meta**: *object*

*Defined in [src/controller/events.ts:97](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/events.ts#L97)*

#### Type declaration:

* **zclTransactionSequenceNumber**? : *number*

___

###  type

• **type**: *[MessagePayloadType](../modules/_controller_events_.md#messagepayloadtype)*

*Defined in [src/controller/events.ts:90](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/events.ts#L90)*
