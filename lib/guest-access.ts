import "server-only";
import { cache } from "react";
import { checkGeoAccess } from "@/lib/geo";
import { getGuestWedding } from "@/lib/tenant";

export type GuestBlock = { kind: "unavailable"; reason: "suspended" | "closed" } | { kind: "geo"; codeRejected: boolean };

/**
 * The single visibility check for guest pages. The layout AND every page must
 * call it: Next renders pages separately from their layout, so a layout that
 * hides `children` still sends the page's content to the browser.
 */
export const getGuestAccess = cache(async (slug: string) => {
  const { wedding, preview, unavailable } = await getGuestWedding(slug);
  if (unavailable) return { wedding, preview, block: { kind: "unavailable", reason: unavailable } as GuestBlock };

  const geo = await checkGeoAccess(wedding);
  const block: GuestBlock | null = geo.blocked ? { kind: "geo", codeRejected: geo.codeRejected } : null;
  return { wedding, preview, block };
});
