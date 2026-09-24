"use client";

import { useState } from "react";
import { THEME_PRESETS } from "@/lib/themes";
import SitePreview from "./site-preview";

type Colors = (typeof THEME_PRESETS)[number]["colors"];

/** A narrow aso-oke strip: fine warp stripes in the theme's colors, repeated down its length. */
function stripeCloth(c: Colors, offset: number) {
  const bands: [string, number][] = [
    [c.primary, 22], [c.ivory, 3], [c.accent, 10], [c.cream, 4], [c.primaryDark, 6],
    [c.ivory, 2], [c.accentDark, 14], [c.cream, 3], [c.primary, 5], [c.foreground, 2],
  ];
  let y = 0;
  const stops = bands.map(([color, h]) => `${color} ${y}px ${(y += h)}px`).join(", ");
  return { backgroundImage: `repeating-linear-gradient(to bottom, ${stops})`, backgroundPositionY: `${offset}px` };
}

/**
 * The hero's woven band: one aso-oke-style strip per theme. Choosing a strip
 * re-dyes the sample guest site with that theme's real colors and fonts.
 */
export default function ThemeShowcase({ children }: { children: React.ReactNode }) {
  const [active, setActive] = useState("adire-indigo");
  const preset = THEME_PRESETS.find((p) => p.key === active) ?? THEME_PRESETS[0];

  return (
    <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] lg:gap-16">
      <div>
        {children}
        <div role="radiogroup" aria-label="Site theme" className="mt-12 flex h-40 gap-px sm:h-48 sm:gap-1">
          {THEME_PRESETS.map((p, i) => {
            const selected = p.key === active;
            return (
              <button
                key={p.key}
                type="button"
                role="radio"
                aria-checked={selected}
                aria-label={p.name}
                onClick={() => setActive(p.key)}
                style={{ animationDelay: `${i * 90}ms`, ...stripeCloth(p.colors, i * -17) }}
                className={`weave-in group relative flex flex-1 flex-col overflow-hidden rounded-[2px] outline-offset-4 transition-[flex-grow] duration-500 focus-visible:outline-2 focus-visible:outline-(--m-ink) motion-reduce:transition-none ${
                  selected ? "grow-[2.2]" : "grow"
                }`}
              >
                <span
                  className={`absolute inset-x-0 bottom-0 bg-(--m-ink)/85 px-2 py-1.5 text-left text-[11px] leading-tight font-semibold text-(--m-paper) transition-opacity ${
                    selected ? "opacity-100" : "opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100"
                  }`}
                >
                  {p.name}
                </span>
              </button>
            );
          })}
        </div>
        <p className="mt-3 text-sm text-(--m-ink)/65">Pick a strip to dress the site. Every colour and font can be changed later.</p>
      </div>

      <SitePreview preset={preset} />
    </div>
  );
}
