'use client';

import { useEffect, useState } from 'react';
import { CommunityMember, User } from '@prisma/client';
import { ChevronDown } from 'lucide-react';

interface CommunityMemberWithUser extends CommunityMember {
    isWhitelisted: boolean;
    isBlacklisted: boolean;
    whitelistReason: string | null;
    blacklistReason: string | null;
    whitelistedAt: Date | null;
    blacklistedAt: Date | null;
    user: User & {
        wallets?: { walletAddress: string }[];
    };
}

interface UserManagementPanelProps {
    communityId: string;
    onActionComplete?: () => void;
}

interface DiscordRole {
    id: string;
    name: string;
    color: string | null;
}

/**
 * UserManagementPanel - Community admin component for managing user whitelist/blacklist
 * Allows filtering, searching, and bulk actions on community members
 */
export default function UserManagementPanel({ communityId, onActionComplete }: UserManagementPanelProps) {
    const [members, setMembers] = useState<CommunityMemberWithUser[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());
    const [filter, setFilter] = useState<'ALL' | 'WHITELISTED' | 'BLACKLISTED' | 'NORMAL'>('ALL');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [actionInProgress, setActionInProgress] = useState(false);
    const [actionReason, setActionReason] = useState('');
    const [bulkAction, setBulkAction] = useState<'WHITELIST' | 'BLACKLIST' | null>(null);
    const [discordRoles, setDiscordRoles] = useState<Record<string, DiscordRole[]>>({});
    const [rolesLoading, setRolesLoading] = useState(false);

    // Fetch members
    const fetchMembers = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                filter,
                search,
                page: String(page),
                limit: '20',
            });

            const response = await fetch(`/api/communities/${communityId}/members?${params}`);
            if (!response.ok) throw new Error('Failed to fetch members');

            const data = await response.json();
            setMembers(data.data || []);
            setTotalPages(data.pagination?.totalPages || 1);
        } catch (error) {
            console.error('Error fetching members:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setPage(1); // Reset to first page when filter changes
    }, [filter, search]);

    useEffect(() => {
        fetchMembers();
    }, [filter, search, page]);

    const syncDiscordRoles = async () => {
        setRolesLoading(true);
        try {
            const userIds = members.filter(member => member.user.discordId).map(member => member.userId);

            if (userIds.length === 0) {
                setDiscordRoles({});
                return;
            }

            const response = await fetch(`/api/communities/${communityId}/members/discord-roles`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userIds }),
            });

            if (!response.ok) {
                throw new Error('Failed to sync Discord roles');
            }

            const data = await response.json();
            setDiscordRoles(data.rolesByUserId || {});
        } catch (error) {
            console.error('Error syncing Discord roles:', error);
            alert('Failed to sync Discord roles. Please try again.');
        } finally {
            setRolesLoading(false);
        }
    };

    // Handle member selection
    const toggleMemberSelection = (memberId: string) => {
        const newSelected = new Set(selectedMembers);
        if (newSelected.has(memberId)) {
            newSelected.delete(memberId);
        } else {
            newSelected.add(memberId);
        }
        setSelectedMembers(newSelected);
    };

    // Select/deselect all
    const toggleSelectAll = () => {
        if (selectedMembers.size === members.length) {
            setSelectedMembers(new Set());
        } else {
            setSelectedMembers(new Set(members.map(m => m.id)));
        }
    };

    // Handle bulk action
    const handleBulkAction = async () => {
        if (!bulkAction || selectedMembers.size === 0 || !actionReason.trim()) {
            alert('Please select members and provide a reason');
            return;
        }

        setActionInProgress(true);
        try {
            const selectedUserIds: string[] = [];
            members.forEach(m => {
                if (selectedMembers.has(m.id)) {
                    selectedUserIds.push(m.userId);
                }
            });

            for (const userId of selectedUserIds) {
                const endpoint = bulkAction === 'WHITELIST' ? 'whitelist' : 'blacklist';
                const response = await fetch(`/api/communities/${communityId}/members/${userId}/${endpoint}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ reason: actionReason }),
                });

                if (!response.ok) {
                    throw new Error(`Failed to ${bulkAction.toLowerCase()}`);
                }
            }

            // Success
            setSelectedMembers(new Set());
            setActionReason('');
            setBulkAction(null);
            fetchMembers();
            onActionComplete?.();
        } catch (error) {
            console.error('Error performing bulk action:', error);
            alert('Failed to perform action. Please try again.');
        } finally {
            setActionInProgress(false);
        }
    };

    // Handle individual action
    const handleIndividualAction = async (userId: string, action: 'WHITELIST' | 'BLACKLIST', reason: string) => {
        if (!reason.trim()) {
            alert('Please provide a reason');
            return;
        }

        try {
            const endpoint = action === 'WHITELIST' ? 'whitelist' : 'blacklist';
            const response = await fetch(`/api/communities/${communityId}/members/${userId}/${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason }),
            });

            if (!response.ok) throw new Error('Failed to perform action');

            fetchMembers();
            onActionComplete?.();
        } catch (error) {
            console.error('Error:', error);
            alert('Failed to perform action');
        }
    };

    // Handle remove whitelist/blacklist
    const handleRemoveStatus = async (userId: string, status: 'whitelist' | 'blacklist') => {
        try {
            const response = await fetch(`/api/communities/${communityId}/members/${userId}/remove-${status}`, {
                method: 'POST',
            });

            if (!response.ok) throw new Error('Failed to remove status');

            fetchMembers();
            onActionComplete?.();
        } catch (error) {
            console.error('Error:', error);
            alert('Failed to remove status');
        }
    };

    return (
        <div className="space-y-6 rounded-lg border border-[rgba(0,255,65,0.1)] bg-[#111528] p-6">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-white">Member Management</h2>
                <p className="mt-2 text-sm text-gray-400">Whitelist and blacklist community members</p>
            </div>

            {/* Filters */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                {/* Search */}
                <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-300 mb-2">Search</label>
                    <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Username, email, or wallet..."
                        className="w-full rounded-lg border border-[#00d4ff] bg-[#0a0e27] px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-[#00ff41]"
                    />
                </div>

                {/* Filter */}
                <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
                    <select
                        value={filter}
                        onChange={e => {
                            const value = e.target.value;
                            if (
                                value === 'ALL' ||
                                value === 'NORMAL' ||
                                value === 'WHITELISTED' ||
                                value === 'BLACKLISTED'
                            ) {
                                setFilter(value);
                            }
                        }}
                        className="w-full rounded-lg border border-[#00d4ff] bg-[#0a0e27] px-4 py-2 text-white focus:outline-none focus:border-[#00ff41]"
                    >
                        <option value="ALL">All Members</option>
                        <option value="NORMAL">Normal</option>
                        <option value="WHITELISTED">Whitelisted</option>
                        <option value="BLACKLISTED">Blacklisted</option>
                    </select>
                </div>

                <div className="flex items-end">
                    <button
                        type="button"
                        onClick={syncDiscordRoles}
                        disabled={rolesLoading || members.length === 0}
                        className="rounded-lg border border-[#00d4ff] bg-[#0a0e27] px-4 py-2 text-sm font-medium text-[#00d4ff] hover:border-[#00ff41] hover:text-[#00ff41] disabled:opacity-50"
                    >
                        {rolesLoading ? 'Syncing Roles...' : 'Sync Discord Roles'}
                    </button>
                </div>
            </div>

            {/* Bulk Actions */}
            {selectedMembers.size > 0 && (
                <div className="rounded-lg border border-[#00d4ff] bg-[rgba(0,212,255,0.05)] p-4">
                    <div className="mb-4 flex items-center justify-between">
                        <div className="text-sm font-medium text-white">{selectedMembers.size} member(s) selected</div>
                        <button
                            onClick={() => setSelectedMembers(new Set())}
                            className="text-sm text-gray-400 hover:text-gray-300"
                        >
                            Clear
                        </button>
                    </div>

                    {bulkAction && (
                        <div className="space-y-3">
                            <textarea
                                value={actionReason}
                                onChange={e => setActionReason(e.target.value)}
                                placeholder="Reason for this action..."
                                className="w-full rounded-lg border border-[#00d4ff] bg-[#0a0e27] px-4 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-[#00ff41]"
                                rows={3}
                            />
                            <div className="flex gap-2">
                                <button
                                    onClick={handleBulkAction}
                                    disabled={actionInProgress}
                                    className={`flex-1 rounded-lg px-4 py-2 font-medium text-white transition-all ${
                                        bulkAction === 'WHITELIST'
                                            ? 'bg-[#00ff41] text-[#0a0e27] hover:bg-[#00dd33]'
                                            : 'bg-red-600 hover:bg-red-700'
                                    } ${actionInProgress ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    {actionInProgress ? 'Processing...' : `Confirm ${bulkAction}`}
                                </button>
                                <button
                                    onClick={() => {
                                        setBulkAction(null);
                                        setActionReason('');
                                    }}
                                    className="rounded-lg border border-gray-600 px-4 py-2 font-medium text-gray-300 hover:bg-gray-800"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}

                    {!bulkAction && (
                        <div className="flex gap-2">
                            <button
                                onClick={() => setBulkAction('WHITELIST')}
                                className="flex-1 rounded-lg bg-[#00ff41] px-4 py-2 font-medium text-[#0a0e27] hover:bg-[#00dd33] transition-all"
                            >
                                Whitelist Selected
                            </button>
                            <button
                                onClick={() => setBulkAction('BLACKLIST')}
                                className="flex-1 rounded-lg bg-red-600 px-4 py-2 font-medium text-white hover:bg-red-700 transition-all"
                            >
                                Blacklist Selected
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Members Table */}
            <div className="overflow-x-auto">
                {loading ? (
                    <div className="py-8 text-center text-gray-400">Loading members...</div>
                ) : members.length === 0 ? (
                    <div className="py-8 text-center text-gray-400">No members found</div>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-[rgba(0,255,65,0.1)]">
                                <th className="px-4 py-3 text-left">
                                    <input
                                        type="checkbox"
                                        checked={selectedMembers.size === members.length && members.length > 0}
                                        onChange={toggleSelectAll}
                                        className="h-4 w-4 accent-[#00ff41]"
                                    />
                                </th>
                                <th className="px-4 py-3 text-left font-medium text-gray-300">Username</th>
                                <th className="px-4 py-3 text-left font-medium text-gray-300">Email</th>
                                <th className="px-4 py-3 text-left font-medium text-gray-300">Status</th>
                                <th className="px-4 py-3 text-left font-medium text-gray-300">Discord Roles</th>
                                <th className="px-4 py-3 text-left font-medium text-gray-300">Reason</th>
                                <th className="px-4 py-3 text-left font-medium text-gray-300">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {members.map(member => (
                                <MemberRow
                                    key={member.id}
                                    member={member}
                                    roles={discordRoles[member.userId] || []}
                                    isSelected={selectedMembers.has(member.id)}
                                    onToggleSelect={() => toggleMemberSelection(member.id)}
                                    onWhitelist={(reason: string) =>
                                        handleIndividualAction(member.userId, 'WHITELIST', reason)
                                    }
                                    onBlacklist={(reason: string) =>
                                        handleIndividualAction(member.userId, 'BLACKLIST', reason)
                                    }
                                    onRemoveWhitelist={() => handleRemoveStatus(member.userId, 'whitelist')}
                                    onRemoveBlacklist={() => handleRemoveStatus(member.userId, 'blacklist')}
                                />
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <button
                        onClick={() => setPage(Math.max(1, page - 1))}
                        disabled={page === 1}
                        className="rounded-lg border border-gray-600 px-4 py-2 text-gray-300 hover:bg-gray-800 disabled:opacity-50"
                    >
                        Previous
                    </button>
                    <span className="text-sm text-gray-400">
                        Page {page} of {totalPages}
                    </span>
                    <button
                        onClick={() => setPage(Math.min(totalPages, page + 1))}
                        disabled={page === totalPages}
                        className="rounded-lg border border-gray-600 px-4 py-2 text-gray-300 hover:bg-gray-800 disabled:opacity-50"
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
}

/**
 * Individual member row with action dropdown
 */
function MemberRow({
    member,
    roles,
    isSelected,
    onToggleSelect,
    onWhitelist,
    onBlacklist,
    onRemoveWhitelist,
    onRemoveBlacklist,
}: {
    member: CommunityMemberWithUser;
    roles: DiscordRole[];
    isSelected: boolean;
    onToggleSelect: () => void;
    onWhitelist: (reason: string) => void;
    onBlacklist: (reason: string) => void;
    onRemoveWhitelist: () => void;
    onRemoveBlacklist: () => void;
}) {
    const [showMenu, setShowMenu] = useState(false);
    const [showReasonModal, setShowReasonModal] = useState<'WHITELIST' | 'BLACKLIST' | null>(null);
    const [reason, setReason] = useState('');

    const status = member.isWhitelisted ? 'WHITELISTED' : member.isBlacklisted ? 'BLACKLISTED' : 'NORMAL';
    const statusColor =
        status === 'WHITELISTED' ? 'text-[#00ff41]' : status === 'BLACKLISTED' ? 'text-red-400' : 'text-gray-400';

    const handleAction = (action: 'WHITELIST' | 'BLACKLIST') => {
        if (reason.trim()) {
            action === 'WHITELIST' ? onWhitelist(reason) : onBlacklist(reason);
            setReason('');
            setShowReasonModal(null);
            setShowMenu(false);
        }
    };

    return (
        <>
            <tr className="border-b border-[rgba(0,255,65,0.05)] hover:bg-[rgba(0,255,65,0.03)]">
                <td className="px-4 py-3">
                    <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={onToggleSelect}
                        className="h-4 w-4 accent-[#00ff41]"
                    />
                </td>
                <td className="px-4 py-3 text-white font-medium">{member.user.username || 'Unknown'}</td>
                <td className="px-4 py-3 text-gray-400 text-xs">{member.user.email || '-'}</td>
                <td className={`px-4 py-3 font-medium text-xs ${statusColor}`}>{status}</td>
                <td className="px-4 py-3">
                    {roles.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                            {roles.map(role => (
                                <span
                                    key={role.id}
                                    className="rounded border border-[#00d4ff]/40 bg-[#0a0e27] px-2 py-0.5 text-xs text-[#00d4ff]"
                                >
                                    {role.name}
                                </span>
                            ))}
                        </div>
                    ) : (
                        <span className="text-xs text-gray-500">-</span>
                    )}
                </td>
                <td className="px-4 py-3 text-gray-400 text-xs max-w-xs truncate">
                    {member.isWhitelisted
                        ? member.whitelistReason
                        : member.isBlacklisted
                          ? member.blacklistReason
                          : '-'}
                </td>
                <td className="px-4 py-3">
                    <div className="relative">
                        <button
                            onClick={() => setShowMenu(!showMenu)}
                            className="rounded-lg border border-gray-600 bg-[#0a0e27] p-2 hover:bg-gray-800"
                        >
                            <ChevronDown className="h-4 w-4" />
                        </button>

                        {showMenu && (
                            <div className="absolute right-0 mt-2 w-40 rounded-lg border border-[rgba(0,255,65,0.1)] bg-[#111528] shadow-lg z-10">
                                {status !== 'WHITELISTED' && (
                                    <button
                                        onClick={() => {
                                            setShowReasonModal('WHITELIST');
                                            setShowMenu(false);
                                        }}
                                        className="block w-full px-4 py-2 text-left text-sm text-[#00ff41] hover:bg-[rgba(0,255,65,0.1)]"
                                    >
                                        Whitelist
                                    </button>
                                )}
                                {status !== 'BLACKLISTED' && (
                                    <button
                                        onClick={() => {
                                            setShowReasonModal('BLACKLIST');
                                            setShowMenu(false);
                                        }}
                                        className="block w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-[rgba(255,0,0,0.1)]"
                                    >
                                        Blacklist
                                    </button>
                                )}
                                {status === 'WHITELISTED' && (
                                    <button
                                        onClick={() => {
                                            onRemoveWhitelist();
                                            setShowMenu(false);
                                        }}
                                        className="block w-full px-4 py-2 text-left text-sm text-gray-400 hover:bg-gray-800"
                                    >
                                        Remove Whitelist
                                    </button>
                                )}
                                {status === 'BLACKLISTED' && (
                                    <button
                                        onClick={() => {
                                            onRemoveBlacklist();
                                            setShowMenu(false);
                                        }}
                                        className="block w-full px-4 py-2 text-left text-sm text-gray-400 hover:bg-gray-800"
                                    >
                                        Remove Blacklist
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </td>
            </tr>

            {/* Reason Modal */}
            {showReasonModal && (
                <tr>
                    <td colSpan={7} className="px-4 py-4 bg-[rgba(0,255,65,0.05)]">
                        <div className="space-y-3">
                            <p className="text-sm text-gray-300 font-medium">
                                {showReasonModal === 'WHITELIST' ? 'Whitelist' : 'Blacklist'} reason:
                            </p>
                            <textarea
                                value={reason}
                                onChange={e => setReason(e.target.value)}
                                placeholder="Required reason..."
                                className="w-full rounded-lg border border-[#00d4ff] bg-[#0a0e27] px-4 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-[#00ff41]"
                                rows={2}
                            />
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleAction(showReasonModal)}
                                    className={`flex-1 rounded-lg px-4 py-2 font-medium text-white transition-all ${
                                        showReasonModal === 'WHITELIST'
                                            ? 'bg-[#00ff41] text-[#0a0e27] hover:bg-[#00dd33]'
                                            : 'bg-red-600 hover:bg-red-700'
                                    }`}
                                >
                                    Confirm
                                </button>
                                <button
                                    onClick={() => {
                                        setShowReasonModal(null);
                                        setReason('');
                                    }}
                                    className="flex-1 rounded-lg border border-gray-600 px-4 py-2 font-medium text-gray-300 hover:bg-gray-800"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </td>
                </tr>
            )}
        </>
    );
}
