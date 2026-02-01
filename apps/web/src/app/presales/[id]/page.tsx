import { PresaleEntryPage } from '@/components/presales/PresaleEntryPage';

export default async function PresalePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    return <PresaleEntryPage eventId={id} />;
}
