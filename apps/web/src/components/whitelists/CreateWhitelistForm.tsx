'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface WhitelistFormProps {
    communityId: string;
    slug?: string;
    onSuccess?: () => void;
}

export function CreateWhitelistForm({ communityId, slug, onSuccess }: WhitelistFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

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
        maxSpots: 100,
        endDate: getLocalDateString(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
        discordRoleRequired: false,
        discordRoleId: '',
        discordAccountAgeDays: 0,
        tokenHoldingRequired: false,
        tokenMint: '',
        tokenAmount: 0,
    });

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const requirements: any[] = [
                {
                    type: 'SOLANA_WALLET_CONNECTED',
                    config: {},
                },
            ];

            if (formData.discordRoleRequired && formData.discordRoleId) {
                requirements.push({
                    type: 'DISCORD_ROLE_REQUIRED',
                    config: { roleId: formData.discordRoleId },
                });
            }

            if (formData.discordAccountAgeDays > 0) {
                requirements.push({
                    type: 'DISCORD_ACCOUNT_AGE_DAYS',
                    config: { days: formData.discordAccountAgeDays },
                });
            }

            if (formData.tokenHoldingRequired && formData.tokenMint && formData.tokenAmount) {
                requirements.push({
                    type: 'SOLANA_TOKEN_HOLDING',
                    config: {
                        mint: formData.tokenMint,
                        amount: formData.tokenAmount,
                    },
                });
            }

            // Parse date as local time (not UTC)
            const [year, month, day] = formData.endDate.split('-').map(Number);
            const endDateTime = new Date(year, month - 1, day, 23, 59, 59);

            const response = await fetch('/api/events', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    communityId,
                    type: 'WHITELIST',
                    title: formData.title,
                    description: formData.description,
                    endAt: endDateTime.toISOString(),
                    status: 'ACTIVE',
                    requirements,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to create whitelist');
            }

            if (onSuccess) {
                onSuccess();
            } else if (slug) {
                router.push(`/profile/communities/${slug}/admin/whitelists`);
            } else if (communityId) {
                // Fallback to /profile/communities if slug not available
                router.push(`/profile/communities/${communityId}/admin/whitelists`);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
            <div>
                <label className="block text-sm font-medium text-white mb-1">Whitelist Name</label>
                <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2 bg-[#111528] border border-[#00d4ff] text-white rounded-lg focus:outline-none focus:border-[#00ff41]"
                    placeholder="e.g., 'NFT Launch Whitelist'"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-white mb-1">Description (Optional)</label>
                <textarea
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 bg-[#111528] border border-[#00d4ff] text-white rounded-lg focus:outline-none focus:border-[#00ff41]"
                    placeholder="Details about the whitelist"
                    rows={3}
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-white mb-1">Max Participants</label>
                <input
                    type="number"
                    required
                    min="1"
                    value={formData.maxSpots}
                    onChange={e => setFormData({ ...formData, maxSpots: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 bg-[#111528] border border-[#00d4ff] text-white rounded-lg focus:outline-none focus:border-[#00ff41]"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-white mb-1">End Date</label>
                <input
                    type="date"
                    required
                    value={formData.endDate}
                    onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-4 py-2 bg-[#111528] border border-[#00d4ff] text-white rounded-lg focus:outline-none focus:border-[#00ff41]"
                />
            </div>

            <fieldset className="border border-[#00d4ff]/20 rounded-lg p-4 space-y-4">
                <legend className="text-sm font-medium text-[#00d4ff] px-2">Discord Requirements</legend>

                <div>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={formData.discordRoleRequired}
                            onChange={e => setFormData({ ...formData, discordRoleRequired: e.target.checked })}
                            className="w-4 h-4"
                        />
                        <span className="text-sm text-white">Require Specific Discord Role</span>
                    </label>
                </div>

                {formData.discordRoleRequired && (
                    <div>
                        <input
                            type="text"
                            placeholder="Discord Role ID"
                            value={formData.discordRoleId}
                            onChange={e => setFormData({ ...formData, discordRoleId: e.target.value })}
                            className="w-full px-4 py-2 bg-[#111528] border border-[#00d4ff] text-white rounded-lg focus:outline-none focus:border-[#00ff41]"
                        />
                    </div>
                )}

                <div>
                    <label className="block text-sm text-white mb-1">Minimum Discord Account Age (days)</label>
                    <input
                        type="number"
                        min="0"
                        value={formData.discordAccountAgeDays}
                        onChange={e =>
                            setFormData({
                                ...formData,
                                discordAccountAgeDays: parseInt(e.target.value),
                            })
                        }
                        className="w-full px-4 py-2 bg-[#111528] border border-[#00d4ff] text-white rounded-lg focus:outline-none focus:border-[#00ff41]"
                        placeholder="0 = no requirement"
                    />
                </div>
            </fieldset>

            <fieldset className="border border-[#00d4ff]/20 rounded-lg p-4 space-y-4">
                <legend className="text-sm font-medium text-[#00d4ff] px-2">Solana Requirements</legend>

                <div>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={formData.tokenHoldingRequired}
                            onChange={e => setFormData({ ...formData, tokenHoldingRequired: e.target.checked })}
                            className="w-4 h-4"
                        />
                        <span className="text-sm text-white">Require Token Holding</span>
                    </label>
                </div>

                {formData.tokenHoldingRequired && (
                    <>
                        <div>
                            <input
                                type="text"
                                placeholder="Token Mint Address"
                                value={formData.tokenMint}
                                onChange={e => setFormData({ ...formData, tokenMint: e.target.value })}
                                className="w-full px-4 py-2 bg-[#111528] border border-[#00d4ff] text-white rounded-lg focus:outline-none focus:border-[#00ff41]"
                            />
                        </div>
                        <div>
                            <input
                                type="number"
                                min="0"
                                placeholder="Minimum Token Amount"
                                value={formData.tokenAmount}
                                onChange={e =>
                                    setFormData({
                                        ...formData,
                                        tokenAmount: parseFloat(e.target.value),
                                    })
                                }
                                className="w-full px-4 py-2 bg-[#111528] border border-[#00d4ff] text-white rounded-lg focus:outline-none focus:border-[#00ff41]"
                            />
                        </div>
                    </>
                )}
            </fieldset>

            {error && <div className="p-4 bg-red-900/20 border border-red-500 rounded-lg text-red-200">{error}</div>}

            <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-3 bg-[#00ff41] text-[#0a0e27] font-semibold rounded-lg hover:bg-[#00dd33] disabled:opacity-50 transition"
            >
                {loading ? 'Creating...' : 'Create Whitelist'}
            </button>
        </form>
    );
}
