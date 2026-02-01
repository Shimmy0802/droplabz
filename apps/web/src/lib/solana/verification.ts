import { PublicKey } from '@solana/web3.js';
import nacl from 'tweetnacl';
import { ApiError } from '../api-utils';

/**
 * Validates a Solana public key string.
 * Returns the PublicKey if valid, throws ApiError if invalid.
 */
export function validateSolanaAddress(address: string): PublicKey {
    try {
        return new PublicKey(address);
    } catch (error) {
        throw new ApiError('INVALID_WALLET', 400, 'Invalid Solana wallet address');
    }
}

/**
 * Verifies a wallet signature to prove ownership.
 * Uses NaCl to verify that the message was signed by the wallet's private key.
 */
export async function verifyWalletSignature(
    publicKey: PublicKey,
    message: string,
    signatureBase58: string,
): Promise<boolean> {
    try {
        // Decode the signature from base58
        const signatureBytes = Buffer.from(signatureBase58, 'base64');

        // Convert message to bytes
        const messageBytes = Buffer.from(message, 'utf-8');

        // Verify the signature using NaCl
        return nacl.sign.detached.verify(messageBytes, signatureBytes, publicKey.toBuffer());
    } catch (error) {
        console.error('Error verifying signature:', error);
        return false;
    }
}

/**
 * Verifies wallet ownership by checking signature.
 * This is a placeholder - implement actual verification logic.
 */
export async function verifyWalletOwnership(walletAddress: string, _signature?: string): Promise<boolean> {
    // TODO: Implement actual signature verification
    // For MVP, accept any valid wallet address
    try {
        validateSolanaAddress(walletAddress);
        return true;
    } catch {
        return false;
    }
}
