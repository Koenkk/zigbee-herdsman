import * as Constants from "../../../src/adapter/z-stack/constants";

describe('zstack-constants', () => {
    it('Simple check', () => {
        expect(Constants.AF.DEFAULT_RADIUS).toBe(30);
    });

    it('Get channel mask 11', () => {
        expect(Constants.Utils.getChannelMask([11])).toStrictEqual([0, 8, 0, 0])
    });

    it('Get channel mask 25', () => {
        expect(Constants.Utils.getChannelMask([25])).toStrictEqual([0, 0, 0, 2])
    });

    it('Get channel mask 11 and 25', () => {
        expect(Constants.Utils.getChannelMask([11, 25])).toStrictEqual([0, 8, 0, 2])
    });
});