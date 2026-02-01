import { NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/auth/middleware';
import { db } from '@/lib/db';

/**
 * GET /api/admin/communities
 * Super admin only endpoint to get all communities with management options
 */
export async function GET() {
    try {
        await requireSuperAdmin();

        const communities = await db.community.findMany({
            select: {
                id: true,
                slug: true,
                name: true,
                description: true,
                icon: true,
                ownerId: true,
                guildId: true,
                isFeatured: true,
                isListed: true,
                isVerified: true,
                verificationStatus: true,
                boostLevel: true,
                rating: true,
                createdAt: true,
                owner: {
                    select: {
                        email: true,
                        username: true,
                    },
                },
                subscription: {
                    select: {
                        tier: true,
                        status: true,
                    },
                },
                _count: {
                    select: {
                        members: true,
                        events: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json(communities);
    } catch (error: any) {
        console.error('Error fetching communities:', error);

        if (error.statusCode === 403) {
            return NextResponse.json({ error: 'Super admin access required' }, { status: 403 });
        }

        return NextResponse.json({ error: 'Failed to fetch communities' }, { status: 500 });
    }
}
