/**
 * Input sanitization utilities for preventing XSS and injection attacks
 * Designed to work with Zod validation
 */

/**
 * Sanitize a text string for safe output
 * - Trims whitespace
 * - Removes null bytes
 * - Prevents common injection patterns
 * - Returns unchanged string if validation passes (Next.js escapes by default)
 */
export function sanitizeText(input: string, options: { maxLength?: number; pattern?: RegExp } = {}): string {
    if (!input) return input;

    let sanitized = input.trim();

    // Remove null bytes (can bypass filters)
    sanitized = sanitized.replace(/\0/g, '');

    // Check for dangerous patterns that should be rejected
    const dangerousPatterns = [
        /<script/i, // Script tags
        /javascript:/i, // JavaScript protocol
        /on\w+\s*=/i, // Event handlers (onclick, onerror, etc)
        /iframe/i, // Iframes
        /<embed/i, // Embed tags
        /<object/i, // Object tags
    ];

    for (const pattern of dangerousPatterns) {
        if (pattern.test(sanitized)) {
            const errorMsg = `Input contains potentially dangerous content`;
            throw new Error(errorMsg);
        }
    }

    // Apply custom pattern if provided (e.g., only alphanumeric + spaces)
    if (options.pattern && !options.pattern.test(sanitized)) {
        throw new Error('Input does not match required format');
    }

    // Enforce max length if specified
    if (options.maxLength && sanitized.length > options.maxLength) {
        throw new Error(`Input exceeds maximum length of ${options.maxLength}`);
    }

    return sanitized;
}

/**
 * Create a Zod-compatible sanitizer for text fields
 * Returns a Zod string schema with built-in sanitization
 */
export function sanitizedText(maxLength = 1000, pattern?: RegExp) {
    return (
        unsafeString: string,
    ) => {
        try {
            return sanitizeText(unsafeString, { maxLength, pattern });
        } catch (error) {
            throw new Error(error instanceof Error ? error.message : 'Invalid input');
        }
    };
}

/**
 * Sanitize URL - basic check to prevent javascript: protocol
 */
export function sanitizeUrl(url: string): string {
    const trimmed = url.trim().toLowerCase();

    // Reject dangerous protocols
    if (trimmed.startsWith('javascript:') || trimmed.startsWith('data:') || trimmed.startsWith('vbscript:')) {
        throw new Error('Invalid URL protocol');
    }

    return url;
}

/**
 * Sanitize email address
 */
export function sanitizeEmail(email: string): string {
    const trimmed = email.trim().toLowerCase();

    // Basic email validation - check for obvious injection attempts
    if (/<|>|;|,/.test(email)) {
        throw new Error('Invalid email format');
    }

    return trimmed;
}

/**
 * Sanitize Discord/Solana IDs (numeric strings or base58)
 * These should only contain allowed character sets
 */
export function sanitizeId(id: string, type: 'discord' | 'solana' | 'slug' = 'discord'): string {
    const trimmed = id.trim();

    const patterns = {
        discord: /^\d+$/, // Discord IDs are 18-20 digit numbers
        solana: /^[1-9A-HJ-NP-Z]{43,44}$/, // Base58 Solana addresses
        slug: /^[a-z0-9-]+$/, // Slugs: lowercase, numbers, hyphens
    };

    if (!patterns[type].test(trimmed)) {
        throw new Error(`Invalid ${type} ID format`);
    }

    return trimmed;
}
