import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, getCurrentUser } from '@/lib/auth/middleware';
import { db } from '@/lib/db';
import { ApiError } from '@/lib/api-utils';
import { Prisma } from '@prisma/client';
import { z } from 'zod';

const createEventSchema = z
    .object({
        communityId: z.string().cuid(),
        type: z.enum(['WHITELIST', 'PRESALE', 'COLLABORATION', 'GIVEAWAY']),
        title: z.string().min(1).max(200),
        description: z.string().max(1000).optional(),
        prize: z.string().max(500).optional(),
        imageUrl: z.string().optional(),
        endAt: z.string().datetime(),
        maxWinners: z.number().int().min(1).optional(),
        selectionMode: z.enum(['RANDOM', 'MANUAL', 'FCFS']).optional(),
        reservedSpots: z.number().int().min(0).optional(),
        autoAssignDiscordRole: z.boolean().optional(),
        winnerDiscordRoleId: z.string().optional(),
        status: z.enum(['DRAFT', 'ACTIVE', 'CLOSED']).optional(),
        requirements: z
            .array(
                z.object({
                    type: z.string(),
                    config: z.record(z.string(), z.unknown()),
                }),
            )
            .optional(),
    })
    .refine(
        data => {
            // If FCFS, maxWinners is required
            if (data.selectionMode === 'FCFS' && !data.maxWinners) {
                return false;
            }
            return true;
        },
        {
            message: 'Max entry capacity is required for FCFS selection mode',
            path: ['maxWinners'],
        },
    );

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
            maxWinners,
            selectionMode,
            reservedSpots,
            autoAssignDiscordRole,
            winnerDiscordRoleId,
            status,
            requirements,
        } = createEventSchema.parse(body);

        // Verify community exists and user is admin
        const community = await db.community.findUnique({
            where: { id: communityId },
            select: {
                id: true,
                slug: true,
                ownerId: true,
                guildId: true,
                discordAnnouncementChannelId: true,
            },
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

        // Determine maxWinners based on selection mode
        // RANDOM: optional (can be undefined)
        // FCFS: required (enforced by schema)
        // MANUAL: optional but defaults to 1
        const resolvedMaxWinners = selectionMode === 'RANDOM' ? maxWinners || undefined : maxWinners || 1;

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
                status: status || 'DRAFT',
                maxWinners: resolvedMaxWinners,
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

        // Auto-announce to Discord if ACTIVE and Discord is configured
        const shouldAnnounce =
            status === 'ACTIVE' && community.guildId && community.discordAnnouncementChannelId && type === 'GIVEAWAY';

        if (shouldAnnounce) {
            try {
                // Build correct base URL for internal API call
                // Vercel sets VERCEL_URL to the deployment URL
                let announceBaseUrl = 'http://localhost:3000'; // Development default

                if (process.env.VERCEL_URL) {
                    // Vercel production environment
                    announceBaseUrl = `https://${process.env.VERCEL_URL}`;
                } else if (process.env.NEXTAUTH_URL) {
                    // NextAuth configured URL (staging/custom domains)
                    announceBaseUrl = process.env.NEXTAUTH_URL;
                }

                const announceUrl = `${announceBaseUrl}/api/events/${event.id}/announce`;
                const announceResponse = await fetch(announceUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Internal-Call': 'true',
                        'X-User-Id': user.id,
                    },
                    body: JSON.stringify({
                        communityId,
                        trigger: 'CREATED',
                    }),
                });

                if (announceResponse.ok) {
                    console.log(`[Events] Auto-announced giveaway ${event.id} to Discord`);
                } else {
                    const errorText = await announceResponse.text();
                    console.warn(
                        `[Events] Failed to auto-announce giveaway ${event.id}:`,
                        announceResponse.status,
                        errorText,
                    );
                }
            } catch (announceError) {
                console.error('[Events] Error auto-announcing giveaway:', announceError);
                // Don't fail the whole request if announcement fails
            }
        }

        return NextResponse.json(event);
    } catch (error) {
        console.error('[API Error] POST /api/events:', error);

        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'VALIDATION_ERROR', issues: error.issues }, { status: 400 });
        }

        if (error instanceof ApiError) {
            return NextResponse.json({ error: error.code, message: error.message }, { status: error.statusCode });
        }

        return NextResponse.json(
            { error: 'INTERNAL_SERVER_ERROR', message: 'Failed to create event' },
            { status: 500 },
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
            return NextResponse.json({ error: error.code, message: error.message }, { status: error.statusCode });
        }

        return NextResponse.json(
            { error: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch events' },
            { status: 500 },
        );
    }
}
