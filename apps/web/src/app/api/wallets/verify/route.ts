import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { db } from '@/lib/db';
import { validateSolanaAddress } from '@/lib/solana/verification';
import { z } from 'zod';

const createVerificationSchema = z.object({
    walletAddress: z.string().min(32).max(44),
});

/**
 * POST /api/wallets/verify - Create a verification challenge
 * Returns a message that the user must sign with their wallet
 */
export async function POST(req: NextRequest) {
    try {
        const session = await requireAuth();
        const body = await req.json();
        const { walletAddress } = createVerificationSchema.parse(body);

        // Validate Solana address format
        validateSolanaAddress(walletAddress);

        // Check if wallet is already linked to this user
        const existingWallet = await db.userWallet.findUnique({
            where: {
                userId_walletAddress: {
                    userId: session.user.id,
                    walletAddress,
                },
            },
        });

        if (existingWallet) {
            return NextResponse.json({ error: 'Wallet already linked to your account' }, { status: 400 });
        }

        // Check if wallet is linked to another user
        const walletOwnedByOther = await db.userWallet.findFirst({
            where: {
                walletAddress,
                userId: { not: session.user.id },
            },
        });

        if (walletOwnedByOther) {
            return NextResponse.json({ error: 'This wallet is already linked to another account' }, { status: 400 });
        }

        // Generate verification message
        const timestamp = Date.now();
        const message = `Verify wallet ownership for DropLabz\n\nWallet: ${walletAddress}\nTimestamp: ${timestamp}\n\nSign this message to verify you own this wallet.`;

        return NextResponse.json({
            message,
            walletAddress,
            timestamp,
        });
    } catch (error) {
        console.error('Error creating verification challenge:', error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Invalid request data', issues: error.issues }, { status: 400 });
        }
        return NextResponse.json({ error: 'Failed to create verification challenge' }, { status: 500 });
    }
}
