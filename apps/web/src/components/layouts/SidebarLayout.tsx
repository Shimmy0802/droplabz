'use client';

import AppSidebar from '@/components/AppSidebar';

export default function SidebarLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex gap-4 min-h-full">
            <div className="px-4 pt-4">
                <AppSidebar />
            </div>
            <div className="flex-1 pr-4 pt-4">{children}</div>
        </div>
    );
}
