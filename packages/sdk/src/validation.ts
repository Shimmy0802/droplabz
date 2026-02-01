import { z } from 'zod';

/**
 * Validation schemas for API inputs and data
 */

export const PaginationSchema = z.object({
    limit: z.coerce.number().int().positive().default(50).pipe(z.number().max(1000)),
    offset: z.coerce.number().int().nonnegative().default(0),
});

// User validation
export const CreateUserRequestSchema = z.object({
    email: z.string().email(),
    username: z.string().min(3).max(50),
    password: z.string().min(8).max(100),
});

export const LoginRequestSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
});

// Community validation
export const CreateCommunityRequestSchema = z.object({
    name: z.string().min(1).max(100),
    description: z.string().max(2000).optional(),
    guildId: z.string().optional(),
    categories: z.array(z.string()).optional(),
    tags: z.array(z.string()).default([]),
});

export const UpdateCommunityRequestSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().max(2000).optional().nullable(),
    categories: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional(),
    isListed: z.boolean().optional(),
});

// Review validation
export const CreateReviewRequestSchema = z.object({
    communityId: z.string().cuid(),
    rating: z.number().int().min(1).max(5),
    comment: z.string().max(1000).optional(),
});

// Event validation
export const CreateEventRequestSchema = z.object({
    type: z.enum(['GIVEAWAY', 'WHITELIST', 'ACCESS', 'AIRDROP']),
    title: z.string().min(1).max(200),
    description: z.string().max(2000).optional(),
    prize: z.string().optional(),
    imageUrl: z.string().url().optional(),
    endAt: z.coerce.date(),
    maxWinners: z.number().int().positive().default(1),
    selectionMode: z.enum(['RANDOM', 'MANUAL']).default('RANDOM'),
    requirements: z.array(
        z.object({
            type: z.string(),
            config: z.record(z.string(), z.unknown()),
        }),
    ),
});

// Entry validation
export const CreateEntryRequestSchema = z.object({
    eventId: z.string(),
    walletAddress: z.string(),
    discordUserId: z.string().optional(),
});

export type CreateUserRequest = z.infer<typeof CreateUserRequestSchema>;
export type LoginRequest = z.infer<typeof LoginRequestSchema>;
export type CreateCommunityRequest = z.infer<typeof CreateCommunityRequestSchema>;
export type UpdateCommunityRequest = z.infer<typeof UpdateCommunityRequestSchema>;
export type CreateReviewRequest = z.infer<typeof CreateReviewRequestSchema>;
export type CreateEventRequest = z.infer<typeof CreateEventRequestSchema>;
export type CreateEntryRequest = z.infer<typeof CreateEntryRequestSchema>;
export type Pagination = z.infer<typeof PaginationSchema>;
