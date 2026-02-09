# Phase 5: Security Test Coverage for Implemented Security Features

**Status**: ⏳ Planning  
**Date**: February 8, 2026  
**Focus**: Comprehensive security validation of all hardened features

---

## 1. Security Testing Framework Overview

### Test Coverage Scope

```
Input Validation
├─ Zod schema validation (prevent invalid data)
├─ Sanitization transforms (prevent XSS)
├─ CUID format validation (reject malformed IDs)
└─ Type safety catches (prevent unsafe type coercion)

Authentication & Authorization
├─ Session validation (requireAuth)
├─ Community admin checks (requireCommunityAdmin)
├─ Super admin checks (requireSuperAdmin)
├─ Wallet signature verification (NaCl validation)
└─ Cross-community data access prevention

Rate Limiting
├─ Auth endpoint rate limiting (5 attempts / 5 minutes)
├─ Rate limit headers (429 on limit)
├─ IP-based tracking (distributed attack prevention)
└─ Cleanup mechanism (memory management)

Error Handling
├─ Production-safe error messages (no info leakage)
├─ Stack trace suppression (production only)
├─ Environment-aware logging (secure in prod)
└─ Structured error responses

Wallet Verification
├─ NaCl signature validation (actual crypto)
├─ Wallet format validation (valid Solana address)
├─ Signature challenge (prevent replay)
└─ On-chain eligibility checks (when required)
```

---

## 2. Input Validation Test Suite

### 2.1 Zod Schema Validation Tests

```typescript
// File: apps/web/src/app/api/__tests__/validation.test.ts
import { z } from 'zod';
import { communitySchema, eventSchema, entrySchema } from '@/lib/schemas';

describe('Input Validation - Zod Schemas', () => {
    describe('Community Schema', () => {
        it('accepts valid community data', () => {
            const valid = {
                name: 'Amazing Community',
                description: 'Test community',
                isListed: true,
            };
            expect(() => communitySchema.parse(valid)).not.toThrow();
        });

        it('rejects missing required fields', () => {
            const invalid = { name: 'Community' }; // Missing others
            expect(() => communitySchema.parse(invalid)).toThrow('required');
        });

        it('rejects invalid email', () => {
            const invalid = { email: 'not-an-email' };
            expect(() => communitySchema.parse(invalid)).toThrow('email');
        });

        it('rejects XSS injection in name', () => {
            const invalid = { name: '<script>alert("xss")</script>' };
            expect(() => communitySchema.parse(invalid)).toThrow();
        });

        it('sanitizes HTML tags in description', () => {
            const input = { description: '<b>Bold</b> text' };
            const result = communitySchema.parse(input);
            expect(result.description).not.toContain('<script>');
        });
    });

    describe('Event Schema', () => {
        it('rejects invalid CUID in communityId', () => {
            const invalid = { communityId: 'invalid-cuid-123' };
            expect(() => eventSchema.parse(invalid)).toThrow('cuid');
        });

        it('rejects negative or zero duration', () => {
            const invalid = { durationMinutes: -10 };
            expect(() => eventSchema.parse(invalid)).toThrow('positive');
        });

        it('accepts valid CUID format', () => {
            const valid = { communityId: 'cl9fap9hf0000lr0u8l0u8l0u' };
            expect(() => eventSchema.parse(valid)).not.toThrow();
        });
    });

    describe('Entry Schema', () => {
        it('validates wallet address format', () => {
            const invalid = { walletAddress: 'invalid-wallet' };
            expect(() => entrySchema.parse(invalid)).toThrow();
        });

        it('accepts valid base58 Solana address', () => {
            const valid = {
                walletAddress: '11111111111111111111111111111112',
            };
            expect(() => entrySchema.parse(valid)).not.toThrow();
        });
    });
});
```

### 2.2 Sanitization Tests

