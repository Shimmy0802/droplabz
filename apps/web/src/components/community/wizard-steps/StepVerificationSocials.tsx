'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { WizardData, WizardErrors } from '@/hooks/useCommunityWizard';
import { SetupVerificationPanel } from '@/components/community/SetupVerificationPanel';
import { PermissionSetupGuide } from '@/components/community/PermissionSetupGuide';

interface StepVerificationSocialsProps {
    data: WizardData;
    errors: WizardErrors;
    onUpdate: (updates: Partial<WizardData>) => void;
    clearError: (field: string) => void;
}

export default function StepVerificationSocials({ data, errors, onUpdate, clearError }: StepVerificationSocialsProps) {
    const botInviteUrl = process.env.NEXT_PUBLIC_DISCORD_BOT_INVITE_URL;
    const [channels, setChannels] = useState<Array<{ id: string; name: string; parentId?: string }>>([]);
    const [isLoadingChannels, setIsLoadingChannels] = useState(false);
    const [channelError, setChannelError] = useState<string | null>(null);
    const [isCreatingTemplate, setIsCreatingTemplate] = useState(false);
    const [templateError, setTemplateError] = useState<string | null>(null);
    const [templateCreatedSuccess, setTemplateCreatedSuccess] = useState(false);

    const fetchChannels = useCallback(async () => {
        if (!data.discordGuildId) {
            setChannels([]);
            return;
        }

        try {
            setIsLoadingChannels(true);
            setChannelError(null);
            const response = await fetch(`/api/discord/channels?guildId=${data.discordGuildId}`);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.details || errorData.error || 'Failed to fetch channels');
            }

            const result = await response.json();
            setChannels(result.channels || []);
        } catch (error) {
            console.error('Error fetching Discord channels:', error);
            setChannelError(error instanceof Error ? error.message : 'Failed to fetch channels');
        } finally {
            setIsLoadingChannels(false);
        }
    }, [data.discordGuildId]);

    useEffect(() => {
        fetchChannels();
    }, [data.discordGuildId]);

    const handleCreateTemplate = async () => {
        if (!data.discordGuildId) return;

        try {
            setIsCreatingTemplate(true);
            setTemplateError(null);
            const response = await fetch('/api/discord/setup-channels', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ guildId: data.discordGuildId }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.details || errorData.error || 'Failed to create template channels');
            }

            const result = await response.json();
            const templateChannels = result.channels || [];

            const announcement = templateChannels.find((c: any) => c.key === 'announcements');
            const giveaways = templateChannels.find((c: any) => c.key === 'giveaways');
            const giveawayEntries = templateChannels.find((c: any) => c.key === 'giveaway-entries');
            const winners = templateChannels.find((c: any) => c.key === 'winners');
            const admin = templateChannels.find((c: any) => c.key === 'admin');

            if (announcement?.id) {
                onUpdate({ discordAnnouncementChannelId: announcement.id });
                clearError('discordAnnouncementChannelId');
            }
            if (giveaways?.id) {
                onUpdate({ discordGiveawayChannelId: giveaways.id });
                clearError('discordGiveawayChannelId');
            }
            if (giveawayEntries?.id) {
                onUpdate({ discordGiveawayEntryChannelId: giveawayEntries.id });
                clearError('discordGiveawayEntryChannelId');
            }
            if (winners?.id) {
                onUpdate({ discordWinnerChannelId: winners.id });
                clearError('discordWinnerChannelId');
            }
            if (admin?.id) {
                onUpdate({ discordAdminChannelId: admin.id });
                clearError('discordAdminChannelId');
            }

            setTemplateCreatedSuccess(true);
            await fetchChannels();
        } catch (error) {
            console.error('Error creating channel template:', error);
            setTemplateError(error instanceof Error ? error.message : 'Failed to create channels');
            setTemplateCreatedSuccess(false);
        } finally {
            setIsCreatingTemplate(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <h2 className="text-2xl font-bold text-white">Verification & Socials</h2>
                <p className="text-gray-400">Connect your Discord server and configure channel permissions</p>
            </div>

            {/* Discord Server Setup - Enhanced Styling */}
            <div className="relative overflow-hidden rounded-lg border border-green-500/30 bg-gradient-to-br from-gray-900/90 via-gray-800/80 to-gray-900/90 p-6 shadow-lg">
                {/* Decorative glow effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-green-500/0 via-green-500/5 to-green-500/0 pointer-events-none"></div>

                <div className="relative z-10 flex items-start gap-4">
                    <div className="flex-shrink-0">
                        <div className="flex items-center justify-center h-12 w-12 rounded-lg border border-white/10 bg-transparent">
                            <img src="https://cdn.simpleicons.org/discord/5865F2" alt="Discord" className="h-7 w-7" />
                        </div>
                    </div>
                    <div className="flex-1">
                        {data.discordGuildId ? (
                            /* Connected State */
                            <div>
                                <div className="flex items-center gap-3">
                                    <h3 className="text-xl font-bold text-white">Discord Server Connected</h3>
                                    <span className="text-2xl">✅</span>
                                </div>
                                <p className="text-gray-300 text-sm mt-2 font-mono">{data.discordGuildId}</p>
                            </div>
                        ) : (
                            /* Not Connected State */
                            <div>
                                <h3 className="text-xl font-bold text-white mb-2">Discord Server Setup</h3>
                                <p className="text-gray-300 text-sm mb-4">
                                    Connect your Discord server to enable bot integration and role-based channel access.
                                    The bot needs permissions to manage channels, roles, and send announcements.
                                </p>

                                {/* Bot Invite Button */}
                                <div className="flex flex-wrap items-center gap-3 mb-4">
                                    <a
                                        href={botInviteUrl || '#'}
                                        target="_blank"
                                        rel="noreferrer"
                                        className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${
                                            botInviteUrl
                                                ? 'bg-gradient-to-r from-green-500 to-green-600 text-black hover:from-green-400 hover:to-green-500 shadow-lg shadow-green-500/50'
                                                : 'cursor-not-allowed bg-gray-700 text-gray-400'
                                        }`}
                                        aria-disabled={!botInviteUrl}
                                        onClick={e => {
                                            if (!botInviteUrl) {
                                                e.preventDefault();
                                            }
                                        }}
                                    >
                                        Add DropLabz Bot
                                    </a>
                                    <span className="text-xs text-gray-400">Opens Discord's bot authorization</span>
                                </div>

                                {/* Guild ID Display */}
                                <div className="mb-4">
                                    <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Guild ID</p>
                                    <div className="rounded-lg border border-gray-700 bg-gray-900/50 px-4 py-3 text-sm text-gray-200 font-mono">
                                        Not connected yet
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Auto-filled when you add the bot to your server.
                                    </p>
                                </div>

                                {errors.discordGuildId && (
                                    <p className="text-red-500 text-sm mb-4">{errors.discordGuildId}</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Channel Mode Selection */}
            {data.discordGuildId && (
                <div className="border border-cyan-500/30 rounded-lg p-6 bg-gray-800/40">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="h-1 w-8 bg-gradient-to-r from-cyan-500 to-green-500 rounded-full"></div>
                        <h3 className="text-lg font-semibold text-white">Step 2: Channel Configuration</h3>
                    </div>
                    <p className="text-gray-300 text-sm mb-4">Choose how you want to set up your Discord channels.</p>

                    {/* Radio Buttons for Channel Mode */}
                    <div className="space-y-3 mb-6">
                        {/* Premade Option */}
                        <label
                            className="flex items-start gap-4 cursor-pointer p-4 border border-gray-700 rounded-lg hover:bg-gray-800/50 transition"
                            style={{
                                backgroundColor:
                                    data.discordChannelMode === 'premade' ? 'rgba(0, 255, 65, 0.05)' : 'transparent',
                            }}
                        >
                            <input
                                type="radio"
                                name="channelMode"
                                value="premade"
                                checked={data.discordChannelMode === 'premade'}
                                onChange={() => onUpdate({ discordChannelMode: 'premade' })}
                                className="mt-1 w-4 h-4 bg-gray-700 border-gray-600 text-green-500 focus:ring-2 focus:ring-green-500"
                            />
                            <div className="flex-1">
                                <p className="font-semibold text-white mb-1">Use Premade DropLabz Channels</p>
                                <p className="text-sm text-gray-400">
                                    We'll create a category with channels for announcements, giveaways, entries, and
                                    winners. Fast and simple.
                                </p>
                            </div>
                        </label>

                        {/* Custom Option */}
                        <label
                            className="flex items-start gap-4 cursor-pointer p-4 border border-gray-700 rounded-lg hover:bg-gray-800/50 transition"
                            style={{
                                backgroundColor:
                                    data.discordChannelMode === 'custom' ? 'rgba(0, 212, 255, 0.05)' : 'transparent',
                            }}
                        >
                            <input
                                type="radio"
                                name="channelMode"
                                value="custom"
                                checked={data.discordChannelMode === 'custom'}
                                onChange={() => onUpdate({ discordChannelMode: 'custom' })}
                                className="mt-1 w-4 h-4 bg-gray-700 border-gray-600 text-cyan-500 focus:ring-2 focus:ring-cyan-500"
                            />
                            <div className="flex-1">
                                <p className="font-semibold text-white mb-1">Use My Own Channels</p>
                                <p className="text-sm text-gray-400">
                                    Select existing channels from your server. More control over where the bot posts.
                                </p>
                            </div>
                        </label>
                    </div>

                    {/* Conditional UI based on mode */}
                    {data.discordChannelMode === 'premade' ? (
                        <div className="space-y-4">
                            {!templateCreatedSuccess && (
                                <button
                                    type="button"
                                    onClick={handleCreateTemplate}
                                    disabled={!data.discordGuildId || isCreatingTemplate}
                                    className="w-full rounded-lg bg-gradient-to-r from-green-500 to-green-600 px-4 py-3 text-black font-semibold text-sm hover:from-green-400 hover:to-green-500 disabled:cursor-not-allowed disabled:opacity-50 transition shadow-lg shadow-green-500/50"
                                >
                                    {isCreatingTemplate ? 'Creating Channels...' : '✨ Create DropLabz Channels'}
                                </button>
                            )}
                            {templateCreatedSuccess && (
                                <div className="p-4 rounded-lg bg-green-900/20 border border-green-700/50">
                                    <p className="text-green-300 font-semibold flex items-center gap-2">
                                        ✅ Channels created successfully!
                                    </p>
                                </div>
                            )}
                            {templateError && <p className="text-red-500 text-sm">{templateError}</p>}
                            {!templateCreatedSuccess && (
                                <p className="text-xs text-gray-500">
                                    Creates: #announcements, #giveaways, #giveaway-entries, #winners, #droplabz-admin
                                </p>
                            )}

                            {/* Permission Setup Instructions - Only show after successful creation */}
                            {templateCreatedSuccess && (
                                <div className="mt-6 space-y-3">
                                    <h4 className="font-semibold text-white text-sm flex items-center gap-2">
                                        📋 Next: Set Channel Permissions
                                    </h4>
                                    <p className="text-sm text-gray-300">
                                        Your channels are ready! Now configure permissions in Discord. The DropLabz bot
                                        only creates channels—you control who can access them.
                                    </p>
                                    <PermissionSetupGuide />
                                    <div className="bg-cyan-900/20 border border-cyan-700/50 rounded p-3 mt-3">
                                        <p className="text-xs text-cyan-300">
                                            💡 <strong className="text-white">Bookmark this:</strong> Save a link to the
                                            Permission Guide in your admin dashboard for future reference.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <p className="text-sm text-gray-400 mb-3">
                                Select your existing channels (all 5 required):
                            </p>
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-white">Announcement Channel</label>
                                    <select
                                        value={data.discordAnnouncementChannelId}
                                        onChange={e => {
                                            onUpdate({ discordAnnouncementChannelId: e.target.value });
                                            clearError('discordAnnouncementChannelId');
                                        }}
                                        disabled={!data.discordGuildId || isLoadingChannels}
                                        className="w-full px-4 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white focus:border-cyan-500 focus:outline-none transition text-sm disabled:opacity-50"
                                    >
                                        <option value="">
                                            {data.discordGuildId
                                                ? isLoadingChannels
                                                    ? 'Loading...'
                                                    : 'Select a channel'
                                                : 'Connect a server first'}
                                        </option>
                                        {channels.map(channel => (
                                            <option key={channel.id} value={channel.id}>
                                                #{channel.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-white">Giveaway Channel</label>
                                    <select
                                        value={data.discordGiveawayChannelId}
                                        onChange={e => {
                                            onUpdate({ discordGiveawayChannelId: e.target.value });
                                            clearError('discordGiveawayChannelId');
                                        }}
                                        disabled={!data.discordGuildId || isLoadingChannels}
                                        className="w-full px-4 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white focus:border-cyan-500 focus:outline-none transition text-sm disabled:opacity-50"
                                    >
                                        <option value="">
                                            {data.discordGuildId
                                                ? isLoadingChannels
                                                    ? 'Loading...'
                                                    : 'Select a channel'
                                                : 'Connect a server first'}
                                        </option>
                                        {channels.map(channel => (
                                            <option key={channel.id} value={channel.id}>
                                                #{channel.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-white">
                                        Giveaway Entry Channel
                                    </label>
                                    <select
                                        value={data.discordGiveawayEntryChannelId}
                                        onChange={e => {
                                            onUpdate({ discordGiveawayEntryChannelId: e.target.value });
                                            clearError('discordGiveawayEntryChannelId');
                                        }}
                                        disabled={!data.discordGuildId || isLoadingChannels}
                                        className="w-full px-4 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white focus:border-cyan-500 focus:outline-none transition text-sm disabled:opacity-50"
                                    >
                                        <option value="">
                                            {data.discordGuildId
                                                ? isLoadingChannels
                                                    ? 'Loading...'
                                                    : 'Select a channel'
                                                : 'Connect a server first'}
                                        </option>
                                        {channels.map(channel => (
                                            <option key={channel.id} value={channel.id}>
                                                #{channel.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-white">Winner Channel</label>
                                    <select
                                        value={data.discordWinnerChannelId}
                                        onChange={e => {
                                            onUpdate({ discordWinnerChannelId: e.target.value });
                                            clearError('discordWinnerChannelId');
                                        }}
                                        disabled={!data.discordGuildId || isLoadingChannels}
                                        className="w-full px-4 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white focus:border-cyan-500 focus:outline-none transition text-sm disabled:opacity-50"
                                    >
                                        <option value="">
                                            {data.discordGuildId
                                                ? isLoadingChannels
                                                    ? 'Loading...'
                                                    : 'Select a channel'
                                                : 'Connect a server first'}
                                        </option>
                                        {channels.map(channel => (
                                            <option key={channel.id} value={channel.id}>
                                                #{channel.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <label className="block text-sm font-medium text-white">Admin Channel</label>
                                    <select
                                        value={data.discordAdminChannelId}
                                        onChange={e => {
                                            onUpdate({ discordAdminChannelId: e.target.value });
                                            clearError('discordAdminChannelId');
                                        }}
                                        disabled={!data.discordGuildId || isLoadingChannels}
                                        className="w-full px-4 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white focus:border-cyan-500 focus:outline-none transition text-sm disabled:opacity-50"
                                    >
                                        <option value="">
                                            {data.discordGuildId
                                                ? isLoadingChannels
                                                    ? 'Loading...'
                                                    : 'Select a channel'
                                                : 'Connect a server first'}
                                        </option>
                                        {channels.map(channel => (
                                            <option key={channel.id} value={channel.id}>
                                                #{channel.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            {channelError && <p className="text-red-500 text-sm">{channelError}</p>}
                        </div>
                    )}
                </div>
            )}

            {/* Setup Verification Status */}
            {data.discordGuildId && (
                <div className="border border-yellow-500/30 rounded-lg p-6 bg-gradient-to-br from-yellow-900/10 via-gray-800/40 to-gray-800/40">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="h-1 w-8 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full"></div>
                        <h3 className="text-lg font-semibold text-white">Setup Status</h3>
                    </div>
                    <p className="text-gray-300 text-sm mb-4">
                        Complete verification of your Discord setup. Ensure all channels are properly configured and
                        gated.
                    </p>
                    <SetupVerificationPanel
                        key={
                            templateCreatedSuccess
                                ? `verified-${data.discordGuildId}`
                                : `unverified-${data.discordGuildId}`
                        }
                        guildId={data.discordGuildId}
                    />
                </div>
            )}

            {/* Twitter Section */}
            <div className="border border-gray-700 rounded-lg p-6 bg-gray-800/40">
                <div className="flex items-center gap-3 mb-4">
                    <div className="h-10 w-10 rounded-lg border border-white/10 bg-transparent flex items-center justify-center">
                        <img src="https://cdn.simpleicons.org/x/ffffff" alt="X" className="h-5 w-5" />
                    </div>
                    <h3 className="text-lg font-semibold text-white">X (Twitter) Account (Optional)</h3>
                </div>
                <p className="text-gray-400 text-sm mb-4">
                    Connect your X account to enable Twitter-based requirements and entry options.
                </p>
                <div className="space-y-2">
                    <p className="text-sm text-gray-300">
                        <strong>X Handle (Optional):</strong>
                    </p>
                    <input
                        type="text"
                        value={data.twitterHandle}
                        onChange={e => {
                            const handle = e.target.value.replace('@', '');
                            onUpdate({ twitterHandle: handle });
                            clearError('twitterHandle');
                        }}
                        placeholder="yourhandle"
                        className="w-full px-4 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none transition text-sm"
                    />
                    {errors.twitterHandle && <p className="text-red-500 text-sm mt-2">{errors.twitterHandle}</p>}
                </div>
            </div>

            {/* Skip Option */}
            <div className="border-t border-gray-700 pt-6">
                <label className="flex items-center gap-3 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={data.skipVerification}
                        onChange={e => {
                            onUpdate({ skipVerification: e.target.checked });
                        }}
                        className="w-5 h-5 rounded bg-gray-700 border-gray-600 text-green-500 focus:ring-2 focus:ring-green-500"
                    />
                    <span className="text-white font-medium">Skip Discord Setup for Now</span>
                </label>
                <p className="text-gray-400 text-sm mt-2">
                    You can configure Discord later in your community settings.
                </p>
            </div>

            <div className="bg-cyan-900/20 border border-cyan-700/50 rounded-lg p-4">
                <p className="text-cyan-300 text-sm">
                    ✨ <span className="font-semibold">Tip:</span> Complete all steps to fully set up your Discord
                    integration. You can always modify settings later.
                </p>
            </div>
        </div>
    );
}
