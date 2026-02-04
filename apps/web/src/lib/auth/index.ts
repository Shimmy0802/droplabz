import NextAuth, { getServerSession } from 'next-auth';
import { authConfig } from './config';

/**
 * NextAuth v4 instance
 * Export handlers and utility functions
 */

const handler = NextAuth(authConfig);

// Export getServerSession as auth for API route usage
export const auth = () => getServerSession(authConfig);
export { handler as GET, handler as POST };

/**
 * Re-export types for convenience
 */
export type { Session } from 'next-auth';
