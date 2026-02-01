import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
    try {
        // Fetch top communities (by rating/boostLevel)
        const topCommunities = await db.community.findMany({
            where: {
                isListed: true,
                isVerified: true,
            },
            orderBy: [{ boostLevel: 'desc' }, { rating: 'desc' }],
            take: 6,
            include: {
                _count: {
                    select: {
                        members: true,
                    },
                },
            },
        });

        // Fetch active whitelists (upcoming mints)
        const upcomingMints = await db.event.findMany({
            where: {
                type: 'WHITELIST',
                status: 'ACTIVE',
                endAt: {
                    gte: new Date(),
                },
            },
            orderBy: {
                endAt: 'asc',
            },
            take: 6,
            include: {
                community: {
                    select: {
                        name: true,
                        slug: true,
                        icon: true,
                    },
                },
                _count: {
                    select: {
                        entries: {
                            where: {
                                status: 'VALID',
                            },
                        },
                    },
                },
            },
        });

        // Fetch active pre-sales
        const presales = await db.event.findMany({
            where: {
                type: 'PRESALE',
                status: 'ACTIVE',
                endAt: {
                    gte: new Date(),
                },
            },
            orderBy: {
                endAt: 'asc',
            },
            take: 6,
            include: {
                community: {
                    select: {
                        name: true,
                        slug: true,
                        icon: true,
                    },
                },
                _count: {
                    select: {
                        entries: {
                            where: {
                                status: 'VALID',
                            },
                        },
                    },
                },
            },
        });

        // Fetch events ending soon (within 48 hours)
        const now = new Date();
        const fortyEightHoursFromNow = new Date(now.getTime() + 48 * 60 * 60 * 1000);

        const endingSoon = await db.event.findMany({
            where: {
                status: 'ACTIVE',
                endAt: {
                    gte: now,
                    lte: fortyEightHoursFromNow,
                },
            },
            orderBy: {
                endAt: 'asc',
            },
            take: 6,
            include: {
                community: {
                    select: {
                        name: true,
                        slug: true,
                        icon: true,
                    },
                },
                _count: {
                    select: {
                        entries: {
                            where: {
                                status: 'VALID',
                            },
                        },
                    },
                },
            },
        });

        return NextResponse.json({
            topCommunities: topCommunities.map(community => ({
                id: community.id,
                slug: community.slug,
                name: community.name,
                description: community.description,
                icon: community.icon,
                rating: community.rating,
                boostLevel: community.boostLevel,
                memberCount: community._count.members,
                categories: community.categories,
                tags: community.tags,
            })),
            upcomingMints: upcomingMints.map(event => ({
                id: event.id,
                title: event.title,
                description: event.description,
                imageUrl: event.imageUrl,
                endAt: event.endAt,
                maxWinners: event.maxWinners,
                validEntries: event._count.entries,
                community: event.community,
            })),
            presales: presales.map(event => ({
                id: event.id,
                title: event.title,
                description: event.description,
                imageUrl: event.imageUrl,
                endAt: event.endAt,
                maxWinners: event.maxWinners,
                validEntries: event._count.entries,
                community: event.community,
            })),
            endingSoon: endingSoon.map(event => ({
                id: event.id,
                type: event.type,
                title: event.title,
                description: event.description,
                imageUrl: event.imageUrl,
                endAt: event.endAt,
                maxWinners: event.maxWinners,
                validEntries: event._count.entries,
                community: event.community,
            })),
        });
    } catch (error) {
        console.error('Error fetching homepage data:', error);
        return NextResponse.json({ error: 'Failed to fetch homepage data' }, { status: 500 });
    }
}
