'use client';

import { useParams } from 'next/navigation';
import { Users, UserPlus, Shield, Crown, Star } from 'lucide-react';
import { AdminLoadingState } from '@/components/admin/AdminLoadingState';
import { EventListPageShell } from '@/components/admin/EventListPageShell';
import { useCommunityBySlug } from '@/hooks/useCommunityBySlug';
import { useRequireAuthRedirect } from '@/hooks/useRequireAuthRedirect';

export default function AdminMembersPage() {
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
            title="Member Management"
            description="Manage community members, roles, and permissions"
            cta={
                <button
                    disabled
                    className="px-6 py-3 bg-gray-800 text-gray-500 font-semibold rounded-lg cursor-not-allowed flex items-center gap-2"
                >
                    <UserPlus className="w-5 h-5" />
                    Invite Member
                </button>
            }
        >
            <div className="text-center py-16 bg-[#111528] border border-[#00d4ff]/20 rounded-lg">
                <div className="max-w-md mx-auto space-y-6">
                    <div className="w-16 h-16 mx-auto bg-gradient-to-br from-[#00d4ff]/20 to-[#00ff41]/20 rounded-full flex items-center justify-center">
                        <Users className="w-8 h-8 text-[#00d4ff]" />
                    </div>

                    <div>
                        <h2 className="text-2xl font-bold text-white mb-2">Member Management Coming Soon</h2>
                        <p className="text-gray-400">
                            Comprehensive tools for managing your community members and their access
                        </p>
                    </div>

                    <div className="bg-[#0a0e27] border border-gray-700/50 rounded-lg p-6 text-left space-y-4">
                        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                            <Shield className="w-5 h-5 text-[#00ff41]" />
                            Planned Features
                        </h3>
                        <ul className="space-y-3 text-sm text-gray-300">
                            <li className="flex items-start gap-2">
                                <span className="text-[#00d4ff] mt-1">•</span>
                                <span>View and search all community members with activity history</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-[#00d4ff] mt-1">•</span>
                                <span>Role-based access control (Owner, Admin, Moderator, Member)</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-[#00d4ff] mt-1">•</span>
                                <span>Bulk member import and invitation management</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-[#00d4ff] mt-1">•</span>
                                <span>Member verification status and wallet tracking</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-[#00d4ff] mt-1">•</span>
                                <span>Integration with Discord roles and permissions</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-[#00d4ff] mt-1">•</span>
                                <span>Audit logs for all member actions and changes</span>
                            </li>
                        </ul>
                    </div>

                    <div className="grid grid-cols-3 gap-4 pt-4">
                        <div className="bg-[#0a0e27] border border-gray-700/50 rounded-lg p-4">
                            <Crown className="w-6 h-6 text-[#00ff41] mb-2" />
                            <div className="text-2xl font-bold text-white">1</div>
                            <div className="text-xs text-gray-400">Owner</div>
                        </div>
                        <div className="bg-[#0a0e27] border border-gray-700/50 rounded-lg p-4">
                            <Shield className="w-6 h-6 text-[#00d4ff] mb-2" />
                            <div className="text-2xl font-bold text-white">0</div>
                            <div className="text-xs text-gray-400">Admins</div>
                        </div>
                        <div className="bg-[#0a0e27] border border-gray-700/50 rounded-lg p-4">
                            <Star className="w-6 h-6 text-gray-400 mb-2" />
                            <div className="text-2xl font-bold text-white">0</div>
                            <div className="text-xs text-gray-400">Members</div>
                        </div>
                    </div>

                    <p className="text-sm text-gray-500">
                        Member management features will be available in Phase 3 of the platform rollout
                    </p>
                </div>
            </div>
        </EventListPageShell>
    );
}
