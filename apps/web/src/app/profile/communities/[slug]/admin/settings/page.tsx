'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useCallback } from 'react';
import { AdminLoadingState } from '@/components/admin/AdminLoadingState';
import { EventListPageShell } from '@/components/admin/EventListPageShell';
import { EditCommunityForm } from '@/components/community/EditCommunityForm';
import { DiscordIntegrationPanel } from '@/components/admin/DiscordIntegrationPanel';
import { DiscordPermissionsGuide } from '@/components/community/DiscordPermissionsGuide';
import { useAdminPageState } from '@/hooks/useAdminPageState';
import { useCommunityData } from '@/hooks/useCommunityData';
import { useDiscordIntegration } from '@/hooks/useDiscordIntegration';
import { useRequireAuthRedirect } from '@/hooks/useRequireAuthRedirect';

export default function AdminSettingsPage() {
    const { slug } = useParams() as { slug: string };
    const router = useRouter();
    const { status } = useRequireAuthRedirect();
    const { state, dispatch } = useAdminPageState();
    const community = state.community;
    const loading = state.isLoading;
    const error = state.error;
    const toggling = state.ui.isToggling;
    const discordGuilds = state.discord.guilds;
    const showGuildSelector = state.discord.showGuildSelector;
    const loadingGuilds = state.discord.isLoadingGuilds;
    const linkingGuild = state.discord.isLinking;
    const discordChannels = state.discord.channels;
    const showChannelSelector = state.discord.showChannelSelector;
    const loadingChannels = state.discord.isLoadingChannels;
    const selectingChannel = state.discord.isSelecting;
    const discordTicketUrl = process.env.NEXT_PUBLIC_DISCORD_TICKET_URL || '';

    const fetchWhitelists = useCallback(async () => Promise.resolve(), []);
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
        return <AdminLoadingState variant="list" />;
    }

    if (error) {
        return (
            <div className="p-6 bg-red-900/20 border border-red-800 rounded-lg">
                <h1 className="text-2xl font-bold text-red-400 mb-2">Error</h1>
                <p className="text-red-300">{error}</p>
            </div>
        );
    }

    if (!community) {
        return null;
    }

    return (
        <EventListPageShell title="Community Settings" description="Manage your community configuration">
            <div className="space-y-6">
                {!community.isVerified && (
                    <div className="bg-yellow-900/20 border border-yellow-700/40 rounded-lg p-4 text-sm">
                        <div className="flex items-center justify-between flex-wrap gap-3">
                            <div>
                                <p className="text-yellow-300 font-semibold">Verification required</p>
                                <p className="text-yellow-200/80 mt-1">
                                    Communities must be manually approved. Open a Discord ticket to request
                                    verification.
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

                <div className="p-4 bg-gray-900/40 border border-gray-700 rounded-lg space-y-6">
                    <div>
                        <label className="block text-xs font-medium text-gray-300 mb-2">Public Listing</label>
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
                                        Your community is currently private. Make it public to appear on the communities
                                        list.
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
                        onCloseChannelSelector={() => dispatch({ type: 'DISCORD_CLOSE_CHANNEL_SELECTOR' })}
                    />

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

                    <div className="border-t border-gray-700 pt-4">
                        <h3 className="text-sm font-bold text-white mb-3">Community Profile</h3>
                        <p className="text-gray-400 text-xs mb-3">
                            Edit your community details, add social links, and configure your NFT collection.
                        </p>
                        <EditCommunityForm
                            community={community}
                            onSuccess={() => {
                                fetchCommunity();
                            }}
                        />
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
        </EventListPageShell>
    );
}
