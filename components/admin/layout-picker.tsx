"use client";

import { ArrowDown, ArrowUp, GripVertical } from "lucide-react";
import { useState } from "react";
import {
  HERO_NAME_STYLES,
  HEROES,
  heroName,
  SECTIONS,
  TEMPLATES,
  type HeroKey,
  type HeroNameStyle,
  type SectionSetting,
  type TemplateKey,
} from "@/lib/layouts";

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
                <button
                  type="button"
                  aria-label={`Move ${name} up`}
                  disabled={i === 0}
                  onClick={() => move(i, i - 1)}
                  className="grid size-8 place-items-center rounded-full border border-(--m-mist) hover:border-(--m-ink) disabled:opacity-30"
                >
                  <ArrowUp aria-hidden size={15} />
                </button>
                <button
                  type="button"
                  aria-label={`Move ${name} down`}
                  disabled={i === value.length - 1}
                  onClick={() => move(i, i + 1)}
                  className="grid size-8 place-items-center rounded-full border border-(--m-mist) hover:border-(--m-ink) disabled:opacity-30"
                >
                  <ArrowDown aria-hidden size={15} />
                </button>
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={s.visible}
                aria-label={`Show ${name}`}
                onClick={() => toggle(i)}
                className={`relative h-6 w-11 rounded-full transition-colors motion-reduce:transition-none ${s.visible ? "bg-(--m-emerald)" : "bg-(--m-mist)"}`}
              >
                <span
                  aria-hidden
                  className={`absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow transition-transform motion-reduce:transition-none ${s.visible ? "translate-x-5" : ""}`}
                />
              </button>
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
