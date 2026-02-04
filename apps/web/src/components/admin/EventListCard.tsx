import type { ReactNode } from 'react';

interface EventListCardProps {
    title: string;
    description?: string | null;
    status: string;
    statusTone?: 'success' | 'warning' | 'muted';
    meta?: ReactNode;
    actions?: ReactNode;
    accentBorder?: 'green' | 'blue';
}

const statusToneStyles: Record<NonNullable<EventListCardProps['statusTone']>, string> = {
    success: 'bg-[#00ff41]/20 text-[#00ff41]',
    warning: 'bg-yellow-500/20 text-yellow-300',
    muted: 'bg-gray-500/20 text-gray-300',
};

export function EventListCard({
    title,
    description,
    status,
    statusTone = 'muted',
    meta,
    actions,
    accentBorder = 'blue',
}: EventListCardProps) {
    const borderClass = accentBorder === 'green' ? 'border-[#00ff41]/50' : 'border-[#00d4ff]/20';

    return (
        <div className={`bg-[#111528] border ${borderClass} rounded-lg p-6 hover:border-[#00ff41]/50 transition`}>
            <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold text-white">{title}</h3>
                        <span className={`text-xs px-2 py-1 rounded font-medium ${statusToneStyles[statusTone]}`}>
                            {status}
                        </span>
                    </div>
                    {description && <p className="text-gray-400 text-sm mb-2">{description}</p>}
                    {meta}
                </div>
                {actions && <div className="flex gap-2">{actions}</div>}
            </div>
        </div>
    );
}
