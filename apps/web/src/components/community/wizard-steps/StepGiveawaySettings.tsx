'use client';

import React, { useEffect, useState } from 'react';
import { WizardData, WizardErrors } from '@/hooks/useCommunityWizard';

interface StepGiveawaySettingsProps {
    data: WizardData;
    errors: WizardErrors;
    onUpdate: (updates: Partial<WizardData>) => void;
    clearError: (field: string) => void;
}

const ENTRY_REQUIREMENTS = [
    { id: 'follow_account', label: 'Follow Account' },
    { id: 'like_tweet', label: 'Like Tweet' },
    { id: 'retweet', label: 'Retweet' },
    { id: 'quote_tweet', label: 'Quote Tweet' },
    { id: 'tag_friend', label: 'Tag a Friend' },
];

export default function StepGiveawaySettings({ data, errors, onUpdate, clearError }: StepGiveawaySettingsProps) {
    const [roles, setRoles] = useState<Array<{ id: string; name: string }>>([]);
    const [isLoadingRoles, setIsLoadingRoles] = useState(false);
    const [roleError, setRoleError] = useState<string | null>(null);
    const [newRoleName, setNewRoleName] = useState('');
    const [isCreatingRole, setIsCreatingRole] = useState(false);
    const [channels, setChannels] = useState<Array<{ id: string; name: string }>>([]);
    const [isLoadingChannels, setIsLoadingChannels] = useState(false);
    const [channelError, setChannelError] = useState<string | null>(null);

    useEffect(() => {
        const fetchRoles = async () => {
            if (!data.discordGuildId) {
                setRoles([]);
                return;
            }

            try {
                setIsLoadingRoles(true);
                setRoleError(null);
                const response = await fetch(`/api/discord/roles?guildId=${data.discordGuildId}`);

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.details || errorData.error || 'Failed to fetch roles');
                }

                const result = await response.json();
                setRoles(result.roles || []);
            } catch (error) {
                console.error('Error fetching Discord roles:', error);
                setRoleError(error instanceof Error ? error.message : 'Failed to fetch roles');
            } finally {
                setIsLoadingRoles(false);
            }
        };

        fetchRoles();
    }, [data.discordGuildId]);

    useEffect(() => {
        const fetchChannels = async () => {
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
        };

        fetchChannels();
    }, [data.discordGuildId]);

    const toggleRole = (roleId: string) => {
        const updated = data.giveawayRoles.includes(roleId)
            ? data.giveawayRoles.filter(r => r !== roleId)
            : [...data.giveawayRoles, roleId];
        onUpdate({ giveawayRoles: updated });
        clearError('giveawayRoles');
    };

    const handleCreateRole = async () => {
        if (!data.discordGuildId || !newRoleName.trim()) return;

        try {
            setIsCreatingRole(true);
            setRoleError(null);
            const response = await fetch('/api/discord/roles', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ guildId: data.discordGuildId, name: newRoleName.trim() }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.details || errorData.error || 'Failed to create role');
            }

            const result = await response.json();
            const createdRole = result.role;

            setRoles(prev => [...prev, createdRole].sort((a, b) => a.name.localeCompare(b.name)));
            setNewRoleName('');
        } catch (error) {
            console.error('Error creating role:', error);
            setRoleError(error instanceof Error ? error.message : 'Failed to create role');
        } finally {
            setIsCreatingRole(false);
        }
    };

    const toggleRequirement = (reqId: string) => {
        const updated = data.giveawayEntryRequirements.includes(reqId)
            ? data.giveawayEntryRequirements.filter(r => r !== reqId)
            : [...data.giveawayEntryRequirements, reqId];
        onUpdate({ giveawayEntryRequirements: updated });
        clearError('giveawayEntryRequirements');
    };

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <h2 className="text-2xl font-bold text-white">Giveaway Settings</h2>
                <p className="text-gray-400">Configure default giveaway features (optional)</p>
            </div>

            {/* Enable Giveaways */}
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <input
                        type="checkbox"
                        checked={data.enableGiveaways}
                        onChange={e => {
                            onUpdate({ enableGiveaways: e.target.checked });
                            clearError('enableGiveaways');
                        }}
                        className="w-5 h-5 rounded bg-gray-700 border-gray-600 text-green-500 focus:ring-2 focus:ring-green-500"
                    />
                    <label className="text-white font-semibold">Enable Giveaway Features</label>
                </div>
                <p className="text-gray-400 text-sm">
                    Enable this to allow running giveaways and contests with your community.
                </p>
            </div>

            {data.enableGiveaways && (
                <div className="space-y-6 bg-gray-800/30 border border-gray-700 rounded-lg p-4 shadow-[0_0_20px_rgba(0,212,255,0.08)]">
                    {/* Holder Rules */}
                    <div className="space-y-3">
                        <label className="block text-sm font-medium text-white">Holder Rules</label>
                        <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                            {[
                                { id: 'NONE', label: 'No requirement' },
                                { id: 'ANY_HOLDER', label: 'Any NFT holder' },
                                { id: 'SPECIFIC_ROLE', label: 'Specific roles only' },
                            ].map(option => (
                                <button
                                    key={option.id}
                                    type="button"
                                    onClick={() => {
                                        onUpdate({ giveawayHolderRules: option.id as 'NONE' | 'ANY_HOLDER' | 'SPECIFIC_ROLE' });
                                        clearError('giveawayHolderRules');
                                    }}
                                    className={`rounded-lg border px-3 py-2 text-sm transition ${
                                        data.giveawayHolderRules === option.id
                                            ? 'border-green-400 bg-green-500/20 text-green-300'
                                            : 'border-gray-700 bg-gray-800 text-gray-300 hover:border-blue-500'
                                    }`}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                        {errors.giveawayHolderRules && (
                            <p className="text-red-500 text-sm">{errors.giveawayHolderRules}</p>
                        )}
                    </div>

                    {/* Giveaway Roles */}
                    {data.giveawayHolderRules === 'SPECIFIC_ROLE' && (
                        <div className="space-y-3">
                            <label className="block text-sm font-medium text-white">Discord Roles for Giveaway</label>
                            {!data.discordGuildId && (
                                <p className="text-xs text-yellow-300">Connect your Discord server to load roles.</p>
                            )}
                            <div className="flex flex-wrap items-center gap-2">
                                <input
                                    type="text"
                                    value={newRoleName}
                                    onChange={e => setNewRoleName(e.target.value)}
                                    placeholder="Create new role"
                                    disabled={!data.discordGuildId || isCreatingRole}
                                    className="flex-1 min-w-[180px] px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none transition text-sm disabled:opacity-50"
                                />
                                <button
                                    type="button"
                                    onClick={handleCreateRole}
                                    disabled={!data.discordGuildId || isCreatingRole || !newRoleName.trim()}
                                    className="px-3 py-2 rounded-lg bg-blue-500 text-black font-semibold hover:bg-blue-400 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm"
                                >
                                    {isCreatingRole ? 'Creating...' : 'Create Role'}
                                </button>
                            </div>
                            <div className="space-y-2">
                                {roles.map(role => (
                                    <label
                                        key={role.id}
                                        className="flex items-center gap-3 cursor-pointer hover:bg-gray-700/50 p-2 rounded transition"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={data.giveawayRoles.includes(role.id)}
                                            onChange={() => toggleRole(role.id)}
                                            disabled={isLoadingRoles || !data.discordGuildId}
                                            className="w-4 h-4 rounded bg-gray-700 border-gray-600 text-green-500 focus:ring-2 focus:ring-green-500 disabled:opacity-50"
                                        />
                                        <span className="text-gray-300">{role.name}</span>
                                    </label>
                                ))}
                            </div>
                            {roleError && <p className="text-red-500 text-sm">{roleError}</p>}
                            {errors.giveawayRoles && <p className="text-red-500 text-sm">{errors.giveawayRoles}</p>}
                        </div>
                    )}

                    {/* Entry Requirements */}
                    <div className="space-y-3">
                        <label className="block text-sm font-medium text-white">
                            Entry Requirements (What users must do to enter)
                        </label>
                        <p className="text-sm text-gray-400">Select the actions users must complete to be eligible:</p>
                        <div className="flex flex-wrap gap-2">
                            {ENTRY_REQUIREMENTS.map(req => {
                                const isSelected = data.giveawayEntryRequirements.includes(req.id);
                                return (
                                    <button
                                        key={req.id}
                                        type="button"
                                        onClick={() => toggleRequirement(req.id)}
                                        className={`rounded-full border px-3 py-1 text-sm transition ${
                                            isSelected
                                                ? 'border-blue-400 bg-blue-500/20 text-blue-200'
                                                : 'border-gray-700 bg-gray-800 text-gray-300 hover:border-blue-500'
                                        }`}
                                    >
                                        {req.label}
                                    </button>
                                );
                            })}
                        </div>
                        {errors.giveawayEntryRequirements && (
                            <p className="text-red-500 text-sm">{errors.giveawayEntryRequirements}</p>
                        )}
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        {/* Announcement Channels */}
                        <div className="space-y-3">
                            <label className="block text-sm font-medium text-white">Announcement Channel</label>
                            <select
                                value={data.giveawayAnnouncementChannel}
                                onChange={e => {
                                    onUpdate({ giveawayAnnouncementChannel: e.target.value });
                                    clearError('giveawayAnnouncementChannel');
                                }}
                                disabled={!data.discordGuildId || isLoadingChannels}
                                className="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white focus:border-green-500 focus:outline-none transition text-sm disabled:opacity-50"
                            >
                                <option value="">
                                    {data.discordGuildId
                                        ? isLoadingChannels
                                            ? 'Loading channels...'
                                            : 'Select a channel'
                                        : 'Connect a server first'}
                                </option>
                                {channels.map(channel => (
                                    <option key={channel.id} value={channel.id}>
                                        #{channel.name}
                                    </option>
                                ))}
                            </select>
                            <p className="text-xs text-gray-500">
                                Optional: You can add this later in your community settings.
                            </p>
                        </div>

                        {/* Entry Channel */}
                        <div className="space-y-3">
                            <label className="block text-sm font-medium text-white">Entry Channel</label>
                            <select
                                value={data.giveawayEntryChannel}
                                onChange={e => {
                                    onUpdate({ giveawayEntryChannel: e.target.value });
                                    clearError('giveawayEntryChannel');
                                }}
                                disabled={!data.discordGuildId || isLoadingChannels}
                                className="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white focus:border-green-500 focus:outline-none transition text-sm disabled:opacity-50"
                            >
                                <option value="">
                                    {data.discordGuildId
                                        ? isLoadingChannels
                                            ? 'Loading channels...'
                                            : 'Select a channel'
                                        : 'Connect a server first'}
                                </option>
                                {channels.map(channel => (
                                    <option key={channel.id} value={channel.id}>
                                        #{channel.name}
                                    </option>
                                ))}
                            </select>
                            <p className="text-xs text-gray-500">
                                Optional: You can add this later in your community settings.
                            </p>
                        </div>

                        {/* Result Channel */}
                        <div className="space-y-3 md:col-span-2">
                            <label className="block text-sm font-medium text-white">Results Channel</label>
                            <select
                                value={data.giveawayResultChannel}
                                onChange={e => {
                                    onUpdate({ giveawayResultChannel: e.target.value });
                                    clearError('giveawayResultChannel');
                                }}
                                disabled={!data.discordGuildId || isLoadingChannels}
                                className="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white focus:border-green-500 focus:outline-none transition text-sm disabled:opacity-50"
                            >
                                <option value="">
                                    {data.discordGuildId
                                        ? isLoadingChannels
                                            ? 'Loading channels...'
                                            : 'Select a channel'
                                        : 'Connect a server first'}
                                </option>
                                {channels.map(channel => (
                                    <option key={channel.id} value={channel.id}>
                                        #{channel.name}
                                    </option>
                                ))}
                            </select>
                            <p className="text-xs text-gray-500">
                                Optional: You can add this later in your community settings.
                            </p>
                        </div>
                    </div>
                    {channelError && <p className="text-red-500 text-sm">{channelError}</p>}
                </div>
            )}

            <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4">
                <p className="text-blue-300 text-sm">
                    💡 <span className="font-semibold">Tip:</span> Giveaway settings are completely optional and can be
                    configured later. Start simple and add complexity as needed.
                </p>
            </div>
        </div>
    );
}
