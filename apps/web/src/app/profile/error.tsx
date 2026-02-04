'use client';

import Link from 'next/link';

interface ProfileErrorProps {
    error: Error & { digest?: string };
    reset: () => void;
}

export default function ProfileError({ error, reset }: ProfileErrorProps) {
    return (
        <div className="min-h-screen flex items-center justify-center px-6">
            <div className="max-w-lg w-full bg-[#111528] border border-[rgba(0,255,65,0.15)] rounded-lg p-6 space-y-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Profile error</h1>
                    <p className="text-gray-400 text-sm mt-2">
                        We hit an issue loading your profile area. You can retry or go back to communities.
                    </p>
                </div>
                <div className="bg-red-900/20 border border-red-800/60 rounded-lg p-3">
                    <p className="text-red-300 text-xs break-words">{error.message}</p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <button
                        onClick={reset}
                        className="px-4 py-2 bg-[#00ff41] text-black rounded-lg font-semibold hover:bg-[#00dd33] transition text-sm"
                    >
                        Try again
                    </button>
                    <Link
                        href="/profile/communities"
                        className="px-4 py-2 bg-[#00d4ff] text-black rounded-lg font-semibold hover:bg-[#0099cc] transition text-sm"
                    >
                        Back to communities
                    </Link>
                </div>
            </div>
        </div>
    );
}
