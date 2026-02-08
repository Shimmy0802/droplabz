'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';

interface EditGiveawayFormProps {
    event: any;
    slug: string;
}

interface Requirement {
    id: string;
    type: string;
    config: Record<string, any>;
}

export function EditGiveawayForm({ event, slug }: EditGiveawayFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [requirements, setRequirements] = useState<Requirement[]>([]);
    const [discordRoles, setDiscordRoles] = useState<Array<{ id: string; name: string; managed?: boolean }>>([]);
    const [loadingRoles, setLoadingRoles] = useState(false);

    // Helper to convert UTC date to local date/time for display
    const getLocalDateTimeString = (isoString: string): { date: string; time: string } => {
        const date = new Date(isoString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return {
            date: `${year}-${month}-${day}`,
            time: `${hours}:${minutes}`,
        };
    };

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        prize: '',
        maxWinners: 1,
        reservedSpots: 0,
        selectionMode: 'RANDOM' as 'RANDOM' | 'FCFS' | 'MANUAL',
        status: 'DRAFT' as 'DRAFT' | 'ACTIVE' | 'CLOSED',
        autoAssignDiscordRole: false,
        winnerDiscordRoleId: '',
        endDate: '',
        endTime: '',
        customAnnouncementLine: '',
    });

    useEffect(() => {
        if (event) {
            const { date: localDate, time: localTime } = getLocalDateTimeString(event.endAt);
            const existingRequirements =
                event.requirements
                    ?.filter((r: any) => r.type !== 'SOLANA_WALLET_CONNECTED')
                    .map((r: any) => ({
                        id: r.id || Math.random().toString(),
                        type: r.type,
                        config: r.config,
                    })) || [];

            setRequirements(existingRequirements);
            setFormData({
                title: event.title || '',
                description: event.description || '',
                prize: event.prize || '',
                maxWinners: event.maxWinners || 1,
                reservedSpots: event.reservedSpots || 0,
                selectionMode: event.selectionMode || 'RANDOM',
                status: event.status || 'DRAFT',
                autoAssignDiscordRole: event.autoAssignDiscordRole || false,
                winnerDiscordRoleId: event.winnerDiscordRoleId || '',
                endDate: localDate,
                endTime: localTime,
                customAnnouncementLine: event.customAnnouncementLine || '',
            });
        }
    }, [event]);

    useEffect(() => {
        if (event?.community?.guildId) {
            fetchDiscordRoles(event.community.guildId);
        }
    }, [event?.community?.guildId]);

    const fetchDiscordRoles = async (guildId: string) => {
        setLoadingRoles(true);
        try {
            const response = await fetch(`/api/discord/roles?guildId=${guildId}`);
            if (!response.ok) {
                throw new Error('Failed to fetch Discord roles');
            }
            const data = await response.json();
            setDiscordRoles(data.roles || []);
        } catch (err) {
            console.error('Error fetching Discord roles:', err);
            setError('Failed to load Discord roles. Role ID must be entered manually.');
        } finally {
            setLoadingRoles(false);
        }
    };

    const handleAddRequirement = (type: string) => {
        const newReq: Requirement = {
            id: Math.random().toString(),
            type,
            config: {},
        };

        if (type === 'DISCORD_ROLE_REQUIRED') {
            newReq.config = { roleIds: [], roleNames: [] };
        } else if (type === 'DISCORD_ACCOUNT_AGE_DAYS') {
            newReq.config = { days: 0 };
        } else if (type === 'SOLANA_TOKEN_HOLDING') {
            newReq.config = { mint: '', amount: 0 };
        } else if (type === 'SOLANA_NFT_HOLDING') {
            newReq.config = { collectionMint: '' };
        }

        setRequirements([...requirements, newReq]);
    };

    const handleRemoveRequirement = (id: string) => {
        setRequirements(requirements.filter(r => r.id !== id));
    };

    const handleRequirementChange = (id: string, key: string, value: unknown) => {
        setRequirements(
            requirements.map(r =>
                r.id === id
                    ? {
                          ...r,
                          config: { ...r.config, [key]: value },
                      }
                    : r,
            ),
        );
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (!formData.title.trim()) {
                throw new Error('Giveaway title is required');
            }

            if (formData.maxWinners < 1) {
                throw new Error('Max winners must be at least 1');
            }

            if (formData.reservedSpots > formData.maxWinners) {
                throw new Error('Reserved spots cannot exceed max winners');
            }

            // Validate Discord role requirements have roleId(s) selected
            const discordRoleReqs = requirements.filter(r => r.type === 'DISCORD_ROLE_REQUIRED');
            for (const req of discordRoleReqs) {
                const roleIds = Array.isArray(req.config.roleIds) ? req.config.roleIds.filter(Boolean) : [];
                const roleId = typeof req.config.roleId === 'string' ? req.config.roleId.trim() : '';
                if (roleIds.length === 0 && !roleId) {
                    throw new Error('Discord role requirement must have a role selected');
                }
            }

            // Parse date/time as local time (not UTC)
            const [endYear, endMonth, endDay] = formData.endDate.split('-').map(Number);
            const [endHours, endMinutes] = formData.endTime.split(':').map(Number);
            const endDateTime = new Date(endYear, endMonth - 1, endDay, endHours, endMinutes, 0);

            const mentionRoleIds = Array.from(
                new Set(
                    requirements
                        .filter(r => r.type === 'DISCORD_ROLE_REQUIRED')
                        .flatMap(r => {
                            const roleIds = Array.isArray(r.config.roleIds) ? r.config.roleIds : [];
                            const roleId = r.config.roleId ? [r.config.roleId] : [];
                            return [...roleId, ...roleIds].filter(Boolean);
                        }),
                ),
            );

            type EventUpdateData = {
                title: string;
                description?: string;
                prize?: string;
                maxWinners: number;
                reservedSpots: number;
                selectionMode: 'RANDOM' | 'MANUAL' | 'FCFS';
                status: 'DRAFT' | 'ACTIVE' | 'CLOSED';
                autoAssignDiscordRole: boolean;
                winnerDiscordRoleId?: string;
                endAt: string;
                mentionRoleIds?: string[];
                customAnnouncementLine?: string;
            };
            const updateData: EventUpdateData = {
                title: formData.title,
                description: formData.description || undefined,
                prize: formData.prize || undefined,
                maxWinners: formData.maxWinners,
                reservedSpots: formData.reservedSpots,
                selectionMode: formData.selectionMode,
                status: formData.status,
                autoAssignDiscordRole: formData.autoAssignDiscordRole,
                winnerDiscordRoleId: formData.winnerDiscordRoleId || undefined,
                endAt: endDateTime.toISOString(),
                mentionRoleIds,
                customAnnouncementLine: formData.customAnnouncementLine || undefined,
            };

            const response = await fetch(`/api/events/${event.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updateData),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || data.error || 'Failed to update giveaway');
            }

            // Redirect to giveaways list instead of detail page
            router.push(`/profile/communities/${slug}/admin/giveaways`);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8 max-w-3xl">
            {error && <div className="bg-red-500/20 border border-red-500 text-red-200 p-3 rounded">{error}</div>}

            {/* Basic Details Section */}
            <div className="space-y-6">
                <h3 className="text-xl font-semibold text-white">Basic Details</h3>

                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Giveaway Title *</label>
                    <input
                        type="text"
                        value={formData.title}
                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                        placeholder="E.g., Exclusive NFT Giveaway"
                        className="w-full px-4 py-2 bg-[#111528] border border-[#00d4ff]/30 rounded-lg text-white placeholder-gray-500 focus:border-[#00ff41] focus:outline-none"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                    <textarea
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Describe what's being given away..."
                        rows={3}
                        className="w-full px-4 py-2 bg-[#111528] border border-[#00d4ff]/30 rounded-lg text-white placeholder-gray-500 focus:border-[#00ff41] focus:outline-none"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Prize Details</label>
                    <input
                        type="text"
                        value={formData.prize}
                        onChange={e => setFormData({ ...formData, prize: e.target.value })}
                        placeholder="E.g., 1 x Rare NFT + 100 tokens"
                        className="w-full px-4 py-2 bg-[#111528] border border-[#00d4ff]/30 rounded-lg text-white placeholder-gray-500 focus:border-[#00ff41] focus:outline-none"
                    />
                </div>
            </div>

            {/* Settings Section */}
            <div className="space-y-6">
                <h3 className="text-xl font-semibold text-white">Settings</h3>

                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
                    <select
                        value={formData.status}
                        onChange={e => {
                            const status = e.target.value;
                            if (status === 'DRAFT' || status === 'ACTIVE' || status === 'CLOSED') {
                                setFormData({ ...formData, status });
                            }
                        }}
                        className="w-full px-4 py-2 bg-[#111528] border border-[#00d4ff]/30 rounded-lg text-white focus:border-[#00ff41] focus:outline-none"
                        disabled={event.status === 'CLOSED'}
                    >
                        <option value="DRAFT">Draft</option>
                        <option value="ACTIVE">Active</option>
                        <option value="CLOSED">Closed</option>
                    </select>
                    {event.status === 'CLOSED' && (
                        <p className="text-xs text-gray-500 mt-1">Closed events cannot be reopened</p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Selection Mode</label>
                    <select
                        value={formData.selectionMode}
                        onChange={e => {
                            const mode = e.target.value;
                            if (mode === 'RANDOM' || mode === 'MANUAL' || mode === 'FCFS') {
                                setFormData({ ...formData, selectionMode: mode });
                            }
                        }}
                        className="w-full px-4 py-2 bg-[#111528] border border-[#00d4ff]/30 rounded-lg text-white focus:border-[#00ff41] focus:outline-none"
                    >
                        <option value="RANDOM">Random (Raffle)</option>
                        <option value="FCFS">First Come First Served</option>
                        <option value="MANUAL">Manual Selection</option>
                    </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Max Winners</label>
                        <input
                            type="number"
                            min="1"
                            value={formData.maxWinners}
                            onChange={e => setFormData({ ...formData, maxWinners: parseInt(e.target.value) })}
                            className="w-full px-4 py-2 bg-[#111528] border border-[#00d4ff]/30 rounded-lg text-white focus:border-[#00ff41] focus:outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Reserved Spots</label>
                        <input
                            type="number"
                            min="0"
                            value={formData.reservedSpots}
                            onChange={e => setFormData({ ...formData, reservedSpots: parseInt(e.target.value) })}
                            className="w-full px-4 py-2 bg-[#111528] border border-[#00d4ff]/30 rounded-lg text-white focus:border-[#00ff41] focus:outline-none"
                        />
                        <p className="text-xs text-gray-500 mt-1">Team spots reserved from max winners</p>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">End Date & Time</label>
                    <div className="grid grid-cols-2 gap-2">
                        <input
                            type="date"
                            value={formData.endDate}
                            onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                            className="px-4 py-2 bg-[#111528] border border-[#00d4ff]/30 rounded-lg text-white focus:border-[#00ff41] focus:outline-none"
                        />
                        <input
                            type="time"
                            value={formData.endTime}
                            onChange={e => setFormData({ ...formData, endTime: e.target.value })}
                            className="px-4 py-2 bg-[#111528] border border-[#00d4ff]/30 rounded-lg text-white focus:border-[#00ff41] focus:outline-none"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={formData.autoAssignDiscordRole}
                            onChange={e => setFormData({ ...formData, autoAssignDiscordRole: e.target.checked })}
                            className="w-4 h-4"
                        />
                        <span className="text-sm text-gray-300">Auto-assign Discord role to winners</span>
                    </label>

                    {formData.autoAssignDiscordRole && (
                        <input
                            type="text"
                            value={formData.winnerDiscordRoleId}
                            onChange={e => setFormData({ ...formData, winnerDiscordRoleId: e.target.value })}
                            placeholder="Discord role ID"
                            className="w-full px-4 py-2 bg-[#111528] border border-[#00d4ff]/30 rounded-lg text-white placeholder-gray-500 focus:border-[#00ff41] focus:outline-none"
                        />
                    )}
                </div>
            </div>

            {/* Discord Announcement Section */}
            <div className="space-y-6">
                <h3 className="text-xl font-semibold text-white">Discord Announcement</h3>
                <p className="text-sm text-gray-400">
                    Customize how this event will be announced in your Discord server
                </p>

                <div className="text-sm text-gray-400">Role mentions are based on your Discord role requirements.</div>

                {/* Custom Announcement Line */}
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        Custom Announcement (Optional)
                    </label>
                    <p className="text-xs text-gray-400 mb-3">
                        Override the auto-generated announcement. Leave empty to use a creative auto-generated line
                    </p>
                    <textarea
                        value={formData.customAnnouncementLine}
                        onChange={e => setFormData({ ...formData, customAnnouncementLine: e.target.value })}
                        placeholder="E.g., 🎁 Limited-time giveaway for our loyal members — claim your spot now!"
                        rows={2}
                        className="w-full px-4 py-2 bg-[#111528] border border-[#00d4ff]/30 rounded-lg text-white placeholder-gray-500 focus:border-[#00ff41] focus:outline-none"
                    />
                    <p className="text-xs text-gray-400 mt-2">
                        {formData.customAnnouncementLine
                            ? 'Your custom announcement will be used'
                            : 'A creative announcement line will be auto-generated based on event type'}
                    </p>
                </div>
            </div>

            {/* Requirements Section */}
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h3 className="text-xl font-semibold text-white">Requirements (Optional)</h3>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => handleAddRequirement('DISCORD_ROLE_REQUIRED')}
                            className="px-3 py-1 text-sm bg-[#00d4ff]/20 text-[#00d4ff] rounded hover:bg-[#00d4ff]/30"
                        >
                            + Discord Role
                        </button>
                        <button
                            type="button"
                            onClick={() => handleAddRequirement('SOLANA_TOKEN_HOLDING')}
                            className="px-3 py-1 text-sm bg-[#00d4ff]/20 text-[#00d4ff] rounded hover:bg-[#00d4ff]/30"
                        >
                            + Token Holding
                        </button>
                        <button
                            type="button"
                            onClick={() => handleAddRequirement('SOLANA_NFT_HOLDING')}
                            className="px-3 py-1 text-sm bg-[#00d4ff]/20 text-[#00d4ff] rounded hover:bg-[#00d4ff]/30"
                        >
                            + NFT Holding
                        </button>
                    </div>
                </div>

                <div className="text-sm text-yellow-500/80 bg-yellow-500/10 border border-yellow-500/30 rounded p-3">
                    ⚠️ Note: Changing requirements on an active giveaway may affect existing entries
                </div>

                <div className="space-y-3">
                    {requirements.map(req => (
                        <div key={req.id} className="bg-[#0a0e27] border border-[#00d4ff]/20 rounded-lg p-4 space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-[#00d4ff]">{req.type}</span>
                                <button
                                    type="button"
                                    onClick={() => handleRemoveRequirement(req.id)}
                                    className="text-gray-400 hover:text-red-400"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {req.type === 'DISCORD_ROLE_REQUIRED' && (
                                <div>
                                    <label className="text-xs text-gray-400">Discord Roles Required</label>
                                    {event?.community?.guildId && discordRoles.length > 0 ? (
                                        <div className="mt-2 space-y-2 max-h-56 overflow-y-auto border border-[#00d4ff]/10 rounded-md p-3">
                                            {discordRoles.map(role => {
                                                const selectedRoleIds = Array.isArray(req.config.roleIds)
                                                    ? req.config.roleIds
                                                    : req.config.roleId
                                                      ? [req.config.roleId]
                                                      : [];
                                                const checked = selectedRoleIds.includes(role.id);
                                                return (
                                                    <label key={role.id} className="flex items-center">
                                                        <input
                                                            type="checkbox"
                                                            checked={checked}
                                                            onChange={e => {
                                                                const nextRoleIds = e.target.checked
                                                                    ? [...selectedRoleIds, role.id]
                                                                    : selectedRoleIds.filter(id => id !== role.id);
                                                                const roleNames = discordRoles
                                                                    .filter(r => nextRoleIds.includes(r.id))
                                                                    .map(r => r.name);
                                                                setRequirements(prev =>
                                                                    prev.map(r =>
                                                                        r.id === req.id
                                                                            ? {
                                                                                  ...r,
                                                                                  config: {
                                                                                      ...r.config,
                                                                                      roleIds: nextRoleIds,
                                                                                      roleNames,
                                                                                  },
                                                                              }
                                                                            : r,
                                                                    ),
                                                                );
                                                            }}
                                                            className="w-4 h-4 rounded border-[#00d4ff]/30 text-[#00ff41] cursor-pointer"
                                                        />
                                                        <span className="ml-3 text-sm text-gray-300">
                                                            {role.name} {role.managed ? '(Managed)' : ''}
                                                        </span>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <>
                                            <input
                                                type="text"
                                                value={
                                                    Array.isArray(req.config.roleIds)
                                                        ? req.config.roleIds.join(',')
                                                        : req.config.roleId || ''
                                                }
                                                onChange={e => {
                                                    const roleIds = e.target.value
                                                        .split(',')
                                                        .map(id => id.trim())
                                                        .filter(Boolean);
                                                    handleRequirementChange(req.id, 'roleIds', roleIds);
                                                }}
                                                placeholder="Enter Discord role IDs (comma-separated)"
                                                className="w-full mt-1 px-3 py-1 bg-[#111528] border border-[#00d4ff]/20 rounded text-white text-sm focus:border-[#00ff41] focus:outline-none"
                                            />
                                            {!event?.community?.guildId && (
                                                <p className="text-xs text-gray-500 mt-1">
                                                    Connect Discord server in Community Settings to select from a list
                                                </p>
                                            )}
                                        </>
                                    )}
                                </div>
                            )}

                            {req.type === 'SOLANA_TOKEN_HOLDING' && (
                                <>
                                    <div>
                                        <label className="text-xs text-gray-400">Token Mint Address</label>
                                        <input
                                            type="text"
                                            value={req.config.mint || ''}
                                            onChange={e => handleRequirementChange(req.id, 'mint', e.target.value)}
                                            placeholder="Enter token mint address"
                                            className="w-full mt-1 px-3 py-1 bg-[#111528] border border-[#00d4ff]/20 rounded text-white text-sm focus:border-[#00ff41] focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-400">Minimum Amount</label>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={req.config.amount || 0}
                                            onChange={e =>
                                                handleRequirementChange(req.id, 'amount', parseFloat(e.target.value))
                                            }
                                            className="w-full mt-1 px-3 py-1 bg-[#111528] border border-[#00d4ff]/20 rounded text-white text-sm focus:border-[#00ff41] focus:outline-none"
                                        />
                                    </div>
                                </>
                            )}

                            {req.type === 'SOLANA_NFT_HOLDING' && (
                                <div>
                                    <label className="text-xs text-gray-400">Collection Mint Address</label>
                                    <input
                                        type="text"
                                        value={req.config.collectionMint || ''}
                                        onChange={e =>
                                            handleRequirementChange(req.id, 'collectionMint', e.target.value)
                                        }
                                        placeholder="Enter collection mint address"
                                        className="w-full mt-1 px-3 py-1 bg-[#111528] border border-[#00d4ff]/20 rounded text-white text-sm focus:border-[#00ff41] focus:outline-none"
                                    />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex gap-4">
                <button
                    type="button"
                    onClick={() => router.push(`/profile/communities/${slug}/admin/giveaways/${event.id}`)}
                    className="flex-1 px-6 py-3 bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-600 transition"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-6 py-3 bg-[#00ff41] text-[#0a0e27] font-semibold rounded-lg hover:bg-[#00dd33] disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                    {loading ? 'Saving Changes...' : 'Save Changes'}
                </button>
            </div>
        </form>
    );
}
