import Link from 'next/link';
import type { AdminEventListItem } from '@/types/events';
import type { Whitelist } from '@/hooks/useAdminPageState';

interface PresaleSummary {
    id: string;
    name: string;
    description?: string | null;
    status: string;
    createdAt: string;
}

interface MemberSummary {
    id: string;
    role: 'OWNER' | 'ADMIN' | 'MODERATOR' | 'MEMBER';
    createdAt: string;
    user: {
        id: string;
        email: string | null;
        discordId: string | null;
        username?: string | null;
        discordUsername?: string | null;
    };
}

interface OverviewTabProps {
    slug: string;
    whitelists: Whitelist[];
    giveaways: AdminEventListItem[];
    presales: PresaleSummary[];
    members: MemberSummary[];
    memberCount: number;
    isLoadingGiveaways: boolean;
    isLoadingPresales: boolean;
    isLoadingMembers: boolean;
}

const formatDate = (value?: string | null) => {
    if (!value) return 'TBD';
    return new Date(value).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
    });
};

export function OverviewTab({
    slug,
    whitelists,
    giveaways,
    presales,
    members,
    memberCount,
    isLoadingGiveaways,
    isLoadingPresales,
    isLoadingMembers,
}: OverviewTabProps) {
    const activeWhitelists = whitelists.filter(item => item.status === 'ACTIVE');
    const activeGiveaways = giveaways.filter(item => item.status === 'ACTIVE');
    const activePresales = presales.filter(item => item.status === 'ACTIVE');
    const recentWhitelists = whitelists.slice(0, 3);
    const recentGiveaways = giveaways.slice(0, 3);
    const recentPresales = presales.slice(0, 3);
    const recentMembers = members.slice(0, 5);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="bg-[#111528] border border-[rgba(0,255,65,0.15)] rounded p-4">
                    <p className="text-gray-400 text-xs font-semibold uppercase mb-2">Active Whitelists</p>
                    <div className="flex items-start justify-between">
                        <p className="text-3xl font-bold text-white">{activeWhitelists.length}</p>
                        <span className="text-[#00ff41] text-xs">Total {whitelists.length}</span>
                    </div>
                </div>
                <div className="bg-[#111528] border border-[rgba(0,255,65,0.15)] rounded p-4">
                    <p className="text-gray-400 text-xs font-semibold uppercase mb-2">Active Giveaways</p>
                    <div className="flex items-start justify-between">
                        <p className="text-3xl font-bold text-white">{activeGiveaways.length}</p>
                        <span className="text-[#00ff41] text-xs">Total {giveaways.length}</span>
                    </div>
                </div>
                <div className="bg-[#111528] border border-[rgba(0,255,65,0.15)] rounded p-4">
                    <p className="text-gray-400 text-xs font-semibold uppercase mb-2">Presales</p>
                    <div className="flex items-start justify-between">
                        <p className="text-3xl font-bold text-white">{activePresales.length}</p>
                        <span className="text-[#00ff41] text-xs">Total {presales.length}</span>
                    </div>
                </div>
                <div className="bg-[#111528] border border-[rgba(0,255,65,0.15)] rounded p-4">
                    <p className="text-gray-400 text-xs font-semibold uppercase mb-2">Members</p>
                    <div className="flex items-start justify-between">
                        <p className="text-3xl font-bold text-white">{memberCount.toLocaleString()}</p>
                        <span className="text-[#00ff41] text-xs">Active community</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-900/40 border border-gray-700 rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-sm font-bold text-white">Whitelists</h3>
                            <p className="text-gray-400 text-xs mt-1">Recent activity and upcoming closures.</p>
                        </div>
                        <Link
                            href={`/profile/communities/${slug}/admin/whitelists`}
                            className="text-xs text-[#00d4ff] hover:text-[#0099cc]"
                        >
                            View all
                        </Link>
                    </div>
                    {recentWhitelists.length === 0 ? (
                        <p className="text-gray-500 text-xs">No whitelists yet. Create your first whitelist.</p>
                    ) : (
                        <div className="space-y-2">
                            {recentWhitelists.map(whitelist => (
                                <div
                                    key={whitelist.id}
                                    className="flex items-center justify-between gap-3 rounded-lg border border-gray-800 bg-[#0a0e27] px-3 py-2"
                                >
                                    <div>
                                        <p className="text-xs font-semibold text-white">{whitelist.title}</p>
                                        <p className="text-[11px] text-gray-500">
                                            {whitelist.status} • Ends {formatDate(whitelist.endAt)}
                                        </p>
                                    </div>
                                    <div className="text-[11px] text-gray-400">{whitelist._count.entries} entries</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="p-4 bg-gray-900/40 border border-gray-700 rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-sm font-bold text-white">Giveaways</h3>
                            <p className="text-gray-400 text-xs mt-1">Live raffles and recent winners.</p>
                        </div>
                        <Link
                            href={`/profile/communities/${slug}/admin/giveaways`}
                            className="text-xs text-[#00d4ff] hover:text-[#0099cc]"
                        >
                            View all
                        </Link>
                    </div>
                    {isLoadingGiveaways ? (
                        <p className="text-gray-500 text-xs">Loading giveaways...</p>
                    ) : recentGiveaways.length === 0 ? (
                        <p className="text-gray-500 text-xs">No giveaways yet. Start a new giveaway.</p>
                    ) : (
                        <div className="space-y-2">
                            {recentGiveaways.map(giveaway => (
                                <div
                                    key={giveaway.id}
                                    className="flex items-center justify-between gap-3 rounded-lg border border-gray-800 bg-[#0a0e27] px-3 py-2"
                                >
                                    <div>
                                        <p className="text-xs font-semibold text-white">{giveaway.title}</p>
                                        <p className="text-[11px] text-gray-500">
                                            {giveaway.status} • Ends {formatDate(giveaway.endAt)}
                                        </p>
                                    </div>
                                    <div className="text-[11px] text-gray-400">
                                        {giveaway._count?.entries || 0} entries
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="p-4 bg-gray-900/40 border border-gray-700 rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-sm font-bold text-white">Presales</h3>
                            <p className="text-gray-400 text-xs mt-1">Token and NFT presale activity.</p>
                        </div>
                        <Link
                            href={`/profile/communities/${slug}/admin/presales`}
                            className="text-xs text-[#00d4ff] hover:text-[#0099cc]"
                        >
                            View all
                        </Link>
                    </div>
                    {isLoadingPresales ? (
                        <p className="text-gray-500 text-xs">Loading presales...</p>
                    ) : recentPresales.length === 0 ? (
                        <p className="text-gray-500 text-xs">No presales yet. Presales are coming soon.</p>
                    ) : (
                        <div className="space-y-2">
                            {recentPresales.map(presale => (
                                <div
                                    key={presale.id}
                                    className="flex items-center justify-between gap-3 rounded-lg border border-gray-800 bg-[#0a0e27] px-3 py-2"
                                >
                                    <div>
                                        <p className="text-xs font-semibold text-white">{presale.name}</p>
                                        <p className="text-[11px] text-gray-500">
                                            {presale.status} • Created {formatDate(presale.createdAt)}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="p-4 bg-gray-900/40 border border-gray-700 rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-sm font-bold text-white">Members</h3>
                            <p className="text-gray-400 text-xs mt-1">Recent members and roles.</p>
                        </div>
                        <Link
                            href={`/profile/communities/${slug}/admin/members`}
                            className="text-xs text-[#00d4ff] hover:text-[#0099cc]"
                        >
                            View all
                        </Link>
                    </div>
                    {isLoadingMembers ? (
                        <p className="text-gray-500 text-xs">Loading members...</p>
                    ) : recentMembers.length === 0 ? (
                        <p className="text-gray-500 text-xs">No members found yet.</p>
                    ) : (
                        <div className="space-y-2">
                            {recentMembers.map(member => {
                                const displayName =
                                    member.user.username ||
                                    member.user.discordUsername ||
                                    member.user.email?.split('@')[0] ||
                                    'Member';

                                return (
                                    <div
                                        key={member.id}
                                        className="flex items-center justify-between gap-2 rounded-lg border border-gray-800 bg-[#0a0e27] px-3 py-2 group hover:border-gray-700 transition"
                                    >
                                        <div className="min-w-0 flex-1">
                                            <p className="text-xs font-semibold text-white truncate">{displayName}</p>
                                            <p className="text-[11px] text-gray-500">
                                                {member.role}
                                                {member.user.discordUsername && (
                                                    <span className="ml-1">• {member.user.discordUsername}</span>
                                                )}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition flex-shrink-0">
                                            <Link
                                                href={`/profile/communities/${slug}/admin/members?edit=${member.id}`}
                                                className="px-2 py-1 text-[11px] bg-[#00d4ff] text-[#0a0e27] rounded hover:bg-[#0099cc] font-medium"
                                            >
                                                Edit
                                            </Link>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
