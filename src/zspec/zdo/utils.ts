import {ClusterId} from './definition/clusters';
import {MACCapabilityFlags, ServerMask} from './definition/tstypes';

/**
 * Get a the response cluster ID corresponding to a request.
 * @param requestClusterId
 * @returns Response cluster ID or undefined if unknown/invalid
 */
export const getResponseClusterId = (requestClusterId: ClusterId): ClusterId | undefined => {
    if (0x8000 < requestClusterId || requestClusterId === ClusterId.END_DEVICE_ANNOUNCE) {
        return undefined;
    }

    const responseClusterId = requestClusterId + 0x8000;

    if (ClusterId[responseClusterId] == undefined) {
        return undefined;
    }

    return responseClusterId;
};

/**
 * Get the values for the bitmap `Mac Capability Flags Field` as per spec.
 * Given value is assumed to be a proper 1-byte length.
 * @param capabilities
 * @returns
 */
export const getMacCapFlags = (capabilities: number): MACCapabilityFlags => {
    return {
        alternatePANCoordinator: capabilities & 0x01,
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
        primaryTrustCenter: serverMask & 0x01,
        backupTrustCenter: (serverMask & 0x02) >> 1,
        deprecated1: (serverMask & 0x04) >> 2,
        deprecated2: (serverMask & 0x08) >> 3,
        deprecated3: (serverMask & 0x10) >> 4,
        deprecated4: (serverMask & 0x20) >> 5,
        networkManager: (serverMask & 0x40) >> 6,
        reserved1: (serverMask & 0x80) >> 7,
        reserved2: (serverMask & 0x100) >> 8,
        stackComplianceRevision: (serverMask & 0xfe00) >> 9,
    };
};

export const createServerMask = (serverMask: ServerMask): number => {
    return (
        (serverMask.primaryTrustCenter & 0x01) |
        ((serverMask.backupTrustCenter << 1) & 0x02) |
        ((serverMask.deprecated1 << 2) & 0x04) |
        ((serverMask.deprecated2 << 3) & 0x08) |
        ((serverMask.deprecated3 << 4) & 0x10) |
        ((serverMask.deprecated4 << 5) & 0x20) |
        ((serverMask.networkManager << 6) & 0x40) |
        ((serverMask.reserved1 << 7) & 0x80) |
        ((serverMask.reserved2 << 8) & 0x100) |
        ((serverMask.stackComplianceRevision << 9) & 0xfe00)
    );
};
