'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

interface Community {
    id: string;
    slug: string;
    name: string;
    description: string | null;
    icon: string | null;
    banner: string | null;
    isFeatured: boolean;
    isListed: boolean;
    isVerified: boolean;
    verificationStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
    rating: number | null;
    owner: {
        email: string | null;
        username: string | null;
    };
    subscription: {
        tier: string;
        status: string;
    } | null;
    _count: {
        members: number;
        events: number;
    };
}

export default function CommunitiesManagementPage() {
    const { data: session } = useSession();
    const [communities, setCommunities] = useState<Community[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [forbidden, setForbidden] = useState(false);

    useEffect(() => {
        if (!session?.user) return;

        // Check if user is super admin
        const fetchAndVerify = async () => {
            try {
                // Verify super admin access
                const response = await fetch('/api/admin/communities');
                if (response.status === 403) {
                    setForbidden(true);
                    setLoading(false);
                    return;
                }
                if (!response.ok) {
                    throw new Error('Failed to fetch communities');
                }
                const data = await response.json();
                setCommunities(data);
            } catch (err: any) {
                setError(err.message);
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchAndVerify();
    }, [session]);

    async function deleteCommunity(communityId: string, communityName: string) {
        if (!confirm(`Are you sure you want to delete "${communityName}"? This cannot be undone.`)) {
            return;
        }

        setDeletingId(communityId);
        setError(null);

        try {
            const response = await fetch(`/api/admin/communities/${communityId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to delete community');
            }

            setCommunities(prev => prev.filter(c => c.id !== communityId));
        } catch (err: any) {
            setError(err.message);
        } finally {
            setDeletingId(null);
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-white">Loading...</div>
            </div>
        );
    }

    if (forbidden) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-white mb-4">Access Denied</h1>
                    <p className="text-gray-400 mb-6">You don't have permission to access this page.</p>
                    <Link href="/profile" className="text-[#00ff41] hover:text-[#00dd33]">
                        Return to Profile
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="px-4 sm:px-6 lg:px-8 py-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <Link
                        href="/profile/admin"
                        className="text-[#00d4ff] hover:text-[#0099cc] text-sm mb-4 inline-block"
                    >
                        ← Back to Admin
                    </Link>
                    <h1 className="text-2xl font-bold text-white mb-2">Communities Management</h1>
                    <p className="text-gray-400 text-sm">View and manage all communities on the platform</p>
                </div>

                {error && (
                    <div className="mb-4 p-4 bg-red-500/10 border border-red-500/50 rounded text-red-400 text-sm">
                        {error}
                    </div>
                )}

                {/* Communities Table */}
                {communities.length === 0 ? (
                    <div className="text-center py-12 bg-[#111528] rounded border border-[rgba(0,255,65,0.1)]">
                        <p className="text-gray-400">No communities found</p>
                    </div>
                ) : (
                    <div className="bg-[#111528] rounded border border-[rgba(0,255,65,0.1)] overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-[#0a0e27] border-b border-[rgba(0,255,65,0.1)]">
                                    <tr>
                                        <th className="px-6 py-3 text-left font-semibold text-white">Community</th>
                                        <th className="px-6 py-3 text-left font-semibold text-white">Owner</th>
                                        <th className="px-6 py-3 text-left font-semibold text-white">Plan</th>
                                        <th className="px-6 py-3 text-center font-semibold text-white">Members</th>
                                        <th className="px-6 py-3 text-center font-semibold text-white">Events</th>
                                        <th className="px-6 py-3 text-center font-semibold text-white">Featured</th>
                                        <th className="px-6 py-3 text-center font-semibold text-white">Verified</th>
                                        <th className="px-6 py-3 text-right font-semibold text-white">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[rgba(0,255,65,0.05)]">
                                    {communities.map(community => (
                                        <tr key={community.id} className="hover:bg-[rgba(0,255,65,0.03)] transition">
                                            <td className="px-6 py-4">
                                                <Link
                                                    href={`/profile/admin/communities/${community.id}`}
                                                    className="text-white font-semibold hover:text-[#00ff41] transition"
                                                >
                                                    {community.name}
                                                </Link>
                                                <p className="text-gray-400 text-xs mt-1">{community.slug}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-white text-sm">
                                                    {community.owner.username || community.owner.email}
                                                </p>
                                                <p className="text-gray-400 text-xs">{community.owner.email}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="inline-block px-3 py-1 rounded text-xs font-semibold bg-[rgba(0,212,255,0.15)] text-[#00d4ff]">
                                                    {community.subscription?.tier || 'FREE'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center text-white font-semibold">
                                                {community._count.members}
                                            </td>
                                            <td className="px-6 py-4 text-center text-white font-semibold">
                                                {community._count.events}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {community.isFeatured ? (
                                                    <span className="text-[#00ff41] font-bold text-lg">★</span>
                                                ) : (
                                                    <span className="text-gray-500">—</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {community.isVerified ? (
                                                    <span className="text-[#00d4ff] font-bold">✓</span>
                                                ) : (
                                                    <span className="text-gray-500">—</span>
                                                )}
                                                <div className="text-[10px] text-gray-500 mt-1">
                                                    {community.verificationStatus}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => deleteCommunity(community.id, community.name)}
                                                    disabled={deletingId === community.id}
                                                    className="text-red-400 hover:text-red-300 text-sm font-semibold disabled:opacity-50"
                                                >
                                                    {deletingId === community.id ? 'Deleting...' : 'Delete'}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
