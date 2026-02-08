'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useWalletState } from '@/lib/wallet';
import { useSession } from 'next-auth/react';

// Helper function to convert requirement types to friendly display names
function getRequirementDisplayName(requirement: any): string {
    const { type, config } = requirement;

    switch (type) {
        case 'SOLANA_WALLET_CONNECTED':
            return 'Linked Solana Wallet';
        case 'DISCORD_ROLE_REQUIRED':
            return config?.roleName ? `Discord Role: ${config.roleName}` : 'Discord Role';
        case 'DISCORD_MEMBER_REQUIRED':
            return 'Discord Server Member';
        case 'DISCORD_ACCOUNT_AGE_DAYS':
            return `Discord Account (${config?.days || 0}+ days old)`;
        case 'DISCORD_SERVER_JOIN_AGE_DAYS':
            return `Server Member (${config?.days || 0}+ days)`;
        case 'SOLANA_TOKEN_HOLDING':
            return `Hold ${config?.amount || 0} ${config?.symbol || 'tokens'}`;
        case 'SOLANA_NFT_OWNERSHIP':
            return `Own NFT from ${config?.collectionName || 'collection'}`;
        default:
            return type.replace(/_/g, ' ');
    }
}

interface Event {
    id: string;
    title: string;
    description: string | null;
    prize: string | null;
    imageUrl: string | null;
    endAt: string;
    type: string;
    status: string;
    maxWinners: number;
    selectionMode: string;
    requirements: Array<{
        id: string;
        type: string;
        config: Record<string, any>;
    }>;
    community: {
        id: string;
        name: string;
        slug: string;
        icon: string | null;
        guildId: string | null;
    };
    _count: {
        entries: number;
    };
}