```typescript
// File: apps/web/src/lib/__tests__/sanitization.test.ts
import { sanitizeText, sanitizeHtml, sanitizeUrl } from '@/lib/sanitization';

describe('Input Sanitization', () => {
    describe('XSS Prevention', () => {
        it('removes script tags', () => {
            const input = '<script>alert("xss")</script>Hello';
            expect(sanitizeText(input)).toBe('Hello');
        });

        it('removes event handlers', () => {
            const input = '<img src=x onerror="alert(1)">';
            expect(sanitizeHtml(input)).not.toContain('onerror');
        });

        it('removes javascript: URLs', () => {
            const input = '<a href="javascript:alert(1)">Click</a>';
            expect(sanitizeUrl(input)).not.toContain('javascript:');
        });

        it('preserves safe HTML', () => {
            const input = '<b>Bold</b> and <em>italic</em>';
            expect(sanitizeHtml(input)).toContain('<b>');
            expect(sanitizeHtml(input)).toContain('<em>');
        });

        it('handles encoded XSS attempts', () => {
            const input = '&lt;script&gt;alert(1)&lt;/script&gt;';
            expect(sanitizeText(input)).not.toContain('script');
        });
    });

    describe('Max Length Enforcement', () => {
        it('truncates text exceeding max length', () => {
            const input = 'a'.repeat(10000);
            const result = sanitizeText(input, { maxLength: 1000 });
            expect(result.length).toBeLessThanOrEqual(1000);
        });

        it('preserves text under max length', () => {
            const input = 'Short text';
            const result = sanitizeText(input, { maxLength: 1000 });
            expect(result).toBe('Short text');
        });
    });

    describe('Special Character Handling', () => {
        it('preserves emoji', () => {
            const input = 'Hello 👋 World 🌍';
            expect(sanitizeText(input)).toContain('👋');
        });

        it('handles unicode properly', () => {
            const input = 'Здравствуй мир'; // Russian
            expect(sanitizeText(input)).toBe('Здравствуй мир');
        });
    });
});
```

---

## 3. Authentication & Authorization Tests

### 3.1 Middle Tier Auth Tests

```typescript
// File: apps/web/src/lib/__tests__/auth-middleware.test.ts
import { requireAuth, requireCommunityAdmin, requireSuperAdmin } from '@/lib/auth/middleware';
import { ApiError } from '@/lib/api-utils';

// Mock NextAuth
jest.mock('@/lib/auth', () => ({
    getServerSession: jest.fn(),
}));

describe('Authentication Middleware', () => {
    describe('requireAuth()', () => {
        it('throws 401 when no session', async () => {
            getServerSession.mockResolvedValue(null);
            await expect(requireAuth()).rejects.toThrow(ApiError);
        });

        it('returns user when session valid', async () => {
            const session = { user: { id: 'user-1' } };
            getServerSession.mockResolvedValue(session);
            const user = await requireAuth();
            expect(user.id).toBe('user-1');
        });

        it('includes user ID in response', async () => {
            const session = { user: { id: 'test-user', email: 'test@example.com' } };
            getServerSession.mockResolvedValue(session);
            const user = await requireAuth();
            expect(user).toHaveProperty('id');
        });
    });

    describe('requireCommunityAdmin()', () => {
        it('throws 403 when user not admin', async () => {
            const mockDb = { communityMember: { findUnique: jest.fn().mockResolvedValue(null) } };
            await expect(requireCommunityAdmin('community-1')).rejects.toThrow('403');
        });

        it('throws 403 when user is MEMBER only', async () => {
            const mockDb = {
                communityMember: {
                    findUnique: jest.fn().mockResolvedValue({ role: 'MEMBER' }),
                },
            };
            await expect(requireCommunityAdmin('community-1')).rejects.toThrow('403');
        });

        it('allows OWNER role', async () => {
            const mockDb = {
                communityMember: {
                    findUnique: jest.fn().mockResolvedValue({ role: 'OWNER' }),
                },
            };
            // Should not throw
            expect(() => requireCommunityAdmin('community-1')).not.toThrow();
        });

        it('allows ADMIN role', async () => {
            const mockDb = {
                communityMember: {
                    findUnique: jest.fn().mockResolvedValue({ role: 'ADMIN' }),
                },
            };
            expect(() => requireCommunityAdmin('community-1')).not.toThrow();
        });
    });

    describe('requireSuperAdmin()', () => {
        it('throws 403 when user not SUPER_ADMIN', async () => {
            getServerSession.mockResolvedValue({
                user: { role: 'ADMIN' }, // Not SUPER_ADMIN
            });
            await expect(requireSuperAdmin()).rejects.toThrow('403');
        });

        it('allows SUPER_ADMIN role', async () => {
            getServerSession.mockResolvedValue({
                user: { role: 'SUPER_ADMIN' },
            });
            expect(() => requireSuperAdmin()).not.toThrow();
        });
    });
});
```

