'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';
import Link from 'next/link';

export default function SignupPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validation
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (password.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }

        setLoading(true);

        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.message || 'Failed to create account');
                return;
            }

            setSuccess(true);

            // Auto-sign in
            setTimeout(() => {
                signIn('credentials', {
                    email,
                    password,
                    redirect: true,
                    redirectTo: '/dashboard',
                });
            }, 1000);
        } catch (err) {
            setError('An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleDiscordSignIn = () => {
        signIn('discord', { redirect: true, redirectTo: '/dashboard' });
    };

    if (success) {
        return (
            <div className="flex items-center justify-center px-4 py-12 min-h-screen">
                <div className="w-full max-w-md">
                    <div className="border border-[rgba(0,255,65,0.2)] bg-[#111528] rounded-lg p-8 text-center">
                        <div className="text-5xl mb-4">✓</div>
                        <h1 className="text-2xl font-bold mb-2 text-[#00ff41]">Account Created!</h1>
                        <p className="text-gray-400">Redirecting to dashboard...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center px-4 py-12 min-h-screen">
            <div className="w-full max-w-md">
                <div className="border border-[rgba(0,212,255,0.1)] bg-[#111528] rounded-lg p-8">
                    <h1 className="text-2xl font-bold mb-2 text-center">Create Account</h1>
                    <p className="text-gray-400 text-center mb-8">Join DropLabz today</p>

                    {error && (
                        <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Discord OAuth */}
                    <button
                        onClick={handleDiscordSignIn}
                        className="w-full mb-6 px-4 py-3 rounded-lg bg-[#5865F2] hover:bg-[#4752C4] text-white font-semibold transition"
                    >
                        Sign up with Discord
                    </button>

                    <div className="relative mb-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-[rgba(0,212,255,0.1)]"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-[#111528] text-gray-500">Or sign up with email</span>
                        </div>
                    </div>

                    {/* Email/Password Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium mb-2">
                                Email
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                className="w-full px-4 py-2 rounded-lg bg-[#0a0e27] border border-[#00d4ff] text-white placeholder-gray-600 focus:outline-none focus:border-[#00ff41] transition"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium mb-2">
                                Password
                            </label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="Minimum 8 characters"
                                className="w-full px-4 py-2 rounded-lg bg-[#0a0e27] border border-[#00d4ff] text-white placeholder-gray-600 focus:outline-none focus:border-[#00ff41] transition"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">
                                Confirm Password
                            </label>
                            <input
                                id="confirmPassword"
                                type="password"
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full px-4 py-2 rounded-lg bg-[#0a0e27] border border-[#00d4ff] text-white placeholder-gray-600 focus:outline-none focus:border-[#00ff41] transition"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full px-4 py-2 rounded-lg bg-[#00ff41] text-[#0a0e27] font-semibold hover:bg-[#00dd33] disabled:opacity-50 disabled:cursor-not-allowed transition"
                        >
                            {loading ? 'Creating account...' : 'Create Account'}
                        </button>
                    </form>

                    <div className="mt-6 text-center text-sm text-gray-400">
                        Already have an account?{' '}
                        <Link href="/login" className="text-[#00d4ff] hover:text-[#00ff41] transition">
                            Sign in
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
