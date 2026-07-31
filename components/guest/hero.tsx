import Image from "next/image";
import { prisma } from "@/lib/prisma";
import CountdownBar from "./countdown-bar";
import Polaroid from "./polaroid";

export default async function Hero() {
  const [story, photos] = await Promise.all([
    prisma.storyContent.findUnique({ where: { id: "main" } }),
    prisma.storyPhoto.findMany({
      where: { showInHero: true },
      orderBy: { order: "asc" },
      take: 3,
    }),
  ]);

  const brideName = story?.brideName ?? "";
  const groomName = story?.groomName ?? "";
  const tagline = story?.tagline ?? "";
  const location = story?.location ?? "";
  const heroPhotoUrl = "/images/hero.jpg";
  const weddingDateISO = (story?.weddingDate ?? new Date()).toISOString();

  const weddingDate = new Date(weddingDateISO).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });

  const weddingTime = new Date(weddingDateISO).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
  });

  return (
    <header
      id="top"
      className="relative overflow-hidden pt-28 pb-16 sm:pt-36 sm:pb-24"
    >
      {heroPhotoUrl && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0 opacity-10 lg:hidden"
        >
          <Image
            src={heroPhotoUrl}
            alt=""
            fill
            sizes="100vw"
            className="object-cover"
            loading="eager"
          />
        </div>
      )}

      <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-2/5 bg-linear-to-b from-ivory to-transparent opacity-60 lg:block" />

      <div className="relative z-10 mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-4 sm:px-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <p className="mb-5 text-xs uppercase tracking-[0.2em] text-olive">
            {tagline} &middot;
          </p>

          <h1 className="font-(family-name:--serif) text-6xl leading-none tracking-tight text-foreground sm:text-7xl lg:text-8xl">
            {brideName}
            <span className="my-1 block text-[0.5em] font-normal italic text-burnt-orange">
              and
            </span>
            {groomName}
          </h1>

          <p className="mt-6 max-w-md text-base text-foreground/80 sm:text-lg">
            We&apos;re getting married and we&apos;d be honored to have you
            celebrate with us.
          </p>

          <div className="mt-8 mb-3 flex flex-wrap items-center gap-4">
            <div className="font-(family-name:--serif) text-2xl font-medium text-foreground sm:text-3xl">
              {weddingDate}
            </div>
            <div className="h-6 w-px bg-olive/30" />
            <div className="text-xs uppercase tracking-[0.14em] text-burnt-orange sm:text-sm">
              {weddingTime}
            </div>
          </div>
          <p className="mb-8 text-xs uppercase tracking-[0.2em] text-olive">
            {location}
          </p>

          <div className="mb-8 max-w-md">
            <CountdownBar target={weddingDateISO} />
          </div>

          <div className="flex flex-wrap gap-3">
            <a
              href="#rsvp"
              className=" bg-olive px-6 py-3 text-sm font-medium text-ivory transition-colors hover:bg-burnt-orange"
            >
              RSVP Now
            </a>
            <a
              href="#registry"
              className="border border-olive px-6 py-3 text-sm font-medium text-foreground transition-colors hover:border-burnt-orange hover:text-burnt-orange"
            >
              View Registry
            </a>
          </div>
        </div>

        <div className="relative hidden h-120 lg:block">
          {photos[0] && (
            <Polaroid
              src={photos[0].url}
              alt={photos[0].caption}
              caption={photos[0].caption}
              rotate={-6}
              width={230}
              height={272}
              className="absolute top-0 left-[8%]"
            />
          )}
          {photos[1] && (
            <Polaroid
              src={photos[1].url}
              alt={photos[1].caption}
              caption={photos[1].caption}
              rotate={5}
              width={200}
              height={236}
              className="absolute top-17.5 right-[2%]"
            />
          )}
          {photos[2] && (
            <Polaroid
              src={photos[2].url}
              alt={photos[2].caption}
              caption={photos[2].caption}
              rotate={-2}
              width={236}
              height={186}
              className="absolute -bottom-4 left-[26%] z-10"
            />
          )}
          <span className="absolute -top-2 right-[30%] rotate-[8deg] font-(family-name:--serif) text-xl italic text-burnt-orange opacity-90">
            est. 2026 &#9825;
          </span>
        </div>
      </div>
    </header>
  );
}
