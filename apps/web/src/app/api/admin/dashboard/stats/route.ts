import { NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/auth/middleware';
import { db } from '@/lib/db';

/**
 * GET /api/admin/dashboard/stats
 * Super admin only endpoint to get platform overview stats
 */
export async function GET() {
    try {
        await requireSuperAdmin();

        // Get total counts
        const [totalUsers, totalCommunities, totalEvents, totalEntries] = await Promise.all([
            db.user.count(),
            db.community.count(),
            db.event.count(),
            db.entry.count(),
        ]);

        const featuredCount = await db.community.count({
            where: { isFeatured: true },
        });

        // Get recent activity
        const recentCommunities = await db.community.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                name: true,
                createdAt: true,
                _count: { select: { members: true } },
            },
        });

        const recentUsers = await db.user.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                email: true,
                username: true,
                createdAt: true,
            },
        });

        // Get subscription stats
        const subscriptions = await db.subscription.findMany({
            select: {
                tier: true,
                status: true,
            },
        });

        const subscriptionBreakdown = {
            free: subscriptions.filter(s => s.tier === 'FREE').length,
            pro: subscriptions.filter(s => s.tier === 'PRO').length,
            enterprise: subscriptions.filter(s => s.tier === 'ENTERPRISE').length,
        };

        return NextResponse.json({
            stats: {
                totalUsers,
                totalCommunities,
                totalEvents,
                totalEntries,
                featuredCount,
            },
            subscriptionBreakdown,
            recentCommunities,
            recentUsers,
        });
    } catch (error: any) {
        console.error('Error fetching dashboard stats:', error);

        if (error.statusCode === 403) {
            return NextResponse.json({ error: 'Super admin access required' }, { status: 403 });
        }

        return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
    }
}
