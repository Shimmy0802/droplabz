'use client';

interface AutoDrawSchedulerProps {
    eventId: string;
    eventEndDate: string;
    selectionMode: string;
}

/**
 * Auto-Draw Scheduler Component
 *
 * Displays information about automatic winner drawing
 * Winners are ALWAYS drawn automatically when the event ends
 */
export function AutoDrawScheduler({ eventEndDate, selectionMode }: AutoDrawSchedulerProps) {
    if (selectionMode === 'FCFS') {
        return (
            <div className="p-4 border border-[rgba(0,212,255,0.3)] rounded-lg bg-[#111528]">
                <div className="flex items-center gap-3">
                    <div className="text-2xl">⚡</div>
                    <div>
                        <h3 className="font-semibold text-white">First-Come-First-Serve Mode</h3>
                        <p className="text-sm text-gray-400">Winners are automatically assigned as entries arrive</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 border border-[rgba(0,255,65,0.3)] rounded-lg bg-[#111528]">
            <div className="flex items-start gap-3">
                <div className="text-2xl">🎯</div>
                <div className="flex-1">
                    <h3 className="font-semibold text-white mb-1">Automatic Winner Drawing</h3>
                    <p className="text-sm text-gray-400 mb-2">
                        Winners will be automatically drawn when this event ends. No manual intervention required.
                    </p>
                    <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-400">Scheduled for:</span>
                        <span className="font-mono text-[#00ff41] font-semibold">
                            {new Date(eventEndDate).toLocaleString()}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
