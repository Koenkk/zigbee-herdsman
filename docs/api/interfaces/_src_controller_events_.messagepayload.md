**zigbee-herdsman**

> [Globals](../README.md) / ["src/controller/events"](../modules/_src_controller_events_.md) / MessagePayload

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

### cluster

•  **cluster**: string \| number

*Defined in [src/controller/events.ts:114](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/events.ts#L114)*

___

### data

•  **data**: [KeyValue](_src_controller_tstype_.keyvalue.md) \| Array\<string \| number>

*Defined in [src/controller/events.ts:115](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/events.ts#L115)*

___

### device

•  **device**: [Device](../classes/_src_controller_model_device_.device.md)

*Defined in [src/controller/events.ts:110](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/events.ts#L110)*

___

### endpoint

•  **endpoint**: [Endpoint](../classes/_src_controller_model_endpoint_.endpoint.md)

*Defined in [src/controller/events.ts:111](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/events.ts#L111)*

___

### groupID

•  **groupID**: number

*Defined in [src/controller/events.ts:113](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/events.ts#L113)*

___

### linkquality

•  **linkquality**: number

*Defined in [src/controller/events.ts:112](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/events.ts#L112)*

___

### meta

•  **meta**: { zclTransactionSequenceNumber?: number  }

*Defined in [src/controller/events.ts:116](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/events.ts#L116)*

#### Type declaration:

Name | Type |
------ | ------ |
`zclTransactionSequenceNumber?` | number |

___

### type

•  **type**: [MessagePayloadType](../modules/_src_controller_events_.md#messagepayloadtype)

*Defined in [src/controller/events.ts:109](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/events.ts#L109)*
