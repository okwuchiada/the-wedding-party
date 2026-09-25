import { Suspense } from "react";
import Image from "next/image";
import type { StoryStyle } from "@/lib/layouts";
import { prisma } from "@/lib/prisma";
import HowWeMetSkeleton from "./how-we-met-skeleton";
import SectionShell, { type SectionFrame } from "./layout/section-shell";

const TILTS = [-2, 1.5, -1, 2, -1.5, 1];

type Beat = { id: string; year: string; title: string; text: string; photoUrl: string | null };

function ClassicTimeline({ beats }: { beats: Beat[] }) {
  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-1/2 hidden w-px bg-olive/20 sm:block" />
      <div className="flex flex-col gap-16">
        {beats.map((beat, i) => {
          const flip = i % 2 === 1;
          const tilt = TILTS[i % TILTS.length];
          const isLast = i === beats.length - 1;
          const isSecondToLast = i === beats.length - 2;
          return (
            <div key={beat.id} className="grid grid-cols-1 items-center gap-6 sm:grid-cols-2 sm:gap-12">
              <div className={`flex justify-center ${flip ? "sm:order-2 sm:justify-start" : "sm:order-1 sm:justify-end"}`}>
                <figure
                  style={{ ["--r" as string]: `${tilt}deg` } as React.CSSProperties}
                  className="w-60 rotate-(--r) bg-white p-3 pb-0 shadow-[0_18px_40px_-20px_rgb(var(--ink)/0.4)]"
                >
                  <div className="relative h-52 w-full overflow-hidden bg-olive/10">
                    {beat.photoUrl && (
                      <Image
                        src={beat.photoUrl}
                        alt={beat.title}
                        fill
                        sizes="240px"
                        className={`object-cover ${isLast || isSecondToLast ? "object-top" : ""}`}
                      />
                    )}
                  </div>
                  <figcaption className="px-1 py-3.5" />
                </figure>
              </div>
              <div className={`text-center ${flip ? "sm:order-1 sm:text-right" : "sm:order-2 sm:text-left"}`}>
                <div className="mb-2 text-xs tracking-[0.24em] text-burnt-orange uppercase">{beat.year}</div>
                <h3 className="mb-2.5 font-(family-name:--serif) text-2xl text-foreground">{beat.title}</h3>
                <p className={`mx-auto max-w-md text-[15px] text-foreground/75 ${flip ? "sm:mr-0 sm:ml-auto" : "sm:mr-auto sm:ml-0"}`}>
                  {beat.text}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Tall photos in a row guests swipe (or scroll) through. */
function PhotoStrip({ beats }: { beats: Beat[] }) {
  return (
    <div className="flex flex-col gap-3">
      <ol
        tabIndex={0}
        aria-label="Our story, moment by moment"
        className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-4 px-4 pb-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-burnt-orange sm:-mx-6 sm:scroll-px-6 sm:px-6"
      >
        {beats.map((beat) => (
          <li key={beat.id} className="flex w-64 shrink-0 snap-start flex-col gap-3 sm:w-72">
            <div className="relative aspect-[3/4] overflow-hidden bg-olive/15">
              {beat.photoUrl ? (
                <Image src={beat.photoUrl} alt={beat.title} fill sizes="18rem" className="object-cover" />
              ) : (
                <div aria-hidden className="absolute inset-0 bg-linear-to-br from-olive to-burnt-orange" />
              )}
              <div aria-hidden className="absolute inset-x-0 bottom-0 h-1/2 bg-linear-to-t from-black/65 to-transparent" />
              <span className="absolute bottom-4 left-4 right-4 font-(family-name:--serif) text-2xl leading-tight text-white">{beat.year}</span>
            </div>
            <div>
              <h3 className="font-(family-name:--serif) text-xl text-foreground">{beat.title}</h3>
              <p className="mt-1.5 text-sm text-foreground/75">{beat.text}</p>
            </div>
          </li>
        ))}
      </ol>
      {beats.length > 1 && <p className="text-xs text-foreground/55">Swipe or scroll sideways for the whole story.</p>}
    </div>
  );
}

/** One large photo per moment, alternating sides, like the pages of a photo book. */
function Chapters({ beats }: { beats: Beat[] }) {
  return (
    <ol className="flex flex-col gap-16 sm:gap-24">
      {beats.map((beat, i) => {
        const flip = i % 2 === 1;
        return (
          <li
            key={beat.id}
            className={`grid grid-cols-1 items-center gap-6 sm:gap-10 ${
              !beat.photoUrl ? "mx-auto max-w-2xl text-center" : flip ? "md:grid-cols-[1fr_1.35fr]" : "md:grid-cols-[1.35fr_1fr]"
            }`}
          >
            {beat.photoUrl && (
              <div className={`relative aspect-[4/3] overflow-hidden bg-olive/10 ${flip ? "md:order-2" : ""}`}>
                <Image src={beat.photoUrl} alt={beat.title} fill sizes="(min-width: 768px) 55vw, 100vw" className="object-cover" />
              </div>
            )}
            <div className={flip && beat.photoUrl ? "md:order-1 md:text-right" : ""}>
              <p className="text-xs tracking-[0.2em] text-foreground/55 uppercase">
                Chapter {i + 1}
              </p>
              <p className="mt-3 font-(family-name:--serif) text-4xl leading-none text-burnt-orange sm:text-5xl">{beat.year}</p>
              <h3 className="mt-4 font-(family-name:--serif) text-2xl text-foreground sm:text-3xl">{beat.title}</h3>
              <p className="mt-3 text-foreground/75 sm:text-lg">{beat.text}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function StoryLayout({ beats, style }: { beats: Beat[]; style: StoryStyle }) {
  if (style === "strip") return <PhotoStrip beats={beats} />;
  if (style === "chapters") return <Chapters beats={beats} />;
  if (style === "list") {
    return (
      <ol className="flex flex-col divide-y divide-foreground/15">
        {beats.map((beat) => (
          <li key={beat.id} className="grid gap-4 py-8 first:pt-0 sm:grid-cols-[8rem_1fr_12rem] sm:gap-8">
            <span className="font-(family-name:--serif) text-3xl text-burnt-orange">{beat.year}</span>
            <div>
              <h3 className="font-(family-name:--serif) text-2xl text-foreground">{beat.title}</h3>
              <p className="mt-2 text-foreground/75">{beat.text}</p>
            </div>
            {beat.photoUrl && (
              <div className="relative aspect-[4/3] overflow-hidden bg-olive/10">
                <Image src={beat.photoUrl} alt={beat.title} fill sizes="12rem" className="object-cover" />
              </div>
            )}
          </li>
        ))}
      </ol>
    );
  }
  if (style === "simple") {
    return (
      <ol className="flex flex-col gap-10 text-center">
        {beats.map((beat) => (
          <li key={beat.id}>
            <p className="text-sm text-foreground/55">{beat.year}</p>
            <h3 className="mt-1 font-(family-name:--serif) text-xl text-foreground">{beat.title}</h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-foreground/75">{beat.text}</p>
          </li>
        ))}
      </ol>
    );
  }
  if (style === "cards") {
    return (
      <ol className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {beats.map((beat, i) => (
          <li key={beat.id} className={`flex flex-col bg-white border-t-8 ${i % 2 ? "border-olive" : "border-burnt-orange"}`}>
            {beat.photoUrl && (
              <div className="relative aspect-[4/3] overflow-hidden bg-olive/10">
                <Image src={beat.photoUrl} alt={beat.title} fill sizes="(min-width: 1024px) 33vw, 100vw" className="object-cover" />
              </div>
            )}
            <div className="p-6">
              <span className="font-(family-name:--serif) text-3xl font-semibold text-burnt-orange">{beat.year}</span>
              <h3 className="mt-1 font-(family-name:--serif) text-xl text-foreground">{beat.title}</h3>
              <p className="mt-2 text-sm text-foreground/75">{beat.text}</p>
            </div>
          </li>
        ))}
      </ol>
    );
  }
  return <ClassicTimeline beats={beats} />;
}

async function HowWeMetContent({ weddingId, style }: { weddingId: string; style: StoryStyle }) {
  const beats = await prisma.storyBeat.findMany({ where: { weddingId }, orderBy: { order: "asc" } });
  if (beats.length === 0) return null;
  return <StoryLayout beats={beats} style={style} />;
}

const WIDTHS: Record<StoryStyle, string> = {
  timeline: "max-w-5xl",
  list: "max-w-5xl",
  cards: "max-w-5xl",
  strip: "max-w-6xl",
  chapters: "max-w-6xl",
  simple: "max-w-xl",
};

export default function HowWeMet({ weddingId, frame }: { weddingId: string; frame: SectionFrame }) {
  return (
    <SectionShell id="how-we-met" frame={frame} eyebrow="A love story" title="How we met" width={WIDTHS[frame.storyStyle]}>
      <Suspense fallback={<HowWeMetSkeleton />}>
        <HowWeMetContent weddingId={weddingId} style={frame.storyStyle} />
      </Suspense>
    </SectionShell>
  );
}
