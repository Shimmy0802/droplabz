import { describe, expect, it } from 'vitest';
import { sanitizeEmail, sanitizeId, sanitizeText, sanitizeUrl } from '@/lib/sanitization';

describe('sanitization', () => {
    it('sanitizes text by trimming and removing null bytes', () => {
        const result = sanitizeText('  hello\0world  ');
        expect(result).toBe('helloworld');
    });

    it('rejects dangerous script content', () => {
        expect(() => sanitizeText('<script>alert(1)</script>')).toThrowError();
        expect(() => sanitizeText('javascript:alert(1)')).toThrowError();
        expect(() => sanitizeText('<img onerror=alert(1)>')).toThrowError();
    });

    it('enforces max length', () => {
        expect(() => sanitizeText('a'.repeat(5), { maxLength: 4 })).toThrowError();
    });

    it('sanitizes urls by rejecting unsafe protocols', () => {
        expect(() => sanitizeUrl('javascript:alert(1)')).toThrowError();
        expect(() => sanitizeUrl('data:text/html,alert(1)')).toThrowError();
        expect(sanitizeUrl('https://example.com')).toBe('https://example.com');
    });

    it('sanitizes emails by rejecting injection characters', () => {
        expect(() => sanitizeEmail('bad<email>@example.com')).toThrowError();
        expect(sanitizeEmail('Test@Example.com')).toBe('test@example.com');
    });

    it('validates discord ids', () => {
        expect(sanitizeId('123456789012345678', 'discord')).toBe('123456789012345678');
        expect(() => sanitizeId('discord-id', 'discord')).toThrowError();
    });

    it('validates solana addresses', () => {
        const address = 'A'.repeat(43);
        expect(sanitizeId(address, 'solana')).toBe(address);
        expect(() => sanitizeId('not-a-wallet', 'solana')).toThrowError();
    });

    it('validates slugs', () => {
        expect(sanitizeId('valid-slug-123', 'slug')).toBe('valid-slug-123');
        expect(() => sanitizeId('Invalid_Slug', 'slug')).toThrowError();
    });
});
