import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Vercel handles deployment natively — no standalone output needed
  // (standalone is for self-hosted Docker/VPS, not Vercel)
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // Prisma needs to be externalized in serverless (Vercel)
  // This is handled automatically by @prisma/client in Next.js 16
};

export default nextConfig;
