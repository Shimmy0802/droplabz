import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, requireCommunityAdmin } from '@/lib/auth/middleware';
import { db } from '@/lib/db';
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
        .string()
        .refine(
            val => !val || val.startsWith('/') || val.startsWith('http://') || val.startsWith('https://'),
            'Icon must be a valid URL or file path',
        )
        .nullable()
        .optional(),
    banner: z
        .string()
        .refine(
            val => !val || val.startsWith('/') || val.startsWith('http://') || val.startsWith('https://'),
            'Banner must be a valid URL or file path',
        )
        .nullable()
        .optional(),
    nftMintAddress: z.string().refine(isSolanaPubkey, 'Invalid Solana public key format').nullable().optional(),
    categories: z.array(z.enum(['NFT', 'Gaming', 'DeFi', 'DAO', 'Community'])).optional(),
    socials: z
        .object({
            twitter: z
                .string()
                .refine(
                    val => !val || val.startsWith('http://') || val.startsWith('https://'),
                    'Twitter must be a valid URL',
                )
                .nullable()
                .optional(),
            discord: z
                .string()
                .refine(
                    val => !val || val.startsWith('http://') || val.startsWith('https://'),
                    'Discord must be a valid URL',
                )
                .nullable()
                .optional(),
            website: z
                .string()
                .refine(
                    val => !val || val.startsWith('http://') || val.startsWith('https://'),
                    'Website must be a valid URL',
                )
                .nullable()
                .optional(),
            instagram: z
                .string()
                .refine(
                    val => !val || val.startsWith('http://') || val.startsWith('https://'),
                    'Instagram must be a valid URL',
                )
                .nullable()
                .optional(),
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
        console.error('Error fetching community:', error);
        return NextResponse.json({ error: 'Failed to fetch community' }, { status: 500 });
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
        const validatedData = updateCommunitySchema.parse(body);

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
        console.error('Error updating community:', error);

        if (error instanceof z.ZodError) {
            return NextResponse.json(
                {
                    error: 'Invalid data',
                    issues: error.issues,
                },
                { status: 400 },
            );
        }

        return NextResponse.json({ error: 'Failed to update community' }, { status: 500 });
    }
}