export default function EventDetailPage() {
    const params = useParams();
    const slug = params.slug as string;
    const eventId = params.eventId as string;

    const { publicKey, connected } = useWalletState();
    const { data: session } = useSession();
    const [event, setEvent] = useState<Event | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [requirementsMet, setRequirementsMet] = useState<Record<string, boolean>>({});
    const [isDiscordLinked, setIsDiscordLinked] = useState(false);

    // Fetch event data
    useEffect(() => {
        async function fetchEvent() {
            try {
                setLoading(true);
                setError(null);

                const res = await fetch(`/api/events/${eventId}/public`);
                if (!res.ok) throw new Error('Event not found');
                const data = await res.json();
                setEvent(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load event');
            } finally {
                setLoading(false);
            }
        }

        fetchEvent();
    }, [eventId]);

    // Auto-populate Discord link from session if user logged in via Discord
    useEffect(() => {
        if (session && session.discordId) {
            setIsDiscordLinked(true);
        }
    }, [session]);

    // Verify requirements when event or wallet state changes
    useEffect(() => {
        if (!event?.requirements) return;

        const verifyRequirements = async () => {
            const met: Record<string, boolean> = {};

            // Check if we need to verify Discord roles
            const needsDiscordRoles = event.requirements.some(r => r.type === 'DISCORD_ROLE_REQUIRED');
            let userRoles: string[] = [];
            let roleNames: Record<string, string> = {};

            console.log('[EventRequirements] Checking requirements:', {
                hasEvent: !!event,
                requirementCount: event.requirements.length,
                needsDiscordRoles,
                isDiscordLinked,
                guildId: event.community.guildId,
            });

            if (needsDiscordRoles && isDiscordLinked && event.community.guildId) {
                try {
                    console.log('[EventRequirements] Fetching Discord roles for guildId:', event.community.guildId);
                    const response = await fetch(`/api/discord/my-roles?guildId=${event.community.guildId}`);
                    console.log('[EventRequirements] Discord API response status:', response.status);

                    if (response.ok) {
                        const data = await response.json();
                        userRoles = data.roleIds || [];
                        roleNames = data.roleNames || {};
                        console.log('[EventRequirements] ✅ Successfully fetched Discord roles:', {
                            discordUserId: data.discordUserId,
                            roleIds: userRoles,
                            roleNamesCount: Object.keys(roleNames).length,
                            guildId: event.community.guildId,
                        });
                    }
                } catch (err) {
                    console.error('[EventRequirements] Error fetching Discord roles:', err);
                }
            }

            for (const req of event.requirements) {
                if (req.type === 'SOLANA_WALLET_CONNECTED') {
                    met[req.id] = connected && !!publicKey;
                    console.log('[EventRequirements] Wallet requirement:', {
                        isMet: met[req.id],
                        connected,
                        hasPublicKey: !!publicKey,
                    });
                } else if (req.type === 'DISCORD_ROLE_REQUIRED') {
                    const requiredRoleIds = Array.isArray(req.config.roleIds)
                        ? req.config.roleIds
                        : [req.config.roleId];
                    const hasRequiredRole = requiredRoleIds.some(roleId => userRoles.includes(roleId));
                    met[req.id] = isDiscordLinked && hasRequiredRole;

                    console.log('[EventRequirements] Discord Role Check:', {
                        requiredRoleIds,
                        userRoles,
                        isDiscordLinked,
                        hasRequiredRole,
                        isMet: met[req.id],
                    });
                } else {
                    // Other requirements verified on submission
                    met[req.id] = false;
                }
            }

            setRequirementsMet(met);
        };

        verifyRequirements();
    }, [event?.requirements, connected, publicKey, isDiscordLinked, event?.community.guildId]);

    const handleSubmitEntry = async () => {
        if (!publicKey) {
            setError('Please connect your wallet');
            return;
        }

        try {
            setSubmitting(true);
            setError(null);

            const res = await fetch('/api/entries', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    eventId,
                    walletAddress: publicKey.toBase58(),
                    discordUserId: null,
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to submit entry');
            }

            setSuccess(true);
            setTimeout(() => setSuccess(false), 5000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to submit entry');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen px-4 sm:px-6 lg:px-8 py-12 flex items-center justify-center">
                <div className="animate-pulse text-center">
                    <div className="h-8 w-48 bg-gray-700 rounded mx-auto mb-4"></div>
                    <p className="text-gray-400">Loading event details...</p>
                </div>
            </div>
        );
    }

    if (!event) {
        return (
            <div className="min-h-screen px-4 sm:px-6 lg:px-8 py-12">
                <div className="max-w-2xl mx-auto text-center">
                    <h1 className="text-3xl font-bold text-red-500 mb-4">Event Not Found</h1>
                    <p className="text-gray-400 mb-6">
                        The event you're looking for doesn't exist or has been removed.
                    </p>
                    <Link href="/" className="text-[#00ff41] hover:text-[#00dd33] underline">
                        Return to homepage
                    </Link>
                </div>
            </div>
        );
    }

    const deadline = new Date(event.endAt);
    const now = new Date();
    const isActive = event.status === 'ACTIVE' && now < deadline;
    const isExpired = now > deadline;

    const getEventTypeColor = (type: string) => {
        switch (type) {
            case 'WHITELIST':
                return 'from-[#00ff41] to-[#00dd33]';
            case 'PRESALE':
                return 'from-[#00d4ff] to-[#0099cc]';
            case 'GIVEAWAY':
                return 'from-purple-500 to-pink-500';
            default:
                return 'from-[#00ff41] to-[#00d4ff]';
        }
    };

    return (
        <div className="min-h-screen px-4 sm:px-6 lg:px-8 py-12">
            <div className="max-w-3xl mx-auto">
                {/* Community Header */}
                <div className="mb-8">
                    <Link
                        href={`/communities/${slug}`}
                        className="inline-flex items-center gap-3 hover:opacity-80 transition-opacity"
                    >
                        {event.community.icon && (
                            <Image
                                src={event.community.icon}
                                alt={event.community.name}
                                width={40}
                                height={40}
                                className="rounded-full"
                            />
                        )}
                        <div>
                            <p className="text-xs text-gray-400 uppercase tracking-wide">Community</p>
                            <p className="text-lg font-semibold text-white">{event.community.name}</p>
                        </div>
                    </Link>
                </div>

                {/* Event Card */}
                <div className="bg-[#111528] border border-[rgba(0,255,65,0.1)] rounded-lg overflow-hidden">
                    {/* Event Image */}
                    {event.imageUrl && (
                        <div className="relative h-64 w-full">
                            <Image src={event.imageUrl} alt={event.title} fill className="object-cover" />
                        </div>
                    )}

                    {/* Event Header */}
                    <div className={`bg-gradient-to-r ${getEventTypeColor(event.type)} p-1`}>
                        <div className="bg-[#111528] p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <div className="inline-block px-3 py-1 bg-[rgba(0,255,65,0.2)] text-[#00ff41] rounded text-xs font-semibold uppercase mb-3">
                                        {event.type}
                                    </div>
                                    <h1 className="text-3xl font-bold text-white">{event.title}</h1>
                                </div>
                                <div className="text-right">
                                    <div
                                        className={`text-sm font-semibold px-3 py-1 rounded ${
                                            isActive
                                                ? 'bg-[rgba(0,255,65,0.2)] text-[#00ff41]'
                                                : isExpired
                                                  ? 'bg-[rgba(255,0,0,0.2)] text-red-400'
                                                  : 'bg-[rgba(100,100,100,0.2)] text-gray-400'
                                        }`}
                                    >
                                        {isActive ? '🟢 ACTIVE' : isExpired ? '🔴 ENDED' : '⚪ UPCOMING'}
                                    </div>
                                </div>
                            </div>

                            {event.description && (
                                <p className="text-gray-300 text-base leading-relaxed mb-6">{event.description}</p>
                            )}

                            {/* Stats Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                <div className="bg-[rgba(0,255,65,0.05)] border border-[rgba(0,255,65,0.2)] p-4 rounded">
                                    <p className="text-gray-400 text-xs uppercase tracking-wide">Participants</p>
                                    <p className="text-2xl font-bold text-[#00ff41] mt-1">{event._count.entries}</p>
                                </div>
                                <div className="bg-[rgba(0,212,255,0.05)] border border-[rgba(0,212,255,0.2)] p-4 rounded">
                                    <p className="text-gray-400 text-xs uppercase tracking-wide">Winners</p>
                                    <p className="text-2xl font-bold text-[#00d4ff] mt-1">{event.maxWinners}</p>
                                </div>
                                <div className="bg-[rgba(0,255,65,0.05)] border border-[rgba(0,255,65,0.2)] p-4 rounded">
                                    <p className="text-gray-400 text-xs uppercase tracking-wide">Selection</p>
                                    <p className="text-2xl font-bold text-[#00ff41] mt-1">
                                        {event.selectionMode === 'RANDOM'
                                            ? '🎲'
                                            : event.selectionMode === 'FCFS'
                                              ? '⚡'
                                              : '✋'}
                                    </p>
                                </div>
                                <div className="bg-[rgba(0,212,255,0.05)] border border-[rgba(0,212,255,0.2)] p-4 rounded">
                                    <p className="text-gray-400 text-xs uppercase tracking-wide">Deadline</p>
                                    <p className="text-xs font-mono text-[#00d4ff] mt-2">
                                        {deadline.toLocaleDateString()}{' '}
                                        {deadline.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Content Sections */}
                    <div className="p-6 space-y-8">
                        {/* Prize Section */}
                        {event.prize && (
                            <div>
                                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                    <span>🏆</span> Prize Pool
                                </h2>
                                <div className="bg-[rgba(0,255,65,0.1)] border-l-4 border-[#00ff41] p-4 rounded">
                                    <p className="text-gray-300">{event.prize}</p>
                                </div>
                            </div>
                        )}

                        {/* Requirements Section */}
                        {event.requirements.length > 0 && (
                            <div>
                                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                    <span>🔐</span> Requirements
                                </h2>
                                <div className="space-y-3">
                                    {event.requirements.map(req => {
                                        const isMet = requirementsMet[req.id] ?? false;
                                        return (
                                            <div
                                                key={req.id}
                                                className={`flex items-center justify-between p-4 rounded border-l-4 transition ${
                                                    isMet
                                                        ? 'bg-[rgba(0,255,65,0.1)] border-[#00ff41]'
                                                        : 'bg-[rgba(0,212,255,0.1)] border-[#00d4ff]'
                                                }`}
                                            >
                                                <p
                                                    className={`font-semibold ${isMet ? 'text-[#00ff41]' : 'text-[#00d4ff]'}`}
                                                >
                                                    {getRequirementDisplayName(req)}
                                                </p>
                                                {isMet ? (
                                                    <svg
                                                        className="w-5 h-5 text-[#00ff41]"
                                                        fill="currentColor"
                                                        viewBox="0 0 20 20"
                                                    >
                                                        <path
                                                            fillRule="evenodd"
                                                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                            clipRule="evenodd"
                                                        />
                                                    </svg>
                                                ) : (
                                                    <svg
                                                        className="w-5 h-5 text-red-400"
                                                        fill="currentColor"
                                                        viewBox="0 0 20 20"
                                                    >
                                                        <path
                                                            fillRule="evenodd"
                                                            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                                            clipRule="evenodd"
                                                        />
                                                    </svg>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* How to Enter Section */}
                        <div>
                            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                <span>📝</span> How to Enter
                            </h2>
                            <div className="bg-[rgba(0,255,65,0.05)] border border-[rgba(0,255,65,0.2)] p-4 rounded space-y-3">
                                <div className="flex gap-3">
                                    <span className="text-[#00ff41] font-bold">1.</span>
                                    <p className="text-gray-300">Connect your Solana wallet using the button below</p>
                                </div>
                                <div className="flex gap-3">
                                    <span className="text-[#00ff41] font-bold">2.</span>
                                    <p className="text-gray-300">Verify you meet all requirements</p>
                                </div>
                                <div className="flex gap-3">
                                    <span className="text-[#00ff41] font-bold">3.</span>
                                    <p className="text-gray-300">Click "Join Event" to submit your entry</p>
                                </div>
                                <div className="flex gap-3">
                                    <span className="text-[#00ff41] font-bold">4.</span>
                                    <p className="text-gray-300">
                                        If selected, you'll be notified via Discord or email
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Entry Form Section */}
                        <div>
                            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                <span>🚀</span> Join Event
                            </h2>
                            <div className="bg-[#0a0e27] border border-[rgba(0,212,255,0.3)] p-6 rounded-lg space-y-4">
                                {error && (
                                    <div className="bg-red-500/20 border border-red-500/50 text-red-200 p-3 rounded">
                                        {error}
                                    </div>
                                )}

                                {success && (
                                    <div className="bg-[#00ff41]/20 border border-[#00ff41]/50 text-[#00ff41] p-3 rounded">
                                        ✓ Entry submitted successfully! Check your wallet for confirmation.
                                    </div>
                                )}

                                {!isActive && (
                                    <div className="bg-gray-700/20 border border-gray-600 text-gray-300 p-3 rounded">
                                        {isExpired ? '❌ This event has ended' : '⏳ This event has not started yet'}
                                    </div>
                                )}

                                <div className="space-y-3">
                                    {!connected ? (
                                        <>
                                            <p className="text-gray-300 text-sm">
                                                Connect your Solana wallet to enter:
                                            </p>
                                            <WalletMultiButton className="w-full" />
                                        </>
                                    ) : (
                                        <>
                                            <div className="bg-[rgba(0,255,65,0.1)] p-3 rounded">
                                                <p className="text-xs text-gray-400 mb-1">Connected Wallet</p>
                                                <p className="text-[#00ff41] font-mono text-sm">
                                                    {publicKey?.toBase58().slice(0, 8)}...
                                                    {publicKey?.toBase58().slice(-8)}
                                                </p>
                                            </div>
                                            <button
                                                onClick={handleSubmitEntry}
                                                disabled={!isActive || submitting}
                                                className="w-full bg-[#00ff41] hover:bg-[#00dd33] disabled:opacity-50 disabled:cursor-not-allowed text-[#0a0e27] font-bold py-3 rounded transition-colors"
                                            >
                                                {submitting ? '⏳ Submitting...' : `🎯 Join Event`}
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-12 text-center text-gray-500 text-sm">
                    <p>✨ Powered by DropLabz — Solana Community Operations Platform</p>
                </div>
            </div>
        </div>
    );
}
