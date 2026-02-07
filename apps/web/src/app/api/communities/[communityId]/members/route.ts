import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

const querySchema = z.object({
    limit: z.string().nullish().default('20').transform(Number),
    offset: z.string().nullish().default('0').transform(Number),
    page: z
        .string()
        .nullish()
        .transform(val => (val ? Number(val) : undefined)),
    filter: z.string().nullish(),
    search: z.string().nullish(),
    userId: z.string().nullish(),
    role: z.enum(['OWNER', 'ADMIN', 'MODERATOR', 'MEMBER']).nullish(),
});

/**
 * GET /api/communities/[communityId]/members
 * Get community members with optional filtering
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ communityId: string }> }) {
    try {
        // Public endpoint - allows anyone to view members
        // If userId is provided, returns specific member info
        const { communityId } = await params;

        if (!communityId) {
            console.error('[Members] Missing communityId parameter');
            return NextResponse.json({ error: 'Missing communityId' }, { status: 400 });
        }

        // Parse query params
        const searchParams = req.nextUrl.searchParams;
        const parsed = querySchema.parse({
            limit: searchParams.get('limit'),
            offset: searchParams.get('offset'),
            page: searchParams.get('page'),
            filter: searchParams.get('filter'),
            search: searchParams.get('search'),
            userId: searchParams.get('userId'),
            role: searchParams.get('role'),
        });
        const { limit, offset, page, filter, search, userId, role } = parsed;

        // Calculate offset from page if provided
        const actualOffset = page ? (page - 1) * limit : offset;

        // Build where clause
        const where: any = {
            communityId,
        };

        if (userId) {
            where.userId = userId;
        }

        if (role) {
            where.role = role;
        }

        // Handle filter parameter
        if (filter && filter !== 'ALL') {
            where.role = filter;
        }

        // Handle search parameter
        if (search?.trim()) {
            where.user = {
                OR: [
                    { email: { contains: search, mode: 'insensitive' } },
                    { username: { contains: search, mode: 'insensitive' } },
                    { discordUsername: { contains: search, mode: 'insensitive' } },
                ],
            };
        }

        console.log('[Members] Query params:', {
            communityId,
            limit,
            offset: actualOffset,
            hasSearch: !!search,
        });

        // Get members
        const members = await db.communityMember.findMany({
            where,
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        discordId: true,
                        username: true,
                        discordUsername: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
            skip: actualOffset,
        });

        const total = await db.communityMember.count({ where });

        console.log('[Members] Found', members.length, 'members, total:', total);

        return NextResponse.json({
            data: members,
            pagination: {
                total,
                limit,
                offset: actualOffset,
                page: page || Math.floor(actualOffset / limit) + 1,
                hasMore: actualOffset + limit < total,
            },
        });
    } catch (error) {
        console.error('[Members] Error:', {
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
        });
        return NextResponse.json(
            {
                error: 'Failed to fetch members',
                details: error instanceof Error ? error.message : String(error),
            },
            { status: 500 },
        );
    }
}
