import { NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Discord from 'next-auth/providers/discord';
import { db } from '@/lib/db';
import { compare } from 'bcryptjs';
import { z } from 'zod';

/**
 * NextAuth v5 configuration
 * Supports multiple authentication methods:
 * - Email/password (Credentials provider)
 * - Discord OAuth (Discord provider)
 */

const credentialsSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
});

export const authConfig: NextAuthConfig = {
    providers: [
        Credentials({
            id: 'credentials',
            name: 'Email and Password',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
                try {
                    const { email, password } = credentialsSchema.parse(credentials);

                    // Find user by email
                    const user = await db.user.findUnique({
                        where: { email },
                        select: {
                            id: true,
                            email: true,
                            username: true,
                            role: true,
                            passwordHash: true,
                        },
                    });

                    if (!user || !user.passwordHash) {
                        return null;
                    }

                    // Verify password
                    const isValidPassword = await compare(password, user.passwordHash);
                    if (!isValidPassword) {
                        return null;
                    }

                    return {
                        id: user.id,
                        email: user.email,
                        name: user.username,
                        role: user.role,
                    };
                } catch (error) {
                    console.error('Credentials auth error:', error);
                    return null;
                }
            },
        }),
        Discord({
            clientId: process.env.DISCORD_CLIENT_ID!,
            clientSecret: process.env.DISCORD_CLIENT_SECRET!,
            authorization: {
                params: {
                    scope: 'identify guilds guilds.members.read',
                },
            },
        }),
    ],
    session: {
        strategy: 'jwt',
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },
    pages: {
        signIn: '/auth/signin',
        error: '/auth/error',
    },
    callbacks: {
        async signIn({ user, account, profile }) {
            // Handle Discord OAuth login/registration
            if (account?.provider === 'discord' && profile) {
                try {
                    const discordId = profile.id as string;
                    const username = profile.username as string | undefined;

                    // Find or create user
                    let existingUser = await db.user.findUnique({
                        where: { discordId },
                    });

                    if (!existingUser) {
                        // Create new user from Discord OAuth (email NOT auto-populated)
                        existingUser = await db.user.create({
                            data: {
                                discordId,
                                email: null,
                                username: username || `discord_${discordId}`,
                                discordUsername: username || null,
                                role: 'MEMBER',
                            },
                        });
                    } else {
                        // Update Discord username if it changed (or if it's missing)
                        if (username && (!existingUser.discordUsername || username !== existingUser.discordUsername)) {
                            existingUser = await db.user.update({
                                where: { id: existingUser.id },
                                data: { discordUsername: username },
                            });
                        }
                    }

                    // Update user.id for JWT
                    user.id = existingUser.id;
                    user.role = existingUser.role;
                } catch (error) {
                    console.error('Discord OAuth error:', error);
                    return false;
                }
            }

            return true;
        },
        async jwt({ token, user, account }) {
            // Add user info to token on sign in
            if (user) {
                token.id = user.id;
                token.role = user.role;
            }

            // Store Discord access token for verification (needed to check guild membership)
            if (account?.provider === 'discord' && account.access_token) {
                token.discordAccessToken = account.access_token;
            }

            return token;
        },
        async session({ session, token }) {
            // Add user info from token to session
            if (token && session.user) {
                session.user.id = token.id as string;
                session.user.role = token.role as string;
                // Include Discord access token if available (for guild verification)
                if (token.discordAccessToken) {
                    (session as any).discordAccessToken = token.discordAccessToken as string;
                }
            }

            // Fetch user data from database (explicitly set email to override NextAuth auto-population)
            if (session.user?.id) {
                const user = await db.user.findUnique({
                    where: { id: session.user.id },
                    select: { username: true, email: true, discordId: true },
                });
                if (user) {
                    session.user.username = user.username || undefined;
                    // Set email to DB value (may be null for Discord-only accounts)
                    session.user.email = (user.email as string) || session.user.email;
                    if (user.discordId) {
                        (session as any).discordId = user.discordId;
                    }
                }
            }

            return session;
        },
    },
    debug: process.env.NODE_ENV === 'development',
};
