import { Suspense } from "react";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import HowWeMetSkeleton from "./how-we-met-skeleton";

const TILTS = [-2, 1.5, -1, 2, -1.5, 1];

async function HowWeMetContent() {
  const beats = await prisma.storyBeat.findMany({ orderBy: { order: "asc" } });

  if (beats.length === 0) return null;

  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-1/2 hidden w-px bg-olive/20 sm:block" />

      <div className="flex flex-col gap-16">
        {beats.map((beat, i) => {
          const flip = i % 2 === 1;
          const tilt = TILTS[i % TILTS.length];
          const isLast = i === beats.length - 1;
          const isSecondToLast = i = beats.length -2

          return (
            <div
              key={beat.id}
              className="grid grid-cols-1 items-center gap-6 sm:grid-cols-2 sm:gap-12"
            >
              <div
                className={`flex justify-center ${
                  flip ? "sm:order-2 sm:justify-start" : "sm:order-1 sm:justify-end"
                }`}
              >
                <figure
                  style={{ ["--r" as string]: `${tilt}deg` } as React.CSSProperties}
                  className="w-60 rotate-(--r) bg-white p-3 pb-0 shadow-[0_18px_40px_-20px_rgba(58,46,40,0.4)]"
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
                  <figcaption className="px-1 py-3.5 text-center font-(family-name:--serif) text-[15px] text-foreground italic">
                    {/* {beat.year} */}
                  </figcaption>
                </figure>
              </div>

              <div
                className={`text-center ${
                  flip ? "sm:order-1 sm:text-right" : "sm:order-2 sm:text-left"
                }`}
              >
                <div className="mb-2 text-xs tracking-[0.24em] text-burnt-orange uppercase">
                  {beat.year}
                </div>
                <h3 className="mb-2.5 font-(family-name:--serif) text-2xl text-foreground">
                  {beat.title}
                </h3>
                <p
                  className={`mx-auto max-w-md text-[15px] text-foreground/75 ${
                    flip ? "sm:mr-0 sm:ml-auto" : "sm:mr-auto sm:ml-0"
                  }`}
                >
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

export default function HowWeMet() {
  return (
    <section id="how-we-met" className="bg-ivory px-4 py-20 sm:px-6 sm:py-28">
      <div className="mx-auto max-w-5xl">
        <div className="mb-14 text-center">
          <p className="mb-3 text-xs uppercase tracking-[0.2em] text-olive">
            A Love Story
          </p>
          <h2 className="font-(family-name:--serif) text-4xl text-foreground sm:text-5xl">
            How We Met
          </h2>
        </div>

        <Suspense fallback={<HowWeMetSkeleton />}>
          <HowWeMetContent />
        </Suspense>
      </div>
    </section>
  );
}
