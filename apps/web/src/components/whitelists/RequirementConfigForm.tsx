'use client';

/**
 * Requirement Configuration Form Component
 * Used when creating whitelists/presales to add Discord and Solana requirements
 */

import { useState } from 'react';
import { ChevronDown, Plus, X } from 'lucide-react';

export type RequirementType =
    | 'DISCORD_ACCOUNT_AGE'
    | 'DISCORD_SERVER_JOIN_AGE'
    | 'DISCORD_ROLE_REQUIRED'
    | 'SOLANA_TOKEN_BALANCE'
    | 'SOLANA_NFT_OWNERSHIP';

export interface Requirement {
    type: RequirementType;
    config: Record<string, any>;
}

interface RequirementConfigFormProps {
    onAddRequirement: (requirement: Requirement) => void;
    discordRoles?: Array<{ id: string; name: string }>; // Discord roles in guild
}

const REQUIREMENT_TYPES: Record<
    RequirementType,
    {
        label: string;
        description: string;
        fields: Array<{ name: string; label: string; type: 'number' | 'text' | 'select'; options?: string[] }>;
    }
> = {
    DISCORD_ACCOUNT_AGE: {
        label: 'Discord Account Age',
        description: 'Require Discord account to be at least X days old',
        fields: [{ name: 'minDays', label: 'Minimum days', type: 'number' }],
    },
    DISCORD_SERVER_JOIN_AGE: {
        label: 'Discord Server Join Age',
        description: 'Require user to be in server for at least X days',
        fields: [{ name: 'minDays', label: 'Minimum days', type: 'number' }],
    },
    DISCORD_ROLE_REQUIRED: {
        label: 'Discord Role Required',
        description: 'Require specific Discord role(s)',
        fields: [{ name: 'roleIds', label: 'Select roles', type: 'select' }],
    },
    SOLANA_TOKEN_BALANCE: {
        label: 'Solana Token Balance',
        description: 'Require minimum token balance',
        fields: [
            { name: 'mint', label: 'Token mint address', type: 'text' },
            { name: 'minAmount', label: 'Minimum amount', type: 'number' },
        ],
    },
    SOLANA_NFT_OWNERSHIP: {
        label: 'Solana NFT Ownership',
        description: 'Require owning NFT(s) from collection',
        fields: [
            { name: 'collectionMint', label: 'Collection mint address', type: 'text' },
            { name: 'minCount', label: 'Minimum count', type: 'number' },
        ],
    },
};

