import { auth } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import { ApiError } from '@/lib/api-utils';

interface DiscordRole {
    id: string;
    name: string;
    managed: boolean;
}

/**
 * GET /api/discord/roles?guildId=XXX
 * Fetch roles from a connected Discord guild using bot token
 */
export async function GET(req: NextRequest) {
    try {
        const session = await auth();

        if (!session || !session.user) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const guildId = req.nextUrl.searchParams.get('guildId');
        if (!guildId) {
            return NextResponse.json({ error: 'guildId is required' }, { status: 400 });
        }

        const botToken = process.env.DISCORD_BOT_TOKEN;
        if (!botToken) {
            return NextResponse.json({ error: 'Bot token not configured' }, { status: 500 });
        }

        const response = await fetch(`https://discord.com/api/v10/guilds/${guildId}/roles`, {
            headers: {
                Authorization: `Bot ${botToken}`,
            },
        });

        if (!response.ok) {
            const error = await response.text();
            return NextResponse.json({ error: 'Discord API error', details: error }, { status: response.status });
        }

        const roles: DiscordRole[] = await response.json();

        const selectableRoles = roles
            .filter(role => role.name !== '@everyone')
            .map(role => ({ id: role.id, name: role.name, managed: role.managed }))
            .sort((a, b) => a.name.localeCompare(b.name));

        return NextResponse.json({ roles: selectableRoles });
    } catch (error) {
        console.error('[API Error] GET /api/discord/roles:', error);

        if (error instanceof ApiError) {
            return NextResponse.json({ error: error.code, message: error.message }, { status: error.statusCode });
        }

        return NextResponse.json(
            { error: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch Discord roles' },
            { status: 500 },
        );
    }
}

/**
 * POST /api/discord/roles
 * Create a role in a guild using bot token
 */
export async function POST(req: NextRequest) {
    try {
        const session = await auth();

        if (!session || !session.user) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const body = await req.json();
        const { guildId, name } = body || {};

        if (!guildId || !name) {
            return NextResponse.json({ error: 'guildId and name are required' }, { status: 400 });
        }

        const botToken = process.env.DISCORD_BOT_TOKEN;
        if (!botToken) {
            return NextResponse.json({ error: 'Bot token not configured' }, { status: 500 });
        }

        const response = await fetch(`https://discord.com/api/v10/guilds/${guildId}/roles`, {
            method: 'POST',
            headers: {
                Authorization: `Bot ${botToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name }),
        });

        if (!response.ok) {
            const error = await response.text();
            return NextResponse.json({ error: 'Discord API error', details: error }, { status: response.status });
        }

        const role = await response.json();
        return NextResponse.json({ role: { id: role.id, name: role.name } });
    } catch (error) {
        console.error('[API Error] POST /api/discord/roles:', error);

        if (error instanceof ApiError) {
            return NextResponse.json({ error: error.code, message: error.message }, { status: error.statusCode });
        }

        return NextResponse.json(
            { error: 'INTERNAL_SERVER_ERROR', message: 'Failed to create Discord role' },
            { status: 500 },
        );
    }
}
