import "server-only";
import { cache } from "react";
import type { SectionId } from "@/lib/layouts";
import { prisma } from "@/lib/prisma";
import { getStory, getWeddingById } from "@/lib/tenant";

/**
 * Which sections have something to show. Empty sections are skipped entirely, so
 * a couple who hasn't written their story yet doesn't get a heading over nothing.
 */
export const getSectionsWithContent = cache(async (weddingId: string): Promise<Set<SectionId>> => {
  const [story, wedding, beats, items, bank] = await Promise.all([
    getStory(weddingId),
    getWeddingById(weddingId),
    prisma.storyBeat.count({ where: { weddingId } }),
    prisma.registryItem.count({ where: { weddingId } }),
    prisma.bankDetails.findUnique({ where: { weddingId }, select: { account: true } }),
  ]);
  const has: [SectionId, boolean][] = [
    ["story", beats > 0],
    ["notes", Boolean(story?.brideNote || story?.groomNote)],
    ["registry", items > 0],
    ["gift", Boolean(bank?.account)],
    ["asoebi", Boolean(wedding.copy?.asoebiFabric || story?.bridePhone)],
    ["rsvp", true],
  ];
  return new Set(has.filter(([, ok]) => ok).map(([id]) => id));
});
