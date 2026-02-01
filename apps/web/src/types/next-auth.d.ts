import 'next-auth';
import 'next-auth/jwt';

/**
 * Type augmentation for NextAuth
 * Extends default types to include custom fields
 */

declare module 'next-auth' {
    interface User {
        role?: string;
        username?: string | null;
    }

    interface Session {
        user: {
            id: string;
            email?: string | null;
            name?: string | null;
            username?: string | null;
            image?: string | null;
            role?: string;
        };
    }
}

declare module 'next-auth/jwt' {
    interface JWT {
        id?: string;
        role?: string;
    }
}
