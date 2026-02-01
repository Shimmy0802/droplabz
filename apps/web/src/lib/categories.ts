/**
 * Community category constants and utilities
 * Used for marketplace listing, filtering, and discovery
 */

export const COMMUNITY_CATEGORIES = ['NFT', 'Gaming', 'DeFi', 'DAO', 'Community'] as const;

export type CommunityCategory = (typeof COMMUNITY_CATEGORIES)[number];

/**
 * Get display name for a category
 */
export function getCategoryDisplayName(category: string | null | undefined): string {
    if (!category) return 'No category';
    return category;
}

/**
 * Get icon or badge styling for a category
 * Can be extended for different visual treatments per category
 */
export function getCategoryBadgeClass(category: string | null | undefined): string {
    if (!category) return 'bg-gray-800 text-gray-400';

    switch (category) {
        case 'NFT':
            return 'bg-purple-900/20 text-purple-400 border border-purple-800';
        case 'Gaming':
            return 'bg-blue-900/20 text-blue-400 border border-blue-800';
        case 'DeFi':
            return 'bg-cyan-900/20 text-cyan-400 border border-cyan-800';
        case 'DAO':
            return 'bg-orange-900/20 text-orange-400 border border-orange-800';
        case 'Community':
            return 'bg-pink-900/20 text-pink-400 border border-pink-800';
        default:
            return 'bg-gray-800 text-gray-400';
    }
}

/**
 * Validate if a category is in the allowed list
 */
export function isValidCategory(category: string | null | undefined): boolean {
    if (!category) return true; // null is valid (no category)
    return COMMUNITY_CATEGORIES.includes(category as CommunityCategory);
}

/**
 * Get all available categories for filtering/selection
 */
export function getAvailableCategories(): CommunityCategory[] {
    return [...COMMUNITY_CATEGORIES];
}

/**
 * Helper for sorting categories in UI (Featured first, then others)
 */
export function sortCategories(categories: string[]): string[] {
    return categories.sort((a, b) => {
        // Alphabetical
        return a.localeCompare(b);
    });
}
