import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireCommunityAdmin } from '@/lib/auth/middleware';
import { db } from '@/lib/db';
import { ApiError } from '@/lib/api-utils';
import { Prisma } from '@prisma/client';
import { z } from 'zod';

const createPresaleSchema = z.object({
    communityId: z.string().cuid(),
    name: z.string().min(1).max(200),
    description: z.string().max(1000).optional(),
    tiers: z.array(
        z.object({
            name: z.string().min(1),
            maxSpots: z.number().int().min(1),
            allocationAmount: z.number().positive(),
            requirements: z.array(
                z.object({
                    type: z.string(),
                    config: z.record(z.string(), z.unknown()),
                }),
            ),
        }),
    ),
});

/**
 * POST /api/presales
 * Create a new presale (admin only)
 */
export async function POST(req: NextRequest) {
    try {
        await requireAuth();

        const body = await req.json();
        const { communityId, name, description, tiers } = createPresaleSchema.parse(body);

        // Verify community admin access
        await requireCommunityAdmin(communityId);

        // Create presale with tiers
        const presale = await db.presale.create({
            data: {
                communityId,
                name,
                description,
                status: 'DRAFT',
                tiers: {
                    create: tiers.map(tier => ({
                        name: tier.name,
                        maxSpots: tier.maxSpots,
                        spotsUsed: 0,
                        allocationAmount: tier.allocationAmount,
                        requirements: {
                            create: tier.requirements.map(req => ({
                                type: req.type,
                                config: req.config as Prisma.InputJsonValue,
                            })),
                        },
                    })),
                },
            },
            include: {
                tiers: {
                    include: {
                        requirements: true,
                    },
                },
            },
        });

        return NextResponse.json(presale, { status: 201 });
    } catch (error) {
        console.error('[API Error] POST /api/presales:', error);
        
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'VALIDATION_ERROR', issues: error.issues },
                { status: 400 }
            );
        }
        
        if (error instanceof ApiError) {
            return NextResponse.json(
                { error: error.code, message: error.message },
                { status: error.statusCode }
            );
        }

        return NextResponse.json(
            { error: 'INTERNAL_SERVER_ERROR', message: 'Failed to create presale' },
            { status: 500 }
        );
    }
}

/**
 * GET /api/presales
 * List presales for a community (paginated)
 */
export async function GET(req: NextRequest) {
    try {
        await requireAuth();

        const communityId = req.nextUrl.searchParams.get('communityId');
        const status = req.nextUrl.searchParams.get('status');

        if (!communityId) {
            return NextResponse.json({ error: 'communityId is required' }, { status: 400 });
        }

        // Verify community access
        await requireCommunityAdmin(communityId);

        interface PresaleWhereInput {
            communityId: string;
            status?: string;
        }
        const where: PresaleWhereInput = { communityId };
        if (status) {
            where.status = status;
        }

        const presales = await db.presale.findMany({
            where,
            include: {
                tiers: {
                    include: {
                        requirements: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json(presales);
    } catch (error) {
        console.error('[API Error] GET /api/presales:', error);
        
        if (error instanceof ApiError) {
            return NextResponse.json(
                { error: error.code, message: error.message },
                { status: error.statusCode }
            );
        }

        return NextResponse.json(
            { error: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch presales' },
            { status: 500 }
        );
    }
}
