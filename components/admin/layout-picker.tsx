"use client";

import { ArrowDown, ArrowUp, GripVertical } from "lucide-react";
import { useState } from "react";
import {
  HERO_NAME_STYLES,
  HEROES,
  heroName,
  SECTIONS,
  STORY_STYLES,
  TEMPLATES,
  type HeroKey,
  type HeroNameStyle,
  type SectionSetting,
  type StoryStyle,
  type TemplateKey,
} from "@/lib/layouts";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

const cardClass = (selected: boolean) =>
  `flex flex-col gap-2 rounded-[6px] bg-white p-3 text-left text-sm transition-shadow focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--m-ink) ${
    selected ? "ring-2 ring-(--m-ink)" : "ring-1 ring-(--m-mist) hover:ring-(--m-ink)/40"
  }`;

/** Tiny wireframes of each template's shape, so the choice is visual. */
function TemplateSketch({ template }: { template: TemplateKey }) {
  const bar = "rounded-[2px] bg-(--m-ink)/15";
  const accent = "rounded-[2px] bg-(--m-gold)";
  const sketches: Record<TemplateKey, React.ReactNode> = {
    classic: (
      <div className="grid h-full grid-cols-[1fr_0.8fr] gap-1.5 p-2">
        <div className="flex flex-col justify-center gap-1">
          <span className={`${bar} h-2 w-4/5`} />
          <span className={`${bar} h-2 w-3/5`} />
          <span className={`${accent} mt-1 h-1.5 w-2/5`} />
        </div>
        <div className="relative">
          <span className="absolute top-0 left-0 h-7 w-6 -rotate-6 rounded-[2px] border-2 border-white bg-(--m-ink)/20" />
          <span className="absolute right-0 bottom-0 h-6 w-5 rotate-6 rounded-[2px] border-2 border-white bg-(--m-ink)/25" />
        </div>
      </div>
    ),
    editorial: (
      <div className="flex h-full flex-col gap-1 p-2">
        <span className={`${bar} h-3 w-full`} />
        <span className={`${bar} h-3 w-4/5`} />
        <span className="mt-1 h-px w-full bg-(--m-ink)/30" />
        <span className="mt-1 flex-1 rounded-[2px] bg-(--m-ink)/20" />
      </div>
    ),
    minimal: (
      <div className="flex h-full items-center justify-center p-2">
        <div className="flex h-full w-3/4 flex-col items-center justify-center gap-1 rounded-[2px] border border-(--m-ink)/30">
          <span className={`${bar} h-1.5 w-1/2`} />
          <span className={`${bar} h-1.5 w-2/5`} />
          <span className={`${accent} mt-1 h-1 w-1/4`} />
        </div>
      </div>
    ),
    owambe: (
      <div className="flex h-full flex-col">
        <div className="flex h-1.5">
          {["bg-(--m-coral)", "bg-(--m-emerald)", "bg-(--m-gold)", "bg-(--m-ink)"].map((c) => (
            <span key={c} className={`flex-1 ${c}`} />
          ))}
        </div>
        <div className="flex flex-1 flex-col justify-center gap-1 bg-(--m-coral) p-2">
          <span className="h-2 w-4/5 rounded-[2px] bg-white/80" />
          <span className="h-2 w-3/5 rounded-[2px] bg-white/80" />
          <span className="mt-1 h-3 w-4 rounded-[2px] bg-white" />
        </div>
      </div>
    ),
  };
  return <div className="h-16 overflow-hidden rounded-[4px] bg-(--m-paper)">{sketches[template]}</div>;
}

export function TemplatePicker({ value, onChange }: { value: TemplateKey; onChange: (v: TemplateKey) => void }) {
  return (
    <div role="radiogroup" aria-label="Template" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {TEMPLATES.map((t) => (
        <button key={t.key} type="button" role="radio" aria-checked={t.key === value} onClick={() => onChange(t.key)} className={cardClass(t.key === value)}>
          <TemplateSketch template={t.key} />
          <span className="font-semibold">{t.name}</span>
          <span className="text-xs leading-snug text-(--m-ink)/60">{t.description}</span>
        </button>
      ))}
    </div>
  );
}

export function HeroPicker({
  value,
  template,
  onChange,
}: {
  /** null = the template's default hero. */
  value: HeroKey | null;
  template: TemplateKey;
  onChange: (v: HeroKey | null) => void;
}) {
  const defaultHero = HEROES.find((h) => h.key === TEMPLATES.find((t) => t.key === template)!.defaultHero)!;
  const options = [{ key: null, name: `Template default`, description: `${defaultHero.name} for ${TEMPLATES.find((t) => t.key === template)!.name}` }, ...HEROES];
  return (
    <div role="radiogroup" aria-label="Top of the site" className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {options.map((h) => (
        <button key={h.key ?? "default"} type="button" role="radio" aria-checked={h.key === value} onClick={() => onChange(h.key)} className={cardClass(h.key === value)}>
          <span className="font-semibold">{h.name}</span>
          <span className="text-xs leading-snug text-(--m-ink)/60">{h.description}</span>
        </button>
      ))}
    </div>
  );
}

