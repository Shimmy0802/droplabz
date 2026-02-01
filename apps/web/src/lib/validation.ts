import { z } from 'zod';

export const createEventSchema = z.object({
    communityId: z.string().cuid(),
    type: z.enum(['GIVEAWAY', 'WHITELIST', 'ACCESS', 'AIRDROP']),
    title: z.string().min(1).max(200),
    description: z.string().optional(),
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

export const createEntrySchema = z.object({
    eventId: z.string().cuid(),
    walletAddress: z.string(),
    discordUserId: z.string().nullish(),
});

export const verifyWalletSchema = z.object({
    walletAddress: z.string(),
    signature: z.string().optional(),
});

export type CreateEventInput = z.infer<typeof createEventSchema>;
export type CreateEntryInput = z.infer<typeof createEntrySchema>;
export type VerifyWalletInput = z.infer<typeof verifyWalletSchema>;
