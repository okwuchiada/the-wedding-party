import { Suspense } from "react";
import Image from "next/image";
import type { TemplateKey } from "@/lib/layouts";
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

function StoryLayout({ beats, template }: { beats: Beat[]; template: TemplateKey }) {
  if (template === "editorial") {
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
  if (template === "minimal") {
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
  if (template === "owambe") {
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

async function HowWeMetContent({ weddingId, template }: { weddingId: string; template: TemplateKey }) {
  const beats = await prisma.storyBeat.findMany({ where: { weddingId }, orderBy: { order: "asc" } });
  if (beats.length === 0) return null;
  return <StoryLayout beats={beats} template={template} />;
}

export default function HowWeMet({ weddingId, frame }: { weddingId: string; frame: SectionFrame }) {
  return (
    <SectionShell id="how-we-met" frame={frame} eyebrow="A love story" title="How we met" width={frame.template === "minimal" ? "max-w-xl" : "max-w-5xl"}>
      <Suspense fallback={<HowWeMetSkeleton />}>
        <HowWeMetContent weddingId={weddingId} template={frame.template} />
      </Suspense>
    </SectionShell>
  );
}
