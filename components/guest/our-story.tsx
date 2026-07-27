import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import LoveNote from "./love-note";
import StoryCarousel from "./story-carousel";
import OurStorySkeleton from "./our-story-skeleton";

async function OurStoryContent() {
  const [photos, story] = await Promise.all([
    prisma.storyPhoto.findMany({ orderBy: { order: "asc" } }),
    prisma.storyContent.findUnique({ where: { id: "main" } }),
  ]);

  const notes = [
    story?.groomNote && { text: story.groomNote, caption: story.groomName },
    story?.brideNote && { text: story.brideNote, caption: story.brideName },
  ].filter((n): n is { text: string; caption: string } => Boolean(n));

  return (
    <div className="mx-auto mt-14 flex max-w-6xl flex-col items-start gap-12 lg:flex-row">
      <StoryCarousel
        items={photos.map((p) => ({ src: p.url, alt: p.caption, note: p.caption }))}
      />
      <LoveNote notes={notes} />
    </div>
  );
}

export default function OurStory() {
  return (
    <section id="our-story" className="bg-ivory px-4 py-20 sm:px-6 sm:py-28">
      <div className="mx-auto max-w-2xl text-center">
        <p className="mb-3 text-xs uppercase tracking-[0.2em] text-olive">
          Our Story
        </p>
        <h2 className="font-(family-name:--serif) text-4xl text-foreground sm:text-5xl">
          A few of our favorite moments
        </h2>
      </div>

      <Suspense fallback={<OurStorySkeleton />}>
        <OurStoryContent />
      </Suspense>
    </section>
  );
}