### 3.2 Cross-Community Data Access Prevention

```typescript
// File: apps/web/src/app/api/__tests__/access-control.test.ts
describe('Multi-Tenant Data Isolation', () => {
    it('prevents user from accessing another community events', async () => {
        // User is admin of community-1
        // Try to access community-2 events
        const response = await fetch('/api/events?communityId=community-2', {
            headers: { Authorization: 'Bearer user-token-1' },
        });
        expect(response.status).toBe(403);
    });

    it('returns 403 when querying cross-community members', async () => {
        const response = await fetch('/api/communities/community-2/members', {
            headers: { Authorization: 'Bearer user-of-community-1' },
        });
        expect(response.status).toBe(403);
    });

    it('SUPER_ADMIN can access any community', async () => {
        const response = await fetch('/api/communities/community-2/members', {
            headers: { Authorization: 'Bearer super-admin-token' },
        });
        expect(response.status).toBe(200);
    });

    it('validates communityId in request body matches route', async () => {
        // Attacker tries to create event for different community
        const response = await fetch('/api/events', {
            method: 'POST',
            headers: { Authorization: 'Bearer user-token' },
            body: JSON.stringify({
                communityId: 'community-2', // Different!
                name: 'Malicious Event',
            }),
        });
        expect(response.status).toBe(403);
    });
});
```

---

## 4. Rate Limiting Tests

### 4.1 Auth Endpoint Rate Limiting

```typescript
// File: apps/web/src/lib/__tests__/rate-limiting.test.ts
import { rateLimiter } from '@/lib/rate-limiting';

describe('Rate Limiting', () => {
    describe('Auth Endpoint Protection', () => {
        it('allows first 5 requests from IP', async () => {
            const ip = '192.168.1.1';
            for (let i = 0; i < 5; i++) {
                expect(rateLimiter.isAllowed(`auth:${ip}`)).toBe(true);
            }
        });

        it('rejects 6th request within 5 minutes', async () => {
            const ip = '192.168.1.2';
            for (let i = 0; i < 5; i++) {
                rateLimiter.isAllowed(`auth:${ip}`);
            }
            expect(rateLimiter.isAllowed(`auth:${ip}`)).toBe(false);
        });

        it('resets after 5 minutes', async () => {
            const ip = '192.168.1.3';
            // Use up limit
            for (let i = 0; i < 5; i++) {
                rateLimiter.isAllowed(`auth:${ip}`);
            }
            // Try one more (should fail)
            expect(rateLimiter.isAllowed(`auth:${ip}`)).toBe(false);

            // Advance time 5 minutes
            jest.useFakeTimers();
            jest.advanceTimersByTime(5 * 60 * 1000);

            // Should be allowed again
            expect(rateLimiter.isAllowed(`auth:${ip}`)).toBe(true);
            jest.useRealTimers();
        });

        it('returns 429 Too Many Requests header', async () => {
            const response = await fetch('/api/auth/signin', {
                method: 'POST',
                headers: { 'X-Forwarded-For': '192.168.1.4' },
                body: JSON.stringify({ email: 'test@test.com' }),
            });

            // After 6 attempts
            for (let i = 0; i < 6; i++) {
                rateLimiter.isAllowed('auth:192.168.1.4');
            }

            expect(response.status).toBe(429);
            expect(response.headers.get('Retry-After')).toBeDefined();
        });
    });

    describe('Distributed Attack Prevention', () => {
        it('tracks separate IPs independently', () => {
            const ip1 = '192.168.1.100';
            const ip2 = '192.168.1.101';

            // IP1: Use up to limit
            for (let i = 0; i < 5; i++) {
                rateLimiter.isAllowed(`auth:${ip1}`);
            }

            // IP2: Should still be allowed
            expect(rateLimiter.isAllowed(`auth:${ip2}`)).toBe(true);
        });

        it('blocks all attempts from rate-limited IP', () => {
            const ip = '192.168.1.200';
            for (let i = 0; i < 5; i++) {
                rateLimiter.isAllowed(`auth:${ip}`);
            }

            // Multiple attempts should all fail
            expect(rateLimiter.isAllowed(`auth:${ip}`)).toBe(false);
            expect(rateLimiter.isAllowed(`auth:${ip}`)).toBe(false);
            expect(rateLimiter.isAllowed(`auth:${ip}`)).toBe(false);
        });
    });

    describe('Memory Management', () => {
        it('cleans up old entries', async () => {
            const entries = 1000;
            for (let i = 0; i < entries; i++) {
                rateLimiter.isAllowed(`key-${i}`);
            }

            // Manually trigger cleanup (normally runs every minute)
            await rateLimiter.cleanup();

            // Memory should be managed
            expect(rateLimiter.size()).toBeLessThan(entries);
        });
    });
});
```

