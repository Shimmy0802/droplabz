'use client';

import { useState } from 'react';

interface CreateAnnouncementFormProps {
    communityId: string;
    onSuccess?: () => void;
}

/**
 * Form for community admins to create announcements
 */
export function CreateAnnouncementForm({ communityId, onSuccess }: CreateAnnouncementFormProps) {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [isPinned, setIsPinned] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!title.trim() || !content.trim()) {
            setError('Title and content are required');
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await fetch(`/api/communities/${communityId}/announcements`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, content, isPinned }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to create announcement');
            }

            // Reset form
            setTitle('');
            setContent('');
            setIsPinned(false);

            // Call success callback
            if (onSuccess) {
                onSuccess();
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create announcement');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-[#111528] border border-[rgba(0,255,65,0.2)] rounded-lg p-6">
            <h3 className="text-xl font-bold text-white mb-4">Create Announcement</h3>

            {error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded text-red-400 text-sm">
                    {error}
                </div>
            )}

            {/* Title */}
            <div className="mb-4">
                <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-2">
                    Title
                </label>
                <input
                    type="text"
                    id="title"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    maxLength={200}
                    className="w-full px-4 py-2 bg-[#0a0e27] border border-[rgba(0,212,255,0.3)] rounded text-white placeholder-gray-500 focus:outline-none focus:border-[#00ff41]"
                    placeholder="Enter announcement title..."
                    disabled={isSubmitting}
                />
                <p className="mt-1 text-xs text-gray-500">{title.length}/200 characters</p>
            </div>

            {/* Content */}
            <div className="mb-4">
                <label htmlFor="content" className="block text-sm font-medium text-gray-300 mb-2">
                    Content
                </label>
                <textarea
                    id="content"
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    maxLength={5000}
                    rows={6}
                    className="w-full px-4 py-2 bg-[#0a0e27] border border-[rgba(0,212,255,0.3)] rounded text-white placeholder-gray-500 focus:outline-none focus:border-[#00ff41] resize-none"
                    placeholder="Write your announcement..."
                    disabled={isSubmitting}
                />
                <p className="mt-1 text-xs text-gray-500">{content.length}/5000 characters</p>
            </div>

            {/* Pin Option */}
            <div className="mb-6">
                <label className="flex items-center gap-2 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={isPinned}
                        onChange={e => setIsPinned(e.target.checked)}
                        className="w-4 h-4 rounded border-gray-600 text-[#00ff41] focus:ring-[#00ff41] focus:ring-offset-0 bg-[#0a0e27]"
                        disabled={isSubmitting}
                    />
                    <span className="text-sm text-gray-300">Pin this announcement to the top</span>
                </label>
            </div>

            {/* Submit Button */}
            <button
                type="submit"
                disabled={isSubmitting || !title.trim() || !content.trim()}
                className="w-full px-6 py-3 bg-[#00ff41] text-black font-semibold rounded hover:bg-[#00dd33] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                {isSubmitting ? 'Posting...' : 'Post Announcement'}
            </button>
        </form>
    );
}
