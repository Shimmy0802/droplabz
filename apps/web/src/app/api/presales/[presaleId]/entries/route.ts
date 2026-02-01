import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireCommunityAdmin } from '@/lib/auth/middleware';
import { z } from 'zod';

const createPresaleEntrySchema = z.object({
    presaleId: z.string().cuid(),
    walletAddress: z.string(),
    discordUserId: z.string().optional(),
});

/**
 * POST /api/presales/[presaleId]/entries
 * Submit entry to presale (assigns to tier based on requirements)
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ presaleId: string }> }) {
    try {
        const { presaleId } = await params;
        const body = await req.json();
        const { walletAddress, discordUserId } = createPresaleEntrySchema
            .pick({
                walletAddress: true,
                discordUserId: true,
            })
            .parse(body);

        // Get presale with tiers
        const presale = await db.presale.findUnique({
            where: { id: presaleId },
            include: {
                tiers: {
                    include: {
                        requirements: true,
                    },
                },
            },
        });

        if (!presale) {
            return NextResponse.json({ error: 'Presale not found' }, { status: 404 });
        }

        if (presale.status !== 'ACTIVE') {
            return NextResponse.json({ error: 'Presale is not accepting entries' }, { status: 400 });
        }

        // Check for duplicate entry (one per wallet per presale)
        const existingEntry = await db.entry.findFirst({
            where: {
                walletAddress,
                eventId: presaleId,
            },
        });

        if (existingEntry) {
            return NextResponse.json({ error: 'Already entered this presale' }, { status: 400 });
        }

        // Find which tier user qualifies for (iterate in order, assign to first match with available spots)
        let assignedTier = null;

        for (const tier of presale.tiers) {
            // Check if tier still has spots
            if (tier.spotsUsed >= tier.maxSpots) {
                continue;
            }

            // For now, assign to first tier with available spots
            // TODO: Implement actual requirement verification against Discord/Solana
            assignedTier = tier;
            break;
        }

        if (!assignedTier) {
            return NextResponse.json(
                { error: 'No tiers available (all full or no tiers configured)' },
                { status: 400 },
            );
        }

        // Create entry with tier metadata
        const entry = await db.entry.create({
            data: {
                eventId: presaleId,
                walletAddress,
                discordUserId,
                status: 'VALID',
                metadata: {
                    tierId: assignedTier.id,
                    tierName: assignedTier.name,
                    allocationAmount: assignedTier.allocationAmount,
                },
            },
        });

        // Update tier spot count
        await db.presaleTier.update({
            where: { id: assignedTier.id },
            data: {
                spotsUsed: assignedTier.spotsUsed + 1,
            },
        });

        return NextResponse.json(
            {
                entry,
                tier: {
                    id: assignedTier.id,
                    name: assignedTier.name,
                    allocationAmount: assignedTier.allocationAmount,
                },
            },
            { status: 201 },
        );
    } catch (error) {
        console.error('Error creating presale entry:', error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
        }
        return NextResponse.json({ error: 'Failed to create entry' }, { status: 500 });
    }
}

/**
 * GET /api/presales/[presaleId]/entries
 * Get entries for presale (admin only)
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ presaleId: string }> }) {
    try {
        const { presaleId } = await params;

        // Get presale and verify community access
        const presale = await db.presale.findUnique({
            where: { id: presaleId },
        });

        if (!presale) {
            return NextResponse.json({ error: 'Presale not found' }, { status: 404 });
        }

        // Verify community access
        await requireCommunityAdmin(presale.communityId);

        // Get all entries with tier info
        const entries = await db.entry.findMany({
            where: { eventId: presaleId },
            select: {
                id: true,
                walletAddress: true,
                discordUserId: true,
                metadata: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
        });

        // Transform to include tier info
        const transformed = entries.map(entry => ({
            id: entry.id,
            walletAddress: entry.walletAddress,
            discordUserId: entry.discordUserId,
            tierId: (entry.metadata as any)?.tierId || '',
            tierName: (entry.metadata as any)?.tierName || 'Unknown',
            allocationAmount: (entry.metadata as any)?.allocationAmount || 0,
            createdAt: entry.createdAt,
        }));

        return NextResponse.json(transformed);
    } catch (error) {
        console.error('Error fetching entries:', error);
        return NextResponse.json({ error: 'Failed to fetch entries' }, { status: 500 });
    }
}
