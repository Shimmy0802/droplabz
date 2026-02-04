'use client';

import { useCallback } from 'react';
import type { AdminAction, Community, DiscordChannel, DiscordGuild } from '@/hooks/useAdminPageState';

interface UseDiscordIntegrationOptions {
    community: Community | null;
    dispatch: React.Dispatch<AdminAction>;
    discordGuilds: DiscordGuild[];
    discordChannels: DiscordChannel[];
    onRefreshCommunity?: () => Promise<void>;
}

export function useDiscordIntegration({
    community,
    dispatch,
    discordGuilds,
    discordChannels,
    onRefreshCommunity,
}: UseDiscordIntegrationOptions) {
    const fetchDiscordGuilds = useCallback(async () => {
        try {
            dispatch({ type: 'DISCORD_SET_GUILDS_LOADING', payload: true });
            const response = await fetch('/api/discord/guilds');

            if (!response.ok) {
                throw new Error('Failed to fetch Discord guilds');
            }

            const data = await response.json();
            dispatch({ type: 'DISCORD_SET_GUILDS', payload: data.guilds || [] });
            dispatch({ type: 'DISCORD_OPEN_GUILD_SELECTOR' });
        } catch (err) {
            console.error('Error fetching guilds:', err);
            alert(err instanceof Error ? err.message : 'Failed to fetch Discord guilds');
        } finally {
            dispatch({ type: 'DISCORD_SET_GUILDS_LOADING', payload: false });
        }
    }, [dispatch]);

    const linkGuild = useCallback(
        async (guildId: string) => {
            if (!community) return;

            try {
                dispatch({ type: 'DISCORD_LINK_GUILD_START' });
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
                dispatch({
                    type: 'DISCORD_LINK_GUILD_SUCCESS',
                    payload: {
                        guildId: result.guildId,
                        guildName: result.guildName || guildName || '',
                    },
                });

                if (onRefreshCommunity) {
                    await onRefreshCommunity();
                }
            } catch (err) {
                console.error('Error linking guild:', err);
                alert(err instanceof Error ? err.message : 'Failed to link guild');
            } finally {
                dispatch({ type: 'DISCORD_LINK_GUILD_END' });
            }
        },
        [community, dispatch, discordGuilds, onRefreshCommunity],
    );

    const unlinkGuild = useCallback(async () => {
        if (!community) return;

        try {
            dispatch({ type: 'DISCORD_LINK_GUILD_START' });
            const response = await fetch(`/api/communities?id=${community.id}&action=disconnectGuild`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Failed to unlink guild');
            }

            await response.json();
            dispatch({ type: 'DISCORD_UNLINK_GUILD_SUCCESS' });

            if (onRefreshCommunity) {
                await onRefreshCommunity();
            }
        } catch (err) {
            console.error('Error unlinking guild:', err);
            alert(err instanceof Error ? err.message : 'Failed to unlink guild');
        } finally {
            dispatch({ type: 'DISCORD_LINK_GUILD_END' });
        }
    }, [community, dispatch, onRefreshCommunity]);

    const fetchDiscordChannels = useCallback(async () => {
        if (!community?.guildId) return;

        try {
            dispatch({ type: 'DISCORD_SET_CHANNELS_LOADING', payload: true });
            const response = await fetch(`/api/discord/channels?guildId=${community.guildId}`);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const errorMsg =
                    errorData.details || errorData.error || `Failed to fetch channels (${response.status})`;
                throw new Error(errorMsg);
            }

            const data = await response.json();
            dispatch({ type: 'DISCORD_OPEN_CHANNEL_SELECTOR', payload: data.channels || [] });
        } catch (err) {
            console.error('Error fetching channels:', err);
            const message = err instanceof Error ? err.message : 'Failed to fetch Discord channels';
            alert(
                `Error: ${message}\n\nMake sure you're logged in with Discord OAuth and the bot has access to your server.`,
            );
        } finally {
            dispatch({ type: 'DISCORD_SET_CHANNELS_LOADING', payload: false });
        }
    }, [community, dispatch]);

    const setAnnouncementChannel = useCallback(
        async (channelId: string) => {
            if (!community) return;

            try {
                dispatch({ type: 'DISCORD_SELECT_CHANNEL_START' });
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
                dispatch({
                    type: 'DISCORD_SELECT_CHANNEL_SUCCESS',
                    payload: {
                        channelId: result.channelId,
                        channelName: result.channelName || channelName || '',
                    },
                });

                if (onRefreshCommunity) {
                    await onRefreshCommunity();
                }
            } catch (err) {
                console.error('Error setting channel:', err);
                alert(err instanceof Error ? err.message : 'Failed to set announcement channel');
            } finally {
                dispatch({ type: 'DISCORD_SELECT_CHANNEL_END' });
            }
        },
        [community, dispatch, discordChannels, onRefreshCommunity],
    );

    return {
        fetchDiscordGuilds,
        linkGuild,
        unlinkGuild,
        fetchDiscordChannels,
        setAnnouncementChannel,
    };
}
