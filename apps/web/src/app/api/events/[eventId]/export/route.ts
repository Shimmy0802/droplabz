import { NextRequest } from 'next/server';
import { apiError, ApiError } from '@/lib/api-utils';
import { requireCommunityAdmin } from '@/lib/auth/middleware';
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

/**
 * Export event data (entries or winners) as CSV
 * GET /api/events/[eventId]/export?type=entries|winners
 *
 * Inspired by Subber: "export wallet addresses" and "full list of buyers,
 * their wallets, and transaction details, ready to export for your airdrop or mint claim"
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ eventId: string }> }) {
    try {
        const { eventId } = await params;
        const { searchParams } = new URL(request.url);
        const exportType = searchParams.get('type') || 'winners'; // 'entries' or 'winners'
        const includeIneligible = searchParams.get('includeIneligible') === 'true';

        // Get event and verify access
        const event = await db.event.findUnique({
            where: { id: eventId },
            select: {
                id: true,
                communityId: true,
                title: true,
                type: true,
            },
        });

        if (!event) {
            throw new ApiError('EVENT_NOT_FOUND', 404, 'Event not found');
        }

        // Verify user is community admin
        const user = await requireCommunityAdmin(event.communityId);

        let csvData: string;
        let filename: string;

        if (exportType === 'winners') {
            // Export winners only
            const winners = await db.winner.findMany({
                where: { eventId },
                include: {
                    entry: {
                        select: {
                            walletAddress: true,
                            discordUserId: true,
                            status: true,
                            isIneligible: true,
                            ineligibilityReason: true,
                            createdAt: true,
                        },
                    },
                },
                orderBy: { pickedAt: 'asc' },
            });

            // CSV Headers
            const headers = ['Wallet Address', 'Discord User ID', 'Status', 'Picked At', 'Entry Created At'];
            const rows = winners.map(w => [
                w.entry.walletAddress,
                w.entry.discordUserId || '',
                w.entry.status,
                w.pickedAt.toISOString(),
                w.entry.createdAt.toISOString(),
            ]);

            csvData = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
            filename = `${event.title.replace(/[^a-z0-9]/gi, '_')}_winners_${new Date().toISOString().split('T')[0]}.csv`;
        } else {
            // Export all entries
            const whereClause: any = { eventId };
            if (!includeIneligible) {
                whereClause.isIneligible = false;
            }

            const entries = await db.entry.findMany({
                where: whereClause,
                select: {
                    walletAddress: true,
                    discordUserId: true,
                    status: true,
                    isIneligible: true,
                    ineligibilityReason: true,
                    createdAt: true,
                    winners: {
                        select: {
                            pickedAt: true,
                        },
                        take: 1,
                    },
                },
                orderBy: { createdAt: 'asc' },
            });

            // CSV Headers
            const headers = [
                'Wallet Address',
                'Discord User ID',
                'Status',
                'Is Winner',
                'Is Ineligible',
                'Ineligibility Reason',
                'Created At',
            ];
            const rows = entries.map(e => [
                e.walletAddress,
                e.discordUserId || '',
                e.status,
                e.winners.length > 0 ? 'YES' : 'NO',
                e.isIneligible ? 'YES' : 'NO',
                e.ineligibilityReason || '',
                e.createdAt.toISOString(),
            ]);

            csvData = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
            filename = `${event.title.replace(/[^a-z0-9]/gi, '_')}_entries_${new Date().toISOString().split('T')[0]}.csv`;
        }

        // Log export action
        await db.auditLog.create({
            data: {
                communityId: event.communityId,
                actorId: user.id,
                action: `EXPORT_${exportType.toUpperCase()}`,
                meta: {
                    eventId,
                    eventTitle: event.title,
                    exportType,
                    includeIneligible,
                },
            },
        });

        // Return CSV file
        return new NextResponse(csvData, {
            status: 200,
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="${filename}"`,
            },
        });
    } catch (error) {
        return apiError(error);
    }
}
