'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useWalletState } from '@/lib/wallet';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

interface GiveawayEntryPageProps {
    eventId: string;
}

interface Requirement {
    id: string;
    type: string;
    config: any;
}

interface EventDetails {
    id: string;
    title: string;
    description?: string;
    prize?: string;
    imageUrl?: string;
    type: string;
    status: string;
    maxWinners: number;
    reservedSpots: number;
    selectionMode: string;
    endAt: string;
    community: {
        id: string;
        name: string;
        slug: string;
        icon?: string;
        guildId?: string;
    };
    requirements: Requirement[];
    _count?: {
        entries: number;
        winners: number;
    };
    entries?: Array<{
        walletAddress: string;
        status: string;
    }>;
    winners?: Array<{
        id: string;
    }>;
}

interface RequirementStatus {
    id: string;
    type: string;
    config: any;
    isMet: boolean;
    message: string;
    checking: boolean;
}

interface TimeLeft {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
}

export function GiveawayEntryPage({ eventId }: GiveawayEntryPageProps) {
    const router = useRouter();
    const { publicKey, connected } = useWalletState();
    const { data: session } = useSession();
    const [eventDetails, setEventDetails] = useState<EventDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [discordUserId, setDiscordUserId] = useState('');
    const [isDiscordLinked, setIsDiscordLinked] = useState(false);
    const [discordVerifying, setDiscordVerifying] = useState(false);
    const [discordVerificationError, setDiscordVerificationError] = useState<string | null>(null);
    const [requirementStatuses, setRequirementStatuses] = useState<RequirementStatus[]>([]);
    const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);
    const [existingEntry, setExistingEntry] = useState<any>(null);

    // Auto-populate Discord ID from session if user logged in via Discord
    useEffect(() => {
        if (session && session.discordId) {
            setDiscordUserId(session.discordId);
            setIsDiscordLinked(true);

            // Pre-verify Discord guild membership
            if (eventDetails?.community.guildId) {
                verifyDiscordGuildMembership(session.discordId, eventDetails.community.guildId);
            }
        }
    }, [session, eventDetails?.community.guildId]);

    // Function to verify Discord guild membership
    const verifyDiscordGuildMembership = async (userId: string, guildId?: string) => {
        if (!userId || !guildId) return;

        setDiscordVerifying(true);
        setDiscordVerificationError(null);

        try {
            const response = await fetch('/api/discord/verify-guild', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ discordUserId: userId, guildId }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                setDiscordVerificationError(errorData.error || 'Unable to verify Discord guild membership');
            }
        } catch (err) {
            console.error('Discord guild verification error:', err);
            setDiscordVerificationError('Network error verifying Discord');
        } finally {
            setDiscordVerifying(false);
        }
    };

    // Fetch event details
    useEffect(() => {
        const fetchEventDetails = async () => {
            try {
                const response = await fetch(`/api/events/${eventId}`);
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.error || errorData.message || 'Failed to load giveaway');
                }
                const data = await response.json();
                setEventDetails(data.event || data);

                // Check if user already entered (if wallet connected)
                if (publicKey && data.event?.entries) {
                    const userEntry = data.event.entries.find((e: any) => e.walletAddress === publicKey.toBase58());
                    if (userEntry) {
                        setExistingEntry(userEntry);
                    }
                }
            } catch (err) {
                console.error('Error loading giveaway:', err);
                setError(err instanceof Error ? err.message : 'Failed to load giveaway');
            } finally {
                setLoading(false);
            }
        };

        fetchEventDetails();
    }, [eventId, publicKey]);

    // Countdown timer
    useEffect(() => {
        if (!eventDetails?.endAt) return;

        const updateCountdown = () => {
            const now = new Date().getTime();
            const end = new Date(eventDetails.endAt).getTime();
            const distance = end - now;

            if (distance < 0) {
                setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
                return;
            }

            setTimeLeft({
                days: Math.floor(distance / (1000 * 60 * 60 * 24)),
                hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
                seconds: Math.floor((distance % (1000 * 60)) / 1000),
            });
        };

        updateCountdown();
        const interval = setInterval(updateCountdown, 1000);

        return () => clearInterval(interval);
    }, [eventDetails]);

    // Verify requirements in real-time
    useEffect(() => {
        if (!eventDetails) return;

        const verifyRequirements = async () => {
            const statuses: RequirementStatus[] = [];

            // Check if we need to verify Discord roles
            const needsDiscordRoles = eventDetails.requirements.some(r => r.type === 'DISCORD_ROLE_REQUIRED');
            let userRoles: string[] = [];
            let roleNames: Record<string, string> = {};

            console.log('[GiveawayEntry] Requirements Check Starting:', {
                hasEventDetails: !!eventDetails,
                requirementCount: eventDetails.requirements.length,
                needsDiscordRoles,
                isDiscordLinked,
                guildId: eventDetails.community.guildId,
                discordUserId,
                sessionDiscordId: session?.discordId,
            });

            if (needsDiscordRoles && isDiscordLinked && eventDetails.community.guildId) {
                try {
                    const guildId = eventDetails.community.guildId;
                    const fetchUrl = `/api/discord/my-roles?guildId=${guildId}`;

                    console.log('[GiveawayRequirements] About to fetch Discord roles:', {
                        guildId,
                        fetchUrl,
                        isDiscordLinked,
                        needsDiscordRoles,
                        communityHasGuildId: !!eventDetails.community.guildId,
                    });

                    const response = await fetch(fetchUrl);
                    const data = await response.json();

                    console.log('[GiveawayRequirements] /api/discord/my-roles response:', {
                        status: response.status,
                        statusText: response.statusText,
                        success: data.success,
                        error: data.error,
                        apiError: data.apiError,
                        roleIds: data.roleIds,
                        hasRoles: data.roleIds && data.roleIds.length > 0,
                        isMember: data.isMember,
                        discordUserId: data.discordUserId,
                        fullResponse: data,
                    });

                    // Handle both success and error responses consistently
                    if (response.ok && data.success && data.roleIds && data.roleIds.length > 0) {
                        userRoles = data.roleIds;
                        roleNames = data.roleNames || {};
                        console.log('[GiveawayRequirements] ✅ Successfully fetched Discord roles:', {
                            discordUserId: data.discordUserId,
                            roleIds: userRoles,
                            roleNamesCount: Object.keys(roleNames).length,
                            guildId,
                        });
                    } else {
                        console.warn('⚠️ [GiveawayRequirements] Discord roles fetch failed or empty:', {
                            status: response.status,
                            statusText: response.statusText,
                            success: data.success,
                            error: data.error,
                            apiError: data.apiError,
                            roleIds: data.roleIds,
                            isMember: data.isMember,
                            reason: !response.ok
                                ? `HTTP ${response.status}`
                                : !data.success
                                  ? `success=false`
                                  : !data.roleIds
                                    ? 'no roleIds'
                                    : data.roleIds.length === 0
                                      ? 'empty roleIds array'
                                      : 'unknown',
                        });
                        userRoles = [];
                        roleNames = {};
                    }
                } catch (err) {
                    console.error('[GiveawayRequirements] Error fetching Discord roles:', err);
                    userRoles = [];
                    roleNames = {};
                }
            } else {
                console.warn('[GiveawayRequirements] Skipping Discord role fetch because:', {
                    needsDiscordRoles,
                    isDiscordLinked,
                    hasGuildId: !!eventDetails.community.guildId,
                    reason: !needsDiscordRoles
                        ? 'No DISCORD_ROLE_REQUIRED requirements'
                        : !isDiscordLinked
                          ? 'Discord not linked'
                          : 'No guildId on community',
                });
            }

            for (const req of eventDetails.requirements) {
                const status: RequirementStatus = {
                    id: req.id,
                    type: req.type,
                    config: req.config,
                    isMet: false,
                    message: '',
                    checking: false,
                };

                // Check SOLANA_WALLET_CONNECTED
                if (req.type === 'SOLANA_WALLET_CONNECTED') {
                    status.isMet = connected && !!publicKey;
                    status.message = status.isMet ? 'Wallet connected' : 'Connect your Solana wallet';
                }

                // Check DISCORD_MEMBER_REQUIRED
                else if (req.type === 'DISCORD_MEMBER_REQUIRED') {
                    status.isMet = !!discordUserId;
                    status.message = status.isMet ? 'Discord account linked' : 'Link your Discord account';
                }

                // Check DISCORD_ROLE_REQUIRED
                else if (req.type === 'DISCORD_ROLE_REQUIRED') {
                    // Debug: Log the raw requirement config
                    console.log('[GiveawayEntry] Discord Role Requirement:', {
                        requirementId: req.id,
                        rawConfig: req.config,
                        configKeys: Object.keys(req.config),
                    });

                    // Handle both old format (roleId) and new format (roleIds array)
                    const requiredRoleIds = req.config.roleIds || (req.config.roleId ? [req.config.roleId] : []);

                    console.log('[GiveawayEntry] Parsed roleIds:', {
                        requiredRoleIds,
                        userRoles,
                        isDiscordLinked,
                    });

                    // Get role names (prioritize array, fall back to single roleNames object)
                    let displayRoleNames: string[] = [];
                    if (req.config.roleNames && typeof req.config.roleNames === 'object') {
                        if (Array.isArray(req.config.roleNames)) {
                            displayRoleNames = req.config.roleNames;
                        } else {
                            // Legacy: roleNames is an object keyed by roleId
                            displayRoleNames = requiredRoleIds.map(
                                id => req.config.roleNames[id] || roleNames[id] || id,
                            );
                        }
                    } else {
                        displayRoleNames = requiredRoleIds.map(id => roleNames[id] || 'Role');
                    }

                    // Check if user has ANY of the required roles
                    const hasRequiredRole = requiredRoleIds.some(roleId => userRoles.includes(roleId));
                    status.isMet = isDiscordLinked && hasRequiredRole;

                    // Debug logging
                    console.log('[GiveawayRequirements] Discord Role Check:', {
                        requiredRoleIds,
                        userRoles,
                        isDiscordLinked,
                        hasRequiredRole,
                        isMet: status.isMet,
                        roleNames: req.config.roleNames,
                    });

                    const roleDisplay = displayRoleNames.length > 0 ? displayRoleNames.join(', ') : 'Required Role';
                    status.message = `Have "${roleDisplay}" role in Discord`;

                    if (!isDiscordLinked) {
                        status.message = `Link Discord to verify "${roleDisplay}" role`;
                    }
                }

                // Check SOLANA_TOKEN_HOLDING
                else if (req.type === 'SOLANA_TOKEN_HOLDING') {
                    const { amount } = req.config;
                    status.message = `Hold ${amount || 'required'} tokens`;
                    status.isMet = false; // Will check on-chain
                }

                // Check SOLANA_NFT_OWNERSHIP
                else if (req.type === 'SOLANA_NFT_OWNERSHIP') {
                    const collection = req.config.collection || req.config.collectionName || 'NFT Collection';
                    status.message = `Own NFT from ${collection}`;
                    status.isMet = false; // Will be verified server-side
                }

                // Other requirement types
                else {
                    status.message = formatRequirement(req.type, req.config);
                    status.isMet = false;
                }

                statuses.push(status);
            }

            setRequirementStatuses(statuses);
        };

        verifyRequirements();
    }, [eventDetails, connected, publicKey, discordUserId, isDiscordLinked]);

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
                    discordUserId: discordUserId || undefined,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || errorData.error || 'Failed to submit entry');
            }

            const result = await response.json();
            setSuccess(true);

            // Check if auto-won (FCFS mode)
            if (result.winner) {
                setError(null);
                setTimeout(() => {
                    router.push(`/giveaways/${eventId}/success`);
                }, 2000);
            } else {
                setTimeout(() => {
                    router.push(`/communities/${eventDetails?.community.slug}`);
                }, 2000);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-pulse text-[#00ff41] text-xl mb-2">Loading...</div>
                    <p className="text-gray-400">Fetching giveaway details</p>
                </div>
            </div>
        );
    }

    if (!eventDetails) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <p className="text-red-400 text-xl mb-4">Giveaway not found</p>
                    <button
                        onClick={() => router.push('/')}
                        className="px-6 py-2 bg-[#00d4ff] text-[#0a0e27] font-semibold rounded-lg hover:bg-[#00d4ff]/90"
                    >
                        Return Home
                    </button>
                </div>
            </div>
        );
    }

    if (eventDetails.status !== 'ACTIVE') {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <p className="text-yellow-400 text-xl mb-4">This giveaway is no longer accepting entries</p>
                    <div className="inline-block px-4 py-2 bg-[#111528] border border-yellow-400/30 rounded-lg mb-6">
                        <span className="text-yellow-400 font-semibold">Status: {eventDetails.status}</span>
                    </div>
                    <br />
                    <button
                        onClick={() => router.push(`/communities/${eventDetails.community.slug}`)}
                        className="px-6 py-2 bg-[#00d4ff] text-[#0a0e27] font-semibold rounded-lg hover:bg-[#00d4ff]/90"
                    >
                        View Community
                    </button>
                </div>
            </div>
        );
    }

    const allRequirementsMet = requirementStatuses.every(r => r.isMet);

    return (
        <div className="min-h-screen px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="max-w-7xl mx-auto mb-8">
                <div className="flex items-center gap-4">
                    {eventDetails.community.icon && (
                        <img
                            src={eventDetails.community.icon}
                            alt={eventDetails.community.name}
                            className="w-12 h-12 rounded-lg"
                        />
                    )}
                    <div>
                        <h2 className="text-lg text-gray-400">{eventDetails.community.name}</h2>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="px-2 py-1 text-xs font-semibold bg-[#00ff41]/10 text-[#00ff41] border border-[#00ff41]/30 rounded">
                                {eventDetails.status}
                            </span>
                            <span className="px-2 py-1 text-xs font-semibold bg-[#00d4ff]/10 text-[#00d4ff] border border-[#00d4ff]/30 rounded">
                                {eventDetails.type}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* 3-Panel Layout */}
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Panel 1: Giveaway Details */}
                <div className="bg-[#111528] border border-[#00ff41]/20 rounded-lg p-6">
                    <h3 className="text-sm font-semibold text-[#00ff41] uppercase tracking-wide mb-4">
                        Giveaway Details
                    </h3>

                    <h1 className="text-2xl font-bold text-white mb-4">{eventDetails.title}</h1>

                    {eventDetails.imageUrl && (
                        <img
                            src={eventDetails.imageUrl}
                            alt={eventDetails.title}
                            className="w-full h-48 object-cover rounded-lg mb-4"
                        />
                    )}

                    {eventDetails.description && (
                        <p className="text-gray-300 mb-6 leading-relaxed">{eventDetails.description}</p>
                    )}

                    {eventDetails.prize && (
                        <div className="mb-6 p-4 bg-[#00ff41]/5 border border-[#00ff41]/20 rounded-lg">
                            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Prize</p>
                            <p className="text-[#00ff41] font-semibold">{eventDetails.prize}</p>
                        </div>
                    )}

                    {/* Countdown Timer */}
                    {timeLeft && (
                        <div className="mb-6">
                            <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Ends in</p>
                            <div className="grid grid-cols-4 gap-2">
                                <div className="bg-[#0a0e27] border border-[#00d4ff]/30 rounded-lg p-2 text-center">
                                    <div className="text-xl font-bold text-[#00d4ff]">{timeLeft.days}</div>
                                    <div className="text-xs text-gray-400">days</div>
                                </div>
                                <div className="bg-[#0a0e27] border border-[#00d4ff]/30 rounded-lg p-2 text-center">
                                    <div className="text-xl font-bold text-[#00d4ff]">{timeLeft.hours}</div>
                                    <div className="text-xs text-gray-400">hrs</div>
                                </div>
                                <div className="bg-[#0a0e27] border border-[#00d4ff]/30 rounded-lg p-2 text-center">
                                    <div className="text-xl font-bold text-[#00d4ff]">{timeLeft.minutes}</div>
                                    <div className="text-xs text-gray-400">min</div>
                                </div>
                                <div className="bg-[#0a0e27] border border-[#00d4ff]/30 rounded-lg p-2 text-center">
                                    <div className="text-xl font-bold text-[#00d4ff]">{timeLeft.seconds}</div>
                                    <div className="text-xs text-gray-400">sec</div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-400">Selection Mode</span>
                            <span className="text-sm font-semibold text-[#00d4ff]">{eventDetails.selectionMode}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-400">Total Entries</span>
                            <span className="text-sm font-semibold text-white">
                                {eventDetails._count?.entries || 0}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Panel 2: Requirements Verification */}
                <div className="bg-[#111528] border border-[#00d4ff]/20 rounded-lg p-6">
                    <h3 className="text-sm font-semibold text-[#00d4ff] uppercase tracking-wide mb-4">
                        Entry Requirements
                    </h3>

                    {requirementStatuses.length === 0 ? (
                        <p className="text-gray-400 text-sm">No specific requirements for this giveaway.</p>
                    ) : (
                        <div className="space-y-3">
                            {requirementStatuses.map(req => (
                                <div
                                    key={req.id}
                                    className={`flex items-start gap-3 p-3 rounded-lg border ${
                                        req.isMet
                                            ? 'bg-[#00ff41]/5 border-[#00ff41]/30'
                                            : 'bg-[#0a0e27] border-gray-700'
                                    }`}
                                >
                                    <div className="flex-shrink-0 mt-0.5">
                                        {req.checking ? (
                                            <div className="w-5 h-5 border-2 border-[#00d4ff] border-t-transparent rounded-full animate-spin" />
                                        ) : req.isMet ? (
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
                                    <div className="flex-1">
                                        <p
                                            className={`text-sm font-medium ${req.isMet ? 'text-white' : 'text-gray-300'}`}
                                        >
                                            {req.message}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Summary Message */}
                    <div className="mt-6 p-4 bg-[#0a0e27] border border-[#00d4ff]/30 rounded-lg">
                        {allRequirementsMet ? (
                            <p className="text-sm text-[#00ff41]">✓ All requirements met! You're ready to enter.</p>
                        ) : (
                            <p className="text-sm text-gray-400">
                                Complete the requirements above to be eligible for entry.
                            </p>
                        )}
                    </div>
                </div>

                {/* Panel 3: Enter Giveaway */}
                <div className="bg-[#111528] border border-[#00ff41]/20 rounded-lg p-6">
                    <h3 className="text-sm font-semibold text-[#00ff41] uppercase tracking-wide mb-4">
                        Enter Giveaway
                    </h3>

                    {existingEntry ? (
                        <div className="text-center py-8">
                            <div className="mb-4">
                                <svg
                                    className="w-16 h-16 mx-auto text-[#00ff41]"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                            </div>
                            <h4 className="text-xl font-bold text-white mb-2">Already Entered!</h4>
                            <p className="text-gray-400 mb-4">Your wallet is already registered for this giveaway.</p>
                            <div className="p-3 bg-[#0a0e27] border border-[#00d4ff]/30 rounded-lg mb-4">
                                <p className="text-xs text-gray-400 mb-1">Entry Status</p>
                                <p
                                    className={`text-sm font-semibold ${
                                        existingEntry.status === 'VALID'
                                            ? 'text-[#00ff41]'
                                            : existingEntry.status === 'INVALID'
                                              ? 'text-red-400'
                                              : 'text-yellow-400'
                                    }`}
                                >
                                    {existingEntry.status}
                                </p>
                            </div>
                            {eventDetails.selectionMode === 'FCFS' && eventDetails._count?.winners && (
                                <p className="text-[#00ff41] font-semibold">🎉 You won a spot!</p>
                            )}
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Wallet Connection */}
                            <div>
                                <label className="block text-sm font-medium text-white mb-2">Solana Wallet</label>
                                <WalletMultiButton className="!w-full" />
                                {connected && publicKey && (
                                    <div className="mt-3 p-3 bg-[#00ff41]/5 border border-[#00ff41]/30 rounded-lg">
                                        <p className="text-xs text-gray-400 mb-1">Connected Wallet</p>
                                        <p className="text-sm text-[#00ff41] font-mono break-all">
                                            {publicKey.toBase58()}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Discord User ID */}
                            {requirementStatuses.some(r => r.type.includes('DISCORD')) && (
                                <div>
                                    <label className="block text-sm font-medium text-white mb-2">
                                        Discord User ID
                                        {isDiscordLinked && (
                                            <span className="text-[#00ff41] text-xs ml-2">✓ Auto-linked</span>
                                        )}
                                        {!isDiscordLinked && (
                                            <span className="text-gray-400 text-xs ml-2">
                                                (Required for verification)
                                            </span>
                                        )}
                                    </label>
                                    {isDiscordLinked ? (
                                        <div className="p-4 bg-[#00ff41]/5 border border-[#00ff41]/30 rounded-lg">
                                            <p className="text-xs text-gray-400 mb-1">Linked from Discord Account</p>
                                            <p className="text-sm text-[#00ff41] font-mono">{discordUserId}</p>
                                            {discordVerifying && (
                                                <p className="text-xs text-blue-400 mt-2">
                                                    🔍 Verifying Discord server membership...
                                                </p>
                                            )}
                                            {discordVerificationError && (
                                                <p className="text-xs text-yellow-400 mt-2">
                                                    ⚠️ {discordVerificationError}
                                                </p>
                                            )}
                                        </div>
                                    ) : (
                                        <>
                                            <input
                                                type="text"
                                                value={discordUserId}
                                                onChange={e => setDiscordUserId(e.target.value)}
                                                placeholder="123456789012345678"
                                                className="w-full px-4 py-3 bg-[#0a0e27] border border-[#00d4ff] text-white rounded-lg focus:outline-none focus:border-[#00ff41] focus:ring-1 focus:ring-[#00ff41]"
                                            />
                                            <p className="text-xs text-gray-400 mt-2">
                                                Find your ID: User Settings → Advanced → Enable Developer Mode →
                                                Right-click your name → Copy ID
                                            </p>
                                        </>
                                    )}
                                </div>
                            )}

                            {/* Error Message */}
                            {error && (
                                <div className="p-4 bg-red-900/20 border border-red-500 rounded-lg">
                                    <p className="text-sm text-red-200">{error}</p>
                                </div>
                            )}

                            {/* Success Message */}
                            {success && (
                                <div className="p-4 bg-green-900/20 border border-green-500 rounded-lg">
                                    <p className="text-sm text-green-200">
                                        ✓ Entry submitted successfully! Verifying requirements...
                                    </p>
                                </div>
                            )}

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={!connected || submitting || success}
                                className="w-full px-6 py-4 bg-[#00ff41] text-[#0a0e27] font-bold text-lg rounded-lg hover:bg-[#00ff41]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-[#00ff41]/20"
                            >
                                {submitting ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <div className="w-5 h-5 border-2 border-[#0a0e27] border-t-transparent rounded-full animate-spin" />
                                        Submitting Entry...
                                    </span>
                                ) : success ? (
                                    'Entry Submitted!'
                                ) : (
                                    'Submit Entry'
                                )}
                            </button>

                            <p className="text-xs text-gray-400 text-center leading-relaxed">
                                Your wallet and Discord will be verified against the requirements.{' '}
                                {eventDetails.selectionMode === 'RANDOM' &&
                                    'Winners will be randomly selected when the giveaway ends.'}
                                {eventDetails.selectionMode === 'FCFS' &&
                                    'Winners are assigned on a first-come, first-served basis.'}
                                {eventDetails.selectionMode === 'MANUAL' &&
                                    'Winners will be manually selected by the community.'}
                            </p>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}

function formatRequirement(type: string, config: any): string {
    switch (type) {
        case 'SOLANA_WALLET_CONNECTED':
            return 'Connected Solana wallet required';
        case 'DISCORD_MEMBER_REQUIRED':
            return `Must be a member of the Discord server`;
        case 'DISCORD_ROLE_REQUIRED':
            return `Have "${config.roleName || config.roleId}" role in Discord`;
        case 'DISCORD_ACCOUNT_AGE_DAYS':
            return `Discord account must be at least ${config.minAgeDays || config.days} days old`;
        case 'DISCORD_SERVER_JOIN_AGE_DAYS':
            return `Must have been in server for at least ${config.minJoinAgeDays || config.days} days`;
        case 'SOLANA_TOKEN_HOLDING':
            return `Hold at least ${config.amount} ${config.symbol || 'tokens'}`;
        case 'SOLANA_NFT_OWNERSHIP':
            return `Own NFT from ${config.collectionName || config.collection || 'collection'}`;
        default:
            return `${type.replace(/_/g, ' ').toLowerCase()}`;
    }
}
