import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * GET /api/verified-communities
 * Public endpoint - get all verified communities
 */
export async function GET(req: NextRequest) {
    try {
        const limit = parseInt(req.nextUrl.searchParams.get('limit') || '6');
        const offset = parseInt(req.nextUrl.searchParams.get('offset') || '0');

        const [communities, total] = await Promise.all([
            db.community.findMany({
                where: {
                    isVerified: true,
                    isListed: true,
                },
                select: {
                    id: true,
                    slug: true,
                    name: true,
                    description: true,
                    icon: true,
                    categories: true,
                    rating: true,
                    boostLevel: true,
                    createdAt: true,
                    owner: {
                        select: {
                            id: true,
                            username: true,
                        },
                    },
                    _count: {
                        select: {
                            members: true,
                        },
                    },
                },
                orderBy: [{ boostLevel: 'desc' }, { rating: 'desc' }, { createdAt: 'desc' }],
                take: limit,
                skip: offset,
            }),
            db.community.count({
                where: {
                    isVerified: true,
                    isListed: true,
                },
            }),
        ]);

        return NextResponse.json({
            communities,
            total,
            limit,
            offset,
        });
    } catch (error) {
        console.error('Error fetching verified communities:', error);
        return NextResponse.json({ error: 'Failed to fetch verified communities' }, { status: 500 });
    }
}
