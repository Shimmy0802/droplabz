'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Stats {
    totalUsers: number;
    totalCommunities: number;
    totalEvents: number;
    totalEntries: number;
    featuredCommunities: number;
    subscriptionBreakdown: Array<{
        tier: string;
        _count: number;
    }>;
}

interface Community {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    icon: string | null;
    banner: string | null;
    ownerId: string;
    isListed: boolean;
    isFeatured: boolean;
    _count?: {
        members: number;
        events: number;
    };
}

export default function AdminPage() {
    const { data: session } = useSession();
    const [stats, setStats] = useState<Stats | null>(null);
    const [communities, setCommunities] = useState<Community[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [forbidden, setForbidden] = useState(false);

    useEffect(() => {
        if (!session?.user) return;

        const fetchData = async () => {
            try {
                setLoading(true);
                setError('');

                // Fetch stats
                const statsRes = await fetch('/api/admin/dashboard/stats');
                if (statsRes.status === 403) {
                    setForbidden(true);
                    return;
                }
                if (!statsRes.ok) throw new Error('Failed to fetch stats');
                const statsData = await statsRes.json();
                setStats(statsData);

                // Fetch communities
                const commRes = await fetch('/api/admin/communities');
                if (!commRes.ok) throw new Error('Failed to fetch communities');
                const commData = await commRes.json();
                setCommunities(commData);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load admin data');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [session]);

    if (forbidden) {
        return (
            <div className="p-6 bg-red-950/20 border border-red-500/30 rounded-lg text-center">
                <h2 className="text-xl font-semibold text-red-400 mb-2">Access Denied</h2>
                <p className="text-gray-300">You don't have permission to access the admin panel.</p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="p-6 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#00ff41]"></div>
                <p className="mt-4 text-gray-400">Loading admin dashboard...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 bg-red-950/20 border border-red-500/30 rounded-lg">
                <p className="text-red-400">{error}</p>
            </div>
        );
    }

    return (
        <div className="min-h-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
            {/* Header */}
            <div>
                <p className="text-xs uppercase tracking-wide text-gray-400 mb-2">Administration</p>
                <h1 className="text-3xl font-bold text-white mb-2">Platform Admin</h1>
                <p className="text-gray-300 text-sm">Manage all communities and view platform statistics</p>
            </div>

            {/* Stats Grid */}
            {stats && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    <StatCard label="Total Users" value={stats.totalUsers} />
                    <StatCard label="Total Communities" value={stats.totalCommunities} />
                    <StatCard label="Total Events" value={stats.totalEvents} />
                    <StatCard label="Total Entries" value={stats.totalEntries} />
                    <StatCard label="Featured Communities" value={stats.featuredCommunities} color="green" />
                </div>
            )}

            {/* Quick Links */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Link
                    href="/profile/admin/users"
                    className="bg-gray-900/30 border border-gray-700 rounded-lg p-6 hover:border-[#00d4ff] hover:bg-gray-900/50 transition group backdrop-blur-sm"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-[#00d4ff] transition">
                                User Management
                            </h3>
                            <p className="text-gray-300 text-sm">
                                View and manage all users, change roles, and monitor activity
                            </p>
                        </div>
                        <svg className="w-8 h-8 text-[#00d4ff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                            />
                        </svg>
                    </div>
                </Link>

                <Link
                    href="/profile/admin/communities"
                    className="bg-gray-900/30 border border-gray-700 rounded-lg p-6 hover:border-[#00ff41] hover:bg-gray-900/50 transition group backdrop-blur-sm"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-[#00ff41] transition">
                                Community Management
                            </h3>
                            <p className="text-gray-300 text-sm">
                                Manage all communities, verify, feature, and moderate content
                            </p>
                        </div>
                        <svg className="w-8 h-8 text-[#00ff41]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                            />
                        </svg>
                    </div>
                </Link>
            </div>

            {/* Communities Management */}
            <div className="bg-[#111528] border border-[rgba(0,255,65,0.1)] rounded-lg p-6">
                <h2 className="text-xl font-semibold text-white mb-4">All Communities ({communities.length})</h2>

                {communities.length === 0 ? (
                    <p className="text-gray-400">No communities yet</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-[rgba(0,255,65,0.1)]">
                                    <th className="text-left py-3 px-4 font-semibold text-gray-300">Name</th>
                                    <th className="text-left py-3 px-4 font-semibold text-gray-300">Slug</th>
                                    <th className="text-center py-3 px-4 font-semibold text-gray-300">Members</th>
                                    <th className="text-center py-3 px-4 font-semibold text-gray-300">Events</th>
                                    <th className="text-center py-3 px-4 font-semibold text-gray-300">Status</th>
                                    <th className="text-right py-3 px-4 font-semibold text-gray-300">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {communities.map(community => (
                                    <tr
                                        key={community.id}
                                        className="border-b border-[rgba(0,255,65,0.05)] hover:bg-[rgba(0,255,65,0.05)] transition"
                                    >
                                        <td className="py-3 px-4">{community.name}</td>
                                        <td className="py-3 px-4 text-gray-400">{community.slug}</td>
                                        <td className="py-3 px-4 text-center text-gray-300">
                                            {community._count?.members || 0}
                                        </td>
                                        <td className="py-3 px-4 text-center text-gray-300">
                                            {community._count?.events || 0}
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            <div className="flex gap-2 justify-center">
                                                {community.isFeatured && (
                                                    <span className="px-2 py-1 bg-[rgba(0,255,65,0.2)] text-[#00ff41] text-xs font-semibold rounded">
                                                        Featured
                                                    </span>
                                                )}
                                                {community.isListed && (
                                                    <span className="px-2 py-1 bg-[rgba(0,212,255,0.2)] text-[#00d4ff] text-xs font-semibold rounded">
                                                        Listed
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 text-right">
                                            <Link
                                                href={`/profile/admin/communities/${community.id}`}
                                                className="text-[#00ff41] hover:text-[#00dd33] font-semibold transition"
                                            >
                                                Manage →
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

function StatCard({ label, value, color = 'blue' }: { label: string; value?: number; color?: string }) {
    const bgColor = color === 'green' ? 'bg-[rgba(0,255,65,0.1)]' : 'bg-[rgba(0,212,255,0.1)]';
    const borderColor = color === 'green' ? 'border-[rgba(0,255,65,0.2)]' : 'border-[rgba(0,212,255,0.2)]';
    const textColor = color === 'green' ? 'text-[#00ff41]' : 'text-[#00d4ff]';

    return (
        <div className={`${bgColor} border ${borderColor} rounded-lg p-4`}>
            <p className="text-gray-400 text-sm mb-1">{label}</p>
            <p className={`${textColor} text-2xl font-bold`}>{value?.toLocaleString() || '0'}</p>
        </div>
    );
}
