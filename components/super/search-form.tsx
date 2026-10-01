"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const DEBOUNCE_MS = 350;

/** Lets a filter inside the form apply itself straight away, with its new value. */
const SubmitContext = createContext<(overrides?: Record<string, string>) => void>(() => {});

/** Filters live as you type (debounced) or as soon as a filter like the status select changes. */
export function SearchForm({ q, placeholder, children }: { q?: string; placeholder: string; children?: React.ReactNode }) {
  const formRef = useRef<HTMLFormElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

  const submitNow = (overrides: Record<string, string> = {}) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!formRef.current) return;

    const data = new FormData(formRef.current);
    for (const [key, value] of Object.entries(overrides)) data.set(key, value);
    const params = new URLSearchParams(searchParams);
    for (const key of data.keys()) params.delete(key);
    for (const [key, value] of data.entries()) {
      if (value) params.set(key, String(value));
    }
    // A new search always starts back at page 1.
    params.delete("page");

    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  };

  const onTextChange = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(submitNow, DEBOUNCE_MS);
  };

  return (
    <form
      ref={formRef}
      onSubmit={(e) => {
        e.preventDefault();
        submitNow();
      }}
      className="flex flex-wrap gap-2"
    >
      <Input
        name="q"
        aria-label="Search"
        defaultValue={q}
        placeholder={placeholder}
        onChange={onTextChange}
        className="h-auto w-auto min-w-60 flex-1 py-2"
      />
      {/* Non-text filters (e.g. a status select) apply immediately, no debounce. */}
      <SubmitContext value={submitNow}>{children}</SubmitContext>
      <Button type="submit" variant="outline" size="sm">
        Search
      </Button>
    </form>
  );
}

// Radix Select can't hold an empty value, so "all" stands in for "no filter".
const ALL = "__all";

/** A filter for SearchForm: submits `name` ("" for all) and applies as soon as it changes. */
export function FilterSelect({
  name,
  defaultValue = "",
  allLabel,
  label,
  options,
}: {
  name: string;
  defaultValue?: string;
  /** The "no filter" choice, like "All statuses". Leave out for a menu that always has a value, like sorting. */
  allLabel?: string;
  /** What the menu is for, read out by screen readers; defaults to allLabel. */
  label?: string;
  options: { value: string; label: string }[];
}) {
  const submit = useContext(SubmitContext);
  const [value, setValue] = useState(defaultValue || (allLabel ? ALL : options[0]?.value ?? ALL));
  const real = value === ALL ? "" : value;

  return (
    <>
      <input type="hidden" name={name} value={real} />
      <Select
        value={value}
        onValueChange={(next) => {
          setValue(next);
          submit({ [name]: next === ALL ? "" : next });
        }}
      >
        <SelectTrigger aria-label={label ?? allLabel} className="h-auto py-2 data-[size=default]:h-auto">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {allLabel && <SelectItem value={ALL}>{allLabel}</SelectItem>}
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  );
}
