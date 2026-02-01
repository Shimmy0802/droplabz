import { z } from 'zod';

/**
 * Solana-specific utilities and helpers
 */

export const SolanaAddressSchema = z.string().refine(
    address => {
        try {
            // Validate Base58 format
            const decoded = Buffer.from(address, 'utf8');
            return decoded.length === 32 || decoded.length === 34;
        } catch {
            return false;
        }
    },
    { message: 'Invalid Solana address' },
);

export function validateSolanaAddress(address: string): boolean {
    try {
        SolanaAddressSchema.parse(address);
        return true;
    } catch {
        return false;
    }
}

export interface WalletOwnershipChallenge {
    challenge: string;
    timestamp: number;
}

export interface VerificationResult {
    verified: boolean;
    walletAddress: string;
    timestamp: number;
}
