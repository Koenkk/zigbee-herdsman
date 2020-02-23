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

*Defined in [src/controller/events.ts:89](https://github.com/Koenkk/zigbee-herdsman/blob/610fe5a/src/controller/events.ts#L89)*

___

###  data

• **data**: *[KeyValue](_controller_tstype_.keyvalue.md) | Array‹string | number›*

*Defined in [src/controller/events.ts:90](https://github.com/Koenkk/zigbee-herdsman/blob/610fe5a/src/controller/events.ts#L90)*

___

###  device

• **device**: *[Device](../classes/_controller_model_device_.device.md)*

*Defined in [src/controller/events.ts:85](https://github.com/Koenkk/zigbee-herdsman/blob/610fe5a/src/controller/events.ts#L85)*

___

###  endpoint

• **endpoint**: *[Endpoint](../classes/_controller_model_endpoint_.endpoint.md)*

*Defined in [src/controller/events.ts:86](https://github.com/Koenkk/zigbee-herdsman/blob/610fe5a/src/controller/events.ts#L86)*

___

###  groupID

• **groupID**: *number*

*Defined in [src/controller/events.ts:88](https://github.com/Koenkk/zigbee-herdsman/blob/610fe5a/src/controller/events.ts#L88)*

___

###  linkquality

• **linkquality**: *number*

*Defined in [src/controller/events.ts:87](https://github.com/Koenkk/zigbee-herdsman/blob/610fe5a/src/controller/events.ts#L87)*

___

###  meta

• **meta**: *object*

*Defined in [src/controller/events.ts:91](https://github.com/Koenkk/zigbee-herdsman/blob/610fe5a/src/controller/events.ts#L91)*

#### Type declaration:

* **zclTransactionSequenceNumber**? : *number*

___

###  type

• **type**: *[MessagePayloadType](../modules/_controller_events_.md#messagepayloadtype)*

*Defined in [src/controller/events.ts:84](https://github.com/Koenkk/zigbee-herdsman/blob/610fe5a/src/controller/events.ts#L84)*
