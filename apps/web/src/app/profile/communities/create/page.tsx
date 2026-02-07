'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import CommunityCreationWizard from '@/components/community/CommunityCreationWizard';

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
            <div className="min-h-full px-4 sm:px-6 lg:px-8 py-6">
                <div className="max-w-3xl mx-auto space-y-6">
                    <div className="h-10 bg-gray-700 rounded animate-pulse w-64" />
                    <div className="space-y-4">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="h-12 bg-gray-700 rounded animate-pulse" />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (status === 'unauthenticated') {
        return null;
    }

    return (
        <div className="min-h-full px-4 sm:px-6 lg:px-8 py-6 space-y-8">
            <CommunityCreationWizard />

            {/* Info section */}
            <div className="p-6 bg-gray-900/30 border border-gray-700 rounded-lg backdrop-blur-sm">
                <h3 className="text-xl font-semibold text-white mb-4">What is a community?</h3>
                <ul className="space-y-3 text-gray-300 text-sm">
                    <li className="flex gap-3">
                        <span className="text-[#00ff41] font-bold flex-shrink-0">→</span>
                        <span>A dedicated space to manage whitelists, presales, and collaborations</span>
                    </li>
                    <li className="flex gap-3">
                        <span className="text-[#00ff41] font-bold flex-shrink-0">→</span>
                        <span>Connected to your Discord server for integrated operations</span>
                    </li>
                    <li className="flex gap-3">
                        <span className="text-[#00ff41] font-bold flex-shrink-0">→</span>
                        <span>Verify participants through Discord and Solana wallet requirements</span>
                    </li>
                    <li className="flex gap-3">
                        <span className="text-[#00ff41] font-bold flex-shrink-0">→</span>
                        <span>Manage team members with customizable roles</span>
                    </li>
                </ul>
            </div>
        </div>
    );
}
