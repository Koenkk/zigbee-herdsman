import "regenerator-runtime/runtime";
import {IsNumberArray, Wait} from '../src/utils';

describe('Utils', () => {
    it('IsNumberArray valid', () => {
        expect(IsNumberArray([1,2,3])).toBeTruthy();
    });

    it('IsNumberArray invalid (partial)', () => {
        expect(IsNumberArray([1,2,'3'])).toBeFalsy();
    });

    it('IsNumberArray with non array type', () => {
        expect(IsNumberArray('nonarray')).toBeFalsy();
    });

    it('Test wait', async () => {
        jest.useFakeTimers();
        Wait(1000).then(() => {});
        expect(setTimeout).toHaveBeenCalledTimes(1);
        expect(setTimeout).toHaveBeenLastCalledWith(expect.any(Function), 1000);
        jest.runAllTimers();
    });
});