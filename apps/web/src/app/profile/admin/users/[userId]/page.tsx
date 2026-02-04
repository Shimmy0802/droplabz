'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

interface UserDetail {
    id: string;
    email: string | null;
    username: string | null;
    role: 'SUPER_ADMIN' | 'ADMIN' | 'MEMBER';
    discordId: string | null;
    discordUsername: string | null;
    createdAt: string;
    updatedAt: string;
    ownedCommunities: Array<{
        id: string;
        name: string;
        slug: string;
        createdAt: string;
        subscription: {
            tier: string;
            status: string;
        } | null;
        _count: {
            members: number;
            events: number;
        };
    }>;
    communityMembers: Array<{
        id: string;
        role: string;
        createdAt: string;
        community: {
            id: string;
            name: string;
            slug: string;
            owner: {
                id: string;
                username: string | null;
            };
        };
    }>;
    reviews: Array<{
        id: string;
        rating: number;
        comment: string | null;
        createdAt: string;
        community: {
            name: string;
            slug: string;
        };
    }>;
    auditLogs: Array<{
        id: string;
        action: string;
        createdAt: string;
        community: {
            name: string;
        };
    }>;
    _count: {
        ownedCommunities: number;
        communityMembers: number;
        reviews: number;
        auditLogs: number;
        superAdminLogs: number;
    };
}

