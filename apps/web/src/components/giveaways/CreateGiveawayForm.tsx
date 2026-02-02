'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';

interface GiveawayFormProps {
    communityId: string;
    slug?: string;
    onSuccess?: () => void;
}

interface Requirement {
    id: string;
    type: string;
    config: Record<string, any>;
}

export function CreateGiveawayForm({ communityId, slug, onSuccess }: GiveawayFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [requirements, setRequirements] = useState<Requirement[]>([]);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        prize: '',
        maxWinners: 1,
        startDate: new Date().toISOString().split('T')[0],
        startTime: '00:00',
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endTime: '23:59',
    });

    const handleAddRequirement = (type: string) => {
        const newReq: Requirement = {
            id: Math.random().toString(),
            type,
            config: {},
        };

        if (type === 'DISCORD_ROLE_REQUIRED') {
            newReq.config = { roleId: '' };
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

            const startDateTime = new Date(`${formData.startDate}T${formData.startTime}:00Z`);
            const endDateTime = new Date(`${formData.endDate}T${formData.endTime}:00Z`);

            if (startDateTime >= endDateTime) {
                throw new Error('End date must be after start date');
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

            const response = await fetch('/api/events', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    communityId,
                    type: 'GIVEAWAY',
                    title: formData.title,
                    description: formData.description,
                    prize: formData.prize,
                    startAt: startDateTime.toISOString(),
                    endAt: endDateTime.toISOString(),
                    maxWinners: formData.maxWinners,
                    selectionMode: 'RANDOM',
                    status: 'ACTIVE',
                    requirements: allRequirements,
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
            </div>

            {/* Settings Section */}
            <div className="space-y-6">
                <h3 className="text-xl font-semibold text-white">Settings</h3>

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
                                    <label className="text-xs text-gray-400">Discord Role ID</label>
                                    <input
                                        type="text"
                                        value={req.config.roleId || ''}
                                        onChange={e => handleRequirementChange(req.id, 'roleId', e.target.value)}
                                        placeholder="Enter Discord role ID"
                                        className="w-full mt-1 px-3 py-1 bg-[#111528] border border-[#00d4ff]/20 rounded text-white text-sm focus:border-[#00ff41] focus:outline-none"
                                    />
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
                disabled={loading}
                className="w-full px-6 py-3 bg-[#00ff41] text-[#0a0e27] font-semibold rounded-lg hover:bg-[#00dd33] disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
                {loading ? 'Creating Giveaway...' : 'Create Giveaway'}
            </button>
        </form>
    );
}
