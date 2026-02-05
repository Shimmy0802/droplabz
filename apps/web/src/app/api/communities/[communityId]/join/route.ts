import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { db } from '@/lib/db';

/**
 * POST /api/communities/[communityId]/join
 * Join a public community
 */
export async function POST(_req: NextRequest, { params }: { params: Promise<{ communityId: string }> }) {
    try {
        const user = await requireAuth();
        const { communityId } = await params;

        // Get community by ID
        const community = await db.community.findUnique({
            where: { id: communityId },
            select: {
                id: true,
                name: true,
                isListed: true,
            },
        });

        if (!community) {
            return NextResponse.json({ error: 'Community not found' }, { status: 404 });
        }

        // Check if community allows public joining (only listed communities)
        if (!community.isListed) {
            return NextResponse.json(
                {
                    error: 'This community is private',
                    message: 'This community does not allow public joining. Contact the community owner for an invite.',
                },
                { status: 403 },
            );
        }

        // Check if user is already a member
        const existingMembership = await db.communityMember.findUnique({
            where: {
                communityId_userId: {
                    communityId: community.id,
                    userId: user.user.id,
                },
            },
        });

        if (existingMembership) {
            return NextResponse.json(
                { error: 'Already a member', message: 'You are already a member of this community' },
                { status: 400 },
            );
        }

        // Create membership with MEMBER role
        const membership = await db.communityMember.create({
            data: {
                communityId: community.id,
                userId: user.user.id,
                role: 'MEMBER',
            },
        });

        return NextResponse.json({
            success: true,
            message: `Successfully joined ${community.name}!`,
            membership,
        });
    } catch (error) {
        console.error('Error joining community:', error);

        if (error instanceof Error) {
            if (error.message.includes('401')) {
                return NextResponse.json(
                    { error: 'Unauthorized', message: 'You must be signed in to join a community' },
                    { status: 401 },
                );
            }
        }

        return NextResponse.json(
            { error: 'Failed to join community', message: 'An unexpected error occurred' },
            { status: 500 },
        );
    }
}
