/**
 * Duplicate Entry Detection Utilities
 *
 * Inspired by Subber's duplicate detection features, this module identifies
 * potential duplicate entries across multiple signals:
 * - Same wallet address (already enforced by unique constraint)
 * - Same Discord user ID across different wallets
 * - Similar submission patterns (timing, IP address if tracked)
 * - Same wallet participating in multiple related events
 */

import { db } from '@/lib/db';

export interface DuplicateSignal {
    type: 'WALLET_REUSE' | 'DISCORD_REUSE' | 'TIMING_PATTERN' | 'MULTI_EVENT';
    severity: 'LOW' | 'MEDIUM' | 'HIGH';
    description: string;
    relatedEntryIds: string[];
}

export interface DuplicateAnalysis {
    entryId: string;
    isPotentialDuplicate: boolean;
    signals: DuplicateSignal[];
    riskScore: number; // 0-100
}

/**
 * Analyze an entry for potential duplicate signals
 */
export async function analyzeDuplicateEntry(entryId: string): Promise<DuplicateAnalysis> {
    const entry = await db.entry.findUnique({
        where: { id: entryId },
        select: {
            id: true,
            walletAddress: true,
            discordUserId: true,
            eventId: true,
            createdAt: true,
        },
    });

    if (!entry) {
        throw new Error('Entry not found');
    }

    const signals: DuplicateSignal[] = [];
    let riskScore = 0;

    // Check for Discord ID reuse across different wallets in the same event
    if (entry.discordUserId) {
        const discordDuplicates = await db.entry.findMany({
            where: {
                eventId: entry.eventId,
                discordUserId: entry.discordUserId,
                walletAddress: { not: entry.walletAddress },
                id: { not: entry.id },
            },
            select: { id: true, walletAddress: true },
        });

        if (discordDuplicates.length > 0) {
            signals.push({
                type: 'DISCORD_REUSE',
                severity: 'HIGH',
                description: `Discord account used with ${discordDuplicates.length + 1} different wallets in this event`,
                relatedEntryIds: discordDuplicates.map(e => e.id),
            });
            riskScore += 40;
        }
    }

    // Check for same wallet across multiple events in the same community
    const event = await db.event.findUnique({
        where: { id: entry.eventId },
        select: { communityId: true },
    });

    if (event) {
        const multiEventEntries = await db.entry.findMany({
            where: {
                walletAddress: entry.walletAddress,
                event: {
                    communityId: event.communityId,
                    id: { not: entry.eventId },
                },
            },
            select: {
                id: true,
                eventId: true,
                event: {
                    select: { title: true },
                },
            },
        });

        if (multiEventEntries.length >= 5) {
            signals.push({
                type: 'MULTI_EVENT',
                severity: 'LOW',
                description: `Wallet participated in ${multiEventEntries.length} other events from this community`,
                relatedEntryIds: multiEventEntries.map(e => e.id),
            });
            riskScore += 10;
        }
    }

    // Check for rapid submissions (timing pattern)
    const recentEntries = await db.entry.findMany({
        where: {
            eventId: entry.eventId,
            createdAt: {
                gte: new Date(entry.createdAt.getTime() - 60000), // Within 1 minute
                lte: new Date(entry.createdAt.getTime() + 60000),
            },
            id: { not: entry.id },
        },
        select: {
            id: true,
            walletAddress: true,
            createdAt: true,
        },
        take: 10,
    });

    if (recentEntries.length >= 5) {
        signals.push({
            type: 'TIMING_PATTERN',
            severity: 'MEDIUM',
            description: `${recentEntries.length} entries submitted within 1 minute window`,
            relatedEntryIds: recentEntries.map(e => e.id),
        });
        riskScore += 20;
    }

    return {
        entryId: entry.id,
        isPotentialDuplicate: signals.length > 0,
        signals,
        riskScore: Math.min(riskScore, 100),
    };
}

/**
 * Get duplicate analysis for all entries in an event
 */
export async function analyzeEventDuplicates(eventId: string): Promise<DuplicateAnalysis[]> {
    const entries = await db.entry.findMany({
        where: { eventId },
        select: { id: true },
    });

    const analyses = await Promise.all(entries.map(entry => analyzeDuplicateEntry(entry.id)));

    // Sort by risk score descending
    return analyses.sort((a, b) => b.riskScore - a.riskScore);
}
