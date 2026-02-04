import type { ReactNode } from 'react';

interface EventListPageShellProps {
    title: string;
    description?: string;
    cta?: ReactNode;
    tabs?: ReactNode;
    error?: string | null;
    children: ReactNode;
}

export function EventListPageShell({ title, description, cta, tabs, error, children }: EventListPageShellProps) {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-4xl font-bold text-[#00ff41]">{title}</h1>
                    {description && <p className="text-gray-400 mt-2">{description}</p>}
                </div>
                {cta}
            </div>

            {error && <div className="bg-red-500/20 border border-red-500 text-red-200 p-3 rounded">{error}</div>}

            {tabs}
            {children}
        </div>
    );
}
