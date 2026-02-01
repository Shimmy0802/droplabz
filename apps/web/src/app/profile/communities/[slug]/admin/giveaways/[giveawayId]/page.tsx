'use client';

import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { EventManagementDashboard } from '@/components/admin/EventManagementDashboard';

export default function GiveawayDetailsPage() {
    const { slug, giveawayId } = useParams() as { slug: string; giveawayId: string };
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
            <div className="space-y-6">
                <div className="text-center py-12 text-gray-400">Loading...</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-4xl font-bold text-white">Giveaway Management</h1>
                <Link
                    href={`/profile/communities/${slug}/admin/giveaways`}
                    className="px-4 py-2 bg-gray-900 border border-gray-700 text-white rounded-lg hover:border-gray-600 flex items-center gap-2"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                </Link>
            </div>

            {/* Use the new EventManagementDashboard component */}
            <EventManagementDashboard eventId={giveawayId} communitySlug={slug} />
        </div>
    );
}
