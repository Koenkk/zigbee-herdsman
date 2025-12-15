export const DECONZ_CONBEE_II = {
    path: "/dev/serial/by-id/usb-dresden_elektronik_ingenieurtechnik_GmbH_ConBee_II_DE2132111-if00",
    vendorId: "1cf1",
    productId: "0030",
    manufacturer: "dresden elektronik ingenieurtechnik GmbH",
};
export const EMBER_ZBDONGLE_E = {
    // may or may not have `V2` (bad metadata in some batches)
    path: "/dev/serial/by-id/usb-ITEAD_SONOFF_Zigbee_3.0_USB_Dongle_Plus_V2_20240122184111-if00",
    vendorId: "1A86", // uppercased for extra coverage
    productId: "55d4",
    manufacturer: "ITEAD",
};
export const EMBER_ZBDONGLE_E_CP = {
    // may or may not have `V2` (bad metadata in some batches)
    path: "/dev/serial/by-id/usb-Itead_Sonoff_Zigbee_3.0_USB_Dongle_Plus_V2_a6ee897e4d1fef11aa004ad0639e525b-if00-port0",
    vendorId: "10c4",
    productId: "ea60",
    manufacturer: "ITEAD",
};
export const EMBER_ZBDONGLE_E_WIN = {
    path: "COM6",
    manufacturer: "Silicon Labs",
    serialNumber: "F881C5D59D38E123456C317AF12345E5",
    pnpId: "USB\\VID_10C4&PID_EA60\\F881C5D59D38E123456C317AF12345E5",
    locationId: "Port_#0008.Hub_#0002",
    friendlyName: "Silicon Labs CP210x USB to UART Bridge (COM6)",
    vendorId: "10C4",
    productId: "EA60",
};
// vendorId+productId conflict with all 10c4:ea60
export const EMBER_SKYCONNECT = {
    path: "/dev/serial/by-id/usb-Nabu_Casa_SkyConnect_v1.0_3abe54797c91ed118fc3cad13b20a111-if00-port0",
    vendorId: "10c4",
    productId: "ea60",
    manufacturer: "Nabu Casa",
};
export const ZSTACK_CC2538 = {
    path: "/dev/serial/by-id/usb-Texas_Instruments_CC2538_USB_CDC-if00",
    vendorId: "0451",
    productId: "16C8", // uppercased for extra coverage
    manufacturer: "Texas Instruments",
};
// vendorId+productId conflict with all 10c4:ea60
export const ZSTACK_ZBDONGLE_P = {
    path: "/dev/serial/by-id/usb-ITead_Sonoff_Zigbee_3.0_USB_Dongle_Plus_b8b49abd27a6ed11a280eba32981d111-if00-port0",
    vendorId: "10c4",
    productId: "ea60",
    manufacturer: "ITEAD",
};
// vendorId+productId conflict with all 10c4:ea60
export const ZSTACK_SMLIGHT_SLZB_06P10 = {
    path: "/dev/serial/by-id/usb-SMLIGHT_SMLIGHT_SLZB-06p10_40df2f3e3977ed11b142f6fafdf7b791-if00-port0",
    vendorId: "10c4",
    productId: "ea60",
    manufacturer: "SMLIGHT",
};
// vendorId+productId conflict with all 10c4:ea60
export const ZSTACK_SMLIGHT_SLZB_07 = {
    path: "/dev/serial/by-id/usb-SMLIGHT_SMLIGHT_SLZB-07_be9faa0786e1ea11bd68dc2d9a583111-if00-port0",
    vendorId: "10c4",
    productId: "ea60",
    manufacturer: "SMLIGHT",
};
export const ZBOSS_NORDIC = {
    path: "/dev/serial/by-id/usb-ZEPHYR_Zigbee_NCP_54ACCFAFA6DADC49-if00",
    vendorId: "2fe3",
    productId: "0100",
    manufacturer: "ZEPHYR",
};
export const ZIGATE_PLUSV2 = {
    path: "/dev/serial/by-id/usb-FTDI_ZiGate_ZIGATE+-if00-port0",
    vendorId: "0403",
    productId: "6015",
};
export const ZBT_2 = {
    path: "/dev/serial/by-id/usb-Nabu_Casa_ZBT-2_10B41DE58D6C-if00",
    vendorId: "303a",
    productId: "4001",
    manufacturer: "Nabu Casa",
};
export const ZBT_1_PNPID = {
    path: "/dev/ttyUSB0",
    pnpId: "usb-Nabu_Casa_SkyConnect_v1.0_92390c41b6d8ed11a3436b6142c613ac-if00-port0",
    vendorId: "10c4",
    productId: "ea60",
    manufacturer: "Nabu Casa",
};
export const ZWA_2_CONFLICT = {
    path: "/dev/ttyACM0",
    manufacturer: "Nabu Casa",
    pnpId: "usb-Nabu_Casa_ZWA-2_81B53EF0C8EC-if00",
    vendorId: "303a",
    productId: "4001",
};
