'use client';

/**
 * useAdminPageState Hook
 *
 * Manages all state for the community admin page using useReducer.
 * Consolidates 24 useState calls into a single, coordinated reducer.
 *
 * Usage:
 * const { state, dispatch } = useAdminPageState();
 * dispatch({ type: 'SET_TAB', payload: 'whitelists' });
 */

import { useReducer } from 'react';

// Types
export interface Community {
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
    categories: string[];
    socials: {
        twitter?: string | null;
        discord?: string | null;
        website?: string | null;
        instagram?: string | null;
    } | null;
    _count: {
        members: number;
    };
    isVerified: boolean;
    verificationStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
    verificationTicketId: string | null;
    verificationRequestedAt: string | null;
}

export interface DiscordGuild {
    id: string;
    name: string;
    icon: string | null;
    owner: boolean;
    permissions: number;
}

export interface DiscordChannel {
    id: string;
    name: string;
}

export interface Whitelist {
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

export type TabType = 'overview' | 'whitelists' | 'giveaways' | 'presales' | 'members' | 'settings' | 'help';

// State Shape
export interface AdminPageState {
    // Navigation
    tab: TabType;

    // Core data
    community: Community | null;
    error: string | null;
    isLoading: boolean;

    // Discord integration
    discord: {
        guilds: DiscordGuild[];
        channels: DiscordChannel[];
        showGuildSelector: boolean;
        showChannelSelector: boolean;
        isLoadingGuilds: boolean;
        isLoadingChannels: boolean;
        isLinking: boolean;
        isSelecting: boolean;
    };

    // Whitelist management
    whitelists: {
        items: Whitelist[];
        isLoading: boolean;
        showCreate: boolean;
    };

