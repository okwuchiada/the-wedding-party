import { prisma } from "@/lib/prisma";
import GuestNavClient from "./nav-client";

function formatNavDate(weddingDateISO: string) {
  const [datePart] = weddingDateISO.split("T");
  const [year, month, day] = datePart.split("-");
  return `${month} · ${day} · ${year.slice(2)}`;
}

export default async function GuestNav() {
  const story = await prisma.storyContent.findUnique({ where: { id: "main" } });
  const weddingDateISO = (story?.weddingDate ?? new Date()).toISOString();

  const brideInitial = story?.brideName?.trim().charAt(0).toUpperCase() || "";
  const groomInitial = story?.groomName?.trim().charAt(0).toUpperCase() || "";

  return (
    <GuestNavClient
      dateLabel={formatNavDate(weddingDateISO)}
      brideInitial={brideInitial}
      groomInitial={groomInitial}
    />
  );
}
