import { resolveLayout, visibleSections, type SectionId } from "@/lib/layouts";
import { getStory, getWeddingById, guestPath } from "@/lib/tenant";
import GuestNavClient from "./nav-client";
import { getSectionsWithContent } from "./section-content";

function formatNavDate(weddingDateISO: string) {
  const [datePart] = weddingDateISO.split("T");
  const [year, month, day] = datePart.split("-");
  return `${month} · ${day} · ${year.slice(2)}`;
}

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
  const visible = (sections ?? visibleSections(resolveLayout((await getWeddingById(weddingId)).theme))).filter((id) =>
    withContent.has(id)
  );
  const story = await getStory(weddingId);
  const weddingDateISO = (story?.weddingDate ?? new Date()).toISOString();

  const brideInitial = story?.brideName?.trim().charAt(0).toUpperCase() || "";
  const groomInitial = story?.groomName?.trim().charAt(0).toUpperCase() || "";

  return (
    <GuestNavClient
      basePath={guestPath(slug)}
      show={{ rsvp: visible.includes("rsvp"), registry: visible.includes("registry") }}
      dateLabel={formatNavDate(weddingDateISO)}
      brideInitial={brideInitial}
      groomInitial={groomInitial}
    />
  );
}
