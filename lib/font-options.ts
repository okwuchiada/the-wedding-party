// Font choices offered to couples. Loaded with next/font in lib/fonts.ts; keep in sync.
export const FONT_OPTIONS = {
  serif: [
    { key: "cormorant", label: "Cormorant Garamond", cssVar: "--font-cormorant" },
    { key: "eb-garamond", label: "EB Garamond", cssVar: "--font-eb-garamond" },
    { key: "playfair", label: "Playfair Display", cssVar: "--font-playfair" },
    { key: "lora", label: "Lora", cssVar: "--font-lora" },
  ],
  script: [
    { key: "dancing-script", label: "Dancing Script", cssVar: "--font-dancing-script" },
    { key: "great-vibes", label: "Great Vibes", cssVar: "--font-great-vibes" },
    { key: "parisienne", label: "Parisienne", cssVar: "--font-parisienne" },
  ],
  sans: [
    { key: "geist", label: "Geist", cssVar: "--font-geist-sans" },
    { key: "montserrat", label: "Montserrat", cssVar: "--font-montserrat" },
    { key: "jost", label: "Jost", cssVar: "--font-jost" },
  ],
} as const;

export type FontRole = keyof typeof FONT_OPTIONS;
export type FontKey<R extends FontRole> = (typeof FONT_OPTIONS)[R][number]["key"];
export type ThemeFonts = { serif: FontKey<"serif">; script: FontKey<"script">; sans: FontKey<"sans"> };

/** The CSS variable next/font defines for a font key, e.g. "--font-lora". */
export function fontCssVar(key: string) {
  for (const options of Object.values(FONT_OPTIONS)) {
    const match = options.find((option) => option.key === key);
    if (match) return match.cssVar;
  }
  return undefined;
}

export function isFontKey<R extends FontRole>(role: R, key: unknown): key is FontKey<R> {
  return FONT_OPTIONS[role].some((option) => option.key === key);
}
