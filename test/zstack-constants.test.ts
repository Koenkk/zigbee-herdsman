import * as Zsc from "../src/zstack-constants";

describe('zstack-constants', () => {
    it('dummy', () => {
        // Otherwise code coverage is not measured
        expect(Zsc.AF.DEFAULT_RADIUS).toBe(30);
    });
});