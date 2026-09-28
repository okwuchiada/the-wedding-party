// Inlined at build time by next.config.ts; the same hosts are in images.remotePatterns.
const OPTIMIZED_HOSTS = new Set((process.env.NEXT_PUBLIC_OPTIMIZED_IMAGE_HOSTS ?? "").split(",").filter(Boolean));

/**
 * Whether next/image may optimize this src. Pasted links on other hosts must be
 * rendered with `unoptimized`, or next/image refuses them.
 */
export function canOptimizeImage(src: string) {
  if (src.startsWith("/") && !src.startsWith("//")) return true;
  try {
    const url = new URL(src);
    return url.protocol === "https:" && OPTIMIZED_HOSTS.has(url.hostname);
  } catch {
    return false;
  }
}
