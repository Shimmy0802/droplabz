'use client';

/**
 * OpportunityGridWithFilters Component
 *
 * Combines filter bar + opportunity grid
 * Handles all filtering and display logic client-side
 */

import { useState, useMemo } from 'react';
import Link from 'next/link';
import OpportunityFilterBar, { FilterType } from './OpportunityFilterBar';
import CompactOpportunityCard from './CompactOpportunityCard';

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

interface OpportunityFilterBarWrapperProps {
    allOpportunities: Event[];
    upcomingMints?: Event[];
    endingSoon: Event[];
    presales: Event[];
}

export default function OpportunityGridWithFilters({
    allOpportunities,
    endingSoon,
    presales,
}: OpportunityFilterBarWrapperProps) {
    const [activeFilter, setActiveFilter] = useState<FilterType>('all');
    const MAX_ITEMS = 6;

    // Filter logic
    const filteredOpportunities = useMemo(() => {
        const now = new Date();

        switch (activeFilter) {
            case 'all':
                return allOpportunities;

            case 'trending':
                // Trending = most entries, sorted descending
                return [...allOpportunities].sort((a, b) => b.validEntries - a.validEntries).slice(0, 20);

            case 'hot':
                // Hot = ending soon or high competition
                return [...allOpportunities]
                    .filter(e => {
                        const endDate = typeof e.endAt === 'string' ? new Date(e.endAt) : e.endAt;
                        const hoursLeft = (endDate.getTime() - now.getTime()) / (1000 * 60 * 60);
                        return hoursLeft < 24 && hoursLeft > 0;
                    })
                    .sort((a, b) => b.validEntries - a.validEntries);

            case 'ending':
                // Ending soon = closing in next 24 hours
                return endingSoon;

            case 'presale':
                // Pre-sales only
                return presales;

            default:
                return allOpportunities;
        }
    }, [activeFilter, allOpportunities, endingSoon, presales]);

    const visibleOpportunities = filteredOpportunities.slice(0, MAX_ITEMS);

    return (
        <div className="h-full flex flex-col gap-3">
            {/* Filter Bar */}
            <OpportunityFilterBar onFilterChange={setActiveFilter} defaultFilter={activeFilter} />

            {/* Opportunities Grid */}
            <section className="flex-1">
                {visibleOpportunities.length > 0 ? (
                    <div className="flex flex-col h-full">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                            {visibleOpportunities.map(opportunity => (
                                <CompactOpportunityCard key={opportunity.id} {...opportunity} />
                            ))}
                        </div>

                        {filteredOpportunities.length > MAX_ITEMS && (
                            <div className="mt-3 flex justify-end">
                                <Link
                                    href="/communities"
                                    className="text-xs font-semibold text-[#00d4ff] hover:text-white transition"
                                >
                                    View all communities →
                                </Link>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="h-full flex items-center justify-center text-center">
                        <div>
                            <h3 className="text-sm font-bold text-white mb-1">No Opportunities Found</h3>
                            <p className="text-xs text-gray-400">Try a different filter or check back soon.</p>
                        </div>
                    </div>
                )}
            </section>
        </div>
    );
}
