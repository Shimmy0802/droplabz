import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { db } from '@/lib/db';
import { z } from 'zod';

const usernameSchema = z.object({
    username: z
        .string()
        .min(3, 'Username must be at least 3 characters')
        .max(30, 'Username must be at most 30 characters')
        .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
});

export async function PUT(req: NextRequest) {
    try {
        const session = await requireAuth();
        const userId = session.user.id;

        const body = await req.json();
        const { username } = usernameSchema.parse(body);

        // Check if username is already taken (case-insensitive)
        const existing = await db.user.findFirst({
            where: {
                username: {
                    equals: username,
                    mode: 'insensitive',
                },
                NOT: {
                    id: userId,
                },
            },
        });

        if (existing) {
            return NextResponse.json({ error: 'Username is already taken' }, { status: 409 });
        }

        // Update username
        const updated = await db.user.update({
            where: { id: userId },
            data: { username },
            select: {
                id: true,
                username: true,
                email: true,
            },
        });

        return NextResponse.json({ success: true, user: updated });
    } catch (error) {
        console.error('Error updating username:', error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
        }
        return NextResponse.json({ error: 'Failed to update username' }, { status: 500 });
    }
}
