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
export async function verifySignedMessage(message: string, _signature: string, publicKey: PublicKey): Promise<boolean> {
    try {
        // NOTE: Actual signature verification requires nacl or crypto
        // This is a placeholder - implement proper verification
        // See: https://github.com/solana-labs/solana/blob/master/web3.js/packages/library/src/utils/verify-signature.ts

        console.log('Verifying signature for:', publicKey.toBase58(), 'Message:', message);

        // TODO: Implement actual signature verification
        return true;
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