export function RequirementConfigForm({ onAddRequirement, discordRoles = [] }: RequirementConfigFormProps) {
    const [selectedType, setSelectedType] = useState<RequirementType | null>(null);
    const [formData, setFormData] = useState<Record<string, any>>({});
    const [isOpen, setIsOpen] = useState(false);

    const handleAddRequirement = () => {
        if (!selectedType) return;

        const config = { ...formData };
        // Convert minDays string to number
        if (config.minDays) config.minDays = parseInt(config.minDays, 10);
        if (config.minAmount) config.minAmount = parseFloat(config.minAmount);
        if (config.minCount) config.minCount = parseInt(config.minCount, 10);

        onAddRequirement({
            type: selectedType,
            config,
        });

        // Reset form
        setFormData({});
        setSelectedType(null);
        setIsOpen(false);
    };

    const currentType = selectedType ? REQUIREMENT_TYPES[selectedType] : null;

    return (
        <div className="space-y-4">
            <div className="border border-[rgba(0,255,65,0.1)] rounded-lg p-4">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-full flex items-center justify-between p-3 rounded hover:bg-[#111528] transition-colors"
                >
                    <span className="flex items-center gap-2 text-[#00ff41]">
                        <Plus size={18} />
                        Add Requirement
                    </span>
                    <ChevronDown size={18} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                {isOpen && (
                    <div className="mt-4 space-y-4 border-t border-[rgba(0,255,65,0.1)] pt-4">
                        {/* Requirement Type Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Requirement Type</label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {Object.entries(REQUIREMENT_TYPES).map(([key, value]) => (
                                    <button
                                        key={key}
                                        onClick={() => {
                                            setSelectedType(key as RequirementType);
                                            setFormData({});
                                        }}
                                        className={`p-3 rounded border transition-colors text-left ${
                                            selectedType === key
                                                ? 'border-[#00ff41] bg-[rgba(0,255,65,0.1)]'
                                                : 'border-[rgba(0,255,65,0.1)] hover:border-[#00ff41]'
                                        }`}
                                    >
                                        <div className="font-medium text-sm">{value.label}</div>
                                        <div className="text-xs text-gray-400 mt-1">{value.description}</div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Type-Specific Fields */}
                        {currentType && (
                            <div className="space-y-3 border-t border-[rgba(0,255,65,0.1)] pt-4">
                                {currentType.fields.map(field => (
                                    <div key={field.name}>
                                        <label className="block text-sm font-medium text-gray-300 mb-1">
                                            {field.label}
                                        </label>

                                        {field.type === 'number' && (
                                            <input
                                                type="number"
                                                value={formData[field.name] || ''}
                                                onChange={e =>
                                                    setFormData({ ...formData, [field.name]: e.target.value })
                                                }
                                                className="w-full px-3 py-2 bg-[#111528] border border-[#00d4ff] rounded text-white focus:outline-none focus:border-[#00ff41]"
                                                placeholder={`Enter ${field.label.toLowerCase()}`}
                                            />
                                        )}

                                        {field.type === 'text' && (
                                            <input
                                                type="text"
                                                value={formData[field.name] || ''}
                                                onChange={e =>
                                                    setFormData({ ...formData, [field.name]: e.target.value })
                                                }
                                                className="w-full px-3 py-2 bg-[#111528] border border-[#00d4ff] rounded text-white focus:outline-none focus:border-[#00ff41]"
                                                placeholder={`Enter ${field.label.toLowerCase()}`}
                                            />
                                        )}

                                        {field.type === 'select' && (
                                            <select
                                                multiple
                                                value={formData[field.name] || []}
                                                onChange={e => {
                                                    const selectedRoles = Array.from(
                                                        e.target.selectedOptions,
                                                        option => option.value,
                                                    );
                                                    setFormData({ ...formData, [field.name]: selectedRoles });
                                                }}
                                                className="w-full px-3 py-2 bg-[#111528] border border-[#00d4ff] rounded text-white focus:outline-none focus:border-[#00ff41]"
                                            >
                                                {discordRoles.map(role => (
                                                    <option key={role.id} value={role.id}>
                                                        {role.name}
                                                    </option>
                                                ))}
                                            </select>
                                        )}
                                    </div>
                                ))}

                                {/* Add Button */}
                                <button
                                    onClick={handleAddRequirement}
                                    disabled={!selectedType}
                                    className="w-full mt-4 px-4 py-2 bg-[#00ff41] text-[#0a0e27] font-medium rounded hover:bg-[#00dd33] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    Add Requirement
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

/**
 * Requirement Display Component
 * Shows added requirements and allows removal
 */
interface RequirementListProps {
    requirements: Requirement[];
    onRemove: (index: number) => void;
}

export function RequirementList({ requirements, onRemove }: RequirementListProps) {
    if (requirements.length === 0) {
        return (
            <div className="p-4 bg-[rgba(0,212,255,0.05)] border border-[rgba(0,212,255,0.1)] rounded text-gray-400 text-sm">
                No requirements added yet. Add requirements to set entry eligibility criteria.
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {requirements.map((req, index) => (
                <div
                    key={index}
                    className="flex items-start justify-between p-3 bg-[#111528] border border-[rgba(0,255,65,0.1)] rounded"
                >
                    <div className="flex-1">
                        <div className="font-medium text-[#00ff41] text-sm">{REQUIREMENT_TYPES[req.type].label}</div>
                        <div className="text-xs text-gray-400 mt-1">
                            {JSON.stringify(req.config).replace(/[{}"]/g, '').replace(/,/g, ' • ')}
                        </div>
                    </div>
                    <button
                        onClick={() => onRemove(index)}
                        className="ml-3 p-1 hover:bg-[rgba(255,0,0,0.1)] rounded transition-colors"
                    >
                        <X size={16} className="text-red-500" />
                    </button>
                </div>
            ))}
        </div>
    );
}
