/**
 * Entry verification API endpoint
 * Handles sync verification of Discord + Solana requirements
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/middleware';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { verifyDiscordRequirements } from '@/lib/verification/discord';
import { verifySolanaRequirements } from '@/lib/verification/solana';
import { ApiError } from '@/lib/api-utils';

/**
 * POST /api/entries/[entryId]/verify
 * Admin-only endpoint to manually verify an entry
 * Also called internally during entry creation for sync verification
 */
export async function POST(_req: NextRequest, { params }: { params: Promise<{ entryId: string }> }) {
    try {
        const { entryId } = await params;
        const user = await getCurrentUser();

        // Get entry with event and requirements
        const entry = await db.entry.findUnique({
            where: { id: entryId },
            include: {
                event: {
                    include: {
                        community: true,
                        requirements: true,
                    },
                },
            },
        });

        if (!entry) {
            return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
        }

        // Check admin access to community
        const community = entry.event.community;
        if (community.ownerId !== user.id) {
            const membership = await db.communityMember.findUnique({
                where: {
                    communityId_userId: {
                        communityId: community.id,
                        userId: user.id,
                    },
                },
            });

            if (!membership || (membership.role !== 'OWNER' && membership.role !== 'ADMIN')) {
                return NextResponse.json({ error: 'Community admin access required' }, { status: 403 });
            }
        }

        // Get session with Discord access token
        const session = await auth();

        // Verify entry
        const verificationResult = await verifyEntry(entry, community, session?.discordAccessToken);

        // Update entry status
        await db.entry.update({
            where: { id: entryId },
            data: {
                status: verificationResult.status,
            },
        });

        return NextResponse.json(verificationResult);
    } catch (error) {
        console.error('[API Error] POST /api/entries/[entryId]/verify:', error);
        
        if (error instanceof ApiError) {
            return NextResponse.json(
                { error: error.code, message: error.message },
                { status: error.statusCode }
            );
        }

        return NextResponse.json(
            {
                error: 'INTERNAL_SERVER_ERROR',
                message: 'Failed to verify entry',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}

/**
 * Internal function to verify an entry against requirements
 * @param entry - Entry with event, community, and requirements included
 * @param community - Community object with guildId
 * @param discordAccessToken - User's Discord access token for guild membership check
 */
export async function verifyEntry(
    entry: any,
    community: any,
    discordAccessToken?: string,
): Promise<{
    valid: boolean;
    entryId: string;
    status: string;
    discordValid?: boolean;
    solanaValid?: boolean;
    discordReason?: string;
    solanaReasons?: string[];
}> {
    const result: any = {
        valid: true,
        entryId: entry.id,
        status: 'VALID',
    };

    // Group requirements by type
    const discordReqs = entry.event.requirements.filter((r: any) => r.type.startsWith('DISCORD_'));
    const solanaReqs = entry.event.requirements.filter((r: any) => r.type.startsWith('SOLANA_'));

    // Verify Discord requirements (if community has Discord guild)
    if (discordReqs.length > 0 && community.guildId && entry.discordUserId) {
        if (!discordAccessToken) {
            result.discordValid = false;
            result.discordReason = 'Discord access token not available - please re-login with Discord';
            result.valid = false;
        } else {
            const discordVerification = await verifyDiscordRequirements(
                community.guildId,
                entry.discordUserId,
                entry.discordUserId,
                discordAccessToken,
                process.env.DISCORD_BOT_TOKEN || '',
                parseDiscordRequirements(discordReqs),
            );

            result.discordValid = discordVerification.valid;
            if (!discordVerification.valid) {
                result.discordReason = discordVerification.reason;
                result.valid = false;
            }
        }
    }

    // Verify Solana requirements
    if (solanaReqs.length > 0) {
        const solanaReqsArray = parseSolanaRequirements(solanaReqs);
        const solanaVerification = await verifySolanaRequirements(entry.walletAddress, solanaReqsArray);

        result.solanaValid = solanaVerification.valid;
        if (!solanaVerification.valid) {
            result.solanaReasons = solanaVerification.reasons;
            result.valid = false;
        }
    }

    result.status = result.valid ? 'VALID' : 'INVALID';

    return result;
}

/**
 * Parse Discord requirements from requirement config
 */
function parseDiscordRequirements(discordReqs: any[]): {
    minAccountAgeDays?: number;
    minServerJoinAgeDays?: number;
    requiredRoleIds?: string[];
} {
    const result: any = {};

    for (const req of discordReqs) {
        if (req.type === 'DISCORD_ACCOUNT_AGE') {
            result.minAccountAgeDays = req.config.minDays;
        }
        if (req.type === 'DISCORD_SERVER_JOIN_AGE') {
            result.minServerJoinAgeDays = req.config.minDays;
        }
        if (req.type === 'DISCORD_ROLE_REQUIRED') {
            result.requiredRoleIds = req.config.roleIds || [];
        }
    }

    return result;
}

/**
 * Parse Solana requirements from requirement config
 */
function parseSolanaRequirements(
    solanaReqs: any[],
): Array<{ type: 'TOKEN_BALANCE' | 'NFT_OWNERSHIP'; mint: string; amount: number }> {
    return solanaReqs
        .map(req => {
            if (req.type === 'SOLANA_TOKEN_BALANCE') {
                return {
                    type: 'TOKEN_BALANCE' as const,
                    mint: req.config.mint,
                    amount: req.config.minAmount,
                };
            }
            if (req.type === 'SOLANA_NFT_OWNERSHIP') {
                return {
                    type: 'NFT_OWNERSHIP' as const,
                    mint: req.config.collectionMint,
                    amount: req.config.minCount || 1,
                };
            }
            return null;
        })
        .filter(Boolean) as Array<{
        type: 'TOKEN_BALANCE' | 'NFT_OWNERSHIP';
        mint: string;
        amount: number;
    }>;
}
