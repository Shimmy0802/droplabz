import { NextRequest } from 'next/server';
import { apiResponse, apiError, ApiError } from '@/lib/api-utils';
import { requireCommunityAdmin } from '@/lib/auth/middleware';
import { db } from '@/lib/db';
import { z } from 'zod';

const markIneligibleSchema = z.object({
    entryIds: z.array(z.string().cuid()).min(1),
    reason: z.string().min(1).max(500),
});

/**
 * Mark entries as ineligible (manual admin override)
 * POST /api/events/[eventId]/entries/mark-ineligible
 *
 * Mark entries as ineligible before drawing winners
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ eventId: string }> }) {
    try {
        const { eventId } = await params;
        const body = await request.json();
        const { entryIds, reason } = markIneligibleSchema.parse(body);

        // Get event and verify access
        const event = await db.event.findUnique({
            where: { id: eventId },
            select: { communityId: true },
        });

        if (!event) {
            throw new ApiError('EVENT_NOT_FOUND', 404, 'Event not found');
        }

        // Verify user is community admin
        const user = await requireCommunityAdmin(event.communityId);

        // Verify all entries belong to this event
        const entries = await db.entry.findMany({
            where: {
                id: { in: entryIds },
                eventId,
            },
        });

        if (entries.length !== entryIds.length) {
            throw new ApiError('INVALID_ENTRIES', 400, 'Some entry IDs are invalid or do not belong to this event');
        }

        // Mark entries as ineligible
        const updated = await db.entry.updateMany({
            where: {
                id: { in: entryIds },
                eventId,
            },
            data: {
                isIneligible: true,
                ineligibilityReason: reason,
                updatedAt: new Date(),
            },
        });

        // Log admin action
        await db.auditLog.create({
            data: {
                communityId: event.communityId,
                actorId: user.id,
                action: 'ENTRIES_MARKED_INELIGIBLE',
                meta: {
                    eventId,
                    entryIds,
                    reason,
                    count: updated.count,
                },
            },
        });

        return apiResponse({
            success: true,
            markedCount: updated.count,
            entryIds,
            reason,
        });
    } catch (error) {
        return apiError(error);
    }
}
