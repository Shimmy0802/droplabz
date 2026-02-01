'use client';

import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CreateWhitelistForm } from '@/components/whitelists/CreateWhitelistForm';

export default function CreateWhitelistPage() {
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
                router.push('/communities');
                return;
            }

            const data = await response.json();
            setCommunityId(data.id);
        } catch (err) {
            console.error('Error fetching community:', err);
            router.push('/communities');
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
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-bold text-white">Create Whitelist</h1>
                    <p className="text-gray-400 mt-2">Set up a new whitelist with custom requirements</p>
                </div>
                <Link
                    href={`/profile/communities/${slug}/admin/whitelists`}
                    className="px-4 py-2 bg-gray-900 border border-gray-700 text-white rounded-lg hover:border-gray-600"
                >
                    Back
                </Link>
            </div>

            <CreateWhitelistForm communityId={communityId} slug={slug} />
        </div>
    );
}
