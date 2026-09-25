import "server-only";
import { cache } from "react";
import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { scopedPrisma } from "@/lib/db-scoped";
import { canManageWedding } from "@/lib/dal";
import { checkGeoAccess } from "@/lib/geo";
import { hasFeature, planAllowsTheme, siteHasClosed } from "@/lib/plans";
import { resolveLayout } from "@/lib/layouts";
import { resolveTheme } from "@/lib/themes";

const WEDDING_INCLUDE = { plan: true, theme: true, copy: true } as const;

export const getWeddingBySlug = cache(async (slug: string) =>
  prisma.wedding.findUnique({ where: { slug }, include: WEDDING_INCLUDE })
);

/** The wedding with its plan, theme and copy, for components that only get an id. */
export const getWeddingById = cache(async (weddingId: string) =>
  prisma.wedding.findUniqueOrThrow({ where: { id: weddingId }, include: WEDDING_INCLUDE })
);

type ThemedWedding = {
  status: string;
  plan: { features: unknown; themes: string[] } | null;
  theme: Parameters<typeof resolveTheme>[0];
};

/**
 * Custom colors and fonts need the plan feature, and themes must be in the plan;
 * drafts preview anything. A live site on a theme its plan lacks shows the
 * plan's first theme instead.
 */
export function weddingTheme(wedding: ThemedWedding) {
  const draft = wedding.status === "DRAFT";
  const stored = wedding.theme;
  if (!draft && stored && !planAllowsTheme(wedding.plan, stored.presetKey)) {
    return resolveTheme({ ...stored, presetKey: wedding.plan!.themes[0] }, false);
  }
  return resolveTheme(stored ?? undefined, draft || hasFeature(wedding.plan, "customTheme"));
}

/** How the couple shows their names everywhere: full or first names only. */
export async function getNameStyle(weddingId: string) {
  return resolveLayout((await getWeddingById(weddingId)).theme).heroNames;
}

export function moneyFormat(wedding: { currency: string; locale: string }) {
  return { currency: wedding.currency, locale: wedding.locale };
}

export type GuestWedding = NonNullable<Awaited<ReturnType<typeof getWeddingBySlug>>>;

/** A live site whose plan's availability (counted from the wedding date) has run out. */
async function hasClosed(wedding: GuestWedding) {
  if (wedding.status !== "ACTIVE" || wedding.plan?.availabilityMonths == null) return false;
  const story = await getStory(wedding.id);
  return siteHasClosed(wedding.plan, story?.weddingDate);
}

/**
 * The wedding a guest page may show: live weddings for everyone, drafts and
 * closed sites only for people who manage them (preview). Returns null when
 * neither applies.
 */
async function resolveViewableWedding(slug: unknown) {
  if (typeof slug !== "string" || !slug) return null;
  const wedding = await getWeddingBySlug(slug);
  if (!wedding) return null;
  const closed = await hasClosed(wedding);
  if (wedding.status === "ACTIVE" && !closed) return { wedding, preview: false };
  if ((wedding.status === "DRAFT" || closed) && (await canManageWedding(wedding.id, "view"))) {
    return { wedding, preview: true };
  }
  return null;
}

/**
 * For guest pages: 404s unless the viewer may see the wedding. Suspended and
 * archived weddings, and sites whose plan has run out, resolve with
 * `unavailable` so the layout can say so.
 */
export const getGuestWedding = cache(async (slug: string) => {
  const result = await resolveViewableWedding(slug);
  if (result) return { ...result, unavailable: null };

  const wedding = await getWeddingBySlug(slug);
  if (wedding && (wedding.status === "SUSPENDED" || wedding.status === "ARCHIVED")) {
    return { wedding, preview: false, unavailable: "suspended" as const };
  }
  if (wedding && (await hasClosed(wedding))) return { wedding, preview: false, unavailable: "closed" as const };
  notFound();
});

/**
 * For public server actions. The slug comes from the client, so the wedding is
 * re-resolved with the same visibility rules as the page itself, including the
 * country restriction.
 */
export async function resolveGuestAction(slug: unknown) {
  const result = await resolveViewableWedding(slug);
  if (!result) return null;
  if ((await checkGeoAccess(result.wedding)).blocked) return null;
  return { wedding: result.wedding, db: scopedPrisma(result.wedding.id) };
}

export const getStory = cache(async (weddingId: string) =>
  prisma.storyContent.findUnique({ where: { weddingId } })
);

export function guestPath(slug: string, path = "") {
  return `/w/${slug}${path}`;
}

export function dashboardPath(weddingId: string) {
  return `/dashboard/${weddingId}`;
}

/** Refresh every guest page and the dashboard of a wedding after a change. */
export function revalidateWedding(wedding: { id: string; slug: string }) {
  revalidatePath(guestPath(wedding.slug), "layout");
  revalidatePath(dashboardPath(wedding.id));
}

/** Refresh only the dashboard, for changes guests can't see (e.g. a new RSVP). */
export function revalidateDashboard(wedding: { id: string }) {
  revalidatePath(dashboardPath(wedding.id));
}
