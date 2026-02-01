import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { db } from '@/lib/db';
import { validateSolanaAddress, verifyWalletSignature } from '@/lib/solana/verification';
import { PublicKey } from '@solana/web3.js';
import { z } from 'zod';

const verifyWalletSchema = z.object({
    walletAddress: z.string().min(32).max(44),
    message: z.string(),
    signature: z.string(),
});

/**
 * POST /api/wallets - Link verified wallet to account
 */
export async function POST(req: NextRequest) {
    try {
        const session = await requireAuth();
        const body = await req.json();
        const { walletAddress, message, signature } = verifyWalletSchema.parse(body);

        // Validate Solana address format
        validateSolanaAddress(walletAddress);

        // Verify the signature
        const publicKey = new PublicKey(walletAddress);
        const isSignatureValid = await verifyWalletSignature(publicKey, message, signature);

        if (!isSignatureValid) {
            return NextResponse.json({ error: 'Invalid wallet signature. Verification failed.' }, { status: 400 });
        }

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

        // Check if user has any wallets (first wallet becomes primary)
        const userWalletCount = await db.userWallet.count({
            where: { userId: session.user.id },
        });

        const isPrimary = userWalletCount === 0;

        // Create wallet record
        const wallet = await db.userWallet.create({
            data: {
                userId: session.user.id,
                walletAddress,
                isPrimary,
                verifiedAt: new Date(),
            },
        });

        return NextResponse.json({
            success: true,
            wallet: {
                id: wallet.id,
                walletAddress: wallet.walletAddress,
                isPrimary: wallet.isPrimary,
                verifiedAt: wallet.verifiedAt,
            },
        });
    } catch (error) {
        console.error('Error verifying wallet:', error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Invalid request data', issues: error.issues }, { status: 400 });
        }
        return NextResponse.json({ error: 'Failed to verify wallet' }, { status: 500 });
    }
}

/**
 * GET /api/wallets - Get all wallets linked to current user
 */
export async function GET() {
    try {
        const session = await requireAuth();

        const wallets = await db.userWallet.findMany({
            where: { userId: session.user.id },
            orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
            select: {
                id: true,
                walletAddress: true,
                isPrimary: true,
                verifiedAt: true,
                createdAt: true,
            },
        });

        return NextResponse.json({ wallets });
    } catch (error) {
        console.error('Error fetching wallets:', error);
        return NextResponse.json({ error: 'Failed to fetch wallets' }, { status: 500 });
    }
}

/**
 * DELETE /api/wallets - Remove a wallet from user's profile
 */
export async function DELETE(req: NextRequest) {
    try {
        const session = await requireAuth();
        const { searchParams } = new URL(req.url);
        const walletAddress = searchParams.get('walletAddress');

        if (!walletAddress) {
            return NextResponse.json({ error: 'Wallet address required' }, { status: 400 });
        }

        // Verify wallet belongs to user
        const wallet = await db.userWallet.findUnique({
            where: {
                userId_walletAddress: {
                    userId: session.user.id,
                    walletAddress,
                },
            },
        });

        if (!wallet) {
            return NextResponse.json({ error: 'Wallet not found' }, { status: 404 });
        }

        // Delete wallet
        await db.userWallet.delete({
            where: {
                userId_walletAddress: {
                    userId: session.user.id,
                    walletAddress,
                },
            },
        });

        // If deleted wallet was primary, make another wallet primary
        if (wallet.isPrimary) {
            const nextWallet = await db.userWallet.findFirst({
                where: { userId: session.user.id },
                orderBy: { createdAt: 'asc' },
            });

            if (nextWallet) {
                await db.userWallet.update({
                    where: { id: nextWallet.id },
                    data: { isPrimary: true },
                });
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error removing wallet:', error);
        return NextResponse.json({ error: 'Failed to remove wallet' }, { status: 500 });
    }
}
