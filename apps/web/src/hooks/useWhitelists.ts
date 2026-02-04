'use client';

import { useCallback } from 'react';
import type { AdminAction } from '@/hooks/useAdminPageState';

export function useWhitelists(dispatch: React.Dispatch<AdminAction>) {
    const fetchWhitelists = useCallback(
        async (communityId: string) => {
            try {
                dispatch({ type: 'WHITELISTS_SET_LOADING', payload: true });
                const response = await fetch(`/api/events?communityId=${communityId}`);

                if (!response.ok) {
                    throw new Error('Failed to fetch whitelists');
                }

                const data = await response.json();
                dispatch({ type: 'WHITELISTS_SET', payload: data || [] });
            } catch (err) {
                console.error('Error fetching whitelists:', err);
                dispatch({ type: 'WHITELISTS_SET', payload: [] });
            } finally {
                dispatch({ type: 'WHITELISTS_SET_LOADING', payload: false });
            }
        },
        [dispatch],
    );

    return { fetchWhitelists };
}
