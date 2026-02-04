export default function ProfileLoading() {
    return (
        <div className="min-h-screen flex items-center justify-center px-6">
            <div className="max-w-lg w-full bg-[#111528] border border-[rgba(0,255,65,0.15)] rounded-lg p-6 space-y-4">
                <div className="h-6 bg-gray-700 rounded w-1/2 animate-pulse" />
                <div className="space-y-2">
                    <div className="h-4 bg-gray-700 rounded w-full animate-pulse" />
                    <div className="h-4 bg-gray-700 rounded w-4/5 animate-pulse" />
                </div>
                <div className="h-10 bg-gray-700 rounded w-32 animate-pulse" />
            </div>
        </div>
    );
}
