[zigbee-herdsman](../README.md) › ["src/controller/controller"](_src_controller_controller_.md)

# Module: "src/controller/controller"

## Index

### Classes

* [Controller](../classes/_src_controller_controller_.controller.md)

### Interfaces

* [Options](../interfaces/_src_controller_controller_.options.md)

### Object literals

* [DefaultOptions](_src_controller_controller_.md#const-defaultoptions)
* [debug](_src_controller_controller_.md#const-debug)

## Object literals

### `Const` DefaultOptions

### ▪ **DefaultOptions**: *object*

*Defined in [src/controller/controller.ts:34](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/controller.ts#L34)*

###  acceptJoiningDeviceHandler

• **acceptJoiningDeviceHandler**: *null* = null

*Defined in [src/controller/controller.ts:47](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/controller.ts#L47)*

###  adapter

• **adapter**: *null* = null

*Defined in [src/controller/controller.ts:46](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/controller.ts#L46)*

###  backupPath

• **backupPath**: *null* = null

*Defined in [src/controller/controller.ts:45](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/controller.ts#L45)*

###  databaseBackupPath

• **databaseBackupPath**: *null* = null

*Defined in [src/controller/controller.ts:44](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/controller.ts#L44)*

###  databasePath

• **databasePath**: *null* = null

*Defined in [src/controller/controller.ts:43](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/controller.ts#L43)*

###  serialPort

• **serialPort**: *object*

*Defined in [src/controller/controller.ts:42](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/controller.ts#L42)*

#### Type declaration:

▪ **network**: *object*

*Defined in [src/controller/controller.ts:35](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/controller.ts#L35)*

* **channelList**: *number[]* = [11]

* **extendedPanID**: *number[]* = [0xDD, 0xDD, 0xDD, 0xDD, 0xDD, 0xDD, 0xDD, 0xDD]

* **networkKey**: *number[]* = [0x01, 0x03, 0x05, 0x07, 0x09, 0x0B, 0x0D, 0x0F, 0x00, 0x02, 0x04, 0x06, 0x08, 0x0A, 0x0C, 0x0D]

* **networkKeyDistribute**: *false* = false

* **panID**: *number* = 6754

___

### `Const` debug

### ▪ **debug**: *object*

*Defined in [src/controller/controller.ts:50](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/controller.ts#L50)*

###  error

• **error**: *Debugger* = Debug('zigbee-herdsman:controller:error')

*Defined in [src/controller/controller.ts:51](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/controller.ts#L51)*

###  log

• **log**: *Debugger* = Debug('zigbee-herdsman:controller:log')

*Defined in [src/controller/controller.ts:52](https://github.com/Koenkk/zigbee-herdsman/blob/master/src/src/controller/controller.ts#L52)*
