'use client';

/**
 * OpportunityFilterBar Component
 *
 * Horizontal filter/category navigation bar
 * Atlas3-style filtering at top of marketplace
 * Includes: All | Trending | Hot | Ending Soon | etc
 */

import { useState } from 'react';

export type FilterType = 'all' | 'trending' | 'hot' | 'ending' | 'presale';

interface OpportunityFilterBarProps {
    onFilterChange: (filter: FilterType) => void;
    defaultFilter?: FilterType;
}

interface FilterOption {
    id: FilterType;
    label: string;
    icon: string;
    description: string;
}

const FILTERS: FilterOption[] = [
    {
        id: 'all',
        label: 'All',
        icon: '📋',
        description: 'All live opportunities',
    },
    {
        id: 'trending',
        label: 'Trending',
        icon: '📈',
        description: 'Most popular right now',
    },
    {
        id: 'hot',
        label: 'Hot',
        icon: '🔥',
        description: 'Ending soon or highly competitive',
    },
    {
        id: 'ending',
        label: 'Ending Soon',
        icon: '⏰',
        description: 'Closing in next 24 hours',
    },
    {
        id: 'presale',
        label: 'Pre-Sales',
        icon: '📊',
        description: 'Tiered allocations',
    },
];

export default function OpportunityFilterBar({ onFilterChange, defaultFilter = 'all' }: OpportunityFilterBarProps) {
    const [activeFilter, setActiveFilter] = useState<FilterType>(defaultFilter);

    const handleFilterChange = (filter: FilterType) => {
        setActiveFilter(filter);
        onFilterChange(filter);
    };

    return (
        <div className="sticky top-[64px] z-40 bg-[rgba(10,14,39,0.95)] border-b border-[rgba(0,255,65,0.2)] backdrop-blur-md shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
            <div className="px-4 sm:px-6 lg:px-8 py-3">
                <div className="max-w-7xl mx-auto">
                    {/* Filter Tabs - Horizontal Scroll */}
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        {FILTERS.map(filter => (
                            <button
                                key={filter.id}
                                onClick={() => handleFilterChange(filter.id)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold uppercase text-sm transition-all duration-300 whitespace-nowrap flex-shrink-0 ${
                                    activeFilter === filter.id
                                        ? 'bg-[#00ff41] text-black shadow-[0_0_30px_rgba(0,255,65,0.5)]'
                                        : 'bg-[rgba(0,212,255,0.1)] border border-[rgba(0,212,255,0.2)] text-[#00d4ff] hover:border-[#00d4ff] hover:bg-[rgba(0,212,255,0.2)]'
                                }`}
                                title={filter.description}
                            >
                                <span className="text-lg">{filter.icon}</span>
                                <span>{filter.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Desktop View - Show description */}
                    <div className="hidden sm:block mt-3">
                        <p className="text-xs text-gray-400">{FILTERS.find(f => f.id === activeFilter)?.description}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