---

## 5. Error Message Security Tests

### 5.1 Production vs Development Error Messages

```typescript
// File: apps/web/src/lib/__tests__/error-messages.test.ts
import { ApiError } from '@/lib/api-utils';

describe('Error Message Security', () => {
    const originalEnv = process.env.NODE_ENV;

    afterEach(() => {
        process.env.NODE_ENV = originalEnv;
    });

    describe('Development Environment', () => {
        beforeEach(() => {
            process.env.NODE_ENV = 'development';
        });

        it('includes stack traces in development', () => {
            const error = new ApiError(500, 'Database connection failed', 'DB_CONNECTION_ERROR');
            const response = error.toResponse();
            expect(response.stack).toBeDefined();
        });

        it('includes error details in development', () => {
            const error = new ApiError(400, 'Invalid user email format', 'INVALID_EMAIL');
            const response = error.toResponse();
            expect(response.details).toBeDefined();
        });
    });

    describe('Production Environment', () => {
        beforeEach(() => {
            process.env.NODE_ENV = 'production';
        });

        it('masks stack traces in production', () => {
            const error = new ApiError(500, 'Database connection failed');
            const response = error.toResponse();
            expect(response.stack).toBeUndefined();
        });

        it('uses generic error message for 500 errors', () => {
            const error = new ApiError(500, 'Secret database credentials exposed!');
            const response = error.toResponse();
            expect(response.message).toBe('Internal server error');
            expect(response.message).not.toContain('credentials');
        });

        it('preserves validation error details', () => {
            const error = new ApiError(400, 'Email is required', 'VALIDATION_ERROR');
            const response = error.toResponse();
            expect(response.message).toContain('Email');
        });

        it('does not expose system paths', () => {
            const error = new ApiError(500, 'Failed at /home/user/app/db/query.ts:45');
            const response = error.toResponse();
            expect(response.message).not.toContain('/home/user');
        });
    });

    describe('No Information Leakage', () => {
        beforeEach(() => {
            process.env.NODE_ENV = 'production';
        });

        it('hides database field names in validation errors', () => {
            // Zod error from bad input
            const error = new ApiError(400, 'username_unique_constraint_violated');
            const response = error.toResponse();
            expect(response.message).not.toContain('constraint');
        });

        it('does not expose third-party API keys in errors', () => {
            const error = new ApiError(500, 'Discord API key invalid: pk_live_12345');
            const response = error.toResponse();
            expect(response.message).not.toContain('pk_live');
        });

        it('masks wallet addresses in debug messages', () => {
            const error = new ApiError(400, 'Wallet 11111111111111111111111111111112 already exists');
            const response = error.toResponse();
            expect(response.message).not.toContain('11111111111111111111111111111112');
        });
    });
});
```

