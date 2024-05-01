import {MACCapabilityFlags, ServerMask} from './definition/tstypes';

/**
 * Get the values for the bitmap `Mac Capability Flags Field` as per spec.
 * Given value is assumed to be a proper 1-byte length.
 * @param capabilities 
 * @returns 
 */
export const getMacCapFlags = (capabilities: number): MACCapabilityFlags => {
    return {
        alternatePANCoordinator: (capabilities & 0x01),
        deviceType: (capabilities & 0x02) >> 1,
        powerSource: (capabilities & 0x04) >> 2,
        rxOnWhenIdle: (capabilities & 0x08) >> 3,
        reserved1: (capabilities & 0x10) >> 4,
        reserved2: (capabilities & 0x20) >> 5,
        securityCapability: (capabilities & 0x40) >> 6,
        allocateAddress: (capabilities & 0x80) >> 7,
    };
};


/**
 * Get the values for the bitmap `Server Mask Field` as per spec.
 * Given value is assumed to be a proper 2-byte length.
 * @param serverMask 
 * @returns 
 */
export const getServerMask = (serverMask: number): ServerMask => {
    return {
        primaryTrustCenter: (serverMask & 0x01),
        backupTrustCenter: (serverMask & 0x02) >> 1,
        deprecated1: (serverMask & 0x04) >> 2,
        deprecated2: (serverMask & 0x08) >> 3,
        deprecated3: (serverMask & 0x10) >> 4,
        deprecated4: (serverMask & 0x20) >> 5,
        networkManager: (serverMask & 0x40) >> 6,
        reserved1: (serverMask & 0x80) >> 7,
        reserved2: (serverMask & 0x0100) >> 8,
        stackComplianceResivion: (serverMask & 0xFE00) >> 9,
    };
};
