import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/auth/middleware';
import { db } from '@/lib/db';

/**
 * POST /api/admin/communities/[id]/featured
 * Super admin only endpoint to mark/unmark a community as featured
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        // Verify super admin access
        await requireSuperAdmin();

        const { id } = await params;
        const { isFeatured } = await req.json();

        if (typeof isFeatured !== 'boolean') {
            return NextResponse.json({ error: 'isFeatured must be a boolean' }, { status: 400 });
        }

        // Update the community's featured status
        const community = await db.community.update({
            where: { id },
            data: { isFeatured },
            select: {
                id: true,
                slug: true,
                name: true,
                isFeatured: true,
            },
        });

        return NextResponse.json(community);
    } catch (error: any) {
        console.error('Error updating featured status:', error);

        if (error.statusCode === 403) {
            return NextResponse.json({ error: 'Super admin access required' }, { status: 403 });
        }

        if (error.code === 'P2025') {
            return NextResponse.json({ error: 'Community not found' }, { status: 404 });
        }

        return NextResponse.json({ error: 'Failed to update featured status' }, { status: 500 });
    }
}
