"use client";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

/**
 * Pick one of a few views, like Pending / Approved / Hidden: a shadcn
 * ToggleGroup (arrow keys move between options) styled as ink pills.
 */
export function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: T; label: string; count?: number }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <ToggleGroup
      type="single"
      aria-label={label}
      value={value}
      // A single toggle group lets you switch the active option off; a view always stays chosen.
      onValueChange={(next) => next && onChange(next as T)}
      className="gap-1 rounded-full border border-border bg-card p-1"
    >
      {options.map((o) => (
        <ToggleGroupItem
          key={o.value}
          value={o.value}
          className="h-9 rounded-full! px-3.5 text-[13px] font-semibold text-muted-foreground hover:bg-accent hover:text-ink data-[state=on]:bg-ink data-[state=on]:text-paper"
        >
          {o.label}
          {o.count !== undefined && <span className="tabular-nums opacity-75">{o.count}</span>}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
