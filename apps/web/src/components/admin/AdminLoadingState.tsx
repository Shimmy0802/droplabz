interface AdminLoadingStateProps {
    variant?: 'page' | 'list' | 'detail' | 'form';
}

export function AdminLoadingState({ variant = 'page' }: AdminLoadingStateProps) {
    if (variant === 'list') {
        return (
            <div className="space-y-3">
                {[1, 2, 3].map(item => (
                    <div key={item} className="h-20 bg-gray-800 rounded animate-pulse" />
                ))}
            </div>
        );
    }

    if (variant === 'detail') {
        return (
            <div className="max-w-6xl mx-auto space-y-6">
                <div className="h-48 bg-gray-700 rounded animate-pulse" />
            </div>
        );
    }

    if (variant === 'form') {
        return (
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="h-64 bg-gray-700 rounded animate-pulse" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="h-32 bg-gray-700 rounded animate-pulse" />
            <div className="space-y-4">
                {[1, 2, 3].map(item => (
                    <div key={item} className="h-24 bg-gray-700 rounded animate-pulse" />
                ))}
            </div>
        </div>
    );
}
