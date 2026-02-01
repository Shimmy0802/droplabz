'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWalletState } from '@/lib/wallet';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

interface WhitelistEntryPageProps {
    eventId: string;
}

interface EventDetails {
    id: string;
    title: string;
    description?: string;
    type: string;
    status: string;
    maxWinners: number;
    community: {
        id: string;
        name: string;
        icon?: string;
    };
    requirements: Array<{
        id: string;
        type: string;
        config: any;
    }>;
    _count?: {
        entries: number;
    };
}

export function WhitelistEntryPage({ eventId }: WhitelistEntryPageProps) {
    const router = useRouter();
    const { publicKey, connected } = useWalletState();
    const [eventDetails, setEventDetails] = useState<EventDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [discordId, setDiscordId] = useState('');

    // Fetch event details
    useEffect(() => {
        const fetchEventDetails = async () => {
            try {
                const response = await fetch(`/api/events/${eventId}`);
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.error || errorData.message || 'Failed to load whitelist');
                }
                const data = await response.json();
                // API returns { event, total, limit, offset }
                setEventDetails(data.event || data);
            } catch (err) {
                console.error('Error loading whitelist:', err);
                setError(err instanceof Error ? err.message : 'Failed to load whitelist');
            } finally {
                setLoading(false);
            }
        };

        fetchEventDetails();
    }, [eventId]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        try {
            if (!publicKey) {
                throw new Error('Wallet not connected');
            }

            const response = await fetch('/api/entries', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    eventId,
                    walletAddress: publicKey.toBase58(),
                    discordUserId: discordId || undefined,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to submit entry');
            }

            setSuccess(true);
            setTimeout(() => {
                router.push(`/communities/${eventDetails?.community.id}`);
            }, 2000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return <div className="text-center py-12 text-white">Loading whitelist details...</div>;
    }

    if (!eventDetails) {
        return (
            <div className="text-center py-12">
                <p className="text-red-400">Whitelist not found</p>
            </div>
        );
    }

    if (eventDetails.status !== 'ACTIVE') {
        return (
            <div className="text-center py-12">
                <p className="text-yellow-400">This whitelist is no longer accepting entries</p>
            </div>
        );
    }

    const spotsRemaining = eventDetails.maxWinners - (eventDetails._count?.entries || 0);

    return (
        <div className="min-h-screen text-white p-6">
            <div className="max-w-2xl mx-auto">
                {/* Community Header */}
                <div className="mb-8">
                    {eventDetails.community.icon && (
                        <img
                            src={eventDetails.community.icon}
                            alt={eventDetails.community.name}
                            className="w-16 h-16 rounded-lg mb-4"
                        />
                    )}
                    <h2 className="text-2xl font-bold text-[#00ff41]">{eventDetails.community.name}</h2>
                </div>

                {/* Whitelist Details */}
                <div className="bg-[#111528] border border-[#00d4ff]/20 rounded-lg p-6 mb-8">
                    <h1 className="text-3xl font-bold mb-2">{eventDetails.title}</h1>
                    {eventDetails.description && <p className="text-gray-300 mb-6">{eventDetails.description}</p>}

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm text-gray-400">Spots Available</p>
                            <p className="text-2xl font-bold text-[#00ff41]">
                                {spotsRemaining} / {eventDetails.maxWinners}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-400">Status</p>
                            <p className="text-xl font-semibold text-[#00d4ff]">{eventDetails.status}</p>
                        </div>
                    </div>
                </div>

                {/* Requirements */}
                {eventDetails.requirements.length > 0 && (
                    <div className="bg-[#111528] border border-[#00d4ff]/20 rounded-lg p-6 mb-8">
                        <h3 className="text-lg font-semibold text-[#00d4ff] mb-4">Requirements</h3>
                        <ul className="space-y-2">
                            {eventDetails.requirements.map(req => (
                                <li key={req.id} className="flex items-start gap-2">
                                    <span className="text-[#00ff41] mt-1">✓</span>
                                    <span className="text-gray-300">{formatRequirement(req.type, req.config)}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Entry Form */}
                <form onSubmit={handleSubmit} className="bg-[#111528] border border-[#00d4ff]/20 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-white mb-6">Join Whitelist</h3>

                    {/* Wallet Connection */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-white mb-3">Solana Wallet</label>
                        <div className="mb-3">
                            <WalletMultiButton />
                        </div>
                        {connected && publicKey && (
                            <p className="text-sm text-[#00d4ff]">
                                Connected: {publicKey.toBase58().substring(0, 20)}...
                            </p>
                        )}
                    </div>

                    {/* Discord ID (Optional) */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-white mb-1">Discord User ID (Optional)</label>
                        <input
                            type="text"
                            value={discordId}
                            onChange={e => setDiscordId(e.target.value)}
                            placeholder="Your Discord User ID"
                            className="w-full px-4 py-2 bg-[#0a0e27] border border-[#00d4ff] text-white rounded-lg focus:outline-none focus:border-[#00ff41]"
                        />
                        <p className="text-xs text-gray-400 mt-1">
                            Your Discord will be verified against the whitelist requirements
                        </p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-6 p-4 bg-red-900/20 border border-red-500 rounded-lg text-red-200">
                            {error}
                        </div>
                    )}

                    {/* Success Message */}
                    {success && (
                        <div className="mb-6 p-4 bg-green-900/20 border border-green-500 rounded-lg text-green-200">
                            ✓ Entry submitted! Redirecting to community page...
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={!connected || submitting}
                        className="w-full px-6 py-3 bg-[#00ff41] text-[#0a0e27] font-semibold rounded-lg hover:bg-[#00dd33] disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                        {submitting ? 'Submitting...' : 'Join Whitelist'}
                    </button>

                    <p className="text-xs text-gray-400 mt-4 text-center">
                        We will verify your Solana wallet and Discord account. You'll be notified once verification is
                        complete.
                    </p>
                </form>
            </div>
        </div>
    );
}

function formatRequirement(type: string, config: any): string {
    switch (type) {
        case 'SOLANA_WALLET_CONNECTED':
            return 'Connected Solana wallet required';
        case 'DISCORD_MEMBER_REQUIRED':
            return 'Discord account required';
        case 'DISCORD_ROLE_REQUIRED':
            return `Discord role required: ${config.roleId}`;
        case 'DISCORD_ACCOUNT_AGE_DAYS':
            return `Discord account must be at least ${config.days} days old`;
        case 'SOLANA_TOKEN_HOLDING':
            return `Must hold ${config.amount} tokens (${config.mint})`;
        case 'SOLANA_NFT_OWNERSHIP':
            return `Must own NFT from collection: ${config.collection}`;
        default:
            return `${type}: ${JSON.stringify(config)}`;
    }
}
