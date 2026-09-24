"use client";

import { useActionState, useState } from "react";
import { saveTheme } from "@/lib/actions/design";
import { FONT_OPTIONS, fontCssVar, type FontRole, type ThemeFonts } from "@/lib/font-options";
import {
  COLOR_FIELDS,
  CONTRAST_PAIRS,
  contrastRatio,
  getPreset,
  THEME_PRESETS,
  type ColorKey,
  type ResolvedTheme,
} from "@/lib/themes";
import { useAdminWeddingId } from "./wedding-context";


const ROLE_LABELS: Record<FontRole, string> = {
  serif: "Headings",
  script: "Accents",
  sans: "Body text",
};

function Swatches({ colors }: { colors: Record<string, string> }) {
  return (
    <div className="flex">
      {(["background", "primary", "accent", "cream", "foreground"] as const).map((key) => (
        <span key={key} style={{ background: colors[key] }} className="h-6 flex-1 first:rounded-l-sm last:rounded-r-sm" />
      ))}
    </div>
  );
}

export default function DesignTab({
  theme,
  allowCustom,
  isDraft,
  guestUrl,
}: {
  theme: ResolvedTheme;
  allowCustom: boolean;
  isDraft: boolean;
  guestUrl: string;
}) {
  const weddingId = useAdminWeddingId();
  const [previewKey, setPreviewKey] = useState(0);
  const [state, formAction, pending] = useActionState(
    async (prev: Awaited<ReturnType<typeof saveTheme>>, formData: FormData) => {
      const result = await saveTheme(weddingId, prev, formData);
      // Reload the preview once a save lands.
      if (result?.success) setPreviewKey((k) => k + 1);
      return result;
    },
    undefined
  );
  const [presetKey, setPresetKey] = useState(theme.presetKey);
  const [colors, setColors] = useState<Record<ColorKey, string>>(theme.colors);
  const [fonts, setFonts] = useState<ThemeFonts>(theme.fonts);

  const choosePreset = (key: string) => {
    const preset = getPreset(key);
    setPresetKey(key);
    setColors(preset.colors);
    setFonts(preset.fonts);
  };

  const lowContrast = CONTRAST_PAIRS.map((pair) => ({
    ...pair,
    ratio: contrastRatio(colors[pair.fg], colors[pair.bg]),
  })).filter((pair) => pair.ratio < 4.5);

  const customEditable = allowCustom || isDraft;

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <form action={formAction} className="flex flex-col gap-8">
        <input type="hidden" name="presetKey" value={presetKey} />

        <section>
          <h2 className="font-(family-name:--serif) text-2xl text-foreground">Theme</h2>
          <p className="mt-1 mb-4 text-sm text-foreground/60">Start from a palette, then fine-tune it below.</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {THEME_PRESETS.map((preset) => (
              <button
                key={preset.key}
                type="button"
                onClick={() => choosePreset(preset.key)}
                aria-pressed={preset.key === presetKey}
                className={`flex flex-col gap-2 bg-white p-3 text-left text-xs text-foreground transition-shadow ${
                  preset.key === presetKey ? "ring-2 ring-burnt-orange" : "ring-1 ring-olive/15 hover:ring-olive/40"
                }`}
              >
                <Swatches colors={preset.colors} />
                {preset.name}
              </button>
            ))}
          </div>
        </section>

        <section>
          <h2 className="font-(family-name:--serif) text-2xl text-foreground">Colors &amp; fonts</h2>
          {!allowCustom && (
            <p className="mt-2 bg-cream px-3 py-2 text-xs text-foreground/70">
              {isDraft
                ? "Custom colors and fonts are shown in your preview. Choose a plan with custom themes to keep them when you publish."
                : "Your plan uses the theme's own colors and fonts. Upgrade to customize them."}
            </p>
          )}

          <fieldset disabled={!customEditable} className="mt-4 flex flex-col gap-5 disabled:opacity-50">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {COLOR_FIELDS.map(({ key, label }) => (
                <label key={key} className="flex flex-col gap-1.5 text-xs text-foreground/60">
                  {label}
                  <span className="flex items-center gap-2 border border-olive/20 bg-white px-2 py-1.5">
                    <input
                      type="color"
                      name={`color_${key}`}
                      value={colors[key]}
                      onChange={(e) => setColors((prev) => ({ ...prev, [key]: e.target.value }))}
                      className="h-6 w-8 cursor-pointer border-0 bg-transparent p-0"
                    />
                    <span className="font-mono text-[11px] text-foreground/70">{colors[key]}</span>
                  </span>
                </label>
              ))}
            </div>

            {lowContrast.length > 0 && (
              <ul className="flex flex-col gap-1 text-xs text-burnt-orange">
                {lowContrast.map((pair) => (
                  <li key={pair.label}>
                    {pair.label} may be hard to read ({pair.ratio.toFixed(1)}:1; aim for 4.5:1).
                  </li>
                ))}
              </ul>
            )}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {(Object.keys(FONT_OPTIONS) as FontRole[]).map((role) => (
                <label key={role} className="flex flex-col gap-1.5 text-xs text-foreground/60">
                  {ROLE_LABELS[role]}
                  <select
                    name={`font_${role}`}
                    value={fonts[role]}
                    onChange={(e) => setFonts((prev) => ({ ...prev, [role]: e.target.value }))}
                    className="border border-olive/20 bg-white px-3 py-2 text-sm text-foreground"
                  >
                    {FONT_OPTIONS[role].map((option) => (
                      <option key={option.key} value={option.key}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <span
                    style={{ fontFamily: `var(${fontCssVar(fonts[role])})` }}
                    className="text-xl text-foreground"
                  >
                    Ada &amp; Tobi
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        </section>

        {state?.error && <p className="text-xs text-burnt-orange">{state.error}</p>}
        {state?.success && <p className="text-xs text-olive">Saved. The preview has been refreshed.</p>}
        <button
          type="submit"
          disabled={pending}
          className="self-start bg-burnt-orange px-6 py-2.5 text-xs font-medium text-ivory hover:bg-burnt-orange-dark disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save design"}
        </button>
      </form>

      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h2 className="font-(family-name:--serif) text-2xl text-foreground">Preview</h2>
          <a href={guestUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-olive underline hover:text-burnt-orange">
            Open in new tab
          </a>
        </div>
        <iframe
          key={previewKey}
          src={guestUrl}
          title="Guest site preview"
          className="h-[640px] w-full border border-olive/20 bg-white"
        />
      </section>
    </div>
  );
}