export default function UserDetailPage({ params }: { params: Promise<{ userId: string }> }) {
    const { data: session } = useSession();
    const [user, setUser] = useState<UserDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [forbidden, setForbidden] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);

    useEffect(() => {
        params.then(p => {
            setUserId(p.userId);
        });
    }, [params]);

    useEffect(() => {
        if (!session?.user || !userId) return;

        fetchUserDetails();
    }, [session, userId]);

    async function fetchUserDetails() {
        if (!userId) return;

        try {
            const response = await fetch(`/api/admin/users/${userId}`);
            if (response.status === 403) {
                setForbidden(true);
                setLoading(false);
                return;
            }
            if (!response.ok) {
                throw new Error('Failed to fetch user details');
            }
            const data = await response.json();
            setUser(data);
        } catch (err: any) {
            setError(err.message);
            console.error(err);
        } finally {
            setLoading(false);
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

    if (!user) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-white mb-4">User Not Found</h1>
                    <Link href="/profile/admin/users" className="text-[#00d4ff] hover:text-[#0099cc]">
                        ← Back to Users
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
                        href="/profile/admin/users"
                        className="text-[#00d4ff] hover:text-[#0099cc] text-sm mb-4 inline-block"
                    >
                        ← Back to Users
                    </Link>
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-white mb-2">
                                {user.username || user.email || 'User Details'}
                            </h1>
                            <p className="text-gray-400 text-sm">User ID: {user.id}</p>
                        </div>
                        <span
                            className={`px-4 py-2 rounded font-semibold ${
                                user.role === 'SUPER_ADMIN'
                                    ? 'bg-[rgba(0,255,65,0.2)] text-[#00ff41]'
                                    : user.role === 'ADMIN'
                                      ? 'bg-[rgba(0,212,255,0.2)] text-[#00d4ff]'
                                      : 'bg-gray-700 text-gray-300'
                            }`}
                        >
                            {user.role.replace('_', ' ')}
                        </span>
                    </div>
                </div>

                {error && (
                    <div className="mb-4 p-4 bg-red-500/10 border border-red-500/50 rounded text-red-400 text-sm">
                        {error}
                    </div>
                )}

                {/* Stats Overview */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                    <div className="bg-[#111528] border border-gray-700 rounded p-4">
                        <p className="text-gray-400 text-sm">Owned Communities</p>
                        <p className="text-2xl font-bold text-[#00ff41]">{user._count.ownedCommunities}</p>
                    </div>
                    <div className="bg-[#111528] border border-gray-700 rounded p-4">
                        <p className="text-gray-400 text-sm">Member Of</p>
                        <p className="text-2xl font-bold text-[#00d4ff]">{user._count.communityMembers}</p>
                    </div>
                    <div className="bg-[#111528] border border-gray-700 rounded p-4">
                        <p className="text-gray-400 text-sm">Reviews</p>
                        <p className="text-2xl font-bold text-white">{user._count.reviews}</p>
                    </div>
                    <div className="bg-[#111528] border border-gray-700 rounded p-4">
                        <p className="text-gray-400 text-sm">Audit Logs</p>
                        <p className="text-2xl font-bold text-white">{user._count.auditLogs}</p>
                    </div>
                    <div className="bg-[#111528] border border-gray-700 rounded p-4">
                        <p className="text-gray-400 text-sm">Admin Actions</p>
                        <p className="text-2xl font-bold text-white">{user._count.superAdminLogs}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* User Info */}
                    <div className="bg-[#111528] border border-gray-700 rounded p-6">
                        <h2 className="text-lg font-bold text-white mb-4">User Information</h2>
                        <dl className="space-y-3">
                            <div>
                                <dt className="text-sm text-gray-400">Email</dt>
                                <dd className="text-white font-semibold">{user.email || 'N/A'}</dd>
                            </div>
                            <div>
                                <dt className="text-sm text-gray-400">Username</dt>
                                <dd className="text-white font-semibold">{user.username || 'N/A'}</dd>
                            </div>
                            <div>
                                <dt className="text-sm text-gray-400">Discord</dt>
                                <dd className="text-white font-semibold">{user.discordUsername || 'Not connected'}</dd>
                            </div>
                            <div>
                                <dt className="text-sm text-gray-400">Discord ID</dt>
                                <dd className="text-gray-300 font-mono text-xs">{user.discordId || 'N/A'}</dd>
                            </div>
                            <div>
                                <dt className="text-sm text-gray-400">Joined</dt>
                                <dd className="text-white">{new Date(user.createdAt).toLocaleString()}</dd>
                            </div>
                            <div>
                                <dt className="text-sm text-gray-400">Last Updated</dt>
                                <dd className="text-white">{new Date(user.updatedAt).toLocaleString()}</dd>
                            </div>
                        </dl>
                    </div>

                    {/* Owned Communities */}
                    <div className="bg-[#111528] border border-gray-700 rounded p-6">
                        <h2 className="text-lg font-bold text-white mb-4">Owned Communities</h2>
                        {user.ownedCommunities.length === 0 ? (
                            <p className="text-gray-400">No owned communities</p>
                        ) : (
                            <div className="space-y-3">
                                {user.ownedCommunities.map(community => (
                                    <div key={community.id} className="p-3 bg-[#0a0e27] border border-gray-800 rounded">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <Link
                                                    href={`/communities/${community.slug}`}
                                                    className="font-semibold text-[#00ff41] hover:text-[#00dd33]"
                                                >
                                                    {community.name}
                                                </Link>
                                                <p className="text-xs text-gray-400 mt-1">
                                                    {community._count.members} members • {community._count.events}{' '}
                                                    events
                                                </p>
                                            </div>
                                            {community.subscription && (
                                                <span className="text-xs px-2 py-1 bg-gray-700 text-gray-300 rounded">
                                                    {community.subscription.tier}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Community Memberships */}
                <div className="bg-[#111528] border border-gray-700 rounded p-6 mt-6">
                    <h2 className="text-lg font-bold text-white mb-4">Community Memberships</h2>
                    {user.communityMembers.length === 0 ? (
                        <p className="text-gray-400">Not a member of any communities</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-900 border-b border-gray-700">
                                    <tr>
                                        <th className="px-4 py-2 text-left text-white">Community</th>
                                        <th className="px-4 py-2 text-left text-white">Owner</th>
                                        <th className="px-4 py-2 text-left text-white">Role</th>
                                        <th className="px-4 py-2 text-left text-white">Joined</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {user.communityMembers.map(member => (
                                        <tr key={member.id} className="border-b border-gray-800">
                                            <td className="px-4 py-2">
                                                <Link
                                                    href={`/communities/${member.community.slug}`}
                                                    className="text-[#00d4ff] hover:text-[#0099cc]"
                                                >
                                                    {member.community.name}
                                                </Link>
                                            </td>
                                            <td className="px-4 py-2 text-gray-300">
                                                {member.community.owner.username || 'Unknown'}
                                            </td>
                                            <td className="px-4 py-2">
                                                <span
                                                    className={`px-2 py-1 rounded text-xs ${
                                                        member.role === 'OWNER'
                                                            ? 'bg-[rgba(0,255,65,0.2)] text-[#00ff41]'
                                                            : member.role === 'ADMIN'
                                                              ? 'bg-[rgba(0,212,255,0.2)] text-[#00d4ff]'
                                                              : 'bg-gray-700 text-gray-300'
                                                    }`}
                                                >
                                                    {member.role}
                                                </span>
                                            </td>
                                            <td className="px-4 py-2 text-gray-400 text-xs">
                                                {new Date(member.createdAt).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Recent Activity */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                    {/* Reviews */}
                    <div className="bg-[#111528] border border-gray-700 rounded p-6">
                        <h2 className="text-lg font-bold text-white mb-4">Recent Reviews</h2>
                        {user.reviews.length === 0 ? (
                            <p className="text-gray-400">No reviews</p>
                        ) : (
                            <div className="space-y-3">
                                {user.reviews.slice(0, 5).map(review => (
                                    <div key={review.id} className="p-3 bg-[#0a0e27] border border-gray-800 rounded">
                                        <div className="flex items-start justify-between mb-2">
                                            <Link
                                                href={`/communities/${review.community.slug}`}
                                                className="text-sm font-semibold text-[#00d4ff] hover:text-[#0099cc]"
                                            >
                                                {review.community.name}
                                            </Link>
                                            <div className="flex items-center gap-1">
                                                <span className="text-yellow-500">★</span>
                                                <span className="text-white text-sm font-semibold">
                                                    {review.rating}
                                                </span>
                                            </div>
                                        </div>
                                        {review.comment && <p className="text-gray-300 text-sm">{review.comment}</p>}
                                        <p className="text-gray-500 text-xs mt-2">
                                            {new Date(review.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Audit Logs */}
                    <div className="bg-[#111528] border border-gray-700 rounded p-6">
                        <h2 className="text-lg font-bold text-white mb-4">Recent Activity</h2>
                        {user.auditLogs.length === 0 ? (
                            <p className="text-gray-400">No recent activity</p>
                        ) : (
                            <div className="space-y-2">
                                {user.auditLogs.slice(0, 10).map(log => (
                                    <div key={log.id} className="flex items-start gap-3 pb-2 border-b border-gray-800">
                                        <div className="w-2 h-2 rounded-full bg-[#00ff41] mt-2"></div>
                                        <div className="flex-1">
                                            <p className="text-white text-sm">{log.action}</p>
                                            <p className="text-xs text-gray-400">
                                                {log.community.name} • {new Date(log.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
