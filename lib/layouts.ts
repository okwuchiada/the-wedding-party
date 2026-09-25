// Page layout choices for a couple's site: a whole-page template, a hero layout, a
// how-we-met style and the order and visibility of sections. Pure, so the Design tab and server share it.

export const TEMPLATES = [
  { key: "classic", name: "Classic", description: "Warm and photo-led, like a scrapbook.", defaultHero: "split", defaultStory: "timeline" },
  { key: "editorial", name: "Editorial", description: "A magazine feature: huge names, tidy columns.", defaultHero: "type", defaultStory: "list" },
  { key: "minimal", name: "Minimal", description: "One calm, centred column, like a printed invitation.", defaultHero: "card", defaultStory: "simple" },
  { key: "owambe", name: "Owambe", description: "Bold colour blocks and aso-oke stripes.", defaultHero: "type", defaultStory: "cards" },
] as const;

export const HEROES = [
  { key: "split", name: "Split with photos", description: "Names beside three tilted photos." },
  { key: "card", name: "Invitation card", description: "A framed, centred card like the IV." },
  { key: "cover", name: "Full cover photo", description: "Your hero photo edge to edge." },
  { key: "type", name: "Names only", description: "Huge type, no photo needed." },
] as const;

/** How the "How we met" moments are laid out. */
export const STORY_STYLES = [
  { key: "timeline", name: "Polaroid timeline", description: "Tilted photos either side of a line." },
  { key: "list", name: "Magazine list", description: "Big years, text and a small photo in rows." },
  { key: "cards", name: "Photo cards", description: "A grid of cards, photo on top." },
  { key: "strip", name: "Photo strip", description: "Tall photos guests swipe through." },
  { key: "chapters", name: "Chapters", description: "One large photo per moment, like a photo book." },
  { key: "simple", name: "Words only", description: "A quiet centred list, no photos." },
] as const;

export const SECTIONS = [
  { id: "story", name: "How we met", description: "Your story, year by year", defaultVisible: true },
  { id: "notes", name: "Love notes", description: "What you wrote to each other", defaultVisible: true },
  { id: "registry", name: "Registry", description: "Gifts guests can buy or chip into", defaultVisible: true },
  { id: "gift", name: "Monetary gift", description: "Your bank details", defaultVisible: true },
  { id: "asoebi", name: "Asoebi", description: "Fabric and how to order", defaultVisible: false },
  { id: "rsvp", name: "RSVP", description: "The reply form", defaultVisible: true },
] as const;

export const HERO_NAME_STYLES = [
  { key: "full", name: "Full names" },
  { key: "first", name: "First names only" },
] as const;

export type TemplateKey = (typeof TEMPLATES)[number]["key"];
export type HeroNameStyle = (typeof HERO_NAME_STYLES)[number]["key"];
export type HeroKey = (typeof HEROES)[number]["key"];
export type StoryStyle = (typeof STORY_STYLES)[number]["key"];
export type SectionId = (typeof SECTIONS)[number]["id"];
export type SectionSetting = { id: SectionId; visible: boolean };
export type ResolvedLayout = {
  template: TemplateKey;
  /** The hero actually shown: the couple's choice, or the template's default. */
  hero: HeroKey;
  /** The couple's own hero choice; null means "the template's default". */
  heroChoice: HeroKey | null;
  /** Full names or first names only, at the top of the site and in the footer. */
  heroNames: HeroNameStyle;
  /** The how-we-met style shown: the couple's choice, or the template's default. */
  story: StoryStyle;
  /** The couple's own how-we-met choice; null means "the template's default". */
  storyChoice: StoryStyle | null;
  sections: SectionSetting[];
};

export const isTemplateKey = (v: unknown): v is TemplateKey => TEMPLATES.some((t) => t.key === v);
export const isHeroKey = (v: unknown): v is HeroKey => HEROES.some((h) => h.key === v);
export const isStoryStyle = (v: unknown): v is StoryStyle => STORY_STYLES.some((s) => s.key === v);
const isSectionId = (v: unknown): v is SectionId => SECTIONS.some((s) => s.id === v);
export const isHeroNameStyle = (v: unknown): v is HeroNameStyle => HERO_NAME_STYLES.some((s) => s.key === v);

