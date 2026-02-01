/**
 * Solana verification utilities
 * Checks token balances and NFT ownership
 */

import { Connection, PublicKey } from '@solana/web3.js';

/**
 * Get Solana RPC connection
 */
function getConnection(): Connection {
    const rpcUrl = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';
    return new Connection(rpcUrl, 'confirmed');
}

/**
 * Check token balance for a wallet
 * @param walletAddress - User's Solana wallet address
 * @param mintAddress - Token mint address
 * @param minBalance - Minimum tokens required
 */
export async function checkTokenBalance(
    walletAddress: string,
    mintAddress: string,
    minBalance: number,
): Promise<{ valid: boolean; balance?: number; reason?: string }> {
    try {
        const connection = getConnection();
        const wallet = new PublicKey(walletAddress);
        const mint = new PublicKey(mintAddress);

        // Get token account info
        const tokenAccount = await connection.getTokenAccountsByOwner(wallet, { mint });

        if (tokenAccount.value.length === 0) {
            return { valid: false, balance: 0, reason: `No tokens found for mint ${mintAddress}` };
        }

        // Get token balance from the token account
        const accountData = tokenAccount.value[0];
        const balance = await connection.getTokenAccountBalance(accountData.pubkey);

        const amount = parseFloat(balance.value.amount);
        const decimals = balance.value.decimals;
        const adjustedAmount = amount / Math.pow(10, decimals);

        if (adjustedAmount < minBalance) {
            return {
                valid: false,
                balance: adjustedAmount,
                reason: `Insufficient token balance. Required: ${minBalance}, Current: ${adjustedAmount.toFixed(decimals)}`,
            };
        }

        return { valid: true, balance: adjustedAmount };
    } catch (error) {
        console.error('Error checking token balance:', error);
        return {
            valid: false,
            reason: `Failed to verify token balance: ${error instanceof Error ? error.message : 'Unknown error'}`,
        };
    }
}

/**
 * Check NFT ownership (simplified - checks if wallet owns any token from a collection)
 * @param walletAddress - User's Solana wallet address
 * @param collectionMint - NFT collection mint address (or specific NFT mint)
 * @param minCount - Minimum NFTs required
 */
export async function checkNftOwnership(
    walletAddress: string,
    _collectionMint?: string,
    minCount: number = 1,
): Promise<{ valid: boolean; count?: number; reason?: string }> {
    try {
        const connection = getConnection();
        const wallet = new PublicKey(walletAddress);

        // Get all SPL token accounts for wallet
        const tokenAccounts = await connection.getParsedTokenAccountsByOwner(wallet, {
            programId: new PublicKey('TokenkegQfeZyiNwAJsyFbPVwwQQfg5bgDNCD5n5gGg'),
        });

        // Filter for NFTs (amount = 1, decimals = 0)
        const nfts = tokenAccounts.value.filter(account => {
            const parsed = account.account.data.parsed;
            if (parsed.type === 'account') {
                const tokenInfo = parsed.info.tokenAmount;
                return tokenInfo.decimals === 0 && tokenInfo.amount === '1';
            }
            return false;
        });

        // In production, you'd check collection metadata for each NFT
        // For now, we'll just verify wallet owns at least minCount NFTs
        if (nfts.length < minCount) {
            return {
                valid: false,
                count: nfts.length,
                reason: `Insufficient NFTs. Required: ${minCount}, Owned: ${nfts.length}`,
            };
        }

        return { valid: true, count: nfts.length };
    } catch (error) {
        console.error('Error checking NFT ownership:', error);
        return {
            valid: false,
            reason: `Failed to verify NFT ownership: ${error instanceof Error ? error.message : 'Unknown error'}`,
        };
    }
}

/**
 * Verify all Solana requirements for an entry
 */
export async function verifySolanaRequirements(
    walletAddress: string,
    requirements: Array<{
        type: 'TOKEN_BALANCE' | 'NFT_OWNERSHIP';
        mint: string;
        amount: number;
    }>,
): Promise<{ valid: boolean; reasons?: string[] }> {
    const reasons: string[] = [];

    for (const req of requirements) {
        if (req.type === 'TOKEN_BALANCE') {
            const result = await checkTokenBalance(walletAddress, req.mint, req.amount);
            if (!result.valid && result.reason) {
                reasons.push(result.reason);
            }
        } else if (req.type === 'NFT_OWNERSHIP') {
            const result = await checkNftOwnership(walletAddress, req.mint, req.amount);
            if (!result.valid && result.reason) {
                reasons.push(result.reason);
            }
        }
    }

    return {
        valid: reasons.length === 0,
        reasons: reasons.length > 0 ? reasons : undefined,
    };
}
