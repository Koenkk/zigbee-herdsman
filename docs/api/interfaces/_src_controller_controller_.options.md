**[zigbee-herdsman](../README.md)**

> [Globals](../README.md) / ["src/controller/controller"](../modules/_src_controller_controller_.md) / Options

# Interface: Options

## Hierarchy

* **Options**

## Index

### Properties

* [acceptJoiningDeviceHandler](_src_controller_controller_.options.md#acceptjoiningdevicehandler)
* [adapter](_src_controller_controller_.options.md#adapter)
* [backupPath](_src_controller_controller_.options.md#backuppath)
* [databaseBackupPath](_src_controller_controller_.options.md#databasebackuppath)
* [databasePath](_src_controller_controller_.options.md#databasepath)
* [network](_src_controller_controller_.options.md#network)
* [serialPort](_src_controller_controller_.options.md#serialport)

## Properties

### acceptJoiningDeviceHandler

•  **acceptJoiningDeviceHandler**: (ieeeAddr: string) => Promise\<boolean>

*Defined in [src/controller/controller.ts:31](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/controller.ts#L31)*

This lambda can be used by an application to explictly reject or accept an incoming device.
When false is returned zigbee-herdsman will not start the interview process and immidiately
try to remove the device from the network.

___

### adapter

•  **adapter**: [AdapterOptions](_src_adapter_tstype_.adapteroptions.md)

*Defined in [src/controller/controller.ts:25](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/controller.ts#L25)*

___

### backupPath

•  **backupPath**: string

*Defined in [src/controller/controller.ts:24](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/controller.ts#L24)*

___

### databaseBackupPath

•  **databaseBackupPath**: string

*Defined in [src/controller/controller.ts:23](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/controller.ts#L23)*

___

### databasePath

•  **databasePath**: string

*Defined in [src/controller/controller.ts:22](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/controller.ts#L22)*

___

### network

•  **network**: [NetworkOptions](_src_adapter_tstype_.networkoptions.md)

*Defined in [src/controller/controller.ts:20](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/controller.ts#L20)*

___

### serialPort

•  **serialPort**: [SerialPortOptions](_src_adapter_tstype_.serialportoptions.md)

*Defined in [src/controller/controller.ts:21](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/controller.ts#L21)*
