'use client';

import { useState, useEffect } from 'react';

interface DuplicateDetectionProps {
    eventId: string;
    onMarkIneligible?: (entryIds: string[]) => void;
}

interface DuplicateResponse {
    eventId: string;
    totalEntries: number;
    flaggedCount: number;
    flaggedEntries: Array<{
        entryId: string;
        riskScore: number;
        signals: Array<{
            type: string;
            severity: 'LOW' | 'MEDIUM' | 'HIGH';
            description: string;
            relatedEntryIds: string[];
        }>;
    }>;
}

/**
 * Duplicate Detection Panel
 *
 * Advanced duplicate detection: identify potential duplicates and mark them as ineligible
 * Displays flagged entries with risk scores and allows admins to mark as ineligible
 */
export function DuplicateDetectionPanel({ eventId, onMarkIneligible }: DuplicateDetectionProps) {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<DuplicateResponse | null>(null);
    const [selectedEntries, setSelectedEntries] = useState<Set<string>>(new Set());
    const [marking, setMarking] = useState(false);

    useEffect(() => {
        loadDuplicates();
    }, [eventId]);

    const loadDuplicates = async () => {
        try {
            setLoading(true);
            const res = await fetch(`/api/events/${eventId}/entries/duplicates`);
            if (res.ok) {
                const json = await res.json();
                setData(json);
            }
        } catch (error) {
            console.error('Error loading duplicates:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = (entryId: string) => {
        const newSet = new Set(selectedEntries);
        if (newSet.has(entryId)) {
            newSet.delete(entryId);
        } else {
            newSet.add(entryId);
        }
        setSelectedEntries(newSet);
    };

    const handleMarkIneligible = async () => {
        if (selectedEntries.size === 0) return;

        const reason = prompt('Enter reason for marking as ineligible:');
        if (!reason) return;

        try {
            setMarking(true);
            const res = await fetch(`/api/events/${eventId}/entries/mark-ineligible`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    entryIds: Array.from(selectedEntries),
                    reason,
                }),
            });

            if (res.ok) {
                alert(`Marked ${selectedEntries.size} entries as ineligible`);
                setSelectedEntries(new Set());
                if (onMarkIneligible) {
                    onMarkIneligible(Array.from(selectedEntries));
                }
                loadDuplicates();
            } else {
                const error = await res.json();
                alert(`Error: ${error.message || 'Failed to mark entries'}`);
            }
        } catch (error) {
            console.error('Error marking ineligible:', error);
            alert('An error occurred');
        } finally {
            setMarking(false);
        }
    };

    if (loading) {
        return (
            <div className="p-6 border border-green-500/20 rounded-lg bg-[#111528]">
                <p className="text-gray-400">Analyzing entries for duplicates...</p>
            </div>
        );
    }

    if (!data || data.flaggedCount === 0) {
        return (
            <div className="p-6 border border-blue-500/20 rounded-lg bg-[#111528]">
                <div className="flex items-center gap-3">
                    <div className="text-2xl">✅</div>
                    <div>
                        <h3 className="font-semibold text-white">No Duplicates Detected</h3>
                        <p className="text-sm text-gray-400">All {data?.totalEntries || 0} entries appear legitimate</p>
                    </div>
                </div>
            </div>
        );
    }

    const flaggedEntries = data.flaggedEntries ?? [];

    const getSeverityColor = (severity: 'LOW' | 'MEDIUM' | 'HIGH') => {
        switch (severity) {
            case 'HIGH':
                return 'text-red-400 bg-red-500/10';
            case 'MEDIUM':
                return 'text-yellow-400 bg-yellow-500/10';
            case 'LOW':
                return 'text-blue-400 bg-blue-500/10';
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-xl font-semibold text-white">Duplicate Detection</h3>
                    <p className="text-sm text-gray-400">
                        {data.flaggedCount} of {data.totalEntries} entries flagged as potential duplicates
                    </p>
                </div>
                {selectedEntries.size > 0 && (
                    <button
                        onClick={handleMarkIneligible}
                        disabled={marking}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
                    >
                        {marking ? 'Marking...' : `Mark ${selectedEntries.size} as Ineligible`}
                    </button>
                )}
            </div>

            <div className="space-y-3">
                {flaggedEntries.map(entry => (
                    <div
                        key={entry.entryId}
                        className="p-4 border border-yellow-500/20 rounded-lg bg-[#111528] hover:border-yellow-500/40 transition-colors"
                    >
                        <div className="flex items-start gap-3">
                            <input
                                type="checkbox"
                                checked={selectedEntries.has(entry.entryId)}
                                onChange={() => handleToggle(entry.entryId)}
                                className="mt-1"
                            />
                            <div className="flex-1 space-y-2">
                                <div className="flex items-center gap-3">
                                    <span className="text-sm text-gray-400 font-mono">{entry.entryId}</span>
                                    <span
                                        className={`px-2 py-1 rounded text-xs font-semibold ${
                                            entry.riskScore >= 70
                                                ? 'bg-red-500/20 text-red-400'
                                                : entry.riskScore >= 40
                                                  ? 'bg-yellow-500/20 text-yellow-400'
                                                  : 'bg-blue-500/20 text-blue-400'
                                        }`}
                                    >
                                        Risk: {entry.riskScore}%
                                    </span>
                                </div>
                                <div className="space-y-1">
                                    {entry.signals.map((signal, idx) => (
                                        <div key={idx} className="flex items-start gap-2 text-sm">
                                            <span
                                                className={`px-2 py-0.5 rounded text-xs ${getSeverityColor(signal.severity)}`}
                                            >
                                                {signal.severity}
                                            </span>
                                            <span className="text-gray-300">{signal.description}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
