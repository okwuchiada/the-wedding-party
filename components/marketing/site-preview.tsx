import { fontCssVar } from "@/lib/font-options";
import type { ThemePreset } from "@/lib/themes";

/** A guest's-eye view of a wedding site, drawn with a theme's real colors and fonts. */
export default function SitePreview({
  preset,
  names = ["Ifeoma", "Dayo"],
  dateLabel = "Saturday 12 December",
  place = "Lagos",
}: {
  preset: ThemePreset;
  names?: [string, string];
  dateLabel?: string;
  place?: string;
}) {
  const c = preset.colors;
  const serif = `var(${fontCssVar(preset.fonts.serif)}), Georgia, serif`;
  const script = `var(${fontCssVar(preset.fonts.script)}), cursive`;
  const sans = `var(${fontCssVar(preset.fonts.sans)}), system-ui, sans-serif`;

  return (
    <figure
      aria-label={`Preview of ${names[0]} and ${names[1]}'s site in the ${preset.name} theme`}
      style={{ background: c.background, color: c.foreground, fontFamily: sans }}
      className="overflow-hidden rounded-[22px] border-[6px] border-(--m-ink) shadow-[0_30px_60px_-30px_rgb(22_32_74/0.55)] transition-colors duration-500 motion-reduce:transition-none"
    >
      <div className="px-6 pt-7 pb-5">
        <p style={{ color: c.accent }} className="text-xs">
          {dateLabel}
        </p>
        <p style={{ fontFamily: serif }} className="mt-2 text-4xl leading-[1.05] break-words">
          {names[0]}
          <span style={{ color: c.primary, fontFamily: script }} className="block text-2xl">
            and
          </span>
          {names[1]}
        </p>
        <p className="mt-3 text-[13px] opacity-75">
          {place ? `We're getting married in ${place} and we'd love you there.` : "We're getting married and we'd love you there."}
        </p>
      </div>
      <div style={{ background: c.cream }} className="px-6 py-5">
        <p style={{ fontFamily: serif }} className="text-xl">
          Will you join us?
        </p>
        <div className="mt-3 flex gap-2 text-[13px] font-medium">
          <span style={{ background: c.primary, color: c.ivory }} className="px-3 py-1.5">
            Joyfully yes
          </span>
          <span style={{ borderColor: c.accent }} className="border px-3 py-1.5">
            Sadly no
          </span>
        </div>
      </div>
      <div className="px-6 py-5">
        <div className="flex justify-between text-[13px]">
          <span>Honeymoon fund</span>
          <span style={{ color: c.primary }}>36%</span>
        </div>
        <div style={{ background: `${c.accent}33` }} className="mt-2 h-1">
          <div style={{ background: c.primary, width: "36%" }} className="h-full" />
        </div>
        <p className="mt-2 text-xs opacity-65">₦180,000 of ₦500,000 from 9 guests</p>
      </div>
    </figure>
  );
}
