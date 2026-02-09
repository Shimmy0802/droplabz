/**
 * Simple in-memory rate limiter for development
 * Production should use @upstash/ratelimit with Redis or similar
 *
 * Tracks requests by IP address and enforces limits
 */

interface RateLimitEntry {
    count: number;
    resetAt: number;
}

class RateLimiter {
    private store = new Map<string, RateLimitEntry>();
    private readonly maxAttempts: number;
    private readonly windowMs: number;

    constructor(maxAttempts: number = 5, windowMs: number = 15 * 60 * 1000) {
        // Default: 5 attempts per 15 minutes
        this.maxAttempts = maxAttempts;
        this.windowMs = windowMs;

        // Clean up old entries every minute
        if (typeof setInterval !== 'undefined') {
            setInterval(() => this.cleanup(), 60 * 1000);
        }
    }

    /**
     * Check if request is allowed
     * @param key - Identifier (typically IP address)
     * @returns true if request is allowed, false if rate limited
     */
    isAllowed(key: string): boolean {
        const now = Date.now();
        const entry = this.store.get(key);

        if (!entry) {
            // First request from this key
            this.store.set(key, {
                count: 1,
                resetAt: now + this.windowMs,
            });
            return true;
        }

        if (now > entry.resetAt) {
            // Window expired, reset counter
            this.store.set(key, {
                count: 1,
                resetAt: now + this.windowMs,
            });
            return true;
        }

        if (entry.count >= this.maxAttempts) {
            // Rate limit exceeded
            return false;
        }

        // Increment counter within window
        entry.count += 1;
        return true;
    }

    /**
     * Get remaining attempts for a key
     */
    getRemaining(key: string): number {
        const entry = this.store.get(key);
        if (!entry) return this.maxAttempts;

        const now = Date.now();
        if (now > entry.resetAt) {
            return this.maxAttempts;
        }

        return Math.max(0, this.maxAttempts - entry.count);
    }

    /**
     * Get time until reset for a key (in ms)
     */
    getResetTime(key: string): number {
        const entry = this.store.get(key);
        if (!entry) return 0;

        const now = Date.now();
        return Math.max(0, entry.resetAt - now);
    }

    /**
     * Remove old entries to prevent memory leak
     * Called automatically every minute
     */
    private cleanup(): void {
        const now = Date.now();
        const keysToDelete: string[] = [];
        let deletedCount = 0;

        for (const [key, entry] of this.store.entries()) {
            if (now > entry.resetAt) {
                keysToDelete.push(key);
            }
        }

        deletedCount = keysToDelete.length;
        keysToDelete.forEach(key => this.store.delete(key));

        // Log cleanup in development mode
        if (process.env.NODE_ENV === 'development' && deletedCount > 0) {
            console.debug(`[RateLimiter] Cleaned up ${deletedCount} expired entries`);
        }
    }

    /**
     * Reset all tracking (useful for testing)
     */
    reset(): void {
        this.store.clear();
    }
}

// Export singleton instances for different endpoints
export const loginRateLimiter = new RateLimiter(5, 15 * 60 * 1000); // 5 attempts per 15 minutes
export const registerRateLimiter = new RateLimiter(3, 60 * 60 * 1000); // 3 registrations per hour
export const oauthRateLimiter = new RateLimiter(10, 10 * 60 * 1000); // 10 OAuth flows per 10 minutes

/**
 * Get client IP from request headers
 * Handles various proxy scenarios
 */
export function getClientIp(request: Request): string {
    if (!request) return 'unknown';

    const headers = request.headers;

    // Check for IP forwarding headers (production proxies)
    const forwarded = headers.get('x-forwarded-for');
    if (forwarded) {
        // Take the first IP if multiple are present
        return forwarded.split(',')[0].trim();
    }

    const realIp = headers.get('x-real-ip');
    if (realIp) {
        return realIp;
    }

    // Fallback to connection remoteAddress if available
    const remoteAddress = (request as any).socket?.remoteAddress;
    if (remoteAddress) {
        return remoteAddress;
    }

    return 'unknown';
}

/**
 * Create an API response for rate limit exceeded
 */
export function createRateLimitResponse(remaining: number, resetTimeMs: number) {
    const resetTimeSec = Math.ceil(resetTimeMs / 1000);
    return new Response(
        JSON.stringify({
            error: 'RATE_LIMITED',
            message: `Too many attempts. Please try again in ${resetTimeSec} seconds.`,
            remaining,
            retryAfter: resetTimeSec,
        }),
        {
            status: 429,
            headers: {
                'Content-Type': 'application/json',
                'Retry-After': resetTimeSec.toString(),
                'X-RateLimit-Remaining': remaining.toString(),
                'X-RateLimit-Reset': new Date(Date.now() + resetTimeMs).toISOString(),
            },
        },
    );
}
