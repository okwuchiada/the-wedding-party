import "server-only";
import { cookies, headers } from "next/headers";
import { canManageWedding } from "@/lib/dal";

export const GEO_BYPASS_PARAM = "access";

export function geoBypassCookieName(slug: string) {
  return `geo-bypass-${slug}`;
}

/**
 * Whether the guest site should be hidden from this visitor. Weddings can limit
 * their site to certain countries (Vercel's geo header); guests abroad unlock it
 * with the wedding's access code, which proxy.ts stores in a cookie.
 */
export async function checkGeoAccess(wedding: {
  id: string;
  slug: string;
  allowedCountries: string[];
  geoBypassToken: string | null;
}): Promise<{ blocked: false } | { blocked: true; codeRejected: boolean }> {
  if (wedding.allowedCountries.length === 0) return { blocked: false };

  const country = (await headers()).get("x-vercel-ip-country");
  if (!country || wedding.allowedCountries.includes(country.toUpperCase())) {
    return { blocked: false };
  }

  const code = (await cookies()).get(geoBypassCookieName(wedding.slug))?.value;
  if (code && wedding.geoBypassToken && code === wedding.geoBypassToken) {
    return { blocked: false };
  }
  if (await canManageWedding(wedding.id, "view")) return { blocked: false };

  return { blocked: true, codeRejected: Boolean(code) };
}
