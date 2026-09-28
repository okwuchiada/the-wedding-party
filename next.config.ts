import type { NextConfig } from "next";

// Links shared before multi-tenancy pointed at the site root. When set, send them
// to the original wedding's new home under /w/<slug>.
const legacySlug = process.env.LEGACY_WEDDING_SLUG;

// Hosts next/image may fetch and resize: our upload bucket plus the stock photo
// host used in seed data. Anything else (a link a couple pastes) is shown as-is
// with `unoptimized` (lib/image-src.ts), so the optimizer can't be used to fetch
// arbitrary URLs at our expense.
const uploadsHost =
  process.env.AWS_S3_BUCKET_NAME && process.env.AWS_REGION
    ? `${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com`
    : null;
const optimizedImageHosts = [uploadsHost, "images.unsplash.com"].filter((host): host is string => !!host);

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
  env: {
    NEXT_PUBLIC_OPTIMIZED_IMAGE_HOSTS: optimizedImageHosts.join(","),
  },
  images: {
    remotePatterns: optimizedImageHosts.map((hostname) => ({ protocol: "https" as const, hostname })),
  },
};

export default nextConfig;
