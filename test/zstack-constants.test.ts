import * as ZSC from "../src/zstack-constants";

describe('zstack-constants', () => {
    it('dummy', () => {
        // Otherwise code coverage is not measured
        expect(ZSC.AF.DEFAULT_RADIUS).toBe(30);
    });
});