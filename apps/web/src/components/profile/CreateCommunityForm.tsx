'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface FormData {
    name: string;
    slug: string;
    description: string;
}

interface FormError {
    field: string;
    message: string;
}

export default function CreateCommunityForm() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<FormError[]>([]);
    const [generalError, setGeneralError] = useState<string | null>(null);
    const discordTicketUrl = process.env.NEXT_PUBLIC_DISCORD_TICKET_URL || '';

    const [formData, setFormData] = useState<FormData>({
        name: '',
        slug: '',
        description: '',
    });

    // Auto-generate slug from name
    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const name = e.target.value;
        const slug = name
            .toLowerCase()
            .trim()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '');

        setFormData(prev => ({
            ...prev,
            name,
            slug,
        }));
    };

    const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const slug = e.target.value
            .toLowerCase()
            .trim()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '');

        setFormData(prev => ({
            ...prev,
            slug,
        }));
    };

    const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setFormData(prev => ({
            ...prev,
            description: e.target.value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrors([]);
        setGeneralError(null);

        try {
            const response = await fetch('/api/communities', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (!response.ok) {
                // Handle field-specific errors
                if (data.issues && Array.isArray(data.issues)) {
                    const newErrors = data.issues.map((issue: any) => ({
                        field: issue.path?.[0] || 'general',
                        message: issue.message,
                    }));
                    setErrors(newErrors);
                } else if (data.code === 'SLUG_EXISTS') {
                    setErrors([{ field: 'slug', message: 'This slug is already taken' }]);
                } else {
                    setGeneralError(data.message || 'Failed to create community');
                }
                return;
            }

            // Success - redirect to community admin panel
            const community = data;
            // Show success message and redirect
            setTimeout(() => {
                router.push(`/profile/communities/${community.slug}/admin`);
            }, 100);
        } catch (err) {
            setGeneralError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const getFieldError = (field: string) => errors.find(e => e.field === field)?.message;

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {generalError && (
                <div className="p-4 bg-red-900/20 border border-red-800 rounded-lg text-red-400">{generalError}</div>
            )}

            {/* Community Name */}
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Community Name *</label>
                <input
                    type="text"
                    value={formData.name}
                    onChange={handleNameChange}
                    disabled={loading}
                    className={`w-full px-4 py-2 bg-gray-900 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#00d4ff] transition ${
                        getFieldError('name') ? 'border-red-600' : 'border-gray-700'
                    }`}
                    placeholder="e.g., My Awesome Project"
                />
                {getFieldError('name') && <p className="text-red-400 text-sm mt-1">{getFieldError('name')}</p>}
                <p className="text-gray-500 text-sm mt-1">Enter a unique name for your community</p>
            </div>

            {/* Community Slug */}
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Community Slug *</label>
                <div className="flex items-center">
                    <span className="text-gray-500 mr-2">droplabz.com/communities/</span>
                    <input
                        type="text"
                        value={formData.slug}
                        onChange={handleSlugChange}
                        disabled={loading}
                        className={`flex-1 px-4 py-2 bg-gray-900 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#00d4ff] transition ${
                            getFieldError('slug') ? 'border-red-600' : 'border-gray-700'
                        }`}
                        placeholder="my-awesome-project"
                    />
                </div>
                {getFieldError('slug') && <p className="text-red-400 text-sm mt-1">{getFieldError('slug')}</p>}
                <p className="text-gray-500 text-sm mt-1">Lowercase letters, numbers, and hyphens only</p>
            </div>

            {/* Description */}
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                <textarea
                    value={formData.description}
                    onChange={handleDescriptionChange}
                    disabled={loading}
                    rows={4}
                    className={`w-full px-4 py-2 bg-gray-900 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#00d4ff] transition ${
                        getFieldError('description') ? 'border-red-600' : 'border-gray-700'
                    }`}
                    placeholder="Tell us about your community..."
                />
                {getFieldError('description') && (
                    <p className="text-red-400 text-sm mt-1">{getFieldError('description')}</p>
                )}
                <p className="text-gray-500 text-sm mt-1">Optional description of your community</p>
            </div>

            {/* Submit Button */}
            <div className="flex gap-4">
                <button
                    type="submit"
                    disabled={loading || !formData.name.trim() || !formData.slug.trim()}
                    className="px-6 py-2 bg-[#00ff41] text-black rounded-lg font-semibold hover:bg-[#00dd33] disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                    {loading ? 'Creating...' : 'Create Community'}
                </button>
                <button
                    type="button"
                    onClick={() => router.back()}
                    disabled={loading}
                    className="px-6 py-2 bg-gray-900 border border-gray-700 text-white rounded-lg font-semibold hover:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                    Cancel
                </button>
            </div>

            <div className="p-4 bg-yellow-900/20 border border-yellow-700/40 rounded-lg text-sm">
                <p className="text-yellow-300 font-semibold">Verification required</p>
                <p className="text-yellow-200/80 mt-1">
                    Every community must be manually verified. After creation, open a Discord ticket to request
                    approval.
                </p>
                {discordTicketUrl ? (
                    <a
                        href={discordTicketUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block mt-3 text-[#00d4ff] hover:text-[#00ff41] transition font-semibold"
                    >
                        Open Discord Ticket
                    </a>
                ) : (
                    <p className="text-yellow-200/70 mt-2">Discord ticket link not configured</p>
                )}
            </div>
        </form>
    );
}
