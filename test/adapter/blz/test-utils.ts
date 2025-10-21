import {vi} from 'vitest';

export const advanceTime = async (ms: number): Promise<void> => {
    await vi.advanceTimersByTimeAsync(ms);
};

export const advanceTime100ms = async (times: number): Promise<void> => {
    for (let i = 0; i < times; i++) {
        await vi.advanceTimersByTimeAsync(100);
    }
};

// Standard delays used in tests
export const STANDARD_DELAYS = {
    STARTUP: 1000,
    RESPONSE: 100,
    NETWORK_INIT: 500,
    MESSAGE_HANDLING: 200,
} as const;
