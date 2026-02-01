import { db } from '@/lib/db';
import { apiResponse, apiError, ApiError } from '@/lib/api-utils';
import { requireCommunityAdmin } from '@/lib/auth/middleware';
import { NextRequest } from 'next/server';

/**
 * Detect potential duplicate entries by:
 * 1. Same walletAddress in multiple entries
 * 2. Same discordUserId with different wallets
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ eventId: string }> }) {
    try {
        const { eventId } = await params;

        // Get event with community info
        const event = await db.event.findUnique({
            where: { id: eventId },
            select: {
                id: true,
                communityId: true,
            },
        });

        if (!event) {
            throw new ApiError('EVENT_NOT_FOUND', 404, 'Event not found');
        }

        // Verify user is community admin
        await requireCommunityAdmin(event.communityId);

        // Find entries with same walletAddress (shouldn't happen due to unique constraint, but check anyway)
        const walletDuplicates = await db.$queryRaw<Array<{ walletAddress: string; count: number }>>`
            SELECT "walletAddress", COUNT(*) as count
            FROM "Entry"
            WHERE "eventId" = ${eventId}
            GROUP BY "walletAddress"
            HAVING COUNT(*) > 1
        `;

        // Find entries with same discordUserId but different wallets
        const discordDuplicates = await db.$queryRaw<Array<{ discordUserId: string; count: number }>>`
            SELECT "discordUserId", COUNT(DISTINCT "walletAddress") as count
            FROM "Entry"
            WHERE "eventId" = ${eventId} AND "discordUserId" IS NOT NULL
            GROUP BY "discordUserId"
            HAVING COUNT(DISTINCT "walletAddress") > 1
        `;

        // Get full entry details for duplicates
        const walletAddresses = walletDuplicates.map(d => d.walletAddress);
        const discordUserIds = discordDuplicates.map(d => d.discordUserId);

        const duplicateEntries = await db.entry.findMany({
            where: {
                eventId,
                OR: [{ walletAddress: { in: walletAddresses } }, { discordUserId: { in: discordUserIds } }],
            },
            orderBy: [{ discordUserId: 'asc' }, { createdAt: 'asc' }],
        });

        return apiResponse({
            walletDuplicates,
            discordDuplicates,
            duplicateEntries,
            totalDuplicates: duplicateEntries.length,
        });
    } catch (error) {
        return apiError(error);
    }
}
