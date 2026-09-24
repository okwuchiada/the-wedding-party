import { getStory, guestPath } from "@/lib/tenant";
import GuestNavClient from "./nav-client";

function formatNavDate(weddingDateISO: string) {
  const [datePart] = weddingDateISO.split("T");
  const [year, month, day] = datePart.split("-");
  return `${month} · ${day} · ${year.slice(2)}`;
}

export default async function GuestNav({ weddingId, slug }: { weddingId: string; slug: string }) {
  const story = await getStory(weddingId);
  const weddingDateISO = (story?.weddingDate ?? new Date()).toISOString();

  const brideInitial = story?.brideName?.trim().charAt(0).toUpperCase() || "";
  const groomInitial = story?.groomName?.trim().charAt(0).toUpperCase() || "";

  return (
    <GuestNavClient
      basePath={guestPath(slug)}
      dateLabel={formatNavDate(weddingDateISO)}
      brideInitial={brideInitial}
      groomInitial={groomInitial}
    />
  );
}
