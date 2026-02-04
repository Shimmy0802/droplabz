'use client';

import { useParams } from 'next/navigation';
import { EventManagementDashboard } from '@/components/admin/EventManagementDashboard';
import { AdminLoadingState } from '@/components/admin/AdminLoadingState';
import { EventDetailPageShell } from '@/components/admin/EventDetailPageShell';
import { useRequireAuthRedirect } from '@/hooks/useRequireAuthRedirect';

export default function WhitelistDetailsPage() {
    const { slug, id } = useParams() as { slug: string; id: string };
    const { status } = useRequireAuthRedirect();

    if (status === 'loading') {
        return <AdminLoadingState variant="detail" />;
    }

    return (
        <EventDetailPageShell title="Whitelist Management" backHref={`/profile/communities/${slug}/admin/whitelists`}>
            <EventManagementDashboard eventId={id} communitySlug={slug} />
        </EventDetailPageShell>
    );
}
