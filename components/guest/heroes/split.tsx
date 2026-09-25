import Image from "next/image";
import { heroName, type HeroNameStyle, type TemplateKey } from "@/lib/layouts";
import CountdownBar from "../countdown-bar";
import Polaroid from "../polaroid";
import StripeBand from "../layout/stripe-band";
import { getHeroData } from "./hero-data";
import HeroCtas from "./hero-ctas";

/** Names beside three tilted photos (the original hero). */
export default async function HeroSplit({
  weddingId,
  template,
  nameStyle,
  showRsvp,
  showRegistry,
}: {
  weddingId: string;
  template: TemplateKey;
  nameStyle: HeroNameStyle;
  showRsvp: boolean;
  showRegistry: boolean;
}) {
  const h = await getHeroData(weddingId);
  const { tagline, location, heroPhotoUrl, photos } = h;
  const brideName = heroName(h.brideName, nameStyle);
  const groomName = heroName(h.groomName, nameStyle);
  const weddingDateISO = h.iso;
  const weddingDate = h.dateLong;
  const weddingTime = h.time;
  const bold = template === "owambe";

  return (
    <header
      id="top"
      className={`relative overflow-hidden ${bold ? "mt-16 bg-burnt-orange pt-14 pb-16 text-ivory sm:pt-20 sm:pb-24" : "pt-28 pb-16 sm:pt-36 sm:pb-24"}`}
    >
      {bold && <StripeBand className="absolute inset-x-0 top-0 h-3" />}
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

      {!bold && (
        <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-2/5 bg-linear-to-b from-ivory to-transparent opacity-60 lg:block" />
      )}

      <div className="relative z-10 mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-4 sm:px-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <p className={`mb-5 text-xs uppercase tracking-[0.2em] ${bold ? "text-ivory/80" : "text-olive"}`}>
            {tagline} &middot;
          </p>

          <h1 className={`font-(family-name:--serif) text-6xl leading-none tracking-tight sm:text-7xl lg:text-8xl ${bold ? "text-ivory" : "text-foreground"}`}>
            {brideName}
            <span className={`my-1 block text-[0.5em] font-normal italic ${bold ? "text-ivory/85" : "text-burnt-orange"}`}>
              and
            </span>
            {groomName}
          </h1>

          <p className={`mt-6 max-w-md text-base sm:text-lg ${bold ? "text-ivory/85" : "text-foreground/80"}`}>{h.intro}</p>

          <div className="mt-8 mb-3 flex flex-wrap items-center gap-4">
            <div className={`font-(family-name:--serif) text-2xl font-medium sm:text-3xl ${bold ? "text-ivory" : "text-foreground"}`}>
              {weddingDate}
            </div>
            <div className="h-6 w-px bg-olive/30" />
            <div className={`text-xs uppercase tracking-[0.14em] sm:text-sm ${bold ? "text-ivory/85" : "text-burnt-orange"}`}>
              {weddingTime}
            </div>
          </div>
          <p className={`mb-8 text-xs uppercase tracking-[0.2em] ${bold ? "text-ivory/80" : "text-olive"}`}>{location}</p>

          <div className="mb-8 max-w-md">
            <CountdownBar target={weddingDateISO} />
          </div>

          <HeroCtas showRsvp={showRsvp} showRegistry={showRegistry} tone={bold ? "inverse" : "default"} />
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
          <span className={`absolute -top-2 right-[30%] rotate-[8deg] font-(family-name:--serif) text-xl italic opacity-90 ${bold ? "text-ivory" : "text-burnt-orange"}`}>
            {h.note}
          </span>
        </div>
      </div>
    </header>
  );
}
