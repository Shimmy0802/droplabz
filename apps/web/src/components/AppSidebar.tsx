'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import {
    LayoutDashboard,
    CheckCircle,
    Rocket,
    Handshake,
    Users,
    Gift,
    Ticket,
    Trophy,
    Send,
    TrendingUp,
    Settings,
    FileText,
    User,
    CreditCard,
    LogOut,
    Home,
    Building2,
    Search,
    Star,
    ArrowLeft,
} from 'lucide-react';

interface SidebarContext {
    type: 'regular' | 'community-admin' | 'platform-admin';
    communitySlug?: string;
    communityName?: string;
}

interface MenuItem {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    href: string;
    exact?: boolean;
}

interface MenuSection {
    section: string;
    items: MenuItem[];
}

export default function AppSidebar() {
    const pathname = usePathname();
    const { data: session } = useSession();
    const [context, setContext] = useState<SidebarContext>({ type: 'regular' });
    const [currentHash, setCurrentHash] = useState('');

    // Listen for hash changes to update active states
    useEffect(() => {
        const handleHashChange = () => {
            setCurrentHash(window.location.hash.replace('#', ''));
        };

        // Set initial hash
        handleHashChange();

        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);

    useEffect(() => {
        async function determineContext() {
            // Check if user is SUPER_ADMIN
            if (session?.user?.role === 'SUPER_ADMIN' && pathname?.startsWith('/profile/admin')) {
                setContext({ type: 'platform-admin' });
                return;
            }

            // Check if viewing a community admin page
            const communityAdminMatch = pathname?.match(/\/profile\/communities\/([^\/]+)\/admin/);
            if (communityAdminMatch) {
                const slug = communityAdminMatch[1];
                try {
                    const response = await fetch(`/api/communities?slug=${slug}`);
                    if (response.ok) {
                        const data = await response.json();
                        setContext({
                            type: 'community-admin',
                            communitySlug: slug,
                            communityName: data.name,
                        });
                        return;
                    }
                } catch (error) {
                    console.error('Failed to fetch community:', error);
                }
            }

            // Default to regular user
            setContext({ type: 'regular' });
        }

        if (session) {
            void determineContext();
        }
    }, [pathname, session]);

    const isActive = (href: string, exact = false) => {
        // Check if href contains hash
        if (href.includes('#')) {
            const [path, hash] = href.split('#');
            return pathname === path && currentHash === hash;
        }

        if (exact) {
            return pathname === href;
        }
        return pathname?.startsWith(href);
    };

    // Regular user menu items
    const regularMenuItems: MenuSection[] = [
        {
            section: 'MENU',
            items: [
                { icon: Home, label: 'Overview', href: '/profile' },
                { icon: Building2, label: 'Communities', href: '/profile/communities' },
                { icon: Settings, label: 'Settings', href: '/profile/settings' },
                ...(session?.user?.role === 'SUPER_ADMIN'
                    ? [{ icon: LayoutDashboard, label: 'Admin Panel', href: '/profile/admin' }]
                    : []),
            ],
        },
    ];

    // Community admin menu items
    const getCommunityAdminMenuItems = (slug: string): MenuSection[] => [
        {
            section: 'MENU',
            items: [
                { icon: ArrowLeft, label: 'Back to Profile', href: '/profile' },
                { icon: LayoutDashboard, label: 'Overview', href: `/profile/communities/${slug}/admin`, exact: true },
                { icon: CheckCircle, label: 'Whitelists', href: `/profile/communities/${slug}/admin/whitelists` },
                { icon: Gift, label: 'Giveaways', href: `/profile/communities/${slug}/admin/giveaways` },
                { icon: Rocket, label: 'Presales', href: `/profile/communities/${slug}/admin/presales` },
                { icon: Users, label: 'Members', href: `/profile/communities/${slug}/admin/members` },
                { icon: Settings, label: 'Settings', href: `/profile/communities/${slug}/admin/settings` },
            ],
        },
        {
            section: 'ACCOUNT',
            items: [
                { icon: User, label: 'Profile', href: '/profile' },
                { icon: LogOut, label: 'Logout', href: '/api/auth/signout' },
            ],
        },
    ];

    // Platform admin menu items
    const platformAdminMenuItems: MenuSection[] = [
        {
            section: 'PLATFORM',
            items: [
                { icon: LayoutDashboard, label: 'Dashboard', href: '/profile/admin', exact: true },
                { icon: Building2, label: 'Communities', href: '/profile/admin/communities' },
            ],
        },
        {
            section: 'ACCOUNT',
            items: [
                { icon: User, label: 'Profile', href: '/profile' },
                { icon: LogOut, label: 'Logout', href: '/api/auth/signout' },
            ],
        },
    ];

    // Select menu items based on context
    let menuItems = regularMenuItems;
    let headerLabel = 'Menu';
    let headerValue = session?.user?.name || session?.user?.email || 'User';

    if (context.type === 'platform-admin') {
        menuItems = platformAdminMenuItems;
        headerLabel = 'Platform Admin';
        headerValue = 'DropLabz';
    } else if (context.type === 'community-admin' && context.communitySlug) {
        menuItems = getCommunityAdminMenuItems(context.communitySlug);
        headerLabel = 'Community';
        headerValue = context.communityName || 'Loading...';
    }

    return (
        <div className="w-52 h-full bg-black/40 border-r border-gray-800/50 flex-shrink-0 overflow-y-auto">
            <div className="p-4">
                {/* Header */}
                <div className="mb-6">
                    <p className="text-xs text-gray-500 uppercase mb-1">{headerLabel}</p>
                    <p className="text-sm font-bold text-white truncate">{headerValue}</p>
                </div>

                {/* Menu Sections */}
                {menuItems.map((section, idx) => (
                    <div key={idx} className="mb-6">
                        <p className="text-[10px] text-gray-500 uppercase font-bold mb-2 px-3">{section.section}</p>
                        <div className="space-y-1">
                            {section.items.map((item, itemIdx) => {
                                const Icon = item.icon;
                                return (
                                    <Link
                                        key={itemIdx}
                                        href={item.href}
                                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition ${
                                            isActive(item.href, item.exact ?? false)
                                                ? 'bg-[#00ff41]/10 text-[#00ff41] font-semibold'
                                                : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                                        }`}
                                    >
                                        <Icon className="w-4 h-4" />
                                        <span>{item.label}</span>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
