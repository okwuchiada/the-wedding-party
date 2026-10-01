"use client";

import { ArrowRight, Bell } from "lucide-react";
import type { attentionItems } from "@/lib/attention";
import { Button } from "@/components/ui/button";

type Item = ReturnType<typeof attentionItems>[number];

/**
 * What's waiting for the couple, above the tabs. Each item opens its tab.
 * Renders nothing when they're caught up; screen readers hear when it changes.
 */
export default function AttentionBar({ items, onGo }: { items: Item[]; onGo: (tab: Item["tab"]) => void }) {
  return (
    <div aria-live="polite" className="mt-6">
      {items.length > 0 && (
        <section
          aria-label="Needs your attention"
          className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-md border border-gold/60 bg-gold/15 px-4 py-3 text-sm text-ink"
        >
          <span className="flex items-center gap-2 font-semibold">
            <Bell aria-hidden className="size-4" />
            Needs your attention
          </span>
          <ul className="flex flex-wrap items-center gap-x-1 gap-y-1">
            {items.map((item) => (
              <li key={item.tab}>
                <Button type="button" variant="ghost" size="sm" onClick={() => onGo(item.tab)} className="h-auto gap-1.5 px-2.5 py-1 font-medium hover:bg-gold/25">
                  {item.label}
                  <ArrowRight aria-hidden className="size-3.5" />
                </Button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
