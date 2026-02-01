import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * PUBLIC endpoint to fetch event details for public event pages
 * No authentication required
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ eventId: string }> }) {
    try {
        const { eventId } = await params;

        const event = await db.event.findUnique({
            where: { id: eventId },
            include: {
                community: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                        icon: true,
                    },
                },
                requirements: {
                    select: {
                        id: true,
                        type: true,
                        config: true,
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
        });

        if (!event) {
            return NextResponse.json({ error: 'Event not found' }, { status: 404 });
        }

        return NextResponse.json(event);
    } catch (error) {
        console.error('Error fetching event:', error);
        return NextResponse.json({ error: 'Failed to fetch event' }, { status: 500 });
    }
}
