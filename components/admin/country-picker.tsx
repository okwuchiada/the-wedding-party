"use client";

import { ChevronDown, Search, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CountryOption } from "@/lib/countries";

/** 🇳🇬 from "NG"; purely decorative. */
const flag = (code: string) => String.fromCodePoint(...[...code].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));

const CHIP_LIMIT = 12;

/** A continent's tick box: checked when all its countries are, "mixed" when some are. */
function ContinentBox({ checked, mixed, onChange, label }: { checked: boolean; mixed: boolean; onChange: () => void; label: string }) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = mixed;
  }, [mixed]);
  return <input ref={ref} type="checkbox" checked={checked} onChange={onChange} aria-label={label} className="size-4" />;
}

/**
 * Pick the countries allowed to view the guest site, by continent or one by one,
 * with search. Submits the chosen ISO codes (e.g. "NG,GH,GB") as `name`.
 */
export default function CountryPicker({ name, countries, defaultValue }: { name: string; countries: CountryOption[]; defaultValue: string[] }) {
  const [selected, setSelected] = useState(() => new Set(defaultValue));
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [showAllChips, setShowAllChips] = useState(false);

  const byCode = useMemo(() => new Map(countries.map((c) => [c.code, c])), [countries]);
  const continents = useMemo(() => {
    const groups = new Map<string, CountryOption[]>();
    for (const c of countries) groups.set(c.continent, [...(groups.get(c.continent) ?? []), c]);
    return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [countries]);

  const q = query.trim().toLowerCase();
  const matches = (c: CountryOption) =>
    !q || c.name.toLowerCase().includes(q) || c.code.toLowerCase() === q || c.aliases.some((a) => a.toLowerCase().includes(q));

  const toggle = (codes: string[], on: boolean) =>
    setSelected((prev) => {
      const next = new Set(prev);
      for (const code of codes) {
        if (on) next.add(code);
        else next.delete(code);
      }
      return next;
    });
  const toggleExpanded = (continent: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(continent)) next.delete(continent);
      else next.add(continent);
      return next;
    });

  const chosen = [...selected].map((code) => byCode.get(code)).filter((c): c is CountryOption => Boolean(c)).sort((a, b) => a.name.localeCompare(b.name));
  const visibleChips = showAllChips ? chosen : chosen.slice(0, CHIP_LIMIT);

  return (
    <div className="flex flex-col gap-3">
      <input type="hidden" name={name} value={chosen.map((c) => c.code).join(",")} />

      {chosen.length === 0 ? (
        <p className="text-sm text-foreground/70">Everyone can view your site, wherever they are.</p>
      ) : (
        <div className="flex flex-col gap-2">
          <p className="text-sm text-foreground/70">
            Only visitors in {chosen.length === 1 ? "this country" : `these ${chosen.length} countries`} can view your site:
          </p>
          <ul className="flex flex-wrap gap-1.5">
            {visibleChips.map((c) => (
              <li key={c.code} className="flex items-center gap-1 rounded-full border border-(--m-mist) bg-white py-0.5 pr-1 pl-2.5 text-xs">
                <span aria-hidden>{flag(c.code)}</span>
                {c.name}
                <button
                  type="button"
                  onClick={() => toggle([c.code], false)}
                  aria-label={`Remove ${c.name}`}
                  className="grid size-5 place-items-center rounded-full text-foreground/50 hover:bg-(--m-mist) hover:text-foreground"
                >
                  <X aria-hidden size={12} />
                </button>
              </li>
            ))}
            {chosen.length > CHIP_LIMIT && (
              <li>
                <button type="button" onClick={() => setShowAllChips((v) => !v)} className="px-2 py-0.5 text-xs underline underline-offset-4">
                  {showAllChips ? "Show fewer" : `+${chosen.length - CHIP_LIMIT} more`}
                </button>
              </li>
            )}
          </ul>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="rounded-full border border-(--m-ink)/25 px-4 py-2 text-xs font-medium hover:border-(--m-ink)"
        >
          {open ? "Done choosing" : chosen.length ? "Change countries" : "Limit to certain countries"}
        </button>
        {chosen.length > 0 && (
          <button type="button" onClick={() => setSelected(new Set())} className="rounded-full px-4 py-2 text-xs font-medium hover:bg-(--m-mist)">
            Allow everyone
          </button>
        )}
      </div>

      {open && (
        <div className="flex flex-col rounded-md border border-(--m-mist) bg-white">
          <label className="flex items-center gap-2 border-b border-(--m-mist) px-3 py-2.5">
            <Search aria-hidden size={16} className="text-foreground/45" />
            <span className="sr-only">Search countries</span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search countries, e.g. Ghana or UK"
              className="min-w-0 flex-1 bg-transparent text-sm outline-none p-0.5 "
            />
          </label>
          <ul className="max-h-96 overflow-y-auto">
            {continents.map(([continent, list]) => {
              const shown = list.filter(matches);
              if (shown.length === 0) return null;
              const codes = list.map((c) => c.code);
              const count = codes.filter((code) => selected.has(code)).length;
              // Searching opens every group that has a match.
              const isOpen = Boolean(q) || expanded.has(continent);
              return (
                <li key={continent} className="border-b border-(--m-mist) last:border-0">
                  <div className="flex items-center gap-3 px-3 py-2.5">
                    {!q && (
                      <ContinentBox
                        checked={count === codes.length}
                        mixed={count > 0 && count < codes.length}
                        onChange={() => toggle(codes, count < codes.length)}
                        label={`All of ${continent}`}
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => toggleExpanded(continent)}
                      aria-expanded={isOpen}
                      className="flex flex-1 items-center justify-between gap-2 text-left text-sm font-semibold"
                    >
                      <span>
                        {continent}
                        <span className="ml-2 text-xs font-normal text-foreground/55">
                          {count ? `${count} of ${codes.length} chosen` : `${codes.length} ${codes.length === 1 ? "country" : "countries"}`}
                        </span>
                      </span>
                      {!q && <ChevronDown aria-hidden size={16} className={`text-foreground/50 transition-transform ${isOpen ? "rotate-180" : ""}`} />}
                    </button>
                  </div>
                  {isOpen && (
                    <ul className="grid grid-cols-1 gap-x-4 pb-2 pl-10 pr-3 sm:grid-cols-2">
                      {shown.map((c) => (
                        <li key={c.code}>
                          <label className="flex items-center gap-2 py-1 text-sm">
                            <input type="checkbox" checked={selected.has(c.code)} onChange={(e) => toggle([c.code], e.target.checked)} className="size-4" />
                            <span aria-hidden>{flag(c.code)}</span>
                            {c.name}
                          </label>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
            {q && continents.every(([, list]) => !list.some(matches)) && (
              <li className="px-3 py-3 text-sm text-foreground/60">No country matches &ldquo;{query}&rdquo;.</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