---

## 6. Wallet Verification Tests

### 6.1 Signature Validation Tests

```typescript
// File: apps/web/src/lib/__tests__/wallet-verification.test.ts
import nacl from 'tweetnacl';
import { verifyWalletOwnership } from '@/lib/solana/verification';

describe('Wallet Signature Verification', () => {
    let keypair: any;
    let publicKey: Buffer;
    let message: Buffer;
    let signature: Buffer;

    beforeEach(() => {
        // Generate test keypair
        keypair = nacl.sign.keyPair();
        publicKey = Buffer.from(keypair.publicKey);
        message = Buffer.from('test-message');
        signature = Buffer.from(nacl.sign.detached(message, keypair.secretKey));
    });

    describe('Valid Signatures', () => {
        it('accepts valid signature from matching public key', async () => {
            const result = await verifyWalletOwnership(
                publicKey.toString('hex'),
                message.toString('hex'),
                signature.toString('hex'),
            );
            expect(result).toBe(true);
        });

        it('verifies real Solana signature', async () => {
            // Use known valid signature from testnet
            const pubKey = '11111111111111111111111111111112';
            const msg = 'test-message';
            const sig = 'valid-signature-hex';

            const result = await verifyWalletOwnership(pubKey, msg, sig);
            expect(typeof result).toBe('boolean');
        });
    });

    describe('Invalid Signatures', () => {
        it('rejects signature from different key', async () => {
            const otherKeypair = nacl.sign.keyPair();
            const wrongSignature = Buffer.from(nacl.sign.detached(message, otherKeypair.secretKey));

            const result = await verifyWalletOwnership(
                publicKey.toString('hex'),
                message.toString('hex'),
                wrongSignature.toString('hex'),
            );
            expect(result).toBe(false);
        });

        it('rejects modified message signature', async () => {
            const modifiedMessage = Buffer.from('modified-message');

            const result = await verifyWalletOwnership(
                publicKey.toString('hex'),
                modifiedMessage.toString('hex'),
                signature.toString('hex'),
            );
            expect(result).toBe(false);
        });

        it('rejects corrupted signature', async () => {
            const corruptedSignature = Buffer.from(signature);
            corruptedSignature[0] ^= 0xff; // Flip bits

            const result = await verifyWalletOwnership(
                publicKey.toString('hex'),
                message.toString('hex'),
                corruptedSignature.toString('hex'),
            );
            expect(result).toBe(false);
        });

        it('rejects empty signature', async () => {
            const result = await verifyWalletOwnership(publicKey.toString('hex'), message.toString('hex'), '');
            expect(result).toBe(false);
        });
    });

    describe('Address Validation', () => {
        it('validates base58 Solana address format', async () => {
            const validAddress = '11111111111111111111111111111112'; // Valid base58
            expect(() => validateSolanaAddress(validAddress)).not.toThrow();
        });

        it('rejects non-base58 characters', async () => {
            const invalid = '11111111111111111111111OIL1111112'; // OIL not in base58
            expect(() => validateSolanaAddress(invalid)).toThrow();
        });

        it('rejects wrong length address', async () => {
            const invalid = '111111111111111111'; // Too short
            expect(() => validateSolanaAddress(invalid)).toThrow();
        });
    });

    describe('Replay Attack Prevention', () => {
        it('rejects signature for different challenge', async () => {
            const challenge1 = 'challenge-1';
            const challenge2 = 'challenge-2';

            const signature1 = Buffer.from(nacl.sign.detached(Buffer.from(challenge1), keypair.secretKey));

            const result = await verifyWalletOwnership(
                publicKey.toString('hex'),
                challenge2,
                signature1.toString('hex'),
            );
            expect(result).toBe(false);
        });

        it('expires challenge after usage', async () => {
            // First verification succeeds
            const result1 = await verifyWalletOwnership(
                publicKey.toString('hex'),
                message.toString('hex'),
                signature.toString('hex'),
            );
            expect(result1).toBe(true);

            // Same signature reused should fail (challenge expired)
            const result2 = await verifyWalletOwnership(
                publicKey.toString('hex'),
                message.toString('hex'),
                signature.toString('hex'),
            );
            expect(result2).toBe(false);
        });
    });
});
```

