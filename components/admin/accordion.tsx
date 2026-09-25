"use client";

import { ChevronDown } from "lucide-react";
import { useId } from "react";

/**
 * One collapsible panel. Closed panels stay mounted (just hidden) so any form
 * fields inside still submit their values.
 */
export function AccordionItem({
  title,
  summary,
  summaryTone = "muted",
  open,
  onToggle,
  children,
}: {
  title: string;
  /** The current choice, shown under the title so closed panels still say what's set. */
  summary: React.ReactNode;
  summaryTone?: "muted" | "warn";
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  const id = useId();
  return (
    <div className={`rounded-[8px] border bg-white transition-colors ${open ? "border-(--m-ink)/30" : "border-(--m-mist)"}`}>
      <h2>
        <button
          type="button"
          id={`${id}-button`}
          aria-expanded={open}
          aria-controls={`${id}-panel`}
          onClick={onToggle}
          className="flex w-full items-center justify-between gap-4 rounded-[8px] px-5 py-4 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--m-ink)"
        >
          <span className="min-w-0">
            <span className="block font-(family-name:--m-display) text-xl font-bold tracking-tight">{title}</span>
            <span className={`mt-0.5 block truncate text-sm ${summaryTone === "warn" ? "text-(--m-coral-deep)" : "text-(--m-ink)/60"}`}>
              {summary}
            </span>
          </span>
          <ChevronDown
            aria-hidden
            size={20}
            className={`shrink-0 text-(--m-ink)/60 transition-transform motion-reduce:transition-none ${open ? "rotate-180" : ""}`}
          />
        </button>
      </h2>
      <div id={`${id}-panel`} role="region" aria-labelledby={`${id}-button`} hidden={!open} className="border-t border-(--m-mist) px-5 pt-4 pb-5">
        {children}
      </div>
    </div>
  );
}
