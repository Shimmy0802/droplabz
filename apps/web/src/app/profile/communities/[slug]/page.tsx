'use client';

import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CreateWhitelistForm } from '@/components/whitelists/CreateWhitelistForm';

interface Community {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    icon: string | null;
    banner: string | null;
    ownerId: string;
    guildId: string | null;
    discordGuildName: string | null;
    discordAnnouncementChannelId: string | null;
    discordAnnouncementChannelName: string | null;
    isListed: boolean;
    nftMintAddress: string | null;
    socials: {
        twitter?: string | null;
        discord?: string | null;
        website?: string | null;
        instagram?: string | null;
    } | null;
    _count: {
        members: number;
    };
}

interface DiscordGuild {
    id: string;
    name: string;
    icon: string | null;
    owner: boolean;
    permissions: number;
}

interface DiscordChannel {
    id: string;
    name: string;
}

interface Whitelist {
    id: string;
    title: string;
    description: string | null;
    status: 'ACTIVE' | 'DRAFT' | 'CLOSED';
    maxSpots: number;
    endAt: string;
    createdAt: string;
    _count: {
        entries: number;
    };
}

export default function CommunityAdminPage() {
    const { slug } = useParams() as { slug: string };
    const router = useRouter();
    const { status } = useSession();
    const [community, setCommunity] = useState<Community | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [tab, setTab] = useState<'overview' | 'whitelists' | 'presales' | 'settings'>('overview');
    const [toggling, setToggling] = useState(false);
    const [discordGuilds, setDiscordGuilds] = useState<DiscordGuild[]>([]);
    const [showGuildSelector, setShowGuildSelector] = useState(false);
    const [loadingGuilds, setLoadingGuilds] = useState(false);
    const [linkingGuild, setLinkingGuild] = useState(false);
    const [discordChannels, setDiscordChannels] = useState<DiscordChannel[]>([]);
    const [showChannelSelector, setShowChannelSelector] = useState(false);
    const [loadingChannels, setLoadingChannels] = useState(false);
    const [selectingChannel, setSelectingChannel] = useState(false);
    const [whitelists, setWhitelists] = useState<Whitelist[]>([]);
    const [loadingWhitelists, setLoadingWhitelists] = useState(false);
    const [showCreateWhitelist, setShowCreateWhitelist] = useState(false);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
            return;
        }

        if (status === 'authenticated') {
            fetchCommunity();
        }
    }, [status, slug, router]);

    const fetchCommunity = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/communities?slug=${slug}`);

            if (!response.ok) {
                if (response.status === 404) {
                    setError('Community not found');
                    return;
                }
                throw new Error('Failed to fetch community');
            }

            const data = await response.json();
            setCommunity(data);

            // Fetch whitelists for this community
            await fetchWhitelists(data.id);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const fetchWhitelists = async (communityId: string) => {
        try {
            setLoadingWhitelists(true);
            const response = await fetch(`/api/events?communityId=${communityId}`);

            if (!response.ok) {
                throw new Error('Failed to fetch whitelists');
            }

            const data = await response.json();
            setWhitelists(data || []);
        } catch (err) {
            console.error('Error fetching whitelists:', err);
            setWhitelists([]);
        } finally {
            setLoadingWhitelists(false);
        }
    };

    const toggleListing = async () => {
        if (!community) return;

        try {
            setToggling(true);
            const response = await fetch(`/api/communities?id=${community.id}&action=toggleListed`, {
                method: 'PATCH',
            });

            if (!response.ok) {
                throw new Error('Failed to update community');
            }

            const result = await response.json();
            setCommunity({
                ...community,
                isListed: result.isListed,
            });
        } catch (err) {
            console.error('Error toggling listing:', err);
            alert(err instanceof Error ? err.message : 'Failed to update listing status');
        } finally {
            setToggling(false);
        }
    };

    const fetchDiscordGuilds = async () => {
        try {
            setLoadingGuilds(true);
            const response = await fetch('/api/discord/guilds');

            if (!response.ok) {
                throw new Error('Failed to fetch Discord guilds');
            }

            const data = await response.json();
            setDiscordGuilds(data.guilds || []);
            setShowGuildSelector(true);
        } catch (err) {
            console.error('Error fetching guilds:', err);
            alert(err instanceof Error ? err.message : 'Failed to fetch Discord guilds');
        } finally {
            setLoadingGuilds(false);
        }
    };

    const linkGuild = async (guildId: string) => {
        if (!community) return;

        try {
            setLinkingGuild(true);
            // Find the guild name from the guilds list
            const guild = discordGuilds.find(g => g.id === guildId);
            const guildName = guild?.name || null;

            const response = await fetch(`/api/communities?id=${community.id}&action=connectGuild`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ guildId, guildName }),
            });

            if (!response.ok) {
                throw new Error('Failed to link guild');
            }

            const result = await response.json();
            setCommunity({
                ...community,
                guildId: result.guildId,
                discordGuildName: result.guildName,
            });
            setShowGuildSelector(false);
        } catch (err) {
            console.error('Error linking guild:', err);
            alert(err instanceof Error ? err.message : 'Failed to link guild');
        } finally {
            setLinkingGuild(false);
        }
    };

    const unlinkGuild = async () => {
        if (!community) return;

        try {
            setLinkingGuild(true);
            const response = await fetch(`/api/communities?id=${community.id}&action=disconnectGuild`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Failed to unlink guild');
            }

            const result = await response.json();
            setCommunity({
                ...community,
                guildId: result.guildId,
                discordGuildName: null,
                discordAnnouncementChannelId: null,
            });
        } catch (err) {
            console.error('Error unlinking guild:', err);
            alert(err instanceof Error ? err.message : 'Failed to unlink guild');
        } finally {
            setLinkingGuild(false);
        }
    };

    const fetchDiscordChannels = async () => {
        if (!community?.guildId) return;

        try {
            setLoadingChannels(true);
            const response = await fetch(`/api/discord/channels?guildId=${community.guildId}`);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const errorMsg =
                    errorData.details || errorData.error || `Failed to fetch channels (${response.status})`;
                throw new Error(errorMsg);
            }

            const data = await response.json();
            setDiscordChannels(data.channels || []);
            setShowChannelSelector(true);
        } catch (err) {
            console.error('Error fetching channels:', err);
            const message = err instanceof Error ? err.message : 'Failed to fetch Discord channels';
            alert(
                `Error: ${message}\n\nMake sure you're logged in with Discord OAuth and the bot has access to your server.`,
            );
        } finally {
            setLoadingChannels(false);
        }
    };

    const setAnnouncementChannel = async (channelId: string) => {
        if (!community) return;

        try {
            setSelectingChannel(true);

            // Find the channel name from the channels list
            const channel = discordChannels.find(ch => ch.id === channelId);
            const channelName = channel?.name || null;

            const response = await fetch(`/api/communities?id=${community.id}&action=setAnnouncementChannel`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ channelId, channelName }),
            });

            if (!response.ok) {
                throw new Error('Failed to set announcement channel');
            }

            const result = await response.json();
            setCommunity({
                ...community,
                discordAnnouncementChannelId: result.channelId,
                discordAnnouncementChannelName: result.channelName,
            });
            setShowChannelSelector(false);
        } catch (err) {
            console.error('Error setting channel:', err);
            alert(err instanceof Error ? err.message : 'Failed to set announcement channel');
        } finally {
            setSelectingChannel(false);
        }
    };

    if (status === 'loading' || loading) {
        return (
            <div className="space-y-6">
                <div className="h-32 bg-gray-700 rounded animate-pulse" />
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-24 bg-gray-700 rounded animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    if (status === 'unauthenticated') {
        return null;
    }

    if (error) {
        return (
            <div className="space-y-6">
                <div className="p-6 bg-red-900/20 border border-red-800 rounded-lg">
                    <h1 className="text-2xl font-bold text-red-400 mb-2">Error</h1>
                    <p className="text-red-300">{error}</p>
                    <Link
                        href="/profile/communities"
                        className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        Back to Communities
                    </Link>
                </div>
            </div>
        );
    }

    if (!community) {
        return null;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-4xl font-bold text-white">{community.name}</h1>
                    <p className="text-gray-400 mt-2">@{community.slug}</p>
                    {community.description && <p className="text-gray-400 mt-2 max-w-2xl">{community.description}</p>}
                </div>
                <Link
                    href="/profile/communities"
                    className="px-4 py-2 bg-gray-900 border border-gray-700 text-white rounded-lg hover:border-gray-600"
                >
                    Back
                </Link>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-gray-900/40 border border-gray-700 rounded-lg">
                    <p className="text-gray-400 text-sm mb-2">Members</p>
                    <p className="text-3xl font-bold text-[#00ff41]">{community._count.members}</p>
                </div>
                <div className="p-4 bg-gray-900/40 border border-gray-700 rounded-lg">
                    <p className="text-gray-400 text-sm mb-2">Discord Status</p>
                    <p className="text-xl font-semibold text-gray-300">
                        {community.guildId ? '✓ Connected' : '○ Not Connected'}
                    </p>
                </div>
                <div className="p-4 bg-gray-900/40 border border-gray-700 rounded-lg">
                    <p className="text-gray-400 text-sm mb-2">Community ID</p>
                    <p className="text-xs font-mono text-gray-400 break-all">{community.id}</p>
                </div>
                <div className="p-4 bg-gray-900/40 border border-gray-700 rounded-lg">
                    <p className="text-gray-400 text-sm mb-2">Slug</p>
                    <p className="text-lg font-semibold text-white">{community.slug}</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-700">
                <div className="flex gap-8">
                    {(['overview', 'whitelists', 'presales', 'settings'] as const).map(tabName => (
                        <button
                            key={tabName}
                            onClick={() => setTab(tabName)}
                            className={`px-4 py-4 font-medium border-b-2 transition capitalize ${
                                tab === tabName
                                    ? 'border-[#00d4ff] text-[#00d4ff]'
                                    : 'border-transparent text-gray-400 hover:text-white'
                            }`}
                        >
                            {tabName}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tab Content */}
            <div className="space-y-6">
                {tab === 'overview' && (
                    <div className="grid gap-6">
                        <div className="p-6 bg-gray-900/40 border border-gray-700 rounded-lg">
                            <h2 className="text-xl font-bold text-white mb-4">Quick Actions</h2>
                            <div className="flex flex-wrap gap-3">
                                <Link
                                    href={`/communities/${slug}/admin?tab=whitelists`}
                                    onClick={() => setTab('whitelists')}
                                    className="px-4 py-2 bg-[#00ff41] text-black rounded-lg font-semibold hover:bg-[#00dd33] transition"
                                >
                                    Create Whitelist
                                </Link>
                                <Link
                                    href={`/communities/${slug}/admin?tab=presales`}
                                    onClick={() => setTab('presales')}
                                    className="px-4 py-2 bg-[#00ff41] text-black rounded-lg font-semibold hover:bg-[#00dd33] transition"
                                >
                                    Create Pre-Sale
                                </Link>
                                <Link
                                    href={`/communities/${slug}/admin?tab=settings`}
                                    onClick={() => setTab('settings')}
                                    className="px-4 py-2 bg-[#00d4ff] text-black rounded-lg font-semibold hover:bg-[#0099cc] transition"
                                >
                                    Settings
                                </Link>
                            </div>
                        </div>

                        <div className="p-6 bg-gray-900/40 border border-gray-700 rounded-lg">
                            <h3 className="text-lg font-bold text-white mb-4">Getting Started</h3>
                            <ol className="space-y-3 text-gray-300 list-decimal list-inside">
                                <li>Configure your community settings (Discord, Solana)</li>
                                <li>Create whitelists or pre-sales with custom requirements</li>
                                <li>Share the public page with your community</li>
                                <li>Review and manage entries in the admin panel</li>
                                <li>Announce winners or distribute allocations</li>
                            </ol>
                        </div>
                    </div>
                )}

                {tab === 'whitelists' && (
                    <div className="space-y-6">
                        {!showCreateWhitelist ? (
                            <div className="p-6 bg-gray-900/40 border border-gray-700 rounded-lg">
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h2 className="text-xl font-bold text-white">Whitelists</h2>
                                        <p className="text-gray-400 mt-1">
                                            Manage whitelists for your community. Whitelists verify participants through
                                            Discord roles and Solana wallet requirements.
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setShowCreateWhitelist(true)}
                                        className="px-4 py-2 bg-[#00ff41] text-black rounded-lg font-semibold hover:bg-[#00dd33] transition whitespace-nowrap"
                                    >
                                        Create Whitelist
                                    </button>
                                </div>

                                {loadingWhitelists ? (
                                    <div className="space-y-3">
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className="h-20 bg-gray-800 rounded animate-pulse" />
                                        ))}
                                    </div>
                                ) : whitelists.length === 0 ? (
                                    <div className="text-center py-12">
                                        <p className="text-gray-400 mb-4">No whitelists yet</p>
                                        <p className="text-gray-500 text-sm">
                                            Create your first whitelist to get started
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {whitelists.map(whitelist => (
                                            <div
                                                key={whitelist.id}
                                                className="p-4 bg-gray-800 border border-gray-700 rounded-lg hover:border-gray-600 transition"
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-3 mb-2">
                                                            <h3 className="text-lg font-semibold text-white">
                                                                {whitelist.title}
                                                            </h3>
                                                            <span
                                                                className={`px-2 py-1 text-xs font-medium rounded-full ${
                                                                    whitelist.status === 'ACTIVE'
                                                                        ? 'bg-green-900/30 text-green-400 border border-green-700'
                                                                        : whitelist.status === 'CLOSED'
                                                                          ? 'bg-red-900/30 text-red-400 border border-red-700'
                                                                          : 'bg-gray-700 text-gray-300 border border-gray-600'
                                                                }`}
                                                            >
                                                                {whitelist.status}
                                                            </span>
                                                        </div>
                                                        {whitelist.description && (
                                                            <p className="text-gray-400 text-sm mb-3">
                                                                {whitelist.description}
                                                            </p>
                                                        )}
                                                        <div className="flex items-center gap-6 text-sm">
                                                            <div>
                                                                <span className="text-gray-400">Entries: </span>
                                                                <span className="text-white font-semibold">
                                                                    {whitelist._count.entries}
                                                                </span>
                                                            </div>
                                                            <div>
                                                                <span className="text-gray-400">Max Spots: </span>
                                                                <span className="text-white font-semibold">
                                                                    {whitelist.maxSpots}
                                                                </span>
                                                            </div>
                                                            <div>
                                                                <span className="text-gray-400">Ends: </span>
                                                                <span className="text-white font-semibold">
                                                                    {new Date(whitelist.endAt).toLocaleDateString()}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <Link
                                                        href={`/profile/communities/${slug}/admin/whitelists/${whitelist.id}`}
                                                        className="px-4 py-2 bg-[#00d4ff] text-black rounded-lg font-semibold hover:bg-[#0099cc] transition text-sm whitespace-nowrap ml-4"
                                                    >
                                                        Manage
                                                    </Link>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="p-6 bg-gray-900/40 border border-gray-700 rounded-lg">
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h2 className="text-xl font-bold text-white">Create Whitelist</h2>
                                        <p className="text-gray-400 mt-1">
                                            Set up a new whitelist with custom requirements
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setShowCreateWhitelist(false)}
                                        className="px-4 py-2 bg-gray-900 border border-gray-700 text-white rounded-lg hover:border-gray-600"
                                    >
                                        Back to List
                                    </button>
                                </div>
                                <CreateWhitelistForm
                                    communityId={community.id}
                                    slug={slug}
                                    onSuccess={() => {
                                        setShowCreateWhitelist(false);
                                        fetchWhitelists(community.id);
                                    }}
                                />
                            </div>
                        )}
                    </div>
                )}

                {tab === 'presales' && (
                    <div className="p-6 bg-gray-900/40 border border-gray-700 rounded-lg">
                        <h2 className="text-xl font-bold text-white mb-4">Pre-Sales</h2>
                        <p className="text-gray-400 mb-6">
                            Manage tiered pre-sales with custom allocation amounts and access requirements.
                        </p>
                        <Link
                            href={`#`}
                            className="px-4 py-2 bg-[#00ff41] text-black rounded-lg font-semibold hover:bg-[#00dd33] transition inline-block"
                        >
                            Create New Pre-Sale
                        </Link>
                        <p className="text-gray-500 text-sm mt-4">Feature coming soon</p>
                    </div>
                )}

                {tab === 'settings' && (
                    <div className="space-y-6">
                        <div className="p-6 bg-gray-900/40 border border-gray-700 rounded-lg">
                            <h2 className="text-xl font-bold text-white mb-4">Community Settings</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Community Name
                                    </label>
                                    <input
                                        type="text"
                                        value={community.name}
                                        disabled
                                        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 text-gray-400 rounded-lg"
                                    />
                                    <p className="text-gray-500 text-sm mt-1">
                                        Edit in community settings (coming soon)
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Public Listing
                                    </label>
                                    <div className="p-4 border border-gray-700 rounded-lg bg-gray-900/40">
                                        {community.isListed ? (
                                            <div>
                                                <p className="text-[#00ff41] font-semibold">✓ Public</p>
                                                <p className="text-gray-400 text-sm mt-1">
                                                    Your community appears on the public communities page.
                                                </p>
                                                <button
                                                    onClick={toggleListing}
                                                    disabled={toggling}
                                                    className="mt-3 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 transition text-sm font-medium"
                                                >
                                                    {toggling ? 'Updating...' : 'Make Private'}
                                                </button>
                                            </div>
                                        ) : (
                                            <div>
                                                <p className="text-gray-400 mb-3">
                                                    Your community is currently private. Make it public to appear on the
                                                    communities list.
                                                </p>
                                                <button
                                                    onClick={toggleListing}
                                                    disabled={toggling}
                                                    className="px-4 py-2 bg-[#00ff41] text-black rounded-lg hover:bg-[#00dd33] disabled:opacity-50 transition font-semibold text-sm"
                                                >
                                                    {toggling ? 'Updating...' : 'Make Public'}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Discord Server
                                    </label>
                                    <div className="p-4 border border-gray-700 rounded-lg bg-gray-900/40 space-y-4">
                                        {community.guildId ? (
                                            <div className="space-y-4">
                                                <div>
                                                    <p className="text-[#00ff41] font-semibold">✓ Connected</p>
                                                    <p className="text-gray-300 text-lg font-medium mt-2">
                                                        {community.discordGuildName ? (
                                                            <>
                                                                {community.discordGuildName} • {community.guildId}
                                                            </>
                                                        ) : (
                                                            <>Guild ID: {community.guildId}</>
                                                        )}
                                                    </p>
                                                </div>

                                                {/* Announcement Channel Selection */}
                                                <div className="pt-3 border-t border-gray-700">
                                                    <p className="text-gray-300 font-medium text-sm mb-3">
                                                        Announcement Channel
                                                    </p>
                                                    {community.discordAnnouncementChannelId ? (
                                                        <div className="bg-gray-800 p-3 rounded border border-gray-700">
                                                            <p className="text-[#00d4ff] text-sm">✓ Channel Selected</p>
                                                            <p className="text-gray-300 text-lg font-medium mt-2">
                                                                {community.discordAnnouncementChannelName ? (
                                                                    <>
                                                                        #{community.discordAnnouncementChannelName} •{' '}
                                                                        {community.discordAnnouncementChannelId}
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        Channel ID:{' '}
                                                                        {community.discordAnnouncementChannelId}
                                                                    </>
                                                                )}
                                                            </p>
                                                            <button
                                                                onClick={fetchDiscordChannels}
                                                                disabled={loadingChannels}
                                                                className="mt-2 px-4 py-2 bg-[#00d4ff] text-black rounded-lg hover:bg-[#0099cc] disabled:opacity-50 transition text-sm font-medium"
                                                            >
                                                                {loadingChannels ? 'Loading...' : 'Change Channel'}
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div>
                                                            <p className="text-gray-400 text-sm mb-3">
                                                                Select a channel for bot announcements (whitelists,
                                                                presales, winners).
                                                            </p>
                                                            <button
                                                                onClick={fetchDiscordChannels}
                                                                disabled={loadingChannels}
                                                                className="px-4 py-2 bg-[#00d4ff] text-black rounded-lg hover:bg-[#0099cc] disabled:opacity-50 transition text-sm font-medium"
                                                            >
                                                                {loadingChannels ? 'Loading...' : 'Select Channel'}
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>

                                                <button
                                                    onClick={unlinkGuild}
                                                    disabled={linkingGuild}
                                                    className="px-3 py-1.5 bg-red-900/30 border border-red-700 text-red-400 rounded-lg hover:bg-red-900/50 transition text-xs disabled:opacity-50 font-medium"
                                                >
                                                    {linkingGuild ? 'Disconnecting...' : 'Disconnect Server'}
                                                </button>
                                            </div>
                                        ) : (
                                            <div>
                                                <p className="text-gray-400 mb-3">
                                                    No Discord server connected. Link a Discord server to enable bot
                                                    features.
                                                </p>
                                                <button
                                                    onClick={fetchDiscordGuilds}
                                                    disabled={loadingGuilds}
                                                    className="px-4 py-2 bg-[#5865F2] text-white rounded-lg hover:bg-[#4752C4] transition font-semibold disabled:opacity-50"
                                                >
                                                    {loadingGuilds ? 'Loading...' : 'Connect Discord'}
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Guild Selector Modal */}
                                    {showGuildSelector && (
                                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                                            <div className="bg-gray-900 border border-gray-700 rounded-lg max-w-md w-full p-6 space-y-4">
                                                <h3 className="text-xl font-bold text-white">Select Discord Server</h3>
                                                <p className="text-gray-400 text-sm">
                                                    Choose a server you own or admin to connect with your community.
                                                </p>

                                                {discordGuilds.length === 0 ? (
                                                    <p className="text-gray-400 text-sm py-8 text-center">
                                                        No servers available. You must own or admin a Discord server.
                                                    </p>
                                                ) : (
                                                    <div className="space-y-2 max-h-96 overflow-y-auto">
                                                        {discordGuilds.map(guild => (
                                                            <button
                                                                key={guild.id}
                                                                onClick={() => linkGuild(guild.id)}
                                                                disabled={linkingGuild}
                                                                className="w-full p-3 text-left bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg transition disabled:opacity-50 flex items-center gap-3"
                                                            >
                                                                {guild.icon && (
                                                                    <img
                                                                        src={`https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`}
                                                                        alt={guild.name}
                                                                        className="w-8 h-8 rounded-full"
                                                                    />
                                                                )}
                                                                <div>
                                                                    <p className="text-white font-medium">
                                                                        {guild.name}
                                                                    </p>
                                                                    <p className="text-gray-400 text-xs">
                                                                        {guild.owner ? 'Owner' : 'Admin'}
                                                                    </p>
                                                                </div>
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}

                                                <button
                                                    onClick={() => setShowGuildSelector(false)}
                                                    className="w-full px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition text-sm"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Channel Selector Modal */}
                                    {showChannelSelector && (
                                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                                            <div className="bg-gray-900 border border-gray-700 rounded-lg max-w-md w-full p-6 space-y-4">
                                                <h3 className="text-xl font-bold text-white">
                                                    Select Announcement Channel
                                                </h3>
                                                <p className="text-gray-400 text-sm">
                                                    Choose a text channel for bot announcements (whitelists, presales,
                                                    winners).
                                                </p>

                                                {discordChannels.length === 0 ? (
                                                    <p className="text-gray-400 text-sm py-8 text-center">
                                                        No text channels available in this server.
                                                    </p>
                                                ) : (
                                                    <div className="space-y-2 max-h-96 overflow-y-auto">
                                                        {discordChannels.map(channel => (
                                                            <button
                                                                key={channel.id}
                                                                onClick={() => setAnnouncementChannel(channel.id)}
                                                                disabled={selectingChannel}
                                                                className="w-full p-3 text-left bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg transition disabled:opacity-50 flex items-center gap-3"
                                                            >
                                                                <span className="text-[#00d4ff] font-bold">#</span>
                                                                <p className="text-white font-medium">{channel.name}</p>
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}

                                                <button
                                                    onClick={() => setShowChannelSelector(false)}
                                                    className="w-full px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition text-sm"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Solana Program Configuration
                                    </label>
                                    <div className="p-4 border border-gray-700 rounded-lg bg-gray-900/40">
                                        <p className="text-gray-400 text-sm mb-3">
                                            Configure your Solana program for on-chain verification and claims.
                                        </p>
                                        <button className="px-4 py-2 bg-[#00d4ff] text-black rounded-lg hover:bg-[#0099cc] transition font-semibold text-sm">
                                            Configure Solana
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 bg-gray-900/40 border border-gray-700 rounded-lg">
                            <h2 className="text-xl font-bold text-white mb-4">Danger Zone</h2>
                            <button className="px-4 py-2 bg-red-900/30 border border-red-700 text-red-400 rounded-lg hover:bg-red-900/50 transition font-semibold">
                                Delete Community
                            </button>
                            <p className="text-gray-500 text-sm mt-2">This action cannot be undone</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
