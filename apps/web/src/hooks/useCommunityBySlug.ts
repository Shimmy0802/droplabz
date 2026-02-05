'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Community } from '@/hooks/useAdminPageState';

interface UseCommunityBySlugOptions {
    onNotFound?: () => void;
    onError?: (message: string) => void;
}

export function useCommunityBySlug(slug: string | null, options?: UseCommunityBySlugOptions) {
    const [community, setCommunity] = useState<Community | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const onNotFoundRef = useRef(options?.onNotFound);
    const onErrorRef = useRef(options?.onError);

    useEffect(() => {
        onNotFoundRef.current = options?.onNotFound;
        onErrorRef.current = options?.onError;
    }, [options?.onNotFound, options?.onError]);

    const fetchCommunity = useCallback(async () => {
        if (!slug) return;
        try {
            setIsLoading(true);
            setError(null);
            const response = await fetch(`/api/communities?slug=${slug}`);

            if (!response.ok) {
                if (response.status === 404) {
                    const message = 'Community not found';
                    setError(message);
                    onNotFoundRef.current?.();
                    return;
                }
                throw new Error('Failed to fetch community');
            }

            const data = (await response.json()) as Community;
            setCommunity(data);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to fetch community';
            setError(message);
            onErrorRef.current?.(message);
        } finally {
            setIsLoading(false);
        }
    }, [slug]);

    useEffect(() => {
        fetchCommunity();
    }, [fetchCommunity]);

    return { community, isLoading, error, fetchCommunity };
}
