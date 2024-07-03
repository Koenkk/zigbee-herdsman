/**
 * ZigBee Broadcast Addresses
 *
 * ZigBee specifies three different broadcast addresses that reach different collections of nodes.
 * Broadcasts are normally sent only to routers.
 * Broadcasts can also be forwarded to end devices, either all of them or only those that do not sleep.
 * Broadcasting to end devices is both significantly more resource-intensive and significantly less reliable than broadcasting to routers.
 */
export enum BroadcastAddress {
    // Reserved = 0xfff8,
    // Reserved = 0xfff9,
    // Reserved = 0xfffa,
    /** Low power routers only */
    LOW_POWER_ROUTERS = 0xfffb,
    /** All routers and coordinator */
    DEFAULT = 0xfffc,
    /** macRxOnWhenIdle = TRUE (all non-sleepy devices) */
    RX_ON_WHEN_IDLE = 0xfffd,
    // Reserved = 0xFFFE,
    /** All devices in PAN (including sleepy end devices) */
    SLEEPY = 0xffff,
}
