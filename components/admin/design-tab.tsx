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
import {
  encodeSections,
  heroName,
  HEROES,
  PREVIEW_PARAMS,
  SECTIONS,
  STORY_STYLES,
  TEMPLATES,
  type HeroKey,
  type HeroNameStyle,
  type ResolvedLayout,
  type SectionSetting,
  type StoryStyle,
  type TemplateKey,
} from "@/lib/layouts";
import { AccordionItem } from "./accordion";
import { HeroNamesPicker, HeroPicker, SectionsEditor, StoryStylePicker, TemplatePicker } from "./layout-picker";
import { useAdminWeddingId } from "./wedding-context";
import { Button, buttonClass } from "@/components/ui/button";
import { inputClass } from "@/components/ui/field";
import { useSuccessToast } from "@/components/ui/toast";


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
  allowedThemes,
  planName,
  isDraft,
  guestUrl,
  names,
  layout,
  emptySections,
}: {
  theme: ResolvedTheme;
  allowCustom: boolean;
  /** Themes the plan includes; empty means all of them. */
  allowedThemes: string[];
  planName: string | null;
  isDraft: boolean;
  guestUrl: string;
  /** The couple's names, used as the font sample. */
  names: [string, string];
  /** The saved page layout. */
  layout: ResolvedLayout;
  /** Sections with nothing to show yet. */
  emptySections: string[];
}) {
  const weddingId = useAdminWeddingId();
  const [presetKey, setPresetKey] = useState(theme.presetKey);
  const [colors, setColors] = useState<Record<ColorKey, string>>(theme.colors);
  const [fonts, setFonts] = useState<ThemeFonts>(theme.fonts);
  const [template, setTemplate] = useState<TemplateKey>(layout.template);
  const [heroChoice, setHeroChoice] = useState<HeroKey | null>(layout.heroChoice);
  const [sections, setSections] = useState<SectionSetting[]>(layout.sections);
  const [nameStyle, setNameStyle] = useState<HeroNameStyle>(layout.heroNames);
  const [storyChoice, setStoryChoice] = useState<StoryStyle | null>(layout.storyChoice);
  const snapshot = JSON.stringify({ presetKey, colors, fonts, template, heroChoice, nameStyle, storyChoice, sections });
  const layoutSnapshot = JSON.stringify({ template, heroChoice, nameStyle, storyChoice, sections });
  const [savedLayout, setSavedLayout] = useState(layoutSnapshot);
  const [savedSnapshot, setSavedSnapshot] = useState(snapshot);
  const unsaved = snapshot !== savedSnapshot;
  const [state, formAction, pending] = useActionState(
    async (prev: Awaited<ReturnType<typeof saveTheme>>, formData: FormData) => {
      const result = await saveTheme(weddingId, prev, formData);
      if (result?.success) {
        setSavedSnapshot(snapshot);
        setSavedLayout(layoutSnapshot);
      }
      return result;
    },
    undefined
  );
  useSuccessToast(state, "Design saved");

  const choosePreset = (key: string) => {
    const preset = getPreset(key);
    setPresetKey(key);
    setColors(preset.colors);
    setFonts(preset.fonts);
  };


  const customEditable = allowCustom || isDraft;
  const lockedThemes = allowedThemes.length > 0;

  // One panel open at a time keeps the tab calm; Layout starts open.
  type Panel = "layout" | "hero" | "story" | "sections" | "theme" | "colors";
  const [openPanel, setOpenPanel] = useState<Panel | null>("layout");
  const togglePanel = (panel: Panel) => setOpenPanel((current) => (current === panel ? null : panel));

  // What each closed panel says about the current choice.
  const templateInfo = TEMPLATES.find((t) => t.key === template)!;
  const heroSummary = heroChoice
    ? HEROES.find((h) => h.key === heroChoice)!.name
    : `Template default (${HEROES.find((h) => h.key === templateInfo.defaultHero)!.name})`;
  const storySummary = storyChoice
    ? STORY_STYLES.find((s) => s.key === storyChoice)!.name
    : `Template default (${STORY_STYLES.find((s) => s.key === templateInfo.defaultStory)!.name})`;
  const hiddenNames = sections.filter((s) => !s.visible).map((s) => SECTIONS.find((d) => d.id === s.id)!.name);
  const sectionsSummary = `${sections.length - hiddenNames.length} shown${hiddenNames.length ? ` · ${hiddenNames.join(", ")} hidden` : ""}`;
  const basePreset = getPreset(presetKey);
  const customised =
    COLOR_FIELDS.some(({ key }) => colors[key] !== basePreset.colors[key]) ||
    (Object.keys(fonts) as FontRole[]).some((role) => fonts[role] !== basePreset.fonts[role]);
  // Only the couple's own colour changes are checked; the shipped palettes are vetted.
  const colorsChanged = COLOR_FIELDS.some(({ key }) => colors[key] !== basePreset.colors[key]);
  const lowContrast = colorsChanged
    ? CONTRAST_PAIRS.map((pair) => ({ ...pair, ratio: contrastRatio(colors[pair.fg], colors[pair.bg]) })).filter(
        (pair) => pair.ratio < 4.5
      )
    : [];
  const headingFont = FONT_OPTIONS.serif.find((f) => f.key === fonts.serif)?.label ?? "";
  const colorsSummary =
    lowContrast.length > 0 && customEditable
      ? `${lowContrast.length} colour pair${lowContrast.length === 1 ? "" : "s"} may be hard to read`
      : `${customised && customEditable ? "Custom" : "Theme's own"} colours · ${headingFont} headings`;

  // Live preview: restyle the guest site in the frame as changes are made, before saving.
  // It mirrors the site's own rule: without custom themes, a live site shows the plain preset.
  const preset = getPreset(presetKey);
  const previewColors = customEditable ? { ...colors, ink: inkFor(colors.foreground, preset) } : preset.colors;
  const previewFonts = customEditable ? fonts : preset.fonts;
  const previewVars = JSON.stringify({ ...themeColorVars(previewColors), ...themeFontVars(previewFonts) });
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  useEffect(() => {
    if (!previewOpen) return;
    const onKeyDown = (e: KeyboardEvent) => e.key === "Escape" && setPreviewOpen(false);
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [previewOpen]);
  const applyPreview = useCallback(() => {
    // Same origin, so the dashboard can reach the guest page's theme wrapper directly.
    const root = frameRef.current?.contentDocument?.querySelector<HTMLElement>("[data-wedding-theme]");
    if (!root) return;
    for (const [name, value] of Object.entries(JSON.parse(previewVars) as Record<string, string>)) {
      root.style.setProperty(name, value);
    }
  }, [previewVars]);
  useEffect(applyPreview, [applyPreview]);

  // Layout changes need the page re-rendered, so the preview reloads with the unsaved
  // layout in its URL (honoured only for people who manage this wedding).
  const layoutUrl =
    layoutSnapshot === savedLayout
      ? guestUrl
      : `${guestUrl}?${new URLSearchParams({
          [PREVIEW_PARAMS.template]: template,
          [PREVIEW_PARAMS.hero]: heroChoice ?? "",
          [PREVIEW_PARAMS.names]: nameStyle,
          [PREVIEW_PARAMS.story]: storyChoice ?? "",
          [PREVIEW_PARAMS.sections]: encodeSections(sections),
        })}`;
  const [previewUrl, setPreviewUrl] = useState(layoutUrl);
  useEffect(() => {
    const timer = setTimeout(() => setPreviewUrl(layoutUrl), 400);
    return () => clearTimeout(timer);
  }, [layoutUrl]);

  // While choosing a How we met style, keep the preview on that section so the change is visible.
  const showStory = openPanel === "story";
  const scrollToStory = useCallback(() => {
    if (!showStory) return;
    // Streamed sections arrive hidden and are revealed shortly after load, so retry briefly.
    let tries = 0;
    const timer = setInterval(() => {
      const section = frameRef.current?.contentDocument?.getElementById("how-we-met");
      if (section?.checkVisibility()) section.scrollIntoView({ block: "start" });
      if (section?.checkVisibility() || ++tries > 30) clearInterval(timer);
    }, 100);
    return () => clearInterval(timer);
  }, [showStory]);
  useEffect(scrollToStory, [scrollToStory]);
  const sample = `${heroName(names[0], nameStyle) || "Ada"} & ${heroName(names[1], nameStyle) || "Tobi"}`;

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <form action={formAction} className="flex flex-col gap-5">
        <input type="hidden" name="presetKey" value={presetKey} />
        <input type="hidden" name="layoutTemplate" value={template} />
        <input type="hidden" name="heroLayout" value={heroChoice ?? ""} />
        <input type="hidden" name="heroNames" value={nameStyle} />
        <input type="hidden" name="storyLayout" value={storyChoice ?? ""} />
        <input type="hidden" name="sections" value={JSON.stringify(sections)} />

        <div className="flex flex-col gap-3">
          <AccordionItem title="Layout" summary={templateInfo.name} open={openPanel === "layout"} onToggle={() => togglePanel("layout")}>
            <p className="mb-4 text-sm text-muted">The overall style of the page. Colours and fonts work with every layout.</p>
            <TemplatePicker value={template} onChange={setTemplate} />
          </AccordionItem>

          <AccordionItem
            title="Top of the site"
            summary={`${heroSummary} · ${nameStyle === "first" ? "First names only" : "Full names"}`}
            open={openPanel === "hero"}
            onToggle={() => togglePanel("hero")}
          >
            <div className="flex flex-col gap-5">
              <HeroPicker value={heroChoice} template={template} onChange={setHeroChoice} />
              <div className="flex flex-col gap-3">
                <div>
                  <h3 className="text-sm font-semibold">Names on your site</h3>
                  <p className="mt-0.5 text-xs text-muted">Used everywhere your names appear: your site, emails to guests and your dashboard.</p>
                </div>
                <HeroNamesPicker value={nameStyle} names={names} onChange={setNameStyle} />
              </div>
            </div>
          </AccordionItem>

          <AccordionItem title="How we met" summary={storySummary} open={openPanel === "story"} onToggle={() => togglePanel("story")}>
            <p className="mb-4 text-sm text-muted">How your story moments are laid out. Styles with photos use the ones you add in Our Story.</p>
            <StoryStylePicker value={storyChoice} template={template} onChange={setStoryChoice} />
          </AccordionItem>

          <AccordionItem title="Sections" summary={sectionsSummary} open={openPanel === "sections"} onToggle={() => togglePanel("sections")}>
            <SectionsEditor value={sections} onChange={setSections} empty={emptySections} />
          </AccordionItem>

          <AccordionItem title="Theme" summary={getPreset(presetKey).name} open={openPanel === "theme"} onToggle={() => togglePanel("theme")}>
            <p className="mb-4 text-sm text-muted">Start from a palette, then fine-tune it in Colours &amp; fonts.</p>
            {lockedThemes && (
              <p className="mb-4 bg-surface-muted px-3 py-2 text-xs text-muted">
                {isDraft
                  ? `${planName} includes ${allowedThemes.length} themes. You can preview the others; upgrade in Billing to publish with one.`
                  : `${planName} includes ${allowedThemes.length} themes. Upgrade in Billing to use the others.`}
              </p>
            )}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {THEME_PRESETS.map((preset) => {
              const included = !lockedThemes || allowedThemes.includes(preset.key);
              return (
                <button
                  key={preset.key}
                  type="button"
                  onClick={() => choosePreset(preset.key)}
                  aria-pressed={preset.key === presetKey}
                  // Live sites can only switch to themes their plan includes; drafts may preview any.
                  disabled={!included && !isDraft}
                  className={`flex flex-col gap-2 rounded-md bg-surface p-3 text-left text-xs text-ink transition-shadow disabled:cursor-not-allowed disabled:opacity-45 ${
                    preset.key === presetKey ? "ring-2 ring-danger" : "ring-1 ring-success/15 hover:ring-success/40"
                  }`}
                >
                  <Swatches colors={preset.colors} />
                  <span className="flex items-center justify-between gap-2">
                    {preset.name}
                    {!included && <span className="rounded-full bg-action/30 px-1.5 py-0.5 text-[13px] font-semibold">Upgrade</span>}
                  </span>
                </button>
              );
            })}
          </div>
          </AccordionItem>

          <AccordionItem
            title="Colours & fonts"
            summary={colorsSummary}
            summaryTone={lowContrast.length > 0 && customEditable ? "warn" : "muted"}
            open={openPanel === "colors"}
            onToggle={() => togglePanel("colors")}
          >
          {!allowCustom && (
            <p className="mt-2 bg-surface-muted px-3 py-2 text-xs text-muted">
              {isDraft
                ? "Custom colors and fonts are shown in your preview. Choose a plan with custom themes to keep them when you publish."
                : "Your plan uses the theme's own colors and fonts. Upgrade to customize them."}
            </p>
          )}

          <fieldset disabled={!customEditable} className="mt-4 flex flex-col gap-5 disabled:opacity-50">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {COLOR_FIELDS.map(({ key, label }) => (
                <label key={key} className="flex flex-col gap-1.5 text-sm font-medium text-ink">
                  {label}
                  <span className="flex items-center gap-2 border border-line bg-surface px-2 py-1.5">
                    <input
                      type="color"
                      name={`color_${key}`}
                      value={colors[key]}
                      onChange={(e) => setColors((prev) => ({ ...prev, [key]: e.target.value }))}
                      className="h-6 w-8 cursor-pointer border-0 bg-transparent p-0"
                    />
                    <span className="font-mono text-[13px] text-muted">{colors[key]}</span>
                  </span>
                </label>
              ))}
            </div>

            {lowContrast.length > 0 && (
              <ul className="flex flex-col gap-1 text-xs text-danger">
                {lowContrast.map((pair) => (
                  <li key={pair.label}>
                    {pair.label} may be hard to read ({pair.ratio.toFixed(1)}:1; aim for 4.5:1).
                  </li>
                ))}
              </ul>
            )}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {(Object.keys(FONT_OPTIONS) as FontRole[]).map((role) => (
                <label key={role} className="flex flex-col gap-1.5 text-sm font-medium text-ink">
                  {ROLE_LABELS[role]}
                  <select
                    name={`font_${role}`}
                    value={fonts[role]}
                    onChange={(e) => setFonts((prev) => ({ ...prev, [role]: e.target.value }))}
                    className={`${inputClass} w-auto`}
                  >
                    {FONT_OPTIONS[role].map((option) => (
                      <option key={option.key} value={option.key}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <span
                    style={{ fontFamily: `var(${fontCssVar(fonts[role])})` }}
                    className="text-xl text-ink"
                  >
                    {sample}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
          </AccordionItem>
        </div>

        {state?.error && <p className="text-[13px] text-danger">{state.error}</p>}
        {unsaved && (
          <p className="text-sm text-muted">You have unsaved changes. The preview shows them; guests won&apos;t until you save.</p>
        )}
        <button
          type="submit"
          disabled={pending}
          className={`self-start ${buttonClass("primary", "md")}`}
        >
          {pending ? "Saving…" : "Save design"}
        </button>
      </form>

      {/* On phones the preview is a full-screen sheet opened from a pinned button; one iframe serves both. */}
      <section
        role={previewOpen ? "dialog" : undefined}
        aria-modal={previewOpen ? true : undefined}
        aria-label={previewOpen ? "Preview" : undefined}
        className={
          previewOpen
            ? "fixed inset-0 z-overlay flex flex-col gap-3 bg-surface p-4 lg:static lg:z-auto lg:bg-transparent lg:p-0"
            : "hidden flex-col gap-2 lg:flex"
        }
      >
        <div className="flex items-center justify-between gap-3">
          <h2 className="flex items-center gap-2.5 font-(family-name:--m-display) text-2xl font-bold tracking-tight text-ink">
            Preview
            {unsaved && (
              <span className="rounded-full bg-action/25 px-2.5 py-0.5 font-(family-name:--m-body) text-[13px] font-semibold tracking-normal">
                Unsaved changes
              </span>
            )}
          </h2>
          <span className="flex items-center gap-3">
            <a href={guestUrl} target="_blank" rel="noopener noreferrer" className={buttonClass("text", "sm")}>
              Open in new tab
            </a>
            {previewOpen && (
              <Button variant="secondary" size="sm" className="lg:hidden" onClick={() => setPreviewOpen(false)} autoFocus>
                Close
              </Button>
            )}
          </span>
        </div>
        <iframe
          ref={frameRef}
          onLoad={() => {
            applyPreview();
            scrollToStory();
          }}
          src={previewUrl}
          title="Guest site preview"
          className="min-h-0 w-full flex-1 rounded-md border border-line bg-surface lg:h-160 lg:flex-none"
        />
      </section>

      {!previewOpen && (
        <Button variant="inverse" size="lg" className="fixed bottom-5 left-1/2 z-nav -translate-x-1/2 shadow-[0_12px_28px_-10px_rgb(22_32_74/0.6)] lg:hidden" onClick={() => setPreviewOpen(true)}>
          Preview
        </Button>
      )}
    </div>
  );
}
