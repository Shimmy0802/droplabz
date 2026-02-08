'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X, Image as ImageIcon } from 'lucide-react';

interface GiveawayFormProps {
    communityId: string;
    slug?: string;
    guildId?: string; // Discord guild ID for role fetching
    onSuccess?: () => void;
}

interface Requirement {
    id: string;
    type: string;
    config: Record<string, any>;
}

interface DiscordRole {
    id: string;
    name: string;
    managed: boolean;
}

export function CreateGiveawayForm({ communityId, slug, guildId, onSuccess }: GiveawayFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [requirements, setRequirements] = useState<Requirement[]>([]);
    const [discordRoles, setDiscordRoles] = useState<DiscordRole[]>([]);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [uploadingImage, setUploadingImage] = useState(false);

    // Helper to get local date in YYYY-MM-DD format (not UTC)
    const getLocalDateString = (date: Date): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        prize: '',
        maxWinners: 1,
        selectionMode: 'RANDOM' as 'RANDOM' | 'FCFS' | 'MANUAL',
        startDate: getLocalDateString(new Date()),
        startTime: '00:00',
        endDate: getLocalDateString(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
        endTime: '23:59',
        imageUrl: '',
        customAnnouncementLine: '',
    });

    // Fetch Discord roles when guildId is available
    useEffect(() => {
        if (guildId) {
            fetchDiscordRoles();
        }
    }, [guildId]);

    const fetchDiscordRoles = async () => {
        if (!guildId) return;

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
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (!allowedTypes.includes(file.type)) {
            setError('Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.');
            return;
        }

        // Validate file size (5MB)
        if (file.size > 5 * 1024 * 1024) {
            setError('File size exceeds 5MB limit');
            return;
        }

        setImageFile(file);

        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
        setError(null);
    };

    const handleRemoveImage = () => {
        setImageFile(null);
        setImagePreview(null);
        setFormData({ ...formData, imageUrl: '' });
    };

    const uploadImage = async (): Promise<string | null> => {
        if (!imageFile) return null;

        setUploadingImage(true);
        try {
            const uploadFormData = new FormData();
            uploadFormData.append('file', imageFile);

            const response = await fetch('/api/upload', {
                method: 'POST',
                body: uploadFormData,
            });

            if (!response.ok) {
                throw new Error('Failed to upload image');
            }

            const data = await response.json();
            return data.url;
        } catch (err) {
            console.error('Error uploading image:', err);
            throw new Error('Failed to upload image');
        } finally {
            setUploadingImage(false);
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

    const handleRequirementChange = (id: string, key: string, value: any) => {
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

            // Validate Discord role requirements have roleId(s) selected
            const discordRoleReqs = requirements.filter(r => r.type === 'DISCORD_ROLE_REQUIRED');
            for (const req of discordRoleReqs) {
                const roleIds = Array.isArray(req.config.roleIds) ? req.config.roleIds.filter(Boolean) : [];
                const roleId = typeof req.config.roleId === 'string' ? req.config.roleId.trim() : '';
                if (roleIds.length === 0 && !roleId) {
                    throw new Error('Discord role requirement must have a role selected');
                }
            }

            // Parse date strings as local time (not UTC)
            const [startYear, startMonth, startDay] = formData.startDate.split('-').map(Number);
            const [startHours, startMinutes] = formData.startTime.split(':').map(Number);
            const startDateTime = new Date(startYear, startMonth - 1, startDay, startHours, startMinutes, 0);

            const [endYear, endMonth, endDay] = formData.endDate.split('-').map(Number);
            const [endHours, endMinutes] = formData.endTime.split(':').map(Number);
            const endDateTime = new Date(endYear, endMonth - 1, endDay, endHours, endMinutes, 0);

            if (startDateTime >= endDateTime) {
                throw new Error('End date must be after start date');
            }

            // Upload image if provided
            let imageUrl = formData.imageUrl;
            if (imageFile) {
                const uploadedUrl = await uploadImage();
                if (uploadedUrl) {
                    imageUrl = uploadedUrl;
                }
            }

            const allRequirements = [
                {
                    type: 'SOLANA_WALLET_CONNECTED',
                    config: {},
                },
                ...requirements.map(r => ({
                    type: r.type,
                    config: r.config,
                })),
            ];

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

            const response = await fetch('/api/events', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    communityId,
                    type: 'GIVEAWAY',
                    title: formData.title,
                    description: formData.description,
                    prize: formData.prize,
                    imageUrl: imageUrl || undefined,
                    startAt: startDateTime.toISOString(),
                    endAt: endDateTime.toISOString(),
                    maxWinners: formData.selectionMode === 'RANDOM' ? undefined : formData.maxWinners,
                    selectionMode: formData.selectionMode,
                    status: 'ACTIVE',
                    requirements: allRequirements,
                    mentionRoleIds,
                    customAnnouncementLine: formData.customAnnouncementLine || undefined,
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to create giveaway');
            }

            if (onSuccess) {
                onSuccess();
            } else if (slug) {
                router.push(`/profile/communities/${slug}/admin/giveaways`);
            } else {
                router.push(`/profile/communities/${communityId}/admin/giveaways`);
            }
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

                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Giveaway Image (Optional)</label>
                    <div className="space-y-3">
                        {imagePreview ? (
                            <div className="relative w-full h-48 bg-[#111528] border border-[#00d4ff]/30 rounded-lg overflow-hidden">
                                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                <button
                                    type="button"
                                    onClick={handleRemoveImage}
                                    className="absolute top-2 right-2 p-1 bg-red-500/80 hover:bg-red-500 rounded-full text-white"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <label className="flex flex-col items-center justify-center w-full h-48 bg-[#111528] border-2 border-dashed border-[#00d4ff]/30 rounded-lg cursor-pointer hover:border-[#00ff41]/50 transition">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <ImageIcon className="w-10 h-10 mb-3 text-gray-400" />
                                    <p className="mb-2 text-sm text-gray-400">
                                        <span className="font-semibold">Click to upload</span> or drag and drop
                                    </p>
                                    <p className="text-xs text-gray-500">PNG, JPG, GIF, or WebP (MAX. 5MB)</p>
                                </div>
                                <input
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp,image/gif"
                                    onChange={handleImageChange}
                                    className="hidden"
                                />
                            </label>
                        )}
                    </div>
                </div>
            </div>

            {/* Settings Section */}
            <div className="space-y-6">
                <h3 className="text-xl font-semibold text-white">Settings</h3>

                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Selection Method</label>
                    <select
                        value={formData.selectionMode}
                        onChange={e =>
                            setFormData({
                                ...formData,
                                selectionMode: e.target.value as 'RANDOM' | 'FCFS' | 'MANUAL',
                            })
                        }
                        className="w-full px-4 py-2 bg-[#111528] border border-[#00d4ff]/30 rounded-lg text-white focus:border-[#00ff41] focus:outline-none"
                    >
                        <option value="RANDOM">🎲 Random Draw (Unlimited Entries)</option>
                        <option value="FCFS">⚡ First-Come, First-Served (Limited Capacity)</option>
                        <option value="MANUAL">✋ Manual Selection</option>
                    </select>
                </div>

                {formData.selectionMode === 'FCFS' && (
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Max Entry Capacity <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="number"
                            min="1"
                            required
                            value={formData.maxWinners}
                            onChange={e => setFormData({ ...formData, maxWinners: parseInt(e.target.value, 10) || 1 })}
                            className="w-full px-4 py-2 bg-[#111528] border border-[#00d4ff]/30 rounded-lg text-white focus:border-[#00ff41] focus:outline-none"
                            placeholder="Maximum number of entries allowed"
                        />
                        <p className="text-xs text-gray-400 mt-1">
                            Once this limit is reached, no new entries will be accepted
                        </p>
                    </div>
                )}

                {formData.selectionMode === 'RANDOM' && (
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Max Winners (Optional)</label>
                        <input
                            type="number"
                            min="1"
                            value={formData.maxWinners}
                            onChange={e => setFormData({ ...formData, maxWinners: parseInt(e.target.value, 10) || 1 })}
                            className="w-full px-4 py-2 bg-[#111528] border border-[#00d4ff]/30 rounded-lg text-white focus:border-[#00ff41] focus:outline-none"
                            placeholder="How many winners to randomly select"
                        />
                        <p className="text-xs text-gray-400 mt-1">
                            Entries are unlimited. This is the count of winners you'll select at the end
                        </p>
                    </div>
                )}

                {formData.selectionMode === 'MANUAL' && (
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Max Winners (Optional)</label>
                        <input
                            type="number"
                            min="1"
                            value={formData.maxWinners}
                            onChange={e => setFormData({ ...formData, maxWinners: parseInt(e.target.value, 10) || 1 })}
                            className="w-full px-4 py-2 bg-[#111528] border border-[#00d4ff]/30 rounded-lg text-white focus:border-[#00ff41] focus:outline-none"
                            placeholder="How many winners you plan to select"
                        />
                        <p className="text-xs text-gray-400 mt-1">
                            You will manually select winners after the event closes
                        </p>
                    </div>
                )}

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Start Date & Time</label>
                        <div className="grid grid-cols-2 gap-2">
                            <input
                                type="date"
                                value={formData.startDate}
                                onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                                className="px-4 py-2 bg-[#111528] border border-[#00d4ff]/30 rounded-lg text-white focus:border-[#00ff41] focus:outline-none"
                            />
                            <input
                                type="time"
                                value={formData.startTime}
                                onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                                className="px-4 py-2 bg-[#111528] border border-[#00d4ff]/30 rounded-lg text-white focus:border-[#00ff41] focus:outline-none"
                            />
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
                                    {guildId && discordRoles.length > 0 ? (
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
                                            {!guildId && (
                                                <p className="text-xs text-gray-500 mt-1">
                                                    Connect Discord server in Community Settings to select from a list
                                                </p>
                                            )}
                                        </>
                                    )}
                                </div>
                            )}

                            {req.type === 'DISCORD_ACCOUNT_AGE_DAYS' && (
                                <div>
                                    <label className="text-xs text-gray-400">Account Age (days)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={req.config.days || 0}
                                        onChange={e =>
                                            handleRequirementChange(req.id, 'days', parseInt(e.target.value))
                                        }
                                        className="w-full mt-1 px-3 py-1 bg-[#111528] border border-[#00d4ff]/20 rounded text-white text-sm focus:border-[#00ff41] focus:outline-none"
                                    />
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

            <button
                type="submit"
                disabled={loading || uploadingImage}
                className="w-full px-6 py-3 bg-[#00ff41] text-[#0a0e27] font-semibold rounded-lg hover:bg-[#00dd33] disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
                {uploadingImage ? 'Uploading Image...' : loading ? 'Creating Giveaway...' : 'Create Giveaway'}
            </button>
        </form>
    );
}
