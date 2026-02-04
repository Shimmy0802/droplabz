import { auth } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import { ApiError } from '@/lib/api-utils';
import { z } from 'zod';

const setupSchema = z.object({
    guildId: z.string().min(1),
});

/**
 * POST /api/discord/setup-channels
 * Create DropLabz category and default channels via bot service
 */
export async function POST(req: NextRequest) {
    try {
        const session = await auth();

        if (!session || !session.user) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const body = await req.json();
        const { guildId } = setupSchema.parse(body);

        const botBaseUrl = process.env.BOT_API_BASE_URL || 'http://127.0.0.1:3001';
        const response = await fetch(`${botBaseUrl}/setup-channels`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ guildId }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            return NextResponse.json({ error: 'Bot API error', details: errorText }, { status: response.status });
        }

        const result = await response.json();
        return NextResponse.json(result);
    } catch (error) {
        console.error('[API Error] POST /api/discord/setup-channels:', error);

        if (error instanceof ApiError) {
            return NextResponse.json({ error: error.code, message: error.message }, { status: error.statusCode });
        }

        return NextResponse.json(
            { error: 'INTERNAL_SERVER_ERROR', message: 'Failed to setup Discord channels' },
            { status: 500 },
        );
    }
}
