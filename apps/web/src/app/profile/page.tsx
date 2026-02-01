'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useWalletState } from '@/lib/wallet';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useState, useEffect } from 'react';

interface LinkedWallet {
    id: string;
    walletAddress: string;
    isPrimary: boolean;
    verifiedAt: string;
}

export default function ProfilePage() {
    const { data: session, status } = useSession();
    const { publicKey, connected, wallet } = useWalletState();
    const { signMessage, disconnect } = useWallet();
    const [linkedWallets, setLinkedWallets] = useState<LinkedWallet[]>([]);
    const [isLinking, setIsLinking] = useState(false);
    const [showSwitchModal, setShowSwitchModal] = useState(false);
    const [lastCheckedWallet, setLastCheckedWallet] = useState<string | null>(null);
    const [discordUsername, setDiscordUsername] = useState<string | null>(null);

    // Modal state
    const [modal, setModal] = useState<{
        type: 'alert' | 'confirm';
        title: string;
        message: string;
        icon?: 'success' | 'error' | 'warning' | 'info';
        onConfirm?: () => void;
        onCancel?: () => void;
    } | null>(null);

    // Fetch linked wallets on mount
    useEffect(() => {
        if (session?.user) {
            fetchLinkedWallets();
            // Fetch Discord username
            fetch('/api/users/me')
                .then(res => res.json())
                .then(data => {
                    if (data.user?.discordUsername) {
                        setDiscordUsername(data.user.discordUsername);
                    }
                })
                .catch(err => console.error('Failed to fetch Discord username:', err));
        }
    }, [session]);

    // Detect when user switches accounts in wallet
    useEffect(() => {
        if (connected && publicKey) {
            const currentWalletAddress = publicKey.toBase58();
            if (lastCheckedWallet && lastCheckedWallet !== currentWalletAddress) {
                // Wallet has changed - suggest linking the new one
                const isAlreadyLinked = linkedWallets.some(w => w.walletAddress === currentWalletAddress);
                if (!isAlreadyLinked) {
                    setShowSwitchModal(true);
                    setLastCheckedWallet(currentWalletAddress);
                }
            } else if (!lastCheckedWallet) {
                setLastCheckedWallet(currentWalletAddress);
            }
        }
    }, [publicKey, connected, linkedWallets]);

    async function fetchLinkedWallets() {
        try {
            const response = await fetch('/api/wallets');
            if (response.ok) {
                const data = await response.json();
                setLinkedWallets(data.wallets || []);
            }
        } catch (error) {
            console.error('Failed to fetch wallets:', error);
        }
    }

    async function handleLinkWallet() {
        if (!publicKey || !signMessage) {
            setModal({
                type: 'alert',
                title: 'Wallet Not Connected',
                message: 'Please connect your wallet first to link it to your account.',
                icon: 'warning',
            });
            return;
        }

        setIsLinking(true);
        try {
            const walletAddress = publicKey.toBase58();

            // Step 1: Get verification message from backend
            const verifyResponse = await fetch('/api/wallets/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ walletAddress }),
            });

            const verifyData = await verifyResponse.json();

            if (!verifyResponse.ok) {
                setModal({
                    type: 'alert',
                    title: 'Verification Failed',
                    message: verifyData.error || 'Failed to create verification challenge',
                    icon: 'error',
                });
                return;
            }

            // Step 2: Sign the message with wallet
            const messageBytes = new TextEncoder().encode(verifyData.message);
            const signedMessage = await signMessage(messageBytes);
            const signatureBase58 = Buffer.from(signedMessage).toString('base64');

            // Step 3: Send signed message to backend
            const linkResponse = await fetch('/api/wallets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    walletAddress,
                    message: verifyData.message,
                    signature: signatureBase58,
                }),
            });

            const linkData = await linkResponse.json();

            if (linkResponse.ok) {
                // Refresh wallet list
                await fetchLinkedWallets();
                setModal({
                    type: 'alert',
                    title: 'Success!',
                    message: 'Wallet verified and linked successfully!',
                    icon: 'success',
                });
            } else {
                setModal({
                    type: 'alert',
                    title: 'Linking Failed',
                    message: linkData.error || 'Failed to link wallet',
                    icon: 'error',
                });
            }
        } catch (error) {
            console.error('Error linking wallet:', error);
            setModal({
                type: 'alert',
                title: 'Error',
                message: `Failed to link wallet: ${error instanceof Error ? error.message : 'Please try again'}`,
                icon: 'error',
            });
        } finally {
            setIsLinking(false);
        }
    }

    async function handleSetPrimary(walletId: string) {
        try {
            const response = await fetch(`/api/wallets/${walletId}/primary`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
            });

            if (!response.ok) {
                const data = await response.json();
                setModal({
                    type: 'alert',
                    title: 'Error',
                    message: data.error || 'Failed to set primary wallet',
                    icon: 'error',
                });
                return;
            }

            // Refresh wallets list
            await fetchLinkedWallets();

            setModal({
                type: 'alert',
                title: 'Success',
                message: 'Primary wallet updated. This wallet will now receive airdrops and rewards.',
                icon: 'success',
            });
        } catch (error) {
            setModal({
                type: 'alert',
                title: 'Error',
                message: error instanceof Error ? error.message : 'Failed to set primary wallet',
                icon: 'error',
            });
        }
    }

    async function handleRemoveWallet(walletAddress: string) {
        setModal({
            type: 'confirm',
            title: 'Remove Wallet',
            message: 'Are you sure you want to remove this wallet from your account? You can always re-link it later.',
            icon: 'warning',
            onConfirm: async () => {
                setModal(null);
                try {
                    const response = await fetch(`/api/wallets?walletAddress=${encodeURIComponent(walletAddress)}`, {
                        method: 'DELETE',
                    });

                    if (response.ok) {
                        await fetchLinkedWallets();
                        setModal({
                            type: 'alert',
                            title: 'Success',
                            message: 'Wallet removed successfully',
                            icon: 'success',
                        });
                    } else {
                        const data = await response.json();
                        setModal({
                            type: 'alert',
                            title: 'Error',
                            message: data.error || 'Failed to remove wallet',
                            icon: 'error',
                        });
                    }
                } catch (error) {
                    console.error('Error removing wallet:', error);
                    setModal({
                        type: 'alert',
                        title: 'Error',
                        message: 'Failed to remove wallet. Please try again.',
                        icon: 'error',
                    });
                }
            },
            onCancel: () => setModal(null),
        });
    }

    if (status === 'loading') {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#00ff41]"></div>
            </div>
        );
    }

    if (status === 'unauthenticated') {
        return (
            <div className="flex items-center justify-center min-h-screen px-6">
                <div className="text-center space-y-4">
                    <h1 className="text-3xl font-bold text-white">Sign in to manage your profile</h1>
                    <Link
                        href="/login"
                        className="inline-block px-6 py-3 rounded-lg bg-[#00ff41] text-[#0a0e27] font-semibold hover:bg-[#00dd33] transition"
                    >
                        Continue with Discord
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-6">
            {/* Header */}
            <div id="overview" className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500">Profile</p>
                    <h1 className="text-xl font-bold text-white mt-1">
                        Welcome,{' '}
                        <span className="text-[#00ff41]">
                            {session?.user?.username || session?.user?.name || 'User'}
                        </span>
                    </h1>
                    <p className="text-xs text-gray-400 mt-1">Connect socials and wallets.</p>
                </div>
            </div>

            {/* Social Accounts */}
            <section
                id="socials"
                className="rounded-xl border border-[rgba(0,212,255,0.1)] bg-[#0f1329] p-3 space-y-2 flex-shrink-0"
            >
                <div>
                    <h2 className="text-base font-semibold text-white">Social accounts</h2>
                    <p className="text-gray-400 text-xs mt-0.5">Verify your identity for giveaways.</p>
                </div>

                <div className="space-y-2">
                    {/* Discord */}
                    {discordUsername && (
                        <div className="flex items-center justify-between rounded-lg border border-[rgba(0,212,255,0.2)] bg-[rgba(0,212,255,0.05)] px-4 py-3">
                            <div className="flex items-center gap-3">
                                <svg className="w-6 h-6 text-[#5865F2]" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z" />
                                </svg>
                                <div>
                                    <p className="text-white font-medium text-sm">Discord</p>
                                    <p className="text-gray-400 text-xs">{discordUsername}</p>
                                </div>
                            </div>
                            <Link
                                href="/profile/settings"
                                className="px-3 py-1.5 rounded-lg text-xs border border-[#00d4ff] text-[#00d4ff] hover:bg-[rgba(0,212,255,0.1)] transition"
                            >
                                Relink
                            </Link>
                        </div>
                    )}
                    {/* Twitter/X - Coming Soon */}
                    <div className="flex items-center justify-between rounded-lg border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.02)] px-4 py-3 opacity-60">
                        <div className="flex items-center gap-3">
                            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                            </svg>
                            <div>
                                <p className="text-white font-medium text-sm">X / Twitter</p>
                                <p className="text-gray-500 text-xs">Coming soon</p>
                            </div>
                        </div>
                        <button
                            disabled
                            className="px-3 py-1.5 rounded-lg text-xs border border-gray-600 text-gray-500 cursor-not-allowed"
                        >
                            Connect
                        </button>
                    </div>
                    {/* Telegram - Coming Soon */}
                    <div className="flex items-center justify-between rounded-lg border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.02)] px-4 py-3 opacity-60">
                        <div className="flex items-center gap-3">
                            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                            </svg>
                            <div>
                                <p className="text-white font-medium text-sm">Telegram</p>
                                <p className="text-gray-500 text-xs">Coming soon</p>
                            </div>
                        </div>
                        <button
                            disabled
                            className="px-3 py-1.5 rounded-lg text-xs border border-gray-600 text-gray-500 cursor-not-allowed"
                        >
                            Connect
                        </button>
                    </div>
                </div>
            </section>

            {/* Wallets */}
            <section
                id="wallets"
                className="rounded-xl border border-[rgba(0,255,65,0.1)] bg-[#0f1329] p-3 space-y-2 flex-shrink-0"
            >
                <div className="flex items-center justify-between gap-2">
                    <div className="flex-1">
                        <h2 className="text-base font-semibold text-white">Solana Wallets</h2>
                        <p className="text-gray-400 text-xs">Connect and verify wallets.</p>
                    </div>
                    <div className="flex-shrink-0">
                        <button
                            onClick={() => setShowSwitchModal(true)}
                            className="px-3 py-1.5 rounded-lg text-xs bg-[#00ff41] text-[#0a0e27] font-semibold hover:bg-[#00dd33] transition shadow-[0_0_20px_rgba(0,255,65,0.3)]"
                        >
                            + Add
                        </button>
                    </div>
                </div>

                {/* Connected Wallet */}
                {connected &&
                    publicKey &&
                    (() => {
                        const currentWalletAddress = publicKey.toBase58();
                        const isAlreadyLinked = linkedWallets.some(w => w.walletAddress === currentWalletAddress);

                        return (
                            <div className="space-y-3">
                                <div className="rounded-lg border border-[rgba(0,255,65,0.2)] bg-[rgba(0,255,65,0.05)] px-4 py-3">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[11px] px-2 py-1 rounded-full bg-[rgba(0,255,65,0.15)] text-[#00ff41] font-semibold">
                                                CONNECTED
                                            </span>
                                            {isAlreadyLinked && (
                                                <span className="text-[11px] px-2 py-1 rounded-full bg-[rgba(0,212,255,0.15)] text-[#00d4ff] font-semibold">
                                                    ✓ VERIFIED
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {!isAlreadyLinked && (
                                                <button
                                                    onClick={handleLinkWallet}
                                                    disabled={isLinking}
                                                    className="px-3 py-1.5 rounded-lg text-xs bg-[#00ff41] text-[#0a0e27] font-semibold hover:bg-[#00dd33] transition disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {isLinking ? 'Linking...' : 'Link to Profile'}
                                                </button>
                                            )}
                                            <button
                                                onClick={() => setShowSwitchModal(true)}
                                                className="px-3 py-1.5 rounded-lg text-xs bg-[rgba(0,212,255,0.2)] border border-[#00d4ff] text-[#00d4ff] hover:bg-[rgba(0,212,255,0.3)] transition"
                                                title="Switch to a different account in your wallet app"
                                            >
                                                Switch Accounts
                                            </button>
                                            <button
                                                onClick={async () => {
                                                    await disconnect();
                                                }}
                                                className="px-3 py-1.5 rounded-lg text-xs bg-red-600/20 border border-red-600/40 text-red-400 hover:bg-red-600/30 hover:border-red-600/60 transition"
                                            >
                                                Disconnect
                                            </button>
                                        </div>
                                    </div>
                                    <p className="text-white font-mono text-sm break-all">{currentWalletAddress}</p>
                                    <p className="text-gray-500 text-xs mt-2">
                                        {isAlreadyLinked
                                            ? 'This wallet is verified and linked to your account'
                                            : 'Click "Link to Profile" to verify ownership and add this wallet to your account'}
                                    </p>
                                </div>
                            </div>
                        );
                    })()}

                {/* Not Connected State */}
                {!connected && (
                    <div className="rounded-lg border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] px-6 py-8 text-center">
                        <div className="max-w-md mx-auto space-y-4">
                            <div className="w-16 h-16 mx-auto rounded-full bg-[rgba(0,255,65,0.1)] flex items-center justify-center">
                                <svg
                                    className="w-8 h-8 text-[#00ff41]"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                                    />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-white">No Wallets Connected</h3>
                            <p className="text-gray-400 text-sm">
                                Connect your Solana wallet to verify ownership and link it to your profile. You can add
                                multiple wallets for flexibility.
                            </p>
                            <div className="flex justify-center pt-2">
                                <WalletMultiButton />
                            </div>
                        </div>
                    </div>
                )}

                {/* Linked Wallets List */}
                {linkedWallets.length > 0 && (
                    <div className="space-y-2">
                        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Linked Wallets</h3>
                        {linkedWallets.map(wallet => (
                            <WalletCard
                                key={wallet.id}
                                address={wallet.walletAddress}
                                primary={wallet.isPrimary}
                                onRemove={() => handleRemoveWallet(wallet.walletAddress)}
                                onSetPrimary={() => handleSetPrimary(wallet.id)}
                            />
                        ))}
                    </div>
                )}
            </section>

            {/* Switch Accounts Modal */}
            {showSwitchModal && (
                <SwitchAccountsModal
                    walletName={wallet?.adapter.name || 'Your wallet'}
                    onDone={() => {
                        setShowSwitchModal(false);
                        // Refresh wallet list to check if new account is already linked
                        fetchLinkedWallets();
                    }}
                    onClose={() => setShowSwitchModal(false)}
                />
            )}

            {/* Alert/Confirm Modal */}
            {modal && (
                <AlertModal
                    type={modal.type}
                    title={modal.title}
                    message={modal.message}
                    icon={modal.icon}
                    onConfirm={() => {
                        modal.onConfirm?.();
                        setModal(null);
                    }}
                    onCancel={() => {
                        modal.onCancel?.();
                        setModal(null);
                    }}
                />
            )}
        </div>
    );
}

function WalletCard({
    address,
    primary,
    onRemove,
    onSetPrimary,
}: {
    address: string;
    primary?: boolean;
    onRemove?: () => void;
    onSetPrimary?: () => void;
}) {
    // Truncate address for display: 8H7x...9Kf2
    const truncatedAddress = `${address.slice(0, 4)}...${address.slice(-4)}`;

    return (
        <div className="rounded-lg border border-[rgba(0,255,65,0.1)] bg-[rgba(0,255,65,0.02)] px-4 py-3">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-[#00ff41]">SOLANA</span>
                    {primary && (
                        <span className="text-[11px] px-2 py-1 rounded-full bg-[rgba(0,255,65,0.12)] text-[#00ff41]">
                            ⭐ PRIMARY
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {!primary && onSetPrimary && (
                        <button
                            onClick={onSetPrimary}
                            className="text-[#00d4ff] hover:text-[#00e6ff] transition text-xs font-semibold"
                            title="Set as primary wallet for airdrops and rewards"
                        >
                            Set Primary
                        </button>
                    )}
                    {onRemove && (
                        <button
                            onClick={onRemove}
                            className="text-red-400 hover:text-red-300 transition text-xs"
                            title="Remove wallet"
                        >
                            Remove
                        </button>
                    )}
                </div>
            </div>
            <p className="text-white font-mono text-sm" title={address}>
                {truncatedAddress}
            </p>
            <p className="text-gray-500 text-xs mt-1">Verified</p>
        </div>
    );
}

interface SwitchAccountsModalProps {
    walletName: string;
    onDone: () => void;
    onClose: () => void;
}

function SwitchAccountsModal({ walletName, onDone, onClose }: SwitchAccountsModalProps) {
    return (
        <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            {/* Modal */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="max-w-md w-full rounded-xl border border-[rgba(0,212,255,0.2)] bg-[#0f1329] p-8 space-y-6">
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-2">Link Multiple Accounts</h2>
                        <p className="text-gray-400">
                            To link wallets from different accounts in your wallet app, follow these steps:
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div className="flex gap-4">
                            <div className="flex-shrink-0">
                                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-[#00d4ff]/20 text-[#00d4ff] font-bold text-sm">
                                    1
                                </div>
                            </div>
                            <div>
                                <p className="text-white font-semibold">Open {walletName} App</p>
                                <p className="text-gray-400 text-sm">Switch to your wallet application</p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="flex-shrink-0">
                                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-[#00d4ff]/20 text-[#00d4ff] font-bold text-sm">
                                    2
                                </div>
                            </div>
                            <div>
                                <p className="text-white font-semibold">Switch Account</p>
                                <p className="text-gray-400 text-sm">Select a different account from the dropdown</p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="flex-shrink-0">
                                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-[#00d4ff]/20 text-[#00d4ff] font-bold text-sm">
                                    3
                                </div>
                            </div>
                            <div>
                                <p className="text-white font-semibold">Return Here</p>
                                <p className="text-gray-400 text-sm">
                                    Come back to this page and click "Done" or we'll detect your new account
                                    automatically
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-[rgba(0,255,65,0.05)] border border-[rgba(0,255,65,0.1)] rounded-lg p-4">
                        <p className="text-[#00ff41] text-sm">
                            <span className="font-semibold">💡 Tip:</span> Once you switch accounts, we'll automatically
                            detect your new wallet address and ask if you want to link it.
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-2 rounded-lg border border-[rgba(255,255,255,0.1)] text-white hover:bg-[rgba(255,255,255,0.05)] transition"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onDone}
                            className="flex-1 px-4 py-2 rounded-lg bg-[#00d4ff] text-[#0a0e27] font-semibold hover:bg-[rgba(0,212,255,0.9)] transition"
                        >
                            Done Switching
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}

interface AlertModalProps {
    type: 'alert' | 'confirm';
    title: string;
    message: string;
    icon?: 'success' | 'error' | 'warning' | 'info';
    onConfirm: () => void;
    onCancel: () => void;
}

function AlertModal({ type, title, message, icon, onConfirm, onCancel }: AlertModalProps) {
    const getIconColor = () => {
        switch (icon) {
            case 'success':
                return 'text-[#00ff41] bg-[rgba(0,255,65,0.1)]';
            case 'error':
                return 'text-red-400 bg-[rgba(239,68,68,0.1)]';
            case 'warning':
                return 'text-yellow-400 bg-[rgba(250,204,21,0.1)]';
            case 'info':
            default:
                return 'text-[#00d4ff] bg-[rgba(0,212,255,0.1)]';
        }
    };

    const getIcon = () => {
        switch (icon) {
            case 'success':
                return (
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                );
            case 'error':
                return (
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                );
            case 'warning':
                return (
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                    </svg>
                );
            case 'info':
            default:
                return (
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                    </svg>
                );
        }
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
                onClick={type === 'alert' ? onConfirm : onCancel}
            />
            {/* Modal */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="max-w-md w-full rounded-xl border border-[rgba(0,212,255,0.2)] bg-[#0f1329] p-8 space-y-6">
                    {/* Icon */}
                    {icon && (
                        <div className={`flex items-center justify-center w-12 h-12 rounded-full ${getIconColor()}`}>
                            {getIcon()}
                        </div>
                    )}

                    {/* Content */}
                    <div>
                        <h2 className="text-xl font-bold text-white mb-2">{title}</h2>
                        <p className="text-gray-300 leading-relaxed">{message}</p>
                    </div>

                    {/* Actions */}
                    <div className={`flex gap-3 ${type === 'alert' ? 'justify-end' : ''}`}>
                        {type === 'confirm' && (
                            <button
                                onClick={onCancel}
                                className="flex-1 px-4 py-2 rounded-lg border border-[rgba(255,255,255,0.1)] text-white hover:bg-[rgba(255,255,255,0.05)] transition"
                            >
                                Cancel
                            </button>
                        )}
                        <button
                            onClick={onConfirm}
                            className={`flex-1 px-4 py-2 rounded-lg font-semibold transition ${
                                icon === 'error'
                                    ? 'bg-red-600/20 border border-red-600/40 text-red-400 hover:bg-red-600/30'
                                    : icon === 'warning'
                                      ? 'bg-yellow-600/20 border border-yellow-600/40 text-yellow-400 hover:bg-yellow-600/30'
                                      : 'bg-[#00d4ff] text-[#0a0e27] hover:bg-[rgba(0,212,255,0.9)]'
                            }`}
                        >
                            {type === 'alert' ? 'OK' : 'Confirm'}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