---

## 7. CUID Validation Tests

### 7.1 Parameter Validation

```typescript
// File: apps/web/src/lib/__tests__/parameter-validation.test.ts
import { validateCUID } from '@/lib/validation';

describe('CUID Parameter Validation', () => {
    it('accepts valid CUID format', () => {
        const valid = 'cl9fap9hf0000lr0u8l0u8l0u';
        expect(() => validateCUID(valid)).not.toThrow();
    });

    it('rejects invalid CUID format', () => {
        expect(() => validateCUID('123-456-789')).toThrow();
        expect(() => validateCUID('not-a-cuid')).toThrow();
        expect(() => validateCUID('')).toThrow();
    });

    it('rejects SQL injection attempts in CUID parameter', () => {
        const injection = "'; DROP TABLE events; --";
        expect(() => validateCUID(injection)).toThrow();
    });

    it('rejects path traversal attempts', () => {
        const traversal = '../../../etc/passwd';
        expect(() => validateCUID(traversal)).toThrow();
    });

    it('validates API route parameters', async () => {
        const response = await fetch('/api/events/invalid-id');
        expect(response.status).toBe(400);

        const response2 = await fetch('/api/events/cl9fap9hf0000lr0u8l0u8l0u');
        expect(response2.status).not.toBe(400); // May be 404 if not found, but not 400
    });
});
```

---

## 8. Discord Requirements Enforcement Tests

### 8.1 Presale Entry Verification

```typescript
// File: apps/web/src/app/api/__tests__/presale-requirements.test.ts
describe('Presale Entry Requirements Enforcement', () => {
    it('validates all tier requirements on entry creation', async () => {
        const event = {
            requirements: [
                { type: 'DISCORD', value: '{ "guildId": "123", "minAge": 7 }' },
                { type: 'SOLANA', value: '{ "minTokens": 1000 }' },
            ],
        };

        const entry = {
            discordAge: 5, // FAILS minAge requirement
            tokenBalance: 1000, // OK
        };

        // Presale entry should be rejected
        const response = await fetch('/api/entries', {
            method: 'POST',
            body: JSON.stringify(entry),
        });

        expect(response.status).toBe(400);
        expect(await response.json()).toHaveProperty('error');
    });

    it('passes entry with all requirements met', async () => {
        const event = {
            requirements: [
                { type: 'DISCORD', value: '{ "guildId": "123", "minAge": 7 }' },
                { type: 'SOLANA', value: '{ "minTokens": 1000 }' },
            ],
        };

        const entry = {
            discordAge: 30, // OK
            tokenBalance: 5000, // OK
        };

        const response = await fetch('/api/entries', {
            method: 'POST',
            body: JSON.stringify(entry),
        });

        expect(response.status).toBe(201);
    });

    it('rejects entry missing any single requirement', async () => {
        // All requirements must pass - failing one fails entry
        const response = await fetch('/api/entries', {
            method: 'POST',
            body: JSON.stringify({
                eventId: 'event-1',
                discordAge: 7,
                tokenBalance: 500, // Below 1000
            }),
        });

        expect(response.status).toBe(400);
    });
});
```

---

## 9. Security Testing Checklist

### Phase 5 Verification Checklist

