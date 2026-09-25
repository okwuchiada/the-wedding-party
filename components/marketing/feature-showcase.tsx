import { WovenBand } from "./shell";
import { fontCssVar } from "@/lib/font-options";
import { THEME_PRESETS, type ThemeColors } from "@/lib/themes";

const preset = THEME_PRESETS.find((p) => p.key === "blush-rose") ?? THEME_PRESETS[0];

type CardRender = (c: ThemeColors, serif: string) => React.ReactNode;

const CARDS: { caption: string; render: CardRender }[] = [
  {
    caption: "They tap yes or no, and you watch responses arrive as they happen.",
    render: (c, serif) => (
      <div className="flex flex-col gap-4">
        <p style={{ fontFamily: serif }} className="text-xl">
          Will you join us?
        </p>
        <div className="flex gap-2 text-[13px] font-medium">
          <span style={{ background: c.primary, color: c.ivory }} className="px-3 py-1.5">
            Joyfully yes
          </span>
          <span style={{ borderColor: c.accent }} className="border px-3 py-1.5">
            Sadly no
          </span>
        </div>
        <p className="text-xs opacity-70">48 of 60 guests have replied</p>
      </div>
    ),
  },
  {
    caption: "They send the gift straight to your account; you just confirm it landed.",
    render: (c) => (
      <div className="flex flex-col gap-4">
        {[
          { label: "Honeymoon fund", pct: 62 },
          { label: "New home fund", pct: 30 },
        ].map((row) => (
          <div key={row.label}>
            <div className="flex justify-between text-[13px]">
              <span>{row.label}</span>
              <span style={{ color: c.primary }}>{row.pct}%</span>
            </div>
            <div style={{ background: `${c.accent}33` }} className="mt-1.5 h-1">
              <div style={{ background: c.primary, width: `${row.pct}%` }} className="h-full" />
            </div>
          </div>
        ))}
        <p className="text-xs opacity-70">₦180,000 confirmed by bank transfer</p>
      </div>
    ),
  },
  {
    caption: "Every photo and note guests share on the day lands in one wall.",
    render: (c, serif) => (
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-4 gap-1.5">
          {[c.primary, c.accent, c.accentDark, c.primaryDark].map((tile, i) => (
            <div key={i} style={{ background: tile }} className={`aspect-square ${i % 2 ? "translate-y-1" : ""}`} />
          ))}
        </div>
        <p style={{ fontFamily: serif }} className="text-[15px] italic">
          &ldquo;Wishing you a lifetime of love and laughter!&rdquo;
        </p>
        <p className="text-xs opacity-70">— Ngozi</p>
      </div>
    ),
  },
];

/** A guest's-eye look at the three things they'll actually do on the site. */
export default function FeatureShowcase() {
  const c = preset.colors;
  const serif = `var(${fontCssVar(preset.fonts.serif)}), Georgia, serif`;
  const sans = `var(${fontCssVar(preset.fonts.sans)}), system-ui, sans-serif`;

  return (
    <section className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
      <h2 className="font-(family-name:--m-display) text-4xl font-bold tracking-tight sm:text-5xl">What your guests actually see</h2>
      <p className="mt-4 max-w-xl text-lg text-(--m-ink)/75">
        No app to open, nothing to install — an RSVP, a registry and a photo wall, dressed in your colours.
      </p>
      <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-3">
        {CARDS.map((card) => (
          <div key={card.caption}>
            <figure
              style={{ background: c.background, color: c.foreground, fontFamily: sans }}
              className="overflow-hidden rounded-[14px] border border-(--m-mist) shadow-[0_20px_45px_-30px_rgb(22_32_74/0.45)]"
            >
              <WovenBand className="h-1.5" />
              <div className="p-5">{card.render(c, serif)}</div>
            </figure>
            <p className="mt-4 text-sm leading-relaxed text-(--m-ink)/75">{card.caption}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
