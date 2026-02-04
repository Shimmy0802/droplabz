'use client';

import React, { useRef } from 'react';
import { WizardData, WizardErrors } from '@/hooks/useCommunityWizard';

interface StepProjectDetailsProps {
    data: WizardData;
    errors: WizardErrors;
    onUpdate: (updates: Partial<WizardData>) => void;
    setError: (field: string, message: string) => void;
    clearError: (field: string) => void;
}

export default function StepProjectDetails({ data, errors, onUpdate, setError, clearError }: StepProjectDetailsProps) {
    const logoInputRef = useRef<HTMLInputElement>(null);
    const bannerInputRef = useRef<HTMLInputElement>(null);

    const COMMUNITY_TYPE_OPTIONS = [
        { id: 'NFT_PROJECT', label: 'NFT Project' },
        { id: 'DAO', label: 'DAO' },
        { id: 'COMMUNITY', label: 'Community' },
        { id: 'GAMING', label: 'Gaming' },
        { id: 'OTHER', label: 'Other' },
    ] as const;

    const toggleType = (typeId: WizardData['types'][number]) => {
        const updated = data.types.includes(typeId) ? data.types.filter(t => t !== typeId) : [...data.types, typeId];
        onUpdate({ types: updated });
        clearError('types');
    };

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const name = e.target.value;
        const slug = name
            .toLowerCase()
            .trim()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '');

        onUpdate({ name, slug });
        clearError('name');
    };

    const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const slug = e.target.value
            .toLowerCase()
            .trim()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '');

        onUpdate({ slug });
        clearError('slug');
    };

    const handleImageUpload = (file: File | null, type: 'logo' | 'banner') => {
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            setError(type, 'Please upload a valid image file');
            return;
        }

        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
            setError(type, 'Image must be less than 5MB');
            return;
        }

        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
            const preview = reader.result as string;
            if (type === 'logo') {
                onUpdate({ logo: file, logoPreview: preview });
            } else {
                onUpdate({ banner: file, bannerPreview: preview });
            }
            clearError(type);
        };
        reader.readAsDataURL(file);
    };

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        handleImageUpload(e.target.files?.[0] || null, 'logo');
    };

    const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        handleImageUpload(e.target.files?.[0] || null, 'banner');
    };

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <h2 className="text-2xl font-bold text-white">Project Details</h2>
                <p className="text-gray-400">Tell us about your community</p>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {/* Community Name */}
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-white">
                        Community Name <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        value={data.name}
                        onChange={handleNameChange}
                        placeholder="My Awesome Community"
                        className="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:border-green-500 focus:outline-none transition"
                    />
                    {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
                </div>

                {/* Website URL */}
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-white">Website URL</label>
                    <input
                        type="url"
                        value={data.website}
                        onChange={e => {
                            onUpdate({ website: e.target.value });
                            clearError('website');
                        }}
                        placeholder="https://example.com"
                        className="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none transition"
                    />
                    {errors.website && <p className="text-red-500 text-sm">{errors.website}</p>}
                </div>

                {/* Slug */}
                <div className="space-y-2 md:col-span-2">
                    <label className="block text-sm font-medium text-white">
                        Community URL Slug <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-center">
                        <span className="text-gray-400 mr-2">droplabz.io/</span>
                        <input
                            type="text"
                            value={data.slug}
                            onChange={handleSlugChange}
                            placeholder="my-awesome-community"
                            className="flex-1 px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:border-green-500 focus:outline-none transition"
                        />
                    </div>
                    <p className="text-xs text-gray-500">Use lowercase letters, numbers, and hyphens only</p>
                    {errors.slug && <p className="text-red-500 text-sm">{errors.slug}</p>}
                </div>

                {/* Community Types */}
                <div className="space-y-2 md:col-span-2">
                    <label className="block text-sm font-medium text-white">
                        Community Types <span className="text-red-500">*</span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {COMMUNITY_TYPE_OPTIONS.map(option => {
                            const isSelected = data.types.includes(option.id);
                            return (
                                <button
                                    key={option.id}
                                    type="button"
                                    onClick={() => toggleType(option.id)}
                                    className={`rounded-full border px-3 py-1 text-sm transition ${
                                        isSelected
                                            ? 'border-green-400 bg-green-500/20 text-green-300'
                                            : 'border-gray-700 bg-gray-800 text-gray-300 hover:border-blue-500'
                                    }`}
                                >
                                    {option.label}
                                </button>
                            );
                        })}
                    </div>
                    <p className="text-xs text-gray-500">Select all that apply.</p>
                    {errors.types && <p className="text-red-500 text-sm">{errors.types}</p>}
                </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
                <label className="block text-sm font-medium text-white">Project Description</label>
                <textarea
                    value={data.description}
                    onChange={e => {
                        onUpdate({ description: e.target.value });
                        clearError('description');
                    }}
                    placeholder="Describe your community, project, and goals..."
                    rows={3}
                    className="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none transition resize-none"
                />
                {errors.description && <p className="text-red-500 text-sm">{errors.description}</p>}
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {/* Logo Upload */}
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-white">Community Logo</label>
                    <div className="flex items-center gap-4">
                        <div>
                            <button
                                type="button"
                                onClick={() => logoInputRef.current?.click()}
                                className="px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white hover:border-blue-500 transition cursor-pointer"
                            >
                                {data.logoPreview ? 'Change Logo' : 'Upload Logo'}
                            </button>
                            <input
                                ref={logoInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleLogoChange}
                                className="hidden"
                            />
                        </div>
                        {data.logoPreview && (
                            <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-700">
                                <img src={data.logoPreview} alt="Logo preview" className="w-full h-full object-cover" />
                            </div>
                        )}
                    </div>
                    {errors.logo && <p className="text-red-500 text-sm">{errors.logo}</p>}
                </div>

                {/* Banner Upload */}
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-white">Community Banner</label>
                    <div className="flex items-center gap-4">
                        <button
                            type="button"
                            onClick={() => bannerInputRef.current?.click()}
                            className="px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white hover:border-blue-500 transition cursor-pointer"
                        >
                            {data.bannerPreview ? 'Change Banner' : 'Upload Banner'}
                        </button>
                        <input
                            ref={bannerInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleBannerChange}
                            className="hidden"
                        />
                    </div>
                    {data.bannerPreview && (
                        <div className="relative w-full h-24 rounded-lg overflow-hidden border border-gray-700">
                            <img src={data.bannerPreview} alt="Banner preview" className="w-full h-full object-cover" />
                        </div>
                    )}
                    {errors.banner && <p className="text-red-500 text-sm">{errors.banner}</p>}
                </div>
            </div>

            <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4">
                <p className="text-blue-300 text-sm">
                    💡 <span className="font-semibold">Tip:</span> Use high-quality images for your logo and banner.
                    Recommended sizes: Logo 512x512px, Banner 1920x400px.
                </p>
            </div>
        </div>
    );
}
