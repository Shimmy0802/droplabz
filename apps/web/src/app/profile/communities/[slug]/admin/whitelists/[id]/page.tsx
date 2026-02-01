'use client';

import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { EventManagementDashboard } from '@/components/admin/EventManagementDashboard';

export default function WhitelistDetailsPage() {
    const { slug, id } = useParams() as { slug: string; id: string };
    const router = useRouter();
    const { status } = useSession();

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
            return;
        }
    }, [status, router]);

    if (status === 'loading') {
        return (
            <div className="max-w-6xl mx-auto space-y-6">
                <div className="h-48 bg-gray-700 rounded animate-pulse" />
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-4xl font-bold text-white">Whitelist Management</h1>
                <Link
                    href={`/profile/communities/${slug}/admin/whitelists`}
                    className="px-4 py-2 bg-gray-900 border border-gray-700 text-white rounded-lg hover:border-gray-600 flex items-center gap-2"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                </Link>
            </div>

            {/* Use the new EventManagementDashboard component */}
            <EventManagementDashboard eventId={id} communitySlug={slug} />
        </div>
    );
}
