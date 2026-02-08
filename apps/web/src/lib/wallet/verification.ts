/**
 * Wallet verification utilities
 *
 * These functions handle wallet ownership verification for DropLabz entries.
 */

import { PublicKey, Transaction, VersionedTransaction } from '@solana/web3.js';

/**
 * Verifies that a wallet address is valid
 */
export function isValidWalletAddress(address: string): boolean {
    try {
        new PublicKey(address);
        return true;
    } catch {
        return false;
    }
}

/**
 * Creates a verification message for wallet signing
 *
 * This should be signed by the wallet to prove ownership.
 */
export function createVerificationMessage(walletAddress: string, nonce: string): string {
    return `Verify wallet ownership for DropLabz\nWallet: ${walletAddress}\nNonce: ${nonce}\nTimestamp: ${new Date().toISOString()}`;
}

/**
 * Verifies a signed message matches the expected wallet
 *
 * @param message Original message that was signed
 * @param signature Base64-encoded signature
 * @param publicKey Wallet public key that allegedly signed
 * @returns boolean indicating if signature is valid
 */
export async function verifySignedMessage(
    message: string,
    signature: string,
    publicKey: PublicKey,
): Promise<boolean> {
    try {
        // Use nacl to verify the signature
        const messageBytes = Buffer.from(message, 'utf-8');
        let signatureBytes: Uint8Array;

        try {
            // Try base64 first
            signatureBytes = Buffer.from(signature, 'base64');
        } catch {
            try {
                // Fall back to Buffer from string if base64 fails
                signatureBytes = Buffer.from(signature);
            } catch {
                return false;
            }
        }

        // Verify using nacl's detached signature verification
        const nacl = require('tweetnacl');
        return nacl.sign.detached.verify(messageBytes, signatureBytes, publicKey.toBuffer());
    } catch (error) {
        console.error('Signature verification error:', error);
        return false;
    }
}

/**
 * Prepares a transaction for signing
 *
 * This ensures the transaction is properly formatted for wallet signing.
 */
export function prepareTransactionForSigning(
    transaction: Transaction | VersionedTransaction,
    feePayer: PublicKey,
): Transaction | VersionedTransaction {
    if (transaction instanceof Transaction) {
        transaction.feePayer = feePayer;
    }
    return transaction;
}
