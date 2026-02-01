import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { db } from '@/lib/db';
import { z } from 'zod';

const emailSchema = z.object({
    email: z.string().email('Invalid email address'),
});

export async function PUT(req: NextRequest) {
    try {
        const session = await requireAuth();
        const userId = session.user.id;

        const body = await req.json();
        const { email } = emailSchema.parse(body);

        // Check if email is already in use
        const existing = await db.user.findFirst({
            where: {
                email: {
                    equals: email,
                    mode: 'insensitive',
                },
                NOT: {
                    id: userId,
                },
            },
        });

        if (existing) {
            return NextResponse.json({ error: 'Email is already in use' }, { status: 409 });
        }

        // Update email
        // TODO: In production, send verification email before updating
        // For now, we'll update directly for MVP
        const updated = await db.user.update({
            where: { id: userId },
            data: { email },
            select: {
                id: true,
                username: true,
                email: true,
            },
        });

        return NextResponse.json({
            success: true,
            user: updated,
            message: 'Email updated successfully',
        });
    } catch (error) {
        console.error('Error updating email:', error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
        }
        return NextResponse.json({ error: 'Failed to update email' }, { status: 500 });
    }
}
