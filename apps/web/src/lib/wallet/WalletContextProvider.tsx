'use client';

/**
 * Solana Wallet Adapter Context Provider
 *
 * This component sets up the Anza wallet adapter (formerly Solana Labs wallet-adapter)
 * with proper configuration for DropLabz.
 *
 * Reference: https://github.com/anza-xyz/wallet-adapter
 * Docs: https://github.com/anza-xyz/wallet-adapter/blob/main/APP.md
 */

import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { clusterApiUrl } from '@solana/web3.js';
import { ReactNode, useMemo } from 'react';

// Default styles from Anza wallet adapter
import '@solana/wallet-adapter-react-ui/styles.css';

interface WalletContextProviderProps {
    children: ReactNode;
}

/**
 * WalletContextProvider wraps your app with wallet connection providers.
 *
 * It configures:
 * - ConnectionProvider: Manages RPC endpoint connection
 * - WalletProvider: Manages wallet adapter lifecycle
 * - WalletModalProvider: Provides wallet selection modal UI
 *
 * The provider automatically:
 * - Detects installed wallets via Solana Wallet Standard
 * - Supports Mobile Wallet Adapter Protocol on mobile devices
 * - Auto-connects to previously selected wallet (if available)
 * - Persists wallet selection in localStorage
 */
export function WalletContextProvider({ children }: WalletContextProviderProps) {
    // The network can be set to 'devnet', 'testnet', or 'mainnet-beta'.
    // For development, use devnet; for production, use mainnet-beta.
    const network = process.env.NEXT_PUBLIC_SOLANA_NETWORK
        ? (process.env.NEXT_PUBLIC_SOLANA_NETWORK as WalletAdapterNetwork)
        : WalletAdapterNetwork.Devnet;

    // You can also provide a custom RPC endpoint via environment variable
    const endpoint = useMemo(() => {
        const customRpc = process.env.NEXT_PUBLIC_SOLANA_RPC_URL;
        if (customRpc) return customRpc;
        return clusterApiUrl(network);
    }, [network]);

    const wallets = useMemo(
        () => [
            /**
             * Wallets that implement either of these standards will be available automatically:
             *
             * 1. Solana Wallet Standard
             *    (https://github.com/anza-xyz/wallet-standard)
             *    This is the modern standard - most wallets support it.
             *
             * 2. Solana Mobile Stack Mobile Wallet Adapter Protocol
             *    (https://github.com/solana-mobile/mobile-wallet-adapter)
             *    This is for mobile wallets on native mobile apps.
             *
             * The WalletProvider automatically discovers and uses these wallets.
             * You don't need to manually instantiate them here.
             *
             * For legacy wallets that don't support these standards, you would
             * instantiate specific adapters here. Examples can be found in:
             * @solana/wallet-adapter-wallets
             */
        ],
        [],
    );

    return (
        <ConnectionProvider endpoint={endpoint}>
            <WalletProvider
                wallets={wallets}
                autoConnect={true}
                onError={error => {
                    // Ignore user rejection errors - this is normal behavior when user cancels wallet connection
                    if (
                        error.message?.includes('User rejected') ||
                        error.message?.includes('user rejected') ||
                        error.message?.includes('User cancelled') ||
                        error.message?.includes('user cancelled')
                    ) {
                        return;
                    }
                    // Log actual errors
                    console.error('Wallet error:', error.message);
                }}
            >
                <WalletModalProvider>{children}</WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>
    );
}
