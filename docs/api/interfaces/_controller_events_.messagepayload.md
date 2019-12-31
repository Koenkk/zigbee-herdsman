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

*Defined in [controller/events.ts:85](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/events.ts#L85)*

___

###  data

• **data**: *[KeyValue](_controller_tstype_.keyvalue.md) | Array‹string | number›*

*Defined in [controller/events.ts:86](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/events.ts#L86)*

___

###  device

• **device**: *[Device](../classes/_controller_model_device_.device.md)*

*Defined in [controller/events.ts:81](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/events.ts#L81)*

___

###  endpoint

• **endpoint**: *[Endpoint](../classes/_controller_model_endpoint_.endpoint.md)*

*Defined in [controller/events.ts:82](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/events.ts#L82)*

___

###  groupID

• **groupID**: *number*

*Defined in [controller/events.ts:84](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/events.ts#L84)*

___

###  linkquality

• **linkquality**: *number*

*Defined in [controller/events.ts:83](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/events.ts#L83)*

___

###  meta

• **meta**: *object*

*Defined in [controller/events.ts:87](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/events.ts#L87)*

#### Type declaration:

* **zclTransactionSequenceNumber**? : *number*

___

###  type

• **type**: *[MessagePayloadType](../modules/_controller_events_.md#messagepayloadtype)*

*Defined in [controller/events.ts:80](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/events.ts#L80)*
