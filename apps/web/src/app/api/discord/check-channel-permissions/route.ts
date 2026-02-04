import { NextRequest, NextResponse } from 'next/server';

/**
 * API endpoint to check bot permissions for a Discord category
 */
export async function POST(req: NextRequest) {
    try {
        const { guildId, categoryId } = await req.json();

        if (!guildId || !categoryId) {
            return NextResponse.json({ error: 'Missing guildId or categoryId' }, { status: 400 });
        }

        const botApiUrl = process.env.BOT_API_BASE_URL || 'http://127.0.0.1:3001';

        const response = await fetch(`${botApiUrl}/check-channel-permissions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ guildId, categoryId }),
        });

        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json(data, { status: response.status });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('[API Error] POST /api/discord/check-channel-permissions:', error);
        return NextResponse.json(
            {
                error: 'Failed to check channel permissions',
                message: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 },
        );
    }
}
