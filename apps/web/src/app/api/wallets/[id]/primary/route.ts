import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { db } from '@/lib/db';

export async function PUT(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await requireAuth();
        const { id } = await params;

        // Verify the wallet exists and belongs to the user
        const wallet = await db.userWallet.findUnique({
            where: { id },
        });

        if (!wallet) {
            return NextResponse.json({ error: 'Wallet not found' }, { status: 404 });
        }

        if (wallet.userId !== session.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        // Set all other wallets to non-primary, then set this one as primary
        await db.userWallet.updateMany({
            where: { userId: session.user.id },
            data: { isPrimary: false },
        });

        const updatedWallet = await db.userWallet.update({
            where: { id },
            data: { isPrimary: true },
        });

        return NextResponse.json(updatedWallet);
    } catch (error) {
        console.error('Error setting primary wallet:', error);
        return NextResponse.json({ error: 'Failed to set primary wallet' }, { status: 500 });
    }
}
