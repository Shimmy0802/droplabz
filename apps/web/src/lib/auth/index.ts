import NextAuth from 'next-auth';
import { authConfig } from './config';

/**
 * NextAuth v5 instance
 * Export handlers and utility functions
 */

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);

/**
 * Re-export types for convenience
 */
export type { Session } from 'next-auth';
