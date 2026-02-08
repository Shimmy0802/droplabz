import { db } from '@/lib/db';
import { apiResponse, apiError, ApiError } from '@/lib/api-utils';
import { requireCommunityAdmin } from '@/lib/auth/middleware';
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { announceWinnersToDiscord } from '@/lib/discord/announce-winners';

const pickWinnersSchema = z.object({
    entryIds: z.array(z.string().cuid()),
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ eventId: string }> }) {
    try {
        const { eventId } = await params;
        const body = await request.json();
        const { entryIds } = pickWinnersSchema.parse(body);

        // Get event with community info
        const event = await db.event.findUnique({
            where: { id: eventId },
            include: {
                community: true,
            },
        });

        if (!event) {
            throw new ApiError('EVENT_NOT_FOUND', 404, 'Event not found');
        }

        // Verify user is community admin
        const user = await requireCommunityAdmin(event.communityId);

        // Verify all entries exist, belong to this event, and are eligible
        const entries = await db.entry.findMany({
            where: {
                id: { in: entryIds },
                eventId,
            },
        });

        if (entries.length !== entryIds.length) {
            throw new ApiError('INVALID_ENTRIES', 400, 'Some entries are invalid or not found');
        }

        // Check for ineligible entries
        const ineligibleEntries = entries.filter(e => e.isIneligible);
        if (ineligibleEntries.length > 0) {
            throw new ApiError(
                'INELIGIBLE_ENTRIES',
                400,
                `Cannot select ${ineligibleEntries.length} ineligible entries as winners`,
            );
        }

        // Check for entries that are not VALID
        const invalidEntries = entries.filter(e => e.status !== 'VALID');
        if (invalidEntries.length > 0) {
            throw new ApiError(
                'INVALID_ENTRY_STATUS',
                400,
                `${invalidEntries.length} entries have not passed verification (status must be VALID)`,
            );
        }

        // Check if event has enough winner slots (accounting for reserved spots)
        const existingWinners = await db.winner.count({
            where: { eventId },
        });

        const availableSpots = event.maxWinners - (event.reservedSpots || 0) - existingWinners;

        if (entryIds.length > availableSpots) {
            throw new ApiError(
                'TOO_MANY_WINNERS',
                400,
                `Cannot select ${entryIds.length} winners. Only ${availableSpots} slots available (${event.maxWinners} max - ${event.reservedSpots || 0} reserved - ${existingWinners} already selected)`,
            );
        }

        // Create winners
        const winners = await db.winner.createMany({
            data: entryIds.map(entryId => ({
                eventId,
                entryId,
                pickedBy: user.id,
            })),
        });

        // Get created winners with entry details
        const createdWinners = await db.winner.findMany({
            where: {
                eventId,
                entryId: { in: entryIds },
            },
            include: {
                entry: true,
            },
        });

        // Auto-announce winners to Discord if enabled
        if (event.autoAnnounceWinners && event.community?.guildId && event.community?.discordWinnerChannelId) {
            try {
                await announceWinnersToDiscord({
                    eventId,
                    eventTitle: event.title || 'Event',
                    guildId: event.community.guildId,
                    channelId: event.community.discordWinnerChannelId,
                    winners: createdWinners.map(w => ({
                        walletAddress: w.entry.walletAddress,
                        discordUserId: w.entry.discordUserId || undefined,
                    })),
                    prize: event.prize || undefined,
                    type: event.type,
                    selectionMode: event.selectionMode,
                });
            } catch (error) {
                console.error('[Manual Winners] Failed to announce winners:', error);
                // Don't fail if announcement fails
            }
        }

        return apiResponse({ winners: createdWinners, count: winners.count }, 201);
    } catch (error) {
        return apiError(error);
    }
}

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

        // Get all winners for this event
        const winners = await db.winner.findMany({
            where: { eventId },
            include: {
                entry: {
                    select: {
                        id: true,
                        walletAddress: true,
                        discordUserId: true,
                        status: true,
                        createdAt: true,
                    },
                },
            },
            orderBy: { pickedAt: 'desc' },
        });

        return apiResponse({ winners, count: winners.length });
    } catch (error) {
        return apiError(error);
    }
}
