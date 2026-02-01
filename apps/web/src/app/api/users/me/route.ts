import { getCurrentUser } from '@/lib/auth/middleware';
import { apiResponse, apiError } from '@/lib/api-utils';
import { NextRequest } from 'next/server';
import { db } from '@/lib/db';

/**
 * Get current user endpoint
 * GET /api/users/me
 */

export async function GET(_request: NextRequest) {
    try {
        const user = await getCurrentUser();

        // Fetch full user data including Discord username
        const fullUser = await db.user.findUnique({
            where: { id: user.id },
            select: {
                id: true,
                username: true,
                email: true,
                discordId: true,
                discordUsername: true,
                role: true,
                createdAt: true,
                passwordHash: true,
            },
        });

        if (!fullUser) {
            return apiResponse({ user: null });
        }

        const { passwordHash, ...safeUser } = fullUser;

        return apiResponse({ user: { ...safeUser, hasPassword: !!passwordHash } });
    } catch (error) {
        return apiError(error);
    }
}
