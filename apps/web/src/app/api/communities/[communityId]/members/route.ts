import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireCommunityAdmin } from '@/lib/auth/middleware';
import { db } from '@/lib/db';
import { z } from 'zod';

const querySchema = z.object({
    limit: z.string().optional().default('20').transform(Number),
    offset: z.string().optional().default('0').transform(Number),
    userId: z.string().optional(),
    role: z.enum(['OWNER', 'ADMIN', 'MODERATOR', 'MEMBER']).optional(),
});

/**
 * GET /api/communities/[communityId]/members
 * Get community members with optional filtering
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ communityId: string }> }) {
    try {
        const user = await requireAuth();
        const { communityId } = await params;

        // Verify community access
        await requireCommunityAdmin(communityId);

        // Parse query params
        const searchParams = req.nextUrl.searchParams;
        const { limit, offset, userId, role } = querySchema.parse({
            limit: searchParams.get('limit'),
            offset: searchParams.get('offset'),
            userId: searchParams.get('userId'),
            role: searchParams.get('role'),
        });

        // Build where clause
        const where: any = { communityId };
        if (userId) where.userId = userId;
        if (role) where.role = role;

        // Get members
        const members = await db.communityMember.findMany({
            where,
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        discordId: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
            skip: offset,
        });

        const total = await db.communityMember.count({ where });

        return NextResponse.json({
            data: members,
            pagination: {
                total,
                limit,
                offset,
                hasMore: offset + limit < total,
            },
        });
    } catch (error) {
        console.error('Error fetching members:', error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
