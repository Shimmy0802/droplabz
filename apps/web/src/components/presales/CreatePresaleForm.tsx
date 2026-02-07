'use client';

/**
 * Create Presale Form Component
 * Allows admins to create presales with multiple tiers
 */

import { useState } from 'react';
import { X, ChevronDown } from 'lucide-react';
import {
    RequirementConfigForm,
    RequirementList,
    type Requirement,
} from '@/components/whitelists/RequirementConfigForm';

interface PresaleTier {
    name: string;
    maxSpots: number;
    allocationAmount: number;
    requirements: Requirement[];
}

interface CreatePresaleFormProps {
    communityId: string;
    onSuccess?: () => void;
}

export function CreatePresaleForm({ communityId, onSuccess }: CreatePresaleFormProps) {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        startAt: '',
        endAt: '',
    });
    const [tiers, setTiers] = useState<PresaleTier[]>([]);
    const [newTier, setNewTier] = useState<PresaleTier>({
        name: '',
        maxSpots: 0,
        allocationAmount: 0,
        requirements: [],
    });
    const [expandedTier, setExpandedTier] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleAddTier = () => {
        if (!newTier.name || newTier.maxSpots <= 0 || newTier.allocationAmount <= 0) {
            setError('Please fill all tier fields');
            return;
        }

        setTiers([...tiers, newTier]);
        setNewTier({ name: '', maxSpots: 0, allocationAmount: 0, requirements: [] });
        setError(null);
    };

    const handleRemoveTier = (index: number) => {
        setTiers(tiers.filter((_, i) => i !== index));
    };

    const handleAddRequirementToTier = (index: number, requirement: Requirement) => {
        const updatedTiers = [...tiers];
        updatedTiers[index].requirements.push(requirement);
        setTiers(updatedTiers);
    };

    const handleRemoveRequirementFromTier = (tierIndex: number, reqIndex: number) => {
        const updatedTiers = [...tiers];
        updatedTiers[tierIndex].requirements = updatedTiers[tierIndex].requirements.filter((_, i) => i !== reqIndex);
        setTiers(updatedTiers);
    };

    const handleCreatePresale = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (tiers.length === 0) {
            setError('Add at least one tier');
            setLoading(false);
            return;
        }

        try {
            // Parse datetime-local strings to proper ISO strings
            // datetime-local format: "YYYY-MM-DDTHH:MM" (interpreted as local time)
            const parseLocalDateTime = (datetimeStr: string): string => {
                if (!datetimeStr) throw new Error('Invalid datetime');
                const [date, time] = datetimeStr.split('T');
                const [year, month, day] = date.split('-').map(Number);
                const [hours, minutes] = time.split(':').map(Number);
                const localDate = new Date(year, month - 1, day, hours, minutes, 0);
                return localDate.toISOString();
            };

            const response = await fetch('/api/presales', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    communityId,
                    name: formData.name,
                    description: formData.description,
                    startAt: parseLocalDateTime(formData.startAt),
                    endAt: parseLocalDateTime(formData.endAt),
                    tiers: tiers.map(tier => ({
                        name: tier.name,
                        maxSpots: tier.maxSpots,
                        allocationAmount: tier.allocationAmount,
                        requirements: tier.requirements.map(req => ({
                            type: req.type,
                            config: req.config,
                        })),
                    })),
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to create presale');
            }

            // Reset form
            setFormData({ name: '', description: '', startAt: '', endAt: '' });
            setTiers([]);
            onSuccess?.();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create presale');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleCreatePresale} className="space-y-6 max-w-4xl">
            {error && (
                <div className="p-4 bg-[rgba(255,107,107,0.1)] border border-red-500 rounded text-red-400 text-sm">
                    {error}
                </div>
            )}

            {/* Basic Info */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold">Basic Information</h3>

                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Presale Name *</label>
                    <input
                        type="text"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-2 bg-[#111528] border border-[#00d4ff] rounded text-white focus:outline-none focus:border-[#00ff41]"
                        placeholder="NFT Pre-Sale Q1 2026"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                    <textarea
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                        className="w-full px-4 py-2 bg-[#111528] border border-[#00d4ff] rounded text-white focus:outline-none focus:border-[#00ff41]"
                        placeholder="Describe the presale..."
                        rows={3}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Start Date *</label>
                        <input
                            type="datetime-local"
                            value={formData.startAt}
                            onChange={e => setFormData({ ...formData, startAt: e.target.value })}
                            className="w-full px-4 py-2 bg-[#111528] border border-[#00d4ff] rounded text-white focus:outline-none focus:border-[#00ff41]"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">End Date *</label>
                        <input
                            type="datetime-local"
                            value={formData.endAt}
                            onChange={e => setFormData({ ...formData, endAt: e.target.value })}
                            className="w-full px-4 py-2 bg-[#111528] border border-[#00d4ff] rounded text-white focus:outline-none focus:border-[#00ff41]"
                            required
                        />
                    </div>
                </div>
            </div>

            {/* Tiers */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold">Presale Tiers</h3>

                {/* Add New Tier */}
                <div className="border border-[rgba(0,255,65,0.1)] rounded p-4 space-y-4">
                    <h4 className="font-medium text-[#00ff41]">Add New Tier</h4>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1">Tier Name</label>
                            <input
                                type="text"
                                value={newTier.name}
                                onChange={e => setNewTier({ ...newTier, name: e.target.value })}
                                className="w-full px-3 py-2 bg-[#0a0e27] border border-[#00d4ff] rounded text-white focus:outline-none focus:border-[#00ff41] text-sm"
                                placeholder="Tier 1"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1">Max Spots</label>
                            <input
                                type="number"
                                value={newTier.maxSpots}
                                onChange={e => setNewTier({ ...newTier, maxSpots: parseInt(e.target.value) || 0 })}
                                className="w-full px-3 py-2 bg-[#0a0e27] border border-[#00d4ff] rounded text-white focus:outline-none focus:border-[#00ff41] text-sm"
                                placeholder="1000"
                                min="1"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1">Allocation Amount</label>
                            <input
                                type="number"
                                value={newTier.allocationAmount}
                                onChange={e =>
                                    setNewTier({ ...newTier, allocationAmount: parseFloat(e.target.value) || 0 })
                                }
                                className="w-full px-3 py-2 bg-[#0a0e27] border border-[#00d4ff] rounded text-white focus:outline-none focus:border-[#00ff41] text-sm"
                                placeholder="10"
                                step="0.01"
                                min="0.01"
                            />
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handleAddTier}
                        className="w-full px-4 py-2 bg-[#00ff41] text-[#0a0e27] font-medium rounded hover:bg-[#00dd33] transition-colors"
                    >
                        Add Tier
                    </button>
                </div>

                {/* Tier List */}
                <div className="space-y-3">
                    {tiers.map((tier, index) => (
                        <div key={index} className="border border-[rgba(0,255,65,0.1)] rounded overflow-hidden">
                            {/* Tier Header */}
                            <button
                                type="button"
                                onClick={() => setExpandedTier(expandedTier === index ? null : index)}
                                className="w-full p-4 flex items-center justify-between hover:bg-[#111528] transition-colors"
                            >
                                <div className="flex-1 text-left">
                                    <div className="font-medium">{tier.name}</div>
                                    <div className="text-xs text-gray-400 mt-1">
                                        {tier.maxSpots} spots • {tier.requirements.length} requirements
                                    </div>
                                </div>
                                <ChevronDown
                                    size={18}
                                    className={`transition-transform ${expandedTier === index ? 'rotate-180' : ''}`}
                                />
                            </button>

                            {/* Tier Details */}
                            {expandedTier === index && (
                                <div className="border-t border-[rgba(0,255,65,0.1)] p-4 space-y-4 bg-[#0a0e27]">
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <span className="text-gray-400">Max Spots:</span>
                                            <span className="ml-2 font-medium">{tier.maxSpots}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-400">Allocation:</span>
                                            <span className="ml-2 font-medium">{tier.allocationAmount}</span>
                                        </div>
                                    </div>

                                    {/* Requirements */}
                                    <div>
                                        <h5 className="text-sm font-medium mb-2">Requirements</h5>
                                        <RequirementConfigForm
                                            onAddRequirement={req => handleAddRequirementToTier(index, req)}
                                        />
                                        <RequirementList
                                            requirements={tier.requirements}
                                            onRemove={reqIndex => handleRemoveRequirementFromTier(index, reqIndex)}
                                        />
                                    </div>

                                    {/* Remove Tier */}
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveTier(index)}
                                        className="w-full px-3 py-2 bg-[rgba(255,107,107,0.1)] border border-red-500 text-red-400 text-sm rounded hover:bg-[rgba(255,107,107,0.2)] transition-colors flex items-center justify-center gap-2"
                                    >
                                        <X size={16} />
                                        Remove Tier
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Submit */}
            <button
                type="submit"
                disabled={loading || tiers.length === 0}
                className="w-full px-6 py-3 bg-[#00ff41] text-[#0a0e27] font-bold rounded hover:bg-[#00dd33] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                {loading ? 'Creating Presale...' : 'Create Presale'}
            </button>
        </form>
    );
}
