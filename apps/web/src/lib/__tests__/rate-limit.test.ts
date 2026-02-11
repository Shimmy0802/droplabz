import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { loginRateLimiter } from '@/lib/rate-limit';

describe('rate limiting', () => {
    beforeEach(() => {
        loginRateLimiter.reset();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('allows up to 5 attempts', () => {
        const key = 'ip-1';
        for (let i = 0; i < 5; i += 1) {
            expect(loginRateLimiter.isAllowed(key)).toBe(true);
        }
        expect(loginRateLimiter.isAllowed(key)).toBe(false);
    });

    it('resets after window expires', () => {
        vi.useFakeTimers();
        const key = 'ip-2';
        for (let i = 0; i < 5; i += 1) {
            loginRateLimiter.isAllowed(key);
        }
        expect(loginRateLimiter.isAllowed(key)).toBe(false);

        const now = Date.now();
        vi.setSystemTime(now + 15 * 60 * 1000 + 1000);

        expect(loginRateLimiter.isAllowed(key)).toBe(true);
    });

    it('tracks remaining attempts', () => {
        const key = 'ip-3';
        expect(loginRateLimiter.getRemaining(key)).toBe(5);
        loginRateLimiter.isAllowed(key);
        expect(loginRateLimiter.getRemaining(key)).toBe(4);
    });
});
