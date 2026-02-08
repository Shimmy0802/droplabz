import { buildWinnerAnnouncementEmbed } from '@/lib/utils/event-embed-helpers';

export interface WinnerData {
    walletAddress: string;
    discordUserId?: string;
}

/**
 * Announce winners to Discord via the bot API
 */
export async function announceWinnersToDiscord(options: {
    eventId: string;
    eventTitle: string;
    guildId: string;
    channelId: string;
    winners: WinnerData[];
    prize?: string;
    type?: string;
    selectionMode?: string;
}): Promise<{ messageId: string; url: string }> {
    const {
        eventId,
        eventTitle,
        guildId,
        channelId,
        winners,
        prize,
        type = 'GIVEAWAY',
        selectionMode = 'RANDOM',
    } = options;

    if (!channelId) {
        throw new Error('Discord channel ID not provided');
    }

    if (!guildId) {
        throw new Error('Discord guild ID not provided');
    }

    if (winners.length === 0) {
        throw new Error('No winners to announce');
    }

    console.log('[Announce Winners] Starting announcement:', {
        eventId,
        guildId,
        channelId,
        winnerCount: winners.length,
        eventTitle,
    });

    // Build the winner announcement embed
    const embed = buildWinnerAnnouncementEmbed({
        title: eventTitle,
        prize,
        type,
        winners,
        selectionMode,
    });

    // Call the Discord bot API
    const botApiUrl = process.env.DISCORD_BOT_API_URL || 'http://localhost:3001';

    console.log('[Announce Winners] Calling bot API:', {
        url: `${botApiUrl}/announce-winners`,
    });

    try {
        const response = await fetch(`${botApiUrl}/announce-winners`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                guildId,
                channelId,
                embed,
            }),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(
                error.error || error.message || `Bot API returned ${response.status}: ${response.statusText}`,
            );
        }

        const result = await response.json();

        console.log('[Announce Winners] Success:', {
            messageId: result.messageId,
            url: result.url,
        });

        return result;
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('[Announce Winners] Failed:', errorMessage);
        throw new Error(`Failed to announce winners to Discord: ${errorMessage}`);
    }
}
