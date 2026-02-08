import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireCommunityAdmin } from '@/lib/auth/middleware';
import { db } from '@/lib/db';
import { buildWinnerAnnouncementEmbed } from '@/lib/utils/event-embed-helpers';
import { z } from 'zod';

const announceSchema = z.object({
    channelId: z.string(),
});

/**
 * POST /api/events/[eventId]/announce-winners
 * Announce the winners of an event to Discord
 *
 * Requires:
 * - User authenticated
 * - User is admin of the community
 * - Event exists
 * - Winners have been selected
 * - Discord channel ID provided
 */
export async function POST(req: NextRequest, { params }: { params: { eventId: string } }) {
    try {
        // Authenticate user
        const user = await requireAuth();

        // Parse and validate request
        const body = await req.json();
        const { channelId } = announceSchema.parse(body);

        // Fetch event
        const event = await db.event.findUnique({
            where: { id: params.eventId },
            include: {
                community: {
                    select: { id: true, guildId: true },
                },
                _count: {
                    select: { winners: true },
                },
                winners: {
                    select: {
                        entry: {
                            select: {
                                walletAddress: true,
                                discordUserId: true,
                            },
                        },
                    },
                    take: 20, // Max 20 winners per announcement
                },
            },
        });

        if (!event) {
            return NextResponse.json({ error: 'Event not found' }, { status: 404 });
        }

        // Verify user is community admin
        await requireCommunityAdmin(event.community.id);

        // Check if winners exist
        if (!event._count.winners) {
            return NextResponse.json({ error: 'No winners selected yet' }, { status: 400 });
        }

        // Check if guild is linked
        if (!event.community.guildId) {
            return NextResponse.json({ error: 'Discord guild not linked to community' }, { status: 400 });
        }

        console.log('[Winner Announce] Event:', {
            eventId: event.id,
            title: event.title,
            guildId: event.community.guildId,
            channelId,
            winnerCount: event._count.winners,
        });

        // Build winner announcement embed
        const embed = buildWinnerAnnouncementEmbed({
            title: event.title,
            prize: event.prize || undefined,
            type: event.type,
            winners: event.winners.map(w => ({
                walletAddress: w.entry.walletAddress,
                discordUserId: w.entry.discordUserId || undefined,
            })),
            selectionMode: event.selectionMode,
        });

        // Get Discord bot API URL
        const botApiUrl = process.env.DISCORD_BOT_API_URL || 'http://localhost:3001';

        console.log('[Winner Announce] Calling bot API:', {
            url: `${botApiUrl}/announce-winners`,
        });

        // Call bot API to post announcement
        const botResponse = await fetch(`${botApiUrl}/announce-winners`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                guildId: event.community.guildId,
                channelId,
                embed,
            }),
        });

        if (!botResponse.ok) {
            const error = await botResponse.json().catch(() => ({}));
            console.error('[Winner Announce] Bot API error:', error);
            return NextResponse.json(
                {
                    error: 'Failed to announce winners to Discord',
                    details: error.error || error.message,
                },
                { status: 500 },
            );
        }

        const result = await botResponse.json();

        console.log('[Winner Announce] Success:', {
            messageId: result.messageId,
            url: result.url,
        });

        // Mark winners as announced (if needed - update event flag)
        // await db.event.update({
        //     where: { id: params.eventId },
        //     data: { announced: true }
        // });

        return NextResponse.json({
            success: true,
            messageId: result.messageId,
            url: result.url,
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Invalid request data', issues: error.issues }, { status: 400 });
        }

        console.error('[Winner Announce] Error:', error);
        return NextResponse.json({ error: 'Failed to announce winners' }, { status: 500 });
    }
}
