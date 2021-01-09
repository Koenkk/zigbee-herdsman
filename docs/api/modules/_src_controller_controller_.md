**[zigbee-herdsman](../README.md)**

> [Globals](../README.md) / "src/controller/controller"

# Module: "src/controller/controller"

## Index

### Classes

* [Controller](../classes/_src_controller_controller_.controller.md)

### Interfaces

* [Options](../interfaces/_src_controller_controller_.options.md)

### Object literals

* [DefaultOptions](_src_controller_controller_.md#defaultoptions)
* [debug](_src_controller_controller_.md#debug)

## Object literals

### DefaultOptions

▪ `Const` **DefaultOptions**: object

*Defined in [src/controller/controller.ts:34](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/controller.ts#L34)*

#### Properties:

Name | Type | Value |
------ | ------ | ------ |
`acceptJoiningDeviceHandler` | null | null |
`adapter` | null | null |
`backupPath` | null | null |
`databaseBackupPath` | null | null |
`databasePath` | null | null |
`serialPort` | object | {} |
`network` | object | { channelList: number[] = [11]; extendedPanID: number[] = [0xDD, 0xDD, 0xDD, 0xDD, 0xDD, 0xDD, 0xDD, 0xDD]; networkKey: number[] = [0x01, 0x03, 0x05, 0x07, 0x09, 0x0B, 0x0D, 0x0F, 0x00, 0x02, 0x04, 0x06, 0x08, 0x0A, 0x0C, 0x0D]; networkKeyDistribute: false = false; panID: number = 6754 } |

___

### debug

▪ `Const` **debug**: object

*Defined in [src/controller/controller.ts:50](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/controller.ts#L50)*

#### Properties:

Name | Type | Value |
------ | ------ | ------ |
`error` | Debugger | Debug('zigbee-herdsman:controller:error') |
`log` | Debugger | Debug('zigbee-herdsman:controller:log') |
