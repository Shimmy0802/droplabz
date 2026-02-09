import { NextResponse } from 'next/server';
import { z } from 'zod';

/**
 * Environment check for error message security
 * Production (NODE_ENV === 'production'): Returns generic safe messages
 * Development: Returns full details for debugging
 */
const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Generate a request ID for error tracking
 */
function generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Map of error codes to user-friendly messages.
 * Used in production to prevent information leakage
 */
const ERROR_MESSAGE_MAP: Record<string, string> = {
    INVALID_ID: 'Invalid identifier provided',
    VALIDATION_ERROR: 'The provided data is invalid',
    AUTH_REQUIRED: 'Authentication required',
    FORBIDDEN: 'Access denied',
    NOT_FOUND: 'Resource not found',
    DUPLICATE_ENTRY: 'This item already exists',
    RATE_LIMITED: 'Too many requests. Please try again later',
    INTERNAL_ERROR: 'An error occurred processing your request',
    UNKNOWN_ERROR: 'An unexpected error occurred',
};

export class ApiError extends Error {
    constructor(
        public code: string,
        public statusCode: number,
        message: string,
        public requestId?: string,
    ) {
        super(message);
        this.name = 'ApiError';
    }
}

/**
 * Get secure error message for client response
 * In production, returns generic message; in development returns full message
 */
function getSecureErrorMessage(code: string, originalMessage: string): string {
    if (isDevelopment) {
        return originalMessage;
    }

    // Return mapped message if available, otherwise generic
    return ERROR_MESSAGE_MAP[code] || ERROR_MESSAGE_MAP.INTERNAL_ERROR;
}

export function apiResponse<T>(data: T, status = 200) {
    return NextResponse.json(data, { status });
}

export function apiError(error: unknown) {
    const requestId = generateRequestId();

    // Handle custom error object format
    if (error && typeof error === 'object' && 'code' in error && 'status' in error && 'message' in error) {
        const err = error as { code: string; status: number; message: string };
        const secureMessage = getSecureErrorMessage(err.code, err.message);

        // Log detailed error server-side
        if (!isDevelopment) {
            console.error(`[${requestId}] ${err.code}:`, err.message);
        }

        return NextResponse.json(
            {
                error: err.code,
                message: secureMessage,
                ...(isDevelopment && { details: err.message }),
                ...(isDevelopment && { requestId }),
            },
            { status: err.status },
        );
    }

    if (error instanceof ApiError) {
        const secureMessage = getSecureErrorMessage(error.code, error.message);

        // Log detailed error server-side
        if (!isDevelopment) {
            console.error(`[${requestId}] ${error.code}:`, error.message);
        }

        return NextResponse.json(
            {
                error: error.code,
                message: secureMessage,
                ...(isDevelopment && { details: error.message }),
                ...(isDevelopment && { requestId }),
            },
            { status: error.statusCode },
        );
    }

    if (error instanceof Error) {
        const secureMessage = getSecureErrorMessage('INTERNAL_ERROR', error.message);

        // Log detailed error server-side
        console.error(`[${requestId}] Unhandled Error:`, error.message, error.stack);

        return NextResponse.json(
            {
                error: 'INTERNAL_ERROR',
                message: secureMessage,
                ...(isDevelopment && { details: error.message, stack: error.stack }),
                ...(isDevelopment && { requestId }),
            },
            { status: 500 },
        );
    }

    // Log unknown error
    console.error(`[${requestId}] Unknown error type:`, error);

    return NextResponse.json(
        {
            error: 'UNKNOWN_ERROR',
            message: getSecureErrorMessage('UNKNOWN_ERROR', 'An unknown error occurred'),
            ...(isDevelopment && { requestId }),
        },
        { status: 500 },
    );
}

/**
 * Validate a CUID parameter from route params
 * Throws ApiError if invalid
 */
export function validateCuid(value: unknown, paramName: string): string {
    try {
        return z.string().cuid().parse(value);
    } catch (error) {
        throw new ApiError('INVALID_ID', 400, `Invalid ${paramName}: must be a valid CUID`);
    }
}

/**
 * Validate multiple CUID parameters at once
 */
export function validateCuids(params: Record<string, unknown>, names: string[]): Record<string, string> {
    const validated: Record<string, string> = {};
    for (const name of names) {
        validated[name] = validateCuid(params[name], name);
    }
    return validated;
}
