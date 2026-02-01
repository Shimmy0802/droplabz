import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

/**
 * Session utilities for server and client components
 */

/**
 * Get the current session (server-side)
 * Returns null if not authenticated
 */
export async function getSession() {
    return await auth();
}

/**
 * Get the current user ID from session
 * Returns null if not authenticated
 */
export async function getCurrentUserId(): Promise<string | null> {
    const session = await auth();
    return session?.user?.id || null;
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
    const session = await auth();
    return !!session?.user?.id;
}

/**
 * Check if current user has super admin role
 */
export async function isSuperAdmin(): Promise<boolean> {
    const session = await auth();
    if (!session?.user?.id) return false;

    const user = await db.user.findUnique({
        where: { id: session.user.id },
        select: { role: true },
    });

    return user?.role === 'SUPER_ADMIN';
}

/**
 * Get user role from session
 * Returns null if not authenticated
 */
export async function getUserRole(): Promise<string | null> {
    const session = await auth();
    return session?.user?.role || null;
}
