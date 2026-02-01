'use client';

/**
 * OpportunitiesTabs Component
 *
 * Consolidates Trending, Ending Soon, and All Presales into a single
 * tabbed interface to reduce vertical scrolling while maintaining
 * all opportunity discovery features.
 *
 * Mobile: Single column, stack tabs horizontally with scroll
 * Desktop: 3-column grid per tab
 */

import { useState, useMemo } from 'react';
import Link from 'next/link';
import WhitelistCard from './WhitelistCard';
import PresaleCard from './PresaleCard';

interface Event {
    id: string;
    type?: string;
    title: string;
    description: string | null;
    imageUrl: string | null;
    endAt: Date | string;
    maxWinners: number;
    validEntries: number;
    community: {
        name: string;
        slug: string;
        icon: string | null;
    };
}

interface OpportunitiesTabsProps {
    upcomingMints: Event[];
    endingSoon: Event[];
    presales: Event[];
}

type TabType = 'trending' | 'ending' | 'presales';

export default function OpportunitiesTabs({ upcomingMints, endingSoon, presales }: OpportunitiesTabsProps) {
    const [activeTab, setActiveTab] = useState<TabType>('trending');

    // Memoize tab content
    const tabContent = useMemo(
        () => ({
            trending: {
                label: '🔥 Trending',
                data: upcomingMints.slice(0, 6),
                count: upcomingMints.length,
            },
            ending: {
                label: '⏰ Ending Soon',
                data: endingSoon.slice(0, 6),
                count: endingSoon.length,
            },
            presales: {
                label: '📊 Pre-Sales',
                data: presales.slice(0, 6),
                count: presales.length,
            },
        }),
        [upcomingMints, endingSoon, presales],
    );

    const currentTab = tabContent[activeTab];
    const hasData = currentTab.data.length > 0;

    return (
        <section className="relative px-4 sm:px-6 lg:px-8 py-8 lg:py-10">
            <div className="max-w-7xl mx-auto">
                {/* Section Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                    <div>
                        <h2 className="text-2xl sm:text-3xl font-black text-white">Live Opportunities</h2>
                        <p className="text-xs sm:text-sm text-gray-400 mt-1">
                            {currentTab.count} {currentTab.count === 1 ? 'opportunity' : 'opportunities'} available
                        </p>
                    </div>
                    <Link
                        href="/communities"
                        className="text-[#00ff41] hover:text-white transition-colors flex items-center gap-2 group font-bold uppercase text-xs sm:text-sm whitespace-nowrap"
                    >
                        <span>View All</span>
                        <svg
                            className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </Link>
                </div>

                {/* Tab Buttons - Horizontal Scroll on Mobile */}
                <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
                    {(['trending', 'ending', 'presales'] as TabType[]).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 rounded-lg font-bold uppercase text-xs sm:text-sm whitespace-nowrap transition-all duration-300 flex-shrink-0 ${
                                activeTab === tab
                                    ? 'bg-[#00ff41] text-black shadow-[0_0_20px_rgba(0,255,65,0.5)]'
                                    : 'bg-[rgba(0,255,65,0.1)] text-[#00ff41] border border-[rgba(0,255,65,0.3)] hover:border-[#00ff41]'
                            }`}
                        >
                            {tabContent[tab as TabType].label}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                {hasData ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                        {currentTab.data.map(event =>
                            activeTab === 'presales' ? (
                                <PresaleCard key={event.id} {...event} variant="marketplace" />
                            ) : (
                                <WhitelistCard key={event.id} {...event} variant="trending" />
                            ),
                        )}
                    </div>
                ) : (
                    <div className="py-12 text-center">
                        <p className="text-gray-400 text-sm">No opportunities available in this category yet.</p>
                    </div>
                )}

                {/* Load More / View All */}
                {currentTab.count > 6 && (
                    <div className="text-center mt-6">
                        <Link
                            href="/communities"
                            className="inline-flex items-center gap-2 px-6 py-2 rounded-lg border border-[#00d4ff] text-[#00d4ff] font-bold hover:bg-[rgba(0,212,255,0.1)] transition-all duration-300 uppercase text-xs sm:text-sm"
                        >
                            Load More Opportunities ({currentTab.count - 6} more)
                        </Link>
                    </div>
                )}
            </div>
        </section>
    );
}
