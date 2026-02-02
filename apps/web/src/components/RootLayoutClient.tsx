'use client';

import { ReactNode } from 'react';
import { WalletContextProvider } from '@/lib/wallet';
import { SessionProvider } from 'next-auth/react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

interface RootLayoutClientProps {
    children: ReactNode;
}

export function RootLayoutClient({ children }: RootLayoutClientProps) {
    return (
        <SessionProvider>
            <WalletContextProvider>
                <div className="min-h-screen flex flex-col">
                    <Header />
                    <main className="flex-1">{children}</main>
                    <Footer />
                </div>
            </WalletContextProvider>
        </SessionProvider>
    );
}
