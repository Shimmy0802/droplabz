import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const verifyGuildSchema = z.object({
    discordUserId: z.string(),
    guildId: z.string(),
});

/**
 * POST /api/discord/verify-guild
 * Verify if a Discord user is a member of a specific guild
 *
 * This endpoint checks:
 * 1. If the user is in the guild
 * 2. Their roles in that guild
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { discordUserId, guildId } = verifyGuildSchema.parse(body);

        const botToken = process.env.DISCORD_BOT_TOKEN;
        if (!botToken) {
            console.error('[Discord API] Missing DISCORD_BOT_TOKEN');
            return NextResponse.json({ error: 'Discord bot not configured' }, { status: 500 });
        }

        // Fetch guild member to check if user is in the server and get their roles
        const memberUrl = `https://discord.com/api/v10/guilds/${guildId}/members/${discordUserId}`;

        console.log(`[Discord Guild Verify] Checking membership: user=${discordUserId}, guild=${guildId}`);

        const response = await fetch(memberUrl, {
            method: 'GET',
            headers: {
                Authorization: `Bot ${botToken}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            if (response.status === 404) {
                console.log(`[Discord Guild Verify] User ${discordUserId} not in guild ${guildId}`);
                return NextResponse.json(
                    {
                        error: 'You are not a member of the required Discord server',
                        isMember: false,
                    },
                    { status: 404 },
                );
            }

            if (response.status === 401 || response.status === 403) {
                console.error(`[Discord Guild Verify] Permission denied accessing guild ${guildId}`);
                return NextResponse.json(
                    { error: 'Bot does not have permission to access this server' },
                    { status: 403 },
                );
            }

            console.error(`[Discord Guild Verify] API error: ${response.status}`);
            return NextResponse.json({ error: 'Unable to verify Discord membership' }, { status: response.status });
        }

        const member = await response.json();
        const userRoles = member.roles || [];

        console.log(`[Discord Guild Verify] User ${discordUserId} is a member. Roles: ${userRoles.length}`);

        return NextResponse.json({
            success: true,
            isMember: true,
            discordUserId,
            guildId,
            roles: userRoles,
            username: member.user?.username,
            nickname: member.nick,
            joinedAt: member.joined_at,
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Invalid request parameters', issues: error.issues }, { status: 400 });
        }

        console.error('[Discord Guild Verify] Error:', error);
        return NextResponse.json({ error: 'Failed to verify Discord membership' }, { status: 500 });
    }
}
