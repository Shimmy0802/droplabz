import { db } from '@/lib/db';
import { apiResponse, apiError, ApiError } from '@/lib/api-utils';
import { requireCommunityAdmin } from '@/lib/auth/middleware';
import { NextRequest } from 'next/server';
import { z } from 'zod';

const markIneligibleSchema = z.object({
    isIneligible: z.boolean(),
    reason: z.string().min(1).max(500).optional(),
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ entryId: string }> }) {
    try {
        const { entryId } = await params;
        const body = await request.json();
        const { isIneligible, reason } = markIneligibleSchema.parse(body);

        // Get entry with event and community info
        const entry = await db.entry.findUnique({
            where: { id: entryId },
            include: {
                event: {
                    select: {
                        id: true,
                        communityId: true,
                    },
                },
            },
        });

        if (!entry) {
            throw new ApiError('ENTRY_NOT_FOUND', 404, 'Entry not found');
        }

        // Verify user is community admin
        await requireCommunityAdmin(entry.event.communityId);

        // If marking as eligible, remove winner records
        if (!isIneligible) {
            await db.winner.deleteMany({
                where: { entryId },
            });
        }

        // Update entry
        const updatedEntry = await db.entry.update({
            where: { id: entryId },
            data: {
                isIneligible,
                ineligibilityReason: isIneligible ? reason : null,
            },
        });

        return apiResponse(updatedEntry);
    } catch (error) {
        return apiError(error);
    }
}
