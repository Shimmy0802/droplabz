import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { db } from '@/lib/db';
import { z } from 'zod';

const getRolesSchema = z.object({
    guildId: z.string(),
});

/**
 * GET /api/discord/my-roles?guildId={guildId}
 * Get the current user's roles in a specific Discord guild
 *
 * Requires:
 * - User must be authenticated
 * - User must have linked Discord account
 * - User must have Discord access token
 */
export async function GET(req: NextRequest) {
    try {
        // Authenticate user
        const session = await requireAuth();
        const userId = session.user.id;

        // Get query parameters
        const searchParams = req.nextUrl.searchParams;
        const guildId = searchParams.get('guildId');

        const { guildId: validatedGuildId } = getRolesSchema.parse({ guildId });

        // Get user's Discord ID and access token
        const dbUser = await db.user.findUnique({
            where: { id: userId },
            select: { discordId: true, discordAccessToken: true },
        });

        if (!dbUser?.discordId) {
            return NextResponse.json({ error: 'Discord account not linked' }, { status: 400 });
        }

        const botToken = process.env.DISCORD_BOT_TOKEN;
        if (!botToken) {
            console.error('[Discord Roles] Missing DISCORD_BOT_TOKEN');
            return NextResponse.json({ error: 'Discord bot not configured' }, { status: 500 });
        }

        // Fetch guild member info using bot token
        const memberUrl = `https://discord.com/api/v10/guilds/${validatedGuildId}/members/${dbUser.discordId}`;

        console.log(`[Discord Roles] Fetching member info from Discord API`, {
            memberUrl,
            guildId: validatedGuildId,
            discordUserId: dbUser.discordId,
        });

        const response = await fetch(memberUrl, {
            method: 'GET',
            headers: {
                Authorization: `Bot ${botToken}`,
                'Content-Type': 'application/json',
            },
        });

        console.log(`[Discord Roles] Discord API response status: ${response.status} ${response.statusText}`);

        if (!response.ok) {
            if (response.status === 404) {
                console.warn(`[Discord Roles] User ${dbUser.discordId} is not a member of guild ${validatedGuildId}`);
                return NextResponse.json(
                    {
                        error: 'You are not a member of this Discord server',
                        isMember: false,
                        roleIds: [],
                        roleNames: {},
                        success: false,
                    },
                    { status: 404 },
                );
            }

            const errorText = await response.text().catch(() => 'No error details');
            console.error(`[Discord Roles] API error: ${response.status} ${response.statusText}`, {
                error: errorText,
                guildId: validatedGuildId,
                discordUserId: dbUser.discordId,
            });
            return NextResponse.json(
                {
                    error: 'Unable to fetch Discord roles',
                    success: false,
                    roleIds: [],
                    roleNames: {},
                    apiError: `${response.status} ${response.statusText}`,
                },
                { status: response.status },
            );
        }

        const member = await response.json();
        const userRoles = member.roles || [];

        console.log(`[Discord Roles] Member info retrieved:`, {
            discordUserId: dbUser.discordId,
            guildId: validatedGuildId,
            roleCount: userRoles.length,
            roleIds: userRoles,
            username: member.user?.username,
        });

        // Optionally fetch role names
        const roleNames: Record<string, string> = {};
        if (userRoles.length > 0) {
            try {
                const rolesUrl = `https://discord.com/api/v10/guilds/${validatedGuildId}/roles`;
                const rolesResponse = await fetch(rolesUrl, {
                    method: 'GET',
                    headers: {
                        Authorization: `Bot ${botToken}`,
                        'Content-Type': 'application/json',
                    },
                });

                if (rolesResponse.ok) {
                    const allRoles = await rolesResponse.json();
                    for (const role of allRoles) {
                        roleNames[role.id] = role.name;
                    }
                }
            } catch (err) {
                console.error('[Discord Roles] Failed to fetch role names:', err);
                // Continue without role names
            }
        }

        console.log(`[Discord Roles] User has ${userRoles.length} roles`);

        return NextResponse.json({
            success: true,
            isMember: true,
            discordUserId: dbUser.discordId,
            guildId: validatedGuildId,
            roleIds: userRoles,
            roleNames: roleNames,
            username: member.user?.username,
            nickname: member.nick,
            joinedAt: member.joined_at,
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                {
                    error: 'Invalid parameters',
                    issues: error.issues,
                    success: false,
                    roleIds: [],
                    roleNames: {},
                },
                { status: 400 },
            );
        }

        console.error('[Discord Roles] Error:', error);
        return NextResponse.json(
            {
                error: 'Failed to fetch Discord roles',
                success: false,
                roleIds: [],
                roleNames: {},
            },
            { status: 500 },
        );
    }
}
