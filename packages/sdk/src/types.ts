import { z } from 'zod';

/**
 * Shared types and schemas used across web, bot, and programs
 */

// User types
export const UserRoleSchema = z.enum(['SUPER_ADMIN', 'ADMIN', 'MEMBER']);
export type UserRole = z.infer<typeof UserRoleSchema>;

export const UserSchema = z.object({
    id: z.string().cuid(),
    email: z.string().email().nullable(),
    username: z.string().nullable(),
    role: UserRoleSchema,
    discordId: z.string().nullable(),
});

export type User = z.infer<typeof UserSchema>;

// Community Member types
export const CommunityMemberRoleSchema = z.enum(['OWNER', 'ADMIN', 'MODERATOR', 'MEMBER']);
export type CommunityMemberRole = z.infer<typeof CommunityMemberRoleSchema>;

export const CommunityMemberSchema = z.object({
    id: z.string().cuid(),
    communityId: z.string().cuid(),
    userId: z.string().cuid(),
    role: CommunityMemberRoleSchema,
});

export type CommunityMember = z.infer<typeof CommunityMemberSchema>;

// Community types
export const CommunitySchema = z.object({
    id: z.string().cuid(),
    ownerId: z.string().cuid(),
    guildId: z.string().nullable(),
    slug: z.string(),
    name: z.string(),
    description: z.string().nullable(),
    isListed: z.boolean(),
    boostLevel: z.number().int(),
    categories: z.array(z.string()).default([]),
    tags: z.array(z.string()),
    rating: z.number().nullable(),
    isVerified: z.boolean().default(false),
    verificationStatus: z.enum(['PENDING', 'APPROVED', 'REJECTED']).default('PENDING'),
});

export type Community = z.infer<typeof CommunitySchema>;

// Subscription types
export const SubscriptionTierSchema = z.enum(['FREE', 'PRO', 'ENTERPRISE']);
export type SubscriptionTier = z.infer<typeof SubscriptionTierSchema>;

export const SubscriptionStatusSchema = z.enum(['ACTIVE', 'CANCELED', 'PAST_DUE', 'TRIALING']);
export type SubscriptionStatus = z.infer<typeof SubscriptionStatusSchema>;

export const SubscriptionSchema = z.object({
    id: z.string().cuid(),
    communityId: z.string().cuid(),
    tier: SubscriptionTierSchema,
    status: SubscriptionStatusSchema,
    stripeCustomerId: z.string().nullable(),
    stripeSubId: z.string().nullable(),
    currentPeriodEnd: z.coerce.date().nullable(),
});

export type Subscription = z.infer<typeof SubscriptionSchema>;

// Review types
export const ReviewSchema = z.object({
    id: z.string().cuid(),
    communityId: z.string().cuid(),
    userId: z.string().cuid(),
    rating: z.number().int().min(1).max(5),
    comment: z.string().nullable(),
});

export type Review = z.infer<typeof ReviewSchema>;

export const EventTypeSchema = z.enum(['GIVEAWAY', 'WHITELIST', 'ACCESS', 'AIRDROP']);

export const EventStatusSchema = z.enum(['DRAFT', 'ACTIVE', 'CLOSED']);

export const EventSchema = z.object({
    id: z.string().cuid(),
    communityId: z.string().cuid(),
    type: EventTypeSchema,
    title: z.string(),
    description: z.string().optional(),
    prize: z.string().optional(),
    imageUrl: z.string().url().optional(),
    startAt: z.coerce.date(),
    endAt: z.coerce.date(),
    status: EventStatusSchema,
    maxWinners: z.number().int().positive(),
    selectionMode: z.enum(['RANDOM', 'MANUAL']),
});

export type Event = z.infer<typeof EventSchema>;

export const RequirementTypeSchema = z.enum([
    'DISCORD_MEMBER_REQUIRED',
    'DISCORD_ROLE_REQUIRED',
    'DISCORD_ACCOUNT_AGE_DAYS',
    'DISCORD_SERVER_JOIN_AGE_DAYS',
    'SOLANA_WALLET_CONNECTED',
    'SOLANA_TOKEN_HOLDING',
    'SOLANA_NFT_OWNERSHIP',
]);

export const RequirementSchema = z.object({
    id: z.string().cuid(),
    eventId: z.string().cuid(),
    type: RequirementTypeSchema,
    config: z.record(z.string(), z.unknown()),
});

export type Requirement = z.infer<typeof RequirementSchema>;

export const EntryStatusSchema = z.enum(['PENDING', 'VALID', 'INVALID']);

export const EntrySchema = z.object({
    id: z.string().cuid(),
    eventId: z.string().cuid(),
    walletAddress: z.string(),
    status: EntryStatusSchema,
});

export type Entry = z.infer<typeof EntrySchema>;

export const WinnerSchema = z.object({
    id: z.string().cuid(),
    eventId: z.string().cuid(),
    entryId: z.string().cuid(),
    pickedAt: z.coerce.date(),
    pickedBy: z.string(),
});

export type Winner = z.infer<typeof WinnerSchema>;

export const AuditLogSchema = z.object({
    id: z.string().cuid(),
    communityId: z.string().cuid(),
    actorId: z.string(),
    action: z.string(),
    meta: z.record(z.string(), z.unknown()).optional(),
    createdAt: z.coerce.date(),
});

export type AuditLog = z.infer<typeof AuditLogSchema>;
