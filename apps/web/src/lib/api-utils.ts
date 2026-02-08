import { NextResponse } from 'next/server';
import { z } from 'zod';

export class ApiError extends Error {
    constructor(
        public code: string,
        public statusCode: number,
        message: string,
    ) {
        super(message);
    }
}

export function apiResponse<T>(data: T, status = 200) {
    return NextResponse.json(data, { status });
}

export function apiError(error: unknown) {
    // Handle custom error object format
    if (error && typeof error === 'object' && 'code' in error && 'status' in error && 'message' in error) {
        const err = error as { code: string; status: number; message: string };
        return NextResponse.json({ error: err.code, message: err.message }, { status: err.status });
    }

    if (error instanceof ApiError) {
        return NextResponse.json({ error: error.code, message: error.message }, { status: error.statusCode });
    }

    if (error instanceof Error) {
        return NextResponse.json({ error: 'INTERNAL_ERROR', message: error.message }, { status: 500 });
    }

    return NextResponse.json({ error: 'UNKNOWN_ERROR', message: 'An unknown error occurred' }, { status: 500 });
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
