'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    ArrowLeft,
    Users,
    Trophy,
    AlertTriangle,
    Clock,
    Calendar,
    Edit2,
    Trash2,
    Download,
    Send,
    CheckCircle2,
    XCircle,
    Eye,
    Filter,
    RefreshCw,
} from 'lucide-react';
import { useRequireAuthRedirect } from '@/hooks/useRequireAuthRedirect';
import { EventAnnouncementPanel } from '@/components/admin/EventAnnouncementPanel';
import { DuplicateDetectionPanel } from '@/components/admin/DuplicateDetectionPanel';
import { AutoDrawScheduler } from '@/components/admin/AutoDrawScheduler';

interface Event {
    id: string;
    title: string;
    description?: string | null;
    type: string;
    status: string;
    selectionMode: string;
    prize?: string | null;
    imageUrl?: string | null;
    startAt: string;
    endAt: string;
    maxWinners: number;
    reservedSpots: number;
    communityId: string;
    autoAssignDiscordRole: boolean;
    winnerDiscordRoleId?: string | null;
    autoAnnounceOnCreate: boolean;
    autoAnnounceWinners: boolean;
    createdAt: string;
    updatedAt: string;
    _count: {
        entries: number;
        winners: number;
        requirements: number;
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

interface Entry {
    id: string;
    walletAddress: string;
    status: string;
    isIneligible: boolean;
    ineligibilityReason?: string | null;
    createdAt: string;
    metadata?: any;
}

type TabType = 'overview' | 'entries' | 'winners' | 'duplicates' | 'discord' | 'settings';

export default function GiveawayDetailsPage() {
    const { slug, giveawayId } = useParams() as { slug: string; giveawayId: string };
    const router = useRouter();
    const { status } = useRequireAuthRedirect();

    // State
    const [event, setEvent] = useState<Event | null>(null);
    const [stats, setStats] = useState<Stats | null>(null);
    const [entries, setEntries] = useState<Entry[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<TabType>('overview');
    const [entryFilter, setEntryFilter] = useState<'all' | 'valid' | 'invalid' | 'ineligible'>('all');
    const [deleting, setDeleting] = useState(false);

    // Load event data
    useEffect(() => {
        loadEventData();
    }, [giveawayId]);

    const loadEventData = async () => {
        try {
            setLoading(true);
            const res = await fetch(`/api/events/${giveawayId}?includeStats=true`);
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

    // Load entries
    useEffect(() => {
        if (activeTab === 'entries' || activeTab === 'winners') {
            loadEntries();
        }
    }, [activeTab, giveawayId]);

    const loadEntries = async () => {
        try {
            const res = await fetch(`/api/events/${giveawayId}/entries`);
            if (res.ok) {
                const data = await res.json();
                setEntries(data.entries || []);
            }
        } catch (error) {
            console.error('Error loading entries:', error);
        }
    };

    // Filter entries
    const filteredEntries = useMemo(() => {
        switch (entryFilter) {
            case 'valid':
                return entries.filter(e => e.status === 'VALID' && !e.isIneligible);
            case 'invalid':
                return entries.filter(e => e.status === 'INVALID');
            case 'ineligible':
                return entries.filter(e => e.isIneligible);
            default:
                return entries;
        }
    }, [entries, entryFilter]);

    // Handle status change
    const handleStatusChange = async (newStatus: string) => {
        if (!event) return;
        if (!confirm(`Change status to ${newStatus}?`)) return;

        try {
            const res = await fetch(`/api/events/${giveawayId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });

            if (res.ok) {
                await loadEventData();
            } else {
                alert('Failed to update status');
            }
        } catch (error) {
            console.error('Error updating status:', error);
            alert('An error occurred');
        }
    };

    // Handle delete
    const handleDelete = async () => {
        if (!event) return;
        const confirmed = confirm(`Are you sure you want to delete "${event.title}"? This action cannot be undone.`);
        if (!confirmed) return;

        try {
            setDeleting(true);
            const res = await fetch(`/api/events/${giveawayId}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                router.push(`/profile/communities/${slug}/admin/giveaways`);
            } else {
                alert('Failed to delete giveaway');
            }
        } catch (error) {
            console.error('Error deleting:', error);
            alert('An error occurred');
        } finally {
            setDeleting(false);
        }
    };

    // Handle export
    const handleExport = async () => {
        try {
            const res = await fetch(`/api/events/${giveawayId}/export`);
            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${event?.title || 'giveaway'}-entries.csv`;
                a.click();
            }
        } catch (error) {
            console.error('Error exporting:', error);
            alert('Failed to export entries');
        }
    };

    // Loading state
    if (status === 'loading' || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center space-y-4">
                    <RefreshCw className="w-12 h-12 text-[#00ff41] animate-spin mx-auto" />
                    <p className="text-gray-400">Loading giveaway details...</p>
                </div>
            </div>
        );
    }

    // Error state
    if (!event) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center space-y-4">
                    <XCircle className="w-12 h-12 text-red-400 mx-auto" />
                    <h2 className="text-xl font-semibold text-white">Giveaway Not Found</h2>
                    <Link
                        href={`/profile/communities/${slug}/admin/giveaways`}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-[#00d4ff] text-[#0a0e27] rounded-lg font-semibold hover:bg-[#0099cc]"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Giveaways
                    </Link>
                </div>
            </div>
        );
    }

    // Status badge colors
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'ACTIVE':
                return 'bg-[#00ff41]/20 text-[#00ff41] border-[#00ff41]/30';
            case 'CLOSED':
                return 'bg-red-500/20 text-red-400 border-red-500/30';
            case 'DRAFT':
                return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
            default:
                return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
        }
    };

    return (
        <div className="min-h-screen px-4 sm:px-6 lg:px-8 py-6 space-y-6">
            {/* Header Section */}
            <div className="space-y-4">
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Link
                        href={`/profile/communities/${slug}/admin`}
                        className="hover:text-[#00ff41] transition-colors"
                    >
                        Admin Dashboard
                    </Link>
                    <span>/</span>
                    <Link
                        href={`/profile/communities/${slug}/admin/giveaways`}
                        className="hover:text-[#00ff41] transition-colors"
                    >
                        Giveaways
                    </Link>
                    <span>/</span>
                    <span className="text-white font-medium">{event.title}</span>
                </div>

                {/* Title & Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{event.title}</h1>
                        <div className="flex flex-wrap items-center gap-2">
                            <span
                                className={`px-3 py-1 rounded-lg text-xs font-semibold uppercase border ${getStatusColor(event.status)}`}
                            >
                                {event.status}
                            </span>
                            <span className="px-3 py-1 rounded-lg text-xs font-semibold uppercase bg-[#00d4ff]/20 text-[#00d4ff] border border-[#00d4ff]/30">
                                {event.selectionMode}
                            </span>
                            <span className="px-3 py-1 rounded-lg text-xs font-semibold uppercase bg-purple-500/20 text-purple-400 border border-purple-500/30">
                                {event.type}
                            </span>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <Link
                            href={`/profile/communities/${slug}/admin/giveaways/${giveawayId}/edit`}
                            className="px-4 py-2 bg-[#111528] border border-[#00d4ff]/30 text-[#00d4ff] rounded-lg font-semibold hover:bg-[#00d4ff]/10 transition-colors flex items-center gap-2"
                        >
                            <Edit2 className="w-4 h-4" />
                            Edit
                        </Link>
                        <button
                            onClick={handleDelete}
                            disabled={deleting}
                            className="px-4 py-2 bg-[#111528] border border-red-500/30 text-red-400 rounded-lg font-semibold hover:bg-red-500/10 transition-colors flex items-center gap-2 disabled:opacity-50"
                        >
                            <Trash2 className="w-4 h-4" />
                            {deleting ? 'Deleting...' : 'Delete'}
                        </button>
                        <Link
                            href={`/profile/communities/${slug}/admin/giveaways`}
                            className="px-4 py-2 bg-gray-900 border border-gray-700 text-white rounded-lg font-semibold hover:border-gray-600 transition-colors flex items-center gap-2"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back
                        </Link>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            {stats && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-[#111528] border border-[rgba(0,255,65,0.15)] rounded-lg p-4 hover:border-[rgba(0,255,65,0.3)] transition-colors">
                        <div className="flex items-center justify-between mb-2">
                            <Users className="w-5 h-5 text-[#00ff41]" />
                            <span className="text-xs font-semibold text-gray-400 uppercase">Total Entries</span>
                        </div>
                        <div className="text-3xl font-bold text-white">{stats.totalEntries}</div>
                        <div className="text-xs text-gray-500 mt-1">
                            {stats.validEntries} valid · {stats.invalidEntries} invalid
                        </div>
                    </div>

                    <div className="bg-[#111528] border border-[rgba(0,212,255,0.15)] rounded-lg p-4 hover:border-[rgba(0,212,255,0.3)] transition-colors">
                        <div className="flex items-center justify-between mb-2">
                            <CheckCircle2 className="w-5 h-5 text-[#00d4ff]" />
                            <span className="text-xs font-semibold text-gray-400 uppercase">Valid Entries</span>
                        </div>
                        <div className="text-3xl font-bold text-white">{stats.validEntries}</div>
                        <div className="text-xs text-gray-500 mt-1">Verified and eligible</div>
                    </div>

                    <div className="bg-[#111528] border border-[rgba(251,191,36,0.15)] rounded-lg p-4 hover:border-[rgba(251,191,36,0.3)] transition-colors">
                        <div className="flex items-center justify-between mb-2">
                            <AlertTriangle className="w-5 h-5 text-yellow-400" />
                            <span className="text-xs font-semibold text-gray-400 uppercase">Flagged</span>
                        </div>
                        <div className="text-3xl font-bold text-white">{stats.ineligibleEntries}</div>
                        <div className="text-xs text-gray-500 mt-1">Duplicates or violations</div>
                    </div>

                    <div className="bg-[#111528] border border-[rgba(168,85,247,0.15)] rounded-lg p-4 hover:border-[rgba(168,85,247,0.3)] transition-colors">
                        <div className="flex items-center justify-between mb-2">
                            <Trophy className="w-5 h-5 text-purple-400" />
                            <span className="text-xs font-semibold text-gray-400 uppercase">Winners</span>
                        </div>
                        <div className="text-3xl font-bold text-white">
                            {stats.totalWinners} / {event.maxWinners}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">{stats.availableSpots} spots remaining</div>
                    </div>
                </div>
            )}

            {/* Quick Actions Bar */}
            <div className="bg-[#111528] border border-[rgba(0,255,65,0.1)] rounded-lg p-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-2">
                        {event.status === 'DRAFT' && (
                            <button
                                onClick={() => handleStatusChange('ACTIVE')}
                                className="px-4 py-2 bg-[#00ff41] text-[#0a0e27] rounded-lg font-semibold hover:bg-[#00dd33] transition-colors flex items-center gap-2"
                            >
                                <Send className="w-4 h-4" />
                                Activate Giveaway
                            </button>
                        )}
                        {event.status === 'ACTIVE' && (
                            <button
                                onClick={() => handleStatusChange('CLOSED')}
                                className="px-4 py-2 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition-colors flex items-center gap-2"
                            >
                                <XCircle className="w-4 h-4" />
                                Close Giveaway
                            </button>
                        )}
                        <button
                            onClick={handleExport}
                            className="px-4 py-2 bg-[#00d4ff]/10 border border-[#00d4ff]/30 text-[#00d4ff] rounded-lg font-semibold hover:bg-[#00d4ff]/20 transition-colors flex items-center gap-2"
                        >
                            <Download className="w-4 h-4" />
                            Export CSV
                        </button>
                    </div>
                    <button
                        onClick={loadEventData}
                        className="px-4 py-2 bg-gray-900 border border-gray-700 text-gray-300 rounded-lg font-semibold hover:border-gray-600 transition-colors flex items-center gap-2"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Refresh
                    </button>
                </div>
            </div>

            {/* Tabs Navigation */}
            <div className="border-b border-gray-700">
                <nav className="flex gap-1 overflow-x-auto">
                    {[
                        { id: 'overview' as TabType, label: 'Overview', icon: Eye },
                        { id: 'entries' as TabType, label: 'Entries', icon: Users },
                        { id: 'winners' as TabType, label: 'Winners', icon: Trophy },
                        { id: 'duplicates' as TabType, label: 'Duplicates', icon: AlertTriangle },
                        { id: 'discord' as TabType, label: 'Discord', icon: Send },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-3 font-semibold whitespace-nowrap border-b-2 transition-all ${
                                activeTab === tab.id
                                    ? 'border-[#00ff41] text-[#00ff41]'
                                    : 'border-transparent text-gray-400 hover:text-white hover:border-gray-600'
                            }`}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Tab Content */}
            <div className="space-y-6">
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Event Details */}
                        <div className="bg-[#111528] border border-[rgba(0,255,65,0.1)] rounded-lg p-6 space-y-4">
                            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-[#00ff41]" />
                                Event Details
                            </h2>
                            <div className="space-y-3">
                                {event.description && (
                                    <div>
                                        <label className="text-xs font-semibold text-gray-400 uppercase">
                                            Description
                                        </label>
                                        <p className="text-white mt-1">{event.description}</p>
                                    </div>
                                )}
                                {event.prize && (
                                    <div>
                                        <label className="text-xs font-semibold text-gray-400 uppercase">Prize</label>
                                        <p className="text-white mt-1">{event.prize}</p>
                                    </div>
                                )}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-semibold text-gray-400 uppercase">
                                            Start Date
                                        </label>
                                        <p className="text-white font-mono text-sm mt-1">
                                            {new Date(event.startAt).toLocaleString()}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-gray-400 uppercase">
                                            End Date
                                        </label>
                                        <p className="text-white font-mono text-sm mt-1">
                                            {new Date(event.endAt).toLocaleString()}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-gray-400 uppercase">
                                            Max Winners
                                        </label>
                                        <p className="text-white mt-1">{event.maxWinners}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-gray-400 uppercase">
                                            Reserved Spots
                                        </label>
                                        <p className="text-white mt-1">{event.reservedSpots}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-gray-400 uppercase">
                                            Requirements
                                        </label>
                                        <p className="text-white mt-1">{event._count.requirements}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-gray-400 uppercase">
                                            Selection Mode
                                        </label>
                                        <p className="text-white mt-1">{event.selectionMode}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Automation Settings */}
                        <div className="bg-[#111528] border border-[rgba(0,212,255,0.1)] rounded-lg p-6 space-y-4">
                            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                                <Clock className="w-5 h-5 text-[#00d4ff]" />
                                Automation Settings
                            </h2>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between py-2 border-b border-gray-700">
                                    <span className="text-gray-300 text-sm">Auto-Announce on Create</span>
                                    <span
                                        className={`text-xs font-semibold ${event.autoAnnounceOnCreate ? 'text-[#00ff41]' : 'text-gray-500'}`}
                                    >
                                        {event.autoAnnounceOnCreate ? 'ENABLED' : 'DISABLED'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between py-2 border-b border-gray-700">
                                    <span className="text-gray-300 text-sm">Auto-Announce Winners</span>
                                    <span
                                        className={`text-xs font-semibold ${event.autoAnnounceWinners ? 'text-[#00ff41]' : 'text-gray-500'}`}
                                    >
                                        {event.autoAnnounceWinners ? 'ENABLED' : 'DISABLED'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between py-2 border-b border-gray-700">
                                    <span className="text-gray-300 text-sm">Auto-Assign Discord Role</span>
                                    <span
                                        className={`text-xs font-semibold ${event.autoAssignDiscordRole ? 'text-[#00ff41]' : 'text-gray-500'}`}
                                    >
                                        {event.autoAssignDiscordRole ? 'ENABLED' : 'DISABLED'}
                                    </span>
                                </div>
                                {event.winnerDiscordRoleId && (
                                    <div className="py-2">
                                        <label className="text-xs font-semibold text-gray-400 uppercase">
                                            Winner Role ID
                                        </label>
                                        <p className="text-white font-mono text-sm mt-1">{event.winnerDiscordRoleId}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Auto-Draw Scheduler */}
                        <div className="lg:col-span-2">
                            <AutoDrawScheduler
                                eventId={event.id}
                                eventEndDate={event.endAt}
                                selectionMode={event.selectionMode}
                            />
                        </div>
                    </div>
                )}

                {/* Entries Tab */}
                {activeTab === 'entries' && (
                    <div className="space-y-4">
                        {/* Filter Bar */}
                        <div className="bg-[#111528] border border-[rgba(0,255,65,0.1)] rounded-lg p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Filter className="w-4 h-4 text-gray-400" />
                                    <span className="text-sm font-semibold text-gray-300">Filter:</span>
                                    <div className="flex gap-2">
                                        {(['all', 'valid', 'invalid', 'ineligible'] as const).map(filter => (
                                            <button
                                                key={filter}
                                                onClick={() => setEntryFilter(filter)}
                                                className={`px-3 py-1 rounded text-xs font-semibold uppercase transition-colors ${
                                                    entryFilter === filter
                                                        ? 'bg-[#00ff41] text-[#0a0e27]'
                                                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                                }`}
                                            >
                                                {filter}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <span className="text-sm text-gray-400">
                                    {filteredEntries.length} of {entries.length} entries
                                </span>
                            </div>
                        </div>

                        {/* Entries List */}
                        <div className="bg-[#111528] border border-[rgba(0,255,65,0.1)] rounded-lg overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-[#0a0e27] border-b border-gray-700">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">
                                                Wallet
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">
                                                Status
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">
                                                Submitted
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">
                                                Notes
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-800">
                                        {filteredEntries.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                                                    No entries found
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredEntries.map(entry => (
                                                <tr key={entry.id} className="hover:bg-[#0a0e27]/50 transition-colors">
                                                    <td className="px-4 py-3">
                                                        <code className="text-xs text-white font-mono">
                                                            {entry.walletAddress.slice(0, 8)}...
                                                            {entry.walletAddress.slice(-6)}
                                                        </code>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        {entry.isIneligible ? (
                                                            <span className="px-2 py-1 rounded text-xs font-semibold bg-yellow-500/20 text-yellow-400">
                                                                INELIGIBLE
                                                            </span>
                                                        ) : (
                                                            <span
                                                                className={`px-2 py-1 rounded text-xs font-semibold ${
                                                                    entry.status === 'VALID'
                                                                        ? 'bg-[#00ff41]/20 text-[#00ff41]'
                                                                        : entry.status === 'INVALID'
                                                                          ? 'bg-red-500/20 text-red-400'
                                                                          : 'bg-gray-500/20 text-gray-400'
                                                                }`}
                                                            >
                                                                {entry.status}
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 text-xs text-gray-400">
                                                        {new Date(entry.createdAt).toLocaleString()}
                                                    </td>
                                                    <td className="px-4 py-3 text-xs text-gray-400">
                                                        {entry.isIneligible && entry.ineligibilityReason ? (
                                                            <span className="text-yellow-400">
                                                                {entry.ineligibilityReason}
                                                            </span>
                                                        ) : (
                                                            <span className="text-gray-600">—</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* Winners Tab */}
                {activeTab === 'winners' && (
                    <div className="space-y-4">
                        <div className="bg-[#111528] border border-[rgba(168,85,247,0.15)] rounded-lg p-6">
                            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                                <Trophy className="w-5 h-5 text-purple-400" />
                                Winner Management
                            </h2>
                            <p className="text-gray-400 mb-6">
                                Winners are automatically selected when this event ends. No manual intervention
                                required.
                            </p>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2 px-4 py-2 bg-[#00ff41]/10 border border-[#00ff41]/30 rounded-lg">
                                    <Trophy className="w-4 h-4 text-[#00ff41]" />
                                    <span className="text-sm font-semibold text-[#00ff41]">
                                        {stats?.availableSpots || 0} spot{(stats?.availableSpots || 0) !== 1 ? 's' : ''}{' '}
                                        remaining
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Duplicates Tab */}
                {activeTab === 'duplicates' && (
                    <DuplicateDetectionPanel eventId={event.id} onMarkIneligible={loadEventData} />
                )}

                {/* Discord Tab */}
                {activeTab === 'discord' && (
                    <EventAnnouncementPanel
                        eventId={event.id}
                        communityId={event.communityId}
                        eventTitle={event.title}
                        eventDescription={event.description || undefined}
                        eventType={event.type as 'GIVEAWAY' | 'WHITELIST' | 'PRESALE' | 'COLLABORATION'}
                        event={event}
                    />
                )}
            </div>
        </div>
    );
}
