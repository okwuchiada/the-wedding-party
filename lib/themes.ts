import { isFontKey, type ThemeFonts } from "@/lib/font-options";

/** Colors a couple can edit. `primary`/`accent` drive the burnt-orange/olive utilities. */
export const COLOR_FIELDS = [
  { key: "background", label: "Page background" },
  { key: "foreground", label: "Text" },
  { key: "primary", label: "Highlight" },
  { key: "primaryDark", label: "Highlight (hover)" },
  { key: "accent", label: "Accent" },
  { key: "accentDark", label: "Accent (deep)" },
  { key: "ivory", label: "Light" },
  { key: "cream", label: "Section tint" },
] as const;

export type ColorKey = (typeof COLOR_FIELDS)[number]["key"];
export type ThemeColors = Record<ColorKey, string> & { ink: string };

export type ThemePreset = { key: string; name: string; colors: ThemeColors; fonts: ThemeFonts };

export const THEME_PRESETS: ThemePreset[] = [
  {
    key: "terracotta-olive",
    name: "Terracotta & Olive",
    colors: {
      background: "#fdf6ec",
      foreground: "#252a1a",
      primary: "#c1440e",
      primaryDark: "#9c3709",
      accent: "#6b7a44",
      accentDark: "#4f5a32",
      ivory: "#fdf6ec",
      cream: "#f0ead9",
      ink: "#3a2e28",
    },
    fonts: { serif: "cormorant", script: "dancing-script", sans: "geist" },
  },
  {
    key: "blush-rose",
    name: "Blush & Rose",
    colors: {
      background: "#fbf5f3",
      foreground: "#3b2a2e",
      primary: "#a8475c",
      primaryDark: "#853647",
      accent: "#8a5d66",
      accentDark: "#6b464e",
      ivory: "#fdf8f6",
      cream: "#f3e6e3",
      ink: "#4a3035",
    },
    fonts: { serif: "playfair", script: "great-vibes", sans: "montserrat" },
  },
  {
    key: "navy-gold",
    name: "Navy & Gold",
    colors: {
      background: "#f8f6f1",
      foreground: "#1c2433",
      primary: "#8a6420",
      primaryDark: "#6e4f18",
      accent: "#1f3354",
      accentDark: "#142340",
      ivory: "#fbf9f4",
      cream: "#efe9dc",
      ink: "#1c2433",
    },
    fonts: { serif: "cormorant", script: "parisienne", sans: "montserrat" },
  },
  {
    key: "sage-clay",
    name: "Sage & Clay",
    colors: {
      background: "#f7f6ef",
      foreground: "#2a3128",
      primary: "#9a5634",
      primaryDark: "#7a4228",
      accent: "#5e7055",
      accentDark: "#475540",
      ivory: "#fbfaf4",
      cream: "#ebeadd",
      ink: "#2f3a2c",
    },
    fonts: { serif: "eb-garamond", script: "dancing-script", sans: "jost" },
  },
  {
    key: "plum-lavender",
    name: "Plum & Lavender",
    colors: {
      background: "#f8f5fa",
      foreground: "#2b2233",
      primary: "#6d3f7a",
      primaryDark: "#532e5d",
      accent: "#6e5e84",
      accentDark: "#534666",
      ivory: "#fcfafd",
      cream: "#ece5f0",
      ink: "#35293f",
    },
    fonts: { serif: "lora", script: "parisienne", sans: "jost" },
  },
  {
    key: "monochrome",
    name: "Monochrome",
    colors: {
      background: "#fafafa",
      foreground: "#161616",
      primary: "#161616",
      primaryDark: "#000000",
      accent: "#555555",
      accentDark: "#333333",
      ivory: "#ffffff",
      cream: "#eeeeee",
      ink: "#161616",
    },
    fonts: { serif: "playfair", script: "great-vibes", sans: "geist" },
  },
];

export const DEFAULT_PRESET = THEME_PRESETS[0];

const HEX_COLOR = /^#[0-9a-f]{6}$/i;

export function isHexColor(value: unknown): value is string {
  return typeof value === "string" && HEX_COLOR.test(value);
}

export function getPreset(key: string | null | undefined) {
  return THEME_PRESETS.find((preset) => preset.key === key) ?? DEFAULT_PRESET;
}

type StoredTheme = {
  presetKey: string;
  colors: unknown;
  serifFont: string | null;
  scriptFont: string | null;
  sansFont: string | null;
} | null;

export type ResolvedTheme = { presetKey: string; colors: ThemeColors; fonts: ThemeFonts };

/**
 * The preset plus the couple's overrides. Overrides only apply when the plan
 * allows custom themes; invalid stored values fall back to the preset.
 */
export function resolveTheme(stored: StoredTheme | undefined, allowCustom: boolean): ResolvedTheme {
  const preset = getPreset(stored?.presetKey);
  if (!stored || !allowCustom) {
    return { presetKey: preset.key, colors: preset.colors, fonts: preset.fonts };
  }

  const overrides = (stored.colors && typeof stored.colors === "object" ? stored.colors : {}) as Record<string, unknown>;
  const colors = { ...preset.colors };
  for (const { key } of COLOR_FIELDS) {
    if (isHexColor(overrides[key])) colors[key] = overrides[key].toLowerCase();
  }
  if (isHexColor(overrides.foreground)) colors.ink = colors.foreground;

  return {
    presetKey: preset.key,
    colors,
    fonts: {
      serif: isFontKey("serif", stored.serifFont) ? stored.serifFont : preset.fonts.serif,
      script: isFontKey("script", stored.scriptFont) ? stored.scriptFont : preset.fonts.script,
      sans: isFontKey("sans", stored.sansFont) ? stored.sansFont : preset.fonts.sans,
    },
  };
}

function hexToRgb(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255] as const;
}

/** CSS custom properties consumed by app/globals.css. Fonts are added by the caller. */
export function themeColorVars(colors: ThemeColors): Record<string, string> {
  return {
    "--background": colors.background,
    "--foreground": colors.foreground,
    "--olive": colors.accent,
    "--olive-dark": colors.accentDark,
    "--burnt-orange": colors.primary,
    "--burnt-orange-dark": colors.primaryDark,
    "--ivory": colors.ivory,
    "--cream": colors.cream,
    "--ink": hexToRgb(colors.ink).join(" "),
  };
}

/** WCAG 2 contrast ratio between two hex colors (1–21). */
export function contrastRatio(a: string, b: string) {
  const luminance = (hex: string) => {
    const [r, g, bl] = hexToRgb(hex).map((c) => {
      const s = c / 255;
      return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** Pairs the guest site actually renders text on; each should reach 4.5:1. */
export const CONTRAST_PAIRS: { fg: ColorKey; bg: ColorKey; label: string }[] = [
  { fg: "foreground", bg: "background", label: "Text on page background" },
  { fg: "foreground", bg: "cream", label: "Text on section tint" },
  { fg: "ivory", bg: "primary", label: "Button text on highlight" },
  { fg: "ivory", bg: "accent", label: "Button text on accent" },
  { fg: "ivory", bg: "foreground", label: "Footer text" },
];

/** Blends two hex colors; t=0 gives a, t=1 gives b. */
export function mixHex(a: string, b: string, t: number) {
  const [ar, ag, ab] = hexToRgb(a);
  const [br, bg, bb] = hexToRgb(b);
  const mix = (x: number, y: number) => Math.round(x + (y - x) * t).toString(16).padStart(2, "0");
  return `#${mix(ar, br)}${mix(ag, bg)}${mix(ab, bb)}`;
}
