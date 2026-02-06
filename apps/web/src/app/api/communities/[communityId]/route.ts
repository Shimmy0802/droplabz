import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, requireCommunityAdmin } from '@/lib/auth/middleware';
import { db } from '@/lib/db';
import { ApiError } from '@/lib/api-utils';
import { z } from 'zod';

// Validate Solana public key format (base58, ~44 chars)
const isSolanaPubkey = (str: string): boolean => {
    if (!str) return true; // Optional field
    return /^[1-9A-HJ-NP-Z]{43,44}$/.test(str);
};

const updateCommunitySchema = z.object({
    name: z.string().min(1, 'Community name is required').optional(),
    description: z.string().nullable().optional(),
    icon: z
        .union([z.string().url('Icon must be a valid URL'), z.string().startsWith('/'), z.literal(''), z.null()])
        .optional(),
    banner: z
        .union([z.string().url('Banner must be a valid URL'), z.string().startsWith('/'), z.literal(''), z.null()])
        .optional(),
    nftMintAddress: z.string().refine(isSolanaPubkey, 'Invalid Solana public key format').nullable().optional(),
    categories: z.array(z.enum(['NFT', 'Gaming', 'DeFi', 'DAO', 'Community'])).optional(),
    socials: z
        .object({
            twitter: z.union([z.string().url('Twitter must be a valid URL'), z.literal(''), z.null()]).optional(),
            discord: z.union([z.string().url('Discord must be a valid URL'), z.literal(''), z.null()]).optional(),
            website: z.union([z.string().url('Website must be a valid URL'), z.literal(''), z.null()]).optional(),
            instagram: z.union([z.string().url('Instagram must be a valid URL'), z.literal(''), z.null()]).optional(),
        })
        .nullable()
        .optional(),
    isListed: z.boolean().optional(),
});

/**
 * GET /api/communities/[communityId]
 * Get community details
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ communityId: string }> }) {
    try {
        const { communityId } = await params;

        const community = await db.community.findUnique({
            where: { id: communityId },
            include: {
                subscription: true,
                _count: {
                    select: {
                        events: true,
                        members: true,
                    },
                },
            },
        });

        if (!community) {
            return NextResponse.json({ error: 'Community not found' }, { status: 404 });
        }

        return NextResponse.json(community);
    } catch (error) {
        console.error('[API Error] GET /api/communities/[communityId]:', error);

        if (error instanceof ApiError) {
            return NextResponse.json({ error: error.code, message: error.message }, { status: error.statusCode });
        }

        return NextResponse.json(
            { error: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch community' },
            { status: 500 },
        );
    }
}

/**
 * PATCH /api/communities/[communityId]
 * Update community details (admin only)
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ communityId: string }> }) {
    try {
        const { communityId } = await params;
        const user = await getCurrentUser();

        // Verify user is admin of this community
        await requireCommunityAdmin(communityId);

        const body = await request.json();
        console.log('[PATCH Community] Request body:', JSON.stringify(body, null, 2));
        
        const validatedData = updateCommunitySchema.parse(body);
        console.log('[PATCH Community] Validation successful');

        // Build update data (only include provided fields)
        const updateData: Record<string, unknown> = {};

        if (validatedData.name !== undefined) {
            updateData.name = validatedData.name;
        }
        if (validatedData.description !== undefined) {
            updateData.description = validatedData.description;
        }
        if (validatedData.icon !== undefined) {
            updateData.icon = validatedData.icon;
        }
        if (validatedData.banner !== undefined) {
            updateData.banner = validatedData.banner;
        }
        if (validatedData.nftMintAddress !== undefined) {
            updateData.nftMintAddress = validatedData.nftMintAddress;
        }
        if (validatedData.categories !== undefined) {
            updateData.categories = validatedData.categories;
        }
        if (validatedData.socials !== undefined) {
            updateData.socials = validatedData.socials;
        }
        if (validatedData.isListed !== undefined) {
            updateData.isListed = validatedData.isListed;
        }

        // Update community
        const updatedCommunity = await db.community.update({
            where: { id: communityId },
            data: updateData,
            include: {
                subscription: true,
            },
        });

        // Log the action
        await db.auditLog.create({
            data: {
                communityId,
                actorId: user.id,
                action: 'UPDATE_COMMUNITY',
                meta: {
                    changedFields: Object.keys(validatedData).filter(
                        k => (validatedData as Record<string, unknown>)[k] !== undefined,
                    ),
                },
            },
        });

        return NextResponse.json(updatedCommunity);
    } catch (error) {
        console.error('[API Error] PATCH /api/communities/[communityId]:', error);

        if (error instanceof z.ZodError) {
            console.error('[Zod Validation Error] Issues:', JSON.stringify(error.issues, null, 2));
            return NextResponse.json(
                {
                    error: 'VALIDATION_ERROR',
                    message: 'Invalid request data',
                    issues: error.issues,
                },
                { status: 400 },
            );
        }

        if (error instanceof ApiError) {
            return NextResponse.json({ error: error.code, message: error.message }, { status: error.statusCode });
        }

        return NextResponse.json(
            { error: 'INTERNAL_SERVER_ERROR', message: 'Failed to update community' },
            { status: 500 },
        );
    }
}
