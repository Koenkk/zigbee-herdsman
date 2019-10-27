[zigbee-herdsman](../README.md) › ["controller/controller"](../modules/_controller_controller_.md) › [Options](_controller_controller_.options.md)

# Interface: Options

## Hierarchy

* **Options**

## Index

### Properties

* [acceptJoiningDeviceHandler](_controller_controller_.options.md#acceptjoiningdevicehandler)
* [backupPath](_controller_controller_.options.md#backuppath)
* [databasePath](_controller_controller_.options.md#databasepath)
* [network](_controller_controller_.options.md#network)
* [serialPort](_controller_controller_.options.md#serialport)

## Properties

###  acceptJoiningDeviceHandler

• **acceptJoiningDeviceHandler**: *function*

*Defined in [controller/controller.ts:26](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/controller.ts#L26)*

This lambda can be used by an application to explictly reject or accept an incoming device.
When false is returned zigbee-herdsman will not start the interview process and immidiately
try to remove the device from the network.

#### Type declaration:

▸ (`ieeeAddr`: string): *Promise‹boolean›*

**Parameters:**

Name | Type |
------ | ------ |
`ieeeAddr` | string |

___

###  backupPath

• **backupPath**: *string*

*Defined in [controller/controller.ts:20](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/controller.ts#L20)*

___

###  databasePath

• **databasePath**: *string*

*Defined in [controller/controller.ts:19](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/controller.ts#L19)*

___

###  network

• **network**: *[NetworkOptions](_adapter_tstype_.networkoptions.md)*

*Defined in [controller/controller.ts:17](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/controller.ts#L17)*

___

###  serialPort

• **serialPort**: *[SerialPortOptions](_adapter_tstype_.serialportoptions.md)*

*Defined in [controller/controller.ts:18](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/controller/controller.ts#L18)*
