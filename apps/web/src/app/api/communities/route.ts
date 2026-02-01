import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth/middleware';
import { apiResponse, apiError } from '@/lib/api-utils';
import { db } from '@/lib/db';
import { z } from 'zod';

const createCommunitySchema = z.object({
    name: z.string().min(1, 'Community name is required'),
    slug: z
        .string()
        .min(1, 'Slug is required')
        .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
    description: z.string().optional().default(''),
    guildId: z.string().optional().nullable(),
    categories: z.array(z.enum(['NFT', 'Gaming', 'DeFi', 'DAO', 'Community'])).optional(),
});

/**
 * POST /api/communities
 * Create a new community
 */
export async function POST(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        const body = await request.json();

        const validatedData = createCommunitySchema.parse(body);

        // Check if slug already exists
        const existing = await db.community.findUnique({
            where: { slug: validatedData.slug },
        });

        if (existing) {
            return apiError({ code: 'SLUG_EXISTS', status: 400, message: 'Slug already taken' });
        }

        // Create community
        const community = await db.community.create({
            data: {
                name: validatedData.name,
                slug: validatedData.slug,
                description: validatedData.description,
                ownerId: user.id,
                guildId: validatedData.guildId,
                categories: validatedData.categories || [],
                isVerified: false,
                verificationStatus: 'PENDING',
                verificationRequestedAt: new Date(),
            },
        });

        // Add creator as owner
        await db.communityMember.create({
            data: {
                communityId: community.id,
                userId: user.id,
                role: 'OWNER',
            },
        });

        // Create free subscription
        await db.subscription.create({
            data: {
                communityId: community.id,
                tier: 'FREE',
                status: 'ACTIVE',
            },
        });

        return apiResponse(community, 201);
    } catch (error) {
        return apiError(error);
    }
}

/**
 * PATCH /api/communities?id={id}&action=toggleListed
 * Update community settings
 */
export async function PATCH(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        const action = searchParams.get('action');

        if (!id) {
            return apiError({ code: 'MISSING_ID', status: 400, message: 'Community ID is required' });
        }

        // Verify user owns/manages the community
        const community = await db.community.findUnique({
            where: { id },
            select: { ownerId: true },
        });

        if (!community) {
            return apiError({ code: 'NOT_FOUND', status: 404, message: 'Community not found' });
        }

        if (community.ownerId !== user.id) {
            return apiError({
                code: 'FORBIDDEN',
                status: 403,
                message: 'Only the community owner can modify settings',
            });
        }

        if (action === 'toggleListed') {
            const current = await db.community.findUnique({
                where: { id },
                select: { isListed: true },
            });

            const updated = await db.community.update({
                where: { id },
                data: { isListed: !current?.isListed },
            });

            return apiResponse({
                success: true,
                isListed: updated.isListed,
                message: updated.isListed ? 'Community is now public' : 'Community is now private',
            });
        }

        if (action === 'connectGuild') {
            const body = await request.json();
            const { guildId, guildName } = body;

            if (!guildId) {
                return apiError({ code: 'MISSING_GUILD_ID', status: 400, message: 'Guild ID is required' });
            }

            const updated = await db.community.update({
                where: { id },
                data: {
                    guildId,
                    discordGuildName: guildName || null,
                },
            });

            return apiResponse({
                success: true,
                guildId: updated.guildId,
                guildName: updated.discordGuildName,
                message: 'Discord server connected successfully',
            });
        }

        if (action === 'disconnectGuild') {
            const updated = await db.community.update({
                where: { id },
                data: { guildId: null, discordGuildName: null, discordAnnouncementChannelId: null },
            });

            return apiResponse({
                success: true,
                guildId: updated.guildId,
                message: 'Discord server disconnected',
            });
        }

        if (action === 'setAnnouncementChannel') {
            const body = await request.json();
            const { channelId, channelName } = body;

            if (!channelId) {
                return apiError({ code: 'MISSING_CHANNEL_ID', status: 400, message: 'Channel ID is required' });
            }

            const updated = await db.community.update({
                where: { id },
                data: {
                    discordAnnouncementChannelId: channelId,
                    discordAnnouncementChannelName: channelName || null,
                },
            });

            return apiResponse({
                success: true,
                channelId: updated.discordAnnouncementChannelId,
                channelName: updated.discordAnnouncementChannelName,
                message: 'Announcement channel updated successfully',
            });
        }

        return apiError({
            code: 'UNKNOWN_ACTION',
            status: 400,
            message: `Unknown action: ${action}`,
        });
    } catch (error) {
        return apiError(error);
    }
}

/**
 * GET /api/communities
 * Get communities by slug/id, list user's communities, or public communities
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const slug = searchParams.get('slug');
        const id = searchParams.get('id');

        // Public access: Get community by slug (no auth required)
        if (slug) {
            const community = await db.community.findUnique({
                where: { slug },
                select: {
                    id: true,
                    slug: true,
                    name: true,
                    description: true,
                    icon: true,
                    banner: true,
                    ownerId: true,
                    guildId: true,
                    discordGuildName: true,
                    discordAnnouncementChannelId: true,
                    discordAnnouncementChannelName: true,
                    categories: true,
                    tags: true,
                    rating: true,
                    nftMintAddress: true,
                    socials: true,
                    isListed: true,
                    isFeatured: true,
                    isVerified: true,
                    verificationStatus: true,
                    verificationTicketId: true,
                    verificationRequestedAt: true,
                    createdAt: true,
                    _count: {
                        select: { members: true },
                    },
                    owner: {
                        select: {
                            id: true,
                            username: true,
                        },
                    },
                },
            });

            if (!community) {
                return apiError({ code: 'NOT_FOUND', status: 404, message: 'Community not found' });
            }

            return apiResponse(community);
        }

        // Check if requesting all public communities (no auth required)
        const isPublicListing = searchParams.get('public') === 'true';

        if (isPublicListing) {
            // Public listing - show all listed communities
            const communities = await db.community.findMany({
                where: {
                    isListed: true,
                    isVerified: true,
                },
                select: {
                    id: true,
                    name: true,
                    slug: true,
                    description: true,
                    icon: true,
                    banner: true,
                    categories: true,
                    tags: true,
                    isFeatured: true,
                    isVerified: true,
                    rating: true,
                    nftMintAddress: true,
                    socials: true,
                    createdAt: true,
                    _count: {
                        select: { members: true },
                    },
                    owner: {
                        select: {
                            id: true,
                            username: true,
                        },
                    },
                },
                orderBy: [{ isFeatured: 'desc' }, { rating: 'desc' }, { createdAt: 'desc' }],
            });

            return apiResponse(communities);
        }

        // For user-specific operations, require authentication
        const user = await getCurrentUser();

        if (id) {
            const community = await db.community.findUnique({
                where: { id },
                include: {
                    _count: {
                        select: { members: true },
                    },
                },
            });

            if (!community) {
                return apiError({ code: 'NOT_FOUND', status: 404, message: 'Community not found' });
            }

            return apiResponse(community);
        }

        // Get user's communities (both owned and member of)
        const communities = await db.community.findMany({
            where: {
                members: {
                    some: {
                        userId: user.id,
                    },
                },
            },
            include: {
                _count: {
                    select: { members: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        return apiResponse(communities);
    } catch (error) {
        return apiError(error);
    }
}
