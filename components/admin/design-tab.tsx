"use client";

import { useActionState, useCallback, useEffect, useRef, useState } from "react";
import { saveTheme } from "@/lib/actions/design";
import { FONT_OPTIONS, fontCssVar, themeFontVars, type FontRole, type ThemeFonts } from "@/lib/font-options";
import {
  COLOR_FIELDS,
  CONTRAST_PAIRS,
  contrastRatio,
  getPreset,
  inkFor,
  THEME_PRESETS,
  themeColorVars,
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
  names,
}: {
  theme: ResolvedTheme;
  allowCustom: boolean;
  isDraft: boolean;
  guestUrl: string;
  /** The couple's names, used as the font sample. */
  names: [string, string];
}) {
  const weddingId = useAdminWeddingId();
  const [presetKey, setPresetKey] = useState(theme.presetKey);
  const [colors, setColors] = useState<Record<ColorKey, string>>(theme.colors);
  const [fonts, setFonts] = useState<ThemeFonts>(theme.fonts);
  const snapshot = JSON.stringify({ presetKey, colors, fonts });
  const [savedSnapshot, setSavedSnapshot] = useState(snapshot);
  const unsaved = snapshot !== savedSnapshot;
  const [state, formAction, pending] = useActionState(
    async (prev: Awaited<ReturnType<typeof saveTheme>>, formData: FormData) => {
      const result = await saveTheme(weddingId, prev, formData);
      if (result?.success) setSavedSnapshot(snapshot);
      return result;
    },
    undefined
  );

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

  // Live preview: restyle the guest site in the frame as changes are made, before saving.
  // It mirrors the site's own rule: without custom themes, a live site shows the plain preset.
  const preset = getPreset(presetKey);
  const previewColors = customEditable ? { ...colors, ink: inkFor(colors.foreground, preset) } : preset.colors;
  const previewFonts = customEditable ? fonts : preset.fonts;
  const previewVars = JSON.stringify({ ...themeColorVars(previewColors), ...themeFontVars(previewFonts) });
  const frameRef = useRef<HTMLIFrameElement>(null);
  const applyPreview = useCallback(() => {
    // Same origin, so the dashboard can reach the guest page's theme wrapper directly.
    const root = frameRef.current?.contentDocument?.querySelector<HTMLElement>("[data-wedding-theme]");
    if (!root) return;
    for (const [name, value] of Object.entries(JSON.parse(previewVars) as Record<string, string>)) {
      root.style.setProperty(name, value);
    }
  }, [previewVars]);
  useEffect(applyPreview, [applyPreview]);
  const firstName = (name: string) => name.trim().split(/\s+/)[0] ?? "";
  const sample = `${firstName(names[0]) || "Ada"} & ${firstName(names[1]) || "Tobi"}`;

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <form action={formAction} className="flex flex-col gap-8">
        <input type="hidden" name="presetKey" value={presetKey} />

        <section>
          <h2 className="font-(family-name:--m-display) font-bold tracking-tight text-2xl text-foreground">Theme</h2>
          <p className="mt-1 mb-4 text-sm text-foreground/60">Start from a palette, then fine-tune it below.</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {THEME_PRESETS.map((preset) => (
              <button
                key={preset.key}
                type="button"
                onClick={() => choosePreset(preset.key)}
                aria-pressed={preset.key === presetKey}
                className={`flex flex-col gap-2 rounded-[6px] bg-white p-3 text-left text-xs text-foreground transition-shadow ${
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
          <h2 className="font-(family-name:--m-display) font-bold tracking-tight text-2xl text-foreground">Colors &amp; fonts</h2>
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
                  <span className="flex items-center gap-2 border border-(--m-mist) bg-white px-2 py-1.5">
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
                    className="border border-(--m-mist) bg-white px-3 py-2 text-sm text-foreground"
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
                    {sample}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        </section>

        {state?.error && <p className="text-xs text-burnt-orange">{state.error}</p>}
        {unsaved ? (
          <p className="text-sm text-(--m-ink)/70">You have unsaved changes. The preview shows them; guests won&apos;t until you save.</p>
        ) : (
          state?.success && <p className="text-xs text-olive">Saved.</p>
        )}
        <button
          type="submit"
          disabled={pending}
          className="self-start rounded-full bg-(--m-gold) px-6 py-2.5 text-sm font-semibold text-(--m-ink) hover:bg-(--m-ink) hover:text-(--m-paper) disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save design"}
        </button>
      </form>

      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3">
          <h2 className="flex items-center gap-2.5 font-(family-name:--m-display) font-bold tracking-tight text-2xl text-foreground">
            Preview
            {unsaved && (
              <span className="rounded-full bg-(--m-gold)/25 px-2.5 py-0.5 font-(family-name:--m-body) text-xs font-semibold tracking-normal">
                Unsaved changes
              </span>
            )}
          </h2>
          <a href={guestUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-olive underline hover:text-burnt-orange">
            Open in new tab
          </a>
        </div>
        <iframe
          ref={frameRef}
          onLoad={applyPreview}
          src={guestUrl}
          title="Guest site preview"
          className="h-[640px] w-full border border-(--m-mist) rounded-[6px] bg-white"
        />
      </section>
    </div>
  );
}