    // UI state
    ui: {
        isToggling: boolean;
    };
}

// Action Types
export type AdminAction =
    | { type: 'SET_TAB'; payload: TabType }
    | { type: 'SET_COMMUNITY'; payload: Community }
    | { type: 'SET_LOADING'; payload: boolean }
    | { type: 'SET_ERROR'; payload: string | null }
    | { type: 'DISCORD_OPEN_GUILD_SELECTOR' }
    | { type: 'DISCORD_CLOSE_GUILD_SELECTOR' }
    | { type: 'DISCORD_SET_GUILDS'; payload: DiscordGuild[] }
    | { type: 'DISCORD_SET_GUILDS_LOADING'; payload: boolean }
    | { type: 'DISCORD_LINK_GUILD_START' }
    | { type: 'DISCORD_LINK_GUILD_SUCCESS'; payload: { guildId: string; guildName: string } }
    | { type: 'DISCORD_LINK_GUILD_END' }
    | { type: 'DISCORD_UNLINK_GUILD_SUCCESS' }
    | { type: 'DISCORD_OPEN_CHANNEL_SELECTOR'; payload: DiscordChannel[] }
    | { type: 'DISCORD_CLOSE_CHANNEL_SELECTOR' }
    | { type: 'DISCORD_SET_CHANNELS_LOADING'; payload: boolean }
    | { type: 'DISCORD_SELECT_CHANNEL_START' }
    | { type: 'DISCORD_SELECT_CHANNEL_SUCCESS'; payload: { channelId: string; channelName: string } }
    | { type: 'DISCORD_SELECT_CHANNEL_END' }
    | { type: 'WHITELISTS_SET'; payload: Whitelist[] }
    | { type: 'WHITELISTS_SET_LOADING'; payload: boolean }
    | { type: 'WHITELISTS_SHOW_CREATE' }
    | { type: 'WHITELISTS_HIDE_CREATE' }
    | { type: 'UI_START_TOGGLE' }
    | { type: 'UI_END_TOGGLE' }
    | { type: 'RESET' };

// Initial State
const initialState: AdminPageState = {
    tab: 'overview',
    community: null,
    error: null,
    isLoading: true,
    discord: {
        guilds: [],
        channels: [],
        showGuildSelector: false,
        showChannelSelector: false,
        isLoadingGuilds: false,
        isLoadingChannels: false,
        isLinking: false,
        isSelecting: false,
    },
    whitelists: {
        items: [],
        isLoading: false,
        showCreate: false,
    },
    ui: {
        isToggling: false,
    },
};

// Reducer
function adminPageReducer(state: AdminPageState, action: AdminAction): AdminPageState {
    switch (action.type) {
        // Navigation
        case 'SET_TAB':
            return { ...state, tab: action.payload };

        // Core data
        case 'SET_COMMUNITY':
            return { ...state, community: action.payload };

        case 'SET_LOADING':
            return { ...state, isLoading: action.payload };

        case 'SET_ERROR':
            return { ...state, error: action.payload };

        // Discord: Guild selection
        case 'DISCORD_OPEN_GUILD_SELECTOR':
            return {
                ...state,
                discord: { ...state.discord, showGuildSelector: true },
            };

        case 'DISCORD_CLOSE_GUILD_SELECTOR':
            return {
                ...state,
                discord: { ...state.discord, showGuildSelector: false },
            };

        case 'DISCORD_SET_GUILDS':
            return {
                ...state,
                discord: { ...state.discord, guilds: action.payload },
            };

        case 'DISCORD_SET_GUILDS_LOADING':
            return {
                ...state,
                discord: { ...state.discord, isLoadingGuilds: action.payload },
            };

        case 'DISCORD_LINK_GUILD_START':
            return {
                ...state,
                discord: { ...state.discord, isLinking: true },
            };

        case 'DISCORD_LINK_GUILD_SUCCESS':
            return {
                ...state,
                community: state.community
                    ? {
                          ...state.community,
                          guildId: action.payload.guildId,
                          discordGuildName: action.payload.guildName,
                      }
                    : null,
                discord: {
                    ...state.discord,
                    isLinking: false,
                    showGuildSelector: false,
                },
            };

        case 'DISCORD_LINK_GUILD_END':
            return {
                ...state,
                discord: { ...state.discord, isLinking: false },
            };

        case 'DISCORD_UNLINK_GUILD_SUCCESS':
            return {
                ...state,
                community: state.community
                    ? {
                          ...state.community,
                          guildId: null,
                          discordGuildName: null,
                          discordAnnouncementChannelId: null,
                          discordAnnouncementChannelName: null,
                      }
                    : null,
                discord: {
                    ...state.discord,
                    isLinking: false,
                },
            };

        // Discord: Channel selection
        case 'DISCORD_OPEN_CHANNEL_SELECTOR':
            return {
                ...state,
                discord: {
                    ...state.discord,
                    channels: action.payload,
                    showChannelSelector: true,
                },
            };

        case 'DISCORD_CLOSE_CHANNEL_SELECTOR':
            return {
                ...state,
                discord: { ...state.discord, showChannelSelector: false },
            };

        case 'DISCORD_SET_CHANNELS_LOADING':
            return {
                ...state,
                discord: { ...state.discord, isLoadingChannels: action.payload },
            };

        case 'DISCORD_SELECT_CHANNEL_START':
            return {
                ...state,
                discord: { ...state.discord, isSelecting: true },
            };

        case 'DISCORD_SELECT_CHANNEL_SUCCESS':
            return {
                ...state,
                community: state.community
                    ? {
                          ...state.community,
                          discordAnnouncementChannelId: action.payload.channelId,
                          discordAnnouncementChannelName: action.payload.channelName,
                      }
                    : null,
                discord: {
                    ...state.discord,
                    isSelecting: false,
                    showChannelSelector: false,
                },
            };

        case 'DISCORD_SELECT_CHANNEL_END':
            return {
                ...state,
                discord: { ...state.discord, isSelecting: false },
            };

        // Whitelists
        case 'WHITELISTS_SET':
            return {
                ...state,
                whitelists: { ...state.whitelists, items: action.payload },
            };

        case 'WHITELISTS_SET_LOADING':
            return {
                ...state,
                whitelists: { ...state.whitelists, isLoading: action.payload },
            };

        case 'WHITELISTS_SHOW_CREATE':
            return {
                ...state,
                whitelists: { ...state.whitelists, showCreate: true },
            };

        case 'WHITELISTS_HIDE_CREATE':
            return {
                ...state,
                whitelists: { ...state.whitelists, showCreate: false },
            };

        // UI
        case 'UI_START_TOGGLE':
            return {
                ...state,
                ui: { ...state.ui, isToggling: true },
            };

        case 'UI_END_TOGGLE':
            return {
                ...state,
                ui: { ...state.ui, isToggling: false },
            };

        // Reset
        case 'RESET':
            return initialState;

        default:
            return state;
    }
}

// Hook
export function useAdminPageState() {
    const [state, dispatch] = useReducer(adminPageReducer, initialState);

    return { state, dispatch };
}
