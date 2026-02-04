'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { CreateWhitelistForm } from '@/components/whitelists/CreateWhitelistForm';
import { AdminLoadingState } from '@/components/admin/AdminLoadingState';
import { useRequireAuthRedirect } from '@/hooks/useRequireAuthRedirect';
import { useCommunityBySlug } from '@/hooks/useCommunityBySlug';

export default function CreateWhitelistPage() {
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
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-bold text-white">Create Whitelist</h1>
                    <p className="text-gray-400 mt-2">Set up a new whitelist with custom requirements</p>
                </div>
                <Link
                    href={`/communities/${slug}/admin?tab=whitelists`}
                    className="px-4 py-2 bg-gray-900 border border-gray-700 text-white rounded-lg hover:border-gray-600"
                >
                    Back
                </Link>
            </div>

            <CreateWhitelistForm communityId={community.id} slug={slug} />
        </div>
    );
}
