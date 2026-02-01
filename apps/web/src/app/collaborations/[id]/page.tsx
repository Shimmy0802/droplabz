import { CollaborationEntryPage } from '@/components/collaborations/CollaborationEntryPage';

export default async function CollaborationPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    return <CollaborationEntryPage eventId={id} />;
}
