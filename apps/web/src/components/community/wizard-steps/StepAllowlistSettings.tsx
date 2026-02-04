'use client';

import React, { useState } from 'react';
import { WizardData, WizardErrors } from '@/hooks/useCommunityWizard';

interface StepAllowlistSettingsProps {
    data: WizardData;
    errors: WizardErrors;
    onUpdate: (updates: Partial<WizardData>) => void;
    clearError: (field: string) => void;
}

export default function StepAllowlistSettings({ data, errors, onUpdate, clearError }: StepAllowlistSettingsProps) {
    const AGE_OPTIONS = [0, 7, 14, 30, 60, 90];
    const ELIGIBILITY_PRESETS = [
        { id: 'none', label: 'No extra requirements', value: '' },
        { id: 'nft-holder', label: 'Must hold an NFT', value: 'Must hold at least 1 NFT from our collection.' },
        { id: 'token-holder', label: 'Must hold token balance', value: 'Must hold a minimum token balance.' },
        { id: 'creator', label: 'Verified creator', value: 'Must be a verified creator in our community.' },
        { id: 'custom', label: 'Custom requirement', value: '' },
    ];
    const [eligibilityPreset, setEligibilityPreset] = useState('none');

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <h2 className="text-2xl font-bold text-white">Allowlist Settings</h2>
                <p className="text-gray-400">Configure default access requirements for your community</p>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {/* Account Age Requirement */}
                <div className="space-y-3">
                    <label className="block text-sm font-medium text-white">Minimum Discord Account Age (days)</label>
                    <select
                        value={data.minimumAccountAge}
                        onChange={e => {
                            onUpdate({ minimumAccountAge: parseInt(e.target.value) || 0 });
                            clearError('minimumAccountAge');
                        }}
                        className="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white focus:border-green-500 focus:outline-none transition"
                    >
                        {AGE_OPTIONS.map(option => (
                            <option key={option} value={option}>
                                {option === 0 ? 'No minimum' : `${option} days`}
                            </option>
                        ))}
                    </select>
                    <p className="text-xs text-gray-500">
                        Set to 0 for no minimum requirement. Useful to prevent spam accounts.
                    </p>
                    {errors.minimumAccountAge && <p className="text-red-500 text-sm">{errors.minimumAccountAge}</p>}
                </div>

                {/* Server Join Age Requirement */}
                <div className="space-y-3">
                    <label className="block text-sm font-medium text-white">Minimum Server Join Age (days)</label>
                    <select
                        value={data.minimumServerJoinAge}
                        onChange={e => {
                            onUpdate({ minimumServerJoinAge: parseInt(e.target.value) || 0 });
                            clearError('minimumServerJoinAge');
                        }}
                        className="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white focus:border-green-500 focus:outline-none transition"
                    >
                        {AGE_OPTIONS.map(option => (
                            <option key={option} value={option}>
                                {option === 0 ? 'No minimum' : `${option} days`}
                            </option>
                        ))}
                    </select>
                    <p className="text-xs text-gray-500">
                        Require members to have been in your Discord server for a minimum number of days.
                    </p>
                    {errors.minimumServerJoinAge && (
                        <p className="text-red-500 text-sm">{errors.minimumServerJoinAge}</p>
                    )}
                </div>
            </div>

            {/* Custom Eligibility */}
            <div className="space-y-3">
                <label className="block text-sm font-medium text-white">Eligibility Requirements</label>
                <select
                    value={eligibilityPreset}
                    onChange={e => {
                        const preset = e.target.value;
                        setEligibilityPreset(preset);
                        const selected = ELIGIBILITY_PRESETS.find(item => item.id === preset);
                        if (selected && preset !== 'custom') {
                            onUpdate({ customEligibility: selected.value });
                        } else if (preset === 'none') {
                            onUpdate({ customEligibility: '' });
                        }
                        clearError('customEligibility');
                    }}
                    className="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white focus:border-green-500 focus:outline-none transition"
                >
                    {ELIGIBILITY_PRESETS.map(option => (
                        <option key={option.id} value={option.id}>
                            {option.label}
                        </option>
                    ))}
                </select>
                {eligibilityPreset === 'custom' && (
                    <textarea
                        value={data.customEligibility}
                        onChange={e => {
                            onUpdate({ customEligibility: e.target.value });
                            clearError('customEligibility');
                        }}
                        placeholder="Describe your custom eligibility requirement..."
                        rows={3}
                        className="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:border-green-500 focus:outline-none transition resize-none"
                    />
                )}
                <p className="text-xs text-gray-500">
                    Describe any additional requirements or conditions for joining your allowlist.
                </p>
                {errors.customEligibility && <p className="text-red-500 text-sm">{errors.customEligibility}</p>}
            </div>

            <div className="bg-green-900/20 border border-green-700/50 rounded-lg p-4">
                <p className="text-green-300 text-sm">
                    💡 <span className="font-semibold">Tip:</span> Role-based access control was already configured in
                    the Discord setup (Step 2). You can adjust these settings anytime in your community settings.
                </p>
            </div>

            <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4">
                <p className="text-blue-300 text-sm">
                    ℹ️ <span className="font-semibold">Note:</span> These settings apply to your default
                    whitelist/allowlist. You can create custom requirements for specific events later.
                </p>
            </div>
        </div>
    );
}
