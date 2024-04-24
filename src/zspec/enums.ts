/**
 * ZigBee Broadcast Addresses
 * 
 * ZigBee specifies three different broadcast addresses that reach different collections of nodes.
 * Broadcasts are normally sent only to routers.
 * Broadcasts can also be forwarded to end devices, either all of them or only those that do not sleep.
 * Broadcasting to end devices is both significantly more resource-intensive and significantly less reliable than broadcasting to routers.
 */
export enum BroadcastAddress {
    /** Broadcast to all routers. */
    DEFAULT = 0xFFFC,
    /** Broadcast to all non-sleepy devices. */
    RX_ON_WHEN_IDLE = 0xFFFD,
    /** Broadcast to all devices, including sleepy end devices. */
    SLEEPY = 0xFFFF,
};
