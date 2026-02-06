'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CategoryFilter } from '@/components/CategoryFilter';

interface Community {
    id: string;
    name: string;
    description: string | null;
    icon: string | null;
    banner: string | null;
    nftMintAddress: string | null;
    categories: string[];
    socials: {
        twitter?: string | null;
        discord?: string | null;
        website?: string | null;
        instagram?: string | null;
    } | null;
}

interface EditCommunityFormProps {
    community: Community;
    onSuccess?: () => void;
}

export function EditCommunityForm({ community, onSuccess }: EditCommunityFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: community.name,
        description: community.description || '',
        icon: community.icon || '',
        banner: community.banner || '',
        nftMintAddress: community.nftMintAddress || '',
        categories: community.categories || [],
        socials: {
            twitter: community.socials?.twitter || '',
            discord: community.socials?.discord || '',
            website: community.socials?.website || '',
            instagram: community.socials?.instagram || '',
        },
    });

    const handleFileUpload = async (file: File, fieldName: 'icon' | 'banner') => {
        if (!file) return;

        setUploading(true);
        setError(null);

        try {
            const formDataToSend = new FormData();
            formDataToSend.append('file', file);

            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formDataToSend,
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Upload failed');
            }

            const { url } = await response.json();
            setFormData(prev => ({ ...prev, [fieldName]: url }));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Upload failed');
        } finally {
            setUploading(false);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e: React.DragEvent, fieldName: 'icon' | 'banner') => {
        e.preventDefault();
        e.stopPropagation();

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileUpload(files[0], fieldName);
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // Build request body with proper null handling
            const requestBody: Record<string, any> = {
                name: formData.name,
                description: formData.description || null,
                icon: formData.icon || null,
                banner: formData.banner || null,
                nftMintAddress: formData.nftMintAddress || null,
                categories: formData.categories,
                socials: {
                    twitter: formData.socials.twitter || null,
                    discord: formData.socials.discord || null,
                    website: formData.socials.website || null,
                    instagram: formData.socials.instagram || null,
                },
            };

            const response = await fetch(`/api/communities/${community.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Failed to update community');
            }

            if (onSuccess) {
                onSuccess();
            } else {
                router.refresh();
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
                <div className="p-4 bg-red-900/20 border border-red-800 rounded-lg text-red-400 text-sm">{error}</div>
            )}

            {/* Community Name */}
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Community Name</label>
                <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-[#00d4ff]"
                />
            </div>

            {/* Description */}
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                <textarea
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-[#00d4ff]"
                    rows={3}
                    placeholder="Describe your community..."
                />
            </div>

            {/* Banner Upload */}
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Community Banner</label>

                {/* Banner URL Input */}
                <input
                    type="url"
                    value={formData.banner.startsWith('/uploads/') ? '' : formData.banner}
                    onChange={e => setFormData({ ...formData, banner: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-[#00d4ff] mb-3"
                    placeholder="Paste banner image URL (or upload below)"
                />

                {/* Banner Upload */}
                {!formData.banner && (
                    <div
                        onDragOver={handleDragOver}
                        onDrop={e => handleDrop(e, 'banner')}
                        className="w-full border-2 border-dashed border-gray-600 rounded-lg p-6 text-center hover:border-[#00d4ff] transition cursor-pointer"
                    >
                        <input
                            type="file"
                            accept="image/*"
                            onChange={e => {
                                const file = e.target.files?.[0];
                                if (file) handleFileUpload(file, 'banner');
                            }}
                            className="hidden"
                            id="banner-upload"
                        />
                        <label htmlFor="banner-upload" className="cursor-pointer block">
                            <p className="text-gray-300 mb-1">
                                {uploading ? 'Uploading...' : 'Drag & drop banner or click to upload'}
                            </p>
                            <p className="text-xs text-gray-500">PNG, JPG, WebP (max 5MB)</p>
                        </label>
                    </div>
                )}
                {formData.banner && (
                    <div className="mt-4">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-sm text-gray-400">Banner Preview:</p>
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, banner: '' })}
                                className="px-3 py-1 text-xs bg-red-900/20 border border-red-800 text-red-400 rounded hover:bg-red-900/40 transition"
                            >
                                Clear
                            </button>
                        </div>
                        <img
                            src={formData.banner}
                            alt="Banner preview"
                            className="w-full h-32 object-cover rounded-lg"
                        />
                    </div>
                )}
            </div>

            {/* Logo Upload */}
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Community Logo</label>

                {/* Logo URL Input */}
                <input
                    type="url"
                    value={formData.icon.startsWith('/uploads/') ? '' : formData.icon}
                    onChange={e => setFormData({ ...formData, icon: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-[#00d4ff] mb-3"
                    placeholder="Paste logo image URL (or upload below)"
                />

                {/* Logo Upload */}
                {!formData.icon && (
                    <div
                        onDragOver={handleDragOver}
                        onDrop={e => handleDrop(e, 'icon')}
                        className="w-full border-2 border-dashed border-gray-600 rounded-lg p-6 text-center hover:border-[#00d4ff] transition cursor-pointer"
                    >
                        <input
                            type="file"
                            accept="image/*"
                            onChange={e => {
                                const file = e.target.files?.[0];
                                if (file) handleFileUpload(file, 'icon');
                            }}
                            className="hidden"
                            id="logo-upload"
                        />
                        <label htmlFor="logo-upload" className="cursor-pointer block">
                            <p className="text-gray-300 mb-1">
                                {uploading ? 'Uploading...' : 'Drag & drop logo or click to upload'}
                            </p>
                            <p className="text-xs text-gray-500">PNG, JPG, WebP (max 5MB)</p>
                        </label>
                    </div>
                )}
                {formData.icon && (
                    <div className="mt-4">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-sm text-gray-400">Logo Preview:</p>
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, icon: '' })}
                                className="px-3 py-1 text-xs bg-red-900/20 border border-red-800 text-red-400 rounded hover:bg-red-900/40 transition"
                            >
                                Clear
                            </button>
                        </div>
                        <img src={formData.icon} alt="Logo preview" className="w-16 h-16 rounded-lg object-cover" />
                    </div>
                )}
            </div>

            {/* Category Selection */}
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Categories</label>
                <CategoryFilter
                    selectedCategories={formData.categories}
                    onCategoryChange={categories => setFormData({ ...formData, categories })}
                    multiple={true}
                />
                <p className="text-gray-500 text-sm mt-2">
                    Select one or more categories to help users discover your community
                </p>
            </div>

            {/* NFT Mint Address */}
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">NFT Mint Address</label>
                <input
                    type="text"
                    value={formData.nftMintAddress}
                    onChange={e => setFormData({ ...formData, nftMintAddress: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-[#00d4ff] font-mono text-sm"
                    placeholder="11111111111111111111111111111111"
                />
                <p className="text-gray-500 text-sm mt-1">Solana NFT collection mint address</p>
            </div>

            {/* Social Links */}
            <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-300">Social Links</label>

                {/* Twitter */}
                <div>
                    <label className="text-xs text-gray-400 mb-1 block">Twitter</label>
                    <input
                        type="url"
                        value={formData.socials.twitter}
                        onChange={e =>
                            setFormData({
                                ...formData,
                                socials: { ...formData.socials, twitter: e.target.value },
                            })
                        }
                        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-[#00d4ff] text-sm"
                        placeholder="https://twitter.com/yourhandle"
                    />
                </div>

                {/* Discord */}
                <div>
                    <label className="text-xs text-gray-400 mb-1 block">Discord</label>
                    <input
                        type="url"
                        value={formData.socials.discord}
                        onChange={e =>
                            setFormData({
                                ...formData,
                                socials: { ...formData.socials, discord: e.target.value },
                            })
                        }
                        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-[#00d4ff] text-sm"
                        placeholder="https://discord.gg/invite"
                    />
                </div>

                {/* Website */}
                <div>
                    <label className="text-xs text-gray-400 mb-1 block">Website</label>
                    <input
                        type="url"
                        value={formData.socials.website}
                        onChange={e =>
                            setFormData({
                                ...formData,
                                socials: { ...formData.socials, website: e.target.value },
                            })
                        }
                        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-[#00d4ff] text-sm"
                        placeholder="https://yoursite.com"
                    />
                </div>

                {/* Instagram */}
                <div>
                    <label className="text-xs text-gray-400 mb-1 block">Instagram</label>
                    <input
                        type="url"
                        value={formData.socials.instagram}
                        onChange={e =>
                            setFormData({
                                ...formData,
                                socials: { ...formData.socials, instagram: e.target.value },
                            })
                        }
                        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-[#00d4ff] text-sm"
                        placeholder="https://instagram.com/yourhandle"
                    />
                </div>
            </div>

            {/* Submit */}
            <div className="flex gap-3">
                <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-[#00ff41] text-black rounded-lg font-semibold hover:bg-[#00dd33] disabled:opacity-50 transition"
                >
                    {loading ? 'Saving...' : 'Save Changes'}
                </button>
            </div>
        </form>
    );
}
