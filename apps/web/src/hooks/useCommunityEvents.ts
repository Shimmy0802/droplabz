'use client';

import { useCallback, useEffect, useState } from 'react';
import type { AdminEventListItem } from '@/types/events';

interface UseCommunityEventsOptions {
    communityId?: string | null;
    type?: string;
    enabled?: boolean;
}

export function useCommunityEvents({ communityId, type, enabled = true }: UseCommunityEventsOptions) {
    const [events, setEvents] = useState<AdminEventListItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchEvents = useCallback(async () => {
        if (!communityId || !enabled) return;
        try {
            setIsLoading(true);
            setError(null);
            const params = new URLSearchParams();
            params.set('communityId', communityId);
            if (type) {
                params.set('type', type);
            }

            const response = await fetch(`/api/events?${params.toString()}`);
            if (!response.ok) {
                throw new Error('Failed to load events');
            }

            const data = (await response.json()) as AdminEventListItem[];
            setEvents(data || []);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to load events';
            setError(message);
        } finally {
            setIsLoading(false);
        }
    }, [communityId, enabled, type]);

    useEffect(() => {
        fetchEvents();
    }, [fetchEvents]);

    return { events, setEvents, isLoading, error, fetchEvents };
}
