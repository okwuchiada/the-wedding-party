"use client";

import { ChevronDown, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import type { CountryOption } from "@/lib/countries";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { TEXT_ACTION } from "@/components/admin/form-styles";
import { Label } from "@/components/ui/label";

/** 🇳🇬 from "NG"; purely decorative. */
const flag = (code: string) => String.fromCodePoint(...[...code].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));

const CHIP_LIMIT = 12;

/** A continent's tick box: checked when all its countries are, "mixed" when some are. */
function ContinentBox({ checked, mixed, onChange, label }: { checked: boolean; mixed: boolean; onChange: () => void; label: string }) {
  return <Checkbox checked={mixed ? "indeterminate" : checked} onCheckedChange={onChange} aria-label={label} />;
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
        <p className="text-sm text-muted-foreground">Everyone can view your site, wherever they are.</p>
      ) : (
        <div className="flex flex-col gap-2">
          <p className="text-sm text-muted-foreground">
            Only visitors in {chosen.length === 1 ? "this country" : `these ${chosen.length} countries`} can view your site:
          </p>
          <ul className="flex flex-wrap gap-1.5">
            {visibleChips.map((c) => (
              <li key={c.code} className="flex items-center gap-1 rounded-full border border-border bg-card py-0.5 pr-1 pl-2.5 text-xs">
                <span aria-hidden>{flag(c.code)}</span>
                {c.name}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => toggle([c.code], false)}
                  aria-label={`Remove ${c.name}`}
                  className="size-5 text-muted-foreground hover:bg-border hover:text-ink"
                >
                  <X aria-hidden className="size-3" />
                </Button>
              </li>
            ))}
            {chosen.length > CHIP_LIMIT && (
              <li>
                <Button type="button" variant="link" size="xs" onClick={() => setShowAllChips((v) => !v)} className="h-auto px-2 py-0.5 underline">
                  {showAllChips ? "Show fewer" : `+${chosen.length - CHIP_LIMIT} more`}
                </Button>
              </li>
            )}
          </ul>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          variant="outline"
          size="sm"
        >
          {open ? "Done choosing" : chosen.length ? "Change countries" : "Limit to certain countries"}
        </Button>
        {chosen.length > 0 && (
          <Button type="button" onClick={() => setSelected(new Set())} variant="link" size="xs" className={TEXT_ACTION}>
            Allow everyone
          </Button>
        )}
      </div>

      {open && (
        <div className="flex flex-col rounded-md border border-border bg-card">
          <Label className="gap-2 border-b border-border px-3 py-1.5 font-normal">
            <Search aria-hidden size={16} className="text-muted-foreground" />
            <span className="sr-only">Search countries</span>
            <Input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search countries, e.g. Ghana or UK"
              className="h-8 min-w-0 flex-1 border-0 bg-transparent px-1 shadow-none"
            />
          </Label>
          <ul className="max-h-96 overflow-y-auto">
            {continents.map(([continent, list]) => {
              const shown = list.filter(matches);
              if (shown.length === 0) return null;
              const codes = list.map((c) => c.code);
              const count = codes.filter((code) => selected.has(code)).length;
              // Searching opens every group that has a match.
              const isOpen = Boolean(q) || expanded.has(continent);
              return (
                <li key={continent} className="border-b border-border last:border-0">
                  <div className="flex items-center gap-3 px-3 py-2.5">
                    {!q && (
                      <ContinentBox
                        checked={count === codes.length}
                        mixed={count > 0 && count < codes.length}
                        onChange={() => toggle(codes, count < codes.length)}
                        label={`All of ${continent}`}
                      />
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => toggleExpanded(continent)}
                      aria-expanded={isOpen}
                      className="h-auto flex-1 justify-between gap-2 rounded-md px-1 py-0.5 text-left text-sm font-semibold hover:bg-transparent"
                    >
                      <span>
                        {continent}
                        <span className="ml-2 text-xs font-normal text-muted-foreground">
                          {count ? `${count} of ${codes.length} chosen` : `${codes.length} ${codes.length === 1 ? "country" : "countries"}`}
                        </span>
                      </span>
                      {!q && <ChevronDown aria-hidden size={16} className={`text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />}
                    </Button>
                  </div>
                  {isOpen && (
                    <ul className="grid grid-cols-1 gap-x-4 pb-2 pl-10 pr-3 sm:grid-cols-2">
                      {shown.map((c) => (
                        <li key={c.code}>
                          <Label className="gap-2 py-1 font-normal">
                            <Checkbox checked={selected.has(c.code)} onCheckedChange={(v) => toggle([c.code], v === true)} />
                            <span aria-hidden>{flag(c.code)}</span>
                            {c.name}
                          </Label>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
            {q && continents.every(([, list]) => !list.some(matches)) && (
              <li className="px-3 py-3 text-sm text-muted-foreground">No country matches &ldquo;{query}&rdquo;.</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
