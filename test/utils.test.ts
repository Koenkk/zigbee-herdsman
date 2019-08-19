import "regenerator-runtime/runtime";
import {IsNumberArray, Wait, ArraySplitChunks, Queue} from '../src/utils';

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

    it('Split array in chunks', () => {
        expect(ArraySplitChunks([1, 2, 3, 4], 2)).toEqual([[1, 2], [3, 4]]);
    });

    it('Test wait', async () => {
        jest.useFakeTimers();
        Wait(1000).then(() => {});
        expect(setTimeout).toHaveBeenCalledTimes(1);
        expect(setTimeout).toHaveBeenLastCalledWith(expect.any(Function), 1000);
        jest.runAllTimers();
    });

    it('Test queue', async () => {
        const queue = new Queue(4);
        const finished = [];

        let job1Promise, job2Promise, job3Promise;
        const job1 = new Promise((resolve) => job1Promise = resolve);
        const job2 = new Promise((resolve) => job2Promise = resolve);
        const job5 = new Promise((resolve) => {});
        const job6 = new Promise((resolve) => {});
        const job7 = new Promise((resolve) => {});

        const job1Result = queue.execute<string>(async () => {
            await job1;
            finished.push(1);
            return 'finished';
        });

        const job2Result = queue.execute<void>(async () => {
            await job2;
            finished.push(2);
        }, 'mykey');

        queue.execute<void>(async () => {
            finished.push(3);
        }, 'mykey');

        queue.execute<void>(async () => {
            finished.push(4);
        }, 'mykey2');

        queue.execute<void>(async () => {
            await job5;
            finished.push(5);
        });

        queue.execute<void>(async () => {
            await job6;
            finished.push(6);
        });

        queue.execute<void>(async () => {
            await job7;
            finished.push(7);
        });

        queue.execute<void>(async () => {
            finished.push(8);
        });

        expect(finished).toEqual([4]);
        job1Promise();
        expect(await job1Result).toBe('finished');
        await job1Result;
        expect(finished).toEqual([4, 1]);
        job2Promise();
        await job2Result;
        expect(finished).toEqual([4, 1, 2, 3]);
    });
});