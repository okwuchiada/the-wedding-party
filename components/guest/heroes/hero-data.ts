import "server-only";
import { cache } from "react";
import { copyText } from "@/lib/copy";
import { prisma } from "@/lib/prisma";
import { getStory, getWeddingById } from "@/lib/tenant";

/** Everything the hero layouts show, loaded once per request. */
export const getHeroData = cache(async (weddingId: string) => {
  const [story, wedding, photos] = await Promise.all([
    getStory(weddingId),
    getWeddingById(weddingId),
    prisma.storyPhoto.findMany({ where: { weddingId, showInHero: true }, orderBy: { order: "asc" }, take: 3 }),
  ]);
  const date = story?.weddingDate ?? new Date();
  const iso = date.toISOString();
  // Stored as literal UTC so it shows exactly as the couple entered it.
  const fmt = (o: Intl.DateTimeFormatOptions) => date.toLocaleString("en-US", { ...o, timeZone: "UTC" });

  return {
    brideName: story?.brideName ?? "",
    groomName: story?.groomName ?? "",
    tagline: story?.tagline ?? "",
    location: story?.location ?? "",
    heroPhotoUrl: story?.heroPhotoUrl ?? photos[0]?.url ?? null,
    photos,
    iso,
    dateLong: fmt({ weekday: "long", month: "long", day: "numeric" }),
    dateFull: fmt({ weekday: "long", day: "numeric", month: "long", year: "numeric" }),
    dateShort: `${String(date.getUTCDate()).padStart(2, "0")} · ${String(date.getUTCMonth() + 1).padStart(2, "0")} · ${String(date.getUTCFullYear()).slice(2)}`,
    day: date.getUTCDate(),
    monthYear: fmt({ month: "long", year: "numeric" }),
    time: fmt({ hour: "numeric", minute: "2-digit" }),
    intro: copyText(wedding.copy, "heroIntro"),
    note: copyText(wedding.copy, "heroEyebrow", { year: date.getUTCFullYear() }),
  };
});

export type HeroData = Awaited<ReturnType<typeof getHeroData>>;
