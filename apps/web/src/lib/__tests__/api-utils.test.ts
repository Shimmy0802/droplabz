import { describe, expect, it } from 'vitest';
import { ApiError, apiError } from '@/lib/api-utils';

describe('api-utils', () => {
    it('creates ApiError with code and status', () => {
        const err = new ApiError('VALIDATION_ERROR', 400, 'Bad data', 'req_123');

        expect(err.code).toBe('VALIDATION_ERROR');
        expect(err.statusCode).toBe(400);
        expect(err.message).toBe('Bad data');
        expect(err.requestId).toBe('req_123');
    });

    it('apiError response masks sensitive messages', async () => {
        const response = apiError(new ApiError('AUTH_REQUIRED', 401, 'No session'));
        const body = await response.json();

        expect(body.error).toBe('AUTH_REQUIRED');
        expect(body.message).toBe('Authentication required');
    });

    it('validateCuid rejects invalid ids', async () => {
        const { validateCuid } = await import('@/lib/api-utils');

        expect(() => validateCuid('bad-id', 'eventId')).toThrowError('Invalid eventId');
    });
});
