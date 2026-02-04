import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin, logSuperAdminAction } from '@/lib/auth/middleware';
import { db } from '@/lib/db';
import { z } from 'zod';

const updateUserSchema = z.object({
    role: z.enum(['SUPER_ADMIN', 'ADMIN', 'MEMBER']).optional(),
    email: z.string().email().optional(),
    username: z.string().min(3).max(50).optional(),
});

/**
 * GET /api/admin/users/[userId]
 * Super admin only - get specific user details
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
    try {
        await requireSuperAdmin();

        const { userId } = await params;
        const user = await db.user.findUnique({
            where: { id: userId },
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
                        createdAt: true,
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
                },
                communityMembers: {
                    select: {
                        id: true,
                        role: true,
                        createdAt: true,
                        community: {
                            select: {
                                id: true,
                                name: true,
                                slug: true,
                                owner: {
                                    select: {
                                        id: true,
                                        username: true,
                                    },
                                },
                            },
                        },
                    },
                },
                reviews: {
                    select: {
                        id: true,
                        rating: true,
                        comment: true,
                        createdAt: true,
                        community: {
                            select: {
                                name: true,
                                slug: true,
                            },
                        },
                    },
                    take: 10,
                    orderBy: { createdAt: 'desc' },
                },
                auditLogs: {
                    select: {
                        id: true,
                        action: true,
                        createdAt: true,
                        community: {
                            select: {
                                name: true,
                            },
                        },
                    },
                    take: 20,
                    orderBy: { createdAt: 'desc' },
                },
                _count: {
                    select: {
                        ownedCommunities: true,
                        communityMembers: true,
                        reviews: true,
                        auditLogs: true,
                        superAdminLogs: true,
                    },
                },
            },
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json(user);
    } catch (error: any) {
        console.error('Error fetching user:', error);

        if (error.statusCode === 403) {
            return NextResponse.json({ error: 'Super admin access required' }, { status: 403 });
        }

        return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
    }
}

/**
 * PATCH /api/admin/users/[userId]
 * Super admin only - update user settings
 */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
    try {
        const admin = await requireSuperAdmin();
        const { userId } = await params;
        const body = await req.json();

        // Validate input
        const validatedData = updateUserSchema.parse(body);

        // Get existing user data for audit log
        const existingUser = await db.user.findUnique({
            where: { id: userId },
            select: {
                role: true,
                email: true,
                username: true,
            },
        });

        if (!existingUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Update user
        const user = await db.user.update({
            where: { id: userId },
            data: {
                ...(validatedData.role && { role: validatedData.role }),
                ...(validatedData.email && { email: validatedData.email }),
                ...(validatedData.username && { username: validatedData.username }),
            },
            select: {
                id: true,
                email: true,
                username: true,
                role: true,
                discordId: true,
                discordUsername: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        // Log the action
        await logSuperAdminAction(
            admin.id,
            'UPDATE_USER',
            userId,
            'USER',
            {
                oldValues: existingUser,
                newValues: validatedData,
            },
            'SUCCESS',
        );

        return NextResponse.json(user);
    } catch (error: any) {
        console.error('Error updating user:', error);

        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Validation error', issues: error.issues }, { status: 400 });
        }

        if (error.statusCode === 403) {
            return NextResponse.json({ error: 'Super admin access required' }, { status: 403 });
        }

        return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
    }
}

/**
 * DELETE /api/admin/users/[userId]
 * Super admin only - delete user and all related data
 */
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
    try {
        const admin = await requireSuperAdmin();
        const { userId } = await params;

        // Get user data before deletion for audit log
        const user = await db.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                username: true,
                role: true,
                discordId: true,
                ownedCommunities: {
                    select: { id: true, name: true },
                },
            },
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Check if user owns any communities
        if (user.ownedCommunities.length > 0) {
            return NextResponse.json(
                {
                    error: 'Cannot delete user who owns communities',
                    message: `This user owns ${user.ownedCommunities.length} community/communities. Transfer ownership or delete the communities first.`,
                    ownedCommunities: user.ownedCommunities,
                },
                { status: 400 },
            );
        }

        // Delete user (cascade will handle related records)
        await db.user.delete({
            where: { id: userId },
        });

        // Log the action
        await logSuperAdminAction(
            admin.id,
            'DELETE_USER',
            userId,
            'USER',
            {
                deletedUser: user,
            },
            'SUCCESS',
        );

        return NextResponse.json({ success: true, message: 'User deleted successfully' });
    } catch (error: any) {
        console.error('Error deleting user:', error);

        if (error.statusCode === 403) {
            return NextResponse.json({ error: 'Super admin access required' }, { status: 403 });
        }

        return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
    }
}
