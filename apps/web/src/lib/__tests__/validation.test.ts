import { describe, expect, it } from 'vitest';
import { createCommunitySchema, createEntrySchema, createEventSchema } from '@/lib/validation';

describe('validation schemas', () => {
    it('requires maxWinners for FCFS events', () => {
        const data = {
            communityId: 'cl9fap9hf0000lr0u8l0u8l0u',
            type: 'GIVEAWAY',
            title: 'Test Event',
            endAt: new Date().toISOString(),
            selectionMode: 'FCFS',
        };

        expect(() => createEventSchema.parse(data)).toThrowError();
    });

    it('accepts valid event data', () => {
        const data = {
            communityId: 'cl9fap9hf0000lr0u8l0u8l0u',
            type: 'GIVEAWAY',
            title: 'Test Event',
            endAt: new Date().toISOString(),
        };

        expect(() => createEventSchema.parse(data)).not.toThrow();
    });

    it('rejects invalid community slug', () => {
        const data = {
            name: 'Community',
            slug: 'Bad_Slug',
            types: ['NFT'],
        };

        expect(() => createCommunitySchema.parse(data)).toThrowError();
    });

    it('accepts valid community data', () => {
        const data = {
            name: 'Community',
            slug: 'community-slug',
            types: ['NFT'],
            description: 'Hello world',
        };

        expect(() => createCommunitySchema.parse(data)).not.toThrow();
    });

    it('validates entry wallet address format', () => {
        const walletAddress = 'A'.repeat(43);
        const data = {
            eventId: 'cl9fap9hf0000lr0u8l0u8l0u',
            walletAddress,
        };

        expect(() => createEntrySchema.parse(data)).not.toThrow();
    });

    it('rejects invalid discord user id', () => {
        const walletAddress = 'A'.repeat(43);
        const data = {
            eventId: 'cl9fap9hf0000lr0u8l0u8l0u',
            walletAddress,
            discordUserId: 'bad-id',
        };

        expect(() => createEntrySchema.parse(data)).toThrowError();
    });
});
