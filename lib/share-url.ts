/**
 * The full link couples share with guests: the wedding's own domain if it has one,
 * otherwise the site address plus /w/<slug>. Null when the site address isn't set,
 * so the browser can use its own origin instead.
 */
export function guestShareUrl(wedding: { slug: string; customDomain: string | null }, siteUrl: string | undefined) {
  if (wedding.customDomain) return `https://${wedding.customDomain}`;
  if (!siteUrl) return null;
  return `${siteUrl.replace(/\/+$/, "")}/w/${wedding.slug}`;
}
