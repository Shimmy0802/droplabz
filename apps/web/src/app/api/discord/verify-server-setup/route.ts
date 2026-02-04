import { NextRequest, NextResponse } from 'next/server';

/**
 * Verify complete Discord server setup
 * Calls bot API to check: bot presence, category, channels, permissions, bot capabilities
 */
export async function POST(req: NextRequest) {
    try {
        const { guildId } = await req.json();

        if (!guildId) {
            return NextResponse.json({ error: 'Missing guildId' }, { status: 400 });
        }

        const BOT_API_BASE_URL = process.env.BOT_API_BASE_URL || 'http://127.0.0.1:3001';

        const response = await fetch(`${BOT_API_BASE_URL}/verify-server-setup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ guildId }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[API Error] POST /api/discord/verify-server-setup: Bot API error:', errorText);

            // If bot returns an error, pass it through
            try {
                const errorData = JSON.parse(errorText);
                return NextResponse.json(errorData, { status: response.status });
            } catch {
                return NextResponse.json(
                    {
                        error: 'Bot API unreachable',
                        message: 'Unable to verify setup. Ensure Discord bot is running.',
                        isValid: false,
                        botInGuild: false,
                        categoryExists: false,
                        channelsStatus: [],
                        botCanManageChannels: false,
                        issues: ['Discord bot API not responding'],
                        recommendations: ['Ensure Discord bot service is running on port 3001'],
                    },
                    { status: 500 },
                );
            }
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('[API Error] POST /api/discord/verify-server-setup:', error);

        return NextResponse.json(
            {
                error: 'Verification failed',
                message: error instanceof Error ? error.message : 'Unknown error',
                isValid: false,
                botInGuild: false,
                categoryExists: false,
                channelsStatus: [],
                botCanManageChannels: false,
                issues: [error instanceof Error ? error.message : 'Unknown error'],
                recommendations: ['Check bot configuration and try again'],
            },
            { status: 500 },
        );
    }
}
