import { handlers } from '@/lib/auth';

/**
 * NextAuth v5 API route handlers
 * Handles all authentication routes: /api/auth/*
 */

export const { GET, POST } = handlers;
