import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

const querySchema = z.object({
    limit: z.string().nullish().default('20').transform(Number),
    offset: z.string().nullish().default('0').transform(Number),
});

/**
 * GET /api/communities/[communityId]/announcements
 * Get announcements for a community
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ communityId: string }> }) {
    try {
        // Public endpoint - no auth required for viewing announcements
        const { communityId } = await params;

        // Parse query params
        const searchParams = req.nextUrl.searchParams;
        const { limit, offset } = querySchema.parse({
            limit: searchParams.get('limit'),
            offset: searchParams.get('offset'),
        });

        // Get announcements - use direct communityId field instead of nested Event relation
        const announcements = await db.eventAnnouncement.findMany({
            where: {
                communityId: communityId,
            },
            include: {
                event: {
                    select: {
                        id: true,
                        title: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
            skip: offset,
        });

        const total = await db.eventAnnouncement.count({
            where: {
                communityId: communityId,
            },
        });

        return NextResponse.json({
            data: announcements,
            pagination: {
                total,
                limit,
                offset,
                hasMore: offset + limit < total,
            },
        });
    } catch (error) {
        console.error('Error fetching announcements:', error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
