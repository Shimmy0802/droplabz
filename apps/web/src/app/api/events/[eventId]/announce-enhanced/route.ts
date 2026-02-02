import { NextRequest, NextResponse } from 'next/server';
import { requireCommunityAdmin, getCurrentUser } from '@/lib/auth/middleware';
import { db } from '@/lib/db';
import { z } from 'zod';

/**
 * Enhanced announcement builder for web API
 * Generates embeds compatible with the enhanced Discord bot system
 */

const announceEventSchema = z.object({
    eventId: z.string().cuid(),
    communityId: z.string().cuid(),
});

export async function POST(req: NextRequest) {
    try {
        await requireCommunityAdmin(req.nextUrl.searchParams.get('communityId') || '');
        const user = await getCurrentUser();

        const body = await req.json();
        const { eventId, communityId } = announceEventSchema.parse(body);

        // Verify community admin access
        await requireCommunityAdmin(communityId);

        // Fetch event with all necessary data
        const event = await db.event.findUnique({
            where: { id: eventId, communityId },
            include: {
                community: {
                    select: {
                        id: true,
                        name: true,
                        socials: true,
                        guildId: true,
                        discordAnnouncementChannelId: true,
                    },
                },
                requirements: true,
            },
        });

        if (!event) {
            return NextResponse.json({ error: 'Event not found' }, { status: 404 });
        }

        // Build announcement data for bot
        const announcementData = buildAnnouncementData(event);

        // Call bot API to post announcement
        const botResponse = await fetch(
            `${process.env.DISCORD_BOT_API_URL || 'http://localhost:3001'}/announce-enhanced`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    guildId: event.community.guildId,
                    channelId: event.community.discordAnnouncementChannelId,
                    data: announcementData,
                }),
            },
        );

        if (!botResponse.ok) {
            const error = await botResponse.json();
            return NextResponse.json({ error: 'Failed to post announcement', details: error }, { status: 500 });
        }

        const result = await botResponse.json();

        // Log the announcement
        await db.eventAnnouncement.create({
            data: {
                eventId,
                communityId,
                trigger: 'MANUAL',
                status: 'SENT',
                discordMessageId: result.messageId,
                discordChannelId: event.community.discordAnnouncementChannelId,
                discordGuildId: event.community.guildId,
                sentAt: new Date(),
                triggeredBy: user.id,
            },
        });

        return NextResponse.json({
            success: true,
            messageId: result.messageId,
            url: result.url,
        });
    } catch (error) {
        console.error('Error announcing event:', error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Invalid request data', issues: error.issues }, { status: 400 });
        }
        return NextResponse.json({ error: 'Failed to announce event' }, { status: 500 });
    }
}

/**
 * Convert event database record to announcement data for bot
 */
function buildAnnouncementData(event: any) {
    // Parse community socials
    const links = event.community.socials || {};

    // Format requirements
    const requirementsArray =
        event.requirements?.map((req: any) => ({
            type: req.type,
            description: formatRequirementDescription(req.type, req.config),
        })) || [];

    return {
        eventId: event.id,
        eventTitle: event.title,
        eventType: event.type,
        description: event.description,
        imageUrl: event.imageUrl,
        prize: event.prize,
        endAt: event.endAt.toISOString(),
        maxWinners: event.maxWinners,
        selectionMode: event.selectionMode,
        requirements: requirementsArray,
        links,
        eventUrl: `${process.env.APP_BASE_URL}/events/${event.id}`,
    };
}

/**
 * Format requirement description from type and config
 */
function formatRequirementDescription(type: string, config: any): string {
    const descriptions: Record<string, (config: any) => string> = {
        DISCORD_MEMBER_REQUIRED: () => 'Discord account required',
        DISCORD_ROLE_REQUIRED: cfg => `Must have role: ${cfg.roleName || 'verified'}`,
        DISCORD_ACCOUNT_AGE: cfg => `Account must be ${cfg.minDays || 7}+ days old`,
        TOKEN_HOLDING_REQUIRED: cfg => `Hold at least ${cfg.minAmount || 1} ${cfg.tokenSymbol || 'tokens'}`,
        NFT_OWNERSHIP_REQUIRED: cfg => `Own an NFT from: ${cfg.collectionName || 'verified collection'}`,
        WALLET_REQUIRED: () => 'Solana wallet required',
        INVITE_REQUIREMENT: () => 'Discord server invite required',
    };

    const formatter = descriptions[type];
    if (formatter) {
        return formatter(config);
    }

    return `Requirement: ${type}`;
}
