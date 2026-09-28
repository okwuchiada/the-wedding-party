import Image from "next/image";
import { canOptimizeImage } from "@/lib/image-src";
import { heroName, type HeroNameStyle, type TemplateKey } from "@/lib/layouts";
import CountdownBar from "../countdown-bar";
import StripeBand from "../layout/stripe-band";
import { getHeroData } from "./hero-data";
import HeroCtas from "./hero-ctas";

/** Huge names and the date; no photo needed. Owambe sets it on a bold colour block. */
export default async function HeroType({
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

  if (template === "owambe") {
    return (
      <header id="top" className="relative mt-16 bg-burnt-orange px-4 pt-16 pb-16 text-ivory sm:px-6 sm:pb-24">
        <StripeBand className="absolute inset-x-0 top-0 h-3" />
        <div className="mx-auto flex max-w-6xl flex-col gap-6">
          <p className="text-xs font-semibold tracking-[0.2em] uppercase opacity-85">{h.tagline || "You're invited"}</p>
          <h1 className="font-(family-name:--serif) text-6xl leading-[0.9] font-semibold sm:text-8xl lg:text-9xl">
            {h.brideName}
            <br />
            &amp; {h.groomName}
          </h1>
          <div className="flex flex-wrap items-center gap-5">
            <div className="bg-ivory px-5 py-3 text-center leading-none text-burnt-orange">
              <span className="block font-(family-name:--serif) text-5xl font-semibold">{h.day}</span>
              <span className="mt-1 block text-xs font-semibold tracking-[0.16em] uppercase">{h.monthYear}</span>
            </div>
            <div className="text-sm">
              <p className="font-semibold">{h.time}</p>
              {h.location && <p className="opacity-85">{h.location}</p>}
            </div>
          </div>
          <p className="max-w-xl text-base opacity-90 sm:text-lg">{h.intro}</p>
          <HeroCtas showRsvp={showRsvp} showRegistry={showRegistry} tone="inverse" />
        </div>
      </header>
    );
  }

  const centred = template === "minimal";
  return (
    <>
      <header id="top" className="px-4 pt-32 pb-14 sm:px-6 sm:pt-40 sm:pb-20">
        <div className={`mx-auto flex max-w-6xl flex-col gap-6 ${centred ? "items-center text-center" : ""}`}>
          {h.tagline && <p className="text-xs tracking-[0.2em] text-olive uppercase">{h.tagline}</p>}
          <h1 className="font-(family-name:--serif) text-7xl leading-[0.85] tracking-tight text-foreground sm:text-9xl">
            {h.brideName}
            <span className="mx-3 inline-block font-(family-name:--script) text-[0.4em] text-burnt-orange">and</span>
            {h.groomName}
          </h1>
          <p className={`flex items-center gap-4 text-sm tracking-[0.18em] text-olive uppercase ${centred ? "" : "w-full"}`}>
            <span aria-hidden className="h-px flex-1 bg-olive/40" />
            {h.dateFull} · {h.time}
            <span aria-hidden className="h-px flex-1 bg-olive/40" />
          </p>
          {h.location && <p className="text-base text-foreground/75">{h.location}</p>}
          <p className="max-w-xl text-base text-foreground/80 sm:text-lg">{h.intro}</p>
          <div className="w-full max-w-md">
            <CountdownBar target={h.iso} />
          </div>
          <HeroCtas showRsvp={showRsvp} showRegistry={showRegistry} align={centred ? "center" : "start"} />
        </div>
      </header>
      {/* Editorial follows the names with the cover photo, like a feature spread. */}
      {template === "editorial" && h.heroPhotoUrl && (
        <div className="relative aspect-[21/9] w-full overflow-hidden bg-olive/10">
          <Image src={h.heroPhotoUrl} unoptimized={!canOptimizeImage(h.heroPhotoUrl)} alt="" fill sizes="100vw" className="object-cover" />
        </div>
      )}
    </>
  );
}
