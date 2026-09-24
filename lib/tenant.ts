import "server-only";
import { cache } from "react";
import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { scopedPrisma } from "@/lib/db-scoped";
import { canManageWedding } from "@/lib/dal";

export const getWeddingBySlug = cache(async (slug: string) =>
  prisma.wedding.findUnique({ where: { slug }, include: { plan: true } })
);

export type GuestWedding = NonNullable<Awaited<ReturnType<typeof getWeddingBySlug>>>;

/**
 * The wedding a guest page may show: live weddings for everyone, drafts only
 * for people who manage them (preview). Returns null when neither applies.
 */
async function resolveViewableWedding(slug: unknown) {
  if (typeof slug !== "string" || !slug) return null;
  const wedding = await getWeddingBySlug(slug);
  if (!wedding) return null;
  if (wedding.status === "ACTIVE") return { wedding, preview: false };
  if (wedding.status === "DRAFT" && (await canManageWedding(wedding.id))) {
    return { wedding, preview: true };
  }
  return null;
}

/** For guest pages: 404s unless the viewer may see the wedding. */
export const getGuestWedding = cache(async (slug: string) => {
  const result = await resolveViewableWedding(slug);
  if (!result) notFound();
  return result;
});

/**
 * For public server actions. The slug comes from the client, so the wedding is
 * re-resolved with the same visibility rules as the page itself.
 */
export async function resolveGuestAction(slug: unknown) {
  const result = await resolveViewableWedding(slug);
  if (!result) return null;
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
