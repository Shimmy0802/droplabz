'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import CreateCommunityForm from '@/components/profile/CreateCommunityForm';

export default function CreateCommunityPage() {
    const { status } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
        }
    }, [status, router]);

    if (status === 'loading') {
        return (
            <div className="space-y-6">
                <div className="h-10 bg-gray-700 rounded animate-pulse w-64" />
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-12 bg-gray-700 rounded animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    if (status === 'unauthenticated') {
        return null;
    }

    return (
        <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-4">
            <div className="max-w-2xl space-y-4">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-white">Create Community</h1>
                    <p className="text-gray-400 mt-2">Set up a new community for your project</p>
                    <p className="text-yellow-300/80 text-sm mt-3">
                        Communities require manual verification. After creating, open a Discord ticket for approval.
                    </p>
                </div>

                <div className="border border-gray-700 rounded-lg p-8 bg-gray-900/40">
                    <CreateCommunityForm />
                </div>

                {/* Help section */}
                <div className="mt-8 p-6 bg-gray-900/40 border border-gray-700 rounded-lg">
                    <h3 className="text-white font-semibold mb-4">What is a community?</h3>
                    <ul className="space-y-2 text-gray-400 text-sm">
                        <li className="flex gap-3">
                            <span className="text-[#00d4ff] font-bold">→</span>
                            <span>A dedicated space to manage whitelists, presales, and collaborations</span>
                        </li>
                        <li className="flex gap-3">
                            <span className="text-[#00d4ff] font-bold">→</span>
                            <span>Connected to your Discord server for integrated operations</span>
                        </li>
                        <li className="flex gap-3">
                            <span className="text-[#00d4ff] font-bold">→</span>
                            <span>Verify participants through Discord and Solana wallet requirements</span>
                        </li>
                        <li className="flex gap-3">
                            <span className="text-[#00d4ff] font-bold">→</span>
                            <span>Manage team members with customizable roles</span>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
