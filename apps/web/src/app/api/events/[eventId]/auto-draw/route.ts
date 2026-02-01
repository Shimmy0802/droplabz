import { NextRequest } from 'next/server';
import { apiResponse, apiError, ApiError } from '@/lib/api-utils';
import { requireCommunityAdmin } from '@/lib/auth/middleware';
import { db } from '@/lib/db';
import { z } from 'zod';

const scheduleAutoDrawSchema = z.object({
    enabled: z.boolean(),
    scheduledAt: z.string().datetime().optional(),
});

/**
 * Schedule automatic winner drawing at a specified time
 * POST /api/events/[eventId]/auto-draw
 *
 * Schedule automatic winner draws at specified times
 *
 * Note: This endpoint sets the schedule. The actual drawing would be triggered
 * by a cron job or scheduled task that checks for events with:
 * - status = ACTIVE
 * - endAt <= now
 * - autoDrawEnabled = true
 */
export async function POST(_request: NextRequest, { params }: { params: Promise<{ eventId: string }> }) {
    try {
        const { eventId } = await params;
        const body = await _request.json();
        const { enabled, scheduledAt } = scheduleAutoDrawSchema.parse(body);

        // Get event and verify access
        const event = await db.event.findUnique({
            where: { id: eventId },
            select: {
                id: true,
                communityId: true,
                selectionMode: true,
                status: true,
                endAt: true,
            },
        });

        if (!event) {
            throw new ApiError('EVENT_NOT_FOUND', 404, 'Event not found');
        }

        // Verify user is community admin
        const user = await requireCommunityAdmin(event.communityId);

        // Can't schedule auto-draw for FCFS (already automatic)
        if (event.selectionMode === 'FCFS') {
            throw new ApiError(
                'INVALID_SELECTION_MODE',
                400,
                'FCFS events automatically assign winners; manual scheduling not needed',
            );
        }

        // Update event with auto-draw settings
        // Note: We'd need to add these fields to the Event model:
        // - autoDrawEnabled: Boolean
        // - autoDrawScheduledAt: DateTime (optional override of endAt)

        // For now, we'll use the event's endAt as the auto-draw time
        // A cron job would check for events where:
        // - status = 'ACTIVE'
        // - endAt <= now
        // - autoDrawEnabled = true
        // Then call the draw winners API internally

        // Currently does not implement actual scheduling
        // TODO: Integrate with cron job service (e.g., bull, agenda, etc.)

        // Log action
        await db.auditLog.create({
            data: {
                communityId: event.communityId,
                actorId: user.id,
                action: 'AUTO_DRAW_SCHEDULED',
                meta: {
                    eventId,
                    enabled,
                    scheduledAt: scheduledAt || event.endAt.toISOString(),
                },
            },
        });

        return apiResponse({
            success: true,
            eventId,
            autoDrawEnabled: enabled,
            scheduledAt: scheduledAt || event.endAt.toISOString(),
            message: enabled
                ? 'Auto-draw will trigger when event ends'
                : 'Auto-draw disabled; winners must be drawn manually',
        });
    } catch (error) {
        return apiError(error);
    }
}

/**
 * Get auto-draw status for an event
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ eventId: string }> }) {
    try {
        const { eventId } = await params;

        const event = await db.event.findUnique({
            where: { id: eventId },
            select: {
                id: true,
                communityId: true,
                selectionMode: true,
                endAt: true,
                // autoDrawEnabled: true, (would need to add to schema)
                // autoDrawScheduledAt: true,
            },
        });

        if (!event) {
            throw new ApiError('EVENT_NOT_FOUND', 404, 'Event not found');
        }

        // Verify access
        await requireCommunityAdmin(event.communityId);

        return apiResponse({
            eventId,
            selectionMode: event.selectionMode,
            endAt: event.endAt,
            autoDrawEnabled: false, // Would read from event.autoDrawEnabled
            autoDrawScheduledAt: event.endAt, // Would read from event.autoDrawScheduledAt
        });
    } catch (error) {
        return apiError(error);
    }
}
