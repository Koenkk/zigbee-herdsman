import * as Zdo from '../../../src/zspec/zdo';

describe('ZDO Utils', () => {
    it('Creates status error', () => {
        const zdoError = new Zdo.StatusError(Zdo.Status.INVALID_INDEX);

        expect(zdoError).toBeInstanceOf(Zdo.StatusError);
        expect(zdoError.code).toStrictEqual(Zdo.Status.INVALID_INDEX);
        expect(zdoError.message).toStrictEqual(`Status '${Zdo.Status[Zdo.Status.INVALID_INDEX]}'`);
    });

    it.each([
        [Zdo.ClusterId.ACTIVE_ENDPOINTS_REQUEST, Zdo.ClusterId.ACTIVE_ENDPOINTS_RESPONSE],
        [Zdo.ClusterId.BINDING_TABLE_REQUEST, Zdo.ClusterId.BINDING_TABLE_RESPONSE],
        [Zdo.ClusterId.CHALLENGE_REQUEST, Zdo.ClusterId.CHALLENGE_RESPONSE],
        [Zdo.ClusterId.NODE_DESCRIPTOR_REQUEST, Zdo.ClusterId.NODE_DESCRIPTOR_RESPONSE],
        [Zdo.ClusterId.NETWORK_ADDRESS_REQUEST, Zdo.ClusterId.NETWORK_ADDRESS_RESPONSE],
        [Zdo.ClusterId.END_DEVICE_ANNOUNCE, undefined], // not a request
        [Zdo.ClusterId.NWK_UNSOLICITED_ENHANCED_UPDATE_RESPONSE, undefined],
        [Zdo.ClusterId.ACTIVE_ENDPOINTS_RESPONSE, undefined],
        [Zdo.ClusterId.CHALLENGE_RESPONSE, undefined],
        [0x7999, undefined],
    ])('Gets response cluster ID for request %s', (request, response) => {
        expect(Zdo.Utils.getResponseClusterId(request)).toStrictEqual(response);
    });

    it.each([
        [
            0,
            {
                alternatePANCoordinator: 0,
                deviceType: 0,
                powerSource: 0,
                rxOnWhenIdle: 0,
                reserved1: 0,
                reserved2: 0,
                securityCapability: 0,
                allocateAddress: 0,
            },
        ],
        [
            0b00000001,
            {
                alternatePANCoordinator: 1,
                deviceType: 0,
                powerSource: 0,
                rxOnWhenIdle: 0,
                reserved1: 0,
                reserved2: 0,
                securityCapability: 0,
                allocateAddress: 0,
            },
        ],
        [
            0b00000010,
            {
                alternatePANCoordinator: 0,
                deviceType: 1,
                powerSource: 0,
                rxOnWhenIdle: 0,
                reserved1: 0,
                reserved2: 0,
                securityCapability: 0,
                allocateAddress: 0,
            },
        ],
        [
            0b00000100,
            {
                alternatePANCoordinator: 0,
                deviceType: 0,
                powerSource: 1,
                rxOnWhenIdle: 0,
                reserved1: 0,
                reserved2: 0,
                securityCapability: 0,
                allocateAddress: 0,
            },
        ],
        [
            0b00001000,
            {
                alternatePANCoordinator: 0,
                deviceType: 0,
                powerSource: 0,
                rxOnWhenIdle: 1,
                reserved1: 0,
                reserved2: 0,
                securityCapability: 0,
                allocateAddress: 0,
            },
        ],
        [
            0b00010000,
            {
                alternatePANCoordinator: 0,
                deviceType: 0,
                powerSource: 0,
                rxOnWhenIdle: 0,
                reserved1: 1,
                reserved2: 0,
                securityCapability: 0,
                allocateAddress: 0,
            },
        ],
        [
            0b00100000,
            {
                alternatePANCoordinator: 0,
                deviceType: 0,
                powerSource: 0,
                rxOnWhenIdle: 0,
                reserved1: 0,
                reserved2: 1,
                securityCapability: 0,
                allocateAddress: 0,
            },
        ],
        [
            0b01000000,
            {
                alternatePANCoordinator: 0,
                deviceType: 0,
                powerSource: 0,
                rxOnWhenIdle: 0,
                reserved1: 0,
                reserved2: 0,
                securityCapability: 1,
                allocateAddress: 0,
            },
        ],
        [
            0b10000000,
            {
                alternatePANCoordinator: 0,
                deviceType: 0,
                powerSource: 0,
                rxOnWhenIdle: 0,
                reserved1: 0,
                reserved2: 0,
                securityCapability: 0,
                allocateAddress: 1,
            },
        ],
        [
            0b10101011,
            {
                alternatePANCoordinator: 1,
                deviceType: 1,
                powerSource: 0,
                rxOnWhenIdle: 1,
                reserved1: 0,
                reserved2: 1,
                securityCapability: 0,
                allocateAddress: 1,
            },
        ],
        [
            0b11111111,
            {
                alternatePANCoordinator: 1,
                deviceType: 1,
                powerSource: 1,
                rxOnWhenIdle: 1,
                reserved1: 1,
                reserved2: 1,
                securityCapability: 1,
                allocateAddress: 1,
            },
        ],
    ])('Gets MAC capabilities flags for %s', (value, expected) => {
        expect(Zdo.Utils.getMacCapFlags(value)).toStrictEqual(expected);
    });

    it.each([
        [
            0,
            {
                primaryTrustCenter: 0,
                backupTrustCenter: 0,
                deprecated1: 0,
                deprecated2: 0,
                deprecated3: 0,
                deprecated4: 0,
                networkManager: 0,
                reserved1: 0,
                reserved2: 0,
                stackComplianceRevision: 0,
            },
        ],
        [
            0b0000000000000001,
            {
                primaryTrustCenter: 1,
                backupTrustCenter: 0,
                deprecated1: 0,
                deprecated2: 0,
                deprecated3: 0,
                deprecated4: 0,
                networkManager: 0,
                reserved1: 0,
                reserved2: 0,
                stackComplianceRevision: 0,
            },
        ],
        [
            0b0010111001000001,
            {
                primaryTrustCenter: 1,
                backupTrustCenter: 0,
                deprecated1: 0,
                deprecated2: 0,
                deprecated3: 0,
                deprecated4: 0,
                networkManager: 1,
                reserved1: 0,
                reserved2: 0,
                stackComplianceRevision: 23,
            },
        ],
        [
            0b0010101001000010,
            {
                primaryTrustCenter: 0,
                backupTrustCenter: 1,
                deprecated1: 0,
                deprecated2: 0,
                deprecated3: 0,
                deprecated4: 0,
                networkManager: 1,
                reserved1: 0,
                reserved2: 0,
                stackComplianceRevision: 21,
            },
        ],
    ])('Gets & Creates server mask for %s', (value, expected) => {
        expect(Zdo.Utils.getServerMask(value)).toStrictEqual(expected);
        expect(Zdo.Utils.createServerMask(expected)).toStrictEqual(value);
    });
});
