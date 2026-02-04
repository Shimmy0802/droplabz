'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { EditGiveawayForm } from '@/components/giveaways/EditGiveawayForm';
import { ArrowLeft } from 'lucide-react';
import { AdminLoadingState } from '@/components/admin/AdminLoadingState';
import { useRequireAuthRedirect } from '@/hooks/useRequireAuthRedirect';

export default function EditGiveawayPage() {
    const { slug, giveawayId } = useParams() as { slug: string; giveawayId: string };
    const { status } = useRequireAuthRedirect();
    const [event, setEvent] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (status === 'authenticated') {
            fetchEvent();
        }
    }, [giveawayId, status]);

    const fetchEvent = async () => {
        try {
            const response = await fetch(`/api/events/${giveawayId}`);
            if (!response.ok) {
                if (response.status === 404) {
                    setError('Giveaway not found');
                } else {
                    setError('Failed to load giveaway');
                }
                return;
            }

            const data = await response.json();
            setEvent(data.event);
        } catch (err) {
            console.error('Error fetching event:', err);
            setError('Failed to load giveaway');
        } finally {
            setLoading(false);
        }
    };

    if (status === 'loading' || loading) {
        return <AdminLoadingState variant="form" />;
    }

    if (error || !event) {
        return (
            <div className="px-4 sm:px-6 lg:px-8 py-6">
                <div className="max-w-4xl mx-auto space-y-6">
                    <div className="text-center py-12">
                        <h2 className="text-2xl font-bold text-white mb-4">{error || 'Giveaway not found'}</h2>
                        <Link
                            href={`/profile/communities/${slug}/admin/giveaways`}
                            className="text-[#00d4ff] hover:text-[#00ff41]"
                        >
                            Back to Giveaways
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="px-4 sm:px-6 lg:px-8 py-6">
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-bold text-white">Edit Giveaway</h1>
                        <p className="text-gray-400 mt-2">Update giveaway settings and requirements</p>
                    </div>
                    <Link
                        href={`/profile/communities/${slug}/admin/giveaways/${giveawayId}`}
                        className="px-4 py-2 bg-gray-900 border border-gray-700 text-white rounded-lg hover:border-gray-600 flex items-center gap-2"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back
                    </Link>
                </div>

                <EditGiveawayForm event={event} slug={slug} />
            </div>
        </div>
    );
}
