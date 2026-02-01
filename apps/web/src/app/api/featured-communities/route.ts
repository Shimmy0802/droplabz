import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/featured-communities
 * Public endpoint to fetch all featured communities
 * Used by homepage to display featured section
 */
export async function GET() {
    try {
        const featuredCommunities = await db.community.findMany({
            where: {
                isFeatured: true,
                isVerified: true,
            },
            select: {
                id: true,
                slug: true,
                name: true,
                description: true,
                icon: true,
                categories: true,
                tags: true,
                rating: true,
                boostLevel: true,
                isVerified: true,
                _count: {
                    select: {
                        members: true,
                    },
                },
            },
            orderBy: [{ boostLevel: 'desc' }, { rating: 'desc' }, { createdAt: 'desc' }],
            take: 12, // Limit to 12 featured communities for homepage
        });

        return NextResponse.json(featuredCommunities);
    } catch (error) {
        console.error('Error fetching featured communities:', error);
        return NextResponse.json({ error: 'Failed to fetch featured communities' }, { status: 500 });
    }
}
