'use client';

/**
 * Wallet-related hooks and utilities for DropLabz
 *
 * These hooks provide type-safe access to wallet state and methods.
 */

import { useConnection, useWallet, useLocalStorage } from '@solana/wallet-adapter-react';
import { WalletNotConnectedError } from '@solana/wallet-adapter-base';
import { useCallback } from 'react';

/**
 * Hook to access wallet connection state
 *
 * Usage:
 * const { wallet, publicKey, connecting, connected } = useWalletState()
 */
export function useWalletState() {
    const { wallet, publicKey, connecting, connected } = useWallet();

    return {
        wallet,
        publicKey,
        connecting,
        connected,
        hasWallet: !!wallet,
        isReady: connected && publicKey !== null,
    };
}

/**
 * Hook to handle wallet connections safely
 *
 * Usage:
 * const handleConnect = useWalletConnect()
 * const { loading, error } = await handleConnect()
 */
export function useWalletConnect() {
    const { select, wallets, connect } = useWallet();

    return useCallback(
        async (walletName?: string) => {
            try {
                if (!walletName && wallets.length > 0) {
                    // If no wallet specified, select the first available
                    select(wallets[0].adapter.name);
                } else if (walletName) {
                    select(walletName as any);
                }

                await connect();

                return { loading: false, error: null };
            } catch (error) {
                console.error('Wallet connection error:', error);
                return {
                    loading: false,
                    error: error instanceof Error ? error.message : 'Failed to connect wallet',
                };
            }
        },
        [select, wallets, connect],
    );
}

/**
 * Hook to require wallet connection
 * Throws WalletNotConnectedError if wallet not connected
 *
 * Usage:
 * const publicKey = useRequireWallet()
 */
export function useRequireWallet() {
    const { publicKey } = useWallet();

    if (!publicKey) {
        throw new WalletNotConnectedError();
    }

    return publicKey;
}

/**
 * Hook to access connection for RPC calls
 *
 * Usage:
 * const { connection } = useWalletConnection()
 */
export function useWalletConnection() {
    return useConnection();
}

/**
 * Hook to access selected wallet name from localStorage
 *
 * Usage:
 * const [walletName, setWalletName] = useSelectedWallet()
 */
export function useSelectedWallet() {
    return useLocalStorage<string | null>('walletName', null);
}
