'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { CreateGiveawayForm } from '@/components/giveaways/CreateGiveawayForm';
import { ArrowLeft } from 'lucide-react';
import { AdminLoadingState } from '@/components/admin/AdminLoadingState';
import { useRequireAuthRedirect } from '@/hooks/useRequireAuthRedirect';
import { useCommunityBySlug } from '@/hooks/useCommunityBySlug';

export default function CreateGiveawayPage() {
    const { slug } = useParams() as { slug: string };
    const router = useRouter();
    const { status } = useRequireAuthRedirect();
    const { community, isLoading } = useCommunityBySlug(slug, {
        onNotFound: () => router.push('/profile/communities'),
        onError: () => router.push('/profile/communities'),
    });

    if (status === 'loading' || isLoading) {
        return <AdminLoadingState variant="form" />;
    }

    if (!community) {
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

                <CreateGiveawayForm communityId={community.id} slug={slug} guildId={community.guildId ?? undefined} />
            </div>
        </div>
    );
}
