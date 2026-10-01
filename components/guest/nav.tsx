import { resolveLayout, visibleSections, type SectionId } from "@/lib/layouts";
import { formatNavDate } from "@/lib/nav-date";
import { hasFeature } from "@/lib/plans";
import { getStory, getWeddingById, guestPath } from "@/lib/tenant";
import GuestNavClient from "./nav-client";
import { getSectionsWithContent } from "./section-content";

export default async function GuestNav({
  weddingId,
  slug,
  sections,
}: {
  weddingId: string;
  slug: string;
  /** Visible sections; defaults to the saved layout (the home page passes a preview's). */
  sections?: SectionId[];
}) {
  const withContent = await getSectionsWithContent(weddingId);
  const wedding = await getWeddingById(weddingId);
  const visible = (sections ?? visibleSections(resolveLayout(wedding.theme))).filter((id) =>
    withContent.has(id)
  );
  const story = await getStory(weddingId);
  // Same rule as the gallery page: switched on by the couple and included in their plan.
  const galleryOn = (story?.galleryEnabled ?? false) && hasFeature(wedding.plan, "gallery");
  const weddingDateISO = (story?.weddingDate ?? new Date()).toISOString();

  const brideInitial = story?.brideName?.trim().charAt(0).toUpperCase() || "";
  const groomInitial = story?.groomName?.trim().charAt(0).toUpperCase() || "";

  return (
    <GuestNavClient
      basePath={guestPath(slug)}
      show={{ rsvp: visible.includes("rsvp"), registry: visible.includes("registry"), gallery: galleryOn }}
      dateLabel={formatNavDate(weddingDateISO)}
      brideInitial={brideInitial}
      groomInitial={groomInitial}
    />
  );
}
