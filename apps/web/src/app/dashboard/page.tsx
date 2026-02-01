'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Dashboard() {
    const { status } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
            return;
        }
        // Redirect authenticated users to profile—dashboard is gated/disabled for now
        if (status === 'authenticated') {
            router.replace('/profile');
        }
    }, [status, router]);

    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#00ff41]"></div>
        </div>
    );
}
