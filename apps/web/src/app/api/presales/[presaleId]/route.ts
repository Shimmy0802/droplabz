import { NextRequest, NextResponse } from 'next/server';
import { requireCommunityAdmin } from '@/lib/auth/middleware';
import { db } from '@/lib/db';
import { validateCuid } from '@/lib/api-utils';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ presaleId: string }> }) {
    try {
        const { presaleId } = await params;
        const validatedPresaleId = validateCuid(presaleId, 'presaleId');

        const presale = await db.presale.findUnique({
            where: { id: validatedPresaleId },
            include: {
                tiers: {
                    select: {
                        id: true,
                        name: true,
                        maxSpots: true,
                        allocationAmount: true,
                        spotsUsed: true,
                    },
                },
            },
        });

        if (!presale) {
            return NextResponse.json({ error: 'Presale not found' }, { status: 404 });
        }

        // Verify community access
        await requireCommunityAdmin(presale.communityId);

        return NextResponse.json(presale);
    } catch (error) {
        console.error('Error fetching presale:', error);
        return NextResponse.json({ error: 'Failed to fetch presale' }, { status: 500 });
    }
}
