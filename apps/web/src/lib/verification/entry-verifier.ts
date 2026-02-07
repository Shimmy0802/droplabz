import { PublicKey } from '@solana/web3.js';
import { getAssociatedTokenAddress } from '@solana/spl-token';
import { db } from '@/lib/db';
import axios from 'axios';
import { Requirement } from '@prisma/client';

export interface VerificationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    verifiedAt: Date;
}

/**
 * Verify Discord requirements for an entry
 */
export async function verifyDiscordRequirements(
    discordUserId: string | undefined,
    guildId: string | undefined,
    requirements: Requirement[],
): Promise<VerificationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // If no Discord guild or user, skip Discord verification
    if (!guildId || !discordUserId) {
        if (requirements.some(r => r.type.includes('DISCORD'))) {
            return {
                isValid: false,
                errors: ['Discord verification required but no Discord user ID or guild provided'],
                warnings,
                verifiedAt: new Date(),
            };
        }
        return {
            isValid: true,
            errors,
            warnings: ['Discord verification skipped (optional)'],
            verifiedAt: new Date(),
        };
    }

    try {
        const botToken = process.env.DISCORD_BOT_TOKEN;
        if (!botToken) {
            errors.push('Discord bot not configured');
            return { isValid: false, errors, warnings, verifiedAt: new Date() };
        }

        // Get guild member info from Discord API
        const memberResponse = await axios.get(
            `https://discord.com/api/v10/guilds/${guildId}/members/${discordUserId}`,
            {
                headers: {
                    Authorization: `Bot ${botToken}`,
                },
            },
        );

        const member = memberResponse.data;

        // Check each Discord requirement
        for (const requirement of requirements.filter(r => r.type.includes('DISCORD'))) {
            const config = requirement.config as Record<string, any> | null;
            if (!config) continue;

            if (requirement.type === 'DISCORD_MEMBER_REQUIRED') {
                // User is already a member (passed the API call above)
                continue;
            }

            if (requirement.type === 'DISCORD_ROLE_REQUIRED') {
                const requiredRoleId = config.roleId as string | undefined;
                // Skip verification if roleId is not set (shouldn't happen with form validation, but safety check)
                if (!requiredRoleId || requiredRoleId.trim() === '') {
                    warnings.push('Discord role requirement not configured with role ID');
                    continue;
                }
                if (!member.roles.includes(requiredRoleId)) {
                    errors.push(`Missing required Discord role: ${config.roleName || requiredRoleId}`);
                }
            }

            if (requirement.type === 'DISCORD_ACCOUNT_AGE_REQUIRED') {
                const minAgeHours = (config.minAgeHours as number) || 24;
                const createdAt = new Date(member.user.created_at);
                const ageHours = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);

                if (ageHours < minAgeHours) {
                    errors.push(`Discord account must be at least ${minAgeHours} hours old`);
                }
            }

            if (requirement.type === 'DISCORD_SERVER_JOIN_AGE_REQUIRED') {
                const minJoinAgeHours = (config.minJoinAgeHours as number) || 24;
                const joinedAt = new Date(member.joined_at);
                const ageHours = (Date.now() - joinedAt.getTime()) / (1000 * 60 * 60);

                if (ageHours < minJoinAgeHours) {
                    errors.push(`Must have been in server for at least ${minJoinAgeHours} hours`);
                }
            }
        }

        return { isValid: errors.length === 0, errors, warnings, verifiedAt: new Date() };
    } catch (err) {
        errors.push(`Discord verification error: ${err instanceof Error ? err.message : 'Unknown error'}`);
        return { isValid: false, errors, warnings, verifiedAt: new Date() };
    }
}

/**
 * Verify Solana requirements for an entry
 */
export async function verifySolanaRequirements(
    walletAddress: string,
    requirements: Requirement[],
): Promise<VerificationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
        const publicKey = new PublicKey(walletAddress);

        for (const requirement of requirements.filter(r => r.type.includes('SOLANA'))) {
            const config = requirement.config as Record<string, any> | null;
            if (!config) continue;

            if (requirement.type === 'SOLANA_TOKEN_HOLDING_REQUIRED') {
                const mint = config.mint as string | undefined;
                const minAmount = config.minAmount as number | undefined;

                if (!mint || minAmount === undefined) {
                    errors.push('Token requirement misconfigured');
                    continue;
                }

                try {
                    const tokenMint = new PublicKey(mint);
                    // Derive ATA but don't use it yet - full verification needs RPC
                    await getAssociatedTokenAddress(tokenMint, publicKey);

                    // Note: We'd need to fetch from RPC here
                    // For now, we'll log that this would be verified
                    warnings.push(`Token balance verification (${mint}) would be performed on-chain`);
                } catch (err) {
                    errors.push(`Invalid token mint: ${mint}`);
                }
            }

            if (requirement.type === 'SOLANA_NFT_HOLDING_REQUIRED') {
                const collection = config.collection as string | undefined;

                if (!collection) {
                    errors.push('NFT requirement misconfigured');
                    continue;
                }

                warnings.push(`NFT ownership verification for collection ${collection} would be performed on-chain`);
            }
        }

        return { isValid: errors.length === 0, errors, warnings, verifiedAt: new Date() };
    } catch (err) {
        errors.push(`Solana verification error: ${err instanceof Error ? err.message : 'Unknown error'}`);
        return { isValid: false, errors, warnings, verifiedAt: new Date() };
    }
}

/**
 * Verify entry against all requirements
 */
export async function verifyEntry(
    walletAddress: string,
    discordUserId: string | undefined,
    guildId: string | undefined,
    requirements: Requirement[],
): Promise<VerificationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Verify Discord requirements if present
    const discordReqs = requirements.filter(r => r.type.startsWith('DISCORD_'));
    if (discordReqs.length > 0) {
        const discordResult = await verifyDiscordRequirements(discordUserId, guildId, discordReqs);
        errors.push(...discordResult.errors);
        warnings.push(...discordResult.warnings);
    }

    // Verify Solana requirements if present
    const solanaReqs = requirements.filter(r => r.type.startsWith('SOLANA_'));
    if (solanaReqs.length > 0) {
        const solanaResult = await verifySolanaRequirements(walletAddress, solanaReqs);
        errors.push(...solanaResult.errors);
        warnings.push(...solanaResult.warnings);
    }

    const isValid = errors.length === 0;

    return {
        isValid,
        errors,
        warnings,
        verifiedAt: new Date(),
    };
}

/**
 * Verify and update entry status in database
 */
export async function verifyAndUpdateEntry(
    entryId: string,
    walletAddress: string,
    discordUserId: string | null | undefined,
    requirements: Requirement[],
) {
    // Get community guild ID from event
    const entry = await db.entry.findUnique({
        where: { id: entryId },
        include: {
            event: {
                select: {
                    communityId: true,
                },
            },
        },
    });

    if (!entry) {
        throw new Error('Entry not found');
    }

    const community = await db.community.findUnique({
        where: { id: entry.event.communityId },
        select: { guildId: true },
    });

    const guildId = community?.guildId;

    // Verify entry (convert null to undefined)
    const result = await verifyEntry(walletAddress, discordUserId || undefined, guildId || undefined, requirements);

    // Update entry with verification results
    const updatedEntry = await db.entry.update({
        where: { id: entryId },
        data: {
            status: result.isValid ? 'VALID' : 'INVALID',
        },
    });

    return {
        entry: updatedEntry,
        verification: result,
    };
}
