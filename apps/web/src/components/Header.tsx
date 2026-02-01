'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useSession, signOut } from 'next-auth/react';
import SearchBar from './SearchBar';

export default function Header() {
    const { data: session, status } = useSession();

    return (
        <header className="sticky top-0 z-50 bg-black backdrop-blur-lg bg-opacity-95 py-3">
            <div className="px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between gap-6">
                    {/* Logo */}
                    <div className="flex-shrink-0">
                        <Link href="/" className="flex items-center">
                            <Image
                                src="/logos/droplabz.png"
                                alt="DropLabz - Web3 Community Infrastructure"
                                width={480}
                                height={140}
                                className="h-20 w-auto"
                                priority
                            />
                        </Link>
                    </div>

                    {/* Navigation */}
                    <nav className="flex items-center gap-6 text-sm font-medium text-gray-400">
                        <Link href="/" className="hover:text-[#00d4ff] transition">
                            Home
                        </Link>
                        <Link href="/communities" className="hover:text-[#00d4ff] transition">
                            Communities
                        </Link>
                        <Link href="/#whitelists" className="hover:text-[#00d4ff] transition">
                            Whitelists
                        </Link>
                        <Link href="/#presales" className="hover:text-[#00d4ff] transition">
                            Pre-Sales
                        </Link>
                        <Link href="/#collaborations" className="hover:text-[#00d4ff] transition">
                            Collaborations
                        </Link>
                    </nav>

                    {/* Search Bar */}
                    <div className="flex-1 max-w-xl">
                        <SearchBar />
                    </div>

                    {/* Auth Buttons */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                        {status === 'loading' ? (
                            <div className="h-10 w-24 bg-gray-700 rounded animate-pulse" />
                        ) : session ? (
                            <div className="flex items-center gap-2">
                                <Link
                                    href="/profile"
                                    className="px-4 py-2 rounded-lg text-sm border border-[#00d4ff] text-[#00d4ff] hover:bg-[rgba(0,212,255,0.1)] transition"
                                >
                                    Profile
                                </Link>
                                <button
                                    onClick={() => signOut({ redirect: true, redirectTo: '/' })}
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
                                    href="/signup"
                                    className="px-4 py-2 rounded-lg text-sm bg-[#00ff41] text-[#0a0e27] font-semibold hover:bg-[#00dd33] transition shadow-[0_0_20px_rgba(0,255,65,0.3)] hover:shadow-[0_0_30px_rgba(0,255,65,0.5)]"
                                >
                                    Sign Up
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}
