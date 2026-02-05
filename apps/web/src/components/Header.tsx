'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useSession, signOut } from 'next-auth/react';
import SearchBar from './SearchBar';

export default function Header() {
    const { data: session, status } = useSession();

    return (
        <header className="sticky top-0 z-50 bg-transparent backdrop-blur-sm">
            <div className="px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between gap-6 py-3">
                    {/* Logo */}
                    <div className="flex-shrink-0">
                        <Link href="/" className="flex items-center gap-3">
                            <Image
                                src="/logos/droplabz.png"
                                alt="DropLabz — Community Operations Infrastructure"
                                width={320}
                                height={120}
                                className="h-12 sm:h-14 w-auto scale-110 origin-left"
                                priority
                            />
                        </Link>
                    </div>

                    {/* Navigation */}
                    <nav className="hidden lg:flex items-center gap-2 text-sm font-medium text-gray-200">
                        <Link href="/" className="hover:text-[#00d4ff] transition">
                            <span className="px-3 py-1.5 rounded border border-[rgba(0,255,65,0.18)] bg-[rgba(10,14,39,0.65)] hover:border-[rgba(0,255,65,0.4)] hover:text-[#00ff41] transition">
                                Home
                            </span>
                        </Link>
                        <Link href="/communities" className="hover:text-[#00d4ff] transition">
                            <span className="px-3 py-1.5 rounded border border-[rgba(0,212,255,0.18)] bg-[rgba(10,14,39,0.65)] hover:border-[rgba(0,212,255,0.45)] hover:text-[#00d4ff] transition">
                                Communities
                            </span>
                        </Link>
                        <Link href="/events" className="hover:text-[#00d4ff] transition">
                            <span className="px-3 py-1.5 rounded border border-[rgba(0,255,65,0.12)] bg-[rgba(10,14,39,0.65)] hover:border-[rgba(0,255,65,0.4)] hover:text-[#00ff41] transition">
                                Events
                            </span>
                        </Link>
                        <Link href="/trending" className="hover:text-[#00d4ff] transition">
                            <span className="px-3 py-1.5 rounded border border-[rgba(0,212,255,0.12)] bg-[rgba(10,14,39,0.65)] hover:border-[rgba(0,212,255,0.45)] hover:text-[#00d4ff] transition">
                                Trending
                            </span>
                        </Link>
                        <Link href="/giveaways" className="hover:text-[#00d4ff] transition">
                            <span className="px-3 py-1.5 rounded border border-[rgba(0,255,65,0.12)] bg-[rgba(10,14,39,0.65)] hover:border-[rgba(0,255,65,0.4)] hover:text-[#00ff41] transition">
                                Giveaways
                            </span>
                        </Link>
                    </nav>

                    {/* Search Bar */}
                    <div className="hidden md:flex w-full max-w-sm">
                        <SearchBar />
                    </div>

                    {/* Auth Buttons */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                        {status === 'loading' ? (
                            <div className="h-10 w-24 bg-gray-700 rounded animate-pulse" />
                        ) : session ? (
                            <div className="flex items-center gap-2">
                                <Link
                                    href="/profile/communities/create"
                                    className="px-4 py-2 rounded-lg text-sm bg-[#00ff41] text-[#0a0e27] font-semibold hover:bg-[#00dd33] transition shadow-[0_0_16px_rgba(0,255,65,0.18)]"
                                >
                                    Create Community
                                </Link>
                                <Link
                                    href="/profile"
                                    className="px-4 py-2 rounded-lg text-sm border border-[#00d4ff] text-[#00d4ff] hover:bg-[rgba(0,212,255,0.1)] transition hidden sm:block"
                                >
                                    Profile
                                </Link>
                                <button
                                    onClick={() => signOut({ redirect: true })}
                                    className="px-4 py-2 rounded-lg text-sm bg-red-600/20 border border-red-600/40 text-red-400 hover:bg-red-600/30 hover:border-red-600/60 transition"
                                >
                                    Logout
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Link
                                    href="/login"
                                    className="px-4 py-2 rounded-lg text-sm border border-[#00d4ff] text-[#00d4ff] hover:bg-[rgba(0,212,255,0.1)] transition hidden sm:block"
                                >
                                    Login
                                </Link>
                                <Link
                                    href="/profile/communities/create"
                                    className="px-4 py-2 rounded-lg text-sm bg-[#00ff41] text-[#0a0e27] font-semibold hover:bg-[#00dd33] transition shadow-[0_0_16px_rgba(0,255,65,0.18)]"
                                >
                                    Create Community
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}
