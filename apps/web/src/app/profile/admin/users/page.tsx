'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

interface User {
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
    }>;
    communityMembers: Array<{
        id: string;
        role: string;
        community: {
            id: string;
            name: string;
            slug: string;
        };
    }>;
    _count: {
        ownedCommunities: number;
        communityMembers: number;
        reviews: number;
        auditLogs: number;
    };
}

export default function UsersManagementPage() {
    const { data: session } = useSession();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [forbidden, setForbidden] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState<string>('ALL');
    const [editingUserId, setEditingUserId] = useState<string | null>(null);
    const [editRole, setEditRole] = useState<'SUPER_ADMIN' | 'ADMIN' | 'MEMBER'>('MEMBER');

    useEffect(() => {
        if (!session?.user) return;

        fetchUsers();
    }, [session]);

    async function fetchUsers() {
        try {
            const response = await fetch('/api/admin/users');
            if (response.status === 403) {
                setForbidden(true);
                setLoading(false);
                return;
            }
            if (!response.ok) {
                throw new Error('Failed to fetch users');
            }
            const data = await response.json();
            setUsers(data);
        } catch (err: any) {
            setError(err.message);
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    async function updateUserRole(userId: string, newRole: 'SUPER_ADMIN' | 'ADMIN' | 'MEMBER') {
        if (!confirm(`Are you sure you want to change this user's role to ${newRole}?`)) {
            return;
        }

        setError(null);

        try {
            const response = await fetch(`/api/admin/users/${userId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role: newRole }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to update user');
            }

            await fetchUsers();
            setEditingUserId(null);
        } catch (err: any) {
            setError(err.message);
        }
    }

    async function deleteUser(userId: string, username: string | null) {
        const displayName = username || 'this user';
        if (!confirm(`Are you sure you want to delete "${displayName}"? This cannot be undone.`)) {
            return;
        }

        setError(null);

        try {
            const response = await fetch(`/api/admin/users/${userId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || data.error || 'Failed to delete user');
            }

            await fetchUsers();
        } catch (err: any) {
            setError(err.message);
        }
    }

    // Filter users
    const filteredUsers = users.filter(user => {
        const matchesSearch =
            searchQuery === '' ||
            user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.discordUsername?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesRole = roleFilter === 'ALL' || user.role === roleFilter;

        return matchesSearch && matchesRole;
    });

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
                    <h1 className="text-2xl font-bold text-white mb-2">User Management</h1>
                    <p className="text-gray-400 text-sm">View and manage all users on the platform</p>
                </div>

                {error && (
                    <div className="mb-4 p-4 bg-red-500/10 border border-red-500/50 rounded text-red-400 text-sm">
                        {error}
                    </div>
                )}

                {/* Filters */}
                <div className="mb-6 flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                        <input
                            type="text"
                            placeholder="Search by email, username, or Discord..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full px-4 py-2 bg-[#111528] border border-gray-700 rounded text-white placeholder-gray-500 focus:outline-none focus:border-[#00d4ff]"
                        />
                    </div>
                    <div>
                        <select
                            value={roleFilter}
                            onChange={e => setRoleFilter(e.target.value)}
                            className="px-4 py-2 bg-[#111528] border border-gray-700 rounded text-white focus:outline-none focus:border-[#00d4ff]"
                        >
                            <option value="ALL">All Roles</option>
                            <option value="SUPER_ADMIN">Super Admin</option>
                            <option value="ADMIN">Admin</option>
                            <option value="MEMBER">Member</option>
                        </select>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
                    <div className="bg-[#111528] border border-gray-700 rounded p-4">
                        <p className="text-gray-400 text-sm">Total Users</p>
                        <p className="text-2xl font-bold text-white">{users.length}</p>
                    </div>
                    <div className="bg-[#111528] border border-gray-700 rounded p-4">
                        <p className="text-gray-400 text-sm">Super Admins</p>
                        <p className="text-2xl font-bold text-[#00ff41]">
                            {users.filter(u => u.role === 'SUPER_ADMIN').length}
                        </p>
                    </div>
                    <div className="bg-[#111528] border border-gray-700 rounded p-4">
                        <p className="text-gray-400 text-sm">Admins</p>
                        <p className="text-2xl font-bold text-[#00d4ff]">
                            {users.filter(u => u.role === 'ADMIN').length}
                        </p>
                    </div>
                    <div className="bg-[#111528] border border-gray-700 rounded p-4">
                        <p className="text-gray-400 text-sm">Members</p>
                        <p className="text-2xl font-bold text-white">{users.filter(u => u.role === 'MEMBER').length}</p>
                    </div>
                </div>

                {/* Users Table */}
                {filteredUsers.length === 0 ? (
                    <div className="text-center py-12 bg-[#111528] rounded border border-gray-700">
                        <p className="text-gray-400">No users found</p>
                    </div>
                ) : (
                    <div className="bg-[#111528] rounded border border-gray-700 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-900 border-b border-gray-700">
                                    <tr>
                                        <th className="px-6 py-3 text-left font-semibold text-white">User</th>
                                        <th className="px-6 py-3 text-left font-semibold text-white">Role</th>
                                        <th className="px-6 py-3 text-left font-semibold text-white">Discord</th>
                                        <th className="px-6 py-3 text-left font-semibold text-white">
                                            Owned Communities
                                        </th>
                                        <th className="px-6 py-3 text-left font-semibold text-white">Member Of</th>
                                        <th className="px-6 py-3 text-left font-semibold text-white">Joined</th>
                                        <th className="px-6 py-3 text-right font-semibold text-white">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredUsers.map(user => (
                                        <tr key={user.id} className="border-b border-gray-800 hover:bg-gray-900/50">
                                            <td className="px-6 py-4">
                                                <div>
                                                    <div className="font-semibold text-white">
                                                        {user.username || 'No username'}
                                                    </div>
                                                    <div className="text-xs text-gray-400">{user.email}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {editingUserId === user.id ? (
                                                    <div className="flex items-center gap-2">
                                                        <select
                                                            value={editRole}
                                                            onChange={e =>
                                                                setEditRole(
                                                                    e.target.value as
                                                                        | 'SUPER_ADMIN'
                                                                        | 'ADMIN'
                                                                        | 'MEMBER',
                                                                )
                                                            }
                                                            className="px-2 py-1 bg-[#0a0e27] border border-gray-700 rounded text-white text-xs"
                                                        >
                                                            <option value="SUPER_ADMIN">Super Admin</option>
                                                            <option value="ADMIN">Admin</option>
                                                            <option value="MEMBER">Member</option>
                                                        </select>
                                                        <button
                                                            onClick={() => updateUserRole(user.id, editRole)}
                                                            className="px-2 py-1 bg-[#00ff41] text-[#0a0e27] rounded text-xs font-semibold hover:bg-[#00dd33]"
                                                        >
                                                            Save
                                                        </button>
                                                        <button
                                                            onClick={() => setEditingUserId(null)}
                                                            className="px-2 py-1 bg-gray-700 text-white rounded text-xs hover:bg-gray-600"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span
                                                        className={`px-2 py-1 rounded text-xs font-semibold ${
                                                            user.role === 'SUPER_ADMIN'
                                                                ? 'bg-[rgba(0,255,65,0.2)] text-[#00ff41]'
                                                                : user.role === 'ADMIN'
                                                                  ? 'bg-[rgba(0,212,255,0.2)] text-[#00d4ff]'
                                                                  : 'bg-gray-700 text-gray-300'
                                                        }`}
                                                    >
                                                        {user.role.replace('_', ' ')}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                {user.discordUsername ? (
                                                    <div className="text-white">{user.discordUsername}</div>
                                                ) : (
                                                    <div className="text-gray-500 text-xs">Not connected</div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-white font-semibold">
                                                    {user._count.ownedCommunities}
                                                </div>
                                                {user.ownedCommunities.length > 0 && (
                                                    <div className="text-xs text-gray-400">
                                                        {user.ownedCommunities
                                                            .slice(0, 2)
                                                            .map(c => c.name)
                                                            .join(', ')}
                                                        {user.ownedCommunities.length > 2 && '...'}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-white font-semibold">
                                                    {user._count.communityMembers}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-gray-400 text-xs">
                                                {new Date(user.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Link
                                                        href={`/profile/admin/users/${user.id}`}
                                                        className="px-3 py-1 bg-[#00d4ff] text-[#0a0e27] rounded text-xs font-semibold hover:bg-[#0099cc]"
                                                    >
                                                        View
                                                    </Link>
                                                    {editingUserId !== user.id && (
                                                        <button
                                                            onClick={() => {
                                                                setEditingUserId(user.id);
                                                                setEditRole(user.role);
                                                            }}
                                                            className="px-3 py-1 bg-gray-700 text-white rounded text-xs hover:bg-gray-600"
                                                        >
                                                            Edit Role
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => deleteUser(user.id, user.username)}
                                                        disabled={user._count.ownedCommunities > 0}
                                                        className="px-3 py-1 bg-red-500/20 text-red-400 rounded text-xs hover:bg-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                                                        title={
                                                            user._count.ownedCommunities > 0
                                                                ? 'Cannot delete user who owns communities'
                                                                : 'Delete user'
                                                        }
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
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
