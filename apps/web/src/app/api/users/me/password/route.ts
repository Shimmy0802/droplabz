import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { db } from '@/lib/db';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

const passwordSchema = z.object({
    currentPassword: z.string().optional(),
    newPassword: z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number'),
});

export async function PUT(req: NextRequest) {
    try {
        const session = await requireAuth();
        const userId = session.user.id;

        const body = await req.json();
        const { currentPassword, newPassword } = passwordSchema.parse(body);

        // Get current user with password hash
        const user = await db.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                passwordHash: true,
                email: true,
            },
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // If user already has a password, verify current password
        if (user.passwordHash) {
            if (!currentPassword) {
                return NextResponse.json({ error: 'Current password is required' }, { status: 400 });
            }

            const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
            if (!isValid) {
                return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 });
            }
        }

        // Check if user has email (required for password login)
        if (!user.email) {
            return NextResponse.json(
                { error: 'You must add an email address before setting a password' },
                { status: 400 },
            );
        }

        // Hash new password
        const passwordHash = await bcrypt.hash(newPassword, 10);

        // Update password
        await db.user.update({
            where: { id: userId },
            data: { passwordHash },
        });

        return NextResponse.json({
            success: true,
            message: user.passwordHash ? 'Password updated successfully' : 'Password set successfully',
        });
    } catch (error) {
        console.error('Error updating password:', error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
        }
        return NextResponse.json({ error: 'Failed to update password' }, { status: 500 });
    }
}