/** "Adanma Okwuchi" → "Adanma" when the couple shows first names only. */
export function heroName(name: string, style: HeroNameStyle) {
  return style === "first" ? (name.trim().split(/\s+/)[0] ?? "") : name;
}

type CoupleStory = { brideName: string; groomName: string } | null | undefined;

/** Both names as the couple chose to show them everywhere (site, emails, dashboard). */
export function coupleNames(story: CoupleStory, style: HeroNameStyle): [string, string] {
  return [heroName(story?.brideName ?? "", style), heroName(story?.groomName ?? "", style)];
}

/** "Amara & David", or null when there are no names yet. */
export function coupleTitle(story: CoupleStory, style: HeroNameStyle) {
  const [a, b] = coupleNames(story, style);
  return a || b ? `${a} & ${b}` : null;
}

/**
 * Cleans a stored section list: known ids only, no duplicates, and any section
 * missing from it (e.g. added after the couple saved) appended with its default.
 */
export function normalizeSections(value: unknown): SectionSetting[] {
  const seen = new Set<SectionId>();
  const out: SectionSetting[] = [];
  for (const item of Array.isArray(value) ? value : []) {
    const id = (item as { id?: unknown })?.id;
    if (!isSectionId(id) || seen.has(id)) continue;
    seen.add(id);
    out.push({ id, visible: (item as { visible?: unknown }).visible !== false });
  }
  for (const s of SECTIONS) if (!seen.has(s.id)) out.push({ id: s.id, visible: s.defaultVisible });
  return out;
}

export function resolveLayout(
  stored:
    | { layoutTemplate?: unknown; heroLayout?: unknown; heroNames?: unknown; storyLayout?: unknown; sections?: unknown }
    | null
    | undefined
): ResolvedLayout {
  const template = isTemplateKey(stored?.layoutTemplate) ? stored.layoutTemplate : "classic";
  const heroChoice = isHeroKey(stored?.heroLayout) ? stored.heroLayout : null;
  const storyChoice = isStoryStyle(stored?.storyLayout) ? stored.storyLayout : null;
  const defaults = TEMPLATES.find((t) => t.key === template)!;
  return {
    template,
    hero: heroChoice ?? defaults.defaultHero,
    heroChoice,
    heroNames: isHeroNameStyle(stored?.heroNames) ? stored.heroNames : "full",
    story: storyChoice ?? defaults.defaultStory,
    storyChoice,
    sections: normalizeSections(stored?.sections),
  };
}

export const visibleSections = (layout: ResolvedLayout) => layout.sections.filter((s) => s.visible).map((s) => s.id);

// ── Unsaved previews: the Design tab passes a layout in the preview URL. ──

export const PREVIEW_PARAMS = { template: "layout", hero: "hero", names: "names", story: "story", sections: "sections" } as const;

/** Compact form for a URL: "story,notes,-asoebi,registry" (a leading "-" = hidden). */
export function encodeSections(sections: SectionSetting[]) {
  return sections.map((s) => (s.visible ? s.id : `-${s.id}`)).join(",");
}

export function decodeSections(value: string): SectionSetting[] {
  return normalizeSections(
    value.split(",").map((part) => (part.startsWith("-") ? { id: part.slice(1), visible: false } : { id: part, visible: true }))
  );
}

/** Applies preview overrides from search params on top of the saved layout. */
export function withPreview(saved: ResolvedLayout, params: Record<string, string | string[] | undefined>): ResolvedLayout {
  const one = (k: string) => (typeof params[k] === "string" ? (params[k] as string) : undefined);
  const template = one(PREVIEW_PARAMS.template);
  const hero = one(PREVIEW_PARAMS.hero);
  const names = one(PREVIEW_PARAMS.names);
  const story = one(PREVIEW_PARAMS.story);
  const sections = one(PREVIEW_PARAMS.sections);
  if ([template, hero, names, story, sections].every((v) => v === undefined)) return saved;
  return resolveLayout({
    layoutTemplate: template ?? saved.template,
    heroLayout: hero === undefined ? saved.heroChoice : hero || null,
    heroNames: names ?? saved.heroNames,
    storyLayout: story === undefined ? saved.storyChoice : story || null,
    sections: sections === undefined ? saved.sections : decodeSections(sections),
  });
}
