'use client';

/**
 * Community category filter component
 * Used for filtering communities by category in marketplace/discovery
 */

import { useState } from 'react';
import { getAvailableCategories, sortCategories } from '@/lib/categories';

interface CategoryFilterProps {
    onCategoryChange?: (selectedCategories: string[]) => void;
    selectedCategories?: string[];
    multiple?: boolean; // Allow multiple category selection
}

export function CategoryFilter({ onCategoryChange, selectedCategories = [], multiple = true }: CategoryFilterProps) {
    const [selected, setSelected] = useState<string[]>(selectedCategories);
    const categories = sortCategories(getAvailableCategories());

    const handleToggle = (category: string) => {
        let newSelected: string[];

        if (multiple) {
            // Toggle category in multi-select
            newSelected = selected.includes(category) ? selected.filter(c => c !== category) : [...selected, category];
        } else {
            // Single select mode
            newSelected = selected.includes(category) ? [] : [category];
        }

        setSelected(newSelected);
        onCategoryChange?.(newSelected);
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-300">Categories</h3>
                {selected.length > 0 && (
                    <button
                        onClick={() => {
                            setSelected([]);
                            onCategoryChange?.([]);
                        }}
                        className="text-xs text-[#00d4ff] hover:text-[#00ff41] transition"
                    >
                        Clear all
                    </button>
                )}
            </div>

            <div className={`space-y-2 ${multiple ? '' : ''}`}>
                {categories.map(category => (
                    <label key={category} className="flex items-center cursor-pointer group">
                        <input
                            type={multiple ? 'checkbox' : 'radio'}
                            name={multiple ? undefined : 'category-filter'}
                            checked={selected.includes(category)}
                            onChange={() => handleToggle(category)}
                            className="w-4 h-4 rounded accent-[#00ff41]"
                        />
                        <span className="ml-3 text-sm text-gray-400 group-hover:text-gray-300 transition">
                            {category}
                        </span>
                    </label>
                ))}
            </div>
        </div>
    );
}

/**
 * Dropdown/Select version of category filter
 */
interface CategorySelectProps {
    value?: string;
    onChange?: (category: string | null) => void;
    includeEmpty?: boolean;
}

export function CategorySelect({ value = '', onChange, includeEmpty = true }: CategorySelectProps) {
    const categories = sortCategories(getAvailableCategories());

    return (
        <select
            value={value}
            onChange={e => onChange?.(e.target.value || null)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white text-sm rounded-lg focus:outline-none focus:border-[#00d4ff]"
        >
            {includeEmpty && <option value="">All categories</option>}
            {categories.map(category => (
                <option key={category} value={category}>
                    {category}
                </option>
            ))}
        </select>
    );
}
