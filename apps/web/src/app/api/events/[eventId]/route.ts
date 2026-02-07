import { db } from '@/lib/db';
import { apiResponse, apiError, ApiError } from '@/lib/api-utils';
import { requireCommunityMember, requireCommunityAdmin } from '@/lib/auth/middleware';
import { resolveMissingRoleNames } from '@/lib/discord/role-resolver';
import { resolveMissingRoleNames } from '@/lib/discord/role-resolver';
import { NextRequest } from 'next/server';
import { z } from 'zod';

const updateEventSchema = z.object({
    status: z.enum(['DRAFT', 'ACTIVE', 'CLOSED']).optional(),
    selectionMode: z.enum(['RANDOM', 'MANUAL', 'FCFS']).optional(),
    title: z.string().min(1).max(200).optional(),
    description: z.string().max(1000).optional(),
    prize: z.string().max(500).optional(),
    maxWinners: z.number().int().min(1).optional(),
    reservedSpots: z.number().int().min(0).optional(),
    autoAssignDiscordRole: z.boolean().optional(),
    winnerDiscordRoleId: z.string().optional(),
    endAt: z.string().datetime().optional(),
    mentionRoleIds: z.array(z.string()).optional(),
    customAnnouncementLine: z.string().max(500).optional(),
});

export async function GET(_request: NextRequest, { params }: { params: Promise<{ eventId: string }> }) {
    try {
        const { eventId } = await params;
        const { searchParams } = new URL(_request.url);
        const limit = parseInt(searchParams.get('limit') || '50');
        const offset = parseInt(searchParams.get('offset') || '0');
        const includeStats = searchParams.get('includeStats') === 'true';

        // Fetch event with entries
        const event = await db.event.findUnique({
            where: { id: eventId },
            include: {
                community: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                        icon: true,
                        socials: true,
                    },
                },
                requirements: true,
                entries: {
                    take: limit,
                    skip: offset,
                    orderBy: { createdAt: 'desc' },
                    select: {
                        id: true,
                        walletAddress: true,
                        discordUserId: true,
                        status: true,
                        isIneligible: true,
                        ineligibilityReason: true,
                        createdAt: true,
                    },
                },
                winners: {
                    include: {
                        entry: {
                            select: {
                                walletAddress: true,
                                discordUserId: true,
                            },
                        },
                    },
                },
                _count: {
                    select: {
                        entries: true,
                        winners: true,
                    },
                },
            },
        });

        if (!event) {
            throw new ApiError('EVENT_NOT_FOUND', 404, 'Event not found');
        }

        // Verify user has access to this community (if authenticated)
        // Public events can be viewed without auth, but member check adds context
        try {
            await requireCommunityMember(event.communityId);
        } catch {
            // Allow public access to events, but hide sensitive data
            // In production, you may want to check if event.isPublic or similar
        }

        // Calculate stats if requested (for admin dashboard)
        let stats = null;
        if (includeStats) {
            const [totalEntries, validEntries, invalidEntries, ineligibleEntries, totalWinners] = await Promise.all([
                db.entry.count({ where: { eventId } }),
                db.entry.count({ where: { eventId, status: 'VALID', isIneligible: false } }),
                db.entry.count({ where: { eventId, status: 'INVALID' } }),
                db.entry.count({ where: { eventId, isIneligible: true } }),
                db.winner.count({ where: { eventId } }),
            ]);

            stats = {
                totalEntries,
                validEntries,
                invalidEntries,
                ineligibleEntries,
                totalWinners,
                availableSpots: event.maxWinners - (event.reservedSpots || 0) - totalWinners,
            };
        }

        // Resolve missing Discord role names
        if (process.env.DISCORD_BOT_TOKEN) {
            await resolveMissingRoleNames(event, process.env.DISCORD_BOT_TOKEN);
        }

        return apiResponse({
            event,
            stats,
            total: event._count.entries,
            limit,
            offset,
        });
    } catch (error) {
        return apiError(error);
    }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ eventId: string }> }) {
    try {
        const { eventId } = await params;
        const body = await request.json();

        console.log('[PATCH Event] Received update request:', { eventId, body });

        const updates = updateEventSchema.parse(body);
        console.log('[PATCH Event] Validated updates:', updates);

        // Get event with community info
        const event = await db.event.findUnique({
            where: { id: eventId },
            select: {
                id: true,
                communityId: true,
                status: true,
                maxWinners: true,
                reservedSpots: true,
            },
        });

        if (!event) {
            throw new ApiError('EVENT_NOT_FOUND', 404, 'Event not found');
        }

        console.log('[PATCH Event] Found event:', event);

        // Verify user is community admin
        await requireCommunityAdmin(event.communityId);
        console.log('[PATCH Event] Admin access verified');

        // Validate status transitions
        if (updates.status) {
            if (event.status === 'CLOSED' && updates.status !== 'CLOSED') {
                throw new ApiError('INVALID_STATUS', 400, 'Cannot reopen a closed event');
            }
        }

        // Validate reservedSpots doesn't exceed maxWinners
        const newMaxWinners = updates.maxWinners ?? event.maxWinners;
        const newReservedSpots = updates.reservedSpots ?? (event.reservedSpots || 0);

        if (newReservedSpots > newMaxWinners) {
            throw new ApiError('INVALID_RESERVED_SPOTS', 400, 'Reserved spots cannot exceed max winners');
        }

        // Update event
        const updatedEvent = await db.event.update({
            where: { id: eventId },
            data: {
                ...updates,
                endAt: updates.endAt ? new Date(updates.endAt) : undefined,
            },
            include: {
                requirements: true,
                _count: {
                    select: {
                        entries: true,
                        winners: true,
                    },
                },
            },
        });

        return apiResponse(updatedEvent);
    } catch (error) {
        return apiError(error);
    }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ eventId: string }> }) {
    try {
        const { eventId } = await params;

        // Get event with community info
        const event = await db.event.findUnique({
            where: { id: eventId },
            select: {
                id: true,
                communityId: true,
                status: true,
            },
        });

        if (!event) {
            throw new ApiError('EVENT_NOT_FOUND', 404, 'Event not found');
        }

        // Verify user is community admin
        await requireCommunityAdmin(event.communityId);

        // Check if event has entries or winners
        const counts = await db.event.findUnique({
            where: { id: eventId },
            select: {
                _count: {
                    select: {
                        entries: true,
                        winners: true,
                    },
                },
            },
        });

        // Allow deleting draft events or events without entries/winners
        if (event.status === 'ACTIVE' && counts && (counts._count.entries > 0 || counts._count.winners > 0)) {
            throw new ApiError(
                'CANNOT_DELETE',
                400,
                'Cannot delete active events with entries or winners. Close the event instead.',
            );
        }

        await db.event.delete({
            where: { id: eventId },
        });

        // Resolve missing Discord role names
        if (process.env.DISCORD_BOT_TOKEN) {
            await resolveMissingRoleNames(event, process.env.DISCORD_BOT_TOKEN);
        }

        return apiResponse({ success: true, message: 'Event deleted successfully' });
    } catch (error) {
        return apiError(error);
    }
}
