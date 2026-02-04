'use client';

import { useCallback } from 'react';
import type { AdminAction, Community } from '@/hooks/useAdminPageState';

interface UseCommunityDataOptions {
    slug: string;
    dispatch: React.Dispatch<AdminAction>;
    fetchWhitelists: (communityId: string) => Promise<void>;
}

export function useCommunityData({ slug, dispatch, fetchWhitelists }: UseCommunityDataOptions) {
    const fetchCommunity = useCallback(async () => {
        try {
            dispatch({ type: 'SET_LOADING', payload: true });
            dispatch({ type: 'SET_ERROR', payload: null });
            const response = await fetch(`/api/communities?slug=${slug}`);

            if (!response.ok) {
                if (response.status === 404) {
                    dispatch({ type: 'SET_ERROR', payload: 'Community not found' });
                    return;
                }
                throw new Error('Failed to fetch community');
            }

            const data = (await response.json()) as Community;
            dispatch({ type: 'SET_COMMUNITY', payload: data });

            await fetchWhitelists(data.id);
        } catch (err) {
            dispatch({ type: 'SET_ERROR', payload: err instanceof Error ? err.message : 'An error occurred' });
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    }, [dispatch, fetchWhitelists, slug]);

    return { fetchCommunity };
}