/** Tiny wireframes of each how-we-met style. */
function StorySketch({ style }: { style: StoryStyle }) {
  const photo = "rounded-[2px] bg-(--m-ink)/20";
  const line = "rounded-[2px] bg-(--m-ink)/15";
  const year = "rounded-[2px] bg-(--m-gold)";
  const sketches: Record<StoryStyle, React.ReactNode> = {
    timeline: (
      <div className="relative flex h-full flex-col justify-center gap-1.5 px-3">
        <span className="absolute inset-y-1.5 left-1/2 w-px bg-(--m-ink)/25" />
        {[false, true].map((flip) => (
          <div key={String(flip)} className={`flex items-center gap-2 ${flip ? "flex-row-reverse" : ""}`}>
            <span className={`h-5 w-5 border-2 border-white bg-(--m-ink)/20 shadow-sm ${flip ? "rotate-3" : "-rotate-3"}`} />
            <span className="flex flex-1 flex-col gap-0.5">
              <span className={`${year} h-1 w-1/3 ${flip ? "self-end" : ""}`} />
              <span className={`${line} h-1 w-2/3 ${flip ? "self-end" : ""}`} />
            </span>
          </div>
        ))}
      </div>
    ),
    list: (
      <div className="flex h-full flex-col justify-center divide-y divide-(--m-ink)/15 px-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="grid grid-cols-[1fr_2fr_1fr] items-center gap-1.5 py-1">
            <span className={`${year} h-1.5`} />
            <span className={`${line} h-1`} />
            <span className={`${photo} h-2.5`} />
          </div>
        ))}
      </div>
    ),
    cards: (
      <div className="grid h-full grid-cols-3 gap-1 p-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex flex-col gap-0.5 bg-white">
            <span className={`${photo} flex-1`} />
            <span className={`${year} h-1 w-2/3`} />
            <span className={`${line} h-1`} />
          </div>
        ))}
      </div>
    ),
    strip: (
      <div className="flex h-full gap-1 overflow-hidden py-2 pl-2">
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className={`${photo} relative w-7 shrink-0`}>
            <span className="absolute right-1 bottom-1 left-1 h-1 rounded-[1px] bg-white/80" />
          </span>
        ))}
      </div>
    ),
    chapters: (
      <div className="grid h-full grid-cols-[1.4fr_1fr] items-center gap-2 p-2">
        <span className={`${photo} h-full`} />
        <span className="flex flex-col gap-1">
          <span className={`${year} h-2 w-4/5`} />
          <span className={`${line} h-1`} />
          <span className={`${line} h-1 w-3/4`} />
        </span>
      </div>
    ),
    simple: (
      <div className="flex h-full flex-col items-center justify-center gap-1.5">
        {[0, 1].map((i) => (
          <span key={i} className="flex w-1/2 flex-col items-center gap-0.5">
            <span className={`${line} h-1 w-1/3`} />
            <span className="h-1.5 w-3/4 rounded-[2px] bg-(--m-ink)/25" />
            <span className={`${line} h-1 w-full`} />
          </span>
        ))}
      </div>
    ),
  };
  return (
    <div aria-hidden className="h-16 overflow-hidden rounded-[4px] bg-(--m-paper)">
      {sketches[style]}
    </div>
  );
}

export function StoryStylePicker({
  value,
  template,
  onChange,
}: {
  /** null = the template's default style. */
  value: StoryStyle | null;
  template: TemplateKey;
  onChange: (v: StoryStyle | null) => void;
}) {
  const templateInfo = TEMPLATES.find((t) => t.key === template)!;
  const defaultStyle = STORY_STYLES.find((s) => s.key === templateInfo.defaultStory)!;
  const options = [
    { key: null, sketch: defaultStyle.key, name: "Template default", description: `${defaultStyle.name} for ${templateInfo.name}` },
    ...STORY_STYLES.map((s) => ({ ...s, sketch: s.key })),
  ];
  return (
    <div role="radiogroup" aria-label="How we met style" className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {options.map((o) => (
        <button key={o.key ?? "default"} type="button" role="radio" aria-checked={o.key === value} onClick={() => onChange(o.key)} className={cardClass(o.key === value)}>
          <StorySketch style={o.sketch} />
          <span className="font-semibold">{o.name}</span>
          <span className="text-xs leading-snug text-(--m-ink)/60">{o.description}</span>
        </button>
      ))}
    </div>
  );
}

