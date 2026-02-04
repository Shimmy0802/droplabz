import type { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface EventDetailPageShellProps {
    title: string;
    backHref: string;
    backLabel?: string;
    children: ReactNode;
}

export function EventDetailPageShell({ title, backHref, backLabel = 'Back', children }: EventDetailPageShellProps) {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-4xl font-bold text-white">{title}</h1>
                <Link
                    href={backHref}
                    className="px-4 py-2 bg-gray-900 border border-gray-700 text-white rounded-lg hover:border-gray-600 flex items-center gap-2"
                >
                    <ArrowLeft className="w-4 h-4" />
                    {backLabel}
                </Link>
            </div>
            {children}
        </div>
    );
}
