import { describe, expect, it } from 'vitest';
import nacl from 'tweetnacl';
import { Keypair, PublicKey } from '@solana/web3.js';
import { validateSolanaAddress, verifyWalletOwnership, verifyWalletSignature } from '@/lib/solana/verification';

describe('solana verification', () => {
    it('validates solana address format', () => {
        const address = Keypair.generate().publicKey.toBase58();
        const publicKey = validateSolanaAddress(address);
        expect(publicKey).toBeInstanceOf(PublicKey);
    });

    it('rejects invalid solana address', () => {
        expect(() => validateSolanaAddress('invalid-address')).toThrowError();
    });

    it('verifies signature with matching keypair', async () => {
        const keypair = nacl.sign.keyPair();
        const publicKey = new PublicKey(keypair.publicKey);
        const message = 'test-message';
        const signature = nacl.sign.detached(Buffer.from(message), keypair.secretKey);
        const signatureBase64 = Buffer.from(signature).toString('base64');

        const isValid = await verifyWalletSignature(publicKey, message, signatureBase64);
        expect(isValid).toBe(true);
    });

    it('rejects mismatched signatures', async () => {
        const keypair = nacl.sign.keyPair();
        const otherKeypair = nacl.sign.keyPair();
        const publicKey = new PublicKey(keypair.publicKey);
        const message = 'test-message';
        const signature = nacl.sign.detached(Buffer.from(message), otherKeypair.secretKey);
        const signatureBase64 = Buffer.from(signature).toString('base64');

        const isValid = await verifyWalletSignature(publicKey, message, signatureBase64);
        expect(isValid).toBe(false);
    });

    it('verifies wallet ownership with address', async () => {
        const keypair = Keypair.generate();
        const message = 'ownership-check';
        const signature = nacl.sign.detached(Buffer.from(message), keypair.secretKey);
        const signatureBase64 = Buffer.from(signature).toString('base64');

        const isValid = await verifyWalletOwnership(keypair.publicKey.toBase58(), message, signatureBase64);
        expect(isValid).toBe(true);
    });
});
