'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Settings, Save, AlertTriangle, Database, Bell, Shield } from 'lucide-react';
import { AdminLoadingState } from '@/components/admin/AdminLoadingState';
import { EventListPageShell } from '@/components/admin/EventListPageShell';
import { useCommunityBySlug } from '@/hooks/useCommunityBySlug';
import { useRequireAuthRedirect } from '@/hooks/useRequireAuthRedirect';

export default function AdminSettingsPage() {
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
            title="Community Settings"
            description="Configure advanced settings and preferences for your community"
            cta={
                <button
                    disabled
                    className="px-6 py-3 bg-gray-800 text-gray-500 font-semibold rounded-lg cursor-not-allowed flex items-center gap-2"
                >
                    <Save className="w-5 h-5" />
                    Save Changes
                </button>
            }
        >
            <div className="space-y-6">
                {/* Coming Soon Banner */}
                <div className="bg-gradient-to-r from-[#00d4ff]/10 to-[#00ff41]/10 border border-[#00d4ff]/30 rounded-lg p-6">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-[#00d4ff]/20 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Settings className="w-6 h-6 text-[#00d4ff]" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white mb-2">Advanced Settings Coming Soon</h2>
                            <p className="text-gray-300">
                                Fine-grained control over your community's configuration, integrations, and security
                                settings will be available in the next platform update.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Settings Categories */}
                <div className="grid gap-6 md:grid-cols-2">
                    {/* General Settings */}
                    <div className="bg-[#111528] border border-gray-700/50 rounded-lg p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <Database className="w-5 h-5 text-[#00d4ff]" />
                            <h3 className="text-lg font-semibold text-white">General Settings</h3>
                        </div>
                        <ul className="space-y-2 text-sm text-gray-400">
                            <li>• Community name and description</li>
                            <li>• Brand colors and logo customization</li>
                            <li>• Public visibility controls</li>
                            <li>• Social links and metadata</li>
                            <li>• Custom subdomain configuration</li>
                        </ul>
                    </div>

                    {/* Notification Settings */}
                    <div className="bg-[#111528] border border-gray-700/50 rounded-lg p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <Bell className="w-5 h-5 text-[#00d4ff]" />
                            <h3 className="text-lg font-semibold text-white">Notifications</h3>
                        </div>
                        <ul className="space-y-2 text-sm text-gray-400">
                            <li>• Email notification preferences</li>
                            <li>• Discord webhook integrations</li>
                            <li>• Event announcement automation</li>
                            <li>• Member activity alerts</li>
                            <li>• System notification settings</li>
                        </ul>
                    </div>

                    {/* Security & Access */}
                    <div className="bg-[#111528] border border-gray-700/50 rounded-lg p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <Shield className="w-5 h-5 text-[#00ff41]" />
                            <h3 className="text-lg font-semibold text-white">Security & Access</h3>
                        </div>
                        <ul className="space-y-2 text-sm text-gray-400">
                            <li>• Two-factor authentication (2FA)</li>
                            <li>• API key management</li>
                            <li>• Wallet verification requirements</li>
                            <li>• IP whitelist configuration</li>
                            <li>• Audit log retention settings</li>
                        </ul>
                    </div>

                    {/* Advanced Options */}
                    <div className="bg-[#111528] border border-gray-700/50 rounded-lg p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <Settings className="w-5 h-5 text-[#00ff41]" />
                            <h3 className="text-lg font-semibold text-white">Advanced Options</h3>
                        </div>
                        <ul className="space-y-2 text-sm text-gray-400">
                            <li>• Custom smart contract integration</li>
                            <li>• Rate limiting and throttling</li>
                            <li>• Data export and backup</li>
                            <li>• Webhook endpoint configuration</li>
                            <li>• Developer mode and debug logs</li>
                        </ul>
                    </div>
                </div>

                {/* Danger Zone */}
                <div className="bg-red-950/20 border border-red-500/30 rounded-lg p-6">
                    <div className="flex items-start gap-4">
                        <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0 mt-1" />
                        <div className="flex-1">
                            <h3 className="text-lg font-semibold text-red-400 mb-2">Danger Zone</h3>
                            <p className="text-gray-400 text-sm mb-4">
                                Irreversible actions that will permanently affect your community. Use with extreme
                                caution.
                            </p>
                            <div className="space-y-3">
                                <button
                                    disabled
                                    className="px-4 py-2 bg-gray-800 text-gray-500 rounded-lg cursor-not-allowed text-sm"
                                >
                                    Transfer Ownership
                                </button>
                                <button
                                    disabled
                                    className="px-4 py-2 bg-gray-800 text-gray-500 rounded-lg cursor-not-allowed text-sm ml-3"
                                >
                                    Archive Community
                                </button>
                                <button
                                    disabled
                                    className="px-4 py-2 bg-gray-800 text-gray-500 rounded-lg cursor-not-allowed text-sm ml-3"
                                >
                                    Delete Community
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <p className="text-center text-sm text-gray-500">
                    All settings functionality will be available in Phase 3 of the platform rollout
                </p>
            </div>
        </EventListPageShell>
    );
}
