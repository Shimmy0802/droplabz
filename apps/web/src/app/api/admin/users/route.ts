import { NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/auth/middleware';
import { db } from '@/lib/db';

/**
 * GET /api/admin/users
 * Super admin only endpoint to get all users with management options
 */
export async function GET() {
    try {
        await requireSuperAdmin();

        const users = await db.user.findMany({
            select: {
                id: true,
                email: true,
                username: true,
                role: true,
                discordId: true,
                discordUsername: true,
                createdAt: true,
                updatedAt: true,
                ownedCommunities: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                    },
                },
                communityMembers: {
                    select: {
                        id: true,
                        role: true,
                        community: {
                            select: {
                                id: true,
                                name: true,
                                slug: true,
                            },
                        },
                    },
                },
                _count: {
                    select: {
                        ownedCommunities: true,
                        communityMembers: true,
                        reviews: true,
                        auditLogs: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json(users);
    } catch (error: any) {
        console.error('Error fetching users:', error);

        if (error.statusCode === 403) {
            return NextResponse.json({ error: 'Super admin access required' }, { status: 403 });
        }

        return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }
}
