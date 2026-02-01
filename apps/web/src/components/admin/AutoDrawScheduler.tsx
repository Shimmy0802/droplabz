'use client';

import { useState, useEffect } from 'react';

interface AutoDrawSchedulerProps {
    eventId: string;
    eventEndDate: string;
    selectionMode: string;
}

/**
 * Auto-Draw Scheduler Component
 *
 * Schedule automatic winner draws at specified times
 * Allows admins to enable automatic winner drawing when event ends
 */
export function AutoDrawScheduler({ eventId, eventEndDate, selectionMode }: AutoDrawSchedulerProps) {
    const [enabled, setEnabled] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadStatus();
    }, [eventId]);

    const loadStatus = async () => {
        try {
            setLoading(true);
            const res = await fetch(`/api/events/${eventId}/auto-draw`);
            if (res.ok) {
                const data = await res.json();
                setEnabled(data.autoDrawEnabled || false);
            }
        } catch (error) {
            console.error('Error loading auto-draw status:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = async () => {
        try {
            setSaving(true);
            const res = await fetch(`/api/events/${eventId}/auto-draw`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    enabled: !enabled,
                    scheduledAt: eventEndDate,
                }),
            });

            if (res.ok) {
                const data = await res.json();
                setEnabled(!enabled);
                alert(data.message);
            } else {
                const error = await res.json();
                alert(`Error: ${error.message || 'Failed to update auto-draw'}`);
            }
        } catch (error) {
            console.error('Error toggling auto-draw:', error);
            alert('An error occurred');
        } finally {
            setSaving(false);
        }
    };

    if (selectionMode === 'FCFS') {
        return (
            <div className="p-4 border border-blue-500/20 rounded-lg bg-[#111528]">
                <div className="flex items-center gap-3">
                    <div className="text-2xl">⚡</div>
                    <div>
                        <h3 className="font-semibold text-white">FCFS Mode Enabled</h3>
                        <p className="text-sm text-gray-400">Winners are automatically assigned as entries arrive</p>
                    </div>
                </div>
            </div>
        );
    }

    if (loading) {
        return <div className="text-gray-400">Loading auto-draw settings...</div>;
    }

    return (
        <div className="p-4 border border-green-500/20 rounded-lg bg-[#111528]">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="font-semibold text-white">Automatic Winner Drawing</h3>
                    <p className="text-sm text-gray-400">
                        {enabled ? (
                            <>
                                ✅ Winners will be drawn automatically when event ends{' '}
                                <span className="font-mono text-[#00ff41]">
                                    ({new Date(eventEndDate).toLocaleString()})
                                </span>
                            </>
                        ) : (
                            <>❌ Auto-draw disabled - you must manually draw winners</>
                        )}
                    </p>
                </div>
                <button
                    onClick={handleToggle}
                    disabled={saving}
                    className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                        enabled
                            ? 'bg-red-500/20 text-red-400 border border-red-500/40 hover:bg-red-500/30'
                            : 'bg-[#00ff41] text-[#0a0e27] hover:bg-[#00dd33]'
                    } disabled:opacity-50`}
                >
                    {saving ? 'Saving...' : enabled ? 'Disable Auto-Draw' : 'Enable Auto-Draw'}
                </button>
            </div>
        </div>
    );
}
