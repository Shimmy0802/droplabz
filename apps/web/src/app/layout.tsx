import type { Metadata } from 'next';
import { RootLayoutClient } from '@/components/RootLayoutClient';
import './globals.css';

export const metadata: Metadata = {
    title: 'DropLabz',
    description: 'Solana-native community operations platform',
    icons: {
        icon: '/logos/discord icon.png',
        shortcut: '/logos/discord icon.png',
        apple: '/logos/discord icon.png',
    },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" className="h-full">
            <body
                className="min-h-screen text-white antialiased"
                style={{
                    backgroundColor: '#0a0e27',
                    backgroundImage:
                        'linear-gradient(rgba(10, 14, 39, 0.88), rgba(17, 21, 40, 0.9)), url("/logos/droplabz.png")',
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'center center',
                    backgroundSize: 'cover',
                    backgroundAttachment: 'fixed',
                    backgroundBlendMode: 'soft-light',
                }}
            >
                <RootLayoutClient>{children}</RootLayoutClient>
            </body>
        </html>
    );
}
