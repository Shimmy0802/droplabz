'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface JoinCommunityButtonProps {
    communityId: string;
    isAuthenticated: boolean;
    isMember: boolean;
    isListed: boolean;
    onJoinSuccess?: () => void;
}

export function JoinCommunityButton({
    communityId,
    isAuthenticated,
    isMember,
    isListed,
    onJoinSuccess,
}: JoinCommunityButtonProps) {
    const router = useRouter();
    const [joining, setJoining] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    async function handleJoin() {
        // Redirect to sign in if not authenticated
        if (!isAuthenticated) {
            router.push(`/api/auth/signin`);
            return;
        }

        setJoining(true);
        setError(null);

        try {
            const response = await fetch(`/api/communities/${communityId}/join`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || data.error || 'Failed to join community');
            }

            setSuccess(true);
            if (onJoinSuccess) {
                onJoinSuccess();
            }

            // Refresh the page after a short delay to show success state
            setTimeout(() => {
                router.refresh();
            }, 1500);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setJoining(false);
        }
    }

    // Don't show button if community is not listed
    if (!isListed) {
        return null;
    }

    // Success state (show before updating to member)
    if (success) {
        return (
            <div className="text-center">
                <button disabled className="px-6 py-3 bg-[#00ff41] text-[#0a0e27] rounded-lg font-semibold shadow-lg">
                    ✓ Joined Successfully!
                </button>
                <p className="mt-1 text-xs text-[#00ff41]">Welcome to the community!</p>
            </div>
        );
    }

    // Already a member
    if (isMember) {
        return (
            <button disabled className="px-6 py-3 bg-gray-700/50 text-gray-300 rounded-lg font-semibold cursor-not-allowed border border-gray-600">
                ✓ Member
            </button>
        );
    }

    return (
        <div className="text-center">
            <button
                onClick={handleJoin}
                disabled={joining}
                className="px-6 py-3 bg-[#00ff41] hover:bg-[#00dd33] text-[#0a0e27] rounded-lg font-semibold transition shadow-lg hover:shadow-[#00ff41]/50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {joining ? 'Joining...' : !isAuthenticated ? 'Sign in to Join' : 'Join Community'}
            </button>
            {error && <p className="mt-1 text-xs text-red-400 max-w-xs">{error}</p>}
        </div>
    );
}
