'use client';

import { useParams } from 'next/navigation';
import { EventManagementDashboard } from '@/components/admin/EventManagementDashboard';
import { AdminLoadingState } from '@/components/admin/AdminLoadingState';
import { EventDetailPageShell } from '@/components/admin/EventDetailPageShell';
import { useRequireAuthRedirect } from '@/hooks/useRequireAuthRedirect';

export default function GiveawayDetailsPage() {
    const { slug, giveawayId } = useParams() as { slug: string; giveawayId: string };
    const { status } = useRequireAuthRedirect();

    if (status === 'loading') {
        return <AdminLoadingState variant="detail" />;
    }

    return (
        <EventDetailPageShell title="Giveaway Management" backHref={`/profile/communities/${slug}/admin/giveaways`}>
            <EventManagementDashboard eventId={giveawayId} communitySlug={slug} />
        </EventDetailPageShell>
    );
}
