"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

const DEBOUNCE_MS = 350;

/** Filters live as you type (debounced) or as soon as a filter like the status select changes. */
export function SearchForm({ q, placeholder, children }: { q?: string; placeholder: string; children?: React.ReactNode }) {
  const formRef = useRef<HTMLFormElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

  const submitNow = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!formRef.current) return;

    const data = new FormData(formRef.current);
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
      <input
        name="q"
        defaultValue={q}
        placeholder={placeholder}
        onChange={onTextChange}
        className="min-w-60 flex-1 border border-(--m-mist) bg-white px-3 py-2 text-sm outline-none focus:border-(--m-ink)/50"
      />
      {/* Non-text filters (e.g. a status select) apply immediately, no debounce. */}
      <div onChange={submitNow} className="contents">
        {children}
      </div>
      <button type="submit" className="border rounded-full border-(--m-ink)/25 px-4 py-2 text-xs font-medium hover:border-(--m-ink)">
        Search
      </button>
    </form>
  );
}
