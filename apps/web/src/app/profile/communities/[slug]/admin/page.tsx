'use client';

import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useEffect } from 'react';
import Link from 'next/link';
import { EditCommunityForm } from '@/components/community/EditCommunityForm';
import UserManagementPanel from '@/components/admin/UserManagementPanel';
import { OverviewTab } from '@/components/admin/OverviewTab';
import { WhitelistsTabContent } from '@/components/admin/WhitelistsTabContent';
import { DiscordIntegrationPanel } from '@/components/admin/DiscordIntegrationPanel';
import { DiscordPermissionsGuide } from '@/components/community/DiscordPermissionsGuide';
import { PermissionSetupHelp } from '@/components/community/PermissionSetupHelp';
import { useAdminPageState } from '@/hooks/useAdminPageState';
import type { TabType } from '@/hooks/useAdminPageState';
import { useCommunityData } from '@/hooks/useCommunityData';
import { useDiscordIntegration } from '@/hooks/useDiscordIntegration';
import { useWhitelists } from '@/hooks/useWhitelists';

export default function CommunityAdminPage() {
    const { slug } = useParams() as { slug: string };
    const router = useRouter();
    const { status } = useSession();
    const { state, dispatch } = useAdminPageState();
    const community = state.community;
    const loading = state.isLoading;
    const error = state.error;
    const tab = state.tab;
    const toggling = state.ui.isToggling;
    const discordGuilds = state.discord.guilds;
    const showGuildSelector = state.discord.showGuildSelector;
    const loadingGuilds = state.discord.isLoadingGuilds;
    const linkingGuild = state.discord.isLinking;
    const discordChannels = state.discord.channels;
    const showChannelSelector = state.discord.showChannelSelector;
    const loadingChannels = state.discord.isLoadingChannels;
    const selectingChannel = state.discord.isSelecting;
    const whitelists = state.whitelists.items;
    const loadingWhitelists = state.whitelists.isLoading;
    const showCreateWhitelist = state.whitelists.showCreate;
    const discordTicketUrl = process.env.NEXT_PUBLIC_DISCORD_TICKET_URL || '';

    const { fetchWhitelists } = useWhitelists(dispatch);
    const { fetchCommunity } = useCommunityData({ slug, dispatch, fetchWhitelists });
    const { fetchDiscordGuilds, linkGuild, unlinkGuild, fetchDiscordChannels, setAnnouncementChannel } =
        useDiscordIntegration({
            community,
            dispatch,
            discordGuilds,
            discordChannels,
            onRefreshCommunity: fetchCommunity,
        });

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
            return;
        }

        if (status === 'authenticated') {
            fetchCommunity();
        }
    }, [fetchCommunity, router, status]);

    // Handle hash-based navigation from sidebar
    useEffect(() => {
        const handleHashChange = () => {
            const hash = window.location.hash.replace('#', '');
            if (hash && ['overview', 'whitelists', 'presales', 'members', 'settings', 'giveaways'].includes(hash)) {
                dispatch({ type: 'SET_TAB', payload: hash as TabType });
            }
        };

        // Check hash on mount
        handleHashChange();

        // Listen for hash changes
        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);

    const toggleListing = async () => {
        if (!community) return;

        try {
            dispatch({ type: 'UI_START_TOGGLE' });
            const response = await fetch(`/api/communities?id=${community.id}&action=toggleListed`, {
                method: 'PATCH',
            });

            if (!response.ok) {
                throw new Error('Failed to update community');
            }

            const result = await response.json();
            dispatch({
                type: 'SET_COMMUNITY',
                payload: {
                    ...community,
                    isListed: result.isListed,
                },
            });
        } catch (err) {
            console.error('Error toggling listing:', err);
            alert(err instanceof Error ? err.message : 'Failed to update listing status');
        } finally {
            dispatch({ type: 'UI_END_TOGGLE' });
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
        <div className="min-h-full flex flex-col gap-4">
            {/* Header */}
            <div className="flex items-start justify-between flex-shrink-0">
                <div>
                    <h1 className="text-2xl font-bold text-white">{community.name}</h1>
                    <p className="text-gray-400 text-xs mt-1">@{community.slug}</p>
                    {community.description && (
                        <p className="text-gray-400 text-xs mt-2 max-w-2xl line-clamp-2">{community.description}</p>
                    )}
                </div>
                <Link
                    href="/profile/communities"
                    className="px-3 py-2 bg-gray-900 border border-gray-700 text-white rounded-lg hover:border-gray-600 text-xs"
                >
                    Back
                </Link>
            </div>
            {!community.isVerified && (
                <div className="bg-yellow-900/20 border border-yellow-700/40 rounded-lg p-4 text-sm">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                        <div>
                            <p className="text-yellow-300 font-semibold">Verification required</p>
                            <p className="text-yellow-200/80 mt-1">
                                Communities must be manually approved. Open a Discord ticket to request verification.
                            </p>
                            <p className="text-yellow-200/70 mt-1">
                                Status: <span className="font-semibold">{community.verificationStatus}</span>
                            </p>
                        </div>
                        {discordTicketUrl ? (
                            <a
                                href={discordTicketUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-4 py-2 rounded-lg bg-[#00d4ff] text-[#0a0e27] font-semibold hover:bg-[#0099cc] transition"
                            >
                                Open Discord Ticket
                            </a>
                        ) : (
                            <div className="text-yellow-200/80">Discord ticket link not configured</div>
                        )}
                    </div>
                </div>
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 flex-shrink-0">
                <div className="bg-[#111528] border border-[rgba(0,255,65,0.15)] rounded p-4">
                    <p className="text-gray-400 text-xs font-semibold uppercase mb-2">Active Whitelists</p>
                    <div className="flex items-start justify-between">
                        <p className="text-3xl font-bold text-white">
                            {whitelists.filter(w => w.status === 'ACTIVE').length || 0}
                        </p>
                        <span className="text-[#00ff41] text-xs">↑ +2 from last week</span>
                    </div>
                </div>
                <div className="bg-[#111528] border border-[rgba(0,255,65,0.15)] rounded p-4">
                    <p className="text-gray-400 text-xs font-semibold uppercase mb-2">New Entries Today</p>
                    <div className="flex items-start justify-between">
                        <p className="text-3xl font-bold text-white">
                            {whitelists.reduce((sum, w) => sum + w._count.entries, 0) || 0}
                        </p>
                        <span className="text-[#00ff41] text-xs">↑ +45% from yesterday</span>
                    </div>
                </div>
                <div className="bg-[#111528] border border-[rgba(0,255,65,0.15)] rounded p-4">
                    <p className="text-gray-400 text-xs font-semibold uppercase mb-2">Verification Rate</p>
                    <div className="flex items-start justify-between">
                        <p className="text-3xl font-bold text-white">94.7%</p>
                        <span className="text-[#00ff41] text-xs">↑ +2.1% improvement</span>
                    </div>
                </div>
                <div className="bg-[#111528] border border-[rgba(0,255,65,0.15)] rounded p-4">
                    <p className="text-gray-400 text-xs font-semibold uppercase mb-2">Total Members</p>
                    <div className="flex items-start justify-between">
                        <p className="text-3xl font-bold text-white">{community._count.members.toLocaleString()}</p>
                        <span className="text-[#00ff41] text-xs">↑ +284 this month</span>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-700 flex-shrink-0">
                <div className="flex gap-6 text-sm">
                    {(['overview', 'whitelists', 'giveaways', 'presales', 'members', 'settings', 'help'] as const).map(
                        tabName => (
                            <button
                                key={tabName}
                                onClick={() => dispatch({ type: 'SET_TAB', payload: tabName })}
                                className={`px-3 py-3 font-medium border-b-2 transition capitalize ${
                                    tab === tabName
                                        ? 'border-[#00d4ff] text-[#00d4ff]'
                                        : 'border-transparent text-gray-400 hover:text-white'
                                }`}
                            >
                                {tabName === 'help' ? '📋 Help' : tabName}
                            </button>
                        ),
                    )}
                </div>
            </div>

            {/* Tab Content */}
            <div className="flex-1">
                <div className="pr-2 pb-6 space-y-4">
                    {tab === 'overview' && (
                        <OverviewTab onNavigateTab={nextTab => dispatch({ type: 'SET_TAB', payload: nextTab })} />
                    )}

                    {tab === 'whitelists' && (
                        <WhitelistsTabContent
                            communityId={community.id}
                            slug={slug}
                            whitelists={whitelists}
                            isLoading={loadingWhitelists}
                            showCreate={showCreateWhitelist}
                            onShowCreate={() => dispatch({ type: 'WHITELISTS_SHOW_CREATE' })}
                            onHideCreate={() => dispatch({ type: 'WHITELISTS_HIDE_CREATE' })}
                            onCreateSuccess={() => {
                                dispatch({ type: 'WHITELISTS_HIDE_CREATE' });
                                fetchWhitelists(community.id);
                            }}
                        />
                    )}

                    {tab === 'giveaways' && (
                        <div className="p-4 bg-gray-900/40 border border-gray-700 rounded-lg">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h2 className="text-sm font-bold text-white">Giveaways</h2>
                                    <p className="text-gray-400 text-xs mt-1">
                                        Manage giveaways and raffle events for your community.
                                    </p>
                                </div>
                                <Link
                                    href={`/profile/communities/${slug}/admin/giveaways`}
                                    className="px-3 py-2 bg-[#00ff41] text-black rounded-lg font-semibold hover:bg-[#00dd33] transition whitespace-nowrap text-xs"
                                >
                                    View All Giveaways
                                </Link>
                            </div>
                            <p className="text-gray-500 text-xs">
                                Navigate to giveaways page to create and manage giveaways.
                            </p>
                        </div>
                    )}

                    {tab === 'presales' && (
                        <div className="p-4 bg-gray-900/40 border border-gray-700 rounded-lg">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h2 className="text-sm font-bold text-white">Pre-Sales</h2>
                                    <p className="text-gray-400 text-xs mt-1">
                                        Manage tiered pre-sales with custom allocation amounts and access requirements.
                                    </p>
                                </div>
                                <Link
                                    href={`/profile/communities/${slug}/admin/presales`}
                                    className="px-3 py-2 bg-[#00ff41] text-black rounded-lg font-semibold hover:bg-[#00dd33] transition whitespace-nowrap text-xs"
                                >
                                    View All Presales
                                </Link>
                            </div>
                            <p className="text-gray-500 text-xs">Pre-sales feature coming soon</p>
                        </div>
                    )}

                    {tab === 'members' && (
                        <div className="p-4 bg-gray-900/40 border border-gray-700 rounded-lg">
                            <h2 className="text-sm font-bold text-white mb-3">Members</h2>
                            <p className="text-gray-400 text-xs mb-4">
                                Manage community members, roles, and permissions.
                            </p>
                            <UserManagementPanel communityId={community.id} />
                        </div>
                    )}

                    {tab === 'settings' && (
                        <div className="space-y-4">
                            <div className="p-4 bg-gray-900/40 border border-gray-700 rounded-lg">
                                <h2 className="text-sm font-bold text-white mb-3">Community Settings</h2>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-300 mb-2">
                                            Community Name
                                        </label>
                                        <input
                                            type="text"
                                            value={community.name}
                                            disabled
                                            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-gray-400 rounded-lg text-xs"
                                        />
                                        <p className="text-gray-500 text-xs mt-1">
                                            Edit in community settings (coming soon)
                                        </p>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-gray-300 mb-2">
                                            Public Listing
                                        </label>
                                        <div className="p-4 border border-gray-700 rounded-lg bg-gray-900/40">
                                            {community.isListed ? (
                                                <div>
                                                    <p className="text-[#00ff41] font-semibold text-sm">✓ Public</p>
                                                    <p className="text-gray-400 text-xs mt-1">
                                                        Your community appears on the public communities page.
                                                    </p>
                                                    <button
                                                        onClick={toggleListing}
                                                        disabled={toggling}
                                                        className="mt-3 px-3 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 transition text-xs font-medium"
                                                    >
                                                        {toggling ? 'Updating...' : 'Make Private'}
                                                    </button>
                                                </div>
                                            ) : (
                                                <div>
                                                    <p className="text-gray-400 text-xs mb-3">
                                                        Your community is currently private. Make it public to appear on
                                                        the communities list.
                                                    </p>
                                                    <button
                                                        onClick={toggleListing}
                                                        disabled={toggling}
                                                        className="px-3 py-2 bg-[#00ff41] text-black rounded-lg hover:bg-[#00dd33] disabled:opacity-50 transition font-semibold text-xs"
                                                    >
                                                        {toggling ? 'Updating...' : 'Make Public'}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <DiscordIntegrationPanel
                                        community={community}
                                        discordGuilds={discordGuilds}
                                        discordChannels={discordChannels}
                                        showGuildSelector={showGuildSelector}
                                        showChannelSelector={showChannelSelector}
                                        isLoadingGuilds={loadingGuilds}
                                        isLoadingChannels={loadingChannels}
                                        isLinkingGuild={linkingGuild}
                                        isSelectingChannel={selectingChannel}
                                        onFetchGuilds={fetchDiscordGuilds}
                                        onLinkGuild={linkGuild}
                                        onUnlinkGuild={unlinkGuild}
                                        onFetchChannels={fetchDiscordChannels}
                                        onSelectChannel={setAnnouncementChannel}
                                        onCloseGuildSelector={() => dispatch({ type: 'DISCORD_CLOSE_GUILD_SELECTOR' })}
                                        onCloseChannelSelector={() =>
                                            dispatch({ type: 'DISCORD_CLOSE_CHANNEL_SELECTOR' })
                                        }
                                    />

                                    {/* Discord Permissions Guide */}
                                    <DiscordPermissionsGuide expanded={false} className="mt-4" />

                                    <div>
                                        <label className="block text-xs font-medium text-gray-300 mb-2">
                                            Solana Program Configuration
                                        </label>
                                        <div className="p-4 border border-gray-700 rounded-lg bg-gray-900/40">
                                            <p className="text-gray-400 text-xs mb-3">
                                                Configure your Solana program for on-chain verification and claims.
                                            </p>
                                            <button className="px-3 py-2 bg-[#00d4ff] text-black rounded-lg hover:bg-[#0099cc] transition font-semibold text-xs">
                                                Configure Solana
                                            </button>
                                        </div>
                                    </div>

                                    {/* Community Metadata Section */}
                                    <div className="border-t border-gray-700 pt-4">
                                        <h3 className="text-sm font-bold text-white mb-3">Community Profile</h3>
                                        <p className="text-gray-400 text-xs mb-3">
                                            Edit your community details, add social links, and configure your NFT
                                            collection.
                                        </p>
                                        {community && (
                                            <EditCommunityForm
                                                community={community}
                                                onSuccess={() => {
                                                    // Refresh community data
                                                    fetchCommunity();
                                                }}
                                            />
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 bg-gray-900/40 border border-gray-700 rounded-lg">
                                <h2 className="text-sm font-bold text-white mb-3">Danger Zone</h2>
                                <button className="px-3 py-2 bg-red-900/30 border border-red-700 text-red-400 rounded-lg hover:bg-red-900/50 transition font-semibold text-xs">
                                    Delete Community
                                </button>
                                <p className="text-gray-500 text-xs mt-2">This action cannot be undone</p>
                            </div>
                        </div>
                    )}

                    {tab === 'help' && <PermissionSetupHelp />}
                </div>
            </div>
        </div>
    );
}
