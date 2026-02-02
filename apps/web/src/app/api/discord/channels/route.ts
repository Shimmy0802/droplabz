import { auth } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import { ApiError } from '@/lib/api-utils';

interface DiscordChannel {
    id: string;
    name: string;
    type: number; // 0 = text, 1 = DM, 2 = voice, etc.
    parent_id: string | null;
    position: number;
}

/**
 * GET /api/discord/channels?guildId=XXX
 *
 * Fetch text channels from a connected Discord guild
 * Requires valid session with Discord OAuth token and valid guildId
 */
export async function GET(req: NextRequest) {
    try {
        const session = await auth();

        if (!session || !session.user) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        // Get guildId from query params
        const guildId = req.nextUrl.searchParams.get('guildId');
        if (!guildId) {
            return NextResponse.json({ error: 'guildId is required' }, { status: 400 });
        }

        // Use bot token to fetch channels (bot must be in the guild)
        const botToken = process.env.DISCORD_BOT_TOKEN;
        if (!botToken) {
            return NextResponse.json({ error: 'Bot token not configured' }, { status: 500 });
        }

        console.log('Fetching channels for guild:', guildId);

        // Fetch channels from Discord API using bot token
        const response = await fetch(`https://discord.com/api/v10/guilds/${guildId}/channels`, {
            headers: {
                Authorization: `Bot ${botToken}`,
            },
        });

        if (!response.ok) {
            const error = await response.text();
            console.error('Discord API error response:', error);
            console.error('Request details:', { guildId });
            return NextResponse.json({ error: 'Discord API error', details: error }, { status: response.status });
        }

        const channels: DiscordChannel[] = await response.json();

        // Filter to only text channels (type 0)
        const textChannels = channels
            .filter(channel => channel.type === 0)
            .sort((a, b) => a.position - b.position)
            .map(channel => ({
                id: channel.id,
                name: channel.name,
            }));

        return NextResponse.json({ channels: textChannels });
    } catch (error) {
        console.error('[API Error] GET /api/discord/channels:', error);
        
        if (error instanceof ApiError) {
            return NextResponse.json(
                { error: error.code, message: error.message },
                { status: error.statusCode }
            );
        }

        return NextResponse.json(
            { error: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch Discord channels' },
            { status: 500 }
        );
    }
}
