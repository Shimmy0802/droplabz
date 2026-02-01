'use client';

/**
 * Community category badge component
 * Displays a category with appropriate styling
 */

import { getCategoryBadgeClass, getCategoryDisplayName } from '@/lib/categories';

interface CategoryBadgeProps {
    category: string | null | undefined;
    className?: string;
}

export function CategoryBadge({ category, className = '' }: CategoryBadgeProps) {
    if (!category) return null;

    return (
        <span
            className={`
                inline-block px-3 py-1 text-xs font-semibold rounded-full
                ${getCategoryBadgeClass(category)} ${className}
            `}
        >
            {getCategoryDisplayName(category)}
        </span>
    );
}

/**
 * Multiple category badges component
 */
interface CategoriesBadgesProps {
    categories: (string | null | undefined)[];
    className?: string;
}

export function CategoriesBadges({ categories, className = '' }: CategoriesBadgesProps) {
    const filteredCategories = categories.filter(Boolean);

    if (filteredCategories.length === 0) return null;

    return (
        <div className={`flex flex-wrap gap-2 ${className}`}>
            {filteredCategories.map(cat => (
                <CategoryBadge key={cat} category={cat} />
            ))}
        </div>
    );
}
