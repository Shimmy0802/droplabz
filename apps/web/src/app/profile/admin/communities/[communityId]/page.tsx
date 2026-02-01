'use client';

import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Community {
    id: string;
    name: string;
    slug: string;
    description?: string;
    icon?: string;
    banner?: string;
    ownerId: string;
    guildId?: string;
    isListed: boolean;
    isFeatured: boolean;
    isVerified: boolean;
    verificationStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
    owner?: {
        id: string;
        email: string;
        username?: string;
    };
    subscription?: {
        id: string;
        tier: string;
        status: string;
    };
    _count?: {
        members: number;
        events: number;
    };
}

export default function AdminCommunityPage() {
    const { data: session } = useSession();
    const params = useParams();
    const router = useRouter();
    const communityId = params.communityId as string;

    const [community, setCommunity] = useState<Community | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [forbidden, setForbidden] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [updateError, setUpdateError] = useState('');
    const [updateSuccess, setUpdateSuccess] = useState('');

    useEffect(() => {
        if (!session?.user || !communityId) return;

        const fetchCommunity = async () => {
            try {
                setLoading(true);
                setError('');

                const res = await fetch(`/api/admin/communities/${communityId}`);
                if (res.status === 403) {
                    setForbidden(true);
                    return;
                }
                if (!res.ok) throw new Error('Failed to fetch community');

                const data = await res.json();
                setCommunity(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load community');
            } finally {
                setLoading(false);
            }
        };

        fetchCommunity();
    }, [session, communityId]);

    const toggleFeatured = async () => {
        if (!community) return;

        try {
            setIsUpdating(true);
            setUpdateError('');
            setUpdateSuccess('');

            const res = await fetch(`/api/admin/communities/${communityId}/featured`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isFeatured: !community.isFeatured }),
            });

            if (!res.ok) throw new Error('Failed to update featured status');

            const updated = await res.json();
            setCommunity(updated);
            setUpdateSuccess(`Community ${updated.isFeatured ? 'marked as' : 'removed from'} featured`);
        } catch (err) {
            setUpdateError(err instanceof Error ? err.message : 'Failed to update');
        } finally {
            setIsUpdating(false);
        }
    };

    const toggleListed = async () => {
        if (!community) return;

        try {
            setIsUpdating(true);
            setUpdateError('');
            setUpdateSuccess('');

            const res = await fetch(`/api/admin/communities/${communityId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isListed: !community.isListed }),
            });

            if (!res.ok) throw new Error('Failed to update listed status');

            const updated = await res.json();
            setCommunity(updated);
            setUpdateSuccess(`Community ${updated.isListed ? 'listed' : 'unlisted'}`);
        } catch (err) {
            setUpdateError(err instanceof Error ? err.message : 'Failed to update');
        } finally {
            setIsUpdating(false);
        }
    };

    const toggleVerified = async () => {
        if (!community) return;

        try {
            setIsUpdating(true);
            setUpdateError('');
            setUpdateSuccess('');

            const res = await fetch(`/api/admin/communities/${communityId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isVerified: !community.isVerified }),
            });

            if (!res.ok) throw new Error('Failed to update verification status');

            const updated = await res.json();
            setCommunity(updated);
            setUpdateSuccess(`Community ${updated.isVerified ? 'approved and verified' : 'marked as unverified'}`);
        } catch (err) {
            setUpdateError(err instanceof Error ? err.message : 'Failed to update');
        } finally {
            setIsUpdating(false);
        }
    };

    const deleteCommunity = async () => {
        if (!community || !confirm('Are you sure? This will permanently delete the community and all its data.'))
            return;

        try {
            setIsUpdating(true);
            setUpdateError('');

            const res = await fetch(`/api/admin/communities/${communityId}`, { method: 'DELETE' });

            if (!res.ok) throw new Error('Failed to delete community');

            router.push('/profile/admin');
        } catch (err) {
            setUpdateError(err instanceof Error ? err.message : 'Failed to delete');
            setIsUpdating(false);
        }
    };

    if (forbidden) {
        return (
            <div className="p-6 bg-red-950/20 border border-red-500/30 rounded-lg text-center">
                <h2 className="text-xl font-semibold text-red-400 mb-2">Access Denied</h2>
                <p className="text-gray-300">You don't have permission to access this community.</p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="p-6 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#00ff41]"></div>
                <p className="mt-4 text-gray-400">Loading community details...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 bg-red-950/20 border border-red-500/30 rounded-lg">
                <p className="text-red-400 mb-4">{error}</p>
                <Link href="/profile/admin" className="text-[#00ff41] hover:text-[#00dd33]">
                    ← Back to Admin
                </Link>
            </div>
        );
    }

    if (!community) {
        return (
            <div className="p-6 text-center">
                <p className="text-gray-400">Community not found</p>
                <Link href="/profile/admin" className="text-[#00ff41] hover:text-[#00dd33] block mt-4">
                    ← Back to Admin
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-6">
            {/* Header */}
            <div>
                <Link href="/profile/admin" className="text-[#00d4ff] hover:text-[#0099cc] text-sm mb-4 inline-block">
                    ← Back to Admin
                </Link>
                <h1 className="text-3xl font-bold text-white mb-2">{community.name}</h1>
                <p className="text-gray-400">{community.description}</p>
            </div>

            {/* Alerts */}
            {updateSuccess && (
                <div className="p-4 bg-green-950/30 border border-green-500/30 rounded-lg text-green-400">
                    {updateSuccess}
                </div>
            )}
            {updateError && (
                <div className="p-4 bg-red-950/30 border border-red-500/30 rounded-lg text-red-400">{updateError}</div>
            )}

            {/* Community Info */}
            <div className="bg-[#111528] border border-[rgba(0,255,65,0.1)] rounded-lg p-6">
                <h2 className="text-xl font-semibold text-white mb-4">Community Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                        <p className="text-gray-400 mb-1">Slug</p>
                        <p className="text-white font-mono">{community.slug}</p>
                    </div>
                    <div>
                        <p className="text-gray-400 mb-1">Members</p>
                        <p className="text-white">{community._count?.members ?? 0}</p>
                    </div>
                    <div>
                        <p className="text-gray-400 mb-1">Events</p>
                        <p className="text-white">{community._count?.events ?? 0}</p>
                    </div>
                    <div>
                        <p className="text-gray-400 mb-1">Guild ID</p>
                        <p className="text-white font-mono">{community.guildId || 'Not connected'}</p>
                    </div>
                    <div>
                        <p className="text-gray-400 mb-1">Verification Status</p>
                        <p className="text-white font-semibold">{community.verificationStatus}</p>
                    </div>
                </div>
            </div>

            {/* Owner Info */}
            {community.owner && (
                <div className="bg-[#111528] border border-[rgba(0,212,255,0.1)] rounded-lg p-6">
                    <h2 className="text-xl font-semibold text-white mb-4">Owner</h2>
                    <div className="space-y-2 text-sm">
                        <p>
                            <span className="text-gray-400">Username:</span>{' '}
                            <span className="text-white">{community.owner.username || 'N/A'}</span>
                        </p>
                        <p>
                            <span className="text-gray-400">Email:</span>{' '}
                            <span className="text-white font-mono">{community.owner.email || 'N/A'}</span>
                        </p>
                    </div>
                </div>
            )}

            {/* Subscription */}
            {community.subscription && (
                <div className="bg-[#111528] border border-[rgba(0,212,255,0.1)] rounded-lg p-6">
                    <h2 className="text-xl font-semibold text-white mb-4">Subscription</h2>
                    <div className="space-y-2 text-sm">
                        <p>
                            <span className="text-gray-400">Tier:</span>{' '}
                            <span className="text-white font-semibold">{community.subscription.tier}</span>
                        </p>
                        <p>
                            <span className="text-gray-400">Status:</span>{' '}
                            <span className="text-white">{community.subscription.status}</span>
                        </p>
                    </div>
                </div>
            )}

            {/* Actions */}
            <div className="bg-[#111528] border border-[rgba(0,255,65,0.1)] rounded-lg p-6">
                <h2 className="text-xl font-semibold text-white mb-4">Admin Actions</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                        onClick={toggleFeatured}
                        disabled={isUpdating}
                        className={`py-2 px-4 rounded-lg font-semibold transition ${
                            community.isFeatured
                                ? 'bg-[#00ff41]/20 text-[#00ff41] border border-[#00ff41]/30 hover:bg-[#00ff41]/30'
                                : 'bg-gray-700/30 text-gray-300 border border-gray-600/30 hover:bg-gray-700/50'
                        } disabled:opacity-50`}
                    >
                        {community.isFeatured ? '★ Remove from Featured' : '☆ Mark as Featured'}
                    </button>

                    <button
                        onClick={toggleVerified}
                        disabled={isUpdating}
                        className={`py-2 px-4 rounded-lg font-semibold transition ${
                            community.isVerified
                                ? 'bg-[#00d4ff]/20 text-[#00d4ff] border border-[#00d4ff]/30 hover:bg-[#00d4ff]/30'
                                : 'bg-gray-700/30 text-gray-300 border border-gray-600/30 hover:bg-gray-700/50'
                        } disabled:opacity-50`}
                    >
                        {community.isVerified ? '✓ Verified' : 'Approve Verification'}
                    </button>

                    <button
                        onClick={toggleListed}
                        disabled={isUpdating}
                        className={`py-2 px-4 rounded-lg font-semibold transition ${
                            community.isListed
                                ? 'bg-[#00d4ff]/20 text-[#00d4ff] border border-[#00d4ff]/30 hover:bg-[#00d4ff]/30'
                                : 'bg-gray-700/30 text-gray-300 border border-gray-600/30 hover:bg-gray-700/50'
                        } disabled:opacity-50`}
                    >
                        {community.isListed ? '🔓 Unlist Community' : '🔒 List Community'}
                    </button>

                    <button
                        onClick={deleteCommunity}
                        disabled={isUpdating}
                        className="py-2 px-4 bg-red-950/30 text-red-400 border border-red-500/30 rounded-lg font-semibold hover:bg-red-950/50 transition disabled:opacity-50 col-span-1 sm:col-span-2"
                    >
                        🗑️ Delete Community
                    </button>
                </div>
            </div>
        </div>
    );
}
