export interface AdminEventListItem {
    id: string;
    title: string;
    description?: string | null;
    status: string;
    createdAt: string;
    endAt?: string | null;
    startAt?: string | null;
    maxWinners?: number | null;
    prize?: string | null;
    _count?: {
        entries: number;
    };
}
