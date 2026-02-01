import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin, logSuperAdminAction } from '@/lib/auth/middleware';
import { db } from '@/lib/db';

/**
 * GET /api/admin/communities/[id]
 * Super admin only - get specific community details
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        await requireSuperAdmin();

        const { id } = await params;
        const community = await db.community.findUnique({
            where: { id },
            include: {
                owner: {
                    select: {
                        id: true,
                        email: true,
                        username: true,
                        discordId: true,
                    },
                },
                members: {
                    select: {
                        userId: true,
                        role: true,
                        user: {
                            select: {
                                email: true,
                                username: true,
                            },
                        },
                    },
                },
                subscription: true,
                events: {
                    select: {
                        id: true,
                        title: true,
                        status: true,
                        createdAt: true,
                    },
                    take: 10,
                    orderBy: { createdAt: 'desc' },
                },
                _count: {
                    select: {
                        members: true,
                        events: true,
                    },
                },
            },
        });

        if (!community) {
            return NextResponse.json({ error: 'Community not found' }, { status: 404 });
        }

        return NextResponse.json(community);
    } catch (error: any) {
        console.error('Error fetching community:', error);

        if (error.statusCode === 403) {
            return NextResponse.json({ error: 'Super admin access required' }, { status: 403 });
        }

        return NextResponse.json({ error: 'Failed to fetch community' }, { status: 500 });
    }
}

/**
 * PATCH /api/admin/communities/[id]
 * Super admin only - update community settings
 */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const user = await requireSuperAdmin();
        const { id } = await params;
        const body = await req.json();

        const { name, description, isListed, isFeatured, isVerified } = body;

        const community = await db.community.update({
            where: { id },
            data: {
                ...(name && { name }),
                ...(description !== undefined && { description }),
                ...(isListed !== undefined && { isListed }),
                ...(isFeatured !== undefined && { isFeatured }),
                ...(isVerified !== undefined && {
                    isVerified,
                    verificationStatus: isVerified ? 'APPROVED' : 'REJECTED',
                    verificationApprovedAt: isVerified ? new Date() : null,
                    verifiedBy: isVerified ? user.id : null,
                }),
            },
            select: {
                id: true,
                name: true,
                slug: true,
                isFeatured: true,
                isVerified: true,
                verificationStatus: true,
            },
        });

        // Log the action
        await logSuperAdminAction(user.id, 'UPDATE_COMMUNITY', id, 'COMMUNITY', {
            changes: {
                name: name ? true : false,
                description: description !== undefined ? true : false,
                isListed: isListed !== undefined ? true : false,
                isFeatured: isFeatured !== undefined ? true : false,
                isVerified: isVerified !== undefined ? true : false,
            },
        });

        return NextResponse.json(community);
    } catch (error: any) {
        console.error('Error updating community:', error);

        if (error.statusCode === 403) {
            return NextResponse.json({ error: 'Super admin access required' }, { status: 403 });
        }

        if (error.code === 'P2025') {
            return NextResponse.json({ error: 'Community not found' }, { status: 404 });
        }

        return NextResponse.json({ error: 'Failed to update community' }, { status: 500 });
    }
}

/**
 * DELETE /api/admin/communities/[id]
 * Super admin only - delete a community (cascades all data)
 */
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const user = await requireSuperAdmin();
        const { id } = await params;

        // Get community name before deletion for logging
        const community = await db.community.findUnique({
            where: { id },
            select: { name: true },
        });

        if (!community) {
            return NextResponse.json({ error: 'Community not found' }, { status: 404 });
        }

        // Delete the community
        await db.community.delete({
            where: { id },
        });

        // Log the action
        await logSuperAdminAction(user.id, 'DELETE_COMMUNITY', id, 'COMMUNITY', {
            communityName: community.name,
        });

        return NextResponse.json({ success: true, message: 'Community deleted' });
    } catch (error: any) {
        console.error('Error deleting community:', error);

        if (error.statusCode === 403) {
            return NextResponse.json({ error: 'Super admin access required' }, { status: 403 });
        }

        if (error.code === 'P2025') {
            return NextResponse.json({ error: 'Community not found' }, { status: 404 });
        }

        return NextResponse.json({ error: 'Failed to delete community' }, { status: 500 });
    }
}
