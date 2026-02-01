import { WhitelistEntryPage } from '@/components/whitelists/WhitelistEntryPage';

export default async function WhitelistPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    return <WhitelistEntryPage eventId={id} />;
}
