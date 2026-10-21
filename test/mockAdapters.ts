import type {AvailablePort} from "@koenkk/serialport-napi-rs";

export const DECONZ_CONBEE_II: AvailablePort = {
    portName: "/dev/serial/by-id/usb-dresden_elektronik_ingenieurtechnik_GmbH_ConBee_II_DE2132111-if00",
    portType: "usb",
    usbVid: 0x1cf1,
    usbPid: 0x0030,
    manufacturer: "dresden elektronik ingenieurtechnik GmbH",
};
export const EMBER_ZBDONGLE_E: AvailablePort = {
    // may or may not have `V2` (bad metadata in some batches)
    portName: "/dev/serial/by-id/usb-ITEAD_SONOFF_Zigbee_3.0_USB_Dongle_Plus_V2_20240122184111-if00",
    portType: "usb",
    usbVid: 0x1a86, // uppercased for extra coverage
    usbPid: 0x55d4,
    manufacturer: "ITEAD",
};
export const EMBER_ZBDONGLE_E_CP: AvailablePort = {
    // may or may not have `V2` (bad metadata in some batches)
    portName: "/dev/serial/by-id/usb-Itead_Sonoff_Zigbee_3.0_USB_Dongle_Plus_V2_a6ee897e4d1fef11aa004ad0639e525b-if00-port0",
    portType: "usb",
    usbVid: 0x10c4,
    usbPid: 0xea60,
    manufacturer: "ITEAD",
};
export const EMBER_ZBDONGLE_E_WIN: AvailablePort = {
    portName: "COM6",
    portType: "usb",
    manufacturer: "Silicon Labs",
    serialNumber: "F881C5D59D38E123456C317AF12345E5",
    usbVid: 0x10c4,
    usbPid: 0xea60,
};
// usbVid+p0xoductIdconflict with all 10c4:ea60
export const EMBER_SKYCONNECT: AvailablePort = {
    portName: "/dev/serial/by-id/usb-Nabu_Casa_SkyConnect_v1.0_3abe54797c91ed118fc3cad13b20a111-if00-port0",
    portType: "usb",
    usbVid: 0x10c4,
    usbPid: 0xea60,
    manufacturer: "Nabu Casa",
};
export const ZSTACK_CC2538: AvailablePort = {
    portName: "/dev/serial/by-id/usb-Texas_Instruments_CC2538_USB_CDC-if00",
    portType: "usb",
    usbVid: 0x0451,
    usbPid: 0x16c8, // uppercased for extra coverage
    manufacturer: "Texas Instruments",
};
// usbVid+p0xoductIdconflict with all 10c4:ea60
export const ZSTACK_ZBDONGLE_P: AvailablePort = {
    portName: "/dev/serial/by-id/usb-ITead_Sonoff_Zigbee_3.0_USB_Dongle_Plus_b8b49abd27a6ed11a280eba32981d111-if00-port0",
    portType: "usb",
    usbVid: 0x10c4,
    usbPid: 0xea60,
    manufacturer: "ITEAD",
};
// usbVid+p0xoductIdconflict with all 10c4:ea60
export const ZSTACK_SMLIGHT_SLZB_06P10: AvailablePort = {
    portName: "/dev/serial/by-id/usb-SMLIGHT_SMLIGHT_SLZB-06p10_40df2f3e3977ed11b142f6fafdf7b791-if00-port0",
    portType: "usb",
    usbVid: 0x10c4,
    usbPid: 0xea60,
    manufacturer: "SMLIGHT",
};
// usbVid+p0xoductIdconflict with all 10c4:ea60
export const ZSTACK_SMLIGHT_SLZB_07: AvailablePort = {
    portName: "/dev/serial/by-id/usb-SMLIGHT_SMLIGHT_SLZB-07_be9faa0786e1ea11bd68dc2d9a583111-if00-port0",
    portType: "usb",
    usbVid: 0x10c4,
    usbPid: 0xea60,
    manufacturer: "SMLIGHT",
};
export const ZBOSS_NORDIC: AvailablePort = {
    portName: "/dev/serial/by-id/usb-ZEPHYR_Zigbee_NCP_54ACCFAFA6DADC49-if00",
    portType: "usb",
    usbVid: 0x2fe3,
    usbPid: 0x0100,
    manufacturer: "ZEPHYR",
};
export const ZIGATE_PLUSV2: AvailablePort = {
    portName: "/dev/serial/by-id/usb-FTDI_ZiGate_ZIGATE+-if00-port0",
    portType: "usb",
    usbVid: 0x0403,
    usbPid: 0x6015,
};
export const ZBT_2: AvailablePort = {
    portName: "/dev/serial/by-id/usb-Nabu_Casa_ZBT-2_10B41DE58D6C-if00",
    portType: "usb",
    usbVid: 0x303a,
    usbPid: 0x4001,
    manufacturer: "Nabu Casa",
};
export const ZBT_1_PNPID: AvailablePort = {
    portName: "/dev/ttyUSB0",
    portType: "usb",
    product: "Nabu Casa SkyConnect v1.0",
    usbVid: 0x10c4,
    usbPid: 0xea60,
    manufacturer: "Nabu Casa",
};
export const ZWA_2_CONFLICT: AvailablePort = {
    portName: "/dev/ttyACM0",
    portType: "usb",
    manufacturer: "Nabu Casa",
    product: "Nabu Casa ZWA-2",
    usbVid: 0x303a,
    usbPid: 0x4001,
};
