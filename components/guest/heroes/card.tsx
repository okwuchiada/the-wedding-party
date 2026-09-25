import { heroName, type HeroNameStyle, type TemplateKey } from "@/lib/layouts";
import StripeBand from "../layout/stripe-band";
import { getHeroData } from "./hero-data";
import HeroCtas from "./hero-ctas";

/** A framed, centred card like the printed invitation. */
export default async function HeroCard({
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
  const bold = template === "owambe";

  return (
    <header id="top" className={`relative px-4 pb-16 sm:px-6 sm:pb-24 ${bold ? "mt-16 bg-burnt-orange pt-16" : template === "minimal" ? "pt-28 sm:pt-32" : "bg-cream pt-28 sm:pt-36"}`}>
      {bold && <StripeBand className="absolute inset-x-0 top-0 h-3" />}
      <div className="mx-auto max-w-2xl border border-olive bg-ivory p-2">
        <div className="flex flex-col items-center gap-5 border border-olive px-6 py-14 text-center sm:px-12 sm:py-20">
          <p className="text-xs tracking-[0.2em] text-olive uppercase">{h.tagline || "Together with their families"}</p>
          <h1 className="font-(family-name:--serif) text-5xl leading-none text-foreground sm:text-7xl">
            {h.brideName}
            <span className="my-2 block font-(family-name:--script) text-[0.5em] text-burnt-orange">&amp;</span>
            {h.groomName}
          </h1>
          <p className="max-w-md text-base text-foreground/80">{h.intro}</p>
          <div className="flex flex-col items-center gap-1">
            <p className="font-(family-name:--serif) text-2xl text-foreground sm:text-3xl">{h.dateFull}</p>
            <p className="text-xs tracking-[0.18em] text-burnt-orange uppercase">{h.time}</p>
          </div>
          {h.location && <p className="text-sm text-foreground/70">{h.location}</p>}
          <HeroCtas showRsvp={showRsvp} showRegistry={showRegistry} align="center" />
        </div>
      </div>
    </header>
  );
}
