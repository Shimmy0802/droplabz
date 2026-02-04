'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

export function useRequireAuthRedirect(redirectTo = '/login') {
    const router = useRouter();
    const { status } = useSession();

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push(redirectTo);
        }
    }, [redirectTo, router, status]);

    return { status };
}
