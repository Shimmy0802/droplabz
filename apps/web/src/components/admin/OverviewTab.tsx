import type { TabType } from '@/hooks/useAdminPageState';

interface OverviewTabProps {
    onNavigateTab: (tab: TabType) => void;
}

export function OverviewTab({ onNavigateTab }: OverviewTabProps) {
    return (
        <div className="space-y-4">
            {/* Quick Actions */}
            <div>
                <h2 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                    <span className="text-[#00ff41]">▮</span> Quick Actions
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    <button
                        onClick={() => onNavigateTab('whitelists')}
                        className="bg-[#00ff41] text-black rounded-lg p-3 hover:bg-[#00dd33] transition font-semibold text-xs"
                    >
                        Create Whitelist
                    </button>
                    <button
                        onClick={() => onNavigateTab('presales')}
                        className="bg-[#00ff41] text-black rounded-lg p-3 hover:bg-[#00dd33] transition font-semibold text-xs"
                    >
                        Create Pre-Sale
                    </button>
                    <button
                        onClick={() => onNavigateTab('settings')}
                        className="bg-[#00d4ff] text-black rounded-lg p-3 hover:bg-[#0099cc] transition font-semibold text-xs"
                    >
                        Settings
                    </button>
                </div>
            </div>

            {/* Getting Started */}
            <div className="p-4 bg-gray-900/40 border border-gray-700 rounded-lg">
                <h3 className="text-sm font-bold text-white mb-3">Getting Started</h3>
                <ol className="space-y-2 text-xs text-gray-300 list-decimal list-inside">
                    <li>Configure your community settings (Discord, Solana)</li>
                    <li>Create whitelists or pre-sales with custom requirements</li>
                    <li>Share the public page with your community</li>
                    <li>Review and manage entries in the admin panel</li>
                    <li>Announce winners or distribute allocations</li>
                </ol>
            </div>
        </div>
    );
}
