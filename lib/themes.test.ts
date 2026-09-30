import { describe, expect, it } from "vitest";
import { CONTRAST_PAIRS, contrastRatio, DEFAULT_PRESET, resolveTheme, THEME_PRESETS, themeColorVars } from "@/lib/themes";

// The original site's palette is kept as-is; its ivory-on-olive buttons are 4.36:1.
const KNOWN_EXCEPTIONS: Record<string, Record<string, number>> = {
  "terracotta-olive": { "Button text on accent": 4.3 },
};

describe("theme presets", () => {
  for (const preset of THEME_PRESETS) {
    it(`${preset.name} keeps text readable`, () => {
      for (const pair of CONTRAST_PAIRS) {
        const ratio = contrastRatio(preset.colors[pair.fg], preset.colors[pair.bg]);
        const minimum = KNOWN_EXCEPTIONS[preset.key]?.[pair.label] ?? 4.5;
        expect(ratio, `${pair.label}: ${ratio.toFixed(2)}`).toBeGreaterThanOrEqual(minimum);
      }
    });
  }

  it("uses Blush Rose as the default", () => {
    expect(DEFAULT_PRESET.key).toBe("blush-rose");
    expect(themeColorVars(DEFAULT_PRESET.colors)).toMatchObject({
      "--burnt-orange": "#a8475c",
      "--olive": "#8a5d66",
    });
  });
});

describe("resolveTheme", () => {
  const stored = {
    presetKey: "navy-gold",
    colors: { primary: "#123456", accent: "not-a-color", ink: "#ffffff" },
    serifFont: "lora",
    scriptFont: "comic-sans",
    sansFont: null,
  };

  it("applies valid overrides when custom themes are allowed", () => {
    const theme = resolveTheme(stored, true);
    expect(theme.colors.primary).toBe("#123456");
    expect(theme.colors.accent).toBe("#1f3354");
    expect(theme.colors.ink).toBe("#1c2433");
    expect(theme.fonts).toEqual({ serif: "lora", script: "parisienne", sans: "montserrat" });
  });

  it("uses the plain preset when custom themes aren't allowed", () => {
    const theme = resolveTheme(stored, false);
    expect(theme.colors.primary).toBe("#8a6420");
    expect(theme.fonts.serif).toBe("cormorant");
  });

  it("falls back to the default preset", () => {
    expect(resolveTheme(null, true).presetKey).toBe(DEFAULT_PRESET.key);
    expect(resolveTheme({ ...stored, presetKey: "gone" }, true).presetKey).toBe(DEFAULT_PRESET.key);
  });
});
