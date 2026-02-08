import { db } from '@/lib/db';
import { apiResponse, apiError, ApiError } from '@/lib/api-utils';
import { requireCommunityAdmin } from '@/lib/auth/middleware';
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { announceWinnersToDiscord } from '@/lib/discord/announce-winners';

const drawWinnersSchema = z.object({
    count: z.number().int().min(1).optional(),
    excludeEntryIds: z.array(z.string().cuid()).optional(),
});

/**
 * Draw random winners from eligible entries
 * Only draws from VALID entries that are not marked as ineligible
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ eventId: string }> }) {
    try {
        const { eventId } = await params;
        const body = await request.json();
        const { count, excludeEntryIds = [] } = drawWinnersSchema.parse(body);

        // Get event with community info
        const event = await db.event.findUnique({
            where: { id: eventId },
            select: {
                id: true,
                communityId: true,
                maxWinners: true,
                reservedSpots: true,
                selectionMode: true,
                status: true,
            },
        });

        // Fetch full event with community details for announcement
        const eventForAnnouncement = await db.event.findUnique({
            where: { id: eventId },
            include: {
                community: {
                    select: {
                        guildId: true,
                        discordWinnerChannelId: true,
                    },
                },
            },
        });

        if (!event) {
            throw new ApiError('EVENT_NOT_FOUND', 404, 'Event not found');
        }

        // Verify user is community admin
        const user = await requireCommunityAdmin(event.communityId);

        // Can't draw winners for FCFS events
        if (event.selectionMode === 'FCFS') {
            throw new ApiError(
                'INVALID_SELECTION_MODE',
                400,
                'Cannot manually draw winners for FCFS events (winners are auto-assigned)',
            );
        }

        // Get existing winners count
        const existingWinners = await db.winner.count({
            where: { eventId },
        });

        // Calculate available spots
        const maxWinners = event.maxWinners || 1;
        const reservedSpots = event.reservedSpots || 0;
        const availableSpots = maxWinners - reservedSpots - existingWinners;

        if (availableSpots <= 0) {
            throw new ApiError('NO_SPOTS_AVAILABLE', 400, 'No winner spots available');
        }

        // Determine how many winners to draw
        const drawCount = count ? Math.min(count, availableSpots) : availableSpots;

        // Get all eligible entries (VALID status, not ineligible, not already winners)
        const existingWinnerEntryIds = await db.winner
            .findMany({
                where: { eventId },
                select: { entryId: true },
            })
            .then(winners => winners.map(w => w.entryId));

        const eligibleEntries = await db.entry.findMany({
            where: {
                eventId,
                status: 'VALID',
                isIneligible: false,
                id: {
                    notIn: [...existingWinnerEntryIds, ...excludeEntryIds],
                },
            },
            select: {
                id: true,
                walletAddress: true,
                discordUserId: true,
            },
        });

        if (eligibleEntries.length === 0) {
            throw new ApiError('NO_ELIGIBLE_ENTRIES', 400, 'No eligible entries available to draw from');
        }

        // Randomly select winners
        const shuffled = eligibleEntries.sort(() => Math.random() - 0.5);
        const selectedEntries = shuffled.slice(0, Math.min(drawCount, eligibleEntries.length));

        // Create winner records
        const winners = await db.winner.createMany({
            data: selectedEntries.map(entry => ({
                eventId,
                entryId: entry.id,
                pickedBy: user.id,
            })),
        });

        // Get created winners with full details
        const createdWinners = await db.winner.findMany({
            where: {
                eventId,
                entryId: { in: selectedEntries.map(e => e.id) },
            },
            include: {
                entry: {
                    select: {
                        walletAddress: true,
                        discordUserId: true,
                        status: true,
                    },
                },
            },
        });

        // Auto-announce winners to Discord if enabled
        if (
            eventForAnnouncement?.autoAnnounceWinners &&
            eventForAnnouncement.community?.guildId &&
            eventForAnnouncement.community?.discordWinnerChannelId
        ) {
            try {
                await announceWinnersToDiscord({
                    eventId,
                    eventTitle: eventForAnnouncement.title || 'Event',
                    guildId: eventForAnnouncement.community.guildId,
                    channelId: eventForAnnouncement.community.discordWinnerChannelId,
                    winners: createdWinners.map(w => ({
                        walletAddress: w.entry.walletAddress,
                        discordUserId: w.entry.discordUserId || undefined,
                    })),
                    prize: eventForAnnouncement.prize || undefined,
                    type: eventForAnnouncement.type,
                    selectionMode: eventForAnnouncement.selectionMode,
                });
            } catch (error) {
                console.error('[Draw Winners] Failed to announce winners:', error);
                // Don't fail the draw if announcement fails, just log it
            }
        }

        return apiResponse(
            {
                winners: createdWinners,
                count: winners.count,
                totalEligible: eligibleEntries.length,
                remainingSpots: availableSpots - winners.count,
            },
            201,
        );
    } catch (error) {
        return apiError(error);
    }
}
