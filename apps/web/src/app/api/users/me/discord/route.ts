import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { db } from '@/lib/db';
import { apiResponse, apiError } from '@/lib/api-utils';

/**
 * DELETE /api/users/me/discord
 * Disconnect Discord account from user profile
 */
export async function DELETE() {
    try {
        const session = await requireAuth();

        // Check if user has email and password (required to disconnect Discord)
        const user = await db.user.findUnique({
            where: { id: session.user.id },
            select: {
                email: true,
                passwordHash: true,
                discordId: true,
            },
        });

        if (!user?.discordId) {
            return NextResponse.json({ error: 'Discord account not connected' }, { status: 400 });
        }

        // Require email and password before allowing disconnect
        // This prevents users from being locked out of their account
        if (!user.email || !user.passwordHash) {
            return NextResponse.json(
                {
                    error: 'Email and password required',
                    message: 'Please add an email and password to your account before disconnecting Discord',
                },
                { status: 400 },
            );
        }

        // Disconnect Discord
        await db.user.update({
            where: { id: session.user.id },
            data: {
                discordId: null,
                discordUsername: null,
            },
        });

        return apiResponse({ success: true, message: 'Discord account disconnected successfully' });
    } catch (error) {
        return apiError(error);
    }
}
