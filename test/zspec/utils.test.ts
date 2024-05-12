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
});
