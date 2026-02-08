import { z } from 'zod';
import { sanitizeText, sanitizeUrl, sanitizeId } from './sanitization';

export const createEventSchema = z
    .object({
        communityId: z.string().cuid(),
        type: z.enum(['WHITELIST', 'PRESALE', 'COLLABORATION', 'GIVEAWAY']),
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
        endAt: z.union([z.string().datetime(), z.coerce.date()]),
        maxWinners: z.number().int().positive().optional(),
        selectionMode: z.enum(['RANDOM', 'MANUAL', 'FCFS']).optional(),
        reservedSpots: z.number().int().min(0).optional(),
        autoAssignDiscordRole: z.boolean().optional(),
        winnerDiscordRoleId: z.string().optional(),
        status: z.enum(['DRAFT', 'ACTIVE', 'CLOSED']).optional(),
        mentionRoleIds: z.array(z.string()).optional(),
        customAnnouncementLine: z
            .string()
            .max(500, 'Announcement line must be 500 characters or less')
            .transform(v => sanitizeText(v, { maxLength: 500 }))
            .optional(),
        requirements: z
            .array(
                z.object({
                    type: z.string(),
                    config: z.record(z.string(), z.unknown()),
                }),
            )
            .optional(),
    })
    .refine(
        data => {
            // If FCFS, maxWinners is required
            if (data.selectionMode === 'FCFS' && !data.maxWinners) {
                return false;
            }
            return true;
        },
        {
            message: 'Max entry capacity is required for FCFS selection mode',
            path: ['maxWinners'],
        },
    );

export const createEntrySchema = z.object({
    eventId: z.string().cuid(),
    walletAddress: z.string().transform(v => sanitizeId(v, 'solana')),
    discordUserId: z
        .string()
        .transform(v => sanitizeId(v, 'discord'))
        .optional(),
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
        .max(100, 'Name must be 100 characters or less')
        .transform(v => sanitizeText(v, { maxLength: 100 })),
    slug: z
        .string()
        .min(1, 'Slug is required')
        .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens')
        .max(50, 'Slug must be 50 characters or less'),
    types: z.array(z.string()).min(1, 'Select at least one community type').max(10, 'Too many types selected'),
    description: z
        .string()
        .max(1000, 'Description must be 1000 characters or less')
        .transform(v => sanitizeText(v, { maxLength: 1000 }))
        .optional(),
    discordGuildId: z.string().optional(),
    socials: z.record(z.string(), z.string()).optional(),
    settings: z
        .object({
            discord: z
                .object({
                    announcementChannelId: z.string().optional(),
                    giveawayChannelId: z.string().optional(),
                    giveawayEntryChannelId: z.string().optional(),
                    winnerChannelId: z.string().optional(),
                    adminChannelId: z.string().optional(),
                })
                .optional(),
        })
        .optional(),
    logo: z.string().optional(), // Base64 encoded image
    banner: z.string().optional(), // Base64 encoded image
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
