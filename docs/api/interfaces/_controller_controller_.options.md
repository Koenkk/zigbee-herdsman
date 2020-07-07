[zigbee-herdsman](../README.md) › ["controller/controller"](../modules/_controller_controller_.md) › [Options](_controller_controller_.options.md)

# Interface: Options

## Hierarchy

* **Options**

## Index

### Properties

* [acceptJoiningDeviceHandler](_controller_controller_.options.md#acceptjoiningdevicehandler)
* [adapter](_controller_controller_.options.md#adapter)
* [backupPath](_controller_controller_.options.md#backuppath)
* [databaseBackupPath](_controller_controller_.options.md#databasebackuppath)
* [databasePath](_controller_controller_.options.md#databasepath)
* [network](_controller_controller_.options.md#network)
* [serialPort](_controller_controller_.options.md#serialport)

## Properties

###  acceptJoiningDeviceHandler

• **acceptJoiningDeviceHandler**: *function*

*Defined in [src/controller/controller.ts:30](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/controller.ts#L30)*

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

###  adapter

• **adapter**: *[AdapterOptions](_adapter_tstype_.adapteroptions.md)*

*Defined in [src/controller/controller.ts:24](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/controller.ts#L24)*

___

###  backupPath

• **backupPath**: *string*

*Defined in [src/controller/controller.ts:23](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/controller.ts#L23)*

___

###  databaseBackupPath

• **databaseBackupPath**: *string*

*Defined in [src/controller/controller.ts:22](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/controller.ts#L22)*

___

###  databasePath

• **databasePath**: *string*

*Defined in [src/controller/controller.ts:21](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/controller.ts#L21)*

___

###  network

• **network**: *[NetworkOptions](_adapter_tstype_.networkoptions.md)*

*Defined in [src/controller/controller.ts:19](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/controller.ts#L19)*

___

###  serialPort

• **serialPort**: *[SerialPortOptions](_adapter_tstype_.serialportoptions.md)*

*Defined in [src/controller/controller.ts:20](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/controller.ts#L20)*
