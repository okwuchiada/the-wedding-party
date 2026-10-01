"use client";

import { Accordion, AccordionContent, AccordionItem as UiAccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

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
  return (
    <Accordion type="single" collapsible value={open ? "panel" : ""} onValueChange={onToggle}>
      <UiAccordionItem
        value="panel"
        className={cn("rounded-lg border bg-white transition-colors last:border-b", open ? "border-ink/30" : "border-mist")}
      >
        <AccordionTrigger className="items-center rounded-lg px-5 py-4 hover:no-underline focus-visible:ring-ink/40 [&>svg]:size-5 [&>svg]:translate-y-0 [&>svg]:text-ink/60">
          <span className="min-w-0">
            <span className="block font-(family-name:--m-display) text-xl font-bold tracking-tight">{title}</span>
            <span className={cn("mt-0.5 block truncate text-sm font-normal", summaryTone === "warn" ? "text-coral-deep" : "text-ink/60")}>
              {summary}
            </span>
          </span>
        </AccordionTrigger>
        {/* forceMount keeps closed panels in the form; Radix hides them. */}
        <AccordionContent forceMount className="border-t border-mist px-5 pt-4 pb-5">
          {children}
        </AccordionContent>
      </UiAccordionItem>
    </Accordion>
  );
}
