import type { HeroNameStyle, TemplateKey } from "@/lib/layouts";
import StripeBand from "./stripe-band";

export type SectionFrame = {
  template: TemplateKey;
  /** 1-based position among the visible sections; Editorial numbers its sections with it. */
  index: number;
  /** Full or first names, as chosen in Design (the preview's choice on the home page). */
  nameStyle: HeroNameStyle;
};

/**
 * One section of a guest site, framed the way its template calls for: Classic keeps
 * the original look, Editorial is left-aligned and numbered, Minimal is a quiet
 * centred column, Owambe is bold with stripe bands.
 */
export default function SectionShell({
  id,
  frame,
  eyebrow,
  title,
  intro,
  classicTone = "ivory",
  width = "max-w-5xl",
  children,
}: {
  id: string;
  frame: SectionFrame;
  eyebrow: string;
  title: string;
  intro?: React.ReactNode;
  /** Classic keeps each section's original background. */
  classicTone?: "ivory" | "cream";
  /** Width of the content under the heading. */
  width?: string;
  children: React.ReactNode;
}) {
  const { template, index } = frame;

  if (template === "editorial") {
    return (
      <section id={id} className="border-t border-foreground/15 bg-background px-4 py-20 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-4 sm:grid-cols-[auto_1fr] sm:gap-8">
            <span aria-hidden className="font-(family-name:--serif) text-6xl leading-none text-burnt-orange sm:text-7xl">
              {String(index).padStart(2, "0")}
            </span>
            <div>
              <h2 className="font-(family-name:--serif) text-4xl leading-tight text-foreground sm:text-5xl">{title}</h2>
              {intro && <p className="mt-4 max-w-2xl text-base text-foreground/75 sm:text-lg">{intro}</p>}
            </div>
          </div>
          <div className={`mt-12 ${width === "max-w-5xl" ? "" : width}`}>{children}</div>
        </div>
      </section>
    );
  }

  if (template === "minimal") {
    return (
      <section id={id} className="bg-background px-4 py-20 sm:px-6 sm:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <span aria-hidden className="mx-auto block h-px w-10 bg-olive" />
          <h2 className="mt-8 font-(family-name:--serif) text-3xl text-foreground sm:text-4xl">{title}</h2>
          {intro && <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-foreground/70 sm:text-base">{intro}</p>}
        </div>
        <div className={`mx-auto mt-12 ${width}`}>{children}</div>
      </section>
    );
  }

  if (template === "owambe") {
    const tinted = index % 2 === 1;
    return (
      <section id={id} className={tinted ? "bg-cream" : "bg-background"}>
        <StripeBand />
        <div className="px-4 py-20 sm:px-6 sm:py-24">
          <div className="mx-auto max-w-5xl">
            <p className="text-xs font-semibold tracking-[0.2em] text-burnt-orange uppercase">{eyebrow}</p>
            <h2 className="mt-3 font-(family-name:--serif) text-4xl font-semibold text-foreground sm:text-6xl">{title}</h2>
            {intro && <p className="mt-4 max-w-2xl text-base text-foreground/80 sm:text-lg">{intro}</p>}
          </div>
          <div className={`mx-auto mt-12 ${width}`}>{children}</div>
        </div>
      </section>
    );
  }

  return (
    <section id={id} className={`${classicTone === "cream" ? "bg-cream" : "bg-ivory"} px-4 py-20 sm:px-6 sm:py-28`}>
      <div className="mx-auto max-w-2xl text-center">
        <p className="mb-3 text-xs uppercase tracking-[0.2em] text-olive">{eyebrow}</p>
        <h2 className="font-(family-name:--serif) text-4xl text-foreground sm:text-5xl">{title}</h2>
        {intro && <p className="mt-6 text-base text-foreground/80 sm:text-lg">{intro}</p>}
      </div>
      <div className={`mx-auto mt-14 ${width}`}>{children}</div>
    </section>
  );
}
