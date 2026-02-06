'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Coins, Plus, TrendingUp } from 'lucide-react';
import { AdminLoadingState } from '@/components/admin/AdminLoadingState';
import { EventListPageShell } from '@/components/admin/EventListPageShell';
import { useCommunityBySlug } from '@/hooks/useCommunityBySlug';
import { useRequireAuthRedirect } from '@/hooks/useRequireAuthRedirect';

export default function AdminPresalesPage() {
    const { slug } = useParams() as { slug: string };
    const { status } = useRequireAuthRedirect();
    const { community, isLoading } = useCommunityBySlug(slug);

    if (status === 'loading' || isLoading) {
        return <AdminLoadingState variant="list" />;
    }

    if (!community) {
        return null;
    }

    return (
        <EventListPageShell
            title="Pre-Sales"
            description="Manage token and NFT pre-sales for your community"
            cta={
                <button
                    disabled
                    className="px-6 py-3 bg-gray-800 text-gray-500 font-semibold rounded-lg cursor-not-allowed flex items-center gap-2"
                >
                    <Plus className="w-5 h-5" />
                    Create Pre-Sale
                </button>
            }
        >
            <div className="text-center py-16 bg-[#111528] border border-[#00d4ff]/20 rounded-lg">
                <div className="max-w-md mx-auto space-y-6">
                    <div className="w-16 h-16 mx-auto bg-gradient-to-br from-[#00d4ff]/20 to-[#00ff41]/20 rounded-full flex items-center justify-center">
                        <Coins className="w-8 h-8 text-[#00d4ff]" />
                    </div>

                    <div>
                        <h2 className="text-2xl font-bold text-white mb-2">Pre-Sales Coming Soon</h2>
                        <p className="text-gray-400">
                            Professional infrastructure for managing token and NFT pre-sales
                        </p>
                    </div>

                    <div className="bg-[#0a0e27] border border-gray-700/50 rounded-lg p-6 text-left space-y-4">
                        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-[#00ff41]" />
                            Planned Features
                        </h3>
                        <ul className="space-y-3 text-sm text-gray-300">
                            <li className="flex items-start gap-2">
                                <span className="text-[#00d4ff] mt-1">•</span>
                                <span>Token sale configuration with custom pricing and vesting schedules</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-[#00d4ff] mt-1">•</span>
                                <span>NFT pre-sale management with whitelist integration</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-[#00d4ff] mt-1">•</span>
                                <span>Automatic wallet verification and Solana on-chain claims</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-[#00d4ff] mt-1">•</span>
                                <span>Discord integration for announcement and access control</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-[#00d4ff] mt-1">•</span>
                                <span>Real-time sales analytics and participant tracking</span>
                            </li>
                        </ul>
                    </div>

                    <p className="text-sm text-gray-500">
                        Pre-sale functionality will be available in Phase 3 of the platform rollout
                    </p>
                </div>
            </div>
        </EventListPageShell>
    );
}
