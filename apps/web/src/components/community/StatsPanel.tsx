interface StatsPanelProps {
    stats: {
        totalEvents: number;
        totalParticipants: number;
        activeEvents: number;
        completedEvents: number;
    };
}

export function StatsPanel({ stats }: StatsPanelProps) {
    const statItems = [
        {
            label: 'Total Events',
            value: stats.totalEvents,
            icon: (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path
                        fillRule="evenodd"
                        d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                        clipRule="evenodd"
                    />
                </svg>
            ),
            color: '#00d4ff',
        },
        {
            label: 'Active Events',
            value: stats.activeEvents,
            icon: (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                        clipRule="evenodd"
                    />
                </svg>
            ),
            color: '#00ff41',
        },
        {
            label: 'Total Participants',
            value: stats.totalParticipants,
            icon: (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                </svg>
            ),
            color: '#00d4ff',
        },
        {
            label: 'Completed',
            value: stats.completedEvents,
            icon: (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                    />
                </svg>
            ),
            color: '#9333ea',
        },
    ];

    return (
        <div className="bg-gradient-to-br from-[#111528] to-[#0a0e27] border border-[rgba(0,255,65,0.2)] rounded-lg p-6">
            <h2 className="text-lg font-bold text-[#00ff41] mb-4">Community Stats</h2>

            <div className="grid grid-cols-2 gap-4">
                {statItems.map(item => (
                    <div
                        key={item.label}
                        className="bg-[#0a0e27] border border-[rgba(100,100,100,0.2)] rounded-lg p-4 hover:border-[rgba(0,255,65,0.3)] transition"
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <div style={{ color: item.color }}>{item.icon}</div>
                            <div className="text-2xl font-bold text-white">{item.value.toLocaleString()}</div>
                        </div>
                        <div className="text-xs text-gray-400 uppercase tracking-wide">{item.label}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}
