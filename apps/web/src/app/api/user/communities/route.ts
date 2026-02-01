import { getCurrentUser } from '@/lib/auth/middleware';
import { apiResponse, apiError } from '@/lib/api-utils';
import { db } from '@/lib/db';
import { NextRequest } from 'next/server';

/**
 * GET /api/user/communities
 * Get all communities for the current user
 */
export async function GET(_request: NextRequest) {
    try {
        const user = await getCurrentUser();

        const communities = await db.community.findMany({
            where: {
                members: {
                    some: {
                        userId: user.id,
                    },
                },
            },
            include: {
                _count: {
                    select: { members: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        return apiResponse(communities);
    } catch (error) {
        return apiError(error);
    }
}
