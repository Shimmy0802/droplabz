import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, getCurrentUser } from '@/lib/auth/middleware';
import { db } from '@/lib/db';
import { ApiError } from '@/lib/api-utils';
import { Prisma } from '@prisma/client';
import { z } from 'zod';

const createEventSchema = z.object({
    communityId: z.string().cuid(),
    type: z.enum(['WHITELIST', 'PRESALE', 'COLLABORATION', 'GIVEAWAY']),
    title: z.string().min(1).max(200),
    description: z.string().max(1000).optional(),
    prize: z.string().max(500).optional(),
    imageUrl: z.string().url().optional(),
    endAt: z.string().datetime(),
    maxSpots: z.number().int().min(1).optional(),
    selectionMode: z.enum(['RANDOM', 'MANUAL', 'FCFS']).optional(),
    reservedSpots: z.number().int().min(0).optional(),
    autoAssignDiscordRole: z.boolean().optional(),
    winnerDiscordRoleId: z.string().optional(),
    requirements: z
        .array(
            z.object({
                type: z.string(),
                config: z.record(z.string(), z.unknown()),
            }),
        )
        .optional(),
});

export async function POST(req: NextRequest) {
    try {
        await requireAuth();
        const user = await getCurrentUser();

        const body = await req.json();
        const {
            communityId,
            type,
            title,
            description,
            prize,
            imageUrl,
            endAt,
            maxSpots,
            selectionMode,
            reservedSpots,
            autoAssignDiscordRole,
            winnerDiscordRoleId,
            requirements,
        } = createEventSchema.parse(body);

        // Verify community exists and user is admin
        const community = await db.community.findUnique({
            where: { id: communityId },
        });

        if (!community) {
            return NextResponse.json({ error: 'Community not found' }, { status: 404 });
        }

        // Check if user is owner or admin of this community
        if (community.ownerId !== user.id) {
            const membership = await db.communityMember.findUnique({
                where: {
                    communityId_userId: {
                        communityId,
                        userId: user.id,
                    },
                },
            });

            if (!membership || (membership.role !== 'OWNER' && membership.role !== 'ADMIN')) {
                return NextResponse.json({ error: 'Community admin access required' }, { status: 403 });
            }
        }

        // Create event with requirements
        const event = await db.event.create({
            data: {
                communityId,
                type,
                title,
                description,
                prize,
                imageUrl,
                endAt: new Date(endAt),
                status: 'DRAFT', // Start as DRAFT, admin can publish when ready
                maxWinners: maxSpots || 1,
                selectionMode: selectionMode || 'RANDOM',
                reservedSpots: reservedSpots || 0,
                autoAssignDiscordRole: autoAssignDiscordRole || false,
                winnerDiscordRoleId,
                createdBy: user.id,
                requirements: requirements
                    ? {
                          create: requirements.map(req => ({
                              type: req.type,
                              config: req.config as Prisma.InputJsonValue,
                          })),
                      }
                    : undefined,
            },
            include: {
                requirements: true,
                entries: true,
            },
        });

        return NextResponse.json(event);
    } catch (error) {
        console.error('[API Error] POST /api/events:', error);
        
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
            { error: 'INTERNAL_SERVER_ERROR', message: 'Failed to create event' },
            { status: 500 }
        );
    }
}

export async function GET(req: NextRequest) {
    try {
        const communityId = req.nextUrl.searchParams.get('communityId');
        const type = req.nextUrl.searchParams.get('type');

        if (!communityId) {
            return NextResponse.json({ error: 'communityId is required' }, { status: 400 });
        }

        // Public access: No auth required to view events
        const community = await db.community.findUnique({
            where: { id: communityId },
        });

        if (!community) {
            return NextResponse.json({ error: 'Community not found' }, { status: 404 });
        }

        // Build where clause
        interface EventWhereInput {
            communityId: string;
            type?: string;
        }
        const where: EventWhereInput = { communityId };
        if (type) {
            where.type = type;
        }

        const events = await db.event.findMany({
            where,
            include: {
                requirements: true,
                entries: {
                    select: {
                        id: true,
                        walletAddress: true,
                        discordUserId: true,
                        status: true,
                        createdAt: true,
                    },
                },
                _count: {
                    select: {
                        entries: {
                            where: { status: 'VALID' },
                        },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json(events);
    } catch (error) {
        console.error('[API Error] GET /api/events:', error);
        
        if (error instanceof ApiError) {
            return NextResponse.json(
                { error: error.code, message: error.message },
                { status: error.statusCode }
            );
        }

        return NextResponse.json(
            { error: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch events' },
            { status: 500 }
        );
    }
}
