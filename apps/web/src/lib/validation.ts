import { z } from 'zod';
import { sanitizeText, sanitizeUrl, sanitizeId } from './sanitization';

export const createEventSchema = z.object({
    communityId: z.string().cuid(),
    type: z.enum(['GIVEAWAY', 'WHITELIST', 'ACCESS', 'AIRDROP']),
    title: z
        .string()
        .min(1, 'Title is required')
        .max(200, 'Title must be 200 characters or less')
        .transform(v => sanitizeText(v, { maxLength: 200 })),
    description: z
        .string()
        .max(2000, 'Description must be 2000 characters or less')
        .transform(v => sanitizeText(v, { maxLength: 2000 }))
        .optional(),
    prize: z
        .string()
        .max(500, 'Prize must be 500 characters or less')
        .transform(v => sanitizeText(v, { maxLength: 500 }))
        .optional(),
    imageUrl: z
        .string()
        .url('Invalid image URL')
        .transform(v => sanitizeUrl(v))
        .optional(),
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

export const createEntrySchema = z.object({
    eventId: z.string().cuid(),
    walletAddress: z
        .string()
        .transform(v => sanitizeId(v, 'solana')),
    discordUserId: z
        .string()
        .transform(v => sanitizeId(v, 'discord'))
        .nullish(),
});

export const updateEventSchema = z.object({
    title: z
        .string()
        .min(1, 'Title is required')
        .max(200, 'Title must be 200 characters or less')
        .transform(v => sanitizeText(v, { maxLength: 200 }))
        .optional(),
    description: z
        .string()
        .max(2000, 'Description must be 2000 characters or less')
        .transform(v => sanitizeText(v, { maxLength: 2000 }))
        .optional(),
    prize: z
        .string()
        .max(500, 'Prize must be 500 characters or less')
        .transform(v => sanitizeText(v, { maxLength: 500 }))
        .optional(),
    imageUrl: z
        .string()
        .url('Invalid image URL')
        .transform(v => sanitizeUrl(v))
        .optional(),
    status: z.enum(['OPEN', 'CLOSED', 'VERIFICATION']).optional(),
});

export const createCommunitySchema = z.object({
    name: z
        .string()
        .min(1, 'Community name is required')
        .max(100, 'Community name must be 100 characters or less')
        .transform(v => sanitizeText(v, { maxLength: 100 })),
    description: z
        .string()
        .max(1000, 'Description must be 1000 characters or less')
        .transform(v => sanitizeText(v, { maxLength: 1000 }))
        .optional(),
    imageUrl: z
        .string()
        .url('Invalid image URL')
        .transform(v => sanitizeUrl(v))
        .optional(),
});

export const verifyWalletSchema = z.object({
    walletAddress: z.string(),
    signature: z.string().optional(),
});

export type CreateEventInput = z.infer<typeof createEventSchema>;
export type CreateEntryInput = z.infer<typeof createEntrySchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
export type CreateCommunityInput = z.infer<typeof createCommunitySchema>;
export type VerifyWalletInput = z.infer<typeof verifyWalletSchema>;
