'use client';

import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CreateGiveawayForm } from '@/components/giveaways/CreateGiveawayForm';
import { ArrowLeft } from 'lucide-react';

export default function CreateGiveawayPage() {
    const { slug } = useParams() as { slug: string };
    const router = useRouter();
    const { status } = useSession();
    const [communityId, setCommunityId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
            return;
        }

        if (status === 'authenticated') {
            fetchCommunity();
        }
    }, [status, slug, router]);

    const fetchCommunity = async () => {
        try {
            const response = await fetch(`/api/communities?slug=${slug}`);
            if (!response.ok) {
                router.push('/profile/communities');
                return;
            }

            const data = await response.json();
            setCommunityId(data.id);
        } catch (err) {
            console.error('Error fetching community:', err);
            router.push('/profile/communities');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="h-64 bg-gray-700 rounded animate-pulse" />
            </div>
        );
    }

    if (!communityId) {
        return null;
    }

    return (
        <div className="px-4 sm:px-6 lg:px-8 py-6">
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-bold text-white">Create Giveaway</h1>
                        <p className="text-gray-400 mt-2">
                            Set up a new giveaway with custom requirements and prize details
                        </p>
                    </div>
                    <Link
                        href={`/profile/communities/${slug}/admin/giveaways`}
                        className="px-4 py-2 bg-gray-900 border border-gray-700 text-white rounded-lg hover:border-gray-600 flex items-center gap-2"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back
                    </Link>
                </div>

                <CreateGiveawayForm communityId={communityId} slug={slug} />
            </div>
        </div>
    );
}
