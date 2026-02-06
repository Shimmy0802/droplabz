/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    typescript: {
        ignoreBuildErrors: true,
    },
    images: {
        unoptimized: true, // Disable image optimization for Vercel deployment
    },
};

module.exports = nextConfig;