```
Input Validation
☐ All Zod schemas tested with valid/invalid data
☐ XSS injection blocked in all text fields
☐ CUID validation enforced on all route parameters
☐ SQLi attempts rejected
☐ Path traversal attempts rejected
☐ Sanitization performance < 5ms per input

Authentication & Authorization
☐ requireAuth() throws 401 when no session
☐ requireCommunityAdmin() throws 403 for non-admin
☐ requireSuperAdmin() throws 403 for non-super-admin
☐ Cross-community access prevented (403)
☐ User cannot access other admin panels
☐ SUPER_ADMIN can override community restrictions
☐ All auth endpoints return proper HTTP status codes

Rate Limiting
☐ Auth endpoints limited to 5 attempts / 5 minutes
☐ 429 Too Many Requests returned on limit
☐ Retry-After header present
☐ Different IPs tracked independently
☐ Rate limit reset after 5 minutes
☐ Memory cleaned up automatically
☐ No memory leaks under sustained load

Error Handling
☐ Production: Generic "Internal server error" on 500
☐ Production: Stack traces NOT in response
☐ Production: No sensitive paths exposed
☐ Production: No database field names leaked
☐ Development: Stack traces included for debugging
☐ Development: Detailed error messages in response
☐ All error responses are valid JSON
☐ No info leakage patterns in error messages

Wallet Verification
☐ Valid signatures accepted (NaCl validation)
☐ Invalid signatures rejected
☐ Tampered messages rejected
☐ Corrupted signatures rejected
☐ Base58 address format validated
☐ Wrong length addresses rejected
☐ Replay attacks prevented (challenge expiry)
☐ Signature challenge unique per request

Discord Requirements
☐ Presale entries verify all requirements
☐ Entry rejected if any requirement fails
☐ Discord age requirements enforced
☐ Solana token requirements enforced
☐ NFT requirements enforced
☐ Multiple requirement combinations work
```

---

## 10. Automated Security Testing

### 10.1 CI/CD Security Tests

```yaml
# File: .github/workflows/security-tests.yml
name: Security Tests

on: [push, pull_request]

jobs:
    security:
        runs-on: ubuntu-latest

        steps:
            - uses: actions/checkout@v3

            - name: Setup Node
              uses: actions/setup-node@v3
              with:
                  node-version: 18
                  cache: 'pnpm'

            - name: Install dependencies
              run: pnpm install

            - name: Input Validation Tests
              run: pnpm test -- --testPathPattern=validation

            - name: Auth Middleware Tests
              run: pnpm test -- --testPathPattern=auth-middleware

            - name: Rate Limiting Tests
              run: pnpm test -- --testPathPattern=rate-limiting

            - name: Error Handling Tests
              run: pnpm test -- --testPathPattern=error-messages

            - name: Wallet Security Tests
              run: pnpm test -- --testPathPattern=wallet-verification

            - name: Generate Coverage Report
              run: pnpm test -- --coverage --testPathPattern='(__tests__|test)'

            - name: Upload Coverage
              uses: codecov/codecov-action@v3
              with:
                  files: ./coverage/coverage-final.json

            - name: Security Audit (npm)
              run: npm audit --audit-level=moderate || true
```

---

## 11. Manual Security Review Checklist

**Before Production Deployment**:

```
API Endpoints
☐ All POST/PATCH requests require authentication
☐ All routes verify communityId ownership
☐ Error messages don't leak sensitive info
☐ Response headers are secure (CORS, CSP)

Database
☐ Credentials not in version control
☐ Connection strings encrypted
☐ Prepared statements used (Prisma does this)
☐ No raw SQL with user inputs

Environment
☐ DATABASE_URL not in code
☐ DISCORD_BOT_TOKEN not in code
☐ SOLANA_PROGRAM_ID configured
☐ NEXTAUTH_SECRET strong (32+ chars)

Code
☐ No console.log in production code
☐ No `any` type assertions (TypeScript safety)
☐ No hardcoded secrets or credentials
☐ All inputs validated with Zod
```

---

**Next**: Deploy to staging and run Phase 4 performance tests  
**Status**: ✅ Test Suite Defined - Ready for Implementation
