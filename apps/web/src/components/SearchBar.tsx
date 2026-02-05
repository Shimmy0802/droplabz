'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface SearchResult {
    type: 'community' | 'event';
    id: string;
    name: string;
    slug?: string;
    categories?: string[];
    eventType?: string;
}

export default function SearchBar() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        const searchCommunities = async () => {
            if (query.length < 2) {
                setResults([]);
                setIsOpen(false);
                return;
            }

            setLoading(true);
            try {
                // TODO: Create search API endpoint
                // For now, using communities endpoint with filter
                const response = await fetch(`/api/communities?search=${encodeURIComponent(query)}`);
                if (response.ok) {
                    const data = await response.json();
                    const searchResults: SearchResult[] = data.map((community: any) => ({
                        type: 'community' as const,
                        id: community.id,
                        name: community.name,
                        slug: community.slug,
                        categories: community.categories || [],
                    }));
                    setResults(searchResults);
                    setIsOpen(true);
                }
            } catch (error) {
                console.error('Search error:', error);
            } finally {
                setLoading(false);
            }
        };

        const debounceTimer = setTimeout(searchCommunities, 300);
        return () => clearTimeout(debounceTimer);
    }, [query]);

    const handleResultClick = (result: SearchResult) => {
        setIsOpen(false);
        setQuery('');
        if (result.type === 'community' && result.slug) {
            router.push(`/communities/${result.slug}`);
        } else if (result.type === 'event') {
            router.push(`/whitelists/${result.id}`);
        }
    };

    return (
        <div ref={searchRef} className="relative w-full max-w-md">
            <div className="relative">
                <input
                    type="text"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    onFocus={() => query.length >= 2 && setIsOpen(true)}
                    placeholder="Search communities and events"
                    className="w-full px-4 py-2 pl-10 bg-[#111528] border border-[rgba(0,212,255,0.2)] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#00d4ff] focus:shadow-[0_0_10px_rgba(0,212,255,0.3)] transition-all"
                />
                <svg
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                </svg>
                {loading && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="w-4 h-4 border-2 border-[#00d4ff] border-t-transparent rounded-full animate-spin" />
                    </div>
                )}
            </div>

            {/* Results Dropdown */}
            {isOpen && results.length > 0 && (
                <div className="absolute top-full mt-2 w-full bg-[#111528] border border-[rgba(0,212,255,0.2)] rounded-lg shadow-xl max-h-96 overflow-y-auto z-50">
                    {results.map(result => (
                        <button
                            key={`${result.type}-${result.id}`}
                            onClick={() => handleResultClick(result)}
                            className="w-full px-4 py-3 text-left hover:bg-[rgba(0,212,255,0.1)] transition-colors border-b border-[rgba(0,212,255,0.1)] last:border-b-0"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="text-white font-medium">{result.name}</div>
                                    {result.categories && result.categories.length > 0 && (
                                        <div className="text-sm text-gray-400 mt-1">
                                            {result.categories.slice(0, 2).join(', ')}
                                        </div>
                                    )}
                                </div>
                                <div className="text-xs px-2 py-1 rounded bg-[rgba(0,255,65,0.15)] text-[#00ff41]">
                                    {result.type === 'community' ? 'Community' : 'Event'}
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            )}

            {/* No Results */}
            {isOpen && query.length >= 2 && results.length === 0 && !loading && (
                <div className="absolute top-full mt-2 w-full bg-[#111528] border border-[rgba(0,212,255,0.2)] rounded-lg shadow-xl p-4 z-50">
                    <p className="text-gray-400 text-center">No results found</p>
                </div>
            )}
        </div>
    );
}
