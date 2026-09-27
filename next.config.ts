import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone output is only needed for self-hosting (Docker/VPS).
  // On Vercel we rely on the platform's own build, so we disable it there.
  output: process.env.VERCEL ? undefined : "standalone",

  // Make sure the bundled SQLite database travels with every API route
  // into the serverless deployment (read-only; copied to /tmp at runtime).
  outputFileTracingIncludes: {
    "/api/**": ["./db/custom.db"],
  },

  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  devIndicators: false,
};

export default nextConfig;
