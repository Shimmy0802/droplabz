import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

type Params = { eventId: string };

export async function GET(_req: NextRequest, { params }: { params: Promise<Params> }) {
    try {
        const { eventId } = await params;

        const event = await db.event.findUnique({
            where: { id: eventId },
            include: {
                requirements: true,
                entries: true,
                community: {
                    select: {
                        id: true,
                        name: true,
                        icon: true,
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
