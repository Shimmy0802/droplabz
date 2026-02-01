import { db } from '@/lib/db';
import { apiResponse, apiError, ApiError } from '@/lib/api-utils';
import { hash } from 'bcryptjs';
import { NextRequest } from 'next/server';
import { z } from 'zod';

/**
 * User registration endpoint
 * POST /api/auth/register
 */

const registerSchema = z.object({
    email: z.string().email(),
    username: z.string().min(3).max(50),
    password: z.string().min(8).max(100),
});

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const input = registerSchema.parse(body);

        // Check if email already exists
        const existingEmail = await db.user.findUnique({
            where: { email: input.email },
        });

        if (existingEmail) {
            throw new ApiError('EMAIL_EXISTS', 400, 'Email already registered');
        }

        // Check if username already exists
        const existingUsername = await db.user.findUnique({
            where: { username: input.username },
        });

        if (existingUsername) {
            throw new ApiError('USERNAME_EXISTS', 400, 'Username already taken');
        }

        // Hash password
        const passwordHash = await hash(input.password, 12);

        // Create user
        const user = await db.user.create({
            data: {
                email: input.email,
                username: input.username,
                passwordHash,
                role: 'MEMBER',
            },
            select: {
                id: true,
                email: true,
                username: true,
                role: true,
                createdAt: true,
            },
        });

        return apiResponse({ user }, 201);
    } catch (error) {
        return apiError(error);
    }
}
