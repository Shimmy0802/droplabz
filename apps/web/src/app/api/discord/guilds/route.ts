import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

interface DiscordGuild {
    id: string;
    name: string;
    icon: string | null;
    owner: boolean;
    permissions: string;
}

/**
 * GET /api/discord/guilds
 *
 * Fetch user's Discord guilds via Discord API
 * Requires valid session with Discord OAuth token
 */
export async function GET() {
    try {
        const session = await auth();

        if (!session || !session.user) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        // Get the Discord access token from the session
        const discordAccessToken = (session as any).discordAccessToken;

        if (!discordAccessToken) {
            return NextResponse.json({ error: 'Discord access token not available' }, { status: 401 });
        }

        // Fetch user's guilds from Discord API
        const response = await fetch('https://discord.com/api/v10/users/@me/guilds', {
            headers: {
                Authorization: `Bearer ${discordAccessToken}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch guilds from Discord');
        }

        const guilds: DiscordGuild[] = await response.json();

        // Filter to only include guilds where user is owner or has admin permissions
        const adminGuilds = guilds.filter(guild => {
            const isOwner = guild.owner;
            // Check if user has ADMINISTRATOR permission (bit 3)
            const hasAdmin = (BigInt(guild.permissions) & BigInt(1 << 3)) !== BigInt(0);
            return isOwner || hasAdmin;
        });

        return NextResponse.json({
            guilds: adminGuilds.map(guild => ({
                id: guild.id,
                name: guild.name,
                icon: guild.icon,
                owner: guild.owner,
                permissions: guild.permissions,
            })),
        });
    } catch (error) {
        console.error('Error fetching Discord guilds:', error);
        return NextResponse.json({ error: 'Failed to fetch Discord guilds' }, { status: 500 });
    }
}
