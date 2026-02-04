import Link from 'next/link';
import { CreateWhitelistForm } from '@/components/whitelists/CreateWhitelistForm';
import type { Whitelist } from '@/hooks/useAdminPageState';

interface WhitelistsTabContentProps {
    communityId: string;
    slug: string;
    whitelists: Whitelist[];
    isLoading: boolean;
    showCreate: boolean;
    onShowCreate: () => void;
    onHideCreate: () => void;
    onCreateSuccess: () => void;
}

export function WhitelistsTabContent({
    communityId,
    slug,
    whitelists,
    isLoading,
    showCreate,
    onShowCreate,
    onHideCreate,
    onCreateSuccess,
}: WhitelistsTabContentProps) {
    const visibleWhitelists = whitelists.slice(0, 4);
    const hasMoreWhitelists = whitelists.length > visibleWhitelists.length;

    return (
        <div className="space-y-4">
            {!showCreate ? (
                <div className="p-4 bg-gray-900/40 border border-gray-700 rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="text-sm font-bold text-white">Whitelists</h2>
                            <p className="text-gray-400 text-xs mt-1">
                                Manage whitelists for your community. Whitelists verify participants through Discord
                                roles and Solana wallet requirements.
                            </p>
                        </div>
                        <button
                            onClick={onShowCreate}
                            className="px-3 py-2 bg-[#00ff41] text-black rounded-lg font-semibold hover:bg-[#00dd33] transition whitespace-nowrap text-xs"
                        >
                            Create Whitelist
                        </button>
                    </div>

                    {isLoading ? (
                        <div className="space-y-3">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-20 bg-gray-800 rounded animate-pulse" />
                            ))}
                        </div>
                    ) : whitelists.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-gray-400 mb-2 text-sm">No whitelists yet</p>
                            <p className="text-gray-500 text-xs">Create your first whitelist to get started</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {visibleWhitelists.map(whitelist => (
                                <div
                                    key={whitelist.id}
                                    className="p-3 bg-gray-800 border border-gray-700 rounded-lg hover:border-gray-600 transition"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-sm font-semibold text-white">{whitelist.title}</h3>
                                                <span
                                                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                                                        whitelist.status === 'ACTIVE'
                                                            ? 'bg-green-900/30 text-green-400 border border-green-700'
                                                            : whitelist.status === 'CLOSED'
                                                              ? 'bg-red-900/30 text-red-400 border border-red-700'
                                                              : 'bg-gray-700 text-gray-300 border border-gray-600'
                                                    }`}
                                                >
                                                    {whitelist.status}
                                                </span>
                                            </div>
                                            {whitelist.description && (
                                                <p className="text-gray-400 text-xs mb-3">{whitelist.description}</p>
                                            )}
                                            <div className="flex items-center gap-4 text-xs">
                                                <div>
                                                    <span className="text-gray-400">Entries: </span>
                                                    <span className="text-white font-semibold">
                                                        {whitelist._count.entries}
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className="text-gray-400">Max Spots: </span>
                                                    <span className="text-white font-semibold">
                                                        {whitelist.maxSpots}
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className="text-gray-400">Ends: </span>
                                                    <span className="text-white font-semibold">
                                                        {new Date(whitelist.endAt).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <Link
                                            href={`/profile/communities/${slug}/admin/whitelists/${whitelist.id}`}
                                            className="px-3 py-2 bg-[#00d4ff] text-black rounded-lg font-semibold hover:bg-[#0099cc] transition text-xs whitespace-nowrap ml-4"
                                        >
                                            Manage
                                        </Link>
                                    </div>
                                </div>
                            ))}
                            {hasMoreWhitelists && (
                                <div className="flex justify-end">
                                    <Link
                                        href={`/profile/communities/${slug}/admin/whitelists`}
                                        className="text-xs text-[#00d4ff] hover:text-white"
                                    >
                                        View all whitelists →
                                    </Link>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            ) : (
                <div className="p-4 bg-gray-900/40 border border-gray-700 rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="text-sm font-bold text-white">Create Whitelist</h2>
                            <p className="text-gray-400 text-xs mt-1">
                                Set up a new whitelist with custom requirements
                            </p>
                        </div>
                        <button
                            onClick={onHideCreate}
                            className="px-3 py-2 bg-gray-900 border border-gray-700 text-white rounded-lg hover:border-gray-600 text-xs"
                        >
                            Back to List
                        </button>
                    </div>
                    <CreateWhitelistForm communityId={communityId} slug={slug} onSuccess={onCreateSuccess} />
                </div>
            )}
        </div>
    );
}
