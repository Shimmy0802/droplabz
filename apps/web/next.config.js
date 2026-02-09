/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    typescript: {
        // IMPORTANT: Do NOT ignore build errors in production
        // Set to false to catch all TypeScript errors during build
        ignoreBuildErrors: false,
    },
    images: {
        // Enable image optimization for better performance
        // Vercel supports Next.js Image Optimization out of the box
        unoptimized: false,
        // Specify allowed image domains for external images
        remotePatterns: [
            {
                protocol: 'https',
                hostname: '**',
            },
        ],
    },
    // Enable compression for responses
    compress: true,
    // Security headers
    headers: async () => {
        return [
            {
                source: '/(.*)',
                headers: [
                    {
                        key: 'X-Content-Type-Options',
                        value: 'nosniff',
                    },
                    {
                        key: 'X-Frame-Options',
                        value: 'DENY',
                    },
                    {
                        key: 'X-XSS-Protection',
                        value: '1; mode=block',
                    },
                    {
                        key: 'Referrer-Policy',
                        value: 'strict-origin-when-cross-origin',
                    },
                ],
            },
        ];
    },
};

module.exports = nextConfig;
