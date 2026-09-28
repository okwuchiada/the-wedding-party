import Image from "next/image";
import { canOptimizeImage } from "@/lib/image-src";
import { heroName, type HeroNameStyle, type TemplateKey } from "@/lib/layouts";
import StripeBand from "../layout/stripe-band";
import { getHeroData } from "./hero-data";
import HeroCtas from "./hero-ctas";

/** The hero photo edge to edge, with the names over it. */
export default async function HeroCover({
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
  const data = await getHeroData(weddingId);
  const h = { ...data, brideName: heroName(data.brideName, nameStyle), groomName: heroName(data.groomName, nameStyle) };
  const centred = template === "minimal";

  return (
    <>
      <header id="top" className="relative flex min-h-[88svh] items-end overflow-hidden bg-olive-dark">
        {h.heroPhotoUrl ? (
          <Image src={h.heroPhotoUrl} unoptimized={!canOptimizeImage(h.heroPhotoUrl)} alt="" fill sizes="100vw" priority className="object-cover" />
        ) : (
          // No photo yet: a wash of the wedding's own colours.
          <div aria-hidden className="absolute inset-0 bg-linear-to-br from-olive via-olive-dark to-burnt-orange" />
        )}
        {/* Keeps the navigation readable at the top and the names readable at the bottom. */}
        <div aria-hidden className="absolute inset-x-0 top-0 h-32 bg-linear-to-b from-background/85 to-transparent" />
        <div aria-hidden className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent" />
        <div className={`relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 pb-16 text-white sm:px-6 sm:pb-20 ${centred ? "items-center text-center" : ""}`}>
          {h.tagline && <p className="text-xs tracking-[0.2em] uppercase opacity-85">{h.tagline}</p>}
          <h1 className="font-(family-name:--serif) text-6xl leading-[0.95] sm:text-8xl">
            {h.brideName} <span className="font-(family-name:--script) text-[0.6em]">&amp;</span> {h.groomName}
          </h1>
          <p className="text-sm tracking-[0.18em] uppercase opacity-90">
            {h.dateFull}
            {h.location ? ` · ${h.location}` : ""}
          </p>
          <HeroCtas showRsvp={showRsvp} showRegistry={showRegistry} tone="inverse" align={centred ? "center" : "start"} />
        </div>
      </header>
      {template === "owambe" && <StripeBand />}
    </>
  );
}
