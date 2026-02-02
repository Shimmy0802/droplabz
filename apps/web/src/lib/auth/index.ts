import NextAuth from 'next-auth';
import { authConfig } from './config';

/**
 * NextAuth v4 instance
 * Export handlers and utility functions
 */

const handler = NextAuth(authConfig);

export const { auth, signIn, signOut } = NextAuth(authConfig);
export { handler as GET, handler as POST };

/**
 * Re-export types for convenience
 */
export type { Session } from 'next-auth';
