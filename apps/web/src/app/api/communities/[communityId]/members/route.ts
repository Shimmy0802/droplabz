import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireCommunityAdmin } from '@/lib/auth/middleware';
import { db } from '@/lib/db';
import { z } from 'zod';

const querySchema = z.object({
    limit: z.string().optional().default('20').transform(Number),
    offset: z.string().optional().default('0').transform(Number),
    page: z
        .string()
        .optional()
        .transform(val => (val ? Number(val) : undefined)),
    filter: z.string().optional(),
    search: z.string().optional(),
    userId: z.string().optional(),
    role: z.enum(['OWNER', 'ADMIN', 'MODERATOR', 'MEMBER']).optional(),
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

        // Parse query params
        const searchParams = req.nextUrl.searchParams;
        const { limit, offset, page, filter, search, userId, role } = querySchema.parse({
            limit: searchParams.get('limit'),
            offset: searchParams.get('offset'),
            page: searchParams.get('page'),
            filter: searchParams.get('filter'),
            search: searchParams.get('search'),
            userId: searchParams.get('userId'),
            role: searchParams.get('role'),
        });

        // Calculate offset from page if provided
        const actualOffset = page ? (page - 1) * limit : offset;

        // Build where clause
        const where: any = { communityId };
        if (userId) where.userId = userId;
        if (role) where.role = role;

        // Handle filter parameter
        if (filter && filter !== 'ALL') {
            where.role = filter as any;
        }

        // Handle search parameter
        if (search) {
            where.user = {
                OR: [{ email: { contains: search, mode: 'insensitive' } }, { discordId: { contains: search } }],
            };
        }

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
            skip: actualOffset,
        });

        const total = await db.communityMember.count({ where });

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
        console.error('Error fetching members:', error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
