'use client';

import { useState, useEffect } from 'react';
import { DuplicateDetectionPanel } from '@/components/admin/DuplicateDetectionPanel';
import { ExportButton } from '@/components/admin/ExportButton';
import { AutoDrawScheduler } from '@/components/admin/AutoDrawScheduler';
import { EventAnnouncementPanel } from '@/components/admin/EventAnnouncementPanel';
import Link from 'next/link';

interface EventManagementProps {
    eventId: string;
    communitySlug: string;
}

interface Event {
    id: string;
    title: string;
    type: string;
    status: string;
    selectionMode: string;
    endAt: string;
    maxWinners: number;
    reservedSpots: number;
    communityId: string;
    _count: {
        entries: number;
    };
}

interface Stats {
    totalEntries: number;
    validEntries: number;
    invalidEntries: number;
    ineligibleEntries: number;
    totalWinners: number;
    availableSpots: number;
}

/**
 * Enhanced Event Management Dashboard
 *
 * Integrates advanced admin features:
 * - Duplicate detection
 * - Entry export (CSV)
 * - Auto-draw scheduling
 * - FCFS status tracking
 */
export function EventManagementDashboard({ eventId, communitySlug }: EventManagementProps) {
    const [event, setEvent] = useState<Event | null>(null);
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'overview' | 'duplicates' | 'export'>('overview');

    useEffect(() => {
        loadEventData();
    }, [eventId]);

    const loadEventData = async () => {
        try {
            setLoading(true);
            const res = await fetch(`/api/events/${eventId}?includeStats=true`);
            if (res.ok) {
                const data = await res.json();
                setEvent(data.event);
                setStats(data.stats);
            }
        } catch (error) {
            console.error('Error loading event:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen p-6">
                <div className="text-center text-gray-400">Loading event data...</div>
            </div>
        );
    }

    if (!event) {
        return (
            <div className="min-h-screen p-6">
                <div className="text-center text-red-400">Event not found</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen px-4 sm:px-6 lg:px-8 py-6">
            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                    <Link href={`/profile/communities/${communitySlug}/admin`} className="hover:text-[#00ff41]">
                        Community Admin
                    </Link>
                    <span>/</span>
                    <Link href={`/profile/communities/${communitySlug}/admin`} className="hover:text-[#00ff41]">
                        Events
                    </Link>
                    <span>/</span>
                    <span className="text-white">{event.title}</span>
                </div>
                <h1 className="text-3xl font-bold text-white">{event.title}</h1>
                <div className="flex items-center gap-3 mt-2">
                    <span
                        className={`px-3 py-1 rounded text-sm font-semibold ${
                            event.status === 'ACTIVE'
                                ? 'bg-[#00ff41]/20 text-[#00ff41]'
                                : event.status === 'DRAFT'
                                  ? 'bg-gray-500/20 text-gray-400'
                                  : 'bg-red-500/20 text-red-400'
                        }`}
                    >
                        {event.status}
                    </span>
                    <span className="px-3 py-1 rounded text-sm font-semibold bg-[#00d4ff]/20 text-[#00d4ff]">
                        {event.selectionMode}
                    </span>
                    <span className="px-3 py-1 rounded text-sm font-semibold bg-purple-500/20 text-purple-400">
                        {event.type}
                    </span>
                </div>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="p-4 border border-green-500/20 rounded-lg bg-[#111528]">
                        <div className="text-2xl font-bold text-[#00ff41]">{stats.totalEntries}</div>
                        <div className="text-sm text-gray-400">Total Entries</div>
                    </div>
                    <div className="p-4 border border-blue-500/20 rounded-lg bg-[#111528]">
                        <div className="text-2xl font-bold text-[#00d4ff]">{stats.validEntries}</div>
                        <div className="text-sm text-gray-400">Valid Entries</div>
                    </div>
                    <div className="p-4 border border-yellow-500/20 rounded-lg bg-[#111528]">
                        <div className="text-2xl font-bold text-yellow-400">{stats.ineligibleEntries}</div>
                        <div className="text-sm text-gray-400">Flagged Ineligible</div>
                    </div>
                    <div className="p-4 border border-purple-500/20 rounded-lg bg-[#111528]">
                        <div className="text-2xl font-bold text-purple-400">
                            {stats.totalWinners} / {event.maxWinners}
                        </div>
                        <div className="text-sm text-gray-400">Winners Selected</div>
                    </div>
                </div>
            )}

            {/* Auto-Draw Scheduler */}
            <div className="mb-6">
                <AutoDrawScheduler eventId={eventId} eventEndDate={event.endAt} selectionMode={event.selectionMode} />
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-700 mb-6">
                <div className="flex gap-4">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`px-4 py-2 font-semibold border-b-2 transition-colors ${
                            activeTab === 'overview'
                                ? 'border-[#00ff41] text-[#00ff41]'
                                : 'border-transparent text-gray-400 hover:text-white'
                        }`}
                    >
                        Overview
                    </button>
                    <button
                        onClick={() => setActiveTab('duplicates')}
                        className={`px-4 py-2 font-semibold border-b-2 transition-colors ${
                            activeTab === 'duplicates'
                                ? 'border-[#00ff41] text-[#00ff41]'
                                : 'border-transparent text-gray-400 hover:text-white'
                        }`}
                    >
                        Duplicate Detection
                    </button>
                    <button
                        onClick={() => setActiveTab('export')}
                        className={`px-4 py-2 font-semibold border-b-2 transition-colors ${
                            activeTab === 'export'
                                ? 'border-[#00ff41] text-[#00ff41]'
                                : 'border-transparent text-gray-400 hover:text-white'
                        }`}
                    >
                        Export Data
                    </button>
                </div>
            </div>

            {/* Tab Content */}
            <div className="space-y-6">
                {activeTab === 'overview' && (
                    <div className="space-y-6">
                        <div className="p-6 border border-gray-700 rounded-lg bg-[#111528]">
                            <h2 className="text-xl font-semibold text-white mb-4">Event Details</h2>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-gray-400">End Date:</span>
                                    <div className="text-white font-mono">{new Date(event.endAt).toLocaleString()}</div>
                                </div>
                                <div>
                                    <span className="text-gray-400">Max Winners:</span>
                                    <div className="text-white">{event.maxWinners}</div>
                                </div>
                                <div>
                                    <span className="text-gray-400">Reserved Spots:</span>
                                    <div className="text-white">{event.reservedSpots}</div>
                                </div>
                                <div>
                                    <span className="text-gray-400">Available Spots:</span>
                                    <div className="text-white">{stats?.availableSpots || 0}</div>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <Link
                                href={`/profile/communities/${communitySlug}/admin`}
                                className="px-4 py-2 bg-[#00d4ff] text-[#0a0e27] rounded-lg font-semibold hover:bg-[#0099cc]"
                            >
                                View All Entries
                            </Link>
                            {event.selectionMode !== 'FCFS' && (
                                <Link
                                    href={`/profile/communities/${communitySlug}/admin`}
                                    className="px-4 py-2 bg-[#00ff41] text-[#0a0e27] rounded-lg font-semibold hover:bg-[#00dd33]"
                                >
                                    Draw Winners
                                </Link>
                            )}
                        </div>

                        <EventAnnouncementPanel
                            eventId={eventId}
                            communityId={event.communityId}
                            eventTitle={event.title}
                            eventDescription={event.description || event.title}
                            eventType={event.type as 'GIVEAWAY' | 'WHITELIST' | 'PRESALE' | 'COLLABORATION'}
                            event={event as any}
                        />
                    </div>
                )}

                {activeTab === 'duplicates' && (
                    <DuplicateDetectionPanel eventId={eventId} onMarkIneligible={loadEventData} />
                )}

                {activeTab === 'export' && (
                    <div className="space-y-4">
                        <div className="p-6 border border-gray-700 rounded-lg bg-[#111528]">
                            <h2 className="text-xl font-semibold text-white mb-4">Export Event Data</h2>
                            <p className="text-gray-400 mb-6">
                                Download entry and winner data as CSV files for airdrops, mint claims, or record
                                keeping.
                            </p>
                            <div className="flex flex-wrap gap-4">
                                <ExportButton eventId={eventId} eventTitle={event.title} type="winners" />
                                <ExportButton
                                    eventId={eventId}
                                    eventTitle={event.title}
                                    type="entries"
                                    includeIneligible={false}
                                />
                                <ExportButton
                                    eventId={eventId}
                                    eventTitle={event.title}
                                    type="entries"
                                    includeIneligible={true}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
