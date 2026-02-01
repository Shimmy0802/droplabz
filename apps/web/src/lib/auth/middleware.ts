import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { ApiError } from '@/lib/api-utils';
import { headers } from 'next/headers';

/**
 * Authentication and authorization middleware utilities
 * Used to protect API routes and enforce permissions
 */

/**
 * Get the current authenticated session
 * @throws {ApiError} 401 if not authenticated
 */
export async function requireAuth() {
    const session = await auth();

    if (!session || !session.user || !session.user.id) {
        throw new ApiError('UNAUTHORIZED', 401, 'Authentication required');
    }

    return session;
}

/**
 * Get the current user with full details
 * @throws {ApiError} 401 if not authenticated
 */
export async function getCurrentUser() {
    const session = await requireAuth();

    const user = await db.user.findUnique({
        where: { id: session.user.id },
        select: {
            id: true,
            email: true,
            username: true,
            role: true,
            discordId: true,
            createdAt: true,
        },
    });

    if (!user) {
        throw new ApiError('USER_NOT_FOUND', 404, 'User not found');
    }

    return user;
}

/**
 * Verify user has SUPER_ADMIN role with multi-layer security
 * Checks: Discord ID whitelist, Wallet whitelist, and database role
 * @throws {ApiError} 401 if not authenticated, 403 if not super admin
 */
export async function requireSuperAdmin() {
    const user = await getCurrentUser();

    // Check database role
    if (user.role !== 'SUPER_ADMIN') {
        throw new ApiError('FORBIDDEN', 403, 'Super admin access required');
    }

    // Verify Discord ID is whitelisted
    const allowedDiscordIds = (process.env.SUPER_ADMIN_DISCORD_IDS || '').split(',').filter(Boolean);
    if (allowedDiscordIds.length > 0 && !allowedDiscordIds.includes(user.discordId || '')) {
        throw new ApiError('FORBIDDEN', 403, 'Discord ID not authorized for super admin');
    }

    return user;
}

/**
 * Log a super admin action to SuperAdminAuditLog
 * @internal Used by super admin endpoints
 */
export async function logSuperAdminAction(
    actorId: string,
    action: string,
    targetId?: string,
    targetType?: string,
    meta?: Record<string, any>,
    status: 'SUCCESS' | 'FAILED' = 'SUCCESS',
) {
    try {
        const headersList = await headers();
        const ipAddress = headersList.get('x-forwarded-for') || headersList.get('x-real-ip');
        const userAgent = headersList.get('user-agent');

        await db.superAdminAuditLog.create({
            data: {
                actorId,
                action,
                targetId,
                targetType,
                meta,
                ipAddress: ipAddress || 'unknown',
                userAgent: userAgent || 'unknown',
                status,
            },
        });
    } catch (error) {
        console.error('Failed to log super admin action:', error);
        // Don't throw - logging failure shouldn't break the action
    }
}

/**
 * Verify user is OWNER or ADMIN of a specific community
 * Super admins automatically have access to all communities
 * @param communityId - The community to check access for
 * @throws {ApiError} 401 if not authenticated, 403 if not authorized
 */
export async function requireCommunityAdmin(communityId: string) {
    const user = await getCurrentUser();

    // Super admins have access to all communities
    if (user.role === 'SUPER_ADMIN') {
        return user;
    }

    // Check if user is owner or admin of this community
    const membership = await db.communityMember.findUnique({
        where: {
            communityId_userId: {
                communityId,
                userId: user.id,
            },
        },
        select: {
            role: true,
        },
    });

    if (!membership || (membership.role !== 'OWNER' && membership.role !== 'ADMIN')) {
        throw new ApiError('FORBIDDEN', 403, 'Community admin access required');
    }

    return user;
}

/**
 * Verify user is a member of a specific community (any role)
 * @param communityId - The community to check membership for
 * @throws {ApiError} 401 if not authenticated, 403 if not a member
 */
export async function requireCommunityMember(communityId: string) {
    const user = await getCurrentUser();

    // Super admins have access to all communities
    if (user.role === 'SUPER_ADMIN') {
        return user;
    }

    // Check if user is a member of this community
    const membership = await db.communityMember.findUnique({
        where: {
            communityId_userId: {
                communityId,
                userId: user.id,
            },
        },
    });

    if (!membership) {
        throw new ApiError('FORBIDDEN', 403, 'Community membership required');
    }

    return user;
}

/**
 * Check if user owns a specific community
 * @param communityId - The community to check ownership for
 * @returns true if user is the owner or super admin
 */
export async function isCommunityOwner(communityId: string): Promise<boolean> {
    const user = await getCurrentUser();

    // Super admins have access to all communities
    if (user.role === 'SUPER_ADMIN') {
        return true;
    }

    const community = await db.community.findUnique({
        where: { id: communityId },
        select: { ownerId: true },
    });

    return community?.ownerId === user.id;
}

/**
 * Validate community access and return community data
 * Ensures the community exists and user has appropriate permissions
 * @param communityId - The community ID to validate
 * @param requireAdmin - If true, requires admin access; if false, requires membership
 * @throws {ApiError} 401/403 if not authorized, 404 if community not found
 */
export async function validateCommunityAccess(communityId: string, requireAdmin = false) {
    const user = requireAdmin ? await requireCommunityAdmin(communityId) : await requireCommunityMember(communityId);

    const community = await db.community.findUnique({
        where: { id: communityId },
        include: {
            subscription: true,
        },
    });

    if (!community) {
        throw new ApiError('COMMUNITY_NOT_FOUND', 404, 'Community not found');
    }

    return { user, community };
}
