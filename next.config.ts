import type { NextConfig } from "next";

// Links shared before multi-tenancy pointed at the site root. When set, send them
// to the original wedding's new home under /w/<slug>.
const legacySlug = process.env.LEGACY_WEDDING_SLUG;

const nextConfig: NextConfig = {
  async redirects() {
    const redirects = [
      { source: "/admin", destination: "/dashboard", permanent: false },
      { source: "/admin/login", destination: "/login", permanent: false },
    ];
    if (legacySlug) {
      redirects.push(
        { source: "/", destination: `/w/${legacySlug}`, permanent: false },
        { source: "/gallery", destination: `/w/${legacySlug}/gallery`, permanent: false },
        { source: "/wishes", destination: `/w/${legacySlug}/wishes`, permanent: false }
      );
    }
    return redirects;
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "30mb",
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
      {
        protocol: "http",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