/** Full names or first names only on the site (top and footer), shown with the couple's own names. */
export function HeroNamesPicker({
  value,
  names,
  onChange,
}: {
  value: HeroNameStyle;
  names: [string, string];
  onChange: (v: HeroNameStyle) => void;
}) {
  return (
    <div role="radiogroup" aria-label="Names on your site" className="flex flex-wrap gap-2">
      {HERO_NAME_STYLES.map((style) => {
        const selected = style.key === value;
        const a = heroName(names[0], style.key) || "Ada";
        const b = heroName(names[1], style.key) || "Tobi";
        return (
          <button
            key={style.key}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(style.key)}
            className={`flex min-w-0 flex-1 flex-col gap-0.5 rounded-[6px] bg-white px-3 py-2.5 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--m-ink) ${
              selected ? "ring-2 ring-(--m-ink)" : "ring-1 ring-(--m-mist) hover:ring-(--m-ink)/40"
            }`}
          >
            <span className="text-sm font-semibold">{style.name}</span>
            <span className="truncate text-xs text-(--m-ink)/60">
              {a} &amp; {b}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// Where to add content for a section that has nothing to show yet.
const EMPTY_HINTS: Record<string, string> = {
  story: "Nothing to show yet: add entries in Our Story",
  notes: "Nothing to show yet: write your notes in Our Story",
  registry: "Nothing to show yet: add items in Registry",
  gift: "Nothing to show yet: add bank details in Registry",
  asoebi: "Nothing to show yet: add the fabric in Wording",
};

/** Reorder sections by dragging (or the arrow buttons) and switch them on or off. */
export function SectionsEditor({
  value,
  onChange,
  empty = [],
}: {
  value: SectionSetting[];
  onChange: (v: SectionSetting[]) => void;
  /** Sections with no content; they're skipped on the site until they have some. */
  empty?: string[];
}) {
  const [dragging, setDragging] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const info = (id: string) => SECTIONS.find((s) => s.id === id)!;

  const move = (from: number, to: number, announce = true) => {
    if (to < 0 || to >= value.length || from === to) return;
    const next = [...value];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
    if (announce) setAnnouncement(`${info(item.id).name} moved to position ${to + 1} of ${value.length}.`);
  };
  const toggle = (i: number) => {
    const next = value.map((s, j) => (j === i ? { ...s, visible: !s.visible } : s));
    onChange(next);
    setAnnouncement(`${info(value[i].id).name} ${next[i].visible ? "shown" : "hidden"}.`);
  };
  const rsvpHidden = value.some((s) => s.id === "rsvp" && !s.visible);

  const fixedRow = (label: string, note: string) => (
    <li className="flex items-center gap-3 rounded-[6px] border border-dashed border-(--m-mist) bg-(--m-paper) px-3 py-2.5 text-sm text-(--m-ink)/60">
      <span className="w-5" aria-hidden />
      <span className="font-medium">{label}</span>
      <span className="text-xs">{note}</span>
    </li>
  );

  return (
    <div className="flex flex-col gap-2">
      <ul className="flex flex-col gap-1.5">
        {fixedRow("Top of the site", "Always first")}
        {value.map((s, i) => {
          const { name, description } = info(s.id);
          return (
            <li
              key={s.id}
              draggable
              onDragStart={(e) => {
                setDragging(s.id);
                e.dataTransfer.effectAllowed = "move";
                e.dataTransfer.setData("text/plain", s.id);
              }}
              onDragOver={(e) => {
                e.preventDefault();
                // Reorder as the row passes over others, so the list shows where it will land.
                const from = value.findIndex((x) => x.id === dragging);
                if (dragging && from !== i) move(from, i, false);
              }}
              onDrop={(e) => {
                e.preventDefault();
                const at = value.findIndex((x) => x.id === dragging);
                if (dragging) setAnnouncement(`${info(dragging).name} moved to position ${at + 1} of ${value.length}.`);
              }}
              onDragEnd={() => setDragging(null)}
              className={`grid grid-cols-[auto_1fr_auto_auto] items-center gap-3 rounded-[6px] border bg-white px-3 py-2.5 ${
                dragging === s.id ? "border-(--m-ink) opacity-60" : "border-(--m-mist)"
              }`}
            >
              <GripVertical aria-hidden size={18} className="cursor-grab text-(--m-ink)/40 active:cursor-grabbing" />
              <span className={s.visible ? "" : "opacity-50"}>
                <span className={`block text-sm font-semibold ${s.visible ? "" : "line-through decoration-(--m-ink)/40"}`}>{name}</span>
                <span className="block text-xs text-(--m-ink)/60">
                  {s.visible && empty.includes(s.id) ? <span className="text-(--m-coral-deep)">{EMPTY_HINTS[s.id]}</span> : description}
                </span>
              </span>
              <span className="flex gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  aria-label={`Move ${name} up`}
                  disabled={i === 0}
                  onClick={() => move(i, i - 1)}
                  className="border-mist disabled:opacity-30"
                >
                  <ArrowUp aria-hidden className="size-[15px]" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  aria-label={`Move ${name} down`}
                  disabled={i === value.length - 1}
                  onClick={() => move(i, i + 1)}
                  className="border-mist disabled:opacity-30"
                >
                  <ArrowDown aria-hidden className="size-[15px]" />
                </Button>
              </span>
              <Switch size="lg" checked={s.visible} onCheckedChange={() => toggle(i)} aria-label={`Show ${name}`} />
            </li>
          );
        })}
        {fixedRow("Footer", "Always last")}
      </ul>
      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>
      {rsvpHidden && (
        <p className="text-sm text-(--m-coral-deep)">RSVP is hidden, so guests can&apos;t reply on the site. You can still add RSVPs yourself.</p>
      )}
      <p className="text-xs text-(--m-ink)/60">Hidden sections keep their content, so you can bring them back any time.</p>
    </div>
  );
}
