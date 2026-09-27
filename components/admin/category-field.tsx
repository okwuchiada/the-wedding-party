"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue } from "@/components/ui/select";

// Common registry groupings, offered after the couple's own categories.
const SUGGESTED = ["Home", "Kitchen", "Bedroom & bath", "Appliances", "Experiences", "Honeymoon", "Cash funds"];
const NEW = "__new";

const fieldClass = "h-auto py-2 text-ink data-[size=default]:h-auto";

/**
 * Pick a registry category from the couple's existing ones and common suggestions,
 * or add a new one. Submits the choice as `name`; a typed category that matches an
 * existing one (ignoring case) reuses it, so the guest registry doesn't get "Kitchen"
 * and "kitchen" as separate tabs.
 */
export default function CategoryField({
  name,
  defaultValue = "",
  existing,
}: {
  name: string;
  defaultValue?: string;
  /** Categories already used on this registry, most relevant first. */
  existing: string[];
}) {
  const seen = new Set<string>();
  const options = [...(defaultValue ? [defaultValue] : []), ...existing, ...SUGGESTED].filter((c) => {
    const key = c.trim().toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  const own = new Set([defaultValue, ...existing].map((c) => c.trim().toLowerCase()).filter(Boolean));

  const [selected, setSelected] = useState(defaultValue || "");
  const [custom, setCustom] = useState("");
  const adding = selected === NEW;
  const match = options.find((o) => o.toLowerCase() === custom.trim().toLowerCase());
  const value = adding ? (match ?? custom.trim()) : selected;

  return (
    <div className="flex flex-col gap-1.5 text-xs text-ink/60">
      <Label htmlFor={`${name}-select`} className="text-xs font-normal">
        Category
      </Label>
      <input type="hidden" name={name} value={value} />
      <Select value={selected} onValueChange={setSelected}>
        <SelectTrigger id={`${name}-select`} className={`w-full ${fieldClass}`}>
          <SelectValue placeholder="Choose a category" />
        </SelectTrigger>
        <SelectContent>
          {options.some((o) => own.has(o.toLowerCase())) && (
            <SelectGroup>
              <SelectLabel>Your categories</SelectLabel>
              {options.filter((o) => own.has(o.toLowerCase())).map((o) => (
                <SelectItem key={o} value={o}>
                  {o}
                </SelectItem>
              ))}
            </SelectGroup>
          )}
          <SelectGroup>
            <SelectLabel>Suggestions</SelectLabel>
            {options.filter((o) => !own.has(o.toLowerCase())).map((o) => (
              <SelectItem key={o} value={o}>
                {o}
              </SelectItem>
            ))}
          </SelectGroup>
          <SelectSeparator />
          <SelectItem value={NEW}>Add a new category…</SelectItem>
        </SelectContent>
      </Select>
      {adding && (
        <>
          <Input
            aria-label="New category name"
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            placeholder="e.g. Garden"
            maxLength={40}
            autoFocus
            className={fieldClass}
          />
          {match && custom.trim() && match !== custom.trim() && (
            <span className="text-[11px] text-ink/55">You already have &ldquo;{match}&rdquo;, so it will go there.</span>
          )}
        </>
      )}
    </div>
  );
}
