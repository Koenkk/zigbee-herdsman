import * as ZSpec from '../../src/zspec';

describe('ZSpec Utils', () => {
    it('Converts channels number array to uint32 mask', () => {
        expect(ZSpec.Utils.channelsToUInt32Mask(ZSpec.ALL_802_15_4_CHANNELS)).toStrictEqual(ZSpec.ALL_802_15_4_CHANNELS_MASK);
        expect(ZSpec.Utils.channelsToUInt32Mask(ZSpec.PREFERRED_802_15_4_CHANNELS)).toStrictEqual(ZSpec.PREFERRED_802_15_4_CHANNELS_MASK);
    });

    it('Converts channels uint32 mask to number array', () => {
        expect(ZSpec.Utils.uint32MaskToChannels(ZSpec.ALL_802_15_4_CHANNELS_MASK)).toStrictEqual(ZSpec.ALL_802_15_4_CHANNELS);
        expect(ZSpec.Utils.uint32MaskToChannels(ZSpec.PREFERRED_802_15_4_CHANNELS_MASK)).toStrictEqual(ZSpec.PREFERRED_802_15_4_CHANNELS);
    });

    it('Checks if address is broadcast', () => {
        expect(ZSpec.Utils.isBroadcastAddress(ZSpec.BroadcastAddress.DEFAULT)).toBeTruthy();
        expect(ZSpec.Utils.isBroadcastAddress(ZSpec.BroadcastAddress.RX_ON_WHEN_IDLE)).toBeTruthy();
        expect(ZSpec.Utils.isBroadcastAddress(ZSpec.BroadcastAddress.SLEEPY)).toBeTruthy();
        expect(ZSpec.Utils.isBroadcastAddress(ZSpec.BroadcastAddress.LOW_POWER_ROUTERS)).toBeTruthy();
        expect(ZSpec.Utils.isBroadcastAddress(0x0f30)).toBeFalsy();
    });

    it('Converts EUI64 LE buffer to 0x...', () => {
        const buffer = Buffer.from([0x88, 0x77, 0x66, 0x55, 0x44, 0x33, 0x22, 0x11]);

        expect(ZSpec.Utils.eui64LEBufferToHex(buffer)).toStrictEqual(`0x1122334455667788`);
        // reference not reversed
        expect(buffer.toString('hex')).toStrictEqual(`8877665544332211`);
    });

    it('Converts EUI64 BE buffer to 0x...', () => {
        const buffer = Buffer.from([0x88, 0x77, 0x66, 0x55, 0x44, 0x33, 0x22, 0x11]);

        expect(ZSpec.Utils.eui64BEBufferToHex(buffer)).toStrictEqual(`0x8877665544332211`);
    });
});
